/**
 * src/self-selection-bias.js — 「自选择偏差」检测器
 * （provisional 第 241 个判别维度，r253 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r253-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r252：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect/peak_end_rule/law_of_small_numbers/prosecutors_fallacy/
 * inverse_gamblers_fallacy/count_rate_conflation/significance_effect_size/
 * loss_aversion/selection_on_dependent_variable 二十七个已起草未接线
 * 维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r253 立项] 零命中探针 coordination/agent4/probes/r253-probe-round1.js
 * ~round2.js（v6.8.145，hf.gate() 全量 findings 口径，过滤
 * {dimension:'none'} 哨兵）。五候选两轮定夺：
 *   · A 货币错觉：攻击穿透 5/8，3 条被 perfect_error/pseudo_causal 代拦；
 *   · B 计划谬误：攻击穿透 4/8，且「加把劲肯定能行」与正当动员话语同形；
 *   · C 零和偏误：攻击穿透 3/8，且固定资源场景（奖金池/名额/拍卖）与本族
 *     攻击句结构同形，纯规则无法稳定区分「规则决定的零和」与「零和假设」；
 *   · **D 自选择偏差：攻击穿透 7/8（round1）→ 11/15（round2，4 条被
 *     fallacies/pseudo_causal/confidence 无关维度代拦，非本族领地），
 *     疑难良性维度级误伤 1/10 且来自既有维度（stereotype）而非本族判据**；
 *   · E 多重比较谬误：攻击穿透 4/7，与 clustering_illusion 领地交叉。
 * D 以「最高穿透 + 邻接领地既有维度守界 + 对共享误拦基线冲击最小」胜出。
 *
 * 外部来源：arXiv 查询 parse-fail（Rate exceeded）、GitHub 多词查询
 * total_count=0、Semantic Scholar 限流空返——**空返，按既有形态自建**，
 * 不编造命中。判据为心虫自有纯规则实现，家族定义取自统计学/计量经济学
 * 对自选择偏差（self-selection bias / volunteer bias）的标准表述：
 * 参与者自行决定是否进入处理组时，组间差异在干预之前就已存在，
 * 结果差异不能直接归因于处理本身。
 *
 * 辨别的族：自选择偏差 / 自选组效果归因（self-selection bias）——文本先
 * 指出某个群体是**自行选择进入**某项目/工具/服务的，再据此**把结果
 * 差异归因于该项目/工具/服务本身**：
 *   报名我们课程的同学收入都涨了，所以课程有效。
 *   自愿参加培训的员工绩效都更好，说明培训能提升绩效。
 *   选择使用新工具的团队交付速度都更快，所以新工具提高了效率。
 *   用户自己勾选了高级套餐，他们的满意度就是更高，所以高级套餐更让人满意。
 *   Employees who volunteered for the training performed better, so the
 *   training improves performance.
 *   Firms that opted in to our program renewed at 90%, so the program
 *   drives retention.
 *   Readers who signed up for the challenge read more books, so the
 *   challenge boosts reading.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：自选择把「谁
 * 选择进入」和「处理有没有效」混成了一件事。自行报名的人本来就更有
 * 动机、更急迫、更有资源；他们的事后差异是选择效应与处理效应的叠加，
 * 直接归因于处理等于用一把刻度错的尺子量药效。它比虚报数字更隐蔽：
 * 数字可以完全真实（续费率真的高达九成），归因可以完全错误。现实危害
 * 很直接：一个没用的课程因为报名者自驱而被判有效并大规模采购；一个
 * 有副作用的手术因为患者自选而被判安全；一个无效的政策因为参与者
 * 自选择而获得续费拨款。与正当推理的界线很清楚：一旦给出对照组/
 * 随机分组/倾向得分等口径，或明确指出这是自选择在起作用，就是正当
 * 做法，一律豁免。
 *
 * 与既有维度的边界（r253 归因，探针邻接领地实测记录）：
 *   · survivorship_bias（第 132 维）管**只看幸存样本**（「坚持到最后
 *     的用户都给了好评」）；本族判据腿是**自行选择进入**，不要求
 *     「坚持/幸存」过程（邻接句实测被 fallacies 代拦，非本族领地）。
 *   · selection_on_dependent_variable（provisional 240，r252 草稿）管
 *     **以结果为条件反推原因**（「活到九十岁的老人都早起，所以早起
 *     能让人长寿」）；本族判据腿是**自选进入动作**（自愿/主动/报名/
 *     opt-in），不以结果为条件（邻接句实测穿透，归其家族）。
 *   · selection_bias（第 168 维）管**抽样偏误**；本族判据是自选机制
 *     × 效果归因双腿，不涉抽样框。
 *   · fallacies / hasty_generalization 管**泛化与证据不足**；本族判据
 *     是两条具体腿（自选进入 × 处理归因）+ 邻近共现，不依赖语气。
 *   · collider_bias（第 209 维）管**对撞分层**；本族不涉对撞结构
 *     （邻接句「随机分组的用药组存活率更高」实测由其代拦）。
 *
 * 判据（双腿链 + 邻近窗 + 两组豁免，缺一不判）：
 *   ① 腿① SELF 自选进入陈述——六族任一（详见下方常量）：
 *     自愿/主动+进入动词、报名/申请+人群名词、被动吸引来的、
 *     「自己」+进入动词、EN who volunteered/chose/opted in/signed up/
 *     selected/sought/picked、EN 主语+自选动词；
 *   ② 腿② CAUSE 效果归因结论——三族任一：
 *     E1a 推断标记+因果动词（能/让/使/导致/带来/促进/提升/改善/
 *     帮助/拉动/驱动/带动）、E1b 推断标记+处理名词+效果词（有效/
 *     有用/管用/见效/成功/更/最/好/高/强/满意/受欢迎/精准/靠谱/
 *     值得）、E2b 推断标记+我们/它+是+最好/更优/更强；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 140 字符），**方向不限**——
 *     「报名的人都涨了，所以课程有效」与「课程有效，因为报名的人
 *     都涨了」都收；推断标记落在两腿之间则加权而非必要；
 *   ④ 两腿均查否定前缀（「并不是报名的人」「不能说明课程有效」→
 *     失配）；
 *   ⑤ 豁免 A 概念教学（自选择偏差/自我选择/选择偏差/选择效应/
 *     内生性/志愿者偏误/self-selection/volunteer bias/selection
 *     bias/endogeneity/selection effect——讨论这个概念本身是正确
 *     判别）；
 *   ⑥ 豁免 B 正确因果口径（随机分组/随机分配/对照组/控制组/对照
 *     实验/双重差分/倾向得分/需要对比/不能归因/不能就此断定/相关
 *     不等于因果/可能只是/未必/不能直接归因/混交/混淆因素；
 *     EN randomized/randomly assigned/control group/comparison
 *     group/need a controlled comparison/cannot conclude/not
 *     necessarily/may reflect/could reflect/selection rather than/
 *     confounded/randomization——给出对照组或明言选择效应是正当
 *     做法）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次分组事实（「自愿参加
 * 的人绩效更好」是事实陈述），也可能是在引用统计学案例。verify 的
 * 语义是「这段话拿自选组的差异推导出了处理有效，先按对照组口径重
 *     新框定，再决定是否采信它的结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（自选择偏差告诉我们/self-selection bias means）；
 *   · 正确因果口径（随机分组/对照组/需要对比/不能就此断定）；
 *   · 单腿句（只有自选进入无归因结论、只有「课程有效」无自选组）；
 *   · 指派进入（公司统一安排/assigned）——非自选，归他因；
 *   · survivorship_bias / selection_on_dependent_variable /
 *     selection_bias / collider_bias 领地。
 * 已知缺口（有意不收）：无归因结论的纯分组观察（「自愿参加的人绩效
 * 更好」单独成句是事实陈述）；以及把自选组差异说成事实并给出正确
 * 动作的句子（「报名的人收入更高，但我们需要对照组」）——前者缺归
 * 因腿、后者是正当做法，纯规则无法在不误伤的前提下收窄，宁缺勿滥。
 */
