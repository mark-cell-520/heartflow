/**
 * src/incentive-blind-spot.js — 「信息与激励盲区」检测器（r296 起草）
 * （ provisional 第 247 个判别维度，含三个子族：adverse_selection /
 * moral_hazard / free_rider；src/index.js gate 接线由 1 号主力补全，
 * 接线规格见 coordination/reports/r296-dimension-agent4.md §五。
 * 编号 provisional 的原因同 r218-r295：本模块本轮经
 * src/plugins/econ-reasoning-check/ 插件层 dispatch（postprocess.think
 * → _discrimination.econReasoning → 置信度打折 + warning）与 MCP 只读
 * 工具（heartflow_econ_fallacy_check）上线，gate 层 dimMap 键由 1 号
 * 按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r296 立项] 零命中探针（2026-11-11，v6.8.174 gate() 全量实测）：
 * 认领方向四候选族竞品——A 近因加权、B 预防原则滥用、C 确定性效应、
 * D 委托代理脱节，攻击穿透实测分别为 pass（零命中）/pass/pass（被
 * absolute_claim 代拦）/verify（被 fallacy_of_relevance 代拦），但
 * A/B/C 与既有 availability_bias(200)/appeal_to_probability 族边界
 * 模糊、D 与既有 moral_hazard 素材重叠；E 信息与激励盲区三子族
 * （逆选择否认/道德风险否认/搭便车）中英文攻击 10/10 完全穿透，
 * econ-reasoning-check 插件层 0/0——src/ 下无任何 adverse/lemon/
 * moral-hazard/free-rider 相关文件，E 胜出。
 *
 * 外部来源：空返，按既有形态自建。r296 海外扫描（原始证据
 * coordination/agent4/scout/*20261111-125531*）：arXiv OR 噪声查询
 * parse-fail、GitHub 0 repos、Semantic Scholar 限流空返。判据为心虫
 * 自有纯规则实现（家族定义取自信息经济学标准描述：Akerlof 1970
 * 柠檬市场/逆选择——池子按私有风险自我筛选，好池被坏池拖垮；
 * 道德风险——隐藏行动使兜底改变行为；Olson 1965 集体行动逻辑——
 * 公共品供给中个体有搭便车激励）。
 *
 * 辨别的族：信息与激励盲区（incentive blind spot）——**忽略隐藏
 * 信息、隐藏行动与集体行动对结果的系统性影响**，三个子族：
 *
 * ① adverse_selection 逆选择忽视：**风险池/信贷池自我筛选语境**
 *    （保险/投保/保费/参保/保单/风险池/医保/社保/贷款/信贷/借款/
 *    二手车/融资；EN insurance pool/premium/policyholder/loan/
 *    borrower/used car）× **无扭曲断言**（自然吸引各类风险/对保费
 *    没有影响/不会推高/自动平衡/均衡混合/不存在问题；EN attracts
 *    a balanced mix/no effect on premiums/balances itself）：
 *      保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。
 *      贷款会自然覆盖各种信用等级的借款人，坏账率不会有差别。
 *      Insurance pools naturally attract a balanced mix of low and
 *      high risk people, so premiums stay stable.
 *
 * ② moral_hazard 道德风险忽视：**兜底/保障语境**（全额/兜底/担保/
 *    包赔/保险/保障/保底/补贴/救助/注资；EN full coverage/
 *    guarantee/backstop/bailout/safety net/subsidy）× **行为不变
 *    断言**（不会改变/不会削弱/不会更冒险/不会放松/没有影响；
 *    EN does not change behavior/will not affect incentives）：
 *      全额兜底不会让机构去承担更多风险。
 *      有了全额保险，人们开车不会有什么变化。
 *      Full insurance coverage does not change how carefully
 *      people drive.
 *
 * ③ free_rider 搭便车盲区：**集体/公共语境**（公共/大家一起/别人/
 *    总会有人/团队/集体/社区/公共事务；EN public good/community/
 *    others/someone else）× **脱责式退出**（我个人不用参与/轮不到
 *    我出力/让别人去管/我不用操心；EN I don't need to do my part/
 *    let others contribute/someone else will handle it）：
 *      公共事务总会有人站出来管，我个人不用参与。
 *      别人会捐款的，我不用掏钱。
 *      Someone else will always contribute to the public good,
 *      so I don't need to do my part.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：这三族是 LLM 在
 * 经济与制度分析里最典型的系统性错误——写作者把「池子/合同/集体」
 * 当成静态背景，看不到参与者会按私有信息和隐藏行动重新排序自己
 * 的行为。信息不对称不是道德瑕疵而是结构约束：否认逆选择，后面
 * 的定价、风控、准入设计全部建在幻觉上；否认道德风险，兜底政策
 * 的副作用完全脱眶；否认搭便车，公共品供给方案落空。与正当表述
 * 有明确界线：纠正/防范表述（要防逆选择/通过免赔额缓解道德风险/
 * 为防止搭便车需设计选择性激励）、概念教学（正确定义天然不含
 * 「无扭曲」断言腿）、缺任一腿（只报保险事实无行为不变断言、
 * 只报公共事务无退出断言）——均豁免。
 *
 * 与既有维度的边界（r296 归因）：
 *   · perverse_incentive（插件 econ 族，r236）管**激励设计反噬**
 *     （按销量发奖金导致刷单——断言激励会扭曲行为）；本族
 *     moral_hazard 管**否认**隐藏行动效应（兜底不会改变行为），
 *     断言方向相反，判据要求「不会/没有」类否认腿在场。
 *   · tragedy_of_commons（插件 econ 族，r238）管**公共资源被
 *     过度消耗**（每家多养羊——使用侧的过量）；本族 free_rider
 *     管**公共品供给不足**（我不参与——供给侧的退出），一消一供。
 *   · self_selection_bias(241)/selection_on_dependent_variable(240)
 *     管**统计样本按结果自选择**（纳入/归因口径）；本族
 *     adverse_selection 管**市场池按私有风险自筛选**（保险/信贷
 *     定价结构），场景与后果链不同。
 *   · helplessness_induction 管**心理操控式的无助诱导**（你离了
 *     我什么也干不了）；本族 free_rider 是资源/制度推理，无人际
 *     操控结构。
 *
 * 判据（每子族双腿共现，缺一不判）：
 *   ① 腿① 语境锚点（POOL/SHIELD/COLLECTIVE，中英分列）；
 *   ② 腿② 断言腿（NODISTORT/NOCHANGE/ABSTAIN，中英分列）；
 *   两腿落在近距离窗内（ZH 60 字 / EN 180 字符）。
 *   腿②匹配若被翻转短语修饰（不等于/并非/不能说/未必/not that/
 *   far from）不计——说话者已在纠正该推理，正是本族解药。
 *   全篇出现防范/警惕/克服类针对性纠偏短句（要防逆选择/为克服
 *   搭便车/guard against moral hazard）→ 整条豁免。
 *
 * 为什么取 VERIFY 级：单句可能是在转述一个既成制度安排而未及展开
 * 效应分析（这类由缺腿/豁免覆盖），也可能是分析者的真诚信念陈述。
 * verify 的语义是「这段话断言隐藏信息/隐藏行动/集体行动对结果没有
 * 影响，先核实池子的自筛选方向、兜底的行为弹性与公共品的供给历
 * 史，再决定是否采信其结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 纠正/防范表述（要防逆选择/警惕道德风险/为防止搭便车/通过
 *     免赔额缓解/guard against adverse selection）——解药句；
 *   · 概念教学（正确定义天然不含无扭曲断言腿；逆选择确实存在、
 *     道德风险需要制度设计、公共品容易供给不足）；
 *   · 缺任一跳线（只报保险事实、无行为不变断言；只报公共事务、
 *     无退出断言）——双腿判据天然不命中；
 *   · 翻转否定（并非不会改变/不等于没有影响）——语义已翻转。
 */
'use strict';

// ═══════════════════════════════════════════════════════════════
// 子族① adverse_selection 逆选择忽视
// ═══════════════════════════════════════════════════════════════

// 腿① 风险池/信贷池语境（中文）
const POOL_ZH = [
  // ①-a 保险族（含风险池/保险池专名；r299 补「混合池/共同池/互助池/统筹池/大池」——裸名词形，
  //    缺口实证：「混合池里高风险和低风险的人自然平衡」整句穿透，池名词只收保险专名时收不到）
  /(?:保险|投保|保费|参保|保单|承保|理赔|风险池|保险池|资金池|混合池|共同池|互助池|统筹池|大池|这个池|整个池|池子)/,
  // ①-a2 池/结构裸名词族（r299 新增）：兜底/混合/统筹语境下断言腿常以「这个机制/整个结构」指代池子，
  //    腿①只收保险专名时收不到这类指代（缺口实证：「这个机制下定价本就是正确的」穿透）
  /(?:机制|体制|制度|结构|体系|系统|方案|安排|设计|模式|框架|办法|做法|政策|举措|改革|工程|项目|计划|平台|网络|体系)/,
  // ①-b 社会保障族
  /(?:医保|社保|住房公积金|互助保|相互保)/,
  // ①-c 信贷族
  /(?:贷款|信贷|借款|放贷|放款|授信|按揭|坏账|信用卡)/,
  // ①-d 二手车/旧货市场族
  /(?:二手车|旧车|二手|置换|回收|典当)/,
  // ①-e 融资/募集族
  /(?:募资|融资|集资|众筹|增发|定增|配股|风投|创投)/,
];

