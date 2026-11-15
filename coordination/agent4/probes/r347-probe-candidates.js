'use strict';
// Exploratory probe r347: candidates against integrated tree v6.8.185.
//   A: 检出率/监测加强形 × 发生率结论（r346 给2号交接项①：CT/MRI检出率上升/
//      监测加强⇒疾病真的变多——immortal-time-bias 路径 h 攻击面迁移）
//   B: EN 弱化形（incidence appears to be climbing/seems to be rising/
//      looks to be rising——路径 h 腿③未收弱化动词）
//   C: 诉诸传统/自然 EN 新措辞（our ancestors... for millennia / only natural /
//      all-natural... in harmony with）
//   D: 中介过度控制（控制了中介变量后效应消失⇒原因无效——mediator_confusion 新形）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: detection-rate/surveillance form × incidence conclusion ───────────
const A_ATTACK = [
  '随着CT和核磁共振检查的普及，检出率大幅提高，确诊人数激增，这说明这种病的发病率真的在上升。',
  '检测技术进步之后，报告病例数节节攀升，可见这种疾病真的在蔓延。',
  '监测网络完善让病例登记数翻了好几倍，足以证明患病率真的升高了。',
  '影像检查越来越先进，早期病灶被大量发现，新发病例激增，说明癌症患者真的越来越多了。',
  'As CT and MRI detection rates have risen, the number of diagnosed cases has surged — the incidence of this disease is clearly climbing.',
  'Better detection technology has surfaced far more reported cases, which shows the disease really is becoming more common.',
  'With improved surveillance, the number of reported cases has tripled, proving the illness is genuinely spreading.',
  'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
];
const A_BENIGN = [
  '检出率提高会带来确诊病例上升，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '监测加强后报告病例增多是预期内的，需结合死亡率变化判断疾病负担的真实趋势。',
  'Higher detection rates explain the surge in reported cases, but this does not mean the disease is becoming more common.',
  'Improved surveillance finds more cases, though the true incidence may be unchanged.',
  '影像技术进步让早期病灶更易被发现，病例计数上升反映的是检出提前而非疾病真的增多。',
];

// ─── B: EN hedged conclusion forms ────────────────────────────────────────
const B_ATTACK = [
  'The number of diagnosed cases has surged since screening began, so the incidence appears to be climbing.',
  'Diagnosed cases tripled after the screening program, and the disease seems to be becoming more common.',
  'Case counts jumped this decade, suggesting the incidence may be somewhat higher than before.',
  'Screening surfaced far more tumors, and the incidence looks to be rising.',
  'With so many more cases detected, the disease appears to be spreading.',
];
const B_BENIGN = [
  'The number of diagnosed cases rose, but the incidence appears to be unchanged once detection improvements are accounted for.',
  'More cases were detected, though the true rate seems stable.',
];

// ─── C: appeal to tradition / nature EN new wording ───────────────────────
const C_ATTACK = [
  'Our ancestors thrived on this diet for millennia, so it must be the healthiest way to eat.',
  'It is only natural to trust this remedy, since nature itself has provided it.',
  'This all-natural formula works in harmony with your body\u2019s own healing wisdom, which is why it outperforms any synthetic drug.',
  'People have done it this way for generations, so changing the practice now would be wrong.',
];
const C_BENIGN = [
  'Traditional diets are worth studying, but we need randomized trials to know whether they improve health.',
  'Natural compounds can be effective, yet each one still has to be tested for safety and efficacy.',
  'Our ancestors ate this way for millennia, but life expectancy has risen since then, so we cannot assume it is optimal.',
];

// ─── D: mediator over-control (controlling mediator ⇒ cause useless) ──────
const D_ATTACK = [
  '控制了沟通频率之后，团队建设对业绩的效应就消失了，说明团建根本没用。',
  '把技能提升这个变量控制住后，培训带来的业绩增量归零，可见培训毫无价值。',
  'Once you control for employee skill, the effect of training on performance vanishes, so training does nothing.',
  'After adjusting for the mediator, the treatment effect is zero, which proves the intervention has no real impact.',
];
const D_BENIGN = [
  '控制中介变量会阻断因果路径，评估培训效应时不应控制技能提升。',
  'Conditioning on a mediator can block the causal pathway; the direct effect is not the total effect.',
  '控制了沟通频率后直接效应不显著，但总效应仍可能存在，需区分直接效应与间接效应。',
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
out.A = run('A detection-rate/surveillance form × incidence conclusion', A_ATTACK, A_BENIGN);
out.B = run('B EN hedged incidence forms (appears/seems/looks to be)', B_ATTACK, B_BENIGN);
out.C = run('C appeal to tradition/nature EN new wording', C_ATTACK, C_BENIGN);
out.D = run('D mediator over-control (control mediator ⇒ no effect)', D_ATTACK, D_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
