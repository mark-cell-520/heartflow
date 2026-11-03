/**
 * src/unfalsifiable-confirmation.js — 「双果自证（不可证伪自我证实）」检测器
 * （第 202 个判别维度，r205）
 *
 * [r205 立项] philosophy_decision 在当前引擎（v6.8.133，201 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实证：
 * r167 轮探针曾把「不可证伪断言」登记为候选族（one-sided-dismissal.js
 * 注释留档：该族当时仅 6/8 被其他维度顺带代拦，无维度实现其两腿结构）；
 * r205 复测——攻击样本 8 条中 5 条 gate.action=pass（现有维度真零命
 * 中，含中英双语/裸名词/带修饰/倒装/长句变体）、良性 6 条中 4 条
 * pass（另 2 条被 perfect_error / activity_outcome_confusion 既有拦
 * 截，非本族误伤）。外部研究：HN Algolia "falsifiability" 前八均为
 * 维基/哲学博客（Popper 证伪主义、Sagan 车库里喷火龙、Hans Albert
 * 的 Immunisierung gegen Kritik 免疫策略讨论）；Semantic Scholar
 * 检索被限流（429）；GitHub sort=stars 前二为
 * cpt13-g/clarify-research-idea ★282 与 tonyblu331/research-proof
 * ★52，均为 LLM 驱动的研究想法压力测试，无可集成纯规则实现——按心
 * 虫既有维度形态自建纯规则判据（双果自证为经典 demarcation 问题核
 * 心结构，论文/仓库仅作分类学参考）。
 *
 * 辨别的族：双果自证（unfalsifiable self-confirmation / self-sealing
 * argument / both-outcomes confirmation）——把一对**互斥结果**（涨/
 * 跌、成/败、灵/不灵、应验/没应验、出现/没出现）设定成**同一个自我
 * 结论的证据**：无论哪种结果发生，都「证明/验证/说明」我对了、我的
 * 理论成立、我的判断准：
 *   如果数据涨了，说明我的方法有效；如果数据跌了，那是市场还没认识到它的价值。
 *   无论实验灵不灵，都证明我的理论是对的。
 *   这个预言实现了说明我准，没实现说明天机不可泄露，反正都是我对。
 *   测出来是我功力起作用，测不出来是你心不诚——横竖都说明我没错。
 *   Whether the stock goes up or down, it proves my analysis is right.
 *   If the treatment works, my theory is vindicated; if not, the patient just didn't believe enough.
 *   Either way, this confirms my model — no outcome can disprove it.
 *
 * 为什么这是判别者的核心缺口（对齐「寻真而非似是而非」）：一个命题若
 * **不存在任何能推翻它的观察**，它就不是在陈述世界，而是在规避判
 * 别——举证责任被反向消灭（「不需要证据，怎么都赢」）。这是伪科学
 * 自辩（Sagan《我车库里的喷火龙》：喷火龙存在与否都「证明」它存
 * 在）、阴谋论免疫策略（证据出现=证实，证据缺席=更证实）、营销自
 * 证话术（涨了=品牌力，跌了=市场不懂）的核心结构，也是 AI 转述用
 * 户观点时最容易照单全收的似是而非：它让「永远正确」冒充「曾经
 * 正确」。
 *
 * 与既有维度的边界（r205 归因）：
 *   · absolute_claim（第 96 维族）管**不留余地的断言**（一定/必
 *     然/百分之百），本族必须有互斥结果对 + 自证结论两腿共现。
 *   · confidence / perfect_error 管**校准与表述瑕疵**，本族管的是
 *     **免疫结构**：结论对所有可能观察封闭。
 *   · special_pleading（第 150 维）管**给自己开规则后门**，本族不
 *     开后门、主张的是「任何结果都替我作证」。
 *   · kafkatrapping（第 143 维）管**把否认当作罪证**（你否认=你
 *     心里有鬼），本族不针对否认动作、针对的是结果全覆盖。
 *   · helplessness_induction 的「无论你签不签，结果都一样」管**放
 *     弃抵抗的胁迫诱导**，本族管的是**认识论上的自我封闭**。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① OUTCOMES 互斥结果对（中英）：双条件分句型（如果/若/一旦/
 *     要是+条件A；否则/不然/反之/反过来/如果…不+条件B）、无论句型
 *     （无论/不管/不论+（A 还是 B / A 与否 / 是否 A / A 不 A / 结果
 *     如何 / 怎样）+ 都/也）、对举极性型（实现/应验/灵验/成功/出现
 *     + 没/不/未 + 同族词；EN whether X or not / either way / no
 *     matter what / if it works…if not / whatever happens / works
 *     or it doesn't）。
 *   · 腿② CONFIRM 同一自证结论（中英）：证明/验证/说明/表明/意味
 *     着/印证/坐实 + 我/我们/本人 + 对·正确·没错·成立·有效·准·高
 *     明·领先；我的（理论/观点/学说/预言/判断/方法/模型/能力/框
 *     架）+ 是+对/正确/成立/有效；反正/横竖/左右 + 都 + 我+对；EN
 *     proves/confirms/shows/vindicates + I'm/my theory is + right/
 *     correct/valid/true、either way + confirms、right either way /
 *     no matter the outcome、nothing could disprove it。
 *   · 缺腿不判：只有腿①（「如果成功就扩张，失败了就收缩」）是条
 *     件规划；只有腿②（「数据说明我的方法有效」）是单结果推断，
 *     归 unsupported_claim / confidence。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人的免疫论证、科学 Robustness
 * 讨论（「无论温度如何，能量守恒都成立」是可真证伪的定律陈述）、
 * 或带独立证据的自辩。verify 的含义是「该结论对所有可能观察封
 * 闭，需回到可检验预测与证据记录」，而不是直接判死。
 *
 * 明确不判的（豁免——这些是诚实判别、证据陈述或概念讨论）：
 *   · 概念/批判转述（不可证伪/可证伪性/证伪主义/自我证实/免疫策
 *     略/举证责任 + 是谬误·问题·不是科学；EN unfalsifiable claim
 *     is a fallacy / falsifiability / Popper / Sagan's dragon——
 *     讨论这个概念本身不是运用它）；
 *   · 诚实不确定性/验证纪律（需要更多数据/证据才能判断、两种结果
 *     都可能、下结论为时过早、要先验证/检验；EN needs more
 *     evidence before / both outcomes remain possible / premature
 *     to conclude——主动寻求判别而非宣称已证）；
 *   · 疑问句（含 ?/？）；
 *   · 纯条件规划/单结果推断（缺自证腿）。
 */
