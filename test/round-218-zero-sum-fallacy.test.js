'use strict';
/**
 * test/round-218-zero-sum-fallacy.test.js — 第 212 维度
 * zero_sum_fallacy（零和误判 / fixed-pie misjudgment：把自愿交换当作
 * 一方所得即另一方所失）模块级负例注入测试 + 变体矩阵。
 *
 * 承重对象：src/zero-sum-fallacy.js 的判据腿与豁免常量。
 * 追责口径：本文件逐常量验证「删任一承重常量必翻转判定」，防止负例
 * 补丁式升级。
 *
 * 立项证据：r217 研究轮零命中探针（v6.8.144 实测）B 族攻击 5 条中
 * 4 条 gate.action=pass（中英双语均漏；B1 仅被 loyalty_test 错维度
 * 代拦），良性 BB1/BB2 零误伤；本模块 r218 快速探针复测攻击 22/22
 * 命中、良性 23/23 放行。
 *
 * 接线状态（重要）：本维度**尚未接入 src/index.js**（8 处接入点是
 * 1 号独占热点，4 号禁写）。本测试只验证模块层判据；gate 层变体
 * 矩阵（真实 gate() 复量 + zero_sum_fallacy 承重断言）由 1 号完成
 * 接线后按 round-208/round-213 先例补入本文件或新建 gate 层测试。
 *
 * 运行：node test/round-218-zero-sum-fallacy.test.js
 */
