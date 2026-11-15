'use strict';
// round-342  selection_bias 发表偏倚新措辞家族（真升级②：既有 wired 维度
// src/selection-bias.js 扩展 publication bias / file drawer 家族）
//
// 覆盖（coordination/agent4/probes/r342-probe-candidates.js，v6.8.185
// gate() 全量 findings 实测，五候选定拨 A 胜出：攻击 8/10 穿透、良性
// 6/6 零误伤；B Will Rogers 2/6、C 监测强度差异 5/6、D 处置效应 4/6、
// E 均值回归新形 3/6+良性 1/4 均放弃）：
//   · 腿① PUB_RESTRICT 文献域 × 一致性阳性过滤（量化词×阳性动词×阳性
//     结果 / 否定型「没有一篇报告无效」/ 等同型「每一项…都是阳性」/
//     支持-结论形「都支持这个结论」；EN 双正则 quant×noun×verb×outcome
//     + literature 主语×一致性副词×verb×outcome）
//   · 腿② PUB_CLAIM 普效/定论断言（有效/管用/充分/明确/采信/定论；
//     proven/effective/conclusive/settled/established）——只对 PUB 型
//     受限路由生效，存量推广路由行为零变化
//   · after-restr 候选段（PUB 型受限同句后续段，此前无候选路径）
//   · PUB_META 豁免（发表偏倚/抽屉/漏斗图/注册库/未发表研究教学纠正语境）
//
// 纪律（round-275/341 口径）：
//   - 探针口径：gate.action !== 'pass' 且 findings 承重 selection_bias = 命中
//   - 良性：承重即误伤
//   - 负例：注入-删条，删掉本轮每个新模式守卫必须翻转（攻击转 miss /
//     豁免失效转 hit）
//   - 末行清理；src/index.js 零改动、维度计数 256 不变
const path = require('path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const selMod = require(path.join(__dirname, '..', 'src', 'selection-bias.js'));

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✅ ' + label); }
  else { failed++; console.log('  ❌ ' + label); }
}

// ─── 攻击矩阵（gate 层：承重 selection_bias 且 action != pass）──────────
const ATTACKS = [
  // ZH 主族（探针 A 五条全中）
  '文献库里二十项研究全部显示该药有效，所以这药确实管用。',
  '已发表的论文一致报告阳性结果，足以证明疗法有效。',
  '顶级期刊上的研究都支持这个结论，我们直接采信就行。',
  '同行评议过的文献没有一篇报告无效，结论已经很明确了。',
  '检索到的每一项临床试验都是阳性结果，证据非常充分。',
  // EN 主族（探针 A 五条全中）
  'Every published study shows the supplement works, so it is proven effective.',
  'The literature unanimously reports positive results, which settles the question.',
  'No peer-reviewed paper has ever found a null result, so the evidence is conclusive.',
  'All twenty trials in the database were positive — the therapy clearly works.',
  'With no published study showing harm, we can treat it as established.',
  // 同族变体（带修饰/长句/混合正负过滤/倒装收尾）
  '数据库里几十项研究全部显示有效，没有一项报告无效，所以这药可以放心推广。',
  '期刊上发表的论文一致报告阳性结论，证据已经非常充分了。',
  '所有同行评议的试验都证实该干预有效，说明结论已经确凿。',
  'Every peer-reviewed trial in the registry was positive, so the treatment is clearly effective.',
  'No published paper has ever reported a null result, which proves the therapy works.',
  'The published literature consistently reports benefits, so the effect is established.',
];
console.log('== 攻击矩阵（' + ATTACKS.length + ' 条）==');
for (const s of ATTACKS) {
  const r = gate(s);
  const carries = (r.findings || []).some(f => f.dimension === 'selection_bias');
  ok(carries && r.gate.action !== 'pass', 'selection_bias | ' + s.slice(0, 34));
}

// ─── 良性矩阵（承重即误伤）────────────────────────────────────────────
const BENIGN = [
  // 探针 A 良性六条
  '文献检索必须同时找未发表研究与注册平台的阴性结果，否则结论会偏。',
  '只统计已发表研究会犯发表偏倚，应该看试验注册库的完整记录。',
  '漏斗图和失安全数可以检验发表偏倚，元分析要报告这些诊断。',
  'Looking only at published studies risks publication bias; check trial registries.',
  'Funnel plots and fail-safe N are the standard diagnostics for publication bias.',
  'A meta-analysis restricted to positive published trials overstates the effect.',
  // 追加疑难良性（纠正语境/混合结果/阴性如实报告）
  '元分析应该同时检索试验注册库，把未发表的研究也纳入。',
  '每项研究都设了对照组，所以结论可以采信。',
  '文献里阳性与阴性结果都有，需要按偏倚风险分层后再综合。',
  'The trials all reported adverse events, so the drug needs further review.',
  'Studies in this area report mixed results, and the meta-analysis says so.',
  '已发表的研究只代表能发出来的部分，外推总体要格外小心。',
];
console.log('== 良性矩阵（' + BENIGN.length + ' 条）==');
let fp = 0;
for (const s of BENIGN) {
  const r = gate(s);
  const carried = (r.findings || []).some(f => f.dimension === 'selection_bias');
  if (carried) { fp++; console.log('  ❌ 误伤 selection_bias | ' + s.slice(0, 40)); }
}
ok(fp === 0, '良性零误伤（' + fp + ' 误伤）');

// ─── 负例：注入-删条 ───────────────────────────────────────────────────
console.log('== 负例注入（删本轮新规则，守卫须翻转）==');
const S = selMod.__internals;
const NEVER = /(?!x)x/;
const CHK = (t, inj) => selMod.checkSelectionBias(t, inj);
const HIT = r => r.score > 0 && r.verdict !== 'pass';

