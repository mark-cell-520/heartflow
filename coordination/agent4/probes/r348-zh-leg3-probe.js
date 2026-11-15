'use strict';
// r348 ZH 腿③真缺口探针 + 否定形良性 FP 检查（在 r348 引擎上跑）。
const path = require('node:path');
const ROOT = '/data/home/heartflow';
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const I = __internals();

// 既有 INCIDENCE_CLAIM_ZH（r346 旧 7 形）逐形命中检查
const old = I.INCIDENCE_CLAIM_ZH;
const probes = [
  '筛查普及后确诊人数激增，发病率不断攀升。',
  '体检普及之后确诊病例激增，患病率持续飙升。',
  '筛查普及后新发病例翻倍，发病率呈现上升趋势。',
  '普筛上线后病例数激增，可见患病率步入上升通道。',
  '筛查普及后确诊人数激增，但发病率并没有攀升。',
  'Screening tripled diagnosed cases, but the incidence has not climbed.',
  'Case counts jumped after screening, yet the disease has not been trending upward.',
];
for (const s of probes) {
  const r = checkImmortalTimeBias(s);
  let carried = [];
  for (const [k, v] of Object.entries(I)) {
    if (!Array.isArray(v)) continue;
    for (let i = 0; i < v.length; i++) {
      const re = new RegExp(v[i].source, v[i].flags.includes('g') ? v[i].flags : v[i].flags + 'g');
      const m = s.match(re);
      if (m) carried.push(k + '#' + i);
    }
  }
  console.log((r.hit ? 'HIT ' : 'MISS') + ' | ' + s + '\n     承重: ' + (carried.join(', ') || '(无)'));
}
// 旧腿③表逐形核对：哪些动词在旧表
console.log('\n旧 INCIDENCE_CLAIM_ZH 动词覆盖: 上升/升高/提高/上涨/增长/走高/变高（p1）；攀升/飙升 不在表内');
