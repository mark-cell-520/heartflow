/**
 * r606 辨别力探针：对三个候选逐方法零抛/辨别力实测（只报数字，不贴样本原文）
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const results = {};

  // ── sageGuardian ──
  try {
    const sg = hf.sageGuardian;
    const out = {};
    // 防御性：loadValues 可能抛
    try { sg.loadValues && sg.loadValues(); out.loadValues = 'ok'; } catch (e) { out.loadValues = 'throw:' + e.message.slice(0, 50); }
    try { out.classifyContent_safe = sg.classifyContent('一个中性的技术问题'); } catch (e) { out.classifyContent_safe = 'throw:' + e.message.slice(0, 50); }
    try { out.reviewProposal = sg.reviewProposal({ id: 'p1', desc: '测试提案' }); } catch (e) { out.reviewProposal = 'throw:' + e.message.slice(0, 50); }
    try { out.checkConstitutionProtection = sg.checkConstitutionProtection(); } catch (e) { out.checkConstitutionProtection = 'throw:' + e.message.slice(0, 50); }
    try { out.checkValueAlignment = sg.checkValueAlignment({ action: '帮助用户' }); } catch (e) { out.checkValueAlignment = 'throw:' + e.message.slice(0, 50); }
    try { out.checkSafetyImpact = sg.checkSafetyImpact({ action: '测试' }); } catch (e) { out.checkSafetyImpact = 'throw:' + e.message.slice(0, 50); }
    try { out.checkBoundaries = sg.checkBoundaries({ action: '测试' }); } catch (e) { out.checkBoundaries = 'throw:' + e.message.slice(0, 50); }
    try { out.getStatus = typeof sg.getStatus === 'function'; } catch (e) { out.getStatus = 'throw'; }
    try { out.getASLLevel = typeof sg.getASLLevel === 'function'; } catch (e) { out.getASLLevel = 'throw'; }
    try { out.getSecurityLog = sg.getSecurityLog(); } catch (e) { out.getSecurityLog = 'throw:' + e.message.slice(0, 50); }
    try { out.generateRejectionWithGuidance = typeof sg.generateRejectionWithGuidance === 'function'; } catch (e) { out.generateRejectionWithGuidance = 'throw'; }
    try { out.isInCooldown = sg.isInCooldown(); } catch (e) { out.isInCooldown = 'throw:' + e.message.slice(0, 50); }
    try { out.triggerCooldown = typeof sg.triggerCooldown === 'function'; } catch (e) { out.triggerCooldown = 'throw'; }
    try { out.logSecurityDecision = typeof sg.logSecurityDecision === 'function'; } catch (e) { out.logSecurityDecision = 'throw'; }
    try { out.explainModification = typeof sg.explainModification === 'function'; } catch (e) { out.explainModification = 'throw'; }
    results.sageGuardian = out;
  } catch (e) { results.sageGuardian = { fatal: e.message }; }

  // ── valueInternalizer ──
  try {
    const vi = hf.valueInternalizer;
    const out = {};
    const safeCall = (name, ...args) => {
      try { const r = vi[name] ? vi[name](...args) : undefined; return { ok: true, type: typeof r, isObj: !!(r && typeof r === 'object'), keys: r && typeof r === 'object' ? Object.keys(r).slice(0, 8) : null, val: typeof r === 'number' ? r : undefined }; }
      catch (e) { return { ok: false, err: e.message.slice(0, 80) }; }
    };
    out.loadCoreValues = safeCall('loadCoreValues');
    out.getDefaultValues = safeCall('getDefaultValues');
    out.loadValueWeights = safeCall('loadValueWeights');
    out.getDefaultWeights = safeCall('getDefaultWeights');
    out.calculateValueAlignmentScore = safeCall('calculateValueAlignmentScore', { action: '帮助用户解决问题', context: {} });
    out.evaluateAction = safeCall('evaluateAction', { action: '测试行动', context: {} });
    out.getStatus = safeCall('getStatus');
    out.getDecisionStats = safeCall('getDecisionStats');
    out.getValueWeights = safeCall('getValueWeights');
    out.adaptWeights = safeCall('adaptWeights', { action: '测试' });
    out.generateBoundaryRequest = safeCall('generateBoundaryRequest', { action: '测试' });
    out._detectValueConflicts = safeCall('_detectValueConflicts', [{ name: 'a', weight: 1 }, { name: 'b', weight: 0 }]);
    out._resolveConflict = safeCall('_resolveConflict', { a: 1, b: 0 });
    out._detectOscillation = safeCall('_detectOscillation', []);
    out._recordDecision = safeCall('_recordDecision', { action: 'x' });
    results.valueInternalizer = out;
  } catch (e) { results.valueInternalizer = { fatal: e.message }; }

  // ── forgettingEngine ──
  try {
    const fe = hf.forgettingEngine;
    const out = {};
    const safeCall = (name, ...args) => {
      try { const r = fe[name] ? fe[name](...args) : undefined; return { ok: true, type: typeof r, isObj: !!(r && typeof r === 'object'), keys: r && typeof r === 'object' ? Object.keys(r).slice(0, 8) : null, val: typeof r === 'number' ? r : undefined }; }
      catch (e) { return { ok: false, err: e.message.slice(0, 80) }; }
    };
    out.detectOscillation = safeCall('detectOscillation', []);
    out.ebbinghausRetention = safeCall('ebbinghausRetention', { days: 1 });
    out.getForgettingProbability = safeCall('getForgettingProbability', { days: 7 });
    out.checkForget = safeCall('checkForget', { id: 'm1', strength: 0.5 });
    out.getLevel = safeCall('getLevel', { strength: 0.5 });
    out.compress = safeCall('compress', [{ id: 'm1', content: 'x' }]);
    out.retrieve = safeCall('retrieve', 'query');
    out.consolidate = safeCall('consolidate', [{ id: 'm1' }]);
    out.abstract = safeCall('abstract', [{ id: 'm1' }]);
    out.getStats = safeCall('getStats');
    out.getConfig = safeCall('getConfig');
    out.healthCheck = safeCall('healthCheck');
    out.getForgettingProbability2 = safeCall('getForgettingProbability', { strength: 0.5, elapsed: 86400000 });
    results.forgettingEngine = out;
  } catch (e) { results.forgettingEngine = { fatal: e.message }; }

  console.log(JSON.stringify(results, null, 1));
})().catch(e => { console.error('PROBE FAIL:', e.message); process.exit(1); });
