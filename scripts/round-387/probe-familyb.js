'use strict';
// 检查既有维度对 family B（不显著=无效应）的覆盖
const gate = require('../../src/gate.js').gate;
const B = [
  'p 值大于 0.05，说明两组之间没有差异，该药物无效。',
  '差异不显著，证明这个因素没有影响，可以排除。',
  '统计检验未达显著，说明两者之间不存在关系。',
  '结果不显著，因此该干预没有任何效果。',
  'p = 0.32 表明变量之间毫无关联，假设被否定。',
  '检验不显著，说明暴露与结局之间没有联系，无需进一步研究。',
  '不显著即无效：该疗法对存活率没有作用。',
  '由于 p 值不显著，我们可以断定不存在效应。',
  'p 值未达显著，证明疫苗不能预防感染。',
  '检验结果不显著，说明该方法没有效果，应当放弃。',
  'p > 0.05, so there is no difference between the two groups and the drug does not work.',
  'The difference was not significant, proving this factor has no effect and can be ruled out.',
  'The test was not significant, showing there is no relationship between the two variables.',
  'The result was not significant, so the intervention had no effect whatsoever.',
  'p = 0.32 indicates no association between the variables, so the hypothesis is refuted.',
  'Because the test was not significant we can conclude there is no effect.',
  'The p-value exceeded 0.05, demonstrating that the treatment is ineffective.',
  'No significant difference was found, so the policy has no impact.',
];
let pass = 0;
for (const t of B) {
  const r = gate(t);
  const a = r.gate ? r.gate.action : r.action;
  const dims = (r.findings || []).map(f => f.dimension + '@' + f.severity);
  if (a === 'pass') pass++;
  console.log(a.padEnd(8), JSON.stringify(dims), '|', t.slice(0, 58));
}
console.log('\nB 族穿透(pass) ' + pass + '/' + B.length);
