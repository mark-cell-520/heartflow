/**
 * src/regression-to-the-mean.js — 「回归均值误归因（regression to the mean /
 * regression fallacy）」检测器
 * （第 193 个判别维度）
 *
 * [r195 立项] decision 本体在当前引擎（v6.8.123，192 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia "regression to the
 * mean" 命中 "Regression to the mean is the main reason ineffective
 * treatments appear to work"（objectID 10731023，pts=137，
 * dcscience.net 2015）、"Regression to the Mean: on LLMs and the quiet
 * death of the new"（48804219，pts=71）、"Gambler's Fallacy and the
 * Regression to the Mean"（29845334，pts=68）——确认「极端值后的自然移动
 * 被当成干预效果」是统计与因果推断的公认盲区；GitHub "regression to the
 * mean fallacy" total_count=0、"logical fallacies list" 仅
 * LukeStonehm/LogicalDefence ★140 为通用谬误列表无判据代码，均无可复用
 * 实现；Semantic Scholar 连续三次 HTTP 429 空返，如实记录）+ 引擎差距
 * 实测（grep -ril 'regression_to_mean|regression-to-the-mean' src/ 0
 * 命中——192 维无一覆盖该族）。
 *
 * 辨别的族：回归均值误归因——某指标先处于**极端值**（最差/谷底/连败，或
 * 最好/巅峰/创新高——回归是**双向**的），随后**向均值方向移动**（好转/
 * 回升/回到中等，或回落/退潮），文本把这次移动**归功于同期的某个干预**
 * （吃药/贴膏药/换人/报班/换方法/请大师；EN took/hired/switched/started）。
 * 极端值之后下一次测量天然朝均值移动，与干预是否有效无关；没有对照组，
 * 「干预后好转」证明不了任何事：
 *   上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。
 *   他连败五场之后换了新球拍，接着就赢回来了，可见新球拍很关键。
 *   公司业绩跌到谷底那年请了大师做咨询，这个季度营收回暖，多亏了大师。
 *   贴膏药是真管用——最疼的那天贴上，第二天就不疼了。
 *   After our worst quarter on record we hired the new consultant, and
 *   revenue bounced back — the hire fixed it.
 *
 * 与既有维度的边界（r195 归因）：
 *   · post_hoc 管「A 在 B 前所以 A 导致 B」的**时序连接**，本族不依赖
 *     时序——「考前吃巧克力又回到中等」无任何时序连接词也命中，承重的
 *     是**极端基线**这个统计前提；
 *   · gamblers_fallacy 管**预测下一次**结果会随 streak 反转，本族管
 *     **解释已经发生的**回归；
 *   · hot_hand 管把连胜势头当成下一次胜率升高的根据，本族不预测未来；
 *   · clustering_illusion 管随机聚集被当规律，本族管单次极端→回归的
 *     归因；
 *   · base_rate_neglect 管拿单个阳性信号无视基础概率，本族管忽略
 *     「极端值必然回归」这一统计必然性；
 *   · pseudo_causal 管精确倍数/玄学归因白话伪因果，本族的归因对象是
 *     同期干预但缺对照组；
 *   · common_cause / reverse_causation 管相关→因果与方向倒置，本族不
 *     依赖两个变量的共变；
 *   · monocause 管多因压成单因，本族不断言唯一原因，反对的是**归因
 *     本身无效**。
 *
 * 判据（三腿共现 + 叙事窗，缺一不判）：
 *   腿① EXTREME 极端基线陈述（双向两族，各中英）：
 *     - LOW 极端低：最差/最糟/最坏/最低/最少/最惨/最重/最严重/最疼/
 *       最痛/最倒霉/最消沉/最烂/倒数/垫底/谷底/低谷/跌到谷底/至暗时刻/
 *       冰点/触底/崩盘/暴跌/连跌/创新低/历史新低/最低点/连败/连输/
 *       屡败/连连失利；EN worst / lowest / rock bottom / bottom / nadir /
 *       slump / hit bottom / crash / tanked / lost N in a row / all-time
 *       low / at one's lowest / worst ever；
 *     - HIGH 极端高：史上最好/历史最好/最好成绩/巅峰/顶点/峰值/最高点/
 *       登顶/夺冠/考了第一/年级第一/班级第一/排名第一/创新高/历史新高/
 *       最辉煌/最风光/势头最猛/热度最高；EN best / highest / peak /
 *       pinnacle / record high / winning streak / best ever；
 *   腿② REGRESSION 回归性变化（双向两族）：
 *     - UP 自低处回升：好转/恢复/康复/痊愈/回升/反弹/回暖/止跌/企稳/
 *       回到.{0,8}(正常|平均|中游|中等|上游|前列|前十|正轨|均值)/好起来/
 *       好多了/追平/赶上/又赢了/赢回来/扳回/不疼了/不痛了/不咳了/退烧/
 *       退热/就好了/睡好/成绩回来/提上来/挺过来/熬过来/走出来/平复/
 *       平静；EN recovered / improved / bounced back / rebounded /
 *       returned to / back to normal / back to average / got better /
 *       picked up / won again / leveled off / stabilized；
 *     - DOWN 自高处回落：回落/跌回/降回/减退/消退/平息/退潮/退烧/退热/
 *       归于平淡/回归平淡/回归正常/回归均值/热度退了/风头过了/凉了；
 *       EN dropped back / fell back / faded / wore off / subsided /
 *       cooled off；
 *   腿③ ATTRIB 干预×功劳/功效归因（干预动词与归因词 12 字 / EN 40 字符
 *       叙事窗内共现，双向）：
 *     - INTERVENE 干预动作：吃了/贴了/抹了/敷了/扎了/烧了/拜了/请了/
 *       请来/找了/找来/报了/买了/用了/用上/换上/换掉/改吃/改用/调整了/
 *       试了/试吃/试用/加入/信了/戴了/求了/转了/投了/押了/吃起/用起；
 *       裸名词形（r161 教训）：吃素/吃斋/拜佛/拜神/求神/烧香/做法事/看
 *       风水/算命/请大师/请高人/念咒/画符/符水/放生/还愿/许愿/抽卡/
 *       氪金/抄底/加仓/补仓/割肉/换帅/换教练/换人/报班/报课/买课/换
 *       方法/改方法/调整作息/搬家/改名/换装备/换球拍/换球鞋/换顾问/
 *       换厂家/换供应商/换品牌/换药/换方子/换医生/换医院/转院/转诊/
 *       吃药/贴膏药/敷药/拔罐/针灸/推拿/喝中药/喝符水；EN took / taking
 *       / tried / hired / switched / changed / bought / used / started /
 *       joined / enrolled / prayed / consulted / wore / brought in /
 *       replaced / adopted；
 *     - CREDIT 功劳归因：是因为/多亏/全靠/幸亏/好在/幸好/还好/幸亏是/
 *       多亏了/功劳/靠的是/靠它/归功于/居功至伟/功臣/头功/之所以/让…
 *       好/把…治好；EN because of / thanks to / credit to / it was
 *       thanks；
 *     - EFFECT 功效断言：有效/见效/起作用/起了作用/发挥作用/有用/管用/
 *       很灵/灵验/很准/神了/神奇/立竿见影/药到病除/治好/治愈/痊愈/
 *       解决了/成功了/赢了/拿下/没白/值得/是对的/没错/靠谱/名不虚传/
 *       果真/果然/很关键/关键作用/真管用/确实有用/有效果/疗效/功效/
 *       一吃就/一贴就/一试就/一换就/一改就/一请就/一拜就；EN work /
 *       works / worked / effective / helped / fixed / cured / healed /
 *       solved / won / paid off / did the trick / made the difference /
 *       turned it around；
 *
 * 为什么取 VERIFY 级：极端值之后的回归是统计必然性，但「干预有没有
 * 真实效果」取决于机制与对照数据（随机对照/时间序列/剂量反应）——规则
 * 引擎无法独立判定干预的真实效力，只能识别「极端基线→回归→功劳归因」
 * 的推断形态。verify 的含义是「先过对照检验再采信」：调用方应要求补上
 * 对照组（没做这件事的同质群体是否也回归了）、把结论降级为「观察到
 * 改善，功效待检验」，或点名自然回归的可能性，而不是把回归直接当成
 * 干预的功劳。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（均值回归/回归均值/向均值回归/regression to the
 *     mean/统计学/教材/课堂/论文/科普/谬误/陷阱/自然波动）——讨论这个
 *     概念本身是正确判别；
 *   · 实验/证据语境（随机对照/对照组/实验组/双盲/安慰剂/控制变量/控制
 *     了/剔除/剔除极端值/去掉极值/截尾/温莎化/调整后/前瞻性/队列/元分
 *     析/临床试验/纵向/自然实验/断点回归/双重差分/工具变量/倾向得分/
 *     基线校正；EN randomized / controlled trial / RCT / control group /
 *     placebo / double-blind / longitudinal / natural experiment /
 *     trimmed / winsorized / excluded outliers / baseline-adjusted）——
 *     受控设计或已对回归校正时观察经设计成为证据；
 *   · 推理否定/反向承认（不能说明/不能证明/不能排除/不代表/不等于/
 *     并不意味着/推不出/不足以/未必/不一定/很难说/不见得/不好说/说不
 *     清/难以确定/无法确定/不能全归/不能都归/不能单靠/还要观察/有待验
 *     证/可能是自然/其实是均值/可能只是/还要看/需要看/待观察/以长期/
 *     拉长看/长期为准；EN does not mean / cannot conclude / not
 *     necessarily / does not prove / cannot prove / fails to show / may
 *     just be / could simply be）——拒绝该推断本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/恐怕/倾向于/似乎/好像/说不定/有待/待
 *     验证；EN maybe / perhaps / might / possibly / probably / seems /
 *     appears）——概率化结论不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 *
 * [r265] 全新措辞家族扩展（真升级②，live 生效，维度计数不变）：r265
 * 池化探针（coordination/agent4/probes/r265-probe-pool.js，v6.8.156
 * 实测）本族 7 条新措辞攻击 5 条穿透（gate=pass 且零维度承重），落地：
 *   · EXTREME_LOW_ZH += 项目黄灯族（全黄/亮红灯/全线飘绿）、濒临崩溃族
 *     （差点断裂/快撑不住）、市场腰斩族（腰斩/砍半/膝盖斩）
 *   · EXTREME_LOW_EN += 战绩记录族（started 0-8 / opened the season 3-15）
 *   · REG_UP_ZH += 翻红/扭亏族、按期交付/重回正轨族、支棱族、涨回来族
 *   · REG_UP_EN += now they win / winning again / back in form 直述回归族
 *   · INTERVENE_ZH += all in/梭哈/加杠杆赌博式干预族、上了新X/上线了族
 *   · CREDIT_ZH += 救了场/扭转局面族
 *   · EFFECT_ZH += 走对了/步好棋/是关键决策正确性族
 *   · EXEMPT_NEG_ZH += 要求补证据族（还要看/需要看/待观察/以长期）——
 *     良性「需要看同期大盘再下结论」探针实测误伤，属设计既有豁免族的
 *     同族扩展（主动要求对照窗口是正确判别姿态），非迁就代码
 */
