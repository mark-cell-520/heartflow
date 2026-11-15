'use strict';
// Exploratory probe r346: candidates against integrated tree v6.8.185.
//   A: 筛查过度诊断发生率腿（筛查检出病例激增⇒发病率真的上升/疾病真的变多——
//      immortal-time-bias 路径(f)腿③只收「收益计入」形，未收发生率误读形；
//      r342/r343/r345 三度延期候选，本轮扩充电池）
//   B: 基础率忽视新形（罕见病筛查阳性⇒几乎必然患病——base-rate-neglect  Pedagogy
//      文本已含该形，r345 电池 1/4；本轮换更口语的变体作证伪候选）
//   C: incentive_conflation 补腿（r345 交接项①②③：问题就出在参保后/症结在于参保后、
//      EN comes down to 超长间距、忽略就行/不提也罢）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: overdiagnosis incidence leg ───────────────────────────────────────
const A_ATTACK = [
  // 原始 r345 电池（6 条复测基线）
  '普筛查出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
  '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
  '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
  '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
  'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
  'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
  // 新增发生率腿形（无「本不会发病」字样，纯检出激增×发病率上升结论）
  '自从开展全员癌症早筛以来，确诊人数一年内翻了好几倍，看来这种病的发病率真的在快速上升。',
  '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
  '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
  '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
  'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
  'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
];
const A_BENIGN = [
  '筛查推广后确诊人数上升了，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '开展早筛后确诊人数增多是预期内的，后续随访方案已经跟上。',
  'Screening increased the number of detected cases, but this does not mean the disease is becoming more common.',
  'A surge in diagnosed cases may reflect better detection rather than a real increase in disease frequency.',
  '早筛提高了检出率，但流行病学家提醒这并不代表疾病真的在增多。',
  '病例数上升不等于患病率上升，确诊人数受筛查普及度影响，需用总死亡率核对。',
  '筛查让更多早期病例被发现，但这可能是检出提前，不能直接说明发病率真的上升。',
  'Screening increases detected cases, but researchers caution this does not mean the true incidence is rising.',
];

// ─── B: base rate neglect rare-disease positive (falsification candidate) ──
const B_ATTACK = [
  // 原始 r345 电池（4 条复测）
  '这种罕见病的患病率只有万分之一，但筛查显示你是阳性，所以你几乎肯定得了这个病。',
  '虽然这种病在人群中的发病率极低，但你的检测呈阳性，几乎可以断定你已经感染了。',
  'This disease affects only one in ten thousand people, but your test came back positive, so you almost certainly have it.',
  'The condition is extremely rare, yet the screening flagged you — you almost definitely have the disease.',
  // 新增口语形
  '罕见病的初筛阳性出来了，那你基本就是确诊了，跑不了。',
  '筛查阳性加症状吻合，你八成就是得了这个罕见病。',
  'The rare-disease screen came back positive, so you are basically a confirmed case.',
  'A positive result on the rare disease panel means you almost certainly have the condition.',
];
const B_BENIGN = [
  '罕见病的筛查阳性预测值很低，阳性结果必须经确证检测确认。',
  'A positive screening test for a rare disease needs confirmatory testing because the predictive value is low.',
  '筛查只是初筛，阳性还需要结合患病率和假阳性率进一步确认，不能据此断定。',
  'A positive screen for a rare disease needs confirmation given the low prevalence.',
];

// ─── C: incentive_conflation connective/dismiss 补腿 (r345 handoff ①②③) ──
const C_ATTACK = [
  // ① ZH 连接词介词变体
  '问题就出在参保后的生活习惯上，跟参保前的健康底子没什么关系。',
  '症结在于参保后的行为变化，参保前的风险构成完全无关紧要。',
  // ② EN comes down to 超长间距（>40 字符才出现行为域词）
  'The rise in claims ultimately comes down to the simple fact that people who have coverage tend to neglect their health after enrolling, which has nothing to do with the health pool of those who signed up.',
  // ③ ZH dismiss 尾口语化
  '投保前的风险结构忽略就行，关键是参保后大家更舍得花钱了。',
  '参保前的人群健康不提也罢，理赔上涨说到底在于参保后的行为。',
  '理赔上涨的根本原因在于参保后的疏于管理，投保前的风险构成大可不管。',
  'It all comes down to how enrollees take worse care of themselves once they have coverage, so the pre-existing risk profile of those who signed up can be dismissed.',
];
const C_BENIGN = [
  '赔付上升既要看参保后的行为变化，也要看参保前的风险构成。',
  '理赔变化可能同时来自两种机制，需分别识别，不能只归因一方。',
  'Both post-enrollment behavior and pre-enrollment risk composition drive the claims increase.',
  '问题出在参保后的生活习惯还是参保前的风险构成，需要分两个队列分别检验。',
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
out.C = run('C incentive_conflation connective/dismiss 补腿 (r345 handoff)', C_ATTACK, C_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
