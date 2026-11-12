'use strict';
/**
 * test/round-307-evidence-claim-mismatch.test.js
 *
 * 第 251 维度 evidence_claim_mismatch（证据-断言覆盖失配 /
 * extrinsic hallucination）轮测。
 *
 * 覆盖：
 *  A 组 — 攻击样本（ZH+EN，含穿透既有维度的真缺口样本）
 *  B 组 — 良性样本（零误伤要求）
 *  C 组 — 负例注入：逐族清空常量后攻击样本必须 miss（证明承重腿）
 *  D 组 — gate 层归因：findings 必须含 evidence_claim_mismatch
 */

const assert = require('node:assert/strict');
const { checkEvidenceClaimMismatch, __internals } = require('../src/evidence-claim-mismatch.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL: ${name}${extra ? ' — ' + extra : ''}`); }
}

// ─── A 组：攻击样本 ───────────────────────────────────────────────────
const attacks = [
  // 部分样本 → 全称结论
  ['研究显示服用维生素D的志愿者冬季感冒更少，所以维生素D能预防所有呼吸道感染。', 'zh-partial-to-all'],
  ['在200名大学生中的实验证明了这种方法对所有人都有效。', 'zh-local-to-all'],
  ['一项研究表明早期教育能提高认知测试分数，因此所有孩子都应该接受同样的训练。', 'zh-sample-to-all'],
  ['调查显示某市居民睡眠时长增加，这说明该措施能提升全民健康水平。', 'zh-local-to-whole'],
  // 相关 → 因果/疗效
  ['数据表明喝咖啡的人心血管死亡率更低，可见喝咖啡可以治疗心脏病。', 'zh-corr-to-causal-cure'],
  ['统计显示冰激凌销量与溺水人数高度相关，所以吃冰激凌会导致溺水。', 'zh-corr-to-causal'],
  ['实验发现该地区人均收入与身高正相关，所以提高收入能让人长高。', 'zh-corr-to-causal-grow'],
  // 同主题但结论与研究问题无关
  ['《Nature》2023年的研究调查了城市绿化，这证明了植树能降低全国犯罪率。', 'zh-topic-unrelated'],
  ['研究考察了某校学生的睡眠时长，这足以说明全国教育体制需要改革。', 'zh-topic-unrelated-2'],
  // EN
  ['The study found that the drug reduced symptoms in 40% of trial participants, so the drug cures the disease.', 'en-partial-to-cure'],
  ['Research shows that people who eat fish live longer, so eating fish makes everyone immortal.', 'en-en-cor-to-overclaim'],
  ['Data show that this diet worked for a small group, therefore it works for everyone.', 'en-small-to-everyone'],
];

for (const [text, tag] of attacks) {
  const r = checkEvidenceClaimMismatch(text);
  ok(r.hit === true, `attack hits [${tag}]`, JSON.stringify(r));
}

// ─── B 组：良性样本（必须零误伤） ─────────────────────────────────────
const benign = [
  ['证据不足，样本太小，不能证明这个方法对所有人有效。', 'zh-sufficiency'],
  ['该研究仅在该样本中观察到相关性，因果尚待检验。', 'zh-scoped'],
  ['相关性不等于因果，我们不能推出喝咖啡会导致溺水。', 'zh-negation'],
  ['统计学教材里讲过因果推断和混杂变量的概念。', 'zh-concept'],
  ['也许这项研究能说明一些问题，但还需要更大规模的重复实验。', 'zh-hedge'],
  ['研究显示的数据可能存在偏差，是否足以证明结论仍需验证？', 'zh-question'],
  ['数据显示治疗效果在部分患者中显现，不能推广到其他人群。', 'zh-bounded'],
  ['初步结果显示相关趋势，尚待重复验证。', 'zh-preliminary'],
  ['The evidence is insufficient to conclude that the drug cures the disease.', 'en-sufficiency'],
  ['This is merely correlational and observational only.', 'en-merely'],
  ['The study was limited to a small cohort in one city.', 'en-bounded'],
  ['Researchers caution that more work is needed before drawing conclusions.', 'en-caution'],
];

for (const [text, tag] of benign) {
  const r = checkEvidenceClaimMismatch(text);
  ok(r.hit === false, `benign clean [${tag}]`, JSON.stringify(r));
}

