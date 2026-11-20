/**
 * src/opportunity-cost-neglect.js — 「机会成本忽视」检测器
 * （r336 新建：econ_reasoning_gate 聚合族第 18 子族；r260 backlog 候选重启）
 *
 * 背景（真升级类型②：聚合族全新子家族）：
 *   r260 立项探针（coordination/agent4/probes/r260-probe-pool.js，v6.8.153
 *   基线 gate() 全量 findings 口径）四候选定夺时，「机会成本忽视」攻击
 *   10/10 穿透居首，但因三个误伤陷阱（预算到期作废的 use-it-or-lose-it
 *   制度规则、真正的免费品、资源闲置的正确成本描述）与制度性规则同形，
 *   被搁入 backlog（原话见 src/omission-bias.js 头注释 r260 段）。
 *   本模块以三组豁免正面解掉这三个陷阱后重启该候选。
 *
 * 外部来源：空返，按既有形态自建。r336 海外扫描（原始证据
 * coordination/agent4/scout/*20261114-121053*）：arXiv 查询词被 OR 拆散
 * 返回天文/视频扩散等无关条目、GitHub repos 0 命中、Semantic Scholar
 * 空返。判据为心虫自有纯规则实现，家族定义取自行为经济学标准描述：
 * Frederick, Solda & Marm (1999) "Opportunity Cost Neglect"、Read,
 * Frederick & Zhang (2022) "The Fallacy of 'Keeping the Option Open'"
 * ——同等后果下，个体系统性地把「不作为/不投入」评估为零成本、零损失
 * 的选择，无视资源本可承担的替代用途。
 *
 * 辨别的族：机会成本忽视（opportunity cost neglect / omission cost
 * neglect）——文本先给出**不作为或不投入的在场指称**（钱放着不动 /
 * 设备闲置 / 不投入研发 / money sitting idle / doing nothing），再给出
 * **把该不作为豁免为零成本或稳赚的断言**（没有任何损失 / 零成本 /
 * 稳赚不亏 / 就是省钱 / costs nothing / risk-free / free win）：
 *   钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。
 *   房子空着也是空着，不出租没有任何损失，白占着也不亏。
 *   不花钱做推广就是省钱，一分钱不花还能保住利润。
 *   The money sitting idle costs nothing, so not investing is risk-free.
 *   Skipping maintenance costs nothing as long as the machine still runs.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：资源的机会成本
 * 是一切经济决策的地基——资金占用、资产闲置、时间不投入、维护拖延，
 * 每一项「不作为」都有被放弃的替代用途，而机会成本忽视把这一项直接
 * 记为零。它的毒性在于它伪装成「审慎」：先给出一个真实的不作为事实，
 * 再宣布「这样没有任何损失」，于是闲置、拖延、不投入全部免单，后续
 * 讨论只能在「反正不花钱」的层面上进行。与正当推理的界线很清楚：
 * 制度性 use-it-or-lose-it 规则的客观陈述、正确指出闲置本身有成本
 * 的纠正句、或点名这是机会成本忽视本身，都是正当做法，一律豁免。
 *
 * 与既有维度的边界（r336 归因，探针 + 边界实测）：
 *   · zero_price_effect（r313）判**零价格信号 × 需求/价值判断失真**
 *     （免费 → 蜂拥多拿）——腿①要求价格为零的显式陈述；本族腿①是
 *     不作为/不投入，腿②是把不作为说成零损失，方向是「不作为免单」
 *     而非「免费诱饵」（实测「0元购让人失去判断力」归 zero_price
 *     领地，不被本族命中）；
 *   · omission_bias（r260）判**作为/不作为的评判不对称**（没动手
 *     所以责任轻）——右腿是责任豁免断言；本族右腿是成本幻觉断言，
 *     不涉责任分配；
 *   · sunk_cost_coercion 判**已投入成本绑架**（投了所以必须继续）；
 *     本族方向相反：还没投入的那部分被当成零成本；
 *   · money_illusion 判**名义/实际价值混淆**；本族不涉货币单位，
 *     判不作为的成本归零。
 *
 * 判据（双腿近距共现 + 三组豁免，缺一不判）：
 *   ① 腿① INACTION 不作为/不投入在场——ZH 五族 / EN 四族任一（详见
 *      下方常量）：否定+投入动词族、闲置/空置名词族、拖延/不做族、
 *      not investing / sitting idle / leaving unused / skipping 族；
 *   ② 腿② ZEROCOST 零成本幻觉断言——ZH 五族 / EN 五族任一：没有
 *      任何损失族、零成本族、稳赚不亏族、就是省钱族、最划算族；
 *      costs nothing / zero cost / loses nothing / free win / risk-free
 *      族；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），方向不限；
 *   ④ 腿①查强否定前缀守卫（「并非不花钱」= 其实花了 → 失配），递进
 *      连词（不但/不仅）不判否定（「不但不花钱还能保住利润」是攻击形）；
 *   ⑤ 腿②查强否定前缀守卫（「并非没有任何损失」= 有损失 → 失配）；
 *   ⑥ 豁免 A 制度规则（预算/经费/额度 × 到期/作废/清零 + 制度/规定；
 *      EN use-it-or-lose-it / unspent funds lapse / fiscal year end）；
 *   ⑦ 豁免 B 概念教学（机会成本/机会成本忽视/行为经济学；
 *      opportunity cost neglect / forgone alternative）；
 *   ⑧ 豁免 C 纠正句（指出不作为本身有成本：占用资金/折旧/贬值/本身
 *      就有成本；not free / carries a cost / loses value）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次他人评价（「主管认为
 * 不培训也不会亏」是事实陈述），也可能是描述一种保守策略。verify 的
 * 语义是「这段话把不作为评估成了零成本零损失，先核对被放弃的替代
 * 用途与其真实收益，再决定是否采信这个成本判断」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 制度规则（按预算制度规定，年度经费到期未使用即作废清零——
 *     use-it-or-lose-it 是制度要求，不是偏误表述）；
 *   · 概念教学（机会成本忽视是行为经济学文献记载的决策偏误）；
 *   · 纠正句（设备长期闲置不仅占用资金，还持续折旧——正确指出
 *     不作为有成本）；
 *   · 正当免费品/公共供给描述（空气和水源对村民免费，不花钱也能
 *     维持基本生活——无零损失断言腿，腿②不收弱势形）；
 *   · 有作为/不作为无幻觉断言（去年没花钱做营销，转化率下降了
 *     两成——不作为有真实后果陈述）；
 *   · 近邻维度领地（zero_price_effect 零价格需求失真、omission_bias
 *     责任评判不对称、sunk_cost_coercion 沉没成本绑架）。
 *
 * [r429 扩展 · 真升级②：观望/拖延免单族的全新措辞家族]
 * r429 池化探针（coordination/agent4/probes/r429-probe-pool.js，基线
 * HEAD 6.8.211 实测）：四候选定拨，本族攻击 10/12 穿透居首（P1
 * appeal_to_tradition 口语时段×反问免检族 9/12、P2 base_rate_neglect
 * 准确率×确诊族 1/12 已被 false_precision/calibration_mismatch 存量
 * 代拦、P4 anecdote_as_proof 亲测族 4/12 已被 claimed_verification_
 * without_trail 存量代拦），模块层攻击 1/12（存量 INACTION_DELAY_ZH
 * 「拖着」× ZEROCOST_NOLOSS_ZH 承重）、模块层良性 0/12 真零误伤。
 * 穿透根因是两条腿的词表都停在「正式/重语族」：
 *   · 腿①新族 INACTION_DELAY_ZH_R429：观望拖延的口语软化形（再观望
 *     观望/缓一缓/先放放/暂缓/搁置/拖一拖/往后拖/等一等/看看再说/
 *     从长计议）——存量 DELAY 只收 先拖/拖着/按兵不动/维持现状 四个
 *     硬形，「缓一缓」「放放」「暂缓」全部穿透；EN 对应族
 *     INACTION_DELAY_EN_R429：sit on this decision / hold off on
 *     hiring / keep the money idle / postpone the migration（存量
 *     SKIP_EN 的 postpone 只接 maintenance/repairs/investment/
 *     spending 四个名词，「postpone the migration」整族穿透）/
 *     defer / put off / wait and see / let it ride / drag our feet；
 *   · 腿②新族 ZEROCOST_MISS_ZH_R429：「错过不了/错失不了/耽误不了」
 *     可能补语族与「不会耽误任何事/也不会有任何影响/也不会掉队」族
 *     ——存量 NOLOSS 只收 损失/亏损/代价/成本/风险 名词，「错过」
 *     「耽误」「影响」「掉队」全部穿透；EN 对应族 ZEROCOST_MISS_EN_
 *     R429：will not cost us anything / will not hurt us / nothing
 *     will be lost by waiting / changes nothing / makes no
 *     difference——存量 NOCOST/LOSE 只收 costs nothing / loses
 *     nothing 现在时直形，「not cost us anything」的代词与 anything
 *     间隔、「will not hurt」「changes nothing」全部穿透。
 * 新族常量独立成组（不进存量表），inject 可整族摘除；存量三组豁免
 * （制度规则/概念教学/纠正句）原样覆盖新族。
 */
