/**
 * src/winners-curse.js — 「赢家诅咒」检测器
 * （ provisional 第 225 个判别维度，r237 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r237-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r236：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/perverse_incentive(r236) 十二个已起草未接线
 * 维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r237 立项] 零命中探针 coordination/agent4/probes/r237-zerohit-probe.js
 * + r237-wc-probe.js + r237-draft-coverage.js（v6.8.145 gate() 全量
 * findings 实测）：认领方向四候选族竞品——A 自动化偏误、B 破窗谬误、
 * C 零和谬误三族探针攻击穿透率分别为 6/7、3/4、4/4，但 src/ 下
 * automation-bias.js(r231)/broken-window-fallacy.js(r230)/
 * zero-sum-fallacy.js(r218) 三个草稿模块已存在，再起草属重复而非新
 * 维度，三族整体落选；D 赢家诅咒攻击 7/10 完全穿透（余 3 条为
 * confidence/pseudo_causal 泛维度偶发代拦，无任何维度以「竞价胜利
 * × 价值推断」双腿语义承重），src/ 下无任何 winner/curse/auction
 * 相关文件——D 胜出。
 *
 * 外部来源：空返，按既有形态自建。r237 海外扫描（原始证据
 * coordination/agent4/scout/*20261106-2343{32,39}*）：arXiv 两次
 * OR 噪声查询均 parse-fail、GitHub 0 命中、Semantic Scholar 429
 * 限流空返。判据为心虫自有纯规则实现（家族定义取自拍卖理论/行为
 * 经济学的标准描述：winner's curse / 赢家诅咒——共同价值拍卖里
 * 赢家恰是估值最乐观者，竞标胜利本身是「出价过高」的证据而非
 * 「标的物值这个价」的证据）。
 *
 * 辨别的族：赢家诅咒（winner's curse）——**竞价/招标/拍卖胜利**
 * （中标/竞得/拍得/竞标成功/排名第一/赢下拍卖/outbid）× **价值
 * 或判断力推断**（说明这块地值这个价/证明估值合理/判断得到验证/
 * 捡了漏/市场认可这个价格/性价比最高；EN confirms the asset is
 * worth / proves our price was fair / our judgment was validated /
 * clearly undervalued）双腿共现：
 *   竞标赢了说明这块地就值这个价，我们的判断得到了验证。
 *   这次中标证明我们的报价是合理的，业主认可这个成本。
 *   能拍下这幅画，说明它确实被低估了，我们捡了漏。
 *   We won the auction, which confirms the asset is worth what we paid.
 *   Winning the bid proves our price was fair and the client accepted the cost.
 *   We outbid everyone, so the painting was clearly undervalued—a real bargain.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：在共同价值场景
 * 里，竞价胜利携带的是关于「竞争者估值分布」的信息而非「标的物
 * 价值」的信息——赢家之所以赢，往往因为没人比我们更乐观。把
 * 「赢了」当「值」的证据，是用竞价的运气给估值盖章，接下来
 * 的一切加价、抄底、扩表决策都建立在最乐观的那个错误估计上。
 * 与正当表述有明确界线：谦逊/纠偏表述（只说明出价最高/不等于
 * 估值正确/还要留足安全边际）、概念讨论（赢家诅咒/winner's
 * curse/最乐观的投标人）、非竞价胜利（赢比赛/夺冠/win the
 * game）、缺任一腿（只报中标事实无价值推断）——均豁免。
 *
 * 与既有维度的边界（r237 归因）：
 *   · appeal_to_wealth（第 186 维）管**崇拜富人**（他有钱所以
 *     他对），句中无竞价机制；本族判据要求竞价胜利锚点在场，
 *     与财富多寡无关（穷者中标照判）。
 *   · confidence 管**一般性过度自信**（我有信心肯定能成）；
 *     本族有明确的「胜利→价值推断」机制结构，confidence 不
 *     触及竞价信息结构这一内核。
 *   · pseudo_causal / post_hoc 管泛因果与泛时间先后；本族双腿
 *     判据要求竞价胜利腿与价值推断腿同时在场，后两者不判
 *     「赢家恰是最乐观者」这一拍卖理论结构。
 *   · hot_hand 管随机序列的热手谬信；本族句中可无任何序列，
 *     锚点是单次竞价事件。
 *
 * [r316 扩展] 零命中探针 scripts/round-316/probe-candidates.js：存量腿对
 * 「抢到新地王×说明值这个价/竞拍价创新高×市场很认/打新中签×有潜力/
 * 评标第一×专家组认报价/采矿权竞得价远超起拍价×值钱」及对应英文
 * （won the spectrum auction×proves the market values / outbidding×
 * shows the client agrees / IPO allotment×confirms a good one）10/11
 * 全穿透——存量 WIN 只认「中标/竞得/拍得/出价赢/排名第一」标准竞价词，
 * VALUE 只认「值这个价/被低估/性价比/物有所值」标准价值词，对土地
 * 招拍挂的「抢地/地王」、牌照/矿权/频谱竞价、打新中签、评标评分
 * 第一、创纪录竞价等共同价值场景，及「值钱/有潜力/市场很认这个价」
 * 等口语化价值推断零覆盖。新增 WIN_ZH3/EN3×VALUE_ZH3/EN3 平行常量
 * 独立链（findSignatures 第四、五链），存量腿不动。良性 7/7 零误伤，
 * 官方良性语料 378 条复测零误命中（见 scripts/round-316）。
 *
 * 判据（双腿共现，缺一不判）：
 *   ① 腿① WIN 竞价/招标/拍卖胜利——中标/竞得/拍得/拍下/夺标/
 *     标王/竞标成功/投标成功/(竞标|投标|招标|竞拍|拍卖)×(赢|
 *     胜|成功|拿下|夺魁)/(赢|胜|拿下|夺得)×(竞标|投标|招标|
 *     竞拍|拍卖|标的)/(出价|报价|投标|竞价)×(赢|胜出|胜了|
 *     拿下)/(招标|投标|竞标|评选|评比)×排名×第一/(标的|
 *     拍卖品|拍品)×(拿下|竞得|拍得|收入囊中)；EN won the
 *     auction/bid/tender、winning bid、outbid、came out on
 *     top in the tender、(our|we) bid (was) (accepted|
 *     selected|chosen|won)、we were selected as the winner；
 *   ② 腿② VALUE-INFERENCE 价值/判断力推断——(说明|证明|
 *     意味着|表明|可见|反映出|足以证明)×(值这个价|被低估|
 *     估值合理|价格合理|报价合理|性价比|确实好|真的好|
 *     物有所值|划算|抄底|捡漏|捡了漏|最佳选择)/(判断|眼光|
 *     决策|估值|方案|选择|出价)×(得到验证|被验证|没错|
 *     正确|精准|高明)/(市场|业主|客户|买家|对方|评标委员会)
 *     ×(认可|接受|认了)×(价格|价|报价|成本|估值)/(性价比|
 *     质价比)×(最高|最好|最优)；EN (confirms|proves|shows|
 *     means|demonstrates|suggests)×(worth|undervalued|
 *     underpriced|fair|reasonable|bargain|correct|right|
 *     validated|best value)、(so|thus|therefore|hence)×
 *     (undervalued|underpriced|worth it|bargain|a steal)、
 *     (got|landed|found) a (real) (bargain|steal|deal)、
 *     (our|my) (judgment|valuation|call|decision) was
 *     (validated|confirmed|vindicated|proven right)、
 *     (market|seller|client) (recognized|accepted|validated)
 *     the (price|value|valuation|offer|cost)。
 *   两腿落在近距离窗内（ZH 60 字 / EN 180 字符）；腿②匹配若被
 *   否定前缀修饰（不等于估值正确/不能说明值这个价/not that the
 *   price was right）不计。
 *
 * [r332 数字竞价域新措辞家族] 零命中探针 scripts/round-332/
 * r332-probe-direction.js（v6.8.184 基线实测）：存量四链（含 r316
 * 抢地/牌照/打新/评标族）对「竞拍到搜索关键词×说明市场认可流量
 * 价值 / 天价签下主播×证明平台认可商业价值 / 抢到黄金广告位×
 * 判断没错、这个位置就值这个钱 / won the keyword auction×confirms
 * this traffic is worth / signing the star streamer×proves the
 * platform accepts her market value」6/6 完全穿透（gate.action=
 * pass、econ_reasoning_gate 归因 0），良性 6/6 零误伤。数字营销/
 * 直播电商/MCN 话语域无任何存量腿：关键词/广告位/流量/坑位/主播
 * 不在 WIN_ZH3 标的表，「流量价值/商业价值/变现价值/花得值」不在
 * VALUE_ZH3 推断表。新增 WIN_ZH4/EN4×VALUE_ZH4/EN4 平行常量独立链
 * （findSignatures 第六、七链）：腿①竞得动词（竞拍到/投得/抢到/
 * 斩获）×数字标的（关键词/广告位/流量/坑位/主播/明星/域名/NFT）、
 * 被动归属形、竞价语境×数字标的、签约竞价族（天价/重金/斥资×
 * 签下/挖到）；EN won the keyword/ad/slot/influencer auction、
 * (signed|signing|landed|secured) the streamer/influencer/creator、
 * 数字标的×(went to|awarded to) us/the highest bidder。腿②推断动词×(市场|平台|广告主)?认可×
 * (流量|商业|变现)?价值、数字标的×值这个价/花得值/没白花、推断
 * 动词×价值名词；EN (confirms|proves|shows)×(market|platform|
 * advertisers)(recognized|accepted|validated)×(traffic|
 * commercial|monetization) value、(keyword|slot|traffic|
 * streamer) is worth it、(signing|slot|ad) (fee|budget|spend)
 * was worth it/money well spent/paid off、(confirms|proves)×
 * (commercial|monetization|traffic|market) value。同轮补否定守卫
 * 「并不/并没有」（原 NEG_BEFORE/NEG_INSIDE 缺该词，「并不说明
 * 市场认可这个价值」式否定句会假阳性，present-bias 模块先例已收）。
 * 存量四链与豁免层零改动。海外扫描 arXiv parse-fail（OR 稀释）/
 * GitHub 0 / S2 429——空返，按既有形态自建。
 *
 * 为什么取 VERIFY 级：单句可能是在转述一次已完成的交易结果而未
 * 及展开估值复核（这类由缺腿/豁免覆盖），也可能是报价部门的
 * 真诚信念陈述。verify 的语义是「这段话把竞价胜利当成了标的物
 * 价值或自身判断力的证据，先核实成交价相对独立估值的溢价、赢
 * 标是否源于竞争者退出或信息优势，再决定是否采信其价值结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 谦逊/纠偏表述（只说明出价最高/不等于估值正确/不代表/
 *     未必/留足安全边际；EN not that the price was right）——
 *     说话者已在纠正胜利≠价值的推理，正是本族解药；
 *   · 概念讨论（赢家诅咒/胜者诅咒/最乐观的投标人/winner's
 *     curse/most optimistic bidder）——讨论本族名称的教学/
 *     定义句；
 *   · 非竞价胜利（赢比赛/夺冠/赢球/win the game/match）——
 *     腿①要求竞价/拍卖/招标语境，体育竞赛无标的物估值；
 *   · 缺任一跳线（只报中标事实、无价值推断腿）——双腿判据
 *     天然不命中。
 */
