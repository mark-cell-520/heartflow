'use strict';
// Exploratory probe r355: candidates against integrated tree v6.8.185 (256 dims).
// r354 交接项剩余缺口定拨。腿①/腿②/腿③现有族：LEAD_SCREEN / DETECT_UP_EN /
// DETECT_UP_ZH / DETECT_UP_EN4 / DETECT_UP_ZH4 / DETECT_UP_EN5 / DETECT_UP_EN6；
// CASE_SURGE_ZH/EN/ZH2/EN2/ZH3/EN3/EN4/EN5/EN6/EN7/EN8；
// INCIDENCE_ZH/EN/ZH2/EN2/EN3。
//   A leg② 动词前置 more+形容词+名词形（"picked up far more early-stage tumors"
//     ——EN8(a) 须 more+名词紧跟、legacy p10 词干表缺 pick）→ CASE_SURGE_EN9(a)
//   B leg② 名词+裸过去时无助动词形（"numerous additional cases surfaced"——
//     EN8(b) 动词前置、EN3 p3/EN7 须 were/was、EN3 p6 须 has/have）→ CASE_SURGE_EN9(b)
//   C ZH leg① 形容词前置形（"更先进的检测手段"——DETECT_UP_ZH 须 进步/普及 后缀，
//     p1 须 的+普及类后缀）→ DETECT_UP_ZH5
//   D ZH leg② 浮出/暴露+量化+病例 动词前置形（"浮出大量潜伏病例"——ZH2 须
//     浮出水面整词、ZH3 须 被/得以/得到+发现）→ CASE_SURGE_ZH4
//   E ZH 双缺口组合句（C+D 两家族齐落地才闭合，单补一腿不判）
//   F Berkson 住院选择形第 5 次复探（collider_bias COND_EN 需改共享常量，留交）
// 控制句：每候选附已被覆盖的同族控制句（证候选形确为新缺口而非重判）。
// 纯缺口预判（r354 教训）：每条攻击腿①/腿③均取已承重形，唯一缺口在候选腿。
// hf.gate() full findings 口径：穿透 = action==='pass'（无任何维度归因）。
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A leg② pick + more + 形容词 + 名词（CASE_SURGE_EN9a）────────────────
const A_ATTACK = [
  'With sensitive testing, the scan picked up far more early-stage tumors, suggesting the cancer is truly becoming more common.',
  'Thanks to improved testing, the assay picked up many more small lesions, indicating the disease is genuinely spreading.',
  'After testing coverage expanded, the program picked up significantly more indolent cancers, which shows the illness is really becoming more widespread.',
  'With wider screening, the clinic picked up far more early-stage cases, suggesting the disease is truly on the rise.',
];
const A_BENIGN = [
  'With sensitive testing, the scan picked up far more early-stage tumors, though the true incidence appears stable.',
  'The new protocol picked up far more early-stage tumors in the pilot, and the radiology team logged them for review.',
  'Better imaging picked up many more small nodules, most of which were benign on follow-up.',
];
const A_CONTROL = [
  // 已覆盖：pick + more + 名词紧跟（EN8a）
  'With sensitive testing, the scan picked up far more tumors, suggesting the cancer is truly becoming more common.',
];

// ─── B leg② 形容词量化 + 名词 + 裸过去时无助动词（CASE_SURGE_EN9b）──────────
const B_ATTACK = [
  'With sensitive testing, numerous additional cases surfaced, proving the disease is becoming more common.',
  'Thanks to improved surveillance, many previously hidden infections surfaced, suggesting the illness is really spreading.',
  'After testing coverage expanded, numerous silent cases surfaced, which indicates the cancer is truly becoming more widespread.',
  'With widespread testing, far more cases surfaced, showing the disease is genuinely on the rise.',
];
const B_BENIGN = [
  'With sensitive testing, numerous additional cases surfaced, but the actual prevalence does not appear to be rising.',
  'Numerous additional historical cases surfaced during the audit, and the data team flagged them for follow-up.',
  'Many previously hidden infections surfaced in the registry review, prompting a quality improvement project.',
];
const B_CONTROL = [
  // 已覆盖：形容词量化 + 名词 + were + surfaced（EN3 p3）
  'With sensitive testing, numerous additional cases were surfaced, proving the disease is becoming more common.',
  // 已覆盖：more + 名词 + were + surfaced（EN7）
  'With sensitive testing, far more cases were surfaced, proving the disease is becoming more common.',
];