'use strict';

// ─── 腿① SELF 自选进入陈述 ────────────────────────────────────────
// S1 自愿/主动/自发/自行 + 进入动词
const SELF_VOLUNTARY_ZH = [
  /(?:自愿|主动|自发|自行|自愿报名|主动请缨)[^。，！？；\n]{0,14}(?:参加|报名|加入|参与|选择|选用|使用|订阅|购买|申请|投入|投身|接龙|请缨|走[上到])/,
  // S1b 裸自选动词 + 的 + 人群名词（「选择使用新工具的团队」「参加早鸟计划的商家」
  // 「订阅了newsletter的读者」「用我们App的用户」——自行选择进入本身即自选机制）
  /(?:选择|选用|采用|采纳|参加|加入|购买|订阅|购入|使用|用|用了)[^。，！？；\n]{0,14}的(?:人群|用户|客户|团队|企业|商家|学员|学生|读者|成员|家庭|患者|公司|人|选手|程序员|家长|观众|买家|顾客|开发者|患者|病人|学员|粉丝)/,
  // S2 报名/申请 + 人群名词（报名本身就是自选动作）
  /(?:报名|报班|报了名|申请|投递了申请|递交申请|应聘|投了简历|走了后门|托关系)[^。，！？；\n]{0,16}(?:的|者|过来)?[^。，！？；\n]{0,4}(?:人|学员|学生|员工|客户|用户|商家|家庭|孩子|读者|患者|成员|选手|程序员|企业|公司|团队|同学|观众|粉丝|家长|病人|顾客|买家)/,
  // S3 被动吸引来的（被广告/口碑吸引来 = 自选进入漏斗）
  /(?:被|受)[^。，！？；\n]{0,16}(?:吸引|打动|说动|安利|推荐|种草|忽悠|广告)[^。，！？；\n]{0,6}(?:来|过来|来的)/,
  // S4 「自己」+ 进入动词（主语自选动作句）
  /(?:用户|客户|读者|学生|员工|患者|家长|观众|买家|成员|大家|人们|他们)[^。，！？；\n]{0,6}自己[^。，！？；\n]{0,6}(?:报名|选择|勾选|订阅|购买|加入|申请|找来|找上门|决定|选用)/,
  /自己[^。，！？；\n]{0,4}(?:报名|选择|勾选|订阅|购买|加入|申请|找来|找上门|选用|接龙)/,
  // S5 慕名/主动上门
  /(?:慕名|主动|自己|纷纷)[^。，！？；\n]{0,4}(?:找来|找上门|上门|涌来|加入|报名|参与|购买)/,
  // S6 来 + 目的 + 的 + 人群名词（「来我们医院看病的患者」——自行前来）
  /来[^。，！？；\n]{0,12}(?:看病|就诊|咨询|报名|参加|购买|使用|学习|上课|咨询)[^。，！？；\n]{0,2}的(?:人群|用户|客户|团队|企业|商家|学员|学生|读者|成员|家庭|患者|公司|人|选手|程序员|家长|观众|买家|顾客|病人)/,
];

