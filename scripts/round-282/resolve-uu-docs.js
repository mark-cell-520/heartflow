// 解文档类 UU 冲突：上游侧(ours)与本地侧(theirs)两轮工作都保留。
// 顺序：ours(上游 r280) 在前，theirs(本地 r281/r282) 在后。
// 用法: node resolve-uu-docs.js <file>
'use strict';
const fs = require('fs');
const file = process.argv[2];
if (!file) { console.error('usage: node resolve-uu-docs.js <file>'); process.exit(1); }
const p = '/root/hermes1/skills/ai/mark-heartflow-skill/' + file;
const raw = fs.readFileSync(p, 'utf8');
const RE = /<<<<<<< Updated upstream\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> Stashed changes/g;
if (!/<<<<<<< /.test(raw)) { console.log(file + ': 无冲突标记，跳过'); process.exit(0); }
let n = 0;
const out = raw.replace(RE, (whole, ours, theirs) => {
  n++;
  console.log(`  [${file}] 块${n}: ours ${ours.length} chars / theirs ${theirs.length} chars → 两侧保留`);
  return ours + '\n' + theirs;
});
if (n === 0) { console.error(file + ': 有标记但正则未匹配，需人工检查'); process.exit(1); }
if (/<<<<<<< |=======$|>>>>>>> /.test(out)) { console.error(file + ': 解后仍残留标记'); process.exit(1); }
fs.writeFileSync(p, out);
console.log(file + ': 解冲突完成，块数=' + n);
