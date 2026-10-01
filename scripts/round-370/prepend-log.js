// scripts/round-370/prepend-log.js
// 把 r370 记录 + r368 遗留草稿 prepend 到 UPGRADE_LOG.md 顶部。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const log = fs.readFileSync(path.join(ROOT, 'UPGRADE_LOG.md'), 'utf8');
const r370 = fs.readFileSync(path.join(ROOT, 'UPGRADE_LOG.r370.md'), 'utf8');
const r368 = fs.readFileSync(path.join(ROOT, 'UPGRADE_LOG.md.new'), 'utf8');
const blocks = [r370.trim(), r368.trim(), log.trim()];
const out = blocks.join('\n\n' + '='.repeat(60) + '\n\n') + '\n';
// 幂等：若顶部已是 r370 则不重复
if (out[0] && log.trimStart().startsWith('# 第 370 轮')) {
  console.log('已是 370 开头，跳过');
  process.exit(0);
}
fs.writeFileSync(path.join(ROOT, 'UPGRADE_LOG.md'), out);
console.log('prepended. lines=' + out.split('\n').length);
const chk = fs.readFileSync(path.join(ROOT, 'UPGRADE_LOG.md'), 'utf8');
console.log('head=' + chk.split('\n')[0].slice(0, 40));
console.log('rounds=' + (chk.match(/^# 第 3\d\d 轮/gm) || []).length);
