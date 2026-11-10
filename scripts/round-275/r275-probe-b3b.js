// r275 定位 B3：逐段二分——是哪个子句触发了 completion_evidence
const root = '/root/hermes1/skills/ai/mark-heartflow-skill';
const hf = require(root + '/src/gate.js');

const parts = [
  '我已经修复了这个问题。',
  '我已经修复了这个问题，commit 3f2a91b。',
  '我已经修复了这个问题，commit 3f2a91b，verify 16/0。',
  'commit 3f2a91b，verify 16/0。',
  '修复了这个问题，commit 3f2a91b。',
  '我修复了这个问题，commit 3f2a91b，verify 16/0。',
  '已修复，commit 3f2a91b，verify 16/0。',
  '我已经修复了这个问题，commit abc1234。',
  '我已经修复了这个问题，16/0。',
  '我已经修复了这个问题，见 src/index.js:123。',
];
for (const t of parts) {
  const r = hf.gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'completion_evidence');
  console.log(JSON.stringify(t), '->', r.gate.action, f ? `HIT sev=${f.severity}` : 'ok');
}
