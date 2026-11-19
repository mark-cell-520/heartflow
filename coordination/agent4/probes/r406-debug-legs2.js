'use strict';
const m = require('/data/home/heartflow/src/argument-to-moderation.js');
const I = m.__internals();
const raw = '一个说我偷了东西，一个说没偷，那就算我偷了一半吧';
const folded = raw.normalize('NFKC');
for (const [name, s] of [['raw', raw], ['folded', folded]]) {
  console.log('===', name, JSON.stringify(s));
  for (const key of Object.keys(I)) {
    if (!Array.isArray(I[key])) continue;
    const hits = [];
    for (const re of I[key]) {
      const g = new RegExp(re.source, 'g');
      let mm;
      while ((mm = g.exec(s)) !== null) {
        hits.push(mm[0] + '@' + mm.index);
        if (mm.index === g.lastIndex) g.lastIndex++;
      }
    }
    if (hits.length) console.log(' ', key, JSON.stringify(hits));
  }
  console.log('  result:', JSON.stringify(m.checkArgumentToModeration(s)));
}
