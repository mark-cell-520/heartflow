/**
 * src/present-bias.js — 「现时偏差（双曲贴现）」检测器
 * （ provisional 第 231 个判别维度，r243 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r243-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r242：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/winners_curse(r237)/tragedy_of_commons(r238)/
 * illusion_of_control(r239)/disposition_effect(r240)/
 * endowment_effect(r241)/anchoring_effect(r242) 十七个已起草未接线
 * 维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r243 立项] 零命中探针 coordination/agent4/probes/r243-probe-round1.js
 * + r243-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：
 * 五候选两轮实测——B 现时偏差一轮 0/7、二轮 1/7 穿透（唯一代拦为
 * 既有 substance_coercion 对「这根烟」自述句的通病代拦，无任何维度
 * 以「现在即时满足×未来代价推迟贴现」语义承重）；A 诱饵效应 2/15、
 * C 号角效应 4/14（perfect_error/hasty_generalization 偶发代拦）、
 * D 确认偏误 3/6（reasoning_coherence/perfect_error 结构性代拦）、
 * E 复杂问语 5/7 已被 presupposition 维度结构覆盖。疑难良性两轮
 * 20/20 零误伤（唯二误伤均为既有泛维度 absolute_claim/vagueness
 * 的通病，与本族无关）。src/ 下没有任何维度判「系统性地把未来
 * 代价推迟并贴现、以现在即时满足为优先」这一结构。
 *
 * 外部来源：空返，按既有形态自建。r243 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-102933* 与 *20261107-102947*）：
 * arXiv 两次 parse-fail（OR 噪声化）、GitHub 两次 0 命中、
 * Semantic Scholar 两次 429 限流。判据为心虫自有纯规则实现（家族
 * 定义取自行为经济学/判断与决策科学的标准描述：present bias /
 * 现时偏差/双曲贴现——Thaler & Shefrin 1981、Laibson 1997：
 * 人们对即时效用赋予不成比例的权重，系统性地过度贴现未来的收益
 * 与代价，「现在的快乐现在就拿到，以后的事以后再说」；明知未来
 * 代价仍然选择即时满足。逻辑上，未来自己的健康、债务、责任与
 * 现在的自己是同一个主体，时间距离不改变后果的归属，「打八折
 * 的未来」不是削减代价而是拒绝承认代价）。
 *
 * [r314 新措辞家族] 立项探针 scripts/round-314/probe-candidates.js
 * （v6.8.178 模块直调 + gate 层双路实测）：存量 NOW/LATER 四族
 * 只收「痛快吃了/以后再说」标准双曲贴现措辞，25 条日常拖延-
 * 即时满足候选 20 条穿透模块、gate 层 20/25 pass 无维度代拦。
 * 落地三组平行腿（NOW_ZH2/NOW_EN2/LATER_ZH2/LATER_EN2，findSignatures
 * concat 合入，存量腿一字不动）：
 *   拖延许可腿（LATER_ZH2/LATER_EN2）：下次一定/改天再说/过几天
 *     再说/晚点再说/等双十一买完再开始/过完这阵再说/到时候再说/
 *     I'll start tomorrow/starting Monday/next time for sure/
 *     I'll save after/who cares what happens tomorrow；
 *   活在当下宣言腿（NOW_ZH2/NOW_EN2）：今朝有酒今朝醉/能玩一天
 *     是一天/趁还年轻及时行乐/先舒服了再说/YOLO/you only live
 *     once/live for today/seize the day/might as well enjoy/
 *     this weekend…party；
 *   未来自我料理腿（LATER_ZH2/LATER_EN2）：车到桥头自然直/船到
 *     桥头自然直/相信后人的智慧/儿孙自有儿孙福/we'll cross that
 *     bridge when we come to it/my future self can handle。
 * 三类结构同一语义换皮：未来代价整体外包（再说/后人/桥头）× 当下
 * 满足许可证开到最大（一天是一天/及时行乐/only live once）。
 * 官方良性语料 369 条（gate-97 97 + extended 97 + vertical 150 +
 * mixed 25，四文件分计）两腿零误命中；存量豁免（CORRECTIVE 先完成
 * 再玩/CONCEPT 双曲贴现教学）对新腿先生效，无需扩表。
 *
 * 辨别的族：现时偏差（present bias / 双曲贴现 hyperbolic
 * discounting）——**现在即时满足**（今晚先痛快吃了/凌晨的快乐是
 * 现在就有的/先刷卡住进想要的房子；EN the pleasure is right here
 * today / I want it now / be happy today）与**未来代价被推迟或
 * 贴现**（体检以后再说/谁管明天怎么样/还款是未来自己的问题；
 * EN saving is for later / future me can deal / the future is a
 * discount away / it will hurt me later）共现。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：涉及跨期选择的
 * 陈述里，现在与未来的自己是同一个责任主体。现时偏差把「未来的
 * 代价」偷换成「别人的事」——推迟（以后再说/明天再说/忍到开学
 * 再说）与贴现（未来的健康打八折/谁管明天）都是拒绝为已知后果
 * 承担责任的话语结构。与正当表述有明确界线：把大目标拆成今天
 * 就能完成的小步、固定周期储蓄/运动/体检、截止日期前提前动手、
 * 今日事今日毕、先完成再奖励、明确承认拖延代价并马上行动、
 * 或引用本族名称的教学句——均豁免。
 *
 * 与既有维度的边界（r243 归因）：
 *   · sunk_cost_coercion（第 98 维）管**已投入→退出羞耻**（钱都
 *     花了所以用完）；本族方向相反——判**未来代价→现在贴现**，
 *     无已投入计量，「已经投了两百万不能停」不命中。
 *   · affective_forecast 管**误判未来情绪状态**（低估自己的适应
 *     力）；本族不预测情绪，判跨期选择的时间贴现失衡。
 *   · wishful_thinking（第 147 维）管**一厢情愿相信想要的结果**；
 *     本族不涉愿望成真，判现在-未来的权重失衡。
 *   · future_faking 管**虚假未来承诺操纵他人**；本族是自我
 *     导向的贴现结构，无对他人的承诺操纵。
 *   · appeal_to_future（r233 草稿）管**把价值寄托于未来版本**
 *     （以后会更好的/未来会证明）；本族判未来被**贬值/推迟**，
 *     方向相反，「现在忍一忍，明年一定暴富」不命中。
 *   · mental_accounting（r235 草稿）管**资金来源标签→消费许可**
 *     （年终奖花着不心疼）；本族判时间贴现，无来源标签腿。
 *   · substance_coercion 管**成瘾物质相关胁迫**；本族判一般
 *     跨期贴现，「这根烟先抽完」若同时有成瘾胁迫结构由该维度
 *     承重，本族作为时间贴现结构独立成立。
 *
 * 判据（双腿链共现，缺一不判）：
 *   ① 腿① NOW 现在即时满足——时间现在词邻接满足动词（今晚/今天/
 *      现在/眼前/当下/此刻/眼下/今朝 + 痛快/爽/享受/玩/开黑/刷/
 *      吃/喝/买/刷卡/躺/摆烂/摸鱼…）、「先+满足动词」结构（先痛快
 *      吃了/先抽完/先刷卡）、满足名词+是+现在结构（快乐是现在就
 *      有的/爽是今天的/快感现在就能拿到）；EN right now/today/
 *      tonight + enjoy/pleasure/happy…、want it now、the pleasure
 *      is right here today；
 *   ② 腿② LATER 未来代价被推迟或贴现——以后再说/明天再说/忍到
 *      开学再说/从下周开始、谁管明天/未来…打八折/是以后的事/
 *      还款是未来的问题、慢慢还/往后熬；EN for later / future
 *      me / deal with it later / can wait / will hurt me later /
 *      the future is a discount away；
 *   ③ 腿①×腿②近距离窗（ZH 60 / EN 180），双腿均查否定前缀
 *      （并不是现在就该享受/不会再说明天再说/not because I want
 *      it now）。
 *
 * 为什么取 VERIFY 级：单句可能只是转述一次拖延/即时消费而未展开
 * 跨期论证，也可能是当事人已经知道代价、尚未形成决策。verify 的
 * 语义是「这段话把未来代价推迟或贴现、以现在即时满足为优先，先
 * 核实未来后果是否已被严肃对待（具体计划/固定储蓄/提前动手），
 * 再决定是否采信其选择」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 正确跨期计划（拆成小步/每月固定存/截止前提前动手/今日事
 *     今日毕/先完成再玩/commit early/reward after milestone/
 *     small steps/self-control——CORRECTIVE 豁免）；
 *   · 概念教学（现时偏差/双曲贴现/延迟折扣/跨期选择/present
 *     bias/hyperbolic discounting/Laibson——CONCEPT 豁免）；
 *   · 单腿陈述（只「今晚先痛快」无未来贴现腿、只「以后再说」
 *     无现在满足腿——缺一共现即无族形状）；
 *   · 否定纠偏（并不是现在就该享受/不再说明天再说/不会不管以后）；
 *   · sunk_cost_coercion/affective_forecast/wishful_thinking/
 *     appeal_to_future/mental_accounting 领地（见上边界）。
 */
