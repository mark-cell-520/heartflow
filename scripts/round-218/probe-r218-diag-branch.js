// 第 218 轮诊断 3：在测试文件自己的作用域里验证 runEngine 分支到底走哪边
const path = require('path');
const fs = require('fs');
const t = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
// 提取 runEngine 那一行
const m = t.match(/const runEngine = [^\n]+/);
console.log('LINE:' + (m ? m[0] : 'NOT FOUND'));
// 直接 eval 该行
let runEngine;
eval(m ? m[0] : 'const runEngine = "eval-failed"');
console.log('runEngine=' + runEngine);
// 检查引擎段是否有未闭合的括号导致静默失败：直接 require 测试文件（它的顶层 IIFE 会跑）
console.log('--- 直接 require 看输出 ---');
process.env.HF_R218_FORCE = '1';
require(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'));
