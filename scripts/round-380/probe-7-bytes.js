'use strict';
// round-380 probe-7: 对比 probe-4 与 probe-5 中样本句的逐字节内容
const fs = require('fs');
function sampleFrom(file, varName) {
  const src = fs.readFileSync(file, 'utf8');
  const re = new RegExp(varName + "\\s*=\\s*'([^']*)'");
  const m = src.match(re);
  return m ? m[1] : null;
}
const a = sampleFrom(__dirname + '/probe-4-ctx.js', 's');
const b = sampleFrom(__dirname + '/probe-5-same-proc.js', 'A');
console.log('probe-4 sample len =', a && Buffer.byteLength(a));
console.log('probe-5 sample len =', b && Buffer.byteLength(b));
console.log('equal =', a === b);
if (a !== b && a && b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) console.log('first diff at ' + i + ': ' + JSON.stringify(a[i]) + ' vs ' + JSON.stringify(b[i]));
  }
}
