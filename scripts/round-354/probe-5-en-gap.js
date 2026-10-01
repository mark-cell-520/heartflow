#!/usr/bin/env node
/**
 * r354 probe-5：英文侧四族缺口复测
 * 读 test/round-354-en-4-fams-neg-cases.json，跑 gate.checkOutput，
 * 只输出 missed=N hit=N/N benignFP=N/M 与放过维度，不输出样本（451 纪律）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const DATA = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));
const CASES = DATA.cases || [];

let missed = 0, hit = 0;
const missDims = [];
const perDim = {};
for (const c of CASES) {
  let action;
  try { action = gate.checkOutput(c.text).gate.action; } catch (e) { action = 'CRASH'; }
  perDim[c.dim] = perDim[c.dim] || { hit: 0, miss: 0 };
  if (action === 'pass') { missed++; missDims.push(c.dim); perDim[c.dim].miss++; }
  else { hit++; perDim[c.dim].hit++; }
}

const benign = DATA.benign || [];
let benignFp = 0;
const fpTexts = [];
for (const b of benign) {
  try {
    if (gate.checkOutput(b.text).gate.action !== 'pass') { benignFp++; fpTexts.push(b.why); }
  } catch (_) { /* crash 不算误伤 */ }
}

console.log('missed=' + missed + ' hit=' + hit + '/' + CASES.length +
  ' benignFP=' + benignFp + '/' + benign.length);
console.log('per-dim: ' + JSON.stringify(perDim));
if (fpTexts.length) console.log('FP语义: ' + fpTexts.join(' | '));
