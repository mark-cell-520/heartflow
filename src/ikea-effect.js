/**
 * src/ikea-effect.js — 「宜家效应 / 劳动投入高估」检测器
 * （r471 新建：econ_reasoning_gate 聚合族第 48 子族 / 插件层第 48 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r471 立项探针（scripts/round-471/probe-r471-candidates.js 与
 *   probe-r471-shortlist.js，VERSION 6.8.232 pristine 基线）实测：
 *   存量 econ/stats 47 子族 + 291 维度对「自己劳动投入 × 产物价值/
 *   质量虚高结论」攻击形 6/8 穿透，插件层 econReasoning 对同批
 *   攻击形零族命中，良性 4/4 零误伤——射程真空确认。同池候选：
 *   certainty_effect 0/4、zero_risk_bias 1/4、pseudocertainty 1/4、
 *   curse_of_knowledge 2/4、ambiguity_aversion 3/6——本族穿透最高
 *   且判据最可规则化（劳动投入 × 估值虚高两腿共现）。
 *   海外扫描：arXiv 3 条真实命中（"Can IKEA effect promote empathy
 *   for agents?"、"The Importance of Cognitive Biases in the
 *   Recommendation Ecosystem"、"Silent Leaks: Implicit Knowledge
 *   Extraction Attack on RAG Systems through Benign Queries"），
 *   GitHub repos total_count=0、Semantic Scholar 429 限流。
 *
 * 外部来源：arXiv 3 篇命中 + Norton, Mochon & Ariely (2012)
 *   "The IKEA effect: When labor leads to love"（JCR, 行为经济学
 *   标准文献）——消费者对自己投入劳动组装的产品的估值显著高于
 *   同类成品，即便劳动投入与客观质量无关。
 *
 * 辨别的族：宜家效应 / 劳动投入高估（IKEA effect / labor-led
 *   overvaluation）——文本先给出**自己对产物投入劳动的在場指称**
 *   （亲手拼装 / 自己写的 / 团队熬出来的 / built it ourselves），
 *   再给出**把劳动直接兑现为质量或价值虚高的断言**：
 *     腿②a 质量虚高（QUALITY）：自己的东西就是更好、更结实、
 *        更可靠、质量肯定更高、肯定比买的/现成的/外部的好；
 *     腿②b 价值虚高（VALUE）：更值、含心血所以更值钱、比别人
 *        做的更香、更有价值。
 *   你自己亲手钉的桌子，肯定比工厂流水线产的更结实。
 *   这个方案是团队熬了无数个夜做出来的，所以一定比外部采购的成品更贴合需求。
 *   自己写的代码才是好代码，开源库再好也是别人的东西。
 *   People overvalue furniture they assembled themselves compared with ready-made pieces.
 *   Because we built the tool in-house, it must be better than any commercial alternative.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：自研/自制/亲手
 * 做的陈述在日常生活中到处都是——劳动投入这个事实本身是真的，
 * 毒性在于紧跟的第二动作：把劳动兑现成质量或价值优势。这一步
 * 跳过了「客观质量要用盲测/基准/标准衡量，与投入多少劳动无关」
 * 的比较纪律，让任何一方都能凭「亲手做的」三个字免掉竞品比较。
 * 与正当推理的界线很清楚：点名宜家效应的教学句、指出劳动投入
 * 不决定质量的纠正句、以及先做过外部基准再自评的中性陈述
 * （参照了市售标准/做过盲测后按数据选择），一律豁免。
 *
 * 与既有维度的边界（r471 归因，探针 + 边界实测）：
 *   · effort_justification（r234）判**投入正当化继续**（已经花了
 *     这么多钱/心血，放弃可惜/必须做完）——沉没成本轴；本族判
 *     **对自己劳动产物的估值虚高**（自己做的就是更好/更值）——
 *     产出估值轴。两族词表零交集：前者腿②是「放弃可耻/继续
 *     投入」，后者腿②是「质量/价值更高」；
 *   · endowment_effect（r241）判**禀赋所有权高估**（手里有的
 *     就是值钱）——所有权轴，无需劳动投入在场；本族必须腿①
 *     劳动投入在场，纯「我的东西就是好」归禀赋效应；
 *   · absolute_claim 等绝对化维度只收「必然/肯定/一定」措辞——
 *     本族收非绝对形（自己做的就是更顺手/overvalue）；
 *   · budget_value_conflation（r219）判预算约束与价值混淆，
 *     不涉劳动投入。
 *
 * 判据（双腿近距共现 + 三组豁免，缺一不判）：
 *   ① 腿① LABOR 劳动投入在场——ZH 亲手/自己动词族、熬/打磨/
 *     心血/DIY 族；EN assembled/built/wrote/made it ourselves 族；
 *   ② 腿② QUALITY 质量虚高（ZH 多形 / EN 多形）或 VALUE 价值
 *     虚高（ZH 多形 / EN 多形）任一；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），方向不限；
 *   ④ 腿②查强否定前缀守卫（「并不比现成的好」= 失配）；
 *   ⑤ 豁免 A 概念教学（宜家效应/IKEA effect/labor-led overvaluation
 *     被点名）；
 *   ⑥ 豁免 B 纠正句（劳动投入不决定质量/自研有盲区/labor doesn't
 *     determine value/in-house blind spots）；
 *   ⑦ 豁免 C 基准在先（参照市售标准/做过盲测/benchmarked/b blind
 *     tested——先有外部比较再自评是正当做法）；
 *   ⑧ 中性劳动陈述无腿②天然不判（桌子是我自己拼的，花了一个下午）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观陈述一个劳动投入事实
 * （「主管坚持自研，认为自己的方案更稳」是事实转述），也可能是
 * 正确的主观偏好表达。verify 的语义是「这段话把劳动投入直接
 * 兑现成了质量或价值优势，先核对盲测/基准/标准数据，再决定
 * 是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 中性劳动陈述（桌子是我自己拼的/we assembled it ourselves）；
 *   · 概念教学（宜家效应指人们高估自己劳动成果的现象）；
 *   · 纠正句（劳动投入多少和产品质量没有必然关系/we benchmarked
 *     before deciding）；
 *   · 疑问句（自己做的真的更好吗？——无断言腿②）；
 *   · 近邻维度领地（effort_justification 放弃可耻、endowment_effect
 *     所有权高估、absolute_claim 绝对化措辞）。
 */
