'use strict';

/**
 * src/weak-evidence-strong-claim.js
 * 「弱证据类型 × 强断言措辞」检测器（第 245 个判别维度，r288 接线）
 *
 * [r288 立项] philosophy_decision 本体在 v6.8.168（244 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为字符串 "unknown"，按轮次纪律不当实质背书）。
 *
 * 立项缺口实证（/tmp/r288-probe.js + /tmp/r288-attr.js，直调 src/gate.js
 * v6.8.168，13 攻击 + 8 良性）：
 *   · 「听说这款保健品能彻底治愈糖尿病，你赶紧买。」→ gate pass、
 *     findings 全空（真零命中）
 *   · 「据说喝这个茶百分百能瘦，我朋友亲测有效。」→ gate pass、
 *     findings 全空（真零命中）
 *   · 「Sources say this drug is guaranteed safe for all patients.」
 *     → gate pass、findings 全空（真零命中）
 *   · 攻击 13 条仅 10 条被其他维度 verify/rewrite 兜住，3 条完全穿透；
 *     穿透样本在 anonymous_source_claim 单维承重全部为 0
 *     （{hit:false, score:0, count:0}）。
 * 覆盖度检查：听说/据说/网传/Sources say + 彻底/百分百/guaranteed 在
 * src/ 下的命中全部落在 perfect_error / hasty_generalization / confidence
 * 等维度的**其他用途**上，无一判「弱证据类型不能承载绝对化断言」这个
 * 结构本身。
 *
 * 外部来源（真实可查，非编造；三层搜索实况落盘
 * /tmp/hf-scout-1794352727.txt）：
 *   · HN Algolia "hallucination detection language model" → arXiv
 *     2609.11878「Domain-Specific Hallucination Detection in Large
 *     Language Models」（2026-09）。
 *   · HN Algolia "uncertainty quantification LLM" → Adarshent/Spnda
 *     （Rust 语义熵门控，LLM 推理路线，与心虫纯规则引擎不同构）。
 *   · Semantic Scholar "unsupported claim verification evidence
 *     sufficiency" → arXiv 2605.03534「SURE-RAG: Sufficiency and
 *     Uncertainty-Aware Evidence Verification for Selective RAG」
 *     （2026，8 次引用）——证据**充分性**需与断言**确定性**联合评估，
 *     证据弱而措辞确定时应主动降档/拒答。摘要页随后返回 429
 *     （Too Many Requests），标题/ID/引用数以搜索返回为准。
 *   · GitHub API 搜索结果均为 1 星或无关仓库，无可移植纯规则实现。
 *   判据为心虫自有纯规则实现（零 LLM 依赖），论文仅作方向依据。
 *
 * 辨别的族：弱证据强断言错配（weak evidence carrying an absolute
 * claim / evidence-strength vs claim-strength mismatch）——**用传闻转述、
 * 个人见证、泛称匿名信源这类不可回溯的弱证据，承载「彻底治愈/百分之百/
 * guaranteed/肯定」这类绝对化断言**：
 *   · 听说这款保健品能彻底治愈糖尿病，你赶紧买。
 *   · 据说喝这个茶百分百能瘦，我朋友亲测有效。
 *   · 网上有人说这家公司的股票下周一定翻倍。
 *   · Sources say this drug is guaranteed safe for all patients.
 *   · Everyone says this crypto will definitely 10x before December.
 *
 * 为什么这是判别者的核心缺口（对齐「能准确寻找答案——寻真而非似是
 * 而非」）：**证据强度与断言强度的匹配是证据纪律的核心约束**。一个结论的
 * 确定性上限，由它背后最弱的那条证据决定。传闻转述（听说/据说/网传）没有
 * 可回溯的信源；个人见证（我朋友/我表哥/亲测）是 n=1 的孤例；泛称匿名信源
 * （有人/内部人士/Sources say）不可指认。这三种证据类型的强度都远低于
 * 「彻底」「百分之百」「guaranteed」所宣称的确定性。把弱证据包装成绝对化
 * 断言，等于**把证据链上最薄弱的一环伪装成最强的一环**——听众听到的是
 * 绝对化措辞，实际依据却不可核验。这与 unsupported_claim（完全无信源）
 * 和 anonymous_source_claim（无署名信源×强断言）是不同攻击面：本族判的
 * 是**弱证据类型与绝对化断言之间的强度错配**，即使信源完全不可指认也成立。
 *
 * 与既有维度的边界（r288 归因）：
 *   · anonymous_source_claim 判「知情人士/内部人士/sources familiar
 *     这类**正式无署名信源**× 强断言」；本族判「听说/据说/网传/Sources
 *     say 这类**传闻转述型弱证据**× 绝对化断言」——信源形态不同（前者
 *     是新闻业匿名信源，后者是口语传闻链），本族还覆盖个人见证。
 *   · anecdotal / anecdote_as_proof 判「身边个例的一个具体结局 → 领域
 *     级结论」；本族不要求「领域级结论」，只要求弱证据类型 × 绝对化
 *     措辞共现，且覆盖传闻转述形（无个例结局）。
 *   · unsupported_claim 判「完全没有信源的裸断言」；本族**有**信源标记
 *     （听说/据说/亲测），问题在信源强度不足以承载断言强度。
 *   · absolute_claim 判绝对化措辞本身（「一定/绝对/百分百」）；本族要求
 *     绝对化措辞与弱证据类型共现，单纯绝对化（无弱证据腿）不判。
 *   · appeal_to_rumor 判「传播广度 → 真实性」的推断（「传的人多了自然
 *     有真的成分」）；本族判「弱证据 → 绝对化断言」的承载，不涉及传播
 *     广度推断。
 *
 * 判据（主判据两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① EVIDENCE 弱证据类型标记（裸名词形态，r161 教训：去掉前后缀
 *     仍命中）：
 *     ZH 传闻转述族：听说|据说|据称|网传|网上说|有人说|听闻|坊间传闻|
 *       外界传闻|有传言|传言说|都在传|传得|风传|盛传|吹风
 *     ZH 个人见证族：我朋友|我表哥|我表姐|我邻居|我同事|我亲戚|我一个
 *       朋友|有个朋友|朋友说|同事说|邻居说|亲戚说|亲测|亲身|我试过|我
 *       自己试|我见过|我遇到
 *     EN 传闻转述族：i heard|i've heard|people say|people are saying|
 *       everyone says|everyone is saying|they say|it is said|rumor has
 *       it|word has it|sources say|sources said|word of mouth|
 *       supposedly|apparently
 *     EN 个人见证族：my friend|my cousin|my neighbor|my colleague|my
 *       uncle|my aunt|my brother|my sister|a friend of mine|someone i
 *       know|i tried|i personally|firsthand
 *   · 腿② STRENGTH 绝对化断言措辞（确定性/全称/疗效保证）：
 *     ZH：彻底|根治|百分百|百分之百|100%|绝对|肯定|一定|必然|势必|
 *       包治|治愈率|保证|无效退款|永久|完全|无所不能|稳赚|稳赢|必定|
 *       铁定|无疑|毫无疑问|板上钉钉|毫无疑问|万无一失|药到病除|
 *       一劳永逸|永久性
 *     EN：guaranteed|guarantee|100%|completely cures?|cures? all|
 *       definitely|certainly|absolutely|will cure|always works|
 *       works for everyone|works for everybody|no exception|
 *       permanent(?:ly)?|risk-free|100 percent|must work|
 *       bound to|sure thing|foolproof|infallible
 *   · 腿②须与腿①相距 WIN_EVIDENCE_STRENGTH（ZH 110 字 / EN 320 字符）
 *     以内。无邻近窗要求则「听说最近在开会，可能会变」这类没有绝对化
 *     断言的不判。
 *
 * 为什么取 VERIFY 级：单句也可能是对虚假营销的**正确转述与批评**（「市
 * 面上那些『百分百治愈』的保健品都是靠听说和亲测堆出来的」正是本族要教
 * 的判别动作）、广告案例教学、消费维权讨论。rewrite 会误伤这些正当文本
 * （与 r206-r219 评价族同口径）。verify 的含义是「这段文本用不可回溯的
 * 弱证据承载了绝对化断言，需要先取得可核验的证据再评估其可信度」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 正确响应形（明确标注未证实/无法核实/孤证不立）：
 *     未经证实|未经核实|无法核实|未能证实|尚无法确认|有待证实|存疑|
 *       孤证|个例不能|不能说明|样本太少|样本不足|不可轻信|不足为凭|
 *       打折扣|需要更多证据|需要核实|交叉验证|独立证实|尚待|未必|
 *       不一定|只是传闻|仅是传闻|道听途说|听说而已|据说而已
 *     EN unverified|unconfirmed|not verified|no evidence|lacks?
 *       evidence|single case|anecdote|does not prove|proves nothing|
 *       cannot conclude|not necessarily|only hearsay|mere rumor|
 *       needs more|needs further|remain(?:s)? unconfirmed|speculation
 *   · 教学/学术转述（讨论这个概念本身不是运用它）：
 *     证据|论证|逻辑|推理|论证方法|批判性|思维训练|课程|教材|课堂|
 *       讲座|教案|概念|称为|定义为|方法论|谬误|案例分析|消费维权|
 *       虚假宣传|夸大宣传|营销话术
 *     EN evidence|argument|logic|reasoning|critical thinking|course|
 *       textbook|lecture|concept|called|defined|fallacy|case study|
 *       marketing claim|advertising claim
 *   · 已具名可回溯信源（据专家/据研究/据数据/据临床试验/据论文/据报告）：
 *     据(?:专家|学者|研究|数据|统计|报告|论文|试验|临床|调查|实验|
 *       分析|结果显示|研究表明)|临床(?:试验|数据|证据)|研究(?:表明|
 *       显示|证实)|数据(?:显示|表明)|实验(?:证明|证实|显示)
 *     EN according to (?:the )?(?:study|research|trial|data|report|
 *       paper|analysis)|studies show|research shows|data shows|
 *       clinical trial|evidence shows|a study (?:found|shows)
 *   · 疑问句（含 ?/？，且无反问标记——反问标记形与 r216 collider_bias
 *     同口径：难道/岂/凭什么/何尝/岂不是/谈何/…吗？/ isn't it /
 *     doesn't that / how else / what else / who doesn't / if not）；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/还要看/
 *     而不是/而非；EN does not mean / not necessarily / depends on /
 *     cannot conclude）。
 *
 * [r304 扩展 · 真升级②：平台/AI 中介型弱证据全新措辞家族]
 * 探针实证（scripts/round-304/probe-module-wesc-r304.js + probe-candidates-
 * r304.js，v6.8.174 动手前）：本族攻击在模块直调与 gate() 全量 findings
 * 两个口径下均真零命中——存量腿①三类证据（传闻转述听说/据说/网传、个人
 * 见证我朋友/亲测、泛称匿名 Sources say）覆盖不到「AI 模型输出」与「社交
 * 平台视频/直播/博主内容」这两类新型不可回溯信源：
 *   · AI 模型输出：「ChatGPT 说这款药百分百有效」「AI 说这个币肯定翻倍」
 *     「豆包说这支股票必然会涨」「ChatGPT says this drug is guaranteed
 *     safe for everyone」——大模型输出无具名、不可回溯、已知会幻觉，
 *     证据强度低于任何具名信源，却常被当作权威答复引用；
 *   · 平台视频/直播/博主：「短视频上说这家公司的股票一定翻倍」「博主说
 *     这款面膜保证三天见效」「直播间里说这款保健品百分百有效」「A
 *     YouTuber said this method is guaranteed…」「I saw on TikTok that
 *     this stock will certainly double」——流量驱动的无署名内容，与
 *     「Sources say」同构但更不可核验。
 * 实现：新增 EVIDENCE_AI_ZH / EVIDENCE_AI_EN 平行常量（不并存量数组，
 * 避开 r280/r265 length===N 断言），在 detect 入口与存量 EVIDENCE_* 合并，
 * 复用既有邻近窗（ZH110/EN320）与四组豁免入口；AI 拉丁族带
 * (?<![A-Za-z]) 边界守卫防词内误命中。维度计数不变、src/index.js 零改动、
 * VERSION 未 bump。
 */

