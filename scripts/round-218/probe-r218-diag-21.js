// 第 218 轮诊断 21（决定性）：把原测试文件前 70 行原样搬过来，只替换 HeartFlow 引用段
// —— 逐步二分：先只搬前 30 行，看 trace 到不到
const fs = require('fs');
const path = require('path');
const ORIG = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
const lines = ORIG.split('\n');
// 找 IIFE 起点
const iifeIdx = lines.findIndex(l => l.includes('(async () => {'));
console.log('IIFE at line ' + (iifeIdx + 1) + ' total ' + lines.length);
// 输出 IIFE 之前所有 console.log 出现次数
const logs = lines.slice(0, iifeIdx).filter(l => l.includes('console.log'));
console.log('sync console.log count before IIFE: ' + logs.length);
// 关键：_T 的写入路径 process.cwd() —— 测试由 run-all 用 cwd=ROOT 跑，但直接 node test/x.js 的 cwd 也是 ROOT
// 检查测试文件里有没有改 cwd 的代码
console.log('CHDIR_IN_FILE=' + /process\.chdir/.test(ORIG));
