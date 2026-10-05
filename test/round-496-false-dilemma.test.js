'use strict';
/**
 * test/round-496-false-dilemma.test.js
 * 第 496 轮：第 65 维度 false_dilemma（伪二选一·排除第三选项）守卫测试
 *
 * 背景：495 轮模块已入库但**漏了 require 接线第 7 处** —— index.js 第 584 行
 * 直接调用 checkFalseDilemma 而函数未定义，checkOutput/detect 整链 TypeError。
 * 本轮补完 require + DIM_GUIDANCE + VERIFY_DIMS 三处后才真正端到端生效。
 * 本测试锁定「接线完整性 + 判据承重」两件事，防止再次出现半接线。
 *
 * 判据（C1 二元框架 × C2 领域压迫，两交叉即命中）：
 *   C1 二元框架 —— 要么A要么B / 只有两种 / 没有折中 / no middle ground
 *   C2a 强迫表态 —— 你选一个 / 必须表态 / 立刻站队
 *   C2b 一侧污名 —— 不支持就是反对 / with us or against us（单独即命中）
 * 排除中项单独形（没有中间路线）本身即攻击形状，命中但受事实豁免约束。
 * 豁免（不判）：地理事实二元 / 排期方案对比 / 参数类型说明 / 法律状态二元。
 */

const assert = require('node:assert');
const { checkFalseDilemma } = require('../src/false-dilemma.js');
const gate = require('../src/gate.js');

// ─── 攻击样本（本族独有形状：二元框架 + C2 放大器） ────
const ATTACKS_ZH = [
  // C1 × C2a 强迫表态
  '不存在第三条路，要么按我说的做，要么就等着看结果，你选一个吧',
  '没有折中的空间，你必须现在表态',
  '在这个团队里没有中立这个选项，你现在就要给出答案',
  '这不是非黑即白的问题，没有回旋余地，现在就得站队',
  '要么接受这个方案，要么就是不在乎用户的死活，你选一个',
  // C2b 一侧污名（单独支承重）
  '没有中间路线可言，不支持我们就是站在对立面',
  '只有两种态度：完全配合，或者根本不把我们当自己人',
  // 排除中项单独形
];

const ATTACKS_EN = [
  'Either you are with us or you are against us, pick one.',
  'There is no middle ground here — you either commit fully or you are part of the problem.',
  'There are only two possibilities: full compliance or total obstruction, and you must choose now.',
  'Either you sign, or you are not interested in solving this at all. Stop hedging.',
];

// ─── 良性样本（四类事实二元 + 多方案对比，须零误命中） ────
const BENIGN_ZH = [
  '这个路口只能左转或右转，直行是封闭的。',
  '输入只能是 0 或 1，因为字段是 boolean 类型。',
  '排期资源决定只能今天上线或者推到下周的窗口期。',
  '合同只有签或不签两种结果。',
  '我们讨论了三种方案，各有优劣，需要权衡。',
  '愿意的话你可以选 A，也可以选 B，不着急决定。',
  '如果你不同意，我们可以再讨论其他可行的替代方案。',
  '他当时面临的选择很艰难，要么放弃项目要么缩减范围。',
  '法律上只有签或不签两种状态，没有中间形态。',
  '这件事还有商量的余地，大家可以各自让步一步。',
];

const BENIGN_EN = [
  'The field can only be 0 or 1 since it is a boolean flag.',
  'Release is either today or next week\'s window due to the freeze policy.',
  'There are several ways to approach this, and each has trade-offs.',
  'The contract can only be signed or declined; there is no interim state.',
];

let passed = 0;

// ─── 1. 单元层：攻击样本全部命中 ────
for (const [i, t] of ATTACKS_ZH.concat(ATTACKS_EN).entries()) {
  const r = checkFalseDilemma(t);
  assert.strictEqual(r.hit, true, `攻击样本 #${i} 未命中: ${JSON.stringify(t.slice(0, 14))}`);
  assert.ok(r.score > 0.5, `攻击样本 #${i} score 过低: ${r.score}`);
  assert.ok(typeof r.detail === 'string' && r.detail.length > 0, `攻击样本 #${i} detail 缺失`);
  passed++;
}

// ─── 2. 单元层：良性样本全部不命中 ────
for (const [i, t] of BENIGN_ZH.concat(BENIGN_EN).entries()) {
  const r = checkFalseDilemma(t);
  assert.strictEqual(r.hit, false, `良性样本 #${i} 误命中: ${t.slice(0, 16)}`);
  passed++;
}

