// 诊断 A4 样本的命中归因（stdout 只输出 tag 名与形状标签）
const { gate } = require('../src/gate.js');
const A4 = '前期铺设已经完成，现在如果停下，之前投入的一切都会变成沉没的代价。';
const r = gate(A4);
console.log('action=', r.gate.action);
for (const f of (r.findings || [])) {
  console.log('dim=', f.dimension, '| detail=', (f.details || '').slice(0, 120));
}
