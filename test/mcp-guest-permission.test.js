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
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
// [全局修复 2026-11-16] Windows 无 AF_UNIX 文件 socket（listen 一律
// EACCES，Node v24 实测 5 种路径形态全败），改用命名管道；POSIX 维持
// tmpdir 文件 socket。先例：round-627-strategic-restraint-mcp.test.js:88、
// knowledge-graph-mcp-state-round593.test.js:72（均为 [v6.8.85 审计修复]）。
const SOCK = process.platform === 'win32'
  ? `\\\\.\\pipe\\hf-perm-test-${process.pid}`
  : path.join(os.tmpdir(), `hf-perm-test-${process.pid}.sock`);
// [全局修复 2026-11-16] server 侧 token：mcp-server.js 缺 token 时
// fail-close 拒绝启动（进程加载期 exit 1），净室（无 .env）下单跑必崩。
// 与 mcp-auth-e2e-real.test.js:65 同族——自生成测试 token 经 env 传入。
// 注意不设 HEARTFLOW_MCP_TOKEN（优先级更高，会让 e2e-real 的匿名探测失真）。
const TEST_TOKEN = 'test-' + crypto.randomBytes(24).toString('hex');

const WRITE_TOOLS = [
  'heartflow_memory_write_control',
  'heartflow_memory_eraser',
  'heartflow_decision_decide',
  'heartflow_self_heal',
  // [r298] memoryIndex 写工具（WRITE_TOOLS 收口新增项，同步进抽样清单）
  'heartflow_memory_index_write',
  // [r314] self_benchmark 的 assess 落盘 / safe_fetch 出网（WRITE_TOOLS 收口新增项，同步进抽样清单）
  'heartflow_self_benchmark',
  'heartflow_safe_fetch',
  // [r457] 置信度反馈写入（recordFeedback/updateFromFeedback/recalibrate 改常驻
  // 校准器状态并落盘 data/confidence-calibration.json，同步进抽样清单）
  'heartflow_confidence_feedback',
];

// [AUDIT-FIX 2026-11-23] heartflow_memory_index_read 从"guest 应放行的只读工具"
// 移入"guest 应被拦的敏感读工具"。原因：它读 data/memory-index.json，除索引元
// 数据外还含用户身份/反馈/项目上下文/未解决问题列表，与 GUEST_DENY_TOOLS 的筛选
// 标准（用户私密内容）一致。此前本文件把它当只读工具抽样是固化了旧策略。
// round-298-memory-index-wiring.test.js 断言"guest 测试抽样含该读工具"——字符串
// 在本文件中仍然存在（在下面的 GUEST_DENIED_READ_TOOLS 里），该断言不受影响。
const GUEST_DENIED_READ_TOOLS = [
  // [AUDIT-FIX 2026-11-23] 由 READ_TOOLS 移入（理由见上）
  'heartflow_memory_index_read',
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
  if (tool === 'heartflow_memory_index_write') return { action: 'addSkill', payload: { name: 'perm-test-probe', level: 'probe' } };
  if (tool === 'heartflow_self_benchmark') return { action: 'assess' };
  if (tool === 'heartflow_safe_fetch') return { action: 'preflight', text: 'perm-test-probe' };
  if (tool === 'heartflow_memory_index_read') return { action: 'healthCheck' };
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
    if (process.platform !== 'win32' && fs.existsSync(SOCK)) {
      await new Promise(r => setTimeout(r, 1500)); // 等 listen 回调完成
      return;
    }
    // [全局修复 2026-11-16] win32 命名管道无文件形态，existsSync 恒 false；
    // 以「建连成功」为就绪信号（同 round-627:138-144 先例）。
    if (process.platform === 'win32') {
      const ok = await new Promise(res => {
        const c = net.createConnection(SOCK, () => { c.end(); res(true); });
        c.on('error', () => res(false));
      });
      if (ok) return;
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
      cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore'],
      // [全局修复 2026-11-16] 传入测试 token，避免净室（无 .env）下 server
      // fail-close 拒启；不设 HEARTFLOW_MCP_TOKEN（更高优先级，会干扰
      // mcp-auth-e2e-real 的匿名提权探测）。
      env: { ...process.env, MCP_HEARTFLOW_KEY: TEST_TOKEN },
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

    // [AUDIT-FIX 2026-11-23] 敏感读工具对 guest 必须被拦（与 READ_TOOLS 相反断言）。
    // 这些工具读的是用户私密内容（记忆索引里的画像/未解决问题等），不是调用方
    // 当次传入的文本，所以匿名不应可读。
    for (const tool of GUEST_DENIED_READ_TOOLS) {
      try {
        const r = await callTool(tool, argsFor(tool));
        const res = r.result || {};
        const text = res.content && res.content[0] ? res.content[0].text : '';
        if (res.isError === true && /权限不足/.test(text)) {
          results.push({ name: tool, ok: true, detail: '敏感读工具 guest 已拦截' });
        } else {
          results.push({ name: tool, ok: false, detail: '敏感读工具对 guest 放行了（回归）' });
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
