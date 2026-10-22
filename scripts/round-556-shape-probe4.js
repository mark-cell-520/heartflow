'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const diag = require(path.join(ROOT, 'src', 'index.js'));
const r = diag.discriminate ? diag.discriminate('不支持这个方案，你就是站在对立面。') : null;
if (r) {
  const lbo = r.dimensions && r.dimensions.loyalty_by_omission;
  console.log('discriminate(): lbo =', JSON.stringify(lbo));
}
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const g = gate.checkOutput('不签字就是不信任我们。');
const dm = g.data && g.data.discriminate && g.data.discriminate.dimensions;
const keys = dm ? Object.keys(dm) : [];
console.log('dimensions 总键数:', keys.length);
console.log('含 loyalty 的键:', keys.filter(k=>/loyal/i.test(k)).join(','));
console.log('末尾 8 键:', keys.slice(-8).join(','));
