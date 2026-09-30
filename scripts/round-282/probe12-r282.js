// 第 282 轮探针 12：直接从 require 到的模块对象取正则并测试（绕过 eval 的字符串匹配）
'use strict';
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src');
// index.js 会把 HASTY_GENERALIZATION_PATTERNS 挂到 module.exports（AGENTS 说 hf 有 checkOutput）
const idx = require(SRC);

const keys = Object.keys(idx);
const hk = keys.filter(k => k.indexOf('HASTY') !== -1 || k.indexOf('hasty') !== -1);
console.log('exports keys:', keys.length, 'HASTY-like:', hk.join(',') || '(none)');

const P = (idx.HASTY_GENERALIZATION_PATTERNS || (hk[0] && idx[hk[0]]));
if (!P) { console.log('未导出判据对象，改用运行时 checkOutput 对比（探针 10 已做）'); process.exit(0); }

const en = P.en;
console.log('en 判据条数:', en.length);

const CASES = ['Everyone is a fool.', 'Everyone is vermin.', 'Every one is a fool.', 'All users receive the notice.', 'All users are not affected by the outage.', 'Each single one of users is a fool.', 'All of the interns are fools.', 'Every one of them is a fool.', 'All of them are vermin.', 'Every user is a fool.'];
for (const s of CASES) {
  const hits = [];
  for (let i = 0; i < en.length; i++) { try { if (en[i] instanceof RegExp && en[i].test(s)) hits.push(i); } catch (e) { } }
  console.log('[' + hits.join(',') + ']'.padEnd(10), s);
}

// 定位含 everyone 的那条
for (let i = 0; i < en.length; i++) {
  try {
    if (en[i] instanceof RegExp && en[i].source.indexOf('everyone') !== -1) {
      console.log('含 everyone 的判据 idx=' + i, 'source 前缀:', en[i].source.slice(0, 60));
      console.log('  测试 Everyone is a fool. ->', en[i].test('Everyone is a fool.'));
      console.log('  测试 Every one is a fool. ->', en[i].test('Every one is a fool.'));
    }
  } catch (e) { }
}
