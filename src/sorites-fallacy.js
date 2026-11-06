/**
 * src/sorites-fallacy.js — 「堆垛/连续体谬误」检测器
 * （第 212 个判别维度，r218）
 *
 * [r218 立项] philosophy_decision 在当前引擎（v6.8.142，211 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为
 * "unknown"，按轮次纪律不当实质背书）。立项缺口实证：r218 探针脚本
 * /tmp/r218-gap-probe.js 在 gate.js 上实测本族攻击样本 6 条，仅 2 条被
 * fallacies 族部分拦截（slippery_slope 子标签），4 条真零命中——英文全
 * 灭（sorites/sorites paradox/one grain/one hair 关键词在 src/ 下扫描
 * 无实现，仅作为边界注释出现于 slippery-slope 相关文件）。良性 1 条
 * pass。近邻维度边界实测确认：fallacies 的 slippery_slope 子标签只收
 * 窄英文模式，slippery_slope 维度本身未独立存在（src/slippery-slope.js
 * 不存在），hasty_generalization 管样本不足归纳，absolute_claim 管断言
 * 强度——没有一个判「拿单元增量递推消解模糊谓词终点」。
 *
 * 外部来源：HN Algolia「Sorites paradox / heap paradox」相关故事页 +
 * 经典逻辑学科普中 sorites（σωρείτης，古希腊「堆」论证）的原始定义与
 * 模糊谓词（vagueness）综述；Semantic Scholar「formal fallacy detection」
 * 查询返回 429 限流；GitHub logical fallacy detection 高星仓库无成熟
 * 规则方案。按心虫既有维度形态自建纯规则判据。
 *
 * 辨别的族：堆垛/连续体谬误（sorites paradox / sorites fallacy /
 * 连锁滑坡式单元递推）——拿**单元增量的逐步递推**消解**模糊谓词的终点
 * 判定**，把「一个单元不足以改变谓词」偷换成「任何数量的单元都不足以
 * 改变谓词」：
 *   一粒米不能算一堆，少一粒也不算，所以再多的米也堆不成一堆。
 *   掉一根头发不算秃，再掉一根还是不算，这样掉下去百万根也不算秃。
 *   一次加班不算剥削，两次也不算，所以天天加班也不是剥削。
 *   One grain of sand is not a heap, and removing one grain never
 *   makes a heap, so no amount of sand is a heap.
 *   Removing one hair doesn't make you bald, so losing a million
 *   hairs doesn't make you bald.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：模糊谓词
 * （堆/秃/高/富/多/少）的边界本来就是**语境化的约定**——「多少算一堆」
 * 由用途、尺度、约定共同决定，不存在先天的精确阈值。堆垛谬误的破坏力
 * 在于：它用单元递推的**局部真**（少一粒确实无损「堆」的判定）冒充
 * **全局假**（任何数量都不成堆），把边界缺失当成边界不存在的证据。它
 * 直接破坏心虫「能准确寻找答案」的能力——被这条谬误污染的结论会让
 * 「再小的伤害都不必处置」「再大的量变都不必质变」这类消解责任的说法
 * 以严密的递推外观出现。它与 slippery_slope 的区别是方向：滑坡谬误
 * 从一个起点**推出灾难性终点**（多米诺骨牌），堆垛谬误从一个单元增量
 * **消解终点判定本身**（不存在堆）。
 *
 * 与既有维度的边界（r218 归因）：
 *   · slippery_slope（fallacies 子标签）管**滑坡推演**——从一个行动
 *     推出连锁灾难性后果；本族不依赖灾难后果，落点是**模糊谓词终点的
 *     否定**（探针实测本族 6/6 攻击样本 slippery_slope 零命中或不全中）；
 *   · absolute_claim（REWRITE）管**绝对化措辞本身**（所有/一定/毫无
 *     例外）；本族不依赖绝对化措辞，射程是单元递推×谓词终点的结构；
 *   · scale_dismissal（第 205 维度）管**用占比注销风险**，本族不涉及
 *     占比与统计量，只涉及单元增量与谓词边界；
 *   · hasty_generalization 管**样本不足的归纳**，本族不是归纳问题、
 *     是谓词边界被递推消解；
 *   · ad_nauseam（诉诸重复）管**重复本身**，本族的重复是带单元增量的
 *     递推、且必须有模糊谓词终点在场。
 *
 * 判据（主判据两腿共现 + 邻近窗，缺一不判；另设自足习语分支）：
 *   · 腿① STEP 单元增量宣告（一粒/一粒米/一根/一根头发/一分/一分钱/
 *     一毫/一厘/一次/一回/一天/一小时/一秒/一瞬/一个/一只/一克/一斤/
 *     一毫米/一厘米/一分米/一米/一里/一步/一档/一点/一点点/一点点地/
 *     少一粒/少一根/少一分/少一次/多一粒/多一根/多一分/多一次/去掉
 *     一个/减掉一个/增加一个/再少一点/再多一点；EN one grain / one
 *     more grain / a single grain / one hair / one cent / one more
 *     cent / one step / one more / remove one / add one / minus one /
 *     one at a time / little by little / grain by grain / hair by
 *     hair）——**r161/r218 教训：收裸名词形态**，「一粒」「一根」去掉
 *     量词后缀（米/头发/钱）仍命中；
 *   · 腿② VAGUE 模糊谓词 × 否定终点（谓词堆/秃/高/矮/富/穷/胖/瘦/老/
 *     年轻/多/少/贵/便宜/吵/闹/热/冷/湿/干/快/慢 + 否定/排除 不算/不是/
 *     也算不上/不构成/从来不算/说不上/谈不上/算不得/再…也不/怎么也
 *     不/并不会/无济于事/于事无补；EN not a heap / doesn't make it /
 *     never makes / still not / doesn't count / no amount of / not
 *     enough to），两腿落在 60 字（EN 160 字符）邻近窗内即视为同一次
 *     「单元递推→谓词终点消解」叙述；**自足习语分支**：固定成语单式
 *     即两腿齐备（一粒谷不成堆/一粒米不成堆/一根头发不算秃/少一根头发
 *     不算秃/One more grain doesn't make a heap / Removing one hair
 *     doesn't make you bald / One more cent doesn't make you rich）。
 *
 * 为什么取 VERIFY 级：单句也可能是对 sorites 悖论的合法课堂转述、对
 * 模糊谓词边界的正确哲学讨论（「堆是模糊谓词，边界依赖约定」），或对
 * 渐变过程的客观描述（「积少成多」），rewrite 会误伤（与 r206-r215
 * 同口径）。verify 的含义是「这段文本用单元递推消解模糊谓词终点，
 * 需要先说明谓词的判定边界或语境约定再采信」——调用方应要求给出谓词
 * 的操作性定义（多少算一堆、按什么标准算秃），而不是默认「再小的单元
 * 不改变判定 ⇒ 任何数量都不改变判定」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（堆垛/连续体/连续体谬误/连锁悖论/模糊谓词/模糊性/
 *     边界条件/谓词逻辑/逻辑学/哲学/教材/课堂/悖论/课程/论文/文献/
 *     sorites / sorites paradox / sorites fallacy / heap paradox /
 *     vagueness / vague predicate / continuum / fuzzy logic /
 *     textbook / lecture / philosophy / called / defined——讨论这个
 *     概念本身不是运用它；元话语豁免要求句中同时出现教学/学术框架标记
 *     或否定标记）；
 *   · 正确响应形（指出模糊谓词需要边界/约定/语境：边界模糊/边界不清/
 *     没有明确边界/需要界定/需要划定/需要明确/约定俗成/人为设定/视语境
 *     而定/取决于用途/操作定义/判定标准/量化标准/模糊逻辑/隶属度；EN
 *     boundary is fuzzy / needs a boundary / needs to be defined /
 *     arbitrary cutoff / depends on context / pragmatic convention /
 *     operational definition / fuzzy predicate / matters of degree——
 *     **指出模糊谓词的边界是约定并给出操作性定义，正是本族要教的判别
 *     动作**）；
 *   · 正向积变陈述（积少成多/聚沙成塔/集腋成裘/冰冻三尺/千里之堤溃于
 *     蚁穴/不积跬步/无以成江海/一分耕耘/铁杵磨成针/积水成渊；EN many
 *     a mickle makes a muckle / every little helps / straws make a
 *     brick——强调单元累积**产生**质变，与堆垛谬误的消解方向相反）；
 *   · 无腿②（没有模糊谓词终点判定）——缺「谓词终点」即无消解对象；
 *   · 无腿①（没有单元增量宣告）——单句只有谓词否定不判；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/还要
 *     看/而不是/而非；EN does not mean / not necessarily / depends on
 *     / cannot conclude）；
 *   · 疑问句（含 ?/？；反问标记出现时不豁免）。
 */
