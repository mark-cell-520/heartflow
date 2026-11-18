'use strict';
/**
 * test/round-376-money-creation.test.js — r376「存款创造贷款误解」子族轮测
 *
 * 背景：r376 立项探针（scripts/round-376/probe-r376-pool.js 12 候选同池 +
 * probe-r376-scope.js 前四名二段深探）定拨 C_money_creation：二段深探穿透
 * 8/10 真零命中（存量维度零覆盖）、良性 8 条仅 1 条非 pass（存量 confidence
 * 误伤，非本族增量）。海外扫描空返（arXiv parse-fail / GitHub 0 / S2 ?），
 * 按既有形态自建。子族聚合进 econ_reasoning_gate 单维度（src/index.js 零
 * 改动、VERSION 不动），属真升级类型②（聚合族全新措辞家族）。
 *
 * 覆盖：A 模块层攻击/良性 → B 结构（双腿/豁免/守卫承重）→ C 引擎 gate 兑现
 * → D 插件层接线 → E 负例注入-删条（17 组，删则该句从豁免/守卫生效翻为命中，
 * 或该族从命中中消失）→ F 射程邻接核查（money_illusion 对攻击句零命中）。
 */

const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const { detectMoneyCreation, __internals } = require(path.join(ROOT, 'src', 'money-creation.js'));
const gate = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

