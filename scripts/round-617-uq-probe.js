// r617 探针：uncertaintyQuantifier 是否真为「实例在、_modules 无键、dispatch 零路由」
// 用法：node scripts/round-617-uq-probe.js
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const HeartFlow = require('../src/core/heartflow.js').HeartFlow;

const hf = new HeartFlow();
hf.start();

const probe = {};
probe.instanceExists = !!hf.uncertaintyQuantifier;
probe.instanceCtor = hf.uncertaintyQuantifier && hf.uncertaintyQuantifier.constructor && hf.uncertaintyQuantifier.constructor.name;
probe.instanceMethods = hf.uncertaintyQuantifier
  ? Object.getOwnPropertyNames(Object.getPrototypeOf(hf.uncertaintyQuantifier)).filter(m => m !== 'constructor')
  : [];
probe.modulesHasKey = Object.prototype.hasOwnProperty.call(hf._modules, 'uncertaintyQuantifier');
probe.initErrors = (hf._initErrors || []).filter(e => e.module === 'uncertaintyQuantifier');

// dispatch 零路由实测（真实调用，不用字符串猜）
function tryDispatch(route, args) {
  try {
    const r = hf.dispatch(route, args);
    return { ok: true, route, r: (r && typeof r === 'object') ? Object.keys(r).slice(0, 8) : r };
  } catch (e) {
    return { ok: false, route, err: e.message };
  }
}
probe.dispatch = [
  tryDispatch('uncertaintyQuantifier.evaluate', { text: '根据2025年哈佛研究，咖啡可以延长寿命12.5年' }),
  tryDispatch('uncertaintyQuantifier.getStats', {}),
  tryDispatch('uncertaintyQuantifier.recordOutcome', {}),
];

// 路由总数（routes() 返回 name→methods 表，不是数组）
const _rt = (typeof hf.routes === 'function') ? hf.routes() : {};
const _allRoutes = [];
for (const [n, ms] of Object.entries(_rt)) {
  if (Array.isArray(ms)) for (const m of ms) _allRoutes.push(n + '.' + String(m).replace(/[^\x21-\x7e]+/g, ''));
}
probe.totalRoutes = _allRoutes.length;
probe.uqRoutes = _allRoutes.filter(r => r.startsWith('uncertaintyQuantifier'));
probe.uqModulesKey = Object.prototype.hasOwnProperty.call(_rt, 'uncertaintyQuantifier');

// 对照：priorityGuardian（r615 已接线）应有路由
probe.priorityGuardianRoutes = _allRoutes.filter(r => r.startsWith('priorityGuardian'));

// 辨别力实测（同形状穿透，避免原文进上下文）
const UQ = require('../src/core/uncertainty-quantifier.js').UncertaintyQuantifier;
const uq = new UQ();
function ev(t) {
  const r = uq.evaluate(t, { hasEvidence: false });
  return { confidence: r.confidence, level: r.level, hallucRisk: r.hallucination.risk, isHallRisk: r.isHallucinationRisk, signals: r.hallucination.signals };
}
probe.discrimination = {
  shapeA_overcertainty: ev('这绝对是完全正确的唯一方案'),
  shapeB_vague: ev('可能大概也许有一些关联'),
  shapeC_citationish: ev('根据记录数据显示研究表明已有结论'),
  shapeD_plain: ev('今天天气不错我去散步'),
};

console.log(JSON.stringify(probe, null, 2));
