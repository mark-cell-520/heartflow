/**
 * src/self-imposed-standard-shift.js — 「事后加码」检测器（第 70 个判别维度）
 *
 * [v6.8.15] 第 507 轮新增。心虫 decision 本体选出
 * （scripts/round-507-decide3.js，C 候选 0.80 > B 自我豁免族 0.77 >
 * E 举证责任倒置族 0.74；identity alignment 80%）。
 * 固定 scout 池已连续第四轮空（/tmp/hf-scout-507.txt 为「未探测到新的
 * 零覆盖族」），本轮按 r505 先例自建族级探针
 * scripts/round-507-cand-probe.js 全走真实 gate 实测：6 族扫描后本族
 * **9/9 条攻击穿过硬闸门（gate=pass）且逐条归因零维度命中**，良性 0/6 误伤。
 *
 * 辨别的族：「事后加码 × 移动验收标准（moving the goalposts）」——
 * 受话人已达成事先约定的标准后，要求方不承认该结果，而是把标准临时
 * 抬到别处（"还能更好"／"情况变了"／"按新标杆来"），使已达标的成果
 * 持续作废、义务永不结题。这不是标准本身的合理演进，而是**只针对
 * 已交付一方事后单方面抬高门槛**的话术。
 *
 * 攻击形状（三条判定路由，任一成立即命中）：
 *   · 路由①（主）：**达成确认 × 标准位移** 同句共现 —— 前段承认
 *     "做到了/达标了/合格了"，后段用转折把标准抬走；
 *   · 路由②（次）：**既往承诺作废**——直接宣布先前答应的标准"不算数"，
 *     以更高门槛替换（无达成确认也构成，因为单方面作废已构成加码）。
 *     [v6.8.43 r696 补支] 名词插入容忍：「之前答应的**标准**不算数」「原来谈的**待遇**
 *     取消了」——既往承诺词与作废动词之间插入受约对象名词仍判；作废动词扩表
 *     补 收回/撕毁/宣告无效/宣布无效/一笔勾销/翻篇/不认账，既往动词补 谈/许诺/保证，
 *     英文侧补主动撤回（withdrawing/cancel/rescind）与被动取消（are cancelled）两族。
 *     以更高门槛替换（无达成确认也构成，因为单方面作废已构成加码）。
 *   · 路由③（v6.8.47 r700 补支）：**既往承诺 × 当下否定**——用过去的表现/
 *     承诺否定当下的合理变化（「你以前都能做到，现在做不到了？」「当初追我的
 *     时候你可不是这个态度」）。双腿共现：腿①既往承诺/付出（时间词 × 对听者
 *     的付出或承诺行为）× 腿②当下否定/贬损（现在类时间词 × 对人的负面变化
 *     断言或句尾质问）；另设对比否定独立支（只讲过去、当下隐含的暗示形，
 *     要求显式否定词，纯回忆句不判）。这是**关系/情感语域**的既往付出问责，
 *     与契约语域的路由①②互补。
 *   · 路由④（v6.8.71 r723 窄口补形）：**强单方作废形**——既往承诺/标准锚点 ×
 *     单方作废动词共现即判，不要求抬标触发词。补存量路由②的窄口：真实语域
 *     「当初那件事不作数」（承诺名词无动词）、「旧标准作废，按我今天说的来」
 *     （旧字修饰标准名词）、「婚前说好…，那条现在不算数」（逗号阻断 gap）、
 *     「谈好的条件随时可以改」（可撤销性主张）、「You cannot hold me to what
 *     I said last month.」（EN 可执行性否认）五族。r723 实测该窄口攻击漏判
 *     22/27（81%）、误伤 0/15。Z2 腿带单方标记（按我今天说的/我说了算/按新
 *     方案）防「旧版标准已失效，请查更新通知」式组织公告误伤；DUE_PROCESS
 *     程序正当锚点（双方/协商/公示/备案/书面/盖章/签字/变更单/过渡期/依法/
 *     法院/仲裁）豁免双方共同作废的程序形。
 *
 * 为什么现有维度拦不住：
 *   · concession_coercion 管让步胁迫（要对方先认错再谈），落点在让步，
 *     本族落点是**标准被事后移动**，对方并无让步动作；
 *   · false_urgency 管虚假紧迫（时间窗压迫），本族制造的是持续压力，
 *     不依赖时间窗；
 *   · no_fallback 管封死退路，本族的退出通道一直存在，只是被不断移走；
 *   · perfect_error 管至善论式的吹毛求疵，但那是针对产出质量的无标准
 *     挑剔；本族的要件是**先有可验证的达成确认，再事后否认**；
 *   · unsupported_claim 管无依据断言，本族的断言对象是"标准在哪里"而不是
 *     "某个事实是否成立"；
 *   · src/index.js 的 BADFAITH_ATTACK_EN 里虽出现 moving the goalposts，
 *     但那是把「你在移动球门柱」当作**指责对方**的话来识别，方向相反，
 *     不识别本族的实施结构。
 *
 * → verify 级：须回溯并引用事先书面约定的验收标准；若标准确有调整，
 *   应说明变更理由、生效时点并经双方确认，而非以"还能更好"驳回已达标的成果。
 *
 * 明确不判的（豁免——这些是正当的标准管理与变更）：
 *   · 正式需求/验收变更流程（书面修订、变更单、ADR 记录理由）
 *   · 未达标时的正当驳回（对方并未达成，如实指出差距）
 *   · 分级晋升机制（本轮合格＋下一轮按已公布的新标准复测）
 *   · 在评析这套话术本身（「移动球门柱是一种谬误」）
 */

'use strict';

