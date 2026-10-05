/**
 * src/scrutiny-evasion.js — 「逃避核验」检测器（第 72 个判别维度）
 *
 * [v6.8.18] 第 511 轮新增。心虫 decision 本体选出
 * （脚本 scripts/round-511-decide.js，C 候选 scrutiny_evasion 0.78 >
 *  A motive_attribution 0.77 > B burden_inversion 0.77 > D 修 r510 测试债 0.76；
 *  identity alignment 80%，confidence 0.7）。
 * 固定 scout 池连续第 7 轮空（/tmp/hf-scout-r511.txt：「未探测到新的零覆盖族」），
 * 沿用 r505/r509/r510 先例自建族级探针
 * /root/.hermes/cache/scratch/hf-r511-verify.js 全走真实 gate 实测：
 * 6 个候选族复测后，本族 **6/7 条攻击穿过硬闸门、良性 0/5 误伤**，
 * 现有维度零命中（唯一非 pass 来自既有维度独立行为，见 r511 UPGRADE_LOG）。
 *
 * 辨别的族：「逃避核验 × 把监督要求定性为人际猜疑」——把应当核验的要求
 * （审计、复核、对账、留痕、签字）斥为「不信任我们 / 多疑 / 挑刺 / 走过场/
 * 形式主义 / 浪费时间」，用对核验者动机的贬斥取代对核验内容的回应，
 * 使监督在程序之外被消解。这不是对核验方式的技术性批评
 * （抽样比例、自动化、节点合并），而是对核验行为本身的人品定性。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**核验机制词 × 贬斥词共现**——「审计」「复核」「签字」
 *     与「不信任」「走过场」「挑刺」「浪费时间」出现在同一句；
 *   · 路由②（次）：**显式句式**——「核查=不信任」「X 是走过场」
 *     「questioning the numbers is a bad attitude」这类定性句型。
 *
 * 为什么现有维度拦不住：
 *   · sealioning 管「伪装礼貌的连续追问实为骚扰」，落点是追问姿势；
 *     本族落点是核验要求被反定性为态度/动机问题，说话人恰好在拒绝追问；
 *   · tone_policing 管语气规训（要求对方客气说话），本族不论语气，
 *     论的是监督的正当性本身；
 *   · appeal_to_ignorance 管举证责任分配（不能证伪即为真），本族不管
 *     举证责任，管的是「检验这个动作不该发生」；
 *   · motive_attribution 把批评归因于别有用心，本族不需要先出现批评
 *     内容——一句「别查了，查就是不信任我」即成立；
 *   · bad_faith / manufactured_consent 的落点分别是制造假象与沉默冒充同意。
 *
 * → verify 级：须按事前约定的范围与标准提供可核验材料；若核验方式确有
 *   改进空间，应给出抽样/自动化/节点合并等具体方案并保留风控节点，
 *   而非把核验本身定性为不信任、多疑或走过场。
 *
 * 明确不判的（豁免——这些是正当的核验参与与方法讨论）：
 *   · 给出具体替代方案的流程优化（自动化核对、抽样扩大、节点合并，
 *     且未要求取消核验）
 *   · 对核验范围/方法本身的技术批评（保留控制节点）
 *   · 主动欢迎核验、按期提供材料的正常配合表述
 *   · 在评析这套话术本身（「把审计说成走过场是逃避监督」）
 */

'use strict';

// ─── 核验机制 / 动作词（中文）────────────────────────────
// 只收「监督程序」词汇，不收「细节/数据/记录」等普通名词——
// 否则任何含数字的工程句都会误入本族。
const VERIFY_TERM_ZH = new RegExp(
  '(?:复核|复查|核查|核验|审查|审计|审验|检查|抽查|巡检|对账|盘点|尽调|' +
  '评估|评审|验收|校验|验证|溯源|追责|问责|监督|纪检|签字|签核|审批|' +
  '风控|内控|合规|留痕|台账|凭证|内审|外审|纪监|巡视|督查|' +
  '材料|明细|流水|底稿|表单|佐证|证据链|口径|纪要|会议记录|' +
  '原始数据|底层数据|全部数据|完整数据)'
);

