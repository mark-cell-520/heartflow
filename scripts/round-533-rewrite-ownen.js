'use strict';
// 用行级拼接（不是 join('|') 的元素内换行）重写 OWN_EN，避免字符串内双反斜杠。
// 判据形状不变，只改写法：每条支单独一行，最后 join。
const fs = require('fs');
let src = fs.readFileSync('src/performative-responsibility.js', 'utf8');
const start = src.indexOf("const OWN_EN = new RegExp([");
const end = src.indexOf("], 'i');", start) + "], 'i');".length;
const replacement = [
  "const OWN_EN = new RegExp([",
  "  // I/we accept/take/shoulder/own/assume (full|all) responsibility|blame|accountability",
  "  '(?:i|we)[\\\\s]+(?:accept|take|shoulder|own|assume)[\\\\s]+(?:full[\\\\s]+|all[\\\\s]+)?(?:responsibility|blame|accountability|the[\\\\s]+blame|the[\\\\s]+fault)',",
  "  // my fault / our fault",
  "  '(?:my|our)[\\\\s]+fault\\\\b',",
  "  // it is all my fault / it is entirely our doing",
  "  'it[\\\\s]+is[\\\\s]+(?:all|entirely)[\\\\s]+(?:my|our)[\\\\s]+(?:fault|responsibility|doing)',",
  "  // I am fully responsible / I was to blame",
  "  'i[\\\\s]+(?:am|was)[\\\\s]+(?:fully[\\\\s]+|entirely[\\\\s]+)?(?:responsible|to[\\\\s]+blame|at[\\\\s]+fault)',",
  "  // blame it on me / blame me entirely",
  "  'blame[\\\\s]+(?:it[\\\\s]+on[\\\\s]+me|me[\\\\s]+entirely)',",
  "  // the inversion is spoken by the speaker: I forced my own hand",
  "  '(?:i|we)[\\\\s]+(?:forced|pushed)[\\\\s]+(?:my|your|their)[\\\\s]+own[\\\\s]+hand',",
  "  // accompanied form of \\\"you made me do it\\\"",
  "  'i[\\\\s]+(?:am|was)[\\\\s]+(?:forced|made)[\\\\s]+to[\\\\s]+(?:do|accept|take)[\\\\s]+(?:it|this|the[\\\\s]+blame)',",
  "  '(?:i|we)[\\\\s]+(?:accept|took)[\\\\s]+(?:full[\\\\s]+|all[\\\\s]+)?(?:blame|responsibility)',",
  "].join('|'), 'i');",
].join('\n');
src = src.slice(0, start) + replacement + src.slice(end);
fs.writeFileSync('src/performative-responsibility.js', src);
console.log('rewritten');
