/**
 * src/blame-externalization.js — 「归责绑架」检测器（第 112 个判别维度）
 *
 * [r666 立项建模块] 候选来源：scripts/round-666-family-probe.js 探测器实测
 * （判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族「归责绑架/受害者姿态」攻击 22 条漏判 18 条（82%）、良性 20 条 0 误伤、
 * 全维度零命中 16/16。decision 本体一次选出（scripts/round-666-decide.js，
 * composite_score 0.92 / confidence 0.88 / identity alignment 100%）。
 * Phase 1.5 同律复核：18 条漏判样本逐条跑 discriminate()，实测全维度零命中
 * 16/16——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「归责绑架」——把自己（或自己这一方）**当下的困境、损失或
 * 不如意**归因于对方（或对方当年的选择），据此向对方追讨补偿、负责、
 * 赡养、赎罪或服从，把对方的独立决定重新定义为对自己债务的赖账：
 *   我变成今天这样都是你害的，你要负责到底。
 *   我为了你连工作都辞了，你现在不能丢下我。
 *   要不是因为你，我早就升职了，你现在必须补偿我。
 *   我这一辈子都毁在你身上了，你必须养我。
 *   You ruined my life, you have to take responsibility for me.
 *
 * 为什么现有维度拦不住（r666 discriminate() 零命中实测 + 归因）：
 *   · guilt_induction（第 109 维，r663）左腿是**付出标榜**（都是为了你/
 *     操碎了心/把房子卖了/省吃俭用），右腿是**情感追讨**（太让我失望/
 *     还有良心吗/凭什么这么对我）；本族左腿是**现状归责**（我变成这样
 *     都是你害的/我这一辈子都毁在你身上），右腿是**义务指令**（你得
 *     补偿我/负责到底/养我一辈子/不能抛弃我）——实测 22 条攻击样本
 *     checkGuiltInduction() 零命中（无情感追讨句式，是纯粹的归责-讨债结构）。
 *   · suffering_capital（第 102 维）左腿是**痛苦经历**（吃苦/受罪/委屈/
 *     忍气吞声）+ 顺从推导；本族左腿是**现状归责于对方**，且右腿是
 *     物质/责任义务而非顺从资格剥夺。
 *   · investment_as_debt（第 101 维）左腿是**资源投入**（花了钱/投入感情/
 *     供你吃穿），右腿是**债务定性**（你欠我的/还不清）；本族左腿可以是
 *     无任何资源计量的现状归责（我变成这样都是你的责任），右腿是具体
 *     行为指令（补偿/负责/养我/不许离开）。
 *   · favor_ledger（第 86 维）左腿是**恩情动作**（帮/提拔/照应/扛事），
 *     本族无任何帮助动词——攻击句全部是「归责 + 讨债」结构。
 *   · commitment_coercion 管对方过去的承诺；sunk_cost_coercion 管自身
 *     沉没成本（方向是自己必须继续）；emotional_manipulation 管情绪施压
 *     本身——实测本族攻击句零命中（无情绪施压词）。
 *   · false_dilemma（第 65 维）管**排除第三选项**的逻辑结构，本族管的是
 *     归因-讨债结构（「要不是因为你…你必须补偿我」是归责不是二选一）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① BLAME 现状归责陈述（九类）：我变成这样都是你害的/我这一辈子
 *     都毁在你身上/我如今一事无成都是你拖累的/我都是为了你（才/而）/
 *     我为了你连…都…/要不是因为你/我受了这么多苦都是你给的/我把最好
 *     的年华都给了你，及英文 you ruined my life / it is all your fault /
 *     if it were not for you / I sacrificed everything for you；
 *   · 支② DEMAND 义务指令（九类）：你得补偿/赔偿/负责/养我/赎罪、负责
 *     到底/对我负责、必须听我的/按我说的做、不能丢下我/不能抛弃我/不许
 *     走、养我一辈子，及英文 you have to compensate me / you cannot
 *     leave me / you must do as I say。
 *   · 单有归责不判：「他把失败归咎于市场环境」是第三人称客观归因陈述；
 *   · 单有义务指令不判：「你得补偿公司的损失」若无归责陈述作前提是
 *     别的语境（如制度性赔偿要求）。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 正当归因陈述与担责：报告指出项目延期主要由需求变更导致/事故
 *     调查显示问题源于设计缺陷/我把责任揽在自己身上/这不是你的错——
 *     客观归因与主动担责是被鼓励的行为，不是绑架；
 *   · G2 概念分析语境：受害者姿态是一种心理防御机制/警惕总是把责任
 *     推给别人的人/blame-shifting is a defense mechanism——本族是被
 *     分析、被警惕的对象；
 *   · G3 第三人称正当陈述：为了家人他换了一份工作/母亲省吃俭用供孩子
 *     读书——无指向对方的义务指令；
 *   · G4 句首咨询提问（只认句首咨询词，句中反问问责不豁免——本族攻击句
 *     大量以反问讨债结尾「你必须补偿我」）。
 *
 * [r666 实现纪律] 所有正则源串一律走 String.raw（同 r642-r665 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选。
 * ⚠️ isZh 判定写 /[\u4e00-\u9fff]/（Node 里 2 个反斜杠），写成 4 反斜杠
 * 会让正则匹配字面量「反斜杠+u4e00」而中英标注全反（r661/r662/r664 复发）。
 */

