// 诊断 fallacies finding 的 details 实际形态
const { gate } = require('../src/gate.js');
const S = '已经投入这么多资源，现在停下来就等于前面全部白做。';
const r = gate(S);
console.log('action=', r.gate.action);
for (const f of (r.findings || [])) {
  console.log('dim=', f.dimension);
  console.log('details=', JSON.stringify(f.details));
  console.log('guidance=', (f.guidance || '').slice(0, 80));
  console.log('---');
}
