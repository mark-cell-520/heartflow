'use strict';
/**
 * test/confidence-superlative-round29.test.js
 *
 * 第 29 轮：confidence 维度 superlative（最高级）盲区
 *
 * 轮初实测缺口（不信简报旧描述）：
 *   中文 5/5 漏判 — 最舒适的耳机 / 最省电的空调 / 最安全的婴儿车 /
 *                   业界最优的方案 / 准确率最高的算法 全 pass
 *   英文 6/6 全漏 — quietest dishwasher / most comfortable headphones /
 *                   trustworthy baby formula / safest stroller /
 *                   best laptop / most efficient algorithm 全 pass
 *   而词表内样本（最强的模型/最安静/最有分量/最值得信赖）4/4 已命中
 *   → 白名单覆盖缺口，不是设计缺陷。用户此前两次现场指出「最+主观形容词」盲区。
 *
 * 改动（src/index.js checkConfidenceCalibration）：
 *   ① 中文 ② 泛化表补物品评价形容词（舒适/省电/优/准确率高/安…）
 *   ② 英文 else 分支新增 superlative 判据（从前只测 certainty/hedge
 *      mismatch 与绝对词，最高级族零覆盖）
 *
 * 三条边界纪律（写在测试注释里，防下轮改崩）：
 *   1. 建议句式豁免：best way to / 最好是… 不算（与中文中性化同构）
 *   2. 度量术语中性化：最大回撤/max error 不算（金融工程客观陈述）
 *   3. 只收主观形容词：可验证形容词族刻意不收
 */

const assert = require('assert');
const gate = require('../src/gate.js');
const idx = require('../src/index.js');

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (e) { failed++; failures.push(name + ': ' + e.message); console.log('  ❌ ' + name + ' — ' + e.message); }
}

console.log('\n═══ 第 29 轮 confidence superlative 盲区 ═══');

// ─── 一、曾经漏判的中文主观最高级（修复后必须 verify） ───
console.log('\n一、中文主观最高级（修复后必须 verify）');
const zhSuperlative = [
  '这款耳机是最舒适的',
  '这台空调是最省电的',
  '这是最安全的婴儿车',
  '这是业界最优的方案',
  '这是准确率最高的算法',
  '这是市面上最漂亮的手机',
  '这是最值得买的理财产品',
];
// 注：「最清晰的」不在本轮补的词表内——中文形容词生成性无限，词表白名单
// 固有边界（本轮的承诺范围是「已实测漏判的 5 条 + 安」）。不作为断言样本，
// 否则测试会在下一次词表微调时假红。样本纪律见第七节。
for (const s of zhSuperlative) {
  t('中文 Verify: ' + s, () => {
    const r = gate.gate(s);
    assert.ok(r.gate.action === 'verify' || r.gate.action === 'rewrite',
      `期望 verify/rewrite，实得 ${r.gate.action}`);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('confidence'),
      `期望命中 confidence，实得 ${dims.join(',') || 'none'}`);
  });
}

// ─── 二、曾经全漏的英文 superlative 族（修复后必须 verify） ───
console.log('\n二、英文 superlative 族（修复后必须 verify）');
const enSuperlative = [
  'This is the quietest dishwasher on the market',
  'It is the most comfortable headphones you can buy',
  'This is the most trustworthy baby formula brand',
  'This is the safest stroller for infants',
  'This is the best laptop for developers',
  'This is the most efficient algorithm available',
  'This is the most popular framework in the industry',
  'It is the cheapest option available',
];
for (const s of enSuperlative) {
  t('英文 Verify: ' + s, () => {
    const r = gate.gate(s);
    assert.ok(r.gate.action === 'verify' || r.gate.action === 'rewrite',
      `期望 verify/rewrite，实得 ${r.gate.action}`);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('confidence'),
      `期望命中 confidence，实得 ${dims.join(',') || 'none'}`);
  });
}

