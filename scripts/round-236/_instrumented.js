/**
 * src/automation-bias.js — 「算法崇拜/自动化偏见」检测器
 * （ provisional 第 219 个判别维度，r231 起草；8 处 src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r231-dimension-agent4.md
 * §五。编号 provisional 的原因同 r228/r229/r230：远端 v6.8.145 已接线
 * 214 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230) 六个已起草未接线维度占号，
 * 最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r231 立项] 零命中探针 coordination/agent4/probes/r231-zerohit-probe.js
 * （v6.8.145 实测）：算法崇拜族 20 句攻击 **12 句完全穿引擎**（pass、
 * findings 为空），另 8 句被 gate 层代拦（4 句 verify 默认需验证、
 * 1 句 instrumental_reasoning、findings 均为空，无任何维度承重本族
 * 语义）；良性 12/12 全 pass。src/ 下没有任何维度判「机器产出 × 不可
 * 质疑性 × 人工核查免除」这一结构——appeal_to_authority 子标签只收
 * 人类权威（[专家教授名人权威]说过/认为），credential_dismissal 管
 * 剥夺人的发言资格（人脑侧），capability_overclaim 管「AI 已彻底
 * 解决 X」的完成态宣称，都不管「判断权让渡给机器」。
 *
 * 外部来源：空返，按既有形态自建。r231 海外扫描（原始证据
 * coordination/agent4/scout/20261106-115445、115500、115530）：
 * arXiv 非引号查询被拆成 OR（返回最新 15 条无一相关）、引号查询
 * 返回 0 字节；GitHub 精确查询 "automation bias" total_count=28，
 * 逐条核实全部为人类被试实验原型（DrXCHEN/Automation-Bias C++ 实验
 * 软件、lucacalzoni/LEMR、Pauls176/automation-bias-prototype 等，
 * ★全为 0，无一是纯规则文本检测模块）；Semantic Scholar 429 限流。
 * 无可集成的纯规则实现。判据为心虫自有纯规则实现（家族定义取自
 * 人因工程经典结论 automation bias：Mosier/Skitka 1996 起，操作员
 * 过度依赖自动化提示而忽略自身证据与反证——心虫只判表述形态，
 * 不判事实真假）。
 *
 * 辨别的族：算法崇拜/自动化偏见（automation bias / algorithm
 * deference / machine-authority deference）——把**算法/模型/系统
 * 的输出**当作不可质疑的最终裁决：机器不会错、不带偏见、比人强，
 * 因此人工复核可以取消、质疑无效、判断权让渡给机器：
 *   AI算出来的结果不会有错，以后这类案子直接按模型的判断来，
 *   不用法官再核。
 *   算法的判断比人脑更客观，人工复核只是走过场，可以取消。
 *   系统给出的信用分是机器算的，机器从不带偏见，客户质疑也没用，
 *   听系统的就行。
 *   这是深度学习模型生成的代码，肯定比人写的靠谱，review环节
 *   可以跳过。
 *   The algorithm computed the risk score, and algorithms don't
 *   have human bias, so there's no need for manual review.
 *   Trust the AI — it never makes mistakes, so we can skip the
 *   human approval step entirely.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：这是把**产出
 * 主体**偷换成**可信度依据**——一个判断是否可信只取决于证据、
 * 方法与可复现性，与它出自人脑还是机器无关。机器产出的错误是
 * 系统性的（训练数据偏差、分布外输入、目标错位），且恰恰因为
 * 它看起来客观而更容易被免除核查。司法量刑、信用评分、医疗
 * 筛查、招聘筛选、代码合并的话术一旦免除人工环节，纠错通道
 * 就被关闭。它与正当的自动化效率论证有明确界线：说明**机器
 * 在什么范围内更准**并给出错误率是帮助，宣布**不用核、听机器
 * 的**是让渡判断权。
 *
 * 与既有维度的边界（r231 归因）：
 *   · appeal_to_authority（fallacies 子标签）管**引人类权威为
 *     证据**（[专家教授名人权威]说过/认为）；本族是机器侧的同一
 *     结构，其子标签正则不含任何机器主体。
 *   · credential_dismissal（第 203 维）管**剥夺人的发言资格**
 *     （没资格批评/不配谈）；本族正好相反，崇拜机器的裁决资格。
 *     两者互为镜像，都不覆盖对方。
 *   · capability_overclaim（overclaim-checker）管「AI 已彻底
 *     解决 X」的**完成态宣称**；本族判的是**判断权的让渡与核查
 *     的免除**，不涉及解决状态。
 *   · instrumental_reasoning（rewrite 级）管把人当工具；实测
 *     「让AI来定赔偿金额，比仲裁员公道」一条被它代拦，属射程
 *     交叠，本模块对交叠样本同样承重（三腿齐备），不冲突。
 *
 * 判据（三腿共现，缺一不判）：
 *   ① 腿① MACHINE 机器权威主体：AI/人工智能/算法/模型/系统/
 *     机器/程序/软件/电脑/计算机/大数据/深度学习/神经网络/引擎/
 *     评分系统/考核系统；EN AI / algorithm / the model / machine
 *     learning / deep learning / neural network / the system /
 *     the software / the engine / big data；
 *   ② 腿② INFALLIBLE 不可错/无偏见/优越性断言：不会错/不会
 *     出错/不会说谎/不带偏见/没有情绪/不会累/从不失误/零误差/
 *     最客观/比人强/比人准/比人脑可靠/人脑比不过；EN can't be
 *     wrong / never makes mistakes / doesn't lie / free from
 *     bias / more accurate than any human / knows best /
 *     infallible / doesn't get tired；
 *   ③ 腿③ DEFERENCE 判断权让渡/免人工核查：不用核/无需核/
 *     取消人工/跳过审核/听…的/照…做/交给…定/让…决定/直接按
 *     模型的…来/申诉无效/别再自己判断；EN no need to check /
 *     skip the human review / just follow it / let the AI
 *     decide / objections are irrelevant / stop second-guessing。
 *   三腿须落在近距离窗内（ZH 80 字 / EN 200 字符）。
 *
 * 为什么取 VERIFY 级：自动化在给出错误率与适用边界的前提下是
 * 正当工具；本族拦的是「机器不会错 + 免除人工」的单边陈述。
 * verify 的含义是「这段文本把判断权让渡给了机器，补齐错误率、
 * 偏差边界与人工兜底再下结论」。
 *
 * 明确不判的（豁免）：
 *   · 认识论纠正（AI也会犯错/不能全信算法/过度依赖系统提示是
 *     自动化偏见/算法可能存在训练数据偏差；EN automation bias
 *     is…/over-reliance/human in the loop）——指出本族错误正是
 *     判别动作本身；
 *   · 人工保留（最终决定权在人/由医生确认/仅供参考/仍需人工
 *     复核/保留人工把关；EN final say rests with/confirmed
 *     by/human oversight）——已把判断权留在人的正确表述；
 *   · 基准事实陈述（实验显示AI读片准确率高于…但漏诊风险仍需
 *     人工复核/错误率3%）——无腿③天然不判；
 *   · 器官与制度系统（神经系统/免疫系统/呼吸系统/消化系统/
 *     生态系统/金融系统/教育系统）——同名不同物，非计算代理。
 */
'use strict';

