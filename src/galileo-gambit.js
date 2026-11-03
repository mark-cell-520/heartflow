/**
 * src/galileo-gambit.js — 「伽利略赌局（Galileo gambit）」检测器（第 201 个判别维度）
 *
 * [r204 立项] philosophy_decision 在当前引擎（v6.8.132，200 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实证：
 * grep -ril 'galileo|伽利略|哥白尼|布鲁诺|塞尔维特|魏格纳|被嘲笑|被迫害|
 * 历史会证明|他们会笑我' src/ 仅命中 fallacy-fallacy.js 的注释缺口清单
 * （「galileo_fallacy 在 src/ 下 0 命中」——r180 轮明确登记为未覆盖族）
 * 与 clustering-illusion.js 注释，无任何维度以「殉道者先例×自我平反
 * 迁移」两腿结构覆盖本族；gate() 实测攻击样本 5/5 gate.action=pass
 * （真零命中）、良性 5/5 pass（零误伤）。外部研究（HN Algolia
 * "logical fallacy" 258/242/173 pts：arXiv 2405.02318《Autoformalizing
 * Natural Language to First-Order Logic: A Case Study in Logical
 * Fallacy Detection》、logicalfallacies.org、UTEP Master List of
 * Logical Fallacies；GitHub fallacy-detection 高星仓库均为 LLM/统计
 * 学习方案）无纯规则成熟实现可集成——心虫零 LLM 依赖铁律下按既有
 * 维度形态自建纯规则判据（伽利略赌局为经典谬误目录常备条目）。
 *
 * 辨别的族：伽利略赌局（Galileo gambit / Galileo fallacy / argument
 * from persecution）——拿**历史或现实中「被嘲笑、被迫害的先驱/先知」**
 * （伽利略/哥白尼/布鲁诺/塞尔维特/魏格纳/塞麦尔维斯/苏格拉底、被烧死/
 * 被审判/被钉十字架/被斥为谬论/被学界排斥）作为先例，据此推出**自己
 * 或自己阵营那个正在被嘲笑、被封杀、被压制的观点也会被历史证明是
 * 对的**——把「被抵制」这一事实本身当成「正确性」的证据：
 *   当年哥白尼提出日心说也被当成异端邪说，现在你们否定我的理论，历史同样会证明我是对的。
 *   伽利略因为坚持日心说被宗教裁判所审判，布鲁诺更被烧死在鲜花广场——被嘲笑被迫害的思想家最后都赢了，所以我的发现迟早也会被承认。
 *   他们当年嘲笑魏格纳的大陆漂移学说，就像今天你们嘲笑我一样；时代会给我平反。
 *   历史上所有颠覆性的突破在问世之初都被骂是谬论，我的UFO结论现在被专家封杀，说明我戳到了真相。
 *   They laughed at Galileo, they laughed at Copernicus, and they're laughing at me now — history will vindicate my theory.
 *   Bruno was burned at the stake, so the establishment's rejection of my work is the strongest proof that I'm right.
 *
 * 为什么这是判别者的核心缺口（对齐「寻真而非似是而非」）：观点的正确性
 * 只能由证据与检验决定，与它是否被嘲笑、被封杀、被迫害**统计无关**——
 * 历史上被嘲笑的观点绝大多数被证伪了（冷核聚变/永动机/地平说），被
 * 平反的只有恰好为真的那一小撮。该族把「立场人数」与「遭遇压力」偷换
 * 成「真理认证」，是伪科学、阴谋论、民科自辩时最常用的护身符，也是
 * AI 转述用户观点时最容易照单全收的似是而非：它让举证责任反向消失
 * （「不需要证据，被封杀就是证据」）。
 *
 * 与既有维度的边界（r204 归因）：
 *   · poisoning_the_well（第 134 维）/ genetic_fallacy（第 131 维）管
 *     **动机/出身污名化**（你这么说是因为你有利益/你是那个圈子的人），
 *     本族不污名化对方，诉诸的是**历史殉道先例**。
 *   · appeal_to_majority（第 149 维）管「大家都信所以为真」，本族方向
 *     相反——「少数派/被迫害者才对」，且必须有殉道者先例作腿①。
 *   · special_pleading（第 150 维）管**给自己开后门**（规则适用别人、
 *     不适用我），本族不开规则后门，主张的是「被压制=正确」。
 *   · persecution 类维度（post_separation_harassment 等第 129 维族）
 *     管**真实人际胁迫**，本族管的是**论证结构**：拿殉道史给观点背书。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① MARTYR 殉道者/被嘲笑先知先例（中英）：名字裸名词（伽利略/
 *     哥白尼/布鲁诺/塞尔维特/魏格纳/塞麦尔维斯/苏格拉底/鲜花广场/
 *     宗教裁判所/异端；EN Galileo / Copernicus / Bruno / Servetus /
 *     Wegener / Semmelweis / burned at the stake / Inquisition /
 *     heresy）+ 被迫害/被嘲笑先例族（被/当年/历史上 + 嘲笑·嘲讽·讽刺·
 *     挖苦·羞辱·迫害·打压·封杀·排挤·烧死·处死·审判·定罪·排斥·否定·
 *     反对·无视·拒绝 + 科学家/思想家/先驱/先知；EN they laughed at /
 *     mocked / ridiculed / persecuted / condemned / dismissed）。
 *   · 腿② TRANSFER 结论迁移（中英）：把先例迁移到**自我平反**（所以/
 *     因此 + 我…没错·正确·成立；我的…理论/发现 + 迟早/终将被证明·
 *     承认·平反；历史/时间/时代 + 会 + 证明/平反/翻案/给我公道；现在/
 *     如今 + 被封杀·被否定…+ 我；被…封杀/拒稿…说明我/对；反对本身
 *     就是证明；真理往往掌握在少数人手里；站在历史的正确一边）或
 *     **反对者受辱**（你们/他们 + 也会被钉在耻辱柱上/扫进历史的
 *     垃圾桶；EN history will vindicate / they're laughing at me now /
 *     the more they mock me, the more right / wrong side of history /
 *     establishment rejection is the best credential）。
 *   · 缺腿不判：只有腿①（「布鲁诺被烧死在鲜花广场」）是历史事实陈述；
 *     只有腿②（「历史会证明我是对的」）是无先例的自我期许，归
 *     unsupported_claim / absolute_claim。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人的赌局论证、历史教学中正反
 * 案例的并陈、或带独立证据的自辩。verify 的含义是「被嘲笑/被封杀的
 * 事实不构成该观点正确性的任何证据——需要回到这个观点本身的证据
 * 与检验记录」，而不是直接判死。
 *
 * 明确不判的（豁免——这些是正确判别、证据陈述或概念讨论）：
 *   · 概念/教学转述（伽利略赌局/伽利略谬误/逻辑谬误；EN Galileo
 *     gambit / logical fallacy——讨论这个概念本身不是运用它）；
 *   · 否认推断/正确判别（被嘲笑不能证明/不代表/不等于…正确、历史上
 *     被嘲笑的观点绝大多数被证伪、伽利略靠望远镜观测而非被审判
 *     证明、要看实验数据/以证据为准——拒绝该推理本身是正确判别）；
 *   · 疑问句（含 ?/？——问的是史实或趋势本身）；
 *   · 纯历史/科学事实陈述（缺迁移腿）。
 */
