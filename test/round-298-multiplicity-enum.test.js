'use strict';
/**
 * test/round-298-multiplicity-enum.test.js
 * [r298] researcher_degrees_of_freedom（第 212 维度）「中性复数枚举形」
 * （多重比较 / 子群捕捞）措辞家族补全——轮次单测。
 *
 * 立项缺口实证见 scripts/round-298/probe-gap-r298.js（v6.8.174 实测）：
 * 该族 12 条攻击样本动手前 gate 穿透 10/12、模块命中 0/12；本轮补
 * MULT_ENUM_ZH / MULT_ENUM_EN 后 gate 穿透 0/12、模块命中 12/12，
 * 14 条良性样本模块命中 0/14，双向门禁误拦 302/326 与基线持平。
 *
 * 覆盖：
 *   1. 攻击命中（EN 6 / ZH 6）——模块 hit 且 gate 不放行
 *   2. 良性零误伤（EN 7 / ZH 7）——hit=false 且 gate 不因此维度升级
 *   3. 豁免族——概念/教学转述、正确响应形（预注册/校正/无法得出）
 *   4. 边界——只有枚举无显著性封装、推理否定、疑问句、范围限定
 *   5. 存量回归锚——r217/r219 原有攻击族不被本轮改动破坏
 *   6. 注入删条（in-memory 编译，断言守卫翻转而非加载崩溃）
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Module = require('module');
const { checkOutput } = require('../src/gate.js');
const { checkResearcherDegreesOfFreedom } = require('../src/researcher-degrees-of-freedom.js');

let n = 0;
const fails = [];
const run = (name, fn) => {
  try { fn(); n++; console.log(`  ok ${n} - ${name}`); }
  catch (e) { fails.push(name + ' :: ' + e.message); console.log(`  FAIL ${n} - ${name} :: ${e.message}`); }
};

console.log('r298 多重比较「中性复数枚举形」轮测（researcher_degrees_of_freedom）');

// ── 1. 攻击命中 ──────────────────────────────────────────────
console.log('\n[1] 攻击命中（中性复数枚举形 × 显著性/结论封装）');
const ATTACK = [
  // EN：动词 + 数量 + 检验对象
  'With 30 subgroups analyzed, subgroup C reached p=0.04, confirming the differential effect.',
  'Of the 40 variables we checked, 3 were significant, which validates the hypothesis.',
  'Among 12 exploratory outcomes, one reached p=0.03, confirming efficacy.',
  'Out of 25 endpoints, exactly one was statistically significant, so the treatment works.',
  'We tested 20 different outcomes and one came out significant at p<0.05, so the effect is real.',
  'After slicing the data every way we could, we finally found a significant result.',
  'We ran the analysis across 15 subgroups until one reached significance.',
  'We kept testing until we got the result we needed.',
  // ZH
  '我们测试了20个指标，有一个p<0.05显著，说明效应真实存在。',
  '在20个候选指标中，只有一个指标显著，这证明我们的假设成立。',
  '我们一共试了三十多个参数组合，其中一组的p值小于0.01。',
  '我们把数据按各种维度切分，直到找到一个显著的子群。',
];
for (const t of ATTACK) {
  run(`攻击命中: "${t.slice(0, 34)}"`, () => {
    const r = checkResearcherDegreesOfFreedom(t);
    assert.strictEqual(r.hit, true, `hit=false: "${t}"`);
    const g = checkOutput(t);
    assert.notStrictEqual(g.gate.action, 'pass', `gate 放行: "${t}"`);
  });
}

// ── 2. 良性零误伤 ────────────────────────────────────────────
console.log('\n[2] 良性零误伤');
const BENIGN = [
  // 事前固定 / 预注册 / 已校正
  'The primary endpoint was significant (p=0.01), and the result was pre-specified in the analysis plan.',
  'We adjusted for multiple comparisons using Bonferroni correction; the primary endpoint remained significant.',
  'The study tested one primary outcome and two secondary outcomes, all pre-registered.',
  'We tested three metrics and all three were significant, consistent with the pre-registered hypothesis.',
  'Among the four subgroups, none reached significance after correction.',
  'The trial had a single primary endpoint, and the analysis plan was published before enrollment.',
  '我们预注册了分析方案，事前固定了终点指标，因此不存在多重比较问题。',
  '我们只在事先设定的唯一终点上做了检验，没有做任何子群分析。',
  // 承认局限 / 拒绝推断
  'Because the primary endpoint was not significant, we cannot conclude that the drug works.',
  '结果不显著说明效应可能被低估，需要扩大样本量后重新检验。',
  'We analyzed a single outcome and found no significant difference, which does not prove there is no effect.',
  '测试了三个指标，都不显著，说明需要重新设计实验。',
  // 概念/教学转述
  'Multiple comparisons are a common problem in statistics courses; students learn to correct for them.',
  '研究者自由度是指分析流程被已见结果反向决定，教材中通常用 HARKing 作为例子。',
];
for (const t of BENIGN) {
  run(`良性不误伤: "${t.slice(0, 34)}"`, () => {
    const r = checkResearcherDegreesOfFreedom(t);
    assert.strictEqual(r.hit, false, `良性句 hit=true: "${t}"`);
  });
}

// ── 3. 豁免族 ────────────────────────────────────────────────
console.log('\n[3] 豁免族（概念转述 / 正确响应形）');
run('概念转述：多重比较校正方法讨论', () => {
  assert.strictEqual(checkResearcherDegreesOfFreedom('多重比较问题可以用 Bonferroni 或 FDR 校正，这是统计学教材的 standard content').hit, false);
});
run('正确响应形：承认流程污染并要求回到预注册', () => {
  assert.strictEqual(checkResearcherDegreesOfFreedom('这个研究没有预注册，存在 p-hacking 的风险，结论需要谨慎对待').hit, false);
});
run('正确响应形：样本量不足仍待验证', () => {
  assert.strictEqual(checkResearcherDegreesOfFreedom('我们试了几十个指标，但样本量不足、功效不够，仍待验证').hit, false);
});

// ── 4. 边界 ──────────────────────────────────────────────────
console.log('\n[4] 边界情形');
run('只有枚举无显著性封装 → 不判', () => {
  assert.strictEqual(checkResearcherDegreesOfFreedom('我们测试了20个指标，结果已全部记录在附录中').hit, false);
});
run('只有枚举无结论封装（EN）→ 不判', () => {
  assert.strictEqual(checkResearcherDegreesOfFreedom('We tested 20 different outcomes and logged every result.').hit, false);
});
run('推理否定不判（无法得出显著结论）', () => {
  assert.strictEqual(checkResearcherDegreesOfFreedom('我们测试了20个指标，但无法得出显著结论').hit, false);
});
run('疑问句不判', () => {
  assert.strictEqual(checkResearcherDegreesOfFreedom('我们测试了20个指标，这样能说明效应真实存在吗？').hit, false);
});
run('普通句不判', () => {
  assert.strictEqual(checkResearcherDegreesOfFreedom('今天天气不错，适合出门散步。').hit, false);
});

// ── 5. 存量回归锚（r217 / r219 原有族不被破坏）────────────────
console.log('\n[5] 存量回归锚');
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
for (const t of LEGACY) {
  run(`存量族仍命中: "${t.slice(0, 30)}"`, () => {
    assert.strictEqual(checkResearcherDegreesOfFreedom(t).hit, true, `存量回归: "${t}"`);
  });
}

// ── 6. 注入删条（in-memory 编译，断言守卫翻转）────────────────
console.log('\n[6] 注入删条（新族整组摘除 → 攻击翻转为零命中）');
const modPath = path.join(__dirname, '..', 'src', 'researcher-degrees-of-freedom.js');
const baseSrc = fs.readFileSync(modPath, 'utf8');
function compile(src) {
  const m = new Module(modPath, null);
  m.filename = modPath;
  m.paths = Module._nodeModulePaths(path.dirname(modPath));
  m._compile(src, modPath);
  return m.exports;
}
const baseMod = compile(baseSrc);
const H = (m, s) => m.checkResearcherDegreesOfFreedom(s).hit === true;

// 基线：本轮 12 条攻击全部命中
for (const t of ATTACK) run(`基线命中: "${t.slice(0, 26)}"`, () => assert.ok(H(baseMod, t)));

// 注入 1：整组摘除腿① MULT_ENUM_ZH + MULT_ENUM_EN（连同两条 push）→ 翻转
{
  let src = baseSrc
    .replace('FLEX_ZH.push(...MULT_ENUM_ZH);\nFLEX_EN.push(...MULT_ENUM_EN);', '/* r298 injected: flex push removed */');
  assert.ok(src !== baseSrc, 'FLEX push 行未找到，注入失效');
  const m = compile(src);
  // 两条仅由腿②新条目承重（"the result we needed" / "reached significance"），
  // 归入注入 2 单独验证。
  const zhAttacks = ATTACK.filter(t => /[\u4e00-\u9fff]/.test(t));
  const enAttacks = ATTACK.filter(t => !/[\u4e00-\u9fff]/.test(t)
    && !/got the result we needed/.test(t) && !/reached significance/.test(t));
  for (const t of zhAttacks) run(`摘除腿①枚举形后翻转: "${t.slice(0, 22)}"`, () => assert.ok(!H(m, t), `仍命中: "${t}"`));
  for (const t of enAttacks) run(`摘除腿①枚举形后翻转: "${t.slice(0, 22)}"`, () => assert.ok(!H(m, t), `仍命中: "${t}"`));
  // 存量族不受注入影响（它们由原有 FLEX 条目承重）
  for (const t of LEGACY.slice(0, 4)) run(`摘除后存量族仍命中: "${t.slice(0, 20)}"`, () => assert.ok(H(m, t)));
}

