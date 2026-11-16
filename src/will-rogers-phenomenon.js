/**
 * src/will-rogers-phenomenon.js — 「Will Rogers 现象（分期迁移）」检测器
 * （r360 新建：econ_reasoning_gate 聚合族第 19 子族）
 *
 * 背景（真升级类型②：聚合维度 econ_reasoning_gate 的全新措辞家族）：
 *   r360 立项探针（scripts/round-360/probe-candidates.js，v6.8.186 基线
 *   gate() 口径）五候选定拨——A 筛查 lead-time 偏误族 3/10 穿透（强形被
 *   post_hoc / survivor_time_bias / reverse_causation 代拦，仅软形穿透）、
 *   B Will Rogers 分期迁移族 **6/9 穿透且零维度承重**（traceSummary 全部
 *   「无命中」）、C 机会成本族 1/7（已被 econ_reasoning_gate 代拦）、
 *   D 量词移位族 2/5（强形被 absolute_claim/perfect_error 代拦）、
 *   E Berkson 住院选择形 2/4（collider_bias 已知缺口，第 7 次留交 1 号
 *   裁决）——B 穿透数最高且良性对照零误伤，定拨落地。
 *
 * 外部来源：空返，按既有形态自建。r360 海外扫描（原始证据
 * coordination/agent4/scout/*20261116-053926* / *20261116-054139*）：
 * arXiv 两轮查询词均被 OR 拆散，返回天文/视频扩散/量子霍尔等无关条目
 * （15 条全不相关）、GitHub repos 两轮 0 命中、Semantic Scholar 429
 * 限流。判据为心虫自有纯规则实现，家族定义取自医学统计学与效应量文献
 * 的标准描述：Feinstein, Sosin & Wells (1985) "The Will Rogers
 * phenomenon: stage migration and new diagnostic techniques as a source
 * of useless prognostic statistics"（Staging in Cancer 特刊）——把病人
 * 按新标准在组间重新分类后，两组各自的结果指标可以同时改善，而每个
 * 病人的结局没有任何变化；Sormani et al. (2004) 对多发性硬化症领域
 * 的同名复现。聚合统计口径变化 ≠ 真实改善。
 *
 * 辨别的族：Will Rogers 现象（分期迁移 / 组间再分类统计假象）——文本
 * 先给出**组间迁移或重新分类的在场指称**（从晚期移到早期 / 重新分期 /
 * 分到慢班 / reclassifying / moving to the remedial class），再给出
 * **两组指标同时改善的断言**（都提高了 / 双双上升 / 一起涨 / both
 * groups' survival rates improved），并把该同时改善归功于分组动作
 * 本身：
 *   新的分期标准把一部分轻症病人从晚期移到早期，结果早期和晚期的
 *   生存率都提高了。
 *   把垫底的学生分到慢班之后，快班和慢班的平均分一起涨了。
 *   Reclassifying patients moved some from the advanced to the early
 *   group, and both groups' survival rates improved.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：分组口径一改，两组
 * 的均值/率可以同时变好而不动任何个体——这是「用统计口径制造进步」。
 * 它的毒性在于它伪装成真实成效：先给出一个中性的重新分类事实，再宣布
 * 两组数字一起上涨，于是「病情得到了控制」「教学改革见效了」全部有了
 * 数据背书，而实际上没有任何人变得更好。与正当推理的界线很清楚：两
 * 组变化方向相反（一个升一个降）、说明改善来自每个个体自身的真实变化、
 * 点名这是分期迁移假象并要求核对个体数据，都是正当做法，一律豁免。
 *
 * 与既有维度的边界（r360 归因，探针 + 边界实测）：
 *   · simpsons_paradox（r209）判**聚合层趋势与子群层方向相反**（合并
 *     后趋势反转）——要求两腿方向相反；本族要求两腿方向**相同**（同时
 *     改善）且腿①是组间迁移而非聚合层标记，两者互为补集而非重叠
 *     （实测「两组变化方向不同」的良性句被本族腿②天然排除）；
 *   · survivor_time_bias / immortal_time_bias 判**检出时点造成的生存
 *     期统计假象**（更早发现≠活得更久）——腿①是检测手段进步，本族腿①
 *     是组间再分类，无检测时点语义；
 *   · statistical_misleading（dim 58）判**小基数比例失真**——不涉分组；
 *   · selection_bias 判**取样受限 × 总体推广**——本族无总体推广动作。
 *
 * 判据（双腿近距共现 + 三组豁免，缺一不判）：
 *   ① 腿① MIGRATE 组间迁移/重新分类在场——ZH 四族 / EN 四族任一（详见
 *      下方常量）：从A移到B 迁移动词族、重新分期/重新分组名词族、
 *      分班/调组动词族、迁移语义裸族；EN reclassifying / moved from
 *      ... to ... / regrouping / changing the grouping rule 族；
 *   ② 腿② BOTH_UP 两组同时改善断言——ZH 四族 / EN 四族任一：都+上升
 *      动词族、双双/一起族、两组都+名词+上升族、平均分/治愈率类名词
 *      +上升族；EN both groups ... improved / raised the average of
 *      both / made both ... better 族；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），方向不限；
 *   ④ 腿①腿②均查强否定前缀守卫（「并非重新分组后两组都提高」= 否认该
 *      断言 → 失配），递进连词（不但/不仅）不判否定；
 *   ⑤ 豁免 A 概念教学（Will Rogers 现象 / 分期迁移 / stage migration
 *      / 统计学教材——讨论概念本身是正确判别）；
 *   ⑥ 豁免 B 正确响应形（指出同时改善只是再分类假象、要求核对个体层
 *      面数据：不代表真实改善 / 只是统计假象 / an artifact of
 *      reclassification）；
 *   ⑦ 豁免 C 个体层面归因（改善来自每个个体自身的真实变化：每个学生
 *      / 个体层面 / 逐个 / each individual / every student——本族只判
 *      「分组动作本身造成两组同时变好」）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次口径变更的结果（「按新
 * 分期标准重算后两组生存率都上升了」是事实陈述），也可能是真实的个体
 * 改善被误归因。verify 的语义是「这段话把两组同时改善归功于重新分组，
 * 先核对个体层面数据与分组前后口径，再决定是否采信这个成效判断」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 两组方向相反（重新分组后早期组上升、晚期组下降——不是本族形态，
 *     且属 simpsons_paradox 领地）；
 *   · 概念教学（Will Rogers 现象是医学统计学文献记载的口径假象）；
 *   · 正确响应形（两组同时上升可能只是分期迁移，需要看个体数据）；
 *   · 个体层面归因（两组都提高是因为每个学生都多做了练习）；
 *   · 近邻维度领地（simpsons_paradox 聚合层逆转、survivor_time_bias
 *     检出时点假象、statistical_misleading 小基数比例）。
 */
