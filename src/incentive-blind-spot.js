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
  // ①-a 保险族（含风险池/保险池专名）
  /(?:保险|投保|保费|参保|保单|承保|理赔|风险池|保险池|资金池)/,
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
];

// 腿② 行为不变断言（中文）
const NOCHANGE_ZH = [
  // ②-a (不会|不能|并不会|并不能|并不|没有|未必)×(可选)×(改变|影响|削弱|放松|动摇|扭曲|刺激|变化)×(可选)×(行为|决策|动机|努力|谨慎|风险偏好)
  /(?:不会|不能|并不会|并不能|并不|没有|未必|不太会|不见得)[^。，！？；\n]{0,10}(?:改变|影响|削弱|放松|动摇|扭曲|刺激|左右|决定|变化)(?:到|起|出|了)?[^。，！？；\n]{0,12}(?:行为|行为方式|决策|决策方式|动机|努力|谨慎|风险偏好|经营方式|管理方式|驾驶习惯|用药习惯|就医行为)/,
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
  // ②-b (no|little|minimal|negligible)×(change|effect|impact)×(on|in)×(behavior|incentives|risk-taking|effort)
  /\b(?:no|little|minimal|negligible)\s+(?:real\s+)?(?:change|effect|impact)\s+(?:on|in|to)\s+(?:\w+\s+){0,3}?(?:behavio(?:u)?r|incentives?|risk[- ]taking|effort|caution|conduct|choices?|decisions?)\b/i,
  // ②-c (does not|won't|will not)×(make|lead|cause|push|drive|push)×(people|firms|banks|companies|borrowers|drivers|agents)×(more)×(reckless|risk-taking|cautious)
  /\b(?:does not|doesn'?t|will not|won'?t|would not|wouldn'?t)\s+(?:make|lead|cause|push|drive|push|tempt)\b[^.]{0,40}\b(?:people|firms?|banks?|companies|borrowers?|drivers?|agents?|managers?|executives?)\b[^.]{0,30}\b(?:more\s+)?(?:reckless|risky|cautious|careless|aggressive|prudent)\b/i,
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
