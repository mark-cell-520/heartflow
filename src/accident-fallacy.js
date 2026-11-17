/**
 * src/accident-fallacy.js — 「偶例谬误 / 通则滥用」检测器
 * （第 260 个判别维度，r372）
 *
 * [r372 立项] philosophy_decision 在当前引擎（v6.8.189，259 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为
 * "unknown"，按轮次纪律不当实质背书）。立项缺口实证（探针
 * /tmp/hf-scout/scripts/round-372/probe-accident-r372.js，pristine 基线）：
 * 13 条攻击样本穿透 7 条（存量 fallacy_of_relevance / absolute_claim /
 * hasty_generalization / moral_foundations 代拦），**6 条真零命中**，
 * 良性 0/8 误伤。grep 覆盖确认 accident_fallacy / 偶例谬误 /
 * secundum quid / dicto simpliciter 在 src/ 下零命中（仅
 * might-makes-right.js 头注释里作为边界列举出现一次，未实现）。
 *
 * 外部来源：三层搜索（HN Algolia / Semantic Scholar / GitHub）——
 * S2 返回 429 限流；GitHub logical fallacy detection 高星仓库最高
 * 21 star（tmakesense/logical-fallacy），均为 LLM-based 或学生项目，
 * 心虫为纯规则引擎**不引入 LLM 依赖**，无成熟规则方案可抄。
 * HN 命中条目与 UQ/overconfidence 主题无关。按既有维度形态自建纯规则
 * 判据，谬误本体取自亚里士多德《辨谬篇》13 谬误中的
 * **accident / a dicto simpliciter ad dictum**（通则滥用/偶例谬误）。
 *
 * 辨别的族：偶例谬误（accident fallacy / a dicto simpliciter / secundum
 * quid 的逆用）——把**通则/一般规则/平均规律**套用到其有效性边界之外的
 * **例外情形**，把「一般成立」当成「无一例外成立」：
 *   锻炼本来就有益健康，所以那些膝盖严重损伤的人也应该每天跑步十公里。
 *   水在100度会沸腾，所以你在青藏高原上也应该看到水在100度沸腾。
 *   一般来说这个药是安全的，所以婴儿和孕妇都可以随便吃。
 *   法律面前人人平等，所以给盲人安排专用通道也是特权。
 *   市场定价是最有效率的，所以救命药在瘟疫期间也不该限价。
 *   Exercise is good for you, so people with severe knee injuries should
 *   run ten kilometers a day.
 *   Water boils at 100 degrees, so it should boil at 100 degrees on the
 *   Tibetan plateau too.
 *   Freedom of contract is a legal principle, so wartime conscription
 *   should admit no exceptions.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：通则的成立
 * **依赖边界条件**——「水在 100 度沸腾」的有效性依赖标准大气压，
 * 「锻炼有益健康」依赖身体条件允许。把通则当成无条件的，等于抹掉
 * 它的适用范围，这在物理、医学、法律、经济里都会产生真实错误决策
 * （给膝伤者开十公里跑处方、给婴儿开孕妇禁用药）。它与 hasty_
 * generalization（样本→总体的以偏概全）方向相反：本族是
 * **总体/通则→个体例外**这一方向的越界，且不依赖任何样本统计。
 *
 * 与既有维度的边界（r372 归因）：
 *   · ecological_fallacy（第 211 维度）判「聚合层统计量→个体层量化
 *     指称」（平均收入高所以每个人都很有钱），腿①必须是**统计量**
 *     （平均/比率/率/统计显示），腿②必须是**个体层量化指称**（每个人/
 *     人人/every individual）；本族的腿①是**通则宣告**（一般规则/
 *     一般来说/原则/规则是/no exceptions），腿②是**例外情形**
 *     （膝伤/高原/婴儿/孕妇/例外/when...）——「一般安全所以婴儿也能吃」
 *     在 ecological 侧腿②无个体量化指称故漏判，本族补。
 *   · hasty_generalization 管样本→总体，本族管通则→例外（反向）。
 *   · whole_part_transfer 管涌现性质量在部分↔整体间搬运，本族不搬运
 *     质量、只把通则的适用范围抹掉。
 *   · absolute_claim 管断言强度（绝对化措辞），本族管**越界套用**这
 *     一推理动作本身——强度词可缺席（「一般来说这个药是安全的」含
 *     对冲词却是本族攻击形）。
 *
 * 判据（主判据两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① RULE 通则宣告（ZH 四族 + EN 四族）：
 *       G-一般形：一般来说/一般而言/通常/总的来说/总体上看/原则上/
 *         原则上讲/在一般情况下/多数情况下/按平均/平均来说
 *       R-规则形：规则是/规矩是/原则是/法律规定/法律面前/契约自由是/
 *         这是规则/铁律/通则/惯例是/标准做法是/惯例上讲
 *       Q-量化形（裸名词，r161 纪律：去修饰仍命中）：都/全部适用/
 *         无一例外/没有例外/任何人/人人/任何时候/任何情况
 *       P-性质形（把一般规律说成普遍性质）：有益/有效/安全/正确/
 *         正常/应当/应该/是最好的/最有效率
 *     EN: generally / in general / as a rule / by and large / on
 *         average / typically / normally / rules are rules /
 *         the rule is / the principle is / there are no exceptions /
 *         no exceptions / admits no exceptions / without exception /
 *         everyone must / all rules must be applied
 *   · 腿② EXC 例外情形（须落在腿①邻近窗内，且**不在腿①之前很远**）：
 *       Z-例外主体：婴儿|孕妇|老人|儿童|残障|盲人|聋人|膝|腰|伤|
 *         损伤|病|患者|病人|重症|术后|恢复期|怀孕|哺乳期|未成年|
 *         精神|过敏|禁忌
 *       P-例外环境/条件：高原|高海拔|低压|低压环境|战时|紧急状态|
 *         灾害|疫情|停电|断网|超载|极端|特殊|边界条件|例外
 *       N-例外宣告：例外|除外|不适用|有例外|该有例外|不在此限
 *       E-英文例外：exception(s) / except when / unless / infants /
 *         babies / pregnant / disabled / blind / injured / patients /
 *         high altitude / low pressure / wartime / emergency /
 *         contraindicated / special cases / edge cases
 *   · 邻近窗：腿① ↔ 腿② 双向，ZH 60 字 / EN 160 字符
 *
 * 为什么取 VERIFY 级：单句也可能是对通则边界的**正确说明**（「水在
 * 标准大气压下 100 度沸腾，高原上不到 100 度」正是本族要教的判别
 * 动作）、课堂案例或哲学讨论，rewrite/block 会误伤。verify 的含义是
 * 「这段文本把通则套到了例外情形上，需要先确认通则在该情形仍然有效
 * 再采信」——调用方应要求补出边界条件或限定适用范围。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（偶例谬误/通则滥用/一刀切/亚里士多德/辨谬篇/
 *     13 种谬误/逻辑谬误/教材/课堂/论文；EN accident fallacy / a dicto
 *     simpliciter / secundum quid / Aristotle / Sophistical Refutations /
 *     textbook / lecture）——讨论这个概念本身不是运用它；元话语豁免
 *     要求句中同时出现教学/学术框架标记或否定标记。
 *   · 正确响应形（承认例外并要求限定适用范围：例外/有例外/不适用/
 *     例外情况/因人而异/视情况/要区分/须区分/区分/例外论处/特许/
 *     特批/根据具体情况/具体情况具体分析/边界条件/适用范围/前提条件/
 *     前置条件；EN exceptions apply / with exceptions / on a
 *     case-by-case basis / depending on / subject to / with the caveat
 *     / where applicable / qualified by / carve-out）——**指出通则有
 *     例外并要求限定适用范围，正是本族要教的判别动作**。
 *   · 纪律性规则宣告（规矩就是规矩/不能破例/纪律/红线/硬性规定 +
 *     无例外主体与环境共现）——「规矩就是规矩，不能因为赶工就跳过
 *     code review」是正当的流程纪律陈述，非谬误（既有测试
 *     round-370/round-371 把它固定为良性样本，不得误伤）。
 *   · 推理否定/对冲（不一定/未必/不代表/不意味着/推不出/未必是/
 *     取决于/还要看/而不是/而非；EN not necessarily / does not mean /
 *     depends on / cannot conclude）。
 *   · 疑问句（含 ?/？；反问标记出现时不豁免——用问号把断言伪装成
 *     提问是操控话术最常用的包装）。
 *   · 无腿②（没有例外情形在场）——通则宣告单独出现不判。
 *   · 无腿①（没有通则宣告）——例外情形单独出现不判。
 *
 * 已知边界：
 *   · 例外情形以词表识别，未收入词表的例外（罕见病新疗法、未被列举
 *     的法规豁免）不判。
 *   · 邻近窗外的跨段共现（通则与例外相隔 >60 字 / EN >160 字符）不判。
 *   · 与 ecological_fallacy 的共命中按射程切分声明，未做大规模共现
 *     消歧压测。
 */
