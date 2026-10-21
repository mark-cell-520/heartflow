/**
 * test/round-718-texas-sharpshooter.js
 * [r718] 第 149 维度 texas_sharpshooter（德州神枪手）验收测试。
 * 攻击 20（中 10 + 英 10）；良性 21（中 11 + 英 10）；
 * 边界锁 8；分工边界 2；gate 层 5。
 *
 * 注意：良性样本的断言检查的是 texas_sharpshooter 是否命中（模块层），
 * 不是 gate.action 是否为 pass——部分良性样本会被存量维度拦截，
 * 那是存量维度的事，不是本轮新维度的责任。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkTexasSharpshooter } = require(path.join(HF, 'src/texas-sharpshooter.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 10 + 英 10）────────────────────────────────────
const attacksZh = [
  '先开枪再画靶心，怎么解释都说得通',
  '他先有了结论，再回头找数据凑出规律',
  '数据里随机出现的巧合，被他讲成了必然规律',
  '先定好答案，再从一堆数据里挑出能对上的一段',
  '事后把散落的点连起来，说这就是趋势',
  '结果出来之后才划定范围，然后宣称预测精准',
  '先射箭再画靶，反正怎么解释都说得通',
  '他先下结论再倒着找数据，硬说发现了规律',
  '那些波动被他凑成了规律，还宣称预测很准',
  '先有结论再凑数据的，也算规律吗',
];
const attacksEn = [
  'He drew the target around the bullet holes and called it accuracy.',
  'They found a pattern in random noise and presented it as a law.',
  'She decided the conclusion first, then picked the data that fit.',
  'They connected the dots after the fact and called it a trend.',
  'He worked backwards from the answer and reverse-engineered a pattern.',
  'The scattered data was fitted into a curve and presented as proof.',
  'She treated the coincidence in the noise as a law of nature.',
  'He predicted it accurately only because he chose the target after.',
  'The randomness was turned into a pattern and called a trend.',
  'They picked the data that fit and claimed a proven rule.',
];

// ─── 良性样本（中 11 + 英 10）────────────────────────────────────
const benignZh = [
  '我们预先注册了假设，再收集数据检验，避免事后凑规律',
  '这个相关性是在探索性分析中发现的，需要独立样本验证',
  '数据里的波动在统计显著性范围内，不能算规律',
  '我们做了多重比较校正，排除随机巧合造成的假阳性',
  '样本量太小，观察到的差异可能是随机波动',
  '这个规律在另一个数据集上没有得到复现',
  '我们报告了所有检验的结果，包括不显著的那些',
  '事后想起来有点后怕，但结论还是基于当时的数据',
  '德州神枪手谬误是一种事后拟合的逻辑错误',
  '先开枪再画靶心是常见的统计陷阱，教学中常被引用',
  '统计学家指出，这份研究是先有结论再找数据的',
];
const benignEn = [
  'The hypothesis was pre-registered before data collection began.',
  'We ran a holdout test to check whether the pattern generalizes.',
  'This pattern did not replicate in the second dataset.',
  'We reported the results of all tests, including the non-significant ones.',
  'The sample size is too small, so the observed difference may be random noise.',
  'The limitations section clearly lists the studies we did not include.',
  'We applied multiple comparison correction to rule out false positives.',
  'The Texas sharpshooter fallacy is a well-known post-hoc error.',
  'The statistician noted that the study found the pattern after the fact.',
  'He looked at the data afterwards and revised the original hypothesis.',
];

console.log('=== r718 texas_sharpshooter 验收测试 ===\n');

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
console.log('\n--- 良性样本（texas_sharpshooter 模块层应全部不命中）---');
for (const t of benignZh) {
  test('ZH-BEN: ' + t.slice(0, 40), () => {
    const r = checkTexasSharpshooter(t);
    assert.strictEqual(r.hit, false, '良性样本被 texas_sharpshooter 命中: ' + r.detail);
  });
}
for (const t of benignEn) {
  test('EN-BEN: ' + t.slice(0, 40), () => {
    const r = checkTexasSharpshooter(t);
    assert.strictEqual(r.hit, false, '良性样本被 texas_sharpshooter 命中: ' + r.detail);
  });
}

// ─── 边界锁 8（模块层不命中）────────────────────────────────────
console.log('\n--- 边界锁（缺腿不判，模块层不命中）---');
test('BOUNDARY-1: 只有事后时间词无规律呈现', () => {
  const r = checkTexasSharpshooter('事后想起来有点后怕');
  assert.strictEqual(r.hit, false, '只有时间词应不命中');
});
test('BOUNDARY-2: 只有噪声词无规律呈现', () => {
  const r = checkTexasSharpshooter('数据里有些波动，需要再观察');
  assert.strictEqual(r.hit, false, '只有噪声词应不命中');
});
test('BOUNDARY-3: 只有规律呈现无噪声/事后腿', () => {
  const r = checkTexasSharpshooter('这个规律在三个独立数据集上都复现了');
  assert.strictEqual(r.hit, false, '只有规律词应不命中');
});
test('BOUNDARY-4: 元话语概念分析不判', () => {
  const r = checkTexasSharpshooter('德州神枪手谬误是一种事后拟合的逻辑错误');
  assert.strictEqual(r.hit, false, '元话语分析应不命中');
});
test('BOUNDARY-5: 方法透明度在场不判', () => {
  const r = checkTexasSharpshooter('我们预先注册了假设，再收集数据检验');
  assert.strictEqual(r.hit, false, '方法透明度在场应不命中');
});
test('BOUNDARY-6: 规律未复现的诚实报告不判', () => {
  const r = checkTexasSharpshooter('这个规律在另一个数据集上没有得到复现');
  assert.strictEqual(r.hit, false, '复现失败报告应不命中');
});
test('BOUNDARY-7: 第三人称专业复盘不判', () => {
  const r = checkTexasSharpshooter('统计学家指出，这份研究是先有结论再找数据的');
  assert.strictEqual(r.hit, false, '第三人称专业复盘应不命中');
});
test('BOUNDARY-8: 短文本不判', () => {
  const r = checkTexasSharpshooter('画靶');
  assert.strictEqual(r.hit, false, '短文本应不命中');
});

// ─── 分工边界 2 ──────────────────────────────────────────────────
console.log('\n--- 分工边界（与既有维度的语域分工）---');
test('DIVISION-1: statistical_misleading 管统计数据呈现误导', () => {
  // statistical_misleading 管统计数据的呈现误导（百分比滥用），
  // 本族管把随机波动讲成规律；样本实测存量真兜底（rewrite）
  const r = checkTexasSharpshooter('这个数字比去年增长了 300%，实际上只多了两个');
  assert.strictEqual(r.hit, false, '统计呈现误导不应触发 texas_sharpshooter');
});
test('DIVISION-2: cherry_picking 管单边证据隐瞒动作', () => {
  // cherry_picking（第 148 维）管单边证据的隐瞒动作（只挑/略过），
  // 本族管事后拟合的预测伪装；样本实测存量真兜底（verify）
  const r = checkTexasSharpshooter('他只挑对自己有利的数据说，反面证据一概不提');
  assert.strictEqual(r.hit, false, '单边证据叙事不应触发 texas_sharpshooter');
});

// ─── gate 层 5 ───────────────────────────────────────────────────
console.log('\n--- gate 层登记断言 ---');
test('GATE-1: dimensions 键包含 texas_sharpshooter', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('texas_sharpshooter'), 'dimensions 键缺少 texas_sharpshooter');
});
test('GATE-2: 维度键总数 149', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 149, '维度键总数应为 149，实际 ' + keys.length);
});
test('GATE-3: VERIFY_DIMS 包含 texas_sharpshooter（findings 有 guidance）', () => {
  const r = gate.checkOutput('先开枪再画靶心，怎么解释都说得通');
  const findings = r.findings || [];
  const cp = findings.find(f => f.dimension === 'texas_sharpshooter');
  assert.ok(cp, 'findings 中应有 texas_sharpshooter');
  assert.ok(cp.guidance, 'texas_sharpshooter 应有 guidance');
});
test('GATE-4: gate.action 为 verify 或 rewrite', () => {
  const a = gate.checkOutput('先开枪再画靶心，怎么解释都说得通').gate.action;
  assert.ok(a === 'verify' || a === 'rewrite', 'gate.action 应为 verify 或 rewrite，实际 ' + a);
});
test('GATE-5: findings 中 texas_sharpshooter 的 guidance 包含德州神枪手', () => {
  const r = gate.checkOutput('先开枪再画靶心，怎么解释都说得通');
  const findings = r.findings || [];
  const cp = findings.find(f => f.dimension === 'texas_sharpshooter');
  assert.ok(cp, 'findings 中应有 texas_sharpshooter');
  assert.ok(cp.guidance && cp.guidance.includes('德州神枪手'), 'guidance 应包含「德州神枪手」');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
