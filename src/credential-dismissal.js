/**
 * src/credential-dismissal.js — 「诉诸资历/资历驳回」检测器
 * （第 203 个判别维度，r206）
 *
 * [r206 立项] philosophy_decision 在当前引擎（v6.8.134，202 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实
 * 证：r206 族探针（/tmp/hf-probe-families.js + /tmp/hf-scout-1793711319.txt）
 * 在当前引擎复测——攻击样本 4 条中 4 条 gate.action=pass（现有 202 维
 * 真零命中，含中英双语、裸名词、带修饰、反问、长句变体）、良性 2 条
 * 中 2 条 pass（零误伤）。外部研究：HN Algolia "courtier's reply" 前五
 * 无相关命中（courier 同形词干扰）；Semantic Scholar 两次检索均空返
 * （限流，如实记录）；GitHub "ad hominem fallacy" sort=stars 前五——
 * UKPLab/naacl2018-before-name-calling-habernal-et-al ★13（NAACL
 * 2018 谩骂前的ad hominem动力学，ML路线）、jghibiki/NeuralAdHominem
 * ★2（CNN）、utkarsh512/logical-fallacy ★1、"courtier reply fallacy"
 * 零仓库——全部为 LLM/统计学习路线，与心虫零 LLM 依赖铁律冲突，无可
 * 集成纯规则实现——按心虫既有维度形态自建纯规则判据（资历驳回/侍臣
 * 回复为经典非形式谬误目录常备条目，文献仅作分类学参考）。
 *
 * 辨别的族：诉诸资历/资历驳回（credential dismissal / courtier's
 * reply / credential gatekeeping）——点名**批评者个人的资历、学
 * 识、经验缺口**（没读过这本专著/不是博士/没干过十年/外行），再由
 * 此**剥夺其发言资格**（没资格批评/不配谈/先读书再说话/闭嘴/班门
 * 弄斧），用「你是谁」代替「你说了什么」：
 *   你连这本专著都没读过，有什么资格批评我的理论？先去读书再说话。
 *   你不是经济学博士，讨论货币政策就是班门弄斧，先拿个学位再说。
 *   没在行业里干过十年的人，没资格评论这套打法。
 *   你又不是家长，凭什么对学校教学指手画脚？
 *   先考上编制再来跟我谈教育，你一个校外的人插什么嘴。
 *   You have not read the original 800-page treatise, so you are not
 *   qualified to critique my position.
 *   He has never run a business, so his criticism of the company
 *   means nothing — who is he to lecture us?
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：这是把**人的准入
 * 条件**偷换成**观点的判别条件**——观点是否正确只取决于证据与推
 * 理，与发言者的学位、工龄、读过几本书无关。资历门禁一旦成立，批
 * 评通道就被关闭：公共讨论退化成资格赛，新人、外行、跨领域者的合
 * 理质疑被系统性消音（学术圈「没读完全集就没资格评论」、行业「没
 * 干过十年少插嘴」、公共议题「不是X国人别说话」都是同族）。它
 * 与正当的专业性提醒有明确界线：指出**话题需要哪些知识**并给路径
 * 是帮助，宣布**你不配说话**是压制。
 *
 * 与既有维度的边界（r206 归因）：
 *   · genetic_fallacy（第 131 维）管**起源谬误**——按来源出身推
 *     断观点/产品质量（「他没上过名牌大学，观点不值得听」已被它
 *     判 verify），落点是**内容的价值贬损**；本族腿②落点是**发言
 *     资格的剥夺**（没资格/不配/先读书再说话/闭嘴），指向人的准入
 *     而非观点的质量。探针实测：本族 4/4 攻击样本 genetic_fallacy
 *     零命中（其 QUALITY 腿不收资格剥夺句式）。
 *   · tone_policing（既有维度）管**压制批评语气**（「态度好一
 *     点」「别那么冲」），本族不管语气、管**准入资格**。
 *   · scrutiny_evasion / soft_deflection（既有维度）管**回避实质
 *     审查的遁辞**（含糊其辞/转移焦点），本族不回避问题、直接宣
 *     布对方无权提问。
 *   · cost_externalization 等胁迫族管**施压换服从**，本族无服从
 *     要求、只是关闭发言通道。
 *   · appeal_to_authority（既有维度）管**引权威为证据**，本族正
 *     好相反：拿**对方缺乏权威**作禁言理由。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判；另设自足祈使分支）：
 *   · 腿① GAP 资历/学识/经验缺口（中英）：第二人称+否定+资历动词
 *     （你不是…/你没学过/没读过/没做过/没干过/没经历过/连…都
 *     没…）、裸名词缺口（没结过婚/没带过孩子/没当过父母/没做过管
 *     理/没创过业/没读过大学）、身份否定（不是专业的/非科班/外
 *     行/门外汉/业余）；EN you have not (read|studied|done|run|
 *     worked|experienced)、you are not a (professional|expert|
 *     scholar)、who has never、no (degree|experience|training)、
 *     outsider/amateur/layman——**r161 教训落地**：缺口词收裸名词
 *     形态（没读过/外行/amateur 去后缀仍命中）。
 *   · 腿② STANDING 发言资格剥夺（中英）：资格剥夺（没资格/不配/
 *     无权/有什么资格/哪来的资格/也配/也敢）、禁言（闭嘴/免谈/
 *     插什么嘴/掺和什么/指手画脚）、知识产权的价值抹杀（批评/质
 *     疑/观点+一文不值/不算数/毫无价值）、先…再+发言动作（先读
 *     书再说话/先拿学位再评论/等你…再跟我谈）；EN not qualified
 *     to (criticize|comment|judge|discuss)、have no (right|
 *     standing|authority|business) to、who are you to、shut up、
 *     stay in your lane、until you have (read|studied|earned)、
 *     criticism means nothing。
 *   · 自足祈使分支：「先+资历动作+再+发言动作」单式即两腿齐备
 *     （先去读个学位再来评价/先考上编制再来跟我谈）——祈使本身
 *     同时宣告缺口与禁言，无需第二条腿共现。
 *   · 缺腿不判：只有腿①（「没读过这本书的话我可以先讲讲大意」）
 *     是资源指引；只有腿②（「这个方案不成熟」）是正常批评。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/逻辑课反面
 * 教材/面试场景转述，rewrite 会误伤（与 r672-r205 全部评价族同口
 * 径）。verify 的含义是「这段对话把准入条件当成判别条件，需回到
 * 观点本身的证据」。
 *
 * 明确不判的（豁免——这些是正当的资源指引、教学邀请与执业许可）：
 *   · 概念/批判转述（诉诸资历/资历攻击/资历谬误/门禁+是谬误·话
 *     术·逻辑错误；EN credentialism / courtier's reply is a
 *     fallacy——讨论这个概念本身不是运用它）；
 *   · 资源指引/教学邀请（我建议/欢迎/我可以介绍/不妨先了解/供参
 *     考/一起查证——给路径而不是关通道）；
 *   · 执业许可/任职要求（执照/资格证/执业证/资质+才能·方可·前
 *     提·规定——「没执照不能行医」是法定准入，不是对批评的压
 *     制，且腿②发言动作不收行医/上岗/操作类执业动词）；
 *   · 疑问句中的正当探询（腿②不收无资格剥夺语义的疑问）。
 */