'use strict';

// ─── 腿① LABOR 劳动投入在场 ───────────────────────────────────
// Z1 亲手/自己动词族（亲手拼装/自己写的/自己造/自己钉的/亲手做的）
//    限定「亲手/自己/亲自」+ 动词 + 可选「的」——防「自己看着办」
//    式非劳动形误伤。
//    [r471] 窗口 {0,8}→{0,14}：存量漏「照着图纸一块板一块板拼起来」
//    式**过程状语插在主语与动词之间**的长插入形（r471 收尾探针：IKEA
//    攻击 ZH 1 条穿透，腿①断在此）。语义不变，仍要求亲手/自己先行词
//    在同一小句内出现。
const LABOR_SELF_ZH = /(?:亲手|亲自动手|亲自|自己|自家|本人)[^。，！？；\n]{0,14}(?:拼|装|组装|钉|敲|做|写|造|研发|开发|搭|建|画|设计|腌|泡|酿|缝|织|修|攒|打|磨|栽|种|养|喂|培|育|灌|劈|锯|刨|焊|铆|刻|雕|绣|编|捏|揉|搓|和|拌|炒|煎|烤|蒸|卤|漆|刷|抹|贴|裁|剪|纫|纺|缫)/;
// Z2 熬/打磨/心血族（熬了几个通宵/精心打磨/倾注心血/花了大量心血）
const LABOR_TOIL_ZH = /(?:熬|耗费|花了|倾注|投入|灌注|倾)(?:了)?[^。，！？；\n]{0,10}(?:通宵|夜|心血|精力|汗水|时间|心血|精力|大量时间|无数|几个月|几天)|(?:精心|悉心|用心|仔细)?(?:打磨|雕琢|打磨出|打造)/;
// Z3 DIY 族（DIY/自己动手/自制/手工）
const LABOR_DIY_ZH = /DIY|自己动手|自己动[手做]|手工(?:制作|做|打造)|自制(?:的)?(?:家具|方案|工具|软件|代码|产品)/;

