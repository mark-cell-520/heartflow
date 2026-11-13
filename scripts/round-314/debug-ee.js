/* r314 调试：endowment 三条 miss 样本的腿级归因 */
'use strict';
const EE = require('../../src/endowment-effect.js');
const I = EE.__internals();

function show(tag, list, text) {
  const hits = [];
  for (const re of list) { const m = re.exec(text); if (m) hits.push(m[0]); }
  console.log(`  ${tag}: ${hits.length ? JSON.stringify(hits) : 'none'}`);
}

const cases = [
  { t: '这只猫是我看着长大的，拿什么我都换不来', own: I.OWN_ZH.concat(I.OWN_ZH2), inf: I.INFLATE_ZH.concat(I.INFLATE_ZH2), txn: I.TXN_ZH, lang: 'zh' },
  { t: 'You cannot put a price on my grandfather\'s desk, I would not trade it for anything', own: I.OWN_EN.concat(I.OWN_EN2), inf: I.INFLATE_EN.concat(I.INFLATE_EN2), txn: I.TXN_EN, lang: 'en' },
  { t: 'He would not sell his grandfather\'s desk at any market price.', own: I.OWN_EN.concat(I.OWN_EN2), inf: I.INFLATE_EN.concat(I.INFLATE_EN2), txn: I.TXN_EN, lang: 'en' },
];
for (const c of cases) {
  console.log('TEXT:', c.t.slice(0, 60));
  show('OWN', c.own, c.t);
  show('INFLATE', c.inf, c.t);
  console.log('  TXN:', c.txn.test(c.t));
  const r = EE.detectEndowmentEffect(c.t);
  console.log('  detect:', r.hit, r.detail ? r.detail.slice(0, 60) : '');
  console.log('');
}
