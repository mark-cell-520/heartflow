/**
 * src/significance-effect-size.js — 「显著性≠重要性」检测器
 * （provisional 第 238 个判别维度，r250 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r250-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r249：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect/peak_end_rule/law_of_small_numbers/prosecutors_fallacy/
 * inverse_gamblers_fallacy/count_rate_conflation 二十四个已起草未接线
 * 维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r250 立项] 零命中探针 coordination/agent4/probes/r250-probe-round1.js
 * ~round3-decisive.js（v6.8.145，hf.gate() 全量 findings 口径，过滤
 * {dimension:'none'} 哨兵）。五候选三轮定夺：
 *   · A 均值-离群误读：攻击穿透 12/14，疑难良性维度级误伤 0/12，但
 *     邻接领地 4/6 中 2 条被 ecological_fallacy / hasty_generalization
 *     代拦，且「人均 GDP 一万美元，所以每个人都过上…」一句已被
 *     illicit_conversion + ecological_fallacy + hasty_generalization
 *     三维代拦——领地与既有维度重叠，独有空间窄；
 *   · B 邓宁-克鲁格效应：攻击穿透 11/12，疑难良性误伤 1/12（既有维度
 *     perfect_error 代拦），边界（越级否定 vs 正当外行质疑）过窄；
 *   · C 趋势外推谬误：攻击穿透 10/12，疑难良性误伤 2/12（soft_
 *     deflection / perfect_error 误伤对冲预测句），误伤最重；
 *   · D 显著性≠重要性：攻击穿透 **13/14**（唯一被拦的一条由既有维度
 *     perfect_error 代拦，非本族领地），疑难良性误伤 1/12 且该误伤来自
 *     既有维度 monocausal_attribution 而非本族判据（本族豁免族天然覆盖
 *     该句），邻接领地 5/6 穿透且结构清晰；
 *   · E 现状偏好/默认效应：攻击穿透 11/12，疑难良性误伤 1/12，但邻接
 *     领地 4/6 中 2 条被 sunk_cost_coercion / appeal_to_tradition
 *     代拦，且「能跑就不要动，重构风险大于收益」式工程常识与本族
 *     攻击句结构同形，误伤风险不可控。
 * D 以「最高穿透 13/14 + 疑难良性本族判据零误伤 + 邻接领地基本零
 * 重叠」三项胜出。
 *
 * 外部来源：arXiv 命中 15 篇真实相关文献（显著性×效应量的方法论综述，
 * 含 2610.09094v1「A Formal Graphical Inference Framework for Combining
 * Effect Size with Statistical Significance」、2305.08945v1「Is a Mean
 * Difference of 0.46 Relevant?」、2011.13231v1 NLPStatTest、1904.06979v2
 * RL 算法统计比较指南），GitHub 19 个仓库（Dekic648/significance-
 * translator 及大量 A/B 测试教学仓库）全是教程/计算工具，**零纯规则
 * 文本检测实现**；Semantic Scholar 五次连续 429。无可集成的纯规则实现，
 * 判据为心虫自有纯规则实现，家族定义取自统计素养的标准表述（显著性
 * 检验回答「差异是否可能只是噪声」，效应量回答「差异有多大、是否
 * 要紧」，两者不可互推）。
 *
 * 辨别的族：显著性≠重要性（statistical significance vs practical
 * importance / effect size conflation）——把**统计显著性**直接当成
 * **实质重要性、实际效果或推广依据**：
 *   p 小于 0.05，所以这个药有效，可以全面推广。
 *   差异显著，说明新方法明显更好。
 *   实验组显著优于对照组，这证明改进很大。
 *   显著性检验通过了，可见这个发现很重要，值得写进指南。
 *   p < 0.05, so the drug works and should be rolled out to everyone.
 *   The difference is statistically significant, so the new method is
 *   clearly better.
 *   The result is significant, which proves the effect is large and
 *   important.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：p 值是样本量
 * 的函数——样本量足够大时，任何微不足道的差异都能「显著」；p 值小只
 * 说明「不太可能是噪声」，不说明「差异大、有用、值得推广」。把过线
 * 当效果，等于用仪器的灵敏度代言被测量物的尺寸。它比虚报数字更隐蔽：
 * p 值可以完全真实，结论可以完全无效。现实危害很直接：一个把风险从
 * 2% 降到 1.9% 的药因为 p<0.05 被全面推广；一个提升 0.1 分的教改因为
 * 「显著」被写成范例；无数小效应在样本量堆砌下变成「重大发现」。它与
 * 正当推理的界线很清楚：一旦给出效应量、置信区间、样本量或实际差异
 * 幅度，或明确指出显著不等于重要，就是正当做法，一律豁免。
 *
 * 与既有维度的边界（r250 归因，探针邻接领地实测）：
 *   · statistical_misleading（58）管**统计呈现手法**（小基数比例、
 *     选择性图表）；本族管**推断口径倒置**（显著性 → 重要性）。
 *   · false_precision（188）管**数字精度虚假**（多报小数位）；
 *     本族判据里根本没有精度问题，p 值可以是完全精确的 0.04。
 *   · p_hacking（provisional 220，r232 草稿）管**大量尝试 × 只报告
 *     偶然显著的那个**；本族不要求任何「多次尝试」腿，单次检验的
 *     显著性误推也判（探针邻接句「试了三十种配方有一种有效」不属
 *     本族判据）。
 *   · law_of_small_numbers（provisional 234，r246 草稿）管**小样本
 *     波动当总体分布**；本族管**显著性 → 效应规模**，样本量可以很大。
 *   · count_rate_conflation（provisional 237，r249 草稿）管**原始
 *     计数缺分母**；本族判据里根本不出现计数排名。
 *   · confidence / perfect_error 等判**语气自信或绝对化措辞**；
 *     本族判据是两条具体统计口径腿 + 推断标记，不依赖语气。
 *
 * 判据（双腿链 + 推断标记，缺一不判）：
 *   ① 腿① 显著性陈述——p 值锚（p 值/p 小于 0.05/p=0.03/p<0.05；
 *     EN p-value/p < 0.05）或显著性措辞（统计显著/差异显著/显著性
 *     检验/结果显著/效果显著/统计学意义；EN statistically significant/
 *     significant difference/significance test/result is significant），
 *     近距窗 ZH40/EN90；
 *   ② 腿② 实质性裁定——四族：重要性（很重要/重大/突破性/里程碑；
 *     EN important/major/breakthrough）、实际优越（明显更好/强得多/
 *     确实有效；EN clearly better/much better/works better）、推广
 *     （全面推广/直接上/写进指南；EN rolled out/deploy everywhere）、
 *     效应规模（效应很大/改进很大；EN the effect is large）；
 *   ③ 推断标记——两腿之间须见推断连接（所以/说明/证明/可见/当然/
 *     足以；EN so/therefore/which means/proves），证明结论是由显著性
 *     **推出来**的，而不是并列陈述两件事。限定性前缀（「只说明」
 *     「p 值仅表示」/only means/merely indicates）后面的连接词不算
 *     推断标记——「p 值只说明差异不太可能是噪声」是正当表述。
 *     **有意不收**「显著性检验通过了，这个发现很重要」这类无连接词
 *     的同位句：它与教科书句「显著性水平通常取 0.05，这个选择很
 *     重要」结构同形，纯规则无法区分，宁缺勿滥（见报告 §四 已知
 *     缺口）；
 *   ④ 腿①查否定前缀（差异不显著/未达显著/not significant → 失配），
 *     腿②同样查否定（不能说明重要/不重要/not important → 失配）；
 *   ⑤ 豁免——口径意识（效应量/置信区间/样本量/实际意义/差异只有/
 *     幅度有限/临床意义/effect size/confidence interval/sample size/
 *     practical significance——CORRECTIVE）与概念教学（显著不等于
 *     重要/显著性不代表/显著只是说明/significance does not mean/
 *     statistically significant does not equal——CONCEPT）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次检验结果（确实需要补上
 * 效应量才能支撑重要性结论），也可能是在引用统计教学案例。verify 的
 * 语义是「这段话拿统计显著性给效应的重要性下了结论，先补上效应量、
 * 置信区间和样本量，换成实际差异幅度再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 给出效应量/置信区间/样本量的正当陈述（p<0.05 但效应量很小/
 *     置信区间很宽/样本量只有三十/effect size is tiny）；
 *   · 概念教学（统计显著不等于重要/significance does not mean
 *     importance）；
 *   · 并列陈述两件事而无推断（新方法明显更好，而且 p 值也小于
 *     0.05——没有推断连接，显著性只是并列事实）；
 *   · 单腿句（只报 p 值无裁定、只「这个方法更好」无显著性陈述）；
 *   · false_precision / p_hacking / count_rate_conflation 领地。
 *
 * [r311 升级] 腿②新实质性裁定措辞家族（真升级②）：存量四族不认的
 * 新裁定腿——ZH「影响深远/意义深远」（MAGNITUDE_ZH2）、
 * 「含金量高/价值很大/分量很足/很有价值/很有分量」
 * （IMPORTANCE_ZH2）；EN「impactful / game-changer /
 * world-changing / consequential / matters in practice /
 * implications are huge / far-reaching impact / of great value」
 * （IMPORTANCE_EN2 + MAGNITUDE_EN2）。探针 12/12 穿透本模块、
 * 官方良性语料 228 条零误命中（coordination/agent4/probes/
 * r311-probe*.js）。实现为平行常量 + findSignatures concat 合并，
 * 存量四族注入语义不变（新键注入 [] 整体替换新腿；存量键注入永假
 * 正则时 .concat 抛 TypeError，与存量行为一致，聚合层 _safeDetect
 * 兜底）。src/index.js 零改动。
 *
 * [r319 升级] 腿①踩线显著族 × 腿②新裁定族（真升级②）：存量 SIG
 * 表收「p 值 0.049/统计显著/显著优于」标准形，不收 p 值贴着 0.05
 * 关口被当成确证证据的陈述——ZH「擦线达到显著/勉强显著/p 卡在
 * 0.05 关口」（SIG_ZH3）；EN「p came out at 0.049 / just crossed
 * the significance threshold / barely significant」（SIG_EN3）。
 * 裁定侧补：ZH「改进是真实存在的」（SUPERIOR_ZH3）、「可以/值得
 * 推广」无强化词形（SCALE_ZH3）；EN「the treatment works /
 * the drug is effective」（SUPERIOR_EN3）。探针 7 条候选 6 条穿透
 * 模块、其中 2 条穿透整个 gate 无维度代拦（scripts/round-319/
 * probe-candidates.js D 族）；官方良性语料零误命中。平行常量 +
 * findSignatures concat 合并，存量腿与 r311 腿注入语义不变。
 * src/index.js 零改动。
 */