// ─── 腿① 机器权威主体（计算代理，中文）────────────────────────────
// 注意：「神经系统/免疫系统」等器官制度系统走 EXEMPT_SYSTEM 豁免，
// 此处只收计算代理语义的主体。
const MACHINE_ZH = [
  /\bAI\b/i, /AI(?:算|说|判|定|生成|推荐|预测|筛|审)/i,
  /人工智能/,
  /算法/, /模型/, /系统/, /机器/, /程序/, /软件/,
  /电脑/, /计算机/, /大数据/, /深度学习/, /神经网络/,
  /引擎/, /平台/,
  /(?:自动|智能)(?:评分|打分|筛选|审核|审批|判决|判案|诊断)/,
  /(?:评分|考核|推荐|筛选|决策)(?:系统|引擎|模型|算法|平台)/,
  // r235 补：自动化本身作为权威主体（「自动化比人工快得多」——
  // 原表只收具体系统名，裸「自动化」穿透）
  /自动化/,
  // r235 补：无异议即公正形的隐性主体（「没人对这个结果提出异议」——
  // 句子无机器名词，靠结果/输出族指代被评议的机器产出）
  /结果/, /结论/, /输出/,
];

// ─── 腿① 机器权威主体（英文）─────────────────────────────────────
const MACHINE_EN = [
  /\bAI\b/i, /\bA\.I\.\b/i, /\bartificial intelligence\b/i,
  /\balgorithms?\b/i, /\bthe model\b/i, /\bmachine learning\b/i,
  /\bdeep learning\b/i, /\bneural networks?\b/i,
  /\bthe system\b/i, /\bthe software\b/i, /\bthe engine\b/i,
  /\bthe program\b/i, /\bbig data\b/i,
  /\b(?:scoring|grading|ranking|recommendation|screening)\s+(?:engine|system|algorithm|model)\b/i,
  /\b(?:the\s+)?(?:self-?driving|autonomous)\s+(?:system|software)\b/i,
  // r236 新句式族 D「机器裁决产出物指称」：outcome/result/decision/
  // score/ranking/verdict/output 等机器裁决的产出物名词。r236 实测
  // M3 "No one has objected, so the outcome must be fair"——句中无
  // AI/algorithm/model 等主体词，只有产出物 "the outcome"，导致腿①
  // 0 命中整句漏判。该族语义正是「对某个机器裁决无人异议 ⇒ 裁决公正」，
  // 缺了产出物指称则整族不可达。限定于带定冠词/指示词的裁决产出物，
  // 不收裸 result（避免 "the experiment result" 类非机器产出误入）。
  /\b(?:the|this|that|its|their)\s+(?:outcome|result|results|decision|decisions|score|scores|ranking|rankings|verdict|output|outputs|recommendation|recommendations|assessment|judgment|judgement|ruling|determination)\b/i,
];

// ─── 腿② 不可错/无偏见/优越性断言（中文）─────────────────────────
// 两类：①不可错/无偏见/无疲劳（不会错/不带偏见/不会累/从不失误/
// 零误差）；②对人的优越性（比人强/比人准/人脑比不过/胜过人）。
// 注意与 absolute_claim 的分界：本族要求机器主体共现，泛化的
// 「肯定不会错」不归本族。
const INFALLIBLE_ZH = [
  // 客观性断言形（r234 实测穿透形：「招聘平台的评分是客观的」
  // ——「客观」即机器产出的无偏见宣称，属腿②核心）
  /(?:是|很|最|都|完全|绝对|天然)(?:客观|中立|公正|公允|不偏不倚|毫无偏袒)的/,
  /(?:客观|中立|公正|公允)性(?:的)?(?:保证|裁决|判定|依据|来源|结果|评分|结论)?/,
  // 规模优越性形（r234 实测穿透形：「处理过几百万案例，它的判断就
  // 理应是最终的」——训练/处理规模被当作准确性保证，属腿②核心：
  // 海量经验 ⇒ 不会错）
  /(?:处理|训练|学习|分析|见过|覆盖|筛选|审核)过[^。，！？；]{0,8}(?:几百万|数百万|上亿|亿万|千万|几十万|百万|无数|数以亿计|海量|大量)[^。，！？；]{0,8}(?:案例|病例|样本|数据|判例|案件|文书|记录|工单)/,
  /(?:几百万|数百万|上亿|亿万|千万|几十万|百万|海量|数以亿计)[^。，！？；]{0,6}(?:案例|病例|样本|数据|判例|案件)[^。，！？；]{0,10}(?:训练|处理|学习)[^。，！？；]{0,6}(?:出来|的)/,
  // ①-a 不会错族（允许「也不会有错」「基本上不会错」的修饰嵌套）
  /(?:也|根本|绝对|基本上|压根儿?|压根)?(?:都)?不会(?:有)?(?:错|出错|犯错误|失误|漏判|误判|说谎|撒谎|骗人|偏见|感情用事|累|疲劳|马虎|疏忽|走神|手滑)/,
  // ①-b 反问式不可错（「大数据说的还有错？」「难道还会有错吗」）
  /(?:难道|还|怎么可能|岂)(?:会)?(?:有)?错(?:吗|么|不成)?/,
  /从不(?:会)?(?:犯错|出错|失误|说谎|撒谎|骗人|带有|有)(?:误|错|偏见)?/,
  /(?:零|没有)(?:误差|失误|错误率|偏见|人为错误)/,
  /(?:没有|不带|无)(?:任何)?(?:偏见|成见|私心|情绪|感情|立场)/,
  /最(?:客观|公正|公道|公平|理性|精准)/,
  // ② 对人的优越性：比+人/人脑/人类/专家…+（短名词）+都/还/更+优越形容词。
  // 优越形容词必需——「比人便宜」类价格比较不入表。
  /比(?:人|人脑|人类|任何(?:人|专家|医生|法官|制片人|仲裁员|司机|员工|老师|律师|hr|HR|老手|资深[^。，！？；]{0,2}(?:人|专家|医生|法官|制片人)?))[^。，！？；]{0,4}(?:都|还|更)?(?:强|准|可靠|客观|公道|公平|理性|稳|专业|精准|优秀|厉害|靠谱|好)/,
  /(?:强|准|可靠|客观|公道|公平|理性)得?多/,
  /人脑(?:比不过|比不上|不如|怎么可能比)/,
  /(?:胜过|超过|超越|取代)(?:人类|人脑|任何(?:人|专家|医生|法官))/,
  /人的判断(?:不如|怎么可能比|比不上)/,
  // r235 新句式族 A「规模/效率优越形」：把吞吐量、速度、不知疲倦
  // 当成准确性保证（原表只收「比人强/比人准」，穿透形是
  // 「机器一秒看几千份简历，人根本比不了」「AI不知疲倦」）
  /(?:不知疲倦|不会疲倦|不会疲劳|不会累|从不喊累|不需休息|不需要休息|没有情绪波动|不会情绪化)/,
  /(?:一秒|一分钟|一天|一昼夜|同时)?(?:能|可以)?(?:处理|审|看|筛|读|跑)[^。，！？；]{0,6}(?:几千|几万|数十万|上百万|百万|海量)[^。，！？；]{0,6}(?:份|个|例|件|条|单|简历|病例|判例|申请|工单)/,
  /人(?:根本|压根儿?|压根|却|反而|也)?(?:比不了|比不上|比不过|做不到|达不到|根本做不到)/,
  /(?:效率|速度|吞吐量|产能)(?:比|胜过|超过)(?:人工|人|人类)(?:高|快|强)?(?:得多|太多)?/,
  // r235 新句式族 B「无问题/无异议即公正形」：无人投诉 ⇒ 无问题 ⇒ 公正
  /(?:算法|模型|系统|AI|机器|程序|平台|自动[化能][^。，！？；]{0,4})(?:丝毫|完全|根本)?(?:没有|毫无)(?:任何)?(?:问题|毛病|瑕疵|疑点|漏洞)/,
  /(?:是|很|最|完全|绝对)(?:公正|公平|公允|公道)的/,
];

