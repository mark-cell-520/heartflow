'use strict';
// Exploratory probe r356 round 3: clean-frame isolation for leg③ trend verbs and
// leg② 被+adverb+verb. Round 2 showed C1/C2 probe sentences were contaminated by
// the newly-found leg① (检测升级) and leg② (被不断识别) gaps — penetration could
// not be attributed. This round holds leg①/腿② at已承重 forms (检查普及 /
// 被重新发现) and varies only the candidate leg, mirroring the covered control
// sentence frame exactly (r354/r355 纯缺口预判纪律).
const hf = require('/data/home/heartflow/src/gate.js');

// ─── C1 clean leg③ trend verbs ─────────────────────────
const C1_ATTACK = [
  '检查普及让更多病例被重新发现，患病率一路走强，这种病真的在变多。',
  '检查普及让更多病例被重新发现，患病率持续看涨，这种病真的在变多。',
  '检查普及让更多病例被重新发现，患病率稳步升温，这种病真的在变多。',
  '检查普及让更多病例被重新发现，患病率节节走高，这种病真的在变多。',
];
const C1_BENIGN = [
  '检查普及让更多病例被重新发现，但患病率可能并没有真的上升。',
  '检查普及让更多病例被重新发现，患病率统计口径本身没有变化。',
];
const C1_CONTROL = [
  // 已覆盖：患病率 + 一路 + 攀升（INCIDENCE_CLAIM_ZH2）
  '检查普及让更多病例被重新发现，患病率一路攀升，这种病真的在变多。',
  // 已覆盖：患病率 + 稳步 + 上行（INCIDENCE_CLAIM_ZH2）
  '检查普及让更多病例被重新发现，患病率稳步上行，这种病真的在变多。',
  // 已覆盖：患病率 + 真的 + 在上升（legacy INCIDENCE_CLAIM_ZH p1）
  '检查普及让更多病例被重新发现，患病率真的在上升，这种病真的在变多。',
];

// ─── C2 clean leg② 被+adverb+verb（与已覆盖控制句同框）────────────────
const C2_ATTACK = [
  '检查普及以来，众多隐匿病灶被不断识别，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被大量确诊，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被纷纷查出，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被逐步检出，说明患病率真的在上升。',
];
const C2_BENIGN = [
  '检查普及以来，众多隐匿病灶被不断识别，但这并不代表发病率真的上升。',
  '检查普及以来，无症状感染者被陆续确诊并转入随访，流程运转正常。',
];
const C2_CONTROL = [
  // 已覆盖：病例 + 被重新发现（ZH3）
  '检查普及以来，众多隐匿病灶被重新发现，说明患病率真的在上升。',
  // 已覆盖：病例 + 被识别（ZH3）
  '检查普及以来，众多隐匿病灶被识别，说明患病率真的在上升。',
];

// ─── A clean leg② 浮现族（与已覆盖控制句同框，隔离腿①/腿③变量）──────
const A_ATTACK = [
  '检查普及让大量潜伏病例浮现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例浮现，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例显现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例涌现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例显露出来，这说明患病率真的在上升。',
];
const A_BENIGN = [
  '检查普及让大量潜伏病例浮现出来，但这并不代表发病率真的上升。',
  '检查普及让大量潜伏病例浮现出来，实验室已将其纳入随访名单。',
];
const A_CONTROL = [
  // 已覆盖：病例 + 浮出水面（ZH2）
  '检查普及让大量潜伏病例浮出水面，这说明患病率真的在上升。',
  // 已覆盖：病例 + 暴露出来（ZH2）
  '检查普及让大量潜伏病例暴露出来，这说明患病率真的在上升。',
];

// ─── B clean leg① 更新换代族（与已覆盖控制句同框）────────────────
const B_ATTACK = [
  '检测手段更新换代让更多病例被重新发现，这说明患病率真的在上升。',
  '检测手段升级换代让更多病例被重新发现，这说明患病率真的在上升。',
  '检测手段日新月异让更多病例被重新发现，这说明患病率真的在上升。',
  '检测能力今非昔比让更多病例被重新发现，这说明患病率真的在上升。',
  '检测升级让更多病例被重新发现，这说明患病率真的在上升。',
  '检查更新让更多病例被重新发现，这说明患病率真的在上升。',
  '检测技术迭代让更多病例被重新发现，这说明患病率真的在上升。',
];
const B_BENIGN = [
  '检测手段更新换代让更多病例被重新发现，但这并不代表发病率真的上升。',
  '检测手段更新换代让早期确诊比例明显提高，是体检中心的常规推荐。',
  '产品检测流程更新后，用户投诉率下降了三成。',
];
const B_CONTROL = [
  // 已覆盖：检测手段的进步（DETECT_UP_ZH p2）
  '检测手段的进步让更多病例被重新发现，这说明患病率真的在上升。',
  // 已覆盖：更先进的检测手段（DETECT_UP_ZH5）
  '更先进的检测手段让更多病例被重新发现，这说明患病率真的在上升。',
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
out.A = run('A clean leg② 浮现/显现/涌现/显露 noun-postposed', A_ATTACK, A_BENIGN, A_CONTROL);
out.B = run('B clean leg① 更新换代 + 动词直缀', B_ATTACK, B_BENIGN, B_CONTROL);
out.C1 = run('C1 clean leg③ trend verbs 走强/看涨/升温/走高', C1_ATTACK, C1_BENIGN, C1_CONTROL);
out.C2 = run('C2 clean leg② 被+adverb+verb', C2_ATTACK, C2_BENIGN, C2_CONTROL);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
