#!/usr/bin/env node
/* r293 回归隔离实测：把插件切回改前版本（b8f4325），复跑两个可疑测试，
 * 确认其失败是否为本轮改动引入。用完立即还原。 */
'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');
const PLUGIN = '/data/home/heartflow/src/plugins/sycophancy-check/index.js';
const current = fs.readFileSync(PLUGIN, 'utf8');
const before = execFileSync('git', ['show', 'b8f4325:src/plugins/sycophancy-check/index.js'], { cwd: '/data/home/heartflow', encoding: 'utf8' });
try {
  fs.writeFileSync(PLUGIN, before);
  for (const t of ['test/round-710-tu-quoque.js', 'test/round-707-burden-shift-demand.js']) {
    const out = execFileSync('node', [t], { cwd: '/data/home/heartflow', encoding: 'utf8' });
    console.log(`[改前 b8f4325] ${t} =>`, out.trim().split('\n').slice(-1)[0]);
  }
} finally {
  fs.writeFileSync(PLUGIN, current);
}
console.log('还原校验:', fs.readFileSync(PLUGIN, 'utf8') === current ? '一致' : '不一致！');
