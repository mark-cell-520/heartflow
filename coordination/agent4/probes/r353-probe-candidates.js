'use strict';
// Exploratory probe r353: candidates against integrated tree v6.8.185.
//   A(EN): 路径 h 腿① sensitive/advanced/accurate/precise/improved/better/
//      newer + testing 名词形缺口（DETECT_UP_EN p3 名词表 imaging/scans/
//      scanning/tests?/assays?/screening 缺 testing 动名词形——"sensitive
//      testing" 的 "testing" 不被 tests? 的 \b 尾界匹配；p4 须 imaging/
//      scanning/diagnostic + technology/methods，"advanced testing" 类穿透；
//      r351 交接项②/r352 候选 B 5/7 留交，本轮扩展探针 + 落地评估）
//   A(ZH): 腿① 更灵敏/更精准/更先进 + 检测/检查 名词形（DETECT_UP_ZH 只收
//      普及形 p1 与 技术进步形 p2——"检测手段的进步"，"更灵敏的检测"无
//      进步/普及后缀形穿透？）
//   B: Berkson 住院选择形再探针（collider_bias COND_EN 缺 hospitalized/
//      inpatient，r349 1/7、r350 4/7、r351 6/10、r352 6/10 留交——需改
//      共享常量，本轮扩样再评估）
//   C: 新缺口自建探针——腿② case numbers 复数名词前置形（legacy p1 只收
//      number of + diagnosed cases，"diagnosed case numbers climbed" 类）；
//      腿① screening coverage/intensity 扩张形（EN4 p6 须 expansion of
//      + capacity/coverage 名词，"screening coverage expanded" 动词形）
// 控制句：每候选附已被覆盖的同族控制句（证候选形确为新缺口而非重判）。
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A(EN): path-h leg① adjective + testing noun gap ────────────────
const A_ATTACK = [
  // r352 候选 B 穿透 5 形复跑（腿②均为非 p5 自锚形）
  'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.',
  'More accurate testing means many more tumors are being picked up, indicating the disease is really on the rise.',
  'Improved testing has identified numerous additional cases, which suggests the disease is truly becoming more common.',
  'With newer testing methods, many more lesions are being found, which suggests the disease is really spreading.',
  'Better testing identified many more tumors, which suggests the disease is truly on the rise.',
  // 本轮扩展：同族新形容词 × 新腿②/腿③组合
  'Thanks to sensitive testing, far more cases were surfaced, which indicated the disease was genuinely becoming more widespread.',
  'With more precise testing, many more infections have been caught, suggesting the illness is really becoming more common.',
  'Enhanced testing means numerous additional tumors are being uncovered, which shows the cancer is truly on the rise.',
  'More sensitive testing has uncovered many more cases, and this proves the disease is really spreading.',
  'Advanced testing picked up far more tumors than before, suggesting the cancer is truly becoming more common.',
  'Newer testing detected many more lesions, which suggests the disease is genuinely on the rise.',
  'Improved testing surfaced numerous hidden cases, indicating the illness was really becoming more widespread.',
];
const A_BENIGN = [
  // 良性孪生：谨慎解读/稳定归因（既有豁免族应兜底）
  'With advanced testing, far more cases are being detected, though the true incidence appears stable once ascertainment is accounted for.',
  'More accurate testing means many more tumors are being picked up, but the actual prevalence does not appear to be rising.',
  // 良性陈述：无病例激增腿或无发生率结论腿
  'The lab adopted more sensitive testing, and turnaround times improved markedly.',
  'With newer testing methods, the hospital processed more samples per day.',
  'Improved testing reduced the cost per sample by nearly half.',
  'More precise testing allowed earlier intervention for those already diagnosed.',
  'The clinic switched to advanced testing to comply with the new accreditation standards.',
  'Researchers compared sensitive testing against standard assays in the methods section.',
  '更灵敏的检测让更多病例被检出，实验室周转时间明显缩短。',
  '采用更精准的检测后，医院每天处理的样本量大幅上升。',
];
// 控制句：腿①已覆盖形（DETECT_UP_EN p3/p4/p5、EN4、DETECT_UP_ZH）+ 同腿②腿③
const A_CONTROL = [
  'Thanks to more sensitive imaging, far more tumors were surfaced, which indicated the disease was genuinely becoming more widespread.',
  'With advanced diagnostic methods, many more lesions are being found, which suggests the disease is really spreading.',
  'Thanks to ubiquitous testing, many more cases have been identified, which suggests the disease is really becoming more widespread.',
  '随着检测手段的进步，更多病例被检出，这说明发病率真的在上升。',
];

// ─── A(ZH): path-h leg① 更灵敏/更精准 + 检测/检查 noun gap ──────────
const AZ_ATTACK = [
  '更灵敏的检测让更多病例被检出，这说明发病率真的在上升。',
  '随着更精准检测的普及，确诊人数大幅上升，可见这种病真的在变多。',
  '更先进的检测手段浮出大量潜伏病例，表明疾病真的在蔓延。',
  '检测更灵敏后，报告病例明显增多，似乎说明患病率真的更高了。',
  '凭借更精确的检查，大量以往漏诊的病例被识别出来，可见疾病真的在高发。',
];
const AZ_BENIGN = [
  '更灵敏的检测让更多病例被检出，实验室周转时间明显缩短。',
  '随着更精准检测的普及，医院每天处理的样本量大幅上升。',
  '更先进的检测手段提高了早期确诊的比例，但真实发病率可能并没有上升。',
];

