/**
 * 测试：MCP 三级权限模型真实生效（v6.7.72，心虫 decision.decide 0.92）
 *
 * 来源：第 35 轮心虫选「黑盒测 MCP 鉴权」（0.92）。
 *
 * 一、发现的真 bug：admin 升级是死代码（已修）
 *
 * 黑盒测试发现：用**正确 token** 调四个写工具
 * （memory_write_control / memory_eraser / decision_decide / self_heal）
 * 全部返回"权限不足：guest 角色不可写"。
 *
 * 根因：`handleRequest(request, ...)` 的第一个参数是
 * **JSON-RPC 消息对象**（{id, method, params}），不是 HTTP request。
 * 原实现读 `request.headers?.authorization`：
 *   request.headers → undefined → token 恒为 '' → role 恒为 'guest'
 *
 * 而 HTTP 层（4671 行）用正确的 `req.headers` 做鉴权，
 * 所以**读工具正常通过、写工具全部被拦**——症状是"能读不能写"。
 *
 * 这正是 AGENTS.md 注释警告过的模式："曾被改成两个 case 标签之间的
 * 裸块，变成不可达死代码而所有单测全绿"。前一次修法（移入 case 内）
 * 只修好了"块可达"，没修"变量取错"——**单测仍然全绿，
 * 因为没有任何测试真的用 HTTP 头调过写工具**。
 *
 * 二、修复
 *   1. handleRequest 增加第三个参数 httpHeaders，HTTP 层传 req.headers
 *   2. 角色判定从 httpHeaders 读 authorization / OID
 *   3. stdio 模式（本地管道，无 HTTP 身份）显式视为受信 → admin
 *
 * 三、验证要点：必须走真实 HTTP，不能单元测
 *
 * 单测之所以抓不到，是因为它直接调 handler（没有 HTTP 层）。
 * 本测试必须真的 POST 到 http://127.0.0.1:8588/mcp 才有效。
 * 8588 不在线时跳过——但那意味着这个 bug 可能再次发生而没人知道。
 */
const path = require('path');
const cp = require('child_process');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const fs = require('fs');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

const TOKEN = (() => {
  try {
    return fs.readFileSync(path.join(HF, '.env'), 'utf8')
      .match(/MCP_HEARTFLOW_KEY=(.+)/)[1].trim();
  } catch (_) { return null; }
})();

/** 真实 HTTP 调用，完全控制请求头 */
function mcpCall(name, args, auth, extraHeaders) {
  const script = `
    const http = require('http');
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: ${JSON.stringify(name)}, arguments: ${JSON.stringify(args)} } });
    const headers = { 'Content-Type': 'application/json' };
    const auth = ${JSON.stringify(auth || null)};
    if (auth) headers['Authorization'] = auth;
    const extra = ${JSON.stringify(extraHeaders || {})};
    Object.assign(headers, extra);
    const req = http.request({ host: '127.0.0.1', port: 8588, path: '/mcp', method: 'POST', headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let verdict;
        try {
          const j = JSON.parse(d);
          const errMsg = j.error ? String(j.error.message || j.error) : '';
          // 必须按**内容**判定，不能只看有没有 error：
          //   鉴权失败  → "Invalid or missing Bearer token"
          //   guest拦截 → "权限不足"
          //   业务校验  → "context 是必填参数"（鉴权已通过，只是参数不对）
          const isAuthFail = /token|Unauthorized|authoriz/i.test(errMsg);
          if (isAuthFail) verdict = 'UNAUTH:' + errMsg.slice(0, 45);
          else if (errMsg.includes('权限不足')) verdict = 'GUEST_BLOCKED:' + errMsg.slice(0, 50);
          else if (errMsg) verdict = 'TOOLERR:' + errMsg.slice(0, 60);
          else if (j.result && j.result.isError) verdict = 'TOOLERR:' + String(j.result.content[0].text).slice(0, 60);
          else verdict = 'OK';
        } catch (e) { verdict = 'HTTP' + res.statusCode + ':UNPARSED'; }
        console.log(JSON.stringify({ status: res.statusCode, verdict }));
      });
    });
    req.on('error', e => console.log(JSON.stringify({ status: 0, verdict: 'CONNFAIL:' + e.message })));
    req.end(payload);
  `;
  const r = cp.spawnSync('node', ['-e', script], { encoding: 'utf8', timeout: 60000 });
  try { return JSON.parse((r.stdout || '').trim()); } catch (_) { return { status: 0, verdict: 'PARSEFAIL' }; }
}

