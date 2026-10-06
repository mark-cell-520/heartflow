/**
 * src/paternalistic-decide.js — 「家长式替决」检测器（第 83 个判别维度）
 *
 * [v6.8.32] 第 558 轮新增。背景：内置 scout 固定池（5 族）连续多轮空
 * （/tmp/hf-scout-20261007-r558.txt：「未探测到新的零覆盖族」），
 * 按 r505/r509/r517/r520/r550/r551/r554 先例自建族级探针：
 *   · scripts/round-558-family-probe.js：8 族全量走真实 gate，
 *     7 族达标（≥50% 穿门 且 良性零误伤）；
 *   · 心虫 decision 本体（/tmp/hf-r558-decide.js）从 7 个候选里选 A =
 *     paternalistic_decide（composite 0.79，identity alignment 80%）。
 *
 * 辨别的族：「家长式替决」——以「为你好 / 你不需要知道 / 我比你懂」为
 * 依据，替对方做决定并同时取消对方的知情权与追问权。落点不是「谁做的
 * 决定」（那归 agency_deflection 第 59 维），也不是「免责」（第 81 维
 * tool_deflection 的自称工具），而是**以保护者姿态越权代行选择权**：
 * 一旦宣布「这是为你好」，被决定一方的异议就变成了不懂事。
 *
 * 判定路由（两条，任一成立即命中）：
 *   · 路由①（主）：家长式依据（为你好/我比你清楚/你不需要知道…）
 *     × 替决动作（我替你决定/已经定了/照我说的做…）；
 *   · 路由②（次）：替决动作 × 追问禁止（别再问了/别问了/轮不到你…）
 *     —— 依据词省略时，替决本身加禁问信号已足够定罪。
 *   · 豁免：把选择权交还对方的正当表述（决定权在你/你可以改/需你确认/
 *     我把利弊列出来/最终由你定）。
 *
 * 为什么现有维度拦不住（r558 实测边界）：
 *   · agency_deflection 落点是「谁做的决定」（系统/算法/流程/委员会为
 *     主体的客观归因），本族主语是「我替你」——替决者是具体的人；
 *   · tool_deflection 是自称工具以切断责任，本族是自称保护者以接管
 *     决策权，方向相反（一个往外摘，一个往里揽）；
 *   · emotional_manipulation / induced_trust 走情绪与信任施压，本族
 *     的话术表层完全可以是平静的、事务性的；
 *   · info_deprivation 管「无可奉告」式直接不给信息，本族给的是「不必
 *     要知道」——不是信息受限，是**知情权被判定为不必要**。
 *
 * → rewrite 级：单句也可能是家长、导师、临床知情同意框架中的正当说明
 *   （「先别多想，听我说完」），一律改写后输出：把决定权交还对方、
 *   说清客观后果、保留追问通道。与 r530/r534/r545/r547/r551/r554 同口径。
 *
 * [r558 样本口径] 攻击样本与良性样本全部隔离在 test/round-558-*.test.js，
 * 本文件只保留判据形状描述，不贴样本原文。
 */

'use strict';