'use strict';

// ─── 腿① 竞价/招标/拍卖胜利（中文）────────────────────────────
const WIN_ZH = [
  // ①-a 中标/竞得/拍得/拍下/拍到/拍走/夺标/标王（自带竞价语境的单词性锚点）
  /(?:中标|竞得|拍得|拍下|拍到|拍走|夺标|标王)/,
  // ①-b (竞标|投标|招标|竞拍|拍卖)×(赢|胜|成功|拿下|夺魁|拔得头筹)
  /(?:竞标|投标|招标|竞拍|拍卖)[^。，！？；\n]{0,10}(?:赢|胜|成功|拿下|夺得|夺魁|拔得头筹)/,
  // ①-c (赢|胜|拿下|夺得|夺魁|拔得头筹)×(竞标|投标|招标|竞拍|拍卖|标的)
  /(?:赢|胜|拿下|夺得|夺魁|拔得头筹)[^。，！？；\n]{0,10}(?:竞标|投标|招标|竞拍|拍卖|标的)/,
  // ①-d (出价|报价|投标|竞价)×(赢|胜出|胜了|拿下)（无显式「标」字的竞价族）
  /(?:出价|报价|投标|竞价)[^。，！？；\n]{0,8}(?:赢|胜出|胜了|拿下)/,
  // ①-e (招标|投标|竞标|评选|评比)×排名/名次×第一
  /(?:招标|投标|竞标|评选|评比)[^。，！？；\n]{0,6}(?:排名|名次|得分|评分)[^。，！？；\n]{0,4}(?:第一|首位|榜首|头名)/,
  // ①-f (标的|拍卖品|拍品)×(被|由)×(拿下|竞得|拍得|收入囊中)
  /(?:标的|拍卖品|拍品)[^。，！？；\n]{0,8}(?:被|由)?(?:我们|我司|本公司)?(?:拿下|竞得|拍得|收入囊中)/,
];

