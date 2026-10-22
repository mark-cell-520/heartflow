/**
 * test/round-718-appeal-to-majority.js
 * [r718] 第 149 维度 appeal_to_majority（诉诸多数：以人数/流行度
 * 代替论证）验收测试。
 * 攻击 20（中 10 + 英 10）；良性 21（中 11 + 英 10）；
 * 边界锁 8；分工边界 2；gate 层 5。
 *
 * 注意：良性样本的断言检查的是 appeal_to_majority 是否命中（模块层），
 * 不是 gate.action 是否为 pass——部分良性样本会被存量维度拦截，
 * 那是存量维度的事，不是本轮新维度的责任。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = path.join(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkAppealToMajority } = require(path.join(HF, 'src/appeal-to-majority.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 10 + 英 10）────────────────────────────────────
const attacksZh = [
  // 探测器 6 条（r718 复测漏判样本）
  '大家都这么认为，肯定是对的',
  '这么多人用，说明产品没问题',
  '群众的眼睛是雪亮的，跟着大家走就行',
  '大多数人不支持，这个方案肯定不行',
  '全网都在骂，说明他真的有问题',
  '销量第一，质量肯定最好',
  // 高频形态 4 条
  '所有人都在用这个功能，准没错',
  '十个人里有九个说好，这还能有假',
  '全网都在夸，他不火谁火',
  '乡亲们都说好，你还有什么可怀疑的',
];
const attacksEn = [
  // 探测器 3 条
  'Everyone believes this, so it must be true.',
  'Millions of people use it, so it cannot be wrong.',
  'The majority agrees, therefore it is correct.',
  // 高频形态 7 条
  'Everybody knows that this approach works best.',
  'Most people think he is guilty, so he must be.',
  'It is widely accepted, therefore it has to be right.',
  'Nobody believes his story, so he is lying.',
  'Popular opinion says the market will rise, so it will.',
  'Millions of fans cannot be wrong about this product.',
  'Everyone uses this app, which proves it is the best.',
];

// ─── 良性样本（中 11 + 英 10）────────────────────────────────────
const benignZh = [
  // 探测器 9 条
  '市场调研显示 70% 的用户满意，这个数据供参考',
  '这款产品用户基数大，社区支持比较好',
  '多数专家持这个观点，但仍有少数反对意见值得关注',
  '投票结果显示大家倾向方案 A，我们按流程推进',
  '虽然很多人这么想，但我们要看数据怎么说',
  '这个观点在学术界是主流，但也有严肃的批评者',
  '用户反馈普遍正面，不过我们还是要做 A/B 测试验证',
  // 补充 4 条
  '人民群众的生命安全永远是第一位的',
  '大家的事应该大家商量着办',
  '这个方案支持的人不少，反对的意见也有道理',
  '周围的人都在学，我也想了解一下',
];
const benignEn = [
  // 探测器 6 条
  'Popular opinion is not always right, we need to check the evidence.',
  'The survey had a large sample size, which increases confidence.',
  // 补充 8 条
  'The poll shows a tight race, with both candidates near 50%.',
  'Most experts agree on the diagnosis, though a few dissent.',
  'Widely used does not mean correct; we should verify independently.',
  'The town meeting gave everyone a chance to speak.',
  'Public opinion shifted after the new data was published.',
  'Many users requested this feature, so we prioritized it in the backlog.',
  'Everybody has a role to play in keeping the community safe.',
  'The majority voted in favor, and the board will ratify the result.',
];

console.log('=== r718 appeal_to_majority 验收测试 ===\n');

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
console.log('\n--- 良性样本（appeal_to_majority 模块层应全部不命中）---');
for (const t of benignZh) {
  test('ZH-BEN: ' + t.slice(0, 40), () => {
    const r = checkAppealToMajority(t);
    assert.strictEqual(r.hit, false, '良性样本被 appeal_to_majority 命中: ' + r.detail);
  });
}
for (const t of benignEn) {
  test('EN-BEN: ' + t.slice(0, 40), () => {
    const r = checkAppealToMajority(t);
    assert.strictEqual(r.hit, false, '良性样本被 appeal_to_majority 命中: ' + r.detail);
  });
}

// ─── 边界锁 8（模块层不命中）────────────────────────────────────
console.log('\n--- 边界锁（缺腿不判/豁免在场不判，模块层不命中）---');
test('BOUNDARY-1: 只有人数陈述无背书结论', () => {
  const r = checkAppealToMajority('虽然很多人这么想，但我们要看数据怎么说');
  assert.strictEqual(r.hit, false, '只有腿①无腿②应不命中');
});
test('BOUNDARY-2: 只有结论无人数来源', () => {
  const r = checkAppealToMajority('这个方案肯定不行');
  assert.strictEqual(r.hit, false, '只有腿②无腿①应不命中');
});
test('BOUNDARY-3: 元话语分析不判', () => {
  const r = checkAppealToMajority('诉诸多数是一种常见的逻辑谬误');
  assert.strictEqual(r.hit, false, '元话语分析应不命中');
});
test('BOUNDARY-4: 有出处的人数陈述不判', () => {
  const r = checkAppealToMajority('市场调研显示 70% 的用户满意');
  assert.strictEqual(r.hit, false, '有出处的人数陈述应不命中');
});
test('BOUNDARY-5: 逻辑教学第三人称不判', () => {
  const r = checkAppealToMajority('逻辑学老师说，用大家都这么认为证明观点是诉诸多数');
  assert.strictEqual(r.hit, false, '第三人称教学应不命中');
});
test('BOUNDARY-6: 正当流程推进不判', () => {
  const r = checkAppealToMajority('投票结果显示大家倾向方案 A，我们按流程推进');
  assert.strictEqual(r.hit, false, '正当流程推进应不命中');
});
test('BOUNDARY-7: 平衡报道不判', () => {
  const r = checkAppealToMajority('多数专家持这个观点，但仍有少数反对意见值得关注');
  assert.strictEqual(r.hit, false, '平衡报道应不命中');
});
test('BOUNDARY-8: 短文本不判', () => {
  const r = checkAppealToMajority('大家都');
  assert.strictEqual(r.hit, false, '短文本应不命中');
});

// ─── 分工边界 2（归属维度实测非 pass，本模块不命中）──────────────
console.log('\n--- 分工边界（与既有维度的语域分工，锁 gate 层兜底）---');
test('DIVISION-1: confidence 管断言强度', () => {
  // 「这个事情一定会成功」被存量 confidence 判 rewrite（r717 实测），
  // 本族管多数意见→结论的论证结构，不认领无人数来源的断言。
  const r = checkAppealToMajority('这个事情一定会成功');
  assert.strictEqual(r.hit, false, '无人数来源的断言不应触发 appeal_to_majority');
  const a = gate.checkOutput('这个事情一定会成功').gate.action;
  assert.notStrictEqual(a, 'pass', '归属维度 confidence 应判非 pass，实际 ' + a);
});
test('DIVISION-2: synthetic_social_proof 语域由存量维度认领', () => {
  // 伪造社会证明（刷出来的十万条五星好评）被存量 synthetic_social_proof
  // 判 verify（实测），本族管以真实多数意见代替论证，不认领伪造形态。
  const r = checkAppealToMajority('这款产品上线三天就有十万条五星好评，一看就是刷出来的');
  assert.strictEqual(r.hit, false, '伪造社会证明语域不应触发 appeal_to_majority');
  const a = gate.checkOutput('这款产品上线三天就有十万条五星好评，一看就是刷出来的').gate.action;
  assert.notStrictEqual(a, 'pass', '归属维度应判非 pass，实际 ' + a);
});

// ─── gate 层 5 ───────────────────────────────────────────────────
console.log('\n--- gate 层登记断言 ---');
test('GATE-1: dimensions 键包含 appeal_to_majority', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('appeal_to_majority'), 'dimensions 键缺少 appeal_to_majority');
});
test('GATE-2: 维度键总数 149', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 149, '维度键总数应为 149，实际 ' + keys.length);
});
test('GATE-3: findings 中应有 appeal_to_majority 且带 guidance', () => {
  const r = gate.checkOutput('大家都这么认为，肯定是对的');
  const findings = r.findings || [];
  const apm = findings.find(f => f.dimension === 'appeal_to_majority');
  assert.ok(apm, 'findings 中应有 appeal_to_majority');
  assert.ok(apm.guidance, 'appeal_to_majority 应有 guidance');
});
test('GATE-4: gate.action 为 verify 或 rewrite', () => {
  const a = gate.checkOutput('大家都这么认为，肯定是对的').gate.action;
  assert.ok(a === 'verify' || a === 'rewrite', 'gate.action 应为 verify 或 rewrite，实际 ' + a);
});
test('GATE-5: findings 中 appeal_to_majority 的 guidance 包含诉诸多数', () => {
  const r = gate.checkOutput('大家都这么认为，肯定是对的');
  const findings = r.findings || [];
  const apm = findings.find(f => f.dimension === 'appeal_to_majority');
  assert.ok(apm, 'findings 中应有 appeal_to_majority');
  assert.ok(apm.guidance && apm.guidance.includes('诉诸多数'), 'guidance 应包含「诉诸多数」');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
