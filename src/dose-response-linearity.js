/**
 * src/dose-response-linearity.js — 「剂量-反应线性外推（linear dose-response
 * extrapolation / linearity assumption）」检测器
 * （第 250 个判别维度，r306）
 *
 * [r306 立项] philosophy_decision 本体裁决 accelerate（confidence 0.7 /
 * priority 40 / trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为
 * "unknown"，按轮次纪律不当实质背书）。外部搜索实质无可用结果（HN Algolia
 * "causal inference fallacy detection" 仅命中一条无关语音转写条目；
 * Semantic Scholar 连续 HTTP 429 限流空返；GitHub "causal inference rules
 * engine" 最高星仅 Aryia-Behroziuan/History ★7 且为知识表示历史文集，
 * 无可复用判据实现）——如实记录，走内部路径：池化缺口探针
 * scripts/round-306/probe-candidates.js（v6.8.176 实测）在 7 个候选谬误族
 * 35 条攻击样本中，本族 3/5 整族漏判（gate=pass），为最薄弱环节；
 * grep -ril 'dose.response|剂量反应|线性外推' src/ 确认既有维度只把「剂量
 * 反应」当 common-cause 腿③的证据建议词表，无一维度判「少量X产生效果E +
 * 效果随剂量成比例增长」的外推结构——249 维真缺口。
 *
 * 辨别的族：剂量-反应线性外推——文本先陈述**某个剂量/强度的 X 产生了效果
 * E**（吃一片止疼/每周锻炼两小时有益/适度饮酒活血），继而断言**加大剂量
 * 效果按比例或倍数放大**（吃十片效果就是十倍/每天练十二小时更健康/多喝点
 * 更养生）。剂量-反应曲线普遍是**非线性**的：有治疗窗、平台期、饱和点、
 * 反转型（过量有害甚至致命），把「有效」线性外推到「越多越好/成倍越好」
 * 是把一条未经测量的曲线假设成直线：
 *   吃一片有效，吃十片效果就是十倍。
 *   每周锻炼两小时有益，所以每天练十二小时更健康。
 *   少量饮酒活血，所以多喝点更养生。
 *   One pill helps, so ten pills help ten times as much.
 *   Two cups of coffee improve focus, so eight cups improve it more.
 *
 * 与既有维度的边界（r306 归因）：
 *   · count_rate_conflation（第197维附近）管精确倍数**统计口径**谬误
 *     （翻倍/三倍/十倍的量纲误用），本族管把倍数断言当作**剂量-反应
 *     关系**的外推，腿①必须是可增减的投入量（剂量/时长/杯数/片数）；
 *   · common_cause / reverse_causation / post_hoc 管共变→因果、方向倒置、
 *     时序连接，本族不涉及两个独立变量的共变，只涉及**同一变量自身
 *     剂量增减**的效果外推；
 *   · means_as_end 管把手段当目的，本族的剂量本身仍是被评估的手段，
 *     错误在外推形状；
 *   · monocause 管多因压成单因，本族不断言原因唯一；
 *   · pseudo_causal 管玄学归因白话，本族的断言形是定量的（倍数/越多越）。
 *
 * 判据（双腿共现 + 邻近窗，缺一不判）：
 *   腿① DOSE 剂量/强度陈述：投入量可增减的 X——数量词（一片/两片/三片/
 *     十片/一杯/两杯/八杯/一两/一杯酒/每天/每周/每月 × 小时/分钟/次/公里/
 *     克/毫克/ml/杯/片/粒/滴/勺）+ 效果动词或强度/频率状语；
 *     EN one/two/three/eight/ten (pill|pills|cup|cups|glass|glasses|
 *     dose|doses|serving|servings|beer|beers|drink|drinks|shot|shots) ×
 *     helps|works|improves|boosts|benefits|good for；
 *   腿② LINEARITY 线性外推断言：效果随剂量按比例/倍数放大——
 *     「越多越」「越X越Y」「加倍/翻倍/十倍/成比例/线性」「N片就是N倍」
 *     「再X效果更Y」「加大/加大剂量效果」「多吃点更养生」；
 *     EN the more … the more / N times / ten times as much / twice the
 *     effect / scales linearly / proportionally / more is better /
 *     double the dose。
 *
 * 为什么取 VERIFY 级：剂量-反应的真实形状取决于机制与实测数据（血药浓度
 * 曲线/临床剂量爬坡/毒性阈值），规则引擎无法独立判定某个具体剂量的真实
 * 效果，只能识别「有效 → 越多越好/成倍」的推断形态。verify 的含义是
 * 「先补剂量-反应证据再采信」：调用方应要求给出曲线形状（平台期/治疗窗/
 * 饱和点）、把结论降级为「该剂量观察到效果，加量效果待检验」，或点名
 * 过量风险，而不是把线性外推当成已知。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（剂量反应/线性外推/治疗窗/平台期/饱和/半数有效量/
 *     量效关系/毒理学/药理学/统计学/教材/课堂/论文/科普/谬误/误区/
 *     EN dose-response / dose–response / linear extrapolation /
 *     therapeutic window / plateau / saturation / EC50 / ED50 / LD50 /
 *     pharmacology / toxicology / statistics / textbook / lecture /
 *     fallacy）——讨论这个概念本身是正确判别；
 *   · 实验/证据语境（临床试验/随机对照/对照组/双盲/安慰剂/队列/元分析/
 *     血药浓度/药代动力学/剂量爬坡/滴定/最大耐受剂量/MTD/监测肝肾功能/
 *     处方/医嘱/遵医嘱/EN randomized / controlled trial / RCT / placebo /
 *     cohort / meta-analysis / pharmacokinetics / titration / maximum
 *     tolerated dose / prescribed / under medical supervision）——受控
 *     设计或专业医疗语境中外推经设计或专业监护成立；
 *   · 推理否定/反向承认（不是线性/并非线性/不成比例/不等于/并不意味着/
 *     有上限/有限度/过犹不及/适得其反/物极必反/会中毒/有毒性/风险更高/
 *     EN not linear / nonlinear / non-linear / not proportional / does
 *     not scale / plateaus / diminishing returns / too much is harmful /
 *     toxic / overdose）——拒绝该推断本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/恐怕/倾向于/似乎/好像/说不定/有待/
 *     EN maybe / perhaps / might / possibly / probably / seems /
 *     appears）——概率化结论不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 *
 * [r330 扩展] 现代规模 scaling 域新措辞家族（真升级②，+SCALE 六常量）：
 * 原判据的腿① DOSE 只收**可摄入/可计时**的投入量（片/杯/小时×摄入动词），
 * 对现代工程与经营话语的**可规模化资源**（服务器/集群节点/团队人数/研发投入/
 * 营销预算/工厂产能/加班工时）零覆盖。池化探针（coordination/agent4/probes/
 * r330-probe-scaling.js，v6.8.184 实测）该族 15/15 攻击整族穿透 gate=pass、
 * 良性 6/7（1 条被既有本维度 verify，非新增误伤）。新族与原族共用「投入量 ×
 * 效果按比例放大」的同一外推结构，只是词汇域从健康剂量换到规模 scaling：
 *   服务器扩容一倍，系统吞吐量就能翻倍。
 *   团队人数翻倍，交付速度必然也翻倍。
 *   研发投入加倍，创新产出就会加倍。
 *   Double the servers and throughput doubles.
 *   If we double the R&D spend, output doubles.
 * 判别的是「假设投入-产出沿直线缩放」——忽略瓶颈、协调开销、边际递减、规模
 * 不经济（Amdahl 定律/ Brooks 定律/收益递减）。**独立腿对** SCALE_IN（可规模
 * 化投入 × 增减动作）× SCALE_OUT（产出/绩效名词 × 比例/倍数断言）+ 邻近窗，
 * 与健康剂量族 OR 并联，互不影响；投入名词表与产出名词表**刻意不交叉**，故
 * 「人数翻倍」（投入+doubles）不触发产出腿，只有「人数…交付翻倍」才判。豁免
 * 复用全局四豁免，另加 EXEMPT_SCALE_NEG（瓶颈/协调开销/边际递减/规模不经济/
 * bottleneck/coordination overhead/diseconomies of scale——正确指出非线性）。
 */
