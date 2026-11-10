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
  // [r275 新增族] 口语过去锚（那晚/那天/那阵子/彼时/那当口/早年间）——
  // 「那晚要是听了劝」「如果那天多留一手」此前双腿判据均不覆盖。
  CF_CN_A_RE: /(?:如果|若|要是|假如|倘若|倘使|若是|设若|要不是|若非)[^。，？！；\n]{0,12}(?:当初|当时|那时|那年|当年|早年|一开始|最开始|早些时候|早点|最初|早先|那晚|那天|那阵子|彼时|那当口|早年间)/,

  // CN-B：过去时点锚先行 → [≤8字] → 连接词/否定动作（「当初要是」「那时如果没」）
  // [r275 新增族] 口语过去锚同步扩展（同 CN-A 口径）
  CF_CN_B_RE: /(?:当初|当时|那时|那年|当年|早年|一开始|最开始|早些时候|早点|最初|早先|那晚|那天|那阵子|彼时|那当口|早年间)[^。，？！；\n]{0,8}(?:如果|若|要是|假如|倘若|若是|没有|没|不)/,

  // EN-A：if + 主语 + had（if we had invested…）
  CF_EN_A_RE: /\bif\s+(?:we|i|you|they|he|she)\s+had\b/i,

  // EN-B：倒装 had + 主语 + 过去分词（Had we taken… / Had they picked…）
  // 【r277 结构腿】原为 14 动词枚举表（known|taken|chosen|invested|acted|
  // gone|waited|listened|started|made|been|seen|tried|moved|stayed），
  // r277 动词矩阵实测 44/58 常见过去分词漏判（picked/decided/sold/
  // bought/hired/signed/wrote/found/kept/put/cut/paid/sent/built/broke/
  // held/read/gave/told/thought/felt/opted/switched/pivoted/expanded/
  // paused/cancelled/delayed/shipped/launched/joined/left/won/lost/met/
  // asked/called/pushed/set/run…）——枚举扩容只是样本扩容，不是真升级，
  // 故改为**结构腿**：倒装 had + 人称主语 + 过去分词形态，任意过去分词
  // 均承重。同形态既有约束保留：主语限 we/i/you/they/he/she/it（倒装
  // 反事实的主语必是人称或组织代词），且倒装形后面必须跟过去分词——
  // 「Had they a chance」类古旧省略形与「Had we known」的合法形都由
  // 第三条分支（不规则过去分词白名单）兜住。
  // 承重边界（负例注入目标）：整条正则置为永假后，EN-B 全部样本失配。
  // 【r277 主语扩展】主语从人称代词扩为「人称代词 + 组织/集体名词」——
  // r277 变体矩阵实测 'Had the company paused…' / 'Had the team launched…'
  // 因主语是组织名词整句漏判（gate 仅被其他维度 verify 代拦，本维度未承重）。
  // 组织主体与个人一样是反事实推演的主体，「had the company/team/board/
  // government invested…」是英文商业与政策论述的标准倒装形。
  CF_EN_B_RE: /\bhad\s+(?:we|i|you|they|he|she|it|the\s+(?:company|team|board|firm|government|agency|startup|corporation|organisation|organization|union|committee|council|department|ministry|regulator|bank|investors?|founders?|executives?|managers?|engineers?|scientists?|researchers?|voters?|public|market|country|nation|city|state|party|opposition|incumbents?|competitors?))\s+(?:[a-z]+(?:ed|en)|(?:known|taken|chosen|given|invested|acted|gone|been|seen|tried|moved|stayed|made|done|had|come|become|run|won|lost|met|sold|bought|brought|built|broke|brought|caught|chose|cut|dealt|did|drawn|driven|drunk|eaten|fallen|felt|found|forgotten|frozen|got|grew|held|hidden|hit|hurt|kept|knelt|laid|led|lent|let|lit|lost|meant|paid|put|read|ridden|risen|said|seen|sent|set|shaken|shot|shown|shut|sold|sought|spent|stood|stolen|struck|sworn|swum|taught|thought|threw|told|took|torn|understood|woke|worn|won|wound|written|left|wrote|gave|spoke|broke|chose|drove|ate|fell|froze|stole|wore|tore|swam|began|rang|sang|sank|shrank|sprang|spun|stung|swung|threw|blew|grew|knew|flew|forbade|forbad|hid|lit|slid|spelt|spilt|strove|wet|strung|swept|slept|wept|crept|leapt|leaned|leant|learned|learnt|burned|burnt|dreamed|dreamt|kneeled|knelt|smelled|smelt|spelled|spelt|spilled|spilt|spoiled|spoilt|canceled|cancelled|counseled|counselled|traveled|travelled|labeled|labelled|totaled|totalled))\b/i,

  // EN-C：if only + 主语 + had（If only we had acted…）
  CF_EN_C_RE: /\bif\s+only\s+(?:we|i|you|they)\s+had\b/i,

  // 腿② CERT 确定性断言（不含早就/就不会/would have——conditional_proposition 射程）
  // [r275 新增族] 口语强确定词（铁定/准能/板上钉钉/百分百）——「今天铁定是
  // 另一番局面」「今天准能全身而退」；刻意不收「绝对」（义务警告形
  // 「不装风控系统绝对会崩」易误伤，按基线误拦纪律让位）。
  CERT_ZH_RE: /(?:一定|肯定|必然|势必|必定|注定|毫无疑问|毋庸置疑|不容置疑|必将|必将会|铁定|铁板钉钉|板上钉钉|一准|准能|保管|百分百)/,
  // [r275 新增族] EN 口语强确定词（guaranteed/certain to/for sure/destined to）
  // ——「success was guaranteed」「failure was certain to come」
  CERT_EN_RE: /\b(?:certainly|definitely|bound\s+to|undoubtedly|without\s+a\s+doubt|no\s+doubt|surely|guaranteed(?:\s+to)?|certain(?:\s+to)?|for\s+sure|destined\s+to|sure\s+to)\b/i,

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

function checkCounterfactualOverclaim(text, inject) {
  if (typeof text !== 'string' || text.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }
  // [r275 存量测试性缺口修复] inject 覆盖钩子（与 r272 conjunction-fallacy
  // 同形态）：此前 RE 是启动时烧死的模块级常量，负例注入完全无法触达，
  // 本模块新族（口语过去锚/口语强确定词）无删条验证通道。默认行为零变化。
  const R = inject || {};
  const CF_CN_A_RE = R.CF_CN_A_RE || RE.CF_CN_A_RE;
  const CF_CN_B_RE = R.CF_CN_B_RE || RE.CF_CN_B_RE;
  const CF_EN_A_RE = R.CF_EN_A_RE || RE.CF_EN_A_RE;
  const CF_EN_B_RE = R.CF_EN_B_RE || RE.CF_EN_B_RE;
  const CF_EN_C_RE = R.CF_EN_C_RE || RE.CF_EN_C_RE;
  const CERT_ZH_RE_ = R.CERT_ZH_RE || RE.CERT_ZH_RE;
  const CERT_EN_RE_ = R.CERT_EN_RE || RE.CERT_EN_RE;
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

    const cfA = CF_CN_A_RE.test(sent);
    const cfB = CF_CN_B_RE.test(sent);
    const enA = CF_EN_A_RE.test(sent);
    const enB = CF_EN_B_RE.test(sent);
    const enC = CF_EN_C_RE.test(sent);
    if (!(cfA || cfB || enA || enB || enC)) continue;

    const certZh = CERT_ZH_RE_.test(sent);
    const certEn = CERT_EN_RE_.test(sent);
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
