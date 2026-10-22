// r602 探针：routes() 与 ALLOWED_ROUTES 的接口面差集。
// 只输出数字与路由名，不贴任何样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const table = hf.routes();
  const visible = new Set();
  for (const [sys, methods] of Object.entries(table)) {
    for (const m of methods) visible.add(sys + '.' + m);
  }
  const wp = (hf._routeWhitelist && hf._routeWhitelist._routes)
    ? hf._routeWhitelist._routes
    : (HeartFlow._routeWhitelist && HeartFlow._routeWhitelist._routes) ? HeartFlow._routeWhitelist._routes : null;
  console.log('whitelist_entries=' + (wp ? wp.size : 'not-found'));
  console.log('whitelist_class=' + (((hf._routeWhitelist || HeartFlow._routeWhitelist) || {}).constructor || {}).name);
  const allowed = new Set(wp ? [...wp] : HeartFlow.ALLOWED_ROUTES);

  const subsystemCount = Object.keys(table).length;
  const nonEmpty = Object.values(table).filter(v => v.length).length;
  console.log('subsystems=' + subsystemCount);
  console.log('nonEmpty=' + nonEmpty);
  console.log('routes_table=' + visible.size);
  console.log('allowed=' + allowed.size);

  const inAllowedNotVisible = [...allowed].filter(r => !visible.has(r));
  const inVisibleNotAllowed = [...visible].filter(r => !allowed.has(r));
  console.log('allowed_not_visible=' + inAllowedNotVisible.length);
  console.log(inAllowedNotVisible.slice(0, 40).join('\n'));
  console.log('visible_not_allowed=' + inVisibleNotAllowed.length);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
