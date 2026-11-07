'use strict';

/**
 * src/anonymous-source-claim.js
 * 「无署名信源 × 强断言」检测器（第 215 个判别维度，r228）
 *
 * [r228 立项] philosophy_decision 本体在 v6.8.145（214 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为字符串 "unknown"，按轮次纪律不当实质背书）。
 *
 * 立项缺口实证（scripts/round-228/probe-detail-r228.js，直调 src/gate.js
 * v6.8.145，20 条候选句）：
 *   · 「内部人士透露，这款产品存在严重的安全漏洞。」→ gate pass、
 *     findings 全空（真零命中）
 *   · 「Sources familiar with the matter say the deal is already signed.」
 *     → gate pass、findings 全空（真零命中）
 *   · 其余匿名信源句仅被 vagueness(20)/clickbait(15) 弱命中，无任何维度
 *     判「信源不可验证」这个结构本身。
 * 覆盖度检查：知情人士/内部消息/不愿透露姓名/sources familiar 在 src/ 下
 * 的命中全部落在 sole-narrative / perfect-error / poisoning-the-well /
 * index.js 的**其他用途**（口径垄断、完美错误、毒化井）上，无一判「无署
 * 名信源 × 强断言」；unsupported_claim（无依据断言）判的是**完全没有信源**
 * 的裸断言，本族判的是**有信源但信源不可验证**——两者互补，不重叠。
 *
 * 外部来源（真实，未编造）：三层搜索实况落盘 /tmp/hf-scout/——
 *   · HN Algolia "self-fulfilling prophecy" tags=story：nbHits 有值但全为
 *     React/项目管理类推文，无判别方法论文。
 *   · Semantic Scholar "self-fulfilling prophecy"：HTTP 429 Too Many
 *     Requests（无 API key），两次空返。
 *   · GitHub API "fallacy detection" sort=stars：latent-variable/
 *     Real_time_fallacy_detection ★120（Whisper+LLM 实时分类器，依赖 LLM
 *     生成，与心虫纯规则引擎不同构）、tmakesense/logical-fallacy ★21
 *     （在线检测器索引清单）、dhfbk/faina ★5（NAACL 2025 细粒度谬误检测）。
 *     三个仓库均为 LLM/数据集路线，无可移植的纯规则判据。
 *   · 概念背景取自 Wikipedia「Self-fulfilling prophecy」与其
 *     「Self-defeating prophecy」互补词条（预测影响行为、行为反使预测成真
 *     或落空的结构），仅作方向背景。
 * 判据为心虫自有纯规则实现（零 LLM 依赖）。
 *
 * 辨别的族：无署名信源 × 强断言（anonymous sourcing of unverifiable
 * claims）——**用一个无法指认、无法核验的信源，承载一个确定性的强事实断
 * 言**，使读者无从验证也无从追责：
 *   · 内部人士透露，这款产品存在严重的安全漏洞。
 *   · 有内部消息称，公司已经决定裁员三分之一。
 *   · 据不愿透露姓名的官员表示，双方已经达成了秘密协议。
 *   · 据知情人士透露，这项政策将在下个月正式落地。
 *   · Sources familiar with the matter say the deal is already signed.
 *   · An anonymous source close to the investigation said the suspect
 *     had been arrested.
 *
 * 为什么这是判别者的核心缺口（对齐「能准确寻找答案——寻真而非似是而
 * 非」）：可验证性是证据纪律的**入口条件**。一个断言的证据价值不只取决于
 * 内容是否自洽，更取决于**有没有一条可回溯的核验路径**。无署名信源恰好切
 * 断这条路径——信源不可指认，则不可交叉验证、不可追责、不可更正；此时无
 * 论措辞多么确定，该断言的证据强度都等于零。这不是「可能在说谎」，而是
 * **结构上无法被证实也无法被证伪**：它把举证责任从说话人转移给听众。这
 * 与 unsupported_claim（第 56 维度附近族，完全无信源的裸断言）是不同攻
 * 击面：后者的问题是「没有来源」，前者的问题是「有来源但来源不可核验」，
 * 后者更危险，因为它借「有消息」的形式获得了表面可信度。
 *
 * 与既有维度的边界（r228 归因）：
 *   · unsupported_claim 管「无任何信源的裸断言」（无信源标记）；
 *     本族管「有信源标记但信源不可指认」——攻击性更强。
 *   · vagueness 管措辞含糊（模糊量词/含糊谓词），本族信源可以非常具体
 *     （「下个月」「三分之一」），问题不在含糊而在不可核验。
 *   · clickbait 管标题党式引诱点击，本族不涉及引诱结构。
 *   · sole_narrative（第 69 维度）管口径垄断与压制核验，本族不涉及要求
 *     听众接受单一叙事，涉及的是信源本身的不可回溯。
 *   · poisoning_the_well（第 134 维度）管预先毒化信源/人格，本族不涉及
 *     对信源的评价，涉及的是信源的匿名性。
 *
 * 判据（主判据两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① SOURCE 无署名信源标记（裸名词形态，r161 教训：去掉前后缀仍
 *     命中）：
 *     ZH：知情人士|内部人士|匿名人士|消息人士|灵通人士|业内人士|圈内人|
 *       知情者|内部消息|内部人士|知情人士|匿名消息|消息源|人士称|人士表
 *       示|不愿透露姓名|不便透露姓名|要求匿名|匿名消息源|消息灵通|接近
 *       (?:该|此|相关)?(?:公司|事件|调查|交易|谈判|项目|案件)?的?人|
 *       有消息称|据悉(?:有)?(?:知情|内部)|据(?:知情|内部|匿名|不具名)|
 *       未具名|不具名|隐去姓名|化名
 *     EN：sources? familiar|people familiar|sources? close|
 *       (?:source|sources|official|officials|executive|person|people)
 *       (?:briefed|close|familiar)|anonymous (?:source|sources|official)|
 *       insiders?|on (?:the )?(?:condition of )?anonymity|on background|
 *       off the record|asked not to be (?:named|identified)|
 *       not authorized to speak|spoke on condition|declined to be named|
 *       sources say|sources said|sources tell|people briefed
 *   · 腿② CLAIM 强断言封装（确定性断言词，或具体化细节：数字/日期/比例）：
 *     ZH：存在|确有|确实存在|真的存在|已经|已|即将|将会|将于|确定|确认|
 *       坐实|属实|确有其事|事实上|据悉已|落地|达成|决定|敲定|定案|通过|
 *       批准|签署|签约|实施|关停|裁员|点名|通报|约谈|调查|介入|查处|
 *       暂停|取消|上调|下调|增持|减持|离职|上任|调任|约谈|处分|免职|
 *       (?:下|本|上)个?月|月底|日前|近期内|周内|年内
 *     EN：exists|there (?:is|are) a|confirmed|has been|have been|will be|
 *       is set to|is going to|already|decided|agreed|signed|approved|
 *       launched?|shut down|laid off|announced|under investigation|
 *       will (?:be|soon)|plans? to|is planning
 *   · 腿②须与腿①相距 WIN_SOURCE_CLAIM（ZH 110 字 / EN 320 字符）以内。
 *     无邻近窗要求则「知情人士谈行业趋势，未来可能会有变化」这类**没有具
 *     体断言**的泛谈不判。
 *
 * 为什么取 VERIFY 级：单句也可能是对新闻伦理的**正确讨论与批评**（「这家
 * 媒体整篇靠匿名信源支撑，可信度要打折扣」正是本族要教的判别动作）、新
 * 闻报道转述、传播学课堂案例。rewrite 会误伤这些正当文本（与 r206-r214
 * 评价族同口径）。verify 的含义是「这段文本用不可指认的信源承载了确定性
 * 断言，需要先取得具名信源或可核验的书面材料再评估其可信度」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 已署名/可回溯信源（具名媒体/官方通报/声明/公告/可指认主体）：
 *     据新华社|据路透社|据法新社|据美联社|据彭博社|据央视|据人民日报|
 *     据《[^》]+》|据(?:警方|消防|医院|校方|公司|法院|检方|卫健委|教育
 *     部|外交部|市政府|省政府|县政府|镇政府|街道|社区|官方|发言人|新闻
 *     办|通报|公告|声明|财报|年报|招股书|统计|数据|调查|报告|研究|专家|
 *     学者|医生|律师|目击者|当事人|家属|老师|学生|业主)
 *     EN according to (?:Reuters|Bloomberg|AP|the Associated Press|BBC|
 *     CNN|the Wall Street Journal|the New York Times|the Financial
 *     Times|the Guardian)|on the record|a spokesperson (?:said|says)|
 *     the (?:company|ministry|department|police|government) (?:said|says|
 *     confirmed)|in a (?:statement|press release|filing|report)|published
 *     (?:in|by)|per the filing|according to the (?:report|study|filing)
 *   · 正确响应形（明确标注未证实/无法核实/已辟谣）：
 *     未经证实|未经核实|无法核实|暂无法确认|未能证实|无法证实|尚无法确认|
 *     消息未经|传言不实|系谣言|已辟谣|不属实|纯属谣言|消息不实|尚无定论|
 *     仍在讨论|未最终确定|未确定|有待证实|有待确认|存疑|不可信|打折扣|
 *     需要核实|交叉验证|独立证实
 *     EN unverified|unconfirmed|could not be (?:independently )?verified|
 *     has not been (?:confirmed|verified)|not (?:yet )?confirmed|
 *     denied|denies|is false|a hoax|debunked|could not be reached|
 *     declined to comment|no comment|remains unconfirmed
 *   · 概念/教学转述：新闻伦理|消息源保护|匿名消息源|信源|记者的匿名|
 *     新闻专业|传播学|课程|教材|课堂|讲座|教案|概念|称为|定义为|悖论|
 *     方法论|新闻学|采访规范|编辑规范|核实流程|新闻道德
 *     EN journalism|newsroom|editorial|source protection|anonymous
 *     sourcing|media ethics|press ethics|course|textbook|lecture|
 *     concept|called|defined
 *   · 疑问句（含 ?/？，且无反问标记——反问标记形与 r216 collider_bias
 *     同口径：难道/岂/凭什么/何尝/岂不是/谈何/…吗？/ isn't it /
 *     doesn't that / how else / what else / who doesn't / if not）；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/还要看/
 *     而不是/而非；EN does not mean / not necessarily / depends on /
 *     cannot conclude）。
 */

