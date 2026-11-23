/**
 * src/normalcy-bias.js — 「正常态偏误（normalcy bias）」检测器
 * （provisional 第 288 个判别维度，r460 起草并接线）
 *
 * 立项实证（scripts/round-460/probe-candidates.js，v6.8.228 gate() 全量
 * findings 实测）：七条中文攻击样本仅 2 条被 gate 拦下（两条均为存量
 * appeal_to_future/absolute_claim 类泛维度代拦，无任何维度以
 * 「历史稳定→否认当下风险信号」语义承重）——中文侧 5/7 穿透。英文侧
 * 部分被 appeal_to_tradition/hasty_generalization 代拦，中文侧整族
 * 缺席。src/ 下没有任何维度判「以历来无事/历来如此否认当下明确的
 * 风险信号，并据此拒绝行动」这一结构。
 *
 * 外部来源：空返。r460 海外扫描（原始证据 /tmp/hf-scout-*.txt）：HN
 * Algolia 3 命中均非规则引擎方案（1-2 分的 Show HN）；GitHub API
 * fallacy detection 最高星 120 星 latent-variable/Real_time_fallacy_
 * detection 依赖 Whisper+ChatGPT/LLaMA/Mistral，cognitive bias
 * reasoning 最高 79 星为参考书目聚合——全部引入 LLM 依赖，违反心虫
 * 零依赖铁律，均不可用。Semantic Scholar 空返。判据为心虫自有纯规则
 * 实现（家族定义取自灾难心理学/风险沟通的标准描述：normalcy bias /
 * 正常态偏误——Omer & Alon 1994、Ripley 2008《The Unthinkable》：
 * 灾难警报到来时，人们以「历来如此、从没出过事」为由系统性地低估
 * 甚至否认眼前明确的风险信号，从而拒绝执行既定预案；人群中有约
 * 70–80% 表现出该反应。逻辑上，历史频率不改变当下条件已经变化的
 * 事实，「以前没事」与「这次会不会有事」是两个独立命题，用前者
 * 论证后者是把归纳安全套到已出现反例的情境上）。
 *
 * 辨别的族：正常态偏误——**常态/历史稳定陈述**（历来/一向/从来/
 * 这么些年来/历史上/每次/年年 + 没事/都这样/都没出事；EN it has
 * always been fine / never happened before / every time it turns
 * out fine）与**当下风险信号被否认**（不用/不必/别 + 撤离/当回事/
 * 理它/担心/管它 + 没事/不会有问题；EN no need to evacuate /
 * don't worry about it / it will be fine）+ **不行动结论**（在家待着/
 * 物资撤了/不理它/先放着；EN stay put / ignore it / wait and see）
 * 三腿共现。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：风险信号的意义
 * 只由当下条件决定。正常态偏误把「过去没出事」偷换成「现在不会
 * 出事」——当气象台已经给出破纪录降雨、地震台已经发布海啸警报、
 * 体检报告已经出现明确异常指标时，「历来如此」不构成任何证据。
 * 历史上没有发生过的事，第一次发生时不因为「从未发生」而降低
 * 概率；反过来，「这次情况不同」恰恰是需要被认真对待的信号而非
 * 安心理由。与正当表述有明确界线：承认历史同时承认当下差异并按
 * 预案行动、有数据支持的判断、风险分级评估、引用本族名称的教学
 * 句——均豁免。
 *
 * 与既有维度的边界（r460 归因）：
 *   · appeal_to_tradition 管**以传统/惯例论证价值正当性**（祖上一
 *     直这么吃，所以该这么吃）；本族判**以历史无事故否认当下风险
 *     信号**，必须有风险信号与不行动结论，无风险信号的纯传统
 *     陈述不命中。
 *   · availability_bias 管**以想起的容易程度替代概率评估**（新闻
 *     报得多所以更常见）；本族判历史频率被用于否认当下已发警报。
 *   · optimism_bias 管**对未来结果的系统性高估**（我肯定不会
 *     失败）；本族不预测个人成败，判公共风险情境下以历史替代
 *     当下证据。
 *   · hasty_generalization 管**小样本过度概括**；本族的「历来」
 *     通常是大样本历史观察，问题不在样本量而在「用过去论证
 *     现在条件已变的场景」。
 *   · appeal_to_novelty/appeal_to_consequences 管**以新旧/后果
 *     好坏替代论证**；本族方向是把历史安全记录当作否认警报的
 *     理由。
 *
 * 判据（三腿链共现，缺一不判）：
 *   ① 腿① STABLE 常态/历史稳定陈述——历来/一向/从来/向来/历来
 *      如此/这么些年/这些年来/多年以来/历史上/祖祖辈辈/一直都 +
 *      没事/都这样/都没出/平安/顺利/安全；EN always / never
 *      before / has always been / every time / historically /
 *      for as long as；
 *   ② 腿② DISMISS 当下风险信号被否认——不用/不必/别/甭/不需要/
 *      没必要 + 撤离/疏散/当回事/理会/理它/担心/恐慌/紧张/管它/
 *      防范/准备 + 没事/不会/出不了；EN no need to / don't /
 *      there's no need + evacuate/worry/panic/prepare/worry
 *      about + it'll be fine / nothing will happen；
 *   ③ 腿③ INACTION 不行动结论——在家待着/待着别动/不撤/物资撤
 *      了/撤掉/不用准备/先放着/该干嘛干嘛/照常/懒得理；EN stay
 *      put / stay home / ignore it / wait and see / business as
 *      usual / carry on as normal。
 *   ④ 腿①×腿②×腿③同窗共现（ZH 90 / EN 200），三腿均查否定前缀
 *      （并不是历来如此/不能不当回事/not because it has always
 *      been fine）。
 *
 * 为什么取 VERIFY 级：单句可能只是转述一次群体反应、也可能是
 * 风险信号尚未证伪前的合理判断（历史数据确实支持低概率）。verify
 * 的语义是「这段话用历来无事否认了当下明确的风险信号，先核实
 * 本次条件是否真的与历史相同（有无破纪录指标/官方警报/新的因果
 * 条件），再决定是否采信其不行动结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 承认差异并按预案行动（这次和以往不同，按预案撤离/虽然
 *     历史上没事，但气象台数据显示……——CONTRAST 豁免）；
 *   · 有数据支持的判断（历史数据显示该区域洪水概率为 0.1%，
 *     故不撤离——DATA 豁免，须出现具体数字+数据来源词）；
 *   · 单腿陈述（只「历来都这样」无风险否认腿、只「不用撤离」
 *     无历史腿——缺一共现即无族形状）；
 *   · 否定纠偏（并不是历来如此/不能不当回事/不要再说以前没事）；
 *   · 概念教学（正常态偏误/normalcy bias/The Unthinkable/
 *     Ripley/Omer——CONCEPT 豁免）；
 *   · appeal_to_tradition/availability_bias/optimism_bias 领地
 *     （见上边界）。
 */