// EN：who/that + 自选动词；主语 + 自选动词
const SELF_EN = [
  /\b(?:who|that)\s+(?:volunteered?|chose|chosen|opted\s+(?:in|into)|signed\s+up(?:\s+for)?|enrolled|applied|selected|picked|sought|subscribed|elected|self[-\s]?selected)\b/i,
  /\b(?:customers?|users?|readers?|employees?|teams?|firms?|students?|patients?|companies|people|consumers?|subscribers?|participants?|members|clients|shoppers?|players|workers|staff)\s+(?:who\s+)?(?:chose|chosen|opted|volunteered|selected|picked|sought|subscribed|applied|signed)\b/i,
];

// ─── 腿② CAUSE 效果归因结论 ───────────────────────────────────────
// E1a 推断标记 + 因果动词（能/让/使/导致/带来/促进/提升/改善/帮助…）
const CAUSE_CMP_ZH = [
  /(?:所以|因此|因而|于是|可见|足见|说明|证明|意味着|足以证明|足以表明|表明|显然|毫无疑问|事实证明|果然|自然|足见|也就是说)[^。，！？；\n]{0,20}(?:能|让|使|使得|导致|带来|促进|提升|拉动|提高|改善|治好|拯救|挽救|帮助|驱动|带动|带来)/,
];
// E1b 推断标记 + 处理名词 + 效果词（有效/有用/管用/见效/成功/更/最/好/高/强/满意/受欢迎/精准/靠谱/值得）
const CAUSE_TREAT_ZH = [
  /(?:所以|因此|因而|于是|可见|足见|说明|证明|意味着|足以证明|足以表明|表明|显然|毫无疑问|事实证明|果然|自然|足见|也就是说)[^。，！？；\n]{0,10}(?:课程|培训|训练营|训练|项目|产品|服务|工具|软件|App|app|计划|方案|活动|方法|疗法|手术|药|诊所|医院|广告|套餐|挑战赛|班|营|教程|制度|政策|机制|平台|频道|社群|俱乐部|咨询|教练|团队|机构|学校|公司|食谱|方案|习惯|打卡|订阅|计划|功能|版本|系统|模式|打法|策略|打法|计划)[^。，！？；\n]{0,4}(?:有效|有用|管用|起作用|见效|成功|更|最|好|高|强|满意|受欢迎|吃香|划算|靠谱|值得|精准|准|值|灵|灵验|可行|靠谱)/,
];
// E2b 推断标记 + 我们/它/这 + （系词可选）+ 最高级/效价（「所以我们是这一带最好的」
// 「说明我们医术好」——系词可省）
const CAUSE_SUPER_ZH = [
  /(?:所以|因此|因而|可见|足见|说明|证明|显然|毫无疑问|事实证明|果然|自然)[^。，！？；\n]{0,10}(?:我们|它|这|那|他们|咱们)[^。，！？；\n]{0,8}(?:是|才是|算|真是|就叫)?[^。，！？；\n]{0,4}(?:最好|最优|最强|更专业|更靠谱|最靠谱|值得|有效|有用|更好|更高|更强|高明|专业|靠谱|厉害|行|好|不错|出色|一流|顶尖|过硬)/,
];

