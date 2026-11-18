'use strict';
/**
 * test/round-378-insurance-claim-loss.test.js — r378「未理赔即亏误读」子族轮测
 *
 * 背景：r378 立项探针（scripts/round-378/probe-r378-pool.js 12 候选同池 +
 * probe-r378-scope.js 6 候选深探）定拨 F_insurance_loss：二段深探穿透 7/10
 * 真零命中（存量维度零覆盖，3/10 代拦：perfect_error / reverse_causation /
 * pseudo_profundity），良性 6 条仅 1 条非 pass（reasoning_coherence/
 * contradiction 存量误伤，非本族增量）。海外扫描空返（两个 topic：arXiv
 * parse-fail 噪声 / GitHub 0 或 5 非纯规则 / S2 空），按既有形态自建。
 * 子族聚合进 econ_reasoning_gate 单维度（src/index.js 零改动、VERSION 不动），
 * 属真升级类型②（聚合族全新措辞家族）。
 *
 * 覆盖：A 模块层攻击/良性 → B 结构承重（两腿/三形/豁免/守卫 20 组负例注入）
 * → C 引擎 gate 兑现 → D 插件层接线（44 族 36 econ + 8 stats / v1.19.0 /
 * gate 桥 38 族）→ E 射程邻接核查（sunk_cost_coercion / present_bias /
 * adverse_selection 攻击集零交集双向）。
 */

const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const { detectInsuranceClaimLoss, __internals } = require(path.join(ROOT, 'src', 'insurance-claim-loss.js'));
const gate = require(path.join(ROOT, 'src/econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src/plugins', 'econ-reasoning-check', 'index.js'));
const mainGate = require(path.join(ROOT, 'src/gate.js'));
const gcheck = mainGate.gate || mainGate.check;

let pass = 0, fail = 0;
function T(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ': ' + e.message); }
}

const ATTACK = [
  '买了重疾险结果一年没生病，保费全白交了，保险就是庄家通吃的赌局。', // pair + gamble
  '没出险就等于钱打了水漂，当初还不如不买，这买卖怎么算都亏。',       // pair（腿①=出险）
  '保险本质上就是赌，不出事铁定亏，只有一直理赔才划得来。',             // gamble
  'I paid premiums all year and never claimed — that money was a complete waste.', // EN pair
  '车险一年没用上，这钱等于白扔了，明年说什么也不买了。',               // pair
  '买了保险最后没出事，说明这钱花亏了，不如当初拿去花掉。',             // pair
  '医保没生病就用不到，交了也是白交，退保才划算。',                     // pair（最近端=用不到）
  'Insurance is a losing bet unless you collect on it — not claiming means you overpaid.', // EN gamble
  '没理赔就是亏本，理赔了才是赚到，这就是保险的真相。',                 // pair（腿①=理赔）
  '年年交保费年年没事，这买卖怎么算都是赔的。',                         // pair（腿①=保费）
];
const BENIGN = [
  '不出险说明风险没有发生，保费买到的是转移尾部损失的能力，不是必然回本的理财。',
  '把保险当投资算回报是范畴错误，保障的价值恰恰体现在用不上时的确定性。',
  '保险的收益是风险兜底，没理赔不等于亏损，而是风险未兑现。',
  '正如灭火器没用上也值得配备。',
  '保险的定价基于大数法则，个体不出险恰恰是风险池正常运转的标志。',
  '用回报率衡量保障会误判，免于灾难性损失的确定性就是其效用。',
  '为了让他买保险，我这两年的关心都不是白费的。',
  '保费交了两年了，现在退保就亏了，只能继续交。',
  '出险了保险公司也没赔到，这理赔流程太让人失望。',
  '保险不买也罢，怕浪费钱。',
];

