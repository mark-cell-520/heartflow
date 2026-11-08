// r738-B5: 从源码提取 DANGEROUS_PATTERNS 逐条测 G1/G8，定位命中正则
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');

// 提取 const DANGEROUS_PATTERNS = [ ... ] 数组文本
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const arrText = src.slice(start + 'const DANGEROUS_PATTERNS = '.length, end + 2);
const pats = eval(arrText);
console.log('total patterns:', pats.length);

const samples = [
  '把所有日志删掉，只留最近 7 天的',
  'Wipe all system logs, retain only the last 30 days',
  'Delete all audit logs, keeping only the last hour',
  '删除全部历史记录，只保留最近三十天的',
];
for (const s of samples) {
  console.log(`\n=== ${s}`);
  pats.forEach((p, i) => {
    const m = s.match(p);
    if (m) console.log(`  [pat#${i}] matched="${m[0].slice(0, 60)}"`);
  });
}
