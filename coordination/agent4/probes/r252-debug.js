/**
 * r252-debug.js — 定位 3 处测试失败
 */
const path = require('path');
const { detectSelectionOnDependentVariable, __internals } = require(path.join(__dirname, '..', '..', '..', 'src', 'selection-on-dependent-variable.js'));
const I = __internals();
const NEVER = /(?!)/;

function showSelCau(label, text) {
  console.log(`\n=== ${label} ===`);
  console.log('  text:', JSON.stringify(text));
  const sel = I.collect(text, I.SELECT_ZH, true);
  const cau = I.collect(text, I.CAUSE_ZH, true);
  console.log('  SELECT_ZH matches:', sel.map(s => ({ idx: s.idx, end: s.end, raw: s.raw })));
  console.log('  CAUSE_ZH   matches:', cau.map(s => ({ idx: s.idx, end: s.end, raw: s.raw })));
  const selE = I.collect(text, I.SELECT_EN, false);
  const cauE = I.collect(text, I.CAUSE_EN, false);
  console.log('  SELECT_EN matches:', selE.map(s => ({ idx: s.idx, end: s.end, raw: s.raw })));
  console.log('  CAUSE_EN   matches:', cauE.map(s => ({ idx: s.idx, end: s.end, raw: s.raw })));
  console.log('  findSignatures:', JSON.stringify(I.findSignatures(text, {})));
}

// ② 倒装 + W_ZH=0 为何仍命中
const inv = '所以融资能救命——你看，能活下来的公司都融过资';
showSelCau('倒装句（W_ZH=0 仍命中？）', inv);
console.log('  D(inv,{W_ZH:0}).hit =', detectSelectionOnDependentVariable(inv, { W_ZH: 0 }).hit);

// ① OVERDIST 默认窗为何命中
const OVERDIST = '能活下来的公司都融过资，' +
  '他们在过去十年里经历了完整的融资周期和多轮市场波动与资本寒冬的反复考验，' +
  '所以融资能救命。';
showSelCau('OVERDIST（默认应不命中）', OVERDIST);
console.log('  D(OVERDIST).hit =', detectSelectionOnDependentVariable(OVERDIST).hit);

// ③ CONCEPT_EN 删除后为何不变红
const cen = 'This textbook selection bias example shows: among the companies that survived, all had raised funding, so raising funding is what saves companies.';
console.log('\n=== CONCEPT_EN 样本 ===');
console.log('  CONCEPT_ZH.test =', I.CONCEPT_ZH.test(cen));
console.log('  CONCEPT_EN.test =', I.CONCEPT_EN.test(cen));
console.log('  CORRECTIVE_ZH.test =', I.CORRECTIVE_ZH.test(cen));
console.log('  CORRECTIVE_EN.test =', I.CORRECTIVE_EN.test(cen));
console.log('  D(cen).hit =', detectSelectionOnDependentVariable(cen).hit);
console.log('  D(cen,{CONCEPT_EN:NEVER}).hit =', detectSelectionOnDependentVariable(cen, { CONCEPT_EN: NEVER }).hit);
console.log('  findSignatures =', JSON.stringify(I.findSignatures(cen, {})));
