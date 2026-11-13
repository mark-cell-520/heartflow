/**
 * src/perverse-incentive.js — 「激励反噬」检测器
 * （ provisional 第 224 个判别维度，r236 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r236-dimension-agent4.md
 * §五。编号 provisional 的原因同 r228-r235：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235) 十一个已起草未接线维度占号，最终编号由 1 号
 * 按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r236 立项] 零命中探针 coordination/agent4/probes/r236-zerohit-probe.js
 * + r236-fp-stress.js（v6.8.145 gate() 全量 findings 实测）：三候选族
 * 竞品——A 货币幻觉（名义-实际混同）攻击 2/8 完全穿透、且疑难良性
 * 2/5 已被既有数字维度（perfect_error/unsupported_claim）代拦，族性
 * 与数字语境重叠；B 赢家诅咒攻击 4/8 穿透；C 激励反噬攻击 7/8 完全
 * 穿透（余 1 条为 post_hoc/pseudo_causal 泛维度代拦），疑难良性 12 条
 * 中 11 条 pass（1 条 info_deprivation 泛维度代拦），无任何维度以
 * 「量化激励设计 × 反向行为滋生 × 认可」三腿语义承重——C 胜出。
 * src/ 下 reward_hacking 管「自认式指标作弊」（必有换成/改为/刷分/
 * 让指标好看的自认标记）、proxy_metric_goal 管「指标读数替代目标」
 * （无激励设计、无反向行为腿），均不覆盖本族。
 *
 * 外部来源：空返，按既有形态自建。r236 海外扫描（原始证据
 * coordination/agent4/scout/*20261106-2211{12,13,14}*）：arXiv OR
 * 噪声查询 15/15 均为无关最新论文、GitHub 0 命中、Semantic Scholar
 * 429 限流空返。判据为心虫自有纯规则实现（家族定义取自行为经济学/
 * 公共政策的标准描述：perverse incentive / 激励反噬 / cobra effect
 * ——按可量化的计数（条数/次数/人头/销量）设计奖惩，会系统性地
 * 奖励被计数的行为本身而非所欲目标，从而滋生反向行为：悬赏捕蛇
 * 有人养蛇领赏、按次罚款企业包月违规、按结案数考核专挑简单案子）。
 *
 * 辨别的族：激励反噬（perverse incentive / cobra effect）——**量化
 * 激励设计**（悬赏/按X计酬/按次罚款/考核挂钩计数）× **反向行为
 * 滋生**（养蛇再交/刷单/包月违规/专挑简单案子/放鼠再抓/凑数拆单）
 * × **认可或正面结果断言**（效果好/效率提升/指标完成/双赢/制度
 * 成功/照发；EN worked/as intended/boosted/hitting their quotas/
 * win-win）三腿共现：
 *   悬赏捕蛇效果好，村民养的蛇交上来，赏金照发，蛇患很快缓解。
 *   按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。
 *   按罚款次数收费之后，企业包月违规，财政收入反而增加了，
 *   这说明制度设计成功。
 *   Bounty programs work: villagers bred the snakes, handed them
 *   in, and collected the reward as intended.
 *   Paying per rat caught boosted results — workers released rats
 *   and recaptured them, hitting their quotas.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：按计数设计的
 * 奖惩会把「被计数的行为」变成目标本身——领赏者优化的是赏金
 * 而非蛇患，被罚者优化的是罚款总额而非合规。当一段推理把这种
 * 已被反向行为污染的产出当作「制度成功/效率提升」的证据时，
 * 它把一个自我抵消的设计当成了有效设计。与正当表述有明确界线：
 * 问题化/批评（适得其反/被叫停/漏洞/backfired）、防范建议
 * （预防/严查/guard against）、元话语（激励反噬是指…）——均豁免。
 *
 * 与既有维度的边界（r236 归因）：
 *   · reward_hacking（BLOCK）及其 metric_substitution /
 *     metric_denominator_gaming / best_run_picking 族管**自认式
 *     指标作弊**（句中必有「换成/改为/优化…而不是/刷分/让指标
 *     好看」的作弊自认标记，说话者承认自己在操纵指标）；本族判
 *     **制度设计层面的激励扭曲**——反向行为由第三方（领赏者/
 *     被罚者/被考核者）实施，且说话者把它当作成功来认可。
 *   · proxy_metric_goal（第 187 维）管**指标读数替代目标本身**
 *     （KPI 完成所以目标达成），句中无激励设计、无反向行为；
 *     本族三腿判据要求激励设计腿与反向行为腿同时在场。
 *   · post_hoc / pseudo_causal 管泛时间先后与泛因果断言；本族
 *     有明确的「计数奖惩→反向行为→认可」机制结构，后两者不触
 *     及「按计数发钱会奖励被计数的行为」这一政策推理内核。
 *   · statistical_misleading / percentage_overflow 管比例数字
 *     呈现；本族句中可无任何百分比。
 *
 * 判据（三腿共现，缺一不判）：
 *   ① 腿① INCENTIVE 量化激励/奖惩设计——悬赏/重赏/赏金/按X
 *      (数量|次数|件数|人头|销量|条数|单量|结案数)计酬|发奖金|
 *      提成|收费|罚款/(奖金|提成|绩效|罚款)与X挂钩/罚款按次/
 *      考核(指标|升学率|完成率|结案率)；EN paid per / per-unit /
 *      bounty / reward for each / fined per / penalty per /
 *      bonus tied to / quota；
 *   ② 腿② GAMING 反向行为滋生——养(蛇|鼠|虫)再交/领赏/刷单/
 *      自己进货/自买自卖/虚假交易/数据造假/刷量刷分/包月违规/
 *      专挑简单案子/只盯上榜/放鼠再抓/凑数/拆单/避重就轻；
 *      EN bred the snakes / released rats and recaptured / gaming
 *      the metric / padded the numbers / cherry-picked the easy
 *      cases / bought their own products；
 *   ③ 腿③ ENDORSE 认可/正面结果断言——效果好/成效显著/事半功倍/
 *      效率提升/指标完成/超额完成/双赢/制度成功/奏效/照发/很快
 *      缓解/收入增加；EN worked / as intended / as planned /
 *      boosted / hitting their quotas / met their targets /
 *      win-win / rewards were paid。
 *   腿①×腿②、腿②×腿③分别落在近距离窗内（ZH 60 字 / EN 180
 *   字符）；腿②腿③的匹配若被否定前缀修饰（预防刷单/效率并未
 *   提升）不计。
 *
 * 为什么取 VERIFY 级：单句可能是在转述一个已失败的政策案例而
 * 未及展开批评、或引用「激励反噬」概念的教学句（这两类由豁免
 * 覆盖），也可能是真诚相信计数奖惩有效的设计陈述。verify 的
 * 语义是「这段话把计数奖惩下被反向行为污染的产出当成了成功
 * 证据，先核实该指标是否已被博弈、目标本身是否真被推进，
 * 再决定是否采信其效率/成功结论」。
 *
 * 明确不判的（豁免，均可负例注入证明承重）：
 *   · 问题化/批评语境（适得其反/被叫停/被迫终止/失败/漏洞/
 *     严查/追回/依法/欺诈/需要防范/警惕；EN backfired /
 *     canceled / failed / flaw / crackdown / prevented /
 *     needs to be addressed）——说话者已指出激励扭曲，正是
 *     本族解药；
 *   · 元话语概念引述（激励反噬/眼镜蛇效应/反向激励/perverse
 *     incentive / cobra effect / Goodhart）——讨论本族名称的
 *     教学/定义句；
 *   · 缺任一跳线、或腿②腿③被否定前缀修饰（「预防刷单」
 *     「效率并未提升」）——双腿/三腿判据天然不命中。
 */
