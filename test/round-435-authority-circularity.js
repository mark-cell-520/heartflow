/**
 * test/round-435-authority-circularity.js
 *
 * r435 接手 r433 的 authority_circularity 维度单测。
 * 背景：r433 起草了 src/authority-circularity.js（模块层 15/15 + 0/15），
 * 但 src/index.js 接线在换机/rebase 中丢失（grep 零命中，模块成孤岛）。
 * r435 按 metric_gaming 模板完成 8 处接入点接线（require / dispatch /
 * score 参与判定 / dimMap×3 / guidance / VERIFY_DIMS / 导出），本测试
 * 锁定接线后的真实行为。
 *
 * 两层断言：
 *   A. 模块层 checkAuthorityCircularity——三腿共现判据 + 豁免组
 *   B. gate 端到端——接线后本维度名必须出现在 findings，且 gate.action
 *      非 pass
 *
 * 良性样本断言：模块层零误伤（hit=false）；gate 层允许既有维度合法
 * 命中（如 claimed_verification_without_trail），但不得出现
 * authority_circularity。
 */

'use strict';

const path = require('path');
const assert = require('assert');

const M = require(path.join(__dirname, '..', 'src', 'authority-circularity.js'));
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));

const checkAuthorityCircularity = M.checkAuthorityCircularity;
assert.strictEqual(typeof checkAuthorityCircularity, 'function',
  '模块必须导出 checkAuthorityCircularity 函数');

let passed = 0;
let failed = 0;
const failures = [];

function ok(cond, label) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.error(`FAIL ${label}`);
  }
}

// ── 攻击样本（模块层 15 条，与 module-check.js 同口径）─────────────
const ATTACK = [
  '诺贝尔奖得主认可这位学者的研究，而该研究引用了另一位诺奖得主的工作。',
  '这项研究由该方法发明者的实验室完成同行评议，结论自然可靠。',
  '论文的审稿人正是提出该理论的同一课题组成员，结论毋庸置疑。',
  '福布斯杂志引用了一位亿万富翁的观点，而这位亿万富翁正是该理论的早期投资者，结论自然可靠。',
  '这位智库专家的报告被其理事单位引用，作为政策依据，结论有公信力。',
  '该评级机构的评分方法由其被评级对象资助的团队设计，结论不容置疑。',
  '这项卫生研究由烟草公司资助，而资助方指定的专家组认可了其结论，数据可靠。',
  '这位大师的师父是泰斗，泰斗的弟子遍布学界，所以他的结论不会错。',
  '他的师祖是学派开创者，这一脉的结论向来可靠。',
  'It was peer reviewed by the same lab that developed the method, so the findings are sound.',
  'The study was validated by researchers from the institution that funded it, making it credible.',
  'The paper cites a leading figure whose lab trained the author, so it carries weight.',
  'She was trained by the founder of the school, and the school endorses her findings as reliable.',
  '诺贝尔奖得主所在机构资助了这项研究，课题组内同行评议通过，结论自然可靠。',
  'It was endorsed by the same committee that funds the research, so the conclusion is authoritative.',
];

// ── 良性样本（模块层 15 条）───────────────────────────────────────
const BENIGN = [
  '这项研究经费来自国家自然科学基金，与产业方无利益关联。',
  '论文审稿人来自同一领域但不同机构，独立完成评审。',
  '他在导师指导下完成了这项研究，并公开了全部数据。',
  '研究经费来自国家自然科学基金，与产业方无关联。',
  'The paper was reviewed by independent experts in the field.',
  '研究团队独立复现了该结果，多家机构结论一致。',
  'Two labs independently replicated the result and reached consistent conclusions.',
  'The third-party audit found no conflict of interest.',
  '论文明确披露了利益冲突，作者与被评级对象无关联。',
  '这位科学家引用了同行评议的论文来支持自己的观点。',
  '他是那位教授的弟子，现在有自己的研究兴趣。',
  '所谓引文圈子是指期刊之间互相引用抬高影响因子的现象，这是学术不端的一种。',
  '近亲繁殖在学术谱系中需要警惕，独立评审制度正是为了防范循环背书。',
  'The citation cartel detection method flags groups of journals with mutual cross-citations.',
  '研究结论需要原始数据支撑，仅凭权威背书不足以令人信服。',
];

console.log('=== A. 模块层：攻击样本 ===');
for (const p of ATTACK) {
  const r = checkAuthorityCircularity(p);
  ok(r && r.hit === true, `模块层攻击应命中：${p.slice(0, 34)}`);
}

console.log('=== B. 模块层：良性样本（零误伤）===');
for (const p of BENIGN) {
  const r = checkAuthorityCircularity(p);
  ok(r && r.hit === false, `模块层良性应零误伤：${p.slice(0, 34)}`);
}

console.log('=== C. gate 端到端：攻击样本 ===');
for (const p of ATTACK) {
  const g = gate(p);
  const dims = (g.findings || []).map(f => f.dimension);
  ok(g.gate && g.gate.action !== 'pass',
    `gate 攻击应非 pass：${p.slice(0, 34)}（实得 ${g.gate && g.gate.action}）`);
  ok(dims.includes('authority_circularity'),
    `gate 攻击应由 authority_circularity 承重：${p.slice(0, 34)}（实得 ${JSON.stringify(dims)}）`);
}

console.log('=== D. gate 端到端：良性样本（本维度零误伤）===');
for (const p of BENIGN) {
  const g = gate(p);
  const dims = (g.findings || []).map(f => f.dimension);
  ok(!dims.includes('authority_circularity'),
    `gate 良性不应命中 authority_circularity：${p.slice(0, 34)}（实得 ${JSON.stringify(dims)}）`);
}

console.log('=== E. 接线完整性断言 ===');
{
  const hf = require(path.join(__dirname, '..', 'src', 'index.js'));
  ok(typeof hf.checkAuthorityCircularity === 'function',
    'index.js 应导出 checkAuthorityCircularity');
  const d = hf.discriminate('诺贝尔奖得主认可这位学者的研究，而该研究引用了另一位诺奖得主的工作。');
  const scores = (d && (d.dimensions || d.scores)) || {};
  ok('authority_circularity' in scores,
    'discriminate 结果应含 authority_circularity 维度键');

  // gate 行为断言（VERIFY_DIMS 是 index.js 内部 Set，不对外导出，
  // 故以可观测行为反证登记生效）：纯本维度承重的样本应落 verify 而非
  // rewrite——r433 遗留风险「模块 score 用整数 65 被聚合层乘 100 放大成
  // severity 6500、越过 rewrite 阈值」已由 r435 修 score 口径为 0.65，
  // 本条锁定修复不回归。
  const pure = gate('他的师祖是学派开创者，这一脉的结论向来可靠。');
  const pureDims = (pure.findings || []).map(f => f.dimension);
  ok(pureDims.includes('authority_circularity') && pure.gate.action === 'verify',
    `纯 authority_circularity 承重样本应落 verify（实得 ${pure.gate.action} / ${JSON.stringify(pureDims)}）`);
}

console.log(`\n通过 ${passed}，失败 ${failed}`);
if (failures.length) {
  console.log('失败明细：');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed === 0 ? 0 : 1);
