// r621 探针：确认 uncertaintyQuantifier 在 ALLOWED_ROUTES / dispatch / routes() 三套口径下的真实形态
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const { HeartFlow } = require('../src/core/heartflow.js');

const hf = new HeartFlow();
hf.start();

const out = {};
const allowed = Array.from(HeartFlow.ALLOWED_ROUTES);
out.allowedUQ = allowed.filter(x => x.startsWith('uncertaintyQuantifier'));
out.allowedTotal = allowed.length;

const rt = (typeof hf.routes === 'function') ? hf.routes() : {};
const all = [];
for (const [n, ms] of Object.entries(rt)) {
  if (Array.isArray(ms)) for (const m of ms) all.push(n + '.' + String(m).replace(/[^\x21-\x7e]+/g, ''));
}
out.routesFnUQ = all.filter(x => x.startsWith('uncertaintyQuantifier'));
out.routesFnTotal = all.length;
out.modulesKeyCount = Object.keys(hf._modules).length;
out.hasUQKey = Object.prototype.hasOwnProperty.call(hf._modules, 'uncertaintyQuantifier');

const UQ = hf.uncertaintyQuantifier;
out.uqMethodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(UQ)).filter(m => m !== 'constructor');

// 逐条空实参 dispatch 实测
out.emptyDispatch = out.allowedUQ.map(r => {
  try { hf.dispatch(r); return { r, threw: null }; }
  catch (e) { return { r, threw: e.message.slice(0, 90) }; }
});

// 辨别力实测（走 dispatch 真实链路，样本用形状描述）
const samples = {
  overCertainty: '这绝对是完全正确的唯一方案',
  vague: '可能大概也许有一些关联',
  citationStack: '根据记录数据显示研究表明已有结论',
  plain: '今天天气不错我去散步',
  highRiskNoEvidence: '这个医疗方案肯定没有问题',
};
out.disc = {};
for (const [k, v] of Object.entries(samples)) {
  const r = hf.dispatch('uncertaintyQuantifier.evaluate', { text: v });
  out.disc[k] = { confidence: r.confidence, level: r.level, risk: r.hallucination.risk, isHall: r.isHallucinationRisk, phrase: r.calibratedPhrase };
}
console.log(JSON.stringify(out, null, 1));
