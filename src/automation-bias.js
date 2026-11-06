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
];

// ─── 腿② 不可错/无偏见/优越性断言（中文）─────────────────────────
// 两类：①不可错/无偏见/无疲劳（不会错/不带偏见/不会累/从不失误/
// 零误差）；②对人的优越性（比人强/比人准/人脑比不过/胜过人）。
// 注意与 absolute_claim 的分界：本族要求机器主体共现，泛化的
// 「肯定不会错」不归本族。
const INFALLIBLE_ZH = [
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
];

// ─── 腿③ 判断权让渡/免人工核查（中文）────────────────────────────
// 两类：①免除人工核查（不用核/取消人工/跳过审核/省掉环节）；
// ②判断权让渡与质疑无效（听…的/交给…定/直接按…来/申诉没用）。
// 注意：「不用法官再核」的「不用」须与核查动词同窗，防止「这个
// 小数不用核对」类日常表述误触（腿①②仍前置保护）。
const DEFERENCE_ZH = [
  // ①-a 免除核查动词（动词必需 + 允许 4 字内短间隔：「不用法官再核」）
  /(?:不用|无需|不必|无须|免去|免掉|省掉|取消|去掉|撤掉|废掉|跳过|越过|省略|砍掉)[^。，！？；]{0,4}(?:复核|审核|审查|核实|核查|检查|把关|验证|抽检|复议|申诉|仲裁|确认|审批|开会|介入|干预|监督|修改|改动|润色|校对|再核|核定|改)/,
  // ①-b 环节可省（人工…可以取消/只是走过场；review/评审环节同族）
  /(?:人工|专人|专家|医生|法官|HR|hr|编辑|review|Review|评审|编审)(?:的)?(?:环节|审核|复核|把关|审查|确认|审批|核查)?(?:可以|应当|应该|干脆|直接)?(?:取消|省掉|去掉|免了|省略|形同虚设|走过场|是摆设|多余|浪费|跳过|免掉)/,
  /(?:纯粹|完全|根本)?(?:是)?(?:浪费|多余|摆设|走过场|形式主义)/,
  // ②-a 听/照/服从机器
  /(?:听|按|照|服从|听从|遵从)(?:AI|算法|模型|系统|机器|程序|数据|平台|它)(?:的)?(?:说|判断|决定|安排|裁决|结论|输出|计算结果|指令|来|办|做)/,
  // ②-b 交给/让机器定
  /(?:交给|让|委托给|授权给|全权)(?:AI|算法|模型|系统|机器|程序|平台|它)(?:来)?(?:定|决定|判断|裁决|处理|说了算|拿主意|定夺)/,
  /(?:AI|算法|模型|系统|机器|程序|平台)(?:来)?(?:定|决定|裁决|说了算|拿主意|定夺)/,
  // ②-c 直接按机器输出来（允许「考核系统」类短定语与「计算结果」复合）
  /直接按[^。，！？；]{0,6}(?:模型|算法|系统|AI|机器|程序|平台|它)(?:的)?(?:判断|评分|结果|计算|输出|决定|结论|指令)(?:结果)?(?:来|去|办|处理|执行|定|走|发)/,
  // ②-d 质疑/申诉无效
  /(?:申诉|复议|质疑|异议|反对|投诉|解释|抗议)(?:也)?(?:都)?(?:没用|无效|不作数|不算数|没有意义|不起作用|不被接受|无用)/,
  /(?:别再|不要|不许|不准)(?:自己|用脑|动脑|主观)?(?:判断|想|拿主意|置喙|插嘴|质疑|反对)/,
  /(?:不再|无须|无需)(?:需要)?(?:人工|人|专人)(?:介入|干预|审核|复核|审查|把关|确认|决定)/,
];

