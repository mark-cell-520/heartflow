/**
 * src/investment-as-debt.js — 「投入折算成义务」检测器（第 101 个判别维度）
 *
 * [r648 立项建模块] 候选来源：scripts/round-648-family-probe.js 实测（判据从严：
 * 只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 H「投入折算成义务」攻击 7 条全漏判（100%）、良性 6 条 0 误伤。
 * decision 本体选出（scripts/round-648-decide.js，A=0.93 / confidence 0.88 /
 * identity 100%）。Phase 1.5 同律复核（本轮 scripts 复跑 discriminate()）：
 * 7 条攻击中 5 条全维度零命中，另 2 条仅 gaslighting / moral_foundations
 * 弱信号（非本族腿命中）——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「投入折算成义务」——把**自己在关系里投入的钱、时间、感情、
 * 生活供给**折算成对方当下必须偿还的债务，把对方的拒绝、犹豫或独立决策
 * 重新定义为忘恩负义，从而用一本自己记的账置换对方的自愿。
 *
 * 为什么现有维度拦不住（r648 discriminate() 零命中实测 + 归因）：
 *   · favor_ledger（第 86 维）管把单方历史**人情/善意**折算成对方当下的
 *     义务，其左腿 LEDGER_ZH 词汇表是「帮/提拔/照应/扛事/兜底/说情」这类
 *     **恩情动作**；本族左腿是「花了钱/投入感情/供你吃穿/付出这么多年」
 *     这类**资源投入**。实测 7 条攻击 checkFavorLedger() 全部 miss——
 *     「我为你花了这么多钱」不含任何帮助动词，落在 favor_ledger 射程外。
 *   · sunk_cost_coercion 管自身沉没成本（投入 ⇒ 自己必须继续），本族
 *     主体是自己、对象是**对方**的义务，方向相反；
 *   · commitment_coercion 管把对方过去的承诺定义为债务，本族不需要
 *     任何承诺，只需要自己的投入；
 *   · emotional_manipulation 管情绪施压本身，本族可以完全冷静地算账
 *     （「按账算，你欠我的这辈子都还不清」）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① INVESTED 投入陈述（中英各一套）：第一/第二人称在场的投入动词
 *     （花了/花费/投入/供/供养/付出/奉献/牺牲/倒贴 + 钱/时间/感情/心血/
 *     精力/青春，或 spent/invested/poured into/gave up ... for you）；
 *   · 支② DEBT 义务推导：欠债定性（你欠我的/还不清/报答/对得起我吗）、
 *     拒绝定罪（连这点…都不肯/让你做点事都不行）、顺从指令（必须听我的/
 *     按我说的做）、讨账反问（你算得清吗/屈指算算），或 owe me /
 *     the least you can do。
 *   · 单有投入陈述不判：「他这些年资助了几个学生，从没想过回报」是正当
 *     付出陈述——缺义务推导这一腿；
 *   · 单有义务推导不判：「你欠我的这辈子都还不清」若无投入陈述作前提，
 *     是别的语境（如陈述别人的纠纷）。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 概念分析语境：投入/付出是被分析的对象（"感情不是交易"/
 *     "父母养育子女是责任，不是投资"）——正确运用该概念的说法不判；
 *   · G2 正当陈述：陈述自己或他人守信/尽责/自愿付出的事实，无指向
 *     对方的讨账动作；
 *   · G3 制度性回报与契约履行：明确说按合同/制度/标准/法律办；
 *   · G4 疑问/咨询句式：「怎么衡量一段关系的付出是否对等？」是提问，
 *     无指向对方的讨账指控。
 *
 * [r648 实现纪律] 所有正则源串一律走 String.raw：单反斜杠写进普通单引号
 * 字符串会让磁盘文本"看起来正确"而运行时值全错（同 r643/r642/r647 先例）。
 * ⚠️ 中文分支不能写 \b：JS 的 \b 是 ASCII 词边界，中文字符之间永远不成立
 * （r645/r646/r647 实测，症状是正则看起来正确但一条都不命中且不报错）。
 * ⚠️ 疑问守门只认**句首咨询词**（如何/怎么/怎样/是否/为什么），不认句中
 * 任何问号——本族攻击句大量以反问讨账结尾（「你算得清吗？」「对得起我吗？」），
 * 一律按疑问豁免会把真攻击全部脱管（r647 P4 的同族教训，本轮收窄）。
 */

'use strict';

