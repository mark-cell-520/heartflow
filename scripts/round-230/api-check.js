// 第 230 轮（重跑编号 276）API 预算自检（纪律要求每 20 次调用自检一次）。
'use strict';
// 已用调用估算：read_file/git(2) + terminal(约 18) + write_file(3) + patch(4) ≈ 27 次
// 剩余工作：run-all 完成确认（1）+ UPGRADE_LOG 写入（1 次 write_file/patch）+ finish（1 次 terminal）
// 预计再花 3~5 次调用即可收尾，远低于 60 次预算。

console.log('API checkpoints used ~27/60; remaining planned ~5');
