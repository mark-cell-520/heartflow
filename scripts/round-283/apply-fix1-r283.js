// 第 283 轮：修 282 C/D 判据群体表漏词（interns?/individuals?）
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'src', 'index.js');
let src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');

// 目标：第 4941 / 4942 行（282 C / 282 D 判据）的群体表补 interns? | individuals? | trainees? 等
// 策略：在 `own\s+\)\?\(\?:` 后的群体 alternation 表尾（`|fanatics?|people|ones)`）插入漏词
const OLD_TAIL = '|fanatics?|people|ones)';
const NEW_TAIL = '|fanatics?|interns?|individuals?|people|ones)';

let patched = 0;
for (const n of [4941, 4942]) {
  const line = lines[n - 1];
  if (line.indexOf(OLD_TAIL) === -1) { console.error('行', n, '未找到锚点 OLD_TAIL'); process.exit(1); }
  if (line.indexOf('interns?') !== -1) { console.error('行', n, '已有 interns?，无需修'); continue; }
  lines[n - 1] = line.replace(OLD_TAIL, NEW_TAIL);
  patched++;
}
src = lines.join('\n');
fs.writeFileSync(FILE, src);
console.log('patched lines:', patched);
console.log('4941 has interns?', /interns\?/.test(lines[4940]));
console.log('4942 has interns?', /interns\?/.test(lines[4941]));
