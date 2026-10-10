/**
 * src/suffering-capital.js — 「苦难资本化」检测器（第 102 个判别维度）
 *
 * [r649 立项建模块] 候选来源：scripts/round-649-family-probe.js 实测（判据从严：
 * 只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 M「苦难资本化」攻击 7 条漏判 5 条（71%）、良性 6 条 0 误伤。
 * decision 本体选出（scripts/round-649-decide.js，A=0.93 / confidence 0.88 /
 * identity 100%）。Phase 1.5 同律复核（scripts/round-649-family-probe.js 复跑
 * discriminate()）：5 条漏判样本中 4 条全维度零命中——不是被聚合压掉，
 * 是射程外。缺口成立。
 *
 * 辨别的族：「苦难资本化」——把自己（或自己这一方）经历过的苦难
 * **折算成对方当下必须顺从的资格**：我受过这么多苦，所以你没资格质疑我、
 * 顶嘴、拒绝；我的痛苦是一张可以兑现的兑付命令，账上的余额越大，
 * 对方让渡的自由就该越多。
 *
 * 为什么现有维度拦不住（r649 discriminate() 零命中实测 + 归因）：
 *   · suffering_contest（第 78 维）管**比惨消诉**——把自己的处境描述得比
 *     对方更惨，据此宣布对方的正当诉求降级、失效（「你这点损失算什么」）。
 *     本族不取消对方的诉求，而是**兑换对方的服从**（「所以你必须听我的」）；
 *     实测 5 条漏判样本 checkSufferingContest() 全部 miss——本族右腿是
 *     顺从指令/顶嘴定罪，不在 suffering_contest 的 OUTRANK（诉求取消）射程。
 *   · investment_as_debt（第 101 维）管把**资源投入**（钱/时间/感情/生活
 *     供给）折算成债务；本族左腿是**痛苦经历**（吃苦/受罪/委屈/忍气吞声），
 *     不涉及任何资源计量，实测「我当年吃过的苦比你吃过的盐还多」在
 *     investment_as_debt 的 INVESTED 腿零命中。
 *   · favor_ledger 管人情/善意动作折算义务；commitment_coercion 管承诺
 *     折算债务；sunk_cost_coercion 管自身沉没成本；三者左腿分别是恩情
 *     动作、对方承诺、自身投入，均不覆盖「痛苦经历」这一腿。
 *   · emotional_manipulation 管情绪施压本身；本族可以完全平静地陈述
 *     苦难史并紧接一条服从指令（「我这一辈子受了多少罪，你必须听我的」）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① SUFFER 苦难陈述：第一/第二人称在场的受苦动词（吃苦/受罪/
 *     挨苦/遭罪/受委屈/忍气吞声/熬坏/历尽艰辛 + 我当年/这些年/这一辈子），
 *     或受苦程度压过（吃过的苦比你吃过的盐还多）；
 *   · 支② COMPLY 顺从推导：资格剥夺（凭什么不听/有什么资格顶嘴/
 *     轮不到你说话）、顺从指令（必须听我的/按我说的做/乖乖听话）、
 *     抗命定罪（居然敢顶嘴/学坏了/翅膀硬了）、
 *     苦难兑换英文 so you have to obey / you have no right to argue /
 *     and you still talk back to me。
 *   · 单有苦难陈述不判：「受过苦的人往往更坚强，也更善良」是正当陈述，
 *     缺顺从推导这一腿；
 *   · 单有顺从指令不判：「你必须听我的」若无苦难陈述作前提，是别的语境
 *     （如陈述别人的控制关系、剧本台词）。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 苦难史的教育/传承语境：讲苦难是为了教育后辈珍惜、上进，
 *     不是为了兑换服从（「他常讲过去艰苦岁月里的故事，教育我们要珍惜当下」）；
 *   · G2 正当陈述：陈述苦难事实、他人苦难、苦难的正面价值，
 *     无指向对方的资格剥夺或顺从指令；
 *   · G3 概念分析：苦难资本化本身是被分析、被警惕的对象；
 *   · G4 句首咨询提问（收窄纪律同 r648：只认句首咨询词，不认句中
 *     任何问号——本族攻击句大量以反问定罪结尾「你凭什么不听我的？」）。
 *
 * [r649 实现纪律] 所有正则源串一律走 String.raw（同 r642/r643/r647/r648
 * 先例）。⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 */

