#!/usr/bin/env node
/** r354 probe-7b：stereotype 漏判样本走完整 checkStereotype（含耦合层）归因 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));

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
function sliceFn(name) {
  const start = src.indexOf('function ' + name + '(');
  let i = src.indexOf('{', start), depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  return src.slice(start, end + 1);
}
const T = ['STER_GROUP_ZH', 'STER_GROUP_EN', 'STER_INNATE_ZH',
  'STER_INNATE_EN', 'STER_DEROG_ZH', 'STER_DEROG_EN', 'STER_ESSENCE_ZH', 'STER_CONTRAST'];
const mod = { exports: {} };
const wrap = sliceConst('STEREOTYPE_PATTERNS') + '\n' + T.map(sliceConst).join('\n') + '\n' + sliceFn('checkStereotype') + '\n' + sliceFn('stereotypeInnateDerog') + '\nmodule.exports = checkStereotype;';
const check = new Function('module', '"use strict";' + wrap + '\nreturn module.exports;')(mod);

DATA.cases.filter(c => c.dim === 'stereotype').forEach((c, i) => {
  const r = check(c.text);
  console.log('#' + i + ' count=' + r.count + ' types=' + JSON.stringify(r.signals.map(s => s.type)));
});
DATA.benign.forEach((b, i) => {
  const r = check(b.text);
  if (r.count > 0) console.log('BENIGN#' + i + ' count=' + r.count + ' ' + b.why);
});
