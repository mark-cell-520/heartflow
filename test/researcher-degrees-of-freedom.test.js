'use strict';
/**
 * test/researcher-degrees-of-freedom.test.js
 * 第 213 判别维度 researcher_degrees_of_freedom（研究者自由度 / 数据挖掘谬误）
 * 单测。
 *
 * [r227 审计补建] src/index.js 的维度描述里写「样本形状与负例见
 * test/round-219-researcher-degrees-of-freedom.js」，但该文件从未存在
 * （git log --all --diff-filter=A 空返）——本维度自 r219 接线起，判别能力
 * 只靠 UPGRADE_LOG 自述与双向门禁隐式承载，无任何单测固化。本轮补建。
 *
 * 覆盖（全部为真实运行断言，非自报告采信）：
 *   1. 攻击命中（ZH 5 / EN 4）——checkResearcherDegreesOfFreedom().hit 且
 *      gate 不放行
 *   2. 良性零误伤（ZH 4 / EN 3）——hit=false 且本维度不承重
 *   3. 豁免族——概念/教学转述、正确响应形
 *   4. 负例注入——抹 FLEX 腿 / 抹 CLAIM 腿后不命中，验证两腿配对真实生效
 *   5. 边界——无腿②、推理否定、疑问句
 */

const assert = require('assert');
const { checkOutput } = require('../src/gate.js');
const { checkResearcherDegreesOfFreedom } = require('../src/researcher-degrees-of-freedom.js');

let n = 0;
const run = (name, fn) => { fn(); n++; console.log(`  ok ${n} - ${name}`); };

console.log('researcher_degrees_of_freedom（第 213 维度）单测');

// ── 1. 攻击命中 ──────────────────────────────────────────────
console.log('\n[1] 攻击命中（两腿共现）');
const attacks = [
  // HARKing：先看结果再提假设
  '我们先看了数据，然后才提出那个假设，结果它非常显著',
  '这个假设是从结果反推出来的，但我们把它写成了事前假设',
  // optional stopping / p-hacking
  '我们反复采样，直到 p 值降到 0.05 以下才停止',
  '采到显著为止，于是我们得出了结论',
  // outcome switching / 多重比较择优
  '我们试了几十个终点指标，最后找到了那个显著的',
  '因为主终点不显著，我们换了一个显著的关键次要终点',
  '我们只报告了显著的那些结果，其余的都略过不提',
  // EN
  'He hypothesized after the results were known, then wrote it as if he had predicted it.',
  'We kept collecting data until the p-value dropped below 0.05.',
  'Since the primary endpoint was not significant, we switched to a secondary outcome that was.',
  'We ran 200 comparisons and kept the ones that came out significant.',
];
for (const t of attacks) {
  run(`攻击命中: "${t.slice(0, 30)}"`, () => {
    const r = checkResearcherDegreesOfFreedom(t);
    assert.strictEqual(r.hit, true, `hit=false: "${t}"`);
    const g = checkOutput(t);
    assert.notStrictEqual(g.gate.action, 'pass', `gate 放行攻击句: "${t}"`);
  });
}

// ── 2. 良性零误伤 ────────────────────────────────────────────
console.log('\n[2] 良性零误伤');
const benign = [
  // 正确响应形：承认流程被污染并要求回到预注册
  '这个研究没有预注册，存在 p-hacking 的风险，结论需要谨慎对待',
  '该分析属于事后假设，需要多重比较校正并如实标注',
  '样本量不足，功效不够，仍待验证',
  '回到事前固定的分析方案，预注册后重新评估证据强度',
  // 概念/教学转述
  '研究者自由度是指分析流程被已见结果反向决定',
  '预注册可以避免事后假设的问题',
  '课堂上讲过 garden of forking paths 这个概念',
  // EN
  'The study was not preregistered, so p-hacking is a real risk here.',
  'Multiple comparisons should be adjusted with Bonferroni or FDR.',
  'This needs to be labeled as a post-hoc analysis.',
];
for (const t of benign) {
  run(`良性不误伤: "${t.slice(0, 30)}"`, () => {
    const r = checkResearcherDegreesOfFreedom(t);
    assert.strictEqual(r.hit, false, `良性句 hit=true: "${t}"`);
  });
}

// ── 3. 负例注入：抹单腿后不命中 ──────────────────────────────
console.log('\n[3] 负例注入（抹腿验证两腿配对真实生效）');
// 抹 FLEX 腿：只有结论封装，无流程被反向决定的标记
run('抹 FLEX 腿 → 不命中', () => {
  const r = checkResearcherDegreesOfFreedom('这个假设非常显著，结论成立');
  assert.strictEqual(r.hit, false, `仅有腿②却命中: ${JSON.stringify(r)}`);
});
// 抹 CLAIM 腿：只有流程标记，无显著性/结论封装
run('抹 CLAIM 腿 → 不命中', () => {
  const r = checkResearcherDegreesOfFreedom('我们先看了数据，然后才提出那个假设');
  assert.strictEqual(r.hit, false, `仅有腿①却命中: ${JSON.stringify(r)}`);
});

// ── 4. 边界：推理否定 / 对冲 / 疑问句 ────────────────────────
console.log('\n[4] 边界情形');
run('推理否定不判（无法得出显著结论）', () => {
  const r = checkResearcherDegreesOfFreedom('我们先看了数据才提假设，但无法得出显著结论');
  assert.strictEqual(r.hit, false, `否定句却命中: ${JSON.stringify(r)}`);
});
run('疑问句不判', () => {
  const r = checkResearcherDegreesOfFreedom('我们是不是先看了数据才提出假设，结果它很显著？');
  assert.strictEqual(r.hit, false, `疑问句却命中: ${JSON.stringify(r)}`);
});
run('无攻击内容不判', () => {
  const r = checkResearcherDegreesOfFreedom('今天天气不错，适合出门散步。');
  assert.strictEqual(r.hit, false, `普通句却命中: ${JSON.stringify(r)}`);
});

// ── 5. gate 集成：攻击句不被放行 ─────────────────────────────
console.log('\n[5] gate 端到端');
run('gate 对攻击句不放行', () => {
  const g = checkOutput('我们试了几十个终点指标，最后找到了那个显著的，于是得出了结论');
  assert.notStrictEqual(g.gate.action, 'pass', 'gate 放行了攻击句');
});

console.log(`\n结果: ${n} 通过, 0 失败, 共 ${n} 个`);
