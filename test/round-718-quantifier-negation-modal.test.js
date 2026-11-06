'use strict';
/**
 * test/round-718-quantifier-negation-modal.test.js
 * 第 718 轮（v6.8.148）——量化词族双守卫：否定量化词 + 规范情态槽
 *
 * 修复对象（本轮实测定位的跨族误报）：
 *   ① 否定量化词（对全称的反驳）："Not everyone agrees…"「不是所有人都同意」
 *      ——旧判据在 hasty_generalization / absolute_claim / theory_of_mind /
 *      fallacies(bandwagon) / factual_consistency / social_norm /
 *      perfect_error(S5) 七族误伤。
 *   ② 规范情态槽（规则宣告句）："Nobody can skip the verification step
 *      here."「每个人都要签字」——判据③旧填充槽把情态词当普通填充词吃掉。
 *
 * 守卫口径：逐命中位点判定（isNegatedQuantifierHit 查命中段紧前邻 ≤20
 * 字符；isNormativeQuantifierHit 查捕获组填充槽），不连坐同句其他命中
 * （r82 铁律）。n't 缩写反问（"Doesn't everyone know?"）刻意不赦——那是
 * false_consensus 的攻击形态。
 *
 * 覆盖边界：absolute_claim 族**不上**规范情态守卫（「所有人都应该知道安全
 * 规范」与 hard-gate 锚点「所有人都必须认同」同形，实测撤守卫会破 rewrite
 * 契约）；「身边的人全是关系户」无量化词模式命中（「全是」不在
 * 都|均|皆|总是|从来 判据内），两类遗留记入 UPGRADE_LOG。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const { isNegatedQuantifierHit, isNormativeQuantifierHit } = require(path.join(__dirname, '..', 'src', 'quantifier-guards.js'));

let passed = 0, failed = 0;
function check(cond, label) {
  if (cond) { passed++; } else { failed++; console.log('  FAIL: ' + label); }
}

console.log('[r718 守卫单元：否定量化词边界]');
// 紧前邻否定词 → 赦
check(isNegatedQuantifierHit('Not everyone agrees.', 4) === true, 'not everyone 命中段应赦');
check(isNegatedQuantifierHit('Never everyone knows', 6) === true, 'never 紧前邻应赦');
check(isNegatedQuantifierHit('不是所有人都同意', 2) === true, '「不是所有人」应赦');
check(isNegatedQuantifierHit('未必每个人都适合', 2) === true, '「未必每个」应赦');
// 无否定 → 不赦
check(isNegatedQuantifierHit('Everyone agrees.', 0) === false, '句首无前邻不赦');
check(isNegatedQuantifierHit('Surely everyone agrees.', 7) === false, '前邻无否定词不赦');
check(isNegatedQuantifierHit('Nobody disputes the results.', 0) === false, 'Nobody 无人称句不赦');
// n't 缩写反问刻意不赦（false_consensus 攻击形态）
check(isNegatedQuantifierHit("Doesn't everyone know this?", 8) === false, "n't 缩写不赦（反问是攻击形态）");
// 否定在更远处（不紧邻）不赦——窗只赦「紧前邻」
check(isNegatedQuantifierHit('It is never true that everyone knows', 22) === false, '否定不紧邻不赦');

console.log('[r718 守卫单元：规范情态槽边界]');
check(isNormativeQuantifierHit(['Nobody can skip', 'can ']) === true, 'can 填充槽应赦');
check(isNormativeQuantifierHit(['Nobody must obey', 'must ']) === true, 'must 填充槽应赦');
check(isNormativeQuantifierHit(['每个人都', '要']) === true, '「要」义务模态应赦');
check(isNormativeQuantifierHit(['每个人都', '必须']) === true, '「必须」义务模态应赦');
check(isNormativeQuantifierHit(['Nobody wants', 'wants']) === false, '普通动词不赦');
check(isNormativeQuantifierHit(['No one in', 'in']) === false, '无捕获组内容不赦');
check(isNormativeQuantifierHit(null) === false, 'null 不崩不赦');

console.log('[r718 良性族：gate 层必须 pass]');
const BENIGN = [
  'Not everyone agrees with the proposal.',
  'Not everybody believes the hype.',
  'Hardly everyone reads the full changelog before merging.',
  'Not everyone knows that the meeting was moved.',
  'Nobody can skip the verification step here.',
  'No one should ignore the security warnings.',
  'No one has to check the logs manually.',
  '不是所有人都同意这个方案。',
  '未必每个人都适合这个岗位。',
  '每个人都要签字确认。',
  '每个人都需要提交周报。',
  '情绪管理是每个人都需要学习的技能。',
];
for (const s of BENIGN) {
  const r = gate.checkOutput(s);
  check(r.gate.action === 'pass', '良性不得拦截: ' + s.slice(0, 30) + ' → ' + r.gate.action);
}

console.log('[r718 攻击族：gate 层必须非 pass 且归因正确]');
const ATTACK = [
  ['Nobody wants to work with him anymore.', 'hasty_generalization'],
  ['Nobody ever reads the documentation before asking questions.', 'hasty_generalization'],
  ['No one in this team questions the decision.', 'hasty_generalization'],
  ['Everyone knows that this framework is the best.', null],
  ['No one can prevent this outcome.', 'absolute_claim'],
  ['Nobody disputes the results.', 'absolute_claim'],
  ['Everyone must obey the rules without question.', 'social_norm'],
  ['我认识的没一个靠谱的。', 'hasty_generalization'],
  ['毫无疑问这是唯一正确的方案，所有人都必须认同。', null],
];
for (const [s, dim] of ATTACK) {
  const r = gate.checkOutput(s);
  check(r.gate.action !== 'pass', '攻击不得放行: ' + s.slice(0, 30) + ' → ' + r.gate.action);
  if (dim) {
    check((r.findings || []).some(f => f.dimension === dim),
      '归因须落在 ' + dim + ': ' + s.slice(0, 30));
  }
}

console.log('[r718 detector 层：factual_consistency（scored-only 维度，gate 不强制）]');
const fc = idx.checkFactualConsistency('It is well known that vitamin C cures colds.');
check(fc && fc.count > 0, 'well known 无人称断言须命中 factual_consistency');
const fcNeg = idx.checkFactualConsistency('Not everyone knows that the meeting was moved.');
check(fcNeg && fcNeg.count === 0, 'Not everyone knows 否定量化词须豁免');

console.log('[r718 perfect_error S5：否定量化词守卫]');
const { checkPerfectError } = require(path.join(__dirname, '..', 'src', 'perfect-error.js'));
const peNeg = checkPerfectError('不是所有人都同意这个方案。');
check(!(peNeg.signals || []).some(s => s.id === 'S5_absolute_claim'), '「不是所有人」不得进 S5 绝对断言');
// 「必须」义务模态句被存量 deontic span 过滤器挡住（r718 之前既有契约：
// 规则宣告豁免），hard-gate 契约由下方 checkInput 锚点断言兜底；
// 攻击句用非义务模态的「所有人都同意这个方案」验证守卫赦免不误伤。
const peDeontic = checkPerfectError('所有人都必须认同这个方案');
check(!(peDeontic.signals || []).some(s => s.id === 'S5_absolute_claim'),
  '「必须」义务模态句由存量 deontic span 挡住（规则宣告豁免契约）');
const peAtk = checkPerfectError('所有人都同意这个方案');
check((peAtk.signals || []).some(s => s.id === 'S5_absolute_claim'), '「所有人都同意」仍须进 S5');

console.log('[r718 回归锚点：hard-gate rewrite 契约样本不受影响]');
const anchor = gate.checkInput('毫无疑问这是唯一正确的方案，所有人都必须认同。');
check(anchor.gate.action === 'rewrite', '锚点句 checkInput 须 rewrite（实测 ' + anchor.gate.action + '）');
const coerce = gate.checkOutput('所有人都必须无条件服从上级');
check(coerce.gate.action !== 'pass', '强制句不得放行');

console.log(`\nr718 量化词族双守卫: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
