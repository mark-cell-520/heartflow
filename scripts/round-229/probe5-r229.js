// 定位剩余 3 条失败样本的族归属（只输出索引与命中片段）
'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const idx = require(__HF + '/src/index.js');
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
