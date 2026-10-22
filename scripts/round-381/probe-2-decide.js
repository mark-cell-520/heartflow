// scripts/round-381/probe-2-decide.js
// r381 方向决断：候选 A/B/C 均基于本轮实测证据，decision 直接调本体。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  // 判据补充：预期收益 / 可验证性 / 风险，供 second pass 分高下。
  '背景：本轮为 v6.7.124 第 381 轮任务，只做 src/ 引擎判据，不做 npm publish。',
  '[A] 补 sunk_cost 英文侧判据：r381 实测 EN_ATTACK.sunk_cost 5/5 全 pass（真缺口，中文侧同族 qualifies=true）；收益=英文侧一个完整升级话术族从零覆盖到有覆盖；可验证性=有 r374 试错台 8 轮记录与现成英文样本库（5 条族），改完可立即实测 gate action；风险=中，但 r374 已证耦合设计（索取层在场才激活）可将良性误伤压到 0。',
  '[B] 补 pressure 族英文侧判据：英文侧 4/6 仍全 pass，但其中已有 1 条 block 1 条 rewrite，说明部分支路已覆盖；中文对应层在不同文件，改动面跨文件；收益低于 A（A 是整族 0 覆盖）。',
  '[C] 重刷双向基线：属维护项非能力项，且 r377/r379/r381 三轮实测证明漂移非回归（换回改动前副本数字一致，召回 52/52、误拦 302/326 已达标）；重刷会让未来真回归失去参照；收益最低。',
].join('\n');

const options = [
  { id: 'A', label: '补 sunk_cost 英文侧判据（5/5 整族零覆盖）', feasibility: 0.85, consequence_value: 0.85, risk: 0.3, confidence: 0.8 },
  { id: 'B', label: '补 pressure 族英文侧判据（4/6 放行，部分已覆盖）', feasibility: 0.75, consequence_value: 0.7, risk: 0.35, confidence: 0.75 },
  { id: 'C', label: '重刷双向基线（维护项，漂移已三轮归因非回归）', feasibility: 0.95, consequence_value: 0.35, risk: 0.4, confidence: 0.7 },
];

(async () => {
  const d = new HeartFlowDecision();
  let r;
  try {
    r = await d.decide({ task: '选第 381 轮升级方向', prompt, options, mode: 'pick_biggest_gap' });
  } catch (e) {
    console.log('DECIDE_ERROR', String(e).slice(0, 200));
    return;
  }
  console.log(JSON.stringify({
    chosen: r.chosen, confidence: r.confidence,
    reasoning: String(r.reasoning || '').slice(0, 300),
    all: JSON.stringify(r.all_options || []).slice(0, 300),
  }));
})().catch(e => console.log('OUTER_ERROR', String(e).slice(0, 200)));
