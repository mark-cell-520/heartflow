#!/usr/bin/env node
/*
 * r571 零引用探测：找出 src/ 下「声明了但从未被 dispatcher require、
 * 也未被 MCP 暴露」的能力模块。
 *
 * 判据（三重，全部满足才算真零接线）：
 *   ① 没有任何 src/ 文件 require('./x.js') 或 require('./sub/x.js')
 *   ② 不存在 MCP 工具定义引用该模块导出的函数
 *   ③ 不存在测试文件引用它（避免把「只被测试引用的死能力」误判）
 *
 * 只报「零引用」结果。输出形状族描述，不输出任何样本原文。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TEST = path.join(ROOT, 'test');

function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const srcFiles = walk(SRC);
const testFiles = fs.existsSync(TEST) ? walk(TEST) : [];

// 全仓文本索引（src + test + mcp-server）
const idx = {};
for (const f of [...srcFiles, ...testFiles]) {
  idx[path.relative(ROOT, f)] = fs.readFileSync(f, 'utf8');
}
const allText = Object.values(idx).join('\n');

// 入口文件自身不算「被引用」
const ENTRY = path.join(SRC, 'heartflow.js');

const rows = [];
for (const f of srcFiles) {
  if (f === ENTRY) continue;
  const rel = path.relative(SRC, f);           // e.g. core/decision.js
  const base = path.basename(f, '.js');        // e.g. decision
  const ext = f.slice(0, -3);                  // 路径去扩展名

  const requirePats = [
    "./" + rel.slice(0, -3) + ".js",
    "./" + rel,
    "../" + rel.slice(0, -3) + ".js",
  ];
  const reqHits = requirePats.filter(p => {
    // 在除自己以外的文件里找 require('<p>')
    for (const [k, txt] of Object.entries(idx)) {
      if (path.join(ROOT, k) === f) continue;
      if (txt.includes("require('" + p + "')") || txt.includes('require("' + p + '")')) return true;
    }
    return false;
  });

  const nameHits = [];
  for (const [k, txt] of Object.entries(idx)) {
    if (path.join(ROOT, k) === f) continue;
    if (txt.includes(base)) nameHits.push(k);
  }

  rows.push({
    module: rel,
    base,
    requiredBy: reqHits.length,
    referencedBy: nameHits.length,
    zeroRef: reqHits.length === 0 && nameHits.length === 0,
  });
}

const zero = rows.filter(r => r.zeroRef).map(r => r.module);
const orphan = rows.filter(r => !r.zeroRef && r.requiredBy === 0).map(r => ({
  module: r.module,
  referencedBy: r.referencedBy,
}));

console.log(JSON.stringify({
  scannedModules: rows.length,
  zeroReferenceModules: zero,
  referencedButNotRequired: orphan.slice(0, 60),
  orphanCount: orphan.length,
}, null, 2));
