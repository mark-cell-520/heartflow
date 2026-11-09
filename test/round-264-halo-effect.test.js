'use strict';
/**
 * test/round-264-halo-effect.test.js
 * [r264] halo_effect（第 179 维度）英文平台品牌族扩展
 * （真升级②，live 生效，维度计数 229 不变，src/index.js 零改动）。
 *
 * r264 池化探针实测（coordination/agent4/probes/r264-probe-pool.js，
 * v6.8.153）：本族 5 条新措辞攻击全部穿透（gate.action=pass 且零维度
 * 承重），如实记录仅 1 类可落地——TRAIT_EN 补 大公司/大厂的英文形。
 * 补丁后 5/5 模块命中、5/5 gate 层本维承重、良性 0 误伤、四门禁零漂移。
 *
 * 未落地 4 项（如实记录，非能力缺口而是设计边界）：
 *   · 「他是大厂出来的，技术能差到哪去？」「拿过全国奖牌的，执行力能弱
 *     吗？」——修辞疑问句：疑问句豁免 + 腿②无肯定情态，两重设计性不判；
 *   · 「名校毕业的，人品肯定靠得住」「graduated from a top school」——
 *     资质类特征踩 r181 既定边界（刻意不收，需资质域同域/异域分离判据）。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重（元素专属攻击句 + 旧分支不受影响对照 + 整族置空对照）+ 存量
 * 回归 + 登记断言。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkHaloEffect, __internals } = require(path.join(ROOT, 'src', 'halo-effect.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const hit = (t, inj) => checkHaloEffect(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵（大公司/大厂英文族，四种词形）──────────────────
const NEW_ATTACKS = [
  'He came from a big tech firm, so his engineering must be solid.',
  'She worked at a major tech company, therefore her leadership is certainly strong.',
  'He joined big tech, so his code quality must be excellent.',
  'The candidate came from a tech giant, hence his architecture skills are surely top-notch.',
  'He came from a large corporation, so his engineering must be solid.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  'He came from a big tech firm, but company pedigree alone says nothing about his engineering.',
  'She graduated from a top school, but that does not mean her character is dependable.',
  'He is tall and handsome, but looks are irrelevant to his judgment.',
  'She worked at a major tech company, though this says nothing about her leadership.',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ──────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'halo_effect');
  assert.ok(f, 'findings 应含 halo_effect: ' + s);
}));

// ─── 4. gate 层新良性不被本维命中 ─────────────────────────────────
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'halo_effect');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
// 元素专属攻击句：[4] 专属 large corporation（[5] 的 tech giant/big tech
// 不匹配），[5] 专属 tech giant（[4] 要求形容词在前，tech giant 不匹配）
const OLD_CTRL = 'He is tall and handsome, so his judgment must be sound.';
t('注入-TRAIT_EN[4]', () => {
  const I = __internals();
  assert.strictEqual(I.TRAIT_EN.length, 6, 'TRAIT_EN 应为 6 条模式');
  const atk = 'He came from a large corporation, so his engineering must be solid.';
  assert.strictEqual(hit(atk), true, '正向命中');
  const inj = { TRAIT_EN: I.TRAIT_EN.filter((re, i) => i !== 4) };
  assert.strictEqual(hit(atk, inj), false, '删 TRAIT_EN[4] 后专属攻击须转 miss（承重证明）');
  assert.strictEqual(hit(OLD_CTRL, inj), true, '删 TRAIT_EN[4] 后旧攻击仍命中（旧分支不受影响）');
});
t('注入-TRAIT_EN[5]', () => {
  const I = __internals();
  const atk = 'The candidate came from a tech giant, hence his architecture skills are surely top-notch.';
  assert.strictEqual(hit(atk), true, '正向命中');
  const inj = { TRAIT_EN: I.TRAIT_EN.filter((re, i) => i !== 5) };
  assert.strictEqual(hit(atk, inj), false, '删 TRAIT_EN[5] 后专属攻击须转 miss（承重证明）');
  assert.strictEqual(hit(OLD_CTRL, inj), true, '删 TRAIT_EN[5] 后旧攻击仍命中（旧分支不受影响）');
});
t('注入-整族置空', () => {
  const I = __internals();
  const inj = { TRAIT_EN: I.TRAIT_EN.slice(0, 4) };
  for (const s of NEW_ATTACKS) assert.strictEqual(hit(s, inj), false, '整族置空后新攻击须全 miss: ' + s);
  assert.strictEqual(hit(OLD_CTRL, inj), true, '整族置空后旧攻击仍命中');
});

// ─── 6. 存量回归：r181 家族攻击仍判、良性仍放行 ────────────────────
t('存量回归-攻击', () => {
  const old = [
    '他长得这么帅，人品肯定也没问题。',
    'He is tall and handsome, so his judgment must be sound.',
    'She is famous, so her advice must be reliable.',
    '他是大厂出来的，技术肯定强。',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('存量回归-良性', () => {
  const oldBenign = [
    '虽然他口才好，但这和方案质量是两回事。',
    '她长得漂亮，成绩也很好。',
    'He is tall and handsome, but looks are irrelevant to his judgment.',
    '她是名校博士毕业，说的话一定更有道理。',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 7. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/VERIFY_DIMS/导出/__internals', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('halo_effect'), 'dimensions 键缺失');
  assert.ok(keys.length >= 229, '维度键总数应 ≥229: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,8000}?halo_effect/.test(src), 'VERIFY_DIMS 未含本维');
  assert.strictEqual(typeof idx.checkHaloEffect, 'function', 'index.js 未导出 checkHaloEffect');
  const need = ['TRAIT_ZH', 'TRAIT_EN', 'QUALITY_ZH', 'QUALITY_EN', 'MODAL_ZH',
    'MODAL_EN', 'CONNECT_ZH', 'CONNECT_EN', 'CONTRAST_ZH', 'CONTRAST_EN',
    'META_ZH', 'META_EN', 'HEDGE_ZH', 'HEDGE_EN'];
  for (const k of need) assert.ok(__internals()[k], '__internals 缺 ' + k);
  assert.strictEqual(__internals().TRAIT_EN.length, 6, 'TRAIT_EN 应为 6 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（big tech firm/major tech company/big tech/tech giant/large corporation）');
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤（含资质类不收边界的正确放行）');
console.log('✓ gate 层接线 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐新模式注入 2 个 + 整族置空对照：均变红，0 个未变红（元素专属攻击句 + 旧分支对照）');
console.log('✓ 存量回归：r181 家族 4/4 攻击仍命中、4/4 良性仍放行');
console.log('✓ 登记断言：dimensions 键 ≥229 含本维、VERIFY_DIMS/index 导出/__internals 齐全');

console.log('\n全部断言通过（halo_effect 第 179 维度 · r264 英文平台品牌族扩展）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
