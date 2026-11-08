/**
 * scripts/negative-test-argument-to-moderation-wisdom.js — r739 负例脚本
 *
 * 七类变异逐一注入，每类必须让对应攻击族停判（证明承重），且对照组
 * （未注入态）零误伤。第七类反向验证：恢复 r739 移除的裸名词「方案|
 * 选项」后，误伤样本必须转为命中（证明误伤修复承重、不是巧合放行）。
 *
 * 参考 scripts/negative-test-absolute-claim-en.js 注入模式。
 */
'use strict';
const { checkArgumentToModeration, __internals } = require('../src/argument-to-moderation.js');
const I = __internals();

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const assert = require('assert');
const hit = (s, inj) => checkArgumentToModeration(s, inj).hit;

// ── 变异①：TRUTH_ZH 删智慧谓词（四条腿同步删）→ 智慧族停判 ─────────────
const TRUTH_NO_WISDOM = I.TRUTH_ZH.map(r => new RegExp(r.source.replace(/智慧\|明智/g, '明智').replace(/\|智慧/g, ''), r.flags));
check('变异① TRUTH_ZH 删智慧谓词 → 智慧族停判', () => {
  for (const s of ['折中才是智慧', '中间立场是智慧的做法', '中庸才是大智慧', '各打五十大板才是最智慧的处理', '和稀泥是处世智慧']) {
    assert.ok(!hit(s, { TRUTH_ZH: TRUTH_NO_WISDOM }), s + ' 仍命中——智慧谓词腿不承重');
  }
});
check('变异① 对照: 未注入态智慧族全命中', () => {
  for (const s of ['折中才是智慧', '中间立场是智慧的做法', '中庸才是大智慧', '各打五十大板才是最智慧的处理', '和稀泥是处世智慧']) {
    assert.ok(hit(s), s + ' 未命中');
  }
});

// ── 变异②：MIDDLE_ZH 删明明 → 明明族停判 ─────────────────────────────
const MIDDLE_NO_MINGMING = I.MIDDLE_ZH.map(r => new RegExp(r.source.replace('|明明', ''), r.flags));
check('变异② MIDDLE_ZH 删明明 → 明明族停判', () => {
  for (const s of ['结论明明在两者之间', '真相明明就在两极中间']) {
    assert.ok(!hit(s, { MIDDLE_ZH: MIDDLE_NO_MINGMING }), s + ' 仍命中');
  }
});

// ── 变异③：TRUTH_ZH 删明明 → 明明族停判 ───────────────────────────────
const TRUTH_NO_MINGMING = I.TRUTH_ZH.map(r => new RegExp(r.source.replace('|明明', ''), r.flags));
check('变异③ TRUTH_ZH 删明明 → 明明族停判', () => {
  for (const s of ['结论明明在两者之间', '对错明明在双方之间']) {
    assert.ok(!hit(s, { TRUTH_ZH: TRUTH_NO_MINGMING }), s + ' 仍命中');
  }
});

// ── 变异④：MIDDLE_ZH 删骑墙/一碗水端平 → 两族停判 ─────────────────────
// 注意：不能置空 source（new RegExp('') 恒真），须整条过滤。
const MIDDLE_NO_IDIOM = I.MIDDLE_ZH.filter(r => !/骑墙|一碗水端平/.test(r.source));
check('变异④ MIDDLE_ZH 删骑墙/一碗水端平 → 两族停判', () => {
  assert.ok(!hit('骑墙是最智慧的处世之道', { MIDDLE_ZH: MIDDLE_NO_IDIOM }), '骑墙族仍命中');
  assert.ok(!hit('一碗水端平才是智慧', { MIDDLE_ZH: MIDDLE_NO_IDIOM }), '一碗水端平族仍命中');
});
check('变异④ 对照: 未注入态两族全命中', () => {
  assert.ok(hit('骑墙是最智慧的处世之道'), '骑墙族未命中');
  assert.ok(hit('一碗水端平才是智慧'), '一碗水端平族未命中');
});

// ── 变异⑤：MIDDLE_EN 删 a middle → EN A middle 族停判 ─────────────────
const MIDDLE_EN_NO_A = I.MIDDLE_EN.filter(r => !/a middle/.test(r.source));
check('变异⑤ MIDDLE_EN 删 a middle → EN 族停判', () => {
  assert.ok(!hit('A middle position is always the wisest approach.', { MIDDLE_EN: MIDDLE_EN_NO_A }), '仍命中');
});
check('变异⑤ 对照: 未注入态 EN A middle 族命中', () => {
  assert.ok(hit('A middle position is always the wisest approach.'), '未命中');
});

// ── 变异⑥：TRUTH_EN 删 compromise 主语 → EN compromise 族停判 ──────────
const TRUTH_EN_NO_COMP = I.TRUTH_EN.filter(r => !/compromise is/.test(r.source));
check('变异⑥ TRUTH_EN 删 compromise → EN compromise 族停判', () => {
  assert.ok(!hit('Compromise is the wise choice when both sides are extreme.', { TRUTH_EN: TRUTH_EN_NO_COMP }), '仍命中');
});

// ── 变异⑦（反向）：恢复裸名词「方案|选项」→ 误伤样本必须转命中 ──────────
const MIDDLE_RESTORED = I.MIDDLE_ZH.map((r, i) => i === 0
  ? new RegExp('中间(?:立场|地带|道路|路线|选项|方案|派|力量)', r.flags)
  : r);
check('变异⑦ 恢复裸名词方案/选项 → 误伤样本转命中（证明 r739 修复承重）', () => {
  for (const s of ['这个中间方案最稳妥，因为成本最低', '这个中间方案最合理，可以兼顾双方诉求']) {
    assert.ok(hit(s, { MIDDLE_ZH: MIDDLE_RESTORED }), s + ' 未转命中——r739 移除不是承重原因');
  }
});
check('变异⑦ 对照: 未注入态误伤样本全放行', () => {
  for (const s of ['这个中间方案最稳妥，因为成本最低', '这个中间方案最合理，可以兼顾双方诉求']) {
    assert.ok(!hit(s), s + ' 误伤仍在');
  }
});

// ── 对照组：良性样本在全部未注入态零误伤 ──────────────────────────────
const BENIGN_ALL = [
  '他用智慧化解了这场冲突', '这是一个很智慧的决策', '她为人处世很有智慧',
  '老祖宗的智慧值得我们学习', '明明是中间那个人传的话', '明显的中间层设计降低了耦合',
  '走中间路线可以避开两边的雷区', '两边各让一步，谈判才算完成', '调解员建议双方各退一步',
  '取中间值可以平滑异常数据', '这家公司的中间件架构很稳定',
  'The wise thing to do is check the logs first.', 'She is the wisest person on the team.',
  'The middle value of the dataset is 42.', 'A middle manager reported the issue to the director.',
  '取中间值才是最智慧的选择', '折中主义才是智慧的结晶',
];
check('对照组: 17 条良性样本未注入态零误伤', () => {
  for (const s of BENIGN_ALL) assert.ok(!hit(s), s + ' 误伤');
});

console.log(`\nr739 负例（智慧族/明明族/误伤修复）: ${pass} passed / ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
