// r238 调试：MIXED 签名计数诊断
'use strict';
const path = require('path');
const m = require(path.join(__dirname, '..', '..', '..', 'src', 'tragedy-of-commons.js'));
const I = m.__internals();
const t = '草场是公共的，每家多养羊自己多挣钱；The pasture is shared, so each family that adds more cattle earns more.';
for (const [name, list] of [['A_ZH', I.A_ZH], ['B_ZH', I.B_ZH], ['C_ZH', I.C_ZH], ['A_EN', I.A_EN], ['B_EN', I.B_EN], ['C_EN', I.C_EN]]) {
  const hits = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let x;
    while ((x = g.exec(t)) !== null) { hits.push([x.index, x[0]]); if (x.index === g.lastIndex) g.lastIndex++; }
  }
  console.log(name, JSON.stringify(hits));
}
const r = m.detectTragedyOfCommons(t);
console.log('count:', r.count, 'evidence:', JSON.stringify(r.evidence));