'use strict';

// ─── 腿① MIGRATE 组间迁移 / 重新分类在场 ────────────────────────
// M1 从A移到B 迁移动词族（从晚期移到早期 / 由高风险组调入低风险组）。
//    自身含「从/由」，前后窗内须出现组名词才算迁移（见 GROUP_ZH 收紧）。
const MIGRATE_FROM_TO_ZH = /(?:从|由)[^。，！？；\n]{0,10}(?:移到|移至|挪到|挪至|划入|划归|调入|归入|改判|重新归类|调整到|改到|分流到|分到|调到|换到|转移到|迁移到|流动到)/;
// M2 重新分类名词族（重新分期 / 调整分组标准 / 换了口径）。
const MIGRATE_RECLASS_ZH = /(?:重新分期|重新分组|重新分类|重新划归|重新划定|重新归类|调整分组|调整分期|重新编制|换(?:了)?(?:标准|口径|分组方式|计分方式)|分期标准(?:的)?(?:调整|改变|更新|更换|修订)|分组(?:规则|标准|口径)(?:的)?(?:调整|改变|更新|更换|变化)|新的(?:分期|分组|分类|分班)(?:标准|规则|方案|办法)|标准一改|口径一变|标准变化|分组方式变)/;
// M3 分班 / 调组动词族（分到慢班 / 调进重点班 / 编入实验组）。
const MIGRATE_ASSIGN_ZH = /(?:分到|分入|分进|调到|调往|调入|调进|划入|划进|编入|编进|归入|转进|转入|分流到|安排到|安排进)[^。，！？；\n]{0,6}(?:组|班|层|类|档|梯队)/;
// M4 迁移语义裸族（组间迁移 / 病人迁移 / 转组）。
const MIGRATE_MOVE_ZH = /(?:组间迁移|病人迁移|患者迁移|学员迁移|学生迁移|转组|换组|换班|调班|迁移|再分类|重新划分)/;

