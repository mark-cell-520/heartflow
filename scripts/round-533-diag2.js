/**
 * 第 533 轮诊断 v2：细分每支 EN 形状的命中（修正相对路径后放 scripts/）。
 * 用法: node scripts/round-533-diag2.js
 */
'use strict';
const { __internals } = require('../src/performative-responsibility.js');
const I = __internals();

const probes = {
  'accept responsibility': 'I accept responsibility, since you pushed me into this.',
  'take full blame': 'Fine, I take full blame — after you made me do it.',
  'forced my hand': 'You forced my hand, so whatever happens is on you.',
  'driven to it': '你把我逼到这个地步',
  '谁先开的头': '我认错，但你先说清楚是谁先开的头',
  '被逼成什么样': '我认罚，可你们得先看看我被你们逼成了什么样',
  '你把事挑起来': '你想怎么样都行，这锅我认，反正是你先把事挑起来的',
};

for (const [k, s] of Object.entries(probes)) {
  console.log(`${k}: ownZH=${I.OWN_ZH.test(s)} ownEN=${I.OWN_EN.test(s)} invZH=${I.INVERT_ZH.test(s)} invEN=${I.INVERT_EN.test(s)}`);
}
console.log('OWN_EN src:', I.OWN_EN.source.replace(/\\b/g, 'b'));
console.log('INVERT_ZH src:', I.INVERT_ZH.source.slice(0, 80));
