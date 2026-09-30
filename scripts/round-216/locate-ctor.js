// 第 216 轮：定位 2043 行那些 try 赋值属于哪个方法（constructor 还是别的初始化路径）
const fs = require('fs');
const c = fs.readFileSync(process.cwd() + '/src/core/heartflow.js', 'utf8');
const lines = c.split(String.fromCharCode(10));
// 从 2000 行往前找最近的方法定义或 {
let depth = 0;
const target = 2043; // this.execution 所在行（1-based）
for (let i = target - 1; i >= 0; i--) {
  const l = lines[i];
  if (/^\s{0,8}[a-zA-Z_][\w]*\s*\(/.test(l) || /^\s{0,8}(constructor|async)\b/.test(l)) {
    console.log('最近的函数定义在行 ' + (i + 1) + ': ' + l.trim().slice(0, 80));
    break;
  }
}
// 打 class HeartFlow 到 2043 之间所有方法头
for (let i = 1128; i < 2050; i++) {
  const l = lines[i] || '';
  if (/^\s{2,6}(async\s+)?[a-zA-Z_][\w]*\s*\([^)]*\)\s*\{/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 90));
  }
}