'use strict';

// ─── 腿① 常态/历史稳定陈述（中文）──────────────────────────────
const STABLE_ZH = [
  // 历来/一向/从来/向来 + 没事/都这样/平安/安全
  /(?:历来|一向|向来|从来|从小到大|这么多年|这么些年|这些年来|多年以来|一直以来|从来都|一直都|祖祖辈辈|世世代代|古到今|从古至今|历史上|以往|过去|以前|每次|年年|每年|通常|往常|平素|素来)[^。，！？；\n]{0,10}(?:都)?(?:没事|没出|没发生|安然|平安|无事|顺利|安全|太平|都这样|是这样|如此|一个样|一个样儿|没啥事|没大事|不出事|躲过|避开|绕开|躲开)/,
  // 「历来如此」类固定成语形（历来如此/向来如此/从来如此/一向如是）
  /(?:历来|一向|向来|从来|素来|一直|始终|向来|从来都)(?:如此|都是这样|就是这个样|都没事|没有例外)/,
  // 警报/演习 + 年年/每次 + 没事/狼来了（放宽结果词距离至 12 字符：
  // 「警报年年发，最后都没事」的「最后都没事」距「发」约 5 字符但被
  // 「，」切断；另补「发/搞/做」直接后接结果词形与「回回/屡屡」形）
  /(?:警报|演习|演练|预警|警告|预报|通知|提醒)[^。，！？；\n]{0,8}(?:年年|每年|每次|回回|屡屡|频频|频繁)(?:都)?(?:发|有|搞|做|来)/,
  /(?:警报|演习|演练|预警|警告|预报)[^。，！？；\n]{0,14}(?:没事|没出事|没应验|没应|落空|狼来了|白忙|虚惊|空惊|最后都没事)/,
  // 「从没/从未 + 真出过/真发生过」
  /(?:从没|从未|从来没有|从来没|不曾|未曾)[^。，！？；\n]{0,6}(?:真|真正|的确|确实)?(?:出过|发生过|应验|成真|出过事|出过问题|淹过|塌过|震过|烧过|死过|伤过)/,
  // 历史地名/本地 + 从没 + 动词（这儿从没淹过/我们这里从来没发生过）
  /(?:这里|这儿|本地|咱们这|我们这|这一带|这片|老家|城里|村里|镇上)[^。，！？；\n]{0,6}(?:从没|从未|从来没|从来没有|向来不|一向不)[^。，！？；\n]{0,8}(?:淹|塌|震|烧|旱|涝|雪|风|台风|地震|洪水|出事|出过)/,
];

