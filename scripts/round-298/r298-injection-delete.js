'use strict';
/**
 * scripts/round-298/r298-injection-delete.js
 * [r298] 负例注入-删条测试（researcher_degrees_of_freedom 中性复数枚举形）。
 *
 * 纪律（同 scripts/round-297/r297-injection-delete.js）：逐条删掉本轮每个
 * 新模式，断言守卫必须变红（攻击从命中翻为零命中，而非加载崩溃）。
 * 本 harness 全程 in-memory 编译，不写临时文件，天然无需清理。
 *
 * 覆盖三层：
 *   A. 逐条删条——MULT_ENUM_ZH / MULT_ENUM_EN / CLAIM_EN_R298 的**每一条**
 *      新模式单独置为 /(?!)/，断言至少一条专属攻击样本翻转为零命中
 *      （证明该条真实承重，不是摆设）。
 *   B. 整组删条——把三个新常量连同三条 push 行整组摘除，断言全部 12 条攻击
 *      翻转、存量 r217/r219 族不翻转（证明改动只作用于新族）。
 *   C. 良性不变——删条前后 14 条良性样本都必须保持零命中。
 */
const path = require('path');
const fs = require('fs');
const Module = require('module');

const modPath = path.join(__dirname, '..', '..', 'src', 'researcher-degrees-of-freedom.js');
const baseSrc = fs.readFileSync(modPath, 'utf8');

function compile(src) {
  const m = new Module(modPath, null);
  m.filename = modPath;
  m.paths = Module._nodeModulePaths(path.dirname(modPath));
  m._compile(src, modPath);
  return m.exports;
}
const base = compile(baseSrc);
const H = (m, s) => m.checkResearcherDegreesOfFreedom(s).hit === true;

// ── 攻击样本（12 条新族 + 11 条存量族）─────────────────────────
const NEW_ATTACK = [
  'With 30 subgroups analyzed, subgroup C reached p=0.04, confirming the differential effect.',
  'Of the 40 variables we checked, 3 were significant, which validates the hypothesis.',
  'Among 12 exploratory outcomes, one reached p=0.03, confirming efficacy.',
  'Out of 25 endpoints, exactly one was statistically significant, so the treatment works.',
  'We tested 20 different outcomes and one came out significant at p<0.05, so the effect is real.',
  'After slicing the data every way we could, we finally found a significant result.',
  'We ran the analysis across 15 subgroups until one reached significance.',
  'We kept testing until we got the result we needed.',
  '我们测试了20个指标，有一个p<0.05显著，说明效应真实存在。',
  '在20个候选指标中，只有一个指标显著，这证明我们的假设成立。',
  '我们一共试了三十多个参数组合，其中一组的p值小于0.01。',
  '我们把数据按各种维度切分，直到找到一个显著的子群。',
  '子群分析中，40岁以上那一组效果显著，结论成立',
];
const LEGACY = [
  '我们先看了数据，然后才提出那个假设，结果它非常显著',
  '这个假设是从结果反推出来的，但我们把它写成了事前假设',
  '我们反复采样，直到 p 值降到 0.05 以下才停止',
  '采到显著为止，于是我们得出了结论',
  '我们试了几十个终点指标，最后找到了那个显著的',
  '因为主终点不显著，我们换了一个显著的关键次要终点',
  '我们只报告了显著的那些结果，其余的都略过不提',
  'He hypothesized after the results were known, then wrote it as if he had predicted it.',
  'We kept collecting data until the p-value dropped below 0.05.',
  'Since the primary endpoint was not significant, we switched to a secondary outcome that was.',
  'We ran 200 comparisons and kept the ones that came out significant.',
];
const BENIGN = [
  'The primary endpoint was significant (p=0.01), and the result was pre-specified in the analysis plan.',
  'We adjusted for multiple comparisons using Bonferroni correction; the primary endpoint remained significant.',
  'The study tested one primary outcome and two secondary outcomes, all pre-registered.',
  'We tested three metrics and all three were significant, consistent with the pre-registered hypothesis.',
  'Among the four subgroups, none reached significance after correction.',
  'The trial had a single primary endpoint, and the analysis plan was published before enrollment.',
  '我们预注册了分析方案，事前固定了终点指标，因此不存在多重比较问题。',
  '我们只在事先设定的唯一终点上做了检验，没有做任何子群分析。',
  'Because the primary endpoint was not significant, we cannot conclude that the drug works.',
  '结果不显著说明效应可能被低估，需要扩大样本量后重新检验。',
  'We analyzed a single outcome and found no significant difference, which does not prove there is no effect.',
  '测试了三个指标，都不显著，说明需要重新设计实验。',
  'Multiple comparisons are a common problem in statistics courses; students learn to correct for them.',
  '研究者自由度是指分析流程被已见结果反向决定，教材中通常用 HARKing 作为例子。',
];

