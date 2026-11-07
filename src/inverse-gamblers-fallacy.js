/**
 * src/inverse-gamblers-fallacy.js — 「逆赌徒谬误」检测器
 * （provisional 第 236 个判别维度，r248 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r248-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r247：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect/peak_end_rule/law_of_small_numbers/prosecutors_fallacy
 * 二十二个已起草未接线维度占号，最终编号由 1 号按接线顺序在
 * VERIFY_DIMS 登记序重排）
 *
 * [r248 立项] 零命中探针 coordination/agent4/probes/r248-probe-round1.js
 * + r248-probe-round2.js + r248-probe-round3-inspect.js（v6.8.145 gate()
 * 全量 findings 实测）：五候选两轮定夺——
 *   · B 逆赌徒谬误：一轮 10/10 穿透 + 疑难良性 0/5，二轮 8/8 穿透，
 *     合计 18/18 全穿透，五个候选里最高；二轮 2 条疑难良性被 hold 经
 *     round3 归因核查（gate.reason）分别为 absolute_claim 改写与 gate
 *     默认 verify 路径，findings 均为空，**维度级误伤 0**；
 *   · A 邓宁-克鲁格 13/16、E 现状偏好 12/14、D 聚焦错觉 10/14，
 *     穿透不足且 D 的邻接领地句 3/5 被既有维度代拦（领地重叠）；
 *   · C 均值-离群误读一轮 6/9 且疑难良性 1/5 被拦，穿透最弱，淘汰。
 * B 另有一条关键结构性优势：判据只要求「单次结果 × 过程长度推断」
 * 两腿，与 hot_hand/gamblers_fallacy/hasty_generalization/anecdotal
 * 的领地可清晰切开（探针邻接句零维度级误收）。
 * src/ 下没有任何维度判「由一次罕见结果反推过程已经持续很久/尝试
 * 很多次」这一结构：gamblers_fallacy(148) 管随机序列中的连胜推演、
 * hot_hand 管手气趋势、hasty_generalization 管证据不足泛化、
 * anecdotal 管个案当证据、appeal_to_probability 管可能性当必然，
 * 均不判「首发命中 → 之前一定失败过很多次」这类**由果推因的长度
 * 倒推**。
 *
 * 外部来源：空返，按既有形态自建。r248 海外扫描（coordination/
 * agent4/scout/，stamp 20261107-193659/193727/193736/193748/193808）
 * ——arXiv 精确短语查询 all:"inverse gambler"、all:"inverse gambler's
 * fallacy"、ti:"inverse gambler"、all:"inverse gamblers fallacy" 全部
 * 0 条目；宽查询 abs:"gambler's fallacy" AND abs:fallacy 6 条、
 * abs:fallacy AND abs:probability AND abs:reasoning 10 条，均为赌徒
 * 谬误在强化学习/量子概率/教学中的同名研究（0801.4472v1 信念修正、
 * 1803.08170v6 删失数据误学、2502.03217v1 即 r247 已引的检察官谬误
 * 专文），**没有一篇讲逆赌徒谬误的检测**；GitHub "inverse gambler"
 * 0 仓库，"gambler fallacy" 32 个仓库全是游戏/模拟器/演示（0–2★，
 * howle/gambers-fallacy、Jkovarch/Slotsfired、n-rohit/GamblersFallacy
 * 等），零纯规则检测实现；Semantic Scholar 连续 429 四次。无可集成
 * 的纯规则实现，判据为心虫自有纯规则实现，家族定义取自该谬误的
 * 标准哲学/统计学表述（Hacking 1987 命名：由一次罕见结果反推产生
 * 它的过程已经进行了很久——「玫瑰若在何处盛开，必已盛开很久」，
 * 即 the inverse gambler's fallacy / 逆赌徒谬误）。
 *
 * 辨别的族：逆赌徒谬误（inverse gambler's fallacy）——由**一次
 * 罕见/幸运/出色的结果**（一上场就进球、第一把就出金、刚开张就
 * 客流不断、第一次开口就说到重点；EN he scored on his first shot /
 * it worked the very first time / the machine paid out immediately）
 * 直接反推**产生它的过程已经持续了很久或已经尝试了很多次**
 * （肯定是个身经百战的老将、这池子前面肯定垫了很久、之前不知道
 * 失败过多少回、没有几千次练习是练不出来的；EN so he must have
 * been playing for years / the dice must have been rolled many times /
 * he must have put in thousands of hours already）。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：这是把**相关
 * 方向当成了推论方向**——结果出现了，于是给它编一段足够长的历史。
 * 它和赌徒谬误是一对镜像：赌徒谬误由过程长度推下一次结果，逆赌徒
 * 谬误由一次结果推过程长度。两者共用同一个错误底座——把随机过程
 * 的历史当成可以由单次观测读出的量。现实危害很直接：抽卡第一发
 * 就出金，玩家认定「池子被垫过」，进而相信存在可被利用的规律；
 * 新人第一次出手就做成，被说成「背后必有几千次练习」，天赋与
 * 运气被历史叙事吞掉；面试一次通过，被反推「他一定失败了上百次」，
 * 用编造的过去给现在背书。它与正当推理的界线很清楚：把过程长度
 * 说成成功的**原因**（因为他准备了很久）、承认运气、指出无法反推、
 * 给出真实的历史记录——均豁免。
 *
 * 与既有维度的边界（r248 归因）：
 *   · gamblers_fallacy（148）/hot_hand 管**随机序列中的连胜→下一
 *     次**预测；本族判**单次结果→过程长度**倒推，句中可以没有任何
 *     序列（「他一上场就进球」只有一次观测）。
 *   · hasty_generalization 管**证据不足泛化**；本族有明确的「单次
 *     结果 × 过程长度」双腿与倒推方向，不是泛化而是定向归因。
 *   · anecdotal / anecdote_as_proof 管**个案当证据**；本族判由个案
 *     结果反推过程历史长度，结论指向过去而非支持某主张。
 *   · appeal_to_probability（81）管**可能性当必然**；本族腿①是
 *     已发生的结果陈述，不是概率陈述。
 *   · hindsight_bias（175）/outcome_bias（173）管**事后评断过程**；
 *     本族判由结果**编造过程长度**，且要求过程长度族词在场。
 *
 * 判据（双腿链，腿②过程长度推断须出现在腿①单次结果之后）：
 *   ① 腿① 单次/首次/即时结果——首次标记（第一次/头一回/第一把/
 *      刚开张/首战/一…就…；EN on his first shot / the very first
 *      time / scored on debut / on debut）× 罕见幸运结果词（就中了/
 *      出金/满分/进球/客流不断/一炮而红；EN scored / won / paid
 *      out / nailed it / hit the target），近距窗 ZH16/EN60；
 *      或即时成功复合形（paid out immediately 类）；
 *   ② 腿② 过程长度/尝试次数推断——双重否定形（没有几千次练习是
 *      练不出来的）、量化形（失败过很多次/刷了多少套题/打了很多圈）、
 *      动词+程度量（垫了很久/熬了很多年/试了很久）、资历形（身经
 *      百战的老将/十年功底）、推断词+前史动词（说明…早就铺垫了）；
 *      EN must have been running for years / must have been rolled
 *      many times / thousands of hours / many times before；
 *   ③ 近距离窗 ZH60/EN180，且**腿②必须在腿①之后**（逆赌徒谬误
 *      的方向是由果溯因；过程在前、结果在后的句子是正向归因，
 *      由因果守卫另行豁免）；
 *   ④ 因果守卫：腿①与腿②之间出现「因为/由于/归功于/得益于/离不开
 *      /是…的体现；EN because / thanks to / due to / which is why」
 *      时不判——过程被说成成功的**原因**而不是从结果**倒推**出来的；
 *   ⑤ 否定守卫：腿②前史否定（「没有失败过很多次」）不判；
 *   ⑥ 豁免：概念讨论（逆赌徒谬误/赌徒谬误/蒙特卡洛谬误/过程长度/
 *      倒推/inverse gambler/gambler's fallacy/Monte Carlo fallacy/
 *      Hacking/概率论/统计学——CONCEPT）与正当做法（只是运气/不能
 *      据此推断/无从推断/不能反推/没有必然联系/纯属偶然/需要另外
 *      统计/tells us nothing about/does not tell us——CORRECTIVE）。
 *
 * 为什么取 VERIFY 级：单句也可能只是客观转述一段真实历史（「他第一
 * 次出手就做成了，他确实练了十年」——陈述事实而非由果编因），也可能
 * 是引述谬误案例的教学句。verify 的语义是「这段话在用一次结果反推
 * 过程长度，先核对过程长度是否有独立证据，再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（逆赌徒谬误/赌徒谬误/过程长度倒推/inverse gambler
 *     /gambler's fallacy/Monte Carlo fallacy——CONCEPT）；
 *   · 正当推理（只是运气/不能据此推断/无从推断/不能反推/没有必然
 *     联系/纯属偶然/需要另外统计/tells us nothing about/does not
 *     tell us——CORRECTIVE）；
 *   · 正向归因（第一次就成功，因为他准备了很久/离不开之前几千次
 *     打磨——过程是原因不是倒推结论，因果守卫）；
 *   · 单腿句（只「第一把就出金」无过程长度推断、只「之前失败过
 *     很多次」无单次结果陈述）；
 *   · 序列预测（他连赢五把，下一把大概率还是他赢——无首次标记，
 *     归 gamblers_fallacy/hot_hand 领地）；
 *   · 对冲（很可能只是运气/perhaps it was luck——HEDGE）。
 */