'use strict';

// ─── 腿① EXTREME_LOW 极端低（中文，裸名词形态）────────────────────────
// r161 教训自查：「最差」去掉任何后缀（最差劲/状态最差）仍以「最差」命中；
// 「谷底/垫底/连败」为裸名词形态，不收「了/之后」后缀才命中的形。
const EXTREME_LOW_ZH = [
  /最差|最糟|最坏|最低|最少|最惨|最重|最严重|最厉害|最疼|最痛|最苦|最倒霉|最消沉|最烂|最差劲|最窘|最难|最紧|最危险|最糟糕/,
  /倒数|垫底|谷底|低谷|跌到谷底|至暗时刻|冰点|触底|见底|探底|差到尘埃|尘埃里|糊穿地心|烂到家|一塌糊涂|差到离谱/,
  /崩盘|暴跌|猛跌|重挫|大跌|连跌|创新低|历史新低|史上最低|最低点|最低谷/,
  /连败|连输|连续失败|屡战屡败|屡败|连连失利|输麻木了|跌麻了|全墨|全负|零胜|一胜难求|寸功未立/,
  // [r265] 新族：项目状态俚语（全黄/亮红灯/全线飘绿）——r265 池化探针
  // 实测「开局三个项目全黄」整族穿透（EXTREME 无项目黄灯形）
  /全黄|亮红灯|亮黄灯|全线飘绿|一片绿/,
  // [r265] 新族：濒临崩溃（差点断裂/快撑不住）——「现金流差点断裂」
  /差点断裂|险些断裂|差点崩|险些崩|快撑不住|濒临断裂|差点断气/,
  // [r265] 新族：市场腰斩——「股价腰斩后换了CEO」俚语形
  /腰斩|砍半|膝盖斩|打三折|打对折/,
];

// ─── 腿① EXTREME_HIGH 极端高（中文，裸名词形态）───────────────────────
const EXTREME_HIGH_ZH = [
  /史上最好|历史最好|最好成绩|巅峰|顶点|峰值|最高点|最高峰|登顶/,
  /夺冠|拿了第一|考了第一|年级第一|班级第一|排名第一|全县第一|全市第一|全省第一|全国第一/,
  /创新高|历史新高|史上最高|最辉煌|最风光|风头最盛|势头最猛|热度最高|最火的时候|最红的时候/,
  // [r302] 并入：主语名词形——「业绩是冠军」「当了销冠」「卫冕冠军」
  // （探针实证：原表只收「夺冠」动词形，「业绩是冠军」这类主语判定形穿透）
  /(?:是|当了|拿下|拿了|摘得|夺得|问鼎|卫冕|拿过|当过|夺过)[^。；，]{0,4}(?:冠军|头名|榜首|销冠)/,
  /(?:拿了|拿下|摘得|夺得|问鼎)[^。；，]{0,6}(?:第一|头名|榜首)/,
  /(?:业绩|绩效|销售|营收)[^。；，]{0,4}(?:是|为)[^。；，]{0,4}(?:第一|榜首|头名|冠军)/,
];

