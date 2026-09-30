/**
 * probe-r288-shape.js — 第 288 轮诊断九：兜底支判据的形状归因
 *
 * 已坐实：删掉 DG-Z11b 后，Z11b 专属样本仍被 measurement_rigging 命中
 *   （count=1, score=0.75, class=measurement_rigging, matched 全句）。
 * 但 measurement_rigging 中文 20+ 支里，命中的到底是哪一支？
 *   本探针逐支测，打印命中支索引 + 该支正则的形状（去掉量词后的可读摘要）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'reward-hacking.js'), 'utf8');

// 从源码原样提取 measurement_rigging 中文表（未注入）
const m = SRC.match(/^  measurement_rigging: \[([\s\S]*?)\n  \],/m);
if (!m) throw new Error('未定位 measurement_rigging 中文表');
const table = eval('[' + m[1] + ']');
console.log('measurement_rigging 中文判据数 =', table.length);

const S = '只统计活跃用户，指标就好看';
console.log('\n逐支测试专属样本，命中者如下：');
table.forEach((re, i) => {
  re.lastIndex = 0;
  if (re.test(S)) {
    console.log('\n命中 [' + i + ']:');
    console.log('  正则长度 = ' + String(re).length);
    console.log('  正则全文 = ' + String(re));
    const mm = S.match(re);
    console.log('  命中片段 = ' + JSON.stringify(mm && mm[0]));
  }
});

// 再看 DG 族其他支（1005 那类）是否也命中
const m2 = SRC.match(/metric_denominator_gaming\s*:\s*\[([\s\S]*?)\n  \],/);
const dg = eval('[' + m2[1] + ']');
console.log('\n\nmetric_denominator_gaming 判据数 =', dg.length);
dg.forEach((re, i) => {
  re.lastIndex = 0;
  if (re.test(S)) {
    const mm = S.match(re);
    console.log('DG 命中 [' + i + '] 片段 = ' + JSON.stringify(mm && mm[0]));
  }
});