'use strict';

// ─── 腿① 量化激励/奖惩设计（中文）────────────────────────────────
// 只收「按计数发钱/按计数罚」的设计陈述，不收无计数的笼统激励
// （「加大投入/政策扶持」无计数，不构成本族的设计漏洞）。
const INCENTIVE_ZH = [
  // ①-a 悬赏/重赏/赏金（捕蛇/举报/上交类悬赏）
  /(?:悬赏|重赏|花重赏|设赏|赏金)/,
  // ①-b 按X(数量|次数|…)计酬/发奖金/提成/收费/罚款/考核
  /按[^。，！？；\n]{0,8}(?:数量|次数|件数|人头|销量|条数|金额|单量|案件数|结案数|点击数|下载量|篇数|论文数|头数|只数|个数|批次|票数|粉丝数|注册数|合同数|案例数|完成数|字数)[^。，！？；\n]{0,10}(?:计酬|计费|发钱|发奖金|发奖|提成|奖励|结算|收费|罚款|罚钱|处罚|核算|折算|兑现|分成|考核|考评|评比|计分|排名)/,
  // ①-b2 按率/按量/按数 + 给/发/奖（升学率给奖金/按字数给稿费族）
  /按[^。，！？；\n]{0,6}(?:率|量|数|价|额)[^。，！？；\n]{0,4}(?:给|发|奖|赏|罚|扣|提成|计酬)/,
  // ①-c 奖金/提成/绩效/罚款 与X挂钩/按X线性
  /(?:奖金|提成|绩效|奖励|罚金|罚款|处罚)[^。，！？；\n]{0,8}(?:与|跟|同|按)[^。，！？；\n]{0,10}(?:数量|次数|件数|人头|销量|条数|单量|结案数|挂钩|成正比|线性|直接挂钩|单列)/,
  // ①-d 罚款/罚金 按次/按笔/每次
  /(?:罚款|罚金|处罚|违约金)[^。，！？；\n]{0,6}(?:按次|按笔|每次|每一笔|每单|逐单|单次)/,
  // ①-e 考核/评比 + 计数指标
  /(?:考核|考评|评比|排名|计分)[^。，！？；\n]{0,8}(?:指标|升学率|完成率|结案率|合格率|优秀率|达标率|数量|件数|人头|销量)/,
  // ①-f 计件/包干式付酬
  /(?:计件工资|计件付酬|包干到人|按件计酬|按单计酬|按例计酬|按人头)/,
];