const CAUSE_EN = [
  /\b(?:so|therefore|thus|hence|which\s+(?:proves|shows|means)|that\s+means|this\s+(?:proves|shows|means)|consequently|as\s+a\s+result|meaning)\b[^.]{0,30}\b(?:works?|helps?|helped|improves?|improved|boosts?|boosted|drives?|drove|causes?|caused|leads?\s+to|is\s+what|is\s+the\s+cure|is\s+superior|is\s+effective|makes?|made|increases?|increased|is\s+why|is\s+worth|pays?\s+off|delivers?|delivered|lifts?|lifted|lowers?|lowered|reduces?|reduced|raises?|raised|saves?|saved|fixed|fixes)/i,
  /\b(?:so|therefore|thus|which\s+(?:proves|shows))\b[^.]{0,40}\b(?:we|it|this|they)\s+(?:are|is)\s+(?:the\s+best|superior|better|more\s+effective|worth\s+it|the\s+top|the\s+leading)/i,
];

// ─── 独腿签名（SOLO）——自选进入 × 自证效果在一句话内融合 ──────────
const SOLO_ZH = [
  // Z1 自选组自证效果：「报名的人都反馈有用/有效」
  /(?:报名|报班|自愿参加|主动加入|主动选择|自己报名|选择使用|订阅了|购买了)[^。！？\n]{0,18}(?:的|者)[^。！？\n]{0,4}(?:人|学员|学生|员工|客户|用户|读者|患者|家庭|商家|成员|家长|同学)[^。！？\n]{0,14}(?:都|纷纷|普遍|几乎)[^。！？\n]{0,10}(?:说|表示|反馈|称赞|好评|夸|点赞|评价)[^。！？\n]{0,14}(?:有用|有效|值得|靠谱|管用|效果好|值|灵|灵验|来对了|选对了)/,
  // Z2 自选组留存自证：「自愿参加的人留下来的都认可这个项目」
  /(?:自愿|主动|自己)[^。！？\n]{0,8}(?:参加|加入|使用|选择|报名|购买)[^。！？\n]{0,18}(?:留下来|留存|续费|复购|没走|还在用|继续用)[^。！？\n]{0,8}(?:的)?(?:都|大多|基本上|基本)[^。！？\n]{0,10}(?:认可|喜欢|满意|说好|称赞|点赞|认同|肯定)/,
  // Z3 无差评自证：「报了名的人都没有后悔/中途退出」
  /(?:报名|报了名|自愿参加|主动加入|选择使用|订阅了)[^。！？\n]{0,18}(?:的人|学员|用户|客户|学生|成员|家长)[^。！？\n]{0,14}(?:都|几乎|基本)[^。！？\n]{0,4}(?:不|没|没有)[^。！？\n]{0,6}(?:后悔|失望|差评|中途退出|放弃|退款|吐槽|抱怨)/,
];
const SOLO_EN = [
  /\b(?:participants?|users?|customers?|students?|readers?|employees?|patients?|members|subscribers?)\s+who\s+(?:chose|opted|volunteered|signed\s+up|selected|picked|enrolled)\b[^.]{0,70}\b(?:all|mostly|overwhelmingly|nearly\s+all)\b[^.]{0,25}\b(?:say|said|report|reported|agree|agreed|feel|felt|praise|praised|rated)\b[^.]{0,25}\b(?:it|this|the\s+\w+)\s+(?:works?|helped|is\s+worth|is\s+valuable|changed\s+everything|is\s+effective)/i,
  /\b(?:those|the\s+ones)\s+who\s+(?:chose|opted|volunteered|signed\s+up|picked|selected|enrolled)\b[^.]{0,70}\b(?:stayed|stuck\s+with|renewed|kept\s+using|continued|remained)\b[^.]{0,30}\b(?:because|since)\b[^.]{0,30}\b(?:it|they)\s+(?:works?|liked|loved|valued|believed)/i,
  /\bnobody\s+who\s+(?:signed\s+up|volunteered|opted\s+in|chose|enrolled|applied)\b[^.]{0,50}\b(?:regrets?|regretted|complained|quit|left|refunded)/i,
];

