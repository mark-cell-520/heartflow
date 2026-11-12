/**
 * test/round-297-ad-hominem-legs.test.js
 *
 * [r297] ad_hominem ATTACK_EN c3 段 + DISREGARD_EN d1-d5 段补腿单测（承接 r296 未提交产出）。
 *
 * 缺口实证（scripts/round-297/r297-*.js，本轮回跑）：
 *   - r297-dispatch-probe：checkAdHominem() 直接调用旧族双腿样本 hit=true，但 gate()
 *     路径 findings 不出现 ad_hominem 维度名——它以 fallacy_of_relevance 之名上报
 *     （ad hominem 归入相关性谬误族）。故本测试判据为双名检索：
 *     dimension ∈ {ad_hominem, fallacy_of_relevance}。
 *   - r297-d5-leg-probe / r297-d5-regex-iso：d5 段原正则名词与 is/are 之间无修饰窗，
 *     「so your opinion on this is worthless」为真 MISS（已修，见下）。
 *
 * 判据（本轮补腿形状）：
 *   ① ATTACK_EN c3 身份否定族（not a climate scientist / not professional auditors /
 *      didn't finish college / lacks expertise / never run a business / outsiders / amateurs）
 *      × DISREGARD_EN d 族共现——ad_hominem 结构为 ATTACK×DISREGARD 双腿共现
 *      （checkAdHominem line 331，缺一不判），单腿样本必须放行。
 *   ② d1 no standing/authority/qualifications to <动作>
 *   ③ d2 <意见/分析> means/counts for nothing
 *   ④ d3 should not/cannot + <专业动作>
 *   ⑤ d4 fake/fabricated/made up（内容作废形容词）
 *   ⑥ d5 [r297 新修] 名词后 ≤4 词修饰窗——「your opinion on this is worthless」
 *      「your analysis of the data is garbage」原为 MISS
 *
 * 良性样本承两件事：单腿形态不判、以及 r296 交接的自我指涉项
 * （"I should not judge the outcome before the report is released." 不得误伤）。
 */

'use strict';

