#!/usr/bin/env node
/**
 * r354 probe-4：r353 四族判据的英文侧覆盖测试
 * 只输出数字（命中数 / 总数），不输出样本内容（451 纪律）。
 * 判据实现方式：直接 require src/index.js 后在内部表上匹配 ——
 * 但 zh 分支会被中文字符路由走，故本探针用纯英文样本走 en 分支。
 * 做法：取出各 PATTERNS 的 en 数组逐条 match（与 check* 内循环同构）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

function sliceConst(name) {
  const m = src.match(new RegExp('^const ' + name + ' =', 'm'));
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

// 四张表：en 分支
const TABLES = {
  presupposition: 'PRESUPPOSITION_PATTERNS',
  emotional_manipulation: 'EMOTIONAL_MANIPULATION_PATTERNS',
  stereotype: 'STEREOTYPE_PATTERNS',
  tone_policing: 'TONE_POLICING_PATTERNS',
};
// 形状族定义（与 r353 zh 侧四族一一对应的英文形状，原文在 test/ 里）
const FAMS = {
  presupposition: ['presupposed_ongoing_wrongdoing'],
  emotional_manipulation: ['benevolence_leverage'],
  stereotype: ['group_negative_trait'],
  tone_policing: ['zh_tone_imperative_rational'],
};

// 取每张表的 en 数组字面量
function enEntries(dim) {
  const name = TABLES[dim];
  const lit = sliceConst(name);
  const segs = {};
  // 从字面量里用括号配对切出 zh: [...] 与 en: [...]
  for (const key of ['zh', 'en']) {
    const re = new RegExp('\\n\\s*' + key + ':');
    const m = lit.match(re);
    if (!m) continue;
    let i = m.index + m[0].length;
    while (i < lit.length && /\s/.test(lit[i])) i++;
    if (lit[i] !== '[') continue;
    let depth = 0, end = -1;
    for (let j = i; j < lit.length; j++) {
      if (lit[j] === '[') depth++;
      else if (lit[j] === ']') { depth--; if (depth === 0) { end = j; break; } }
    }
    segs[key] = lit.slice(i, end + 1);
  }
  return segs;
}

// 把数组字面量求值为 [ [regex, type] , ... ] / [ {pattern,type} ... ]
function evalEntries(lit) {
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  const fn = new Function('module', '"use strict";' + lit + '\nmodule.exports = __arr;');
  // 上面 __arr 不存在，改用 wrapper
  const fn2 = new Function('module', '"use strict";const __arr = ' + lit + ';\nmodule.exports = __arr;');
  fn2(mod);
  return mod.exports;
}

const result = {};
for (const dim of Object.keys(TABLES)) {
  const segs = enEntries(dim);
  const enArr = evalEntries(segs.en);
  const enTypes = enArr.map(e => (Array.isArray(e) ? e[1] : e.type));
  result[dim] = {
    en_total: enArr.length,
    en_has_family: FAMS[dim].filter(t => enTypes.includes(t)),
    en_types_sample: enTypes.slice(0, 8),
  };
}
console.log(JSON.stringify(result, null, 2));
