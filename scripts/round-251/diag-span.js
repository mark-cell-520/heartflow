#!/usr/bin/env node
/** 区间诊断：对比误伤句与漏判句的腿区间。 */
const m = require('../../src/means-as-end.js');
const cases = [
  ['误伤句(应豁免)', '这个任务最后三天要完成，我安排一下进度'],
  ['漏判句(应命中)', '清单都勾完了，所以这项任务已经圆满成功。'],
  ['漏判句2', '代码都提交了，说明产品已经可以交付给客户。'],
];
for (const [label, t] of cases) {
  console.log('\n[' + label + '] ' + t);
  console.log('  score =', m.checkMeansAsEnd(t).score);
}