'use strict';

// ─── 腿① GAP 资历/学识/经验缺口（中文）──────────────────────────
// 枚举腿自查（r161 教训）：缺口动词收裸词形态（没读过/没做过/没干过
// 去后缀仍命中）；外行/门外汉/业余 收裸名词。四形态并列。
const GAP_ZH = [
  // A1 第二人称+否定+资历动词（你不是…/你没学过/没读过/没做过…）
  /(?:你|你们|您)(?:们)?(?:又)?(?:不是|没|未|未曾|从没|根本没|一点也不?)(?:真正|系统|认真|亲自)?(?:学过|读过|看过|做过|干过|经历过|碰过|拿过|考上|毕业|入行|当过|带过|管过|教过|研究过|了解过|深入|懂|明白)/,
  // A2 连…都（没|未|不曾）+ 资历动作（连这本书都没读过/连一天都没做过）
  /连[^。，！？!?]{0,12}(?:都|也)(?:没|未|不曾|从未)/,
  // A3 裸名词缺口（无主语：没结过婚/没带过孩子/没当过父母/没做过管理…）
  // 允许 没 与资历动词之间隔短定语（「没在行业里干过十年」「没亲手做过」）。
  /(?:没|未曾|从未)(?:有)?[^。，！？!?]{0,10}(?:读过|学过|做过|干过|经历过|碰过|拿过|当过|从事过|研究过|结过婚|带过孩子|养过|上过|深入|系统地?学)/,
  // A4 身份否定（不是专业的/非科班/圈外人；角色否定不是家长/不是过来人）
  /(?:不是|非)(?:个|一名|一位|啥)?(?:专业|科班|内行|圈内|从业|职业|学(?:这个|相关)|搞(?:这个|相关)|研究(?:这个|相关)|家长|父母|亲历者|过来人|圈里人|业内人士|当事人|受害者|使用者|患者|员工|这行|那行)(?:的|人员|者)?/,
  // A5 外行族（裸名词）
  /(?:外行|门外汉|非专业|业余(?:的)?(?:人|选手|选手|爱好者)?|素人|小白|局外人)/,
];

