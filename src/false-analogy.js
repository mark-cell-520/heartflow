/**
 * src/false-analogy.js — 「虚假类比论证」检测器
 * （第 291 个判别维度）
 *
 * [r469 立项] decision 本体在 v6.8.230（290 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia + GitHub
 * fallacy-detection 仓库群，最高 21 星且全部依赖 LLM 推理，违反心虫零
 * 依赖约束不可集成）+ 引擎差距实测：`false_analogy` / `weak_analogy` /
 * `faulty_analogy` 在 src/ 下仅作为 fallacy-fallacy.js 的**概念教学豁免词**
 * 存在，`false_equivalence`（VERIFY 级，src/index.js:13455）只收
 * 「两类事物被说成等同」的短语族（半斤八两/都是一样的/both sides are the
 * same），**「因为 A 像 B，所以 B 的属性也适用于 A」这一跨域属性迁移的
 * 论证结构整族零覆盖**。
 *
 * 辨别的族：虚假类比论证（false analogy / weak analogy / faulty analogy /
 * argument from analogy）
 * ——用一个**表面相似**作桥，把源域的属性、机制或结论**迁移**到目标域，
 * 而该属性在目标域并不成立（或迁移未被论证）：
 *   管理一个国家就像管理一个家庭，所以家庭能省则省，国家也应该紧缩开支。
 *   人体就像一台机器，机器坏了要换零件，所以人老了也该把器官换掉。
 *   这个软件项目就像建房子，房子要先打好地基，所以我们必须先写完所有设计文档。
 *   市场经济就像丛林，丛林里弱肉强食，所以企业就该把对手全部吞掉。
 *   Running a country is just like running a household, so what works for
 *   a family budget works for the nation too.
 *   A company is like a living organism, and organisms evolve, so companies
 *   will naturally get better over time.
 *
 * 与既有维度的边界（r469 归因）：
 *   · false_equivalence（VERIFY 级）管**两类事物被说成等同**的短语族
 *     （都一样/半斤八两/both sides are the same），是**结论层的抹平**，
 *     不承载任何属性迁移推理；本族管**类比桥上的属性迁移**，源域与目标
 *     域始终是两个东西、并未被说成等同（「国家像家庭」不是「国家等于
 *     家庭」）。实测：「管理国家就像管理家庭」false_equivalence 零命中。
 *   · government_household_analogy（r375，econ 族）只管**政府-家庭财政
 *     类比这一个域**；本族是跨域泛化（人体/机器、软件/建筑、市场/丛林、
 *     公司/生物体…），且射程含该域的**非财政形**（「国家像一个家庭，
 *     所以家里管孩子要严，国家管国民也要严」）——与 r375 分工见下。
 *   · whole_part_transfer（第 170 维度）管**整体↔部分两个层级间的属性
 *     搬运**，本族管**两个不同域之间的属性迁移**，层级可以同级。
 *   · illicit_conversion（第 167 维度）管**全称命题主谓项对调**，本族
 *     不含全称命题换位。
 *   · hasty_generalization 管**样本不足的归纳**，本族不依赖样本统计，
 *     依赖的是类比桥本身。
 *   · false_balance 管**双方证据对等化呈现**，本族不涉及双方立场。
 *
 * 判据（三腿共现 + 邻近窗，缺一不判）：
 *   · 腿① ANALOGY 类比桥——A 与 B 被显式并置为相似关系
 *     （ZH: X 就像/犹如/如同/好比/跟…一样/类似于/与…类比/和…没有区别的
 *     比较形；EN: A is (just) like B / A is to B as / is analogous to /
 *      is comparable to / works like / the same way as / as if）；
 *     裸名词形态自查（r161 教训）：「就像」「好比」去掉前后缀仍命中。
 *   · 腿② PROP 源域属性/机制——类比桥之后出现源域的事实性陈述（能省则
 *     省/坏了要换零件/先打地基/弱肉强食/自然进化…；EN saves money /
 *     replaces broken parts / lays a foundation first / survival of the
 *     fittest / evolves），即「B 身上发生什么」。
 *   · 腿③ TRANSFER 迁移结论——推断词之后把该属性断言到目标域
 *     （所以/因此/因而/可见/这说明/意味着/据此；EN so/therefore/thus/
 *     which means）+ 目标域名词复现于推断词后窗内。
 *   三腿落在 80 字（EN 200 字符）邻近窗内即视为同一次「类比桥→属性迁移」
 *   论证。
 *
 * 为什么取 VERIFY 级：单句也可能是**正确的类比使用**（类比作为说明工具
 * 而非证据）、文学修辞、对类比失效的正确指出（「把国家比作家庭是错误
 * 的类比」正是本族要教的判别动作）、课堂案例。verify 的含义是「这个
 * 类比被用来承载结论，需要先补上类比有效性的论证（相关属性在同一关系
 * 上成立）再采信」——调用方应要求给出属性可迁移的依据，而不是接受
 * 「像」冒充的「是」。
 *
 * 明确不判的（豁免，五组）：
 *   · 概念/教学转述（虚假类比/不当类比/错误类比/类比谬误/机械类比/无效
 *     类比/不当比喻/逻辑谬误/老师/教材/课堂/教授/课本；EN false analogy /
 *     weak analogy / faulty analogy / argument from analogy / logical
 *     fallacy / textbook / lecture / professor / classroom）——讨论这个
 *     谬误本身不是运用它；
 *   · 推理否定/类比失效指出（不等于/不意味着/不代表/不能类比/不可类比/
 *     不能相提并论/不能混为一谈/未必/不一定/取决于/推不出/说明不了/
 *     而不是/而非/牵强/站不住；EN not necessarily / does not mean / cannot
 *     be compared / is not analogous / depends on / cannot conclude）——
 *     指出类比无效本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/恐怕/似乎/好像/多半；EN maybe/perhaps/
 *     might/probably/seems/appears）——概率化结论不作谬误判定；
 *   · 疑问句（含 ?/？）——提问不是断言；
 *   · 已声明类比局限（类比有局限/仅供类比/打个比方/玩笑话/形象地说/
 *     通俗地讲/严格来说不同；EN metaphorically / loosely speaking /
 *     as a metaphor / not literally / figuratively）——显式标注修辞
 *     身份、不承载证据的说明性用法。
 */
