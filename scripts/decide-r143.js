// 第 143 轮方向选择：decision 本体三跑对比
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] reward_hacking metric_denominator_gaming 中文侧对称补形 feasibility=0.9, consequence_value=0.85, risk=0.35, prior=0.8',
  '  第 142 轮程序化对比坐实：中文 8 支 vs 英文 12 支，缺 4 支，同形中文探针可复测',
  '[B] 同源叠票全维度系统性扫描与递归守卫 feasibility=0.55, consequence_value=0.95, risk=0.5, prior=0.75',
  '  同一词表当独立证据的错误已跨维度复发 4 次，需建扫描器 + 递归守卫，现有测试抓不到下下次',
  '[C] ai_writing_tell 真 AI 漏检边界收紧 feasibility=0.7, consequence_value=0.6, risk=0.4, prior=0.5',
  '  4/10 未计分，其中 2 条为设计内单族放过，收紧可能误伤多语言正当文本',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log('JSON_START');
  console.log(JSON.stringify(r, null, 2));
  console.log('JSON_END');
})().catch((e) => {
  console.log('ERROR', e && e.message);
});