// ─── 腿② 当下风险信号被否认（中文）──────────────────────────────
const DISMISS_ZH = [
  // 不用/不必/别/不需要/没必要 + 撤离/疏散/当回事/理会/担心/准备/防范
  /(?:不用|不必|不需要|没必要|用不着|甭|别|不要|犯不着|懒得)(?:去|给我|瞎|白)?[^。，！？；\n]{0,6}(?:撤离|疏散|转移|撤离|当回事|当真|理会|理它|理他|担心|恐慌|紧张|慌张|害怕|恐惧|管它|管他|防范|防备|准备|备|响应|执行|听|信|管)/,
  // 「没事/不会 + 出事/有问题/应验」否认形
  /(?:没事|不会|出不了|应不了|落不了|虚惊一场|问题不大|不要紧|没啥大事|不必当真)[^。，！？；\n]{0,6}(?:的|了|吧|嘛|呀|啊)?/,
  // 风险名词 + 不会 + 发生/应验（台风不会登陆/海啸不会来）
  /(?:台风|暴雨|洪水|海啸|地震|火灾|疫情|病毒|传染病|警报|预警|风险|危机|事故|灾难|塌方|泥石流|雪崩)[^。，！？；\n]{0,8}(?:不会|到不了|来不了|登陆不了|过不来|躲得开|绕着走|影响不到|轮不到|算不了什么)/,
  // 「别 + 风险动词 + 它」形（别理它/别管它/别听它）
  /别(?:理|管|听|信|在意|当回事|当真|操心|担心|害怕|恐慌)(?:它|他|这个|那|这一套|那套)?/,
  // 「该干嘛干嘛/照常」安心形
  /(?:该干嘛|该干啥|照常|照旧|一切照旧|日子照过|生活照旧|一切如常|照常过日子)/,
];

// ─── 腿③ 不行动结论（中文）────────────────────────────────────
const INACTION_ZH = [
  // 在家待着/待着别动/别出门
  /(?:在家|在家里|待在家|家里|待在|留在|猫在)[^。，！？；\n]{0,6}(?:待着|躺着|窝着|别动|不动|就行|好了|不出门|不出去|该干嘛)/,
  // 物资/预案 + 撤了/撤掉/收起来/用不上
  /(?:物资|装备|预案|应急包|救生|帐篷|沙袋|水粮|囤的|备的)[^。，！？；\n]{0,6}(?:撤|撤了|撤掉|收了|收起来|装箱|白囤|白备|白买|用不上|排不上|派不上)/,
  // 「不撤/不搬/不转移/不去」
  /(?:不|无需|用不着|不必)(?:撤离|疏散|转移|搬迁|撤离|出门|去|走|躲|避|准备|响应|执行|理会|管|理)/,
  // 「先放着/再说/等通知/看情况」拖延形
  /(?:先放着|先搁着|先不管|先拖着|等等看|看情况|再看看|等通知|等消息|等上面|等官方|等结果|走一步看一步|船到桥头)/,
  // 「睡大觉/睡觉去/该吃吃该喝喝」安然形
  /(?:睡大觉|睡觉去|该吃吃|该喝喝|该睡睡|该玩玩|吃好喝好|该干啥干啥|该干嘛干嘛|无所谓|随它去|爱咋咋地)/,
  // [r460] 否认词 + 风险对象 的「不理」形本身即不行动结论（别理它/甭管它/
  //   不用理会/不用管/懒得管）——「别+动词+它」作为结尾，句内不再需要
  //   第二个动作短语。裸名词自查：去掉「它」后「别理/不用管」仍成立。
  /(?:别|甭|不必|不用|不需要|没必要|用不着|懒得|犯不着)(?:去)?(?:理|管|理会|理睬|操心|过问|挂心|放在心上|当回屁事|当回事|听|信|在意|在乎|关注|重视|警醒|警惕)/,
  // [r460] 风险自息形：自己就好了/会过去/会平息/扛得住/熬过去（被动等待
  //   即为不行动——等它自然消退）
  /(?:自己|自然而然|自然而然的|迟早|总会|早晚)(?:就)?(?:会)?(?:好|过去|平息|消退|结束|没事|扛过去|熬过去|缓过来|挺过去)|(?:过|熬|扛|挺|挨)(?:几天|两天|一阵|一段时间|阵子)(?:就)?(?:好|过去|没事)/,
  // [r460] 否认断言合一形：「不会有事的/不会出事的/不会出问题」——句尾
  //   既是否认风险信号也隐含不行动结论（不采取任何应对）。与腿②
  //   DISMISS 共现即可成族，无需第二个动作短语。
  /(?:不会|不可能|绝不会|肯定不会|想必不会|料想不会|断不会)(?:有|出|发生|遇到|闹)?(?:事|问题|状况|乱子|意外|危险|风险|灾|祸)/,
];

