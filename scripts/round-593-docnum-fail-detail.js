// r593 一次性探针：抓 doc-numbers-accuracy 的失败项明细（只看名字，不看样本原文）
const { execFileSync } = require('child_process');
let out = '';
try {
  out = execFileSync(process.execPath, ['test/doc-numbers-accuracy.test.js'], { cwd: process.cwd(), encoding: 'utf8' });
} catch (e) {
  out = (e.stdout || '') + (e.stderr || '');
}
const lines = out.split('\n');
for (const l of lines) {
  if (/✗|FAIL|失败/.test(l)) console.log(l.trim().slice(0, 220));
}
console.log('--- END ---');
