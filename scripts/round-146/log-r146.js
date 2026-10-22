// 第 146 轮收尾：把本轮记录插到 UPGRADE_LOG.md 顶部（用脚本，不用 patch）
'use strict';
const fs = require('fs');
const path = require('path');
const REPO = path.join(__dirname, '../..');
const LOG = path.join(REPO, 'UPGRADE_LOG.md');
const HEAD = fs.readFileSync('/root/.hermes/cache/scratch/r146-log-head.md', 'utf8');

const cur = fs.readFileSync(LOG, 'utf8');
if (cur.includes('## 第 146 轮')) {
  console.error('UPGRADE_LOG 已含第 146 轮记录，中止（防重复插入）。');
  process.exit(1);
}
fs.writeFileSync(LOG, HEAD + cur, 'utf8');
console.log('插入完成。UPGRADE_LOG 行数:', fs.readFileSync(LOG, 'utf8').split('\n').length);
console.log('首行:', fs.readFileSync(LOG, 'utf8').split('\n')[0].slice(0, 40));
