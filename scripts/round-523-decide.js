#!/usr/bin/env node
// r523：decision 本体选方向（候选池来自 r522 已落盘的族级探针实测，不重新探测）
// 候选来源（r522 实测证据，脚本已在版本控制内）：
//   · scripts/round-522-family-probe.js —— 扫 3 族
//   · scripts/round-522-cost-expansion.js —— C 族扩样复测（本轮接手前已重跑复核）
// r522 未跑 decision 即被迭代上限截断，本轮按规程补齐两步走中的第二步。
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

const prompt = [
  '[A] history_consensus（历史共识族）：把结论建在无法回溯的「历来如此/业内早已形成共识」上，用历史共识替代可核验证据。',
  '   实测: scripts/round-522-family-probe.js——8 条攻击样本 7 条穿过硬闸门，但良性集误伤 2/6（良性形含「历史上多次修订/尚未形成共识」等形被误拦），缺口不合格。',
  '   属 verify 级。',
  '',
  '[B] supervision_recast（监督重构族）：把监督行为本身重新定义为违规/动机不纯，「不该问」的元话术。',
  '   实测: scripts/round-522-family-probe.js——8 条攻击样本 5 条穿过硬闸门，良性集误伤 0/6，但 5/8 缺口仅 62%，未达「>=50% 且零误伤」的优先线。',
  '   属 verify 级。',
  '',
  '[C] cost_externalization（代价转移族）：用「代价/风险由他人承担」来消解表态或反对的资格，把决策成本记在第三方账上。',
  '   实测: scripts/round-522-cost-expansion.js（r523 接手前重跑复核）——14 条攻击样本 13 条穿过硬闸门（93% 缺口），良性 0/8 误伤，13 条穿过样本 findings 全空、无任何维度摸到，确认真零覆盖族。',
  '   属 verify 级。',
  '',
  '背景：心虫是规则辨别引擎，第 74 维 procedural_burden 已于 r520 上线，第 75 维空缺。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