// ─── 腿① EVIDENCE 弱证据类型标记（中文）──────────────────────
// r161 教训：枚举腿必须含裸名词形态——「听说」「亲测」去掉前后缀仍须命中。
const EVIDENCE_ZH = [
  // 传闻转述族（裸名词形态）
  /听说/,
  /据说/,
  /据称/,
  /网传/,
  /网上说/,
  /听讲/,
  /听闻/,
  /坊间(?:传闻|流传|说法)/,
  /外界传闻/,
  /有传言/,
  /传言(?:说|称|道)/,
  /都在传/,
  /传得/,
  /风传/,
  /盛传/,
  /吹风/,
  /有人说/,
  /有人(?:说|讲|告诉)/,
  // 消息转述形（与 anonymous_source_claim 正式信源族互补：本族判传闻链）
  /有消息称/,
  /消息称/,
  /有消息/,
  /据传/,
  // 个人见证族（裸名词形态）
  /我朋友/,
  /我表哥/,
  /我表姐/,
  /我表妹/,
  /我舅舅/,
  /我阿姨/,
  /我姑姑/,
  /我叔叔/,
  /我大爷/,
  /我邻居/,
  /我同事/,
  /我亲戚/,
  /我同学/,
  /朋友说/,
  /朋友(?:试|用|吃|喝)过/,
  /同事说/,
  /邻居说/,
  /亲戚说/,
  /同学说/,
  /(?:一|两|几)个?朋友/,
  /有个朋友/,
  /亲测/,
  /亲身(?:体验|经历|试)/,
  /我试过/,
  /我自己试/,
  /我用过/,
  /我吃过/,
  /我见过/,
  /我遇到/,
  // 泛化见证形（无具体亲属称谓：我试了/我用了/我用了一次 + 绝对化结论）
  /我(?:试|用|吃|喝|买)了/,
  /我(?:自己|本人|亲)?(?:试|用)(?:了|过|一下|一次)/,
  /(?:这|那)(?:个|种|款|些)?(?:方法|产品|东西|药|茶|课|书)(?:我)?(?:试|用)了/,
  /用了(?:一下|一次|几天|一段时间)/,
  /试了(?:一下|一次|几天|一段时间)/,
];

