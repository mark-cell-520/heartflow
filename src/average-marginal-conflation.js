/**
 * src/average-marginal-conflation.js — 「平均≠边际」检测器
 * （第 214 个判别维度，r220 起草；8 处 src/index.js 接线由 1 号主力补全，
 * 接线规格见 coordination/reports/r220-dimension-agent4.md §五）
 *
 * [r220 立项] r220 前置零命中探针（coordination/agent4/probes/
 * r220-zerohit-probe.js，v6.8.144 实测）：「D 平均≠边际」族攻击样本
 * 9 条全部 gate.action=pass（中英双语、全部去掉绝对词的结构形——
 * r217 原样本带「一定/必然」会被 reasoning_coherence/absolute_claim
 * 代拦，本族证明的是**结构本身**无人管：换成无绝对词措辞后照样零
 * 命中），良性对照 4/4 pass（零误伤）。覆盖度检查（r220 grep 实测）：
 * 平均/单台/摊薄/边际/增产/扩产/average/marginal/per-unit 在 src/
 * 下没有任何维度以「用平均值推断边际值」为判据——simpsons_paradox
 * (206) 管聚合层与子群层的趋势方向逆转（两层数据都在场），
 * ecological_fallacy(211) 管群体性质向个体迁移，whole_part_transfer
 * (170) 管部分↔整体质量词搬运，statistical_misleading(58) 管小基数
 * 比例，proxy_metric_goal(187) 管代理指标当目标；平均-边际推断这
 * 个经济学推理结构无任何 dimMap 键覆盖。变量名 amc grep 0 命中无
 * 冲突。
 *
 * 外部来源：空返，按既有形态自建。r220 海外扫描（arXiv 宽查询被
 * API 拆成 OR 得 312673 条全是机器人/能源文献零相关；短语精确
 * "marginal cost" AND fallacy 1 条（混合电解槽经济性论文，非推理
 * 谬误检测）、"marginal reasoning" 2 条（视频质量评估/LLM token
 * 经济，零相关）、"marginal analysis" AND decision 5 条（生鲜订货
 * 框架/无线切换/贝叶斯网络，零相关）、"sunk cost fallacy" AND
 * detection 1 条（GAMBiT 认知传感器，LLM 行为分析非纯规则）；
 * GitHub repos 0×3；S2 连续 429）——无可集成的纯规则实现，判据为
 * 心虫自有纯规则实现（家族定义取自边际分析/marginal analysis 的
 * 标准经济学描述：决策应看边际量，平均量与边际量之间没有推论
 * 关系）。
 *
 * 辨别的族：平均值被当成边际值（average-marginal conflation / 平均
 * ≠边际）——把**已经摊薄的平均**当成**下一个单位/增量**的成本或
 * 收益，或直接拿平均值做增量决策：
 *   单台成本已经压到这么低了，说明再生产一台更便宜。
 *   平均每个产品能赚不少，产量继续往上加，利润只会越滚越多。
 *   Average cost has fallen so far that the next unit is cheaper.
 *   Each unit earns a healthy margin on average, so pushing volume
 *   higher will keep raising profit.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：边际分析
 * 是理性决策的基本纪律——要不要多做一件事，只看**这件事本身**的
 * 额外成本与额外收益，与已经花掉的、已经摊薄的平均值无关。平均
 * 成本是历史存量除以产量得到的**混合量**，边际成本是增量本身的
 * **属性**，两者之间没有推论关系：平均成本下降时边际成本通常在
 * 上升（规模不经济的起点），平均每个产品赚钱时新增一个产品可能
 * 在亏。该混淆是「扩产翻车」的推理底座——用摊薄的漂亮平均数给
 * 增量决策背书，也是财务汇报里最常见的自我说服话术（平均利润率
 * 好看所以增产没错）。它直接破坏心虫对经济与资源推理的判别能
 * 力，且与统计族维度互补：那些族管数据怎么读，本族管增量决策
 * 怎么做。
 *
 * 与既有维度的边界（r220 归因）：
 *   · simpsons_paradox（第 206 维）管聚合层与子群层**趋势方向相
 *     反**（两层数据都在场），本族不管子群、管平均值与边际值的
 *     推断关系，句中可以没有任何分层数据。
 *   · ecological_fallacy（第 211 维）管群体性质向**个体**迁移，本
 *     族是**平均量向边际量**迁移，个体/群体都在场也不判。
 *   · whole_part_transfer（第 170 维）管部分↔整体的涌现性**质量
 *     词**搬运，本族的腿是成本/收益**数值量**，且必须有边际/增量
 *     参照腿。
 *   · sunk_cost_coercion（第 98 维）管「已投入×必须继续」，本族
 *     与投入无关，管平均与边际的混淆；「设备已经买了所以再生产
 *     一台只是材料钱」归它（沉没成本形），本族不收。
 *   · statistical_misleading（第 58 维）/percentage_overflow 管比
 *     例数字的呈现问题，本族不管数字大小与占比。
 *   · proxy_metric_goal（第 187 维）管拿代理指标当目标，本族不涉
 *     及指标与目标的关系。
 *   · absolute_claim/reasoning_coherence 只兜带绝对词的形（r217
 *     实测 D1/D2 即被此代拦）；本族攻击形全部无绝对词（探针 9/9
 *     实证），两族互补不重叠。
 *
 * 判据（腿① 平均值 × 腿② 边际/增量参照 × 腿③ 边际侧结论，缺一
 * 不判；六形任一——F-5 为 [r303] 新增的速率型平均值平行族）：
 *   · 腿① AVG 平均值陈述：平均成本/平均费用/单台成本/单位成本/
 *     每台成本/摊到每/摊薄后/平均利润/单台利润/平均客单价/平均
 *     每个…赚；EN average cost / unit cost / per-unit cost / cost
 *     per unit / on average / average profit / average unit /
 *     average customer。
 *   · 腿② MARG 边际参照：边际成本/边际收益/下一台/再生产一台/
 *     再多做一件/每多一/新增一批；EN marginal cost / the next
 *     unit / one more unit / an additional unit。INCR 增量动作（增产
 *     /扩产/放量/加大产量/新增用户/expanding output / pushing
 *     volume / adding more units）与量化边际参照共同充当腿②。
 *   · 腿③ CONCL 边际侧结论：更便宜/更低/花不了多少钱/下降/可忽略
 *     （成本侧）；利润越滚越多/增厚利润/赚得更多/收入更高/也会付
 *     费（收益侧）；EN cheaper / lower / costs less / more profit /
 *     keeps raising profit / will pay。
 *   · F-1 推断链形：腿① →（推断词 所以/因此/说明/意味着/显然/肯定/
 *     必然；EN so/which means/implies/clearly/must）→ 腿② → 腿③，
 *     三段跨度各查否定守卫。
 *   · F-2a 增量决策形：腿① × 增量动作/量化边际参照 × 腿③（收益
 *     侧），逗号并置即可，不要求推断词（「平均每个产品能赚不少，
 *     产量继续往上加，利润只会越滚越多」）。
 *   · F-2b 扩产建议形：腿① × 经济名词 × 值得/可以/尽管 + 扩产/增
 *     产（EN worth expanding / can scale up）——拿平均值直接给增
 *     量行动背书。
 *   · F-3 反问形：腿① × 增量参照 × 还能贵到哪去/能高到哪去（EN
 *     how expensive can … be）——用问号包装的断言仍是断言。
 *   · F-4 反向归因形：腿③ + 因为/毕竟 + 腿①（EN cheaper …
 *     because the average cost …）——先给边际结论再拿平均值当归因。
 *   · [r303] F-5 速率型平均值 → 边际量（新增平行族）：腿①' 速率/
 *     产量型平均值（平均每小时产出/平均亩产/平均产能/平均响应时间；
 *     EN average output / average yield / throughput / average
 *     response time）× 腿②' 资源形边际参照（再开一台机器/再多一个
 *     用户/再加班一小时；EN one more machine / one more member /
 *     the next delivery）× 腿③' 数量型边际结论（多五十件/也是两秒/
 *     多五次登录；EN must add ten more units / 30 more clicks）。
 *     r220 立项时只覆盖**货币型**平均值与结论，AP→MP（平均产量推
 *     边际产量）这一最教科书形式整体缺席——scripts/round-303/
 *     probe-module-amc.js 实测 14/14 攻击改前全 miss。
 *
 * 为什么取 VERIFY 级：单句也可能是**省略语境的正当决策陈述**（商
 * 业口述里「平均成本低所以扩产」常是「边际账已经算过」的省略），
 * 也可能是新闻转述、课堂案例、对他人观点的引述；rewrite 会误
 * 伤。verify 的含义是「这段文本在用平均值推断边际值，需要把平均
 * 量与边际量分开、按边际成本收益重新核算增量决策后再下结论」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 教学/概念转述（教材/课堂/论文/经济学/边际分析/概念/谬误/
 *     认知偏误；EN textbook/economics/marginal analysis/fallacy/
 *     misconception）——讨论这个概念本身不是运用它；
 *   · 正确响应形（不代表/不意味着/不等于/两回事/先算边际/算过边
 *     际/按边际/边际账/不能只看/分开算；EN does not mean/does not
 *     imply/distinguish/compare marginal/ran the marginal numbers/
 *     can't just look at）——把平均与边际分开陈述，正是本族要教
 *     的判别动作；
 *   · 对冲（可能/也许/或许/大概/似乎/通常/往往/有待；EN maybe/
 *     perhaps/might/probably/typically/usually/tends to）——概率
 *     化结论不作谬误判定；
 *   · 只有平均值没有边际/增量参照与结论（「我们的平均成本是每件
 *     12 元」「平均成本下降，边际成本也下降」是事实并陈，无推断
 *     动作）；
 *   · 疑问句（含 ?/？）——但反问标记（哪去/贵到哪/算什么/难道；
 *     EN how expensive can/if not）不豁免：F-3 形专收。
 */