'use strict';

// ─── 腿① MARTYR 殉道者/被嘲笑先知先例（中文）──────────────────────────
// 枚举腿自查（r161 教训）：名字与动词收裸名词形态（伽利略/布鲁诺/被
// 嘲笑/被封杀 去后缀仍命中）；「被审判」「被定罪」等司法迫害动词与
// 「烧死」「处死」等极端形态并列收录。
const MARTYR_ZH = [
  // 殉道者名字（裸名词——单独出现即构成先例线索）
  /伽利略|哥白尼|布鲁诺|塞尔维特|魏格纳|塞麦尔维斯|苏格拉底/,
  // 殉道地标/事件（裸名词）
  /鲜花广场|宗教裁判所|异端(?:邪说)?|罗马教廷|十字架/,
  // 被迫害/被嘲笑先例（被/遭/当年/当时/历史上/昔日 + 迫害动词）
  /(?:被|曾|遭|饱受|受到|当年|当时|昔日|历史上|一开始|起初|最初|问世之初|当初)[^。，！？!?]{0,8}(?:嘲笑|嘲讽|讽刺|挖苦|羞辱|迫害|打压|封杀|排挤|烧死|处死|处决|审判|定罪|排斥|否定|反对|无视|拒绝|斥为|骂|冷眼|冷遇|白眼|唾弃)/,
  // 被迫害致死的科学家/思想家/先驱（裸名词族）
  /(?:烧死|烧死在|钉死|钉在十字架|囚禁|软禁|审判|定罪|迫害|封杀|排挤)(?:的)?(?:科学家|思想家|学者|先驱|先知|先行者|哥白尼|伽利略|布鲁诺|塞尔维特)?/,
  // 被当成疯子/骗子/谬论族
  /(?:被|曾|当年|当时|最初|一开始)(?:人|人们|世人|学界|权威|主流|所有人)?[^。，！？!?]{0,4}(?:当成|视为|看作|当作|斥为|骂作)(?:了)?(?:疯子|骗子|异类|异端|谬论|笑话|胡言|伪科学|民科|邪说)/,
  // 「所有突破起初都被骂」型先例概括（带修饰/长句）
  /(?:所有|一切|凡是|但凡)[^。，！？!?]{0,8}(?:颠覆|突破|创新|革命|伟大|超前)[^。，！？!?]{0,10}(?:起初|一开始|最初|当初|当年|问世之初|之初)[^。，！？!?]{0,4}(?:被|都)/,
  /(?:问世之初|提出之初|诞生之初|一开始|起初|最初|当年|当时|早期)[^。，！？!?]{0,10}(?:被)?(?:骂|嘲笑|嘲讽|否定|反对|当成|视为|看作|斥为|拒之)/,
];