'use strict';

// ─── 腿① DOSE 剂量/强度陈述（中文）─────────────────────────────────────
// r161 教训自查：每条词去掉后缀（「一片」→「片」「一杯」→「杯」）仍须有
// 裸名词形态命中；「每天/每周」这类频率状语收裸形，不收「了/之后」形。
const DOSE_ZH = [
  // 量词 × 摄入/投入名词（裸量词形）
  /[一二两三四五六七八九十半\d]+\s*(?:片|粒|颗|丸|袋|瓶|杯|盅|碗|勺|匙|滴|支|装|包|盒|份)/,
  /(?:毫克|克|公斤|斤|两|毫升|升|ml|cc|mg|g|kg)\s*[一二两三四五六七八九十半\d]*/,
  // 剂量/用量裸名词
  /剂量|用量|服用量|摄入量|摄取量|给药|用药|服药|吃药|打针|注射/,
  // 频率 × 投入量（时长/次数/距离）——「每天练十二小时」「每周跑十公里」
  /(?:每天|每周|每月|每年|一天|一周|一月|一天内|一周内)\s*[一二两三四五六七八九十半\d]+\s*(?:小时|分钟|次|公里|千米|米|组|回|趟|遍|小时以上|个钟)/,
  /[一二两三四五六七八九十半\d]+\s*(?:小时|分钟|个钟|钟头)\s*(?:的|以上|每)?\s*(?:锻炼|运动|训练|练习|学习|工作|练|跑|走|看书|读书)/,
  // 摄入类裸名词形（酒/咖啡/茶/烟）
  /(?:喝|饮|吸|抽|吃|服)\s*[一二两三四五六七八九十半\d]*\s*(?:杯|瓶|口|盅|根|支|包|袋|片|粒|颗)?\s*(?:酒|啤酒|白酒|红酒|咖啡|茶|烟|可乐|功能饮料|奶茶)/,
  /(?:酒|啤酒|咖啡|茶|烟)\s*(?:喝|饮|抽|吸)\s*[一二两三四五六七八九十半\d]*\s*(?:杯|瓶|口|盅)?/,
  // 强度/剂量等级裸名词
  /(?:低|中|高|小|大|轻|重|强|弱)\s*(?:剂量|强度|浓度|用量|频率)/,
];

// ─── 腿① DOSE（英文）───────────────────────────────────────────────────
const DOSE_EN = [
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|a\s+couple\s+of|half\s+a|dozen)\s+(?:pill|pills|capsule|capsules|tablet|tablets|cup|cups|glass|glasses|dose|doses|serving|servings|beer|beers|drink|drinks|shot|shots|spoonful|spoonfuls|scoop|scoops|slice|slices|piece|pieces)\b/i,
  /\b(?:mg|milligram|milligrams|gram|grams|ml|millilitre|milliliter|liter|litre|ounce|ounces|cup|cups|tablespoon|tablespoons|teaspoon|teaspoons)\s+(?:of\s+)?[a-z]+/i,
  /\b(?:every|per)\s+(?:day|week|month|hour|morning|night)\b/i,
  /\b\d+\s*(?:hours?|minutes?|times?\s+a\s+(?:day|week)|km|kilometres?|kilometers?|miles?|reps?|sets?)\b/i,
  /\b(?:dose|dosage|intake|serving|administration)\s+(?:of|is)\b/i,
  /\b(?:a|one|two|three)\s+(?:glass|glasses|cups?|cans?|bottles?)\s+of\s+(?:wine|beer|coffee|tea|alcohol|liquor|whiskey|vodka|cola|soda)\b/i,
];

// ─── 腿② LINEARITY 线性外推断言（中文）─────────────────────────────────
const LINEARITY_ZH = [
  // 「越多越」族（裸名词形）
  /越多越|愈多愈|越[^。；，]{0,6}越[^。；，]{0,6}(?:好|强|高|有效|明显|快|理想|划算|值)/,
  // 倍数/比例放大断言
  /(?:效果|疗效|作用|收益|回报|好处|益处|价值|成果)[^。；，]{0,8}(?:就是|也是|就达到|将达到|等于)\s*[一二两三四五六七八九十半\d]+\s*(?:倍|番|成)/,
  /[一二两三四五六七八九十半\d]+\s*(?:倍|番)\s*(?:的效果|的疗效|的作用|的收益|的回报|的效果)/,
  /(?:加倍|翻倍|翻番|加倍用|加量|加大剂量|加量吃|多吃[一二两三四五六七八九十半\d]*\s*(?:片|粒|颗|杯|瓶)?|多喝|再吃|再加)/,
  // 「N 倍」直接断言效果放大
  /(?:那么|那|就|则)\s*[^。；，]{0,6}(?:效果|疗效|作用|收益)\s*(?:也|就|则)?\s*(?:是|为|达到)?\s*[一二两三四五六七八九十半\d]+\s*(?:倍|番)/,
  // 任意受益名词 × 倍数（精神五倍/成绩翻倍/收益十倍）
  /[^。；，]{0,8}(?:精神|成绩|收益|收入|回报|状态|体力|精力|记忆|代谢|免疫|抵抗|续航)\s*(?:就是|就|会是|达到)?\s*[一二两三四五六七八九十半\d]+\s*(?:倍|番)/,
  // 比例/线性显式词
  /(?:成比例|成倍地|线性|按比例放大|等比)/,
  // 「更」族：加量后效果更优
  /(?:再|多|加|加大|加强|提升)\s*[^。；，]{0,4}(?:剂量|强度|频率|用量)?\s*(?:效果|疗效|作用)?\s*(?:会|就|更|越)?\s*(?:好|强|有效|明显|理想|棒|厉害)/,
  // 极端剂量外推断言（十片/十二小时类直接倍数）
  /(?:十片|十倍|翻十倍|十二小时|二十小时|全天不停|不停歇|越多越好|多多益善)/,
];