// ─── 支①左腿: 投入陈述（第一/第二人称在场的资源投入）──────────────────
const INVESTED_ZH = new RegExp([
  // 核心形：我/我们 + 在你身上/为你 + 投入动词 + 量词 + 资源名词
  // （我为你花了这么多钱 / 这些年我在你身上投入了多少感情）
  String.raw`(?:我|我们|咱|咱们|本人)?(?:这些年|这些年来|这么多年|这些年里|一直以来|从头到尾|从小到大|自从)?(?:在(?:你|您)?(?:身上|这儿|这里|那边)?)?(?:为|给|替|帮)?(?:你|您|你们|这个家|家里|孩子|他|她)?(?:[^。]{0,6})?(?:花|花费|耗|耗费|投入|投进|砸|倒贴|搭进|搭上|垫上|付|付出|供给|供应|供养|供|养|哺养|养育|栽培|栽培|抚育|拉扯|奉献|牺牲|倒贴|呕心沥血|操心|操心费力)(?:了|过|的)?(?:[^。]{0,10})?(?:多少|这么|那么|所有|全部|大半|一辈子|半辈子|一生)?(?:钱|金钱|银子|积蓄|工资|收入|钞票|时间|光阴|岁月|年华|青春|心血|心思|精力|感情|情感|爱|心血|汗水|力气|力|心)?`,
  // 「供你吃供你穿」类：生活供给的并列结构（供/养 + 你 + 吃/穿/读书/上学）
  String.raw`(?:供|养|供养)(?:你|您|你们)?(?:吃|穿|喝|住|行|读书|上学|念书|受教育|学琴|学画)`,
  String.raw`(?:吃|穿|喝|住|用)(?:的|用的)?(?:都|全)(?:是|靠)(?:我|我供|我养|家里)`,
  // 「一把屎一把尿把你养大」类：养育艰辛陈述
  String.raw`(?:一?把(?:屎|尿|辛酸泪|心血))(?:一?把(?:尿|屎|汗|泪))?(?:[^。]{0,8})?(?:把|将)?(?:你|您)?(?:养|带|拉扯|扶养)(?:大|成人|到现在)?`,
  // 「为你付出/奉献/牺牲了这么多」类（付出动词 + 量词，可无资源名词）
  String.raw`(?:为|给|替|帮)(?:你|您|你们|这个家|家里)?(?:付出|奉献|牺牲|投入|给予|给了|花了|费了|操了)(?:这么|那么|所有|全部|这么|这么多|那么多)?(?:多|许多|不少)?`,
  // 「我放弃了 X」类：机会成本投入（放弃了工作/出国/前程）
  String.raw`(?:我|我们)(?:[^。]{0,4})?(?:放弃|舍弃|辞掉|辞去|推掉|错过|失去|赔上|搭上)(?:了|过)?(?:[^。]{0,8})?(?:工作|事业|机会|前程|前途|出国|留学|升迁|升职|调任|项目|案子|时间|身体|健康|婚姻|家庭)`,
  // 英文：spent so much money on you / invested years in you / poured my life into you
  // [r648] 量词组必须含 my whole life / my entire life / all my love 这类
  // 所有格限定形——「poured my whole life into this family」首版漏判
  // （量词组只列 my life 不列 my whole life，中间插了 whole 就匹配不上）。
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:spent|invested|put|poured|dumped|sank)\s+(?:so\s+much|so\s+many|a\s+lot|all\s+my|(?:my|our)\s+(?:whole|entire|entire)|years?|my\s+life|my\s+youth|everything)\s+(?:money|time|effort|love|energy|youth|life)?\s*(?:on|into|in)\s+(?:you|this\s+(?:family|relationship|marriage)|us)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:given|sacrificed|gave\s+up|given\s+up)\s+(?:up\s+)?(?:so\s+much|everything|my\s+career|my\s+job|my\s+life)\s+(?:for|to)\s+(?:you|this\s+family|us)\b`,
  String.raw`\b(?:i|we)\s+(?:raised|put)\s+you\s+(?:through\s+)?(?:school|college|university|all\s+these\s+years)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:clothed|fed|housed|supported|provided\s+for)\s+(?:you|this\s+family)\b`,
].join('|'), 'i');

// ─── 支②右腿: 义务推导（欠债定性/拒绝定罪/顺从指令/讨账反问）────────────
const DEBT_ZH = new RegExp([
  // 欠债定性：你欠我的/还不清/还不完/报答/回报/偿还
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:欠|欠着|欠下|负|背负)(?:我|着我|大家)?(?:的)?(?:[^。]{0,6})?(?:债|账|情|恩|命|一辈子|一生|三世|十生十世)?`,
  String.raw`(?:这|那)?(?:债|账|情|恩)(?:你|您)?(?:这|一)?(?:辈子|一生|一世|半辈子)(?:都|也)?(?:还|偿|报)(?:不|没法|无法)?(?:清|完|了|尽|得了)?`,
  String.raw`(?:必须|得|应该|应当|该|一定要|迟早|早晚|终究|总归)(?:[^。]{0,6})?(?:报答|回报|偿还|归还|还债|报恩|感恩|补偿|赔偿|回馈)`,
  // 拒绝定罪：连这点…都不肯 / 让你做点事都不行
  // [r648] 「连」字必须可选——「你现在这点要求都不答应？」是常见讨账形，
  // 首版把「连」写死导致整句漏判（实测 A1 13/18，4 条 miss 全在这一族）。
  String.raw`连?(?:这|那)?(?:点|么|一)?(?:小)?(?:事|事情|事儿|忙|要求|吩咐|小事|愿望|请求)(?:你|您)?(?:都|也)?(?:不|也不|才|竟|居然)(?:肯|愿意|答应|同意|帮|做|行|干|办|出手|露面|赏脸|答应)`,
  String.raw`(?:让|叫|要)(?:你|您)?(?:做|干|帮|出)(?:点|些|一?点)?(?:事|活|儿|忙)(?:你|您)?(?:都|也)?(?:不|也不)(?:行|肯|愿意|答应|干|做|帮)`,
  // [r648] 「不能就这样拒绝」类：否定词与拒绝动词之间容许插入「就这样/
  // 直接/轻易/居然/连…都」等插入语（首版不容许，实测 s2 整句漏判）。
  String.raw`(?:不能|不可以|不许|不准|少跟我|别再|不允许)(?:[^。]{0,6})?(?:推|推辞|推托|推脱|拒绝|推让|推三阻四|讲条件|谈条件|回绝|驳了)`,
  // 「回报一点点怎么了」类：报答动词 + 重叠量词（一点点/一下下/一回回）
  // [r648] 量词组必须允许叠词（一?点+ / 点+）——「你回报一点点怎么了」
  // 首版写 (一?点|点) 单份量词，只匹配一个「点」、余下的点挡住后续锚点，
  // 整句漏判（实测 A1 17/18 的最后一条）。
  String.raw`(?:回报|报答|感谢|犒劳|补偿)(?:我|着我|大家)?(?:一?下+|一?回+|一?次+|一?点+|点+|些)?(?:怎么|为何|为啥|不行|算什么)`,
  // 「你们不能就这样拒绝我」英文对应 + 义务指令英文（so you have to do what I say）
  String.raw`\b(?:so|therefore|thus)\s+you\s+(?:have\s+to|must|should|need\s+to)\s+(?:do|obey|listen|comply)\b`,
  String.raw`(?:你|您)?(?:[^。]{0,4})?(?:对得起|对不住|对不起|说得过去|讲得过去|像话|好意思)(?:我|我吗|我们|我吗)?`,
  // 「现在这样对得起我吗」类：现状 × 对得起问责
  String.raw`(?:现在|如今|眼下|这时候)(?:[^。]{0,8})?(?:这样|这么|那样|如此)(?:[^。]{0,6})?(?:对得起|对不住)`,
  // 顺从指令：必须听我的/按我说的做/不然/否则
  String.raw`(?:必须|得|应该|应当|务必要|非得)(?:[^。]{0,6})?(?:听|听从|依|顺从|服从|照办|按我说的|照我说的|听我的)`,
  String.raw`(?:不然|否则|要不然|要不)(?:[^。]{0,10})?(?:就是|等于|算是|属于)?(?:[^。]{0,8})?(?:没良心|不孝|不义|忘恩|负义|白眼|狼心|肺|不配|不是人|没心)`,
  // 讨账反问：你算得清吗/屈指算算/你数数
  // [r697] 尾部锚点从全可选收紧为至少一个（清/明白/多少/几/吗呢/问号）——
  // 原写法 [吗呢]?[?？]? 全可选时，动词支的「数」单独即命中，
  // 「性能测试数据显示接口平均耗时 80ms」这类仪器读数句（数+耗时）被
  // INVESTED×DEBT 双腿误判 verify（round-437 守卫基线失败，HEAD 复现）。
  String.raw`(?:你|您)?(?:算|数|盘|清算|掂量|算算|数数|盘盘)(?:得|不|给我|一算|过来|得清|一下)?(?:[^。]{0,4})?(?:清|过来|明白|清楚|准|多少|几|[吗呢]|[?？])`,
  // 英文：you owe me / the least you can do / after all I have done
  String.raw`\b(?:you|u)\s+(?:owe|owe\s+me|owe\s+us|are\s+in\s+debt\s+to)\s+(?:me|us|this\s+family|your\s+\w+)\b`,
  String.raw`\b(?:the\s+)?(?:least|very\s+least)\s+you\s+(?:can|could)\s+do\b`,
  String.raw`\b(?:you|u)\s+(?:cannot|can'?t|could\s+not)\s+(?:even\s+)?(?:do|manage)\s+(?:this|that|one)\s+(?:one\s+)?(?:small\s+)?thing\b`,
  String.raw`\b(?:after\s+all|considering\s+everything)\s+(?:i|we)\s+(?:have\s+)?(?:done|given|sacrificed)\b`,
  String.raw`\b(?:how|and\s+now)\s+(?:dare|can\s+you)\s+(?:you\s+)?(?:refuse|say\s+no|deny)\s+(?:me|this)\b`,
].join('|'), 'i');

