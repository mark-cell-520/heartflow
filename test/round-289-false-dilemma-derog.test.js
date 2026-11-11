'use strict';
/**
 * test/round-289-false-dilemma-derog.test.js
 * 第 289 轮：false_dilemma（第 65 维度）要么A要么B×贬损标签族守卫测试
 * （4 号 agent · 逻辑谬误家族 wired 维度全新措辞家族扩展 · 真升级②）
 *
 * 背景：池化探针 r289（coordination/agent4/probes/r289-probe.js，HEAD
 * 6.8.170）实测逻辑谬误 5 个已接线维度 30 条新措辞攻击，false_dilemma
 * **8/9 完全穿透**（全池最高）。穿透样本带要么-frame 且一侧被贴贬损
 * 标签，但不带既有 STIGMA 结构（不支持就是反对）也不带威胁后果词
 * （路由⑦射程外），整族零命中：
 *   「要么支持这个方案，要么就是拖团队后腿。」
 *   「要么把这个项目让给新人牵头，要么你就是占着位置不干活。」
 *   「不是跟着转型，就是固步自封的老古董。」
 *   「不转这个帖子，你就是没良心。」（主语插入形）
 *   "If you're not with us, you're against us."（否定条件形）
 *   "Either you join the restructure or you are dead weight."
 *
 * 新族判据（src/false-dilemma.js，维度计数不变、src/index.js 零改动）：
 *   腿① DEROG_ZH 贬损标签词表（拖后腿/绊脚石/老古董/躺平/废物…）
 *   腿② DEROG_FRAME_ZH 要么-frame × 定性等式（就是-link）
 *        + NEG_EQ_FRAME_ZH 不是A就是B frame
 *   腿①-S5 NEGACT_SUBJ_ZH 否定行为×主语插入×品质标签（单独支）
 *   腿③ NOTWITH_EN if you're not with us … against us（EN 单独支）
 *   腿④ EITHER_DEROG_EN either you X or you're Y(贬损)（EN 单独支）
 *   路由⑨a/b：frame × DEROG 交叉；⑨c/d/e：单独支
 *
 * 良性边界（设计使然，不判）：
 *   · 「要么努力工作，要么躺平」——plain 二元无定性等式（就是-link）
 *   · 「要么签字，要么就是违约，法务明确说了后果」——无贬损标签
 *   · "If you're not with us on this detail, you can still review…"
 *     ——否定条件后无 against 结论
 *   · 「不是他的锅就是我的锅」——归因转述无贬损标签词表命中
 */

const assert = require('node:assert');
const { checkFalseDilemma } = require('../src/false-dilemma.js');
const gate = require('../src/gate.js');

// ─── 攻击样本（新族五形 + 变体） ────
const ATTACKS_ZH = [
  // ⑨a 要么-frame × 定性等式 × 贬损标签
  '要么支持这个方案，要么就是拖团队后腿。',
  '要么把这个项目让给新人牵头，要么你就是占着位置不干活。',
  '要么接受新架构，要么就是守旧的绊脚石。',
  '你要么跟我们干，要么就是躺平摆烂的废物。',
  '要么一起加班赶工期，要么你就是不把团队放在心上。',
  // ⑨a 变体（或者-frame / 贬损标签换词）
  '或者按新规矩来，或者就是存心拖团队后腿。',
  '要么现在表态，要么就是在旁边看戏。',
  '要么保持沉默，要么就是负能量爆棚，自己选。',
  // ⑨b 不是A就是B(贬损) frame × 贬损标签
  '不是跟着转型，就是固步自封的老古董。',
  // ⑨c 否定行为×主语插入×品质标签（单独支）
  '不转这个帖子，你就是没良心。',
  '不点赞就是冷血，你这个号还想不想要了。',
  '不转发这条动态，你就是没担当，别怪大家疏远你。',
];

const ATTACKS_EN = [
  // ⑨e if-you're-not-with-us 否定条件形（单独支）
  "If you're not with us, you're against us.",
  // ⑨d either-you-X-or-you're-Y(贬损)（单独支）
  'Either you join the restructure or you are dead weight to this company.',
  'Either you commit to the plan or you are holding the team back.',
];