// 腿① 风险池/信贷池语境（英文）
const POOL_EN = [
  /\b(?:insurance|insurer|premiums?|policyholders?|underwrit\w+|risk pool|insurance pool|pool of (?:risks?|policyholders?|borrowers?|drivers?))\b/i,
  /\b(?:loans?|borrowers?|lenders?|lending|credit (?:market|score|scoring)|mortgages?|defaults?)\b/i,
  /\b(?:used[- ]car|lemon|certified pre[- ]owned)\b/i,
  /\b(?:crowdfund\w+|venture (?:capital|funding)|seed (?:funding|round))\b/i,
  // ①-e 池/组合裸名词族（r299 新增）：pool|book|portfolio|mix|enrollment|coverage|exposures?|payouts?|rates?|the market|the system
  //    缺口实证："The high-risk and low-risk exposures cancel out in a big enough book." /
  //    "Across the pool there is no meaningful difference in default rates." /
  //    "With universal enrollment the rates will be fair." / "The market self-regulates…"
  //    腿①只收 insurance/loans 专名族时，收不到以 book/exposures/enrollment/market 指代池子的断言。
  /\b(?:pool|pools|pooling|pooled|book|books|portfolio|portfolios|mix|mixture|enrollment|coverage|exposures?|payouts?|rates?|the market|the system|the scheme|the plan|the policy|risk profile|risk pool|balance|imbalance)\b/i,
  // ①-f2 申请人/参与方裸名词族（r301 新增）：applicants?|candidates?|enrollees?|the insured|would-be borrowers
  //    缺口实证（r301）："There is no reason for additional screening of the applicants."
  //    穿透——腿①只收 pool/insurance 专名时，收不到以 applicants（被筛选方）作锚的
  //    「无需筛申」断言（insured 已在 SHIELD_EN 道德风险侧，此处补齐逆选择侧）。
  /\b(?:applicants?|candidates?|enrollees?|the insured|would[- ]be (?:borrowers?|policyholders?)|everyone who appl(?:ies|y)|all (?:applicants?|comers))\b/i,
  // ①-f 覆盖/参与族（r299 新增）：universal|full|complete|broad|wider|everyone|all (?:borrowers|applicants|policyholders)|across the pool
  /\b(?:universal|full|complete|broad|wider|everyone|all (?:borrowers?|applicants?|policyholders?|participants?|members?)|across the pool|same (?:plan|policy)|one (?:pool|plan))\b/i,
  // ①-g 激励扭曲三族核心术语裸名词族（r303 新增）：adverse selection|moral hazard|free rider|free-riding|collective action|tragedy of the commons
  //    缺口实证："Adverse selection will not be a problem here, buyers can tell quality on their own." /
  //    "Moral hazard is not a concern once the insurance is in place." ——腿①只收 insurance/loan/market
  //    类语境词时，收不到以三族术语本身作主语的断言（术语名作锚是此类否认句最常见的主语形态）。
  /\b(?:adverse selection|moral hazard|free rider|free riders|free riding|free-riding|collective action|tragedy of the commons|asymmetric information|information asymmetry)\b/i,
];

// 腿② 无扭曲断言（中文）：自然均衡混合 / 对结果没有影响 / 不会推高
const NODISTORT_ZH = [
  // ②-a (吸引|纳入|覆盖|包含|筛选|集中|涌入)×(混合词)×(人|人群|客户|投保人|借款人)
  /(?:吸引|招来|纳入|覆盖|包含|筛(?:选|出|进|入)?|集中|涌入|聚拢)[^。，！？；\n]{0,12}(?:各类|各种|不同|高中低|好坏|优劣|均衡|混合|相同|差不多|一样|相差不大|高中低档|风险)(?:风险|水平|资质|信用|风险水平|信用等级)?(?:的)?(?:人|人群|客户|用户|投保人|借款人|申请人|参与者|成员)/,
  // ②-b (风险|投保|借款|客户|人群|结构)×(分布|结构|组合|构成|集中)×(没有|不会有|不构成|谈不上|相互抵消|有|任何)×(影响|差别|问题|变化)
  /(?:风险|投保|借款|客户|人群|申请人|参与者|池子|保险池|风险池|资金池)(?:分布|结构|组合|构成|集中|构成比例|占比)[^。，！？；\n]{0,8}(?:并?没有|不会有|不构成|谈不上|称不上|相互抵消|彼此抵消|互相抵消)(?:有)?(?:什么|任何|有何|太大)?(?:影响|差别|区别|不同|问题|压力|变化)/,
  // ②-c (自然|自动|必然|一定|当然|反正|总归)×(会)×(吸引|平衡|均衡|抵消|对冲)×(可选混合词)
  /(?:自然|自动|必然|一定会|一定|当然|反正|总归|终究)[^。，！？；\n]{0,4}(?:会|便|将)?(?:吸引|平衡|均衡|抵消|对冲|摊平|抹平)(?:各类|各种|不同|高中低|好坏|优劣|全部|所有)?/,
  // ②-d (对|对于)?×(保费|价格|成本|质量|市场|整体|赔付|保障|坏账|利率|收益|亏损|基金)×(没有|不会有|不构成|谈不上|称不上)×(影响|压力|差别|推高作用)
  /(?:对|对于)?(?:保费|价格|成本|质量|市场|整体|赔付|保障|坏账|利率|收益|亏损|统筹基金|基金|资金池|风险池)(?:来说|而言)?(?:并?没有|不会有|不构成|谈不上|称不上)(?:有)?(?:什么|任何|有何|太大)?(?:影响|压力|差别|区别|不同|推高作用|变化)/,
  // ②-e (说明|证明|意味着|表明|可见|反映出|所以|因此)×(没有影响|不影响|不改变|不会推高|不存在|不是问题|无需担心|自动平衡)
  /(?:说明|证明|意味着|表明|可见|反映出|足以证明|所以|因此|故而|换句话说)[^。，！？；\n]{0,14}(?:没有影响|不影响|不改变|不会推高|推不高|不存在|不是问题|无需担心|不必担心|不用担心|自动平衡|自然均衡|相互抵消|差不多|大同小异|无差别|没有差别)/,
  // ②-f 混合词前置形（把各类人群都纳入/各种信用等级的人都进来）
  /(?:各类|各种|不同|高中低|好坏|优劣|均衡|混合|全部|所有)(?:风险|信用|资质|水平|信用等级)?(?:的)?(?:人|人群|客户|用户|投保人|借款人|申请人|参与者|成员)(?:都|全|均)?(?:被|受到)?(?:纳入|覆盖|吸引|集中|招来|聚拢|纳入进来)/,
  // ②-g 自抵消动词族（r299 新增）：(风险|差异|损失|赔付|成本|收益|亏损|后果|责任|负担|价格|保费)×(自己|自动|自然|会|就|能|便|将|彼此|互相|相互|总归|终究|当然|必然)?(?:抵消|对冲|摊平|抹平|冲抵|抵销|对冲掉|均衡|平衡|平摊|均摊|分散掉|消化掉|消化|吸收|过滤掉|筛掉|筛除|淘汰|出清|清掉|抵消掉)
  //    缺口实证：「保费自然就是合理的，风险会自己抵消」穿透——既有族只收「分布结构没有影响」的名词形断言，
  //    收不到「X 自己抵消掉」的动词形断言（r161 同族教训：只收带后缀形导致裸名词/动词形整句漏判）。
  /(?:风险|差异|差别|损失|赔付|成本|收益|亏损|后果|责任|负担|价格|保费|收益|亏损|坏账|支出|费用|代价|压力|波动|起伏|震荡)(?:自己|自行|自动|自然|会|就|能|便|将|彼此|互相|相互|总归|终究|当然|必然|终究)?(?:会|将|就|能|便)?(?:自己|自行)?(?:抵消|对冲|摊平|抹平|冲抵|抵销|均衡|平衡|平摊|均摊|分散|消化|吸收|过滤|筛掉|筛除|淘汰|出清|清掉|抵消掉|对冲掉)/,
  // ②-h 无条件合理断言族（r299 新增）：(保费|价格|费率|利率|定价|成本|收益|回报|报酬|费用|支出)×(自然|自动|当然|必然|一定|肯定|本来|终究|总归)?(?:就是|便是|才是|为|是)?(?:合理|公平|公道|公允|合适|恰当|适当|正好|正好合适|合宜|对等|划算|公道|正当|正确|对的|没错|无妨|不用管|不必管|不用调|不用改)
  //    缺口实证：「保费自然就是合理的」穿透——既有族只收「没有影响/不推高」的否定形断言，
  //    收不到「自然就是合理的」的正面定性断言（同一否认扭曲的相反句式）。
  // ②-h2 单字「是」连接（r301 新增）：连接词表补单字「是」——「定价本就是正确的」中
  //    「本就」消费后剩单字「是」+「正确」，原连接词组 (就是|便是|才是|即为|是为|乃是)
  //    全是双字/固定词，单字「是」漏收（缺口实证：「这个机制下定价本就是正确的」穿透）。
  /(?:保费|价格|费率|利率|定价|成本|收益|回报|报酬|费用|支出|收费|机制|制度|结构|体系|系统|方案|安排)(?:自然|自动|当然|必然|一定|肯定|本来|终究|总归|本就|本身)?(?:就是|便是|才是|即为|是为|乃是|是|为)?(?:合理|公平|公道|公允|合适|恰当|适当|正好|合宜|对等|划算|正当|正确|对的|没错|合情|可行|行得通|说得通|讲得通)/,
  // ②-i 无需甄别断言族（r299 新增）：(不需要|无需|无须|用不着|不必|无必要|谈不上|不存在|没有|无须)(?:什么|任何|额外|进一步|另行|再|单独|特别|逐个|逐一|逐一地|分别|分级|分层|区别|差异化|甄别|筛选|评估|审核|测算|定价|甄别|监管|监督|约束|配套|兜底|补偿)?(?:甄别|筛选|评估|审核|测算|定价|监管|监督|约束|配套|区分|区别|干预|介入|操心|担心|顾虑|担忧)
  //    缺口实证：「混合池里……定价不用担心」穿透——兜底语境下「不需要额外甄别」的正向断言，
  //    与 ②-d 的「没有影响」互为补集，二者都构成否认自筛选。
  /(?:不需要|无需|无须|用不着|不必|无必要|谈不上|不存在|没有|毋须)(?:什么|任何|额外|进一步|另行|再|单独|特别|逐个|逐一|分别|分级|分层|区别|差异化)?(?:甄别|筛选|评估|审核|测算|定价|监管|监督|约束|配套|区分|区别|干预|介入|操心|担心|顾虑|担忧|过问|插手)/,
  // ②-j 否认机制设计必要性族（r303 新增）：(不需要|无需|无须|用不着|不必)×(设计|建立|建设|设立|设置|构建|部署|安排|制定|引入|配套|建)×(机制|制度|规则|措施|办法|体系|方案|安排|条款|保障|约束|激励|监督|监管|防|反作弊|风控|风控|保证金|抵押|担保|保险|审核|筛选|评估|定价|托管|监理)
  //    缺口实证：「这个系统不需要设计防作弊机制，参与者自然会好好干」穿透——既有族只收
  //    「不需要甄别/监督」的无宾语形，收不到「不需要设计X机制」的「否认机制设计必要性」形
  //    （逆选择/道德风险/搭便车三族的共同核心：断言无需制度安排，市场/参与者会自然达标）。
  /(?:不需要|无需|无须|用不着|不必|无必要|谈不上|犯不着|毋须)(?:去|再|另行|额外|特别|单独)?(?:设计|建立|建设|设立|设置|构建|部署|安排|制定|制定出|引入|配套|搭建|建|搞|弄|立|定|做出|整出|安排出)(?:什么|任何|一套|一个|一项|点)?(?:的)?(?:专门|专门用于|专门用来|额外|进一步|相应|配套|有效|完善)?(?:机制|制度|规则|规矩|措施|办法|体系|方案|安排|条款|保障|约束|激励|监督|监管|防控|防|反作弊|风控|保证金|抵押|担保|保险|审核|筛选|评估|定价|托管|监理|审核机制|监督机制|约束机制|激励机制|保障机制|防作弊)/,
];

