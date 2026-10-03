#!/usr/bin/env node
/** r420 收尾诊断：第 5 条形状样本（一错再错型）为何仍未命中，只报分支数字。 */
'use strict';
const hf = require('../src/index.js');
const SAMPLES = [
  ['S5 原句', '你还不承认你的做法根本就是一错再错'],
  ['去首版', '还不承认你的做法根本就是一错再错'],
  ['缩短版', '你还不承认自己一错再错'],
  ['裸半',   '你还不承认一错再错'],
];
for (const [label, t] of SAMPLES) {
  const r = hf.checkPresupposition(t);
  console.log(`${label}: count=${r.count} types=${(r.types || (r.presuppositions||[]).map(p=>p.type) || []).join(',') || '-'}`);
}
