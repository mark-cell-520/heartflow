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
 * [r328 扩展] 领先时间偏误（lead-time bias）子家族——本文件自 r270 立项
 * 起就在边界注释里写明「lead_time_bias（领先时间偏误，src/ 下无独立维
 * 度）判『筛查使确诊提前但死亡时刻不变 → 生存期账面变长』」，本轮把该
 * 缺口闭环为**同一检测器的路径 (d)**（维度计数 255 不变、src/index.js
 * 零改动，与 r320-r327 各轮同形态）。立项探针实证（scripts/round-328/
 * r328-probe-leadtime.js，集成树 v6.8.183）：7 条精化攻击样本 3 条完全
 * 穿引擎（gate.action=pass、findings 无归因），其余被 post_hoc /
 * reverse_causation / econ_reasoning_gate / survivor_time_bias 代拦；
 * 官方四基准良性语料 369 条模块级直调零命中。
 *
 * 辨别的族（子家族）：领先时间偏误（lead-time bias / 领先时间偏倚）——
 * 筛查/早发现把**确诊时点提前**，而生存率/生存期一律**从确诊之日起
 * 算**，于是生存指标账面改善（「五年生存率从40%提高到80%」）并不伴随
 * 死亡时刻的任何改变，却被当作「筛查延长了生命」的证据：
 *   肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，
 *   可见筛查显著延长了寿命。
 *   Cancer screening advances the diagnosis by about two years on
 *   average, so the five-year survival rate rises significantly —
 *   screening genuinely prolongs life.
 *
 * 与既有维度的边界（r328 归因）：
 *   · 本模块路径 (a)(b)(c)（永生时间偏误本体）判**起点错位**（起算口径
 *     不一致/存活门槛），不依赖筛查；路径 (d) 判**确诊提前**（筛查前移
 *     诊断时点），两条路径的错位来源不同，可并存于同一检测器。
 *   · survivor_time_bias(226) 判「两组病程长度结构不同 → 生存期长短不
 *     可比」；本子家族两组病程长度完全一致，错在**诊断时点被筛查前移**。
 *   · statistical_misleading(58) 管小基数百分比；本子家族不涉及基数。
 *   · post_hoc / pseudo_causal 代拦「筛查普及后生存率提高」型时序因
 *     果，但给不出 lead-time 归因（探针代拦句 findings 均无本维度），
 *     且对无时序词的形态（「早筛组确诊时间比临床发病早两年」）失效。
 *   · regression_to_the_mean / clustering_illusion 管极值回归与聚类
 *     错觉，与本族的时间核算结构无关。
 *
 * 判据（路径 d，三腿共现 + 跨腿邻近窗 + 豁免，缺一不判）：
 *   腿① LEAD_SCREEN 筛查域在场（早筛/筛查/普筛/体检筛查/癌症筛查/
 *      基因检测/肿瘤标志物/早发现/筛出/检出；EN screening / screened /
 *      early detection / detected earlier）
 *   腿② SURV_ACCOUNT 生存核算口径在场（五年生存率/生存率/生存期/
 *      存活率/中位生存/平均生存/生存时间/活得更久/多活/寿命；EN
 *      five-year survival / survival rate / median survival / lived
 *      longer）
 *   腿③ LIFE_CLAIM 寿命延长结论在场（延长寿命/延寿/延年/救命/活得更
 *      久；EN extends lives / prolongs life / saves lives / live
 *      longer），三腿首匹配跨度 ≤ WIN_LEAD（中 160 字 / 英 400 字符）
 *   豁免四 EXEMPT_LEAD：领先时间偏误被点名（方法学纠正）/ 谨慎解读
 *      （「不能等同于寿命延长」形否定）/ 死亡率终点设计（以总死亡率
 *      为终点/overall mortality endpoint）
 *   疑问形守卫：整句以问号收尾（「…说明筛查延长了寿命吗？」）是探询
 *      不是断言，不判（同 common-cause 等族疑问豁免口径）。
 *
 * 为什么取 VERIFY 级：单句可能是流行病学教学反例（「五年生存率是从
 * 确诊之日起算的，筛查会让确诊提前，所以生存率提高不能直接等同于寿命
 * 延长」正是本族要教的判别动作）、对他人错误论证的转述、新闻报道的
 * 概括。verify 的含义是「这个生存期/寿命比较可能存在领先时间核算问
 * 题，需要改用死亡率终点或对齐诊断时点再比」。
 *
 * [r331 扩展] 筛查偏误三兄弟的剩余两族——病程长度偏误（length-time
 * bias）与过度诊断（overdiagnosis）——同样自 r270 起就在边界注释里
 * 与 lead_time_bias 并列记为「src/ 下无独立维度」，本轮把这两个缺口
 * 闭环为同一检测器的**路径 (e)** 与**路径 (f)**（维度计数 255 不变、
 * src/index.js 零改动，与 r320-r330 各轮同形态）。立项探针实证
 * （scripts/round-331/r331-probe-lengthtime.js，集成树 v6.8.184）：
 * 14 条攻击样本 10 条完全穿引擎（gate.action=pass、findings 无归因），
 * 其余 4 条被既有维度代拦（rewrite 1 / verify 3）；手工良性 10 条中
 * 4 条被既有维度 verify（教学纠正形，属既有基线，非本轮引入）。
 *
 * 路径 (e) 病程长度偏误（length-time bias / 长度时间偏误）——筛查
 * **优先检出进展缓慢的惰性病灶**（长得快的在两次筛查间期就发作了，
 * 根本等不到被筛出来），于是筛查组的病例组合（case-mix）天然偏向
 * 温和病程，生存指标账面更好，却被当作「筛查有效」：
 *   筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，
 *   这说明筛查确实有效。
 *   Cancers found by screening are mostly slow-growing indolent tumors,
 *   so screened patients naturally survive longer — screening works.
 *
 * 路径 (f) 过度诊断（overdiagnosis）——筛查查出一批**本来一辈子都不会
 * 发病、也不需要治疗**的病灶，把这些检出计入「救治成果/筛查收益」，
 * 是用检出动作冒充健康收益：
 *   早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了
 * 无数生命。
 *   Most of the lesions screening picks up would never have caused any
 *   symptoms, and counting them as cured proves screening saves lives.
 *
 * 与既有维度的边界（r331 归因）：
 *   · 路径 (d) 领先时间偏误判**确诊时点被筛查前移**（诊断日期提前、
 *     生存从确诊日起算 → 账面变长）；路径 (e) 两组诊断时点可以完全
 *     一致，错在**被检出的病例本身偏向慢病程**；路径 (f) 判**被检出
 *     的病灶本不会成为临床事件**。三条路径错位来源不同，可并存。
 *   · survivorship_bias(132) 管「只统计存活者」；本两族两组样本都可
 *     完整在场，错在病例构成与检出计数。
 *   · selection_bias(168) 管「受限样本 → 总体推广」；本两族是比较
 *     内部的病例组合问题，与推广范围无关。
 *   · statistical_misleading(58) 管小基数百分比；本两族不涉及基数。
 *
 * 判据（路径 e/f，三腿共现 + 跨腿邻近窗 + 豁免，缺一不判）：
 *   腿① LEAD_SCREEN 筛查域（复用路径 d 腿①：早筛/筛查/检出/基因检测/
 *     EN screening / early detection）
 *   腿② 路径 (e) LEN_COMP 病例构成（生长缓慢/进展慢/惰性/懒癌/温和型/
 *     低度恶性；EN slow-growing / slow-progressing / indolent /
 *     low-grade / less aggressive）
 *        路径 (f) OVERDIAG 过度诊断（本来一辈子都不会发病/终生不会恶变/
 *     本来不需要治疗；EN would never have caused / never would have /
 *     overdiagnosed）
 *   腿③ 路径 (e) SCREEN_BENEFIT 筛查获益结论（窄口：筛查词与结局获益
 *     词近邻，或「可见/说明/证明…筛查…有效」推断形，或「筛查组…
 *     生存率/预后…更高」）
 *        路径 (f) GAIN_CLAIM 收益计入断言（计入/算进…收益/救治成果，
 *     「收益可观」，EN counted as / saves lives / proves screening
 *     saves）
 *   豁免 EXEMPT_LEN（只作用于路径 e/f，与 EXEMPT_LEAD 分离——r328 轮测
 *     断言 EXEMPT_LEAD 恰三元素，不动其结构）：偏误点名（病程长度偏误/
 *     长度时间偏误/过度诊断+纠正语境/length-time bias/case-mix）/
 *     谨慎解读否定 / 收益高估夸大 / 死亡率终点设计。
 *   疑问形守卫同路径 (d)：整句问号收尾不判。
 *
 * 为什么取 VERIFY 级：单句可能是筛查方法学课堂反例（「筛查优先检出
 * 慢病程病灶，所以筛查组预后好不等于筛查有效」正是本族要教的判别
 * 动作）、对筛查营销话术的批评转述、新闻概括。verify 的含义是「这个
 * 筛查获益结论可能存在病例组合或过度诊断问题，需要改用死亡率终点或
 * 对齐病例构成再比」。
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
 *
 * [r335 扩展] Will Rogers 现象/分期迁移（stage migration / reclassification
 * artifact）子家族——把对象**重新分类到别的组别**（晚期病人划入中期/差生
 * 分出去/低风险档上调/B级客户升A级/重症转病区），于是**两组的指标同向
 * 改善**（早期中期生存率都上升/两个池子赔付率都下降/快慢班平均分都提
 * 高），却没有一个个体真的变好，却被当作「新标准/改革/模型有效」的证
 * 据。Will Rogers 现象的账面改善来自**成员构成变化**（把「差」的挪走
 * 后两组均值同时上移），与路径 (a)(b)(c) 起点错位、(d) 确诊提前、(e)
 * 病例构成（筛查选出的病程不同）、(f) 过度诊断（本不会发病被计入）
 * 错位来源各不相同，闭环为同一检测器的**路径 (g)**（维度计数 256 不
 * 变、src/index.js 零改动，与 r328/r331 各轮同形态）。立项探针实证
 * （scripts/round-335/r335-probe-candidates.js，集成树 v6.8.185）：
 * 8 条攻击样本 4 条完全穿引擎（gate.action=pass、findings 无归因：
 * 「新分期标准…早期和中期生存率都上升了，说明新标准显著改善了预后」
 * 「新评级模型…A级和B级的违约率都下降了」及两条 EN 对应句），其余
 * 被 pseudo_causal/confidence 泛维度代拦（findings 无本维度归因）。
 *
 * 辨别的族（子家族）：Will Rogers 现象（stage migration / 分期迁移/
 * 重新分类效应）——**成员在组间被重新分类**后，两组的统计指标同向
 * 改善，据此断言分类标准/干预/改革本身产生了真实改善：
 *   新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都
 *   上升了，说明新标准显著改善了预后。
 *   把重症病人转到合作病区后，ICU 死亡率明显下降，可见本院救治水平很高。
 *   Under the new staging criteria some advanced cases were reclassified
 *   as intermediate, and survival rates rose in both groups — proof the
 *   new protocol works.
 *
 * 与既有维度的边界（r335 归因）：
 *   · simpsons_paradox（第 206 维）判**聚合层与子群层方向相悖**（必
 *     须有相反方向），本族两组方向**相同**（同升/同降），错在成员重
 *     新分类而非聚合混合；
 *   · selection_bias(168) 管「受限样本 → 总体推广」；本族是比较内部
 *     的组间成员搬移，不涉及向总体推广；
 *   · statistical_misleading(58) 管小基数百分比；本族不涉及基数；
 *   · survivor_time_bias(226) 管两组病程长度结构不同；本族两组构成
 *     被主动搬移，错位来源是分类动作本身。
 *
 * 判据（路径 g，三腿共现 + 跨腿邻近窗 + 豁免，缺一不判）：
 *   腿① RECLASS 重新分类动作在场（重新划入/分到/调到/转入/移出/
 *      上调到/单独组班/新分期标准；EN reclassified as / moved to /
 *      transferred to / re-bucketed into / restaged as）
 *   腿② BOTH_UP 两组指标同向变动在场（都上升/都下降/都提高/都改善；
 *      EN both groups … rose / fell in both / in both tiers）
 *   腿③ CLAIM 成效结论在场（说明/证明/可见…改善/有效/成功/水平；
 *      EN proof … works / shows excellent / so the new … works）
 *   三腿首匹配跨度 ≤ WIN_LEAD（中 160 字 / 英 400 字符）
 *   豁免 EXEMPT_WR：偏误点名（Will Rogers/分期迁移偏误/统计假象/
 *      没有一个…真的…变好/stage migration bias / reclassification
 *      artifact）/ 谨慎解读否定（不能/并不/不代表…说明/改善）/ 总体
 *      无变化（总生存期没有变化/overall unchanged）
 *   疑问形守卫同路径 (d)(e)(f)：整句以问号收尾不判。
 *
 * 为什么取 VERIFY 级：单句可能是统计学课堂反例（「两组生存率同升而
 * 没有一个病人活得更久，这是 Will Rogers 现象」正是本族要教的判别
 * 动作）、对医院排名营销话术的批评转述、新闻概括。verify 的含义是
 * 「这个成效结论可能来自重新分类造成的账面改善，需要核对总体终点
 * （总生存期/总违约数）或对齐分类口径再采信」。
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

