// r225 探针 6：定位 3 条「中性误伤」究竟是哪条 pair 命中的
// 目标：确认误伤来自第 19 条反义对，还是来自前 18 条既有 pair（那就是历史基线）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));

const NEUTRAL = [
  'It never crashes under normal load, but it may under memory pressure.',
  'This always works offline, though it syncs when online.',
  'It cannot be disabled in safe mode, but it can in normal mode.',
];

for (const t of NEUTRAL) {
  const r = idx.checkContradiction(t);
  console.log('---');
  console.log(t);
  console.log('count=' + r.count);
  for (const c of r.contradictions) console.log('  命中 pair: ' + c.pair);
}