// ─── 腿① 竞价/招标/拍卖胜利（英文）────────────────────────────
const WIN_EN = [
  // ①-a won / winning the auction|bid|tender|bidding
  /\bw(?:on|inning)\s+(?:the\s+)?(?:auction|bid|tender|bidding)\b/i,
  // ①-b winning bid（招标文件族）
  /\bwinning\s+bid\b/i,
  // ①-c outbid / outbid everyone
  /\boutbid\b/i,
  // ①-d came/coming out on top in the tender|bidding|auction
  /\b(?:cam|com)(?:e|ing)\s+out\s+on\s+top\s+in\s+the\s+(?:tender|bidding|auction)\b/i,
  // ①-e (our|we) bid|offer|proposal (was) (accepted|selected|chosen|won)
  /\b(?:our|we)\s+(?:bid|offer|proposal)\s+(?:was\s+)?(?:accepted|selected|chosen|won)\b/i,
  // ①-f we (were) (selected|chosen) as the winner|successful bidder
  /\bwe\s+(?:were\s+)?(?:selected|chosen)\s+(?:as\s+)?(?:the\s+)?(?:winner|successful\s+bidder)\b/i,
];

// ─── 腿② 价值/判断力推断（中文）────────────────────────────────
const VALUE_ZH = [
  // ②-a (说明|证明|意味着|表明|可见|足以证明|反映出)×(值这个价|被低估|…)
  /(?:说明|证明|意味着|表明|可见|足以证明|反映出)[^。，！？；\n]{0,14}(?:值这个价|值这个钱|被低估|低估|估值合理|价格合理|报价合理|性价比|确实好|真的好|物有所值|物超所值|划算|抄底|捡漏|捡了漏|好东西|好货|最佳选择|最优选择|识货)/,
  // ②-b (判断|眼光|决策|估值|方案|选择|出价)×(得到验证|没错|正确|精准|高明|英明)
  /(?:判断|眼光|决策|估值|方案|选择|出价)[^。，！？；\n]{0,8}(?:得到验证|被验证|得到印证|没错|是对的|正确|精准|高明|英明)/,
  // ②-c (市场|业主|客户|买家|对方|评标委员会)×(认可|接受|认了)×(价格|价|报价|成本|估值)
  /(?:市场|业主|客户|买家|对方|评标委员会)(?:认可|接受|认了)(?:这个|该|此|我们的)?(?:价格|价|报价|成本|估值)/,
  // ②-d (性价比|质价比)×(最高|最好|最优|最棒)
  /(?:性价比|质价比)(?:最高|最好|最优|最棒)/,
  // ②-e 值这个价/物有所值/物超所值（独立承重）
  /(?:值这个价|物有所值|物超所值)/,
];