'use strict';

// ─── 腿①a 首次/单次标记（中文）────────────────────────────────
const FIRST_ZH = [
  /第一(?:次|回|把|发|枪|遭|场|战|单|票|天|周|个月|局|回合|口|步|下|年|遍|轮)/,
  /头一(?:次|回|遭|年|把|发|天|遍)/,
  /首次|初次|头回|头遭|头一趟|头一天|头一场/,
  /刚(?:开张|开业|开始|上手|入行|进场|登场|亮相|开服|开局|接触|试水|出道|开踢|开打|开机|上线|开播|开赛|开庭|注册|开通|办卡|下单|入手|买下|装上|下载|开户|签约|开号|开帖)/,
  /首(?:发|战|秀|场|映|期|轮|局|考|攻|罚|演|唱|登)/,
  // 「一…就」结构（一上场就进球 / 一开口就说到重点 / 一试就成）
  /一(?!不|没|未|无|非)[^。；，！？\s]{1,3}(?:就|便)/,
];
const OUTCOME_ZH = [
  // 「就/便 + 罕见幸运结果」
  /(?:就|便)[^。；，！？]{0,8}(?:中|成了|成功|进球|得分|破门|入球|胡|赢|赚|见效|爆|火|命中|中奖|出金|拿下|答对|满分|抽到|翻红|排队|卖光|售罄|破解|通关|晋级|夺冠|拿奖|录取|选中|看中|中招|过关|通过|登顶|折桂|夺魁|拔得头筹|一炮|一夜|首发|应声|当场|重点|要害|本质|说中|点破|一语中的|一针见血)/,
  // 裸结果词
  /(?:中了|中奖|出金|满分|答对|命中了|拿下了|成功了|成了|见效了|爆了|火了|翻红|一炮而红|开门红|旗开得胜|马到成功|一发入魂|一击即中|一枪命中|当场拿下|破解|通关|夺冠|卖光|售罄|排队|客流不断|被录取|被选中|被看中|中了头彩|头彩|大奖|进球|得分|破门|胡了|赢了|赚了|脱颖而出|一举|一击|一命中|一语中的|一针见血|说到重点|切中要害|直达本质)/,
];

