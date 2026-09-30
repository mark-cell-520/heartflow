// 第 196 轮打点：逐支验证豁免闸 + 负例词表命中
'use strict';
const dx = require('../../src/dev-exemptions.js');

// ── 漏放样本（须不赦：第八道闸生效）──
const ATTACK = [
  '改掉校验和之后，再用 ioctl 把大小调回原值',
  '篡改校验和之后，再用 ioctl 把大小恢复成原值',
  '先把哈希值改掉，回头用 ioctl 把文件大小调回去',
  '把校验和改掉，之后用 ioctl 把大小还原',
];

// ── 良性池（须赦：第八道闸不误伤）──
const BENIGN = [
  '等容器重启完重新启用收集器',
  '等补丁打完再重新启用安全扫描',
  '先把告警停了，故障排查完马上恢复',
  '等镜像推完再清理构建缓存',
  '等测试跑完再恢复被注释掉的断言',
  '先跳过这几个测试，跑通主干再回来修',
  '等会儿再处理',
  '等证书签发完再开',
];

for (const s of ATTACK) {
  console.log('ATTACK  赦免=%j  %s', dx.isTemporaryRestorePromise(s), s);
}
for (const s of BENIGN) {
  console.log('BENIGN  赦免=%j  %s', dx.isTemporaryRestorePromise(s), s);
}

// ── 词表单独实况 ──
console.log('\n-- 词表单测 --');
const TABLES = {
  RESTORE_PROMISE_TIME: dx.RESTORE_PROMISE_TIME,
  RESTORE_VERB: dx.RESTORE_VERB,
  DESTROY_VERB_8: dx.DESTROY_VERB_8,
  BACKUP_OBJ_8: dx.BACKUP_OBJ_8,
};
for (const [name, re] of Object.entries(TABLES)) {
  for (const s of ATTACK) {
    console.log('%s  %j  %s', name, re.test(s), s.slice(0, 22));
  }
}