// ─── 腿② 价值/判断力推断（英文）────────────────────────────────
const VALUE_EN = [
  // ②-a (confirms|proves|shows|means|demonstrates|suggests)×(worth|undervalued|fair|…)
  /\b(?:confirms?|proves?|shows?|means?|demonstrates?|suggests?)\b[^.]{0,50}\b(?:worth|undervalued|underpriced|fair|reasonable|bargain|correct|right|validated|best\s+value|value\s+for\s+money)\b/i,
  // ②-b (so|thus|therefore|hence)×(undervalued|underpriced|worth it|bargain|a steal)
  /\b(?:so|thus|therefore|hence)\b[^.]{0,40}\b(?:undervalued|underpriced|worth\s+it|bargain|a\s+steal)\b/i,
  // ②-c (got|landed|found) a (real) (bargain|steal|deal)
  /\b(?:got|landed|found)\s+(?:a\s+)?(?:real\s+)?(?:bargain|steal|deal)\b/i,
  // ②-d (our|my) (judgment|judgement|valuation|call|decision) was (validated|confirmed|vindicated|proven right)
  /\b(?:our|my)\s+(?:judgment|judgement|valuation|call|decision)\s+(?:was\s+)?(?:validated|confirmed|vindicated|proven\s+right)\b/i,
  // ②-e (market|seller|client|counterparty|owner) (recognized|accepted|validated) the (price|value|valuation|offer|cost)
  /\b(?:market|seller|client|counterparty|owner)\s+(?:recognized|accepted|validated)\s+(?:the|this|our)\s+(?:price|value|valuation|offer|cost)\b/i,
];