// ─── 腿① SOURCE 无署名信源标记（中文）──────────────────────────
// r161 教训：枚举腿必须含裸名词形态——「知情人士」「内部人士」去掉前后缀
// 仍须命中。
const SOURCE_ZH = [
  // 裸名词族（去掉前后缀仍命中）
  /知情人士/,
  /内部人士/,
  /匿名人士/,
  /消息人士/,
  /灵通人士/,
  /业内人士/,
  /圈内人士/,
  /知情者/,
  /匿名消息源/,
  /消息源/,
  /内部消息/,
  /匿名消息/,
  /未具名/,
  /不具名/,
  // 匿名动作形
  /不愿透露姓名/,
  /不便透露姓名/,
  /不愿公开身份/,
  /要求匿名/,
  /隐去姓名/,
  /化名(?:透露|表示|称|说)/,
  // 信源引导形
  /据(?:知情|内部|匿名|不具名|未具名)/,
  /有消息称/,
  /有(?:内部|可靠|匿名|圈内)消息/,
  /据悉(?:有)?(?:知情|内部|匿名)/,
  /人士(?:称|表示|透露|说|指出|爆料|曝出)/,
  /(?:一|两|几)位?接近[^，。；]{0,14}(?:人士|人员|消息源|高管|官员)/,
  /接近(?:该|此|相关)?(?:公司|事件|调查|交易|谈判|项目|案件|部门)的?(?:人士|人员|高管|官员)/,
];