'use strict';

// ─── 腿① AVG 平均值陈述（中文）────────────────────────────────────
const AVG_COST_ZH = [
  /平均成本|平均费用|平均开销|平均花费|平均单价|平均价格|单台成本|单件成本|单位成本|每台成本|每件成本|每个成本|单均成本|每单成本|平均生产成本|平均制造成本/,
  /摊到每[^。；，]{0,6}(?:成本|费用|价格|开销|支出)/,
  /摊薄(?:后|到|至)[^。；，]{0,8}(?:成本|费用|价格|开销|支出)/,
];
const AVG_RETURN_ZH = [
  /平均利润|平均毛利|平均收益|平均收入|平均客单价|平均营收|单台利润|单件利润|单均利润|每台利润|单均产值|平均产值|平均回报/,
  /平均每个[^。；，]{0,10}(?:赚|利润|收益|收入|毛利|贡献|付费|掏钱|买单|产值)/,
  /单台[^。；，]{0,6}(?:利润|赚|收益|毛利|回报)/,
  /每个(?:用户|客户|订单|买家|会员)[^。；，]{0,6}(?:都|均|总)?(?:能|可)?(?:赚|贡献|付费|带来|产出)/,
];

// ─── 腿② MARG 边际参照（中文）─────────────────────────────────────
const MARG_ZH = [
  /边际成本|边际收益|边际利润|边际价格|边际效用|边际产出|边际贡献|边际(?:的)?(?:成本|收益|利润|价格|效用|产出)/,
  /下一(?:台|件|个|批|单|单位)/,
  /再(?:生产|产|做|造|来|加)[一两三四五几]?(?:台|件|个|批|单位)/,
  /多(?:生产|做|造|产)[一两三四五几]?(?:台|件|个|批|单位)/,
  /每多[一几]?(?:台|件|个|批|单位)/,
  /新增[一两三四五几]?(?:批|台|件)/,
];

