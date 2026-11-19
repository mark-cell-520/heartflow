'use strict';
const m = require('/data/home/heartflow/src/argument-to-moderation.js');
const I = m.__internals();
const s = '一个巴掌拍不响，双方都有错，各打五十大板';
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
  if (hits.length) console.log(key, JSON.stringify(hits));
}
console.log('no-inject:', JSON.stringify(m.checkArgumentToModeration(s)));
console.log('mid+truth empty:', JSON.stringify(m.checkArgumentToModeration(s, { MIDDLE_ZH: [], TRUTH_ZH: [] })));
