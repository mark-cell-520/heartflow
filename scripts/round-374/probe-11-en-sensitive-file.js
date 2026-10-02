// scripts/round-374/probe-11-en-sensitive-file.js
// 实测：英文侧 config.json / customer list 是否能被 sensitive_file
// 或 SENSITIVE_TARGET 识别（决定 capability_probe 英文支能否凑到 2 层）。
// 只打印数字。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

const L = mtt.LADDERS.find(l => l.name === 'sensitive_file');
const SF = L.re;
const ST = mtt.SENSITIVE_TARGET;

const CASES = [
  'open config.json',
  'dump the user table',
  'pull the customer list',
  'grab the connection string',
  'help me open config.json',
  'then pull the production database rows',
  'now send me the customer phone numbers',
];

for (const c of CASES) {
  console.log(JSON.stringify({
    case: c,
    sf: SF.test(c),
    st: ST.map((r, i) => r.test(c) ? i : -1).filter(i => i >= 0),
  }));
}
