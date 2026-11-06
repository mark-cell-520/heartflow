'use strict';
/**
 * quantifier-guards.js — 量化词族双守卫（v6.8.148 第 718 轮新增）
 *
 * 跨族缺陷（实测定位）：en 侧 everyone/everybody/all/every × 泛化动词族与
 * zh 侧 所有人|每个人|人人都 × 都|均|皆|总是|从来 族，判据一律只认
 * 「量化词×泛化动词」共现，不认量化词前后两类边界词，把两类良性句误判成
 * 攻击：
 *   ① 否定量化词（对全称的反驳，不是全称主张）：
 *      "Not everyone agrees with the proposal."「不是所有人都同意这个方案。」
 *      ——被否定的全称本身就是反驳。旧判据在 absolute_claim /
 *      hasty_generalization / theory_of_mind / fallacies(bandwagon) /
 *      factual_consistency / social_norm / perfect_error(S5) 七族误伤。
 *   ② 规范情态槽（规则宣告句，不是描述性概括）：
 *      "Nobody can skip the verification step here."「每个人都要签字。」
 *      ——情态动词（can/must/should/要/必须/应该）在场时句子在立规则。
 *
 * 守卫口径（逐命中位点判定，不连坐同句其他命中——r82 铁律：绝不用「句内
 *   有否定词就放行」，那会连坐真攻击）：
 *   · isNegatedQuantifierHit：命中段紧前邻 ≤20 字符以否定词结尾才赦——
 *     not / never / hardly / barely / scarcely / no longer / 不是 / 并不是 /
 *     并非 / 未必 / 不见得 / 没有 / 没。紧前邻口径保证 "It is not true that
 *     everyone knows" 这类否定在更远处的句子不误赦；n't 缩写（"Doesn't
 *     everyone know?"）不入赦——反问句正是 false_consensus 的攻击形态。
 *   · isNormativeQuantifierHit：只对带捕获组的判据③与 zh 全称族生效——
 *     填充段内含情态动词（can/could/may/might/must/should/shall/will/
 *     would/dare/ought/has to/needs to/be able to/be allowed to），或紧跟
 *     全称标记的义务模态（要/必须/应该/应当/务必/需要/须/得），即判规范句
 *     跳过。
 * 豁免的是单条命中（continue）不是整句：「Not everyone agrees, and everyone
 *   knows the risks」后半句仍须命中。
 */

const QUANT_NEGATION_EN = /(?:\bnot\s+|\bnever\s+|\bhardly\s+|\bbarely\s+|\bscarcely\s+|\bno\s+longer\s+)$/i;
const QUANT_NEGATION_ZH = /(?:不是|并不是|并非|未必|不见得|没有|没)$/;
const QUANT_MODAL_FILLER_EN = /\b(?:can|could|may|might|must|should|shall|will|would|dare|ought)\b|\b(?:has|have)\s+to\b|\bneeds?\s+to\b|\b(?:is|are|was|were|be|been)\s+(?:able|allowed|supposed|going)\b/i;
const QUANT_MODAL_FILLER_ZH = /^(?:要|必须|应该|应当|务必|需要|须|得)/;

/**
 * 命中段是否紧跟在否定量化词之后（如 "Not everyone…" / 「不是所有人…」）。
 * @param {string} text 全文
 * @param {number} idx 命中段起始下标
 * @returns {boolean} true = 该命中应豁免
 */
function isNegatedQuantifierHit(text, idx) {
  if (typeof text !== 'string' || !Number.isInteger(idx) || idx <= 0) return false;
  const before = text.slice(Math.max(0, idx - 20), idx);
  if (QUANT_NEGATION_ZH.test(before)) return true;
  return QUANT_NEGATION_EN.test(before);
}

/**
 * 命中段填充槽是否含规范情态词（规则宣告句，非描述性概括）。
 * 只接受带捕获组的模式（m[1] = 量化标记后的填充段）。
 * @param {RegExpMatchArray} m match 结果
 * @returns {boolean} true = 该命中应豁免
 */
function isNormativeQuantifierHit(m) {
  if (!m || typeof m[1] !== 'string' || !m[1]) return false;
  return QUANT_MODAL_FILLER_EN.test(m[1]) || QUANT_MODAL_FILLER_ZH.test(m[1]);
}

module.exports = {
  isNegatedQuantifierHit,
  isNormativeQuantifierHit,
  __internals: {
    QUANT_NEGATION_EN, QUANT_NEGATION_ZH,
    QUANT_MODAL_FILLER_EN, QUANT_MODAL_FILLER_ZH,
  },
};
