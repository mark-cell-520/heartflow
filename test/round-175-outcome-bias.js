/**
 * test/round-175-outcome-bias.js — 第 173 维度 outcome_bias
 * （结果偏误 / outcome bias / 结局偏见）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入空数组后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（三腿俱在但被
 *      正确豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * r175 实现教训（两条，均已在本文件与源码固化）：
 *   · EVAL 腿必须收「是对的/是错的」与裸「独到」词形——「市场定位判断
 *     是对的」整句因只收「正确/没错」而漏判；「眼光向来独到」这类带
 *     插入语的形式因只收连续「眼光独到」而漏判（改为裸名词形态收录）；
 *   · DECISION 腿必须收 tactics/tactic 与「思路/想法/做法」——「coach's
 *     tactics were brilliant」「答题思路非常聪明」整族因词表缺形而漏判。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkOutcomeBias } = require('../src/outcome-bias.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
// 每条标注其依赖的结果事件、决策名词、评价词与连接词形。
const ATTACK_ZH = [
  '他这次赌对了，说明当初的选择是明智的。',                           // [0] 赌对 × 选择 × 明智 × 说明
  '手术成功了，足以证明医生的方案是正确的。',                         // [1] 手术成功 × 方案 × 正确 × 足以证明
  '球队夺冠了，可见主教练的战术安排英明果断。',                       // [2] 夺冠 × 战术 × 英明 × 可见
  '这只股票翻了三倍，证明他当初的买入决定眼光独到。',                 // [3] 翻了三倍 × 买入/决定 × 眼光独到 × 证明
  '他亏得血本无归，可见当初的投资决策非常愚蠢。',                     // [4] 血本无归 × 投资决策 × 愚蠢 × 可见
  '新产品卖爆了，这说明当初的市场定位判断是对的。',                   // [5] 卖爆 × 判断 × 是对的 × 说明
  '这个决策的英明已经被结果证明了——他毕竟赌对了。',                 // [6] 倒装（结论先行）：英明 × 决策 × 毕竟 × 赌对
  '经过三个月的观察，这位投资者在这只股票上获利超过两倍，复盘时他反复强调这完全归功于自己当初精准的买入判断，足以证明他的决策眼光向来独到。', // [7] 长句：获利 × 归功于/足以证明 × 买入判断 × 独到
  '他考前猜对了大题，所以大家都说他的复习策略高明。',                 // [8] 猜对 × 策略 × 高明 × 所以
  '他蒙对了答案，可见答题思路非常聪明。',                             // [9] 蒙对 × 思路 × 聪明 × 可见
  '这次他赌赢了一大笔钱，因此朋友们都说他下注的思路非常高明。',       // [10] 赌赢了 × 下注/思路 × 高明 × 因此
  '公司转型后销售额翻倍了，这说明当初的转型决策是对的。',             // [11] 翻倍 × 转型/决策 × 是对的 × 说明
];
const ATTACK_EN = [
  'The bet paid off, which proves his decision was wise.',                        // [E0] paid off × decision × wise × proves
  'She lost everything, showing that her choice was clearly reckless.',           // [E1] lost everything × choice × reckless × showing
  "The team won the championship, which shows the coach's tactics were brilliant.", // [E2] won × tactics × brilliant × shows
  'He hit the jackpot last week, which confirms his gambling strategy was sound.', // [E3] jackpot × strategy × sound × confirms
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '复盘要看决策当时的信息质量，不能只凭结果论对错。',       // ex-ante 正确评价
  '虽然失败了，但在当时的信息条件下这个决定是合理的。',     // ex-ante 正确评价
  '他成功了，但这不能说明决策正确，只是运气好。',           // 推理否定 + 运气承认
  '这个方案当时论证充分，我们按流程执行了。',               // 无结果事件腿
  '他赌对了纯属运气，和决策质量没什么关系。',               // 运气承认（且无评价词腿）
  '战争是多因共同造成的，不能简单归因于某一个决策。',       // 边缘良性：正确多因陈述
  '这家公司盈利了，我们正在分析是哪些因素带来的。',         // 有结果无评价归因
  '比赛赢了大家都很开心，晚上一起吃个饭。',                 // 无决策×评价腿
  '他去年投资赚了些钱，今年市场波动很大。',                 // 无连接词×评价腿
  '结果偏误是指用结果评判决策质量的认知偏差，心理学教材里有专门讨论。', // 概念/教学转述
  '实验成功了，说明这个方法在随机对照试验下是有效的。',     // 实验证据语境
  '他赌对了？这能说明他眼光好吗？',                         // 疑问句
  '这个决定是否明智，要看当时掌握了哪些信息。',             // ex-ante 提问（问号双豁免）
  'She won the lottery, but that was pure chance, not skill.',   // EN 运气承认
  'The project succeeded, and the team celebrated the milestone.', // EN 无评价归因
];

t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    assert.strictEqual(checkOutcomeBias(s).hit, true, '未命中: ' + s.slice(0, 24));
  }
});

t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkOutcomeBias(s).hit, false, '误判: ' + s.slice(0, 24));
  }
});

// ─── 负例注入承重：腿① OUTCOME ───────────────────────────────────
t('注入空 OUTCOME_ZH 后中文攻击停火', () => {
  const inj = { OUTCOME_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkOutcomeBias(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 OUTCOME_EN 后英文攻击停火', () => {
  const inj = { OUTCOME_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkOutcomeBias(s, inj).hit, false, s.slice(0, 24));
});

// ─── 负例注入承重：腿② DECISION × EVAL ───────────────────────────
t('注入空 DECISION_ZH 后中文攻击停火', () => {
  const inj = { DECISION_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkOutcomeBias(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 DECISION_EN 后英文攻击停火', () => {
  const inj = { DECISION_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkOutcomeBias(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 EVAL_ZH 后中文攻击停火', () => {
  const inj = { EVAL_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkOutcomeBias(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 EVAL_EN 后英文攻击停火', () => {
  const inj = { EVAL_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkOutcomeBias(s, inj).hit, false, s.slice(0, 24));
});

// ─── 负例注入承重：腿③ LINK ──────────────────────────────────────
t('注入空 LINK_ZH 后中文攻击停火', () => {
  const inj = { LINK_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkOutcomeBias(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 LINK_EN 后英文攻击停火', () => {
  const inj = { LINK_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkOutcomeBias(s, inj).hit, false, s.slice(0, 24));
});

// ─── 豁免陷阱翻转（三腿俱在但被正确豁免；抹掉豁免必须转为命中）─────
const TRAP_META_ZH = '课堂上老师讲，结果偏误的典型例子就是：他这次赌对了，说明当初的选择是明智的。';
const TRAP_META_EN = 'The textbook describes outcome bias like this: the bet paid off, which proves his decision was wise.';
const TRAP_EVID_ZH = '有随机对照试验支持的说法是，他这次赌对了，说明当初的选择是明智的。';
const TRAP_EVID_EN = 'In the randomized controlled trial, the bet paid off, which proves his decision was wise.';
const TRAP_NEG_ZH = '他这次赌对了，但这不能说明当初的选择是明智的。';
const TRAP_NEG_EN = 'The bet paid off, but that does not prove his decision was wise.';
const TRAP_HEDGE_ZH = '他这次赌对了，可能说明当初的选择是明智的。';
const TRAP_HEDGE_EN = 'The bet paid off, which perhaps proves his decision was wise.';

t('八条陷阱无注入时放行', () => {
  for (const s of [TRAP_META_ZH, TRAP_META_EN, TRAP_EVID_ZH, TRAP_EVID_EN,
                   TRAP_NEG_ZH, TRAP_NEG_EN, TRAP_HEDGE_ZH, TRAP_HEDGE_EN]) {
    assert.strictEqual(checkOutcomeBias(s).hit, false, '未被豁免: ' + s.slice(0, 24));
  }
});
t('抹掉 EXEMPT_META_ZH 后概念教学陷阱转为命中', () => {
  assert.strictEqual(checkOutcomeBias(TRAP_META_ZH, { EXEMPT_META_ZH: [] }).hit, true);
});
t('抹掉 EXEMPT_META_EN 后概念教学陷阱转为命中', () => {
  assert.strictEqual(checkOutcomeBias(TRAP_META_EN, { EXEMPT_META_EN: [] }).hit, true);
});
t('抹掉 EXEMPT_EVID_ZH 后实验证据陷阱转为命中', () => {
  assert.strictEqual(checkOutcomeBias(TRAP_EVID_ZH, { EXEMPT_EVID_ZH: [] }).hit, true);
});
t('抹掉 EXEMPT_EVID_EN 后实验证据陷阱转为命中', () => {
  assert.strictEqual(checkOutcomeBias(TRAP_EVID_EN, { EXEMPT_EVID_EN: [] }).hit, true);
});
t('抹掉 EXEMPT_NEG_ZH 后推理否定陷阱转为命中', () => {
  assert.strictEqual(checkOutcomeBias(TRAP_NEG_ZH, { EXEMPT_NEG_ZH: [] }).hit, true);
});
t('抹掉 EXEMPT_NEG_EN 后推理否定陷阱转为命中', () => {
  assert.strictEqual(checkOutcomeBias(TRAP_NEG_EN, { EXEMPT_NEG_EN: [] }).hit, true);
});
t('抹掉 EXEMPT_HEDGE_ZH 后对冲陷阱转为命中', () => {
  assert.strictEqual(checkOutcomeBias(TRAP_HEDGE_ZH, { EXEMPT_HEDGE_ZH: [] }).hit, true);
});
t('抹掉 EXEMPT_HEDGE_EN 后对冲陷阱转为命中', () => {
  assert.strictEqual(checkOutcomeBias(TRAP_HEDGE_EN, { EXEMPT_HEDGE_EN: [] }).hit, true);
});
t('疑问句豁免承重：含问号的攻击形放行、摘掉问号即命中', () => {
  const q = '他这次赌对了，说明当初的选择是明智的吗？';
  assert.strictEqual(checkOutcomeBias(q).hit, false);
  assert.strictEqual(checkOutcomeBias(q.replace('吗？', '。')).hit, true);
});

// ─── 161 轮强制项：gate 层变体矩阵（真实 gate() 复量）──────────────
const MATRIX_ATTACK = [
  '他这次赌对了，说明当初的选择是明智的。',                   // 中文裸名词
  '手术成功了，足以证明医生的方案是正确的。',                 // 中文带修饰
  '这个决策的英明已经被结果证明了——他毕竟赌对了。',         // 中文倒装（结论先行）
  '经过三个月的观察，这位投资者在这只股票上获利超过两倍，复盘时他反复强调这完全归功于自己当初精准的买入判断，足以证明他的决策眼光向来独到。', // 中文长句
  '他蒙对了答案，可见答题思路非常聪明。',                     // 中文短句
  "The team won the championship, which shows the coach's tactics were brilliant.", // 英文
  'She lost everything, showing that her choice was clearly reckless.',           // 英文
];
const MATRIX_BENIGN = [
  '战争是多因共同造成的，不能简单归因于某一个决策。',           // 边缘良性：正确多因陈述
  '复盘要看决策当时的信息质量，不能只凭结果论对错。',           // ex-ante 正确评价
  '虽然失败了，但在当时的信息条件下这个决定是合理的。',         // ex-ante 正确评价
  '他成功了，但这不能说明决策正确，只是运气好。',               // 推理否定 + 运气承认
  'She won the lottery, but that was pure chance, not skill.',   // EN 运气承认
  '结果偏误是指用结果评判决策质量的认知偏差，教材里有讨论。',   // 概念/教学转述
  '实验成功了，说明这个方法在随机对照试验下是有效的。',         // 实验证据语境
];

t('变体矩阵：全部攻击 gate.action 非 pass 且 findings 含 outcome_bias', () => {
  for (const s of MATRIX_ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '穿过闸门: ' + s.slice(0, 24));
    assert.ok((r.findings || []).some(f => f.dimension === 'outcome_bias'), '无 outcome_bias finding: ' + s.slice(0, 24));
  }
});
t('变体矩阵：全部良性 gate.action = pass 且零 outcome_bias 命中', () => {
  for (const s of MATRIX_BENIGN) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass', '被拦: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    assert.ok(!(r.findings || []).some(f => f.dimension === 'outcome_bias'), '误判: ' + s.slice(0, 24));
  }
});

// ─── 登记断言（接线完整性）────────────────────────────────────────
t('dimensions 键含 outcome_bias', () => {
  const idx = require('../src/index.js');
  const d = idx.discriminate(ATTACK_ZH[0]);
  assert.ok(d.dimensions && d.dimensions.outcome_bias, 'dimensions 缺 outcome_bias 键');
  assert.strictEqual(d.dimensions.outcome_bias.hit, true);
});
t('dimMap 命中可进 findings（allDims 已接）', () => {
  const r = gate(ATTACK_ZH[0]);
  assert.ok((r.findings || []).some(f => f.dimension === 'outcome_bias'), 'findings 为空——allDims 未接');
});
t('summary 含结果偏误命中行', () => {
  const r = gate(ATTACK_ZH[0]);
  assert.ok(JSON.stringify(r.summary || '').indexOf('结果偏误') >= 0, 'summary 无命中行');
});

console.log('\nround-175 outcome_bias: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
