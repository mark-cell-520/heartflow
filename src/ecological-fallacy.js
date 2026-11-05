/**
 * src/ecological-fallacy.js — 「生态谬误 / 区群谬误」检测器
 * （第 211 个判别维度，r215）
 *
 * [r215 立项] philosophy_decision 在当前引擎（v6.8.142，210 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为
 * "unknown"，按轮次纪律不当实质背书）。立项缺口实证：生态谬误族关键词
 * （生态谬误/群体推个体/个体推群体/ecological/区群）在 src/ 下扫描——
 * ecological 仅作为**边界注释**出现于 collider-bias.js、
 * might-makes-right.js、simpsons-paradox.js、whole-part-transfer.js 四个
 * 文件，无任何一个文件实现本族判别；群体统计→个体推断的句式族中文零
 * 覆盖、英文仅 division_fallacy 窄模式。近邻维度边界实测确认：
 * simpsons_paradox(206) 判聚合层与子群层趋势方向相反、whole_part_transfer
 * (170) 判整体属性直接搬到部分、base_rate_neglect(169) 判忽视基础比率，
 * 没有一个判「拿群体/聚合层统计量直接推断个体成员属性」。
 *
 * 外部来源：HN Algolia「The Ecological Fallacy」（60 分故事页）+
 * LessWrong「Scope Insensitivity」+ 经典统计学科普中 Robinson (1950) 的
 * 原始区群谬误定义与跨层推断（ecological inference）综述。GitHub 搜索
 * logical fallacy detection 高星仓库无成熟规则方案；Semantic Scholar
 * 查询遇 429 限流。按心虫既有维度形态自建纯规则判据。
 *
 * 辨别的族：生态谬误（ecological fallacy / 区群谬误 / atomistic
 * fallacy 的镜像）——拿**群体/聚合层的统计量**直接推断**个体成员**的
 * 属性或个体层结论，缺跨层桥接：
 *   统计显示甲地区人均预期寿命比乙地区高，所以随便挑一个甲地区的人
 *   也比乙地区的人长寿。
 *   该国平均收入很高，因此这个国家的每个人都很有钱。
 *   失业率高的社区犯罪率也高，所以失业的人都会犯罪。
 *   数据显示这个群体的平均分更高，这说明你作为其中一员也更优秀。
 *   The average income in that country is high, so every individual there
 *   is rich.
 *   Neighborhoods with high unemployment have high crime, therefore each
 *   person there is a criminal.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：群体统计量是
 * **聚合层的量**，个体成员是**分布中的一个点**。平均数、比率、率这些
 * 聚合量对个体成员**不构成约束**——一个人均寿命 80 岁的地区可以有大量
 * 早逝者，一个平均收入很高的国家可以有大量贫困人口。把聚合量当成个
 * 体层的断言，等于用「分布的期望」冒充「分布中的每一个点」，这是最常
 * 以严谨数据外观出现的一类假严谨：它穿着统计的外衣，却正好违反了统计
 * 学最根本的层次纪律。它直接破坏心虫「能准确寻找答案」的能力——被这
 * 条谬误污染的结论会在数据完全真实的情况下得出完全错误的个体判断。
 *
 * 与既有维度的边界（r215 归因）：
 *   · simpsons_paradox（第 206 维度）管聚合层与子群层**趋势方向相反**，
 *     本族不要求方向逆转，只要聚合量→个体推断这一跨层动作；
 *   · whole_part_transfer（第 170 维度）管整体属性直接搬到**部分**，
 *     本族的承重对象是**统计量**（平均/比率/率/统计显示）而非整体属性；
 *   · base_rate_neglect（第 169 维度）判忽视基础比率做条件概率判断，
 *     本族不涉及概率更新，只涉及层次跨越；
 *   · hasty_generalization 管**样本→总体**的以偏概全（含个体案例→群体
 *     结论），本族只管**总体/群体→个体**这一方向，反向不判（边界如实
 *     声明：个体推群体由 hasty_generalization 与 anecdotal 覆盖）。
 *
 * 判据（主判据两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① AGG 群体/聚合层统计量：平均/人均/均值/中位数/比例/占比/
 *     比率/百分比/份额/比重 + 显式率词（失业率/犯罪率/离婚率/死亡率/
 *     患病率/发病率/及格率/贫困率…）+ 统计/普查/抽样/样本/问卷 +
 *     数据显示/数据表明/调查显示/研究显示/报告显示 + 总体/整体/宏观/
 *     全国 + 该国/该地区/该城市/该社区 + 国家层面/地区层面/群体层面 +
 *     地区之间/国家之间（EN average / mean / median / per capita /
 *     on average / proportion / percentage / rate of / X rate /
 *     statistics show / data show / survey shows / studies found /
 *     aggregate / collectively / overall / nationwide / statewide /
 *     nationally / at the group level / across the countries）——
 *     **r215 纪律：腿①只收「聚合量」标记**，群体单位名词（国家/地区/
 *     群体）单独出现不构成腿①，必须伴随统计量词；「全国人民都很幸福」
 *     这类无统计量的群体断言不判（那属过度概括，非生态谬误）。
 *   · 腿② IND 个体层推断：推断连接 + 个体层量化结论（所以/因此/因而/
 *     可见/据此/也就是说/那么 + 每个人/人人/所有/个体/个人/某个成员）+
 *     个体层量化指称裸名词（每个/各个/任意/任何/随便 + 人/个体/成员）+
 *     统计来源类人群 + 断言副词（失业的/农村的/这里的人 都/一定/更）+
 *     说明/意味着 + 第二人称 + 个体层结论副词（个体身上/个人身上 也/
 *     一定/更）（EN so/therefore/which means + every individual / each
 *     person / a random individual / people from that country /
 *     individuals in that group / means you / he / she / individuals
 *     are all）——腿②须位于腿①前后邻近窗内。
 *
 * 为什么取 VERIFY 级：单句也可能是对群体层研究结果的合法转述、课堂
 * 案例或统计学科普（「该地区人均寿命更长，但个体差异很大」是正当的分
 * 层报告），rewrite 会误伤（与 r206-r213 同口径）。verify 的含义是
 * 「这段文本用群体统计量直接推断个体属性，需要先补上个体层数据或跨层
 * 桥接再采信」——调用方应要求区分聚合层与个体层、补充个体层证据。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（生态谬误/生态学谬误/区群谬误/群体水平/个体水平/
 *     跨层推断/层次推断/多层模型/生态推断/统计学/教材/课堂/论文/称为/
 *     定义为/概念；EN ecological fallacy / atomistic fallacy /
 *     ecological inference / group level / individual level /
 *     cross-level / multi-level / hierarchical model / aggregation
 *     bias / textbook / statistics / called / defined——讨论这个概念
 *     本身不是运用它；元话语豁免要求句中同时出现教学/学术框架标记或
 *     否定标记）；
 *   · 正确响应形（指出不能跨层推断并要求个体层证据：不能推断/无法
 *     推断/不能直接推断/不能据此推断/不能从群体/需要个体/需要桥接/
 *     需要跨层/要区分/须区分/犯了/这就是生态谬误/个体差异/异质性/方差/
 *     标准差/分布不均；EN cannot infer / doesn't imply / not
 *     necessarily / needs individual-level / requires bridging /
 *     distinguish group from individual / commits the ecological
 *     fallacy / individual differences / heterogeneity / varies
 *     widely——**指出跨层推断无效并要求个体层证据，正是本族要教的
 *     判别动作**）；
 *   · 无腿②（没有出现个体层推断结论）——缺「个体层结论」即无跨层断言
 *     可判，不判；
 *   · 无腿①（没有群体/聚合层统计量）——群体单位名词单独出现不判；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/还要
 *     看/而不是/而非；EN does not mean / not necessarily / depends on
 *     / cannot conclude）；
 *   · 疑问句（含 ?/？；反问标记出现时不豁免）。
 */