// ─── 腿① SOURCE 无署名信源标记（英文）──────────────────────────
const SOURCE_EN = [
  // 裸名词族
  /sources?\s+familiar/i,
  /people\s+familiar/i,
  /sources?\s+close/i,
  /anonymous\s+(?:source|sources|official|officials)/i,
  /insiders?/i,
  /sources?\s+(?:say|said|tell|told|describe|indicate|suggest)/i,
  /people\s+briefed/i,
  /sources?\s+briefed/i,
  // 匿名条件形
  /on\s+(?:the\s+)?condition\s+of\s+anonymity/i,
  /spoke?\s+on\s+condition/i,
  /on\s+background/i,
  /off\s+the\s+record/i,
  /asked\s+not\s+to\s+be\s+(?:named|identified)/i,
  /declined\s+to\s+be\s+named/i,
  /not\s+authorized\s+to\s+speak/i,
  /not\s+for\s+attribution/i,
  /deep\s+throat/i,
  // 信源身份 + 距离形
  /(?:source|sources|official|officials|executive|executives|person|people)\s+(?:close|familiar|briefed)\s+to/i,
  /(?:a|an|one|two|several)\s+(?:source|official|executive|person)\s+(?:close|familiar)/i,
];

// ─── 腿② CLAIM 强断言封装（中文）────────────────────────────────
const CLAIM_ZH = [
  // 存在/确定性断言
  /存在|确有|确实存在|真的存在|确有其事|属实|坐实/,
  /事实上|实际上|据悉已|据了解已/,
  /已经|即将|将会|将于|日前已/,
  /确定|确认|敲定|定案|获批|批准|通过/,
  /达成|签署|签约|签订|落地|实施|执行/,
  /关停|裁员|点名|通报|约谈|调查|介入|查处|暂停|取消/,
  /处分|免职|停职|调任|上任|离职|辞职|减持|增持/,
  // 具体化细节（数字/日期/比例）
  /\d/,
  /(?:下|本|上|这个)个?月|月底|日前|近期内|周内|年内|季度内/,
];