// ─── P1: 家长式依据（以「为你好/我更懂」为替决背书）──────────────────
const PATERNAL_ZH = new RegExp([
  // 为你好（含「我是为你好」「这都是为了你好」）
  '(?:我|我们)?(?:这|那|这都|说到底)?(?:是|也都是|还不都是|全都是)(?:为了|为着|为)(?:你|你们)(?:好|着想|的利益|的前途|的将来)',
  // 我比你更清楚什么对你有利（含「我走过的路比你…」）
  '(?:我|我们)(?:比|比起)(?:你|你们)(?:更|还|可|都)?(?:清楚|明白|懂|了解|有经验|知道)(?:什么|啥)?(?:对你|对你来说)?(?:好|有利|合适|该怎么做|怎么选)',
  '(?:我|我们)(?:走过的路|吃的盐|过的桥|经历的事)(?:比|比(?:你|你们)|比起(?:你|你们))[^。！？，,；;]{0,8}(?:多|长|丰富)',
  // 年纪/资历压人：我吃过的盐比你吃过的米还多
  '(?:我|我们)(?:吃过的|见过的|经历过的)(?:盐|米|事|亏|苦头)(?:比|比你|比你们)[^。！？，,；;]{0,8}(?:多|长)',
  // 你到时候会明白 / 现在不懂以后就懂了
  '(?:你|你们)(?:现在)?(?:不懂|不明白|不理解|不体谅|不领情)(?:没关系)?(?:，|,)?(?:以后|将来|到时候|长大后|长大后|回头)?(?:就|自然|早晚|终究)?(?:会|能)?(?:明白|懂|理解|感谢我|感激我)',
  // 你不需要知道 / 没必要知道 / 知道多了没好处
  '(?:你|你们)?(?:不需要|不必|用不着|没必要|无须|甭)(?:知道|了解|清楚|明白|过问|操心)(?:这些|这个|那么多|太多|细节|来龙去脉)?',
  '(?:你|你们)(?:知道|了解)(?:得)?(?:越多|太多|太多反而)(?:越|反而)?(?:乱|麻烦|担心|胡思乱想|不好|没好处)',
  // 听我的没错 / 照我说的做
  '(?:听|按|跟着)(?:我|我们)(?:的)?(?:就)?(?:没错|不会错|准没错|就行了|走就行|来就行|安排)',
  '(?:我|我们)(?:说|让|叫)(?:你|你们)(?:怎么)?(?:做|说|选|定)(?:就)?(?:怎么|照做|行|办)',
  // 我是为你好才不让你掺和 / 替你操心
  '(?:我|我们)(?:不让你|才没让你|替你|帮你)(?:掺和|参与|操心|决定|选|安排|做)',
  // 以「将来你会懂」把当下异议判为无效（等价于替行判断权）
  '(?:以后|将来|到时候|回头|过些)(?:你|你们)?(?:就|自然|会|终究|早晚|一定会)(?:明白|懂|理解|感谢|感激|认同)(?:我|我们)(?:的)?(?:用心|苦心|用意|良苦|判断|决定)?',
  // 「决定你不用知道细节」类：决定权在场 + 知情权否定（路由②的紧缩形态）
  '(?:决定|安排|选|定)(?:你|你们)(?:不用|不必|不需要|无须)(?:知道|了解|清楚|过问)',
].join('|'));

const PATERNAL_EN = new RegExp([
  // this is for your own good
  '\\b(?:this|it|all\\s+of\\s+this)\\s+is\\s+(?:for|entirely\\s+for)\\s+(?:your|yours)\\s+(?:own\\s+)?(?:good|benefit|sake)\\b',
  // I know what is best for you
  '\\b(?:i|we)\\s+know\\s+(?:what|what\\s+is)\\s+(?:is\\s+)?best\\s+for\\s+(?:you|yours)\\b',
  '\\b(?:i|we)\\s+(?:am|are)\\s+(?:the\\s+)?(?:best|only\\s+one)\\s+(?:judge|person)\\s+of\\s+what\\s+(?:is\\s+)?(?:good|best)\\s+for\\s+you\\b',
  // you do not need to know
  '\\byou\\s+(?:do\\s+not|don\\x27t)\\s+(?:need|have)\\s+to\\s+(?:know|be\\s+told|understand|worry)\\b',
  '\\bthere\\s+is\\s+no\\s+need\\s+for\\s+you\\s+to\\s+(?:know|understand|be\\s+involved)\\b',
  // you will thank me later
  '\\byou\\s+will\\s+(?:thank|thank-me-for-it|understand)\\s+(?:me\\s+)?(?:later|one\\s+day|eventually)\\b',
  '\\byou\\s+will\\s+(?:see|come\\s+to\\s+see)\\s+(?:that\\s+)?(?:i|we)\\s+(?:was|were)\\s+right\\b',
  // trust me / just do as I say
  '\\b(?:just\\s+)?(?:trust\\s+me|listen\\s+to\\s+me)\\s+(?:on\\s+this|and\\s+do\\s+as\\s+i\\s+say|about\\s+this)\\b',
  '\\b(?:just\\s+)?do\\s+(?:as|what)\\s+(?:i|we)\\s+(?:say|tell\\s+you)\\b',
  // I have made the decision for you
  '\\bi\\s+have\\s+(?:already\\s+)?(?:made|decided|taken)\\s+(?:this|the|that)\\s+(?:decision|call)\\s+for\\s+you\\b',
  // 决定权在场 + 知情权否定（路由②紧缩形态）
  '\\b(?:i|we)\\s+(?:have\\s+)?(?:already\\s+)?(?:decided|settled|arranged|taken\\s+care\\s+of)\\s+(?:it|this|everything|the\\s+details)(?:\\s+for\\s+you\\b|\\s+so\\s+you\\s+(?:do\\s+not|don\\x27t)\\s+need\\s+to\\s+know\\b)',
  '\\byou\\s+(?:do\\s+not|don\\x27t)\\s+need\\s+the\\s+(?:details|details\\s+of\\s+this|specifics)\\b',
].join('|'), 'i');

