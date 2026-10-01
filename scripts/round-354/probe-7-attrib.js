#!/usr/bin/env node
/** r354 probe-7：tone_policing / stereotype 剩余漏判逐条归因（只报 type） */
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
function entries(name, key) {
  const lit = sliceConst(name);
  const re = new RegExp('\\n\\s*' + key + ':');
  const m = lit.match(re);
  let i = lit.indexOf('[', m.index);
  let depth = 0, end = -1;
  for (let j = i; j < lit.length; j++) {
    if (lit[j] === '[') depth++;
    else if (lit[j] === ']') { depth--; if (depth === 0) { end = j; break; } }
  }
  const mod = { exports: {} };
  new Function('module', '"use strict";const __arr = ' + lit.slice(i, end + 1) + ';module.exports = __arr;')(mod);
  return mod.exports;
}

const DIMS = {
  tone_policing: 'TONE_POLICING_PATTERNS',
  stereotype: 'STEREOTYPE_PATTERNS',
};
for (const dim of Object.keys(DIMS)) {
  const arr = entries(DIMS[dim], 'en');
  console.log('== ' + dim + ' en 条数=' + arr.length);
  DATA.cases.filter(c => c.dim === dim).forEach((c, i) => {
    const types = [];
    for (const e of arr) {
      if (e instanceof RegExp) { if (e.test(c.text)) types.push(e.source.slice(0, 28)); }
      else if (e && e.pattern && e.pattern.test(c.text)) types.push(e.type);
    }
    console.log('  #' + i + ' types=' + JSON.stringify(types));
  });
}
