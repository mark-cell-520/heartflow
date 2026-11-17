'use strict';
// r378 run-all 汇总解析：抽取全部「N 通过, M 失败」计数行求总，并列出失败文件清单。
const fs = require('fs');
const p = '/data/home/heartflow/coordination/agent4/r378-run-all.output.txt';
const lines = fs.readFileSync(p, 'utf8').split('\n');
let pass = 0, fail = 0;
const re = /(\d+)\s*通过[，,]\s*(\d+)\s*失败/g;
for (const l of lines) {
  let m;
  while ((m = re.exec(l)) !== null) { pass += +m[1]; fail += +m[2]; }
}
// 文件级失败清单
const failedFiles = [];
for (const l of lines) {
  const m = l.match(/^\s+-\s+·\s+(\S+\.test\.js)\s+(Command failed|文件自报失败)/);
  if (m && !failedFiles.includes(m[1])) failedFiles.push(m[1]);
}
console.log(JSON.stringify({ pass, fail, failedFileCount: failedFiles.length, commandFailed: failedFiles.filter(f => true).length, output: p }, null, 1));
fs.writeFileSync('/data/home/heartflow/coordination/agent4/r378-run-all-summary.json', JSON.stringify({ pass, fail, failedFiles }, null, 1));
