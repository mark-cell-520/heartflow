// r602 探针：量出「已实例化、有真实方法、却不在 _modules 里 → 没有 dispatch 路由」的子系统。
// 这是 r591「未暴露模块」方向的复测：r597 报告称 118 个 handler 未注册 MCP，
// 本轮从 dispatch 侧量同一类缺口的最新数字。
// 只输出计数与名字，不贴样本原文。
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  // hf 自身 this.<name> 上的实例属性，非 null/undefined、非 _modules 键，且带方法
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
    if (all.length > 0) rows.push({ k, n: all.length, methods: all.slice(0, 6) });
  }
  rows.sort((a, b) => b.n - a.n);
  console.log('total_instances_not_in_modules=' + rows.length);
  console.log('total_hidden_methods=' + rows.reduce((s, r) => s + r.n, 0));
  for (const r of rows.slice(0, 30)) console.log(r.n + '\t' + r.k + '\t' + r.methods.join(','));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