'use strict';

// ─── 支①左腿: 苦难陈述（第一/第二人称在场的受苦经历）──────────────────
const SUFFER_ZH = new RegExp([
  // 核心形：我 + 时间状语 + 受苦动词 + 苦/罪/委屈
  // （我当年吃过的苦 / 我这一辈子受了多少罪 / 这些年我受的委屈）
  String.raw`(?:我|我们|咱|咱们)(?:当年|当初|这些年|这些年来|这些年里|这么多年|这一辈子|这辈子|这一生|前半生|半辈子|从小|从小到大|一直以来|多年以来|早年间|年轻的时候)?(?:[^。]{0,6})?(?:吃|受|挨|遭|忍|熬|历|经历|承受|背负)(?:过|了|的|尽)?(?:[^。]{0,6})?(?:多少|这么|那么|所有|那么多|这么多|无数的?|一生的?|半辈子的?)?(?:苦|苦难|苦头|苦楚|罪|委屈|气|艰辛|磨难|折磨|难处|酸楚|屈辱)`,
  // 「吃过的苦比你吃过的盐还多」类：受苦程度压过比较
  // [r649] 两侧都必须容许「路/桥」——「我走过的桥比你走过的路还多」首版
  // 只列苦|盐|米|饭在左，整句漏判（实测 A1 14/15，miss 全在这一族）。
  String.raw`(?:吃|受|挨|走|看|过)(?:过)?(?:的)?(?:苦|盐|米|饭|路|桥)(?:都)?比(?:你|你们)(?:吃|走|见|过)(?:过)?(?:的)?(?:盐|米|饭|路|桥)(?:还|都)?多`,
  // 「吃尽苦头/受尽委屈/遭尽罪」类：尽字完成态
  String.raw`(?:吃|受|挨|遭|忍|熬)(?:尽|遍|透)(?:了)?(?:[^。]{0,4})?(?:苦头|苦|委屈|罪|气|磨难|艰辛|白眼|冷眼|屈辱)`,
  // 「我为了你/这个家 吃尽苦头」类：受苦 × 对象（第二人称或家庭在场）
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:为了|为)(?:你|您|你们|这个家|家里|孩子|他|她|咱们家)(?:[^。]{0,6})?(?:吃|受|挨|遭|忍|熬|扛|背负|承担)(?:尽|了|过|的)?(?:[^。]{0,6})?(?:苦|苦头|罪|委屈|气|艰辛|磨难|难)`,
  // 「受了这么多委屈都忍了」类：委屈承受 + 隐忍完成态
  String.raw`(?:受|挨|忍|咽|吞)(?:了|过)?(?:[^。]{0,6})?(?:委屈|气|苦|罪|白眼|冷眼|指责|埋怨)(?:[^。]{0,4})?(?:都|也|全)(?:忍|受|咽|吞|扛|顶)(?:了|下|过来|住)?`,
  // 「我这么辛苦都是为了你」类：辛苦定性 + 归因对方
  // [r649] 「累成这样/苦成这样」类结果补语也要收——首版只列辛苦/苦/累/
  // 难/不容易，实测「我为了这个家累成这样」整句漏判（A1 14/15）。
  String.raw`(?:我|我们)(?:这么|那么|如此|这样)?(?:[^。]{0,4})?(?:辛苦|苦|累|难|不容易|拼命|煎熬|操劳|奔波)(?:[^。]{0,2})?(?:都|全|也)?(?:是)?(?:为了|为)(?:你|您|你们|这个家|家里|孩子)`,
  // 「累成这样/苦成这样」类：受苦动词 + 成 + 程度补语（无归因对方也成立）
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:累|苦|熬|撑|扛|受)(?:成|到)(?:[^。]{0,2})?(?:这样|这样了|这个样|这副样子|这样一副|这个地步|这般|如此)`,
  // 「把身体都熬坏了」类：受苦的代价（身体/健康/命搭进去）
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:熬|累|病|拖|搭|赔|折|烧)(?:坏|伤|垮|掉|破|进去|上)?(?:了)?(?:[^。]{0,4})?(?:身体|健康|命|性命|心血|青春|年华|半条命)`,
  // 英文：I suffered / endured / went through (so much | far more | all this) hardship
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:suffered|endured|went\s+through|put\s+up\s+with|lived\s+through)\s+(?:so\s+much|far\s+more|much\s+more|all\s+this|a\s+lot|more\s+than\s+you|than\s+you\s+ever)\s+(?:hardship|suffering|pain|struggle|misery|grief)`,
  String.raw`\b(?:i|we)\s+(?:suffered|endured|went\s+through)\s+(?:so\s+much|all\s+this)\s+(?:hardship|suffering|pain)\s+(?:for|to\s+(?:raise|support|provide\s+for))\s+(?:you|this\s+family|us)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:put\s+up\s+with|tolerated|swallowed|borne)\s+(?:so\s+much|all\s+this|more\s+than)\s+(?:for|from)\s+(?:you|this\s+family|them)\b`,
  // 受苦程度压过（英文比较级）
  String.raw`\b(?:i|we)\s+(?:suffered|endured|sacrificed|went\s+through)\s+(?:far\s+|much\s+|way\s+)?(?:more|worse)\s+than\s+(?:you|you\s+ever\s+(?:will|did)|yours)\b`,
].join('|'), 'i');