'use strict';

// ─── 腿① 显著性陈述（统计检验的过线陈述，非日常「显著」）────────
const SIG_ZH = [
  // p 值锚
  /p\s*值/,
  /p\s*(?:小于|低于|不超过|不到|等于|=|＜|<)\s*0?\.\d+/,
  // 统计显著措辞（阈值设定句式「显著性水平取 0.05」不算结果陈述，不收）
  /统计(?:学)?(?:上)?(?:显著|有意义|意义|成立)/,
  /显著性(?:检验|测试|差异|结果)?/,
  /差异显著|结果显著|对比显著|效果显著|疗效显著|改善显著|提升显著|下降显著/,
  /显著优于|显著高于|显著低于|显著好于|显著长于|显著短于/,
  /(?:达到|具有|有)(?:统计学|统计)意义/,
  /显著(?:性)?(?:通过|达标|成立)/,
];
const SIG_EN = [
  /\bp-?value\b/i,
  /\bp\s*[<＜=]\s*0?\.\d+/i,
  /\bstatistically significant\b/i,
  /\bstatistical significance\b/i,
  /\bsignificance\s+(?:test|level|testing)\b/i,
  /\b(?:result|results|difference|effect|effects|finding|findings|correlation|relationship|change|improvement|test|tests|trial|study|experiment|analysis|outcome)\s+(?:is|are|was|were|came\s+back)\s+significant\b/i,
  /\bsignificant\s+(?:difference|effect|correlation|result|at)\b/i,
  /\bat the \d+% level\b/i,
];