'use strict';

// ─── 腿① AGG 群体/聚合层统计量（中文；r215 纪律：只收聚合量标记，
// 群体单位名词单独出现不构成腿①）──────────────────────────────────
const AGGREGATE_ZH = [
  // 聚合统计量裸名词（r161/r215 教训：平均/比例/率 去修饰仍命中）
  /平均|人均|均值|中位数|平均水平|平均收入|平均寿命|平均数/,
  /比例|占比|比率|百分比|份额|比重|构成比/,
  // 显式率词（不收裸「率」——效率/概率/频率 是良性词）
  /失业率|犯罪率|离婚率|死亡率|出生率|患病率|发病率|及格率|通过率|就业率|升学率|录取率|自杀率|贫困率|文盲率|近视率|肥胖率|复发率|治愈率|犯罪率高|离婚率高/,
  // 统计活动与数据来源
  /统计|普查|抽样|样本|问卷|人口学|人口统计|统计学家/,
  /数据显示|数据表明|数据反映|调查显示|调查表明|研究显示|研究表明|报告显示|资料显示|档案显示|普查显示|统计显示|统计表明/,
  // 聚合层范围名词
  /总体|整体|全局|宏观|全社会|全国性|举国/,
  /全国|全国范围|全国整体|国民|举国上下/,
  /该国|该地区|该城市|该省|该市|该县|该社区|该群体|这个国家|这个地区|这座城市|这个社区|这一地区|这一群体|此地区|那地区/,
  /国家层面|地区层面|群体层面|社区层面|社会层面|宏观层面|整体层面|集体层面|区域层面|全国层面/,
  /地区之间|国家之间|群体之间|区域之间|省际|城际|社区之间|国与国|地区与地区/,
];