'use strict';

// ─── 腿① 现在即时满足（中文）──────────────────────────────────
const NOW_ZH = [
  // 时间现在词 + 满足动词（窗内 14 字符）
  /(?:今晚|今夜|今天|如今|现在|当前|眼前|当下|此刻|眼下|时下|今朝)[^。，！？；\n]{0,8}(?:先|就|只|且|只管|尽情|痛痛快快|赶紧|马上)?[^。，！？；\n]{0,6}(痛快|爽|享乐|享受|开心|快乐|放松|躺|摆烂|刷|玩|开黑|打游戏|吃|喝|抽|买|刷卡|住|乐|嗨|浪|耍|摸鱼|划水|火锅|奶茶|烟|酒|度假|旅行|氪金|追剧|熬夜)/,
  // 「先 + 满足动词」结构（先痛快吃了/先抽完/先刷卡/先玩一把）
  /先(?:痛快|爽快|享受|享乐|开心|放松|躺|摆烂|刷|玩|吃|喝|抽|买|住|乐|嗨|浪|耍|刷卡|开黑|摸鱼|氪金)(?:了|完|一把|一顿|一局|一天|一夜|一回)?(?:吧|再说|了|去)?/,
  // 「先把/将 + 短修饰 + 满足名词」结构（先把这局游戏打完/先追两集剧）
  /先(?:把|将)?[^。，！？；\n]{0,4}(?:游戏|开黑|刷剧|追剧|剧|视频|直播|玩|喝|吃|抽|买|躺|摆烂|摸鱼|痛快|爽|享受|放松|乐|嗨|浪|耍)(?:了|完|一把|一顿|一局|一天|一夜|一回)?(?:吧|再说|了|去)?/,
  // 满足名词 + 是/在 + 现在结构（快乐是现在就有的/爽是今天的）
  /(?:快感|爽感|快乐|满足|享受|乐趣|痛快|爽)(?:都)?(?:是|在|就在)(?:现在|当下|今天|眼前|此刻)(?:的|这|上)?/,
  // 满足名词 + 现在 + 就能拿到（这根烟的快感现在就能拿到）
  /(?:快感|爽感|快乐|满足|享受|乐趣)[^。，！？；\n]{0,6}(?:现在|当下|今天|眼前)[^。，！？；\n]{0,4}(?:就)?(?:能|可以|马上|立刻)?(?:拿到|得到|有|享受|开始|兑现)/,
];

