// 第 281 轮探针 13：gate-benchmark.js 的 SAMPLES 结构
'use strict';
const gb = require('/root/.hermes/skills/ai/mark-heartflow-skill/test/gate-benchmark.js');
console.log('SAMPLES_type', typeof gb.SAMPLES, Array.isArray(gb.SAMPLES), gb.SAMPLES && gb.SAMPLES.constructor && gb.SAMPLES.constructor.name);
if (gb.SAMPLES && typeof gb.SAMPLES === 'object') {
  const k = Object.keys(gb.SAMPLES);
  console.log('keys', k.join(','));
  const first = k[0];
  const v = gb.SAMPLES[first];
  console.log('first_val_type', typeof v, Array.isArray(v));
  if (Array.isArray(v)) console.log('first_item', JSON.stringify(v[0]).slice(0, 120));
}
console.log('EXPECT', JSON.stringify(gb.EXPECT).slice(0, 200));
