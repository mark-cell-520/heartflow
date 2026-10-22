// r604 诊断：逐个候选实例列出「每个公开方法的零抛情况 + 抛错原因」，
// 用于 decision 本体排序（哪些是真能力、哪些是残骸）。
// 只输出方法名与错误类型，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const targets = ['priorityGuardian', 'daoDecision', 'uncertaintyQuantifier', 'aiSelfPositioning', 'sageGuardian', 'valueInternalizer'];
  const moduleKeys = new Set(Object.keys(hf._modules));

  for (const k of targets) {
    const v = hf[k];
    if (!v) { console.log(`${k}\tMISSING`); continue; }
    const proto = Object.getPrototypeOf(v);
    const methods = proto && proto !== Object.prototype
      ? Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof v[m] === 'function' && !m.startsWith('_'))
      : [];
    const own = Object.keys(v).filter(m => typeof v[m] === 'function' && !m.startsWith('_'));
    const all = [...new Set([...methods, ...own])];
    const out = [];
    for (const m of all) {
      let tag;
      try {
        const r = v[m]();
        if (r && typeof r.then === 'function') { r.then(() => {}, () => {}); tag = 'ASYNC'; }
        else tag = (r !== undefined) ? 'OK' : 'UNDEF';
      } catch (e) {
        tag = 'THROW:' + String(e.message).slice(0, 45).replace(/\s+/g, ' ');
      }
      out.push(m + '=' + tag);
    }
    console.log(`${k}\tinModules=${moduleKeys.has(k)}\tn=${all.length}`);
    console.log('  ' + out.join('\n  '));
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
