'use strict';
/**
 * [r400] 第 269 维度 claimed_verification_without_trail 单测
 * 空核验宣称（claimed verification without trail）：
 * 宣称核验已完成却不给核验轨迹（无来源/数据/复现路径）。
 *
 * 覆盖：
 *  A 组 攻击样本（模块层 hit）——第一人称 / 零主语 / 机构主语 × 核验动词 × 完成体
 *  B 组 良性样本（模块层 clean）——有轨迹、被质疑、教学转述、第三方主语、
 *      纯感叹无核验动词、合法完成陈述
 *  C 组 负例注入（腿①抹除后失 hit）——验证腿①承重
 *  D 组 gate 层可达（verify 级）——findings 中维度名出现且 gate.action 合法
 *  E 组 豁免反翻转（腿②载体在场不判）——TRAIL_MARKERS 逐项
 */

const assert = require('assert');
const {
  checkClaimedVerificationWithoutTrail,
  SUBJECT_ZH, THIRD_PARTY_ZH, VERIFY_VERB_ZH, COMPLETION_ZH,
  VERIFY_VERB_EN, SUBJECT_EN, THIRD_PARTY_EN, COMPLETION_EN,
  TRAIL_MARKERS, TRAIL_MARKERS_EN,
  QUESTIONED_ZH, QUESTIONED_EN, PEDAGOGY, PEDAGOGY_EN,
} = require('../src/claimed-verification-without-trail.js');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}

// ---------- A 组：攻击样本（应 hit） ----------
const ATTACKS = [
  // —— ZH 第一人称 × 核验动词 × 完成体 ——
  '我们团队核实过这个数据。',
  '我已经亲自验证了，这个方案没有问题。',
  '本人实测有效，效果很好。',
  '我们反复测试过，性能完全达标。',
  '我逐条核实过，账目没有问题。',
  '实验室复现了实验结果。',
  '我们调研过这个市场，结论很明确。',
  '我已确认，数据是准确的。',
  '我们比对过两套方案，选后者。',
  '本人亲测，这款产品确实更好用。',
  // —— ZH 零主语（广告语省略主语，r736 实测第三主因） ——
  '实测有效，效果看得见。',
  '经过实测，这款产品确实更好用。',
  '经过测试，系统运行稳定。',
  '实测好用，值得拥有。',
  // —— ZH 机构主语 ——
  '本团队已完成验证。',
  '项目组测试完毕，一切正常。',
  '技术团队验收通过。',
  // —— EN 第一人称 × 核验动词 × 过去式完成体 ——
  'I verified it myself and it works.',
  'We tested it thoroughly and it passed.',
  'I have checked all the numbers and they add up.',
  'We cross-checked every claim against every figure in the book.',
  'Our lab reproduced the original results.',
  'The team confirmed the findings before shipping.',
  // —— EN 零主语 ——
  'Tested and it works.',
  'Verified personally, and the results hold.',
];

console.log('\n=== A 组：攻击样本（应 hit） ===');
for (const s of ATTACKS) {
  ok('ATTACK ' + JSON.stringify(s.slice(0, 28)), () => {
    const r = checkClaimedVerificationWithoutTrail(s);
    assert.strictEqual(r.hits > 0, true,
      '期望 hit>0，实得 ' + JSON.stringify(r));
    assert.ok(r.score >= 0.7, 'score 应 ≥0.7，实得 ' + r.score);
    assert.ok(r.severity >= 70, 'severity 应 ≥70，实得 ' + r.severity);
    assert.ok(r.details.indexOf('空核验宣称') === 0,
      'details 应以空核验宣称开头：' + r.details);
  });
}

// ---------- B 组：良性样本（应 clean） ----------
const BENIGN = [
  // —— 豁免① 轨迹纪律语言在场（有来源/数据/复现路径） ——
  '我们团队核实过这个数据，复现脚本与原始数据见附录 A。',
  '已验证，详见附录 A 的复现脚本。',
  '我们测试过，数据来源为第三方检测报告。',
  'I verified it; the raw data and methodology are in the appendix.',
  'We tested it thoroughly. See the repository for the replication package.',
  'We cross-checked all the figures against the published dataset.',
  '实验已完成验证，同行评审意见已公开。',
  '经第三方机构检测，产品合格。',
  // —— 豁免② 核验动作被质疑/待补 ——
  '这个方案尚未验证，不能采信。',
  '数据存疑，有待核实。',
  '目前无法证实这一结论。',
  'The claim is not yet verified.',
  "We haven't tested this yet.",
  'This remains unproven.',
  'No proof has been provided.',
  // —— 豁免③ 核验/验证概念的教学转述 ——
  '可证伪性是科学方法的核心标准。',
  '本课讲解验证实验设计的方法论。',
  '同行评审是科研的质量控制环节。',
  'Falsifiability is a cornerstone of the scientific method.',
  'The textbook covers controlled experiment design.',
  'We discussed peer review in the lecture.',
  // —— 第三方主语在场（归属他人，不判） ——
  '据称该团队已经核实过相关数据。',
  '专家声称已验证了这个理论。',
  'Researchers confirmed the findings, according to the paper.',
  'The company claims they tested it extensively.',
  // —— 纯感叹/普通陈述，无核验动词 ——
  '这个结果令人印象深刻。',
  '效果很好，大家都很满意。',
  'It works really well.',
  'The performance is impressive.',
  // —— 合法完成陈述（非核验类动词） ——
  '我们完成了这个项目。',
  'I finished the report yesterday.',
];