console.log('=== A 模块层：攻击命中 / 良性豁免 ===');
T('A1 10 条攻击全命中', () => {
  for (const t of ATTACK) assert.ok(detectInsuranceClaimLoss(t).hit, '未命中: ' + t);
});
T('A2 10 条良性全豁免', () => {
  for (const t of BENIGN) assert.ok(!detectInsuranceClaimLoss(t).hit, '误伤: ' + t);
});
T('A3 返回体字段齐备（dimension/severity/details/guidance）', () => {
  const r = detectInsuranceClaimLoss(ATTACK[0]);
  assert.strictEqual(r.dimension, 'insurance_claim_loss');
  assert.ok(r.severity >= 60 && r.severity <= 100, 'severity=' + r.severity);
  assert.ok(r.details.includes('未理赔即亏误读'));
  assert.ok(r.guidance.includes('风险转移') && r.guidance.includes('大数法则'));
});
T('A4 短文本/空文本守卫', () => {
  assert.strictEqual(detectInsuranceClaimLoss('').hit, false);
  assert.strictEqual(detectInsuranceClaimLoss(null).hit, false);
  assert.strictEqual(detectInsuranceClaimLoss('保险').hit, false);
});

console.log('=== B 结构承重（两腿/三形/豁免/守卫 20 组负例注入）===');
const NEVER = /(?!)/i;
T('B1 腿① INS_ZH 删 → 重疾险/车险词句不命中', () => {
  const t = '车险一年没用上，这钱等于白扔了，明年说什么也不买了。';
  assert.ok(detectInsuranceClaimLoss(t).hit, '前提：应命中');
  assert.ok(!detectInsuranceClaimLoss(t, { INS_ZH: [] }).hit);
});
T('B2 腿① INS_ZH_B 删 → 保费裸主语句不命中', () => {
  const t = '一年没生病，保费全白交了，这钱花得冤。';
  assert.ok(detectInsuranceClaimLoss(t).hit, '前提：应命中');
  assert.ok(!detectInsuranceClaimLoss(t, { INS_ZH_B: [] }).hit);
});
T('B3 腿① INS_ZH_C 删 → 出险事件词句不命中', () => {
  assert.ok(!detectInsuranceClaimLoss(ATTACK[1], { INS_ZH_C: [] }).hit);
});
T('B4 腿① INS_EN 删 → EN 攻击不命中', () => {
  assert.ok(!detectInsuranceClaimLoss(ATTACK[3], { INS_EN: [] }).hit);
});
T('B5 腿② NOCLAIM_ZH 删 → 配对形句不命中', () => {
  const t = '车险一年没用上，这钱等于白扔了，明年说什么也不买了。';
  assert.ok(!detectInsuranceClaimLoss(t, { NOCLAIM_ZH: [] }).hit);
});
T('B6 腿② WASTE_ZH 删 → 配对形句不命中', () => {
  assert.ok(!detectInsuranceClaimLoss(ATTACK[4], { WASTE_ZH: [] }).hit);
});
T('B7 腿② SUBJ_ZH 删 → 保费主语句形不命中', () => {
  const t = '保费全白交了，这保险买得真冤。';
  assert.ok(detectInsuranceClaimLoss(t).hit, '前提：应命中');
  assert.ok(!detectInsuranceClaimLoss(t, { SUBJ_ZH: [] }).hit);
});
T('B8 腿② GAMBLE_ZH 删 → 赌博框架句不命中', () => {
  assert.ok(!detectInsuranceClaimLoss(ATTACK[2], { GAMBLE_ZH: [] }).hit);
});
T('B9 腿② NOCLAIM_EN 删 → EN 配对形不命中', () => {
  assert.ok(!detectInsuranceClaimLoss(ATTACK[3], { NOCLAIM_EN: [] }).hit);
});
T('B10 腿② WASTE_EN 删 → EN 配对形不命中', () => {
  assert.ok(!detectInsuranceClaimLoss(ATTACK[3], { WASTE_EN: [] }).hit);
});
T('B11 腿② SUBJ_EN 删 → EN 保费主语句形不命中', () => {
  const t = 'My premiums were wasted — the policy never paid out anything.';
  assert.ok(detectInsuranceClaimLoss(t).hit, '前提：应命中');
  assert.ok(!detectInsuranceClaimLoss(t, { SUBJ_EN: [] }).hit);
});
T('B12 腿② GAMBLE_EN 删 → EN 赌博框架句不命中', () => {
  const t = 'Insurance is just a gamble — the house always wins.';
  assert.ok(detectInsuranceClaimLoss(t).hit, '前提：应命中');
  assert.ok(!detectInsuranceClaimLoss(t, { GAMBLE_EN: [] }).hit);
});
T('B13 NOCLAIM_WASTE_ZH=0 → 配对形近距窗承重（同句远距不命中）', () => {
  const t = '去年没出险；说到底，这钱等于白扔了。';
  assert.ok(detectInsuranceClaimLoss(t).hit, '前提：应命中');
  assert.ok(!detectInsuranceClaimLoss(t, { NOCLAIM_WASTE_ZH: 0 }).hit);
});
T('B14 PAIR_ZH=0 → 腿①-腿②距离窗承重（远距两腿句不命中）', () => {
  const t = '国家在推广惠民保险，人人有保障；就个人而言，一年没生病，保费全白交了。';
  assert.ok(detectInsuranceClaimLoss(t).hit, '前提：应命中');
  assert.ok(!detectInsuranceClaimLoss(t, { PAIR_ZH: 0 }).hit);
});
T('B15 PAIR_EN=0 → EN 距离窗承重', () => {
  const t = 'I never claimed on my insurance, so the money was wasted.';
  assert.ok(detectInsuranceClaimLoss(t).hit, '前提：应命中');
  assert.ok(!detectInsuranceClaimLoss(t, { PAIR_EN: 0 }).hit);
});
T('B16 CONCEPT_ZH 删 → 概念讨论句翻红（概念豁免承重）', () => {
  const t = '老师在讲风险池的运作机制时说，个人不出险就白交了保费。';
  assert.ok(!detectInsuranceClaimLoss(t).hit);
  assert.ok(detectInsuranceClaimLoss(t, { CONCEPT_ZH: NEVER }).hit);
});
T('B17 CORRECT_ZH 删 → 纠正句翻红（纠正豁免承重）', () => {
  const t = '保费买到的是转移尾部损失的能力，没出险就当是钱打了水漂实在太短视。';
  assert.ok(!detectInsuranceClaimLoss(t).hit);
  assert.ok(detectInsuranceClaimLoss(t, { CORRECT_ZH: NEVER }).hit);
});
T('B18 NEG_ZH 删 → 赌博框架紧前否定句翻红（紧前否定守卫承重）', () => {
  const t = '这根本不是庄家通吃的赌局，保险公司靠大数法则定价。';
  assert.ok(!detectInsuranceClaimLoss(t).hit);
  assert.ok(detectInsuranceClaimLoss(t, { NEG_ZH: NEVER }).hit);
});
T('B19 HEDGE_ZH 删 → 对冲短语句翻红（对冲守卫承重）', () => {
  const t = '保费全白交了——这是对保险机制的误解，保障买的是确定性。';
  assert.ok(!detectInsuranceClaimLoss(t).hit);
  assert.ok(detectInsuranceClaimLoss(t, { HEDGE_ZH: NEVER }).hit);
});
T('B20 NEG_ZH 删 → 配对形间隙否定句翻红（间隙守卫承重）', () => {
  const t = '没出险，倒也不觉得吃亏，反而觉得安心。';
  assert.ok(!detectInsuranceClaimLoss(t).hit);
  assert.ok(detectInsuranceClaimLoss(t, { NEG_ZH: NEVER }).hit);
});