// E1 assembled/built/made it ourselves 族
//    r471 实测补形：反身词族补 themselves/himself/herself——原正则
//    只收第一人称（ourselves/myself），漏「they assembled
//    themselves」「kids assembled the shelf themselves」第三人称
//    形（两条攻击实测 miss）。
const LABOR_ASSEMBLED_EN = /\b(?:assembled|built|constructed|put\s+together|made|crafted|created|developed|wrote|designed|sewed|knitted|brewed|grew)\b[^.]{0,40}\b(?:ourselves|myself|themselves|himself|herself|by\s+hand|from\s+scratch|in-?house|personally)\b/i;
// E2 own/labor/effort 名词族
const LABOR_OWN_EN = /\b(?:our|my)\s+own\s+(?:handiwork|work|effort|labor|creation|build|design|version|code|solution)\b/i;
// E3 hand-built/handmade/hand-crafted 形容词族
const LABOR_HAND_EN = /\b(?:hand-?built|hand-?made|hand-?crafted|self-?made|home-?made)\b/i;

const LABOR_ZH_GROUPS = [
  ['LABOR_SELF_ZH', [LABOR_SELF_ZH]],
  ['LABOR_TOIL_ZH', [LABOR_TOIL_ZH]],
  ['LABOR_DIY_ZH', [LABOR_DIY_ZH]],
];
const LABOR_EN_GROUPS = [
  ['LABOR_ASSEMBLED_EN', [LABOR_ASSEMBLED_EN]],
  ['LABOR_OWN_EN', [LABOR_OWN_EN]],
  ['LABOR_HAND_EN', [LABOR_HAND_EN]],
];