// ─── G1: 概念分析语境（投入/付出是被分析的对象，正确运用）──────────────
const ANALYSIS_ZH = new RegExp([
  String.raw`(?:感情|爱情|亲情|关系|婚姻|亲子|养育|付出|投入)(?:不是|绝非|不应是|不该是|不能是|而非)(?:[^。]{0,6})(?:交易|买卖|投资|筹码|筹码|绑架|债务|账目|生意)`,
  String.raw`(?:付出|投入|养育|照顾)(?:[^。]{0,6})(?:不该|不应|不能|别)(?:[^。]{0,6})(?:当成|看作|作为|变成|沦为|折算|异化)(?:[^。]{0,6})(?:筹码|债务|资本|要挟|绑架|交易|投资)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,10})(?:投入折算|付出绑架|情感绑架|道德绑架|亲情绑架|以爱之名|交易思维)`,
  String.raw`(?:应该|应当|必须|要|别|不要|勿)(?:[^。]{0,8})(?:警惕|识别|拒绝|摆脱|跳出)(?:[^。]{0,10})(?:付出绑架|情感绑架|道德绑架|投资心态|交易心态)`,
  String.raw`(?:正常的?|正当的?|好的?)(?:[^。]{0,6})(?:亲子之爱|父母之爱|母爱|父爱|亲情|爱)(?:[^。]{0,8})(?:不该|不应|不能|别)(?:[^。]{0,6})(?:折算|变成|沦为|当作|异化)(?:[^。]{0,6})(?:债务|账目|交易|投资|筹码)`,
  // [r648] 概念分析泛化形：「最怕的就是把付出当成筹码」无「不该」字样，
  // 靠「把付出当成/当作 + 筹码」这个结构本身识别。
  String.raw`(?:最怕|切忌|切勿|错误的是|问题在于)(?:[^。]{0,10})?(?:就是|在于)?(?:[^。]{0,6})?(?:把|将)(?:[^。]{0,6})(?:付出|投入|感情|时间|钱)(?:[^。]{0,6})(?:当成|当作|看作|变成|沦为|异化)(?:[^。]{0,6})(?:筹码|债务|资本|交易|投资|绑架)`,
  String.raw`(?:心理学家|研究|实验|霍曼斯|社会交换理论|布劳)(?:[^。]{0,14})(?:社会交换|投入|公平理论|相互关系)`,
  String.raw`\b(?:equity\s+theory|social\s+exchange\s+theory|investment\s+model)\b`,
].join('|'), 'i');