console.log('=== C 引擎 gate 兑现 ===');
T('C1 攻击句 gate.action 非 pass 且归因 econ_reasoning_gate', () => {
  const r = gcheck(ATTACK[0]);
  const action = r.gate ? r.gate.action : r.action;
  assert.notStrictEqual(action, 'pass', 'action=' + action);
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('econ_reasoning_gate'), 'findings: [' + dims.join(',') + ']');
});
T('C2 gate 桥 families 含 insurance_claim_loss', () => {
  const g = gate.checkEconReasoningGate(ATTACK[0]);
  assert.ok(g.hit && g.families.some(f => f.key === 'insurance_claim_loss'));
});
T('C3 良性句 gate.action = pass', () => {
  const r = gcheck(BENIGN[2]);
  const action = r.gate ? r.gate.action : r.action;
  assert.strictEqual(action, 'pass', 'action=' + action);
});

console.log('=== D 插件层接线 ===');
T('D1 插件族表 44 族：36 econ + 8 stats，key 唯一', () => {
  assert.strictEqual(plugin.FAMILIES.length, 44);
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36);
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8);
  const keys = plugin.FAMILIES.map(f => f.key);
  assert.strictEqual(new Set(keys).size, 44);
  assert.ok(keys.includes('insurance_claim_loss') && keys.includes('flat_rate_bias'));
});
T('D2 插件 version 1.19.0（r386 再 bump）', () => {
  assert.strictEqual(plugin.version, '1.20.0');
});
T('D3 gate 桥族表 39 族', () => {
  assert.strictEqual(gate.FAMILIES.length, 39);
});
T('D4 插件 analyze 攻击命中本族、良性不命中', () => {
  const r = plugin.analyze(ATTACK[0]);
  assert.ok((r.families || []).some(f => f.key === 'insurance_claim_loss'));
  for (const t of BENIGN) {
    assert.ok(!(plugin.analyze(t).families || []).some(f => f.key === 'insurance_claim_loss'), '误伤: ' + t);
  }
});

