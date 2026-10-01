// r362 探针 4：检查 discriminate() 返回结构，确认 pseudo_causal 命中字段形态
'use strict';
const idx = require('../../src/index.js');
const samples = [
  '由于换了招财头像，这个月的订单明显多了',
  'Thanks to my lucky shirt, the promotion came through',
];
for (const t of samples) {
  const d = idx.discriminate(t);
  console.log('dimensions.pseudo_causal = ' + JSON.stringify(d.dimensions && d.dimensions.pseudo_causal));
  const f = (d.findings || []).find(x => x.dimension === 'pseudo_causal');
  console.log('  findings.pseudo_causal = ' + (f ? JSON.stringify(f).slice(0, 120) : 'none'));
}
