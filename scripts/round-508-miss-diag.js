/** 诊断：4 条未命中样本的四要件实况（索引修正版） */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const samples = JSON.parse(fs.readFileSync(path.join(__dirname, '../test/round-507-standard-shift-samples.json'), 'utf8'));
const { checkStandardShift } = require('../src/self-imposed-standard-shift.js');

const idxs = [10, 14, 15, 16];
for (const i of idxs) {
  const r = checkStandardShift(samples.attacks[i]);
  console.log(`#${i + 1} hit=${r.hit} detail=${r.detail} :: ${samples.attacks[i]}`);
}
console.log('--- benign ---');
samples.benign.forEach((s, i) => {
  const r = checkStandardShift(s);
  if (r.hit) console.log(`benign#${i + 1} 误伤 :: ${s}`);
});
console.log('benign done');
