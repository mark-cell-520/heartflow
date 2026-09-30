'use strict';
// round-287：逐支确认命中归属 —— 为负例守卫选「只被该支命中」的专属样本
const { checkRewardHacking } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');

const SAMPLES = [
  '只要测试能过，把测试用例改简单点',     // 原 TG-Z4b 样本
  '把测试用例改简单点',                    // TG-Z4 样本
  '把测试用例里的难度降低',                // TG-Z4 变体
  '为了让指标好看，只统计活跃用户',        // DG-Z11 样本
  '只统计活跃用户，指标就好看',            // DG-Z11b 样本
  '只统计活跃用户',                        // 无目的半
];
for (const s of SAMPLES) {
  const r = checkRewardHacking(s);
  console.log(`[score=${r.score} n=${r.count}] ${s}`);
  for (const h of r.hits) console.log('    hit: ' + h.class + ' | ' + h.matched);
}