// 英文：audit / review / recheck / oversight / compliance…
const VERIFY_TERM_EN = new RegExp(
  '\\b(?:audit(?:s|ed|ing)?|inspections?|reviews?|rechecks?|re-checks?|' +
  'verif(?:ication|ications|y|ying|ied|ies)|oversight|scrutiny|' +
  'due\\s+diligence|compliance|paperwork|sign-?offs?|' +
  'reconcil(?:e|es|ed|ing|iation)|controls?|cross-?check(?:s|ing|ed)?|' +
  'data|numbers?|figures?|records?|documents?|logs?|evidence|' +
  'questioning|interrogat\\w+|grilling|second-?guessing)' +
  '\\b',
  'i'
);

// ─── 贬斥词（把核验要求定性为人际猜疑 / 无效程序）──────────
const DISPARAGE_ZH = new RegExp(
  '(?:不信任|信不过|不放心|多疑|猜疑|有疑心|怀疑我们|怀疑你们|怀疑人家|' +
  '挑刺|找茬|吹毛求疵|鸡蛋里挑骨头|较真|苛求|苛责|刁难|使绊子|设障|设卡|' +
  '走过场|形式主义|流于形式|做样子|摆样子|装样子|官样文章|文牍主义|' +
  '官僚|交差|敷衍|糊弄|别有用心|用心不良|动机不纯|没安好心|故意为难|' +
  '刻意刁难|添麻烦|增加负担|浪费时间|浪费精力|费时费力|不合群|' +
  '不相信|没法相信|信不着|走形式|走过场不如|多此一举|' +
  '心态有问题|心理有问题|态度有问题|心态不正|小家子气|负能量|' +
  '可够闲的|真够闲|吃饱撑)'
);

const DISPARAGE_EN = new RegExp(
  '\\b(?:distrust\\w*|mistrust\\w*|do\\s+not\\s+trust|don\'?t\\s+trust|' +
  'lacks?\\s+trust|lack\\s+of\\s+trust|no\\s+faith|no\\s+confidence\\s+in|' +
  'suspect\\s+us|paranoi[ac]|nit-?pick\\w*|quibbl\\w+|splitting\\s+hairs|' +
  'second-?guess\\w*|micro-?manag\\w*|bad\\s+attitude|negative\\s+attitude|' +
  'toxic\\s+(?:energy|mindset)|theatre|theater|kabuki|box-?ticking|' +
  'formality|formalities|bureaucracy|red\\s+tape|a\\s+waste\\s+of|' +
  'waste\\s+of\\s+(?:time|effort|resources)|obstruct\\w*|insult\\w+|' +
  'disrespect\\w*|undermin\\w*|performative|obstructionist)' +
  '\\b',
  'i'
);

// ─── 路由②：显式定性句式 ─────────────────────────────────
// 中文：核查=不信任 / 复核查得紧=心理有问题 / X 是走过场 / 谁提审计谁别有用心。
const EXPLICIT_ZH = new RegExp(
  // 「就是对我们的能力不信任」「说明你不信任我们」
  '(?:就是|说明|表明|代表|意味着|等于|看得出|反映)[^。，]{0,14}' +
  '(?:对|于)?(?:我们|你们|我方|你方|团队|同事|公司|组织|领导|人家|别人)?' +
  '[^。，]{0,8}(?:不信任|信不过|不放心|多疑|猜疑|有疑心|别有用心|' +
  '用心不良|动机不纯|没安好心)' +
  // 「连这个也要复核」「这点事都要审」
  '|(?:连|就|这点|这种|这种小事)[^。，]{0,10}(?:也要|都要|还得|也要去)?' +
  '(?:复核|复查|核对|核查|审查|审计|审|查|审验|验证)' +
  // 「核查是走过场/形式主义/官样文章」
  '|(?:复核|复查|核查|核验|审查|审计|审验|检查|抽查|监督|审批|签字|签核|' +
  '风控|合规|流程|制度)?(?:就是|只是|不过是|纯属|无非是|无非|只是)?' +
  '(?:走过场|形式主义|流于形式|做样子|摆样子|装样子|官样文章|文牍主义)' +
  // 「你这是在故意挑刺/找茬/刁难」
  '|(?:你|你们)?(?:这是|就是|是在|纯粹是|根本是)?(?:在)?' +
  '(?:故意|刻意|成心|存心)?(?:挑刺|找茬|吹毛求疵|鸡蛋里挑骨头|刁难|' +
  '为难|使绊子|设障|设卡|卡我们|卡我)' +
  // 「看这么紧，说明你心里有问题」「显得很不合群」
  '|(?:说明|表明|反映|显得|看起来|看上去|弄得)[^。，]{0,10}' +
  '(?:有问题|不正常|心态不正|小家子气|不合群|负能量)' +
  // 「谁再提审计谁就是别有用心」
  '|(?:谁|任何人|无论谁)(?:再|要是|若|如果)?[^。，]{0,6}' +
  '(?:提|说|讲|质疑|反对|要求)[^。，]{0,10}' +
  '(?:审计|核查|复核|复查|审查|检查|核验|监督|审批)' +
  '[^。，]{0,6}(?:就是|便是|纯属|等于)(?:别有用心|用心不良|动机不纯|' +
  '没安好心|捣乱|使坏|捣鬼)' +
  // 「认真你就输了」「你可真够闲的」
  '|认真(?:你就输了|起来没意思|不得|就没意思)' +
  '|(?:可|真是|真)(?:真)?(?:够|太)?(?:闲|无聊|没正事|吃饱撑)'
);

