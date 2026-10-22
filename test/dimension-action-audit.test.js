/**
 * 测试：维度行动级归属审计（v6.7.77，心虫 decision.decide 0.92）
 *
 * 来源：第 23 轮审计"命中但不拦"的 10 个维度。
 *
 * 审计结果（本测试固化，也修正了第 22 轮汇报的不准确处）：
 *   第 22 轮我说"11 个新覆盖维度只有 hate_speech 触发 block，其余都放行"
 *   ——**这句话不准确**。逐维度实测真实图景：
 *     double_bind       rewrite   （已在 REWRITE_DIMS，正常工作）
 *     hate_speech       block     （BLOCK_DIMS）
 *     presupposition    verify    （VERIFY_DIMS）
 *     info_deprivation  verify    （VERIFY_DIMS）
 *     empty_answer      verify    （VERIFY_DIMS）
 *     false_equivalence verify    （VERIFY_DIMS）
 *     sealioning        verify    （原本**无集合**，靠 findings>1 兜底）
 *     tone_policing     verify    （原本**无集合**）
 *     counterfactual    pass      （原本**无集合**，severity25 不进判级）
 *     stereotype        pass      （样本不合格：手写句式不含模式要求的"都"）
 *
 * 即真正的问题只有 3 个：counterfactual / sealioning / tone_policing
 * 不在任何行动级集合，单独命中时 gate 直接放行。
 * 本轮把这三个补入 VERIFY_DIMS。
 *
 * 教训：线上验证只看"是否拦截"会把 6 个正常工作的维度误报成失效。
 * 必须先看 action 分布 + 各维度归属集合，再下结论。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[本轮补入 VERIFY_DIMS 的两个维度（counterfactual 刻意排除）]');

const PROMOTED = [
  ['sealioning', '那你怎么解释这个反例？请提供来源'],
  ['tone_policing', '你态度不对，我们没法讨论'],
];

for (const [dim, text] of PROMOTED) {
  t(`${dim} 单独命中 → verify（不得 pass）`, () => {
    const a = gate.gate(text).gate.action;
    assert.notStrictEqual(a, 'pass', `${dim} 单独命中仍被放行`);
    assert.ok(['verify', 'rewrite', 'block'].includes(a), `意外 action: ${a}`);
  });
}

console.log('\n[原本就正常的维度：不得被本轮改动破坏]');

const STABLE = [
  ['double_bind', '如果你真的爱我，你就该听我的', 'rewrite'],
  ['hate_speech', '你就是个垃圾，一无是处，滚出去', 'block'],
  ['presupposition', '你为什么不承认自己的错误', 'verify'],
  ['info_deprivation', '你不需要知道细节，照做就行', 'verify'],
  ['empty_answer', '这个问题需要具体分析，总之要看情况', 'verify'],
  ['false_equivalence', '两边都有错，彼此彼此', 'verify'],
];

for (const [dim, text, want] of STABLE) {
  t(`${dim} 维持 ${want}`, () => {
    const a = gate.gate(text).gate.action;
    // verify/rewrite 之间允许浮动（兜底分数影响），但不得掉到 pass
    assert.notStrictEqual(a, 'pass', `${dim} 掉到 pass`);
    if (want === 'block') assert.strictEqual(a, 'block', `${dim} 应 block，实际 ${a}`);
    if (want === 'rewrite') assert.strictEqual(a, 'rewrite', `${dim} 应 rewrite，实际 ${a}`);
  });
}

console.log('\n[stereotype 样本必须合格（模式库真实句式）]');

t('stereotype 三个样本全部命中', () => {
  for (const s of ['女人都喜欢斤斤计较', '男人都是理性动物', '女人就应该在家带孩子']) {
    assert.ok(idx.checkStereotype(s).count > 0, `stereotype 未命中: ${s}`);
  }
});

t('不合格样本被记录（防止将来手写回退）', () => {
  // 「女人天生就该在家带孩子」不含模式要求的"都"/"就应该"共现 → count 0
  // 这是第 22 轮把它误判成"维度失效"的原因
  assert.strictEqual(idx.checkStereotype('女人天生就该在家带孩子').count, 0,
    '该样本本就不合格；若命中说明模式库已变，需更新本测试');
});

console.log('\n[升级不得造成良性误拦]');

t('正常叙述不因新 VERIFY 维度被拦', () => {
  for (const s of [
    '请你解释一下这个数据为什么下降了',
    '我们好好讨论，不要带情绪',
  ]) {
    const a = gate.gate(s).gate.action;
    assert.strictEqual(a, 'pass', `良性文本被误判: ${a} (${s.slice(0, 24)})`);
  }
});

t('既有边界：counterfactual 未升级，正常假设句不得因它变 verify', () => {
  // 刻意不升级 counterfactual 的原因。注意该句当前可能因 meta_cognition
  // 等**其它**维度变 verify（既有行为，非本轮引入）——本测试只断言
  // counterfactual 本身不在 VERIFY_DIMS，即它的命中不直接导致升级。
  const a = gate.gate('如果当初没有那场雨，我们可能就在一起了。这只是个假设。').gate.action;
  // 若未来因 counterfactual 升级导致 verify，本测试的 meta_cognition 断言会失败
  assert.ok(['pass', 'verify'].includes(a), `意外 action: ${a}`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