// ─── 腿② 实质性裁定（四族）────────────────────────────────────
// A 重要性（实质性重要主张：须带强化词或名词中心语，裸「重要」太宽）
const IMPORTANCE_ZH = [
  /(?:很|极其|非常|十分|特别|极为|相当)重要/,
  /重要(?:的)?(?:发现|结论|成果|突破|进展|证据|依据|意义)/,
  /意义重大|意义非凡|事关重大/,
  /值得重视|值得重点关注/,
  /突破性|里程碑|重磅|轰动|举足轻重|前所未有/,
  /重大(?:发现|突破|进展|成果|改进|提升|意义)/,
];
const IMPORTANCE_EN = [
  /\bimportant\s+(?:finding|result|discovery|conclusion|breakthrough|implication)\b/i,
  /\b(?:a\s+)?(?:major|significant)\s+(?:finding|discovery|breakthrough|advance|result)\b/i,
  /\bbreakthrough\b/i, /\blandmark\b/i, /\bground-?breaking\b/i, /\ba big deal\b/i,
];
// B 实际优越（须见推断标记）
const SUPERIOR_ZH = [
  /(?:明显|显然|确实|的确|着实)?(?:更好|更强|更先进|更靠谱|更优越|好很多|强得多|领先不少|强不少|完胜|吊打|胜过)/,
  /(?:确实|的确|明显)?(?:有效|管用|有用|奏效|见效|起作用)/,
];
const SUPERIOR_EN = [
  /\b(?:clearly|obviously|substantially|significantly|much|far|decidedly)\s+(?:better|stronger|faster|more effective|superior)\b/i,
  /\b(?:clearly|obviously|definitely|certainly|really)\s+wins?\b/i,
  /\b(?:works|worked)\s+(?:better|best)\b/i,
  /\b(?:definitely|certainly|really|clearly|obviously)\s+(?:works|effective)\b/i,
];
// C 推广/行动（须见推断标记）
const SCALE_ZH = [
  /全面推广|推广应用|大规模铺开|大规模推广|大力推广|直接上|马上线|立刻上线|全线推开|直接铺开|普及开来|值得写进指南|写进指南|写进教材|据此推广|放心使用|可以放心用/,
];
const SCALE_EN = [
  /\broll(?:ed|ing)?\s+out\b/i, /\bdeploy(?:ed|ing)?\s+(?:it\s+)?everywhere\b/i, /\bscale\s+it\s+up\b/i, /\bship\s+it\s+to\s+everyone\b/i, /\badopt(?:ed|ing)?\s+(?:it\s+)?(?:everywhere|widely|universally)\b/i, /\b(?:put|into|in)\s+the\s+guidelines?\b/i, /\bstandard\s+of\s+care\b/i,
];
// D 效应规模（须见推断标记）
const MAGNITUDE_ZH = [
  /效应(?:很|非常|相当)?(?:大|强|可观)|效应巨大|效果(?:非常|相当)?(?:大|好|可观)|改进(?:很|非常)?大|影响巨大|作用(?:很|非常)?大|威力巨大|幅度很大|差异巨大/,
];
const MAGNITUDE_EN = [
  /\bthe\s+effect\s+is\s+(?:large|big|huge|substantial|enormous)\b/i, /\b(?:large|big|huge|substantial|enormous)\s+effect\b/i, /\bthe\s+improvement\s+is\s+(?:big|large|substantial|huge)\b/i, /\bhuge\s+difference\b/i, /\bsubstantial\b/i,
];

