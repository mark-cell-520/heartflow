/**
 * src/gamblers-fallacy.js — 「赌徒谬误」检测器（第 148 个判别维度）
 *
 * [r717 立项] decision 本体选出（scripts/decide-r717.js，composite_score
 * 0.84 / confidence 0.8 / identity alignment 0.8，无弃权）。候选池来自
 * r717 探测器（scripts/round-717-family-probe.js）在当前引擎（v6.8.62，
 * 147 维）上逐族复测：攻击漏判 8/9（89%）、真零命中 8/8、良性 0/9
 * 误伤。Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，实测
 * 全维度零命中 8/8——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：赌徒谬误（gambler's fallacy / Monte Carlo fallacy）——**把
 * 独立事件的历史频率当成未来概率的依据**，认为连胜之后「该输了」、
 * 连败之后「该赢了」、出现次数少的「该出现了」，让随机序列背负
 * 「平衡义务」：
 *   已经连输五把了，下一把肯定赢。
 *   都出十次小了，该出大了。
 *   连续三把没中，这次中奖概率更高了。
 *   前面几次都是反面，这次肯定是正面。
 *   输了这么多把，运气该回来了。
 *   硬币出了五次正面，下一次反面的概率大多了。
 *   It has been tails five times in a row, so heads is due next.
 *   After ten losses, a win is statistically more likely now.
 *   The coin landed heads four times, so tails is overdue.
 *
 * 与既有维度的边界（r717 归因）：
 *   · statistical_misleading 管**统计数据的呈现误导**（挑选性
 *     展示/基数误导/图表操纵），本族管独立事件概率的认知错误，
 *     不涉及数据呈现；
 *   · confidence 管**断言强度**（肯定/一定/毫无疑问），本族管
 *     「历史频率→未来概率」的推断结构，可毫无强度词；
 *   · pseudo_causal 管**虚假因果机制**（A 导致 B 的具体机制
 *     错误），本族管的不是因果机制而是概率分布误判；
 *   · 其余 147 个维度对本族 8 条漏判样本实测零命中 8/8。
 *   · src/index.js 既有 3 条同族英文 pattern（en_streak_due 表
 *     内）是指认不是运用，不占维度键——本模块上线后与其并存，
 *     射程互补（那 3 条只认特定英文句型，本维度管双腿判据）。
 *
 * 判据（两条腿共现，缺一不判）：
 *   · 腿① STREAK 历史连胜/连败/高频重复表达——连输/连赢/连败/
 *     连胜/连续N[把次回]/N次没中/前几次/这么[多长][把次回下]
 *     （中）；N times in a row / a streak of / N consecutive /
 *     N losses / N wins（英）；[r280 新增族] 期/天/周开奖计数
 *     （十期没出）、黑红连开（连续黑了五把/连黑）、倒霉时长
 *     （倒霉了这么久）、动词间隔形（连着输了）、冷热时长（冷了
 *     这么多天）、运气持续差（运气一直差）；EN has been cold /
 *     been hot、luck can't stay bad、cold streak/spell；
 *   · 腿② DUE 反转/概率升高预期——下一[把次回]肯定赢/该出[大小]/
 *     概率更[高多大了]/运气该回来/风水轮流转/该转运/肯定是[正面
 *     反面]/这次一定中/该轮到了（中）；is due / overdue / more
 *     likely / bound to（英）；[r280 新增族] 不可能再[黑红输赢]
 *     （否定反转）、[准铁定][能会]?[赢中]（下一把准赢）、再怎么
 *     [也]?得…赢/中/回本（让步反转）、[也该总]轮到X了、该[冷热]
 *     [一这]?[把次]（该热一把）。
 *   · 缺腿不判：只有腿①（「虽然连输五把，但每把都是独立事件，
 *     概率不变」）是正确概率陈述；只有腿②（「这个事情一定会
 *     成功」）无历史频率来源，归 confidence。
 *
 * [r301 新增族] 长期平均论证 × 短期补偿（law of averages）+ 连发形 ×
 *   追投行动（探针 scripts/round-301/probe-candidates3-r301.js 实证
 *   4/5 攻击改前整句穿透 gate）：
 *   · 腿① LLN_ZH/LLN_EN 长期平均论证——「长期看输赢总会扯平」「样本
 *     越多结果越接近均值」「频率回归平均」（EN: in the long run … even
 *     out / revert to the average / as the sample grows）：引用长期平均
 *     为短期补偿义务背书，是赌徒谬误最常用的论证外壳，存量两条腿都
 *     不收（腿①要 streak 事实、腿②要「该赢了/due」预期形）。
 *   · 腿② CHASE_ZH/CHASE_EN 追投行动——「加倍下注/梭哈/全押/加注」
 *     （EN: double down / all in / raise the stakes）：平衡义务的行动
 *     面表达；连输五把后加倍下注即「下一把该回来了」的赌桌形。
 *   · 三条新路由（与存量路由并行，不并存量数组）：streak×chase、
 *     lln×due、lln×chase（中英各三条）。
 *   · 已知窄口：①显式引用「大数定律/law of large numbers」字样的攻击
 *     （「大数定律保证长期会回归平均，所以现在该梭哈」）被既有豁免
 *     EVIDENCE_PRESENT 放行——该豁免保护的良性陈述量更大，刻意不
 *     动共享豁免（r300 同款纪律：新族走并行路由）；②DUE 腿「概率
 *     更高」无尾字收不住（「接下来出大的概率更高。」），本轮不收
 *     （补它会误伤「样本量越大检验功效越高」类正当统计陈述）；③裸
 *     「翻本/回本」不入 CHASE——r280 良性「别把希望寄托在下一把
 *     翻本上」靠 DUE_ZH 的前缀要求豁免。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误（「他说连输五把
 * 下一把肯定赢，我劝他别这么想」）、概率教学中的反例讲解（「很
 * 多人认为十次没中下次概率更高，这是赌徒谬误」）、游戏/赌博
 * 场景的叙事引用。verify 的含义是「这段话在把历史频率当未来
 * 概率，需要回到独立事件与概率论的常识层面」——调用方应要求
 * 把「下一次的概率」落到独立事件的定义上，而不是接受平衡
 * 幻觉。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（赌徒谬误/gambler's fallacy/Monte Carlo
 *     fallacy 字样在场）：分析这个概念本身不是运用它；
 *   · 正确概率陈述在场（独立事件/概率不变/不影响/与历史无关/
 *     不会累积/50%/对照组/大数定律；independent/regardless/
 *     remains the same/do not affect/law of large numbers）：
 *     陈述独立性原理的话是在破除谬误；
 *   · 概率教学第三人称语境（概率论老师/统计学老师/教材/课堂上/
 *     教授/textbook/lecture/professor）：专业角色复盘反例。
 */
