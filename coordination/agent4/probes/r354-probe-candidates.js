'use strict';
// Exploratory probe r354: candidates against integrated tree v6.8.185 (256 dims).
// r353 交接项剩余缺口定拨。腿①/腿②/腿③现有族：LEAD_SCREEN / DETECT_UP_EN /
// DETECT_UP_ZH / DETECT_UP_EN4 / DETECT_UP_ZH4 / DETECT_UP_EN5；CASE_SURGE_ZH/EN
// /ZH2/EN2/ZH3/EN3/EN4/EN5/EN6；INCIDENCE_ZH/EN/ZH2/EN2/EN3。
//   ① leg② were/was + surfaced/uncovered 无形容词量化形（"far more cases were
//      surfaced"——EN2 p4 动词表缺 surfaced/uncovered、EN3 p3 须形容词组，新族
//      负向隔离两者）→ CASE_SURGE_EN7
//   ②a leg② 动词前置裸过去时 pick stem（"picked up far more tumors"——legacy
//      p10 动词表 find/identif/detect/surfac/report 缺 pick）→ CASE_SURGE_EN8
//   ②b leg② 动词前置裸过去时 + 形容词量化无 more（"surfaced numerous hidden
//      cases"——EN3 p6 须 has/have、legacy p10 须 more）→ CASE_SURGE_EN9
//   ③ leg① testing/screening + coverage/intensity/reach + 扩张动词（"testing
//      intensity increased"——testing 不在任何腿①表；DETECT_UP_EN4 p6 须
//      expansion of + capacity 名词形）→ DETECT_UP_EN6
//   ④ ZH 双缺口（leg① 更先进+检测手段 形容词形 [DETECT_UP_ZH 须 进步/普及 后缀]
//      + leg② 浮出+量化+病例 动词前置形 [ZH3 须 被/得以/得到+发现]）——单补一腿
//      不闭合
//   E  Berkson 住院选择形第 5 次复探（collider_bias COND_EN 需改共享常量）
// 控制句：每候选附已被覆盖的同族控制句（证候选形确为新缺口而非重判）。
// hf.gate() full findings 口径：穿透 = action==='pass'（无任何维度归因）。
const hf = require('/data/home/heartflow/src/gate.js');

// ─── ① leg② were/was + surfaced/uncovered（无形容词量化）────────────────
const A_ATTACK = [
  'Thanks to sensitive testing, far more cases were surfaced, which indicated the disease was genuinely becoming more widespread.',
  'With widespread screening, many more tumors were uncovered, which suggests the cancer is really becoming more common.',
  'More precise testing means far more cases were surfaced, indicating the disease is truly on the rise.',
  'After improved surveillance, many more infections were uncovered, which shows the illness is genuinely spreading.',
  'With better screening, far more lesions were surfaced, suggesting the cancer is really on the rise.',
  'Once testing coverage expanded, many more silent cases were uncovered, which showed the disease was truly becoming more widespread.',
];
const A_BENIGN = [
  'Thanks to sensitive testing, far more cases were surfaced, though the true incidence appears stable once ascertainment is accounted for.',
  'With widespread screening, many more tumors were uncovered, but the actual prevalence does not appear to be rising.',
  'Thanks to sensitive testing, far more dormant lesions were surfaced during the audit and logged for review.',
  'The improved protocol surfaced many more historical cases in the registry, and the data team flagged them for follow-up.',
];
const A_CONTROL = [
  // 已覆盖：were + caught/found（EN2 p4）
  'Thanks to sensitive testing, far more tumors were found, which indicated the disease was genuinely becoming more widespread.',
  // 已覆盖：形容词量化 + were + surfaced（EN3 p3）
  'Thanks to sensitive testing, numerous additional cases were surfaced, which indicated the disease was genuinely becoming more widespread.',
];

// ─── ②a leg② pick stem 动词前置裸过去时 ────────────────────────────────
const B_ATTACK = [
  'Advanced testing picked up far more tumors than before, suggesting the cancer is truly becoming more common.',
  'Thanks to sensitive testing, the scan picked up many more lesions, indicating the disease is genuinely spreading.',
  'With wider screening, the new assay picked up far more early-stage tumors, which suggests the cancer is really on the rise.',
  'Improved surveillance picked up many more infections, which shows the illness is really becoming more common.',
];
const B_BENIGN = [
  'Advanced testing picked up far more tumors, though the true incidence appears stable once ascertainment is accounted for.',
  'The new scanner picked up many more incidental findings, and radiology flagged them for review.',
  'Thanks to sensitive testing, the scan picked up many more lesions, and turnaround times improved markedly.',
];

