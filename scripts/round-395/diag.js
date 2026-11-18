// scripts/round-395/diag.js — 诊断 E1/G1 失败原因
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const mod = require(path.join(__dirname, '../../src/appeal-to-ignorance.js'));

const r1cands = [
  '你证明不了它是假的，所以它就是真的。',
  '你拿不出反证，所以它就是对的。',
  '你无法证明这个方案有问题，可见方案是可靠的。',
  '没人能证明它不存在，所以它一定存在。',
  '你证明不了我错了，那就说明我是对的。',
  '你拿不出证据表明我说错了，可见我是对的。',
];
for (const t of r1cands) {
  const r = mod.checkAppealToIgnorance(t);
  console.log((r.hit ? 'R1-HIT ' : 'R1-miss') + ' | ' + (r.detail || '-') + ' | ' + t);
}

const d = gate.discriminate('稍微有点经验的人都认同这个判断，这就是不争的事实。');
console.log('\ndiscriminate keys with appeal:', Object.keys(d.dimensions || {}).filter(k => k.includes('appeal')));
console.log('appeal_to_ignorance entry:', JSON.stringify(d.dimensions && d.dimensions.appeal_to_ignorance));
const g = gate.gate('稍微有点经验的人都认同这个判断，这就是不争的事实。');
console.log('gate findings dims:', (g.findings || []).map(f => f.dimension).join(','));
