/**
 * test/round-195-regression-to-the-mean.js — 第 193 维度
 * regression_to_the_mean（回归均值误归因：极端基线×回归性变化×干预功劳
 * 归因的三腿结构）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中（证明不是装饰）；
 *      依赖某豁免的陷阱样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 regression_to_the_mean 维度承重，≥5 良性全部 pass）。本族枚举刻意
 * 收裸名词形态（「谷底」「连败」「赢回来」「贴膏药」），不收「了/之后」
 * 后缀才命中的形；「回到」收「回到.{0,8}(正常|平均|中游|中等…)」受限形，
 * 避免误收「回到家/回到公司」。
 *
 * 立项证据：grep -ril 'regression_to_mean|regression-to-the-mean' src/ 0
 * 命中——192 维无一覆盖该族；侦察落盘 /tmp/hf-scout-<ts>.txt（HN Algolia
 * 命中 dcscience.net 2015「Regression to the mean is the main reason
 * ineffective treatments appear to work」pts=137 等；GitHub
 * total_count=0；Semantic Scholar 连续 429——纯规则自有实现）。
 */
const assert = require('assert');
const { checkRegressionToMean } = require('../src/regression-to-the-mean.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文×6 / 英文×2 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',       // 极端低 + 回升 + 吃×有用
  '他连败五场之后换了新球拍，接着就赢回来了，可见新球拍很关键。',                 // 连败裸名词 + 换×关键
  '公司业绩在去年跌到谷底，年初请了这位大师做咨询，这个季度营收就回暖了，多亏了大师指点。', // 长句 + 功劳归因（仅 CREDIT 腿）
  '贴膏药是真管用——最疼的那天贴上，第二天就不疼了。',                           // 倒装（归因在前）+ 裸名词干预
  '病情最重的时候吃了这个偏方，后来咳嗽就好了，看来这偏方有效。',                 // 最重 + 就好了 + 有效
  '上映首周票房创下历史新高，之后票房回落，片方换了宣发团队，果然又火了一把。',   // 极端高 → 回落（双向回归）
  'After our worst quarter on record we hired the new consultant, and revenue bounced back — the hire fixed it.', // EN 极端低
  'She was at her lowest when she started the supplements, and within a month she was back to normal, so the supplements clearly work.', // EN 长句
];

// ─── 良性样本（边缘良性：元讨论/推理否定/无归因腿/单纯极端陈述/对冲）──
const BENIGN = [
  '这次考了年级最差，下次回到中等是正常的均值回归。',                           // 元讨论（正确使用概念）
  '连败五场后换了教练，接下来就赢回来了，不过单凭这几次不能说明换教练有效。',     // 推理否定
  '病情最重的时候他在住院，后来好转了，医生说要继续观察。',                       // 无干预×归因腿（仅陈述）
  '这次考试考砸了，我很难过。',                                               // 单纯情绪陈述（无极端基线腿）
  'After the worst quarter ever, we ran a randomized controlled trial before crediting the new campaign.', // EN 实验证据
  '上学期期末考了年级第一，这学期回到年级第十，可能只是题目难度变化。',           // 对冲 + 无归因腿
  '考砸那次之后他既调整了作息又换了老师，成绩回到中等，具体是哪一项起的作用不好说。', // 边缘良性：多因不可归
];

// ─── 陷阱（证豁免承重：抹掉豁免后必须转为命中）──────────────────────
const TRAP_META = '回归均值告诉我们：上次考了年级最差，考前吃了巧克力，这次回到班级中等只是统计必然，和多亏了巧克力没关系。';
const TRAP_EVID = '上次考了年级最差，考前吃了巧克力，这次回到班级中等，起初以为巧克力有用，随机对照后确认巧克力没有独立效果。';
const TRAP_NEG  = '连败五场后换了教练，接下来就赢回来了，不过单凭这几次不能说明换教练有效。';

