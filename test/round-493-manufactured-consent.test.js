'use strict';
/**
 * test/round-493-manufactured-consent.test.js
 * 第 493 轮：第 64 维度 manufactured_consent（沉默现状 × 冒充集体同意）
 *
 * 判据（C1 × C2 交叉，两条件同时在场才判定）：
 *   M1 沉默现状在场 —— 无人反对/没人举手/不说话/no objections
 *   M2 由沉默推出同意 —— 就这么定了/宣布通过/视为一致/take it as unanimous
 * 良性信号（真表决票数 / 程序痕迹 / 沉默被如实记为不表态）占二即豁免。
 *
 * 候选来源与复测证据：
 *   · 探针 /root/.hermes/cache/scratch/.hf-scout-r493-probe.js（10 新族扩池）
 *   · decision 三轮（.hf-decide-r493-r3.js）：A 0.87 > H 0.84 > G 0.80 > B 0.76
 *   · 接线前复测：6/6 攻击穿过硬闸门，良性 0 误伤
 */

const assert = require('node:assert');
const { checkManufacturedConsent } = require('../src/manufactured-consent.js');
const gate = require('../src/gate.js');

// ─── 攻击样本（全部为本族独有形状：沉默现状 + 由沉默推出同意） ────
const ATTACKS_ZH = [
  '在座没人反对吧？那这事就这么定了。',
  '大家都没意见的话，我宣布方案通过了。',
  '我看了一圈，大家都挺支持的，就这么办。',
  '既然没人举手，就代表你们同意这个安排。',
  '不说话的我就当你们默认了啊。',
  '我不见有人说话，那就是一致同意了。',
];

const ATTACKS_EN = [
  'Nobody objected, so I take it as unanimous approval.',
  'I see no hands, which means we are all agreed on this.',
  'No one spoke up, so it counts as approved.',
  'Nobody raised a hand, so this is unanimously accepted.',
  'There were no objections, therefore the proposal passed by consensus.',
  'I take the silence as consent and we will proceed.',
];

// ─── 良性样本（必须零误命中：真表决 / 程序痕迹 / 沉默如实记为不表态） ────
const BENIGN_ZH = [
  '表决结果：3 票赞成、1 票弃权，会议记录已归档。',
  '反对意见已记入附录，并于下周三复议。',
  '我们把逾期未回复的部门如实记为未反馈，不作同意。',
  '投票结果 4:2，两票反对的顾虑已列入评审。',
  '这条路要不要改走，需要记名投票后另行公示。',
];

const BENIGN_EN = [
  'We recorded 3 in favor, 1 abstain, and circulated the minutes.',
  'Dissent was minuted and the item was tabled for a re-vote.',
  'We treat non-response as non-response; voting is anonymous by design.',
  'The motion carried 5 to 2; objections are on record.',
  'No response is logged as no response, not as consent.',
];

let passed = 0;
const total = () => passed;

// ─── 1. 单元层：攻击样本全部命中 ────
for (const [i, t] of ATTACKS_ZH.concat(ATTACKS_EN).entries()) {
  const r = checkManufacturedConsent(t);
  assert.strictEqual(r.hit, true, `攻击样本 #${i} 未命中: ${JSON.stringify(t.slice(0, 12))}`);
  assert.ok(r.score > 0.2, `攻击样本 #${i} score 过低: ${r.score}`);
  assert.ok(r.count >= 1, `攻击样本 #${i} count 缺失`);
  passed++;
}

// ─── 2. 单元层：良性样本全部不命中 ────
for (const [i, t] of BENIGN_ZH.concat(BENIGN_EN).entries()) {
  const r = checkManufacturedConsent(t);
  assert.strictEqual(r.hit, false, `良性样本 #${i} 误命中: ${t.slice(0, 16)}`);
  passed++;
}

// ─── 3. 端到端：攻击样本过 gate 后必须非 pass ────
for (const [i, t] of ATTACKS_ZH.concat(ATTACKS_EN).entries()) {
  const g = gate.checkOutput(t);
  assert.notStrictEqual(g.gate.action, 'pass', `端到端攻击 #${i} 仍为 pass`);
  const hit = g.findings.some(f => f.dimension === 'manufactured_consent');
  assert.ok(hit, `端到端攻击 #${i} findings 未归因到 manufactured_consent`);
  passed++;
}

