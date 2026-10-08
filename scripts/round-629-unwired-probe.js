// r629: 全量扫描「构造了但从未进 _modules」的实例 → 未接线候选池（本轮真升级③的实测依据）
const { HeartFlow } = require('../src/core/heartflow.js');

const SKIP = new Set([
  '_modules', '_initErrors', '_lazyCache', 'constructor',
]);

(async () => {
  const hf = new HeartFlow();
  await hf.start();

  const keys = Object.keys(hf).filter(k => !SKIP.has(k) && !k.startsWith('_'));
  const unwired = [];
  const wired = [];
  for (const k of keys) {
    const inst = hf[k];
    if (!inst || typeof inst !== 'object') continue;
    let proto;
    try { proto = Object.getPrototypeOf(inst); } catch (_) { continue; }
    if (!proto || proto === Object.prototype) continue;
    let methods = [];
    try {
      methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof inst[m] === 'function');
    } catch (_) { continue; }
    if (methods.length === 0) continue;
    const inModules = Object.prototype.hasOwnProperty.call(hf._modules || {}, k);
    const entry = { key: k, methods: methods.length, inModules, methodNames: methods };
    (inModules ? wired : unwired).push(entry);
  }

  // 对未接线实例逐方法 dispatch 测可达性
  const probe = [];
  for (const e of unwired) {
    const inst = hf[e.key];
    let ok = 0, notAllowed = 0, other = 0;
    const otherErrs = [];
    for (const m of e.methodNames) {
      try {
        hf.dispatch(e.key + '.' + m, {});
        ok++;
      } catch (err) {
        const msg = (err && err.message) || '';
        if (/not allowed|未知|unknown route/i.test(msg)) notAllowed++;
        else { other++; if (otherErrs.length < 2) otherErrs.push(m + ':' + msg.slice(0, 50)); }
      }
    }
    probe.push({ key: e.key, methods: e.methods, ok, notAllowed, other, otherErrs, methodNames: e.methodNames });
  }

  probe.sort((a, b) => b.methods - a.methods);

  console.log('RESULT' + JSON.stringify({
    totalKeys: keys.length,
    wiredCount: wired.length,
    unwiredCount: unwired.length,
    unwired: probe.map(p => ({
      key: p.key, methods: p.methods, ok: p.ok, notAllowed: p.notAllowed,
      other: p.other, otherErrs: p.otherErrs,
    })),
    fullyUnreachable: probe.filter(p => p.ok === 0 && p.methods > 0).map(p => ({ key: p.key, methods: p.methods })),
  }, null, 1));
  process.exit(0);
})().catch(e => { console.log('FATAL ' + e.message); process.exit(1); });
