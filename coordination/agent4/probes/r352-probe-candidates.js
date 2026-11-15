'use strict';
// Exploratory probe r352: candidates against integrated tree v6.8.185.
//   A: 路径 h 腿③过去时推断词/was 系动词缺口（INCIDENCE_CLAIM_EN 推断词表
//      只有 shows/showing 无 showed/demonstrated/proved/suggested 等过去时，
//      p2 只收 is/are 无 was——"which showed the disease was truly spreading"
//      形穿透，r351 交接项①；腿①/腿②均用 r350/r351 已落地族覆盖，隔离腿③缺口）
//   B: 路径 h 腿① sensitive/advanced/improved + testing 名词缺口（DETECT_UP_EN
//      p3 名词表 imaging/scans/scanning/tests/assays/screening 缺 testing 名词
//      形、p4 diagnostic 修饰名词表缺 testing，r351 交接项②）
//   C: 腿② legacy 名词表缺 infections/illnesses 单助动词形（CASE_SURGE_EN p9
//      名词表仅 cases/patients/tumors/cancers/lesions，r350 交接项②/r351 留交；
//      r351 CASE_SURGE_EN4 已覆盖双助动词×infections 交集，本轮探单助动词形）
//   D: Berkson 住院选择形再探针（collider_bias COND_EN 缺 hospitalized/
//      inpatient，r349 1/7、r350 4/7、r351 6/10 留交——需改共享常量）
// 控制句：每候选附已被覆盖的同族控制句（证候选形确为新缺口而非重判）。
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: path-h leg③ past-tense inference verbs + was copula ────────
const A_ATTACK = [
  // showed/demonstrated/proved/suggested/revealed 过去时推断词 + was + 结论
  'After the screening program expanded, far more cases were being diagnosed each year, which showed the disease was truly spreading.',
  'With the growing use of MRI, far more lesions are being detected, which demonstrated the disease was really becoming more widespread.',
  'As CT scanning became universal, numerous additional cases are being identified, and the data showed the illness was genuinely on the rise.',
  'Ubiquitous testing means many more infections are being caught, which proved the disease was truly becoming more common.',
  'With wider screening uptake, many more tumors are being picked up, and the results suggested the cancer was really spreading.',
  'Thanks to ubiquitous testing, a growing number of cases is being detected, which revealed the disease was genuinely becoming more widespread.',
  // 无推断词裸 was 形：disease + was + truly + spreading / on the rise
  'Mass screening campaigns mean numerous additional cases are being surfaced, revealing that the disease was truly spreading.',
  'With wider screening, many more cases were brought to light, and it became clear the disease was truly on the rise.',
];
const A_BENIGN = [
  // EN 良性孪生（过去时结论 + 旧豁免族兜底）
  'After the screening program expanded, far more cases were being diagnosed each year, which showed the disease was truly spreading — though the true incidence appears stable once ascertainment is accounted for.',
  'With the growing use of MRI, far more lesions are being detected, which demonstrated the disease was really becoming more widespread — but the actual prevalence does not appear to be rising.',
  'As CT scanning became universal, numerous additional cases are being identified, and the data showed the illness was genuinely on the rise — though the real incidence seems unchanged once ascertainment is accounted for.',
  // 良性陈述（无病例激增腿或无发生率结论腿）
  'The audit report showed the disease was truly spreading in the modeled scenario, so the team expanded the testing budget.',
  'The simulation revealed that the disease was truly spreading under the worst-case assumptions, according to the modeling team.',
  '会议纪要显示，模型推演中这种疾病过去确实在蔓延，团队决定增加备货。',
];
// 控制句：现在时推断词/is 形（r350/r351 已覆盖，应非 pass）
const A_CONTROL = [
  'After the screening program expanded, far more cases were being diagnosed each year, which shows the disease is truly spreading.',
  'With the growing use of MRI, far more lesions are being detected, which demonstrated the disease is really becoming more widespread.',
  'As CT scanning became universal, numerous additional cases are being identified, and the data showed the illness is genuinely on the rise.',
];