// ─── 腿② LINEARITY（英文）──────────────────────────────────────────────
const LINEARITY_EN = [
  /\bthe\s+more\s+[^.!?]{0,40}\s+the\s+(?:more|better|stronger|faster|higher|greater|happier|healthier)\b/i,
  /\b(?:helps?|works?|improves?|boosts?|benefits?)\s+[^.!?]{0,30}\s+so\s+(?:more|double|twice|ten\s+times|three\s+times|n\s+times)\b/i,
  /\b(?:ten|two|three|four|five|six|seven|eight|nine|double|twice|half)\s+times\s+(?:as\s+(?:much|effective|good|strong|fast|beneficial)|the\s+(?:effect|benefit|result|dose))\b/i,
  /\b(?:scales?|scale)\s+(?:linearly|proportionally|with)\b/i,
  /\b(?:more|greater|higher|larger)\s+(?:is|are)\s+better\b/i,
  /\b(?:more\s+is\s+better|the\s+more\s+the\s+better|double\s+the\s+dose|twice\s+the\s+dose|ramp\s+(?:it|up)\s+up|bump\s+(?:it|the\s+dose)\s+up)\b/i,
  /\b(?:twice|double|triple|quadruple|10x|5x|3x|2x)\s+(?:the\s+)?(?:effect|benefit|impact|result|output|yield|gain|gainz)\b/i,
  /\b(?:if\s+)?(?:one|two|a\s+couple)\s+(?:pill|pills|cup|cups|glass|glasses|dose|doses|serving|servings|hours?)\s+(?:helps?|works?)\s*,?\s*(?:then\s+)?(?:more|ten|eight|double)\b/i,
  /\b(?:helps?|works?|improves?|boosts?|benefits?)\s+[^.!?]{0,60}\b(?:so\s+)?(?:five|ten|eight|more)\s+[^.!?]{0,30}\b(?:times?\s+as\s+(?:much|effective|good|strong|fast|beneficial)|times)\b/i,
  /\b(?:five|ten|eight|double)\s+(?:times\s+as\s+(?:much|effective|good|strong|fast|beneficial))\b/i,
];

// ─── [r330] 现代规模 scaling 域：腿① SCALE_IN 可规模化投入 × 增减动作 ──────
// 与健康剂量族 OR 并联的独立腿对。投入名词表（基础设施/人力/预算/产能/工时）
// 与产出名词表（吞吐/交付/利润/获客）刻意不交叉。
const SCALE_IN_ZH = [
  // 投入名词 × 增减动作（同句近距）：服务器扩容 / 节点翻倍 / 预算加倍 / 研发投入加大
  /(?:服务器|集群|节点|实例|副本|带宽|内存|产线|产能|门店|席位|工位|团队|人数|人手|员工|工程师|劳动力|研发|预算|经费|资金|资本|广告费|营销费用|加班|工时|投放|服务器数量|节点数)[^。；，！？!?]{0,6}(?:扩容|增设|增加|增至|加到|提升到|扩大到|扩张|翻倍|加倍|翻番|扩大|扩招|招聘|招人|投入|上线|部署|加码|加量|堆)/,
  // 增减动作 × 投入名词（前置形）：翻倍服务器 / 扩招人员 / 加倍预算 / 增加人手
  /(?:翻倍|加倍|翻番|扩大|增加|增设|扩招|招聘|投入|部署|上线|加码)[^。；，！？!?]{0,6}(?:服务器|集群|节点|实例|副本|带宽|内存|产线|产能|门店|席位|工位|团队|人数|人手|员工|工程师|劳动力|研发|预算|经费|资金|资本|广告费|营销费用|加班|工时|投放)/,
  // 招聘/扩编 × 人力（前置动词形）：再招一倍的人 / 扩招工程师 / 增聘人手
  /(?:扩招|招聘|招募|增聘|招|聘|雇|引进)[^。；，！？!?]{0,4}(?:人|人员|人手|员工|工程师|开发者|劳动力|团队|编制)/,
];
const SCALE_IN_EN = [
  // scaling verb × resource noun（允许 1-2 个修饰词：double the factory capacity）
  /\b(?:double|doubling|doubled|triple|tripling|tripled|twice|scale|scaling|scaled|ramp|ramping|add|adding|increase|increasing)\s+(?:up\s+)?(?:the\s+)?(?:[a-z]+\s+){0,2}(?:servers?|nodes?|instances?|replicas?|machines?|clusters?|bandwidth|memory|cores?|capacity|headcount|team|staff|engineers?|developers?|workers?|workforce|budget|spend|spending|funding|investment|R&D|overtime|hours?)\b/i,
  // resource noun × scaling verb（servers scale up / headcount doubles）
  /\b(?:servers?|nodes?|instances?|replicas?|headcount|team\s+size|staff|engineers?|developers?|budget|spend|capacity|R&D|overtime|bandwidth|workers?)\b[^.!?]{0,30}\b(?:double|doubles|doubled|triple|triples|scales?\s+linearly|scale\s+up|increase|increases)\b/i,
];

// ─── [r330] 现代规模 scaling 域：腿② SCALE_OUT 产出/绩效名词 × 比例断言 ────
const SCALE_OUT_ZH = [
  // 产出名词 × 比例/倍数断言：吞吐量翻倍 / 交付提速一倍 / 利润成比例
  /(?:吞吐量|处理能力|处理量|并发|承载量|产能|产量|产出|输出|交付|交付速度|交付效率|进度|获客|客户数|用户数|线索|订单|销量|销售额|营收|收入|利润|收益|转化率|留存|性能|效率|成果|产值)[^。；，！？!?]{0,8}(?:翻倍|加倍|翻番|提速[一二两三四五六七八九十半\d]?倍|提升[一二两三四五六七八九十半\d]?倍|增加[一二两三四五六七八九十半\d]?倍|扩大[一二两三四五六七八九十半\d]?倍|线性|成比例|等比|随之翻倍)/,
  // 产出名词 × 达到/就是 × N倍
  /(?:吞吐量|产出|交付|利润|获客|销量|销售额|营收|产能|性能|效率)[^。；，！？!?]{0,6}(?:就是|也是|达到|将是|将为)[一二两三四五六七八九十半\d]+\s*(?:倍|番)/,
];
const SCALE_OUT_EN = [
  // output noun × scaling assertion
  /\b(?:throughput|output|delivery|profit|revenue|sales|customers?|conversions?|retention|performance|productivity|capacity|yield|results?|turnaround)\b[^.!?]{0,25}\b(?:doubles?|triples?|scales?\s+linearly|scales?\s+proportionally|linearly|proportionally|twofold|twice|double)\b/i,
  // multiplier × the × output noun：double the throughput / twice the sales
  /\b(?:double|doubles|twice|2x|twofold|triple)\s+the\s+(?:throughput|output|delivery|profit|revenue|sales|customers?|performance|productivity|capacity|yield)\b/i,
];

// ─── [r330] scaling 域专属推理否定（正确指出非线性/瓶颈/边际递减）──────────
// 全局 EXEMPT_NEG 已覆盖 not linear / diminishing returns / 未必 / 不会等；此处
// 只补工程/经营域专有词汇，且仅在 scaling 分支判定，绝不影响健康剂量族行为。
const EXEMPT_SCALE_NEG_ZH = [
  /瓶颈|协调开销|沟通成本|边际递减|收益递减|规模不经济|边际效用递减|负载均衡|阿姆达尔|木桶|短板|封顶|饱和/,
];
const EXEMPT_SCALE_NEG_EN = [
  /\b(?:bottlenecks?|coordination\s+overhead|communication\s+overhead|diminishing\s+marginal|diseconomies\s+of\s+scale|marginal\s+returns|Amdahl|Brooks|ceiling|saturat\w+|plateaus?|sub[- ]?linear)\b/i,
];

