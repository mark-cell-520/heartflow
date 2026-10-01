#!/usr/bin/env node
/** r354 probe-2b：stereotype 探针命中哪个判据 type（只报数字，不报样本） */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

// 从源码切出 const XX = ...（含跨行对象/数组字面量），用括号配对而非行切，
// 保证不把注释尾部/后续语句带进来造成 vm 语法错误。
function sliceConst(name) {
  const re = new RegExp('^const ' + name + ' =', 'm');
  const m = src.match(re);
  if (!m) throw new Error('const not found: ' + name);
  const start = m.index;
  let i = src.indexOf('=', start) + 1;
  while (i < src.length && /\s/.test(src[i])) i++;
  const open = src[i];
  const close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) throw new Error('not a literal: ' + name);
  let depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === open) depth++;
    else if (src[j] === close) { depth--; if (depth === 0) { end = j; break; } }
  }
  return src.slice(start, end + 1);
}

function sliceFn(name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('fn not found: ' + name);
  let i = src.indexOf('{', start), depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  return src.slice(start, end + 1);
}

const TABLES = [
  'STEREOTYPE_PATTERNS',
  'STER_GROUP_ZH', 'STER_GROUP_EN',
  'STER_INNATE_ZH', 'STER_INNATE_EN',
  'STER_DEROG_ZH', 'STER_DEROG_EN',
  'STER_ESSENCE_ZH', 'STER_CONTRAST',
];
const parts = TABLES.map(sliceConst);
parts.push(sliceFn('checkStereotype'));
parts.push(sliceFn('stereotypeInnateDerog'));
const wrap = parts.join('\n') + '\nmodule.exports = checkStereotype;';
const mod = { exports: {} };
const check = vm.runInNewContext('(function(module){\n' + wrap + '\nreturn module.exports;\n})')(mod);

const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-353-neg-cases.json'), 'utf8'));
DATA.cases.filter(c => c.dim === 'stereotype').forEach((c, i) => {
  const r = check(c.text);
  console.log('#' + i + ' count=' + r.count + ' types=' + JSON.stringify(r.signals.map(s => s.type)));
});
