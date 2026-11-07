// r238 调试：草原句逐腿命中诊断
'use strict';
const path = require('path');
const m = require(path.join(__dirname, '..', '..', '..', 'src', 'tragedy-of-commons.js'));
const I = m.__internals();
const t = '草原没有围栏，每个牧户都尽可能多地放牧，草场退化的代价是全社会一起扛。';
for (const [name, list] of [['A_ZH', I.A_ZH], ['B_ZH', I.B_ZH], ['C_ZH', I.C_ZH]]) {
  const hits = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let x;
    while ((x = g.exec(t)) !== null) { hits.push(x[0]); if (x.index === g.lastIndex) g.lastIndex++; }
  }
  console.log(name, JSON.stringify(hits));
}
console.log('result hit:', m.detectTragedyOfCommons(t).hit);
