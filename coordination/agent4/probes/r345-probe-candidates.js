'use strict';
// Exploratory probe r345: four candidates against integrated tree v6.8.185.
//   A: 筛查过度诊断发生率腿（筛查检出大量惰性/本不会发病病灶⇒病例激增/疾病真的
//      变多——immortal-time-bias 路径(f)腿③只收「收益计入」形，未收发生率误读形；
//      r342/r343 两度延期候选）
//   B: 基础率忽视新形（罕见病筛查阳性⇒几乎必然患病——base_rate_neglect  Pedagogy
//      文本已含该形，预期低穿透，作证伪候选）
//   C: 道德风险↔逆选择双机制互相转换形（先说全是道德风险、被反驳后改口全是逆选择
//      ——r344 交接项）
//   D: incentive_conflation 新连接词/新措辞补腿（归根到底在于参保后/问题出在参保后/
//      根源在于参保后/健康池构成可以忽略——r344 交接项）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: overdiagnosis incidence leg ───────────────────────────────────────
const A_ATTACK = [
  '普筛查出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
  '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
  '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
  '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
  'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
  'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
];
const A_BENIGN = [
  '筛查让更多早期病例被发现，但这可能是检出提前，不能直接说明发病率真的上升。',
  '病例数上升不等于患病率上升，确诊人数受筛查普及度影响，需用总死亡率核对。',
  '早筛提高了检出率，但流行病学家提醒这并不代表疾病真的在增多。',
  'Screening increases detected cases, but researchers caution this does not mean the true incidence is rising.',
  'A surge in diagnosed cases may reflect better detection rather than a real increase in disease frequency.',
];

// ─── B: base rate neglect new wording (falsification candidate) ───────────
const B_ATTACK = [
  '这种罕见病的患病率只有万分之一，但筛查显示你是阳性，所以你几乎肯定得了这个病。',
  '虽然这种病在人群中的发病率极低，但你的检测呈阳性，几乎可以断定你已经感染了。',
  'This disease affects only one in ten thousand people, but your test came back positive, so you almost certainly have it.',
  'The condition is extremely rare, yet the screening flagged you — you almost definitely have the disease.',
];
const B_BENIGN = [
  '罕见病的筛查阳性预测值很低，阳性结果必须经确证检测确认。',
  'A positive screening test for a rare disease needs confirmatory testing because the predictive value is low.',
];

// ─── C: dual-mechanism switching (moral hazard → adverse selection) ───────
const C_ATTACK = [
  '他起初断言理赔上升全是道德风险造成的，跟投保前的风险构成没有任何关系；被质疑后又改口，坚称赔付率变高全是因为参保的人本来身体就差。',
  '一开始说赔付上升全部来自参保后的行为放纵，可被反驳之后，他又改称这一切都是逆选择，投保的人本来就是体弱多病。',
  'He first insisted the payout surge was entirely moral hazard with no connection to pre-enrollment risk; after pushback he switched to claiming it was all adverse selection.',
];
const C_BENIGN = [
  '赔付上升可能同时来自逆选择与道德风险；有人起初只谈道德风险，被提醒后补充说也要考虑参保前的风险构成。',
  'The rise in claims may reflect both mechanisms; after feedback he acknowledged that pre-enrollment risk matters too.',
];

// ─── D: incentive_conflation new connectives / new leg-② wording ──────────
const D_ATTACK = [
  '理赔金额上升，归根到底在于参保后大家疏于保健，跟投保前的风险构成没有任何关系。',
  '赔付率走高的问题出在参保后的生活习惯，参保前的健康结构无关紧要。',
  '医疗费用激增，根源在于参保后的放纵行为，投保时的健康池构成可以忽略。',
  'The rise in claims ultimately comes down to post-enrollment neglect; the pre-enrollment risk composition is irrelevant.',
  'The payout increase traces back to behavior after enrolling; the health pool of those who signed up can be disregarded.',
];
const D_BENIGN = [
  '赔付上升既要看参保后的行为变化，也要看参保前的风险构成。',
  '理赔变化可能同时来自两种机制，需分别识别，不能只归因一方。',
  'Both post-enrollment behavior and pre-enrollment risk composition drive the claims increase.',
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
out.A = run('A overdiagnosis incidence leg (case surge => disease really spreading)', A_ATTACK, A_BENIGN);
out.B = run('B base rate neglect rare-disease positive (falsification candidate)', B_ATTACK, B_BENIGN);
out.C = run('C dual-mechanism switching (moral hazard -> adverse selection)', C_ATTACK, C_BENIGN);
out.D = run('D incentive_conflation new connectives (r344 handoff)', D_ATTACK, D_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
