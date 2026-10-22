// r602 探针：对「真能空参跑起来」的 hidden instance 逐个试真实业务调用。
// 输入用形状里与本轮目标（辨别/自省/记忆能力暴露）相关的调用。
// 只输出计数与 names，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const moduleKeys = new Set(Object.keys(hf._modules));
  const rows = [];
  for (const k of Object.keys(hf)) {
    if (k.startsWith('_')) continue;
    if (moduleKeys.has(k)) continue;
    const v = hf[k];
    if (!v || typeof v !== 'object') continue;
    const proto = Object.getPrototypeOf(v);
    let methods = [];
    if (proto && proto !== Object.prototype) {
      methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof v[m] === 'function' && !m.startsWith('_'));
    }
    const own = Object.keys(v).filter(m => typeof v[m] === 'function' && !m.startsWith('_'));
    const all = [...new Set([...methods, ...own])];
    if (all.length === 0) continue;

    // 试真实业务调用（传参数）
    const results = [];
    for (const m of all.slice(0, 5)) {
      try {
        let r;
        if (/healthCheck|getStats|getSummary|getStatus|quick|assess/.test(m)) r = v[m]();
        else if (/detect|judge|evaluate|check|analyse|analyze|process|record|review/.test(m)) r = v[m]('这是一个需要辨别的陈述：该方案绝对可行，毫无风险。', {});
        else r = v[m]('这是一个需要辨别的陈述：该方案绝对可行，毫无风险。');
        results.push({ m, ok: true, type: r === null ? 'null' : typeof r });
      } catch (e) { results.push({ m, ok: false, err: String(e.message).slice(0, 40) }); }
    }
    const okCount = results.filter(r => r.ok && r.type === 'object').length;
    rows.push({ k, n: all.length, okCount, sample: results.slice(0, 3) });
  }
  rows.sort((a, b) => b.n - a.n);
  for (const r of rows) console.log(r.n + '\t' + r.k + '\tobj_ok=' + r.okCount + '\t' + r.sample.map(s => s.m + ':' + (s.ok ? s.type : 'THROW')).join(','));
  console.log('--- total=' + rows.length);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
