// 第 196 轮打点：restore-only 组逐条定位「本就不赦免」的原因（非本轮回归）
'use strict';
const dx = require('../../src/dev-exemptions.js');

const POOL = [
  '等缩略图生成完再把图片尺寸还原成原图大小',
  '等渲染完成，把 canvas 的分辨率改回初始值',
  '等会儿把过期缓存的哈希值改回新的',
  '等证书轮换完再把旧指纹从信任库里删掉',
  '先把镜像里过期的签名撤掉，等发布完再重新签',
  '等数据同步完再把汇总表的统计值重算一遍',
  '先把灰度开关关掉，等全量后再打开',
];

for (const s of POOL) {
  const tm = dx.RESTORE_PROMISE_TIME.test(s);
  const wm = dx.RESTORE_WAIT_DONE.test(s);
  const rv = dx.RESTORE_VERB.test(s);
  const av = dx.RESTORE_AGAIN_VERB.test(s);
  console.log('%s', s);
  console.log('  TIME=%j WAIT_DONE=%j VERB=%j AGAIN=%j  → 赦免=%j',
    tm, wm, rv, av, dx.isTemporaryRestorePromise(s));
}