'use strict';

// ─── 腿① RULE 通则宣告（中文）──────────────────────────────────
const RULE_ZH = [
  // G 一般形（对冲词族：把规律限定在一般情形）
  /一般来说|一般而言|通常来说|总体上来说|总的来说|总体来看|总体上看|总体来讲|原则上|原则上讲|原则上说|在一般情况下|多数情况下|大多数情况下|按平均来说|平均来说|一般而言|一般讲|常规情况下|通常情况下|习惯上|惯例上|一般而言|普遍而言/,
  // R 规则/原则宣告形（r161 纪律：裸名词「规则/原则/规矩」去修饰仍命中）
  /规则(?:是|就是|上讲|上)?/,
  /规矩(?:是|就是)?/,
  /原则(?:是|上|上讲|上说)?/,
  /通则|惯例是|标准做法是|常规做法是|行业惯例|一般规则|一般原则|一般规律|普遍规律|普遍规则|公理|定律(?:是|上讲)?/,
  /法律(?:面前|规定|上|要求)|契约自由|合同自由|意思自治|法治原则|宪法原则|条例(?:规定)?/,
  // Q 量化无例外形
  /无一例外|没有例外|不该有例外|不得有例外|不许有例外|都不适用|不适用于|任何人都|人人(?:都|都该)?|任何时候|任何情况|任何条件下/,
  // L 定量定律形（r372：物理/化学/工程常数的定律宣告——「水在100度会
  // 沸腾」无任何一般形修饰词，但其有效性同样依赖边界条件）
  /-?\d+(?:\.\d+)?\s*(?:度|℃|°C|°|米每秒|米\/秒|米|公里|千米|公斤|千克|克|帕|千帕|兆帕|个?大气压|标准大气压|摄氏度|华氏度)/,
  // P 性质普适形（把一般性质说成普遍性质）
  /(?:本来|本身|天生|生来)?(?:就)?(?:是|为|属)?(?:有益|有效|安全|正确|正常|最好|最优|最有效率|最有效|最合理|最公平|最正义|最道德的)/,
];

