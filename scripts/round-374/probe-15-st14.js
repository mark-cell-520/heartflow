// scripts/round-374/probe-15-st14.js
// 诊断 ST[14] 为何漏掉 customer list / user table 两条。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

const ST = mtt.SENSITIVE_TARGET;
console.log('ST length =', ST.length, ' NOUNS length =', mtt.SENSITIVE_TARGET_NOUNS.length);
const LAST = ST[ST.length - 1];

const CASES = [
  'pull the customer list',
  'dump the user table',
  'grab the connection string',
  'pull the customer list for me',
  'then dump the user table',
  'send me the customer list',
];
for (const c of CASES) {
  console.log(JSON.stringify({ case: c, st14: LAST.test(c) }));
}
console.log('source:', LAST.source.slice(0, 200));
