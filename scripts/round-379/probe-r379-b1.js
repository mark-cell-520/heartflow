'use strict';
// r379 诊断：B1 抹除 EXEMPT_CORRECT 后为何不转 hit。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'relative-risk-individual-transfer.js'));
const NEVER = /(?!x)x/;
const I = m.__internals();

const B1 = '这种治疗能把心血管事件的相对风险降低60%，但绝对风险只从10%降到4%，个人收益取决于自己的基线风险';

const inj = { EXEMPT_CORRECT_ZH: NEVER, EXEMPT_CORRECT_EN: NEVER };
console.log('B1 with EXEMPT_CORRECT killed:', JSON.stringify(m.checkRelativeRiskIndividualTransfer(B1, inj)));
console.log('B1 no inject:', JSON.stringify(m.checkRelativeRiskIndividualTransfer(B1)));

// 腿级归因
const isZh = true;
const g = m.hasInferenceBetween; // not used
const internals = I;
// 手动跑腿
const groupLeg = internals.findGroupLeg(B1, isZh, inj);
console.log('groupIdxs:', JSON.stringify(groupLeg));
const indivIdx = internals.findIndivLeg(B1, isZh, inj, groupLeg.idxs);
console.log('indivIdx:', indivIdx);
if (indivIdx >= 0) {
  const inferMark = internals.INFER_MARK_ZH;
  // 计算窗口
  let gEnd = -1;
  const gidxs = groupLeg.idxs;
  if (indivIdx > gidxs[0]) {
    for (let i = gidxs.length - 1; i >= 0; i--) {
      if (gidxs[i] < indivIdx) { gEnd = gidxs[i] + groupLeg.lens[i]; break; }
    }
  } else { gEnd = gidxs[0]; }
  const between = gEnd >= 0 ? B1.slice(gEnd, indivIdx) : '';
  console.log('between:', JSON.stringify(between), 'len', between.length);
  console.log('INFER_MARK_ZH.test(between):', inferMark.test(between));
  console.log('INFER_ZH.test(text):', internals.INFER_ZH.test(B1));
  const indivTail = B1.slice(indivIdx, indivIdx + 30);
  console.log('indivTail:', JSON.stringify(indivTail));
  console.log('CONCESSION_ZH.test(tail):', internals.CONCESSION_ZH.test(indivTail));
  const indivLead = B1.slice(Math.max(0, indivIdx - 20), indivIdx);
  console.log('CONCESSION_ZH.test(lead):', internals.CONCESSION_ZH.test(indivLead));
  console.log('negatedBefore:', internals.negatedBefore(B1, indivIdx, true));
}
// EXEMPT_CORRECT_ZH 常量内容
console.log('EXEMPT_CORRECT_ZH source:', internals.EXEMPT_CORRECT_ZH.source);
console.log('EXEMPT_CORRECT_ZH.test(B1):', internals.EXEMPT_CORRECT_ZH.test(B1));
