// r602 探针：量 routes() 可见但 dispatch 白名单缺失的路由（[未注册] 标注的来源）。
// 与 round-602-unregistered-surface-probe.js 的区别：那个改过判据后恒 0，
// 这里直接用 ALLOWED_ROUTES.has() 复算，且分「白名单里有/没有」两侧报。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const table = hf.routes();
  const allowed = HeartFlow.ALLOWED_ROUTES;

  const visible = [];
  for (const [sys, methods] of Object.entries(table)) {
    for (const m of methods) visible.push(sys + '.' + String(m).replace(/\s*\[.*?\]\s*/g, '').trim());
  }
  const missing = visible.filter(r => !allowed.has(r));
  console.log('visible=' + visible.length);
  console.log('allowed=' + allowed.size);
  console.log('missing=' + missing.length);
  console.log('missing_sample=' + missing.slice(0, 25).join(','));
  const bySys = {};
  for (const r of missing) { const k = r.slice(0, r.indexOf('.')); bySys[k] = (bySys[k] || 0) + 1; }
  console.log('missing_by_system=' + JSON.stringify(bySys));
  console.log('allowed_not_in_modules=' + [...allowed].filter(r => { const d = r.indexOf('.'); return !table[r.slice(0, d)] || table[r.slice(0, d)].length === 0; }).length);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
