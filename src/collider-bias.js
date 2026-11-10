/**
 * src/collider-bias.js — 「对撞偏差 / 内生选择偏差」检测器
 * （第 209 个判别维度，r212）
 *
 * [r212 立项] philosophy_decision 在当前引擎（v6.8.140，208 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实
 * 证：r212 族探针在当前引擎复测——对撞偏差族攻击样本 7 条中 5 条
 * gate.action=pass（真零命中，含中英双语、裸名词「只看/入选/活过」、
 * 带修饰「在通过初筛的候选人中」、长句变体；其余 2 条被
 * proxy_metric_goal + perfect_error 代拦），良性样本 4/4 pass（零误
 * 伤）。覆盖度检查：collider / endogenous 在 src/ 下 0 文件命中，
 * reverse_causation / common_cause / post_hoc / selection_bias /
 * base_rate_neglect / simpsons_paradox 均未覆盖本族（它们判方向倒
 * 置、共同原因、时间先后、取样范围、基础概率、聚合层逆转，没有一
 * 个判「条件筛选后样本内观察相关 → 当作总体因果结论」）。
 *
 * 外部来源：arXiv 2406.12158（EMNLP 2024，*LLMs Are Prone to
 * Fallacies in Causal Inference*；代码与数据仓库
 * github.com/joshinh/causal-fallacies）——该文系统给出 LLM 在因果
 * 推断上违反的四条规则，其中「从相关/共变跳到因果」与「在条件筛选
 * 后的子集上作因果断言」正是本族；另有 HN 因果推理条目与
 * github.com/causalNLP/logical-fallacy（arXiv 2202.13758, Findings
 * of EMNLP 2022）作旁证。按心虫既有维度形态自建纯规则判据。
 *
 * 辨别的族：对撞偏差（collider bias / endogenous selection bias）
 * ——把**经条件筛选后的子样本内观察到的相关/共变**，直接当作
 * **总体层面的因果结论**使用：
 *   在留下来的员工里，加班少的反而绩效更高，所以加班会拖累绩效。
 *   只看活过三年的创业公司，创始人的行业经验越少公司估值越高，
 *   可见经验会拖累公司。
 *   在这家医院住院的病人中，接受强化治疗的人死亡率更低，说明
 *   强化治疗很有效。
 *   在入选决赛的选手里，训练时间短的排名反而更高，因此训练时间
 *   越短成绩越好。
 *   Among the admitted students, those with higher test scores tend
 *   to have lower grades, so test scores hurt academic performance.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：当 A、B 都
 * 影响第三个变量 C（对撞因子），而观察范围被限制在 C 的某个取值
 * 上（入院 / 入选 / 存活 / 留下 / 通过筛选）时，A 与 B 在这个子样
 * 本里会呈现出相关——**即使 A、B 在总体中毫无因果关系**。筛选动作
 * 本身制造了关联，再拿这份关联去断言因果，等于把「观察条件的副产
 * 物」当成「世界的因果结构」。这是条件化（conditioning）的结构性
 * 后果，不是数据噪声；它使「越…越…」的相关在子样本里必然出现而
 * 在总体中消失，是最容易被叙述成铁证的一类假因果。
 *
 * 与既有维度的边界（r212 归因）：
 *   · selection_bias（第 168 维度）管取样受限导致推广失效；本族
 *     的取样受限标记只是腿①，承重的是腿②③——**在受限样本内观察
 *     到相关并据此下总体因果结论**。selection_bias 不要求相关观
 *     察，也不要求因果结论。
 *   · survivorship_bias（第 132 维度）管只看幸存者而忽略未幸存
 *     样本；本族同样不要求「忽略未幸存样本」，只要求「在条件筛选
 *     样本内观察相关 → 因果结论」。
 *   · simpsons_paradox（第 206 维度）管聚合层与子群层**方向相
 *     反**；本族只有一个层级（被条件筛选的那一层），问题是这个层
 *     次的相关是否由筛选制造。
 *   · common_cause / reverse_causation（第 174 / 172 维度）管混
 *     杂因素与因果倒置，都假定观察到的共变是真实的；本族的共变
 *     本身就是筛选的产物。
 *   · cum_hoc / post_hoc 管显式相关标记与时间先后；本族不要求
 *     显式「相关」字样（「越少…越高」即可），也不依赖时间先后。
 *
 * 判据（主判据三腿共现 + 邻近窗，缺一不判）：
 *   · 腿① COND 条件筛选标记：介词限定形（「在…里/之中/中间」）+
 *     动作限定形（只看/仅看/局限于/筛选后，**r161 教训：收裸动词
 *     形态**——只看/入选/活过/活下来/留任 去前后缀仍命中）+
 *     筛选结果名词（筛选/初筛/入选/入围/存活/幸存/活过/留下来/
 *     留任/现存/未被淘汰/淘汰后……；EN among the admitted / only
 *     those who / conditioned on / restricted to / survivors /
 *     survived / made it through）。
 *   · 腿② ASSOC 样本内观察到的相关/共变：负相关/正相关/相关性/
 *     成反比/共变（EN negatively correlated / correlated with /
 *     inversely related / associated with）+ 比较级反向共变（越少…
 *     越高 / 反而 / 更低 / 更高 / more…less / the less…the
 *     more）。**不要求显式「相关」字样**——「越少…越高」即足够。
 *   · 腿③ CONCL 总体因果结论（两形任一）：
 *     C-a 推断+因果形：推断词（所以/因此/因而/可见/说明/意味着/
 *       证明/显然/据此；EN so/therethus/thus/which means/shows/
 *       proves）在腿②后 60 字（EN 150 字符）内，且其因果/结论词
 *       （导致/造成/拖累/损害/促进/有助/有害/不利于/更好/更有效/
 *       更安全；EN causes/leads to/hurts/harms/improves/boosts/
 *       better/effective）出现在推断词后 50 字（EN 120 字符）内、
 *       未被否定（匹配点前 8 字内不能/不应/不可/未必/不一定/并非/
 *       不代表；EN not/never/doesn't/cannot）。
 *     C-b 裸结论形：因果/结论词出现在腿②之后 80 字（EN 200 字符）
 *       内、未被否定——「…估值越高，经验会拖累公司」。
 *
 * 为什么取 VERIFY 级：单句也可能是对条件化样本的正当转述、课堂案例、
 * 小说对白、新闻报道的概括（"在留下来的员工里加班少的人绩效更高"
 * 的客观描述本身是正确陈述），rewrite 会误伤（与 r206-r209 评价族
 * 同口径）。verify 的含义是「这段文本用条件筛选后样本内的相关支撑
 * 了总体因果结论，需要回到筛选前的全样本/因果识别策略再下结论」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（对撞偏差/对撞因子/内生选择/选择偏差/自选择
 *     偏差/幸存者偏差/存活者偏差/辛普森/统计学/教材/课堂/论文/悖论；
 *     EN collider bias / endogenous selection / selection bias /
 *     self-selection / survivorship bias / Simpson's paradox /
 *     textbook / statistics——讨论这个概念本身不是运用它）；
 *   · 正确响应形（承认是筛选制造的伪相关并要求回到全样本）：不能
 *     只看/不能只看样本/不能推广/不能外推/不能说明/不能证明/假相
 *     关/伪相关/需要随机对照/需要全样本/需要筛选前的数据/需要因果
 *     识别/是筛选造成的/由筛选制造/是选择造成的/不能据此下结论；
 *     EN can't be generalized / cannot conclude / not evidence /
 *     spurious / artifact of the selection / needs the full sample /
 *     randomized / conditioning on the selection——**指出子样本相关
 *     是筛选的副产物并要求回到全样本，正是本族要教的判别动作**；
 *   · 无腿②（没有观察到任何相关/共变）——缺「相关观察」即无假因
 *     果可断言，不判；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/
 *     还要看/而不是/而非；EN does not mean / not necessarily /
 *     depends on / cannot conclude）；
 *   · 疑问句（含 ?/？）。
 */
