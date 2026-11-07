'use strict';
/**
 * src/loaded-question.js
 * [r729] 第 214 维度 loaded_question（预设加载/诱导性提问：盘问句内嵌未经证实的
 * 前提，任何直接回答都等于默认该前提成立）。
 *
 * decision 本体选出（本克隆复测：scripts/round-729-family-probe.js 实测攻击
 * 漏判 11/20=55%、良性 0/11 误伤、漏判中真零命中 10/11——replay 同步的
 * conditional_proposition 已上线排除后唯一合格候选；scripts/decide-r729.js
 * 的旧推演（选 conditional_proposition）是另一克隆引擎 159 维状态下的产物，
 * 本克隆以实测为准改选 B 候选）。
 *
 * 双腿共现（预设加载腿×盘问句式腿）；判据腿/豁免常量经 __internals 可注入，
 * 负例脚本 scripts/negative-test-loaded-question-r729.js 逐项验证承重。
 *
 * 与 conditional_proposition（第 160 维）的边界：cp 管「如果A真就B」的假设
 * 条件句当既成论据，本族不管条件结构、只管问句内嵌的前提——「你既然知道错
 * 了，为什么还不改？」无须任何条件句即完成预设加载；两者可共现（「要是她问
 * 心无愧，为什么不敢出来回应」cp 先例），gate 取并集。
 */