// ─── [r316] 竞价胜利新形：抢地/牌照/打新/评标/创纪录竞价（中文）─────
// 零命中探针 scripts/round-316/probe-candidates.js：存量腿对
// 「抢到新地王×说明值这个价 / 竞拍价创新高×市场很认 / 打新中签×有潜力 /
// 评标第一×专家组认报价 / 竞得价远超起拍价×值钱」10/11 全穿透（余 1 条
// 已被存量 winning bid×worth it 覆盖转回归），良性 7/7 零误伤。
// 平行常量 + findSignatures 独立链，不动存量腿。
const WIN_ZH3 = [
  // ①-g 抢地/摘地族（抢到/夺得/拿下 × 地王/矿权/牌照）
  /(?:抢到|抢下|夺得|拿下|摘得|斩获|收入囊中)[^。，！？；\n]{0,6}(?:地王|地块|宅地|商住地|土地|矿权|采矿权|牌照|频谱|执照|特许|车指标)/,
  // ①-g2 抢地大战赢族（抢地/拿地 × 大战/争夺 × 赢/胜）
  /(?:抢地|夺地|拿地|争地|土地争夺)[^。，！？；\n]{0,8}(?:大战|争夺|鏖战|厮杀)?[^。，！？；\n]{0,6}(?:我们|我方|我司)?(?:赢|胜|胜出|拿下|凯旋)/,
  // ①-h 被动竞得族（地王/矿权/牌照 × 被/由 × 竞得/拿下）
  /(?:地王|地块|矿权|采矿权|牌照|频谱|特许)[^。，！？；\n]{0,12}(?:被|归|由)[^。，！？；\n]{0,10}(?:我们|我司|本公司|对手|对方)?(?:拿下|夺得|竞得|摘得|拍得|收入囊中)/,
  // ①-i 打新中签/获配族
  /(?:打新|申购|认购|新股|新债)[^。，！？；\n]{0,8}(?:中签|中购|获配|配售|中了|命中)/,
  // ①-j 竞得价/成交价创新高族（创纪录竞价）
  /(?:竞得|竞拍|成交|出让|中标)[^。，！？；\n]{0,4}(?:价|总价|单价|楼面价)[^。，！？；\n]{0,10}(?:创|刷新|破)[^。，！？；\n]{0,6}(?:新高|纪录|记录)/,
  // ①-k 竞得价远超评估/起拍族
  /(?:竞得价|成交价|出让价|中标价|楼面价)[^。，！？；\n]{0,8}(?:远超|高出|高于|大幅超过|显著高于)[^。，！？；\n]{0,10}(?:起拍价|评估价|底价|保留价|账面)/,
  // ①-l 评标/评审/投标评分第一族
  /(?:评标|评选|评比|评审|专家|投标|招标)[^。，！？；\n]{0,8}(?:综合)?(?:评分|得分|分数|排名|名次)[^。，！？；\n]{0,4}(?:第一|首位|榜首|头名|最高|居首|夺魁)/,
];

// ─── [r316] 竞价胜利新形（英文）────────────────────────────
const WIN_EN3 = [
  // ①-g3 won the spectrum/mining/land/IPO auction
  /\bw(?:on|inning)\s+(?:the\s+)?(?:spectrum|mining|land|plot|IPO|license|licence|broadcast|airwave)\s+auction\b/i,
  // ①-g4 outbid 全族（含 outbidding/outbids，存量 ①-c 仅 \boutbid\b）
  /\boutbid(?:ding|s)?\b/i,
  // ①-g5 winning bid (was) far above the reserve
  /\b(?:winning|win)\s+(?:bid|offer)\s+(?:was\s+|is\s+)?(?:far\s+)?(?:above|over|beyond)\s+(?:the\s+)?(?:reserve|asking|starting)\b/i,
  // ①-g6 record bid/price
  /\brecord\s+(?:bid|price)\b/i,
  // ①-g7 got/received the IPO allotment
  /\b(?:got|received|landed|secured)\s+(?:the\s+)?(?:IPO|share|stock)\s+allotment\b/i,
  // ①-g8 (top|highest|first)-(rated|ranked|scored) × bid/proposal/tender
  /\b(?:top|highest|first)[- ](?:rated|ranked|scored)\b[^.]{0,40}\b(?:bid|proposal|tender|offer)\b|\b(?:bid|proposal|tender|offer)\b[^.]{0,40}\b(?:top|highest|first)[- ](?:rated|ranked|scored)\b/i,
];

// ─── [r316] 价值/判断力推断新形（中文）──────────────────────
const VALUE_ZH3 = [
  // ②-f 值钱/有潜力族（说明×值钱/有潜力/是好货/就这么值）
  /(?:说明|证明|意味着|表明|可见|足以证明|反映出|证明得了)[^。，！？；\n]{0,14}(?:值钱|有价值|有潜力|有前途|有含金量|是好东西|是好货|确实好|真的好|就这么值|真的值|值回了|物有所值)/,
  // ②-g 市场/客户很认价族（市场已经很认可这个价格/专家组都很认我们的报价）
  /(?:市场|客户|业主|买家|对方|专家组|专家|评委|招标方|甲方|评标委员会|监管)[^。，！？；\n]{0,4}(?:已经|也|都|很|十分|非常|相当|普遍)?(?:认可|认同|接受|认|买账)[^。，！？；\n]{0,6}(?:这个|该|此|我们的|它的)?(?:价格|价|报价|成本|估值|价钱|价位)/,
  // ②-h 抢手/挤破头反推族（挤破头/抢着要×说明值/优质）
  /(?:挤破头|抢破头|抢着要|抢手|疯抢|争相)[^。，！？；\n]{0,10}(?:说明|证明|意味着|可见|表明)[^。，！？；\n]{0,10}(?:值|好|优质|有眼光|有潜力)/,
];

// ─── [r316] 价值/判断力推断新形（英文）──────────────────────
const VALUE_EN3 = [
  // ②-f2 (confirms|proves|shows|...)×（values|worth|quality|potential|a good one）
  /\b(?:confirms?|proves?|shows?|means?|demonstrates?|suggests?|indicates?)\b[^.]{0,55}\b(?:values?|valued|is\s+worth|has\s+value|quality|potential|promise|a\s+good\s+(?:one|buy|deal))\b/i,
  // ②-g2 (market|client|...) (values|recognizes|accepts|agrees) ... (price|value|offer)
  /\b(?:market|client|customer|seller|buyer|owner|panel|board)\b[^.]{0,30}\b(?:values?|valued|recognizes?|recognized|accepts?|accepted|agrees?)\b[^.]{0,30}\b(?:price|value|valuation|offer|cost|worth)\b/i,
];

