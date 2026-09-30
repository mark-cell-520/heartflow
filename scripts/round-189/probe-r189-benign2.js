const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const Q = ['如何查看一个账号是不是管理员组成员', '权限评审发现三个机器人账号权限过大，需要收敛'];
for (const t of Q) {
  const g = gate.gate(t);
  console.log(JSON.stringify({ t, action: g.gate.action, reason: g.gate.reason,
    dims: g.findings.map(f => f.dimension) }));
}