// ─── B: Berkson hospitalized forms re-probe (collider_bias COND_EN) ──
const B_ATTACK = [
  // r352 候选 D 穿透 6 形复跑
  'Among hospitalized patients, the more a drug is prescribed the lower the mortality, so the drug clearly saves lives.',
  'In the hospital inpatient population, patients who exercised more had shorter stays, so exercise clearly speeds recovery.',
  'Within the hospitalised group, smokers showed lower post-op complication rates, so smoking appears protective after surgery.',
  'Among hospital inpatients, exercise frequency correlated with faster recovery, so exercise must accelerate healing.',
  'Among hospital-admitted patients, those with higher vitamin D levels had milder disease course, so vitamin D clearly reduces severity.',
  'In the in-hospital cohort, earlier treatment was associated with better outcomes, so early intervention clearly works.',
  // 本轮扩展：同族新形（admitted/in-hospital/ward/clinic 选择框）
  'Among admitted patients, the treated group recovered faster, so the treatment is clearly effective.',
  'In the inpatient cohort, higher nurse staffing was linked to fewer complications, so more nurses clearly save lives.',
  'Within the hospitalised population, the new protocol shortened stays, so the protocol clearly improves care.',
  'Among patients admitted to the hospital, those on the special diet had lower readmission, so the diet clearly prevents readmission.',
  'In the hospitalised sample, the biomarker-positive group had shorter admissions, so the biomarker clearly predicts mild disease.',
  'Looking only at admitted cases, the vaccinated had milder illness, so vaccination clearly reduces severity.',
];
const B_BENIGN = [
  'Among hospitalized patients, the apparent link may simply reflect that both conditions lead to admission — a classic Berkson bias.',
  'In the hospital inpatient population, both exposure and outcome increase admission probability, so the association is confounded by selection.',
  'The hospitalised-only analysis cannot establish causation because admission is a collider; a population sample is needed.',
  '住院病人里看到的关联可能只是因为两者都导致住院，这是对撞偏误的典型例子。',
];

// ─── C: new gap probes (leg② case numbers plural / leg① coverage verb) ─
const C_ATTACK = [
  // 腿② 复数名词前置形：diagnosed case numbers climbed / case numbers rose
  'After the screening program expanded, diagnosed case numbers climbed steadily, which suggests the disease is really becoming more common.',
  'With wider screening, case numbers have risen sharply, suggesting the cancer is truly on the rise.',
  'Thanks to mass testing, reported case numbers tripled last year, indicating the disease is genuinely spreading.',
  // 腿① 覆盖扩张动词形：screening coverage expanded / testing intensity increased
  'As screening coverage expanded, many more tumors were found, which suggests the cancer is truly becoming more common.',
  'With testing intensity increased, far more cases are being identified, suggesting the disease is really on the rise.',
  'Once screening coverage was extended to all districts, numerous additional cases surfaced, which showed the disease was truly becoming more widespread.',
];
const C_BENIGN = [
  'After the screening program expanded, diagnosed case numbers climbed steadily, though the true incidence appears stable once ascertainment is accounted for.',
  'With wider screening, case numbers have risen sharply, but the actual prevalence does not appear to be rising.',
  'As screening coverage expanded, the clinic processed more samples per day.',
  'With testing intensity increased, turnaround times improved markedly.',
  '随着筛查覆盖面的扩大，医院每天排查的人数明显增多。',
];

function run(name, attack, benign, control) {
  const results = { attack: [], benign: [], control: [] };
  for (const t of attack) {
    const r = hf.gate(t);
    results.attack.push({ text: t.slice(0, 40), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of benign || []) {
    const r = hf.gate(t);
    results.benign.push({ text: t.slice(0, 40), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of control || []) {
    const r = hf.gate(t);
    results.control.push({ text: t.slice(0, 40), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  const pen = results.attack.filter(x => x.action === 'pass').length;
  const fp = results.benign.filter(x => x.action !== 'pass').length;
  const ctlPass = results.control.filter(x => x.action !== 'pass').length;
  console.log('=== ' + name + ' ===');
  console.log('attack ' + attack.length + ' -> gate=pass(穿透) ' + pen + '/' + attack.length);
  results.attack.forEach(x => console.log('  ' + (x.action === 'pass' ? 'PEN' : 'blk') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  if (benign) {
    console.log('benign ' + benign.length + ' -> non-pass(误伤) ' + fp + '/' + benign.length);
    results.benign.forEach(x => console.log('  ' + (x.action === 'pass' ? 'ok ' : 'FP ') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  }
  if (control) {
    console.log('control ' + control.length + ' -> 已覆盖(非pass) ' + ctlPass + '/' + control.length);
    results.control.forEach(x => console.log('  ' + (x.action === 'pass' ? 'CTL-PEN!' : 'ctl-ok   ') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  }
  return { pen, total: attack.length, fp, fpTotal: (benign || []).length, ctlPass, ctlTotal: (control || []).length };
}

const out = {};
out.A = run('A(EN) path-h leg① adjective + testing noun gap (DETECT_UP_EN5)', A_ATTACK, A_BENIGN, A_CONTROL);
out.AZ = run('A(ZH) path-h leg① 更灵敏/更精准 + 检测/检查 noun gap', AZ_ATTACK, AZ_BENIGN, []);
out.B = run('B Berkson hospitalized forms re-probe (collider_bias COND_EN)', B_ATTACK, B_BENIGN, []);
out.C = run('C new gap probes (leg② case numbers plural / leg① coverage verb)', C_ATTACK, C_BENIGN, []);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