'use strict';

// ─── 腿①：历史连胜/连败/高频重复表达（中文）────────────────────────
// [r280 新增族] 时间与概率推理方向——自然口语形穿透补收（探针实测 7/8
// 零命中）：期/天/周开奖计数（十期没出）、黑红连开（连续黑了五把）、
// 倒霉时长（倒霉了这么久）、动词间隔形（连着输了六个回合）、冷热时长
// （冷了这么多天）、运气持续差（运气不可能一直差）。
const STREAK_ZH = /(?:连[输赢败开押下注]|连胜|连败|连续[二三四五六七八九十百千\d]+[把次回下个局]|连续[输赢败开押中]|接连[输赢败开押中]|连连[输赢败开]|连续[输赢败中开]|[二三四五六七八九十百千\d]+[把次回下][没中都开是赢都][^。]{0,4}?(?:了|哩|咯)?|[二三四五六七八九十百千\d]+次[没中开是赢都]|[二三四五六七八九十\d]+次?[的正反]面|(?:正|反|背)面(?:出现|开出|开了|出过|连续|都是|又是|连开)?[一二三四五六七八九十百千\d]+次|[大小](?:连续|连)?(?:开|出)[了过]?[一二三四五六七八九十百千\d]+[把次天回]|前[面那]?[几一二三四五六七八九十百千\d]+[次把回下]|这么[多长][把次回下]|连着[二三四五六七八九十\d]*[把次回下局]|已经[输赢开]了?[一二三四五六七八九十\d]*[把次回下]?|十次|五次|好几次|连续[二三四五六七八九十\d]+次|手气[正很][旺顺]|手气[正很][背着差霉]|手气背|手气差|手气不好|手风不顺|点子背|背到家|势头[正很][旺猛好]|还没吐分|没吐分|没出分|该吐分|[把场局]输了|连输|连开|连押|[二三四五六七八九十百千\d]+[期天周节][没都][有出开中现冒]|连[续着]?[黑红]|[倒霉背晦]了[这那]?么?[久长]|连着[输赢败开押]了|[冷热]了[这那]?么?[久长多]|运气[^。]{0,8}(?:一直|始终|这么|那么|最近)[差背霉衰不好])/;

// ─── 腿①：历史连胜/连败/高频重复表达（英文）────────────────────────
// [r280 新增族] 自然口语形（探针实测穿透）：has been cold / been hot
// （冷热时长直述）、luck can't stay bad（运气守恒义务形）、cold
// streak / cold spell（冷淡期）。
// [r289 新增族] 日常事件连发形（探针实测：「连续迟到五天」「连挂三科」
// 「这个月一直下雨」整族穿过——原腿①只收赌局/博弈连发（连输/连开/大小
// 连续开出），不收生活事件的「一直/连续 X N 天」单向持续形）
const STREAK_DAILY_ZH = /(?:连续|接连|连着|一连|连日|连日来|向来|一向|素来|从来都|一直|这[个上本]?[天周月年]|近[一二三四五六七八九十\d]+[天周月年]|这[几两三四五六七八九十\d]+[天周月年]来?|[这前那][几两三四五六七八九十\d]+[天周月年])[^。！？!?]{0,8}(?:迟到|缺席|旷工|下雨|下雪|刮风|降温|升温|熬夜|失眠|挂科|不及格|被拒|失败|失约|爽约|迷路|摔倒|感冒|生病|加班|堵车|断网|死机|丢东西|没中|输|败|错|翻车|掉线|投诉|退货|延期|倒霉|倒霉透|不顺|走背运)|连[续着]?[挂迟输败错摔翻][^。！？!?]{0,4}[一二三四五六七八九十百千\d]+[科场次天人回把下月周]|[^。！？!?]{0,6}[了过上][^。！？!?]{0,6}[一二三四五六七八九十\d]+[天周月年]|连[续着]?[一二三四五六七八九十\d]+[天晚][^。！？!?]{0,4}(?:没吃|没睡|没喝|没休息|没合眼)/;

