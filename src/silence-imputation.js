/**
 * src/silence-imputation.js — 「沉默推定 / 诉诸沉默谬误」检测器
 * （第 213 个判别维度，r717）
 *
 * [r717 立项] 方向池复测（scripts/round-717/diag-pool.js，口径与
 * scripts/probe-r216.js 完全一致，引擎 v6.8.146）：
 *   silence_imputation 攻击样本 10 条中 6 条 gate.action=pass
 *   （60% 漏判，与 r216 探针数字完全一致），良性样本 6/6 pass
 *   （r216 时的 1 例误伤「法院尚未判决，任何一方都有权不对外发声。」
 *   在 r218 修掉 perfect_error 全称量化误伤后归零）。
 *   合格线「攻击漏判>=50% 且良性 0 误伤」两项同时满足，r218 交接簿
 *   「perfect_error 误伤已修、可复测上线」的预判被实测证实。
 * 覆盖度检查：silence_imputation / 沉默推定 / 诉诸沉默 在 src/ 下 0
 * 文件命中；近邻维度均不覆盖本族——appeal_to_ignorance 判「没有证据
 * 所以为真/为假」（无人称的缺席），本族判「对一个主体的沉默/不回应
 * 作有罪推定」（有人称的行为缺席）；mind_reading 判「宣称知道他人
 * 内心想法」，本族的核心不在读心而在把程序性沉默当证据；manufactured
 * _consent 判「用沉默的大多数名义制造共识代表」，本族是单次指控场景
 * 的推定；presupposition 判「问题内嵌未经证实的预设」，本族的预设
 * 由「沉默→默认」的推理链承载。r211 侦察记录曾认为「诉诸沉默已被
 * manufactured-consent 覆盖」，本轮 60% 漏判的实测数据推翻该判断——
 * 覆盖面不足以支撑上线结论，正是复测纪律存在的理由。
 *
 * 辨别的族：沉默推定（silence imputation / argument from silence）
 * ——把当事人的**沉默、不回应、未否认、回避、拒绝置评**，直接
 * 当作**指控为真、当事人心虚或默认承认**的证据：
 *   他到现在都没出来否认，说明这事是真的。
 *   她不回答就是默认了。
 *   面对追问一言不发，这本身就是答案。
 *   不置评就等于默认，大家心里都清楚。
 *   他避而不答的态度已经说明了一切。
 *   既然没否认，那就是承认了。
 *   No denial has been issued, so the allegations must be true.
 *   He refused to answer the question, which speaks for itself.
 *   Her silence on the matter is telling enough.
 *   这么久都不出来澄清，显然是心虚。
 *
 * 为什么这是判别者的核心缺口：沉默是**程序性权利**而不是证据。刑事
 * 审判里不得强迫自证其罪、危机公关里「进入法律程序不置评」是标准
 * 操作、名人「不给传闻热度」是理性策略——把沉默当有罪证据的推理
 * 会让每一个行使正当沉默权的人自动背上罪名，这是对所有「不说」
 * 者的系统性歧视，与心虫「辨别者不说违背规律的话」的定位直接冲突。
 *
 * 外部来源：argument from silence（argumentum e silentio / ex
 * silentio）——经典非形式谬误条目（Wikipedia "Argument from
 * silence"、Logically Fallacious "Argument from Silence"、IEP
 * "Fallacies" 条目下的 absence-of-evidence 亲属族）；司法语境对应
 * 「不得被迫自证其罪」（right to remain silent / privilege
 * against self-incrimination）与「沉默不得作为有罪证据」的证据法
 * 原则。按心虫既有维度形态自建纯规则判据。
 *
 * 判据（双腿共现 + 邻近窗，对齐 r212 collider_bias 结构）：
 *   腿① SILENCE_LEG：沉默/不回应动作（有人称的程序性沉默）
 *   腿② IMPUTE_LEG：推定结论（沉默=默认/承认/心虚/证明指控为真）
 *   两腿按出现顺序邻近共现（腿②在腿①后 40 字符内，或腿②在前、
 *   腿①在其后 12 字符内——「显然是心虚，他连一句都不回」变体）。
 *   缺一不判——「他全程没有回应。」只有沉默无推定，是客观陈述；
 *   「这说明你是清白的。」有推定但无沉默腿。
 * 豁免：疑问句；概念/教学转述（讨论这个谬误本身）；正确响应形
 * （承认沉默不等于证据/沉默是权利/律师建议/法律程序——本族要教
 * 的正是这个判别动作）。
 */