// ─── 腿① AGG 群体/聚合层统计量（英文）──────────────────────────
const AGGREGATE_EN = [
  /\b(?:average|averaged|averages?|mean|median|per\s+capita|on\s+average)\b/i,
  /\b(?:proportion|percentage|share|ratio)\s+(?:of|is|was|are|were)\b/i,
  /\b(?:unemployment|crime|divorce|mortality|birth|literacy|graduation|poverty|obesity|suicide|dropout|incidence|prevalence|infant)\s+rate\b/i,
  // 显式率词 + 高/低（"Neighborhoods with high unemployment have high
  // crime, therefore each person there is a criminal" 无裸 crime rate
  // 拼写但有 high 修饰的同类率词族——不收则 EN 腿①漏）
  /\b(?:high|low|higher|lower|rising|falling|elevated)\s+(?:unemployment|crime|divorce|mortality|birth|literacy|graduation|poverty|obesity|suicide|dropout|incidence|prevalence|income|wealth|score|performance)\b/i,
  /\b(?:unemployment|crime|divorce|mortality|poverty|income|wealth)\s+(?:is|are|was|were)\s+(?:high|low|higher|lower)\b/i,
  /\b(?:statistics|stats|data|survey|poll|census|figures|numbers)\s+(?:show|shows|showed|indicate|indicates|suggest|suggests|found|find|reveal|reveals|report)\b/i,
  /\b(?:studies|research|researchers|the\s+study|the\s+survey|the\s+census|the\s+data)\s+(?:show|shows|found|find|indicate|indicates|suggest|suggests|reveal|reveals)\b/i,
  /\b(?:aggregate|aggregated|collective|collectively|overall|population-?wide|nationwide|statewide|countrywide|society-?wide)\b/i,
  /\b(?:the\s+)?(?:group|population|nation|country|state|city|region|community|neighborhood|society|cohort)\s+(?:as\s+a\s+whole|average|level|on\s+average)\b/i,
  /\b(?:across|between)\s+(?:the\s+)?(?:countries|nations|states|regions|cities|groups|communities|neighborhoods)\b/i,
  /\b(?:nationally|regionally|globally|society-?wide|population-?wide)\b/i,
  /\b(?:at|on)\s+the\s+(?:group|national|aggregate|population|societal|collective|societal)\s+level\b/i,
];

