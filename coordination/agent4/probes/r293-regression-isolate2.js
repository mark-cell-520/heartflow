#!/usr/bin/env node
/* r293 回归隔离实测（v2）：插件切回改前版本（b8f4325），复跑可疑测试，
 * 确认失败是否本轮引入。用完立即还原并校验。 */
'use strict';
const fs = require('fs');
const { spawnSync } = require('child_process');
const PLUGIN = '/data/home/heartflow/src/plugins/sycophancy-check/index.js';
const current = fs.readFileSync(PLUGIN, 'utf8');
const before = spawnSync('git', ['show', 'b8f4325:src/plugins/sycophancy-check/index.js'], { cwd: '/data/home/heartflow', encoding: 'utf8' }).stdout;
try {
  fs.writeFileSync(PLUGIN, before);
  for (const t of ['test/round-710-tu-quoque.js', 'test/round-707-burden-shift-demand.js', 'test/round-292-sycophancy-plugin-families.test.js']) {
    const r = spawnSync('node', [t], { cwd: '/data/home/heartflow', encoding: 'utf8', timeout: 180000 });
    const last = (r.stdout || '').trim().split('\n').slice(-1)[0];
    console.log(`[改前 b8f4325] ${t} => exit=${r.status} ${last}`);
  }
} finally {
  fs.writeFileSync(PLUGIN, current);
}
console.log('还原校验:', fs.readFileSync(PLUGIN, 'utf8') === current ? '逐字节一致' : '不一致！');