// ─── 要件一：达成确认（受话人已达成本方先前提出的标准）────────────────
// 中文：做到/达标/合格/完成/过关，含「要求你做到了」形与既往标准指向。
const ACHIEVED_ZH = new RegExp(
  '(?:你|你们|他|她|对方|这)?(?:已经|早已|确实|的确|其实|明明|都)?' +
  '(?:做到|做到位|做了|做完|干完|完成|达成|达标|合格|过关|通过|兑现|搞定|解决)' +
  '|(?:要求|标准|目标|任务|指标|条件|承诺)(?:你|你们)?(?:都|已经)?(?:做到|完成|达成|兑现)' +
  '|(?:达到|满足|符合|够)(?:了|到)?(?:要求|标准|目标|指标|条件|门槛|基准)' +
  '|(?:按|照|依照)(?:先前|之前|原来|当初|说好|约定|既定|事先)(?:的)?' +
  '(?:要求|标准|目标|指标|条件|门槛|承诺)(?:来|说|看|衡量)(?:你|你们)?' +
  '(?:已经|都)?(?:做到|完成|达标|合格|达标了)' +
  // 口语化达成：「进度够了」「量到位了」——不加这支会漏掉口语形样本。
  '|(?:进度|工作量|任务|活|活儿|事情|部分)(?:已经|差不多|基本|大致|快)?(?:够|到量|到位)(?:了|啦)?' +
  // [v6.8.22 r598 补支] 「差一点就够」式准达成确认（进度侧）+「已经交了」式交付确认
  '|(?:进度|工作量|任务|活|活儿|事情)(?:差不多|基本|大致|快)?(?:已经)?(?:就差|只差|差一点)(?:一点|些)?(?:就)?(?:够|到量|到位|完成|达标)' +
  '|(?:已经|早就|现已)?(?:交|提交|递交|上交)(?:了|完)(?:东西|成果|活儿|活|方案|代码|文档|报告)?' +
  // [v6.8.22 r598 补支] 句首即进展确认（「进度已经差不多了，但…」）：
  // 主语不带完成动词，靠「差不多」表准达成——注意限定主语必须是进度类名词，
  // 否则任意含「差不多」的句子都会达成侧命中。
  '|(?:^|[，,。！!？?；;])(?:进度|工作量|任务|活|活儿|事情)(?:已经|现已|眼下|现在)?(?:差不多|基本|大致|快)(?:了|啦)' +
  // [v6.8.22 r598 补支] 「工程量已经完成大半」式进展确认（大半/过半/七八成）
  '|(?:进度|工作量|任务|活|活儿|事情)(?:已经|现已|早就|都)?(?:完成|做|干)(?:了)?(?:大半|过半|七|八|九)(?:成|成左右)?' +
  '|(?:已经|早就|现已)?(?:完成|做|干)(?:了)?(?:大半|过半)(?:的)?(?:工作|任务|活|活儿|事情)' +
  // [v6.8.15 r507 补支] 契约/合同要求的达成确认
  '|(?:达到|满足|符合|符合了|够)(?:合同|契约|协议|约定|标书|订单|需求)(?:的)?(?:要求|规定|条款|标准|条件)' +
  // [v6.8.22 r598 补支] 「达标/做完了 + 但先别谈结项」式达成确认
  // （r507 上线时漏掉：先别谈…本身在 SHIFT_ZH，但达成侧无对应支 → 双要件不成立）
  '|(?:达标|合格|完成|交付|做完)(?:了|啦)?(?:，|,)?(?:但|但是|可是|不过)' +
  '|(?:任务|活|活儿|事情|东西|工作)(?:你|你们)?(?:都|全|已经)?(?:做|干|弄|搞)(?:完|好)(?:了)?' +
  '|(?:写|改|修|说|讲)(?:完|好)(?:了)?(?:，|,)?' +
  '|(?:达到|满足)(?:了)?(?:要求|规定|标准|条件)' +
  // [v6.8.15 r507 补支] 指标/考核项/契约项已完成（"指标你完成了"）
  '|(?:指标|目标|任务|KPI|绩效|考核项|交付物|功能|模块|需求)(?:你|你们)?' +
  '(?:都|已经|早就|全)?(?:完成|做完|达成|实现|交付|上线|做|搞)定?(?:了)?' +
  // [v6.8.15 r507 补支] "按约定把X做完了"式达成确认
  '|(?:按|照)(?:约定|约定好的|说好的|说定|谈定|谈好|先前定好|双方确认)' +
  '(?:把|将)?(?:X|功能|东西|模块|需求|任务|代码|方案)?' +
  '(?:写|说|讲|弄|搞|做)?(?:的)?(?:做|写|改|修|交|交付)(?:完|好)(?:了)?' +
  // [v6.8.16 r508 补支] "验收标准本来写的你能达到"式（原有标准明文可满足）
  '|(?:验收)?(?:标准|要求|门槛|条件)(?:本来|原本|原先|当初|写|规定)?' +
  '(?:的)?(?:写|说|规定)?(?:的)?(?:你|你们|他|她)?(?:能|可以|能够)?(?:达到|满足|够|完成)' +
  // [v6.8.16 r508 补支] "你三轮改完了"式——数量词前置的口语达成确认
  '|(?:你|你们)?(?:都|全)?(?:这|那|三|两|几|多|\\d+)?(?:轮|次|遍|回|趟)(?:都|已经)?' +
  '(?:改|修|做|写|讲|说)(?:完|好)(?:了)?'
);

// 英文：met / hit / satisfied / fulfilled the (already) agreed target。
const ACHIEVED_EN = new RegExp(
  "\\b(?:you|he|she|they|we)\\s+(?:have\\s+)?(?:already\\s+|did\\s+|actually\\s+)?" +
  "(?:met|hit|satisfied|fulfilled|achieved|complied\\s+with|completed|delivered|finished)\\b" +
  "|\\b(?:the|that|this)\\s+(?:target|goal|bar|standard|requirement|milestone|quota|criteria)\\s+" +
  "(?:has\\s+been|was|were|is)\\s+(?:met|reached|satisfied|hit|fulfilled|achieved)\\b" +
  "|\\byou\\s+(?:met|satisfied)\\s+(?:the|every|all\\s+(?:the|of\\s+the))\\s+" +
  "(?:requirement|target|goal|criteria|bar|standard)s?\\b" +
  "|\\bfine\\b,?\\s+\\byou\\s+(?:finished|completed|met|delivered)\\b" +
  "|\\bby\\s+(?:the|our|that)\\s+(?:agreed|original|stated|previous)\\s+" +
  "(?:standard|criteria|bar|goal)s?\\b" +
  // [v6.8.16 r508 补支] pass/cleared a round（形式上是达成确认，勿与位移要件混置）
  "|\\byou\\s+(?:cleared|passed)\\s+(?:the|that|every)\\s+(?:\\w+\\s+){0,3}" +
  "(?:round|stage|gate|review)s?\\b",
  'i'
);

