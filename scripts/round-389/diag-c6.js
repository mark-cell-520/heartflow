// r389 C6 诊断：血压一直没降下来 为何默认命中
'use strict';
const { detectSurrogateEndpointMisread: d, __internals } = require('../../src/surrogate-endpoint-misread.js');
const s = '血压一直没降下来，所以患者的心脏病风险解除了。';
const r = d(s);
console.log('hit:', r.hit);
console.log('evidence:', JSON.stringify(r.evidence));
console.log('count:', r.count, 'score:', r.score);
// 手动复算腿①匹配位置
const I = __internals();
for (const re of I.SURROGATE_ZH) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = g.exec(s)) !== null) {
    console.log('SURROGATE match:', JSON.stringify(m[0]), 'idx:', m.index, 'gap4:', JSON.stringify(s.slice(Math.max(0, m.index - 4), m.index)));
    if (m.index === g.lastIndex) g.lastIndex++;
  }
}
