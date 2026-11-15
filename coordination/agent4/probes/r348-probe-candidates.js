'use strict';
// Exploratory probe r348: candidates against integrated tree v6.8.185.
//   A: 检出腿被动/名词化更深形（r347 给2号交接项①：wider adoption of CT
//      screening has brought more cases to light / screening rollout surfaced
//      many more cancers——路径 h 腿① DETECT_UP_EN 未收被动/名词化形）
//   B: 腿③再扩展（incidence is trending upward / looks to be trending
//      higher——路径 h 结论腿未收 trending 形）
//   C: 新候选探针（均值回归新形 / 禀赋效应 EN 新措辞 / 诉诸传统 EN 再探针）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: passive/nominalized detection-leg forms ─────────────────────────
const A_ATTACK = [
  'The wider adoption of CT screening has brought more cases to light, and the incidence is clearly rising.',
  'With wider screening uptake, far more tumors are being surfaced, which shows the cancer is becoming more common.',
  'As screening programs expanded, many more cases came to light, proving the disease really is spreading.',
  'The rollout of population screening surfaced many more cancers, so the illness is genuinely on the rise.',
  'Broader screening coverage means many more cases are now found, indicating the disease is becoming more widespread.',
  'Increased uptake of screening has brought many more cases to light — the incidence is truly climbing.',
  'As screening became more widespread, many more tumors were caught, and the disease appears to be spreading.',
  '随着筛查覆盖面的扩大，越来越多的病例被带入视野，这说明这种病的发病率真的在上升。',
  '筛查项目的铺开让大量潜伏病例浮出水面，可见这种疾病真的在蔓延。',
  '检查的普及使更多病例被及时发现，新发病例激增，足以证明患病率真的升高了。',
];
const A_BENIGN = [
  'The wider adoption of screening has brought more cases to light, but the true incidence may be unchanged.',
  'With broader coverage, more cases are found, though the underlying rate appears stable.',
  '筛查覆盖面扩大让更多病例被检出，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  'More cases surfaced after the rollout, yet the real incidence seems stable once ascertainment is accounted for.',
];

// ─── B: trending forms on conclusion leg ────────────────────────────────
const B_ATTACK = [
  'Diagnosed cases have surged since screening began, so the incidence is trending upward.',
  'The number of detected tumors tripled, and the disease looks to be trending higher.',
  'Case counts jumped after the screening program, suggesting the illness is on an upward trend.',
  'Screening surfaced far more cancers, and the incidence seems to be trending up sharply.',
  'With so many more cases detected, the disease is clearly trending more common.',
];
const B_BENIGN = [
  'Case counts rose, but the incidence is trending upward only because detection improved — the true rate is unchanged.',
  'Reported cases surged, though the true rate seems stable rather than trending higher.',
];

// ─── C: fresh candidate probes ──────────────────────────────────────────
// C1 mean reversion new forms（r343/r345 遗留：选拔后回落⇒标准变严/干预有害）
const C1_ATTACK = [
  '这批学生期中考试垫底，补了一对一辅导后期末成绩大幅回升，可见辅导效果显著。',
  '新赛季初段球员三分命中率奇低，教练换了投篮姿势后第二个月命中率回归正常，说明姿势调整立竿见影。',
  'The worst-performing stores last quarter were given extra coaching, and their sales rebounded this quarter — coaching clearly works.',
  'Patients with the highest pain scores were enrolled in the new therapy, and their pain dropped sharply afterward, proving the therapy is highly effective.',
  '极端组选拔后表现回落，这说明当初的选拔标准把不行的也放进来了。',
];
const C1_BENIGN = [
  '选拔后表现回落部分源于均值回归，评估干预效果需要对照组。',
  'Extreme groups tend to regress toward the mean; the rebound may not be caused by the intervention.',
  '期末成绩回升与均值回归混在一起，要分离干预效应得看随机对照结果。',
];
// C2 endowment effect EN new wording（r339 候选族再探针）
const C2_ATTACK = [
  'Once employees were given the laptops, they valued them far above what they would have paid themselves.',
  'People demanded much more money to give up the mugs they owned than they would have spent to buy the same mugs.',
  'Participants required a much higher price to part with their tickets than they would have paid to acquire them.',
  '一旦拥有了这项权益，员工们对它的估值立刻远超自己当初愿意支付的价格。',
  '拿到赠品之后，大家对这件东西的看重程度明显高于它到手之前。',
];
const C2_BENIGN = [
  'The gap between buying and selling prices is the endowment effect, a well-documented behavioral bias.',
  'Willingness to accept exceeded willingness to pay, which is consistent with loss aversion.',
  '禀赋效应解释了为什么拥有者对物品估值更高，这是行为经济学的经典发现。',
];
// C3 appeal to tradition EN re-probe（r347 证伪项 3/4，补良性缺口形）
const C3_ATTACK = [
  'Civilizations have followed this practice for thousands of years, so abandoning it now would be a mistake.',
  'This remedy has been trusted since antiquity, which proves it still works better than modern medicine.',
  'Every generation before us raised children this way, so it must be the right way.',
];
const C3_BENIGN = [
  'This practice has been followed for centuries, though its benefits have not been tested in controlled trials.',
  'Traditional methods may hold value, but long use alone does not establish effectiveness.',
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
out.A = run('A passive/nominalized detection leg (brought to light / surfaced)', A_ATTACK, A_BENIGN);
out.B = run('B trending-upward conclusion forms', B_ATTACK, B_BENIGN);
out.C1 = run('C1 mean reversion new forms', C1_ATTACK, C1_BENIGN);
out.C2 = run('C2 endowment effect EN new wording', C2_ATTACK, C2_BENIGN);
out.C3 = run('C3 appeal to tradition EN re-probe', C3_ATTACK, C3_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
