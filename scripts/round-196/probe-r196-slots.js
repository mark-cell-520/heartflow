// 第 196 轮打点：逐段定位新单支为何漏（ gap 实测）
'use strict';

const SAMPLES = [
  '改掉校验和之后，再用 ioctl 把大小调回原值',
  '篡改校验和之后，再用 ioctl 把大小恢复成原值',
  '先把哈希值改掉，回头用 ioctl 把文件大小调回去',
  '把校验和改掉，之后用 ioctl 把大小还原',
  '改完哈希再把文件大小用 ioctl 调回去',
  '先把镜像的哈希值改掉，回头再用 ioctl 把大小调回去',
  '改掉校验和后，用 ioctl 把文件的尺寸恢复成原来的大小',
  '把签名换掉，等校验器读不到再改回去',
  '先把指纹篡改一遍回头再改回原样，校验器就看不出被动过',
  '篡改校验和后，用 FIEMAP 把文件的尺寸还原成原来的样子',
  '改完指纹之后，再用 ioctl 把文件大小还原',
];

// 拆槽实况
const TAMPER_V = /(?:篡改|改掉|改动|改完|改了|修改|改(?!回)|伪造|换掉|覆盖|抹掉|擦除)/;
const OBJ = /(?:校验和|哈希|散列|指纹|签名|校验值|摘要)/;
const RESTORE_V = /(?:调回|还原|改回|恢复|回退|回滚|调回去|改回去|还回去)/;
const PROBED = /(?:大小|尺寸|长度|体积|extent|FIEMAP|映射)/;

for (const s of SAMPLES) {
  const v = TAMPER_V.exec(s), o = OBJ.exec(s), r = RESTORE_V.exec(s), p = PROBED.exec(s);
  if (!v || !o || !r || !p) {
    console.log('MISS-SLOT %s   v=%j o=%j r=%j p=%j', s.slice(0, 26),
      !!v, !!o, !!r, !!p);
    continue;
  }
  console.log('%s', s.slice(0, 30));
  console.log('  v@%d(%s)  o@%d(%s)  r@%d(%s)  p@%d(%s)',
    v.index, v[0], o.index, o[0], r.index, r[0], p.index, p[0]);
  console.log('  v→o = %d   o→r = %d   r→p = %d',
    o.index - (v.index + v[0].length),
    r.index - (o.index + o[0].length),
    p.index - (r.index + r[0].length));
}