let pass = 0, fail = 0;
function T(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const ATTACK = [
  '银行放贷用的是储户的存款，没有存款增长就没有贷款。',
  '贷款是动用别人的储蓄，所以储蓄不足经济就没有投资的钱。',
  '一个社会的钱就那么多，银行把钱贷出去，别人能用的钱就少了。',
  '只有先让大家多存钱，银行才有钱放贷，投资才能增长。',
  '银行只是个中介，一头收存款一头放贷款，钱从左口袋倒到右口袋，不会变多。',
  '企业能贷到多少款，完全取决于银行里有多少存款。',
  '存款是贷款的前提，先把储蓄率提上去，信贷自然就充裕了。',
  '信贷规模由存款总量决定，存款不增加，贷款就不可能增加。',
  'Banks lend out the deposits of their savers — no new deposits means no new loans.',
  'The amount banks can lend is strictly limited by the deposits they hold.',
];
const BENIGN = [
  '现代银行体系通过放贷创造存款，贷款并不严格受制于既有储蓄。',
  '贷款创造存款是银行货币创造的机制，储蓄是放贷的结果而非前提。',
  '存款是银行负债而非放贷资金来源的约束，银行信贷受资本充足率和监管约束。',
  '在非银行融资或封闭经济模型里讨论存贷关系时，需要注意不同制度框架下的结论不同。',
  '储蓄率高不一定带来更多投资，但适度的储蓄为金融体系提供了稳定性。',
  'Deposits and loans are two sides of bank balance sheets; lending creates deposits in modern systems.',
  'Banks are constrained by capital requirements and regulation, not merely by existing deposits.',
  'The loanable funds view emphasizes the role of savings, though it is contested by modern monetary theory.',
];

console.log('=== A 模块层：攻击命中 / 良性豁免 ===');
T('A1 10 条攻击全命中', () => {
  for (const t of ATTACK) assert.ok(detectMoneyCreation(t).hit, '未命中: ' + t);
});
T('A2 8 条良性全豁免', () => {
  for (const t of BENIGN) assert.ok(!detectMoneyCreation(t).hit, '误伤: ' + t);
});
T('A3 返回体字段齐备（dimension/severity/details/guidance）', () => {
  const r = detectMoneyCreation(ATTACK[0]);
  assert.strictEqual(r.dimension, 'money_creation');
  assert.ok(r.severity >= 60 && r.severity <= 100, 'severity=' + r.severity);
  assert.ok(r.details.includes('存款创造贷款误解'));
  assert.ok(r.guidance.includes('贷款创造存款') && r.guidance.includes('资本充足率'));
});
T('A4 短文本/空文本守卫', () => {
  assert.strictEqual(detectMoneyCreation('').hit, false);
  assert.strictEqual(detectMoneyCreation(null).hit, false);
  assert.strictEqual(detectMoneyCreation('存款').hit, false);
});

console.log('=== B 结构承重（双腿/豁免/守卫注入后翻转）===');
const NEVER = /(?!)/i;
T('B1 腿① CTX_ZH 删 → ZH 攻击不命中', () => {
  assert.ok(!detectMoneyCreation(ATTACK[0], { CTX_ZH: [] }).hit);
});
T('B2 腿① CTX_EN 删 → EN 攻击不命中', () => {
  assert.ok(!detectMoneyCreation(ATTACK[9], { CTX_EN: [] }).hit);
});
T('B3 腿② SOURCE_ZH 全删 → ZH 攻击不命中', () => {
  const inject = {};
  for (const [name] of __internals().SOURCE_ZH_GROUPS) inject[name] = [];
  assert.ok(!detectMoneyCreation(ATTACK[0], inject).hit);
});
T('B4 腿② SOURCE_EN 全删 → EN 攻击不命中', () => {
  const inject = {};
  for (const [name] of __internals().SOURCE_EN_GROUPS) inject[name] = [];
  assert.ok(!detectMoneyCreation(ATTACK[9], inject).hit);
});
T('B5 PAIR_ZH=0 → 远距两腿共现句不命中', () => {
  const t = '存款和贷款谁先谁后，是货币银行学的经典问题；说到底，银行只是个中介。';
  assert.ok(detectMoneyCreation(t).hit, '前提：远距句应命中');
  assert.ok(!detectMoneyCreation(t, { PAIR_ZH: 0 }).hit);
});
T('B6 S3_ZH 删 → 「存款是贷款的前提」句不命中', () => {
  assert.ok(detectMoneyCreation('存款是贷款的前提，银行才有钱放贷。').hit);
  assert.ok(!detectMoneyCreation('存款是贷款的前提，银行才有钱放贷。', { SOURCE_S3_ZH: NEVER }).hit);
});
T('B7 CONCEPT_ZH 删 → 理论讨论句翻红（可贷资金框架豁免承重）', () => {
  const t = '可贷资金理论认为贷款来自储蓄，这一观点是有争议的。';
  assert.ok(!detectMoneyCreation(t).hit);
  assert.ok(detectMoneyCreation(t, { CONCEPT_ZH: NEVER }).hit);
});
T('B8 CORRECT_ZH 删 → 纠正句翻红（靠/用的不是存款豁免承重）', () => {
  const t = '放贷靠的不是储户的存款，而是贷款创造的存款。';
  assert.ok(!detectMoneyCreation(t).hit);
  assert.ok(detectMoneyCreation(t, { CORRECT_ZH: NEVER }).hit);
});
T('B9 NEG_ZH 删 → 「这并不是说贷款来自存款」翻红（紧前否定守卫承重）', () => {
  const t = '这并不是说贷款来自存款。';
  assert.ok(!detectMoneyCreation(t).hit);
  assert.ok(detectMoneyCreation(t, { NEG_ZH: NEVER }).hit);
});
T('B10 HEDGE_ZH 删 → 「贷款来自存款是一种过时的想当然」翻红（对冲短语守卫承重）', () => {
  const t = '贷款来自存款是一种过时的想当然。';
  assert.ok(!detectMoneyCreation(t).hit);
  assert.ok(detectMoneyCreation(t, { HEDGE_ZH: NEVER }).hit);
});
T('B11 CONCEPT_EN 删 → EN 理论讨论句翻红', () => {
  const t = 'In the loanable funds framework, loans are funded from savings.';
  assert.ok(!detectMoneyCreation(t).hit);
  assert.ok(detectMoneyCreation(t, { CONCEPT_EN: NEVER }).hit);
});
T('B12 CORRECT_EN 删 → EN 纠正句翻红', () => {
  const t = 'The claim that loans are funded from deposits reverses the actual mechanism: loans create deposits.';
  assert.ok(!detectMoneyCreation(t).hit);
  assert.ok(detectMoneyCreation(t, { CORRECT_EN: NEVER }).hit);
});
T('B13 NEG_EN 删 → 「It is not true that…」翻红', () => {
  const t = 'It is not true that loans are funded from savings.';
  assert.ok(!detectMoneyCreation(t).hit);
  assert.ok(detectMoneyCreation(t, { NEG_EN: NEVER }).hit);
});
T('B14 HEDGE_EN 删 → 「…is a common misconception」翻红', () => {
  const t = 'The idea that loans are funded from savings is a common misconception.';
  assert.ok(!detectMoneyCreation(t).hit);
  assert.ok(detectMoneyCreation(t, { HEDGE_EN: NEVER }).hit);
});

console.log('=== C 引擎 gate 兑现 ===');
T('C1 checkOutput 攻击 → verify + econ_reasoning_gate finding', () => {
  const full = require(path.join(ROOT, 'src', 'gate.js'));
  const r = full.checkOutput('银行放贷用的是储户的存款，没有存款增长就没有贷款，所以储蓄不足经济就没有投资的钱。');
  assert.strictEqual(r.gate.action, 'verify');
  assert.ok(r.findings.some(f => f.dimension === 'econ_reasoning_gate'), 'findings 应含 econ_reasoning_gate');
});
T('C2 gate 桥族表含 money_creation 且计数 39（r375 31→32→r377 33→r378 34→r379 35→r381 36→r385 37→r386 38）', () => {
  assert.ok(gate.FAMILIES.some(f => f.key === 'money_creation' && f.round === 'r376'));
  assert.strictEqual(gate.FAMILIES.length, 42);
});

console.log('=== D 插件层接线 ===');
T('D1 插件 FAMILIES 含 money_creation 且计数 44（r379 flat_rate_bias 入表后 39→40→r381 lump_of_labor 41→r385 42→r386 43→r387 44）', () => {
  assert.ok(plugin.FAMILIES.some(f => f.key === 'money_creation' && f.round === 'r376'));
  assert.strictEqual(plugin.FAMILIES.length, 47);
});
T('D2 插件 version 1.19.0（r386 再 bump）', () => {
  assert.strictEqual(plugin.version, '1.23.0');
});
T('D3 only=money_creation 单族过滤', () => {
  const r = plugin.analyze(ATTACK[0], { only: 'money_creation' });
  assert.strictEqual(r.familyCount, 1);
  assert.strictEqual(r.families[0].key, 'money_creation');
});

console.log('=== E 负例注入-删条（协议同 round-295 E 段）===');
// E1-E17：删条注入永假正则/空数组，断言该句/该族从「豁免/守卫生效」或「命中」
// 翻转为对立面。全部翻转才算承重。
const INJECTIONS = [
  { name: 'CTX_ZH（腿①中文）', keys: { CTX_ZH: [] }, text: ATTACK[0], want: false },
  { name: 'CTX_EN（腿①英文）', keys: { CTX_EN: [] }, text: ATTACK[9], want: false },
  { name: 'SOURCE_ZH 全形', keys: Object.fromEntries(__internals().SOURCE_ZH_GROUPS.map(([n]) => [n, []])), text: ATTACK[0], want: false },
  { name: 'SOURCE_EN 全形', keys: Object.fromEntries(__internals().SOURCE_EN_GROUPS.map(([n]) => [n, []])), text: ATTACK[9], want: false },
  { name: 'SOURCE_S1_ZH（归源形）', keys: { SOURCE_S1_ZH: NEVER }, text: '银行放贷用的是储户的存款。', want: false },
  { name: 'SOURCE_S3_ZH（前提形）', keys: { SOURCE_S3_ZH: NEVER }, text: '存款是贷款的前提，银行才有钱放贷。', want: false },
  { name: 'SOURCE_S6_ZH（固定总量形）', keys: { SOURCE_S6_ZH: NEVER }, text: '贷款和投资因此受限：一个社会的钱就那么多。', want: false },
  { name: 'SOURCE_C3_ZH（取决于形）', keys: { SOURCE_C3_ZH: NEVER }, text: ATTACK[5], want: false },
  { name: 'PAIR_ZH=0（两腿距离窗）', keys: { PAIR_ZH: 0 }, text: '存款和贷款谁先谁后，是货币银行学的经典问题；说到底，银行只是个中介。', want: false },
  { name: 'CONCEPT_ZH（理论讨论豁免）', keys: { CONCEPT_ZH: NEVER }, text: '可贷资金理论认为贷款来自储蓄，这一观点是有争议的。', want: true },
  { name: 'CORRECT_ZH（纠正句豁免）', keys: { CORRECT_ZH: NEVER }, text: '放贷靠的不是储户的存款，而是贷款创造的存款。', want: true },
  { name: 'NEG_ZH（紧前否定守卫）', keys: { NEG_ZH: NEVER }, text: '这并不是说贷款来自存款。', want: true },
  { name: 'HEDGE_ZH（对冲短语守卫）', keys: { HEDGE_ZH: NEVER }, text: '贷款来自存款是一种过时的想当然。', want: true },
  { name: 'CONCEPT_EN（理论讨论豁免）', keys: { CONCEPT_EN: NEVER }, text: 'In the loanable funds framework, loans are funded from savings.', want: true },
  { name: 'CORRECT_EN（纠正句豁免）', keys: { CORRECT_EN: NEVER }, text: 'The claim that loans are funded from deposits reverses the actual mechanism: loans create deposits.', want: true },
  { name: 'NEG_EN（紧前否定守卫）', keys: { NEG_EN: NEVER }, text: 'It is not true that loans are funded from savings.', want: true },
  { name: 'HEDGE_EN（对冲短语守卫）', keys: { HEDGE_EN: NEVER }, text: 'The idea that loans are funded from savings is a common misconception.', want: true },
];
let injRed = 0;
for (const c of INJECTIONS) {
  T(`E ${c.name} 删条后翻转（期望 hit=${c.want}）`, () => {
    const before = detectMoneyCreation(c.text);
    const after = detectMoneyCreation(c.text, c.keys);
    assert.strictEqual(before.hit, !c.want, `注入前 hit=${before.hit} 与期望前提矛盾`);
    assert.strictEqual(after.hit, c.want, `注入后 hit=${after.hit}，未翻转`);
    injRed++;
  });
}
T('E 汇总：注入 ' + INJECTIONS.length + ' 个 → ' + INJECTIONS.length + ' 个翻转，0 个未翻转', () => {
  assert.strictEqual(injRed, INJECTIONS.length);
});

console.log('=== F 射程邻接核查（money_illusion dim234）===');
T('F1 money_illusion 对本族 10 条攻击零命中（射程可分离）', () => {
  const { detectMoneyIllusion } = require(path.join(ROOT, 'src', 'money-illusion.js'));
  for (const t of ATTACK) assert.ok(!detectMoneyIllusion(t).hit, 'money_illusion 命中攻击句: ' + t);
});
T('F2 本族对 money_illusion 的攻击样本零命中（互不覆盖）', () => {
  const { detectMoneyIllusion } = require(path.join(ROOT, 'src', 'money-illusion.js'));
  const miAttacks = [
    '名义工资涨了，就觉得收入实际增加了。',
    '工资从三千涨到三千五，感觉收入提高了，尽管通胀也是 5%。',
  ];
  for (const t of miAttacks) {
    assert.ok(detectMoneyIllusion(t).hit, 'money_illusion 前提应命中: ' + t);
    assert.ok(!detectMoneyCreation(t).hit, '本族误伤 money_illusion 攻击句: ' + t);
  }
});

console.log(`\nr376-money-creation: ${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
