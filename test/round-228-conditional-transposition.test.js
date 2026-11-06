// test/round-227-conditional-transposition.test.js — 第 215 维度
// conditional_transposition（条件概率换位 / confusion of the inverse：
// P(E|I) 的概率数值在方向翻转后原样沿用为 P(I|E)，检察官谬误的
// 结构形）模块级负例注入测试 + 变体矩阵。
//
// 承重对象：src/conditional-transposition.js 的判据四要件
// （数值两现 / 腿①条件框 / 腿②推断词 / 实体回指）与豁免守卫常量。
// 追责口径：本文件逐常量验证「删任一承重常量必翻转判定」，防止
// 负例补丁式升级。
//
// 立项证据（全部实测，非记忆断言）：
//   · r228 零命中探针 coordination/agent4/probes/r228-zerohit-probe.js
//     （v6.8.144，output 同目录 .output.txt）：10 攻击 8 条
//     gate.action=pass 完全穿引擎、2 条仅泛化层 rewrite/verify 且零
//     维度承重；7 良性零误伤新增。
//   · 干跑 v2/v3/v4（同目录 r228-dryrun*-probe.js + .output.txt）：
//     攻击 22/22 命中、良性 21/21 放行、边界与分工锁全正确。
//   · 负例注入（r228-negative-probe.js）：18/18 变红，0 未变红。
//   · 海外扫描空返（coordination/agent4/scout/ 原始件），按既有
//     形态自建，未编造命中。
//
// 接线状态（重要）：本维度**尚未接入 src/index.js**（8 处接入点是
// 1 号独占热点，4 号禁写）。本测试只验证模块层判据；gate 层变体
// 矩阵由 1 号完成接线后按 round-208/round-218 先例补入。
//
// 运行：node test/round-227-conditional-transposition.test.js
'use strict';