// ─── [r332] 数字竞价域新措辞家族（关键词竞价/广告位/直播坑位/主播签约）──
// 零命中探针 scripts/round-332/r332-probe-direction.js（v6.8.184 基线实测）：
// 存量腿（含 r316 抢地/牌照/打新/评标族）对「竞拍到搜索关键词×说明市场认可
// 流量价值 / 天价签下主播×证明平台认可商业价值 / 抢到黄金广告位×判断没错、
// 这个位置就值这个钱 / won the keyword auction×confirms this traffic is
// worth / signing the star streamer×proves the platform accepts her
// market value」6/6 完全穿透（gate.action=pass、econ_reasoning_gate 归因
// 0），良性 6/6 零误伤。数字营销/直播电商/MCN 话语域没有任何存量腿覆盖：
// 关键词/广告位/流量/坑位/主播 不在 WIN_ZH3 的标的表，「流量价值/商业价值/
// 变现价值/花得值」不在 VALUE_ZH3 的推断表。平行常量 + findSignatures 独立
// 链，存量四链与豁免层零改动。
const WIN_ZH4 = [
  // ①-m 数字竞价标的 × 竞得动词（竞拍到关键词/抢到广告位/投得流量坑位）
  /(?:竞拍到|竞拍下|竞拍得|投得|投中|抢到|抢下|拿下|斩获|夺得|摘得|收入囊中)[^。，！？；\n]{0,8}(?:关键词|广告位|流量|坑位|主播|明星|网红|达人|域名|藏品|数字藏品)/,
  // ①-n 被动形（关键词被对手拍走/广告位归了别家/主播被别家签走）
  /(?:关键词|广告位|流量|坑位|主播|明星|网红|达人|域名|藏品)[^。，！？；\n]{0,10}(?:被|归|由)[^。，！？；\n]{0,8}(?:拍得|拍走|拿下|竞得|投得|收入囊中|夺走|抢走|签走)/,
  // ①-o 竞价语境 × 数字标的（关键词竞价/广告位拍卖/流量拍卖/坑位竞价）
  /(?:竞价|竞拍|拍卖|投标|招标)[^。，！？；\n]{0,6}(?:关键词|广告位|流量|坑位|主播|明星|网红|达人|域名|藏品)/,
  // ①-p 签约竞价族（天价/重金/高价/斥资 × 签下/签到/挖到/拿下——竞价抬价
  // 语义由修饰词承载，人才竞价胜利本身携带「最乐观估值者胜出」结构）
  /(?:天价|重金|高价|斥资|花大价钱|砸钱)[^。，！？；\n]{0,6}(?:签下|签到|签入|挖到|挖来|挖走|拿下|揽下|招致)/,
  // ①-q 数字标的 × 竞价语境逆序形（广告位拍卖/关键词竞价/流量坑位竞拍）
  /(?:关键词|广告位|流量|坑位|主播|明星|网红|达人|域名|藏品)[^。，！？；\n]{0,6}(?:拍卖|竞价|竞拍|招标|投标)/,
];

const WIN_EN4 = [
  // ①-m3 won the keyword/ad/traffic/slot/influencer auction（数字标的拍卖，
  // 允许拍卖名带 1-2 个修饰词：ad slot auction / premium keyword auction；
  // 0 修饰词的 won the auction 由存量 ①-a 覆盖）
  /\bw(?:on|inning)\s+(?:the\s+)?(?:[a-z][\w-]*\s+){1,2}?(?:auction|bidding)\b/i,
  // ①-m4 outbid everyone for the keyword/slot/streamer（为数字标的竞价胜出）
  // ——已删除：存量 ①-c \boutbid\b 为其全集超集（注入实证全包含，r320 纪律）
  // ①-m4 (signed|signing|landed|landing|secured|securing|snapped up|snapping up|won) the streamer/influencer/creator
  /\b(?:signed|signing|landed|landing|secured|securing|snapped\s+up|snapping\s+up|won|winning)\s+(?:the\s+)?(?:star\s+|top\s+|influential\s+)?(?:streamer|influencer|creator|talent|anchor)\b/i,
  // ①-m5 数字标的 × (went to|awarded to) us/the highest bidder（被动归属形）
  /\b(?:keyword|ad\s+slot|slot|placement|traffic|streamer|influencer|sponsorship)\b[^.]{0,40}\b(?:went\s+to|awarded\s+to|given\s+to)\s+(?:us|our|the\s+highest\s+bidder)\b/i,
];