'use strict';

// ─── 腿① ANALOGY 类比桥（中文）──────────────────────────────────────
// 枚举腿自查（161 轮教训）：类比词全部取裸名词形态（「就像」「好比」
// 去掉前后缀仍命中），并收「跟/与…一样」「类似于」「类比」三种结构形。
const ANALOGY_ZH = [
  // [r469] 裸词形态自查（r161 教训）：「像」字裸收（像/很像/就该像/就像
  // 全部命中）——「就该像管理家庭一样」曾被漏判，因为只收「就像」紧邻形。
  /像/,
  /就好像|正像|如同|犹如|好比|譬如有|仿若|宛如|仿佛|彷若/,
  /(?:跟|与|和|同)[^。，！？!?,;；\n]{1,12}(?:一样|差不多|没(?:有)?什么?区别|没啥区别|相似|类似)/,
  // [r469] 「把/将/拿…比作」形——原表只收「类似于/相提并论」，
  // 「把国家比作家庭」整族漏判（r469 实测 ZH-10）。
  /(?:把|将|拿|以)[^。，！？!?,;；\n]{1,12}(?:比作|比成|比做|比喻成|比喻为|比拟)/,
  // [r470] 「将/把/拿…与…作类比」形——原腿③只收「比作」紧邻形，
  // 「将学习与登山作类比」整族漏判（r470 矩阵 ZH-7）。
  /(?:将|把|拿|以)[^。，！？!?,;；\n]{1,12}(?:与|和|同|跟)[^。，！？!?,;；\n]{1,12}(?:作类比|做类比|相比拟|相类比|类比)/,
  /类似于|类比于|可?与[^。，！？!?,;；\n]{1,12}相提并论|可?与[^。，！？!?,;；\n]{1,12}相比/,
];