// [r289 新增族] 日常事件反转断言形（探针实测：「第四场该反弹了」「今天
// 该准时到」「这次该过了」「该好起来了」整族穿过——原腿②只收赌局术语
// （该出大小/该转运/必中），不收日常事件「该 + 反向结果」）
const DUE_DAILY_ZH = /(?:该|该要|应该|也该|总该|总得要|总得|该是|应该是|该着|轮到)[^。！？!?]{0,6}(?:反弹|翻盘|触底|回暖|回升|好转|好起来|好点|好一些|好点些|涨回来|回涨|放晴|雨停|晴天|转晴|准时|按时|成功|成事|过了|及格|过线|过了|中了|中奖|赢一把|赢一次|赢了|赢一局|顺一趟|顺一点|硬气一回|争气一回|硬一次|得意一回|走点?[运正]运|转运|输一?[把局次]?[了来]?|吃点东西|吃上饭|吃口饭|饿[了来]?|困[了来]?|醒[了来]?|睡个好觉|睡好|轻松一点|松一口气|歇一歇|歇会儿|休息一下|到货|来|来一次|来了)/;

const STREAK_EN = /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|several|multiple|so\s+many)\s+(?:times?\s+in\s+a\s+row|consecutive\s+(?:times|losses|wins|flips|tosses)|losses|wins|times|tosses|flips|draws|tails|heads|reds|blacks|spins|hands|rounds|rolls|pulls|games)\b|\b(?:a\s+streak\s+of|streak\s+of|a\s+(?:losing|winning|hot|cold)\s+streak)\b|\b(?:has\s+been|have\s+been|it\s+has\s+been)\s+(?:tails|heads|red|black|winning|losing|on\s+a\s+(?:losing|winning)\s+streak)\b|\b(?:has|have)\s+not\s+paid\s+out|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+in\s+a\s+row\b|\b(?:come|comes|came|coming)\s+up\s+(?:tails|heads|red|black|winning|losing)\b|\b(?:tails|heads|reds|blacks)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+times\b|\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:straight|consecutive)\s+(?:losses|wins|defeats|games|tosses|flips)\b|\b(?:has|have)\s+been\s+(?:cold|hot|dry)\b|\b(?:luck|my\s+luck|fortune)\s+(?:can['\u2019]?t|cannot|could\s+not)\s+stay\b|\bcold\s+(?:streak|spell|run)\b/i;

// ─── 腿②：反转/概率升高预期（中文）────────────────────────────────
// [r280 新增族] 自然口语形反转预期（与 r280 腿①新族配套，探针实测穿透）：
// 不可能再黑（否定反转）、下一把准赢（准/铁定语）、再怎么也得赢一回
// （让步反转）、轮到它了（也该轮到）、该热一把了（冷热交替预期）。
const DUE_ZH = /(?:下一[把次回下][肯定一][会定][赢中]|下一次[肯定一][会定][赢中]|该出[大小]了|该出[大小]|该开[大小]|开[大小]了|[肯肯定]定?开[大小]|必开[大小]|(?:概率|几率)[更]?[大高多][多了高]|运气该回来|运气要回来|运气会回来|风水轮流转|该转运了|转运的时候|肯定是[正反]面|一定是[正反]面|这次一定[会中赢]|这次[肯定一][会定][中赢]|该轮到[我了它了]|反转的时候到了|时来运转|否极泰来|必中|下一[把次回下]?还能赢|一次赢回来|赢回来|运气攒着|攒着|第[一二三四五六七八九十百千\d]+[把次回下][^。！？!?]{0,4}(?:必赢|必中|肯定|一定|稳赢|稳中|跑不了|妥妥|没悬念)|[下一]?[把次回下][^。！？!?]{0,3}(?:必赢|必中|稳赢|稳中|妥妥的|稳了|没悬念|跑不了)|(?:怎么|再|总)?也该中|该中一次|该转运|该翻本|要翻本|能翻本|该赢回来|该回本|该(?:买|卖|押|下|跟)?[大小]|概率(?:该|要|会|得)?(?:回来|回归|回摆|摆回来)|不可能[再又][黑红输赢]|[准铁定][能会]?[赢中]|再怎么[也]?得[^。！？!?]{0,8}(?:赢|中|回本|翻本|中一)|[也该总]轮到[它我你他]了|该[冷热][一这]?[把次])/;

// ─── 腿②：反转/概率升高预期（英文）────────────────────────────────
const DUE_EN = /\b(?:is\s+due|are\s+due|due\s+next|due\s+to\s+(?:happen|come\s+up|change)|due\s+for|overdue|must\s+be\s+(?:next|due)|more\s+likely\s+(?:now|next|this\s+time)|bound\s+to\s+(?:happen|come\s+up|win|change)|luck\s+is\s+(?:due|going\s+to\s+(?:turn|change))|a\s+win\s+is\s+(?:due|coming)|my\s+luck\s+will\s+turn|statistically\s+more\s+likely|guaranteed\s+to\s+(?:win|hit|come\s+up|pay)|bound\s+to\s+(?:hit|pay|strike|land|come\s+up)|(?:heads|tails|red|black|a\s+win|winning)\s+is\s+(?:coming|on\s+its\s+way)|almost\s+certainly\s+(?:black|red|heads|tails))\b/i;

// ─── [r301 新增族] 腿①「长期平均论证」（大数定律滥用：用长期扯平/回归
// 论证短期补偿）────────────────────────────────────────────────────
// 缺口实证（scripts/round-301/probe-candidates3-r301.js，v6.8.174 改前）：
//   「长期看输赢总会扯平，所以现在连输五把正是加倍下注的好时机。」
//   「样本越多结果越接近均值，这一把该把之前输的全赢回来。」
//   「In the long run wins and losses even out, so after five losses it is
//     time to double the bet.」
//   「Frequencies revert to the average, so after ten smalls in a row a big
//     is due.」
//   4/5 整句穿透 gate()——存量腿①只收「连输/连开/十期没出」 streak 事实
//   陈述，腿②只收「该赢了/ is due」 预期形；「长期总会扯平 ⇒ 短期该
//   补偿」这一经典 law-of-averages 论证形（引用长期平均为平衡义务背书）
//   两条存量腿都不覆盖。本腿收长期/样本越多/频率回归三类长期平均断言。
const LLN_ZH = /(?:长期|长远|拉长[看时]|时间拉长)[^。！？!?]{0,14}(?:扯平|抵消|中和|抹平|拉平|回归|趋近|平衡|平均)|(?:样本|次数|试验|投掷|对局|局数|重复|数据量)越[多大小长][^。！？!?]{0,12}(?:接近|趋近|回归|靠近|稳定|集中)|(?:频率|胜率|概率|均值|结果)越[多大小长][^。！？!?]{0,12}(?:接近|趋近|回归|靠近|稳定|集中)|(?:频率|胜率|概率|均值)[^。！？!?]{0,8}(?:回归|趋近|回到|靠近|集中于)[^。！？!?]{0,6}(?:平均|均值|期望|水平|真实)/;

// [r301 新增族] 同族英文长期平均论证形。
const LLN_EN = /(?:in\s+the\s+long\s+run|over\s+the\s+long\s+run|over\s+time|as\s+the\s+sample\s+(?:size\s+)?grows|with\s+more\s+(?:trials|trades|rounds|bets|flips|games|data)|(?:wins?|losses|outcomes?|results?|returns?|frequenc(?:y|ies))\s+(?:will|would|should|always|eventually|naturally|tend\s+to)?\s*(?:even\s+out|balance\s+out|average\s+out|cancel\s+out|even\s+up)|revert\s+to\s+the\s+(?:average|mean)|regress\s+to\s+the\s+(?:average|mean)|gravitat\w+\s+(?:back\s+)?toward\s+the\s+(?:average|mean)|law\s+of\s+averages)/i;

// ─── [r301 新增族] 腿②「追投行动」（加倍下注/梭哈/全押：平衡义务的行
// 动面表达）────────────────────────────────────────────────────────
// 存量腿②只收「该赢了/ due/overdue」预期形，不收「追着连败加倍下注」
// 的行动形——连输五把后加倍下注/梭哈/重注，正是「下一把该回来了」
// 的赌桌上表达。探针实证（同 round-301 探针）该族整句穿透。
// 刻意不收裸「翻本/回本/赢回来」（已归 DUE_ZH 的 该翻本/赢回来 形）——
// r280 良性「但也别把希望寄托在下一把翻本上」靠缺失前缀豁免。
const CHASE_ZH = /(?:加倍[下押投注]|翻倍[下押注]|加注|加码|重注|重押|梭哈|全押|满仓|追投)/;

// [r301 新增族] 同族英文追投行动形。
// ─── [r476 新增族] 腿①「累计失败计数」（非博彩日常事件的失败累加形）
// ───────────────────────────────────────────────────────────────
// 缺口实证（coordination/agent4/probes/r476-probe-pool.js，HEAD v6.8.236
// 改前实测）：P2 族穿透 4/10、良性 FP 0/4。逐条跑腿诊断：
//   「我这阵子连错五道题，下一道肯定该轮到我对了。」——STREAK_ZH 否、
//     STREAK_DAILY_ZH 否、DUE_ZH 是（「该轮到我了」在存量 DUE_ZH 内）
//   「她面试被拒了八次，下一次该轮到她被录取了吧。」——六条腿全否
//   「他已经连着七天没开单了，按概率下一单该成交了。」——STREAK_ZH 是
//     （连着七天），DUE 两条腿全否
//   「I have bought lottery tickets for ten years without winning; my
//     turn is due.」——DUE_EN 是，STREAK_EN 否
// 结论：存量腿①只收赌博术语（连输/连开/大小连续开出）与「连续N天+X」
// 单向持续形（STREAK_DAILY_ZH 的 连续…[失败词] 形），不收「动词+N次+
// 没/都+否定结果」的累计失败计数形（连错五道题/被拒八次/三十份简历
// 石沉大海/三年没摇到号）；存量腿②只收赌局术语（该出大小/该转运/
// is due），不收「轮到某人」的轮次公平分配义。两条缺口各补一条腿。
// 刻意不收裸「没/未+动词」无计数形（「没开单」无累加语境是普通陈述，
// 会被「客户还没回复」类良性误伤）——计数词（N次/N年/N份）或内嵌否定
// 动词（连错/连败/被拒）是硬门槛。两类硬门槛：
//   ① 连[否定动词]+N+[量词]——否定内嵌在动词里（连错五道题/连败三局），
//      后置否定词可选；
//   ② N+[次回份年天] + 后置否定（五次没中/三年没摇到/八次都石沉大海）。
const STREAK_COUNT_ZH = /(?:连[错败输拒挂考丢翻][一二三四五六七八九十百千\d]*[道题次回份下场局科]|连[错败输拒挂考丢翻]\s*[一二三四五六七八九十百千\d]+\s*[道题次回份下场局科]|连着[一二三四五六七八九十百千\d]*[道题次回份下场天][^。！？!?]{0,6}(?:没|未|都|也没|没能)|[一二三四五六七八九十百千\d]+[次回][^。！？!?]{0,4}(?:没[中过开成]|未[中开成]|都[没不]|也没|石沉大海|杳无音信)|被拒[了着过]?[一二三四五六七八九十百千\d]+[次回]|投[了递]?[一二三四五六七八九十百千\d]+[份][^。！？!?]{0,8}(?:石沉大海|杳无音信|没[有回]?消息|都[没无]回应|没[中成])|摇[了]?[一二三四五六七八九十百千\d]+[年][^。！？!?]{0,4}(?:没[中摇到]|未[中摇到]|没中过)|报[了名]?[一二三四五六七八九十百千\d]+[次][^。！？!?]{0,6}(?:没[抽中中]|未[抽中中]|[都也][没不]))/

// [r476 新增族] 同族英文累计失败计数形。存量 STREAK_EN 只认
// 「N times in a row + losses/wins」与「has been cold/hot」，不收
// 「has been rejected eight times / has gone seven days without /
// thirty applications without a reply」的完成时累计形。
const STREAK_COUNT_EN = /\b(?:has|have)\s+been\s+(?:rejected|declined|passed\s+over|turned\s+down|unsuccessful|defeated|rejected)\b|\b(?:has|have)\s+gone\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:days?|weeks?|months?|years?)\s+without\b|\b(?:has|have)\s+spent\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:days?|weeks?|months?|years?)\s+(?:without|on)\b|\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|thirty|fifty|dozens?\s+of)\s+(?:applications?|resumes?|interviews?|exams?|attempts?|tries|lottery\s+tickets?)\s+(?:without|and\s+no)\b|\b(?:for|in|after)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:years?|months?|weeks?|days?)\s+(?:without|and\s+no)\b|\bwithout\s+a\s+(?:reply|response|offer|win|success|job|promotion)\s+(?:for|in|after)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b|\bapplications?\s+without\s+a\s+(?:reply|response|offer)\b|\b(?:after|following|with)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:failed|rejected|declined|unsuccessful|losing)\s+(?:exams?|attempts?|tries|interviews?|applications?|resumes?|auditions?|tryouts?|submissions?|bids?|proposals?)\s+in\s+a\s+row\b|\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:failed|rejected|declined)\s+(?:exams?|attempts?|tries|interviews?|applications?|auditions?|tryouts?)\s+in\s+a\s+row\b/i;