// ─── 腿① GAP（英文）──────────────────────────────────────────────
const GAP_EN = [
  // you have not (read|studied|done|run|worked|experienced…)
  /\byou\s+(?:have\s+not|haven'?t|never)\s+(?:read|studied|done|run|worked|experienced|built|taught|led|managed|practiced|published|completed|earned)\b/i,
  // you are not a (professional|expert|scholar|practitioner…)
  /\byou(?:'re|\s+are)\s+not\s+(?:a|an)\s+(?:professional|expert|scholar|practitioner|scientist|economist|doctor|lawyer|engineer|insider|parent|mother|father|teacher|graduate)\b/i,
  // not a … / never run a business / who has never
  /\bwho\s+has\s+never\b/i,
  /\b(?:has\s+)?never\s+(?:run|worked\s+at|built|managed|led|taught|studied|practiced)\s+(?:a|an|any)?\s*(?:business|company|team|school|lab|project|field|industry)\b/i,
  // no (degree|experience|training|track record|credentials)
  /\b(?:has\s+)?no\s+(?:degree|experience|training|track\s+record|credentials?|qualifications?|background)\b/i,
  // [r296] didn't finish (college|school|university) / skipped (college|grad school)
  // [r296 审计修正] 动词补过去式：r296 首版只收 finish/complete 原形，实测
  // `He never finished university, so his criticism means nothing.` 腿①漏判
  // （审计复跑 r296-leg-debug：never finished → gap=-）。didn't finish 形态
  // 原形已收，但 never finished / he completed 的 -ed 形态不匹配，补上。
  /\b(?:didn'?t|did\s+not|never)\s+(?:finish|finished|complete|completed|graduate|graduated|attend|attended)\s+(?:\w+\s+){0,2}(?:college|university|school|grad\s+school)\b/i,
  // [r296] 复合职业名身份否定：not a climate scientist / not an industry expert
  // （主语连接放宽 you're/he's/they are…；冠词可选——not professional
  //  auditors / no data scientist 无冠词形态；职业名允许多词修饰）
  /\b(?:you'?re|you\s+are|he'?s|he\s+is|she'?s|she\s+is|they'?re|they\s+are|we'?re|we\s+are)\s+(?:not|no)\s+(?:a|an)?\s*(?:[\w-]+\s+){0,3}(?:scientist|researcher|analyst|expert|specialist|economist|statistician|engineer|doctor|lawyer|academic|scholar|practitioner|professional|historian|journalist|clinician|auditor|manager|founder)s?\b/i,
  // [r296] lack(s)/without + 资格名词（裸缺口形，无 no/never 前缀）
  /\b(?:lacks?|lacking|without)\s+(?:any\s+|the\s+|enough\s+|sufficient\s+)?(?:expertise|experience|standing|qualifications?|authority|credibility|training|background)\b/i,
  // [r296] 行业名词补入 never worked 槽位（finance/law/medicine/tech/education…）
  /\b(?:has\s+)?never\s+(?:run|worked\s+(?:at|in)|built|managed|led|taught|studied|practiced)\s+(?:a|an|any)?\s*(?:business|company|team|school|lab|project|field|industry|finance|law|medicine|tech|education|government|nonprofit|startup|labour|labor)\b/i,
  // outsider / amateur / layman（裸名词；[r296] 补复数 outsiders/laymen）
  /\b(?:outsiders?|amateurs?|laym[ae]n|laypeople|laypersons?|non[- ]professionals?|dilettantes?)\b/i,
  // [r296] without + 资格名词（without a degree/any experience/any standing）
  /\bwithout\s+(?:a|an|any|the|enough|sufficient)\s+(?:\w+\s+){0,2}(?:degree|experience|training|standing|qualification[s]?|expertise|background|credential[s]?)\b/i,
  // [r296] never held/never had + 职业/岗位名词（never held a real job / never had a real job）
  // [r296 审计修正] 补 any/practical/sufficient 三修饰与 acquired/accumulated：
  // 实测 `She never had any real experience in the field.` 腿①漏判（名词表
  // 无 experience，experience 只在 no/lacks/without 槽位）。并入 experience
  // 与 track record 后此腿与 no experience 族重叠但形态互补（never had
  // vs no），保留双轨。
  /\bnever\s+(?:held|had|got|obtained|earned|acquired|accumulated)\s+(?:a|an|any)?\s*(?:real\s+|proper\s+|practical\s+|actual\s+){0,3}(?:job|position|post|role|office|degree|title|experience|training|track\s+record|background|expertise)\b/i,
];

// ─── 腿② STANDING 发言资格剥夺（中文）────────────────────────────
// 自查（r161 教训）：没资格/不配/闭嘴/插嘴 收裸词形态；三种语序
// （有什么资格/也配/先…再）并列。
const STANDING_ZH = [
  // B1 资格剥夺（没有资格/没资格/有什么资格/哪来的资格 + 发言动作）
  // 发言动作为必选——「没资格给病人开方」类执业许可（开方不在发言动作
  // 表）因此天然不判，无需依赖豁免；另收「不够资格」。
  /(?:没有|没|毫无|半点|根本|不够)(?:的)?(?:资格|权利|权力|发言权|话语权|立场|份)(?:去|来)?(?:批评|评论|评价|讨论|发言|说话|插嘴|指点|指手画脚|谈|讲|说|质疑|指责|置喙|过问|干涉|指挥|唠叨|数落|评判|看待|决定)/,
  /(?:有什么|哪来的|凭什么有|算得上什么)(?:的)?(?:资格|权利|权力|发言权|立场|份)(?:去|来)?(?:批评|评论|评价|讨论|谈|说|讲|指点|插嘴|质疑|指责|置喙|过问|干涉|指挥|数落|评判|决定)/,
  // B1b 凭什么+发言动作（无资格名词的直接禁言形：「凭什么对…指手画脚/凭什么管」）
  /凭什么[^。！？!?]{0,10}(?:批评|评论|评价|讨论|谈|说|讲|指点|指指点点|指手画脚|插嘴|质疑|指责|置喙|指挥|干涉|过问|数落|管)/,
  // B2 不配族（不配谈/也配/哪配 + 可选发言动作）
  /(?:不配|也配|哪配|配不配|配得上?)(?:谈|说|讲|评论|批评|评价|讨论|提|开口|发言|与|待在|站在|跟我|和我)?/,
  // B3 禁言族（闭嘴/免谈/插什么嘴/掺和什么/指手画脚/也敢+发言动作）
  /(?:闭嘴|免谈|少插嘴|插什么嘴|掺和什么|指手画脚|少哔哔|把嘴闭上)/,
  /(?:少来|少跟我|少在这儿|一边去|哪儿凉快|歇着吧)/,
  /(?:也敢|竟敢|居然敢)(?:说|讲|谈|评论|批评|评价|指责|质疑|指点|插嘴|开口|对我)/,
  // B4 知识产权的价值抹杀（批评/质疑/观点 + 一文不值/不算数/毫无价值）
  /(?:批评|指责|质疑|观点|看法|意见|评论|说法|抱怨|反驳)[^。！？!?]{0,8}(?:一文不值|不算数|不作数|毫无价值|没有价值|不值一提|无效|当耳边风|耳边风|说明不了任何问题|说明不了|证明不了)/,
  // B5 先…再+发言动作（自足祈使分支的匹配核；见 check 内自足判定）
  /先[^。！？!?]{0,14}(?:读书|上学|学习|拿[^。！？!?]{0,6}学位|考上|毕业|入行|读完|学完|做过[^。！？!?]{0,4}年|经历过|创过业|当过|带过|管过|研究过|考个|读个|学个)[^。！？!?]{0,10}再[^。！？!?]{0,6}(?:说|讲|谈|评论|批评|评价|开口|发言|插嘴|指点|哔哔|废话|见我|跟我)/,
  // B6 等你…再+发言动作
  /等你[^。！？!?]{0,16}(?:再|才)[^。！？!?]{0,8}(?:说|谈|评论|批评|评价|开口|跟我|见我|来)/,
];

// ─── 腿② STANDING（英文）─────────────────────────────────────────
const STANDING_EN = [
  // not qualified to (criticize|comment|judge|discuss…)
  /\b(?:not|no\s+longer)\s+(?:qualified|entitled|in\s+a\s+position|authorized)\s+to\s+(?:criticize|critique|comment|judge|discuss|talk|speak|evaluate|opine|weigh\s+in|dictate|lecture|tell)\b/i,
  // have no (right|standing|authority|business) to …
  /\b(?:have|has)\s+no\s+(?:right|standing|authority|business|place)\s+to\s+(?:criticize|critique|comment|judge|discuss|talk|speak|tell|dictate|lecture|weigh\s+in)\b/i,
  // who are you to (criticize|comment|judge…) / who is he to lecture us
  /\bwho\s+(?:are|is)\s+(?:you|he|she|they|anyone|somebody|someone)\s+to\s+(?:criticize|critique|comment|judge|talk|say|tell|lecture|dictate|question|second[- ]guess)\b/i,
  // shut up / stay in your lane / don't talk about
  /\bshut\s+up\b/i,
  /\bstay\s+in\s+your\s+lane\b/i,
  /\b(?:don'?t|do\s+not|doesn'?t|does\s+not)\s+(?:talk|comment|weigh\s+in|lecture|presume)\b/i,
  // until you have (read|studied|earned|done) …
  /\b(?:until|before)\s+you\s+(?:have|'?ve)\s+(?:read|studied|earned|got(?:ten)?|done|run|built|proven)\b/i,
  // (criticism|opinion|view) means nothing / is worthless（允许中间隔修饰语）
  // [r296 审计修正] 补 counts for nothing / is nonsense / is meaningless /
  // deserves no response 三族：r296 首版 means nothing 只覆盖 means/is，审计
  // 复跑 r296-leg-debug 实测 `your opinion counts for nothing`、`their
  // criticism deserves no response`、`your analysis is nonsense` 腿②全漏
  // （standing=-）。counts for 与 deserves 不限于 nothing 一个补足。
  /\b(?:criticism|critique|opinion|view|complaint|argument|objection|analysis|assessment|take|input|report|paper|study|conclusion|findings?|work|numbers?|data)[^.]{0,20}(?:means|is|are|counts for|carries)\s+(?:nothing|worthless|invalid|irrelevant|nonsense|meaningless|beneath\s+contempt)/i,
  /\b(?:criticism|critique|opinion|view|complaint|argument|objection|analysis|objection)\s+deserves\s+no\s+(?:response|reply|attention|credence|consideration)\b/i,
  /(?:not|never)\s+(?:been|done)\s+[^.]{0,40}?\bso\s+(?:your|his|her|their)\s+(?:criticism|opinion|view|judgment)\s+(?:means|is|counts)/i,
  // [r296] can/may/should be dismissed（被动采信否定，不收 be worth 类正当评价）
  /\b(?:can|could|may|might|should|must|ought\s+to|is\s+to|are\s+to)\s+(?:safely\s+|simply\s+|just\s+|therefore\s+|thus\s+|easily\s+)*be\s+(?:dismissed|disregarded|discounted|ignored|rejected|set\s+aside)\b/i,
  // [r296] 裸判断动作剥夺（no qualifications/standing to judge/evaluate/assess/decide…）
  /\b(?:no|not\s+enough|without|lack(?:s|ing)?)\s+(?:\w+\s+){0,2}(?:qualifications?|standing|authority|credibility|expertise|basis|grounds?)\s+to\s+(?:judge|evaluate|assess|decide|rate|rank|grade|comment|critique|review|opine|weigh\s+in)\b/i,
  // [r296] 能力/行动剥夺（cannot/shouldn't + 专业动作）
  /\b(?:can'?t|cannot|can\s+not|should\s+not|shouldn'?t|may\s+not|must\s+not|ought\s+not\s+to|has\s+no\s+business)\s+(?:\w+\s+){0,2}(?:review|comment|judge|evaluate|assess|lecture|advise|opine|weigh\s+in|dictate|preach|tell\s+us|teach\s+us|give)\b/i,
  // [r296] 采信否定（ignore/disregard/discount + 指代宾语；carries no weight）
  /\b(?:ignore|disregard|discredit|discount|dismiss)\s+(?:his|her|their|the|this|these|any|all)?\s*(?:\w+\s+){0,2}(?:opinion|view|analysis|take|claim|argument|thesis|work|model|paper|report|conclusion|findings?|advice)\b/i,
  /\b(?:carries?|has|holds)\s+no\s+(?:weight|credence|authority|validity|force)\b/i,
];

// ─── 豁免一：概念/批判转述（讨论这个概念本身不是运用它）────────────
const EXEMPT_META_ZH = [
  // 诉诸资历/资历攻击/资历谬误/门禁 + 是谬误·话术·逻辑错误
  /(?:诉诸资历|资历攻击|资历谬误|资历门槛|资格歧视|以资历取人|侍臣回复|门禁心态)[^。！？!?]{0,22}(?:是|属于|构成|正是|就是|属于一种)[^。！？!?]{0,18}(?:谬误|问题|陷阱|错误|不对|诡辩|话术|手法|手段|策略|伎俩|套路|现象|偏见|歧视|障碍)/,
  // 讨论/分析/识别/警惕/所谓 + 族名词（转述语境）
  /(?:讨论|分析|识别|警惕|所谓|被称为|叫作|称之为|批判|驳斥|拆穿|讽刺)[^。！？!?]{0,14}(?:诉诸资历|资历攻击|资历谬误|资格歧视|以资历取人|侍臣回复|门禁)/,
  // 尾部形态：「X是典型的诉诸资历谬误」「诉诸资历是一种谬误」（族名词+谬误直接相邻）
  /(?:诉诸资历|资历攻击|资历谬误|资格歧视|以资历取人|侍臣回复|门禁)[^。！？!?]{0,8}(?:谬误|话术|逻辑错误|诡辩|套路|现象|偏见|歧视|障碍)/,
  /(?:是|属于)[^。！？!?]{0,8}(?:典型的|常见的|经典的|明显的|标准的)[^。！？!?]{0,6}(?:诉诸资历|资历攻击|资历谬误|资格歧视|以资历取人|侍臣回复|门禁)/,
  // 教学/学术转述
  /(?:教材|课程|讲义|论文|研究|文章|著作|教科书)[^。，！？!?]{0,10}(?:谬误|论证|逻辑|修辞|论证法)/,
];
const EXEMPT_META_EN = [
  /\b(?:credential(?:ism|ling)?|courtier'?s?\s+reply|appeal\s+to\s+(?:lack\s+of\s+)?credentials?|credential\s+gatekeeping)\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i,
  /\b(?:this|that|it)\s+(?:is|'?s)\s+(?:the\s+)?(?:classic|textbook|typical)\s+(?:courtier|credential)/i,
];

// ─── 豁免二：资源指引/教学邀请（给路径而不是关通道）────────────────
const EXEMPT_GUIDE_ZH = [
  /(?:我建议|欢迎|我可以(?:先)?(?:介绍|讲|解释|说明)|不妨(?:先)?(?:了解|看看|读|看)|供参考|一起查证|一起来(?:看|查|核对)|推荐你(?:先)?(?:看|读|参考)|邀请你(?:先)?(?:了解|看))/,
];
const EXEMPT_GUIDE_EN = [
  /\b(?:I\s+(?:suggest|recommend|can\s+(?:explain|walk|introduce))|welcome\s+(?:to|your)|feel\s+free\s+to\s+(?:ask|read|check)|happy\s+to\s+(?:explain|share|walk))\b/i,
];

// ─── 豁免三：执业许可/任职要求（法定准入，不是对批评的压制）────────
const EXEMPT_PRACTICE_ZH = [
  /(?:执照|资格证|执业证|执业资格|从业资格|资质|许可证|牌照|注册)[^。！？!?]{0,14}(?:才能|方可|是前提|要求|规定|必须|应当|需要)/,
  /(?:任职|上岗|执业|招聘|录用|报考)(?:资格|要求|条件)[^。！？!?]{0,10}(?:需要|要求|必须|应当)/,
];

const WIN_ZH = 80;    // 中文邻近窗（字）
const WIN_EN = 200;   // 英文邻近窗（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

// 自足祈使分支：先+资历动作+再+发言动作（单式即两腿齐备）。
// 资历动作限长周期资格取得（读书/上学/拿学位/考上/毕业/入行/做过…年/
// 经历过/创业/当过/带过/管过/研究过/考个/读个/学个/读完/学完），
// 发言动作限讨论/批评/评价/指点族——「先把方案熟悉了再谈」的熟悉
// 不在资格动作集、「先完成培训再上岗」的上岗不在发言动作集。
const IMPERATIVE_ZH = [
  /先[^。！？!?]{0,14}(?:读书|上学|学习|拿[^。！？!?]{0,6}学位|考上|毕业|入行|读完|学完|做过[^。！？!?]{0,4}年|经历过|创过业|当过|带过|管过|研究过|考个|读个|学个)[^。！？!?]{0,10}再[^。！？!?]{0,6}(?:说|讲|谈|评论|批评|评价|开口|发言|插嘴|指点|哔哔|废话|见我|跟我)/,
  /等你[^。！？!?]{0,16}(?:再|才)[^。！？!?]{0,8}(?:说|谈|评论|批评|评价|开口|跟我|见我|来)/,
];
const IMPERATIVE_EN = [
  /\b(?:until|before)\s+you\s+(?:have|'?ve)\s+(?:read|studied|earned|got(?:ten)?|done|run|built|proven)\b/i,
];

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCredentialDismissal(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const G_Z = R.GAP_ZH || GAP_ZH;
  const G_E = R.GAP_EN || GAP_EN;
  const S_Z = R.STANDING_ZH || STANDING_ZH;
  const S_E = R.STANDING_EN || STANDING_EN;
  const X_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const X_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const U_Z = R.EXEMPT_GUIDE_ZH || EXEMPT_GUIDE_ZH;
  const U_E = R.EXEMPT_GUIDE_EN || EXEMPT_GUIDE_EN;
  const P_Z = R.EXEMPT_PRACTICE_ZH || EXEMPT_PRACTICE_ZH;
  const I_Z = R.IMPERATIVE_ZH || IMPERATIVE_ZH;
  const I_E = R.IMPERATIVE_EN || IMPERATIVE_EN;

  // 概念/批判转述在场 → 不是运用它
  if (anyHit(X_Z, text) || anyHit(X_E, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 执业许可/任职要求在场 → 法定准入表述，不是对批评的压制
  if (anyHit(P_Z, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 资源指引/教学邀请在场且无禁言祈使 → 给路径不是关通道
  const hasGuide = anyHit(U_Z, text) || anyHit(U_E, text);
  const hasImperative = anyHit(I_Z, text) || anyHit(I_E, text);
  if (hasGuide && !hasImperative) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 自足祈使分支：先+资历动作+再+发言动作（单式即两腿齐备）
  if (hasImperative) {
    return {
      hit: true,
      score: 0.58,
      count: 1,
      detail: isZh
        ? '诉诸资历×先取资历再许发言(zh)'
        : 'credential dismissal×qualify-before-you-speak(en)',
    };
  }

  // 腿① 资历/学识/经验缺口
  const gZhIdx = firstHit(G_Z, text);
  const gEnIdx = firstHit(G_E, text);
  const gIdx = gZhIdx >= 0 ? gZhIdx : gEnIdx;
  if (gIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 发言资格剥夺
  const sZhIdx = firstHit(S_Z, text);
  const sEnIdx = firstHit(S_E, text);
  const sIdx = sZhIdx >= 0 ? sZhIdx : sEnIdx;
  if (sIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「缺口→剥夺资格」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(gIdx - sIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '诉诸资历×以资历缺口剥夺发言资格(zh)'
      : 'credential dismissal×gap-to-standing-denial(en)',
  };
}

module.exports = {
  checkCredentialDismissal,
  __internals: () => ({
    GAP_ZH, GAP_EN, STANDING_ZH, STANDING_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_GUIDE_ZH, EXEMPT_GUIDE_EN,
    EXEMPT_PRACTICE_ZH,
    IMPERATIVE_ZH, IMPERATIVE_EN,
  }),
};