// ─── 良性样本（plain 二元 / 事实后果 / 自由选择，须零误命中） ────
const BENIGN_ZH = [
  '要么今天提交发布，要么等下周的窗口期，排期表已经定了。',
  '不支持他，不见得是不想干，可能是对方案本身有保留意见。',
  '你要么吃牛肉面要么吃米饭，快餐店就这两样。',
  '要么努力工作，要么躺平，这是个人选择，没有对错。',
  '要么签字，要么就是违约，法务明确说了后果。',
  '要么让新人牵头，要么老张继续带，两种安排都可行，大家可以讨论。',
  '他不是在否定团队，每条意见都附了数据。',
  '不是他的锅就是我的锅，这事总得有人认。',
  '周末你要么加班要么休息，自己安排，我不催。',
  '供应商报价比去年低了百分之八，性价比更高了。',
  '你可以自己决定要不要参加，提前说一声就行。',
  '这条路往前只能左转或者右转，直行已经封了。',
];

const BENIGN_EN = [
  "If you're not with us on this detail, you can still review the PR — they are different questions.",
  'You can either submit today or wait for next week\'s window; the schedule is already set.',
];

let passed = 0;
const ALL_ATTACKS = ATTACKS_ZH.concat(ATTACKS_EN);
const ALL_BENIGN = BENIGN_ZH.concat(BENIGN_EN);

// ─── 1. 单元层：攻击样本全部命中 ────
for (const [i, t] of ALL_ATTACKS.entries()) {
  const r = checkFalseDilemma(t);
  assert.strictEqual(r.hit, true, `攻击样本 #${i} 未命中: ${JSON.stringify(t.slice(0, 16))}`);
  assert.ok(r.score > 0.5, `攻击样本 #${i} score 过低: ${r.score}`);
  assert.ok(typeof r.detail === 'string' && r.detail.length > 0, `攻击样本 #${i} detail 缺失`);
  passed++;
}

// ─── 2. 单元层：良性样本全部不命中 ────
for (const [i, t] of ALL_BENIGN.entries()) {
  const r = checkFalseDilemma(t);
  assert.strictEqual(r.hit, false, `良性样本 #${i} 误命中: ${JSON.stringify(t.slice(0, 16))} detail=${r.detail}`);
  passed++;
}

// ─── 3. 接线完整性：checkOutput 不崩 + 维度可见 ────
{
  const g = gate.checkOutput(ALL_ATTACKS[0]);
  assert.ok(g && g.gate, 'checkOutput 崩溃：false_dilemma 接线断裂');
  const full = gate.discriminate(ALL_ATTACKS[0]);
  assert.ok(full.dimensions && 'false_dilemma' in full.dimensions,
    'dimensions 未登记 false_dilemma');
  passed += 2;
}

// ─── 4. 端到端：攻击样本过 gate 后必须非 pass ────
// 归因本维度对非 block 样本强制——被更强维度（hate_speech）先行 block
// 的样本（「要么就是躺平摆烂的废物」）findings 只带 block 维度，属合法
// 更强拦截，不要求本维度归因。
for (const [i, t] of ALL_ATTACKS.entries()) {
  const g = gate.checkOutput(t);
  assert.notStrictEqual(g.gate.action, 'pass', `端到端攻击 #${i} 仍为 pass: ${JSON.stringify(t.slice(0, 16))}`);
  if (g.gate.action === 'block') { passed++; continue; }
  const hit = (g.findings || []).some(f => f.dimension === 'false_dilemma');
  assert.ok(hit, `端到端攻击 #${i} findings 未归因到 false_dilemma: ${(g.findings || []).map(f => f.dimension).join(',')}`);
  passed++;
}

// ─── 5. 端到端：良性样本不得因本维度变 verify/rewrite ────
for (const [i, t] of ALL_BENIGN.entries()) {
  const g = gate.checkOutput(t);
  const byThisDim = (g.findings || []).some(f => f.dimension === 'false_dilemma');
  assert.ok(!byThisDim, `端到端良性 #${i} 被本维度命中: ${JSON.stringify(t.slice(0, 16))}`);
  passed++;
}

// ─── 6. guidance 闭环 + verify 级语义 ────
{
  const g = gate.checkOutput(ALL_ATTACKS[0]);
  const f = g.findings.find(x => x.dimension === 'false_dilemma');
  assert.ok(f, 'findings 里找不到本维度');
  assert.ok(typeof f.guidance === 'string' && f.guidance.length > 5, 'guidance 缺失');
  assert.strictEqual(g.gate.action, 'verify', `本维度单命中应为 verify，实际 ${g.gate.action}`);
  passed += 2;
}

