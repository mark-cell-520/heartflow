#!/usr/bin/env node
/**
 * r638 hidden-instance 缺口探针
 * 口径与 r604/r606/r608/r630/r636 一致：
 *   1) 找出引擎里已构造的子系统实例（在 _modules 之外、生命周期名单之外的隐藏实例）
 *   2) 双向核对：dispatch('mod.*') 是否抛 route not allowed
 * 输出：可接线候选清单（JSON 落盘 /tmp/r638-unwired.json）
 */
'use strict';
const path = require('path');
const srcdir = path.join(__dirname, '..', 'src');
const { HeartFlow } = require(path.join(srcdir, 'core', 'heartflow.js'));

const hf = new HeartFlow();
try { hf.start(); } catch (_) {}
const keys = Object.keys(hf._modules || {});
const _routesRaw = typeof hf.routes === 'function' ? hf.routes() : [];
const routes = new Set(Array.isArray(_routesRaw) ? _routesRaw : (_routesRaw && typeof _routesRaw === 'object' ? Object.keys(_routesRaw) : []));

// engine-lifecycle 的 subsystemNames 名单（已在生命周期内的不算 hidden）
let lifecycleNames = new Set();
try {
  const lc = require(path.join(srcdir, 'core', 'engine-lifecycle.js'));
  if (Array.isArray(lc.subsystemNames)) lifecycleNames = new Set(lc.subsystemNames);
  else if (lc.subsystemNames && typeof lc.subsystemNames === 'object') {
    lifecycleNames = new Set(Object.keys(lc.subsystemNames));
  }
} catch (_) { /* 名单不可用时退化为「只按 _modules 判」 */ }

// 候选：hf 自身字段里的对象实例，且含多个原型方法，且不在 _modules 键里
const cands = [];
for (const k of Object.keys(hf)) {
  if (k.startsWith('_')) continue;
  const v = hf[k];
  if (!v || typeof v !== 'object') continue;
  const proto = Object.getPrototypeOf(v);
  if (!proto || proto === Object.prototype) continue;
  const methods = Object.getOwnPropertyNames(proto)
    .filter(m => m !== 'constructor' && typeof v[m] === 'function');
  if (methods.length < 3) continue;
  const wired = keys.includes(k);
  const inLifecycle = lifecycleNames.has(k);
  cands.push({ key: k, methods: methods.length, wired, inLifecycle });
}

// 对未接线的候选做 dispatch 实测
const out = [];
for (const c of cands) {
  if (c.wired) continue;
  const mod = hf[c.key];
  const proto = Object.getPrototypeOf(mod);
  const ms = Object.getOwnPropertyNames(proto)
    .filter(m => m !== 'constructor' && typeof mod[m] === 'function').slice(0, 20);
  const results = [];
  for (const m of ms) {
    let status = 'ok';
    try { hf.dispatch(`${c.key}.${m}`, {}); } catch (e) {
      status = /not allowed/.test(String(e && e.message)) ? 'route_not_allowed' : 'threw:' + String(e && e.message).slice(0, 60);
    }
    results.push(m + '=' + status);
  }
  const na = results.filter(r => /route_not_allowed/.test(r)).length;
  out.push({
    key: c.key,
    methods: c.methods,
    inLifecycle: c.inLifecycle,
    routeNotAllowed: na,
    tested: results.length,
    sample: results.slice(0, 6),
  });
}

out.sort((a, b) => (b.routeNotAllowed / Math.max(1, b.tested)) - (a.routeNotAllowed / Math.max(1, a.tested)) || b.methods - a.methods);

const summary = {
  modulesKeys: keys.length,
  totalRoutes: routes.size,
  lifecycleNames: lifecycleNames.size,
  candidateObjects: cands.length,
  alreadyWired: cands.filter(c => c.wired).length,
  unwiredZeroDispatch: out.length,
  top: out.slice(0, 25),
};
console.log(JSON.stringify(summary, null, 1));
require('fs').writeFileSync('/tmp/r638-unwired.json', JSON.stringify(summary, null, 1));