// ─── 英文侧腿① ────────────────────────────────────────────────────────
const EXTREME_LOW_EN = [
  /\b(?:worst|lowest|rock\s+bottom|bottom|nadir|slump|hit\s+bottom|crash(?:ed)?|tanked|all[-\s]time\s+low|record\s+low|at\s+(?:my|our|its|their)\s+lowest|worst\s+ever|lost\s+\d+\s+in\s+a\s+row|losing\s+streak)\b/i,
  // [r265] 新族：战绩形 0-8 / 3-15（started 0-8）——体育管理层语境
  // 的常规战绩表达，探针实测穿透（EXTREME_LOW_EN 无战绩记录形）
  /\b(?:started|began|opened|kicked\s+off)\s+(?:the\s+)?(?:season|year|campaign|quarter)?\s*\d+\s*[-\u2013]\s*\d+\b/i,
  // [r265] 新族：cold streak / winless streak / rough patch——竞技语境的
  // 连续低谷形（r264 池化探针遗留族）
  /\b(?:cold\s+streak|winless\s+streak|scoreless\s+streak|rough\s+patch|cold\s+spell|drought)\b/i,
];
const EXTREME_HIGH_EN = [
  /\b(?:best|highest|peak|pinnacle|record\s+high|all[-\s]time\s+high|winning\s+streak|best\s+ever|at\s+(?:my|our|its|their)\s+(?:peak|best)|career\s+high)\b/i,
];

// ─── 腿② REG_UP 自低处回升（中文）─────────────────────────────────────
// r161 教训：「回到」单独出现会误收「回到家/回到公司」，故收到.{0,8}后接
// 均值侧名词（正常/平均/中游/中等/上游/前列/前十/正轨/均值）的受限形。
const REG_UP_ZH = [
  /好转|恢复|康复|痊愈|回升|反弹|回暖|止跌|企稳/,
  /回到[^。；，]{0,8}(?:正常|平均|中游|中等|上游|前列|前十|正轨|均值|本来|原来|平常)/,
  /好起来|好多了|追平|赶上|又赢了|赢回来|扳回|不疼了|不痛了|不咳了|不烧了|就好了|见好/,
  /退烧|退热|睡好|成绩回来|状态回来|分数回来|提上来|挺过来|熬过来|走出来|平复|平静/,
  // [r265] 新族：翻红/扭亏（转正）——「这个月就翻红了」
  /翻红|转正|扭亏|由亏转盈/,
  // [r265] 新族：按期交付/重回正轨——「这个月全部按期交付」
  /按期交付|重回正轨|重回轨道|上了正轨|回到正轨|进入正轨|走入正轨/,
  // [r265] 新族：支棱（网络语复苏）——「下半年就支棱起来了」
  /支棱/,
  // [r265] 新族：涨回来——「半年涨回来三成」
  /涨回来|涨了回来|收了回来|拉了回来|搬了回来|缓过来了|翻盘|翻身|止住颓势|扭转颓势|止颓|追了上来|爬了回来|爬了上来|回过劲|缓过劲|翻身仗/,
];

// ─── 腿② REG_DOWN 自高处回落（中文）───────────────────────────────────
const REG_DOWN_ZH = [
  // [r302] 并入：普通比较级落差族——不是暴跌/崩盘的极端词，而是「与上
  // 一期相比变差了」的普通落差陈述（探针实证「这次考差了」「业绩下滑」
  // 「反响不如从前」整族穿透；并入既有元素以保 r265 登记断言）
  /回落|跌回|降回|减退|消退|平息|退潮|退烧|退热|归于平淡|回归平淡|回归正常|回归均值|热度退了|风头过了|凉了|过气|考差了|考砸了|考坏了|没考好|考得差|发挥失常|失手|失利|栽了|翻车|掉链子|走了下坡|走下坡/,
  // [r302] 并入：指标名词 + 落差动词族——「成绩下滑」「业绩降了」
  /(?:成绩|分数|业绩|绩效|排名|名次|状态|水平|数据|指标|销量|产量|收入|得分|反响|口碑)[^。；，]{0,6}(?:差了|降了|低了|下去了|不如|下滑|倒退|退步|缩水|走低|变差|不如前|不及|逊于|弱了)/,
  // [r302] 并入：时间词 + 落差族——「这次考差了」「随后业绩下滑」
  /(?:这次|这回|本期|这个月|今年|随后|之后|接着|后来)[^。；，]{0,12}(?:差|低|弱|糟|惨|缩|跌|降|退|不如|不及|下滑|倒退|缩水|滑坡)/,
  // [r302] 并入：比较级不及族——「不如从前」「逊于上一版」
  /(?:不如|不及|逊于)(?:上|前|从)/,
  // [r302] 并入：高位→普通双向族——极端词与「只是普通/中游」互为邻居，
  // 允许中间穿过「，上个月」时间短语（「业绩是冠军，上个月只是普通水平」）
  /(?:冠军|第一|榜首|头名|销冠|巅峰|最好|最强|最佳)[^。；]{0,16}(?:只是|仅是|仅为|不过是|仅仅是|只|仅)[^。；]{0,6}(?:普通|中游|一般|平平|寻常|平凡|平均|平常|中等)/,
  /(?:只是|仅是|仅为|不过是|仅仅是|只|仅)[^。；]{0,6}(?:普通|中游|一般|平平|寻常|平凡|平均|平常|中等)[^。；]{0,16}(?:冠军|第一|榜首|头名|销冠|巅峰|最好|最强|最佳)/,
];

