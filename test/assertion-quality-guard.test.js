/**
 * 测试：断言口径守卫（v6.7.76，心虫 decision.decide 0.89）
 *
 * 来源：第 38 轮发现 v6.7.74 的 bug 带着绿灯上线，因为测试断言查的是
 * "不含 not a function" 而不是"功能真的对"。本轮心虫选「断言口径审计」。
 *
 * 一、审计结果（数字要打折，这次也不例外）
 *
 *   第一版扫描器报 **42 处弱断言**。逐一审完：
 *     8 处 B_neg_error → 8 处**全部有正向断言配对**（合理回归防线）
 *     15 处 E_isArray → 14 处同一表达式里有 .length 检查（我的正则只抓前半段）
 *     10 处 C_typeof_fn → 7 处在导出面检查文件（测试目的就是查存在）
 *   修正扫描器（排除这三类误报）后：42 → 30 → 21。
 *
 *   **真正危险的只有 1 处**：
 *     test/hard-gate-all-entries.test.js:88
 *     assert.notStrictEqual(r.gate.action, 'block')
 *   → 良性输入被判 rewrite/verify 也算过（但良性被判 rewrite 同样是误拦）
 *   → 已改为 assert.strictEqual(r.gate.action, 'pass')
 *
 * 二、教训（这是本轮真正的产出）
 *
 *   扫描器报的缺口数和之前的诊断工具一样偏大。但**扫描的价值不在数字，
 *   在它提供了 42 个必须逐一审查的候选**——真正危险的那一处混在里面，
 *   不扫就发现不了。
 *
 *   已修的 5 处 D_bare_truthy（assert.ok(r, 'think() 应返回...')）
 *   后面都有强断言，本身不是漏洞；但加上 `&& typeof r === 'object'`
 *   让"防 null 崩溃"这个意图明确，否则 r 为 0/'' 时也算过。
 *
 * 三、本测试守什么
 *   良性输入的断言必须是 pass，不能是"不是 block"
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[已知危险断言模式不得回归]');

const SCAN_TARGETS = [
  'test/hard-gate-all-entries.test.js',
  'test/dispatch-route-integrity.test.js',
  'test/param-normalization-layers.test.js',
  'test/mcp-auth-tier.test.js',
  'test/mcp-robustness.test.js',
];

t('良性输入相关测试不用 notStrictEqual(action, \'block\')', () => {
  const bad = [];
  for (const f of SCAN_TARGETS) {
    const p = path.join(HF, f);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    // 良性场景用"!= block"兜底 = 弱断言
    if (/assert\.notStrictEqual\([^)]*gate\.action[^)]*,\s*['"]block['"]/.test(src)) {
      bad.push(f);
    }
  }
  assert.strictEqual(bad.length, 0,
    `弱断言回归: ${bad.join(', ')}。良性输入必须断言 action === 'pass'，` +
    `"不是 block" 会让 rewrite/verify 误拦也算过。`);
});

t('decision 相关测试断言"选出了东西"而非"没报错"', () => {
  const bad = [];
  for (const f of ['test/dispatch-route-integrity.test.js', 'test/param-normalization-layers.test.js']) {
    const p = path.join(HF, f);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    // 检查是否有正向选择断言（不是只查不含某错误）
    const hasPositive = /picked|label|chosen/.test(src);
    if (!hasPositive) bad.push(f);
  }
  assert.strictEqual(bad.length, 0,
    `缺正向选择断言: ${bad.join(', ')}`);
});

console.log('\n[扫描器自身口径已收敛]');

t('assertion-quality-scan.js 排除了三类已知误报', () => {
  const p = path.join(HF, 'scripts/assertion-quality-scan.js');
  const src = fs.readFileSync(p, 'utf8');
  // B_neg_error 必须有"同函数体有正向断言就排除"的逻辑
  assert.ok(/STRONG_RE/.test(src), '缺正向断言配对排除逻辑');
  // E_isArray 必须有 .length 检查排除
  assert.ok(/\.length\\s\*\[><=\]\=\?/.test(src), '缺 .length 检查排除逻辑');
  // 导出面文件必须排除
  assert.ok(/EXCLUDE_FILES/.test(src), '缺导出面文件排除逻辑');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
