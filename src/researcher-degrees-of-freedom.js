'use strict';

/**
 * src/researcher-degrees-of-freedom.js
 * 「研究者自由度 / 数据挖掘谬误（researcher degrees of freedom）」检测器
 * （第 212 个判别维度，r217）
 *
 * [r217 立项] philosophy_decision 本体在当前引擎（v6.8.144，211 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为字符串 "unknown"，按轮次纪律不当实质背书）。立项缺口实
 * 证（/tmp/hf-probe-r217.js，直调 src/gate.js v6.8.144）：本族 14 条攻击
 * 样本中 **13 条 gate.action=pass 且 findings 全空**（真零命中，含中英双
 * 语、裸名词「事后/反推/采到显著为止」、带修饰「把假设写成了事前假设」、
 * 倒装 EN「reverse-engineered from the findings and presented as a
 * priori」、长句变体），仅 1 条被 premature_termination 以通用理由代
 * 拦；良性样本 8/9 pass（唯一非 pass 是 B3 被 presupposition 代拦，属
 * 存量维度噪声，非本族引入）。覆盖度检查：harking / p-hack / p_hack /
 * multiple comparison / dredging / forking / publication bias / preregist
 * / negative result 在 src/ 下 0 文件命中，cherry_picking（第 180 维度）
 * 只管「选择性取证 × 确定性结论」的取证动作、statistical_misleading
 * （第 58 维度）只管「小基数比例」、base_rate_neglect（第 169 维度）只
 * 管「阳性信号 × 高置信度后验」、false_precision（第 188 维度）只管
 * 「伪精确数字」——没有一维判「**分析流程本身被结果反向决定**」这个结构。
 *
 * 外部来源（真实，未编造）：三层搜索（HN Algolia / Semantic Scholar /
 * GitHub API）实况落盘 /tmp/hf-scout-1793864901.txt——
 *   · HN Algolia "causal inference fallacy" / "fallacy" tags=story：
 *     nbHits=0 空返。
 *   · Semantic Scholar "mediation analysis misinterpretation" /
 *     "mediation analysis misinterpretation bias"：HTTP 429（Too Many
 *     Requests，无 API key）两次空返。
 *   · GitHub API "causal inference fallacy detection" sort=stars：
 *     HTTP 403 API rate limit exceeded（未认证 IP 限流），改用
 *     "causal inference" sort=stars 成功，命中 py-why/dowhy ★8387、
 *     uber/causalml ★6040、py-why/EconML ★4841、
 *     matheusfacure/python-causality-handbook ★3508、
 *     google/CausalImpact ★1865——五个仓库均为因果推断**效应估计/因果
 *     发现**实现，不覆盖「研究者自由度」这一分析流程操纵族，无可移植纯
 *     规则判据，仅作方向背景（与 r169-r212 同口径：外部方案与纯规则引擎
 *     不同构时只取概念背景，判据为心虫自有实现）。
 * 判据为心虫自有纯规则实现（零 LLM 依赖）。
 *
 * 辨别的族：研究者自由度（researcher degrees of freedom / garden of
 * forking paths / data dredging）——**分析流程本身被已见结果反向决定**，
 * 再把这份「先看答案再编题目」的流程包装成事前设计好的严谨结论：
 *   · HARKing（Hypothesizing After the Results are Known）事后假设：
 *     我们先看了数据，然后才提出那个假设，结果它非常显著。
 *     这个假设是从结果反推出来的，但我们把它写成了事前假设。
 *     He hypothesized after the results were known, then wrote it as if
 *     he had predicted it.
 *     The hypothesis was reverse-engineered from the findings and
 *     presented as a priori.
 *   · optional stopping / p-hacking 边采边看：
 *     我们反复采样，直到 p 值降到 0.05 以下才停止。
 *     采到显著为止，于是我们得出了结论。
 *     We kept collecting data until the p-value dropped below 0.05.
 *   · 多重比较择优（data dredging / outcome switching 事后换终点）：
 *     我们试了几十个终点指标，最后找到了那个显著的。
 *     因为主终点不显著，我们换了一个显著的关键次要终点。
 *     We ran 200 comparisons and kept the ones that came out significant.
 *     Since the primary endpoint was not significant, we switched to a
 *     secondary outcome that was.
 *   · 选择性报告（reporting only what worked）：
 *     我们只报告了显著的那些结果，其余的都略过不提。
 *     我们事后重新定义了成功的标准，让结果看起来成立。
 *     Only the significant findings were reported; the rest were dropped.
 *
 * 为什么这是判别者的核心缺口（对齐「能准确寻找答案」与「能符合宇宙规律
 * ——证据纪律」）：统计推断的**有效性前提是分析方案独立于数据**。一旦假
 * 设、终点、停止时点、报告范围都由「已经看到的结果」反向决定，p 值、
 * 显著性、置信区间就全部失效——此时的「显著」不是证据强度的度量，而是
 * 「试了多少次」的函数（自由度越多，假阳性率越高，这正是多重比较问题
 * 的核心）。这是**证据生产流程**层面的污染，比任何单条结论的事实错误都
 * 更深：结论可以在算术上完全正确，却因为流程被结果污染而不承载任何证
 * 据。它与「说谎」无关——研究者完全可以诚实报告每一个数字，污染仍在。
 * 这一族在科研诚信、临床终点切换、增长实验、A/B 报告里最常出现，且
 * **在中文语料里几乎从无标记**，是心虫证据纪律维度的结构性空缺。
 *
 * 与既有维度的边界（r217 归因）：
 *   · cherry_picking（第 180 维度）管「选择性取证 × 确定性结论封装」，
 *     即**取证范围**被裁剪；本族管的是**分析流程**（假设提出时点、终点
 *     选择、停止规则、报告范围）被结果反向决定，承重的是腿①的「事后/
 *     反复/直到显著/换了」流程标记，cherry_picking 不要求任何流程时点
 *     标记。
 *   · statistical_misleading（第 58 维度）管「小基数让比例无意义」，
 *     本族不涉及基数大小——大样本同样可以被流程污染。
 *   · base_rate_neglect（第 169 维度）管「阳性信号 × 无视先验」，本族
 *     不涉及先验/假阳性率，涉及的是**产生这个阳性信号的流程**。
 *   · false_precision（第 188 维度）管「伪精确数字」，本族不管数字精度。
 *   · post_hoc（第 21 维度）管「时序先后 × 因果断言」的时间先后谬误，
 *     本族的「事后」是**分析时点**不是**事件时序**。
 *
 * 判据（主判据两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① FLEX 流程被结果反向决定的动作（裸名词形态，r161 教训：去掉
 *     前后缀仍命中）：
 *     顺序倒置形（先看结果再提假设）：先看(了)?(结果|数据|数据之?后)|
 *       看了(数据|结果)(之?后|再|然后)|看完(数据|结果)|数据看(完|到)|
 *       从结果(反推|推导|倒推)|反推出来|结果(已?知|出来)(之?后|再)|
 *       出了结果(再|后)|事后(提|补|追加|才|重新|改)|事后|HARKing|
 *        hypothes(ized|ising) after
 *     反复尝试形（optional stopping / 多重比较）：反复(采样|尝试|检验|
 *       比较|测试|运行|做|分析)|试(了|过)?(很多|几十|上百|多个|各种|
 *       不同)|不断(尝试|采样|检验|调整)|一次次|重新(分析|计算|检验|
 *       运行|定义|设定)|换(了)?(个|一种|一个)?(指标|终点|标准|变量|
 *       算法|模型|样本|口径|定义)|挖(数据|到)|数据挖掘|数据捕捞|
 *       直到(显著|p|出现|得到)|采到(显著|p|出现)|停(在|到)显著|
 *       kept (collecting|sampling|testing|running|adding) until|
 *       stop(ped)? (when|once) (the )?p
 *     择优报告形：只报告(显著|那些|符合|成功)|只保留(显著|那些)|
 *       只(发|列|公布|讲|说|留)(显著|成功|符合)|显著的(留下|留下|留下)|
 *       其余(都)?(略过|不提|扔掉|丢掉|删掉|放弃|舍弃)|挑(出)?(显著|好)|
 *       择优|择优选取|选择性报告|选择性公布
 *       EN: p-hacking|p ?hacking|data dredging|garden of forking|
 *       ran \d+ (comparisons|models|tests|specifications|analyses)|
 *       we tried \d+|switched (from|to) (the )?(primary|secondary)|
 *       switched (to|from) a|only the significant|dropped the rest|
 *       reported only|selective reporting|cherry-pick
 *   · 腿② CLAIM 显著性/结论封装（显著性词或结论封装词）：
 *     显著|显著性|p ?值|p ?[<>=]|小于 ?0\.0?5|低于 ?0\.0?5|有统计意义|
 *       统计上(成立|明显|成立)|结论成立|假设成立|被证明|证明|证实|
 *       支持(了)?(该|这个|此)?假设|符合预期|如预期|如事前|非常明显|
 *       效果确实|确实有效|有效|成功了|成功了|稳健|pseudo|伪装|包装成
 *       EN: significant|statistically significant|p ?[<>=]|p-value|
 *       p ?value|hypothesis (was )?(confirmed|supported)|
 *       proves|confirmed|supported the hypothesis|as predicted|
 *       as expected|presented as (?:an? )?(?:a priori|prior|predicted)|
 *       as if (?:he|she|they|we) (?:had )?(?:predict|expect|forecast|know)
 *   腿②须与腿①相距 WIN_FLEX_CLAIM（ZH 120 字 / EN 320 字符）以内，且
 *   **未被否定**（匹配点前 12 字 / EN 18 字符内不能/不应/未必/不代表/
 *   不意味着/无法/not/never/doesn't/cannot）——「无法得出显著结论」
 *   是正确判别，不是本族攻击。
 *
 * 为什么取 VERIFY 级：单句也可能是对研究者自由度的**正确描述与批评**
 * （「这个研究没有预注册，存在 p-hacking 的风险」正是本族要教的判别动
 * 作）、课堂案例、论文方法学转述、科研诚信报道的概括。rewrite 会误伤
 * 这些正当文本（与 r206-r211 评价族同口径）。verify 的含义是「这段文本
 * 用被结果反向决定的分析流程支撑了显著性结论，需要回到预注册/事前固定
 * 的分析方案再评估证据强度」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（研究者自由度/数据挖掘/事后分析/HARKing/p-hacking/
 *     预注册/多重比较/择优报告/分叉路径/可重复性/科研诚信/统计学/教材/
 *     课堂/论文/方法学/悖论/称为/定义为/概念；EN researcher degrees of
 *     freedom / garden of forking paths / HARKing / p-hacking / data
 *     dredging / preregistration / multiple comparisons / selective
 *     reporting / replicability / research integrity / textbook /
 *     statistics / methodology / called / defined / concept——讨论这个
 *     概念本身不是运用它）；
 *   · 正确响应形（预注册/校正/承认局限并要求补证据）：预注册|事前登记|
 *     注册报告|分析方案(已)?(固定|公开|事前)|采集数据前|数据采集前|
 *     收集数据前|事先(确定|固定|设定)|多重比较校正|校正|Bonferroni|
 *     FDR|假发现率|预先设定|明确标注|事后分析(标注|说明)|我们无法得出|
 *     无法得出|需要扩大样本|需要更大样本|功效不足|样本量不足|无法检验|
 *     尚需验证|仍待|有待验证|存疑|可疑|站不住|说不通|暴露了|反映了问题|
 *     EN preregistered|pre-registered|registered report|
 *     analysis plan (was )?(fixed|public|specified) in advance|
 *     before (collecting|gathering) (any )?data|specified in advance|
 *     Bonferroni|false discovery rate|FDR|adjusted for multiple|
 *     labeled as (?:a )?post-hoc|cannot conclude|insufficient|
 *     underpowered|needs? a larger sample|further verification|
 *     remains to be seen——**承认流程被结果污染并要求回到预注册方案，
 *     正是本族要教的判别动作**；
 *   · 无腿②（没有任何显著性/结论封装词）——缺「结论封装」即无被污染的
 *     结论可断言，不判；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/还要看/
 *     而不是/而非；EN does not mean / not necessarily / depends on /
 *     而不是 / cannot conclude）；
 *   · 疑问句（含 ?/？，且无反问标记——反问标记形与 r216 collider_bias
 *     同口径：难道/岂/凭什么/何尝/岂不是/谈何/…吗？/ isn't it /
 *     doesn't that / how else / what else / who doesn't / if not）。
 */