// ─── 腿① EVIDENCE 弱证据类型标记（英文）──────────────────────
const EVIDENCE_EN = [
  // 传闻转述族（裸名词形态）
  /\bi\s+heard\b/i,
  /\bi'?ve\s+heard\b/i,
  /\bpeople\s+(?:say|said|are\s+saying)\b/i,
  /\beveryone\s+(?:says|said|is\s+saying)\b/i,
  /\bthey\s+say\b/i,
  /\bit\s+is\s+said\b/i,
  /\bit'?s\s+said\b/i,
  /\brumor\s+has\s+it\b/i,
  /\brumour\s+has\s+it\b/i,
  /\bword\s+has\s+it\b/i,
  /\bsources?\s+(?:say|said|tell|told)\b/i,
  /\bword\s+of\s+mouth\b/i,
  /\bsupposedly\b/i,
  /\bapparently\b/i,
  /\bsome\s+people\s+say\b/i,
  // 个人见证族（裸名词形态）
  /\bmy\s+friend\b/i,
  /\bmy\s+cousin\b/i,
  /\bmy\s+neighbour\b/i,
  /\bmy\s+neighbor\b/i,
  /\bmy\s+colleague\b/i,
  /\bmy\s+uncle\b/i,
  /\bmy\s+aunt\b/i,
  /\bmy\s+brother\b/i,
  /\bmy\s+sister\b/i,
  /\ba\s+friend\s+of\s+mine\b/i,
  /\bsomeone\s+i\s+know\b/i,
  /\bi\s+tried\b/i,
  /\bi\s+personally\b/i,
  /\bfirsthand\b/i,
  /\bfirst-hand\b/i,
  // 泛化见证形（无具体亲属称谓）
  /\bworked\s+once\b/i,
  /\bit\s+worked\s+(?:once|for\s+me)\b/i,
  /\bthis\s+worked\s+(?:once|for\s+me)\b/i,
  /\bi\s+(?:tried|used|tested)\s+it\b/i,
  /\bi\s+tried\s+(?:it|this|that|them)\s+(?:once|myself)\b/i,
  /\bused\s+it\s+(?:once|myself)\b/i,
];

