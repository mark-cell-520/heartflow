/**
 * test/round-411-false-dilemma-no-alternative.test.js — 第 65 维度
 * false_dilemma（伪二选一）r411「他法排除族」新路由⑪轮测。
 *
 * 背景（r411 立项）：五候选家族同池探针定拨
 * （coordination/agent4/probes/r411-probe-pool.js），F1「他法排除族」
 * 以 8/10 穿透 + 1/8 存量误伤（no_fallback 代拦，非本维度）+ 模块层
 * 攻击 0/10 真零命中 + 模块层良性 0/8 定选（F2 straw_man 6/10+模块层
 * 1/10、F3 special_pleading 5/8+1/8、F4 masked_man 4/6+良性存量误伤
 * 2/5、F5 appeal_to_majority 1/6 留库/淘汰）。既有路由①-⑨的腿①要求
 * 要么-frame、定性等式、认同等同、站队胁迫或排除中项（中间/折中/第三
 * 条+地带/路线），而「除此之外，没有别的办法，只能这么办」「我们别
 * 无他法」「We have no alternative but to comply.」这一族靠**他法排
 * 除载体**（没有别的办法/别无他法/没有第二条路/没有任何退路/只剩这
 * 一条路/没有第三条路；EN no other way / no alternative / only way /
 * no choice but / you're on your own）把多元局面压成单选项，句中无任
 * 何既有标记，整族射程外。
 *
 * 本文件守六件事：
 *   一、gate 层正向：攻击全部非 pass 且 false_dilemma 在场。
 *   二、模块层直查：攻击命中（detail 归因路由⑪他法排除）、良性不命中。
 *   三、良性零误伤：探针 8 条 + 边界扩样（技术约束/排期/替代方案在场/
 *      单腿否定句/数量形）模块层全不命中；存量 no_fallback 代拦样本
 *      findings 不含 false_dilemma。
 *   四、承重注入：EXALT_ZH/EXALT_EN 与 REASON_ZH/REASON_EN 四组常量
 *      逐组抹掉后，依赖该组的攻击停命中、依赖该组豁免的良性转红。
 *   五、存量路由不回归：路由①/⑥/⑦/⑧/⑨a 与 FACTUAL 豁免样本行为不变。
 *   六、边界锁：单腿不判（无载体名词）/ 数量形「只有这两条路」不判 /
 *      事实技术依据豁免 / 替代方案在场不判。
 */
const assert = require('assert');
const { checkFalseDilemma } = require('../src/false-dilemma.js');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

const NEVER = /(?!x)x/;

// ─── 攻击样本（r411 探针 F1 同源 9 条；#9「不干就走人」无他法排除
// 载体属 ultimatum 另一形态，探针实证不承重，留库下轮复探）────────
const ATTACK = [
  '除此之外，没有别的办法，只能这么办',                              // #0 没有别的办法
  '事到如今，我们已经没有第二条路可走',                              // #1 没有第二条路
  '你别无他法，只能按这个方案执行',                                  // #2 别无他法
  '除了硬扛下去，我们没有任何退路',                                  // #3 没有任何退路
  '只剩这一条路了，你看着办吧',                                      // #4 只剩这一条路
  'There is no other way to get this done.',                         // #5 EN no other way
  'We have no alternative but to comply.',                           // #6 EN no alternative
  "It's either my way or you're on your own.",                       // #7 EN you're on your own
  '要么干，要么走，没有第三条路',                                    // #8 没有第三条路
];

