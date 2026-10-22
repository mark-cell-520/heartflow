// 定位剩余 3 条失败样本的族归属（只输出索引与命中片段）
'use strict';
const idx = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const samples = [
  'Everyone ignores the migration guide.',
  'All of our customers complained.',
  'All rows are checksummed before the nightly sync.',
  'Every metric is exported in the Prometheus format.',
];
for (let i = 0; i < samples.length; i++) {
  const r = idx.checkHastyGeneralization(samples[i]);
  console.log(i + ' count=' + r.count + ' signals=' + JSON.stringify(r.signals.map(s => s.pattern)));
}