// ─── [r336] 族三：日常摄入/投入品 × 增量 × 状态获益外推 ──────────────────
// 与族一（显式倍数/倍番）、族二（工程 scaling）同为「投入增量 → 效果放大」
// 外推结构，但投放域是日常话语：不用显式倍数词，改用**模糊量**（一把/几杯/
// 多喝点/a handful/more）与**状态型获益**（通宵不困/精神一整天/更养生/
// all-day energy），是既有两腿判据覆盖不到的第三句式族。
// 三条件判据（缺一不判）：
//   ① 腿① DAILY_IN：日常摄入/投入品名词 × 数量/增量表达（同分句）；
//   ② 腿② GAIN：数量/增量表达 × **因果连接词**（能/就/更/so/then/means…）
//      × 获益状态（同分句，正则 [^。；，] 兜底不跨标点）；
//   ③ 全文剂量/增量表达 ≥2（或含显式增量词）——防「每天跑步半小时更健康」
//      这类**单剂量正确陈述**被误判（腿②形似但全文只有一个剂量）。
// r161 教训自查：物品名词全收裸形（咖啡/茶/酒/糖…），量词单位收裸形（杯/把/
// 勺/颗…），不带后缀依赖。
const DAILY_IN_ZH = [
  // 物品名词 × 数量/增量（物品在前，8 字内出现数量或增量表达）
  /(?:咖啡|茶叶|茶水|茶|酒|啤酒|白酒|红酒|黄酒|米酒|果酒|糖|糖果|甜食|甜品|可乐|汽水|碳酸饮料|饮料|奶茶|功能饮料|能量饮料|烟|香烟|水|盐水|矿泉水|辣椒|大蒜|生姜|香辛|醋|油腻|油炸|夜宵|火锅|零食|巧克力|炸鸡|薯片|蛋糕|冰淇淋|烧烤|泡面|方便面|运动|锻炼|跑步|健身|瑜伽|冥想|游泳|骑车|步行|爬山|看书|读书|学习|加班|熬夜|午睡|午休|睡觉|面膜|防晒|护肤|洗澡|泡脚|游戏|手机|短视频|直播)[^。；，！？!?]{0,8}(?:[一二两三四五六七八九十半\d]+\s*(?:杯|瓶|口|盅|碗|把|勺|匙|滴|根|支|包|袋|块|颗|粒|瓣|罐|听|盒|份|杯半|大杯|小杯|小时|分钟|个钟|钟头|公里|千米|米|次|组|回|遍|小时以上)|(?:几|若干|大半|一大把|一把|一小把|半把|多几|多点|多一些|不少|些许)\s*(?:杯|瓶|口|盅|碗|把|勺|匙|块|颗|粒|根|支|包|袋|点|些)?|(?:多|再|加倍|翻倍|多加|加量|加大|增量|加码)\s*(?:喝|饮|吃|抽|嚼|用|跑|练|来|上)?)/,
  // 数量 × 物品名词（数量在前的裸形：「两杯咖啡」「一把糖」「几杯咖啡」）
  /[一二两三四五六七八九十半几\d]+\s*(?:杯|瓶|口|盅|碗|把|勺|匙|块|颗|粒|根|支|包|袋|瓣|杯半|大杯|小杯)\s*(?:的)?\s*(?:咖啡|茶叶|茶水|茶|酒|啤酒|白酒|红酒|糖|糖果|奶糖|软糖|口香糖|棒棒糖|甜食|甜品|可乐|汽水|饮料|奶茶|功能饮料|烟|水|盐水|辣椒|油腻|油炸|夜宵|火锅|零食|巧克力|炸鸡|薯片|蛋糕|冰淇淋|运动|锻炼|跑步|健身|瑜伽|冥想|游泳|加班|熬夜|午睡|面膜|泡脚)/,
  // [r341 契约腿] 捕获组 1=数量词、2=单位：升级判定 hasDailyEscalation 的
  // 专用供给腿（r337 合并时从 r357 版移植，保证同单位双数量可抽对）。
  // 注意：命中判定用上面的物品名词腿，本腿只喂升级判定，不直接判 hit。
  /([一二两三四五六七八九十百千半\d]+)\s*(个?小时|分钟|个钟|杯|瓶|碗|勺|匙|盅|袋|包|盒|罐|桶|盆|碟|根|支|瓣|颗|粒|片|丸|滴|斤|两|克|公斤|毫升|升|口|顿)/,
  /(?:一大把|一把|一小把|半把|几把|若干)\s*(?:的)?\s*(?:糖|糖果|甜食|零食|巧克力|药|丸|片|颗|粒|花生|瓜子|坚果|饼干|蛋糕)/,
];
const DAILY_IN_EN = [
  // 物品名词 × 数量/增量（item first）
  /\b(?:coffee|tea|wine|beer|alcohol|liquor|whiskey|vodka|sugar|candy|candies|soda|cola|drinks?|water|salt|spicy food|fried food|junk food|snacks?|chocolate|chips|dessert|cigarettes?|smoking|exercise|running|workout|meditation|sleep|studying|overtime|screens?|social media)\b[^.!?;]{0,25}\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a couple of|half a|a dozen|a few|several|a handful of|more|extra|additional|double|twice|triple)\s+(?:[a-z-]+\s+){0,2}(?:cups?|glasses?|cans?|bottles?|pills?|doses?|servings?|hours?|minutes?|candy|candies|sugar|drinks?|shots?|beers?|slices?|pieces?|spoonfuls?|scoops?|bowls?)\b/i,
  // N × of × 物品（"One cup of coffee" / "A glass of wine"）
  /\b(?:a|one|two|three|four|five|six|seven|eight|nine|ten|a couple of|a few|several|a handful of|half a)\s+(?:[a-z]+\s+){0,2}(?:cups?|glasses?|cans?|bottles?|doses?|servings?|bowls?|handfuls?|pieces?|slices?|spoonfuls?|scoops?)\s+of\s+(?:coffee|tea|wine|beer|alcohol|sugar|candy|soda|water|salt|junk food|chocolate|chips)\b/i,
  // 数量 × 物品（无 of 形："one candy" / "two coffees"）
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|a couple of|a few|several|a handful of|more|extra|double|twice)\s+(?:[a-z-]+\s+){0,2}(?:candy|candies|coffee|coffees|tea|teas|wine|beer|drinks?|cigarettes?|sugar|hours?|minutes?|workouts?|cups?)\b/i,
  // 模糊量 × 物品名词（handful 本身即量，无单位词）："a handful gives all-day energy"
  /\b(?:a handful|a bunch|a couple more|a few more)\b[^.!?;]{0,12}\b(?:candy|candies|coffee|tea|chocolate|chips|snacks?|sugar|nuts?|pills?|drinks?)\b/i,
  // [r341 契约腿] 捕获组 1=数量词、2=单位：hasDailyEscalation 的 EN 专用供给腿
  // （r337 合并时从 r357 版移植）。同 ZH 契约腿，只喂升级判定。
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|fifty|hundred|thousand|dozen|half|a|an|single|\d+)\s+(cups?|glass(?:es)?|bowls?|spoonfuls?|bottles?|bags?|box(?:es)?|pills?|capsules?|tablets?|doses?|servings?|hours?|minutes?|days?|weeks?|slices?|pieces?|scoops?|shots?|drinks?|beers?|cans?|plates?|portions?)\b/i,
];
// 腿② GAIN：数量/增量 × 因果连接词 × 获益状态（同分句）
const GAIN_ZH = [
  // 数词量词 × 连接词 × 获益：「十杯就能通宵不困」「十二小时更健康」
  /[一二两三四五六七八九十半几\d]+\s*(?:杯|瓶|口|盅|碗|把|勺|匙|块|颗|粒|根|支|包|袋|瓣|杯半|大杯|小杯|小时|分钟|个钟|钟头|公里|次)\s*(?:就|也|才|能|可以|能够|一定|必然|肯定|准|更|越|还|自)\s*[^。；，]{0,8}(?:养生|健康|精神|提神|醒脑|专注|解乏|解渴|解饿|舒服|舒畅|惬意|活力|精力|充沛|有益|有效|管用|管事|好受|气色|长寿|元气|代谢|免疫|消化|睡眠|皮肤|身体|状态|能量|不困|不睡|睡不着|通宵|到天亮|效果|更好)/,
  // 数词量词 × 物品名词 × 连接词 × 获益（r337 补腿：物品名插中间形）：
  // 「十杯咖啡更能提神醒脑」「两碗饭吃下去更有劲」——原腿0 要求连接词
  // 紧邻量词，物品名词在中间即整类穿透（r337 实测）。允许插入 ≤6 字
  // 物品/动作名（咖啡/茶/酒/糖/饭吃下去…），不跨标点。
  /[一二两三四五六七八九十半几\d]+\s*(?:杯|瓶|口|盅|碗|把|勺|匙|块|颗|粒|根|支|包|袋|瓣|杯半|大杯|小杯|小时|分钟|个钟|钟头|公里|次)\s*(?:的)?\s*(?:咖啡|茶叶|茶水|茶|酒|啤酒|白酒|红酒|糖|糖果|甜食|甜品|可乐|汽水|饮料|奶茶|功能饮料|能量饮料|烟|水|辣椒|油腻|油炸|夜宵|火锅|零食|巧克力|炸鸡|薯片|蛋糕|冰淇淋|烧烤|泡面|方便面|饭|面|粥|药|丸|片|维生素|奶|豆浆|绿豆汤|人参|枸杞)[^。；，！？]{0,6}(?:就|也|才|能|可以|能够|一定|必然|肯定|准|更|越|还|自)\s*[^。；，]{0,8}(?:养生|健康|精神|提神|醒脑|专注|解乏|解渴|解饿|舒服|舒畅|惬意|活力|精力|充沛|有益|有效|管用|管事|好受|气色|长寿|元气|代谢|免疫|消化|睡眠|皮肤|身体|状态|能量|不困|不睡|睡不着|通宵|到天亮|效果|更好|有劲|力气)/,
  // 增量表达 × 连接词 × 获益：「多喝几杯更能养生」「多喝点更养生」
  /(?:多|再|加倍|翻倍|多加|加量|加大|增量|加码)\s*(?:喝|饮|吃|抽|嚼|用|跑|练|来|上)?\s*[一二两三四五六七八九十半\d几]*\s*(?:杯|瓶|口|盅|碗|把|勺|匙|块|颗|粒|根|支|包|袋|点|些|小时|分钟)?\s*(?:就|也|才|能|可以|能够|一定|必然|肯定|更|越|还)\s*[^。；，]{0,8}(?:养生|健康|精神|提神|醒脑|专注|解乏|解渴|解饿|舒服|舒畅|惬意|活力|精力|充沛|有益|有效|管用|管事|好受|气色|长寿|元气|代谢|免疫|消化|睡眠|皮肤|身体|状态|能量|不困|不睡|睡不着|通宵|到天亮|效果|更好)/,
  // 模糊量（一把/几把）× 物品 × 连接词 × 获益：「吃一把糖能精神一整天」
  // r161 教训：模糊量无数字前缀，必须给独立腿形，否则整类穿透。
  /(?:一大把|一把|一小把|半把|几把|若干)\s*(?:的)?\s*(?:糖|糖果|甜食|甜品|零食|巧克力|花生|瓜子|坚果|饼干|蛋糕|药|丸|片|颗|粒)\s*(?:就|也|才|能|可以|能够|一定|必然|肯定|准|更|越|还|自)\s*[^。；，]{0,8}(?:养生|健康|精神|提神|醒脑|专注|解乏|解渴|解饿|舒服|舒畅|惬意|活力|精力|充沛|有益|有效|管用|管事|好受|气色|长寿|元气|代谢|免疫|消化|睡眠|皮肤|身体|状态|能量|不困|不睡|睡不着|通宵|到天亮|效果|更好)/,
  // 「越…越…」获益（日常域）
  /越[^。；，]{0,6}越(?:好|健康|精神|有效|舒服|养生|明显|划算)/,
  // 状态型获益 × 整时段：「通宵不困」「一整天精神」
  /(?:通宵|到天亮|一整晚|一整天|全天)\s*(?:都)?\s*(?:不困|不睡|睡不着|有精神|精神|清醒|状态好|元气|活力)/,
];
const GAIN_EN = [
  // 数量 × 连接动词 × 获益："ten cups keep you up all night" / "more glasses are better"
  /\b(?:more|double|twice|triple|extra|additional|ten|five|eight|three|two|a handful of|a few more|some more)\s+(?:[a-z-]+\s+){0,3}(?:cups?|glasses?|cans?|bottles?|pills?|doses?|servings?|candy|candies|sugar|drinks?|shots?|beers?|bowls?|hours?|minutes?)\b[^.!?;]{0,20}\b(?:so|then|means?|will|can|keeps?|gives?|makes?|are|is|results? in|leads? to)\b[^.!?;]{0,20}\b(?:better|healthier|more effective|all[- ]day|all night|up all night|more energy|more alert|more focused|sharper|stronger|improves?|helps? more|more relaxing|calmer|sleep better|wind down|more soothing|feel calmer|easier to fall asleep|sleep like)\b/i,
  // 增量词 × 物品名词（无单位词）× 重复获益（r337 补腿）：
  // "more wine relaxes you more" / "extra sugar tastes sweeter" —— 增量词后
  // 直接接物品名词而无量词单位，原三条腿均要求量词相邻，整类穿透（r337 实测）。
  /\b(?:more|extra|double|twice|additional|a bit more|a little more|some more)\s+(?:candy|candies|sugar|coffee|tea|wine|beer|alcohol|chocolate|drinks?|water|salt|snacks?|chips|soda|cola|energy drinks?)\b[^.!?;]{0,30}\b(?:relaxes?|calms?|soothes?|helps?|works?|tastes?|feels?|makes? you|keeps? you)\b[^.!?;]{0,20}\b(?:more|better|relaxing|calm|soothing|effective|energ)\w*/i,
  // 模糊量 × 因果动词 × 获益："a handful gives all-day energy"
  /\b(?:a handful|more|extra|double|twice|a bit more|a little more)\s+(?:[a-z-]+\s+){0,3}(?:gives?|means?|leads? to|makes?|keeps?|results? in|brings?)\b[^.!?;]{0,25}\b(?:better|healthier|more effective|all[- ]day|all night|up all night|more energy|more alert|more focused|sharper|stronger|improves?)\b/i,
  // 裸模糊量（无 of）× 获益直接连接："A handful gives all-day energy."
  // 与上条互补：本条不要求「量词名词在因果动词前」——handful 本身即量。
  /\b(?:a handful|a bunch|a couple more|a few more)\b[^.!?;]{0,15}\b(?:gives?|means?|leads? to|makes?|brings?|keeps?)\b[^.!?;]{0,25}\b(?:all[- ]day|all night|up all night|more energy|more alert|more focused|sharper|better|healthier|stronger)\b/i,
];
// 全文剂量/增量表达计数（族三第三条件）
const QUANT_ZH = [
  /[一二两三四五六七八九十半\d]+\s*(?:杯|瓶|口|盅|碗|把|勺|匙|滴|根|支|包|袋|块|颗|粒|瓣|罐|听|盒|份|杯半|大杯|小杯|小时|分钟|个钟|钟头|公里|千米|米|次|组|回|遍|小时以上)/,
  /(?:几|若干|大半|一大把|一把|一小把|半把|多几|多点|多一些|不少|些许)\s*(?:杯|瓶|口|盅|碗|把|勺|匙|块|颗|粒|根|支|包|袋|点|些)?/,
  /(?:多|再|加倍|翻倍|多加|加量|加大|增量|加码)\s*(?:喝|饮|吃|抽|嚼|用|跑|练|来|上)?/,
];
const QUANT_EN = [
  /\b(?:a|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a couple of|half a|a dozen|a few|several|a handful of|a handful)\s+(?:[a-z-]+\s+){0,2}(?:cups?|glasses?|cans?|bottles?|pills?|doses?|servings?|hours?|minutes?|candy|candies|sugar|drinks?|shots?|beers?|slices?|pieces?|spoonfuls?|scoops?|bowls?|handfuls?)\b/i,
  // 裸 handful × 物品（无 of、无单位词）：「a handful gives…」「a handful of candy」
  /\ba handful(?:\s+of)?\s+(?:[a-z-]+\s+){0,2}(?:candy|candies|sugar|coffee|tea|chocolate|chips|snacks?|nuts?|pills?|drinks?)\b/i,
  /\b(?:more|double|twice|triple|extra|additional)\b/i,
];
// ─── [r336] 族三专属推理否定（正确指出应节制/无安全量/有风险）────────────
const EXEMPT_DAILY_ZH = [
  /没有.{0,10}(?:安全|益处|好处|证据|必要|研究|证明|意义)|少[喝抽吃饮]|不宜|忌[酒烟糖辣油]|戒[掉烟酒]?|越少越|节制|适量|适度|控制.{0,4}量|限量|适可而止|过犹不及|物极必反|极必反/,
];
const EXEMPT_DAILY_EN = [
  /\b(?:no safe (?:dose|level|amount)|less is more|in moderation|moderation|cut back|drink less|avoid (?:coffee|alcohol|sugar|smoking)|not safe|can be harmful|too much (?:coffee|alcohol|sugar|caffeine) (?:is|can be)|caffeine (?:limit|sensitivity)|addictive|dependency|overconsumption)\b/i,
];