console.log('\n=== B 组：良性样本（应 clean） ===');
for (const s of BENIGN) {
  ok('BENIGN ' + JSON.stringify(s.slice(0, 28)), () => {
    const r = checkClaimedVerificationWithoutTrail(s);
    assert.strictEqual(r.hits, 0,
      '期望 clean，实得 ' + JSON.stringify(r));
    assert.strictEqual(r.score, 0, 'score 应为 0，实得 ' + r.score);
  });
}

// ---------- C 组：负例注入（腿①抹除后失 hit） ----------
console.log('\n=== C 组：负例注入（腿①抹除后失 hit） ===');

// C1 抹除核验动词（腿①动词腿）
const c1 = '我们团队整理过这个数据。'; // 核实→整理
ok('C1 核验动词→普通动词', () => {
  assert.strictEqual(VERIFY_VERB_ZH.test('整理'), false);
  assert.strictEqual(checkClaimedVerificationWithoutTrail(c1).hits, 0);
});
const c1en = 'We looked at the numbers and they add up.'; // verified→looked at
ok('C1-EN 核验动词→普通动词', () => {
  assert.strictEqual(checkClaimedVerificationWithoutTrail(c1en).hits, 0);
});

// C2 抹除完成体（腿①完成体腿）
const c2 = '我们团队核实这个数据。'; // 核实过→核实（无完成体标记）
ok('C2 完成体缺失', () => {
  // 注意：核实本身是光杆核验动词，无「了/过/已」等完成体标记。
  // 「核实这个数据」不含 COMPLETION_ZH 命中词（了/过/已经/亲自/反复…）
  const r = checkClaimedVerificationWithoutTrail(c2);
  assert.strictEqual(r.hits, 0, '无完成体应不判，实得 ' + JSON.stringify(r));
});

// C3 抹除主语且改核验动词为名词性（零主语 + 核验动词均失）
const c3 = '这款产品效果很好，市场反响热烈。';
ok('C3 无核验动词', () => {
  assert.strictEqual(checkClaimedVerificationWithoutTrail(c3).hits, 0);
});

// C4 注入腿②轨迹载体（反向判定失效）
const c4 = '我们团队核实过这个数据，来源见数据附录。';
ok('C4 腿②轨迹在场即豁免', () => {
  assert.strictEqual(TRAIL_MARKERS.test(c4), true);
  assert.strictEqual(checkClaimedVerificationWithoutTrail(c4).hits, 0);
});

// C5 注入质疑元陈述
const c5 = '我们团队核实过这个数据，但结论仍需验证。';
ok('C5 质疑元陈述豁免', () => {
  assert.strictEqual(QUESTIONED_ZH.test(c5), true);
  assert.strictEqual(checkClaimedVerificationWithoutTrail(c5).hits, 0);
});

// C6 注入教学转述
const c6 = '教学中常举这样的例子：我们团队核实过这个数据，这是空核验宣称的典型。';
ok('C6 教学转述豁免', () => {
  assert.strictEqual(PEDAGOGY.test(c6), true);
  assert.strictEqual(checkClaimedVerificationWithoutTrail(c6).hits, 0);
});

// C7 EN 否定守卫（"have not been"）
const c7 = 'The results have not been verified yet.';
ok('C7 EN 否定守卫', () => {
  assert.strictEqual(QUESTIONED_EN.test(c7), true);
  assert.strictEqual(checkClaimedVerificationWithoutTrail(c7).hits, 0);
});

// ---------- D 组：gate 层可达（verify 级，findings 出现维度名） ----------
console.log('\n=== D 组：gate 层可达 ===');
// gate 层入口在 src/gate.js（AGENTS.md：main (src/gate.js) 也直接导出 gate/check/
// pipeline；checkOutput/checkInput/checkDraft 是其导出）。
const { checkOutput } = require('../src/gate.js');

