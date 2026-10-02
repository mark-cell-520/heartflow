// r385 探针 3b：用 checkConfidenceCalibration 直调看 confidence 命中细节
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(ROOT, 'src/index.js'));

const fn = idx.checkConfidenceCalibration;
console.log('type:', typeof fn);

const SAMPLES = [
  '第一阶段先验证方案，第二阶段再扩大投入',
  '第一阶段先验证方案，第二阶段再逐步扩大投入',
  '毫无疑问这是最优选择，众所周知',
  '百分百确定，绝对没问题',
];

for (const s of SAMPLES) {
  const r = fn(s);
  console.log(JSON.stringify({
    sample: s.slice(0, 22),
    r: typeof r === 'object' ? r : r,
  }).slice(0, 600));
}