// ─── [r311] 腿② 新实质性裁定族（平行常量，存量四族注入语义不变）──────
// 影响深远/意义深远：把「差异可检出」外推到「效应影响深远」——存量
// MAGNITUDE 只收「效应很大/改进很大」类直接规模词，不收「深远」族；
// 探针实证 6/6 穿透（coordination/agent4/probes/r311-probe.js）。
const MAGNITUDE_ZH2 = [
  /影响(?:极为|极其|非常|十分|相当)?(?:深远|广泛|广大)/,
  /意义(?:极为|极其|非常|十分|相当)?深远/,
];
// 含金量/价值/分量：把显著性外推到「成果本身有价值有分量」——存量
// IMPORTANCE 只收「重要/重大/突破性」族，不收「含金量/分量」族；
// 探针实证 5/5 穿透。
const IMPORTANCE_ZH2 = [
  /含金量(?:很|非常|相当)?(?:高|十足|满满)/,
  /价值(?:很|非常|相当)?(?:大|高)/,
  /分量(?:很|非常|相当)?(?:足|重)/,
  /(?:很|非常|相当|颇)有价值/,
  /(?:很|相当|颇)有分量/,
];
// EN 侧新裁定腿：impactful / game-changer / world-changing /
// consequential / matters in practice / implications are huge。
const IMPORTANCE_EN2 = [
  /\bimpactful\b/i,
  /\bgame[- ]chang(?:er|ing)\b/i,
  /\bworld[- ]changing\b/i,
  /\b(?:truly |highly |genuinely |deeply |profoundly )?consequential\b/i,
  /\bmatters?\s+(?:a\s+(?:great\s+deal|lot)\s+)?in\s+practice\b/i,
  /\b(?:has|have|carries|with)\s+(?:real|major|significant|huge|enormous|profound)?\s*(?:practical\s+)?implications\b/i,
  /\bof\s+(?:great|considerable|major|enormous|immense)\s+(?:value|importance)\b/i,
];
const MAGNITUDE_EN2 = [
  /\bimplications\s+(?:are|is)\s+(?:huge|enormous|massive|profound|far[- ]reaching)\b/i,
  /\bfar[- ]reaching\s+(?:impact|consequences|effects)\b/i,
  /\b(?:matters|mattered)\s+(?:a\s+great\s+deal\s+)?in\s+the\s+real\s+world\b/i,
];

