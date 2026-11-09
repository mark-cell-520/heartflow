/**
 * src/immortal-time-bias.js — 「永生时间偏误（immortal time bias）」检测器
 * （第 240 个判别维度，r270）
 *
 * [r270 立项] 缺口实证：scripts/round-270/r270-direction-probe.js 在多候选族
 * 零命中探针中，本族 5 条攻击句 4 条完全穿引擎（gate.action === 'pass'、findings
 * 无本族归因），已接线邻居 survivor_time_bias(226) 只命中「确诊第一天就开始
 * 服药」型（病程起点一致），对本族四类措辞全部失效。decision 本体裁决
 * accelerate（philosophy_decision：type=accelerate / confidence 0.7 /
 * priority 40 / trigger optimal_conditions / goalReviewed true；cognitiveLoad
 * 与 uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。
 *
 * 辨别的族：永生时间偏误（immortal time bias / 保证生存期偏倚 / guaranteed
 * survival time bias）——比较两组的生存时间时，两组的**计算起点或起点定义
 * 不一致**，使其中一组在统计上必然「活过」一段不可能死亡的时间窗口
 * （immortal time），却把这段结构性时差当成干预有效的证据。
 *
 * 典型措辞：
 *   治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。
 *   治疗组病人从开始治疗起计算生存期，比从确诊起计算的对照组长得多，证明治疗有效。
 *   凡是打疫苗超过六个月的人重症率极低，所以疫苗的保护期至少有六个月。
 *   只有先活过三十天的患者才被纳入用药组统计，这组五年生存率显著更高，说明药物有效。
 *   Patients who survived the first year after treatment lived much longer, so
 *   the treatment works.
 *   The treated group was counted from the first dose while the control group
 *   was counted from diagnosis, and the treatment extended life.
 *
 * 为什么现有维度拦不住（r270 归因）：
 *   · survivor_time_bias（第 226 维）判「两组病程长度结构不同 → 生存期长短
 *     不可比」，本族两组病程可以完全一致，错在**起点定义**：一组从「首次
 *     用药/手术成功」起算，另一组从「确诊/入组」起算，或一组被要求「先
 *     存活过 N 个月」才有资格进入统计。
 *   · lead_time_bias（领先时间偏误，src/ 下无独立维度）判「筛查使确诊提
 *     前但死亡时刻不变 → 生存期账面变长」；本族不依赖筛查，任何**起点
 *     错位**（用药时点、手术时点、存活门槛）都成立。
 *   · survivorship_bias(132) 管「只统计存活者样本」；本族两组样本都可完整
 *     在场，错在起点口径，不是样本被筛。
 *   · selection_bias(168) 管「受限样本 → 总体推广」；本族是比较内部的
 *     时点错位，与推广范围无关。
 *   · post_hoc / pseudo_causal 管「时间先后当因果」；本族有明确的起点错位
 *     结构腿 × 疗效结论腿，锚在方法学结构上。
 *   · denominator_swap(224) 管「不同分母的绝对计数比较」；本族比的是
 *     **时间长度**，且错位发生在**起算点**而非分母基数。
 *
 * 判据（起点锚腿 × 起点错位腿 × 疗效结论腿，三腿共现，缺一不判）：
 *   腿① START_ANCHOR 起点时点锚（中英，裸名词必收）
 *   腿② START_GAP   起点错位——三条等价路径：
 *        (a) 显式起点差异表述：「起点不一致」「比…起算得早」「早了N个月」
 *        (b) 两组起点对置：「从 A 起算 … 从 B 起算」（中文允许中间夹逗号）
 *        (c) 隐含起点错位：起点锚本身即错位来源（存活门槛 / 时点后移型锚）
 *            + 两组比较 + 疗效结论
 *   腿③ EFFICACY 疗效/生存结论
 *
 * 为什么取 VERIFY 级：单句可能是医学统计教学反例（「这两组生存时间起点
 * 不一致，要先做时依协变量分析」正是本族要教的判别动作）、流行病学课堂
 * 案例、对他人错误论证的转述引用、方法学批评。verify 的含义是「这个生存
 * 期/疗效比较可能存在起点错位，需要回到统一起点或时依分析再比」——调用方
 * 应要求补上起点对齐/时依协变量处理，而不是接受起点不一致得出的疗效结论。
 *
 * 明确不判的（豁免）：
 *   · 方法学纠正在场（时依/时间依赖协变量/边际结构模型/兰德/landmark 分析/
 *     永生时间偏倚被指出/immortal time bias / time-dependent covariate /
 *     marginal structural model）：那是在破除本谬误；
 *   · 统一起点明示（同一时间起算/统一起点/均从…起/两组均从/起点一致/
 *     same starting point / aligned baseline）：设计已消除错位；
 *   · 严谨设计在场（随机对照/盲法/倾向评分匹配）：起点口径通常已被设计约束；
 *   · 中性时间陈述（起点锚在场但无起点错位路径、且无疗效结论）；
 *   · 起点差异纯流程描述（排班/账期/工期起点不同，无生存期或疗效语义）。
 */
