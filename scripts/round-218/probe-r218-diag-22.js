// 第 218 轮诊断 22：直接跑原测试文件（test/），在文件外挂 strace 式打点：
// 用 NODE_OPTIONS 的 --require 预加载一个写 trace 的 hook，看进程在哪退出
const fs = require('fs');
const path = require('path');
const TRACE = path.join(process.cwd(), '_dbg5.trace');
try { fs.unlinkSync(TRACE); } catch {}
const hook = `
const fs = require('fs');
const T = (s) => { try { fs.appendFileSync(${JSON.stringify(TRACE)}, s + '\\n'); } catch {} };
process.on('exit', (c) => T('PROCESS_EXIT code=' + c));
process.on('beforeExit', (c) => T('BEFORE_EXIT'));
process.on('uncaughtException', (e) => T('UNCAUGHT ' + (e && e.message)));
process.on('unhandledRejection', (e) => T('UNHANDLED_REJECTION ' + (e && e.message)));
T('HOOK_LOADED');
`;
const hookPath = path.join(process.cwd(), 'scripts/round-218/_hook.js');
fs.writeFileSync(hookPath, hook);
console.log('WROTE ' + hookPath);
