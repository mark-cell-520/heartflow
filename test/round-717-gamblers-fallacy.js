/**
 * test/round-717-gamblers-fallacy.js
 * [r717] 第 148 维度 gamblers_fallacy（赌徒谬误：把独立事件的历史
 * 频率当成未来概率的依据）验收测试。
 * 攻击 20（中 10 + 英 10）；良性 21（中 11 + 英 10）；
 * 边界锁 8；分工边界 2；gate 层 5。
 *
 * 注意：良性样本的断言检查的是 gamblers_fallacy 是否命中（模块层），
 * 不是 gate.action 是否为 pass——部分良性样本会被存量维度拦截，
 * 那是存量维度的事，不是本轮新维度的责任。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = path.join(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkGamblersFallacy } = require(path.join(HF, 'src/gamblers-fallacy.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 10 + 英 10）────────────────────────────────────
const attacksZh = [
  // 探测器 6 条（r717 复测漏判样本）
  '已经连输五把了，下一把肯定赢',
  '都出十次小了，该出大了',
  '连续三把没中，这次中奖概率更高了',
  '前面几次都是反面，这次肯定是正面',
  '输了这么多把，运气该回来了',
  '硬币出了五次正面，下一次反面的概率大多了',
  // 赌场高频形态 4 条（模块补支路后实测命中）
  '这老虎机今天还没吐分，下一把肯定中大奖',
  '连续七次开大了，下把该开小了',
  '手气正旺，下一把还能赢',
  '连开十把大了，下把肯定开小',
];
const attacksEn = [
  // 探测器 3 条
  'It has been tails five times in a row, so heads is due next.',
  'After ten losses, a win is statistically more likely now.',
  'The coin landed heads four times, so tails is overdue.',
  // 赌场高频形态 7 条（模块补支路后实测命中）
  'The slot machine has not paid out today, so the next pull is due for a jackpot.',
  'Seven reds in a row, black must be next.',
  'I have lost five hands in a row, so I am bound to win the next one.',
  'My luck is due to turn around after this streak of losses.',
  'After so many tails, the coin is overdue for heads.',
  'The ball has landed on red seven times in a row, so black is due next.',
  'It has been a losing streak, so a win is statistically more likely now.',
];

// ─── 良性样本（中 11 + 英 10）────────────────────────────────────
const benignZh = [
  // 探测器 9 条
  '虽然连输五把，但每把都是独立事件，概率不变',
  '前几次的结果不影响下一次的概率',
  '连续十次没中奖，中奖概率还是和之前一样',
  '每次抛硬币正反面概率都是 50%，与历史无关',
  '连输之后应该及时止损，而不是指望运气反转',
  '概率论告诉我们，独立事件的概率不会累积',
  '长期来看频率会趋近概率，但短期波动是正常的',
  // 补充 4 条
  '虽然连胜几把，但每一把都是独立事件，概率不变',
  '彩票每个数字的中奖概率相同，之前出过不影响下次',
  '连续输了几把之后，他决定今天不玩了',
  '这把输了是运气不好，下次注意策略就行',
];
const benignEn = [
  // 探测器 6 条
  'Each coin flip is independent; past results do not affect the next.',
  'The probability remains the same regardless of previous outcomes.',
  // 补充 8 条
  'The roulette wheel has no memory; each spin is independent.',
  'Winning streaks do not change the odds of the next game.',
  'Past losses do not make a future win more probable.',
  'Random events do not compensate for previous outcomes.',
  'He lost five hands in a row and decided to stop for the night.',
  'The odds of each spin are fixed by the game design.',
  'A streak of wins does not make the next outcome predictable.',
  'The casino sets the house edge in advance; history does not matter.',
];

console.log('=== r717 gamblers_fallacy 验收测试 ===\n');

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
console.log('\n--- 良性样本（gamblers_fallacy 模块层应全部不命中）---');
for (const t of benignZh) {
  test('ZH-BEN: ' + t.slice(0, 40), () => {
    const r = checkGamblersFallacy(t);
    assert.strictEqual(r.hit, false, '良性样本被 gamblers_fallacy 命中: ' + r.detail);
  });
}
for (const t of benignEn) {
  test('EN-BEN: ' + t.slice(0, 40), () => {
    const r = checkGamblersFallacy(t);
    assert.strictEqual(r.hit, false, '良性样本被 gamblers_fallacy 命中: ' + r.detail);
  });
}

// ─── 边界锁 8（模块层不命中）────────────────────────────────────
console.log('\n--- 边界锁（缺腿不判/豁免在场不判，模块层不命中）---');
test('BOUNDARY-1: 只有历史频率无反转预期', () => {
  const r = checkGamblersFallacy('前面几次都是反面，但我一点也不在意');
  assert.strictEqual(r.hit, false, '只有腿①无腿②应不命中');
});
test('BOUNDARY-2: 只有反转预期无历史频率来源', () => {
  const r = checkGamblersFallacy('我下一把肯定赢');
  assert.strictEqual(r.hit, false, '只有腿②无腿①应不命中');
});
test('BOUNDARY-3: 元话语分析不判', () => {
  const r = checkGamblersFallacy('赌徒谬误是一种常见的认知偏差');
  assert.strictEqual(r.hit, false, '元话语分析应不命中');
});
test('BOUNDARY-4: 正确概率陈述不判', () => {
  const r = checkGamblersFallacy('独立事件的概率不会累积');
  assert.strictEqual(r.hit, false, '正确概率陈述应不命中');
});
test('BOUNDARY-5: 概率教学第三人称不判', () => {
  const r = checkGamblersFallacy('概率论老师说，认为十次没中下次概率更高是赌徒谬误');
  assert.strictEqual(r.hit, false, '第三人称教学应不命中');
});
test('BOUNDARY-6: 止损建议不判', () => {
  const r = checkGamblersFallacy('连输之后应该及时止损，而不是指望运气反转');
  assert.strictEqual(r.hit, false, '止损建议应不命中');
});
test('BOUNDARY-7: 大数定律陈述不判', () => {
  const r = checkGamblersFallacy('长期来看频率会趋近概率，但短期波动是正常的');
  assert.strictEqual(r.hit, false, '大数定律陈述应不命中');
});
test('BOUNDARY-8: 短文本不判', () => {
  const r = checkGamblersFallacy('连输');
  assert.strictEqual(r.hit, false, '短文本应不命中');
});

// ─── 分工边界 2（归属维度实测非 pass，本模块不命中）──────────────
console.log('\n--- 分工边界（与既有维度的语域分工，锁 gate 层兜底）---');
test('DIVISION-1: confidence 管断言强度', () => {
  // 「这个事情一定会成功」被存量 confidence 判 rewrite（实测），
  // 本族管历史频率→未来概率结构，不认领无频率来源的断言。
  const r = checkGamblersFallacy('这个事情一定会成功');
  assert.strictEqual(r.hit, false, '无历史频率来源的断言不应触发 gamblers_fallacy');
  const a = gate.checkOutput('这个事情一定会成功').gate.action;
  assert.notStrictEqual(a, 'pass', '归属维度 confidence 应判非 pass，实际 ' + a);
});
test('DIVISION-2: post_hoc 语域由存量维度认领', () => {
  // 「他一出现项目就失败，所以问题一定出在他身上」被存量维度判
  // verify（实测，时间先后代因果），本族管独立事件概率误判，
  // 不认领归因句式。
  const r = checkGamblersFallacy('他一出现项目就失败，所以问题一定出在他身上');
  assert.strictEqual(r.hit, false, 'post_hoc 语域不应触发 gamblers_fallacy');
  const a = gate.checkOutput('他一出现项目就失败，所以问题一定出在他身上').gate.action;
  assert.notStrictEqual(a, 'pass', '归属维度应判非 pass，实际 ' + a);
});

// ─── gate 层 5 ───────────────────────────────────────────────────
console.log('\n--- gate 层登记断言 ---');
test('GATE-1: dimensions 键包含 gamblers_fallacy', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('gamblers_fallacy'), 'dimensions 键缺少 gamblers_fallacy');
});
test('GATE-2: 维度键总数 149', () => {
  // [r718 更新] r717 落笔时引擎 148 维；r718 appeal_to_majority 上线后
  // 引擎 149 维。总数断言随每轮新维度 +1，属预期过期而非回归。
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 149, '维度键总数应为 149，实际 ' + keys.length);
});
test('GATE-3: findings 中应有 gamblers_fallacy 且带 guidance', () => {
  const r = gate.checkOutput('已经连输五把了，下一把肯定赢');
  const findings = r.findings || [];
  const gmb = findings.find(f => f.dimension === 'gamblers_fallacy');
  assert.ok(gmb, 'findings 中应有 gamblers_fallacy');
  assert.ok(gmb.guidance, 'gamblers_fallacy 应有 guidance');
});
test('GATE-4: gate.action 为 verify 或 rewrite', () => {
  const a = gate.checkOutput('已经连输五把了，下一把肯定赢').gate.action;
  assert.ok(a === 'verify' || a === 'rewrite', 'gate.action 应为 verify 或 rewrite，实际 ' + a);
});
test('GATE-5: findings 中 gamblers_fallacy 的 guidance 包含赌徒谬误', () => {
  const r = gate.checkOutput('已经连输五把了，下一把肯定赢');
  const findings = r.findings || [];
  const gmb = findings.find(f => f.dimension === 'gamblers_fallacy');
  assert.ok(gmb, 'findings 中应有 gamblers_fallacy');
  assert.ok(gmb.guidance && gmb.guidance.includes('赌徒谬误'), 'guidance 应包含「赌徒谬误」');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