'use strict';

// ─── 腿① START_ANCHOR 起点时点锚（中文）────────────────────────────
// 枚举腿自查（161 轮教训）：核心词取裸名词形态（「起算点」「起点」「第一天」
// 不带数字也命中），并覆盖动词短语形态。
const START_ANCHOR_ZH = [
  // 从/自 + （…）+ 起/算起/开始算/开始计算/起算/计起（允许中间夹标点 ≤16 字）
  /(?:从|自)[^。！？]{0,16}(?:起算|算起|开始算|开始计算|计起|开始起|算起|起)/,
  // 以…为起点/为起算点
  /以[^。！？]{0,12}(?:为|作)?[^。！？]{0,4}(?:起点|起算点|起始点|基准点|计算起点)/,
  // 裸起点名词（不带数字）
  /起算点|起始点|计算起点|起算时间|统计起点|随访起点|起算日|起算口径/,
  // 第一天/首次/一开始/刚一开始/最初
  /第一天|头一天|首次|首日|一开始|刚一开始|最初/,
  // 一经…就 / 即刻 / 随即 / 之后立刻
  /一经[^。；;]{0,10}就|即刻|随即|(?:后|之后|以后)[^。；;]{0,6}(?:立刻|立即|马上|旋即)/,
  // [r270 矩阵实测补] 「治疗后立刻 / 术后马上 / 服药后立即」型：锚词在
  // 时点名词之后，且常不带任何数字（裸名词形态）。161 轮教训：只收带
  // 后缀的「战争爆发」会漏裸名词整句——这里必须让裸「治疗后立刻」也命中。
  /(?:确诊|手术|用药|服药|治疗|接种|筛查|入组|出院|术后|化疗|放疗)[^。！？]{0,4}(?:立刻|立即|马上|旋即|当即)/,
  // 凡是…超过N（个月/年） → 存活门槛
  /凡[^。！？]{0,20}(?:超过|满|过)[^。！？]{0,6}(?:个?月|天|周年|年)/,
  // 只有…(先|须|需|要)…存活/活过/挺过…才 → 存活门槛
  /(?:先|须|需|要|必须)(?:存活|活过|挺过|生存|无恙)[^。！？]{0,10}(?:才|方|后)/,
  // 疾病史/术后/治疗后 时点锚
  /(?:确诊|手术|用药|服药|治疗|接种|筛查|入组|出院|术后)[^。！？]{0,6}(?:起算|算起|起|开始)/,
];

// ─── 腿① START_ANCHOR 起点时点锚（英文）──────────────────────────
const START_ANCHOR_EN = [
  /\bfrom\s+(?:the\s+)?(?:first|day\s+one|onset|diagnosis|start|beginning|time\s+of)\b/i,
  /\bstarting\s+(?:from|at|on)\b/i,
  /\bcounted?\s+from\b/i,
  /\bclock\s+starts?\b/i,
  /\b(?:once|after)\s+(?:surviving|survival\s+of|they\s+survived|completing)\b/i,
  /\bthose\s+who\s+survived\b/i,
  /\bhad\s+to\s+survive\b/i,
  /\bsurvived\s+(?:the\s+)?(?:first|initial)\b/i,
  /\bfrom\s+the\s+time\s+of\b/i,
  /\bas\s+of\s+(?:the\s+)?(?:first|start|beginning)\b/i,
  /\bimmediately\s+(?:after|following)\b/i,
  /\bright\s+after\b/i,
  // [r270 收尾补] 裸起点时点名词（不带动词）：start point / starting point /
  // baseline / time origin / origin point / entry point + 差异或时点语义。实测
  // gap_en「The two arms had different starting points」——start point 是
  // 名词主语，不是 from/starting 动词形态，旧锚腿全灭。裸名词形态必收
  // （161 轮教训同款：只收带后缀形态会漏裸名词整句）。
  /\b(?:start(?:ing)?\s+(?:points?|dates?|times?)|baselines?|time\s+origins?|origin\s+points?|entry\s+points?)\b/i,
];

