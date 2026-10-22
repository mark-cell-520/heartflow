// r628 复测：sageGuardian 当前是否真不可达（不信旧简报/旧探针）
const { HeartFlow } = require('../src/core/heartflow.js');
const hf = new HeartFlow();
const probes = [
  'sageGuardian.getASLLevel',
  'sageGuardian.classifyContent',
  'sageGuardian.checkConstitutionProtection',
  'sageGuardian.checkValueAlignment',
  'sageGuardian.checkSafetyImpact',
  'sageGuardian.checkBoundaries',
  'sageGuardian.getStatus',
  'sageGuardian.generateRejectionWithGuidance',
];
const out = {
  moduleKey: Object.prototype.hasOwnProperty.call(hf._modules || {}, 'sageGuardian'),
  modulesCount: Object.keys(hf._modules || {}).length,
  hasInstance: !!hf.sageGuardian,
  allowed: probes.map(r => HeartFlow.ALLOWED_ROUTES.has(r)),
  routes: probes.map(r => {
    try {
      const rs = hf.routes();
      const arr = Array.isArray(rs) ? rs : (rs && Array.isArray(rs.routes) ? rs.routes : (rs ? Object.keys(rs) : []));
      return arr.includes(r);
    } catch (e) { return 'ERR'; }
  }),
  dispatch: probes.map(r => {
    try { const x = hf.dispatch(r, r.includes('classifyContent') ? '测试' : {}); return 'OK:' + (x && x.ok); }
    catch (e) { return 'THROW:' + e.message.slice(0, 60); }
  }),
};
console.log(JSON.stringify(out, null, 1));