// ─── 腿① ANALOGY 类比桥（英文）──────────────────────────────────────
const ANALOGY_EN = [
  /\b(?:is|are|was|were)\s+(?:just\s+|exactly\s+|really\s+|basically\s+)?like\b/i,
  /\b(?:is|are|was|were)\s+(?:just\s+)?(?:as\s+if|analogous\s+to|comparable\s+to|similar\s+to)\b/i,
  /\bworks?\s+(?:just\s+)?like\b/i,
  /\bthe\s+same\s+way\s+(?:as|that)\b/i,
  /\bas\s+if\b/i,
];

// ─── 腿② PROP 源域属性/机制（中文，裸名词形态）─────────────────────
// 源域事实性陈述：把 B 身上发生的事说出来（能省则省/坏了要换零件/先打
// 地基/弱肉强食/自然进化/适者生存…）。
const PROP_ZH = [
  /能省则省|省吃俭用|勤俭节约|量入为出|收支平衡|精打细算|积少成多|紧缩开支|节衣缩食|削减开支|省吃俭用地|省钱|入不敷出|超支|透支/,
  // [r470] 「行为规训」源域属性族——原表只收财政/机械/建筑/丛林/进化
  // 四族，「家里管孩子要严格」这种源域行为规整属性整族漏判（r470 矩阵
  // ZH-2：类比桥命中但 PROP NULL）。
  /(?:管|管教|管教|约束|要求|对待)[^。，！？!?,;；\n]{0,8}(?:孩子|子女|后代|下属|成员|士兵|群众|国民)/,
  /(?:要|须|必须|得|应当|应该|就该)[^。，！？!?,;；\n]{0,6}(?:严格|严厉|从严|服从|听话|守规矩|守纪律|令行禁止)/,
  /令行禁止|绝对服从|服从命令|军令如山|不得违抗/,
  // [r470] 「渐进步骤」源域属性族——「登山要一级一级爬」这种源域
  // 渐进机制属性（r470 矩阵 ZH-7：桥命中但 PROP NULL）。
  /(?:一(?:级|步|层|个|层层|步步|层层|点一点)|循序|逐步|按部就班)[^。，！？!?,;；\n]{0,8}(?:爬|升|走|来|做|建|完成)/,
  // [r469] 裸词自查（r161 教训）：「坏」字族必须含「故障」——ZH-8 长句
  // 「机器出现故障时就要更换损坏的零件」因只收「坏」整族漏判；另收
  // 「更换零件/换零件」整词形（不依赖前后「坏」字）。
  /(?:[坏故障]|损坏|出故障)[^。，！？!?,;；\n]{0,8}(?:要|就得|需要|必须|会)[^。，！？!?,;；\n]{0,6}(?:换|修|替换|更换|淘汰)/,
  /(?:换|修|替换|更换)[^。，！？!?,;；\n]{0,4}(?:零件|部件|配件|器官|元件|零件)/,
  /(?:要|先|得)[^。，！？!?,;；\n]{0,8}(?:打?地基|奠基|打基础|夯实)/,
  /弱肉强食|适者生存|优胜劣汰|物竞天择|丛林法则|你死我活|大鱼吃小鱼|吞掉|吞并|淘汰出局|被消灭|消灭对手/,
  /(?:会|就会|必然|自然)[^。，！？!?,;；\n]{0,6}(?:进化|演化|进步|改善|变强|升级)/,
  /(?:新陈代谢|细胞)[^。，！？!?,;；\n]{0,10}(?:换|更新|更替|凋亡|死亡|淘汰)/,
  // [r469] 源域属性裸名词形：「分工协作」「令行禁止」整词收（r161 教训：
  // 只收「分工」导致「各声部分工协作」漏属性腿）。
  /分工协作|分工|协作|配合默契|各司其职|统筹|调度|令行禁止|绝对服从|服从命令/,
  /(?:有|存在)[^。，！？!?,;；\n]{0,4}(?:生命周期|生老病死|成长|衰老|成熟|衰退)/,
];