// ─── 腿②' INCR 增量动作（中文；F-2a 专用，含量化边际参照）─────────
const INCR_ZH = [
  /增产|扩产|放量|加量|扩大产能|扩大产量|增加产量|提升产量|加大产量|批量加大|扩产能/,
  /产量[^。；，]{0,8}(?:往上加|继续加|继续提升|往上走|继续拉高)/,
  /规模[^。；，]{0,4}扩大/,
  /新增用户|更多用户|下一个用户|每多一个用户/,
  /追加生产|加码生产/,
  /下一(?:台|件|个|批|单|单位)/,
  /再(?:生产|产|做|造|来|加)[一两三四五几]?(?:台|件|个|批|单位)/,
  /多(?:生产|做|造|产)[一两三四五几]?(?:台|件|个|批|单位)/,
  /每多[一几]?(?:台|件|个|批|单位)/,
  /新增[一两三四五几]?(?:批|台|件)/,
];

// ─── 腿③ CONCL 边际侧结论（中文）──────────────────────────────────
const CHEAP_ZH = [
  /更便宜|便宜些|便宜|更低|低一?些|花不了多少钱|省不了多少|更省|下降|降低|走低|变便宜|越摊越薄|跟着降|随之下降|可以忽略|忽略不计|没什么成本|没多少成本|成本有限|成本很低/,
];
const PROFIT_ZH = [
  /利润[^。；，]{0,10}(?:越滚越多|越涨越高|越来越高|越来越厚|更高|更厚|增加|增厚|上涨|提升|变厚|更多|翻倍)/,
  /增厚利润|增厚了利润|做厚利润|抬高利润|更高利润|更多利润|利润更高/,
  /赚得更多|更赚钱|越做越赚|只会更赚|照样赚|一样赚|还是赚/,
  /收入[^。；，]{0,6}(?:更高|翻倍|上涨|增加|跟着涨|水涨船高|更多)/,
  /(?:也|都|照样|同样|一定|肯定)(?:会|能|愿意)?(?:付费|掏钱|买单|续费|转化|留存)/,
];

// ─── F-1 推断词（中文）────────────────────────────────────────────
const INFER_ZH = /所以|因此|因而|可见|说明|意味着|证明|表明|显然|肯定|必然|势必|足见|那就|相当于|无非|说白了|说到底|也就是说|即是/;

// ─── F-2b 扩产建议形（中文）：平均值 × 经济名词 × 值得/可以 + 增量动词
const F2B_ZH = /(?:平均|摊薄|单台|单位|每台|摊到每|单均|每个)[^。；！？]{0,40}(?:利润|赚|收益|收入|毛利|营收|产值|成本|费用)[^。；！？]{0,60}(?:值得|可以|尽管|放心|大胆|建议|应当|应该|宜|不妨)(?:继续|进一步|大力|尽快|抓紧)?(?:扩产|增产|放量|加量|扩大产能|扩大产量|扩大规模)/;

// ─── F-3 反问形（中文）：平均值 × 增量参照 × 还能贵到哪去 ─────────
const F3_ZH = /(?:平均|摊薄|单台|单位|每台|摊到每|单均)[^。？]{0,40}(?:再|多)(?:生产|产|做|造|来|加)[一两三四五几]?(?:台|件|个|批|单位)[^。？]{0,12}(?:贵到哪去|高到哪去|涨到哪去|贵得到哪去|能贵到哪|能高到哪|能贵到哪里|能高到哪里)/;

// ─── F-4 反向归因形（中文）：边际结论 + 因为/毕竟 + 平均值 ────────
const F4_ZH = /(?:更低|更便宜|花不了多少钱|省不了多少|增厚利润|越滚越多|赚得更多|更赚钱|越做越赚|值得扩产|可以扩产|尽管扩产|照样赚|一样赚|还会更高|可以忽略)[^。；，]{0,4}[，,]?\s*(?:因为|毕竟|是由于|就在于)[^。；，]{0,16}(?:平均|摊薄|单台|单位|每台|摊到每|单均)/;