// ─── [r332] 数字域价值/判断力推断新形（中文）──────────────────
const VALUE_ZH4 = [
  // ②-i 推断动词 × (市场|平台|客户|用户|资本|行业)?认可 × (流量|商业|变现)?价值
  /(?:说明|证明|意味着|表明|可见|足以证明|反映出|说明得了|印证了)[^。，！？；\n]{0,12}(?:市场|平台|客户|用户|资本|行业|圈内|广告主|甲方)?(?:认可|认同|接受|认|买账)[^。，！？；\n]{0,8}(?:流量|商业|变现|市场|潜在|含金量)?(?:价值|价格|价|报价|估值)/,
  // ②-j 数字标的 × 值这个价/花得值（广告位就值这个价/签约费花得值/没白花）
  /(?:关键词|广告位|坑位|流量|主播|明星|网红|达人|域名|藏品|位置|签约费|转会费|坑位费|片酬)[^。，！？；\n]{0,8}(?:就)?(?:值这个价|值这个钱|物有所值|物超所值|花得值|花的值|没白花|签得值|投得值|买得值|确实值|真的值)/,
  // ②-k 推断动词 × 价值名词（说明…商业价值/变现价值/流量价值/号召力）
  /(?:说明|证明|意味着|表明|可见|反映出|足以证明|印证)[^。，！？；\n]{0,14}(?:商业价值|变现价值|流量价值|市场价值|潜在价值|含金量|购买力|号召力)/,
];

// ─── [r332] 数字域价值/判断力推断新形（英文）──────────────────
const VALUE_EN4 = [
  // ②-i3 (confirms|proves|shows|means|...) × (market|platform|advertisers) (recognized|accepted|validated|values) × (traffic|commercial|monetization) value
  /\b(?:confirms?|proves?|shows?|means?|demonstrates?|suggests?|indicates?)\b[^.]{0,50}\b(?:market|platform|advertisers?|users?|capital|industry|clients?)\b[^.]{0,30}\b(?:recogniz\w+|accept\w+|validat\w+|valu\w+|embrac\w+)\b[^.]{0,40}\b(?:traffic|commercial|monetization|market|potential)?\s*(?:value|worth|price)\b/i,
  // ②-i4 (keyword|slot|traffic|streamer|influencer) is worth it / worth every dollar
  /\b(?:keyword|ad|slot|placement|traffic|streamer|influencer|creator|domain|nft)\b[^.]{0,40}\b(?:worth\s+(?:it|every|the\s+price)|is\s+worth|was\s+worth)\b/i,
  // ②-i5 (signing|transfer|slot|placement|ad) (fee|budget|spend|bid) was worth it / money well spent / paid off
  /\b(?:signing|transfer|slot|placement|advertising|ad|keyword|auction)\s+(?:fee|budget|spend|bid|price)\b[^.]{0,30}\b(?:worth\s+it|money\s+well\s+spent|paid\s+off|justified|validated)\b/i,
  // ②-i6 (confirms|proves|shows|means) ... (commercial|monetization|traffic|market) value
  /\b(?:confirms?|proves?|shows?|means?|demonstrates?|suggests?)\b[^.]{0,50}\b(?:commercial|monetization|monetisation|traffic|market|potential)\s+value\b/i,
  // ②-i7 (market|platform|advertisers|clients) (validated|confirmed|accepted|recognized) ... (bid|offer|price)
  /\b(?:market|platform|advertisers?|clients?|users?|industry)\b[^.]{0,30}\b(?:validat\w+|confirm\w+|accept\w+|recogniz\w+)\b[^.]{0,30}\b(?:bid|offer|price|pricing)\b/i,
];

// 双腿距离窗
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免一：概念讨论（讨论本族名称的教学/定义句）────────────────
const CURSE_ZH = /(?:赢家诅咒|胜者诅咒|拍卖诅咒|最乐观的(?:投标|竞价|出价)人|报价过高|溢价过高|出价过高)/;
const CURSE_EN = /\b(?:winner['\u2019]?s?\s+curse|most\s+optimistic\s+bidder|overpaid|the\s+winner\s+is\s+usually)\b/i;

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

// 腿②匹配的否定前缀检查（「不等于估值正确/不能说明值这个价」不计）。
// 窗口取匹配前 8 字符，允许否定词与被否定短语间插入少量字。
const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|并不|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能)[^。，！？；\n]{0,5}$/;
// 匹配 span 内部的否定词（「效率并未提升」式副词内嵌否定）
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|并不|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能)/;

