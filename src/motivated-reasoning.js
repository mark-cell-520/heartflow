/**
 * src/motivated-reasoning.js
 * [r257] 第 232 判别维度 motivated_reasoning（诉诸动机 / Bulverism：
 * 用「对方之所以这么说，是因为其立场/利益/身份」**替代**对其论点的
 * 实质回应）。
 *
 * 形态：先判定对方持有某立场（收钱/同行/受益方/既得利益者/被洗脑/
 * 屁股决定脑袋），随即据此宣布其论证无效、不值一驳、不必看——**全程
 * 不触及论点本身的内容**。C.S. Lewis 1941 年论文 "Bulverism" 命名该
 * 谬误：先解释对方为什么错，再假定他已经错了。
 *
 * 与 genetic_fallacy（第131维）的射程边界（刻意错开，不抢占）：
 *   · genetic_fallacy 管**追溯来源贬低内容**（「这观点出自XX之手，所以
 *     不值得看」），核心动作是**来源 → 内容**的传递。
 *   · 本维度管**动机推定 → 免回应**：关键是「先解释动机、再据此免掉回应
 *     义务」这一论证动作，且要求句中**同时存在动机推定段与免除回应段**。
 *   · 两族确有交叠（「他是同行，利益相关而已」两侧都能沾）。区分规则：
 *     句中若出现「所以/因此 + 不值一驳/不必回应/无视/不用看」这类**回应
 *     免除断言**，判本维度（动作更具体）；否则判 genetic_fallacy。
 *     探针实测：中文 5/5 中 4 条已被 genetic_fallacy/halo 代拦（这是既有
 *     维度的功劳，不构成重复建设理由），英文侧 5 条漏 2 条——
 *     "You only say that because you work for the competitor." 与
 *     "She is biased, so her argument can be dismissed." 中前者整句
 *     pass，是真实穿透。
 *
 * 判据（三腿共现，缺一不判）：
 *   腿① MOTIVE 动机推定段 —— 句中存在「(之所以|only|merely|just)
 *      × (这么说|say/said/claim/believe/think/argue) × (是因为|because
 *      /since) × (立场/利益/身份词)」或中文「无非是想/不过是/动机不纯/
 *      屁股决定脑袋/被收买/收了钱/既得利益」等把观点归因于言者处境的
 *      表达。
 *   腿② CLAIM 被归因的论点存在 —— 动机推定针对的是一个**可指认的观点
 *      表达**（「这么说」「他的观点」「her argument」）。纯人身描述
 *      （「他很有钱」）不判。
 *   腿③ DISMISS 免除回应断言 —— 句中出现据此**取消实质回应**的断言：
 *      「不值一驳/不必理会/不用看/无视/自然错误/肯定是错/观点不成立/
 *      dismissed/irrelevant/wrong by definition/need not be taken
 *      seriously/without merit/falls flat」。
 *   → verify 级：动机确实是评价证据时**应当考量的因素**（利益冲突披露
 *     正是学术规范要求），须先看论点本身是否另有独立依据。
 *
 * 为什么取 VERIFY 级：真实世界里利益相关方的论证确实需要更高审视标准，
 * 「他收了钱」也不必然使结论为假。verify 的含义是「以动机推定替代了对
 * 论点实质内容的审查，需回到论点本身找依据」。与 r206-r256 同口径只
 * 登记 VERIFY。
 *
 * 明确不判的（豁免——全部可被负例注入置空，见
 * test/round-257-motivated-reasoning.js）：
 *   · REASON_GIVEN 理由实质段：动机推定之后给出**可核查的实质理由**
 *     （「是因为方案里第三条确实超预算」带具体条款/数据/事实）。
 *   · CONFLICT_DISCLOSE 利益冲突正当披露：「他是同行，但数据核对过
 *     没问题」「利益相关，但他的推理过程我逐条验证了」——说话人**披露**
 *     了动机因素并继续处理论点。
 *   · META_CONCEPT 谬误概念转述与教学（诉诸动机/布尔沃里斯姆/bulverism）。
 *   · HEDGE 对冲结论（可能/也许/大概/perhaps/probably）。
 *   · QUESTION 疑问句。
 */
'use strict';