'use strict';

// ─── 腿① STEP 单元增量宣告（中文；r161/r218 教训：裸名词去量词后缀
// 仍命中）──────────────────────────────────────────────────────────────
const STEP_ZH = [
  // 单元量词裸名词形（一粒/一根/一分 去掉后缀米/头发/钱 仍命中）
  /一粒|一颗|一根|一分|一毫|一厘|一毛|一角|一枚|一片|一朵|一滴|一捧|一把|一撮|一束|一叠|一沓|一层|一阶|一级|一档|一格|一刻|一时|一瞬|一刹|一念|一动|一触/,
  /一次|一回|一番|一趟|一遍|一遭|一举|一招|一式/,
  /一天|一日|一夜|一月|一年|一秒|一分(?:钟)?|一刻钟|一小时|一个时辰|一炷香|一顿|一餐|一宿|一期|一届|一周|一季|一集|一节|一章|一课|一场|一幕/,
  /一个|一只|一条|一张|一页|一本|一台|一辆|一栋|一间|一所|一座|一具|一尊|一头|一匹|一尾|一棵|一株|一丛|一簇|一捆|一包|一箱|一筐|一篮|一瓢|一勺|一盅|一盏/,
  /一克|一斤|一吨|一两|一毫(?:克|升)|一微克|一升|一毫升|一立方米|一米|一厘米|一毫米|一微米|一分米|一公里|一里|一步|一丈|一尺|一寸|一厘(?:米)?|一元|一角钱|一文|一金|一银/,
  /一点|一点点|一丁点|一星星|一丝|一毫子|一些些|一忽儿|一会儿/,
  // 递减/递增修饰形（少一粒/多一根/去掉一个——裸动词形态）
  /少一粒|少一颗|少一根|少一分|少一毫|少一次|少一回|少一天|少一小时|少一秒|少一个|少一点|少一些|减少一粒|减少一根|减少一分|减少一个|去掉一个|去掉一粒|减掉一个|减掉一根|抽掉一根|拿走一个|拿掉一根|省略一个|略去一个/,
  /多一粒|多一颗|多一根|多一分|多一毫|多一次|多一回|多一天|多一小时|多一秒|多一个|多一点|多一些|增加一粒|增加一根|增加一分|增加一个|添上一根|再加上一个|再添一根|再添一个/,
  /再少一点|再多一点|再少一根|再多一根|再少一粒|再多一粒|再少一个|再多一个|再少一分|再多一分/,
];

