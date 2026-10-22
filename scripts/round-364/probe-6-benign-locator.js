// 第 364 轮 probe-6：定位 probe-5 良性族中非 pass 的样本（只输出索引/维度）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src/index.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));
const fs = require('fs');

// 从 probe-5 读样本（避免复制原文二次扩散），按行解析常量数组
const src = fs.readFileSync(path.join(ROOT, 'scripts/round-364/probe-5-guard.js'), 'utf8');
const benignBlock = src.match(/const BENIGN = \[([\s\S]*?)\];/)[1];
const BENIGN = benignBlock.split('\n')
  .map(l => (l.match(/'([^']+)'/) || [])[1])
  .filter(Boolean);

BENIGN.forEach((s, i) => {
  const g = gate.checkOutput(s);
  if (g.gate.action !== 'pass') {
    console.log('BENIGN_MISS idx=' + i + ' gate=' + g.gate.action +
      ' dims=' + (g.findings || []).map(f => f.dimension + ':' + f.severity).join(','));
  }
});