'use strict';

// ─── 腿① INACTION 不作为/不投入在场 ─────────────────────────────
// A1 否定+投入动词族（不花/不投/不投/不用/不做/不出租/不处理/不培训/
//    不维护/不加固/不营销/不研发/没安排/未安排）。自身含否定词，否定
//    守卫只查「强否定前缀」（并非不花=其实花了），不查普通否定——
//    否则腿①永远失配（r336 构造期实测教训同 r260 omission-bias 腿①）。
const INACTION_NEG_VERB_ZH = /(?:不|没|没有|未|未曾|无需|无须)[^。，！？；\n]{0,4}(?:花钱|投入|投资|支出|开销|安排|部署|维护|加固|防护|培训|营销|推广|宣传|研发|更新|升级|保养|检查|消毒|除险|出租|租出|处理|清理|整改|优化|购买|采购|储备|投保|缴纳|偿还|打扫|修剪|浇灌|喂养|体检|筛查|接种)/;
// A2 闲置/空置名词族（闲置/放着/空着/堆着/压着/囤着/锁着/封存/
//    空置/弃置）。r260 陷阱②的良性句「设备闲置不仅占用资金」靠 CORRECT
//    豁免挡（腿②不存在时天然不判，此处双保险不收纠正语境）。
const INACTION_IDLE_ZH = /(?:闲置|空置|弃置|封存|束之高阁|压在(?:仓库|库房|手里|账上)|堆在|囤在|放在|放着|留(?:在|着)|锁在|停在|闲着|空着|占着|搁着|躺(?:在|着))[^。，！？；\n]{0,10}(?:不动|不用|不处理|没动|没处理|没动它)?/;
// A3 拖延/不做族（先拖着/拖着不/按兵不动/维持现状/不做任何/啥也不干）
const INACTION_DELAY_ZH = /(?:先拖|拖着|拖(?:着|下去|一时)|按兵不动|维持现状|不做任何|啥也不干|什么也不干|既不|也不[^。，！？；\n]{0,6}(?:投入|安排|处理|维护|培训))/;
// A4 时间/注意力不投入族（时间不用来/不拿来/精力不花在）
const INACTION_TIME_ZH = /(?:时间|精力|心思|注意力)[^。，！？；\n]{0,6}(?:不用来|不拿来|不花在|没花在|未投入|不投入|不用于)/;

