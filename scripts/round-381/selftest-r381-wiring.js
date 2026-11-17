'use strict';
// r381 接线自测：gate 桥 + 插件层接线验证。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkEconReasoningGate, FAMILIES } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

console.log('gate FAMILIES:', FAMILIES.length, '（含 lump_of_labor:', FAMILIES.some(f => f.key === 'lump_of_labor'), '）');
const ATK = '机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的，自动化的尽头是大规模失业。';
const r = checkEconReasoningGate(ATK);
console.log('gate hit:', r.hit, '| families:', r.families.map(f => f.key).join(','), '| score:', r.score);
console.log('plugin version:', plugin.version, '| families:', plugin.FAMILIES.length,
  '| econ:', plugin.FAMILIES.filter(f => f.group === 'econ').length,
  '| stats:', plugin.FAMILIES.filter(f => f.group === 'stats').length);
const ATK2 = '移民抢走了本地人的饭碗，一个人占了坑，另一个人就只能失业，工作总量就那么多。';
const pa = plugin.analyze(ATK2);
console.log('plugin analyze:', pa.totalHits, '| families:', pa.families.map(f => f.key).join(','));
const BEN = '劳动总量谬误把就业看成固定份额的争夺，忽略了自动化在降低成本的同时会创造新的需求与岗位。';
const pb = plugin.analyze(BEN);
console.log('plugin analyze benign:', pb.totalHits);
const rb = checkEconReasoningGate(BEN);
console.log('gate benign hit:', rb.hit);
