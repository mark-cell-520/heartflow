// 第 226 轮：badFaithNarrative 英文侧判据测试
// 结构：正向 12 / 反向 14 / 中文侧回归 6 / 逐半诊断 4 / 异常输入 4
const assert = require('assert');
const gate = require('../src/gate.js');

function dimsOf(text) {
  const r = gate.checkOutput(typeof text === 'string' ? text : '');
  return (r.findings || []).map(f => f.dimension);
}

// ─── 正向：英文侧同族攻击话术形状必须命中 ────────────────────────────
const POSITIVE = [
  'It looks impartial on the surface, when in reality it favors one camp at every single step.',
  'He steers the whole discussion toward tiny details so nobody remembers the core issue.',
  'The tiny details are there to make you forget the central question entirely.',
  'Pin a name on them first, then justify that name afterwards.',
  'Put a tag on them first, then build the case for that tag afterwards.',
  'He climbs onto the high ground of ethics so nobody can challenge him.',
  'This framing can never be wrong; no matter what objection you raise, it comes out right.',
  'He built an airtight defense where every outcome confirms he was correct.',
  'Every clause is hedged so the whole thing can be disowned later on.',
  'He pretends to be fair when in practice he quietly favours them.',
  'I am not here to debate the facts, I am here to win.',
  'I am merely polite, just asking questions.',
];
for (const t of POSITIVE) {
  const d = dimsOf(t);
  assert.ok(d.includes('bad_faith'),
    'positive shape missed by bad_faith: ' + t.slice(0, 40));
}

// ─── 反向：良性同形句不得命中（含高危混淆词） ───────────────────────
const NEGATIVE = [
  // escape hatch / way out 是真实工程术语
  'The escape hatch exists so the process can be killed without data loss.',
  'We keep a fallback so we can revert the migration if the health check fails.',
  // verdict / conclusion 在技术语境正常
  'The verdict of the benchmark was recorded in the log for review.',
  'Conclusions are written first in the abstract, as the style guide requires.',
  // neutral / fair / impartial 正常使用
  'The policy is neutral with respect to vendor choice.',
  'It looks fair on the surface, and the review board verified it.',
  'We keep every conversation tone-neutral to avoid disputes.',
  // label / tag 是正常字段名与分类动词
  'The label field in the config is optional and defaults to empty.',
  'The tagging system labels each commit by its component.',
  // walk back / retract 是正常运维动作
  'You can walk back the migration if the health check fails.',
  // score / winner 是正常评测语
  'The winner is decided by benchmark score, not by opinion.',
  // details 正常使用
  'Details matter: the config keys must match exactly.',
  // healthy / careless 未耦合时不判
  'The wording was reviewed by three editors before publication.',
];
for (const t of NEGATIVE) {
  const d = dimsOf(t);
  assert.ok(!d.includes('bad_faith'),
    'negative shape falsely flagged: ' + t.slice(0, 40));
}

// ─── 中文侧回归：不得因本次改动退化（均为 gate 实测确认命中） ─────────
const ZH_POSITIVE = [
  '他把水搅浑，然后再倒打一耙说我没讲清楚',
  '他不是来讨论问题的，是来赢的',
  '每句话都留了后路，方便随时改口',
  '把水搅浑，然后再倒打一耙',
  '每句话都留了后路，方便改口',
  '他没说过的观点，你先扣到他头上再反驳',
];
for (const t of ZH_POSITIVE) {
  const d = dimsOf(t);
  assert.ok(d.includes('bad_faith'),
    'zh positive regression: ' + t.slice(0, 20));
}

// ─── 逐半诊断：单半不命中（两半齐备 AND 纪律仍在） ─────────────────
// hard 单独出现不命中
assert.ok(!dimsOf('Every clause is hedged.').includes('bad_faith'),
  'hard-only must not fire');
// purpose 单独出现不命中
assert.ok(!dimsOf('So the whole thing can be disowned later on.').includes('bad_faith'),
  'purpose-only must not fire');
// 只含 neutral 概念 + favor 动词但无并列揭示
assert.ok(!dimsOf('It seems impartial and balanced enough for the panel.').includes('bad_faith'),
  'single-signal must not fire');
// 反向：两半齐备才命中
assert.ok(dimsOf('He pretends to be fair when in practice he quietly favours them.')
  .includes('bad_faith'), 'two halves must fire');

// ─── 异常输入：不得崩溃，且不得误报 bad_faith ───────────────────────
for (const bad of [null, undefined, '', 123, {}]) {
  const d = dimsOf(bad);
  assert.ok(Array.isArray(d), 'must return an array for ' + String(bad));
  assert.ok(!d.includes('bad_faith'), 'must not flag bad_faith for ' + String(bad));
}

console.log('✅ bad-faith-en-r226: 40 断言全部通过');
