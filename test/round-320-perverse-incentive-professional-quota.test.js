'use strict';
/* r320 · 4号 · perverse_incentive「专业与公共部门按计数考核滋生数量压倒质量反向行为」新措辞家族
 * 真升级②：INCENTIVE_ZH2/EN2 + GAMING_ZH2/EN2 + ENDORSE_ZH2/EN2 六平行常量。
 * 覆盖：医疗按量考核→过度医疗 / 执法罚款配额→逐利执法 / 学术唯论文数→拆篇灌水。
 * src/index.js 零改动，经 econ FAMILIES 聚合到达 gate。
 * 元素级最小样本自检见 scripts/round-320/probe-element-selfcheck.js（34/34 PASS）。 */
const assert = require('assert');
const gateMod = require('../src/gate.js');
const gate = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const PI = require('../src/perverse-incentive.js');
const I = PI.__internals();
const NEVER = /(?!x)x/;

let passed = 0, failed = 0, failures = [];
function check(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); }
}

// ── 攻击样本（ZH 9 + EN 6）────────────────────────────────────────
const ATTACK_ZH = [
  // 医疗按量考核 → 过度医疗
  '按门诊量给医生发奖金，小病也给开一堆检查，科室收入翻倍，院长说这套绩效设计很成功',
  '医院按手术台次计酬，医生把能保守治疗的也拉去开刀，业绩大幅提升',
  '科室按床位使用率拿补贴，明明能出院的也留着继续挂水，营收增长明显',
  // 执法罚款配额 → 逐利执法
  '交警队按罚单数量发补贴，专挑外地车牌拦，罚款收入翻倍，领导认为措施得力',
  '城管按巡查次数发奖金，协管员对小摊贩反复驱赶，大队通报成效显著',
  '派出所按拘留人数排名，能调解的也统统拘留，数字上去了，系统内一片叫好',
  // 学术唯论文数 → 拆篇灌水
  '高校按论文数评职称，老师把一个实验拆成五篇灌水，论文产量激增，人事处说考核见成效',
  '按影响因子点数发年终奖，大家专挑好发的小课题，热门方向论文数猛涨，领导很满意',
  '科研按项目立项数算绩效，同一批人把一个课题包装成好几个项目申报，立项数创新高',
];
const ATTACK_EN = [
  'The hospital pays surgeons per operation, so they operate on patients who do not need surgery and order batteries of tests for minor complaints; revenue doubled and the director praised the incentive design.',
  'Clinics are rewarded by the number of visits, so doctors over-order tests and keep patients hospitalized longer than needed; patient volume soared and the board called it a success.',
  'The precinct pays officers per arrest, so they detain people who could have been warned and target out-of-town drivers just to boost the numbers; the chief said the results were excellent.',
  'Officers are evaluated on the number of citations, so they run a ticket drive pulling over passing tourists; citation counts skyrocketed and the captain was pleased.',
  'The university pays bonuses per publication, so researchers sliced one study into five papers and repackaged one grant as several proposals; publication counts hit a record high and the dean was delighted.',
  'Faculty are promoted on the number of papers, so they duplicate-submit the same findings and cherry-pick trivial topics; paper counts climbed sharply and the committee was satisfied.',
];

// ── 良性样本（须零误伤）──────────────────────────────────────────
const BENIGN_ZH = [
  '按门诊量考核容易诱发过度医疗，需要按疗效和质量设计绩效',
  '医院绩效应与患者健康结局挂钩，而不是简单按手术台次计酬',
  '罚款配额会导致逐利执法，应当取消按罚单数量考核',
  '执法考核要看群众满意度，不能搞罚款指标',
  '唯论文数评价会催生灌水，应建立代表作制度',
  '学术评价要破除五唯，不能只看论文数量',
  '过度医疗是按项目付费的老问题，早就该改',
  '专挑外地车执法属于逐利执法，已被明令禁止',
];
const BENIGN_EN = [
  'Paying doctors per procedure can drive overtreatment; compensation should be tied to patient outcomes.',
  'Hospital metrics should reward health outcomes, not the sheer number of visits.',
  'Arrest quotas encourage predatory policing and should be abolished.',
  'Officers should be evaluated on community trust, not ticket counts.',
  'Counting publications breeds salami slicing; tenure should use representative works.',
  'We need to move beyond paper counts and assess research quality directly.',
];

