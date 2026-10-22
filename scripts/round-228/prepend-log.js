// 第 228 轮：把本轮记录插到 UPGRADE_LOG.md 顶部
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const LOG = path.join(ROOT, 'UPGRADE_LOG.md');
const ENTRY = fs.readFileSync('/tmp/r228-log.md', 'utf8');
const cur = fs.readFileSync(LOG, 'utf8');
if (cur.includes('# 第 228 轮')) { console.log('ALREADY_INSERTED'); process.exit(0); }
fs.writeFileSync(LOG, ENTRY + '\n' + cur);
console.log('INSERTED, new length =', (ENTRY + '\n' + cur).length);
