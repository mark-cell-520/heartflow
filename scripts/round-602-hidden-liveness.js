// r602 探针：逐个试调 hidden instance 的公开方法，看「能不能真跑起来」。
// 目的：区分「能真跑的未暴露能力」与「只在 this 上挂着、一调就炸」的残骸。
// 只输出计数与名字，不贴样本原文。
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

    let ok = 0, bad = 0;
    const fails = [];
    for (const m of all.slice(0, 4)) {
      try {
        const r = v[m]();
        // 返回值是对象的算真跑通
        if (r !== undefined) ok++; else bad++;
      } catch (e) { bad++; fails.push(m + ':' + String(e.message).slice(0, 30)); }
    }
    rows.push({ k, n: all.length, ok, bad, fails: fails.slice(0, 2) });
  }
  rows.sort((a, b) => b.n - a.n);
  const noThrow = rows.filter(r => r.bad === 0);
  const withThrow = rows.filter(r => r.bad > 0);
  console.log('total=' + rows.length);
  console.log('no_throw=' + noThrow.length);
  console.log('with_throw=' + withThrow.length);
  console.log('no_throw_list=' + noThrow.map(r => r.k + '(' + r.n + ')').join(','));
  console.log('with_throw_list=' + withThrow.map(r => r.k + '(' + r.n + ',bad' + r.bad + ')').join(','));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