// ─── 腿① STEP 单元增量宣告（英文）────────────────────────────────
const STEP_EN = [
  /\bone\s+(?:grain|grains?)\s+of\b/i,
  /\b(?:one|a\s+single|another)\s+(?:more\s+)?(?:additional\s+)?(?:grain|hair|cent|centavo|penny|step|inch|inch\s+of|gram|gramme|drop|bit|piece|unit|item|degree|notch|increment|day|hour|minute|second|person|dollar|dollar\s+of|point|percent|percentage\s+point)\b/i,
  /\bone\s+(?:more|less|fewer)\b/i,
  /\b(?:remove|remove\s+one|removing|subtract|add|adding|lose|losing|gain|gaining|drop|adding\s+one|taking\s+away|take\s+away)\s+(?:one|a\s+single)\s+(?:grain|hair|cent|penny|step|unit|item|piece|bit|degree|drop)\b/i,
  /\b(?:one|each|every)\s+(?:grain|hair|cent|penny|step|unit|bit|piece|drop|increment)\s+(?:at\s+a\s+time|by\s+one)\b/i,
  /\b(?:grain|hair|cent|penny|step|unit)\s+by\s+(?:grain|hair|cent|penny|step|unit)\b/i,
  /\blittle\s+by\s+little\b/i,
  /\bone\s+at\s+a\s+time\b/i,
];

