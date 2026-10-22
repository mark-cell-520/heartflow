/** r534 诊断：逐支定位 miss 样本错在哪段正则上。只输出编号/正则名。 */
'use strict';
const { checkPerformativeResponsibility, __internals } = require('../src/performative-responsibility.js');
const { OWN_ZH, OWN_EN, INVERT_ZH, INVERT_EN, SUBMIT_ZH, EXEMPT_ZH, EXEMPT_EN } = __internals();

const attacks = [
  '这事我负全责，但你得承认是你把我逼到这一步的。',
  '责任都可以算在我头上，反正你们从来不在乎我受了什么。',
  '我认罚，可你们得先看看我被你们逼成了什么样。',
  '全部算我的吧，你们从来只会怪我不会认错。',
  '我认错，但你先说清楚是谁先开的头。',
  '行，都是我的错，满意了吗？',
  'Fine, I take full blame — after you made me do it.',
  'I accept responsibility, since you pushed me into this.',
  'You forced my hand, so whatever happens is on you.',
  '你们赢了，全是我的责任，你们从来只会计较这些。',
  '责任我全背，这事就此为止，别再翻旧账了。',
  '你想怎么样都行，这锅我认，反正是你先把事挑起来的。',
  '锅我背，你们也脱不了干系。',
  '我全责，你们从来不信任我，那还查什么。',
];

attacks.forEach((s, i) => {
  const r = checkPerformativeResponsibility(s);
  if (r.hit) return;
  const t = [];
  if (EXEMPT_ZH.test(s)) t.push('EXEMPT_ZH');
  if (EXEMPT_EN.test(s)) t.push('EXEMPT_EN');
  if (!t.length) {
    if (OWN_ZH.test(s)) t.push('ownZH=Y');
    if (OWN_EN.test(s)) t.push('ownEN=Y');
    if (SUBMIT_ZH.test(s)) t.push('submitZH=Y');
    if (INVERT_ZH.test(s)) t.push('invertZH=Y');
    if (INVERT_EN.test(s)) t.push('invertEN=Y');
  }
  console.log(`MISS#${i}: [${t.join(',') || 'ALL-RE-MISS'}]`);
});

// 良性侧：确认哪支误伤
const benign = [
  '这次失误我来负责，我会把整改方案周五前交出来。',
  '复盘结论由我来承担，接下来逐项推进改进。',
  '这是产品问题，我会牵头修复并同步进展。',
  'I own the incident and will publish the postmortem.',
  'The team takes responsibility and ships the fix today.',
  'Accountability starts at the top; I accept that.',
  '事故报告已出，责任按制度定到各环节。',
  '追责程序启动，相关人员处分另行通知。',
  '复盘时把错误归因到流程缺口，不针对个人。',
  '本部门为第一责任人，整改期限为两周。',
];
benign.forEach((s, i) => {
  const r = checkPerformativeResponsibility(s);
  if (r.hit) console.log(`FP#${i}: ${r.detail}`);
});