// ─── 腿① RULE 通则宣告（英文）──────────────────────────────────
const RULE_EN = [
  /\b(?:generally|in\s+general|as\s+a\s+(?:rule|general\s+rule)|by\s+and\s+large|on\s+(?:the\s+)?average|on\s+average|typically|normally|usually|in\s+most\s+cases|in\s+the\s+general\s+case|as\s+an\s+empirical\s+rule)\b/i,
  /\b(?:the\s+)?(?:rule|rules|principle|principles|maxim|norms?|guidelines?)\s+(?:is|are|says?|state(?:s)?|hold(?:s)?|appl(?:y|ies))\b/i,
  /\brules\s+are\s+rules\b/i,
  /\b(?:there\s+are\s+no\s+exceptions?|no\s+exceptions?|admits?\s+no\s+exceptions?|admit\s+no\s+exceptions?|without\s+exception|makes?\s+no\s+exception|should\s+admit\s+no\s+exceptions?)\b/i,
  /\b(?:everyone|everybody|all\s+(?:rules|people|persons?|individuals?))\s+(?:must|should|has\s+to|have\s+to|shall)\b/i,
  /\b(?:law|legal\s+principle|constitutional\s+principle|doctrine)\s+(?:is|holds?|says?|requires?|mandates?)\b/i,
  /\b(?:freedom\s+of\s+contract|contract\s+freedom|equality\s+before\s+the\s+law)\b/i,
  // P 性质普适形（beneficial/safe/effective 作表语且无比较级限定）
  /\b(?:is|are)\s+(?:beneficial|healthy|good\s+for\s+(?:you|health)|safe|effective|correct|normal|optimal|the\s+(?:best|most\s+efficient|safest|fairest))\b/i,
  // L 定量定律形（r372：water boils at 100 degrees 等常数宣告——其有效性
  // 同样依赖边界条件，无一般形修饰词仍属腿①）
  /\b(?:boils?|boiling|melts?|melting|freezes?|freezing|condenses?|sublimes?|ignites?)\s+at\s+[-+]?\d+(?:\.\d+)?\s*(?:degrees?|°|deg|C|F|Celsius|Fahrenheit|kelvin|K)\b/i,
  /[-+]?\d+(?:\.\d+)?\s*(?:degrees?|°|deg\b|C\b|F\b|Celsius|Fahrenheit|kelvin|K\b|meters?|metres?|m\b|kilometers?|kilometres?|km\b|kilograms?|kg\b|pascals?|Pa\b|kilopascals?|kPa\b|megapascals?|MPa\b|atmospheres?|atm\b|newtons?|N\b|joules?|J\b|volts?|V\b|amperes?|amps?)\b/i,
];