// 探活（鉴权通过 + 读工具正常 = 环境可用）
const alive = (() => {
  const r = mcpCall('heartflow_gate', { text: 'test' }, 'Bearer ' + TOKEN, {});
  return r.status === 200 && (r.verdict === 'OK' || r.verdict.startsWith('TOOLERR'));
})();

if (!alive) {
  console.log('\n⚠️  8588 不在线或无有效 token，跳过 HTTP 鉴权测试。');
  console.log('    这意味着 v6.7.72 修掉的"admin 死代码"bug 无法在本环境验证。');
  console.log('    上线前请手动确认：cd ' + HF + ' && node src/mcp-server.js --port 8588');
  process.exit(0);
}

console.log('\n[写工具：正确 token 必须放行]');

const WRITES = [
  ['heartflow_memory_write_control', { action: 'status' }],
  // memory_eraser 需要 context 参数——鉴权通过后会进到参数校验，
  // 返回 "context 是必填参数" 也算鉴权放行的证据（此前是 guest 拦截）。
  ['heartflow_memory_eraser', { action: 'preview', context: '__test_probe__' }],
  ['heartflow_decision_decide', { task: 't', options: [
    { label: 'a', feasibility: 0.9, consequence_value: 0.9, risk: 0.1, confidence: 0.9 }] }],
  ['heartflow_self_heal', { action: 'status' }],
];

for (const [name, args] of WRITES) {
  t(`${name} → 鉴权放行（不得再是 guest 拦截）`, () => {
    const r = mcpCall(name, args, 'Bearer ' + TOKEN, {});
    // 鉴权通过的两种表现：OK，或进到业务层参数校验（TOOLERR 但不含"权限不足"）
    const passed = r.verdict === 'OK'
      || (r.verdict.startsWith('TOOLERR') && !r.verdict.includes('权限不足'));
    assert.ok(passed,
      `实际 ${r.verdict}。若含"权限不足" → admin 升级又变死代码了`);
  });
}

console.log('\n[写工具：无/错 token 必须拒绝]');

for (const [label, auth] of [['无 token', null], ['错 token', 'Bearer wrong-token-xyz']]) {
  t(`heartflow_self_heal + ${label} → 拒绝`, () => {
    const r = mcpCall('heartflow_self_heal', { action: 'status' }, auth, {});
    assert.ok(r.verdict.startsWith('UNAUTH') || r.verdict.startsWith('GUEST_BLOCKED'),
      `未拒绝: ${r.verdict}`);
  });
}

t('伪造 OID 头（无 token）→ 拒绝', () => {
  const fakeOid = { key: 'HeartFlow-OID-' + 'ab'.repeat(8), value: 'x' };
  const r = mcpCall('heartflow_self_heal', { action: 'status' }, null,
    { [fakeOid.key]: fakeOid.value });
  assert.ok(r.verdict.startsWith('UNAUTH') || r.verdict.startsWith('GUEST_BLOCKED'),
    `未拒绝: ${r.verdict}`);
});

console.log('\n[读工具：token 正常时应放行]');

t('heartflow_gate + 正确 token → OK', () => {
  const r = mcpCall('heartflow_gate', { text: 'test' }, 'Bearer ' + TOKEN, {});
  assert.strictEqual(r.verdict, 'OK', `实际 ${r.verdict}`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