console.log('\n[正向：攻击命中 / 良性放行]');
for (const s of ATTACK) t('攻击命中: ' + s.slice(0, 24), () => {
  const r = checkRegressionToMean(s); assert.ok(r.hit, '应命中却漏判'); assert.ok(r.score >= 0.6, 'score 应 ≥0.6');
});
for (const s of BENIGN) t('良性放行: ' + s.slice(0, 24), () => {
  assert.ok(!checkRegressionToMean(s).hit, '应放行却误判');
});
t('元讨论陷阱：放行', () => assert.ok(!checkRegressionToMean(TRAP_META).hit, '元讨论应放行'));
t('实验证据陷阱：放行', () => assert.ok(!checkRegressionToMean(TRAP_EVID).hit, '实验证据应放行'));
t('推理否定陷阱：放行', () => assert.ok(!checkRegressionToMean(TRAP_NEG).hit, '推理否定应放行'));

console.log('\n[承重：逐常量注入]');
const ALL_ATTACK = ATTACK;
t('抹掉极端基线腿（双向四族）→ 全部攻击停止命中（证 EXTREME 腿承重）', () => {
  const inject = {
    EXTREME_LOW_ZH: [NEVER], EXTREME_HIGH_ZH: [NEVER],
    EXTREME_LOW_EN: [NEVER], EXTREME_HIGH_EN: [NEVER],
  };
  for (const s of ALL_ATTACK) {
    assert.ok(!checkRegressionToMean(s, inject).hit, '极端基线腿被抹后应停止命中: ' + s.slice(0, 24));
  }
});
t('抹掉回归性变化腿（双向四族）→ 全部攻击停止命中（证 REGRESSION 腿承重）', () => {
  const inject = { REG_UP_ZH: [NEVER], REG_DOWN_ZH: [NEVER], REG_UP_EN: [NEVER], REG_DOWN_EN: [NEVER] };
  for (const s of ALL_ATTACK) {
    assert.ok(!checkRegressionToMean(s, inject).hit, '回归变化腿被抹后应停止命中: ' + s.slice(0, 24));
  }
});
t('抹掉干预动作腿 → 全部攻击停止命中（证 INTERVENE 腿承重）', () => {
  const inject = { INTERVENE_ZH: [NEVER], INTERVENE_EN: [NEVER] };
  for (const s of ALL_ATTACK) {
    assert.ok(!checkRegressionToMean(s, inject).hit, '干预动作腿被抹后应停止命中: ' + s.slice(0, 24));
  }
});
t('抹掉功劳归因族 → 仅依赖 CREDIT 的攻击停止命中（证 CREDIT 逐族承重）', () => {
  const inject = { CREDIT_ZH: [NEVER], CREDIT_EN: [NEVER] };
  assert.ok(!checkRegressionToMean(ATTACK[2], inject).hit, '多亏形攻击被抹 CREDIT 后应停止命中');
  assert.ok(checkRegressionToMean(ATTACK[0], inject).hit, '有用形攻击应仍命中（EFFECT 腿不受影响）');
});
t('抹掉功效断言族 → 依赖 EFFECT 的攻击停止命中，CREDIT 形仍命中', () => {
  const inject = { EFFECT_ZH: [NEVER], EFFECT_EN: [NEVER] };
  for (const i of [0, 1, 3, 4, 6, 7]) {
    assert.ok(!checkRegressionToMean(ATTACK[i], inject).hit, '功效形攻击被抹 EFFECT 后应停止命中: ' + ATTACK[i].slice(0, 20));
  }
  assert.ok(checkRegressionToMean(ATTACK[2], inject).hit, '功劳形攻击应仍命中（CREDIT 腿不受影响）');
});
t('只抹掉极端低族 → 极端低攻击停止命中，极端高攻击仍命中（证逐族独立）', () => {
  const inject = { EXTREME_LOW_ZH: [NEVER], EXTREME_LOW_EN: [NEVER] };
  for (const i of [0, 1, 2, 3, 4, 6, 7]) {
    assert.ok(!checkRegressionToMean(ATTACK[i], inject).hit, '极端低攻击应停止命中: ' + ATTACK[i].slice(0, 20));
  }
  assert.ok(checkRegressionToMean(ATTACK[5], inject).hit, '极端高攻击应仍命中');
});
t('只抹掉极端高族 → 极端高攻击停止命中，极端低攻击仍命中（证逐族独立）', () => {
  const inject = { EXTREME_HIGH_ZH: [NEVER], EXTREME_HIGH_EN: [NEVER] };
  assert.ok(!checkRegressionToMean(ATTACK[5], inject).hit, '极端高攻击应停止命中');
  assert.ok(checkRegressionToMean(ATTACK[0], inject).hit, '极端低攻击应仍命中');
});
t('只抹掉自高处回落族 → 极端高攻击停止命中，自低处回升攻击仍命中', () => {
  const inject = { REG_DOWN_ZH: [NEVER], REG_DOWN_EN: [NEVER] };
  assert.ok(!checkRegressionToMean(ATTACK[5], inject).hit, '回落形攻击应停止命中');
  assert.ok(checkRegressionToMean(ATTACK[0], inject).hit, '回升形攻击应仍命中');
});
t('抹掉元讨论豁免 → 元讨论陷阱转为命中（证 EXEMPT_META 承重）', () => {
  const r = checkRegressionToMean(TRAP_META, { EXEMPT_META_ZH: [NEVER], EXEMPT_META_EN: [NEVER] });
  assert.ok(r.hit, '抹掉元讨论豁免后陷阱应转为命中');
});
t('抹掉实验证据豁免 → 实验证据陷阱转为命中（证 EXEMPT_EVID 承重）', () => {
  const r = checkRegressionToMean(TRAP_EVID, { EXEMPT_EVID_ZH: [NEVER], EXEMPT_EVID_EN: [NEVER] });
  assert.ok(r.hit, '抹掉实验证据豁免后陷阱应转为命中');
});
t('抹掉推理否定豁免 → 推理否定陷阱转为命中（证 EXEMPT_NEG 承重）', () => {
  const r = checkRegressionToMean(TRAP_NEG, { EXEMPT_NEG_ZH: [NEVER], EXEMPT_NEG_EN: [NEVER] });
  assert.ok(r.hit, '抹掉推理否定豁免后陷阱应转为命中');
});