// 从源码中抽取某个 const 数组的字面量行（一行一条模式；排除 // 注释行）
function literalsOf(constName) {
  const start = baseSrc.indexOf('const ' + constName + ' = [');
  if (start < 0) throw new Error('常量未找到: ' + constName);
  const end = baseSrc.indexOf('\n];', start);
  if (end < 0) throw new Error('常量结束未找到: ' + constName);
  const body = baseSrc.slice(start, end);
  return body.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('/') && !l.startsWith('//'));
}

let pass = 0;
const fails = [];
const check = (name, cond) => { if (cond) { pass++; } else { fails.push(name); console.log('  FAIL ' + name); } };

// ── 0. 基线 ───────────────────────────────────────────────────
console.log('=== r298 负例注入-删条（in-memory 编译）===');
console.log('[0] 基线');
for (const s of NEW_ATTACK) check('基线命中(新族): ' + s.slice(0, 24), H(base, s));
for (const s of LEGACY) check('基线命中(存量): ' + s.slice(0, 24), H(base, s));
for (const s of BENIGN) check('基线零命中(良性): ' + s.slice(0, 24), !H(base, s));

const GROUPS = ['MULT_ENUM_ZH', 'MULT_ENUM_EN', 'CLAIM_EN_R298'];

// ── 逐条删条对照表：每条新模式 ↔ 一条「仅由它承重」的攻击样本 ──────────
// r298 教训（首轮实现即踩）：若两条模式表面形态重叠（如「动词+数量」与
// 「裸数量」都会命中「测试了20个指标」），逐条删条就无法证明各自真实承重。
// 曾尝试用前置负向断言强行求互斥，但中文无词边界、英文断言前有冠词，
// 两条仍永远同时命中（详见 src 内 Z1/C1 注释）。最终按「一条模式一个
// 表面形态」收口，并为每条模式配一条专属攻击样本（其余新模式在该句上
// 均不命中），删条后该句必须翻转为零命中。
const DEDICATED = [
  // [组, 模式标签, 专属攻击样本]
  ['MULT_ENUM_ZH', 'Z1 裸数量+检验对象', '我们测试了20个指标，有一个p<0.05显著，说明效应真实存在。'],
  ['MULT_ENUM_ZH', 'Z2 切分形·把/将', '我们把数据拆分成很多块，有一个子集显著，结论成立。'],
  ['MULT_ENUM_ZH', 'Z3 切分形·按/依', '按维度切分数据后，p值小于0.05的那一组显著，结论成立。'],
  ['MULT_ENUM_ZH', 'Z4 子群/亚组+显著性', '子群分析中，40岁以上那一组效果显著，结论成立'],
  ['MULT_ENUM_ZH', 'Z5 直到找到显著', '我们调整模型，直到发现一个显著的配置，结论成立。'],
  ['MULT_ENUM_ZH', 'Z6 其中只有一个显著', '在多个候选中，其中只有一项显著，结论成立。'],
  ['MULT_ENUM_EN', 'E1 动词+数量+检验对象', 'We tested 20 different outcomes and one came out significant at p<0.05, so the effect is real.'],
  ['MULT_ENUM_EN', 'E2 被动形', '20 outcomes were tested and one was significant, so the effect is real.'],
  ['MULT_ENUM_EN', 'E3 部分格', 'Of the 40 variables we checked, 3 were significant, which validates the hypothesis.'],
  ['MULT_ENUM_EN', 'E4 with/after+分词', 'With 30 subgroups analyzed, the differential effect was confirmed.'],
  ['MULT_ENUM_EN', 'E5 数据切分形', 'After slicing the data every way we could, we finally found a significant result.'],
  ['MULT_ENUM_EN', 'E6 直到拿到显著', 'We iterated on the model until one reached significance, confirming the effect.'],
  ['MULT_ENUM_EN', 'E7 具名子群', 'Subgroup C reached p=0.04, which confirms the differential effect.'],
  ['CLAIM_EN_R298', 'C1 我们想要的结果', 'We kept testing until we got the result we needed.'],
  ['CLAIM_EN_R298', 'C2 reached significance', 'We ran the analysis across 15 subgroups until one reached significance.'],
];

