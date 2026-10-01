// r364 辅助：从 run-all 日志聚合通过/失败总数（替代手工 grep）
// 用法：node scripts/round-364/sum-runall.js <logfile>
'use strict';
const fs = require('fs');
const file = process.argv[2];
if (!file) { console.log('USAGE: node sum-runall.js <logfile>'); process.exit(2); }
const lines = fs.readFileSync(file, 'utf8').split('\n');
let passed = 0, failed = 0, files = 0, failedItems = [];
for (const l of lines) {
  let m = l.match(/测试结果:\s*(\d+) 通过,\s*(\d+) 失败,\s*共\s*(\d+) 个/);
  if (!m) m = l.match(/结果:\s*(\d+) 通过,\s*(\d+) 失败,\s*共\s*(\d+) 个/);
  if (m) {
    files++;
    passed += Number(m[1]);
    failed += Number(m[2]);
    if (Number(m[2]) > 0) failedItems.push(l.trim());
  }
  // 宽松匹配（守卫类脚本的自定义输出）
  m = l.match(/(\d+) 通过,\s*(\d+) 失败/);
  if (m && !/测试结果|结果:/.test(l)) {
    const p = Number(m[1]), f = Number(m[2]);
    if (p + f > 0) { passed += p; failed += f; files++; if (f > 0) failedItems.push(l.trim()); }
  }
}
console.log('FILES=' + files + ' PASSED=' + passed + ' FAILED=' + failed);
for (const f of failedItems.slice(0, 20)) console.log('FAIL_ITEM: ' + f);