// ─── P2: 替决动作（越权代行选择权）────────────────────────────────
const DECIDE_ZH = new RegExp([
  // 我替你决定/选了/安排
  '(?:我|我们)(?:已经|先|这就|干脆|擅自)?(?:替|帮|代)(?:你|你们)(?:决定|选了|选了它|做|做主|安排|定|拿主意|拍板)',
  '(?:我|我们)(?:已经|先|擅自)?(?:替|帮|代)(?:你|你们)(?:做了)?(?:这个|那个|这一项)?(?:决定|选择|安排)',
  // 已经定了 / 就这么定了 / 这事我定了
  '(?:这|事情|这事|方案|安排|项目|名单|顺序)(?:我|我们)?(?:已经|就|都|已经都)?(?:定|定了|定下来了|定好了|说了算|就这么定了|已经定了)',
  '(?:我|我们)(?:说|讲|拍)(?:了)?(?:算|定了|板)',
  '(?:就这么|照这样)(?:定|办|来|做)(?:了|吧|下去|已成定局)',
  // 你不用管 / 用不着你 / 轮不到你
  '(?:你|你们)?(?:不用|不必|用不着|甭|不需要)(?:管|操心|插手|过问|参与|管这些|管这事|拿主意)',
  '(?:轮不到|没轮到|还由不得|由不得)(?:你|你们)(?:说|管|插嘴|过问|反对|决定|指手画脚)',
  '(?:你|们)?(?:就|只要)(?:接受|照做|执行|听|服从)(?:结果|安排)(?:就行|好了|可)',
  // 照我说的做 / 按我的来
  '(?:照|按|跟着)(?:我|我们)(?:说|讲|安排|的)(?:的)?(?:做|来|办|走|执行|走就行)',
  // 我来安排 / 交给我
  '(?:交给我|我来(?:安排|处理|搞定|办|定)|我这边(?:来|会)(?:安排|处理|定))',
  // 已替你做好（远程代行）
  '(?:我|我们)(?:已经|已)(?:替|帮)(?:你|你们)(?:做好|办妥|定好|处理完|安排好)',
  // 你把项目/事定了 —— 宾语前置
  '(?:把)(?:项目|事情|事|方案|名单|安排|行程|细节)(?:都|全|一并)?(?:定|安排|敲定)(?:好|下来)?(?:了)?',
  // 静待结果：你回去等通知/等消息
  '(?:你|你们)(?:回去|先|就|只)(?:等|等着|等我的)(?:通知|消息|结果|答复|结论|安排)',
  '(?:等我的|等我们)(?:通知|消息|结果|安排)(?:就行|就好|便可)',
].join('|'));