// ─── 腿② IND 个体层推断（中文；r215：推断连接 + 个体层量化结论）──
const INDIVIDUAL_ZH = [
  // A. 推断连接 + 个体层量化结论（群体统计→个体推断的跨层桥）
  /(?:所以|因此|因而|可见|据此|也就是说|那么|这足以|这说明|这意味着)\s{0,14}[^。；，!?]{0,14}(?:每个人|人人|所有人|全体成员|每个成员|各个成员|某个成员|这个成员|该成员|个体|个人|任何一个|随便一个|某一个人|具体的人)/,
  // A2. 推断连接 + 群体成员裸名词（「所以每个打工人的收入都提高了」
  // 中连接词后直接是成员名词，无「人」字尾）
  /(?:所以|因此|因而|可见|据此|也就是说|那么|这足以|这说明|这意味着)\s{0,14}(?:每个|各个|任意|任何|随便|所有|全体)[^。；，!?]{0,10}(?:打工者|劳动者|从业者|打工人|学生|员工|职工|居民|成员|消费者|家长|患者|病人|司机|老师|老人|孩子|男人|女人|用户|客户|个体|个人|人)/,
  // A3. 推断连接 + 个体指称 + 属性转移（「这说明那里的每个人都很穷」
  // 中连接词到指称间隔较长——把「那里/当地/本地」类范围限定纳入）
  /(?:所以|因此|因而|可见|据此|也就是说|那么|这足以|这说明|这意味着)\s{0,20}[^。；，!?]{0,4}(?:这里|那里|当地|本地|城中|村里)[^。；，!?]{0,8}(?:每个|人人|所有|任何|随便)/,
  // B. 个体层量化指称裸名词（r161 教训：每个/个体/个人 去修饰仍命中）
  // **r215 边界纪律**：裸「每个X都Y」在群体统计句里出现时是典型生态
  // 谬误（「平均收入高，所以每个人都很有钱」），但单独出现可以是良性
  // 陈述（「每个学生都付出了努力」）。因此 B 腿只在句中**同时存在聚合
  // 统计量腿①**时才启用——由主判据保证；连接词形（A/A2/A3/D2）不依赖
  // 该纪律，因为它们本身携带推断语义。
  /(?:每个|各个|任意|任何|随便)(?:一个|一名|一位)?(?:人|个体|成员|个人)/,
  // B2. 插入式选取动词（随便挑/任意选/随机抽 一个……人——「随便挑一个
  // 甲地区的人」中动词与指称之间可插入修饰语，不收则整句漏判）
  /(?:随便|任意|随机)(?:挑|选|抽|拉|找|取|拎)[^。；，!?]{0,12}(?:人|个体|成员|个人|学生|员工|居民|职工|病人|患者|司机|老师|用户|客户|老人|孩子|男人|女人|打工者|劳动者|从业者)/,
  /所有人|人人|全体成员|每个成员|各个成员|成员都|成员们|无一例外/,
  /某个成员|这个成员|该成员|某一个成员|单个成员|个体成员|具体的个人|某个人|随便哪个人|任何一个|无一例外/,
  // C. 统计来源类人群 + 断言副词（群体属性直接摊到该类成员身上）
  // 同 B 腿纪律：须句中同时存在聚合统计量腿①才启用（见上方注释）。
  /(?:这里|当地|本地|这个|该|这一|这些|那些|该国|本地区|城里|村里|国内|那里|失业|贫困|低收入|低学历|农村|山区|单亲|留守|移民|外来|少数族裔|高龄|老龄|工人|农民|学生|员工|居民|成员|女性|男性|年轻人)的?人(?:都|一定|必然|肯定|也|同样|更|往往|通常|注定|天生|容易|会)/,
  // C2. 群体成员裸名词 + 断言副词（打工人/学生/员工/居民/消费者）
  /(?:每个|各个|任意|任何|随便)(?:打工?人?|学生|员工|居民|成员|消费者|家长|患者|职工|老师|司机|老人|孩子|男人|女人|用户|客户|个体|个人|人)\s*(?:都|一定|必然|肯定|也|同样|更|往往|通常|注定|天生|容易|会)/,
  // D. 说明/意味着 + 第二人称个体指称
  /(?:说明|意味着|足以证明|可见|表明|证明|反映了)\s{0,6}(?:你|您|他|她|你们|他们|她们)/,
  // D3. r215 补：推断连接词 + 第二/三人称个体指称（含限定语）。漏判实证：
  // 「平均智商高于邻国，所以你邻居家的孩子一定更聪明」——连接词后不是裸
  // 指称而是带限定语的指称（你邻居家的孩子 / 住在这里的你 / 你们这里的），
  // D 族不收连接词族、A 族只收「每个人/人人」类，中间形态整族漏判。
  /(?:所以|因此|因而|据此|也就是说|那么|这足以|这说明|这意味着|可以说|显而易见)\s{0,12}[^。；，!?]{0,10}(?:你|您|他|她|你们|他们|她们)[^。；，!?]{0,10}(?:家的|这里的|那里的|当地的|身边的|当中|里面|身上)/,
  // D4. r215 补：推断连接词 + 「住在这里/这里的你」形（限定语前置）
  /(?:所以|因此|因而|据此|也就是说|那么|这足以|这说明|这意味着)\s{0,12}(?:住|待|生活|工作|学习)?在?(?:这里|那里|当地|本地|这个城市|这个国家|这个地区|这一带)[^。；，!?]{0,8}(?:你|您|他|她|你们|他们|她们)/,
  // D2. 说明/意味着 + 个体指称（第二人称之外：每个个体/个人成员）
  /(?:说明|意味着|足以证明|表明|证明|反映了)\s{0,20}[^。；，!?]{0,8}(?:每个|人人|所有|任何|随便)(?:个体|个人|成员|人|学生|员工|职工|居民|患者|老人|孩子|男人|女人|打工者|劳动者)/,
  // E. 个体层结论副词宣告
  /(?:个体|个人)(?:身)?上(?:也|一定|必然|肯定|同样|更|都|注定)/,
  /(?:每个人|人人|个体|个人|每个成员|全体成员)\s*(?:也|一定|必然|肯定|同样|都|注定|天生|更)/,
];