// ─── [r476 新增族] 腿②「轮次公平断言」（该轮到/该转运：公平分配义）
// ───────────────────────────────────────────────────────────────
// 缺口实证（同 r476 探针）：存量腿②（DUE_ZH / DUE_DAILY_ZH）只收赌局
// 术语（该出大小/该转运/该中一次）与日常事件反转（该反弹/该好转），
// 不收「该轮到 X」的公平分配断言——「下一次该轮到她被录取」「下一单
// 该成交」「my turn is due」。轮次公平断言是赌徒谬误在日常语域的
// 标准外壳：把独立事件当成会轮流发生的轮次。
// 刻意不收值班分派义（「这周轮到小李值班」）——无累计失败计数在场，
// 双腿 AND 路由天然排除；TURN_ZH 不要求该前缀绑定计数词。
const TURN_ZH = /(?:该轮到|轮到[我了它你他]|总该轮到|也该轮到|该轮到[我了它你他][^。！？!?]{0,10}(?:了|吧|呗)?|下一[道题次回家单]?[^。！？!?]{0,8}该(?:轮到|中|成|过|上岸|被录取|成交|拿到|摇到|抽中)|这[次回]?[^。！？!?]{0,6}该(?:轮到|中一|过|上岸|成|成交)|轮到我|轮到你|轮到他|轮到她)/;

