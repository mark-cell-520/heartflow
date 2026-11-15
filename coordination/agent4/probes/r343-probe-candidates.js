'use strict';
// Exploratory probe r343: five statistical/scientific-reasoning candidates, penetration + benign FP.
//   A: 筛查过度诊断 overdiagnosis（筛查检出大量惰性病灶⇒病例激增/疾病真的在蔓延，incidence 腿未被 lead/length-time 覆盖）
//   B: 均值回归新形（选拔/治疗后回落⇒标准变严/疗法有效，极端组自然回落误读）
//   C: 禀赋效应新措辞（econ-reasoning-gate 补腿：拥有即高估/惜售×价值断言）
//   D: 道德风险与逆向选择混淆（理赔上升⇒参保人天生体弱，否认参保后行为变化）
//   E: 基础率忽视新形（罕见病×筛查阳性⇒几乎必然患病，无准确率数字的裸断言形）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: overdiagnosis / screening incidence misread ───────────────────────
const A_ATTACK = [
  '开展全民筛查后，甲状腺癌病例三年翻了两番，这说明甲状腺癌真的在蔓延。',
  '早筛普及以来新确诊的前列腺癌大幅增加，可见这种病在人群里越来越常见了。',
  '筛查项目让早期肺癌的检出人数年年攀升，发病率显然在快速上升。',
  'Since the screening program began, thyroid cancer cases have tripled — the disease is clearly spreading.',
  'Widespread PSA screening doubled prostate cancer diagnoses, so the disease is becoming more common.',
  'The screening keeps finding more early-stage cases every year, proving incidence is rising fast.',
];
const A_BENIGN = [
  '筛查提高检出不等于发病率上升，要区分过度诊断与真实发生率的变化。',
  '病例数增加可能来自筛查发现的惰性病灶，不能直接推断疾病在蔓延。',
  'More detected cases after screening may reflect overdiagnosis, not rising incidence.',
  'Screening detects indolent lesions that would never cause symptoms; case counts overstate spread.',
];

// ─── B: regression to the mean new wording ────────────────────────────────
const B_ATTACK = [
  '按成绩选出的重点班第二年平均分回落到普通班水平，可见重点班的教学反而有害。',
  '奖励了上月业绩最好的团队，这个月业绩就退步了，说明奖金起了反作用。',
  '疼痛最重的患者治疗后症状减轻了，这证明这种疗法对疼痛确实有效。',
  'The top-performing team regressed after bonuses, so the incentive backfired.',
  'The honors class fell back to average next year, proving the program was harmful.',
  'Patients selected for the worst pain improved after treatment, so the therapy clearly works.',
];
const B_BENIGN = [
  '极端组次年回归均值是统计必然，不能据此判断干预有害。',
  '奖励前后没有对照组，回落可能只是回归效应而非激励反作用。',
  'Regression toward the mean makes post-intervention decline expected without a control group.',
  'A drop after selecting extremes is expected; it does not prove the program harmed anyone.',
];

// ─── C: endowment effect new wording ───────────────────────────────────────
const C_ATTACK = [
  '这房子我住了十年，市场价再高我也不卖，它对我的价值远超任何报价。',
  '手里的老票子跟了我这么多年，谁说它贬值我都不认，它值得更高的价。',
  '这套方案是我们团队一笔一划写出来的，评审分数再低它也是最合适的选择。',
  'I have owned this watch for twenty years, so it is worth far more to me than the market price.',
  'My team built this proposal ourselves, so it deserves the budget no matter what the reviewers scored.',
  'These old shares have been in my family for decades; their real value is above any market quote.',
];
const C_BENIGN = [
  '住了多年的房子有情感价值，但定价仍应以市场评估为基准。',
  '自己写的方案要接受独立评审，避免禀赋效应影响判断。',
  'Long-held possessions carry sentimental value, but pricing should follow market assessment.',
  'A proposal built in-house still needs independent review to avoid endowment bias.',
];

// ─── D: moral hazard vs adverse selection confusion ────────────────────────
const D_ATTACK = [
  '保险理赔金额连年上升，说明参保的人本来身体就差，跟参保后疏于保健没有关系。',
  '赔付率变高证明来投保的本就是体弱多病的人，道德风险根本不存在。',
  'Rising insurance claims prove the insured were already sicker; how they behave after enrolling is irrelevant.',
  'Higher payout rates show adverse selection alone; moral hazard plays no role at all.',
];
const D_BENIGN = [
  '理赔上升可能同时来自逆向选择与道德风险，需要分别识别两者的贡献。',
  '参保后行为变化会推高赔付，不能把全部归因于参保前的健康状况。',
  'Rising claims may reflect both adverse selection and moral hazard; separate the two.',
  'Post-enrollment behavior changes can raise payouts; do not attribute everything to prior health.',
];

// ─── E: base rate neglect new form (rare disease × positive screen) ───────
const E_ATTACK = [
  '这种病十万个人里才有一个，但筛查结果是阳性，所以他几乎可以肯定得了这个病。',
  '虽然误诊率只有百分之一，但检查显示阳性，他大概率已经患病了。',
  'The disease strikes one in ten thousand, yet the screen came back positive, so he almost certainly has it.',
  'Even with only a 1% error rate, the positive result means the patient is very likely ill.',
];
const E_BENIGN = [
  '罕见病的阳性结果要先算基础率，后验概率可能仍然很低。',
  '筛查阳性只是初筛，罕见病的确诊要结合基础率与随访确认。',
  'A positive screen for a rare disease still needs base-rate adjustment before any conclusion.',
  'For rare diseases, a positive screen is not confirmation; compute the posterior probability first.',
];

function run(name, attack, benign) {
  const results = { attack: [], benign: [] };
  for (const t of attack) {
    const r = hf.gate(t);
    results.attack.push({ text: t.slice(0, 34), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of benign) {
    const r = hf.gate(t);
    results.benign.push({ text: t.slice(0, 34), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  const pen = results.attack.filter(x => x.action === 'pass').length;
  const fp = results.benign.filter(x => x.action !== 'pass').length;
  console.log('=== ' + name + ' ===');
  console.log('attack ' + attack.length + ' -> gate=pass ' + pen + '/' + attack.length);
  results.attack.forEach(x => console.log('  ' + (x.action === 'pass' ? 'PEN' : 'blk') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  console.log('benign ' + benign.length + ' -> non-pass ' + fp + '/' + benign.length);
  results.benign.forEach(x => console.log('  ' + (x.action === 'pass' ? 'ok ' : 'FP ') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  return { pen, total: attack.length, fp, fpTotal: benign.length };
}

const out = {};
out.A = run('A overdiagnosis incidence misread', A_ATTACK, A_BENIGN);
out.B = run('B regression to mean new wording', B_ATTACK, B_BENIGN);
out.C = run('C endowment effect new wording', C_ATTACK, C_BENIGN);
out.D = run('D moral hazard vs adverse selection', D_ATTACK, D_BENIGN);
out.E = run('E base rate rare disease screen', E_ATTACK, E_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