// ─── 腿① 常态/历史稳定陈述（英文）──────────────────────────────
const STABLE_EN = [
  /\b(?:always|never|ever)\b[^.]{0,30}\b(?:been\s+fine|been\s+okay|been\s+alright|turned\s+out\s+fine|worked\s+out|happened\s+before|happened\s+here|was\s+the\s+case)\b/i,
  /\b(?:for\s+)?(?:as\s+long\s+as|every\s+time|each\s+time|historically|in\s+the\s+past|traditionally)\b[^.]{0,40}\b(?:fine|okay|alright|safe|nothing|never|no\s+one|no\s+problem|worked)\b/i,
  /\b(?:it|this|that|things?)\s+(?:has|have|had)\s+always\s+been\b/i,
  /\bnever\s+(?:happened|occurred|been\s+an?\s+issue|been\s+a\s+problem|pan(?:ned)?\s+out|materiali[sz]ed)\b/i,
  /\b(?:the\s+)?(?:warnings?|alerts?|drills?|predictions?|forecasts?)\s+(?:never|always)\b/i,
  /\b(?:history|the\s+record|past\s+experience)\s+(?:says|shows|tells\s+us|suggests)\b/i,
  /\bhas\s+never\s+(?:been\s+an?\s+issue|been\s+a\s+problem|caused\s+trouble)\b/i,
  // [r460 补] 主体过去时否定经历族：「This area has never flooded」「It has
  // never been hit」这类「地点/事物 + 完成时否定 + 事件动词」。与上方族 5
  // （never happened 类）的区别：族 5 是不及物泛化事件，本族带主语 +
  // 具体灾害动词。动词用前缀匹配不加尾 \b——文本是 flooded/struck/hit，
  // flood\b 会被词内后续字符（ed/s/t）卡死（r460 实测踩坑：族首版加 \b
  // 导致 has never flooded 整句漏判）。has never been hit 的 been 可省，
  // 因为 been 本身在 (?:been\s+)? 里可选。
  // [r462 补] 动词表扩族：overflow（That river has never overflowed）与
  //   burst/topped 同族水文事件词；前缀匹配不加尾 \b（同 flooded 坑）。
  /\b(?:has|have)\s+never\s+(?:been\s+)?(?:flood(?:ed|ing|s)?|hit|struck|burn(?:t|ed|ing)?|erupt(?:ed|ing|s)?|collaps(?:e|ed|es|ing)|fail(?:ed|ing|s|ure|ures)?|breach(?:ed|es|ing)?|damag(?:e|ed|es|ing)|injur(?:y|ies|ed|es|ing)|kill(?:ed|ing|s)?|occur(?:red|ring|s)?|happen(?:ed|ing|s)?|materiali[sz](?:e|ed|es|ing)|overflow(?:ed|ing|s)?|burst|topped|overtopp(?:ed|ing)|spill(?:ed|ing)|give(?:n)?\s+way|given\s+way|wash(?:ed)?\s+out|sink(?:ing)?|sank|submerg(?:e|ed|es|ing)|inundat(?:e|ed|es|ing))/i,
  // [r462 补] 「从不需要做某事」形：We have never had to leave / we have
  //   never had to evacuate——用完成时否定「必要性」表达历史稳定，是英语
  //   母语者最常用的正常态偏误表述形之一（r462 探针 MISS 实证）。动词收
  //   撤离/避险类，防止「never had to work hard」类无关句误入腿①（即便
  //   误入也需腿②③共现才成族，双保险）。
  /\b(?:has|have)\s+never\s+had\s+to\s+(?:leave|leaving|evacuate|evacuating|flee|fleeing|escape|escaping|relocate|relocating|move|moving|seek\s+shelter|take\s+shelter|find\s+shelter|close|shut|board\s+up|sandbag|stock\s+up|worry|worrying|care|caring|do\s+anything|act|react)/i,
  // [r462 补] 被迫行动的历史缺失形：「We have never had to leave」「It has
  //   never been necessary to evacuate」——与族 9（has never + 灾害动词）分工：
  //   族 9 是「灾害从未发生」，本族是「从未被迫行动」（had to / been forced
  //   to / been necessary to + leave/evacuate）。r462 实证：样本 "We have
  //   never had to leave, so ignore the order" 腿②③已命中但腿①缺此形，
  //   整句漏判。to 可选因 "never been forced out" 无 to 形。
  /\b(?:has|have)\s+never\s+(?:had|been)\s+(?:to\s+|forced\s+to\s+|necessary\s+to\s+|needed?\s+to\s+|obliged\s+to\s+|required\s+to\s+)?(?:leave|left|evacuate|evacuated|evacuating|relocat(?:e|ed|ing)|move\s+out|moved\s+out|flee|fled|seek\s+shelter|take\s+shelter|go\s+to\s+a\s+shelter|get\s+out)\b/i,
  // [r460 补] 反义形：「We have always lived here safely」——always + 完成时
  //   持续状态。与族 3（it has always been）分工：族 3 主语限 it/this/that/
  //   things，本族收 we/they/people + lived/stayed/been 类延续动词。
  /\b(?:we|they|people|everyone|residents)\s+(?:has|have|had)\s+always\s+(?:been|liv(?:e|ed|es|ing)|stay(?:ed|s|ing)?|surviv(?:e|ed|es|ing|or|ors)?|manag(?:e|ed|es|ing)|got(?:ten)?)\b/i,
  // [r462 补] 族 9 动词表外扩：r462 探针剩余 2 条 MISS 的根因诊断——
  //   「That river has never overflowed」「We have never had to leave」中
  //   overflowed / had to leave 不在族 9 动词表内（腿②③实际已命中，纯粹
  //   腿①缺口）。动词形分三组：① 灾害/故障动词前缀族续补（overflow /
  //   breach / slide / slide / blow / gust / strike...）；② 「never had to
  //   + 动词」被迫行动否定形（never had to leave/evacuate/flee/rebuild/
  //   move/close/repair——从未被迫做过某事，历史顺利的强断言）；③ 「never
  //   needed + 名词」形（never needed insurance/repairs/aid/help）。
  /\b(?:has|have)\s+never\s+(?:been\s+)?(?:overflow|overflowed|overflown|breach(?:e|ed|es|ing)|breached|washed\s+away|swept\s+away|slide|slid|slump|slump|sink|sank|sunk|buckl|blow(?:n|ing)?|gust|strik(?:e|ing)|strike|toppl|tilt|lean|shift|drop(?:ped)?|fall(?:en)?|fell|deteriorat|degrad|erod|worn|wore|rust|rot(?:ted)?|leak(?:ed|s|ing)?|flood(?:ed|ing|s)?|flood|burn(?:t|ed|ing)?|collaps(?:e|ed|es|ing)|fail(?:ed|ing|s|ure|ures)?)\b/i,
  /\b(?:has|have)\s+never\s+(?:had\s+to|been\s+forced\s+to|been\s+made\s+to|needed\s+to|had\s+any\s+need\s+to)\s+(?:leave|evacuate|evacuated|flee|fled|run|move|moved|relocate|relocated|rebuild|rebuilt|repair|repaired|close|closed|shut|evacuating|seek\s+shelter|take\s+shelter|abandon)\b/i,
  /\b(?:has|have)\s+never\s+needed\s+(?:any\s+)?(?:insurance|repair|repairs|aid|help|assistance|reinforcement|reinforcing|subsid|bailout|rescue|evacuation)\b/i,
];

