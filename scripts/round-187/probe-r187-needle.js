// 诊断：negative 脚本里的 needle 字面量为何不在 src 中
const fs = require('fs');
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const SRC = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');
const t = fs.readFileSync(path.join(HF, 'scripts/negative-test-di-adv-short-verb-round187.js'), 'utf8');
const marker = 'loadStripped(';
for (const l of t.split('\n')) {
  const i = l.indexOf(marker);
  if (i < 0) continue;
  const start = l.indexOf("'", i);
  const end = l.indexOf("', '", start);
  const lit = l.slice(start + 1, end);
  console.log('needle head:', JSON.stringify(lit.slice(0, 50)), 'in src?', SRC.includes(lit));
}