// ─── 腿① 量化激励/奖惩设计（英文）────────────────────────────────
const INCENTIVE_EN = [
  // ①-a paid per / pay for each / by the X
  /\bpaid\s+(?:per|for\s+each|by\s+the)\b/i,
  /\bpay(?:s|ing)?\s+(?:per|for\s+each|by\s+the)\b/i,
  /\bper[- ](?:unit|item|case|rat|snake|head|click|download|paper|signup|conversion|kill)\b/i,
  // ①-b bounty / reward for each|every|handing|killing
  /\bbounty\b/i,
  /\breward(?:ed|s)?\s+for\s+(?:each|every|killing|handing|handing\s+in|catching)\b/i,
  /\bbonus\s+for\s+(?:each|every)\b/i,
  /\bpaid\s+(?:a\s+)?(?:bonus|reward|premium)\s+for\s+(?:each|every)\b/i,
  // ①-c fined per / penalty per / charged per / surcharge per
  /\b(?:fined?|penalt(?:y|ies)|charged?|surcharge[sd]?)\s+per\b/i,
  /\bfine\s+for\s+each\b/i,
  // ①-d bonus tied to / commission on / quota
  /\bbonus\s+(?:tied|linked|pegged)\s+to\b/i,
  /\bcommission\s+on\b/i,
  /\bquota\b/i,
  /\bpay\s+(?:is\s+)?(?:based|tied)\s+on\s+(?:the\s+)?(?:number|count|volume)\b/i,
];

// ─── 腿② 反向行为滋生（中文）────────────────────────────────────
const GAMING_ZH = [
  // ②-a 养蛇/养鼠再交/领赏（悬赏捕蛇族；允许逗号在gap中——「养起老鼠来，交一头」）
  /养[^。！？；\n]{0,3}(?:蛇|鼠|虫|畜|害兽)[^。！？；\n]{0,6}(?:交|上缴|缴|领赏|换赏|邀赏|卖)/,
  /(?:繁殖|培育)[^。！？；\n]{0,4}(?:蛇|鼠|虫)[^。！？；\n]{0,6}(?:交|领赏|卖)/,
  // ②-b 刷单/刷量/造假（销量/流量族）
  /(?:刷单|刷量|刷分|刷榜|刷榜|自己进货|自买自卖|虚假交易|数据造假|数字造假|编造数据|注水|虚报|凑单)/,
  // ②-c 包月违规/故意多违（按次罚款族）
  /(?:包月违规|包年违规|包月违|索性多违|故意多违|专挑多罚|顶格违规)/,
  // ②-d 专挑简单案子（结案数量考核族）
  /(?:专挑|只挑|优先挑|净挑|挑)[^。，！？；\n]{0,6}(?:简单|容易|小额|轻松|省事|省力)[^。，！？；\n]{0,3}(?:案子|案件|业务|活|任务|单子)/,
  /(?:避重就轻|挑肥拣瘦|拈轻怕重)/,
  // ②-e 只盯上榜/高分（升学率考核族）
  /(?:只盯|只顾|只关注|只照顾)[^。，！？；\n]{0,8}(?:上榜|提分|高分|尖子|及格率|升学率|排名)/,
  // ②-f 放鼠再抓/先放后抓（捕鼠计酬族）
  /(?:放[^。，！？；\n]{0,2}(?:鼠|蛇|虫)[^。，！？；\n]{0,2}抓|先放后抓|捉了放|放了捉|循环利用)/,
  // ②-g 凑数/拆单（计数指标族）
  /(?:凑数|凑指标|凑件数|凑人头|拆单|拆案|一案拆成|一案多立|报假数)/,
];

