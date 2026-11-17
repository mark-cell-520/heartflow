// r378 守卫诊断：对每条中文 miss 案例，逐项打印豁免/腿③/窗/对冲判定
const mod = require('../../src/relative-risk-individual-transfer.js');
const I = mod.__internals();
const CASES = [
  '人群层面的相对风险只有对照组的六成，于是每个参与者的个人风险也都打六折',
  '该药物使总人群的相对风险下降四分之一，你作为个体同样下降四分之一',
  '群体的相对风险降到三成，落到每个人头上也是三成',
  '整体相对风险减少了两成，个体层面的减少同样是两成',
  '相对风险下降 25%，个人相对风险也下降 25%',
];
const INFER_ZH = /所以|因此|因而|故而|可见|这说明|这表明|那么|也就是说|换句话说|等于|意味着(?:每个|个人|你)|顺理成章|理所当然|因为|由于|既然|鉴于|可以说|看得出来|足见|据此|据(?:此|统计结果)|从统计结果看|统计结果看|研究显示|结果显示|试验显示|数据表明/;
for (const t of CASES) {
  console.log('TEXT: ' + t);
  console.log('  INFER_ZH 命中: ' + INFER_ZH.test(t) + '  (matched: ' + (t.match(INFER_ZH) || ['-'])[0] + ')');
  console.log('  EXEMPT_META_ZH: ' + I.EXEMPT_META_ZH.some(r => r.test(t)) + '   CORRECT_ZH: ' + I.EXEMPT_CORRECT_ZH.some(r => r.test(t)) + '   NORM_ZH: ' + I.EXEMPT_NORM_ZH.some(r => r.test(t)));
  // 打印每条腿的具体命中串
  I.GROUP_ZH.forEach((re, i) => { const m = t.match(re); if (m) console.log(`    GROUP_ZH[${i}] = ${JSON.stringify(m[0])} @${m.index}`); });
  I.INDIV_ZH.forEach((re, i) => { const m = t.match(re); if (m) console.log(`    INDIV_ZH[${i}] = ${JSON.stringify(m[0])} @${m.index}`); });
  const r = mod.checkRelativeRiskIndividualTransfer(t);
  console.log('  => hit=' + r.hit);
}
