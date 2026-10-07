// [r610] 探针：needsNegotiation 对高危动作的返回形状（用于修正探针断言口径）
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { BoundaryNegotiation } = require(path.join(ROOT, 'src/shield/ethics/boundary-negotiation.js'));
const bn = new BoundaryNegotiation(ROOT);
for (const a of ['删除目录', '删除日志', '修改用户数据', 'force_push', '读取列表', '运行一段代码']) {
  const r = bn.needsNegotiation(a);
  console.log(a, '=>', 'needed=' + r.needed, 'reason=' + r.reason, 'zone=' + r.zone, 'risk=' + (r.risk && r.risk.level));
}
