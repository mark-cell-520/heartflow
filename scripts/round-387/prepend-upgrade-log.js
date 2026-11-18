// scripts/round-387/prepend-upgrade-log.js — r387 条目插入 UPGRADE_LOG.md 顶部
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const LOG = path.join(ROOT, 'UPGRADE_LOG.md');
const ENTRY = path.join(__dirname, 'upgrade-log-entry.md');

const head = fs.readFileSync(LOG, 'utf8');
const entry = fs.readFileSync(ENTRY, 'utf8').replace(/\s+$/, '\n');
if (head.startsWith('## r387 —')) {
  console.log('[prepend] r387 条目已在顶部，跳过');
  process.exit(0);
}
fs.writeFileSync(LOG, entry + '\n' + head);
console.log('[prepend] UPGRADE_LOG.md 插入 r387 条目（' + entry.length + ' chars），总长 ' + (entry.length + 1 + head.length));
const check = fs.readFileSync(LOG, 'utf8');
console.log('[prepend] 顶部首行: ' + check.split('\n')[0].slice(0, 60));
const order = [...check.matchAll(/^## (r\d+)/gm)].map(m => m[1]).slice(0, 6);
console.log('[prepend] 现序（前 6）: ' + order.join(' -> '));