'use strict';

// ─── 腿① OUTCOMES 互斥结果对（中文）────────────────────────────
// 枚举腿自查（r161 教训）：分支标记与极性动词收裸词形态（如果/无论/
// 实现/没实现 去后缀仍命中）；双条件型、无论型、对举极性型三形态并列。
const OUTCOMES_ZH = [
  // A1 双条件分句型：如果/若/一旦/要是+条件A …… 否则/不然/反之/反过来+条件B
  /(?:如果|若|一旦|要是|倘若|设若)[^。！？!?]{0,26}(?:；|;)[^。；;]{0,18}(?:如果|若|否则|不然|反之|反过来|反向)/,
  // A2 双条件同句逗号型：「如果A……，如果B……」
  /(?:如果|若|要是|倘若)[^。！？!?]{0,24}(?:，|,)[^。！？!?]{0,40}(?:如果|若)[^。！？!?]{0,24}/,
  // A3a 对举极性型（neg 在第二分句句首）：「实现了…，没实现…」「涨了…，没涨…」
  /(?:实现|应验|灵验|成功|出现|上涨|涨了|赢了|说中了|猜中了|奏效|生效|测出|看出)[^。，！？!?]{0,16}(?:，|,|；|;)[^。，！？!?;]{0,10}(?:没|未|不)[^。，！？!?;]{0,8}(?:实现|应验|灵验|成功|出现|下跌|跌了|输了|奏效|生效|测出|看出|相信|认可|接受)/,
  // A3b 极性否定嵌在动词内（倒装）：「测出来是A，测不出来是B」
  /(?:测|查|验|试|观察|看到|得到|算|猜|想)[^。，！？!?]{0,4}(?:出来|到|出|准|中|对)[^。，！？!?]{0,16}(?:，|,)[^。，！？!?]{0,6}(?:没|未|不)/,
  // A3c 「测出来是A，没测出来是B」语序（neg 在重复动词前）
  /(?:测|查|验|试|观察|看到|得到|算|猜|想)[^。，！？!?]{0,4}(?:出来|到|出|准|中|对)[^。，！？!?]{0,16}(?:，|,)[^。，！？!?]{0,4}(?:没|未|不)[^。，！？!?]{0,4}(?:测|查|验|试|观察|看到|得到|算|猜|想)/,
  // A3d 裸反义对举：「涨了是A，跌了是B」（无 neg 的对照分句）
  /(?:涨|跌|升|降|赢|输|成|败|高|低|多|少|好|坏)(?:了)?[^。，！？!?]{0,14}(?:，|,)[^。，！？!?]{0,8}(?:跌|涨|降|升|输|赢|败|成|低|高|少|多|坏|好)(?:了)?/,
  // A4 无论句型：无论/不管/不论 + （A 还是 B）+ 都/也
  /(?:无论|不管|不论是|无论是|任凭)[^。！？!?]{0,20}(?:还是|或是|或)[^。！？!?]{0,18}(?:都|也)/,
  // A5 无论句型：无论/不管 + （A 与否 / 是否 A / A 不 A / 结果如何 / 好坏 / 胜负）+ 都/也
  /(?:无论|不管|不论)[^。！？!?]{0,16}(?:与否|是否|不|怎样|如何|怎么样|结果|情况|好坏|胜负|输赢)[^。！？!?]{0,12}(?:都|也)/,
  // A6 横竖/左右/反正 + 都/也（结果全覆盖的口语形态）
  /(?:横竖|左右|反正|怎么说|无论如何|不论怎样)[^。！？!?]{0,12}(?:都|也)/,
  // A7 显式不可推翻宣告：任何/无论 + 结果/情况/证据/观察 + 都 + 不能/无法 + 推翻/证伪/否定/动摇
  /(?:任何|无论|不管)[^。！？!?]{0,8}(?:结果|情况|证据|观察|数据|现象)[^。！？!?]{0,8}(?:都|也)?(?:不能|无法|不足以|难以|根本)[^。！？!?]{0,4}(?:推翻|证伪|否定|动摇|反驳)/,
];