// ─── [r341] 日常物品剂量外推族：腿② TASK_AMP 能力标记 × 极端任务 ──────────
// 两序均可（「就能通宵」/「通宵不成问题」）。极端任务表刻意窄：只收与
// 日常剂量明显不成比例的任务形（通宵/马拉松/大丰收/扛百斤/深度休息…），
// 「更健康/更有劲/吃饱」类合理效果断言一律不收——精度由窄表 + 升级
// 判定双重承重。
const TASK_AMP_ZH = [
  // 能力标记在前 × 极端任务（同句近距，任务名词前允许 ≤10 字插入）
  /(?:就能|就可以|就足以|足以|都能|都可以|甚至能|还能|更能|准能|包能|肯定|保证|必然|势必|不成问题|不在话下|轻松|轻易|分分钟)[^。；，！？]{0,10}(?:通宵|整夜|彻夜|连夜|连轴|连日|不休|不困|不累|不睡|马拉松|丰收|扛[一二两三四五六七八九十百千\d]+\s*(?:斤|公斤|千克|吨)|挑[^。；，]{0,3}(?:斤|公斤|吨)|背[一二两三四五六七八九十百千\d]+\s*(?:斤|公斤|吨)|搬[一二两三四五六七八九十百千\d]+\s*(?:斤|公斤|吨)|亩产[一二两三四五六七八九十百千万\d]+\s*(?:斤|吨|公斤)|跑完|走完|游完|看完|学完|深度休息|深度睡眠|满分|夺冠|铁人|超人|神仙|无穷|无尽|无限)/,
  // 极端任务在前 × 能力标记（「跑完马拉松都不成问题」）
  /(?:通宵|整夜|彻夜|连夜|连轴|马拉松|大丰收|丰收|扛[一二两三四五六七八九十百千\d]+\s*(?:斤|公斤|吨)|亩产[一二两三四五六七八九十百千万\d]+\s*(?:斤|吨|公斤)|跑完|走完|游完|看完|学完|深度休息|深度睡眠|满分|夺冠|铁人|无穷|无尽|无限)[^。；，！？]{0,6}(?:就能|都可以|都能|不成问题|不在话下|肯定|保证|更是|更是能)/,
];
const TASK_AMP_EN = [
  // will/can × extreme task（允许 ≤4 词插入：will power a whole marathon）
  /\b(?:will|would|can|could|shall|going to|gonna)\s+(?:[a-z]+\s+){0,4}(?:keep you up|stay up|pull an all[- ]?nighter|all[- ]?nighter|all week|all night|nonstop|non-stop|without (?:sleep|rest|sleeping|stopping)|deepen|marathon|harvest|yield|finish line|beast|monster|superhero|superhuman|champion|world[- ]class)\b/i,
  // guarantee/ensure × outcome noun
  /\b(?:guarantee|guarantees|guaranteed|ensure|ensures|ensuring|assure|assures)\s+(?:[a-z]+\s+){0,3}(?:harvest|yield|crop|record|victory|success|win)\b/i,
  // 搬运/运动类动词 × 数量宾语（carry a hundred jin / run a hundred miles）
  /\b(?:carry|lift|haul|move|tote|run|walk|swim|cycle|jog|hike)\s+(?:[a-z]+\s+){0,3}(?:hundred|thousand|dozens?|scores|pounds?|lbs?|kilos?|kilograms?|jin|catties|miles?|kilometers?|kilometres?)\b/i,
];

