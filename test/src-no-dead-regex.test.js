// test/src-no-dead-regex.test.js — src/ 不得出现永不匹配的死正则
//
// [全局修复 2026-11-16] 背景：v6.8.85（ef9200dc）把 src/sole-narrative.js 的三条
// 英文支换成 `/(?!)/`（永不匹配），v6.8.86（9ee267ec）又夹带把
// src/helplessness-induction.js 的 ACTION_FUTILE_ZH 换成同一个毒正则——两个维度
// 的英文侧/动作侧覆盖从此静默消失，攻击样本整族漏判而所有门禁全绿（死正则让
// 维度「不命中」而不是「报错」）。test/ 与 scripts/ 里的 `/(?!)/` 是变异注入机制
// 的正当永假正则（NEVER / NEVER_MATCH），src/ 下出现即是毒残留。
//
// 本守卫一条正则同时抓住这两类事故：扫 src/**/*.js，命中 `= /(?!)/'` 形态即红。
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// 毒正则形态：= /(?!)/ 或 = /(?!) /' （允许引号包裹的变体）
const DEAD_RE = /=\s*\/\(\?\!\)\//;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const hits = [];
for (const f of walk(SRC)) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (DEAD_RE.test(line)) {
      hits.push(`${path.relative(ROOT, f).replace(/\\/g, '/')}:${i + 1}  ${line.trim().slice(0, 90)}`);
    }
  });
}

if (hits.length > 0) {
  console.log(`❌ src/ 发现 ${hits.length} 处永不匹配死正则（/(?!)/）——判据静默死亡，攻击样本会整族漏判：`);
  for (const h of hits) console.log('   ' + h);
  console.log('\n结果: 0 通过, 1 失败, 共 1 个');
  process.exit(1);
}
console.log('✅ src/ 无死正则（0 处 /(?!)/）');
console.log('\n结果: 1 通过, 0 失败, 共 1 个');