// ─── 腿② PROP 源域属性/机制（英文）─────────────────────────────────
const PROP_EN = [
  /\bsaves?\s+(?:money|for\s+a\s+rainy\s+day)\b|\blive[sd]?\s+within\s+(?:its|their|your)\s+means\b|\bbalanced?\s+budget\b|\bcuts?\s+(?:back|spending)\b|\boversp(?:ent|ends?|ending)\b|\blives?\s+beyond\s+its\s+means\b|\bmaxed?\s+out\b|\bdebt\s+(?:ceiling|limit|burden)\b/i,
  /\b(?:replace[sd]?|swap[s]?|change[s]?)\s+(?:the\s+)?(?:broken|worn|failing|bad)\s+(?:part|parts|component|components|organ|organs)\b/i,
  /\b(?:lay[s]?|laid|build[s]?)\s+(?:a\s+)?(?:solid|strong|good|deep)?\s*foundation\b|\blay[s]?\s+the\s+groundwork\b/i,
  // [r470] 「燃料/能量」源域属性族——原族形为 `needs? (fuel|energy|input|food) to`，
  // 要求 fuel 后紧跟 to，漏「engines need fuel, so…」这种 fuel 后接逗号/
  // 句号的形态（r470 矩阵 EN-3 PROP NULL）。放宽后缀要求。
  /\bsurvival\s+of\s+the\s+fittest\b|\blaw\s+of\s+the\s+jungle\b|\bstronger\s+(?:ones?|firms?|companies)\s+(?:win|prevail|survive)\b|\beat\s+or\s+be\s+eaten\b/i,
  /\bneeds?\s+(?:fuel|energy|input|food|gasoline|petrol|coal|electricity)\b|\brequires?\s+(?:fuel|energy|input|food|gasoline|petrol|coal|electricity)\b|\bcannot\s+(?:run|function|operate|move)\s+without\b/i,
  // [r470] 「规训/秩序强加」源域属性族——原表缺 frontier→tamed 这类属性
  // （r470 矩阵 EN-5：PROP NULL）。
  /\b(?:tamed?|policed|governed|controlled|regulated|subdued|conquered|disciplined|patrolled)\b|\blawmen\b|\bsheriff\b|\bposse\b|\bkeepers?\s+of\s+(?:the\s+)?(?:peace|order)\b/i,
  /\b(?:evolve[s]?|evolved|adapts?|adapted|improves?|improved|gets?\s+better)\b/i,
  // [r470] 「家用财务」源域属性族——EN-1「a family budget works」：
  // 原财务族只收 saves/within its means/budget cuts 等谓语形，漏
  // 「family budget」这种名词性财务载体形（r470 矩阵 EN-1 PROP NULL）。
  /\b(?:household|family|home)\s+budget\b|\b(?:budget|spending|finances?)\s+(?:works?|balanced|tight)\b/i,
  // [r470] 「存储/数据」源域属性族——EN-4「computers store data in
  // files」：原表无存储机制族，机械/进化/丛林之外整族漏判（EN-4 PROP
  // NULL）。
  /\b(?:store[sd]?|stores|storing|save[sd]?|saved|saving|record[sd]?|log(?:s|ged)?|kee(?:p|ps|ping))\s+(?:data|information|memories|files|records|everything)\b|\bdata\s+(?:in|as)\s+(?:files?|folders?|chunks?|bits?)\b|\bstored\s+in\s+(?:specific\s+)?(?:brain\s+)?regions?\b|\bfiles?\s+(?:and|or)\s+folders?\b/i,
  // [r470] 「容器灌注」源域属性族——EN-7「empty vessels to be filled
  // with knowledge」：原表无灌注族，「把学生当空容器」整族漏判（EN-7
  // PROP NULL）。
  /\b(?:empty|blank|hollow)\s+(?:vessels?|containers?|cups?|pots?|jars?|buckets?|slates?)\b|\b(?:filled?|poured|stuffed|crammed|loaded)\s+(?:with|into)\s+(?:knowledge|information|facts|ideas|data)\b|\bfill(?:ing|s)?\s+(?:them|students|pupils|children)\s+with\b/i,
  /\bmetabolis[mn]|\bcell[s]?\s+(?:die|turn\s+over|regenerate|renew)\b|\bapoptosis\b/i,
  /\bdivision\s+of\s+labou?r\b|\bwork[s]?\s+together\b|\bcooperat(?:es?|ion)\b/i,
];