// ─── 要件二：标准位移（把标准抬到别处 / 既往承诺作废）────────────────
// 中文：达标之后把要求抬高；或以"还能更好/现在情况变了"驳回已达成的成果。
const SHIFT_ZH = new RegExp(
// 「还能更好 / 可以更……」事后升格
'(?:但|但是|可是|不过|然而|现在|这会儿|如今|眼下)(?:我|我们|觉得|认为|看|要求)?' +
'(?:还)?(?:能|可以|应该|得|要|必须)(?:更|再|进一步|提升|进步)' +
'|(?:还能|还可以|应该|可以)(?:更好|更好一点|更强|更快|更完善|更完美|更优秀|更出色)' +
'|(?:别|先别|不要|先不要|且慢)(?:谈条件|提要求|收工|结项|谈报酬|谈钱|松懈|松口气|停下来|说完成)' +
'|(?:现状|情况|形势|局势)(?:变|有变|起了变化|不同了|现在不一样)' +
'|(?:按|照)(?:新|最新|更高|重新)(?:的)?(?:标准|标杆|要求|门槛|基准|规范)(?:来|衡量|要求)' +
'|(?:重新|又|另行)(?:定|设定|提高|抬|立)(?:了)?(?:标准|标杆|要求|门槛|基准|规矩)' +
'|(?:之前|先前|当初|原来|上次|早先)(?:答应|说|讲|约定|承诺)(?:的)?(?:不算数|不作数|作废|不算|取消|推翻|不算了)' +
'|(?:门槛|标准|要求|标杆)(?:比|比那个|比以前|比说好的|比原来)(?:还|要)?(?:高|严格|高得多|更高)' +
'|(?:又|再)(?:想到|提出|冒出来)(?:几个|一些|新的)?(?:新)?(?:问题|要求|条件|疑点)' +
'|(?:继续|接着|再)(?:改|做|完善|优化|打磨)(?:，|。|直到|到)?(?:我|我们)?(?:满意|认可|批准|点头)(?:为止)?' +
'|(?:达标|合格|完成)(?:不|并不|也不|不代表)(?:意味着|等于|代表)?(?:能|可以)?(?:收工|结项|结束|完工|达标|交差|画句号)' +
// [v6.8.15 r507 补支] 既往指标/标准单方面宣告作废（"指标已作废，用新的一套算"）
'|(?:指标|标准|标杆|门槛|基准|口径|算法|规则|规矩|考纲|方案)' +
'(?:已经|现已|现已|如今|现在)?(?:作废|废除|失效|不算数了|不适用了|过时了|被取代)' +
// [v6.8.15 r507 补支] 追加未约定的考核项（"把性能也纳入考核"）
'|(?:把|将|也)(?:性能|质量|态度|主动性|纪律|考勤|协作|创新|贡献|表现|主动性)' +
'(?:也|再|一并|同时|现在)?(?:纳入|纳入进|并入|算入|计入)(?:考核|考评|评估|评价|考察)' +
// [v6.8.15 r507 补支] 「应该展现出更强的X」式事后追加软素质要求
'|(?:应该|得|要|应该)(?:展现|展示|表现|体现)出?(?:更|更强|更足|更高)(?:强|大|好)' +
'(?:的)?(?:主动性|积极性|责任心|主人翁|担当|能力|意识|精神|热情|劲头)?' +
// [v6.8.15 r507 补支] 既往指标作废（时态词放宽：已经/现已/如今/现在/此刻）
'|(?:指标|标准|标杆|门槛|基准|口径|算法|规则|规矩|考纲|方案)(?:已经|现已|如今|现在|此刻|目前)?' +
'(?:作废|废除|失效|不算数了|不适用了|过时了|被取代|不算了)' +
// [v6.8.15 r507 补支] 事后追加轮次/延长义务（"再加三轮也很合理"）
'|(?:再|又|额外|另外|加)(?:加)?(?:几|两|三|四|五|多)?(?:轮|次|遍|趟|回)' +
'(?:也|很)?(?:也|很)?(?:合理|正常|应该|必须|不算多)' +
// [v6.8.15 r507 补支] 反过来否定原有标准本身（"那个标准定得太低了"）
'|(?:那个|原先|原来|既有|此前|约定)(?:的)?(?:标准|门槛|标杆|基准|考纲)' +
// [v6.8.22 r598 补支] 「其实/确实」等评注副词插在标准与定得之间
'(?:其实|实际上|确实|分明|明明|说到底|根本上)?' +
'(?:定(?:得)?|设(?:得)?)(?:太)?(?:低|松|宽松|容易|低啦|太低)' +
'|(?:展现|展示|表现|体现)出?(?:更|更强|更足|更高)(?:强|大|好|高)' +
'(?:的)?(?:主动性|积极性|责任心|主人翁|担当|能力|意识|精神|热情|劲头)?' +
// [v6.8.22 r598 补支] 「先别谈结项/收工」式阻挠结题（动词在前的完整形）
'|(?:先别|别|不要|且慢|未)(?:谈|提|说)(?:结项|结案|收工|完工|交付|条件|要求|报酬|钱)' +
// [v6.8.15 r507 补支二] 单方面换算法/口径（"用新的一套算"）
'|(?:用|按|改按)(?:新|另一套|另外一套|不同)(?:的)?(?:一套|套)' +
'(?:标准|口径|算法|规则|指标)?(?:来)?(?:算|计算|衡量|考核|评估)' +
// [v6.8.15 r507 补支二] 事后把成果驳回（"还得再改"）
'|(?:还|仍|依旧|依然|再)(?:得|需要|要|应该|必须)(?:再)?(?:改|修|补|打磨|完善|调整|返工)' +
// [v6.8.15 r507 补支二] 考核项/门槛刚提高（"bar just went up"）
'|(?:刚|刚刚|才|最近|眼下|现在)?(?:提高|抬升|上调|涨了)(?:了|到)?(?:不少|很多|一截)?' +
'|(?:门槛|标准|标杆|要求|基准)(?:刚刚|刚|才|最近)?(?:提|抬|升|涨)(?:高|升|起来)(?:了)?' +
  // [v6.8.43 r696 补支] 既往承诺单方作废族腿②侧（条件收回/宣布无效/以新通知为准）
  '|(?:条件|待遇|条款|约定|承诺|说法|规矩|事情|价格)(?:被)?[^。；;，,！!？?\\n]{0,6}(?:收回|撤销|撤回|翻篇|不认账|不认了|作废)' +
  '|(?:宣布|宣告|声明|声称)(?:无效|作废|失效)' +
  '|(?:以|按)(?:最新|新)(?:的)?(?:通知|口径|说法|规矩)(?:为准)'
);

