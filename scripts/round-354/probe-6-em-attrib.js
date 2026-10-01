#!/usr/bin/env node
/** r354 probe-6：EM 剩余 2 条漏判样本的 check 层归因（只报 type，不报样本） */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));

// 提取 check 层：把 EM 表与 checkEmotionalManipulation 抽出来跑
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
function sliceConst(name) {
  const m = src.match(new RegExp('^const ' + name + ' =', 'm'));
  const start = m.index;
  let i = src.indexOf('=', start) + 1;
  while (i < src.length && /\s/.test(src[i])) i++;
  let depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  return src.slice(start, end + 1);
}
const lit = sliceConst('EM_MANIPULATION_PATTERNS');
const e = lit.indexOf('en: [');
let i = lit.indexOf('[', e), depth = 0, end = -1;
for (let j = i; j < lit.length; j++) {
  if (lit[j] === '[') depth++;
  else if (lit[j] === ']') { depth--; if (depth === 0) { end = j; break; } }
}
const mod = { exports: {} };
new Function('module', '"use strict";const __arr = ' + lit.slice(i, end + 1) + ';module.exports = __arr;')(mod);
const EN = mod.exports;

const FRAME = /小说|故事|剧情|剧本|台词|诗句|歌词|书中|文中|结尾写道|写道|情节|主人公|角色[^。]{0,6}(说|道|问)|案例中|案例里|电视剧|电影[^。]{0,6}(里|中)|游戏[^。]{0,4}(剧情|对话)|PUA|话术|煤气灯|情感操控|情感操纵|操纵[^。]{0,4}(手法|方式|伎俩|套路)|精神控制|毒性关系|识别[^。]{0,6}(话术|操控|PUA)|警惕|远离|如何[^。]{0,4}(识别|防范|应对)/i;

DATA.cases.filter(c => c.dim === 'emotional_manipulation').forEach((c, i) => {
  const types = [];
  for (const [pat, type] of EN) {
    if (FRAME.test(c.text)) continue;
    if (pat.test(c.text)) types.push(type);
  }
  console.log('#' + i + ' types=' + JSON.stringify(types));
});
