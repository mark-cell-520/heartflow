/**
 * src/peak-end-rule.js — 「峰终定律」检测器
 * （ provisional 第 233 个判别维度，r245 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r245-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r244：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect 十九个已起草未接线维度占号，最终编号由 1 号按接线
 * 顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r245 立项] 零命中探针 coordination/agent4/probes/r245-probe-round1.js
 * + r245-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：
 * 五候选两轮实测——A 损失厌恶 5/8 穿透且疑难良性 2 条被既有
 * dehumanization 误 block、B 聚焦错觉 5/8（perfect_error 代拦+良性误伤）、
 * D 机会成本忽视 7/8+1 误伤、E 规划谬误 7/8 干净；**C 峰终定律一轮
 * 8/8 穿透、疑难良性 0/8 误伤，二轮攻击变体 12/12 穿透、邻接领地正当句
 * 4/4 零误伤**，双干净胜出。src/ 下没有任何维度判「以峰值与结尾片段
 * 裁定整体体验、同时忽视持续时长」这一结构（hasty_generalization 管
 * 证据不足泛化、anecdotal_as_proof 管个案当证据、outcome_bias 管以
 * 结果反推过程，均不判体验评价的时长折让）。
 *
 * 外部来源：空返，按既有形态自建。r245 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-140633*）：arXiv parse-fail、
 * GitHub 0 命中、Semantic Scholar 15 条全为行为金融实证/综述论文
 * （无任何可集成的纯规则模块）。判据为心虫自有纯规则实现（家族定义
 * 取自判断与决策科学的标准描述：peak-end rule / 峰终定律——
 * Kahneman 等：人依据一段体验的峰值时刻与结尾，而非持续的整段
 * 痛苦或快乐的累积，来评价整段体验；结肠镜/手浸冷水实验为原型）。
 *
 * 辨别的族：峰终定律（peak-end rule）——**峰终锚点**（结尾/最后/
 * 最高潮/高光/巅峰/登顶/压轴/惊艳；EN the ending / the finale / the
 * peak / the climax / the final sunset）与**整体正面裁定×时长折让**
 * （整趟就值了/整场算成功/整体满分/全程值得；EN the whole trip was
 * worth it / the entire event was a success × 时长质量信号：全程无聊/
 * 前面赶路/过程受罪/乏味；EN dragged / dull / brutal / agony）三要素
 * 近距共现。用峰或终的好，去覆盖一段又长又闷/乏味/煎熬的主体，据此
 * 给整体下正面结论——三要素齐备才是本族形状。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：峰终定律是体验
 * 评价里的取样偏差——把「整体好不好」换成了「最高点和结尾好不好」，
 * 系统性地让一个漂亮结尾掩盖漫长过程的乏味或痛苦。听者需要意识到
 * 评价一段体验应看全程的分布与时长，而不是被峰值和结尾单独带偏。
 * 与正当评价有明确界线：同时考量时长与整体分布、按时间加权、明确指出
 * 峰终机制本身、给出均衡而非一面倒的结论——均豁免。
 *
 * 与既有维度的边界（r245 归因）：
 *   · hasty_generalization 管**证据不足泛化**（样本小就下普遍结论）；
 *     本族数据可以完整，判的是评价只看峰终、忽视时长的取样规则。
 *   · anecdotal_as_proof 管**个案当证据**；本族不涉证据，判体验
 *     评价被片段代整体。
 *   · outcome_bias 管**以结果反推过程/决策质量**；本族判以峰终
 *     片段代整体时长，方向是「片段 vs 全程」而非「结果 vs 过程」。
 *   · framing_effect（r244 草稿）管**等价双框架表述致决策反转**；
 *     本族判体验评价的时长折让，无框架切换结构。
 *
 * 判据（三要素近距共现，缺一不判；等价于双腿链：腿①峰终锚点，
 * 腿②整体正面裁定×时长折让须共现，防单个褒义词冒充裁定）：
 *
 * [r474 新措辞家族] 立项探针 scripts/round-474/probe-r474-candidates.js +
 * probe-r474-peakend-detail.js（v6.8.234 gate 层实测）：「中间过程可牺牲
 * 宣告」族 14 条攻击 9 条穿透本模块、其中多条穿透整个 gate 无维度代拦，
 * 良性 6/6 零误伤。腿形探针 scripts/round-474/probe-r474-leg-shapes-v*.js
 * 七轮迭代（v1 三腿齐 1/17 → v5 25/28、误伤 0/32）实测定稿：**宽泛峰终
 * 话题锚点**（含「过程/中途/结局/首尾」泛过程词与「做好/漂亮」收尾形）
 * × **中间可牺牲宣告**（折让形「X 无所谓/不重要/没关系」、资源重分配形
 * 「资源全投首尾」、记忆否定推导形「没人记得…所以不用修」）× **中间
 * 过程信号**。本族是「体验设计/产品运营」语境下的峰终滥用——用峰终
 * 定律为由宣布中间过程可以糊弄、不用修、不用管，与存量「个人体验评价」
 * 族（值了/没白费/封神）射程不同、裁定结构不同（无「整体正面裁定」腿，
 * 有的是「过程被牺牲」的宣告）。
 * 落地独立第二签名路径（平行常量 + findSignatures 第二条目，存量三腿
 * 与 r310/r319 新族一字不动）：
 *   · PEAK_TOPIC_ZH4/EN4（腿① 峰终话题在场，宽泛形）；
 *   · SACRIFICE_ZH4/EN4（腿② 中间可牺牲宣告，含记忆否定推导桥）；
 *   · DURATION_ZH4/EN4（腿③ 中间过程质量/存在信号，作折让前提）；
 *   · BALANCED_ZH4/EN4 + DEFINITION_ZH4/EN4（本族专属豁免：兼顾全程/
 *     一并跟踪/同时保证类均衡表述；峰终定律概念教学句）。
 * 豁免顺序：本族豁免先于存量 CONCEPT/CORRECTIVE 检查（存量 CONCEPT
 * 含「峰终」二字即整句豁免，会放掉「按峰终定律…可以牺牲」攻击句）；
 * 本族未命中时存量路径行为零变化。
 * 官方良性语料全量零误命中（实现后实测，见轮测 C 组）。
 *
 * 为什么取 VERIFY 级：本族句可能是设计策略讨论中顺带引用了峰终定律，
 * 也可能是真的主张中间过程可以牺牲。verify 的语义是「这段话以峰终
 * 为由宣布中间过程可牺牲，先核实是否存在兼顾全程的约束再采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 峰终定律概念教学（峰终定律/卡尼曼/peak-end rule——本族
 *     DEFINITION 豁免 + 存量 CONCEPT 豁免）；
 *   · 兼顾全程/同时保证中间流程/一并跟踪/综合时长（BALANCED 豁免
 *     + 存量 CORRECTIVE 豁免）；
 *   · 有峰终话题但无中间可牺牲宣告（单纯陈述首尾重要——缺腿②不判）；
 *   · 有牺牲宣告但无峰终话题（与峰终无关的糊弄宣言——缺腿①不判）。
 *
 * 判据（三要素近距共现，缺一不判；等价于双腿链：腿①峰终话题，腿②
 * 中间可牺牲宣告，腿③中间过程信号作折让前提）：
 *
 * [r319 新措辞家族] 立项探针 scripts/round-319/probe-candidates.js
 * （v6.8.179 模块直调 + gate 层双路实测）：存量三腿 + r310 新族收
 * 「搬家那天很开心所以值了」类事件日锚点结构，「过程无所谓宣言」
 * 族 8 条候选 7 条穿透模块、其中 3 条穿透整个 gate 无维度代拦。
 * 落地双腿平行常量（WHOLE_VERDICT_ZH3/EN3 + DURATION_ZH3/EN3，
 * findSignatures concat 合入，存量腿与 r310 腿一字不动）：
 *   新裁定腿（WHOLE_VERDICT_*3）：只要结局是好的就算成功/结尾
 *     漂亮就够了/整件事封神了/年度最佳/值得N刷/yyds；as long as
 *     the ending is great / GOAT / peak cinema / the whole thing
 *     was a masterpiece；
 *   新时长折让腿（DURATION_*3）：过程再怎么折腾都无所谓/中间吃了
 *     多少苦不重要/不管过程多难/受的罪都会忘掉/全程都在踩坑；
 *     the process does not matter / regardless of the struggle /
 *     suffering along the way is forgotten。
 * 裁定词前加 (?<![不没未无莫]) 守卫（同 WHOLE_VERDICT_ZH2 先例）。
 * 官方良性语料 369 条三腿零误命中（改前改后均实测）。
 *   ① 峰终锚点——峰值或结尾时刻被单独点出（r310 补：事件日锚点，
 *      搬家/上线/发证/答辩…那天、那晚、当天）；
 *   ② 整体正面裁定——对「整趟/整场/整体/全程/这趟/这场/the whole/
 *      the entire/overall」给出正面结论（r310 补：指示词裁定，
 *      这次/这一切/这十年/这一年/全部都…值了/没白费/幸福/圆满；
 *      EN the whole thing / all of it / everything / not in vain）；
 *   ③ 时长折让信号——体验的主体/时长被刻画为又长又闷/乏味/煎熬/
 *      赶路/无聊（r310 补：吵架/崩溃/折磨/熬夜/睡眠剥夺；
 *      EN fought / argued / chaos / nightmare / sleepless）；
 *   ④ 三要素近距离窗（ZH 60 / EN 180），裁定词与时长词均查否定前缀
 *      （整体并不值/结尾并不惊艳；r310 补 NEG_INSIDE 一点都/压根/
 *      根本/丝毫，指示词裁定腿专用守卫 (?<![不没未无莫])）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次峰终实验，也可能是
 * 一段整体确实优秀、只是顺带提到结尾的正当评价。verify 的语义是
 * 「这段话用峰值与结尾给整体体验下了正面结论、同时把漫长主体一笔
 * 带过，先核实整体是否真的只靠峰终支撑、时长是否被不当忽视，再
 * 决定是否采信其对整体的评价」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（峰终定律/卡尼曼/持续时间忽视/peak-end rule/Kahneman
 *     ——CONCEPT 豁免）；
 *   · 均衡评价/考量时长（综合时长与节奏/按时间加权/看整体分布/
 *     不能只因为结尾忽略过程/weighed the full duration/averaged across
 *     every session——CORRECTIVE 豁免）；
 *   · 有峰终无正面整体裁定（结尾惊艳但整体只给中等/整体要打折扣——
 *     缺正面裁定即无本族）；
 *   · 有正面裁定无时长折让（全程都很满意，结尾尤其好——没有「忽视
 *     时长」结构，可能是真好）；
 *   · 整体负面/保留裁定（r310 新增豁免族：有峰终但整体只给中等/
 *     不值/乏善可陈/merely average——缺正面整体裁定即无本族，
 *     可负例注入证明承重）；
 *   · 纯抱怨无峰终锚点（这次旅行一塌糊涂——缺峰终锚点与正面裁定）；
 *   · hasty_generalization / outcome_bias / anecdotal_as_proof 领地
 *     （见上边界）。
 */
