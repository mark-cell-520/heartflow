/**
 * 测试：npm 包端到端 — 安装者视角跑文档示例（v6.7.80，心虫 decision.decide 0.89）
 *
 * 来源：第 45 轮心虫选「端到端验证 npm 包」（0.89）。
 * 前四轮验过"包含全部模块、能 require"，但从未**逐字跑文档示例**
 * ——即安装者复制 AGENTS.md Quick start 后的真实体验。
 *
 * 一、端到端抓到真缺口：文档承诺 verify，实际 pass
 *
 * AGENTS.md Quick start 第三个示例：
 *   checkOutput('According to 2025 Harvard research, coffee extends life by 12.5 years')
 *   注释写 // Gather evidence before acting（即期望 verify）
 *
 * 安装者视角实跑：**pass**。
 * 根因：UNSUPPORTED_CLAIM_EN 的模式要求 research 紧跟 according to，
 * 而真实编造句式几乎都带年份/机构名（"according to 2025 Harvard research"）。
 * 中文侧早就覆盖了（"据2025年哈佛大学研究"命中），英文侧没有。
 *
 * 已补 2 条模式。修后：
 *   According to 2025 Harvard research, ...  → verify
 *   Experts agree this is the best approach   → verify
 *
 * 二、一个刻意不修的"误拦"
 *
 *   According to the 2025 Harvard study (PMID 12345), ... in a 10-year RCT.
 *   → 仍 verify
 *
 * 它其实不该算误拦：该豁免需要 specificSource + **保留语**双条件，
 * 而这句话只满足前者。设计意图是"模糊来源 + 假装保留语"不能豁免
 * ——PMID 单独出现也可能是编的。若为此放宽会削掉第 34 轮的防线。
 * **判定为合理保守，记录在此。**
 *
 * 三、测试口径
 *   不跑 npm install（太慢且有索引延迟），直接测源码路径，断言
 *   **文档示例的输入/期望输出**与引擎实际行为一致。
 *   真正的安装验证在 test/npm-package-integrity.test.js。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[AGENTS.md Quick start 三个示例的承诺行为]');

const EXAMPLES = [
  ['input 情绪操纵 → rewrite', 'You are so selfish if you disagree', 'rewrite', 'checkInput'],
  ['output 过度自信 → rewrite', 'Undoubtedly this is the only correct solution.', 'rewrite', 'checkOutput'],
  ['fact 编造研究 → verify', 'According to 2025 Harvard research, coffee extends life by 12.5 years', 'verify', 'checkOutput'],
];

for (const [label, text, want, fnName] of EXAMPLES) {
  t(label, () => {
    const r = gate[fnName](text);
    assert.strictEqual(r.gate.action, want,
      `实际 ${r.gate.action}（文档承诺 ${want}）。文本: ${text.slice(0, 50)}`);
  });
}

console.log('\n[v6.7.80 补的英文模式]');

t('according to + 年份 + 机构 + research → 识别', () => {
  const a = gate.checkOutput('According to 2025 Harvard research, coffee extends life by 12.5 years').gate.action;
  assert.notStrictEqual(a, 'pass', `英文编造句式仍放行: ${a}`);
});

t('according to + 机构 + research（无年份）→ 识别', () => {
  const a = gate.checkOutput('According to Stanford research, this method improves accuracy by 40%').gate.action;
  assert.notStrictEqual(a, 'pass', `英文编造句式仍放行: ${a}`);
});

t('Experts agree 型 → 识别', () => {
  const a = gate.checkOutput('Experts agree this is the best approach').gate.action;
  assert.notStrictEqual(a, 'pass', `权威一致型仍放行: ${a}`);
});

t('原有 studies show 型不退化', () => {
  const a = gate.checkOutput('Studies show that this works 99% of the time').gate.action;
  assert.notStrictEqual(a, 'pass', '原已覆盖的句式退化了');
});

console.log('\n[文档承诺的字段真实存在]');

t('Quick start 用到的字段都有', () => {
  const r = gate.checkInput('You are so selfish if you disagree');
  for (const f of ['gate.action', 'gate.reason', 'findings', 'checked_by']) {
    const v = f.split('.').reduce((o, k) => o && o[k], r);
    assert.ok(v !== undefined, `缺字段 ${f}（AGENTS.md Return value 章节承诺了）`);
  }
});

t('findings[].guidance 非空（README 承诺 Follow findings[].guidance）', () => {
  const r = gate.checkInput('You are so selfish if you disagree');
  assert.ok(r.findings.length > 0, 'findings 为空');
  assert.ok(r.findings[0].guidance, 'findings[0].guidance 为空');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