// 判据腿 + 豁免常量（可被负例注入置空）
const RE = {
  // 腿① PRESUPPOSITION：预设加载形（问句内嵌未经证实的前提）
  // ZH-1 认错预设——问「（打算）什么时候承认」，预设错已犯下
  PRESUP_ZH_ADMIT_RE: /你(?:到底|究竟)?(?:打算|准备)?(?:什么时候|何时)(?:才能|才肯|会|打算)?承认/,
  // ZH-2 知错预设——「既然知道错了（为什么/还不）」+ 追责尾巴，预设对方已认错
  PRESUP_ZH_KNOWERR_RE: /既然知道错[^。！？\n]{0,12}(?:为什么|怎么还|还不|竟|居然|却)/,
  // ZH-3 规矩违反预设——「又不是不知道规矩」，预设犯了规
  PRESUP_ZH_RULE_RE: /你又不是不知道/,
  // ZH-4 单一能力预设——「除了X还会什么」，预设只会X
  PRESUP_ZH_ONLY_RE: /你除了[^，。！？；、\n]{1,12}还会/,
  // ZH-5 能力否定预设——「连…都做不好」，预设连小事都做不好
  PRESUP_ZH_INCOMP_RE: /连[^，。！？；\n]{1,12}都(?:做不好|干不好|做不到|办不好|搞不定)/,
  // ZH-6 持续劣行预设——「什么时候才能不」，预设劣行持续至今
  PRESUP_ZH_STILL_RE: /你什么时候才能不/,
  // ZH-6b 贬损状态预设——「怎么还在原地踏步/不思进取」，预设处于贬损状态
  PRESUP_ZH_STILL2_RE: /你怎么还(?:在|会|是)(?:原地踏步|不思进取|执迷不悟|一意孤行|嘴硬|装傻|推卸|敷衍)/,
  // ZH-7 隐瞒/抵赖预设——「还在（偷偷）骗/瞒/抵赖」，预设正在欺骗
  PRESUP_ZH_HIDING_RE: /你还在(?:偷偷|暗中|背着我|一直)?(?:骗|瞒|掩饰|狡辩|抵赖|推诿|逃避|找借口|装傻|装睡|自欺欺人)/,
  // ZH-8 习惯劣行预设——「为什么总是推/怪/抱怨」，预设习惯性劣行
  PRESUP_ZH_ALWAYS_RE: /你为什么总是[^，。！？；\n]{0,10}(?:推给|推卸|怪|抱怨|找借口|逃避|敷衍|拖|忘|撒谎|骗|瞒|抵赖|找理由)/,
  // ZH-9 受贿预设——「老实说…收了多少钱/收了多少」，预设收了钱
  PRESUP_ZH_BRIBE_RE: /你(?:到底|究竟)?(?:老实说|说实话|说真话)[，,]?[^。！？\n]{0,12}(?:收了多少?钱?|拿了多少?好处?|拿了多少?回扣?)/,
  // ZH-10 重复劣行预设——「是不是又撒谎/骗/瞒」，预设再次发生
  PRESUP_ZH_AGAIN_RE: /你是不是又[^，。！？；\n]{0,8}(?:撒谎|骗|瞒|忘|拖|迟到|犯错|惹祸|顶嘴|食言)/,

  // EN-1 When did you stop/start X-ing —— 预设曾经一直在做X
  PRESUP_EN_STOP_RE: /\bwhen did you (?:stop|start)\s+[\w-]+ing\b/i,
  // EN-2 How long have you been X-ing —— 预设该行为持续至今
  PRESUP_EN_LONG_RE: /\bhow long have you been\s+[\w-]+ing\b/i,
  // EN-3 Aren't you the one who —— 预设你就是做者
  PRESUP_EN_ARENT_RE: /\baren'?t you the (?:one|person) who\b/i,
  // EN-4 Who else was involved / knew about —— 预设你已参与
  PRESUP_EN_WHOELSE_RE: /\bwho else (?:was|were) involved\b|\bwho else knew about\b/i,
  // EN-5 What made you so X —— 预设该特质成立
  PRESUP_EN_MADE_RE: /\bwhat made you so\s+\w+/i,
  // EN-6 Why would anyone still trust you —— 预设做了不可信的事
  PRESUP_EN_TRUST_RE: /\bwhy would anyone (?:still )?(?:trust|believe|follow|listen to) you\b/i,
  // EN-7 Why do you always/keep X —— 预设习惯性/持续劣行（动词限贬损族）
  PRESUP_EN_ALWAYS_RE: /\bwhy do you (?:always|keep)\s+(?:blame|lie|cheat|hide|avoid|make excuses|complain|procrastinate|ignore|deflect|deny|making|lying|cheating|hiding|blaming|avoiding|complaining|procrastinating|ignoring|deflecting|denying)\b/i,
  // EN-8 How could you —— 预设对方做了该受指责的事（动词限贬损族，排除 tell 类惊喜形）
  PRESUP_EN_HOWCOULD_RE: /\bhow could you (?:do|say|treat|hurt|lie|cheat|ignore|let|betray)\b/i,
  // EN-9 What else did you take/hide —— 预设已拿/已藏（不收裸 do，度假问句会误伤）
  PRESUP_EN_WHATELSE_RE: /\bwhat else did you\s+(?:take|hide|lie about|destroy|delete)\b/i,
  // EN-10 Why can't you just admit —— 预设错已犯下
  PRESUP_EN_ADMIT_RE: /\bwhy can'?t you (?:just )?admit\b/i,
  // EN-11 Aren't you tired of X —— 预设X持续至今
  PRESUP_EN_TIRED_RE: /\baren'?t you (?:tired|sick|fed up|ashamed) of\b/i,
  // EN-12 (Isn't) it's time you stopped X —— 预设劣行持续（X限贬损族）
  PRESUP_EN_TIME_RE: /\b(?:isn'?t it|it'?s) time you stopped\s+(?:making excuses|lying|blaming|hiding|complaining|avoiding|pretending|procrastinating)\b/i,

  // 腿② QUESTION：盘问句式（句内疑问标记——问号或疑问词）
  QUESTION_MARK_RE: /[?？]/,
  QUESTION_WH_RE: /(为什么|怎么|什么时候|何时|多久|难道|凭什么|哪|谁)|\b(why|how|what|when|where|who|which)\b/i,

  // 豁免常量（可被负例注入置空）
  // 元话语/概念讨论（讨论预设加载技巧本身，不是运用它）
  META_ZH_RE: /(预设|诱导性|盘问|审问|反问|开放式|问法|提问方式|问卷|法庭|交叉询问|诱导倾向|修辞|话术|谬误|套路|陷阱题|设问)/,
  META_EN_RE: /(leading question|loaded question|presuppos|assumes?|rephrase|open question|objected|cross-examination|interrogat|fallac|survey design)/i,
  // 对冲表述（承认推断不确定）
  HEDGE_RE: /(也许|未必|不一定|大概|或许|可能|perhaps|maybe|possibly|probably|not necessarily|might)/i,
  // 显式证据模式（以证据而非盘问立论）
  EVIDENCE_MODE_RE: /(实测|数据|证据|实验|调研|统计|笔录|记录|experiment|data|evidence|survey|transcript)/i,
  // 否定翻转（明确拒绝该预设）
  NEGATION_FLIP_RE: /(不能说明|不代表|不等于|并不能|并不意味着|不意味着|推不出|does not mean|doesn'?t mean|doesn'?t imply|cannot conclude)/i,
};

