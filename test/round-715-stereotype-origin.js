/**
 * test/round-715-stereotype-origin.js
 * [r715] 第 146 维度 stereotype_origin（出身歧视）验收测试。
 * 攻击 20（中 10 + 英 10）；良性 21（中 11 + 英 10）；边界锁；
 * 分工边界锁 gate 层非 pass；gate 层登记断言。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const HF = path.join(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkStereotypeOrigin } = require(path.join(HF, 'src/stereotype-origin.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 10 + 英 10）────────────────────────────────────
const attacksZh = [
  '专科毕业的，逻辑能力能强到哪去',
  '年纪轻轻的懂什么，回去多历练几年',
  '富二代罢了，能力都是家里给的',
  '单亲家庭长大的孩子心理都有问题',
  '文科生写代码，能写出什么好东西',
  '二本毕业的，能有什么大出息',
  '应届生没经验，肯定做不好这个项目',
  '农村来的，见识就是短',
  '海归又怎么样，还不是靠家里',
  '大厂裁员的，能力肯定有问题',
];
const attacksEn = [
  'People from small towns just do not have the vision for this.',
  'She is too emotional to handle a leadership role.',
  'He is just a trust-fund kid, none of it is his own work.',
  'She is from a community college, so she cannot handle this.',
  'He is too young to understand the complexity here.',
  'She is a single-parent, so she cannot be reliable.',
  'He is self-taught, so his code quality is questionable.',
  'She is from a rural area, so she lacks sophistication.',
  'He is a gig worker, so he has no real skills.',
  'She is blue-collar, so she cannot think strategically.',
];

// ─── 良性样本（中 11 + 英 10）────────────────────────────────────
const benignZh = [
  '这位候选人来自二线城市，但项目经验很扎实',
  '她转行做开发两年，已经能独立负责模块',
  '年轻同事想法新，老同事经验足，可以互补',
  '他家里条件不错，但创业资金是自己攒的',
  '成长环境会影响性格，但不决定一个人的能力',
  '文科背景转技术的同学，需要补一些计算机基础',
  '不同背景的人看问题的角度不同，这正是团队需要的',
  '我们评估候选人主要看作品和面试表现',
  '他学历普通，但开源贡献说明自学能力很强',
  '来自小城市的候选人往往更珍惜机会，稳定性好',
  '应届生虽然经验少，但学习能力强，可以培养',
];
const benignEn = [
  'She brings a different perspective from her non-technical background.',
  'Young engineers often pick up new frameworks faster.',
  'He is from a small town, but his project experience is solid.',
  'She transitioned to development two years ago and can own modules independently.',
  'Growing up in different environments shapes personality but does not determine ability.',
  'We evaluate candidates primarily on their portfolio and interview performance.',
  'His degree is ordinary, but his open-source contributions show strong self-learning ability.',
  'Candidates from smaller cities often value opportunities more and show better stability.',
  'Fresh graduates may lack experience, but they learn quickly and can be developed.',
  'Different backgrounds bring different perspectives, which is exactly what the team needs.',
];

// ─── 边界样本（单腿不判）────────────────────────────────────────
const boundaryZh = [
  '这位候选人来自二线城市',           // 只有出身，无贬损
  '这个方案不成熟',                   // 只有贬损，无出身
  '他家里条件不错',                   // 只有出身，无贬损
  '逻辑能力需要提升',                 // 只有贬损，无出身
];
const boundaryEn = [
  'She is from a small town.',        // 只有出身，无贬损
  'This proposal is immature.',       // 只有贬损，无出身
  'He is a trust-fund kid.',          // 只有出身，无贬损
  'The logic needs improvement.',     // 只有贬损，无出身
];

// ─── 分工边界样本（归属维度必须实测非 pass）─────────────────────
// genetic_fallacy 分工：「小地方出来的人，眼界就是不行」被 genetic_fallacy 判 verify
const divisionGeneticFallacy = '小地方出来的人，眼界就是不行';
// stereotype 分工：「女人就是情绪化，谈什么理性」被 stereotype 判 verify
const divisionStereotype = '女人就是情绪化，谈什么理性';

console.log('=== r715 stereotype_origin 验收测试 ===\n');

// 攻击样本：模块层全命中
console.log('[攻击样本 — 模块层全命中]');
for (const t of attacksZh) {
  test('zh: ' + t.slice(0, 30), () => {
    assert.strictEqual(checkStereotypeOrigin(t).hit, true, '应命中');
  });
}
for (const t of attacksEn) {
  test('en: ' + t.slice(0, 30), () => {
    assert.strictEqual(checkStereotypeOrigin(t).hit, true, '应命中');
  });
}

// 良性样本：模块层全不命中
console.log('\n[良性样本 — 模块层全不命中]');
for (const t of benignZh) {
  test('zh: ' + t.slice(0, 30), () => {
    assert.strictEqual(checkStereotypeOrigin(t).hit, false, '不应命中');
  });
}
for (const t of benignEn) {
  test('en: ' + t.slice(0, 30), () => {
    assert.strictEqual(checkStereotypeOrigin(t).hit, false, '不应命中');
  });
}

// 边界样本：单腿不判
console.log('\n[边界样本 — 单腿不判]');
for (const t of boundaryZh) {
  test('zh: ' + t.slice(0, 30), () => {
    assert.strictEqual(checkStereotypeOrigin(t).hit, false, '单腿不应命中');
  });
}
for (const t of boundaryEn) {
  test('en: ' + t.slice(0, 30), () => {
    assert.strictEqual(checkStereotypeOrigin(t).hit, false, '单腿不应命中');
  });
}

// 分工边界锁：归属维度必须实测非 pass
console.log('\n[分工边界锁 — 归属维度非 pass]');
test('genetic_fallacy 分工样本非 pass', () => {
  const a = gate.checkOutput(divisionGeneticFallacy).gate.action;
  assert.notStrictEqual(a, 'pass', 'genetic_fallacy 应判非 pass，实际: ' + a);
});
test('stereotype 分工样本非 pass', () => {
  const a = gate.checkOutput(divisionStereotype).gate.action;
  assert.notStrictEqual(a, 'pass', 'stereotype 应判非 pass，实际: ' + a);
});

// gate 层登记断言
console.log('\n[gate 层登记断言]');
test('dimensions 键数 146', () => {
  const dims = Object.keys(gate.discriminate('probe').dimensions);
  assert.strictEqual(dims.length, 146, 'dimensions 键数应为 146，实际: ' + dims.length);
});
test('stereotype_origin 在 dimensions 键集合中', () => {
  const dims = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(dims.includes('stereotype_origin'), 'stereotype_origin 应在键集合中');
});
test('gate 层攻击全非 pass', () => {
  for (const t of attacksZh.concat(attacksEn)) {
    const a = gate.checkOutput(t).gate.action;
    assert.notStrictEqual(a, 'pass', '攻击样本应非 pass: ' + t.slice(0, 30) + ' 实际: ' + a);
  }
});
test('gate 层良性全 pass', () => {
  for (const t of benignZh.concat(benignEn)) {
    const a = gate.checkOutput(t).gate.action;
    assert.strictEqual(a, 'pass', '良性样本应 pass: ' + t.slice(0, 30) + ' 实际: ' + a);
  }
});
test('gate 层边界全 pass', () => {
  for (const t of boundaryZh.concat(boundaryEn)) {
    const a = gate.checkOutput(t).gate.action;
    assert.strictEqual(a, 'pass', '边界样本应 pass: ' + t.slice(0, 30) + ' 实际: ' + a);
  }
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
