#!/usr/bin/env node
// r432 轮测：clustering_illusion 第171维「聚集×超自然凶地/邪异归因」措辞家族
// （真升级② 既有维度全新措辞家族，统计素养轴续——r430 survivorship_bias 成功案例族、
// r431 selection_bias 自选择便利样本族后）。同池探针四家族定选 P1（穿透 6/7 最高、
// 良性 FP 0/4 唯一零误伤），新族为独立腿②路由（不并入存量数组，保 round-265
// length 断言）。A 模块层命中 / B 良性零命中 / C 精度边界 / D 负例注入 /
// E 存量回归 / F gate 端到端 / G 接线锁。所有基线数字来自 stash 前后实测
// （r432-baseline.output.txt / r432-probe-pool.baseline.txt）。
'use strict';
const path = require('path');
const ci = require(path.join(__dirname, '..', 'src', 'clustering-illusion.js'));
const check = ci.checkClusteringIllusion;
const IN = ci.__internals();
const gateMod = require(path.join(__dirname, '..', 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; console.log('  ✗ ' + name + ': ' + e.message); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function hit(text, inject) { const r = check(text, inject); return !!(r && r.hit); }
function gateFindings(text) {
  const r = gate(text);
  return { action: (r && r.gate && r.gate.action) || (r && r.action), dims: ((r && r.findings) || []).map(f => f.dimension) };
}

// ── A 模块层攻击（基线 10/10 整句穿透：mod=miss + gate=pass 零承重）──
const ZH_ATTACK = [
  '这个路口一个月出了四起事故，这地段简直是块凶地。',
  '同一栋楼接连发生了三起猝死，这楼简直就是栋凶宅。',
  '这条街半年五起盗窃，整条街透着一股凶气。',
  '这个车间接二连三出事，这地方八成是凶地。',
  '这只股票隔三差五就爆雷，这股透着说不出的邪乎。',
  '同一部门接连五人离职，这事怎么看怎么邪性。',
  '这机器频频死机，透着一股邪劲儿，邪门得很。',
];
const EN_ATTACK = [
  'Three accidents happened at this corner in one month, this intersection is clearly jinxed.',
  'We got three complaints in a row from the same floor; this floor must be hexed.',
  'We had three crashes at this corner in one month; locals say the corner is haunted.',
];

// ── B 良性（基线 16 条 mod=miss；4 条存量非 pass 与本族无关，逐项登记）──
const BENIGN = [
  '这个路口一个月四起事故，交警排查后发现是信号灯配时不合理，已连夜整改。',
  '同一栋楼三起猝死后家属要求彻查，基因检测确认是遗传性心脏病。',
  '这栋楼接连出事，有人说中了邪，但警方查明是电路老化，已全面检修。',
  'Three crashes on this route prompted an investigation that found a design flaw.',
  '连败之后教练组复盘发现是主力伤病与赛程密集所致，并非场地问题。',
  '买房前要问清楚是不是凶宅，法律要求出售方如实披露。',                 // 存量基线 verify/contradiction
  '中介按市场惯例给出了命案的房子打折，这是凶宅折价。',
  '今天天气真邪乎，六月天居然下了场冰雹。',
  '他最近运气邪乎地好，连中两单，但我知道这是概率波动。',
  '这套老宅据说是凶宅，剧组特意租来拍恐怖片。',
  'The old house is famously haunted, so the tour company visits every Halloween.', // 存量基线 rewrite/fallacy_of_relevance
  'He blamed the jinx for the loss, but the coach said it was just a bad game plan.',
  'She joked that her laptop was jinxed after it crashed twice this week.',
  'The team had an unlucky run of injuries early in the season.',
  'We had a rough patch with three outages, but the vendor traced it to a bad cable.',
  '接连五人离职后HR做了匿名调研，确认是薪酬结构问题。',                 // 存量基线 verify/claimed_verification_without_trail
];

// ── C 精度边界（单腿不命中 / 对冲豁免 / 疑问豁免 / 口径场景豁免）──
const PRECISION = [
  ['这地方简直是块凶地，买房前要慎重考虑。', '单腿ZH：只有诅咒词无聚集'],
  ['locals say the corner is haunted', '单腿EN：只有诅咒词无聚集'],
  ['这栋楼接连出事，恐怕是中了邪。', '对冲：恐怕×中了邪'],
  ['这楼接连出事，难道是凶宅吗？', '疑问句'],
  ['这栋楼接连出事，统计显示需要排查共同原因，不能归结为凶宅。', '口径/否定场景'],
];

// ── E 存量路由回归（R1/R2/R3/R5 与 SAME_SRC 路线须仍命中）──
const EXISTING = [
  '这个路口一个月出了四起事故，绝不可能是巧合。',
  '最近三个月，同一个小区接连发生了五起入室盗窃，显然这里面有蹊跷。',
  '这个部门每逢周一必出事，简直是逃不掉的魔咒。',
  '三个中奖者全都来自同一条街，这简直是命中注定的安排。',
  'Four accidents happened at the same intersection in one month, which cannot be a coincidence.',
  "Three lottery winners all came from the same street — that can't be random.",
];

console.log('r432 轮测：clustering_illusion「聚集×超自然凶地/邪异归因」族');

console.log('-- A 模块层攻击 ' + (ZH_ATTACK.length + EN_ATTACK.length) + ' 条（应全命中）');
for (const t of ZH_ATTACK.concat(EN_ATTACK)) test('命中: ' + t.slice(0, 18), () => ok(hit(t), '模块层未命中'));

console.log('-- B 良性 ' + BENIGN.length + ' 条（应零命中且 gate 不承重本维）');
for (const t of BENIGN) {
  test('良性零命中: ' + t.slice(0, 18), () => {
    ok(!hit(t), '模块层误伤');
    ok(!gateFindings(t).dims.includes('clustering_illusion'), 'gate 层本维误伤');
  });
}

console.log('-- C 精度边界 ' + PRECISION.length + ' 项（应零命中）');
for (const [t, label] of PRECISION) test('边界: ' + label, () => ok(!hit(t), '误命中'));

console.log('-- D 负例注入（逐组摘除新常量，攻击须翻转）');
test('D: SIGNIF_CURSE_ZH 全摘 → 7 ZH 翻转', () => {
  ok(ZH_ATTACK.every(t => !hit(t, { SIGNIF_CURSE_ZH: [] })), '有样本未翻转');
});
test('D: SIGNIF_CURSE_EN 全摘 → 3 EN 翻转', () => {
  ok(EN_ATTACK.every(t => !hit(t, { SIGNIF_CURSE_EN: [] })), '有样本未翻转');
});
test('D: ZH 场所诅咒组摘除 → 4 条翻转', () => {
  const R = { SIGNIF_CURSE_ZH: [IN.SIGNIF_CURSE_ZH[1], IN.SIGNIF_CURSE_ZH[2]] };
  ok(ZH_ATTACK.slice(0, 4).every(t => !hit(t, R)), '有样本未翻转');
});
test('D: ZH 附体行动组摘除 → 房东中了邪翻转', () => {
  const R = { SIGNIF_CURSE_ZH: [IN.SIGNIF_CURSE_ZH[0], IN.SIGNIF_CURSE_ZH[2]] };
  ok(!hit('这栋楼接连出事，房东说这地方中了邪。', R), '未翻转');
});
test('D: ZH 邪异氛围组摘除 → 3 条翻转', () => {
  const R = { SIGNIF_CURSE_ZH: [IN.SIGNIF_CURSE_ZH[0], IN.SIGNIF_CURSE_ZH[1]] };
  ok(ZH_ATTACK.slice(4, 7).every(t => !hit(t, R)), '有样本未翻转');
});
test('D: EN jinxed/hexed/haunted 摘除 → 3 条翻转', () => {
  const R = { SIGNIF_CURSE_EN: [IN.SIGNIF_CURSE_EN[1]] };
  ok(EN_ATTACK.every(t => !hit(t, R)), '有样本未翻转');
});
test('D: EN unlucky-ground 摘除 → 翻转', () => {
  const R = { SIGNIF_CURSE_EN: [IN.SIGNIF_CURSE_EN[0]] };
  ok(!hit('Three crashes in a row happened at this corner, so this corner is unlucky ground for drivers.', R), '未翻转');
});

console.log('-- E 存量路由回归 ' + EXISTING.length + ' 条（应全命中）');
for (const t of EXISTING) test('存量命中: ' + t.slice(0, 18), () => ok(hit(t), '存量路由回归失败'));

console.log('-- F gate 端到端 ' + (ZH_ATTACK.length + EN_ATTACK.length) + ' 条（非 pass 且本维承重）');
for (const t of ZH_ATTACK.concat(EN_ATTACK)) {
  test('gate 承重: ' + t.slice(0, 18), () => {
    const g = gateFindings(t);
    ok(g.action !== 'pass', 'gate 仍为 pass');
    ok(g.dims.includes('clustering_illusion'), 'clustering_illusion 未承重');
  });
}

console.log('-- G 接线锁与常量导出');
test('G: src/index.js 不含本族常量', () => {
  const fs = require('fs');
  const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  ok(!idx.includes('SIGNIF_CURSE'), 'src/index.js 不应含 SIGNIF_CURSE');
});
test('G: internals 导出 SIGNIF_CURSE_ZH/EN 非空数组', () => {
  ok(IN.SIGNIF_CURSE_ZH && IN.SIGNIF_CURSE_ZH.length >= 3, 'SIGNIF_CURSE_ZH 应≥3 组');
  ok(IN.SIGNIF_CURSE_EN && IN.SIGNIF_CURSE_EN.length >= 2, 'SIGNIF_CURSE_EN 应≥2 组');
});

console.log(`\nr432 轮测：${passed} 通过 / ${failed} 失败`);
console.log(`测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
console.log('cleanup: none (pure in-memory checks)');
if (failed > 0) process.exit(1);
