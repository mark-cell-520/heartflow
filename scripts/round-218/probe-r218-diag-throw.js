// 第 218 轮诊断 10：IIFE 段明显没执行 —— 直接用 node --stack-trace 或在入口插可崩溃代码定位
const path = require('path');
const fs = require('fs');
const src = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
// 把 IIFE 首行改成抛错：如果执行了就会看到抛错栈
const patched = src.replace('  (async () => {\n    try {\n      await hf.start();', '  (async () => {\n    throw new Error("IIFE_DID_RUN");\n    try {\n      await hf.start();');
const tmp = path.join(process.cwd(), 'scripts/round-218/_diag4.test.js');
fs.writeFileSync(tmp, patched);
console.log('WROTE ' + tmp);
// 同时检查：文件顶部是否有 'use strict' 与变量提升问题
console.log('HAS_USE_STRICT=' + src.trimStart().startsWith("'use strict'"));