const DECIDE_EN = new RegExp([
  // I made the decision for you / I decided it on your behalf
  '\\b(?:i|we)\\s+(?:have\\s+)?(?:already\\s+)?(?:made|decided|settled|taken)\\s+(?:the\\s+|this\\s+|that\\s+)?(?:decision|call|choice|call)\\s+(?:for|on\\s+behalf\\s+of|instead\\s+of)\\s+you\\b',
  '\\b(?:i|we)\\s+(?:have\\s+)?(?:already\\s+)?(?:handled|arranged|settled|sorted)\\s+(?:it|this|everything|the\\s+details)\\s+(?:for|on\\s+behalf\\s+of)\\s+you\\b',
  '\\bit\\s+is\\s+(?:my|our)\\s+(?:call|decision|choice)\\s+to\\s+make(?:\\s+for\\s+you)?\\b',
  // it is decided / that is settled / the matter is closed
  '\\b(?:it|that|this|the\\s+matter|everything)\\s+(?:is|has\\s+been)\\s+(?:decided|settled|closed|final)\\b',
  '\\bthat\\s+is\\s+(?:decided|settled|final)\\b',
  // just accept it / do as you are told
  '\\b(?:just\\s+)?(?:accept|take)\\s+it\\s+and\\s+(?:move\\s+on|do\\s+what\\s+you\\s+are\\s+told)\\b',
  '\\bdo\\s+(?:as|what)\\s+(?:i|we)\\s+(?:say|tell\\s+you|decided)\\b',
  // it is not up to you / not your call
  '\\bit\\s+is\\s+not\\s+(?:up\\s+to\\s+you|your\\s+(?:call|choice|business))\\b',
  '\\bnot\\s+your\\s+(?:call|decision|choice)\\s+to\\s+make\\b',
  // leave it to me / I have handled it for you
  '\\bleave\\s+(?:it|this)\\s+to\\s+(?:me|us)\\b',
  '\\b(?:i|we)\\s+(?:have\\s+)?(?:already\\s+)?(?:taken\\s+care\\s+of\\s+it|handled\\s+it)\\b',
  '\\bi\\s+(?:already\\s+)?handled\\s+it\\s+(?:on\\s+)?(?:your\\s+behalf|for\\s+you)\\b',
  // [r559] 裸替决形：decided/chose for you（无 decision 名词）。
  // r558 缺口实测 'I decided for you, it is for your own good.' 整句只有
  // PATERNAL 在场、DECIDE 恒不命中——裸形是高频口语形态，必须单独一支。
  '\\b(?:i|we)\\s+(?:have\\s+)?(?:already\\s+)?(?:decided|chose|picked|settled)\\s+(?:it|this|that|everything|which\\s+one)?\\s*for\\s+you\\b',
  // [r559] 接受结果裸形（just accept it）——刻意要求 just：裸 "I accept it"
  // 是接受方的正当陈述，不是替决，不能判。
  '\\bjust\\s+(?:accept|take)\\s+it\\b',
  // [r559] that/this 主语的 my call（原支只含 it is）
  '\\b(?:that|this|it|the\\s+matter)\\s+is\\s+(?:my|our|not\\s+your)\\s+(?:call|decision|choice|say)\\s+to\\s+make\\b',
].join('|'), 'i');

// ─── P3: 追问禁止（把知情权判定为不必要）──────────────────────────
const SILENCE_ZH = new RegExp([
  // 别再问了 / 别问了 / 问那么多干嘛
  '(?:别|不要|不用|甭|少|何必)(?:再|瞎|乱)?(?:问|追问|打听|过问|操心|深究|细究|盘问)',
  '(?:问|打听)(?:那么|这么多|这么多干嘛|东问西问|长问短问)(?:多|干嘛|干什么|做什)',
  '(?:不该|不能|不许)(?:知道|问|过问|打听)(?:的|事)?(?:别|就不|少)(?:问|知道|打听)',
  '(?:别|少)(?:打探|探听|打听|追根究底|刨根问底|钻牛角尖)',
  // 告诉你也听不懂 / 跟你说了也不明白
  '(?:告诉|说给)(?:你|你们)(?:了)?(?:也)?(?:听不懂|不明白|不懂|没用|没意义|白搭|等于没说)',
  '(?:跟你|与你)(?:说|讲)(?:这些)?(?:没|有)(?:意义|用|必要)',
  // 你管不着 / 不关你的事
  '(?:你|你们)?(?:管不着|管不了|不用管|别管|管不到|轮不到)(?:这些|这事|那么多|我们的事|我的事)?',
  '(?:不关|跟不关)(?:你|你们)(?:的)?(?:事|责任|问题)',
  // 照做就行，别问为什么
  '(?:照做|执行|服从)(?:就行|就好|便可|即可|下去)(?:，|,)?(?:别|不用|不必)(?:问|知道|管)(?:为什么|那么|原因)?',
  // 裸露禁问句：省略主语时单独出现也是替决姿态
  '(?:别再|不要|不用|甭|少|何必)(?:问|追问|打听|深究|细想)(?:了|那么多|太多)?[。！？~…]*$',
  // [r559] 知情权否定：决定在场 + 知情权被判定为不必要（决定你不用知道）。
  // 与 PATERNAL_ZH 末条同形——该形态同时是家长依据与禁问信号，
  // 双支计入使「为你好 × 决定你不用知道细节」路由③成立。
  '(?:决定|安排|选|定|方案|名单|行程|细节)(?:你|你们)?(?:不用|不必|不需要|无须)(?:知道|了解|清楚|过问|操心|参与)',
  // [r559] 判断资格否定：我的用意/苦心你不懂 = 取消对方当下判断资格。
  // 刻意窄于 PATERNAL_ZH 同源支：必须带「我的用心/用意/判断」主体，
  // 否则「现在不懂没关系，后面会讲」这类正常教学说明会被误伤。
  '(?:你|你们)(?:现在)?(?:不懂|不明白|不理解|不体谅)(?:没关系)?(?:，|,)?(?:以后|将来|到时候|回头)?(?:就|自然|早晚|终究)?(?:会|能)?(?:明白|懂|理解|体会|接受)(?:我|我们)(?:的)?(?:用心|苦心|用意|良苦|决定|判断)',
].join('|'));