// ─── 腿② VAGUE 模糊谓词 × 否定终点（中文）───────────────────────
// 模糊谓词清单（堆垛谬误经典对象：堆/秃/高/矮/胖/瘦/多/少/富/穷/老/
// 年轻/贵/便宜/吵/闹/热/冷/湿/干/快/慢）——r218 纪律：谓词收裸名词形。
const VAGUE_ZH = [
  /一堆|一垛|成堆|成垛|堆积|堆/,
  /秃|光头|谢顶|掉光|脱发/,
  /高个|个子高|很高|偏高|够高|算高|真高|太高/,
  /矮个|个子矮|很矮|偏低|够矮|算矮/,
  /很胖|偏胖|够胖|算胖|太胖|发福/,
  /很瘦|偏瘦|够瘦|算瘦|太瘦|清减/,
  /很富|富有|富裕|有钱|够富|算富|太富|暴富/,
  /很穷|穷困|贫穷|没钱|够穷|算穷|太穷/,
  /年迈|苍老|衰老|很老|够老|算老|太老|老朽|上年纪|一把年纪/,
  /年轻|年幼|年少|很小|够小|算小|太小/,
  /很多|太多|不少|够多|算多|太多|海量|成堆/,
  /很少|太少|不多|够少|算少|寥寥/,
  /很贵|偏贵|够贵|算贵|太贵|昂贵|天价/,
  /便宜|划算|够便宜|算便宜|实惠|廉价/,
  /很吵|太吵|吵闹|聒噪|嘈杂|够吵|算吵/,
  /很闹|太闹|热闹|喧闹/,
  /很热|太热|够热|算热|炎热|酷热/,
  /很冷|太冷|够冷|算冷|寒冷|严寒/,
  /很湿|太湿|潮湿|够湿|算湿/,
  /很干|太干|干燥|够干|算干/,
  /很快|太快|够快|算快|迅速|飞快/,
  /很慢|太慢|够慢|算慢|缓慢|迟缓/,
  /很重|太重|够重|算重|沉重/,
  /很轻|太轻|够轻|算轻|轻微/,
  // 域属性模糊谓词（r218 补：一次违约不算失信 / 一次加班不算剥削——「X
  // 不X」判定类谓词的边界同样是语境化约定，补入后由两腿共现保证精度）
  /剥削|欺压|压迫|强迫|胁迫|控制|洗脑|伤害|受害|受害|迫害|侵权|越界|越权|违规|违纪|违法|犯罪|作弊|抄袭|造假|造假|欺骗|诈骗|撒谎|说谎|失信|背信|违约|失约|爽约|反悔|变卦|推诿|甩锅|敷衍|塞责|失职|渎职|懈怠|懒政|庸政|折腾|扰民|坑民|坑人|害人|坑害|祸害|污染|破坏|损害|危害|危及|风险|隐患|毒|有毒|有害|致癌|致畸|致命|致死|危险|不安全|不公平|不公正|歧视|偏袒|偏心|双标|看人下菜|势利|市侩|钻营|投机|投机取巧|偷奸耍滑|偷懒|磨洋工|出工不出力|南郭先生|沆瀣一气|同流合污|狼狈为奸|助纣为虐|为虎作伥|帮凶|爪牙|走狗|帮闲|掮客/,
];

