// [r372 probe-6] 扫 src/ 内零外部引用的模块（orphan），排除 index/heartflow 等入口
// 与被聚合导出的文件。输出模块名、行数、引用它的文件数。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

const files = fs.readdirSync(SRC).filter(f => f.endsWith('.js'));
const idx = files.indexOf('index.js');
const hf = files.indexOf('heartflow.js');
const names = [];
for (const f of files) names.push(f.replace(/\.js$/, ''));

// 统计每个名字在其他文件里被 require 的次数
const refCount = {};
const contents = {};
for (const f of files) {
  const p = path.join(SRC, f);
  const c = fs.readFileSync(p, 'utf8');
  contents[f] = c;
}
const ENTRY = new Set(['index', 'heartflow', 'gate']);
for (const n of names) {
  let cnt = 0;
  const re = new RegExp("require\\(['\"]\\./" + n + "(?:\\.js)?['\"]\\)", 'g');
  for (const f of files) {
    if (f === n + '.js') continue;
    const m = contents[f].match(re);
    if (m) cnt += m.length;
  }
  refCount[n] = cnt;
}
const orphans = [];
for (const n of names) {
  if (ENTRY.has(n)) continue;
  if (refCount[n] === 0) {
    const lines = contents[n + '.js'].split('\n').length;
    const bytes = fs.statSync(path.join(SRC, n + '.js')).size;
    orphans.push({ n, lines, bytes });
  }
}
orphans.sort((a, b) => b.lines - a.lines);
console.log('orphan total = ' + orphans.length);
for (const o of orphans) console.log(`${o.n}  lines=${o.lines}  bytes=${o.bytes}`);
