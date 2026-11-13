/**
 * src/budget-value-conflation.js — 「预算约束≠价值判断」检测器
 * （第 213 个判别维度，r219 起草；8 处 src/index.js 接线由 1 号主力补全，
 * 接线规格见 coordination/reports/r219-dimension-agent4.md §五）
 *
 * [r219 立项] r217 研究轮零命中探针（coordination/agent4/probes/
 * r217-zerohit-probe.js，v6.8.144 实测）：「C 预算约束当作价值判断」族
 * 攻击样本 5 条中 3 条 gate.action=pass（C2/C4/C5，中英双语均漏；
 * C1 仅被 fallacies/appeal_to_pity 附带命中、C3 仅被 circular_reasoning
 * 附带命中且该句本身确有循环形，均为错维度代拦），良性对照 BC1/BC2
 * 2/2 pass（零误伤）。覆盖度检查（r219 grep 实测）：预算/负担不起/
 * 买不起/afford/worth 在 src/ 下无任何维度以「购买力推断事物内在
 * 价值」为判据——helplessness_induction 的 RESOURCE 腿（预算有限/
 * 经费不够）只与「给出可核实约束+替代路径」配对，无价值判断腿；
 * nirvana_fallacy 的废止腿含「不值得/毫无价值」但要求「不完美」
 * 腿（不能根治/有漏洞）在场；scale_dismissal 的 dismiss 腿要求
 * 小规模宣告腿；无 budget/afford/worth 相关 dimMap 键。变量名 bvc
 * grep 0 命中无冲突。
 *
 * 外部来源：空返，按既有形态自建。r219 海外扫描（arXiv 宽查询被
 * API 拆成 OR 零相关、短语精确查询 "budget constraint" AND "value
 * judgment" 0 条目、GitHub repos 0 ×2、S2 连续 429）无可集成的纯
 * 规则实现；判据为心虫自有纯规则实现（家族定义取自预算约束与价值
 * 判断之混淆 / affordability-worth conflation 的标准经济学与逻辑
 * 学描述：购买力是资源约束事实，价值是事物属性判断，二者之间没有
 * 推论关系）。
 *
 * 辨别的族：预算约束被当作价值判断（budget-as-merit conflation /
 * affordability-worth conflation）——把**资源约束下买不起**偷换成
 * **它本身不值得**：
 *   我们预算不够，所以这件事本来就不值得做。
 *   既然负担不起，说明它对我们也没多大价值。
 *   钱不够就买不起，买不起的东西注定不重要。
 *   We can't afford it, so it's clearly not worth doing.
 *   If the budget cannot cover it, then it cannot matter much.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：预算约束
 * 是**主体侧的资源事实**（这个决策者现在有多少可支配资源），价值
 * 是**客体侧的属性判断**（这件事对目标体系有多大贡献）。买不起
 * 只证明「现在的我付不出这个价格」，不证明「它不值这个价」——
 * 市场里大把"买不起但确实值钱"与"买得起但毫无价值"的东西。该混
 * 淆把支付能力当成价值度量衡，进而推出「穷人不需要尊严」「小公司
 * 不配谈安全」「预算外的风险都可以忽略」一类结论：用钱包给事物
 * 的内在重要性定罪。它是资源短缺叙事下最常见的推理底座，也是
 * 「省钱省掉必要投入」自我说服的标准话术。
 *
 * 与既有维度的边界（r219 归因）：
 *   · nirvana_fallacy（既有维度）的废止腿含「不值得/毫无价值」，
 *     但要求「不完美」腿（不能根治/有漏洞/治标不治本）在场；本族
 *     要求的是「预算/购买力」腿在场，不涉及方案完美性。
 *   · scale_dismissal（既有维度）的 dismiss 腿含「不值得大惊小
 *     怪」，但要求小规模/低占比宣告腿；本族不涉及比例。
 *   · proxy_metric_goal（第 187 维）管「用代理指标替代真实目标」
 *     的绩效评估场景（用代码行数衡量生产力）；本族管「用预算约
 *     束替代价值判断」的决策场景。两者都是度量错位，但落点一个
 *     在绩效、一个在价值。
 *   · relative_privation 管「别人更惨所以你不算惨」；本族是同一
 *     决策主体内「付不起→不重要」的推断。
 *   · sunk_cost_coercion（第 98 维）管「已投入×退出可耻」；本族
 *     与投入无关，管约束与价值的混淆。
 *   · appeal_to_pity 管诉诸怜悯；本族不诉诸情感（r217 实测 C1
 *     被 appeal_to_pity 错维度代拦，本族提供正确承重）。
 *
 * 判据（腿① 预算约束 × 腿② 价值否定，缺一不判；四形任一）：
 *   · 腿① BUDGET 预算约束：预算不够/预算不足/预算有限/预算紧
 *     张/预算覆盖不了/超出预算、钱不够/资金不够/经费不够/财力不
 *     足/账上没钱、负担不起/买不起/付不起/出不起/掏不起/难以承
 *     受；EN can't afford / cannot afford / unable to afford /
 *     budget can't cover / budget is too tight / beyond our
 *     means / can't pay for / doesn't fit the budget。
 *   · 腿② WORTH 价值否定：不重要/不是重要/不要紧/没多大价值/
 *     没什么价值/价值不大/价值有限/不值得/不值当/无足轻重/无关
 *     紧要/算不上重要/不是关键；EN not worth / isn't worth /
 *     little value / no real value / doesn't matter / can't
 *     matter / not that important / unimportant。
 *   · F-1 推断链形：腿① →（推断词 所以/因此/可见/说明/意味着/
 *     显然/肯定/必然/注定/毕竟/因为；EN so/which means/it
 *     shows/implies/clearly/obviously/must/because/since）→
 *     腿②（腿②前不得有否定标记——「预算不够，所以不是不值得」
 *     是双重否定=肯定，不判）。
 *   · F-2 泛化形：买不起的东西都/注定/必然 + 不重要/没价值（EN
 *     what we can't afford can't matter）——对整类事物下价值判
 *     决，是强形态。否定内生于谓语（"can't matter"的 not 是谓语
 *     一部分），本形不做否定守卫。
 *   · F-3 反问形：腿① + 能是什么/算什么/岂能算 + 重要/关键/价值
 *     （EN can't afford ... how important can it be）——用问号
 *     包装的断言仍是断言。
 *   · F-4 反向归因形：腿② + 因为/毕竟/是由于 + 腿①（EN not
 *     worth ... because our budget was never enough）——先给价值
 *     结论再拿预算当归因；「因为」与预算腿之间不得跨句读（；。，
 *     截断），防「因为需求不足；预算反而是次要的」误伤。
 *
 * 为什么取 VERIFY 级：单句也可能是**省略语境的正当决策陈述**
 * （"预算不够，所以不值得做"在日常口语里常是"现在不做"的省略，
 * 价值结论已在别处立过），也可能是新闻转述、课堂案例、对他人
 * 观点的引述；rewrite 会误伤。verify 的含义是「这段文本把预算
 * 约束当成了价值判断，需要把『买不起』（资源约束）与『不值得』
 * （内在价值）分开，各自独立论证后再下结论」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 教学/概念转述（教材/课堂/论文/称为/定义为/概念/误区/谬误/
 *     认知偏误/经济学家；EN textbook/paper/fallacy/misconception/
 *     cognitive bias/economists）——讨论这个概念本身不是运用它；
 *   · 正确响应形（两回事/不是一回事/不能说明/不代表/不等于/分
 *     开判断/用钱衡量；EN is not a verdict / separate questions /
 *     not a measure of）——指出预算与价值是两个问题，正是本族要
 *     教的判别动作；
 *   · 无腿①或腿②（只有预算陈述没有价值否定，或只有价值否定没有
 *     预算约束——「使用率低所以不值得投入」是正常成本收益论证，
 *     缺预算腿不判）；
 *   · 疑问句（含 ?/？）——但反问标记（难道/岂/算什么/能是什么/
 *     何尝；EN isn't it/how else/if not）不豁免：用问号包装的断言
 *     仍是断言（F-3 形专收）。
 */
