/**
 * test/round-717-cherry-picking.js
 * [r717] 第 148 维度 cherry_picking（摘樱桃）验收测试。
 * 攻击 20（中 10 + 英 10）；良性 21（中 11 + 英 10）；
 * 边界锁 8；分工边界 2；gate 层 5。
 *
 * 注意：良性样本的断言检查的是 cherry_picking 是否命中（模块层），
 * 不是 gate.action 是否为 pass——部分良性样本会被存量维度拦截，
 * 那是存量维度的事，不是本轮新维度的责任。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkCherryPicking } = require(path.join(HF, 'src/cherry-picking.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 10 + 英 10）────────────────────────────────────
const attacksZh = [
  '他只挑对自己有利的数据说，反面证据一概不提',
  '只看成功的案例，失败的案例全被隐藏了',
  '这份报告只列支持结论的部分，反对数据一个没放',
  '他引用的都是支持自己的研究，反对的研究全部略过',
  '只讲赚钱的月份，亏钱的月份一个字不提',
  '数据里挑出几个好看的数字，难看的全部删掉',
  '论文里只引用支持作者观点的文献，反面证据一概不提',
  '汇报时只讲顺利的环节，出问题的部分全部略过',
  '他给的数据全是好看的数字，亏损记录全部删掉了',
  '这份总结只列了支持结论的案例，失败案例一个没放',
];
const attacksEn = [
  'He only cites the studies that support his view and ignores the rest.',
  'They cherry-picked the best quarters and left out the losses.',
  'She presents only the successful cases and hides the failures.',
  'The report lists only the data supporting the conclusion and omits the rest.',
  'He mentions only the favorable results and suppresses the negative ones.',
  'They showed only the good quarters and withheld the losses.',
  'She cites only the research that supports her claim and ignores the contradicting evidence.',
  'The summary includes only the successful projects and hides the failed ones.',
  'He picked only the best numbers and deleted the unfavorable results.',
  'They report only the wins and leave out the failures.',
];

// ─── 良性样本（中 11 + 英 10）────────────────────────────────────
const benignZh = [
  '这份报告列出了支持和反对两方面的数据，结论有保留',
  '我们既统计了成功案例，也统计了失败案例，供全面参考',
  '虽然多数研究支持这个结论，但报告也标注了少数反对意见',
  '数据有取舍是因为样本量限制，报告里写明了筛选标准',
  '这个分析只覆盖了部分数据，因为其余数据尚未清洗完成',
  '论文的局限性部分明确写了未纳入的研究',
  '我们按预先注册的纳入标准筛选文献，标准公开可查',
  '我们预先注册了假设，再收集数据检验，避免事后凑规律',
  '这个相关性是在探索性分析中发现的，需要独立样本验证',
  '数据里的波动在统计显著性范围内，不能算规律',
  '我们做了多重比较校正，排除随机巧合造成的假阳性',
];
const benignEn = [
  'The review includes both supporting and contradicting evidence.',
  'We reported the outliers as well, not just the favorable results.',
  'The hypothesis was pre-registered before data collection began.',
  'We ran a holdout test to check whether the pattern generalizes.',
  '样本量太小，观察到的差异可能是随机波动',
  'This pattern did not replicate in the second dataset.',
  'We reported the results of all tests, including the non-significant ones.',
  'The limitations section clearly lists the studies we did not include.',
  'We applied multiple comparison correction to rule out false positives.',
  'The sample size is too small, so the observed difference may be random noise.',
];

console.log('=== r717 cherry_picking 验收测试 ===\n');

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
console.log('\n--- 良性样本（cherry_picking 模块层应全部不命中）---');
for (const t of benignZh) {
  test('ZH-BEN: ' + t.slice(0, 40), () => {
    const r = checkCherryPicking(t);
    assert.strictEqual(r.hit, false, '良性样本被 cherry_picking 命中: ' + r.detail);
  });
}
for (const t of benignEn) {
  test('EN-BEN: ' + t.slice(0, 40), () => {
    const r = checkCherryPicking(t);
    assert.strictEqual(r.hit, false, '良性样本被 cherry_picking 命中: ' + r.detail);
  });
}

// ─── 边界锁 8（模块层不命中）────────────────────────────────────
console.log('\n--- 边界锁（缺腿不判，模块层不命中）---');
test('BOUNDARY-1: 只有排他性措辞无有利/不利对照', () => {
  const r = checkCherryPicking('这个分析只覆盖了部分数据，因为其余数据尚未清洗完成');
  assert.strictEqual(r.hit, false, '只有排他性措辞无对照应不命中');
});
test('BOUNDARY-2: 只有对照无隐瞒动作', () => {
  const r = checkCherryPicking('报告列出了支持和反对两方面的数据');
  assert.strictEqual(r.hit, false, '只有对照无隐瞒动作应不命中');
});
test('BOUNDARY-3: 元话语分析不判', () => {
  const r = checkCherryPicking('摘樱桃是一种常见的证据选择偏误');
  assert.strictEqual(r.hit, false, '元话语分析应不命中');
});
test('BOUNDARY-4: 方法透明度在场不判', () => {
  const r = checkCherryPicking('我们按预先注册的纳入标准筛选文献，标准公开可查');
  assert.strictEqual(r.hit, false, '方法透明度在场应不命中');
});
test('BOUNDARY-5: 双向呈现在场不判', () => {
  const r = checkCherryPicking('我们既统计了成功案例，也统计了失败案例');
  assert.strictEqual(r.hit, false, '双向呈现在场应不命中');
});
test('BOUNDARY-6: 正常范围声明不判', () => {
  const r = checkCherryPicking('本次分析只覆盖了上半年的数据，下半年数据下月发布');
  assert.strictEqual(r.hit, false, '正常范围声明应不命中');
});
test('BOUNDARY-7: 第三人称专业复盘不判', () => {
  const r = checkCherryPicking('统计学家说，这份报告只列了支持结论的数据，需要补充反面证据');
  assert.strictEqual(r.hit, false, '第三人称专业复盘应不命中');
});
test('BOUNDARY-8: 短文本不判', () => {
  const r = checkCherryPicking('只挑');
  assert.strictEqual(r.hit, false, '短文本应不命中');
});

// ─── 分工边界 2 ──────────────────────────────────────────────────
console.log('\n--- 分工边界（与既有维度的语域分工）---');
test('DIVISION-1: selective_minimization 管严重性淡化措辞', () => {
  // selective_minimization 管对严重性的淡化，本族管证据呈现的单边取舍
  const r = checkCherryPicking('这只是一个小问题，影响有限，不用太担心');
  assert.strictEqual(r.hit, false, '严重性淡化不应触发 cherry_picking');
});
test('DIVISION-2: survivorship_bias 管存活样本推断偏差', () => {
  // survivorship_bias 管只看存活样本的推断，本族管主动的隐瞒动作
  const r = checkCherryPicking('活下来的公司都这么做，所以应该这么做');
  assert.strictEqual(r.hit, false, '存活样本推断不应触发 cherry_picking');
});

// ─── gate 层 5 ───────────────────────────────────────────────────
console.log('\n--- gate 层登记断言 ---');
test('GATE-1: dimensions 键包含 cherry_picking', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('cherry_picking'), 'dimensions 键缺少 cherry_picking');
});
test('GATE-2: 维度键总数 148', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 148, '维度键总数应为 148，实际 ' + keys.length);
});
test('GATE-3: VERIFY_DIMS 包含 cherry_picking', () => {
  const r = gate.checkOutput('他只挑对自己有利的数据说，反面证据一概不提');
  const findings = r.findings || [];
  const cp = findings.find(f => f.dimension === 'cherry_picking');
  assert.ok(cp, 'findings 中应有 cherry_picking');
  assert.ok(cp.guidance, 'cherry_picking 应有 guidance');
});
test('GATE-4: gate.action 为 verify 或 rewrite', () => {
  const a = gate.checkOutput('他只挑对自己有利的数据说，反面证据一概不提').gate.action;
  assert.ok(a === 'verify' || a === 'rewrite', 'gate.action 应为 verify 或 rewrite，实际 ' + a);
});
test('GATE-5: findings 中 cherry_picking 的 guidance 包含摘樱桃', () => {
  const r = gate.checkOutput('他只挑对自己有利的数据说，反面证据一概不提');
  const findings = r.findings || [];
  const cp = findings.find(f => f.dimension === 'cherry_picking');
  assert.ok(cp, 'findings 中应有 cherry_picking');
  assert.ok(cp.guidance && cp.guidance.includes('摘樱桃'), 'guidance 应包含「摘樱桃」');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