// ─── 腿② IND 个体层推断（英文）─────────────────────────────────
const INDIVIDUAL_EN = [
  // A. 推断连接 + 个体层结论
  /\b(?:so|thus|therefore|hence|which\s+means|this\s+means|that\s+means|meaning|implying|it\s+follows)\b[^.]{0,44}?\b(?:every|each|any)\s+(?:individual|person|member|one|man|woman|student|worker|citizen|resident|voter)\b/i,
  /\b(?:so|thus|therefore|hence|which\s+means|it\s+follows)\b[^.]{0,44}?\b(?:individuals?|persons?|members?)\s+(?:from|in|of)\s+(?:that|this)\b/i,
  // B. 个体层量化指称
  /\b(?:every|each|any)\s+(?:individual|person|member|single\s+one)\b/i,
  /\ball\s+(?:individuals?|members?|persons?|people)\b/i,
  /\b(?:a|an)\s+(?:random|typical|average)\s+(?:individual|person|member)\b/i,
  /\bany\s+(?:random\s+)?(?:individual|person|member)\s+(?:from|in)\s+(?:that|this)\b/i,
  // C. 群体/统计来源类 + 个体成员
  /\b(?:people|persons?|individuals?|members?|citizens?|residents?|voters?|workers?|students?|men|women)\s+(?:from|in)\s+(?:that|this)\s+(?:group|country|nation|state|city|region|community|neighborhood|population)\b/i,
  /\b(?:local|domestic|urban|rural|unemployed|poor|low-?income|less-?educated|working-?class)\s+(?:people|persons?|individuals?|residents?|workers?)\b/i,
  // D. 说明/意味着 + 第二人称
  /\b(?:means|suggests|implies|shows|proves|indicates)\s+(?:you|he|she|they)\b/i,
  // E. 个体层结论副词宣告
  /\b(?:individuals?|persons?|people|members?)\s+(?:are|is)\s+(?:also|all|equally|necessarily|bound\s+to|just\s+as)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /生态谬误|生态学谬误|区群谬误|区群偏差|群体水平|个体水平|跨层推断|层次推断|跨层推理|生态推断|群体推断|个体推断|生态相关|个体主义谬误|原子论谬误|区群/,
  /多层模型|多层次模型|分层模型|分层分析|混合效应|随机效应|固定效应/,
  /统计学|统计学家|教材|课堂|教科书|讲座|教案|习题|悖论|论文|文献|方法论|范式|课程|考点|考题/,
];
const EXEMPT_META_EN = [
  /\b(?:ecological\s+fallacy|atomistic\s+fallacy|ecological\s+inference|group\s+level|individual\s+level|person\s+level|cross-?level|multi-?level|hierarchical\s+(?:model|linear)|aggregation\s+bias|ecological\s+correlation|simpson'?s\s+paradox|disaggregat\w+)\b/i,
  /\b(?:statistics|stats|statistician|textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|called|defined|concept|notion|theory|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a|is\s+a\s+common)\b/i,
];

// ─── 豁免二：正确响应形（指出不能跨层推断 + 要求个体层证据）──
// 只收「结论层」的正确响应——「群体数据不能直接推断个体，需要个体层
// 证据」正是本族要教的判别动作。
const EXEMPT_CORRECT_ZH = [
  /不能推断|无法推断|不能直接推断|不能简单推断|不能据此推断|不足以推断|不能从群体|不能由群体|不能把群体|群体数据不能|群体层面不能|推不出个体|推不到个体/,
  /需要个体|需要个体层|需要个人层|需要桥接|需要跨层|需要分层|需要微观/,
  /要区分|须区分|应区分|区分群体|区分个体|分别看待|不可混同|不能混同/,
  /犯了|这就是生态谬误|属于生态谬误|正是生态谬误|构成生态谬误|是生态谬误|典型的生态谬误|即生态谬误/,
  /个体差异|个体差别|个体间差异|个体间差别|异质性|离散程度|方差|标准差|分布不均|参差不齐|差别很大|差异很大/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:cannot|can'?t|could\s+not|should\s+not|must\s+not|unable\s+to)\s+(?:infer|conclude|generalize|extrapolate|attribute|transfer|apply)\b/i,
  /\b(?:does\s+not|doesn'?t|do\s+not|don'?t)\s+(?:imply|mean|entail|justify|license|warrant)\b/i,
  /\b(?:not\s+necessarily|no\s+basis|insufficient\s+evidence|cannot\s+conclude|fallacy)\b/i,
  /\b(?:needs?|requires?|demands?)\s+(?:individual-?level|person-?level|micro-?level|bridging|cross-?level|disaggregat\w+|individual\s+data)\b/i,
  /\b(?:distinguish|separate|differentiate)\s+(?:group|individual|between)\b/i,
  /\b(?:commits?|is|constitutes?|exemplifies?|illustrates?)\s+(?:an?|the)\s+(?:ecological\s+fallacy|atomistic\s+fallacy)\b/i,
  /\b(?:individual|person|between-?person)\s+(?:differences?|variation|variance|heterogeneity|dispersion|spread)\b/i,
  /\b(?:varies|vary|differ(?:s|ent)?)\s+(?:widely|substantially|considerably|greatly)\b/i,
];

// ─── 否定守卫（窗口化：查腿② 命中前的否定标记）────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|怀疑|质疑|警惕|小心|未必是|无从|禁止|切忌/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|beware|careful|doubt\w*|question\w*)\b/i;

// ─── 推理否定/对冲守卫（r215 新增：后置对冲豁免）────────────────
// 「平均工资上调了，但个体涨幅差异很大」这类先立群体统计再承认个体差异
// 的陈述是**正当分层报告**，不是生态谬误——它在做本族要教的判别动作。
const CONCESSION_ZH = /但是|然而|不过|可是|但|却|尽管|虽然|固然|只是|可惜|遗憾的是|需要说明|要补充|另一方面|另一方面看|但个体|但个人|但每个/;
const CONCESSION_EN = /\b(?:but|however|yet|although|though|whereas|while|on\s+the\s+other\s+hand|that\s+said|with\s+the\s+caveat|caveat|except|apart\s+from)\b/i;

// 邻近窗：腿① ↔ 腿②（双向；r214 先例：结论可前置于统计量之前）
const WIN_AGG_IND_ZH = 80;
const WIN_AGG_IND_EN = 200;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表可注入空数组；单正则常量注入替换正则（负例脚本
// 用 /(?!x)x/ 永假式抹掉该腿）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 腿①：取所有命中位置（统计量标记可能多处出现）
function findAggLeg(text, isZh, R) {
  const list = isZh ? (R.AGGREGATE_ZH || AGGREGATE_ZH) : (R.AGGREGATE_EN || AGGREGATE_EN);
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

// 腿②：取腿①邻近窗内、未被否定的首个个体层推断位置（双向配对）
// **r215 纪律**：腿②拆两类——
//   · 连接词腿（A/A2/A3/D/D2，携带「所以/这说明/意味着」等推断语义）：
//     独立成立，允许前置（个体层结论可先于统计量出现，r214 先例）；
//   · 裸指称腿（B/B2/C/C2，「每个X都Y」形）：只在腿①同时命中时
//     才有效——否则良性陈述「每个学生都付出了努力」会被误判。
// 实现：无条件腿先配对；若未命中，再把裸指称腿并入配对。
function findIndLeg(text, isZh, R, aggIdxs) {
  const all = isZh ? (R.INDIVIDUAL_ZH || INDIVIDUAL_ZH) : (R.INDIVIDUAL_EN || INDIVIDUAL_EN);
  // 裸指称腿索引（改这两族序号时同步此常量）
  // ZH: 3=B 每个X都、4=B2 随便挑一个、5=所有人/人人、6=某个成员、
  //     7=C 统计来源人群+断言副词、8=C2 成员裸名词+断言副词、
  //     13=E 个体身上也、14=E2 每个人也（全部不含连接词）
  // EN: 2=every/each individual、3=all individuals、4=a random individual、
  //     5=any individual from、6=people from that group、7=local people
  const BARE_IDX_ZH = [3, 4, 5, 6, 7, 8, 13, 14];
  const BARE_IDX_EN = [2, 3, 4, 5, 6, 7];
  const bareIdx = isZh ? BARE_IDX_ZH : BARE_IDX_EN;
  const win = isZh ? WIN_AGG_IND_ZH : WIN_AGG_IND_EN;
  const pair = (list) => {
    let best = -1, bestDist = Infinity;
    for (const ai of aggIdxs) {
      for (const re of list) {
        const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
        let m;
        while ((m = reG.exec(text)) !== null) {
          const d = m.index - ai;
          if (Math.abs(d) > win) continue;
          // 后置形要求未被否定对冲；前置形（IND 在 AGG 前）跳过该检查——
          // 前置否定词多属「不一定/并非」等对冲本身的一部分
          if (d > 0 && negatedBefore(text, m.index, isZh)) continue;
          if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = m.index; }
          if (m.index === reG.lastIndex) reG.lastIndex++;
        }
      }
    }
    return best;
  };
  const conn = all.filter((_, i) => !bareIdx.includes(i));
  let r = pair(conn);
  if (r >= 0) return r;
  return pair(all);
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkEcologicalFallacy(text, inject) {
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
  // 出现教学/学术框架标记或否定标记（r213 收窄先例）——裸「生态谬误」
  // 出现在实际推断陈述中不豁免。
  const metaZh = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const metaEn = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const META_FRAME_ZH = /教材|课堂|教科书|讲座|教案|习题|悖论|论文|文献|方法论|范式|称为|定义为|概念|所谓|理论|分析中|研究中|课程|教学中|复习|考点|考题|说的是|指的是|书上|课上/;
  const META_FRAME_EN = /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|called|defined|concept|notion|theory|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a|is\s+a\s+common|refers\s+to)\b/i;
  if (anyHit(metaZh, text) || anyHit(metaEn, text)) {
    const hasFrame = META_FRAME_ZH.test(text) || META_FRAME_EN.test(text);
    const hasNeg = NEG_ZH.test(text) || NEG_EN.test(text);
    if (hasFrame || hasNeg) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 正确响应形：指出不能跨层推断并要求个体层证据
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：腿① 群体/聚合层统计量 × 腿② 个体层推断（邻近窗）
  const aggIdxs = findAggLeg(text, isZh, R);
  if (aggIdxs.length > 0) {
    const indIdx = findIndLeg(text, isZh, R, aggIdxs);
    if (indIdx >= 0) {
      // r215 后置对冲守卫：腿② 命中后若紧跟转折/让步从句，且句中没有
      // 第二个未对冲的个体层结论，整句判为分层报告而非生态谬误。
      const indTail = text.slice(indIdx, Math.min(text.length, indIdx + 30));
      const indLead = text.slice(Math.max(0, indIdx - 20), indIdx);
      const conAfter = isZh ? CONCESSION_ZH.test(indTail) : CONCESSION_EN.test(indTail);
      const conBefore = isZh ? CONCESSION_ZH.test(indLead) : CONCESSION_EN.test(indLead);
      if (!conAfter && !conBefore) {
        return {
          hit: true,
          score: 0.6,
          count: 1,
          detail: isZh
            ? '群体/聚合层统计量被直接用于推断个体成员属性(zh)'
            : 'group-level statistic used to infer individual-member attribute(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkEcologicalFallacy,
  __internals: () => ({
    AGGREGATE_ZH, INDIVIDUAL_ZH,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH,
    AGGREGATE_EN, INDIVIDUAL_EN,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN,
  }),
};
