/** r508：良性误伤定位（模块层） */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const samples = JSON.parse(fs.readFileSync(path.join(__dirname, '../test/round-507-standard-shift-samples.json'), 'utf8'));
const { gate } = require('../src/gate.js');
samples.benign.forEach((s, i) => {
  const r = gate(s);
  if (r.gate.action !== 'pass') {
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    console.log(`benign#${i + 1} action=${r.gate.action} dims=[${dims}] :: ${s}`);
  }
});
console.log('--- 模块层单独看 ---');
const { checkStandardShift } = require('../src/self-imposed-standard-shift.js');
samples.benign.forEach((s, i) => {
  const r = checkStandardShift(s);
  if (r.hit) console.log(`module benign#${i + 1} ${r.detail} :: ${s}`);
});