// ─── 腿② 反向行为滋生（英文）────────────────────────────────────
const GAMING_EN = [
  // ②-a bred the snakes / bred to collect
  /\bbre(?:d|ds|ding)\s+(?:the\s+)?(?:snakes?|rats?|pests?|vermin)\b/i,
  /\bbre(?:d|ds)\s+to\s+(?:collect|claim|get|collecting)\b/i,
  // ②-b released rats and recaptured / catch-and-release
  /\breleased?\s+(?:rats?|snakes?|pests?)\s+and\s+(?:recaptured|caught|re-caught)\b/i,
  /\bcatch[- ]and[- ]release\b/i,
  // ②-c gaming the metric / game the system
  /\bgam(?:e|es|ed|ing)\s+the\s+(?:metric|system|numbers?|quota)\b/i,
  // ②-d padded / fudged the numbers
  /\b(?:padded?|padding|fudg(?:e|ed|es|ing))\s+(?:the\s+)?(?:numbers?|stats?|statistics|figures)\b/i,
  // ②-e cherry-picked the easy cases
  /\bcherry[- ]pick(?:ed|ing|s)?\s+(?:the\s+)?(?:easy|simple|small)\s+(?:cases?|claims?|tasks?|ones?)\b/i,
  /\bpick(?:ed|ing)?\s+(?:only\s+)?(?:the\s+)?easy\s+(?:cases?|claims?|ones?)\b/i,
  // ②-f bought their own products / self-dealing
  /\bbou(?:ght|ying|ys?)\s+(?:their|his|her|our)\s+own\s+(?:products?|goods?|stuff)\b/i,
  /\bself[- ]dealing\b/i,
  /\bfake\s+(?:sales?|orders?|transactions?)\b/i,
  // ②-g flat-rate violation / violate at will / monthly pass
  /\b(?:flat[- ]rate\s+(?:violation|fine)|violate\s+at\s+will|monthly\s+pass)\b/i,
  /\bsplit(?:ting)?\s+(?:up\s+)?(?:cases?|claims?|orders?)\s+to\s+(?:hit|meet|boost)\b/i,
];

// ─── 腿③ 认可/正面结果断言（中文）────────────────────────────────
const ENDORSE_ZH = [
  // ③-a 效果好/成效显著/事半功倍/立竿见影
  /(?:效果|成效)(?:很|真|相当|显著|明显)?(?:好|显著|突出|出众)/,
  /(?:事半功倍|立竿见影|行之有效|卓有成效)/,
  // ③-b 效率/产能/成绩/数据 提升
  /(?:效率|产能|产出)[^。，！？；\n]{0,4}(?:提升|提高|上去|改善|翻倍)/,
  /(?:成绩|分数|业绩|数据|指标)[^。，！？；\n]{0,4}(?:稳步|明显|大幅|显著)?(?:提高|提升|上升|增长|向好)/,
  // ③-c 指标完成/超额完成
  /(?:指标|任务)[^。，！？；\n]{0,6}(?:月月|年年|连续|全部|均|都)?(?:超额)?(?:完成|达成|达标|超额)/,
  /(?:超额完成|提前完成|圆满收官)/,
  // ③-d 双赢/皆大欢喜
  /(?:双赢|皆大欢喜|多方共赢|一举多得)/,
  // ③-e 制度/政策/设计 成功/奏效
  /(?:制度|政策|举措|办法|设计|机制|方案)[^。，！？；\n]{0,6}(?:很|非常|相当|极其)?(?:成功|奏效|有效|管用|见效)/,
  // ③-f 照发/照给（赏金按计数照付）
  /(?:赏金|奖金|报酬|钱款|款项)(?:照发|照给|照付|一分不少|一分没少|如数)/,
  /(?:照发|照给|照付)/,
  // ③-g 问题很快缓解/解决（悬赏类目标被宣称达成）
  /(?:很快|迅速|明显|大幅)?(?:缓解|解决|好转|根治)/,
  /(?:迎刃而解|药到病除|一扫而空)/,
  // ③-h 收入/税收/财政 增加
  /(?:收入|税收|财政|营收|业绩)[^。，！？；\n]{0,8}(?:增加|增长|提高|翻倍)/,
];

// ─── 腿③ 认可/正面结果断言（英文）────────────────────────────────
const ENDORSE_EN = [
  // ③-a worked (well|great|perfectly) / a success / successful / effective
  /\bwork(?:ed|s)?\s+(?:well|great|perfectly|beautifully|as\s+intended)\b/i,
  /\b(?:a\s+success|successful|effective|efficient)\b/i,
  /\bas\s+intended\b/i,
  /\bas\s+planned\b/i,
  // ③-b boosted / doubled（结果名词在前或在后）
  /\bboost(?:ed|s|ing)?\b/i,
  /\b(?:results?|efficiency|productivity|output|numbers?|revenue|collections?|scores?|grades?|income|takings)\s+(?:improved|increased|boosted|doubled|rose|grew)\b/i,
  /\b(?:improved|increased|boosted|doubled)\s+(?:results?|efficiency|productivity|output|revenue|collections?)\b/i,
  // ③-c hit / met their quotas or targets
  /\bhit(?:ting|ted)?\s+(?:their\s+)?(?:quotas?|targets?)\b/i,
  /\bmet\s+(?:their\s+)?(?:quotas?|targets?)\b/i,
  // ③-d win-win / rewards were paid (as usual|in full)
  /\bwin[- ]win\b/i,
  /\b(?:rewards?|bount(?:y|ies)|payments?)\s+(?:were\s+)?paid\b/i,
  /\bpaid\s+out\s+(?:in\s+full|as\s+usual|like\s+clockwork)\b/i,
];