// ─── 腿② START_GAP 路径 (a) 显式起点差异表述（中文）───────────────
const START_GAP_ZH = [
  // 起点 … 比 … 早/晚/不同/不一致/错位/有偏
  /(?:起点|起算点|起始点|计算起点|起算时间|统计起点|随访起点)[^。！？]{0,16}(?:比|较)[^。！？]{0,14}(?:早|晚|不同|不一样|不一致|错位|有偏)/,
  // 起点 … 不同/不一样/不一致/错位/有偏/存在差异
  /(?:起点|起算点|起始点|计算起点|起算时间|统计起点|随访起点)[^。！？]{0,16}(?:不同|不一样|不一致|错位|有偏|存在差异|有偏差|有出入)/,
  // 比…起算得早/晚
  /比[^。！？]{0,14}(?:起算|算起|开始算|计算)[^。！？]{0,6}(?:得)?(?:早|晚|迟)/,
  // 早了N / 多算了N（个月/年）
  /(?:早|晚|多算|少算|提前|推后)(?:了)?\s*(?:整整|足足|近|约|大约)?\s*[0-9０-９一二两三四五六七八九十百]+\s*(?:个?月|天|周年|年)/,
  // 时点错位/时间错位/基线不齐
  /时点错位|时间错位|起点错位|基线(?:不齐|不一致|不同|错位)|随访起点不同/,
  // [r270 矩阵实测补] 起点后移型错位：「治疗后立刻使用…生存率更高」——
  // 统计起点被挪到「治疗后」（患者必须先活到治疗）而非常规「确诊」，
  // 但句子不含「起点不一致」字样。判据：时点锚（治疗/用药/手术后 + 立刻
  // /随即/立即）+ 生存率/生存期 + 比较量级，同句共现即起点被结构性后移。
  /(?:治疗|用药|服药|手术|接种|化疗|放疗|干预)[^。！？]{0,6}(?:立刻|立即|马上|旋即|当即)[^。！？]{0,30}(?:生存率|生存期|存活率|存活期)/,
  /(?:治疗后|用药后|服药后|手术后|接种后)[^。！？]{0,6}(?:立刻|立即|马上)[^。！？]{0,24}(?:生存|存活)/,
];

// ─── 腿② START_GAP 路径 (a) 显式起点差异表述（英文）────────────────
const START_GAP_EN = [
  /\b(?:different|differing|mismatched|inconsistent|misaligned)\s+(?:start(?:ing)?\s+(?:points?|dates?|times?)|baselines?|origin\s+points?)\b/i,
  /\bstart(?:ing)?\s+(?:points?|dates?|times?)\s+(?:differ|differs|differed|are\s+different|are\s+not\s+the\s+same|mismatch)\b/i,
  /\b(?:earlier|later|earliest)\s+start(?:ing)?\s+(?:point|date|time)\b/i,
  /\bimmortal\s+time\b/i,
  /\bguaranteed\s+survival\s+time\b/i,
  /\b(?:misaligned|shifted|offset)\s+(?:baseline|start|time\s+origin)\b/i,
];