const REG_UP_EN = [
  /\b(?:recovered|recovery|improved|improvement|bounced?\s+(?:right\s+)?back|rebound(?:ed)?|returned\s+to|came\s+back|back\s+to\s+normal|back\s+to\s+average|got\s+better|picked\s+up|won\s+again|leveled\s+off|levelled\s+off|stabili[sz]ed|turned\s+(?:it\s+)?around)\b/i,
  // [r265] 新族：now they win / winning again / back in form——「and now
  // they win」直述回归形（探针实测穿透）
  // [r274] 并入：won N straight——「we won three straight」连胜过三场的
  // 直述回归形（并入既有元素以保 r265 登记断言 REG_UP_EN.length===3）
  /\b(?:now\s+(?:they|we)\s+(?:win|are\s+winning)|winning\s+again|back\s+in\s+form|back\s+on\s+track|won\s+(?:\d+|two|three|four|five|six|seven|eight|nine|ten)\s+(?:straight|in\s+a\s+row|consecutive))\b/i,
  // [r265] 新族：immediately won——干预后即时获胜的直述回归形
  // [r274] 并入：broke out immediately——走出低谷的直述回归形
  /\b(?:immediately|instantly|promptly|right\s+away|soon)\s+(?:won|won\s+again)\b|\bbroke\s+out\s+of\s+(?:it|the\s+slump|his|her|their|a\s+slump|the\s+funk)\b|\bbroke\s+out\s+(?:immediately|instantly|right\s+away|promptly|soon)\b/i,
];
const REG_DOWN_EN = [
  /\b(?:dropped\s+back|fell\s+back|faded|wore\s+off|subsided|cooled\s+off|returned\s+to\s+normal|returned\s+to\s+average)\b/i,
  // [r302] 并入：普通比较级落差族（EN）——原表只收 dropped back/faded 等
  // 已成形的回落短语，不收「fell this quarter」「declined afterwards」
  // 「much weaker」这类普通落差陈述（探针实证穿透）
  /\b(?:fell|dropped|declined|dipped|slipped|sank|slid|weakened|worsened|softened|slowed)\b(?:[^.!?]{0,24}\b(?:from|after|following|versus|vs\.?|compared|relative|against|off)\b|[^.!?]{0,18}\b(?:this|that|last|next)\s+(?:quarter|year|season|month|time|period)\b)/i,
  /\b(?:fell|dropped|declined|dipped|slipped|sank|slid|weakened|worsened|softened)\s+(?:back|off|down|away)\b/i,
  /\b(?:much|far|considerably|significantly|markedly|substantially|well|even)?\s*(?:worse|weaker|lower|poorer|softer|slower)\b(?:[^.!?]{0,10}\bthan\b|[^a-z])/i,
  /\b(?:off|below|past)\s+(?:his|her|their|the)\s+(?:best|peak|high|form)\b/i,
  /\b(?:this|that)\s+(?:quarter|year|season|month|time|period)\s+(?:was|has\s+been)\s+(?:worse|weaker|lower|poorer|softer|slower|disappointing)\b/i,
  /\b(?:declined|faded|dropped|fell|slipped|weakened)\s+(?:afterwards|afterward|after\s+that|since|in\s+the\s+(?:months?|years?|weeks?)\s+since)\b/i,
  // [r302] 并入：高位→普通族（EN）——award/peak 名词短语后接「has been much weaker」
  /\b(?:rookie\s+of\s+the\s+year|best|top|peak|finest|record)[^.!?]{0,40}\b(?:this|that)\s+(?:quarter|year|season|month|time|period)\s+(?:was|has\s+been)\b/i,
];

// ─── 腿③ INTERVENE 干预动作（中文，动词形 + 裸名词形双形态）────────────
const INTERVENE_ZH = [
  /(?:吃|贴|抹|敷|扎|烧|拜|请|找|报|买|用|换|改|调整|试|加入|信|戴|求|转|投|押)(?:了|过)/,
  /请来|找来|用上|换上|换掉|改吃|改用|试吃|试用|吃起|用起|空降|挖来|调来|调任|上任|到任|入驻|下场|驰援/,
  // 裸名词形（r161 教训：同类词去掉动词后缀仍须命中）
  /吃素|吃斋|拜佛|拜神|求神|烧香|做法事|看风水|算命|请大师|请高人|念咒|画符|符水|放生|还愿|许愿|抽卡|氪金|抄底|加仓|补仓|割肉/,
  /换帅|换教练|换人|报班|报课|买课|换方法|改方法|调整作息|搬家|改名/,
  /换装备|换球拍|换球鞋|换顾问|换厂家|换供应商|换品牌|换药|换方子|换医生|换医院|转院|转诊/,
  /吃药|贴膏药|敷药|拔罐|针灸|推拿|正骨|喝中药|喝符水/,
  // [r265] 新族：all in/梭哈/加杠杆（赌博式干预）——「all in 了新赛道」
  /\ball\s*in\b|梭哈|加杠杆|满仓|押上全部/,
  // [r265] 新族：上了新X/启用/上线了——「上了新包装」「上线了新流程」
  /上了新|启用|上线了|部署了|切换了|迁到了|换上了新的/,
  // [r302] 并入：干预主体名词形——补课班/报班产物/制度激励/战术打法
  // （探针实证：A1「上次的补课班起了反作用」整族穿透——原表只收
  // 「报班」动词形与 all in/梭哈，不收「补课班」这类干预产物名词）
  /补课班|补习班|补习|家教|辅导班|培训班|培训课程|网课|网课上|课程|教材|教辅|练习题|题库|秘籍|诀窍|攻略|心得|方法|法子|办法|策略|打法|战术|方案|政策|措施|新规|新制度|激励机制|激励政策|奖金|提成|绩效|考核|KPI|末位淘汰|晋升|提拔|调岗|换岗|重组|并购|收购|IPO|上市|融资|注资/,
];
const INTERVENE_EN = [
  /\b(?:took|taking|tried|hired|switched|changed|bought|used|started|joined|enrolled|prayed|consulted|wore|brought\s+in|replaced|adopted|signed\s+up\s+for|went\s+on)\b/i,
  // [r274] 新族：人事/制度变动名词形——「after the coaching change」
  // 「a new manager came in」（探针实测穿透：原表只收动词 hired/
  // replaced，不收 change/come in/new X 名词形）
  /\b(?:came\s+in|stepped\s+in|was\s+hired|got\s+hired|coaching\s+change|manager\s+change|managerial\s+change|change\s+of\s+(?:coach|manager|leadership)|new\s+(?:manager|coach|CEO|CFO|boss|leadership|regime|staff))\b/i,
  // [r302] 并入：干预主体名词形（EN）——buyback/rebrand/promotion 等
  // 公司制度与商业动作（探针实证：A2「the buyback backfired」整族穿透，
  // INTERVENE_EN 原表只收 hired/replaced/came in 动词形）
  /\b(?:buyback|buy[- ]back|repurchase|repurchases|share\s+repurchase|dividend|stock\s+buyback)\b/i,
  /\b(?:rebrand|rebranding|relaunch|relaunched|reorganization|restructuring|re[- ]org|restructure|pivot|new\s+strategy|strategy\s+change|new\s+policy|policy\s+change|reform|new\s+regime|regime\s+change|initiative|program\s+rollout|rollout)\b/i,
  /\b(?:promotion|demotion|transfer|reassignment|bonus|incentive|commission|stock\s+option|equity\s+grant|severance|hiring\s+freeze|layoffs?|redundancy)\b/i,
];

// ─── 腿③ CREDIT 功劳归因（中文）──────────────────────────────────────
const CREDIT_ZH = [
  /是因为|多亏|全靠|幸亏|好在|幸好|还好我|幸亏是|多亏了|功劳|靠的是|靠它|归功于|居功至伟|功臣|头功|首功|大功臣|之所以/,
  /让[^。；，]{0,10}(?:好起来|好了|赢|成|活|挺过来|治|救)/,
  /把[^。；，]{0,10}(?:治好|救了|救活|解决|搞定)/,
  // [r265] 新族：救了场/扭转局面——「新包装救了场」
  /救了场|救场|救了局|扭转了|扭转乾坤|起死回生|强心针|续了命|救了公司/,
];
const CREDIT_EN = [
  /\b(?:because\s+of|thanks\s+to|credit\s+to|due\s+to|it\s+was\s+thanks|owe\s+it\s+to)\b/i,
  // [r302] 并入：证明型归因连接词——「proving the buyback backfired」
  // 「showing the reform worked」（探针实证：A2 的 proving 不在原表）
  /\b(?:proving|showing|demonstrating|indicating|revealing|confirming|meaning|suggesting)\b/i,
];

