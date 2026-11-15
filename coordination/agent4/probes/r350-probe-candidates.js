'use strict';
// Exploratory probe r350: candidates against integrated tree v6.8.185.
//   A: 路径 h 腿①检出名词化/普及动作新族（r349 给2号交接项①：DETECT_UP_EN
//      p3 不收 testing 名词化形、CT/MRI 普及形；DETECT_UP_ZH 不收
//      排查/监测/检测+力度加大——leg-① gap, family-independent constants）
//   B: Berkson 住院选择形再探针（r349 交接项③：collider_bias COND_EN 名词表
//      缺 hospitalized/hospital，1/7 穿透重探，换措辞）
//   C: 逻辑谬误/经济推理新措辞族（诉诸传统 EN 新形 / mean reversion 新形）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: path-h leg① detection noun/popularization forms ─────────────
const A_ATTACK = [
  // EN: adoption/use of CT/MRI/imaging 名词形（LEAD_SCREEN 只收 screen* 词根）
  'The widespread adoption of CT scans has identified many more tumors, which shows the cancer is truly becoming more prevalent.',
  'With the growing use of MRI, far more lesions are being detected, suggesting the disease is really spreading.',
  'As CT scanning became universal, numerous additional cases were picked up, indicating the illness is genuinely on the rise.',
  'With CT now standard practice, many more tumors are being caught, suggesting the cancer is really becoming more common.',
  // EN: ubiquitous/widespread testing 名词化形（DETECT_UP_EN p3 须形容词）
  'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
  'Widespread testing has surfaced many more cases, indicating the disease is really on the rise.',
  'Mass testing campaigns have detected many more infections, which suggests the disease is truly spreading.',
  'The expansion of testing capacity has surfaced numerous additional cases, suggesting the disease is genuinely becoming more widespread.',
  // 控制句：已被腿①旧族覆盖的形（screen* 词根 / improved detection）
  'Widespread screening has surfaced many more cases, indicating the disease is really on the rise.',
  'Improved detection has surfaced many more cases, suggesting the disease is really becoming more widespread.',
  // ZH: 排查/监测/检测+力度 形（LEAD_SCREEN_ZH 无排查/监测，DETECT_UP_ZH 只收普及/进步）
  '排查力度的加强让更多病例被发现，可见疾病真的在蔓延。',
  '监测力度的加大让更多病例浮出水面，说明患病率真的在上升。',
  '全面排查让大量既往漏掉的病例被重新发现，足以证明这种病真的在变多。',
  '检测力度加强后，更多病例被识别出来，可见发病率确实在升高。',
  '大排查让更多潜在病例被查了出来，说明这种病真的在流行。',
  // 控制句：已被 DETECT_UP_ZH 覆盖的形（检查的普及/检测手段的进步）
  '检查的普及让更多病例被发现，可见疾病真的在蔓延。',
  '检测手段的进步让更多病例浮出水面，说明患病率真的在上升。',
];
const A_BENIGN = [
  'The widespread adoption of CT scans has identified many more tumors, but the true incidence may be unchanged.',
  'With the growing use of MRI, far more lesions are being detected, yet the underlying rate appears stable.',
  'Thanks to ubiquitous testing, many more infections have been identified, though the real incidence seems stable once ascertainment is accounted for.',
  'Mass testing campaigns have detected many more infections, but the actual prevalence does not appear to be rising.',
  '排查力度的加强让更多病例被发现，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '监测力度的加大让更多病例浮出水面，然而真实患病率似乎并没有变化。',
  '全面排查让大量既往漏掉的病例被重新发现，但这反映的是检出提前，不代表发病率真的上升。',
  '检测力度加强后，更多病例被识别出来，不过真实发病率可能并没有升高。',
  // 良性工程/医疗陈述（无发生率结论腿）
  'The hospital expanded CT scanning capacity last year to reduce emergency wait times.',
  '随着排查力度加大，社区漏诊率明显下降，公共卫生部门认为这是早期发现策略的成功。',
];

// ─── B: Berkson hospitalized-patient forms (collider_bias) re-probe ─
const B_ATTACK = [
  // EN: hospitalized / inpatient / hospital population 形（COND_EN p1 名词表缺）
  'Among hospitalized patients, the more a drug is prescribed the lower the mortality, so the drug clearly saves lives.',
  'In the hospital inpatient population, patients who received the new therapy had much lower mortality, so the therapy works.',
  'Within the hospitalised group, smokers show much higher rates of lung cancer, which proves smoking causes lung cancer.',
  'Among hospital inpatients, exercise frequency is inversely related to disease severity, so exercise prevents the disease.',
  // ZH: 住院部/住院病人里 无"在"前缀形
  '住院病人里，接受强化治疗的患者死亡率明显更低，说明强化治疗很有效。',
  '在住院部收治的病人中，合并用药越多感染率越低，可见联合用药能预防感染。',
  '只看住院病例，早期干预越充分复发率越低，所以早期干预能防止复发。',
];
const B_BENIGN = [
  'Among hospitalized patients, the apparent link may simply reflect that both conditions lead to admission — a classic Berkson bias.',
  'In the hospital inpatient population, both the exposure and the disease raise the odds of admission, so the association may be spurious.',
  '住院病人里看到的关联可能只是因为两者都导致住院，这是对撞偏误的典型例子。',
  '在住院部收治的病人中观察到相关，需要回到全样本验证，不能直接推断因果。',
];

// ─── C: appeal to tradition EN / mean reversion probes ──────────────
const C_ATTACK = [
  'This practice has been followed for generations, therefore it must be sound.',
  'Our ancestors have done it this way for centuries, so it is clearly the right way.',
  'The team just won five games in a row, so a loss is due to bring them back to average.',
  'After a record-breaking quarter, the stock is bound to fall back to its mean soon.',
];
const C_BENIGN = [
  'Tradition alone does not justify the practice; we need evidence that it works.',
  'A hot streak does not change the odds of the next game; each game is independent.',
];

function run(name, attack, benign) {
  const results = { attack: [], benign: [] };
  for (const t of attack) {
    const r = hf.gate(t);
    results.attack.push({ text: t.slice(0, 36), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of benign) {
    const r = hf.gate(t);
    results.benign.push({ text: t.slice(0, 36), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
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
out.A = run('A path-h leg① detection noun forms (adoption of CT / ubiquitous testing / 排查监测力度)', A_ATTACK, A_BENIGN);
out.B = run('B Berkson hospitalized forms re-probe (collider_bias)', B_ATTACK, B_BENIGN);
out.C = run('C appeal-to-tradition EN / mean reversion', C_ATTACK, C_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