// ─── 腿② STRENGTH 绝对化断言措辞（中文）──────────────────────
const STRENGTH_ZH = [
  // 疗效/绝对化保证（裸名词形态）
  /彻底/,
  /根治/,
  /包治/,
  /药到病除/,
  /治愈率/,
  /百分百/,
  /百分之百/,
  /100%/,
  /绝对/,
  /肯定/,
  /一定/,
  /必然/,
  /势必/,
  /必定/,
  /铁定/,
  /板上钉钉/,
  /毫无疑问/,
  /无疑/,
  /万无一失/,
  /一劳永逸/,
  /保证/,
  /无效退款/,
  /永久/,
  /永久性/,
  /完全/,
  /无所不能/,
  /稳赚/,
  /稳赢/,
  /只赚不亏/,
  /毫无风险/,
  /零风险/,
  // 全称量化推广形（绝对化断言不只靠措辞，全称量化也是绝对化）
  /适合所有人/,
  /适合每一个人/,
  /人人/,
  /所有人/,
  /每一个人/,
  /谁都/,
  /无论(?:谁|什么人都?)/,
  /放在(?:任何人|谁)身上/,
  /对谁都/,
  // 数字具体化（"瘦十斤""翻倍"这类量化承诺与弱证据共现时强度极高）
  /(?:瘦|减|增|涨|翻)\s*[0-9一二三四五六七八九十百]+\s*(?:斤|公斤|斤|倍|成|个百分点|%)/,
];

