'use strict';
// Exploratory probe r356 round 2: refined candidates after round-1 findings.
// Round 1 revealed additional pure gaps (r355/r354 教训的纯缺口预判校准):
//   C控制句#2「患病率真的在上升」穿透 → 腿①「检测升级」短形缺口
//     （DETECT_UP_ZH p2 须 技术/手段/方法/能力/水平 中介、ZH5 须形容词+技术后缀，
//     「检测升级」动词直缀无形）
//   C攻击#3 穿透根因是腿②「被不断识别」（ZH3 须 被+(重新)?+动词 直缀，副词居中
//     无形）而非腿③——拆腿验证。
//   B 攻击 3/4（更新换代/升级换代/今非昔比穿透，日新月异 pseudo_causal 代拦）。
//   A 攻击 2/4（浮现出来/病例浮现穿透，显露/涌现代拦）。
// 本轮精确化：
//   B2 leg① 检测/检查/检验/诊断/筛查 + 升级/更新/革新/迭代 直缀短形
//   C1 leg③ 走强/看涨/升温 类趋势动词（控制句用已覆盖攀升/上行）
//   C2 leg② 被/得以/得到 + 副词 + 检出动词（被不断识别/被陆续发现/被大量确诊）
//   A2 leg② 浮现/显现 名词后置形补充变体（浮现出来/显现出来/显露出来/涌出）
// hf.gate() full findings 口径：穿透 = action==='pass'。
const hf = require('/data/home/heartflow/src/gate.js');

// ─── B2 leg① 动词直缀短形（检测升级/检查更新）──────────────────────────
const B2_ATTACK = [
  '检测升级后，大量病例被重新发现，这说明这种病真的在变多。',
  '检查更新以来，众多无症状感染者被确诊，表明患病率确实在提高。',
  '检验技术迭代后，越来越多隐匿病灶被识别出来，说明发病率真的在上升。',
  '筛查升级后，大批潜伏病例被查出，表明这种病真的在蔓延。',
  '检测手段迭代更新以来，大量病例重新浮出水面，这说明患病率真的在上升。',
];
const B2_BENIGN = [
  '检测升级后，大量病例被重新发现，但这并不代表发病率真的上升。',
  '系统检测模块更新后，线上报警数量明显下降。',
  '软件检查工具迭代后，代码缺陷率下降了三成。',
];
const B2_CONTROL = [
  // 已覆盖：检测手段的进步（DETECT_UP_ZH p2）
  '检测手段的进步让更多病例被查出，这说明患病率真的在上升。',
  // 已覆盖：更先进的检测手段（DETECT_UP_ZH5）
  '更先进的检测手段让更多病例被查出，这说明患病率真的在上升。',
];

// ─── C1 leg③ 趋势动词新形 ────────────────────────────────
const C1_ATTACK = [
  '筛查普及让更多病例被检出，患病率一路走强，这种病真的在变多。',
  '检测升级后大量无症状感染者被确诊，患病率持续看涨，说明疾病真的在蔓延。',
  '检查普及以来隐匿病灶被不断识别，患病率节节走高，表明发病率真的在上升。',
  '普筛开展后大批潜伏病例浮出水面，患病率稳步升温，这说明这种病真的在高发。',
];
const C1_BENIGN = [
  '筛查普及让更多病例被检出，但患病率可能并没有真的上升。',
  '检测升级后早期确诊比例提高，患病率统计口径并未变化。',
];
const C1_CONTROL = [
  // 已覆盖：患病率 + 一路 + 攀升（INCIDENCE_CLAIM_ZH2）
  '筛查普及让更多病例被检出，患病率一路攀升，这种病真的在变多。',
  // 已覆盖：患病率 + 稳步 + 上行（INCIDENCE_CLAIM_ZH2，稳中有升前缀+上行）
  '检测升级后大量无症状感染者被确诊，患病率稳步上行，说明疾病真的在蔓延。',
];

// ─── C2 leg② 被 + 副词 + 检出动词 ─────────────────────────
const C2_ATTACK = [
  '检查普及以来，众多隐匿病灶被不断识别出来，说明患病率真的在上升。',
  '筛查推广后，大量无症状感染者被陆续确诊，表明发病率确实在提高。',
  '体检普及让越来越多病例被重新发现，这说明这种病真的在变多。',
  '检测升级后，大批潜伏病例被大量查出，表明这种病真的在蔓延。',
];
const C2_BENIGN = [
  '检查普及以来，众多隐匿病灶被不断识别出来，但这并不代表发病率真的上升。',
  '筛查推广后，无症状感染者被陆续确诊并转入随访，流程运转正常。',
];
const C2_CONTROL = [
  // 已覆盖：病例 + 被重新发现（ZH3）
  '检查普及以来，众多隐匿病灶被重新发现，说明患病率真的在上升。',
  // 已覆盖：病例 + 被识别出来（ZH3）
  '筛查推广后，大量无症状感染者被识别出来，表明发病率确实在提高。',
];

// ─── A2 leg② 浮现/显现族补充变体 ────────────────────────
const A2_ATTACK = [
  '随着检测普及，大量潜伏病例浮现出来，这说明这种病真的在变多。',
  '筛查推广后，众多无症状感染者显现出来，表明患病率确实在升高。',
  '体检普及以来，越来越多隐匿病灶涌现出来，说明癌症真的高发了。',
  '普筛开展后，大批以往漏诊的病例浮现，表明发病率真的在上升。',
  '新方法应用后，不少潜伏病例显露出来，这说明这种病真的在蔓延。',
];
const A2_BENIGN = [
  '随着检测普及，大量潜伏病例浮现出来，但这并不代表发病率真的上升。',
  '普查中浮现出来的问题环节，质检部门正在逐项整改。',
  '评审中显现出来的争议点，委员会将另行讨论。',
];
const A2_CONTROL = [
  // 已覆盖：病例 + 浮出水面（ZH2）
  '随着检测普及，大量潜伏病例浮出水面，这说明这种病真的在变多。',
  // 已覆盖：病例 + 暴露出来（ZH2）
  '筛查推广后，众多无症状感染者暴露出来，表明患病率确实在升高。',
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
out.B2 = run('B2 ZH leg① verb-direct renewal (检测升级/检查更新)', B2_ATTACK, B2_BENIGN, B2_CONTROL);
out.C1 = run('C1 ZH leg③ trend verbs (走强/看涨/升温)', C1_ATTACK, C1_BENIGN, C1_CONTROL);
out.C2 = run('C2 ZH leg② 被+adverb+detect-verb', C2_ATTACK, C2_BENIGN, C2_CONTROL);
out.A2 = run('A2 ZH leg② 浮现/显现/涌现 noun-postposed', A2_ATTACK, A2_BENIGN, A2_CONTROL);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