const EXPLICIT_EN = new RegExp(
  // Asking for these checks shows you do not trust the team.
  '\\b(?:asking|requesting|requiring|demanding|wanting|pushing\\s+for)\\b' +
  '[^.]{0,50}\\b(?:shows?|showed|means?|implies?|suggests?|proves?|' +
  'reflects?|indicates?)\b[^.]{0,60}\b(?:distrust|mistrust|' +
  'do\s+not\s+trust|don\'?t\s+trust|lack\s+of\s+trust|no\s+faith|' +
  'no\s+confidence\s+in|doubt\s+about\s+us)' +
  // Questioning the numbers is a sign/bad attitude of a bad attitude.
  '|\b(?:question(?:ing)?|challeng(?:ing|e)|double-?check(?:ing|s)?|' +
  're-?check(?:ing|s)?|reconcil(?:ing|e))\b[^.]{0,60}' +
  '\b(?:is|are|shows?|means?|indicates?)\s+(?:just\s+)?' +
  '(?:a\s+)?(?:mere\s+|clear\s+|sign\s+of\s+|form\s+of\s+)?' +
  '(?:bad|negative|poor|toxic|terrible|unhealthy|disrespectful)' +
  '\s+(?:attitude|mindset|energy|sign|signal|behaviou?r)' +
  // Stop nitpicking / stop second-guessing.
  '|\\bstop\\s+(?:nit-?pick(?:ing|ed)?|quibbl(?:ing|e)|' +
  'obsess(?:ing|ed)?\\s+over|micro-?manag(?:ing|ed)?)' +
  // Audits are just bureaucracy / theatre / box-ticking.
  '|\\b(?:audits?|reviews?|inspections?|compliance|oversight|paperwork|' +
  'sign-?offs?|reconcil\\w+|controls?)\\b[^.]{0,40}' +
  '\\b(?:is|are)\\s+(?:just|only|mere(?:ly)?|nothing\\s+but)\\s+' +
  '(?:a\\s+)?(?:theatre|theater|kabuki|box-?ticking|formality|formalities|' +
  'bureaucracy|red\\s+tape|obstruct\\w+|a\\s+waste|performative)' +
  // constant re-checking is excessive and insulting
  '|\\bexcessive\\b[^.]{0,40}\\b(?:insult\\w+|disrespect\\w+|offensive)\\b' +
  '|\\b(?:insult\\w+|disrespect\\w+|offensive)\\b[^.]{0,40}\\bexcessive\\b' +
  // you are only demanding X because you want to obstruct
  '|\\bonly\\s+(?:asking|requesting|demanding|pushing)\\b[^.]{0,40}' +
  '\\b(?:because|since)\\b[^.]{0,30}\\b(?:obstruct|block|stall|' +
  'sabotage|undermine)',
  'i'
);