// ═══════════════════════════════════════════════════════════════════
// [r320] 「专业与公共部门按计数考核滋生数量压倒质量的反向行为」新措辞家族
// （平行常量，不动存量三腿与 r236 逻辑）
//
// 缺口实证（scripts/round-320/probe-perverse-domains.js + probe-leg-diagnosis.js，
// v6.8.179 基线）：存量三腿只收悬赏捕蛇/计件工资/按次罚款/按结案数等经典
// 域，医疗按量考核、执法罚款配额、学术唯论文数等现代公共服务域 11/11 完全
// 穿透（mod=false、gate=pass、econ_reasoning_gate 归因 0），良性零误伤。
// 根因是三腿均缺这些域的专业措辞：
//   · 腿① 缺 按门诊量/手术台次/床位使用率/就诊量/拘留人数/论文数/立项数/
//     影响因子点数 + 计酬/发奖/考核/排名/评职称；
//   · 腿② 缺 小病大开/过度医疗/能保守也开刀/能出院也留/专挑外地车牌/
//     能调解也统统拘留/反复驱赶/拆成几篇灌水/一稿多投/专挑好发的/包装成多个项目；
//   · 腿③ 缺 数字上去了/产量激增/立项数创新高/办案数量节节高/遥遥领先。
// 设计纪律（同 r309–r319）：平行常量 + findSignatures concat，存量三腿与
// 豁免层一字不动；新腿走存量 collectLegs(…, useNeg) 否定守卫；窗距沿用 60/180。
// ═══════════════════════════════════════════════════════════════════

// ─── [r320] 腿① 专业/公共部门按计数考核（中文）──────────────────
const INCENTIVE_ZH2 = [
  // 按门诊量/手术台次/床位使用率/就诊量/例数 + 计酬/发奖/拿补贴/考核/排名/挂钩
  /按[^。，！？；\n]{0,6}(?:量|台次|例数|人次|使用率|周转|手术量|门诊量)[^。，！？；\n]{0,6}(?:计酬|计费|发奖金|发奖|拿补贴|拿奖金|算绩效|评优|排名|考核|提成|兑现|挂钩|分成)/,
  // 按论文数/立项数/项目数/课题数/发文量 + 评职称/考核/算绩效/发奖金
  /按[^。，！？；\n]{0,6}(?:论文数|立项数|项目数|课题数|发文量|申请数|专利数|引用数)[^。，！？；\n]{0,6}(?:评|考核|算|发|计|奖|排名|评审|兑现)/,
  // 按影响因子/点数/积分/工分 + 发/奖/算
  /按[^。，！？；\n]{0,6}(?:影响因子|点数|积分|工分|分值)[^。，！？；\n]{0,4}(?:发|奖|算|计|评)/,
  // 罚单/罚款/查处/办案/拘留 数量/件数/人数 + 发补贴/考核/排名（存量 ①-b2 未收的连用形）
  /(?:罚单|罚款|查处|办案|结案|拘留|处罚|罚没)[^。，！？；\n]{0,4}(?:数量|件数|人数|单数|指标)[^。，！？；\n]{0,4}(?:发|奖|考核|排名|补贴|提成|兑现|分成)/,
];