// ─── C ZH leg① 形容词前置形（DETECT_UP_ZH5）────────────────────
// 纯缺口预判（r354 教训）：腿②避开"检出"（LEAD_SCREEN_ZH 已收"检出"——
// 初版第 1 句"被检出"被既有族代拦，非纯缺口）；第 3 句原"工具投入使用后"
// 被 pseudo_causal 代拦（不截胡纪律），改"方法应用后"形。
const C_ATTACK = [
  '随着更灵敏的影像检查应用，大量病例被重新发现，表明这种病真的在变多。',
  '新型的检验技术上线后，大量无症状感染者被确诊，表明患病率确实在提高。',
  '更先进的诊断方法应用后，众多潜伏病例被识别出来，说明发病率确实在升高。',
  '随着更精确的检验手段应用，大批隐匿病灶被查出，表明这种病真的在蔓延。',
];
const C_BENIGN = [
  '更先进的检测手段让更多早期肿瘤被检出，但这并不代表发病率真的上升。',
  '更先进的检测手段有助于早发现早治疗，是体检中心的常规推荐。',
  '新型检验技术上线后，实验室周转时间明显缩短，成本下降了三成。',
];
const C_CONTROL = [
  // 已覆盖：检测手段的进步（DETECT_UP_ZH p2）
  '检测手段的进步让更多早期肿瘤被检出，这说明患病率真的在上升。',
  // 已覆盖：检查的普及 + 被查出（DETECT_UP_ZH p1 + CASE_SURGE_ZH3）
  '检查的普及让更多病例被查出，这说明患病率真的在上升。',
];

// ─── D ZH leg② 浮出/暴露 + 量化 + 病例 动词前置形（CASE_SURGE_ZH4）────────
const D_ATTACK = [
  '随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。',
  '筛查推广后，浮现出许多无症状感染者，表明患病率确实在升高。',
  '体检普及以来，暴露出越来越多隐匿病灶，说明癌症真的高发了。',
  '普筛开展后，显露出大量以往漏诊的病例，表明发病率真的在上升。',
];
const D_BENIGN = [
  '随着检测普及，浮出大量潜伏病例，但这并不代表发病率真的上升。',
  '筛查推广后浮现出的无症状感染者，均已纳入随访名单。',
  '普筛后暴露出不少问题环节，质检部门正在整改。',
];
const D_CONTROL = [
  // 已覆盖：病例 + 浮出水面（ZH2）
  '随着检测普及，大量潜伏病例浮出水面，这说明这种病真的在变多。',
  // 已覆盖：病例 + 被重新发现（ZH3）
  '筛查推广后，大量隐匿病例被重新发现，表明患病率确实在升高。',
];

// ─── E ZH 双缺口组合（C + D 齐落地才闭合）─────────────────────────────
const E_ATTACK = [
  '更先进的检测手段浮出大量潜伏病例，这说明这种病真的在变多。',
  '随着更精准的检查技术应用，浮出众多以往漏诊的病例，表明发病率确实在上升。',
  '新型检验技术上线后，暴露出大量无症状感染者，说明患病率真的在提高。',
];
const E_BENIGN = [
  '更先进的检测手段浮出大量潜伏病例，但真实发病率可能并没有上升。',
  '更先进的检测手段提高了早期确诊比例，实验室周转时间明显缩短。',
];

// ─── F Berkson 住院选择形第 5 次复探（collider_bias COND_EN）────────────
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
out.A = run('A leg② pick + more + adjective + noun (CASE_SURGE_EN9a)', A_ATTACK, A_BENIGN, A_CONTROL);
out.B = run('B leg② quantifier + noun + bare past (CASE_SURGE_EN9b)', B_ATTACK, B_BENIGN, B_CONTROL);
out.C = run('C ZH leg① adjective-front detection-means (DETECT_UP_ZH5)', C_ATTACK, C_BENIGN, C_CONTROL);
out.D = run('D ZH leg② 浮出/暴露 + quantifier + case verb-front (CASE_SURGE_ZH4)', D_ATTACK, D_BENIGN, D_CONTROL);
out.E = run('E ZH dual gap combo (needs both C and D families)', E_ATTACK, E_BENIGN, []);
out.F = run('F Berkson hospitalized re-probe #5 (collider_bias COND_EN)', F_ATTACK, F_BENIGN, []);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
