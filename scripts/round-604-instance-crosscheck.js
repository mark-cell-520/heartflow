// r604 交叉验证：探针读的类 vs engine 实际用的实例是否同一对象。
// 疑点：round-604-arp-routes-check.js 读到 HeartFlow.ALLOWED_ROUTES 含
// selfPositioning.* 12 条，但 round-604-unwired-probe.js 又把 aiSelfPositioning
// 列进「未接线」。若 static Set 是实例间共享的，则说明整个进程曾构造过 >1 个
// HeartFlow（探针自己 new 一个 + 引擎内部再 new 一个），静态集合被后构造者覆盖。
// 只输出布尔与计数，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const modPath = path.join(ROOT, 'src/core/heartflow.js');
  const { HeartFlow } = require(modPath);
  console.log('module_path=' + modPath);
  console.log('ALLOWED_ROUTES_before=' + HeartFlow.ALLOWED_ROUTES.size);
  console.log('has_selfPositioning_before=' + [...HeartFlow.ALLOWED_ROUTES].some(r => r.startsWith('selfPositioning.')));

  const hf = new HeartFlow();
  hf.start();
  console.log('ALLOWED_ROUTES_after=' + HeartFlow.ALLOWED_ROUTES.size);
  console.log('has_selfPositioning_after=' + [...HeartFlow.ALLOWED_ROUTES].some(r => r.startsWith('selfPositioning.')));
  console.log('instance_of_module_class=' + (hf.constructor === HeartFlow));
  console.log('hf.selfPositioning===hf.aiSelfPositioning=' + (hf.selfPositioning === hf.aiSelfPositioning));
  console.log('hf.constructor.name=' + hf.constructor.name);
  console.log('hf.selfPositioning_in_modules=' + Object.keys(hf._modules).includes('selfPositioning'));

  // 检查 src/index.js 是否又导出一份
  try {
    const idx = require(path.join(ROOT, 'src/index.js'));
    console.log('index_exports_HeartFlow=' + (typeof idx.HeartFlow));
    console.log('index_exports_checkInput=' + (typeof idx.checkInput));
  } catch (e) { console.log('index_require_err=' + e.message); }

  // 是否 engine 内部还构造了别的 HeartFlow（self 引用）
  console.log('hf.heartflow===hf=' + (hf.heartflow === hf));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