// ─── 腿①：动机推定段（把观点归因于言者处境）────────────────────────
// 中文族 A：「(之所以)…(这么说/反对/支持)…是因为…」
// r257 修正：原版 claimZh 只认「这么说/他的观点」，漏掉「之所以反对/支持」
// 这类动词直接作论点的句子。修正后 motive 正则本身覆盖动词论点形态。
const MOTIVE_A_ZH = [
  /(之所?以)?[^，。；]{0,12}(这么|这样)?(说|讲|认为|觉得|支持|反对|坚持|声称|宣称|主张|批?评|怀疑|否认)[^，。；]{0,18}(是因?为|不过是?因为|无非是因?为|只不过因?为)/,
  /(收[了到]?钱|被收买|拿了好处|既得利益|利益相关|屁股决定脑袋|动机不纯|别有用心|居心不良)/,
  /(无非|不过|只不过|只是)(想|是为?了?想|是为?了|出于)/,
  /(他是|她是|对方是|这些人?是|他自己|她自己)[^，。；]{0,12}(同行|对手|竞争|受益[方者]|获利[方者]|当事方|圈内人|自己人|既得利益[者者])/,
  /(只是|不过|无非|只不过)[^，。；]{0,16}(是因为|是因?为)[^，。；]{0,16}(受益|获利|同行|竞争|利益|立场)/,
  /(背后|幕后|背后有)[^，。；]{0,10}(利益|好处|金主|势力|集团)/,
  /(利益输送|拿回扣|收受贿赂|被充值|被当枪?使)/,
  /(出于|基于)[^，。；]{0,8}(自己|自身|个人)[^，。；]{0,6}(利益|好处|立场|角度|位置)/,
  /(竞争|同行|对手|利益集团)[^，。；]{0,6}(的?攻击|抹黑|污蔑|诋毁|带节奏)/,
  // 「站[在到]…立场」仅在带**排他归因标记**（无非/不过是/只是）时才算
  // 动机推定；单纯的「站在客户立场提意见」是正当换位思考，不算谬误。
  /(无非|不过|只不过|只是)[^，。；]{0,12}(站[在到])[^，。；]{0,8}(立场|角度|位置)/,
];

// 英文族 A：only/merely/just say that because / is biased so / dismissed
const MOTIVE_A_EN = [
  /\b(?:only|merely|just|simply)\s+(?:say|says|said|saying|claim|claims|claimed|think|thinks|believe|believes|argue|argues|argued|defending|defends|protect|protects|protecting|promoting|promotes|advancing|advances)\b[^.!?]{0,60}\b(?:because|since|as)\b/i,
  /\b(?:you|he|she|they|people)\s+(?:are|is|'re)\s+(?:just\s+)?(?:biased|paid|bought|on\s+the\s+payroll|in\s+someone's\s+pocket)\b/i,
  /\b(?:would|will|could)\s+(?:say|say that|think that)\s[^.!?]{0,40}\b(?:because|since)\b/i,
  /\b(?:they|he|she|you)\s+(?:are|is)\s+just\s+(?:defending|protecting|promoting|advancing)\b[^.!?]{0,40}\b(?:interests?|turf|position|agenda)\b/i,
  /\b(?:only|merely|just)\s+(?:protecting|defending|promoting|advancing)\s+(?:his|her|their|its|own)\s+(?:own\s+)?(?:interests?|turf|position|agenda)\b/i,
  /\b(?:only|merely|just)\s+(?:think|believes?|says?|claims?)\s+(?:that\s+)?\w+[^.!?]{0,40}\bbecause\b[^.!?]{0,40}\b(?:pays?|paid|salary|boss|employer|client|funds?|profits?|benefits?)\b/i,
  /\b(?:only|merely|just)\s+(?:think|believes?|says?|claims?)\s+(?:that\s+)?\w+[^.!?]{0,40}\bbecause\b[^.!?]{0,40}\b(?:young|naive|inexperienced|immature|unqualified|jealous|envious|bitter)\b/i,
  /\b(?:is|are)\s+(?:just\s+)?a\s+(?:mouthpiece|shill|stooge|puppet|front)\s+for\b/i,
  /\b(?:only|merely|just)\s+(?:a\s+)?(?:paid|bought)\s+(?:mouthpiece|shill|voice)\b/i,
  /\b(?:you|they|he|she)\s+(?:only\s+)?(?:think|believe|say)\s+(?:that|this|so)\s+only\s+because\b/i,
];

