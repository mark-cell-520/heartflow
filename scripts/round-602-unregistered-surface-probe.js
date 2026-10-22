// r602 探针：量出 routes() 里 [未注册] 标注的路由 —— 接口面看得见但 dispatch 白名单没有。
// 只输出路由名与计数，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const table = hf.routes();
  const allowed = HeartFlow.ALLOWED_ROUTES;

  const unregistered = [];
  let total = 0;
  for (const [sys, methods] of Object.entries(table)) {
    for (const m of methods) {
      total++;
      const s = String(m);
      if (s.includes('[未注册]')) {
        const bare = s.replace(/\s*\[未注册\]/g, '');
        unregistered.push(sys + '.' + bare);
      }
    }
  }
  const bySys = {};
  for (const r of unregistered) { const k = r.slice(0, r.indexOf('.')); bySys[k] = (bySys[k] || 0) + 1; }
  console.log('total_routes=' + total);
  console.log('allowed=' + allowed.size);
  console.log('unregistered_count=' + unregistered.length);
  const sysKeys = Object.keys(bySys).sort((a, b) => bySys[b] - bySys[a]);
  console.log('systems_with_unregistered=' + sysKeys.length);
  console.log(sysKeys.map(k => k + ':' + bySys[k]).join(', '));
  console.log('sample_unregistered=' + unregistered.slice(0, 30).join(','));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
