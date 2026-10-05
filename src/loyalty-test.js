/**
 * src/loyalty-test.js — 「忠诚度测试」检测器（第 67 个判别维度）
 *
 * v6.8.9 新增。心虫 decision 本体选出（scripts/round-499-decide3.js，
 * A 候选 0.88 分 > B proportionality_distortion 0.84 / C fault_line_amplification
 * 0.82 / D selective_minimization 0.78 …；identity alignment 80%）。
 * 探测器固定池本轮已空（heartflow-upgrade-scout.sh 连跑两次输出
 * 「未探测到新的零覆盖族」），自建族级探针 round-499-cand-probe.js
 * 实测 10 个族，本族 **6/6 条攻击穿过硬闸门、良性 0/2 误伤**；
 * 复测探针 round-499-loyalty-probe.js 扩样后 **10/11 穿过、良性 0/6**。
 *
 * 辨别的族：「站队资格审查替代事实讨论」——把讨论对象从「证据与结论」
 * 偷换成「你的立场站在哪边」，从而使异议本身变成不忠的证据。
 * 攻击形状（三条件，L1 × L2 两交叉）：
 *   · 立场质询：先表态跟不跟我一路 / 证明你是自己人 / 你到底站哪边
 *   · 不信任推定：立场有问题 / 不是一条心 / 忠诚度有问题 / 站在对面
 *   · 撤出对话：别的都不用谈 / 意见一律不用听 / 反馈不算 / 说什么都没用
 *
 * 为什么现有 66 维拦不住：
 *   · false_dilemma 管「排除第三选项」的二元压迫，本族不必然给出两个选项，
 *     核心招式是**用忠诚资格审查取消对方发言资格**；
 *   · social_norm 管「大家都这样」的经验性从众，本族要求的是**对特定
 *     对象/权威的个人效忠宣示**，与人数无关；
 *   · manufactured_consent 管程序被短路（沉默=同意），本族是**人的资格
 *     被短路**（不忠=无发言权）；
 *   · normalization_of_deviance 管既往偏差免处置，本族不管过去，只管当下
 *     的身份审查；
 *   · presupposition 管预设陷阱，本族的断言主体是「你的立场可疑」。
 *
 * 判据（L1 × L2，任一语言分支内成立即命中）：
 *   L1 忠诚框架在场 —— 立场/站队/自己人/一条心/忠诚/效忠/对面/这边
 *       / loyalty / on my side / part of this team
 *   L2 资格取消或立场强索 —— 别的都不用谈 / 一律不用听 / 不算数 / 先证明 /
 *       does not count / prove where your loyalty lies
 *   → rewrite 级：须把「质疑观点」与「忠诚问题」分开陈述；涉密/合规岗位的
 *     背景审查是另一回事，须给出制度依据与适用范围。
 *
 * 明确不判的（豁免——这些是正当的资格与纪律陈述）：
 *   · 制度性准入：涉密岗位须通过背景审查，这是法律规定的准入条件
 *   · 具名职责划分：我们对合作方有资质与利益冲突申报要求，与立场无关
 *   · 正常立场表述：我支持这个方案，理由是三周的压测数据
 *   · 在评析这套话术本身（「忠诚度测试」是一种操纵手法）
 */

'use strict';

