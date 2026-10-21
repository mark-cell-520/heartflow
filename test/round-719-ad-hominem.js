/**
 * test/round-719-ad-hominem.js
 * [r719] 第 150 维度 ad_hominem（人身攻击）验收测试。
 * 攻击 20（中 10 + 英 10）；良性 21（中 11 + 英 10）；
 * 边界锁 8；分工边界 2；gate 层 5。
 *
 * 注意：良性样本的断言检查的是 ad_hominem 是否命中（模块层），
 * 不是 gate.action 是否为 pass——部分良性样本会被存量维度拦截，
 * 那是存量维度的事，不是本轮新维度的责任。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkAdHominem } = require(path.join(HF, 'src/ad-hominem.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 10 + 英 10）────────────────────────────────────
const attacksZh = [
  '他的人品有问题，所以他的观点全部不成立',
  '他连大学都没上过，说的话能有什么道理',
  '她不过是个外行，她的分析根本不用看',
  '一个离婚的人谈什么家庭教育，自己家都搞不好',
  '他自己都迟到，还有脸要求别人准时',
  '你这种人懂什么，闭嘴吧',
  '这人素质太低，他的建议不足为信',
  '她连高中都没毕业，也配谈什么专业问题',
  '你们这种人不过是业余水平，根本不用听',
  '他人品败坏，所以他说的一切都是错的',
];
const attacksEn = [
  'He is a terrible person, so everything he says is wrong.',
  'She never went to college, so her opinion does not matter.',
  'You are just an amateur; your analysis is worthless.',
  'He is a fraud and a hypocrite, so his argument can be ignored.',
  'She has no idea what she is talking about, so her claim is nonsense.',
  'You are just a nobody; shut up, your view is irrelevant.',
  'They are all incompetent people, so their proposals deserve no credibility.',
  'He never finished training, so everything he says is false.',
  'She is a liar, so her evidence does not count.',
  'You are pathetic; your opinion can be dismissed.',
];

// ─── 良性样本（中 11 + 英 10）────────────────────────────────────
const benignZh = [
  '他的论证有数据支撑，但与既有文献冲突，需要进一步核实',
  '虽然她在这个领域经验有限，但这个观点本身有出处，值得查证',
  '我们评价观点本身：这个结论的依据是否充分，与人无关',
  '他在该领域的过往记录有争议，但这个具体论点请用证据评判',
  '批评观点可以，但请针对内容本身，不要针对个人',
  '这个人确实有过不诚信记录，所以对他的数据需要额外核查——核查结论另说',
  '专家意见也要看证据链，权威身份本身不是论据',
  '他人品是差，但这个观点本身逻辑自洽，我们分开看',
  '即使不同意他的结论，也应该针对数据来源来讨论',
  '人身攻击谬误的典型例子是以对方学历否定其论点',
  '心理咨询师复盘时说，这段对话里出现了典型的人身攻击模式',
];
const benignEn = [
  'The claim conflicts with peer-reviewed data; that is the issue, not the person.',
  'She lacks formal training, yet the argument stands on its cited evidence.',
  'His past record is disputed, but this particular claim should be judged on evidence.',
  'We evaluate the argument itself: whether the reasoning holds, independent of who said it.',
  'Criticism is fine, but address the content, not the person.',
  'The ad hominem fallacy replaces refutation of the argument with attacks on the arguer.',
  'The counselor reviewed the conversation and identified a pattern of personal attacks.',
  'Even if his conclusion is wrong, the discussion should focus on the data sources.',
  'Expert opinions also need an evidence chain; the title alone is not an argument.',
  'Attack the argument, not the person — that is the basic rule of debate.',
];

console.log('=== r719 ad_hominem 验收测试 ===\n');

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
console.log('\n--- 良性样本（ad_hominem 模块层应全部不命中）---');
for (const t of benignZh) {
  test('ZH-BEN: ' + t.slice(0, 40), () => {
    const r = checkAdHominem(t);
    assert.strictEqual(r.hit, false, '良性样本被 ad_hominem 命中: ' + r.detail);
  });
}
for (const t of benignEn) {
  test('EN-BEN: ' + t.slice(0, 40), () => {
    const r = checkAdHominem(t);
    assert.strictEqual(r.hit, false, '良性样本被 ad_hominem 命中: ' + r.detail);
  });
}

// ─── 边界锁 8（模块层不命中）────────────────────────────────────
console.log('\n--- 边界锁（缺腿不判，模块层不命中）---');
test('BOUNDARY-1: 只有人品贬损无言论否定', () => {
  const r = checkAdHominem('他这人确实人品有问题');
  assert.strictEqual(r.hit, false, '只有贬损腿应不命中');
});
test('BOUNDARY-2: 只有言论否定无贬损腿', () => {
  const r = checkAdHominem('这个观点不成立，数据不支持');
  assert.strictEqual(r.hit, false, '只有否定腿应不命中');
});
test('BOUNDARY-3: 元话语概念分析不判', () => {
  const r = checkAdHominem('人身攻击谬误的典型例子是以对方学历否定其论点');
  assert.strictEqual(r.hit, false, '元话语分析应不命中');
});
test('BOUNDARY-4: 对事不对人的元话语批评不判', () => {
  const r = checkAdHominem('批评观点可以，但请针对内容本身，不要针对个人');
  assert.strictEqual(r.hit, false, '反对人身攻击的批评应不命中');
});
test('BOUNDARY-5: 第三人称专业复盘不判', () => {
  const r = checkAdHominem('心理咨询师复盘时说，这段对话里出现了典型的人身攻击模式');
  assert.strictEqual(r.hit, false, '第三人称专业复盘应不命中');
});
test('BOUNDARY-6: 承认结构（经验有限但观点有出处）不判', () => {
  const r = checkAdHominem('虽然她在这个领域经验有限，但这个观点本身有出处，值得查证');
  assert.strictEqual(r.hit, false, '承认结构应不命中');
});
test('BOUNDARY-7: 既往记录核查（结论另说）不判', () => {
  const r = checkAdHominem('这个人确实有过不诚信记录，所以对他的数据需要额外核查——核查结论另说');
  assert.strictEqual(r.hit, false, '核查请求应不命中');
});
test('BOUNDARY-8: 短文本不判', () => {
  const r = checkAdHominem('人渣');
  assert.strictEqual(r.hit, false, '短文本应不命中');
});

// ─── 分工边界 2（存量维度真兜底 + 本模块不命中）──────────────────
console.log('\n--- 分工边界（与既有维度的语域分工）---');
test('DIVISION-1: tu_quoque 管一致性资格剥夺（存量真兜底 verify）', () => {
  // tu_quoque（第 141 维）管「你也这样，没资格说我」的一致性结构，
  // 本族管言论随人废；样本实测存量真兜底（gate verify）
  const r = checkAdHominem('你自己也这样做，没资格说我');
  assert.strictEqual(r.hit, false, '一致性资格剥夺不应触发 ad_hominem');
  assert.notStrictEqual(gate.checkOutput('你自己也这样做，没资格说我').gate.action, 'pass',
    '分工边界样本应被存量维度兜底');
});
test('DIVISION-2: appeal_to_ridicule 管嘲笑蔑视（存量真兜底 verify）', () => {
  // appeal_to_ridicule（第 137 维）管嘲笑/蔑视表达，
  // 本族管属性贬损 × 言论否定的推论结构；样本实测存量真兜底（gate verify）
  const r = checkAdHominem('这种想法也太可笑了，亏你想得出来');
  assert.strictEqual(r.hit, false, '嘲笑表达不应触发 ad_hominem');
  assert.notStrictEqual(gate.checkOutput('这种想法也太可笑了，亏你想得出来').gate.action, 'pass',
    '分工边界样本应被存量维度兜底');
});

// ─── gate 层 5 ───────────────────────────────────────────────────
console.log('\n--- gate 层登记断言 ---');
test('GATE-1: dimensions 键包含 ad_hominem', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('ad_hominem'), 'dimensions 键缺少 ad_hominem');
});
test('GATE-2: 维度键总数 150', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 150, '维度键总数应为 150，实际 ' + keys.length);
});
test('GATE-3: VERIFY_DIMS 包含 ad_hominem（findings 有 guidance）', () => {
  const r = gate.checkOutput('他的人品有问题，所以他的观点全部不成立');
  const findings = r.findings || [];
  const cp = findings.find(f => f.dimension === 'ad_hominem');
  assert.ok(cp, 'findings 中应有 ad_hominem');
  assert.ok(cp.guidance, 'ad_hominem 应有 guidance');
});
test('GATE-4: gate.action 为 verify 或 rewrite', () => {
  const a = gate.checkOutput('他的人品有问题，所以他的观点全部不成立').gate.action;
  assert.ok(a === 'verify' || a === 'rewrite', 'gate.action 应为 verify 或 rewrite，实际 ' + a);
});
test('GATE-5: findings 中 ad_hominem 的 guidance 包含人身攻击', () => {
  const r = gate.checkOutput('他的人品有问题，所以他的观点全部不成立');
  const findings = r.findings || [];
  const cp = findings.find(f => f.dimension === 'ad_hominem');
  assert.ok(cp, 'findings 中应有 ad_hominem');
  assert.ok(cp.guidance && cp.guidance.includes('人身攻击'), 'guidance 应包含「人身攻击」');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
