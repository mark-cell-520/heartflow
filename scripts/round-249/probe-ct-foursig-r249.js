// scripts/round-249/probe-ct-foursig-r249.js
// 直接测模块本体的四要件签名搜索，找出真实命中的样本形状。
const { checkConditionalTransposition } = require('../../src/conditional-transposition.js');

const T = [
  // 满足「在X中」条件框 + 同一数值两现 + 推断词 + 实体回指
  ['A 在确诊者中检测阳性的概率是95%，所以检测阳性者中确诊的概率也是95%', '在...中 框'],
  ['B 在健康人里出现假阳性的概率是0.1%，所以出现假阳性的人患病的概率也是0.1%', '在...里 框'],
  ['C 如果筛查显示阳性，那么感染的概率是10%；所以筛查显示阳性的人感染的概率也是10%', '如果...那么'],
  ['D among patients with the disease the test is positive 95 percent of the time, so the probability of the disease among positive tests is 95 percent', 'EN among'],
  ['E 在嫌疑人中指纹匹配的概率是百万分之一，所以指纹匹配的人是嫌疑人的概率也是百万分之一', '在...中 极值?'],
];

for (const [t, note] of T) {
  const r = checkConditionalTransposition(t);
  console.log(`${r.hit ? '✅' : '✗'} [${note}] score=${r.score} count=${r.count}`);
  console.log(`   ${t.slice(0, 70)}`);
  if (r.detail) console.log(`   detail: ${r.detail.slice(0, 100)}`);
}
