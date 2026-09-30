// 第 218 轮定位：run-all 报 7471/1，doc-numbers 报「README 少报」。
// 两件事分开看：
//  1. cache=7471 vs README=7422，差 49。本轮只新增 26 断言，
//     所以有 23 个差来自别处（可能是上轮 README 记账与 cache 不同步）。
//  2. failed=1 来自 doc-numbers-accuracy 自报的 1 个失败——
//     正是「README 7400 系列 < 实际」这一项。
// 结论：这是**同一个根因**——README 测试数没跟上 run-all 的实测。
//        修法唯一且机械：等 run-all 定稿后把 README 同步到实测值。
// 本探针只核实差额来源，不改任何文件。
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const cache = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/test-count.json'), 'utf8'));
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const claimed = Number(((readme.match(/([\d,]+) passing tests/) || [])[1] || '0').replace(/,/g, ''));
console.log(JSON.stringify({
  cachePassed: cache.passed, cacheFailed: cache.failed, readmeClaimed: claimed,
  delta: cache.passed - claimed,
  thisRoundAdded: 26,
  unexplained: cache.passed - claimed - 26,
  cacheAt: cache.at,
}));