// ─── 英文常量 ───────────────────────────────────────────────────────
const AVG_COST_EN = [
  /\baverage\s+(?:cost|price|expense|spending|spend)\b/i,
  /\b(?:unit|per[- ]unit)\s+cost\b/i,
  /\bcost\s+per\s+unit\b/i,
  /\bon\s+average\b/i,
];
const AVG_RETURN_EN = [
  /\baverage\s+(?:profit|margin|revenue|income|return|order\s+value|basket)\b/i,
  /\baverage\s+(?:unit|one|item|product|customer|user|order|account)\b/i,
  /\bper[- ](?:unit|user|customer|order)\s+(?:profit|margin|revenue)\b/i,
  /\bon\s+average\b/i,
  /\bearns?\s+a\s+healthy\s+margin\b/i,
];
const MARG_EN = [
  /\bmarginal\s+(?:cost|revenue|profit|price|utility|benefit|return|product)\b/i,
  /\bthe\s+next\s+(?:unit|one|item|batch|order)\b/i,
  /\b(?:one|1)\s+more\s+(?:unit|item|batch)\b/i,
  /\ban?\s+additional\s+(?:unit|item|batch)\b/i,
  /\banother\s+(?:unit|item|batch)\b/i,
  /\beach\s+additional\s+(?:unit|item)\b/i,
  /\bproduc\w+\s+(?:one|1)\s+more\b/i,
  /\bmake\s+(?:one|1)\s+more\b/i,
];
const INCR_EN = [
  /\bexpand\w*\s+(?:output|production|volume|capacity)\b/i,
  /\bscal(?:e|ing|ed)\s+up\b/i,
  /\bpush(?:ing)?\s+volume\b/i,
  /\bhigher\s+volume\b/i,
  /\b(?:increase|increasing|raise|raising|ramp\w*\s+up|boost\w*)\s+(?:output|production|volume|throughput)\b/i,
  /\badd\w*\s+more\s+units\b/i,
  /\bmore\s+units\b/i,
  /\bproduc\w+\s+more\b/i,
  /\b(?:new|next|additional|more)\s+(?:users?|customers?|buyers|orders|subscribers)\b/i,
  /\bthe\s+next\s+(?:unit|one|item|batch|order)\b/i,
  /\b(?:one|1)\s+more\s+(?:unit|item|batch)\b/i,
  /\ban?\s+additional\s+(?:unit|item|batch)\b/i,
  /\banother\s+(?:unit|item|batch)\b/i,
];
const CHEAP_EN = [
  /\bcheaper\b/i,
  /\bcosts?\s+less\b/i,
  /\bcost\s+(?:us\s+)?less\b/i,
  /\blower\b/i,
  /\bfalls?\b/i,
  /\bfalling\b/i,
  /\bdrops?\b/i,
  /\bdropping\b/i,
  /\bcosts?\s+(?:almost\s+)?nothing\b/i,
  /\b(?:almost\s+)?negligible\b/i,
];
const PROFIT_EN = [
  /\bprofits?\s+(?:will|would|keeps?|keep|should)\s+(?:rising|rise|growing|grow|increasing|increase|climbing|climb|going\s+up|thicken\w*)\b/i,
  /\b(?:raising|raise|grow\w*|increas\w*|thicken\w*|lift\w*)\s+(?:our\s+|the\s+)?profits?\b/i,
  /\bmore\s+profit\b/i,
  /\bearns?\s+more\b/i,
  /\brevenue\s+(?:will|would|should)?\s*(?:double|doubles|grow|grows|rise|rises|climb|climbs|increase|increases)\b/i,
  /\b(?:higher|more)\s+revenue\b/i,
  /\b(?:is|are|remains?|stays?|will\s+be|would\s+be|keeps?)\s+profitable\b/i,
  /\b(?:also|still|will|would|keeps?|to)\s+(?:pay|pays|paying|buy|buys|convert|converts|renew|renews|subscribe)\b/i,
];
const INFER_EN = /\b(?:so|therefore|thus|which\s+means|that\s+means|it\s+shows|shows|means|implies|hence|consequently|must|necessarily|inevitably|clearly|obviously|then|proves?)\b/i;

// ─── F-2b 扩产建议形（英文）────────────────────────────────────────
const F2B_EN = /\b(?:average|per[- ]unit|unit|on\s+average)\b[^.]{0,60}\b(?:cost|profit|margin|revenue|income|price|profitable|earn\w*|mak\w+\s+money)\b[^.]{0,60}\b(?:worth\s+(?:expand\w*|scal\w*\s+up)|(?:can|should|could|safe\s+to)\s+(?:expand\w*|scale\s+up|ramp\s+up|increase\s+(?:output|production|volume)))\b/i;

// ─── F-3 反问形（英文）─────────────────────────────────────────────
const F3_EN = /\b(?:average|per[- ]unit|unit|on\s+average)\b[^.]{0,60}\bhow\s+(?:expensive|much\s+more|much\s+higher|costly)\s+can\b/i;

// ─── F-4 反向归因形（英文）：边际结论 + because/since + 平均值 ─────
const F4_EN = /\b(?:cheaper|lower|costs?\s+less|more\s+profit|profits?\s+(?:will|would)\s+(?:rise|grow|increase|thicken)|earns?\s+more|worth\s+expanding|expand\s+output|higher\s+revenue)\b[^.]{0,40}\b(?:because|since)\b[^.]{0,40}\b(?:average|per[- ]unit|unit\s+cost|on\s+average)\b/i;

// ═══════════════════════════════════════════════════════════════════
// [r303] F-5「产量/效率/速率型平均值 → 边际量」平行族
//
// 缺口实证（scripts/round-303/probe-module-amc.js，v6.8.174 模块直调）：
// r220 立项时只覆盖「成本/利润/价格型平均值」（平均成本/单台利润/平均客
// 单价…），**产量、效率、速率型平均值整体缺席**——14 条攻击全部 miss：
//   平均每小时能生产十件，所以再加班一小时也能多产出十件
//   每台机器平均一天产五十件，所以再开一台机器就多五十件
//   平均亩产三吨，所以再种一亩地就能多收三吨
//   The average output is ten units per hour, so one more hour of
//   overtime must add ten more units.
//   Average yield is three tons per mu, so planting one more mu of
//   land must add three tons.
// 根因：存量腿①（AVG_COST/AVG_RETURN）与腿③（CHEAP/PROFIT）全是
// **货币量词汇**，而 average product / average yield / throughput
// → marginal product 这一平均-边际混淆最教科书的形式（AP 推 MP）
// 一条都不收。
//
// 设计纪律（同 r300/r301/r302）：
//   · **不并入存量数组**——AVG_COST_ZH/AVG_RETURN_ZH/MARG_ZH/INCR_ZH/
//     CHEAP_ZH/PROFIT_ZH 及其 EN 侧均有 r280/r265 轮 length===N 登记
//     断言，追加会打破存量单测；也不进 avgLegs()/conclLegs()（那会
//     同时放大 F-1/F-2a 召回面、有冲击 302 误拦基线之虞）。
//   · F-5 是**独立并行路由**：腿①'（AVG_RATE 速率型平均）× 腿②'
//     （RES 资源形边际参照 ∪ 存量 MARG/INCR）× 腿③'（QTY_CONCL
//     数量型边际结论），三腿共现 + 跨度否定守卫，复用共享豁免入口
//     （EXEMPT_META / EXEMPT_CORRECT / HEDGE 在主函数入口先判）与
//     negatedInSpan() / allIdx() / firstIdx()。
//   · 腿②' 刻意**新增 RES 常量**而不扩 MARG：存量 MARG_EN 只收
//     "one more unit/item/batch"，不收 "one more hour/machine/member/
//     rep/server/mu/impressions"——这些是本族的承重资源名词。
// ═══════════════════════════════════════════════════════════════════