// ─── 推断标记（落在两腿之间则加权，非必要）────────────────────────
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|因而|于是|结果就是|结论就是|显而易见|足见|充分说明|充分证明|足以表明|足以证明|显然|果然|也就是说)/;
const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|which\s+proves|that\s+means|proves|shows\s+that|indicates\s+that|means\s+that|it\s+follows|this\s+shows|this\s+proves|consequently|as\s+a\s+result)\b/i;

// ─── 距离窗 ───────────────────────────────────────────────────────
const W_ZH = 60;
const W_EN = 140;

// ─── 豁免 A：概念教学（点名自选择偏差这个概念本身）─────────────────
const CONCEPT_ZH = /(?:自选择偏差|自我选择偏差|自选择效应|选择偏差|选择偏误|选择效应|内生性|志愿者偏误|自愿者偏误|自选择问题|选择性偏差|样本选择|自选择理论|计量经济|回归分析|因果推断|统计学|心理学(?:里|中|上|家|教材)|教材|课堂|课本|教学|论文|这篇研究|这项研究|教科书)/;
const CONCEPT_EN = /\b(?:self[-\s]?selection\s+bias|volunteer\s+bias|selection\s+bias|selection\s+effect|endogeneity|endogenous|self[-\s]?selection\s+problem|self[-\s]?selection\s+effect|causal\s+inference|econometrics|statistics\s+(?:textbook|course|class)|textbook|lecture|paper|study\s+found|research\s+shows|selection\s+rather\s+than)\b/i;