// ─── 腿① 英文：首次标记 × 罕见幸运结果 ────────────────────────
const FIRST_EN = [
  /\bon\s+(?:his|her|their|its|the|my|our|a)\s+first\s+(?:shot|try|attempt|go|day|turn|draw|roll|game|match|shift|audition|interview|spin|pull|swing|at[- ]?bat|try)\b/i,
  /\b(?:the\s+)?first\s+(?:attempt|try|shot|go|turn|draw|roll|game|match|day|time|audition|interview|spin|pull|debut|shot|ticket|buy|entry|bid|raffle)\b/i,
  /\bthe\s+very\s+first\s+time\b/i,
  /\bscored\s+on\s+debut\b/i,
  /\bon\s+debut\b/i,
  /\bfirst\s+time\s+(?:out|up|around)\b/i,
  /\bon\s+(?:his|her|their|the)\s+(?:debut|first\s+day)\b/i,
  /\bright\s+out\s+of\s+the\s+gate\b/i,
];
const OUTCOME_EN = [
  /\bscored\b/i, /\bwon\b/i, /\bwinning\b/i, /\bwins\b/i, /\bhit\b/i, /\bworked\b/i,
  /\bsucceeded\b/i, /\bsuccess\b/i, /\bpaid\s+out\b/i, /\bnailed\b/i, /\bsolved\b/i,
  /\bcracked\b/i, /\bwent\s+viral\b/i, /\bsold\s+out\b/i, /\blanded\b/i,
  /\bfound\s+it\b/i, /\bgot\s+it\b/i, /\bmade\s+it\b/i, /\baced\b/i, /\bcracked\s+it\b/i,
  /\bhit\s+the\s+(?:target|jackpot|bullseye)\b/i, /\bjackpot\b/i, /\bqueued\b/i,
  /\bbreakthrough\b/i, /\bnailed\s+it\b/i,
];

