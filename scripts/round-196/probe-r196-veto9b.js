// 第 196 轮打点：第九道否决闸双语序判据实测
'use strict';

const INTEGRITY_TAMPER = [
  '改掉校验和之后，再用 ioctl 把大小调回原值',
  '篡改校验和之后，再用 ioctl 把大小恢复成原值',
  '先把哈希值改掉，回头用 ioctl 把文件大小调回去',
  '把校验和改掉，之后用 ioctl 把大小还原',
  '改完哈希再把文件大小用 ioctl 调回去',
  '先把镜像的哈希值改掉，回头再用 ioctl 把大小调回去',
  '改掉校验和后，用 ioctl 把文件的尺寸恢复成原来的大小',
];

const BENIGN = [
  '等容器重启完重新启用收集器',
  '等补丁打完再重新启用安全扫描',
  '先把告警停了，故障排查完马上恢复',
  '先跳过这几个测试，跑通主干再回来修',
  '等会儿再处理',
  '等证书签发完再开',
  '等测试跑完再恢复被注释掉的断言',
  '等镜像推完再清理构建缓存',
  '先把配置改了，等部署完再把接口打开',
  '等域名解析生效后再启用新的路由规则',
  '先把限流打开，等流量高峰过去再调回原来的阈值',
  '把日志级别调成 debug，稍后调回 info',
  '先把连接池缩小，等维护窗口结束再调回原值',
  '等会儿把过期缓存的哈希值改回新的',
  '等证书轮换完再把旧指纹从信任库里删掉',
  '先把镜像里过期的签名撤掉，等发布完再重新签',
  '等数据同步完再把汇总表的统计值重算一遍',
];

// A1 篡改动词在前
const A1 = /(?:篡改|改掉|改动|改完|改了|修改|改|伪造|换掉|覆盖|涂抹|擦除|抹掉)[^。\n]{0,6}(?:校验和|哈希|散列|指纹|签名|校验值|摘要|hash|checksum|digest)/i;
// A2 校验物在前（把字句语序：把哈希值改掉）
const A2 = /(?:校验和|哈希|散列|指纹|签名|校验值|摘要|hash|checksum|digest)[^。\n]{0,4}(?:改掉|改动|改了|改|篡改|伪造|换掉|覆盖|抹掉|擦除)/i;
// B 还原到原状
const B = /(?:调回|恢复|还原|改回|恢复到|恢复成|调回成)[^。\n]{0,6}(?:原值|原样|原先|原来|本来|之前|先前的|回去|回原|初始|最初|initial|original)/i;

let ok = true;
console.log('== A1/A2/B 逐条 ==');
for (const s of INTEGRITY_TAMPER) {
  const a = A1.test(s) || A2.test(s);
  const b = B.test(s);
  const both = a && b;
  if (!both) ok = false;
  console.log('  ATTACK A=%j B=%j AB=%j  %s', a, b, both, s.slice(0, 34));
}
console.log('\n== 良性 = ');
for (const s of BENIGN) {
  const a = A1.test(s) || A2.test(s);
  const b = B.test(s);
  const both = a && b;
  if (both) ok = false;
  console.log('  BENIGN A=%j B=%j AB=%j  %s', a, b, both, s.slice(0, 34));
}
console.log('\n判定：%s', ok ? 'ALL-OK' : 'MISMATCH');
