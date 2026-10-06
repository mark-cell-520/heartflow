/**
 * scripts/round-521-regex-check.js — 正则字面量排查（不含样本原文）
 * 直接构造与模块源码一致的正则，逐支测试各诊断句，输出布尔值。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src', 'procedural-burden.js'), 'utf8');

function grabConst(name) {
  const m = src.match(new RegExp('const ' + name + '\\s*=\\s*new RegExp\\(([\\s\\S]*?)\\);\\n'));
  if (!m) return null;
  return vm.runInNewContext('new RegExp(' + m[1] + ')', { RegExp });
}

const samples = JSON.parse(fs.readFileSync(path.join(root, 'test', 'round-520-procedural-burden-samples.json'), 'utf8'));

const probes = [
  ['一切以委员会决议为准', '(?:一切|所有|全部)(?:以|按|照)(?:委员会|董事会|办公会|党组会|领导|上级|主管|总部|决议|裁定|决定)(?:为准|为算|说来|执行)'],
  ['not up for discussion', '\\bnot\\s+(?:up\\s+for\\s+(?:discussion|debate)|negotiable|open\\s+to\\s+discussion)'],
  ['this is not up for', '\\bnot\\s+up\\s+for\\s+(?:discussion|debate)'],
];

console.log('=== 正则字面量逐支排查 ===');
for (const [label, pat] of probes) {
  const re = new RegExp(pat);
  const hits = samples.map((t, i) => re.test(t) ? i : -1).filter(i => i >= 0);
  console.log(label.padEnd(28) + ' → ' + (hits.length ? hits.join(',') : '无命中') + '  (source=' + re.source.slice(0, 60) + ')');
}

console.log('\n=== 模块源码中的 FINALIZE_ZH 实际定义 ===');
const m = src.match(/const FINALIZE_ZH[\s\S]*?\]\.join\('\|'\);/);
if (m) console.log(m[0].split('\n').slice(0, 12).join('\n'));