// ─── 腿③ TRANSFER 推断词 + 目标域复现（中文）───────────────────────
const INFER_ZH = [
  /所以|因此|因而|故而|故|可见|这说明|意味着|足以证明|据此|于是|当然|显然|毫无疑问/,
];
const MODAL_ZH = [
  /自然|必然|一定|肯定|势必|无疑|必定|同样|也|就该|也应该|也要/,
];

// ─── 腿③ TRANSFER（英文）───────────────────────────────────────────
const INFER_EN = [
  /\b(?:therefore|thus|hence|consequently|which\s+means|so)\b/i,
];
const MODAL_EN = [
  /\b(?:must|should|shall|ought\s+to|had\s+best|certainly|guaranteed|bound\s+to|sure\s+to|inevitably|no\s+doubt|definitely|also|too|as\s+well)\b/i,
];

// ─── 目标域名词（腿③复现用，中英裸名词形）─────────────────────────
// 与 PROP 侧源域名词分开：迁移的有效形态是「源域名词（桥前）→ 属性（桥
// 后）→ 目标域名词（推断词后）」，两侧名词同族不同实例。
const TARGET_ZH = [
  /国家|政府|民族|社会|企业|公司|市场|经济|团队|组织|机构|学校|家庭|家族|城市|行业|系统|平台|软件|项目|产品|人体|身体|生命|人生|教育|管理|改革|政策|制度|法律|军队|部队|学校|班级|个人|员工|国民|公民|群众|消费者|用户|学习|读书|认知|思维|心理|语言|文化|艺术|科学|技术|历史|政治|道德|伦理|宗教|信仰|婚姻|育儿|养老|医疗|健康|环境|能源|交通|通信|金融|投资|贸易|竞争|合作|创新|创业|职业|职场|社区|村庄|城镇/,
];
const TARGET_EN = [
  // [r470] 教育域目标名词——EN-7「Treat students as if they were empty
  // vessels」：原表有 school/class 但无 students/pupils/learners，
  // 教育学类比整族断在腿③目标域名词（r470 矩阵 EN-7 TARGET NULL）。
  /\b(?:country|nation|government|society|company|corporation|firm|market|economy|team|organization|institution|school|family|city|industry|system|platform|software|project|product|body|person|life|education|management|reform|policy|law|military|army|class|individual|employee|citizen|consumer|user|student|students|pupil|pupils|learner|learners|child|children|kid|kids|workforce|population|voter|voters)\b/i,
];

// ─── 源域名词（腿②定位用，中英裸名词形）───────────────────────────
const SOURCE_ZH = [
  /家庭|家族|机器|机械|建筑|房子|房屋|丛林|森林|自然界|大自然|生物|生物体|有机体|身体|人体|细胞|军队|部队|电脑|计算机|程序|软件|网络|互联网|大脑|大脑|河流|海洋|交通|交通网络|工厂|生产线|学校|班级|球队|交响乐|乐团|交响乐团|钟表|手表|时钟|引擎|发动机|汽车/,
];
const SOURCE_EN = [
  /\b(?:family|household|machine|engine|building|construction|house|jungle|forest|nature|organism|creature|body|cell|army|military|computer|software|network|internet|brain|river|ocean|traffic|factory|production\s+line|school|classroom|team|orchestra|symphony|clock|watch|car|vehicle)\b/i,
];

// ─── 豁免一：概念/教学转述──────────────────────────────────────────
const EXEMPT_CONCEPT_ZH = [
  /虚假类比|不当类比|错误类比|无效类比|类比谬误|机械类比|不当比喻|牵强附会|逻辑谬误|谬误|老师|教材|课堂|教授|课本|课文|讲义|举例|例如说|打个比方|换言之/,
];
const EXEMPT_CONCEPT_EN = [
  /false\s+analogy|weak\s+analogy|faulty\s+analogy|argument\s+from\s+analogy|analogical\s+reasoning|logical\s+fallacy|fallacy|textbook|lecture|professor|teacher|classroom|for\s+example|for\s+instance|in\s+other\s+words/i,
];