// ─── 腿② QUALITY 质量虚高 / VALUE 价值虚高 ─────────────────────
// Z4 质量虚高族（更好/更结实/更可靠/质量更高/肯定比…好）
//    含「不比…差/不比现成货差」式隐性虚高（不比差 = 等于或更好）
const QUALITY_ZH = /(?:肯定|一定|必然|显然|明显|就是|才是|当真)?[^。，！？；\n]{0,10}(?:更|最|比较|相对)?[^。，！？；\n]{0,4}(?:结实|牢靠|靠谱|可靠|好用|顺手|耐用|实用|优质|精良|高质|高级|精良|质量好|质量更|品质更|水准更|水平更)?[^。，！？；\n]{0,6}(?:好|强|棒|佳|优|出色|优秀|过硬)?[^。，！？；\n]{0,8}(?:比|赛过|胜过|不输|不亚于|不下于)[^。，！？；\n]{0,12}(?:现成|成品|买|采购|外面|外边|外部|别家|别人|他人|开源|流水线|工厂|商家|市面上|商店)/;
// Z4b 质量虚高断言族（自己的东西质量就是高/自研的就是稳/自己做的就是好）
//    断言核心词须实词在场（好/强/稳/棒/优/出色/香/甜/正/地道/可靠/结实/
//    好用/优质/精良/过硬/优秀/香/稳妥），且要么有比较对象（比/赛过/胜过/
//    不输），要么有强度词（肯定/一定/必然/显然/才是/就是/当真）——
//    防「桌子是我自己拼的」中性陈述零宽误触发（r471 实测修复：
//    全可选路径曾把「自己拼的」判为虚高断言）。
const QUALITY_CLAIM_ZH = /(?:自己|亲手|亲自|咱|我们|自家|本人)?(?:做|写|造|拼|装|研发|开发|打造|设计|腌制|酿造)(?:出来|的|出|起)?[^。，！？；\n]{0,8}(?:质量|品质|水准|水平|稳定性|可靠性|性能|效果|成色|品相|手感|味道|香味)?[^。，！？；\n]{0,6}(?:就是|肯定|一定|必然|显然|明显|当真|想必|想必是|才是|才算)?[^。，！？；\n]{0,6}(?:更|最|比较|相对|格外|特别|尤其)?[^。，！？；\n]{0,8}(?:好|强|稳|棒|优|出色|优秀|过硬|香|甜|正|地道|正宗|靠谱|牢靠|结实|好用|优质|精良|稳妥|可靠|耐用|实用)(?:[^。，！？；\n]{0,12}(?:比|赛过|胜过|不输|不亚于|不下于))?/;
// Z4c 不比…差族（自己腌的不比店里卖的差 = 隐性虚高）
const QUALITY_NOLOSE_ZH = /[^。，！？；\n]{0,14}(?:不[比输]|不亚于|不下于|不输于|不弱于|不差于)[^。，！？；\n]{0,12}(?:现成|成品|买|采购|外面|外边|外部|别家|别人|他人|开源|流水线|工厂|商家|市面上|商店|店|卖的)/;
// Z5 价值虚高族（更值/含心血所以更值钱/更有价值）
const VALUE_ZH = /(?:更|最|比较|相对|格外|特别|尤其)?[^。，！？；\n]{0,10}(?:值钱|有价值|宝贵|珍贵|可贵|含金量|分量|身价|价值)[^。，！？；\n]{0,12}(?:因为|毕竟|毕竟|说到底|说到底|谁让|谁叫)[^。，！？；\n]{0,14}(?:亲手|自己|亲自|心血|劳动|熬|投入|精力|DIY)/;
// Z5b 价值兑现族（含着自己的心血，质量肯定更高/倾注了心血所以更值）
//    r471 实测两处补形：① 心血前缀窗 {0,8}→{0,10}，收「倾注了无数
//    心血」「投入了大量精力」式「动词+了+量化词+心血」形；② 中段
//    {0,16} 窗允许逗号（[^。！？；\n] 而非 [^。，！？；\n]）——原正则
//    在「心血，所以格外珍贵」处断链，实测 miss。补形后 ZH 价值兑现
//    形命中。
const VALUE_TOIL_ZH = /(?:含|倾注|灌注|凝聚|浸透|浸润)(?:着|了)?[^。，！？；\n]{0,10}(?:心血|心血|精力|汗水|感情|心血)[^。！？；\n]{0,16}(?:所以|因此|故而|于是|这才|这也|质量|品质|价值|分量|就是)?[^。，！？；\n]{0,10}(?:更|最|比较|相对|格外|特别|尤其)?[^。，！？；\n]{0,10}(?:值钱|有价值|宝贵|珍贵|可贵|含金量|分量|身价|好|强|棒|优|出色|优秀|高)/;