const assert = require('assert');
const { checkConditionalTransposition, __internals } = require('../src/conditional-transposition.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（22 条：中文×13 / 英文×9）────────────────────────
// 覆盖：三种中文条件框形（在X中/身上、如果/假设X、X中+概率词）、
// 六种英文介词框（among/in/of/if/given/when）、数值形（百万分之一、
// 千万分之一、十万分之一、百分之一、千分之一、万分之五、
// 1-in-a-million、once in a hundred thousand、one in ten million、
// 0.1%）、极值形（微乎其微、几乎为零、extremely small、highly
// unlikely）、混合数值形（百万分之一 → 0.0001%，归一化等价证明）、
// 假阳性/假阴性腿①形（EXEMPT_BASERATE 收窄为复合词后的回归）、
// 反问包装形（疑问豁免不得生效）。
const ATTACKS = [
  ['H1-ZH 身上框+百万分之一', '证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率也只有百万分之一。'],
  ['H2-EN if框+1-in-a-million', 'The match has a 1-in-a-million chance if he is innocent, so there is only a 1-in-a-million chance he is innocent.'],
  ['H3-ZH 如果框+微乎其微', '如果他是清白的，那么证据恰好吻合的可能性微乎其微，可见他清白的可能性也微乎其微。'],
  ['H4-EN If框+extremely small', 'If he were innocent, the chance of this evidence appearing is extremely small, so the chance that he is innocent is extremely small too.'],
  ['H5-ZH 在X中+十万分之一', '在守法者中，这个账户模式出现的概率是十万分之一，因此有这种账户模式的人是守法者的概率也是十万分之一。'],
  ['H6-EN among+once in', 'Among law-abiding citizens this pattern occurs once in a hundred thousand, so the probability that someone with this pattern is law-abiding is also one in a hundred thousand.'],
  ['H7-ZH 人群里+百分之一', '健康人群里携带该基因的概率只有百分之一，所以携带该基因的人是健康人的概率也只有百分之一。'],
  ['H8-EN 0.1%+healthy people', 'Only 0.1% of healthy people carry this marker, so only 0.1% of people carrying this marker are healthy.'],
  ['H9-ZH X中+DNA+千万分之一', '无罪的人中DNA吻合的概率是千万分之一，那么DNA吻合的人无罪的概率也是千万分之一。'],
  ['H10-EN of/in+therefore', 'The probability of a DNA match in innocent people is one in ten million; the probability that a DNA match means the person is innocent is therefore also one in ten million.'],
  ['A5-ZH 假设框', '假设账户属于守法者，这个模式出现的概率是十万分之一，因此有这种模式的人是守法者的概率也是十万分之一。'],
  ['A6-EN given长实体', 'Given that the account belongs to a law-abiding citizen, this pattern occurs once in a hundred thousand, so the probability that someone with this pattern is law-abiding is also one in a hundred thousand.'],
  ['A7-EN when框', 'When the account belongs to a law-abiding citizen, this pattern shows once in a hundred thousand, so the probability that someone with this pattern is law-abiding is also one in a hundred thousand.'],
  ['A8-ZH 千分之一', '在接种者中出现该反应的概率是千分之一，所以出现该反应的人是接种者的概率也是千分之一。'],
  ['A10-ZH 几乎为零', '假设系统没有故障，误报的可能性几乎为零，可见出现误报时系统无故障的可能性也几乎为零。'],
  ['A11-EN highly unlikely（假阳性腿①）', 'For healthy patients a false positive is highly unlikely, so the probability that a patient with a positive screen is healthy is highly unlikely.'],
  ['A12-ZH 万分之五', '在捐赠者中该血型出现的概率是万分之五，所以有该血型的人是捐赠者的概率也是万分之五。'],
  ['A13-ZH 假阳性腿①', '在健康者中假阳性出现的概率是百万分之一，所以检测阳性的人是健康者的概率也是百万分之一。'],
  ['A14-ZH 假阴性腿①', '在患者中假阴性出现的概率是千分之一，所以检测阴性的人是患者的概率也是千分之一。'],
  ['N1-ZH 混合形归一化', '证据在无辜者身上出现的概率是百万分之一，所以被告无辜的几率也只有0.0001%。'],
  ['N2-EN 混合形归一化', 'The match has a one-in-a-million chance if he is innocent, so there is only a 0.0001% chance he is innocent.'],
  ['S6-ZH 反问包装', '在患者中阳性率是99%，所以阳性者中患者的概率也是99%，难道不是吗？'],
];

// ─── 良性样本（21 条）─────────────────────────────────────────
// 覆盖：基础概率语言在场、正确判别标记、教学/概念转述、单值、复述
// 不回指、否定结论、真疑问、不同值、估计语气、两个方向分别报告、
// 同值两总体（患病率措辞）、假阳性率/FPR 复合词在场，以及三个
// 近邻维度（base_rate_neglect / illicit_conversion /
// affirming_the_consequent）的领地句（分工锁）。
const BENIGN = [
  ['BH1-ZH 不能换算+基础概率', '即便匹配出现在无辜者身上的概率只有百万分之一，也不能直接换算成无罪概率，还要看基础概率。'],
  ['BH2-EN does not transpose', 'Even if a match is one-in-a-million among the innocent, that does not transpose into his probability of innocence.'],
  ['BH3-ZH 患病率+PPV', '这个检测在患者中的阳性率是99%，但由于患病率很低，阳性预测值远低于99%，要看基础概率。'],
  ['BH4-EN base rate+PPV', 'The test is 99% sensitive, but with low prevalence the positive predictive value is far lower — the base rate matters.'],
  ['BH5-ZH 单方向+综合证据', '证据在无辜者身上出现的概率很低，这说明证据有一定价值，但结论仍要综合全部在案证据。'],
  ['BH6-ZH 教学转述', '教学中我们用法官谬误的例子说明：条件概率不能反向套用。'],
  ['BH7-EN 概念句', 'The prosecutor\u2019s fallacy is the mistake of treating P(evidence|innocent) as if it were P(innocent|evidence).'],
  ['E1-ZH 单值', '证据在无辜者身上出现的概率只有百万分之一。'],
  ['E3-ZH 复述不回指', '如果他没准备，通过考试的可能性极低，所以通过考试的可能性也极低。'],
  ['E4-ZH 否定结论', '证据在无辜者身上出现的概率只有百万分之一，但并不能据此推定他无罪的概率同样是百万分之一。'],
  ['E5-ZH 真疑问', '在患者中阳性率是99%，那么阳性者中患者的概率也是99%吗？'],
  ['E6-ZH 不同值', '在患者中阳性率是99%，所以假阳性率是1%。'],
  ['E8-ZH 估计语气', '调查显示，样本中该特征的出现率约为千分之一，所以在更大总体中该特征的出现率也约为千分之一。'],
  ['B10-ZH 两方向分别报告', '在患者中该检测的阳性率是99%，而阳性者中真正患病的概率可能只有20%，两者不能混为一谈。'],
  ['B11-ZH 假阳性率在场', '该检测的假阳性率很低，在健康者中只有万分之一，所以阳性预测值才是要重点看的指标。'],
  ['B12-ZH 基础概率在场', '在患者中该标志物的出现率是80%，但阳性预测值取决于基础概率，不能直接当成患病概率。'],
  ['B13-EN FPR在场', 'The false positive rate is only 0.1%, so the positive predictive value is what really matters here.'],
  ['FP1-ZH 同值两总体(患病率)', '在男性中该病的患病率是1%，所以在女性中患病率也是1%。'],
  ['L1-ZH base_rate_neglect领地', '检测结果是阳性，说明你大概率已经生病了，不用做进一步检查。'],
  ['L2-ZH illicit_conversion领地', '所有爱国者都支持这个政策，所以所有支持这个政策的人都爱国。'],
  ['L3-ZH affirming_the_consequent领地', '如果他是有罪的，他会逃跑；他逃跑了，所以他是有罪的。'],
];

// ─── 负例注入：每条摘除一个承重常量，守卫必须变红 ──────────────
// 变红定义（r218/r226 范式）：应停命中的攻击转为不命中，或应放行的
// 陷阱转为命中。陷阱句设计原则：四要件齐全，唯一防线是目标常量
// （r228 实测教训：初版 4 条陷阱只含单个数值/无推断词/实体不回指，
// 注入后不翻转，已全部重设）。
const NEVER = /(?!x)x/;
const INJ_ATT = {
  zh1: '证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率也只有百万分之一。',
  zh2: '如果他是清白的，那么证据恰好吻合的可能性微乎其微，可见他清白的可能性也微乎其微。',
  zh3: '在守法者中，这个账户模式出现的概率是十万分之一，因此有这种账户模式的人是守法者的概率也是十万分之一。',
  en1: 'The match has a 1-in-a-million chance if he is innocent, so there is only a 1-in-a-million chance he is innocent.',
  en2: 'If he were innocent, the chance of this evidence appearing is extremely small, so the chance that he is innocent is extremely small too.',
  en3: 'Only 0.1% of healthy people carry this marker, so only 0.1% of people carrying this marker are healthy.',
};
const INJ_TRAP = {
  BASERATE_ZH: '只看基础概率的人会说：在患者中阳性率是99%，所以阳性者中患者的概率也是99%——这正是基数率忽视的典型形态。',
  CORRECT_ZH: '在无辜者中匹配出现的概率是百万分之一，所以在无辜者中被误配的概率也是百万分之一，但这只是条件概率的一个方向，两个概率不能互相换算。',
  META_ZH: '教学中我们讲过一个案例：在患者中阳性率是99%，所以阳性者中患者的概率也是99%——这就是谬误。',
  ESTIMATE_ZH: '调查显示，样本中该特征的出现率约为千分之一，所以在更大总体中该特征的出现率也约为千分之一。',
  NEG_ZH: '证据在无辜者身上出现的概率只有百万分之一，但被告无辜的概率并不会因此就是百万分之一。',
  BASERATE_EN: 'For sick patients the test is 99% sensitive, so the probability that a positive patient is sick is also 99% — but the base rate matters.',
  CORRECT_EN: 'A match is one-in-a-million among the innocent, so it does not transpose into his probability of innocence being one-in-a-million.',
  META_EN: 'For sick patients the test is 99% sensitive, so the probability that a positive patient is sick is also 99% — a classic fallacy taught in every textbook.',
  ESTIMATE_EN: 'A survey found the rate is about one in a thousand in the sample, so in the wider population it is about one in a thousand too.',
  NEG_EN: 'The match has a 1-in-a-million chance if he is innocent, so the chance he is innocent is not 1-in-a-million.',
};

// ─── 1. 模块导出与内部常量可见（负例注入的前提）────────────────
t('模块导出 checkConditionalTransposition 与 __internals', () => {
  assert.strictEqual(typeof checkConditionalTransposition, 'function');
  const I = __internals();
  const keys = ['ZH_VALUE_RES', 'EN_VALUE_RES', 'EXTREME_ZH', 'EXTREME_EN', 'FRAME_ZH', 'FRAME_EN',
    'INFER_ZH', 'INFER_EN', 'NEG_ZH', 'NEG_EN',
    'EXEMPT_BASERATE_ZH', 'EXEMPT_BASERATE_EN', 'EXEMPT_CORRECT_ZH', 'EXEMPT_CORRECT_EN',
    'EXEMPT_META_ZH', 'EXEMPT_META_EN', 'EXEMPT_ESTIMATE_ZH', 'EXEMPT_ESTIMATE_EN'];
  for (const k of keys) assert.ok(k in I, `__internals 缺少 ${k}`);
  for (const k of ['ZH_VALUE_RES', 'EN_VALUE_RES', 'EXTREME_ZH', 'EXTREME_EN', 'FRAME_ZH', 'FRAME_EN',
    'EXEMPT_BASERATE_ZH', 'EXEMPT_BASERATE_EN', 'EXEMPT_CORRECT_ZH', 'EXEMPT_CORRECT_EN',
    'EXEMPT_META_ZH', 'EXEMPT_META_EN', 'EXEMPT_ESTIMATE_ZH', 'EXEMPT_ESTIMATE_EN']) {
    assert.ok(Array.isArray(I[k]) && I[k].length > 0, `${k} 应为非空数组`);
  }
  for (const k of ['INFER_ZH', 'INFER_EN', 'NEG_ZH', 'NEG_EN']) {
    assert.ok(I[k] instanceof RegExp, `${k} 应为正则`);
  }
});

// ─── 2. 攻击翻转（22 条全命中）────────────────────────────────
for (const [id, s] of ATTACKS) {
  t('攻击翻转：' + id, () => {
    const r = checkConditionalTransposition(s);
    assert.ok(r.hit, '应命中：' + s.slice(0, 42));
    assert.strictEqual(r.score, 0.6, 'score 应为 0.6（VERIFY 级）');
    assert.ok(r.count >= 1, 'count 应 ≥1');
    assert.ok(r.detail.length > 0, 'detail 不应为空');
  });
}

// ─── 3. 良性放行（21 条全放行）────────────────────────────────
for (const [id, s] of BENIGN) {
  t('良性放行：' + id, () => {
    const r = checkConditionalTransposition(s);
    assert.ok(!r.hit, '应放行：' + s.slice(0, 42));
  });
}

// ─── 4. 判据边界锁（四要件各自不可省）────────────────────────
t('判据边界：不同数值两现不判（要件①）', () => {
  assert.ok(!checkConditionalTransposition('在接种者中反应率是百分之一，所以在接种者中反应率也是千分之一。').hit);
});
t('判据边界：无结论性推断词不判（要件③）', () => {
  assert.ok(!checkConditionalTransposition('在患者中阳性率是99%，在健康者中阳性率也是99%。').hit);
});
t('判据边界：无条件/人群框不判（要件②）', () => {
  assert.ok(!checkConditionalTransposition('这个概率是百万分之一，所以那个概率也是百万分之一。').hit);
});
t('判据边界：实体不回指不判（要件④）', () => {
  assert.ok(!checkConditionalTransposition('如果他没准备，通过考试的可能性极低，所以通过考试的可能性也极低。').hit);
});
t('判据边界：空文本与极短文本不崩不判', () => {
  assert.ok(!checkConditionalTransposition('').hit);
  assert.ok(!checkConditionalTransposition('概率').hit);
  assert.ok(!checkConditionalTransposition(null).hit);
});

// ─── 5. 负例注入（18 个承重常量逐个摘除）──────────────────────
t('注入 FRAME_ZH=[] → 中文攻击停命中', () => {
  const inj = { FRAME_ZH: [] };
  for (const k of ['zh1', 'zh2', 'zh3']) {
    assert.ok(!checkConditionalTransposition(INJ_ATT[k], inj).hit, k + ' 应停命中');
  }
});
t('注入 FRAME_EN=[] → 英文攻击停命中', () => {
  const inj = { FRAME_EN: [] };
  for (const k of ['en1', 'en2', 'en3']) {
    assert.ok(!checkConditionalTransposition(INJ_ATT[k], inj).hit, k + ' 应停命中');
  }
});
t('注入 INFER_ZH=永假 → 中文攻击停命中', () => {
  const inj = { INFER_ZH: NEVER };
  for (const k of ['zh1', 'zh2', 'zh3']) {
    assert.ok(!checkConditionalTransposition(INJ_ATT[k], inj).hit, k + ' 应停命中');
  }
});
t('注入 INFER_EN=永假 → 英文攻击停命中', () => {
  const inj = { INFER_EN: NEVER };
  for (const k of ['en1', 'en2', 'en3']) {
    assert.ok(!checkConditionalTransposition(INJ_ATT[k], inj).hit, k + ' 应停命中');
  }
});
t('注入 EXTREME_ZH=[] → 无数值形中文攻击停命中', () => {
  assert.ok(!checkConditionalTransposition(INJ_ATT.zh2, { EXTREME_ZH: [] }).hit);
});
t('注入 EXTREME_EN=[] → 无数值形英文攻击停命中', () => {
  assert.ok(!checkConditionalTransposition(INJ_ATT.en2, { EXTREME_EN: [] }).hit);
});
t('注入 ZH_VALUE_RES=[] → 中文数值攻击停命中', () => {
  const inj = { ZH_VALUE_RES: [] };
  for (const k of ['zh1', 'zh3']) {
    assert.ok(!checkConditionalTransposition(INJ_ATT[k], inj).hit, k + ' 应停命中');
  }
});
t('注入 EN_VALUE_RES=[] → 英文数值攻击停命中', () => {
  const inj = { EN_VALUE_RES: [] };
  for (const k of ['en1', 'en3']) {
    assert.ok(!checkConditionalTransposition(INJ_ATT[k], inj).hit, k + ' 应停命中');
  }
});
t('注入 NEG_ZH=永假 → 否定结论陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.NEG_ZH, { NEG_ZH: NEVER }).hit);
});
t('注入 NEG_EN=永假 → 否定结论陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.NEG_EN, { NEG_EN: NEVER }).hit);
});
t('注入 EXEMPT_BASERATE_ZH=[] → 陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.BASERATE_ZH, { EXEMPT_BASERATE_ZH: [] }).hit);
});
t('注入 EXEMPT_BASERATE_EN=[] → 陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.BASERATE_EN, { EXEMPT_BASERATE_EN: [] }).hit);
});
t('注入 EXEMPT_CORRECT_ZH=[] → 陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.CORRECT_ZH, { EXEMPT_CORRECT_ZH: [] }).hit);
});
t('注入 EXEMPT_CORRECT_EN=[] → 陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.CORRECT_EN, { EXEMPT_CORRECT_EN: [] }).hit);
});
t('注入 EXEMPT_META_ZH=[] → 陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.META_ZH, { EXEMPT_META_ZH: [] }).hit);
});
t('注入 EXEMPT_META_EN=[] → 陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.META_EN, { EXEMPT_META_EN: [] }).hit);
});
t('注入 EXEMPT_ESTIMATE_ZH=[] → 陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.ESTIMATE_ZH, { EXEMPT_ESTIMATE_ZH: [] }).hit);
});
t('注入 EXEMPT_ESTIMATE_EN=[] → 陷阱转命中', () => {
  assert.ok(checkConditionalTransposition(INJ_TRAP.ESTIMATE_EN, { EXEMPT_ESTIMATE_EN: [] }).hit);
});

console.log('\nr228 conditional_transposition: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
// 清理：本测试不做任何文件系统/模块状态变异（注入全部经参数作用域
// 传递），无残留状态需要还原；以退出码上报结果。
process.exit(fail > 0 ? 1 : 0);
