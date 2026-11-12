// r297 探针 3：定位 ad_hominem 在 gate() 路径是否可达。
const hf = require('../../src/gate.js');
const ah = require('../../src/ad-hominem.js');
const cd = require('../../src/credential-dismissal.js');
const I_ah = ah.__internals();
const I_cd = cd.__internals();

const SAMPLES = [
  '你就是个骗子，所以你的观点根本不可信',
  'He is a known liar, so he has no standing to judge this decision.',
  "You're not a climate scientist, so your opinion on this is worthless.",
];

for (const t of SAMPLES) {
  const direct = ah.checkAdHominem(t);
  const g = hf.gate(t);
  const dims = (g.findings || []).map(f => f.dimension);
  console.log('TEXT: ' + t);
  console.log('  direct hit=' + direct.hit + ' score=' + direct.score + ' detail=' + direct.detail);
  console.log('  attackZh=' + I_ah.ATTACK_ZH.test(t) + ' attackEn=' + I_ah.ATTACK_EN.test(t) +
              ' disrZh=' + I_ah.DISREGARD_ZH.test(t) + ' disrEn=' + I_ah.DISREGARD_EN.test(t));
  console.log('  gate.action=' + g.gate.action + ' verdict=' + g.verdict);
  console.log('  findings dims: ' + JSON.stringify(dims));
  console.log('');
}

// credential_dismissal 直接腿级
const CD_SAMPLES = [
  "You're not a climate scientist, so your opinion counts for nothing.",
];
for (const t of CD_SAMPLES) {
  const direct = cd.checkCredentialDismissal(t);
  const g = hf.gate(t);
  console.log('CD TEXT: ' + t);
  console.log('  direct hit=' + direct.hit + ' score=' + direct.score);
  console.log('  GAP_ZH=' + I_cd.GAP_ZH.some(r => r.test(t)) + ' GAP_EN=' + I_cd.GAP_EN.some(r => r.test(t)) +
              ' ST_ZH=' + I_cd.STANDING_ZH.some(r => r.test(t)) + ' ST_EN=' + I_cd.STANDING_EN.some(r => r.test(t)));
  console.log('  gate.action=' + g.gate.action + ' findings: ' + JSON.stringify((g.findings || []).map(f => f.dimension)));
}