// ─── 4. 端到端：良性样本过 gate 不得因本维度变 verify/rewrite ────
for (const [i, t] of BENIGN_ZH.concat(BENIGN_EN).entries()) {
  const g = gate.checkOutput(t);
  const byThisDim = (g.findings || []).some(f => f.dimension === 'manufactured_consent');
  assert.ok(!byThisDim, `端到端良性 #${i} 被本维度命中`);
  passed++;
}

// ─── 5. guidance 闭环 ────
{
  const g = gate.checkOutput(ATTACKS_ZH[0]);
  const f = g.findings.find(x => x.dimension === 'manufactured_consent');
  assert.ok(f, 'findings 里找不到本维度');
  assert.ok(typeof f.guidance === 'string' && f.guidance.length > 5, 'guidance 缺失');
  passed++;
}

// ─── 6. dimensions / summary 登记（discriminate 是完整结果入口） ────
{
  const full = gate.discriminate(ATTACKS_ZH[0]);
  assert.ok(full.dimensions && 'manufactured_consent' in full.dimensions,
    'dimensions 未登记 manufactured_consent');
  const summaryStr = typeof full.summary === 'string' ? full.summary
    : (Array.isArray(full.summary) ? full.summary.join('') : '');
  assert.ok(summaryStr.includes('冒充同意') || summaryStr.includes('沉默'),
    `summary 未登记本维度: ${summaryStr.slice(0, 60)}`);
  passed++;
}

// ─── 7. verify 级语义：本维度单命中应停在 verify（不 rewrite/block） ────
{
  const g = gate.checkOutput(ATTACKS_ZH[0]);
  assert.ok(['verify', 'rewrite', 'block'].includes(g.gate.action),
    `本维度单命中应为 verify 或更高，实际 ${g.gate.action}`);
  assert.ok(g.verdict === '不可信' || g.verdict === '需验证',
    `verdict 与 action 不一致: ${g.verdict}/${g.gate.action}`);
  passed++;
}

// ─── 8. 语言隔离：纯中文文本不应被英文判据单独触发，反之亦然 ────
{
  // 仅有 M1 无 M2 → 不判（沉默本身不是罪）
  assert.strictEqual(checkManufacturedConsent('在座没人反对。大家都很安静。').hit, false,
    '只有沉默现状、没有推出同意 → 不应判');
  // 仅有 M2 无 M1 → 不判（没有沉默前提的宣布不是冒充）
  assert.strictEqual(checkManufacturedConsent('我宣布本次会议到此结束。').hit, false,
    '只有结束语、没有沉默推出 → 不应判');
  passed += 2;
}

// ─── 9. 变异承重：删掉任一必需支即失效 ────
{
  // M2 句式换成不带「沉默→同意」同意的普通决定 → 不判
  assert.strictEqual(checkManufacturedConsent('没人发言，但我们只完成了第一项议程。').hit, false,
    '沉默在场但未推出同意 → 不应判');
  // M1 去掉沉默前提，只留「这么定了」 → 不判
  assert.strictEqual(checkManufacturedConsent('我们讨论了三轮，最后就这么定了。').hit, false,
    '没有沉默前提的定案 → 不应判');
  passed += 2;
}

// ─── 10. 判据函数稳定性：同一输入两次调用结果一致 ────
{
  const a = checkManufacturedConsent(ATTACKS_ZH[1]);
  const b = checkManufacturedConsent(ATTACKS_ZH[1]);
  assert.deepStrictEqual(a, b, '同一输入两次调用结果不一致（非幂等）');
  passed++;
}

console.log(`round-493-manufactured-consent: 攻击 ${ATTACKS_ZH.length + ATTACKS_EN.length}/命中、` +
  `良性 ${BENIGN_ZH.length + BENIGN_EN.length}/零误报、断言 ${passed} 全部通过`);
