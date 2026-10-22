#!/usr/bin/env node
/**
 * test/confidence-superlative-en-mixed-r224.test.js
 *
 * 第 224 轮新增：英文 superlative 判据的中英混排覆盖。
 *
 * 背景（scripts/round-224/probe-r224-branch.js 实测坐实）：
 *   原 checkConfidenceCalibration 是 `if (hasChinese) {...} else {...}`
 *   二分支，「出现一个汉字 → 整段英文判据不跑」。实测 10 条样本：
 *   混排 6 条全 pass（0 命中），同批纯英文 4 条全 verify。
 *   中英混排是高频形态（技术文档、双语报告、引用外文结论的中文正文），
 *   该分支让英文侧判据在这类文本上 100% 失效。
 *
 *   同时补 judge 侧实测漏判的 `reliable`：纯英文
 *   "This is the most reliable approach." 同样 0 命中（不在词表里）。
 *
 * 本轮改动（commit 3f453b2a）：判据本体移到公共区，语义不变只改可见性；
 *   EN_SUP_ADJ 补 `reliable`。
 * 误伤实测（scripts/round-224/r224-guard-run.js）：97 基础 + 106 extended
 *   + 150 垂直 + 25 中英混排 = 326 良性条，误拦 25/326、召回 52/52，
 *   与改动前 diff 为空（逐字节一致）。
 *
 * 负例守卫：scripts/negative-test-confidence-superlative-en-mixed-r224.js
 */
const assert = require('assert');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

console.log('=== 英文 superlative 判据：中英混排不再整体跳过（第 224 轮）===\n');

// 正向组 1：混排 × most + 主观形容词（改动前 0 命中 / pass）
const mixedMost = [
  '他说这是 the most reliable 的方案。',
  '这是 the most comfortable 的选择，我们有数据支撑。',
  '报告里写 this is the most convenient 的工具，请核对。',
  '结论是 the most durable 的型号，见下表对比。',
];
// 样本池非空自检：防止样本被清空后 for 空转、测试假绿
ok('正向组 1 样本池非空（4 条，防空转）', () => {
  assert.strictEqual(mixedMost.length, 4, '样本数被改动 → 守卫已失效');
});
ok('混排 most+主观形容词 4/4 不再 pass', () => {
  for (const s of mixedMost) {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', `应非 pass: ${JSON.stringify(s.slice(0, 20))}`);
    const hit = (r.findings || []).some(f => f.dimension === 'confidence');
    assert.ok(hit, `应命中 confidence 维度`);
  }
});

// 正向组 2：混排 × -est 裸形容词
const mixedEst = [
  '这款是 the quietest 的洗衣机。',
  '我们认为 the safest 的做法是升级。',
  '文档称 the cheapest 的方案可用。',
];
ok('混排 -est 形容词 3/3 不再 pass', () => {
  for (const s of mixedEst) {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass');
    assert.ok((r.findings || []).some(f => f.dimension === 'confidence'));
  }
});

// 正向组 3：头部/尾部中文（判定只跟 hasChinese 有关，与位置无关）
const positionIndependent = [
  '这是 the most intuitive 的交互设计。',            // 头中文
  'the most intuitive 的交互设计，我们上线了。',      // 尾中文
  '团队认为 the most scalable 的架构更合适。',        // 中中文
];
ok('中文位置无关（头/中/尾出现汉字都仍走英文判据）', () => {
  for (const s of positionIndependent) {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass');
  }
});

// 正向组 4：本轮补的 reliable —— 纯英文与混排都要命中
ok('most reliable 在纯英文命中（reliable 补词回归）', () => {
  const en = checkOutput('This is the most reliable approach.');
  assert.notStrictEqual(en.gate.action, 'pass');
  assert.ok((en.findings || []).some(f => f.dimension === 'confidence'));
});
ok('most reliable 在混排命中', () => {
  const mx = checkOutput('他说这是 the most reliable approach。');
  assert.notStrictEqual(mx.gate.action, 'pass');
});

// 反向组：判据本体未被动过（v6.7.126 的三条边界仍在）
const exemptions = [
  'The best way to fix this is to restart the service.',
  'The best practice is to keep the config in version control.',
  'The safest approach would be to add a rollback plan.',
  'Please check the latest version of the release notes.',
  'We published the newest build last night.',
  'The earliest record dates back to 2019.',
];
ok('建议句式 + 时间/序列副词豁免 6/6 保持 pass', () => {
  for (const s of exemptions) {
    const r = checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', `不应被拦: ${JSON.stringify(s.slice(0, 30))}`);
  }
});

// 反向组：可验证形容词刻意不收（第 29 轮设计，不得回退）
ok('most accurate / most precise 仍不收（可验证形容词）', () => {
  for (const s of ['The most accurate result is 0.98.', 'This is the most precise measurement we have.']) {
    const r = checkOutput(s);
    if (r.gate.action !== 'pass') {
      // 允许被其它维度拦，但不能是 confidence 维度
      assert.ok(!(r.findings || []).some(f => f.dimension === 'confidence'),
        '可验证形容词不应进 superlative 判据');
    }
  }
});

// 反向组：中文 superlative 判据未受影响（本轮只动英文侧可见性）
ok('中文最+主观形容词仍命中（本轮未破坏中文侧）', () => {
  const r = checkOutput('这是最省心的方案，业界没有更好的。');
  assert.notStrictEqual(r.gate.action, 'pass');
});
ok('中文时间副词不被 superlative 判据命中（最新版本/最近数据）', () => {
  // 注意：「最近的数据显示用户增长了」会被 unsupported_claim /
  // appeal_to_authority 命中（「数据显示」是无来源引述），那是正确的
  // 其它维度行为。本条只锁 confidence 维度不得命中——
  // 即中文侧中性化确实生效，没有被英文判据或本轮改动带偏。
  for (const s of ['请查看最新的版本说明。', '最近的数据显示用户增长了。']) {
    const r = checkOutput(s);
    assert.ok(!(r.findings || []).some(f => f.dimension === 'confidence'),
      '中文时间副词不应命中 confidence 维度');
  }
  const clean = checkOutput('请查看最新的版本说明。');
  assert.strictEqual(clean.gate.action, 'pass');
});

console.log(`\n测试结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail ? 1 : 0);
