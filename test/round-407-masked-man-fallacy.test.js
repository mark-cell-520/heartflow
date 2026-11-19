/**
 * test/round-407-masked-man-fallacy.test.js
 * 第 273 维度 masked_man_fallacy（内涵语境替换失效 / masked-man fallacy）
 * r407：两腿+三腿判据、逐常量负例注入承重、豁免逐组、攻击变体矩阵。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const M = require(path.join(__dirname, '..', 'src', 'masked-man-fallacy.js'));
const { checkMaskedManFallacy: C } = M;

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (e) { failed++; console.error('  FAIL -', name, '::', e.message); }
}

// ─── 一、攻击族：三腿共现命中 ───────────────────────────────────────────
const ATTACKS = [
  // 中文：知道 A + A 就是 B + 所以知道 B
  '我知道我的邻居是张三，而张三就是市长，所以我知道市长是谁。',
  '小明知道领奖台上的是冠军，而冠军就是小刚，所以小明知道领奖台上的是小刚。',
  '我认识那个戴面具的人，而他就是新来的总裁，所以我认识总裁。',
  '她相信帮她的是那位好心人，而好心人其实就是老板，因此她相信老板帮了她。',
  '我知道每天给我送信的是老王，老王正是首富，所以我知道首富在给我送信。',
  '我认得讲台上讲话的人，而他就是我失散多年的弟弟，所以我认得弟弟站在讲台上。',
  '孩子相信圣诞老人存在，而圣诞老人其实就是爸爸，所以孩子相信爸爸会爬烟囱。',
  '我了解提出这个方案的人，而他就是上周被开除的实习生，因此我了解开除他的人。',
  // 英文：knows A + A is B + so knows B
  'The morning star is the evening star, so whoever knows the morning star knows the evening star.',
  'Lois knows Superman can fly; Clark Kent is Superman, so Lois knows Clark Kent can fly.',
  'I know who my neighbour is, and my neighbour is actually the mayor, so I know who the mayor is.',
  'She believes the hero saved her, and the hero turns out to be her ex-boyfriend, so she believes her ex-boyfriend saved her.',
  'He recognizes the masked singer, and the masked singer is his own brother, therefore he recognizes his brother on stage.',
  'Everyone knows the champion, and the champion is the same person as the quiet gardener, so everyone knows the quiet gardener.',
  'I am aware the winner studied here, and the winner is actually the dropout, so I am aware the dropout studied here.',
  'They know the boss personally, and the boss is none other than the intern, so they know the intern personally.',
];
t('攻击族全部命中（hit=true）', () => {
  for (const s of ATTACKS) {
    const r = C(s);
    assert.ok(r.hit, '未命中: ' + s.slice(0, 50));
  }
});
t('攻击族 detail 非空、score=0.55', () => {
  for (const s of ATTACKS) {
    const r = C(s);
    assert.strictEqual(r.score, 0.55);
    assert.ok(r.detail && r.detail.length > 0);
  }
});

// ─── 二、良性族：不应命中 ───────────────────────────────────────────────
const BENIGN = [
  // 主体已知同一性——替换合法
  '我知道张三就是市长，所以我和市长是老熟人。',
  'I know that Clark Kent is Superman, so of course I know Superman can fly.',
  '她早就清楚丈夫就是那个送花的人。',
  // 元陈述破除
  '这是 masked-man fallacy 的典型例子。',
  'This is a failure of substitutivity in referentially opaque contexts.',
  '他混淆了指称，属于偷换概念。',
  // 疑问形
  '难道他知道市长是谁吗？',
  'Does anyone know who the mayor really is?',
  // 认识论谨慎
  '他可能知道冠军是谁。',
  'She might know the boss personally.',
  // 普通认知陈述（无共指桥接腿）
  '我知道我的邻居是张三，但我不确定他今晚来不来。',
  'I know the mayor by reputation but have never met him.',
  // 身份揭示叙事（无命题态度腿）
  '冠军就是小刚，领奖台上他哭了。',
  'The hero turns out to be her ex-boyfriend in the final chapter.',
  // 逻辑教学讨论
  '命题态度语境是指称不透明的，替换会失效。',
  'Referentially opaque contexts block substitutivity of identicals.',
];
t('良性族全部不命中（hit=false）', () => {
  for (const s of BENIGN) {
    const r = C(s);
    assert.ok(!r.hit, '误伤: ' + s.slice(0, 50));
  }
});

// ─── 三、逐常量负例注入承重 ─────────────────────────────────────────────
const A1 = '我知道我的邻居是张三，而张三就是市长，所以我知道市长是谁。';
const A2 = 'The morning star is the evening star, so whoever knows the morning star knows the evening star.';
const A3 = 'Lois knows Superman can fly; Clark Kent is Superman, so Lois knows Clark Kent can fly.';

t('注入空 EPISTEMIC_ZH → A1 不判', () => {
  assert.ok(!C(A1, { EPISTEMIC_ZH: [] }).hit);
});
t('注入空 COREFERENTIAL_ZH → A1 不判', () => {
  assert.ok(!C(A1, { COREFERENTIAL_ZH: [] }).hit);
});
t('注入空 OPACITY_INFERENCE_ZH → A1 不判', () => {
  assert.ok(!C(A1, { OPACITY_INFERENCE_ZH: [] }).hit);
});
t('注入空 EXEMPT_SAMEKNOWN_ZH → 良性「认识市长本人」改判命中（承重反向验证）', () => {
  const benign = '我认识市长本人，而市长就是张三，所以我知道张三。';
  assert.ok(!C(benign).hit, '豁免前应不判');
  assert.ok(C(benign, { EXEMPT_SAMEKNOWN_ZH: [] }).hit, '去掉豁免后应改判');
});
t('注入空 EXEMPT_METASTATEMENT_ZH → 元陈述句改判命中', () => {
  const benign = '这是内涵语境替换失效的典型错误，而市长就是张三，所以他知道张三。';
  assert.ok(!C(benign).hit);
  assert.ok(C(benign, { EXEMPT_METASTATEMENT_ZH: [] }).hit);
});
t('注入空 EPISTEMIC_EN → A2/A3 不判', () => {
  assert.ok(!C(A2, { EPISTEMIC_EN: [] }).hit);
  assert.ok(!C(A3, { EPISTEMIC_EN: [] }).hit);
});
t('注入空 COREFERENTIAL_EN → A2 不判', () => {
  assert.ok(!C(A2, { COREFERENTIAL_EN: [] }).hit);
});
t('注入空 OPACITY_INFERENCE_EN → A3 不判', () => {
  assert.ok(!C(A3, { OPACITY_INFERENCE_EN: [] }).hit);
});
t('注入空 EXEMPT_SAMEKNOWN_EN → 英文良性改判命中', () => {
  const benign = 'I know that Clark Kent is Superman, so of course I know Superman can fly.';
  assert.ok(!C(benign).hit);
  assert.ok(C(benign, { EXEMPT_SAMEKNOWN_EN: [] }).hit);
});
t('注入空 EXEMPT_QUESTION_ZH → 中文疑问句改判命中', () => {
  const q = '他是不是知道市长是谁呢，而市长就是张三，所以他知道张三。';
  assert.ok(!C(q).hit);
  assert.ok(C(q, { EXEMPT_QUESTION_ZH: [] }).hit);
});

// ─── 四、邻近窗边界 ─────────────────────────────────────────────────────
t('注入 WIN_ZH=10 → 远距三腿不判', () => {
  assert.ok(!C(A1, { WIN_ZH: 10 }).hit);
});
t('注入 WIN_EN=40 → 英文远距不判', () => {
  assert.ok(!C(A3, { WIN_EN: 40 }).hit);
});

// ─── 五、入口守卫 ───────────────────────────────────────────────────────
t('非字符串/空文本不判', () => {
  assert.ok(!C('').hit);
  assert.ok(!C(null).hit);
  assert.ok(!C(undefined).hit);
  assert.ok(!C(12345).hit);
  assert.ok(!C('短').hit);
});

// ─── 六、模块导出完整性 ────────────────────────────────────────────────
t('导出口齐全', () => {
  for (const k of ['EPISTEMIC_ZH','EPISTEMIC_EN','COREFERENTIAL_ZH','COREFERENTIAL_EN',
    'OPACITY_INFERENCE_ZH','OPACITY_INFERENCE_EN','EXEMPT_SAMEKNOWN_ZH','EXEMPT_SAMEKNOWN_EN',
    'EXEMPT_METASTATEMENT_ZH','EXEMPT_METASTATEMENT_EN','EXEMPT_QUESTION_ZH','EXEMPT_QUESTION_EN',
    'EXEMPT_HEDGE_ZH','EXEMPT_HEDGE_EN']) {
    assert.ok(Array.isArray(M[k]), '缺导出: ' + k);
  }
  assert.strictEqual(typeof M.WIN_ZH, 'number');
  assert.strictEqual(typeof M.WIN_EN, 'number');
  assert.strictEqual(typeof C, 'function');
});

// ─── 七、裸名词自查（r161 教训：去后缀仍命中）────────────────────────
t('裸名词变体命中', () => {
  const bare = [
    '我知道张三，张三就是市长，所以我知道市长。',
    'He knows Bruce, and Bruce is Batman, so he knows Batman.',
  ];
  for (const s of bare) assert.ok(C(s).hit, '裸名词漏判: ' + s);
});

console.log(`\nround-407-masked-man-fallacy: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