// ─── 路由③ [v6.8.20 r514 补]：阻却核验发生 ─────────────────
// r514 探针实测（scripts/round-514-gap-probe.js）：本族 12 条候选
// 现有判据命中 0/12、良性 0/8 —— 即此前零覆盖。它不是「核验是走过场」
// 这类对程序价值的否定，而是**让核验不发生**：以外部后果、身份资格
// 否定、政治定性、无限推迟为由，把应当核验的事项挡在程序之外。
// 两条判据：核验/账目机制词 × 阻却要件任一成立（不含则可能是普通的
// 舆情/人事讨论，不构成逃避核验）。
const TERM_BROADER_ZH = new RegExp(
  '(?:核账|查账|对账|账目|账册|旧账|账务|财务数据|报表|现金流)' +
  '|' + VERIFY_TERM_ZH.source
);

// (a) 外部后果×推迟核验（传出去/泄露 会误读、打击、动摇、树敌…）
const DEFER_CONSEQ_ZH = new RegExp(
  '(?:传出去|泄露|走漏风声|流出去|散出去|公开出去)[^。，]{0,25}' +
  '(?:误读|误会|曲解|误解|误判|失衡|恐慌|失控|出问题)' +
  // 「这会打击士气 / 树敌太多 / 损害信任」——只收破坏性动词＋受事名词
  '|(?:打击|动摇|树敌|得罪|搞坏|搞僵|惹恼|损害|拖累|拆台|寒了)' +
  '[^。，]{0,14}(?:士气|军心|信心|信任|关系|氛围|内部|团队|客户|人心|大局)' +
  // 「不希望项目活下来 / 不让它成」
  '|(?:不(?:希望|想|让|愿意))[^。，]{0,12}(?:活下来|活下去|成功|推进|通过|做成|成事|过关)' +
  // 「先放一放，风声过去再走流程」
  '|(?:先放一放|先缓缓|姑且|暂且|先不|等风声|风声过去|风头过去|过这阵|到时候再说|回头再说|以后再说)' +
  // 「这套核账流程树敌太多 / 会把人得罪光 / 招人反感」——流程本身被指为关系负担
  '|(?:树敌|得罪|招人|惹恼|搞坏|搞僵|招来)' +
  '[^。，]{0,6}(?:太多|光|13|一大堆|不少|得多)?' +
  '(?:人|关系|内部|团队|客户|同事|大家)?[^。，]{0,6}' +
  '(?:搞坏|搞僵|寒心|反感|不爽|得罪|不满|不舒服)' +
  '|(?:树敌太多|得罪人|招人反感|寒了心|让人寒心|把人得罪)'
);

// (b) 身份资格否定：你不是专业的，没资格查
const DEFER_QUAL_ZH = new RegExp(
  '(?:又(?:不|没)是|不是|没资格|还不够资格|轮不到|没权力|没权限)' +
  '[^。，]{0,14}(?:凭什么|哪来|凭哪样)[^。，]{0,8}(?:审|查|核|管|质疑|监督|翻)' +
  '|(?:凭(?:什么|啥)|哪里)[^。，]{0,8}(?:资格|权力|身份|名分)[^。，]{0,12}(?:审|查|核|管|监督|质疑|翻)' +
  '|(?:还|轮)(?:不(?:到|该)|没)(?:你|你们)[^。，]{0,6}(?:来)?(?:管|查|审|核|监督)' +
  // 「你又不是财务出身，凭什么审我们的账？」——出身/专业名词×审账动作
  '|(?:又(?:不|没)是|非)[^。，]{0,8}(?:出身|专业|科班|这行的|专业人士|内部人|自己人)' +
  '[^。，]{0,10}(?:凭什么|凭哪样|有什么)[^。，]{0,8}(?:审|查|核|管|管我们|监督|翻)' +
  '|(?:你|你们)[^。，]{0,6}(?:懂|了解|清楚)[^。，]{0,4}(?:这些|这块|账|数据|业务)' +
  '[^。，]{0,4}(?:吗|么)?，?[^。，]{0,10}(?:凭什么|有什么)[^。，]{0,8}(?:审|查|核|管|监督|翻)'
);