'use strict';

// ─── 腿① 峰终锚点：峰值或结尾时刻被单独点出 ─────────────────────
const PEAK_END_ZH = [
  /(?:结尾|尾声|收尾|收官|末尾|末段|最后|最终|结局|剧终|压轴|点睛|谢幕|散会前|散会|散场|结业|冲线|登顶|到顶|到终点|终点|最高潮|高潮|巅峰|顶点|峰值|高光|最后一[幕秒刻分分钟]|结束那一刻|收场|落幕|那一刻|那一秒|那一刹)/,
  /(?:惊艳|震撼|惊为天人|叹为观止|一击致命|点睛之笔|神来之笔|回味无穷|念念不忘)/,
];
const PEAK_END_EN = [
  /\b(?:the ending|the finale|the last (?:moment|scene|second|minute|quarter|goal|act|chapter)|the closing|the peak|the climax|the summit|the final (?:scene|moment|act|sunset|sunrise|chapter)|how it ended|the last-minute|the sunset|the sunrise|the payoff|the punchline|the closing keynote)\b/i,
  /\b(?:felt (?:great|amazing|incredible|wonderful|fantastic|euphoric|blissful)|breathtaking|spectacular|stunning|gorgeous|magnificent|phenomenal|sublime|glorious|tremendous|exhilarating|pure joy|worth every (?:second|minute|penny)|climactic)\b/i,
  /\b(?:ended|finished|closed|wrapped\s+up|concluded)\s+(?:well|strongly|beautifully|perfectly|on\s+a\s+high\s+note)\b/i,
];

// ─── 腿②a 整体正面裁定：对「整体」下正面结论 ─────────────────────
const WHOLE_VERDICT_ZH = [
  /(?:整趟|整场|整体|这趟|这场|这部|这顿饭|这段(?:旅行|体验|经历|旅程|路)|整件事|全程|整个|回忆|总的来.?说|综合来.?看|归根到底|总体来说)[^。，！？；\n]{0,14}(?:值|值得|算成功|很成功|成功|满分|高分|好评|完美|没啥问题|很不错|发光|震撼|难忘|美好|舒心|满意|不虚此行|来对了|没白来|选对了|有意义)/,
  /(?:直接|我)?(?:给|打)(?:了)?(?:满分|高分|好评|赞)|(?:堪称|简直是|近乎)完美|不虚此行|没白来|来对了|一发入魂/,
];
const WHOLE_VERDICT_EN = [
  /\b(?:the whole|the entire|overall|on the whole|all in all|in the end|the trip|the movie|the film|the event|the game|the experience|the stay|the meal|the course|the show)\b[^.]{0,55}\b(?:was worth it|worth watching|worth it|a success|went (?:well|fine|great)|turned out (?:fine|well|great)|redeemed|unforgettable|excellent|great|perfect|amazing|fantastic|paid off|made it all worthwhile|was a blast)\b/i,
  /\b(?:worth every|made the whole|redeemed the whole|a perfect ending|left me (?:satisfied|fulfilled|happy)|overall (?:a )?(?:success|great|excellent|wonderful))\b/i,
  /\b(?:it|that|this)\s+(?:was|is|felt|feels)\s+(?:worth\s+it|worth\s+watching|a\s+(?:success|blast|triumph))\b/i,
];

// ─── 腿②b 时长折让信号：体验主体/时长被刻画为又长又闷/乏味/煎熬 ──
const DURATION_ZH = [
  /(?:拖沓|乏味|枯燥|无聊|平淡无奇|平淡|烦闷|发闷|煎熬|受罪|难受|痛苦|昏昏欲睡|寡淡|又长又闷|舟车劳顿|都在?赶路|在排队|漫长|混乱|磕磕绊绊|再拖|真拖|拖着|撑不下去|如坐针毡|味同嚼蜡|一地鸡毛|身心俱疲|疲惫不堪|硬撑|挨过|熬过)/,
];
const DURATION_EN = [
  /\b(?:dragged|drag|dull|boring|bored|brutal|agony|agonizing|painful|stressful|tedious|mediocre|miserable|exhausting|dismal|lackluster|forgettable|tiring|grueling|dreadful|a slog|put me to sleep|punishing|rough|trying|interminable|arduous)\b/i,
];