// ─── [r341 保留] 剂量升级判定（族四极端任务族精度承重墙） ─────────────────────────────────────────────────
// 族三精度承重墙：全文必须出现**同一单位的两个数量且大者 ≥3 倍小者**
// （一勺…十勺 / one cup…ten cups）。单剂量良性陈述（「睡够八小时更能
// 进入深度休息」）因此不判。单位归一化：去「个」前缀（个小时→小时）、
// 英文去复数后缀（cups→cup）。
const ZH_NUM = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const EN_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30, fifty: 50, hundred: 100, thousand: 1000, dozen: 12, couple: 2, half: 0.5, a: 1, an: 1, single: 1 };

function numVal(tok) {
  if (/^\d+(?:\.\d+)?$/.test(tok)) return parseFloat(tok);
  if (tok === '十') return 10;
  if (tok === '百') return 100;
  if (tok === '千') return 1000;
  if (tok === '半') return 0.5;
  const m = /^([一二两三四五六七八九])?十([一二两三四五六七八九])?$/.exec(tok);
  if (m) return (ZH_NUM[m[1] || '一']) * 10 + (m[2] ? ZH_NUM[m[2]] : 0);
  if (/^[一二两三四五六七八九]$/.test(tok)) return ZH_NUM[tok];
  const mb = /^([一二两三四五六七八九])百([一二两三四五六七八九]?十[一二两三四五六七八九]?)?$/.exec(tok);
  if (mb) return ZH_NUM[mb[1]] * 100 + (mb[2] ? numVal(mb[2]) : 0);
  // 英文数词回退（one/ten/half/a…）：大小写已在调用方归一
  const e = EN_NUM[tok];
  return e !== undefined ? e : null;
}

