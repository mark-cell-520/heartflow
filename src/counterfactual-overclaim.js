/**
 * src/counterfactual-overclaim.js
 * [r183] 第 181 维度 counterfactual_overclaim（反事实独断）
 *
 * 谬误形状：把另一条**未走路径**的结果当作**确定可知**——「如果当初X，
 * 现在一定/必然/势必Y」。反事实（如果当初做了另一个选择会怎样）在复杂
 * 系统中原则上不可事先确定：同一前件在不同参数、随机性与耦合作用下会
 * 发散出不同后果。用确定性副词封装反事实结果，是把不可验证的假设当
 * 结论，是 AI 输出中最常见的「貌似深刻的马后炮」。
 *
 * 判据（双腿共现，缺腿不判）：
 *   腿① CF 反事实框架——过去替代路径已显式搭建：
 *      · CN-A 连接词先行形：连接词（如果/要是/倘若/要不是…）→ [≤12字]
 *        → 过去时点锚（当初/当时/那年/一开始/早点…）
 *      · CN-B 锚先行形：过去时点锚 → [≤8字] → 连接词/否定动作
 *        （「当初要是听我的」「那时如果没停电」）
 *      · EN-A if + 主语 + had + 过去分词；EN-B 倒装 had we/they + PP；
 *        EN-C if only + 主语 + had
 *   腿② CERT 确定性断言——一定/肯定/必然/势必/注定/毫无疑问（EN
 *      certainly/definitely/bound to/undoubtedly/without a doubt/surely）。
 *      **刻意不收「早就/就不会/would have」**：那是 conditional_proposition
 *      （第160维）的否定推断形射程；本族收的是确定性副词形，两族可同句
 *      共现但判定结构不同。
 *
 * 与存量维度边界：
 *   · conditional_proposition（r729 第160维）管「假设条件句 × 否定推断」
 *     （早就…了/就不会/怎么可能/would have）——攻击腿是「前件为假」的
 *     推断；本维度管「未走路径 × 确定性结果」——攻击腿是替代路径结果的
 *     可知性断言。交集句（「如果当初多买一套房，现在肯定早就财富自由了」）
 *     两族同时命中，gate 取并集不漏判即达标。
 *   · hindsight_bias（第175维）管「事后结果倒推为事前注定」，锚是已发生
 *     结果；本维度锚是未发生的替代路径。
 *   · wishful_thinking（第147维）管将来时一厢情愿；本维度是过去反事实。
 *
 * 豁免常量（全部可被负例注入置空）：
 *   HEDGE 对冲（也许/未必/说不定/无法知道/谁也说不准；EN might/maybe/
 *     no one can say）、NEGFLIP 拒绝推断（不要以为/无法断定/推不出/不恰当/
 *     unjustified）、META 概念转述（反事实/复杂系统/混沌/决定论；EN
 *     counterfactual/causal inference/complex systems）、NEGSEAL 结论侧否定
 *     （不足以…证明；EN does not prove）、QUESTION 疑问句（逐句）。
 *
 * r183 实测（scripts 见 /tmp/hf-probe-r183.js，当前引擎 180 维）：
 * 攻击样本 2/8 真零命中（CN「如果当初投入研发，现在我们一定已经领先市场
 * 三年了」「倘若当初选择另一条技术路线，我们现在势必已经主导整个行业」），
 * 其余为 absolute_claim/hindsight_bias/conditional_proposition/perfect_error
 * 代拦——「反事实框架 × 确定性断言」结构本身零维度覆盖；良性 0/8 本族误伤
 * （2 条被存量维度误伤，非本维度引入）。
 */
'use strict';

// ─── 判定常量（可变对象——负例注入的承重目标） ────────────────

