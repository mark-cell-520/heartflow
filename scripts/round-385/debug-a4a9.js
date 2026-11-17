'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectComparativeAdvantage, __internals } = require(path.join(ROOT, 'src', 'comparative-advantage.js'));
const I = __internals();
function tryLeg(label, keys, text) {
  for (const k of keys) {
    const re = I[k];
    if (!re) { console.log(`  ${k}: MISSING`); continue; }
    const m = text.match(re);
    console.log(`  ${k}: ${m ? 'HIT [' + m[0] + ']' : '--'}`);
  }
}
const A4 = '我国每一项技术都领先世界，进口别国产品毫无意义';
const A9 = 'No competitor can match us in anything, so there is no reason to trade with them';
console.log('=== A4 leg1 (ADV_ZH) ===');
tryLeg('adv', ['ADV_ZH_F1', 'ADV_ZH_F2', 'ADV_ZH_F3', 'ADV_ZH_F4', 'ADV_ZH_F5'], A4);
console.log('=== A4 leg2 (NOGAIN_ZH) ===');
tryLeg('nogain', ['NOGAIN_ZH_F1', 'NOGAIN_ZH_F2', 'NOGAIN_ZH_F3', 'NOGAIN_ZH_F4'], A4);
console.log('=== A9 leg1 (ADV_EN) ===');
tryLeg('adv', ['ADV_EN_F1', 'ADV_EN_F2', 'ADV_EN_F3', 'ADV_EN_F4', 'ADV_EN_F5'], A9);
console.log('=== A9 leg2 (NOGAIN_EN) ===');
tryLeg('nogain', ['NOGAIN_EN_F1', 'NOGAIN_EN_F2', 'NOGAIN_EN_F3', 'NOGAIN_EN_F4'], A9);
console.log('A4 detect:', JSON.stringify(detectComparativeAdvantage(A4)));
console.log('A9 detect:', JSON.stringify(detectComparativeAdvantage(A9)));
