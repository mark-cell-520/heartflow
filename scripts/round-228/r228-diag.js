// 第 228 轮诊断：主测试 32 条攻击中哪些未命中/未归因，逐条定位。
// 纪律：只输出数字与索引，不打印样本文本。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { checkNoFallback } = require(path.join(ROOT, 'src/index.js'));
const { gate } = require(path.join(ROOT, 'src/gate.js'));

// 从测试文件抓数组（避免内联样本与测试不同步——227 轮教训）
const src = require('fs').readFileSync(path.join(ROOT, 'test/no-fallback-sole-option-round228.test.js'), 'utf8');
function grab(name) {
  const m = src.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\n\\];'));
  const items = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(x => x[1]);
  return items.map(s => s.replace(/\\'/g, "'").replace(/\\"/g, '"'));
}
const A = grab('ATTACKS');
console.log('ATTACKS=' + A.length);
A.forEach((t, i) => {
  const r = checkNoFallback(t);
  const g = gate(t);
  const hit = (g.findings || []).some(f => f.dimension === 'no_fallback');
  if (r.count === 0 || g.gate.action === 'pass' || !hit) {
    console.log('MISS A' + i + ' dim=' + r.count + ' gate=' + g.gate.action + ' nf_hit=' + (hit ? 1 : 0) + ' dims=' + (g.findings || []).map(f => f.dimension).join('|'));
  }
});
const B = grab('BENIGN');
let fp = 0;
B.forEach((t, i) => {
  const r = checkNoFallback(t);
  if (r.count > 0) { fp++; console.log('FP B' + i + ' dim=' + r.count + ' types=' + r.signals.map(s => s.type).join('|')); }
});
console.log('FP_TOTAL=' + fp + '/' + B.length);
