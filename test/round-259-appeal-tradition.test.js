/**
 * test/round-259-appeal-tradition.test.js
 *
 * [r259] 第 61 维度 appeal_to_tradition（诉诸传统）**既有维度全新措辞家族扩展**
 * ——真升级类型②。模块 src/appeal-tradition.js 已在 src/index.js 接线
 * （require + 计算点 + allDims/dimMap/dimensions/VERIFY_DIMS/summary/
 * DIM_GUIDANCE/module.exports），故扩展 **live 生效**，维度计数 214 不变，
 * src/index.js 零改动。
 *
 * 立项依据（4 号探针 coordination/agent4/probes/r259-probe-round1.js，
 * 直调 src/gate.js 全量 findings 口径）：
 *   37 条新措辞攻击样本穿透 **37/37**（gate.action === 'pass'），
 *   appeal_to_tradition 自身只捕获 2 条。穿透样本全部落在两条腿的措辞
 *   射程外——不是判据结构问题，是词表问题。
 *
 * 补入的三组全新措辞家族（逐支可注入，负例逐支删除验证承重）：
 *   · 腿①传统在场新族 ZH 9 支 / EN 9 支
 *   · 腿②压制改变/异议新族 ZH 9 支 / EN 10 支
 *   · 腿③质量担保/正当性结论新族 ZH 7 支 / EN 7 支
 *     （「老祖宗传下来的秘方，治这个病最管用」这类传统在场×优越结论
 *       此前整族射程外——旧判据只有「压制改变」一条出口）
 *   · concessive-debate 豁免（HEDGE）：让步标记 × 评估/数据标记同时在场，
 *     或证据在场替代通路（data/evidence 可核查断言）
 *   · 句级共现（两腿落在同一句内，`;`／`；` 不算句界）+ 防自证守卫
 *
 * 基准规模：攻击 44 条（ZH 17 + EN 27）、良性/边界 12 条、让步豁免 4 条、
 * 单腿边界 9 条、存量旧路由 3 条、豁免承重 2 条、gate 层 44 + 5 条、
 * 接线 7 处、负例注入 51 支。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const att = require(path.join(HF, 'src/appeal-tradition.js'));
const { checkAppealToTradition, __internals } = att;

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
function assertHit(t, r) { assert(r && r.hit, '未命中: ' + t + ' detail=' + (r && r.detail)); }
function assertMiss(t, r) { assert(!(r && r.hit), '误伤: ' + t + ' detail=' + (r && r.detail)); }

// ═══════════════════════════════════════════════════════════════════
// A. 单维层：新措辞攻击全命中（逐条注明腿①×腿②/腿③ 分支）
// ═══════════════════════════════════════════════════════════════════

const ATTACK_ZH = [
  '祖上传下来的秘方，治这个病最管用。',                 // 腿①t1秘方 × 腿③c6最管用
  '这是百年老字号的古法工艺，肯定靠谱。',               // 腿①t2老字号/t3古法 × 腿③c1肯定靠谱
  '老辈人说过，人饿了就得吃这个，自然有它的道理。',     // 腿①t7老辈人 × 腿③c2自然有它的道理
  '祖宗定下的规矩，由不得你改。',                       // 腿①t4祖宗 × 腿②s5由不得你改
  '古圣先贤早就把道理说透了，照做就行。',               // 腿①t5古圣先贤 × 腿③c4照做就行
  '土办法虽然上不了台面，但几代人验证过。',             // 腿①t1土办法 × 腿③c5几代人验证
  '家风祖训历来如此，不能到我这里变了。',               // 腿①t4家风/祖训 × 腿②s9不能…变了
  '旧俗如此，由不得你质疑。',                           // 腿①t6旧俗 × 腿②s5由不得你质疑
  '咱们村几百年来都这么过，轮不到你质疑。',             // 腿①存量几百年 × 腿②s1轮不到你质疑
  '这个配方是清宫里传出来的，能有问题吗。',             // 腿①t8清宫 × 腿③c7能有问题吗
  '古法炮制的中药，比机器加工的强。',                   // 腿①t3古法 × 腿③c3比X强
  '祖上的规矩碰不得。',                                 // 腿①t4祖上 × 腿②s2碰不得
  '老规矩立了多少年，这个先例不能开。',                 // 腿①存量老规矩 × 腿②s3先例不能开
  '老传统一切维持现状就好。',                           // 腿①存量传统 × 腿②s4维持现状
  '这事由老师傅定夺，新来的少插嘴。',                   // 腿①t9老师傅 × 腿②s5少插嘴
  '几百年的传统，你说改就改？',                         // 腿①存量几百年/传统 × 腿②s7说改就改
  '先人的法度不容置喙，执行便是。',                     // 腿①t4先人的法度 × 腿②s8不容置喙
];

const ATTACK_EN = [
  'This is a time-tested remedy that our ancestors used for generations.',        // 腿①e1/e3 × 腿③c7 used for generations
  'It is a century-old recipe handed down through the family, so do not change it.', // 腿①存量century-old/e2 × 腿②e10 do not change
  'The old ways worked fine for my grandfather, so they are fine for me.',        // 腿①e4 × 腿③c3/c6
  'It is a tried-and-true method, proven over the centuries.',                    // 腿①e1 × 腿③c2 proven over the centuries
  'The status quo has served us well, so do not rock the boat.',                  // 腿①e5 × 腿②e1 rock the boat
  'It is our heritage — an ancestral practice nobody should touch.',              // 腿①e3 × 腿②e7 nobody should touch
  'If it was good enough for my grandfather, it is good enough for me.',          // 腿①e8 × 腿③c4 good enough for me
  'Old-school craftsmanship beats anything modern.',                              // 腿①e4 × 腿③c1 beats anything modern
  'It is folk wisdom passed down from time immemorial, so it must be right.',     // 腿①e4/e2 × 腿③c5 must be right
  'This remedy was handed down in my family, so do not change it.',               // 腿①e2 × 腿②e10
  'This established order has served us well.',                                   // 腿①e6 × 存量腿②served us well
  'In the good old days we did it this way, so do not change it.',                // 腿①e7 × 腿②e10
  'Nobody should deviate from the way they did it.',                              // 腿①e9 × 腿②e6 deviate
  'Keep the status quo — that is our heritage.',                                  // 腿①e5/e3 × 腿②e2 keep the status quo
  'Do not fix what is not broken — it is a time-honored practice.',               // 腿①e1 × 腿②e3 don't fix
  'Leave well enough alone — the old way has served us well.',                    // 腿①存量the old way × 腿②e4
  'We should hold the line and preserve our long-standing customs.',              // 腿①存量long-standing × 腿②e5/e9
  'Leave well enough alone — the old way is not for us to change.',               // 腿①存量the old way × 腿②e4/e7
  'That is not for us to change — it is our heritage.',                           // 腿①e3 × 腿②e7
  'This ancient custom is sacred and untouchable.',                               // 腿①存量custom × 腿②e8 sacred
  'Keep the faith — our customs are long-standing.',                              // 腿①存量customs × 腿②e9 keep the faith
  'We must not rock the boat on a century-old tradition.',                        // 腿①存量tradition × 腿②e1
  'This tradition is sacred and must not be tampered with.',                      // 腿①存量tradition × 腿②e8 + 存量tampered with
  'Do not fix what is not broken — keep the status quo.',                         // 腿①e5 × 腿②e3/e2
  'This is a century-old recipe, so do not change it.',                           // 腿①存量century-old × 腿②e10
  'It is untouchable — a time-honored practice you cannot question.',             // 腿①e1 × 腿②e8
  'The old ways worked fine for my grandfather.',                                 // 腿①e4 × 腿③c3 worked fine for
];

test('A1 中文新措辞攻击 17 条单维全命中（腿①新族×腿②/腿③新族）', () => {
  for (const t of ATTACK_ZH) assertHit(t, checkAppealToTradition(t));
});

test('A2 英文新措辞攻击 27 条单维全命中（中英分支对照）', () => {
  for (const t of ATTACK_EN) assertHit(t, checkAppealToTradition(t));
});

// ═══════════════════════════════════════════════════════════════════
// B. 良性族：让步争议在场 / 描述性传统 / 单腿 / 无关句全放行
// ═══════════════════════════════════════════════════════════════════

test('B1 让步/争议在场 4 条全放行（concessive-debate 豁免）', () => {
  const benign = [
    // 让步「不过」× 评估「评估」——在呈现争论，不是在压制改变。
    // 刻意选用**压制腿只由新族承重**的样本：旧路由（全文共现、无豁免层）
    // 口径不变，HEDGE 只作用于新路由。
    '旧俗如此，由不得你质疑，不过我们要先评估影响。',
    // 让步 that said × data/revisit——注意本句含 `;`，句级切分不拆它
    'The status quo has served us well; that said, the new data suggests we revisit it.',
    // 让步「但」× 数据
    '老字号的做法一直没变，但检测数据显示需要调整工艺。',
    // 让步 however × evidence
    'This is a long-standing tradition; however, the evidence says we should change it.',
  ];
  for (const t of benign) assertMiss(t, checkAppealToTradition(t));
});

test('B2 描述性/保留语良性 12 条全放行（传统在场但无压制/担保结论）', () => {
  const benign = [
    '这个流程沿用十年了，但最近的数据显示它已经不适配新业务，我建议评估替代方案。',
    '传统做法有历史合理性，我们需要分别评估它的适用条件。',
    '古法炮制有传承价值，不过效率和卫生指标需要另行评估。',
    '祖宗定下的规矩有历史背景，其中不合时宜的部分应当改。',
    'We have always done it this way, but the data suggests we should reconsider.',
    'This recipe is centuries old, but we still need modern clinical trials.',
    'Time-tested methods deserve respect, not immunity from testing.',
    '祖上传下来的秘方我们已经做了成分检测，论文发表在药理期刊上。',
    'Appeal to tradition is a common fallacy — let us check the evidence.',
    '传统戏曲就是这样演的，观众爱看。',                 // 纯描述，无压制/担保腿（边界锁）
    '如何用 root 权限运行 Docker？',
    '这份年报显示公司营收增长了 12%',
  ];
  for (const t of benign) assertMiss(t, checkAppealToTradition(t));
});

// ═── C. 单腿边界：只有一条腿不判（锁保守边界，防未来放宽） ───────
test('C1 单腿样本 9 条全部不命中（缺一不判）', () => {
  const single = [
    '原生态旅游成为新热点',              // 腿①在场，无腿②/腿③
    '这家是百年老店',                    // 腿①t2，无压制/担保
    '深山里的空气真好',                  // 腿①在场，无腿②/腿③
    '这个方案肯定靠谱',                  // 腿③c1，无腿①
    '一切维持现状就好',                  // 腿②s4，无腿①
    '少插嘴，听我说',                    // 腿②s5，无腿①
    'It is our heritage.',               // 腿①e3，无腿②/腿③
    'Do not rock the boat.',             // 腿②e1，无腿①
    'This must be right.',               // 腿③c5，无腿①
  ];
  for (const t of single) assertMiss(t, checkAppealToTradition(t));
});

// ═── D. 相邻维度分工边界 ─────────────────────────────────────────
test('D1 与既有维度/存量判据分工边界', () => {
  // 存量（v6.8.2 原有）双腿样本仍命中——旧路由全文共现口径不变。
  // 这四条逐条实测确认走**旧路由**（新表全杀后仍命中，见 H3）。
  const legacy = [
    '别人家也都这样，怎么就你特殊。',                          // T3 从众施压族
    '这家业是一代代传下来的，绝不能改到我这里断了。',          // 旧腿①传下来的 × 旧腿②绝不能改
    'This tradition is sacred and must not be tampered with.', // 旧腿①tradition × 旧腿②tampered with
  ];
  for (const t of legacy) assertHit(t, checkAppealToTradition(t));
  // 与诉诸自然（appeal_to_nature）同句不同族：自然性断言×优越结论归它，
  // 传统压制腿不成立时本维度不命中
  assertMiss('天然的东西总比人工合成的好。', checkAppealToTradition('天然的东西总比人工合成的好。'));
  // 存量良性：兼容性引用历史
  assertMiss('公司沿用旧命名规范只为兼容历史代码', checkAppealToTradition('公司沿用旧命名规范只为兼容历史代码'));
});

// ═── E. 豁免承重样本（摘掉豁免就必须命中——证明豁免不是装饰） ────
test('E1 concessive-debate 豁免承重：杀 HEDGE 后让步样本必须命中', () => {
  const I = __internals();
  const NEVER = '__negtest_never__';
  const zh = '旧俗如此，由不得你质疑，不过我们要先评估影响。';
  const en = 'The status quo has served us well; that said, the new data suggests we revisit it.';
  assertMiss(zh, checkAppealToTradition(zh));
  assertMiss(en, checkAppealToTradition(en));
  const killedZh = checkAppealToTradition(zh, {
    HEDGE_CONCESSION_ZH: new RegExp(NEVER), HEDGE_EVAL_ZH: new RegExp(NEVER),
    HEDGE_CONCESSION_EN: new RegExp(NEVER), HEDGE_EVAL_EN: new RegExp(NEVER),
  });
  assertHit(zh, killedZh);
  const killedEn = checkAppealToTradition(en, {
    HEDGE_CONCESSION_ZH: new RegExp(NEVER), HEDGE_EVAL_ZH: new RegExp(NEVER),
    HEDGE_CONCESSION_EN: new RegExp(NEVER), HEDGE_EVAL_EN: new RegExp(NEVER),
  });
  assertHit(en, killedEn);
  // 四张表必须真的存在（防常量被误删后注入空转）
  assert(I.HEDGE_CONCESSION_ZH instanceof RegExp && I.HEDGE_EVAL_ZH instanceof RegExp, 'ZH HEDGE 常量缺失');
  assert(I.HEDGE_CONCESSION_EN instanceof RegExp && I.HEDGE_EVAL_EN instanceof RegExp, 'EN HEDGE 常量缺失');
});

// ═── F. gate 层端到端 ───────────────────────────────────────────
test('F1 攻击 44 条 gate 层全部非 pass', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action && g.gate.action !== 'pass',
      'gate 层放行: ' + t + ' action=' + (g.gate && g.gate.action));
  }
});

test('F2 最易误伤良性 5 条 gate 层 pass（锁死）', () => {
  const benign = [
    '旧俗如此，由不得你质疑，不过我们要先评估影响。',
    'We compared the century-old recipe with the modern one.',
    '传统戏曲就是这样演的，观众爱看。',
    'Time-tested methods deserve respect, not immunity from testing.',
    'Old-school craftsmanship requires years of apprenticeship.',
  ];
  for (const t of benign) {
    const g = gate.gate(t);
    assertEqual(g.gate && g.gate.action, 'pass', '良性应 pass: ' + t + ' action=' + (g.gate && g.gate.action));
  }
});

test('F2b 证据在场替代通路：含 data/evidence 断言的维持现状句本维度不命中', () => {
  const benign = [
    'The status quo has served us well, and the data confirms it still works.',
    '现状一直运行良好，数据显示它仍然有效。',
  ];
  for (const t of benign) {
    const r = checkAppealToTradition(t);
    assertMiss(t, r);
    const dims = (gate.gate(t).findings || []).map(f => f.dimension);
    assert(!dims.includes('appeal_to_tradition'), 'gate findings 不应含 appeal_to_tradition: ' + t + ' :: ' + dims.join(','));
  }
});

test('F3 findings 带 dimension=appeal_to_tradition 与 guidance', () => {
  const g = gate.gate('祖上传下来的秘方，治这个病最管用。');
  const finding = (g.findings || []).find(f => f.dimension === 'appeal_to_tradition');
  assert(finding, 'gate finding 应含 appeal_to_tradition');
  const guidance = finding.guidance || (g.guidance && g.guidance.appeal_to_tradition) || '';
  assert(typeof guidance === 'string' && guidance.length > 50, 'guidance 应完整');
  assert(guidance.includes('传统'), 'guidance 应说明本族判据（诉诸传统）');
});

// ═── G. 接线完整性（src/index.js 零改动的反向证明） ─────────────
test('G1 接线七处仍在（require/计算点/allDims/dimMap/dimensions/VERIFY_DIMS/DIM_GUIDANCE）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("require('./appeal-tradition.js')"), 'require 接线缺失');
  assert(src.includes('checkAppealToTradition(_normText)'), '计算点缺失');
  assert(src.split("{score: att.score, name:'appeal_to_tradition'},").length - 1 === 1, 'allDims 登记应恰好 1 次');
  assert(src.split('appeal_to_tradition: att,').length - 1 === 2, 'dimMap 与 dimensions 两处登记应各 1 次（共 2）');
  const verifyDecl = src.indexOf('const VERIFY_DIMS = new Set([');
  assert(verifyDecl > 0, '未找到 const VERIFY_DIMS 声明');
  assert(src.slice(verifyDecl, verifyDecl + 60000).includes("'appeal_to_tradition',"), 'VERIFY_DIMS 未登记');
  assert(src.includes("appeal_to_tradition: '不得用「历来如此/传统如此」压制改变或异议"), 'DIM_GUIDANCE 条目缺失');
  // 引擎本体真值：dimensions 键命中且总数仍为 214（维度计数不变）
  const disc = gate.discriminate('祖上传下来的秘方，治这个病最管用。');
  assert(disc.dimensions.appeal_to_tradition && (disc.dimensions.appeal_to_tradition.count ?? 0) > 0,
    'discriminate().dimensions.appeal_to_tradition 应命中');
  assertEqual(Object.keys(disc.dimensions).length, 214, 'dimensions 键数应为 214（维度计数不变）');
});

// ═══════════════════════════════════════════════════════════════════
// H. 负例注入：逐支删除本轮每个新模式，守卫必须变红（断言失败而非崩溃）
// ═══════════════════════════════════════════════════════════════════

// 每支一个**专属样本**：该样本的命中只依赖这一支（其他腿由存量/他支提供），
// 杀死该支后必须由 hit 变 miss。样本均在 A1/A2 实测命中过。
const INJECT_TABLE = {
  TRAD_ZH_BRANCHES: {
    t1_recipe: '这个秘方传了三代，治这个病最管用。',
    t2_old_brand: '百年老店的酱料，肯定靠谱。',
    t3_ancient_method: '古法炮制的中药，比机器加工的强。',
    t4_ancestral_rules: '祖训不可违，由不得你改。',
    t5_sages: '古圣先贤早就把道理说透了，照做就行。',
    t6_old_custom: '旧俗如此，由不得你质疑。',
    t7_elders: '老辈人说过，人饿了就得吃这个，自然有它的道理。',
    t8_palace: '这个配方是清宫里传出来的，能有问题吗。',
    t9_master: '这事由老师傅定夺，新来的少插嘴。',
  },
  TRAD_EN_BRANCHES: {
    e1_time_tested: 'It is a tried-and-true method, proven over the centuries.',
    e2_handed_down: 'This remedy was handed down in my family, so do not change it.',
    e3_heritage: 'It is our heritage — an ancestral practice nobody should touch.',
    e4_old_ways: 'Old-school craftsmanship beats anything modern.',
    e5_status_quo: 'The status quo has served us well, so do not rock the boat.',
    e6_established_order: 'This established order has served us well.',
    e7_good_old_days: 'In the good old days we did it this way, so do not change it.',
    e8_good_enough_for: 'If it was good enough for my grandfather, it is good enough for me.',
    e9_predecessors: 'Nobody should deviate from the way they did it.',
  },
  SUPP_ZH_BRANCHES: {
    s1_lunbudao: '咱们村几百年来都这么过，轮不到你质疑。',
    s2_untouchable: '祖上的规矩碰不得。',
    s3_no_precedent: '老规矩立了多少年，这个先例不能开。',
    s4_status_quo: '老传统一切维持现状就好。',
    s5_shut_up: '这事由老师傅定夺，新来的少插嘴。',
    s6_conform: '别标新立异了，老老实实按老法子来。',
    s7_arbitrary_change: '几百年的传统，你说改就改？',
    s8_no_comment: '先人的法度不容置喙，执行便是。',
    s9_cannot_change: '家风祖训历来如此，不能到我这里变了。',
  },
  SUPP_EN_BRANCHES: {
    e1_rock_boat: 'We must not rock the boat on a century-old tradition.',
    e2_keep_status_quo: 'Keep the status quo — that is our heritage.',
    e3_dont_fix: 'Do not fix what is not broken — it is a time-honored practice.',
    e4_leave_alone: 'We should leave well enough alone — the old way.',
    e5_hold_line: 'We should hold the line and preserve our long-standing customs.',
    e6_deviate: 'Nobody should deviate from the way they did it.',
    e7_not_ours: 'That is not for us to change — it is our heritage.',
    e8_sacred: 'This ancient custom is sacred and untouchable.',
    e9_keep_faith: 'Keep the faith — our customs are long-standing.',
    e10_do_not_change: 'This is a century-old recipe, so do not change it.',
  },
  CONCL_ZH_BRANCHES: {
    c1_reliable: '百年老店的酱料，肯定靠谱。',
    c2_has_reason: '老辈人说过，人饿了就得吃这个，自然有它的道理。',
    c3_comparative: '古法炮制的中药，比机器加工的强。',
    c4_obey: '古圣先贤早就把道理说透了，照做就行。',
    c5_generations_tested: '土办法虽然上不了台面，但几代人验证过。',
    c6_most: '这个秘方传了三代，治这个病最管用。',
    c7_rhetorical: '这个配方是清宫里传出来的，能有问题吗。',
  },
  CONCL_EN_BRANCHES: {
    c1_beats: 'Old-school craftsmanship beats anything modern.',
    c2_proven: 'It is a tried-and-true method, proven over the centuries.',
    c3_worked_fine: 'The old ways worked fine for my grandfather.',
    c4_good_enough: 'If it was good enough for my grandfather, it is good enough for me.',
    c5_must_work: 'It is folk wisdom passed down from time immemorial, so it must be right.',
    c6_fine_for_me: 'We keep the old ways, so they are fine for me.',
    c7_generations: 'This is a time-tested remedy that our ancestors used for generations.',
  },
};

test('H1 逐支注入负例：51 支全部变红（hit→miss），0 支未变红', () => {
  const I = __internals();
  const NEVER = '__negtest_never__';
  let total = 0;
  const stuck = [];
  for (const [tableName, perBranch] of Object.entries(INJECT_TABLE)) {
    const table = I[tableName];
    assert(table && typeof table === 'object', '常量表缺失: ' + tableName);
    for (const [key, sample] of Object.entries(perBranch)) {
      assert(table[key] instanceof RegExp, tableName + '.' + key + ' 不是 RegExp');
      // 基线：该专属样本必须命中（否则注入点本身不承重，是假阴性）
      const before = checkAppealToTradition(sample);
      if (!before.hit) { stuck.push('BASELINE-MISS ' + tableName + '.' + key + ' :: ' + sample); continue; }
      // 注入：把该支替换成永不匹配串 → 必须变红（断言失败而非加载崩溃）
      const inject = {};
      inject[tableName] = Object.assign({}, table);
      inject[tableName][key] = new RegExp(NEVER);
      const after = checkAppealToTradition(sample, inject);
      total++;
      if (after.hit) stuck.push('STILL-HIT ' + tableName + '.' + key + ' :: ' + sample);
    }
  }
  assertEqual(stuck.length, 0, '未变红/基线未命中的注入点:\n  ' + stuck.join('\n  '));
  assert(total === 51, '注入点总数应为 51（腿① ZH9/EN9 + 腿② ZH9/EN10 + 腿③ ZH7/EN7），实测 ' + total);
});

test('H2 未知注入键不崩溃（防御性）', () => {
  // 注入一个不含任何既有分支的表 → 只影响该表，存量路由不受影响
  const r = checkAppealToTradition('This tradition is sacred and must not be tampered with.',
    { TRAD_ZH_BRANCHES: { no_such_key: /x/ } });
  assertHit('This tradition is sacred and must not be tampered with.', r);
});

test('H3 整族删除：六张新分支表全杀后存量攻击仍命中（证明旧判据未被本轮削弱）', () => {
  const legacy = [
    '别人家也都这样，怎么就你特殊。',
    '这家业是一代代传下来的，绝不能改到我这里断了。',
    'This tradition is sacred and must not be tampered with.',
  ];
  const killNew = {
    TRAD_ZH_BRANCHES: {}, TRAD_EN_BRANCHES: {},
    SUPP_ZH_BRANCHES: {}, SUPP_EN_BRANCHES: {},
    CONCL_ZH_BRANCHES: {}, CONCL_EN_BRANCHES: {},
  };
  for (const t of legacy) assertHit(t, checkAppealToTradition(t, killNew));
  // 反向：新措辞样本在六张新表全杀后必须 miss（证明它们只靠新族承重）
  const fresh = '这是百年老字号的古法工艺，肯定靠谱。';
  assertMiss(fresh, checkAppealToTradition(fresh, killNew));
});

// ═── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