// 组名词（用于 M1/M3 的近距收紧：迁移目标必须是组名词而非任意宾语）
const GROUP_ZH = /(?:早期|晚期|中期|终末期|轻症|重症|危重症|早期组|晚期组|中期组|轻症组|重症组|快班|慢班|尖子班|普通班|重点班|实验组|对照组|观察组|高风险组|低风险组|高危组|低危组|一期|二期|三期|四期|I期|II期|III期|IV期|A组|B组|C组|甲组|乙组|上层|下层|高分组|低分组|第一组|第二组|第三组|分层|亚组|子群)/;

const MIGRATE_ZH_GROUPS = [
  ['MIGRATE_FROM_TO_ZH', [MIGRATE_FROM_TO_ZH]],
  ['MIGRATE_RECLASS_ZH', [MIGRATE_RECLASS_ZH]],
  ['MIGRATE_ASSIGN_ZH', [MIGRATE_ASSIGN_ZH]],
  ['MIGRATE_MOVE_ZH', [MIGRATE_MOVE_ZH]],
];
const MIGRATE_ZH = [MIGRATE_FROM_TO_ZH, MIGRATE_RECLASS_ZH, MIGRATE_ASSIGN_ZH, MIGRATE_MOVE_ZH];

// E1 reclassifying / reclassified / reclassification 族
const MIGRATE_RECLASS_EN = /\b(?:reclassif(?:y|ied|ies|ying|ication)|re-?stag(?:e|ed|es|ing)|re-?assign(?:ed|ing|ment)?|re-?group(?:ed|ing)?|re-?categoriz(?:e|ed|ing|ation)|re-?labell?ed|re-?sort(?:ed|ing)?)\b/i;
// E2 moved from ... to ... 迁移族（含 shuffling into / moved over to）
const MIGRATE_FROM_TO_EN = /\b(?:mov(?:e|ed|es|ing)|shift(?:ed|ing)?|transferr?(?:ed|ing)|migrat(?:e|ed|ing)|promot(?:e|ed|ing)|demot(?:e|ed|ing)|bump(?:ed|ing)?)\s+(?:some|many|most|several|a\s+few|the)?\s*(?:\w+\s+){0,3}?(?:from|out\s+of)\s+[^.]{0,40}?\s+(?:to|into|over\s+to)\b/i;
// E3 分组规则变更族（changing the grouping rule / new staging criteria）
const MIGRATE_RULE_EN = /\b(?:chang(?:e|ed|ing|es)|revis(?:e|ed|ing|ion)|updat(?:e|ed|ing)|new|adjust(?:ed|ing|ment)?)\s+(?:the\s+)?(?:grouping|groups?|staging|stages?|classifications?|categories|categorisation|grading|brackets?|cut-?offs?|thresholds?)\s*(?:rules?|criteria|schemes?|standards?|boundar(?:y|ies))?\b/i;
// E3b move/shift ... to/into <group noun> 族（无 from 的迁移动词形——
//   r360 构造期实测：Moving the weakest students to the remedial class
//   整句因 E2 强制要求 from 而穿透）。目标必须是组名词，防止
//   moved the files to the archive 类非分组迁移误命中。
const MIGRATE_TOGROUP_EN = /\b(?:mov(?:e|ed|es|ing)|shift(?:ed|ing)?|transferr?(?:ed|ing)|migrat(?:e|ed|ing)|promot(?:e|ed|ing)|demot(?:e|ed|ing)|reassign(?:ed|ing)?|sort(?:ed|ing)?|plac(?:e|ed|ing))\s+(?:\w+\s+){0,5}?(?:to|into)\s+(?:the\s+|a\s+|his\s+|her\s+|their\s+|our\s+)?(?:\w+\s+){0,2}?(?:groups?|class(?:es)?|cohorts?|arms?|strata|tiers?|bands?|tracks?|batches|categories|buckets?|brackets?)\b/i;
// E4 split / divide ... into ... groups 族（splitting the cohort into）
const MIGRATE_SPLIT_EN = /\b(?:split|splits|splitting|divid(?:e|ed|ing)|separat(?:e|ed|ing)|sort(?:ed|ing)?|bucket(?:ed|ing)?)\s+(?:\w+\s+){0,3}?into\s+(?:two|three|the)?\s*\w*\s*(?:groups?|class(?:es)?|cohorts?|strata|tiers?|brackets?)\b/i;
const MIGRATE_EN_GROUPS = [
  ['MIGRATE_RECLASS_EN', [MIGRATE_RECLASS_EN]],
  ['MIGRATE_FROM_TO_EN', [MIGRATE_FROM_TO_EN]],
  ['MIGRATE_RULE_EN', [MIGRATE_RULE_EN]],
  ['MIGRATE_TOGROUP_EN', [MIGRATE_TOGROUP_EN]],
  ['MIGRATE_SPLIT_EN', [MIGRATE_SPLIT_EN]],
];
const MIGRATE_EN = [MIGRATE_RECLASS_EN, MIGRATE_FROM_TO_EN, MIGRATE_RULE_EN, MIGRATE_TOGROUP_EN, MIGRATE_SPLIT_EN];

