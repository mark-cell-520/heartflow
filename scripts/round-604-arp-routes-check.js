// r604 核心复测：selfPositioning 路由实况 + ALLOWED_ROUTES 全量形态。
// 关键：ALLOWED_ROUTES 是 HeartFlow 的 static 属性（L1189），
// 上一版探针按 hf.ALLOWED_ROUTES / hf._allowedRoutes 取，都取错 → 得到 null 假阴性。
// 本探针直接读 HeartFlow.ALLOWED_ROUTES（static Set），并对每个路由逐条试 dispatch。
// 只输出布尔、路由名、错误类型，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const AR = HeartFlow.ALLOWED_ROUTES;
  console.log('ALLOWED_ROUTES_type=' + (AR && AR.constructor && AR.constructor.name));
  const all = [...AR];
  console.log('ALLOWED_ROUTES_total=' + all.length);

  const spRoutes = all.filter(r => r.startsWith('selfPositioning.'));
  console.log('selfPositioning_routes=' + spRoutes.length);
  console.log('  ' + spRoutes.join('\n  '));

  // 逐条试 dispatch（不传参，看是否能过权限+到达方法）
  for (const r of spRoutes) {
    try {
      const v = hf.dispatch(r, {});
      console.log(`  dispatch(${r}, {}) = OK type=${v && v.constructor ? v.constructor.name : typeof v}`);
    } catch (e) {
      console.log(`  dispatch(${r}, {}) = THROW:${String(e.message).slice(0, 70)}`);
    }
  }

  // 对比：routes() 报告的数量 vs ALLOWED_ROUTES 数量（r602 遗留「假阴性」线索）
  let routesFn;
  try { routesFn = typeof hf.routes === 'function' ? hf.routes() : null; } catch (e) { routesFn = 'THROW:' + e.message; }
  const routesCount = Array.isArray(routesFn) ? routesFn.length : (typeof routesFn === 'number' ? routesFn : String(routesFn).slice(0, 40));
  console.log('routes()_count=' + routesCount);
  if (Array.isArray(routesFn)) {
    const unreg = routesFn.filter(r => String(r).includes('未注册'));
    console.log('routes()_unregistered=' + unreg.length);
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