// ─── [r320] 腿② 数量压倒质量的反向行为（中文）────────────────────
const GAMING_ZH2 = [
  // 医疗：小病大开/多开检查/过度医疗/能保守也开刀/能出院也留
  /(?:小病|小症|轻微|本可|能|可)[^。，！？；\n]{0,4}(?:保守|药物|门诊)[^。，！？；\n]{0,4}(?:也|被|都)?[^。，！？；\n]{0,3}(?:拉去|送去|安排)?(?:开刀|手术)/,
  /(?:小病|小毛病|轻微症状)[^。，！？；\n]{0,4}(?:也|都|给|让)?[^。，！？；\n]{0,3}(?:大开|大治|多开|滥开|开一堆|多做检查|多开检查|过度检查|过度治疗)/,
  /(?:过度医疗|过度检查|过度治疗|大处方|分解住院|挂床|能出院的也(?:留|住|继续))/,
  // 执法：专挑外地车牌/能调解也统统拘留/反复驱赶
  /专挑[^。，！？；\n]{0,5}(?:外地|外市|外省|过境|大车|货车)车牌/,
  /(?:能|本可|可以|得以)[^。，！？；\n]{0,3}(?:调解|和解|劝|教育)[^。，！？；\n]{0,4}(?:也|都)?[^。，！？；\n]{0,2}(?:统统|一律|全都|全部)?(?:拘留|罚款|处罚|抓捕|抓起来)/,
  /反复[^。，！？；\n]{0,3}(?:驱赶|罚款|查处|整治|检查)/,
  // 学术：拆成几篇灌水/一稿多投/专挑好发的/包装成多个项目申报
  /(?:把|将)[^。，！？；\n]{0,6}拆成[^。，！？；\n]{0,4}(?:几|数|多|好几)?(?:个|篇|项)/,
  /(?:一稿多投|拆分发表|最小可发表|灌水|论文注水)/,
  /专挑[^。，！？；\n]{0,4}(?:好发|容易|简单|短平快)[^。，！？；\n]{0,3}(?:的)?(?:小课题|课题|方向|选题)/,
  /(?:包装成|拆成|分成|拼成)[^。，！？；\n]{0,4}(?:好几|多个|几个|数个)?(?:个)?(?:项目|课题)(?:申报|立项|申请)/,
];

// ─── [r320] 腿③ 数量政绩/创新高式认可（中文）────────────────────
const ENDORSE_ZH2 = [
  /(?:数字|数量|件数|人数|产量|发文量|立项数|专利数|通报数|办案数量|论文数|处罚数|罚没|引用数)[^。，！？；\n]{0,4}(?:上去|创新高|节节高|遥遥领先|猛涨|激增|暴涨|翻倍|再攀新高|屡创新高)/,
  /(?:创新高|节节高|遥遥领先|再攀新高|屡创新高|一路飙升|节节攀升)/,
];

// ─── [r320] 腿① 专业/公共部门按计数考核（英文）──────────────────
const INCENTIVE_EN2 = [
  /\b(?:bonus|pay|incentive|compensation|salary)\s+(?:tied|linked|pegged|based|keyed)\s+(?:to|on)\s+(?:the\s+)?(?:number|count|volume)\s+of\s+(?:visits?|procedures?|surgeries|papers?|publications?|arrests?|citations?|fines?|cases?|projects?)\b/i,
  /\b(?:assessed|evaluated|judged|ranked|measured|rewarded|promoted)\s+(?:on|by)\s+(?:the\s+)?(?:number|count|volume)\s+of\s+(?:papers?|publications?|citations?|arrests?|fines?|cases?|projects?|grants?|visits?|procedures?)\b/i,
  /\b(?:arrest|fine|citation|ticket|stop)\s+quotas?\b/i,
  /\bper[- ](?:visit|procedure|surgery|operation|patient|admission|paper|publication|arrest|citation|fine|case)\b/i,
];

