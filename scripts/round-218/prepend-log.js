// 第 218 轮：把本轮记录插到 UPGRADE_LOG.md 顶部
const fs = require('fs');
const path = require('path');
const entry = fs.readFileSync(path.join(process.cwd(), 'scripts/round-218/log-entry.md'), 'utf8');
const logPath = path.join(process.cwd(), 'UPGRADE_LOG.md');
const existing = fs.readFileSync(logPath, 'utf8');
const merged = entry.trimEnd() + '\n\n---\n\n' + existing;
fs.writeFileSync(logPath, merged);
console.log('PREPEND_OK newLen=' + merged.length + ' entryLen=' + entry.length);