// ─── 腿③ EFFECT 功效断言（中文，含「一X就」紧缩形）────────────────────
const EFFECT_ZH = [
  /有效|见效|起作用|起了作用|发挥作用|有用|管用|很灵|灵验|很准|神了|神奇|立竿见影|药到病除/,
  /治好|治愈|痊愈|解决了|成功了|赢了|拿下|没白|值得|是对的|没错|靠谱|名不虚传|果真|果然/,
  /很关键|关键作用|真管用|确实有用|有效果|疗效|功效|相当有用|挺有用|很有用|真的有用/,
  /一(?:吃|贴|试|换|改|请|拜|用|下)就/,
  // [r265] 新族：走对了/步好棋（决策正确性断言）——「换人这步棋走对了」
  // [r274] 并入：即时性断言族——干预后「立马/立刻/当即」就见效，或
  // 「就+反弹动词」紧缩形（探针实测「立马就翻盘了」「这个月就止住
  // 颓势了」「三月就追了上来」整族零命中；并入既有元素以保 r265
  // 登记断言 EFFECT_ZH.length===5）
  /走对了|这步棋走对|步好棋|步妙棋|是关键|是关键因素|是转折点|神来之笔|棋走对了|立马|立刻|当即|随即|顿时|一下子就|一下就|就翻盘|就翻身|就止住|就扭转|就追了上|就爬了上|就缓过来|就缓了过来|就回升|就止颓|起反作用|起了反作用|反作用|帮了倒忙|帮倒忙|越帮越忙|适得其反|弄巧成拙|事与愿违|南辕北辙|背道而驰|反而更差|反而越来越差|反而更糟|反而更坏|反而更弱|反而更低|反而害|反而伤|反而拖累|反而连累|是个错误|是个失误|是败笔|是昏招|是臭棋|是错棋|是失策|是失算|是错着|一招错棋|一招臭棋|棋走错了|走错了|下错了|选错了|押错了|请错了/,
];
const EFFECT_EN = [
  /\b(?:work|works|worked|working|effective|helped|fixed|cured|healed|solved|won|paid\s+off|did\s+the\s+trick|made\s+the\s+difference|turned\s+(?:it\s+)?around|it\s+was\s+the)\b/i,
  // [r274] 即时性断言族（EN）：「Q2 bounced right back」「broke out
  // immediately」——干预后即刻见效（探针实测穿透：原表无即时副词形）
  /\b(?:immediately|instantly|promptly|right\s+away|shortly\s+after|bounced\s+right\s+back|came\s+right\s+back)\b/i,
  // [r302] 并入：负向功效断言族（EN）——backfired / was a mistake /
  // counterproductive（探针实证：原表只收正向功效形，负向断言整族穿透。
  // 注意不收裸 backfire/backfiring 名词形——「not necessarily the
  // buyback backfiring」由 gate 层 EXEMPT_NEG 捕获）
  /\b(?:backfired|misfired|did\s+the\s+opposite|made\s+(?:things|it|matters)\s+worse|counterproductive|counter[- ]productive|self[- ]defeating|boomeranged)\b/i,
  /\b(?:was|proved|turned\s+out\s+to\s+be|has\s+been)\s+(?:a\s+)?(?:mistake|error|blunder|misstep|misjudg|wrong\s+call|bad\s+call|poor\s+decision|failed\s+policy)\b/i,
  /\b(?:should\s+not\s+have|shouldn'?t\s+have|ought\s+not\s+to\s+have)\b/i,
];

// ─── [r302 新族] 负向功效断言腿（独立路由，不需要极端高位腿）────────────
// 攻击形态：「干预 X 起了反作用 / 帮了倒忙 / 使情况更糟」——把自然回落
// 归咎于干预之过（与主判据的「把回落归功于干预」互为镜像，同属回归
// 均值误归因）。两腿：干预主体 × 负向功效断言。
// 注意：不收裸 backfire/backfiring 名词形（「not necessarily the buyback
// backfiring」由 EXEMPT_NEG 捕获），只收谓语断言形。
const NEG_EFFECT_ZH = [
  /起了反作用|起反作用|反作用|帮了倒忙|帮倒忙|越帮越忙|适得其反|弄巧成拙|事与愿违|南辕北辙|背道而驰/,
  /反而更差|反而更糟|反而更坏|反而更弱|反而更低|反而更慢|反而更贵|反而害|反而伤|反而拖累|反而连累|反而打|反而压/,
  /(?:是|成了|算是|变成|沦为)[^。；，]{0,6}(?:错误|失误|败笔|昏招|臭棋|错棋|失策|失算|错着|失手|败着|祸根|隐患|负担|包袱|累赘)/,
  /(?:走|下|选|押|请|用|带|教|推|弄|搞)[^。；，]{0,4}(?:错|砸|翻车|翻船|走眼|失手|失算|失策|搞砸|办砸|弄砸)/,
  /(?:多此一举|画蛇添足|得不偿失|矫枉过正|过犹不及|搬起石头|作茧自缚|自食其果|自讨苦吃|咎由自取)/,
  /(?:抑制|压制|打击|挫伤|削弱|损害|伤害|破坏|毁了|拖垮|拖后腿|浇灭|打消|磨灭)[^。；，]{0,8}(?:积极性|主动性|热情|信心|士气|斗志|创造力|兴趣|动力|干劲)/,
  /(?:把|令|使|让)[^。；，]{0,10}(?:更差|更糟|更坏|更弱|更低|更慢|更贵|每况愈下|雪上加霜|一蹶不振|一落千丈)/,
];
const NEG_EFFECT_EN = [
  /\b(?:backfired|misfired|did\s+the\s+opposite|made\s+(?:things|it|matters)\s+worse|counterproductive|counter[- ]productive|self[- ]defeating|boomeranged|had\s+the\s+opposite\s+effect)\b/i,
  /\b(?:was|proved|turned\s+out\s+to\s+be|has\s+been)\s+(?:a\s+)?(?:mistake|error|blunder|misstep|misjudg|wrong\s+call|bad\s+call|poor\s+decision|failed\s+policy|fiasco|disaster)\b/i,
  /\b(?:should\s+not\s+have|shouldn'?t\s+have|ought\s+not\s+to\s+have|should\s+never\s+have)\b/i,
  /\b(?:suppressed|sapped|killed|crushed|dampened|damped|hurt|damaged|undermined|eroded|demoralis(?:ed|ing)|demoraliz(?:ed|ing))\b/i,
  /\b(?:backfired|boomeranged)\s+on\b/i,
];

// ─── [r300 新族] 表扬/批评/奖惩「反馈干预」族（真升级②，独立路由）──────
// Kahneman 经典回归均值陷阱：把极端表现后的自然回归，归功/归罪于同期施加的
// 表扬/批评/责骂/奖励/惩罚/换下场/警告等「行为反馈干预」。存量 INTERVENE 表
// 只收 吃药/换帅/报班/加仓 等物质/人事干预，不收 praise/criticize/scold/
// reward/punish/bench/warn 这类反馈动词；存量 EXTREME 表只收 最差/谷底/
// 暴跌 等统计极端词，不收 考得差/poor form/played terribly 这类表现型极端。
// r300 池化探针（scripts/round-300/probe-feedback-r300.js，v6.8.174 实测）
// 该族 8/14 攻击真零命中（gate=pass 且零维度承重）、良性 8/8 干净。
// 本族为**独立三腿路由**（不并入存量数组——存量 EXTREME_LOW_ZH/INTERVENE_ZH/
// EFFECT_ZH/EXEMPT_NEG_ZH 等有登记断言 length===N，追加会打破 round-265 单测），
// 与主判据 legsZh/legsEn 并行，命中即 hit。豁免（概念教学/实验证据/推理否定/
// 对冲/疑问）在 checkRegressionToMean 入口统一先判，本族同享。

// 腿① FB_EXTREME 反馈语境极端基线（中文，双向：低=受批评方，高=受表扬方）
const FB_EXTREME_ZH = [
  // 成绩/表现/状态低
  /考得差|考差了|考砸|没考好|没及格|不及格|成绩差|成绩下滑|成绩下降|挂科|考了低分|分数很低|考得糟糕/,
  /表现差|表现很差|表现不佳|表现不好|发挥失常|发挥不好|屡屡失误|失误很多|失误频频|频频出错|频频失误|错误百出|漏洞百出|状态差|状态低迷|状态不好|不在状态|魂不守舍|心不在焉/,
  // 成绩/表现高（表扬/奖励后退步方向）
  /考了满分|拿了满分|得了满分|考了第一|拿了第一|考了高分|表现特别好|表现出色|发挥出色|表现极好|状态极佳|创了纪录|破了纪录|拿了奖|获了奖|发挥完美/,
];
// 腿① FB_EXTREME（英文，双向）
const FB_EXTREME_EN = [
  /played\s+(?:terribly|awfully|badly|poorly|horribly)|playing\s+(?:terribly|awfully|badly|poorly)/i,
  /poor\s+form|off\s+(?:his|her|their)\s+game|rough\s+patch|in\s+a\s+slump|out\s+of\s+form/i,
  /bad\s+grade|poor\s+grade|failed\s+the\s+(?:test|exam)|did\s+(?:badly|poorly)|awful\s+(?:serve|game|performance|quarter)/i,
  /performance\s+(?:dipped|dropped|declined|slipped|sagged)|productivity\s+(?:dipped|dropped|declined)/i,
  /record\s+(?:quarter|month|year|season)|best\s+(?:quarter|month|year)|top\s+of\s+(?:the|his|her)\s+class|straight\s+A'?s|perfect\s+score|great\s+report\s+card|excellent\s+performance/i,
];
// 腿② FB_REGRESSION 反馈语境回归变化（中文，双向：升=低处回升，降=高处退步）
const FB_REGRESSION_ZH = [
  /考好了|考好了不少|成绩上来了|成绩提了上来|提了上来|提上来了|进步了|进步很大|追上来了|赶上来了|赶了上来|认真了|认真起来|很少出错|不出错了|失误[就才也]?少了|错误[就才也]?少了|表现好起来|状态回来了|又发挥出来了|好转了|听话了|回升|提了上来|扳了回来/,
  /退步了|退步很大|成绩下滑了|掉了下来|滑了下来|骄傲了|自满了|松懈了|放松了|翘尾巴|不思进取|下滑了|落后了|得意了|飘了|赢了下来|逆转了|翻盘了/,
];
// 腿② FB_REGRESSION（英文，双向）
const FB_REGRESSION_EN = [
  /played\s+(?:great|well|better)|aced\s+the\s+next|served\s+aces|did\s+(?:great|better|well)|won\s+the\s+next/i,
  /studied\s+harder|got\s+better|improved|bounced\s+back|recovered|turned\s+it\s+around|picked\s+up/i,
  /got\s+an?\s+[A-F]\b|received\s+an?\s+[A-F]\b|earned\s+an?\s+[A-F]\b/i,
  /sales\s+(?:fell|dropped|declined)|performance\s+(?:fell|dropped|declined|slipped)|grades?\s+(?:fell|dropped|slipped)/i,
  /did\s+(?:poorly|worse)|got\s+worse|slipped\s+back|fell\s+back/i,
];
// 腿③ FB_INTERVENE 反馈/行为干预动作（中文）
const FB_INTERVENE_ZH = [
  /责骂|骂了一顿|骂了他|骂了她|训斥|训了一顿|训了他|训了她|责备|指责|数落|苛责|狠批|批了一顿|批评了一顿|严厉批评|点名批评|当众批评|批评/,
  /表扬|夸奖|夸了|称赞|赞许|赞扬|表彰|嘉奖|肯定了他|肯定了她/,
  /奖励|奖赏|给了奖励|发了奖金|发奖金|发红包|给了奖金|物质奖励/,
  /惩罚|处罚|罚了|罚他|罚她|禁赛|摁在板凳|按在替补|换下场|换他下场|警告|处分|记过|约谈|扣了奖金|扣奖金|取消了[^。！？!?]{0,6}(?:游戏|玩具|零花钱|资格|权利)/,
];
// 腿③ FB_INTERVENE（英文）
const FB_INTERVENE_EN = [
  /critici[sz]ed|scolded|yelled\s+at|chewed\s+(?:him|her|them)\s+out|reprimanded|berated|bawled\s+out/i,
  /praised|complimented|lauded|commended|applauded|congratulated/i,
  /rewarded|gave\s+(?:him|her|them)\s+a\s+(?:bonus|reward)|bonus|incentiv(?:e|ized)/i,
  /punished|grounded|docked\s+(?:his|her|their)\s+pay|gave\s+(?:him|her|them)\s+a\s+warning|warning|benched|dropped\s+(?:him|her)|demoted|suspended/i,
];
// 腿③ FB_ATTRIB 反馈语境功劳/功效归因（中文）
const FB_ATTRIB_ZH = [
  /有用|有效|起作用|起了作用|管用|很灵|见效|立竿见影|奏效|有效果|有成效|是对的|走对了|很关键|是关键|果然/,
  /能提高|会提高|提高了成绩|提升了成绩|提高了分|提升了效率/,
  /骄傲|自满|松懈|翘尾巴|不思进取|得意忘形|浮躁|飘飘然/,
];
// 腿③ FB_ATTRIB（英文）
const FB_ATTRIB_EN = [
  /\bworks\b|\bworked\b|\bhelps\b|\bhelped\b|did\s+the\s+trick|made\s+the\s+difference|turned\s+(?:him|her|them)\s+around|paid\s+off|is\s+effective/i,
  /backfires?|backfired|makes?\s+(?:him|her|them|people|kids|children|staff|employees)\s+(?:complacent|overconfident|lazy|arrogant|cocky|careless)/i,
  /clearly\s+(?:works|helps|is\s+effective)|obviously\s+(?:works|helps|makes)/i,
];

// ─── 豁免一：概念/教学转述 ────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /均值回归|回归均值|向均值回归|平均数的回归|自然回归|自然波动|大数定律|中心极限|样本量|极端值/,
  /统计学|统计学家|教科书|课本|教材|课堂|教案|论文|科普|谬误|误区|陷阱|概念/,
];
const EXEMPT_META_EN = [
  /\b(?:regression\s+to\s+the\s+mean|regression\s+toward\s+the\s+mean|law\s+of\s+large\s+numbers|central\s+limit|statistics|statistical|textbook|lecture|fallacy|outliers)\b/i,
];

// ─── 豁免二：实验/证据语境（受控设计或已对回归校正）────────────────────
const EXEMPT_EVID_ZH = [
  /随机对照|对照组|实验组|干预组|双盲|安慰剂|盲测|盲评|控制变量|控制了|控制后|剔除|去掉极端值|剔除极端值|剔除极值|截尾|温莎化|调整后|基线校正|校正了|校正后/,
  /前瞻性|回顾性|队列研究|元分析|临床试验|纵向|自然实验|准实验|断点回归|双重差分|工具变量|倾向得分|随机分组/,
  /数据显示|数据表明|统计显示|统计表明|研究表明|研究显示|证据表明|有证据|实验表明|实验证明|实测/,
];
const EXEMPT_EVID_EN = [
  /\b(?:randomi[sz]ed|controlled\s+trial|RCT|control\s+group|treatment\s+group|placebo|double[-\s]blind|prospective|cohort|meta[-\s]analysis|clinical\s+trial|longitudinal|natural\s+experiment|quasi[-\s]experiment|trimmed|winsori[sz]ed|excluded\s+outliers|baseline[-\s]adjusted|adjusted\s+for|controlling\s+for|instrumental\s+variable|propensity)\b/i,
  /\b(?:data\s+show|data\s+suggest|evidence\s+shows|studies\s+show|experiment\w*|survey\w*)\b/i,
];

// ─── 豁免三：推理否定 / 反向承认 ──────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不能说明|不能证明|不能排除|不能全归|不能都归|不能单靠|不代表|不等于|并不意味着|不意味着|推不出|不足以|未必|不一定|很难说|不见得|不好说|说不清|难以确定|无法确定|还要观察|有待验证|无法证明|证明不了|难以断定|存疑|尚不/,
  /可能是自然|其实是均值|可能只是|或者是|也可能|未必是/,
  // [r265] 新族：要求补证据/拉长观察窗——「需要看同期大盘再下结论」
  // 「效果还要看长期」：主动要求对照或更长窗口是正确判别姿态
  // [r274] 并入：显式存疑尾句——「不过一个样本说明不了什么」（r265
  // 良性-7 在 EFFECT 腿补 立刻 族后翻转，按其设计意图补显式免责标记；
  // 并入既有元素以保 r265 登记断言 EXEMPT_NEG_ZH.length===3）
  /还要看|需要看|待观察|以长期|拉长看|长期为准|让子弹飞|走着瞧|说明不了什么|证明不了什么|说明不了问题|不足为凭|样本太少|样本不够|以偏概全|个案说明/,
];
const EXEMPT_NEG_EN = [
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|can'?t\s+conclude|not\s+necessarily|insufficient|no\s+evidence|does\s+not\s+prove|doesn'?t\s+prove|cannot\s+prove|can'?t\s+prove|fails\s+to\s+show|may\s+just\s+be|might\s+just\s+be|could\s+simply\s+be|natural\s+regression|regression\s+to\s+the\s+mean)\b/i,
  // [r274] 显式存疑尾句（EN）：「though one season proves nothing」——
  // 与 EXEMPT_NEG_ZH 的「一个样本说明不了什么」同级
  /\bproves?\s+(?:nothing|little)\b|\b(?:one|a\s+single)\s+(?:season|sample|data\s+point)\s+proves\b|\bshows?\s+nothing\b|\bproves?\s+nothing\b/i,
];

