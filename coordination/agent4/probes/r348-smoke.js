'use strict';
// r348 冒烟：ZH B 族（trending 结论腿中文侧）攻击/豁免快证 + 官方语料预扫。
const path = require('node:path');
const ROOT = '/data/home/heartflow';
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

const ZH_B = [
  '筛查普及后确诊人数激增，发病率呈现上升趋势。',
  '新发病例数翻倍，这种病呈现出高发趋势。',
  '体检普及之后确诊病例激增，可见患病率步入上升通道。',
];
for (const s of ZH_B) {
  const r = checkImmortalTimeBias(s);
  const g = gate(s);
  console.log((r.hit ? 'HIT ' : 'MISS') + ' | gate=' + g.gate.action + ' | ' + s);
  if (r.hit) console.log('     detail: ' + r.detail);
}
// 官方四基准语料模块级路径 h 预扫（新族落地后零误伤确认）
function flatten(mod) {
  const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
  return out.filter(s => typeof s === 'string');
}
let n = 0, fp = 0; const hits = [];
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
    n++;
    const r = checkImmortalTimeBias(s);
    if (r.hit && (r.detail.includes('过度诊断发生率误读') || r.detail.includes('overdiagnosis-incidence'))) { fp++; hits.push(s.slice(0, 60)); }
  }
}
console.log('官方语料 ' + n + ' 条，路径 h 命中 ' + fp + ' 条' + (fp ? ': ' + hits.join(' | ') : ''));
