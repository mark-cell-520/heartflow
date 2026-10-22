// r635 候选池 v4：精确区分三种 dispatch 失败形态
//   NOT_ALLOWED   = ALLOWED_ROUTES 缺 route（真·零路由）
//   UNKNOWN_MOD   = ALLOWED_ROUTES 有 route 但 _modules 无键（半可达）
//   REACHABLE     = 真的拿到模块方法
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

const list = ['memoryKernel','memoryIndex','dreamConsolidation','globalWorkspace','associativeEngine','aiSelfPositioning','decisionExecutor','agentCard','postTraining','decisionFeedback','ruleGrowth','fieldInjector','mindWanderer','phenomenology','experienceDistiller','hypothesisDriver','gapExecutor','learningOrchestrator','learningPulse','taskUrgencyEstimator','whatLearned','patternTracer','selfDiagnosis','_engram','outputChecklist'];

const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
try { hf.start(); } catch (e) {}

const out = [];
for (const name of list) {
  let extRefs = 0;
  try {
    extRefs = parseInt(execSync(`grep -rn --include=*.js "${name}" src/ test/ scripts/ 2>/dev/null | grep -v "core/heartflow.js" | grep -v "core/engine-constructor.js" | wc -l`, { cwd: ROOT }).toString().trim(), 10) || 0;
  } catch (e) {}
  const inst = hf[name] || (hf._modules && hf._modules[name]) || null;
  let methods = [];
  if (inst) {
    const seen = new Set();
    try { for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(inst))) { if (k !== 'constructor' && typeof inst[k] === 'function') seen.add(k); } } catch (e) {}
    for (const k of Object.getOwnPropertyNames(inst)) { if (typeof inst[k] === 'function' && k !== 'constructor') seen.add(k); }
    methods = Array.from(seen);
  }
  let na = 0, um = 0, ok = 0, err = 0;
  for (const meth of methods.slice(0, 25)) {
    const route = name + '.' + meth;
    try {
      hf.dispatch(route, {});
      ok++;
    } catch (e) {
      const msg = String(e.message || '');
      if (/not allowed/.test(msg)) na++;
      else if (/Unknown subsystem/.test(msg)) um++;
      else { err++; }
    }
  }
  let verdict = 'REACHABLE';
  if (methods.length === 0) verdict = 'NO_METHODS';
  else if (na === methods.length) verdict = 'NOT_ALLOWED';
  else if (um === methods.length) verdict = 'UNKNOWN_MOD';
  else if (na + um > 0) verdict = 'MIXED(' + na + '/' + um + ')';
  out.push({ name, extRefs, methods: methods.length, na, um, ok, err, verdict, hasModulesKey: !!(hf._modules && hf._modules[name]) });
}
out.sort((a, b) => (a.na + a.um) - (b.na + b.um) || b.methods - a.methods);
console.log('name | extRefs | methods | NOT_ALLOWED | UNKNOWN_MOD | ok | err | verdict | _modules键');
for (const r of out) {
  console.log(`${r.name} | ${r.extRefs} | ${r.methods} | ${r.na} | ${r.um} | ${r.ok} | ${r.err} | ${r.verdict} | ${r.hasModulesKey}`);
}
