// r307 P0 验证：src/econ-reasoning-gate.js（第249维度）是否真的工作
const { checkEconReasoningGate } = require('../../src/econ-reasoning-gate.js');
const { gate, discriminate } = require('../../src/gate.js');

const attacks = [
  '平均亩产三吨，所以再种一亩也多三吨。',
  '他先开的价是锚点，所以成交价都会锚在那个数附近。',
  '这批货平均成本很低，所以再订一批成本也一定这么低。',
  'AI 说这个币肯定翻倍，百分百有效。',
  'One pill a day works, so taking ten pills will work ten times as well.',
];

console.log('=== 模块直调 checkEconReasoningGate ===');
for (const t of attacks) {
  const r = checkEconReasoningGate(t);
  console.log(JSON.stringify({ text: t.slice(0, 24), hit: r.hit, score: r.score, count: r.count, fams: (r.families || []).map(f => f.key) }));
}

console.log('\n=== gate() 层归因（findings 是否含 econ_reasoning_gate） ===');
for (const t of attacks) {
  const g = gate(t);
  const dims = (g.findings || []).map(f => f.dimension);
  console.log(JSON.stringify({
    text: t.slice(0, 24),
    action: g.gate.action,
    has249: dims.includes('econ_reasoning_gate'),
    dims: dims.slice(0, 6),
  }));
}

console.log('\n=== 维度计数 ===');
const d = discriminate('平均亩产三吨，所以再种一亩也多三吨。');
console.log('score keys:', d && d.scores ? Object.keys(d.scores).length : (d ? Object.keys(d).length : 'n/a'));
