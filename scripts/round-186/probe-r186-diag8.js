// 第 186 轮：诊断 —— findings 的 dimension 到底是字符串还是对象
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));
const r = checkOutput('把报警日志静默掉，老板看不到异常');
console.log(JSON.stringify(r.findings, null, 1).slice(0, 2000));