// ─── 腿② START_GAP 路径 (b) 两组起点对置（中文）──────────────────
// [r270 矩阵实测教训] 首版把中间字符类写成 [^。；;，,]，导致「从 A 起算，
// 比从 B 起算」这种最典型句型（两组起点对置必带逗号）整类漏判。中文句内
// 逗号极常见，路径 (b) 只排除句末标点，允许夹逗号/分号。
const START_CONTRAST_ZH = [
  // 从 A 起算 … 从 B 起算（两个不同起点介词短语，中间 ≤40 字）
  /(?:从|自)[^。！？]{0,18}(?:起算|算起|计算)[^。！？]{0,40}(?:从|自)[^。！？]{0,18}(?:起算|算起|计算)/,
  // 从 A 算起 … 比从 B（对照/比较）
  /(?:从|自)[^。！？]{0,18}(?:起算|算起)[^。！？]{0,40}(?:比|相较于?|相对于?|对照)[^。！？]{0,20}(?:从|自)[^。！？]{0,18}(?:起算|算起|计算|起)/,
];

// ─── 腿② START_GAP 路径 (b) 两组起点对置（英文）──────────────────
const START_CONTRAST_EN = [
  // counted from X while/wheras/versus counted from Y
  /\bcounted?\s+from\s+[^.]{0,36}\b(?:while|whereas|versus|vs\.?|but)\b[^.]{0,36}\bcounted?\s+from\b/i,
  // counted from X compared to/with counted from Y
  /\bcounted?\s+from\s+[^.]{0,36}\bcompared\s+(?:to|with)\b[^.]{0,36}\bcounted?\s+from\b/i,
  // clock starts X while clock starts Y
  /\bclock\s+starts?\s+[^.]{0,28}\b(?:while|whereas|versus|vs\.?|but)\b[^.]{0,36}\bclock\s+starts?\b/i,
  // counted from X vs counted from Y（裸 vs）
  /\bcounted?\s+from\s+[^.]{0,36}\b(?:vs\.?|v)\b[^.]{0,36}\bcounted?\s+from\b/i,
];

// ─── 腿② START_GAP 路径 (c) 隐含起点错位（锚本身即错位来源）──────
// 存活门槛型锚（凡…超过N / 只有…先活过N…才 / survived the first N / had to
// survive N）在方法学上等价于「保证生存期」——被统计的对象必须先活过一段
// 不可能死亡的时间，起点因此被结构性后移，本身就是错位。
const IMMORTAL_WINDOW_ZH = [
  /凡[^。！？]{0,20}(?:超过|满|过)[^。！？]{0,6}(?:个?月|天|周年|年)/,
  /(?:只有|须|需|要|必须)[^。！？]{0,14}(?:先|已经)?(?:存活|活过|挺过|生存|无恙)[^。！？]{0,10}(?:才|方|后)/,
  /(?:活过|挺过|度过)[^。！？]{0,6}(?:个?月|天|周年|年)[^。！？]{0,12}(?:才|方)/,
];
const IMMORTAL_WINDOW_EN = [
  /\b(?:those\s+who\s+)?survived\s+(?:the\s+)?(?:first|initial|past)\s+\d*\s*(?:month|months|year|years|day|days|week|weeks)\b/i,
  /\bhad\s+to\s+survive\b[^.]{0,30}\b(?:before|to\s+be)\b/i,
  /\bonly\s+(?:those\s+who\s+)?(?:survived|alive)\b[^.]{0,30}\b(?:were\s+)?(?:included|counted|eligible)\b/i,
  /\b(?:once|after)\s+surviving\s+\d*\s*(?:month|months|year|years|day|days)\b/i,
];