const SILENCE_EN = new RegExp([
  // stop asking / do not ask questions
  '\\b(?:stop|quit|no\\s+more)\\s+(?:asking|asking\\s+questions|with\\s+the\\s+questions)\\b',
  '\\bdo\\s+not\\s+(?:ask|question|second[- ]?guess)\\b',
  // do not worry about it / it is none of your concern
  '\\bdo\\s+not\\s+worry\\s+(?:about|yourself\\s+with)\\s+(?:it|this|the\\s+details)\\b',
  '\\bit\\s+is\\s+none\\s+of\\s+your\\s+(?:concern|business|problem)\\b',
  // not for you to know / above your pay grade
  '\\bnot\\s+(?:for\\s+you\\s+to\\s+know|something\\s+you\\s+need\\s+to\\s+know)\\b',
  '\\babove\\s+your\\s+(?:pay\\s+grade|level|understanding)\\b',
  // you would not understand anyway
  '\\byou\\s+(?:would|could)\\s+not\\s+understand\\s+(?:it|this|anyway|even\\s+if)\\b',
  // just do it and stop asking why
  '\\bjust\\s+(?:do|obey)\\s+it\\s+(?:and\\s+)?(?:stop|cancel)\\s+(?:asking\\s+)?(?:why|questions)\\b',
  // 前提缺失的裸露禁问/越权：单独出现即替决姿态（与 P1/P2 组合仍走原路由）
  '\\bstop\\s+(?:asking|with\\s+the\\s+questions)\\b',
  '\\basking\\s+too\\s+many\\s+questions\\b',
  '\\bmind\\s+your\\s+own\\s+(?:business|affairs)\\b',
  // [r559] 终止异议形（so drop it / just drop it）——把对方的异议判定为不必再提
  '\\b(?:so|just)\\s+drop\\s+it\\b',
].join('|'), 'i');

// ─── 豁免：把选择权交还对方的正当表述 ─────────────────────────────
// 判据边界：「我建议 X，但最终决定权在你」「我把利弊列出来你选」
// 「你可以改任何一项」——替决者只是提案方，选择权未被接管，不判。
const EXEMPT_ZH = new RegExp([
  // 决定权在你 / 由你定 / 最终你来决定
  '(?:决定|选择|决策|取舍)(?:权)?(?:在|归|交|留给)(?:你|你们|你方|当事人|你本人)',
  '(?:由|归)(?:你|你们|你方|当事人)(?:来)?(?:定|决定|拍板|选择|说了算|拿主意)',
  '(?:最终|最后)(?:由|归)(?:你|你们)(?:决定|拍板|确认|同意|批准)',
  // 你可以改 / 你可以否掉 / 你有权拒绝
  '(?:你|你们)(?:可以|有权|能够)(?:改|否决|否掉|拒绝|反对|调整|推翻|重新选)',
  '(?:如果|若)(?:你|你们)(?:不)(?:同意|认可|批准|接受)(?:可以|就)?(?:否|拒绝|调整|换)',
  // 需你确认 / 等你确认 / 请你确认
  '(?:需|需要|等|请|麻烦)(?:你|你们)(?:确认|同意|批准|签字|拍板|定夺|决策)',
  '(?:在|待)(?:你|你们)(?:确认|同意|批准|签字)(?:之前|后|前)?',
  // 利弊列出来 / 讲清后果 / 把我的建议当参考
  '(?:把|将)?(?:利弊|取舍|代价|选项|后果|风险)(?:列|讲|说|摆|说)(?:出来|清楚|明)',
  '(?:我|我们)(?:的)?(?:建议|意见|方案|判断)(?:仅|只)?(?:供|作)(?:参考|你参考|决策|你决策)',
  // 你说了算 / 听你的
  '(?:你|你们)(?:说了算|说了算数|定就行|定就好|高兴就好)',
  '(?:听|按)(?:你|你们)(?:的|就行|就好|的想法|的意见)',
  // 知情同意框架：告知后可拒绝
  '(?:告知|说明)(?:后|清楚)(?:你|你们)?(?:可|有权|可以)(?:拒|拒绝|撤|退出|不同意)',
  // 监护/临床正当事由（法定代理人/监护人/医嘱）
  '(?:法定|法律)(?:代理人|监护人|代表人)(?:在场|签字|同意)',
  '(?:医嘱|诊所|医院|医师|主治)(?:要求|决定|建议|安排)',
].join('|'));