// ─── 腿② STRENGTH 绝对化断言措辞（英文）──────────────────────
const STRENGTH_EN = [
  /\bguaranteed?\b/i,
  /\b100\s*%\b/i,
  /\b100\s+percent\b/i,
  /\bcompletely\s+cures?\b/i,
  /\bcures?\s+all\b/i,
  /\bdefinitely\b/i,
  /\bcertainly\b/i,
  /\babsolutely\b/i,
  /\bwill\s+cure\b/i,
  /\balways\s+works?\b/i,
  /\bworks?\s+for\s+(?:everyone|everybody)\b/i,
  /\bno\s+exceptions?\b/i,
  /\bpermanently?\b/i,
  /\brisk-?free\b/i,
  /\bmust\s+work\b/i,
  /\bbound\s+to\b/i,
  /\bsure\s+thing\b/i,
  /\bfoolproof\b/i,
  /\binfallible\b/i,
  /\bwill\s+definitely\b/i,
  /\bcertainly\s+will\b/i,
  // 全称量化推广形
  /\bworks?\s+for\s+everyone\b/i,
  /\beveryone\s+can\b/i,
  /\bfits?\s+everyone\b/i,
  /\bsuits?\s+everyone\b/i,
  /\banybody\s+can\b/i,
  /\banyone\s+can\b/i,
];