// ─── 腿③ EFFICACY 疗效/生存结论（中文）───────────────────────────
// 复用 survivor-time-bias 的疗效词族口径（同族结论语义），确保两个维度
// 在结论侧同构、只在起点侧区分。
const EFFICACY_ZH = [
  /(?:疗法|药物|药|治疗|方案|手段|干预|疫苗|手术|疗程|用药|筛查|体检|早查)(?:很|挺|相当|确实|明显|显著)?(?:有效|有疗效|有用|管用|见效|可行|能延命)/,
  /(?:有效|有疗效|管用|见效)/,
  /(?:能|可|可以|得以|有助于|能够)(?:显著)?(?:延长|延命|救命|改善|提高)(?:生命|寿命|存活|生存|预后)?/,
  /延长生命|延命|救命|改善预后|提高生存|降低死亡率|减少死亡/,
  /(?:疗效|效果|效用|作用)(?:是|很|挺|相当|确实|明显|显著)?(?:确凿|确切|显著|明显|好|不错|可观|肯定|确定)/,
  /(?:显著|明显|大幅)(?:改善|好转|提升|提高)/,
  /(?:可见|说明|证明|表明|因此|所以|显然)[^。！？]{0,16}(?:有效|有疗效|管用|见效|救命|延长|延命|改善|好转|更高)/,
  // 生存率/生存期 + 更高/更长（结论形态，非比率口径本身）
  /(?:生存率|生存期|存活率|存活期|重症率|复发率|五年生存)[^。！？]{0,8}(?:更高|更长|更低|明显高于|显著高于)/,
  // [r270 矩阵实测补] 绝对量级结论：「重症率极低」「生存期很长」不带任何
  // 比较词，但正是保证生存期造成的结构性虚假结论。与路径 (c) 的 ABSOLUTE
  // 档同口径（只收量级词，不收「较低」这种中性统计描述——那可能是正常结果）。
  /(?:重症率|发病率|死亡率|复发率|生存率|存活率)[^。！？]{0,6}(?:极低|极高|极少数|几乎为零|近乎为零)/,
  // 门槛/保护期结论：「保护期至少有六个月」「免疫期至少半年」
  /(?:保护期|免疫期|有效期|抗体持续时间)[^。！？]{0,10}(?:至少|不少于|有|达)/,
  // [r270 收尾补] 纠正性疗效结论引用：「疗效结论需要重新核对」「生存差异要
  // 重新检验」——不直接断言有效，但引用了待核验的疗效结论。VERIFY 级语义
  // 正是「该比较可能存在起点错位，需核对」，与豁免一「方法学纠正在场」
  // （显式点出偏倚名并给出时依分析）区分：这里只说结论待核、没说怎么纠。
  /(?:疗效|效果|效用|作用)(?:结论|结果|声明|说法|差异|比较)[^。！？]{0,10}(?:核对|检验|评估|审查|重算|重新算)/,
];

// ─── 腿③ EFFICACY 疗效/生存结论（英文）──────────────────────────
const EFFICACY_EN = [
  /\b(?:the\s+)?(?:drug|treatment|therapy|medicine|vaccine|intervention|procedure|surgery|regimen|protocol|screening)\s+(?:really\s+)?(?:works?|worked|helps?|helped|is\s+effective|was\s+effective|saves?)\b/i,
  /\b(?:works?|worked|effective|efficacious)\b/i,
  /\b(?:extends?|extended|prolongs?|prolonged|saves?|saved|improves?|improved)\s+(?:lives|life|survival|lifetime|outcomes?|prognosis)\b/i,
  /\b(?:proves?|proven|proving|shows?|showed|demonstrates?|demonstrated)\s+(?:that\s+)?(?:the\s+)?(?:drug|treatment|therapy|screening|it\s+)?(?:works?|extends?|is\s+effective|saves?)\b/i,
  /\b(?:significant|significant(?:ly)?|marked|marked(?:ly)?|substantial(?:ly)?|clear)\s+(?:benefit|improvement|gain|survival\s+benefit|effect)\b/i,
  /\b(?:so|thus|therefore|hence)\s+[^.]{0,30}\b(?:works?|effective|extends?|saves?|improves?)\b/i,
  /\b(?:higher|better|improved|superior|lower)\s+(?:survival|survival\s+rate|outcomes?)\b/i,
];

// ─── 豁免一：方法学纠正在场（破除本谬误）────────────────────────
const EXEMPT_METHOD_ZH = [
  /永生时间偏倚|永生时间偏误|保证生存期偏倚|时依偏误/,
  /时依(?:协变量|变量|因素)|时间依赖(?:协变量|变量)/,
  /边际结构模型|兰德(?:标记)?分析|landmark|时依分层/,
  /(?:指出|说明|揭示|暴露|纠正|修正|处理)(?:了)?[^。！？]{0,10}(?:起点错位|时点错位|起算口径)/,
];
const EXEMPT_METHOD_EN = [
  /\bimmortal\s+time\s+bias\b/i,
  /\btime[-\s]?dependent\s+covariate\b/i,
  /\bmarginal\s+structural\s+model\b/i,
  /\blandmark\s+analys(?:is|es)\b/i,
  /\bcorrect(?:ed|ing|s)?\s+(?:for\s+)?(?:the\s+)?(?:immortal|start|baseline)\b/i,
  /\baccount(?:ed|ing)?\s+for\s+(?:the\s+)?(?:immortal\s+time|start(?:ing)?\s+(?:point|time)|time[-\s]?dependent)\b/i,
];

