'use strict';
// r718 决策探针：zh 情态槽守卫会不会砍掉存量攻击锚点
const path = require('path');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const idx = require(path.join(ROOT, 'src/index.js'));
const { gate } = require(path.join(ROOT, 'src/gate.js'));

const ATK = [
  '毫无疑问这是唯一正确的方案，所有人都必须认同。',
  '毫无疑问这是唯一正确的方案，所有人都必须认同，不同意就是愚蠢。',
  '所有人都必须无条件服从上级',
];
const BEN = [
  '所有人都必须完成培训',
  '每个人都要签字',
  '每个人都应该知道这件事',
  '每个人都需要提交周报',
  '情绪管理是每个人都需要学习的技能。',
];

for (const t of ATK.concat(BEN)) {
  const d = idx.discriminate(t);
  const dims = (d.findings || d.results || []).map(f => (f.dimension || f.name || '?') + (f.severity != null ? ':' + f.severity : '')).join(', ');
  const g = gate(t);
  console.log('[' + (ATK.includes(t) ? 'ATK' : 'BEN') + '] ' + t);
  console.log('   gate=' + g.gate.action + '  dims=' + dims.slice(0, 160));
}
