/**
 * round-477-statistical-misleading-fold-bare.test.js
 * 第 58 维 statistical_misleading 新句式族守卫（v6.8.0 落地缺口修复）
 *
 * 上一轮（r476）发现：v6.8.0 上线的第 58 维只覆盖「提升 N% / N 倍 + 带单位小基数」，
 * 三个整句式族零覆盖，攻击样本直穿硬闸门。本轮补上：
 *
 *   族1 汉字数字倍数 × 从X到Y：「翻了三倍，从 2 个涨到 6 个」
 *       根因：C1_FOLD_ZH 的 翻[了着过]?[倍番] 只吃「翻了一番/翻了倍」，
 *       「三倍/两倍/3倍」落在字符类外。
 *
 *   族2 动词+到/至+数字：「从 5 个涨到 30 个」「降到 2 起」
 *       根因：C1_FROMTO_ZH 动词后直接要求数字，「涨到」的「到」把失配扩大。
 *
 *   族3 英文无单位小整数对照（tripled/doubled from 2 to 6）：
 *       根因：C2 的 SMALL_ABS_EN/EN_TO 强制要求单位词（users/units/orders…），
 *       裸 `from 4 to 9` 没有任何一支能命中。
 *
 * 设计边界：族3 的裸数字对照只在 C1 已确认是比例/倍数句（from X to Y 结构）时生效，
 * 避免把「从第2章到第6章」这类非比例的裸对照判成统计误导。
 */
'use strict';

const assert = require('assert');
const gate = require('../src/gate.js');

// ─── 1. 攻击组：三个新族必须全部命中 statistical_misleading ──────────
const ATTACKS = [
  // 族1：汉字数字倍数
  '转化率翻了三倍，从 2 个涨到 6 个。',
  '客单价翻了两倍多，从 3 单到 9 单。',
  '本期订单翻了 3 倍，从 4 单到 16 单。',
  '满意度翻了五倍，从 2 个人到 12 个人。',
  // 族2：动词+到/至+数字
  '本月注册用户从 5 个涨到 30 个。',
  '投诉量从 3 起降到 2 起。',
  '退款从 8 次减到 3 次。',
  // 族3：英文无单位小整数对照
  'Conversion tripled, from 2 to 6.',
  'Revenue doubled, from 4 to 9.',
  'Signups went from 3 to 21 this week.',
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
assert.strictEqual(caught, ATTACKS.length, `新族漏判: ${caught}/${ATTACKS.length}`);

// ─── 2. 良性组：大基数/非比例不得因新族误伤 ─────────────────────────
const BENIGN = [
  '用户数从 3 万涨到 6 万，翻了一倍。',
  '服务节点从 200 台扩充到 400 台，翻了一倍。',
  '错误率从 12% 降到 3%，覆盖全部生产流量。',
  'Revenue grew from 20000 to 40000.',
  '用户满意度提升了 30%，样本量 12000。',
  '测试覆盖率从 70% 提升到 92%。',
  'DAU 从 3.1% 提升到 3.4%，整体日活 800 万。',
  'The team shipped 40 features this quarter, up from 32 last quarter.',
  '本季度营收同比增长 25%，累计用户 340 万。',
  '响应时间中位数从 800ms 降到 240ms。',
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
assert.strictEqual(fp, 0, `新族误伤 ${fp}/${BENIGN.length}`);

// ─── 3. gate 语义：命中必须落到 verify（而非 pass）───────────────────
const r1 = gate.checkOutput('转化率翻了三倍，从 2 个涨到 6 个。');
assert.notStrictEqual(r1.gate.action, 'pass', '族1 攻击不应 pass');
console.log(`族1 gate.action = ${r1.gate.action}`);

const r3 = gate.checkOutput('Conversion tripled, from 2 to 6.');
assert.notStrictEqual(r3.gate.action, 'pass', '族3 攻击不应 pass');
console.log(`族3 gate.action = ${r3.gate.action}`);

// ─── 4. guidance 可执行 ────────────────────────────────────────────
const f = (r1.findings || []).find(x => x.dimension === 'statistical_misleading');
assert.ok(f, 'findings 中应有 statistical_misleading');
assert.ok(f.guidance && f.guidance.length > 10, '应有可执行 guidance');
console.log(`guidance: ${f.guidance.slice(0, 50)}...`);

console.log('\nround-477 statistical_misleading 新族守卫: 全部通过');
