'use strict';
// Exploratory probe r351: candidates against integrated tree v6.8.185.
//   A: Berkson 住院选择形（collider_bias COND_EN 名词表缺 hospitalized/
//      inpatient/hospitalised，r349/r350 两轮留交项——需改共享常量 COND_EN）
//   B: 路径 h 腿②双助动词被动形（are being / were being + detected/
//      identified——CASE_SURGE_EN p9 单助动词可选组 are/being/got/getting/
//      have been/has been 不收"are being"双助动词组合，r350 交接项①）
//   C: 腿②名词表缺 infections/illnesses（"many more infections have been
//      identified"形——EN3 p1/p3/p6 已收 infections/illnesses，但 legacy
//      CASE_SURGE_EN p9 单助动词族名词表仅 cases/patients/tumors/cancers/
//      lesions，r350 交接项②）
// 控制句：每候选附已被覆盖的同族控制句（证候选形确为新缺口而非重判）。
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: Berkson hospitalized-patient forms (collider_bias) ──────────
const A_ATTACK = [
  // EN: hospitalized / inpatient / hospitalised 形（COND_EN p1 名词表缺）
  'Among hospitalized patients, the more a drug is prescribed the lower the mortality, so the drug clearly saves lives.',
  'In the hospital inpatient population, patients who received the new therapy had much lower mortality, so the therapy works.',
  'Within the hospitalised group, smokers show much higher rates of lung cancer, which proves smoking causes lung cancer.',
  'Among hospital inpatients, exercise frequency is inversely related to disease severity, so exercise prevents the disease.',
  // EN: hospital-admitted / in-hospital 修饰形
  'Among hospital-admitted patients, those who took the supplement had far fewer complications, so the supplement protects against complications.',
  'In the in-hospital cohort, earlier treatment is associated with shorter stays, so earlier treatment shortens hospitalization.',
  // ZH: 住院部/住院病人里 无"在"前缀形 / 收治形
  '住院病人里，接受强化治疗的患者死亡率明显更低，说明强化治疗很有效。',
  '在住院部收治的病人中，合并用药越多感染率越低，可见联合用药能预防感染。',
  '只看住院病例，早期干预越充分复发率越低，所以早期干预能防止复发。',
  '住院患者中，锻炼越充足康复越快，可见锻炼能加速康复。',
];
const A_BENIGN = [
  'Among hospitalized patients, the apparent link may simply reflect that both conditions lead to admission — a classic Berkson bias.',
  'In the hospital inpatient population, both the exposure and the disease raise the odds of admission, so the association may be spurious.',
  '住院病人里看到的关联可能只是因为两者都导致住院，这是对撞偏误的典型例子。',
  '在住院部收治的病人中观察到相关，需要回到全样本验证，不能直接推断因果。',
  // 良性临床/医疗陈述（无样本内相关⇒总体因果结论腿）
  'Among hospitalized patients, hand hygiene compliance improved after the new protocol was introduced.',
  '住院病人里，护士每班核对两次医嘱，这是医疗安全常规。',
];
// 控制句：已被 COND_EN 覆盖的形（among the patients / restricted to）
const A_CONTROL = [
  'Among the patients who survived the first year, those who exercised more had lower readmission rates, so exercise prevents readmission.',
  'Restricted to admitted students, those who studied less reported slower response times.',
];

// ─── B: path-h leg② dual-auxiliary passive forms ────────────────────
const B_ATTACK = [
  // are being / were being + 检出动词（p9 单助动词可选组不收双助动词组合）
  'With the growing use of MRI, far more lesions are being detected, suggesting the disease is really spreading.',
  'As CT scanning became universal, numerous additional cases are being identified, indicating the illness is genuinely on the rise.',
  'Ubiquitous testing means many more infections are being caught, which suggests the disease is truly becoming more widespread.',
  'With wider screening uptake, many more tumors are being picked up, suggesting the cancer is really becoming more common.',
  // were being 过去双助动词形
  'After the screening program expanded, far more cases were being diagnosed each year, which shows the disease is truly spreading.',
  'Once mass testing began, many more infections were being identified, suggesting the illness is really becoming more common.',
  // is being 单数主语形（a growing number of + is being）
  'Thanks to ubiquitous testing, a growing number of cases is being detected, which suggests the disease is really on the rise.',
];
const B_BENIGN = [
  'With the growing use of MRI, far more lesions are being detected, yet the underlying rate appears stable.',
  'As CT scanning became universal, numerous additional cases are being identified, but the true incidence may be unchanged.',
  'Ubiquitous testing means many more infections are being caught, though the actual prevalence does not appear to be rising.',
  'After the screening program expanded, far more cases were being diagnosed each year, though the real incidence seems unchanged once ascertainment is accounted for.',
  // 良性工程/医疗陈述（无发生率结论腿）
  'The radiology department reports that more images are being processed per day after the system upgrade.',
  '随着检测流程改造，更多样本正在被检测，实验室周转时间明显缩短。',
];
// 控制句：已被 p9 单助动词族覆盖的形（are detected / being detected /
// have been identified / more cases identified）
const B_CONTROL = [
  'With the growing use of MRI, far more lesions are detected, suggesting the disease is really spreading.',
  'As CT scanning became universal, numerous additional cases have been identified, indicating the illness is genuinely on the rise.',
  'Ubiquitous testing means many more infections are being caught, which suggests the disease is truly becoming more widespread.',
];

// ─── C: leg② noun-table gap infections/illnesses (legacy family) ────
const C_ATTACK = [
  // 单助动词被动形 + infections/illnesses（legacy p9 名词表缺）
  'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
  'With wider screening, far more illnesses have been detected, indicating the disease is genuinely on the rise.',
  // number-of 名词前置形 + infections（p1/p3 名词表缺）
  'The number of identified infections has surged, which proves the disease is truly spreading.',
  'Reported illnesses have tripled, suggesting the disease is really becoming more common.',
  // 检出动词前置形 + infections（p10 名词表缺）
  'Screening identified many more infections, which suggests the disease is really on the rise.',
  // 控制形：同族已收名词（cases/tumors）对照
  'Thanks to ubiquitous testing, many more cases have been identified, which suggests the disease is really becoming more widespread.',
];
const C_BENIGN = [
  'Thanks to ubiquitous testing, many more infections have been identified, though the real incidence seems stable once ascertainment is accounted for.',
  'With wider screening, far more illnesses have been detected, but the actual prevalence does not appear to be rising.',
  'The number of identified infections has surged, yet the true incidence may be unchanged.',
  // 良性工程/医疗陈述（无发生率结论腿）
  'The lab reports that identified infections have increased after the new assay was introduced.',
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
out.A = run('A Berkson hospitalized forms (collider_bias COND_EN)', A_ATTACK, A_BENIGN, A_CONTROL);
out.B = run('B path-h leg② dual-auxiliary passive (are/were being + detected)', B_ATTACK, B_BENIGN, B_CONTROL);
out.C = run('C path-h leg② noun gap infections/illnesses (legacy family)', C_ATTACK, C_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