// E4 质量虚高族（better than X / superior to X / more reliable than）
const QUALITY_EN = /\b(?:better|superior|sturdier|stronger|more\s+reliable|more\s+durable|higher\s+quality|higher-?quality|nicer|finer|premium|top-?notch|outstanding|excellent)\b[^.]{0,30}\bthan\b[^.]{0,40}\b(?:ready-?made|store-?bought|factory|commercial|off-?the-?shelf|prebuilt|mass-?produced|professional|external|bought|purchased|open-?source|off-?the-?shelf)\b/i;
// E5 质量虚高断言族（ours is the best / must be better / has to be better）
const QUALITY_CLAIM_EN = /\b(?:must|has\s+to|is\s+bound\s+to|is\s+guaranteed\s+to|is\s+sure\s+to|certainly|surely|obviously|clearly)\s+(?:be|make\s+it|be\s+the)?\s*(?:better|superior|best|more\s+reliable|sturdier|higher\s+quality)\b/i;
// E6 价值虚高族（more valuable because of the labor / worth more）
//    r471 收尾实测补形：原正则只收 because/since/as/due to/given/thanks
//    to 五族连接词，漏「I knitted this scarf myself, which is why it is
//    worth far more to me」式 **which is why** 因果连接（收尾探针：EN
//    攻击 2 条穿透全部断在腿②连接词）。语义同族：劳动投入 × 价值更高。
const VALUE_EN = /\b(?:more|extra|added|greater|special|sentimental)\s+(?:valuable|value|worth|precious|cherished)\b[^.]{0,40}\b(?:because|since|as|due\s+to|given|thanks\s+to|which\s+is\s+why|that\s+is\s+why|so\s+it)\b[^.]{0,30}\b(?:labor|effort|work|toil|handiwork|we\s+built|we\s+made|assembled|built|made|myself|himself|herself|themselves|ourselves)\b/i;
// E6b overvalue 动词族（overvalue / place too much value on our own）
//    r471 实测补形：原正则只收「overvalue the quality of our own」，
//    漏「People overvalue furniture they assembled themselves
//    compared with ready-made pieces」——furniture 与 own 间距超
//    30 字窗。补 own/ourselves 后缀形。
const VALUE_OVER_EN = /\b(?:overvalue|overrate|overestimate)\b[^.]{0,60}\b(?:own|our|my|self|handiwork|work|creation|build|assembled|built|made|crafted|designed|themselves|himself|herself|ourselves|myself)\b|\bovervalue\s+the\s+quality\s+of\s+(?:our|my|their|his|her)\s+own\b/i;

// Z4d 品质形容词虚高断言族（r472 审计修复补形）
//    r471 官方矩阵 A6 句式「每棵苗都是他亲手栽的，因此他觉得自家菜
//    比超市的新鲜」模块层 hit=false——腿②断在此：QUALITY_ZH 要求
//    比较对象命中购买词族（现成/工厂/开源/商店…），QUALITY_CLAIM_ZH
//    要求质量名词（质量/品质/性能…）或强度词+断言，VALUE_ZH /
//    VALUE_TOIL_ZH 要求「值钱/心血」价值族——三者都不收「自家菜
//    比超市的新鲜/更甜/更大」式**纯品质形容词虚高断言**。A6 是同族
//    攻击（劳动投入 × 品质虚高），与 A1「比工厂流水线产的更结实」
//    语义等价，仅比较对象是超市/自家而非工厂。本族补齐该缺口：
//    ① 断言形固定为「比|赛过|胜过|不输… + 比较对象」（比较结构在场，
//    非裸形容词陈述——「更新鲜」无比较对象时不判，防中性描述误伤）
//    ② 品质形容词表收新鲜/甜/香/好吃/好看/大/饱满/水灵/地道/正 等
//    农产品与手作品族（A6 领域）
//    ③ 强度断言形（肯定/一定/就是…更新鲜）也收，与②等价
const QUALITY_ADJ_ZH = /(?:[^。，！？；\n]{0,8}(?:比|赛过|胜过|不输|不亚于|不下于|不弱于)[^。，！？；\n]{0,14}(?:新鲜|水灵|饱满|甜|香|好吃|好味|美味|好看|漂亮|大|圆|匀称|地道|正宗|地道|起眼|像样))|(?:[^。，！？；\n]{0,10}(?:肯定|一定|必然|显然|明显|就是|才是|当真|想必|格外|特别|尤其)[^。，！？；\n]{0,8}(?:更新鲜|更甜|更香|更好吃|更好看|更大|更漂亮|更水灵|更饱满|最香|最甜|最新鲜|最好吃))/;
// Z5c 价值虚高形容词族（EN，对应 A6 英侧形）
const QUALITY_ADJ_EN = /\b(?:tastier|fresher|sweeter|prettier|nicer|better|juicier|plumper|bigger)\b[^.]{0,30}\bthan\b[^.]{0,40}\b(?:store-?bought|supermarket|grocery|commercial|ready-?made|factory|mass-?produced|off-?the-?shelf|bought|purchased)\b/i;