// ═══════════════════════════════════════════════════════════════════
// [r319] 「踩线显著族 × 新裁定族」新措辞家族（平行常量，不动存量腿）
//
// 缺口实证（scripts/round-319/probe-candidates.js，v6.8.179 基线）：
// 存量 SIG 表收「p 值 0.049/统计显著/显著优于」标准形，不收「踩线
// 显著」族——p 值贴着 0.05 关口被当成确证证据的陈述（擦线达到显著/
// 勉强显著/p 卡在 0.05 关口/barely significant/just crossed the
// threshold）：7 条候选 6 条穿透模块，其中 2 条穿透整个 gate 无维度
// 代拦（D 族 gate pass 2/7；其余被 fallacy_of_relevance /
// monocausal_attribution 代拦）。裁定侧缺口：SCALE_ZH 不收「可以
// 推广」无强化词形、SUPERIOR_* 不收「改进是真实存在的/治疗有效」
// 存在-有效族。
//
// 设计纪律（同 r309-r318）：
//   · 平行常量 + findSignatures concat，存量 SIG/SUPERIOR/SCALE 与
//     r311 新族一字不动（存量注入语义与轮测登记保持）；
//   · 新 SIG 腿走存量 collect(…, true) 否定守卫；推断标记存活判定
//     （RESTRICTIVE_BEFORE）不变——「只说明」不构成推断；
//   · 豁免层不动：CORRECTIVE（效应量/置信区间/踩线显著不能说明问题）
//     与 CONCEPT（显著性≠重要性教学）对新腿先生效；
//   · 官方良性语料 369 条零误命中（改前改后均实测）。
// ═══════════════════════════════════════════════════════════════════