// ─── 豁免二：统一起点明示（设计已消除错位）──────────────────────
const EXEMPT_ALIGNED_ZH = [
  /(?:同一|统一|共同|一致)(?:的)?(?:起点|起算点|起始点|计算起点|起算时间|统计起点|随访起点)/,
  /起点(?:一致|相同|统一|对齐|一致化)/,
  /(?:两组|双方|二者)[^。！？]{0,8}均(?:从|自)[^。！？]{0,10}起/,
  /均从[^。！？]{0,10}起算|都从[^。！？]{0,10}起算/,
  /(?:对齐|校正|统一)[^。！？]{0,4}起算/,
];
const EXEMPT_ALIGNED_EN = [
  /\b(?:same|common|identical|unified|aligned|consistent)\s+(?:start(?:ing)?\s+(?:points?|dates?|times?)|baselines?|origin)\b/i,
  /\bboth\s+(?:groups?|arms|cohorts?)\s+(?:were\s+)?(?:counted|started|followed)\s+from\b/i,
  /\baligned\s+(?:start(?:ing)?\s+points?|baseline|time\s+origin)\b/i,
];

// ─── 豁免三：随机对照/严谨设计在场 ──────────────────────────────
const EXEMPT_DESIGN_ZH = [
  /随机(?:对照|分组|分配|抽样)|随机化/,
  /倾向评分|匹配(?:后|的)?(?:队列|样本|分组)|病例对照研究/,
  /盲法|双盲|三盲|安慰剂对照/,
];
const EXEMPT_DESIGN_EN = [
  /\brandomiz(?:ed|ation)\b/i,
  /\bRCT\b|\brandomized\s+controlled\s+trial\b/i,
  /\bpropensity\s+score\b|\bmatched\s+(?:cohort|sample|pairs?|groups?)\b/i,
  /\bdouble[-\s]?blind\b|\bplacebo[-\s]?controlled\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 统计某正则清单在文本中的总匹配次数（保留原 flags 并补 g）
function countMatches(list, text) {
  let n = 0;
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m) n += m.length;
  }
  return n;
}

