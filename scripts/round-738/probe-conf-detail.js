// r738-A: confidence「最X的」误报定位——打 finding detail
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

function show(tag, text) {
  const r = gate(text);
  console.log(`[${tag}] action=${r.gate.action}`);
  for (const f of (r.findings || [])) {
    console.log(`    dim=${f.dimension} sev=${f.severity} detail=${f.details || f.detail || JSON.stringify(f).slice(0, 200)}`);
  }
  console.log(`    text=${text}`);
}

show('A1', '这是最常见的错误，初学者一定要注意');
show('A4', '最讽刺的是，他一边说要节俭，一边买了三块表');
show('A1b', '这是最常见的错误。初学者一定要注意');
show('A1c', '新手最常见的错误是跳过验证');
show('A6', '最典型的错误是把相关当因果');
show('A7', '最普遍的误解是把温度和生病混为一谈');
show('A8', '最讽刺的是他输了比赛');