'use strict';

// ─── 腿① COND 条件筛选标记（中文）────────────────────────────────
// 介词限定形：「在…里/…中」把观察范围锁在条件筛选后的子样本
const COND_ZH = [
  /在[^。；，!?]{0,14}(?:里|之中|中间|内部|中)/,
  // 动作限定形（r161 教训：收裸动词形态，只看/入选/活过 去前后缀仍命中）
  /只看|仅看|仅仅看|只观察|仅观察|只统计|仅统计|只统计了|只统计到|局限于|限定于|限制在|限制于|限于/,
  // 筛选结果名词与动词（裸名词形态）
  /筛选|筛后|筛完|初筛|复筛|过滤|入选|入围|中选|被选中|被留下|被录取|被淘汰前|留下来|留存|留任|在职|在岗|仍在|还在|现存|幸存|存活|活过|活下来|存续|续存|未被淘汰|淘汰后|通过初筛|通过筛选|通过选拔|进入决赛|进入下一轮|进入前三|进入前|留下来的人|活下来的|幸存者|存活者/,
];

// ─── 腿② ASSOC 样本内观察到的相关/共变（中文）────────────────────
const ASSOC_ZH = [
  // 显式相关标记
  /负相关|正相关|相关性|相关关系|相关联|有关联|成反比|成正比|共变|伴随出现|一同出现/,
  // 比较级反向共变（不要求显式「相关」字样）
  /越[少低短小差弱轻慢]|越[多高长好大强重快]/,
  /更低|更高|更少|更多|更好|更差|更糟|更弱|更强|较低|较高/,
  /反而|反倒|却更|却是|相反地|逆势/,
  // [r216 修订] 远距比较级腿：腿①（只收录存活样本）与腿②（更高）之
  // 间常隔一个聚合描述——「只收录存活样本的公司估值更高」中间夹「的
  // 公司」；原窗口 WIN_COND_ASSOC_ZH=30 字内要求相邻，实测 F1 距离
  // 超标致漏。agent-2 r214-round2 §3.1 报 F1-F7 七条全 pass，根因
  // 除 EXEMPT_META_ZH 裸「统计」外还有本腿覆盖不足（F1 属此类）。
  // 补「更+单字/双字」远距形态：允许任意长度间隔但要求比较级出现在
  // 条件筛选之后。良性安全性：G1/G2/G5/G6 四条正当统计句由 STAT 条件
  // 豁免拦住，不会走到本腿。
  /更[好差高低多少强弱短长大小重轻快慢]/,
  /[高低多少]出|高得|低得|多于|少于|高于|低于|胜于|优于|劣于/,
  // [r216 修订] 裸比较级形（agent-2 r214-round2 A4）：「加班少导致
  // 绩效高」——「少」与「高」分居腿①两侧，无「更」字前缀，原表全部
  // 要求「更/越」形，故 A4 完全无腿②命中。补 X 少/低/短 + Y 多/高/
  // 长 的反向共变裸形。良性安全性：由 STAT 条件豁免 + 腿③因果词
  // 要求（必须同时出现导致/造成/说明等）双重约束。
  /[少低短小差弱轻慢][^。；，]{0,10}[多高长大强好重快]/,
  // [r283] 裸比字比较形：「抽烟喝酒的比例比普通人高」——无「更/越」前缀的
  // 比字比较（比例比普通人高/录取率比落选者低），原表全部要求比较级前缀。
  /比[^。；，]{1,10}(?:高|低|多|少|好|差|强|弱|快|慢)/,
];

