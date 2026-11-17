'use strict';
// r379 诊断 v3：找出「抹 EXEMPT_CORRECT + CONCESSION 后真能转 hit」的良性句，
// 用于修正负例注入断言的选句。验证三条路径：
//   1. 豁免是唯一阻挡（转 hit）——可作注入断言
//   2. 腿部结构不成形（仍不 hit）——不能作注入断言
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'relative-risk-individual-transfer.js'));
const NEVER = /(?!x)x/;

const CANDIDATES = [
  // 既有 BENIGN
  '这种治疗能把心血管事件的相对风险降低60%，但绝对风险只从10%降到4%，个人收益取决于自己的基线风险', // B1
  '疫苗在人群中把感染风险压低九成，不过个体感染风险还取决于个人暴露情况和基线水平', // B2
  '统计学教材强调，报告相对风险降低时必须同时给出绝对风险降低和基线风险，否则容易误导读者', // B3
  '疫苗在人群中把感染风险压低九成', // B4
  '你打完疫苗后个人感染风险确实低了很多', // B5
  '论文按统计学规范同时报告了相对风险降低60%与绝对风险降低3%', // B6
  '疫苗在人群中把感染风险压低九成。你个人的感染风险则要看自己的情况', // B7
  '疫苗把人群感染风险压低九成，但这不等于每个人的感染风险都能少九成', // B8
  '这种治疗真的能让每个人的风险都少六成吗？', // B9
  'The drug lowers relative risk by 60%, but the absolute risk reduction is only 3%, so individual benefit depends on baseline risk.', // B10
  'Risk communication guidelines warn that relative risk reduction must always be presented alongside absolute risk and baseline risk.', // B11
  'Across the population the intervention reduced infection risk by 90%.', // B12
  // 新候选：纯豁免阻挡形（群体降幅 → 个体同幅度，无转折，只被「绝对风险」豁免挡住）
  '该药能把心血管事件的相对风险降低60%，每个人的绝对风险只从10%降到4%，所以收益取决于基线风险',
  'The treatment cuts relative risk by 60%, so every individual\'s absolute risk falls from 10% to 4% depending on baseline.',
  '人群中相对风险降低六成，换算到个人就是绝对风险从10%降到4%，个体差异很大',
];

const injCorrect = { EXEMPT_CORRECT_ZH: NEVER, EXEMPT_CORRECT_EN: NEVER };
const injCorrectConcession = { EXEMPT_CORRECT_ZH: NEVER, EXEMPT_CORRECT_EN: NEVER, CONCESSION_ZH: NEVER, CONCESSION_EN: NEVER };

console.log('=== 只抹 EXEMPT_CORRECT ===');
for (const s of CANDIDATES) {
  const r = m.checkRelativeRiskIndividualTransfer(s, injCorrect);
  console.log((r.hit ? 'HIT ' : '---- ') + JSON.stringify(s.slice(0, 50)));
}
console.log('=== 抹 EXEMPT_CORRECT + CONCESSION ===');
for (const s of CANDIDATES) {
  const r = m.checkRelativeRiskIndividualTransfer(s, injCorrectConcession);
  console.log((r.hit ? 'HIT ' : '---- ') + JSON.stringify(s.slice(0, 50)));
}
console.log('=== 无注入基线（应全部不 hit）===');
for (const s of CANDIDATES) {
  const r = m.checkRelativeRiskIndividualTransfer(s);
  console.log((r.hit ? 'HIT ' : '---- ') + JSON.stringify(s.slice(0, 50)));
}
