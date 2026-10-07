// r603 复测：progressJudgment 的 dispatch/接线现状
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  const inst = hf.progressJudgment;
  console.log('inModules=' + !!hf._modules['progressJudgment']);
  console.log('instance=' + !!inst);
  console.log('routeAllowed=' + HeartFlow.ALLOWED_ROUTES.has('progressJudgment.judge'));
  if (inst) {
    const proto = Object.getPrototypeOf(inst);
    const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && !m.startsWith('_'));
    console.log('methods=' + methods.join(','));
  }
  try { hf.dispatch('progressJudgment.judge', {}); console.log('dispatch=OK'); }
  catch (e) { console.log('dispatch=THROW:' + e.message.slice(0, 120)); }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
