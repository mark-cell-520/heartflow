// r628 方向选择：从上一轮遗留的 hidden instance 未接线候选里选
const { HeartFlowDecision } = require('../src/core/decision.js');
const cands = [
  '[A] sageGuardian 接线进 dispatch — 16 方法 13 零抛，具备 ASL 安全分级 + 价值违背检出（constitution 保护检查），当前 ALLOWED_ROUTES 0 条、dispatch 全部抛 route not allowed；属真升级③（此前不可达的辨别能力首次可达）',
  '[B] forgettingEngine 接线进 dispatch — 16 方法全零抛，含 ebbinghausRetention/consolidate 记忆巩固，但辨别性质偏弱，主要是记忆管理而非判别',
  '[C] 不接线，改跑 run-all 修 data/test-count.json 残留 failed=78（doc-numbers 2 项挂）— 属验收维护非能力新增，但可解除 607 轮遗留的红色项'
];
(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: cands.join('\n') });
  console.log(JSON.stringify(r));
})();