// ─── 支②右腿: 顺从推导（资格剥夺/顺从指令/抗命定罪）────────────────────
const COMPLY_ZH = new RegExp([
  // 资格剥夺：你凭什么不听我的 / 你有什么资格顶嘴 / 轮不到你说话
  // [r649] 「你懂什么」类：知识资格剥夺——宣布对方没有理解/发言的认知
  // 资格，是资格剥夺的核心形（首版漏，实测 A1 14/15，miss 在这一支）。
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:懂|明白|理解|清楚|知道)(?:什么|个啥|些啥|多少)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:凭什么|有什么资格|哪来的资格|凭什么资格|轮不到|没资格|不配)(?:[^。]{0,6})?(?:不听|顶嘴|反驳|反对|质疑|说话|插嘴|插话|拒绝|否定|我行我素|自作主张|跟我争|争辩|还嘴)`,
  // 顺从指令：必须听我的 / 按我说的做 / 乖乖听话 / 我说的话你得听
  String.raw`(?:必须|得|应该|应当|务必要|非得|一定要|就得)(?:[^。]{0,6})?(?:听|听从|服从|顺从|依|照办|按我说的|照我说的|听我的|听我的安排|照着我说的)`,
  String.raw`(?:我|老子|你)(?:说|讲)(?:的)?话(?:你|您)?(?:必须|得|要|就该|就该听着)(?:听|听着|照做|遵守)`,
  String.raw`(?:还不|都不|也不|怎么不)(?:乖乖|给我|老老实实|踏踏实实)?(?:听话|顺从|服从|照做|照办|听安排|认了|认命)`,
  // 抗命定罪：居然敢顶嘴 / 学坏了 / 翅膀硬了
  // [r649] 「敢」必须可选——「你现在居然顶嘴？」是常见抗命定罪形，
  // 首版把「敢」写死导致整句漏判（同 r648「连」字可选的同族教训）。
  String.raw`(?:居然|竟然|竟|现在|如今)(?:敢|学会|开始)?(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|拒绝|抗命|对着干|说个不字|说"不"|说不)`,
  String.raw`(?:你|你们)?(?:[^。]{0,4})?(?:学坏|学坏了|变坏|翅膀硬|翻了天|反了你了|无法无天|恃宠而骄)`,
  // 拒绝定罪：连这点…都不肯（与 investment_as_debt 的 DEBT 腿区分：
  // 本支只作右腿辅证，仍需 SUFFER 左腿在场）
  String.raw`(?:让|叫|要)(?:你|您)?(?:做|干|帮)(?:点|些)?(?:事|活|忙)(?:你|您)?(?:都|也)?(?:不|也不)(?:肯|愿意|答应|行|干|做)`,
  // [r649] 对方痛苦贬值支：「你受点委屈算什么」——以自身苦难为尺度宣布
  // 对方的痛苦不够格，是顺从推导的辅证（左腿 SUFFER 在场才判）。
  // 与 suffering_contest 的 OUTRANK 腿区分：本支只作右腿，不单独触发。
  String.raw`(?:你|你们)(?:[^。]{0,4})?(?:受|吃|遭|挨)(?:点|这点|这么点|那么点|一?点)(?:[^。]{0,4})?(?:委屈|苦|气|罪|累|难|伤害|损失)(?:算|算是|算得上|还)(?:什么|个事|回事|啥|得上)`,
  String.raw`(?:你|你们)(?:这点|这么点|那点)(?:[^。]{0,4})?(?:委屈|苦|气|罪|事|损失|伤害|抱怨)(?:算|算是|算得上)(?:什么|个事|回事|啥)`,
  // [r649] 自身苦难被贬为「算什么」——「你说说我当年受的苦算什么？」
  // 对方把自己的苦难也拿来贬值，是顺从推导的辅证（左腿 SUFFER 在场才判）。
  // 首版漏这一支（F5 实测 miss）：主语可省略，「的苦/罪/委屈」紧接「算什么」。
  String.raw`(?:受|吃|挨|遭)(?:的|过)?(?:[^。]{0,4})?(?:苦|罪|委屈|磨难|艰辛)(?:算|算是|算得上)(?:什么|个事|回事|啥)`,
  // 英文：so you have to obey / you have no right to argue / and you still talk back
  String.raw`\b(?:so|therefore|thus|which\s+means)\s+you\s+(?:have\s+to|must|should|need\s+to)\s+(?:obey|listen|do\s+what\s+i\s+say|comply|submit)\b`,
  String.raw`\b(?:you|u)\s+(?:have|'?ve\s+got)\s+no\s+(?:right|business|place)\s+to\s+(?:argue|talk\s+back|question|disagree|object|complain)\b`,
  String.raw`\b(?:and|yet)\s+you\s+still\s+(?:talk\s+back|disobey|argue|defy|resist|refuse)\b`,
  String.raw`\b(?:so|therefore)\s+(?:just\s+)?(?:obey|do\s+as\s+i\s+(?:say|tell\s+you)|listen\s+to\s+me|shut\s+up\s+and\s+listen)\b`,
  String.raw`\b(?:who\s+are\s+you|what\s+right\s+do\s+you\s+have)\s+to\s+(?:question|argue\s+with|talk\s+back\s+to|disagree\s+with)\s+(?:me|us)\b`,
].join('|'), 'i');

