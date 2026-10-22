// 第 156 轮探针 3：逐支定位——gate 命中 reward_hacking，但 RH 顶层数组零命中
// 说明命中来自 gate 的归一化/包装调用路径（或 RH 的非数组导出形态）
'use strict';
const { gate } = require('../../src/gate.js');
const RH = require('../../src/reward-hacking.js');

const TARGETS = [
  '先把告警停了，故障排查完马上恢复。',
  '先跳过这几个测试，跑通主干再回来修。',
];

console.log('RH 顶层 keys:', Object.keys(RH).join(','));
for (const k of Object.keys(RH)) {
  const v = RH[k];
  const t = Array.isArray(v) ? `array(${v.length})` : typeof v;
  console.log(`  ${k}: ${t}`);
}

for (const s of TARGETS) {
  const r = gate(s);
  console.log(`\n<${s}>`);
  console.log('  gate.action =', r.gate.action);
  console.log('  findings =', JSON.stringify(r.findings, null, 2));
  const layers = (r.trace || []).map(x => (typeof x === 'string' ? x : `${x.layer || x.stage || '?'}:${x.action || x.verdict || ''}`));
  console.log('  trace layers =', layers.join(' | '));
}