// ─── 腿② EXC 例外情形（中文）────────────────────────────────────
const EXC_ZH = [
  // Z 例外主体（生理/健康边界——r161 纪律：裸名词「婴儿/孕妇/伤」去修饰仍命中）
  /婴儿|幼儿|新生儿|孕妇|怀孕|哺乳期|产妇|未成年人|儿童|老人|高龄|残障|残疾人|盲人|聋人|哑巴|精神(?:病|疾病|障碍)?|智力障碍|自闭|痴呆|帕金森|心脏病|高血压|糖尿病|癌|肿瘤|艾滋|乙肝|结核/,
  /膝|腰|肩|颈|关节|韧(?:带|带拉伤)|肌(?:肉)?劳损|骨(?:折|质疏松|骼)|脊(?:柱|椎)|半月板|跟腱|拉伤|扭伤|挫伤|烧伤|烫伤|创伤|术后|术后康复|恢复期|卧床|瘫痪|中风|心梗|心衰|肾(?:病|衰)|肝(?:病|硬化|功能)|哮(?:喘|喘)|癫痫|过敏|禁忌(?:症|人群)?|禁忌证|副作用|不良反应|耐药|抗药/,
  // P 例外环境/条件（物理/制度边界）
  /高原|高海拔|高山上|山顶|海拔|低压|低气压|真空|微重力|失重|太空|深海|水下|极地|极寒|酷暑|高温|严寒|零下|沸点|熔点|临界|相变|超导|超载|过载|满载|满载率|上限|阈值|饱和/,
  /战时|战争时期|紧急状态|戒严|灾害|灾情|疫情|瘟疫|大流行|地震|洪水|台风|停电|断电|断网|宕机|故障|事故|灾难|战时状态|动员|征(?:兵|用)|强制(?:征兵|征用)|接管|管制|配给|限价|价格管制|价格上限|价格干预/,
  // N 例外宣告
  /例外|除外|不适用|例外情况|特殊情况|特例|个案|特许|特批|豁免|豁免权|豁免条款|例外条款|不在此限|另当别论|另议/,
];

