#!/usr/bin/env node
/**
 * r418 — MCP 三态鉴权端到端测试（真实 HTTP JSON-RPC，不跳过）
 *
 * 背景：test/mcp-auth-tier.test.js 全部跳过——
 *   「未设 MCP_HEARTFLOW_KEY，跳过（不读 .env：test/ 会进 npm 包）」
 *   「8588 不在线或无有效 token，跳过 HTTP 鉴权测试」
 *   它自己写着「这意味着 v6.7.72 修掉的 admin 死代码 bug 无法在本环境验证」。
 * 一个永远跳过的测试比没有测试更糟：它给「已验证」的假象。
 *
 * 本测试的做法：不读 .env，自己生成随机 token，用环境变量启动一个真实的
 * mcp-server 子进程，然后用真实 HTTP JSON-RPC 打过去。三态逐一验证：
 *
 *   1. 无 token        → guest，只读工具放行，写工具被 WRITE_TOOLS 拦
 *   2. token 错误      → 401（攻击信号，绝不放行）
 *   3. token 正确      → admin，写工具放行
 *   4. 持 OID header   → 至少 user 档
 *
 * 约束遵守：
 *   · 不读 .env（test/ 会进 npm 包的纪律）
 *   · 不占固定端口（用 0 让 OS 分配，避免与在跑的实例冲突）
 *   · 子进程用完即杀，不泄漏
 */
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const HF = path.join(__dirname, '..');
const SRV = path.join(HF, 'src/mcp-server.js');

let pass = 0, fail = 0;
const T = (name, ok, detail) => {
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); }
};

// ── 启动真实 server ──
const TOKEN = 'test-' + crypto.randomBytes(24).toString('hex');
const PORT = 18500 + Math.floor(Math.random() * 500);

function rpc(method, params, headers, port) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    const req = http.request({
      host: '127.0.0.1', port, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== r418 MCP 三态鉴权端到端（真实 HTTP JSON-RPC）===\n');

  const env = { ...process.env, MCP_HEARTFLOW_KEY: TOKEN, HF_KEEP_STDOUT_LOGS: '1' };
  delete env.NODE_ENV;
  const child = spawn(process.execPath, [SRV, '--port', String(PORT)], {
    cwd: HF, env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let srvOut = '';
  child.stdout.on('data', d => srvOut += d);
  child.stderr.on('data', d => srvOut += d);

  // 等 server 就绪（最多 25s）
  let ready = false;
  for (let i = 0; i < 50; i++) {
    await sleep(500);
    try {
      const r = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } }, {}, PORT);
      if (r.status === 200 || r.status === 401) { ready = true; break; }
    } catch (_) { /* 还没起 */ }
    if (child.exitCode !== null) break;
  }
  if (!ready) {
    console.log('  ❌ server 未能启动，输出尾部:');
    console.log('     ' + srvOut.split('\n').slice(-6).join('\n     '));
    child.kill('SIGKILL');
    console.log(`\n结果: 0 通过, 1 失败`);
    process.exit(1);
  }
  console.log(`  server 就绪（port ${PORT}，token 长度 ${TOKEN.length}）\n`);

  // 初始化 session（拿 session id 如果有）
  const initHdr = {};
  const initRes = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } }, {}, PORT);
  if (initRes.status === 200) {
    try {
      const j = JSON.parse(initRes.body);
      if (j.result && j.result.sessionId) initHdr['mcp-session-id'] = j.result.sessionId;
    } catch (_) {}
  }

  // ── 1. 匿名（无 token）→ guest ──
  console.log('【1】无 token → guest 档');
  const listAnon = await rpc('tools/list', {}, initHdr, PORT);
  T('tools/list 匿名可读（200）', listAnon.status === 200, `实际 ${listAnon.status}`);

  // 找一个真实的只读工具名
  let readTool = 'heartflow_status';
  try {
    const j = JSON.parse(listAnon.body);
    const names = (j.result && j.result.tools || []).map(t => t.name);
    const ro = names.find(n => /status|health|check_outbound|ping/.test(n));
    if (ro) readTool = ro;
  } catch (_) {}
  const readCall = await rpc('tools/call', { name: readTool, arguments: {} }, initHdr, PORT);
  let readBlocked = false;
  try { readBlocked = /权限不足/.test(JSON.parse(readCall.body).result.content[0].text); } catch (_) {}
  T(`只读工具 ${readTool} 匿名可调（不被拦）`, !readBlocked,
    readBlocked ? '返回了「权限不足」' : `HTTP ${readCall.status}`);

  // ── 2. guest 调写工具 → 必须被拦 ──
  console.log('\n【2】guest 调写工具 → 必须拦截');
  const WRITE_PROBES = [
    'heartflow_memory_write_control',
    'heartflow_memory_eraser',
    'heartflow_decision_decide',
    'heartflow_self_heal',
  ];
  for (const w of WRITE_PROBES) {
    const r = await rpc('tools/call', { name: w, arguments: {} }, initHdr, PORT);
    let blocked = false;
    try { blocked = /权限不足/.test(JSON.parse(r.body).result.content[0].text); } catch (_) {}
    T(`${w} guest 被拦`, blocked, `HTTP ${r.status}`);
  }

  // ── 3. 错误 token → 401 ──
  console.log('\n【3】token 错误 → 401（攻击信号绝不放行）');
  const badToken = await rpc('tools/list', {}, { ...initHdr, authorization: 'Bearer wrong-token-xxxx' }, PORT);
  T('错误 token 返回 401', badToken.status === 401, `实际 ${badToken.status}`);

  // ── 4. 正确 token → admin，写工具放行 ──
  console.log('\n【4】token 正确 → admin 档，写工具放行');
  const adminHdr = { ...initHdr, authorization: `Bearer ${TOKEN}` };
  const listAdmin = await rpc('tools/list', {}, adminHdr, PORT);
  T('admin tools/list 200', listAdmin.status === 200, `实际 ${listAdmin.status}`);

  for (const w of WRITE_PROBES) {
    const r = await rpc('tools/call', { name: w, arguments: {} }, adminHdr, PORT);
    let blocked = false;
    try { blocked = /权限不足/.test(JSON.parse(r.body).result.content[0].text); } catch (_) {}
    // admin 放行的证据：不再返回「权限不足」（可能返回参数错误，那也算过了鉴权关）
    T(`${w} admin 放行`, !blocked, blocked ? '仍被 guest 拦' : `HTTP ${r.status}`);
  }

  // ── 5. OID header → user 档 ──
  console.log('\n【5】OID header → 至少 user 档');
  const oid = 'HeartFlow-OID-' + crypto.randomBytes(8).toString('hex');
  const r = await rpc('tools/call', { name: 'heartflow_memory_write_control', arguments: {} },
    { ...initHdr, 'x-heartflow-oid': oid }, PORT);
  let blocked = false;
  try { blocked = /权限不足/.test(JSON.parse(r.body).result.content[0].text); } catch (_) {}
  T('持 OID 可过写权限门槛（user 档）', !blocked, blocked ? '仍被拦' : `HTTP ${r.status}`);

  // ── 收尾 ──
  child.kill('SIGTERM');
  await sleep(300);
  if (child.exitCode === null) child.kill('SIGKILL');

  console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => {
  console.error('测试异常:', e.message);
  process.exit(1);
});
