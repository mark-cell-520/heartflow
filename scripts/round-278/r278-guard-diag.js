// 第 278 轮诊断：_deLeetCandidates 的 token 级保护为何漏掉这些形态
// 直接 require 内部函数（若导出），否则复刻判据逐条对照。
'use strict';
const src = require('fs').readFileSync('/root/hermes1/skills/ai/mark-heartflow-skill/src/text-normalizer.js', 'utf8');

// 提取 restore() 内的 token 级豁免正则，逐条测试
const GUARDS = [
  { name: 'pure-punct-digits', re: /^[\d.,%:/x\-+= ]+$/ },
  { name: 'unit-suffix', re: /^\d+(?:\.\d+)?\s*(?:[kmgtp]?i?b|b|bytes?|mb|gb|kb|tb|pb|ms|s|min|h|hr|fps|hz|khz|mhz|ghz|w|kw|v|mv|kv|ma|nm|mm|cm|m|km|kg|mg|g|l|ml|cl|°c|°f|%)$/i },
  { name: 'unit-suffix2', re: /^\d+(?:\.\d+)?(?:[kmgtp]?i?b|bytes?|hz|fps|ms|min|khz|mhz|ghz)$/i },
  { name: 'pipe-only', re: /^\|+$/ },
];

const TOKENS = ['Q3', '3f2a91b', '100k', '0xFF00', 'v6.8.159', 'SKU-A17', 'a1b2c3d4',
  '9f8e7d6c5b4a39281706f5e4d3c2b1a0987654321', '!gn0re', 'a11', 'prev1ous', 'instruct!ons', '1gnor3'];

for (const t of TOKENS) {
  const guards = GUARDS.filter(g => g.re.test(t)).map(g => g.name);
  const leetChars = (t.match(/[01345789@$!+|]/g) || []).length;
  const letters = (t.match(/[a-zA-Z]/g) || []).length;
  console.log(`${t.padEnd(44)} leetChars=${leetChars} letters=${letters} guards=${guards.join('+') || 'NONE'}`);
}
