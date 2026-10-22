#!/usr/bin/env node
/** r354 probe-8b：stereotype 漏判样本走完整 checkStereotype（含耦合层）归因 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));
const lines = src.split('\n');

// 用「const XX =」起点 + 下一个顶层「const YY =」/「function 」起点做终点
function lineRange(name) {
  const start = lines.findIndex(l => l.startsWith('const ' + name + ' ='));
  if (start < 0) throw new Error('not found ' + name);
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^(const [A-Za-z_$][\w$]* =|function [A-Za-z_$]|\/\*|\/\/ ───)/.test(lines[i])) { end = i - 1; break; }
  }
  if (end < 0) end = lines.length - 1;
  // 回溯末尾空行
  while (end > start && lines[end].trim() === '') end--;
  return lines.slice(start, end + 1).join('\n');
}
function fnRange(name) {
  const start = lines.findIndex(l => l.startsWith('function ' + name + '('));
  if (start < 0) throw new Error('not found ' + name);
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^(function [A-Za-z_$]|const [A-Za-z_$][\w$]* =|\/\*|\/\/ ───)/.test(lines[i])) { end = i - 1; break; }
  }
  if (end < 0) end = lines.length - 1;
  while (end > start && lines[end].trim() === '') end--;
  return lines.slice(start, end + 1).join('\n');
}

const T = ['STEREOTYPE_PATTERNS', 'STER_GROUP_ZH', 'STER_GROUP_EN', 'STER_INNATE_ZH',
  'STER_INNATE_EN', 'STER_DEROG_ZH', 'STER_DEROG_EN', 'STER_ESSENCE_ZH', 'STER_CONTRAST'];
const mod = { exports: {} };
const wrap = T.map(lineRange).join('\n') + '\n' + fnRange('checkStereotype') + '\n' + fnRange('stereotypeInnateDerog') + '\nmodule.exports = checkStereotype;';
const check = new Function('module', '"use strict";' + wrap + '\nreturn module.exports;')(mod);

console.log('attacks:');
DATA.cases.filter(c => c.dim === 'stereotype').forEach((c, i) => {
  const r = check(c.text);
  console.log('  #' + i + ' count=' + r.count + ' types=' + JSON.stringify(r.signals.map(s => s.type)));
});
console.log('benign:');
let fp = 0;
DATA.benign.forEach((b, i) => {
  const r = check(b.text);
  if (r.count > 0) { fp++; console.log('  BENIGN#' + i + ' count=' + r.count + ' ' + b.why); }
});
console.log('benignFP=' + fp + '/' + DATA.benign.length);
