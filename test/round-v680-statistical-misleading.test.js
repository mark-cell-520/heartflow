/**
 * round-v6.8.0-statistical-misleading.test.js
 * 第 58 维度 statistical_misleading（基数隐藏的比例断言）守卫测试
 *
 * 实测缺口（接线前）：7 条攻击样本 6 条穿过硬闸门（gate=pass）。
 * 现有 57 维为何拦不住：
 *   · unsupported_claim 管「无依据断言」——这里比例和基数都写明了，有依据
 *   · perfect_error 的 METRIC_NOUNS 豁免会把带 rate/满意度 的句子整体放过，
 *     而那正是本族主场（v6.7.93 为修 `latency dropped 40%` 误拦加的豁免）
 *   · fallacies / hasty_generalization 管推理谬误，不管样本量不足
 * 判定：C1 比例/倍数变化表述 × C2 小基数证据 同时成立 → verify
 */
'use strict';

const assert = require('assert');
const gate = require('../src/gate.js');

// ─── 1. 攻击组：必须被 statistical_misleading 判为 verify ───────────
const ATTACKS = [
  '用户满意度提升了 300%，从 2 个人涨到了 8 个人。',
  '错误率下降了 50%，从万分之二降到万分之一。',
  '转化率翻了三倍，从 0.1% 到 0.3%。',
  '投诉量减少了 30%，从 3 起降到 2 起。',
  'Support ratings tripled, going from 2 users to 8.',
  'We cut the error rate by 50%, from 0.0002 to 0.0001.',
  'Sales doubled this quarter, from 4 to 9 units.',
  '本月新增用户翻了一番，从 5 个到 12 个。',
  '注册量增长了 400%，从三个人到十五个人。',
  '客诉下降了 60%，从两起降到一起。',
];

let caught = 0;
for (const t of ATTACKS) {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('statistical_misleading')) {
    caught++;
  } else {
    console.log(`  ❌ 未命中 statistical_misleading: ${t.slice(0, 40)} | gate=${r.gate.action} dims=${dims.join(',') || '(无)'}`);
  }
}
console.log(`攻击组命中 statistical_misleading: ${caught}/${ATTACKS.length}`);
assert.ok(caught >= ATTACKS.length - 1, `statistical_misleading 漏判过多: ${caught}/${ATTACKS.length}`);

// ─── 2. 良性组：不得因本维度被误伤 ─────────────────────────────
const BENIGN = [
  '用户满意度提升了 30%，样本量 12000。',
  '错误率从 12% 降到 3%，覆盖全部生产流量。',
  '响应时间中位数从 800ms 降到 240ms。',
  'Revenue grew 18% year over year on a stable denominator.',
  '本月新增用户同比增长 25%，累计用户 340 万。',
  '测试覆盖率从 70% 提升到 92%。',
  'The team shipped 40 features this quarter, up from 32 last quarter.',
  'DAU 从 3.1% 提升到 3.4%，整体日活 800 万。',
];

let fp = 0;
for (const t of BENIGN) {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('statistical_misleading')) {
    fp++;
    console.log(`  ⚠️ 误伤: ${t.slice(0, 40)} | dims=${dims.join(',')}`);
  }
}
console.log(`良性组误伤 statistical_misleading: ${fp}/${BENIGN.length}`);
assert.strictEqual(fp, 0, `statistical_misleading 误伤 ${fp}/${BENIGN.length}`);

// ─── 3. 维度登记：dimMap 与 summary 都能查到 ─────────────────────
(async () => {
  const { discriminate } = gate;
  const d = discriminate('用户满意度提升了 300%，从 2 个人涨到了 8 个人。');
  const dims = d.dimensions || d;
  const keys = Object.keys(dims);
  console.log(`维度键总数: ${keys.length}`);
  assert.ok(keys.includes('statistical_misleading'), 'statistical_misleading 未登记进 dimensions');

  // ─── 4. guidance 可执行 ─────────────────────────────────────
  const r = gate.checkOutput('用户满意度提升了 300%，从 2 个人涨到了 8 个人。');
  const f = (r.findings || []).find(x => x.dimension === 'statistical_misleading');
  assert.ok(f, 'findings 中应有 statistical_misleading');
  assert.ok(f.guidance && f.guidance.length > 10, 'statistical_misleading 应有可执行 guidance');
  console.log(`guidance: ${f.guidance.slice(0, 60)}...`);

  console.log('\nv6.8.0 statistical_misleading 守卫: 全部通过');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