// ─── 豁免四：对冲 ─────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|i\s+suspect|could\s+be)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 收集 source 列表中所有匹配的起始下标 */
function positions(list, text) {
  const out = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      out.push(m.index);
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return out;
}

/**
 * 三腿 + 叙事窗：存在 e∈EXTREME, r∈REGRESSION 使 |e-r|≤win，且存在
 * a∈ATTRIB 使 min(|a-e|,|a-r|)≤win（干预与归因互为邻居即算同叙事）。
 */
function legsZh(text, R) {
  const ext = (positions(R.EXTREME_LOW_ZH || EXTREME_LOW_ZH, text))
    .concat(positions(R.EXTREME_HIGH_ZH || EXTREME_HIGH_ZH, text));
  const reg = (positions(R.REG_UP_ZH || REG_UP_ZH, text))
    .concat(positions(R.REG_DOWN_ZH || REG_DOWN_ZH, text));
  if (ext.length === 0 || reg.length === 0) return false;
  const interv = positions(R.INTERVENE_ZH || INTERVENE_ZH, text);
  const credit = positions(R.CREDIT_ZH || CREDIT_ZH, text);
  const effect = positions(R.EFFECT_ZH || EFFECT_ZH, text);
  if (interv.length === 0 || (credit.length === 0 && effect.length === 0)) return false;
  const attrib = credit.concat(effect);
  const WIN = 40;
  for (const e of ext) {
    for (const r of reg) {
      if (Math.abs(e - r) > WIN) continue;
      for (const a of attrib) {
        if (Math.min(Math.abs(a - e), Math.abs(a - r)) <= WIN) return true;
      }
    }
  }
  return false;
}

