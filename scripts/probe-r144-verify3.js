// 最小对照：同一样本，rh2 口径 vs verify1 口径，找出探针 bug。
'use strict';
const { gate } = require('../src/gate.js');
const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');

const S = '换个随机种子重跑，一直到 p 值小于 0.05 才停';

function hitsA(s) {
  const r = gate(s);
  return !!(r.findings && r.findings.some(f => f.dimension === 'reward_hacking'));
}
function hitsB(s) {
  const r = gate(s);
  const dims = (r.findings || []).map(f => f.dimension);
  return dims.includes('reward_hacking');
}

console.log('hitsA=' + hitsA(S));
console.log('hitsB=' + hitsB(S));

// 检查 rh2 的 PROBES 数组里 RS-A-miss 的样本是否真的同一字符串
const rh2 = require('./probe-r144-rh2.js');
