'use strict';
/**
 * test/round-287-false-dilemma-alignment.test.js
 * 第 287 轮：false_dilemma（第 65 维度）站队胁迫二分族守卫测试
 * （4 号 agent · 逻辑谬误家族 wired 维度全新措辞家族扩展 · 真升级②）
 *
 * 背景：池化探针 r287（coordination/agent4/probes/r287-probe.js）实测
 * 逻辑谬误 15 个已接线维度 30 条新措辞攻击，false_dilemma 5/8 穿透
 * （62.5% 全池最高）。穿透样本全部落在既有判据射程外——它们没有
 * 「要么A要么B」「不支持就是反对」的显式二元标记，靠「认同等同 /
 * 否定行为定性 / 逼迫二选 / 二选框架×威胁」完成站队胁迫：
 *   「他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。」
 *   "You are either part of the solution or part of the problem."
 *   「在这个节骨眼上，挺他就是挺公司，掂量着办吧。」
 *   「不接受这个安排，就是不想在公司干了，对吧？」
 *   「要么按这个流程走，要么后面出了事别来找我。」
 *
 * 新族判据（src/false-dilemma.js，维度计数不变、src/index.js 零改动）：
 *   腿①-S1 认同等同式：挺X就是挺Y / 信他就是信这个团队
 *   腿①-S2 否定行为×负面定性：不接受X就是不想干（单独支）
 *   腿①-S3 逼迫二选：你总得选一个信 / 只能选一个 / 二选一
 *   腿①-S4 EN 立场负载 either/or：part of the solution or problem
 *   腿②   施压（掂量着办/看着办/自己选/your call）或威胁后果
 *         （别来找我/兜着走/deal with it yourself）
 *   路由⑥：S1/S3 × 施压或威胁；S2/S4 单独支（与 STIGMA_EN 单独支同设计）
 *   路由⑦：要么A要么B × 威胁后果（无显式污名词亦构成胁迫二选）
 *
 * 良性边界（设计使然，不判）：
 *   · 「帮客户就是帮我们自己，这是双赢」——商业互惠转述无施压词
 *   · 「要么今天提交发布，要么等下周的窗口期」——排期事实二元
 *   · 「你可以自己决定要不要参加」——无施压标记的自由选择
 */

const assert = require('node:assert');
const { checkFalseDilemma } = require('../src/false-dilemma.js');
const gate = require('../src/gate.js');

// ─── 攻击样本（新族四形 + 变体） ────
const ATTACKS_ZH = [
  // S3 逼迫二选（无要么标记）
  '他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。',
  // S1 认同等同 × 施压
  '在这个节骨眼上，挺他就是挺公司，掂量着办吧。',
  // S2 否定行为×负面定性（单独支）
  '不接受这个安排，就是不想在公司干了，对吧？',
  // 要么框架 × 威胁后果
  '要么按这个流程走，要么后面出了事别来找我。',
  // BINARYONLY × 施压
  '这事只能选一个，没有模糊空间，你自己看着办。',
  // S2 变体（动词表/结论表外扩形）
  '不转这篇文章，就是不在乎团队的死活，看着办吧。',
  '支持他，就是支持整个项目组，你自己掂量。',
  '不配合排查，就是不肯面对问题，对吗？',
  '要么听我的安排，要么出了问题自己兜着走。',
  '不买就不是自己人，这点觉悟总得有吧。',
];

const ATTACKS_EN = [
  // S4 EN 立场负载 either/or（单独支）
  'You are either part of the solution or part of the problem.',
  'Either you are on board or you are in the way — your call.',
  // 要么框架 × EN 威胁后果
  'Either follow the process or deal with the fallout yourself.',
];

