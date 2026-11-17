/**
 * test/round-378-relative-risk-individual-transfer.test.js
 * r378 第 264 维度 relative_risk_individual_transfer（相对风险个体平移）
 * 负例注入测试：把某条正则常量注入成永假式，对应腿/豁免应失效。
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  checkRelativeRiskIndividualTransfer,
} = require(path.resolve(__dirname, '../src/relative-risk-individual-transfer.js'));

const NEVER = /(?!x)x/; // 永假正则

// ─── A. 攻击样本（同族变体矩阵：中英双语 + 裸名词 + 带修饰 + 倒装 + 长句）──
const ATTACKS = [
  // A1 中文·标准双腿（群体相对降幅 → 个体同幅度兑现）
  '这种治疗能把心血管事件的风险降低60%，所以每个患者的心血管事件都会减少六成',
  // A2 中文·裸名词形（无修饰，直述）
  '疫苗把人群感染风险压低九成，因此每个人的感染风险也少了九成',
  // A3 中文·倒装形（个体腿在前，群体统计在后，推论连接居中）
  '你个人的感染风险也会少九成，因为疫苗把人群感染风险降低了90%',
  // A4 中文·长句形（两腿相距较远，仍应在邻近窗内）
  '临床研究显示这个药在受试者中的风险降低了60%左右，从统计结果看，可以说每个参与者本人的风险也都同样下降六成',
  // A5 中文·「六折」口语形
  '人群层面的相对风险只有对照组的六成，于是每个参与者的个人风险也都打六折',
  // A6 中文·「兑现」动词形
  '该干预使总体发病率下降五成，这意味着个人层面也能兑现同样幅度的发病率下降',
  // A7 英文·标准双腿
  'The vaccine cuts infection risk by 90%, so each person\'s chance of catching it drops by nine tenths.',
  // A8 英文·裸名词形
  'The treatment lowers risk by 60% in the population, therefore every individual gets the same degree of benefit.',
  // A9 英文·倒装形
  'Your personal risk also falls by nine tenths because the shot cuts infection risk by 90%.',
  // A10 英文·长句形（efficacy + NNT-less 个体兑现）
  'In the trial group the therapy showed a 55% relative reduction in events, which means each participant personally receives the same extent of protection.',
];

// ─── B. 良性样本（必须含边缘良性：正确换算/基线提醒/概念转述/无腿缺失）──
const BENIGN = [
  // B1 正确换算（已折算绝对风险）——本族要教的判别动作
  '这种治疗能把心血管事件的相对风险降低60%，但绝对风险只从10%降到4%，个人收益取决于自己的基线风险',
  // B2 正确换算（明确提示需结合基线）
  '疫苗在人群中把感染风险压低九成，不过个体感染风险还取决于个人暴露情况和基线水平',
  // B3 概念/教学转述（讨论相对风险 vs 绝对风险的区别）
  '统计学教材强调，报告相对风险降低时必须同时给出绝对风险降低和基线风险，否则容易误导读者',
  // B4 无腿②（只说群体相对降幅，无个体兑现）
  '疫苗在人群中把感染风险压低九成',
  // B5 无腿①（只说个体收益，无群体统计）
  '你打完疫苗后个人感染风险确实低了很多',
  // B6 统计规范陈述（RRR 与 ARR 并列报告）
  '论文按统计学规范同时报告了相对风险降低60%与绝对风险降低3%',
  // B7 无推论连接（裸并列：先说群体再说个体情况，无推理动作）
  '疫苗在人群中把感染风险压低九成。你个人的感染风险则要看自己的情况',
  // B8 后置对冲/让步（先立群体统计，再拒绝个体平移）
  '疫苗把人群感染风险压低九成，但这不等于每个人的感染风险都能少九成',
  // B9 疑问句（真疑问，非反问）
  '这种治疗真的能让每个人的风险都少六成吗？',
  // B10 英文良性：正确换算
  'The drug lowers relative risk by 60%, but the absolute risk reduction is only 3%, so individual benefit depends on baseline risk.',
  // B11 英文良性：概念转述
  'Risk communication guidelines warn that relative risk reduction must always be presented alongside absolute risk and baseline risk.',
  // B12 英文良性：无腿②（纯群体陈述）
  'Across the population the intervention reduced infection risk by 90%.',
];

// ─── C. 维度级断言 ────────────────────────────────────────────────
for (const s of ATTACKS) {
  const r = checkRelativeRiskIndividualTransfer(s);
  assert.equal(r.hit, true, `攻击样本应命中: ${s}`);
  assert.ok(r.score > 0, `score 应为正: ${s}`);
}
for (const s of BENIGN) {
  const r = checkRelativeRiskIndividualTransfer(s);
  assert.equal(r.hit, false, `良性样本应放行: ${s}`);
}

// ─── D. 负例注入：逐常量验证承重 ─────────────────────────────────
// 抹掉腿① → 攻击样本不再命中（证明腿①承重，不是豁免表在代劳）
{
  const inj = { GROUP_ZH: NEVER, GROUP_EN: NEVER };
  for (const s of ATTACKS.slice(0, 6)) {
    const r = checkRelativeRiskIndividualTransfer(s, inj);
    assert.equal(r.hit, false, `注入 GROUP 永假后中文攻击应失效: ${s}`);
  }
  for (const s of ATTACKS.slice(6)) {
    const r = checkRelativeRiskIndividualTransfer(s, inj);
    assert.equal(r.hit, false, `注入 GROUP 永假后英文攻击应失效: ${s}`);
  }
}
// 抹掉腿② → 攻击样本不再命中（证明腿②承重）
{
  const inj = { INDIV_ZH: NEVER, INDIV_EN: NEVER };
  for (const s of ATTACKS) {
    const r = checkRelativeRiskIndividualTransfer(s, inj);
    assert.equal(r.hit, false, `注入 INDIV 永假后攻击应失效: ${s}`);
  }
}
// 抹掉正确换算豁免 → 正确换算形良性反被命中（证明豁免表承重）
// r379 修正：原断言选 B1/B2/B10 三句，但实测这三句都不是「豁免唯一阻挡」形——
// B1 腿③窗口为空（腿①命中全在腿②前 4 字符内，推论连接标记不在两腿之间）、
// B2 被 concession lead（「不过」在腿②前）挡、B10 无腿②命中；单抹或双抹
// EXEMPT_CORRECT+CONCESSION 后仍不 hit，断言必红。这是选句错误，非模块缺陷。
// r379 实测（scripts/round-379/probe-r379-exempt-correct.js）：下列两句是
// 真正的「豁免唯一阻挡」形——抹 EXEMPT_CORRECT 后转 hit，基线不 hit。
// 其中 ZH 句顺带暴露 EXEMPT_CORRECT_EN 漏判：英文 falls from X% to Y%
// 折算形在补腿前连基线都误命中（见 EXEMPT_CORRECT_EN r379 补腿注释）。
{
  const inj = { EXEMPT_CORRECT_ZH: NEVER, EXEMPT_CORRECT_EN: NEVER };
  const EXEMPT_ONLY = [
    '该药能把心血管事件的相对风险降低60%，每个人的绝对风险只从10%降到4%，所以收益取决于基线风险',
    'The treatment cuts relative risk by 60%, so every individual\'s absolute risk falls from 10% to 4% depending on baseline.',
  ];
  // 基线：两句都应被豁免挡下（不 hit）
  for (const s of EXEMPT_ONLY) {
    const r = checkRelativeRiskIndividualTransfer(s);
    assert.equal(r.hit, false, `正确换算形良性基线应放行: ${s}`);
  }
  // 抹豁免 → 转 hit（证明豁免腿承重，而非其他腿在代劳）
  for (const s of EXEMPT_ONLY) {
    const r = checkRelativeRiskIndividualTransfer(s, inj);
    assert.equal(r.hit, true, `注入 EXEMPT_CORRECT 永假后正确换算形良性应转为命中: ${s}`);
  }
}
// 抹掉概念/教学转述豁免 → 攻击结构句 + 教材语境 反被命中（证明豁免表承重）
// r379 修正：原断言选 B3/B11，实测这两句腿部结构不成形（抹全部豁免仍不
// hit，见 scripts/round-379/probe-r379-exempt-map.js：12 个 BENIGN 句
// all-exempt-killed=still-blocked）——它们因缺腿而非豁免不命中。选句错误。
// r379 实测（probe-r379-exempt-metanorm.js）：以 canonical 攻击句为基座、
// 仅插入教材/论文语境词，可得「豁免唯一阻挡」形。
{
  const inj = { EXEMPT_META_ZH: NEVER, EXEMPT_META_EN: NEVER };
  const META_ONLY = [
    '统计学教材指出，风险降低60%，所以每个患者的心血管事件都会减少六成',
    '论文中提到，风险降低60%，所以每个患者的心血管事件都会减少六成',
    'The textbook says risk was cut by 60%, so every patient\'s event count drops by six tenths.',
  ];
  for (const s of META_ONLY) {
    assert.equal(checkRelativeRiskIndividualTransfer(s).hit, false, `教学转述形良性基线应放行: ${s}`);
    assert.equal(checkRelativeRiskIndividualTransfer(s, inj).hit, true, `注入 EXEMPT_META 永假后良性应转为命中: ${s}`);
  }
}
// 抹掉统计规范豁免 → 攻击结构句 + 规范报告语境 反被命中（证明豁免表承重）
// r379 修正：原断言选 B6（腿部结构不成形，同因）。r379 实测：NORM_ZH 的
// 「统计学规范报告」形会被 EXEMPT_META 二次挡住（「统计学」字样双踩），
// 故取不含「统计学」的「按统计口径报告」形，确保只有 EXEMPT_NORM 承重。
{
  const inj = { EXEMPT_NORM_ZH: NEVER, EXEMPT_NORM_EN: NEVER };
  const NORM_ONLY = [
    '按统计口径报告风险降低60%，所以每个患者的心血管事件都会减少六成',
    'Reported per statistical conventions: risk was cut by 60%, so every patient\'s event count drops by six tenths.',
  ];
  for (const s of NORM_ONLY) {
    assert.equal(checkRelativeRiskIndividualTransfer(s).hit, false, `统计规范形良性基线应放行: ${s}`);
    assert.equal(checkRelativeRiskIndividualTransfer(s, inj).hit, true, `注入 EXEMPT_NORM 永假后良性应转为命中: ${s}`);
  }
}

// ─── E. gate 层可达性（新维度已接入引擎，不止是模块函数）─────────
{
  const { checkOutput } = require(path.resolve(__dirname, '../src/gate.js'));
  const g = checkOutput(ATTACKS[0]);
  const dims = (g.findings || []).map(f => f.dimension);
  assert.ok(
    dims.includes('relative_risk_individual_transfer') || g.gate.action !== 'pass',
    `gate 层应可达（findings 含新维度或 action 非 pass）: ${JSON.stringify(g.gate)}`
  );
}

console.log('round-378 relative_risk_individual_transfer: ALL PASS');
