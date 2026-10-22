// 第 217 轮：把本轮记录插到 UPGRADE_LOG.md 顶部
const fs = require('fs');
const path = require('path');
const LOG = path.join(process.cwd(), 'UPGRADE_LOG.md');
const ENTRY = fs.readFileSync(path.join(process.cwd(), 'scripts/round-217/log-entry.md'), 'utf8');
const cur = fs.readFileSync(LOG, 'utf8');
fs.writeFileSync(LOG, ENTRY + '\n' + cur);
console.log('INSERTED, new length =', (ENTRY + '\n' + cur).length);