// ─── 腿① OUTCOMES 互斥结果对（英文）─────────────────────────────────
const OUTCOMES_EN = [
  /\bwhether\s+[\w\s'"]{1,40}\s+or\s+not\b/i,
  /\b(?:whether|no\s+matter\s+whether|regardless\s+of\s+whether)\s+[\w\s'"]{1,30},?\s+[\w\s'"]{0,20}\s+or\s+(?:it\s+)?(?:doesn'?t|don'?t|isn'?t|fails?|not)\b/i,
  // whether X or Y（对照分支对——腿②自证结论仍须共现，防「whether to go or stay」类规划句误判）
  /\bwhether\s+[\w\s'"]{1,40}\s+or\s+[\w\s'"]{1,24}\b/i,
  /\b(?:either\s+way|one\s+way\s+or\s+(?:the\s+)?other|whichever\s+way|both\s+ways)\b/i,
  /\bno\s+matter\s+(?:what|how|which|whether)\b/i,
  /\bwhatever\s+(?:happens|the\s+outcome|the\s+result)\b/i,
  // if X … my/the … right/correct/vindicated … if not / otherwise / if it fails
  /\bif\s+[\w\s'"]{1,30},?\s+(?:my|our|the)\s+[\w\s'"]{1,24}\s+(?:is|are|will\s+be|was)?\s*(?:proven|vindicated|validated|confirmed|right|correct)[\w\s'"]{0,24}[;,]?\s+if\s+(?:not|it\s+fails|it\s+doesn'?t|otherwise)\b/i,
  /\b(?:works?|succeeds?|comes?\s+true|pans?\s+out)\s+or\s+(?:it\s+)?(?:doesn'?t|don'?t|fails?|won'?t)\b/i,
  /\bnothing\s+(?:that\s+happens\s+)?(?:could|can|would)\s+(?:disprove|disprove|refute|falsify)\b/i,
];

// ─── 腿② CONFIRM 同一自证结论（中文）────────────────────────────────
// 自查（r161 教训）：证明/验证/说明/表明/意味着 收裸词形态；「我对
// 了」「我的理论是成立的」「反正都是我对」三种语序（含倒装）都收。
const CONFIRM_ZH = [
  // 都/也/照样/依然 + 证明/验证/说明/表明/意味着/印证/坐实 + 我/我们
  /(?:都|也|照样|依然|反正|终究|最终|同样|照样|一同|皆)[^。，！？!?]{0,6}(?:证明|验证|说明|表明|意味着|印证|坐实)[^。！？!?]{0,10}(?:我|我们|本人|咱)/,
  // (说明|证明|…) + 我/我们 + (对|正确|没错|成立|有效|准|高明|领先…)
  /(?:说明|证明|表明|意味着|验证|印证|坐实|足以说明)[^。！？!?]{0,8}(?:我|我们|本人|咱)[^。！？!?]{0,12}(?:没错|正确|无误|成立|站得住|有效|准|高明|领先|了不起|眼光|判断|说对|预言|猜中|赢了|清白)/,
  // 我的（理论/观点/学说/预言/判断/方法/模型/能力/框架）+ 是 + 对/正确/成立/有效（允许「我这个被否定的观点」类插入修饰）
  /(?:我|我们)(?:的)?[^。！？!?]{0,6}(?:理论|观点|学说|主张|预言|判断|方法|方案|模型|能力|研究|结论|假说|体系|框架|功法|本事|水平|功力)[^。！？!?]{0,14}(?:是|才是|本来就是|始终是|终究是|依然是|会|迟早|终将)?[^。！？!?]{0,6}(?:证明|证实|验证)?(?:的)?(?:对的|正确|没错|成立|有效|站得住|准|高明|领先|了不起)/,
  // 反正/横竖/左右 + 都 + (是)?我(对|正确|没错|赢|准)
  /(?:反正|横竖|左右|怎么说|无论如何)[^。！？!?]{0,10}(?:都|也)[^。！？!?]{0,6}(?:是)?(?:我|我们)[^。！？!?]{0,4}(?:对|正确|没错|赢|准|胜)/,
  // 恰恰/正好/再次/又 + 说明/证明/意味着 + 我/我们（倒装：「这恰恰证明我没错」）
  /(?:恰恰|正好|正|再次|又|永远|始终)[^。！？!?]{0,2}(?:说明|证明|意味着)[^。！？!?]{0,8}(?:我|我们|本人)/,
  // 不可推翻宣告 + 所以/因此 + 成立/正确（「任何结果都不能推翻我的理论，所以它永远成立」）
  /(?:所以|因此|因而|可见|故而)[^。！？!?]{0,14}(?:我|我们)?(?:的)?(?:理论|观点|学说|预言|判断|方法|模型|体系|框架)?[^。！？!?]{0,8}(?:永远|终究|始终|一定|必然)[^。！？!?]{0,4}(?:成立|正确|有效|立于不败)/,
];

// ─── 腿② CONFIRM 同一自证结论（英文）────────────────────────────────
const CONFIRM_EN = [
  /\b(?:proves?|confirms?|shows?|means?|indicates?|vindicates?|validates?|demonstrates?)\s+(?:that\s+)?(?:I'?m|I\s+am|we'?re|we\s+are|my|our)\s+[\w\s'"]{0,24}(?:right|correct|true|valid|onto\s+something|brilliant|genius|ahead\s+of\s+my\s+time)/i,
  // 被动自证形：「my theory is vindicated / stands confirmed」
  /\b(?:my|our)\s+(?:theory|model|prediction|analysis|method|claim|view|approach|framework|system|technique|thesis)\s+(?:is|was|will\s+be|stands|gets)\s+(?:proven|vindicated|validated|confirmed|right|correct|true)\b/i,
  /\b(?:I'?m|I\s+am|we'?re|we\s+are)\s+(?:right|correct|vindicated|validated)\s+(?:either\s+way|no\s+matter\s+what|regardless|anyway)\b/i,
  /\b(?:my|our)\s+(?:theory|model|prediction|analysis|method|claim|view|approach|framework|system)\s+(?:is|was|will\s+be|stands)\s+(?:proven|vindicated|validated|confirmed|correct|right|unfalsifiable)\s+(?:either\s+way|no\s+matter|regardless)\b/i,
  /\beither\s+way\s*,?\s*(?:it|this|that|I)\s*(?:proves?|confirms?|shows?|means?|vindicates?)/i,
  /\b(?:proves?|confirms?|shows?|vindicates?)\s+(?:that\s+)?(?:my|our)\s+(?:theory|model|prediction|analysis|method|claim)\s+(?:is|was)\s+(?:right|correct|true|valid)\s+(?:either\s+way|no\s+matter\s+what)/i,
  /\bno\s+outcome\s+(?:could|can|would)\s+(?:disprove|refute|falsify)\s+(?:it|this|my|our)\b/i,
];

// ─── 豁免一：概念/批判转述（讨论这个概念本身不是运用它）──────────────
const EXEMPT_META_ZH = [
  // 不可证伪/自我证实/免疫策略 + 是谬误·问题·不是科学（批判语境）
  /(?:不可证伪|无法证伪|可证伪性|证伪主义|自我证实|自我封闭|免疫策略|两头堵|怎么说都对|双果自证)[^。！？!?]{0,24}(?:是|属于|构成|意味着|正是|就是)[^。！？!?]{0,18}(?:谬误|问题|陷阱|错误|不对|不是科学|伪科学|毛病|弊端|缺陷|诡辩|话术|圈套|障眼法)/,
  // 讨论/分析/识别/警惕/所谓 + 族名词（转述语境）
  /(?:讨论|分析|识别|警惕|所谓|被称为|叫作|称之为|所谓|批判|驳斥)[^。！？!?]{0,14}(?:不可证伪|自我证实|两头堵|怎么说都对|双果自证|免疫策略)/,
  // 教学/学术转述
  /(?:教材|课程|讲义|论文|研究|文章|著作)[^。，！？!?]{0,10}(?:谬误|论证|逻辑|科学哲学|科学方法)/,
];
const EXEMPT_META_EN = [
  /\b(?:unfalsifiable|self[- ]sealing)\s+(?:claim|argument|reasoning|statement|proposition)s?\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|problem|trick|not\s+science|pseudoscience)/i,
  /\b(?:falsifiability|popper|philosophy\s+of\s+science|sagan'?s?\s+dragon|the\s+dragon\s+in\s+my\s+garage|demarcation\s+problem)\b/i,
  /\b(?:this|that|it)\s+(?:is|'?s)\s+(?:the\s+)?(?:classic|textbook|typical)\s+(?:unfalsifiable|self[- ]sealing)/i,
];

// ─── 豁免二：诚实不确定性/验证纪律（主动寻求判别而非宣称已证）────────
const EXEMPT_HONEST_ZH = [
  // 需要更多数据/证据/实验才能判断
  /(?:需要|得要|得先|必须先|还要|有待|需要先)[^。！？!?]{0,10}(?:更多|进一步|足够|大量)[^。！？!?]{0,6}(?:数据|证据|实验|观测|检验|测试|信息|样本|案例)/,
  // 两种结果都可能/还无法判断
  /(?:两种情况|两种结果|两者|二者|两种可能)[^。！？!?]{0,10}(?:都可能|皆有可能|还不能|无法|难以|尚)[^。！？!?]{0,6}(?:判断|确定|区分|排除|结论|定论)/,
  // 下结论为时过早
  /(?:下结论|定论|判断|归结)[^。！？!?]{0,6}(?:为时过早|太早|还早|尚早|过早|不到)/,
  // 要先验证/检验/证实
  /(?:要|需要|得|应该)[^。！？!?]{0,4}(?:先|再|经过)[^。！？!?]{0,6}(?:验证|检验|测试|实验|证实|证伪|同行评议)/,
  // 如实报告负面结果（科学诚实：「失败就报告失败」族）
  /(?:如实|诚实|客观)[^。！？!?]{0,4}(?:报告|记录|公布|呈现)[^。！？!?]{0,8}(?:负面|失败|未|没有|不显著)/,
];
const EXEMPT_HONEST_EN = [
  /\b(?:need|needs|require|requires)\s+(?:more|further|additional)\s+(?:data|evidence|testing|experiments?|observations?)\s+(?:before|to)\b/i,
  /\bboth\s+(?:outcomes?|results?|possibilities|scenarios)\s+(?:are|remain)\s+(?:possible|open|plausible)\b/i,
  /\b(?:premature|too\s+early|not\s+yet\s+possible)\s+to\s+(?:conclude|judge|tell|decide)\b/i,
  /\bwe\s+(?:can'?t|cannot|shouldn'?t)\s+(?:yet\s+)?(?:conclude|tell|know|determine|rule\s+out)\b/i,
  /\breport\s+(?:the\s+)?(?:negative|null|failed)\s+(?:results?|findings?|outcome)\b/i,
];

const WIN_ZH = 80;    // 中文邻近窗（字）
const WIN_EN = 200;   // 英文邻近窗（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkUnfalsifiableConfirmation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const O_Z = R.OUTCOMES_ZH || OUTCOMES_ZH;
  const O_E = R.OUTCOMES_EN || OUTCOMES_EN;
  const C_Z = R.CONFIRM_ZH || CONFIRM_ZH;
  const C_E = R.CONFIRM_EN || CONFIRM_EN;
  const X_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const X_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const H_Z = R.EXEMPT_HONEST_ZH || EXEMPT_HONEST_ZH;
  const H_E = R.EXEMPT_HONEST_EN || EXEMPT_HONEST_EN;

  // 疑问句：问的是事实或趋势本身，不是以双果结构自证
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 概念/批判转述 + 诚实不确定性豁免在场 → 不是运用它
  if (anyHit(X_Z, text) || anyHit(X_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(H_Z, text) || anyHit(H_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① 互斥结果对
  const oZhIdx = firstHit(O_Z, text);
  const oEnIdx = firstHit(O_E, text);
  const oIdx = oZhIdx >= 0 ? oZhIdx : oEnIdx;
  if (oIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 同一自证结论
  const cZhIdx = firstHit(C_Z, text);
  const cEnIdx = firstHit(C_E, text);
  const cIdx = cZhIdx >= 0 ? cZhIdx : cEnIdx;
  if (cIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「双果→自证」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(oIdx - cIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '双果自证×互斥结果对推同一自我结论(zh)'
      : 'unfalsifiable confirmation×mutually-exclusive-outcomes-to-same-self-conclusion(en)',
  };
}

module.exports = {
  checkUnfalsifiableConfirmation,
  __internals: () => ({
    OUTCOMES_ZH, OUTCOMES_EN, CONFIRM_ZH, CONFIRM_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_HONEST_ZH, EXEMPT_HONEST_EN,
  }),
};