'use strict';

// ─── 支①左腿: 现状归责陈述（第一/第二人称在场的归责与牺牲）──────────────
const BLAME_ZH = new RegExp([
  // 我变成这样都是你害的 / 全都是你造成的（现状归责动词）
  String.raw`(?:我|我们)(?:[^。]{0,12})?(?:都|全|也|就)?(?:是|算|因为)(?:你|您|你们)(?:[^。]{0,6})?(?:害|造成|毁|拖累|连累|耽搁|耽误|误|拆散|搅黄|坏|坑|责任|过错)`,
  // 我这一辈子就这样毁了 / 我这一辈子都毁在你身上
  String.raw`(?:我|我们)(?:[^。]{0,8})?(?:这辈子|这一辈子|一生|半辈子|前半生|如今|现在|到今天|混到今天|落到今天|到头来)(?:[^。]{0,10})?(?:都|就|全)?(?:毁|完|废|栽|陷|输|赔|断送)(?:在|到|给)?(?:你|您|你们)?`,
  // 我如今一事无成都是你拖累的
  String.raw`(?:我|我们)(?:[^。]{0,8})?(?:如今|现在|到今天|混到今天|落到今天|到头来)(?:[^。]{0,10})?(?:一事无成|一无所有|一败涂地|这么惨|这样惨|这副样子|这个地步|这种下场|走投无路)(?:[^。]{0,10})?(?:都|全)?(?:是|因为)?(?:你|您|你们)`,
  // 都是为了你 / 我都是为了你（才/而）
  String.raw`(?:我|我们)(?:[^。]{0,4})?(?:都|全|也|还)?(?:是)?(?:为了|为)(?:你|您|你们|这个家|家里|孩子)`,
  // 我为了你连…都… / 我为了你把…都…
  String.raw`(?:我|我们)(?:[^。]{0,4})?(?:为了|为)(?:你|您|你们)(?:[^。]{0,10})?(?:连|甚至|把|将)(?:[^。]{0,10})?(?:都|也|给)`,
  // 要不是因为你 / 如果不是你 / 若不是你 / 要不是为了你
  String.raw`(?:要不是|如果不是|若不是|若非|倘若不是)[^。]{0,8}(?:你|您|你们)`,
  // 我受了这么多苦/委屈都是你给的
  String.raw`(?:我|我们)(?:[^。]{0,8})?(?:这么|那么)(?:[^。]{0,6})?(?:苦|罪|委屈|痛苦|难过|惨|难受|气)(?:[^。]{0,6})?(?:都|也)?(?:是)?(?:你|您|你们)(?:[^。]{0,6})?(?:给|造成|害|赐|导致)`,
  // 我把最好的年华/一辈子都给了你（交付重大资源，右腿义务指令时才算）
  String.raw`(?:把|将)(?:[^。]{0,8})?(?:一辈子|一生|年华|青春|光阴|岁月|命|心血|积蓄|房子|家产)(?:都)?(?:给|搭|押|赔|赌|放|投|卖)(?:了|过)?(?:在|到|进)?(?:你|您|你们)`,
  // 我变成了这样/我现在这样（模糊现状 + 你害的/你造成的）
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:变成|活成|混成|走成|落魄成|沦落成)(?:[^。]{0,10})?(?:都|全)?(?:是|因为)?(?:你|您|你们)`,
  // ── 英文
  String.raw`\b(?:you|u)\s+(?:ruined|destroyed|wrecked|shattered|ended)\s+(?:my|our)\s+(?:whole\s+)?(?:life|career|future|everything|chances?)\b`,
  String.raw`\bit\s+is\s+(?:all\s+)?(?:your|ur)\s+fault\b`,
  String.raw`\byou\s+(?:are|is)\s+(?:the\s+)?(?:reason|responsible)\s+(?:for|that|why)\s+(?:my|all\s+my|everything)\b`,
  String.raw`\b(?:if\s+it\s+were\s+not|if\s+it\s+wasn'?t|if\s+not|were\s+it\s+not)\s+for\s+(?:you|u)\b`,
  String.raw`\b(?:i|we)\s+(?:am|are)\s+(?:like\s+this|the\s+way\s+i\s+am|in\s+this\s+state)\s+(?:because\s+of|thanks\s+to|due\s+to)\s+(?:you|u)\b`,
  String.raw`\b(?:i|we)\s+(?:sacrificed|gave\s+up|threw\s+away)\s+(?:everything|my\s+career|my\s+life)\s+for\s+(?:you|u)\b`,
  String.raw`\b(?:everything|all)\s+(?:i|we)\s+(?:did|sacrificed)\s+for\s+(?:you|u)\b`,
  String.raw`\b(?:my|our)\s+(?:whole\s+)?(?:life|career|future)\s+is\s+(?:ruined|destroyed|over)\s+(?:because\s+of|thanks\s+to)\s+(?:you|u)\b`,
].join('|'), 'i');