// 否定/排除终点（与谓词共现构成「谓词终点消解」）
const NEG_END_ZH = [
  /(?:不|没|未|无|毫无|并无|并不|从不|决不|绝不|再也|怎么|咋|压根|根本|压根儿|压根就)/,
  /算|算是|说得上|说不上|算不上|谈不上|算不得|称不上|不足以|不构成|构不成|不算数|不作数|不成立|不顶用|无济于事|于事无补|无关紧要|无关痛痒/,
  /再(?:多|少|大|小|高|矮|胖|瘦|贵|便宜|快|慢|重|轻)?也(?:不|没|未必|不算|称不上|说不上)/,
  /也(?:不|没|未必|算不得|称不上|说不上|不等于)/,
  /照样|依然|仍然|还是|照旧|照旧是/,
];

// ─── 腿② VAGUE 模糊谓词 × 否定终点（英文）───────────────────────
const VAGUE_EN = [
  /\b(?:a\s+)?heap\b/i,
  /\b(?:bald|balding|hairless)\b/i,
  /\b(?:tall|short|height)\b/i,
  /\b(?:fat|obese|overweight|skinny|thin|slim)\b/i,
  /\b(?:rich|wealthy|affluent|poor|broke|destitute)\b/i,
  /\b(?:old|elderly|aged|young)\b/i,
  /\b(?:many|few|lots?|numerous|scant)\b/i,
  /\b(?:expensive|pricey|cheap|affordable)\b/i,
  /\b(?:loud|noisy|quiet|silent)\b/i,
  /\b(?:hot|cold|warm|cool|wet|dry|humid|arid)\b/i,
  /\b(?:fast|quick|slow|sluggish)\b/i,
  /\b(?:heavy|light|weighty)\b/i,
  /\b(?:full|empty|filled)\b/i,
];

