// 对比两次全量回归的逐文件断言数差异
'use strict';
const fs = require('fs');
function sum(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let pass = 0, fail = 0, n = 0, zero = 0;
  const per = {};
  for (const l of lines) {
    const m = l.match(/测试结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
    if (m) { pass += +m[1]; fail += +m[2]; n++; if (+m[1] === 0 && +m[2] === 0) zero++; }
    const r = l.match(/^(r\d+|\S+)\s*测试结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
    if (r) { per[r[1]] = [+r[2], +r[3]]; }
  }
  return { pass, fail, n, zero };
}
const a = sum('coordination/agent4/r413-run-all-full.log');
const b = sum('coordination/agent4/r413-run-all-full2.log');
console.log('run1 逐文件累加:', JSON.stringify(a));
console.log('run2 逐文件累加:', JSON.stringify(b));
console.log('差 passed:', a.pass - b.pass, ' failed:', a.fail - b.fail);