// ─── L1: 忠诚/站队框架在场 ─────────────────────────────────
// 中文：立场 / 站队 / 选边 / 自己人 / 一条心 / 忠诚 / 效忠 / 对面 / 这边。
// 覆盖肯定形（站在我们这边）、否定形（不跟我们一起走）、条件形
// （跟不跟我一路）、疑问强索形（你到底站哪边）。
// 边界：单独说「我支持这个方案」不判（那是正常立场表述），
// 必须与 L2 的资格取消/立场定罪交叉。
const LOYALTY_ZH = /(?:站|划)(?:队|边|界|清界限|清阵营)|(?:你|你们)?(?:到底|究竟)(?:站|选|支持|同)(?:在|哪|哪边|哪一边|哪边|一个|什么|哪个|哪一路上)|(?:跟|和|与|同)(?:不|没)?(?:我|我们|咱们|领导|老板|老大|上司|头)(?:站|走)?(?:在|到)?(?:一起|一路|一边|同一条|一块)|(?:一条心|一条路|一条道|一个鼻孔|自己人|内部人|圈内人|亲信|嫡系|心腹)|(?:忠诚|效忠|尽忠|忠心)(?:度|问题|测试|表态|宣誓|表明)?|(?:立场|站位|屁股)(?:也|都|还|却|根本)?(?:问题|站队|不正|有问题|在哪边|坐在哪边|站不住)|(?:对面|敌面|反方|另一边|我们这边|他们那边|对面阵营)(?:那边|这边|的人|阵营|那边去)?|(?:不|没)(?:跟|和|与)(?:我们|我|领导)(?:站|走)(?:在|到)?(?:一起|一路|一边)|(?:不是|算不上|算不上是)(?:我们|咱们|自己|内部|圈内)(?:内部|圈内|嫡系|亲信)?的?(?:人|队伍|团队|一伙|一党)|(?:支持|拥护|声援)(?:不|没)?(?:我|我们|咱们|领导|老板|老大)|(?:我|我们|咱们|领导|老板|老大)(?:是|是不是|才是)(?:你|你们)?(?:唯一|真正|该)?(?:支持|拥护|跟随)的?(?:人|对象|领导)?/;

// 英文：take a side / pick a side / on my side / one of us / loyalty。
// 覆盖条件形（if you were on my side）、身份剥夺（not part of this team）、
// 定罪形（part of the problem / part of the opposition）。
const LOYALTY_EN = /\b(?:take|pick|choose|declare)\s+(?:a\s+)?(?:side|team|position)\b|\bwhose\s+side\s+are\s+you\s+on\b|\b(?:are\s+you\s+)?(?:with\s+us|on\s+(?:my|our)\s+side|for\s+(?:us|me))\s+or\s+(?:against\s+us|the\s+enemy)\b|\b(?:one\s+of\s+(?:us|them)|not\s+one\s+of\s+us)\b|\bon\s+(?:my|our|the\s+wrong)\s+side\b|\breally\s+(?:on|part\s+of)\s+(?:my|our)\s+(?:side|team)\b|\bnot\s+really\s+(?:on|part\s+of|one\s+of)\s+(?:my|our|this|the)\s+(?:side|team|group|organization|crew)\b|\bwere\s+(?:really\s+)?(?:on\s+my\s+side|one\s+of\s+us)\b|\bpart\s+of\s+(?:the\s+)?(?:problem|opposition|other\s+side|rebel\w*)\b|\bloyal(?:ty)?\s*(?:test|check|question)?\b|\bprove\s+(?:your|where\s+your)\s+(?:loyal(?:ty|ty)|allegiance|commitment)\b|\b(?:your\s+)?loyalty\s+(?:is|lies)\b|\bwhose\s+(?:side|loyalties)\b|\b(?:tell|prove|state|declare)\s+(?:me|us\s+)?(?:which|whose)\s+side\s+you\b|\bwhich\s+side\s+you\s+(?:are\s+on|support|back|stand\s+with)\b|\bprove\s+(?:which|whose)\s+side\b/i;

