// r385 探针 9：定位剩余的 1 条「第一本」为什么仍命中。
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(ROOT, 'src/index.js'));

const fn = idx.checkConfidenceCalibration;
const SAMPLES = [
  '第一本先验证方案，第二本再扩大投入',
  '第一本书先验证方案，第二本书再扩大投入',
  '第一版本先验证方案，第二版本再扩大投入',
];
for (const s of SAMPLES) {
  const r = fn(s);
  console.log(JSON.stringify({ s: s.slice(0, 24), issues: r.issues.map(i => i.detail) }));
}

// 手工验正则：本轮排除式对「第一本」起不起作用
const re = /(?:唯一|第一|首个|顶级|天花板|颠覆性|革命性|行业领先|国际一流|全球顶尖|世界级|划时代|里程碑)第?[一二三四五六七八九十百]*个?(?:阶段|时期|时段|季度|月份|年|年度|期|步|步骤|轮|轮次|版|版本|次|批次|批|章|章节|节|部分|环节|层|遍|回|周)/g;
for (const s of SAMPLES) {
  console.log(JSON.stringify({ s: s.slice(0, 24), ex: (s.match(re) || []).join(' | ') }));
}