// ─── C 组：负例注入（逐族清空，证明承重腿） ─────────────────────────
const I = __internals();
// 清空证据腿 → 全部 miss
{
  const R = { EVID_ZH: [], EVID_EN: [] };
  const n = attacks.filter(([t]) => checkEvidenceClaimMismatch(t, R).hit).length;
  ok(n === 0, `EVID emptied → 0/${attacks.length} hits`, `got ${n}`);
}
// 清空越界腿 → 全部 miss
{
  const R = { OVERREACH_ZH: [], OVERREACH_EN: [] };
  const n = attacks.filter(([t]) => checkEvidenceClaimMismatch(t, R).hit).length;
  ok(n === 0, `OVERREACH emptied → 0/${attacks.length} hits`, `got ${n}`);
}
// 豁免逐族清空：必须同时清空其余三类豁免，否则该样本会被其他豁免兜住，
// 翻转判定不成立。测试的是「该豁免族确实是这条良性样本的承重腿」。
const ALL_EXEMPT_EMPTY = {
  EXEMPT_META_ZH: [], EXEMPT_META_EN: [],
  EXEMPT_SUFF_ZH: [], EXEMPT_SUFF_EN: [],
  EXEMPT_NEG_ZH: [], EXEMPT_NEG_EN: [],
  EXEMPT_HEDGE_ZH: [], EXEMPT_HEDGE_EN: [],
};
const exemptionProbes = [
  ['EXEMPT_SUFF_ZH', '证据不足，样本太小，不能证明这个方法对所有人有效。', 'sufficiency'],
  ['EXEMPT_NEG_ZH', '相关性不等于因果，我们不能推出喝咖啡会导致溺水。', 'negation'],
  ['EXEMPT_HEDGE_ZH', '也许这项研究能说明一些问题，但还需要更大规模的重复实验。', 'hedge'],
  ['EXEMPT_META_ZH', '统计学教材里讲过因果推断和混杂变量的概念。', 'concept-teaching'],
];
for (const [key, text, tag] of exemptionProbes) {
  // 基线：默认参数下该样本 miss
  ok(checkEvidenceClaimMismatch(text).hit === false, `baseline benign clean [${tag}]`);
  // 只清空目标族（其余豁免仍生效）：仍应 miss —— 说明该样本不依赖别的豁免
  const onlyTarget = { ...ALL_EXEMPT_EMPTY, [key]: [] };
  ok(checkEvidenceClaimMismatch(text, onlyTarget).hit === false,
    `only ${key} emptied → still clean [${tag}]`,
    JSON.stringify(checkEvidenceClaimMismatch(text, onlyTarget)));
  // 全清空：应翻红 —— 证明该豁免族是这条样本的承重腿
  const r = checkEvidenceClaimMismatch(text, ALL_EXEMPT_EMPTY);
  ok(r.hit === true, `ALL EXEMPT emptied → flips red [${tag}]`, JSON.stringify(r));
}

// ─── D 组：gate 层归因 ──────────────────────────────────────────────
const gateAttacks = [
  '研究显示服用维生素D的志愿者冬季感冒更少，所以维生素D能预防所有呼吸道感染。',
  '统计显示冰激凌销量与溺水人数高度相关，所以吃冰激凌会导致溺水。',
  'The study found that the drug reduced symptoms in 40% of trial participants, so the drug cures the disease.',
];
for (const text of gateAttacks) {
  const g = gate(text);
  const dims = (g.findings || []).map(f => f.dimension);
  ok(dims.includes('evidence_claim_mismatch'),
    `gate attributes evidence_claim_mismatch [${text.slice(0, 18)}]`,
    JSON.stringify({ action: g.gate.action, dims: dims.slice(0, 6) }));
  ok(g.gate.action !== 'pass',
    `gate action not pass [${text.slice(0, 18)}]`,
    g.gate.action);
}

// 穿透基线记录：接线前这三条 gate=pass / findings 空（见 UPGRADE_LOG r307）
{
  const g = gate('研究显示服用维生素D的志愿者冬季感冒更少，所以维生素D能预防所有呼吸道感染。');
  ok(g.gate.action === 'verify', 'previously-passing line now verify', g.gate.action);
}

// ─── E 组：维度计数登记 ─────────────────────────────────────────────
{
  const idx = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'index.js'), 'utf8');
  ok(idx.includes("name:'evidence_claim_mismatch'"), 'index.js score array registers 251st dim');
  ok(idx.includes("'evidence_claim_mismatch',"), 'index.js VERIFY_DIMS registers 251st dim');
  ok((idx.match(/evidence_claim_mismatch: ecm/g) || []).length >= 3, 'index.js has >=3 ecm registration maps');
}

console.log(`\nround-307-evidence-claim-mismatch: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