// ─── G2: 正当陈述（陈述付出事实/自愿付出，无讨账动作）──────────────────
const VOLUNTARY_ZH = new RegExp([
  // 明确不图回报
  String.raw`(?:不图|不求|不图回报|从未想过|从没想过|没想过|不指望|不指期|从不指望)(?:[^。]{0,6})(?:回报|报答|酬谢|补偿|偿还|感恩|回馈|好处|任何)`,
  String.raw`(?:自愿|无偿|义务|出于爱|出于责任)(?:[^。]{0,6})(?:付出|奉献|投入|牺牲|照顾|资助|帮助)`,
  // 责任定性（不是投资）
  String.raw`(?:父母|家长|养育|抚养)(?:[^。]{0,6})(?:是|为)(?:[^。]{0,6})(?:责任|义务|天职|本分|职责|应该做的|理所当然)`,
  // 陈述他人正当付出且无反讨账
  String.raw`(?:他|她|他们|志愿者们?|好心人|资助人)(?:[^。]{0,8})(?:资助|帮助|照顾|供养|付出)(?:[^。]{0,8})(?:从未|从没|不曾|没)(?:[^。]{0,6})(?:求|想|要|图)`,
  String.raw`(?:健康|良好|成熟|平等)的?(?:[^。]{0,6})(?:关系|相处|沟通)(?:[^。]{0,6})(?:不靠|不靠的是|不需要)(?:[^。]{0,6})(?:付出|绑架|牺牲|妥协|讨好)`,
  // 英文
  String.raw`\b(?:without|never)\s+(?:expecting|expect|asking\s+for)\s+(?:anything\s+)?(?:in\s+return|repayment|anything\s+back)\b`,
  String.raw`\b(?:paren|raising|parenting)\s+(?:is|was)\s+(?:a\s+)?(?:responsibility|duty|not\s+an\s+investment)\b`,
  String.raw`\b(?:voluntary|voluntarily|out\s+of\s+love|as\s+a\s+duty)\b`,
  String.raw`\b(?:healthy|equal)\s+(?:relationships?|partnership)\s+(?:do\s+not|don'?t)\s+(?:keep\s+score|keep\s+a\s+ledger)\b`,
].join('|'), 'i');