'use strict';

// ─── 腿① BUDGET 预算约束（中文）────────────────────────────────────
const BUDGET_ZH = [
  /预算不够|预算不足|预算有限|预算紧张|预算覆盖不了|预算无法覆盖|预算撑不了|超预算|超出预算|预算紧缩|预算吃紧/,
  /预算[^。；，]{0,4}(?:紧张|不够|不足|有限|吃紧|紧缩)/,
  /钱不够|资金不够|经费不够|财力不足|财力有限|账上没钱|账上钱不多|囊中羞涩|手头紧|手头拮据|拿不出这笔钱|掏不出这笔钱/,
  /负担不起|买不起|付不起|出不起|掏不起|难以负担|无法负担|承受不起|供给不起/,
];

// ─── 腿② WORTH 价值否定（中文）─────────────────────────────────────
const WORTH_ZH = [
  /不重要|不是重要|不要紧|没什么要紧|没多大价值|没什么价值|没有什么价值|没有多大价值|价值不大|价值有限|不值得|不值当|无足轻重|无关紧要|算不上重要|谈不上重要|不是关键|算不上关键|谈不上关键/,
];

// ─── F-1 推断词（中文；含反向归因连接词）───────────────────────────
const INFER_ZH = /所以|因此|因而|可见|说明|意味着|证明|显然|肯定|必然|一定|注定|那就|相当于|等于|无非|说白了|说到底|也就|自然|势必|足见|毕竟|是因为|因为/;