// ─── 良性样本（探针 F1 ben 同源 8 条 + 边界扩样 8 条）─────────────
const BENIGN = [
  // 探针同源（技术/排期/事实二元 + 替代方案在场）
  '路口只能左转或右转，直行是封闭的',
  '除了这个方案，我们还可以考虑延期上线',
  '合同只有签或不签两种结果',
  '目前只有这两条路可走，因为主干道都在施工',
  'There is no other way to compute this; the protocol specifies one algorithm.',
  '要么今天发布，要么等下周窗口期',
  '你可以选择继续或者退出，我们都尊重',
  'Either we fix the bug or we revert the commit — both are valid options.',
  // 边界扩样
  '没有别的办法，协议规定只能用这个接口',                            // REASON_ZH 协议规定
  '在这种情况下我们别无选择，因为物理条件不允许',                    // REASON_ZH 物理条件
  '在预算和工期的约束下，公司只能推迟上线',                          // REASON_ZH 预算/工期约束
  'There is no other way; the specification requires this exact format.', // REASON_EN spec requires
  'Given the timeline, we have no alternative but to delay the release.', // REASON_EN given the timeline
  '这件事没有任何证据表明方案是错的',                                // 单腿：无载体名词（证据不在表）
  '大家没有任何退路可言，但我们可以一起想办法',                      // hmm 占位（见下修正）
  'You can either continue or exit; we respect both choices.',        // EN either-frame 无压迫
  '唯一的选择就是明天继续讨论',                                      // 程序性措辞（继续讨论）守卫
];

// 修正：上一条占位样本改为真正的单腿守卫句（无「办法/路/退路/出路」载体名词）
BENIGN[15] = '这个结论没有任何数据支撑，需要补充调研';

// ─── A 组：gate 层正向（攻击非 pass 且 false_dilemma 在场）────────
t('A1 gate 层：9 条攻击全部非 pass', () => {
  for (const s of ATTACK) {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', `攻击漏判: ${s}`);
  }
});

t('A2 gate 层：攻击 findings 含 false_dilemma（含 no_fallback 代拦 2 条共存）', () => {
  for (const s of ATTACK) {
    const dims = (checkOutput(s).findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('false_dilemma'), `false_dilemma 不在场: ${s} → ${dims.join(',')}`);
  }
});

// ─── B 组：模块层直查（攻击命中 + detail 归因路由⑪）──────────────
t('B1 模块层：9 条攻击全部命中', () => {
  for (const s of ATTACK) {
    const r = checkFalseDilemma(s);
    assert.ok(r.hit, `模块层未命中: ${s}`);
  }
});

t('B2 模块层：detail 归因「他法排除」', () => {
  for (const s of ATTACK) {
    const r = checkFalseDilemma(s);
    assert.ok(r.detail.includes('他法排除'), `归因错误: ${s} → ${r.detail}`);
  }
});

// ─── C 组：良性零误伤 ─────────────────────────────────────────
t('C1 模块层：17 条良性全部不命中', () => {
  for (const s of BENIGN) {
    const r = checkFalseDilemma(s);
    assert.ok(!r.hit, `良性误伤: ${s} → ${r.detail}`);
  }
});

t('C2 gate 层：良性存量代拦样本 findings 不含 false_dilemma', () => {
  // 探针同源 #4「There is no other way to compute this; the protocol...」
  // 基线被存量 no_fallback 判 verify——本维度不得叠加误伤
  const dims = (checkOutput('There is no other way to compute this; the protocol specifies one algorithm.').findings || []).map((f) => f.dimension);
  assert.ok(!dims.includes('false_dilemma'), `false_dilemma 误伤良性: ${dims.join(',')}`);
});

t('C3 gate 层：无存量代拦的良性样本 pass', () => {
  const samples = [
    '除了这个方案，我们还可以考虑延期上线',
    '你可以选择继续或者退出，我们都尊重',
    'Either we fix the bug or we revert the commit — both are valid options.',
    '这个结论没有任何数据支撑，需要补充调研',
  ];
  for (const s of samples) {
    assert.strictEqual(checkOutput(s).gate.action, 'pass', `良性非 pass: ${s}`);
  }
});

// ─── D 组：存量路由不回归 ─────────────────────────────────────
t('D1 存量路由⑨a 要么-frame×贬损标签仍命中', () => {
  const r = checkFalseDilemma('要么支持这个方案，要么就是拖团队后腿');
  assert.ok(r.hit && r.detail.includes('贬损标签'), `存量回归: ${r.detail}`);
});

t('D2 存量路由⑧ EN solution-or-problem 仍命中', () => {
  const r = checkFalseDilemma('You are either part of the solution or part of the problem.');
  assert.ok(r.hit && r.detail.includes('solution or problem'), `存量回归: ${r.detail}`);
});