// ── 腿① 沉默/不回应动作 ────────────────────────────────────────────
const SILENCE_ZH = [
  // 否认/澄清缺席：都没出来否认 / 没否认 / 都不出来澄清 / 未否认 / 未曾否认
  /(?:都|也|还|一直|至今|到现在|迟迟)?没(?:有)?(?:出来)?(?:否认|澄清|回应|回答|解释|辟谣|发声|作声|吭声)/,
  /(?:都|也|还|一直|至今|到现在|迟迟)?不(?:出来)?(?:否认|澄清|回应|回答|解释|辟谣|发声|作声|吭声)/,
  /未(?:曾)?(?:否认|澄清|回应|回答|解释|置评|发声)/,
  // 否定动作短语：不回答 / 不回应 / 不否认 / 不澄清 / 不置评 / 不出声 / 不发声
  /不(?:回答|回应|否认|澄清|置评|解释|出声|发声|作声|吭声|说话|作回应|回)/,
  // 拒绝/回避动作：拒绝回应 / 避而不答 / 避谈 / 一言不发 / 缄默 / 沉默不语
  /拒绝(?:回应|回答|采访|置评|发言|开口)/,
  /避而不(?:答|谈)/,
  /一言不发|不发一言|缄默|沉默不语|始终保持沉默|选择沉默/,
  // 沉默本体（名词性出现，配合腿②使用）
  /沉默/,
];
const SILENCE_EN = [
  /no (?:denial|response|reply|comment|answer|statement)\b/i,
  /without (?:a )?(?:denial|response|reply|comment|answer)/i,
  /refused to (?:answer|respond|comment|speak)/i,
  /declined to (?:comment|respond|answer|speak)/i,
  /did(?:n't| not) (?:deny|respond|answer|comment|reply)/i,
  /(?:has|have) not (?:denied|responded|commented|answered|replied)/i,
  /stayed silent|remained silent|kept silent/i,
  /\bsilence\b|\bsilent\b/i,
];

// ── 腿② 推定结论（沉默=默认/承认/心虚/证明） ───────────────────────
const IMPUTE_ZH = [
  // 等式化：就是/等于/意味着 + 默认/承认/认罪/心虚/答案
  /(?:就是|等于|意味着|说明|证明|表明|印证|坐实|等于说|无异于)(?:默认|承认|认罪|心虚|心里有鬼|答案|一切|这事是真的|确有其事|属实|是真的)/,
  // 直接谓语形：默认了 / 显然是心虚 / 肯定是心虚
  /默认了|等于默认|表示默认/,
  /(?:显然|明显|肯定|一定|想必)(?:是)?(?:心虚|心里有鬼|默认|承认|真的|属实)/,
  // 反问/总结形：这本身就是答案 / 说明了一切 / 心里都清楚
  /这(?:本身)?就是(?:答案|最好的答案|回答)/,
  /说明了?一切|心里都清楚|答案已经很明显|说明了一切问题/,
  // 沉默+真的：说明这事是真的 / 证明指控属实
  /(?:说明|证明|表明|印证)(?:了)?(?:这|那)?(?:事|事情|指控|流言|传闻)(?:是)?(?:真的|属实)/,
];
const IMPUTE_EN = [
  /must be true|has to be true/i,
  /speaks for itself|speaks volumes/i,
  /is telling|says it all|says everything/i,
  /as good as (?:an? )?admission|tantamount to (?:an? )?admission/i,
  /implies? (?:guilt|he|she|they)\b.*\bguilty|suggests? guilt|seems? guilty|means? (?:he|she|they|it)'?s? guilty/i,
  /proves? (?:it|that|the)|confirms? (?:it|that|the)/i,
];

// ── 豁免：概念/教学转述 ────────────────────────────────────────────
const EXEMPT_META_ZH = [
  '诉诸沉默', '沉默论证', '沉默推定', '沉默归罪', '这条谬误', '这种谬误',
  '逻辑谬误', '非形式谬误', '稻草人', '滑坡谬误',
];
const EXEMPT_META_EN = [
  'argument from silence', 'argumentum e silentio', 'ex silentio',
  'silence fallacy', 'appeal to silence', 'logical fallacy',
];

// ── 豁免：正确响应形（沉默≠证据，本族要教的判别动作） ───────────────
const EXEMPT_CORRECT_ZH = [
  '不等于认罪', '不等于', '不代表', '不意味着',
  '不能据此', '不得据此', '不能推断', '不能说明', '不足以证明', '不能作为证据', '不作数',
  '是当事人的权利', '有权不', '有权保持沉默', '有权拒绝', '律师建议', '法律程序',
  '尚未判决', '不给', '增加热度', '标准做法', '正当权利',
];
const EXEMPT_CORRECT_EN = [
  'standard practice', 'pending the investigation', 'pending the trial',
  'right to remain silent', 'right not to comment', 'right to decline',
  'does not imply', "doesn't imply", 'does not mean', "doesn't mean",
  'not evidence', 'is not proof', "isn't proof", 'cannot conclude',
  'cannot infer', 'no basis to', 'not an admission', 'is not an admission',
];

function anyHit(list, text) {
  for (let i = 0; i < list.length; i++) {
    if (list[i] instanceof RegExp) { if (list[i].test(text)) return true; }
    else if (text.includes(list[i])) return true;
  }
  return false;
}

function pickRe(injected, def) {
  // 空数组也是有效注入（负例脚本靠「注入空表让判据失效」证明承重），
  // 不能用 truthy 判断——length 0 的数组会掉回默认表，注入静默失效。
  return (injected instanceof Array) ? injected : def;
}

function firstIdx(list, text) {
  for (let i = 0; i < list.length; i++) {
    const m = list[i] instanceof RegExp ? list[i].exec(text) : null;
    if (m) return m.index;
  }
  return -1;
}

/**
 * 检查文本是否犯沉默推定谬误。
 * @param {string} text 待检文本（建议已 _normText 归一化）
 * @param {object} [inject] 负例脚本注入用：覆盖词表常量
 * @returns {{hit: boolean, score: number, detail: string, count: number}}
 */
function checkSilenceImputation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  const SIL_ZH = pickRe(R.SILENCE_ZH, SILENCE_ZH);
  const SIL_EN = pickRe(R.SILENCE_EN, SILENCE_EN);
  const IMP_ZH = pickRe(R.IMPUTE_ZH, IMPUTE_ZH);
  const IMP_EN = pickRe(R.IMPUTE_EN, IMPUTE_EN);
  const META_ZH = pickRe(R.EXEMPT_META_ZH, EXEMPT_META_ZH);
  const META_EN = pickRe(R.EXEMPT_META_EN, EXEMPT_META_EN);
  const COR_ZH = pickRe(R.EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_ZH);
  const COR_EN = pickRe(R.EXEMPT_CORRECT_EN, EXEMPT_CORRECT_EN);

  // 疑问句豁免（质问不构成推定结论）
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 概念/教学转述：讨论这个概念本身不是运用它
  if (anyHit(META_ZH, text) || anyHit(META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确响应形：承认沉默不等于证据，正是本族要教的判别动作
  if (anyHit(COR_ZH, text) || anyHit(COR_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 双腿共现 + 邻近窗：腿②在腿①后 60 字符内（沉默在前、推定在后的
  // 主形态——r216 攻击样本 "No denial has been issued, so the
  // allegations must be true." 的跨距实测 46 字符，窗宽须覆盖；良性
  // 样本均有豁免词前置拦截，放宽不引入误伤），或腿②在前、腿①在其后
  // 12 字符内（「显然是心虚，他连一句都不回」的倒装形态）。
  const silIdx = firstIdx(isZh ? SIL_ZH : SIL_EN, text);
  if (silIdx >= 0) {
    const impIdx = firstIdx(isZh ? IMP_ZH : IMP_EN, text);
    if (impIdx >= 0) {
      const after = impIdx - silIdx;
      if (after >= 0 && after <= 60) {
        return {
          hit: true,
          score: 0.6,
          count: 1,
          detail: isZh
            ? '把沉默/不回应当作指控为真或当事人心虚的证据(zh)'
            : 'silence/non-response treated as evidence of guilt or admission(en)',
        };
      }
      if (after < 0 && -after <= 12) {
        return {
          hit: true,
          score: 0.6,
          count: 1,
          detail: isZh
            ? '倒装形：推定结论前置、沉默动作紧随其后(zh)'
            : 'inverted: imputation precedes the silence act(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSilenceImputation,
  __internals: () => ({
    SILENCE_ZH, SILENCE_EN,
    IMPUTE_ZH, IMPUTE_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
  }),
};