// ─── F-2 泛化形（中文）：买不起的X都/注定 + 价值否定 ───────────────
// 否定内生于谓语，不做否定守卫（见模块头）。
const GEN_ZH = /(?:买不起|负担不起|付不起|出不起|掏不起)的[^。；，]{0,10}(?:都|注定|必然|向来|统统|一律)[^。；，]{0,8}(?:不重要|无关紧要|没多大价值|没什么价值|不值得|无足轻重|不是关键)/;

// ─── F-3 反问形（中文）：预算腿 + 能是什么/算什么 + 价值词 ────────
const RHET_ZH = /(?:买不起|负担不起|付不起|出不起|掏不起|预算不够|钱不够|资金不够|经费不够)[^。？]{0,14}(?:能是什么|算什么|岂能算|怎么能算|称得上|哪算什么|凭什么算|岂是什么)[^。？]{0,8}(?:重要|关键|价值)/;

// ─── F-4 反向归因形（中文）：价值否定 + 因为/毕竟 + 预算腿 ────────
// 「因为」与预算腿之间禁跨句读（；。，截断）——防「因为需求不足；
// 预算反而是次要的」误伤。
const REV_ZH = /(?:不值得|不重要|没多大价值|没什么价值|没有什么价值|无关紧要|无足轻重|不是重要|价值不大)[^。；，]{0,2}[，,]?\s*(?:因为|毕竟|是由于|就在于)[^。；，]{0,12}(?:预算|资金|经费|钱不够|负担不起|买不起|付不起|出不起|掏不起)/;

// ─── 英文常量 ───────────────────────────────────────────────────────
const BUDGET_EN = [
  /\b(?:can'?t|cannot|could\s?n[o']t|unable\s+to)\s+(?:\w+\s+){0,2}afford\b/i,
  /\b(?:budget|budgets)\s+(?:can'?t|cannot|could\s?n[o']t)\s+(?:cover|stretch|reach|take)\b/i,
  /\b(?:budget|budgets|funds?|money)\s+(?:is|are|was|were)\s+(?:too\s+(?:tight|small|limited)|never\s+enough|not\s+enough|insufficient)\b/i,
  /\bnot\s+enough\s+(?:budget|money|funds)\b/i,
  /\bbeyond\s+(?:our|the)\s+(?:means|budget)\b/i,
  /\b(?:don'?t|does\s?n[o']t)\s+have\s+the\s+budget\b/i,
  /\bno\s+room\s+in\s+the\s+budget\b/i,
  /\bcan'?t\s+pay\s+for\b/i,
  /\b(?:does\s?n[o']t|don'?t)\s+fit\s+(?:the|our)\s+budget\b/i,
  /\btoo\s+expensive\s+for\s+(?:us|our\s+budget)\b/i,
];
const WORTH_EN = [
  /\bnot\s+worth\b/i,
  /\bisn'?t\s+worth\b/i,
  /\b(?:of\s+)?(?:little|no|not\s+much)\s+(?:real\s+)?value\b/i,
  /\bdoes\s?n[o']t\s+matter\b/i,
  /\bcan'?t\s+matter\b/i,
  /\bcannot\s+matter\b/i,
  /\bnot\s+(?:that\s+)?important\b/i,
  /\b(?:can'?t|cannot)\s+be\s+(?:that\s+|really\s+)?(?:important|worth\w*)\b/i,
  /\bnot\s+matter\b/i,
  /\bunimportant\b/i,
  /\bnever\s+matters?\b/i,
];
const INFER_EN = /\b(?:so|therefore|thus|which\s+means|that\s+means|it\s+shows|shows|means|implies|hence|consequently|must|necessarily|inevitably|basically|clearly|obviously|then|because|since|proves?)\b/i;

// ─── F-2 泛化形（英文）：what we can't afford can't matter ──────────
// 否定内生于谓语，不做否定守卫。
const GEN_EN = /\b(?:what|whatever|anything|things?)\s+(?:we|you|one|people)\s+can(?:no|')?t\s+afford\b[^.]{0,40}\b(?:can(?:no|')?t|cannot|don'?t|does\s?n[o']t|never)\s+(?:really\s+|truly\s+)?(?:matter|matters|important|worth\w*)/i;

