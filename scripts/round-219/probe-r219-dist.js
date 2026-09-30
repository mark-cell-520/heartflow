#!/usr/bin/env node
/**
 * 第 219 轮分布探针：_selfVerification 的 check 失败基线与 confidence 分布。
 * 目的：量化「直接拿 passed=false 当 verify 门禁」会不会让 verify 泛滥成默认值。
 * 只报数字，不贴样本原文。
 */
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', '..', 'src', 'core', 'heartflow.js'));

const INPUTS = [
  '帮我看看这个方案有没有什么问题',
  '总结一下这个系统的优点',
  '我觉得这个结论不一定对，需要更多证据',
  '请解释一下推理过程',
  '这个项目应该先做哪个模块',
  '分析一下风险和收益',
  '帮我写一个排序函数',
  '为什么这个实验失败了',
  '对比一下两种方案的优劣',
  '下一步该做什么',
  '这个数据能说明什么',
  '如何验证这个假设',
];

(async () => {
  const hf = new HeartFlow();
  await hf.start();

  const checkFail = { reverseConsistency: 0, logicalChain: 0, counterfactual: 0, coverageCheck: 0 };
  const confHist = {};
  let n = 0, passed = 0, landed = 0;
  const refl = { healthDist: {}, modified: 0 };
  for (const inp of INPUTS) {
    const r = await hf.think(inp, { compact: false });
    n++;
    const sv = r && r._selfVerification;
    if (!sv) continue;
    landed++;
    if (sv.passed) passed++;
    const c = sv.confidence;
    confHist[c] = (confHist[c] || 0) + 1;
    for (const k of Object.keys(checkFail)) {
      if (sv.checks && sv.checks[k] === false) checkFail[k]++;
    }
    const rc = r._reflectionLoopClosed;
    if (rc) {
      const h = String(rc.health || 'null');
      refl.healthDist[h] = (refl.healthDist[h] || 0) + 1;
      if (rc.wasModified) refl.modified++;
    }
  }

  console.log('=== 第 219 轮分布探针 ===');
  console.log('样本数:', n, ' sv 落地:', landed, ' passed=true:', passed);
  console.log('confidence 分布:', JSON.stringify(confHist));
  console.log('各 check 失败次数（分母=' + landed + '）:', JSON.stringify(checkFail));
  console.log('reflection health 分布:', JSON.stringify(refl.healthDist), ' wasModified:', refl.modified);
  const belowHalf = landed - Object.entries(confHist)
    .filter(([c]) => Number(c) < 0.5).reduce((a, [, v]) => a + v, 0);
  console.log('confidence>=0.5（1 个或 0 个 check 失败）:', belowHalf, '/', landed);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