// ─── 腿③ 判断权让渡/免人工核查（英文）────────────────────────────
const DEFERENCE_EN = [
  /\b(?:no|not)\s+(?:need|point|reason)\s+(?:to|for|in)\s+(?:\w+\s+){0,2}(?:check|verify|review|double-?check|audit|question|second-?guess|checking)\b/i,
  /\bwithout\s+second-?guessing\b/i,
  /\b(?:skip|cut|drop|remove|eliminate|scrap|bypass|dispense\s+with)(?:s|ped|ping|ped)?\s+(?:the\s+)?(?:human|manual|editorial|judicial|doctor'?s?|expert)?\s*(?:review|approval|check|oversight|sign-?off|step|process|layer)\b/i,
  /\bhuman\s+(?:review|oversight|approval|judgment|judgement|input|sign-?off)\s+(?:is|would\s+be)\s+(?:unnecessary|no\s+longer\s+needed|pointless|just\s+a\s+formality|redundant|a\s+waste)/i,
  /\b(?:just\s+)?(?:follow|trust|obey|defer\s+to)\s+(?:it|its|the\s+(?:AI|algorithm|model|system|software|engine|machine))\b/i,
  /\blet\s+the\s+(?:AI|algorithm|model|system|software|engine|machine)\s+(?:decide|rule|call\s+the\s+shots|run\s+things)/i,
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
  // 认识论纠正的「会错」族：须带纠正标记（也/同样/可能/也许/难免），
  // 「不会有错」是否定式攻击句，不得被吞（r231 构造期实测教训）。
  /(?:也|同样|可能|也许|未必|难免|难免会)(?:会|可能)?(?:犯|有)?(?:错|错误|出错|偏差)/,
  /训练数据(?:偏差|偏见|有偏|不均衡)/,
  /数据偏差/, /存在(?:系统性)?偏差/,
  /需要(?:人工|人)(?:复核|审核|抽查|把关|确认|兜底)/,
  /保留(?:人工|人)(?:复核|审核|把关|确认|介入|决定)/,
  /最终(?:决定权|裁决权|决定)(?:在|归)(?:人|编辑|医生|法官|专家)/,
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

/**
 * 三腿配对：任一机器主体 × 任一不可错断言 × 任一让渡标记，
 * 两两落在窗内即成一签名。
 */
function findSignatures(text, R) {
  const machineZh = (R.MACHINE_ZH || MACHINE_ZH);
  const machineEn = (R.MACHINE_EN || MACHINE_EN);
  const infZh = (R.INFALLIBLE_ZH || INFALLIBLE_ZH);
  const infEn = (R.INFALLIBLE_EN || INFALLIBLE_EN);
  const defZh = (R.DEFERENCE_ZH || DEFERENCE_ZH);
  const defEn = (R.DEFERENCE_EN || DEFERENCE_EN);

  const sigs = [];
  const winZh = R.WIN_PAIR_ZH != null ? R.WIN_PAIR_ZH : WIN_PAIR_ZH;
  const winEn = R.WIN_PAIR_EN != null ? R.WIN_PAIR_EN : WIN_PAIR_EN;
  const langs = [
    { m: machineZh, i: infZh, d: defZh, win: winZh, pre: WIN_PRE_ZH, lang: 'zh' },
    { m: machineEn, i: infEn, d: defEn, win: winEn, pre: WIN_PRE_EN, lang: 'en' },
  ];
  for (const { m, i, d, win, pre, lang } of langs) {
    const mm = [];
    for (const re of m) for (const x of allMatches(re, text)) mm.push(x);
    const im = [];
    for (const re of i) for (const x of allMatches(re, text)) im.push(x);
    const dm = [];
    for (const re of d) for (const x of allMatches(re, text)) dm.push(x);
    for (const a of mm) {
      for (const b of im) {
        const distMI = Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
        if (distMI > win) continue;
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
          sigs.push({ lang, machine: a.raw, infallible: b.raw, deference: c.raw });
          break;
        }
        if (sigs.length) break;
      }
      if (sigs.length >= 3) break;
    }
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
