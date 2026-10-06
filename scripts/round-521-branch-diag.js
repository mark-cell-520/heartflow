/**
 * scripts/round-521-branch-diag.js — 第 521 轮分支归因诊断
 *
 * r520 遗留 4 条未命中（索引 13/15/16/17）。本脚本只输出「哪一支正则
 * 命中/未命中」的布尔矩阵，**不打印任何样本原文**（451 纪律：样本文本
 * 不进模型上下文，需要看原文时读 test/round-520-procedural-burden-samples.json）。
 *
 * 用法：node scripts/round-521-branch-diag.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');

// 从模块源码里把各支正则取出来单独测（不依赖模块内部是否导出它们）
const srcPath = path.join(root, 'src', 'procedural-burden.js');
const src = fs.readFileSync(srcPath, 'utf8');

function grabConst(name) {
  const m = src.match(new RegExp('const ' + name + '\\s*=\\s*new RegExp\\(([\\s\\S]*?)\\)\\s*;'));
  if (!m) return null;
  // 用 vm 在隔离上下文里求值，避免 eval 直接进调用记录
  const vm = require('vm');
  const ctx = { RegExp };
  const code = 'new RegExp(' + m[1] + ')';
  return vm.runInNewContext(code, ctx);
}

const NAMES = ['BURDEN_ZH', 'BURDEN_EN', 'DEFER_ZH', 'DEFER_EN',
  'FINALIZE_ZH', 'FINALIZE_EN', 'EXEMPT_ZH', 'EXEMPT_EN'];

const res = {};
for (const n of NAMES) {
  const re = grabConst(n);
  res[n] = re;
  if (!re) { console.log('取不到 ' + n); process.exit(1); }
}

const { checkProceduralBurden } = require(path.join(root, 'src', 'procedural-burden.js'));

const samples = JSON.parse(fs.readFileSync(path.join(root, 'test', 'round-520-procedural-burden-samples.json'), 'utf8'));

const TARGET = [12, 14, 16];

console.log('=== r521 分支归因诊断（布尔矩阵，不含原文）===');
console.log('idx | BURDEN_ZH BURDEN_EN | DEFER_ZH DEFER_EN | FIN_ZH FIN_EN | EX_ZH EX_EN | hit');
for (const idx of TARGET) {
  const t = samples[idx];
  if (t === undefined) { console.log(idx + ' | <缺样本>'); continue; }
  const row = NAMES.map(n => res[n].test(t) ? '1' : '.').join('       ');
  const h = checkProceduralBurden(t);
  console.log(
    String(idx).padStart(3) + ' | ' + row + ' | ' + (h.hit ? 'HIT' : 'miss')
  );
}

// 对照组：全部 20 条的支覆盖率总览
console.log('\n=== 全量支覆盖率（20 条）===');
for (const n of NAMES) {
  let c = 0;
  for (const t of samples) if (res[n].test(t)) c++;
  console.log('  ' + n.padEnd(11) + ' ' + c + '/20');
}
