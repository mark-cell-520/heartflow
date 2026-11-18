/**
 * src/red-herring.js — 「转移话题」检测器
 * （第 255 个判别维度，r323 立项）
 *
 * [r323 立项] decision 本体在当前引擎（v6.8.181，254 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项依据：
 *   · 缺口实证（/tmp/hf-probe-redherring.js，直调 gate.js v6.8.181）：本族
 *     22 条攻击样本（ZH 12 + EN 10）中 **14 条完全穿透**（gate.action=pass，
 *     零维度代拦）；被代拦的 8 条归因维度均非 red herring 判据
 *     （whataboutism 1、performative_responsibility 1、presupposition /
 *     genetic_fallacy / pseudo_profundity / complexity_shield /
 *     hasty_generalization / absolute_claim 各 1-2 条，全是相邻维度散落
 *     代拦）。良性 10/10 零误伤。首轮模块探针（/tmp/hf-probe-rh-mod.js）
 *     暴露纯「别再说 X」型之外的**反问式替代议题族整族 miss**（「你指责
 *     我贪污，可是你知道我捐了多少吗」「but have you seen」），二轮改
 *     为三段结构（置换标记×原议题段×替换议题段）后 20/22 命中。
 *   · 外部来源（真实，未编造）：GitHub causalNLP/logical-fallacy（96★，
 *     https://github.com/causalNLP/logical-fallacy，Findings of EMNLP 2022
 *     论文 "Logical Fallacy Detection" / arXiv:2202.13758）Logic 数据集 13
 *     类谬误分类中 "red herring" 是 13 类之一（其逻辑形式："An attempt
 *     to redirect the argument to another issue to which the person doing
 *     the redirecting can respond"）。心虫 254 维已覆盖该数据集的 false
 *     dilemma / equivocation / circular reasoning / ad populum / strawman /
 *     ad hominem / faulty generalization / false causality / appeal to
 *     emotion 等族，red herring 是其中唯一未被独立覆盖的类。心虫判据为
 *     自有纯规则实现（零 LLM 依赖，不引入该仓库的模型权重或 LLM 调用）。
 *
 * 辨别的族：转移话题（red herring，中文又称「转移论点」「偷换论题」
 * 「混淆议题」）——**面对原议题（指控/提问/讨论事项），不回应其本身，
 * 而是用置换标记把注意力引向另一个议题**，让讨论脱离原轨道：
 *   「你指责我贪污，可是你知道我这些年给灾区捐了多少钱吗？」
 *   「别再说我迟到了，公司去年不是也搞过一次团建吗？」
 *   「You say I took bribes, but have you seen how much I donated?」
 *   「Never mind the budget overrun, the real issue is our competitors.」
 *
 * 与既有维度的边界（r323 归因，刻意错开）：
 *   · whataboutism（Tu quoque 变体）管**反问形态的对称化回避**（「你倒是
 *     也……」「你怎么不先说说……」——把指控反弹回提问者本人）；本族管
 *     **陈述/祈使/反问形态的议题置换**（「别再说 X，先说 Y」「X 放一边，
 *     Y 才重要」），不要求反问句、不要求矛头转向对话者本人。
 *   · soft_deflection（软性转移）管**不给结论的滑脱**（「这事以后再说」
 *     「让我们拭目以待」）；本族**明确给出替代议题**。
 *   · fallacy_of_relevance（第230维）管**前提与结论主题域不相干却用推断
 *     词连成因果/蕴含结论**（「他工作努力，所以产品一定优秀」——两段都是
 *     论据，缺陷在结论与前提的语义关联，标记是 所以/因此/therefore）；
 *     本族**不构造推论**，两段是「原议题」与「替换议题」的并列，标记是
 *     搁置/替换族（别再说/更重要的是/never mind/the real issue is）。
 *   · motivated_reasoning（第232维）管**以动机推定替代对论点实质内容的
 *     回应**；本族不推定动机，是**直接引入另一个议题**。
 *   · goal_drift（第197维）管**执行轨迹上目标被整体置换**（腿①是原始
 *     目标锚点、腿②是目标切换宣告）；本族腿①是**被讨论/被质疑的事项**
 *     （不限于目标），腿②是**话题搁置标记**。
 *
 * 判据（三段结构，缺一不判）：
 *   · 腿① SHIFT 置换标记：三类——
 *     (a) dismiss 搁置族（把原议题推开：「别再说/先不说/放一边/有什么好
 *         X的/别纠缠/never mind/forget about/stop asking about」）；
 *     (b) redirect 替换族（把注意力引向他处：「更重要的是/更值得/真正
 *         值得讨论的是/我们先谈谈/the real issue is/what we really should
 *         be discussing」）；
 *     (c) counter 反问族（用一个问句顶替回答：「可是你知道/但你看/but
 *         have you seen/but look at/why criticize X when」）。
 *   · 腿② ORIGIN 原议题段：标记之前的实质内容（指控/提问/讨论锚点），
 *     或 capture 型标记捕获的原议题（「the real question is not whether
 *     **I lied**」「should not discuss **climate change** until」），或
 *     标记位于句首时其后第一个分句的话题对象（「Never mind **the
 *     budget overrun**, the real issue is…」）。
 *   · 腿③ REPLACE 替换议题段：标记之后的实质内容，与腿②**零共享实词**
 *     （共享即同一议题的内部延续，见 CONTINUE 豁免）。
 *   · 资格门：redirect 族（纯替换标记、无搁置义）要求腿②含**回应义务
 *     锚点**（？/你(说|问|指责|认为|批评|质疑)/关于(这|此|该)/(这个|
 *     那个|此|该)(问题|事情|议题|话题|事项)/在讨论/大家(都)?(在)?(讨论|
 *     关注)/被(质疑|批评|指控|举报|追问)；EN you (say|said|ask|asked|
 *     claim|accuse|criticize)、about (this|that|the) (issue|question|
 *     matter|topic)、(everyone|people|we) (are|is) (discussing|talking
 *     about|debating)、?）——「这个方案成本高，更重要的是安全」这类
 *     **同主体的补充陈述**无回应义务锚点，不判；dismiss/counter 族自带
 *     搁置义，无此门。
 *   · 豁免（全部可负例注入置空）：
 *     META_CONCEPT 谬误/话题概念转述与教学（转移话题/偷换论题/混淆议题/
 *     红鲱鱼/red herring——讨论这个概念本身不是运用它）、AGENDA 正当议程
 *     管理（明确排序且未贬抑原议题：「先讨论A，再讨论B」「one at a
 *     time」「address them separately」——会议主持的正确做法）、HEDGE
 *     对冲（可能/也许/maybe/perhaps）、RESPOND_OK 显式回应当前问题、
 *     CONTINUE 同议题延续（腿②腿③共享实词——「这份报告造假的事先放一边，
 *     报告的其他部分还是准确的」仍属同一议题内部）。
 *
 * 为什么取 VERIFY 级：原议题并未被回答，被引来的替代议题本身可能是个真
 * 问题（教育公平确实重要、国产确实值得支持），verify 的含义是「当前文本
 * 没有回应原议题，需回到原议题作答后再转向其他」。与 r206-r269 同口径
 * 只登记 VERIFY。
 *
 * [r358 扩展] 时机搁置族（defer，第四类标记，真升级类型②）：用「时间不
 * 成熟」把原议题推开（「疫苗安全的问题现在不是讨论的时候」「财报的事
 * 现在谈不合时宜」「现在讨论预算赤字为时尚早」），同时在替换段给出
 * **竞争性优先事项**（当务之急/更应该/聚焦/the real priority）。立项探针
 * coordination/agent4/probes/r358-probe-round1.js（v6.8.185 实测）：该族
 * 6/6 攻击整族穿透 gate=pass、良性 4/4 零误伤、已覆盖形 2/2 命中。精度
 * 双墙承重：① 替换段必须含优先重定向标记（REPLACE_PRIORITY_ZH/EN）——
 * 「等数据出来再说」「先把项目交付做完」类同议题条件推迟与前置任务因此
 * 不判；② DEFER_OK_ZH/EN 家族豁免显式放行「等…再」「先…做完」形。与
 * 与 soft_deflection 的边界：本族明确给出替代优先议题，soft_deflection 不给
 * 结论；与 goal_drift 的边界：本族腿②是被讨论/被质疑的事项（不限于目标），
 * 腿①标记是时间推迟形而非目标切换宣告。
 *
 * [r398 扩展] 回应冲淡族（concede 对比冲淡 + narrate 叙事岔开，第五/六类
 * 标记，真升级类型②）：存量判据只认**显式置换标记**（别再说/更重要的是/
 * 可是你知道），对「不搁置、不反问，用一个对比标记把指控蒙过去，后半段
 * 另起一头与指控事项不相关的成绩/贡献/资历/苦劳」整族穿透——r398 轮初
 * 探针（scripts/round-398/probe-pool.js，v6.8.198 实测）12 条攻击 10 条
 * 穿透 gate=pass、良性 2 条非 pass 但均非本维度代拦（既有基线 contradiction
 * / helplessness_induction）。这是 causalNLP/logical-fallacy 分类里 red
 * herring 的教科书形（"redirect the argument to another issue to which the
 * person doing the redirecting can respond"）此前唯一未覆盖的子族。
 *   · concede 对比冲淡：「有人批评公司污染环境，但他们为当地创造了那么
 *     多就业」「You question the contract terms, yet our team has twenty
 *     years of experience.」——对比标记（但/但是/却/不过/yet/but/however）
 *     × 原议题批评锚点 × 替换段社会成绩框。
 *   · narrate 叙事岔开：「他说这家餐馆卫生差，老板立刻强调自己资助了多
 *     少学生」「他批评政策失误，对方立刻把话题转到他的私生活上」——叙事
 *     岔开标记（强调/谈起/把话题转到/转移话题/shifted the topic）× 批评
 *     锚点 × 替换段成绩框或外归因框（显式转题标记自带搁置义，免框）。
 * 精度墙（三墙合取，全部可负例注入置空）：① CRITICISM 批评锚点资格门
 * （「贵，但味道好」类同主体比较陈述无锚点不判）；② MERIT 社会成绩框
 * （「实施周期短其实是优势」类同方案反陈述无成绩名词不判； narrate 另
 * 收 EXCUSE 外归因框——「行业整体困难」类）；③ ADDRESS 豁免（「已经
 * 修复/正在整改」类回应原议题的补救陈述不判）。与 CONTINUE 零共享实词
 * 墙、AGENDA/HEDGE/RESPOND_OK 全局豁免合取。与 whataboutism 的边界：本
 * 族**不把指控反弹回对话者本人**（那是 tu quoque 射程），是另起一头成
 * 绩；与 fallacy_of_relevance 的边界：本族无推断词连接（但/却/yet 不是
 * 推论标记），两段是「指控」与「不相关成绩」的并列；与 motivated_reasoning
 * 的边界：本族不推定动机，是直接引入另一个议题。
 */