// ─── 腿①b EVIDENCE 平台/AI 中介型弱证据（r304 新增族）────────────
// [r304 扩展 · 真升级②] 探针实证（scripts/round-304/probe-module-wesc-r304.js，
// v6.8.174 模块直调）：本族 13/15 攻击完全零命中——存量腿①只收「听说/据说/
// 网传」类口语传闻链、「我朋友/亲测」类个人见证、「Sources say」类泛称匿名
// 信源，而「AI 模型输出」与「社交平台视频/直播/博主内容」这两类 2024 年后
// 成为主流的新型不可回溯信源整族缺席。两者与存量族同构甚至更弱：大模型输出
// 无具名、可被 prompt 诱导、已知会幻觉（"AI 说的"不可回溯核验）；短视频/
// 直播/博主内容由流量驱动、无署名、无可追溯出处。拿它们承载「百分百/guaranteed」
// 类绝对化断言，正是本维度「证据强度与断言强度错配」的同一结构在新信源形态上
// 的再现。不并入存量数组（避开 r280/r265 length===N 断言），在 detect 入口
// 与存量 EVIDENCE_* 合并，复用既有邻近窗与四组豁免入口。
const EVIDENCE_AI_ZH = [
  // AI 模型输出族：国内外大模型/聊天机器人 + 说/讲/告诉/认为/建议/回答。
  // /i 标志必须带——gate() 的 _normText 归一化手段是 lowercase（trace 实证
  // 「归一化手段: lowercase」），「ChatGPT 说」「AI 说」到判别层已变成
  // 「chatgpt 说」「ai 说」，大小写敏感会整族失配（r304 实测：模块直调
  // 命中但 gate 层不归因）。
  // (?<![A-Za-z]) 边界守卫——防「GAI 说这首歌」这类拉丁词内 AI 误命中。
  /(?<![A-Za-z])(?:ChatGPT|GPT-?[0-9o]*|Copilot|Claude|Gemini|Kimi|DeepSeek|文心一言|通义千问|通义|豆包|深度求索|元宝|智谱|星火|讯飞星火|大模型|语言模型|聊天机器人|机器人|AI)\s*(?:说|讲|告诉|提到|认为|觉得|建议|回答|算出|测出)/i,
  // 问句锚形态：「我问过大模型了，它说…」「问了一下 AI，它建议…」——
  // 动词与模型名之间夹「了/它/，」时靠 问/询问/请教 + 模型名锚定，
  // 不放开任意间距（任意间距会误收「这部 AI 纪录片说…」型）。
  /(?:问|询问|请教|咨询)(?:过|了|一下|一问)?[^。！？；;]{0,6}(?:大模型|语言模型|聊天机器人|ChatGPT|GPT-?[0-9o]*|豆包|文心一言|通义千问|Kimi|DeepSeek|元宝|星火|智谱|Copilot|Claude|Gemini|机器人|AI)/i,
  // 平台视频/直播/博主族：短视频/视频/博主/主播/网红/达人 + 说/称/推荐/种草
  /(?:短视频|小视频|视频)(?:上|里|中)?说/,
  /(?:博主|up主|UP主|主播|网红|达人|大[Vv]|kol|KOL)(?:说|称|推荐|种草|带货|晒单)/,
  /(?:直播间|直播)(?:里|中)?(?:说|称|都在说)/,
  /(?:弹幕|评论区|评论)(?:都)?(?:在)?(?:说|夸|推荐)/,
  // 社交平台族：小红书/抖音/快手/B站/微博/朋友圈/群/微信 + 说
  /(?:小红书|抖音|快手|B站|b站|微博|朋友圈|群里|微信群|微信|贴吧|论坛)(?:上|里)?(?:都)?(?:在)?说/,
  /网友(?:都)?(?:在)?说/,
];

// ─── 腿①b EVIDENCE 平台/AI 中介型弱证据（英文，r304 新增族）──────
const EVIDENCE_AI_EN = [
  // AI 模型输出族
  /\bChatGPT\s+(?:says?|said|told)\b/i,
  /\b(?:the\s+)?(?:AI|chatbot|bot|language\s+model|LLM)\s+(?:says?|said|told|claims?)\b/i,
  /\ban?\s+AI\s+told\s+me\b/i,
  /\bthe\s+algorithm\s+(?:says?|told|showed|shows|recommends?)\b/i,
  /\bmy\s+feed\s+(?:showed|is\s+full\s+of)\b/i,
  // 平台视频/直播/博主族
  /\bI\s+saw\s+(?:it\s+)?on\s+(?:TikTok|Douyin|YouTube|Instagram|Twitter|X|Reddit|Facebook|Snapchat|Pinterest)\b/i,
  /\ba\s+(?:TikTok|YouTube|Instagram|Douyin)\s+video\s+(?:said|says|claims?|showed)\b/i,
  /\ba\s+(?:YouTuber|TikToker|influencer|streamer|blogger|vlogger|podcaster|creator)\s+(?:said|says|claims?|swears?)\b/i,
  /\b(?:Reddit|Twitter|TikTok|Douyin|Instagram|YouTube)\s+(?:says?|users\s+say|claims?)\b/i,
  /\b(?:livestream|live\s+stream)\s+(?:chat|comments)\b/i,
  /\beveryone\s+in\s+(?:the\s+)?(?:chat|livestream|comments)\b/i,
];

