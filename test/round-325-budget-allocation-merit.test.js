'use strict';
/**
 * test/round-325-budget-allocation-merit.test.js — 维度 219 budget_value_conflation
 * 『预算约束≠价值』现代资金/预算话语域新措辞家族（真升级②，撞号重编号 r324→r325）。
 *
 * 承重对象：src/budget-value-conflation.js 的 r324 平行常量 BUDGET_*4 /
 * WORTH_*4 / GEN_ZH4 / GEN_EN4 / RHET_ZH4 / RHET_EN4 / REV_ZH4 / REV_EN4
 * 及其在 findBudgetLeg/findChainLeg/findGenLeg/findRhetLeg/findRevLeg 的
 * concat 接线。
 *
 * 家族：存量腿只收第一人称「买不起/预算不够」可负担性约束；本家族收
 * 「投入/分配/报酬金额小」第三方分配信号（批得少/月薪低/占比低/没人投
 * 钱 × 不重要/不当回事/不重视/没什么技术含量/not very important）。
 * 同一混淆内核（用钱给事物的重要性定罪），触发词是分配额而非「买不起」。
 *
 * 立项证据：scripts/round-324/probe-candidates.js 现代域攻击 9/9 穿透、
 * 良性 0 误伤；官方良性语料 378 零误命中；海外扫描空返（arXiv parse-fail /
 * GitHub 0 / S2 限流），按既有形态自建。
 *
 * 追责口径：逐常量注入（数组→[] / 单正则→永假），断言守卫变红；并锁
 * 「存量注入语义不变」——注入新族常量不影响存量族攻击（平行常量）。
 * 运行：node test/round-324-budget-allocation-merit.test.js
 */
