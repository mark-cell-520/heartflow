'use strict';
// Exploratory probe r357 round1: candidates against integrated tree v6.8.185 (256 dims).
// r356 交接项 + 本轮新词形候选（路径 h 剩余缺口定拨）：
//   A 腿② 被+低频副词+检出动词（r356 交接项①：CASE_SURGE_ZH6 副词表只收高频，
//     猛然/骤然/成批/批量/成群 未收）
//   B 腿① 新进步动词形（DETECT_UP_ZH6 动词表外：突飞猛进/日臻成熟/日趋精湛/
//     今胜于昔）
//   C 腿③ 新趋势动词形（r356 交接项③：INCIDENCE_CLAIM_ZH3 只收 4 词，
//     抬头/回升/翘尾/看高/反弹 未收；走高已 legacy 承重不收）
//   D 腿② 新激增名词形（legacy CASE_SURGE_ZH 激增动词表外：井喷/狂飙/滚雪球/
//     屡创新高）
//   E 腿①名词中介良性隐患实测（r356 交接项②：检测平台更新换代/检测系统升级/
//     产品迭代更新——应不判，被腿①误配即 FP）
// 干净腿框纪律：每条攻击非候选腿均取已承重形，唯一缺口在候选腿。
// hf.gate() full findings 口径：穿透 = action==='pass'（无任何维度归因）。
// 模块级 legs 隔离：__internals 常量逐腿命中，确认缺口腿归属。
const hf = require('/data/home/heartflow/src/gate.js');
const itb = require('/data/home/heartflow/src/immortal-time-bias.js');
const R = itb.__internals();

function anyHit(list, text) {
  if (!list) return false;
  return list.some(re => { re.lastIndex = 0; return re.test(text); });
}
function leg1(text) {
  return anyHit(R.LEAD_SCREEN_ZH, text) || anyHit(R.LEAD_SCREEN_EN, text) ||
    anyHit(R.DETECT_UP_EN, text) || anyHit(R.DETECT_UP_ZH, text) ||
    anyHit(R.DETECT_UP_EN4, text) || anyHit(R.DETECT_UP_ZH4, text) ||
    anyHit(R.DETECT_UP_EN5, text) || anyHit(R.DETECT_UP_ZH5, text) ||
    anyHit(R.DETECT_UP_EN6, text) || anyHit(R.DETECT_UP_ZH6, text);
}
function leg2(text) {
  return anyHit(R.CASE_SURGE_ZH, text) || anyHit(R.CASE_SURGE_EN, text) ||
    anyHit(R.CASE_SURGE_ZH2, text) || anyHit(R.CASE_SURGE_EN2, text) ||
    anyHit(R.CASE_SURGE_ZH3, text) || anyHit(R.CASE_SURGE_EN3, text) ||
    anyHit(R.CASE_SURGE_EN4, text) || anyHit(R.CASE_SURGE_EN5, text) ||
    anyHit(R.CASE_SURGE_EN6, text) || anyHit(R.CASE_SURGE_EN7, text) ||
    anyHit(R.CASE_SURGE_EN8, text) || anyHit(R.CASE_SURGE_EN9, text) ||
    anyHit(R.CASE_SURGE_ZH4, text) || anyHit(R.CASE_SURGE_ZH5, text) ||
    anyHit(R.CASE_SURGE_ZH6, text);
}
function leg3(text) {
  return anyHit(R.INCIDENCE_CLAIM_ZH, text) || anyHit(R.INCIDENCE_CLAIM_EN, text) ||
    anyHit(R.INCIDENCE_CLAIM_ZH2, text) || anyHit(R.INCIDENCE_CLAIM_EN2, text) ||
    anyHit(R.INCIDENCE_CLAIM_EN3, text) || anyHit(R.INCIDENCE_CLAIM_ZH3, text);
}

