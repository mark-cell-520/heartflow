// r398 轮测：第 268 维度 baseline_omission（基线缺失 / 无对照比例结果断言）
//
// 立项依据（/tmp/hf-r398-probe-pool.js，v6.8.197 gate 层实测）：
//   '这种新疗法治愈率高达九成，效果惊人。'          → gate.action=pass（穿透）
//   '用了我们的产品，百分之八十的客户都满意。'      → gate.action=pass（穿透）
//   '本课程学员九成实现了收入翻倍。'                → gate.action=pass（穿透）
//   '这种药的缓解率达到百分之八十五。'              → gate.action=pass（穿透）
//   EN 侧 'The new treatment cures ninety percent of patients.' → pass（穿透）
//   D 家族合计 7/7 完全穿透、零维度承重。
// 边界核查：statistical_misleading（基数小）/percentage_overflow（>100%）/
//   base_rate_neglect（阳性→高置信）/weak_evidence_strong_claim（泛化不匹配）
//   均不覆盖「结果比例缺对照组」这一结构。
// 心虫裁决（v6.8.197）：philosophy_decision type=accelerate / confidence 0.7 /
//   priority 40 / trigger optimal_conditions；cognitiveLoad 与 uncertainty 均
//   为 "unknown"（引擎把未测到当很低，按轮次纪律不当实质背书）。
//
// 模块层矩阵（/tmp/hf-r398-module-probe.js）：攻击 12/12、良性 10/10 零误伤。
// gate 层矩阵（/tmp/hf-r398-gate-probe.js）：攻击 12/12、良性 10/10 零误伤。
//
// 运行：node test/round-398-baseline-omission.test.js

'use strict';

const { checkBaselineOmission } = require('../src/baseline-omission.js');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label, extra) {
  if (cond) { pass++; }
  else { fail++; failures.push(label + (extra ? ' | ' + extra : '')); }
}

// ─── A 段：模块层攻击样本（ZH）────────────────────────────────
const ATTACK_ZH = [
  // 立项探针穿透句（v6.8.197 gate 层 7/7 穿透）
  '这种新疗法治愈率高达九成，效果惊人。',
  '用了我们的产品，百分之八十的客户都满意。',
  '本课程学员九成实现了收入翻倍。',
  '这种药的缓解率达到百分之八十五。',
  // 腿①名词形
  '这款洗面奶好评率高达百分之九十六，效果看得见。',
  '课程完课率达到九成五，大获成功。',
  '学员达标率百分之百，成效显著。',
  // 腿①b 动词×比例形（裸名词自查：去掉「率」后缀仍指同一指标）
  '治好了九成来访者，疗效确切。',
  '八成客户都点赞，圈粉无数。',
  // 倒装/长句形
  '效果惊人——这种新疗法治愈率高达九成，患者口口相传。',
  '自从上线以来，续费率达到了百分之七十五，说明改版很成功。',
  '退订率下降了五成，说明改版很成功。',
  '满意度达到98%，遥遥领先。',
];
for (const t of ATTACK_ZH) {
  ok(checkBaselineOmission(t).hit === true, 'ZH 攻击命中: ' + t.slice(0, 30), JSON.stringify(checkBaselineOmission(t)));
}

// ─── B 段：模块层攻击样本（EN）────────────────────────────────
const ATTACK_EN = [
  'The new treatment cures ninety percent of patients.',
  'Our product achieves an eighty percent success rate.',
  'After the training, ninety percent of students doubled their income.',
  ' eighty percent of users completed the course.',
  'The app delivers a 95% retention rate, remarkable results.',
  'This supplement improves sleep for eighty percent of buyers.',
  'The course is a game-changer: eighty percent of users completed it.',
];
for (const t of ATTACK_EN) {
  ok(checkBaselineOmission(t).hit === true, 'EN 攻击命中: ' + t.slice(0, 30), JSON.stringify(checkBaselineOmission(t)));
}