// ─── 腿① MARTYR 殉道者先例（英文）─────────────────────────────────────
const MARTYR_EN = [
  /\b(?:galileo|copernicus|bruno|servetus|wegener|semmelweis|socrates)\b/i,
  /\b(?:burned|burnt)\s+at\s+the\s+stake\b/i,
  /\b(?:inquisition|heresy|heretic|house\s+arrest)\b/i,
  /\b(?:persecution|ridicule|mockery|suppression)\s+(?:is|was)\s+(?:the\s+)?(?:highest|greatest|best|ultimate)\s+(?:honor|honour|badge|credential|proof)/i,
  /\b(?:they|people|everyone|the\s+(?:church|establishment|scientific\s+community|academy|orthodoxy)|his\s+peers|contemporaries|critics)\s+(?:laughed|laughed\s+at|mocked|ridiculed|scoffed|dismissed|persecuted|rejected|condemned|jailed|imprisoned|silenced|shunned|ostracized)\b/i,
  /\b(?:laughed|mocked|ridiculed|scoffed|persecuted|condemned|burned|executed|imprisoned|silenced|ostracized|shunned)\s+(?:at\s+(?:the\s+)?time|in\s+(?:his|their)\s+(?:day|lifetime)|for\s+(?:his|their)\s+(?:ideas?|theory|discovery|work))\b/i,
  /\b(?:being|got|getting|was|were|been)\s+(?:attacked|mocked|ridiculed|laughed\s+at|persecuted|suppressed|rejected|blacklisted|silenced)\s+by\s+(?:the\s+)?(?:establishment|church|mainstream|academy|orthodoxy|scientific\s+community|peers|critics|media)\b/i,
];

// ─── 否定前缀保护（「被嘲笑不能证明我对」是正确判别）───────────────────
const NEG_GUARD = '(?<!(?:不能|无法|未必|不一定|不代表|不等于|不意味着|推不出|说明不了|难以|不足以|并未|并没有|绝非|并不|不许|不许))';