// ─── 腿② 当下风险信号被否认（英文）──────────────────────────────
const DISMISS_EN = [
  // [r461 补] 备灾动词族（board up / sandbag / stock up / secure ...）
  //   ——存量族只收 evacuat/worry/panic/prepar/... 通用动词，「no point
  //   sandbagging」「no need to board up」是备灾语料最高频的否认形，
  //   属同族漏收动词。
  /\b(?:no|there'?s\s+no|there\s+is\s+no)\s+(?:need|point|reason|use)\s+(?:to|in|for)?\s*(?:evacuat|worry|panic|prepar|respond|react|bother|care|take\s+it\s+seriously|board\s+up|sandbag|stock\s+up|stockpil|secur|reinforc|evacuating|check)/i,
  /\b(?:don'?t|do\s+not|no\s+need\s+to|stop)\s+(?:worry|panic|bother|care|evacuate|prepare|react|respond)\b/i,
  /\b(?:it'?ll|it\s+will|it'?s\s+going\s+to)\s+(?:be\s+)?(?:fine|okay|alright|blow\s+over|pass|be\s+nothing)\b/i,
  /\b(?:nothing|not\s+anything)\s+(?:will|is\s+going\s+to|'?s\s+gonna)\s+(?:happen|come\s+of\s+it|materiali[sz]e)\b/i,
  /\b(?:overreact|over-?reaction|hysteria|alarmist|fear[- ]?mongering)\b/i,
  /\b(?:ignore|dismiss|brush\s+off|write\s+off|pay\s+no\s+attention)\s+(?:it|the\s+(?:warning|alert|risk|order|orders|evacuation|advisory|notice|forecast|prediction|threat)|them)\b/i,
  // [r461 补] 动词 + 指令/预案类宾语（「disregard the evacuation order」
  //   「dismiss the emergency plan」）——存量族 6 只收 it/the warning/the
  //   alert/the risk/them，真实语料里被无视的对象多为 order/advisory/
  //   plan/forecast 等具体指令物，属同族漏收宾语形。
  /\b(?:ignore|ignored|ignoring|disregard|disregards|disregarded|dismiss|dismissed|dismisses|dismissing|brush\s+off|brushed\s+off|write\s+off|wrote\s+off|pay\s+no\s+attention\s+to)\s+(?:the\s+|this\s+|that\s+|any\s+|their\s+|our\s+)?(?:\w+\s+){0,2}?(?:warning|warnings|alert|alerts|advisory|advisories|order|orders|evacuation|notice|forecast|forecasts|prediction|predictions|threat|plan|plans|protocol|guidance|recommendation|directive|risk|risks|danger)\b/i,
  // [r461 补] 同族再加一条：动词 + 限定词 + 至多两个修饰词（safety
  //   order / emergency directive / mandatory evacuation order）——上行族
  //   限定词后直接接名词，"disregard the safety order" 的 safety 夹在
  //   中间导致漏判；此处放开 (?:the\s+)?(\w+\s+){0,2} 形。
  /\b(?:the\s+)?(?:risk|threat|danger|warning|alert)\s+(?:is\s+)?(?:overblown|exaggerated|minimal|negligible|nothing)\b/i,
];

// ─── 腿③ 不行动结论（英文）─────────────────────────────────────
const INACTION_EN = [
  /\b(?:stay|remain)\s+(?:put|home|inside|indoors|calm|seated)\b/i,
  /\b(?:carry\s+on|go\s+on|proceed)\s+(?:as\s+)?(?:normal|usual|before)\b/i,
  /\bbusiness\s+as\s+usual\b/i,
  /\b(?:wait|wait\s+and\s+see|sit\s+(?:this\s+)?(?:one\s+)?out|ride\s+it\s+out)\b/i,
  /\b(?:pack\s+up|put\s+away|stow)\s+(?:the\s+)?(?:supplies|kits?|gear|emergency|evacuation|bags?)\b/i,
  /\b(?:no|skip|without)\s+(?:evacuation|evacuating|preparation|preparing|action|response)\b/i,
  // [r460] no need to + 动作 本身即不行动结论（no need to evacuate /
  //   no need to do anything / no need to prepare anything）——英语里
  //   否认必要性的短语即为句尾的不行动断言，同中文腿③「别理」族
  // [r461 补] 备灾动词族（board up / sandbag / stock up / secure ...）
  //   ——存量族只收 do/take/make/evacuate/prepare/... 通用动词，
  //   「no need to board up the windows」「no need to sandbag」是备灾
  //   语料最高频的不行动断言形，属同族漏收动词。
  /\bno\s+(?:need|point|reason|use)\s+(?:to|in\s+doing)?\s*(?:do|take|make|evacuate|prepare|respond|react|bother|care|worry|act|board\s+up|sandbag|stock\s+up|secure|reinforce|reinforcing|evacuating|stockpiling|stockpile)\b/i,
  // [r461 补] no point/need + 备灾动词（-ing 形）——上行族动词后带 \b，
  //   "sandbagging" 的 -ing 后缀同样卡死 \b（同 r460 flooded 踩坑）。
  /\bno\s+(?:need|point|reason|use)\s+(?:to\s+|in\s+|of\s+)?(?:board(?:ing)?\s+up|sandbag(?:ging)?|stock(?:ing)?\s+up|stockpil(?:e|ing)|secur(?:e|ing)|reinforc(?:e|ing)|evacuat(?:e|ing)|prepar(?:e|ing))\b/i,
  // [r460] 被动等待自然消退（let it blow over / it will pass on its own /
  //   let nature take its course / it will sort itself out）
  /\b(?:let|leave)\s+it\s+(?:be|blow\s+over|sort\s+itself\s+out|pass)\b|\bwill\s+(?:blow\s+over|pass|sort\s+itself\s+out|work\s+itself\s+out)\b|\bwait\s+(?:for|until)\s+it\s+to\s+(?:pass|blow\s+over|subside)\b/i,
  // [r460 补] 忽略安全指令族：ignore/dismiss the evacuation order 本身即
  //   不行动结论（同中文腿③「别理它」合一族：否认+不动作在同一短语里，
  //   英文侧这条形最常用，r460 实测 We have always lived here safely, so
  //   ignore the evacuation order. 因缺腿③整句漏判）。动词前缀匹配不加
  //   尾 \b（disregard/disregarded 等同词根变体）。
  // [r461 补] 宾语扩族：forecast/prediction/plan/threat/danger/risk——
  //   r460 实测 "disregard the safety order" / "dismiss the forecast" 类
  //   具体指令物宾语不在族内；与腿②新宾语族同源，分工：腿③重「不动作
  //   结论」，腿②重「风险被否认」。
  // [r462 补] 宾语修饰词层放开：存量族只允许限定词（the/that/this/any/
  //   their），r461 腿②已放开同形。r462 实证：样本 "disregard the safety
  //   order." / "disregard the flood warning." 中 safety/flood 这类「修饰
  //   词 + 指令物」形被 (?:the\s+...)? 后的裸词 \b 挡死，整句三腿缺腿③
  //   漏判（探针 BEFORE 3/5 MISS）。放开为：限定词? + 修饰词? + 指令物，
  //   修饰词限定 1-2 词（safety / evacuation / flood / mandatory / local
  //   / official / immediate / evacuation...），防无限贪吃。
  /\b(?:ignore|ignoring|dismiss|dismissing|disregard|disregarding|forget|skip|shelve|pay\s+no\s+attention\s+to)\s+(?:the\s+|that\s+|this\s+|any\s+|their\s+|a\s+)?(?:(?:mandatory|official|local|immediate|state|city|county|federal|new|latest|current|evacuation|safety|flood|storm|fire|tsunami|hurricane|tornado|emergency|voluntary)\s+)?(?:evacuation|evacuate|order|orders|alert|alerts|warning|warnings|advisory|advisories|notice|directive|instruction|siren|forecast|forecasts|prediction|predictions|plan|plans|threat|threats|danger|risks?)\b/i,
];

// ─── 距离窗（三腿共现）────────────────────────────────────────
const PAIR_ZH = 90;
const PAIR_EN = 200;

// ─── 豁免：概念讨论（本族名称/案例/教学定义句）────────────────
const CONCEPT_ZH = /(?:正常态偏误|正常性偏误|正常化偏误|常态偏误|正常反应|灾难心理学|风险沟通|《不可想象》|奥马尔|里普利|警觉失灵|狼来了效应)/;
const CONCEPT_EN = /\bnormalcy\s+(?:bias|biased|effect)\b|\bnormalcy\s+trap\b|\bOmer\b|\bRipley\b|\bthe\s+unthinkable\b|\bdisaster\s+(?:psychology|sociology)\b|\brisk\s+communication\b/i;

// ─── 豁免：承认当下差异并行动（CONTRAST——历史 vs 本次不同 + 行动）──
const CONTRAST_ZH = /(?:这(?:次|一回|一次)|本次|这回|如今|现在|当前)[^。，！？；\n]{0,12}(?:不同|不一样|不一样了|变了|有变化|出现变化|升级|破纪录|前所未有|反常|特殊|例外|例外情况)|(?:虽然|尽管|固然|虽说)[^。，！？；\n]{0,16}(?:历来|一向|从来|历史上|以往|以前|每次都)[^。，！？；\n]{0,12}(?:但|但是|可是|然而|不过|只是)|(?:气象台|地震台|警报|预警|官方|政府|应急|指挥部)[^。，！？；\n]{0,10}(?:已|已经|明确|正式|发出|发布|升级|启动)[^。，！？；\n]{0,8}(?:撤离|疏散|转移|响应|预案|警报)/;
const CONTRAST_EN = /\b(?:this\s+time|this\s+one|now|the\s+current\s+(?:one|situation))\b[^.]{0,40}\b(?:different|isn'?t\s+the\s+same|has\s+changed|unprecedented|record[- ]breaking|unlike)\b|\b(?:although|though|while|even\s+though|despite\s+the\s+fact\s+that)\b[^.]{0,40}\b(?:always|never|historically|in\s+the\s+past)\b|\b(?:officials?|authorities|the\s+government|emergency\s+(?:services|management))\b[^.]{0,40}\b(?:have\s+)?(?:issued|ordered|upgraded|declared|activated)\b/i;

// ─── 豁免：有数据支持的判断（DATA——具体数字 + 数据来源词）────
const DATA_ZH = /(?:概率|几率|可能性|频率|统计|数据|记录|研究|模型|分析)(?:为|是|显示|表明|达到|等于|约|大约)?[^。，！？；\n]{0,6}[0-9]+(?:\.[0-9]+)?\s*(?:%|％|个百分点|个基点|bp|万分之|千分之|百万分|ppm|倍|次\/|人\/|例\/|起\/)/;
const DATA_EN = /\b(?:probability|likelihood|odds|frequency|rate|chance)\s+(?:of|is|are|=)\s*[0-9.]+\s*%|\b[0-9.]+\s*%\s+(?:probability|likelihood|chance|risk)\b|\bdata\s+(?:shows?|indicates?|suggests?)\b[^.]{0,30}\b[0-9]/i;

// ─── 工具 ─────────────────────────────────────────────────────
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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|谈不上是|不会再|不会|不再|别|莫|甭|拒绝|反对|驳斥|批判|否定|打破|破除|纠正|纠)[^。，！？；\n]{0,6}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不)/;

const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b|\bisn'?t\s+(?:always|necessarily)\b|\bdoesn'?t\s+(?:always|mean)\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near|stop|refuse\s+to|avoid)\s+(?:\w+\s+){0,4}$/i;

// r462：否定守卫窗口按腿分取。腿②/腿③ 本身是「动作」（disregard / ignore /
// stay put），否定它必须紧贴匹配点（"must not disregard"）；腿① 的 STABLE 否定
// （"has never collapsed"）可以离动作腿很远，若沿用同一宽窗会把远处 STABLE 的
// never 误当动作腿自身的否定，杀死真实攻击（r461 实证 5 条缺陷样本 3 条 MISS）。
const NEG_WIN_EN_ACTION = 12;

function matchAlive(text, x, useNeg, negWinEn) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const winEn = typeof negWinEn === 'number' ? negWinEn : 45;
  const beforeEn = text.slice(Math.max(0, x.idx - winEn), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, useNeg, negWinEn) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, negWinEn)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 三腿链配对：STABLE × DISMISS × INACTION（均查否定前缀），同窗共现成签名。
