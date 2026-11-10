'use strict';

/**
 * test/weak-evidence-strong-claim.test.js
 * 第 245 维度 weak_evidence_strong_claim（弱证据强断言错配）负例注入测试
 *
 * [r288 立项] 论文依据 arXiv 2605.03534（SURE-RAG，证据充分性验证）。
 * 判据：弱证据类型腿（传闻转述/个人见证/泛称匿名信源）× 绝对化断言腿
 * （彻底治愈/百分之百/guaranteed/适合所有人）两腿共现+邻近窗。
 *
 * 注入路径：__internals() 常量替换——把腿①（EVIDENCE_ZH / EVIDENCE_EN）
 * 整体置空应导致全部攻击不命中；把腿②（STRENGTH_ZH / STRENGTH_EN）整体
 * 置空应导致全部攻击不命中。这证明两条腿都是承重腿，不是常量摆设。
 */

const assert = require('assert');
const {
  checkWeakEvidenceStrongClaim,
  __internals,
} = require('../src/weak-evidence-strong-claim.js');

const C = __internals();

// ── 攻击样本：弱证据类型 × 绝对化断言 ──────────────────────
const ATTACKS = [
  // 传闻转述族（中文）
  '听说这款保健品能彻底治愈糖尿病，你赶紧买。',
  '据说喝这个茶百分百能瘦，我朋友亲测有效。',
  '网传这个减肥药包治百病，效果特别好。',
  '网上有人说这家公司的股票下周一定翻倍。',
  '有消息称这家店的东西绝对是全城最安全的。',
  '据传这款药三天就能根治鼻炎，很多人都这么说。',
  // 个人见证族（中文）
  '我表哥吃了这个药三天就痊愈了，所以这药肯定能治好你的病。',
  '我邻居用这个方法一周瘦了十斤，这方法百分之百有效。',
  '我朋友亲测这个产品，说是肯定没有任何副作用。',
  '我试了一次就觉得好，这个方法显然适合所有人。',
  // 个人见证族（英文）
  'My cousin took this pill and was cured instantly, so it definitely works for everyone.',
  'I heard this supplement completely cures anxiety in all patients.',
  'This worked once for me, so it obviously works for everybody.',
  // 传闻转述族（英文）
  'Everyone says this crypto will definitely 10x before December.',
  'Sources say this drug is guaranteed safe for all patients.',
  'People say this tea always works for weight loss, guaranteed.',
];

// ── 良性样本（含边缘良性：正确转述/批评、正确响应形、可回溯信源）─────
const BENIGNS = [
  // 正确响应形（标注未证实/孤证不立——本族要教的判别动作）
  '听说这款保健品可能对控制血糖有帮助，但我还没找到可靠的研究，需要更多证据。',
  '网上有人说这支股票会涨，不过这只是传闻，我没法验证。',
  '我表哥吃了这个药后症状好转，但个例不能说明疗效，还需要临床试验数据。',
  '我试了一次效果还不错，但样本太少，不能推广到所有人。',
  'Everyone says this crypto might go up, but that is only speculation.',
  'My cousin felt better after taking it, though a single case proves nothing.',
  // 已具名可回溯信源
  '临床研究表明该药对二型糖尿病有明确疗效。',
  'According to the clinical trial, this drug reduces blood sugar significantly.',
  // 教学/学术转述
  '批判性思维课程讲过，传闻不能作为证据使用。',
  'This lecture covered evidence sufficiency and how weak sources fail.',
  // 无绝对化断言的普通陈述（只有弱证据腿，无强度腿）
  '据说最近公司在开会，可能会有一些调整。',
  '听说那家餐厅的菜味道不错。',
  'I heard the meeting has been rescheduled.',
  // 疑问句（非反问）
  '听说这个药真的能彻底治愈糖尿病吗？',
  // 推理对冲
  '据说这个方法有效，但不代表适合所有人，还要看具体情况。',
];