// ─── 腿② BOTH_UP 两组同时改善断言 ────────────────────────────────
// B1 都 + 上升动词族（都提高了 / 皆上升 / 均提升 / 统统变好）。
const BOTHUP_ALL_ZH = /(?:都|皆|均|统统|全都|全不|一并)[^。，！？；\n]{0,4}(?:提高|提升|上升|升高|增长|增加|改善|好转|变好|涨了|上涨|走高|翻倍|进步|跑赢|胜出)/;
// B2 双双 / 一起族（双双上升 / 一起涨 / 同时提升）。
const BOTHUP_DOUBLE_ZH = /(?:双双|一齐|一起|一并|同时)[^。，！？；\n]{0,5}(?:上升|提高|提升|增长|增加|改善|好转|变好|上涨|涨|走高|翻倍|跑赢)/;
// B3 两组都 + 指标 + 上升族（两组都提高了 / 两个班都上升了）。
const BOTHUP_TWOGROUP_ZH = /(?:两|二)(?:个|类|边|方|班|层|组)?[^。，！？；\n]{0,8}(?:都|皆|均)[^。，！？；\n]{0,6}(?:提高|提升|上升|升高|增长|增加|改善|好转|变好|涨|上涨|走高|翻倍)/;
// B4 组名词 + 上升族（早期和晚期的生存率都提高了——B1 已收，本族收
//    「早期组与晚期组治愈率上升」无双都字形）。
const BOTHUP_GROUPNOUN_ZH = /(?:早期|晚期|中期|轻症|重症|快班|慢班|重点班|实验组|对照组|高风险组|低风险组|高分组|低分组)(?:组|班|层|类)?[^。，！？；\n]{0,4}(?:和|与|及|跟|同)[^。，！？；\n]{0,4}(?:早期|晚期|中期|轻症|重症|快班|慢班|重点班|实验组|对照组|高风险组|低风险组|高分组|低分组)(?:组|班|层|类)?[^。，！？；\n]{0,8}(?:提高|提升|上升|升高|增长|增加|改善|好转|变好|涨|上涨|走高|翻倍)/;

const BOTHUP_ZH_GROUPS = [
  ['BOTHUP_ALL_ZH', [BOTHUP_ALL_ZH]],
  ['BOTHUP_DOUBLE_ZH', [BOTHUP_DOUBLE_ZH]],
  ['BOTHUP_TWOGROUP_ZH', [BOTHUP_TWOGROUP_ZH]],
  ['BOTHUP_GROUPNOUN_ZH', [BOTHUP_GROUPNOUN_ZH]],
];
const BOTHUP_ZH = [BOTHUP_ALL_ZH, BOTHUP_DOUBLE_ZH, BOTHUP_TWOGROUP_ZH, BOTHUP_GROUPNOUN_ZH];

