#!/usr/bin/env node
/* r623 模块级导出函数扫描（r622 只探过 class 实例方法，这一类从未被探过）
 *
 * 问题：r622 的黑盒探针只覆盖 class 实例的方法。但 src/ 下有大量模块
 * 用「module.exports = { fn1, fn2 }」导出**模块级函数**，这些函数如果
 * 从未被 require 过，就是「声明了但从未被 dispatch 调用过的能力」——
 * 正是 v6.8.0 铁律第 ③ 类真升级的定义。
 *
 * 本脚本：抽每个模块导出的函数名 → 全仓 require 引用计数 → 输出 0 引用清单。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const allFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'archive' || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) allFiles.push(p);
  }
})(ROOT);

const blobByFile = new Map();
for (const f of allFiles) blobByFile.set(f, fs.readFileSync(f, 'utf8'));

// 源模块：只扫 src/ 下（排除 test/ scripts/ skills/）
const srcFiles = allFiles.filter(f => f.startsWith(path.join(ROOT, 'src')));

// 抽出 src 下每个模块的 exports 对象 key
function extractExportNames(file, text) {
  const names = new Set();
  // module.exports = { a, b, c } 或 module.exports.name = ...
  const re1 = /module\.exports\s*=\s*\{([^}]*)\}/g;
  let m;
  while ((m = re1.exec(text)) !== null) {
    for (const part of m[1].split(',')) {
      const nm = part.split(':').pop().trim().replace(/^['"]|['"]$/g, '');
      if (/^[A-Za-z_$][\w$]*$/.test(nm)) names.add(nm);
    }
  }
  const re2 = /module\.exports\.([A-Za-z_$][\w$]*)\s*=/g;
  while ((m = re2.exec(text)) !== null) names.add(m[1]);
  // exports.xxx =
  const re3 = /^exports\.([A-Za-z_$][\w$]*)\s*=/gm;
  while ((m = re3.exec(text)) !== null) names.add(m[1]);
  return [...names];
}

// 全仓引用：任意 .js 文本里出现该标识符（排除自身文件）
function refCount(name) {
  let total = 0; const files = [];
  const re = new RegExp('\\b' + name + '\\b', 'g');
  for (const [f, t] of blobByFile) {
    if (f === srcFileBeingScanned) continue;
    const c = (t.match(re) || []).length;
    if (c > 0) { total += c; files.push(path.relative(ROOT, f)); }
  }
  return { total, files };
}

let srcFileBeingScanned = null;
const out = [];
for (const f of srcFiles) {
  srcFileBeingScanned = f;
  const text = blobByFile.get(f);
  const names = extractExportNames(f, text);
  if (names.length === 0) continue;
  const zero = [];
  for (const n of names) {
    const r = refCount(n);
    if (r.total === 0) zero.push(n);
  }
  if (zero.length > 0) {
    out.push({ file: path.relative(ROOT, f), exported_total: names.length, zero_ref: zero });
  }
}
out.sort((a, b) => b.zero_ref.length - a.zero_ref.length);
console.log(JSON.stringify({ scanned_src_files: srcFiles.length, zero_ref_modules: out.length, out }, null, 2));
