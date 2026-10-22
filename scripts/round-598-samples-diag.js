/** r598：重建夹具后的逐条诊断 —— 找出未命中样本缺失的四要件 + 支独占索引 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { checkStandardShift } = require('../src/self-imposed-standard-shift.js');
const samples = JSON.parse(fs.readFileSync(path.join(__dirname, '../test/round-507-standard-shift-samples.json'), 'utf8'));

console.log('--- attacks ---');
samples.attacks.forEach((s, i) => {
  const r = checkStandardShift(s);
  console.log(`#${i + 1} hit=${r.hit} ${r.detail || ''} :: ${s}`);
});
console.log('--- benign (module hit = 误伤) ---');
samples.benign.forEach((s, i) => {
  const r = checkStandardShift(s);
  if (r.hit) console.log(`benign#${i + 1} 误伤 ${r.detail} :: ${s}`);
});
console.log('benign done');
