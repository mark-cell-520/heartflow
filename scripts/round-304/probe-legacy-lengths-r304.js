// probe-legacy-lengths-r304.js — 实测 r288 提交版（r304 动手前）存量常量长度，
// 供轮测 H 组登记纪律断言用（证明本轮未动存量数组）。
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const old = execFileSync('git', ['show', 'f871b61:src/weak-evidence-strong-claim.js'], { cwd: ROOT, encoding: 'utf8' });
const tmp = path.join(ROOT, 'scripts/round-304/_wesc-r288-snapshot.js');
fs.writeFileSync(tmp, old);
const OLD = require(tmp);
const C = OLD.__internals();
for (const k of Object.keys(C)) {
  if (Array.isArray(C[k])) console.log(k, C[k].length);
}
fs.unlinkSync(tmp);