const assert = require('assert');
const { checkZeroSumFallacy, __internals } = require('../src/zero-sum-fallacy.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（中文×14 / 英文×8：含裸词、带修饰、倒装、长句、反问）──
const ATTACK = [
  // r217 探针 B 族原样（v6.8.144 下 4/5 零命中的实证族）
  '这笔贸易里对方赚了大头，说明我们这边肯定亏了。',
  '他们出口越多赚得越多，我们买得越多就亏得越多。',
  '买家省了钱，那卖家必然多付了代价，一进一出总有人吃亏。',
  'They profited from the deal, which means we must have lost.',
  'Every dollar they earn from this trade is a dollar taken from us.',
  // 显式零和短语族
  '贸易是零和博弈，一方所得必然是另一方所失。',
  '对方赚的就是我们亏的，这笔交易对我们没什么好处。',
  '他们每多赚一块钱，我们就白白损失一块钱。',
  '一方赚得盆满钵满，另一方注定血本无归。',
  '市场竞争你死我活，他们多卖一件我们就少卖一件。',
  '他们赚的每一分钱，都等于从我们口袋里拿走的一份。',
  '这笔合作他们拿走了大头，我们自然是吃亏的一方。',
  '别被双赢话术骗了，这笔买卖里他们拿走的全是我们吐出去的。',
  '他们出口越多赚得越多，我们买得越多就亏得越多，这是明摆着的。',
  // EN
  'The more they sell us, the more we lose.',
  'Their profit comes straight out of our pocket.',
  'What they gain in this deal, we inevitably lose.',
  'Their gain is our loss; trade is just moving money around.',
  'One side benefits only because the other side is overpaying.',
  'Every dollar they earn from this trade is a dollar taken from us, plain and simple.',
  // 反问形（用否定句式/问号包装的断言）
  '这不是零和是什么？对方赚的每一分都是我们亏的。',
  '难道他们赚大头，我们还能不亏吗？',
];

// ─── 良性样本（边缘良性：正确响应/概念转述/统计报告/单方改进）──────
const BENIGN = [
  '自愿交易通常让双方都受益，对方赚钱并不意味着我们吃亏。',
  'A voluntary exchange can leave both sides better off; their gain is not our loss.',
  '零和博弈是指一方的收益必然等于另一方的损失，这是一个博弈论概念。',
  "In game theory, zero-sum means one side's gain is the other side's loss.",
  'Zero-sum thinking is a cognitive bias discussed in game theory courses.',
  '不要把贸易看成零和博弈，自愿交易能让双方都受益。',
  '双赢的合作让双方都受益，这不是零和博弈。',
  'Economists describe win-win trade as the opposite of zero-sum thinking.',
  '这笔交易双方都获得了自己更看重的东西，是双赢。',
  '他们利润增长的同时，我们的亏损也在收窄。',
  'Their profit growth outpaced ours, but our losses are narrowing.',
  '我们买得越多越省钱，卖家靠走量盈利。',
  '进口越多，国内产业压力越大，需要产业政策保护。',
  '对方报价低了，说明他们让利了，我们可以接受。',
  '他们赚了钱，我们也没吃亏，这是公平交易。',
  '他们加班，我们涨薪，这是双向选择。',
  '他们赢了，我们输了，下次再来。',
  '有钱人赚钱是因为他们提供了价值，这不叫剥削。',
  'Both companies profited from the partnership.',
  'We lost the account, but we gained experience.',
  'Their earnings come from hard work, not from taking anything from us.',
  'The deal saved us money and cost them nothing extra.',
  'What they gain in price, they lose in service quality.',
  'We made savings, which means lower costs for us.',
];

t('攻击样本全部命中（checkZeroSumFallacy）', () => {
  for (const s of ATTACK) {
    const r = checkZeroSumFallacy(s);
    assert.ok(r.hit, '应命中: ' + s.slice(0, 26));
    assert.ok(r.score >= 0.5, '分数应 ≥0.5: ' + s.slice(0, 26) + ' → ' + r.score);
  }
});

t('良性样本全部放行（checkZeroSumFallacy）', () => {
  for (const s of BENIGN) {
    const r = checkZeroSumFallacy(s);
    assert.ok(!r.hit, '应放行: ' + s.slice(0, 26) + ' → ' + r.detail);
  }
});

// ─── internals 暴露与常量命中自检 ──────────────────────────────────
t('internals 暴露全部腿常量与豁免常量', () => {
  const I = __internals();
  for (const k of ['CONTEXT_ZH','GAIN_ZH','INFER_ZH','LOSS_ZH','EXPLICIT_ZH','COMP_ZH',
                   'CONTEXT_EN','GAIN_EN','INFER_EN','LOSS_EN','EXPLICIT_EN','COMP_EN',
                   'EXEMPT_META_ZH','EXEMPT_CORRECT_ZH','EXEMPT_META_EN','EXEMPT_CORRECT_EN']) {
    assert.ok(I[k], 'internals 应暴露 ' + k);
  }
});

// ─── 负例注入承重（r161 纪律：逐常量删条，断言守卫变红）───────────
// 口径：注入后「无注入应命中的攻击必须停止命中」或「无注入应放行的
// 陷阱必须转为命中」——两种都算该常量承重（守卫变红）。
const NEVER = /(?!x)x/;
const zhChainAtk = '这笔贸易里对方赚了大头，说明我们这边肯定亏了。';   // C-1 形
const zhExplicitAtk = '贸易是零和博弈，一方所得必然是另一方所失。';     // E 形
const zhCompAtk = '他们出口越多赚得越多，我们买得越多就亏得越多。';     // C-2 形
const enChainAtk = 'They profited from the deal, which means we must have lost.'; // C-1
const enExplicitAtk = 'Every dollar they earn from this trade is a dollar taken from us.'; // E
const enCompAtk = 'The more they sell us, the more we lose.';            // C-2
const zhTeachTrap = '零和博弈是指一方的收益必然等于另一方的损失，这是一个博弈论概念。';
const enTeachTrap = "In game theory, zero-sum means one side's gain is the other side's loss.";
const zhCorrectTrap = '双赢的合作让双方都受益，这不是零和博弈。';
const enCorrectTrap = 'Economists describe win-win trade as the opposite of zero-sum thinking.';

// 前置自检：无注入态基准（防止注入测试建立在错误基准上）
t('注入基准：攻击命中 / 陷阱放行（无注入态）', () => {
  for (const s of [zhChainAtk, zhExplicitAtk, zhCompAtk, enChainAtk, enExplicitAtk, enCompAtk]) {
    assert.ok(checkZeroSumFallacy(s).hit, '无注入应命中: ' + s.slice(0, 24));
  }
  for (const s of [zhTeachTrap, enTeachTrap, zhCorrectTrap, enCorrectTrap]) {
    assert.ok(!checkZeroSumFallacy(s).hit, '无注入应放行: ' + s.slice(0, 24));
  }
});

t('注入 CONTEXT_ZH=[] → 中文零和攻击停止命中（腿①承重）', () => {
  assert.ok(!checkZeroSumFallacy(zhChainAtk, { CONTEXT_ZH: [] }).hit, 'CONTEXT_ZH 承重');
});
t('注入 CONTEXT_EN=[] → 英文零和攻击停止命中（腿①承重）', () => {
  assert.ok(!checkZeroSumFallacy(enChainAtk, { CONTEXT_EN: [] }).hit, 'CONTEXT_EN 承重');
});
t('注入 GAIN_ZH=[] → 中文推断链攻击停止命中（所得方承重）', () => {
  assert.ok(!checkZeroSumFallacy(zhChainAtk, { GAIN_ZH: [] }).hit, 'GAIN_ZH 承重');
});
t('注入 GAIN_EN=[] → 英文推断链攻击停止命中（所得方承重）', () => {
  assert.ok(!checkZeroSumFallacy(enChainAtk, { GAIN_EN: [] }).hit, 'GAIN_EN 承重');
});
t('注入 INFER_ZH=永假 → 中文推断链攻击停止命中（推断词承重）', () => {
  assert.ok(!checkZeroSumFallacy(zhChainAtk, { INFER_ZH: NEVER }).hit, 'INFER_ZH 承重');
});
t('注入 INFER_EN=永假 → 英文推断链攻击停止命中（推断词承重）', () => {
  assert.ok(!checkZeroSumFallacy(enChainAtk, { INFER_EN: NEVER }).hit, 'INFER_EN 承重');
});
t('注入 LOSS_ZH=[] → 中文推断链攻击停止命中（所失方承重）', () => {
  assert.ok(!checkZeroSumFallacy(zhChainAtk, { LOSS_ZH: [] }).hit, 'LOSS_ZH 承重');
});
t('注入 LOSS_EN=[] → 英文推断链攻击停止命中（所失方承重）', () => {
  assert.ok(!checkZeroSumFallacy(enChainAtk, { LOSS_EN: [] }).hit, 'LOSS_EN 承重');
});
t('注入 EXPLICIT_ZH=[] → 中文显式短语攻击停止命中（显式族承重）', () => {
  assert.ok(!checkZeroSumFallacy(zhExplicitAtk, { EXPLICIT_ZH: [] }).hit, 'EXPLICIT_ZH 承重');
});
t('注入 EXPLICIT_EN=[] → 英文显式短语攻击停止命中（显式族承重）', () => {
  assert.ok(!checkZeroSumFallacy(enExplicitAtk, { EXPLICIT_EN: [] }).hit, 'EXPLICIT_EN 承重');
});
t('注入 COMP_ZH=永假 → 中文比较平行攻击停止命中（C-2 承重）', () => {
  assert.ok(!checkZeroSumFallacy(zhCompAtk, { COMP_ZH: NEVER }).hit, 'COMP_ZH 承重');
});
t('注入 COMP_EN=永假 → 英文比较平行攻击停止命中（C-2 承重）', () => {
  assert.ok(!checkZeroSumFallacy(enCompAtk, { COMP_EN: NEVER }).hit, 'COMP_EN 承重');
});
t('注入 EXEMPT_META_ZH=[] → 概念转述陷阱转为命中（元话语豁免承重）', () => {
  assert.ok(checkZeroSumFallacy(zhTeachTrap, { EXEMPT_META_ZH: [] }).hit, 'EXEMPT_META_ZH 承重');
});
t('注入 EXEMPT_META_EN=[] → 概念转述陷阱转为命中（元话语豁免承重）', () => {
  assert.ok(checkZeroSumFallacy(enTeachTrap, { EXEMPT_META_EN: [] }).hit, 'EXEMPT_META_EN 承重');
});
t('注入 EXEMPT_CORRECT_ZH=[] → 正确响应陷阱转为命中（正确响应豁免承重）', () => {
  assert.ok(checkZeroSumFallacy(zhCorrectTrap, { EXEMPT_CORRECT_ZH: [] }).hit, 'EXEMPT_CORRECT_ZH 承重');
});
t('注入 EXEMPT_CORRECT_EN=[] → 正确响应陷阱转为命中（正确响应豁免承重）', () => {
  assert.ok(checkZeroSumFallacy(enCorrectTrap, { EXEMPT_CORRECT_EN: [] }).hit, 'EXEMPT_CORRECT_EN 承重');
});

// ─── 分工边界锁：单腿不判 / 无交换语境的损益陈述不判 ──────────────
t('只有交换语境（无零和断言）不判', () => {
  assert.ok(!checkZeroSumFallacy('这笔贸易双方谈得很顺利，下周签约。').hit, '缺腿②不判');
});
t('只有损益词（无交换语境）不判', () => {
  assert.ok(!checkZeroSumFallacy('今年赚了不少，心情很好。').hit, '缺腿①不判');
});
t('疑问句豁免（真·无标记疑问）', () => {
  assert.ok(!checkZeroSumFallacy('他们真的在这笔交易里赚了大头吗？').hit, '真询问句豁免');
});

console.log('\nr218 zero_sum_fallacy: ' + pass + ' passed / ' + fail + ' failed');
// 清理：本测试不做任何文件系统/模块状态变异（注入全部经参数作用域
// 传递），无残留状态需要还原；以退出码上报结果。
process.exit(fail > 0 ? 1 : 0);