// ─── F-5 腿①' AVG_RATE 产量/效率/速率型平均值（中文）──────────────
const AVG_RATE_ZH = [
  /平均每(?:小时|分钟|天|日|周|月|年|班|班次|秒)[^。；，]{0,14}(?:生产|产出|产|制造|加工|处理|完成|交付|下线|收|赚|卖出|签)/,
  /平均每(?:台|人|亩|个|条|辆|架|间|位|名|户|家|单|次|件)[^。；，]{0,12}(?:产|生产|产出|处理|完成|交付|收|赚|制造|加工|贡献|带来|登录|点击|购买|付费|复购)/,
  /每(?:台|条|个|辆)(?:机器|设备|产线|工人|员工|地|土地|门店|站点)[^。；，]{0,10}平均[^。；，]{0,10}(?:产|生产|产出|处理|收|下线)/,
  /平均(?:亩产|单产|产能|产量|吞吐量|处理量|产出|效能|人效|时效|工时|响应时间|处理时长|交付周期|交付时间|客单价|转化率|点击率|登录数|活跃数|复购率|进店|客流|在线人数|并发)/,
  /平均(?:每个|每位|每名|每户)?(?:用户|客户|订单|会员|买家|读者|学员|患者|工人|员工|成员|学生|农民|卖家|坐席|销售)[^。；，]{0,14}(?:生产|产出|处理|完成|交付|贡献|带来|购买|消费|点击|登录|付费|复购|签)/,
];

// ─── F-5 腿①' AVG_RATE（英文）────────────────────────────────────
const AVG_RATE_EN = [
  /\baverage\s+(?:output|yield|productivity|throughput|production|volume|capacity|rate|per[- ]unit\s+output)\b/i,
  /\baverage\s+(?:response|delivery|processing|handling|turnaround|session|visit|ticket|order|cycle|lead)\s+(?:time|length)\b/i,
  /\baverages?\s+(?:about\s+|roughly\s+|around\s+)?[\w.,]+\s+(?:units?|tickets?|orders?|items?|clicks?|visits?|sessions?|users?|customers?|deals?|requests?|impressions?|tons?|bushels?|repairs?|calls?)\s+(?:per|a|each|every)\b/i,
  /\b(?:on\s+average|per\s+(?:hour|day|week|month|shift|unit|user|customer|order|machine|acre|worker|rep|agent|server))\b[^.]{0,40}\b(?:produc\w+|yield\w*|process\w*|handl\w+|complet\w+|deliver\w+|clos\w+|serv\w+|ship\w*)\b/i,
  /\baverage\s+(?:clicks?|visits?|sessions?|logins?|signups?|orders?|purchases?|deals?|repairs?|calls?)\s+per\b/i,
];

// ─── F-5 腿②' RES 资源形边际参照（中文；"再多一个 X / 再开一台 X"）──
// 存量 MARG_ZH 只收「下一台/再生产一台/每多一台」的量词形，不收
// 「再开一台机器」「再种一亩地」「再多一个用户」「再加班一小时」
// 这类**动词 + 资源名词**形，故本族单立。
const RES_ZH = [
  /(?:再|又|多)(?:开|添|加|招|种|上|增|扩|铺|设|排|安排|投入|购买|采购)[一两三四五几]?(?:台|条|个|辆|架|间|位|名|户|家|亩|批|单|次|人|小时|分钟|天|单位)/,
  /(?:再|多)(?:加班|加时|增产|扩产|放量|加量|追加|加派|抽调)[一两三四五几]?(?:小时|分钟|天|人|班|次|台|条)/,
  /(?:再|又|也)多(?:一|两|几)?(?:个|台|条|辆|架|间|位|名|户|家|人|亩|批|单|次|小时|分钟|天|单位)/,
  /每多(?:一|两|几)?(?:个|台|条|位|名|户|家|人|亩|批|单|次|小时|分钟|天|单位)/,
  /(?:再|多)来(?:一|两|几)?(?:个|位|名|户|家|人|单|批)/,
  /下一(?:个|台|条|位|名|户|家|单|批|次)/,
  /(?:再|多)(?:生产|产|做|造|加工|处理|交付)[一两三四五几]?(?:件|台|个|批|单|单位)/,
];

// ─── F-5 腿②' RES（英文；"one more X" 资源名词形）────────────────
const RES_EN = [
  /\b(?:one|1|two|2|three|3|another|an?\s+extra|an?\s+additional)\s+more\s+(?:thousand|hundred|million|[\w.,]+\s+)?(?:hour|hours|shift|day|days|week|weeks|machine|machines|server|servers|worker|workers|employee|employees|rep|reps|agent|agents|member|members|person|people|line|lines|unit|units|mu|acre|acres|batch|batches|order|orders|deal|deals|user|users|customer|customers|impression|impressions|click|clicks|request|requests|visit|visits|session|sessions|delivery|deliveries|ticket|tickets|repair|repairs|call|calls)\b/i,
  /\b(?:the|a)\s+next\s+(?:hour|shift|day|week|machine|server|worker|rep|agent|member|person|line|unit|batch|order|deal|user|customer|impression|request|visit|session|delivery|ticket|repair|call)\b/i,
  /\b(?:add|adding|hire|hiring|run|running|open|opening|plant|planting|buy|buying|deploy|deploying|bring|bringing|take|taking|schedule|scheduling)\s+(?:one|1|two|2|another|an?\s+extra|an?\s+additional)\s+(?:more\s+)?(?:hour|hours|shift|day|days|machine|machines|server|servers|worker|workers|rep|reps|member|members|person|people|line|lines|unit|units|acre|acres|batch|order|deal|user|customer|impression|request|session|delivery|ticket)\b/i,
  /\b(?:one|1)\s+extra\s+(?:hour|hours|shift|day|machine|server|worker|rep|member|person|line|unit)\b/i,
];