// ─── 腿③：免除回应断言（据此取消实质回应）──────────────────────────
const DISMISS_ZH = [
  /不值[一得]?驳/, /不必理会/, /不用理会/, /无须理会/, /不须理会/,
  /不用看/, /不必看/, /无须看/, /不值得看/, /不配/,
  /无视/, /置之不理/, /一笑置之/, /不必当真/, /不用当真/, /何必当真/, /不必在意/, /无须在意/,
  /自然(是)?错/, /肯定(是)?错/, /必然(是)?错/, /当然是错/,
  /根本(不|没)(成立|值|可信|靠)/, /完全不值/, /毫?无(价值|道理|依据)/,
  /观点(自然|肯定|必然|根本)?(错误|不成立|无效|作废|破产)/,
  /论证(自然|肯定|必然|根本)?(无效|不成立|作废|破产)/,
  /据此(就)?(可以)?(否定|推翻|否决|拒绝)/,
  /(可以|应当|应|该)(直接)?(否定|推翻|否决|排除|拒绝)/,
];
const DISMISS_EN = [
  /\b(?:can\s+be\s+)?dismiss(?:ed)?\b/i,
  /\birrelevant\b/i,
  /\bnot\s+worth\b/i,
  /\bwithout\s+merit\b/i,
  /\bneed\s+not\s+be\s+taken\s+seriously\b/i,
  /\bcan\s+be\s+(?:ignored|disregarded|rejected)\b/i,
  /\bwrong\s+by\s+definition\b/i,
  /\bno\s+need\s+to\s+(?:consider|read|answer)\b/i,
  /\bfails?\s+flat\b/i,
  /\bautomatically\s+(?:wrong|false|invalid)\b/i,
];

// ─── 腿③ 补充通道：纯动机推定句式（无显式 dismiss 词）────────────────
// Bulverism 的最纯粹形态是「You only say that because you work for the
// competitor.」——句中**没有**任何 dismiss 词，但动机推定本身就完成了
// 「该观点不值一顾」的断言（Lewis 原文定义：先解释对方为什么错，再假定
// 他已经错了）。这类句子若要求显式 dismiss 词会整族漏判。
// 限定条件（防误报）：必须是 only/merely/just/无非/不过是 这类**排他归因
// 标记** + 论点动词 + because/是因为，即「你的观点**不过是**X 的产物」。
// 单纯「他说X是因为Y」是正当因果解释（天气不错所以心情很好同类），不判。
//
// r257 三版：把 PURE 通道从「句式枚举」改为「**动机推定族命中 + 句中
// 无可核查理由**」这一语义条件。插桩实测（probe-legs3）6 条纯形态
// miss 全部因 PURE 正则字面量覆盖不到（「不过是因为他是同行」「不过是
// 出于自己的利益考量」「You are just saying that because you are on the
// payroll」三种不同表层），而它们与良性句「他之所以成功，是因为他每天
// 坚持锻炼」的唯一区别正是**归因对象是言者处境** vs **可核查事实**——
// 这个区别已在 REASON_GIVEN 豁免链里实现了。故：motivate 命中 + 无
// REASON_GIVEN = 纯动机推定，腿③ 直接放行。
const PURE_MOTIVE_ZH = [
  /(之所?以)?[^，。；]{0,12}(这么|这样)?(说|讲|认为|支持|反对|坚持|声称|宣称|主张)[^，。；]{0,6}(无非|不过|只不过|只是)(是想|是为?了|出于|因?为)/,
  /(无非|不过|只不过|只是)(想|是为?了|出于)[^。；]{0,18}(而已|罢了)/,
];
const PURE_MOTIVE_EN = [
  /\b(?:only|merely|just|simply)\s+(?:say|says|said|claim|claims|think|believes?|argues?)\s+(?:that\s+)?\w+[^.!?]{0,40}\bbecause\b/i,
];

