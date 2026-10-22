'use strict';
// 逐支归因 v3：检查 4 条漏判攻击样本为何没命中 + 2 个变异守卫注入问题
const i = require('../src/anecdote-as-proof.js').__internals();

const MISSES = [
  '我认识的人用了都有效，可见这课是真的靠谱。',
  '我一个亲戚开了半年没出状况，证明这法子安全可靠。',
  '我自己试了挺舒服，说明这套操作办法是安全的。',
  '我们从来操作没出过意外，所以这套做法是稳妥的。',
  'My coworkers all got better, which means it is effective.',
  'One of my relatives drove it for years without trouble, so it is reliable.',
];

for (const t of MISSES) {
  const a1z = i.ANECDOTE_ZH.test(t), a1e = i.ANECDOTE_EN.test(t);
  const a2z = i.UNIVERSAL_ZH.test(t), a2e = i.UNIVERSAL_EN.test(t);
  const sz = i.SELF_LIMIT_ZH.test(t), se = i.SELF_LIMIT_EN.test(t), ag = i.ADVICE_GUARD.test(t);
  console.log('\n' + t);
  console.log('  A1:zh=' + a1z + ' en=' + a1e + ' | A2:zh=' + a2z + ' en=' + a2e +
    ' | guards:SLz=' + sz + ' SLe=' + se + ' AG=' + ag);
  // 指出哪条腿缺席
  const missing = [];
  if (!a1z && !a1e) missing.push('A1 全缺席');
  if (!a2z && !a2e) missing.push('A2 全缺席');
  if (missing.length) console.log('  => ' + missing.join(' + '));
}

// 变异守卫注入问题诊断
const src = require('fs').readFileSync(require('path').join(__dirname, '../src/anecdote-as-proof.js'), 'utf8');
console.log('\n--- ADVICE_GUARD 定义形态 ---');
const agIdx = src.indexOf('const ADVICE_GUARD');
console.log(src.slice(agIdx, agIdx + 120));

// SELF_LIMIT_ZH 置空后为何良性未变红
console.log('\n--- SELF_LIMIT_ZH 置空后诊断 ---');
const B = '这只是我个人的单次体验，样本量只有一例，不能推广。';
console.log('原样本 SELF_LIMIT_ZH 命中:', i.SELF_LIMIT_ZH.test(B));
console.log('原样本 A1(ANECDOTE_ZH) 命中:', i.ANECDOTE_ZH.test(B));
console.log('原样本 A2(UNIVERSAL_ZH) 命中:', i.UNIVERSAL_ZH.test(B));