function legsEn(text, R) {
  const ext = (positions(R.EXTREME_LOW_EN || EXTREME_LOW_EN, text))
    .concat(positions(R.EXTREME_HIGH_EN || EXTREME_HIGH_EN, text));
  const reg = (positions(R.REG_UP_EN || REG_UP_EN, text))
    .concat(positions(R.REG_DOWN_EN || REG_DOWN_EN, text));
  if (ext.length === 0 || reg.length === 0) return false;
  const interv = positions(R.INTERVENE_EN || INTERVENE_EN, text);
  const credit = positions(R.CREDIT_EN || CREDIT_EN, text);
  const effect = positions(R.EFFECT_EN || EFFECT_EN, text);
  if (interv.length === 0 || (credit.length === 0 && effect.length === 0)) return false;
  const attrib = credit.concat(effect);
  const WIN = 120;
  for (const e of ext) {
    for (const r of reg) {
      if (Math.abs(e - r) > WIN) continue;
      for (const a of attrib) {
        if (Math.min(Math.abs(a - e), Math.abs(a - r)) <= WIN) return true;
      }
    }
  }
  return false;
}

// ─── [r300 新族] 反馈干预族路由（与 legsZh/legsEn 并行，命中即 hit）─────
// 三腿：FB_EXTREME × FB_REGRESSION 邻近（同一叙事窗），且 FB_INTERVENE 与
// FB_ATTRIB 均靠近 极端或回归（干预与归因互为邻居即算同一次反馈叙述）。
// 叙事窗与主判据一致（ZH 40 / EN 120）。
function feedbackZh(text, R) {
  const ext = positions(R.FB_EXTREME_ZH || FB_EXTREME_ZH, text);
  const reg = positions(R.FB_REGRESSION_ZH || FB_REGRESSION_ZH, text);
  if (ext.length === 0 || reg.length === 0) return false;
  const interv = positions(R.FB_INTERVENE_ZH || FB_INTERVENE_ZH, text);
  const attrib = positions(R.FB_ATTRIB_ZH || FB_ATTRIB_ZH, text);
  if (interv.length === 0 || attrib.length === 0) return false;
  const WIN = 40;
  for (const e of ext) {
    for (const r of reg) {
      if (Math.abs(e - r) > WIN) continue;
      const ivOk = interv.some(iv => Math.min(Math.abs(iv - e), Math.abs(iv - r)) <= WIN);
      if (!ivOk) continue;
      const atOk = attrib.some(a => Math.min(Math.abs(a - e), Math.abs(a - r)) <= WIN);
      if (atOk) return true;
    }
  }
  return false;
}