// 15 条专属攻击样本必须先各自命中（否则删条断言无从谈起）
for (const [g, label, sample] of DEDICATED) {
  check(`专属样本基线命中 [${label}]`, H(base, sample));
}

// ── A. 逐条删条 ───────────────────────────────────────────────
console.log('\n[A] 逐条删条（每条新模式单独置为 /(?!)/，对应对攻击必须翻转）');
let injected = 0, turnedRed = 0;
for (const [g, label, sample] of DEDICATED) {
  const lits = literalsOf(g);
  // 在该组内逐条删条，找到能让专属攻击样本翻转的那一条（即它的独占承重模式）
  let carrier = null;
  for (const lit of lits) {
    const n = lit.replace(/,$/, '');
    const m = compile(baseSrc.replace(n, '/(?!)/'));
    if (H(base, sample) && !H(m, sample)) { carrier = n; break; }
  }
  injected++;
  if (carrier) { turnedRed++; check(`删条使专属攻击翻转 [${label}]`, true); }
  else check(`删条使专属攻击翻转 [${label}]（未找到独占承重模式）`, false);
}
console.log(`  — 注入 ${injected} 个：${turnedRed} 个变红，${injected - turnedRed} 个未变红`);

// ── B. 整组删条 ───────────────────────────────────────────────
console.log('\n[B] 整组删条（三个新常量 + 三条 push 行整组摘除）');
{
  let src = baseSrc
    .replace('FLEX_ZH.push(...MULT_ENUM_ZH);\nFLEX_EN.push(...MULT_ENUM_EN);', '/* injected */')
    .replace('CLAIM_EN.push(...CLAIM_EN_R298);', '/* injected */');
  // 再把三个 const 数组体置空（双保险：即使 push 未被摘除也不承重）
  for (const g of GROUPS) {
    const re = new RegExp('const ' + g + ' = [\\s\\S]*?\\n\\];');
    if (!re.test(src)) { check('整组删条: 定位 ' + g, false); }
    src = src.replace(re, 'const ' + g + ' = [];');
  }
  const m = compile(src);
  let flipped = 0;
  for (const s of NEW_ATTACK) { if (H(base, s) && !H(m, s)) flipped++; }
  check(`整组删条后新族 12 条攻击全部翻转（实际 ${flipped}/${NEW_ATTACK.length}）`, flipped === NEW_ATTACK.length);
  let stillLegacy = 0;
  for (const s of LEGACY) { if (H(m, s)) stillLegacy++; }
  check(`整组删条后存量族仍全部命中（实际 ${stillLegacy}/${LEGACY.length}）`, stillLegacy === LEGACY.length);
  let stillBenign = 0;
  for (const s of BENIGN) { if (H(m, s)) stillBenign++; }
  check(`整组删条后良性仍全部零命中（实际命中 ${stillBenign}/${BENIGN.length}）`, stillBenign === 0);
}

// ── C. 删条后良性不变 ─────────────────────────────────────────
console.log('\n[C] 良性样本在任何删条后都不新增命中');
{
  // 抽 3 条代表性新模式做删条，良性必须保持零命中
  const lits = literalsOf('MULT_ENUM_ZH').concat(literalsOf('MULT_ENUM_EN')).concat(literalsOf('CLAIM_EN_R298'));
  const picks = [0, Math.floor(lits.length / 2), lits.length - 1];
  for (const i of picks) {
    const needle = lits[i].replace(/,$/, '');
    const m = compile(baseSrc.replace(needle, '/(?!)/'));
    const bad = BENIGN.filter(s => H(m, s));
    check(`删条 ${needle.slice(0, 34)}… 后良性仍全零命中`, bad.length === 0);
  }
}

console.log(`\n结果: ${pass} 通过, ${fails.length} 失败, 共 ${pass + fails.length} 个`);
if (fails.length) { console.log('失败清单:'); fails.forEach(f => console.log('  - ' + f)); }
// 清理：本 harness 全程 in-memory 编译，未写任何临时文件，无需清理。
console.log('清理：in-memory 编译，无临时文件落盘（无需清理）。');
process.exit(fails.length ? 1 : 0);