// ─── 腿② EXC 例外情形（英文）────────────────────────────────────
const EXC_EN = [
  /\b(?:infants?|bab(?:y|ies)|newborns?|pregnant|pregnancy|breastfeeding|nursing\s+mothers?|children|kids|minors?|elderly|seniors?|disabled|handicapped|blind|deaf|wheelchair)\b/i,
  /\b(?:patients?|with\s+(?:a\s+)?(?:medical\s+)?(?:condition|disease|illness)|contraindicat\w+|adverse\s+(?:effects?|reactions?|side\s+effects?)|allerg(?:y|ic|ies)|immunocompromised|post-?(?:surgery|operative|surgical)|in\s+recovery|bedridden|paralyz\w+|severely\s+injured|injur(?:y|ies|ed)|fractur\w+|sprain\w+|chronic\s+(?:pain|illness|disease)|kidney|hepatic|renal|cardiac)\b/i,
  /\b(?:high\s+altitude|highlands?|mountains?|peaks?|tibetan\s+plateau|plateau\w*|low\s+pressure|vacuum|microgravity|weightless(?:ness)?|zero\s+g|deep\s+sea|underwater|polar|arctic|extreme(?:ly)?\s+(?:hot|cold|heat|cold)|below\s+freezing|boiling\s+point|melting\s+point|critical\s+(?:point|temperature|pressure)|superconduct\w+|overload(?:ed)?|saturat\w+|past\s+the\s+(?:limit|threshold|breaking\s+point)|beyond\s+the\s+(?:limit|range|design))\b/i,
  /\b(?:wartime|war\s+times?|during\s+(?:a\s+)?war|state\s+of\s+emergency|national\s+emergency|martial\s+law|under\s+emergency|disaster|pandemic|epidemic|plague|outbreak|earthquake|flood|hurricane|blackout|power\s+outage|system\s+down|outage|catastroph\w+|conscription|draft(?:ed)?\s+for\s+(?:war|military)|forced\s+conscription|price\s+(?:controls?|ceilings?|caps?)|rationing|command\s+economy|requisition\w*)\b/i,
  /\b(?:exceptions?|except(?:ions?)?|except(?:ed|ing)?\s+(?:for|when|where|in)|unless|exempt(?:ed|ion|ions)?|carve-?outs?|special\s+cases?|edge\s+cases?|case-?by-?case|on\s+a\s+case-?by-?case\s+basis|does\s+not\s+apply|not\s+applicable|inapplicable|outliers?)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /偶例谬误|偶例|通则滥用|滥用通则|一概而论|一刀切(?:地)?(?:判断|处理|否定|否定)?|亚里士多德|辨谬篇| Sophistical|诡辩|13 种谬误|十三种谬误|谬误清单|谬误表|非形式谬误|形式谬误|逻辑谬误|论证谬误|谬误分类|谬误类型/,
  /secundum quid|a dicto simpliciter|dicto simpliciter|accident fallacy/,
  /教材|课堂|教科书|讲座|教案|习题|课件|论文|文献|方法论|课程|考点|考题|逻辑学|批判性思维|论证分析|案例分析/,
];
const EXEMPT_META_EN = [
  /\b(?:accident\s+fallacy|a\s+dicto\s+simpliciter|secundum\s+quid|dicto\s+simpliciter|hasty\s+generalization| Aristotle|Sophistical\s+Refutations|On\s+Sophistical\s+Refutations|informal\s+fallac\w+|logical\s+fallac\w+|fallac\w+\s+of\s+accident|fallac\w+\s+of\s+generalization|list\s+of\s+fallacies|catalog(?:ue)?\s+of\s+fallacies)\b/i,
  /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|course|lesson|called|defined|concept|notion|theory|critical\s+thinking|argument\s+analysis|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a|is\s+a\s+common)\b/i,
];

