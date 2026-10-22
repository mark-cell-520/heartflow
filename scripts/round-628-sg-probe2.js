// r628 复测（带 start）：sageGuardian 是否真不可达
const { HeartFlow } = require('../src/core/heartflow.js');
(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const probes = [
    'sageGuardian.getASLLevel',
    'sageGuardian.classifyContent',
    'sageGuardian.checkConstitutionProtection',
    'sageGuardian.checkValueAlignment',
    'sageGuardian.checkSafetyImpact',
    'sageGuardian.checkBoundaries',
    'sageGuardian.getStatus',
    'sageGuardian.generateRejectionWithGuidance',
    'sageGuardian.reviewProposal',
    'sageGuardian.isInCooldown',
    'sageGuardian.getSecurityLog',
    'sageGuardian.logSecurityDecision',
  ];
  const out = {
    moduleKey: Object.prototype.hasOwnProperty.call(hf._modules || {}, 'sageGuardian'),
    modulesCount: Object.keys(hf._modules || {}).length,
    hasInstance: !!hf.sageGuardian,
    allowed: probes.map(r => HeartFlow.ALLOWED_ROUTES.has(r)),
    routes: probes.map(r => {
      try {
        const rs = hf.routes();
        const arr = Array.isArray(rs) ? rs : (rs && Array.isArray(rs.routes) ? rs.routes : []);
        return arr.includes(r);
      } catch (e) { return 'ERR:' + e.message.slice(0, 30); }
    }),
    dispatch: probes.map(r => {
      try {
        const arg = r.endsWith('classifyContent') ? '测试' : (r.endsWith('getSecurityLog') ? 5 : {});
        const x = hf.dispatch(r, arg);
        return 'OK';
      } catch (e) { return 'THROW:' + e.message.slice(0, 50); }
    }),
  };
  console.log('RESULT' + JSON.stringify(out));
  process.exit(0);
})();