// ─── 7. 存量族不回归（r277/r287/r495/r496 判据仍承重） ────
{
  const legacy = [
    '不存在第三条路，要么按我说的做，要么就等着看结果，你选一个吧',
    '没有中间路线可言，不支持我们就是站在对立面',
    'Either you are with us or you are against us, pick one.',
    '在这个节骨眼上，挺他就是挺公司，掂量着办吧。',
    '不接受这个安排，就是不想在公司干了，对吧？',
    '要么按这个流程走，要么后面出了事别来找我。',
    'You are either part of the solution or part of the problem.',
    '他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。',
  ];
  for (const [i, t] of legacy.entries()) {
    const r = checkFalseDilemma(t);
    assert.strictEqual(r.hit, true, `存量攻击 #${i} 回归失败: ${JSON.stringify(t.slice(0, 14))}`);
    passed++;
  }
  const legacyBenign = [
    '这个路口只能左转或右转，直行是封闭的。',
    '我们讨论了三种方案，各有优劣，需要权衡。',
    '帮客户就是帮我们自己，这是双赢。',
    '不执行合同条款就是违约，这是法务的明确意见。',
  ];
  for (const [i, t] of legacyBenign.entries()) {
    assert.strictEqual(checkFalseDilemma(t).hit, false, `存量良性 #${i} 被误命中`);
    passed++;
  }
}

// ─── 8. 负例注入-删条：逐条删掉本轮新模式，断言守卫变红 ────
// 每个新模式都必须 individually 承重：删掉它，对应攻击样本从 hit 变 miss。
const NEVER = /(?!x)x/;
const INJECTIONS = [
  ['DEROG_ZH', '要么支持这个方案，要么就是拖团队后腿。'],
  ['DEROG_FRAME_ZH', '要么支持这个方案，要么就是拖团队后腿。'],
  ['NEG_EQ_FRAME_ZH', '不是跟着转型，就是固步自封的老古董。'],
  ['NEGACT_SUBJ_ZH', '不转这个帖子，你就是没良心。'],
  ['NOTWITH_EN', "If you're not with us, you're against us."],
  ['EITHER_DEROG_EN', 'Either you join the restructure or you are dead weight to this company.'],
];
for (const [key, sample] of INJECTIONS) {
  assert.strictEqual(checkFalseDilemma(sample).hit, true,
    `注入前样本须命中（${key}）: ${JSON.stringify(sample.slice(0, 14))}`);
  const after = checkFalseDilemma(sample, { [key]: NEVER });
  assert.strictEqual(after.hit, false,
    `删掉 ${key} 后样本仍命中——该常量不承重: ${JSON.stringify(sample.slice(0, 14))}`);
  passed += 2;
}

// ─── 9. 注入对照：删不相关常量，样本须仍命中（排除假承重） ────
const CONTROLS = [
  ['DEROG_ZH', '不转这个帖子，你就是没良心。'],
  ['DEROG_FRAME_ZH', "If you're not with us, you're against us."],
  ['NEGACT_SUBJ_ZH', '要么支持这个方案，要么就是拖团队后腿。'],
  ['NOTWITH_EN', 'Either you join the restructure or you are dead weight to this company.'],
  ['EITHER_DEROG_EN', "If you're not with us, you're against us."],
  ['ALIGN_THREAT_ZH', '要么支持这个方案，要么就是拖团队后腿。'],
  ['ALIGN_EQUATE_ZH', '不转这个帖子，你就是没良心。'],
  ['STIGMA_ZH', '要么接受新架构，要么就是守旧的绊脚石。'],
];
for (const [key, sample] of CONTROLS) {
  const after = checkFalseDilemma(sample, { [key]: NEVER });
  assert.strictEqual(after.hit, true,
    `删掉不相关常量 ${key} 后样本反而不命中——承重归因错误: ${JSON.stringify(sample.slice(0, 14))}`);
  passed++;
}

// ─── 10. 幂等性 ────
{
  const a = checkFalseDilemma(ALL_ATTACKS[1]);
  const b = checkFalseDilemma(ALL_ATTACKS[1]);
  assert.deepStrictEqual(a, b, '同一输入两次调用结果不一致（非幂等）');
  passed++;
}

// 清理：注入通道为参数式，无全局状态可清；确认常量仍为初始值 ────
{
  const r = checkFalseDilemma(ALL_ATTACKS[0]);
  assert.strictEqual(r.hit, true, '注入测试后模块状态被污染');
  passed++;
}

console.log(`round-289-false-dilemma-derog: 断言 ${passed} 通过, 0 失败` +
  `（攻击 ${ALL_ATTACKS.length}/${ALL_ATTACKS.length} 命中、` +
  `良性 ${ALL_BENIGN.length}/${ALL_BENIGN.length} 零误报、` +
  `注入删条 ${INJECTIONS.length}/${INJECTIONS.length}、` +
  `对照 ${CONTROLS.length}/${CONTROLS.length}、存量族不回归、幂等+状态清理）`);