// ─── 豁免二：正确响应形（承认例外 + 要求限定适用范围）──────────
const EXEMPT_CORRECT_ZH = [
  /因人而异|因人制宜|视情况|视具体|要区分|须区分|应区分|区分对待|分别对待|例外论处|另当别论|具体情况具体分析|因地制宜|因时制宜|一把钥匙开一把锁/,
  // r372 修正：承认例外的正确响应形必须**排除否定形**——「不该有例外/
  // 没有例外」恰是偶例谬误的攻击形（把通则说成无例外），用否定前瞻挡住，
  // 否则攻击句被自家豁免组吃掉（实测：契约自由…不该有例外 → 被「有例外」
  // 误豁免）。Node 支持后行否定断言。
  /(?<![不该没未])有例外|(?<![不该没未])存在例外|(?<![不该没未])是有例外|当然有例外|不无例外|例外情况|例外情形|有例外情形|有例外情况|是有例外的/,
  /不适用|并不适用|不一定适用|未必适用|在此不适用|不适用于/,
  /边界条件|适用范围|适用前提|前提条件|前置条件|限定条件|限制条件|成立条件|约束条件|有效性依赖|取决于|要看具体情况|结合具体情况/,
  /不能一概|不可一概|不能一概而论|不能(?:简单|笼统|机械)地(?:套用|应用|推广|推论)|不能机械套用|不能(?:简单)?套用|不能笼统|不能(?:简单)类推|不能照搬|不能生搬硬套|不宜(?:简单)?套用/,
  /犯了|这就是(?:偶例谬误|通则滥用)|属于(?:偶例谬误|通则滥用)|正是(?:偶例谬误|通则滥用)|构成(?:偶例谬误|通则滥用)|是(?:偶例谬误|通则滥用)|典型的(?:偶例谬误|通则滥用)/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:exceptions?\s+(?:apply|applies|exist|always)|there\s+are\s+(?:always\s+)?exceptions?|with\s+(?:some\s+|the\s+)?(?:notable\s+)?exceptions?|on\s+a\s+case-?by-?case\s+basis|case-?by-?case|depending\s+on|subject\s+to|with\s+the\s+caveat|where\s+applicable|qualified\s+by|carve-?outs?\s+(?:apply|for)|depends\s+on\s+(?:the\s+)?(?:circumstances|context|case|situation))\b/i,
  /\b(?:does\s+not|doesn'?t|do\s+not|don'?t|cannot|can'?t|should\s+not|shouldn'?t|must\s+not|won'?t|isn'?t|aren'?t)\s+(?:apply|applies|generalize|transfer|hold|carry\s+over|work\s+in\s+every|extend)\b/i,
  /\b(?:not\s+necessarily|not\s+always|no\s+blanket|don'?t\s+overgeneralize|you\s+can'?t\s+just\s+generalize|context-?dependent|situational|contingent)\b/i,
  /\b(?:boundary|scope|domain|validity)\s+(?:conditions?|limits?|constraints?|of\s+(?:validity|applicability))\b/i,
  /\b(?:commits?|is|constitutes?|exemplifies?|illustrates?)\s+(?:an?|the)\s+(?:accident\s+fallacy|fallacy\s+of\s+accident|a\s+dicto\s+simpliciter)\b/i,
  /\b(?:preconditions?|prerequisites?|assumptions?|caveats?|stipulations?)\s+(?:must|should|apply|hold|be\s+met)\b/i,
];

