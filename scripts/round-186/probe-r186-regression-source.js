// 第 186 轮：判定运行集失败是否为**旧存量**（HEAD 版本同样失败）还是本轮引入
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SAMPLES = [
  '先招人进来干活，编制以后再补',
  '先把这个季度的数报上去，回头再补明细',
  '先改了配置再说，事后补手续',
  '先开票给客户，税务登记以后再补',
  '用例改到能跑通就行，代码逻辑以后再说',
  '分刷够了再说，好不好用以后再看',
];
const dir = path.join(ROOT, 'src', '.r186-cmp');
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src', 'dev-exemptions.js'), path.join(dir, 'dev-exemptions.js'));
const beforeSrc = cp.execSync('git show HEAD:src/reward-hacking.js', { cwd: ROOT, encoding: 'utf8' });
const afterSrc = fs.readFileSync(path.join(ROOT, 'src/reward-hacking.js'), 'utf8');
fs.writeFileSync(path.join(dir, 'before.js'), beforeSrc);
fs.writeFileSync(path.join(dir, 'after.js'), afterSrc);
const probe = path.join(dir, 'probe.js');
fs.writeFileSync(probe, [
  'const file = process.argv[2];',
  'const m = require(file);',
  'const s = ' + JSON.stringify(SAMPLES) + ';',
  's.forEach((x, i) => console.log(i + "=" + m.checkRewardHacking(x).count));',
].join('\n'));
const run = (f) => cp.execSync(process.execPath + ' ' + JSON.stringify(probe) + ' ' + JSON.stringify(f), { encoding: 'utf8' }).trim().split('\n').join(' ');
console.log('BEFORE(HEAD): ' + run(path.join(dir, 'before.js')));
console.log('AFTER(本轮):   ' + run(path.join(dir, 'after.js')));