// ─── [r328] 路径 (d) 领先时间偏误（lead-time bias）子家族常量 ─────────
// 腿① LEAD_SCREEN 筛查域（中文）：核心词取裸名词形态（「早筛」「筛查」
// 不带后缀也命中），并覆盖现代体检营销高频复合词。161 轮教训：只收带
// 后缀的「癌症早筛项目」会漏裸「早筛组」整句。
const LEAD_SCREEN_ZH = [
  /早筛|早查|普筛|筛查|筛检|筛出|检出|体检筛查|癌症筛查|肿瘤筛查|防癌筛查/,
  /基因检测|肿瘤标志物|液体活检|早发现/,
];
// 腿①（英文）：screening / screened / early detection / detected earlier
const LEAD_SCREEN_EN = [
  /\bscreen(?:ing|ed|s)?\b/i,
  /\bearly\s+detection\b/i,
  /\bdetect(?:ing|ed|s)?\b[^.]{0,24}\bearlier\b/i,
  /\bdiagnos(?:is|ed)\s+(?:about\s+)?(?:\w+\s+){0,2}earlier\b/i,
  /\bmoves?\s+(?:the\s+)?diagnosis\s+(?:forward|earlier)\b/i,
];

// 腿② SURV_ACCOUNT 生存核算口径（中文）：生存率/生存期一律从确诊日起
// 算，这正是 lead-time 账面改善的承载指标；不含「死亡率」（那是正确
// 终点，列入豁免而非判据），也不含「活得更久/寿命」（那是结论侧，
// 放腿③——否则「早发现才能活得更久」类良性建议会双腿互证成假阳性）。
const SURV_ACCOUNT_ZH = [
  /(?:五年|5年|十年|10年)?生存(?:率|期)|生存时间|存活(?:率|期)/,
  /中位生存|平均生存|术后生存|确诊后生存|无进展生存/,
];
// 腿②（英文）
const SURV_ACCOUNT_EN = [
  /\b(?:five|10|ten)[-\s]?year\s+survival\b/i,
  /\bsurvival\s+(?:rates?|times?|statistics?|from\s+diagnosis)\b/i,
  /\bmedian\s+survival\b|\baverage\s+survival\b/i,
];