function normUnit(u) {
  // 英文复数归一：sibilant(s/x/z/ch/sh)+es 剥 es（glasses→glass/boxes→box），
  // 其余只剥尾部 s（bottles→bottle/cups→cup），但 ss 结尾（glass）不剥——
  // 早前双剥离把 bottles 切成 bottl 与 bottle 对不上、glass 切成 glas，
  // 升级判定恒 false。
  let s = String(u).toLowerCase().replace(/^个/, '');
  if (/(?:s|x|z|ch|sh)es$/.test(s)) s = s.replace(/es$/, '');
  else if (/s$/.test(s) && !/ss$/.test(s)) s = s.replace(/s$/, '');
  return s;
}

/** 从腿①表抽 (数量, 单位) 对，判同一单位大者 ≥3 倍小者 */
function hasDailyEscalation(text) {
  const byUnit = {};
  const collect = (list) => {
    for (const re of list) {
      const g = new RegExp(re.source, 'gi');
      let m;
      while ((m = g.exec(text)) !== null) {
        const raw = String(m[1]).toLowerCase();
        const qty = numVal(raw);
        if (typeof qty !== 'number' || !isFinite(qty) || qty <= 0) continue;
        const u = normUnit(m[2]);
        (byUnit[u] = byUnit[u] || []).push(qty);
        if (m.index === g.lastIndex) g.lastIndex++;
      }
    }
  };
  collect(DAILY_IN_ZH);
  collect(DAILY_IN_EN);
  for (const u in byUnit) {
    const arr = byUnit[u];
    if (arr.length >= 2 && Math.max.apply(null, arr) >= 3 * Math.min.apply(null, arr)) return true;
  }
  return false;
}


// ─── 豁免一：概念/教学转述 ──────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /剂量反应|量效关系|线性外推|非线性|治疗窗|平台期|饱和点|半数有效量|半数致死量|有效剂量|致死剂量|血药浓度|药代动力学|毒理学|药理学|药物代谢/,
  /统计学|教科书|课本|教材|课堂|教案|论文|科普|谬误|误区|陷阱|概念|定义/,
];
const EXEMPT_META_EN = [
  /\b(?:dose[-\u2013\s]?response|dose[-\u2013\s]?effect|linear\s+extrapolation|therapeutic\s+window|plateau|saturation|EC50|ED50|LD50|IC50|pharmacokinetics|pharmacodynamics|toxicology|pharmacology|statistics|textbook|lecture|fallacy)\b/i,
];

// ─── 豁免二：实验/证据语境（受控设计或专业医疗监护）────────────────────
const EXEMPT_EVID_ZH = [
  /临床试验|随机对照|对照组|实验组|双盲|安慰剂|盲测|队列|元分析|系统性综述|前瞻性|回顾性|数据表明|统计显示|研究表明|研究显示|证据表明|实验表明|实测/,
  /医嘱|遵医嘱|处方|医嘱剂量|说明书|按说明|逐步加量|缓慢加量|滴定|最大耐受剂量|监测肝肾功能|定期复查|复诊|在医生指导下|医疗监护|静脉给药|输液|静滴/,
];
const EXEMPT_EVID_EN = [
  /\b(?:randomi[sz]ed|controlled\s+trial|RCT|control\s+group|treatment\s+group|placebo|double[-\s]blind|prospective|cohort|meta[-\s]analysis|systematic\s+review|clinical\s+trial|data\s+show|data\s+suggest|evidence\s+shows|studies\s+show|experiment)\b/i,
  /\b(?:prescribed|prescription|under\s+medical\s+supervision|as\s+directed|follow(?:ing)?\s+(?:the\s+)?(?:doctor|physician|label)\w*|dosage\s+instructions|maximum\s+tolerated\s+dose|MTD|titrat\w+|monitor\w*\s+(?:liver|kidney|renal|hepatic)|consult\s+(?:a|your)\s+(?:doctor|physician|pharmacist))\b/i,
];

// ─── 豁免三：推理否定 / 反向承认 ────────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不是线性|并非线性|非线性|不成比例|不等于|并不意味着|不代表|有上限|有限度|过犹不及|适得其反|物极必反|会中毒|有毒性|有毒|风险更高|反而有害|反而致死|过量|中毒|超量|用药过量|服药过量|超过.{0,6}(?:上限|剂量|用量)/,
  /不会|并不会|不意味着|不见得|并无|没有.{0,4}(?:必要|意义|依据)|反而.{0,4}(?:有风险|更危险|受伤|更差)|有害|更差|反而.{0,4}(?:心慌|失眠|睡不着|难受|不舒服|伤身|上瘾|长胖|变胖|恶心|头晕|反胃|胃痛|拉肚子|长痘|早衰|折寿|伤肝|伤肾|伤胃|致癌|中毒)/,
  /不能说明|不能证明|推不出|不足以|未必|不一定|很难说|不见得|说不清|难以确定|无法确定/,
];
const EXEMPT_NEG_EN = [
  /\b(?:not\s+linear|non[-\s]?linear|not\s+proportional|does\s+not\s+scale|doesn'?t\s+scale|plateaus?|saturates?|diminishing\s+returns|too\s+much\s+is\s+harmful|toxic|overdose|lethal|fatal|ceiling\s+effect|maximum\s+effect|no\s+further\s+benefit|harmful\s+at\s+higher\s+doses)\b/i,
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|not\s+necessarily|insufficient|no\s+evidence|does\s+not\s+prove|fails\s+to\s+show)\b/i,
];

// ─── 豁免四：对冲 ──────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|i\s+suspect|could\s+be)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 收集 source 列表中所有匹配的起始下标 */
function positions(list, text) {
  const out = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      out.push(m.index);
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return out;
}

/**
 * 双腿 + 邻近窗：存在 d∈DOSE, l∈LINEARITY 使 |d-l| ≤ WIN。
 * 窗口取 60（ZH）/ 160（EN）：腿①剂量陈述与腿②外推断言通常同句或紧邻
 * 分句，宽松窗由腿②的定量断言形兜底（"越…越…"/"N倍"必须是显式外推）。
 */