// ─── A 腿② 被+低频副词+检出动词 ────────────────────────────────
const A_ATTACK = [
  '检查普及以来，众多隐匿病灶被猛然发现，说明患病率真的在上升。',
  '筛查推广后，大量无症状感染者被骤然确诊，表明发病率确实在提高。',
  '普筛开展后，大批隐匿病例被成批检出，这说明这种病真的在变多。',
  '体检普及以来，越来越多潜伏病例被批量识别，表明患病率真的在升高。',
  '检测升级后，众多隐匿病灶被成群查出，说明发病率真的在上升。',
];
const A_BENIGN = [
  '检查普及以来，众多隐匿病灶被猛然发现，但这并不代表发病率真的上升。',
  '筛查推广后，大量无症状感染者被骤然确诊，均已纳入随访名单。',
];
const A_CONTROL = [
  // 已覆盖：被+陆续+发现（CASE_SURGE_ZH6）
  '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。',
  // 已覆盖：被+大量+确诊（CASE_SURGE_ZH6）
  '筛查推广后，大量无症状感染者被大量确诊，表明发病率确实在提高。',
];

// ─── B 腿① 新进步动词形 ────────────────────────────────────────
const B_ATTACK = [
  '检测技术突飞猛进后，大量病例被重新发现，这说明这种病真的在变多。',
  '检出手段日臻成熟，越来越多隐匿病灶被识别出来，说明发病率真的在上升。',
  '诊断技术日趋精湛，大批潜伏病例被查出，表明患病率确实在提高。',
  '检测能力今胜于昔，大量病例浮出水面，这说明这种病真的在蔓延。',
];
const B_BENIGN = [
  '检测技术突飞猛进后，大量病例被重新发现，但这并不代表发病率真的上升。',
  '诊断技术日趋精湛，早期确诊比例明显提高，是体检中心的常规推荐。',
];
const B_CONTROL = [
  // 已覆盖：检测手段更新换代（DETECT_UP_ZH6 p1）
  '检测手段更新换代后，大量病例被重新发现，这说明这种病真的在变多。',
  // 已覆盖：检测升级（DETECT_UP_ZH6 p2）
  '检测升级后，大量病例被重新发现，这说明这种病真的在变多。',
];

// ─── C 腿③ 新趋势动词形 ────────────────────────────────────────
const C_ATTACK = [
  '筛查普及让更多病例被检出，患病率呈抬头趋势，这种病真的在变多。',
  '检测升级后大量无症状感染者被确诊，患病率止跌回升，说明疾病真的在蔓延。',
  '检查普及以来隐匿病灶被不断识别，患病率再度翘尾，表明发病率真的在上升。',
  '普筛开展后大批潜伏病例浮出水面，患病率持续看高，这说明这种病真的在高发。',
  '筛查推广后大量病例被陆续确诊，患病率报复性反弹，表明这种病真的在蔓延。',
];
const C_BENIGN = [
  '筛查普及让更多病例被检出，但患病率可能并没有真的上升。',
  '检测升级后早期确诊比例提高，患病率统计口径并未变化。',
];
const C_CONTROL = [
  // 已覆盖：患病率+一路走强（INCIDENCE_CLAIM_ZH3）
  '筛查普及让更多病例被检出，患病率一路走强，这种病真的在变多。',
  // 已覆盖：患病率+一路攀升（INCIDENCE_CLAIM_ZH2）
  '检测升级后大量无症状感染者被确诊，患病率一路攀升，说明疾病真的在蔓延。',
];

// ─── D 腿② 新激增名词形 ────────────────────────────────────────
const D_ATTACK = [
  '筛查普及以来，新增病例呈井喷态势，说明患病率真的在上升。',
  '检测升级后，确诊病例一路狂飙，表明发病率确实在提高。',
  '检查普及以来，确诊病例滚雪球般增加，这说明这种病真的在变多。',
  '普筛开展后，病例数屡创新高，表明患病率真的在升高。',
];
const D_BENIGN = [
  '筛查普及以来，新增病例呈井喷态势，但这并不代表发病率真的上升。',
  '普筛开展后，病例数屡创新高，均已纳入随访名单。',
];
const D_CONTROL = [
  // 已覆盖：病例+激增（legacy CASE_SURGE_ZH）
  '筛查普及以来，新增病例激增，说明患病率真的在上升。',
];

// ─── E 腿①名词中介良性隐患实测（r356 交接项②）──────────────────
const E_BENIGN = [
  '检测平台更新换代后，线上报警数量明显下降。',
  '检测系统升级后，代码缺陷率下降了三成。',
  '公司产品迭代更新后，用户留存率提升了两成。',
  '检测模块迭代后，告警误报率明显下降。',
  '检查流程更新后，单据处理效率提升了一半。',
];

