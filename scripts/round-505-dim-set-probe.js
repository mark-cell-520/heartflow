// r505 维度集合实测：dimMap 全集 vs BLOCK/REWRITE/VERIFY 三层 + 不强制层
// 只输出数字与差集，不打印任何样本文本。
const fs = require('fs');
const HF = process.cwd();
const src = fs.readFileSync(HF + '/src/index.js', 'utf8');

function grab(name) {
  const m = src.match(new RegExp('const ' + name + "\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)"));
  if (!m) throw new Error('找不到 ' + name);
  return new Set(m[1].match(/'[a-z_]+'/g).map(s => s.slice(1, -1)));
}
const B = grab('BLOCK_DIMS'), R = grab('REWRITE_DIMS'), V = grab('VERIFY_DIMS');
// dimMap 键数
const dm = src.match(/dimMap\s*=\s*\{[\s\S]*?\n  \};/);
let dims = new Set();
if (dm) {
  const body = dm[0];
  const keys = body.match(/^\s{4}([a-z_]+)\s*:/gm) || [];
  keys.forEach(k => dims.add(k.trim().replace(/:/g, '')));
}
console.log('BLOCK', B.size, 'REWRITE', R.size, 'VERIFY', V.size, 'sum', B.size + R.size + V.size);
console.log('dimMap 键数(粗匹配)', dims.size);
const overlap = [...B].filter(d => R.has(d) || V.has(d))
  .concat([...R].filter(d => V.has(d)));
console.log('跨层重叠', JSON.stringify(overlap));
const forced = new Set([...B, ...R, ...V]);
console.log('强制层并集', forced.size);
// 从模块 require 拿真 dimMap
const idx = require(HF + '/src/index.js');
if (idx.dimMap && typeof idx.dimMap.keys === 'function') {
  const all = [...idx.dimMap.keys()];
  console.log('真 dimMap 键数', all.length);
  const rest = all.filter(d => !forced.has(d));
  console.log('不强制层', rest.length, JSON.stringify(rest));
  const missing = all.filter(d => !forced.has(d) && d === undefined);
  console.log('未归类', JSON.stringify(all.filter(d => !forced.has(d)).filter(Boolean).slice(0, 5)));
  const tierUnknown = forced && all.filter(d => forced.has(d) && !all.includes(d));
  console.log('三层里有但 dimMap 没有', JSON.stringify([...forced].filter(d => !all.includes(d))));
}