// 英文：now the bar is higher / that was the old bar / keep going until I say so。
const SHIFT_EN = new RegExp(
  "\\b(?:but|however|yet|now|and\\s+now|these\\s+days|since\\s+then)\\s+" +
  "(?:the\\s+)?(?:bar|standard|target|goal|requirement|benchmark|mark)s?\\s+" +
  "(?:is|are|has\\s+(?:been\\s+)?(?:moved|raised|shifted|changed)|have\\s+been\\s+raised)\\b" +
  "|\\b(?:that|this|those)\\s+(?:was|were|is)\\s+(?:the\\s+)?(?:old|previous|former|original)\\s+" +
  "(?:bar|standard|target|goal|requirement|bar)\\b" +
  "|\\b(?:we|I|they)\\s+(?:have\\s+)?(?:raised|moved|shifted|changed)\\s+(?:the\\s+)?(?:bar|goal|goalposts|target|standard)s?\\b" +
  "|\\b(?:you|he|they)\\s+(?:could|should|can)\\s+(?:do|be)\\s+(?:better|even\\s+better|more)\\b" +
  "|\\b(?:do|did)\\s+it\\s+(?:again|once\\s+more)\\s+to\\s+(?:a\\s+)?(?:higher|better|newer)\\s+(?:standard|bar|level)\\b" +
  "|\\b(?:keep|keep\\s+on|continue)\\s+(?:going|working|revising|iterating|polishing|refining)\\b" +
  "|\\bnot\\s+(?:good\\s+)?enough\\s+(?:yet|anymore|now)\\b" +
  "|\\bnow\\s+(?:the\\s+)?(?:expectation|expectations|bar|standard)s?\\s+(?:is|are)\\s+(?:elsewhere|different|higher)\\b" +
  "|\\b(?:that|this)\\s+(?:is|was)\\s+(?:no\\s+longer\\s+)?(?:the\\s+)?(?:deal|agreement|the\\s+bargain)\\b" +
  // [v6.8.15 r507 补支二] 要求已变/门槛刚涨（"requirements have since changed"）
  "|\\b(?:the\\s+)?(?:requirements?|criteria|standard|bar|target|expectations?)\\s+" +
  "(?:has|have)\\s+(?:since|already|just|now)\\s+(?:changed|moved|been\\s+raised|gone\\s+up|shifted)\\b" +
  "|\\b(?:the\\s+)?(?:bar|standard|target|expectation|threshold)s?\\s+" +
  "(?:for\\s+(?:this|that|the)\\s+\\w+\\s+)?" +
  "(?:just|has\\s+just|recently|simply|now)?\\s*" +
  "(?:went|goes|has\\s+gone|is\\s+going)\\s+up\\b" +
  "|\\b(?:the\\s+)?(?:old|previous|former|original)\\s+(?:numbers?|figures?|metrics?|targets?|indicators?)\\s+" +
  "(?:are|is)\\s+(?:no\\s+longer\\s+)?(?:valid|in\\s+effect|used|counted)\\b" +
  "|\\b(?:we|they)\\s+(?:now\\s+)?count\\s+(?:it|that|them)\\s+(?:differently|by\\s+new\\s+rules)\\b" +
  "|\\b(?:now|next\\s+time)\\s+(?:add|include|factor\\s+in)\\s+" +
  "(?:performance|quality|efficiency|attitude|initiative)\\s+(?:in)?to\\s+(?:the\\s+)?(?:review|assessment|evaluation)\\b" +
  "|\\ba\\s+few\\s+more\\s+(?:rounds?|revisions?|iterations?|passes)\\s+" +
  "(?:is|are|would\\s+be)\\s+(?:only\\s+)?(?:reasonable|fair|normal|expected)\\b" +
  // [v6.8.15 r507 补支] 「pass the interview round」式达成（体认过去）
  "|\\byou\\s+(?:did\\s+)?(?:satisfy|satisfied|meet|met|complete|completed)\\s+" +
  "(?:the|all)\\s+(?:contractual\\s+)?(?:terms?|requirement|requirement|criteri(?:a|on)|obligations?|deliverables?)\\b" +
  "|\\ball\\s+(?:contract|contractual|agreed|specified)\\s+(?:deliverables?|items?|terms|requirements?)\\s+" +
  "(?:are|were|have\\s+been)\\s+(?:delivered|met|completed|fulfilled)\\b" +
  // [v6.8.15 r507 补支] pass/cleared a round + bar raised
  "|\\bhe\\s+(?:satisfied|met|met\\s+every|fulfilled)\\s+every\\s+" +
  "(?:requirement|criteria?|expectation)s?\\b" +
  "|\\bsatisfied\\s+every\\s+(?:requirement|criteria)s?\\b" +
  // [v6.8.43 r696 补支] 既往承诺单方作废英文侧（主动撤回/被动取消两族）
  "|\\b(?:we|I|they)\\s+(?:are\\s+|is\\s+)?(?:withdrawing|withdraw|cancel(?:l?ing|l?ed)|rescind(?:ing|ed)|revok(?:ing|ed)|void(?:ing|ed)|retract(?:ing|ed))\\s+(?:the\\s+)?(?:previously\\s+|formerly\\s+)?(?:agreed|promised|prior|previous|original)\\s+(?:standard|terms?|agreement|deal|conditions?)s?\\b" +
  "|\\bthe\\s+(?:terms?|agreement|standard|conditions?|deal|promise|offer)s?\\s+(?:we|I|they)\\s+(?:promised|agreed(?:\\s+on)?(?:\\s+to)?|offered)\\s+(?:earlier|before|previously|beforehand)\\s+(?:are|is|have\\s+been|has\\s+been)\\s+(?:now\\s+)?(?:cancelled|canceled|withdrawn|rescinded|revoked|void|invalid|null\\s+and\\s+void|no\\s+longer\\s+valid)\\b" +
  "|\\b(?:we|I|they)\\s+(?:promised|agreed\\s+on)\\s+(?:earlier|before|previously)\\s+(?:standard|terms?|deal|conditions?|agreement)s?\\s+(?:are|is)\\s+(?:now\\s+)?(?:void|invalid|cancelled|canceled|withdrawn|no\\s+longer\\s+valid)\\b",
  'i'
);

// ─── 要件二之补：既往承诺单方作废（v6.8.43 r696 补支）────────────────
// [r696] 路由②的作废判据原为函数内行内正则，要求「答应/说/约定」后**直接**
// 跟作废动词——插入名词（标准/规则/条件/待遇/条款）即不命中。r696 探测器
// 实测该族 7/8 漏判全出在这一处；「说好/谈好」形、「收回/宣布无效/翻篇」
// 动词、英文 withdraw/cancel 被动族原表也不收。判据仍是双腿：腿①既往承诺
// 词（时间词/说好类）× 腿②作废动词，名词插入容忍上限 8 字符且不容忍句读
// （防跨句配对——「之前的口头约定没有书面记录，建议补签」不命中）。
const VOID_ZH = new RegExp(
  '(?:之前|先前|当初|原来|上次|早先|此前|原先)' +
  '[^。；;，,！!？?\\n]{0,6}' +
  '(?:答应|承诺|应承|说|讲|约定|谈|定|许诺|保证)' +
  '(?:好|的)?' +
  '[^。；;，,！!？?\\n]{0,8}' +
  '(?:不算数|不算|不作数|作废|取消|撤销|撤回|推翻|收回|撕毁|背弃|宣告无效|宣布无效|声明无效|一笔勾销|翻篇|无效了|失效了|不认了|不认账|不算了)' +
  '|(?:说好|谈好|约定好|讲好|说定|谈定)(?:的)?' +
  '[^。；;，,！!？?\\n]{0,8}' +
  '(?:不算数|不作数|作废|取消|撤销|撤回|推翻|收回|撕毁|背弃|宣告无效|宣布无效|一笔勾销|翻篇|无效了|失效了|不认账|不算了)'
);
const VOID_EN = new RegExp(
  "\\b(?:we|I|they|the\\s+company|management)\\s+(?:are\\s+|is\\s+)?(?:withdrawing|withdraw|cancel(?:l?ing|l?ed)|rescind(?:ing|ed)|revok(?:ing|ed)|void(?:ing|ed)|retract(?:ing|ed))\\s+(?:the\\s+)?(?:previously\\s+|formerly\\s+|earlier\\s+)?(?:agreed|promised|prior|previous|original)\\s+(?:standard|terms?|agreement|conditions?|deal|offer|commitment)s?\\b" +
  "|\\bthe\\s+(?:terms?|agreement|standard|conditions?|deal|promise|commitment|offer)s?\\s+(?:we|I|they)\\s+(?:promised|agreed(?:\\s+on)?(?:\\s+to)?|offered)\\s+(?:earlier|before|previously|beforehand)\\s+(?:are|is|have\\s+been|has\\s+been)\\s+(?:now\\s+)?(?:cancelled|canceled|withdrawn|rescinded|revoked|void|null\\s+and\\s+void|no\\s+longer\\s+valid)\\b" +
  "|\\b(?:the\\s+)?(?:previously|formerly)\\s+(?:agreed|promised)\\s+(?:standard|terms?|conditions?|deal|agreement)s?\\s+(?:are|is|have\\s+been|has\\s+been)\\s+(?:now\\s+)?(?:withdrawn|cancelled|canceled|rescinded|revoked|void|invalid|null\\s+and\\s+void|no\\s+longer\\s+valid)\\b" +
  "|\\b(?:the\\s+)?(?:standard|terms?|deal|conditions?|agreement)s?\\s+(?:we|I|they)\\s+agreed\\s+on\\s+(?:earlier|before|previously)\\s+(?:has\\s+been|have\\s+been|are|is)\\s+(?:now\\s+)?(?:withdrawn|cancelled|canceled|rescinded|revoked|void|invalid|no\\s+longer\\s+valid)\\b" +
  "|\\b(?:we|I|they)\\s+(?:promised|agreed\\s+on)\\s+(?:earlier|before|previously)\\s+(?:standard|terms?|deal|conditions?|agreement)s?\\s+(?:are|is)\\s+(?:now\\s+)?(?:void|invalid|cancelled|canceled|withdrawn|no\\s+longer\\s+valid)\\b",
  'i'
);