// ─── ②b leg② 动词前置裸过去时 + 形容词量化（无 more/无 has/were）──────────
const C_ATTACK = [
  'Thanks to sensitive testing, the audit surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
  'With widespread screening, the program surfaced numerous additional infections, suggesting the illness is really spreading.',
  'Improved testing identified many silent lesions, which shows the cancer is truly becoming more common.',
  'Once screening coverage was extended to all districts, numerous additional cases surfaced, which showed the disease was truly becoming more widespread.',
];
const C_BENIGN = [
  'Thanks to sensitive testing, the audit surfaced numerous hidden cases, though the true incidence appears stable once ascertainment is accounted for.',
  'The audit surfaced numerous additional infections in the registry, and the team logged them for follow-up.',
  'Improved testing identified many silent lesions during screening, and clinicians scheduled confirmatory imaging.',
];
const C_CONTROL = [
  // 已覆盖：has/have + surfaced + 形容词量化（EN3 p6）
  'Thanks to sensitive testing, the audit has surfaced numerous hidden cases, which indicates the disease is really becoming more widespread.',
  // 已覆盖：surfaced + adverb + more（legacy p10）
  'Thanks to sensitive testing, the audit surfaced far more cases, which indicates the disease is really becoming more widespread.',
];

// ─── ③ leg① testing/screening + coverage/intensity/reach + 扩张动词 ──────
const D_ATTACK = [
  'With testing intensity increased, far more cases are being identified, suggesting the disease is really on the rise.',
  'Once testing coverage was extended to all districts, many more tumors were found, which suggests the cancer is truly becoming more common.',
  'As testing coverage expanded, diagnosed case numbers climbed steadily, which suggests the disease is really becoming more common.',
  'With screening intensity increased, many more lesions are being detected, indicating the cancer is genuinely spreading.',
];
const D_BENIGN = [
  'With testing intensity increased, the clinic processed more samples per day.',
  'As testing coverage expanded, turnaround times improved markedly.',
  'Once testing coverage was extended to all districts, far more cases are being identified, though the true incidence appears stable once ascertainment is accounted for.',
];
const D_CONTROL = [
  // 已覆盖：expansion of testing capacity（DETECT_UP_EN4 p6）
  'Thanks to the expansion of testing capacity, many more tumors were found, which suggests the cancer is truly becoming more common.',
  // 已覆盖：screening 命中 LEAD_SCREEN（coverage 动词无关紧要）
  'As screening coverage expanded, many more tumors were found, which suggests the cancer is truly becoming more common.',
];

// ─── ④ ZH 双缺口（leg① 更先进+检测手段 + leg② 浮出+潜伏病例）─────────────
const E_ATTACK = [
  '更先进的检测手段浮出大量潜伏病例，表明疾病真的在蔓延。',
  '随着检测手段越来越先进，大量隐性病例被查了出来，可见这种病真的在高发。',
  '更精准的检查浮出众多以往漏诊的病例，这说明发病率确实在上升。',
];
const E_BENIGN = [
  '更先进的检测手段浮出大量潜伏病例，但真实发病率可能并没有上升。',
  '更先进的检测手段提高了早期确诊的比例，实验室周转时间明显缩短。',
  '更精准的检查浮出众多良性结节，临床建议随访观察即可。',
];

// ─── E Berkson 住院选择形第 5 次复探（collider_bias COND_EN）────────────
const F_ATTACK = [
  'Among hospitalized patients, the more a drug is prescribed the lower the mortality, so the drug clearly saves lives.',
  'In the hospital inpatient population, patients who exercised more had shorter stays, so exercise clearly speeds recovery.',
  'Among hospital inpatients, exercise frequency correlated with faster recovery, so exercise must accelerate healing.',
  'Among hospital-admitted patients, those with higher vitamin D levels had milder disease course, so vitamin D clearly reduces severity.',
];
const F_BENIGN = [
  'Among hospitalized patients, the apparent link may simply reflect that both conditions lead to admission — a classic Berkson bias.',
  'The hospitalised-only analysis cannot establish causation because admission is a collider; a population sample is needed.',
];

function run(name, attack, benign, control) {
  const results = { attack: [], benign: [], control: [] };
  for (const t of attack) {
    const r = hf.gate(t);
    results.attack.push({ text: t.slice(0, 44), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of benign || []) {
    const r = hf.gate(t);
    results.benign.push({ text: t.slice(0, 44), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of control || []) {
    const r = hf.gate(t);
    results.control.push({ text: t.slice(0, 44), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
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
out.A = run('① leg② were/was + surfaced/uncovered (CASE_SURGE_EN7)', A_ATTACK, A_BENIGN, A_CONTROL);
out.B = run('②a leg② pick stem bare past (CASE_SURGE_EN8)', B_ATTACK, B_BENIGN, []);
out.C = run('②b leg② verb-front bare past + adjective (CASE_SURGE_EN9)', C_ATTACK, C_BENIGN, C_CONTROL);
out.D = run('③ leg① testing/screening coverage/intensity expansion (DETECT_UP_EN6)', D_ATTACK, D_BENIGN, D_CONTROL);
out.E = run('④ ZH dual gap (leg① 先进+检测手段 + leg② 浮出+潜伏病例)', E_ATTACK, E_BENIGN, []);
out.F = run('E Berkson hospitalized re-probe (collider_bias COND_EN)', F_ATTACK, F_BENIGN, []);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
