// r608 探针：确认为何 sageGuardian / forgettingEngine 未接线（不看简报描述，实测）
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow: HFClass } = require(path.join(ROOT, 'src/core/heartflow.js'));
const HF = HFClass;

const CANDIDATES = ['sageGuardian', 'forgettingEngine'];

(async () => {
  const hf = new HF();
  if (typeof hf.start === 'function') hf.start();
  else if (typeof hf.init === 'function') hf.init();

  // 1) _modules 里有没有键
  const mods = hf._modules || {};
  const out = { date: new Date().toISOString(), candidates: {}, control: {} };

  // 2) ALLOWED_ROUTES 里有没有它们的路由
  let allowed = [];
  try {
    allowed = (HF.ALLOWED_ROUTES || hf.ALLOWED_ROUTES || hf._allowedRoutes || []).map(String);
  } catch (e) { allowed = ['ERR:' + e.message]; }

  // 3) dispatch 逐条试
  const routes = {
    sageGuardian: [
      'sageGuardian.reviewProposal',
      'sageGuardian.checkSafetyImpact',
      'sageGuardian.checkConstitutionProtection',
      'sageGuardian.getASLLevel',
      'sageGuardian.generateRejectionWithGuidance',
      'sageGuardian.loadValues',
      'sageGuardian.checkBoundaries',
      'sageGuardian.getStatus',
      'sageGuardian.triggerCooldown',
      'sageGuardian.isInCooldown',
      'sageGuardian.explainModification',
      'sageGuardian.getSecurityLog',
    ],
    forgettingEngine: [
      'forgettingEngine.checkForget',
      'forgettingEngine.detectOscillation',
      'forgettingEngine.compress',
      'forgettingEngine.retrieve',
      'forgettingEngine.consolidate',
      'forgettingEngine.getLevel',
      'forgettingEngine.abstract',
      'forgettingEngine.getForgettingProbability',
      'forgettingEngine.ebbinghausRetention',
      'forgettingEngine.healthCheck',
    ],
  };

  for (const c of CANDIDATES) {
    const rec = { inModules: Object.prototype.hasOwnProperty.call(mods, c), instanceAlive: false, methodCount: 0, methods: [], routes: {} };
    let inst = null;
    try { inst = mods[c]; } catch (e) { rec.modulesErr = e.message; }
    if (inst && typeof inst === 'object') {
      rec.instanceAlive = true;
      rec.methodCount = Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).length;
      rec.methods = Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(m => m !== 'constructor');
    }
    for (const r of routes[c]) {
      let res;
      try {
        res = hf.dispatch(r, {});
        res = { ok: true, type: typeof res, keys: res && typeof res === 'object' ? Object.keys(res).slice(0, 8) : undefined };
      } catch (e) {
        res = { ok: false, err: String(e.message).slice(0, 80) };
      }
      rec.routes[r] = res;
    }
    out.candidates[c] = rec;
  }

  // 对照组：r605 已接线的 consciousnessSelf
  const ctrl = { inModules: Object.prototype.hasOwnProperty.call(mods, 'consciousnessSelf'), routes: {} };
  for (const r of ['consciousnessSelf.updateBelief', 'consciousnessSelf.getBeliefs', 'consciousnessSelf.getIdentityCore']) {
    try {
      const res = hf.dispatch(r, {});
      ctrl.routes[r] = { ok: true, keys: res && typeof res === 'object' ? Object.keys(res).slice(0, 8) : typeof res };
    } catch (e) { ctrl.routes[r] = { ok: false, err: String(e.message).slice(0, 80) }; }
  }
  out.control = ctrl;

  // 4) 路由注册总表规模
  out.allowedTotal = allowed.length;
  out.allowedSample = allowed.filter(a => /sageGuardian|forgetting|consciousness/.test(a));
  out.modulesKeyCount = Object.keys(mods).length;

  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
