// r378 细粒度诊断：逐条打印腿①命中、腿②配对失败原因
const path = require('path');
const mod = require('../../src/relative-risk-individual-transfer.js');
const I = mod.__internals();
const NEVER = /(?!x)x/;

const CASES = [
  '人群层面的相对风险只有对照组的六成，于是每个参与者的个人风险也都打六折',
  '相对风险降低了 30%，也就是说你的个人风险降低了 30%',
  '该药物使总人群的相对风险下降四分之一，你作为个体同样下降四分之一',
  'Relative risk fell by half in the whole population, so it fell by half for you.',
  '群体的相对风险降到三成，落到每个人头上也是三成',
  "Risks relative to baseline dropped 40%, meaning every person's individual risk dropped 40%.",
  '整体相对风险减少了两成，个体层面的减少同样是两成',
  'In relative terms the population risk is a third lower, so each participant is a third lower.',
  '相对风险下降 25%，个人相对风险也下降 25%',
];
const isZh = t => /[\u4e00-\u9fff]/.test(t);
for (const t of CASES) {
  const zh = isZh(t);
  const gl = zh ? I.GROUP_ZH : I.GROUP_EN;
  const il = zh ? I.INDIV_ZH : I.INDIV_EN;
  const gHits = [], iHits = [];
  gl.forEach((re, i) => { if (re.test(t)) gHits.push(i); });
  il.forEach((re, i) => { if (re.test(t)) iHits.push(i); });
  const r = mod.checkRelativeRiskIndividualTransfer(t);
  console.log(`${r.hit ? 'HIT ' : 'miss'} zh=${zh} group=[${gHits}] indiv=[${iHits}]`);
  console.log(`      ${t.slice(0, 70)}`);
}
