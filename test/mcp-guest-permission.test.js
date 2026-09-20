// MCP guest 写权限拦截回归测试
//
// 背景（2026-09-20 审计发现）：tools/call 的三层权限模型原本被写成
// switch 里两个 case 标签之间的裸块（无自己的 case 标签），前一个 case
// 已 return，因此整段 100% 是死代码——guest 拦截从未生效。本测试用真实的
// Unix socket 起一个 MCP 实例，端到端验证 guest 是否真的被拦。
//
// 关键：不能只测"白名单里有没有工具名"——那正是上次误判的来源
// （名字对但整段代码不可达）。必须实测协议层行为。
//
// 注意：harness 的 async 测试是"登记后异步结算"，module.exports 的 fn
// 返回时若 Promise 未结算，后续用例会在 socket 就绪前跑。所以本文件
// 不用 test() 注册 async 用例，而是在 fn 返回前自己串行 await 完所有
// 断言，再用同步 test() 登记结果。
const path = require('path');
const net = require('net');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOCK = path.join(os.tmpdir(), `hf-perm-test-${process.pid}.sock`);

const WRITE_TOOLS = [
  'heartflow_memory_write_control',
  'heartflow_memory_eraser',
  'heartflow_decision_decide',
  'heartflow_self_heal',
];

const READ_TOOLS = [
  'heartflow_think',
  'heartflow_check_output',
];

function argsFor(tool) {
  if (tool === 'heartflow_self_heal') return { context: 'test' };
  if (tool === 'heartflow_decision_decide') return { task: 't', options: [] };
  if (tool === 'heartflow_think') return { input: 'test' };
  if (tool === 'heartflow_check_output') return { text: 'test' };
  return { action: 'stats' };
}

function callTool(name, args) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection(SOCK, () => {
      s.write(JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name, arguments: args }
      }) + '\n');
    });
    let buf = '';
    const timer = setTimeout(() => { s.destroy(); reject(new Error('timeout')); }, 20000);
    s.on('data', d => {
      buf += d.toString();
      if (buf.includes('\n')) {
        clearTimeout(timer);
        try { resolve(JSON.parse(buf.trim())); } catch (e) { reject(e); }
        s.destroy();
      }
    });
    s.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

async function waitForSocket(proc, deadlineMs) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new Error(`MCP 进程提前退出 code=${proc.exitCode}`);
    if (fs.existsSync(SOCK)) {
      await new Promise(r => setTimeout(r, 1500)); // 等 listen 回调完成
      return;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(`MCP socket 未在 ${deadlineMs}ms 内就绪`);
}

module.exports = function ({ test }) {
  let proc = null;
  let setupError = null;
  const results = [];   // { name, ok, detail }
  let started = false;

  // 返回一个 Promise：_mount.js 不 await 它，但 harness.summarize() 会
  // 等 pending 队列，所以把整个流程挂到一个永不 reject 的 Promise 上。
  const flow = (async () => {
    try { fs.unlinkSync(SOCK); } catch (_) {}
    proc = spawn('node', [path.join(ROOT, 'src/mcp-server.js'), '--socket', SOCK], {
      cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore']
    });
    proc.on('error', e => { setupError = e.message; });
    await waitForSocket(proc, 25000);
    started = true;

    for (const tool of WRITE_TOOLS) {
      try {
        const r = await callTool(tool, argsFor(tool));
        const res = r.result || {};
        const text = res.content && res.content[0] ? res.content[0].text : '';
        if (res.isError !== true) {
          results.push({ name: tool, ok: false, detail: `guest 被放行（isError=${res.isError}）——权限拦截失效` });
        } else if (!/权限不足/.test(text)) {
          results.push({ name: tool, ok: false, detail: `isError 但非权限原因: ${text.slice(0, 100)}` });
        } else {
          results.push({ name: tool, ok: true, detail: 'guest 已拦截' });
        }
      } catch (e) {
        results.push({ name: tool, ok: false, detail: e.message });
      }
    }

    for (const tool of READ_TOOLS) {
      try {
        const r = await callTool(tool, argsFor(tool));
        const res = r.result || {};
        const text = res.content && res.content[0] ? res.content[0].text : '';
        if (res.isError === true && /权限不足/.test(text)) {
          results.push({ name: tool, ok: false, detail: '只读工具被 guest 拦截误伤' });
        } else {
          results.push({ name: tool, ok: true, detail: '只读工具正常放行' });
        }
      } catch (e) {
        results.push({ name: tool, ok: false, detail: e.message });
      }
    }
  })().catch(e => { setupError = e.message; });

  // 把整个异步流程登记为 harness 的一个 pending 项，summarize() 会等它
  test('MCP guest 权限拦截端到端', () => flow.then(() => {
    if (!started) throw new Error(`MCP 实例启动失败: ${setupError}`);
    for (const r of results) {
      if (!r.ok) throw new Error(`${r.name}: ${r.detail}`);
    }
  }));

  // 单独登记每个工具的判定结果（便于失败时定位到具体工具）
  flow.then(() => {
    if (!started) return;
    for (const r of results) test(`  ├─ ${r.name}`, () => { if (!r.ok) throw new Error(r.detail); });
  });

  // teardown 也挂在流程末尾
  flow.then(() => {
    if (proc) { proc.kill(); proc = null; }
    try { fs.unlinkSync(SOCK); } catch (_) {}
  });
};