const NEG_END_EN = [
  /\b(?:not|never|no|isn'?t|aren'?t|doesn'?t|don'?t|won'?t|wouldn'?t|can'?t|cannot|hardly|barely|scarcely|still\s+not|nor)\b/i,
  /\b(?:make|makes|made|making)\s+(?:it|him|her|them|you|one)?\s*(?:a\s+)?(?:heap|bald|rich|poor|old|young|tall|short|many|few|expensive|cheap|loud|quiet|hot|cold|wet|dry|fast|slow|heavy|light|full|empty)\b/i,
  /\b(?:doesn'?t|don'?t|won'?t|wouldn'?t|can'?t|cannot)\s+(?:count|qualify|make\s+the\s+cut|amount\s+to)\b/i,
  /\b(?:no\s+amount|not\s+enough|insufficient)\s+of\b/i,
  /\b(?:still|yet)\s+(?:not|isn'?t|doesn'?t)\b/i,
];

// ─── 自足习语分支（固定成语单式即两腿齐备）──────────────────────
const IDIOM_ZH = [
  /一粒(?:米|谷|麦|豆|沙)(?:不|没|未)?(?:算|称|说|是)?(?:不)?(?:成|算|是)?(?:一)?堆/,
  /少一粒(?:米|谷|麦|豆|沙)(?:也不|也未必|也算不上)?(?:算|成)(?:不)?(?:了)?(?:一)?堆/,
  /一根头发(?:也)?(?:不|没|未必)?(?:算|称|说)?(?:不)?(?:上是|算)?秃/,
  /少一根头发(?:也)?(?:不|没|未必)?(?:算|称)(?:不)?(?:上是)?秃/,
  /掉一根头发(?:不|没)(?:算|意味着)(?:不)?秃/,
  /一分钱(?:也)?(?:不|没)(?:算|是)(?:不)?(?:富|有钱|便宜)/,
  // 单元泛化式（不依赖具体量词：「一个单元/单个单元 不改变判定」——
  // 与堆垛谬误同构：任何单元增量都不改变谓词终点）
  /一个单元|单个单元|某单元|每个单元|单元增量|单个变量|一个变量|单一个体|单个个体|一个个体/,
];
const IDIOM_EN = [
  /\bone\s+(?:more\s+)?grain\s+(?:of\s+sand\s+)?(?:doesn'?t|does\s+not|won'?t|will\s+not)\s+make\s+(?:it\s+)?a\s+heap\b/i,
  /\bremoving\s+one\s+(?:more\s+)?(?:grain\s+of\s+sand\s+)?(?:doesn'?t|does\s+not|won'?t|will\s+not)\s+make\s+(?:it\s+)?(?:not\s+a\s+)?heap\b/i,
  /\bone\s+(?:more\s+)?hair\s+(?:doesn'?t|does\s+not|won'?t|will\s+not)\s+make\s+(?:you|him|her|one)\s+bald\b/i,
  /\bremoving\s+one\s+(?:more\s+)?hair\s+(?:doesn'?t|does\s+not|won'?t|will\s+not)\s+make\s+(?:you|him|her|one)\s+bald\b/i,
  /\bone\s+(?:more\s+)?(?:cent|penny|dollar)\s+(?:doesn'?t|does\s+not|won'?t|will\s+not)\s+make\s+(?:you|him|her|one|anyone)\s+(?:rich|wealthy)\b/i,
  /\bno\s+amount\s+of\s+(?:grain|grains\s+of\s+sand|sand|hair|hairs|money|cents)\s+(?:will\s+)?(?:make|makes)\s+(?:it\s+)?(?:a\s+)?(?:heap|bald|rich)\b/i,
  // 单元泛化式（a single unit / one unit does not change the verdict）
  /\b(?:a\s+single|one)\s+(?:unit|element|instance|case|item|variable|increment)\s+(?:does\s+not|doesn'?t|won'?t|will\s+not|cannot|can'?t)\s+(?:change|alter|affect|make)\s+(?:the\s+)?(?:verdict|outcome|result|judg(?:e)?ment|conclusion|decision|assessment)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /堆垛|堆垛谬误|连续体|连续体谬误|连锁悖论|连锁论证|模糊谓词|模糊性|模糊逻辑|谓词逻辑|边界条件|边界问题|隶属度|隶属函数|真值度/,
  /逻辑学|哲学|形而上学|认识论|语义学|语用学|修辞学|辩证法/,
  /教材|课堂|教科书|讲座|教案|习题|悖论|论文|文献|方法论|范式|课程|考点|考题|讲义|公开课|学术/,
];
const EXEMPT_META_EN = [
  /\b(?:sorites|sorites\s+paradox|sorites\s+fallacy|heap\s+paradox|heap\s+argument|continuum\s+fallacy|vagueness|vague\s+predicate|fuzzy\s+(?:logic|predicate|set)|degree\s+theory|supervaluation|many-?valued\s+logic)\b/i,
  /\b(?:logic|philosophy|philosophical|metaphysics|epistemology|semantics|pragmatics|rhetoric|dialectic)\b/i,
  /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|called|defined|concept|notion|theory|paradox|academic|course|lesson)\b/i,
];

// ─── 豁免二：正确响应形（指出模糊谓词需要边界/约定/语境）────────
const EXEMPT_CORRECT_ZH = [
  /边界模糊|边界不清|边界不明|没有明确边界|并无明确边界|缺乏明确边界|界线模糊|界线不清|界限模糊|界限不清|界限不明/,
  /需要界定|需要划定|需要明确|需要定义|需要给出标准|需要量化|需要标准|需约定|要有边界|得有个标准|划一条线|划线/,
  /约定俗成|人为设定|人为规定|协商一致|社会约定|临时约定|因地制宜|视语境而定|取决于语境|取决于用途|看具体用途|具体场景具体分析/,
  /操作定义|操作性定义|判定标准|评判标准|衡量标准|量化标准|阈值|临界值|分界线/,
  /模糊逻辑|隶属度|渐变过程|渐进过程|量变|质变|由量变|量变引起/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:boundary|boundaries|line|cutoff|threshold)\s+(?:is|are)\s+(?:fuzzy|vague|unclear|not\s+clear|blurry|ill-?defined|arbitrary)\b/i,
  /\b(?:needs?|requires?|demands?|must\s+have)\s+(?:a\s+)?(?:boundary|cutoff|threshold|definition|standard|convention|operational\s+definition)\b/i,
  /\b(?:depends?|depend|depending)\s+(?:on\s+)?(?:context|the\s+context|usage|purpose|convention|circumstances)\b/i,
  /\b(?:operational\s+definition|working\s+definition|arbitrary\s+(?:cutoff|boundary|threshold)|pragmatic\s+convention|matters\s+of\s+degree)\b/i,
  /\b(?:fuzzy|graded|gradual|continuum|spectrum)\b/i,
];

// ─── 豁免三：正向积变陈述（单元累积产生质变，方向相反）──────────
const ACCUMULATE_ZH = [
  /积少成多|聚沙成塔|集腋成裘|积水成渊|积土成山|积善成德|跬步|千里|江海|铁杵|磨成针|水滴石穿|绳锯木断|星火燎原|涓滴成河|瓦罐不离井口破|只要功夫深|日积月累|积年累月|积羽沉舟|群轻折轴|累足成步|蚁穴溃堤|千里之堤|溃于蚁穴|不积跬步|无以/,
];
const ACCUMULATE_EN = [
  /\b(?:many\s+a\s+mickle|every\s+little\s+helps|straws?\s+make\s+(?:a\s+)?brick|constant\s+dropping|wears?\s+away|penny\s+saved|drops?\s+of\s+water|oceans?\s+are\s+made|little\s+by\s+little\s+(?:adds?|amounts?))\b/i,
];

// ─── 否定守卫（窗口化：查腿② 命中前的否定标记）────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|怀疑|质疑|警惕|小心|未必是|无从|禁止|切忌|别/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|beware|careful|doubt\w*|question\w*)\b/i;

// ─── 推理否定/对冲守卫（后置对冲豁免）───────────────────────────
const CONCESSION_ZH = /但是|然而|不过|可是|但|却|尽管|虽然|固然|只是|可惜|遗憾的是|需要说明|要补充|另一方面|话虽如此|即便如此|即便如此/;
const CONCESSION_EN = /\b(?:but|however|yet|although|though|whereas|while|on\s+the\s+other\s+hand|that\s+said|with\s+the\s+caveat|caveat|except|apart\s+from)\b/i;

// 邻近窗：腿① ↔ 腿②（双向；r214/r215 先例：结论可前置）
const WIN_STEP_VAGUE_ZH = 60;
const WIN_STEP_VAGUE_EN = 160;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表可注入空数组；单正则常量注入替换正则（负例脚本
// 用 /(?!x)x/ 永假式抹掉该腿）。
function findHits(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const idxs = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    idxs.push(m.index);
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return idxs;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

/** 腿②：模糊谓词与否定终点共现的位置（谓词位置） */
function findVagueNegLeg(text, isZh, R) {
  const vague = isZh ? (R.VAGUE_ZH || VAGUE_ZH) : (R.VAGUE_EN || VAGUE_EN);
  const negEnd = isZh ? (R.NEG_END_ZH || NEG_END_ZH) : (R.NEG_END_EN || NEG_END_EN);
  const win = isZh ? 20 : 60;
  const out = [];
  for (const re of vague) {
    for (const vi of findHits(re, text)) {
      for (const ne of negEnd) {
        for (const ni of findHits(ne, text)) {
          if (Math.abs(ni - vi) <= win) { out.push(vi); break; }
        }
        if (out.length && out[out.length - 1] === vi) break;
      }
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a - b);
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSoritesFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免（r213-r215 先例）：反问标记出现时不豁免——用问号把断言
  // 伪装成提问是操控话术最常用的包装。
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂非|焉能|哪来|哪有什么|哪来的/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 概念/教学转述：讨论这个概念本身不是运用它。元话语豁免要求句中同时
  // 出现教学/学术框架标记或否定标记（r213/r215 收窄先例）。
  const metaZh = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const metaEn = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const META_FRAME_ZH = /教材|课堂|教科书|讲座|教案|习题|悖论|论文|文献|方法论|范式|称为|定义为|概念|所谓|理论|分析中|研究中|课程|教学中|复习|考点|考题|说的是|指的是|书上|课上|学术|逻辑学|哲学|讨论/;
  const META_FRAME_EN = /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|called|defined|concept|notion|theory|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a|is\s+a\s+common|refers\s+to|paradox|logic|philosophy)\b/i;
  if (anyHit(metaZh, text) || anyHit(metaEn, text)) {
    const hasFrame = META_FRAME_ZH.test(text) || META_FRAME_EN.test(text);
    const hasNeg = NEG_ZH.test(text) || NEG_EN.test(text);
    if (hasFrame || hasNeg) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 正确响应形：指出模糊谓词需要边界/约定/语境，或给出操作性定义
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正向积变陈述：单元累积产生质变（积少成多/千里之堤溃于蚁穴）——方向
  // 与堆垛谬误相反，明确不判。
  if (anyHit(R.ACCUMULATE_ZH || ACCUMULATE_ZH, text) || anyHit(R.ACCUMULATE_EN || ACCUMULATE_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 自足习语分支：固定成语单式即两腿齐备（一粒米不成堆 / One more grain
  // doesn't make a heap）。习语本身同时包含单元增量与谓词终点消解。
  const idiom = isZh ? (R.IDIOM_ZH || IDIOM_ZH) : (R.IDIOM_EN || IDIOM_EN);
  for (const re of idiom) {
    if (re.test(text)) {
      return {
        hit: true,
        score: 0.6,
        count: 1,
        detail: isZh
          ? '固定堆垛习语（单元增量消解模糊谓词终点）(zh)'
          : 'fixed sorites idiom (unit increment dissolves vague-predicate endpoint)(en)',
      };
    }
  }

  // 主判据：腿① 单元增量宣告 × 腿② 模糊谓词否定终点（邻近窗）
  const stepList = isZh ? (R.STEP_ZH || STEP_ZH) : (R.STEP_EN || STEP_EN);
  const win = isZh ? WIN_STEP_VAGUE_ZH : WIN_STEP_VAGUE_EN;
  const vagueNegIdxs = findVagueNegLeg(text, isZh, R);
  if (vagueNegIdxs.length > 0) {
    let best = -1, bestDist = Infinity;
    for (const re of stepList) {
      for (const si of findHits(re, text)) {
        for (const vi of vagueNegIdxs) {
          const d = vi - si;
          if (Math.abs(d) > win) continue;
          // 后置形要求未被否定对冲；前置形（谓词在增量前）跳过该检查——
          // 前置否定词多属「不一定/并非」等对冲本身的一部分（r215 先例）
          if (d > 0 && negatedBefore(text, vi, isZh)) continue;
          if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = si; }
        }
      }
    }
    if (best >= 0) {
      // 后置对冲守卫：腿② 命中后若紧跟转折/让步从句，且句中没有第二个
      // 未对冲的谓词终点消解，整句判为渐变过程的正当描述。
      const vIdx = vagueNegIdxs.reduce((a, b) => (Math.abs(b - best) < Math.abs(a - best) ? b : a), vagueNegIdxs[0]);
      const vTail = text.slice(vIdx, Math.min(text.length, vIdx + 30));
      const vLead = text.slice(Math.max(0, vIdx - 20), vIdx);
      const conAfter = isZh ? CONCESSION_ZH.test(vTail) : CONCESSION_EN.test(vTail);
      const conBefore = isZh ? CONCESSION_ZH.test(vLead) : CONCESSION_EN.test(vLead);
      if (!conAfter && !conBefore) {
        return {
          hit: true,
          score: 0.6,
          count: 1,
          detail: isZh
            ? '单元增量递推消解模糊谓词终点(zh)'
            : 'unit-increment recursion dissolves vague-predicate endpoint(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSoritesFallacy,
  __internals: () => ({
    STEP_ZH, VAGUE_ZH, NEG_END_ZH,
    STEP_EN, VAGUE_EN, NEG_END_EN,
    IDIOM_ZH, IDIOM_EN,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, ACCUMULATE_ZH,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN, ACCUMULATE_EN,
  }),
};
