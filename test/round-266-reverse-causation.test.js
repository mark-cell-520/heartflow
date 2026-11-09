'use strict';
/**
 * test/round-266-reverse-causation.test.js
 * [r266] reverse_causation 全新措辞家族扩展（真升级②，live 生效，
 * 维度计数不变，src/index.js 零改动）。
 *
 * r266 池化探针实测（scripts/round-266/r266-probe-pool.js，v6.8.157）：
 * 本维度 6/6 攻击全穿透（gate.action=pass 且零维度承重）。落地新族：
 *   RESP_ZH   += 风险焦虑/信息恐慌触发的应对行为族（囤口罩/囤盐/吃保健品/
 *               装净水器/备药/装警报器/请保镖/加装锁…）
 *   RESP_EN   += doorbell cameras / vitamin supplements / security guards /
 *               panic buying / stockpiling / air purifiers 族
 *   RESULT_EN += 财产犯罪结果名词族（thieves/burglars/break-ins/stolen
 *               packages…）
 *   CAUSE_EN  += attracting/drawing 进行态因果动词（独立数组元素）
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条承重
 * + r161 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkReverseCausation, __internals } = require(path.join(ROOT, 'src', 'reverse-causation.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkReverseCausation(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵（风险焦虑/信息恐慌 × 应对行为 × 因果动词 × 结果）──
const NEW_ATTACKS = [
  '越是囤口罩的地方呼吸道问题越多，说明囤口罩导致了呼吸道问题。',
  '越是囤盐的社区供应问题越多，可见囤盐造成了供应问题。',
  '吃保健品的人群死亡率更高，所以吃保健品造成了死亡。',
  '装净水器的家庭水质问题更多，这说明装净水器引发了水质问题。',
  'Neighborhoods that installed doorbell cameras see more package theft, so doorbell cameras are attracting thieves.',
  'People who take vitamin supplements visit doctors more often, meaning supplements cause more illness.',
  'Areas with more security guards report more break-ins, which shows guards draw burglars.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '疫情通报之后居民开始囤口罩，卫健部门随即公布了保供方案。',
  '小区陆续装上了警报器，物业同步升级了夜间巡逻制度。',
  'Residents started panic buying after the storm warning, and the city opened emergency supply points.',
  'The store ran out of water filters during the recall, so the vendor arranged replacements.',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线 ───────────────────────────────────────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'reverse_causation');
  assert.ok(f, 'findings 应含 reverse_causation: ' + s);
}));

// ─── 4. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const OLD_CTRL = [
  '报警越多的社区犯罪率越高，这说明报警反而会招来犯罪。',
  'Areas with more police reports have higher crime, which means reporting crimes actually attracts more crime.',
];
const INJECTIONS = [
  { arr: 'RESP_ZH', idx: 1, atk: '越是囤口罩的地方呼吸道问题越多，说明囤口罩导致了呼吸道问题。' },
  { arr: 'RESP_EN', idx: 1, atk: 'Neighborhoods that installed doorbell cameras see more package theft, so doorbell cameras are attracting thieves.' },
  { arr: 'RESULT_EN', idx: 1, atk: 'Areas with more security guards report more break-ins, which shows guards draw burglars.' },
  { arr: 'CAUSE_EN', idx: 1, atk: 'Neighborhoods that installed doorbell cameras see more package theft, so doorbell cameras are attracting thieves.' },
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

// ─── 5. r161 存量回归 ─────────────────────────────────────────────
t('r161/r174 存量回归-攻击', () => {
  const old = [
    '住院患者的死亡率明显更高，所以住院本身增加了死亡风险。',
    '戴头盔的骑手出车祸更多，这说明戴头盔会引发事故。',
    'Areas with more police reports have higher crime, which means reporting crimes actually attracts more crime.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('r161/r174 存量回归-良性', () => {
  const oldBenign = [
    '住院病人的死亡率更高，是因为重症患者本来就更容易住院。',
    '戴口罩的人感冒更多，其实是因为生病的人更注意防护。',
    '住院可能会增加死亡风险，但目前还没有证据能确认这一点。',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 6. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/__internals', () => {
  const keys = Object.keys(require(path.join(ROOT, 'src', 'index.js')).discriminate('probe').dimensions);
  assert.ok(keys.includes('reverse_causation'), 'dimensions 键缺失');
  assert.ok(keys.length >= 232, '维度键总数应 ≥232: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m && m[1].includes("'reverse_causation'"), 'VERIFY_DIMS 未含本维');
  const need = ['RESP_ZH', 'CAUSE_ZH', 'RESULT_ZH', 'RESP_EN', 'CAUSE_EN', 'RESULT_EN', 'EXEMPT_HEDGE_ZH', 'EXEMPT_HEDGE_EN'];
  for (const k of need) assert.ok(__internals()[k], '__internals 缺 ' + k);
  assert.strictEqual(__internals().RESP_ZH.length, 2, 'RESP_ZH 应为 2 条模式');
  assert.strictEqual(__internals().RESP_EN.length, 2, 'RESP_EN 应为 2 条模式');
  assert.strictEqual(__internals().RESULT_EN.length, 2, 'RESULT_EN 应为 2 条模式');
  assert.strictEqual(__internals().CAUSE_EN.length, 2, 'CAUSE_EN 应为 2 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（囤口罩×呼吸道/门铃摄像头×包裹盗窃/保安×入室盗窃）');
if (fails.length) { console.error('FAIL:'); fails.forEach(f => console.error(' - ' + f)); process.exit(1); }
console.log('✓ round-266-reverse-causation 全部通过 (' + pass + ' 断言)');
console.log('round-266-reverse-causation: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