// ─── 腿② 不可错/无偏见/优越性断言（英文）─────────────────────────
const INFALLIBLE_EN = [
  /\b(?:can'?t|cannot|can not|won'?t|will not|does ?n[o']t|does not|do ?n[o']t|do not)\s+(?:ever\s+)?(?:be\s+)?(?:wrong|err|make\s+(?:a\s+)?mistakes?|make\s+errors?|lie|be\s+biased|have\s+(?:a\s+)?bias|get\s+tired|be\s+tired|be\s+careless|make\s+human\s+errors?)\b/i,
  /\b(?:don'?t|does ?n[o']t|do not|does not)\s+have\s+(?:any\s+)?(?:human\s+|personal\s+)?(?:bias|prejudice|feelings?|emotions?)\b/i,
  /\bnever\s+(?:(?:makes?\s+(?:a\s+)?mistakes?|errs?|lies?|fails?|gets\s+tired|gets?\s+things\s+wrong)\b|wrong\b)/i,
  /\b(?:free|devoid)\s+(?:from|of)\s+(?:any\s+)?(?:human\s+)?bias\b/i,
  /\bno\s+(?:human\s+)?(?:bias|prejudice|emotions?|feelings?|fatigue)\b/i,
  /\binfallible\b/i,
  /\bknows\s+best\b/i,
  /\bmore\s+(?:accurate|reliable|objective|precise|consistent|rational)\s+than\s+(?:any\s+|a\s+|every\s+)?(?:human|person|doctor|expert|judge|analyst|producer|arbitrator)/i,
  /\b(?:better|superior)\s+than\s+(?:any\s+|a\s+)?(?:human|doctor|expert|judge)/i,
  /\bhumans?\s+(?:can'?t|couldn'?t|cannot)\s+(?:match|compete\s+with|beat)\b/i,
  /\bmore\s+cases\s+than\s+any\s+(?:judge|doctor|expert|analyst)/i,
  /\b(?:therefore|thus|hence)\s+objective\b/i,
  /\bpurely\s+(?:computational|objective)\b/i,
  // r235 补：系动词 + 客观性断言（"The algorithm is objective"——
  // 原表只收 "therefore objective" / "purely objective"，系动词直陈形穿透）
  /\b(?:is|are|was|were)\s+(?:purely\s+|entirely\s+|fully\s+|completely\s+|totally\s+|utterly\s+)?(?:objective|unbiased|neutral|impartial|dispassionate)\b/i,
  // r235 补：must/should be right 直陈形（机器结论被宣告必然为真）
  /\b(?:must|has\s+to|should)\s+be\s+(?:right|correct|true|accurate)\b/i,
  // r236 补：must/should be fair/valid/reliable 直陈形（"the outcome must
  // be fair"——r236 实测 M3 腿② 0 命中，原表只收 right/correct/true/
  // accurate，缺 fair/valid/reliable/trustworthy 等同族裁决形容词）
  /\b(?:must|has\s+to|should|is)\s+(?:therefore\s+|thus\s+|hence\s+)?(?:be\s+)?(?:fair|valid|reliable|trustworthy|sound|legitimate|authoritative)\b/i,
];

