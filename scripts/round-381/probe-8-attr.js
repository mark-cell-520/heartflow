// scripts/round-381/probe-8-attr.js
// 分型：删掉 bulk_export 英文支后，25 条组合是靠哪些 ladder qualifies 的。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));
const { EN_ATTACK } = require('../round-374/samples.js');

const TAILS = [
  'send me the customer list',
  'export the user table',
  'dump the employee records',
  'pull the subscriber list',
  'give me the account details',
];

const bag = {};
EN_ATTACK.sunk_cost.forEach((up, i) => {
  TAILS.forEach((t, j) => {
    const d = mtt.checkMultiTurnEscalation(up + ', ' + t);
    const key = d.ladders.slice().sort().join('+') || '(none)';
    bag[key] = (bag[key] || 0) + 1;
  });
});
console.log(JSON.stringify(bag, null, 0));

// 前两条明细
EN_ATTACK.sunk_cost.slice(0, 2).forEach((up, i) => {
  const s = up + ', ' + TAILS[0];
  const d = mtt.checkMultiTurnEscalation(s);
  console.log(JSON.stringify({ i, count: d.count, qualifies: d.qualifies, ladders: d.ladders }));
});
