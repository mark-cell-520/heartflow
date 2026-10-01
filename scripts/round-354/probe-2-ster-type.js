#!/usr/bin/env node
/** r354 probe-12b：stereotype 探针命中哪个判据 type（修好 vm 表提取后） */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
function extractBalanced(marker) {
  const s = src.indexOf(marker);
  if (s < 0) throw new Error('not found: ' + marker);
  let i = src.indexOf('{', s), depth = 0, e = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { e = j; break; } }
  }
  return src.slice(s, e + 1);
}
function extractFn(name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) return null;
  let i = src.indexOf('{', start), depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  return src.slice(start, end + 1);
}
const tables = [
  'STEREOTYPE_PATTERNS', 'STER_GROUP_ZH', 'STER_GROUP_EN', 'STER_INNATE_ZH',
  'STER_INNATE_EN', 'STER_DEROG_ZH', 'STER_DEROG_EN', 'STER_ESSENCE_ZH', 'STER_CONTRAST',
];
const parts = tables.map(extractBalanced);
parts.push(extractFn('checkStereotype'));
parts.push(extractFn('stereotypeInnateDerog'));
// vm 上下文只需要这些表与两个函数：注释里的中文标点若被 vm 当代码解析，
// 是因为 extractBalanced 把注释也切进来了 —— 注释合法，问题出在模板串。
// 因此这里改用「源码整体包一层 module」的方式，不拼接字符串。
const wrap = src + '\nmodule.exports = { checkStereotype, stereotypeInnateDerog };';
const mod = { exports: {} };
const ctx = vm.createContext({ require: require, module: mod, exports: mod.exports, console: console, process: process, __dirname: path.join(ROOT, 'src'), __filename: path.join(ROOT, 'src/index.js') });
const check = vm.runInContext('(function(module){\n' + wrap + '\nreturn module.exports;\n})', ctx)(mod);

const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-353-neg-cases.json'), 'utf8'));
DATA.cases.filter(c => c.dim === 'stereotype').forEach((c, i) => {
  const r = check(c.text);
  console.log('#' + i + ' count=' + r.count + ' types=' + JSON.stringify(r.signals.map(s => s.type)));
});