// ─── G3: 制度性回报与契约履行（按合同/制度/标准办）────────────────────
const PROCEDURE_ZH = new RegExp([
  String.raw`(?:赡养|抚养|扶养|监护|教育)(?:义务|责任|职责)(?:是|由)(?:[^。]{0,10})(?:法律|法规|民法典|规定|明确|法定)`,
  // [r648] 「按合同约定，相关费用应当据实结算」——「据实结算/按实结算/
  // 照章/依规」等制度性结算动词也是契约履行表述。间隔必须容许逗号
  // （「约定，相关费用应当据实结算」中间有逗号，[^。] 本身含逗号但
  //  0,6 个字符装不下「，相关费用应当」这 7 个字，首版实测 miss）。
  String.raw`(?:按|依照|按照|依据|根据)(?:合同|合约|约定|协议|制度|规定|章程|流程|标准|规范|纪律|法律|民法典|合同法)[^。]{0,14}(?:据实|照实|依规|按章|酌情)(?:结算|办理|执行|处理|核定)`,
  String.raw`(?:按|依照|按照|依据|根据)(?:合同|合约|约定|协议|制度|规定|章程|流程|标准|规范|纪律|法律|民法典|合同法)(?:办|办理|执行|履行|操作|处理|来|走|定)`,
  String.raw`(?:该|应该|应|须|得)(?:按|依照|依据)(?:合同|制度|规定|标准|程序|流程)(?:办|走|执行|处理|来)`,
  String.raw`(?:人情|感情|私交|付出)(?:归|是)(?:人情|感情|私交|付出)`,
  String.raw`(?:公事公办|一码归一码|亲兄弟明算账)`,
  String.raw`\b(?:per|according\s+to|under)\s+(?:the\s+)?(?:contract|agreement|policy|regulation|procedure|terms)\b`,
  String.raw`\bbusiness\s+is\s+business\b`,
].join('|'), 'i');

// ─── G4: 疑问/咨询句式（只认**句首**咨询词，句中反问讨账不豁免）──────────
// [r648] 收窄理由：本族攻击句大量以反问讨账结尾（「你算得清吗？」「对得起我
// 吗？」「现在这样像话吗？」），若像 r647 P4 那样允许咨询词出现在句中任意
// 位置，「你怎么这样对得起我」会被误豁免。判据是咨询词位于句首且句中有
// 疑问词结尾——真正的提问是整句的意图，讨账是把问句当武器。
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|有没有|凭什么说|怎样才能|该如何|该如何衡量)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkInvestmentAsDebt(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const INVESTED_ZH_ = R.INVESTED_ZH || INVESTED_ZH;
  const DEBT_ZH_ = R.DEBT_ZH || DEBT_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const VOLUNTARY_ZH_ = R.VOLUNTARY_ZH || VOLUNTARY_ZH;
  const PROCEDURE_ZH_ = R.PROCEDURE_ZH || PROCEDURE_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '投入折算成义务×资源投入×讨账定性(zh)'
      : 'investment-as-debt×spent-on-you×you-owe-me(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：概念分析 / 正当自愿付出 / 制度性回报 / 句首咨询
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (VOLUNTARY_ZH_.test(text)) return miss();
  if (PROCEDURE_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!INVESTED_ZH_.test(text)) return miss();
  if (DEBT_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkInvestmentAsDebt,
  __internals: () => ({
    INVESTED_ZH, DEBT_ZH,
    ANALYSIS_ZH, VOLUNTARY_ZH, PROCEDURE_ZH, QUESTION_ZH,
  }),
};
