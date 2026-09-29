// 第 218 轮诊断 11：判断 IIFE 是否真被定义执行 —— 在 IIFE 前打印
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts/round-218/_diag4.test.js');
const src = fs.readFileSync(p, 'utf8');
const patched = src.replace('  (async () => {', '  process.stderr.write("REACHED_IIFE_LINE\\n");\n  (async () => {');
const out = path.join(process.cwd(), 'scripts/round-218/_diag5.test.js');
fs.writeFileSync(out, patched);
console.log('WROTE ' + out + ' patched=' + (patched !== src));