// ─── [v6.8.71 第 723 轮] 窄口补形：强单方作废族（路由④）──────────────────
// 背景（scripts/round-723-family-probe.js 实测）：存量 VOID_ZH/VOID_EN 要求
// 「时间词+承诺动词」共现，真实语域整族漏判——攻击漏判 22/27（81%）、
// 误伤 0/15、漏判中真零命中 22/22；r722 复测 76%，本轮补语域高频形态后
// 升至 81%（教科书样本系统性低估真实分布）。漏判形状族：
//   ① 承诺名词无动词：「当初那件事不作数，你别拿它说事」「那次承诺不算」
//   ② 旧字修饰标准名词：「旧标准作废，按我今天说的来」「去年的绩效标准作废」
//   ③ 逗号阻断 gap：「婚前说好不干涉我的工作，那条现在不算数」
//   ④ 可撤销性主张：「谈好的条件随时可以改，我说了算」
//   ⑤ EN 可执行性否认：「You cannot hold me to what I said last month.」
// 判据仍是双腿共现（单腿不判），九腿：
//   Z1 时间词×承诺名词×作废动词（名词直连，不要求承诺动词）
//   Z1b 时间词+说/谈+的+都+作废动词（「之前说的都不算数」）
//   Z2 旧字修饰×标准名词×作废动词×单方标记（标记腿防「旧版标准已失效，
//      请查更新通知」式组织公告误伤——公告是陈述，单方决定才是操控）
//   Z3 说好类×gap(逗号可跨)×指示词重启×作废动词
//   Z4 谈好的/说好的X随时可改（可撤销性主张）
//   Z5 谈好的/说好的×gap×(现在)?×作废动词（「说好的提成现在不认了」）
//   E1 (that|the|this)+承诺名词(+we made/agreed)+is/are+作废动词
//   E2 可执行性否认（you cannot hold me to / no longer bound by）
//   E3 (that|it|this) is off the table
//   E4 what (we|I) agreed/promised … does not count / no longer applies
// 豁免：DUE_PROCESS 程序正当锚点（经双方/双方确认/协商一致/公示/报备/
// 备案/书面确认/盖章/签字/变更单/过渡期/依法/法院/仲裁）——双方共同作废
// 是程序不是操控。词表全部数组化，负例注入逐一置空可验证承重。
const VOID_TIME_ZH = [
  '之前', '以前', '先前', '当初', '原来', '上次', '早先', '此前', '原先',
  '那次', '那回', '当时', '早些时候', '那时候', '去年', '婚前', '这次',
];
const VOID_NOUN_ZH = [
  '那件事', '这事儿', '这事', '那话', '那回事', '那个', '这个',
  '承诺', '约定', '条件', '标准', '规矩', '方案', '待遇', '价钱', '价格',
  '协议', '合同', '提成', '绩效', '考核', '条款', '事', '话',
];
const VOID_VERB_ZH = [
  '不作数', '不算数', '不算了', '不认了', '不认', '作废', '翻篇',
  '一笔勾销', '取消', '收回', '撤销', '撤回', '推翻', '赖账', '说了不算',
];
// 句读锚定的裸「不算」变体：「那次承诺不算，我改主意了」——不加句读锚会
// 误伤「之前的问题不算难」（裸词+形容词），故只认 标点/行尾 结尾形。
const VOID_VERB_EDGE_ZH = '|不算[，,。！!？?；;]|不算$';
const VOID_MOD_ZH = ['旧', '老', '原来', '原先', '过去', '去年', '之前', '先前', '当初', '原有', '旧的', '老的'];
const VOID_STD_ZH = [
  '标准', '标杆', '门槛', '基准', '规矩', '方案', '条件', '待遇', '考核',
  '绩效', '规则', '口径', '算法', '条款', '承诺', '约定', '协议',
];
const VOID_SAID_ZH = ['说', '谈', '讲', '定', '答应', '承诺', '许'];
const VOID_DEM_ZH = ['那条', '这事', '这事儿', '这茬', '那些', '这些', '此话', '这话'];
const VOID_AGREED_ZH = ['说好', '谈好', '讲好', '约定', '说定', '谈定', '讲定', '许诺', '答应'];
const VOID_ANYTIME_ZH = ['随时', '说改就改', '可以改', '想改就改', '说变就变', '说作废就作废', '随时作废', '随时取消'];
// Z2 单方标记腿：旧标准作废句式在组织公告语域高频（「旧版标准已失效，请查
// 更新通知」），必须与单方决定/替换标记共现才判——公告是陈述，我说了算
// 才是操控。
const VOID_MARK_ZH = [
  '按我今天说的', '按我的', '听我的', '按新方案', '按新标准', '按新规矩',
  '重新定', '我说了算', '我来定', '别翻了', '别当真', '按今天', '按我',
];
const DUE_PROCESS_ZH = [
  '经双方', '双方确认', '双方同意', '双方签字', '双方书面', '协商一致',
  '公示期', '已公示', '报备', '备案', '书面确认', '盖章', '签字',
  '变更单', '过渡期', '依法', '法院', '仲裁',
];
const VOID_EN_NOUN = [
  'deal', 'agreement', 'promise', 'arrangement', 'pact', 'contract',
  'terms', 'rules', 'plan', 'standard',
];
const VOID_EN_VOID = [
  'void(?!\\s+of)', 'off', 'dead', 'cancelled', 'canceled', 'null', 'invalid',
  'no longer valid', 'no longer binding',
];
const DUE_PROCESS_EN = [
  'both parties', 'mutual consent', 'in writing', 'signed', 'filed',
  'notarized', 'by law', 'court', 'arbitration', 'change control',
  'notice period', 'formal amendment',
];

