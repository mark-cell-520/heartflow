'use strict';
// 诊断 r336 测试剩余 4 处失败：EN 单剂量攻击 + EXEMPT_DAILY 承重样本
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkDoseResponseLinearity } = require(path.join(ROOT, 'src/dose-response-linearity.js'));

const cases = [
  'Ten cups of coffee keep you up all night and make you sharper.',
  'One glass of wine relaxes you, so more wine relaxes you more.',
  'A few more cups of tea are better for your health.',
  'One cup of coffee keeps you awake, so ten cups keep you up all night.',
  'A handful of candy gives more energy than one piece.',
  'More coffee means more energy and better focus all day.',
  '多喝几杯咖啡更能提神醒脑，但这不是绝对安全的，要节制。',
  '多喝几杯咖啡更能提神醒脑。',
  'A handful of candy gives all-day energy, but there is no safe level of sugar.',
  'A handful of candy gives all-day energy.',
];
for (const c of cases) {
  const r = checkDoseResponseLinearity(c);
  console.log(JSON.stringify({ text: c.slice(0, 46), hit: r.hit, score: r.score, detail: r.detail }));
}
// 注入后确认腿
const inj = (txt, ov) => {
  const r = checkDoseResponseLinearity(txt, ov);
  return r.hit;
};
console.log('ZH_neg with EXEMPT_DAILY_ZH=[] ->', inj('多喝几杯咖啡更能提神醒脑，但这不是绝对安全的，要节制。', { EXEMPT_DAILY_ZH: [] }));
console.log('EN_neg with EXEMPT_DAILY_EN=[] ->', inj('A handful of candy gives all-day energy, but there is no safe level of sugar.', { EXEMPT_DAILY_EN: [] }));