function feedbackEn(text, R) {
  const ext = positions(R.FB_EXTREME_EN || FB_EXTREME_EN, text);
  const reg = positions(R.FB_REGRESSION_EN || FB_REGRESSION_EN, text);
  if (ext.length === 0 || reg.length === 0) return false;
  const interv = positions(R.FB_INTERVENE_EN || FB_INTERVENE_EN, text);
  const attrib = positions(R.FB_ATTRIB_EN || FB_ATTRIB_EN, text);
  if (interv.length === 0 || attrib.length === 0) return false;
  const WIN = 120;
  for (const e of ext) {
    for (const r of reg) {
      if (Math.abs(e - r) > WIN) continue;
      const ivOk = interv.some(iv => Math.min(Math.abs(iv - e), Math.abs(iv - r)) <= WIN);
      if (!ivOk) continue;
      const atOk = attrib.some(a => Math.min(Math.abs(a - e), Math.abs(a - r)) <= WIN);
      if (atOk) return true;
    }
  }
  return false;
}

// ─── [r302 新族] 负向功效断言路由（干预主体 × 负向功效断言，邻近窗）─────
// 与主判据/反馈族并行。不要求极端高位腿——攻击形态本身就是
// 「干预 X 反而使情况更糟」，这是把自然回落归罪于干预，同属回归
// 均值误归因的镜像形式。豁免（EXEMPT_*）在调用方 checkRegressionToMean
// 统一前置，故此处不再重复。
function negZh(text, R) {
  const iv = positions(R.INTERVENE_ZH || INTERVENE_ZH, text);
  const ne = positions(R.NEG_EFFECT_ZH || NEG_EFFECT_ZH, text);
  if (iv.length === 0 || ne.length === 0) return false;
  const WIN = 40;
  for (const i of iv) {
    for (const n of ne) {
      if (Math.abs(i - n) <= WIN) return true;
    }
  }
  return false;
}

function negEn(text, R) {
  const iv = positions(R.INTERVENE_EN || INTERVENE_EN, text);
  const ne = positions(R.NEG_EFFECT_EN || NEG_EFFECT_EN, text);
  if (iv.length === 0 || ne.length === 0) return false;
  const WIN = 120;
  for (const i of iv) {
    for (const n of ne) {
      if (Math.abs(i - n) <= WIN) return true;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkRegressionToMean(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 实验证据 / 推理否定 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hit = isZh ? legsZh(text, R) : legsEn(text, R);
  // [r300] 反馈干预族（表扬/批评/奖惩）独立路由，与主判据并行
  const fbHit = isZh ? feedbackZh(text, R) : feedbackEn(text, R);
  // [r302] 负向功效断言族（干预起了反作用/帮了倒忙）独立路由
  const negHit = isZh ? negZh(text, R) : negEn(text, R);
  if (!hit && !fbHit && !negHit) return { hit: false, score: 0, detail: '', count: 0 };

  // 计分：基础 0.62 + 功劳归因形 0.06 + 显式干预动词形 0.04，封顶 0.85
  // [r300] 归因/干预腿计入反馈族 FB_ATTRIB / FB_INTERVENE（反馈族命中时主表不承重）
  let score = 0.62;
  const hasCredit = anyHit(R.CREDIT_ZH || CREDIT_ZH, text) || anyHit(R.CREDIT_EN || CREDIT_EN, text)
    || anyHit(R.FB_ATTRIB_ZH || FB_ATTRIB_ZH, text) || anyHit(R.FB_ATTRIB_EN || FB_ATTRIB_EN, text);
  const hasInterv = anyHit(R.INTERVENE_ZH || INTERVENE_ZH, text) || anyHit(R.INTERVENE_EN || INTERVENE_EN, text)
    || anyHit(R.FB_INTERVENE_ZH || FB_INTERVENE_ZH, text) || anyHit(R.FB_INTERVENE_EN || FB_INTERVENE_EN, text);
  if (hasCredit) score += 0.06;
  if (hasInterv) score += 0.04;
  if (score > 0.85) score = 0.85;

  const detail = (fbHit && !hit)
    ? (isZh
      ? '回归均值×表扬/批评/奖惩反馈干预误归因(zh)'
      : 'regression to the mean×praise/blame/reward feedback misattribution(en)')
    : (negHit && !hit)
      ? (isZh
        ? '回归均值×干预负向功效误归因(zh)'
        : 'regression to the mean×intervention backfire misattribution(en)')
      : (isZh
        ? '回归均值误归因×极端基线后自然回归被当成干预功劳(zh)'
        : 'regression to the mean×natural rebound credited to intervention(en)');

  return { hit: true, score, count: 1, detail };
}

module.exports = {
  checkRegressionToMean,
  __internals: () => ({
    EXTREME_LOW_ZH, EXTREME_HIGH_ZH, EXTREME_LOW_EN, EXTREME_HIGH_EN,
    REG_UP_ZH, REG_DOWN_ZH, REG_UP_EN, REG_DOWN_EN,
    INTERVENE_ZH, INTERVENE_EN, CREDIT_ZH, CREDIT_EN, EFFECT_ZH, EFFECT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    // [r300] 反馈干预族常量（负例注入承重目标）
    FB_EXTREME_ZH, FB_EXTREME_EN, FB_REGRESSION_ZH, FB_REGRESSION_EN,
    FB_INTERVENE_ZH, FB_INTERVENE_EN, FB_ATTRIB_ZH, FB_ATTRIB_EN,
    // [r302] 负向功效断言族常量（负例注入承重目标）
    NEG_EFFECT_ZH, NEG_EFFECT_EN,
  }),
};