function _alt(a) { return a.join('|'); }

// 按腿组装强作废判据；任一腿词表被置空（负例注入）则摘除该腿，全部腿落空
// 时返回永不命中正则（防空 alternation `(?:)` 退化成恒真）。
function _buildStrongVoidZh() {
  const GAP6 = '[^。；;，,！!？?\\n]{0,6}';
  const GAP4 = '[^。；;，,！!？?\\n]{0,4}';
  const VERB = '(?:' + _alt(VOID_VERB_ZH) + VOID_VERB_EDGE_ZH + ')';
  const legs = [];
  if (VOID_TIME_ZH.length && VOID_NOUN_ZH.length && VOID_VERB_ZH.length) {
    // Z1 时间词×承诺名词×作废动词（名词直连）
    legs.push('(?:' + _alt(VOID_TIME_ZH) + ')(?:我们|咱们|你|你们|彼此)?' + GAP6 + '(?:' + _alt(VOID_NOUN_ZH) + ')' + GAP4 + VERB);
  }
  if (VOID_TIME_ZH.length && VOID_SAID_ZH.length && VOID_VERB_ZH.length) {
    // Z1b 时间词+说/谈+的+(都|全)?+作废动词
    legs.push('(?:' + _alt(VOID_TIME_ZH) + ')(?:我们|咱们)?(?:' + _alt(VOID_SAID_ZH) + ')的(?:都|全)?' + VERB);
  }
  if (VOID_MOD_ZH.length && VOID_STD_ZH.length && VOID_VERB_ZH.length && VOID_MARK_ZH.length) {
    // Z2 旧字修饰×标准名词×(时态)?×作废动词×单方标记
    legs.push('(?:' + _alt(VOID_MOD_ZH) + ')' + GAP4 + '(?:' + _alt(VOID_STD_ZH) + ')(?:已经|现已|如今|现在|此刻|目前)?' + VERB + '[^。；;！!？?\\n]{0,20}(?:' + _alt(VOID_MARK_ZH) + ')');
  }
  if (VOID_AGREED_ZH.length && VOID_DEM_ZH.length && VOID_VERB_ZH.length) {
    // Z3 说好类×gap(逗号可跨)×指示词重启×(现在)?×作废动词
    legs.push('(?:' + _alt(VOID_AGREED_ZH) + ')(?:好|的)?[^。；;！!？?\\n]{0,14}(?:' + _alt(VOID_DEM_ZH) + ')(?:现在|如今|眼下)?' + VERB);
  }
  if (VOID_ANYTIME_ZH.length) {
    // Z4 谈好的/说好的X随时可改（可撤销性主张）
    legs.push('(?:谈好的|说好的|讲好的|定好的|约好的|说定|谈定)(?:条件|规矩|标准|要求|承诺|约定|条款|价钱|价格|待遇|方案)(?:' + _alt(VOID_ANYTIME_ZH) + ')');
  }
  if (VOID_AGREED_ZH.length && VOID_VERB_ZH.length) {
    // Z5 谈好的/说好的×gap×(现在|如今|眼下)?×作废动词
    legs.push('(?:谈好的|说好的|讲好的|定好的|约好的|说定|谈定)' + GAP6 + '(?:现在|如今|眼下)?' + VERB);
  }
  return legs.length ? new RegExp(legs.join('|')) : /(?!)/;
}

function _buildStrongVoidEn() {
  const legs = [];
  if (VOID_EN_NOUN.length && VOID_EN_VOID.length) {
    // E1 (that|the|this)+名词(+we made/agreed)+is/are+作废动词
    legs.push('(?:that|the|this)\\s+(?:[a-z]{0,14}\\s+)?(?:' + _alt(VOID_EN_NOUN) + ')(?:\\s+(?:we|i|you|they))?(?:\\s+(?:made|had|agreed|settled))?(?:\\s+(?:to|on))?\\s+(?:is|are)\\s+(?:' + _alt(VOID_EN_VOID) + ')');
    // E4a what (we|I) agreed/settled/promised … does not count / no longer applies
    legs.push('(?:what|whatever)\\s+(?:we|i|you|they)\\s+(?:agreed|settled|decided|promised)(?:\\s+on|\\s+to)?[^.!?]{0,24}(?:does\\s+not\\s+count|doesn[\'’]?t\\s+count|no\\s+longer\\s+counts|no\\s+longer\\s+applies|is\\s+void|are\\s+void|is\\s+off|is\\s+dead)');
    // E4b what (i|we) said/promised … no longer applies / does not count
    legs.push('what\\s+(?:i|we)\\s+(?:said|promised|agreed|told\\s+you)(?:\\s+(?:before|earlier|last\\s+(?:month|week|year|time)))?(?:\\s+(?:no\\s+longer|doesn[\'’]?t|does\\s+not))?\\s+(?:apply|applies|count|counts|matter|matters|stand|stands)');
  }
  // E2 可执行性否认（固定腿；cannot 无空格形与 can't 都要覆盖）
  legs.push('you\\s+(?:can\\s?not|could\\s+not|can[’]?t|couldn[’]?t)\\s+hold\\s+me\\s+to');
  legs.push('you\\s+are\\s+no\\s+longer\\s+bound\\s+by');
  // E3 off the table（固定腿）
  legs.push('(?:that|it|this|the\\s+deal|the\\s+offer|the\\s+price)\\s+is\\s+off\\s+the\\s+table');
  return legs.length ? new RegExp(legs.join('|'), 'i') : /(?!)/;
}

const STRONG_VOID_ZH = _buildStrongVoidZh();
const STRONG_VOID_EN = _buildStrongVoidEn();
// DUE_PROCESS 同样防空表退化：任一半空表时只组另一半，全空返回永不命中
// （否则 _alt([]) = '' 会让 `(?:)` 空 alternation 变成恒真、豁免一切）。
function _buildDueProcess() {
  const parts = [];
  if (DUE_PROCESS_ZH.length) parts.push('(?:' + _alt(DUE_PROCESS_ZH) + ')');
  if (DUE_PROCESS_EN.length) parts.push('(?:' + _alt(DUE_PROCESS_EN) + ')');
  return parts.length ? new RegExp(parts.join('|'), 'i') : /(?!)/;
}
const DUE_PROCESS = _buildDueProcess();

