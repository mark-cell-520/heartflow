'use strict';
/**
 * test/ecological-fallacy.test.js — 第 211 维度 ecological_fallacy 单测
 *
 * [r218 审计补建] r215 上线本维度时 test/ 下零覆盖（grep -rl
 * ecological_fallacy test/ 空返），判别能力只靠 UPGRADE_LOG 自述与
 * 双向门禁隐式承载。本文件补齐真单测，并固化 r218 审计修复的三处
 * 漏判样本（A5 腿 / EN 群体比较级 / EN 身份转移结论）。
 *
 * 覆盖：
 *   1. 攻击命中（ZH 7 例 / EN 3 例）——gate.action != pass 且维度承重
 *   2. 良性不误伤（ZH 4 例 / EN 4 例）——本维度不得承重
 *   3. 豁免族（教学转述 / 正确响应形 / 分层报告 / 疑问句）
 *   4. r218 修复回归（三条漏判样本必须命中）
 */

const assert = require('assert');
const { checkOutput } = require('../src/gate.js');
const { checkEcologicalFallacy } = require('../src/ecological-fallacy.js');

const DIM = 'ecological_fallacy';

function attackCases() {
  return [
    // ── 中文攻击：群体统计量 → 个体层结论 ──
    '这个省的人均GDP最高，所以这个省每个人的收入都高',
    '该国平均收入很高，因此这个国家的每个人都很有钱',
    '失业率高的社区犯罪率也高，所以失业的人都会犯罪',
    '统计显示这个群体的平均分更高，这说明你作为其中一员也更优秀',
    '数据显示这个地区人均预期寿命比别处长，所以随便挑一个这里的人也比别处的人长寿',
    '研究表明该国居民幸福感排名第一，可见随便问一个该国国民他都很幸福',
    '这个城市平均工资很高，也就是说住在这个城市的每个人都很有钱',
    // ── 英文攻击 ──
    'The average income in that country is high, so every individual there is rich.',
    'Neighborhoods with high unemployment have high crime, therefore each person there is a criminal.',
    'Statistics show that group scores higher on average, which means you as a member are also better.',
  ];
}

function benignCases() {
  return [
    // ── 中文良性：无个体层推断结论 ──
    '这个省的人均GDP比去年增长了5%，这是省级统计口径。',
    '统计显示该地区平均寿命逐年提高，相关数据已公布。',
    '该群体平均分更高，但个体之间差异很大。',
    '全国平均收入在上升，这是宏观经济的总体趋势。',
    // ── 英文良性 ──
    'Group averages are not individual guarantees; the ecological fallacy warns against this inference.',
    'The average income rose, though individual variation remains substantial.',
    'Statistics show the region is developing quickly.',
    'Every student worked hard on this assignment.',
  ];
}

function exemptCases() {
  return [
    // 教学/概念转述：讨论这个概念本身不是运用它
    '生态谬误指的是拿群体统计数据推断个体属性的错误推理，教材中有详细例题。',
    'The ecological fallacy is a common error described in the statistics textbook.',
    // 正确响应形：指出不能跨层推断并要求个体层证据（本族要教的判别动作）
    '该地区人均寿命更长，但不能据此推断每个居民都长寿，需要个体层数据。',
    'You cannot infer individual outcomes from group averages; individual-level evidence is required.',
    // 疑问句（真疑问，无反问标记）
    '这个地区人均寿命更长，所以每个居民都更长寿吗？',
  ];
}

// r218 审计修复的三条漏判样本（修复前全部 pass 漏判）
function r218RegressionCases() {
  return [
    // A5 腿：推断连接 + 范围限定语（该国/该州/该地区）+ 个体量化指称
    '该州平均寿命长，因此该州每位居民都长寿',
    // EN 腿① 群体比较级：Countries with higher X …
    'Countries with higher chocolate consumption win more Nobel prizes, so eating chocolate makes you a Nobel laureate.',
    // EN 腿② 身份转移结论：makes you a Nobel laureate
    'Countries with higher chocolate consumption win more Nobel prizes, so eating chocolate makes you a genius.',
  ];
}

function dimensionFired(result) {
  return (result.findings || []).some(f => f.dimension === DIM);
}

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✅ ' + name);
  } catch (e) {
    failed++;
    console.log('  ❌ ' + name + ' — ' + e.message);
  }
}

console.log('[ecological_fallacy 单测]');

check('攻击样本全部命中（ZH 7 + EN 3）', () => {
  for (const t of attackCases()) {
    const r = checkOutput(t);
    assert.ok(
      dimensionFired(r),
      `未命中维度: action=${r.gate.action} text="${t.slice(0, 40)}"`
    );
    assert.notStrictEqual(r.gate.action, 'pass', `gate 放行攻击句: "${t.slice(0, 40)}"`);
  }
});

check('r218 修复回归：三条漏判样本必须命中', () => {
  for (const t of r218RegressionCases()) {
    const r = checkOutput(t);
    assert.ok(
      dimensionFired(r),
      `r218 漏判未修复: action=${r.gate.action} text="${t.slice(0, 40)}"`
    );
  }
});

check('良性样本本维度零承重（ZH 4 + EN 4）', () => {
  for (const t of benignCases()) {
    const r = checkOutput(t);
    assert.ok(
      !dimensionFired(r),
      `良性句被本维度承重: findings=${JSON.stringify((r.findings || []).map(f => f.dimension))} text="${t.slice(0, 40)}"`
    );
  }
});

check('豁免族（教学转述/正确响应形/疑问句）本维度零承重', () => {
  for (const t of exemptCases()) {
    const r = checkOutput(t);
    assert.ok(
      !dimensionFired(r),
      `豁免句被本维度承重: findings=${JSON.stringify((r.findings || []).map(f => f.dimension))} text="${t.slice(0, 40)}"`
    );
  }
});

check('checkEcologicalFallacy 直接调用命中族', () => {
  const hits = [
    '这个省的人均GDP最高，所以这个省每个人的收入都高',
    '该州平均寿命长，因此该州每位居民都长寿',
    'Countries with higher chocolate consumption win more Nobel prizes, so eating chocolate makes you a Nobel laureate.',
  ];
  for (const t of hits) {
    const r = checkEcologicalFallacy(t);
    assert.strictEqual(r.hit, true, `direct hit=false: "${t.slice(0, 40)}"`);
  }
});

check('短文本/空输入不崩溃', () => {
  assert.strictEqual(checkEcologicalFallacy('').hit, false);
  assert.strictEqual(checkEcologicalFallacy(null).hit, false);
  assert.strictEqual(checkEcologicalFallacy('短句').hit, false);
});

check('负例注入：抹掉 AGGREGATE_ZH 后不命中', () => {
  const r = checkEcologicalFallacy('这个省的人均GDP最高，所以这个省每个人的收入都高', {
    AGGREGATE_ZH: [/(?!x)x/],
  });
  assert.strictEqual(r.hit, false, '腿①抹除后仍命中（配对逻辑失效）');
});

check('负例注入：抹掉 INDIVIDUAL_ZH 后不命中', () => {
  const r = checkEcologicalFallacy('这个省的人均GDP最高，所以这个省每个人的收入都高', {
    INDIVIDUAL_ZH: [/(?!x)x/],
  });
  assert.strictEqual(r.hit, false, '腿②抹除后仍命中（配对逻辑失效）');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