// ─── L2: 资格取消 / 立场定罪 / 前置审查 ──────────────────────
// 本族的核心机制：把「异议」重新定义为「不忠」，从而取消对方参与讨论的
// 资格。因此第二个条件有三支，任一在场即与 L1 交叉成立：
//   L2a 资格取消 —— 发言/反馈/意见被判无效（不用听/不算数/免谈/没资格）
//   L2b 立场定罪 —— 质疑本身被定性为站错边（就是站在对面/part of the problem）
//   L2c 效力取消或前置审查 —— 说得再好也没用 / 先证明立场再谈
const DISQUALIFY_ZH = /(?:别的|其他|剩下|接下来的|再)(?:都)?(?:不用|无须|无需|不必要|甭)(?:谈|说|讲|聊|讨论|商量|提|论)|(?:意见|建议|看法|观点|反馈|提案|方案|想法|质疑|反对|批评)(?:一律|全都|全部|统统|也|均)?(?:不用|无须|无需|不)(?:听|采信|算|算数|理会|考虑|参考|看)|(?:不|没)(?:算|算不得|不作数|无效)(?:数|考虑|采信|认可)?|(?:免谈|没什么好谈|谈不上|不配谈|没资格(?:谈|说|讲|提|发表|参加|参与)|不够格(?:谈|说|讲|提|参加))|(?:立场|忠诚|站位)(?:不|有问题|可疑|不正|站不住)(?:的人|者|家伙|东西)?|(?:再说|再谈|谈都)(?:不用|不必|免了|没用|不起作用)|(?:就是|便是|等于|说明|意味着|证明(?:了)?你)(?:站(?:在|错)|坐(?:在|错))?(?:对面|对立面|反方|另一边|外面|敌人)?(?:那边|这边|阵营|的人)?|(?:先|必须|得)(?:证明|表明|表态|宣誓|承诺)(?:你|你们)?(?:的)?(?:立场|忠诚|站位|态度|身份|忠心)|(?:谈|说|讲)(?:什么|啥)(?:专业|技术|道理|意义|用|资格)|(?:方案|话|道理|理由|数据|报告|复盘)(?:说|讲|写)(?:得)?(?:再)?(?:好|对|有理|准确|靠谱)(?:也)?(?:没用|不算|白搭|白费|无济于事|没有意义)|(?:先|必须|得|要)(?:说|讲|表态|给)(?:清楚|明白)?(?:你|您)?(?:到底|究竟)?(?:支持|站|同|拥护)(?:不|没)?(?:支持|拥护)|(?:整篇|全部|全篇|整份|所有)(?:都)?(?:不用|无须|不)(?:看|读|听|理)|(?:不用|无须|无需|不)(?:参加|参与|列席|旁听)|(?:现在|立刻|马上)?(?:就|必须|得|要)(?:给|说|讲|表)(?:个|一个)?(?:清楚|明白|说法|态)|(?:给|说|讲)(?:我|我们|领导)(?:一个)?(?:清楚|明白)的?(?:说法|交代|答复)/;

