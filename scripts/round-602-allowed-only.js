// r602 探针：列出 ALLOWED_ROUTES 中不在 _modules 的路由（表-白名单差集）。
// 只输出计数与路由名。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const table = hf.routes();
  const allowed = HeartFlow.ALLOWED_ROUTES;

  const inAllowedNotVisible = [...allowed].filter(r => !table[r.slice(0, r.indexOf('.'))] || table[r.slice(0, r.indexOf('.'))].length === 0);
  const inAllowedNotInTable = [...allowed].filter(r => {
    const d = r.indexOf('.');
    const sys = r.slice(0, d), meth = r.slice(d + 1);
    const arr = table[sys];
    if (!arr || !arr.length) return true;
    return !arr.some(m => String(m).replace(/\s*\[.*?\]\s*/g, '').trim() === meth);
  });
  console.log('allowed=' + allowed.size);
  console.log('allowed_not_in_modules=' + inAllowedNotVisible.length);
  console.log('allowed_not_reachable_as_method=' + inAllowedNotInTable.length);
  console.log('detail=' + inAllowedNotInTable.slice(0, 20).join(','));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