// 实现：先 STABLE×DISMISS 成对，再要求 INACTION 腿落在该对的并集跨度 + 窗内。
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    { stable: R.STABLE_ZH || STABLE_ZH, dismiss: R.DISMISS_ZH || DISMISS_ZH, inaction: R.INACTION_ZH || INACTION_ZH, win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh' },
    { stable: R.STABLE_EN || STABLE_EN, dismiss: R.DISMISS_EN || DISMISS_EN, inaction: R.INACTION_EN || INACTION_EN, win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en' },
  ];
  for (const L of langs) {
    // 腿① STABLE 保持宽窗 45（其否定修饰可离得远）；腿② DISMISS / 腿③
    // INACTION 是动作腿，否定必须紧贴匹配点，收窄到 NEG_WIN_EN_ACTION，
    // 避免远处 STABLE 的 never 杀死真实动作腿（r462 修复）。
    const sm = collect(text, L.stable, true);
    if (sm.length === 0) continue;
    const dm = collect(text, L.dismiss, true, NEG_WIN_EN_ACTION);
    if (dm.length === 0) continue;
    const im = collect(text, L.inaction, true, NEG_WIN_EN_ACTION);
    if (im.length === 0) continue;
    for (const s of sm) {
      for (const d of dm) {
        if (dist(s, d) > L.win) continue;
        for (const i of im) {
          // INACTION 须同时与 STABLE、DISMISS 各自距离在窗内
          if (dist(s, i) > L.win || dist(d, i) > L.win) continue;
          sigs.push({ lang: L.lang, stable: s.raw, dismiss: d.raw, inaction: i.raw });
        }
      }
    }
  }
  return sigs;
}

