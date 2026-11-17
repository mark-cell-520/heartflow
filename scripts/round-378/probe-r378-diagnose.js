// r378 探针：诊断 relative_risk_individual_transfer 模块层命中情况
const { checkRelativeRiskIndividualTransfer } = require('../../src/relative-risk-individual-transfer.js');
const attacks = [
  '人群层面的相对风险只有对照组的六成，于是每个参与者的个人风险也都打六折',
  '相对风险降低了 30%，也就是说你的个人风险降低了 30%',
  'The relative risk reduction is 30%, so your personal risk is 30% lower.',
  '该药物使总人群的相对风险下降四分之一，你作为个体同样下降四分之一',
  'Relative risk fell by half in the whole population, so it fell by half for you.',
  '群体的相对风险降到三成，落到每个人头上也是三成',
  "Risks relative to baseline dropped 40%, meaning every person's individual risk dropped 40%.",
  '整体相对风险减少了两成，个体层面的减少同样是两成',
  'In relative terms the population risk is a third lower, so each participant is a third lower.',
  '相对风险下降 25%，个人相对风险也下降 25%',
];
const benign = [
  'The trial showed a relative risk reduction of 30% in the whole cohort.',
  '群体相对风险下降 30%，但个体绝对风险的改善取决于基线水平。',
  'Relative risk reduction does not translate into equal absolute benefit for everyone.',
  '该干预在人群层面将相对风险降低了 30%。',
  'The relative risk in the treatment group was 0.7 of the control group.',
];
for (const t of attacks) {
  const r = checkRelativeRiskIndividualTransfer(t);
  console.log((r.hit ? 'HIT ' : 'miss') + ' score=' + r.score + ' | ' + t.slice(0, 45));
}
console.log('--- benign ---');
for (const t of benign) {
  const r = checkRelativeRiskIndividualTransfer(t);
  console.log((r.hit ? 'FALSE-HIT ' : 'clean    ') + ' score=' + r.score + ' | ' + t.slice(0, 45));
}
