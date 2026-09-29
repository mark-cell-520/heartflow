// 第 218 轮诊断 23：在 hook 里给 console.log / process.stdout.write 打点，
// 看 5 个 ✓ 之后是否有第 6 次输出 —— 若没有，IIFE 段真的没跑
const fs = require('fs');
const path = require('path');
const TRACE = path.join(process.cwd(), '_dbg6.trace');
try { fs.unlinkSync(TRACE); } catch {}
const hook = `
const fs = require('fs');
const T = (s) => { try { fs.appendFileSync(${JSON.stringify(TRACE)}, s + '\\n'); } catch {} };
const origLog = console.log;
console.log = function (...a) {
  T('LOG ' + String(a[0] || '').slice(0, 60));
  return origLog.apply(console, a);
};
const origErr = console.error;
console.error = function (...a) {
  T('ERR ' + String(a[0] || '').slice(0, 60));
  return origErr.apply(console, a);
};
const origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = function (chunk, ...rest) {
  T('STDOUT_WRITE ' + String(chunk).slice(0, 60));
  return origWrite(chunk, ...rest);
};
process.on('exit', (c) => T('PROCESS_EXIT code=' + c));
process.on('beforeExit', () => T('BEFORE_EXIT'));
T('HOOK_LOADED');
`;
const hookPath = path.join(process.cwd(), 'scripts/round-218/_hook2.js');
fs.writeFileSync(hookPath, hook);
console.log('WROTE ' + hookPath);
