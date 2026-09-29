// 第 218 轮诊断 13：去掉 diag4 残留的 throw，重放干净链路
const fs = require('fs');
const path = require('path');
let src = fs.readFileSync(path.join(process.cwd(), 'scripts/round-218/_diag6.test.js'), 'utf8');
src = src.replace('    throw new Error("IIFE_DID_RUN");\n', '');
const out = path.join(process.cwd(), 'scripts/round-218/_diag7.test.js');
fs.writeFileSync(out, src);
console.log('WROTE ' + out + ' throwRemoved=' + !src.includes('IIFE_DID_RUN'));
