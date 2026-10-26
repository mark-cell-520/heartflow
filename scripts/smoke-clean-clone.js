#!/usr/bin/env node
/**
 * r420 — 干净克隆冒烟验收（外部审计发现 2 要的那道门）
 *
 * 审计结论原话：「核心短板不在代码层，而在生命周期闭环：缺少"发布物必须
 * 在干净环境可跑"这道门，使规模庞大的测试资产无法阻止 main 分支出现致命破损。」
 *
 * 本地绿 ≠ 新克隆可用。发现 1 就是活证：src/economic-control.js 在本地
 * 磁盘上、本地一切正常，但它从未入库，新克隆一跑 README 示例就崩。
 *
 * 本脚本做的事：
 *   1. 把当前 HEAD（或指定 ref）导出到临时目录（不含 .git / node_modules）
 *   2. 在**没有任何本地残留**的环境里跑三道验收：
 *      A. require 完整性（guard-require-integrity.js）
 *      B. bin/verify.js 安装自检
 *      C. README「Use it in 30 seconds」示例 —— 就是崩溃过的那条路径
 *   3. 任一不过 → exit 1
 *
 * 用法：node scripts/smoke-clean-clone.js [ref]
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const REF = process.argv[2] || 'HEAD';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-smoke-'));

console.log('=== 干净克隆冒烟验收 ===');
console.log(`ref: ${REF}`);
console.log(`workdir: ${WORK}\n`);

let fail = 0;
const T = (name, ok, detail) => {
  console.log(`  ${ok ? '✅' : '❌'} ${name}${ok || !detail ? '' : ': ' + detail}`);
  if (!ok) fail++;
};

// 1. 导出干净树（git archive 只含已跟踪文件 —— 这本身就是一道关：
//    没入库的文件不会出现在这里，所以跑不通就说明发布物不完整）
try {
  execSync(`git archive ${REF} | tar -x -C ${WORK}`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, timeout: 300000 });
  T('git archive 导出干净树', true);
} catch (e) {
  T('git archive 导出干净树', false, e.message.slice(0, 120));
  console.log('\n无法继续。'); process.exit(1);
}

// 2. A. require 完整性
console.log('\n【A】require 完整性（新克隆没有的 file 会被抓到）');
const rA = spawnSync(process.execPath, [path.join(WORK, 'scripts/guard-require-integrity.js'), '--quiet'],
  { cwd: WORK, encoding: 'utf8', timeout: 180000 });
T('require 完整性', rA.status === 0, (rA.stdout || '').split('\n').filter(l => l.includes('🔴')).slice(0, 3).join(' / '));

// 3. B. 安装自检
console.log('\n【B】bin/verify.js 安装自检');
const rB = spawnSync(process.execPath, [path.join(WORK, 'bin/verify.js')],
  { cwd: WORK, encoding: 'utf8', timeout: 240000 });
const bm = (rB.stdout || '').match(/(\d+) passed/), bf = (rB.stdout || '').match(/(\d+) failed/);
T(`verify.js（${bm ? bm[1] : '?'} passed / ${bf ? bf[1] : '0'} failed）`, rB.status === 0 && bf && +bf[1] === 0);

// 4. C. README 招牌示例（崩溃过的那条路径）
console.log('\n【C】README「Use it in 30 seconds」示例');
const readme = fs.readFileSync(path.join(WORK, 'README.md'), 'utf8');
const sec = readme.match(/## Use it in 30 seconds([\s\S]*?)```javascript([\s\S]*?)```/);
if (!sec) {
  T('从 README 提取示例代码', false, '未找到 ```javascript 块');
} else {
  T('从 README 提取示例代码', true);
  const code = sec[2];
  const probe = path.join(WORK, '__smoke_probe.js');
  fs.writeFileSync(probe, code + `
// 验收断言：必须拿到四档之一的 action，且不得抛异常
if (!['pass','verify','rewrite','block'].includes(r.gate.action)) {
  console.error('SMOKE_FAIL: gate.action = ' + r.gate.action);
  process.exit(1);
}
console.log('SMOKE_OK: gate.action = ' + r.gate.action + ', verdict = ' + r.verdict);
`);
  const rC = spawnSync(process.execPath, [probe], { cwd: WORK, encoding: 'utf8', timeout: 240000 });
  const okC = /SMOKE_OK/.test(rC.stdout || '') || /SMOKE_OK/.test(rC.stderr || '');
  T('README 示例在干净树可运行', okC,
    okC ? '' : ((rC.stderr || rC.stdout || '').split('\n').filter(l => /Error|SMOKE_FAIL/.test(l)).slice(0, 2).join(' / ') || 'exit ' + rC.status));
  fs.unlinkSync(probe);
}

// 5. 额外：MCP server 能起（audit 报告说 154/182 个工具对外提供）
// [r420] 必须传 MCP_HEARTFLOW_KEY：mcp-server.js 无 token 时按设计 exit 1
// （r412 加的保护），不传 token 会误判成"server 起不来"。
console.log('\n【D】MCP server 可启动');
const rD = spawnSync(process.execPath, ['-e', `
const { spawn } = require('child_process');
const http = require('http');
const port = 18900 + Math.floor(Math.random() * 400);
const p = spawn(process.execPath, ['src/mcp-server.js', '--port', String(port)], {
  stdio: 'ignore', env: { ...process.env, MCP_HEARTFLOW_KEY: 'smoke-' + Math.random().toString(36).slice(2) }
});
const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } } });
function attempt(n) {
  if (n <= 0) { p.kill(); process.exit(1); }
  const q = http.request({ host: '127.0.0.1', port, path: '/mcp', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => { p.kill(); process.exit(res.statusCode === 200 || res.statusCode === 401 ? 0 : 1); });
  });
  q.on('error', () => setTimeout(() => attempt(n - 1), 2000));
  q.write(body); q.end();
}
// [r420] 实测干净树上启动要 30s+（1286 条公式 + 161 模块），
// 单次请求必超时。改为轮询重试，总预算 90s。
setTimeout(() => attempt(45), 3000);
`], { cwd: WORK, encoding: 'utf8', timeout: 120000 });
T('MCP server 启动并响应 initialize', rD.status === 0, 'exit ' + rD.status);

// 收尾
console.log('\n═══════════════════════');
if (fail === 0) {
  console.log('✅ 干净克隆冒烟通过：发布物在无本地残留的环境可跑');
} else {
  console.log(`🔴 ${fail} 项不过 —— main 分支当前不可发布`);
}
try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (_) {}
process.exit(fail > 0 ? 1 : 0);