// ─── 豁免三：纪律性规则宣告（非谬误——正当流程纪律）──────────────
// 「规矩就是规矩，不能因为赶工就跳过 code review」是正当纪律陈述：
// 句中无例外主体（生理/健康）与环境（物理/制度边界）共现时不判。
// 既有测试 round-370/round-371 norm-desensitize guard 与本轮 r372 探针
// 都把它固定为良性样本，不得误伤。
const EXEMPT_DISCIPLINE_ZH = [
  /规矩就是规矩|不能破例|不可破例|不许破例|纪律|红线|硬性规定|硬性要求|刚性要求|铁律|一票否决|零容忍|必须严格执行|严格执行|按章(?:办事|执行)|照章(?:办事)|按规矩|守规矩|按规定(?:办|执行)|照规定|按流程|走流程|流程不|合规|合规性|审核|审批|审计|验收|质检|把关/,
];
const EXEMPT_DISCIPLINE_EN = [
  /\b(?:rules\s+are\s+rules|no\s+shortcuts?|no\s+cutting\s+corners|due\s+diligence|due\s+process|must\s+follow\s+(?:the\s+)?(?:process|procedure|protocol)|follow\s+(?:the\s+)?(?:process|procedure|protocol)|compliance|regulatory\s+compliance|code\s+review|sign-?off|approval\s+workflow|standard\s+operating\s+procedure|SOP)\b/i,
];

// ─── 否定守卫（窗口化：查腿② 命中前的否定标记）────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|怀疑|质疑|警惕|小心|未必是|无从|禁止|切忌|不可以/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|beware|careful|doubt\w*|question\w*)\b/i;

// ─── 推理否定/对冲守卫（后置对冲豁免）──────────────────────────
// 「锻炼一般有益健康，但膝伤者应该调整」这类先立通则再承认例外的
// 陈述是**正当的边界说明**，不是偶例谬误——它在做本族要教的判别动作。
const CONCESSION_ZH = /但是|然而|不过|可是|但|却|尽管|虽然|固然|只是|可惜|遗憾的是|需要说明|要补充|另一方面|但个体|但个人|但每个|然而例外|但例外|但特殊|但膝|但婴儿|但孕妇|但高原/;
const CONCESSION_EN = /\b(?:but|however|yet|although|though|whereas|while|on\s+the\s+other\s+hand|that\s+said|with\s+the\s+caveat|caveat|except|apart\s+from)\b/i;

// 邻近窗：腿① ↔ 腿②（双向；r214 先例：例外可前置于通则之前）
const WIN_RULE_EXC_ZH = 60;
const WIN_RULE_EXC_EN = 160;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：单正则常量可被注入替换（负例脚本用 /(?!x)x/ 永假式抹掉该腿）
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 腿①：取所有命中位置（通则标记可能多处出现）
function findRuleLeg(text, isZh, R) {
  const list = isZh ? (R.RULE_ZH || RULE_ZH) : (R.RULE_EN || RULE_EN);
  const idxs = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      idxs.push(m.index);
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return idxs.sort((a, b) => a - b);
}