// ─── F-5 腿③' QTY_CONCL 边际侧数量结论（中文）─────────────────────
const QTY_CONCL_ZH = [
  /多[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:件|台|个|批|单|吨|斤|公斤|亩|人|次|份|小时|分钟|天|单位|元|块|版|条|种|位|名|户|家|辆|架|间|秒|周|月)/,
  /[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:件|台|个|批|单|吨|斤|公斤|亩|人|次|份|小时|分钟|天|单位|秒|周|月)(?:也|还|照样|同样|一定|肯定)?(?:是|有|保持|维持|不变|照旧)/,
  /[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:次|回)(?:登录|点击|访问|下单|购买|付费|签到|活跃)/,
  /(?:也|就|还|照样|同样|一定|肯定|必然)(?:能|可|会)?(?:多)?(?:产出|生产|产|制造|加工|处理|完成|交付|收|获得|带来|卖掉|签下)/,
];

// ─── F-5 腿③' QTY_CONCL（英文）───────────────────────────────────
const QTY_CONCL_EN = [
  /\b(?:must|will|would|should|can|could|shall)\s+(?:also\s+|still\s+|then\s+)?(?:add|yield|produce|deliver|process|handle|close|generate|contribute|bring|serve|ship|give)\s+(?:us\s+|you\s+|them\s+)?(?:about\s+|roughly\s+|around\s+)?[\w.,]+\s*(?:more\s+)?(?:units?|tickets?|orders?|items?|clicks?|visits?|sessions?|tons?|bushels?|dollars?|yuan|hours?|minutes?|days?|deals?|requests?|repairs?|calls?|impressions?)\b/i,
  /\b(?:adds?|adding|yields?|producing|delivering|processing|handling|closing|generating|contributing|bringing|serving|shipping|giving)\s+(?:us\s+|you\s+|them\s+)?(?:about\s+|roughly\s+|around\s+)?[\w.,]+\s*(?:more\s+)?(?:units?|tickets?|orders?|items?|clicks?|visits?|tons?|hours?|minutes?|days?|deals?|requests?|repairs?|calls?)\b/i,
  /\b[\w.,]+\s+more\s+(?:units?|tickets?|orders?|items?|clicks?|visits?|tons?|hours?|minutes?|days?|deals?|requests?|repairs?|calls?|impressions?|sessions?)\b/i,
  /\b(?:also|still|likewise|then)\s+(?:takes?|costs?|runs?|lasts?|needs?)\s+(?:about\s+|roughly\s+|around\s+)?[\w.,]+\s*(?:hours?|minutes?|days?|seconds?)\b/i,
];

// ─── 豁免一：教学/概念转述（讨论概念本身不是运用它）────────────────
const EXEMPT_META_ZH = [
  /教材|课堂|教科书|讲座|论文|文献|称为|定义为|概念|所谓|是指|悖论|理论上|学术|研讨|误区|谬误|认知偏误|思维陷阱|经济学|经济学家|微观经济|边际分析|教学|案例分析/,
];
const EXEMPT_META_EN = [
  /\b(?:textbook|textbooks|lecture|papers?|studies|called|defined|definition|concept|theory|fallacy|misconception|cognitive\s+bias|reasoning\s+error|economists?|economics|microeconomics|marginal\s+analysis|known\s+as|refers\s+to|describes?)\b/i,
];

// ─── 豁免二：正确响应形（把平均与边际分开陈述，正是要教的判别动作）
const EXEMPT_CORRECT_ZH = [
  /不代表|不意味着|不等于|不能说明|推不出|两回事|不是一回事|未必|不一定|不见得|取决于|还要看|先算|算过边际|算完边际|按边际|边际账|边际上算|分开算|分开看|不能只看|要区分|区分开|另行评估|另当别论|重新核算|重算一遍/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:does\s+not|doesn'?t|do\s+not|don'?t|did\s+not|didn'?t)\s+(?:mean|imply|guarantee|prove|tell|say)\b/i,
  /\bnot\s+the\s+same\b/i,
  /\bdistinguish\w*\b/i,
  /\bcompare\s+(?:the\s+)?marginal\b/i,
  /\bnot\s+necessarily\b/i,
  /\bdepends\s+on\b/i,
  /\bcan'?t\s+just\s+(?:look|use|rely|judge)\b/i,
  /\b(?:ran|run|check\w*|do|did)\s+the\s+marginal\b/i,
  /\bmarginal\s+(?:numbers|math|calculation)\b/i,
];

// ─── 对冲（概率化结论不作谬误判定）────────────────────────────────
const HEDGE_ZH = /可能|也许|或许|大概|似乎|好像|说不定|有待|仍需|通常|一般来|多数情况下|往往|大概率/;
const HEDGE_EN = /\b(?:maybe|perhaps|might|probably|possibly|seems|appears|typically|usually|generally|in\s+most\s+cases|tends?\s+to|often)\b/i;

// ─── 否定守卫（跨度窗）──────────────────────────────────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|不是说|不能说|谈不上|并不意味着|并没有|也不存在|不是不|不见得|取决于|还要看|另当别论|不允许|不准|禁止/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|neither|nor|no\s+longer|don'?t|depends|must\s+not|should\s+not)\b/i;

// ─── 反问标记（疑问句豁免的例外：问号包装的断言仍是断言）───────────
const RHET_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|谁不知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂非|焉能|哪来|哪有什么|哪来的|算什么|能是什么|哪去|贵到哪|高到哪|涨到哪|能贵|能高/;
const RHET_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can|important|expensive|much)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;

// 跨度窗（中文按字、英文按字符）
const W_AI_ZH = 30;   // F-1 腿① → 推断词
const W_IM_ZH = 30;   // F-1 推断词 → 腿②
const W_MC_ZH = 24;   // F-1 腿② → 腿③
const W_AIC_ZH = 60;  // F-2a 腿① → 增量腿
const W_ICC_ZH = 40;  // F-2a 增量腿 → 腿③
const W_AI_EN = 90;
const W_IM_EN = 90;
const W_MC_EN = 72;
const W_AIC_EN = 180;
const W_ICC_EN = 120;
const PRE_ZH = 12;    // 腿①前史否定守卫窗
const PRE_EN = 28;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表可注入空数组；单正则常量注入替换正则
// （负例脚本用 /(?!x)x/ 永假式抹掉该形）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