const QUALITY_ZH_GROUPS = [
  ['QUALITY_ZH', [QUALITY_ZH]],
  ['QUALITY_CLAIM_ZH', [QUALITY_CLAIM_ZH]],
  ['QUALITY_NOLOSE_ZH', [QUALITY_NOLOSE_ZH]],
  ['QUALITY_ADJ_ZH', [QUALITY_ADJ_ZH]],
];
const VALUE_ZH_GROUPS = [
  ['VALUE_ZH', [VALUE_ZH]],
  ['VALUE_TOIL_ZH', [VALUE_TOIL_ZH]],
];
const QUALITY_EN_GROUPS = [
  ['QUALITY_EN', [QUALITY_EN]],
  ['QUALITY_CLAIM_EN', [QUALITY_CLAIM_EN]],
  ['QUALITY_ADJ_EN', [QUALITY_ADJ_EN]],
];
const VALUE_EN_GROUPS = [
  ['VALUE_EN', [VALUE_EN]],
  ['VALUE_OVER_EN', [VALUE_OVER_EN]],
];

// ─── 豁免 A：概念教学（宜家效应/IKEA effect 被点名）────────────
// 概念名须独立出现——讨论这个概念本身是正确判别
const CONCEPT_ZH = /(?:宜家效应|劳动(?:投入)?(?:导致|带来)?(?:的)?(?:高估|溢价|增值|虚高)|亲手(?:做|制作)(?:偏好|效应)|IKEA\s*效应|IKEA\s*effect)/i;
const CONCEPT_EN = /\bIKEA\s+effect\b|\blabor[- ]led\s+overvaluation\b|\beffort\s+(?:leads\s+to|breeds)\s+(?:love|overvaluation)\b/i;