// BE1 both groups ... improved 族（both groups' survival rates improved）
const BOTHUP_BOTHGROUPS_EN = /\bboth\s+(?:groups?|class(?:es)?|cohorts?|arms?|strata|tiers?|batches|teams?|brackets?|stages?)['\u2019]?\s*(?:\w+\s+){0,4}?(?:improv(?:e|ed|es|ing|ement)|rose|risen|rises|increas(?:e|ed|es|ing)|went\s+up|got\s+up|grew|climb(?:ed|ing)?|higher|better|best|up|good)\b/i;
// BE2 raised the average of both 族（raised the average of both classes）
const BOTHUP_RAISEDBOTH_EN = /\b(?:rais(?:e|ed|es|ing)|lift(?:ed|ing)?|boost(?:ed|ing)?|push(?:ed|ing)?|improv(?:e|ed|ing))\s+(?:the\s+)?(?:\w+\s+){0,3}?of\s+both\s+\w+/i;
// BE3 made both ... better 族（made both groups' numbers better）
const BOTHUP_MADEBOTH_EN = /\b(?:mad(?:e|es|ing)|leaves?|left|leaving|put(?:s|ting)?|renders?)\s+both\s+(?:\w+\s+){0,3}?(?:better|improved|higher|up|good|best)\b/i;
// BE4 both ... went up at the same time 族（both averages went up together）
const BOTHUP_BOTHUP_EN = /\bboth\s+(?:\w+\s+){0,3}?(?:went\s+up|rose|rose|improved|increased|got\s+better|climbed|moved\s+up|are\s+(?:better|higher))\b/i;
// BE5 improved in both groups 族（改善词在前的倒装形——r360 构造期实测：
//   "survival improved in both groups" 因 BE1 要求 both 在前而穿透）
const BOTHUP_INBOTH_EN = /\b(?:improv(?:e|ed|es|ing|ement)|rose|risen|rises|increas(?:e|ed|es|ing)|went\s+up|got\s+better|climb(?:ed|ing)?|grew)\s+(?:\w+\s+){0,4}?in\s+both\s+(?:groups?|class(?:es)?|cohorts?|arms?|strata|tiers?|brackets?|stages?)\b/i;

const BOTHUP_EN_GROUPS = [
  ['BOTHUP_BOTHGROUPS_EN', [BOTHUP_BOTHGROUPS_EN]],
  ['BOTHUP_RAISEDBOTH_EN', [BOTHUP_RAISEDBOTH_EN]],
  ['BOTHUP_MADEBOTH_EN', [BOTHUP_MADEBOTH_EN]],
  ['BOTHUP_BOTHUP_EN', [BOTHUP_BOTHUP_EN]],
  ['BOTHUP_INBOTH_EN', [BOTHUP_INBOTH_EN]],
];
const BOTHUP_EN = [BOTHUP_BOTHGROUPS_EN, BOTHUP_RAISEDBOTH_EN, BOTHUP_MADEBOTH_EN, BOTHUP_BOTHUP_EN, BOTHUP_INBOTH_EN];

// ─── 距离窗（迁移腿 × 双腿改善腿）───────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：概念教学（点名 Will Rogers 现象 / 分期迁移概念本身）────
// 注意：不收「组间迁移」——它是腿① MIGRATE_MOVE_ZH 的命中词，收进来会让
// 整个裸族失效（r360 实测：「这次组间迁移之后，两组生存率都提高了」被
// 豁免误杀）。
const CONCEPT_ZH = /(?:Will\s*Rogers|威尔·罗杰斯|罗杰斯现象|分期迁移|迁移偏误|再分类假象|统计假象|医学统计学|卫生统计学|流行病学|教材|教科书|课堂|教案|习题|论文)/;
const CONCEPT_EN = /\bwill\s+rogers\b|\bstage\s+migrat\w+|\bmigrat\w+\s+bias\b|\bmedical\s+statistics\b|\bepidemiolog\w+\b|\btextbook\b|\bstatistics\s+class\b/i;

// ─── 豁免 B：正确响应形（指出同时改善只是再分类假象，要求核对个体数据）──
// 这是本族要教的判别动作本身。注意只收「结论层」正确响应（否认成效 /
// 要求核对个体），不收裸「重新分组」——「重新分组后两组都提高了，说明
// 改革见效」正是攻击形（r360 构造期实测教训，同 r209 辛普森裸分层词）。
const CORRECT_ZH = /(?:不代表|不能说明|说明不了|并不意味着|不足以证明|证明不了)[^。；，!?]{0,14}(?:改善|提高|提升|进步|成效|效果|变好|真实|整体)/;
const CORRECT_ZH2 = /(?:只是|仅仅是|不过是|无非是)[^。；，!?]{0,10}(?:统计|口径|数字|账面|纸面)[^。；，!?]{0,4}(?:假象|幻觉|虚高|好看|游戏|变化)/;
const CORRECT_ZH3 = /(?:需要|应当|应该|必须|得)[^。；，!?]{0,8}(?:核对|查看|对照|回归|追踪)[^。；，!?]{0,8}(?:个体|每个|逐[个条例]|病例|病人|患者|学生|原始|明细|底层)/;
const CORRECT_EN = /\b(?:not|does\s+not|doesn'?t|cannot|can'?t)\s+(?:mean|imply|show|prove|reflect|indicate)\b[^.]{0,50}\b(?:real|actual|genuine|true|individual|improvement)/i;
const CORRECT_EN2 = /\b(?:artifacts?|artefacts?)\s+of\b|\bmere\s+(?:statistical|bookkeeping|accounting)\b|\bpaper\s+(?:gain|improvement)\b|\bnot\s+a\s+real\s+improvement\b/i;
const CORRECT_EN3 = /\b(?:need|needs|must|should|have\s+to)\s+(?:to\s+)?(?:look\s+at|check|examine|verify|track)\b[^.]{0,50}\b(?:individual|patient-?level|case-?level|per-?student|raw|underlying)\b/i;

// ─── 豁免 C：个体层面归因（改善来自每个个体自身的真实变化）──────────
// 「两组都提高是因为每个学生都多做了练习」——变化发生在个体身上，不是
// 分组构成的假象。本族只判「分组动作本身造成两组同时变好」。
const INDIV_ZH = /(?:每个|每一位|每一名|逐个|逐条|逐例|个体层面|个人层面|每个人|所有人|全员)[^。；，!?]{0,10}(?:都|也|各自)?[^。；，!?]{0,8}(?:提高|提升|上升|改善|变好|进步|练习|训练|努力|治疗|用药|复习)/;
const INDIV_EN = /\b(?:each|every)\s+(?:individual|student|patient|case|person|worker|employee)\b[^.]{0,60}\b(?:improv\w+|better|higher|progress|practi[sc]ed|studied|trained)/i;

// ─── 否定守卫 ───────────────────────────────────────────────────
const NEG_ZH = /(?:不能|不应|不可|未必|不一定|并非|不代表|很难|别|不要|用不着|无须|无需)$/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t)$/i;
// 强否定前缀：命中词前出现这些词，说明整个断言被否定（「并非重新分组
// 后两组都提高」= 否认该断言）。递进连词（不但/不仅）不判否定。
const STRONG_NEG_ZH = /(?:并非|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way)\b/i;
const ADVERSATIVE_ZH = /(?:不但|不仅|不只|不光|况且|而且|并且|虽说|固然|诚然)/;

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 12), idx);
  if (ADVERSATIVE_ZH.test(before)) return false;
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

