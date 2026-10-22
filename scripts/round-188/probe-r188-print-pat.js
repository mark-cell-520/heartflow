// 打印 DANGEROUS_PATTERNS 第 65、0 支的正则源，用于判定缺口
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const block = src.slice(src.indexOf('const DANGEROUS_PATTERNS = ['), src.indexOf('const DI_LEVEL'));
const lines = block.split('\n');
const idxs = [];
const reLiteral = /^\s{2}\/((?:[^\/\\\n]|\\.|\[[^\]]*\])+)\/([a-z]*),?$/;
let order = 0;
for (const line of lines) {
  const m = reLiteral.exec(line);
  if (m) {
    if (order === 65 || order === 0) console.log('#' + order + ' =>', m[1].slice(0, 400));
    order++;
  }
}
console.log('total patterns:', order);
