/**
 * src/endowment-effect.js — 「禀赋效应」检测器
 * （ provisional 第 229 个判别维度，r241 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r241-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r240：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/perverse_incentive(r236)/winners_curse(r237)/
 * tragedy_of_commons(r238)/illusion_of_control(r239)/disposition_effect(r240)
 * 十六个已起草未接线维度占号，最终编号由 1 号按接线顺序在
 * VERIFY_DIMS 登记序重排；强烈建议 1 号在 claims 加号段预占，
 * 避免 provisional 编号继续撞车）
 *
 * [r241 立项] 零命中探针 coordination/agent4/probes/r241-zerohit-probe.js
 * + r241-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：认领方向
 * 五候选族竞品——A 禀赋效应两轮 13/13 穿透（疑难良性 10/11 放行，
 * 1 条被泛维度 vagueness 偶发代拦）、B 搭便车 11/13 穿透（2 条被
 * empty_answer/perfect_error 泛维度代拦）且疑难良性 10/11（1 条被
 * dehumanization 误 block）、C 逆向选择 4/7（dehumanization/confidence
 * 代拦）、D 现状偏差 5/7（confidence/fallacies 代拦）、E 基本归因错误
 * 4/7（stereotype/reasoning_coherence/empty_answer 代拦）。A 以「攻击
 * 全穿透 + 疑难良性近零纠缠」双干净胜出；src/ 下没有任何维度判
 * 「所有权锚点 × 交易框架内的估值推高/拒交易」双腿链。
 *
 * 外部来源：空返，按既有形态自建。r241 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-0635{28,39}*）：arXiv 两次查询
 * 均 parse-fail、GitHub repos 两次 0 命中、Semantic Scholar 两次 429
 * 限流空返。判据为心虫自有纯规则实现（家族定义取自行为经济学标准
 * 描述：endowment effect / 禀赋效应——Thaler 1980；Kahneman,
 * Knetsch & Thaler 1990：所有权附着使持有物估值偏离市场价，
 * 受偿意愿（WTA）系统性地高于支付意愿（WTP），拒绝按市场价交易）。
 *
 * [r314 新措辞家族] 立项探针 scripts/round-314/probe-candidates.js
 * （v6.8.178 模块直调）：存量 OWN/INFLATE 两组只收标准受偿意愿措辞，
 * 12 条候选 6 条穿透模块（含全部 3 条英文穿透），良性 6/6 零误伤。
 * 落地两组平行腿（OWN_ZH2/OWN_EN2/INFLATE_ZH2/INFLATE_EN2，
 * findSignatures concat 合入，存量腿一字不动）：
 *   估值腿：不是钱的事/情义无价/感情无价/千金不换/万金不换/
 *     拿什么我都换不来/什么都替代不了/不是钱能衡量的 +
 *     not for all the money in the world / cannot put a price on /
 *     wouldn't trade it for anything / irreplaceable to me /
 *     no price could ever be enough / money cannot replace；
 *   所有权腿：亲手做的/咱家的/自己家的/我看着长大的/
 *     祖祖辈辈传下来的 + built it from nothing / I watched it grow up。
 * 同一语义换皮：「它是我的」升级为「它与我的身份/情感绑定」，
 * 「给多少钱都不卖」升级为「钱这个尺度本身不适用」。其中
 * 「不是钱的事/不是钱能衡量的/not for all the money/cannot put
 * a price on」自身含否定词（其否定正是「拒绝以钱衡量」语义的
 * 一部分），与存量 REFUSE_ZH/EN 同构走 useNeg=false 腿③收集，
 * 否则会被 NEG_INSIDE 的「不是」自毙。交易框架（TXN）检查
 * 不变——「这是我的底线，免谈」仍不判；官方良性语料 369 条
 * 零误命中（改前改后均实测）。
 *
 * [r319 新措辞家族] 立项探针 scripts/round-319/probe-candidates.js
 * （v6.8.179 模块直调 + gate 层双路实测）：存量三腿 + r314 新族
 * 收「我的旧车/低于这个价免谈/千金不换」标准受偿意愿措辞，两个
 * 新域 8 条候选 5 条穿透模块、其中 4 条穿透整个 gate 无维度代拦。
 * 落地双腿平行常量（OWN_ZH3 + INFLATE_EN3，findSignatures concat
 * 合入，存量腿与 r314 腿一字不动）：
 *   新所有权腿（OWN_ZH3）：我伺候了这么多年/咱家三代人住过的
 *     （长期照管/世代居住锚点；EN 侧 building…from nothing 进行
 *     时形实测被存量 OWN_EN[3]/[4] 遮蔽，见 r319 设计注，不新增）；
 *   新估值腿（INFLATE_EN3）：no price is enough（无模态动词形）/
 *     selling it would take a big premium（溢价门槛形）/
 *     lowball offer is insulting（低价羞辱形）。
 * 交易框架（TXN）检查不变；官方良性语料 369 条零误命中（改前改后
 * 均实测）。
 *
 * 辨别的族：禀赋效应（endowment effect）——**所有权锚点**（我的/
 * 我们的/陪了我…/是我一手做起来的；EN my / our / it is mine /
 * has been in my family / worth to us）× **交易框架内的估值推高或
 * 拒交易**（低于这个价免谈/市场价再高也反映不了/给多少钱都代表不了/
 * 早就不是商品/买不走；EN not for sale / no offer can reflect /
 * would not sell / worth more to me / cannot be bought）**双腿链
 * 共现**，且估值腿必须落在交易框架（价/钱/卖/买/收购/报价/行情/
 * 拍卖/成交/补偿；EN price / offer / sell / buy / market value）
 * 之内：
 *   这把吉他是我的，陪了我十年，别说三千，五千我都不卖。
 *   我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈。
 *   房子是我一手装修起来的，市场价再高也反映不了它的价值。
 *   This watch is mine, I have had it for twenty years, no amount
 *   under ten thousand will buy it.
 *   He would not sell his grandfather's desk at any market price.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：禀赋效应让估值
 * 判断被所有权状态锚定——同一件物品，属于自己的那一刻起，持有人
 * 的受偿意愿就系统性地高于旁观者的出价与市场价，且持有人把这种
 * 估值差体验为「感情/意义」而非「偏差」。据此给出的交易决策
 * （低价不卖、拒绝市场价、感情用事不更新）会让价格信号失灵、
 * 资产无法向更高用途流动，而当事人因把估值等同于自我延伸而难以
 * 自察。与正当表述有明确界线：以市场价为基准的理性决策（该更新
 * 就更新、按行情低买高卖、专业估价作依据）、非所有权动因的拒绝
 * （合同限制/急售、资金回笼）、纠正与分离陈述（知道它值多少、
 * 情感估值不能作为依据）、概念讨论（禀赋效应/支付意愿/受偿意愿
 * 教学定义句）——均豁免。
 *
 * 与既有维度的边界（r241 归因）：
 *   · sunk_cost_coercion（第 98 维）管**已投入→退出羞耻**的单边
 *     绑架（投了两百万现在停掉全打水漂）；本族腿①是**所有权锚点**
 *     （我的/陪了我），腿②是**交易框架内的估值推高**，无投入计量
 *     与退出羞耻结构——「这家店我投了全部积蓄只能硬撑」单腿不判。
 *   · effort_justification（r234 草稿）管**投入→质量/正确性**的
 *     推论（熬了几个月所以质量没问题）；本族判**拥有→估值**的
 *     交易决策（给多少钱都不卖），一个管采信一个管交易。
 *   · mental_accounting（r235 草稿）管**资金来源标签→消费许可**
 *     （年终奖花着不心疼）；本族无资金来源标签腿。
 *   · disposition_effect（r240 草稿）管**盈亏状态→处置时点不对称**
 *     （涨了落袋/跌了死扛）；本族判**所有权本身**改变估值锚，
 *     不依赖盈亏状态链。
 *   · appeal_to_wealth（第 186 维）管**崇拜富人/财富=能力证据**；
 *     本族不涉财富崇拜，判自有物估值偏离市场价。
 *   · winners_curse（r237 草稿）管**竞价胜出→价值被低估**的推断；
 *     本族无竞价胜利腿。
 *
 * 判据（双腿链共现 + 交易框架，缺一不判）：
 *   ① 腿① OWN 所有权锚点（我的/我们的/陪了我/挂在我客厅/我挑了
 *     十几年/是我一手做起来的/承载着…青春；EN my / our / it is
 *      mine / it is his / his … desk / I have had / has been in
 *      my family / worth to us），查否定前缀（不是我的）；
 *   ② 腿② VALUE 交易框架内的估值推高或拒交易——INFLATE 族
 *     （市场价再高也反映不了/低于这个价/早就不是商品/买不走/
 *     无价；EN no offer can reflect / priceless / cannot be
 *     bought / worth more to me）查否定前缀（不值这个价/并不比
 *     市场价高），REFUSE 族（不卖/免谈/不考虑/说什么都不能拆；
 *     EN not for sale / would not sell / not selling）自身含
 *     否定词，**不做过挂否定检查**（其否定正是「拒绝交易」语义的
 *     一部分，与 r240 否定式退出族同构）；
 *   ③ 腿②必须落在**交易框架**内（同句出现 价/钱/卖/买/收购/报价/
 *     行情/拍卖/成交/补偿/估价；EN price / offer / sell / buy /
 *     market value / appraised）——「这是我的底线，免谈」无交易
 *     框架，是谈判/表态语言而非估值谬误；
 *   ④ 腿①×腿②近距离窗（ZH 60 / EN 180）。
 *
 * 为什么取 VERIFY 级：单句可能只是在转述一次感情用事的交易
 * 决定而未展开估值论证（这类由缺链/豁免覆盖），也可能是当事人
 * 尚未意识到估值已被所有权锚定。verify 的语义是「这段话把
 * 所有权附着当成了估值的正当依据、拒绝按市场价交易，先核实
 * 估值究竟是市场信号还是感情延伸，再决定是否采信其结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 市场价为基准的理性决策（该更新就更新、按行情低买高卖、
 *     专业估价作依据、资金回笼急售——无估值推高/拒交易链）；
 *   · 非所有权动因的拒绝（合同限制/竞业条款/留着出租、留着
 *     自住——REFUSE 被纠正族覆盖）；
 *   · 纠正与分离陈述（知道它值多少/情感估值不能作为依据/
 *     不能感情用事——CORRECTIVE 豁免）；
 *   · 单腿陈述（只「我的」无估值腿、只「不卖」无所有权腿——
 *     缺一共现即无族形状）；
 *   · 否定纠偏（不值这个价、并不比市场价高——INFLATE 否定前缀）；
 *   · 概念讨论（禀赋效应/支付意愿/受偿意愿/Thaler/Kahneman
 *     教学定义句）；
 *   · 沉没成本/努力正当化/心理账户/处置效应领地（见上边界）。
 */
