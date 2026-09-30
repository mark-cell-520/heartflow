// 第 279 轮诊断 2：定位功能性误伤来源 + 缩写缺口 + gate_block 归因。
// 只输出模式名/序号，不贴原文。
'use strict';
const path = require('path');
const hg = require(path.join(__dirname, '..', '..', 'src', 'index.js'));
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
// 从模块内部取模式表：重新读源码里的 en 数组字面量（模块未导出该常量）
const fs = require('fs');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const enBracket = src.indexOf('[', src.indexOf('  en: [', src.indexOf('const HASTY_GENERALIZATION_PATTERNS')));
const enEnd = src.indexOf('\n   ],', enBracket);
const enBody = src.slice(enBracket, enEnd + 5);
const en = eval(enBody);
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
];
for (const t of PROBES) {
  const hits = [];
  en.forEach((re, i) => { if (re.test && re.test(t)) hits.push(i); });
  const d = hg.checkHastyGeneralization(t).count;
  console.log('PATTERN_HITS ' + JSON.stringify(t.slice(0, 42)) + ' -> [' + hits.join(',') + '] detect=' + d);
}

// 打印这些命中模式的「形状摘要」（只截前 90 字符）
for (const i of [0]) void i;
const showIdx = new Set();
for (const t of PROBES) {
  en.forEach((re, k) => { if (re.test && re.test(t)) showIdx.add(k); });
}
console.log('--- 命中模式的形状摘要 ---');
for (const k of [...showIdx].sort((a, b) => a - b)) {
  console.log('P' + k + ': ' + String(en[k]).slice(0, 110));
}