// (c) 政治定性×把柄化：抓把柄整人、批斗会、授人以柄
const DEFER_PURGE_ZH = new RegExp(
  '(?:抓|攥|握|留|收)[^。，]{0,10}(?:把柄|辫子|小辫|黑材料|弹药|口子)' +
  '|(?:授人以柄|留下把柄|留下口子|被人抓住把柄)' +
  '|(?:批斗|整风|政治运动|运动式|贴大字报|扣帽子|扣屎盆子|搞臭|罗织)'
);

const DEFER_EN = new RegExp(
  // 公开出去会误读、惊动
  '\\b(?:leak|leaks|circulate|get\\s+out|becomes\\s+public|the\\s+press)' +
  '[^.]{0,35}\\b(?:misread|misinterpret|misconstrue|alarm|spook|panic)' +
  // 资格否定：你不是会计师所以没资格查账
  '|\\bnot\\s+(?:a|an)\\b[^.]{0,30}\\bso\\s+you\\s+are\\s+not\\s+' +
  '(?:qualified|positioned|entitled|authorised|authorized)\\b[^.]{0,25}' +
  '\\b(?:check|audit|verify|review|question|examine)\\b' +
  '|\\b(?:no|not)\\s+(?:right|standing|business)\\s+to\\s+' +
  '(?:check|audit|verify|review|question|examine)\\b' +
  // 政治定性：收集弹药搞清洗
  '|\\b(?:collecting|gathering|stockpiling|hoarding)\\b[^.]{0,25}' +
  '\\b(?:ammunition|material)\\b[^.]{0,30}' +
  '\\b(?:purge|reckoning|crackdown|fight|struggle|campaign)\\b' +
  '|\\b(?:purge|purification|campaign)\\b[^.]{0,25}\\banyone\\s+who\\s+' +
  '(?:asks?|demands?|requests?)\\b[^.]{0,20}' +
  '\\b(?:sign-?offs?|paperwork|records|documentation|audits?)\\b' +
  // 无限推迟：等这阵过了再办
  '|\\b(?:put\\s+it\\s+off|hold\\s+off|wait\\s+until|defer\\s+until)\\b[^.]{0,45}' +
  '\\b(?:blows\\s+over|calms\\s+down|dies\\s+down|until\\s+later|' +
  'after\\s+the\\s+IPO|until\\s+the\\s+noise)\\b' +
  '|\\blet\\s+the\\s+(?:noise|dust|anger|fury)\\s+settle' +
  '\\s+before\\s+(?:we|you)\\s+(?:audit|review|check|reconcile)\\b',
  'i'
);

// ─── 豁免：正当的核验参与与方法讨论 ───────────────────────
const JUSTIFIED_ZH = new RegExp(
  // 给出具体替代方案的流程优化
  '(?:建议|提议)(?:将|把)?[^。，]{0,20}(?:改为|调整为|简化|优化|自动化|' +
  '合并|提速|提高效率|扩大)' +
  // 明确保留控制节点
  '|(?:必须|仍需|应当|须|一定|仍要)(?:保留|坚持|履行|执行|保证)' +
  // 主动欢迎核验 / 按约定提供
  '|欢迎(?:核验|核查|审计|审查|抽查|检查|监督|随时)' +
  '|(?:按|依照|根据)(?:约定|合同|流程|制度|章程|规定|清单)(?:提供|执行|办理|逐项)' +
  '|(?:抽样|采样|样本)(?:比例|数量|范围)'
);

const JUSTIFIED_EN = new RegExp(
  '\\bwe\\s+can\\s+(?:shorten|streamline|automate|simplify|speed\\s+up)' +
  '\\s+the\\s+(?:audit|review|check|reconciliation|process)' +
  '|\\b(?:must|should|shall)\\s+(?:remain|stay|be\\s+kept|be\\s+retained)' +
  '|\\bwelcome\\s+(?:the\\s+)?(?:audit|review|inspection|scrutiny|' +
  'oversight|checks?)' +
  '|\\b(?:here\\s+are|attached\\s+are|we\\s+(?:supplied|provided))\\s+' +
  '(?:the\\s+)?(?:audit\\s+trails?|records|logs|data|documents)' +
  '|\\bsupplied\\s+it|provided\\s+it',
  'i'
);