// ─── B: path-h leg① sensitive/advanced/improved + testing noun gap ─
const B_ATTACK = [
  'Thanks to sensitive testing, many more cases have been identified, which suggests the disease is really becoming more widespread.',
  'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.',
  'More accurate testing means many more tumors are being picked up, indicating the disease is really on the rise.',
  'Improved testing has identified numerous additional cases, which suggests the disease is truly becoming more common.',
  'Thanks to more precise testing, far more cases have been detected, indicating the disease is genuinely becoming more widespread.',
  'With newer testing methods, many more lesions are being found, which suggests the disease is really spreading.',
  'Better testing identified many more tumors, which suggests the disease is truly on the rise.',
];
const B_BENIGN = [
  'Thanks to sensitive testing, many more cases have been identified, though the real incidence seems stable once ascertainment is accounted for.',
  'With advanced testing, far more cases are being detected, yet the underlying rate appears stable.',
  'More accurate testing means many more tumors are being picked up, but the true incidence may be unchanged.',
  // 良性工程/医疗陈述（无发生率结论腿或无病例激增腿）
  'The lab adopted more sensitive testing, and turnaround times improved markedly.',
  'With newer testing methods, the hospital processed more samples per day.',
  '更灵敏的检测让更多病例被检出，实验室周转时间明显缩短。',
];
// 控制句：腿①已覆盖形（ubiquitous testing / improved surveillance /
// more sensitive imaging）+ 同腿②腿③
const B_CONTROL = [
  'Thanks to ubiquitous testing, many more cases have been identified, which suggests the disease is really becoming more widespread.',
  'With improved surveillance, far more cases have been detected, indicating the disease is genuinely becoming more widespread.',
  'More sensitive imaging finds many more tumors, and the rising case count shows the cancer is truly on the rise.',
];

// ─── C: path-h leg② legacy noun gap infections/illnesses (single-aux) ─
const C_ATTACK = [
  // p9 单助动词形 + infections/illnesses（legacy 名词表缺）
  'Thanks to ubiquitous testing, many more infections have been identified, which suggests the disease is really becoming more widespread.',
  'With wider screening, far more illnesses have been detected, indicating the disease is genuinely on the rise.',
  // p2/p8 名词前置形 + illnesses
  'With wider screening, reported illnesses have tripled, suggesting the disease is really becoming more common.',
  // p10 检出动词前置形 + infections
  'Screening identified many more infections, which suggests the disease is really on the rise.',
  // p1 number-of 名词前置形 + infections
  'With wider screening, the number of identified infections has surged, which proves the disease is truly spreading.',
];
const C_BENIGN = [
  'Thanks to ubiquitous testing, many more infections have been identified, yet the underlying rate appears stable.',
  'With wider screening, far more illnesses have been detected, but the actual prevalence does not appear to be rising.',
  'Screening identified many more infections, and the lab validated the results with confirmatory assays.',
  'The lab reports that identified infections have increased after the new assay was introduced.',
];
// 控制句：legacy p9 已收名词（cases/tumors）同形对照
const C_CONTROL = [
  'Thanks to ubiquitous testing, many more cases have been identified, which suggests the disease is really becoming more widespread.',
  'With wider screening, the number of identified cases has surged, which proves the disease is truly spreading.',
  'Screening identified many more tumors, which suggests the disease is really on the rise.',
];

// ─── D: Berkson hospitalized forms re-probe (collider_bias COND_EN) ─
const D_ATTACK = [
  'Among hospitalized patients, the more a drug is prescribed the lower the mortality, so the drug clearly saves lives.',
  'In the hospital inpatient population, patients who received the new therapy had much lower mortality, so the therapy works.',
  'Within the hospitalised group, smokers show much higher rates of lung cancer, which proves smoking causes lung cancer.',
  'Among hospital inpatients, exercise frequency is inversely related to disease severity, so exercise prevents the disease.',
  'Among hospital-admitted patients, those who took the supplement had far fewer complications, so the supplement protects against complications.',
  'In the in-hospital cohort, earlier treatment is associated with shorter stays, so earlier treatment shortens hospitalization.',
  '住院病人里，接受强化治疗的患者死亡率明显更低，说明强化治疗很有效。',
  '在住院部收治的病人中，合并用药越多感染率越低，可见联合用药能预防感染。',
  '只看住院病例，早期干预越充分复发率越低，所以早期干预能防止复发。',
  '住院患者中，锻炼越充足康复越快，可见锻炼能加速康复。',
];
const D_BENIGN = [
  'Among hospitalized patients, the apparent link may simply reflect that both conditions lead to admission — a classic Berkson bias.',
  'In the hospital inpatient population, both the exposure and the disease raise the odds of admission, so the association may be spurious.',
  '住院病人里看到的关联可能只是因为两者都导致住院，这是对撞偏误的典型例子。',
  '在住院部收治的病人中观察到相关，需要回到全样本验证，不能直接推断因果。',
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
out.A = run('A path-h leg③ past-tense inference verbs + was copula (INCIDENCE_CLAIM_EN gap)', A_ATTACK, A_BENIGN, A_CONTROL);
out.B = run('B path-h leg① sensitive/advanced/improved + testing noun gap (DETECT_UP_EN p3/p4)', B_ATTACK, B_BENIGN, B_CONTROL);
out.C = run('C path-h leg② legacy noun gap infections/illnesses single-aux (CASE_SURGE_EN p9)', C_ATTACK, C_BENIGN, C_CONTROL);
out.D = run('D Berkson hospitalized forms re-probe (collider_bias COND_EN)', D_ATTACK, D_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
