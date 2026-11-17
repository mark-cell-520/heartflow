'use strict';
// 与 r377 基线 run-all 输出 diff：证明本轮零回归。
const fs = require('fs');
function parse(p) {
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  let pass = 0, fail = 0;
  const re = /(\d+)\s*通过[，,]\s*(\d+)\s*失败/g;
  for (const l of lines) { let m; while ((m = re.exec(l)) !== null) { pass += +m[1]; fail += +m[2]; } }
  const failedFiles = [];
  for (const l of lines) {
    const m = l.match(/^\s+-\s+·\s+(\S+\.test\.js)\s+(Command failed|文件自报失败)/);
    if (m && !failedFiles.includes(m[1])) failedFiles.push(m[1]);
  }
  return { pass, fail, failedFiles };
}
const base = parse('/data/home/heartflow/coordination/agent4/r377-run-all.output.txt');
const cur = parse('/data/home/heartflow/coordination/agent4/r378-run-all.output.txt');
const newFail = cur.failedFiles.filter(f => !base.failedFiles.includes(f));
const gone = base.failedFiles.filter(f => !cur.failedFiles.includes(f));
console.log(JSON.stringify({
  base: { pass: base.pass, fail: base.fail, files: base.failedFiles.length },
  cur: { pass: cur.pass, fail: cur.fail, files: cur.failedFiles.length },
  newFailures: newFail, recovered: gone,
}, null, 1));
