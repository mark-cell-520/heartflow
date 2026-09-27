// 第 146 轮收尾：归档本次轮探针脚本 + 失败探针（v1~v7）到 scripts/round-146/
// 归档动作本身不产生逻辑改动，只把 round-146 的 v1~v7 探针（含口径 bug 版本）
// 与 insert 脚本统一留档，供下一轮复核。
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const REPO = path.join(__dirname, '../..');
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));
console.log('round-146 留档文件:');
for (const f of files) {
  const st = fs.statSync(path.join(__dirname, f));
  console.log(`  ${f}  ${st.size}B`);
}
const out = cp.execSync('git status --short', { cwd: REPO, encoding: 'utf8' });
console.log('\ngit status:\n' + out);