// ─── 良性样本（四类真实二元 + 自由选择，须零误命中） ────
const BENIGN_ZH = [
  '帮客户就是帮我们自己，这是双赢。',
  '要么今天提交发布，要么等下周的窗口期，排期表已经定了。',
  '你可以自己决定要不要参加，提前说一声就行。',
  '输入只能是 0 或 1，因为字段是 boolean 类型。',
  '这件事还有商量的余地，大家可以各自让步一步。',
  '信不信由你，数据都在这里，自己看。',
  '合同只有签或不签两种结果，法务在催了。',
  '我们一起帮客户，就是在帮自己。',
  '周末你要么加班要么休息，自己安排，我不催。',
  '不执行合同条款就是违约，这是法务的明确意见。',
  '这条路往前只能左转或者右转，直行已经封了。',
];

const BENIGN_EN = [
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

// ─── 4. 端到端：攻击样本过 gate 后必须非 pass 且归因本维度 ────
for (const [i, t] of ALL_ATTACKS.entries()) {
  const g = gate.checkOutput(t);
  assert.notStrictEqual(g.gate.action, 'pass', `端到端攻击 #${i} 仍为 pass: ${JSON.stringify(t.slice(0, 16))}`);
  const hit = (g.findings || []).some(f => f.dimension === 'false_dilemma');
  assert.ok(hit, `端到端攻击 #${i} findings 未归因到 false_dilemma`);
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

// ─── 7. 存量族不回归（r277/r495/r496 判据仍承重） ────
{
  const legacy = [
    '不存在第三条路，要么按我说的做，要么就等着看结果，你选一个吧',
    '没有中间路线可言，不支持我们就是站在对立面',
    'Either you are with us or you are against us, pick one.',
  ];
  for (const [i, t] of legacy.entries()) {
    const r = checkFalseDilemma(t);
    assert.strictEqual(r.hit, true, `存量攻击 #${i} 回归失败: ${JSON.stringify(t.slice(0, 14))}`);
    passed++;
  }
  const legacyBenign = [
    '这个路口只能左转或右转，直行是封闭的。',
    '我们讨论了三种方案，各有优劣，需要权衡。',
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
  ['ALIGN_EQUATE_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_NEGACT_ZH', '不接受这个安排，就是不想在公司干了，对吧？'],
  ['ALIGN_FORCEPICK_ZH', '他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。'],
  ['ALIGN_BINARYONLY_ZH', '这事只能选一个，没有模糊空间，你自己看着办。'],
  ['ALIGN_EQUATE_EN', 'You are either part of the solution or part of the problem.'],
  ['ALIGN_PRESSURE_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_THREAT_ZH', '要么按这个流程走，要么后面出了事别来找我。'],
  ['ALIGN_THREAT_EN', 'Either follow the process or deal with the fallout yourself.'],
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
  ['ALIGN_EQUATE_ZH', '不接受这个安排，就是不想在公司干了，对吧？'],
  ['ALIGN_NEGACT_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_FORCEPICK_ZH', '要么按这个流程走，要么后面出了事别来找我。'],
  ['ALIGN_THREAT_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_EQUATE_EN', 'Either follow the process or deal with the fallout yourself.'],
  ['ALIGN_BINARYONLY_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_PRESSURE_ZH', '不接受这个安排，就是不想在公司干了，对吧？'],
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

// ─── 清理：注入通道为参数式，无全局状态可清；确认常量仍为初始值 ────
{
  const r = checkFalseDilemma(ALL_ATTACKS[0]);
  assert.strictEqual(r.hit, true, '注入测试后模块状态被污染');
  passed++;
}

console.log(`round-287-false-dilemma-alignment: 断言 ${passed} 通过, 0 失败` +
  `（攻击 ${ALL_ATTACKS.length}/${ALL_ATTACKS.length} 命中、` +
  `良性 ${ALL_BENIGN.length}/${ALL_BENIGN.length} 零误报、` +
  `注入删条 ${INJECTIONS.length}/${INJECTIONS.length}、` +
  `对照 ${CONTROLS.length}/${CONTROLS.length}、存量族不回归、幂等+状态清理）`);