function coLocated(dose, lin, win) {
  for (const d of dose) {
    for (const l of lin) {
      if (Math.abs(d - l) <= win) return true;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkDoseResponseLinearity(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 实验证据 / 推理否定 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const win = isZh ? 60 : 160;

  // ── 族一：健康剂量-反应线性外推（r306 原族，计分/细节零改动）──────────
  const dose = positions(R.DOSE_ZH || DOSE_ZH, text).concat(positions(R.DOSE_EN || DOSE_EN, text));
  const lin = positions(R.LINEARITY_ZH || LINEARITY_ZH, text).concat(positions(R.LINEARITY_EN || LINEARITY_EN, text));
  if (dose.length > 0 && lin.length > 0 && coLocated(dose, lin, win)) {
    // 计分：双腿共现基础 0.62；显式倍数/比例词（倍/番/成比例/times/linearly）
    // +0.08；极端剂量断言（越多越好/多多益善/more is better）+0.05，封顶 0.85。
    let score = 0.62;
    if (/(?:倍|番|成比例|线性)/.test(text) || /\b(?:times|linearly|proportionally|2x|3x|5x|10x)\b/i.test(text)) score += 0.08;
    if (/越多越好|多多益善/.test(text) || /\b(?:more\s+is\s+better|the\s+more\s+the\s+better)\b/i.test(text)) score += 0.05;
    if (score > 0.85) score = 0.85;
    const detail = isZh
      ? '剂量-反应线性外推：把有效剂量的效果按比例放大到更大剂量(zh)'
      : 'linear dose-response extrapolation: effect assumed to scale with dose(en)';
    return { hit: true, score, count: 1, detail };
  }

  // ── 族二：现代规模 scaling 域线性缩放假设（r330 新族，OR 并联）────────
  // 专属推理否定（瓶颈/边际递减/规模不经济…）仅在本族判定，不污染健康族。
  if (anyHit(R.EXEMPT_SCALE_NEG_ZH || EXEMPT_SCALE_NEG_ZH, text) || anyHit(R.EXEMPT_SCALE_NEG_EN || EXEMPT_SCALE_NEG_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  const sIn = positions(R.SCALE_IN_ZH || SCALE_IN_ZH, text).concat(positions(R.SCALE_IN_EN || SCALE_IN_EN, text));
  const sOut = positions(R.SCALE_OUT_ZH || SCALE_OUT_ZH, text).concat(positions(R.SCALE_OUT_EN || SCALE_OUT_EN, text));
  if (sIn.length > 0 && sOut.length > 0 && coLocated(sIn, sOut, win)) {
    let score = 0.62;
    if (/(?:倍|番|成比例|线性)/.test(text) || /\b(?:times|linearly|proportionally|2x|3x|5x|10x|twice|double)\b/i.test(text)) score += 0.08;
    if (score > 0.85) score = 0.85;
    const detail = isZh
      ? '规模线性缩放假设：把投入增减线性外推到产出按比例放大(zh)'
      : 'linear scaling assumption: output assumed to scale proportionally with input(en)';
    return { hit: true, score, count: 1, detail };
  }

  // ── 族三：日常摄入/投入品 × 增量 × 状态获益外推（r336 新族，OR 并联）──
  // 专属推理否定仅在本族判定，不污染族一/族二。
  if (anyHit(R.EXEMPT_DAILY_ZH || EXEMPT_DAILY_ZH, text) || anyHit(R.EXEMPT_DAILY_EN || EXEMPT_DAILY_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  const dIn = positions(R.DAILY_IN_ZH || DAILY_IN_ZH, text).concat(positions(R.DAILY_IN_EN || DAILY_IN_EN, text));
  const dGain = positions(R.GAIN_ZH || GAIN_ZH, text).concat(positions(R.GAIN_EN || GAIN_EN, text));
  // 第三条件：全文剂量/增量表达 ≥2 或含显式增量词（多/再/加倍/翻倍/more…）
  let quantCount = 0;
  for (const re of (isZh ? (R.QUANT_ZH || QUANT_ZH) : (R.QUANT_EN || QUANT_EN))) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) { quantCount++; if (m.index === g.lastIndex) g.lastIndex++; }
  }
  const hasIncrement = /(?:多|再|加倍|翻倍|多加|加量|加大|增量|加码)/.test(text) || /\b(?:more|double|twice|triple|extra|additional)\b/i.test(text);
  if (dIn.length > 0 && dGain.length > 0 && (quantCount >= 2 || hasIncrement)) {
    // 计分与既有两族同构：双腿共现 0.62 + 显式增量词 0.08，封顶 0.70——
    // 本族投放域是日常话语、模糊量断言强度低于显式倍数，刻意压低上限避免
    // 误把养生聊天当硬断言（仍进 VERIFY 层，高于任何 pass 阈值）。
    let score = 0.62;
    if (hasIncrement) score += 0.08;
    if (score > 0.70) score = 0.70;
    const detail = isZh
      ? '日常物品剂量外推：把日常摄入的模糊增量外推为状态获益放大(zh)'
      : 'daily-item dose extrapolation: vague intake increment assumed to amplify outcome(en)';
    return { hit: true, score, count: 1, detail };
  }

  // ── 族四：日常物品剂量外推 × 极端任务（r341 新族，OR 并联）────────────
  // 与族三同一外推结构的不同句式投放：腿②改用**极端任务形**（通宵/马拉松/
  // 扛百斤/all-nighter）而非状态获益词，精度由剂量升级判定承重（同一单位
  // 两数量大者 ≥3 倍小者）。族三/族四互不依赖，任一命中即判。
  const tAmp = positions(R.TASK_AMP_ZH || TASK_AMP_ZH, text).concat(positions(R.TASK_AMP_EN || TASK_AMP_EN, text));
  if (tAmp.length > 0 && coLocated(dIn, tAmp, win) && hasDailyEscalation(text)) {
    // 计分与族一一致：双腿+升级判定基础 0.62；显式倍数/比例词 +0.08，封顶 0.85。
    let score = 0.62;
    if (/(?:倍|番|成比例|线性)/.test(text) || /\b(?:times|linearly|proportionally|2x|3x|5x|10x)\b/i.test(text)) score += 0.08;
    if (score > 0.85) score = 0.85;
    const detail = isZh
      ? '日常物品剂量外推：把少量日常物品的效果线性放大到极端任务(zh)'
      : 'daily-item dose extrapolation: effect assumed to scale up to extreme tasks(en)';
    return { hit: true, score, count: 1, detail };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkDoseResponseLinearity,
  __internals: () => ({
    DOSE_ZH, DOSE_EN, LINEARITY_ZH, LINEARITY_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    SCALE_IN_ZH, SCALE_IN_EN, SCALE_OUT_ZH, SCALE_OUT_EN,
    EXEMPT_SCALE_NEG_ZH, EXEMPT_SCALE_NEG_EN,
    DAILY_IN_ZH, DAILY_IN_EN, GAIN_ZH, GAIN_EN,
    QUANT_ZH, QUANT_EN, EXEMPT_DAILY_ZH, EXEMPT_DAILY_EN,
    TASK_AMP_ZH, TASK_AMP_EN, hasDailyEscalation, numVal, normUnit,
  }),
};
