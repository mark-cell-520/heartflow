// 探针 297-10：定位「这不是某个人的错，是系统设计本身有缺陷」被哪条判据命中
'use strict';
const path = require('path');
const fs = require('fs');

// 直接从 src/index.js 抽 PSEUDO_PHILOSOPHY_ZH + zh 判据做单条匹配
const src = fs.readFileSync(path.join(__dirname, '../../src/index.js'), 'utf8');
const start = src.indexOf('const PSEUDO_PHILOSOPHY_ZH = [');
const end = src.indexOf('\n];', start);
const body = src.slice(start, end);
const res = [];
const re = /\/((?:[^\/\\\n]|\\.)+)\/(?=[,;\s\]])/g;
let m;
while ((m = re.exec(body)) !== null) {
  try { res.push(new RegExp(m[1])); } catch (e) { /* 跳过 */ }
}
console.log('抽到 PSEUDO_PHILOSOPHY_ZH 判据数 = ' + res.length);

const sample = '这不是某个人的错，是系统设计本身有缺陷。';
for (const p of res) {
  if (p.test(sample)) console.log('命中判据: ' + p.source.slice(0, 110));
}

// 同时看 PSEUDO_PROFUNDITY_PATTERNS.zh 侧
const { checkPseudoProfundity } = (() => {
  // 通过 gate 侧导出不可见，改用维度函数间接暴露：读 global 不行，直接全量看
  return {};
})();
const r = require(path.join(__dirname, '../../src/gate.js')).checkOutput(sample);
console.log('gate 结论: action=' + r.gate.action + ' score=' + r.overallScore);
console.log('findings: ' + JSON.stringify((r.findings || []).map(f => f.dimension)));
console.log('checked_by: ' + JSON.stringify(r.checked_by));
