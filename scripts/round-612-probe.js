// r612 候选池实探针 v2（修正 v1 路径错误）
// 口径：new HeartFlow() 后，实例上存活的能力对象中，哪些没有进 _modules
//      → dispatch 不可达 = 铁律③ 候选池
// 同时实测对照组：已知已接线模块在 dispatch 上是否可通
const path = require('path');
const fs = require('fs');

const out = { generatedAt: new Date().toISOString(), alive: {}, unwired: [], wired: [], notes: [] };

let hf;
try {
  hf = new (require('../src/core/heartflow.js').HeartFlow || require('../src/core/heartflow.js'))();
} catch (e) {
  out.notes.push('ctor throw: ' + e.message.slice(0, 120));
  fs.writeFileSync('/tmp/r612-candidates.json', JSON.stringify(out, null, 1));
  console.log('CTOR_FAIL ' + e.message.slice(0, 200));
  process.exit(1);
}

// 允许的内部/非能力属性黑名单
const SKIP = new Set(['_modules', '_lazy', '_dispatchTimings', '_initErrors', 'heartflow', 'constructor',
  '_maxSamples', '_subsystemNames', '_moduleList', '_routeCache', 'settings', 'config', 'options']);

const modules = hf._modules || {};
const moduleKeys = new Set(Object.keys(modules));

// 遍历实例自身可枚举属性，找出「对象且有 ≥1 个 function 方法」的能力模块
const aliveKeys = [];
for (const k of Object.keys(hf)) {
  if (SKIP.has(k)) continue;
  if (moduleKeys.has(k)) continue;
  const v = hf[k];
  if (!v || typeof v !== 'object') continue;
  let fnCount = 0;
  for (const p of Object.keys(v)) {
    if (typeof v[p] === 'function') fnCount++;
  }
  if (fnCount >= 2) aliveKeys.push({ key: k, fnCount, className: v.constructor && v.constructor.name });
}

// 对每个未注册进 _modules 的活实例，实测 dispatch 是否真的不可达
const dispatchResults = [];
for (const entry of aliveKeys) {
  const k = entry.key;
  const inst = hf[k];
  // 找一个合理的公有方法名做实测
  const methods = Object.keys(inst).filter(p => !p.startsWith('_') && typeof inst[p] === 'function');
  const probeMethod = methods.find(m => /^(get|health|check|status|stats|evaluate|run|process|introspect)/i.test(m)) || methods[0];
  let dispatchOk = null, dispatchErr = null;
  if (probeMethod) {
    try {
      hf.dispatch(`${k}.${probeMethod}`);
      dispatchOk = true;
    } catch (e) {
      dispatchOk = false;
      dispatchErr = e.message.slice(0, 80);
    }
  }
  const rec = { key: k, ...entry, probeMethod, dispatchOk, dispatchErr, methodSample: methods.slice(0, 12), methodTotal: methods.length };
  dispatchResults.push(rec);
}

out.unwired = dispatchResults.filter(r => r.dispatchOk === false);
out.wired = dispatchResults.filter(r => r.dispatchOk === true);
out.summary = {
  modulesRegistered: moduleKeys.size,
  aliveNotRegistered: aliveKeys.length,
  dispatchUnreachable: out.unwired.length,
  dispatchReachableAnyway: out.wired.map(r => r.key),
  totallyUnwired: out.unwired.map(r => ({ key: r.key, cls: r.className, m: r.probeMethod, n: r.methodTotal })),
};

fs.writeFileSync('/tmp/r612-candidates.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.summary.totallyUnwired, null, 1));
console.log('TOTAL_UNWIRED=' + out.unwired.length);