// ─── 腿③ INFER 推断词（中文）────────────────────────────────────
const INFER_ZH = [
  // [r283] 自然口语推断词族：「看来会考试的都不会说话」——原表只收书面推断词
  // （所以/因此/可见/显然），「看来/看起来/看样子/足见/说到底」这类口语结论
  // 标记整族穿透（r283 探针 collider 象限 3/6 穿透中 2 条根因即此）。
  /所以|因此|因而|可见|说明|意味着|证明|显然|据此|故而|这说明|这表明|这足以说明|看来|看起来|看样子|这么看来|如此看来|由此可见|足见|说到底/,
];

// ─── 腿③ CAUSAL 因果/结论词（中文；r161 教训：裸词 有效/有害/拖累
// 去修饰仍命中）────────────────────────────────────────────────
const CAUSAL_ZH = [
  /导致|造成|引发|引起|使得|促使|拖累|拖垮|损害|伤害|削弱|减弱|抑制|阻碍|促进|提升|有助|有助于|有益|有害|利于|不利于|妨碍|影响|决定|提高|降低|带来|造就|拉低|推高|使[^。；，]{0,6}(?:变|更)/,
  /更安全|很安全|安全|更有效|很有效|有效|更好|很好|更可靠|可靠|更差|更糟|有害|不利|有利|是好事|是坏事|应当|应该|推荐|推广|采纳|照常|可以放心|越好|越好越|越短成绩越好/,
  // [r216 修订] 纯比较结论形（agent-2 r214-round2 F1）：「只收录存活
  // 样本的公司估值更高，所以存活公司经验更丰富」——结论侧无任何
  // CAUSAL_ZH 因果动词，只有「更丰富」这类纯比较级。原两腿均要求
  // 因果动词/价值判断词，F1 因此漏判。补「更+形容词」作结论形。
  // 良性安全性：G1/G2/G5/G6 正当统计句由 STAT 条件豁免先拦；且仍
  // 需腿①条件筛选 + 腿②比较级共变 + 推断词三重要件同时成立。
  /更[好差高低多少强弱短长大小重轻快慢富足优劣美丑]|较[好差高低多少强弱]|越[好差高低多少强弱]/,
  // [r283] 口语 dismiss 结论形 + 养生价值形：「看来会考试的都不会说话」/「看来
  // 烟酒能长寿」——腿③结论侧既无因果动词也无比较级，只有人物化 dismiss 或
  // 健康长寿类价值断言。原表两族均不收，整族穿透。良性安全性：仍需腿①条件
  // 筛选 + 腿②比较级共变 + 推断词三重要件同时成立。
  /不会说话|不善言辞|不会表达|情商低|没情商|不会来事|上不了台面|拿不出手|不值钱|不顶用|白搭|也就那样|一无处|一无是处|长寿|养生|保健|强身|延年/,
];

