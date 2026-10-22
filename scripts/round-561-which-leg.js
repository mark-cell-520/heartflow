'use strict';
// 逐支归因 v2：直接重编译每个分支字面量为独立 RegExp 测试
const i = require('../src/anecdote-as-proof.js').__internals();

const TEXTS = [
  '我从来没用出过问题，所以这套流程是安全的。',
  '我从来没遇到过问题，这套流程是安全的。',
  '我一直没遇到故障，所以这套流程是安全的。',
  '我朋友吃完就说有效，这药肯定有用。',
  '我用了三个月，感觉好多了，说明这方法管用。',
  '我从来不出问题，所以这套操作办法是安全的。',
];

// 从 __internals 拿不到分支列表，直接从编译源重建各支
const src = require('fs').readFileSync(require('path').join(__dirname, '../src/anecdote-as-proof.js'), 'utf8');
function branchLits(name) {
  const start = src.indexOf('const ' + name + ' = new RegExp([');
  const end = src.indexOf('].join', start);
  if (start < 0 || end < 0) return [];
  const body = src.slice(start, end);
  const out = [];
  for (const m of body.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
    out.push(m[1]);
  }
  return out;
}

const zhLegs = branchLits('ANECDOTE_ZH');
console.log('ANECDOTE_ZH 字面量分支数:', zhLegs.length);
const compiled = zhLegs.map((lit, n) => ({ n, lit, re: new RegExp(lit) }));

for (const t of TEXTS) {
  const hits = compiled.filter(b => { try { return b.re.test(t); } catch (e) { return false; } });
  console.log('\n目标: ' + t);
  if (!hits.length) console.log('  X 无支命中（漏判）');
  hits.forEach(h => console.log('  OK #' + h.n + ' :: ' + h.lit.slice(0, 72)));
}

console.log('\n--- 各支字面量一览 ---');
compiled.forEach(b => console.log('#' + b.n + ' ' + b.lit.slice(0, 90)));
