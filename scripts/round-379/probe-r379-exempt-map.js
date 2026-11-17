'use strict';
// r379 诊断 v4：系统性找出每个豁免常量真正的「豁免唯一阻挡」句。
// 方法：对每个候选句，逐步累加抹除豁免，找出「抹某个豁免后转 hit」的句，
// 并要求该句在基线（无注入）下不 hit。只报可作注入断言的组合。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'relative-risk-individual-transfer.js'));
const NEVER = /(?!x)x/;

const EXEMPT_KEYS = ['EXEMPT_CORRECT_ZH', 'EXEMPT_CORRECT_EN', 'EXEMPT_META_ZH', 'EXEMPT_META_EN', 'EXEMPT_NORM_ZH', 'EXEMPT_NORM_EN'];
function injOf(...keys) { const o = {}; for (const k of keys) o[k] = NEVER; return o; }

// BENIGN 全集（从测试抄）
const BENIGN = [
  '这种治疗能把心血管事件的相对风险降低60%，但绝对风险只从10%降到4%，个人收益取决于自己的基线风险',
  '疫苗在人群中把感染风险压低九成，不过个体感染风险还取决于个人暴露情况和基线水平',
  '统计学教材强调，报告相对风险降低时必须同时给出绝对风险降低和基线风险，否则容易误导读者',
  '疫苗在人群中把感染风险压低九成',
  '你打完疫苗后个人感染风险确实低了很多',
  '论文按统计学规范同时报告了相对风险降低60%与绝对风险降低3%',
  '疫苗在人群中把感染风险压低九成。你个人的感染风险则要看自己的情况',
  '疫苗把人群感染风险压低九成，但这不等于每个人的感染风险都能少九成',
  '这种治疗真的能让每个人的风险都少六成吗？',
  'The drug lowers relative risk by 60%, but the absolute risk reduction is only 3%, so individual benefit depends on baseline risk.',
  'Risk communication guidelines warn that relative risk reduction must always be presented alongside absolute risk and baseline risk.',
  'Across the population the intervention reduced infection risk by 90%.',
];

console.log('=== 每个 BENIGN：基线 + 各单豁免注入 ===');
BENIGN.forEach((s, i) => {
  const base = m.checkRelativeRiskIndividualTransfer(s).hit;
  const row = [`B${i + 1} base=${base ? 'HIT!' : 'ok'}`];
  for (const k of EXEMPT_KEYS) {
    const r = m.checkRelativeRiskIndividualTransfer(s, injOf(k)).hit;
    if (r) row.push(k.replace('EXEMPT_', '') + '=HIT');
  }
  console.log(row.join('  '));
});
console.log('');
console.log('=== 成对豁免组合（针对单抹不 hit 的）===');
for (let i = 0; i < BENIGN.length; i++) {
  const s = BENIGN[i];
  if (m.checkRelativeRiskIndividualTransfer(s).hit) continue;
  const hits = [];
  // ZH 对
  for (const pair of [['EXEMPT_CORRECT_ZH', 'EXEMPT_META_ZH'], ['EXEMPT_CORRECT_ZH', 'EXEMPT_NORM_ZH'], ['EXEMPT_META_ZH', 'EXEMPT_NORM_ZH'], EXEMPT_KEYS.filter(k => k.endsWith('_ZH'))]) {
    const r = m.checkRelativeRiskIndividualTransfer(s, injOf(...pair)).hit;
    if (r) hits.push(pair.join('+').replace(/EXEMPT_/g, '') + '=HIT');
  }
  if (hits.length) console.log(`B${i + 1}: ${hits.join('  ')}`);
}
console.log('');
console.log('=== 全豁免抹除（找还有第三层挡的）===');
BENIGN.forEach((s, i) => {
  if (m.checkRelativeRiskIndividualTransfer(s).hit) return;
  const all = m.checkRelativeRiskIndividualTransfer(s, injOf(...EXEMPT_KEYS)).hit;
  console.log(`B${i + 1}: all-exempt-killed=${all ? 'HIT' : 'still-blocked'}`);
});
