const fs = require('fs');
const L = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js', 'utf8').split('\n');
const start = L.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let end = -1;
for (let i = start + 1; i < L.length; i++) { if (L[i].trim() === '];') { end = i; break; } }
const arr = eval('[' + L.slice(start + 1, end).join('\n') + ']');
const SRC = arr[19].source;

const P3 = '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5149\u3002';
// 诊断1：B 侧名词表里到底有没有「光」(u5149)？
console.log('名词表含 u5149(光): ' + SRC.includes('\\u5149'));
// 诊断2：把 B 侧换成表内已有名词，看 V5 结构是否就能命中
const V5 = new RegExp(SRC.replace(/\[\^\\u3002\\uff01\\uff1f\\n\]\{1,20\}/, '[^\\u3002\\uff01\\uff1f\\n\\u662f]{1,20}'));
console.log('V5 对原句命中: ' + V5.test(P3));
console.log('V5 对「眼里还有觉悟」命中: ' + V5.test('\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u89c9\u609f\u3002'));
console.log('V5 对「眼里还有微光」命中: ' + V5.test('\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5fae\u5149\u3002'));
console.log('V5 对「心里有慈悲」(r301注释句) 命中: ' + V5.test('\u4ece\u5bb9\u4e0d\u662f\u4e0d\u6025\uff0c\u662f\u5fc3\u91cc\u6709\u6148\u60b2\u3002'));
// 诊断3：列出 B 侧名词表全部成员，便于判断该不该补「光/微光」
const iNoun = SRC.indexOf('(?:\\u89c9\\u609f');
const tail = SRC.slice(iNoun);
const nouns = tail.match(/\\u[0-9a-f]{4}/g) || [];
console.log('B 侧名词组成员数: ' + nouns.length);
console.log('B 侧名词组成员: ' + nouns.map(n => JSON.parse('"' + n + '"')).join(' '));
