/**
 * test/round-716-wishful-thinking.js
 * [r716] 第 147 维度 wishful_thinking（一厢情愿）验收测试。
 * 攻击 20（中 10 + 英 10）；良性 21（中 11 + 英 10）；
 * 边界锁 8；分工边界 2；gate 层 5。
 *
 * 注意：良性样本的断言检查的是 wishful_thinking 是否命中（模块层），
 * 不是 gate.action 是否为 pass——部分良性样本会被存量维度（confidence/
 * absolute_claim/unsupported_claim 等）拦截，那是存量维度的事，不是
 * 本轮新维度的责任。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkWishfulThinking } = require(path.join(HF, 'src/wishful-thinking.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 10 + 英 10）────────────────────────────────────
const attacksZh = [
  '我相信会成功，所以一定会成功',
  '只要我足够努力，宇宙就会回应我',
  '念念不忘必有回响，想什么就来什么',
  '我这么真诚，老天不会亏待我的',
  '心诚则灵，只要信念够强就能实现',
  '我这么想，事情就会按我想的发展',
  '我坚信这个项目会成功，所以它一定会实现',
  '我真心相信上天会眷顾努力的人，天道酬勤',
  '我期待好事发生，它就会发生',
  '只要我相信，它就会成真',
];
const attacksEn = [
  'I believe it will work out, so it will work out.',
  'If I want it badly enough, the universe will provide.',
  'My positive thinking alone will make it happen.',
  'I am convinced this will succeed, so it is bound to.',
  'I truly believe in the law of attraction, and it will manifest.',
  'I wish for success so intensely that it is destined to happen.',
  'I have faith that the cosmos will reward my efforts.',
  'My sincere hope alone will make it come true.',
  'I am sure it is meant to be, so it will happen.',
  'If I just believe hard enough, it is inevitable.',
];

// ─── 良性样本（中 11 + 英 10）────────────────────────────────────
const benignZh = [
  '我相信这个方向，但还是要看数据验证',
  '努力很重要，但结果还取决于市场环境',
  '保持积极心态有助于应对挑战，但不能替代准备',
  '愿望需要配合行动和策略才能实现',
  '信念可以给人力量，但不能改变客观规律',
  '心诚则灵是一种人生态度，不是因果机制',
  '乐观预期要建立在现实评估的基础上',
  '我相信团队的能力，我们会尽力而为',
  '期待好消息，但也要做好最坏的打算',
  '有信念是好事，但行动才是关键',
  '我对未来充满信心，因为我们已经做了充分的准备',
];
const benignEn = [
  'I am optimistic about the outcome, but we need to test the hypothesis.',
  'Positive thinking helps motivation, but execution matters more.',
  'I believe in the team, but we still need to validate the results.',
  'Hope is important, but action is what drives results.',
  'I have faith in the process, and the data supports our approach.',
  'Confidence comes from preparation, not just belief.',
  'I wish for the best, but I also prepare for the worst.',
  'Belief alone is not enough; we need evidence and execution.',
  'I am hopeful, but I also rely on data and testing.',
  'Optimism is good, but it must be grounded in reality.',
];

console.log('=== r716 wishful_thinking 验收测试 ===\n');

// ─── 攻击 20（gate 层非 pass）────────────────────────────────────
console.log('--- 攻击样本（gate 层应全部非 pass）---');
for (const t of attacksZh) {
  test('ZH-ATK: ' + t.slice(0, 40), () => {
    const a = gate.checkOutput(t).gate.action;
    assert.notStrictEqual(a, 'pass', '攻击样本被放行: ' + a);
  });
}
for (const t of attacksEn) {
  test('EN-ATK: ' + t.slice(0, 40), () => {
    const a = gate.checkOutput(t).gate.action;
    assert.notStrictEqual(a, 'pass', '攻击样本被放行: ' + a);
  });
}

// ─── 良性 21（模块层不命中）─────────────────────────────────────
console.log('\n--- 良性样本（wishful_thinking 模块层应全部不命中）---');
for (const t of benignZh) {
  test('ZH-BEN: ' + t.slice(0, 40), () => {
    const r = checkWishfulThinking(t);
    assert.strictEqual(r.hit, false, '良性样本被 wishful_thinking 命中: ' + r.detail);
  });
}
for (const t of benignEn) {
  test('EN-BEN: ' + t.slice(0, 40), () => {
    const r = checkWishfulThinking(t);
    assert.strictEqual(r.hit, false, '良性样本被 wishful_thinking 命中: ' + r.detail);
  });
}

// ─── 边界锁 8（模块层不命中）────────────────────────────────────
console.log('\n--- 边界锁（缺腿不判，模块层不命中）---');
test('BOUNDARY-1: 只有信念无必然结果', () => {
  const r = checkWishfulThinking('我相信这个方向会很好');
  assert.strictEqual(r.hit, false, '只有信念无必然结果应不命中');
});
test('BOUNDARY-2: 只有必然结果无信念来源', () => {
  const r = checkWishfulThinking('这个事情一定会成功');
  assert.strictEqual(r.hit, false, '只有必然结果无信念来源应不命中');
});
test('BOUNDARY-3: 元话语分析不判', () => {
  const r = checkWishfulThinking('一厢情愿是一种常见的认知偏差');
  assert.strictEqual(r.hit, false, '元话语分析应不命中');
});
test('BOUNDARY-4: 证据在场不判', () => {
  const r = checkWishfulThinking('我相信这个方向，数据显示支持率 85%');
  assert.strictEqual(r.hit, false, '证据在场应不命中');
});
test('BOUNDARY-5: 人生态度陈述不判', () => {
  const r = checkWishfulThinking('心诚则灵是一种人生态度，不是因果机制');
  assert.strictEqual(r.hit, false, '人生态度陈述应不命中');
});
test('BOUNDARY-6: 正常励志不判', () => {
  const r = checkWishfulThinking('保持积极心态有助于应对挑战，但不能替代准备');
  assert.strictEqual(r.hit, false, '正常励志应不命中');
});
test('BOUNDARY-7: 第三人称专业复盘不判', () => {
  const r = checkWishfulThinking('心理咨询师说，你总是相信只要努力就会成功，这是一厢情愿的思维模式');
  assert.strictEqual(r.hit, false, '第三人称专业复盘应不命中');
});
test('BOUNDARY-8: 短文本不判', () => {
  const r = checkWishfulThinking('我相信');
  assert.strictEqual(r.hit, false, '短文本应不命中');
});

// ─── 分工边界 2 ──────────────────────────────────────────────────
console.log('\n--- 分工边界（与既有维度的语域分工）---');
test('DIVISION-1: affective_forecast 管情绪预测偏差', () => {
  // affective_forecast 管对未来情绪的预测，本族管信念→结果因果推断
  const r = checkWishfulThinking('我会很开心，因为我相信会成功');
  assert.strictEqual(r.hit, false, '情绪预测不应触发 wishful_thinking');
});
test('DIVISION-2: confidence 管断言强度', () => {
  // confidence 管断言强度，本族管信念→结果因果结构
  const r = checkWishfulThinking('这个项目肯定会成功');
  assert.strictEqual(r.hit, false, '无信念来源的断言不应触发 wishful_thinking');
});

// ─── gate 层 5 ───────────────────────────────────────────────────
console.log('\n--- gate 层登记断言 ---');
test('GATE-1: dimensions 键包含 wishful_thinking', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('wishful_thinking'), 'dimensions 键缺少 wishful_thinking');
});
test('GATE-2: 维度键总数 147', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 147, '维度键总数应为 147，实际 ' + keys.length);
});
test('GATE-3: VERIFY_DIMS 包含 wishful_thinking', () => {
  const r = gate.checkOutput('我相信会成功，所以一定会成功');
  const findings = r.findings || [];
  const wt = findings.find(f => f.dimension === 'wishful_thinking');
  assert.ok(wt, 'findings 中应有 wishful_thinking');
  assert.ok(wt.guidance, 'wishful_thinking 应有 guidance');
});
test('GATE-4: gate.action 为 verify 或 rewrite', () => {
  const a = gate.checkOutput('我相信会成功，所以一定会成功').gate.action;
  assert.ok(a === 'verify' || a === 'rewrite', 'gate.action 应为 verify 或 rewrite，实际 ' + a);
});
test('GATE-5: findings 中 wishful_thinking 的 guidance 包含一厢情愿', () => {
  const r = gate.checkOutput('我相信会成功，所以一定会成功');
  const findings = r.findings || [];
  const wt = findings.find(f => f.dimension === 'wishful_thinking');
  assert.ok(wt, 'findings 中应有 wishful_thinking');
  assert.ok(wt.guidance && wt.guidance.includes('一厢情愿'), 'guidance 应包含「一厢情愿」');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