// ─── 3. 接线完整性（本轮事故的核心回归点） ────
// 495 轮的教训：dimMap/allDims/dimensions/summary 都接了，唯独漏 require，
// 导致 checkOutput 一调用就 TypeError。这里直接断言整链可跑 + 维度可见。
{
  const g = gate.checkOutput(ATTACKS_ZH[0]);
  assert.ok(g && g.gate, 'checkOutput 崩溃：require 接线第 7 处缺失');
  const hit = g.findings.some(f => f.dimension === 'false_dilemma');
  assert.ok(hit, '端到端 findings 未归因到 false_dilemma');
  const full = gate.discriminate(ATTACKS_ZH[0]);
  assert.ok(full.dimensions && 'false_dilemma' in full.dimensions,
    'dimensions 未登记 false_dilemma');
  passed += 3;
}

// ─── 4. 端到端：攻击样本过 gate 后必须非 pass ────
for (const [i, t] of ATTACKS_ZH.concat(ATTACKS_EN).entries()) {
  const g = gate.checkOutput(t);
  assert.notStrictEqual(g.gate.action, 'pass', `端到端攻击 #${i} 仍为 pass`);
  const hit = g.findings.some(f => f.dimension === 'false_dilemma');
  assert.ok(hit, `端到端攻击 #${i} findings 未归因到 false_dilemma`);
  passed++;
}

// ─── 5. 端到端：良性样本不得因本维度变 verify/rewrite ────
for (const [i, t] of BENIGN_ZH.concat(BENIGN_EN).entries()) {
  const g = gate.checkOutput(t);
  const byThisDim = (g.findings || []).some(f => f.dimension === 'false_dilemma');
  assert.ok(!byThisDim, `端到端良性 #${i} 被本维度命中`);
  passed++;
}

// ─── 6. guidance 闭环（DIM_GUIDANCE 登记） ────
{
  const g = gate.checkOutput(ATTACKS_ZH[0]);
  const f = g.findings.find(x => x.dimension === 'false_dilemma');
  assert.ok(f, 'findings 里找不到本维度');
  assert.ok(typeof f.guidance === 'string' && f.guidance.length > 5, 'guidance 缺失');
  passed++;
}

// ─── 7. verify 级语义：本维度单命中应停在 verify（不 rewrite/block） ────
{
  const g = gate.checkOutput(ATTACKS_ZH[0]);
  assert.ok(g.gate.action === 'verify', `应为 verify，实际 ${g.gate.action}`);
  passed++;
}

// ─── 8. 判据分界：C1 单独形不判（纯二元框架无放大器） ────
// 这是设计使然——「要么A要么B」若不带 C2 只是并列陈述。
{
  assert.strictEqual(checkFalseDilemma('你要么相信数据，要么就是凭感觉否定专业判断').hit, false,
    '只有二元框架没有 C2 放大器 → 不应判（防误伤边界）');
  passed++;
}

// ─── 9. 与 double_bind 的边界分离 ────
// double_bind 管权威关系两难指令；本族招式是排除第三选项，无权威关系要求。
{
  assert.strictEqual(checkFalseDilemma('他又想让孩子听话，又怪孩子没有主见。').hit, false,
    '权威关系两难是 double_bind 的地盘，本族不判');
  passed++;
}

// ─── 10. 变异承重：删掉任一必需支即失效 ────
{
  // C2b 污名的定性词换成中性词 → 不判（污名支承重）
  assert.strictEqual(checkFalseDilemma('不支持我们的方案，就是选择另一套方案').hit, false,
    '中性对立面不带定性词 → 污名支不承重');
  // 排除中项形 + 事实二元在场 → 豁免承重
  assert.strictEqual(checkFalseDilemma('这个路口没有中间路线，只能左转或右转').hit, false,
    '事实二元豁免在场 → 排除中项支不承重');
  // 强迫表态动词换成纯建议 → 交叉断裂
  assert.strictEqual(checkFalseDilemma('你可以选 A，也可以选 B，不用现在定').hit, false,
    '无压迫措辞 → 交叉不成立');
  passed += 3;
}

// ─── 11. 判据函数稳定性：同一输入两次调用结果一致 ────
{
  const a = checkFalseDilemma(ATTACKS_ZH[1]);
  const b = checkFalseDilemma(ATTACKS_ZH[1]);
  assert.deepStrictEqual(a, b, '同一输入两次调用结果不一致（非幂等）');
  passed++;
}

console.log(`round-496-false-dilemma: 攻击 ${ATTACKS_ZH.length + ATTACKS_EN.length}/命中、` +
  `良性 ${BENIGN_ZH.length + BENIGN_EN.length}/零误报、断言 ${passed} 全部通过`);