// ─── 豁免 B：正确因果口径（对照组/随机化/明言选择效应）─────────────
const CORRECTIVE_ZH = /(?:随机分组|随机分配|随机对照|随机实验|随机分流|随机化|对照组|控制组|对比组|对照实验|控制实验|双重差分|倾向得分|匹配方法|需要对比|需要对照|加以对照|横向对比|对比才能|才能归因|不能归因|不能就此|不能直接归因|不足以说明|说明不了|证明不了|不等于|相关不等于因果|可能只是|可能恰恰|未必|未必是|不能推出|推不出|混淆|混交|混杂因素|自选择|选择偏误|选择偏差|基线差异|组间差异|本来就|事前差异|差异在先|先有差异|需要验证|再做实验|重新设计|改进实验)/;
const CORRECTIVE_EN = /\b(?:randomi[sz]ed|randomly\s+assigned|random\s+assignment|control\s+group|comparison\s+group|treatment\s+group\s+and\s+control|need\s+a\s+controlled|cannot\s+conclude|can'?t\s+conclude|not\s+necessarily|may\s+reflect|could\s+reflect|might\s+reflect|selection\s+rather\s+than|confounded|confounding|self[-\s]?selection|pre[-\s]?existing\s+difference|baseline\s+difference|groups\s+differed\s+before|before\s+the\s+treatment|not\s+causal|does\s+not\s+establish|fails\s+to\s+establish|need\s+an?\s+experiment|rerun\s+with|redo\s+with|matched\s+groups|propensity)/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|不再|别|并不|并没|从未|绝非|而非)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|谈不上|从不|绝不|永不|坚决不|并不|并没|而非|而不是|绝非|并非如此|说不上|称不上|没有人|没人|并不曾|未曾)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b|\bnot\s+always\b|\bnot\s+all\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s){0,4}$/i;

function matchAlive(text, x, useNeg, skipInside) {
  if (!useNeg) return true;
  if (!skipInside && (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw))) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  // 「主动/自愿」类自选动词前缀常带「并不」——「并不主动」是对自选的否定，
  // 但「报名」本身无否定语义，SHORT_NEG 只在前置 8 字内查。
  if (!ababForm && !/别提多?$/.test(before) && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 同跨度去重（跨族重叠留给配对循环的「防自证」判据处理）
function dedupeExact(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = x.idx + ':' + x.end;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, false)) m.push(x);
  }
  return dedupeExact(m);
}

// 归因腿专用：只查匹配点**之前**的否定前缀，不查模式内部的否定词——
// 效果词族自身含「没有效果」式内在否定的句子由前置守卫处理。
function collectCause(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, true, true)) m.push(x);
  }
  return dedupeExact(m);
}