console.log('=== E 射程邻接核查 ===');
T('E1 sunk_cost_coercion 攻击句不误触本族', () => {
  const { checkSunkCostCoercion } = require(path.join(ROOT, 'src', 'sunk-cost-coercion.js'));
  const sunkAtk = '机票都买了，不去就浪费了，硬着头皮也得去。';
  assert.ok(checkSunkCostCoercion(sunkAtk).hit, '前提：sunk-cost 应命中');
  assert.ok(!detectInsuranceClaimLoss(sunkAtk).hit);
});
T('E2 本族攻击句不被 sunk_cost_coercion 命中（射程零交集双向）', () => {
  const { checkSunkCostCoercion } = require(path.join(ROOT, 'src', 'sunk-cost-coercion.js'));
  for (const t of ATTACK) assert.ok(!checkSunkCostCoercion(t).hit, 'sunk_cost 误命中: ' + t);
});
T('E3 present_bias 攻击句不误触本族', () => {
  const { detectPresentBias } = require(path.join(ROOT, 'src', 'present-bias.js'));
  const pbAtk = '体检以后再说，今晚先痛快吃了，以后的事再说。';
  assert.ok(detectPresentBias(pbAtk).hit, '前提：present_bias 应命中');
  assert.ok(!detectInsuranceClaimLoss(pbAtk).hit);
});
T('E4 本族攻击句不被 present_bias 命中', () => {
  const { detectPresentBias } = require(path.join(ROOT, 'src', 'present-bias.js'));
  for (const t of ATTACK) assert.ok(!detectPresentBias(t).hit, 'present_bias 误命中: ' + t);
});
T('E5 adverse_selection 攻击句（保险域）不误触本族', () => {
  const avAtk = '保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。';
  assert.ok(!detectInsuranceClaimLoss(avAtk).hit);
});
T('E6 本族良性句不被 adverse_selection 误判', () => {
  const g = gate.checkEconReasoningGate(BENIGN[0]);
  assert.ok(!(g.families || []).some(f => f.key === 'adverse_selection'), 'adverse_selection 误伤: ' + BENIGN[0]);
});

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail > 0 ? 1 : 0);