// ─── [r320] 腿② 数量压倒质量的反向行为（英文）────────────────────
const GAMING_EN2 = [
  // 医疗：过度诊疗/能不做手术也开刀/能出院也留
  /\bover[- ]?(?:treated|treatment|prescrib\w+|medicat\w+|order(?:s|ed|ing)?|diagnos\w+|test\w+|operat\w+|admit\w+|hospitaliz\w+)\b/i,
  /\b(?:order|ordered|ordering|prescrib\w+|ran|perform\w+|do|did)\s+(?:a\s+)?(?:batter(?:y|ies)|bunch|series|string|tons?)\s+of\s+(?:tests?|scans?|procedures?|surgeries)\b/i,
  /\b(?:operat\w+|surgery)\s+(?:on\s+)?(?:patients?|people)?\s*(?:anyway|regardless|who\s+(?:do|did)(?:n'?t|\s+not)\s+need|when\s+conservative\s+care)\b/i,
  /\b(?:keep|kept|extend|extended)\s+(?:patients?|them)\s+(?:hospitalized|in\s+the\s+hospital|longer\s+than\s+needed)\b/i,
  /\b(?:admit|admitted|admitting|hospitaliz\w+)\s+(?:patients?|people)?\s*(?:who\s+(?:do|did)(?:n'?t|\s+not)\s+need|unnecessarily)\b/i,
  // 执法：专挑外地车/能警告也拘留/罚款配额
  /\b(?:target(?:ed|ing)?|pick(?:ed|ing)?\s+out|stopping|pulling\s+over)\s+(?:out[- ]of[- ](?:town|state)|passing|tourist|foreign)\s+(?:cars?|drivers?|plates?|vehicles?)\b/i,
  /\b(?:arrest|arrested|detain|detained|fine|fined|impound|impounded|book|booked)\s+(?:people|them|folks|drivers?|suspects?|residents?)?\s*(?:who\s+could\s+(?:have\s+been\s+)?(?:warned|let\s+off|talked\s+down)|just\s+to\s+(?:hit|meet|boost|pad))/i,
  /\b(?:ticket|ticketing|fine|fining|citation|arrest)\s+(?:quota|drive)\b/i,
  // 学术：一研究拆多篇/重复投稿/一项目包装成多个
  /\b(?:split|sliced|salami[- ]sliced|padded|fragmented|chopped)\s+(?:one|a\s+single|the\s+same)\s+(?:study|experiment|dataset|paper|finding)\s+into\s+(?:several|multiple|many|five|three)\s+(?:papers?|publications?)\b/i,
  /\b(?:duplicate|double|triple)[- ]submi(?:t|ssion|tted)\b/i,
  /\bsalami\s+(?:slicing|publication)\b/i,
  /\b(?:packaged|split|framed|carved)\s+(?:one|a\s+single|the\s+same)\s+(?:project|proposal|grant|idea)\s+as\s+(?:several|multiple|many)\s+(?:projects?|grants?|proposals?)\b/i,
];

// ─── [r320] 腿③ 数量政绩/创新高式认可（英文）────────────────────
const ENDORSE_EN2 = [
  /\b(?:numbers?|counts?|totals?|volume|revenue|profits?|income|sales|output|arrests?|fines?|citations?|publications?|papers?|procedures?)\s+(?:doubled|tripled|quadrupled|shot|soared|skyrocketed|climbed|surged|jumped)\b/i,
  /\b(?:hit|reached|broke|set)\s+(?:a\s+)?(?:record\s+high|all[- ]time\s+high|new\s+high)\b/i,
];

// 双腿距离窗
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免一：问题化/批评语境（说话者已指出激励扭曲）────────────────
const PROBLEM_ZH = /(?:适得其反|事与愿违|南辕北辙|被叫停|被取消|被迫终止|已被取消|已取消|叫停|取消|终止|废止|失败|翻车|教训|反面教材|引以为戒|暴露(?:了)?(?:漏洞|问题|缺陷)|漏洞|缺陷|弊端|严查|查处|追回|依法|属于欺诈|欺诈|舞弊|造假|需要防范|亟待|警惕|预防|防范|杜绝|避免|批评|正当批评|质疑|批判|反思|得不偿失|饮鸩止渴)/;
const PROBLEM_EN = /\b(?:backfired|canceled|cancelled|scrapped|terminated|abolished|failed|failure|cautionary|flaw|loophole|abuse|fraud|crackdown|prevent(?:ed|ing|s)?|guard(?:ing)?\s+against|beware|criticized|condemned|needs?\s+(?:to\s+be\s+)?(?:prevented|addressed|guarded|fixed)|counterproductive|self-defeating)\b/i;

// ─── 豁免二：元话语概念引述（讨论本族名称的教学/定义句）──────────
const META_ZH = /(?:激励反噬|眼镜蛇效应|反向激励|考核扭曲|绩效主义|唯指标|古德哈特|良策|适得其反效应)/;
const META_EN = /\b(?:perverse\s+incentive|cobra\s+effect|unintended\s+consequences?|Goodhart|gaming\s+the\s+system)\b/i;

// 工具 ─────────────────────────────────────────────────────────
// 全文扫描某正则族的全部命中位置（global 安全）
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

// 腿②腿③匹配的否定前缀检查（「预防刷单/严查刷单/效率并未提升」不计）。
// 窗口取匹配前 8 字符，允许否定词与被否定短语间插入少量字。
const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|禁止|严禁|反对|避免|杜绝|防止|预防|严查|拒绝|抵制|切忌|切勿|别|莫|勿|不是|算不上|并非|不算|没有|并未|未见)[^。，！？；\n]{0,5}$/;
// 匹配 span 内部的否定词（「效率并未提升」式副词内嵌否定）
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|禁止|严禁|反对|避免|杜绝|防止|预防|严查|拒绝|抵制|并非|不算|没有|并未|未见|谈不上)/;

// 单条匹配是否有效（否定前缀/内部否定均拦下）
function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  return !NEG_BEFORE.test(before);
}

// 去重叠（同族多模式命中同一片段只留最长/最先者）
function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// 收集某语言侧三腿的全部有效匹配
function collectLegs(text, fList, gList, eList, useNeg) {
  let fm = [], gm = [], em = [];
  for (const re of fList) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) fm.push(x);
  }
  for (const re of gList) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) gm.push(x);
  }
  for (const re of eList) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) em.push(x);
  }
  return { fm: dedupeOverlap(fm), gm: dedupeOverlap(gm), em: dedupeOverlap(em) };
}