const GATE_ATTACKS = [
  '我们团队核实过这个数据，结论确凿。',
  '经过实测，这款产品确实更好用。',
  'I verified it myself and it works.',
];
for (const s of GATE_ATTACKS) {
  ok('GATE ' + JSON.stringify(s.slice(0, 28)), () => {
    const out = checkOutput(s);
    const dim = out.findings.find(f => f.dimension === 'claimed_verification_without_trail');
    assert.ok(dim, 'findings 中应有 claimed_verification_without_trail，实得维度：' +
      out.findings.map(f => f.dimension).join(','));
    assert.ok(['verify', 'rewrite', 'block'].indexOf(out.gate.action) >= 0,
      'gate.action 应为 verify/rewrite/block，实得 ' + out.gate.action);
  });
}

const GATE_BENIGN = [
  '我们团队核实过这个数据，复现脚本与原始数据见附录 A。',
  '该方案尚未验证，不能采信。',
  '可证伪性是科学方法的核心标准。',
];
for (const s of GATE_BENIGN) {
  ok('GATE-BENIGN ' + JSON.stringify(s.slice(0, 28)), () => {
    const out = checkOutput(s);
    const dim = out.findings.find(f => f.dimension === 'claimed_verification_without_trail');
    assert.strictEqual(dim, undefined,
      '良性样本不应出现本维度 findings，实得 ' + (dim ? JSON.stringify(dim) : 'undefined'));
  });
}

// ---------- E 组：豁免反翻转（腿②载体逐项在场不判） ----------
console.log('\n=== E 组：腿②轨迹载体逐项在场不判 ===');
const E_TRAILS_ZH = [
  '我们核实过，详见附录 B。',
  '我们核实过，数据来源见下。',
  '我们核实过，原始数据已公开。',
  '我们核实过，编号 INV-2026-001。',
  '我们核实过，实验设计见论文。',
  '我们核实过，对照组设置如下。',
  '我们核实过，可复现，欢迎复测。',
  '我们核实过，日志已存档。',
  '我们核实过，已公示全部结果。',
];
for (const s of E_TRAILS_ZH) {
  ok('E-ZH ' + JSON.stringify(s.slice(0, 20)), () => {
    assert.strictEqual(TRAIL_MARKERS.test(s), true, '应含轨迹标记');
    assert.strictEqual(checkClaimedVerificationWithoutTrail(s).hits, 0);
  });
}
const E_TRAILS_EN = [
  'We verified it; the source is listed below.',
  'We verified it; raw data available at the repo.',
  'We verified it; the dataset is public.',
  'We verified it; methodology described in the paper.',
  'We verified it; a control group was included.',
  'We verified it; the results are reproducible.',
  'We verified it; see the audit log.',
  'We verified it; peer-reviewed before publication.',
];
for (const s of E_TRAILS_EN) {
  ok('E-EN ' + JSON.stringify(s.slice(0, 26)), () => {
    assert.strictEqual(TRAIL_MARKERS_EN.test(s), true, '应含轨迹标记');
    assert.strictEqual(checkClaimedVerificationWithoutTrail(s).hits, 0);
  });
}

// ---------- F 组：常量导出可用性（负例注入测试可逐项验证承重） ----------
console.log('\n=== F 组：常量导出 ===');
ok('F 常量导出齐全', () => {
  for (const [name, v] of [
    ['SUBJECT_ZH', SUBJECT_ZH], ['THIRD_PARTY_ZH', THIRD_PARTY_ZH],
    ['VERIFY_VERB_ZH', VERIFY_VERB_ZH], ['COMPLETION_ZH', COMPLETION_ZH],
    ['VERIFY_VERB_EN', VERIFY_VERB_EN], ['SUBJECT_EN', SUBJECT_EN],
    ['THIRD_PARTY_EN', THIRD_PARTY_EN], ['COMPLETION_EN', COMPLETION_EN],
    ['TRAIL_MARKERS', TRAIL_MARKERS], ['TRAIL_MARKERS_EN', TRAIL_MARKERS_EN],
    ['QUESTIONED_ZH', QUESTIONED_ZH], ['QUESTIONED_EN', QUESTIONED_EN],
    ['PEDAGOGY', PEDAGOGY], ['PEDAGOGY_EN', PEDAGOGY_EN],
  ]) {
    assert.ok(v instanceof RegExp, name + ' 应为 RegExp');
  }
});
ok('F THIRD_PARTY_ZH 不收裸专家（身份×动词组合纪律）', () => {
  // 「专家声称」命中；单独「专家」不应作为第三方主语排除
  assert.strictEqual(THIRD_PARTY_ZH.test('专家声称已核实'), true);
});

console.log('\n=== 汇总：pass ' + pass + ' / fail ' + fail + ' ===');
if (fail > 0) process.exit(1);
