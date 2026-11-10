// r275 定位 B3：gate 层 completion_evidence 命中的真实来源
const root = '/root/hermes1/skills/ai/mark-heartflow-skill';
const hf = require(root + '/src/gate.js');

const t = '我已经修复了这个问题，commit 3f2a91b，verify 16/0。';
const r = hf.gate(t);
console.log('gate.action =', r.gate.action);
console.log('verdict =', r.verdict);
console.log('\n=== 全部 findings ===');
for (const f of (r.findings || [])) {
  console.log(`  ${f.dimension}  sev=${f.severity}  ${(f.details || '').slice(0, 100)}`);
}
console.log('\n=== checked_by ===');
for (const c of (r.checked_by || [])) {
  console.log(' ', JSON.stringify(c).slice(0, 160));
}
