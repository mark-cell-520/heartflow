'use strict';
/**
 * test/round-166-denying-the-antecedent.js
 * [r166] 第 165 维度 denying_the_antecedent（否定前件：如果P则Q；并非P所以并非Q）
 * 轮测试。结构同 r725(affirming-the-consequent) / r161 / r165 先例：
 * 攻击集 / 良性集 / 区分锁 / 分工边界锁 / 存量回归 / 登记断言 /
 * 负例注入承重 / gate 层实测。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r729/
 * r161/r163/r164/r165 纪律。
 *
 * 注入机制：模块导出的 __internals 各常量与引擎内读取的是同一数组引用，
 * 承重测试通过临时置空该数组（arr.length=0）验证「承重」——置空后攻击必须
 * 停判（腿承重）、豁免样本必须翻转为命中（豁免承重），完成后还原。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const { checkDenyingTheAntecedent, __internals } = require(path.join(ROOT, 'src', 'denying-the-antecedent.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const fired = (s) => checkDenyingTheAntecedent(s).score > 0;
const dimCount = (s, k) => {
  const d = (idx.discriminate(s).dimensions || {})[k];
  if (!d || typeof d !== 'object') return 0;
  return d.count !== undefined ? d.count : (Array.isArray(d.hits) ? d.hits.length : 0);
};
const gateAct = (s) => { try { return gate.checkOutput(s).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
function withEmptied(key, fn) {
  const arr = __internals[key];
  const saved = arr.slice();
  arr.length = 0;
  try { return fn(); } finally { arr.length = 0; for (const v of saved) arr.push(v); }
}

// ── 1. 攻击集（¬P∴¬Q；同族变体矩阵：中英双语/裸词干/带修饰/长句/远修饰）──
const attacksZh = [
  '如果下雨，运动会就取消；今天没下雨，所以运动会不取消。',            // 如果…就 基本形
  '努力的人都会早起；他根本不努力，所以他不会早起。',                  // 都会 全称形
  '认真复习的人都能考过；他没认真复习，所以他考不过。',                // 都能 全称形
  '方向对的人进步会快；他方向不对，所以他进步不会快。',                // 会 白描条件形
  '只要下雨，运动会就取消；没下雨，所以运动会不取消。',                // 只要…就
  '口碑好的餐厅客流都会稳定；这家餐厅口碑不行，所以它客流不会稳定。',  // 带修饰+长句
  '用户反馈好的产品都会快速迭代；这款反馈不行，所以它迭代不会快。',     // 带修饰+远距离
  '如果是周末，商店就关门；今天不是周末，所以商店不关门。',            // 远修饰
];
const attacksEn = [
  'If it rains, the match will be cancelled. It did not rain, so the match is not cancelled.',
  'Well-made products get good reviews. This product is not well-made, so it will not get good reviews.',
  'If she studied hard, she would pass. She did not study hard, so she will not pass.',
  'Good students attend every class. He is not a good student, so he does not attend every class.',
  'Diligent coders write tests. He is not diligent, so he does not write tests.',
];
for (const [i, s] of attacksZh.entries()) t('攻击ZH#' + (i + 1) + ' 命中', () => assert.ok(fired(s), '未命中: ' + s));
for (const [i, s] of attacksEn.entries()) t('攻击EN#' + (i + 1) + ' 命中', () => assert.ok(fired(s), '未命中: ' + s));

// ── 2. 良性集（模块层零误判——有效推理/豁免/边缘良性）────────────────
const benignZh = [
  '如果明天下雨，运动会就取消；明天下雨了，所以运动会取消。',            // modus ponens（前后件皆肯定）
  '如果是他干的，他会留下痕迹；现场没有痕迹，所以可能不是他干的。',      // modus tollens（¬Q∴¬P）+ 对冲
  '当且仅当下雨，运动会才取消；今天没下雨，所以运动会不取消。',          // 双条件（否定前件有效）
  '早起只是努力的一个表现，不是必要条件，不早起说明不了努不努力。',      // 必要不充分
  '他不努力，但这不意味着他不会早起，他可能是夜猫子型。',                // 否定翻转
  '认真做产品的公司都会打磨细节；这家细节不到位，所以它不算认真。',      // ¬Q∴¬P modus tollens
  '战争是多因共同造成的，不能简化为单一因素。',                          // 边缘良性：正确多因陈述
  '如果努力就能成功，那只靠努力不够，还要看机遇和方法。',                // 对冲/充分性否定
];
const benignEn = [
  'Good students attend every class. He does not attend every class, so he is not a good student.', // ¬Q∴¬P 有效
  'Tests are necessary but not sufficient — we still need code review.',   // 必要不充分
  'He is not tall, but that does not mean he cannot play basketball.',     // 否定翻转
];
for (const [i, s] of benignZh.entries()) t('良性ZH#' + (i + 1) + ' 零误判', () => assert.ok(!fired(s), '误判: ' + s));
for (const [i, s] of benignEn.entries()) t('良性EN#' + (i + 1) + ' 零误判', () => assert.ok(!fired(s), '误判: ' + s));

// ── 3. 区分锁（同 family 不同演绎方向，denying count 必须 0）──────────
t('区分：affirming the consequent（Q∴P）不算否定前件', () => {
  assert.strictEqual(dimCount('如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的。', 'denying_the_antecedent'), 0);
});
t('区分：modus ponens（P∴Q）不算否定前件', () => {
  assert.strictEqual(dimCount('如果下雨，运动会就取消；今天下雨了，所以运动会取消。', 'denying_the_antecedent'), 0);
});

// ── 4. 分工边界锁（conditional_proposition 的 ¬B⇒¬A 样本，denying count 0）─
t('分工：conditional_proposition 形（武器化假言，结论落前件）不算否定前件', () => {
  assert.strictEqual(dimCount('如果他真的爱你，就不会让你受这种委屈。', 'denying_the_antecedent'), 0);
});

// ── 5. 存量回归 ───────────────────────────────────────────────
t('存量回归：诉诸后果样本 discriminate 正常', () => {
  assert.ok(idx.discriminate('万一这是真的，经济就全盘崩溃了，所以这一定是假的。').overallScore >= 0);
});
t('存量回归：肯定后件单维函数仍在', () => {
  assert.strictEqual(typeof idx.checkAffirmingTheConsequent, 'function');
});

// ── 6. 登记断言 ───────────────────────────────────────────────
t('登记：module.exports 导出 checkDenyingTheAntecedent', () => {
  assert.strictEqual(typeof idx.checkDenyingTheAntecedent, 'function');
});
t('登记：dimMap 含 denying_the_antecedent（攻击样本 discriminate 命中）', () => {
  assert.ok(dimCount('如果下雨，运动会就取消；今天没下雨，所以运动会不取消。', 'denying_the_antecedent') >= 1);
});
t('登记：VERIFY 级（gate.action 非 pass）', () => {
  assert.notStrictEqual(gateAct('如果下雨，运动会就取消；今天没下雨，所以运动会不取消。'), 'pass');
});

// ── 7. 负例注入承重（逐常量置空验证）──────────────────────────
t('承重-HEDGE：置空后对冲样本翻转为命中', () => {
  const s = '如果下雨，运动会就取消；可能没下雨，所以也许不取消。';
  assert.ok(!fired(s), '对冲应豁免');
  assert.ok(withEmptied('HEDGE', () => fired(s)), '置空 HEDGE 后应命中');
});
t('承重-BICONDITIONAL：置空后双条件样本翻转为命中', () => {
  const s = '当且仅当下雨，运动会才取消；今天没下雨，所以运动会不取消。';
  assert.ok(!fired(s), '双条件应豁免');
  assert.ok(withEmptied('BICONDITIONAL', () => fired(s)), '置空 BICONDITIONAL 后应命中');
});
t('承重-NEGATION_FLIP：置空后否定翻转样本翻转为命中', () => {
  const s = '努力的人都会早起；他不努力，但这不意味着他不会早起。';
  assert.ok(!fired(s), '否定翻转应豁免');
  assert.ok(withEmptied('NEGATION_FLIP', () => fired(s)), '置空 NEGATION_FLIP 后应命中');
});
t('承重-META_CONCEPT：置空后谬误概念转述样本翻转为命中', () => {
  const s = '否定前件是一种逻辑谬误。如果下雨，运动会就取消；没下雨，所以不取消。';
  assert.ok(!fired(s), '概念转述应豁免');
  assert.ok(withEmptied('META_CONCEPT', () => fired(s)), '置空 META_CONCEPT 后应命中');
});
t('承重-NEG_ZH：置空后中文否定前件攻击停判', () => {
  const s = '如果下雨，运动会就取消；今天没下雨，所以运动会不取消。';
  assert.ok(fired(s), '正常情况下应命中');
  assert.ok(!withEmptied('NEG_ZH', () => fired(s)), '置空 NEG_ZH（无否定检测）后应停判');
});

// ── 8. gate 层实测 ───────────────────────────────────────────
t('gate 层：攻击样本 action 非 pass 且 findings 含 denying_the_antecedent', () => {
  const r = gate.checkOutput('如果下雨，运动会就取消；今天没下雨，所以运动会不取消。');
  assert.notStrictEqual(r.gate.action, 'pass');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('denying_the_antecedent'), 'findings 应含 denying_the_antecedent: ' + dims.join(','));
});
t('gate 层：良性 modus ponens action=pass', () => {
  assert.strictEqual(gateAct('如果明天下雨，运动会就取消；明天下雨了，所以运动会取消。'), 'pass');
});

// ── 汇总 ─────────────────────────────────────────────────────
console.log('round-166-denying-the-antecedent: ' + pass + ' 通过, ' + fails.length + ' 失败');
if (fails.length) { for (const f of fails) console.log('  FAIL: ' + f); process.exit(1); }