const assert = require('assert');
const { checkBudgetValueConflation, __internals } = require('../src/budget-value-conflation.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const hit = (s, inj) => checkBudgetValueConflation(s, inj).hit;

// ─── 攻击样本（新家族：F-1 推断链 / F-2 泛化 / F-3 反问 / F-4 反向归因）──
const ATTACK = [
  // F-1 推断链形（中文）
  '这个项目预算才批了二十万，说明它本来就不重要，不用太上心。',
  '拨给它的经费这么少，可见领导根本没把这件事当回事。',
  '研发预算占比这么低，足以说明公司不重视创新。',
  '这个岗位只给了八千月薪，说明这活本身也没什么技术含量。',
  '免费开源的东西没人愿意投钱，恰恰说明它没什么价值。',
  '项目经费才拨了五万，可见领导根本不重视这个方向。',
  '公司只发三千工资，说明这岗位没什么含金量。',
  // F-1 推断链形（英文）
  "The budget for this is tiny, so it clearly is not very important.",
  'They only allocated a small grant, which shows the research is not worth much.',
  'The salary is low, so the work itself must not require much skill.',
  'A tiny budget means the initiative is not very significant.',
  'Nobody funds it, so it must not be very valuable.',
  // F-2 泛化形
  '月薪低的活都没技术含量。',
  'Poorly-paid work never really matters.',
  // F-3 反问形（带反问标记，豁免不生效）
  '预算批得这么少，这能算什么重要的事？',
  'The budget is tiny, so how important can this really be?',
  // F-4 反向归因形
  '这活没什么技术含量，毕竟经费这么少。',
  'The role needs no real skill, because the budget is tiny.',
];

// ─── 良性样本（边缘良性：单腿 / 双重否定 / 反向因果 / 价格型成本收益 / 正确响应）──
const BENIGN = [
  // 只有分配金额小、无价值否定（正当资源决策）
  '预算才批了二十万，先紧着核心业务做。',
  '月薪低，先攒钱别乱花，等年终奖。',
  // 双重否定守卫（"不能不重视/不能不把…当回事" = 必须重视）
  '预算才批了三十万，但不能不重视安全投入。',
  '预算少，但不能不把质量当回事。',
  // 反向因果（市场定价解释，非预算→价值断言；且无"没什么X"价值否定腿）
  '工资低是因为行业门槛低，这是市场定价。',
  // 只有价值否定、无分配金额腿（正常成本收益论证）
  '这个功能使用率低，不值得投入。',
  // 正确响应形（指出预算与价值是两个问题）
  '免费开源也能创造巨大价值，不能因为没人付费就否定它。',
  '预算不足是资源约束，不等于价值判断。',
  'A small budget does not mean low value; importance is separate from funding.',
  // 真·无标记疑问（豁免）
  '他们真的只给了这么点预算吗？这件事还值得做吗？',
];

t('攻击样本全部命中（checkBudgetValueConflation）', () => {
  for (const s of ATTACK) assert.ok(hit(s), '应命中: ' + s.slice(0, 30));
});
t('良性样本全部放行（checkBudgetValueConflation）', () => {
  for (const s of BENIGN) assert.ok(!hit(s), '应放行: ' + s.slice(0, 30));
});

// ─── internals 暴露新族常量 ──────────────────────────────────────────
t('internals 暴露 r324 新族常量', () => {
  const I = __internals();
  for (const k of ['BUDGET_ZH4','WORTH_ZH4','GEN_ZH4','RHET_ZH4','REV_ZH4',
                   'BUDGET_EN4','WORTH_EN4','GEN_EN4','RHET_EN4','REV_EN4']) {
    assert.ok(I[k] !== undefined, 'internals 应暴露 ' + k);
  }
});

// ─── 负例注入承重（逐常量删条，断言守卫变红）────────────────────────
const NEVER = /(?!x)x/;
const zhChain = '这个项目预算才批了二十万，说明它本来就不重要，不用太上心。';
const enChain = 'The budget for this is tiny, so it clearly is not very important.';
const zhWorth = '项目预算才批了三十万，说明这活没什么技术含量。';
const enWorth = 'The budget for this is tiny, so it is not very important.';
const zhGen = '月薪低的活都没技术含量。';
const enGen = 'Poorly-paid work never really matters.';
const zhRhet = '预算批得这么少，这能算什么重要的事？';
const enRhet = 'The budget is tiny, so how important can this really be?';
const zhRev = '这活没什么技术含量，毕竟经费这么少。';
const enRev = 'The role needs no real skill, because the budget is tiny.';
// 存量族攻击（用于证明新族注入不影响存量）
const zhBaseAtk = '我们预算不够，所以这件事本来就不值得做。';
const enBaseAtk = "We can't afford it, so it's clearly not worth doing.";

t('注入基准：新族攻击命中 / 良性放行（无注入态）', () => {
  for (const s of [zhChain, enChain, zhWorth, enWorth, zhGen, enGen, zhRhet, enRhet, zhRev, enRev]) {
    assert.ok(hit(s), '无注入应命中: ' + s.slice(0, 24));
  }
});
t('注入 BUDGET_ZH4=[] → 中文推断链攻击停止命中（腿①新族承重）', () => {
  assert.ok(!hit(zhChain, { BUDGET_ZH4: [] }), 'BUDGET_ZH4 承重');
});
t('注入 BUDGET_EN4=[] → 英文推断链攻击停止命中（腿①新族承重）', () => {
  assert.ok(!hit(enChain, { BUDGET_EN4: [] }), 'BUDGET_EN4 承重');
});
t('注入 WORTH_ZH4=[] → 中文技术含量攻击停止命中（腿②新族承重）', () => {
  assert.ok(!hit(zhWorth, { WORTH_ZH4: [] }), 'WORTH_ZH4 承重');
});
t('注入 WORTH_EN4=[] → 英文 not very important 攻击停止命中（腿②新族承重）', () => {
  assert.ok(!hit(enWorth, { WORTH_EN4: [] }), 'WORTH_EN4 承重');
});
t('注入 GEN_ZH4=永假 → 中文泛化形攻击停止命中（F-2 新族承重）', () => {
  assert.ok(!hit(zhGen, { GEN_ZH4: NEVER }), 'GEN_ZH4 承重');
});
t('注入 GEN_EN4=永假 → 英文泛化形攻击停止命中（F-2 新族承重）', () => {
  assert.ok(!hit(enGen, { GEN_EN4: NEVER }), 'GEN_EN4 承重');
});
t('注入 RHET_ZH4=永假 → 中文反问形攻击停止命中（F-3 新族承重）', () => {
  assert.ok(!hit(zhRhet, { RHET_ZH4: NEVER }), 'RHET_ZH4 承重');
});
t('注入 RHET_EN4=永假 → 英文反问形攻击停止命中（F-3 新族承重）', () => {
  assert.ok(!hit(enRhet, { RHET_EN4: NEVER }), 'RHET_EN4 承重');
});
t('注入 REV_ZH4=永假 → 中文反向归因攻击停止命中（F-4 新族承重）', () => {
  assert.ok(!hit(zhRev, { REV_ZH4: NEVER }), 'REV_ZH4 承重');
});
t('注入 REV_EN4=永假 → 英文反向归因攻击停止命中（F-4 新族承重）', () => {
  assert.ok(!hit(enRev, { REV_EN4: NEVER }), 'REV_EN4 承重');
});

// ─── 存量注入语义不变（平行常量：注入新族不影响存量族）──────────────
t('平行锁：注入 BUDGET_ZH4=[] 不影响存量中文推断链攻击', () => {
  assert.ok(hit(zhBaseAtk, { BUDGET_ZH4: [] }), '存量族不应被新族注入波及');
});
t('平行锁：注入 WORTH_ZH4=[] 不影响存量中文推断链攻击', () => {
  assert.ok(hit(zhBaseAtk, { WORTH_ZH4: [] }), '存量族不应被新族注入波及');
});
t('平行锁：注入 BUDGET_EN4=[] 不影响存量英文推断链攻击', () => {
  assert.ok(hit(enBaseAtk, { BUDGET_EN4: [] }), '存量族不应被新族注入波及');
});
t('平行锁：注入 BUDGET_ZH=[] 只关存量腿，新族锚点独立仍在', () => {
  // 存量腿①整腿禁用：存量攻击「预算不够」停
  assert.ok(!hit(zhBaseAtk, { BUDGET_ZH: [] }), '存量预算腿被 BUDGET_ZH=[] 禁用');
  // 新族是平行常量：其锚点「预算才批了」在 BUDGET_ZH4，不受 BUDGET_ZH=[] 影响
  assert.ok(hit(zhChain, { BUDGET_ZH: [] }), '新族锚点独立于存量 BUDGET_ZH，仍命中');
});

// ─── 边界锁 ────────────────────────────────────────────────────────
t('单腿不判：只有分配金额小、无价值否定', () => {
  assert.ok(!hit('预算才批了二十万，先紧着核心业务做。'), '缺腿②不判');
});
t('双重否定守卫：「不能不重视」必须重视，不判', () => {
  assert.ok(!hit('预算才批了三十万，但不能不重视安全投入。'), '双重否定不判');
});
t('反向因果（无价值否定腿）不判', () => {
  assert.ok(!hit('工资低是因为行业门槛低，这是市场定价。'), '反向因果不判');
});

console.log('\nr325 budget_allocation_merit: ' + pass + ' passed / ' + fail + ' failed');
// 清理：本测试不做任何文件系统/模块状态变异（注入全部经参数作用域传递）。
process.exit(fail > 0 ? 1 : 0);
