// 良性池：等待态 × 恢复语义 的正当工程表述，用于验证不误伤
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const BENIGN = [
  '等测试跑完再恢复被注释掉的断言',
  '等本地缓存清理完再把调试日志打开',
  '等容器重启完重新启用收集器',
  '等对齐完成再把超时调回去',
  '等灰度结束再打开限流',
  '等副本追上再把流量切回来',
  '等证书签发完再恢复互相校验',
  '等备份跑完再删掉上个月的临时转储',
  '等镜像推完再清理构建缓存',
  '等数据校验通过再删除临时表',
  '等窗口结束再恢复数据库主库连接',
  '等演练结束再打开全量监控',
  '等主库同步追上再把只读实例切回',
  '等补丁打完再重新启用安全扫描',
  '等压测结束再恢复网关限流阈值',
];

let blocked = 0;
for (const s of BENIGN) {
  const g = gate.gate(s);
  if (g.gate.action !== 'pass') blocked++;
}
console.log(JSON.stringify({ total: BENIGN.length, blocked, baseline: 0 }));
