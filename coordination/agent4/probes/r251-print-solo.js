const { __internals } = require('/data/home/heartflow/src/loss-aversion.js');
const I = __internals();
console.log('=== SOLO_ZH ===');
I.SOLO_ZH.forEach((r, i) => console.log('[' + i + '] ' + r.source));
console.log('=== SOLO_EN ===');
I.SOLO_EN.forEach((r, i) => console.log('[' + i + '] ' + r.source));
