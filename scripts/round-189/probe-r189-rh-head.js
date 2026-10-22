// 第 189 轮：7 个 rh 失败文件在「本轮改动前 src 基态 493fe4de」下的失败断言数
// 与当前版逐文件对照（第 188 轮 probe-r188-rh-head.js 同款）
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const OLD = '493fe4de';

const FILES = ['dangerous-instruction.js', 'dev-exemptions.js', 'gate.js', 'index.js'];
const TESTS = [
  'reward-hacking-covert-deception-round136.test.js',
  'reward-hacking-covert-deception-round68.test.js',
  'reward-hacking-covert-deception-round69.test.js',
  'reward-hacking-metric-self-gaming-round91.test.js',
  'reward-hacking-report-fudging-round55.test.js',
  'reward-hacking-round25-residue.test.js',
  'reward-hacking-task-sub-zh-139.test.js',
];
function run(t) {
  try {
    const o = execFileSync('node', ['--test', path.join(ROOT, 'test', t)], { cwd: ROOT, encoding: 'utf8' });
    return 0;
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const f = (out.match(/^# fail (\d+)/m) || [])[1];
    const cross = (out.match(/❌/g) || []).length;
    return f ? `${f}(${cross})` : `cross${cross}`;
  }
}
const cur = {};
for (const t of TESTS) cur[t] = run(t);
const bak = path.join(ROOT, 'src', '__bakrh189');
fs.mkdirSync(bak, { recursive: true });
for (const f of FILES) {
  fs.copyFileSync(path.join(ROOT, 'src', f), path.join(bak, f));
  fs.writeFileSync(path.join(ROOT, 'src', f), execFileSync('git', ['show', `${OLD}:src/${f}`], { cwd: ROOT }));
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
for (const t of TESTS) console.log(`${String(old[t]).padEnd(10)} -> ${String(cur[t]).padEnd(10)} ${t}`);