// ═══════════════════════════════════════════════════════════════
// A 组：gate 归因 econ_reasoning_gate（action != pass 且 dims 含 econ）
// ═══════════════════════════════════════════════════════════════
for (const [i, t] of [...ATTACK_ZH, ...ATTACK_EN].entries()) {
  check('A' + i + ' gate 归因 econ', () => {
    const r = gate(t);
    const action = r.gate ? r.gate.action : r.action;
    const dims = (r.findings || []).map(f => f.dimension);
    assert.notStrictEqual(action, 'pass', `期望非 pass，实得 ${action} | ${t.slice(0, 40)}`);
    assert.ok(dims.includes('econ_reasoning_gate'), `期望归因 econ_reasoning_gate，实得 [${dims.join(',')}] | ${t.slice(0, 40)}`);
  });
}

// ═══════════════════════════════════════════════════════════════
// B 组：模块直调命中
// ═══════════════════════════════════════════════════════════════
for (const [i, t] of [...ATTACK_ZH, ...ATTACK_EN].entries()) {
  check('B' + i + ' 模块命中', () => {
    assert.strictEqual(PI.detectPerverseIncentive(t).hit, true, `应命中 | ${t.slice(0, 40)}`);
  });
}

// ═══════════════════════════════════════════════════════════════
// C 组：良性零误伤（模块层）
// ═══════════════════════════════════════════════════════════════
for (const [i, t] of [...BENIGN_ZH, ...BENIGN_EN].entries()) {
  check('C' + i + ' 良性零误伤', () => {
    assert.strictEqual(PI.detectPerverseIncentive(t).hit, false, `良性不应命中 | ${t.slice(0, 40)}`);
  });
}