// 距离（不相邻区间间距；重叠返回 0）
function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// ① 锚点聚簇：同一子句内相距 ≤12 字符且中间无句读隔断的多个 ① 匹配
// （「悬赏捕蛇……赏金照发」的 悬赏/赏金）合并为一个激励设计——
// 一子句一签名，避免同义锚点重复计数。
function clusterIncentives(fm, text) {
  const out = [];
  for (const x of fm) {
    const last = out[out.length - 1];
    if (last) {
      const between = text.slice(last.end, x.idx);
      if (x.idx - last.end <= 12 && !/[。；;！？!?\n]/.test(between)) continue;
    }
    out.push(x);
  }
  return out;
}

/**
 * 三腿配对：腿①×腿②、腿②×腿③ 均落在窗内即成一签名。
 */
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      f: (R.INCENTIVE_ZH || INCENTIVE_ZH).concat(R.INCENTIVE_ZH2 || INCENTIVE_ZH2), g: (R.GAMING_ZH || GAMING_ZH).concat(R.GAMING_ZH2 || GAMING_ZH2), e: (R.ENDORSE_ZH || ENDORSE_ZH).concat(R.ENDORSE_ZH2 || ENDORSE_ZH2),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      f: (R.INCENTIVE_EN || INCENTIVE_EN).concat(R.INCENTIVE_EN2 || INCENTIVE_EN2), g: (R.GAMING_EN || GAMING_EN).concat(R.GAMING_EN2 || GAMING_EN2), e: (R.ENDORSE_EN || ENDORSE_EN).concat(R.ENDORSE_EN2 || ENDORSE_EN2),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const { f, g, e, win, lang } of langs) {
    const { fm, gm, em } = collectLegs(text, f, g, e, lang === 'zh');
    if (!fm.length || !gm.length || !em.length) continue;
    const fmc = clusterIncentives(fm, text);
    for (const a of fmc) {
      let best = null;
      for (const b of gm) {
        const d1 = dist(a, b);
        if (d1 > win) continue;
        for (const c of em) {
          const d2 = dist(b, c);
          if (d2 > win) continue;
          if (!best || d1 + d2 < best.d) best = { d: d1 + d2, b, c };
        }
      }
      if (best) sigs.push({ lang, incentive: a.raw, gaming: best.b.raw, endorse: best.c.raw, dist: best.d });
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectPerverseIncentive(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免（任一命中即不判）
  if ((R.PROBLEM_ZH || PROBLEM_ZH).test(text) || (R.PROBLEM_EN || PROBLEM_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.META_ZH || META_ZH).test(text) || (R.META_EN || META_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'perverse_incentive',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '「' + x.incentive + '」→「' + x.gaming + '」→「' + x.endorse + '」'
      : '"' + x.incentive + '" -> "' + x.gaming + '" -> "' + x.endorse + '"')),
    details: s.lang === 'zh'
      ? '激励反噬(' + sigs.length + '处: 「' + s.incentive + '」的计数奖惩滋生「' + s.gaming + '」的反向行为，却被以「' + s.endorse + '」当作成功)(zh)'
      : 'perverse incentive(' + sigs.length + 'x: counting reward "' + s.incentive + '" breeds "' + s.gaming + '", yet the readout is endorsed as "' + s.endorse + '")(en)',
    guidance: '不要按可量化的计数设计奖惩并把被博弈的产出当成功劳（悬赏捕蛇所以有人养蛇领赏、按次数罚款所以企业包月违规、按结案数量考核所以专挑简单案子、按销量发奖金所以员工自己进货刷单 / bounty per snake so villagers bred them, per-unit fines so firms bought monthly passes, rat-count pay so workers released and recaptured）：按计数发钱奖励的是「被计数的行为」而非所欲目标，领赏者优化赏金、被罚者优化罚款总额、被考核者优化指标读数，设计会系统性滋生反向行为。请改为按目标本身的结果考核（蛇患是否真减少、合规是否真改善、复杂案子是否真办结），并对指标做防博弈设计（独立核验/质量门槛/抽样复查）；若指标已被反向行为污染，其「效率提升/指标完成/双赢」读数不能作为制度成功的证据。',
    tags: ['economics', 'public-policy', 'perverse-incentive', 'cobra-effect', 'goodhart', 'incentive-design'],
  };
}

module.exports = {
  detectPerverseIncentive,
  __internals: () => ({
    INCENTIVE_ZH, INCENTIVE_EN, GAMING_ZH, GAMING_EN, ENDORSE_ZH, ENDORSE_EN,
    // [r320] 专业与公共部门按计数考核新措辞家族（平行常量，负例注入-删条用）
    INCENTIVE_ZH2, INCENTIVE_EN2, GAMING_ZH2, GAMING_EN2, ENDORSE_ZH2, ENDORSE_EN2,
    PROBLEM_ZH, PROBLEM_EN, META_ZH, META_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
