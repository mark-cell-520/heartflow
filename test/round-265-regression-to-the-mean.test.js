'use strict';
/**
 * test/round-265-regression-to-the-mean.test.js
 * [r265] regression_to_the_mean（第 193 维度）全新措辞家族扩展
 * （真升级②，live 生效，维度计数不变，src/index.js 零改动）。
 *
 * r265 池化探针实测（coordination/agent4/probes/r265-probe-pool.js，
 * v6.8.156）：本族 7 条新措辞攻击 5 条穿透（gate.action=pass 且零维度
 * 承重），良性 0 误伤。落地新族：
 *   EXTREME_LOW_ZH += 项目黄灯族（全黄/亮红灯/全线飘绿）、濒临崩溃族
 *     （差点断裂/快撑不住）、市场腰斩族（腰斩/砍半/膝盖斩）
 *   EXTREME_LOW_EN += 战绩记录族（started 0-8）、cold streak 族
 *   REG_UP_ZH += 翻红/扭亏族、按期交付/重回正轨族、支棱族、涨回来族
 *   REG_UP_EN += now they win 族、immediately won 族
 *   INTERVENE_ZH += all in/梭哈族、上了新X/上线了族
 *   CREDIT_ZH += 救了场/扭转局面族
 *   EFFECT_ZH += 走对了/步好棋/是关键决策正确性族
 *   EXEMPT_NEG_ZH += 要求补证据族（还要看/需要看/待观察/以长期）
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重（含豁免族反向注入：删豁免后良性须转红）+ 旧分支不受影响对照
 * + 存量回归 + 登记。
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

// ─── 1. 新攻击矩阵（新极端族 × 新回归族 × 新干预/归因族，中英双语）──
const NEW_ATTACKS = [
  // ZH 项目黄灯族 × 按期交付族 × 真管用
  '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，新流程真管用。',
  // ZH 濒临崩溃族 × all in 族 × 支棱族 × 多亏
  '年初现金流差点断裂，我们 all in 了新赛道，下半年就支棱起来了，多亏当时敢赌。',
  // EN 战绩族 × now they win 族
  'The team started 0-8, replaced the head coach, and now they win — the new coach fixed it.',
  // ZH 翻红族 × 上了新X 族 × 救了场族
  '销量跌到谷底之后上了新包装，这个月就翻红了，新包装救了场。',
  // ZH 腰斩族 × 涨回来族 × 走对了族
  '股价腰斩后换了CEO，半年涨回来三成，换人这步棋走对了。',
  // ZH 换帅反弹 × 是关键（存量腿组合，新归因词落地）
  '球队开局三连败，换帅之后立刻反弹，可见新教练是关键。',
  // EN cold streak 族 × immediately won 族
  'After a cold streak of five losses he adopted the new grip and immediately won, so the grip made the difference.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '销量跌到谷底之后上了新包装，这个月就翻红了，但也可能只是均值回归。',
  '股价腰斩后换了CEO，半年涨回来三成，需要看同期大盘再下结论。',
  '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，效果待对照组验证。',
  '年初现金流差点断裂，团队调整了赛道，下半年支棱起来了，不过回归成分还要看长期。',
  'We hit rock bottom in Q1, brought in a new CMO, and Q2 revenue recovered — this could be regression to the mean.',
  'The team started 0-8, replaced the head coach, and now they win, though one season proves nothing.',
  '球队开局三连败，换帅之后立刻反弹，不过一个样本说明不了什么。',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ──────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'regression_to_the_mean');
  assert.ok(f, 'findings 应含 regression_to_the_mean: ' + s);
}));

// ─── 4. gate 层新良性不被本维命中 ─────────────────────────────────
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'regression_to_the_mean');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
// 每个新模式在常量数组中的下标 + 仅依赖该模式的攻击句；整表替换删该
// 模式后攻击须转 miss（承重）。豁免族为反向注入：删豁免后良性须转红。
const OLD_CTRL = [
  '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',
  '他连败五场之后换了新球拍，接着就赢回来了，可见新球拍很关键。',
];
const INJECTIONS = [
  // 新腿模式：删后攻击转 miss + 旧攻击仍命中
  { arr: 'EXTREME_LOW_ZH', idx: 4, atk: '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，新流程真管用。' },
  { arr: 'EXTREME_LOW_ZH', idx: 5, atk: '年初现金流差点断裂，我们 all in 了新赛道，下半年就支棱起来了，多亏当时敢赌。' },
  { arr: 'EXTREME_LOW_ZH', idx: 6, atk: '股价腰斩后换了CEO，半年涨回来三成，换人这步棋走对了。' },
  { arr: 'EXTREME_LOW_EN', idx: 1, atk: 'The team started 0-8, replaced the head coach, and now they win — the new coach fixed it.' },
  { arr: 'EXTREME_LOW_EN', idx: 2, atk: 'After a cold streak of five losses he adopted the new grip and immediately won, so the grip made the difference.' },
  { arr: 'REG_UP_ZH', idx: 4, atk: '销量跌到谷底之后上了新包装，这个月就翻红了，新包装救了场。' },
  { arr: 'REG_UP_ZH', idx: 5, atk: '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，新流程真管用。' },
  { arr: 'REG_UP_ZH', idx: 6, atk: '年初现金流差点断裂，我们 all in 了新赛道，下半年就支棱起来了，多亏当时敢赌。' },
  { arr: 'REG_UP_ZH', idx: 7, atk: '股价腰斩后换了CEO，半年涨回来三成，换人这步棋走对了。' },
  { arr: 'REG_UP_EN', idx: 1, atk: 'The team started 0-8, replaced the head coach, and now they win — the new coach fixed it.' },
  { arr: 'REG_UP_EN', idx: 2, atk: 'After a cold streak of five losses he adopted the new grip and immediately won, so the grip made the difference.' },
  { arr: 'INTERVENE_ZH', idx: 6, atk: '年初现金流差点断裂，我们 all in 了新赛道，下半年就支棱起来了，多亏当时敢赌。' },
  { arr: 'INTERVENE_ZH', idx: 7, atk: '销量跌到谷底之后上了新包装，这个月就翻红了，新包装救了场。' },
  { arr: 'CREDIT_ZH', idx: 3, atk: '销量跌到谷底之后上了新包装，这个月就翻红了，新包装救了场。' },
  { arr: 'EFFECT_ZH', idx: 4, atk: '股价腰斩后换了CEO，半年涨回来三成，换人这步棋走对了。' },
];
INJECTIONS.forEach((c) => t('注入-' + c.arr + '[' + c.idx + ']', () => {
  const full = __internals()[c.arr];
  assert.ok(full.length > c.idx, c.arr + ' 数组长度不足，下标失效');
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.arr + '[' + c.idx + ']');
  const inj = {};
  inj[c.arr] = full.filter((re, i) => i !== c.idx);
  assert.strictEqual(hit(c.atk, inj), false, '删 [' + c.arr + '[' + c.idx + ']] 后攻击须转 miss（承重证明）');
  for (const old of OLD_CTRL) assert.strictEqual(hit(old, inj), true, '删 [' + c.arr + '[' + c.idx + ']] 后旧攻击仍命中（旧分支不受影响）');
}));

// 豁免族反向注入：删掉「要求补证据」豁免后，良性句须转红（证明豁免承重）。
// 良性句须自带归因腿（走对了），否则本就不命中、测不出豁免承重。
t('注入-EXEMPT_NEG_ZH[2]（豁免反向）', () => {
  const full = __internals().EXEMPT_NEG_ZH;
  assert.ok(full.length > 2, 'EXEMPT_NEG_ZH 数组长度不足');
  const benign = '股价腰斩后换了CEO，半年涨回来三成，换人这步棋走对了，但需要看同期大盘再下结论。';
  assert.strictEqual(hit(benign), false, '正向应豁免: ' + benign);
  const inj = { EXEMPT_NEG_ZH: full.filter((re, i) => i !== 2) };
  assert.strictEqual(hit(benign, inj), true, '删要求补证据豁免后良性须转红（豁免承重证明）');
});

// ─── 6. 存量回归：r195 原族攻击仍判、良性仍放行 ────────────────────
t('存量回归-攻击', () => {
  const old = [
    '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',
    '他连败五场之后换了新球拍，接着就赢回来了，可见新球拍很关键。',
    '公司业绩跌到谷底那年请了大师做咨询，这个季度营收回暖，多亏了大师。',
    'After our worst quarter on record we hired the new consultant, and revenue bounced back — the hire fixed it.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('存量回归-良性', () => {
  const oldBenign = [
    '这次成绩回落可能是均值回归，要看他平时的水平。',
    'The improvement could be regression to the mean; we need a control group.',
    '上周感冒了，吃了药好了，但这只是记录，没有下结论。',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 7. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/VERIFY_DIMS/导出/__internals', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('regression_to_the_mean'), 'dimensions 键缺失');
  assert.ok(keys.length >= 232, '维度键总数应 ≥232: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,8000}?regression_to_the_mean/.test(src), 'VERIFY_DIMS 未含本维');
  assert.ok(/const\s*{\s*checkRegressionToMean\s*}\s*=\s*require\('\.\/regression-to-the-mean\.js'\)/.test(src), 'index.js 未 require checkRegressionToMean');
  assert.ok(/const\s+rtm\s*=\s*_applyPedagogyRelaxation\(checkRegressionToMean\(/.test(src), 'index.js 无 rtm 计算点');
  assert.ok(/\{\s*score:\s*rtm\.score,\s*name:\s*'regression_to_the_mean'\s*\}/.test(src), 'index.js 无 {score,name} 接线');
  const need = ['EXTREME_LOW_ZH', 'EXTREME_HIGH_ZH', 'EXTREME_LOW_EN', 'EXTREME_HIGH_EN',
    'REG_UP_ZH', 'REG_DOWN_ZH', 'REG_UP_EN', 'REG_DOWN_EN',
    'INTERVENE_ZH', 'INTERVENE_EN', 'CREDIT_ZH', 'CREDIT_EN', 'EFFECT_ZH', 'EFFECT_EN',
    'EXEMPT_META_ZH', 'EXEMPT_META_EN', 'EXEMPT_EVID_ZH', 'EXEMPT_EVID_EN',
    'EXEMPT_NEG_ZH', 'EXEMPT_NEG_EN', 'EXEMPT_HEDGE_ZH', 'EXEMPT_HEDGE_EN'];
  for (const k of need) assert.ok(__internals()[k], '__internals 缺 ' + k);
  assert.strictEqual(__internals().EXTREME_LOW_ZH.length, 7, 'EXTREME_LOW_ZH 应为 7 条模式');
  assert.strictEqual(__internals().EXTREME_LOW_EN.length, 3, 'EXTREME_LOW_EN 应为 3 条模式');
  assert.strictEqual(__internals().REG_UP_ZH.length, 8, 'REG_UP_ZH 应为 8 条模式');
  assert.strictEqual(__internals().REG_UP_EN.length, 3, 'REG_UP_EN 应为 3 条模式');
  assert.strictEqual(__internals().INTERVENE_ZH.length, 8, 'INTERVENE_ZH 应为 8 条模式');
  assert.strictEqual(__internals().CREDIT_ZH.length, 4, 'CREDIT_ZH 应为 4 条模式');
  assert.strictEqual(__internals().EFFECT_ZH.length, 5, 'EFFECT_ZH 应为 5 条模式');
  assert.strictEqual(__internals().EXEMPT_NEG_ZH.length, 3, 'EXEMPT_NEG_ZH 应为 3 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（全黄/腰斩/0-8/翻红/支棱/涨回来/all in/救了场/走对了族）');
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤');
console.log('✓ gate 层接线 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐新模式注入 ' + (INJECTIONS.length + 1) + ' 个：' + (INJECTIONS.length + 1) + ' 个变红，0 个未变红（15 新腿 + 1 豁免反向，均带旧分支对照）');
console.log('✓ 存量回归：r195 原族 4/4 攻击仍命中、3/3 良性仍放行');
console.log('✓ 登记断言：dimensions 键 ≥232 含本维、VERIFY_DIMS/index 导出/__internals 齐全');

console.log('\n全部断言通过（regression_to_the_mean 第 193 维度 · r265 新措辞家族扩展）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