// ─── F-3 反问形（英文）─────────────────────────────────────────────
const RHET_EN = [
  /\bcan(?:no|')?t\s+(?:even\s+)?afford\b[^.]{0,40}\bhow\s+(?:important|valuable)\s+can\b/i,
  /\bif\s+we\s+can(?:no|')?t\s+afford\b[^.]{0,40}\bwhat\s+does\s+that\s+(?:say|tell|prove)\b/i,
  /\bcan(?:no|')?t\s+afford\b[^.]{0,40}\bwhat\s+kind\s+of\s+\w+\s+matters?\b/i,
];

// ─── F-4 反向归因形（英文）：worth-leg + because/since + budget-leg ─
const REV_EN = /\b(?:not\s+worth\w*|isn'?t\s+worth\w*|unimportant|of\s+little\s+value|does\s?n[o']t\s+matter)\b[^.]{0,30}\b(?:because|since)\b[^.]{0,30}\b(?:can'?t\s+afford|cannot\s+afford|budget\s+(?:is|was)\s+(?:too\s+(?:tight|small|limited)|never\s+enough|not\s+enough)|beyond\s+our\s+(?:means|budget)|not\s+enough\s+(?:budget|money|funds)|could\s?n[o']t\s+pay)\b/i;

// ─── [r324] 现代资金/预算话语域新措辞家族（平行常量，存量注入语义不变）──
// 真升级②：存量腿只收第一人称「买不起/预算不够/负担不起」式**可负担性约束**
// （我付不出这个价 → 所以不值得），不收「投入/分配/报酬金额小」式**第三方
// 分配信号**——「项目预算才批了二十万，说明它不重要」「月薪低说明这活没
// 技术含量」「没人愿意投钱说明没价值」「研发预算占比低说明不重视创新」
// 类现代预算/薪酬/注资话语 9/9 穿透本模块、良性 0 误伤
// （scripts/round-324/probe-candidates.js）。家族同构：把**分配金额**
// （budget allocation size）当成价值/重要性/含金量的度量衡——与存量
// 「可负担性→价值」共享同一混淆内核（用钱给事物的重要性定罪），但触发
// 词是分配额/报酬额/注资有无（"批得少/月薪低/没人投"），不是「买不起」。
// 实现为平行常量 BUDGET_*4/WORTH_*4 + GEN/RHET/REV_*4，各 find*Leg
// concat 合并；存量四形与存量族注入语义不变（注入 *_4=[] 只关新族，
// 注入 BUDGET_ZH=[] 仍整腿禁用存量预算腿——新族不含「预算不够」字样）。

// 腿① 分配/报酬金额小（中文）
const BUDGET_ZH4 = [
  // ①-a 预算/经费/拨款 + 才/只/仅仅 + 批/给/拨/划/投（"只批/才批"=分配金额小）
  /(?:预算|经费|拨款|资金|财力|研发|投入|开销|成本|资源)[^。；，！？]{0,4}(?:才|只|仅仅)[^。；，！？]{0,2}(?:批|给|拨|划|投|筹|申|要|争)/,
  // ①-b 预算/经费/拨款/投入 + 这么/那么/才/只 + 少/低/一点点（分配金额小）
  /(?:预算|经费|拨款|资金|财力|研发|投入|开销|成本|资源)[^。；，！？]{0,6}(?:才|只|仅仅|就这么点|少得可怜|如此|这么|那么)[^。；，！？]{0,4}(?:少|低|小|一点点|一丁点|微不足道|有限|寒酸)/,
  // ①-c 占比/比例 + 这么/很/偏 + 低/小（预算占比低）
  /(?:预算|经费|投入|研发|资金|资源)?占比[^。；，！？]{0,4}(?:这么|那么|很|非常|偏|较|一直)?(?:低|小|少|不高)/,
  // ①-d 月薪/薪水/工资/待遇 + 才/这么/偏 + 低/少/小（报酬低）
  /(?:月薪|薪水|工资|薪资|报酬|薪酬|待遇|咨询费|专家费|出场费)[^。；，！？]{0,6}(?:才|只|仅仅|这么|那么|很|非常|偏|一直)?(?:低|少|小|有限|不高|寒酸)/,
  // ①-e 才/只/仅仅 + 给/发/批/拨/付 + 数目 + 月薪/工资/钱/经费（只给了X月薪）
  /(?:才|只|仅仅)(?:给|发|批|拨|付|开)[^。；，！？]{0,8}(?:月薪|薪水|工资|薪资|报酬|待遇|钱|经费|预算|拨款)/,
  // ①-f 没人(愿意)投钱/出资/注资/买单/付费（无人注资；含「免费/开源…没人投钱」子情形）
  /没人(?:愿意)?(?:投钱|出资|注资|买单|付费|肯投|乐意投)/,
];

// 腿① 分配/报酬金额小（英文）
const BUDGET_EN4 = [
  // ①-a2 budget/funding/grant/allocation is tiny/small/meager/paltry（分配金额小）
  /\b(?:budget|funding|grant|grants|allocation|investment)\b[^.]{0,25}\b(?:is|was|are|were)\s+(?:tiny|small|minimal|meager|paltry|modest|low|negligible)\b/i,
  // ①-b2 (a|the|only) (small|tiny|minimal|meager|paltry) (grant|budget|allocation)
  /\b(?:a|the|only)\s+(?:small|tiny|minimal|meager|paltry|modest|low)\s+(?:grant|budget|allocation|funding|investment)\b/i,
  // ①-c2 salary/pay/wage/compensation is low/small/meager（报酬低）
  /\b(?:salary|pay|wage|wages|compensation|remuneration)\b[^.]{0,20}\b(?:is|was|are|were)\s+(?:low|small|meager|paltry|minimal|modest)\b/i,
  // ①-c3 (poorly|low)-(paid|funded)（报酬/注资低——现代 labor 常用标签）
  /\b(?:poorly|low)[- ]?(?:paid|funded)\b/i,
  // ①-d2 nobody/no one funds/invests/backs/pays for（无人注资；含「free…nobody funds」子情形）
  /\b(?:nobody|no\s+one)\s+(?:funds?|funded|invests?|invested|backs?|backed|pays?\s+for|sponsors?)\b/i,
];

// 腿② 价值/重要性/含金量否定（中文）
const WORTH_ZH4 = [
  // ②-a [不没] + ≤5字 + 当回事（口语化"不重要/不在乎"；"不能不"由 lookbehind 挡）
  /(?<![能可乏])[不没][^。；，！？]{0,5}当回事/,
  // ②-b [不没] + 可选强化 + 重视（对某对象的价值态度否定；"不能不重视"由 lookbehind 挡）
  /(?<![能可])[不没](?:多|太|怎么|很|大|够)?重视/,
  // ②-c 没什么/没啥/没有/谈不上 + 技术含量/含金量/专业性（对技能/价值的内在否定；
  //    用"没什么X"而非裸"X低"——裸"X低"易与"工资低是因为门槛低"式反向因果混淆）
  /(?:没什么|没啥|没有|谈不上|缺乏|缺少)[^。；，！？]{0,4}(?:技术含量|含金量|专业性)/,
];

// 腿② 价值/重要性/含金量否定（英文）
const WORTH_EN4 = [
  // ②-a2 not (be/really/very/all that/particularly) + important/valuable/significant
  /\bnot\s+(?:(?:be|really|very|all\s+that|particularly|especially)\s+){1,3}(?:important|valuable|significant|meaningful)\b/i,
  // ②-b2 not require/demand/take (much) (real) skill/expertise/talent（对技能价值的否定）
  /\bnot\s+(?:require|demand|take|need)\s+(?:much\s+|any\s+|a\s+lot\s+of\s+)?(?:real\s+|actual\s+)?(?:skill|expertise|talent|ability)\b/i,
  // ②-c2 (little|no) (real) skill/expertise/merit/substance
  /\b(?:little|no)\s+(?:real\s+|actual\s+)?(?:skill|expertise|merit|substance)\b/i,
];

// F-2 泛化形新措辞（中文）：分配少的X都/注定 + 价值否定（腿①复用 BUDGET_ZH4 锚点）
const GEN_ZH4 = /(?:月薪低|工资低|薪水低|报酬低|没人投钱|没人愿意投|钱少|预算少|经费少|拨款少|投入少|给得少)[^。；，]{0,10}(?:的)?[^。；，]{0,8}(?:都|注定|必然|一律|统统)[^。；，]{0,8}(?:不重要|没多大价值|没什么价值|不值得|无关紧要|没技术含量|没啥含金量|不当回事|不重视)/;
// F-3 反问形新措辞（中文）：分配少 + 能算什么/能是什么 + 重要/价值/含金量
const RHET_ZH4 = /(?:预算|经费|拨款|投入|钱|月薪|工资)[^。？]{0,6}(?:才|只|这么|那么)?(?:少|低)[^。？]{0,14}(?:能算什么|算什么|能是什么|岂能算|称得上)[^。？]{0,8}(?:重要|关键|价值|技术含量|含金量)/;
// F-4 反向归因形新措辞（中文）：价值否定 + 因为/毕竟 + 分配少
const REV_ZH4 = /(?:没技术含量|没啥含金量|含金量低|不当回事|不当一回事|不重视|没什么技术含量|意义不大)[^。；，]{0,2}[，,]?\s*(?:因为|毕竟|是由于|就在于)[^。；，]{0,12}(?:预算|经费|拨款|投入|钱|工资|月薪)[^。；，]{0,6}(?:少|低|才|只)/;

// F-2 泛化形新措辞（英文）：poorly-paid/low-funded X never/don't matter
const GEN_EN4 = /\b(?:poorly|low)[- ]?(?:paid|funded)\b[^.]{0,30}\b(?:never|don'?t|does\s?n[o']t|cannot|can'?t)\s+(?:really\s+|truly\s+)?(?:matter|matters|important|worth\w*)/i;
// F-3 反问形新措辞（英文）
const RHET_EN4 = [
  /\b(?:budget|funding|grant|salary|pay)\b[^.]{0,30}\b(?:tiny|small|low|meager|minimal)\b[^.]{0,40}\bhow\s+(?:important|valuable|skilled)\s+can\b/i,
];
// F-4 反向归因形新措辞（英文）
const REV_EN4 = /\b(?:not\s+(?:very\s+)?(?:important|valuable|skilled)|little\s+(?:real\s+)?(?:skill|value)|no\s+real\s+(?:skill|value))\b[^.]{0,30}\b(?:because|since)\b[^.]{0,30}\b(?:budget|funding|grant|salary|pay)\b[^.]{0,20}\b(?:tiny|small|low|meager|minimal)\b/i;

// 豁免一：教学/概念转述（讨论概念本身不是运用它）────────────────
const EXEMPT_META_ZH = [
  /教材|课堂|教科书|讲座|论文|文献|称为|定义为|概念|所谓|是指|悖论|理论上|学术|研讨|误区|谬误|认知偏误|思维陷阱|经济学里|经济学家|有人说|常言道|俗语说|推理题/,
];
const EXEMPT_META_EN = [
  /\b(?:textbook|lecture|papers?|studies|called|defined|definition|concept|theory|fallacy|misconception|cognitive\s+bias|reasoning\s+error|economists?|known\s+as|refers\s+to|describes?)\b/i,
];

// ─── 豁免二：正确响应形（指出预算与价值是两个问题，正是要教的判别
// 动作）────────────────────────────────────────────────────────────
const EXEMPT_CORRECT_ZH = [
  /两回事|不是一回事|不能说明|并不能说明|不代表|不等于|分开判断|分开看|分开陈述|区分开|资源约束|用钱衡量|衡量的|各自独立|另作评估|排队等资源/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:is\s+not|isn'?t)\s+a\s+verdict\b/i,
  /\bseparate\s+questions?\b/i,
  /\bnot\s+the\s+same\b/i,
  /\bdistinguish\w*\b/i,
  /\bdifferent\s+questions?\b/i,
  /\bnot\s+a\s+measure\s+of\b/i,
  /\bbudget\s+(?:fact|constraint)\b[^.]{0,40}\bnot\b/i,
];

// ─── 否定守卫（窗口化）──────────────────────────────────────────────
// 注意：窗口只覆盖「推断词之后、腿②之前」的跨度（链形）或「两腿之
// 间」的跨度（F-4）——不能从句首算起，否则腿①自带的否定
// （can't afford / 买不起）会误伤腿②（r219 设计决策：否定守卫查
// 跨度，不查腿②前历史）。
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|不会造成|不会导致|不是说|不能说|谈不上|并不意味着|并没有|也不存在|不是不/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|neither|nor|no\s+longer|don'?t)\b/i;

// 跨度窗（中文按字、英文按字符）
const WIN_BI_ZH = 40;    // 腿① ↔ 推断词
const WIN_BI_EN = 120;
const WIN_IW_ZH = 40;    // 推断词 ↔ 腿②
const WIN_IW_EN = 120;
const NEG_SPAN_ZH = 40;  // 否定守卫检查的跨度（与腿间窗一致）
const NEG_SPAN_EN = 120;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表可注入空数组；单正则常量注入替换正则
// （负例脚本用 /(?!x)x/ 永假式抹掉该形）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

// 找列表中任一命中的首个位置
function firstIdx(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

// 全量命中位置（global 扫描）
function allIdx(list, text) {
  const out = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ idx: m.index, end: m.index + m[0].length, text: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return out;
}

// 跨度否定守卫：span 区间 [from, to) 内不得有否定标记
// R.NEG_ZH / R.NEG_EN 可被负例脚本注入（永假正则抹掉守卫）。
function negatedInSpan(text, from, to, isZh, R) {
  if (from < 0 || to <= from) return false;
  const span = text.slice(from, Math.min(to, text.length));
  const re = isZh ? ((R && R.NEG_ZH) || NEG_ZH) : ((R && R.NEG_EN) || NEG_EN);
  return re.test(span);
}

// 腿①首次命中位置与结束位置
function findBudgetLeg(text, isZh, R) {
  const list = isZh
    ? (R.BUDGET_ZH || BUDGET_ZH).concat(R.BUDGET_ZH4 || BUDGET_ZH4)
    : (R.BUDGET_EN || BUDGET_EN).concat(R.BUDGET_EN4 || BUDGET_EN4);
  for (const re of list) {
    const m = re.exec(text);
    if (m) return { idx: m.index, end: m.index + m[0].length };
  }
  return { idx: -1, end: -1 };
}

// F-1 推断链形：腿① → 推断词 → 腿②（两段跨度都不得被否定——「并不
// 说明它不值得」是对推断的否认，「不是买不起」是对约束的否认；腿①
// 起点前 12 字/28 字符亦查否定）
function findChainLeg(text, isZh, R) {
  const worths = isZh
    ? (R.WORTH_ZH || WORTH_ZH).concat(R.WORTH_ZH4 || WORTH_ZH4)
    : (R.WORTH_EN || WORTH_EN).concat(R.WORTH_EN4 || WORTH_EN4);
  const inferRe = isZh ? pickRe(R.INFER_ZH, INFER_ZH) : pickRe(R.INFER_EN, INFER_EN);
  const winBI = isZh ? WIN_BI_ZH : WIN_BI_EN;
  const winIW = isZh ? WIN_IW_ZH : WIN_IW_EN;

  const budget = findBudgetLeg(text, isZh, R);
  if (budget.idx < 0) return null;
  // 腿①自身否定守卫（查腿①前史）
  {
    const n = isZh ? 12 : 28;
    const pre = text.slice(Math.max(0, budget.idx - n), budget.idx);
    const negRe = isZh ? ((R && R.NEG_ZH) || NEG_ZH) : ((R && R.NEG_EN) || NEG_EN);
    if (negRe.test(pre)) return null;
  }

  const inferG = new RegExp(inferRe.source, inferRe.flags.includes('g') ? inferRe.flags : inferRe.flags + 'g');
  let im;
  while ((im = inferG.exec(text)) !== null) {
    if (im.index < budget.idx || im.index - budget.idx > winBI) continue;
    // 否定守卫一：腿①结束 → 推断词起点（「预算不够，但这并不说明…」）
    if (negatedInSpan(text, budget.end, im.index, isZh, R)) continue;
    for (const w of allIdx(worths, text)) {
      if (w.idx < im.index || w.idx - im.index > winIW) continue;
      // 否定守卫二：推断词结束 → 腿②起点（「…所以不是不值得」双重否定）
      if (negatedInSpan(text, im.index + im[0].length, w.idx, isZh, R)) continue;
      return { idx: w.idx, text: 'budget→' + im[0] + '→worth' };
    }
  }
  return null;
}

// F-2 泛化形（不做否定守卫：否定内生于谓语）
function findGenLeg(text, isZh, R) {
  const list = isZh
    ? [pickRe(R.GEN_ZH, GEN_ZH)].concat(R.GEN_ZH4 || GEN_ZH4)
    : [pickRe(R.GEN_EN, GEN_EN)].concat(R.GEN_EN4 || GEN_EN4);
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    const m = reG.exec(text);
    if (m) return { idx: m.index, text: m[0] };
  }
  return null;
}

// F-3 反问形（不做否定守卫：问号包装的断言，否定已内生于结构）
function findRhetLeg(text, isZh, R) {
  const raw = isZh ? (R.RHET_ZH || RHET_ZH) : (R.RHET_EN || RHET_EN);
  const add = isZh ? (R.RHET_ZH4 || RHET_ZH4) : (R.RHET_EN4 || RHET_EN4);
  const list = (Array.isArray(raw) ? raw : [raw]).concat(add);
  for (const re of list) {
    const m = re.exec(text);
    if (m) return { idx: m.index, text: m[0] };
  }
  return null;
}

// F-4 反向归因形：腿② → 因为/毕竟 → 腿①（worth 腿前 2 字/字符防
// 「不是不值得」双重否定；worth 腿结束→连接词 的跨度查否定；预算腿
// 自带的否定（买不起/never enough）是谓语固有成分，不查）
function findRevLeg(text, isZh, R) {
  const revList = isZh
    ? [pickRe(R.REV_ZH, REV_ZH)].concat(R.REV_ZH4 || REV_ZH4)
    : [pickRe(R.REV_EN, REV_EN)].concat(R.REV_EN4 || REV_EN4);
  const worths = isZh
    ? (R.WORTH_ZH || WORTH_ZH).concat(R.WORTH_ZH4 || WORTH_ZH4)
    : (R.WORTH_EN || WORTH_EN).concat(R.WORTH_EN4 || WORTH_EN4);
  const connRe = isZh ? /因为|毕竟|是由于|就在于/ : /\b(?:because|since)\b/i;
  const negRe = isZh ? ((R && R.NEG_ZH) || NEG_ZH) : ((R && R.NEG_EN) || NEG_EN);
  for (const re of revList) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = reG.exec(text)) !== null) {
    // worth 腿在本匹配内的结束位置（兜底 +4）
    let worthEnd = m.index + 4;
    for (const w of allIdx(worths, text)) {
      if (w.idx === m.index) { worthEnd = w.end; break; }
    }
    const cm = connRe.exec(m[0]);
    if (!cm) continue;
    const connAbs = m.index + cm.index;
    // 否定守卫一：worth 腿前 2 字/字符（「不是不值得」双重否定）
    const pre = text.slice(Math.max(0, m.index - 2), m.index);
    if (negRe.test(pre)) continue;
    // 否定守卫二：worth 腿结束 → 连接词 的跨度
    if (negatedInSpan(text, worthEnd, connAbs, isZh, R)) continue;
    return { idx: m.index, text: m[0] };
  }
  }
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkBudgetValueConflation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免：仅当句中无反问标记时豁免（用问号包装的断言仍是断言）
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|谁不知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的|算什么|能是什么/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can|important)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }

  // 豁免一：教学/概念转述
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免二：正确响应形
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿①：预算约束（缺腿①即无「约束→价值」推断可判）
  const budgetLeg = findBudgetLeg(text, isZh, R);
  if (budgetLeg.idx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 四形任一
  const forms = [];
  const ch = findChainLeg(text, isZh, R);
  if (ch) forms.push({ form: 'F-1', hit: ch });
  const gn = findGenLeg(text, isZh, R);
  if (gn) forms.push({ form: 'F-2', hit: gn });
  const rh = findRhetLeg(text, isZh, R);
  if (rh) forms.push({ form: 'F-3', hit: rh });
  const rv = findRevLeg(text, isZh, R);
  if (rv) forms.push({ form: 'F-4', hit: rv });
  if (forms.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.6,
    count: forms.length,
    detail: isZh
      ? '预算约束≠价值判断：把「买不起」(资源约束)偷换成「不值得」(内在价值)(zh, ' + forms.map(f => f.form).join('+') + ')'
      : 'budget-as-merit conflation: affordability (a budget constraint) treated as a verdict on worth(en, ' + forms.map(f => f.form).join('+') + ')',
  };
}

module.exports = {
  checkBudgetValueConflation,
  __internals: () => ({
    BUDGET_ZH, WORTH_ZH, INFER_ZH, GEN_ZH, RHET_ZH, REV_ZH,
    BUDGET_EN, WORTH_EN, INFER_EN, GEN_EN, RHET_EN, REV_EN,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, EXEMPT_META_EN, EXEMPT_CORRECT_EN, NEG_ZH, NEG_EN,
    // [r324] 现代资金/预算话语域新措辞家族平行常量（负例注入自检用）
    BUDGET_ZH4, WORTH_ZH4, GEN_ZH4, RHET_ZH4, REV_ZH4,
    BUDGET_EN4, WORTH_EN4, GEN_EN4, RHET_EN4, REV_EN4,
  }),
};
