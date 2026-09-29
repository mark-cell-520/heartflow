// 把本轮交接簿 prepend 到 UPGRADE_LOG.md 顶部
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const LOG = path.join(ROOT, 'UPGRADE_LOG.md');
const PRE = path.join(__dirname, 'log-prepend.md');

const existing = fs.readFileSync(LOG, 'utf8');
const prepend = fs.readFileSync(PRE, 'utf8');
// 现有内容首行是 "\n"（前几轮的排版），去掉避免出现三个连续空行
const body = existing.replace(/^\n+/, '');
fs.writeFileSync(LOG, prepend.replace(/\s+$/, '\n') + '\n' + body);
console.log('UPGRADE_LOG.md 已 prepend，现共 ' + fs.readFileSync(LOG, 'utf8').split('\n').length + ' 行');
