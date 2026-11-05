'use strict';
/**
 * test/round-219-budget-value-conflation.test.js — 第 213 维度
 * budget_value_conflation（预算约束≠价值判断：把「买不起」的资源
 * 约束偷换成「不值得」的内在价值）模块级负例注入测试 + 变体矩阵。
 *
 * 承重对象：src/budget-value-conflation.js 的判据腿与豁免常量。
 * 追责口径：本文件逐常量验证「删任一承重常量必翻转判定」，防止负例
 * 补丁式升级。
 *
 * 立项证据：r217 研究轮零命中探针（v6.8.144 实测）C 族攻击 5 条中
 * 3 条 gate.action=pass（C2/C4/C5 中英双语均漏；C1 仅被 fallacies/
 * appeal_to_pity 错维度代拦、C3 仅被 circular_reasoning 代拦且该句
 * 本身确有循环形），良性 BC1/BC2 零误伤；覆盖度检查（r219 grep
 * 实测）预算/负担不起/买不起/afford/worth 无任何维度以「购买力推断
 * 事物内在价值」为判据；r219 海外扫描空返（arXiv 短语精确 0 条目、
 * GitHub repos 0、S2 429），按既有形态自建。
 *
 * 接线状态（重要）：本维度**尚未接入 src/index.js**（8 处接入点是
 * 1 号独占热点，4 号禁写）。本测试只验证模块层判据；gate 层变体
 * 矩阵（真实 gate() 复量 + budget_value_conflation 承重断言）由
 * 1 号完成接线后按 round-208/213/218 先例补入本文件或新建 gate 层
 * 测试。
 *
 * 运行：node test/round-219-budget-value-conflation.test.js
 */