t('D3 存量路由⑥b 认同等同×施压仍命中', () => {
  const r = checkFalseDilemma('在这个节骨眼上，挺他就是挺公司，你自己看着办');
  assert.ok(r.hit && r.detail.includes('认同等式'), `存量回归: ${r.detail}`);
});

t('D4 存量路由⑦ 要么-frame×威胁后果仍命中', () => {
  const r = checkFalseDilemma('要么按这个流程走，要么后面出了事别来找我');
  assert.ok(r.hit && r.detail.includes('威胁后果'), `存量回归: ${r.detail}`);
});

t('D5 存量排除中项 EXMID 仍命中', () => {
  const r = checkFalseDilemma('这个争议没有折中可能');
  assert.ok(r.hit && r.detail.includes('排除中项'), `存量回归: ${r.detail}`);
});

t('D6 存量污名化 STIGMA 仍命中', () => {
  const r = checkFalseDilemma('不支持我们，就是反对我们');
  assert.ok(r.hit && r.detail.includes('污名化'), `存量回归: ${r.detail}`);
});

// ─── E 组：边界锁 ────────────────────────────────────────────
t('E1 边界：单腿不判（否定句无「办法/路/退路/出路」载体名词）', () => {
  assert.ok(!checkFalseDilemma('这个结论没有任何数据支撑，需要补充调研').hit);
  assert.ok(!checkFalseDilemma('我们毫无头绪，需要更多信息').hit);
});

t('E2 边界：数量形「只有这两条路」不入表', () => {
  assert.ok(!checkFalseDilemma('目前只有这两条路可走，因为主干道都在施工').hit);
});

t('E3 边界：事实/技术依据豁免（REASON_ZH 三支）', () => {
  assert.ok(!checkFalseDilemma('没有别的办法，协议规定只能用这个接口').hit);
  assert.ok(!checkFalseDilemma('在这种情况下我们别无选择，因为物理条件不允许').hit);
  assert.ok(!checkFalseDilemma('在预算和工期的约束下，公司只能推迟上线').hit);
});

t('E4 边界：事实/技术依据豁免（REASON_EN 两支）', () => {
  assert.ok(!checkFalseDilemma('There is no other way; the specification requires this exact format.').hit);
  assert.ok(!checkFalseDilemma('Given the timeline, we have no alternative but to delay the release.').hit);
});

t('E5 边界：替代方案在场不判', () => {
  assert.ok(!checkFalseDilemma('除了这个方案，我们还可以考虑延期上线').hit);
});

t('E6 边界：FACTUAL 地理二元不判', () => {
  assert.ok(!checkFalseDilemma('路口只能左转或右转，直行是封闭的').hit);
});

// ─── F 组：负例注入守卫（逐常量抹除）────────────────────────
t('F1 注入：抹 EXALT_ZH 后「没有别的办法」样本停命中', () => {
  const s = '除此之外，没有别的办法，只能这么办';
  assert.ok(checkFalseDilemma(s).hit, '豁免激活时误判（未命中）');
  const r = checkFalseDilemma(s, { EXALT_ZH: NEVER });
  assert.ok(!r.hit, '抹掉 EXALT_ZH 后未停命中（常量不承重）');
});

t('F2 注入：抹 EXALT_ZH 后「没有第二条路」样本停命中', () => {
  const s = '事到如今，我们已经没有第二条路可走';
  assert.ok(checkFalseDilemma(s).hit, '豁免激活时误判（未命中）');
  assert.ok(!checkFalseDilemma(s, { EXALT_ZH: NEVER }).hit, '抹掉 EXALT_ZH 后未停命中');
});

t('F3 注入：抹 EXALT_ZH 后「没有第三条路」样本停命中（存量要么-frame 不代拦）', () => {
  const s = '要么干，要么走，没有第三条路';
  assert.ok(checkFalseDilemma(s).hit, '豁免激活时误判（未命中）');
  assert.ok(!checkFalseDilemma(s, { EXALT_ZH: NEVER }).hit, '抹掉 EXALT_ZH 后未停命中');
});

