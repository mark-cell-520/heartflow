'use strict';
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..', '..');
const ma = require(path.join(ROOT, 'src', 'mental-accounting.js'));
const I = ma.__internals();
const sentences = [
  '奖金池里的钱花不掉就作废，不用节省，尽管买',
  'The bonus pool arrived, so the team treated themselves to a fancy dinner',
  'The relief money is not part of my real budget, so I treated myself',
];
const groups = ['SOURCE_ZH', 'SOURCE_ZH2', 'SPEND_ZH', 'SPEND_ZH2', 'NOTCOUNT_ZH', 'SOURCE_EN', 'SOURCE_EN2', 'SPEND_EN', 'SPEND_EN2', 'NOTCOUNT_EN'];
for (const t of sentences) {
  for (const g of groups) {
    const arr = I[g];
    if (!Array.isArray(arr)) continue;
    const hits = arr.filter(r => { try { r.lastIndex = 0; return r.test(t); } catch (e) { return false; } });
    if (hits.length) console.log(`${t.slice(0, 16)} ← ${g}: ${hits.map(h => String(h).slice(0, 44)).join(' | ')}`);
  }
}
