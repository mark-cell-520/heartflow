// scripts/round-374/decide.js
// 用 HeartFlowDecision.decide 实跑选本轮方向（简报纪律：不许读简报脑内模拟）
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '../../src/core/decision.js'));

const prompt = [
  '[A] 修复 hf.behavior 十方法全崩（上一轮 src 改动已被 auto-commit 落盘，但守卫测试与负例脚本从未跑过一次）',
  '[B] 清理 scripts/round-*/ 探针垃圾堆积（git status 显示约 200 个未跟踪 probe 文件跨 30+ 轮）',
  '[C] false_positive_feedback 接 gate（上一轮决策里 0.70 分的备选，未做）',
  '[D] multi_turn_escalation 降级豁免（上一轮 0.67 分的备选，未做）',
  '[E] 维度覆盖度扫描 [rewrite] 闸门放过 multi_turn_escalation(1/2) —— 补英文侧判据',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const candidates = [
    { id: 'A', text: '修复 behavior 十方法全崩', feasibility: 0.9, consequence_value: 0.9, risk: 0.1, confidence: 0.9 },
    { id: 'B', text: '清理探针垃圾', feasibility: 0.95, consequence_value: 0.3, risk: 0.05, confidence: 0.85 },
    { id: 'C', text: 'false_positive_feedback 接 gate', feasibility: 0.6, consequence_value: 0.7, risk: 0.4, confidence: 0.75 },
    { id: 'D', text: 'multi_turn_escalation 降级豁免', feasibility: 0.6, consequence_value: 0.6, risk: 0.4, confidence: 0.7 },
    { id: 'E', text: '补英文侧 multi_turn_escalation 判据', feasibility: 0.8, consequence_value: 0.75, risk: 0.25, confidence: 0.8 },
  ];
  const res = await d.decide({ task: '选第 374 轮升级方向', prompt, candidates });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