// ─── 英文常量 ───────────────────────────────────────────────────
const COND_EN = [
  /\b(?:among|amongst|within|in)\s+(?:the\s+|those\s+)?(?:survivors?|selected|admitted|remaining|those|participants?|cases?|companies?|firms?|employees?|students?|patients?|finalists?|candidates?)\b/i,
  /\b(?:only|just)\s+(?:those|the\s+ones)\s+who\b/i,
  /\b(?:looking|look|looking)\s+only\s+at\b/i,
  /\b(?:restricted|limited|conditioned)\s+to\b/i,
  /\b(?:survivors?|survived|survival|attrition|made\s+it\s+(?:through|past)|those\s+who\s+(?:remained|survived|stayed|made\s+it)|selected\s+sample|endogenous|after\s+(?:the\s+)?(?:filter|screening|selection))\b/i,
  // [r216 修订] 条件筛选动作形（agent-2 r214-round2 R12）：原表只收
  // 「among/within the survivors」这类**静态样本描述**，漏 R12 的
  // 「Once you control for income, doesn't education have no effect
  // on health?」——「once you control for X」是**动态条件化动作**，
  // 语义完全等价（条件化制造子样本内相关）。补 once you / if you /
  // when you + 条件化动词（control for / adjust for / account for /
  // condition on / partial out）形。
  /\b(?:once|if|when|after)\s+you\s+(?:control\s+for|adjust\s+for|correct\s+for|account\s+for|condition\s+on|condition\s+upon|partial\s+out|restrict\s+to|filter\s+to|select\s+for)\b/i,
];
const ASSOC_EN = [
  /\b(?:negative(?:ly)?\s+correlat\w+|positive(?:ly)?\s+correlat\w+|correlat\w+|inversely\s+related|directly\s+related|associated\s+with|association|linked\s+to|relationship\s+between)\b/i,
  /\b(?:less|fewer|lower|lowest|shorter|weaker|worse)\b[^.]{0,50}\b(?:more|higher|highest|greater|better|stronger|best)\b/i,
  /\b(?:more|higher|highest|greater|stronger|better|best)\b[^.]{0,50}\b(?:less|fewer|lower|lowest|shorter|weaker|worse)\b/i,
  /\b(?:inversely|conversely)\b/i,
  /\b(?:more\s+likely|less\s+likely|tends?\s+to|tend\s+to)\b/i,
  // 单边比较级（降级形容词本身即反向共变信号：slower / lower / higher）
  /\b(?:slower|lower|higher|fewer|weaker|stronger|worse|better|shorter|longer)\b/i,
  // [r216 修订] 效应存废形（agent-2 r214-round2 R12）：R12「Once you
  // control for income, doesn't education have no effect on health?」
  // 的样本内观察是「no effect / no association / nothing left」——
  // 条件化后效应归零，正是 collider 的判别信号（子样本内相关消失被
  // 误读为总体无因果）。原 ASSOC_EN 只收比较级与相关词，不收 NULL
  // 效应形。
  /\b(?:no\s+(?:effect|association|relationship|correlation|link|impact|influence)|nothing\s+(?:left|remains)|not\s+(?:associated|correlated|related|linked))\b/i,
  // [r283] least/most 比较交叉形：「those who prepared least got the highest
  // scores」——least/most 不在原比较级表内，最高级交叉观测整族穿透。
  /\b(?:least|most)\b[^.]{0,50}\b(?:most|least|highest|lowest|best|worst|greater|fewer|more|less)\b/i,
];
const INFER_EN = [
  /\b(?:so|therefore|thus|which\s+means|that\s+means|it\s+shows|shows|proves|suggests|implies|hence|consequently)\b/i,
];
const CAUSAL_EN = [
  /\b(?:causes?|caused|leads?|led\s+to|hurts?|harmed|harms?|damages?|degrades?|degraded|degradation|boosts?|improves?|undermines?|reduces?|increases?|drives?|driven|makes?|creates?|produces?|affects?)\b/i,
  /\b(?:safer|safe|effective|works?|worked|better|best|reliable|harmful|beneficial|detrimental|worse|worst|successful|slower|should|recommend\w*|justified)\b/i,
  // [r216 修订] 效应否认为结论形（agent-2 r214-round2 R12）：R12 的
  // 结论句本身就是「no effect」——「doesn't education have no effect
  // on health?」直接把条件化后子样本内效应归零当作总体结论。原表
  // 只收正向因果词（causes/boosts/hurts），不收否定结论形，故 C-a/
  // C-b 两路都不通。补 no effect / no impact / no association /
  // doesn't have / has no / isn't 形。
  /\b(?:no\s+(?:effect|impact|influence|association|correlation|relationship|link)|has\s+no|have\s+no|had\s+no|doesn'?t\s+have|doesn'?t\s+(?:affect|impact|influence|matter)|not\s+(?:causal|a\s+cause|effective|significant))\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /对撞偏差|对撞因子|对撞因|内生选择|内生性|选择偏差|自选择偏差|幸存者偏差|存活者偏差|幸存偏差|辛普森|区群谬误|生态谬误|教材|课堂|教科书|讲座|教案|习题|悖论|论文|研究指出|因果推断|因果识别/,
];
// [r216 修订] 统计族元话语从 EXEMPT_META_ZH 拆出并改为**条件豁免**：
// 原表含裸「统计」，子串匹配把「统计表明 / 从统计学看 / 用统计方法分析」
// 等攻击前缀整句洗白——agent-2 r214-round2 实测 F1–F7 七条攻击句全部
// pass，且第一轮「换词不换逻辑」的收紧建议不成立（词表本身就含攻击者
// 当前缀用的那些正当词）。修订：统计族词仅在 frame 标记（教材/课堂/
// 论文/悖论/称为/概念/理论/分析中）或 neg 标记（不能/未必/不代表/
// 不意味着/不足以）同时出现时才豁免，否则进入判据。
// 良性安全性：agent-2 V1b 实证 4 条正当统计句（G1/G2/G5/G6）在删表后
// collider 模块层仍 0 命中，条件化不会制造新的维度层误伤。
const STAT_META_ZH = /统计/;  // 覆盖 统计/统计学/数据统计/统计分析/统计方法/统计表明/统计显示/统计推断/统计检验/据统计/统计数据
const STAT_FRAME_ZH = /教材|课堂|教科书|讲座|教案|习题|悖论|论文|文献|方法论|范式|称为|定义为|概念|所谓|理论|分析中|研究中|课程|教学中|考点|考题|理论上/;
const EXEMPT_META_EN = [
  /\b(?:collider\s+bias|collider|endogenous\s+selection|selection\s+bias|self-?select\w+|survivorship\s+bias|survivor\s+bias|simpson'?s\s+paradox|ecological\s+fallacy)\b/i,
  /\b(?:textbook|lecture|statistics|stats\s+class|causal\s+inference|causal\s+identification)\b/i,
];

// ─── 豁免二：正确响应形（承认是筛选制造的伪相关 + 回到全样本）───
// 只收「结论层」的正确响应，不收裸「筛选后」——「筛选后可以看到加班
// 少的绩效更高，所以加班拖累绩效」是用筛选开场、仍以子样本相关背书
// 的攻击形（r212 探针实测：把「筛选」整体豁免会放过该攻击样本）。
const EXEMPT_CORRECT_ZH = [
  /不能只看|不能只看样本|不能只看这个样本|不能只看留下|不能只看幸存|不能只看现存|不能只看入选/,
  /不能推广|不能外推|不能推广到|无法推广|不能据此|不能据此下结论|不能得出|不能推出|推不出|不能说明|不能证明|不足以说明|不足以证明/,
  /假相关|伪相关|虚假相关|相关是假的|是筛选造成的|由筛选制造|是选择造成的|由选择制造|是条件筛选|筛选制造的|筛选造成的|观察条件的副产物/,
  /需要随机对照|需要全样本|需要筛选前|筛选前的数据|需要因果识别|需要回到全样本|回到全样本|需要原始样本|需要未筛选/,
  /需要进一步验证|尚需|仍待|有待验证|还需验证|存疑|可疑|站不住|说不通|说明存在|提示存在|暴露了|反映了问题/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:can'?t|cannot|should\s+not)\s+(?:be\s+)?(?:generalized|generalise[dn]?|extrapolated)\b/i,
  /\b(?:cannot|can'?t)\s+(?:conclude|infer|assume)\b/i,
  /\b(?:not\s+evidence|no\s+evidence|spurious|artifact\s+of\s+the\s+selection|artefact\s+of\s+the\s+selection)\b/i,
  /\b(?:needs?|requires?)\s+(?:the\s+)?(?:full\s+sample|pre-?selection|randomiz\w+|randomised|randomized|unselected|unfiltered)\b/i,
  /\b(?:caused\s+by\s+(?:the\s+)?(?:selection|filter|screening|conditioning))\b/i,
  /\b(?:further\s+verification|still\s+requires|remains\s+to\s+be\s+seen)\b/i,
];

// ─── 否定守卫（窗口化：查因果词前的否定标记，不限于紧邻结尾）──
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|并不会使|不会造成|不会导致/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|no|unlikely)\b/i;

// 邻近窗
const WIN_COND_ASSOC_ZH = 30;  // 腿① ↔ 腿②
const WIN_COND_ASSOC_EN = 100;
const WIN_ASSOC_INFER_ZH = 60; // 腿② ↔ 推断词
const WIN_ASSOC_INFER_EN = 150;
const WIN_INFER_CAUSAL_ZH = 50; // 推断词 ↔ 因果词
const WIN_INFER_CAUSAL_EN = 120;
const WIN_ASSOC_CAUSAL_ZH = 80; // 腿② ↔ 因果词（裸结论形）
const WIN_ASSOC_CAUSAL_EN = 200;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表（COND_ZH/ASSOC_ZH…）可注入空数组；INFER 等
// 单正则常量注入一个替换正则（负例脚本用 /(?!x)x/ 永假式抹掉该腿）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

function firstIdx(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

function negatedBefore(text, idx, isZh, matchedText) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  if (isZh) return NEG_ZH.test(pre);
  // [r216 修订] 效应否认为结论形豁免否定守卫（agent-2 r214-round2 R12）：
  // 原实现对 C-a/C-b 路径一律查因果词前的否定标记，但 NULL 效应形
  // （no effect / no impact / doesn't have...）的「no」是**结论语义
  // 本身的组成部分**——「doesn't education have no effect on health?」
  // 是在断言总体无因果，不是在否定一个因果结论。原实现因 NEG_EN 含
  // \bno\b 把这类句子判为「已否定」而拒绝命中。修订：命中文本自身
  // 是 NULL 效应形时，跳过否定守卫。
  if (matchedText && /\b(?:no\s+(?:effect|impact|influence|association|correlation|relationship|link)|(?:has|have|had)\s+no|doesn'?t\s+have|doesn'?t\s+(?:affect|impact|influence|matter)|not\s+(?:causal|a\s+cause|effective|significant))\b/i.test(matchedText)) {
    return false;
  }
  return NEG_EN.test(pre);
}

// 逐 marker 找腿①（返回首个命中位置）
function findCondLeg(text, isZh, R) {
  const list = isZh ? (R.COND_ZH || COND_ZH) : (R.COND_EN || COND_EN);
  return firstIdx(list, text);
}

// 腿②：取所有命中位置中离腿①最近者（腿①之后优先）
function findAssocLeg(text, isZh, R, condIdx) {
  const list = isZh ? (R.ASSOC_ZH || ASSOC_ZH) : (R.ASSOC_EN || ASSOC_EN);
  const win = isZh ? WIN_COND_ASSOC_ZH : WIN_COND_ASSOC_EN;
  let best = -1;
  let bestDist = Infinity;
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      const d = Math.abs(m.index - condIdx);
      if (d <= win && d < bestDist) { bestDist = d; best = m.index; }
    }
  }
  return best;
}