// ─── 腿① FLEX 流程被结果反向决定的动作（中文）──────────────────────
// r161 教训：枚举腿必须含裸名词形态——「事后」「反推」「数据挖掘」
// 去掉前后缀仍须命中。
const FLEX_ZH = [
  // 顺序倒置形（先看结果再提假设）
  /先看(?:了)?(?:结果|数据)/,
  /看(?:了|过)(?:数据|结果)/,
  /看完(?:数据|结果)/,
  /数据看(?:完|到)/,
  /(?:从|由)结果(?:反推|推导|倒推|反推出来)/,
  /反推出来/,
  /结果(?:已?知|出来)(?:之?后|再)/,
  /出了结果(?:再|后)/,
  // [r217 收紧] 不收裸「事后」——「结果事后被证实」这类正当转述会被误判；
  // 只收「事后 + 流程动作」形。
  /事后(?:提|补|追加|才|重新|改|定义|设定|再|决定|选择|确定|调整)/,
  /HARKing|harking/i,
  // 反复尝试形（optional stopping / 多重比较择优）
  /反复(?:采样|尝试|检验|比较|测试|运行|做|分析|试)/,
  /试(?:了|过)?(?:很多|几十|上百|多个|各种|不同|好几种)/,
  /不断(?:尝试|采样|检验|调整|重新)/,
  /一次次/,
  /重新(?:分析|计算|检验|运行|定义|设定|解释)/,
  /换(?:了)?(?:个|一种|一个)?(?:指标|终点|标准|变量|算法|模型|样本|口径|定义|标准)/,
  /挖(?:数据|到|出来)/,
  /数据挖掘|数据捕捞|捞数据/,
  // [r217 补] 事后换终点/换标准：不要求「事后」字样，「换了 + 终点/指标/标准」即可
  /(?:换|改|变更|改换|更改)(?:了|过)?(?:个|一种|一个|别的|另一)?(?:指标|终点|标准|变量|口径|定义|算法|模型|样本|判据)/,
  /(?:主|主要|首要)?(?:终点|指标|标准)(?:不|未)(?:显著|达标|合格|理想)/,
  /(?:替代|替代性|另一个|次要|次要的)(?:终点|指标|标准|变量|口径)/,
  /substitute|alternative\s+(?:endpoint|outcome|metric)/i,
  /我们做了(?:几十|几十个|很多|许多|上百|几十多|多个)(?:次)?(?:回归|实验|检验|比较|分析|模型|运算|试)/,
  /(?:做|跑|试|运行)(?:了)?(?:几十|几十个|很多|许多|上百|四十多|多个)(?:次)?(?:回归|实验|检验|比较|分析|模型)/,
  /只(?:留下|保留|留下|剩|剩下)(?:了)?(?:p|显著|那些|符合)/,
  /留下(?:了)?(?:p|显著)/,
  /直到(?:显著|p|出现|得到|看见|看到)/,
  /采到(?:显著|p|出现)/,
  /停(?:在|到)显著/,
  /kept\s+(?:collecting|sampling|testing|running|adding)\s+until/i,
  /stop(?:ped)?\s+(?:when|once)\s+(?:the\s+)?p/i,
  /p-?hacking/i,
  /data\s+dredging/i,
  /garden\s+of\s+forking/i,
  /ran\s+\d+\s+(?:comparisons|models|tests|specifications|analyses)/i,
  /we\s+tried\s+\d+/i,
  /tried\s+(?:dozens|hundreds|many|several)\s+of/i,
  // 择优报告形
  /只报告(?:显著|那些|符合|成功)/,
  /只保留(?:显著|那些|符合)/,
  /只(?:发|列|公布|讲|说|留)(?:显著|成功|符合)/,
  /显著的(?:留下|保留|呈现|报告)/,
  /其余(?:都)?(?:略过|不提|扔掉|丢掉|删掉|放弃|舍弃)/,
  /挑(?:出)?(?:显著|好|出来)/,
  /择优(?:选取|报告|挑选)/,
  /选择性(?:报告|公布|呈现)/,
  // [r217 补] 「只报告显著结果」族：动作前置（只报告/只保留 + 结果名词）
  /只报告(?:的|了|过)?(?:结果|发现|结论|数据|那些|其中)/,
  /只保留(?:的|了|过)?(?:结果|发现|结论|数据|那些|其中)/,
  /只(?:发|列|公布|讲|说|留)(?:的|了|过)?(?:结果|发现|结论|数据)/,
  /其余(?:的)?(?:都)?(?:略过|不提|扔掉|丢掉|删掉|放弃|舍弃|抹掉|隐去|隐瞒)/,
  // [r217 补] 「先看结果再决定提哪个假设」族：顺序倒置 + 决定/选择形
  /(?:先|首先)(?:把|将)?(?:结果|数据)(?:翻|拿|调|取|拉)(?:出来|出来|来)/,
  /(?:先|首先)(?:看|看一|翻看|浏览)(?:了|过)?(?:结果|数据)/,
  /(?:再|然后)(?:决定|选择|确定|挑)(?:要)?(?:提|报|写|讲)(?:哪个|什么|哪一个)?/,
  /再决定(?:要)?(?:提|报|写|讲)/,
  // [r217 补] 「做了 N 个回归/检验」族：复数化动作裸名词形态
  /(?:做|跑|试|运行|分析)(?:了|过)?(?:几十|几十个|很多|许多|上百|几十多|多个|多次|若干)(?:个|次)?(?:回归|实验|检验|比较|分析|模型|运算|试)/,
  /(?:几十|几十个|很多|许多|上百|四十多|多个|多次)(?:个|次)?(?:回归|实验|检验|比较|分析|模型)/,
  /switched\s+(?:from|to)\s+(?:the\s+)?(?:primary|secondary)/i,
  /switched\s+(?:to|from)\s+a/i,
  /only\s+the\s+significant/i,
  /dropped\s+the\s+rest/i,
  /reported\s+only/i,
  /selective\s+reporting/i,
  /cherry-?pick/i,
  /reverse-?engineered/i,
];