// A5 [r429 新增] 观望/拖延口语软化族——存量 DELAY 只收先拖/拖着/按兵
//    不动/维持现状四个硬形，「再观望观望」「缓一缓」「先放放」「暂缓」
//    这类把拖延包装成从容决策的口语软化形整族穿透（r429 探针实测
//    10/12 穿透居首）。轻化动词不带否定词，否定守卫仍只查强否定前缀
//    （「并非暂缓」= 其实推进了 → 失配）；不收裸「推迟/延迟」（「推迟
//    迁移有风险，合规截止日前必须完成」是良性句，腿①单 hit 不判但
//    宁缺勿滥）。
const INACTION_DELAY_ZH_R429 = /(?:再|又|暂且|姑且|先|且先)?(?:观望|看看再说|等一等|缓一缓|放一放|放放|暂缓|搁置|从长计议|拖一拖|往后拖)/;

const INACTION_ZH_GROUPS = [
  ['INACTION_NEG_VERB_ZH', [INACTION_NEG_VERB_ZH]],
  ['INACTION_IDLE_ZH', [INACTION_IDLE_ZH]],
  ['INACTION_DELAY_ZH', [INACTION_DELAY_ZH]],
  ['INACTION_TIME_ZH', [INACTION_TIME_ZH]],
  // [r429] 新族独立成组——inject 置空本组即可整族摘除（负例注入用）
  ['INACTION_DELAY_ZH_R429', [INACTION_DELAY_ZH_R429]],
];
const INACTION_ZH = [INACTION_NEG_VERB_ZH, INACTION_IDLE_ZH, INACTION_DELAY_ZH, INACTION_TIME_ZH, INACTION_DELAY_ZH_R429];