// 腿② 无扭曲断言（英文）
const NODISTORT_EN = [
  // ②-a (attracts|includes|covers|pools|draws|comprises|self-selects)×(balanced|even|uniform|representative|same|mixed|equal)×(mix|spread|distribution|range|proportion)
  /\b(?:attracts?|attracting|includes?|including|covers?|covering|pools?|pooling|draws?|drawing|comprises?|comprising|self[- ]selects?|self[- ]selecting)\b[^.]{0,40}\b(?:a\s+|an\s+|the\s+)?(?:balanced|even|uniform|representative|same|similar|mixed|equal|wide)\s+(?:mix|spread|distribution|range|proportion|share)\b/i,
  // ②-b (so|thus|therefore|hence|which means)×(premiums|prices|costs|rates|quality)×(stay|remain|unchanged|stable|the same|flat)
  /\b(?:so|thus|therefore|hence|which means|meaning)\b[^.]{0,40}\b(?:premiums?|prices?|costs?|rates?|quality|losses?)\s+(?:stay|stays|remain|remains?|unchanged|stable|the same|flat|unaffected)\b/i,
  // ②-c (no|little|minimal|negligible)×(adverse selection|self-selection|selection effect/bias/distortion|risk concentration)
  /\b(?:no|little|minimal|negligible|limited)\s+(?:real\s+)?(?:adverse selection|self[- ]selection|selection (?:effect|bias|distortion)|risk concentration|cream[- ]skimming)\b/i,
  // ②-d (does not|doesn't|will not|won't|has no|have no)×(affect|change|impact|distort|differ|vary|effect)×(premiums|prices|costs|quality|rates|the pool|defaults|losses)
  /\b(?:does not|doesn'?t|do not|don'?t|will not|won'?t|cannot|can'?t|has no|have no)\s+(?:\w+\s+){0,3}?(?:affect|change|impact|distort|alter|differ|vary|effect)\b[^.]{0,40}\b(?:premiums?|prices?|costs?|rates?|quality|the pool|adverse selection|defaults?|losses?|interest rates?|approval rates?)\b/i,
  // ②-e (reach|serves|covers|caters to|lends to|includes)×(every|all|various|any|different|each)×(credit grade|risk level|borrower|risk profile)
  /\b(?:reach(?:es)?|serves?|covers?|caters?\s+to|lends?\s+to|includes?|accommodates?)\b[^.]{0,30}\b(?:every|all|various|any|different|each)\s+(?:credit grade|credit score|risk level|risk profile|borrower|risk class|type of borrower|kind of borrower)\b/i,
  // ②-f (leaves|keeps|renders|making)×(premiums|prices|costs|rates|quality|the pool|defaults)×(unaffected|unchanged|stable|flat|intact)
  /\b(?:leaves?|leaving|keeps?|keeping|renders?|making)\b[^.]{0,40}\b(?:premiums?|prices?|costs?|rates?|quality|the pool|defaults?|losses?)\s+(?:unaffected|unchanged|stable|flat|intact|undisturbed)\b/i,
  // ②-g 自动均衡动词族（r299 新增）：pool × (balance out|even out|settle|level off|average out|net out|cancel out|offset each other|smooth out|self-correct|self-corrects|sort themselves out|wash out|takes care of itself) × 反身/自平衡形
  //    缺口实证（r299 变体矩阵）："A large pool of borrowers will naturally balance out the risky ones." 与
  //    "the premiums will settle themselves" 整句穿透——既有族只收形容词性 balanced mix，
  //    收不到「池子自己搞定」的自平衡动词形。
  /\b(?:pool|pooling|pooled|mix|mixture|portfolio|book|enrollment|the (?:pool|book)|same (?:plan|policy)|one (?:pool|plan)|everyone)\b[^.]{0,60}\b(?:balance[sd]?\s+out|even[s]?\s+out|settles?\s+themselves|settles?\s+out|level[s]?\s+off|average[s]?\s+out|nets?\s+out|cancel[s]?\s+out|offset\s+each\s+other|smooth[s]?\s+out|self[- ]corrects?|sort\s+themselves\s+out|washes?\s+out|takes?\s+care\s+of\s+itself|sorts?\s+itself\s+out)\b/i,
  // ②-h 自抵消/无差别断言族（r299 新增）：(risk|risks|difference|differences|exposure|losses|outcomes|results|costs|bad debt) × (cancel out|cancel each other|offset each other|net out|wash out|even out|average out|balance out|net off|no real difference|no meaningful difference|no material difference|hardly any difference|barely differ|basically the same)
  //    缺口实证：「保费自然就是合理的，风险会自己抵消」的英文对应形 "the risks cancel out" / "defaults will not differ" 整句穿透。
  /\b(?:risk|risks|risk level|difference|differences|exposure|exposures|losses|outcomes?|results?|costs?|defaults?|bad debt|charge[- ]offs?|payouts?|premiums?|rates?|charges?|fees?|returns?)\b[^.]{0,40}\b(?:cancel\s+out|cancel\s+each\s+other|offset\s+each\s+other|net\s+out|washes?\s+out|even\s+out|average\s+out|balance[sd]?\s+out|nets?\s+off|no\s+real\s+difference|no\s+meaningful\s+difference|no\s+material\s+difference|hardly\s+any\s+difference|barely\s+differ|basically\s+the\s+same|essentially\s+the\s+same|amount\s+to\s+the\s+same|levels?\s+off|levels?\s+out|settles?\s+down|settle|flattens?\s+out|stabilizes?|stabilises?|converges?|equalizes?|equalises?|normalizes?|normalises?|smooths?\s+out|works?\s+out)\b/i,
  // ②-h2 存在句倒装形（r301 新增）：there is/are + no X difference + in/of + 主语
  //    缺口实证（r301）："Across the pool there is no meaningful difference in default rates."
  //    穿透——②-h 主族要求主语名词在断言前窗（risk…× no meaningful difference），收不到
  //    there be 存在句把断言提前、主语后置的倒装形（同一否认扭曲的另一高频句式）。
  /\b(?:there\s+is|there'?s|there\s+are|there\s+seems?\s+to\s+be|there\s+appears?\s+to\s+be)\s+(?:no|little|hardly\s+any|barely\s+any|virtually\s+no)\s+(?:real\s+|meaningful\s+|material\s+|significant\s+|substantial\s+|measurable\s+)*(?:difference|differences|variation|disparity|gap|spread|effect|impact|distinction)\s+(?:in|of|between|among|across)\b/i,
  // ②-i 无需干预断言族（r299 新增）：(no need|without any need|no reason|no point|no necessity|nothing to worry|no call|no justification|no grounds|no basis|no rationale) × (for|to|of) × (risk[- ]based|differential|individual|separate|extra|additional|further|special|separate|extra|closer|deeper) × (pricing|screening|underwriting|assessment|evaluation|scrutiny|monitoring|supervision|oversight|review|vetting|regulation|guard)
  //    缺口实证："without any need for risk-based pricing" 整句穿透——兜底语境下的「不需要额外甄别」正是否认自筛选的显式断言。
  /\b(?:no\s+need|without\s+any\s+need|no\s+reason|no\s+point|no\s+necessity|nothing\s+to\s+worry|no\s+call|no\s+justification|no\s+grounds|no\s+basis|no\s+rationale|no\s+requirement)\b[^.]{0,60}\b(?:risk[- ]based|risk[- ]adjusted|differential|individual|separate|extra|additional|further|special|closer|deeper|more)\s+(?:pricing|screening|underwriting|assessment|evaluation|scrutiny|monitoring|supervision|oversight|review|vetting|regulation|filtering|selection)\b/i,
  // ②-j 无条件合理断言族（r299 新增）：(premiums|prices|rates|costs|payouts|fees) × (are|will be|will stay|remain|stay|will remain) × (reasonable|fair|natural|appropriate|adequate|sensible|sound|justified|optimal|correct|stable|self[- ]settling)
  //    缺口实证：「保费自然就是合理的」的英文对应形 "the premiums are reasonable" 整句穿透。
  /\b(?:premiums?|prices?|rates?|costs?|payouts?|fees?|charges?)\s+(?:are|will\s+be|will\s+stay|will\s+remain|remain|stay|stays|is|will)\s+(?:reasonable|fair|natural|appropriate|adequate|sensible|sound|justified|optimal|correct|stable|self[- ]settling|automatically\s+(?:fair|reasonable|correct))\b/i,
  // ②-k 池子自净族（r299 新增）：(pool|book|portfolio|market|system|system|plan|scheme) × (self[- ]|auto[- ]|automatically|naturally|spontaneously) × (cleans|cleaning|purges|purging|sorts|sorting|selects|selecting|regulates|regulating|equilibrates|corrects|adjusts|stabilizes|self-regulates|self-corrects|self-selects|self-balances)
  //    缺口实证：「混合池里高风险和低风险的人自然平衡」的英文对应形 "the market self-regulates" 整句穿透。
  /\b(?:pool|book|portfolio|market|system|plan|scheme|mechanism|fund|insurance)\b[^.]{0,50}\b(?:self[- ]?regulates?|self[- ]?corrects?|self[- ]?selects?|self[- ]?balances?|self[- ]?cleans?|self[- ]?adjusts?|self[- ]?stabiliz(?:es|ing)|auto[- ]?regulates?|auto[- ]?corrects?|auto[- ]?adjusts?|automatically\s+(?:regulates?|corrects?|adjusts?|balances?|stabiliz(?:es|ing))|naturally\s+(?:regulates?|corrects?|adjusts?|balances?|stabiliz(?:es|ing))|spontaneously\s+(?:regulates?|corrects?|adjusts?|balances?))\b/i,
  // ②-l 否认机制设计必要性族（r303 新增）：(no need|doesn't need|don't need|no reason|no point|no necessity|not necessary|unnecessary|there is no need) × (for|to|of|with) × (design|designing|build|building|create|creating|establish|establishing|set up|setting up|put in place|institute|introduce|develop|implement|add|adding|put|install|require|requiring) × (mechanism|mechanisms|institution|institutions|rule|rules|regulation|regulations|safeguard|safeguards|control|controls|check|checks|constraint|constraints|guard|guards|screen|screening|audit|audits|oversight|monitoring|enforcement|penalty|penalties|anti-cheat|anti-fraud|collateral|deductible|deposit|insurance|guarantee|fund|escrow|vetting|verification|verification)
  //    缺口实证：「这个系统不需要设计防作弊机制，参与者自然会好好干」的英文对应形
  //    "The system doesn't need anti-cheat mechanisms, participants will do their best anyway." /
  //    "There is no need for a monitoring mechanism here." 整句穿透——既有族只收
  //    "no need for risk-based pricing" 的筛选形，收不到「不需要设计X机制」的机制设计必要性否认形。
  /\b(?:no\s+need|no\s+real\s+need|no\s+particular\s+need|no\s+reason|no\s+point|no\s+necessity|not\s+necessary|unnecessary|there'?s\s+no\s+need|there\s+is\s+no\s+need|doesn'?t\s+need|do\s+not\s+need|don'?t\s+need|won'?t\s+need|will\s+not\s+need|needn'?t|need\s+not)\b[^.]{0,40}\b(?:for|to|of|with|in)\s+(?:design\w*|build\w*|creat\w*|establish\w*|set(?:ting)?\s+up|put(?:ting)?\s+in\s+place|institut\w*|introduc\w*|develop\w*|implement\w*|add\w*|install\w*|requir\w*|have|include|put)\s+(?:\w+\s+){0,3}?(?:mechanisms?|institutions?|rules?|regulations?|safeguards?|controls?|checks?|constraints?|guards?|screening|audits?|oversight|monitoring|enforcement|penalt(?:y|ies)|anti[- ]cheat|anti[- ]fraud|collateral|deductibles?|deposits?|insurance|guarantees?|funds?|escrow|vetting|verification|screening|supervision|deterrence|accountability|transparency)\b/i,
  // ②-l2 无必要 + 机制名词直接相邻形（r303 新增）：no need for safeguards / no point in monitoring /
  //     unnecessary to add collateral（动词与机制名词之间无间隔词——②-l 的
  //     [^.]{0,40} 窗内若出现句读或跨句会漏收短距形）
  /\b(?:no\s+need|no\s+real\s+need|no\s+reason|no\s+point|no\s+necessity|not\s+necessary|unnecessary|needn'?t|need\s+not)\s+(?:for|in|to|of|with)\s+(?:mechanisms?|institutions?|safeguards?|controls?|checks?|constraints?|guards?|oversight|monitoring|enforcement|penalt(?:y|ies)|anti[- ]cheat|anti[- ]fraud|collateral|deductibles?|deposits?|insurance|guarantees?|funds?|escrow|vetting|verification|supervision|deterrence|accountability|transparency|audits?|screening|rules?|regulations?)\b/i,
];

// ═══════════════════════════════════════════════════════════════
// 子族② moral_hazard 道德风险忽视
// ═══════════════════════════════════════════════════════════════

// 腿① 兜底/保障语境（中文）
const SHIELD_ZH = [
  // ②-a 全额/兜底/担保族
  /(?:全额|兜底|保底|担保|包赔|全赔|包底|兜牢|托底)/,
  // ②-b 保险/保障族
  /(?:保险|保障|投保|理赔|赔付|偿赔付?)/,
  // ②-c 补贴/救助/减免族
  /(?:补贴|补助|救助|救济|减免|豁免|帮扶|兜底保障|最低保障|失业金|低保)/,
  // ②-d 注资/解救族（企业救助语境）
  /(?:注资|输血|解救|抢救|托管|纾困|救市|维稳基金)/,
];

// 腿① 兜底/保障语境（英文）
const SHIELD_EN = [
  /\b(?:insurance|coverage|insured|underwrit\w+)\b/i,
  /\b(?:guarantee[ds]?|guaranteed|backstop|bailouts?|bailed out|safety net|too[- ]big[- ]to[- ]fail)\b/i,
  /\b(?:subsid(?:y|ies|ized|ised|ze|zed)|relief (?:fund|payment)|unemployment (?:benefits?|insurance)|welfare)\b/i,
  /\b(?:no[- ]deductible|full(?:ly)? (?:insured|covered|reimbursed|guaranteed)|unlimited (?:coverage|liability))\b/i,
  // ①-d 兜底受益方/监督方裸名词族（r299 新增）：depositors?|creditors?|shareholders?|investors?|lenders?|policyholders?|stakeholders?|taxpayers?|savers?|account holders?
  //    缺口实证："The deposit insurance means depositors will not monitor the bank." /
  //    "Creditors have no incentive to scrutinize the lender." / "Shareholders feel no need to police the firm."
  //    腿①只收 insurance/guarantee/bailout 族时，收不到以「被兜底方/监督方」主语作锚的断言。
  /\b(?:depositors?|creditors?|shareholders?|investors?|lenders?|policyholders?|stakeholders?|taxpayers?|savers?|account holders?|bondholders?|creditors?|suppliers?|vendors?|customers?|buyers?|the public)\b/i,
  // ①-e 激励/回报结构族（r299 新增）：incentives?|payoff|payout|compensation|bonus|pay|return|reward|profit|gain|decision[- ]maker|manager|executive
  //    缺口实证："The incentives remain decoupled from actual behavior." /
  //    "Payoffs become divorced from performance." ——脱钩断言的锚在激励结构本身。
  /\b(?:incentives?|payoff|payoffs|payout|payouts|compensation|bonus|bonuses|pay|returns?|rewards?|profits?|gains?|decision[- ]maker|managers?|executives?|officers?|the firm|the bank|the company|the institution)\b/i,
];

// 腿② 行为不变断言（中文）
const NOCHANGE_ZH = [
  // ②-a (不会|不能|并不会|并不能|并不|没有|未必)×(可选)×(改变|影响|削弱|放松|动摇|扭曲|刺激|变化)×(可选)×(行为|决策|动机|努力|谨慎|风险偏好)
  /(?:不会|不能|并不会|并不能|并不|没有|未必|不太会|不见得)[^。，！？；\n]{0,10}(?:改变|影响|削弱|放松|动摇|扭曲|刺激|左右|决定|变化)(?:到|起|出|了)?[^。，！？；\n]{0,12}(?:行为|行为方式|决策|决策方式|动机|努力|谨慎|风险偏好|经营方式|管理方式|驾驶习惯|用药习惯|就医行为|动力|积极性|主动性|自控|自制|自觉)/,
  // ②-a2 「削弱/损害/打击……的（风险控制）动力」前置宾语形：
  // 不会削弱当事人自己控制风险的动力 / 救助不会削弱投保人自我约束的动力
  // （②-a 的宾语词表不含「动力」紧邻自控结构时的短距形态，实测「补贴和
  // 救助不会削弱当事人自己控制风险的动力」整句穿透，补此族。）
  /(?:不会|不能|并不会|并不能|并不|没有|未必|不太会|不见得)[^。，！？；\n]{0,10}(?:削弱|损害|打击|磨灭|消解|减退)[^。，！？；\n]{0,18}(?:动力|积极性|主动性|自控|自制|自觉性)/,
  // ②-b (行为|决策|动机|努力|谨慎|风险偏好)×(并不会|并不能|并不|没有|未必)×(有什么|任何|有)×(改变|变化|影响|削弱|放松|不同)
  /(?:行为|行为方式|决策|决策方式|动机|努力|谨慎|风险偏好|经营方式|管理方式|驾驶习惯|就医行为)[^。，！？；\n]{0,6}(?:并?不会|并不会|并不能|并不|没有|未必)(?:有)?(?:什么|任何|有何)?(?:改变|变化|影响|削弱|放松|不同)/,
  // ②-c (不会|不能|并不会|并不能|并不)×(可选)×(更|更加|越发|越来越)×(大胆|冒险|激进|松懈|大意|放任|投机|冒进|更多风险|过度冒险|加杠杆|加码|冒进)
  /(?:不会|不能|并不会|并不能|并不|不至于|未必)[^。，！？；\n]{0,10}(?:更|更加|越发|越来越)?(?:大胆|冒险|激进|松懈|大意|放任|投机|冒进|更多风险|过度冒险|加杠杆|加码|冲动|挥霍|浪费)/,
  // ②-d 独立否认形（开车不会有什么变化/不会有任何改变/不会有什么不同）
  /(?:不会|不能|并不会|并不能|并不|没有|未必|不太会|不见得)(?:有)?(?:什么|任何|有何)?(?:变化|改变|不同|区别|差别)/,
];

// 腿② 行为不变断言（英文）
const NOCHANGE_EN = [
  // ②-a (does not|doesn't|will not|won't|cannot|can't|would not|wouldn't)×(change|alter|affect|reduce|weaken|distort)×(behavior|incentives|risk-taking|effort|caution|prudence|driving|careful)
  /\b(?:does not|doesn'?t|do not|don'?t|will not|won'?t|cannot|can'?t|would not|wouldn'?t)\s+(?:\w+\s+){0,4}?(?:change|alter|affect|reduce|weaken|distort|discourage)\b[^.]{0,50}\b(?:behavio(?:u)?r|incentives?|risk[- ]taking|effort|caution|prudence|conduct|driv\w+|careful\w*|reckless\w*)\b/i,
  // ②-a2 裸形：will not change behavior / won't affect behavior / does not
  // alter conduct（change 与行为词直接相邻，无中间修饰语——②-a 要求
  // [^.]{0,50} 至少跳过一词，实测 "With a full government guarantee,
  // borrower behavior will not change." 整句穿透，补此族。）
  /\b(?:does not|doesn'?t|do not|don'?t|will not|won'?t|cannot|can'?t|would not|wouldn'?t)\s+(?:\w+\s+){0,2}?(?:change|alter|affect|reduce|weaken|distort|discourage)\s+(?:behavio(?:u)?r|conduct|incentives?|risk[- ]taking|effort|caution|prudence)\b/i,
  // ②-a3 主宾倒装形：borrower behavior will not change / risk-taking
  // remains unaffected（行为词在前、否认动词在后——②-a2 只收「否认
  // ×change×行为」顺装形，实测 "With a full government guarantee,
  // borrower behavior will not change." 整句穿透，补倒装族。）
  /\b(?:behavio(?:u)?r|conduct|incentives?|risk[- ]taking|effort|caution|prudence)\s+(?:will|would|shall|can|may|might)?\s*(?:not|never)\s+(?:\w+\s+){0,2}?(?:change|alter|affect|shift|vary|differ)\b/i,
  // ②-b (no|little|minimal|negligible)×(change|effect|impact)×(on|in)×(behavior|incentives|risk-taking|effort)
  /\b(?:no|little|minimal|negligible)\s+(?:real\s+)?(?:change|effect|impact)\s+(?:on|in|to)\s+(?:\w+\s+){0,3}?(?:behavio(?:u)?r|incentives?|risk[- ]taking|effort|caution|conduct|choices?|decisions?)\b/i,
  // ②-c (does not|won't|will not)×(make|lead|cause|push|drive|push|tempt)×(people|firms|banks|companies|borrowers|drivers|agents)×(more)×(reckless|risk-taking|cautious)
  /\b(?:does not|doesn'?t|will not|won'?t|would not|wouldn'?t)\s+(?:make|lead|cause|push|drive|push|tempt)\b[^.]{0,40}\b(?:people|firms?|banks?|companies|borrowers?|drivers?|agents?|managers?|executives?)\b[^.]{0,30}\b(?:more\s+)?(?:reckless|risky|cautious|careless|aggressive|prudent)\b/i,
  // ②-d 监督豁免断言族（r299 新增）：(depositors|creditors|shareholders|investors|lenders|policyholders|the public|outsiders|outsiders|third parties|stakeholders|buyers|customers|depositors|account holders) × (will not|won't|do not|don't|need not|have no reason to|have no need to|have no incentive to) × (monitor|supervise|check|watch|screen|vet|audit|oversee|scrutinize|examine|inspect|police|discipline|punish|constrain|restrain|discipline)
  //    缺口实证："depositors will not monitor the bank" 整句穿透——道德风险的核心机制是「被兜底方放松、监督方退出」，
  //    既有族只收「被兜底方行为不变」，收不到「监督方也退出」这一半。
  /\b(?:depositors?|creditors?|shareholders?|investors?|lenders?|policyholders?|the public|outsiders?|third part(?:y|ies)|stakeholders?|buyers?|customers?|account holders?|savers?|taxpayers?)\b[^.]{0,50}\b(?:will not|won'?t|do not|don'?t|need not|needn'?t|have no reason to|have no need to|have no incentive to|have little incentive to|feel no need to)\s+(?:\w+\s+){0,2}?(?:monitor|supervise|check|watch|screen|vet|audit|oversee|scrutinize|examine|inspect|police|discipline|punish|constrain|restrain|question|challenge)\b/i,
  // ②-e 无额外风险断言族（r299 新增）：(bank|firm|company|institution|agency|borrower|insured|the (?:bank|firm|borrower|insured)|it|they|he|she) × (faces|face|carries|takes|assumes|bears|runs|is exposed to|has|have) × (no|little|minimal|negligible|no extra|no additional|no further|no greater|hardly any) × (extra|additional|further|greater|incremental|more|excess) × (risk|exposure|losses|danger|downside|hazard|liability|cost|burden)
  //    缺口实证："the bank faces no extra risk" 整句穿透——兜底改变承担结构后的「无额外风险」结论正是道德风险否认的标准形态。
  /\b(?:bank|firm|company|institution|agency|agencies|borrower|borrowers|insured|the (?:bank|firm|borrower|insured|institution|company)|it|they|he|she)\b[^.]{0,40}\b(?:faces?|carries?|takes?|assumes?|bears?|runs?|is exposed to|has|have|take on|take up)\s+(?:no|little|minimal|negligible|hardly any|no\s+extra|no\s+additional|no\s+further|no\s+greater|no\s+real)\s+(?:extra\s+|additional\s+|further\s+|greater\s+|incremental\s+|more\s+|excess\s+|real\s+)*(?:risk|exposure|losses|danger|downside|hazard|liability|costs?|burden)\b/i,
  // ②-f 脱钩断言族（r299 新增）：(incentives?|payoff|payout|compensation|bonus|pay|return|reward|profit|gain) × (are|is|remain|stay|become|become) × (decoupled|disconnected|separate|divorced|detached|independent|unlinked|uncoupled) × (from) × (behavior|conduct|performance|outcome|results?|actions?|decisions?|risk)
  //    缺口实证：兜底语境下「回报与行为脱钩」的全英文标准表述（"incentives remain decoupled from behavior"）穿透。
  /\b(?:incentives?|payoff|payout|compensation|bonus|bonuses|pay|returns?|rewards?|profits?|gains?|payoffs?|outcomes?|results?|actions?|behavior|behaviour|conduct|performance|risks?|risk|decisions?)\b[^.]{0,40}\b(?:are|is|remain|remains|stay|stays|become|becomes|became|seem|seems|appear|appears|get|gets|grow|grows|turn|turns)\s+(?:largely\s+|essentially\s+|fully\s+|completely\s+|totally\s+|entirely\s+|wholly\s+)*(?:decoupled|disconnected|separate|divorced|detached|independent|unlinked|uncoupled|insulated|split|severed|removed|distant)\s+from\b/i,
  // ②-g 监督退出断言族（r301 新增）：there is/are + (no|little|no further|no additional) + (grounds|reason|need|necessity|justification|basis|rationale|case|call|requirement) + for + (monitoring|supervision|oversight|scrutiny|screening|vetting|auditing|policing|discipline|enforcement|regulation|inspection|surveillance|checking)
  //    缺口实证（r301）："There are no grounds for closer monitoring of the insured." 穿透——
  //    该断言形 r299 被误置 NODISTORT_EN（逆选择族），而腿①锚点 insured 在 SHIELD_EN
  //    （道德风险族），跨子族无法配对；且道德风险的核心机制「监督方退出」半边本来就
  //    缺此形（②-d 收 will not monitor 主谓形，收不到 there be 存在句无人称形）。
  /\b(?:there\s+is|there'?s|there\s+are|there\s+seems?\s+to\s+be|there\s+appears?\s+to\s+be)\s+(?:no|little|no\s+real|no\s+further|no\s+additional|no\s+particular)\s+(?:grounds|ground|reason|reasons|need|necessity|justification|basis|rationale|case|call|requirement)\s+(?:for|to|of)\s+(?:\w+\s+){0,3}?(?:monitoring|supervision|oversight|scrutiny|screening|vetting|auditing|policing|discipline|enforcement|regulation|inspection|surveillance|checking)\b/i,
];

// ═══════════════════════════════════════════════════════════════
// 子族③ free_rider 搭便车盲区
// ═══════════════════════════════════════════════════════════════

// 腿① 集体/公共语境（中文）
const COLLECTIVE_ZH = [
  // ③-a 公共品/公共事务族
  /(?:公共|公地|共管|共享|共建|共治|公共品|公共事务|公共利益|公共服务|公益|公共资源)/,
  // ③-b 集体/团队/社区族
  /(?:大家一起|大家共同|所有人|每个人|众人|团队|集体|社区|社群|小区|业主|村子|村民|会员|联盟|合作社)/,
  // ③-c 他人总会兜底族
  /(?:别人|其他人|总会有人|有人会|其他人会|别的业主|其他成员|其他住户|其他业主|旁人)/,
];

// 腿① 集体/公共语境（英文）
const COLLECTIVE_EN = [
  /\b(?:public (?:good|goods|project|affairs|service|services|resources?)|the commons|commons)\b/i,
  /\b(?:communit\w+|the (?:team|group|collective|neighborho?od|village|cooperative)|shared (?:responsibility|burden|cost))\b/i,
  /\b(?:others?|someone else|everyone else|other (?:members|people|residents|tenants|contributors|homeowners))\b/i,
  // ①-d 成员/义务裸名词族（r299 新增）：member|members|participant|participants|obligation|duty|contribution|dues|fee|fee payer|any single member|every member
  //    缺口实证："There is no obligation on any single member to pay in." ——既有族只收 public good/community 专名，
  //    收不到以 member/obligation 作锚的「无义务」断言。
  /\b(?:members?|participants?|obligation|obligations|duty|duties|contribution|contributions|dues|fee|fees|any single (?:member|person|individual)|every (?:member|person|individual)|each (?:member|person|individual)|one (?:member|person|individual))\b/i,
];

// 腿② 脱责式退出（中文）
const ABSTAIN_ZH = [
  // ③-a (我|我个人|自己|咱)×(不用|不必|没必要|无须|无需|用不着|轮不到|犯不着|凭什么|哪能轮到)×(参与|出力|出资|捐款|贡献|行动|管|操心|做|承担|分担|出面|动手|参加|去)
  /(?:我|我个人|咱|咱们|自己|我这边|我一人)(?:也|根本|完全|暂且)?(?:不用|不必|没必要|无须|无需|用不着|轮不到|犯不着|懒得|凭什么|哪能轮到|怎轮得到)(?:去|出面|参与|出力|出资|捐款|贡献|行动|管|操心|做|承担|分担|动手|参加|过问|搭理)/,
  // ③-b (不用|不必|没必要|无须|无需|用不着|轮不到|犯不着|凭什么)×(要|得)?×(我|咱|自己)×(出面|参与|出力|出资|捐款|贡献|行动|管|操心|做|承担|分担|动手|参加)
  /(?:不用|不必|没必要|无须|无需|用不着|轮不到|犯不着|懒得|凭什么|哪能轮到|怎轮得到)(?:要|得|应该)?(?:我|咱|咱们|自己|我个人)(?:出面|参与|出力|出资|捐款|贡献|行动|管|操心|做|承担|分担|动手|参加|过问|搭理)/,
  // ③-c (别人|其他人|总会有人|有人|大家)×(会|总|自然)×(去|来|做|管|出钱|出力|捐款|参与|承担|买单|搞定|解决)×(可选)×(我)×(不用|不必|没必要|无须|无需|用不着|轮不到)
  /(?:别人|其他人|总会有人|有人|大家|其他业主|其他成员)(?:会|总|自然|迟早|反正)[^。，！？；\n]{0,8}(?:去|来|做|管|出钱|出力|捐款|参与|承担|买单|搞定|解决|组织|牵头)[^。，！？；\n]{0,14}(?:我|咱|咱们|自己)(?:也)?(?:不用|不必|没必要|无须|无需|用不着|轮不到|犯不着)/,
  // ③-d 搭便车话术（搭便车|搭顺风车|坐享其成|吃现成的|让别人去）×(就行|就好|可以|没错|理所当然|没什么|何乐不为)
  /(?:搭便车|搭顺风车|搭顺风车|坐享其成|吃现成的|让别人去|让别人做|让别人管|让别人扛)(?:就行|就好|就可以了|可以|没错|理所当然|没什么|何乐不为|不丢人|无妨)/,
  // ③-d2 动词插入形：让别人去管就好了 / 让别人来处理就行（③-d 的
  // 「让别人去」与收尾词之间插入了具体动词——实测「让别人去管就好
  // 了，团队成果人人有份」整句穿透，补此族。）
  /(?:让别人|叫别人|任别人|等别人|其他人|别人)[^。，！？；\n]{0,4}(?:去|来|做|管|处理|负责|贡献|出力|承担|解决|牵头|张罗|操心)(?:就行|就好|就可以了|可以|没错|理所当然|没什么|何乐不为|不丢人|无妨)/,
];

// 腿② 脱责式退出（英文）
const ABSTAIN_EN = [
  // ③-a (I|me|my)×(do not|don't|need not|needn't|won't|will not|have no|why should|why must)×(contribute|participate|chip in|pay|donate|do my part|act|help|volunteer|join)
  /\b(?:I|me|my)\s+(?:do not|don'?t|does not|need not|needn'?t|won'?t|will not|have no|why should|why must)\s+(?:\w+\s+){0,3}?(?:contribute|participate|chip in|pay|donate|do my part|act|help|volunteer|join|show up)\b/i,
  // ③-b (someone else|others|everyone else|other members|people)×(will|would|can|could|always|naturally)×(contribute|donate|pay|chip in|handle|take care|do it|act|volunteer)×(so|thus|therefore)×(I|me|my)×(do not|don't|need not|needn't|won't|why should)
  /\b(?:someone else|others?|everyone else|other (?:members|people|residents|contributors|tenants))\s+(?:will|would|can|could|always|naturally|surely)\s+(?:\w+\s+){0,3}?(?:contribute|donate|pay|chip in|handle|take care|do it|act|volunteer|organize)\b[^.]{0,60}\b(?:so|thus|therefore)\b[^.]{0,40}\b(?:I|me|my)\s+(?:do not|don'?t|need not|needn'?t|won'?t|will not|why should|why must)\b/i,
  // ③-c (I|me|my)×(don't|do not|needn't|won't)×(need to)×(participate|contribute|join|do my part|chip in|show up)
  /\b(?:I|me|my)\s+(?:don'?t|do not|needn'?t|won'?t|will not)\s+(?:really\s+)?need\s+to\s+(?:participate|contribute|join|do my part|chip in|show up|volunteer|be involved)\b/i,
  // ③-d (why should|why must|why would)×(I|me|my)×(contribute|participate|chip in|pay|donate|do my part|volunteer|help)
  /\b(?:why should|why must|why would|why ought)\s+(?:I|me|my)\s+(?:\w+\s+){0,3}?(?:contribute|participate|chip in|pay|donate|do my part|volunteer|help|be involved|show up)\b/i,
  // ③-e 无需贡献断言族（r299 新增）：(there is|there's|there is) × (no|little|no real) × (need|reason|necessity|obligation|duty|expectation|requirement) × (for|on) × (me|my|I|anyone|each person|the individual|a single person|one person|every member) × (to) × (contribute|participate|chip in|pay|donate|do my part|act|help|volunteer|join|show up|bother)
  //    缺口实证："there is no need for me to contribute" 整句穿透——既有族只收 "I don't need to" 主谓形，
  //    收不到存在句 there is no need for me to 的无人称形。
  /\b(?:there\s+is|there'?s|there\s+seems?\s+to\s+be|there\s+appears?\s+to\s+be)\s+(?:no|little|no\s+real|no\s+particular)\s+(?:need|reason|necessity|obligation|duty|expectation|requirement|point)\s+(?:for|on)\s+(?:me|my|I|anyone|each\s+person|the\s+individual|a\s+single\s+person|one\s+person|every\s+member|each\s+member|everyone)\s+to\s+(?:\w+\s+){0,2}?(?:contribute|participate|chip in|pay|donate|do\s+my\s+part|act|help|volunteer|join|show\s+up|bother|get\s+involved)\b/i,
  // ③-e2 无义务存在句族（r299 新增）：there is no (obligation|duty|expectation|requirement) × (on|for) × (any single member|any one person|me|each person|every member|the individual|one person|each member|everyone) × (to)×(contribute|pay in|participate|do my part|join|chip in|volunteer|help|show up|act)
  //    缺口实证："There is no obligation on any single member to pay in." 穿透——③-e 收 need/reason 名词，
  //    收不到 obligation/duty/expectation 这一同族名词的同一存在句型。
  /\b(?:there\s+is|there'?s|there\s+seems?\s+to\s+be|there\s+appears?\s+to\s+be)\s+(?:no|little|no\s+real|no\s+particular)\s+(?:obligation|obligations|duty|duties|expectation|expectations|requirement|requirements|compulsion|onus)\s+(?:on|for)\s+(?:any\s+single\s+member|any\s+one\s+person|any\s+single\s+person|me|my|I|each\s+person|the\s+individual|a\s+single\s+person|one\s+person|every\s+member|each\s+member|everyone|anyone|any\s+member|any\s+participant)\s+to\s+(?:\w+\s+){0,2}?(?:contribute|participate|chip in|pay|donate|do\s+my\s+part|act|help|volunteer|join|show\s+up|bother|get\s+involved|pay in)\b/i,
  // ③-e3 无义务归属族（r299 新增）：(I|me|my|we|us|our|you|your|one|anyone|each person|every member|the individual|any single member) × (have|bear|carry|face|take on|assume|am under|under) × (no|little|no real|minimal) × (obligation|duty|responsibility|expectation|requirement|onus|commitment) × (to)×(contribute|pay in|participate|do my part|join|chip in|volunteer|help|show up|act)
  //    缺口实证："I have no obligation to contribute" 的主谓形穿透。
  /\b(?:I|me|my|we|us|our|you|your|one|anyone|each\s+person|every\s+member|the\s+individual|any\s+single\s+member|each\s+member)\s+(?:have|has|bear|carry|face|take on|assume|am under|is under|are under|under)\s+(?:no|little|no\s+real|minimal|no\s+particular)\s+(?:obligation|obligations|duty|duties|responsibility|expectation|expectations|requirement|requirements|onus|commitment|compulsion)\s+to\s+(?:\w+\s+){0,2}?(?:contribute|participate|chip in|pay|donate|do\s+my\s+part|act|help|volunteer|join|show\s+up|bother|get\s+involved|pay in)\b/i,
  // ③-f 介入替代断言族（r299 新增）：(someone else|somebody else|others?|everyone else|other members|other people|the others|the rest|the group|the team|the community|the government|the state|the authorities|the system|the institution) × (will|would|can|could|shall|should|always|surely|certainly|eventually|inevitably|no doubt) × (step in|step up|take over|take care|handle it|do the work|do it|do the job|fix it|sort it|sort it out|pick up the slack|take the lead|lead|organize|manage|deal with it|take charge|cover for|cover it|fill the gap|fill in|step forward|come forward) × 可选 × (so|thus|therefore|which means|meaning|hence|and so)
  //    缺口实证："Someone else will step in and do the work" 整句穿透——既有族要求「别人会做 × 所以我不做」双段共现，
  //    收不到只有「别人会代劳」单段、退出意涵由语义承担的形态。
  /\b(?:someone\s+else|somebody\s+else|others?|everyone\s+else|other\s+(?:members|people|residents|contributors|tenants)|the\s+others|the\s+rest|the\s+group|the\s+team|the\s+community|the\s+government|the\s+state|the\s+authorities|the\s+system|the\s+institution)\s+(?:will|would|can|could|shall|should|always|surely|certainly|eventually|inevitably|no\s+doubt)\s+(?:\w+\s+){0,2}?(?:step\s+in|step\s+up|take\s+over|take\s+care|handle|do\s+the\s+work|do\s+it|do\s+the\s+job|fix\s+it|sort\s+it|sort\s+it\s+out|pick\s+up\s+the\s+slack|take\s+the\s+lead|lead|organize|manage|deal\s+with\s+it|take\s+charge|cover\s+for|cover\s+it|fill\s+the\s+gap|fill\s+in|step\s+forward|come\s+forward)\b/i,
];

// ─── 双腿距离窗 ───────────────────────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 纠偏豁免：针对性防范/克服短句（解药句，整条豁免）──────────
const ANTIDOTE_ZH = /(?:防止|避免|克服|纠正|警惕|防范|应对|缓解|规避)[^。，！？；\n]{0,8}(?:逆选择|道德风险|搭便车|免费搭车|搭顺风车)/;
const ANTIDOTE_EN = /\b(?:guard against|beware of|watch (?:out )?for|mitigate|address|prevent|avoid|combat)\s+(?:the\s+)?(?:adverse selection|moral hazard|free[- ]rid(?:er|ing))\b/i;

// ─── 翻转短语（说话者在纠正该推理——腿②不计）──────────────────
// 腿②自身含「不会/没有」类否认词（那正是攻击形态），故不用通用
// 否定守卫，只拦「不等于/并非/不能说/未必」类整体翻转。
const FLIP_BEFORE_ZH = /(?:不等于|并非|不能说|并不能|不说明|证明不了|说明不了|未必|不见得|谈不上|不可说|别说|不要以为|别以为|不是说|难道)[^。，！？；\n]{0,6}$/;
const FLIP_BEFORE_EN = /(?:not that|far from|not to say|hardly|it is false|it'?s wrong|guard against|beware of|watch out)\s+(?:\w+\s+){0,4}$/i;

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

// 腿②匹配是否被翻转短语修饰（仅查匹配前窗口，不查 span 内部——
// span 内部的「不会/没有」是本族攻击形态本身）
function flipAlive(text, x) {
  const before = text.slice(Math.max(0, x.idx - 10), x.idx);
  if (FLIP_BEFORE_ZH.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 60), x.idx);
  return !FLIP_BEFORE_EN.test(beforeEn);
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

// 收集某语言侧两腿的全部有效匹配（注入值非数组时按空处理——
// 负例注入可用 /(?!)/ 或 [] 两种形态关闭某组腿）
function collectLegs(text, aList, bList) {
  const am = [], bm = [];
  const A = Array.isArray(aList) ? aList : [];
  const B = Array.isArray(bList) ? bList : [];
  for (const re of A) for (const x of allMatches(re, text)) am.push(x);
  for (const re of B) for (const x of allMatches(re, text)) {
    if (flipAlive(text, x)) bm.push(x);
  }
  return { am: dedupeOverlap(am), bm: dedupeOverlap(bm) };
}

// 距离（不相邻区间间距；重叠返回 0）
function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

/**
 * 通用两腿配对：腿①语境锚点 × 腿②断言，落在窗内即成一签名。
 */
function findSignatures(text, R, keys) {
  const sigs = [];
  const langs = [
    { a: R[keys.aZH] || keys.defA, b: R[keys.bZH] || keys.defB, win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh' },
    { a: R[keys.aEN] || keys.defA_EN, b: R[keys.bEN] || keys.defB_EN, win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en' },
  ];
  for (const { a, b, win, lang } of langs) {
    const { am, bm } = collectLegs(text, a, b);
    for (const x of am) {
      let best = null;
      for (const y of bm) {
        const d = dist(x, y);
        if (d > win) continue;
        if (!best || d < best.d) best = { d, y };
      }
      if (best) sigs.push({ lang, anchor: x.raw, claim: best.y.raw, dist: best.d });
    }
  }
  return sigs;
}

// 组装维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
function pack(sigs, dimension, labelZh, labelEn, guidance, tags) {
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };
  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension,
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '「' + x.anchor + '」×「' + x.claim + '」'
      : '"' + x.anchor + '" x "' + x.claim + '"')),
    details: s.lang === 'zh'
      ? labelZh + '(' + sigs.length + '处: 「' + s.anchor + '」语境 ×「' + s.claim + '」无扭曲断言)(zh)'
      : labelEn + '(' + sigs.length + 'x: "' + s.anchor + '" context x "' + s.claim + '" no-distortion assertion)(en)',
    guidance,
    tags,
  };
}

const EMPTY = { hit: false, score: 0, detail: '', count: 0 };

// ─── 子族① adverse_selection ─────────────────────────────────
function detectAdverseSelection(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return EMPTY;
  const R = inject || {};
  if ((R.ANTIDOTE_ZH || ANTIDOTE_ZH).test(text) || (R.ANTIDOTE_EN || ANTIDOTE_EN).test(text)) return EMPTY;
  const sigs = findSignatures(text, R, {
    aZH: 'POOL_ZH', aEN: 'POOL_EN', bZH: 'NODISTORT_ZH', bEN: 'NODISTORT_EN',
    defA: POOL_ZH, defA_EN: POOL_EN, defB: NODISTORT_ZH, defB_EN: NODISTORT_EN,
  });
  return pack(sigs, 'adverse_selection', '逆选择忽视', 'adverse selection blind spot',
    '不要把风险池/信贷池的自我筛选当成「自然均衡」：保险池按私有风险自我排序——高危人群更愿意投保、低危人群倾向退出，池子劣化会推高保费（保险池自然会同时吸引低风险和高风险的人，这对保费没有影响、贷款会自然覆盖各种信用等级的借款人所以坏账率不会有差别 / insurance pools naturally attract a balanced mix of low and high risk people so premiums stay stable、loans naturally reach borrowers of every credit grade so defaults will not differ）。私有信息不可直接观测时，「池子看起来均衡」本身就是逆选择的结果而非反证。请先核实池子的实际风险分布与保费/利率的风险调整是否匹配、高低风险人群的参与率差异、有无免赔额/核保/征信等筛选机制，再决定是否采信「没有影响」类结论；正确表述是「需按风险分层定价与核保，否则池子劣化」。',
    ['economics', 'information-economics', 'adverse-selection', 'lemons', 'insurance', 'credit']);
}

// ─── 子族② moral_hazard ──────────────────────────────────────
function detectMoralHazard(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return EMPTY;
  const R = inject || {};
  if ((R.ANTIDOTE_ZH || ANTIDOTE_ZH).test(text) || (R.ANTIDOTE_EN || ANTIDOTE_EN).test(text)) return EMPTY;
  const sigs = findSignatures(text, R, {
    aZH: 'SHIELD_ZH', aEN: 'SHIELD_EN', bZH: 'NOCHANGE_ZH', bEN: 'NOCHANGE_EN',
    defA: SHIELD_ZH, defA_EN: SHIELD_EN, defB: NOCHANGE_ZH, defB_EN: NOCHANGE_EN,
  });
  return pack(sigs, 'moral_hazard', '道德风险忽视', 'moral hazard blind spot',
    '不要把兜底/保障当成行为中性的背景：全额赔付、担保、救助会改变被兜底一方的风险承担——行动不可完全观测时，风险从决策者转移给兜底方，冒险、松懈、过度用药、加杠杆都是理性反应（全额兜底不会让机构去承担更多风险、有了全额保险人们开车不会有什么变化 / full insurance coverage does not change how carefully people drive、bailouts will not affect future risk-taking）。「行为不变」在隐藏行动场景里恰恰是最不可能的假设。请先核实兜底覆盖范围与免责条款、被兜底方的风险暴露变化、免赔额/共付/监管等对冲设计，再决定是否采信「不会改变」类结论；正确表述是「兜底必须配行为约束，否则风险行为被系统性激励」。',
    ['economics', 'information-economics', 'moral-hazard', 'insurance', 'bailout', 'incentives']);
}

// ─── 子族③ free_rider ────────────────────────────────────────
function detectFreeRider(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return EMPTY;
  const R = inject || {};
  if ((R.ANTIDOTE_ZH || ANTIDOTE_ZH).test(text) || (R.ANTIDOTE_EN || ANTIDOTE_EN).test(text)) return EMPTY;
  const sigs = findSignatures(text, R, {
    aZH: 'COLLECTIVE_ZH', aEN: 'COLLECTIVE_EN', bZH: 'ABSTAIN_ZH', bEN: 'ABSTAIN_EN',
    defA: COLLECTIVE_ZH, defA_EN: COLLECTIVE_EN, defB: ABSTAIN_ZH, defB_EN: ABSTAIN_EN,
  });
  return pack(sigs, 'free_rider', '搭便车盲区', 'free-rider blind spot',
    '不要把集体行动当成自动实现的背景：公共品非排他，个体贡献的好处人人有份、成本自己独扛——「总会有人管」「别人会出钱」对每个个体同时成立时，结果是谁都不管（公共事务总会有人站出来管，我个人不用参与、别人会捐款的，我不用掏钱 / someone else will always contribute to the public good so I don\'t need to do my part）。把「别人会做」当作自己不做的理由，正是公共品供给不足的微观机制。请先核实贡献的可观测性、历史上同类公共品的实际供给水平、有无选择性激励（定向补贴/荣誉/准入）与强制分摊机制，再决定是否采信退出式结论；正确表述是「公共品供给需要选择性激励或强制分摊，不能指望自发参与」。',
    ['economics', 'collective-action', 'free-rider', 'public-goods', 'cooperation']);
}

// ─── 合并入口（三子族并跑，取首个命中；供未来单键 gate 接线）──
function detectIncentiveBlindSpot(text, inject) {
  const subs = [detectAdverseSelection, detectMoralHazard, detectFreeRider];
  let best = null;
  for (const fn of subs) {
    const r = fn(text, inject);
    if (r && r.hit && (!best || r.score > best.score)) best = r;
  }
  return best || EMPTY;
}

module.exports = {
  detectAdverseSelection,
  detectMoralHazard,
  detectFreeRider,
  detectIncentiveBlindSpot,
  __internals: () => ({
    POOL_ZH, POOL_EN, NODISTORT_ZH, NODISTORT_EN,
    SHIELD_ZH, SHIELD_EN, NOCHANGE_ZH, NOCHANGE_EN,
    COLLECTIVE_ZH, COLLECTIVE_EN, ABSTAIN_ZH, ABSTAIN_EN,
    ANTIDOTE_ZH, ANTIDOTE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
