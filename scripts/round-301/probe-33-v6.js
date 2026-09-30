const fs = require('fs');
const L = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js', 'utf8').split('\n');
const start = L.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let end = -1;
for (let i = start + 1; i < L.length; i++) { if (L[i].trim() === '];') { end = i; break; } }
const arr = eval('[' + L.slice(start + 1, end).join('\n') + ']');
const SRC = arr[19].source;

// V5：只改第一处（「不是」之后的 A 侧），字符串 replace 精确锁定
const A_BEFORE = '\\u4e0d\\u662f[^\\u3002\\uff01\\uff1f\\n]{1,20}';
const A_AFTER = '\\u4e0d\\u662f[^\\u3002\\uff01\\uff1f\\n\\u662f]{1,20}';
const V5 = new RegExp(SRC.replace(A_BEFORE, A_AFTER));

const P = {
  P3: '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5149\u3002',
  // 候选「光」的同族后缀（都在表内名词之外，但形态同为「B 侧修身名词」）
  G1: '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5fae\u5149\u3002',
  G2: '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5149\u4eae\u3002',
  G3: '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u706f\u3002',
  G4: '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5e0c\u671b\u3002',
};
console.log('V5 原句(光): ' + V5.test(P.P3));
for (const k of ['G1', 'G2', 'G3', 'G4']) console.log('V5 ' + k + ': ' + V5.test(P[k]));

// 关键：把 B 侧名词表补「光/微光/亮/灯/希望」后再测
const V6 = new RegExp(SRC.replace(A_BEFORE, A_AFTER)
  .replace('\\u7ad9\\u8d77\\u6765', '\\u7ad9\\u8d77\\u6765|\\u5149|\\u5fae\\u5149|\\u4eae|\\u706f|\\u5e0c\\u671b'));
console.log('--- 补「光/微光/亮/灯/希望」后 ---');
for (const k of ['P3', 'G1', 'G2', 'G3', 'G4']) console.log('V6 ' + k + ': ' + V6.test(P[k]));