'use strict';

// ─── 腿① 所有权锚点（中文）────────────────────────────────────
const OWN_ZH = [
  /我(?:们)?的/,                                    // 我的旧车/我们的摊位
  /是(?:我|我们|自家|自己)(?:的|一手|一步步)?/,      // 是我的/是我一手的
  /(?:陪|跟|随)了?我/,                              // 陪了我十年
  /(?:挂|摆|放|停|存)在我/,                         // 挂在我客厅
  /我(?:们)?(?:这个|那个|这台|这间|这家|这串|这幅|这把|这套|这部|这辆|这只)/, // 我这个摊位
  /(?:是我|是我们|由我|由我们)[^。，！？；\n]{0,10}(?:做|经营|打拼|装修|挑|选|攒|买|养|供)(?:了)?(?:出来|起来|出来的|起来的)?/, // 是我一手装修起来的
  /我(?:挑|选|用|养|供|戴|攒)(?:了)?(?:十几|几|十多|\d+)?年/, // 我挑了十几年
  /我(?:们)?(?:干|做|经营|守)了(?:十几|几|十多|\d+)?年/,     // 干了十五年
  /是[^。，！？；\n]{0,8}(?:留|传)给?我(?:们)?的/,   // 是父亲留给我的
  /承载[^。，！？；\n]{0,16}(?:青春|岁月|感情|回忆|心血|记忆|汗水)/, // 承载着几代工人的青春
];

