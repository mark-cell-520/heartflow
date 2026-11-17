'use strict';
// r379 诊断 v6：NORM_ZH 候选句为何抹 EXEMPT_NORM 后仍不 hit。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'relative-risk-individual-transfer.js'));
const I = m.__internals();
const NEVER = /(?!x)x/;

const CANDS = [
  '按统计学规范报告，风险降低60%，所以每个患者的心血管事件都会减少六成',
  '相对风险降低60%与绝对风险降低3%需同时报告，所以每个患者的心血管事件都会减少六成',
  '按统计学规范报告：风险降低60%，所以每个患者的心血管事件都会减少六成',
  '相对风险降低60%与绝对风险降低3%并列报告，所以每个患者的心血管事件都会减少六成',
  '按统计口径报告风险降低60%，所以每个患者的心血管事件都会减少六成',
];

const injNorm = { EXEMPT_NORM_ZH: NEVER, EXEMPT_NORM_EN: NEVER };
const injAll = { EXEMPT_NORM_ZH: NEVER, EXEMPT_NORM_EN: NEVER, EXEMPT_CORRECT_ZH: NEVER, EXEMPT_CORRECT_EN: NEVER, EXEMPT_META_ZH: NEVER, EXEMPT_META_EN: NEVER, CONCESSION_ZH: NEVER, CONCESSION_EN: NEVER };

for (const s of CANDS) {
  const base = m.checkRelativeRiskIndividualTransfer(s).hit;
  const kn = m.checkRelativeRiskIndividualTransfer(s, injNorm).hit;
  const ka = m.checkRelativeRiskIndividualTransfer(s, injAll).hit;
  console.log(`base=${base} normKilled=${kn} allKilled=${ka}  ${s.slice(0, 50)}`);
  if (!ka) {
    // 腿级归因
    const g = I.findGroupLeg(s, true, injAll);
    const indivIdx = I.findIndivLeg(s, true, injAll, g.idxs);
    console.log('   group:', JSON.stringify(g), 'indivIdx:', indivIdx);
    if (indivIdx >= 0) {
      let gEnd = -1;
      if (indivIdx > g.idxs[0]) {
        for (let i = g.idxs.length - 1; i >= 0; i--) { if (g.idxs[i] < indivIdx) { gEnd = g.idxs[i] + g.lens[i]; break; } }
      } else gEnd = g.idxs[0];
      const between = gEnd >= 0 && gEnd < indivIdx ? s.slice(gEnd, indivIdx) : '';
      console.log('   between:', JSON.stringify(between), 'INFER_MARK:', I.INFER_MARK_ZH.test(between), 'INFER_ZH:', I.INFER_ZH.test(s));
      const tail = s.slice(indivIdx, Math.min(s.length, indivIdx + 30));
      const lead = s.slice(Math.max(0, indivIdx - 20), indivIdx);
      console.log('   concession tail/lead:', I.CONCESSION_ZH.test(tail), I.CONCESSION_ZH.test(lead), 'neg:', I.negatedBefore(s, indivIdx, true));
    }
    console.log('   EXEMPT_NORM_ZH hits:', I.EXEMPT_NORM_ZH.filter(re => re.test(s)).map(re => re.source.slice(0, 30)));
    console.log('   EXEMPT_META_ZH hits:', I.EXEMPT_META_ZH.filter(re => re.test(s)).map(re => re.source.slice(0, 30)));
  }
}