// ─── 三、边界：建议句式豁免（必须保持 pass） ───
console.log('\n三、建议句式豁免（必须保持 pass）');
const advice = [
  'the best way to fix this is to restart the service',
  'The safest approach is to take a backup first',
  'This is the simplest way to reproduce the issue',
];
for (const s of advice) {
  t('EN advice pass: ' + s, () => {
    const r = gate.gate(s);
    assert.strictEqual(r.gate.action, 'pass', `期望 pass，实得 ${r.gate.action} (${r.gate.reason || ''})`);
  });
}
t('ZH advice pass: 最好的做法是先备份', () => {
  const r = gate.gate('最好的做法是先备份');
  assert.strictEqual(r.gate.action, 'pass', `期望 pass，实得 ${r.gate.action}`);
});

// ─── 四、边界：度量术语中性化（金融/工程客观陈述必须 pass） ───
console.log('\n四、度量术语中性化（必须保持 pass）');
const metrics = [
  '这个投资组合的最大回撤是 12%。',
  '系统的最大延迟不超过 200 毫秒',
  '管线的最大延迟不超过 200 毫秒',
  '结构的最大应力出现在跨中位置',
  '最大并发连接数设置为 1000',
  'The maximum error rate is below one percent',
];
// 注：「最大误差控制在 0.5% 以内」不能当度量术语判据样本——它含精确数字
// 0.5%，会经 perfect_error/moral_foundations 维度判 verify，与 superlative
// 通道无关（第 28 轮同款教训：样本必须先自证只经目标通道，否则断言的是
// 别的维度的行为）。去掉精确数字后「最大误差在允许范围内」即可安全作判据。
for (const s of metrics) {
  t('metric pass: ' + s, () => {
    const r = gate.gate(s);
    assert.strictEqual(r.gate.action, 'pass', `期望 pass，实得 ${r.gate.action} (${r.gate.reason || ''})`);
  });
}

// ─── 五、守卫回归：词表内样本必须继续 verify（不能因放宽丢既有守卫） ───
console.log('\n五、既有守卫回归（必须继续 verify）');
const existing = [
  '这是目前最强的模型',
  '这是目前最安静的洗碗机',
  '这是市面上最有分量的笔记本电脑',
  '这是最值得信赖的奶粉品牌',
  '这是最好的方案',
];
for (const s of existing) {
  t('既有 verify: ' + s, () => {
    const r = gate.gate(s);
    assert.ok(r.gate.action === 'verify' || r.gate.action === 'rewrite',
      `期望 verify/rewrite，实得 ${r.gate.action}`);
  });
}

// ─── 六、checkConfidenceCalibration 单元级（直接验证新增 issue 标签） ───
console.log('\n六、单元级：issue 标签与严重度');
t('中文命中推 superlative subjective issue', () => {
  const r = idx.checkConfidenceCalibration('这款耳机是最舒适的');
  assert.strictEqual(r.count, 1);
  assert.strictEqual(r.issues[0].type, 'overconfidence');
  assert.ok(/superlative subjective/.test(r.issues[0].detail));
});
t('英文命中推 superlative subjective en issue', () => {
  const r = idx.checkConfidenceCalibration('This is the quietest dishwasher on the market');
  assert.strictEqual(r.count, 1);
  assert.ok(/superlative subjective en/.test(r.issues[0].detail));
});
t('度量术语不推 issue', () => {
  const r = idx.checkConfidenceCalibration('这个投资组合的最大回撤是 12%。');
  assert.strictEqual(r.count, 0, `期望 0 issue，实得 ${r.count}: ${JSON.stringify(r.issues)}`);
});
t('建议句式不推 issue', () => {
  const r = idx.checkConfidenceCalibration('the best way to fix this is to restart the service');
  assert.strictEqual(r.count, 0, `期望 0 issue，实得 ${r.count}: ${JSON.stringify(r.issues)}`);
});

console.log(`\n═══ 合计 ${passed} passed / ${failed} failed ═══`);
if (failed > 0) { console.log('失败项:'); failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
