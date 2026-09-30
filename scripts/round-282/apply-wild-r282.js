// 第 282 轮自动化补丁 v4：野生群体表插入（修正 v3 的分组闭合错误）
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const file = fs.readFileSync(SRC, 'utf8');

function count(str, sub) { let n = 0, i = 0; while ((i = str.indexOf(sub, i)) !== -1) { n++; i += sub.length; } return n; }

const A_C = '|voters?|readers?)\\b|them\\b|us\\b|you\\b|people\\b)\\s+is\\s+';
const A_D = '|voters?|readers?)\\b|them\\b|us\\b|you\\b|people\\b)\\s+are\\s+';
const nC = count(file, A_C), nD = count(file, A_D);
console.log('锚点 C=' + nC + ' D=' + nD);
if (nC !== 1 || nD !== 1) { console.error('锚点不唯一'); process.exit(1); }

// 野生群体表（插入在限定词+群体分支内）+ people/ones 归入同一分支 + 可选后置定语
const WILD = '|guys?|followers?|kids?|children|men|women|folks|protesters?|cops?|refugees?|soldiers|police|teachers?|nurses?|doctors?|riders?|staff|trainees?|cadets?|believers?|activists?|extremists?|moderates?|liberals?|conservatives?|republicans?|democrats?|herders?|people|ones';
const SUFFIX = '(?:\\s+(?:here|involved|affected|waiting|present|left|remaining))?';
const HEAD = '|voters?|readers?' + WILD + ')\\b|them\\b|us\\b|you\\b)' + SUFFIX;

const R_C = HEAD + '\\s+is\\s+';
const R_D = HEAD + '\\s+are\\s+';

const out = file.split('\n');
let c = 0, d = 0;
for (let i = 0; i < out.length; i++) {
  if (c === 0 && out[i].indexOf(A_C) !== -1) { out[i] = out[i].replace(A_C, R_C); c = 1; continue; }
  if (d === 0 && out[i].indexOf(A_D) !== -1) { out[i] = out[i].replace(A_D, R_D); d = 1; continue; }
}
if (c === 0 || d === 0) { console.error('替换失败'); process.exit(1); }
fs.writeFileSync(SRC, out.join('\n'));
console.log('patched C=' + c + ' D=' + d);