// ─── 腿② CLAIM 显著性/结论封装（中文）──────────────────────────────
const CLAIM_ZH = [
  /显著|显著性/,
  /p\s*值|p\s*[<>=]|小于\s*0\.0?5|低于\s*0\.0?5/,
  /有统计意义|统计上(?:成立|明显|支持)/,
  /结论成立|假设成立|被证明|证明|证实/,
  /支持(?:了)?(?:该|这个|此|上述)?假设/,
  /符合预期|如预期|如事前|非常明显|效果确实|确实有效|成功了|稳健/,
  /伪装成|包装成|乔装成|美化成/,
  /写成(?:了)?(?:事前|先验|事先)/,
  /(?:事前|先验|事先)(?:假设|预测)/,
  // [r217 补] 「让结果看起来…成立」的包装形
  /看起来(?:成立|有效|没错|像|是)/,
  /显得(?:成立|有效|合理|可信)/,
  /看上去(?:成立|有效|合理)/,
  /被证实|得到证实|获得证实/,
  /成立|站得住|站得住脚/,
];

// ─── 腿① FLEX / 腿② CLAIM（英文）──────────────────────────────────
const FLEX_EN = [
  /hypothes(?:ized|izing|is(?:ed|ing))?\s+after/i,
  /after\s+(?:seeing|looking\s+at|examining|analy[sz]ing)\s+(?:the\s+)?(?:data|results|findings|outcomes)/i,
  /reverse-?engineered\s+from/i,
  /presented\s+as\s+(?:an?\s+)?(?:a\s+priori|prior|predicted)/i,
  /as\s+if\s+(?:he|she|they|we)\s+(?:had\s+)?(?:predict|expect|forecast|know)/i,
  /kept\s+(?:collecting|sampling|testing|running|adding)\s+until/i,
  /stop(?:ped)?\s+(?:when|once)\s+(?:the\s+)?p/i,
  /p-?hacking/i,
  /data\s+dredging/i,
  /garden\s+of\s+forking/i,
  /ran\s+\d+\s+(?:comparisons|models|tests|specifications|analyses)/i,
  /we\s+tried\s+\d+/i,
  /tried\s+(?:dozens|hundreds|many|several)\s+of/i,
  /switched\s+(?:from|to)\s+(?:the\s+)?(?:primary|secondary)/i,
  /only\s+the\s+significant/i,
  /dropped\s+the\s+rest/i,
  /reported\s+only/i,
  /selective\s+reporting/i,
  /cherry-?pick/i,
  /kept\s+the\s+ones\s+that\s+came\s+out/i,
  /post[- ]?hoc\s+hypothes/i,
  // [r217 补] optional stopping / 反复分析 / 换终点（EN 裸形）
  /reanaly[sz]ed\s+the\s+data\s+(?:many\s+times|repeatedly|again\s+and\s+again|until)/i,
  /re-?ran\s+(?:the\s+)?(?:analysis|model|regression)s?\s+(?:many\s+times|repeatedly|until)/i,
  /many\s+times\s+until/i,
  // [r217 补] 反复分析（reanalyzed…many times until）——上面两条要求
  // the data / the analysis 紧随，实测 "reanalyzed the data many times until"
  // 仍漏，因 "the data" 与 "many times" 之间被 "many times" 隔开后再接 until。
  /reanaly[sz]ed\s+(?:the\s+)?(?:data|results|findings|dataset)s?\s+(?:many\s+times|repeatedly|again\s+and\s+again|until|multiple\s+times)/i,
  /re-?ran\s+(?:the\s+)?(?:analysis|analyses|model|models|regression|regressions)s?\s+(?:many\s+times|repeatedly|again\s+and\s+again|until|multiple\s+times)/i,
  /analy[sz]ed\s+(?:the\s+)?(?:data|results|findings|dataset)s?\s+(?:many\s+times|repeatedly|again\s+and\s+again|until|multiple\s+times)/i,
  /collected\s+(?:more\s+)?data\s+until/i,
  /until\s+(?:the\s+)?p-?value\s+(?:dropped|fell|went|was)\s+below/i,
  /until\s+(?:a\s+|an\s+|the\s+)?(?:significant|desired|favou?rable|expected)\s+(?:effect|result|outcome|finding)/i,
  /sampled\s+(?:again\s+and\s+again|repeatedly)\s+until/i,
  /until\s+(?:a\s+|an\s+|the\s+)?(?:significant|desired|favou?rable|expected)\s+(?:effect|result|outcome|finding)/i,
  /switched\s+(?:from|to)\s+(?:the\s+)?(?:primary|secondary|main|alternative)/i,
  /switched\s+(?:to|from)\s+(?:a|an|the)\s+(?:secondary|alternative|substitute|different)/i,
  /secondary\s+outcome/i,
  /only\s+kept\s+(?:the\s+)?(?:significant|ones|those)/i,
  /kept\s+only\s+(?:the\s+)?(?:significant|ones|those)/i,
  /ran\s+(?:dozens|hundreds|many|several|\d+)\s+of\s+(?:regressions|models|tests|comparisons|specifications|analyses)/i,
  /tried\s+(?:dozens|hundreds|many|several|\d+)\s+(?:of\s+)?(?:regressions|models|tests|comparisons|specifications|analyses|outcome\s+measures)/i,
  /primary\s+(?:endpoint|outcome|metric)s?\s+(?:was|were)\s+(?:not|n'?t)\s+significant/i,
  // [r219 补] 「switched to a secondary outcome that was.」的回指 claim：
  // "that was" 指回 primary 的 significant，无显式 claim 词，FLEX 自足。
  /switched\s+(?:to|from)\s+(?:a|an|the)\s+(?:secondary|alternative|substitute|different)\s+(?:outcome|endpoint|metric|measure|analysis)/i,
  /secondary\s+(?:outcome|endpoint|metric)s?\s+(?:that\s+)?(?:was|were)\b/i,
];

const CLAIM_EN = [
  /statistically\s+significant|significant/i,
  /p\s*[<>=]|p-?value|p\s+value/i,
  /hypothesis\s+(?:was\s+)?(?:confirmed|supported)/i,
  /proves|confirmed|supported\s+the\s+hypothesis/i,
  /as\s+predicted|as\s+expected/i,
  /presented\s+as\s+(?:an?\s+)?(?:a\s+priori|prior|predicted)/i,
  /as\s+if\s+(?:he|she|they|we)\s+(?:had\s+)?(?:predict|expect|forecast|know)/i,
  /reverse-?engineered/i,
  /worked\s+out|held\s+up/i,
  // [r219 补] 回指 claim："switched to a secondary outcome that was."
  // 的 "that was (significant)" 无显式 claim 词，靠 that was/were + 前述
  // 的 significant 语境共同构成结论封装。
  /\bthat\s+(?:was|were)\b/i,
  /\bwhich\s+(?:was|were)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /研究者自由度|科研自由度|自由度/,
  /数据挖掘|数据捕捞/,
  /事后分析|事后检验|事后比较/,
  /HARKing|harking/i,
  /p-?hacking/i,
  /预注册|事前登记|注册报告/,
  /多重比较|多重检验|多重测试/,
  /择优报告|选择性报告|选择性公布/,
  /分叉路径|可重复性|可复现|复现性|科研诚信|学术诚信/,
  /统计学|统计方法|教材|课堂|教科书|讲座|教案|习题|悖论|方法学|方法论|称为|定义为|概念|所谓|理论|课程|教学中/,
  // [r219 收紧] 「论文」「文献」不单独作豁免——「写入论文」恰恰是攻击
  // 语境；只收「论文+教学/方法学动词」形（见 EXEMPT_META_ZH_PAPER）。
];
const EXEMPT_META_EN = [
  /researcher\s+degrees?\s+of\s+freedom/i,
  /garden\s+of\s+forking\s+paths/i,
  /HARKing/i,
  /p-?hacking/i,
  /data\s+dredging/i,
  /preregist(?:ered|ration)|pre-?regist(?:ered|ration)/i,
  /registered\s+report/i,
  /multiple\s+comparisons/i,
  /selective\s+reporting/i,
  /replicab(?:le|ility)|reproducib(?:le|ility)|research\s+integrity/i,
  /textbook|lecture|statistics|stats\s+class|methodology|called|defined|concept/i,
];
// [r219 收紧] 论文/文献仅在与教学/方法学动词共现时才豁免：「论文里讲到」
// 「这篇文献讨论了」是概念转述；「写入论文」是攻击语境的封装动作。
const EXEMPT_META_ZH_PAPER = [
  /(?:论文|文献|报告|文章|著作)(?:中|里|内|上)?(?:写|讲|讨论|论述|阐释|解释|说明|介绍|提到|指出|分析|定义|称为|描述|回顾|综述|报道了?|披露了?)/,
  /(?:在|据|根据|按)(?:这|那|该|某)?(?:篇)?(?:论文|文献|报告|文章|著作)(?:中|里|内|上)?/,
];

// ─── 豁免二：正确响应形（预注册/校正/承认局限并要求补证据）───────
const EXEMPT_CORRECT_ZH = [
  /预注册|事前登记|注册报告/,
  /分析方案(?:已)?(?:固定|公开|事前|预先)/,
  /采集数据前|数据采集前|收集数据前|获取数据前/,
  /事先(?:确定|固定|设定|规定|明确)/,
  /多重比较校正|比较校正|校正|Bonferroni|FDR|假发现率/,
  /预先设定|事前设定/,
  /明确标注|事后分析(?:标注|说明|性质)/,
  /我们无法得出|无法得出|无法检验|检验不出/,
  /需要扩大样本|需要更大样本|样本量不足|功效不足|检验不足/,
  /尚需验证|仍待|有待验证|还需验证/,
  /存疑|可疑|站不住|说不通|说明存在|提示存在|暴露了|反映了问题/,
];
const EXEMPT_CORRECT_EN = [
  /preregist(?:ered|ration)|pre-?regist(?:ered|ration)/i,
  /registered\s+report/i,
  /analysis\s+plan\s+(?:was\s+)?(?:fixed|public|specified|set)\s+in\s+advance/i,
  /before\s+(?:collecting|gathering|obtaining)\s+(?:any\s+)?data/i,
  /specified\s+in\s+advance/i,
  /Bonferroni|false\s+discovery\s+rate|FDR/i,
  /adjusted\s+for\s+multiple/i,
  /labeled\s+as\s+(?:a\s+)?post-?hoc/i,
  /cannot\s+conclude|can'?t\s+conclude|insufficient|underpowered/i,
  /needs?\s+a\s+larger\s+sample/i,
  /further\s+verification|remains\s+to\s+be\s+seen/i,
];

// ─── 否定守卫（窗口化：查结论封装词前的否定标记）─────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|无法|未能|不许|不容|不显著|未显著|未达|不达标|不成立|未成立|并未成立|尚未成立|没能成立|不能成立|不支撑|未支撑|无法支撑|无法支持|得不出|不能得出|推不出/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|no|unlikely|failed\s+to|unable\s+to)\b/i;

// 邻近窗
const WIN_FLEX_CLAIM_ZH = 120;  // 腿① ↔ 腿②
const WIN_FLEX_CLAIM_EN = 320;
// 否定守卫回看窗
const NEG_WIN_ZH = 12;
const NEG_WIN_EN = 18;

// 反问标记（与 r216 collider_bias 同口径：仅无反问标记的疑问句才豁免）
const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的/;
const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;

// 推理否定/对冲（句级豁免）
const HEDGE_ZH = /不代表|不意味着|推不出|未必|不一定|取决于|还要看|而不是|而非/;
const HEDGE_EN = /\b(?:does\s+not\s+mean|not\s+necessarily|depends\s+on|cannot\s+conclude|can'?t\s+conclude)\b/i;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

// 收集某腿全部命中位置（含匹配文本，供否定守卫用）
function allMatches(list, text) {
  const out = [];
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const reG = new RegExp(re.source, flags);
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ index: m.index, text: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;  // 防零宽死循环
    }
  }
  return out;
}