function collectSolo(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, true, true)) m.push(x);
  }
  return dedupeExact(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 签名收集：腿①自选进入 × 腿②效果归因，两腿邻近共现
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      self: [
        ...(R.SELF_VOLUNTARY_ZH || SELF_VOLUNTARY_ZH),
      ],
      cause: [
        ...(R.CAUSE_CMP_ZH || CAUSE_CMP_ZH),
        ...(R.CAUSE_TREAT_ZH || CAUSE_TREAT_ZH),
        ...(R.CAUSE_SUPER_ZH || CAUSE_SUPER_ZH),
      ],
      infer: R.INFER_ZH || INFER_ZH,
      w: R.W_ZH != null ? R.W_ZH : W_ZH,
      lang: 'zh',
    },
    {
      self: R.SELF_EN || SELF_EN,
      cause: R.CAUSE_EN || CAUSE_EN,
      infer: R.INFER_EN || INFER_EN,
      w: R.W_EN != null ? R.W_EN : W_EN,
      lang: 'en',
    },
  ];
  // 独腿签名：一句话内部自带完整自选择结构，单独成支（承重证明见
  // test/self-selection-bias.test.js 负例注入 Z1/Z2/Z3 与 EN 对应族）
  const soloZh = collectSolo(text, R.SOLO_ZH || SOLO_ZH);
  const soloEn = collectSolo(text, R.SOLO_EN || SOLO_EN);
  for (const x of soloZh) sigs.push({ lang: 'zh', self: x.raw, cause: '', infer: '', solo: true });
  for (const x of soloEn) sigs.push({ lang: 'en', self: x.raw, cause: '', infer: '', solo: true });
  for (const L of langs) {
    const selfM = collect(text, L.self, true);
    if (selfM.length === 0) continue;
    const causeM = collectCause(text, L.cause);
    if (causeM.length === 0) continue;
    const inferM = allMatches(L.infer, text);
    for (const a of selfM) {
      for (const v of causeM) {
        if (dist(a, v) > L.w) continue;
        // 防自证：归因腿必须在自选腿之外**带来新内容**（左伸或右伸至少
        // 2 字）——同一段话不能既当「自选进入」又当「效果归因」；但
        // 「报名的人都涨了，所以课程有效」里 CAUSE 从「所以」起笔并
        // 右伸到课程有效，以及「课程有效，因为报名的人收入都涨了」的
        // 倒装，都是真双腿。
        const newRight = v.end > a.end ? v.end - Math.max(v.idx, a.end) : 0;
        const newLeft = v.idx < a.idx ? Math.min(v.end, a.idx) - v.idx : 0;
        if (newRight < 2 && newLeft < 2) continue;
        const between = inferM.find(x => (x.idx >= a.end && x.end <= v.idx) || (x.idx >= v.end && x.end <= a.idx));
        sigs.push({ lang: L.lang, self: a.raw, cause: v.raw, infer: between ? between.raw : '' });
      }
    }
  }
  // 签名按「语言 × 自选腿原文 × 归因腿原文」去重，避免跨族重叠把一处
  // 证据算成多处（count 参与档位判定，必须诚实）。
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.self + '|' + s.cause;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 自选择偏差签名：自选进入群体 × 效果归因结论 邻近共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectSelfSelectionBias(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论自选择偏差这个概念本身）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确因果口径（对照组/随机化/明言选择效应）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'self_selection_bias',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? (x.solo ? '自选自证「' + x.self + '」' : '自选进入「' + x.self + '」→ 效果归因「' + x.cause + '」' + (x.infer ? '（推断标记「' + x.infer + '」）' : ''))
      : (x.solo ? 'self-proving selection \"' + x.self + '\"' : 'self-selected \"' + x.self + '\" -> effect attribution \"' + x.cause + '\"' + (x.infer ? ' (via \"' + x.infer + '\")' : '')))),
    details: s.lang === 'zh'
      ? (s.solo
        ? '自选择偏差(' + sigs.length + '处: 自选组自证效果「' + s.self + '」，缺对照组/随机化口径)(zh)'
        : '自选择偏差(' + sigs.length + '处: 拿「' + s.self + '」的自选组差异推出「' + s.cause + '」，缺对照组/随机化口径)(zh)')
      : (s.solo
        ? 'self-selection-bias(' + sigs.length + 'x: self-proving selection \"' + s.self + '\")(en)'
        : 'self-selection-bias(' + sigs.length + 'x: self-selected \"' + s.self + '\" attributed to the treatment \"' + s.cause + '\")(en)'),
    guidance: '自选择偏差指参与者自行决定是否进入某项目/工具/服务时，组间差异在进入之前就已存在（动机、资源、急迫程度不同），结果差异不能直接归因于项目本身。请按口径重新框定再下结论：给出对照组或未参加者的同口径数据（参加者收入涨了，没参加的人涨了多少）、说明随机分组/倾向得分匹配等识别策略、把「报名的人都涨了」换成「相比可比对照组高出多少」、或明确说出这是自选择在起作用。若这段话只是客观转述一次分组事实（自愿参加的人绩效更好），请把结论限定在事实陈述，不要外推到处理有效。讨论自选择偏差的概念、主动给出对照组设计、说明组间基线差异，都是正当做法；若这段话只是引用统计学案例或他人的谬误示例，核实其主张再决定是否采信。',
    tags: ['statistics', 'self-selection-bias', 'volunteer-bias', 'causal-inference', 'selection-effect', 'endogeneity'],
  };
}

module.exports = {
  detectSelfSelectionBias,
  __internals: () => ({
    SELF_VOLUNTARY_ZH, SELF_EN,
    CAUSE_CMP_ZH, CAUSE_TREAT_ZH, CAUSE_SUPER_ZH, CAUSE_EN,
    SOLO_ZH, SOLO_EN,
    INFER_ZH, INFER_EN, W_ZH, W_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECTIVE_ZH, CORRECTIVE_EN,
  }),
};