// 英文：does not count / not part of this team / prove where your loyalty
// lies / in no position to comment / makes you part of the problem。
const DISQUALIFY_EN = /\b(?:your|their|his|her)\s+(?:feedback|input|opinion|view|objection|concerns?|suggestions?|stand|position)\s+(?:does\s+not|doesn'?t|do\s+not|don'?t)\s+(?:count|matter|carry\s+(?:any\s+)?weight|register)\b|\b(?:nobody|no\s+one)\s+(?:will|needs\s+to|has\s+to)\s+(?:listen|hear|take)\s+(?:to\s+)?(?:you|him|her|them|your|their)\b|\b(?:we|there\s+is)\s+(?:are\s+)?(?:not\s+going\s+to\s+)?(?:discuss|talk\s+about|entertain)\s+(?:this|anything|it)\s+(?:until|unless)\s+(?:you|he|she|they)\s+(?:prove|show|demonstrate)\b|\bin\s+no\s+position\s+to\s+(?:comment|judge|object|criticize)\b|\b(?:your|their)\s+(?:opinion|view|input)s?\s+(?:are|is)\s+(?:irrelevant|invalid|worthless|not\s+welcome)\b|\bnot\s+entitled\s+to\s+(?:an\s+opinion|comment|a\s+say|weigh\s+in)\b|\bprove\s+(?:yourself|your\s+loyalty|allegiance)\s+(?:first|before)\b|\buntil\s+you\s+(?:prove|demonstrate|show)\s+(?:where|whose\s+side)\b|\bmakes?\s+you\s+(?:part\s+of\s+the|one\s+of\s+the)\s+(?:problem|opposition|obstacle)\b|\bnot\s+really\s+(?:part\s+of|one\s+of)\s+(?:this|the)\s+(?:team|group|organization|crew)\b|\b(?:you|they)\s+(?:would|will)\s+not\s+(?:ask|say|question)\s+(?:that|this|it|such)\b|\bwould\s+not\s+(?:ask|say|question)\s+that\s+if\b|\bno\s+(?:point|use)\s+(?:in\s+)?(?:explaining|discussing|arguing)\b|\b(?:can'?t|cannot|can\s+not)\s+(?:take|consider|weigh)\s+(?:your|their|his|her)\s+(?:objection|concerns?|feedback|input|view|opinion|report)\s+seriously\b|\b(?:your|their)\s+(?:whole\s+)?(?:report|analysis|review|write[- ]up|assessment)\s+(?:is\s+)?(?:not\s+worth\s+(?:reading|reviewing)|does\s+not\s+(?:need|deserve)\s+(?:to\s+be\s+)?(?:read|review(?:ed)?|considered))\b|\b(?:we\s+)?(?:will\s+)?not\s+(?:read|review|listen\s+to)\s+(?:it|them|anything\s+from)\s+(?:at\s+all\s+)?(?:coming\s+from|from)\s+(?:you|him|her|them)\b|\b(?:he|she|they)\s+(?:is|are)\s+not\s+(?:one\s+of\s+(?:us|our\s+(?:people|team))|part\s+of\s+(?:this|the)\s+(?:inner\s+circle|team|group))\b|\b(?:tell|state|say)\s+(?:me|us)\s+(?:right\s+now\s+)?(?:which|whose)\s+side\s+(?:you\s+are\s+on|you\s+support)\b|\bwhich\s+side\s+(?:are\s+you\s+on|do\s+you\s+(?:support|back))\b|\bstate\s+which\s+side\s+you\s+(?:are\s+on|support)\b|\bnow\s+tell\s+(?:me|us)\s+which\s+side\b/i;

// ─── 豁免：制度性准入 / 具名职责 / 正常立场 ───────────────────
// 制度性准入：涉密岗位的背景审查、安全许可、合规申报——有制度依据在。
const INSTITUTIONAL_ZH = /(?:涉密|保密|机密|安全)(?:岗位|部门|岗位|机房|区域|作业)(?:须|需|必须|要求)(?:通过|经|有)(?:背景|安全|政治|忠诚)?(?:审查|审核|调查|许可|认证|资质)|(?:背景|安全|政治)审查(?:是|为|属于)(?:法律|法规|制度|规定|法定)(?:规定|要求|的)?|(?:法律法规|制度|规章|规定)(?:明确)?(?:要求|规定|明确)(?:须|需|必须|要)?(?:通过|进行)?(?:背景|安全)(?:审查|审核)|(?:利益冲突|亲属关系)(?:申报|备案|声明)(?:是|为)?(?:制度|合规|法定)(?:要求|规定)/;
const INSTITUTIONAL_EN = /\b(?:security\s+)?(?:clearance|background\s+check|vetting)\s+(?:is\s+)?(?:required|mandated|mandatory)\s+(?:by|under)\s+(?:law|policy|regulation|statute)\b|\b(?:conflict[- ]of[- ]interest|disclosure)\s+(?:declaration|filing)\s+(?:is\s+)?(?:required|mandatory)\s+(?:by|under)\s+(?:law|policy|the\s+code)\b|\bstatutory\s+(?:background|security)\s+(?:check|vetting)\b|\bregulated\s+(?:position|role)\s+requires\b/i;

// 具名职责/流程依据：给出具体职责划分或数据理由的正常协作陈述。
const ROLE_BASED_ZH = /(?:职责|分工|权限|授权|准入|门槛)(?:划分|明确|界定|说明|要求)(?:与|和|跟)?(?:立场|忠诚|政见|立场)?(?:无关|分开|区分)|(?:资质|资格|条件)(?:要求|审核|审查)(?:是)?(?:流程|制度|标准|规范)(?:要求|规定|的一部分|的)?|(?:理由|依据|数据|压测|试验|复盘)(?:是|为|见)/;
const ROLE_BASED_EN = /\b(?:role|responsibilit(?:y|ies)|authorit(?:y|ies))\s+(?:is|are)\s+(?:defined|assigned|separate)\b|\bbased\s+on\s+(?:the\s+)?(?:role|responsibilit(?:y|ies)|data|evidence|benchmark|test\s+results)\b|\bthe\s+(?:requirement|criteria|gate)\s+(?:is|are)\s+(?:role[- ]based|evidence[- ]based|process[- ]based)\b|\bjustification\s+(?:is|documented)\s+in\s+the\s+(?:record|minutes|report)\b/i;

// 在评析这套话术本身 → 不是在运用它
const META_EXEMPT_ZH = /(?:忠诚度测试|立场审查|站队压力)(?:是|属于|属于一种|是一种)(?:操纵|操控|胁迫|话术|手法|伎俩|手段)/;
const META_EXEMPT_EN = /\bloyalty\s+test(?:s|ing)?\s+(?:is|are)\s+(?:a\s+)?(?:manipulation|coercion|tactic|rhetorical\s+device)\b|\bappeal\s+to\s+loyalty\s+is\s+(?:a\s+)?(?:fallacy|manipulation)\b/i;

// 正常立场表述（无 L2 交叉时不应命中，这里是显式兜底）
const PLAIN_STANCE_ZH = /(?:我|我们)(?:支持|同意|赞成|赞同|认可)(?:这个|该|此)(?:方案|计划|决定|提案|观点|做法)/;
const PLAIN_STANCE_EN = /\bI\s+(?:support|endorse|agree\s+with|back)\s+(?:this|the)\s+(?:proposal|plan|decision|approach)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkLoyaltyTest(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if ((META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text))) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // L1 忠诚框架
  const loyalty = isZh
    ? (LOYALTY_ZH.test(text) || LOYALTY_EN.test(text))
    : (LOYALTY_EN.test(text) || LOYALTY_ZH.test(text));
  if (!loyalty) return { hit: false, score: 0, detail: '', count: 0 };

  // L2 资格取消 / 立场强索
  const disqualify = isZh
    ? (DISQUALIFY_ZH.test(text) || DISQUALIFY_EN.test(text))
    : (DISQUALIFY_EN.test(text) || DISQUALIFY_ZH.test(text));
  if (!disqualify) return { hit: false, score: 0, detail: '', count: 0 };

  // 豁免：制度性准入 / 具名职责依据 / 正常立场表述
  const institutional = isZh
    ? (INSTITUTIONAL_ZH.test(text) || INSTITUTIONAL_EN.test(text))
    : (INSTITUTIONAL_EN.test(text) || INSTITUTIONAL_ZH.test(text));
  const roleBased = isZh
    ? (ROLE_BASED_ZH.test(text) || ROLE_BASED_EN.test(text))
    : (ROLE_BASED_EN.test(text) || ROLE_BASED_ZH.test(text));
  const plainStance = isZh
    ? (PLAIN_STANCE_ZH.test(text) || PLAIN_STANCE_EN.test(text))
    : (PLAIN_STANCE_EN.test(text) || PLAIN_STANCE_ZH.test(text));
  // 制度依据或具名职责在场 → 正当资格陈述，不判
  if (institutional || roleBased) return { hit: false, score: 0, detail: '', count: 0 };
  // 正常立场表述且无语义上的强索句式时豁免（兜底，L2 已拦住大部分）
  if (plainStance && !/(?:不用|无须|无需|不算|无效|免谈|没资格|不配|先证明|必须证明)/.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  return {
    hit: true,
    score: isZh ? 0.80 : 0.80,
    count: 1,
    detail: isZh ? '忠诚度测试×取消发言资格(zh)' : '忠诚度测试×取消发言资格(en)',
  };
}

module.exports = { checkLoyaltyTest };