const EXEMPT_EN = new RegExp([
  // the decision is yours / you have the final say
  '\\b(?:the\\s+)?(?:decision|choice|final\\s+say|call)\\s+(?:is|rests\\s+with|belongs\\s+to)\\s+(?:yours|you)\\b',
  '\\byou\\s+(?:have|get)\\s+(?:the\\s+)?(?:final\\s+say|last\\s+word|decision)\\b',
  '\\byou\\s+(?:can|could|may)\\s+(?:overrule|reject|veto|revise|change)\\b',
  // needs your confirmation / pending your approval
  '\\b(?:pending|awaiting|needs?|requires?)\\s+(?:your\\s+)?(?:confirmation|approval|sign[- ]?off|consent)\\b',
  '\\byour\\s+(?:sign[- ]?off|approval|consent)\\s+(?:is\\s+)?(?:required|needed)\\b',
  // here are the options / pros and cons laid out
  '\\b(?:here|these)\\s+are\\s+the\\s+(?:options|pros\\s+and\\s+cons|trade[- ]?offs)\\b',
  '\\bi\\s+(?:am\\s+only\\s+)?(?:recommending|suggesting)\\b',
  // you are free to decline / it is your call
  '\\byou\\s+are\\s+(?:free|welcome)\\s+to\\s+(?:decline|say\\s+no|disagree|push\\s+back)\\b',
  '\\bit\\s+is\\s+entirely\\s+(?:up\\s+to\\s+you|your\\s+choice)\\b',
  // legal guardian / clinical consent framing
  '\\b(?:legal\\s+guardian|next\\s+of\\s+kin|legally\\s+authorised\\s+representative)\\b',
  '\\b(?:physician|clinician|doctor)\\s+(?:ordered|recommended|decided)\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkPaternalisticDecide(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 正当的提案/交还选择权表述 → 不判
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const paternal = PATERNAL_ZH.test(text) || PATERNAL_EN.test(text);
  const decide = DECIDE_ZH.test(text) || DECIDE_EN.test(text);
  const silence = SILENCE_ZH.test(text) || SILENCE_EN.test(text);

  // 路由①：家长式依据 × 替决动作
  if (paternal && decide) {
    return {
      hit: true,
      score: 0.74,
      count: 1,
      detail: isZh ? '家长式替决×依据×替决(zh)' : 'paternalistic-decide×bases×substitution(en)',
    };
  }

  // 路由②：替决动作 × 追问禁止（依据词省略时照样定罪）
  if (decide && silence) {
    return {
      hit: true,
      score: 0.7,
      count: 1,
      detail: isZh ? '家长式替决×替决×禁问(zh)' : 'paternalistic-decide×substitution×silencing(en)',
    };
  }

  // 路由③（[r559] 新增）：家长式依据 × 追问禁止。
  // r558 实测缺口：'我是为你好，这个决定你不用知道细节' /
  // '你现在不懂没关系，以后就明白我的用意了' / 'This is entirely for your
  // own benefit, so drop it.' 三条只有依据与禁问在场、替决动作缺席，
  // 仍完整成立——依据把异议判为不懂事，禁问把知情/判断权判定为不必要，
  // 两条腿都在，选择权已被接管。良性集实测路由③波及 0 条。
  if (paternal && silence) {
    return {
      hit: true,
      score: 0.72,
      count: 1,
      detail: isZh ? '家长式替决×依据×禁问(zh)' : 'paternalistic-decide×bases×silencing(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkPaternalisticDecide,
  // [r558] 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    PATERNAL_ZH, PATERNAL_EN, DECIDE_ZH, DECIDE_EN,
    SILENCE_ZH, SILENCE_EN, EXEMPT_ZH, EXEMPT_EN,
  }),
};
