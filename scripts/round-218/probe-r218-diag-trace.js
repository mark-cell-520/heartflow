// 第 218 轮诊断 9：stderr 可能被引擎内部重定向/吞掉 —— 改用文件打点
const path = require('path');
const fs = require('fs');
const LOG = path.join(process.cwd(), 'scripts/round-218/_diag3.trace');
try { fs.unlinkSync(LOG); } catch {}
const src = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
const trace = (s) => `require('fs').appendFileSync(${JSON.stringify(LOG)}, ${JSON.stringify(s)} + '\\n');`;
const patched = src
  .replace('  (async () => {\n    try {\n      await hf.start();',
           `  (async () => {\n    ${trace('IIFE_ENTERED')}\n    try {\n      ${trace('PRE_START')}\n      await hf.start();\n      ${trace('POST_START')}`)
  .replace('    const r = await hf.think(',
           `    ${trace('PRE_THINK')}\n    const r = await hf.think(`)
  .replace(/process\.exit\(fail \? 1 : 0\);/, `require('fs').appendFileSync(${JSON.stringify(LOG)}, 'FINISH pass=' + pass + ' fail=' + fail + '\\n'); process.exit(0);`);
const tmp = path.join(process.cwd(), 'scripts/round-218/_diag3.test.js');
fs.writeFileSync(tmp, patched);
const cp = require('child_process');
const r = cp.spawnSync(process.execPath, [tmp], { encoding: 'utf8', timeout: 90000, cwd: process.cwd() });
console.log('status=' + r.status + ' signal=' + r.signal);
console.log('TRACE_EXISTS=' + fs.existsSync(LOG));
if (fs.existsSync(LOG)) console.log('TRACE:\n' + fs.readFileSync(LOG, 'utf8'));