'use strict';

// ─── 腿①：置换标记表 ─────────────────────────────────────────────────
// kind: 'dismiss' 搁置族 | 'redirect' 替换族 | 'counter' 反问族
// origin: 'before' 原议题在标记前 | 'capture' 标记捕获组即原议题
//        | 'after' 标记在句首，原议题是其后第一个分句
const MARKERS = [
  // ── (a) dismiss 搁置族 ──
  { re: /别再说/, kind: 'dismiss', origin: 'after' },
  { re: /先不说/, kind: 'dismiss', origin: 'after' },
  { re: /先别提/, kind: 'dismiss', origin: 'after' },
  { re: /先不谈/, kind: 'dismiss', origin: 'after' },
  // [r324 补腿] 「这些问题先放着，难道用户增长不是更关键的吗？」走 before
  // 型（见下方 dismiss 段）——本行原为 after 型，与 before 型同 idx 竞争
  // 时因位于数组前部而恒定抢先（best 选择严格小于），导致 before 型永无
  // 机会、且 after 型单分句必 return 假阴性。故此处不再保留 after 型。
  // { re: /先放着/, kind: 'dismiss', origin: 'after' },
  { re: /先放一放/, kind: 'dismiss', origin: 'after' },
  { re: /暂且不提/, kind: 'dismiss', origin: 'after' },
  { re: /暂时不提/, kind: 'dismiss', origin: 'after' },
  { re: /放(?:在|到)?一边/, kind: 'dismiss', origin: 'before' },
  { re: /先放一边/, kind: 'dismiss', origin: 'before' },
  { re: /先放[下一]/, kind: 'dismiss', origin: 'after' },
  // [r324 补腿] 「这些问题先放着，难道用户增长不是更关键的吗？」——原议题
  // 在标记前（before），替换议题是标记后的反问分句，用 before 型。注意：
  // 上面「先放[下一]」的字符类不含「着」，故本行不被其抢先（r324 诊断：
  // after 型同 index 覆盖 before 型，且 after 型 tail 为空直接 return）。
  { re: /先放着/, kind: 'dismiss', origin: 'before' },
  { re: /这事先放/, kind: 'dismiss', origin: 'after' },
  { re: /别纠缠/, kind: 'dismiss', origin: 'after' },
  { re: /有(?:什么|啥)好(?:说|谈|聊|讨论|担心|害怕|争|吵|纠缠|计较|在意|在乎)的/, kind: 'dismiss', origin: 'before' },
  { re: /何必(?:纠缠|纠结|计较|在意|在乎)/, kind: 'dismiss', origin: 'before' },
  { re: /别再(?:纠结|纠缠|计较|抓着)/, kind: 'dismiss', origin: 'before' },
  { re: /别(?:再)?纠缠/, kind: 'dismiss', origin: 'before' },
  { re: /别(?:抓着|揪着)(?:不[放舍])/, kind: 'dismiss', origin: 'before' },
  { re: /不要再谈/, kind: 'dismiss', origin: 'after' },
  { re: /别再谈/, kind: 'dismiss', origin: 'after' },
  { re: /抛开(?:这|此|该|这些|那些)?.{0,6}(?:不谈|不说|不论|不管)/, kind: 'dismiss', origin: 'before' },
  { re: /别(?:再)?问/, kind: 'dismiss', origin: 'before' },
  { re: /(.{2,30}?)?之前，我们先/, kind: 'dismiss', origin: 'before' },
  { re: /[？?。！]\s*那(?:学术界|别的|其他|别人)/, kind: 'counter', origin: 'before' },
  { re: /never mind/i, kind: 'dismiss', origin: 'after' },
  { re: /forget about/i, kind: 'dismiss', origin: 'after' },
  { re: /forget (?:that|the|this)/i, kind: 'dismiss', origin: 'after' },
  { re: /let'?s set aside/i, kind: 'dismiss', origin: 'after' },
  { re: /let us set aside/i, kind: 'dismiss', origin: 'after' },
  { re: /drop the subject/i, kind: 'dismiss', origin: 'after' },
  { re: /move (?:on|past) from/i, kind: 'dismiss', origin: 'after' },
  { re: /before we (?:talk|discuss|address) (?:about )?(?:the )?(.{2,60}?)(?:,|;|\.)/i, kind: 'dismiss', origin: 'before' },
  { re: /stop (?:asking|talking|bringing up) about/i, kind: 'dismiss', origin: 'after' },
  { re: /quit (?:asking|talking|complaining) about/i, kind: 'dismiss', origin: 'after' },
  { re: /(?:should not|cannot|can'?t|don'?t) (?:discuss|talk about|address) (.{2,60}?) until/i, kind: 'dismiss', origin: 'capture' },
  { re: /the (?:real|bigger|more important|more pressing) (?:question|issue) is not whether (.{2,60}?), but/i, kind: 'dismiss', origin: 'capture' },

  // ── (b) redirect 替换族 ──
  { re: /更(?:重要|值得|应该|关键)(?:的|是|得)?/, kind: 'redirect', origin: 'before' },
  { re: /(?:^|，|,)\s*重要的是/, kind: 'redirect', origin: 'before' },
  { re: /然而/, kind: 'redirect', origin: 'before' },
  { re: /(?:真正|才)(?:重要|值得)(?:的|是|关注|讨论|重视)/, kind: 'redirect', origin: 'before' },
  { re: /真正(?:值得|应该)(?:关注|讨论|重视|关心)的(?:是|事|问题)/, kind: 'redirect', origin: 'before' },
  { re: /回到(?:真正|更|根本)?(?:重要|值得|关键)的/, kind: 'redirect', origin: 'before' },
  { re: /反问/, kind: 'redirect', origin: 'before' },
  { re: /the real (?:issue|question|problem|story|scandal) (?:is|here)/i, kind: 'redirect', origin: 'after' },
  { re: /the (?:bigger|larger|more important|more pressing) (?:issue|question|problem|concern) (?:is|here)/i, kind: 'redirect', origin: 'after' },
  { re: /what (?:we|you) (?:really|actually|should) (?:need to )?(?:be )?(?:discussing|talking about|focused on|asking)/i, kind: 'redirect', origin: 'before' },
  { re: /what (?:really|actually) matters (?:is|here)/i, kind: 'redirect', origin: 'before' },
  { re: /let'?s (?:instead|rather) (?:talk|focus|turn)/i, kind: 'redirect', origin: 'before' },
  { re: /let us (?:instead|rather) (?:talk|focus|turn)/i, kind: 'redirect', origin: 'before' },

  // ── (c) counter 反问族 ──
  { re: /可(?:是)?你(?:知道|了解|想过|看看)/, kind: 'counter', origin: 'before' },
  { re: /可他(?:为什么|怎么)?(?:不|没)/, kind: 'counter', origin: 'before' },
  { re: /她(?:为什么|怎么)?(?:不|没)/, kind: 'counter', origin: 'before' },
  { re: /(?:可|但)(?:是)?你(?:为什么|怎么)?不/, kind: 'counter', origin: 'before' },
  { re: /难道你(?:不)?(?:知道|了解|想过|看看)/, kind: 'counter', origin: 'before' },
  { re: /你(?:怎么)?不(?:看看|想想)/, kind: 'counter', origin: 'before' },
  { re: /but (?:have you|did you)/i, kind: 'counter', origin: 'before' },
  { re: /but (?:look at|look what|consider|see)/i, kind: 'counter', origin: 'before' },
  { re: /but what about/i, kind: 'counter', origin: 'before' },
  { re: /have you (?:seen|considered|stopped to think)/i, kind: 'counter', origin: 'before' },
  { re: /why (?:criticize|blame|single out|pick on) (.{2,60}?) when/i, kind: 'counter', origin: 'capture' },
  // [r324 补腿] 他者对照反问族——用另一主体（隔壁/人家/同行/其他团队/别人）
  // 的同类问题反问顶替对原议题的回应（「可隔壁公司上个季度不也延期了吗」）。
  // 与 whataboutism 的边界：本族腿②是被质疑事项、腿③是他者对照，不要求
  // 矛头转向对话者本人；共享实词豁免跳过（同域不同题是本族特征）。
  { re: /可(?:是)?(?:隔壁|人家|同行|其他|别人|外界)/, kind: 'counter', origin: 'before' },
  { re: /(?:隔壁|人家|同行|其他)(?:公司|团队|部门|单位|企业|国家|人)/, kind: 'counter', origin: 'before' },
  // [r324 补腿] 反问对照短标记——「同行不也年年亏损吗」的 compact 形。
  // **必须锚定在分句边界**（逗号/句号后），否则 [^。！？]{0,20} 会贪婪
  // 回溯吞掉句首指控段整句当标记（r324 诊断：idx=0 匹配导致 before 为空、
  // 腿②缺失假阴性）。匹配**只到「不也/不一样」为止**，反问尾句留给腿③
  // （r324 诊断二：若匹配到句尾「吗」，after 段被 marker 整个吞掉=无腿③）。
  { re: /[，,。！？；;]\s*[^，,。！？；;]{0,12}?(?:不也|不一样)/, kind: 'counter', origin: 'before' },
  { re: /but what about (?:the )?(?:competitors|others|other teams)/i, kind: 'counter', origin: 'before' },
  { re: /aren'?t there (?:others|bigger)/i, kind: 'counter', origin: 'before' },

  // ── [r358 补腿] (d) defer 时机搁置族 ──
  // 「X，现在不是讨论的时候，当务之急是Y」类：用时间不成熟把原议题推开，
  // 替换段给出竞争性优先事项。**before 型（议题在标记前，裸标记无插入）
  // 必须排在 capture 型（议题在标记内）之前**：两者在「现在谈不合时宜」
  // 这类裸形上同 index 竞争，最早匹配取数组前部（同 index 严格小于不替换，
  // r324 同 index 竞争教训）；且 before 型只匹配标记内无议题的裸形，
  // capture 型句（议题卡在动词与时候之间）before 型天然失配，不会互抢。
  // 精度双墙见 DEFER_OK/REPLACE_PRIORITY 常量。
  { re: /(?:现在|当下|眼下|目前|如今)(?:还)?(?:不|没)?是?(?:讨论|谈论|谈|说)(?:的)?(?:时候|时机|时点)/, kind: 'defer', origin: 'before' },
  { re: /(?:现在|当下|眼下|目前|如今)(?:谈|说|讨论|谈论)不合时宜/, kind: 'defer', origin: 'before' },
  { re: /(?:现在|当下|眼下|目前|如今)(?:讨论|谈论|谈|说)(?:还)?为时(?:尚|过)?早/, kind: 'defer', origin: 'before' },
  { re: /(?:现在|当下|眼下|目前|如今)(?:讨论|谈论|谈|说)还(?:太|过)?早/, kind: 'defer', origin: 'before' },
  { re: /(?:现在|当下|眼下|目前|如今)(?:还)?(?:不|没)?是?(?:讨论|谈论|谈|说)([^。；！？]{2,20}?)的?(?:时候|时机|时点)/, kind: 'defer', origin: 'capture' },
  { re: /(?:现在|当下|眼下|目前|如今)(?:谈|说|讨论|谈论)([^。；！？]{2,16}?)不合时宜/, kind: 'defer', origin: 'capture' },
  { re: /(?:现在|当下|眼下|目前|如今)(?:讨论|谈论|谈|说)([^。；！？]{2,16}?)(?:还)?为时(?:尚|过)?早/, kind: 'defer', origin: 'capture' },
  { re: /(?:现在|当下|眼下|目前|如今)(?:讨论|谈论|谈|说)([^。；！？]{2,16}?)还(?:太|过)?早/, kind: 'defer', origin: 'capture' },
  { re: /(?:now|it|this|that) is not the time (?:to|for) (?:talk|speak|discuss|address) (?:about )?([^,;.]{2,60})/i, kind: 'defer', origin: 'capture' },
  { re: /(?:it|this|that) is too early to (?:discuss|talk about|address) ([^,;.]{2,60})/i, kind: 'defer', origin: 'capture' },
  { re: /(?:now|it|this|that) is not the time (?:to|for) (?:talk|speak|discuss|address)/i, kind: 'defer', origin: 'before' },

  // ── [r398 补腿] (e) concede 对比冲淡族 ──
  // 「有人批评公司污染环境，但他们为当地创造了那么多就业」类：不搁置、
  // 不反问，用对比标记把指控蒙过去，替换段是**与指控事项不相关的社会
  // 成绩**（就业/税收/捐赠/荣誉/资历/经验）。这是 red herring 的教科书
  // 形（redirect to another issue to which the responder can respond），
  // 存量四类标记整族不认（r398 轮初探针 10/12 穿透）。
  // 竞争纪律：**必须追加在数组尾部**——对比标记（但/却）是高频率虚词，
  // 若排在既有标记之前，同 index 竞争时（严格小于才替换）会恒定抢先，
  // 把 counter/dismiss 既有样本的腿①抢走（r324 同 index 竞争教训）。
  // 「但是更值得讨论」类纯替换形由负向断言挡掉，交给 redirect 族。
  { re: /[，,。；;！？]?\s*但(?:是)?(?![更才真](?:重要|值得|关键))/, kind: 'concede', origin: 'before' },
  { re: /[，,。；;！？]?\s*却(?:又)?/, kind: 'concede', origin: 'before' },
  { re: /[，,。；;！？]?\s*不过/, kind: 'concede', origin: 'before' },
  { re: /[,;.]\s*(?:yet|but|however)\b/i, kind: 'concede', origin: 'before' },
  { re: /^\s*(?:but|yet|however)\b/i, kind: 'concede', origin: 'before' },

  // ── [r398 补腿] (f) narrate 叙事岔开族 ──
  // 「他说这家餐馆卫生差，老板立刻强调自己资助了多少学生」类：用叙事
  // 岔开动词（强调/谈起/列举）或显式转题标记（把话题转到/转移话题/
  // shifted the topic）把注意力引向不相关事项。显式转题标记自带搁置
  // 义（explicit:true），免 MERIT/EXCUSE 框；叙事动词形仍要框资格门。
  { re: /(?:立刻|随即|马上|转而|径直|当即)?(?:强调|谈起|讲起|讲到|提及|列举|细数|夸耀|炫耀|鼓吹)/, kind: 'narrate', origin: 'before' },
  { re: /(?:开始|转而)(?:讲|说|谈|提及|回顾)/, kind: 'narrate', origin: 'before' },
  { re: /把(?:话题|视线|注意力|矛头)(?:转|引|移|引开|转移)(?:到|向)/, kind: 'narrate', origin: 'before', explicit: true },
  { re: /转移(?:话题|视线|注意力)/, kind: 'narrate', origin: 'before', explicit: true },
  { re: /话锋一转|顾左右而言他|岔开(?:话题|话头|议题)/, kind: 'narrate', origin: 'before', explicit: true },
  { re: /shifted? (?:the )?(?:topic|conversation|subject|focus|discussion|attention)/i, kind: 'narrate', origin: 'before', explicit: true },
  { re: /moved (?:the )?(?:topic|conversation|subject|discussion|focus)/i, kind: 'narrate', origin: 'before', explicit: true },
  { re: /(?:began|started) (?:to )?(?:talk|speak|boast|go on) about/i, kind: 'narrate', origin: 'before' },
];

// ─── redirect 族的回应义务锚点（腿②资格门）────────────────────────────
// 「这个方案成本高，更重要的是安全」这类同主体补充陈述无锚点 → 不判。
const ANCHOR_ZH = [
  /[？?]/,
  /你(?:说|问|指责|认为|觉得|批评|质疑|声称|让我|要我|问我)/,
  /关于(?:这|此|该)/,
  /(?:这个|那个|此|该)(?:问题|事情|议题|话题|事项)/,
  /被(?:质疑|批评|指控|举报|追问)/,
  /在(?:讨论|谈论|热议)/,
  /大家(?:都)?(?:在)?(?:讨论|关注|关心)/,
  // [r323 补腿] 裸「质疑」动词形——「大家质疑我们的财报有水分」中
  // 「质疑」本身就是第三方回应义务锚点（事件已被公开质询）。
  /大家(?:都)?(?:在)?质疑/,
  /(?:有人|有人|外界|公众|舆论|媒体)(?:都)?(?:在)?质疑/,
];
const ANCHOR_EN = [
  /\?/,
  /you (?:say|said|ask|asked|claim|claimed|accuse|accused|criticize|criticized)/i,
  /about (?:this|that|the) (?:issue|question|matter|topic|concern)/i,
  /(?:everyone|people|we|they) (?:are|is) (?:discussing|talking about|debating)/i,
];

// ─── [r358] defer 时机搁置族：家族豁免（同议题条件推迟/前置任务）──────────
// 良性形：「等数据出来再说」「等测试通过再谈」「先把项目交付做完」——推迟
// 的是同一议题的证据/前置条件，没有引入竞争性优先事项。攻击形与良性形的
// 分界不在推迟本身，而在替换段是否含优先重定向标记（REPLACE_PRIORITY）。
const DEFER_OK_ZH = [
  /等[^。；，！？]{0,18}(?:再|之后|以后)/,
  /等[^。；，！？]{0,18}(?:出来|清楚|明确|落地|显现|通过|公布|确认|查清|完成|结束|成熟|稳定|定论)/,
  /先(?:把)?[^。；，！？]{0,12}(?:做完|完成|交付|落地|收尾|查清|确认|定下来|稳定|搞定)/,
  /(?:看|等|说|谈|讨论)(?:完|好)[^。；，！？]{0,8}(?:再|之后)/,
  /(?:时机|条件)(?:成熟|具备|允许|不到|不合适)/,
];
const DEFER_OK_EN = [
  /until (?:we|the|there)[^.]{0,40}/i,
  /wait (?:until|for)/i,
  /(?:once|after) [^.]{0,40}(?:is|are) (?:done|ready|complete|launched|available|out|in)/i,
  /let(?:'?s| us) (?:first )?(?:finish|complete|deliver|ship|wrap)/i,
  /focus on (?:finishing|completing|delivering|shipping)/i,
];

// ─── [r358] defer 时机搁置族：替换段优先重定向标记（精度墙）────────────────
// 攻击形替换段必须给出**竞争性优先事项**（当务之急/更应该/聚焦/the real
// priority）。仅含条件推迟或前置任务的替换段（DEFER_OK 形）不含这些标记，
// 双墙合取后良性「等数据出来再说」类零误伤。
const REPLACE_PRIORITY_ZH = [
  /当务之急|重中之重|头等大事|当(?:下|前)?(?:最)?(?:重要|关键|紧迫)/,
  /更应该|更应当|更需要|更要(?:关注|重视|讨论|做)/,
  /(?:真正|更)(?:重要|值得|应该|关键)/,
  /聚焦|着力(?:于)?|转向|优先(?:级|事项|处理|解决|考虑|讨论)?/,
  /关键(?:是|在于)/,
];
const REPLACE_PRIORITY_EN = [
  /the (?:real|main|bigger|larger|more important|more pressing|pressing) (?:priority|issue|question|concern|focus|task)/i,
  /what (?:really|actually) matters/i,
  /(?:we|we'd|let's|should|must|need to|going to) [^.]{0,24}focus/i,
  /(?:more|most) important(?:ly)?/i,
];

// ─── [r398] concede/narrate 回应冲淡族：腿①批评锚点（资格门）──────────
// 原议题段必须含**回应义务锚点**——有人正在批评/质疑/指控某主体，或某
// 事项正被公开讨论/追问。「这家餐厅味道很好，但是价格有点贵」类同主体
// 比较陈述无锚点，天然不判。与 redirect 族 ANCHOR 的分工：ANCHOR 管
// 替换族（纯替换标记），本表管冲淡族（对比/叙事标记），且本表显式收录
// 批评动词（有人批评/被质疑/complain about）——冲淡族的原议题首先得是
// **被批评的事项**，不只是「有人在讨论」。
const CRITICISM_ZH = [
  // 第三方批评主体 + 批评动词
  /(?:有人|人们|公众|舆论|媒体|网友|用户|客户|员工|居民|市民|群众|大家|外界|消费者|受害者|举报人|顾客|乘客|业主|家属|听众|学员|购房者)(?:都)?(?:在)?(?:不断|纷纷|强烈)?(?:批评|质疑|指责|抱怨|反映|投诉|爆料|揭露|指控|控告|举报|问责|不满)/,
  // 被动遭受批评
  /(?:被|受)(?:到)?(?:广泛|公开|纷纷)?(?:批评|质疑|指责|投诉|指控|举报|爆料|揭露|问责|诟病|非议)/,
  // 个体主语 + 批评/追问动词
  /(?:他|她|你|我|对方|有人|大家|人们|记者|代表|观众|读者|业主|患者|家长|市民|群众|顾客|用户|听众)(?:们)?(?:都)?(?:在)?(?:当场|直接|公开|不断)?(?:批评|质疑|指责|指控|抱怨|投诉|反映|爆料|揭露|指出|追问|质问|反问|斥责|谩骂|吐槽)/,
  // 讨论/追问中的争议事项（问题域收口：风波/争议/造假/违规/安全性）
  /(?:讨论|谈论|热议|争论|争吵|质疑|追问|质问|回应|面对)[^。；，！？]{0,14}(?:问题|话题|议题|事项|风波|争议|质疑|丑闻|造假|违规|安全隐患|安全性|风险|隐患|黑幕|内幕)/,
  // 「你说/有人认为 … 不/差/错/假」 指控转述
  /(?:你说|有人说|大家说|有人认为|有人指出|别人指出)[^。；，！？]{0,18}(?:不|差|错|假|问题|风险|隐患|漏洞|毛病|欺)/,
  // [r398b 补腿] 转述指控 + 负面品质尾（「他说这家餐馆卫生差」类：批评
  // 动词是口语「说/称/提到」，落点在负面品质词上——不收裸「说」形，
  // 「他说这部电影好看」类正面转述不会误锚）。
  /(?:他|她|你|对方|有人|大家|人们|记者|代表|观众|读者|业主|患者|家长|市民|群众|顾客|用户|听众)(?:们)?(?:说|称|提到|提起|吐槽|反映|抱怨|指责)[^。；，！？]{0,18}(?:差|脏|假|错|烂|糟|不好|不行|不干净|不合格|不过关|不及格|不安全|有问题|有毛病|有漏洞|有风险|有隐患|造假|虚假|欺骗|忽悠|坑|副作用|有害|有毒|致癌|伤身)/,
];
const CRITICISM_EN = [
  /(?:you|she|he|they|we|i|someone|somebody|people|critics|reporters|journalists|users|customers|employees|residents|the public|the media|everyone|opponents|rivals|whistleblowers?) (?:say|said|says|claim|claimed|claims|accuse|accused|accuses|criticize|criticized|criticizes|complain|complained|complains|question|questioned|questions|allege|alleged|alleges|point(?:ed)? out|call(?:ed)? out|blamed?|charged)/i,
  /(?:is|are|was|were|been) (?:criticized|questioned|accused|blamed|challenged|reported|alleged|investigated)/i,
  /(?:criticism|complaint|accusation|allegation|concerns?|questions?|controversy|scandal|backlash|outcry|skepticism|doubts?) (?:about|over|around|regarding|of|that|surrounding)/i,
  /(?:discuss|discussed|discussing|debate|debated|debating|address|addressing|question|questioning|respond(?:ing)? to) (?:the |this |that )?(?:issue|problem|concern|question|controversy|scandal|safety|allegations?|criticism|complaint)/i,
];

// ─── [r398] concede 对比冲淡族：腿③社会成绩框（精度墙）────────────────
// 替换段必须是**与指控事项不相关的社会性成绩/贡献/资历**（就业/税收/
// 捐赠/荣誉/资历/经验/功劳苦劳）。「实施周期短其实是优势」类同方案反
// 陈述无成绩名词，不判——同主体补充陈述不是议题置换。
const MERIT_ZH = [
  /创造|带动|贡献|捐|资助|援建|扶持|募捐|缴纳|纳税|税收|营收|盈利|利润|奖金|奖学金/,
  /就业|岗位|饭碗|招用|雇用了?/,
  /荣誉|奖项|奖章|奖牌|奖项|嘉奖|表彰|称号|冠军|纪录/,
  /成绩|功劳|苦劳|不容易|辛苦|付出|汗水|心血/,
  /资历|履历|资格|地位|名声|声望|口碑|影响力|权威|知名/,
  /历史悠久|流传|传承|老字号|百年|千年|几百年|几千年|多年/,
  /经验|积淀|积累|底蕴|传统/,
];
const MERIT_EN = [
  /jobs?|employment|hiring|payroll/i,
  /donat|contribut|charit|philanthrop|scholarship|relief (?:efforts?|aid)|volunteer/i,
  /fund(?:ed|ing|s)?|financ|sponsor|endow/i,
  /revenue|tax(?:es)?|profit|earnings|turnover/i,
  /award|prize|honou?r|medal|trophy|recognition|accolade/i,
  /achievement|track record|credentials?|reputation|prestige|standing/i,
  /experience|expertise|legacy|heritage|tradition|decades? of/i,
];

// ─── [r398] narrate 叙事岔开族：腿③外归因框（行业困难/客观条件）────────
// 「讨论工资拖欠问题，代表却谈起了行业整体困难」类：替换段把责任推给
// 外部环境。仅 narrate 族收（concede 族只认社会成绩框）；显式转题标记
// （把话题转到/shifted the topic）自带搁置义，免此框。
const EXCUSE_ZH = [
  /困难|难处|苦衷|压力|局限|困境|艰难/,
  /现实(?:情况|约束|条件|问题)?|客观(?:原因|条件|因素|环境)/,
  /起步(?:晚|阶段|慢)|基础(?:差|薄弱)|底子(?:薄|差)|历史(?:遗留|原因|包袱)|包袱/,
  /大环境|整体(?:环境|形势|困难|状况)|行业(?:环境|形势|困难|状况|寒冬|不景气)/,
];
const EXCUSE_EN = [
  /difficult|hardship|pressure|constraint|limitation|circumstance|headwind/i,
  /legacy|historical (?:reasons?|factors?|burden)|starting from behind|handicap/i,
  /industry(?:wide)? (?:slowdown|downturn|difficulties|hardship|conditions)|market (?:conditions|downturn)/i,
];

// ─── [r398] 回应冲淡族：腿③补救/回应豁免（ADDRESS）────────────────────
// 替换段是**对原议题的补救或正面回应**（已修复/在整改/已解释）时，不
// 构成冲淡——「用户反映App经常闪退，新版本已经修复了大部分问题」。
const ADDRESS_ZH = [
  /修复|解决|处理[了过]?|回应|解释|说明|澄清|承认|道歉|赔偿|补偿|整改|治理|补救|纠正|改正|核查|复查|审计|公布|下架|召回|退款|赔付|安置/,
  /已(?:经)?(?:改|修|补|换|停|查)|正在(?:改|修|查|处理|整改)|将(?:会)?(?:改|修|补|查|处理)/,
];
const ADDRESS_EN = [
  /fixed|patch(?:ed)?|address(?:ed)?|resolved|remedied|corrected|explained|apologiz|acknowledg|refund|recall|audit|investigat|remediat/i,
  /already (?:fixed|addressed|resolved|handled|patched|corrected)/i,
  /(?:is|are|was|were) (?:being )?(?:fixed|addressed|resolved|investigated|corrected)/i,
];

// ─── 豁免表 ────────────────────────────────────────────────────────────
// 概念/教学转述——讨论这个概念本身不是运用它（含裸名词形态）。
const META_CONCEPT = [
  /转移话题|偷换论题|混淆议题|转移论题|转移视线|红鲱鱼|引入不相干|不相干的论据/,
  /red herring|ignoratio elenchi/i,
  /(?:谬误|逻辑错误|逻辑谬误|话术|诡辩)/,
];

// 正当议程管理——明确排序且未贬抑原议题（会议主持的正确做法）。
// [r324 补腿] 「先别提房价了，我们先看看租房市场的统计数据」——搁置后
// 的下一步数据检视是正当议程推进（同议题域：房价→租房市场），不是议题
// 置换。与攻击形的区别：攻击形腿③含他者对照/反问（「同行不也亏损吗」），
// 由 counter 族标记承载，不会被本豁免误放（本豁免只认「我们先看看」）。
const AGENDA = [
  /(?:我们)?先(?:讨论|谈|说)(?:这|此|该)?.{0,12}，(?:再|然后|接着)(?:讨论|谈|说)/,
  /(?:我们)?先(?:看看|看)(?:这|此|该)?.{0,12}的(?:数据|统计|报告|资料|材料|原文|来源)/,
  /分(?:成|为)?(?:两个|几个|多个)?(?:议题|问题|话题)(?:来)?(?:分别)?(?:讨论|处理)/,
  /一(?:个|件)(?:一?个)?(?:议题|问题|话题)(?:来)?(?:依次|分别|按顺序)/,
  /按(?:顺序|议程|优先级)(?:依次|分别|来)/,
  /(?:之后|下次|下一[次步个环节])(?:再)?(?:讨论|谈|说|安排)/,
  /one (?:at a time|issue at a time)/i,
  /address (?:them|these|both) (?:in (?:order|turn)|separately|one at a time)/i,
  /in (?:the )?next (?:session|meeting|agenda item)/i,
  /separate (?:agenda|discussion|topic)/i,
  /two (?:separate )?(?:issues|questions|topics)/i,
];

// 对冲弱化。
const HEDGE = [
  /可能|也许|或许|大概|似乎|好像|说不定|未必|不一定/,
  /maybe|perhaps|might|probably|possibly|seem/i,
];

// 显式回应当前问题。
const RESPOND_OK = [
  /我(?:来)?(?:回答|回应|解释|说明)(?:一下|你的问题)/,
  /回答你(?:的问题|的疑问|的质疑)/,
  /(?:我|我们)(?:先)?(?:直接)?回答/,
  /let me (?:answer|respond|address|explain)/i,
  /to answer your (?:question|concern|point)/i,
];

// 共享实词计算的停用词（含话题词族本身——避免「问题/讨论/重要」造成假共享）。
const STOP_ZH = new Set([
  '我们', '你们', '他们', '她们', '它们', '这个', '那个', '这些', '那些',
  '什么', '怎么', '为什么', '难道', '可是', '但是', '就是', '还是', '可以',
  '应该', '知道', '觉得', '想想', '看看', '问题', '事情', '一个', '不是',
  '没有', '这样', '那样', '如果', '因为', '所以', '而且', '同时', '此外',
  '另外', '确实', '真的', '真正', '重要', '值得', '关注', '讨论', '谈谈',
  '说说', '现在', '时候', '多么', '自己', '大家', '每年', '去年', '今年',
  '先谈', '先说', '先讨', '先解', '先关',
]);
const STOP_EN = new Set([
  'the', 'and', 'but', 'for', 'are', 'was', 'were', 'with', 'that', 'this',
  'from', 'have', 'has', 'had', 'not', 'you', 'your', 'yours', 'what',
  'about', 'would', 'could', 'should', 'there', 'their', 'them', 'they',
  'will', 'can', 'cant', 'dont', 'does', 'did', 'its', "it's", 'just',
  'more', 'most', 'also', 'than', 'then', 'when', 'what', 'which', 'who',
  'how', 'why', 'let', 'lets', 'really', 'actually', 'issue', 'issues',
  'question', 'questions', 'problem', 'problems', 'matter', 'matters',
]);

const CLAUSE_BREAK = /[，。！？；、,.!?;]/;

/**
 * 提取中文实词二元组集合（CJK 连续串切 bigram，去停用词）。
 */
function zhGrams(text) {
  const runs = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const out = new Set();
  for (const run of runs) {
    for (let i = 0; i + 2 <= run.length; i += 2) {
      const g = run.slice(i, i + 2);
      if (!STOP_ZH.has(g)) out.add(g);
    }
    // 奇数长度时补一个 2-gram 从倒数第二字起
    if (run.length % 2 === 1 && run.length >= 3) {
      const g = run.slice(run.length - 2);
      if (!STOP_ZH.has(g)) out.add(g);
    }
  }
  return out;
}

/**
 * 提取英文实词集合（小写、去停用词、长度 ≥3）。
 */
function enWords(text) {
  const out = new Set();
  const ws = text.toLowerCase().match(/[a-z]{3,}/g) || [];
  for (const w of ws) if (!STOP_EN.has(w)) out.add(w);
  return out;
}

function contentGrams(text) {
  const a = zhGrams(text);
  const b = enWords(text);
  return new Set([...a, ...b]);
}

function sharedCount(a, b) {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

/**
 * 把 after 段在第一个分句标点处切开，返回 [head, tail]。
 */
function splitAtClause(after) {
  const m = CLAUSE_BREAK.exec(after);
  if (!m) return [after, ''];
  return [after.slice(0, m.index), after.slice(m.index + 1)];
}

/**
 * 主检测入口。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/过滤数组替换指定常量
 * @returns {{hit:boolean, score:number, details:string, legs:object}}
 */
function checkRedHerring(text, inject) {
  const result = { hit: false, score: 0, details: '', legs: {} };
  if (typeof text !== 'string' || text.length < 6) return result;
  const R = inject || {};
  const MARKERS_R = R.MARKERS || MARKERS;

  // 豁免优先（句级）：概念转述不判
  if (META_CONCEPT.some(re => re.test(text))) return result;

  // 收集全部候选标记，按（index, 数组序）排序——既有单 best 语义不变
  // （同 index 严格小于才替换 → 数组序前者胜），但 [r398] 起新增
  // concede/narrate 高频标记**门失败时回退到下一个候选**（不 return），
  // 防止「但是更重要的是…」类既有 redirect 样本被高频虚词抢腿后假阴性。
  const cands = [];
  for (let mi = 0; mi < MARKERS_R.length; mi++) {
    const mk = MARKERS_R[mi];
    const m = mk.re.exec(text);
    if (m) cands.push({ mk, m, mi });
  }
  cands.sort((a, b) => (a.m.index - b.m.index) || (a.mi - b.mi));

  for (const c of cands) {
    const out = _evalMarker(text, c.mk, c.m, R);
    if (out) return out;
  }
  return result;
}

/**
 * 单标记求值。返回 null = 本标记不判且允许尝试下一个候选（仅新族）；
 * 返回对象 = 终局结果（既有族保持「首个 best 标记即终局」的语义——
 * 门失败也返回 no-hit 对象，不再回退，行为与改造前逐位一致）。
 */
function _evalMarker(text, mk, m, R) {
  const noHit = { hit: false, score: 0, details: '', legs: {} };
  const isNew = mk.kind === 'concede' || mk.kind === 'narrate';
  const fail = () => (isNew ? null : noHit);
  const before = text.slice(0, m.index).trim();
  const after = text.slice(m.index + m[0].length).trim();

  // 腿② ORIGIN 原议题段
  let originText = '';
  if (mk.origin === 'capture') {
    originText = (m[1] || '').trim();
  } else if (mk.origin === 'before') {
    // 标记位于文本开头（无 before 段）时，若正则带捕获组则以捕获组为
    // 原议题（「讨论食品安全之前，我们先……」捕获「讨论食品安全」；
    // 「Before we talk about pollution,」捕获「pollution」）。
    originText = m.index === 0 && m[1] && m[1].trim().length >= 2
      ? m[1].trim()
      : before;
  } else { // 'after'：标记在句首，原议题是其后第一个分句
    const [head] = splitAtClause(after);
    originText = head.trim();
  }
  // 腿③ REPLACE 替换议题段
  let replaceText = '';
  if (mk.origin === 'capture') {
    replaceText = after;
  } else if (mk.origin === 'before') {
    replaceText = after;
  } else {
    const [, tail] = splitAtClause(after);
    replaceText = tail.trim();
    // [r324 补腿] after 型硬条件：标记后只有一个分句（tail 为空）时，该
    // 分句是腿②原议题本身、无替换议题段——「这些问题先放着，难道用户增长
    // 不是更关键的吗？」中 after 仅一个分句，不构成议题置换。同时修掉良性
    // 误伤「先别提房价了，我们先看看租房市场的统计数据」类同议题接续。
    if (!replaceText) return fail();
  }

  const originG = contentGrams(originText);
  // [r324 补腿] 指代型原议题通道——「这些问题先放着，难道用户增长不是
  // 更关键的吗？」的 before 段是「这些问题」：`这些`/`问题` 均在 STOP_ZH，
  // contentGrams 为空。但「这些问题」本身是被搁置的合法议题指代（前置
  // 语境中已展开），不应因实词为空而假阴性。条件：before 段为纯指代短语
  // （指示词 + 量/通指名）时视为有效腿②，跳过实词检查。
  const referentialOrigin = /^(?:这|那|该|此)(?:些|个|类|种)?(?:问题|事情|事|议题|话题|毛病|状况|情况)?$/.test(originText.trim());
  if (originG.size === 0 && !referentialOrigin) return fail();
  const replaceG = contentGrams(replaceText);
  if (replaceG.size === 0) return fail();

  // CONTINUE 豁免：两段共享实词 = 同一议题内部延续。
  // counter 反问族自带搁置义（「可他为什么不先批评隔壁部门的方案」——
  // 「方案」一词虽共享，矛头已从原方案转向另一主体的另一方案），
  // 共享词恰是本族的「同域不同题」特征，故跳过此豁免。
  if (mk.kind !== 'counter' && sharedCount(originG, replaceG) > 0) return fail();

  // [r358 补腿] defer 时机搁置族精度双墙：① DEFER_OK 家族豁免（替换段是
  // 同议题条件推迟/前置任务——「等数据出来再说」「先把项目交付做完」）；
  // ② 替换段必须含竞争性优先重定向标记（REPLACE_PRIORITY）。两墙合取，
  // 只判「时间不成熟 + 转向另一优先事项」的置换形。
  if (mk.kind === 'defer') {
    const okZh = R.DEFER_OK_ZH || DEFER_OK_ZH;
    const okEn = R.DEFER_OK_EN || DEFER_OK_EN;
    const prZh = R.REPLACE_PRIORITY_ZH || REPLACE_PRIORITY_ZH;
    const prEn = R.REPLACE_PRIORITY_EN || REPLACE_PRIORITY_EN;
    if (okZh.some(re => re.test(replaceText)) || okEn.some(re => re.test(replaceText))) return fail();
    if (!(prZh.some(re => re.test(replaceText)) || prEn.some(re => re.test(replaceText)))) return fail();
  }

  // 资格门：redirect 族（纯替换、无搁置义）要求回应义务锚点。
  // [r324 补腿] 反问型替换豁免锚点要求——「你的代码有 bug，重要的是，难道
  // 我们不该先谈谈竞争对手的漏洞吗？」腿②无回应义务锚点（纯陈述指控），但
  // 腿③是**反问句**：反问本身就是不提供答案的回应逃逸形态，与锚点的语义
  // 等价（都在制造「可以不回答」的通道）。故腿③含反问特征（难道/吗/？/
  // EN ?/isn't it/aren't we）时视为锚点满足。
  if (mk.kind === 'redirect') {
    const anchored = ANCHOR_ZH.some(re => re.test(originText)) || ANCHOR_EN.some(re => re.test(originText));
    const rhetoricalReplace = /[？?]|难道|吗|不也|不是更/.test(replaceText)
      || /\?|isn'?t it|aren'?t we|wouldn'?t/i.test(replaceText);
    if (!anchored && !rhetoricalReplace) return fail();
  }

  // [r398 补腿] concede/narrate 回应冲淡族三墙资格门：
  //   墙① CRITICISM 批评锚点（腿②必须是被批评/被追问的事项）；
  //   墙② 替换段内容框——concede 只认 MERIT 社会成绩，narrate 认
  //        MERIT 或 EXCUSE 外归因（显式转题标记自带搁置义，免框）；
  //   墙③ ADDRESS 豁免（替换段是补救/正面回应时不判）。
  if (isNew) {
    const critZh = R.CRITICISM_ZH || CRITICISM_ZH;
    const critEn = R.CRITICISM_EN || CRITICISM_EN;
    if (!(critZh.some(re => re.test(originText)) || critEn.some(re => re.test(originText)))) return null;
    const addrZh = R.ADDRESS_ZH || ADDRESS_ZH;
    const addrEn = R.ADDRESS_EN || ADDRESS_EN;
    if (addrZh.some(re => re.test(replaceText)) || addrEn.some(re => re.test(replaceText))) return null;
    if (mk.kind === 'concede') {
      const meritZh = R.MERIT_ZH || MERIT_ZH;
      const meritEn = R.MERIT_EN || MERIT_EN;
      if (!(meritZh.some(re => re.test(replaceText)) || meritEn.some(re => re.test(replaceText)))) return null;
    } else if (!mk.explicit) {
      const meritZh = R.MERIT_ZH || MERIT_ZH;
      const meritEn = R.MERIT_EN || MERIT_EN;
      const excZh = R.EXCUSE_ZH || EXCUSE_ZH;
      const excEn = R.EXCUSE_EN || EXCUSE_EN;
      const framed = meritZh.some(re => re.test(replaceText)) || meritEn.some(re => re.test(replaceText))
        || excZh.some(re => re.test(replaceText)) || excEn.some(re => re.test(replaceText));
      if (!framed) return null;
    }
  }

  // 其余豁免
  if (AGENDA.some(re => re.test(text))) return fail();
  if (RESPOND_OK.some(re => re.test(text))) return fail();
  if (HEDGE.some(re => re.test(text))) return fail();

  const kindZh = mk.kind === 'dismiss' ? '搁置' : mk.kind === 'redirect' ? '替换'
    : mk.kind === 'defer' ? '时机搁置' : mk.kind === 'concede' ? '对比冲淡'
      : mk.kind === 'narrate' ? '叙事岔开' : '反问';
  const hit = { hit: true, score: 0, details: '', legs: {} };
  hit.score = mk.kind === 'redirect' ? 0.62
    : mk.kind === 'concede' ? 0.62
      : mk.kind === 'narrate' ? 0.68 : 0.72;
  hit.legs = { kind: mk.kind, marker: m[0], origin: originText.slice(0, 30), replace: replaceText.slice(0, 30) };
  hit.details = `转移话题(${kindZh}标记「${m[0].slice(0, 12)}」): 原议题「${originText.slice(0, 18)}」未获回应，注意力被引向「${replaceText.slice(0, 18)}」`;
  return hit;
}

module.exports = {
  checkRedHerring,
  __internals: () => ({
    MARKERS, DEFER_OK_ZH, DEFER_OK_EN, REPLACE_PRIORITY_ZH, REPLACE_PRIORITY_EN,
    ANCHOR_ZH, ANCHOR_EN, META_CONCEPT, AGENDA, HEDGE, RESPOND_OK,
    CRITICISM_ZH, CRITICISM_EN, MERIT_ZH, MERIT_EN, EXCUSE_ZH, EXCUSE_EN,
    ADDRESS_ZH, ADDRESS_EN,
  }),
};