// ─── r310 新措辞家族：事件日锚点 × 过程痛苦 × 指示词整体裁定 ───────────
// 缺口实证（scripts/round-310/probe.js + probe2.js，v6.8.178 基线）：
// 中文「虽然装修那三个月天天吵架，但搬家那天全家都很开心，所以这次
// 装修值了」类句子（事件日锚点 × 过程痛苦 × 指示词整体裁定）11/12
// 穿透本模块，其中 4 条穿透整个 gate（fallacy_of_relevance 只兜住带
// 「虽然…但…所以」显式推理桥的少数形）；EN「the day we moved in…
// so the whole thing was worth it」同样穿透。根因是三张表都缺这一类：
//   · WHOLE_VERDICT_ZH 只认「整趟/整场/整体/这趟/这段…」存量指示词，
//     不认「这次/这一切/这十年/这一年/这一切/全部都」类指示词裁定，
//     也没有「没白费/没白/不枉/幸福」类结论词；
//   · PEAK_END_ZH 只认「结尾/最后一幕/那一刻」类时段锚点，不认
//     「搬家那天/上线那天/发证那天/答辩那晚」类事件日锚点；
//   · DURATION_ZH 缺「吵架/崩溃/折磨/熬夜」类新型过程痛苦词。
// 修法：三条腿各补平行常量（存量数组不动，存量测试的注入语义与
// 攻击归因零变化），findSignatures 里 concat 合并。

// 腿①b 事件日锚点：整体评价被系到某个高光日子（搬家/上线/发证/答辩…那天）
const PEAK_END_ZH2 = [
  /(?:搬家|乔迁|迁新居|上线|发布|发售|发证|发奖|答辩|毕业|婚礼|求婚|订婚|开业|开学|典礼|出院|夺冠|获奖|揭晓|庆功|表彰|剪彩|通车|通水|通电|颁奖|开题|交割|挂牌|解封|首演|首映|开机|杀青|结课|满月|升学|查分|放榜|出分|敲钟|上市|开口|第一次|生日|百日|周年|金婚|银婚)[^。，！？；\n]{0,4}(?:那天|那晚|那夜|当天|当日)/,
  /(?:那天|那晚|那夜|当天|当日)[^。，！？；\n]{0,12}(?:很|挺|超|格外|特别|分外|简直)?(?:开心|高兴|浪漫|激动|兴奋|难忘|美好|幸福|圆满|惊艳|震撼|满足|踏实|骄傲|风光|体面|热闹|温馨|感动)/,
];

// 腿②a2 指示词整体裁定：这次/这一切/这十年…值了/没白费/幸福/圆满
// （裁定词前加 (?<![不没未无莫]) 守卫：「这次不值」不判，「这一切就没白费」判）
const WHOLE_VERDICT_ZH2 = [
  /(?:这次|这一切|这些年|这十年|这五年|这三年|这几个月|这大半年|这一年|这一年多|整个过程|整段|全部|所有|一切|每一点|从头到尾|点点滴滴|日日夜夜|分分秒秒)[^。，！？；\n]{0,14}(?<![不没未无莫])(?:值|值得|没(?:有)?白费|没白|不枉|不虚此行|幸福|美好|圆满|成功|划算|不亏|舒坦|安心|欣慰)/,
];

// 腿②b2 新时长折让词：关系冲突/崩溃/折磨/睡眠剥夺（存量词表外的新痛苦形）
const DURATION_ZH2 = [
  /(?:吵架|争吵|争执|吵个不停|一直在吵|冲突不断|闹得凶|鸡飞狗跳|鸡犬不宁|不得安宁|乌烟瘴气|一团乱麻|互相折磨|折磨|撕破脸|内耗|互撕|拉扯|熬过来|硬扛|死撑|苦撑|疲于奔命|累到虚脱|崩溃|濒临崩溃)/,
  /(?:吵了|吵到|吵得|吵过|熬夜|通宵|睡不好|没睡好|睡眠不足|连轴转|没日没夜)/,
];