// ─── 豁免：理由实质段（动机推定后给出可核查理由）───────────────────
// 关键鉴别：探针实测「他之所以反对，是因为方案里第三条确实超预算了」必须
// PASS——句中「是因为」后面跟的是**可核查的具体条款**而非纯处境归因。
const REASON_GIVEN = [
  /(是因?为|由于|基于)[^。；]{0,20}(第[一二三四五六七八九十百0-9]+[条章节款])/,
  /(是因?为|由于|基于)[^。；]{0,24}(数据|证据|报告|测算|实验|统计|审计|记录|文献)/,
  /(是因?为|由于|基于)[^。；]{0,24}(超过?|超出|低于|高于|不符|违反|违背|缺少|缺失)/,
  /(而且|并且|同时|此外)?(给出|提出|提供|附上|引用)[^。；]{0,12}(数据|证据|理由|报告|材料|依据)/,
  /(because|since)\b[^.!?]{0,60}\b(?:data|evidence|report|figures?|numbers?|measurements?|audit|study|records?)\b/i,
  /(because|since)\b[^.!?]{0,60}\b(?:exceeds?|violates?|contradicts?|falls?\s+short|is\s+below|is\s+above)\b/i,
];

// ─── 豁免：利益冲突正当披露（披露动机因素并继续处理论点）────────────
const CONFLICT_DISCLOSE = [
  /(但[是]?|然而|不过|只是)[^。；]{0,24}(核对|验证|查证|核实|审过|逐条|独立|交叉)/,
  /(但[是]?|然而|不过)[^。；]{0,20}(没?问题|成立|可信|靠|站得住)/,
  /(利益相关|同行|竞争)[^。；]{0,16}(，|,)?(但|然而|不过|可是)/,
  /\b(?:but|however|although|though|yet)\b[^.!?]{0,60}\b(?:verified|checked|cross-checked|confirmed|independently)\b/i,
];

// ─── 豁免：谬误概念转述/教学/对冲/疑问 ─────────────────────────────
const META_CONCEPT = [
  /诉诸动机/, /布尔沃里斯姆/, /bulverism/i, /动机推定/, /诉诸处境/,
  /ad hominem/i, /人身攻击/, /genetic fallacy/i, /基因谬误/,
];
const HEDGE = [
  /可能/, /也许/, /大概/, /恐怕/, /说不定/, /或许/,
  /\bmaybe\b/i, /\bperhaps\b/i, /\bprobably\b/i, /\bmight\b/i, /\bmay\b/i,
];
const QUESTION = [
  /？/, /\?/, /吗[。.?？]?$/, /呢[。.?？]?$/,
];

// ─── 工具 ────────────────────────────────────────────────────────
function _MISS() {
  return { hit: false, score: 0, detail: '', count: 0 };
}

// 语言判定：以命中的动机推定族语言为准。
// r257 修正（插桩实测）：原实现 `zh = mZh || !mEn`，纯英文句 mEn=1 时
// !mEn=0 但 mZh 也=0 → zh=0 走 en，逻辑没错；然而「We can dismiss his
// objection; he is only protecting his own interests.」的 MOTIVE_A_EN
// 第4条因句首 dismiss 打头而未命中 → mZh=mEn=0 → 落到 zh 分支，中文
// 腿全 miss。修正：**先按动机族命中定语言，都未命中时按字符占比**，
// 且英文特征词（dismiss/irrelevant/merit）出现即优先 en。
function _lang(text) {
  for (const re of MOTIVE_A_ZH) if (re.test(text)) return 'zh';
  for (const re of MOTIVE_A_EN) if (re.test(text)) return 'en';
  // 未命中动机族时的兜底：英文特征词或拉丁占比优先
  if (/\b(?:dismiss(?:ed)?|irrelevant|without\s+merit|not\s+worth)\b/i.test(text)) return 'en';
  const zh = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (text.match(/[A-Za-z]/g) || []).length;
  return zh >= en ? 'zh' : 'en';
}

function _hasAny(list, text) {
  return list.some(re => re.test(text));
}

