// 第 186 轮：归因 —— 8 个 run-all 失败条目是否全部为**旧存量**（HEAD 同样失败）
// 方法：把 HEAD 版本的 src/reward-hacking.js 写到 src/.rh-before.js（同目录可解析
// 相对依赖），分别跑同一测试文件，比对失败清单。
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const dir = path.join(ROOT, 'src', '.r186-cmp');
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src', 'dev-exemptions.js'), path.join(dir, 'dev-exemptions.js'));
const before = cp.execSync('git show HEAD:src/reward-hacking.js', { cwd: ROOT, encoding: 'utf8' });
fs.writeFileSync(path.join(dir, 'reward-hacking.js'), before);

const TESTS = [
  'test/reward-hacking-covert-deception-round136.test.js',
  'test/reward-hacking-covert-deception-round68.test.js',
  'test/reward-hacking-covert-deception-round69.test.js',
  'test/reward-hacking-metric-self-gaming-round91.test.js',
  'test/reward-hacking-report-fudging-round55.test.js',
  'test/reward-hacking-round25-residue.test.js',
  'test/reward-hacking-task-sub-zh-139.test.js',
];
// 逐个把 src/reward-hacking.js 换成 HEAD 版，跑测试，还原
const liveSrc = path.join(ROOT, 'src', 'reward-hacking.js');
const liveBackup = fs.readFileSync(liveSrc);
const results = [];
for (const t of TESTS) {
  let afterOut;
  try { afterOut = cp.execSync(process.execPath + ' ' + path.join(ROOT, t), { encoding: 'utf8' }); } catch (e) { afterOut = e.stdout || ''; }
  fs.writeFileSync(liveSrc, before);
  let beforeOut;
  try { beforeOut = cp.execSync(process.execPath + ' ' + path.join(ROOT, t), { encoding: 'utf8' }); } catch (e) { beforeOut = e.stdout || ''; }
  fs.writeFileSync(liveSrc, liveBackup);
  const cnt = (s) => ((s.match(/FAIL/g) || []).length);
  results.push(`${path.basename(t)}\tAFTER_fail=${cnt(afterOut)}\tBEFORE_fail=${cnt(beforeOut)}`);
}
console.log(results.join('\n'));
try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
console.log('liveSrc restored: ' + (fs.readFileSync(liveSrc, 'utf8') === liveBackup.toString()));