// ─── 豁免一：正确响应形（标注未证实/孤证不立）────────────────
const EXEMPT_CORRECT_ZH = [
  /未经证实|未经核实|无法核实|未能核实|未能证实/,
  /尚无法确认|暂无法确认|有待证实|有待确认|有待核实/,
  /孤证|个例不能|不能说明|说明不了|证明不了|推不出/,
  /样本太少|样本不足|数据不足|证据不足|证据不充分|证据有限/,
  /不可轻信|不足为凭|不足为证|打折扣|要打折扣/,
  /需要更多证据|需要核实|交叉验证|独立证实/,
  /尚待|存疑|未必|不一定|很难说|不见得/,
  /只是传闻|仅是传闻|听说而已|据说而已|道听途说|传言不实/,
  /系谣言|纯属谣言|已辟谣|不属实|尚无定论/,
];
const EXEMPT_CORRECT_EN = [
  /\bunverified\b|\bunconfirmed\b/i,
  /\bnot\s+(?:yet\s+)?(?:verified|confirmed|corroborated)\b/i,
  /\bno\s+evidence\b|\blacks?\s+(?:corroboration|evidence)\b/i,
  /\bsingle\s+case\b|\banecdote\b/i,
  /\bdoes\s+not\s+prove\b|\bproves\s+nothing\b/i,
  /\bcannot\s+conclude\b|\bcan'?t\s+conclude\b/i,
  /\bnot\s+necessarily\b/i,
  /\bonly\s+hearsay\b|\bmere\s+rumou?r\b/i,
  /\bneeds?\s+more\b|\bneeds?\s+further\b/i,
  /\bremain(?:s)?\s+unconfirmed\b|\bspeculation\b/i,
];

// ─── 豁免二：教学/学术转述 ──────────────────────────────────
// r228 教训：裸「证据」「论证」不出现在本清单——它们会打在攻击句自己身上
// （「听说…彻底治愈…需要更多证据」整句被自己豁免）。元话语豁免要求句中
// 同时出现教学/学术框架标记，与 r213 mediator_confusion 同口径。
const EXEMPT_META_ZH = [
  /证据(?:的)?(?:强度|充分性|类型|分级|等级|评价|评估|审查|链|体系|标准)/,
  /论证(?:方法|结构|分析|评价|课|训练)/,
  /批判性(?:思维|思考|思维训练)/,
  /逻辑(?:学|谬误|推理|课|思维)/,
  /课程|教材|课堂|讲座|教案|习题|教科书|公开课/,
  /概念|称为|定义为|所谓|悖论|方法论|案例教学|案例分析/,
  /消费维权|虚假宣传|夸大宣传|营销话术|广告法|违规宣传/,
  /谬误(?:的)?(?:识别|分析|类型|案例)/,
];
const EXEMPT_META_EN = [
  /\bevidence\s+(?:strength|sufficiency|quality|type|grading|hierarchy|appraisal|base)\b/i,
  /\bargument(?:ation)?\s+(?:analysis|structure|mapping|appraisal)\b/i,
  /\bcritical\s+thinking\b/i,
  /\blogical\s+fallac(?:y|ies)\b/i,
  /\bcourse\b|\btextbook\b|\blecture\b|\bsyllabus\b/i,
  /\bconcept\b|\bcalled\b|\bdefined\b|\bmethodology\b/i,
  /\bcase\s+study\b|\bmarketing\s+claim\b|\badvertising\s+claim\b/i,
];

// ─── 豁免三：已具名可回溯信源 ──────────────────────────────
const EXEMPT_SOURCED_ZH = [
  /据(?:专家|学者|研究|数据|统计|报告|论文|试验|临床|调查|实验|分析|结果显示|研究表明|权威)/,
  /临床(?:试验|数据|证据|研究)/,
  /研究(?:表明|显示|证实|发现)/,
  /数据(?:显示|表明|证实)/,
  /实验(?:证明|证实|显示)/,
  /论文(?:表明|显示|指出)/,
  /统计(?:显示|表明)/,
  /meta\s*分析|荟萃分析|系统评价/,
];
const EXEMPT_SOURCED_EN = [
  /according\s+to\s+(?:the\s+)?(?:study|research|trial|data|report|paper|analysis|clinical)/i,
  /\bstudies\s+show\b|\bresearch\s+shows\b|\bdata\s+shows?\b/i,
  /\bclinical\s+trial\b/i,
  /\bevidence\s+shows?\b/i,
  /\ba\s+study\s+(?:found|shows|reports)\b/i,
  /\bmeta-?analysis\b|\bsystematic\s+review\b/i,
];