// 英文否定（EN 无负例注入语言侧区分，统一启用）：span 内否定 +
// 匹配前 45 字符窗口内的否定（does not prove / cannot show …）。
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b/i;
const NEG_BEFORE_EN = /(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

// 单条匹配是否有效（否定前缀/内部否定均拦下；ZH 与 EN 均查）。
// NEG_* 四个常量支持 R 注入（负例测试用），默认取模块级常量。
function matchAlive(text, x, useNeg, R) {
  if (!useNeg) return true;
  const negInside = (R && R.NEG_INSIDE) || NEG_INSIDE;
  const negBefore = (R && R.NEG_BEFORE) || NEG_BEFORE;
  const negInsideEn = (R && R.NEG_INSIDE_EN) || NEG_INSIDE_EN;
  const negBeforeEn = (R && R.NEG_BEFORE_EN) || NEG_BEFORE_EN;
  if (negInside.test(x.raw) || negInsideEn.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (negBefore.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !negBeforeEn.test(beforeEn);
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

// 收集某语言侧两腿的全部有效匹配
function collectLegs(text, wList, vList, useNeg, R) {
  let wm = [], vm = [];
  for (const re of wList) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, R)) wm.push(x);
  }
  for (const re of vList) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, R)) vm.push(x);
  }
  return { wm: dedupeOverlap(wm), vm: dedupeOverlap(vm) };
}

// 距离（不相邻区间间距；重叠返回 0）
function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

/**
 * 两腿配对：腿①×腿②落在窗内即成一签名。
 */
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      w: R.WIN_ZH || WIN_ZH, v: R.VALUE_ZH || VALUE_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      w: R.WIN_EN || WIN_EN, v: R.VALUE_EN || VALUE_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
    // [r316] 抢地/牌照/打新/评标/创纪录竞价 × 市场认价/值钱/有潜力（独立链）
    {
      w: R.WIN_ZH3 || WIN_ZH3, v: R.VALUE_ZH3 || VALUE_ZH3,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      w: R.WIN_EN3 || WIN_EN3, v: R.VALUE_EN3 || VALUE_EN3,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
    // [r332] 数字竞价域（关键词/广告位/流量坑位/主播签约 × 市场认可流量价值/
    // 商业价值/签约费花得值，独立链；存量四链零改动）
    {
      w: R.WIN_ZH4 || WIN_ZH4, v: R.VALUE_ZH4 || VALUE_ZH4,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      w: R.WIN_EN4 || WIN_EN4, v: R.VALUE_EN4 || VALUE_EN4,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const { w, v, win, lang } of langs) {
    const { wm, vm } = collectLegs(text, w, v, true, R);
    for (const a of wm) {
      let best = null;
      for (const b of vm) {
        const d = dist(a, b);
        if (d > win) continue;
        if (!best || d < best.d) best = { d, b };
      }
      if (best) sigs.push({ lang, win: a.raw, value: best.b.raw, dist: best.d });
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectWinnersCurse(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（赢家诅咒/winner's curse 教学定义句）
  if ((R.CURSE_ZH || CURSE_ZH).test(text) || (R.CURSE_EN || CURSE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'winners_curse',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '「' + x.win + '」→「' + x.value + '」'
      : '"' + x.win + '" -> "' + x.value + '"')),
    details: s.lang === 'zh'
      ? '赢家诅咒(' + sigs.length + '处: 把「' + s.win + '」的竞价胜利当作「' + s.value + '」的价值/判断力证据——赢家恰是最乐观者)(zh)'
      : "winner's curse(" + sigs.length + 'x: bidding victory "' + s.win + '" read as value evidence "' + s.value + '" — the winner is the most optimistic bidder)(en)',
    guidance: '不要把竞价/招标/拍卖的胜利当作标的物价值或自身判断力的证据（竞标赢了说明这块地值这个价、中标证明报价合理业主认可、拍下名画说明被低估我们捡了漏 / we won the auction so it confirms the asset is worth what we paid、winning the bid proves our price was fair、we outbid everyone so it was undervalued）：共同价值场景里赢家之所以赢，往往因为没人比我们更乐观——胜利携带的是竞争者估值分布的信息，不是标的物价值的信息。请以独立估值（评估价/现金流/可比交易）而非成交价本身论证价值，成交价相对独立估值的溢价要单独核算；若只是出价最高，结论应是「我们最乐观」而不是「它值这个价」。',
    tags: ['economics', 'auction', 'bidding', 'winners-curse', 'overconfidence', 'inference'],
  };
}

module.exports = {
  detectWinnersCurse,
  __internals: () => ({
    WIN_ZH, WIN_EN, VALUE_ZH, VALUE_EN,
    WIN_ZH3, WIN_EN3, VALUE_ZH3, VALUE_EN3,
    WIN_ZH4, WIN_EN4, VALUE_ZH4, VALUE_EN4,
    CURSE_ZH, CURSE_EN,
    PAIR_ZH, PAIR_EN,
    NEG_BEFORE, NEG_INSIDE,
  }),
};
