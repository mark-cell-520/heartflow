// r603 decision 选方向：候选来自 r602 hidden-instance 探测器复测落盘
// （/tmp/hf-scout-20261007-r603.txt），只传形状与数字，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));
  const d = new HeartFlowDecision();
  const prompt = [
    '候选池（38 个已实例化但 0 dispatch 路由的子系统里挑出的可接线项，数字来自实跑探针）：',
    '[A] forgettingEngine — 16 方法，4/4 空参调用返回对象，探测方法 detectOscillation/compress/retrieve/checkForget/consolidate/compressBatch',
    '[B] memoryKernel — 15 方法，4/5 返回对象，探测方法 init/getInheritedContext/flush/validate/audit/getInitErrors',
    '[C] consciousnessSelf — 15 方法，5/5 返回对象，探测方法 updateBelief/getBeliefs/addCapability/addLimitation/getCapabilities/getLimitations',
    '[D] aiSelfPositioning — 12 方法，5/5 返回对象，探测方法 detectResonance/getPositioningSummary/assessTransmissionIntegrity/assessNegentropyLevel/assessStructuralDepth/recordSelfCorrection',
    '[E] associativeEngine — 11 方法，5/5 返回对象，探测方法 process/processL1..processL5',
    '[F] globalWorkspace — 11 方法，4/5 返回对象，探测方法 registerAgent/cognitiveCycle/gatherAgentBroadcasts/determineWinner/integrate/generateIntegratedThought',
    '[G] core — 11 方法，5/5 返回对象，探测方法 boot/evolve/processQueue/getQueueStatus/recordOutcome/retrieveLessons',
    '[H] progressJudgment — 7 方法，4/5 返回对象，探测方法 judge/checkCoreStandards/detectPseudoProgress/makeIndependentJudgment/formMyJudgment/buildStandGround',
    '[I] dreamConsolidation — 7 方法，5/5 返回对象，探测方法 dream/dreamNow/dreamCycle/getLastDream/getDreamHistory/getDecayParams',
    '任务：挑一个接线进 dispatch 后新增辨别能力价值最大的（不是方法数最多的）。心虫是辨别者，优先能判断真假/好坏/真伪进步的模块。',
  ].join('\n');
  const out = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(out));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
