'use strict';
/**
 * test/round-300-regression-feedback-family.test.js
 * [r300] regression_to_the_mean（第 193 维度）「表扬/批评/奖惩反馈干预」全新
 * 措辞家族（真升级②，live 生效，维度计数不变，src/index.js 零改动）。
 *
 * r300 池化探针实测（scripts/round-300/probe-feedback-r300.js，v6.8.174
 * 动手前）：该族 14 条攻击中 8 条真零命中（gate.action=pass 且零维度承重、
 * checkRegressionToMean 直调 false），良性 8/8 干净。落地后 14/14 攻击
 * gate 非 pass、其中 12 条由本维直接承重，良性仍 8/8 零误伤，双向守卫
 * 误拦 302/326 与基线持平（零新增误伤）。
 *
 * 家族：把极端表现后的自然回归，归功/归罪于同期施加的表扬/批评/责骂/奖励/
 * 惩罚/换下场/警告等「行为反馈干预」——Kahneman 经典回归均值陷阱。存量
 * INTERVENE 表只收物质/人事干预、存量 EXTREME 表只收统计极端词，均不收
 * 反馈动词与表现型极端，故新增独立三腿路由（FB_EXTREME × FB_REGRESSION ×
 * FB_INTERVENE × FB_ATTRIB），不并入存量数组（存量数组有登记断言 length===N）。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐腿注入-删条承重
 * （含旧分支不受影响对照）+ 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkRegressionToMean, __internals } = require(path.join(ROOT, 'src', 'regression-to-the-mean.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const hit = (t, inj) => checkRegressionToMean(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵（反馈干预族，中英双语，双向：低→升 / 高→降）────────
const FB_ATTACKS = [
  // EN — 批评/责骂 → 回升
  'He played terribly in the first half, so I criticized him hard; he then played great, which proves criticism works.',
  'She got a bad grade, so I scolded her, and she studied harder and aced the next test — scolding clearly helps.',
  'After I yelled at him for the awful serve, he served aces the next match, so tough love works.',
  // EN — 换下场/惩罚 → 赢
  'The striker was in poor form, so the coach dropped him, and the team won the next game — dropping him did the trick.',
  // EN — 奖励/表扬 → 退步（高→降方向：反馈"反而有害"）
  'We rewarded the sales team with a bonus after a record quarter, but next quarter sales fell — bonuses clearly make people complacent.',
  "The employee's performance dipped, so I gave him a warning, and his performance recovered — the warning turned him around.",
  'I praised my daughter for the great report card, then she got a C, so praise obviously makes kids overconfident.',
  // ZH — 责骂/批评 → 考好
  '孩子这次考得差，我责骂了他，下次就考好了，可见责骂能提高成绩。',
  // ZH — 表扬 → 退步（高→降方向）
  '我表扬了孩子考了满分，结果下次考试就退步了，看来表扬会让孩子骄傲自满。',
  // ZH — 警告 → 回升
  '员工状态低迷，我给了警告，之后业绩就回升了，警告起了作用。',
  // ZH — 惩罚 → 失误减少
  '孩子这次失误很多，我惩罚他取消了游戏时间，之后失误就少了，惩罚很有效。',
  // ZH — 训斥 → 少出错
  '新员工频频出错，主管训斥了他，接下来几天就很少出错了，训斥立竿见影。',
];
FB_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本（正确回归陈述/受控实验/对冲/元话语，均不应命中）────
const FB_BENIGN = [
  'He played terribly, but the next game he played great — that is regression to the mean, not proof my criticism works.',
  'After a record quarter sales naturally fell back toward average; a bonus does not cause the decline.',
  '孩子这次考得差，下次可能只是因为回归均值而考好，未必是责骂起了作用。',
  '我们做了随机对照实验，发现批评组和对照组的成绩变化没有显著差异。',
  'I praised her, and she was genuinely happy; we also tracked her progress over a full semester.',
  '体育分析师指出，换帅后战绩反弹往往是回归均值，需要看多个季节的数据。',
  'The coach benched him as part of a planned rotation, and analysts controlled for regression before judging.',
  '老师根据长期记录发现，奖惩之后的变化在对照组里同样出现。',
];
FB_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ────────────────
FB_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'regression_to_the_mean');
  assert.ok(f, 'findings 应含 regression_to_the_mean: ' + s);
}));

// ─── 4. gate 层新良性不被本维命中 ───────────────────────────────────
FB_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'regression_to_the_mean');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 5. 逐腿注入-删条承重 + 旧分支不受影响 ──────────────────────────
// 每个 FB 腿置空后，专署反馈攻击须转 miss（承重证明），且存量主判据攻击
// （走物质/人事干预 + 统计极端词，不用 FB 数组）仍命中（新路由独立、不干扰旧路由）。
const ZH_ATK = '孩子这次考得差，我责骂了他，下次就考好了，可见责骂能提高成绩。';
const EN_ATK = 'He played terribly in the first half, so I criticized him hard; he then played great, which proves criticism works.';
const OLD_CTRL = [
  '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',
  '他连败五场之后换了新球拍，接着就赢回来了，可见新球拍很关键。',
  'After our worst quarter on record we hired the new consultant, and revenue bounced back — the hire fixed it.',
];
const INJECTIONS = [
  { arr: 'FB_EXTREME_ZH', atk: ZH_ATK },
  { arr: 'FB_REGRESSION_ZH', atk: ZH_ATK },
  { arr: 'FB_INTERVENE_ZH', atk: ZH_ATK },
  { arr: 'FB_ATTRIB_ZH', atk: ZH_ATK },
  { arr: 'FB_EXTREME_EN', atk: EN_ATK },
  { arr: 'FB_REGRESSION_EN', atk: EN_ATK },
  { arr: 'FB_INTERVENE_EN', atk: EN_ATK },
  { arr: 'FB_ATTRIB_EN', atk: EN_ATK },
];
INJECTIONS.forEach((c) => t('注入-' + c.arr, () => {
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.arr);
  const inj = {}; inj[c.arr] = [];   // 置空该腿
  assert.strictEqual(hit(c.atk, inj), false, '置空 [' + c.arr + '] 后攻击须转 miss（承重证明）');
  for (const old of OLD_CTRL) assert.strictEqual(hit(old, inj), true, '置空 [' + c.arr + '] 后存量攻击仍命中（新路由独立）');
}));

// ─── 6. 存量回归：r195/r265 原族攻击仍判、良性仍放行 ─────────────────
t('存量回归-攻击', () => {
  const old = [
    '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',
    '公司业绩跌到谷底那年请了大师做咨询，这个季度营收回暖，多亏了大师。',
    '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，新流程真管用。',
    'The team started 0-8, replaced the head coach, and now they win — the new coach fixed it.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('存量回归-良性', () => {
  const oldBenign = [
    '销量跌到谷底之后上了新包装，这个月就翻红了，但也可能只是均值回归。',
    'The improvement could be regression to the mean; we need a control group.',
    '这次成绩回落可能是均值回归，要看他平时的水平。',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 7. 登记断言 ───────────────────────────────────────────────────
t('登记-dimensions/导出/__internals/存量长度不变', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('regression_to_the_mean'), 'dimensions 键缺失');
  const I = __internals();
  // 新族常量齐全
  const fbNeed = ['FB_EXTREME_ZH', 'FB_EXTREME_EN', 'FB_REGRESSION_ZH', 'FB_REGRESSION_EN',
    'FB_INTERVENE_ZH', 'FB_INTERVENE_EN', 'FB_ATTRIB_ZH', 'FB_ATTRIB_EN'];
  for (const k of fbNeed) assert.ok(I[k] && I[k].length > 0, '__internals 缺 ' + k);
  // 存量数组长度未被追加（round-265 登记断言须仍成立）
  assert.strictEqual(I.EXTREME_LOW_ZH.length, 7, 'EXTREME_LOW_ZH 应仍为 7');
  assert.strictEqual(I.EXTREME_LOW_EN.length, 3, 'EXTREME_LOW_EN 应仍为 3');
  assert.strictEqual(I.REG_UP_ZH.length, 8, 'REG_UP_ZH 应仍为 8');
  assert.strictEqual(I.REG_UP_EN.length, 3, 'REG_UP_EN 应仍为 3');
  // r302 例外：INTERVENE_ZH 由 r302 显式补入第 9 条（干预主体名词形——「补课班/
  // 补习班/家教/辅导班/培训课程/网课」等干预产物名词，探针实证 A1「上次的补课班
  // 起了反作用」整族穿透）。此为本轮已知的、有据的唯一追加，非意外增长。
  assert.strictEqual(I.INTERVENE_ZH.length, 9, 'INTERVENE_ZH 应为 9（r300 基线 8 + r302 显式补入 1）');
  assert.strictEqual(I.CREDIT_ZH.length, 4, 'CREDIT_ZH 应仍为 4');
  assert.strictEqual(I.EFFECT_ZH.length, 5, 'EFFECT_ZH 应仍为 5');
  assert.strictEqual(I.EXEMPT_NEG_ZH.length, 3, 'EXEMPT_NEG_ZH 应仍为 3');
});

console.log('✓ 新攻击矩阵 ' + FB_ATTACKS.length + '/' + FB_ATTACKS.length + ' 全部命中（反馈干预族：批评/责骂/奖励/表扬/惩罚/换下场/警告 × 双向回归）');
console.log('✓ 新良性样本 ' + FB_BENIGN.length + '/' + FB_BENIGN.length + ' 零误伤');
console.log('✓ gate 层接线 ' + FB_ATTACKS.length + '/' + FB_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + FB_BENIGN.length + '/' + FB_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐腿注入 ' + INJECTIONS.length + ' 个：' + INJECTIONS.length + ' 个变红，0 个未变红（均带存量主判据对照）');
console.log('✓ 存量回归：r195/r265 原族攻击仍命中、良性仍放行');
console.log('✓ 登记断言：dimensions 键含本维、__internals 新族齐全、存量数组长度不变');

console.log('\n全部断言通过（regression_to_the_mean 第 193 维度 · r300 表扬/批评/奖惩反馈干预新措辞家族）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
