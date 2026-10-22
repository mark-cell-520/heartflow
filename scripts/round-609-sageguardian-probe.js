'use strict';
// 一次性探针：sageGuardian 接线后实测 —— 路由数 / 模块键 / 逐条 dispatch
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const hf = new HeartFlow();
hf.start();
const all = Array.from(HeartFlow.ALLOWED_ROUTES || []).filter(r => r.startsWith('sageGuardian.')).sort();
const out = { routes: all.length, routeList: all, modules: Object.keys(hf._modules).length, key: !!hf._modules['sageGuardian'], allRoutes: Array.from(HeartFlow.ALLOWED_ROUTES || []).length };
for (const r of all) {
  try {
    const v = hf.dispatch(r);
    out['R:' + r] = { ok: true, type: typeof v };
  } catch (e) {
    out['R:' + r] = { ok: false, err: String(e && e.message).slice(0, 120) };
  }
}
process.stdout.write('\nOUT:' + JSON.stringify(out) + '\n');