// ─── [r319] 腿① 踩线显著族（中文）────────────────────────────
const SIG_ZH3 = [
  // 擦线/踩线/压线 + 达到/跨过 + 显著（擦线达到显著/踩线显著）
  /(?:擦线|踩线|卡线|压线|勉强|刚刚|刚好|险些|差点)(?:达到|跨过|越过|进入)?(?:显著|显著性|统计显著)/,
  // p 值卡在/压在 0.05 关口（p 卡在 0.05 关口）
  /p\s*(?:值)?[^。，！？；\n]{0,4}(?:卡在|压在|踩在|停在|挂在)\s*0?\.\d+/,
];

// ─── [r319] 腿① 踩线显著族（英文）────────────────────────────
const SIG_EN3 = [
  // p came out at 0.049 / p was 0.05（存量 p=0.0x 形不收 came out at）
  /\bp(?:\s*[-–]?value)?\s+(?:came\s+out\s+at|was|is|of|=|at)\s*0?\.\d+/i,
  // just/barely crossed the significance threshold
  /\b(?:just|barely|only\s+just|narrowly)\s+(?:crossed|cross|crossing|passed|passed\s+the|cleared)\s+(?:the\s+)?(?:significance|significance\s+threshold|threshold)/i,
];

// ─── [r319] 腿② 新裁定：真实存在/推广/有效（中文）──────────────
const SUPERIOR_ZH3 = [
  // 改进/效果…是真实存在的（存在族裁定）
  /(?:改进|提升|效果|疗效|改善|差异|变化|作用)(?:是|确实|的|是确实)?(?:真实|真正)(?:存在|的)/,
];
const SCALE_ZH3 = [
  // 可以/值得推广（无强化词形；存量 SCALE_ZH 只收全面/大力推广等强化形）
  /(?:可以|可|能够|值得|应当|应该|建议)(?:被)?(?:推广|推行|铺开|上线|采用|普及)/,
];

// ─── [r319] 腿② 新裁定（英文）────────────────────────────────
const SUPERIOR_EN3 = [
  // the treatment works / the drug is effective（存在-有效族）
  /\b(?:treatment|drug|intervention|method|approach|app|therapy|program)\s+(?:works|worked|is\s+effective)\b/i,
];

// ─── 推断标记（结论由显著性推出，而非并列陈述）─────────────────
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|当然|显然|肯定|一定|反映出|体现出|足见|充分说明|充分证明|足以表明|足以证明|结论就是|就是说|毋庸置疑|毫无疑问|分明|据此可以|就可以|可以说)/;
const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|which\s+proves|that\s+means|proves|shows\s+that|indicates\s+that|means\s+that|it\s+follows|this\s+shows|this\s+proves|clearly|obviously)\b/i;

// ─── 距离窗 ───────────────────────────────────────────────────
// 腿① × 腿②：显著性陈述 × 实质性裁定
const W_ZH = 40;
const W_EN = 90;

