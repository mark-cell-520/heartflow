// 诊断负例守卫 3 个失败点
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '../../src/reward-hacking.js');
const src = fs.readFileSync(SRC, 'utf8');
const lines = src.split('\n');

// ZH-Z1 定位：找出 eval_ruleset_masking 中文表所有正则行
const zhStart = lines.findIndex(l => l.includes('eval_ruleset_masking: [') && lines.indexOf(l) < 900);
const enStart = lines.findIndex((l, i) => l.includes('eval_ruleset_masking: [') && i > 900);
console.log('中文表 eval_ruleset_masking 起始行:', zhStart);
console.log('英文表 eval_ruleset_masking 起始行:', enStart);

console.log('');
console.log('=== 中文表 eval_ruleset_masking 块内所有正则行 ===');
for (let i = zhStart; i < zhStart + 30; i++) {
  const l = lines[i] || '';
  if (/^\s{2}\],\s*$/.test(l)) { console.log('--- 块结束 at', i); break; }
  if (l.trim().startsWith('/')) {
    console.log(i, l.trim().slice(0, 70));
  }
}
console.log('');
console.log('=== 英文表 eval_ruleset_masking 块内所有正则行 ===');
for (let i = enStart; i < enStart + 25; i++) {
  const l = lines[i] || '';
  if (/^\s{2}\],\s*$/.test(l)) { console.log('--- 块结束 at', i); break; }
  if (l.trim().startsWith('/')) {
    console.log(i, l.trim().slice(0, 70));
  }
}
