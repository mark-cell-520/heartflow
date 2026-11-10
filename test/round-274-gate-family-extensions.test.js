'use strict';
/**
 * test/round-274-gate-family-extensions.test.js
 * [r274] 三个已接线维度的全新措辞家族扩展（真升级②，live 生效，维度计数
 * 240 不变、src/index.js 零改动、VERSION 未 bump（r274 纯措辞家族扩展；
 * 基线于 r278 前同步：r277 bump 至 6.8.160 时未回填本断言，本轮 r278
 * 递增至 6.8.161 后统一对齐，属跨轮次基线登记维护而非适配性改动）：
 *
 * ① gamblers_fallacy（第 148 维度）口语 streak/due 族：
 *    STREAK_ZH 补 连续输/接连/连连（动词后置连败形）、(正反背)面 N 次、
 *      [大小] N 把、前 N 把（原只收「前几」）、手气正背着；
 *    DUE_ZH 补 第 N 把必赢、下一把稳赢、也该中、该转运/翻本、该买小、
 *      概率该回来；
 *    STREAK_EN 补 N in a row、come up red、N straight losses；
 *    DUE_EN 补 guaranteed to win、bound to hit、almost certainly black。
 * ② prosecutors_fallacy（第 222 维度）人口唯一性腿① + 口语定罪结论腿②：
 *    RARE_ZH 补 全城/全世界 + 只有/不超过 + 数量 + 人；
 *    GUILT_ZH 补 他就没跑了、基本上就尘埃落定；
 *    RARE_EN 补 one in ten billion / only one person in ten million；
 *    GUILT_EN 补 as good as convicted / win at trial is a formality。
 * ③ regression_to_the_mean（第 193 维度）即时性/翻盘/全墨/空降族：
 *    EXTREME_LOW_ZH 补 全墨/全负/零胜、差到尘埃/糊穿地心；
 *    REG_UP_ZH 补 翻盘/翻身/止住颓势/追了上来；REG_UP_EN 补 won N
 *      straight / broke out (of the slump)；
 *    INTERVENE_ZH 补 空降/挖来/上任；INTERVENE_EN 补 came in / coaching
 *      change / new manager；
 *    EFFECT_ZH 补 立马/立刻 + 就翻盘/就止住/就追了上；EFFECT_EN 补
 *      immediately / bounced right back；
 *    EXEMPT_NEG 补显式存疑尾句（「一个样本说明不了什么」/ proves
 *      nothing）——修 r265 良性-7 被 EFFECT 新族翻转的问题（测试断言
 *      零改动，轮报告登记）。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条承重
 * （marker 精确外科剔除 + 旧分支不受影响对照）+ 登记断言（数组长度守恒）。
 */
