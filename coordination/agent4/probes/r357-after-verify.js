'use strict';
// r357 落地后冒烟验证：四个候选在集成树上的 gate 行为 + __internals 登记。
const hf = require('/data/home/heartflow/src/gate.js');
const itb = require('/data/home/heartflow/src/immortal-time-bias.js');
const R = itb.__internals();
console.log('登记检查: DETECT_UP_ZH7=%s CASE_SURGE_ZH7=%s INCIDENCE_CLAIM_ZH4=%s CASE_SURGE_ZH6[0].source含猛然=%s',
  !!R.DETECT_UP_ZH7, !!R.CASE_SURGE_ZH7, !!R.INCIDENCE_CLAIM_ZH4,
  R.CASE_SURGE_ZH6[0].source.includes('猛然'));
const atk = [
  ['B 腿①', '检查技术突飞猛进后，大量病例被重新发现，这说明这种病真的在变多。'],
  ['D 腿②', '普筛开展后，病例数屡创新高，表明患病率真的在升高。'],
  ['C 腿③', '筛查普及让更多病例被检出，患病率呈抬头趋势。'],
  ['A 副词', '检查普及以来，众多隐匿病灶被猛然发现，说明患病率真的在上升。'],
];
for (const [tag, t] of atk) {
  const r = hf.gate(t);
  console.log(tag, '[' + r.gate.action + ']', '::', t.slice(0, 32), '::', (r.findings || []).map(f => f.dimension).join(','));
}
