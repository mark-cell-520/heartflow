'use strict';
const m = require('/data/home/heartflow/src/argument-to-moderation.js');
const I = m.__internals();
const cases = {
  s2: '公说公有理婆说婆有理，责任对半分才算公允',
  s9: '一个说我偷了东西，一个说没偷，那就算我偷了一半吧',
};
for (const [name, s] of Object.entries(cases)) {
  console.log('===', name, JSON.stringify(s));
  for (const key of ['BLAME_ZH', 'SPLIT_ZH', 'NEG_SPLIT_ZH']) {
    const hits = [];
    for (const re of I[key]) {
      const g = new RegExp(re.source, 'g');
      let mm;
      while ((mm = g.exec(s)) !== null) {
        hits.push(mm[0] + '@' + mm.index);
        if (mm.index === g.lastIndex) g.lastIndex++;
      }
    }
    console.log(' ', key, JSON.stringify(hits));
  }
  console.log('  result:', JSON.stringify(m.checkArgumentToModeration(s)));
}
