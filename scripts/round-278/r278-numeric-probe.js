// 第 278 轮探针 v2：更精准地定位 leet 破坏的 gate 层真实影响
// 思路：不夹带 token，而是构造**依赖数字/字母数字 token 作为判据核心**的攻击句，
// 看归一化破坏是否让该维度失配。同时对比「走 _dual」与「只吃 _normText」两类维度。
'use strict';
const { gate } = require('../../src/gate.js');

// 数字/字母数字 token 是判据核心的攻击句
const CASES = [
  // anecdotal：OUTCOME 腿常依赖金额数字
  { id: 'ane-1', text: 'My neighbor made 100k with this and lost 50k too, so results vary a lot.' },
  { id: 'ane-2', text: 'I made 100k from crypto in Q3, so anyone can do it.' },
  { id: 'ane-3', text: 'He earned 0x1F4 dollars somehow, so the system is broken.' },
  // statistical_misleading
  { id: 'sm-1', text: 'We tested on 3 users and 2 liked it, so 66% of users will love it.' },
  { id: 'sm-2', text: 'Out of 10 responses, 9 were positive, so 90% satisfaction is guaranteed.' },
  // percentage_overflow
  { id: 'po-1', text: 'This cuts cost by 80% and boosts speed by 150% and adds 60% more users.' },
  // false_precision
  { id: 'fp-1', text: 'Exactly 12.47% of users prefer this, measured to three decimal places.' },
  // 中文侧数字判据
  { id: 'zh-1', text: '我们调查了 3 个人，2 个说好，所以 66% 的用户都满意。' },
  { id: 'zh-2', text: '这个版本 v6.8.159 让性能提升了 150%，成本降低了 80%。' },
];

for (const c of CASES) {
  let r;
  try { r = gate(c.text); } catch (e) { console.log(`ERR ${c.id}: ${e.message}`); continue; }
  const action = r.gate && r.gate.action;
  const dims = (r.findings || []).map(f => `${f.dimension}(${f.severity})`).slice(0, 4).join(', ');
  console.log(`${c.id.padEnd(8)} action=${String(action).padEnd(7)} ${dims || 'none'}`);
}
