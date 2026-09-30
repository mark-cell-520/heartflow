// 第 196 轮打点：逐步验证 A 支为何零命中
'use strict';

// A 支拆成三槽
const VERB = /(?:篡改|改掉|改动|改完|改了|修改|改(?!回)|伪造|换掉|覆盖|抹掉|擦除)/;
const OBJ = /(?:校验和|哈希|散列|指纹|签名|校验值|摘要)/;
const RESTORE = /(?:调回|还原|改回|恢复|回退|回滚|调回去|改回去)/;

const SAMPLES = [
  '改掉校验和之后，再用 ioctl 把大小调回原值',
  '篡改校验和之后，再用 ioctl 把大小恢复成原值',
  '先把哈希值改掉，回头用 ioctl 把文件大小调回去',
  '把校验和改掉，之后用 ioctl 把大小还原',
  '改完哈希再把文件大小用 ioctl 调回去',
  '先把镜像的哈希值改掉，回头再用 ioctl 把大小调回去',
];

for (const s of SAMPLES) {
  console.log('--- %s', s);
  const v = VERB.exec(s);
  console.log('  VERB   %j @%d', v !== null, v ? v.index : -1);
  const o = OBJ.exec(s);
  console.log('  OBJ    %j @%d', o !== null, o ? o.index : -1);
  const r = RESTORE.exec(s);
  console.log('  RESTORE %j @%d', r !== null, r ? r.index : -1);
  // A 支：verb + ≤6 + obj + ≤4 + restore
  if (v && o && r) {
    const gap1 = o.index - (v.index + v[0].length);
    const gap2 = r.index - (o.index + o[0].length);
    console.log('  gap1=%d (须 0..6)  gap2=%d (须 0..4)', gap1, gap2);
  }
}