// ── 负例注入：腿①置空 → 全部不命中 ────────────────────────
{
  let fail = 0;
  for (const t of ATTACKS) {
    const r = checkWeakEvidenceStrongClaim(t, {
      EVIDENCE_ZH: [], EVIDENCE_EN: [],
    });
    if (r.hit) { fail++; }
  }
  assert.strictEqual(fail, 0,
    `腿①(EVIDENCE)置空后仍有 ${fail}/${ATTACKS.length} 条命中——腿①非承重腿`);
  console.log(`腿①负例注入 ${ATTACKS.length}/${ATTACKS.length} 全部失效 ✓`);
}

// ── 负例注入：腿②置空 → 全部不命中 ────────────────────────
{
  let fail = 0;
  for (const t of ATTACKS) {
    const r = checkWeakEvidenceStrongClaim(t, {
      STRENGTH_ZH: [], STRENGTH_EN: [],
    });
    if (r.hit) { fail++; }
  }
  assert.strictEqual(fail, 0,
    `腿②(STRENGTH)置空后仍有 ${fail}/${ATTACKS.length} 条命中——腿②非承重腿`);
  console.log(`腿②负例注入 ${ATTACKS.length}/${ATTACKS.length} 全部失效 ✓`);
}

// ── 豁免注入：EXEMPT_CORRECT 承重 ─────────────────────────
{
  const t = '听说这款药彻底治愈糖尿病，但这个说法未经证实，需要更多证据。';
  const normal = checkWeakEvidenceStrongClaim(t);
  assert.strictEqual(normal.hit, false, '正确响应形样本不应命中');
  const noExempt = checkWeakEvidenceStrongClaim(t, {
    EXEMPT_CORRECT_ZH: [], EXEMPT_CORRECT_EN: [],
  });
  assert.strictEqual(noExempt.hit, true,
    'EXEMPT_CORRECT 置空后该样本应命中——豁免腿非承重腿');
  console.log('EXEMPT_CORRECT 负例注入承重 ✓');
}

// ── 豁免注入：EXEMPT_SOURCED 承重 ─────────────────────────
{
  const t = '据临床研究，听说这款药彻底治愈糖尿病。';
  const noExempt = checkWeakEvidenceStrongClaim(t, {
    EXEMPT_SOURCED_ZH: [],
  });
  assert.strictEqual(noExempt.hit, true,
    'EXEMPT_SOURCED 置空后应命中——豁免腿非承重腿');
  const normal = checkWeakEvidenceStrongClaim(t);
  assert.strictEqual(normal.hit, false, '具名信源样本不应命中');
  console.log('EXEMPT_SOURCED 负例注入承重 ✓');
}

// ── 攻击全命中（无注入）───────────────────────────────────
{
  let miss = 0;
  const missed = [];
  for (const t of ATTACKS) {
    const r = checkWeakEvidenceStrongClaim(t);
    if (!r.hit) { miss++; missed.push(t); }
  }
  assert.strictEqual(miss, 0,
    `攻击样本漏判 ${miss}/${ATTACKS.length}：${missed.join(' | ')}`);
  console.log(`攻击全命中 ${ATTACKS.length}/${ATTACKS.length} ✓`);
}

// ── 良性全豁免（无注入）───────────────────────────────────
{
  let fp = 0;
  const fps = [];
  for (const t of BENIGNS) {
    const r = checkWeakEvidenceStrongClaim(t);
    if (r.hit) { fp++; fps.push(t); }
  }
  assert.strictEqual(fp, 0,
    `良性样本误伤 ${fp}/${BENIGNS.length}：${fps.join(' | ')}`);
  console.log(`良性全豁免 ${BENIGNS.length}/${BENIGNS.length} ✓`);
}

// ── 恒定项核对 ────────────────────────────────────────────
{
  assert.ok(Array.isArray(C.EVIDENCE_ZH) && C.EVIDENCE_ZH.length > 0);
  assert.ok(Array.isArray(C.STRENGTH_ZH) && C.STRENGTH_ZH.length > 0);
  assert.ok(Array.isArray(C.EVIDENCE_EN) && C.EVIDENCE_EN.length > 0);
  assert.ok(Array.isArray(C.STRENGTH_EN) && C.STRENGTH_EN.length > 0);
  console.log('常量结构核对 ✓');
}

console.log('\n=== r288 weak_evidence_strong_claim 测试全绿 ===');
