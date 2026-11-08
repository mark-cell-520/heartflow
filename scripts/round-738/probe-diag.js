// r738 诊断：测试 fail 样本的 gate/pe 实际返回
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));
const pe = require(path.join(ROOT, 'src/perfect-error.js'));

console.log('pe exports:', Object.keys(pe).join(', '));
console.log('checkPerfectError type:', typeof pe.checkPerfectError);

for (const t of ['一定要注意备份数据库', '这一定是正确答案', '这绝对是最好的选择']) {
  const r = pe.checkPerfectError(t);
  console.log(`\nPE(${t}):`, JSON.stringify(r).slice(0, 300));
}

for (const t of ['一定要注意备份数据库', '处理用户数据时一定要遵守隐私规范',
  'The most significant part of the work is already done',
  'Our solution is the most advanced platform ever built']) {
  const g = gate(t);
  const dims = (g.findings || []).map(f => `${f.dimension}@${f.severity}`).join(', ');
  console.log(`\nGATE(${t.slice(0, 30)}): action=${g.gate && g.gate.action} dims=[${dims}]`);
}
