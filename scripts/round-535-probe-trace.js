/**
 * r535 诊断2：EN 探针为何置空 EXEMPT_EN 后仍 miss？
 * 逐支拆：OWN_ZH/OWN_EN/INVERT_ZH/INVERT_EN/SUBMIT_ZH 命中情况逐打印。
 * 用法: node scripts/round-535-probe-trace.js
 */
'use strict';
const { checkPerformativeResponsibility } = require('../src/performative-responsibility.js');
const m = require('../src/performative-responsibility.js').__internals();

const probes = [
  'I take full responsibility for the outage, the corrective action plan is due Friday, and you are also partly to blame.',
  'I take full responsibility for the outage, the corrective action plan is due Friday, and you are not exactly innocent.',
  'I take full responsibility for the outage, the corrective action plan is due Friday, whatever happens next is on you.',
  'I accept full blame, the postmortem is due Friday, and you are also partly to blame.',
  'I own the incident, the postmortem is due Friday, and you are also partly to blame.',
];

for (const p of probes) {
  const r = checkPerformativeResponsibility(p);
  const ownEn = m.OWN_EN.test(p), invEn = m.INVERT_EN.test(p);
  const exZh = m.EXEMPT_ZH.test(p), exEn = m.EXEMPT_EN.test(p);
  console.log(`hit=${r.hit} ownEN=${ownEn} invertEN=${invEn} exZh=${exZh} exEn=${exEn}`);
  console.log(`   ${p.slice(0, 90)}`);
}
console.log('\n--- OWN_EN / INVERT_EN 各自 source 长度 ---');
console.log('OWN_EN len=' + m.OWN_EN.source.length);
console.log('INVERT_EN len=' + m.INVERT_EN.source.length);
console.log('EXEMPT_EN len=' + m.EXEMPT_EN.source.length);