// [r476 新增族] 同族英文轮次公平断言形。存量 DUE_EN 只收
// 「is due / overdue / bound to happen」，不收「my turn is due /
// it is his turn / bound to go his way」的轮次分配义。
const TURN_EN = /\b(?:my|your|his|her|their|our)\s+turn\s+(?:is|must\s+be|has)\s+(?:due|next|coming|now|here)\b|\bit\s+is\s+(?:my|your|his|her|their)\s+turn\b|\bturn\s+(?:is|has)\s+(?:come|finally\s+come)\b|\bbound\s+to\s+(?:go|happen)\s+(?:his|her|my|your|their)\s+way\b|\b(?:is|it'?s)\s+(?:my|his|her|their)\s+turn\s+(?:to|for)\b|\bsomeone\s+else'?s\s+turn\b|\b(?:my|your|his|her|their)\s+turn\s+to\s+(?:win|pass|succeed|get|be\s+chosen|be\s+picked)\b|\bturn\s+is\s+(?:due|coming)\s+up\b|\b(?:is|it'?s)\s+(?:my|his|her|their)\s+turn\b/i;


// ─── [r477 新增族] 腿①「守恒/攒积断言」（运气账本：把运气/功德/人情
// 当成可存取、可透支、有额度的账户）──────────────────────────────────
// 缺口实证（coordination/agent4/probes/r477-probe-pool.js，HEAD v6.8.237
// 改前实测）：运气账本族穿透 10/10、概率攒积族穿透 12/12、系统纠偏族
// 穿透 14/14——存量腿①（STREAK_*）只收「连输/连开/连续N天」的 streak
// 事实形，不收「守恒/额度/账户/透支/攒够了/等久了/系统纠偏」的存量
// 结算断言形。逐条跑腿诊断（r477-legs-diagnosis.js）：36 条中文攻击
// 无一被任一存量腿命中。本腿收守恒/攒积/透支/额度/账户/临界点/系统
// 纠偏七类存量断言形。
// 语义红线（r477 定）：不收裸「没/未+动词」无计数形；「守恒/额度」等
// 词必须处在**非否定破除语境**（见 NEGATION_BREAK）。
const CONSERVE_ZH = /(?:守恒|额度|账户|账本|攒人品|攒运气|攒福|攒功德|攒着|攒够|攒多|攒了|攒下|攒得|攒到|积攒|存运气|存人品|存福|存了|存下|存入|存进|透支|提前透支|连本带利|运气存款|人品存款|运气账|人品账|用得太狠|等久了?|等得越久|等越久|越等越|越[买等投参与]越|等了[这十]?[年久]|等了这么久|早就该|概率[^。！？!?]{0,8}(?:攒|涨到|升高|变高|攒积)|几率[^。！？!?]{0,8}(?:攒|涨到|升高|变高|攒积)|临界点|苦吃完了?|苦尽甘来|不可能[再又]?[^。！？!?]{0,4}一直|不会一直|不可能一直|不可能让[^。！？!?]{0,8}一直|一直赢|自我纠偏|纠偏机制|均衡力量|有个力量|系统不会|系统不可能|系统不会允许|系统总归|概率系统|概率的?纠偏|输到[这哪]份上|到这份上|到顶|攒到头|连错[这那]?[么多]|这么多(?:把|次|回)|亏了这么|亏了[十]?[年]|顺了这|顺了这么|老天|命运|菩萨|老天爷)/;

// [r477 新增族] 同族英文守恒/攒积断言形。存量 STREAK_EN 只认
// 「N times in a row + losses/wins」与「has been cold/hot」，不收
// 「conserved / luck account / banking goodwill / stack up / built up
// enough / self-corrects / even things out」的存量结算断言形。
const CONSERVE_EN = /(?:conserved|karma\s+(?:is\s+a\s+)?ledger|luck\s+account|goodwill\s+account|banking\s+(?:goodwill|kindness|good\s+fortune|credit)|deposited?\s+(?:so\s+much\s+)?(?:goodwill|kindness|good\s+fortune)|accumulated?\s+credit|comes?\s+back\s+with\s+interest|return\s+on\s+it|saved\s+up\s+(?:his|her|my|your|their|our)?\s*(?:good\s+)?fortune|stack(?:s|ed|ing)?\s+up|piled?\s+up|built\s+up\s+enough|accumulates|cannot\s+stay\s+one-sided|one-sided\s+forever|cannot\s+last|self-?corrects?|even\s+things?\s+out|restore\s+the\s+balance|owes?\s+(?:him|her|me|us)\s+a\s+correction|correction\s+in\s+(?:his|her|my|their)\s+favour|keep\s+winning\s+indefinitely|the\s+(?:longer|more)\s+you\s+wait[^.]{0,40}(?:odds|probability|chance)|raises?\s+the\s+(?:chance|odds)|not\s+the\s+odds|average\s+is\s+due|win\s+is\s+(?:statistically\s+)?due|will\s+even\s+things?\s+out)/i;

// ─── [r477 新增族] 腿②「到期结算断言」（补偿/兑现/返还/还债/转运）──
// 缺口实证（同 r477 探针）：存量腿②（DUE_ZH/DUE_DAILY_ZH/TURN_*）只收
// 「该出大小/该转运/该轮到 X」的轮次公平形，不收「补偿/兑现/返还/
// 还债/均值要回归/天平摆回来」的结算义务形——「老天迟早要补偿他」
// 「到期连本带利返还」「均值要回归」整族穿过。本腿收结算义务族。
// 刻意不收裸「爆发/迟早」无守恒语境的普通预期（双腿 AND 天然排除）。
const SETTLE_ZH = /(?:补偿|平衡|均衡回来|摆正|摆回来|拉回来|拉回|拉[他我你一]?一把|回归|反转|反弹|触底|转运|生效|失衡|兑现|还给他|还了|该还|会还|要?还的|回馈|返还|补回来|补上|爆发|越高|涨到|变高|该中|该赢|该轮到|轮也该|总该|迟早|早晚|一次性|到期|一并|全是甜|均值要|天平|该转运|就会来|总会来|迟早来|该他|该我|该她|保佑|发挥作用|该回本|回本了|自然有人帮|开花结果|还债|一直[赢输败]|让他|让她|让他们|会?存着|存着|攒着)/;

// [r477 新增族] 同族英文到期结算断言形。存量 DUE_EN 只收 is due /
// overdue / bound to happen，不收 pays off / repaid / comes back /
// statistically due / must reverse / even things out 的结算义务形。
const SETTLE_EN = /(?:compensat|balanc|restore|correct|reverse|even\s+things?\s+out|pays?\s+off|payoff|come\s+back|repay|return|owed|is\s+due|due\s+next|higher|built\s+up|accumulat|inevitable|must\s+begin|due\s+to|bound\s+to|statistically\s+due|paid\s+off|repaid|saved\s+up|with\s+interest|must\s+reverse|chance\s+of\s+winning)/i;

// ─── [r477 新增族] 守卫：否定破除语境（「不代表/不存在/没有/不是…」）
// 收「守恒/额度/系统/概率」等词时是在破除谬误，不是运用它。
// 探针实测（r477-proto11/proto16）：良性样本 20 条中 2 条
// （「连败次数不影响下一局胜率，概率系统没有补偿功能」「合同履约靠
// 条款，不是靠人情账户的存取平衡」）双腿齐中，必须由本守卫排除；
// 攻击样本无一落入否定破除语境。
const NEGATION_BREAK_ZH = /(?:不代表|不影响|不存在|没有|不是|无|未|非|不该|不能|不应|不足以|未必)[^。！？!?]{0,8}(?:纠偏|补偿|均衡|摆正|守恒|额度|账户|攒|透支|临界|系统|运气|好运|概率)/;
const NEGATION_BREAK_EN = /(?:(?:does|do|did|is|are|was|were|will|would|can|could|should|must)\s+not|not|no|never|cannot|without)\s+(?:accumulat|compensat|balanc|correct|reverse|restore|repay|return|even\s+things?\s+out|pay\s+off|come\s+back|raise|stack\s+up|pile\s+up|exist|apply|hold|work)/i;

const CHASE_EN = /(?:double\s+down|doubling\s+down|double\s+(?:the|my|your|our)\s+(?:bet|stake|wager)|increase\s+the\s+(?:bet|stake|stakes)|(?:bet|betting|wager(?:ing)?)\s+(?:bigger|more|larger|heavier)|raise\s+the\s+(?:bet|stake|stakes)|go(?:ing)?\s+all\s+in|all\s+in\s+on|win\s+it\s+(?:all\s+)?back|chase\s+(?:the\s+)?(?:losses|loss)|load(?:ing)?\s+up\s+on|double\s+or\s+nothing)/i;

// ─── 豁免一：元话语/概念引述（分析这个概念本身不是运用它）──────────
const META_NOUN = /(?:赌徒谬误|gambler'?s?\s+fallacy|monte\s+carlo\s+fallacy|蒙特卡洛谬误|hot\s+hand\s+fallacy|热手谬误)/i;

// ─── 豁免二：正确概率陈述在场（陈述独立性原理的话是在破除谬误）────
const EVIDENCE_PRESENT = /(?:独立事件|概率不变|概率不会?[累积变]|与历史无关|不受[之前上次]结果影响|不影响[下之]?一[次个]|互不[相影响]|50\s*%|对照组|大数定律|independent\s+event|regardless\s+of|remains?\s+the\s+same|do(?:es)?\s+not\s+affect|law\s+of\s+large\s+numbers|control\s+group|same\s+probability)/i;

// ─── 豁免三：概率教学第三人称语境（专业角色复盘反例）──────────────
const THIRD_PERSON_EXEMPT = /(?:概率论老师|统计学老师|数学老师|概率论教授|统计学教授|教材|课本|课堂上|讲师|教授说|老师说|textbook|lecture|professor|in\s+class|teacher\s+said)/i;

/**
 * 中文路由：腿①×腿② 双腿共现。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const streak = R.STREAK_ZH || STREAK_ZH;
  const streakDaily = R.STREAK_DAILY_ZH || STREAK_DAILY_ZH;
  const streakCount = R.STREAK_COUNT_ZH || STREAK_COUNT_ZH;
  const due = R.DUE_ZH || DUE_ZH;
  const dueDaily = R.DUE_DAILY_ZH || DUE_DAILY_ZH;
  const turn = R.TURN_ZH || TURN_ZH;
  const chase = R.CHASE_ZH || CHASE_ZH;
  const lln = R.LLN_ZH || LLN_ZH;
  // [r477 新族] 运气守恒族双腿：守恒/攒积断言 × 到期结算断言
  const conserve = R.CONSERVE_ZH || CONSERVE_ZH;
  const settle = R.SETTLE_ZH || SETTLE_ZH;
  const hasStreak = streak.test(text) || streakDaily.test(text);
  const hasCount = streakCount.test(text);
  if (hasStreak) {
    if (due.test(text)) return { route: 'zh:streak×due' };
    // [r289 新族] 日常事件反转断言：连发形 × 该反向形。
    // 必须双腿都命中——单有「该反弹」无连发语境是正常预期，单有连发
    // 无反转断言是单纯陈述不幸，均不判。
    if (dueDaily.test(text)) return { route: 'zh:daily×reversal' };
    // [r301 新族] 连发形 × 追投行动：连输五把后加倍下注/梭哈/全押，
    // 是「下一把该回来了」的赌桌行动面表达（存量腿②只收预期形）。
    if (chase.test(text)) return { route: 'zh:streak×chase' };
    // [r476 新族] 连发形 × 轮次公平断言：存量腿②不收「该轮到 X」的
    // 公平分配义（该轮到我了/该成交/该上岸）。
    if (turn.test(text)) return { route: 'zh:streak×turn' };
  }
  // [r476 新族] 累计失败计数 × 轮次公平断言：连错五道题/被拒八次/
  // 三十份简历石沉大海/三年没摇到号 —— 存量腿①不收「动词+N次+没/
  // 都+否定结果」的计数形（连错五道题 STREAK_ZH 否、STREAK_DAILY_ZH
  // 否）。探针实测穿透 4/10（r476-probe-pool.js）。与上面 streak×turn
  // 并联：hasCount 独立判定，不与 hasStreak 共用分支。
  if (hasCount) {
    if (turn.test(text)) return { route: 'zh:count×turn' };
    if (due.test(text)) return { route: 'zh:count×due' };
    if (dueDaily.test(text)) return { route: 'zh:count×daily' };
  }
  // [r477 新族] 守恒/攒积断言 × 到期结算断言（运气账本族）：存量腿①
  // 只收 streak 事实形，存量腿②只收轮次公平/日常反转型；「攒人品
  // 迟早兑现」「概率守恒所以该转运」「系统纠偏该补偿」整族穿过。
  // 与既有路由并联：conserve/settle 独立判定，不依赖 hasStreak。
  // 否定破除语境（「不代表系统会纠偏」）由 NEGATION_BREAK_ZH 排除。
  if (conserve.test(text) && settle.test(text)) {
    if (!(R.NEGATION_BREAK_ZH || NEGATION_BREAK_ZH).test(text)) {
      return { route: 'zh:conserve×settle' };
    }
  }
  // [r301 新族] 长期平均论证 × 反转预期/追投行动（law of averages）：
  // 引用「长期总会扯平 / 样本越多越趋近均值 / 频率回归平均」为短期
  // 补偿背书。该族可无连发形在场（「样本越多…这一把该赢回来」）。
  if (lln.test(text)) {
    if (due.test(text) || dueDaily.test(text)) return { route: 'zh:lln×due' };
    if (chase.test(text)) return { route: 'zh:lln×chase' };
  }
  return null;
}

/**
 * 英文路由：腿①×腿② 双腿共现。
 */
function checkEn(text, R) {
  const streak = R.STREAK_EN || STREAK_EN;
  const streakCount = R.STREAK_COUNT_EN || STREAK_COUNT_EN;
  const due = R.DUE_EN || DUE_EN;
  const turn = R.TURN_EN || TURN_EN;
  const chase = R.CHASE_EN || CHASE_EN;
  const lln = R.LLN_EN || LLN_EN;
  // [r477 新族] 运气守恒族双腿（英文）
  const conserve = R.CONSERVE_EN || CONSERVE_EN;
  const settle = R.SETTLE_EN || SETTLE_EN;
  const hasStreak = streak.test(text);
  const hasCount = streakCount.test(text);
  if (hasStreak || hasCount) {
    if (due.test(text)) return { route: 'en:streak×due' };
    // [r301 新族] 连发形 × 追投行动（double down / all in / raise the
    // stakes：平衡义务的英文行动面表达）
    if (chase.test(text)) return { route: 'en:streak×chase' };
    // [r476 新族] 累计失败计数/连发形 × 轮次公平断言（my turn is due /
    // bound to go her way：公平分配义）。存量 DUE_EN 只收 is due /
    // overdue，不收 my turn is due 的轮次分配形。
    if (turn.test(text)) return { route: 'en:streak×turn' };
  }
  // [r477 新族] 守恒/攒积断言 × 到期结算断言（英文：conserved /
  // luck account / banking goodwill × pays off / repaid / must reverse）
  if (conserve.test(text) && settle.test(text)) {
    if (!(R.NEGATION_BREAK_EN || NEGATION_BREAK_EN).test(text)) {
      return { route: 'en:conserve×settle' };
    }
  }
  // [r301 新族] 长期平均论证 × 反转预期/追投行动（law of averages）
  if (lln.test(text)) {
    if (due.test(text)) return { route: 'en:lln×due' };
    if (chase.test(text)) return { route: 'en:lln×chase' };
  }
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkGamblersFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const EVIDENCE_PRESENT_ = R.EVIDENCE_PRESENT || EVIDENCE_PRESENT;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确概率陈述在场 → 陈述独立性原理是在破除谬误
  if (EVIDENCE_PRESENT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 概率教学第三人称语境：专业角色复盘反例
  if (THIRD_PERSON_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const r = isZh ? checkZh(text, R) : checkEn(text, R);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? `赌徒谬误×频率替代概率(${r.route})`
        : `gambler's fallacy×frequency-over-probability(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkGamblersFallacy,
  __internals: () => ({
    STREAK_ZH, STREAK_DAILY_ZH, STREAK_COUNT_ZH, DUE_ZH, DUE_DAILY_ZH, TURN_ZH,
    STREAK_EN, STREAK_COUNT_EN, DUE_EN, TURN_EN,
    LLN_ZH, LLN_EN, CHASE_ZH, CHASE_EN,
    CONSERVE_ZH, CONSERVE_EN, SETTLE_ZH, SETTLE_EN,
    NEGATION_BREAK_ZH, NEGATION_BREAK_EN,
    META_NOUN, EVIDENCE_PRESENT, THIRD_PERSON_EXEMPT,
  }),
};
