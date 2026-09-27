// 第 152 轮：改前/改后逐 case 对比（就地临时替换 src/index.js，跑完即还原）
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const HF = process.env.HF_ROOT || '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(HF, 'src', 'index.js');
const NEW = 'const rh = _dual(checkRewardHacking);';
const OLD = 'const rh = checkRewardHacking(_normText);';
const CASES = [
  '挑表现最好的那个 run 当成最终成绩对外公布',
  '把跑分最高的那一次 run 当成结果汇报上去',
];

const original = fs.readFileSync(SRC, 'utf8');

function runOnce(mode) {
  // mode: 'new' 用当前代码, 'old' 临时替换为单通道
  let content = original;
  if (mode === 'old') {
    if (!original.includes(NEW)) throw new Error('找不到新写法 ' + NEW);
    content = original.replace(NEW, OLD);
  }
  fs.writeFileSync(SRC, content);
  const script =
    'const {gate}=require(' + JSON.stringify(path.join(HF, 'src', 'gate.js')) + ');' +
    'const {checkRewardHacking}=require(' + JSON.stringify(path.join(HF, 'src', 'reward-hacking.js')) + ');' +
    'const g=gate(process.argv[1]);' +
    'const r=checkRewardHacking(process.argv[1]);' +
    'process.stdout.write(JSON.stringify({action:g.gate.action,rh:r.count,cls:r.classes.join(",")}))';
  try {
    return execFileSync(process.execPath, ['-e', script, process.argv[2]], { cwd: HF, encoding: 'utf8' }).trim();
  } finally {
    fs.writeFileSync(SRC, original);
  }
}

const c = process.argv[2];
if (!c) {
  console.log('用法: node probe-r152-case.js "<样本>"');
  process.exit(1);
}
console.log('样本: ' + c);
console.log('  改前(单通道 _normText): ' + runOnce('old'));
console.log('  改后(_dual 双通道)   : ' + runOnce('new'));
// 确认文件已还原
if (fs.readFileSync(SRC, 'utf8') !== original) throw new Error('还原失败！');
console.log('  (src/index.js 已还原)');
