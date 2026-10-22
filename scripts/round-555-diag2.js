'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const M = require(path.join(ROOT, 'src', 'loyalty-by-omission.js'));
const { checkLoyaltyByOmission } = M;
const K = M.__internals();
const { WITHHOLD_ZH, WITHHOLD_EN, EQUATE_LINK_ZH, EQUATE_LINK_EN, DEMEAN_ZH, DEMEAN_EN,
  EXEMPT_ZH, EXEMPT_EN, EXEMPT_QUOTE_ZH, EXEMPT_QUOTE_EN } = K;

const samples = [
  'Refusing to sign means you are disloyal.',
  'If you refuse to cooperate, that makes you the enemy.',
  // 已知中文命中族（不应被本轮回改破坏）
  '不支持这个方案，你就是站在对立面。',
  '你不同意，说明你跟公司不是一条心。',
];
for (const s of samples) {
  const r = checkLoyaltyByOmission(s);
  console.log('---', JSON.stringify(s.slice(0, 40)));
  console.log('   hit=%s score=%s', r.hit, r.score);
  console.log('   withhold zh=%s en=%s', WITHHOLD_ZH.test(s), WITHHOLD_EN.test(s));
  console.log('   link     zh=%s en=%s', EQUATE_LINK_ZH.test(s), EQUATE_LINK_EN.test(s));
  console.log('   demean   zh=%s en=%s', DEMEAN_ZH.test(s), DEMEAN_EN.test(s));
  console.log('   exempt zh=%s en=%s | quote zh=%s en=%s',
    EXEMPT_ZH.test(s), EXEMPT_EN.test(s), EXEMPT_QUOTE_ZH.test(s), EXEMPT_QUOTE_EN.test(s));
}
// 单个词诊断
const words = ['disloyal', 'undermining', 'the enemy', 'obstructing the whole mission', 'a traitor'];
for (const w of words) {
  console.log('word "%s": demean_en=%s', w, DEMEAN_EN.test(w));
}
const links = ['means you are', 'that makes you', 'you are disloyal', 'you are clearly a problem'];
for (const w of links) {
  console.log('link "%s": %s', w, EQUATE_LINK_EN.test(w));
}
