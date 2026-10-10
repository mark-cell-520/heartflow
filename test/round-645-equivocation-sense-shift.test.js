/**
 * test/round-645-equivocation-sense-shift.test.js
 *
 * [r645] 第 67 维度 equivocation_sense_shift 守护测试
 * 覆盖三层：detect() 单维 / discriminate() 聚合 / gate.checkOutput() 端到端
 * 另含中英配对样本与良性负向锚点（元话语、正常多义词使用必须放行）
 *
 * 论文依据：arXiv 2606.31039 (LoFa) — Equivocation LFR@3 仅 29.4%，
 * 是全部谬误中 LLM 最脆弱的一类。
 */
'use strict';

const path = require('path');
const { detect } = require('../src/shield/equivocation-sense-shift.js');
const idx = require('../src/index.js');
const gate = require('../src/gate.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ' | ' + extra : ''}`); }
}

// ─── 攻击族：多义词在同一论证中被用于两个不同义位 ────────────────────
const ATTACK = [
  // 中文
  '法律上规定人人平等，所以这道菜里的盐和糖也应该平等分配。',
  '这个团队很有精神，精神是大脑的产物，所以给他们做一次脑部扫描就能测出团队精神。',
  // 英文
  ' Banks are financial institutions, river banks are made of mud, so financial institutions are made of mud.',
  ' The law says everyone is equal, so all numbers are equal too.',
  ' Feathers are light, light cannot be dark, therefore feathers cannot be dark.',
  ' Our company needs more staff, a staff is a stick used for walking, so buy walking sticks.',
  ' A school is a group of fish and a school is a place of learning, so fish can learn here.',
];

// ─── 良性族：元话语 / 正常多义词使用 / 无关文本 ────────────────────────
const BENIGN = [
  // 元话语（在谈论词义本身 → 由 ambiguity_fallacy 负责，本维度必须放行）
  '银行可以指金融机构，也可以指河岸，这个词是一词多义的典型例子。',
  'The word "light" has several meanings: brightness, weight, and color.',
  // 正常多义词使用（同一语义域内的重复）
  'Feathers are light in weight, which is why birds can fly.',
  'A school of fish swam past the boat near the school of engineering.',
  'We should treat everyone equally under the law regardless of background.',
  'The staff meeting will be held in the main conference room.',
  'This dish needs a fine balance of salt and sugar.',
  'Nothing beats a quiet evening with a good book.',
  'Please sign the document to confirm your parking spot.',
  '他在银行工作，负责信贷审批业务。',
  '“意思意思”在中文里是礼节性的表达，具体金额要看关系亲疏。',
  'Team spirit is important for morale and collaboration.',
];

// ─── 保守边界：明确不收，锁住边界本身 ────────────────────────────────
// 这两条形似但构不成本维度判定，写进测试防止未来被当成漏判去放宽
const BOUNDARY = [
  // 引述他人口语 + 无强义位差证据 → 不收（引述降级层处理）
  '他说的是“意思意思”，既然是意思，那意思一下就够了，不用真给钱。',
  // fine 两处都落在罚款/没问题歧义区且无强义位差证据 → 不收
  ' The sign said "fine for parking", and since it is fine, there is no penalty.',
];

console.log('═══ 层1：detect() 单维 ═══');
let a1 = 0;
for (const t of ATTACK) { if (detect(t).count > 0) a1++; }
check(`攻击族命中 ${a1}/${ATTACK.length}`, a1 === ATTACK.length, `实际 ${a1}`);

let b1 = 0;
for (const t of BENIGN) { if (detect(t).count > 0) b1++; }
check(`良性族零误伤 ${b1}/${BENIGN.length}`, b1 === 0, `误伤 ${b1} 条`);

console.log('\n═══ 层2：discriminate() 聚合登记 ═══');
const d = idx.discriminate(ATTACK[0]);
check('dimensions 含 equivocation_sense_shift 键',
  Object.keys(d.dimensions).includes('equivocation_sense_shift'));
check('该维度 count > 0',
  d.dimensions.equivocation_sense_shift && d.dimensions.equivocation_sense_shift.count > 0);
const f0 = d.findings.find(f => f.dimension === 'equivocation_sense_shift');
check('findings 含该维度', !!f0);
check('findings 带 guidance', !!(f0 && f0.guidance));
// evidence 由 detect() 层提供，聚合层 findings 不搬运它——断言 detect() 的
// evidence 是人类可读原文（非正则源码/类型名）。
const det = detect(ATTACK[0]);
check('detect() evidence 是人类可读原文（非正则源码/类型名）',
  !!(det.findings[0] && Array.isArray(det.findings[0].evidence) &&
     det.findings[0].evidence.length > 0 &&
     det.findings[0].evidence.every(e => typeof e === 'string' &&
       !e.includes('\\b') && !e.includes('(?:'))),
  det.findings[0] ? JSON.stringify(det.findings[0].evidence).slice(0, 120) : '无 evidence');

console.log('\n═══ 层3：gate.checkOutput() 端到端 ═══');
let a3 = 0;
for (const t of ATTACK) {
  const r = gate.checkOutput(t);
  const act = (r.gate && r.gate.action) || r.action;
  if (act !== 'pass') a3++;
}
check(`攻击族全部非 pass ${a3}/${ATTACK.length}`, a3 === ATTACK.length, `实际 ${a3}`);

let b3 = 0;
for (const t of BENIGN) {
  const r = gate.checkOutput(t);
  const act = (r.gate && r.gate.action) || r.action;
  if (act === 'pass' || act === 'verify') b3++;
}
check(`良性族全部 pass/verify ${b3}/${BENIGN.length}`, b3 === BENIGN.length, `实际 ${b3}`);

let brw = 0;
for (const t of BENIGN) {
  const r = gate.checkOutput(t);
  const act = (r.gate && r.gate.action) || r.action;
  if (act === 'block' || act === 'rewrite') brw++;
}
check(`良性族零 block/rewrite 误伤`, brw === 0, `误伤 ${brw} 条`);

console.log('\n═══ 保守边界（明确不收，防未来放宽）═══');
let bp = 0;
for (const t of BOUNDARY) { if (detect(t).count === 0) bp++; }
check(`边界样本不收 ${bp}/${BOUNDARY.length}`, bp === BOUNDARY.length, `实际 ${bp}`);

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