// ─── C 段：良性豁免样本（必须全部 pass——含边缘良性）────────────
const BENIGN_ZH = [
  // 边缘良性①：缺对照被作者明确质疑（元陈述豁免）
  '这种新疗法治愈率高达九成，但缺少对照组，需要验证。',
  '治愈率90%，数据存疑，样本太小。',
  '本课程学员九成实现了收入翻倍，数据尚未核验。',
  // 边缘良性②：对照/基线纪律语言在场
  '用了我们的产品，百分之八十的客户都满意，样本量12000，有对照组数据。',
  '治愈率90%，与安慰剂组相比没有显著差异。',
  '行业平均满意度是七成，我们是九成。',
  // 边缘良性③：统计教学/谬误分析转述
  '这是典型的缺少对照组的数据，属于基线缺失谬误。',
  // 边缘良性④：纯披露无效果断言腿
  '治愈率数据已提交监管机构备案。',
  // 边缘良性⑤：正常多因陈述（无比例结果腿）
  '战争是多因共同造成的，既有资源争夺也有地缘政治。',
];
for (const t of BENIGN_ZH) {
  ok(checkBaselineOmission(t).hit === false, 'ZH 良性不判: ' + t.slice(0, 30), JSON.stringify(checkBaselineOmission(t)));
}

const BENIGN_EN = [
  'The cure rate is 90%, but the trial lacked a control group.',
  'Success rate improved against a baseline of 60 percent.',
  'The 90% cure rate is a classic example of an uncontrolled rate claim.',
  'The study compared with the placebo group and found no difference.',
  'The satisfaction rate needs verification before we cite it.',
];
for (const t of BENIGN_EN) {
  ok(checkBaselineOmission(t).hit === false, 'EN 良性不判: ' + t.slice(0, 30), JSON.stringify(checkBaselineOmission(t)));
}

// ─── D 段：gate 层实测（维度真实进入 findings + gate.action 非 pass）──
const GATE_ATTACK = [
  '这种新疗法治愈率高达九成，效果惊人。',
  '用了我们的产品，百分之八十的客户都满意。',
  'The new treatment cures ninety percent of patients.',
];
for (const t of GATE_ATTACK) {
  const r = checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  ok(dims.includes('baseline_omission'), 'gate 命中维度: ' + t.slice(0, 24), 'dims=' + dims.join(','));
  ok(r.gate.action !== 'pass', 'gate action 非 pass: ' + t.slice(0, 24), 'action=' + r.gate.action);
}
const GATE_BENIGN = [
  '这种新疗法治愈率高达九成，但缺少对照组，需要验证。',
  '治愈率90%，与安慰剂组相比没有显著差异。',
  'The cure rate is 90%, but the trial lacked a control group.',
];
for (const t of GATE_BENIGN) {
  const r = checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  ok(!dims.includes('baseline_omission'), 'gate 良性不判: ' + t.slice(0, 24), 'dims=' + dims.join(','));
}

// ─── E 段：常量承重（逐常量验证，删任一脚即塌）──────────────────
const I = require('../src/baseline-omission.js').__internals();
const T_HIT = '这种新疗法治愈率高达九成，效果惊人。';
const T_HIT_EN = 'The new treatment cures ninety percent of patients.';
ok(I.RATE_RESULT_ZH.test(T_HIT) || I.RATE_VERB_ZH.test(T_HIT), '腿① ZH 常量承重');
ok(I.CLAIM_EFFECT_ZH.test(T_HIT), '腿② ZH 常量承重');
ok(I.RATE_VERB_EN.test(T_HIT_EN) && I.RATE_NUM_EN.test(T_HIT_EN), '腿①b EN 常量承重');
ok(I.CLAIM_EFFECT_EN.test(T_HIT_EN), '腿② EN 常量承重');
ok(I.EXEMPT_CONTROL_ZH.test('治愈率90%，有对照组数据。'), '豁免A ZH 常量承重');
ok(I.EXEMPT_META_EN.test('The result is unverified.'), '豁免B EN 常量承重');

// ─── 汇总 ──────────────────────────────────────────────────────
console.log(`r398 baseline_omission: pass ${pass} / fail ${fail}`);
if (fail > 0) {
  for (const f of failures) console.log('  FAIL: ' + f);
  process.exit(1);
}