// 即时成功复合形（英文）：罕见结果 + immediately/instantly + 过程推断
const IMMEDIATE_EN = /\b(?:paid\s+out|hit\s+the\s+jackpot|won|scored|landed|succeeded|sold\s+out|nailed\s+it)\s+(?:immediately|instantly|right\s+away|at\s+once|straight\s+away|on\s+the\s+first\s+\w+)\b[^.]{0,70}\b(?:must|has\s+to|had\s+to)\s+have\s+been\b/i;
// 即时成功复合形（中文）：就…中/成/赢 + 推断词 + 过程长度词
const IMMEDIATE_ZH = /(?:就|便)[^。；，]{0,6}(?:中|成|赢|赚|爆|火|命中|出金|夺冠|破解|通关|卖光|售罄|翻红|拿奖|折桂)[^。；！？]{0,30}(?:肯定|一定|必然|想必|可见|说明|意味着|显然)[^。；！？]{0,16}(?:垫|铺垫|积累|练|试|摇|抽|刷|熬|失败|尝试|养|蓄|很久|很多次|无数|多少)/;

// ─── 腿② 过程长度 / 尝试次数推断（中文）───────────────────────
// TIGHT = 自身即推断形（双重否定/资历/推断词+前史），LOOSE = 需在两腿
// 之间另见推断标记（肯定/说明/之前/so/must …）才成立——这是「他确实
// 练了十年」（陈述事实）与「肯定练了十年」（由果编因）的分界。
const PROCESS_ZH_TIGHT = [
  // A 双重否定形：没有几千次练习是练不出来的 / 少不了上千次打磨
  /(?:没有|少不了|缺不了|不可能)[^。；，]{0,12}(?:几千|上百|无数|多少|许多|成百|成千|几十|几百|上千)[^。；，]{0,12}(?:次|回|遍|套|小时|年)[^。；，]{0,16}(?:练不出来|出不来|做不到|不成|混不出来|走不到|熬不出来)/,
  // D 经验/资历推断
  /(?:老将|身经百战|久经沙场|沙场老手|功底深厚|十年功|混了多年|干了多年|做了多年|练了多年|浸淫多年|打磨多年|行内多年|资深行家|过来人|老兵)/,
  // E 推断词 + 前史标记 + 过程动词
  /(?:肯定|一定|必然|想必|可见|说明|意味着|显然|注定|少不了)[^。；，]{0,16}(?:前面|之前|背后|此前|事先|早就|已经|暗地里|私下)[^。；，]{0,16}(?:垫|铺垫|积累|攒|练|试|摇|抽|刷|熬|失败|尝试|开过|跑过|运行|做过|养|蓄|磨)/,
  // E2 前史标记 + 推断词 + 过程动词
  /(?:前面|之前|背后|此前|事先|早就|已经|暗地里|私下)[^。；，]{0,16}(?:肯定|一定|必然|想必|可见|说明|意味着|显然)[^。；，]{0,16}(?:垫|铺垫|积累|攒|练|试|摇|抽|刷|熬|失败|尝试|开过|跑过|运行|做过|养|蓄|磨)/,
];
const PROCESS_ZH_LOOSE = [
  // B 量化次数/时长 + 过程名词
  /(?:几千|上百|无数|多少|许多|成百上千|成千上万|几十|几百|上千|很多|无数)[^。；，]{0,6}(?:次|回|遍|套|把|场|局|圈|小时|年)(?:的)?(?:练习|训练|尝试|失败|打磨|积累|摸索|投入|铺垫|准备|锤炼|磨砺|洗礼|付出|功夫)?/,
  // C 过程动词 + 程度量
  /(?:失败|尝试|练习|训练|打磨|摸索|积累|垫|铺垫|摇|抽|刷|熬|试|练|做|打|跑|开|投|扔|摔|踩|碰|撞|摸|爬|养|蓄|攒|筹备|酝酿|混|等|磨|挨|经历|走过|打过|踢过|比过|赛过|准备|备战)[^。；，]{0,6}(?:很多|无数|多少|几十|几百|上千|几千|许多|成百|成千|好些|好几|好久|很久|多年|许久|十年|数年|无数次|好多)/,
  // C2 过程动词 + 时长量（无 了/过）
  /(?:垫|铺垫|积累|蓄|养|攒|筹备|酝酿|混|熬|等|磨)[^。；，]{0,4}(?:很久|好久|多年|许久|十年|数年)/,
];