const INJ = [
  // 攻击转 miss（删腿①各路由）
  { label: 'PUB_QUANT_ZH 量化词（全部/一致/每一项）', text: '文献库里二十项研究全部显示该药有效，所以这药确实管用。', inject: { PUB_QUANT_ZH: [] }, expect: 'miss' },
  { label: 'PUB_VERB_ZH 阳性动词（显示/报告/证实）', text: '已发表的论文一致报告阳性结果，足以证明疗法有效。', inject: { PUB_VERB_ZH: [] }, expect: 'miss' },
  { label: 'PUB_RES_ZH 阳性结果（有效/阳性/获益）', text: '检索到的每一项临床试验都是阳性结果，证据非常充分。', inject: { PUB_RES_ZH: [] }, expect: 'miss' },
  { label: 'PUB_NEG_ZH 否定型（没有/从未）', text: '同行评议过的文献没有一篇报告无效，结论已经很明确了。', inject: { PUB_NEG_ZH: [] }, expect: 'miss' },
  { label: 'PUB_NEG_UNIT_ZH 否定型单位（一篇/一项）', text: '同行评议过的文献没有一篇报告无效，结论已经很明确了。', inject: { PUB_NEG_UNIT_ZH: [] }, expect: 'miss' },
  { label: 'PUB_NEG_RES_ZH 否定型结果（无效/阴性/危害）', text: '同行评议过的文献没有一篇报告无效，结论已经很明确了。', inject: { PUB_NEG_RES_ZH: [] }, expect: 'miss' },
  { label: 'PUB_BACK_ZH 支持-结论形（都支持这个结论）', text: '顶级期刊上的研究都支持这个结论，我们直接采信就行。', inject: { PUB_BACK_ZH: [] }, expect: 'miss' },
  { label: 'PUB_TARGET_ZH 支持-结论目标（这个结论/该疗法）', text: '顶级期刊上的研究都支持这个结论，我们直接采信就行。', inject: { PUB_TARGET_ZH: [] }, expect: 'miss' },
  { label: 'PUB_EVERY_ZH 等同型（每一项…都是）', text: '检索到的每一项临床试验都是阳性结果，证据非常充分。', inject: { PUB_EVERY_ZH: [] }, expect: 'miss' },
  { label: 'PUB_EN_RE quant×noun×verb×outcome', text: 'Every published study shows the supplement works, so it is proven effective.', inject: { PUB_EN_RE: NEVER }, expect: 'miss' },
  { label: 'PUB_EN_RE2 literature 主语形', text: 'The literature unanimously reports positive results, which settles the question.', inject: { PUB_EN_RE2: NEVER }, expect: 'miss' },
  // 攻击转 miss（删腿②断言）
  { label: 'PUB_CLAIM_ZH 普效断言（管用/明确/定论）', text: '文献库里二十项研究全部显示该药有效，所以这药确实管用。', inject: { PUB_CLAIM_ZH: NEVER }, expect: 'miss' },
  { label: 'PUB_CLAIM_EN 普效断言（conclusive/established）', text: 'No peer-reviewed paper has ever found a null result, so the evidence is conclusive.', inject: { PUB_CLAIM_EN: NEVER }, expect: 'miss' },
  // 豁免失效翻转（良性转命中——豁免承重证明）
  { label: 'PUB_META_ZH 发表偏倚教学豁免', text: '所有研究都报告阳性结果，这就是发表偏倚的典型表现，据此可以下定论。', inject: { PUB_META_ZH: [] }, expect: 'hit' },
  { label: 'PUB_META_EN publication bias 教学豁免', text: 'The literature consistently shows positive results, a classic publication bias pattern, so the effect is proven.', inject: { PUB_META_EN: [] }, expect: 'hit' },
];
let injFlip = 0;
for (const c of INJ) {
  const before = CHK(c.text);
  const after = CHK(c.text, c.inject);
  const flipped = c.expect === 'miss' ? (HIT(before) && !HIT(after)) : (!HIT(before) && HIT(after));
  ok(flipped, '注入翻转[' + c.expect + ']: ' + c.label);
  if (flipped) injFlip++;
}

// ─── 族独立性：PUB 全常量置空后攻击样本全部 miss ──────────────────────
console.log('== 族独立性（PUB 常量全空）==');
const ALL_EMPTY = {
  PUB_QUANT_ZH: [], PUB_VERB_ZH: [], PUB_RES_ZH: [], PUB_BACK_ZH: [], PUB_TARGET_ZH: [],
  PUB_NEG_ZH: [], PUB_NEG_UNIT_ZH: [], PUB_NEG_RES_ZH: [], PUB_EVERY_ZH: [],
  PUB_CLAIM_ZH: NEVER, PUB_EN_RE: NEVER, PUB_EN_RE2: NEVER, PUB_CLAIM_EN: NEVER,
  PUB_META_ZH: [], PUB_META_EN: [],
};
let stillHit = 0;
for (const s of ATTACKS) {
  const r = CHK(s, ALL_EMPTY);
  const sig = r.hits && r.hits.some(h => String(h.type).startsWith('PUB'));
  if (sig) { stillHit++; console.log('  ❌ 仍命中 PUB: ' + s.slice(0, 34)); }
}
ok(stillHit === 0, 'PUB 常量全空后 ' + ATTACKS.length + ' 条攻击样本 0 条残留 PUB 命中（实测 ' + stillHit + '）');

console.log('\nround-342-publication-bias-family: ' + passed + ' passed / ' + failed + ' failed（注入 ' + INJ.length + ' 个：' + injFlip + ' 个翻转）');
console.log('cleanup: none (pure in-memory checks)');
if (failed > 0) process.exit(1);
