'use strict';
// r379 诊断 v2：B1 抹除 EXEMPT_CORRECT + CONCESSION 后为何仍不 hit。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'relative-risk-individual-transfer.js'));
const I = m.__internals();
const NEVER = /(?!x)x/;

const B1 = '这种治疗能把心血管事件的相对风险降低60%，但绝对风险只从10%降到4%，个人收益取决于自己的基线风险';
const B2 = '疫苗在人群中把感染风险压低九成，不过个体感染风险还取决于个人暴露情况和基线水平';
const B10 = 'The drug lowers relative risk by 60%, but the absolute risk reduction is only 3%, so individual benefit depends on baseline risk.';

function diag(label, text, isZh, inj) {
  console.log('=== ' + label + ' ===');
  const g = I.findGroupLeg(text, isZh, inj);
  console.log('  group idxs:', JSON.stringify(g));
  const indivIdx = I.findIndivLeg(text, isZh, inj, g.idxs);
  console.log('  indivIdx:', indivIdx);
  if (indivIdx >= 0) {
    let gEnd = -1;
    if (indivIdx > g.idxs[0]) {
      for (let i = g.idxs.length - 1; i >= 0; i--) {
        if (g.idxs[i] < indivIdx) { gEnd = g.idxs[i] + g.lens[i]; break; }
      }
    } else gEnd = g.idxs[0];
    const between = gEnd >= 0 && gEnd < indivIdx ? text.slice(gEnd, indivIdx) : '';
    console.log('  between:', JSON.stringify(between), 'INFER_MARK:', I.INFER_MARK_ZH.test(between));
    const tail = text.slice(indivIdx, Math.min(text.length, indivIdx + 30));
    const lead = text.slice(Math.max(0, indivIdx - 20), indivIdx);
    console.log('  concession tail/lead:', I.CONCESSION_ZH.test(tail), I.CONCESSION_ZH.test(lead));
    console.log('  negatedBefore:', I.negatedBefore(text, indivIdx, isZh));
    console.log('  INFER_ZH(text):', I.INFER_ZH.test(text));
  }
}

const inj1 = { EXEMPT_CORRECT_ZH: NEVER, EXEMPT_CORRECT_EN: NEVER, CONCESSION_ZH: NEVER, CONCESSION_EN: NEVER };
console.log('B1 result:', JSON.stringify(m.checkRelativeRiskIndividualTransfer(B1, inj1)));
diag('B1', B1, true, inj1);
console.log('B2 result:', JSON.stringify(m.checkRelativeRiskIndividualTransfer(B2, inj1)));
diag('B2', B2, true, inj1);
console.log('B10 result:', JSON.stringify(m.checkRelativeRiskIndividualTransfer(B10, inj1)));
diag('B10', B10, false, inj1);
// EXEMPT_CORRECT 常量逐条命中检查
console.log('--- EXEMPT_CORRECT_ZH per-regex on B1 ---');
for (const re of I.EXEMPT_CORRECT_ZH) console.log('  ', re.source.slice(0, 40), '->', re.test(B1));
console.log('--- CONCESSION_ZH on B1 ---', I.CONCESSION_ZH.test(B1));
console.log('--- EXEMPT_META_ZH on B1 ---', I.EXEMPT_META_ZH.some(re => re.test(B1)));
console.log('--- EXEMPT_NORM_ZH on B1 ---', I.EXEMPT_NORM_ZH.some(re => re.test(B1)));