// 推理否定/对冲（句级豁免）
const HEDGE_ZH = /不代表|不意味着|推不出|未必|不一定|取决于|还要看|而不是|而非/;
const HEDGE_EN = /\b(?:does\s+not\s+mean|not\s+necessarily|depends\s+on|cannot\s+conclude|can'?t\s+conclude)\b/i;

// 反问标记（与 r216 collider_bias 同口径：仅无反问标记的疑问句才豁免）
const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的/;
const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;

// 邻近窗
const WIN_EVIDENCE_STRENGTH_ZH = 110;  // 腿① ↔ 腿②
const WIN_EVIDENCE_STRENGTH_EN = 320;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

// 收集某腿全部命中位置（供邻近窗取最近一对用）
function allMatches(list, text) {
  const out = [];
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const reG = new RegExp(re.source, flags);
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ index: m.index, text: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;  // 防零宽死循环
    }
  }
  return out;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkWeakEvidenceStrongClaim(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免（反问标记不豁免，同 r216 collider_bias 口径）
  if (/[?？]/.test(text)) {
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 正确响应形：明确标注未证实/孤证不立，正是本族要教的判别动作
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) ||
      anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 教学/学术转述：讨论这个概念本身不是运用它
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) ||
      anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 已具名可回溯信源：有研究/数据/临床试验支撑，证据强度足够
  if (anyHit(R.EXEMPT_SOURCED_ZH || EXEMPT_SOURCED_ZH, text) ||
      anyHit(R.EXEMPT_SOURCED_EN || EXEMPT_SOURCED_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 推理否定/对冲（句级）
  if (HEDGE_ZH.test(text) || HEDGE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  // [r304] 腿①合并存量族与平台/AI 中介新族（r288 存量 EVIDENCE_* 与 r304
  // EVIDENCE_AI_* 平行登记，互不覆盖注入路径：置空存量族只杀存量腿，置空
  // EVIDENCE_AI_* 只杀新族）。
  const evidenceList = isZh
    ? (R.EVIDENCE_ZH || EVIDENCE_ZH).concat(R.EVIDENCE_AI_ZH || EVIDENCE_AI_ZH)
    : (R.EVIDENCE_EN || EVIDENCE_EN).concat(R.EVIDENCE_AI_EN || EVIDENCE_AI_EN);
  const strengthList = isZh ? (R.STRENGTH_ZH || STRENGTH_ZH) : (R.STRENGTH_EN || STRENGTH_EN);
  const win = isZh ? WIN_EVIDENCE_STRENGTH_ZH : WIN_EVIDENCE_STRENGTH_EN;

  // 主判据：腿① 弱证据类型标记 × 腿② 绝对化断言措辞，取最近一对
  const evidenceHits = allMatches(evidenceList, text);
  const strengthHits = allMatches(strengthList, text);
  if (evidenceHits.length === 0 || strengthHits.length === 0) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  let bestDist = Infinity;
  let bestEvidence = null;
  for (const e of evidenceHits) {
    for (const s of strengthHits) {
      const d = Math.abs(s.index - e.index);
      if (d > win) continue;
      if (d < bestDist) { bestDist = d; bestEvidence = e; }
    }
  }

  if (bestEvidence) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh
        ? '弱证据类型承载绝对化断言(证据强度与断言强度错配)(zh)'
        : 'weak evidence type carrying an absolute claim(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkWeakEvidenceStrongClaim,
  __internals: () => ({
    EVIDENCE_ZH, STRENGTH_ZH, EVIDENCE_EN, STRENGTH_EN,
    EVIDENCE_AI_ZH, EVIDENCE_AI_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_SOURCED_ZH, EXEMPT_SOURCED_EN,
    WIN_EVIDENCE_STRENGTH_ZH, WIN_EVIDENCE_STRENGTH_EN,
    RHETORICAL_ZH, RHETORICAL_EN, HEDGE_ZH, HEDGE_EN,
  }),
};