// ─── 腿② CLAIM 强断言封装（英文）────────────────────────────────
const CLAIM_EN = [
  /exists|there\s+(?:is|are)\s+a/i,
  /confirmed|has\s+been|have\s+been|had\s+been/i,
  /will\s+be|is\s+set\s+to|is\s+going\s+to|plans?\s+to|is\s+planning/i,
  /already|decided|agreed|signed|approved/i,
  /launched?|shut\s+down|laid\s+off|announced|under\s+investigation/i,
  /arrested|charged|indicted|resigned|fired|dismissed/i,
  // r161 教训：收裸名词形态——「agreement / a deal was reached」去掉后缀仍命中
  /agreements?|concluded|reached|deals?\b|settled|paused?|blocked?|banned/i,
  // r228 补：vulnerability / decision / shutdown 裸名词形态（攻击样本实测漏判）
  /vulnerabilit(?:y|ies)|security\s+(?:flaw|flaws|hole|holes|issue|issues|bug|bugs)/i,
  /decisions?|shutdowns?|cancellations?|launches?/i,
  /\d/,
];

// ─── 豁免一：已署名/可回溯信源 ────────────────────────────────
// 具名媒体、官方通报、可指认主体——这些信源有可回溯的核验路径。
const EXEMPT_ATTRIBUTED_ZH = [
  /据新华社|据路透社|据法新社|据美联社|据彭博社|据央视|据人民日报/,
  /据《[^》]{1,20}》/,
  /据(?:警方|消防|医院|校方|公司|法院|检方|卫健委|教育部|外交部|市政府|省政府|县政府|镇政府|街道|社区|官方|发言人|新闻办)/,
  /据(?:通报|公告|声明|财报|年报|招股书|统计|数据|调查|报告|研究|披露|公示)/,
  /据(?:专家|学者|医生|律师|目击者|当事人|家属|老师|学生|业主|同事|邻居|朋友|领导|上级|下属)/,
  /(?:通报|公告|声明)(?:称|显示|指出|表示)/,
  /(?:官方|警方|院方|校方|公司)(?:通报|回应|表示|证实)/,
  /发言人(?:称|表示|说)/,
  /署名(?:为|作者|文章)/,
];
const EXEMPT_ATTRIBUTED_EN = [
  /according\s+to\s+(?:Reuters|Bloomberg|AP\b|the\s+Associated\s+Press|BBC\b|CNN\b|the\s+Wall\s+Street\s+Journal|the\s+New\s+York\s+Times|the\s+Financial\s+Times|the\s+Guardian|the\s+Washington\s+Post|NPR\b|AFP\b)/i,
  /on\s+the\s+record/i,
  /a\s+spokes(?:person|man)\s+(?:said|says|confirmed)/i,
  /the\s+(?:company|ministry|department|police|government|agency|university)\s+(?:said|says|confirmed|announced)/i,
  /in\s+a\s+(?:statement|press\s+release|filing|report|letter)/i,
  /published\s+(?:in|by)/i,
  /per\s+the\s+filing/i,
  /according\s+to\s+the\s+(?:report|study|filing|data)/i,
  /named\s+(?:source|official)/i,
];