// E1 not investing / not spending / no maintenance 族
// r336 攻防期补 not spent 形：「Time not spent learning costs you nothing」
// ——旧族只收 not+名词动名词，not spent learning 整形穿透。
const INACTION_NOT_EN = /\b(?:not|no)\s+(?:investing|investment|spending|spent|maintenance|upkeep|training|marketing|advertising|spend\s+on\s+R&D|renting\s+it|fixing|repairing|servicing|replacing|checking|inspecting)\b/i;
// E2 sitting idle / left unused / left vacant 族
const INACTION_IDLE_EN = /\b(?:sitting\s+idle|sit\s+idle|left\s+unused|left\s+vacant|stays?\s+vacant|staying\s+vacant|lying\s+idle|sits?\s+unused|unused\s+and|idle\s+(?:cash|money|assets?|equipment|capacity|land)|vacant\s+(?:apartment|property|unit|building|space))\b/i;
// E3 doing nothing / skipping 族
const INACTION_SKIP_EN = /\b(?:doing\s+nothing|skip(?:ping|ped)?\s+(?:maintenance|servicing|updates?|training|inspection|repairs?|the\s+repair)|postpon(?:e|ing)\s+(?:maintenance|repairs?|investment|spending)|defer(?:ring)?\s+(?:maintenance|investment|spending)|let(?:ting)?\s+it\s+(?:sit|be))\b/i;
// E4 not renting / not fixing / not investing in 介词族
const INACTION_NOTIN_EN = /\bnot\s+(?:renting|leasing|fixing|repairing|servicing|replacing|upgrading|checking|monitoring|maintaining|optimizing)\b/i;
// E5 [r429 新增] 观望/拖延口语软化族（EN）——存量 SKIP_EN 的 postpone
//    只接 maintenance/repairs/investment/spending 四个名词，「postpone
//    the migration」整族穿透；sit on this decision / hold off on hiring /
//    keep the money idle / defer / put off / wait and see / let it ride /
//    drag our feet 全部不在存量四族。注意 postpon 只收 e/ing 词尾
//    （postponed 过去式不收——「We postponed because the vendor...」
//    良性样本，腿①单 hit 不判但宁缺勿滥）。
const INACTION_DELAY_EN_R429 = /\b(?:sit(?:ting)?\s+on|hold(?:ing)?\s+off(?:\s+on)?|skip(?:ping|ped)?\s+(?:the|this|that|our|a|an)\s+[a-z]+|keep(?:ing)?\s+(?:the\s+|our\s+|this\s+)?(?:money|cash|funds?|assets?|equipment|decision|project|plan|hiring|investment)\s+(?:idle|on\s+hold|in\s+limbo|frozen)|postpon(?:e|ing)\s+(?:the|this|that|our|a|an)?\s*[a-z]+|defer(?:ring)?\s+(?:the|this|that|our)\s+[a-z]+|delay(?:ing)?\s+(?:the|this|that|our|a|an)\s+[a-z]+|put(?:ting)?\s+off|wait(?:ing)?\s+and\s+see|let(?:ting)?\s+(?:it|things)\s+(?:ride|sit|slide)|drag(?:ging)?\s+(?:our|the)\s+feet)\b/i;

const INACTION_EN_GROUPS = [
  ['INACTION_NOT_EN', [INACTION_NOT_EN]],
  ['INACTION_IDLE_EN', [INACTION_IDLE_EN]],
  ['INACTION_SKIP_EN', [INACTION_SKIP_EN]],
  ['INACTION_NOTIN_EN', [INACTION_NOTIN_EN]],
  // [r429] 新族独立成组——inject 置空本组即可整族摘除（负例注入用）
  ['INACTION_DELAY_EN_R429', [INACTION_DELAY_EN_R429]],
];
const INACTION_EN = [INACTION_NOT_EN, INACTION_IDLE_EN, INACTION_SKIP_EN, INACTION_NOTIN_EN, INACTION_DELAY_EN_R429];

