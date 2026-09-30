// 第 228 轮诊断二：逐条打印漏判样本文本（形状定位用，输出仅落盘不在报告内引用）。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { checkNoFallback } = require(path.join(ROOT, 'src/index.js'));
const { gate } = require(path.join(ROOT, 'src/gate.js'));
const src = require('fs').readFileSync(path.join(ROOT, 'test/no-fallback-sole-option-round228.test.js'), 'utf8');
function grab(name) {
  const m = src.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\n\\];'));
  return [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(x => x[1].replace(/\\'/g, "'"));
}
const A = grab('ATTACKS');
[13, 14, 18, 21, 26, 27, 30].forEach(i => console.log('A' + i + ' = ' + A[i]));