/**
 * 主判别函数。
 * @param {string} text 已归一化文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMotivatedReasoning(text) {
  if (typeof text !== 'string' || text.length < 8) return _MISS();

  // ── 豁免链（顺序无关，命中任一即不判）──
  if (_hasAny(META_CONCEPT, text)) return _MISS();
  if (_hasAny(HEDGE, text)) return _MISS();
  if (_hasAny(QUESTION, text)) return _MISS();
  if (_hasAny(REASON_GIVEN, text)) return _MISS();
  if (_hasAny(CONFLICT_DISCLOSE, text)) return _MISS();

  const lang = _lang(text);

  // 腿①：动机推定段
  const motiveZh = _hasAny(MOTIVE_A_ZH, text);
  const motiveEn = _hasAny(MOTIVE_A_EN, text);
  if (!motiveZh && !motiveEn) return _MISS();

  // 腿②：被归因的论点须可指认。
  // r257 二版修正：原实现要求句中出现「这么说/他的观点」这类观点名词，
  // 插桩实测整族漏判——「他之所以反对，不过是因为他是同行，利益相关
  // 而已。」的论点就是「反对」这个动词本身（动机推定句已内含被归因的
  // 观点表达），句中再无观点名词。修正为**或**结构：观点名词显式出现，
  // **或**动机推定句自带论点动词（之所?以…反对/支持/认为），二者有
  // 其一即认定论点可指认。
  // r257 四版：claimZh 补「这些/那些」作论点指代的中间隔形态——「他说
  // 这些无非是想出名」中「这些」与论点动词之间隔了排他标记，原正则
  // 要求紧邻导致漏判。改为允许 ≤8 字间隔。
  const claimZh = /(这么|这样)(说|讲|认为|支持|反对)|(这|那)(些|些话|种话)[^，。；]{0,8}(说|讲|法|观点|看法|想|是指)|(他的|她的|他们的|对方的|这套|这些|这份)?(观点|说法|论点|论证|立场|主张|意见|结论|判断|建议|提议|方案|报告|分析)/;
  const claimVerbZh = /(之所?以)[^，。；]{0,12}(说|讲|认为|觉得|支持|反对|坚持|声称|宣称|主张|批?评|怀疑|否认|投[赞反成]|持)/;
  const claimEn = /\b(?:say|says|said|saying|claim|claims|argue|argues|argument|view|position|opinion|belief|believe|believes|think|thinks|objection|report|findings?|warning|advice|suggestion|proposal|analysis|conclusion|statement|assertion)\b/i;
  if (lang === 'zh'
    ? !(claimZh.test(text) || claimVerbZh.test(text))
    : !claimEn.test(text)) return _MISS();

  // 腿③：免除回应断言（显式通道 或 纯动机推定通道）
  // r257 三版：显式 dismiss 词未命中时，若动机推定族已命中（腿①）且
  // 句中不存在可核查理由（REASON_GIVEN 已在豁免链拦截），即认定构成
  // 纯动机推定——Lewis 的 Bulverism 定义本身就是「先解释对方为什么错，
  // 再假定他已经错了」，动机推定段自身即承载免回应断言。
  const dismissList = lang === 'zh' ? DISMISS_ZH : DISMISS_EN;
  const pureList = lang === 'zh' ? PURE_MOTIVE_ZH : PURE_MOTIVE_EN;
  const hasDismiss = _hasAny(dismissList, text);
  const hasPure = _hasAny(pureList, text) || (motiveZh || motiveEn);
  if (!hasDismiss && !hasPure) return _MISS();
  const via = hasDismiss ? 'dismiss' : 'pure-motive';

  // 定位动机表达用于 detail 描述
  let motiveDesc = '';
  if (lang === 'zh') {
    const m = text.match(/(收[了到]?钱|被收买|拿了好处|既得利益|利益相关|屁股决定脑袋|动机不纯|别有用心|居心不良)/);
    if (m) motiveDesc = m[1];
    else {
      const m2 = text.match(/(之所?以)?[^，。；]{0,12}(这么|这样)?(说|讲|认为|觉得|支持|反对|坚持|声称|宣称|主张)[^，。；]{0,18}(是因?为|不过是?因为|无非是因?为|只不过因?为)/);
      if (m2) motiveDesc = m2[0].slice(0, 18);
    }
    if (!motiveDesc) motiveDesc = '动机推定';
  } else {
    const m = text.match(/\b(?:only|merely|just|simply)\s+(?:say|says|said|claim|claims|think|believes?|argues?)\b[^.!?]{0,40}\b(?:because|since)\b[^.!?]{0,30}/i)
      || text.match(/\b(?:biased|paid|bought|on\s+the\s+payroll)\b[^.!?]{0,30}/i);
    motiveDesc = m ? m[0].slice(0, 46) : 'motive attribution';
  }

  return {
    hit: true,
    score: 70,
    detail: `诉诸动机(${lang}/${via}: 以「${motiveDesc}」推定言者处境替代对论点实质内容的回应，未审论点自身依据)`,
    count: 1,
  };
}

module.exports = { checkMotivatedReasoning };