// ─── 腿② ZEROCOST 零成本幻觉断言 ────────────────────────────────
// Z1 没有任何损失族（没有任何损失/没有损失/没损失/毫无损失/不会有任何
//    损失/也不会损失）。不收弱势形「谈不上损失」——该形与制度性陈述
//    同形概率高（r336 构造期实测：良性句「个人没有处置权，谈不上
//    损失」含该形，宁缺勿滥）。
const ZEROCOST_NOLOSS_ZH = /(?:不会有|也不会产生|没有|没|毫无|并无)[^。，！？；\n]{0,2}(?:任何)?(?:损失|亏损|损耗|代价|成本|费用|额外支出|风险)/;
// Z2 零成本族（零成本/没有成本/没成本/不产生成本/不会产生…费用/不花钱）
//    注意「一分钱不花」在腿①，此处收断言侧「就是零成本」。
const ZEROCOST_ZERO_ZH = /(?:零成本|零代价|零风险|没有成本|没成本|没有代价|没代价|无成本|不产生(?:任何)?(?:成本|费用|代价))/;
// Z3 稳赚不亏族（稳赚不亏/不亏/亏不了/白赚/净赚）
const ZEROCOST_FREEWIN_ZH = /(?:稳赚不亏|只赚不亏|不亏|亏不了|白赚|净赚|白占(?:着)?也不亏|占便宜|有便宜不占)/;
// Z4 就是省钱族（就是省钱/等于省钱/省下的就是利润/何乐不为/何乐而为）
const ZEROCOST_SAVE_ZH = /(?:就是省钱|等于省钱|净省|省下(?:的)?(?:就是|全是|等于)(?:利润|赚到|白得)|何乐不为|何乐而为|不拿白不拿|不用白不用)/;
// Z5 最划算/最稳妥族（最划算/最省/最稳妥的选择/零风险的选择）
const ZEROCOST_BEST_ZH = /(?:最划算|最省(?:钱|事)?|最为稳妥|最稳妥|零风险|没有任何风险|毫无风险)/;
// Z6 [r429 新增] 错过/耽误免单族——存量 NOLOSS 只收 损失/亏损/代价/
//    成本/风险 名词，「错过不了什么」「错失不了几个钱」「不会耽误任何
//    事」「也不会有任何影响」「也不会掉队」这类把「被放弃的替代用途」
//    直接记为零的口语形整族穿透（r429 探针实测）。两支：
//    Z6a 可能补语族（错过不了/错失不了/耽误不了/影响不了）；
//    Z6b 不会+泛指后果族（不会耽误任何事/也不会有任何影响/也不会掉队）。
const ZEROCOST_MISS_ZH_R429 = new RegExp([
  '(?:错过|错失|耽误|影响|波及)(?:不了|不到|不掉|不住)',
  '(?:不会|也不会|绝不会|不可能会|不大可能会)[^。，！？；\\n]{0,6}(?:任何)?(?:影响|差别|变化|进度|事|事情|损失|掉队)',
].join('|'));

const ZEROCOST_ZH_GROUPS = [
  ['ZEROCOST_NOLOSS_ZH', [ZEROCOST_NOLOSS_ZH]],
  ['ZEROCOST_ZERO_ZH', [ZEROCOST_ZERO_ZH]],
  ['ZEROCOST_FREEWIN_ZH', [ZEROCOST_FREEWIN_ZH]],
  ['ZEROCOST_SAVE_ZH', [ZEROCOST_SAVE_ZH]],
  ['ZEROCOST_BEST_ZH', [ZEROCOST_BEST_ZH]],
  // [r429] 新族独立成组——inject 置空本组即可整族摘除（负例注入用）
  ['ZEROCOST_MISS_ZH_R429', [ZEROCOST_MISS_ZH_R429]],
];
const ZEROCOST_ZH = [ZEROCOST_NOLOSS_ZH, ZEROCOST_ZERO_ZH, ZEROCOST_FREEWIN_ZH, ZEROCOST_SAVE_ZH, ZEROCOST_BEST_ZH, ZEROCOST_MISS_ZH_R429];

