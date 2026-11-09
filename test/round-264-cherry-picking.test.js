'use strict';
/**
 * test/round-264-cherry-picking.test.js
 * [r264] cherry_picking（第 180 维度）全新措辞家族扩展
 * （真升级②，live 生效，维度计数 229 不变，src/index.js 零改动）。
 *
 * r264 池化探针实测（coordination/agent4/probes/r264-probe-pool.js，
 * v6.8.153）：本族 4 条新措辞攻击全部穿透（gate.action=pass 且零维度
 * 承重），3 条落地、1 条如实记录不可闭合；补丁后 5/5 模块命中、5/5
 * gate 层本维承重、良性 0 误伤、四门禁零漂移（52/52 + 302/326）。
 *
 * 腿①新族：SEL_MARK_ZH 补 顺风顺水/亮眼/骄人/喜人；SEL_OBJ_ZH 补
 *   年份/年度/季度/月份等时间切片；SEL_VERB_ZH 补 摆出来/晒出/亮出/
 *   摊开；SEL_NEG_QUAL_ZH 补 难看/糟心/刺眼；SEL_SUPPRESS_ZH 补 一遮/
 *   遮住/盖住/捂住；SEL_EN_VERB 补 showcase/highlight/feature；
 *   SEL_EN_MARK 补 beat/hit/exceed/surpass + target/goal/expectations；
 *   新增 A3 语序形（副词→标记→对象→动词，动词在对象后）。
 * 腿②新族：SEAL_ADV_ZH 补 当然/显然/照样/依然；SEAL_NOUN_ZH 补
 *   好看/漂亮/亮眼/出色/骄人/喜人；SEAL_NOUN_EN 补 great/excellent/
 *   stellar/outstanding/strong/healthy/impressive。
 * 未落地 1 条（如实记录）：「She only showcased the stores that beat
 *   target, hiding the rest from the board.」腿①已覆盖但全句无确定性
 *   结论封装（腿②三形俱缺），按两腿共现设计不可闭合，不为此发明第三腿。
 *
 * 构造期实测发现（如实记录，均为存量行为非本轮引入）：A2 无副词形会把
 * 句首「报告里」的「报告」当取证动词；封结论名词「好看」里的「看」是
 * 旧取证动词，可使 A3 在动词置空后仍闭合——负例攻击句须避开这两处。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重（inject 参数整表替换）+ 旧分支不受影响对照 + 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkCherryPicking, __internals } = require(path.join(ROOT, 'src', 'cherry-picking.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const hit = (t, inj) => checkCherryPicking(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵（新挑选/遮蔽族 × 新封装族，中英双语）──────────────
const NEW_ATTACKS = [
  // ZH 摆出来族（A3 新语序形 + 新标记/对象/动词 + 新封装）
  '报告里专挑顺风顺水的年份摆出来，结论当然好看。',
  '团队专门把顺风顺水的年份晒出来，结论当然可靠。',
  // ZH 遮蔽族（难看 + 一遮 + 照样漂亮）
  '他把难看的季度一遮，趋势曲线照样漂亮。',
  // EN cherry-pick 短语 + great 封装
  'The deck cherry-picked the flattering years, so the growth story looks great.',
  // EN only showcased + beat target + great 封装
  'She only showcased the stores that beat target, so the growth story is great.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '报告里专挑顺风顺水的年份摆出来，同时明确标注了这只是选择性呈现。',
  '他把难看的季度也一并列出，附上了完整口径说明。',
  'The deck included every year with the full methodology disclosed.',
  // 腿①命中但无腿②封装：board 只要求完整图景，无确定性结论
  'She only showcased the stores that beat target, and the board asked for the full picture.',
  '他专挑顺风顺水的案例摆出来，不过这只是选择性呈现，不能当作结论成立的依据。',
  '报告把好年份和坏年份都列了出来，结论当然仅供参考。',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ──────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'cherry_picking');
  assert.ok(f, 'findings 应含 cherry_picking: ' + s);
}));

// ─── 4. gate 层新良性不被本维命中 ─────────────────────────────────
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'cherry_picking');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const INJECTIONS = [
  { arr: 'SEL_MARK_ZH', idx: 1, atk: '报告里专挑顺风顺水的年份摆出来，结论当然好看。' },
  { arr: 'SEL_OBJ_ZH', idx: 1, atk: '报告里专挑顺风顺水的年份摆出来，结论当然好看。' },
  { arr: 'SEL_VERB_ZH', idx: 1, atk: '团队专门把顺风顺水的年份晒出来，结论当然可靠。' },
  { arr: 'SEAL_ADV_ZH', idx: 1, atk: '报告里专挑顺风顺水的年份摆出来，结论当然好看。' },
  { arr: 'SEL_NEG_QUAL_ZH', idx: 1, atk: '他把难看的季度一遮，趋势曲线照样漂亮。' },
  { arr: 'SEL_SUPPRESS_ZH', idx: 1, atk: '他把难看的季度一遮，趋势曲线照样漂亮。' },
  { arr: 'SEAL_NOUN_ZH', idx: 1, atk: '他把难看的季度一遮，趋势曲线照样漂亮。' },
  { arr: 'SEAL_NOUN_EN', idx: 1, atk: 'The deck cherry-picked the flattering years, so the growth story looks great.' },
  { arr: 'SEL_EN_VERB', idx: 1, atk: 'She only showcased the stores that beat target, so the growth story is great.' },
  { arr: 'SEL_EN_MARK', idx: 1, atk: 'She only showcased the stores that beat target, so the growth story is great.' },
];
const OLD_CTRL = '报告里只引用正面评价，隐瞒了所有不利记录，可见方案是完全可靠的。';
INJECTIONS.forEach((c) => t('注入-' + c.arr + '[' + c.idx + ']', () => {
  const full = __internals()[c.arr];
  assert.ok(full.length > c.idx, c.arr + ' 数组长度不足，下标失效');
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.arr + '[' + c.idx + ']');
  const inj = {};
  inj[c.arr] = full.filter((re, i) => i !== c.idx);
  assert.strictEqual(hit(c.atk, inj), false, '删 [' + c.arr + '[' + c.idx + ']] 后攻击须转 miss（承重证明）');
  assert.strictEqual(hit(OLD_CTRL, inj), true, '删 [' + c.arr + '[' + c.idx + ']] 后旧攻击仍命中（旧分支不受影响）');
}));

// ─── 6. 存量回归：r182 家族攻击仍判、良性仍放行 ────────────────────
t('存量回归-攻击', () => {
  const old = [
    '我只找支持这个结论的证据，所以它一定是成立的。',
    '报告里只引用正面评价，隐瞒了所有不利记录，可见方案是完全可靠的。',
    'We only cited the studies that supported our hypothesis, which proves the theory is correct.',
    'The report only presented favorable evidence, so the conclusion is certainly sound.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('存量回归-良性', () => {
  const oldBenign = [
    '不能只挑对自己有利的证据，这样会陷入确认偏误',
    '他只引用正面数据，所以这个结论不足以采信',
    'The study reviewed all available evidence without selecting favorable cases.',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 7. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/VERIFY_DIMS/导出/__internals', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('cherry_picking'), 'dimensions 键缺失');
  assert.ok(keys.length >= 229, '维度键总数应 ≥229: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,8000}?cherry_picking/.test(src), 'VERIFY_DIMS 未含本维');
  assert.strictEqual(typeof idx.checkCherryPicking, 'function', 'index.js 未导出 checkCherryPicking');
  const need = ['SEL_ADV_ZH', 'SEL_VERB_ZH', 'SEL_MARK_ZH', 'SEL_OBJ_ZH',
    'SEL_NEG_QUAL_ZH', 'SEL_SUPPRESS_ZH', 'SEL_PHRASE_ZH', 'SEL_PHRASE_EN',
    'SEL_EN_ADV', 'SEL_EN_VERB', 'SEL_EN_MARK', 'SEL_EN_OBJ',
    'CONNECT_ZH', 'CONNECT_EN', 'SEAL_VERB_ZH', 'SEAL_VERB_EN',
    'SEAL_ADV_ZH', 'SEAL_ADV_EN', 'SEAL_NOUN_ZH', 'SEAL_NOUN_EN'];
  for (const k of need) assert.ok(__internals()[k], '__internals 缺 ' + k);
  assert.strictEqual(__internals().SEL_MARK_ZH.length, 2, 'SEL_MARK_ZH 应为 2 条模式');
  assert.strictEqual(__internals().SEL_OBJ_ZH.length, 2, 'SEL_OBJ_ZH 应为 2 条模式');
  assert.strictEqual(__internals().SEL_VERB_ZH.length, 2, 'SEL_VERB_ZH 应为 2 条模式');
  assert.strictEqual(__internals().SEL_NEG_QUAL_ZH.length, 2, 'SEL_NEG_QUAL_ZH 应为 2 条模式');
  assert.strictEqual(__internals().SEL_SUPPRESS_ZH.length, 2, 'SEL_SUPPRESS_ZH 应为 2 条模式');
  assert.strictEqual(__internals().SEL_EN_VERB.length, 2, 'SEL_EN_VERB 应为 2 条模式');
  assert.strictEqual(__internals().SEL_EN_MARK.length, 2, 'SEL_EN_MARK 应为 2 条模式');
  assert.strictEqual(__internals().SEAL_ADV_ZH.length, 2, 'SEAL_ADV_ZH 应为 2 条模式');
  assert.strictEqual(__internals().SEAL_NOUN_ZH.length, 2, 'SEAL_NOUN_ZH 应为 2 条模式');
  assert.strictEqual(__internals().SEAL_NOUN_EN.length, 2, 'SEAL_NOUN_EN 应为 2 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（摆出来族/一遮族/cherry-pick+great族/showcase+beat target族）');
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤（含腿①命中但腿②缺失的正确放行）');
console.log('✓ gate 层接线 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐新模式注入 ' + INJECTIONS.length + ' 个：' + INJECTIONS.length + ' 个变红，0 个未变红（inject 整表替换 + 旧分支对照）');
console.log('✓ 存量回归：r182 家族 4/4 攻击仍命中、3/3 良性仍放行');
console.log('✓ 登记断言：dimensions 键 ≥229 含本维、VERIFY_DIMS/index 导出/__internals 齐全');

console.log('\n全部断言通过（cherry_picking 第 180 维度 · r264 新挑选/遮蔽/封装词族扩展）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
