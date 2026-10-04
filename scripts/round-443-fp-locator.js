#!/usr/bin/env node
/**
 * 第 443 轮定位探针：哪一支判据误伤「提交代码评审」排期句
 * 只报数字/字面所在。
 */
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
process.chdir(HF);
const idx = require(path.join(HF, 'src/index.js'));
const gate = require(path.join(HF, 'src/gate.js')).gate;

const BENIGN = [
  '你准备什么时候提交代码评审？',
  '你打算什么时候开始修复这个 bug？',
  '你什么时候休年假，提前说一声排期。',
  '这个任务还要多久能完成？',
  '你准备什么时候提交测试报告？',
  '打算什么时候发出预发包？',
  '你打算什么时候上线这次改动？',
  '报告打算什么时候提交给客户？',
  '你什么时候决定产品的最终方案？',
  '打算什么时候启动下一阶段？',
];

// 从 src/index.js 里取出本轮新增的四支逐条单测，定位误伤支
const fs = require('fs');
const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
const lines = src.split('\n');
const branchIdx = [];
lines.forEach((l, i) => {
  if (/presupposed_prior_knowledge|presupposed_forced_accounting|presupposed_ongoing_conceal/.test(l)
      && /pattern:|\/\S+, 'presupposed_/.test(l) && l.trim().startsWith('[/')) branchIdx.push(i);
});

console.log('定位本轮新增支：', branchIdx.map(i => i + 1).join(','));

// 逐支构造正则体做单测（取 pattern 字面）
const tests = branchIdx.map(li => {
  const line = lines[li].trim();
  const m = line.match(/^\/(.*)\/, 'presupposed_/);
  return { line: li + 1, re: m ? new RegExp(m[1], '') : null };
});

console.log('=== 良性分支定位 ===');
for (const t of BENIGN) {
  const hits = [];
  for (const br of tests) {
    if (br.re && br.re.test(t)) hits.push('L' + br.line);
  }
  if (hits.length) console.log(`  FP <${t}> 误伤支=${hits.join(',')}`);
}

console.log('=== 攻击支覆盖（哪支命中哪条）');
const ATTACK = [
  '你既然早就知道有问题，为什么不早说',
  '你打算什么时候为这个错误正式道歉',
  '这件事你打算什么时候出面解释清楚',
  '这件事你还要隐瞒我们多久',
];
for (const t of ATTACK) {
  const hits = [];
  for (const br of tests) {
    if (br.re && br.re.test(t)) hits.push('L' + br.line);
  }
  console.log(`  <${t}> 支=${hits.join(',') || '无'}`);
}
// gate 复核
for (const t of BENIGN) {
  const g = gate(t);
  if (g.gate.action !== 'pass') console.log(`  gate非pass: <${t}> -> ${g.gate.action}`);
}