// ZE1 costs nothing / carries no cost 族
// r336 攻防期补 costing nothing 形（概念教学/纠正句承重样本用）。
const ZEROCOST_NOCOST_EN = /\b(?:costs?|costing)\s+(?:nothing|you\s+nothing|us\s+nothing|zero)|carries?\s+no\s+(?:cost|risk|downside)|has\s+no\s+(?:cost|downside|risk)|no\s+(?:cost|downside|risk)\s+(?:at\s+all|involved|to\s+(?:us|speak\s+of))\b/i;
// ZE2 zero cost / risk-free / free win / free option 族
const ZEROCOST_FREE_EN = /\b(?:zero[\s-]cost|risk[\s-]free|free\s+(?:win|option|choice|win-win|lunch)|no[\s-]risk|nothing\s+to\s+lose|costs?\s+(?:you|us)\s+absolutely\s+nothing)\b/i;
// ZE3 loses nothing / loses us nothing 族
const ZEROCOST_LOSE_EN = /\b(?:loses?\s+(?:nothing|us\s+nothing|you\s+nothing|nothing\s+at\s+all)|loses?\s+no\s+(?:money|value))\b/i;
// ZE4 saves money at no cost / pure savings 族
const ZEROCOST_SAVE_EN = /\b(?:saves?\s+(?:us\s+|them\s+|the\s+company\s+)?money\s+(?:at\s+)?(?:for\s+)?(?:zero|no)\s+cost|pure\s+savings?|costs?\s+nothing\s+to\s+(?:keep|hold|leave)|free\s+to\s+(?:keep|hold|leave)|a\s+freebie|money\s+for\s+nothing)\b/i;
// ZE5 the safest bet / safest choice 族
const ZEROCOST_SAFE_EN = /\b(?:the\s+safest\s+(?:bet|choice|option|course)|safest\s+thing\s+to\s+do|no\s+downside\s+(?:at\s+all|whatsoever)|totally\s+risk[-\s]free)\b/i;
// ZE6 [r429 新增] 拖延免单族（EN）——存量 NOCOST/LOSE 只收 costs
//     nothing / loses nothing 现在时直形，「waiting will not cost us
//     anything」的代词+anything 间隔、「will not hurt us」的 hurt 动词、
//     「nothing will be lost by waiting」的将来时被动、「changes
//     nothing / makes no difference」的零差异断言全部穿透（r429 探针
//     实测）。五支：not cost/hurt/harm us anything / nothing will be
//     lost / lost by waiting / changes nothing / makes no difference。
const ZEROCOST_MISS_EN_R429 = new RegExp([
  "(?:will\\s+not|won'?t|would\\s+not|wouldn'?t|does\\s+not|doesn'?t|do\\s+not|don'?t|cannot|can'?t|not)\\s+(?:cost|hurt|harm|bother|set)\\s+(?:us|you|them|anyone|anybody|the\\s+[a-z]+)?(?:\\s+(?:anything|a\\s+thing|anything\\s+at\\s+all|back))?",
  '(?:nothing|little|not\\s+much|nothing\\s+much)\\s+(?:will\\s+be|is|gets?|to\\s+be)\\s+lost',
  'lost\\s+by\\s+(?:waiting|delaying|holding\\s+off|postponing|sitting\\s+idle)',
  'changes?\\s+(?:nothing|very\\s+little|little)',
  'makes?\\s+(?:no|not\\s+much|little)\\s+difference',
].join('|'), 'i');

const ZEROCOST_EN_GROUPS = [
  ['ZEROCOST_NOCOST_EN', [ZEROCOST_NOCOST_EN]],
  ['ZEROCOST_FREE_EN', [ZEROCOST_FREE_EN]],
  ['ZEROCOST_LOSE_EN', [ZEROCOST_LOSE_EN]],
  ['ZEROCOST_SAVE_EN', [ZEROCOST_SAVE_EN]],
  ['ZEROCOST_SAFE_EN', [ZEROCOST_SAFE_EN]],
  // [r429] 新族独立成组——inject 置空本组即可整族摘除（负例注入用）
  ['ZEROCOST_MISS_EN_R429', [ZEROCOST_MISS_EN_R429]],
];
const ZEROCOST_EN = [ZEROCOST_NOCOST_EN, ZEROCOST_FREE_EN, ZEROCOST_LOSE_EN, ZEROCOST_SAVE_EN, ZEROCOST_SAFE_EN, ZEROCOST_MISS_EN_R429];