// ─── 腿② 过程长度 / 尝试次数推断（英文）───────────────────────
const PROCESS_EN_TIGHT = [
  /\b(?:must|has\s+to|had\s+to|have\s+to)\s+have\s+been\s+\w+ing\b[^.]{0,40}\b(?:for|since|before|long|hours|years)\b/i,
  /\bmust\s+have\s+been\s+[a-z]+ed\b[^.]{0,40}\b(?:many\s+times|before|for\s+(?:years|hours|days|a\s+long\s+time))\b/i,
  /\b(?:must|could|may|might|would)\s+have\s+(?:put\s+in|spent|invested|practiced|practised|tried|failed|worked|rehearsed)\s+(?:thousands|hundreds|countless|many|dozens)\b/i,
  /\bmust\s+have\s+(?:failed|tried|attempted|practiced|practised|rehearsed)\b[^.]{0,20}\b(?:many|countless|dozens\s+of|hundreds\s+of|thousands\s+of)\s+times\b/i,
  /\b(?:couldn'?t|wouldn'?t|can'?t|cannot)\s+have\s+(?:done|happened|worked|succeeded|come\s+about|arrived)\s+without\s+(?:thousands|hundreds|countless|many|dozens)\b/i,
  /\b(?:a\s+)?(?:veteran|old\s+hand|seasoned)\b[^.]{0,30}\b(?:years|seasons|decades)\b/i,
  /\b(?:must|has\s+to)\s+have\s+been\s+(?:a\s+)?(?:veteran|old\s+hand|long\s+time)\b/i,
  /\b(?:must|has\s+to|had\s+to)\s+have\s+(?:been\s+)?(?:running|going|building\s+up|playing|working)\s+(?:long\s+)?before\b/i,
  /\bmany\s+times\s+before\b/i,
  /\b(?:before|already|previously|earlier)\b[^.]{0,30}\b(?:many|dozens\s+of|hundreds\s+of|thousands\s+of|countless)\s+times\b/i,
  /\b(?:many|dozens\s+of|hundreds\s+of|thousands\s+of|countless)\s+times\b[^.]{0,30}\b(?:before|already|previously|earlier)\b/i,
];
const PROCESS_EN_LOOSE = [
  /\b(?:had|has)\s+been\s+(?:running|going|building\s+up|practicing|practising|playing|working|trying|rolling|drawing|spinning|accumulating)\s+(?:for|since)\s+(?:years|hours|days|weeks|months|ages|decades|a\s+long\s+time)\b/i,
  /\b(?:thousands|hundreds|dozens|countless|numerous|many)\s+of\s+(?:hours|attempts|tries|times|practices|failures|draws|rolls|spins|shots|rehearsals)\b/i,
];

// ─── 推断标记（LOOSE 形腿②的承重条件）────────────────────────
const INFER_ZH = /(?:肯定|一定|必然|想必|可见|说明|意味着|显然|注定|少不了|不知道|早已|早就|已经|背后|之前|前面|此前|事先|暗地里|说白了|足见|因而|因此|所以|那就|相当于|无非|也就是说|即是|可见)/;
const INFER_EN = /\b(?:so|therefore|thus|which\s+means|that\s+means|implies|hence|consequently|must|clearly|obviously|evidently|apparently|surely|certainly|suggest\w*|indicat\w*|shows?|proves?|means)\b/i;

// ─── 距离窗 ───────────────────────────────────────────────────
const W_FIRST_OUT_ZH = 16;   // 腿① 首次标记 → 结果词
const W_FIRST_OUT_EN = 60;
const W_PAIR_ZH = 60;        // 腿① → 腿②
const W_PAIR_EN = 180;
const PRE_ZH = 10;           // 腿②前史否定守卫窗
const PRE_EN = 26;

// ─── 因果守卫：过程被说成结果的原因（正向归因，非倒推）────────
const CAUSAL_ZH = /(?:因为|由于|归功于|得益于|离不开|多亏了|全靠|正是因为|是由于|就在于|凭的是|靠的是|源自|源于|来自|是[^。；，]{0,10}的(?:体现|结果|回报|积累|功底|沉淀|底气))/;
const CAUSAL_EN = /\bbecause\b|\bthanks\s+to\b|\bdue\s+to\b|\bowing\s+to\b|\battribute[ds]?\s+to\b|\bas\s+a\s+result\s+of\b|\bstems?\s+from\b|\bwhich\s+is\s+why\b|\barose\s+from\b|\bwas\s+the\s+result\s+of\b/i;

// ─── 否定守卫 ─────────────────────────────────────────────────
const NEG_BEFORE_ZH = /(?:不能|不可|不应|不该|不准|无法|并不能|并未|并没有|不是|算不上|并非|未必|不等于|不代表|说明不了|证明不了|尚待|并不会|不属于|不影响|不改变|绝不|从不|永不|不再|不会|没|未|无|非|别|甭)[^。，！？；\n]{0,4}$/;
const NEG_BEFORE_EN = /\b(?:not|never|no|cannot|can'?t|doesn'?t|does\s+not|don'?t|didn'?t|isn'?t|aren'?t|won'?t|hardly|without|nor|neither)\b[^.]{0,14}$/i;
const NEG_INSIDE_ZH = /(?:不能|不可|不应|不该|不准|无法|并不能|并未|并不是|不是|算不上|并非|未必|不等于|不代表|说明不了|证明不了|尚待|并不会|不属于|不影响|不改变|绝不|从不|永不|不再|别|甭|而非|而不是)/;

// ─── 豁免：概念讨论 ───────────────────────────────────────────
const CONCEPT_ZH = /(?:逆赌徒|赌徒谬误|蒙特卡洛谬误|过程长度|长度倒推|由果推因|倒推|倒果为因|概率论|数理统计|统计学|大数定律|随机过程|独立事件|样本空间|教科书|教材|课堂|讲义|论文|文献|谬误|认知偏误|思维陷阱|案例分析|悖论)/;
const CONCEPT_EN = /inverse\s+gambler|gambler'?s\s+fallacy|monte\s+carlo\s+fallacy|\bHacking\b|process\s+length|backward\s+inference|inferring\s+the\s+past|probability\s+theory|law\s+of\s+large\s+numbers|random\s+process|textbook|lecture|fallacy|misconception|cognitive\s+bias|reasoning\s+error/i;

// ─── 豁免：正当做法（承认运气/指出无法反推/要求独立记录）────────
const CORRECTIVE_ZH = /(?:只是运气|纯属偶然|只是偶然|运气好|不能据此|无从推断|无法反推|不能反推|倒推不了|推不出来|没有必然联系|说明不了|证明不了|说明不了过程|过程长短|需要另外|另行统计|单独查证|得看|要看|不能只凭|不能单看|不足以|未必|不一定|不见得|取决于|还要看|也要看|交叉验证|独立(?:记录|验证|证据))/;
const CORRECTIVE_EN = /\bjust\s+(?:luck|lucky|a\s+coincidence)\b|\bmere\s+(?:luck|coincidence)\b|\bcan'?t\s+(?:be\s+)?(?:infer|conclude|assume|tell)\b|\bcannot\s+(?:be\s+)?(?:infer|conclude|assume|tell)\b|\bdoes\s+not\s+(?:imply|mean|tell|show)\b|\bdo\s+not\s+(?:imply|mean|tell|show)\b|\btells?\s+us\s+nothing\b|\bnot\s+enough\s+(?:to|information)\b|\bno\s+basis\s+to\s+(?:infer|conclude)\b|\bunwarranted\b|\bnot\s+warranted\b|\bseparately\b|\bindependent(?:ly)?\s+(?:record|verify|check)\b|\bcheck\s+the\s+(?:record|history|log)\b|\bhow\s+long\s+the\s+process\b/i;

// ─── 对冲（概率化结论不作谬误判定）────────────────────────────
const HEDGE_ZH = /(?:可能|也许|或许|大概|似乎|好像|说不定|未必|不一定|有待|仍需|通常|一般来|多数情况下|往往|大概率|说不定|保不准|难说)/;
const HEDGE_EN = /\b(?:maybe|perhaps|might|probably|possibly|seems|appears|typically|usually|generally|in\s+most\s+cases|tends?\s+to|often|likely)\b/i;
// 疑问软化（真疑问句由 HEDGE/疑问族豁免；反问断言仍由判据结构承接）
const INTERROGATIVE = /(?:是不是|是否|会不会|能否|有没有|能不能|可不可能|难不成|该不会|未必|难道)/;

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

function matchAliveZh(text, x, R) {
  if ((R.NEG_INSIDE_ZH || NEG_INSIDE_ZH).test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - PRE_ZH), x.idx);
  if ((R.NEG_BEFORE_ZH || NEG_BEFORE_ZH).test(before)) return false;
  return true;
}
function matchAliveEn(text, x, R) {
  const before = text.slice(Math.max(0, x.idx - PRE_EN), x.idx);
  if ((R.NEG_BEFORE_EN || NEG_BEFORE_EN).test(before)) return false;
  return true;
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

function collect(list, text, isZh, R) {
  R = R || {};
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (isZh ? matchAliveZh(text, x, R) : matchAliveEn(text, x, R)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 腿①：首次标记 × 罕见幸运结果，近距共现；返回合并跨度
function firstResultLegs(text, isZh, R) {
  const firstList = isZh ? (R.FIRST_ZH || FIRST_ZH) : (R.FIRST_EN || FIRST_EN);
  const outList = isZh ? (R.OUTCOME_ZH || OUTCOME_ZH) : (R.OUTCOME_EN || OUTCOME_EN);
  const win = isZh ? (R.W_FIRST_OUT_ZH != null ? R.W_FIRST_OUT_ZH : W_FIRST_OUT_ZH) : (R.W_FIRST_OUT_EN != null ? R.W_FIRST_OUT_EN : W_FIRST_OUT_EN);
  const firsts = collect(firstList, text, isZh, R);
  const outs = collect(outList, text, isZh, R);
  const spans = [];
  for (const f of firsts) {
    for (const o of outs) {
      const d = dist(f, o);
      if (d > win) continue;
      spans.push({ idx: Math.min(f.idx, o.idx), end: Math.max(f.end, o.end), first: f.raw, outcome: o.raw, raw: f.raw + (o.raw && o.raw !== f.raw ? ' ' + o.raw : '') });
    }
  }
  // 去重（同一 first 多条 outcome 只留最前一条）
  const seen = new Set();
  const out = [];
  for (const s of spans.sort((a, b) => a.idx - b.idx || a.end - b.end)) {
    const k = s.first + '|' + s.idx;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

// 腿②：过程长度/尝试次数推断。tight = 自身即推断形；loose = 另需推断标记。
function processLegs(text, isZh, R) {
  const tight = isZh ? (R.PROCESS_ZH_TIGHT || PROCESS_ZH_TIGHT) : (R.PROCESS_EN_TIGHT || PROCESS_EN_TIGHT);
  const loose = isZh ? (R.PROCESS_ZH_LOOSE || PROCESS_ZH_LOOSE) : (R.PROCESS_EN_LOOSE || PROCESS_EN_LOOSE);
  const out = [];
  for (const x of collect(tight, text, isZh, R)) out.push({ x, tight: true });
  for (const x of collect(loose, text, isZh, R)) out.push({ x, tight: false });
  return out;
}

/**
 * 逆赌徒谬误签名：单次罕见结果 × 过程长度推断，且过程推断出现在结果之后。
 */
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    { lang: 'zh', pair: R.W_PAIR_ZH != null ? R.W_PAIR_ZH : W_PAIR_ZH },
    { lang: 'en', pair: R.W_PAIR_EN != null ? R.W_PAIR_EN : W_PAIR_EN },
  ];
  for (const L of langs) {
    const isZh = L.lang === 'zh';
    const results = firstResultLegs(text, isZh, R);
    if (results.length === 0) continue;
    const procs = processLegs(text, isZh, R);
    if (procs.length === 0) continue;
    const causalRe = isZh ? ((R && R.CAUSAL_ZH) || CAUSAL_ZH) : ((R && R.CAUSAL_EN) || CAUSAL_EN);
    const inferRe = isZh ? ((R && R.INFER_ZH) || INFER_ZH) : ((R && R.INFER_EN) || INFER_EN);
    for (const r of results) {
      for (const p of procs) {
        // 腿②必须在腿①之后（由果溯因）；零距重叠不成交距对
        if (p.x.idx < r.end) continue;
        const d = p.x.idx - r.end;
        if (d > L.pair) continue;
        // 因果守卫：两腿之间出现因果标记 → 正向归因，不判
        const between = text.slice(r.end, p.x.idx);
        if (causalRe.test(between)) continue;
        // LOOSE 形腿②须在两腿之间另见推断标记（区分「确实练了十年」与「肯定练了十年」）
        if (!p.tight && !inferRe.test(between)) continue;
        sigs.push({ lang: L.lang, result: r, process: p.x });
      }
    }
  }
  // 即时成功复合形（英文 / 中文）
  const immEn = (R.IMMEDIATE_EN || IMMEDIATE_EN);
  const immZh = (R.IMMEDIATE_ZH || IMMEDIATE_ZH);
  if (immEn.test(text)) sigs.push({ lang: 'en', result: { raw: 'immediate success' }, process: { raw: 'must have been …' } });
  if (immZh.test(text)) sigs.push({ lang: 'zh', result: { raw: '即时成功' }, process: { raw: '过程长度推断' } });
  return sigs;
}

/**
 * 逆赌徒谬误签名：单次罕见结果 × 过程长度推断 近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectInverseGamblersFallacy(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（逆赌徒谬误/赌徒谬误/过程长度倒推/概率论教学句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：承认运气/指出无法反推/要求独立记录
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：对冲与疑问软化
  if ((R.HEDGE_ZH || HEDGE_ZH).test(text) || (R.HEDGE_EN || HEDGE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.INTERROGATIVE || INTERROGATIVE).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.74 : 0.66;
  return {
    hit: true,
    dimension: 'inverse_gamblers_fallacy',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '单次结果「' + (x.result.raw || '') + '」× 过程长度推断「' + (x.process.raw || '') + '」'
      : 'single result "' + (x.result.raw || '') + '" x process-length inference "' + (x.process.raw || '') + '"')),
    details: s.lang === 'zh'
      ? '逆赌徒谬误(' + sigs.length + '处: 由一次罕见结果「' + (s.result.raw || '') + '」反推过程已持续很久/尝试很多次「' + (s.process.raw || '') + '」，把单次观测当成了过程历史的读数)(zh)'
      : "inverse gambler's fallacy(" + sigs.length + 'x: single rare result "' + (s.result.raw || '') + '" used to infer that the process had been running for a long time "' + (s.process.raw || '') + '")(en)',
    guidance: '逆赌徒谬误指由一次罕见/幸运/出色的结果，反推产生它的过程已经持续了很久或已经尝试了很多次（the inverse gambler\'s fallacy，Hacking 1987 命名）——他一上场就进球，肯定是个身经百战的老将 / 第一把就出金，这池子前面肯定垫了很久 / 第一次开口就说到重点，这人肯定练了十年 / 刚开张就客流不断，说明这片市场他们早就铺垫了很久 / He scored on his first shot, so he must have been playing for years / It worked the very first time, so the process must have been running long before we arrived / The rookie scored on debut, which means he must have put in thousands of hours already。单次结果与过程长度之间没有推论关系：一次进球说明不了他打了多少年，一发入魂说明不了奖池被垫了多少次。它与赌徒谬误是一对镜像——赌徒谬误由过程长度推下一次结果，逆赌徒谬误由一次结果推过程长度，两者都错在把随机过程的历史当成可由单次观测读出的量。请补上论证：给出过程长度的独立证据（训练记录、开奖历史、经营台账），或明确这只是运气与巧合，不要用编造的过去给现在背书。把过程说成成功的原因（因为他准备了很久）、承认运气、指出无法反推、要求独立记录，都是正当做法；若这段话只是转述他人的谬误案例或统计教学，核实其主张再决定是否采信。',
    tags: ['statistics', 'probability', 'inverse-gamblers-fallacy', 'gamblers-fallacy', 'process-length', 'backward-inference', 'cognitive-bias', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectInverseGamblersFallacy,
  __internals: () => ({
    FIRST_ZH, OUTCOME_ZH, FIRST_EN, OUTCOME_EN,
    IMMEDIATE_ZH, IMMEDIATE_EN,
    PROCESS_ZH_TIGHT, PROCESS_ZH_LOOSE,
    PROCESS_EN_TIGHT, PROCESS_EN_LOOSE,
    INFER_ZH, INFER_EN,
    W_FIRST_OUT_ZH, W_FIRST_OUT_EN, W_PAIR_ZH, W_PAIR_EN, PRE_ZH, PRE_EN,
    CAUSAL_ZH, CAUSAL_EN,
    NEG_BEFORE_ZH, NEG_BEFORE_EN, NEG_INSIDE_ZH,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    HEDGE_ZH, HEDGE_EN, INTERROGATIVE,
  }),
};
