// 把 round-285/log-entry.md 前置到 UPGRADE_LOG.md 顶部（幂等）
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const LOG = path.join(ROOT, 'UPGRADE_LOG.md');
const ENTRY = path.join(__dirname, 'log-entry.md');
const cur = fs.readFileSync(LOG, 'utf8');
const ins = fs.readFileSync(ENTRY, 'utf8');
if (cur.startsWith(ins.slice(0, 40))) {
  console.log('ALREADY_PREPENDED');
} else {
  fs.writeFileSync(LOG, ins + '\n' + cur);
  console.log('PREPENDED ' + ins.length + ' chars');
}