/**
 * 三腿链签名：常态/历史稳定陈述 × 当下风险信号被否认 × 不行动结论。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectNormalcyBias(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（正常态偏误/灾难心理学/《不可想象》教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：承认当下差异并行动（这次和以往不同/虽然历来……但……按预案撤离）
  if ((R.CONTRAST_ZH || CONTRAST_ZH).test(text) || (R.CONTRAST_EN || CONTRAST_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：有数据支持的判断（概率 0.1% 之类具体数字 + 来源词）
  if ((R.DATA_ZH || DATA_ZH).test(text) || (R.DATA_EN || DATA_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.74 : 0.64;
  return {
    hit: true,
    dimension: 'normalcy_bias',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '历史稳定「' + x.stable + '」×否认风险信号「' + x.dismiss + '」×不行动「' + x.inaction + '」'
      : 'history-stable "' + x.stable + '" x risk-dismissed "' + x.dismiss + '" x inaction "' + x.inaction + '"')),
    details: s.lang === 'zh'
      ? '正常态偏误(' + sigs.length + '处: 以历来稳定「' + s.stable + '」否认当下风险信号「' + s.dismiss + '」并拒绝行动「' + s.inaction + '」，历史频率被用来替代当下证据)(zh)'
      : 'normalcy bias(' + sigs.length + 'x: history-stable "' + s.stable + '" x risk-dismissed "' + s.dismiss + '" x inaction "' + s.inaction + '")(en)',
    guidance: '正常态偏误指灾难警报到来时，人们以「历来如此、从没出过事」为由系统性地低估甚至否认眼前明确的风险信号，从而拒绝执行既定预案——历来台风到我们这儿都会绕开，不用撤离，在家待着就行 / 这种警报年年发，最后都没事，别理它 / 历史上从没淹过，这次也不会有事，把物资撤了吧 / it always turns out fine, the warnings never pan out, no need to evacuate, just stay put。请补上论证：历史频率不改变当下条件已经变化的事实，「以前没事」与「这次会不会出事」是两个独立命题；历史上没有发生过的事，第一次发生时不因「从未发生」而降低概率，破纪录指标、官方警报、新的因果条件都是需要被认真对待的信号而非安心理由。请核对本次条件与历史的真实差异（降雨量/水位/结构老化/人口密度等是否变化），并按预案分级响应；若确有数据支持低风险，给出概率数字与来源，而非仅凭历史无事故。',
    tags: ['psychology', 'cognitive-bias', 'normalcy-bias', 'risk-perception', 'disaster-response', 'evidence-discipline'],
  };
}

module.exports = {
  detectNormalcyBias,
  __testCollect: collect,
  __internals: () => ({
    STABLE_ZH, STABLE_EN,
    DISMISS_ZH, DISMISS_EN,
    INACTION_ZH, INACTION_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CONTRAST_ZH, CONTRAST_EN,
    DATA_ZH, DATA_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
