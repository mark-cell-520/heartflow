'use strict';
// round-380 probe-10: 用引擎返回的真实 JSON 自己验证「能否查到维度名」
const path = require('path');
const HF = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const s = '问题不在算法，而在数据分布的维度，这是统计学习的基本常识。';
const j = JSON.stringify(HF.checkOutput(s));
// 不手打查询串：从测试文件里读回原判据，原样执行
const testSrc = require('fs').readFileSync(
  path.join(__dirname, '..', '..', 'test', 'doubt-ppf-span-r296.test.js'), 'utf8');
const m = testSrc.match(/JSON\.stringify\(r\)\.includes\('([^']+)'\.slice\(0,\s*(\d+)\)\)/);
console.log('判据字面量 =', m && JSON.stringify(m[1]), 'slice =', m && m[2]);
const needle = m[1].slice(0, Number(m[2]));
console.log('切片后 =', JSON.stringify(needle), 'len =', needle.length);
console.log('j.includes(needle) =', j.includes(needle));
console.log('j.indexOf(needle)   =', j.indexOf(needle));
// 码点对照：needle 与内容中实际出现的那一段
const at = j.indexOf('pro_') >= 0 ? j.indexOf('pro_') : -1;
const actual = j.slice(at, at + 30);
console.log('内容段 =', JSON.stringify(actual));
if (at >= 0) {
  for (let i = 0; i < 18; i++) {
    const a = needle.charCodeAt(i), b = actual.charCodeAt(i);
    if (a !== b) console.log('  码点差异 @' + i + ': needle U+' + a.toString(16) + ' vs 实际 U+' + b.toString(16));
  }
}