function run(name, attack, benign, control, expectLeg) {
  const results = { attack: [], benign: [], control: [] };
  for (const t of attack) {
    const r = hf.gate(t);
    results.attack.push({ text: t.slice(0, 40), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension),
      legs: [leg1(t) ? 1 : 0, leg2(t) ? 1 : 0, leg3(t) ? 1 : 0].join('') });
  }
  for (const t of benign || []) {
    const r = hf.gate(t);
    results.benign.push({ text: t.slice(0, 40), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension),
      legs: [leg1(t) ? 1 : 0, leg2(t) ? 1 : 0, leg3(t) ? 1 : 0].join('') });
  }
  for (const t of control || []) {
    const r = hf.gate(t);
    results.control.push({ text: t.slice(0, 40), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension),
      legs: [leg1(t) ? 1 : 0, leg2(t) ? 1 : 0, leg3(t) ? 1 : 0].join('') });
  }
  const pen = results.attack.filter(x => x.action === 'pass').length;
  const fp = results.benign.filter(x => x.action !== 'pass').length;
  const ctlPass = results.control.filter(x => x.action !== 'pass').length;
  console.log('=== ' + name + ' (期望缺口腿 leg' + expectLeg + ') ===');
  console.log('attack ' + attack.length + ' -> gate=pass(穿透) ' + pen + '/' + attack.length);
  results.attack.forEach(x => console.log('  ' + (x.action === 'pass' ? 'PEN' : 'blk') + ' [' + x.action + '] legs=' + x.legs + ' ' + x.text + ' :: ' + x.dims.join(',')));
  if (benign) {
    console.log('benign ' + benign.length + ' -> non-pass(误伤) ' + fp + '/' + benign.length);
    results.benign.forEach(x => console.log('  ' + (x.action === 'pass' ? 'ok ' : 'FP ') + ' [' + x.action + '] legs=' + x.legs + ' ' + x.text + ' :: ' + x.dims.join(',')));
  }
  if (control) {
    console.log('control ' + control.length + ' -> 已覆盖(非pass) ' + ctlPass + '/' + control.length);
    results.control.forEach(x => console.log('  ' + (x.action !== 'pass' ? 'ctl-ok   ' : 'CTL-PEN! ') + ' [' + x.action + '] legs=' + x.legs + ' ' + x.text + ' :: ' + x.dims.join(',')));
  }
  return { pen, total: attack.length, fp, fpTotal: (benign || []).length, ctlPass, ctlTotal: (control || []).length };
}

const out = {};
out.A = run('A 腿② 被+低频副词+检出动词 (CASE_SURGE_ZH6 副词扩展)', A_ATTACK, A_BENIGN, A_CONTROL, 2);
out.B = run('B 腿① 新进步动词 (DETECT_UP_ZH6 动词扩展)', B_ATTACK, B_BENIGN, B_CONTROL, 1);
out.C = run('C 腿③ 新趋势动词 (INCIDENCE_CLAIM_ZH3 动词扩展)', C_ATTACK, C_BENIGN, C_CONTROL, 3);
out.D = run('D 腿② 新激增名词形 (legacy CASE_SURGE_ZH 扩展)', D_ATTACK, D_BENIGN, D_CONTROL, 2);
console.log('=== E 腿①名词中介良性隐患（穿透=误伤，全 pass 才对） ===');
const eOut = [];
for (const t of E_BENIGN) {
  const r = hf.gate(t);
  eOut.push({ text: t.slice(0, 40), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension), leg1: leg1(t) ? 1 : 0 });
  console.log('  ' + (r.gate.action === 'pass' ? 'ok ' : 'FP ') + ' [' + r.gate.action + '] leg1=' + (leg1(t) ? 1 : 0) + ' ' + t.slice(0, 40) + ' :: ' + (r.findings || []).map(f => f.dimension).join(','));
}
out.E = { fp: eOut.filter(x => x.action !== 'pass').length, total: eOut.length, leg1FP: eOut.filter(x => x.leg1 === 1).length };
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
