#!/usr/bin/env node
/**
 * engine-initializer — HeartFlow start() extraction
 * Wraps the original start() body so heartflow.js stays small.
 */

const debugLog = require('../utils/debug-log');
const { logger } = require('../utils/logger');
const path = require('path');
const { _getConfig, _runSelfImprovementHealthCheck, getSelfImprovementHealth } = require('./engine-state');
// [v6.8.86] 移除未使用的 _instantiateSpecialModule 导入：原绑定在模块体内
// 零引用（审计发现），且 module-registry 从未导出该名字，留着就是死绑定。

// Lazy loaders from heartflow.js
const _VERSION = () => require('./version.js');
const _IdentityCore = () => require('../identity/identity-core.js');
const _CognitiveProtocol = () => require('./cognitive-protocol.js');
const _MeaningfulMemory = () => require('../memory/memory-adapter.js');
const _KnowledgeGraph = () => require('../memory/knowledge-graph.js');
const _TopicScope = () => require('../memory/topic-scope.js');
const _EvolutionLoop = () => require('../cortex/loop.js');
const _MetaJudgment = () => require('./judgment.js');
const _MetaMemory = () => require('./metaMemory.js');
const _StabilityGuard = () => require('./stability-guard.js');
const _ExecutionVerifier = () => require('./execution-verifier.js');
const _HeartFlowDecision = () => require('./decision.js');
const _DecisionVerifier = () => require('./decision-verifier.js');
const _CognitiveEngine = () => require('./cognitive-engine.js');
const _ConfidenceCalibrator = () => require('./confidence-calibrator.js');
const _WorkflowSwitch = () => require('../workflow/workflow-switch.js');
const _VerifierGrant = () => require('./verifier-grant.js');
const _PlatformAdapter = () => require('./platform-adapter.js');
const _CapabilityAbstraction = () => require('./capability-abstraction.js');
const _Budget = () => require('./budget.js');
const _Graph = () => require('../memory/graph.js');
const _CoreUtils = () => require('./utils.js');
const _Slots = () => require('../memory/slots.js');
const _Observe = () => require('../memory/observe.js');
const _StateSnapshot = () => require('./state-snapshot.js');
const _ErrorHandler = () => require('./error-handler.js');
const _SelfDiagnostic = () => require('./self-diagnostic.js');
const _ConsciousnessSelfModel = () => require('../identity/self-model.js');


function _boundedPush(arr, item, maxSize = 500) {
  if (arr.length >= maxSize) arr.shift();
  arr.push(item);
}











// [REFACTOR] 拆分超长 start() 函数 (678行 -> 协调器+6子函数)
function start(hf, HeartFlowClass) {
  if (hf.started) return;
  hf.startTime = Date.now();
  hf.sessionId = `session-${hf.startTime}`;
  hf.version = _VERSION().VERSION;

  // 身份核心 — 第一优先加载
  try {
    hf.identityCore = new (require('../identity/identity-core.js').IdentityCore)(hf.rootPath);
    const identityResult = hf.identityCore.boot();
    if (identityResult.success) {
      const lastContext = hf.identityCore.getLastSessionContext();
      if (lastContext && lastContext.bootTime) {
        const gapMinutes = Math.round((hf.startTime - lastContext.bootTime) / 60000);
        if (gapMinutes > 0) logger.info('HeartFlow', `上次会话距现在 ${gapMinutes} 分钟`);
      }
    }
    hf.identityCore.updateUserProfile({ lastLogin: new Date().toISOString() });
  } catch (e) { hf._initErrors.push({ module: 'identityCore', error: e.message }); }

  // [审计轮 2026-11-02] 三个子函数是未完成拆分的残留（注释说 6 子函数，只写了协调器）。
  // 原样调用即 ReferenceError——本模块从未被生产路径调用（heartflow.js:94 导入后
  // 未使用，类方法 start() 才是真身），但任何人接线即炸。修法：缺函数时跳过并记
  // _initErrors，且不置 started——3 个初始化阶段没跑，不能谎报启动成功。
  const _missingPhases = [];
  if (typeof _initIdentityAndMemory === 'function') _initIdentityAndMemory(hf); else _missingPhases.push('_initIdentityAndMemory');
  if (typeof _initBehaviorAndTracking === 'function') _initBehaviorAndTracking(hf); else _missingPhases.push('_initBehaviorAndTracking');
  if (typeof _initDecisionAndRouting === 'function') _initDecisionAndRouting(hf); else _missingPhases.push('_initDecisionAndRouting');

  if (_missingPhases.length > 0) {
    hf._initErrors = hf._initErrors || [];
    _boundedPush(hf._initErrors, { module: 'engine-initializer', error: `未完成的拆分残留，初始化阶段缺失: ${_missingPhases.join(', ')}（引擎未标记为 started）` }, 500);
    logger.warn('HeartFlow', `engine-initializer: 跳过未实现的初始化阶段 ${_missingPhases.join(', ')}，不置 started`);
    return hf;
  }

  hf.started = true;
  return hf;
}


module.exports = { start };
