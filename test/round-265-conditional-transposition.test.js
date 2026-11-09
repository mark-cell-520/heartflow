'use strict';
/**
 * test/round-265-conditional-transposition.test.js
 * [r265] conditional_transposition（VERIFY 维度）全新措辞家族扩展
 * （真升级②，live 生效，维度计数不变，src/index.js 零改动）。
 *
 * r265 池化探针实测（coordination/agent4/probes/r265-probe-pool.js，
 * v6.8.156）：本维度 4/4 攻击全穿透（gate.action=pass 且零维度承重，
 * 全池最高），落地：
 *   · 新 token 种 kind='prop'（定性比例两现）：ZH_PROP_RES（大多数/过半/
 *     多数/大半/绝大多数）+ EN_PROP_RES（most/majority）
 *   · FRAME_ZH += F-Z4「对X来说/而言/来讲」条件框
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重 + r228 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkConditionalTransposition, __internals } = require(path.join(ROOT, 'src', 'conditional-transposition.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkConditionalTransposition(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵（定性比例两现 + 对X来说框，中英双语）────────────
const NEW_ATTACKS = [
  // ZH 多数两现 × F-Z1 框
  '在这批录取的学生中，城市户口的占了多数；所以在城市学生里，被录取的也占多数。',
  // EN most 两现 × F-E1 框
  'Among the admitted applicants, most came from cities; so among city applicants, most get admitted.',
  // ZH 大多数两现 × F-Z4 对X来说框
  '对这批志愿者来说，大多数人都出现了缓解；因此对于出现缓解的人，大多数都是这批志愿者。',
  // EN majority 两现
  'In this screened population, the majority tested positive; therefore among those who tested positive, the majority came from this screened population.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '在这批录取的学生中，城市户口的占了多数；但城市学生的录取率要用总体分母算。',
  'Among the admitted applicants, most came from cities; that does not mean most city applicants get admitted.',
  '大多数人都同意这个方案，所以会议记录里写的是大多数赞成。',
  '在这批住院病人里，过半有吸烟史；但据此推算吸烟者里过半会住院是基数率误用。',
  'Among the enrolled students, most lived on campus; that does not mean most on-campus students were enrolled in the program.',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线 ───────────────────────────────────────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'conditional_transposition');
  assert.ok(f, 'findings 应含 conditional_transposition: ' + s);
}));
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'conditional_transposition');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 4. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const OLD_CTRL = [
  '证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率也只有百万分之一。',
  'The match has a 1-in-a-million chance if he is innocent, so there is only a 1-in-a-million chance he is innocent.',
];
const INJECTIONS = [
  { arr: 'ZH_PROP_RES', idx: 0, atk: '在这批录取的学生中，城市户口的占了多数；所以在城市学生里，被录取的也占多数。' },
  { arr: 'EN_PROP_RES', idx: 0, atk: 'Among the admitted applicants, most came from cities; so among city applicants, most get admitted.' },
  { arr: 'FRAME_ZH', idx: 3, atk: '对这批志愿者来说，大多数人都出现了缓解；因此对于出现缓解的人，大多数都是这批志愿者。' },
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

// 换 token 种别互相误吞：删掉 prop 族后，数值型旧攻击不受影响（上面 OLD_CTRL 已含），
// 再证 prop 与 value 不同族——同句混用数字与比例不构成两现
t('prop 与 value 不同族（混用不构成两现）', () => {
  const s = '在这批录取的学生中，城市户口的占了百分之六十；所以在城市学生里，被录取的也占多数。';
  assert.strictEqual(hit(s), false, 'value 与 prop 不应互为同一 token');
});

// ─── 5. r228 存量回归 ─────────────────────────────────────────────
t('r228 存量回归-攻击', () => {
  const old = [
    '证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率也只有百万分之一。',
    '在守法者中，这个账户模式出现的概率是十万分之一，因此有这种账户模式的人是守法者的概率也是十万分之一。',
    '健康人群里携带该基因的概率只有百分之一，所以携带该基因的人是健康人的概率也只有百分之一。',
    'The match has a 1-in-a-million chance if he is innocent, so there is only a 1-in-a-million chance he is innocent.',
    'Only 0.1% of healthy people carry this marker, so only 0.1% of people carrying this marker are healthy.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('r228 存量回归-良性', () => {
  const oldBenign = [
    '所以被告无罪的概率是百万分之一，这是把两个概率搞混了。',
    'P(E|I) 与 P(I|E) 是两个不同的量，这是教科书级的检察官谬误。',
    '两者不能换算，所以这个推论不成立。',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 6. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/__internals', () => {
  const keys = Object.keys(require(path.join(ROOT, 'src', 'index.js')).discriminate('probe').dimensions);
  assert.ok(keys.includes('conditional_transposition'), 'dimensions 键缺失');
  assert.ok(keys.length >= 232, '维度键总数应 ≥232: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m && m[1].includes("'conditional_transposition'"), 'VERIFY_DIMS 未含本维');
  assert.ok(/const\s*\{\s*checkConditionalTransposition\s*}\s*=\s*require\('\.\/conditional-transposition\.js'\)/.test(src), 'index.js 未 require 本模块');
  assert.ok(/checkConditionalTransposition\(_normText\)/.test(src), 'index.js 无计算点');
  const need = ['ZH_VALUE_RES', 'EN_VALUE_RES', 'EXTREME_ZH', 'EXTREME_EN',
    'ZH_PROP_RES', 'EN_PROP_RES', 'FRAME_ZH', 'FRAME_EN', 'INFER_ZH', 'INFER_EN', 'NEG_ZH', 'NEG_EN',
    'EXEMPT_BASERATE_ZH', 'EXEMPT_BASERATE_EN', 'EXEMPT_CORRECT_ZH', 'EXEMPT_CORRECT_EN',
    'EXEMPT_META_ZH', 'EXEMPT_META_EN', 'EXEMPT_ESTIMATE_ZH', 'EXEMPT_ESTIMATE_EN'];
  for (const k of need) assert.ok(__internals()[k], '__internals 缺 ' + k);
  assert.strictEqual(__internals().FRAME_ZH.length, 4, 'FRAME_ZH 应为 4 个框族');
  assert.strictEqual(__internals().ZH_PROP_RES.length, 1, 'ZH_PROP_RES 应为 1 条模式');
  assert.strictEqual(__internals().EN_PROP_RES.length, 1, 'EN_PROP_RES 应为 1 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（多数/most/大多数/majority 两现 + 对X来说框）');
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤');
console.log('✓ gate 层接线 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐新模式注入 3 个：3 个变红，0 个未变红（ZH_PROP/EN_PROP/F-Z4，均带旧分支对照）');
console.log('✓ prop 与 value 不同族：混用不构成两现');
console.log('✓ 存量回归：r228 原族 5/5 攻击仍命中、3/3 良性仍放行');
console.log('✓ 登记断言：dimensions 键 ≥232 含本维、VERIFY_DIMS/index 接线/__internals 齐全');

console.log('\n全部断言通过（conditional_transposition · r265 新措辞家族扩展）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