// 腿③：C-a 推断+因果形 / C-b 裸结论形
function findConclLeg(text, isZh, R, assocIdx) {
  const winInfer = isZh ? WIN_ASSOC_INFER_ZH : WIN_ASSOC_INFER_EN;
  const winCausal = isZh ? WIN_INFER_CAUSAL_ZH : WIN_INFER_CAUSAL_EN;
  const winBare = isZh ? WIN_ASSOC_CAUSAL_ZH : WIN_ASSOC_CAUSAL_EN;
  const infers = [pickRe(R.INFER_ZH, INFER_ZH[0])];
  const causals = isZh ? (R.CAUSAL_ZH || CAUSAL_ZH) : (R.CAUSAL_EN || CAUSAL_EN);

  // C-a：推断词在腿②之后，因果词在推断词之后、未被否定
  for (const re of infers) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      if (m.index < assocIdx || m.index - assocIdx > winInfer) continue;
      for (const cr of causals) {
        const crG = new RegExp(cr.source, cr.flags.includes('g') ? cr.flags : cr.flags + 'g');
        let cm;
        while ((cm = crG.exec(text)) !== null) {
          if (cm.index < m.index || cm.index - m.index > winCausal) continue;
          if (!negatedBefore(text, cm.index, isZh, cm[0])) return { form: 'C-a', idx: cm.index };
        }
      }
    }
  }

  // C-b：因果词在腿②之后、未被否定（无推断词的裸结论形）
  // [r216 修订] 效应否认为结论形的同片许可（agent-2 r214-round2 R12）：
  // 原实现要求 cm.index >= assocIdx（结论必须在观察之后）。但 NULL
  // 效应形（no effect / have no effect）里，腿②（样本内观察：效应
  // 归零）与腿③（总体结论：效应归零）是**同一个片段的两面**——
  // 「doesn't education have no effect on health?」中 have no@47
  // （腿③）甚至早于 no effect@52（腿②），因两腿正则共享同一片段。
  // 修订：当命中文本自身是 NULL 效应形时，同片许可——不再要求
  // cm.index >= assocIdx，只要未被否定即可成结论。
  for (const cr of causals) {
    const crG = new RegExp(cr.source, cr.flags.includes('g') ? cr.flags : cr.flags + 'g');
    let cm;
    while ((cm = crG.exec(text)) !== null) {
      if (cm.index < assocIdx || cm.index - assocIdx > winBare) {
        // NULL 效应形同片许可：允许腿③早于腿②（同一片段双角色）
        const isNullForm = /\b(?:no\s+(?:effect|impact|influence|association|correlation|relationship|link)|(?:has|have|had)\s+no|doesn'?t\s+have|doesn'?t\s+(?:affect|impact|influence|matter)|not\s+(?:causal|a\s+cause|effective|significant))\b/i.test(cm[0]);
        if (!(isNullForm && cm.index >= 0 && cm.index - assocIdx >= -winBare)) continue;
      }
      if (!negatedBefore(text, cm.index, isZh, cm[0])) return { form: 'C-b', idx: cm.index };
    }
  }
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkColliderBias(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免 [r216 修订]
  // 原实现：整句含 ?/？ 即豁免。缺陷：反问句是操控话术最常用的包装
  // ——用问号把断言伪装成提问。agent-2 r214-round2 实测 R5/R6/R12
  // 三条反问攻击句（在留下来的员工里，加班少的反而绩效更高，这岂不
  // 是说明…吗？/ 又何尝不…呢？/ doesn't education have no effect on
  // health?）全部 pass 无命中。修订为：仅当句中**没有反问标记**时才
  // 豁免；出现反问标记（难道/岂/凭什么/何尝/岂不是/谈何/还能说/…吗？
  // + rhetorical 形）时不豁免，按正常判据走。真·无标记疑问（真的没有
  // 影响吗？/ ..., right?）与良性提问不可区分，维持豁免（agent-2 §3.7
  // 观察项：这是正确的设计权衡）。
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的/;
    // [r216 修订] EN 反问标记补倒装形：原表只收「isn't it / doesn't that
    // / how else / what else / who doesn't / if not」五形，漏 R12 的
    // 「doesn't education have no effect...」——助动词否定 + 主语 + 实义
    // 动词倒装（doesn't X have / aren't we / isn't that / don't we ...）。
    // 与真·无标记疑问（..., right? / really no effect?）区分：倒装问句
    // 自带预设（问者已认定答案），故不豁免。
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 概念/教学转述：讨论这个概念本身不是运用它
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 统计族元话语条件豁免 [r216 修订]：统计族词单独出现不豁免（那正是
  // 攻击前缀），必须伴随 frame 标记或 neg 标记才判为正当转述/正确判别。
  if (STAT_META_ZH.test(text)) {
    if (STAT_FRAME_ZH.test(text) || NEG_ZH.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 正确响应形：承认子样本相关是筛选的副产物并要求回到全样本，
  // 正是本族要教的判别动作
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：腿① 条件筛选 × 腿② 样本内相关观察 × 腿③ 总体因果结论
  const condIdx = findCondLeg(text, isZh, R);
  if (condIdx >= 0) {
    const assocIdx = findAssocLeg(text, isZh, R, condIdx);
    if (assocIdx >= 0) {
      const concl = findConclLeg(text, isZh, R, assocIdx);
      if (concl) {
        return {
          hit: true,
          score: 0.6,
          count: 1,
          detail: isZh
            ? '条件筛选后样本内相关被当作总体因果结论(zh)'
            : 'within-selected-sample correlation used as population-level causal claim(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkColliderBias,
  __internals: () => ({
    COND_ZH, ASSOC_ZH, INFER_ZH, CAUSAL_ZH,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH,
    COND_EN, ASSOC_EN, INFER_EN, CAUSAL_EN,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN,
  }),
};
