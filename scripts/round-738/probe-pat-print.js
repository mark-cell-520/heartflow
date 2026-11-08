// r738-B6: 打印命中 pat 的源码
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const arrText = src.slice(start + 'const DANGEROUS_PATTERNS = '.length, end + 2);
const pats = eval(arrText);
for (const i of [0, 21, 32, 55]) {
  console.log(`--- pat#${i}:`);
  // 找源码中该 pat 的前置注释（向上找最近的注释行）
  const patStr = pats[i].toString();
  console.log(patStr.slice(0, 400));
  console.log();
}
