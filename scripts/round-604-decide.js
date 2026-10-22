// r604 决策脚本：候选全部来自 round-604-unwired-probe.js 实测
// （37 个真未接线实例，按 MCP引用x5 + 源码引用 + 辨别零抛方法x4 + 辨别方法x2 排序）。
// 每个候选都带实测证据，交给 decision 本体选一个。
// 只写方法名与计数，不贴任何样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

  const prompt = [
    '[A] sageGuardian — 伦理/宪法/ASL 分级辨别（16 方法，13 零抛，6 辨别）',
    '  实测：实例活着（heartflow.js L2480 构造，挂在 this.sageGuardian + this.ethics.guardian），',
    '  _modules 无键、ALLOWED_ROUTES 0 条路由、MCP 0 个包装工具、src 0 处直接引用。',
    '  能力：reviewProposal 四项审查（宪法保护/价值对齐/安全影响/行为边界）+ violationCount 驱动',
    '  ASL-1/2/3 分级并持久化到 data/sage-guardian-state.json + classifyContent 风险分级。',
    '  接线后 gain：7-16 条 dispatch 路由首次可达，「一个自我修改提案是否违反宪法/安全/边界」',
    '  从引擎内不可达变为可达。',
    '  已知缺陷：checkValueAlignment / classifyContent / logSecurityDecision 对空实参抛',
    '  TypeError（proposal.description 为 undefined），需在同轮修，否则新路由一调就炸。',
    '',
    '[B] valueInternalizer — 价值对齐评分（12 方法，9 零抛，6 辨别/4 辨别零抛）',
    '  实测：实例活着（L2484 构造，挂在 this.valueInternalizer + this.ethics.values），',
    '  _modules 无键、ALLOWED_ROUTES 0 条、MCP 0、src 0。',
    '  能力：calculateValueAlignmentScore / evaluateAction / getValueWeights / adaptWeights。',
    '  已知缺陷：calculateValueAlignmentScore 与 evaluateAction 恒抛',
    '  "this._makeScoreResult is not a function"（方法缺失，真 bug，非参数问题）。',
    '',
    '[C] memoryKernel — 记忆内核读写审计（15 方法，15 全零抛，2 辨别）',
    '  实测：实例活着（L1715 条件构造），_modules 无键、ALLOWED_ROUTES 0 条、MCP 0、src 5。',
    '  能力：init/validate/audit/writeUserMemory/writeSelfMemory/load/save。',
    '  11 个方法是 CRUD 而非辨别，辨别占比 2/15。',
    '',
    '[D] forgettingEngine — 遗忘/压缩（16 方法，16 全零抛，3 辨别）',
    '  实测：实例活着（L1602 构造），_modules 无键、ALLOWED_ROUTES 0 条、MCP 0、src 0。',
    '  能力：detectOscillation/compress/consolidate/checkForget/abstract/ebbinghausRetention。',
    '',
    '[E] consciousnessSelf — 自我模型信念（15 方法，11 零抛，1 辨别）',
    '  实测：实例活着（L2430 构造），_modules 无键、ALLOWED_ROUTES 0 条、MCP 0、src 0。',
    '  能力：updateBelief/getBeliefs/addCapability/addLimitation 等自我状态管理，辨别占比 1/15。',
  ].join('\n');

  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向（第 604 轮）', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
