// r738-A4: 「一定要注意」族 gate 终判 + perfect_error 基线分来源
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

function show(tag, text) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
  console.log(`[${tag}] action=${r.gate.action} score=${r.overallScore} dims=[${dims}]  ${text}`);
}

show('T1', '一定要注意');
show('T2', '初学者一定要注意');
show('T3', '同学们一定要注意');
show('T4', '一定要注意备份数据库');
show('T5', '一定要注意这个问题');
show('T6', '请大家务必注意安全');
show('T7', '需要注意的是，接口有速率限制');
