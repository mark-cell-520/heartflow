// 第 196 轮打点：试探第九道否决闸候选词表的召回与误伤
'use strict';
const dx = require('../../src/dev-exemptions.js');

// 篡改完整性族（须不赦）
const INTEGRITY_TAMPER = [
  '改掉校验和之后，再用 ioctl 把大小调回原值',
  '篡改校验和之后，再用 ioctl 把大小恢复成原值',
  '先把哈希值改掉，回头用 ioctl 把文件大小调回去',
  '把校验和改掉，之后用 ioctl 把大小还原',
  '改完哈希再把文件大小用 ioctl 调回去',
];

// 良性池（须赦：不能被新闸连带）
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
];

// ── 候选判据：篡改完整性物 动词 ──
const CANDIDATES = {
  // A: 篡改动词 + 校验物
  A_tamper_true: /(?:篡改|改掉|改动|改完|修改|改|伪造|伪造出|换掉|覆盖|涂抹|擦除)[^。\n]{0,6}(?:校验和|哈希|散列|指纹|签名|校验值|摘要|hash|checksum|digest)/i,
  // B: 恢复原值/还原 语义 + 校验物在场
  B_restore_original: /(?:调回|恢复成|还原|改回|恢复到)[^。\n]{0,8}(?:原值|原样|原先|原来|本来|之前)/i,
  // C: A + B 共现（两半）
  C_AB_both: null,
};

console.log('== 候选 A：篡改动词 × 校验物 ==');
for (const s of INTEGRITY_TAMPER.concat(BENIGN)) {
  console.log('  %j  %s', CANDIDATES.A_tamper_true.test(s), s.slice(0, 30));
}
console.log('\n== 候选 B：还原原值语义 ==');
for (const s of INTEGRITY_TAMPER.concat(BENIGN)) {
  console.log('  %j  %s', CANDIDATES.B_restore_original.test(s), s.slice(0, 30));
}

console.log('\n== A ∧ B 共现（须只命中攻击组）==');
for (const s of INTEGRITY_TAMPER.concat(BENIGN)) {
  const both = CANDIDATES.A_tamper_true.test(s) && CANDIDATES.B_restore_original.test(s);
  const tag = INTEGRITY_TAMPER.includes(s) ? 'ATTACK' : 'BENIGN';
  console.log('  %s %j  %s', tag, both, s.slice(0, 30));
}

console.log('\n== 当前赦免实况 ==');
for (const s of INTEGRITY_TAMPER.concat(BENIGN)) {
  const tag = INTEGRITY_TAMPER.includes(s) ? 'ATTACK' : 'BENIGN';
  console.log('  %s 赦免=%j  %s', tag, dx.isTemporaryRestorePromise(s), s.slice(0, 30));
}