// ─── G1: 苦难史的教育/传承语境（讲苦难是为了教育，不是为了兑换服从）──────
const EDUCATION_ZH = new RegExp([
  // 讲苦难史 + 教育动作（珍惜/努力/上进/感恩/懂事）
  String.raw`(?:讲|说|提|回忆|回顾|讲述|念叨)(?:起|到|的)?(?:[^。]{0,10})?(?:艰苦|苦难|苦)(?:[^。]{0,10})?(?:教育|教导|告诉|提醒|勉励|鞭策|引导)(?:我们|我|孩子|子女|后辈|下一代|年轻人)?(?:[^。]{0,10})?(?:珍惜|努力|上进|感恩|懂事|奋斗|拼搏|勤俭|体贴|体谅|懂得)`,
  // 「教育我们要珍惜当下」类（无苦难字样但语境明确）
  String.raw`(?:教育|教导|告诉|提醒|勉励|引导)(?:我们|我|孩子|子女|后辈|年轻人)?(?:要|应当|要懂得|学会)(?:珍惜|努力|上进|感恩|懂事|奋斗|勤俭|体贴|独立)`,
  // 长辈讲过去是为了让后辈知道来历/根
  String.raw`(?:长辈|前辈|老人|父辈|祖辈|上一代|先辈)(?:[^。]{0,8})?(?:讲|说|提|回忆)(?:[^。]{0,8})?(?:过去|当年|往事|历史|经历)(?:[^。]{0,10})?(?:是|为了|让)(?:[^。]{0,10})?(?:知道|了解|记住|不忘|铭记|珍惜|传承|借鉴)`,
  // 英文：tells stories of harder times to teach us gratitude
  String.raw`\b(?:tells?|told|shared|recounts?)\s+(?:us\s+)?(?:stories\s+of\s+)?(?:harder\s+times|the\s+past|her|his)\s+(?:to|in\s+order\s+to)\s+(?:teach|show|remind|inspire)\s+(?:us|me|them)?\s*(?:gratitude|appreciation|hard\s+work|perseverance|humility)\b`,
  String.raw`\b(?:teach|taught|remind|inspire)\s+(?:us|me|the\s+next\s+generation)\s+(?:to\s+)?(?:appreciate|value|work\s+hard|be\s+grateful)\b`,
].join('|'), 'i');

