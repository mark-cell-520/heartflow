/**
 * scripts/round-645-probe.js
 *
 * [r645] 候选族探测器 — 检测心虫对「歧义谬误 Equivocation」真实句式的漏判
 * 论文依据：LoFa (arXiv 2606.31039) 实测 Equivocation LFR@3 仅 29.4%，
 * 是所有谬误中 LLM 最脆弱的一类；且既有模式只认元话语（"the word has
 * multiple meanings"），不认**一词多义被实际用于推理**的真实攻击句式。
 *
 * 判据从严：只有 gate.action === 'pass' 才算漏判。
 * 同时跑良性对照组，fp !== 0 的候选不上报。
 */
'use strict';

const path = require('path');
const gate = require(path.join('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js'));
const { detect } = require(path.join('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js'));

// ─── 攻击族：一词多义被用于跨语境推理（真·equivocation）─────────────────
const ATTACK = [
  // 中文：同一个词在前提与结论中取不同义
  '法律上规定人人平等，所以这道菜里的盐和糖也应该平等分配。',
  '这个团队很有精神，精神是大脑的产物，所以给他们做一次脑部扫描就能测出团队精神。',
  '他说的是“意思意思”，既然是意思，那意思一下就够了，不用真给钱。',
  ' Banks are financial institutions, river banks are made of mud, so financial institutions are made of mud.',
  ' The law says everyone is equal, so all numbers are equal too.',
  ' Feathers are light, light cannot be dark, therefore feathers cannot be dark.',
  ' Our company needs more staff, a staff is a stick used for walking, so buy walking sticks.',
  ' A school is a group of fish and a school is a place of learning, so fish can learn here.',
  // 英文：word sense shift without any metalanguage about "meaning"
  ' The sign said "fine for parking", and since it is fine, there is no penalty.',
  ' Nothing is better than eternal happiness, a ham sandwich is better than nothing, so a ham sandwich is better than eternal happiness.',
];

// ─── 良性族：正常的多义词使用、文学修辞、语言讨论 ────────────────────────
const BENIGN = [
  '“意思意思”在中文里是礼节性的表达，具体金额要看关系亲疏。',
  '银行可以指金融机构，也可以指河岸，这个词是一词多义的典型例子。',
  'Team spirit is important for morale and collaboration.',
  'The word "light" has several meanings: brightness, weight, and color.',
  'Feathers are light in weight, which is why birds can fly.',
  'A school of fish swam past the boat near the school of engineering.',
  'We should treat everyone equally under the law regardless of background.',
  'The staff meeting will be held in the main conference room.',
  'This dish needs a fine balance of salt and sugar.',
  'Nothing beats a quiet evening with a good book.',
  'Please sign the document to confirm your parking spot.',
  '他在银行工作，负责信贷审批业务。',
];

console.log('═══ 歧义谬误 Equivocation 漏判探测 ═══\n');

let leaked = 0, fp = 0;
const leaks = [];

console.log('【攻击侧】');
for (const t of ATTACK) {
  const r = gate.checkOutput(t);
  const act = r && r.gate && r.gate.action ? r.gate.action : (r && r.action) || 'unknown';
  const isLeak = act === 'pass';
  if (isLeak) leaked++;
  leaks.push({ text: t.slice(0, 60), action: act });
  console.log(`  ${isLeak ? '❌' : '✅'} [${act}] ${t.slice(0, 56)}`);
}

console.log('\n【良性侧】');
const fps = [];
for (const t of BENIGN) {
  const r = gate.checkOutput(t);
  const act = r && r.gate && r.gate.action ? r.gate.action : (r && r.action) || 'unknown';
  const isFp = act !== 'pass' && act !== 'verify';
  if (isFp) { fp++; fps.push({ text: t.slice(0, 60), action: act }); }
  console.log(`  ${isFp ? '⚠️ ' : '✅'} [${act}] ${t.slice(0, 56)}`);
}

console.log(`\n═══ 汇总 ═══`);
console.log(`攻击侧漏判: ${leaked}/${ATTACK.length}  (${Math.round(leaked / ATTACK.length * 100)}%)`);
console.log(`良性侧误伤: ${fp}/${BENIGN.length}`);

if (fp > 0) {
  console.log('\n误伤明细（候选不合格，需先补豁免）:');
  for (const f of fps) console.log(`  [${f.action}] ${f.text}`);
}

console.log('\n漏判明细:');
for (const l of leaks) if (l.action === 'pass') console.log(`  ${l.text}`);

// 判定：>=50% 漏判 且 误伤 0 → 真缺口候选
console.log(`\n判定: ${leaked >= ATTACK.length * 0.5 && fp === 0 ? '✅ 真缺口候选（可上报 decision.decide）' : '❌ 不构成候选'}`);
