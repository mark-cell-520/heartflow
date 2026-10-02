// r385 探针 3：定位 confidence 维度在哪一层命中，看命中的是哪个子正则。
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(ROOT, 'src/index.js'));

const SAMPLES = [
  '第一阶段先验证方案，第二阶段再扩大投入',
  '第一阶段先验证方案，第二阶段再逐步扩大投入',
  '毫无疑问这是最优选择，众所周知',
  '百分百确定，绝对没问题',
];

const conf = idx.confidence || idx.confidenceCheck;
console.log('exports keys:', Object.keys(idx).filter(k => /conf/i.test(k)).join(', '));
if (typeof conf === 'function') {
  for (const s of SAMPLES) {
    const r = conf(s);
    console.log(JSON.stringify({ sample: s.slice(0, 22), r: typeof r === 'object' ? JSON.stringify(r).slice(0, 300) : r }));
  }
} else {
  console.log('confidence export type:', typeof conf);
}