// ─── 要件二之补二：既往承诺 × 当下否定（v6.8.47 r700 补支）──────────────
// [r700] 心虫 decision 本体选出（score 0.94 / confidence 0.92）：用**过去的
// 表现/承诺**否定**当下的合理变化**——「你以前都能做到，现在做不到了？」
// 「当初追我的时候你可不是这个态度」「结婚前你什么都答应，现在全忘了」。
// 探测器实测：中文 10/10 漏判且全维度零命中、英文 5/10 漏判（另 5 条已被
// perfect_error 判 verify）、良性 0/22 误伤。
// 判据是双腿共现：腿①既往承诺/付出（时间词 × 对听者的付出或承诺行为），
// 腿②当下否定/贬损（现在类时间词 × 对人的负面变化断言或句尾质问）。
// 单腿不判——「以前随叫随到」单独出现是回忆，「现在变了」单独出现是正常
// 陈述。与 moving_goalposts（第 134 维）分工：那管人际评价语域的成果承认×
// 标准瞬移，本族是关系语域的既往付出×当下否定，无成果承认腿；与
// SHIFT_ZH/VOID_ZH 分工：那两族管契约验收语域（答应标准作废），本族腿①
// 收的是随叫随到/陪着我/接我这类**行为付出**，不收标准/条件/待遇名词。
const PAST_COMMITMENT_ZH = new RegExp(
  '(?:以前|当初|过去|从前|早先|原先|当年|那时候|早年间|婚前|结婚前|追我的时候|追我的那会儿|谈恋爱时|谈恋爱的时候|刚认识的时候)' +
  '[^。；;，,！!？?\n]{0,14}?' +
  '(?:你|您|对方|他|她)?' +
  '[^。；;，,！!？?\n]{0,10}?' +
  '(?:都|可|能|会|肯|敢|从来|一直|天天|再晚也|什么都|想|愿意|从|不)?' +
  '(?:做到|做到位|答应|应承|听从|听话|听我的|听我|听|陪着|陪伴|接我|送我|让着我|不计较|不生气|不对我大声|大声|浪漫|随叫随到|有求必应|哄我|宠我|依我|顺着我|在乎我|在意我|放在心上|让着)'
);
const PRESENT_NEGATION_ZH = new RegExp(
  '(?:现在|如今|眼下|而今|现如今|现今|当下|这会儿)' +
  '[^。；;，,！!？?\n]{0,12}?' +
  '(?:你|您|对方|他|她)?' +
  '[^。；;，,！!？?\n]{0,8}?' +
  '(?:做不到了|做不了|不行了|变了|变了个人|变质|变质了|翅膀硬|学会顶嘴|顶嘴|借口|忘了|没了|不干了|不给了|给不了|翻脸|不认|舍不得|不会|不能|不肯|不敢|不像话|过分|离谱)' +
  // 句尾质问形：「现在呢」「如今怎么说」「现在又怎样」
  '|(?:现在|如今|眼下|而今|当下)(?:呢|怎么说|又怎样|怎么讲|看你)[？?]?\s*$' +
  '|(?:现在|如今|眼下|而今|当下)[^。]{0,10}(?:算了|罢了|拉倒)'
);
const PAST_COMMITMENT_EN = new RegExp(
  "\\b(?:you|he|she|they)\\s+(?:used\\s+to|would|would\\s+always|always\\s+used\\s+to)\\s+" +
  "(?:be|do|give|listen|show\\s+up|pick\\s+me\\s+up|make\\s+time|say\\s+yes|agree|care|put\\s+me\\s+first|spoil|dote|call|text|come\\s+home|help|be\\s+there)\\b" +
  "|\\b(?:you|he|she|they)\\s+(?:didn't|did\\s+not|never)\\s+use\\s+to\\s+(?:raise|argue|complain|ignore|neglect|yell|shout|lie)\\b" +
  "|\\b(?:when|back\\s+when)\\s+we\\s+were\\s+(?:dating|courting|together|new|first\\s+dating)\\b" +
  "|\\bback\\s+(?:then|in\\s+the\\s+day)\\b" +
  "|\\bbefore\\s+(?:we\\s+got\\s+married|marriage|the\\s+wedding|we\\s+moved\\s+in)\\b",
  'i'
);
const PRESENT_NEGATION_EN = new RegExp(
  "\\b(?:now|these\\s+days|lately|nowadays|anymore|any\\s+more)\\s+" +
  "(?:you|he|she|they|I|we)(?:'re|'s|'m)?(?:\\s+(?:am|are|is|do\\s+not|don't|can't|cannot|won't|will\\s+not|never|have|has|had))?\\s*(?:the\\s+|a\\s+|an\\s+)?" +
  "(?:too\\s+busy|never|different|changed|forgot|forgotten|bother|talk\\s+back|argue|complain|last\\s+priority|an\\s+afterthought|ignored|neglected)\\b" +
  "|\\b(?:now|these\\s+days)\\s+(?:you're|you\\s+are)\\s+(?:too\\s+busy|different|changed|never\\s+around)\\b" +
  "|\\blook\\s+at\\s+you\\s+now\\b",
  'i'
);
// 对比否定断言（只讲过去、当下隐含的暗示形）——要求显式否定词，纯回忆句不判。
const CONTRAST_DISMISS_ZH = new RegExp(
  '(?:当初|以前|过去|那时候|当年|婚前|结婚前|追我的时候|谈恋爱时)' +
  '[^。]{0,12}(?:追我的时候|追我的那会儿|谈恋爱时|谈恋爱的时候|刚认识的时候|那会儿)' +
  '[^。]{0,10}(?:可不是|才不是|并不是|可不像|完全不是)[^。]{0,8}(?:这个|这样的|这种|这副|那种)(?:态度|样子|嘴脸|面孔|状态)'
);
const CONTRAST_DISMISS_EN = new RegExp(
  "\\b(?:you|he|she|they)\\s+(?:didn't|did\\s+not|never)\\s+use\\s+to\\s+(?:raise|yell|shout)\\s+your\\s+voice\\b",
  'i'
);