t('F4 注入：抹 EXALT_EN 后「no alternative」样本停命中', () => {
  const s = 'We have no alternative but to comply.';
  assert.ok(checkFalseDilemma(s).hit, '豁免激活时误判（未命中）');
  assert.ok(!checkFalseDilemma(s, { EXALT_EN: NEVER }).hit, '抹掉 EXALT_EN 后未停命中');
});

t('F5 注入：抹 EXALT_EN 后「on your own」样本停命中', () => {
  const s = "It's either my way or you're on your own.";
  assert.ok(checkFalseDilemma(s).hit, '豁免激活时误判（未命中）');
  assert.ok(!checkFalseDilemma(s, { EXALT_EN: NEVER }).hit, '抹掉 EXALT_EN 后未停命中');
});

t('F6 注入：抹 REASON_ZH 后「协议规定」良性转红（豁免承重）', () => {
  const s = '没有别的办法，协议规定只能用这个接口';
  assert.ok(!checkFalseDilemma(s).hit, '豁免激活时误判');
  const r = checkFalseDilemma(s, { REASON_ZH: NEVER });
  assert.ok(r.hit, '抹掉 REASON_ZH 后未转红（豁免不承重）');
});

t('F7 注入：抹 REASON_EN 后「protocol specifies」良性转红（豁免承重）', () => {
  const s = 'There is no other way to compute this; the protocol specifies one algorithm.';
  assert.ok(!checkFalseDilemma(s).hit, '豁免激活时误判');
  const r = checkFalseDilemma(s, { REASON_EN: NEVER });
  assert.ok(r.hit, '抹掉 REASON_EN 后未转红（豁免不承重）');
});

t('F8 注入：抹 EXALT_ZH 后存量路由⑨a 不回归（新常量不遮蔽存量）', () => {
  const s = '要么支持这个方案，要么就是拖团队后腿';
  assert.ok(checkFalseDilemma(s, { EXALT_ZH: NEVER }).hit, '抹掉 EXALT_ZH 后存量路由⑨a 失效');
});

t('F9 注入：抹 EXALT_GUARD_ZH 后「一起想办法」良性转红（守卫承重）', () => {
  const s = '大家没有任何退路可言，但我们可以一起想办法';
  assert.ok(!checkFalseDilemma(s).hit, '守卫激活时误判');
  const r = checkFalseDilemma(s, { EXALT_GUARD_ZH: NEVER });
  assert.ok(r.hit, '抹掉 EXALT_GUARD_ZH 后未转红（守卫不承重）');
});

t('F10 注入：抹 EXALT_GUARD_EN 后「we can figure it out」良性转红（守卫承重）', () => {
  const s = 'There is no other way right now, but we can figure something out together.';
  assert.ok(!checkFalseDilemma(s).hit, '守卫激活时误判');
  const r = checkFalseDilemma(s, { EXALT_GUARD_EN: NEVER });
  assert.ok(r.hit, '抹掉 EXALT_GUARD_EN 后未转红（守卫不承重）');
});

t('F11 注入：抹 EXALT_GUARD_ZH 后「继续讨论」程序性良性转红（守卫承重）', () => {
  const s = '唯一的选择就是明天继续讨论';
  assert.ok(!checkFalseDilemma(s).hit, '守卫激活时误判');
  const r = checkFalseDilemma(s, { EXALT_GUARD_ZH: NEVER });
  assert.ok(r.hit, '抹掉 EXALT_GUARD_ZH 后未转红（守卫不承重）');
});

// ─── G 组：全角折叠不逃（pipeline 入口 NFKC 预折叠）────────────
t('G1 全角折叠：全角英文他法排除载体经 gate 仍拦下', () => {
  const s = 'Ｗe have no alternative but to comply.';
  const r = checkOutput(s);
  assert.notStrictEqual(r.gate.action, 'pass', `全角折叠逃逸: ${s}`);
  const dims = (r.findings || []).map((f) => f.dimension);
  assert.ok(dims.includes('false_dilemma'), `false_dilemma 不在场: ${dims.join(',')}`);
});

// ═══════════════════════ 汇总 ═══════════════════════
console.log('\nround-411-false-dilemma-no-alternative: ' + pass + ' passed / ' + fail + ' failed');
if (fail > 0) process.exit(1);