/**
 * 永生时间偏误判别：起点时点锚腿 × 起点错位腿 × 疗效结论腿，三腿共现。
 *
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkImmortalTimeBias(text, inject) {
  // [稳定性审计 2026-11-09 惯例] 非字符串入口守卫。
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const A_Z = R.START_ANCHOR_ZH || START_ANCHOR_ZH;
  const A_E = R.START_ANCHOR_EN || START_ANCHOR_EN;
  const G_Z = R.START_GAP_ZH || START_GAP_ZH;
  const G_E = R.START_GAP_EN || START_GAP_EN;
  const C_Z = R.START_CONTRAST_ZH || START_CONTRAST_ZH;
  const C_E = R.START_CONTRAST_EN || START_CONTRAST_EN;
  const W_Z = R.IMMORTAL_WINDOW_ZH || IMMORTAL_WINDOW_ZH;
  const W_E = R.IMMORTAL_WINDOW_EN || IMMORTAL_WINDOW_EN;
  const E_Z = R.EFFICACY_ZH || EFFICACY_ZH;
  const E_E = R.EFFICACY_EN || EFFICACY_EN;
  const M_Z = R.EXEMPT_METHOD_ZH || EXEMPT_METHOD_ZH;
  const M_E = R.EXEMPT_METHOD_EN || EXEMPT_METHOD_EN;
  const L_Z = R.EXEMPT_ALIGNED_ZH || EXEMPT_ALIGNED_ZH;
  const L_E = R.EXEMPT_ALIGNED_EN || EXEMPT_ALIGNED_EN;
  const D_Z = R.EXEMPT_DESIGN_ZH || EXEMPT_DESIGN_ZH;
  const D_E = R.EXEMPT_DESIGN_EN || EXEMPT_DESIGN_EN;

  // 方法学纠正 / 统一起点明示 / 严谨设计在场 → 不判
  if (anyHit(M_Z, text) || anyHit(M_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(L_Z, text) || anyHit(L_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(D_Z, text) || anyHit(D_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿① 起点时点锚（至少一处）
  const anchorCount = countMatches(A_Z, text) + countMatches(A_E, text);
  if (anchorCount < 1) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿③ 疗效/生存结论
  const efficacy = anyHit(E_Z, text) || anyHit(E_E, text);
  if (!efficacy) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 起点错位——三条等价路径
  // 路径 (a) 显式起点差异表述
  if (anyHit(G_Z, text) || anyHit(G_E, text)) {
    return {
      hit: true, score: 0.6, count: 1,
      detail: /[\u4e00-\u9fff]/.test(text)
        ? '永生时间偏误×起点差异表述推断疗效(zh)'
        : 'immortal-time-bias×start-point-diff-implies-efficacy(en)',
    };
  }
  // 路径 (b) 两组起点对置
  if (anyHit(C_Z, text) || anyHit(C_E, text)) {
    return {
      hit: true, score: 0.6, count: 1,
      detail: /[\u4e00-\u9fff]/.test(text)
        ? '永生时间偏误×两组起点对置推断疗效(zh)'
        : 'immortal-time-bias×mismatched-start-clocks(en)',
    };
  }
  // 路径 (c) 隐含起点错位：锚本身即错位来源（存活门槛/保证生存期）
  // 单独出现不足以定罪——必须同时有**两组比较**语义（比/较/对照/versus
  // /higher/longer 等），否则只是「门槛型描述」而非「错位比较」。
  const windowHit = anyHit(W_Z, text) || anyHit(W_E, text);
  if (windowHit) {
    // [r270 矩阵实测补] 路径 (c) 的比较语义取两档：
    //   ① 显式两组比较（比/相较于/对照/compared/versus/higher/longer…）
    //      注意中英分列：「显著更高」「明显更长」是中文量级，英文 higher/
    //      longer 不覆盖（r270 实测：句3 COMPARE 全 false 就因为只收了英文）。
    //   ② 绝对量级结论（极低/很高/几乎为零/显著下降）——「凡是打疫苗超过
    //      六个月的人重症率极低，所以疫苗保护期至少六个月」这种典型门槛
    //      句不带任何「比」，但「极低」本身就是与一般人群比较的隐含结论，
    //      方法学上正是保证生存期造成的结构性虚假。
    const COMPARE = /(?:比|相较于?|相对于?|对照|更高|更长|更低|更短|更高一截|compared|versus|\bvs\.?\b|higher|longer|lower|better|superior)/i;
    const ABSOLUTE = /(?:极低|极高|几乎为零|近乎为零|很低|很高|显著下降|大幅下降|极少数|明显更低|显著更低)/i;
    if (COMPARE.test(text) || ABSOLUTE.test(text)) {
      return {
        hit: true, score: 0.6, count: 1,
        detail: /[\u4e00-\u9fff]/.test(text)
          ? '永生时间偏误×存活门槛起点后移推断疗效(zh)'
          : 'immortal-time-bias×survival-window-shifted-start(en)',
      };
    }
  }
  // 腿③已过、腿②无路径 → 中性时间陈述或无错位，不判
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkImmortalTimeBias,
  __internals: () => ({
    START_ANCHOR_ZH, START_ANCHOR_EN,
    START_GAP_ZH, START_GAP_EN,
    START_CONTRAST_ZH, START_CONTRAST_EN,
    IMMORTAL_WINDOW_ZH, IMMORTAL_WINDOW_EN,
    EFFICACY_ZH, EFFICACY_EN,
    EXEMPT_METHOD_ZH, EXEMPT_METHOD_EN,
    EXEMPT_ALIGNED_ZH, EXEMPT_ALIGNED_EN,
    EXEMPT_DESIGN_ZH, EXEMPT_DESIGN_EN,
  }),
};