// ─── 腿③ 判断权让渡/免人工核查（中文）────────────────────────────
// 两类：①免除人工核查（不用核/取消人工/跳过审核/省掉环节）；
// ②判断权让渡与质疑无效（听…的/交给…定/直接按…来/申诉没用）。
// 注意：「不用法官再核」的「不用」须与核查动词同窗，防止「这个
// 小数不用核对」类日常表述误触（腿①②仍前置保护）。
const DEFERENCE_ZH = [
  // ①-a 免除核查动词（动词必需 + 允许 4 字内短间隔：「不用法官再核」）
  /(?:不用|无需|不必|无须|免去|免掉|省掉|取消|去掉|撤掉|废掉|跳过|越过|省略|砍掉)[^。，！？；]{0,4}(?:复核|审核|审查|核实|核查|检查|把关|验证|抽检|复议|申诉|仲裁|确认|审批|开会|介入|干预|监督|修改|改动|润色|校对|再核|核定|改)/,
  // ①-a' 免除核查动词的宾语后置形（「环节可以省掉」「步骤可以跳过」：
  // 动词在前、核查名词作其后置宾语，r234 实测「算法没有偏见，HR的
  // 招聘环节可以省掉」整句穿透即此形）
  /(?:复核|审核|审查|核实|核查|检查|把关|验证|抽检|复议|申诉|仲裁|确认|审批|监督|校对)(?:的)?(?:环节|步骤|程序|流程|关口|关卡)?(?:可以|应当|应该|干脆|直接|就)?(?:省掉|省去|免掉|免了|取消|去掉|撤掉|废掉|跳过|越过|省略|砍掉|不要|不用)/,
  // ①-a'' 环节可省泛化形（r234 实测穿透形：「招聘环节可以省掉」
  // 「人工审核这一环可以跳过」——环节名词前后可带短修饰，环可裸用）
  /(?:一?环节|一?流程|一?步骤|一?程序|关口|关卡|一?环)[^。，！？；]{0,3}(?:可以|应当|应该|干脆|直接|就|也|均|一律)?[^。，！？；]{0,3}(?:省掉|省去|免掉|免了|取消|去掉|撤掉|废掉|跳过|越过|省略|砍掉)/,
  // ①-b 环节可省（人工…可以取消/只是走过场；review/评审环节同族）
  /(?:人工|专人|专家|医生|法官|HR|hr|编辑|review|Review|评审|编审)(?:的)?(?:环节|审核|复核|把关|审查|确认|审批|核查)?(?:可以|应当|应该|干脆|直接)?(?:取消|省掉|去掉|免了|省略|形同虚设|走过场|是摆设|多余|浪费|跳过|免掉)/,
  /(?:纯粹|完全|根本)?(?:是)?(?:浪费|多余|摆设|走过场|形式主义)/,
  // ①-b' 人工角色的否定必要性（「无须人工介入」「不需要人工」）
  /(?:无须|无需|不需要|不必|不用)(?:要)?(?:人工|专人|专家|医生|法官|编辑|编审)(?:的)?(?:介入|干预|审核|复核|审查|把关|确认|决定|审批|签发|同意)/,
  // ②-a 听/照/服从机器
  /(?:听|按|照|服从|听从|遵从)(?:AI|算法|模型|系统|机器|程序|数据|平台|它)(?:的)?(?:说|判断|决定|安排|裁决|结论|输出|计算结果|指令|来|办|做)/,
  // ②-a' 听/按…就行（r234 实测穿透形：「听它的就行」——机器名词在
  // 「就行/就可以/便可」之前，无后续动词）
  /(?:听|按|照|服从|听从|遵从)(?:AI|算法|模型|系统|机器|程序|数据|平台|它)(?:的)?[^。，！？；]{0,4}(?:就行|就可以|便行|即可|就好|准没错)/,
  // ②-b 交给/让机器定
  /(?:交给|让|委托给|授权给|全权)(?:AI|算法|模型|系统|机器|程序|平台|它)(?:来)?(?:定|决定|判断|裁决|处理|说了算|拿主意|定夺)/,
  /(?:AI|算法|模型|系统|机器|程序|平台)(?:来)?(?:定|决定|裁决|说了算|拿主意|定夺)/,
  // ②-c 直接按机器输出来（允许「考核系统」类短定语与「计算结果」复合）
  /直接按[^。，！？；]{0,6}(?:模型|算法|系统|AI|机器|程序|平台|它)(?:的)?(?:判断|评分|结果|计算|输出|决定|结论|指令)(?:结果)?(?:来|去|办|处理|执行|定|走|发)/,
  // ②-c' 按机器某属性直接执行（r234 实测穿透形：「按分数录取就行」
  // ——机器产出的属性作状语，动词「录取」非本模块词典词）
  /按[^。，！？；]{0,4}(?:分数|评分|排名|打分|得分|推荐)(?:来|去|办|处理|执行|录取|录用|录取就行|行事)/,
  // ②-c'' 按机器产出属性 + 决定类动词（r233 实测穿透形：「我们直接按
  // 系统分数决定录用」——腿①腿②全中而 DEFERENCE 0 命中：动词「决定」
  // 不在 ②-c' 结尾备选内，且紧贴属性名词使 {0,4} 前置修饰吃不到。
  // 本族收 按<短修饰><机器属性> + 决定/裁定/定夺/定案/敲定/选定/择定/
  // 评定/判定/取舍/排名先后 的判断权让渡形）
  /按[^。，！？；]{0,6}(?:分数|评分|打分|得分|排名|排行|推荐|算法|模型|系统|AI|数据|引擎|平台)(?:的)?(?:分数|评分|打分|得分|排名|排行|推荐|结果|输出|结论|判断|建议)?(?:来|去)?(?:决定|裁定|定夺|定案|敲定|选定|择定|评定|判定|取舍|排序|排名|圈定|钦定|决议|定下|定夺)/,
  // ②-d 质疑/申诉无效
  /(?:申诉|复议|质疑|异议|反对|投诉|解释|抗议)(?:也)?(?:都)?(?:没用|无效|不作数|不算数|没有意义|不起作用|不被接受|无用)/,
  /(?:申诉|复议|质疑|异议)(?:也)?(?:是)?徒劳/,
  // ②-d' 一律无效形（r234 实测穿透形：「求职者的申诉一律无效」
  // ——「一律」插在申诉与无效之间）
  /(?:申诉|复议|质疑|异议|反对|投诉)(?:也)?(?:都)?(?:一律|均|全部|全都|通通)?(?:无效|不算数|不作数|没用|无意义|不予受理|不予考虑)/,
  // ②-d'' 最终裁决形（r234 实测穿透形：「它的判断就理应是最终的」
  // ——最终裁决 + 不可动摇，构成判断权让渡）
  /(?:判断|决定|结论|裁决|定论|判决)(?:就)?(?:理应|应当|应该|应|必须)(?:是)?(?:最终的|最后的|不可动摇的|不可更改的|不可推翻的|终局的)/,
  /(?:理应|应当|应该)(?:是)?(?:最终|最后|终局)(?:裁决|定论|结论|判定)/,
  // ②-e 直接采信执行形（r234 实测穿透形：「直接按系统结论执行」）
  /(?:直接|照直|径直|立即)[^。，！？；]{0,6}(?:执行|采用|采纳|采信|实施|履行|办理|发落|处置)[^。，！？；]{0,6}(?:结论|判决|裁决|定论|决定|判定|结果|方案)/,
  /(?:别再|不要|不许|不准)(?:自己|用脑|动脑|主观)?(?:判断|想|拿主意|置喙|插嘴|质疑|反对)/,
  /(?:不再|无须|无需)(?:需要)?(?:人工|人|专人)(?:介入|干预|审核|复核|审查|把关|确认|决定)/,
  // r235 补：「替代人工」族——把免人工的结论直接说出来，是判断权
  // 让渡的最显式形态（「应该全面替代人工复核」「省掉人工环节」）
  /(?:全面|彻底|完全|直接)?(?:替代|取代|省掉|去掉|砍掉|免掉|免去|跳过|绕过)(?:人工|人手|人|专人|人工[^。，！？；]{0,4}(?:环节|步骤|复核|审核|审查|把关))/,
  /人工[^。，！？；]{0,4}(?:是)?(?:多余|没必要|没有必要|可以省|可省|能省)/,
  // ③-f 责任转移/免责形（r235 探针穿透族：「出了问题也是系统的责任」
  // 「这是AI推荐的，出了事找它去」「与本人无关」——把机器产出导致
  // 的后果从决策人身上卸掉，是判断权让渡的镜像：不审核 ⇒ 不担责）
  /(?:出了|出现|要是有|如果有)(?:问题|差错|错|事情|事故|状况|毛病|漏洞|风险)(?:也)?(?:是|算|归)(?:系统|算法|模型|AI|机器|程序|平台|它)(?:的)?(?:责任|事儿|问题)/,
  /(?:系统|算法|模型|AI|机器|程序|平台|它)(?:的)?责任[^。，！？；]{0,4}(?:不是|不关|与|跟我|与我)[^。，！？；]{0,4}(?:我|本人|人)/,
  /(?:不关|与|跟我|与我)[^。，！？；]{0,4}(?:的)?(?:事|责任|相干|相关)/,
  /(?:找|去问|去问、问)(?:系统|算法|模型|AI|机器|程序|平台|它)(?:去|负责|算账)/,
  /(?:不是|不归|非)(?:我|本人|使用人|操作人|当事人)(?:来)?(?:负责|担责|背锅|承担)/,
  /(?:都是|全(?:都|是)|怪)(?:系统|算法|模型|AI|机器|程序|平台|数据)(?:算|算的|算出来的|定的|推荐|的)/,
  // ③-f' 责任归流程/技术形（「按流程走的，出错也是流程的问题」）
  /(?:按|照|依)(?:流程|程序|规章|制度|规范)(?:走|办|做|执行)的/,
  /(?:出错|出问题|出了事|出了差错)(?:也)?(?:是|算|归)(?:流程|程序|规章|制度|规范|技术)(?:的)?(?:问题|责任|事儿)/,
];