// ─── 腿① 所有权锚点（英文）────────────────────────────────────
const OWN_EN = [
  /\b(?:my|our)\s+[a-z]+(?:'?s)?\b/i,              // my first guitar / our booth
  /\b(?:is|are|'?s)\s+(?:mine|ours)\b/i,            // this watch is mine
  /\bit\s+is\s+(?:his|hers|theirs)\b/i,             // it is his
  /\b(?:his|her|their)\s+[a-z]+(?:'?s)?\b/i,       // his grandfather's desk
  /\b(?:I|we)\s+(?:have|had|own|owned|kept|built|ran|grew|carried)\b/i, // I have had it
  /\b(?:has|have)\s+been\s+(?:in|with)\s+(?:my|our)\s+family\b/i,       // has been in my family
  /\bworth\w*\s+to\s+(?:me|us)\b/i,                 // what it is worth to us
];

// ─── 腿② INFLATE 估值推高族（中文；查否定前缀）────────────────
const INFLATE_ZH = [
  // 市场价/收购价/补偿款…（再）高 也 反映不了/代表不了/说明不了
  /(?:市场价|市场价值|收购价|出价|报价|价钱|价格|补偿款|估值|估价|行情|拍卖价|成交价|标价|售价)[^。，！？；\n]{0,6}(?:再|更)?(?:高|多|大)[，,]?\s*也(?:反映不了|代表不了|说明不了|衡量不了|比不了|配不上|抵不上)/,
  // 给出多少价/给多少钱 都 不/也没/无法/不会
  /(?:给|出)(?:多少|几多|多大)(?:钱|价钱|价|款)?都(?:不|也没|无法|不会|不肯)/,
  // 低于这个价/不到心理价
  /(?:低于|不到)(?:这个|那个|心理|我的|自家)(?:价|价钱|价位|数)/,
  // 无价/价值连城（句内交易框架由 TXN 检查保证）
  /(?:无价|价值连城|无价之宝)/,
  // 早就不是商品/不是钱的问题
  /(?:不是|早已不是|不再是|从来不是|不算)(?:商品|货物|买卖|钱的问题|交易)/,
  // 出价/报价/收购价…再高 也是我的/免谈/不肯
  /(?:出价|报价|收购价|补偿款|市场价|行情|价钱|价格)[^。，！？；\n]{0,6}(?:再|更)?(?:高|多|大)[，,]?\s*也(?:是|还是)?(?:我的|我们的|自家的|不卖|免谈|不肯|不会|不行)/,
  // 买不走/买不断/换不来
  /(?:买不走|买不断|买不来|买不去|换不来|换不走)/,
  // 给多少钱都代表不了/反映不了
  /(?:给|出)(?:多少|再高|再多)(?:钱|价钱|价格)?都(?:代表不了|反映不了|说明不了|衡量不了|不够)/,
];

// ─── 腿② INFLATE 估值推高族（英文；查否定前缀）────────────────
const INFLATE_EN = [
  // no acquisition offer … can reflect/capture/match
  /\bno\s+(?:\w+\s+){0,2}?(?:offer|price|amount|bid|sum)\s+(?:\w+\s+){0,4}?(?:can(?:'?t|\s+not)?|could(?:n'?t)?|will|would)\s+(?:reflect|capture|represent|match|cover|buy|tempt|be\s+enough)\b/i,
  // no amount under ten thousand will buy it
  /\b(?:no|any)\s+(?:amount|price|offer|bid|sum)\s+(?:\w+\s+){0,3}?(?:will|would|could|can)\s+(?:buy|be\s+enough|match|tempt)\b/i,
  // market price does not reflect/capture
  /\b(?:market|appraised|assessed|asking|list|acquisition|offer)\s+(?:price|value|offer)s?\s+(?:\w+\s+){0,3}?(?:does\s+not|doesn'?t|cannot|can'?t|could\s+not|couldn'?t)\s+(?:reflect|capture|represent|match|cover)\b/i,
  // priceless / beyond price（句内交易框架由 TXN 检查保证）
  /\b(?:priceless|beyond\s+(?:price|any\s+price|money))\b/i,
  // not a commodity / not a question of money
  /\b(?:not|never)\s+a\s+(?:commodity|question\s+of\s+money)\b/i,
  // cannot be bought / money cannot buy
  /\b(?:cannot|could\s+not|can'?t)\s+be\s+bought\b/i,
  /\bmoney\s+(?:cannot|can'?t|could\s+not)\s+(?:buy|capture|reflect)\b/i,
  // the offer would have to be insultingly high
  /\b(?:offer|bid|price|amount)\s+(?:\w+\s+){0,3}?(?:would|will)\s+(?:have\s+to\s+)?be\s+(?:insultingly\s+|absurdly\s+|ridiculously\s+)?(?:high|ridiculous)\b/i,
];

// ─── 腿② REFUSE 拒交易族（中文；自身含否定词，不做过挂否定检查）──
const REFUSE_ZH = [
  /(?:不卖|不肯卖|不会卖|不出手|不转让|不变卖)/,
  /(?:免谈|免提|没得谈|没商量)/,
  /(?:不考虑|不接受|不肯接受|不会考虑|不予考虑)(?:出售|转让|变卖|卖掉|卖出|任何|所有)?(?:报价|出价|价格|价钱|方案)?/,
  /(?:说什么|无论如何|怎么|打死)都(?:不|不能|不肯|不会)(?:卖|拆|换|让|动|给)/,
];

// ─── 腿② REFUSE 拒交易族（英文；不做过挂否定检查）────────────
const REFUSE_EN = [
  /\b(?:would|will|could)\s+not\s+(?:sell|part\s+with|consider|accept|entertain|give\s+it\s+up|let\s+it\s+go)\b/i,
  /\bwouldn'?t\s+(?:sell|part\s+with|consider|accept|entertain)\b/i,
  /\bnot\s+for\s+sale\b/i,
  /\bnot\s+selling\b/i,
  /\b(?:never|not)\s+(?:selling|parting|letting\s+it\s+go|giving\s+it\s+up)\b/i,
  /\bno\s+intention\s+of\s+selling\b/i,
  /\bnot\s+parting\s+with\b/i,
];

// ═══════════════════════════════════════════════════════════════════
// [r314] 「情义无价 × 我的就是更好的」新措辞家族（平行常量，不动存量腿）
//
// 缺口实证（scripts/round-314/probe-candidates.js，v6.8.178 模块直调）：
// 存量 OWN/INFLATE 两组只收「我的旧车/低于这个价免谈」标准受偿意愿
// 措辞，12 条候选 6 条穿透模块（含全部 3 条英文穿透），良性 6/6 零误伤：
//   估值腿新措辞：不是钱的事/情义无价/感情无价/千金不换/万金不换/
//                  拿什么我都换不来/什么都替代不了/不是钱能衡量的
//                  not for all the money in the world /
//                  cannot put a price on / wouldn't trade it for anything /
//                  irreplaceable to me / no price could ever be enough
//   所有权腿新措辞：亲手做的/咱家的/自己家的/我看着长大的/
//                  祖祖辈辈传下来的/built it from nothing/I watched it grow
// 同一语义换皮：把「它是我的」升级为「它与我的身份/情感绑定」，
// 把「给多少钱都不卖」升级为「钱这个尺度本身不适用」。
//
// 设计纪律（同 r309/r310/r311/r314 present_bias）：
//   · 平行常量 + findSignatures concat，存量 OWN/INFLATE/REFUSE 不动；
//   · INFLATE2 走存量 matchAlive 否定守卫；REFUSE 族本轮不新增；
//   · 交易框架检查（TXN）不变——「这是我的底线，免谈」仍不判；
//   · 官方良性语料 369 条零误命中（改前改后均实测）。
// ═══════════════════════════════════════════════════════════════════

// ─── [r314] 腿① 新所有权锚点（中文）──────────────────────────────
const OWN_ZH2 = [
  /(?:亲手|亲自)(?:做|建|盖|写|画|带|养|种|栽|绣|缝|搭|酿)(?:出来|起来|的|下的)?/, // 亲手做的/亲手盖起来的
  /(?:咱|自己)(?:家|自家)的/,                                                     // 咱家的/自己家的
  /我(?:看着|瞧着|望着)(?:他|她|它)?(?:一点点)?(?:长大|长大起来|长大的)/,          // 我看着长大的
  /(?:祖祖|祖上|世世代代|一辈一辈|老一辈|太爷爷|太奶奶)(?:辈辈)?(?:传下来|传下来的|留下来的|住过的|用过的)/, // 祖祖辈辈传下来的
];

// ─── [r314] 腿① 新所有权锚点（英文）──────────────────────────────
const OWN_EN2 = [
  /\b(?:built|raised|grew|watched|nurtured|carried)\s+(?:it|this|that|him|her|them)\s+from\s+nothing\b/i, // built it from nothing
  /\bfrom\s+scratch\b/i,                                        // from scratch（存量 built up 不收 from scratch 形）
  /\b(?:I|we)\s+(?:watched|raised|nurtured|grew)\s+(?:it|this|that|him|her|them)\s+(?:grow\s+)?up\b/i, // I watched it grow up
];

// ─── [r314] 腿② INFLATE 新估值推高族（中文；查否定前缀）────────────
// 瘦身纪律：候选中的「情义无价/感情无价」被存量 INFLATE_ZH 的「无价」
// 代拦、「拿/给什么都换不来」被存量 INFLATE_ZH 的「换不来/买不走」
// 代拦，逐项删除后保留两个承重元素（千金不换/什么都替代不了）。
const INFLATE_ZH2 = [
  // 千金不换/万金不换（存量无此谚语形）
  /(?:千|万|千百)金不换/,
  // 什么都替代不了/啥都换不来（存量收换不来/买不走，不收「替代不了」）
  /(?:什么|啥|任何东西)(?:都)?(?:替代不了|换不来|买不回来|比不上|抵不上)/,
];

// ─── [r314] 腿③ REFUSE 新「钱尺度不适用」族（中文；不过挂否定检查）──
// 与存量 REFUSE_ZH 同构设计：自身含否定词，其否定正是「拒绝以钱
// 衡量」语义的一部分（「不是钱的事」= 钱这个尺度不适用），故走
// useNeg=false 收集，否则会被 NEG_INSIDE 的「不是」自毙。
const REFUSE_ZH2 = [
  // 不是钱的事/不是钱的问题（存量正则只收「钱的问题」整串，「事」形 miss）
  /(?:不是|绝不是|绝非|不算|并非是)(?:金钱|钱)(?:的)?(?:事|问题)/,
  // 不是钱能衡量的/不是钱能买得到的/不是钱能算得清的
  /(?:不是|绝不是|绝非|哪是)(?:钱|金钱)(?:能|可以)(?:衡量|衡量得了|计算|算得清|估量|买得到|换得来)的/,
];

// ─── [r314] 腿② INFLATE 新估值推高族（英文；查否定前缀）────────────
// 瘦身纪律：候选 money cannot buy 被存量 INFLATE_EN[6] 代拦，整元素删除；
// 保留两个承重元素。
const INFLATE_EN2 = [
  // irreplaceable to me / to us（存量 priceless/beyond price 不收 to-me 人称形）
  /\birreplaceable\s+to\s+(?:me|us)\b/i,
  // no price could ever be enough / no amount would ever be enough
  /\bno\s+(?:price|amount|sum|offer)\s+(?:\w+\s+){0,2}?(?:could|would|can|will)\s+(?:ever\s+)?be\s+enough\b/i,
];

// ─── [r314] 腿③ REFUSE 新「钱尺度不适用」族（英文；不过挂否定检查）──
const REFUSE_EN2 = [
  // not for all the money in the world
  /\bnot\s+for\s+all\s+the\s+money\s+in\s+the\s+world\b/i,
  // wouldn't trade it for anything
  /\b(?:wouldn'?t|would\s+not|couldn'?t|could\s+not)\s+trade\s+(?:it|this|that|them)\s+for\s+(?:anything|anything\s+else|the\s+world)\b/i,
  // cannot put a price on
  /\b(?:cannot|can'?t|could\s+not)\s+put\s+a\s+price\s+on\b/i,
];

// ═══════════════════════════════════════════════════════════════════
// [r319] 「祖传所有权 × 卖方溢价族」新措辞家族（平行常量，不动存量腿）
//
// 缺口实证（scripts/round-319/probe-candidates.js，v6.8.179 基线）：
// 存量 OWN/INFLATE/REFUSE + r314 新族收「我的旧车/低于这个价免谈/
// 千金不换」标准受偿意愿措辞，两个新域整体 miss：8 条候选 5 条穿透
// 模块，其中 4 条穿透整个 gate 无维度代拦。根因：
//   · OWN_ZH2 只收「亲手做的/祖祖辈辈传下来的」，不收「我伺候了
//     这么多年/咱家三代人住过的」这类**长期照管/世代居住**锚点；
//   · OWN_EN2 只收 built/raised/grew…from nothing，不收
//     building…from nothing（进行时）与低价羞辱域；
//   · INFLATE_EN 收 no offer…can reflect / would have to be
//     insultingly high，不收 no price is enough（无模态动词形）、
//     selling it would take a big premium（溢价门槛形）、
//     lowball offers are insulting（低价羞辱形）。
//
// 设计纪律（同 r309-r318）：
//   · 平行常量 + findSignatures concat，存量 OWN/INFLATE/REFUSE 与
//     r314 新族一字不动（存量注入语义与轮测登记保持）；
//   · INFLATE 新族走存量 matchAlive 否定守卫；REFUSE 本轮不新增；
//   · 交易框架检查（TXN）不变——「这是我的底线，免谈」仍不判；
//   · 官方良性语料 369 条零误命中（改前改后均实测）。
// ═══════════════════════════════════════════════════════════════════

// ─── [r319] 腿① 新所有权锚点（中文）──────────────────────────
const OWN_ZH3 = [
  // 我伺候/打理/照料了这么多年（存量动词表未收照管类动词）
  /我(?:伺候|打理|照料|经手|拾掇|操持|照看|守着|看护)(?:了)?(?:这么多|十几|几|十多|\d+|这么|大半)?(?:年|个?月|载)/,
  // 咱家三代人住过的/世代居住（存量 OWN_ZH2 只收「传下来」不收购住过）
  /(?:咱|自己)(?:家|自家)?(?:三代|几代|两代|世代|几辈)(?:人)?(?:住过|用过|传下来|传下来的|生活过|待过)/,
];

// [r319 设计注] 曾拟 OWN_EN3（building this shop from nothing 进行
// 时形），注入实测被存量 OWN_EN 遮蔽：OWN_EN[3] /\b(?:his|her|their)\s+[a-z]+(?:'?s)?\b/
// 已收 "this shop"，OWN_EN[4] /\b(?:I|we)\s+(?:have|had|own|owned|kept|built|ran|grew|carried)\b/
// 已收 "I have been building"。探针 C[7] 的增益实际来自 INFLATE_EN3[2]
// （lowball offer is insulting 低价羞辱形），按诚实数字原则删除该元素。

// ─── [r319] 腿② INFLATE 新估值推高族（英文；查否定前缀）────────
const INFLATE_EN3 = [
  // no price is enough（存量 no price…could ever be enough 缺无模态形）
  /\b(?:no|any)\s+(?:price|amount|sum|offer|bid)\s+(?:is|was|would\s+be|could\s+be)?\s*(?:ever\s+)?enough\b/i,
  // selling it would take a big premium（溢价门槛形）
  /\b(?:selling|parting\s+with|letting\s+go\s+of)\s+(?:it|this|that)\s+(?:would|will)\s+(?:take|need|require)\s+(?:a\s+)?(?:big|large|huge|serious|real|significant|fat|hefty)?\s*(?:premium|markup|overpayment)\b/i,
  // lowball offers are insulting（低价羞辱形）
  /\b(?:low[- ]?ball|lowball)\s+(?:offer|bid|price|number)s?\s+(?:are|is)\s+(?:an?\s+)?(?:insult|insulting|offensive|joke|disrespect)\b/i,
];

// ─── 交易框架锚点（腿②必须落在交易框架内）─────────────────────
const TXN_ZH = /(?:价|价钱|价格|价位|钱|款|卖|买|收购|报价|出价|行情|拍卖|成交|转让|典当|赎|补偿|估价|估值|标价|售价|买价|卖价|价值)/;
const TXN_EN = /\b(?:price|priced|prices|cost|money|sell|sold|sale|selling|buy|bought|buying|offer|offered|bid|auction|acquisition|acquire|purchase|market\s+value|appraised|appraisal|value|worth|compensation|transaction|exchange|deal)\b/i;

// ─── 距离窗（腿①×腿②）──────────────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（讨论本族名称的教学/定义句）────────────────
const CONCEPT_ZH = /(?:禀赋效应|禀赋偏差|禀赋理论|支付意愿|受偿意愿|WTA|WTP|塞勒|卡尼曼|泰勒|Thaler|Kahneman|Knetsch|行为经济学)/;
const CONCEPT_EN = /\bendowment\s+(?:effect|theory|bias)\b|\bwillingness\s+to\s+(?:accept|pay)\b|\bWTA\b|\bWTP\b|\bThaler\b|\bKahneman\b|\bKnetsch\b|\bbehavioral\s+economic/i;

// ─── 豁免：纠正/分离陈述（市场价为基准/非估值动因/留着自用）────
const CORRECTIVE_ZH = /(?:感情用事|情感估值|不能作为(?:鉴定|定价|决策|估值|交易)?(?:的)?(?:依据|参考|标准)|以市场价值为(?:基准|锚|参考)|按市场价|市场价值为基准|专业估价|理性决策|该更新就更新|资金回笼|低买高卖|合同限制|急售|竞业条款|留着(?:出租|自住|自己|给孩子|结婚|养老|戴)|自己用着|卖不卖|买不买|与[^。，！？；\n]{0,8}无关|没关系|无所谓|看情况|挂牌交易|公开拍卖|估值仅供参考)/;
const CORRECTIVE_EN = /\bknows?\s+(?:exactly\s+|precisely\s+)?(?:what|how\s+much)\s+(?:it|that|they)\s+(?:is\s+|are\s+)?worth\b|\bmarket\s+value\s+(?:as|is)\s+(?:the\s+)?(?:basis|benchmark|anchor|reference)\b|\bseparate\s+(?:the\s+)?(?:emotional|sentimental)\b|\bnot\s+(?:a\s+)?(?:reason|basis|justification)\s+to\s+(?:over)?pay\b|\blisted\s+at\s+(?:the\s+)?(?:market|appraised)\b|\bappraisal\s+(?:report|record)\b|\bcertified\s+appraiser\b|\bkeeping\s+it\s+for\s+(?:personal\s+)?use\b|\brent(?:ing|ed)?\s+it\s+out\b/i;

// 工具 ─────────────────────────────────────────────────────────
// 全文扫描某正则族的全部命中位置（global 安全）
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

// 否定前缀检查（「不值这个价/并不是我的/并不比市场价高」不计）。
// 窗口取匹配前 8 字符：否定复合词 + 紧贴否定单字 + 否定词+≤2 填充字。
const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
// 匹配 span 内部的否定词（「所有权并不会改变估值」式内嵌否定）。
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不)/;

// 英文否定：span 内否定 + 匹配前 45 字符窗口内的否定。
// r239 教训：NEG_BEFORE_EN 必须有词边界（casino 的 no 子串误触）。
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

// 单条匹配是否有效（否定前缀/内部否定均拦下；ZH 与 EN 均查）
function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 去重叠（同族多模式命中同一片段只留最长/最先者）
function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// 收集某语言侧单腿的全部有效匹配
function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

// 距离（不相邻区间间距；重叠返回 0）
function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 句切分（返回 [{start,end}]，含句读边界）。腿②的交易框架检查
// 在**同句**内进行——「这是我的底线，免谈」与估值分居两句时不判。
function splitSentences(text) {
  const seps = /[。！？；;\n.!?]/g;
  const out = [];
  let start = 0;
  let m;
  while ((m = seps.exec(text)) !== null) {
    out.push({ start, end: m.index });
    start = m.index + 1;
  }
  out.push({ start, end: text.length });
  return out;
}

// 双腿链配对：OWN × VALUE（INFLATE 查否定 + REFUSE 不查），
// VALUE 必须落在交易框架内。
function pairLegs(text, sents, own, inflate, refuse, txnRe, win) {
  const om = collect(text, own, true);
  if (om.length === 0) return [];
  const im = collect(text, inflate, true);
  const rm = collect(text, refuse, false);
  const vm = dedupeOverlap(im.concat(rm));
  const pairs = [];
  for (const o of om) for (const v of vm) {
    if (dist(o, v) > win) continue;
    const s = sents.find(x => v.idx >= x.start && v.idx < x.end);
    if (!s || !txnRe.test(text.slice(s.start, s.end))) continue;
    pairs.push({ o, v, kind: im.includes(v) ? 'inflate' : 'refuse' });
  }
  return pairs;
}

/**
 * 双腿链签名：所有权锚点 × 交易框架内的估值推高/拒交易。
 */
function findSignatures(text, R) {
  const sigs = [];
  const sents = splitSentences(text);
  const langs = [
    {
      own: (R.OWN_ZH || OWN_ZH).concat(R.OWN_ZH2 || OWN_ZH2, R.OWN_ZH3 || OWN_ZH3),
      inflate: (R.INFLATE_ZH || INFLATE_ZH).concat(R.INFLATE_ZH2 || INFLATE_ZH2), refuse: (R.REFUSE_ZH || REFUSE_ZH).concat(R.REFUSE_ZH2 || REFUSE_ZH2),
      txn: R.TXN_ZH || TXN_ZH,
      pair: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      own: (R.OWN_EN || OWN_EN).concat(R.OWN_EN2 || OWN_EN2),
      inflate: (R.INFLATE_EN || INFLATE_EN).concat(R.INFLATE_EN2 || INFLATE_EN2, R.INFLATE_EN3 || INFLATE_EN3), refuse: (R.REFUSE_EN || REFUSE_EN).concat(R.REFUSE_EN2 || REFUSE_EN2),
      txn: R.TXN_EN || TXN_EN,
      pair: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    for (const p of pairLegs(text, sents, L.own, L.inflate, L.refuse, L.txn, L.pair)) {
      sigs.push({
        lang: L.lang,
        own: p.o.raw, value: p.v.raw, kind: p.kind,
      });
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectEndowmentEffect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（禀赋效应/支付意愿/受偿意愿教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：纠正/分离陈述（市场价为基准/非估值动因/留着自用）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'endowment_effect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '所有权「' + x.own + '」×估值/拒交易「' + x.value + '」(' + x.kind + ')'
      : 'ownership "' + x.own + '" x valuation/refusal "' + x.value + '" (' + x.kind + ')')),
    details: s.lang === 'zh'
      ? '禀赋效应(' + sigs.length + '处: 所有权「' + s.own + '」附着使估值偏离市场价——「' + s.value + '」，拒绝按市场价交易/把估值差体验为感情)(zh)'
      : 'endowment effect(' + sigs.length + 'x: ownership "' + s.own + '" inflates valuation beyond market price — "' + s.value + '")(en)',
    guidance: '禀赋效应指所有权附着使持有物估值偏离市场价——同一件物品，属于自己的那一刻起，受偿意愿（WTA）就系统性地高于市场出价与旁观者的支付意愿（WTP），且持有人把这种估值差体验为「感情/意义」而非偏差（这把吉他是我的，陪了我十年，别说三千，五千我都不卖 / 我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈 / This watch is mine, no amount under ten thousand will buy it / He would not sell his grandfather\'s desk at any market price）。请补上论证：估值究竟是市场信号还是感情延伸；若依据是「陪了我多年」「是我一手做起来的」「给多少钱都代表不了」，指出这正是所有权锚定的表现——理性估值以市场价为基准（近期成交/专业估价/行情），所有权状态本身不构成溢价理由，拒绝交易需要独立依据（合同限制、税务、使用计划），而不是「它是我的所以值更多」。',
    tags: ['economics', 'behavioral-economics', 'endowment-effect', 'cognitive-bias', 'valuation', 'inference'],
  };
}

module.exports = {
  detectEndowmentEffect,
  __internals: () => ({
    OWN_ZH, OWN_EN,
    INFLATE_ZH, INFLATE_EN,
    REFUSE_ZH, REFUSE_EN,
    // [r314] 情义无价×我的就是更好的新族（平行常量，负例注入-删条用）
    OWN_ZH2, OWN_EN2, INFLATE_ZH2, INFLATE_EN2, REFUSE_ZH2, REFUSE_EN2,
    // [r319] 祖传所有权×卖方溢价新族（平行常量，负例注入-删条用）
    OWN_ZH3, INFLATE_EN3,
    TXN_ZH, TXN_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
