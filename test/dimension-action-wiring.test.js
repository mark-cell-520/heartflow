/**
 * 测试："登记齐全"不等于"参与判定"（v6.7.92，第 68 轮）
 *
 * 发现的经过：npm 复验 v6.7.91 时，`You wont believe what happened next`
 * 返回 pass。本地查 checkClickbait 有 count=2，dimensions.clickbait 有值，
 * summary 有"2 处点击诱饵"，VERIFY_DIMS 里也有 clickbait——四处全对，
 * 但 gate 是 pass。
 *
 * 根因：findings 由 `allDims` 驱动（阈值 score ≥ 0.15），而 allDims 里
 * **没有 clickbait**。所以它永远进不了 findings，gate 永远看不到。
 *
 * 这是第 50/51 轮"已算但不登记"家族的第 4 个实例：
 *   第 50 轮  checkIndirectInjection 算过但没进 dimensions/summary
 *   第 53 轮  同一问题的多次复发（含自引入 ReferenceError）
 *   第 68 轮  进 dimensions+summary+VERIFY_DIMS，但没进 allDims
 *
 * ⚠️ dimension-registry-guard 抓不到这类：它只查"函数是否登记进
 * dimensions/summary"，**不查"登记是否会影响 gate"**。所以这里补
 * 一个 gate 层回归：凡在 VERIFY_DIMS/REWRITE_DIMS/BLOCK_DIMS 里的维度，
 * 必须能用"一个只触发它的样本"把 gate 推出 pass。
 */
const assert = require('assert');
const idx = require('../src/index.js');
const gate = require('../src/gate.js');

// 每个维度配一个"只触发它"的样本（反复校准过，确认 count>0）
const ACTIONABLE_TARGETS = [
  ['clickbait', 'You wont believe what happened next'],
  ['sycophancy', '您说得完全对，您太聪明了'],
  ['soft_deflection', '我可能错了，但数据显示你是错的'],
  ['pseudo_profundity', '成功不是因为努力，而是因为你还没领悟存在的本质'],
  ['false_urgency', '仅限今天！错过再无机会'],
  ['absolute_claim', '这绝对是史上最强的方案'],
];

module.exports = function ({ test }) {
  console.log('\n[可行动维度必须真正影响 gate]');

  for (const [dim, text] of ACTIONABLE_TARGETS) {
    test(`${dim} 命中后 gate 必须不是 pass`, () => {
      const d = idx.discriminate(text);
      const dimState = d.dimensions && (d.dimensions[dim] ?? d.dimensions[toCamel(dim)]);
      const fires =
        dimState &&
        (dimState.count > 0 || dimState.totalHits > 0 || dimState.score >= 0.15);
      assert.ok(
        fires,
        `维度本身未命中：${dim} — ${text.slice(0, 30)}`
      );
      assert.notStrictEqual(
        d.gate.action,
        'pass',
        `维度 ${dim} 命中了（${JSON.stringify(dimState).slice(0, 60)}），` +
          `但 gate 仍是 pass——即它登记了却不参与判定`
      );
    });
  }

  // 反向：一条纯良性技术句必须 pass（防止为接通 clickbait 而放宽整体）
  test('良性技术复盘不受 clickbait 接线影响', () => {
    const a = gate.gate('We applied the patch. Latency dropped 40% after the change.').gate.action;
    assert.strictEqual(a, 'pass', `良性技术句被误判：${a}`);
  });
};

function toCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