// 腿③ LIFE_CLAIM 寿命延长结论（中文）：落点必须是「生命/寿命/生存被
// 延长」，不收「降低死亡」——总死亡率下降是正确证据形态（列入豁免）。
const LIFE_CLAIM_ZH = [
  /(?:延长|拉长)[^。！？]{0,4}(?:生命|寿命|性命)/,
  /(?:延长|拉长)[^。！？]{0,4}(?:生存期|生存时间|存活期)/,
  /延寿|延年|延年益寿|益寿|救命|起死回生/,
  /活得更久|活得长|多活/,
];
// 腿③（英文）
const LIFE_CLAIM_EN = [
  /\bextends?\s+(?:patients'?\s+)?(?:lives|life|lifetime)\b/i,
  /\bprolongs?\s+(?:life|survival)\b/i,
  /\bsaves?\s+lives\b/i,
  /\bhelps?\s+(?:people\s+)?live\s+longer\b/i,
  /\blive\s+longer\b/i,
];

// 豁免四 EXEMPT_LEAD（r328）：三条通路各自承重，负例注入逐条验证。
//  (a) 领先时间偏误被点名（方法学纠正/教学反例）——那是在破除本谬误；
//  (b) 谨慎解读形：「不能等同于寿命延长」「并不代表活得更久」——正确
//      判别动作，正是本族要教的；
//  (c) 死亡率终点设计在场：以总死亡率为终点/overall mortality endpoint
//      ——设计已消除 lead-time 核算问题。
const EXEMPT_LEAD_ZH = [
  /领先时间偏误|领先时间偏倚|领先时间效应|提前确诊效应/,
  /(?:不能|并非|不代表|不等于|不足以|无法|很难|未必|不一定|不应|不可)[^。！？]{0,18}(?:寿命|生命|延寿|延年|活得更久|多活|延长|救命)/,
  /(?:以|用|按|采用)[^。！？]{0,12}(?:总死亡率|全因死亡率|死亡率|死亡)[^。！？]{0,10}(?:为|作|作为)[^。！？]{0,8}(?:终点|指标|主要终点|观察终点|主要指标)/,
];
const EXEMPT_LEAD_EN = [
  /\blead[-\s]?time\s+bias\b/i,
  /\b(?:does\s+not|do\s+not|doesn'?t|don'?t|cannot|can'?t|not|no)\b[^.]{0,28}\b(?:live\s+longer|longer\s+life|life\s+extension|extends?\s+life|prolongs?\s+life|saves?\s+lives)\b/i,
  /\b(?:overall|all[-\s]?cause|total|disease[-\s]?specific)\s+mortality\b[^.]{0,36}\b(?:endpoint|primary\s+outcome|unchanged|no\s+difference)\b/i,
];

// 路径 (d) 跨腿邻近窗：三腿首匹配跨度上限（中 160 字 / 英 400 字符），
// 同路径 (a)(b) 的 WIN_LAYERS 口径——防止同一段落里三个无关句子拼成
// 虚假共现。
const WIN_LEAD_ZH = 160;
const WIN_LEAD_EN = 400;

// ─── [r331] 路径 (e) 病程长度偏误（length-time bias）子家族常量 ─────────
// 腿② LEN_COMP 病例构成：筛查优先检出的是**进展缓慢/惰性**的病灶——长得快
// 的病灶在两次筛查的间期里就发作，根本等不到被筛出来，所以筛查组的病例
// 组合（case-mix）天然偏向温和病程。161 轮教训：收裸名词形态（「惰性」
// 「懒癌」「温和型」不带后缀也命中）。
const LEN_COMP_ZH = [
  /生长缓慢|生长慢|长得慢|进展缓慢|进展慢|发展缓慢|发展慢|病程较长|长病程/,
  /惰性|懒癌|懒瘤|温和型|低度恶性|低恶性|恶性度低|恶性程度低|活跃度低|不怎么进展|不太进展|不怎么发展|不太发展|生长不快|进展不快|不怎么长/,
];
// 腿②（英文）：slow-growing / slow-progressing / indolent / low-grade
const LEN_COMP_EN = [
  /\bslow[- ]?(?:growing|progressing|developing|evolving)\b/i,
  /\bindolent\b/i,
  /\blow[- ]grade\b/i,
  /\bless\s+aggressive\b/i,
  /\b(?:rarely|seldom|almost\s+never)\s+(?:progress|progresses|progressed)\b/i,
  /\b(?:lazy|smouldering|smoldering)\s+(?:cancers?|tumou?rs?)\b/i,
];

// 腿③ SCREEN_BENEFIT 筛查获益结论（窄口，只收**结局获益**断言：
// 不收裸「有效/受欢迎」，只收改善/提高/延长/救命/获益/更好/值得 +
// 推断标记形 + 「筛查组…生存率/预后…更高」形）。
// 窄口理由：「体检筛查出生长缓慢的肿瘤也值得记录」类正常工程/医疗陈述
// 若收裸「有效/值得」会误伤；结局获益词与筛查词近邻才构成「筛查改善
// 结局」结论。
const SCREEN_BENEFIT_ZH = [
  /(?:筛查|早筛|筛出|检出|普筛|筛检|体检|检测)[^。！？]{0,12}(?:改善|提高|延长|救命|延寿|活得更久|活得长|获益|受益|更好|值得|有价值)/,
  /(?:改善|提高|延长|救命|延寿|活得更久|活得长|获益|受益|更好|值得|有价值)[^。！？]{0,12}(?:筛查|早筛|筛出|检出|普筛|筛检|体检|检测)/,
  /(?:可见|说明|证明|表明|因此|所以|显然|足以证明)[^。！？]{0,16}(?:筛查|早筛|筛出|检出|检测)[^。！？]{0,8}(?:有效|有用|管用|见效|值得|救命|挽救|拯救|改善|提高|延长|更好|获益|受益|有价值)/,
  /(?:筛查|早筛|筛检|检测)[^。！？]{0,6}(?:组|人群|者)?[^。！？]{0,4}(?:生存率|生存期|预后|结局)[^。！？]{0,8}(?:更高|更长|更好|更高一截|明显高于|显著高于|大幅改善)/,
];
// 腿③（英文）
const SCREEN_BENEFIT_EN = [
  /\bscreen(?:ing|ed|s)?\b[^.]{0,40}\b(?:improves?|improved|extends?|extended|prolongs?|prolonged|saves?|saved|works?|worked|worth|beneficial|helps?\s+(?:\w+\s+){0,2}live\s+longer|live\s+longer)\b/i,
  /\b(?:improves?|improved|extends?|extended|prolongs?|prolonged|saves?|saved|works?|proves?|proven|shows?)\b[^.]{0,40}\bscreen(?:ing|ed|s)?\b/i,
  /\b(?:screened|screening)\s+(?:groups?|patients?|cohorts?|population)\b[^.]{0,40}\b(?:better|higher|longer|improved|superior)\b/i,
  /\b(?:better|higher|longer|improved|superior)\s+(?:survival|outcomes?|prognosis)\b[^.]{0,40}\bscreen/i,
  /\b(?:improvement|gain)\b[^.]{0,40}\bscreen(?:ing|ed)?\b/i,
  /\bscreen(?:ing|ed)?\b[^.]{0,40}\b(?:improvement|gain)\b/i,
];

// ─── [r331] 路径 (f) 过度诊断（overdiagnosis）子家族常量 ────────────────
// 腿② OVERDIAG 过度诊断：被检出的病灶**本来不会成为临床事件**（一辈子
// 不会发病/不会恶变/不需要治疗）——把它们计入「早期发现/救治成果」，
// 是用检出动作冒充健康收益。
const OVERDIAG_ZH = [
  /本来一辈子都不会发病|一辈子都不会发病|终生不会发病|永远不发病|本来不会发病|一生都不会发病|压根不会发病/,
  /本来不会(?:恶变|癌变|进展|发展|变成|出问题|有问题)|终生不会[^。！？]{0,2}(?:恶变|癌变|进展|出症状|引起症状|有症状)|一辈子不会(?:恶变|癌变|出症状)|永远不会?(?:恶变|癌变|进展|发病)/,
  /本来不需要治疗|不需要治疗|无需治疗|不用治疗|治不治都一样|不治也没事|不治也不会|观察等待即可/,
  /过度诊断|过度诊疗|被过诊/,
];
// 腿②（英文）：would never have caused / never would have / overdiagnosed
const OVERDIAG_EN = [
  /\bwould\s+never\s+(?:have\s+)?(?:caused|progressed|become|developed|mattered|surfaced|shown|led)\b/i,
  /\bnever\s+would\s+have\b/i,
  /\boverdiagnos(?:is|ed|e|es|ing)\b/i,
  /\b(?:harmless|innocent|inert|indolent)\s+(?:lesions?|tumou?rs?|cancers?|growths?|findings?)\b/i,
  /\b(?:lesions?|tumou?rs?|cancers?|findings?)\s+that\s+(?:would|will)\s+never\b/i,
  /\bno\s+treatment\s+(?:was|is)\s+(?:needed|necessary|required)\b/i,
];

// 腿③ GAIN_CLAIM 收益计入断言（过度诊断病例被算成筛查成果/救命证据）
const GAIN_CLAIM_ZH = [
  /(?:计入|算入|算进|纳入|归入|统计进|算成|算作|算作是)[^。！？]{0,10}(?:收益|成果|救治|治愈|战绩|成绩|绩效|业绩|数据|案例|病例|名单)/,
  /(?:收益|成果|价值|效果|好处|战绩|成绩)[^。！？]{0,4}(?:可观|显著|巨大|极大|丰厚|很高|极高|不小)/,
  /证明[^。！？]{0,12}(?:筛查|检测|早筛|体检)[^。！？]{0,6}(?:挽救|拯救|救命|有效|价值|值得|改善)/,
  /(?:证明|说明|可见|表明|足以证明)[^。！？]{0,12}(?:筛查|检测|早筛|体检)[^。！？]{0,6}(?:拯救|挽救|救命|救治|改善|提高|延长|有效|价值)/,
];
// 腿③（英文）：counted as / saves lives / proves screening saves
const GAIN_CLAIM_EN = [
  /\b(?:counted|credited|tallied|recorded|logged|booked|chalked)\b[^.]{0,30}\b(?:as|toward|into)\b/i,
  /\b(?:saves?|saved|rescues?|rescued|cured?|healed)\s+(?:lives|life|patients)\b/i,
  /\bproves?\s+(?:that\s+)?(?:screening|early\s+detection)\s+(?:works|saves|is\s+worth|delivers)\b/i,
  /\b(?:shows?|demonstrates?|proves?)\b[^.]{0,30}\b(?:screening|early\s+detection)\b[^.]{0,30}\b(?:saves?|works|benefit)\b/i,
  /\b(?:improvement|gain|benefit)\s+in\s+screened\b[^.]{0,40}\b(?:proves?|shows?|demonstrates?|confirms?)\b/i,
];

// 豁免 EXEMPT_LEN（r331，只作用于路径 e/f——与 EXEMPT_LEAD 分离：
// r328 轮测断言 EXEMPT_LEAD 恰三元素，不动其既有结构）。四条通路：
//  (a) 偏误点名（病程长度偏误/长度时间偏误裸名；过度诊断须带纠正语境，
//      否则「把过度诊断病例算进收益」型攻击会被自己的机制词豁免）；
//      EN length-time bias / case-mix 裸名，overdiagnos* 须带纠正词）；
//  (b) 谨慎解读否定（不能/并不/不代表…不等于寿命延长/筛查有效）；
//  (c) 收益高估夸大（高估/夸大/虚增…收益；EN inflates/overestimates…
//      benefit）；
//  (d) 死亡率终点设计（以总死亡率为终点——设计已消除筛查偏误）。
const EXEMPT_LEN_ZH = [
  /病程长度偏误|病程长度偏倚|长度时间偏误|长度时间偏倚|长度偏误|病例组合(?:偏误|偏倚|问题|效应)/,
  /过度诊断[^。！？]{0,20}(?:偏误|偏倚|问题|效应|高估|夸大|虚增|并不意味着|并不能|不代表)|(?:偏误|偏倚|问题|效应)[^。！？]{0,6}过度诊断/,
  /(?:不能|并非|不代表|不等于|不足以|无法|很难|未必|不一定|不应|不可|并不会)[^。！？]{0,18}(?:寿命|生命|延寿|延年|活得更久|多活|延长|救命|收益|获益|有效|价值|改善|提高|救治|治愈)/,
  /(?:高估|夸大|虚增|注水|放大)[^。！？]{0,8}(?:收益|获益|效果|价值|成果|作用|好处)/,
  /(?:收益|获益|效果|价值|成果|作用|好处)[^。！？]{0,8}(?:被)?(?:高估|夸大|虚增|注水|放大|失真)/,
  /(?:以|用|按|采用)[^。！？]{0,12}(?:总死亡率|全因死亡率|死亡率|死亡)[^。！？]{0,10}(?:为|作|作为)[^。！？]{0,8}(?:终点|指标|主要终点|观察终点|主要指标)/,
];
const EXEMPT_LEN_EN = [
  /\blength[- ]?time\s+bias\b/i,
  /\bcase[- ]mix\b/i,
  /\boverdiagnos(?:is|ed|e|es|ing)\b[^.]{0,60}\b(?:inflates?|overestimat\w+|bias|problem|means|does\s+not|is\s+not)\b/i,
  /\b(?:does\s+not|do\s+not|doesn'?t|don'?t|cannot|can'?t|not)\b[^.]{0,28}\b(?:live\s+longer|longer\s+life|life\s+extension|extends?\s+life|prolongs?\s+life|saves?\s+lives|works?|effective|benefit|improves?|proves?)\b/i,
  /\b(?:inflates?|inflated|overestimat\w+|exaggerat\w+|overstat\w+)\b[^.]{0,30}\b(?:benefit|survival|value|effect|apparent)\b/i,
  /\b(?:overall|all[- ]?cause|total|disease[- ]specific)\s+mortality\b[^.]{0,36}\b(?:endpoint|primary\s+outcome|unchanged|no\s+difference)\b/i,
];

// ─── [r335] 路径 (g) Will Rogers 现象/分期迁移子家族常量 ──────────────
// 腿① RECLASS 重新分类动作：成员在组别间被搬进/搬出/重划。收裸动词
// 形态（「重新划入」「分出去」「上调到」不带宾语也命中），并覆盖分类
// *政策*名词形（新分期标准/修订后的分级方案——分类标准本身被更换即
// 成员可能被重划）。升级/降级限两类上下文防误伤（带对象名词，或带
// 级/档/池/班/组/期/层/类 后缀）——「升级到新版本」「下调准备金率」
// 类软件/金融操作不触发。
const RECLASS_ZH = [
  /重新(?:划入|划归|归类|分类|编班|编组|分组|分层|划分|编排|分班|分流|归入|洗牌)/,
  /(?:调到|调入|调出|调至|调回|转入|转到|转移到|搬到|挪到|移至|划到|分到|归到|编入|隔离到|剔除|剔出|剥离|剥出|移出|转出|分流到|分出去|分出来|单独组班|另组|另编|重新划分|换到)/,
  /(?:客户|用户|患者|病人|学生|员工|病例|账号|账户|投保人|借款人|商家|人员|对象|孩子)[^。！？]{0,8}(?:上调|下调|升级|降级)(?:至|到|入|进)/,
  /(?:上调|下调|升级|降级|升入|降入)(?:至|到|入|进)[^。！？]{0,8}(?:级|档|池|班|组|期|层|类|区|部)/,
  /(?:新|修订|更新|调整|改革)(?:后|的)?(?:分期|分档|分级|分层|分类|编班|分组|分流)(?:标准|方案|规则|模型|体系|办法|政策|新政)/,
];
// 腿①（英文）：reclassified as / moved to / transferred to / re-bucketed
// into / restaged as / promoted to（成员在组间搬移的显式动词；直间形
// moved to 与带宾语形 moving … to a separate class 分列，分词与过去式
// 同收）
const RECLASS_EN = [
  /\breclassif(?:ied|ication|y|ies)\s+(?:as|into|to)\b/i,
  /\bre-?bucket(?:ed|ing|s)?\b[^.]{0,40}\b(?:into|to)\s+(?:a\s+)?(?:new|different|separate|another|higher|lower|earlier|later|better|worse)\b/i,
  /\b(?:mov(?:e|ed|ing)|transfer(?:red|ring)?|shift(?:ed|ing)?|promot(?:e|ed|ing)|demot(?:e|ed|ing)|reassign(?:ed|ing)?|upgrad(?:e|ed|ing)|downgrad(?:e|ed|ing)|migrat(?:e|ed|ing)|restag(?:e|ed|ing))\s+(?:to|into|from)\b/i,
  /\b(?:mov(?:e|ed|ing)|transfer(?:red|ring)?|shift(?:ed|ing)?|promot(?:e|ed|ing)|demot(?:e|ed|ing)|reassign(?:ed|ing)?|upgrad(?:e|ed|ing)|downgrad(?:e|ed|ing)|migrat(?:e|ed|ing)|restag(?:e|ed|ing))\s+[^.]{0,50}\b(?:to|into)\s+(?:a|an|the|its|their)?\s*(?:new|different|separate|another|partner|preferred|prime|subprime|elite|higher|lower|earlier|later|better|worse|top|bottom)\b/i,
];

// 腿② BOTH_UP 两组指标同向变动：Will Rogers 的账面签名——「都」量化
// 词 + 方向变动动词（上升/下降/提高/降低/改善/好转）。方向双向收
// （生存率上升与死亡率下降都是账面改善，极性由指标决定），组别上下文
// 由腿①建立。
const BOTH_UP_ZH = [
  /(?:都|均|皆)[^。！？]{0,10}(?:上升|下降|提高|降低|改善|好转|提升|上涨|走低|变得更好|好看起来)/,
  /(?:上升|下降|提高|降低|改善|好转|提升|上涨|走低)[^。！？]{0,8}(?:都|均|皆)/,
  /(?:双双|一齐|一并|两个都|两边都|同期|同时)[^。！？]{0,12}(?:上升|下降|提高|降低|改善|好转|提升)/,
];
// 腿②（英文）：both groups … rose / fell in both / in both tiers /
// across both groups / each group saw（两组同向变动的显式形）
const BOTH_UP_EN = [
  /\bboth\s+(?:groups?|tiers?|stages?|cohorts?|pools?|classes?|buckets?|categories|strata|arms)\b[^.]{0,50}\b(?:rose|risen|fell|dropped|improved|declined|climbed|increased|decreased|lowered|reduced|better|higher|lower)\b/i,
  /\b(?:rose|risen|fell|dropped|improved|declined|climbed|increased|decreased|lowered|reduced)\s+in\s+both\b/i,
  /\bin\s+both\s+(?:groups?|tiers?|stages?|cohorts?|pools?|classes?|buckets?|categories|strata|arms)\b/i,
  /\bacross\s+both\s+(?:groups?|tiers?|stages?|cohorts?|pools?|classes?|buckets?|strata)\b/i,
  /\beach\s+(?:group|tier|stage|cohort|pool|class|bucket|stratum)\s+(?:saw|showed|posted|reported)\b/i,
];

// 腿③ CLAIM 成效结论：把账面改善归因为标准/干预/改革真实有效。
const CLAIM_ZH = [
  /(?:说明|证明|可见|表明|足以证明|意味着|反映出|体现出|佐证了?|印证了?)[^。！？]{0,18}(?:改善|提高|有效|成功|疗效|预后|成绩|成果|进步|见效|立竿见影|水平|水准|科学|合理|准确|靠谱|显著|明显|大幅)/,
  /(?:显著|明显|大幅|切实|真正)[^。！？]{0,6}(?:改善|提高|提升|好转)/,
];
// 腿③（英文）：proof … works / shows excellent / so the new … works
// （推断标记分词形 showing/proving/indicating 与名词形 evidence/同收；
// 成效结论收 succeeded / paid off / accurate——「证明新标准更准确」
// 「说明改革成功了」都是把账面改善归因为标准自身改良）
const CLAIM_EN = [
  /\b(?:proof|proves|proved|proving|shows?|showed|showing|demonstrates?|demonstrated|demonstrating|indicates?|indicated|indicating|confirms?|confirmed|confirming|suggests?|suggested|suggesting|evidence|means?)\b[^.]{0,40}\b(?:works?|worked|effective|excellent|superb|outstanding|improved|improvement|success|successful|succeeded|better|progress|benefit|accurate|paid\s+off|pays\s+off)\b/i,
  /\bso\s+the\s+new\b[^.]{0,30}\b(?:works?|worked|is\s+effective|succeeded|paid\s+off)\b/i,
  /\b(?:works?|worked|effective|improved|improvement|success|successful)\b[^.]{0,30}\b(?:proof|proves|shows?|demonstrates?|confirms?)\b/i,
];

// 豁免 EXEMPT_WR（只作用于路径 g——被豁免的句子仍可由路径 (a)-(f)
// 或 simpsons_paradox 等维度评判）：
//  (a) 偏误点名（Will Rogers/分期迁移偏误/统计假象/没有一个…真的…变好/
//      stage migration bias / reclassification artifact / without anyone
//      improving）——那是在破除本谬误；
//  (b) 谨慎解读否定（不能/并不/不代表/并不意味着…改善/有效/说明）——
//      正确判别动作，正是本族要教的；
//  (c) 总体终点无变化（总生存期没有变化/总体持平/overall unchanged）
//      ——账面之外的总体终点已排除真实改善的可能。
const EXEMPT_WR_ZH = [
  /Will\s*Rogers|威尔·?罗杰斯|威耳·?罗杰斯/,
  /(?:分期|重新分类|归类|迁移|重分类|转组|调组|编班|分层|分类)(?:偏误|偏倚|问题|效应|假象|陷阱|现象)/,
  /统计假象|账面改善|账面提高|账面上升|账面下降|统计幻觉|虚假改善|账面数据/,
  /(?:不能|并非|不代表|不等于|并不意味着|并不能|不足以|无法|很难|未必|不一定|不应|不可|并不会)[^。！？]{0,20}(?:改善|提高|有效|成功|水平|疗效|进步|变好|成效|结果|说明|科学)/,
  /(?:没有|并没|未曾)[^。！？]{0,8}(?:一个|任何人|有人|病人|患者|学生|员工|成员)[^。！？]{0,12}(?:真的|真正)?[^。！？]{0,6}(?:变好|改善|进步|好转|提升|更健康|活得更久|受益|提高)/,
  /(?:总生存期|总体|整体|合计|总共|总人数|总数)[^。！？]{0,10}(?:没有|并无|未见|保持不变|不变|持平|无变化|原地踏步|毫无变化)/,
];
const EXEMPT_WR_EN = [
  /\bWill\s+Rogers\b/i,
  /\b(?:stage\s+migration|reclassification|restaging|re-?bucketing|migration)\b[^.]{0,40}\b(?:bias|artifact|phenomenon|effect|illusion)\b/i,
  /\bstatistical\s+(?:artifact|illusion)\b/i,
  /\b(?:does\s+not|do\s+not|doesn'?t|don'?t|cannot|can'?t|is\s+not|not)\b[^.]{0,30}\b(?:improve|improved|improvement|mean|indicate|prove|show|effective|progress|better|works?)\b/i,
  /\b(?:without|no)\s+(?:any|a single|one)?\s*(?:\w+\s+){0,2}(?:actually\s+)?(?:improving|getting\s+better|living\s+longer|being\s+better|doing\s+better)\b/i,
  /\bno\s+(?:one|patient|student|employee|borrower|worker|person)\b[^.]{0,30}\b(?:actually\s+)?(?:got|became|is|was)\s+(?:better|improved|healthier|worse)\b/i,
  /\boverall\s+(?:survival|outcome|performance|results?|numbers?)\s+(?:was|is|were|remained?)\s+(?:unchanged|the\s+same|flat|identical)\b/i,
];

// 取某正则清单在文本中最早匹配的起始下标（无匹配返回 -1）
function earliestIdx(list, text) {
  let best = -1;
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m && m.length > 0) {
      const i = text.indexOf(m[0]);
      if (i >= 0 && (best < 0 || i < best)) best = i;
    }
  }
  return best;
}

// 中英两清单的最早匹配下标（-1 视为缺席，取非负最小值）
function earliestEither(zhList, enList, text) {
  const a = earliestIdx(zhList, text);
  const b = earliestIdx(enList, text);
  if (a < 0) return b;
  if (b < 0) return a;
  return Math.min(a, b);
}

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

  // ─── [r328] 路径 (d) 领先时间偏误（lead-time bias）子家族 ───────────
  // 筛查域 × 生存核算口径 × 寿命延长结论，三腿共现 + 跨腿邻近窗。
  // 与路径 (a)(b)(c)（起点错位）相互独立：本路径**不要求起点锚在场**
  // （领先时间的错位来源是筛查前移诊断时点，不是起算口径不一致），
  // 因此必须在锚腿门槛之前评判。豁免四只作用于本路径——被豁免的句子
  // 仍可被路径 (a)(b)(c) 以永生时间偏误本体评判。
  const XL_Z = R.EXEMPT_LEAD_ZH || EXEMPT_LEAD_ZH;
  const XL_E = R.EXEMPT_LEAD_EN || EXEMPT_LEAD_EN;
  if (!(anyHit(XL_Z, text) || anyHit(XL_E, text))) {
    const p1 = earliestEither(R.LEAD_SCREEN_ZH || LEAD_SCREEN_ZH, R.LEAD_SCREEN_EN || LEAD_SCREEN_EN, text);
    const p2 = earliestEither(R.SURV_ACCOUNT_ZH || SURV_ACCOUNT_ZH, R.SURV_ACCOUNT_EN || SURV_ACCOUNT_EN, text);
    const p3 = earliestEither(R.LIFE_CLAIM_ZH || LIFE_CLAIM_ZH, R.LIFE_CLAIM_EN || LIFE_CLAIM_EN, text);
    if (p1 >= 0 && p2 >= 0 && p3 >= 0) {
      // 疑问形守卫：整句以问号收尾（「…说明筛查延长了寿命吗？」/「…saves
      // lives?」）是探询不是断言，与 common-cause 等族的疑问豁免同口径。
      if (!/[？?]\s*$/.test(text)) {
        const win = /[\u4e00-\u9fff]/.test(text) ? (R.WIN_LEAD_ZH ?? WIN_LEAD_ZH) : (R.WIN_LEAD_EN ?? WIN_LEAD_EN);
        const span = Math.max(p1, p2, p3) - Math.min(p1, p2, p3);
        if (span <= win) {
          return {
            hit: true, score: 0.6, count: 1,
            detail: /[\u4e00-\u9fff]/.test(text)
              ? '领先时间偏误×筛查提前确诊×生存账面改善×寿命延长结论(zh)'
              : 'lead-time-bias×screening-advances-diagnosis×survival-accounting×life-extension-claim(en)',
          };
        }
      }
    }
  }

  // ─── [r331] 路径 (e)(f) 筛查偏误兄弟族 ────────────────────────────
  // 病程长度偏误（length-time bias）与过度诊断（overdiagnosis）——与
  // 领先时间偏误（路径 d）同属筛查偏误三兄弟，src/ 下均无独立维度。
  // 两条路径共享腿①筛查域与豁免 EXEMPT_LEN，只换腿②（病例构成 /
  // 本不会发病病灶）与腿③（筛查获益结论 / 收益计入断言），同样在锚腿
  // 门槛之前评判（不要求起点锚在场）。豁免只作用于本两条路径——被豁免
  // 的句子仍可被路径 (d) 或 (a)(b)(c) 评判。
  const XL2_Z = R.EXEMPT_LEN_ZH || EXEMPT_LEN_ZH;
  const XL2_E = R.EXEMPT_LEN_EN || EXEMPT_LEN_EN;
  if (!(anyHit(XL2_Z, text) || anyHit(XL2_E, text))) {
    const ps1 = earliestEither(R.LEAD_SCREEN_ZH || LEAD_SCREEN_ZH, R.LEAD_SCREEN_EN || LEAD_SCREEN_EN, text);
    if (ps1 >= 0 && !/[？?]\s*$/.test(text)) {
      const winL = /[\u4e00-\u9fff]/.test(text) ? (R.WIN_LEAD_ZH ?? WIN_LEAD_ZH) : (R.WIN_LEAD_EN ?? WIN_LEAD_EN);
      // 路径 (e) 病程长度偏误：筛查域 × 惰性病程病例构成 × 筛查获益结论
      const pe2 = earliestEither(R.LEN_COMP_ZH || LEN_COMP_ZH, R.LEN_COMP_EN || LEN_COMP_EN, text);
      const pe3 = earliestEither(R.SCREEN_BENEFIT_ZH || SCREEN_BENEFIT_ZH, R.SCREEN_BENEFIT_EN || SCREEN_BENEFIT_EN, text);
      if (pe2 >= 0 && pe3 >= 0) {
        const span = Math.max(ps1, pe2, pe3) - Math.min(ps1, pe2, pe3);
        if (span <= winL) {
          return {
            hit: true, score: 0.6, count: 1,
            detail: /[\u4e00-\u9fff]/.test(text)
              ? '病程长度偏误×筛查优先检出惰性病程×筛查获益结论(zh)'
              : 'length-time-bias×screening-enriched-for-slow-progression×screening-benefit-claim(en)',
          };
        }
      }
      // 路径 (f) 过度诊断：筛查域 × 本不会发病病灶 × 收益计入断言
      const pf2 = earliestEither(R.OVERDIAG_ZH || OVERDIAG_ZH, R.OVERDIAG_EN || OVERDIAG_EN, text);
      const pf3 = earliestEither(R.GAIN_CLAIM_ZH || GAIN_CLAIM_ZH, R.GAIN_CLAIM_EN || GAIN_CLAIM_EN, text);
      if (pf2 >= 0 && pf3 >= 0) {
        const span = Math.max(ps1, pf2, pf3) - Math.min(ps1, pf2, pf3);
        if (span <= winL) {
          return {
            hit: true, score: 0.6, count: 1,
            detail: /[\u4e00-\u9fff]/.test(text)
              ? '过度诊断×本不会发病病灶计入收益×筛查获益结论(zh)'
              : 'overdiagnosis×would-never-progress-lesions×screening-benefit-claim(en)',
          };
        }
      }
    }
  }

  // ─── [r335] 路径 (g) Will Rogers 现象/分期迁移（stage migration）────
  // 重新分类动作 × 两组指标同向变动 × 成效结论，三腿共现 + 跨腿邻近窗。
  // 与路径 (a)-(f) 相互独立：本路径**不要求筛查域在场**（错位来源是
  // 成员在组间被搬移，不是起点/筛查/病例构成），同样在锚腿门槛之前
  // 评判。豁免只作用于本路径——被豁免的句子仍可由路径 (a)-(f) 或
  // 其他维度评判。
  const XW_Z = R.EXEMPT_WR_ZH || EXEMPT_WR_ZH;
  const XW_E = R.EXEMPT_WR_EN || EXEMPT_WR_EN;
  if (!(anyHit(XW_Z, text) || anyHit(XW_E, text))) {
    const pg1 = earliestEither(R.RECLASS_ZH || RECLASS_ZH, R.RECLASS_EN || RECLASS_EN, text);
    if (pg1 >= 0 && !/[？?]\s*$/.test(text)) {
      const winW = /[\u4e00-\u9fff]/.test(text) ? (R.WIN_LEAD_ZH ?? WIN_LEAD_ZH) : (R.WIN_LEAD_EN ?? WIN_LEAD_EN);
      const pg2 = earliestEither(R.BOTH_UP_ZH || BOTH_UP_ZH, R.BOTH_UP_EN || BOTH_UP_EN, text);
      const pg3 = earliestEither(R.CLAIM_ZH || CLAIM_ZH, R.CLAIM_EN || CLAIM_EN, text);
      if (pg2 >= 0 && pg3 >= 0) {
        const span = Math.max(pg1, pg2, pg3) - Math.min(pg1, pg2, pg3);
        if (span <= winW) {
          return {
            hit: true, score: 0.6, count: 1,
            detail: /[\u4e00-\u9fff]/.test(text)
              ? 'Will Rogers现象×重新分类×两组指标同升×成效结论(zh)'
              : 'will-rogers-phenomenon×reclassification×both-groups-improve×efficacy-claim(en)',
          };
        }
      }
    }
  }

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
    // [r328] 路径 (d) 领先时间偏误子家族（负例注入口）
    LEAD_SCREEN_ZH, LEAD_SCREEN_EN,
    SURV_ACCOUNT_ZH, SURV_ACCOUNT_EN,
    LIFE_CLAIM_ZH, LIFE_CLAIM_EN,
    EXEMPT_LEAD_ZH, EXEMPT_LEAD_EN,
    WIN_LEAD_ZH, WIN_LEAD_EN,
    // [r331] 路径 (e) 病程长度偏误 + 路径 (f) 过度诊断（负例注入口）
    LEN_COMP_ZH, LEN_COMP_EN,
    SCREEN_BENEFIT_ZH, SCREEN_BENEFIT_EN,
    OVERDIAG_ZH, OVERDIAG_EN,
    GAIN_CLAIM_ZH, GAIN_CLAIM_EN,
    EXEMPT_LEN_ZH, EXEMPT_LEN_EN,
    // [r335] 路径 (g) Will Rogers 现象/分期迁移（负例注入口）
    RECLASS_ZH, RECLASS_EN,
    BOTH_UP_ZH, BOTH_UP_EN,
    CLAIM_ZH, CLAIM_EN,
    EXEMPT_WR_ZH, EXEMPT_WR_EN,
  }),
};