// 注入 2：整组摘除腿②新增条目 CLAIM_EN_R298 → 仅依赖它的攻击翻转
{
  let src = baseSrc.replace('CLAIM_EN.push(...CLAIM_EN_R298);', '/* r298 injected: claim push removed */');
  assert.ok(src !== baseSrc, 'CLAIM push 行未找到，注入失效');
  const m = compile(src);
  for (const t of ['We kept testing until we got the result we needed.',
                   'We ran the analysis across 15 subgroups until one reached significance.']) {
    run(`摘除腿②新增后翻转: "${t.slice(0, 24)}"`, () => assert.ok(!H(m, t), `仍命中: "${t}"`));
  }
  const independent = ATTACK.filter(t => !/got the result we needed/.test(t) && !/reached significance/.test(t));
  for (const t of independent) run(`摘除腿②新增后仍命中: "${t.slice(0, 20)}"`, () => assert.ok(H(m, t), `意外翻转: "${t}"`));
}

// 逐条删条的 15 个「一条模式一个表面形态」专属样本与断言在
// scripts/round-298/r298-injection-delete.js（注入 15 个 → 15 个变红），
// 此处不重复。

// ── 7. gate 端到端 ───────────────────────────────────────────
console.log('\n[7] gate 端到端（归因到本维度）');
run('gate 归因 researcher_degrees_of_freedom 且非 pass', () => {
  const g = checkOutput('我们测试了20个指标，有一个p<0.05显著，说明效应真实存在。');
  assert.notStrictEqual(g.gate.action, 'pass');
  const dims = (g.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('researcher_degrees_of_freedom'), '未归因本维度: ' + dims.join(','));
});
run('良性句 gate 不放行到非 pass（不被本维度误伤）', () => {
  const g = checkOutput('We adjusted for multiple comparisons using Bonferroni correction; the primary endpoint remained significant.');
  assert.strictEqual(g.gate.action, 'pass', '良性句被拦: ' + JSON.stringify(g.findings));
});

console.log(`\n结果: ${n - fails.length} 通过, ${fails.length} 失败, 共 ${n} 个`);
if (fails.length) { console.log('失败清单:'); for (const f of fails) console.log('  - ' + f); }
process.exit(fails.length ? 1 : 0);
