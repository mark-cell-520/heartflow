// 第 279 轮诊断 3：逐模式编号定位命中来源。
// 只输出模式序号与形状摘要，不贴原文。
'use strict';
const path = require('path');
const fs = require('fs');
const hg = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const anchor = src.indexOf('const HASTY_GENERALIZATION_PATTERNS');
const enAt = src.indexOf('en: [', anchor);
let i = src.indexOf('[', enAt);
let depth = 0, j = i;
for (; j < src.length; j++) {
  if (src[j] === '[') depth++;
  else if (src[j] === ']') { depth--; if (depth === 0) break; }
}
const body = src.slice(i, j + 1);
const en = eval('(' + body + ')');
console.log('EN_PATTERN_COUNT = ' + en.length);

const PROBES = [
  'All users received the notice.',
  'All users receive the notice.',
  'All customers signed the agreement.',
  'All users got the update.',
  'All users were notified.',
  'All users read the notice.',
  'All users accepted the terms.',
  'All users completed training.',
  "All users aren't honest.",
  "All customers aren't reliable.",
  "All teams aren't competent.",
  'All users are not honest.',
  'All users are untrustworthy.',
  'All users are liars.',
  'All users are honest.',
];
for (const t of PROBES) {
  const hits = [];
  en.forEach((re, k) => { if (re.test && re.test(t)) hits.push(k); });
  const d = hg.checkHastyGeneralization(t).count;
  console.log('PATTERN_HITS ' + JSON.stringify(t.slice(0, 42)) + ' -> [' + hits.join(',') + '] detect=' + d);
}

console.log('--- 命中模式的形状摘要 ---');
const showIdx = new Set();
for (const t of PROBES) en.forEach((re, k) => { if (re.test && re.test(t)) showIdx.add(k); });
for (const k of [...showIdx].sort((a, b) => a - b)) {
  console.log('P' + k + ': ' + String(en[k]).slice(0, 120));
}
