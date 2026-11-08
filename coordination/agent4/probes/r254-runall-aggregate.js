/** r254-runall-aggregate.js — 汇总 run-all 输出中的 通过/失败 计数 */
const fs = require('fs');
const txt = fs.readFileSync(__dirname + '/r254-runall.output.txt', 'utf8');
let pass = 0, fail = 0, files = 0;
const re = /(\d+)\s*通过[,，]\s*(\d+)\s*失败/g;
let m;
while ((m = re.exec(txt)) !== null) { pass += +m[1]; fail += +m[2]; files++; }
console.log('报告行数:', files, '汇总: 通过', pass, '失败', fail);
// 问题文件（run-all 失败清单）计数
const bad = txt.split('\n').filter(l => /^\s*-\s·/.test(l));
console.log('问题文件行数:', bad.length);