const assert = require('assert');
const { checkBudgetValueConflation, __internals } = require('../src/budget-value-conflation.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（中文×16 / 英文×10：含裸词、带修饰、长句、反问、泛化、
// 反向归因；F-1 推断链 / F-2 泛化 / F-3 反问 / F-4 反向归因四形覆盖）──
const ATTACK = [
  // r217 探针 C 族原样（v6.8.144 下 3/5 零命中的实证族）
  '我们预算不够，所以这件事本来就不值得做。',
  '既然负担不起，说明它对我们也没多大价值。',
  '钱不够就买不起，买不起的东西注定不重要。',
  "We can't afford it, so it's clearly not worth doing.",
  'If the budget cannot cover it, then it cannot matter much.',
  // F-1 推断链形扩展（裸词/带修饰/同义替换）
  '公司账上没钱，这个项目显然没有什么价值。',
  '预算这么紧张，可见它本来就不重要。',
  '连首付都付不起，说明它根本不是重要需求。',
  '预算覆盖不了，证明这个方向没什么价值。',
  '既然买不起，说明它注定无关紧要。',
  '超出预算的部分，说明它本身就不值得。',
  '我们掏不出这笔钱，可见这事也无足轻重。',
  '资金不够，所以它不重要，先放一放。',
  'Since we can\'t afford the license, it obviously isn\'t worth the trouble.',
  'Our budget is too tight for it, which shows it has little real value.',
  'If we can\'t pay for it, then it can\'t be that important.',
  'The budget can\'t stretch that far, so it must not matter much.',
  // F-2 泛化形（买不起的X都/注定 + 价值否定；EN what we can't afford can't matter）
  '买不起的东西都无关紧要，人也一样。',
  "Things we can't afford are never worth wanting.",
  'Whatever we cannot afford cannot really matter to us.',
  // F-3 反问形（用问号包装的断言）
  '连这个钱都出不起，能是什么重要的事吗？',
  '预算不够，难道还能是什么关键项目吗？',
  "We can't even afford it — how important can it really be?",
  // F-4 反向归因形（先给价值结论，再拿预算当归因）
  '这件事不值得做，因为我们的预算本来就不够。',
  '它显然不重要，毕竟我们连钱都出不起。',
  "It isn't worth doing, because our budget was never enough.",
];

// ─── 良性样本（边缘良性：正确响应/概念转述/纯行动推迟/非预算理由的
// 价值判断/否定守卫/疑问句）──────────────────────────────────────
const BENIGN = [
  // r217 探针 BC 族原样
  '预算不够是资源约束，和价值判断是两回事，值得做的事可以排队等资源。',
  'A budget constraint is not a verdict on worth; affordability and value are separate questions.',
  // 只有预算约束、无价值否定（正当的资源决策陈述）
  '预算不够，今年先不做，排队等资源。',
  '预算有限，所以我们优先保障核心业务，其余顺延。',
  "We can't afford it this quarter, so the decision is postponed to next year.",
  'If we can\'t afford the license, we can switch to an open-source alternative.',
  '买不起可以租，租不起可以借，办法总比困难多。',
  '房租快付不起了，下个月必须省着点花。',
  // 只有价值否定、无预算约束（正常成本收益论证，缺腿①）
  '这个功能使用率低，不值得投入。',
  '它价格高，但质量也高，值这个价。',
  'The price is high, but you get what you pay for.',
  // 预算在场但价值被肯定/拒绝用钱衡量
  '我们出不起这个价钱，但它的价值是明摆着的。',
  '账上钱不多，但员工的休息时间不是用钱衡量的。',
  'We couldn\'t afford the trip, yet the experience would have been priceless.',
  // 正确响应形（指出预算与价值是两个问题——正是要教的判别动作）
  '预算不足是资源约束，不等于价值判断。',
  'Affordability is a budget fact, not a measure of intrinsic worth.',
  '预算不够不等于它不值得，这是两回事。',
  // 否定守卫（「并不说明」「doesn't mean」——对推断的否认）
  '我们预算不够，但这并不说明它不值得重视。',
  '预算不够从来不是忽略安全投入的理由。',
  "We can't afford it, but that clearly doesn't mean it isn't worth doing.",
  // 概念/教学转述（讨论这个概念本身不是运用它）
  '经济学教材指出，把预算约束当成价值判断是一种认知偏误。',
  'In economics, conflating a budget constraint with a judgment of worth is a known reasoning error.',
  '有人说「买不起就不值得」，这是一种常见的认知偏误。',
  // 反向归因形的句读护栏（「因为需求不足；预算反而是次要的」）
  '这个项目不值得做，因为需求不足；预算反而是次要的。',
  // 疑问句豁免（真·无标记疑问）
  '他们真的预算不够吗？这件事还值得做吗？',
];

t('攻击样本全部命中（checkBudgetValueConflation）', () => {
  for (const s of ATTACK) {
    const r = checkBudgetValueConflation(s);
    assert.ok(r.hit, '应命中: ' + s.slice(0, 26));
    assert.ok(r.score >= 0.5, '分数应 ≥0.5: ' + s.slice(0, 26) + ' → ' + r.score);
  }
});

t('良性样本全部放行（checkBudgetValueConflation）', () => {
  for (const s of BENIGN) {
    const r = checkBudgetValueConflation(s);
    assert.ok(!r.hit, '应放行: ' + s.slice(0, 26) + ' → ' + r.detail);
  }
});

// ─── internals 暴露与常量命中自检 ──────────────────────────────────
t('internals 暴露全部腿常量与豁免常量', () => {
  const I = __internals();
  for (const k of ['BUDGET_ZH','WORTH_ZH','INFER_ZH','GEN_ZH','RHET_ZH','REV_ZH',
                   'BUDGET_EN','WORTH_EN','INFER_EN','GEN_EN','RHET_EN','REV_EN',
                   'EXEMPT_META_ZH','EXEMPT_CORRECT_ZH','EXEMPT_META_EN','EXEMPT_CORRECT_EN',
                   'NEG_ZH','NEG_EN']) {
    assert.ok(I[k], 'internals 应暴露 ' + k);
  }
});

// ─── 负例注入承重（r161 纪律：逐常量删条，断言守卫变红）───────────
// 口径：注入后「无注入应命中的攻击必须停止命中」或「无注入应放行的
// 陷阱必须转为命中」——两种都算该常量承重（守卫变红）。
const NEVER = /(?!x)x/;
const zhChainAtk = '我们预算不够，所以这件事本来就不值得做。';       // F-1
const enChainAtk = "We can't afford it, so it's clearly not worth doing."; // F-1
const zhGenAtk = '买不起的东西都无关紧要，人也一样。';                 // F-2 专形
const enGenAtk = "Things we can't afford are never worth wanting.";   // F-2 专形
const zhRhetAtk = '连这个钱都出不起，能是什么重要的事吗？';           // F-3 专形
const enRhetAtk = "We can't even afford it — how important can it really be?"; // F-3
const zhRevAtk = '这件事不值得做，因为我们的预算本来就不够。';         // F-4 专形
const enRevAtk = "It isn't worth doing, because our budget was never enough."; // F-4
const zhTeachTrap = '教科书里提到，预算不够就说明不值得做，这是一种认知偏误。';
const enTeachTrap = "The textbook explains that if the budget is too tight, something clearly isn't worth doing — a classic misconception.";
const zhCorrectTrap = '预算不够，所以它不值得做——但这是预算约束，和价值大小是两回事。';
const enCorrectTrap = "We can't afford it, so it's not worth doing — but that conclusion is a budget constraint speaking, not a verdict on worth.";
const zhNegTrap = '我们预算不够，但这并不说明它不值得重视。';
const enNegTrap = "We can't afford it, but that clearly doesn't mean it isn't worth doing.";

// 前置自检：无注入态基准（防止注入测试建立在错误基准上）
t('注入基准：攻击命中 / 陷阱放行（无注入态）', () => {
  for (const s of [zhChainAtk, enChainAtk, zhGenAtk, enGenAtk, zhRhetAtk, enRhetAtk, zhRevAtk, enRevAtk]) {
    assert.ok(checkBudgetValueConflation(s).hit, '无注入应命中: ' + s.slice(0, 24));
  }
  for (const s of [zhTeachTrap, enTeachTrap, zhCorrectTrap, enCorrectTrap, zhNegTrap, enNegTrap]) {
    assert.ok(!checkBudgetValueConflation(s).hit, '无注入应放行: ' + s.slice(0, 24));
  }
});

t('注入 BUDGET_ZH=[] → 中文推断链攻击停止命中（腿①承重）', () => {
  assert.ok(!checkBudgetValueConflation(zhChainAtk, { BUDGET_ZH: [] }).hit, 'BUDGET_ZH 承重');
});
t('注入 BUDGET_EN=[] → 英文推断链攻击停止命中（腿①承重）', () => {
  assert.ok(!checkBudgetValueConflation(enChainAtk, { BUDGET_EN: [] }).hit, 'BUDGET_EN 承重');
});
t('注入 WORTH_ZH=[] → 中文推断链攻击停止命中（腿②承重）', () => {
  assert.ok(!checkBudgetValueConflation(zhChainAtk, { WORTH_ZH: [] }).hit, 'WORTH_ZH 承重');
});
t('注入 WORTH_EN=[] → 英文推断链攻击停止命中（腿②承重）', () => {
  assert.ok(!checkBudgetValueConflation(enChainAtk, { WORTH_EN: [] }).hit, 'WORTH_EN 承重');
});
t('注入 INFER_ZH=永假 → 中文推断链攻击停止命中（推断词承重）', () => {
  assert.ok(!checkBudgetValueConflation(zhChainAtk, { INFER_ZH: NEVER }).hit, 'INFER_ZH 承重');
});
t('注入 INFER_EN=永假 → 英文推断链攻击停止命中（推断词承重）', () => {
  assert.ok(!checkBudgetValueConflation(enChainAtk, { INFER_EN: NEVER }).hit, 'INFER_EN 承重');
});
t('注入 GEN_ZH=永假 → 中文泛化形攻击停止命中（F-2 承重）', () => {
  assert.ok(!checkBudgetValueConflation(zhGenAtk, { GEN_ZH: NEVER }).hit, 'GEN_ZH 承重');
});
t('注入 GEN_EN=永假 → 英文泛化形攻击停止命中（F-2 承重）', () => {
  assert.ok(!checkBudgetValueConflation(enGenAtk, { GEN_EN: NEVER }).hit, 'GEN_EN 承重');
});
t('注入 RHET_ZH=永假 → 中文反问形攻击停止命中（F-3 承重）', () => {
  assert.ok(!checkBudgetValueConflation(zhRhetAtk, { RHET_ZH: NEVER }).hit, 'RHET_ZH 承重');
});
t('注入 RHET_EN=永假 → 英文反问形攻击停止命中（F-3 承重）', () => {
  assert.ok(!checkBudgetValueConflation(enRhetAtk, { RHET_EN: NEVER }).hit, 'RHET_EN 承重');
});
t('注入 REV_ZH=永假 → 中文反向归因攻击停止命中（F-4 承重）', () => {
  assert.ok(!checkBudgetValueConflation(zhRevAtk, { REV_ZH: NEVER }).hit, 'REV_ZH 承重');
});
t('注入 REV_EN=永假 → 英文反向归因攻击停止命中（F-4 承重）', () => {
  assert.ok(!checkBudgetValueConflation(enRevAtk, { REV_EN: NEVER }).hit, 'REV_EN 承重');
});
t('注入 EXEMPT_META_ZH=[] → 概念转述陷阱转为命中（元话语豁免承重）', () => {
  assert.ok(checkBudgetValueConflation(zhTeachTrap, { EXEMPT_META_ZH: [] }).hit, 'EXEMPT_META_ZH 承重');
});
t('注入 EXEMPT_META_EN=[] → 概念转述陷阱转为命中（元话语豁免承重）', () => {
  assert.ok(checkBudgetValueConflation(enTeachTrap, { EXEMPT_META_EN: [] }).hit, 'EXEMPT_META_EN 承重');
});
t('注入 EXEMPT_CORRECT_ZH=[] → 正确响应陷阱转为命中（正确响应豁免承重）', () => {
  assert.ok(checkBudgetValueConflation(zhCorrectTrap, { EXEMPT_CORRECT_ZH: [] }).hit, 'EXEMPT_CORRECT_ZH 承重');
});
t('注入 EXEMPT_CORRECT_EN=[] → 正确响应陷阱转为命中（正确响应豁免承重）', () => {
  assert.ok(checkBudgetValueConflation(enCorrectTrap, { EXEMPT_CORRECT_EN: [] }).hit, 'EXEMPT_CORRECT_EN 承重');
});
t('注入 NEG_ZH=永假 → 中文否定守卫陷阱转为命中（否定守卫承重）', () => {
  assert.ok(checkBudgetValueConflation(zhNegTrap, { NEG_ZH: NEVER }).hit, 'NEG_ZH 承重');
});
t('注入 NEG_EN=永假 → 英文否定守卫陷阱转为命中（否定守卫承重）', () => {
  assert.ok(checkBudgetValueConflation(enNegTrap, { NEG_EN: NEVER }).hit, 'NEG_EN 承重');
});

// ─── 分工边界锁：单腿不判 / 无预算约束的价值论证不判 ──────────────
t('只有预算约束（无价值否定）不判', () => {
  assert.ok(!checkBudgetValueConflation('预算不够，今年先不做，排队等资源。').hit, '缺腿②不判');
});
t('只有价值否定（无预算约束）不判', () => {
  assert.ok(!checkBudgetValueConflation('这个功能使用率低，不值得投入。').hit, '缺腿①不判');
});
t('预算与价值同句但无推断连接不判', () => {
  assert.ok(!checkBudgetValueConflation('预算有限，这个方案的价值也有限，两者都记录在案。').hit, '缺推断连接不判');
});
t('疑问句豁免（真·无标记疑问）', () => {
  assert.ok(!checkBudgetValueConflation('他们真的预算不够吗？这件事还值得做吗？').hit, '真询问句豁免');
});

console.log('\nr219 budget_value_conflation: ' + pass + ' passed / ' + fail + ' failed');
// 清理：本测试不做任何文件系统/模块状态变异（注入全部经参数作用域
// 传递），无残留状态需要还原；以退出码上报结果。
process.exit(fail > 0 ? 1 : 0);
