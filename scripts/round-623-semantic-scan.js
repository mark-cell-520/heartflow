#!/usr/bin/env node
/**
 * round-623-semantic-scan.js
 *
 * ③ 类候选池的系统化探针（静态语义筛选，非脑内模拟）。
 *
 * 背景：upgrade-scout.sh 只扫「攻击族覆盖」，连续 5 轮为空；
 * r622 的黑盒输入/输出分化探针只抽样了 ~110/700 方法（约 15%），
 * 且两次被 120s 前台超时截断，留下 6 个实例未测。
 *
 * 本脚本换一条更有效率的路径：**静态语义筛选**。
 * 遍历 src/ 下所有模块，找「方法名/类JSDoc 含辨别语义关键词
 * （score/assess/judge/evaluate/detect/discriminate/rate/risk/
 *  validate/verdict/grade/anomaly/suspect/flag）的导出类」，
 * 再与 heartflow.js 的 dispatch 引用做差集，输出「有辨别语义
 * 但零 dispatch 引用」的候选清单 + 每个候选的方法名列表。
 *
 * 这一步是**发现**，不是**判定**：命中语义只是候选，
 * 真分化仍需黑盒探针或直接读判据确认（下一步）。
 *
 * 用法：node scripts/round-623-semantic-scan.js > /tmp/r623-semantic.json
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const JUDGE_WORDS = [
  'score', 'assess', 'judge', 'evaluat', 'detect', 'discrimin',
  'rate', 'risk', 'validat', 'verdict', 'grade', 'anomaly',
  'suspect', 'flag', 'mislead', 'deceiv', 'fallacy', 'bias',
  'manipulat', 'coerc', 'overclaim', 'unverif', 'inconsist',
];

// 1) 收集所有 src 模块
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(SRC, []);

// 2) 每文件抽 class 名 + 方法名 + class 首行 JSDoc
function extract(file) {
  const text = fs.readFileSync(file, 'utf8');
  const classes = [];
  // class X ... {  （含 module.exports 形式另行处理）
  const classRe = /class\s+([A-Z][A-Za-z0-9_]*)/g;
  let m;
  while ((m = classRe.exec(text)) !== null) classes.push(m[1]);
  // 方法名：缩进的方法定义
  const methods = [];
  const methRe = /^\s{2,}(?:async\s+)?([a-z_][A-Za-z0-9_]*)\s*\(/gm;
  while ((m = methRe.exec(text)) !== null) methods.push(m[1]);
  return { file: path.relative(ROOT, file), classes, methods, text };
}

const modules = files.map(extract);

// 3) 引用面：引擎主文件 heartflow.js（注意在 src/core/ 下）+ 分发器 + 引用出口
//    r623 铁律：主文件是 src/core/heartflow.js，不是 src/heartflow.js。
//    引用面口径 = 主文件全文 + engine-dispatcher.js（generateAllowedRoutes 的路由表）
const REF_FILES = [
  path.join(SRC, 'core', 'heartflow.js'),
  path.join(SRC, 'core', 'engine-dispatcher.js'),
  path.join(SRC, 'core', 'engine-constructor.js'),
  path.join(SRC, 'gate.js'),
  path.join(SRC, 'pipeline.js'),
];
const refText = REF_FILES.filter(f => fs.existsSync(f))
  .map(f => fs.readFileSync(f, 'utf8')).join('\n');

// 4) 判定：含辨别语义方法的 class，且类名在引用面出现 <=0 次
const cands = [];
for (const mod of modules) {
  if (mod.file === 'src/heartflow.js') continue;
  const judgeMethods = mod.methods.filter(mn =>
    JUDGE_WORDS.some(w => mn.toLowerCase().includes(w)));
  if (judgeMethods.length === 0) continue;
  // 引用计数：类名在引用面出现的次数
  const refCount = mod.classes.reduce((n, cn) => {
    const re = new RegExp('\\b' + cn + '\\b', 'g');
    return n + ((refText.match(re) || []).length);
  }, 0);
  cands.push({
    file: mod.file,
    classes: mod.classes,
    methods_total: mod.methods.length,
    judge_methods: judgeMethods,
    judge_method_count: judgeMethods.length,
    ref_count: refCount,
    zero_ref: refCount === 0,
  });
}

cands.sort((a, b) => b.judge_method_count - a.judge_method_count);

const zero = cands.filter(c => c.zero_ref);
const summary = {
  scanned_files: modules.length,
  modules_with_judge_methods: cands.length,
  zero_ref_modules: zero.length,
  zero_ref_candidates: zero,
  ref_but_maybe_unused: cands.filter(c => !c.zero_ref).slice(0, 40),
};
process.stdout.write(JSON.stringify(summary, null, 2));
