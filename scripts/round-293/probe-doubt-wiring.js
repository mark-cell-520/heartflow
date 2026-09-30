/**
 * r293 探针 3b：doubt-engine 在管线里的接线方式
 *
 * 探针 3 显示 checkOutput 对 defensiveness 5 个样本判 block 而 gate 直调判 pass。
 * 要判断这是「跨形态不对称」还是「doubt-engine 只在管线里跑」的结构差异，
 * 必须知道 pipeline.js 到底怎么调 doubt。
 */
const fs = require('fs');
const path = require('path');
const P = (...a) => console.log(...a);
const F = path.resolve(__dirname, '..', '..', 'src', 'pipeline.js');
const txt = fs.readFileSync(F, 'utf8').split('\n');

P('══════ r293 探针 3b：pipeline.js 的 doubt 调用点 ══════');
txt.forEach((l, i) => {
  if (/doubt/i.test(l)) P(`  L${i + 1}: ${l.trim().slice(0, 120)}`);
});

P('\n═══ gate.js 是否引 doubt ═══');
const G = path.resolve(__dirname, '..', '..', 'src', 'gate.js');
fs.readFileSync(G, 'utf8').split('\n').forEach((l, i) => {
  if (/doubt/i.test(l)) P(`  gate.js L${i + 1}: ${l.trim().slice(0, 120)}`);
});

P('\n═══ text-normalizer 的 toHalfWidthSafe ═══');
const N = path.resolve(__dirname, '..', '..', 'src', 'text-normalizer.js');
fs.readFileSync(N, 'utf8').split('\n').forEach((l, i) => {
  if (/toHalfWidthSafe|FF0C|3002/.test(l)) P(`  normalizer L${i + 1}: ${l.trim().slice(0, 130)}`);
});