console.log('\n[变体矩阵：真实 gate() 复量（161 轮教训）]');
const MATRIX_ATK = [
  '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',       // 中文裸名词短句
  '他连败五场之后换了新球拍，接着就赢回来了，可见新球拍很关键。',                 // 带修饰长句
  '公司业绩在去年跌到谷底，年初请了这位大师做咨询，这个季度营收就回暖了，多亏了大师指点。', // 倒装归因 + 长句
  '贴膏药是真管用——最疼的那天贴上，第二天就不疼了。',                           // 归因前置倒装
  '上映首周票房创下历史新高，之后票房回落，片方换了宣发团队，果然又火了一把。',   // 极端高方向
  'After our worst quarter on record we hired the new consultant, and revenue bounced back — the hire fixed it.', // EN
  'She was at her lowest when she started the supplements, and within a month she was back to normal, so the supplements clearly work.', // EN 长句
];
const MATRIX_BEN = [
  '连败五场后换了教练，也赢了几场，但没有对照组，不能说明换教练有效。',         // 推理否定 + 证据词
  '上学期期末考了年级第一，这学期回到年级第十，可能只是题目难度变化。',           // 对冲（无归因腿）
  '孩子上学期成绩垫底，这学期回到中游，可能是试题难度变化。',                     // 裸名词极端 + 对冲
  '球队创下历史新高后战绩回落，管理层说还要观察几个赛季。',                       // 无干预归因腿
  'Revenue hit an all-time low last year and returned to average this year; the team says more data is needed.', // EN
  'The team dropped to last place and then won again, though analysts caution against reading too much into it.', // EN
  'Sales bottomed out and later recovered; whether the new process helped remains unclear.', // EN 边缘：helped 在场但无干预动词腿
];
for (const s of MATRIX_ATK) t('矩阵攻击 gate.action≠pass 且 regression_to_the_mean 承重: ' + s.slice(0, 22), () => {
  const g = gate(s);
  assert.notStrictEqual(g.gate.action, 'pass', '攻击变体应非 pass');
  assert.ok((g.findings || []).some(f => f.dimension === 'regression_to_the_mean'), 'regression_to_the_mean 应承重进入 findings');
});
for (const s of MATRIX_BEN) t('矩阵良性 gate.action=pass: ' + s.slice(0, 22), () => {
  assert.strictEqual(gate(s).gate.action, 'pass', '良性变体应 pass');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