// ─── G2: 正当陈述（苦难事实/正面价值/他人苦难，无资格剥夺或顺从指令）──────
const NEUTRAL_ZH = new RegExp([
  // 苦难的正面价值陈述（值得敬佩/让人成长/财富/磨砺）
  String.raw`(?:苦难|苦|磨难|挫折)(?:是|乃|算是)(?:[^。]{0,8})?(?:财富|磨砺|磨刀石|教科书|养分|历练|修行|人生的?(?:财富|课题|一部分|必经之路))`,
  String.raw`(?:受|吃)(?:过)?(?:苦|苦难|磨难)(?:的)?人(?:往往|通常|更|都)(?:[^。]{0,10})?(?:坚强|善良|坚韧|懂事|成熟|感恩|努力|上进|懂得|体谅|珍惜)`,
  // 他人苦难的正当陈述（第三人称，无指向对方的定罪）
  String.raw`(?:他|她|他们|她们|那些|这位|那位)(?:[^。]{0,8})?(?:受|吃|经历|承受)(?:过)?(?:不少|很多|许多|无尽的?)?(?:苦|苦难|磨难|委屈|罪)(?:[^。]{0,10})?(?:从不|从未|不曾|没)(?:[^。]{0,6})?(?:抱怨|索取|要求|张扬|提起|挂在嘴边|拿来)`,
  // 苦难不该被当作资本/工具（概念分析归 G3，此处只放「苦难价值中立」的正当陈述）
  String.raw`(?:吃苦|受苦|受难)(?:不|没)(?:[^。]{0,6})?(?:必要|意义|价值|值得|光荣|应该)`,
  // 慰藉/共情语境（承认对方苦，无兑换）
  String.raw`(?:你|您)(?:这些年|这些年里|这段时间)(?:也)?(?:[^。]{0,6})?(?:不容易|辛苦|受苦|难为|委屈|撑着)(?:[^。]{0,8})?(?:我|我们)(?:都|也)(?:[^。]{0,4})?(?:看在眼里|记在心里|知道|明白|理解|心疼)`,
  // 英文：suffering builds character / those who suffered are often kinder
  String.raw`\b(?:those|people)\s+who\s+(?:have\s+)?(?:suffered|endured)\s+(?:are\s+)?(?:often\s+)?(?:kinder|stronger|more\s+compassionate|more\s+resilient)\b`,
  String.raw`\b(?:suffering|hardship|adversity)\s+(?:builds?|shapes?|teaches?)\s+(?:character|resilience|compassion|strength)\b`,
].join('|'), 'i');

