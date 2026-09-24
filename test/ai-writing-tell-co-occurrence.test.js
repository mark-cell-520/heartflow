/**
 * ai-writing-tell-co-occurrence.test.js — 第 36 轮共现门槛验证
 *
 * 背景（实测，2026-09-25）：ai_writing_tell 把正常学术/商业高频词当 AI 痕迹，
 * 16 条正常文本 7 条被误记（robust 0.18 / comprehensive 0.18 / holistic 0.18 /
 * significant 0.07 / in summary·furthermore·in conclusion 0.10）。
 * 而真 AI 文本的族数是 4/3/6/5 —— 分界线就在「多族共现」。
 *
 * 修法：单族命中 score 归零（findings 保留可观测），>=2 族才计分。
 *
 * 本测试锁三件事：
 *   ① 良性侧：单族正常学术文本 score 必须为 0（误伤清零）
 *   ② 攻击侧：真 AI 文本 score 不能塌（共现样本必须仍检出）
 *   ③ 契约侧：findings / count / topSeverity / familiesHit 字段语义不破
 */

const path = require('path');
const HF_DIR = path.join(__dirname, '..');

module.exports = function ({ test, assertTrue, assertEqual, assertDefined }) {
  const { detect } = require(path.join(HF_DIR, 'src/shield/ai-writing-tell.js'));

  // ── ① 良性侧：单族命中的正常学术/商业文本 ──────────────────────
  const BENIGN_SINGLE = [
    ['tier1',        'The company reported robust growth last quarter.'],
    ['tier1',        'This is a comprehensive review of the literature.'],
    ['tier1',        'We adopted a holistic approach to the problem.'],
    ['tier1',        'We need a robust framework to build on.'],
    ['tier3',        'As shown in Table 2, the coefficient is significant at the 1% level.'],
    ['tier3',        'Figure 3 shows that the effect is significant.'],
    ['transitions',  'In summary, this paper makes three contributions.'],
    ['transitions',  'Furthermore, we observe a consistent pattern in the data.'],
    ['transitions',  'In conclusion, remote work has a modest positive effect.'],
    ['transitions',  'It is worth noting that the results hold across all settings.'],
    ['mixed-zh',     '本文采用了系统性的方法，综合考虑了多方面因素。'],
    ['mixed-zh',     '结果表明，该方法能有效提升效率。'],
    ['mixed-zh',     '综上所述，本文的主要结论如下。'],
    ['clean',        'This article explores the impact of remote work on productivity.'],
    ['clean',        'The following section describes the experiment setup in detail.'],
    ['clean',        '接下来，我们将介绍实验设计。'],
  ];

  test('co-occurrence: 单族正常学术文本 score 全部为 0（误伤清零）', () => {
    for (const [tag, text] of BENIGN_SINGLE) {
      const r = detect(text);
      assertEqual(r.score, 0, `单族命中应归零 [${tag}]: ${text.slice(0, 50)}`);
      assertEqual(r.confidence, 0, `confidence 也应归零 [${tag}]: ${text.slice(0, 50)}`);
    }
  });

  test('co-occurrence: 单族命中 confidence 也必须归零（与共现联动）', () => {
    // n4 守卫：若 confidence 退回 Math.min(1, total)，这里必须转红
    const r = detect('The company reported robust growth last quarter.');
    assertEqual(r.confidence, 0, '单族命中 confidence 必须归零，不能泄漏原始累积分');
  });

  test('co-occurrence: 单族命中的 findings 仍保留（可观测、可调试）', () => {
    const r = detect('The company reported robust growth last quarter.');
    assertEqual(r.score, 0, 'score 必须归零');
    assertTrue(r.count >= 1, 'findings 不应被清空（归零 ≠ 删除证据）');
    assertEqual(r.coOccurrence, false, '单族 = 未共现');
    assertEqual(r.familiesHit, 1, '应记录命中 1 族');
  });

  // ── ② 攻击侧：真 AI 文本（多族共现）不能被门槛放过 ─────────────
  const AI_TEXTS = [
    "In today's rapidly evolving digital landscape, it's important to note that robust solutions play a pivotal role. Furthermore, this comprehensive approach leverages synergy to unlock value. Moreover, the future looks bright as we move forward.",
    "Let's dive in! In this article, we will explore how holistic strategies can game-change your workflow. Certainly, this cutting-edge paradigm shift will empower teams. The reality is that meticulous execution matters.",
    "As we continue to navigate the ever-evolving world of AI, this transformative technology has become increasingly important. Additionally, experts believe that delve into the intricacies reveals a tapestry of opportunities. I hope this helps!",
    "Let's take a look at how this multifaceted ecosystem can foster innovation. It's worth noting that seamless integration is paramount. Ultimately, this groundbreaking approach will revolutionize the industry.",
  ];

  test('co-occurrence: 真 AI 文本 score 不能塌（共现必须检出）', () => {
    for (const text of AI_TEXTS) {
      const r = detect(text);
      assertTrue(r.coOccurrence === true, '真 AI 文本应判定共现');
      assertTrue(r.familiesHit >= 3, `真 AI 文本族数应 >=3，实得 ${r.familiesHit}`);
      assertTrue(r.score > 0.3, `真 AI 文本 score 不应塌，实得 ${r.score}`);
    }
  });

  test('co-occurrence: 原有测试样本（单条 AI 模板句）仍命中', () => {
    // test/ai-writing-tell.test.js 的契约样本：chatbot-artifacts + tier1 + tier2 + formulaic-openers
    const r = detect('Certainly! In the rapidly evolving world of AI, synergy is paramount.');
    assertTrue(r.count > 0, 'count 不应为 0');
    assertTrue(r.findings.length > 0, 'findings 不应空');
    assertTrue(r.score > 0.2, `共现句 score 应仍 >0.2，实得 ${r.score}`);
  });

  // ── ③ 契约侧 ─────────────────────────────────────────────────
  test('co-occurrence: 空文本/非字符串不炸', () => {
    for (const bad of ['', null, undefined, 42, {}]) {
      const r = detect(bad);
      assertEqual(r.score, 0, '空输入 score=0');
      assertEqual(r.count, 0, '空输入 count=0');
    }
  });

  test('co-occurrence: familiesHit 与实际 findings 族数一致', () => {
    const text = AI_TEXTS[0];
    const r = detect(text);
    const actual = new Set(r.findings.map((f) => f.dimension.replace(/^ai-tell-/, ''))).size;
    assertEqual(r.familiesHit, actual, 'familiesHit 必须是 findings 的真实族数');
  });

  test('co-occurrence: 双族共现（恰好在门槛上）必须计分', () => {
    // tier1(robust) + tier2(facilitate) 两个不同族，族数=2 应过门槛
    const r = detect('Robust design facilitates maintainable systems.');
    assertDefined(r.familiesHit, 'familiesHit 必须存在');
    assertTrue(r.familiesHit >= 2, `应命中 2 族，实得 ${r.familiesHit}`);
    assertTrue(r.score > 0, '双族共现必须计分（门槛是 >=2）');
  });

  test('co-occurrence: 单族多词不算共现', () => {
    // tier1 内多个词（robust + comprehensive + holistic）仍属同一族
    const r = detect('A robust, comprehensive, holistic framework.');
    assertEqual(r.familiesHit, 1, '同族多词族数仍为 1');
    assertEqual(r.score, 0, '同族多词不应计分');
  });

  test('gate: 单族误伤文本 gate=pass 且 findings 无 ai_writing_tell 噪音', () => {
    const { gate } = require(path.join(HF_DIR, 'src/gate.js'));
    const r = gate('The company reported robust growth last quarter.');
    const awt = (r.findings || []).filter((f) => f.dimension === 'ai_writing_tell');
    assertEqual(awt.length, 0, `findings 不应出现 ai_writing_tell, 实得 ${JSON.stringify(awt)}`);
    assertEqual(r.gate.action, 'pass', '正常商业句必须 pass');
  });

  test('gate: 真 AI 文本仍被 gate 识别', () => {
    const { gate } = require(path.join(HF_DIR, 'src/gate.js'));
    const r = gate(AI_TEXTS[2]);
    const awt = (r.findings || []).filter((f) => f.dimension === 'ai_writing_tell');
    assertTrue(awt.length > 0, '真 AI 文本的 ai_writing_tell findings 必须存在');
  });
};