// ─── 腿① 现在即时满足（英文）──────────────────────────────────
const NOW_EN = [
  /\b(?:right\s+now|today|tonight|this\s+(?:moment|instant)|for\s+now|at\s+the\s+moment)\b[^.]{0,50}\b(?:enjoy|pleasure|happy|happiness|fun|satisf|indulge|treat|relax|reward|feel\s+good|good\s+time|blast|party|spend|buy|order|eat|drink|smoke|play|game|stream|watch|rest)/i,
  /\b(?:want|need|crave|deserve|gotta|got\s+to|going\s+to)\s+(?:it|this|that|them|some|one)?\s*(?:right\s+)?now\b/i,
  /\b(?:pleasure|joy|fun|satisfaction|thrill|kick)\s+(?:is|feels)\s+(?:right\s+)?(?:here|now|today|immediate)/i,
  /\b(?:be\s+)?(?:happy|enjoy|feel\s+good|have\s+fun)\s+(?:today|right\s+now|tonight|for\s+now)\b/i,
];

// ─── 腿② 未来代价被推迟或贴现（中文）──────────────────────────
const LATER_ZH = [
  // 以后/明天/下周 + 再说类（体检以后再说/明天再说/忍到开学再说/从下周开始）
  /(?:从|等|挨|忍|拖|扛|熬|搁|放)?到?(?:明天|下周|下个月|明年|来年|以后|将来|日后|往后|开学|周末|年底|长假|放假)(?:再)?(?:说|讲|管|弄|办|看|治|修|补|还|开始|努力|攒|存|戒|复习|体检|面对|处理|考虑|想办法)/,
  // 谁管明天/谁管以后（谁管明天怎么样）
  /谁管(?:明天|以后|将来|未来|日后|往后)(?:怎么样|咋样|如何|是啥样|的死活|的事)?/,
  // 未来名词 + 打折/不算数/贬值（未来的健康打八折）
  /(?:未来|将来|以后|今后)(?:的)?[^。，！？；\n]{0,6}(?:打|都打|打个)(?:八|七|六|五|四|三|两|一)?折/,
  /(?:未来|将来|以后|今后)(?:的)?(?:健康|身体|钱|债|房贷|款|后果|代价|麻烦|问题|责任|压力)(?:都)?(?:不算数|不算|打折扣|打了折|贬值|缩水|不管|别管|以后说|以后再说|是以后的事|是未来的事|是以后的问题)/,
  // 是…以后/未来…的事/问题（是以后的事/还款是未来自己的问题）
  /(?:是|都是|就成了)(?:几十|几|多少)?(?:年|月|天|周)?(?:后|以后)(?:的)?(?:事|问题)/,
  /(?:是|都是|就成了)(?:以后|未来|将来|日后)(?:自己|我|咱们|我们)?(?:的)?(?:事|问题|麻烦|债|坑|锅|责任)/,
  // 慢慢还/往后熬（房贷三十年慢慢还）
  /(?:慢慢|将就|凑合|往后|今后|以后)(?:还|熬|扛|顶|拖|混|过|挨)/,
];

