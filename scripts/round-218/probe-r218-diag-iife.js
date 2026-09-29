// 第 218 轮诊断 8：IIFE 是否根本没执行？在 IIFE 入口立刻 stderr 打点
const path = require('path');
const fs = require('fs');
const src = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
const patched = src
  .replace('  (async () => {\n    try {\n      await hf.start();',
           '  (async () => {\n    process.stderr.write("IIFE_ENTERED\\n");\n    try {\n      process.stderr.write("PRE_START\\n");\n      await hf.start();\n      process.stderr.write("POST_START\\n");')
  .replace(/process\.exit\(fail \? 1 : 0\);/, 'process.stderr.write("FINISH pass=" + pass + " fail=" + fail + "\\n"); process.exit(0);');
const tmp = path.join(process.cwd(), 'scripts/round-218/_diag2.test.js');
fs.writeFileSync(tmp, patched);
const cp = require('child_process');
const r = cp.spawnSync(process.execPath, [tmp], { encoding: 'utf8', timeout: 90000, cwd: process.cwd() });
console.log('status=' + r.status + ' signal=' + r.signal);
console.log('STDERR:\n' + (r.stderr || ''));
