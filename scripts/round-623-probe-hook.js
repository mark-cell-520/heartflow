#!/usr/bin/env node
/* r623 黑盒实测：sycophancy-check 插件在 think() 主链路上是否真的被调用？
 * 注入-观察法：注册一个哨兵 hook 到 postprocess.think，看它是否触发。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const HF = require(path.join(ROOT, 'src/core/heartflow.js'));
  const HeartFlow = HF.HeartFlow || (HF.default && HF.default.HeartFlow) || HF;
  const hf = new HeartFlow();
  console.log('instance OK, typeof think =', typeof hf.think);

  // 找 hookBus
  const hb = hf.hookBus || (hf._ctx && hf._ctx.hookBus);
  console.log('hookBus present:', !!hb);
  if (!hb) {
    // 尝试常见名字
    for (const k of Object.keys(hf)) {
      const v = hf[k];
      if (v && typeof v.on === 'function' && typeof v.emit === 'function') {
        console.log('  candidate bus field:', k);
      }
    }
    process.exit(0);
  }

  let fired = 0;
  hb.on('postprocess.think', () => { fired++; });

  const r = await hf.think('请帮我评估一下这个方案是否可行');
  console.log('think done. hook fired:', fired);
  console.log('result._discrimination keys:', r && r._discrimination ? Object.keys(r._discrimination).join(',') : '(none)');
  console.log('result._sycophancyAnalyzer present:', !!r && !!r._sycophancyAnalyzer);
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