// ─── 句子切分（保留句末标点——腿②的问号判定依赖它）────────────────────

function splitSentences(text) {
  if (typeof text !== 'string' || !text) return [];
  return text
    .split(/(?<=[。！？；!\?\n])|(?<=[a-zA-Z])\.\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ─── 主检测 ──────────────────────────────────────────────────

function checkLoadedQuestion(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }
  // 豁免：任一豁免形命中即整篇不判（元话语/对冲/证据模式/否定翻转不是运用该谬误）
  if (RE.META_ZH_RE.test(text) || RE.META_EN_RE.test(text)) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }
  const exemption = RE.HEDGE_RE.test(text) || RE.EVIDENCE_MODE_RE.test(text)
    || RE.NEGATION_FLIP_RE.test(text);
  if (exemption) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }

  const sentences = splitSentences(text);
  const matches = [];

  for (const sent of sentences) {
    // 腿①：预设加载形（中英任一）
    const presup =
      RE.PRESUP_ZH_ADMIT_RE.test(sent) ||
      RE.PRESUP_ZH_KNOWERR_RE.test(sent) ||
      RE.PRESUP_ZH_RULE_RE.test(sent) ||
      RE.PRESUP_ZH_ONLY_RE.test(sent) ||
      RE.PRESUP_ZH_INCOMP_RE.test(sent) ||
      RE.PRESUP_ZH_STILL_RE.test(sent) ||
      RE.PRESUP_ZH_STILL2_RE.test(sent) ||
      RE.PRESUP_ZH_HIDING_RE.test(sent) ||
      RE.PRESUP_ZH_ALWAYS_RE.test(sent) ||
      RE.PRESUP_ZH_BRIBE_RE.test(sent) ||
      RE.PRESUP_ZH_AGAIN_RE.test(sent) ||
      RE.PRESUP_EN_STOP_RE.test(sent) ||
      RE.PRESUP_EN_LONG_RE.test(sent) ||
      RE.PRESUP_EN_ARENT_RE.test(sent) ||
      RE.PRESUP_EN_WHOELSE_RE.test(sent) ||
      RE.PRESUP_EN_MADE_RE.test(sent) ||
      RE.PRESUP_EN_TRUST_RE.test(sent) ||
      RE.PRESUP_EN_ALWAYS_RE.test(sent) ||
      RE.PRESUP_EN_HOWCOULD_RE.test(sent) ||
      RE.PRESUP_EN_WHATELSE_RE.test(sent) ||
      RE.PRESUP_EN_ADMIT_RE.test(sent) ||
      RE.PRESUP_EN_TIRED_RE.test(sent) ||
      RE.PRESUP_EN_TIME_RE.test(sent);
    if (!presup) continue;

    // 腿②：盘问句式（同句问号或疑问词）
    const question = RE.QUESTION_MARK_RE.test(sent) || RE.QUESTION_WH_RE.test(sent);
    if (!question) continue;

    matches.push({
      sentence: sent.slice(0, 80),
      admit: RE.PRESUP_ZH_ADMIT_RE.test(sent),
      knowErr: RE.PRESUP_ZH_KNOWERR_RE.test(sent),
    });
  }

  if (matches.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }

  // 评分：单处共现 70；多处共现 95
  const count = matches.length;
  const score = count >= 2 ? 95 : 70;
  const details = '预设加载提问（问句内嵌未经证实的前提）(' + count + '处: '
    + matches.map(m => m.sentence.slice(0, 40)).join('；') + ')';

  return { hit: true, score, count, matches, details };
}

module.exports = {
  checkLoadedQuestion,
  __internals: RE,
};