function toGlobal(re) {
  return new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
}

// 找列表中任一命中的首个位置
function firstIdx(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return { idx: m.index, end: m.index + m[0].length };
  }
  return { idx: -1, end: -1 };
}

// 全量命中位置（global 扫描）
function allIdx(list, text) {
  const out = [];
  for (const re of list) {
    const reG = toGlobal(re);
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ idx: m.index, end: m.index + m[0].length, text: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return out;
}

// 跨度否定守卫：span 区间 [from, to) 内不得有否定标记
function negatedInSpan(text, from, to, isZh, R) {
  if (from < 0 || to <= from) return false;
  const span = text.slice(from, Math.min(to, text.length));
  const re = isZh ? ((R && R.NEG_ZH) || NEG_ZH) : ((R && R.NEG_EN) || NEG_EN);
  return re.test(span);
}

// 腿①（平均值）合并列表 + 前史否定守卫
function avgLegs(isZh, R) {
  return isZh
    ? (R.AVG_COST_ZH || AVG_COST_ZH).concat(R.AVG_RETURN_ZH || AVG_RETURN_ZH)
    : (R.AVG_COST_EN || AVG_COST_EN).concat(R.AVG_RETURN_EN || AVG_RETURN_EN);
}
function conclLegs(isZh, R) {
  return isZh
    ? (R.CHEAP_ZH || CHEAP_ZH).concat(R.PROFIT_ZH || PROFIT_ZH)
    : (R.CHEAP_EN || CHEAP_EN).concat(R.PROFIT_EN || PROFIT_EN);
}
// 腿①前史否定守卫（「不是平均成本…」是对平均值陈述的否认）
function avgPreNeg(text, a, isZh, R) {
  const n = isZh ? PRE_ZH : PRE_EN;
  const pre = text.slice(Math.max(0, a.idx - n), a.idx);
  const negRe = isZh ? ((R && R.NEG_ZH) || NEG_ZH) : ((R && R.NEG_EN) || NEG_EN);
  return negRe.test(pre);
}

// F-1 推断链形：腿① → 推断词 → 腿②(边际参照) → 腿③(边际侧结论)
function findF1(text, isZh, R) {
  const a = firstIdx(avgLegs(isZh, R), text);
  if (a.idx < 0) return null;
  if (avgPreNeg(text, a, isZh, R)) return null;
  const inferRe = isZh ? pickRe(R.INFER_ZH, INFER_ZH) : pickRe(R.INFER_EN, INFER_EN);
  const margList = isZh ? (R.MARG_ZH || MARG_ZH) : (R.MARG_EN || MARG_EN);
  const conclList = conclLegs(isZh, R);
  const w1 = isZh ? W_AI_ZH : W_AI_EN;
  const w2 = isZh ? W_IM_ZH : W_IM_EN;
  const w3 = isZh ? W_MC_ZH : W_MC_EN;

  const inferG = toGlobal(inferRe);
  let im;
  while ((im = inferG.exec(text)) !== null) {
    if (im.index < a.idx || im.index - a.end > w1) continue;
    // 守卫一：腿①结束 → 推断词（「…但这并不说明…」）
    if (negatedInSpan(text, a.end, im.index, isZh, R)) continue;
    const inferEnd = im.index + im[0].length;
    for (const m of allIdx(margList, text)) {
      if (m.idx < inferEnd || m.idx - inferEnd > w2) continue;
      // 守卫二：推断词结束 → 腿②
      if (negatedInSpan(text, inferEnd, m.idx, isZh, R)) continue;
      for (const c of allIdx(conclList, text)) {
        if (c.idx < m.idx || c.idx - m.end > w3) continue;
        // 守卫三：腿②结束 → 腿③（「也并不会更低」）
        if (c.idx > m.end && negatedInSpan(text, m.end, c.idx, isZh, R)) continue;
        return { idx: a.idx, text: 'avg→' + im[0] + '→marg→concl' };
      }
    }
  }
  return null;
}

// F-2a 增量决策形：腿① × 增量动作/量化边际参照 × 腿③（不要求推断词）
function findF2a(text, isZh, R) {
  const a = firstIdx(avgLegs(isZh, R), text);
  if (a.idx < 0) return null;
  if (avgPreNeg(text, a, isZh, R)) return null;
  const incrList = isZh ? (R.INCR_ZH || INCR_ZH) : (R.INCR_EN || INCR_EN);
  const conclList = conclLegs(isZh, R);
  const w1 = isZh ? W_AIC_ZH : W_AIC_EN;
  const w2 = isZh ? W_ICC_ZH : W_ICC_EN;

  for (const inc of allIdx(incrList, text)) {
    if (inc.idx < a.idx || inc.idx - a.end > w1) continue;
    // 守卫一：腿①结束 → 增量腿
    if (negatedInSpan(text, a.end, inc.idx, isZh, R)) continue;
    for (const c of allIdx(conclList, text)) {
      if (c.idx < inc.idx || c.idx - inc.end > w2) continue;
      // 守卫二：增量腿结束 → 腿③
      if (c.idx > inc.end && negatedInSpan(text, inc.end, c.idx, isZh, R)) continue;
      return { idx: a.idx, text: 'avg×incr×concl' };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// [r303] F-5「产量/效率/速率型平均值 → 边际量」平行路由
//
// 三腿共现（缺一不判）：
//   腿①' AVG_RATE  —— 速率/产量型平均值（平均每小时产出/平均亩产/
//                     average output / average yield / throughput）
//   腿②' RES ∪ MARG ∪ INCR —— 资源形边际参照（再开一台/再多一个/
//                     one more machine / the next delivery）+ 存量
//                     边际/增量腿（刻意 union 而非改写存量数组）
//   腿③' QTY_CONCL —— 边际侧**数量**结论（多五十件/也是两秒/
//                     must add ten more units / 30 more clicks）
//
// 与 F-1/F-2a 的关系：完全并行。F-1/F-2a 的腿①是货币型平均值、腿③是
// 货币型结论（更便宜/利润越滚越多）；F-5 的腿①是速率型平均值、腿③是
// 数量型结论。两条路线互不依赖：删掉任一侧常量，另一侧仍独立命中
// （round-303 测试带双向对照）。
// ═══════════════════════════════════════════════════════════════════
function f5Leg1(isZh, R) {
  return isZh ? (R.AVG_RATE_ZH || AVG_RATE_ZH) : (R.AVG_RATE_EN || AVG_RATE_EN);
}
function f5Leg2(isZh, R) {
  return isZh
    ? (R.RES_ZH || RES_ZH).concat(R.MARG_ZH || MARG_ZH, R.INCR_ZH || INCR_ZH)
    : (R.RES_EN || RES_EN).concat(R.MARG_EN || MARG_EN, R.INCR_EN || INCR_EN);
}
function f5Leg3(isZh, R) {
  return isZh ? (R.QTY_CONCL_ZH || QTY_CONCL_ZH) : (R.QTY_CONCL_EN || QTY_CONCL_EN);
}

function findF5(text, isZh, R) {
  const a = firstIdx(f5Leg1(isZh, R), text);
  if (a.idx < 0) return null;
  if (avgPreNeg(text, a, isZh, R)) return null;      // 「不是平均产量…」是对平均值陈述的否认
  const resList = f5Leg2(isZh, R);
  const conclList = f5Leg3(isZh, R);
  const w1 = isZh ? W_AIC_ZH : W_AIC_EN;   // 腿①' → 腿②'
  const w2 = isZh ? W_ICC_ZH : W_ICC_EN;   // 腿②' → 腿③'

  for (const res of allIdx(resList, text)) {
    if (res.idx < a.idx || res.idx - a.end > w1) continue;
    // 守卫一：腿①' 结束 → 腿②'
    if (negatedInSpan(text, a.end, res.idx, isZh, R)) continue;
    for (const c of allIdx(conclList, text)) {
      if (c.idx < res.idx || c.idx - res.end > w2) continue;
      // 守卫二：腿②' 结束 → 腿③'
      if (c.idx > res.end && negatedInSpan(text, res.end, c.idx, isZh, R)) continue;
      return { idx: a.idx, text: 'avgRate→res→qtyConcl' };
    }
  }
  return null;
}

// F-2b / F-3 / F-4：单正则形（否定已内生于结构或由豁免层负责）
function findRegexForm(text, isZh, R, key) {
  // key ∈ {F2B, F3, F4}；实际常量名为 <key>_ZH / <key>_EN
  const fullKey = key + (isZh ? '_ZH' : '_EN');
  const def = isZh ? { F2B_ZH, F3_ZH, F4_ZH }[fullKey] : { F2B_EN, F3_EN, F4_EN }[fullKey];
  const re = pickRe(R[fullKey], def);
  const reG = toGlobal(re);
  const m = reG.exec(text);
  return m ? { idx: m.index, text: m[0] } : null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAverageMarginalConflation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免：仅当句中无反问标记时豁免（F-3 专收反问形）
  if (/[?？]/.test(text)) {
    if (!RHET_ZH.test(text) && !RHET_EN.test(text)) {
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
  // 豁免三：对冲
  if ((R.HEDGE_ZH || HEDGE_ZH).test(text) || (R.HEDGE_EN || HEDGE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 六形任一（F-1 推断链 / F-2a 增量决策 / F-2b 扩产建议 / F-3 反问 / F-4 反向归因 / [r303] F-5 速率型平均→边际量）
  const forms = [];
  const f1 = findF1(text, isZh, R);
  if (f1) forms.push({ form: 'F-1', hit: f1 });
  const f2a = findF2a(text, isZh, R);
  if (f2a) forms.push({ form: 'F-2a', hit: f2a });
  const f2b = findRegexForm(text, isZh, R, 'F2B');
  if (f2b) forms.push({ form: 'F-2b', hit: f2b });
  const f3 = findRegexForm(text, isZh, R, 'F3');
  if (f3) forms.push({ form: 'F-3', hit: f3 });
  const f4 = findRegexForm(text, isZh, R, 'F4');
  if (f4) forms.push({ form: 'F-4', hit: f4 });
  // [r303] F-5 速率型平均值 → 边际量（腿①' AVG_RATE × 腿②' RES∪MARG∪INCR × 腿③' QTY_CONCL）
  const f5 = findF5(text, isZh, R);
  if (f5) forms.push({ form: 'F-5', hit: f5 });
  if (forms.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.6,
    count: forms.length,
    detail: isZh
      ? '平均≠边际：用摊薄的平均值推断边际值或给增量决策背书(zh, ' + forms.map(f => f.form).join('+') + ')'
      : 'average-marginal conflation: the diluted average treated as the marginal cost/return of one more unit(en, ' + forms.map(f => f.form).join('+') + ')',
  };
}

module.exports = {
  checkAverageMarginalConflation,
  __internals: () => ({
    AVG_COST_ZH, AVG_RETURN_ZH, MARG_ZH, INCR_ZH, CHEAP_ZH, PROFIT_ZH, INFER_ZH,
    F2B_ZH, F3_ZH, F4_ZH,
    AVG_COST_EN, AVG_RETURN_EN, MARG_EN, INCR_EN, CHEAP_EN, PROFIT_EN, INFER_EN,
    F2B_EN, F3_EN, F4_EN,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, EXEMPT_META_EN, EXEMPT_CORRECT_EN,
    HEDGE_ZH, HEDGE_EN, NEG_ZH, NEG_EN, RHET_ZH, RHET_EN,
    // [r303] F-5 速率型平均值→边际量平行族（负例注入-删条用）
    AVG_RATE_ZH, AVG_RATE_EN, RES_ZH, RES_EN, QTY_CONCL_ZH, QTY_CONCL_EN,
  }),
};