// ─── 腿② TRANSFER 结论迁移（中文）─────────────────────────────────────
// 自查（r161 教训）：迁移动词收裸名词形态（证明/承认/平反/封杀 去后缀
// 仍命中）；「我是对的」与「我的理论迟早会被承认」两种语序都收。
const TRANSFER_ZH = [
  // 所以/因此 + 我/我们 + 结论词（「所以我对了」——tail 排除「反对」误命中）
  new RegExp('(?:所以|因此|因而|可见|足见|据此|于是|那么)[^。！？!?]{0,16}(?:我|我们|本人|我方|自己)[^。！？!?]{0,12}(?:没错|正确|无误|成立|站得住|戳中|戳到|赢了|清白|翻案|平反|翻身)'),
  // 我的（理论/发现/观点…）+ 迟早/终将被证明/承认/平反（中间修饰词无序——
  // 修 s1 漏判：「迟早也会被承认」中 迟早/也/会/被 四 token 连排）
  /我(?:的(?:观点|理论|学说|主张|研究|发现|成果|说法|看法|结论|假说|模型|方案|论文))?(?:(?:也|终|终究|迟早|早晚|有一天|日后|会|将会|必将|被|历史|时间|时代|后人|后世))*(?:证明|证实|验证|正名|平反|翻案|承认|认可|接受)/,
  // 证明/证实/平反 + 我 + 对的/正确/清白（「证明我是对的」倒装）
  new RegExp('(?:证明|证实|验证|平反|翻案|正名|还)[^。！？!?]{0,6}' + NEG_GUARD + '(?:我|我们|本人)[^。！？!?]{0,6}(?:对的|正确|没错|无误|清白|成立|一个公道|翻案|平反)'),
  // 历史/时间/时代 + 会 + 证明/平反/翻案/给我公道（含「时代会给我平反」）
  /(?:历史|时间|时代|后人|后世|将来|未来)[^。，！？!?]{0,8}(?:会|必将|终究|迟早|早晚|终将)[^。，！？!?]{0,10}(?:证明|证实|正名|平反|翻案|还|承认|认可|接受|站在|替我|给我|道歉|认错|打脸|见证|洗清)/,
  // 现在/如今 + 被封杀/被否定… + 我（「现在被专家封杀，说明我…」）
  /(?:现在|如今|今天|当下|眼下|而今)[^。！？!?]{0,14}(?:嘲笑|嘲讽|讽刺|挖苦|否定|反对|围攻|封杀|打压|抵制|排斥|质疑|拒绝|拒稿|不容|禁言)[^。！？!?]{0,8}(?:我|我们|本人)/,
  // 被…封杀/拒稿/否定 + 说明/证明/意味着 + 我/对/真相（否定前缀保护）
  new RegExp('(?:被|受|遭到|遭受)[^。，！？!?]{0,6}(?:嘲笑|嘲讽|否定|反对|围攻|封杀|打压|抵制|排斥|质疑|拒稿|不容|禁言|删帖|下架|拒绝)[^。！？!?]{0,14}' + NEG_GUARD + '(?:说明|证明|意味着)[^。！？!?]{0,6}(?:我|我们|本人|真相|对|正确|戳中|戳到)'),
  // 反对/封杀 + 本身就是（证明/肯定/勋章）
  /(?:抵制|反对|否定|质疑|围攻|封杀|排斥|打压|拒稿|不容|禁言|删帖)[^。，！？!?]{0,6}(?:本身|恰恰|正好|就是|之声)[^。，！？!?]{0,6}(?:说明|证明|意味着|肯定|褒奖|勋章|奖章|认证|背书|赞美|致敬)/,
  // 你们/他们 + 也会被钉在耻辱柱上/扫进历史垃圾桶（反对者受辱迁移）
  /(?:你们|他们|当今|现在|今天|时人|后世|后人)[^。，！？!?]{0,12}(?:会|必将|终究|迟早|早晚)[^。，！？!?]{0,12}(?:被|钉在|沦为|成为|扫进|写进)[^。，！？!?]{0,12}(?:耻辱|笑柄|垃圾桶|罪人|反面教材|历史的)/,
  // 越是被嘲笑/被封杀 + 越说明/证明
  /(?:越是|越会)[^。，！？!?]{0,6}(?:被)?(?:嘲笑|否定|反对|质疑|封杀|打压|抵制|围攻)[^。，！？!?]{0,12}(?:说明|证明|意味着)/,
  // 真理往往掌握在少数人手里（微型赌局）
  /(?:真理|真相|真话|实话)[^。，！？!?]{0,4}(?:往往|总是|常常|向来|一开始|起初)[^。，！？!?]{0,6}(?:掌握|在|属于)/,
  // 站在历史的正确一边
  /(?:站在|属于|归于|进入)[^。，！？!?]{0,4}历史[^。，！？!?]{0,8}(?:正确|正义|进步)/,
  // 恰恰/正好 + 说明/证明 + 我/真相（「这恰恰说明我戳到了真相」）
  /(?:恰恰|正好|正)[^。，！？!?]{0,2}(?:说明|证明|意味着)[^。！？!?]{0,6}(?:我|我们|本人|真相|对的|正确)/,
];