// ─── 豁免二：正确响应形（标注未证实/无法核实/已辟谣）───────────
const EXEMPT_CORRECT_ZH = [
  /未经证实|未经核实|无法核实|未能核实/,
  /暂无法确认|尚无法确认|无法证实|未能证实|暂无法证实/,
  /消息未经|传言不实|系谣言|纯属谣言|消息不实|已辟谣|不属实/,
  /尚无定论|未有定论|未最终确定|仍未确定|还在讨论|仍在讨论/,
  /有待证实|有待确认|有待核实/,
  /存疑|可疑|不可信|打折扣|需要核实|交叉验证|独立证实/,
  /拒绝(?:透露|公开|回应)|未予回应|不予回应|未获回应/,
];
const EXEMPT_CORRECT_EN = [
  /unverified|unconfirmed/i,
  /could\s+not\s+be\s+(?:independently\s+)?verified/i,
  /has\s+not\s+been\s+(?:confirmed|verified|corroborated)/i,
  /not\s+(?:yet\s+)?confirmed|remains\s+unconfirmed/i,
  /denied|denies|is\s+false|a\s+hoax|debunked/i,
  /could\s+not\s+be\s+reached/i,
  /declined\s+to\s+comment|no\s+comment/i,
  /no\s+evidence|lacks?\s+(?:corroboration|evidence)/i,
];

// ─── 豁免三：概念/教学转述 ────────────────────────────────────
// r228 收窄：裸「匿名消息源」「信源」不出现在本清单——它们会打在攻击句自
// 己身上（「匿名消息源称，项目已经关停」整句被自己豁免）。元话语豁免要求
// 句中同时出现教学/学术框架标记，与 r213 mediator_confusion 同口径。
const EXEMPT_META_ZH = [
  /新闻伦理|新闻道德|新闻专业|传播学|新闻学/,
  /消息源保护|信源保护/,
  /匿名消息源(?:的)?(?:使用|规范|问题|伦理|风险|讨论|边界|前提|条件)/,
  /信源(?:保护|核实|审查|可信度|评价|评估|管理|制度)/,
  /采访规范|编辑规范|编辑方针|核实流程/,
  /课程|教材|课堂|讲座|教案|习题|教科书/,
  /概念|称为|定义为|所谓|悖论|方法论|案例教学/,
  /记者的?匿名/,
  /记者(?:使用|采用|依赖|依赖的)/,
];
const EXEMPT_META_EN = [
  /journalism|newsroom|editorial/i,
  /source\s+protection|anonymous\s+sourcing|media\s+ethics|press\s+ethics/i,
  /course|textbook|lecture|syllabus/i,
  /concept|called|defined/i,
  /reporters?\s+(?:use|using|used|rely|relying)/i,
  /credibility\s+of\s+(?:anonymous|unnamed)/i,
];

