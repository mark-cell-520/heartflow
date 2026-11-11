// r291 方向轮换缺口实证：dreamConsolidation 是否「已实例化但 0 条 dispatch 路由」
// 对 HEAD（未接线版）与工作区（接线版）各跑一遍。
const path = require('path');
const fs = require('fs');
// 向上找含 package.json + src/core/heartflow.js 的仓库根（探针可能在子目录）
let ROOT = __dirname;
for (let i = 0; i < 6; i++) {
  if (fs.existsSync(path.join(ROOT, 'src', 'core', 'heartflow.js'))) break;
  ROOT = path.dirname(ROOT);
}

async function probe(label) {
  const out = { label };
  // 1) 模块可加载 + 公开方法数
  try {
    const mod = require(path.join(ROOT, 'src/dream/dream-consolidation.js'));
    const DC = mod.DreamConsolidation || mod;
    const dc = new DC(null);
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(dc))
      .filter(m => m !== 'constructor' && !m.startsWith('_'));
    out.methods = methods;
    out.methodCount = methods.length;
  } catch (e) { out.moduleError = e.message; }

  // 2) 引擎侧：实例存在？_modules 名单里有吗？路由可 dispatch 吗？
  try {
    const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
    const hf = new HeartFlow({});
    out.instanceAliveBeforeStart = !!(hf.dreamConsolidation);
    try {
      if (typeof hf.start === 'function') await hf.start();
      else if (typeof hf.init === 'function') await hf.init();
    } catch (e) { out.startError = String(e.message).slice(0, 120); }
    out.instanceAlive = !!(hf.dreamConsolidation);
    out.inSubsystemNames = !!(hf.dreamConsolidation) && hf._subsystems && Array.isArray(hf._subsystems)
      ? hf._subsystems.includes('dreamConsolidation') : 'n/a';
    // generateAllowedRoutes 扫出的路由里有没有 dreamConsolidation.*
    let allowed = null;
    try {
      allowed = typeof hf.generateAllowedRoutes === 'function' ? hf.generateAllowedRoutes() : null;
    } catch (_) {}
    if (Array.isArray(allowed)) {
      out.totalRoutes = allowed.length;
      out.dcRoutes = allowed.filter(r => String(r).startsWith('dreamConsolidation'));
    } else {
      out.allowedRoutesType = typeof allowed;
    }
    // 实际 dispatch 试探
    const probes = ['dreamConsolidation.dreamNow', 'dreamConsolidation.getDreamHistory', 'dreamConsolidation.getDecayParams'];
    out.dispatch = {};
    for (const p of probes) {
      try {
        if (typeof hf.dispatch === 'function') { hf.dispatch(p); out.dispatch[p] = 'ok'; }
        else { out.dispatch[p] = 'no-dispatch-fn'; }
      } catch (e) { out.dispatch[p] = 'THROW: ' + String(e.message).slice(0, 60); }
    }
  } catch (e) { out.engineError = e.message; }
  return out;
}

(async () => {
  const res = await probe(process.argv[2] || 'run');
  console.log(JSON.stringify(res, null, 2));
})();