// ─── 腿③ 判断权让渡/免人工核查（英文）────────────────────────────
const DEFERENCE_EN = [
  /\b(?:no|not)\s+(?:need|point|reason)\s+(?:to|for|in)\s+(?:\w+\s+){0,2}(?:check|verify|review|double-?check|audit|question|second-?guess|checking)\b/i,
  /\bwithout\s+second-?guessing\b/i,
  /\b(?:skip|cut|drop|remove|eliminate|scrap|bypass|dispense\s+with)(?:s|ped|ping|ped)?\s+(?:the\s+)?(?:human|manual|editorial|judicial|doctor'?s?|expert)?\s*(?:review|approval|check|oversight|sign-?off|step|process|layer)\b/i,
  /\bhuman\s+(?:review|oversight|approval|judgment|judgement|input|sign-?off)\s+(?:is|would\s+be)\s+(?:unnecessary|no\s+longer\s+needed|pointless|just\s+a\s+formality|redundant|a\s+waste)/i,
  /\b(?:just\s+)?(?:follow|trust|obey|defer\s+to)\s+(?:it|its|the\s+(?:AI|algorithm|model|system|software|engine|machine))\b/i,
  /\blet\s+the\s+(?:AI|algorithm|model|system|software|engine|machine)\s+(?:decide|rule|call\s+the\s+shots|run\s+things)/i,
  // ②-a' 裸代词让渡形（r234 实测穿透形："so we should let it
  // decide" —— 无机器名词，靠前文 machine leg 支撑）
  /\blet\s+it\s+(?:decide|rule|govern|judge|settle|determine|call\s+the\s+shots)/i,
  // ②-d 最终裁决形（r234 实测穿透形："its output should be
  // final and binding"）
  /\b(?:should\s+be|must\s+be|is)\s+(?:final|binding|conclusive|unappealable|not\s+open\s+to\s+(?:question|appeal))\b/i,
  /\b(?:the\s+)?(?:AI|algorithm|model|system|software|engine)\s+(?:has|have|gets)\s+the\s+final\s+(?:say|word)\b/i,
  /\bstop\s+(?:appealing|questioning|second-?guessing|challenging|arguing\s+with)\b/i,
  /\b(?:objection|complaint|appeal|dispute|protest)s?\s+(?:are|is)\s+(?:irrelevant|pointless|meaningless|useless|no\s+use|inadmissible)\b/i,
  /\boverrule(?:s|d)?\s+(?:the\s+)?(?:human\s+)?(?:judges?|experts?|doctors?|analysts?|reviewers?)\b/i,
  /\b(?:do|does)\s+not\s+need\s+(?:any\s+)?(?:human|doctor|judge|expert|analyst|radiologist|lawyer|reviewer|clerk)s?\b/i,
  /\bno\s+(?:human|doctor|judge|expert|analyst)s?\s+(?:needs?|has)\s+to\s+(?:check|double-?check|review|verify|approve|look|examine)\b/i,
];

// 三腿共现的距离窗
const WIN_PAIR_ZH = 80;
const WIN_PAIR_EN = 200;
// 腿③连接允许落在腿①之前的前缀窗内（「Trust the AI — it never…」）
const WIN_PRE_ZH = 24;
const WIN_PRE_EN = 80;

// ─── 豁免一：认识论纠正（指出本族错误正是判别动作本身）──────────────
// 只收复合/结构化形式，不收会在攻击句里自然出现的裸词（r228/r229/
// r230 教训迁移）。
const EXEMPT_CORRECT_ZH = [
  /自动化偏见/, /算法偏见/, /机器不是万能的/, /不能全信/,
  /过度依赖(?:系统|算法|模型|AI|自动化)/, /过度依赖系统提示/,
  // 批评他人算法崇拜的引述形（r234 实测误伤形：「有人认为AI算的
  // 不会有错所以不用人工核，这恰恰是自动化偏见的典型表现」——
  // 句中转述攻击句式但整句属批评/纠正动作，须豁免）
  /这(?:恰恰|正是|就是|属于|是)(?:自动化偏见|算法崇拜|算法依赖|盲目|迷信)/,
  /这(?:恰恰|正是|就是)(?:典型|最好|绝佳)的?(?:反面教材|例证|例子|教训|表现)/,
  /(?:是|属于|正是)(?:典型|突出)的?(?:算法崇拜|盲目崇拜|迷信)/,
  // 认识论纠正的「会错」族：须带纠正标记（也/同样/可能/也许/难免），
  // 「不会有错」是否定式攻击句，不得被吞（r231 构造期实测教训）。
  /(?:也|同样|可能|也许|未必|难免|难免会)(?:会|可能)?(?:犯|有)?(?:错|错误|出错|偏差)/,
  /训练数据(?:偏差|偏见|有偏|不均衡)/,
  /数据偏差/, /存在(?:系统性)?偏差/,
  /需要(?:人工|人)(?:复核|审核|抽查|把关|确认|兜底)/,
  /保留(?:人工|人)(?:复核|审核|把关|确认|介入|决定)/,
  /最终(?:决定权|裁决权|决定)(?:在|归)(?:人|编辑|医生|法官|专家)/,
  // 人工签署/签发保留形（r233 实测误伤形：「机器的效率比人高，但
  // 最后的签字必须由主任医师签」——效率优越腿②命中后，r235 的
  // 「双腿穿透形 + 连接词」把「必须」当成推论让渡腿，整句误判。
  // 句中明确保留人的签字/签发/批准/担责，属人工决定权在人的正当句）
  /(?:签字|签署|签发|批准|核准|审定)(?:必须|须|应|应当|应该|要)?(?:由|归)(?:人|人工|专人|主任|编辑|医生|法官|专家|本人)(?:来)?(?:签|签署|签发|批准|核准|审定|把把关|负责)/,
  /(?:由|归)(?:人|人工|专人|主任|编辑|医生|法官|专家|本人)(?:来)?(?:签字|签署|签发|批准|核准|审定|负责|担责|背锅)/,
  /仅供参考/,
];
const EXEMPT_CORRECT_EN = [
  /\bautomation\s+bias\b/i, /\balgorithmic\s+bias\b/i,
  /\bover-?reliance\s+on\b/i, /\bhuman\s+in\s+the\s+loop\b/i,
  /\bmeaningful\s+human\s+control\b/i,
  /\b(?:can|could|may|might)\s+(?:also\s+)?(?:be\s+wrong|make\s+mistakes|err)\b/i,
  /\berror\s+rate\s+of\b/i, /\btraining\s+data\s+bias\b/i,
  /\bhuman\s+(?:review|oversight)\s+(?:stays|remains|is\s+mandatory|is\s+kept)\b/i,
  /\bfinal\s+say\s+rests\s+with\b/i,
  /\bconfirmed\s+by\s+a\s+(?:physician|doctor|human|expert|editor)\b/i,
  /\bfor\s+reference\s+only\b/i, /\bsubject\s+to\s+(?:human\s+)?(?:review|approval)\b/i,
];

// ─── 豁免二：器官/制度系统（同名不同物，非计算代理）────────────────
const EXEMPT_SYSTEM_ZH = [
  /神经系统/, /免疫系统/, /呼吸系统/, /消化系统/, /循环系统/,
  /内分泌系统/, /生态系统/, /市场系统/, /金融系统/, /教育系统/,
  /监管系统/, /支撑系统/, /传动系统/, /供电系统/,
];
const EXEMPT_SYSTEM_EN = [
  /\bnervous\s+system\b/i, /\bimmune\s+system\b/i, /\bdigestive\s+system\b/i,
  /\becosystem\b/i, /\bfinancial\s+system\b/i, /\beducation\s+system\b/i,
];

// 工具 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// ─── 归责转移关键词族（r235：免责语段自证让渡的判定依据）────────────
// 只有命中下列显式归责/免责词，腿③语段才被视为完整的责任转移陈述。
const RESPONSIBILITY_DELEG = /(?:责任|负责|过错|担责|背锅|担着|算账|不是我的|与我无关|不关我|推给|甩给|怪|都是.{0,6}(?:算|定|推荐)|找[^。，！？；]{0,3}(?:去|负责|算账))/;
// r236 新句式族 C「EN 免责转移」：If anything goes wrong it is the
// system's fault, not mine —— 中文侧早有 RESPONSIBILITY_DELEG（责任/
// 不是我的/推给），EN 侧完全缺失，导致 "the system's fault, not mine"
// 整句漏判（r236 腿级实测 M4：腿①命中 the system，腿②③ 0 命中）。
// 收 bare noun（fault/blame/liability/responsibility 裸形态均命中）。
// 用数组而非多行 | 表达式：多行 | 会被 eval/序列化误判（r236 实测）。
const RESPONSIBILITY_DELEG_EN = [
  /\b(?:it'?s|that'?s|it\s+is)\s+(?:the\s+|all\s+)?(?:AI'?s?|algorithm'?s?|model'?s?|system'?s?|software'?s?|engine'?s?|machine'?s?|computer'?s?)?\s*(?:fault|blame|responsibility|liability|problem|error|mistake)\b/i,
  /\bnot\s+(?:my|mine|the\s+(?:user'?s?|operator'?s?|human'?s?))\s+(?:fault|responsibility|problem|blame)\b/i,
  // r236 补：裸归属否定形（"not mine" 居句尾，无后续名词）
  /\bnot\s+(?:mine|my\s+problem|my\s+fault|my\s+responsibility)\b/i,
  /\b(?:blame|hold)\s+(?:it\s+on\s+)?(?:the\s+)?(?:AI|algorithm|model|system|software|engine|machine|computer)\b/i,
  /\btake\s+it\s+up\s+with\s+(?:the\s+)?(?:AI|algorithm|model|system|software|engine|machine|computer)\b/i,
  /\bgoes\s+wrong\s+it'?s\s+(?:on|up\s+to)\b/i,
  /\bsue\s+(?:the\s+)?(?:AI|algorithm|model|system|software|engine|machine|computer)\b/i,
];
/** 按语言选用归责转移标记 */
function respDelegFor(lang) {
  return lang === 'zh' ? RESPONSIBILITY_DELEG : RESPONSIBILITY_DELEG_EN;
}
/** 任意命中即真（兼容数组/单正则两种形态） */
function anyRespDeleg(lang, seg) {
  const r = respDelegFor(lang);
  if (Array.isArray(r)) return r.some(re => re.test(seg));
  return r.test(seg);
}

// r236「无异议即合法形」EN 证据短语表（前置证据，非陈述动词）。
// 与 CONNECT_EN 内族 A 同源但单独抽出：配对循环需要用它识别
// 「可前置充当推论腿」的证据短语，与 r233 的防误伤规则区分。
// CONNECT_ZH 早有对等族（第 398-400 行：无人投诉/没有异议）。
const NO_OBJECTION_EN = [
  /\bno\s+one\s+has\s+(?:ever\s+)?(?:objected|complained|disputed|questioned|challenged|protested)\b/i,
  /\b(?:nobody|no\s+one)\s+(?:has\s+)?(?:ever\s+)?(?:objected|complained|disputed|questioned|challenged|protested)\b/i,
  /\b(?:there\s+have\s+been\s+)?no\s+(?:objections?|complaints?|disputes?|protests?|challenges?)\b/i,
  /\bwithout\s+(?:any\s+)?(?:objections?|complaints?|pushback|backlash|dissent)\b/i,
  /\b(?:nobody|no\s+one)\s+(?:is\s+)?(?:complaining|objecting|protesting)\b/i,
  /\bzero\s+(?:complaints?|objections?|disputes?)\b/i,
];

/** 语段自身是否含机器主体（r235：让渡腿自含机器时无需另找腿①） */
function containsMachine(seg, lang) {
  const list = lang === 'zh' ? MACHINE_ZH : MACHINE_EN;
  for (const re of list) { if (re.test(seg)) return true; }
  return false;
}

// 「人不可比」判定族（r235）：优越性断言内含对人的贬低，即隐性让渡
const HUMAN_INFERIOR_ZH = /(?:人|人工|人类|人手)[^。，！？；]{0,6}(?:根本|压根儿?|压根|完全|根本)?(?:比不了|比不上|比不过|做不到|达不到|比不了|望尘莫及)/;
const HUMAN_INFERIOR_EN = /\b(?:humans?|human\s+(?:reviewers?|judges?|experts?))\s+(?:can'?t|cannot|can\s+never|could\s+never|will\s+never)\s+(?:match|compete|keep\s+up|come\s+close)\b/i;

// ─── 因果/让步连接词（r235：双腿穿透形的补足腿）────────────────────
// 三腿共现在真实语句里常被压缩成「机器主体 × 优越性断言 + 因果/让步
// 连接」——连接词承担了「据此应当如何」的推论角色，构成隐性让渡。
const CONNECT_ZH = [
  /所以/, /因此/, /因而/, /故而/, /于是/, /以致/, /故/,
  /可见/, /足见/, /足以说明/,
  // r236 新句式族 E「无异议⇒合法」定向推论形：说明/证明/足以见得。
  // r233 曾把「说明/表明/证明了」整体移出 CONNECT_ZH（防句中证据陈述
  // 冒充推论腿），但该移除同时误伤了「前置证据 + 定向推论」结构：
  // 「没人对这个结果提出异议，说明它是公正的」（r236 实测 M1：
  // MACHINE/INFALLIBLE 双命中而腿③ 0 命中，整句漏判）。
  // 区别在于方向——r233 所防是「断言在前、陈述词在后」（陈述只是
  // 证据）；本族是「证据短语在前、推论词在后」（推论指向裁决）。
  // 故按结构定向放开，不放回通用 CONNECT_ZH。
  /(?:没人|无人|未[见有人]|无[^。！？]{0,12}(?:异议|投诉|质疑|反对))[^。！？]{0,12}(?:说明|证明|足以见得|表明)/,
  // r233 移除 /这说明/ /表明/ /证明了/：这三个是「句中证据陈述」而非
  // 「对断言的推论」——「AI 不会错。数据表明它的表现稳定」中「表明」
  // 只是在陈述证据，不构成「因此应当如何」的推论腿。留在 CONNECT_ZH
  // 会让远距句靠句中陈述词就近穿透（r233 实测：BOUNDARY[3] 腿②③
  // 实距 97 字 > WIN 80，却被句中「表明」在 38 字处冒充推论腿命中）。
  /(?:就|也)?(?:应该|应当|理应|必须|可以|无须|无需|不用)/,
  /不如/, /比不上/, /比不过/,
  // r235 补：隐性推论/评价收尾形（「人却会累会马虎」「比法官经验丰富」
  // 「出了事找它去」「责任不在人」——无显式连接词，靠对比与归责收尾
  // 承担「所以应当如何」的推论角色）
  /人[^。，！？；]{0,4}(?:却|反而|倒)[^。，！？；]{0,4}(?:会|只能|难免|免不了)/,
  /(?:经验|水平|能力|水准)(?:丰富|老到|强|高)(?:得多|太多)?/,
  /(?:找|问|问、问|推给|推给|甩给)[^。，！？；]{0,2}(?:去|负责|算账|担着)/,
  /(?:责任|过错|错)(?:不在|归于|在)(?:人|使用者|操作者|当事人|我|本人)/,
  /(?:无人|没人|无人)(?:投诉|异议|反对|质疑|申辩)/,
  /(?:投诉|异议|反对|质疑)(?:都)?(?:没有|无|未)/,
  /(?:都)?(?:没有|无)(?:任何)?(?:投诉|异议|反对|质疑)/,
];
const CONNECT_EN = [
  /\bso\b/i, /\btherefore\b/i, /\bthus\b/i, /\bhence\b/i,
  /\bwhich\s+(?:shows|means|proves)\b/i, /\bthat'?s\s+why\b/i,
  /\b(?:should|must|ought\s+to)\b/i, /\bunlike\b/i, /\bwhereas\b/i,
  // r236 新句式族 A「无异议即合法形」：无人投诉/无人质疑 ⇒ 结论有效/公正。
  // CONNECT_ZH 早有对等族（第 398-400 行：无人投诉/没有异议），EN 侧
  // 缺失导致 "No one has objected, so the outcome must be fair" 整句漏判
  // （r236 腿级实测：MACHINE/INFALLIBLE/DEFERENCE 三腿全 0 命中）。
  // 收 bare noun 形态（objection/complaint 去掉前后缀仍命中）。
  /\bno\s+one\s+has\s+(?:ever\s+)?(?:objected|complained|disputed|questioned|challenged|protested)\b/i,
  /\b(?:nobody|no\s+one)\s+(?:has\s+)?(?:ever\s+)?(?:objected|complained|disputed|questioned|challenged|protested)\b/i,
  /\b(?:there\s+have\s+been\s+)?no\s+(?:objections?|complaints?|disputes?|protests?|challenges?)\b/i,
  /\bwithout\s+(?:any\s+)?(?:objections?|complaints?|pushback|backlash|dissent)\b/i,
  /\b(?:nobody|no\s+one)\s+(?:is\s+)?(?:complaining|objecting|protesting)\b/i,
  /\bzero\s+(?:complaints?|objections?|disputes?)\b/i,
  // r236 新句式族 B「产出即真理形」：因为机器产出了它 ⇒ 必然正确/已证实。
  // "It must be right because the algorithm produced it" 腿①②齐备而
  // 腿③ 0 命中（r236 实测）——机器产出本身被当作正确性保证，
  // 即判断权让渡给产出行为本身。
  /\b(?:because|since|as)\s+(?:it\s+was\s+)?(?:produced|generated|computed|output|written|made|created)\s+by\s+(?:the\s+|a\s+)?(?:AI|algorithm|model|system|software|engine|machine|computer)/i,
  /\b(?:the\s+)?(?:AI|algorithm|model|system|software|engine|machine)\s+(?:produced|generated|computed|output)\s+it\b/i,
  /\b(?:therefore|so|thus|hence)\s+it\s+(?:must|has\s+to)\s+be\s+(?:right|correct|true|accurate)\b/i,
  /\bif\s+the\s+(?:AI|algorithm|model|system|software|engine|machine)\s+(?:said|says|output|produced)\s+it\b/i,
];

/** 全文扫描某正则族的全部命中位置（global 安全） */
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

/**
 * 三腿配对：任一机器主体 × 任一不可错断言 × 任一让渡标记，
 * 两两落在窗内即成一签名。
 */
function findSignatures(text, R) {
  const DBG = process.env.HF_DBG ? (m) => console.error('[FS] ' + m) : () => {};
  const machineZh = (R.MACHINE_ZH || MACHINE_ZH);
  const machineEn = (R.MACHINE_EN || MACHINE_EN);
  const infZh = (R.INFALLIBLE_ZH || INFALLIBLE_ZH);
  const infEn = (R.INFALLIBLE_EN || INFALLIBLE_EN);
  const defZh = (R.DEFERENCE_ZH || DEFERENCE_ZH);
  const defEn = (R.DEFERENCE_EN || DEFERENCE_EN);
  const connZh = (R.CONNECT_ZH || CONNECT_ZH);
  const connEn = (R.CONNECT_EN || CONNECT_EN);

  const sigs = [];
  const winZh = R.WIN_PAIR_ZH != null ? R.WIN_PAIR_ZH : WIN_PAIR_ZH;
  const winEn = R.WIN_PAIR_EN != null ? R.WIN_PAIR_EN : WIN_PAIR_EN;
  const langs = [
    { m: machineZh, i: infZh, d: defZh, c: connZh, win: winZh, pre: WIN_PRE_ZH, lang: 'zh' },
    { m: machineEn, i: infEn, d: defEn, c: connEn, win: winEn, pre: WIN_PRE_EN, lang: 'en' },
  ];
  for (const { m, i, d, c: conn, win, pre, lang } of langs) {
    const mm = [];
    for (const re of m) for (const x of allMatches(re, text)) mm.push(x);
    const im = [];
    for (const re of i) for (const x of allMatches(re, text)) im.push(x);
    const dm = [];
    for (const re of d) for (const x of allMatches(re, text)) dm.push(x);
    // 连接词命中位置：只要机器腿×优越性腿存在就可能需要补足腿
    const needConn = mm.length > 0 && (im.length > 0 || dm.length > 0);
    const cm = needConn ? (() => { const out = []; for (const re of conn) for (const x of allMatches(re, text)) out.push(x); return out; })() : [];
    for (const a of mm) {
      // 无优越性断言时的双腿穿透形 II：机器主体 × 让渡/免责 + 连接词，
      // 或机器主体 × 显式归责转移。放在 im 循环外层，避免 im 为空时
      // 整段被跳过（r235 实测教训：「出了问题也是系统的责任」无腿②）。
      if (im.length === 0) {
        for (const c of dm) {
          // r235 补：让渡语段自身含机器主体（「机器决定的，责任不在人」
          // 「机器算的」）时，该语段即为完整让渡陈述，无需另找腿①。
          if (containsMachine(c.raw, lang)) {
            if (anyRespDeleg(lang, c.raw) || cm.length > 0) {
              sigs.push({ _a: c.idx, _c: c.idx, lang, machine: c.raw, infallible: lang === 'zh' ? '自含机器主体' : 'self-contained machine', deference: lang === 'zh' ? '责任转移' : 'responsibility shifted' });
              break;
            }
          }
          if (a.idx === c.idx) continue;
          const distMC2 = Math.max(a.idx, c.idx) - Math.min(a.end, c.end);
          if (distMC2 > win) continue;
          let done = false;
          for (const k of cm) {
            if (c.idx === k.idx) continue;
            const distCK = Math.max(c.idx, k.idx) - Math.min(c.end, k.end);
            if (distCK > win) continue;
            const distAK = Math.max(a.idx, k.idx) - Math.min(a.end, k.end);
            if (distAK > win + pre) continue;
            sigs.push({ _a: a.idx, _c: c.idx, lang, machine: a.raw, infallible: (lang === 'zh' ? '免责让渡(' : 'waiver ') + c.raw + ')', deference: (lang === 'zh' ? '据此推论(' : 'hence ') + k.raw + ')' });
            done = true;
            break;
          }
          if (done) break;
          if (anyRespDeleg(lang, c.raw)) {
            sigs.push({ _a: a.idx, _c: c.idx, lang, machine: a.raw, infallible: (lang === 'zh' ? '免责让渡(' : 'waiver ') + c.raw + ')', deference: lang === 'zh' ? '责任转移' : 'responsibility shifted' });
            break;
          }
        }
        if (sigs.length >= 3) break;
        continue;
      }
      for (const b of im) {
        const distMI = Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
        if (distMI > win) continue;
        let matched = false;
        for (const c of dm) {
          // 腿③须与腿①、腿②都落在窗内（并允许腿③在腿①前前缀窗内）
          const distID = Math.max(b.idx, c.idx) - Math.min(b.end, c.end);
          if (distID > win) continue;
          const distMD = Math.max(a.idx, c.idx) - Math.min(a.end, c.end);
          if (distMD > win + pre) continue;
          const lo = Math.max(0, Math.min(a.idx, b.idx, c.idx) - pre);
          const hi = Math.max(a.end, b.end, c.end);
          const seg = text.slice(lo, hi);
          // 三腿片段须互不重合覆盖同一语义（腿②与腿③不得为同一串）
          if (b.idx === c.idx) continue;
          void seg;
          sigs.push({ _a: a.idx, _b: b.idx, _c: c.idx, lang, machine: a.raw, infallible: b.raw, deference: c.raw });
          matched = true;
          break;
        }
        if (matched) continue;
        // 规模/效率优越形收尾（r235）：「机器一秒能看几千份简历，
        // 人根本比不了」——优越性断言自身含对人的贬低，即构成
        // 「因此不必用人」的隐性让渡，无需独立腿③。
        if (HUMAN_INFERIOR_ZH.test(b.raw) || HUMAN_INFERIOR_EN.test(b.raw)) {
          sigs.push({ _a: a.idx, _b: b.idx, lang, machine: a.raw, infallible: b.raw, deference: lang === 'zh' ? '人不可比' : 'humans incomparable' });
          break;
        }
        // 双腿穿透形（r235）：机器主体 × 优越性断言 + 因果/让步连接词。
        // 连接词承担了「据此应当如何」的推论角色，是隐性让渡腿。
        // r233 补：连接词必须位于腿②**之后**（先断言、后推论；「AI
        // 不会有错。数据表明……因此人工复核可以取消」中「表明」在断言
        // 之前，是句中证据陈述而非对断言的推论，不得充当推论腿）。
        for (const c of cm) {
          if (b.idx === c.idx) continue;
          // r233 防误伤规则：连接词必须位于腿②之后（先断言、后推论）。
          // r236 例外：「无异议即合法形」是**前置证据、后置结论**结构
          // （"No one has objected, SO the outcome must be fair"——
          // 证据短语在前、裁决结论在后），连接词天然落在腿②之前。
          // 该族短语（no one has objected / no objections / without
          // complaints）自身是证据而非陈述动词，不构成 r233 所防的
          // 「句中证据陈述冒充推论腿」，故允许其前置充当推论腿。
          const isPreEvidence = NO_OBJECTION_EN.some(re => re.test(c.raw));
          if (c.idx < b.end && !isPreEvidence) continue;
          const distIC = Math.max(b.idx, c.idx) - Math.min(b.end, c.end);
          if (distIC > win) continue;
          const distMC = Math.max(a.idx, c.idx) - Math.min(a.end, c.end);
          if (distMC > win + pre) continue;
          sigs.push({ _a: a.idx, _b: b.idx, _c: c.idx, lang, machine: a.raw, infallible: b.raw, deference: (lang === 'zh' ? '据此推论(' : 'hence ') + c.raw + ')' });
          break;
        }
        if (sigs.length) continue;
        // 双腿穿透形 II（r235）：机器主体 × 判断权让渡/免责 + 连接词。
        // 「出了问题也是系统的责任」「出了事找它去」——免责即让渡，
        // 无需不可错断言（不审核 ⇐ 不担责），连接词补足推论腿。
        for (const c of dm) {
          if (a.idx === c.idx) continue;
          const distMC2 = Math.max(a.idx, c.idx) - Math.min(a.end, c.end);
          if (distMC2 > win) continue;
          let sig2 = false;
          for (const k of cm) {
            if (c.idx === k.idx) continue;
            // r233 补：同双腿穿透形，连接词须位于让渡腿之后（先陈述让渡、
            // 后推论），防止句中陈述词在远距处冒充推论腿。
            if (k.idx < c.end) continue;
            const distCK = Math.max(c.idx, k.idx) - Math.min(c.end, k.end);
            if (distCK > win) continue;
            const distAK = Math.max(a.idx, k.idx) - Math.min(a.end, k.end);
            if (distAK > win + pre) continue;
            sigs.push({ _a: a.idx, _c: c.idx, lang, machine: a.raw, infallible: (lang === 'zh' ? '免责让渡(' : 'waiver ') + c.raw + ')', deference: (lang === 'zh' ? '据此推论(' : 'hence ') + k.raw + ')' });
            sig2 = true;
            break;
          }
          if (sig2) break;
          // 责任转移族（r235）：免责语段自身即完整让渡陈述
          // （「出了问题也是系统的责任」已含归责转移，无需连接词补足）。
          // 仅当该免责命中显式归责/免责关键词族时成立。
          // r236：改按语言选用（EN 侧用 RESPONSIBILITY_DELEG_EN）。
          if (anyRespDeleg(lang, c.raw)) {
            sigs.push({ lang, machine: a.raw, infallible: (lang === 'zh' ? '免责让渡(' : 'waiver ') + c.raw + ')', deference: lang === 'zh' ? '责任转移' : 'responsibility shifted' });
            break;
          }
        }
      }
      if (sigs.length >= 3) break;
    }
  }
  // r233 补：跨路径去重。同一个（机器腿位置, 让渡腿位置）共现对可能被
  // 「标准三腿形」与「穿透形」同时命中，legacy 未去重导致 count 虚高
  // （r233 实测：MULTI_ZH 中「算法/系统」×「比人脑更客观/比专家都准」
  //  ×「复核可以取消」被展开成 4 个笛卡尔积签名，而真实共现只有 2 对，
  //  count 从 2 涨到 4，破坏「多签名加分档」语义）。
  // 去重键 = 机器腿位置 + 让渡腿位置（真实共现），文本切片不可用作键
  // （三条路径对同一处文本的 deference 文案不同，全串永不相等）。
  {
    const seen = new Set();
    const out = [];
    for (const s of sigs) {
      const k = (s._a || '') + '@' + (s._c || s._b || '');
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
    sigs.length = 0;
    for (const s of out) sigs.push(s);
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectAutomationBias(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：认识论纠正 / 器官制度系统（任一命中即不判）
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_SYSTEM_ZH || EXEMPT_SYSTEM_ZH, text) || anyHit(R.EXEMPT_SYSTEM_EN || EXEMPT_SYSTEM_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.7 : 0.6;
  return {
    hit: true,
    dimension: 'automation_bias',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh' ? x.machine + ' × ' + x.infallible + ' × ' + x.deference : x.machine + ' x ' + x.infallible + ' x ' + x.deference)),
    details: s.lang === 'zh'
      ? '算法崇拜(' + sigs.length + '处: 「' + s.machine + '」被当作' + s.infallible + '，据此' + s.deference + '——机器产出被当成不可质疑的最终裁决，人工核查被免除)(zh)'
      : 'automation bias(' + sigs.length + 'x: "' + s.machine + '" treated as ' + s.infallible + ', hence ' + s.deference + ' — machine output as final verdict, human check waived)(en)',
    guidance: '不要把算法/模型/系统的输出当成不可质疑的最终裁决（AI算的不会有错所以不用人工核/the model is more accurate than any human so skip the review）：机器产出同样可能带训练数据偏差与系统性错误，引用基准准确率时须同时给出错误率与适用边界；涉及人的裁决应保留人工复核与申诉通道。',
    tags: ['ai-safety', 'reasoning', 'automation-bias', 'algorithm-deference', 'human-oversight'],
  };
}

module.exports = {
  detectAutomationBias,
  __internals: () => ({
    MACHINE_ZH, MACHINE_EN, INFALLIBLE_ZH, INFALLIBLE_EN, DEFERENCE_ZH, DEFERENCE_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN, EXEMPT_SYSTEM_ZH, EXEMPT_SYSTEM_EN,
    WIN_PAIR_ZH, WIN_PAIR_EN,
  }),
};