// ─── 豁免 B：纠正句（指出劳动投入不决定质量的正当陈述）─────────
const CORRECT_ZH = /(?:劳动(?:投入)?(?:并|却|根本)?不(?:代表|等于|意味着|决定|保证|能证明)[^。，！？；\n]{0,8}(?:质量|品质|价值|水准|水平|可靠性)|自研(?:有|存在)?[^。，！？；\n]{0,4}(?:盲区|盲点|局限|短板|风险)|不能(?:因为|仅凭|光凭)[^。，！？；\n]{0,8}(?:亲手|自己|劳动|心血)[^。，！？；\n]{0,6}(?:就)?(?:说|讲|认为|断定)[^。，！？；\n]{0,6}(?:更好|更值|质量|品质)|质量和(?:劳动|心血|投入)(?:没关系|无关|不是一回事))/;
const CORRECT_EN = /\b(?:labor|effort|work|toil)\s+(?:does\s+not|doesn'?t|does\s+not\s+necessarily|does\s+not\s+automatically)\s+(?:determine|guarantee|predict|equal|mean|translate\s+into|translate\s+to)\s+(?:quality|value|worth)\b|\bin-?house\s+(?:blind\s+spots|has\s+blind\s+spots)\b|\bquality\s+(?:is|must\s+be)\s+(?:measured|judged|assessed)\s+(?:objectively|blindly|against\s+external\s+standards)\b/i;

// ─── 豁免 C：基准在先（先做过外部比较再自评是正当做法）─────────
//    r471 实测修复：原正则把裸 compared 收进豁免动词族，导致攻击句
//    「People overvalue furniture they assembled themselves compared
//    with ready-made pieces」的**腿②比较对象**（compared with
//    ready-made 是虚高断言的固有成分）被误判为「基准在先」而整句
//    豁免——攻击实测 miss。修法：豁免动词族只收**基准测试专用动词**
//    （benchmarked / blind-tested / third-party tested / quality-
//    assessed 等），裸 compared 是腿②的固有比较词不能充当豁免信号。
const BASELINE_ZH = /(?:参照|对标|对照|比对|比较)[^。，！？；\n]{0,10}(?:市售|市面|市面上|现成|成品|同类|别家|外部|开源|商业|采购|商店|店铺)[^。，！？；\n]{0,10}(?:标准|规格|基准|水平|质量|品质|参数|指标)|盲测|双盲|第三方(?:检测|评估|评测|测试|机构)|经过(?:了)?[^。，！？；\n]{0,8}(?:盲测|基准测试|第三方检测|外部评估)/;
const BASELINE_EN = /\b(?:benchmarked|blind(?:ly)?[- ](?:tested|evaluated|compared|rated)|third-?party\s+(?:tested|evaluated|assessed|certified|audited|rated)|quality[- ]assessed|independently\s+(?:tested|evaluated|assessed|audited|certified))\b/i;

const PAIR_ZH = 60;   // 邻近窗：两腿最大间距（字符）
const PAIR_EN = 160;  // 邻近窗：两腿最大间距（字符）

// 疑问守卫：整句以问号收尾（或含「真的…吗/呢」问式）时不判——疑问
//   无断言腿②（「自己做的真的更好吗？」腿①「自己做」与腿②零宽重叠
//   是自命中，非虚高断言；r471 实测修复，模块头注释「疑问句一律
//   不判」承诺落地）。只收整句问形，不收段中问号（防止豁免长段落
//   里的断言句）。
const QUESTION_ZH = /(?:[？?]\s*$)|(?:真的[^。，！？；\n]{0,6}[吗呢？?])/;

// 强否定前缀：命中词前出现这些词，说明整个断言被否定（「并不比现成
// 的好」= 不承认虚高 → 失配）。r471 补「并不」（原表只有「并未」，
// 「但并不比现成的好」让步形穿透）及让步连词前置形（但/却/然而 +
// 不/未），含前置让步的否定整句失配。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|不能|无法|不该|不应|并不|也不|也不并)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not|did\s+not|has\s+not|have\s+not|no\s+longer\s+means?)\b/i;

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 12), idx);
  return STRONG_NEG_ZH.test(before);
}

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (STRONG_NEG_ZH.test(x.raw) || STRONG_NEG_EN.test(x.raw)) return false;
  if (negBeforeZh(text, x.idx)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  if (STRONG_NEG_EN.test(beforeEn)) return false;
  return true;
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

function resolveGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    if (Object.prototype.hasOwnProperty.call(R, name)) out.push(...(R[name] || []));
    else out.push(...defs);
  }
  return out;
}