// ─── 距离窗（不作为 × 零成本幻觉）───────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：制度规则（use-it-or-lose-it 是预算制度要求，不是偏误）──
// r260 陷阱①。攻击句「不花钱做推广就是省钱」无预算制度语，不获豁免
// （r336 探针实测双向承重）。
const RULE_ZH = /(?:预算|拨款|经费|额度|专项资金|财政|公款|国库)[^。！？\n]{0,12}(?:到期|作废|清零|过期|失效|收回|上缴|执行|核销|使用完毕)|(?:到期|年末|年底|年终|财政年度)[^。！？\n]{0,12}(?:未使用|未用完|结余|余额)(?:的)?(?:预算|经费|拨款|额度)|按(?:预算|财务|经费)?(?:制度|规定|规则|管理办法)/;
const RULE_EN = /\buse[- ]it[- ]or[- ]lose[- ]it\b|\bbudget\s+rules?\b|\bunspent\s+funds?\s+(?:lapse|lapsing|expire)|funds?\s+lapse\b|\bfiscal\s+year\s+end\b|\bexpire[sd]?\s+(?:unused|at\s+year\s+end)|must\s+be\s+spent\s+by\s+(?:year|fiscal)\b|\bzeroed\s+out\s+at\s+(?:year|fiscal)\b/i;

// ─── 豁免 B：概念教学（点名机会成本忽视/行为经济学概念本身）──────
const CONCEPT_ZH = /(?:机会成本|机会成本忽视|行为经济学|决策心理学|被放弃的替代|放弃的替代方案)/;
const CONCEPT_EN = /\bopportunity\s+cost\b|\bopportunity[\s-]cost\s+neglect\b|\bforgone\s+alternative|\bbehavioral\s+economics\b/i;

// ─── 豁免 C：纠正句（正确指出不作为/闲置本身有成本——这是本族要教的
// 判别动作本身）。r260 陷阱③。「Idle cash is not free」类。
const CORRECT_ZH = /(?:占用(?:资金|资金成本|现金流)|资金占用|本身就有成本|并非没有(?:损失|成本)|不等于没有(?:损失|成本)|也有代价|有代价|折旧|贬值|通胀|通货膨胀|贬损|耗损|搁死|资金成本|复利|时间成本)/;
const CORRECT_EN = /\bis\s+not\s+free\b|\bnot\s+(?:free|zero[\s-]cost|risk[\s-]free)\b|\bcarries\s+(?:a|its\s+own)\s+(?:cost|price|risk)\b|\bhas\s+a\s+(?:cost|price|downside)\b|\bloses\s+value\b|\bholds?\s+a\s+cost\b|\bthere\s+is\s+a\s+(?:cost|price)\b|\bopportunity\s+cost\s+(?:is|of|applies)\b|\binflation\s+(?:erodes|eats)\b/i;

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

// 强否定前缀：命中词前出现这些词，说明整个断言被否定（「并非不花钱」
// = 其实花了；「并非没有任何损失」= 有损失）。不用普通「不/没」窗——
// 腿①模式自身以「不」开头，腿②含「没有」，普通否定窗会误杀全部命中
// （r336 构造期实测教训，同 r260 omission-bias 的取舍）。
const STRONG_NEG_ZH = /(?:并非|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way)\b/i;
// 递进连词：命中词前的「不但/不仅」的「不」不是否定词，不判否定
// （「不但不花钱还能保住利润」是攻击形，必须保留）。
const ADVERSATIVE_ZH = /(?:不但|不仅|不只|不光|况且|而且|并且|虽说|固然|诚然)/;

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

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

function resolveGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    if (Object.prototype.hasOwnProperty.call(R, name)) out.push(...(R[name] || []));
    else out.push(...defs);
  }
  return out;
}