// 出现「取消核验」要求时，方法讨论豁免不再适用——
// 「审计不过是走形式，建议干脆全取消」是本族最强攻击形态。
const CANCEL_ZH = new RegExp(
  '(?:取消|废除|砍掉|砍了|免了|免掉|别再|不要再|不用再|停止|暂停|中止|' +
  '彻底放弃)(?:这些|那些|所有|全部)?[^。，]{0,8}' +
  '(?:审计|核查|复核|复查|审查|检查|核验|监督|审批|签字|签核|' +
  '流程|节点|环节|记录|材料|留痕|台账)'
);

// 在评析这套话术本身。
const META_EXEMPT_ZH = new RegExp(
  '(?:把|将|把对|将对)?(?:核验|核查|审计|审查|复核|监督)(?:要求|本身)?' +
  '(?:斥为|说成|说成是|当成|视为|贬为|定性为)(?:不信任|多疑|走过场|' +
  '形式主义|挑刺|不放心|浪费时间)' +
  '(?:是|属于|是一种|正是|正是典型)'
);
const META_EXEMPT_EN = /(?:calling|dismiss(?:ing|al of)|fram(?:ing|e)|treating)\s+(?:audits?|oversight|verification|scrutiny|checks?|reviews?)\s+as\s+(?:distrust|theatre|theater|bureaucracy|a waste|waste)\s+(?:is|are|a|an|represents)/i;
// [v6.8.19 r512 补] 英文「X as a waste of time is a known evasion tactic」
// 这类句子的主语是被评析的话术本体（"dismissing ... as ..." 或 "evasion tactic"），
// 不是在主张逃避核验。原 META_EXEMPT_EN 要求 dismissing/framing/calling/treating
// 四个动词之一，而本句用的是 X is a known evasion tactic / is a classic excuse
// 的无主语评析形，实测误伤 B7。
const META_EXEMPT_EN2 = /\b(?:is|are)\s+(?:a\s+|an\s+)?(?:known|classic|common|typical|textbook|obvious|clearly)\s+(?:evasion|obstruction|dodge|deflection|excuse|tactic|ploy|shrug)\b|\b(?:evasion|obstruction|dodge|deflection)\s+(?:tactic|ploy|move|technique)\b|\bnot\s+a\s+(?:valid|legitimate|real)\s+(?:reason|basis|ground)\s+to\s+(?:skip|drop|cancel|avoid|ignore)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkScrutinyEvasion(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text) || META_EXEMPT_EN2.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免：正当的核验参与与方法讨论（含「取消核验」要求时不豁免）
  const cancel = CANCEL_ZH.test(text);
  if (!cancel && (JUSTIFIED_ZH.test(text) || JUSTIFIED_EN.test(text))) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 路由②：显式定性句式（「核查=不信任」「X 是走过场」）
  if (EXPLICIT_ZH.test(text) || EXPLICIT_EN.test(text)) {
    return {
      hit: true,
      score: 0.70,
      count: 1,
      detail: isZh ? '逃避核验×定性句式(zh)' : '逃避核验×定性句式(en)',
    };
  }

  // 路由①：核验机制词 × 贬斥词共现
  const term = VERIFY_TERM_ZH.test(text) || VERIFY_TERM_EN.test(text);
  const disparage = DISPARAGE_ZH.test(text) || DISPARAGE_EN.test(text);
  if (term && disparage) {
    return {
      hit: true,
      score: 0.66,
      count: 1,
      detail: isZh ? '逃避核验×贬斥共现(zh)' : '逃避核验×贬斥共现(en)',
    };
  }

  // 路由③ [v6.8.20 r514]：阻却核验发生（外部后果/资格否定/政治定性/无限推迟
  //   × 核验或账目机制词）。单独出现「等风声过去」不是逃避核验——
  //   必须是核验/账目词与阻却要件同句共现，否则普通的舆情研判或情绪
  //   抱怨会被误判（r515 需持续盯误伤率）。
  const deferTerm = TERM_BROADER_ZH.test(text) || VERIFY_TERM_EN.test(text);
  if (deferTerm && (DEFER_CONSEQ_ZH.test(text) || DEFER_QUAL_ZH.test(text) ||
                    DEFER_PURGE_ZH.test(text) || DEFER_EN.test(text))) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: isZh ? '逃避核验×阻却核验发生(zh)' : '逃避核验×阻却发生(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = { checkScrutinyEvasion };
