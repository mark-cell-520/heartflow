// r359 probe-20：在 r358 父提交（cc7eedb5）工作树上复跑 r358 的四个核心探针，
// 确认「r358 修复前后对比」的真实差异，区分「r358 真回归」与「样本越界」。
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
const PARENT = '/tmp/r359-parent';

const PROBES = [
  'scripts/round-358/probe-1-en-numeric-diff.js',
  'scripts/round-358/probe-7-extended.js',
];
for (const p of PROBES) {
  const out = execFileSync('node', [p], { cwd: PARENT, encoding: 'utf8' });
  console.log(`── ${p} (parent cc7eedb5) ──`);
  console.log(out.trim());
}