// ─── G3: 概念分析（苦难资本化本身是被分析、被警惕的对象）────────────────
const ANALYSIS_ZH = new RegExp([
  // 「把苦难当成资本/筹码/工具」是被批判的做法
  String.raw`(?:把|将)(?:[^。]{0,8})?(?:苦难|苦|牺牲|付出|委屈)(?:[^。]{0,6})?(?:当成|当作|看作|变成|沦为|异化|包装成|用作)(?:[^。]{0,6})?(?:资本|筹码|工具|手段|要挟|绑架|交易|投资|道德|压力|筹码|借口)`,
  // 「苦难不该成为压制/要挟的理由」
  String.raw`(?:苦难|苦|牺牲|付出|经历)(?:[^。]{0,10})?(?:不该|不应|不能|别|不要|绝不)(?:[^。]{0,8})?(?:成为|当作|当成|用作)(?:[^。]{0,8})?(?:压制|要挟|胁迫|绑架|筹码|资本|理由|借口|工具|手段|挡箭牌)`,
  // 这是/典型的 + 苦难资本化/情感绑架
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,10})(?:苦难资本化|苦难表演|比惨|情感绑架|道德绑架|亲情绑架|苦情绑架|以爱之名|受害者姿态|牺牲式绑架)`,
  // 警惕/识别/拒绝 + 苦难资本化
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,8})(?:警惕|识别|拒绝|摆脱|跳出|反思)(?:[^。]{0,10})(?:苦难资本化|比惨|情感绑架|道德绑架|苦情牌|牺牲式绑架|受害者姿态)`,
  // 英文：hardship should not be used as leverage / weaponized suffering
  String.raw`\b(?:suffering|hardship|sacrifice|pain)\s+(?:should|must)\s+not\s+be\s+(?:used\s+as|weaponized\s+as|turned\s+into)\s+(?:leverage|a\s+weapon|capital|a\s+tool|currency|blackmail)\b`,
  String.raw`\bweaponized\s+(?:suffering|hardship|victimhood|martyrdom)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问定罪不豁免）────────────────
// [r649] 收窄理由同 r648：本族攻击句大量以反问定罪结尾（「你凭什么不听
// 我的？」「你现在居然敢顶嘴？」），若允许咨询词出现在句中任意位置，
// 「你说说我当年受的苦算什么」会被误豁免。
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|有没有|凭什么说|怎样才能、该如何|该如何)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSufferingCapital(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SUFFER_ZH_ = R.SUFFER_ZH || SUFFER_ZH;
  const COMPLY_ZH_ = R.COMPLY_ZH || COMPLY_ZH;
  const EDUCATION_ZH_ = R.EDUCATION_ZH || EDUCATION_ZH;
  const NEUTRAL_ZH_ = R.NEUTRAL_ZH || NEUTRAL_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '苦难资本化×受苦陈述×顺从推导(zh)'
      : 'suffering-capital×hardship-endured×you-must-obey(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：教育传承 / 正当陈述 / 概念分析 / 句首咨询
  if (EDUCATION_ZH_.test(text)) return miss();
  if (NEUTRAL_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!SUFFER_ZH_.test(text)) return miss();
  if (COMPLY_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkSufferingCapital,
  __internals: () => ({
    SUFFER_ZH, COMPLY_ZH,
    EDUCATION_ZH, NEUTRAL_ZH, ANALYSIS_ZH, QUESTION_ZH,
  }),
};