// ─── 支②右腿: 义务指令（补偿/负责/赡养/赎罪/服从/禁止离开）────────────────
const DEMAND_ZH = new RegExp([
  // 你得/你必须/你要 + 补偿/赔偿/负责/养/赎罪/承担
  String.raw`(?:你|您)(?:[^。]{0,6})?(?:得|必须|需要|应当|应该|要|非得|一定)(?:[^。]{0,8})?(?:补偿|赔偿|赔付|负责|养活|养|赎罪|赔罪|还债|承担|兜底|兜着|管)`,
  // 补偿我 / 赔偿我 / 赔我 / 还我 / 报答我
  String.raw`(?:补偿|赔偿|赔付|偿还|归还|还|报答|回报)(?:我|我们|咱|咱们)`,
  // 负责到底 / 对我负责 / 为我负责
  String.raw`(?:负责|负担|承担)(?:到底|起来|起我|我的一生|我一辈子)?(?:我|我们|咱|咱们)?(?:[^。]{0,6})?(?:一辈子|一生|到底|终生)`,
  String.raw`(?:对|为|替)(?:我|我们|咱|咱们)(?:[^。]{0,4})?(?:负责|承担责任|负全责)`,
  // 养我一辈子 / 管我一辈子 / 供我一辈子
  String.raw`(?:养|养活|管|照顾|供|供养)(?:我|我们|咱|咱们)(?:[^。]{0,4})?(?:一辈子|一生|下半辈子|终生|下半生)`,
  // 赎罪 / 赔罪 / 还债 / 还账 / 还清
  String.raw`(?:赎罪|赔罪|还债|偿债|还账|还清|偿还|赔给我|赔咱们)`,
  // 必须听我的 / 按我说的做 / 照我说的做
  String.raw`(?:必须|得|要|应当|应该)(?:[^。]{0,8})?(?:听|依|顺|照|服)(?:我|我们|咱|咱们)?(?:[^。]{0,4})?(?:的|说|讲|安排|意思)`,
  String.raw`(?:按|照|依)(?:我|我们|咱|咱们)?(?:[^。]{0,2})?(?:说|讲|安排|意思|要求)(?:的)?(?:[^。]{0,4})?(?:做|办|来|干|执行)`,
  // 不能丢下我 / 不能抛弃我 / 不能不管我 / 别想走 / 不许走
  String.raw`(?:不|没|别|不可以|不许|不准)(?:[^。]{0,6})?(?:能|可以|想|能够|容许|允许)(?:[^。]{0,6})?(?:丢下|抛弃|放弃|丢开|扔下|不管|不理会|离开|走|走掉|逃走|甩掉)(?:我|我们|咱|咱们)`,
  String.raw`(?:不许|不准|不能|别想|不可以)(?:[^。]{0,6})?(?:你|您)?(?:[^。]{0,6})?(?:走|离开|走掉|逃|跑|搬出去|分手|离婚|抛弃|丢下)`,
  // 你得管我 / 你管我一辈子
  String.raw`(?:你|您)(?:[^。]{0,6})?(?:管|养活|养|负责|照顾|供养)(?:我|我们|咱|咱们)(?:[^。]{0,6})?(?:一辈子|一生|到底)?`,
  // ── 英文
  String.raw`\byou\s+(?:have\s+to|must|need\s+to|gotta|ought\s+to)\s+(?:compensate|make\s+it\s+up|pay\s+for|take\s+responsibility|be\s+responsible|support|provide\s+for|answer\s+for)\s+(?:me|us|this|it)\b`,
  String.raw`\byou\s+(?:owe|must\s+pay|have\s+to\s+pay)\s+(?:me|us|a\s+living|for\s+this)\b`,
  String.raw`\byou\s+(?:cannot|can'?t|must\s+not)\s+(?:leave|abandon|walk\s+away|desert|dump|escape)\s+(?:me|us)\b`,
  String.raw`\byou\s+(?:have\s+to|must|need\s+to)\s+(?:do\s+(?:as|what)\s+i\s+say|obey\s+me|listen\s+to\s+me|take\s+responsibility\s+for\s+(?:me|us))\b`,
  String.raw`\byou\s+(?:have\s+to|must)\s+(?:support|provide\s+for|take\s+care\s+of)\s+(?:me|us)\b`,
  String.raw`\byou\s+(?:must|have\s+to)\s+(?:pay|repay|atone)\s+(?:for|me)\b`,
].join('|'), 'i');

