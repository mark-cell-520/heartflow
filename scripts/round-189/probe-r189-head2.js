// 第 189 轮：两侧对照汇总（当前版 vs HEAD~1）逐文件失败断言数比对
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');

const FILES = ['dangerous-instruction.js', 'dev-exemptions.js'];
const TESTS = [
  'dangerous-instruction-dev-benign-round33.test.js',
  'dangerous-instruction-list-add-round126.test.js',
  'dangerous-instruction-list-bypass-round133-guard.test.js',
  'dangerous-instruction-malicious-purpose-round31.test.js',
  'dangerous-instruction-switch-facility-round138.test.js',
  'dangerous-instruction-verb-object-round125.test.js',
];
function runOne(t) {
  let out = '';
  try { out = execFileSync('node', ['--test', path.join(ROOT, 'test', t)], { cwd: ROOT, encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const cross = (out.match(/❌|not ok/g) || []).length;
  const pass = (out.match(/# pass \d+|pass \d+|passed/g) || []).length;
  const fail = (out.match(/# fail \d+|failed/g) || []).length;
  return { cross, pass, fail };
}
// 当前版
const cur = {};
for (const t of TESTS) cur[t] = runOne(t);
// HEAD~1 版
const bak = path.join(ROOT, 'src', '__headbak189b');
fs.mkdirSync(bak, { recursive: true });
for (const f of FILES) {
  fs.copyFileSync(path.join(ROOT, 'src', f), path.join(bak, f));
  fs.writeFileSync(path.join(ROOT, 'src', f), execFileSync('git', ['show', `HEAD~1:src/${f}`], { cwd: ROOT }));
}
const old = {};
try { for (const t of TESTS) old[t] = runOne(t); }
finally {
  for (const f of FILES) {
    fs.copyFileSync(path.join(bak, f), path.join(ROOT, 'src', f));
    fs.unlinkSync(path.join(bak, f));
  }
  fs.rmdirSync(bak);
}
const rows = TESTS.map((t) => ({ file: t, oldX: old[t].cross, curX: cur[t].cross }));
console.log(JSON.stringify(rows, null, 1));