// 推理否定/对冲（句级豁免）
const HEDGE_ZH = /不代表|不意味着|推不出|未必|不一定|取决于|还要看|而不是|而非/;
const HEDGE_EN = /\b(?:does\s+not\s+mean|not\s+necessarily|depends\s+on|cannot\s+conclude|can'?t\s+conclude)\b/i;

// 反问标记（与 r216 collider_bias 同口径：仅无反问标记的疑问句才豁免）
const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的/;
const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;

// 邻近窗
const WIN_SOURCE_CLAIM_ZH = 110;  // 腿① ↔ 腿②
const WIN_SOURCE_CLAIM_EN = 320;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

// 收集某腿全部命中位置（供邻近窗取最近一对用）
function allMatches(list, text) {
  const out = [];
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const reG = new RegExp(re.source, flags);
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ index: m.index, text: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;  // 防零宽死循环
    }
  }
  return out;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAnonymousSourceClaim(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免（反问标记不豁免，同 r216 collider_bias 口径）
  if (/[?？]/.test(text)) {
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 已署名/可回溯信源：有具名媒体/官方通报/可指认主体即不判
  if (anyHit(R.EXEMPT_ATTRIBUTED_ZH || EXEMPT_ATTRIBUTED_ZH, text) ||
      anyHit(R.EXEMPT_ATTRIBUTED_EN || EXEMPT_ATTRIBUTED_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确响应形：明确标注未证实/无法核实/已辟谣，正是本族要教的判别动作
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) ||
      anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 概念/教学转述：讨论这个概念本身不是运用它
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) ||
      anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 推理否定/对冲（句级）
  if (HEDGE_ZH.test(text) || HEDGE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const sourceList = isZh ? (R.SOURCE_ZH || SOURCE_ZH) : (R.SOURCE_EN || SOURCE_EN);
  const claimList = isZh ? (R.CLAIM_ZH || CLAIM_ZH) : (R.CLAIM_EN || CLAIM_EN);
  const win = isZh ? WIN_SOURCE_CLAIM_ZH : WIN_SOURCE_CLAIM_EN;

  // 主判据：腿① 无署名信源标记 × 腿② 强断言封装，取最近一对
  const sourceHits = allMatches(sourceList, text);
  const claimHits = allMatches(claimList, text);
  if (sourceHits.length === 0 || claimHits.length === 0) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  let bestDist = Infinity;
  let bestSource = null;
  for (const s of sourceHits) {
    for (const c of claimHits) {
      const d = Math.abs(c.index - s.index);
      if (d > win) continue;
      if (d < bestDist) { bestDist = d; bestSource = s; }
    }
  }

  if (bestSource) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh
        ? '无署名信源承载强断言(信源不可核验,断言无从验证)(zh)'
        : 'unverifiable anonymous source carrying a strong claim(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAnonymousSourceClaim,
  __internals: () => ({
    SOURCE_ZH, CLAIM_ZH, SOURCE_EN, CLAIM_EN,
    EXEMPT_ATTRIBUTED_ZH, EXEMPT_ATTRIBUTED_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    WIN_SOURCE_CLAIM_ZH, WIN_SOURCE_CLAIM_EN,
    RHETORICAL_ZH, RHETORICAL_EN, HEDGE_ZH, HEDGE_EN,
  }),
};
