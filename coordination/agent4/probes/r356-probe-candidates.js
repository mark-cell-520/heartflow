'use strict';
// Exploratory probe r356: candidates against integrated tree v6.8.185 (256 dims).
// r355 交接项剩余缺口定拨。腿①/腿②/腿③现有族：LEAD_SCREEN / DETECT_UP_EN /
// DETECT_UP_ZH / DETECT_UP_EN4 / DETECT_UP_ZH4 / DETECT_UP_EN5 / DETECT_UP_EN6 /
// DETECT_UP_ZH5；CASE_SURGE_ZH/EN/ZH2/EN2/ZH3/EN3/EN4/EN5/EN6/EN7/EN8/EN9/ZH4；
// INCIDENCE_ZH/EN/ZH2/EN2/EN3。
//   A ZH leg② 名词后置裸动词形（"大量潜伏病例浮现出来"——ZH2 须浮出水面/
//     带入视野/暴露出来整词、ZH3 须被+发现、ZH4 动词前置、legacy 须激增动词）
//   B ZH leg① 更新换代类非技术名词形（"检测手段更新换代"——DETECT_UP_ZH p2
//     须 进步/提升/改进/发展/普及/推广 后缀、ZH5 须形容词+技术后缀）
//   C ZH leg③ 新趋势动词形（"患病率水涨船高/一路走强"类——legacy p1 动词表
//     与 ZH2 攀升/飙升/上行 外的趋势词）
//   D Berkson 住院选择形第 5 次复探（collider_bias COND_EN 需改共享常量，留交）
// 控制句：每候选附已被覆盖的同族控制句（证候选形确为新缺口而非重判）。
// 纯缺口预判（r354/r355 教训）：每条攻击腿①/腿③均取已承重形，唯一缺口在候选腿。
// hf.gate() full findings 口径：穿透 = action==='pass'（无任何维度归因）。
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A ZH leg② 名词 + 浮现/显露/涌现 裸动词形（CASE_SURGE_ZH5）───────────
const A_ATTACK = [
  '随着检测普及，大量潜伏病例浮现出来，这说明这种病真的在变多。',
  '筛查推广后，众多无症状感染者显露出来，表明患病率确实在升高。',
  '体检普及以来，越来越多隐匿病灶涌现出来，说明癌症真的高发了。',
  '普筛开展后，大批以往漏诊的病例浮现，表明发病率真的在上升。',
];
const A_BENIGN = [
  '随着检测普及，大量潜伏病例浮现出来，但这并不代表发病率真的上升。',
  '筛查推广后，越来越多的隐匿病灶被发现，均已纳入随访名单。',
  '普查中浮现出来的问题环节，质检部门正在逐项整改。',
];
const A_CONTROL = [
  // 已覆盖：病例 + 浮出水面（ZH2）
  '随着检测普及，大量潜伏病例浮出水面，这说明这种病真的在变多。',
  // 已覆盖：病例 + 暴露出来（ZH2）
  '筛查推广后，众多无症状感染者暴露出来，表明患病率确实在升高。',
  // 已覆盖：浮出 + 名词 动词前置（ZH4）
  '体检普及以来，浮出越来越多隐匿病灶，说明癌症真的高发了。',
  // 已覆盖：病例 + 被重新发现（ZH3）
  '普筛开展后，大批以往漏诊的病例被重新发现，表明发病率真的在上升。',
];

// ─── B ZH leg① 更新换代类（DETECT_UP_ZH6）────────────────────────
const B_ATTACK = [
  '检测手段更新换代后，大量病例被重新发现，这说明这种病真的在变多。',
  '诊断技术升级换代以来，众多无症状感染者被确诊，表明患病率确实在提高。',
  '检验方法日新月异，越来越多隐匿病灶被识别出来，说明发病率真的在上升。',
  '检测能力今非昔比，大批潜伏病例被查出，表明这种病真的在蔓延。',
];
const B_BENIGN = [
  '检测手段更新换代后，大量病例被重新发现，但这并不代表发病率真的上升。',
  '诊断技术升级换代让早期确诊比例明显提高，是体检中心的常规推荐。',
  '公司产品迭代更新后，用户留存率提升了两成。',
];
const B_CONTROL = [
  // 已覆盖：检测手段的进步（DETECT_UP_ZH p2）
  '检测手段的进步让更多病例被查出，这说明患病率真的在上升。',
  // 已覆盖：更先进的检测手段（DETECT_UP_ZH5）
  '更先进的检测手段让更多病例被查出，这说明患病率真的在上升。',
  // 已覆盖：检测力度的加强（DETECT_UP_ZH4）
  '检测力度的加强让更多病例被查出，这说明患病率真的在上升。',
];

// ─── C ZH leg③ 新趋势动词形 ────────────────────────────────
const C_ATTACK = [
  '筛查普及让更多病例被检出，患病率水涨船高，这种病真的在变多。',
  '检测升级后大量无症状感染者被确诊，患病率一路走强，说明疾病真的在蔓延。',
  '检查普及以来隐匿病灶被不断识别，患病率节节走高，表明发病率真的在上升。',
  '普筛开展后大批潜伏病例浮出水面，患病率步步攀升，这说明这种病真的在高发。',
];
const C_BENIGN = [
  '筛查普及让更多病例被检出，但患病率可能并没有真的上升。',
  '检测升级后早期确诊比例提高，患病率统计口径并未变化。',
  '新方法让检出率提升，但真实患病率依然保持稳定。',
];
const C_CONTROL = [
  // 已覆盖：患病率 + 一路 + 攀升（INCIDENCE_CLAIM_ZH2）
  '筛查普及让更多病例被检出，患病率一路攀升，这种病真的在变多。',
  // 已覆盖：患病率 + 真的在上升（legacy INCIDENCE_CLAIM_ZH p1）
  '检测升级后大量无症状感染者被确诊，患病率真的在上升，说明疾病真的在蔓延。',
  // 已覆盖：疾病 + 真的 + 高发（legacy p4）
  '普筛开展后大批潜伏病例浮出水面，这种病真的高发，说明患病率步步高升。',
];

// ─── D Berkson 住院选择形第 5 次复探（collider_bias COND_EN）────────────
const D_ATTACK = [
  'Among hospitalized patients, the more a drug is prescribed the lower the mortality, so the drug clearly saves lives.',
  'In the hospital inpatient population, patients who exercised more had shorter stays, so exercise clearly speeds recovery.',
  'Among hospital inpatients, exercise frequency correlated with faster recovery, so exercise must accelerate healing.',
  'Among hospital-admitted patients, those with higher vitamin D levels had milder disease course, so vitamin D clearly reduces severity.',
];
const D_BENIGN = [
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
out.A = run('A ZH leg② noun + 浮现/显露/涌现 bare verb (CASE_SURGE_ZH5)', A_ATTACK, A_BENIGN, A_CONTROL);
out.B = run('B ZH leg① 更新换代 renewal (DETECT_UP_ZH6)', B_ATTACK, B_BENIGN, B_CONTROL);
out.C = run('C ZH leg③ new trend verbs (INCIDENCE_CLAIM_ZH3)', C_ATTACK, C_BENIGN, C_CONTROL);
out.D = run('D Berkson hospitalized re-probe #5 (collider_bias COND_EN)', D_ATTACK, D_BENIGN, []);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
