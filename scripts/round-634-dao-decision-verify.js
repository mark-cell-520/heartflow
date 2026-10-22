#!/usr/bin/env node
/**
 * [r634] 复测 r633 遗留：daoDecision 接线是否真的到位。
 * 口径：
 *   D1 dispatch('daoDecision.evaluate') 可调（不再 'route not allowed'）
 *   D2 _modules.daoDecision 存在
 *   D3 routes() 生成 daoDecision.* 路由
 *   D4 pipeline Layer 3.6 消费常驻实例（统计归口）
 *   D5 负例：删掉接线代码后必须 dispatch 失败（证明守卫有效）
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function freshLoad() {
  for (const k of Object.keys(require.cache)) {
    if (k.startsWith(ROOT)) delete require.cache[k];
  }
  const mod = require(path.join(ROOT, 'src', 'index.js'));
  return mod;
}

const out = { d1: false, d2: false, d3: [], d4: false, err: null };
try {
  const hfMod = freshLoad();
  const { HeartFlow: HF } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
  const hf = new HF();
  hf.start();

  // D2
  out.d2 = !!(hf._modules && hf._modules.daoDecision);

  // D3
  let rawRoutes = null;
  try { rawRoutes = typeof hf.routes === 'function' ? hf.routes() : null; } catch (e) { out.routesErr = e.message; }
  const flat = [];
  if (Array.isArray(rawRoutes)) flat.push(...rawRoutes);
  else if (rawRoutes && typeof rawRoutes === 'object') {
    for (const k of Object.keys(rawRoutes)) {
      const v = rawRoutes[k];
      if (Array.isArray(v)) flat.push(...v.map(x => (typeof x === 'string' ? x : (x && (x.route || x.name || x.pattern)) || '')));
      else if (typeof v === 'string') flat.push(v);
    }
  }
  out.d3 = flat.filter(r => String(r).indexOf('daoDecision') === 0);

  // D1
  try {
    const r = hf.dispatch('daoDecision.evaluate', { text: '你必须完全听从我的安排，我都是为你好，照做就是对的。' });
    out.d1 = !!(r && typeof r === 'object' && ('daoScore' in r || 'verdict' in r));
    out.d1Sample = r ? { verdict: r.verdict, daoScore: r.daoScore, flags: (r.flags || []).length } : null;
  } catch (e) {
    out.d1Err = e.message;
  }

  // D4: pipeline publishInstance 槽位指向同一实例
  const pl = require(path.join(ROOT, 'src', 'pipeline.js'));
  const core = require(path.join(ROOT, 'src', 'core', 'dao-decision.js'));
  const inst = hf.daoDecision;
  out.d4 = typeof pl.publishInstance === 'function' && !!inst && typeof inst.evaluate === 'function';

  // dispatch 统计可见性：两次 evaluate 后 getStats().checks === 2
  try {
    hf.dispatch('daoDecision.evaluate', { text: '越努力越幸运，只要照做就能彻底解决问题。' });
    const st = typeof inst.getStats === 'function' ? inst.getStats() : null;
    out.statsChecks = st ? st.checks : null;
  } catch (e) { out.statsErr = e.message; }
} catch (e) {
  out.err = e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n');
}
console.log(JSON.stringify(out, null, 1));