// 把 GROUPS 的组名带进匹配结果（腿①收紧判据需要知道命中来自哪个族）
function taggedGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    const list = Object.prototype.hasOwnProperty.call(R, name) ? (R[name] || []) : defs;
    for (const re of list) out.push({ name, re });
  }
  return out;
}

function collect(text, list, useNeg) {
  let m = [];
  for (const item of list) {
    const re = item.re || item;
    const name = item.name || null;
    for (const x of allMatches(re, text)) {
      if (matchAlive(text, x, useNeg)) m.push({ ...x, group: name });
    }
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 签名收集：腿①迁移 × 腿②双腿改善，两腿邻近共现，方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      migGroups: MIGRATE_ZH_GROUPS,
      bothGroups: BOTHUP_ZH_GROUPS,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      migGroups: MIGRATE_EN_GROUPS,
      bothGroups: BOTHUP_EN_GROUPS,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const migM = collect(text, taggedGroups(R, L.migGroups), true);
    if (migM.length === 0) continue;
    const bothM = collect(text, taggedGroups(R, L.bothGroups), true);
    if (bothM.length === 0) continue;
    for (const n of migM) {
      const b = bothM.find(x => dist(x, n) <= L.win);
      if (!b) continue;
      // 腿①收紧：迁移动词族（M1/M3）须邻近出现组名词，防止「从仓库
      // 调到车间」这类非分组迁移被当成 Will Rogers 形态。
      if ((n.group === 'MIGRATE_FROM_TO_ZH' || n.group === 'MIGRATE_ASSIGN_ZH') && L.lang === 'zh') {
        const near = text.slice(Math.max(0, n.idx - 20), Math.min(text.length, n.end + 30));
        if (!(R.GROUP_ZH || GROUP_ZH).test(near)) continue;
      }
      sigs.push({ lang: L.lang, migrate: n.raw, bothup: b.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.migrate + '|' + s.bothup;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Will Rogers 现象签名：组间迁移/重新分类 × 两组同时改善 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectWillRogersPhenomenon(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 豁免 A：概念教学（讨论 Will Rogers 现象这个概念本身是正确判别）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确响应形（指出同时改善只是再分类假象、要求核对个体数据）
  if ((R.CORRECT_ZH || CORRECT_ZH).test(text)
    || (R.CORRECT_ZH2 || CORRECT_ZH2).test(text)
    || (R.CORRECT_ZH3 || CORRECT_ZH3).test(text)
    || (R.CORRECT_EN || CORRECT_EN).test(text)
    || (R.CORRECT_EN2 || CORRECT_EN2).test(text)
    || (R.CORRECT_EN3 || CORRECT_EN3).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 C：个体层面归因（改善来自每个个体自身的真实变化）
  if ((R.INDIV_ZH || INDIV_ZH).test(text) || (R.INDIV_EN || INDIV_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'will_rogers_phenomenon',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '迁移「' + x.migrate + '」× 双腿改善「' + x.bothup + '」'
      : 'migration "' + x.migrate + '" x both-groups-up "' + x.bothup + '"')),
    details: s.lang === 'zh'
      ? 'will-rogers-phenomenon(' + sigs.length + '处: 「' + s.migrate + '」之后「' + s.bothup + '」——两组指标同时改善被归功于重新分组，个体结局可能毫无变化)(zh)'
      : 'will-rogers-phenomenon(' + sigs.length + 'x: "' + s.migrate + '" followed by "' + s.bothup + '" — simultaneous improvement in both groups attributed to reclassification, with no individual outcome changed)(en)',
    guidance: 'Will Rogers 现象（分期迁移）指按新标准把对象在组间重新分类后，两组各自的结果指标可以同时改善，而每个个体的结局没有任何变化（Feinstein, Sosin & Wells 1985；Sormani et al. 2004 在多发性硬化症领域的复现）：把轻症病人从晚期移到早期，晚期组剔除了一批预后差的、早期组收入了一批预后好的，两组的生存率/治愈率就一起上涨——这是分组口径制造的进步，不是真实成效。它的危害在于伪装成改革见效：先给出一个中性的口径变更事实，再宣布两组数字一起变好，于是「病情得到控制」「教改见效」全部有了数据背书。正当做法是先核对个体层面数据（同一批人在新分组下的结局是否真的变了）、核对分组前后的口径差异（迁移了多少人、按什么标准）、或明确说这是分期迁移造成的统计假象；两组变化方向相反、改善来自每个个体自身的真实变化、或点名这是 Will Rogers 现象，都是正当做法。',
    tags: ['statistics', 'epidemiology', 'stage-migration', 'grouping-artifact', 'will-rogers-phenomenon', 'aggregation'],
  };
}

module.exports = {
  detectWillRogersPhenomenon,
  __internals: () => ({
    MIGRATE_FROM_TO_ZH, MIGRATE_RECLASS_ZH, MIGRATE_ASSIGN_ZH, MIGRATE_MOVE_ZH, GROUP_ZH,
    MIGRATE_RECLASS_EN, MIGRATE_FROM_TO_EN, MIGRATE_RULE_EN, MIGRATE_TOGROUP_EN, MIGRATE_SPLIT_EN,
    BOTHUP_ALL_ZH, BOTHUP_DOUBLE_ZH, BOTHUP_TWOGROUP_ZH, BOTHUP_GROUPNOUN_ZH,
    BOTHUP_BOTHGROUPS_EN, BOTHUP_RAISEDBOTH_EN, BOTHUP_MADEBOTH_EN, BOTHUP_BOTHUP_EN, BOTHUP_INBOTH_EN,
    MIGRATE_ZH, MIGRATE_EN, BOTHUP_ZH, BOTHUP_EN,
    MIGRATE_ZH_GROUPS, MIGRATE_EN_GROUPS, BOTHUP_ZH_GROUPS, BOTHUP_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_ZH2, CORRECT_ZH3,
    CORRECT_EN, CORRECT_EN2, CORRECT_EN3, INDIV_ZH, INDIV_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN, ADVERSATIVE_ZH,
    findSignatures,
  }),
};
