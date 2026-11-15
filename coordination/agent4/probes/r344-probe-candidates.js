'use strict';
// Exploratory probe r344: mirror-attribution conflation + two fallback candidates.
//   A: 镜像归因混淆（结果全部归因参保后行为变化/道德风险，同时否认参保前风险
//      构成/逆选择——r343 incentive_conflation 的对称腿组，r343 交接项）
//   B: 均值回归新形（干预组选极端值后回落⇒干预有害/选拔标准变严的新措辞）
//   C: 禀赋效应新措辞（拥有即高估/惜售×价值断言，econ-reasoning-gate 补腿）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: mirror conflation (moral hazard attribution × adverse selection denial) ──
const A_ATTACK = [
  '理赔金额上升都是因为参保后大家不注意保健了，跟参保前风险构成没有关系。',
  '赔付率变高说明参保后行为放纵是唯一原因，投保前的健康状况无关紧要。',
  '医疗费用增长完全是参保后过度就医造成的，投保人群本来的风险水平不必考虑。',
  '出险频率增加只反映参保后的生活习惯问题，参保时的身体底子没有任何影响。',
  'Claims rose purely because people neglect their health after enrolling; the risk profile of the insured before enrollment is irrelevant.',
  'The payout spike is entirely a post-enrollment behavior story; adverse selection plays no role whatsoever.',
  'Higher claims are solely due to careless behavior after signing up — who signed up in the first place makes no difference.',
  'Cost growth is only about post-insurance conduct; the pre-enrollment health pool can be ignored.',
];
const A_BENIGN = [
  '赔付上升可能同时来自参保后行为变化与参保前风险构成，需要分别识别。',
  '既要看参保后的就医行为，也要看参保前的风险分布，不能只归因一方。',
  '参保后疏于保健会推高理赔，但投保人群本来的风险构成同样在起作用。',
  'Rising claims may reflect both post-enrollment behavior and pre-existing risk composition.',
  'Post-enrollment behavior is one driver, but the risk profile of enrollees matters too.',
  'Attribution must separate moral hazard from adverse selection; neither alone explains the rise.',
];

// ─── B: regression to the mean new wording ────────────────────────────────
const B_ATTACK = [
  '入选时成绩最好的学生第二年平均分回落到全校平均水平，可见选拔标准还是太宽松。',
  '上个月投诉最多的网点本月投诉量下降了，说明投诉扎堆说明不了服务质量差。',
  'The bottom-performing branch improved last quarter, so the remedial program clearly worked.',
  'Students admitted with the highest scores fell back next year, proving the admissions bar was set too high.',
];
const B_BENIGN = [
  '极端组次年向均值回落是统计必然，不能据此判断干预有害。',
  '奖励前后没有对照组，回落可能只是回归效应而非激励反作用。',
  'A drop after selecting extremes is expected; it does not prove the program harmed anyone.',
  'Improvement in the worst group may reflect regression to the mean without a control group.',
];

// ─── C: endowment effect new wording ───────────────────────────────────────
const C_ATTACK = [
  '这房子我住了十年，市场价再高我也不卖，它对我的价值远超任何报价。',
  '手里的老票子跟了我这么多年，谁说它贬值我都不认，它值得更高的价。',
  'I have owned this watch for twenty years, so it is worth far more to me than the market price.',
  'My team built this proposal ourselves, so it deserves the budget no matter what the reviewers scored.',
];
const C_BENIGN = [
  '住了多年的房子有情感价值，但定价仍应以市场评估为基准。',
  '自己写的方案要接受独立评审，避免禀赋效应影响判断。',
  'Long-held possessions carry sentimental value, but pricing should follow market assessment.',
  'A proposal built in-house still needs independent review to avoid endowment bias.',
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
out.A = run('A mirror conflation (moral hazard attribution x adverse selection denial)', A_ATTACK, A_BENIGN);
out.B = run('B regression to mean new wording', B_ATTACK, B_BENIGN);
out.C = run('C endowment effect new wording', C_ATTACK, C_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
