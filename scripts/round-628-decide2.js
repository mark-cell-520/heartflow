// r628 方向选择第 2 次：补可区分判据（辨别相关性/零抛率/是否已有同类能力/工作量）
const { HeartFlowDecision } = require('../src/core/decision.js');
const cands = [
  '[A] sageGuardian 接线进 dispatch。判据：辨别相关性=高（13/16 方法零抛，ASL 安全分级+价值违背+constitution 保护检查，直接判"该不该做"同类于已接线的 valueInternalizer 但覆盖安全侧）；是否已有同类能力=无（安全分级维度目前零覆盖）；工作量=中（16 方法需挑可 dispatch 子集并过 ALLOWED_ROUTES）；风险=低（零抛率高）',
  '[B] forgettingEngine 接线进 dispatch。判据：辨别相关性=低-中（记忆巩固/遗忘曲线，属记忆管理不产出对错判断）；是否已有同类能力=memoryIndex/consolidateRepeat 已覆盖记忆侧；工作量=中；风险=低',
  '[C] 只跑 run-all 修 doc-numbers 挂账。判据：辨别相关性=零（无新能力）；工作量=高（全量测试可能 >120s 且受内存约束）；风险=中（碰 4GiB cgroup 可能 OOM gateway）'
];
(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: cands.join('\n') });
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, reasoning: r.reasoning }));
})();