const RE = {
  // 腿① CF 反事实框架
  // CN-A：连接词先行 → [≤12字] → 过去时点锚（裸名词形态，161 轮教训）
  // 锚点窄收：刻意不收「之前/先前/此前」——「如果之前的数据有误，现在
  // 一定要回头修正」的「一定」是义务情态而非确定性断言，宽锚会把义务句
  // 扫进谬误族（基线误拦纪律）。
  CF_CN_A_RE: /(?:如果|若|要是|假如|倘若|倘使|若是|设若|要不是|若非)[^。，？！；\n]{0,12}(?:当初|当时|那时|那年|当年|早年|一开始|最开始|早些时候|早点|最初|早先)/,

  // CN-B：过去时点锚先行 → [≤8字] → 连接词/否定动作（「当初要是」「那时如果没」）
  CF_CN_B_RE: /(?:当初|当时|那时|那年|当年|早年|一开始|最开始|早些时候|早点|最初|早先)[^。，？！；\n]{0,8}(?:如果|若|要是|假如|倘若|若是|没有|没|不)/,

  // EN-A：if + 主语 + had（if we had invested…）
  CF_EN_A_RE: /\bif\s+(?:we|i|you|they|he|she)\s+had\b/i,

  // EN-B：倒装 had we/they + 过去分词（Had we taken…）
  CF_EN_B_RE: /\bhad\s+(?:we|i|you|they)\s+(?:known|taken|chosen|invested|acted|gone|waited|listened|started|made|been|seen|tried|moved|stayed)/i,

  // EN-C：if only + 主语 + had（If only we had acted…）
  CF_EN_C_RE: /\bif\s+only\s+(?:we|i|you|they)\s+had\b/i,

  // 腿② CERT 确定性断言（不含早就/就不会/would have——conditional_proposition 射程）
  CERT_ZH_RE: /(?:一定|肯定|必然|势必|必定|注定|毫无疑问|毋庸置疑|不容置疑|必将)/,
  CERT_EN_RE: /\b(?:certainly|definitely|bound\s+to|undoubtedly|without\s+a\s+doubt|no\s+doubt|surely)\b/i,

  // 豁免常量（可被负例注入置空）
  // 对冲：承认结果不可知（「也许」「谁也说不准」「no one can say」）
  HEDGE_ZH_RE: /(?:也许|或许|可能|大概|未必|不一定|不见得|说不定|很难说|说不准|无法知道|没人知道|无人知道|难以预料|不可预知|谁能想到|谁也想不到|无法假设)/,
  HEDGE_EN_RE: /\b(?:maybe|perhaps|possibly|probably|might|may\s+have|could\s+have|unclear|uncertain|impossible\s+to\s+know|no\s+way\s+to\s+know|cannot\s+say|can'?t\s+say|no\s+one\s+(?:can|could)\s+say|hard\s+to\s+say)\b/i,

  // 拒绝推断：明确反对把反事实结果当确定（「不要以为」「不恰当」「unjustified」）
  NEGFLIP_ZH_RE: /(?:不要以为|别以为|不能认为|不可认为|无法断定|难以断言|推不出|不代表|不等于|并不意味着|不意味着|不成立|是错的|不对|不恰当|轻率|武断|臆测|想当然)/,
  NEGFLIP_EN_RE: /\b(?:does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|can'?t\s+conclude|no\s+basis|unwarranted|unjustified|speculative)/i,

  // 概念/教学转述：讨论反事实推理本身（刻意不收「如果当初…一定」攻击形）
  META_ZH_RE: /(?:反事实|复杂系统|混沌|决定论|因果推断|条件命题|平行宇宙|另一种可能)/,
  META_EN_RE: /\b(?:counterfactual|causal\s+inference|determinism|chaos\s+theory|complex\s+systems?)\b/i,

  // 结论侧否定与存疑：承认确定性不成立（「不足以证明」「does not prove」）
  NEGSEAL_ZH_RE: /(?:不足以|无法|难以|不能|不构成|谈不上|算不上)[^。]{0,10}(?:证明|证实|说明|采信|支撑|确立|意味)/,
  NEGSEAL_EN_RE: /\b(?:insufficient|does\s+not\s+(?:prove|establish)|cannot\s+(?:prove|establish))\b/i,
};

// ─── 句子切分 ────────────────────────────────────────────────

function splitSentences(text) {
  if (typeof text !== 'string' || !text) return [];
  return text
    .split(/[。！；\n]+|(?<=[a-z])\.\s+/i) // 刻意不按 ?/？ 切分——问号要留在句内供疑问句豁免判定
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ─── 主检测 ──────────────────────────────────────────────────

function checkCounterfactualOverclaim(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }
  // 整篇豁免：对冲/拒绝推断/概念转述/结论侧否定不是运用该谬误
  if (RE.HEDGE_ZH_RE.test(text) || RE.HEDGE_EN_RE.test(text)
    || RE.NEGFLIP_ZH_RE.test(text) || RE.NEGFLIP_EN_RE.test(text)
    || RE.META_ZH_RE.test(text) || RE.META_EN_RE.test(text)
    || RE.NEGSEAL_ZH_RE.test(text) || RE.NEGSEAL_EN_RE.test(text)) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }

  const sentences = splitSentences(text);
  const matches = [];

  for (const sent of sentences) {
    // 疑问句豁免（逐句）
    if (/[?？]/.test(sent)) continue;

    const cfA = RE.CF_CN_A_RE.test(sent);
    const cfB = RE.CF_CN_B_RE.test(sent);
    const enA = RE.CF_EN_A_RE.test(sent);
    const enB = RE.CF_EN_B_RE.test(sent);
    const enC = RE.CF_EN_C_RE.test(sent);
    if (!(cfA || cfB || enA || enB || enC)) continue;

    const certZh = RE.CERT_ZH_RE.test(sent);
    const certEn = RE.CERT_EN_RE.test(sent);
    if (!(certZh || certEn)) continue;

    matches.push({
      sentence: sent.slice(0, 80),
      cfA, cfB, enA, enB, enC, certZh, certEn,
    });
  }

  if (matches.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }

  // 评分：单处共现 75；强确定性词（毫无疑问/注定/bound to）或多处 95
  const strong = matches.length >= 2
    || /(?:毫无疑问|毋庸置疑|不容置疑|注定)/.test(text)
    || /\b(?:bound\s+to|undoubtedly|without\s+a\s+doubt)\b/i.test(text);
  const score = strong ? 95 : 75;
  const count = matches.length;
  const details = '反事实独断（把未走路径的结果当作确定可知）(' + count + '处: '
    + matches.map(m => m.sentence.slice(0, 40)).join('；') + ')';

  return { hit: true, score, count, matches, details };
}

module.exports = {
  checkCounterfactualOverclaim,
  __internals: RE,
};