// ─── 腿② TRANSFER 结论迁移（英文）─────────────────────────────────────
const TRANSFER_EN = [
  /\b(?:so|therefore|thus|hence)\s+(?:my|our)\s+(?:theory|work|research|findings?|ideas?|claims?|discovery|hypothesis|model|paper)\s+(?:will|shall|would|is\s+going\s+to)\s+(?:be\s+)?(?:proven|proved|vindicated|validated|confirmed|recognized|accepted)/i,
  /\bhistory\s+(?:will|shall)\s+(?:vindicate|prove|judge|absolve|remember|be\s+the\s+judge\s+of)/i,
  /\b(?:history|time|posterity|future\s+generations?)\s+(?:will|shall|is\s+going\s+to)\s+(?:prove|vindicate|judge|show)\s+(?:me|us|my|our)?\s*(?:right|correct|innocent)/i,
  /\b(?:they'?re|they\s+are|you'?re|you\s+are|everyone\s+is|the\s+world\s+is)\s+(?:laughing|mocking|ridiculing)\s+(?:at\s+)?(?:me|us|my|our)\s+(?:now|today|already)/i,
  /\b(?:being|getting)\s+(?:ridiculed|mocked|laughed\s+at|rejected|suppressed|censored|attacked|blacklisted|silenced)\s+(?:now|today)\s+(?:proves?|shows?|means?|indicates?|is\s+proof)/i,
  /\b(?:proves?|shows?|means?|indicates?)\s+(?:that\s+)?(?:I'?m|I\s+am|we'?re|we\s+are|my\s+theory\s+is|my\s+work\s+is)\s+(?:right|correct|onto\s+something)/i,
  /\b(?:proof|evidence)\s+(?:that\s+)?(?:I'?m|I\s+am|we'?re|we\s+are)\s+(?:right|correct)/i,
  /\b(?:evidence|proof|sign)\s+(?:that\s+)?(?:my|our)\s+(?:claim|theory|work|view|position|finding)\s+(?:is|are)\s+(?:correct|right|true)/i,
  /\bthe\s+more\s+(?:they|you)\s+(?:mock|attack|ridicule|suppress|reject|silence|censor)\b[\w\s]{0,12},?\s*the\s+more\s+(?:right|correct|true)/i,
  /\b(?:establishment|mainstream|orthodoxy|the\s+system)\s+(?:rejection|ridicule|opposition|resistance|attack|suppression)[\w\s']{0,16}(?:is|was)\s+(?:the\s+best|a\s+good|the\s+strongest|my\s+best)\s+(?:credential|proof|evidence|sign|badge|endorsement)/i,
  /\b(?:will|shall)\s+(?:be\s+)?(?:proven|vindicated)\s+(?:right|correct)\s+(?:in\s+time|eventually|by\s+history|one\s+day)/i,
  /\b(?:you|they)\s+will\s+(?:be\s+)?(?:remembered|judged)\s+(?:as\s+)?(?:on\s+the\s+wrong\s+side|as\s+(?:fools|villains|obstacles|dinosaurs)|in\s+the\s+dustbin)/i,
  /\b(?:right|wrong)\s+side\s+of\s+history\b/i,
  /\b(?:censored|banned|deplatformed|shadow[- ]?banned|fact[- ]checked)\s+(?:for\s+(?:telling|speaking)\s+the\s+truth|proves?\s+(?:I'?m|I\s+am)\s+(?:right|telling\s+the\s+truth))/i,
];

// ─── 豁免一：概念/教学转述（讨论这个概念本身不是运用它）──────────────
const EXEMPT_META_ZH = [
  /伽利略赌局|伽利略谬误|伽利略式|逻辑谬误|逻辑谬误清单|谬误清单/,
  /(?:教材|课程|讲义|论文|研究)[^。，！？!?]{0,8}(?:谬误|赌局|案例分析)/,
];
const EXEMPT_META_EN = [
  /\bgalileo\s+(?:gambit|fallacy)\b/i,
  /\b(?:logical\s+)?fallacy\b/i,
];

// ─── 豁免二：否认推断/正确判别（拒绝该推理本身是正确判别）────────────
const EXEMPT_DISMISS_ZH = [
  // 「被嘲笑不能证明/不代表…正确」——**必须带显式否定词**才豁免
  // （r204 实测修复：无否定词时该句式正是攻击本身——「被拒稿正说明
  // 它是对的」不能被豁免放过，初版漏强制否定导致误豁免）
  new RegExp('(?:被嘲笑|被否定|被反对|被压制|被迫害|被围攻|被封杀|被拒稿|被排斥)[^。！？!?]{0,12}(?:不能|无法|未必|不一定|不代表|不等于|不意味着|推不出|说明不了|难以|不足以|并未|并没有|绝非|并不)[^。！？!?]{0,4}(?:证明|说明|意味着|代表)'),
  // 「历史上被嘲笑的观点绝大多数被证伪」——统计性反驳
  /(?:绝大多数|大多数|大部分|几乎全部)[^。！？!?]{0,8}(?:被嘲笑|被否定|被反对|被压制)[^。！？!?]{0,8}(?:证伪|错误|错的|失败|沉默|没落|遗忘)/,
  // 伽利略靠证据而非殉道证明（正面因果陈述）
  /(?:靠|凭借|依据|通过)[^。！？!?]{0,10}(?:观测|实验|数据|计算|推导|证据)[^。！？!?]{0,10}(?:证明|证实|确立)/,
  // 求证/纠正陈述（要看数据/以证据为准/需要证据才能承认）
  /(?:但|但是|然而|不过|可是|只是|却|而)[^。]{0,24}(?:要看|得看|须看|待看|以[^。]{0,8}为准|有待核实|有待确认|需要核实|需要查证|还要看|仍要看|再下结论)/,
  /(?:需要|得有|须有|还要有|有待)[^。！？!?]{0,8}(?:证据|数据|实验|观测|检验|同行评议)[^。！？!?]{0,8}(?:才能|方可|再|才)/,
];
const EXEMPT_DISMISS_EN = [
  /\b(?:being\s+)?(?:ridiculed|mocked|laughed\s+at|persecuted|rejected|suppressed)\s+(?:doesn'?t|does\s+not|don'?t|do\s+not)\s+(?:necessarily\s+)?(?:mean|prove|show|imply)/i,
  /\b(?:most|the\s+vast\s+majority\s+of)\s+(?:of\s+)?(?:ridiculed|rejected|suppressed)\s+(?:ideas?|theories|claims)\s+(?:were|turned\s+out\s+to\s+be)\s+(?:wrong|false)/i,
  /\b(?:need|needs|require|requires)\s+(?:more\s+)?(?:evidence|data|testing|peer\s+review)\s+(?:before|to)\b/i,
  /\b(?:but|however)\s+(?:we|I)\s+(?:should|need\s+to|must|have\s+to)\s+(?:check|verify|look\s+at|consult|test)/i,
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

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkGalileoGambit(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const M_Z = R.MARTYR_ZH || MARTYR_ZH;
  const M_E = R.MARTYR_EN || MARTYR_EN;
  const T_Z = R.TRANSFER_ZH || TRANSFER_ZH;
  const T_E = R.TRANSFER_EN || TRANSFER_EN;
  const X_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const X_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const D_Z = R.EXEMPT_DISMISS_ZH || EXEMPT_DISMISS_ZH;
  const D_E = R.EXEMPT_DISMISS_EN || EXEMPT_DISMISS_EN;

  // 疑问句：问的是史实或趋势本身，不是以殉道先例自我背书
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 概念转述 + 否认推断豁免在场 → 不是运用它
  if (anyHit(X_Z, text) || anyHit(X_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(D_Z, text) || anyHit(D_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① 殉道者/被嘲笑先知先例
  const mZhIdx = firstHit(M_Z, text);
  const mEnIdx = firstHit(M_E, text);
  const mIdx = mZhIdx >= 0 ? mZhIdx : mEnIdx;
  if (mIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 结论迁移（自我平反或反对者受辱）
  const tZhIdx = firstHit(T_Z, text);
  const tEnIdx = firstHit(T_E, text);
  const tIdx = tZhIdx >= 0 ? tZhIdx : tEnIdx;
  if (tIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「先例→自我平反」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(mIdx - tIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '伽利略赌局×殉道先例推自我平反(zh)'
      : 'galileo gambit×martyr-precedent-to-self-vindication(en)',
  };
}

module.exports = {
  checkGalileoGambit,
  __internals: () => ({
    MARTYR_ZH, MARTYR_EN, TRANSFER_ZH, TRANSFER_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_DISMISS_ZH, EXEMPT_DISMISS_EN,
  }),
};
