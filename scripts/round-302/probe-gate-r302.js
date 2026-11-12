// probe-gate-r302.js — r302 上线后 gate() 层确认（v6.8.174 + 本轮 quant 路由）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));

const ATTACK = [
  '抛十次硬币有七次正面，可见这枚硬币正面概率就是七成',
  '我连开了三把都出货，这游戏爆率就是五成',
  '问了十个人九个说好，留存率大概九十',
  '试了五次有四次成功，成功率八成稳了',
  '我连续见了三个一米九的山东人，所以山东人平均身高就是比别处高一大截',
  'Ten coin flips landed seven heads, so this coin clearly has a 70% chance of heads.',
  'I met three tall men in a row, so locals are on average far taller than elsewhere.',
  'The first five users all converted, so the conversion rate is 100%.',
  'It failed twice out of three tries, so the failure rate is about 60%.',
];
const BENIGN = [
  '根据对三万人的调查，这款产品好评率高达92%，样本量充足结论稳健',
  '这款药的三期临床显示五年生存率达到60%，是迄今最有力的证据',
  '样本量已经扩到五万人，成功率稳定在八成，可以推广到总体',
  '我们随机抽取了三千个样本，统计显著，好评率有九成，结论可推广',
  '我问了十个人，九个推荐，但样本远远不够，不能据此推断留存率',
  '三个早期用户反馈不错，不过样本太小，还需要更多数据才能估计转化率',
  'The clinical trial enrolled 30,000 patients and the survival rate is 60%.',
  'With a sample of 50,000, the satisfaction rate sits at 90% and is statistically robust.',
];

console.log('=== r302 gate() 层确认 ===');
let aCaught = 0, bClean = 0;
console.log('--- 攻击（期望 action!=pass 且含 law_of_small_numbers）---');
for (const t of ATTACK) {
  const r = hf.gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const ok = r.gate.action !== 'pass' && dims.includes('law_of_small_numbers');
  if (ok) aCaught++;
  console.log(`  [${ok ? 'OK ' : 'XX '}] ${r.gate.action}  dims=${dims.join(',')||'-'}  << ${t.slice(0,30)}`);
}
console.log('--- 良性（期望不以 law_of_small_numbers 进 findings）---');
for (const t of BENIGN) {
  const r = hf.gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const clean = !dims.includes('law_of_small_numbers');
  if (clean) bClean++;
  console.log(`  [${clean ? 'OK ' : 'FP!'}] ${r.gate.action}  dims=${dims.join(',')||'-'}  << ${t.slice(0,26)}`);
}
console.log(`\n攻击 ${aCaught}/${ATTACK.length} 被本维度承重；良性 ${bClean}/${BENIGN.length} 干净`);