const assert = require('assert');
const { checkGamblersFallacy, __internals: gmbInternals } = require('../src/gamblers-fallacy.js');
const { detectProsecutorsFallacy, __internals: prfInternals } = require('../src/prosecutors-fallacy.js');
const { checkRegressionToMean, __internals: rtmInternals } = require('../src/regression-to-the-mean.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// 精确外科剔除：从正则源码中去掉指定子串（连带剔除一个相邻 '|'，防止留空
// alternative 造成全串空匹配；保持其余分支与 flag 不变）
function strip(re, marker) {
  const markers = Array.isArray(marker) ? marker : [marker];
  let src = re.source;
  for (const mk of markers) {
    let next = src;
    if (next.includes('|' + mk)) next = next.split('|' + mk).join('');
    else if (next.includes(mk + '|')) next = next.split(mk + '|').join('');
    else next = next.split(mk).join('');
    assert.ok(next !== src, 'marker 未在源码中找到: ' + mk);
    src = next;
  }
  // 整条模式被剔空时，用永假式兜底（空正则源码会匹配一切）
  if (src === '' || new RegExp(src, re.flags).test('zzz qqq')) return /(?!x)x/;
  return new RegExp(src, re.flags);
}

// ─── 1. gamblers_fallacy 新攻击矩阵 ───────────────────────────────
const GMB_ATTACKS = [
  '已经十连败了，下一把我必赢。',
  '连开五把大了，该买小了。',
  '都连续输八把了，运气不可能再差，下把稳赢。',
  '手气正背着呢，下一把该转运赢回来了。',
  '连着七把没中，第八次怎么也该中了。',
  '背面出现四次了，下一次正面概率大多了。',
  '连输六把，概率该回来了。',
  'He has lost seven in a row, so the next hand is guaranteed to win.',
  'Five straight losses, a win is bound to hit any time now.',
  'It has come up red six times, so the next spin is almost certainly black.',
];
t('gamblers 新攻击矩阵 ' + GMB_ATTACKS.length + '/' + GMB_ATTACKS.length, () => {
  for (const s of GMB_ATTACKS) {
    const r = checkGamblersFallacy(s);
    assert.strictEqual(r.hit, true, '应命中: ' + s);
    assert.strictEqual(r.count >= 1, true, 'count: ' + s);
  }
});

const GMB_BENIGN = [
  '这把我必赢，状态很好。',
  '今天真背，出门没带伞。',
  '每次抛硬币都是独立事件，概率不变，不会累积。',
  'He is confident about the exam and feels good about it.',
  'The coin has no memory; each flip is an independent event.',
];
t('gamblers 新良性 ' + GMB_BENIGN.length + '/' + GMB_BENIGN.length + ' 零误伤', () => {
  for (const s of GMB_BENIGN) assert.strictEqual(checkGamblersFallacy(s).hit, false, '误伤: ' + s);
});

// ─── 2. prosecutors_fallacy 新攻击矩阵 ────────────────────────────
const PRF_ATTACKS = [
  '全城只有一个人有这个特征，查到他基本上就尘埃落定了。',
  '这种生物特征万里挑一，对上以后他就没跑了。',
  '全世界具备这个特征的不超过五个人，除了他不会再有别人。',
  'The odds of a random person matching this profile are one in ten billion, which makes him as good as convicted.',
  'Only one person in ten million has this marker, so a win at trial is a formality.',
];
t('prosecutors 新攻击矩阵 ' + PRF_ATTACKS.length + '/' + PRF_ATTACKS.length, () => {
  for (const s of PRF_ATTACKS) {
    const r = detectProsecutorsFallacy(s);
    assert.strictEqual(r.hit, true, '应命中: ' + s);
    assert.strictEqual(r.dimension, 'prosecutors_fallacy');
    assert.ok(r.count >= 1 && r.evidence.length >= 1, 'count/evidence 非空: ' + s);
    assert.ok(r.severity >= 55 && r.severity <= 90, 'severity 区间: ' + s);
    assert.ok(typeof r.guidance === 'string' && r.guidance.includes('先验概率'), 'guidance: ' + s);
  }
});

const PRF_BENIGN = [
  '全县只有一个人报名了这个项目，最后果然是他中标。',
  '全班只有一个人满分，老师当场表扬了他。',
  '全村只有一口井，大家排队打水。',
  '这个方案基本上已经尘埃落定，下周启动。',
  '他基本上没跑，留在了原来的部门。',
  'Only one person in ten thousand can solve this puzzle, and she won the math competition.',
  'The decision is as good as settled; we ship on Friday.',
];
t('prosecutors 新良性 ' + PRF_BENIGN.length + '/' + PRF_BENIGN.length + ' 零误伤', () => {
  for (const s of PRF_BENIGN) assert.strictEqual(detectProsecutorsFallacy(s).hit, false, '误伤: ' + s);
});

// ─── 3. regression_to_the_mean 新攻击矩阵 ─────────────────────────
const RTM_ATTACKS = [
  '上个月业绩垫底，这个月换了新策划，立马就翻盘了。',
  '上半年前三场全墨，请了新教练以后下半场就回暖了，新教练真管用。',
  '开局三连败跌到谷底，换帅之后这个月就止住颓势了。',
  '二月营收见底，换了新包装后三月就追了上来。',
  '一季度全公司亮红灯，空降了CFO以后二季度就缓过来了。',
  '上月差到尘埃里，这个月上了新流程，一下子就打了一个翻身仗。',
  'We started 0-9, then after the coaching change we won three straight.',
  'The team hit rock bottom in March, then a new manager came in and they immediately won again.',
  'Q1 was our worst ever, we brought in a consultant and Q2 bounced right back.',
  'He was in the deepest slump of his career, then changed his grip and broke out immediately.',
];
t('regression 新攻击矩阵 ' + RTM_ATTACKS.length + '/' + RTM_ATTACKS.length, () => {
  for (const s of RTM_ATTACKS) assert.strictEqual(checkRegressionToMean(s).hit, true, '应命中: ' + s);
});

const RTM_BENIGN = [
  '上个月业绩垫底，这个月换了新策划，不过效果还要看长期。',
  '二月营收见底，换了新包装后三月就追了上来，但这可能是自然波动，需要对照组。',
  'The team started 0-9, then after the coaching change we won three straight, though one season proves nothing.',
  '球队开局三连败，换帅之后立刻反弹，不过一个样本说明不了什么。',
  '翻盘了，这部电影真好看。',
  '公司立刻召开了会议，讨论下一季度预算。',
  'He broke out of the routine and tried a new café for lunch.',
];
t('regression 新良性 ' + RTM_BENIGN.length + '/' + RTM_BENIGN.length + ' 零误伤', () => {
  for (const s of RTM_BENIGN) assert.strictEqual(checkRegressionToMean(s).hit, false, '误伤: ' + s);
});

// ─── 4. gate 层接线：新攻击非 pass 且 findings 含本维 ──────────────
const GATE_MATRIX = [
  ['gamblers_fallacy', GMB_ATTACKS],
  ['prosecutors_fallacy', PRF_ATTACKS],
  ['regression_to_the_mean', RTM_ATTACKS],
];
for (const [dim, list] of GATE_MATRIX) {
  t('gate接线-' + dim + ' ' + list.length + '/' + list.length, () => {
    for (const s of list) {
      const r = gate(s);
      assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
      const f = (r.findings || []).find(x => x.dimension === dim);
      assert.ok(f, 'findings 应含 ' + dim + ': ' + s);
    }
  });
}
t('gate良性-三维度新良性无本维误伤', () => {
  const all = [
    ['gamblers_fallacy', GMB_BENIGN], ['prosecutors_fallacy', PRF_BENIGN], ['regression_to_the_mean', RTM_BENIGN],
  ];
  for (const [dim, list] of all) {
    for (const s of list) {
      const f = (gate(s).findings || []).find(x => x.dimension === dim);
      assert.ok(!f, dim + ' 不应误伤: ' + s);
    }
  }
});

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ────────────────────
// 旧分支对照（只用既有模式，不触任何 r274 新 marker）：
const OLD_CTRL = {
  gamblers: '连败五场之后下一把肯定赢。',
  prosecutors: 'DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。',
  regressionZh: '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',
  regressionEn: 'After our worst quarter on record we hired the new consultant, and revenue bounced back — the hire fixed it.',
};

// 5a. gamblers：单正则常量，marker 精确外科剔除
const GMB_INJ = [
  { const: 'STREAK_ZH', marker: ['连续[输赢败开押中]', '连续[输赢败中开]'], atk: '都连续输八把了，运气不可能再差，下把稳赢。' },
  { const: 'STREAK_ZH', marker: '(?:正|反|背)面(?:出现|开出|开了|出过|连续|都是|又是|连开)?[一二三四五六七八九十百千\\d]+次', atk: '背面出现四次了，下一次正面概率大多了。' },
  { const: 'STREAK_ZH', marker: '手气[正很][背着差霉]', atk: '手气正背着呢，下一把该转运赢回来了。' },
  { const: 'STREAK_ZH', marker: '前[面那]?[几一二三四五六七八九十百千\\d]+[次把回下]', atk: '前面六把全开大，下一把该买小了。' },
  { const: 'STREAK_EN', marker: '\\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\\d+)\\s+in\\s+a\\s+row\\b', atk: 'He has lost seven in a row, so the next hand is guaranteed to win.' },
  { const: 'STREAK_EN', marker: '\\b(?:come|comes|came|coming)\\s+up\\s+(?:tails|heads|red|black|winning|losing)\\b', atk: 'It has come up red, so the next spin is almost certainly black.' },
  { const: 'STREAK_EN', marker: '\\b(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten)\\s+(?:straight|consecutive)\\s+(?:losses|wins|defeats|games|tosses|flips)\\b', atk: 'Five straight losses, a win is bound to hit any time now.' },
  { const: 'DUE_ZH', marker: '第[一二三四五六七八九十百千\\d]+[把次回下][^。！？!?]{0,4}(?:必赢|必中|肯定|一定|稳赢|稳中|跑不了|妥妥|没悬念)', atk: '已经十连败了，第十把一定会赢。' },
  { const: 'DUE_ZH', marker: '(?:怎么|再|总)?也该中|该中一次', atk: '连着七把没中，第八次怎么也该中了。' },
  { const: 'DUE_ZH', marker: '该(?:买|卖|押|下|跟)?[大小]', atk: '连开五把大了，该买小了。' },
  { const: 'DUE_ZH', marker: '概率(?:该|要|会|得)?(?:回来|回归|回摆|摆回来)', atk: '连输六把，概率该回来了。' },
  { const: 'DUE_EN', marker: 'guaranteed\\s+to\\s+(?:win|hit|come\\s+up|pay)', atk: 'He has lost seven in a row, so the next hand is guaranteed to win.' },
  { const: 'DUE_EN', marker: 'almost\\s+certainly\\s+(?:black|red|heads|tails)', atk: 'It has come up red six times, so the next spin is almost certainly black.' },
];
for (const c of GMB_INJ) {
  t('注入-gamblers ' + c.const + ' [' + c.marker.slice(0, 18) + ']', () => {
    const full = gmbInternals()[c.const];
    assert.strictEqual(checkGamblersFallacy(c.atk).hit, true, '正向命中: ' + c.marker);
    const inj = {}; inj[c.const] = strip(full, c.marker);
    assert.strictEqual(checkGamblersFallacy(c.atk, inj).hit, false, '删 [' + c.marker + '] 后攻击须转 miss');
    assert.strictEqual(checkGamblersFallacy(OLD_CTRL.gamblers, inj).hit, true, '删后旧攻击仍命中（旧分支不受影响）');
  });
}

// 5b. prosecutors：数组常量，按 marker 唯一性过滤整条模式
const PRF_INJ = [
  { arr: 'RARE_MATCH_ZH', marker: '全城', atk: '全城只有两个人有这个特征，查到他基本上就尘埃落定了。' },
  { arr: 'GUILT_INFERENCE_ZH', marker: '没跑了', atk: '这种生物特征万里挑一，对上以后他就没跑了。' },
  { arr: 'GUILT_INFERENCE_ZH', marker: '尘埃落定', atk: '全城只有一个人有这个特征，查到他基本上就尘埃落定了。' },
  { arr: 'RARE_MATCH_EN', marker: 'one\\s+in\\s+(?:\\d+|ten', atk: 'The odds of a random person matching this profile are one in ten billion, which makes him as good as convicted.' },
  { arr: 'RARE_MATCH_EN', marker: 'only\\s+(?:one|a\\s+single)', atk: 'Only one person in ten million has this genetic variant, so a win at trial is a formality.' },
  { arr: 'GUILT_INFERENCE_EN', marker: 'good\\s+as', atk: 'The odds of a random person matching this profile are one in ten billion, which makes him as good as convicted.' },
  { arr: 'GUILT_INFERENCE_EN', marker: 'formality', atk: 'Only one person in ten million has this marker, so a win at trial is a formality.' },
];
for (const c of PRF_INJ) {
  t('注入-prosecutors ' + c.arr + ' [' + c.marker + ']', () => {
    const full = prfInternals()[c.arr];
    const uniq = full.filter(re => re.source.includes(c.marker));
    assert.ok(uniq.length >= 1, 'marker 须命中至少一条模式 [' + c.marker + ']');
    assert.strictEqual(detectProsecutorsFallacy(c.atk).hit, true, '正向命中: ' + c.marker);
    const inj = {}; inj[c.arr] = full.filter(re => !re.source.includes(c.marker));
    assert.strictEqual(detectProsecutorsFallacy(c.atk, inj).hit, false, '删 [' + c.marker + '] 后攻击须转 miss');
    assert.strictEqual(detectProsecutorsFallacy(OLD_CTRL.prosecutors, inj).hit, true, '删后旧攻击仍命中（旧分支不受影响）');
  });
}

// 5c. regression：数组合并元素，marker 精确外科剔除（保数组长度守恒）
const RTM_INJ = [
  { arr: 'EXTREME_LOW_ZH', idx: 3, marker: '全墨|全负|零胜|一胜难求|寸功未立', atk: '上半年前三场全墨，请了新教练以后下半场就回暖了，新教练真管用。', old: OLD_CTRL.regressionZh },
  { arr: 'EXTREME_LOW_ZH', idx: 1, marker: '差到尘埃|尘埃里|糊穿地心|烂到家|一塌糊涂|差到离谱', atk: '上月差到尘埃里，这个月上了新流程，一下子就打了一个翻身仗。', old: OLD_CTRL.regressionZh },
  { arr: 'REG_UP_ZH', idx: 7, marker: '翻盘|翻身|止住颓势|扭转颓势|止颓|追了上来|爬了回来|爬了上来|回过劲|缓过劲|翻身仗', atk: '上个月业绩垫底，这个月换了新策划，立马就翻盘了。', old: '他连败五场之后换了新球拍，接着就赢回来了，可见新球拍很关键。' },
  { arr: 'EFFECT_ZH', idx: 4, marker: '立马|立刻|当即|随即|顿时|一下子就|一下就', atk: '二月营收见底，换了新包装后立马追了上来。', old: OLD_CTRL.regressionZh },
  { arr: 'INTERVENE_ZH', idx: 1, marker: '空降|挖来|调来|调任|上任|到任|入驻|下场|驰援', atk: '一季度全公司亮红灯，空降了CFO以后二季度就缓过来了。', old: OLD_CTRL.regressionZh },
  { arr: 'REG_UP_EN', idx: 1, marker: 'won\\s+(?:\\d+|two|three|four|five|six|seven|eight|nine|ten)\\s+(?:straight|in\\s+a\\s+row|consecutive)', atk: 'We started 0-9, then after the coaching change we won three straight.', old: OLD_CTRL.regressionEn },
  { arr: 'REG_UP_EN', idx: 2, marker: '\\bbroke\\s+out\\s+of\\s+(?:it|the\\s+slump|his|her|their|a\\s+slump|the\\s+funk)\\b|\\bbroke\\s+out\\s+(?:immediately|instantly|right\\s+away|promptly|soon)', atk: 'He was in the deepest slump of his career, then changed his grip and broke out immediately.', old: OLD_CTRL.regressionEn },
  { arr: 'INTERVENE_EN', idx: 1, marker: 'came\\s+in|stepped\\s+in|was\\s+hired|got\\s+hired|coaching\\s+change|manager\\s+change|managerial\\s+change|change\\s+of\\s+(?:coach|manager|leadership)|new\\s+(?:manager|coach|CEO|CFO|boss|leadership|regime|staff)', atk: 'The team hit rock bottom in March, then a new manager came in and they immediately won again.', old: OLD_CTRL.regressionEn },
  { arr: 'EFFECT_EN', idx: 1, marker: 'immediately|instantly|promptly|right\\s+away|shortly\\s+after|bounced\\s+right\\s+back|came\\s+right\\s+back', atk: 'Q1 was our worst ever, we brought in a consultant and Q2 bounced right back.', old: OLD_CTRL.regressionEn },
];
for (const c of RTM_INJ) {
  t('注入-regression ' + c.arr + '[' + c.idx + '] [' + c.marker.slice(0, 18) + ']', () => {
    const full = rtmInternals()[c.arr];
    assert.ok(full.length > c.idx, c.arr + ' 数组长度不足');
    assert.ok(full[c.idx].source.includes(c.marker.split('|')[0]), 'marker 应位于 ' + c.arr + '[' + c.idx + ']');
    assert.strictEqual(checkRegressionToMean(c.atk).hit, true, '正向命中: ' + c.arr + '[' + c.idx + ']');
    const inj = {};
    inj[c.arr] = full.map((re, i) => (i === c.idx ? strip(re, c.marker) : re));
    assert.strictEqual(checkRegressionToMean(c.atk, inj).hit, false, '删 [' + c.arr + '[' + c.idx + '] 新 marker] 后攻击须转 miss');
    assert.strictEqual(checkRegressionToMean(c.old, inj).hit, true, '删后旧攻击仍命中（旧分支不受影响）');
  });
}

// 5d. EXEMPT_NEG 豁免反向注入：删显式存疑尾句豁免后，r265 良性-7 须转红
t('注入-regression EXEMPT_NEG_ZH[2]（豁免反向）', () => {
  const full = rtmInternals().EXEMPT_NEG_ZH;
  assert.strictEqual(full.length, 3, 'EXEMPT_NEG_ZH 长度须守恒为 3（r265 登记断言）');
  const benign = '球队开局三连败，换帅之后立刻反弹，不过一个样本说明不了什么。';
  assert.strictEqual(checkRegressionToMean(benign).hit, false, '正向应豁免: ' + benign);
  const inj = { EXEMPT_NEG_ZH: full.map((re, i) => (i === 2 ? strip(re, '说明不了什么|证明不了什么|说明不了问题|不足为凭|样本太少|样本不够|以偏概全|个案说明') : re)) };
  assert.strictEqual(checkRegressionToMean(benign, inj).hit, true, '删存疑尾句豁免后良性须转红（豁免承重证明）');
});

// ─── 6. 存量回归：r274 前既有攻击/良性形态不动 ────────────────────
t('存量回归-gamblers/prosecutors/regression 旧攻击仍判', () => {
  assert.strictEqual(checkGamblersFallacy('连败五场之后下一把肯定赢').hit, true);
  assert.strictEqual(checkGamblersFallacy('It has been tails five times, so a win is due.').hit, true);
  assert.strictEqual(detectProsecutorsFallacy('DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。').hit, true);
  assert.strictEqual(detectProsecutorsFallacy('This combination is once in a lifetime, so it has to be him.').hit, true);
  assert.strictEqual(checkRegressionToMean('他连败五场之后换了新球拍，接着就赢回来了，可见新球拍很关键。').hit, true);
  assert.strictEqual(checkRegressionToMean('公司业绩在去年跌到谷底，年初请了这位大师做咨询，这个季度营收就回暖了，多亏了大师指点。').hit, true);
});
t('存量回归-旧良性仍放行', () => {
  assert.strictEqual(checkGamblersFallacy('概率论老师说，赌徒谬误在独立事件里不成立。').hit, false);
  assert.strictEqual(detectProsecutorsFallacy('这是一种罕见病，需要专家进一步会诊。').hit, false);
  assert.strictEqual(checkRegressionToMean('这次考了年级最差，下次回到中等是正常的均值回归。').hit, false);
});

// ─── 7. 登记断言：regression 数组长度守恒（round-265 断言不破）────
t('登记-数组长度守恒 + 维度总数不减', () => {
  const I = rtmInternals();
  assert.strictEqual(I.EXTREME_LOW_ZH.length, 7, 'EXTREME_LOW_ZH=7');
  assert.strictEqual(I.EXTREME_LOW_EN.length, 3, 'EXTREME_LOW_EN=3');
  assert.strictEqual(I.REG_UP_ZH.length, 8, 'REG_UP_ZH=8');
  assert.strictEqual(I.REG_UP_EN.length, 3, 'REG_UP_EN=3');
  assert.strictEqual(I.INTERVENE_ZH.length, 8, 'INTERVENE_ZH=8');
  assert.strictEqual(I.CREDIT_ZH.length, 4, 'CREDIT_ZH=4');
  assert.strictEqual(I.EFFECT_ZH.length, 5, 'EFFECT_ZH=5');
  assert.strictEqual(I.EXEMPT_NEG_ZH.length, 3, 'EXEMPT_NEG_ZH=3');
  const P = prfInternals();
  assert.ok(P.RARE_MATCH_ZH.length >= 14 && P.GUILT_INFERENCE_ZH.length >= 20, 'prosecutors 数组含 r274 新元素');
  assert.ok(P.RARE_MATCH_EN.some(re => re.source.includes('one\\s+in\\s+(?:\\d+|ten')), 'RARE_MATCH_EN 含 one in ten billion 新元素');
  assert.ok(P.RARE_MATCH_EN.some(re => re.source.includes('only\\s+(?:one|a\\s+single)\\s+(?:person|people|individual|man|woman)\\s+in\\s+(?:\\d+|ten')), 'RARE_MATCH_EN 含 only one person in ten million 新元素');
  assert.ok(P.GUILT_INFERENCE_EN.some(re => re.source.includes('as\\s+good\\s+as')), 'GUILT_INFERENCE_EN 含 as good as convicted 新元素');
  assert.ok(P.GUILT_INFERENCE_EN.some(re => /formality/.test(re.source)), 'GUILT_INFERENCE_EN 含 win at trial is a formality 新元素');
  const idx = require('../src/index.js');
  const V = require('../src/core/version.js');
  assert.ok(typeof idx.detect === 'function', 'index.js detect 入口在位');
  assert.strictEqual(V.VERSION || V.version || V.default, '6.8.161', 'VERSION 未 bump（r278 递增至 6.8.161）');
});

// ─── 8. 收尾清理：无全局状态变更 ──────────────────────────────────
t('收尾-注入无全局污染（无注入下全部攻击仍命中）', () => {
  for (const s of GMB_ATTACKS) assert.strictEqual(checkGamblersFallacy(s).hit, true, 'gamblers 收尾: ' + s);
  for (const s of PRF_ATTACKS) assert.strictEqual(detectProsecutorsFallacy(s).hit, true, 'prosecutors 收尾: ' + s);
  for (const s of RTM_ATTACKS) assert.strictEqual(checkRegressionToMean(s).hit, true, 'regression 收尾: ' + s);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) process.exit(1);
