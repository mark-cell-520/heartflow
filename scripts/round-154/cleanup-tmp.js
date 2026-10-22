// 清理本轮探针在 src/shield/ 下遗留的临时副本目录
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'src', 'shield');
for (const name of fs.readdirSync(DIR)) {
  if (!name.startsWith('.awt154-tmp-')) continue;
  const p = path.join(DIR, name);
  if (!fs.statSync(p).isDirectory()) continue;
  for (const f of fs.readdirSync(p)) fs.rmSync(path.join(p, f), { force: true });
  fs.rmdirSync(p);
  console.log('已清理 ' + name);
}
console.log('清理完成');