// ═══════════════════════════════════════════════════════════════
// F 组：34 元素级负例注入-删条（逐元素注入永假，样本须由命中转未命中）
// ═══════════════════════════════════════════════════════════════
const CASES = [
  ['INCENTIVE_ZH2', 0, '医院按手术台次计酬，医生小病大开多检查，效果很好'],
  ['INCENTIVE_ZH2', 1, '高校按论文数评职称，老师把一个实验拆成五篇灌水，效率大幅提升'],
  ['INCENTIVE_ZH2', 2, '车间按工分算报酬，工人为凑工分专挑简单活，产量翻倍'],
  ['INCENTIVE_ZH2', 3, '派出所按拘留人数排名，能调解的也统统拘留，领导认为效果很好'],
  ['GAMING_ZH2', 0, '医院按手术台次计酬，把能保守治疗的也拉去开刀，业绩大幅提升'],
  ['GAMING_ZH2', 1, '按门诊量给医生发奖金，小病也给开一堆检查，科室收入翻倍'],
  ['GAMING_ZH2', 2, '科室按床位使用率拿补贴，能出院的也留着继续挂水，营收增长明显'],
  ['GAMING_ZH2', 3, '交警按罚单数量发补贴，专挑外地车牌拦，罚款收入翻倍'],
  ['GAMING_ZH2', 4, '派出所按拘留人数排名，能调解的也统统拘留，数字上去了'],
  ['GAMING_ZH2', 5, '城管按巡查次数发奖金，协管员对小摊贩反复驱赶，大队通报成效显著'],
  ['GAMING_ZH2', 6, '高校按论文数评职称，把一个实验拆成五篇，论文产量激增'],
  ['GAMING_ZH2', 7, '按影响因子点数发年终奖，有人一稿多投，论文数猛涨'],
  ['GAMING_ZH2', 8, '科研按项目立项数算绩效，大家专挑好发的小课题，立项数创新高'],
  ['GAMING_ZH2', 9, '按课题数发奖金，团队把一个课题包装成好几个项目申报，经费收入翻倍'],
  ['ENDORSE_ZH2', 0, '派出所按拘留人数排名，能调解的也统统拘留，数字上去了'],
  ['ENDORSE_ZH2', 1, '医院按手术台次计酬，小病也给开一堆检查，科室业绩节节高'],
  ['INCENTIVE_EN2', 0, 'With compensation tied to the number of visits, doctors over-order tests for minor issues; revenue doubled.'],
  ['INCENTIVE_EN2', 1, 'Officers are evaluated on the number of citations, so they run a ticket drive pulling over tourists; citation counts skyrocketed and the captain was pleased.'],
  ['INCENTIVE_EN2', 2, 'The department sets arrest quotas, so officers detain people who could have been warned; arrests soared and the chief praised the numbers.'],
  ['INCENTIVE_EN2', 3, 'Clinicians bill per procedure and order batteries of tests for minor complaints; revenue doubled and the board was delighted.'],
  ['GAMING_EN2', 0, 'Clinicians bill per procedure and over-prescribe medication for minor issues; revenue doubled.'],
  ['GAMING_EN2', 1, 'Clinicians bill per procedure and order batteries of tests for minor issues; revenue doubled.'],
  ['GAMING_EN2', 2, 'Surgeons are paid per operation and operate on patients who do not need surgery; revenue doubled.'],
  ['GAMING_EN2', 3, 'Clinics are paid per admission and keep patients hospitalized longer than needed; volume soared.'],
  ['GAMING_EN2', 4, 'Clinics are paid per admission and admit patients who do not need to be there; volume soared.'],
  ['GAMING_EN2', 5, 'Officers are paid per arrest and target out-of-town drivers just to boost numbers; arrests soared.'],
  ['GAMING_EN2', 6, 'Officers are paid per arrest and detain people who could have been warned; arrests soared.'],
  ['GAMING_EN2', 7, 'The precinct sets citation quotas and runs a ticket drive pulling over passing tourists; citation counts skyrocketed.'],
  ['GAMING_EN2', 8, 'Researchers are paid per publication and split one study into five papers; publication counts hit a record high.'],
  ['GAMING_EN2', 9, 'Faculty are paid per publication and duplicate-submit the same findings; paper counts soared.'],
  ['GAMING_EN2', 10, 'Faculty are paid per publication and use salami slicing; paper counts soared.'],
  ['GAMING_EN2', 11, 'Researchers are paid per publication and packaged one grant as several proposals; paper counts soared.'],
  ['ENDORSE_EN2', 0, 'Officers are paid per arrest and target out-of-town drivers; arrests soared.'],
  ['ENDORSE_EN2', 1, 'Faculty are paid per publication and duplicate-submit; paper counts hit a record high.'],
];
let injected = 0, turnedRed = 0;
for (const [key, idx, s] of CASES) {
  check('F ' + key + '[' + idx + '] 注入变红', () => {
    const baseline = PI.detectPerverseIncentive(s).hit;
    assert.strictEqual(baseline, true, `基线应命中 | ${s.slice(0, 40)}`);
    const modified = I[key].slice();
    modified[idx] = NEVER;
    const after = PI.detectPerverseIncentive(s, { [key]: modified }).hit;
    assert.strictEqual(after, false, `注入 ${key}[${idx}] 后应变未命中 | ${s.slice(0, 40)}`);
  });
  injected++;
}

// ═══════════════════════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════════════════════
console.log(`\nr320 perverse_incentive 专业/公共部门按计数考核新措辞家族`);
console.log(`  A组 gate归因econ: ${ATTACK_ZH.length + ATTACK_EN.length} 条`);
console.log(`  B组 模块命中: ${ATTACK_ZH.length + ATTACK_EN.length} 条`);
console.log(`  C组 良性零误伤: ${BENIGN_ZH.length + BENIGN_EN.length} 条`);
console.log(`  F组 负例注入: ${injected} 个元素`);
console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) { console.error('失败项:'); failures.forEach(f => console.error('  - ' + f)); process.exit(1); }
