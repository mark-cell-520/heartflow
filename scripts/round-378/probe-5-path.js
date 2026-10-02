// r378 probe-5：为什么 checkOutput 路径下 dimensions.multi_turn_escalation 读不到
// index.js 里已登记，probe-4 走 idx.discriminate 直接调有值——怀疑 checkOutput
// 走 gate.js 的独立轻量路径或包装层丢了 dimensions。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

const fs = require('fs');
const scanSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'dimension-coverage-scan.js'), 'utf8');
const m = scanSrc.match(/multi_turn_escalation:\s*\[([\s\S]*?)\]/);
const probes = m[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));

for (const p of probes) {
  const r = gate.checkOutput(p);
  console.log('════ checkOutput 长度', p.length, 'action', r.gate.action);
  console.log('  data keys:', JSON.stringify(Object.keys(r.data || {})));
  const dd = (r.data || {}).discriminate;
  console.log('  data.discriminate keys:', dd ? JSON.stringify(Object.keys(dd)) : 'none');
  const dims = dd && dd.dimensions;
  console.log('  data.discriminate.dimensions 有 mte?', dims ? ('multi_turn_escalation' in dims) : 'n/a');
  console.log('  data.discriminate.dimensions keys 数:', dims ? Object.keys(dims).length : 'n/a');
  // 对比直接 discriminate
  const d2 = idx.discriminate(p);
  console.log('  idx.discriminate mte:', JSON.stringify(d2.dimensions.multi_turn_escalation).slice(0, 80));
  console.log('  idx.discriminate dims 数:', Object.keys(d2.dimensions).length);
}

// gate.js 里 checkOutput 的 dimensions 从哪来
const gsrc = fs.readFileSync(path.join(ROOT, 'src/gate.js'), 'utf8');
const i = gsrc.indexOf('data: {');
console.log('\ngate.js data: { 上下文:');
console.log(gsrc.slice(Math.max(0, i - 400), i + 300));
