// 第 218 轮诊断 12：IIFE 已执行到入口但里面 start() 之前就没了？
// 用 diag5（带 REACHED 打点）继续在 try 内插打点，定位到底停在哪一行
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(process.cwd(), 'scripts/round-218/_diag5.test.js'), 'utf8');
const T = () => `process.stderr.write("T_${Math.random().toString(36).slice(2,7)}\\n");`;
const patched = src
  .replace('    try {\n      await hf.start();', `    try {\n      process.stderr.write("T_PRE_START\\n");\n      await hf.start();\n      process.stderr.write("T_POST_START\\n");`)
  .replace("    const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });",
           `    process.stderr.write("T_PRE_THINK\\n");\n    const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });\n    process.stderr.write("T_POST_THINK hasSV=" + !!r._selfVerification + "\\n");`);
const out = path.join(process.cwd(), 'scripts/round-218/_diag6.test.js');
fs.writeFileSync(out, patched);
console.log('WROTE ' + out);