// 签名收集：腿①不作为 × 腿②零成本幻觉，两腿邻近共现，方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      inact: resolveGroups(R, INACTION_ZH_GROUPS),
      zero: resolveGroups(R, ZEROCOST_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      inact: resolveGroups(R, INACTION_EN_GROUPS),
      zero: resolveGroups(R, ZEROCOST_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const inactM = collect(text, L.inact, true);
    if (inactM.length === 0) continue;
    const zeroM = collect(text, L.zero, true);
    if (zeroM.length === 0) continue;
    for (const n of inactM) {
      const z = zeroM.find(x => dist(x, n) <= L.win);
      if (!z) continue;
      sigs.push({ lang: L.lang, inaction: n.raw, zerocost: z.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.inaction + '|' + s.zerocost;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 机会成本忽视签名：不作为/不投入 × 零成本幻觉断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectOpportunityCostNeglect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：制度规则（use-it-or-lose-it 预算是制度要求，不是偏误表述）
  if ((R.RULE_ZH || RULE_ZH).test(text) || (R.RULE_EN || RULE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：概念教学（讨论机会成本忽视这个概念本身是正确判别）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 C：纠正句（指出不作为/闲置本身有成本的正当陈述）
  if ((R.CORRECT_ZH || CORRECT_ZH).test(text) || (R.CORRECT_EN || CORRECT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'opportunity_cost_neglect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '不作为「' + x.inaction + '」× 零成本幻觉「' + x.zerocost + '」'
      : 'inaction "' + x.inaction + '" x zero-cost illusion "' + x.zerocost + '"')),
    details: s.lang === 'zh'
      ? '机会成本忽视(' + sigs.length + '处: 把「' + s.inaction + '」评估成「' + s.zerocost + '」——不作为被当成零成本零损失，被放弃的替代用途未计入)(zh)'
      : 'opportunity-cost-neglect(' + sigs.length + 'x: "' + s.inaction + '" is assessed as "' + s.zerocost + '" — inaction treated as costless while forgone alternatives go uncounted)(en)',
    guidance: '机会成本忽视指同等后果下个体系统性地把「不作为/不投入」评估为零成本零损失、无视资源本可承担的替代用途的偏差（Frederick, Solda & Marm 1999；Read, Frederick & Zhang 2022：闲置的资金、拖延的维护、不投入的培训，都有被放弃的替代收益）。它的危害不在「确实没有花钱」这个事实陈述（那可以用账目核实），而在紧随其后的第二动作：宣布「不投入也没有任何损失」——这一步把资源占用的机会成本记为零，让闲置、拖延、不投入全部免单。正当做法是先核对被放弃的替代用途及其真实收益（资金的时间价值、设备的折旧与维护窗口、人员不培训的上手成本），再给出成本判断；制度性 use-it-or-lose-it 预算规则的客观陈述、正确指出闲置本身有成本的纠正句、或明确指出这是机会成本忽视，都是正当做法。',
    tags: ['economics', 'behavioral-economics', 'opportunity-cost', 'cognitive-bias', 'judgment-and-decision-making', 'resource-allocation'],
  };
}

module.exports = {
  detectOpportunityCostNeglect,
  __internals: () => ({
    INACTION_NEG_VERB_ZH, INACTION_IDLE_ZH, INACTION_DELAY_ZH, INACTION_TIME_ZH,
    INACTION_NOT_EN, INACTION_IDLE_EN, INACTION_SKIP_EN, INACTION_NOTIN_EN,
    ZEROCOST_NOLOSS_ZH, ZEROCOST_ZERO_ZH, ZEROCOST_FREEWIN_ZH, ZEROCOST_SAVE_ZH, ZEROCOST_BEST_ZH,
    ZEROCOST_NOCOST_EN, ZEROCOST_FREE_EN, ZEROCOST_LOSE_EN, ZEROCOST_SAVE_EN, ZEROCOST_SAFE_EN,
    INACTION_ZH, INACTION_EN, ZEROCOST_ZH, ZEROCOST_EN,
    INACTION_ZH_GROUPS, INACTION_EN_GROUPS, ZEROCOST_ZH_GROUPS, ZEROCOST_EN_GROUPS,
    // [r429] 新族常量（负例注入整族摘除用）
    INACTION_DELAY_ZH_R429, INACTION_DELAY_EN_R429, ZEROCOST_MISS_ZH_R429, ZEROCOST_MISS_EN_R429,
    PAIR_ZH, PAIR_EN,
    RULE_ZH, RULE_EN, CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN, ADVERSATIVE_ZH,
    findSignatures,
  }),
};