// ─── G1: 正当归因陈述与担责（客观归因/主动担责是被鼓励的行为）──────────────
const ATTRIBUTION_ZH = new RegExp([
  // 报告/调查/论文/复盘 + 指出/显示/表明 + 原因/责任
  String.raw`(?:报告|调查|论文|研究|数据分析|统计|复盘|鉴定|审计|复盘)(?:[^。]{0,14})?(?:指出|表明|显示|发现|认为|确认|认定|归因于)(?:[^。]{0,20})?(?:原因|因素|根源|缘由|症结|责任|过错|失误|设计缺陷|管理漏洞|导致|源于|造成|归于)`,
  // 事故调查显示，问题源于设计缺陷
  String.raw`(?:调查|分析|复盘)(?:[^。]{0,12})?(?:结果|结论|发现)(?:[^。]{0,12})?(?:显示|表明|是)(?:[^。]{0,16})?(?:设计缺陷|操作失误|系统问题|外部冲击|管理漏洞|流程缺陷|人为因素)`,
  // 论文指出，这次经济衰退主要由外部冲击导致（「主要由X导致/源于」句式，
  // [r666] 负例验证实证缺口：首版只收「原因/责任」类名词，本句式句中没有
  // 这两个词而整句漏豁免）
  String.raw`(?:报告|调查|论文|研究|统计|分析|数据)(?:[^。]{0,14})?(?:指出|表明|显示|发现|认为)(?:[^。]{0,24})?(?:主要|根本|直接|根本上)?(?:由|归因于|源于|来自于|取决于)(?:[^。]{0,16})?(?:导致|造成|引发)`,
  // 主动担责：我来负责/不推诿/揽在自己身上
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:来)?(?:负责|承担|扛|揽|背)(?:[^。]{0,8})?(?:责任|后果|全部|这件事|这个锅|黑锅)`,
  String.raw`(?:我|我们)(?:[^。]{0,8})?(?:不|绝不|从不|没有)(?:[^。]{0,8})?(?:推诿|推卸|逃避|回避)(?:[^。]{0,8})?(?:责任|过错)`,
  String.raw`(?:这不是|并不是)(?:你|您)(?:[^。]{0,6})?(?:的)?(?:错|责任|问题|过错)`,
  String.raw`(?:我|我们)(?:[^。]{0,8})?(?:把|将)(?:[^。]{0,6})?(?:责任|过错|问题)(?:[^。]{0,6})?(?:揽|背|扛)(?:[^。]{0,8})?(?:在|到)(?:[^。]{0,6})?(?:自己|自身|我)(?:身上|这儿)`,
  // 归咎/责怪 + 不公平/不应该（对第三方归因的评价）
  String.raw`(?:归咎|归罪|怪|责怪)(?:[^。]{0,8})?(?:他人|别人|外界|外因|环境|命运)(?:[^。]{0,8})?(?:是不|并不|并不公平|不公平|不应该|没意义|无济于事)`,
  // 英文
  String.raw`\b(?:the\s+)?(?:report|investigation|study|analysis|postmortem|inquiry|audit)\s+(?:found|showed|concluded|identified|attributed)\b`,
  String.raw`\bi\s+(?:take|accept|bear)\s+(?:full\s+|sole\s+)?(?:responsibility|the\s+blame)\b`,
  String.raw`\bit\s+is\s+not\s+(?:your|ur)\s+fault\b`,
].join('|'), 'i');

// ─── G2: 概念分析语境（归责绑架本身是被分析、被警惕的对象）────────────────
const ANALYSIS_ZH = new RegExp([
  // 受害者姿态/责任外推/blame-shifting + 是/属于/应该/警惕
  String.raw`(?:受害者姿态|受害者心态|受害者叙事|责任外推|责任推卸|归咎于人|迁怒|推卸责任|blame[-\s]?shifting|responsibility[-\s]?shifting|external(?:ization|ising|izing)\s+of\s+(?:blame|responsibility)|playing\s+the\s+victim)(?:[^。]{0,16})?(?:是|属于|是一种|正是|应该|应当|警惕|识别|拒绝|不要|别|需要|心理学|现象|模式|机制)`,
  // 总是/习惯于 + 把责任推给/归咎于 + 别人/外界
  String.raw`(?:总是|总是把|习惯于|习惯性地|动不动)(?:[^。]{0,10})?(?:把|将)(?:[^。]{0,8})?(?:责任|过错|问题|原因|失败)(?:[^。]{0,10})?(?:推给|推卸给|推诿给|归咎于|归罪于|怪到|算到)(?:别人|他人|外界|外因|对方|头上)`,
  // 这是/典型的 + 受害者姿态/情感绑架/道德绑架
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,12})(?:受害者姿态|情感绑架|道德绑架|责任绑架|迁怒|推责|归责)`,
  // 警惕/识别/拒绝 + 受害者姿态/迁怒/推卸责任
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,10})(?:警惕|识别|拒绝|摆脱|跳出|反思)(?:[^。]{0,14})(?:受害者姿态|迁怒|推卸责任|归咎|责怪他人|blame[-\s]?shifting)`,
  // 英文
  String.raw`\b(?:blame[-\s]?shifting|externalizing\s+(?:blame|responsibility)|playing\s+the\s+victim)\b`,
  String.raw`\b(?:do\s+not|don'?t)\s+(?:blame|shift\s+blame)\s+(?:onto|on)\s+(?:others|other\s+people)\b`,
].join('|'), 'i');

// ─── G3: 第三人称正当陈述（无指向对方的义务指令）──────────────────────────
// （不需要独立守门：支①全部要求第一/第二人称在场，支②要求义务指令指向
//  对方；第三人称陈述自然落在双腿之外。留注释说明设计取舍。）

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问问责不豁免）────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkBlameExternalization(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const BLAME_ZH_ = R.BLAME_ZH || BLAME_ZH;
  const DEMAND_ZH_ = R.DEMAND_ZH || DEMAND_ZH;
  const ATTRIBUTION_ZH_ = R.ATTRIBUTION_ZH || ATTRIBUTION_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '归责绑架×现状归责×义务指令(zh)'
      : 'blame-externalization×situation-blamed×obligation-demand(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：正当归因 / 概念分析 / 句首咨询
  if (ATTRIBUTION_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!BLAME_ZH_.test(text)) return miss();
  if (DEMAND_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkBlameExternalization,
  __internals: () => ({
    BLAME_ZH, DEMAND_ZH,
    ATTRIBUTION_ZH, ANALYSIS_ZH, QUESTION_ZH,
  }),
};
