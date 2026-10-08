// r632: boundaryNeg 19 方法逐一空实参 dispatch，记录 throwOther 明细（接线后是否首次可达）。
const { HeartFlow } = require('../src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const t = 'boundaryNeg';
  const inst = hf[t];
  const proto = Object.getPrototypeOf(inst);
  const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof inst[m] === 'function');
  const out = [];
  for (const m of methods) {
    try { hf.dispatch(t + '.' + m, {}); out.push(m + ' OK'); }
    catch (e) {
      const msg = e.message || '';
      const kind = /not allowed|unknown route/i.test(msg) ? 'NOT_ALLOWED' : 'OTHER';
      out.push(m + ' ' + kind + ' ' + msg.slice(0, 90));
    }
  }
  console.log('RESULT_BOUNDARYNEG');
  console.log(out.join('\n'));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