function firstIdx(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

// 否定守卫：结论封装词前的否定标记
// [r219 关键修正] 否定必须**紧邻** claim，不能整窗命中。反例：
// 「因为主终点不显著，我们换了一个显著的关键次要终点」——claim「显著」
// （换上来的次要终点）的 12 字窗内含有别处的「不显著」，整窗 NEG_ZH
// 把它误杀，导致本该命中的换终点攻击漏判。
// 现在的口径：claim 起点前 2 字（EN 12 字符）内出现否定词才算否定，
// 覆盖「不显著」「未显著」「并不显著」「无法得出」「not significant」
// 这类紧贴形；别处的否定不再波及。
function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const adj = isZh ? text.slice(Math.max(0, idx - 2), idx) : text.slice(Math.max(0, idx - 12), idx);
  if (isZh) {
    return /[不未没无毫]|并非|决不|并未|尚未|难以|无法|未能|谈不上|称不上|算不上/.test(adj);
  }
  return /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|failed\s+to|unable\s+to)\b/i.test(adj);
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkResearcherDegreesOfFreedom(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免（反问标记不豁免，同 r216 collider_bias 口径）
  if (/[?？]/.test(text)) {
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 概念/教学转述：讨论这个概念本身不是运用它
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // [r219 收紧] 论文/文献需与教学动词共现才豁免
  if (anyHit(R.EXEMPT_META_ZH_PAPER || EXEMPT_META_ZH_PAPER, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确响应形：预注册/校正/承认局限并要求补证据，正是本族要教的判别动作
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 推理否定/对冲（句级）
  if (HEDGE_ZH.test(text) || HEDGE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const flexList = isZh ? (R.FLEX_ZH || FLEX_ZH) : (R.FLEX_EN || FLEX_EN);
  const claimList = isZh ? (R.CLAIM_ZH || CLAIM_ZH) : (R.CLAIM_EN || CLAIM_EN);
  const win = isZh ? WIN_FLEX_CLAIM_ZH : WIN_FLEX_CLAIM_EN;

  // 主判据：腿① 流程被结果反向决定 × 腿② 显著性/结论封装
  // 取全腿命中集合中**距离最近且腿②未被否定**的一对（腿②可在腿①之前，
  // 如「因为主终点不显著，我们换了一个显著的关键次要终点」——结论词
  // 「不显著」在前但已被否定，须取其后的未否定命中）。
  // [r219 修正] 先按未否定过滤腿②；若全被否定，不判。
  // 「因为主终点不显著，我们换了一个显著的关键次要终点」：claim「不显著」
  // 与 claim「显著」都在场内——前者指被换掉的主终点（正当否定），后者指
  // 换上的次要终点（未否定）。所以过滤后必须仍存在未否定 claim 才判，
  // 该句有未否定的「显著」，本应命中；漏判来自 claim 表未收「关键次要终点」
  // 的后续 claim 词，已由 FLEX_ZH 的「(?:替代|另一个|次要)终点」+ CLAIM_ZH
  // 「显著」覆盖，无需再动否定逻辑。
  const flexHits = allMatches(flexList, text);
  const rawClaimHits = allMatches(claimList, text);
  if (flexHits.length === 0 || rawClaimHits.length === 0) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 未否定的腿②；若一个都没有，说明所有结论封装都被否定，不判
  // [r219 修正] 否定守卫必须**紧邻** claim，不能整窗命中：
  // 「因为主终点不显著，我们换了一个显著的关键次要终点」——claim「显著」
  // （换上来的次要终点）的 12 字窗内含有别处的「不显著」，整窗 NEG_ZH 会
  // 把它误杀。改为：窗口内**紧贴 claim 起点**的否定才算否定（含
  // 「不/未/没 + claim 首字」与「不 + 2 字内插入形」）。
  const claimHits = rawClaimHits.filter((c) => !negatedBefore(text, c.index, isZh));
  if (claimHits.length === 0) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  let bestDist = Infinity;
  let bestClaim = null;
  let bestFlex = null;
  for (const f of flexHits) {
    for (const c of claimHits) {
      const d = Math.abs(c.index - f.index);
      if (d > win) continue;
      if (negatedBefore(text, c.index, isZh)) continue;
      if (d < bestDist) { bestDist = d; bestClaim = c; bestFlex = f; }
    }
  }

  if (bestClaim && bestFlex) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh
        ? '分析流程被结果反向决定(流程自由度动用)后用作显著性结论(zh)'
        : 'analysis flow determined by observed results, then used as significance claim(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkResearcherDegreesOfFreedom,
  __internals: () => ({
    FLEX_ZH, CLAIM_ZH, FLEX_EN, CLAIM_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
    NEG_ZH, NEG_EN, WIN_FLEX_CLAIM_ZH, WIN_FLEX_CLAIM_EN,
    RHETORICAL_ZH, RHETORICAL_EN, HEDGE_ZH, HEDGE_EN,
  }),
};