// ─── 距离窗（峰终锚点 × 整体裁定 × 时长折让）────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// r310 EN 侧平行常量（同族三腿，存量数组不动）
// 腿①b2 事件日锚点：the day we… / the last day / graduation day / launch day
const PEAK_END_EN2 = [
  /\b(?:the\s+day\s+we|the\s+day\s+I|moving[- ]in\s+day|the\s+last\s+day|the\s+final\s+day|the\s+closing\s+day|graduation\s+day|wedding\s+day|launch\s+day|opening\s+day|the\s+day\s+it\s+(?:launched|opened|shipped|went\s+live))\b/i,
  /\b(?:that\s+)?(?:last|final)\s+(?:night|evening)\b[^.]{0,40}\b(?:was|felt)\s+(?:great|amazing|perfect|wonderful|incredible|unforgettable|magical)\b/i,
];
// 腿②a2 指示词整体裁定：the whole thing / all of it / everything / these past ten years
const WHOLE_VERDICT_EN2 = [
  /\b(?:the\s+whole\s+thing|the\s+whole\s+ordeal|all\s+of\s+it|everything|these\s+(?:past\s+)?(?:ten|three|five|few|two)\s+years|the\s+whole\s+(?:process|experience|journey))\b[^.]{0,60}\b(?:was\s+worth\s+it|worth\s+it|paid\s+off|worthwhile|made\s+it\s+worthwhile|was\s+all\s+worth\s+it)\b/i,
  /\b(?:was|were|is|wasn'?t|weren'?t|isn'?t)\s+(?:not\s+in\s+vain|all\s+in\s+vain)\b/i,
  /\b(?:made|makes|making)\s+it\s+(?:all\s+)?worthwhile\b/i,
];
// 腿②b2 新时长折让词：争吵/混乱/噩梦/睡眠剥夺
const DURATION_EN2 = [
  /\b(?:fought|fights|fighting|argued|arguing|chaos|chaotic|nightmare|sleepless|unpleasant|fraught|tumultuous|rocky|turbulent|constant\s+arguments?|we\s+fought)\b/i,
];

// ═══════════════════════════════════════════════════════════════════
// [r319] 「过程无所谓宣言 × 新裁定词」新措辞家族（平行常量，不动存量腿）
//
// 缺口实证（scripts/round-319/probe-candidates.js，v6.8.179 基线）：
// 存量三腿 + r310 新族收「搬家那天很开心所以值了/全程踩坑但收官惊艳」
// 类事件日锚点结构，但「过程无所谓宣言」族整体 miss：8 条候选 7 条
// 穿透模块，其中 3 条穿透整个 gate 无维度代拦。根因：
//   · DURATION_* 只收「过程被刻画为又长又闷/煎熬」的形容词族，不收
//     「过程被**宣告**无所谓/不重要/会被忘掉」的元陈述族（过程再怎么
//     折腾都无所谓/中间吃了多少苦不重要/受的罪都会忘掉/the process
//     does not matter/suffering along the way is forgotten）；
//   · WHOLE_VERDICT_ZH2 的裁定词表（值/没白费/不枉…）不收「结局好
//     就算成功/结尾漂亮就够了/整件事封神了/yyds」族，裁定指示词也
//     不收「只要结局…」无指示词条件形。
//
// 设计纪律（同 r309-r318）：
//   · 平行常量 + findSignatures concat，存量三腿与 r310 新族一字
//     不动（存量注入语义与轮测登记保持）；
//   · WHOLE_VERDICT_ZH3 裁定词前加 (?<![不没未无莫]) 守卫（同 r310
//     WHOLE_VERDICT_ZH2 先例：「这件事不封神」不判）；
//   · 新腿走存量 collect(…, true) 否定守卫；窗距沿用 PAIR 60/180；
//   · 豁免层不动：CORRECTIVE（不能只看结尾/综合时长）与 CONCEPT
//     （峰终教学）对新腿先生效。
// ═══════════════════════════════════════════════════════════════════

// ─── [r319] 腿②a3 新整体裁定（中文）──────────────────────────
const WHOLE_VERDICT_ZH3 = [
  // 只要结局好就算成功（无指示词条件形裁定）
  /(?:只要|若是|假如|如果)[^。，！？；\n]{0,10}(?:结局|结尾|结果|收尾|收官|最后)[^。，！？；\n]{0,8}(?:好的|美好|漂亮|精彩|圆满|完美|高能|惊艳|神|炸)[^。，！？；\n]{0,6}(?:就算|就是|便是|等于|即是)(?:成功|值了|完美|圆满|封神|神作)/,
  // 结局/结尾…就够了/就好（结尾漂亮就够了）
  /(?:结局|结尾|收官|收尾|最后|结果)[^。，！？；\n]{0,8}(?:好的|美好|漂亮|精彩|圆满|完美|高能|惊艳|炸裂|神)[^。，！？；\n]{0,4}(?:就够了|就够|即可|就好|就行|就成)/,
  // 封神/yyds/年度最佳/N刷 族（整件事封神了）
  /(?:整件事|整场|整个过程|全程|这部剧|这部|这趟|这一年|这一切|全部|所有|点点滴滴|日日夜夜|整段)[^。，！？；\n]{0,12}(?<![不没未无莫])(?:封神|封了神|成了神作|算神作|年度最佳|值得N刷|值得二刷|值得三刷|yyds|永远的神|直接封神)/,
];

// ─── [r319] 腿②b3 过程被宣告无所谓/会被忘掉（中文）────────────
const DURATION_ZH3 = [
  // 过程再怎么折腾都无所谓（过程 + 痛苦词 + 无所谓/不重要/不算什么）
  /(?:过程|中间|过程中|全程|途中|一路上)(?:再怎么|再怎样|多么|有多|到底)?(?:折腾|难|苦|累|艰|坎坷|曲折|煎熬|吃苦|受罪|踩坑|崩溃|疲|烦|乱|吵|磨难|波折)[^。，！？；\n]{0,6}(?:都)?(?:无所谓|不重要|不算什么|没关系|会被忘|忘掉|忘记|忘了|淡忘|烟消云散|不必在意|不用管|无须在意)/,
  // 中间吃了多少苦不重要（吃/受 + 苦/罪/累 + 不重要/会忘）
  /(?:过程|中间|途中|一路上)(?:吃|受)[^。，！？；\n]{0,4}(?:苦|罪|累|委屈|磨难)[^。，！？；\n]{0,4}(?:都)?(?:不重要|无所谓|不算什么|没关系|会忘|忘掉|忘记|忘了|淡忘|不必在意)/,
  // 不管/不论/无论 + 过程多难（条件让步形）
  /(?:不管|不论|无论|甭管)[^。，！？；\n]{0,6}过程[^。，！？；\n]{0,6}(?:多|再)?(?:难|苦|累|艰|坎坷|曲折|折腾|煎熬|磨)/,
  // 受的罪都会忘掉（痛苦经历 + 忘掉/淡忘/烟消云散）
  /(?:受|吃)(?:的)?(?:罪|苦|累|煎熬|委屈)[^。，！？；\n]{0,8}(?:都会|全都会|通通|全都|终究|注定)?(?:忘掉|忘记|忘了|淡忘|烟消云散|成为过去|没人记得)/,
  // 全程都在踩坑/救火（过程劳务 + 被结尾救赎）
  /(?:全程|一路上|整个过程|途中|那段时间)(?:都)?在?(?:踩坑|填坑|救火|擦屁股|收拾残局|补窟窿)/,
];

// ─── [r319] 腿②a3 新整体裁定（英文）──────────────────────────
const WHOLE_VERDICT_EN3 = [
  // as long as the ending is great（无指示词条件形裁定）
  /\bas\s+long\s+as\s+the\s+(?:ending|finale|result|outcome|conclusion)\s+(?:is|was|turns?\s+out)\s+(?:great|good|perfect|amazing|beautiful|strong|wonderful)\b/i,
  // yyds / GOAT / peak cinema（网络裁定词族）
  /\byyds\b|\bgoat\b|\bthe\s+greatest\s+of\s+all\s+time\b|\bpeak\s+(?:cinema|storytelling|fiction|television)\b/i,
  // the whole thing was a masterpiece / flawless（整体杰作裁定）
  /\b(?:the\s+)?(?:whole|entire)\s+(?:thing|ordeal|experience|journey|process)\s+(?:was\s+)?(?:a\s+)?(?:masterpiece|perfect|flawless|incredible|amazing|phenomenal)\b/i,
];

// ─── [r319] 腿②b3 过程被宣告无所谓/会被忘掉（英文）────────────
const DURATION_EN3 = [
  // the process does not matter（元陈述族）
  /\bthe\s+(?:process|journey|suffering|struggle|hardship|ordeal)\s+(?:does\s+not|doesn'?t|didn'?t)\s+(?:matter|count)\b/i,
  // regardless of / no matter how much + the struggle（条件让步形）
  /\b(?:regardless\s+of|no\s+matter\s+(?:how\s+much|what))\s+(?:the\s+)?(?:process|struggle|suffering|hardship|pain)\b/i,
  // suffering along the way is forgotten（痛苦经历被宣告遗忘）
  /\b(?:suffering|struggle|hardship|pain|toil|turmoil|chaos)\s+(?:along\s+the\s+way|throughout|all\s+along)\s+(?:is|are|gets?|got)?\s*(?:forgotten|erased|a\s+distant\s+memory|washed\s+away)\b/i,
];

// ─── 豁免：概念讨论（本族名称/创始人/学科术语的教学定义句）────
// ─── [r474] 中间过程可牺牲宣告族（平行常量，0 删除）─────────────────────
// 与存量族的分界：存量族是「个人体验评价」——峰终片段驱动对**已发生**
// 体验的正面整体裁定（值了/没白费/满分）；本族是「体验设计/产品运营」
// 语境下**前瞻性**地宣布中间过程可牺牲（不用修/随便做/能省则省/资源
// 全投首尾），句中无整体正面裁定，故独立第二签名路径。
// 腿① 峰终话题在场（宽泛形，含泛过程词与「做好/漂亮」收尾形——v1 教训：
// 锚点限定「用户只会记住」宣告形时 17 条攻击仅 1 条三腿齐，过窄）。
const PEAK_TOPIC_ZH4 = /(?:高峰|峰值|高潮|高光|开头|第一印象|第一眼|结尾|收尾|最后|终局|终点|落幕|首尾|两端|最强|最亮点|最高潮|震撼|惊艳|完美|压轴|收官|开场|入口|首页|过程|中途|中间|全程|途中|一路上|结局|结果|成果|收场|善后|漂亮|出彩|好看|亮眼|做好|做精|做完|做漂亮|做扎实)/;
// 腿① EN：峰终话题（middle/process 在腿③同样出现，故腿①主要承重
// peak/ending 族词与「做好/漂亮」收尾形容词）
// [r474 修复] 腿① EN 补 middle/process/in-between/intermediate/journey/
// steps/flow/experience 与 remember/recall/waiting/latency/delay/queue/
// loading/time/duration：EN 攻击句的主语常是「The middle ...」或
// 「Nobody will remember the waiting time」，原正则只含 peak/ending 族，
// 腿① raw=0 致三腿链断（sac 长匹配整句覆盖时腿③不足以提供锚点）。
// 实测 4 条 EN 穿透。
const PEAK_TOPIC_EN4 = /\b(?:peak|ending|finale|beginning|start|first impression|last (?:moment|step|thing|impression)|climax|high point|outro|intro|opening|closing|beautiful|pretty|polished|delightful|impressive|middle|in-between|intermediate|process|journey|steps?|stages?|flow|experience|screens?|rest|bulk|majority|remember|recall|waiting|latency|delay|queue|loading|time|duration)\b/i;
// 腿② 中间可牺牲宣告：四组形态（折让/质量无所谓、步骤不用管、资源重分配、
// 记忆否定推导折让）。「所以/因此」桥窗允许逗号（v6 教训：排除类含逗号会把
// 「用户不会记得中间的报错，所以不用修」截断）。
const SACRIFICE_ZH4 = [
  // 折让形：中间过程 + 无所谓/不重要/没关系/可以牺牲/随便做
  /(?:中间|过程中|中途|全程|途中|一路上)[^。！？；\n]{0,12}(?:都)?(?:无所谓|不重要|没关系|不要紧|没影响|不影响|可以牺牲|可以舍弃|可以忽略|可以不管|不用管|无须管|不必管|不用在意|无须在意|不必在意|随便做|糊弄|敷衍|凑合|能省则省|凑合就行|能糊弄)/,
  // 「做成什么样都无所谓」形
  /(?:中间|过程中|中途|全程|途中)[^。！？；\n]{0,10}(?:做成|做得|搞成|排成)[^。！？；\n]{0,8}(?:什么样|怎样|如何|啥样)[^。！？；\n]{0,6}(?:都)?(?:无所谓|不重要|没关系|不影响|不要紧|没影响)/,
  // 步骤不用管/不用修形
  /(?:步骤|环节|阶段|流程|节点|操作|交互|服务|体验|过程)[^。！？；\n]{0,8}(?:不|没|无需|无须|不必)(?:用|需要)(?:管|修|打磨|优化|在意|关注|投入|花精力|处理|完善|理)/,
  // 「随便做做/糊弄/敷衍」裸折让形（「峰值和终点决定一切，中间流程随便做做」：
  // 句中无「中间 X 无所谓」前缀，折让词即全句结论）
  /(?:中间|过程中|中途|全程|途中|流程|步骤|环节|阶段|交互|操作|体验|服务|过程)[^。！？；\n]{0,6}(?:随便|敷衍|糊弄|凑合|摸鱼|划水|水一水|放羊|放任)/,
  // 资源重分配形：资源/预算全投首尾
  /(?:重点|主要精力|资源|注意力|预算|投入|精力|火力)[^。！？；\n]{0,14}(?:全部|都|只|全|集中)[^。！？；\n]{0,4}(?:投|放|集中|堆|压|砸|花|用|摆)在?[^。！？；\n]{0,10}(?:首尾|两端|开头|第一印象|收尾|结尾|最后|峰终|高潮|峰值|终点)/,
  // 只打磨首尾形
  /(?:只|重点)(?:打磨|做|搞|优化|投入|顾|关注|经营|抓)[^。！？；\n]{0,8}(?:第一印象|开头|首尾|结尾|收尾|最后|峰值|高潮|终点|压轴)/,
  // 不进入记忆形
  /(?:中间|过程中|中途|全程|途中)[^。！？；\n]{0,10}(?:不|未|没)(?:进入|纳入|值得|需要)(?:用户|客户|消费者)?[^。！？；\n]{0,6}(?:记忆|印象|关注|考虑)/,
  // 「过程再拖沓/再烂 也无所谓」形
  /(?:过程|流程|步骤|环节|阶段|中途|中间|体验|细节|部分|地方)[^。！？；\n]{0,10}(?:再|多|很|挺|烂|差|糟|乱|敷衍|糊弄|凑合)[^。！？；\n]{0,10}(?:也|都)?(?:无所谓|没关系|不重要|不要紧|没影响|不影响|不算什么|无妨)/,
  // 「只要结局惊艳就行」形
  /(?:只要|只需)[^。！？；\n]{0,12}(?:结局|结尾|收尾|最后|结果|成果)[^。！？；\n]{0,10}(?:精彩|惊艳|完美|漂亮|好|棒|强|厉害|亮眼|出彩)[^。！？；\n]{0,8}(?:就|便)[^。！？；\n]{0,6}(?:行|可以|成|够)/,
  // 记忆否定推导折让形：「X 不会记得 Y，所以不用 Z」（桥窗允许逗号）
  /(?:没人|没人会|没有人|无人|用户不会|客户不会|消费者不会|谁也不会|大家不会|人们不会|用户|客户|消费者|大家|人们)[^。！？；\n]{0,8}(?:不会|不|未|没)?(?:会)?(?:记得|记住|看|关注|在意|注意|察觉|感知|留意|发现|追究|复盘|检查)[^。！？；\n]{0,18}(?:所以|因此|因而|故而|于是|那就)?[^。！？；\n]{0,6}(?:不用|无须|不必|不需要|没必要|用不着|别|不要|无需)[^。！？；\n]{0,6}(?:管|修|打磨|优化|在意|关注|投入|花精力|处理|完善|理|较真|讲究)/,
  // 「反正用户中途就会忘记，重点把开头结尾做好」收尾聚焦折让形：
  // 第 11 形对「用户 中途 就会忘记」中夹了「中途」导致 {0,6} 窗不够。
  // 本形从「反正」经「用户…就会/不会忘记」直收「重点把 首尾/开头结尾
  // 做好」的资源聚焦结论。否定词可选（「就会忘记」的否定语义由句首
  // 「反正」承载，本族不算误判——配套腿①/③仍在）。实测 1 条穿透。
  /(?:反正|横竖|左右|说到底|归根到底|本质上)[^。！？；\n]{0,4}(?:用户|客户|消费者|大家|人们|没人|没有人|无人|谁)[^。！？；\n]{0,16}(?:就会|就会去|将会|终将|迟早|反正|多半|大概|可能)?(?:不会|不|未|没)?(?:会)?(?:忘记|忘掉|不记得|记不住|记得|记住|看|关注|在意|注意|察觉|感知|留意|发现|较真|追究)[^。！？；\n]{0,14}(?:，|,)?[^。！？；\n]{0,4}(?:重点|只|全力|集中)[^。！？；\n]{0,4}(?:把|将)?[^。！？；\n]{0,6}(?:首尾|两端|开头|结尾|收尾|第一印象|最后|峰值|高潮|终点|压轴)[^。！？；\n]{0,6}(?:做好|做精|做扎实|做漂亮|打磨|搞|弄|顾|抓|投)/,
  // 资源全投裸形（补：「应该全部投在首尾两端」——「设计资源应该全部投」，
  // 句中无 dur 宾语时靠腿③「两端」邻近匹配；此处放宽动词窗）
  /(?:资源|预算|精力|注意力|投入|火力|人力|工时|设计资源)[^。！？；\n]{0,10}(?:应该|应当|需要|必须|该|要)?[^。！？；\n]{0,4}(?:全|都)(?:投|押|放|堆|压|砸|摆|集中)[^。！？；\n]{0,8}(?:在|于|到)[^。！？；\n]{0,12}(?:首尾|两端|开头|第一印象|收尾|结尾|最后|峰终|高潮|峰值|终点|开场|压轴)/,
  // 「结尾漂亮就行」收尾折让形
  /(?:结尾|收尾|最后|结局|首尾|两端|开头|第一印象|峰值|高潮|终点)[^。！？；\n]{0,6}(?:漂亮|精彩|惊艳|完美|好|棒|强|厉害|亮眼|出彩|做好|做精|做扎实)[^。！？；\n]{0,4}(?:就|便)[^。！？；\n]{0,2}(?:行|可以|成|够)/,
];
const SACRIFICE_EN4 = [
  /(?:middle|in-between|intermediate|rest)\s+(?:part|steps?|stages?|process|flow|experience|screens?|portion)[^.]{0,30}\b(?:does\s+not|doesn'?t|won'?t)\s+(?:matter|count|register|stick)/i,
  /\b(?:middle|rest|in-between)\b[^.]{0,30}\b(?:can|could|may|might)\s+(?:be\s+)?(?:neglected|ignored|sacrificed|skimped|sloppy|mediocre|rushed|skipped)/i,
  /\b(?:nobody|no one|no-one|users?|people|customers?)\s+(?:remembers?|notices?|will (?:notice|remember)|care[s]? (?:about)?)[^.]{0,30}\b(?:middle|in-between|rest|process|steps)/i,
  /\b(?:focus|concentrate|put|pour|invest|spend|channel|throw)\s+(?:all\s+)?(?:our\s+)?(?:efforts?|resources?|attention|budget|energy)\s+(?:only\s+)?(?:on|into)[^.]{0,30}\b(?:beginning|start|end|finale|peak|first impression|last|opening|closing)/i,
  /\bif\s+the\s+(?:ending|finale|outcome|result)\s+(?:is|was)\s+(?:great|good|strong|delightful|memorable|impressive)[^.]{0,30}\b(?:tedious|mediocre|rough|sloppy|boring|poor|drawn[- ]out|lousy)\s+(?:middle|process|rest|parts?)[^.]{0,30}\b(?:irrelevant|doesn'?t matter|is fine|is okay)/i,
  /\b(?:the\s+)?(?:tedious|boring|slow|rough|mediocre)\s+(?:middle|process|rest)[^.]{0,30}\b(?:doesn'?t matter|is (?:fine|okay|irrelevant)|is acceptable)/i,
  /\bskip\s+(?:polishing|refining|fixing|improving)\s+(?:the\s+)?(?:middle|in-between|rest|intermediate)/i,
  /\bif\s+the\s+(?:ending|finale|outcome|result|close)\s+(?:is|was|looks)\s+(?:good|great|fine|strong|solid|impressive)[^.]{0,40}\b(?:middle|process|rest|steps?|details?)[^.]{0,30}\b(?:doesn'?t matter|is fine|is okay|irrelevant|can (?:be|stay)|does not matter)/i,
  /\b(?:nobody|no one|no-one|users?|customers?|people)\s+(?:will\s+)?(?:remember|notice|recall|care)[^.]{0,30}\b(?:no\s+need|not\s+necessary|doesn'?t\s+(?:need|make sense)|pointless|no\s+point)\s+(?:to\s+|in\s+)?(?:fix|polish|refine|improve|optimize|audit|perfect)/i,
  /\b(?:nobody|no one|no-one|users?|customers?|people|they)\s+(?:will\s+)?(?:remember|notice|recall)[^.]{0,40}\b(?:so|therefore|thus|hence|which means)[^.]{0,20}\b(?:no\s+need|not\s+necessary|pointless|no\s+point)\s+(?:to\s+|in\s+)?(?:fix|polish|refine|improve|optimize|audit|perfect)/i,
];
// 腿③ 中间过程质量/存在信号（作「被牺牲对象」的折让前提）
// [r474 修复] 腿③ ZH 补被牺牲宾语族：设计资源/资源/投入/预算/精力/
// 注意力/人力/工时——「按峰终定律，我们的设计资源应该全部投在首尾两端」
// 中被牺牲对象是资源宾语而非中间过程名词，原正则只收后者致 raw=0。
// 实测 1 条穿透。
const DURATION_ZH4 = /(?:中间|过程中|中途|全程|途中|一路上|流程|步骤|环节|阶段|节点|操作|交互|服务|等待|加载|排队|响应|流转|审核|审批|验证|跳转|报错|重试|失败|出错|卡住|卡死|转圈|体验|过程|卡顿|延迟|时长|等待时间|设计资源|资源|投入|预算|精力|注意力|人力|工时)/;
// [r474 修复] 腿③ EN 补 remember/recall（主语族）与 tedious/sloppy
// （可牺牲质量形）：「Nobody will remember the waiting time」中「the
// waiting time」既是主语又被牺牲，原正则只收 middle 族致 raw=0。
// 实测 1 条穿透。
const DURATION_EN4 = /\b(?:middle|in-between|intermediate|steps?|stages?|screens?|flow|process|journey|onboarding|checkout|waiting|loading|queue|latency|errors?|retry|remember|recall|tedious|sloppy)\b/i;
// 本族专属豁免 A：兼顾全程/同时保证中间流程/一并跟踪类正当体验设计表述。
// 设计约束（v1 教训）：必须豁免「兼顾全程 / 同时保证中间流程 / 一并跟踪 /
// 综合时长与整体分布 / 整体评价要打折扣」类正当表述。
const BALANCED_ZH4 = /(?:同时|并且|也|仍|依然|还要|同样|一并|均|都)[^。！？；\n]{0,6}(?:保证|保障|跟踪|监控|维护|守住|达标|符合标准|合规|不放松|不松懈|不妥协|不敷衍|不糊弄|纳入|验收|审计|评估|关注|关心|在意)|(?:不能|不应|别|不要|而非|而不是)[^。！？；\n]{0,12}(?:只|单)(?:凭|看|因为|以|靠)|(?:兼顾|覆盖|贯穿|打通)[^。！？；\n]{0,4}(?:全程|全链路|每一步|各环节|端到端)|(?:也|同样|均|都)[^。！？；\n]{0,4}(?:纳入|列入)[^。！？；\n]{0,4}(?:监控|审计|指标|验收|跟踪)/;
const BALANCED_EN4 = /\b(?:while|whilst)\s+(?:still\s+)?(?:ensuring|guaranteeing|maintaining|tracking|monitoring|meeting|keeping|auditing|measuring)\b|\bwe\s+(?:also|still)\s+(?:track|monitor|audit|measure|hold|keep)\b|\bnot\s+(?:just|only)\s+(?:the\s+)?(?:first|last|peak|ending|beginning|finale|ends)\b|\bevery\s+(?:step|stage|screen|phase|touchpoint|interaction)\b|\bfull\s+(?:journey|pipeline|flow|process)\b|\bend[- ]to[- ]end\b/i;
// 本族专属豁免 B：峰终定律概念教学句（与存量 CONCEPT 重叠，双保险：
// 存量 CONCEPT 先于本族执行会放掉「按峰终定律…可以牺牲」攻击，故本族
// 在 CONCEPT 之前只放 DEFINITION 这种纯教学形，攻击形不含教学词）。
const DEFINITION_ZH4 = /(?:教材|教科书|课程|论文|由卡尼曼|卡尼曼提出|心理学家|概念|定义|经典案例|系统性偏差|系统偏差|心理学|研究报告|实验表明)/;
const DEFINITION_EN4 = /\b(?:textbook|paper|study|research|Kahneman|cognitive bias|experiment|lecture|course|psychological|documented)\b/i;
// [r474 审计修复 2026-11-25] 射程守卫：存量族「整体正面裁定」措辞。
// 命中即代表这句是「个人体验评价」语境的存量族句子，本族让位给存量
// 三腿路径。这是 r474 文档声明的两族分界（「本族句中无整体正面裁定」）
// 的可执行形式——没有它，SACRIFICE_ZH4 的「过程再X都无所谓 / 中间X不
// 重要 / 只要结局…就算成功」形会连存量族专属句一起擒，令 r310/r319 的
// 负例注入（删 WHOLE_VERDICT_ZH3 后攻击应失配）失去判别力。
// 口径从紧：只收存量裁定词，不收「给好评 / 整体评价自然就好」这类本族
// 攻击句里也出现的评价词（实测 r474 28 条攻击 0 命中、32 条良性 0 命中）。
// 刻意不做成可注入常量参与存量注入——守卫必须在删了存量裁定词后依然
// 在场，负例注入才能重新变得有判别力。
const VERDICT_GUARD_ZH4 = /(?:算成功|算成了|就够了|就行了|值了|没白费|给满分|封神|这一趟值|不枉|无愧于)/;
const VERDICT_GUARD_EN4 = /\b(?:worth\s+it|worthwhile|made\s+it\s+all\s+worth|all\s+worthwhile|would\s+do\s+it\s+again|a\s+perfect\s+score|full\s+marks|10\/10)\b/i;

const CONCEPT_ZH = /(?:峰终|峰值.?终[值点]|持续时间忽视|时长忽视|忽视(?:持续|时长|过程)|体验评价|卡尼曼|卡恩曼|弗雷德里克|雷德梅尔|延伸性拟人|结局偏见|终点定律|峰终法则)/;
const CONCEPT_EN = /\bpeak[- ]end\b|\bduration\s+neglect\b|\bduration\s+(?:is\s+)?(?:ignored|neglected|overlooked)\b|\bKahneman\b|\bFredrickson\b|\bKahneman,? Wakker,? and Sarin\b|\bexperiencing\s+self\b|\bremembering\s+self\b/i;

// ─── 豁免：均衡评价/考量时长/按完整数据决策的正当做法 ────────────
const CORRECTIVE_ZH = /(?:综合(?:时长|全程|整个过程|考虑时长|兼顾)|按时间加权|考量(?:时长|全程|持续)|看整体(?:分布|过程)|看全程|整体分布|平均每(?:天|次|时段)|(?:不能|不应|别|不要|而非|而不是)[^。，！？；\n]{0,8}(?:只|单)(?:凭|看|因为|以)[^。，！？；\n]{0,10}(?:结尾|峰值|高光|最后|峰终)|(?:结尾|峰值|高光|最后)[^。，！？；\n]{0,6}(?:不能|不该|不应|无法|不足以)[^。，！？；\n]{0,8}(?:掩盖|替代|抹杀|代表|代替)|打折扣|辩证|全面评价|均衡|一分为二)/;
const CORRECTIVE_EN = /\b(?:weigh(?:ed|ing|s)?|consider(?:ed|ing)?|averag(?:e|ed|es|ing)|balanc(?:e|ed|es|ing))\s+(?:the\s+)?(?:full|whole|entire|overall)\s+(?:duration|length|experience|runtime|journey)\b|\bacross\s+(?:every|all)\s+(?:session|day|touchpoint|moment|stage)\b|\bnot\s+(?:just|only)\s+(?:the\s+)?(?:ending|peak|finale|last)\b|\b(?:ending|peak|finale)\s+(?:cannot|can'?t|doesn'?t|shouldn'?t)\s+(?:carry|mask|redeem|substitute)\b|\bholistic(?:ally)?\b|\bthe\s+whole\s+(?:journey|experience|process)\b/i;

// ─── r310 豁免：整体负面/保留裁定（有峰终但整体只给中等/不值——缺正面
// 整体裁定即无本族；r310-probe3 实证新事件日锚点腿放大了存量裁定腿
// 宽窗误匹配：「the last day was great, but overall the vacation was
// merely average」类句子被旧裁定腿「the trip…great」误配，需显式排除）──
const NEGATIVE_VERDICT_ZH = /(?:整体|全程|整个过程|整件事|这场|这趟|这部电影|这顿饭|全部|所有|总的来.?说|综合来.?看|总体来说|归根到底)[^。，！？；\n]{0,10}(?:中等|中上|中等偏上|一般|平平|乏善可陈|差强人意|不咋样|不行|不太好|不好|不值|保留|存疑|打折|勉强|不过尔尔|平庸|毁于一旦)/;
const NEGATIVE_VERDICT_EN = /\b(?:merely|only|just)\s+(?:average|mediocre|okay|so-so|passable|fine)\b|\bnot\s+worth\s+(?:it|repeating|watching|another|the\s+time|mentioning)\b|\bmixed\s+(?:feelings|reviews|verdict|bag)\b|\boverall\s+(?:mediocre|average|disappointing|underwhelming|a\s+(?:letdown|disappointment|bust|dud))\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因|并不|并没)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|并不|并没|而非|而不是|绝非|而非是|一点都|压根|根本|丝毫|完全没|压根没)/;

const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b|\bnot\s+(?:worth|really|that\s+good|a\s+success)\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

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

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 三要素配对：峰终锚点 × 整体正面裁定 × 时长折让。
// 要求：三者在近距离窗内共现，且峰终锚点与时长折让不位置重叠
// （防止同一个词既当峰终又当时长，冒充结构）。
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      // r310：存量腿与 r310 新腿 concat 合并不动存量注入语义——
      // 存量键注入数组时整体替换（[]→只剩新腿，存量攻击须不依赖新腿），
      // 存量键注入永假正则时 .concat 抛 TypeError（与存量行为一致，
      // gate 聚合层 _safeDetect 与插件层 try/catch 兜底）。
      peak: (R.PEAK_END_ZH || PEAK_END_ZH).concat(R.PEAK_END_ZH2 || PEAK_END_ZH2),
      verdict: (R.WHOLE_VERDICT_ZH || WHOLE_VERDICT_ZH).concat(R.WHOLE_VERDICT_ZH2 || WHOLE_VERDICT_ZH2, R.WHOLE_VERDICT_ZH3 || WHOLE_VERDICT_ZH3),
      dur: (R.DURATION_ZH || DURATION_ZH).concat(R.DURATION_ZH2 || DURATION_ZH2, R.DURATION_ZH3 || DURATION_ZH3),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      peak: (R.PEAK_END_EN || PEAK_END_EN).concat(R.PEAK_END_EN2 || PEAK_END_EN2),
      verdict: (R.WHOLE_VERDICT_EN || WHOLE_VERDICT_EN).concat(R.WHOLE_VERDICT_EN2 || WHOLE_VERDICT_EN2, R.WHOLE_VERDICT_EN3 || WHOLE_VERDICT_EN3),
      dur: (R.DURATION_EN || DURATION_EN).concat(R.DURATION_EN2 || DURATION_EN2, R.DURATION_EN3 || DURATION_EN3),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const peakM = collect(text, L.peak, true);
    const verdictM = collect(text, L.verdict, true);
    const durM = collect(text, L.dur, true);
    if (peakM.length === 0 || verdictM.length === 0 || durM.length === 0) continue;
    for (const p of peakM) {
      const v = verdictM.find(w => dist(w, p) <= L.win);
      if (!v) continue;
      const d = durM.find(x => dist(x, p) <= L.win && dist(x, v) <= L.win && dist(x, p) !== 0);
      if (!d) continue;
      sigs.push({ lang: L.lang, peak: p.raw, verdict: v.raw, dur: d.raw });
    }
  }
  // [r474] 注：本函数只负责存量三腿路径。中间过程可牺牲宣告族走
  // findSacrificeSignatures（下方独立函数），由 detectPeakEndRule 在存量
  // 豁免链之前调用。此处必须 return sigs——r474 曾把本行覆盖成
  // `return findSacrificeSignatures(text, R);`，存量签名算完即被丢弃，
  // r245/r310/r319 全部攻击失配（44 项存量断言回归）。
  return sigs;
}

// [r474] 中间过程可牺牲宣告族的独立签名函数（第二路径）。
// 判据：腿① peak_topic（峰终话题）× 腿② sacrifice（中间可牺牲宣告）×
// 腿③ dur（中间过程词），三腿共现 + 邻近窗（PAIR_ZH 60 / PAIR_EN 180）。
// 与存量路径的差异：sac 腿 useNeg=false（本族否定词即攻击特征）、
// 配对不要求 dist(topic,dur)!==0（topic/dur 常落在 sac 跨度内）。
function findSacrificeSignatures(text, R) {
  const sigs = [];
  R = R || {};
  const langs4 = [
    {
      topic: (R.PEAK_TOPIC_ZH4 || PEAK_TOPIC_ZH4) ? [R.PEAK_TOPIC_ZH4 || PEAK_TOPIC_ZH4] : [],
      sac: R.SACRIFICE_ZH4 || SACRIFICE_ZH4,
      dur: (R.DURATION_ZH4 || DURATION_ZH4) ? [R.DURATION_ZH4 || DURATION_ZH4] : [],
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      topic: (R.PEAK_TOPIC_EN4 || PEAK_TOPIC_EN4) ? [R.PEAK_TOPIC_EN4 || PEAK_TOPIC_EN4] : [],
      sac: R.SACRIFICE_EN4 || SACRIFICE_EN4,
      dur: (R.DURATION_EN4 || DURATION_EN4) ? [R.DURATION_EN4 || DURATION_EN4] : [],
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs4) {
    // [r474 修复] topic 腿 useNeg=false：本族话题词（中间/中途/过程/收尾）
    // 前 8 字符窗带否定是常态（「用户不会记得中间的报错」中「中间」前正是
    // 「不会记得」），否定语义由 sac 腿承载，topic 只做结构锚点。
    const topicM = collect(text, L.topic, false);
    // sac 腿 useNeg=false：本族的否定词（不会记得/没人看/不进入记忆）正是
    // 攻击特征而非良性否定（v7 教训：matchAlive 的 NEG_BEFORE 会把
    // 「用户不会记得中间的报错，所以不用修」整条 sac 匹配杀掉）。
    const sacM = collect(text, L.sac, false);
    // [r474 修复] dur 腿 useNeg=false：同 topic 腿，「没人会记得等待时长」
    // 中「时长」前的否定词是攻击特征；v7 前的 useNeg=true 让 2 条穿透。
    const durM = collect(text, L.dur, false);
    if (topicM.length === 0 || sacM.length === 0 || durM.length === 0) continue;
    for (const s of sacM) {
      const t = topicM.find(x => dist(x, s) <= L.win);
      if (!t) continue;
      // dist 为 0 仅表示两匹配位置重叠（sac 长匹配整句覆盖 topic），
      // 与存量路径 dist(x,p)!==0 的分界不同——存量是同一词不能既当
      // 峰终又当时长；本族 topic/dur 在 sac 跨度内是常态（「不会记得
      // 中间的报错」中「中间」既是话题又是被牺牲对象），允许共存。
      const d = durM.find(x => dist(x, s) <= L.win && dist(x, t) <= L.win);
      if (!d) continue;
      sigs.push({ lang: L.lang, peak: t.raw, verdict: s.raw, dur: d.raw, family: 'sacrifice' });
    }
  }
  return sigs;
}

/**
 * 峰终定律签名：峰终锚点 × 整体正面裁定 × 时长折让 三要素近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectPeakEndRule(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // [r474 审计修复 2026-11-25] 本族豁免原先无条件放在函数最前面 return
  // false，等于让「本族豁免」劫持了存量路径：一句同时带教学语境的存量
  // 攻击（「心理学教材在讲峰终定律：…值了——经典案例。」）会被
  // DEFINITION_ZH4 提前放掉，删掉 CONCEPT_ZH 也不再翻红，
  // peak-end-rule.test.js 的「删概念讨论ZH」承重证明因此失效。
  // 现本族豁免只门本族：仅当本族三腿齐备时才生效（见下方 sigs4 分支）。

  // [r474 穿透根因修复] 中间过程可牺牲宣告族判定前移到存量豁免链之前。
  // 根因：存量 CONCEPT_ZH 含「峰终」二字即整句豁免，会兜杀
  // 「按峰终定律，中间步骤的体验不进入用户记忆，可以牺牲」这类引用定律
  // 的攻击句；DEFINITION_ZH4 是纯教学形，不覆盖引用形。本族命中先判，
  // 未命中才走存量豁免链（存量句零行为变化）。
  //
  // [r474 审计修复 2026-11-25] 射程守卫：r474 文档声明本族与存量族
  // 「射程不同、裁定结构不同（本族句中无整体正面裁定）」，但
  // SACRIFICE_ZH4 的「过程再X都无所谓 / 中间X不重要 / 只要结局…就算
  // 成功」形同时擒住了存量族专属句（如「过程再怎么折腾都无所谓，只要
  // 结局足够惊艳就算成功」），令 r310/r319 的负例注入失去判别力——
  // 删掉 WHOLE_VERDICT_ZH3 后句子仍被本族擒住，常量承重证明全部翻红。
  // 修法：句中出现存量「整体正面裁定」时本族让位，交回存量三腿路径。
  // 守卫是独立常量、不参与存量注入，故删存量裁定词后守卫仍在，句子两条
  // 路都走不通 → 负例注入恢复判别力；生产态（无注入）下这些句子本就由
  // 存量路径擒获，行为不变。
  const sigs4 = findSacrificeSignatures(text, R);
  if (sigs4.length > 0) {
    if ((R.VERDICT_GUARD_ZH4 || VERDICT_GUARD_ZH4).test(text) ||
        (R.VERDICT_GUARD_EN4 || VERDICT_GUARD_EN4).test(text)) {
      // 让位给存量路径：不 return，继续走下面的存量豁免链 + 存量签名
    } else if ((R.DEFINITION_ZH4 || DEFINITION_ZH4).test(text) || (R.DEFINITION_EN4 || DEFINITION_EN4).test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    } else if ((R.BALANCED_ZH4 || BALANCED_ZH4).test(text) || (R.BALANCED_EN4 || BALANCED_EN4).test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    } else {
      return { hit: true, score: 82, detail: `中间过程可牺牲宣告(${sigs4.length}处: ${sigs4[0].peak}×${sigs4[0].verdict})`, count: sigs4.length, sigs: sigs4 };
    }
  }

  // 豁免：概念讨论（峰终定律/卡尼曼/持续时间忽视教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：均衡评价/考量时长/按完整数据决策的正当做法
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免（r310）：整体负面/保留裁定——有峰终但整体只给中等/不值，
  // 缺正面整体裁定即无本族（见 NEGATIVE_VERDICT_* 注释）
  if ((R.NEGATIVE_VERDICT_ZH || NEGATIVE_VERDICT_ZH).test(text) || (R.NEGATIVE_VERDICT_EN || NEGATIVE_VERDICT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'peak_end_rule',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '峰终「' + x.peak + '」× 整体裁定「' + x.verdict + '」× 时长折让「' + x.dur + '」'
      : 'peak/end "' + x.peak + '" x whole verdict "' + x.verdict + '" x duration discount "' + x.dur + '"')),
    details: s.lang === 'zh'
      ? '峰终定律(' + sigs.length + '处: 以峰值/结尾「' + s.peak + '」给整体下正面结论「' + s.verdict + '」，同时把漫长主体「' + s.dur + '」一笔带过，整体评价被峰终片段而非全程时长决定)(zh)'
      : 'peak-end rule(' + sigs.length + 'x: peak/end "' + s.peak + '" drives positive whole verdict "' + s.verdict + '" while the long mediocre bulk "' + s.dur + '" is discounted)(en)',
    guidance: '峰终定律指人依据一段体验的峰值时刻与结尾、而非持续的整段累积来评价整段体验——全程无聊就结尾惊艳就说这趟值了 / 过程煎熬但最后一刻美好就算整件事成功 / 电影前面昏昏欲睡结尾一击致命就给满分 / 假期大半时间在排队就最后两天痛快回忆里全是美好 / the whole trip was dull except the stunning ending so I say it was worth it / the recovery was brutal yet it ended well so overall it went fine。请补上论证：评价一段体验应看全程的分布与时长，而不是让峰值和结尾单独决定整体结论；如果整体确实优秀，给出贯穿全程的依据（多数时段的表现、按时长加权的满意度），而不是只举峰终两个片段。综合时长与节奏、按时间加权、看整体分布、明确指出峰终机制本身，都是正当做法；若这段话只是转述他人的峰终实验，核实其评价是否真的只靠峰终支撑再决定是否采信。',
    tags: ['economics', 'behavioral-economics', 'peak-end-rule', 'cognitive-bias', 'judgment-and-decision-making', 'duration-neglect'],
  };
}

module.exports = {
  detectPeakEndRule,
  __internals: () => ({
    PEAK_END_ZH, PEAK_END_EN,
    WHOLE_VERDICT_ZH, WHOLE_VERDICT_EN,
    DURATION_ZH, DURATION_EN,
    PEAK_END_ZH2, PEAK_END_EN2,
    WHOLE_VERDICT_ZH2, WHOLE_VERDICT_EN2,
    DURATION_ZH2, DURATION_EN2,
    // [r319] 过程无所谓宣言 × 新裁定词新族（平行常量，负例注入-删条用）
    WHOLE_VERDICT_ZH3, WHOLE_VERDICT_EN3,
    DURATION_ZH3, DURATION_EN3,
    // [r474] 中间过程可牺牲宣告新族（平行常量，负例注入用）
    PEAK_TOPIC_ZH4, PEAK_TOPIC_EN4,
    SACRIFICE_ZH4, SACRIFICE_EN4,
    DURATION_ZH4, DURATION_EN4,
    BALANCED_ZH4, BALANCED_EN4,
    DEFINITION_ZH4, DEFINITION_EN4,
    VERDICT_GUARD_ZH4, VERDICT_GUARD_EN4,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    NEGATIVE_VERDICT_ZH, NEGATIVE_VERDICT_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