// ─── 腿② 未来代价被推迟或贴现（英文）──────────────────────────
const LATER_EN = [
  /\bfor\s+later\b/i,                                                    // saving is for later
  /\bfuture\s+(?:me|self|version)\b/i,                                   // future me can deal
  /\b(?:deal|handle|figure|worry|sort|take\s+care|catch\s+up)\s+(?:with\s+)?(?:it|that|this|things)?\s*(?:out\s+)?(?:later|tomorrow|another\s+day|next\s+time)/i,
  /\b(?:hurt|harm|damage|cost)\s+(?:me|us|you|them|him|her)\s+(?:later|tomorrow|eventually|down\s+the\s+road|in\s+the\s+long\s+run)/i,
  /\bfuture\b[^.]{0,30}\bdiscount/i,                                     // the future is a discount away
  /\b(?:not|isn'?t|is\s+not)\s+(?:my|our|your|his|her)\s+(?:problem|concern|priority)\s+(?:yet|now|today|right\s+now|for\s+now)/i,
  /\bcan\s+wait\b/i,                                                     // the future can wait
  /\b(?:tomorrow|next\s+(?:week|month|year)|another\s+day)\s+(?:me|version|will\s+deal|can\s+wait)\b/i,
  // 未来任务被推迟（deadline is next week / the bill is due tomorrow）
  /\b(?:deadline|due|bill|exam|test|paper|project|assignment|rent|loan|taxes?)\s+(?:is\s+|comes?\s+|falls?\s+)?(?:next\s+(?:week|month|year)|tomorrow|later|soon)\b/i,
  /\b(?:几十|many)\s+years\s+from\s+now\b/i,
];

// ═══════════════════════════════════════════════════════════════════
// [r314] 「拖延许可 × 活在当下宣言」新措辞家族（平行常量，不并入存量腿）
//
// 缺口实证（scripts/round-314/probe-candidates.js，v6.8.178 模块直调）：
// 存量 NOW/LATER 四族只收「痛快吃了/以后再说」这类标准双曲贴现措辞，
// 三类日常拖延-即时满足结构整体 miss（25 条候选 20 条穿透模块、
// gate 层 20/25 pass 无任何维度代拦）：
//   拖延许可腿：下次一定/改天再说/过几天再说/等双十一买完再开始/
//               年后再说/过完这阵再说/到时候再说
//   活在当下宣言腿：今朝有酒今朝醉/能玩一天是一天/趁年轻及时行乐/
//                   YOLO/you only live once/live for today/
//                   starting Monday/I'll start tomorrow
//   未来自我料理腿：车到桥头自然直/相信后人的智慧/儿孙自有儿孙福/
//                   we'll cross that bridge when we come to it
// 这三类结构都是同一语义的换皮：把未来代价整体外包（再说/后人/桥头），
// 把当下满足许可证开到最大（一天是一天/及时行乐/only live once）。
//
// 设计纪律（同 r309/r310/r311）：
//   · **平行常量 + findSignatures concat**，存量 NOW_ZH/NOW_EN/
//     LATER_ZH/LATER_EN 一字不动（存量注入语义与轮测登记保持）；
//   · 新腿一律走存量 matchAlive 否定守卫（下次一定 not because…）；
//   · 窗距沿用存量 PAIR_ZH 60 / PAIR_EN 180；
//   · 豁免层不动：CORRECTIVE（先完成再玩）与 CONCEPT（双曲贴现教学）
//     对新腿同样先生效。
// ═══════════════════════════════════════════════════════════════════

// ─── [r314] 腿① 活在当下宣言（中文）──────────────────────────────
// 瘦身纪律：候选「今朝有酒今朝醉」谚语形被存量 NOW_ZH 正则①
// （时间词+≤8字+享乐动词，「今朝有酒」的酒即在动词表内）代拦，
// 整元素删除；保留四个承重元素。
const NOW_ZH2 = [
  // 「X一天是一天」族（能玩一天是一天/开心一天是一天/活一天是一天/混一天是一天）
  /(?:玩|开心|快活|乐|享乐|享受|活|过|混|熬|潇洒)[^。，！？；\n]{0,6}一天是一天/,
  // 趁现在/趁年轻/趁来得及 + 及时行乐团（趁还年轻及时行乐/趁现在活得痛快）
  /趁[^。，！？；\n]{0,8}(?:及时行乐|活得痛快|好好享受|先享受|玩个痛快|使劲玩|多吃点|多玩点|该享受|享受一|放纵一|潇洒一)/,
  // 先舒服/先快活/先自在/先惬意/先犒劳（存量动词表未收「舒服/快活/自在/惬意/乐呵/犒劳」；
  // 无主语前缀形，与下条「时间词+先…」窗口形分工）
  /先(?:舒服|快活|自在|惬意|乐呵|犒劳|奖赏|款待|瘫一|躺平一|享受一|痛快一)(?:了|一把|一回|一天|一晚|一顿|一下)?(?:吧|再说|去)?/,
  // 现在/眼前 + 先自己舒服/先惬意着（带主语前缀的窗口形）
  /(?:现在|当下|眼前|此刻|眼下)[^。，！？；\n]{0,6}先(?:自己|咱|咱们)?(?:舒服|快活|自在|惬意|犒劳)(?:了|着|一把|一下)?/,
];

// ─── [r314] 腿② 拖延许可/未来外包（中文）────────────────────────
const LATER_ZH2 = [
  // 拖延口头禅「动词版」：今后再开始/往后再存/日后再说（时间词+再/又+动词）
  /(?:下次|下回|今后|往后|日后|年后|年中)(?:再|又)(?:说|讲|开始|弄|办|搞|做|干|整|补|修|还|存|攒|戒|努力|减肥|学习|锻炼|体检|面对|处理|考虑|想办法|安排|计划|买|换|改|调整)/,
  // 拖延口头禅「光秃版」：下次一定/下个月一定/改天再说/过几天再说/晚点再说
  /(?:下次|下回|下个月|下周|明年|来年|改天|过几天|过两天|晚点|迟点)(?:一定|定然|肯定|再说|再讲)/,
  // 等/挨/熬/忙/过 X 再 Y 族（等双十一买完再开始/过完这阵再说/忙完这阵再说/熬到年底再说）
  /(?:等|挨|拖|熬|扛|忙|过)(?:到|过|完)?[^。，！？；\n]{0,8}(?:再|之后|过后)(?:说|讲|开始|弄|办|搞|做|干|整|补|修|还|存|攒|戒|努力|减肥|学习|锻炼|体检|面对|处理|考虑|想办法|安排|计划|买|换|改|调整)/,
  // 车到桥头自然直/船到桥头自然直/车到山前必有路（未来自理会）
  /(?:车|船)(?:到|至)(?:桥头|山前)(?:自然直|必有路|自有路)/,
  // 相信后人的智慧/指望子孙的办法（未来自我料理）
  /(?:相信|依靠|指望)(?:后人|后来人|子孙|后代|下一代)(?:的)?(?:智慧|办法|能力|安排)/,
  // 儿孙自有儿孙福
  /儿孙自有儿孙福/,
  // 到时候再说/到时再想办法（存量时间词表未收「到时候」）
  /到时候(?:再)?(?:说|讲|想办法|总会有办法|自然有办法)/,
];

// ─── [r314] 腿① 活在当下宣言（英文）──────────────────────────────
const NOW_EN2 = [
  /\b(?:you\s+only\s+live\s+once|YOLO)\b/i,                     // you only live once
  /\blive\s+for\s+today\b/i,                                     // live for today
  /\bseize\s+the\s+day\b/i,                                      // seize the day
  /\bcarpe\s+diem\b/i,                                           // carpe diem
  /\benjoy\s+(?:it|life|myself|yourself|things)\s+while\s+(?:I|we|you)\s+(?:can|still\s+can|are\s+young|'?re\s+young)\b/i, // enjoy it while I can
  /\bwhile\s+(?:I'?m|I\s+am|we'?re|we\s+are|you'?re|you\s+are)\s+(?:still\s+)?young\b/i,   // while we're young / while we are young
  /\bmight\s+as\s+well\s+(?:enjoy|indulge|treat|live|party)\b/i, // might as well enjoy
  // this weekend + 享乐动词（存量时间词表未收 this weekend/the evening）
  /\b(?:this|the)\s+(?:weekend|evening|holiday|vacation|break)\b[^.]{0,40}\b(?:party|celebrate|relax|indulge|have\s+fun|enjoy)\b/i,
];

// ─── [r314] 腿② 拖延许可/未来外包（英文）──────────────────────────
const LATER_EN2 = [
  // I'll start tomorrow / starting Monday / starting next week（存量无「开始类推迟」）
  /\bI'?ll\s+(?:start|begin|quit|save|save\s+up|exercise|study|diet|train|run|read|take\s+care)\s+(?:tomorrow|next\s+(?:week|month|year)|on\s+Monday|later|another\s+day)\b/i,
  /\bstarting\s+(?:tomorrow|next\s+(?:week|month|year)|Monday)\b/i,
  /\bnext\s+time\s+(?:for\s+sure|I\s+will|I'?ll)\b/i,             // next time for sure
  // I'll save after / quit once（事件后置许可）
  /\bI'?ll\s+(?:save|quit|start|begin|exercise|study|diet|train|run|read)\s+(?:after|once|when|as\s+soon\s+as)\b/i,
  // who cares what happens tomorrow（未来整体外包）
  /\bwho\s+cares\s+(?:what\s+happens\s+)?(?:tomorrow|about\s+tomorrow|in\s+the\s+future)\b/i,
  // we'll cross that bridge when we come to it（桥头谚语英式；覆盖 will 与 'll 两形）
  /\bwe(?:'?ll|\s+will)\s+cross\s+that\s+bridge\s+when\s+we\s+come\s+to\s+it\b/i,
];

// ─── 距离窗（腿①×腿②）──────────────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（本族名称/创始人/学科术语的教学定义句）────
const CONCEPT_ZH = /(?:现时偏差|现时偏好|当下偏差|现在偏差|双曲贴现|延迟折扣|时间折扣|时间贴现|跨期选择|跨期决策|即时满足倾向|自我控制问题|莱布森|塞勒|谢夫林|行为经济|时间偏好)/;
const CONCEPT_EN = /\bpresent\s+(?:bias|biased)\b|\bhyperbolic(?:ally)?\s+discount|\bdelay(?:ed)?\s+discount|\btemporal\s+discount|\bintertemporal\b|\bLaibson\b|\bThaler\b|\bShefrin\b|\bself[- ]control\s+problem\b/i;

// ─── 豁免：正确跨期计划/自控陈述（拆小步/固定储蓄/提前动手/今日事今日毕/先完成再奖励）
const CORRECTIVE_ZH = /(?:先(?:完成|写完|做完|搞定|处理完|干完)[^。，！？；\n]{0,10}(?:再|然后|才|之后)(?:玩|休息|放松|享受|娱乐|吃|喝|刷|买|看))|(?:拆成|分成|切成|细化成)[^。，！？；\n]{0,8}(?:小步|小块|小段|今天就能|当天就能|可执行)|(?:每月|每周|每天|固定|定时)(?:存|储蓄|攒|还|记账|运动|锻炼|体检|复盘)|(?:截止|死线|deadline)(?:日期)?(?:前|之前|以前)[^。，！？；\n]{0,8}(?:开始|动手|做|完成)|(?:今日事|当天的事|当周事)[^。，！？；\n]{0,6}(?:今日毕|当天清|今天做完|当周清)|先苦后甜|(?:及时行乐|享受生活|活在当下)[^。，！？；\n]{0,8}(?:也要|但有|有度|适度|不过分)|自律|自控|意志力|(?:设|定|排|列)了?[^。，！？；\n]{0,6}(?:计划|日程|提醒|闹钟|待办|清单)|(?:这周|本周|这几天|马上|立刻|现在|当即)[^。，！？；\n]{0,8}(?:去约|去查|去体检|去运动|去还|去复习|开始|动手|处理|面对|存|攒)/;
const CORRECTIVE_EN = /\b(?:do|finish|complete|handle|start|address)\s+(?:it\s+)?(?:now|today|right\s+now|first|before|this\s+week|immediately)\b|\bbefore\s+(?:I\s+)?(?:play|relax|reward|treat|rest)\b|\bsave\s+(?:automatically|every\s+month|first|regularly)\b|\b(?:commit|start)\s+early\b|\breward\s+(?:yourself|myself)\s+after\b|\bdeadline\b[^.]{0,40}\b(?:before|ahead|early)\b|\bbreak\s+(?:it|the\s+goal|things)\s+(?:down\s+)?into\b|\bsmall\s+(?:steps?|chunks?|tasks?)\b|\bwillpower\b|\bplanned\s+(?:for|ahead)\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|谈不上是|不会再|不会|不再|别)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不)/;

const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  // A不A/V不V 疑问形（长寿不长寿/好不好/会不会）中的「不」不是对后续
  // 断言的否定——跳过中文否定检查，避免假否定漏判。
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
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

// 双腿链配对：NOW × LATER（均查否定前缀），近距离窗内成签名。
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    { now: (R.NOW_ZH || NOW_ZH).concat(R.NOW_ZH2 || NOW_ZH2), later: (R.LATER_ZH || LATER_ZH).concat(R.LATER_ZH2 || LATER_ZH2), win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh' },
    { now: (R.NOW_EN || NOW_EN).concat(R.NOW_EN2 || NOW_EN2), later: (R.LATER_EN || LATER_EN).concat(R.LATER_EN2 || LATER_EN2), win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en' },
  ];
  for (const L of langs) {
    const nm = collect(text, L.now, true);
    if (nm.length === 0) continue;
    const lm = collect(text, L.later, true);
    for (const n of nm) {
      for (const l of lm) {
        if (dist(n, l) > L.win) continue;
        sigs.push({ lang: L.lang, now: n.raw, later: l.raw });
      }
    }
  }
  return sigs;
}

/**
 * 双腿链签名：现在即时满足 × 未来代价被推迟或贴现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectPresentBias(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（现时偏差/双曲贴现/跨期选择教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：正确跨期计划/自控陈述（拆小步/固定储蓄/提前动手/今日事今日毕）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'present_bias',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '现在满足「' + x.now + '」×未来被推迟/贴现「' + x.later + '」'
      : 'present gratification "' + x.now + '" x deferred/discounted future "' + x.later + '"')),
    details: s.lang === 'zh'
      ? '现时偏差/双曲贴现(' + sigs.length + '处: 现在即时满足「' + s.now + '」与未来代价被推迟或贴现「' + s.later + '」共现，未来后果未获严肃对待)(zh)'
      : 'present bias / hyperbolic discounting(' + sigs.length + 'x: present gratification "' + s.now + '" x deferred/discounted future "' + s.later + '")(en)',
    guidance: '现时偏差（双曲贴现）指人们对即时效用赋予不成比例的权重，系统性地过度贴现未来的收益与代价——体检以后再说，今晚先痛快吃了，以后的事以后再说 / 明知道熬夜伤身，可凌晨的快乐是现在就有的，谁管明天怎么样 / 戒烟从下周开始，今天这根先抽完 / saving is for later, right now I need to enjoy what I can actually feel / future me can deal with the consequences, I want it now。请补上论证：未来的健康、债务、责任与现在的自己是同一个责任主体，时间距离不改变后果归属；「打八折的未来」不是削减代价而是拒绝承认代价。若确实要优先当下，明确说出代价有多大、由谁承担、何时兑现；把大目标拆成今天就能完成的小步、设定固定周期的储蓄/运动/体检、截止日期前提前动手，都是把未来拉回决策的正确做法；若这段话只是转述他人选择，核实其未来后果是否已被严肃对待再决定是否采信。',
    tags: ['economics', 'behavioral-economics', 'present-bias', 'hyperbolic-discounting', 'cognitive-bias', 'intertemporal-choice', 'self-control'],
  };
}

module.exports = {
  detectPresentBias,
  __internals: () => ({
    NOW_ZH, NOW_EN,
    LATER_ZH, LATER_EN,
    // [r314] 拖延许可×活在当下宣言新族（平行常量，负例注入-删条用）
    NOW_ZH2, NOW_EN2, LATER_ZH2, LATER_EN2,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