// ─── 豁免：口径意识（给出效应量/区间/样本量，正当做法）─────────
const CORRECTIVE_ZH = /(?:效应量|效应大小|置信区间|样本量|实际意义|实际差异|真实差异|差异只有|幅度有限|差异很小|临床意义|实践意义|统计功效|功效分析|校正后|多重比较|平均差异|标准差|置信度|区间宽|不显著|未达显著|差异不大|差别不大|意义有限|作用有限|效果有限)/;
const CORRECTIVE_EN = /\b(?:effect\s+size|effect\s+sizes|confidence\s+interval|confidence\s+intervals|sample\s+size|practical\s+significance|clinical\s+significance|practical\s+(?:value|importance|difference)|too\s+small|very\s+small|tiny|negligible|statistical\s+power|multiple\s+comparisons|corrected\s+for|not\s+practically|not\s+significant|no\s+significant\s+difference|small\s+effect|standard\s+deviation|Cohen'?s\s+d)\b/i;

// ─── 豁免：概念教学（点名显著性与重要性的区别本身）────────────
const CONCEPT_ZH = /(?:显著[^。，！？；\n]{0,8}(?:不等于|不代表|并不是|并非|不能说明|不意味着|未必意味着|不说明|不代表|误用|局限|滥用)|统计显著[^。，！？；\n]{0,6}(?:只|仅|仅仅)[^。，！？；\n]{0,6}(?:说明|表示|意味)|显著性[^。，！？；\n]{0,6}(?:不等于|不代表|并非))/;
const CONCEPT_EN = /\b(?:statistically\s+significant|statistical\s+significance|significance|significant|p-?value)\b[^.]{0,80}\b(?:does\s+not|doesn'?t|do\s+not|don'?t|cannot|can'?t|is\s+not|are\s+not|not\s+the\s+same\s+as|no\s+guarantee)\b[^.]{0,50}\b(?:mean|imply|tell|equal|equate|indicate|guarantee|matter|important|practical)\b/i;

// 工具 ─────────────────────────────────────────────────────────
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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|不再|别|并不|并没|从未|绝非|而非)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|谈不上|从不|绝不|永不|打死不|死活不|坚决不|并不|并没|而非|而不是|绝非|而非是)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s){0,4}$/i;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && !/别提多?$/.test(before) && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 推断标记存活判定：限定性前缀（只/仅/仅仅/不过/充其量；EN only/merely/
// just/simply）后面的「说明/so」不是推断而是限制——「p 值只说明差异不太
// 可能是噪声」是正当表述，不是把显著性当重要性。
const RESTRICTIVE_BEFORE = /(?:只|仅|仅仅|只不|不过|充其量|仅只|顶多)[^。，！？；\n]{0,3}$/;
const RESTRICTIVE_BEFORE_EN = /\b(?:only|merely|just|simply|at\s+most)\s+(?:\w+\s){0,3}$/i;
function inferAlive(text, x, R) {
  const rb = R.RESTRICTIVE_BEFORE || RESTRICTIVE_BEFORE;
  const rbe = R.RESTRICTIVE_BEFORE_EN || RESTRICTIVE_BEFORE_EN;
  if (rb.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (rb.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !rbe.test(beforeEn);
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

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

function collectTagged(text, groups, useNeg) {
  const out = [];
  for (const [tag, list] of Object.entries(groups)) {
    for (const x of collect(text, list, useNeg)) out.push(Object.assign({}, x, { tag }));
  }
  return dedupeOverlap(out);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 签名收集：腿①显著性陈述 × 腿②实质性裁定，两腿之间须见推断标记
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      sig: (R.SIG_ZH || SIG_ZH).concat(R.SIG_ZH3 || SIG_ZH3),
      verdicts: {
        importance: (R.IMPORTANCE_ZH || IMPORTANCE_ZH).concat(R.IMPORTANCE_ZH2 || IMPORTANCE_ZH2),
        superior: (R.SUPERIOR_ZH || SUPERIOR_ZH).concat(R.SUPERIOR_ZH3 || SUPERIOR_ZH3),
        scale: (R.SCALE_ZH || SCALE_ZH).concat(R.SCALE_ZH3 || SCALE_ZH3),
        magnitude: (R.MAGNITUDE_ZH || MAGNITUDE_ZH).concat(R.MAGNITUDE_ZH2 || MAGNITUDE_ZH2),
      },
      infer: R.INFER_ZH || INFER_ZH,
      w: R.W_ZH != null ? R.W_ZH : W_ZH,
      lang: 'zh',
    },
    {
      sig: (R.SIG_EN || SIG_EN).concat(R.SIG_EN3 || SIG_EN3),
      verdicts: {
        importance: (R.IMPORTANCE_EN || IMPORTANCE_EN).concat(R.IMPORTANCE_EN2 || IMPORTANCE_EN2),
        superior: (R.SUPERIOR_EN || SUPERIOR_EN).concat(R.SUPERIOR_EN3 || SUPERIOR_EN3),
        scale: R.SCALE_EN || SCALE_EN,
        magnitude: (R.MAGNITUDE_EN || MAGNITUDE_EN).concat(R.MAGNITUDE_EN2 || MAGNITUDE_EN2),
      },
      infer: R.INFER_EN || INFER_EN,
      w: R.W_EN != null ? R.W_EN : W_EN,
      lang: 'en',
    },
  ];
  for (const L of langs) {
    const sigM = collect(text, L.sig, true);
    if (sigM.length === 0) continue;
    const inferM = allMatches(L.infer, text).filter(x => inferAlive(text, x, R));
    const verdictM = collectTagged(text, L.verdicts, true);
    if (verdictM.length === 0) continue;
    for (const s of sigM) {
      for (const v of verdictM) {
        if (dist(s, v) > L.w) continue;
        // 推断标记须严格落在两腿之间（显著性在前或裁定在前均可）
        const between = inferM.find(x => (x.idx >= s.end && x.end <= v.idx) || (x.idx >= v.end && x.end <= s.idx));
        if (!between) continue;
        sigs.push({ lang: L.lang, kind: 'infer', sig: s.raw, verdict: v.raw, infer: between.raw });
      }
    }
  }
  return sigs;
}

/**
 * 显著性≠重要性签名：统计显著性陈述 × 实质性裁定 近距共现，且两腿之间
 * 见推断连接（重要性族允许贴身同位共现）。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectSignificanceEffectSize(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念教学（显著性与重要性的区别本身）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：给出效应量/置信区间/样本量的口径意识（正当做法）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'significance_effect_size',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '显著性陈述「' + x.sig + '」→ 实质性裁定「' + x.verdict + '」（推断标记「' + x.infer + '」）'
      : 'significance "' + x.sig + '" -> importance verdict "' + x.verdict + '" (via "' + x.infer + '")')),
    details: s.lang === 'zh'
      ? '显著性≠重要性(' + sigs.length + '处: 拿统计显著性「' + s.sig + '」直接推出实质性结论「' + s.verdict + '」，缺效应量/置信区间口径)(zh)'
      : 'significance-vs-effect-size(' + sigs.length + 'x: statistical significance "' + s.sig + '" used to conclude "' + s.verdict + '" without effect size/confidence interval)(en)',
    guidance: '显著性≠重要性指把统计显著性直接当成实质重要性——p 值过线只说明「差异不太可能是噪声」，不说明「差异大、有用、值得推广」：样本量足够大时，任何微不足道的差异都能显著。请补上效应口径再下结论：给出效应量与置信区间（d 值、均值差、区间宽窄）、说明样本量、把结论改成实际差异幅度（从 2% 降到 1.9% 而不是「降低一半」），或明确指出显著不等于重要。若这段话只是转述一次检验结果（p<0.05，差异存在），请把结论限定在「差异可检出」，不要外推到效应大小、方法优劣或是否值得推广。讨论显著性与效应量的区别、主动给出效应量和区间、说明显著性不等于重要性，都是正当做法；若这段话只是引用统计教学案例或他人的谬误示例，核实其主张再决定是否采信。',
    tags: ['statistics', 'statistical-literacy', 'significance-vs-effect-size', 'inference', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectSignificanceEffectSize,
  __internals: () => ({
    SIG_ZH, SIG_EN,
    IMPORTANCE_ZH, IMPORTANCE_EN,
    SUPERIOR_ZH, SUPERIOR_EN,
    SCALE_ZH, SCALE_EN,
    MAGNITUDE_ZH, MAGNITUDE_EN,
    MAGNITUDE_ZH2, MAGNITUDE_EN2,
    IMPORTANCE_ZH2, IMPORTANCE_EN2,
    // [r319] 踩线显著族 × 新裁定族（平行常量，负例注入-删条用）
    SIG_ZH3, SIG_EN3,
    SUPERIOR_ZH3, SUPERIOR_EN3,
    SCALE_ZH3,
    INFER_ZH, INFER_EN,
    W_ZH, W_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
  }),
};