// 腿②：取腿①邻近窗内、未被否定的首个例外情形位置（双向配对）
function findExcLeg(text, isZh, R, ruleIdxs) {
  const list = isZh ? (R.EXC_ZH || EXC_ZH) : (R.EXC_EN || EXC_EN);
  const win = isZh ? WIN_RULE_EXC_ZH : WIN_RULE_EXC_EN;
  let best = -1, bestDist = Infinity;
  for (const ai of ruleIdxs) {
    for (const re of list) {
      const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = reG.exec(text)) !== null) {
        const d = m.index - ai;
        if (Math.abs(d) > win) continue;
        // 后置形要求未被否定对冲；前置形（EXC 在 RULE 前）跳过该检查——
        // 前置否定词多属「不一定/并非」等对冲本身的一部分
        if (d > 0 && negatedBefore(text, m.index, isZh)) continue;
        if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = m.index; }
        if (m.index === reG.lastIndex) reG.lastIndex++;
      }
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAccidentFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免（r213/r214 先例）：反问标记出现时不豁免——用问号把断言
  // 伪装成提问是操控话术最常用的包装。
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂非|焉能|哪来|哪有什么|哪来的/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 概念/教学转述：讨论这个概念本身不是运用它。元话语豁免要求句中同时
  // 出现教学/学术框架标记或否定标记（r213 收窄先例）——裸「偶例谬误」
  // 出现在实际推断陈述中不豁免。
  const metaZh = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const metaEn = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const META_FRAME_ZH = /教材|课堂|教科书|讲座|教案|习题|课件|悖论|论文|文献|方法论|范式|称为|定义为|概念|所谓|理论|分析中|研究中|课程|教学中|复习|考点|考题|说的是|指的是|书上|课上|逻辑学|批判性思维|谬误/;
  const META_FRAME_EN = /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|called|defined|concept|notion|theory|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a|is\s+a\s+common|refers\s+to|fallacy|fallacies)\b/i;
  if (anyHit(metaZh, text) || anyHit(metaEn, text)) {
    const hasFrame = META_FRAME_ZH.test(text) || META_FRAME_EN.test(text);
    const hasNeg = NEG_ZH.test(text) || NEG_EN.test(text);
    if (hasFrame || hasNeg) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 正确响应形：承认例外并要求限定适用范围
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 纪律性规则宣告：句中出现纪律标记且无例外主体共现时不判。纪律腿与
  // 例外腿的共现判定放在主判据之后（见下），此处只做「纯纪律宣告且
  // 全无例外腿」的快路径豁免。
  const disciplineZh = anyHit(R.EXEMPT_DISCIPLINE_ZH || EXEMPT_DISCIPLINE_ZH, text);
  const disciplineEn = anyHit(R.EXEMPT_DISCIPLINE_EN || EXEMPT_DISCIPLINE_EN, text);

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：腿① 通则宣告 × 腿② 例外情形（邻近窗）
  const ruleIdxs = findRuleLeg(text, isZh, R);
  if (ruleIdxs.length > 0) {
    const excIdx = findExcLeg(text, isZh, R, ruleIdxs);
    if (excIdx >= 0) {
      // 纪律性规则宣告 × 例外腿共现时不判（「规矩就是规矩」被膝伤/婴儿
      // 等词污染的情形——纪律语境无「通则套到例外」的推理动作）
      if ((isZh && disciplineZh) || (!isZh && disciplineEn)) {
        return { hit: false, score: 0, detail: '', count: 0 };
      }
      // r372 后置对冲守卫：腿② 命中后若紧跟转折/让步从句，且句中没有
      // 第二个未对冲的例外结论，整句判为边界说明而非偶例谬误。
      const excTail = text.slice(excIdx, Math.min(text.length, excIdx + 30));
      const excLead = text.slice(Math.max(0, excIdx - 20), excIdx);
      const conAfter = isZh ? CONCESSION_ZH.test(excTail) : CONCESSION_EN.test(excTail);
      const conBefore = isZh ? CONCESSION_ZH.test(excLead) : CONCESSION_EN.test(excLead);
      // r372 推论连接词腿（腿③）：偶例谬误是「通则 → 所以对例外也一样」的
      // 推理动作，句中必须出现推论/并列连接词把通则腿与例外腿连起来。裸
      // 并列陈述（「运动有益且膝伤者也该每天跑」是并列指控而非推理）不
      // 构成该谬误的话语形状。
      const INFER_ZH = /所以|因此|因而|故而|可见|这说明|这表明|就是说|这说明|那么|就该|也应该|也应当|也要|也得|同样|也一样|都适用|一律|自然|当然也|毫无例外|概莫能外|无不/;
      const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|this\s+means|that\s+means|implies|it\s+follows|consequently|accordingly|so\s+too|likewise|similarly|the\s+same\s+applies|also\s+applies|must\s+also|should\s+also|as\s+well|no\s+less)\b/i;
      const infer = isZh ? INFER_ZH.test(text) : INFER_EN.test(text);
      if (!conAfter && !conBefore && infer) {
        return {
          hit: true,
          score: 0.55,
          count: 1,
          detail: isZh
            ? '一般通则被套用到其有效性边界之外的例外情形(zh)'
            : 'general rule applied to an exception case outside its validity boundary(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAccidentFallacy,
  __internals: () => ({
    RULE_ZH, EXC_ZH,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, EXEMPT_DISCIPLINE_ZH,
    RULE_EN, EXC_EN,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN, EXEMPT_DISCIPLINE_EN,
  }),
};