// ─── 豁免：正当的标准管理、变更与推迟驳回 ─────────────────────────────
// 正式变更流程：书面修订、变更单、ADR、重新评估工时等。
const PROCESS_ZH = new RegExp(
  '(?:书面|正式|按)(?:修订|变更)(?:版|本|单|说明)?' +
  '|(?:变更|修订|调整)(?:流程|程序|需|要|应|须)(?:走|经|由)?' +
  '|(?:ADR|决策记录|变更单|变更申请|工单|ticket|issue)\\s*[##编号]?' +
  '|(?:重新|另行)(?:评估|核算|核定)(?:工时|工期|工作量|成本|排期)' +
  '|(?:以|按)(?:书面|正式)(?:修订版|版本|文件|通知)(?:为准)?'
);
const PROCESS_EN = new RegExp(
  "\\b(?:change|revision|amendment)\\s+(?:request|order|record|control|log|process|ADR)\\b" +
  "|\\b(?:documented|formal|written|approved)\\s+" +
  "(?:change|revision|revised)\\s+(?:process|criteria|standard|requirements?|version)\\b" +
  "|\\bre-?estimat(?:e|ed|ing)\\s+(?:the\\s+)?(?:effort|timeline|schedule|cost|delivery)\\b" +
  "|\\bper\\s+(?:the\\s+)?(?:revised|updated)\\s+(?:spec|specification|document|contract)\\b",
  'i'
);
// 未达标时的正当驳回：明确指出未达成，而非事后抬高标准。
const NOT_MET_ZH = new RegExp(
  '(?:你|你们)(?:还|尚未|并未|并没|仍)(?:没|未)(?:做到|完成|达标|合格|解决|交付)' +
  '|(?:尚未|还未|没有)(?:达到|满足|完成)(?:要求|标准|目标|指标)' +
  '|(?:目前|现在|眼下)(?:尚未|还未|并未)(?:达到|满足)(?:要求|标准)' +
  '|(?:差距|缺口)(?:在|是|仍)(?:于|在|有)'
);
const NOT_MET_EN = new RegExp(
  "\\b(?:you|they|we)\\s+(?:haven'?t|have\\s+not|hasn'?t)\\s+" +
  "(?:met|done|completed|delivered|achieved)\\b" +
  "|\\b(?:not|not\\s+yet|still\\s+not)\\s+(?:met|satisfied|achieved|delivered)\\b" +
  "|\\b(?:the\\s+)?(?:gap|shortfall)\\s+(?:is|remains|lies)\\b",
  'i'
);
// 分级晋升机制：本轮合格 + 下一轮按已公布的新标准复测。
const STAGE_ZH = new RegExp(
  '(?:本轮|本轮|本阶段|本阶段|此轮)(?:合格|达标|通过)' +
  '|(?:下一轮|下一阶段|下一环节|下一阶段)(?:将|按|会)(?:在|按)(?:新|更高)?(?:标准|标杆)(?:下)?(?:复测|重测|考核|评审)' +
  '|(?:标准|门槛)(?:已|提前|事先|之前)(?:公布|公开|说明|告知)'
);
const STAGE_EN = new RegExp(
  "\\b(?:this|the)\\s+(?:round|stage|phase|gate)\\s+(?:is\\s+)?(?:passed|complete|cleared)\\b" +
  "|\\b(?:the\\s+)?next\\s+(?:round|stage|phase|gate)\\s+(?:will\\s+be|is)\\s+" +
  "(?:assessed|measured|evaluated)\\s+(?:under|against|by)\\s+(?:a\\s+)?(?:new|higher|published)\\s+" +
  "(?:standard|rubric|bar|criteria)s?\\b" +
  "|\\b(?:the\\s+)?(?:new|higher)\\s+(?:standard|criteria|bar)s?\\s+(?:was|were)\\s+" +
  "(?:published|announced|shared)\\s+(?:in\\s+advance|upfront|beforehand)\\b",
  'i'
);
// 在评析这套话术本身。
const META_EXEMPT_ZH = /(?:移动球门|移动球柱|事后加码|临时抬高标准|标准位移|抬高门槛)(?:是|属于|是一种|正是|属于)(?:一种|典型的|常见的)?(?:谬误|谬说|逻辑错误|错误论证|话术|手法|手段|策略|伎俩|套路|推责|现象|问题|错误)/;
const META_EXEMPT_EN = /\b(?:moving\s+the\s+goalposts?|shifting\s+the\s+goalposts?|raising\s+the\s+bar|goalpost\s+shift)\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkStandardShift(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免：正式变更流程 / 未达标时的正当驳回 / 分级晋升机制
  if (PROCESS_ZH.test(text) || PROCESS_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (NOT_MET_ZH.test(text) || NOT_MET_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (STAGE_ZH.test(text) || STAGE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const shiftZh = SHIFT_ZH.test(text);
  const shiftEn = SHIFT_EN.test(text);
  const shift = shiftZh || shiftEn;

  // 路由②：既往承诺直接作废（无达成确认也构成单方面加码）
  if (shiftZh || shiftEn) {
    // [v6.8.43 r696] 作废判据提升为模块级 VOID_ZH/VOID_EN（名词插入容忍+动词扩表）
    const voidZh = VOID_ZH.test(text);
    const voidEn = VOID_EN.test(text);
    if (voidZh || voidEn) {
      return {
        hit: true,
        score: 0.66,
        count: 1,
        detail: isZh ? '事后加码×既往承诺作废(zh)' : '事后加码×既往承诺作废(en)',
      };
    }
  }

  // 路由③：既往承诺 × 当下否定（用过去表现否定当下合理变化）
  // [v6.8.47 r700] 双腿共现，单腿不判——「以前随叫随到」单独出现是回忆，
  // 「现在变了」单独出现是正常陈述，缺一不构成事后加码。
  if (PAST_COMMITMENT_ZH.test(text) && PRESENT_NEGATION_ZH.test(text)) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: '事后加码×既往承诺否定(zh)',
    };
  }
  if (PAST_COMMITMENT_EN.test(text) && PRESENT_NEGATION_EN.test(text)) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: '事后加码×既往承诺否定(en)',
    };
  }

  // 路由③b：对比否定断言（只讲过去、当下隐含——要求显式否定词，纯回忆句不判）
  if (CONTRAST_DISMISS_ZH.test(text)) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: '事后加码×既往承诺否定(zh)',
    };
  }
  if (CONTRAST_DISMISS_EN.test(text)) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: '事后加码×既往承诺否定(en)',
    };
  }

  // 路由①：达成确认 × 标准位移（主判定）
  const okZh = ACHIEVED_ZH.test(text) && shiftZh;
  const okEn = ACHIEVED_EN.test(text) && shiftEn;
  if (okZh || okEn) {
    return {
      hit: true,
      score: 0.70,
      count: 1,
      detail: isZh ? '事后加码×移动验收标准(zh)' : '事后加码×移动验收标准(en)',
    };
  }

  // [v6.8.71 第 723 轮] 路由④：强单方作废形（窄口补形）
  // 既往承诺/标准锚点 × 单方作废动词共现即判——不要求抬标触发词
  // （「当初那件事不作数」「旧标准作废」没有抬标话术，作废本身就是位移），
  // 也不受 PROCESS_ZH/EN 的书面流程字样影响（「我们之间的协议不作数了」
  // 是攻击不是程序讨论）。DUE_PROCESS 程序正当形豁免。
  const strongVoid = (STRONG_VOID_ZH.test(text) || STRONG_VOID_EN.test(text)) && !DUE_PROCESS.test(text);
  if (strongVoid) {
    return {
      hit: true,
      score: 0.66,
      count: 1,
      detail: isZh ? '既往承诺/标准单方作废(zh)' : '既往承诺/标准单方作废(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkStandardShift,
  __internals: {
    VOID_TIME_ZH, VOID_NOUN_ZH, VOID_VERB_ZH, VOID_MOD_ZH, VOID_STD_ZH,
    VOID_SAID_ZH, VOID_DEM_ZH, VOID_AGREED_ZH, VOID_ANYTIME_ZH, VOID_MARK_ZH,
    DUE_PROCESS_ZH, VOID_EN_NOUN, VOID_EN_VOID, DUE_PROCESS_EN,
  },
};