// ─── 豁免二：推理否定 / 类比失效指出────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不能类比|不可类比|无法类比|不能相提并论|不可相提并论|不能混为一谈|不可混为一谈|不等于|不意味着|不代表|未必|不一定|取决于|推不出|说明不了|证明不了|而不是|而非|牵强|站不住|不恰当|不成立|并不相同/,
];
const EXEMPT_NEG_EN = [
  /not\s+necessarily|does\s+not\s+mean|doesn'?t\s+mean|cannot\s+be\s+compared|can'?t\s+be\s+compared|is\s+not\s+analogous|not\s+the\s+same|depends\s+on|cannot\s+conclude|can'?t\s+conclude|rather\s+than|instead\s+of/i,
];

// ─── 豁免三：对冲（概率化结论，同 r161 口径）───────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|tends?\s+to|not\s+always)\b/i,
];

// ─── 豁免四：已声明类比局限（说明性用法，不承载证据）───────────────
const EXEMPT_META_ZH = [
  /类比有局限|类比有限|仅供类比|只是打比方|打个比方|玩笑话|形象地说|形象地讲|通俗地讲|通俗地说|严格来说|严格来讲|并不相同|不完全相同|有所不同|只是比喻|修辞/,
];
const EXEMPT_META_EN = [
  /metaphorically|loosely\s+speaking|as\s+a\s+metaphor|not\s+literally|figuratively|in\s+a\s+figurative\s+sense|the\s+analogy\s+(?:is\s+)?(?:limited|imperfect|breaks\s+down)/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 在 text 的 from 偏移起找 list 中最早出现的匹配，返回 {idx, len} 或 null */
function firstMatch(list, text, from) {
  const start = from || 0;
  const sub = text.slice(start);
  let best = null;
  for (const re of list) {
    const m = sub.match(re);
    if (m && m.index >= 0 && (!best || m.index < best.idx)) {
      best = { idx: start + m.index, len: m[0].length };
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFalseAnalogy(text, inject) {
  // 非字符串入口守卫：number/object 会让 text.slice 崩溃。
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const A_Z = R.ANALOGY_ZH || ANALOGY_ZH;
  const A_E = R.ANALOGY_EN || ANALOGY_EN;
  const P_Z = R.PROP_ZH || PROP_ZH;
  const P_E = R.PROP_EN || PROP_EN;
  const I_Z = R.INFER_ZH || INFER_ZH;
  const I_E = R.INFER_EN || INFER_EN;
  const M_Z = R.MODAL_ZH || MODAL_ZH;
  const M_E = R.MODAL_EN || MODAL_EN;
  const T_Z = R.TARGET_ZH || TARGET_ZH;
  const T_E = R.TARGET_EN || TARGET_EN;
  const S_Z = R.SOURCE_ZH || SOURCE_ZH;
  const S_E = R.SOURCE_EN || SOURCE_EN;
  const EC_Z = R.EXEMPT_CONCEPT_ZH || EXEMPT_CONCEPT_ZH;
  const EC_E = R.EXEMPT_CONCEPT_EN || EXEMPT_CONCEPT_EN;
  const EN_Z = R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH;
  const EN_E = R.EXEMPT_NEG_EN || EXEMPT_NEG_EN;
  const EH_Z = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const EH_E = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;
  const EM_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const EM_E = R.EXEMPT_META_EN || EXEMPT_META_EN;

  // 全局豁免：概念教学 / 推理否定 / 对冲 / 类比局限声明 / 疑问句
  if (anyHit(EC_Z, text) || anyHit(EC_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EN_Z, text) || anyHit(EN_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EH_Z, text) || anyHit(EH_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EM_Z, text) || anyHit(EM_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const ANA = A_Z.concat(A_E);
  const PROP = P_Z.concat(P_E);
  const INF = I_Z.concat(I_E);
  const TAIL = I_Z.concat(I_E).concat(M_Z, M_E);
  const TGT = T_Z.concat(T_E);
  const SRC = S_Z.concat(S_E);
  const isZh = /[\u4e00-\u9fff]/.test(text);
  const WIN = isZh ? 80 : 200;

  // ── 主路由：类比桥 × 源域属性 × 迁移结论 ────────────────────────
  // 腿① ANALOGY：类比桥（A 像 B）。取文中最早一处，之后 60 字
  // （EN 160 字符）内须有腿② PROP（源域属性）。
  const an = firstMatch(ANA, text, 0);
  if (an) {
    const propWin = isZh ? 60 : 160;
    const pr = firstMatch(PROP, text, an.idx + an.len);
    if (pr && pr.idx - (an.idx + an.len) <= propWin) {
      // 腿③ TRANSFER：推断词（或必然/迁移情态）在腿②之后、邻近窗内，
      // 且推断词之后窗内出现目标域名词。
      const inf = firstMatch(INF, text, pr.idx + pr.len);
      const tail = firstMatch(TAIL, text, pr.idx + pr.len);
      const transferAt = inf && (!tail || inf.idx <= tail.idx) ? inf : tail;
      if (transferAt && transferAt.idx - (pr.idx + pr.len) <= WIN) {
        const tgt = firstMatch(TGT, text, transferAt.idx + transferAt.len);
        if (tgt && tgt.idx - (transferAt.idx + transferAt.len) <= 40) {
          return {
            hit: true, score: 0.56, count: 1,
            detail: isZh
              ? '虚假类比论证×类比桥属性迁移到目标域(zh)'
              : 'false analogy×property transfer across domains(en)',
          };
        }
      }
    }
  }

  // ── 退回路由（结论先行变体）─────────────────────────────────────
  // 「国家应该像家庭一样节俭，所以……」「企业管理就该像指挥军队那样，
  // 因此……」——目标域名词出现在类比桥**之前**，桥后紧跟源域属性与迁移
  // 结论。判据：目标域名词（全文任意处，早于桥）→ 类比桥 → 源域属性
  // → 迁移结论标记（推断词或迁移情态），目标域名词与桥的距离 ≤40 字。
  const tgtAny = firstMatch(TGT, text, 0);
  if (tgtAny) {
    const an2 = firstMatch(ANA, text, tgtAny.idx + tgtAny.len);
    if (an2 && an2.idx - (tgtAny.idx + tgtAny.len) <= 40) {
      const propWin = isZh ? 60 : 160;
      const pr2 = firstMatch(PROP, text, an2.idx + an2.len);
      if (pr2 && pr2.idx - (an2.idx + an2.len) <= propWin) {
        const inf2 = firstMatch(INF, text, pr2.idx + pr2.len);
        const tail2 = firstMatch(TAIL, text, pr2.idx + pr2.len);
        const transferAt2 = inf2 && (!tail2 || inf2.idx <= tail2.idx) ? inf2 : tail2;
        if (transferAt2 && transferAt2.idx - (pr2.idx + pr2.len) <= WIN) {
          return {
            hit: true, score: 0.56, count: 1,
            detail: isZh
              ? '虚假类比论证×目标域先行+类比桥属性迁移(zh)'
              : 'false analogy×target-first property transfer(en)',
          };
        }
      }
    }
  }

  // ── 退回路由二（源域名词 × 类比桥 × 迁移结论，属性词可缺席）───────
  // 「把国家比作家庭——家庭量入为出，国家也应当如此」：桥前有源域名词、
  // 桥后有源域属性 + 迁移结论，目标域名词在桥前由 MODAL 迁移词承接。
  const src = firstMatch(SRC, text, 0);
  if (src) {
    const an3 = firstMatch(ANA, text, src.idx + src.len);
    if (an3 && an3.idx - (src.idx + src.len) <= 30) {
      const propWin = isZh ? 60 : 160;
      const pr3 = firstMatch(PROP, text, an3.idx + an3.len);
      if (pr3 && pr3.idx - (an3.idx + an3.len) <= propWin) {
        const inf3 = firstMatch(INF, text, pr3.idx + pr3.len);
        const tail3 = firstMatch(TAIL, text, pr3.idx + pr3.len);
        const transferAt3 = inf3 && (!tail3 || inf3.idx <= tail3.idx) ? inf3 : tail3;
        if (transferAt3 && transferAt3.idx - (pr3.idx + pr3.len) <= WIN) {
          return {
            hit: true, score: 0.54, count: 1,
            detail: isZh
              ? '虚假类比论证×源域名词桥接+属性迁移(zh)'
              : 'false analogy×source-noun bridged transfer(en)',
          };
        }
      }
    }
  }

  // ── 退回路由三（结论先行倒装形）─────────────────────────────────
  // 「人老了就该把器官换掉，人体就像一台机器，机器坏了当然要换零件。」
  // / "We should cut social spending, as if the nation were a household that
  //   has overspent."——目标域名词与迁移结论（推断词或迁移情态）在类比桥
  // **之前**出现（先下结论再补类比），桥后只跟源域属性、无推断词。
  // 判据：目标域名词 → 迁移结论词（dist ≤ WIN）→ 类比桥（dist ≤ 40）→
  // 源域属性（dist ≤ propWin）。r470 矩阵 ZH-5 / EN-6 实证补路。
  const tgtR4 = firstMatch(TGT, text, 0);
  const propWin4 = isZh ? 60 : 160;
  if (tgtR4) {
    // 检索方向修正：结论词可能在目标域**之前**（EN-6: should@3 < nation@41）。
    // 全文收集全部结论词候选，取与目标域互为邻居（双向 dist ≤ WIN）中最近者。
    let conclR4 = null;
    let conclBest = Infinity;
    for (let ci = 0; ci < text.length; ci++) {
      const infC = firstMatch(INF, text, ci);
      const tailC = firstMatch(TAIL, text, ci);
      const c = infC && (!tailC || infC.idx <= tailC.idx) ? infC : tailC;
      if (!c) break;
      const d = Math.abs(c.idx - (tgtR4.idx + tgtR4.len));
      if (d <= WIN && d < conclBest) { conclBest = d; conclR4 = c; }
      ci = c.idx; // 推进到该命中处，避免死循环
    }
    // 顺序不限：结论词可在目标域前（EN-6）或后（ZH-5），二者互为邻居即可。
    const dTgtConcl = conclR4
      ? Math.abs(conclR4.idx - (tgtR4.idx + tgtR4.len))
      : Infinity;
    if (conclR4 && dTgtConcl <= WIN) {
      // 桥起点 = 结论词之后即可。EN-6 的桥@31 在目标域 nation@41 之前（
      // 「should cut spending, as if the nation were a household…」），
      // 不能再要求桥必须出现在目标域之后。
      const an4 = firstMatch(ANA, text, conclR4.idx + conclR4.len);
      // 桥与目标域互为邻居：双向 dist ≤ WIN（倒装形中二者顺序不定）。
      const dAnaTgt = an4 ? Math.abs(an4.idx - (tgtR4.idx + tgtR4.len)) : Infinity;
      if (an4 && dAnaTgt <= WIN) {
        const pr4 = firstMatch(PROP, text, Math.max(an4.idx + an4.len, tgtR4.idx + tgtR4.len));
        if (pr4 && pr4.idx - (an4.idx + an4.len) <= propWin4) {
          return {
            hit: true, score: 0.54, count: 1,
            detail: isZh
              ? '虚假类比论证×结论先行倒装+类比桥属性迁移(zh)'
              : 'false analogy×conclusion-first inverted transfer(en)',
          };
        }
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkFalseAnalogy,
  __internals: () => ({
    ANALOGY_ZH, ANALOGY_EN, PROP_ZH, PROP_EN, INFER_ZH, INFER_EN,
    MODAL_ZH, MODAL_EN, TARGET_ZH, TARGET_EN, SOURCE_ZH, SOURCE_EN,
    EXEMPT_CONCEPT_ZH, EXEMPT_CONCEPT_EN, EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN, EXEMPT_META_ZH, EXEMPT_META_EN,
  }),
};
