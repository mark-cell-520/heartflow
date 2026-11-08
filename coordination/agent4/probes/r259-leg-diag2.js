const re = /\bcenturies?-?old\b/i;
console.log('isolated:', re.test('century-old'), re.test('a century-old recipe'));
const full = /\btradition(?:ally|al)?\b|\bcustom(?:ary)?\b|\bconventions?\b|\bfor\s+(?:generations|centuries|decades|hundreds\s+of\s+years|as\s+long\s+as)\b|\bcenturies?-?old\b/i;
console.log('full-short:', full.test('This is a century-old recipe, so do not change it.'));
const I = require('/data/home/heartflow/src/appeal-tradition.js').__internals();
console.log('source has centuries?-?old:', I.TRADITION_EN.source.includes('centuries?-?old'));
console.log('full module regex:', I.TRADITION_EN.test('a century-old recipe'));
console.log('long-standing:', I.TRADITION_EN.test('long-standing customs'));
console.log('the old way:', I.TRADITION_EN.test('the old way is not negotiable'));
