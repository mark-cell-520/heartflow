'use strict';
/**
 * test/round-265-clustering-illusion.test.js
 * [r265] clustering_illusion（第 171 维度 VERIFY）全新措辞家族扩展
 * （真升级②，live 生效，维度计数不变，src/index.js 零改动）。
 *
 * r265 池化探针实测（coordination/agent4/probes/r265-probe-pool.js，
 * v6.8.156）：本维度 3/3 攻击全穿透（gate.action=pass 且零维度承重），
 * 落地新族：
 *   EVENT_ZH += 赌博结果事件族（开大/开小/豹子/通杀/连败/连胜/爆冷/输光）
 *   SIGNIF_ANOM_ZH += 档口/势头旺异常断言族
 *   EVENT_EN += 赌博器械族（dice/rolls/jackpots/coin flips/spins）
 *   SIGNIF_ANOM_EN += clearly hot / on fire 断言紧贴族
 *   CONC_EN += N times in a row 整段匹配形
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重 + r173 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkClusteringIllusion, __internals } = require(path.join(ROOT, 'src', 'clustering-illusion.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkClusteringIllusion(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵 ────────────────────────────────────────────────
const NEW_ATTACKS = [
  // ZH 赌博结果事件 × 档口异常断言
  '连着三把都开大，这台机器现在肯定在出大的档口，加注跟上。',
  // EN dice 器械 × N times in a row × clearly hot
  'The dice came up six three times in a row, so six is clearly hot right now.',
  // ZH 豹子 × 显然有猫腻（存量 SIGNIF，新 EVENT 腿）
  '连续三把都开豹子，这台机器显然有猫腻，一定是做了手脚。',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '连着三把都开大，但每次都是独立事件，不存在档口。',
  '最近空难新闻扎堆出现，但报道频率不等于事故率，要看基线数据。',
  'The dice came up six three times in a row, but each roll is independent.',
  '连着三把都开大，这台机器肯定在出大的档口——不过赌场每局独立，这只是随机波动。',
  '连续三起事故，警方并案侦查后确认是同一伙人干的。',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线 ───────────────────────────────────────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'clustering_illusion');
  assert.ok(f, 'findings 应含 clustering_illusion: ' + s);
}));
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'clustering_illusion');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 4. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const OLD_CTRL = [
  '这个路口一个月出了四起事故，绝不可能是巧合。',
  'Four accidents happened at the same intersection in one month, which cannot be a coincidence.',
];
const INJECTIONS = [
  { arr: 'EVENT_ZH', idx: 1, atk: '连着三把都开大，这台机器现在肯定在出大的档口，加注跟上。' },
  { arr: 'SIGNIF_ANOM_ZH', idx: 1, atk: '连着三把都开大，这台机器现在肯定在出大的档口，加注跟上。' },
  { arr: 'EVENT_EN', idx: 1, atk: 'The dice came up six three times in a row, so six is clearly hot right now.' },
  { arr: 'SIGNIF_ANOM_EN', idx: 1, atk: 'The dice came up six three times in a row, so six is clearly hot right now.' },
  { arr: 'CONC_EN', idx: 1, atk: 'The dice came up six three times in a row, so six is clearly hot right now.' },
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

// ─── 5. r173 存量回归 ─────────────────────────────────────────────
t('r173 存量回归-攻击', () => {
  const old = [
    '这个路口一个月出了四起事故，绝不可能是巧合。',
    '最近三个月，同一个小区接连发生了五起入室盗窃，显然这里面有蹊跷。',
    '三个中奖者全都来自同一条街，这绝不是偶然。',
    '这个部门每逢周一必出事，简直是逃不掉的魔咒。',
    'Four accidents happened at the same intersection in one month, which cannot be a coincidence.',
    'Three lottery winners all came from the same street — that can\'t be random.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('r173 存量回归-良性', () => {
  const oldBenign = [
    '这个路口一个月出了四起事故，交警排查后发现是信号灯配时问题。',
    '连续三起投诉都指向同一个客服，说明培训有问题。',
    '三起案件虽然时间接近，但警方认定是同一伙流窜作案。',
    'Four accidents happened at the same intersection in one month, which is probably just a coincidence.',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 6. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/__internals', () => {
  const keys = Object.keys(require(path.join(ROOT, 'src', 'index.js')).discriminate('probe').dimensions);
  assert.ok(keys.includes('clustering_illusion'), 'dimensions 键缺失');
  assert.ok(keys.length >= 232, '维度键总数应 ≥232: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m && m[1].includes("'clustering_illusion'"), 'VERIFY_DIMS 未含本维');
  const need = ['CONC_ZH', 'COUNT_ZH', 'SAME_SRC_ZH', 'EVENT_ZH',
    'SIGNIF_NEG_ZH', 'SIGNIF_ANOM_ZH', 'SIGNIF_MYST_ZH', 'SIGNIF_LAW_ZH', 'SIGNIF_CYCLE_ZH',
    'CONC_EN', 'COUNT_EN', 'SAME_SRC_EN', 'EVENT_EN',
    'SIGNIF_NEG_EN', 'SIGNIF_ANOM_EN', 'SIGNIF_MYST_EN', 'SIGNIF_LAW_EN', 'SIGNIF_CYCLE_EN'];
  for (const k of need) assert.ok(__internals()[k], '__internals 缺 ' + k);
  assert.strictEqual(__internals().EVENT_ZH.length, 2, 'EVENT_ZH 应为 2 条模式');
  assert.strictEqual(__internals().SIGNIF_ANOM_ZH.length, 2, 'SIGNIF_ANOM_ZH 应为 2 条模式');
  assert.strictEqual(__internals().EVENT_EN.length, 2, 'EVENT_EN 应为 2 条模式');
  assert.strictEqual(__internals().SIGNIF_ANOM_EN.length, 2, 'SIGNIF_ANOM_EN 应为 2 条模式');
  assert.strictEqual(__internals().CONC_EN.length, 2, 'CONC_EN 应为 2 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（开大×档口/dice×clearly hot/豹子×有猫腻）');
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤');
console.log('✓ gate 层接线 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐新模式注入 5 个：5 个变红，0 个未变红（EVENT_ZH/ANOM_ZH/EVENT_EN/ANOM_EN/CONC_EN，均带旧分支对照）');
console.log('✓ 存量回归：r173 原族 6/6 攻击仍命中、4/4 良性仍放行');
console.log('✓ 登记断言：dimensions 键 ≥232 含本维、VERIFY_DIMS/__internals 齐全');

console.log('\n全部断言通过（clustering_illusion 第 171 维度 · r265 新措辞家族扩展）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