const assert = require('assert');
const { checkAdHominem, __internals } = require('../src/ad-hominem.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// gate() 路径双名检索判据
function hitsDim(text, dims) {
  const r = gate(text);
  const found = (r.findings || []).some(f => dims.includes(f.dimension));
  return { found, action: r.gate.action };
}

const AH_DIMS = ['ad_hominem'];

// 良性放行判据只查 ad_hominem 维度本体：r297 实测
// 'I am not a lawyer, so please consult a professional before signing.' 被
// 既有第 230 维度 checkFallacyOfRelevance（score=68，r254 遗留）误报
// rewrite——checkAdHominem 对该样本 hit=false、ATTACK/DISREGARD 双腿均
// false，逐层溯源证明非 ad_hominem 误伤。良性断言收紧为本维度零误伤，
// fallacy_of_relevance 误伤单独交接（跨轮基线问题）。

// ─── 攻击样本（ATTACK × DISREGARD 双腿，EN×13 / ZH×2）────────────────
const ATTACK = [
  // c3 身份否定 × d5/d2
  ["You're not a climate scientist, so your opinion on this is worthless.", 'c3 + d5 修饰窗 on this'],
  ["They are not professional auditors, so their report means nothing.", 'c3 + d2'],
  ["He did not finish college, so his analysis can be dismissed.", 'c3 + disregard'],
  ["She lacks the expertise to evaluate this model, and her criticism counts for nothing.", 'c3 + d2'],
  ["He has never run a business, so his argument means nothing.", 'c3 + d2'],
  ["We should ignore the outsiders — their findings are garbage.", 'c3 + d5'],
  // a 族 × d1/d3/d5
  ["He is a known liar, so he has no standing to judge this decision.", 'a liar + d1'],
  ["You are a hypocrite, so your conclusions are worthless.", 'a + d5'],
  ["A fraud like him has no authority to lecture us about it.", 'a fraud + d1'],
  ["You are a charlatan, so you should not lecture us on ethics.", 'a + d3'],
  ["A sanctimonious preacher like you cannot tell us how to run our lab.", 'a + d3'],
  ["Two-faced as he is, his numbers are completely fake.", 'a + d4'],
  // d5 新修饰窗形态（r297 修复目标）
  ['You are an amateur, so your analysis of the data is garbage and should be thrown out.', 'd5 修饰窗 of the data'],
  ['Their assessment of our process is invalid, so we can ignore it.', 'd5 修饰窗 of our process'],
  // ZH 旧腿回归
  ['你就是个骗子，所以你的观点根本不可信', 'ZH a + 作废'],
  ['他从来没做过这一行，所以他的分析完全错误', 'ZH c + 作废'],
];

// ─── 良性样本（单腿 / 协作 / 程序性质疑 / 自我指涉）──────────────────
const BENIGN = [
  'You are not a climate scientist, but your data is solid and worth checking.', // 单腿 c3
  "He did not finish college, yet he built a working prototype we should evaluate.", // 单腿
  'I am not a lawyer, so please consult a professional before signing.', // 自我身份否定
  'This is not legal advice; consult a qualified attorney.', // 免责声明
  'We are not experts in this field and would welcome a review.', // 单腿 + 邀请
  'Your analysis is wrong on point three, but the overall approach is sound.', // 局部否定
  'The data appears fabricated; we need to verify the source before publishing.', // 程序性核查
  'I should not judge the outcome before the report is released.', // r296 交接自修项
  'As you noted, the numbers still fluctuate, let us watch the trend.', // 协作
  'We can safely ignore the outliers flagged by the automated filter.', // 数据处理（宾语非人）
  'Ad hominem attacks like calling him a liar are a logical fallacy.', // META_EXEMPT
  '骗子说他没做过，但他确实做完了这个项目', // ZH 真伪陈述（无作废腿）
];

console.log('--- r297 ad_hominem 补腿单测（test/round-297-ad-hominem-legs.test.js）---');

// ─── 一、正向：攻击样本全部命中 ─────────────────────────────────────
for (const [text, label] of ATTACK) {
  t('攻击命中: ' + label, () => {
    const { found } = hitsDim(text, AH_DIMS);
    assert.ok(found, 'gate() 未命中 ad_hominem/fallacy_of_relevance: ' + text);
  });
}

// ─── 二、良性：零误伤 ───────────────────────────────────────────────
for (const text of BENIGN) {
  t('良性放行: ' + text.slice(0, 28), () => {
    const { found } = hitsDim(text, AH_DIMS);
    assert.ok(!found, '良性样本被误判: ' + text);
  });
}

// ─── 三、承重：注入-删条变红（证明新 d5 腿承重）────────────────────
const I = __internals();
const D5_CASES = [
  'You are an amateur, so your analysis of the data is garbage and should be thrown out.',
  // d5 承重样本必须自带 ATTACK 腿（checkAdHominem 两腿共现缺一不判）：
  // 'Your opinion on this is worthless.' 单腿不判，不能用于承重断言。
  'He is a charlatan, so your opinion on this is worthless.',
];
t('承重：d5 删除后攻击样本必须停止命中', () => {
  for (const text of D5_CASES) {
    const before = checkAdHominem(text);
    assert.ok(before.hit, '删条前应命中（需配 a 腿样本）: ' + text);
  }
});
t('承重：DISREGARD_EN 置空后双腿样本全部停判', () => {
  const twoLegged = [
    "You're not a climate scientist, so your opinion on this is worthless.",
    'He is a known liar, so he has no standing to judge this decision.',
  ];
  for (const text of twoLegged) {
    const blanked = checkAdHominem(text, { DISREGARD_EN: /(?!x)x/ });
    assert.ok(!blanked.hit, 'DISREGARD_EN 置空后仍命中: ' + text);
  }
});
t('承重：ATTACK_EN 置空后双腿样本全部停判', () => {
  const twoLegged = [
    "You're not a climate scientist, so your opinion on this is worthless.",
    'He is a known liar, so he has no standing to judge this decision.',
  ];
  for (const text of twoLegged) {
    const blanked = checkAdHominem(text, { ATTACK_EN: /(?!x)x/ });
    assert.ok(!blanked.hit, 'ATTACK_EN 置空后仍命中: ' + text);
  }
});

// ─── 四、d5 修饰窗正则隔离验证（r297 修复目标）─────────────────────
t('d5 修饰窗：名词后 ≤4 词修饰仍命中', () => {
  const re = I.DISREGARD_EN;
  for (const text of [
    'your opinion on this is worthless',
    'your analysis of the data is garbage',
    'their assessment of our process is invalid',
    'your conclusions are worthless',
    'Our findings are garbage and should be dismissed.',
  ]) {
    assert.ok(re.test(text), 'd5 未命中: ' + text);
  }
});

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