// 签名收集：腿①劳动投入 × 腿②（质量虚高 ∪ 价值虚高），两腿邻近
// 共现，方向不限（「自己做的就是更好」与「更好因为自己做的」同判）。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      labor: resolveGroups(R, LABOR_ZH_GROUPS),
      leg2: resolveGroups(R, QUALITY_ZH_GROUPS).concat(resolveGroups(R, VALUE_ZH_GROUPS)),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      labor: resolveGroups(R, LABOR_EN_GROUPS),
      leg2: resolveGroups(R, QUALITY_EN_GROUPS).concat(resolveGroups(R, VALUE_EN_GROUPS)),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const laborM = collect(text, L.labor, false);
    if (laborM.length === 0) continue;
    const leg2M = collect(text, L.leg2, true);
    if (leg2M.length === 0) continue;
    for (const s of laborM) {
      const t = leg2M.find(x => dist(x, s) <= L.win);
      if (!t) continue;
      sigs.push({ lang: L.lang, labor: s.raw, leg2: t.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.labor + '|' + s.leg2;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 宜家效应签名：自己劳动投入 × 质量/价值虚高 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectIkeaEffect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论宜家效应这个概念本身是正确判别）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（指出劳动投入不决定质量的正当陈述）
  if ((R.CORRECT_ZH || CORRECT_ZH).test(text) || (R.CORRECT_EN || CORRECT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 C：基准在先（先做过外部比较再自评是正当做法）
  if ((R.BASELINE_ZH || BASELINE_ZH).test(text) || (R.BASELINE_EN || BASELINE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 D：疑问句（「自己做的真的更好吗？」——疑问无断言腿②，
  //   两腿零宽重叠是自命中非虚高断言）
  if ((R.QUESTION_ZH || QUESTION_ZH).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'ikea_effect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '劳动投入「' + x.labor + '」× 虚高断言「' + x.leg2 + '」'
      : 'labor "' + x.labor + '" x overvaluation "' + x.leg2 + '"')),
    details: s.lang === 'zh'
      ? '宜家效应(' + sigs.length + '处: 「' + s.labor + '」被直接兑现为「' + s.leg2 + '」——自己劳动投入未经盲测/基准检验即断言质量或价值更高)(zh)'
      : 'ikea-effect(' + sigs.length + 'x: "' + s.labor + '" is cashed out directly as "' + s.leg2 + '" — own labor asserted to mean higher quality or value, without blind testing or benchmarks)(en)',
    guidance: '宜家效应（IKEA effect，Norton, Mochon & Ariely 2012「When labor leads to love」）指人们对自己投入劳动组装的产品的估值显著高于同类成品——劳动投入这个事实本身是真的，毒性在于紧跟的第二动作：把劳动兑现成质量或价值优势。这一步跳过了「客观质量要用盲测/基准/标准衡量，与投入多少劳动无关」的比较纪律，让任何一方都能凭「亲手做的」三个字免掉竞品比较。正当做法是先做外部基准（市售同类标准/盲测/第三方检测/benchmarked against commercial products），再给出质量结论；点名宜家效应的教学句、指出劳动投入不决定质量的纠正句、以及先做过外部基准再自评的中性陈述，都是正当做法。注意与两个邻居的分工：effort_justification 判「已经花了这么多心血，放弃可惜/必须做完」（沉没成本轴），禀赋效应判「手里有的就是值钱」（所有权轴）——本族判「自己做的就是更好/更值」（产出估值轴）。',
    tags: ['economics', 'behavioral-economics', 'ikea-effect', 'labor-overvaluation', 'endowment-adjacent', 'aggregate-reasoning'],
  };
}

function allMatches(re, text) {
  const out = [];
  let m;
  if (re.flags.indexOf('g') === -1) {
    const r2 = new RegExp(re.source, re.flags + 'g');
    m = r2.exec(text);
    if (m) out.push({ raw: m[0], idx: m.index, end: m.index + m[0].length });
    return out;
  }
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    out.push({ raw: m[0], idx: m.index, end: m.index + m[0].length });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

module.exports = {
  detectIkeaEffect,
  __internals: () => ({
    LABOR_SELF_ZH, LABOR_TOIL_ZH, LABOR_DIY_ZH,
    LABOR_ASSEMBLED_EN, LABOR_OWN_EN, LABOR_HAND_EN,
    QUALITY_ZH, QUALITY_CLAIM_ZH, QUALITY_NOLOSE_ZH, QUALITY_ADJ_ZH,
    VALUE_ZH, VALUE_TOIL_ZH,
    QUALITY_EN, QUALITY_CLAIM_EN, QUALITY_ADJ_EN,
    VALUE_EN, VALUE_OVER_EN,
    LABOR_ZH_GROUPS, LABOR_EN_GROUPS,
    QUALITY_ZH_GROUPS, VALUE_ZH_GROUPS, QUALITY_EN_GROUPS, VALUE_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    BASELINE_ZH, BASELINE_EN, QUESTION_ZH,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
