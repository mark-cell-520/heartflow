// 第 189 轮：用上一轮的 HEAD (493fe4de, 未含第189轮改动) 重跑 6 个 di 测试
// 目的：确认这些 di 测试在上一轮结束时是否就已经失败（上轮 run-all 报 10 失败
// 未含它们，需查明是「当时通过、本轮改崩」还是「当时就失败但被漏数」）。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const OLD_HEAD = '493fe4de'; // 第 188 轮的 src 基态

const FILES = ['dangerous-instruction.js', 'dev-exemptions.js', 'gate.js', 'index.js'];
const TESTS = [
  'dangerous-instruction-dev-benign-round33.test.js',
  'dangerous-instruction-list-add-round126.test.js',
  'dangerous-instruction-list-bypass-round133-guard.test.js',
  'dangerous-instruction-malicious-purpose-round31.test.js',
  'dangerous-instruction-switch-facility-round138.test.js',
  'dangerous-instruction-verb-object-round125.test.js',
  'reward-hacking-covert-deception-round68.test.js',
  'tone-policing-round95.test.js',
];
function run(t) {
  try {
    execFileSync('node', ['--test', path.join(ROOT, 'test', t)], { cwd: ROOT, encoding: 'utf8' });
    return 'PASS';
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    return 'FAIL(' + ((out.match(/❌|not ok/g) || []).length) + ')';
  }
}
const cur = {};
for (const t of TESTS) cur[t] = run(t);
const bak = path.join(ROOT, 'src', '__bak189');
fs.mkdirSync(bak, { recursive: true });
for (const f of FILES) {
  fs.copyFileSync(path.join(ROOT, 'src', f), path.join(bak, f));
  fs.writeFileSync(path.join(ROOT, 'src', f), execFileSync('git', ['show', `${OLD_HEAD}:src/${f}`], { cwd: ROOT }));
}
const old = {};
try { for (const t of TESTS) old[t] = run(t); }
finally {
  for (const f of FILES) {
    fs.copyFileSync(path.join(bak, f), path.join(ROOT, 'src', f));
    fs.unlinkSync(path.join(bak, f));
  }
  fs.rmdirSync(bak);
}
for (const t of TESTS) console.log(`${old[t].padEnd(10)} -> ${cur[t].padEnd(10)} ${t}`);
