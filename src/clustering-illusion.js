/**
 * src/clustering-illusion.js — 「集群错觉（clustering illusion / Texas
 * sharpshooter fallacy）」检测器（第 171 个判别维度）
 *
 * [r173 立项] decision 本体在当前引擎（v6.8.100，170 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia "conjunction
 * fallacy" 命中 Wikipedia Conjunction_fallacy 经典文献链与 "Linda the Bank
 * Teller, by Tversky&Kahneman"；GitHub fallacy-detection 仓库群
 * latent-variable/Real_time_fallacy_detection ★119 / tmakesense/
 * logical-fallacy ★20 / panFJCharlotte98/Fallacy_Detection（EMNLP2024）★5
 * ——全部 LLM-based，与纯规则引擎不同构，仅作概念背景）+ 引擎差距实测：
 * hot_hand 只管「势头×延续性预测」，post_hoc/pseudo_causal 只管「时序连接×
 * 因果断言」，selection_bias 只管「取样受限×总体推广」，survivorship_bias
 * 只管「幸存者取样×总体推广」；「随机聚集×否认巧合/特殊归因」这一族
 * （德州神枪手：往墙上随机开枪再围着弹孔画靶）零覆盖。本维度是独立
 * dimMap 键的新攻击族。
 *
 * 辨别的族：集群错觉（clustering illusion / Texas sharpshooter fallacy）
 * ——把**随机数据中的聚集、连续、扎堆、集中**出现的事件，当成「绝不是
 * 巧合」「显然有蹊跷」「一定有特殊原因」「这是逃不掉的规律」的显著性
 * 证据。随机分布在时间、空间、类别上本就会出现聚集；把聚集读成必然、
 * 反常或神秘规律，是把噪声当信号：
 *   这个路口一个月出了四起事故，绝不可能是巧合。
 *   最近三个月，同一个小区接连发生了五起入室盗窃，显然这里面有蹊跷。
 *   三个中奖者全都来自同一条街，这绝不是偶然。
 *   这个部门每逢周一必出事，简直是逃不掉的魔咒。
 *   Four accidents happened at the same intersection in one month, which
 *   cannot be a coincidence.
 *   Three lottery winners all came from the same street — that can't be
 *   random.
 *
 * 与既有维度的边界（r173 归因）：
 *   · hot_hand 管「连胜势头×下一局还会赢」的**前瞻性**预测，本族是
 *     **回顾性**聚集×显著性归因，可无任何预测；
 *   · post_hoc / pseudo_causal 管「A 在 B 前发生所以 A 导致 B」的时序
 *     因果，本族聚集不依赖时间先后，结论也不是具体因果而是特异性/
 *     必然性（「周五有问题」「这是规律」）；
 *   · selection_bias 管「取样受限×向总体推广」，本族可无总体推广，只判
 *     聚集本身被赋予的意义；
 *   · fallacies 内的聚类相关子标签与本维度是家族内共存关系（同 r171
 *     base_rate_neglect 与 r172 whole_part_transfer 先例，不构成重复）。
 *
 * 判据（两腿共现，缺一不判）：
 *   腿① CLUSTER 聚集陈述，三条路线任一成立：
 *     a. 聚集语义词（连续/接连/接二连三/扎堆/集中/频发/高发/屡屡/频频/
 *        隔三差五/每逢/每当/每次/历来/向来；EN in a row/in succession/
 *        consecutive/clustered/spate/streak/every Friday）× 事件名词
 *        （事故/案件/盗窃/中奖/倒闭/猝死/投诉/故障/纠纷/空难/坠机/失踪/
 *        复发……裸名词形态；EN accidents/incidents/crashes/complaints/
 *        lawsuits/suicides）落在 12 字（EN 20 字符）窗内（前后双向）；
 *     b. 同一来源（全都/都/皆/清一色/无一例外 + 来自/出自/毕业于/就职于/
 *        指向/死于 + 同一/同一个/同一条/同属；EN all … from/at/in …
 *        same）——德州神枪手的「挑出来的共同点」形态；
 *     c. 数量≥2（四起/五起/好几个/数次；EN two/three/four/several/
 *        multiple）× 事件名词（后 6 字窗，含倒装「事故四起」）。
 *   腿② SIGNIF 显著性归因，五形任一成立：
 *     R1 否认巧合（绝不是/绝非/一定不是/不可能只是/并非只是/不只是 ×
 *        巧合/偶然/随机；EN can't be / is not just / more than / far from
 *        × coincidence/chance/random）；
 *     R2 异常断言（显然/肯定/一定/可见/说明/意味着/证明 × 蹊跷/反常/有猫腻/
 *        说不通/邪门/诡异/离奇/不同寻常；EN clearly/obviously/must/means ×
 *        sinister/fishy/inexplicable/pattern/law）；
 *     R3 神秘归因（天意/天命/劫数/魔咒/宿命/冥冥/幕后黑手/暗中操控/风水/
 *        玄学/诅咒/看不见的手；EN cursed/doomed/destiny/fate/omen/universe
 *        is telling）；
 *     R4 定律化（逃不过/躲不掉/在劫难逃/铁律/命中注定/历史重演；EN doomed/
 *        inescapable/bound to happen/same fate）；
 *     R5 周期迷信（每逢/每当/每次 × 必/准/总 × 出事/故障/复发/吵架；EN
 *        every Friday something goes wrong）。
 *   缺腿不判：「这个路口一个月出了四起事故，交警排查后发现是信号灯配时
 *   问题」只有聚集陈述、无显著性归因（且排查属证据处理）；「连续三起投诉
 *   都指向同一个客服，说明培训有问题」指向已识别的共同原因而非任意属性的
 *   特异性；「三起案件虽然时间接近，但警方认定是同一伙流窜作案」是事实
 *   认定不是噪声判读。
 *
 * 为什么取 VERIFY 级：聚集本身可能是真实信号（信号灯配时故障、同一批缺陷
 * 零件）。verify 的含义是「这个聚集的显著性需要先过统计检验或共同机制
 * 证据」——调用方应要求补上基准率/泊松期望/共同机制的证据，而不是接受
 * 默认的「绝非巧合」。
 *
 * 明确不判的（豁免）：
 *   · 显式随机性/统计处理（随机序列/随机波动/按概率/概率论/大数定律/
 *     正态分布/独立事件/统计显著/置信区间/样本量/基准率/正常波动/不足为奇/
 *     查明/排查/数据显示/研究表明/对照组/归因于；EN randomly/by chance/
 *     probability/statistically significant/confidence interval/sample
 *     size/base rate/root cause/investigation found/attributed to）：
 *     承认随机性或给出统计与调查处理本身是正确判别；
 *   · 推理否定/证据不足（不代表/不意味着/推不出/说明不了/未必/不一定/
 *     证据不足/样本不足；EN does not mean/cannot conclude/insufficient
 *     evidence/not enough data）；
 *   · 对冲（可能/也许/或许/大概/恐怕/倾向于/碰巧/恰巧；EN maybe/perhaps/
 *     might/probably/seems）：概率化结论不作谬误判定（同 r161-r172 口径）；
 *   · 概念/教学转述（集群错觉/赌徒谬误/德州神枪手/热手谬误/概率论/统计学/
 *     老师/教材/课堂/卡尼曼；EN clustering illusion/Texas sharpshooter/
 *     apophenia/gambler's fallacy/hot hand/textbook/lecture）；
 *   · 疑问句（含 ?/？）：提问不是断言。
 *
 * [r265] 全新措辞家族扩展（真升级②，live 生效，维度计数不变）：
 * r265 池化探针（coordination/agent4/probes/r265-probe-pool.js，v6.8.156
 * 实测）本维度 3/3 攻击全穿透（gate.action=pass 且零维度承重），落地：
 *   · EVENT_ZH += 赌博结果事件族（开大/开小/豹子/通杀/连败/连胜/爆冷/
 *     输光）——探针实测「连着三把都开大，这台机器现在肯定在出大的档口」
 *     穿透（路线 a 的 CONC×EVENT 在赌博语境断链）；
 *   · SIGNIF_ANOM_ZH += 「档口/势头旺」异常断言族——赌博机器「热档口」
 *     读法的特异性目标词；
 *   · EVENT_EN += 赌博器械族（dice/rolls/jackpots/coin flips/spins）；
 *   · SIGNIF_ANOM_EN += clearly hot / on fire 断言紧贴族（与主表分开：
 *     bare hot 在英文财经/技术句误伤面大，只收断言模态紧贴形）；
 *   · CONC_EN +=「N times in a row」整段匹配形——探针实测「The dice
 *     came up six three times in a row」穿透：既有 'in a row' 匹配起点
 *     太靠后（20 字符前向窗够不到 25 字符外的 dice），把数量词并进匹配
 *     使起点前移即覆盖，不改动既有窗宽（避免误伤面扩大）。
 *   未落地如实记录：「最近空难新闻扎堆出现，看来乘飞机出行进入高危期了」
 *   ——新闻聚集×风险结论是 availability_bias 家族形态，且「看来×高危期」
 *   在公共卫生文本中误伤面大（"看来疫情进入高发期"为正当分析），不造
 *   第三条判别路径。
 */
'use strict';

// ─── 腿① CLUSTER 路线 a：聚集语义词（中文，裸词形态）────────────────
// 枚举腿自查（161 轮教训）：聚集词全部取可独立出现的裸词形；「往往/常常/
// 时不时」等泛化副词不收（ benign 技术句「往往会出现 X」误伤风险），
// 时间周期词（每逢/每当/每次/历来/向来）收裸词形。
const CONC_ZH = [
  /连续|接连|连着|接二连三|接连不断|扎堆|扎堆儿|集中|密集|频发|高发|屡屡|频频|隔三差五|三番五次|前后脚|一茬接一茬|层出不穷|接踵而至|动辄|每逢|每当|每次|历来|向来/,
];

// ─── 腿① CLUSTER 路线 c：数量≥2（中文，前后倒装双向）────────────────
const COUNT_ZH = [
  /[两三四五六七八九十数几多][起个次名人艘头宗件届批]|好几|多起|多个|数次|数起/,
];

// ─── 腿① CLUSTER 路线 b：同一来源（中文）────────────────────────────
// 「全都/都/皆/清一色/无一例外」×（来源动词）×（同一性限定）：挑出来的
// 共同点形态。不要求事件名词（「三个中奖者全都来自同一条街」的中奖者
// 已含事件语义）。
const SAME_SRC_ZH = [
  /(?:全都|都|皆|全部|无一例外|清一色|个个|每一位|每一名|每个人)[^。，！？!?,;；\n]{0,8}(?:来自|出自|产自|毕业于|就读于|就职于|供职于|输给|负于|死于|伤于|倒在|指向|涌向|投向|集中到)[^。，！？!?,;；\n]{0,8}(?:同一|同一个|同一条|同一家|同一届|同属|同为|一家|一处)/,
];

// ─── 腿① EVENT 事件名词（中文，裸名词形态）──────────────────────────
// 161 轮教训：只收事故型/事件型裸名词（事故/案件/中奖/倒闭/猝死…），
// 不收价格/涨跌类（上涨/下跌——benign 经济句误伤），不收离婚/出轨/判刑
// 等日常高频词。同族词去后缀仍命中（事故/事故事件?不——裸名词即收）。
const EVENT_ZH = [
  /事故|案件|盗窃|抢劫|诈骗|中奖|获奖|夺冠|当选|离职|跳槽|倒闭|破产|裁员|失业|录取|考上|落榜|落选|出生|死亡|去世|生病|患病|感染|搁浅|自杀|自尽|投诉|退货|退款|故障|纠纷|官司|诉讼|起诉|空难|坠机|失联|起火|爆炸|塌方|坍塌|丑闻|曝光|翻车|退赛|禁赛|受伤|猝死|晕倒|地震|余震|流星|陨石|袭击|枪击|失踪|走失|拐卖|被骗|复发|误诊|溺亡|溺死|爆雷|踩雷|亏损|出事|闹鬼|见鬼|犯病|病倒|坠楼|坠亡|泄漏|污染|停电|停摆|延误|取消|差评|干旱|洪水|泥石流|台风|海啸|瘟疫|疫情|传染病|身亡|遇难|丧生|夭折|塌陷|断轨|脱轨|追尾|侧翻|沉船|触礁|断水|断网|宕机|死机|闪退|泄密|泄露/,
  // [r265] 新族：赌博结果事件（开大/开小/豹子/通杀）与竞技连败连胜——
  // r265 池化探针实测「连着三把都开大，这台机器现在肯定在出大的档口」
  // 穿透（EVENT_ZH 无赌博结果形，CONC 连着 × EVENT 路线 c 断链）
  /开大|开小|豹子|通杀|通赔|连败|连赢|连胜|爆冷|输光|赔光|庄赢|闲赢/,
];

// ─── 腿② SIGNIF R1 否认巧合（中文）──────────────────────────────────
// 强否认词×巧合/偶然/随机，≤6 字窗。裸「不是巧合」不收（「这不是巧合，
// 警方查明是同一伙人干的」是证据归因，良性）；「一定不是/显然不是」等
// 强否定收。与豁免表的界线：豁免表只收「纯属/罢了/而已」类确认随机的
// 短语，绝不收裸「巧合/偶然/随机」，否则 R1 攻击会被自己的豁免吃掉。
const SIGNIF_NEG_ZH = [
  /(?:绝不是|绝非|绝不可能是|不可能是|断不是|断然不是|并不是|一定不是|肯定不是|必然不是|显然不是|明显不是|分明不是|当然不是|自然不会|不可能只是|不可能纯是|不可能仅仅是|并非只是|并非纯是|并非纯属|绝非纯属|不会是|岂会是|不只是|绝不仅仅是|绝非仅仅|很难只是|不太可能只是|并不能算是)[^。，！？!?,;；\n]{0,6}(?:巧合|偶然|随机)/,
];

// ─── 腿② SIGNIF R2 异常断言（中文）──────────────────────────────────
// 断言模态×异常/特异性词，≤10 字窗。裸「有问题」不收——「说明培训有
// 问题」「说明管道老化」是已识别机制的因果推断（良性）；只收指向
// 「这事情本身反常/蹊跷/不可解」的特异性断言。
const SIGNIF_ANOM_ZH = [
  /(?:显然|肯定|一定|必然|势必|可见|说明|意味着|证明|足以证明|注定|毫无疑问|清清楚楚|明明白白|摆明)[^。，！？!?,;；\n]{0,10}(?:蹊跷|反常|有猫腻|有鬼|说不通|不可理解|无法解释|难以解释|邪门|诡异|吊诡|古怪|离奇|不同寻常|非同一般|非同寻常|邪了门|有异样)/,
  // [r265] 新族：「档口」异常断言——r265 池化探针实测「这台机器现在肯定
  // 在出大的档口」穿透（赌博机器的「热档口」读法，SIGNIF_ANOM_ZH 无此
  // 特异性目标词）
  /(?:显然|肯定|一定|必然|势必|可见|说明|意味着|证明|足以证明|毫无疑问)[^。，！？!?,;；\n]{0,10}(?:档口|旺|火|势头旺|势头火|手风顺|财运旺)/,
];

// ─── 腿② SIGNIF R3 神秘归因（中文）──────────────────────────────────
// 只收神秘/超自然后门词（含必要搭配），不收裸「命运/上帝/神仙」——文学
// 与宗教日常文本误伤风险高。
const SIGNIF_MYST_ZH = [
  /幕后(?:黑手|有人|推手|操控|操纵|力量)|暗中(?:有人|操控|操纵|操作)|冥冥(?:之中|中)|天意|天命|劫数|魔咒|宿命|显灵|报应不爽|风水|玄学|灵异|超自然|诅咒|命里(?:注定|有时)|神秘(?:力量|法则)|看不见的手|天注定|老天(?:爷)?的?(?:意思|安排)|命运(?:的捉弄|的安排|驱使|轮回)|一股(?:神秘|看不见|说不清)/,
];

// ─── 腿② SIGNIF R4 定律化/宿命化（中文）─────────────────────────────
// 只收必然性/重演词，不收裸「规律/周期/定律」——「经济存在周期性」
// 「股价有规律可循」是正当分析（良性）。
const SIGNIF_LAW_ZH = [
  /逃不过|躲不掉|在劫难逃|铁律|命中注定|同样的结局|同样的下场|历史重演|悲剧(?:总会|再次|再度)?重演|反复上演|轮轮回/,
];

// ─── 腿② SIGNIF R5 周期迷信（中文）──────────────────────────────────
// 时间周期词×必然模态×事故型结果：「每逢周五必出事」。结果词表收窄到
// 事故/故障/犯病类，「每逢周五必开会」「每年春节总堵车」不判。
const SIGNIF_CYCLE_ZH = [
  /(?:每逢|每当|每次|历来|向来|年年|月月|周周|星期[一二三四五六日末天]|周[一二三四五六日末天])[^。，！？!?,;；\n]{0,8}(?:必|准|总|一定|必然|势必)[^。，！？!?,;；\n]{0,6}(?:出事|出问题|出事故|有事故|犯病|复发|吵架|闹矛盾|输球|失利|迟到|故障|死人|生病|崩|塌|炸|闹鬼|见鬼|病倒|猝死)/,
];

// ─── 英文侧腿① ───────────────────────────────────────────────────────
const CONC_EN = [
  /\b(?:in\s+a\s+row|in\s+succession|consecutive(?:ly)?|back[- ]to[- ]back|clustered|clustering|spate|rash|streak|run\s+of|series\s+of|one\s+after\s+another|repeatedly|frequently|every\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year))\b/i,
  // [r265] 新族：「N times in a row」整段匹配形——r265 池化探针实测
  // 「The dice came up six three times in a row」穿透：既有 'in a row'
  // 匹配起点太靠后（20 字前向窗够不到 25 字符外的 dice），把数量词
  // 并进匹配使起点前移即覆盖，不改动既有窗宽（避免误伤面扩大）
  /\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|several|\d+)\s+times?\s+in\s+a\s+row\b/i,
];
const COUNT_EN = [
  /\b(?:two|three|four|five|six|seven|eight|nine|ten|several|multiple|numerous|a\s+series\s+of|a\s+number\s+of|a\s+cluster\s+of)\b/i,
];
// 英文同一来源：all/every one … from/at/in/attended/graduated … same
const SAME_SRC_EN = [
  /\b(?:all|every\s+one|each\s+of\s+them|every\s+single\s+one)\b[^.]{0,25}\b(?:from|in|at|on|attended|graduated|worked|lived|came|pointed|traced)\b[^.]{0,20}\b(?:same|identical|one\s+and\s+the\s+same)\b/i,
];
// 事件名词（EN）：不收 failures/errors（「three errors in a row means a
// bug」是正常工程句，误伤风险高）
const EVENT_EN = [
  /\b(?:accidents?|incidents?|cases?|crimes?|thefts?|lawsuits?|deaths?|suicides?|resignations?|layoffs?|bankruptc(?:y|ies)|winners?|complaints?|outbreaks?|attacks?|shootings?|crashes?|defaults?|fires?|casualt(?:y|ies)|murders?|robberies?|frauds?|scandals?|collapses?|explosions?|kidnappings?|arrests?|convictions?|earthquakes?|hurricanes?|tornado(?:es)?|floods?|droughts?|outages?)\b/i,
  // [r265] 新族：赌博器械与结果事件（dice/rolls/jackpots）——r265 池化
  // 探针实测「The dice came up six three times in a row, so six is
  // clearly hot right now.」穿透（EVENT_EN 无赌博器械形）
  /\b(?:dice|rolls?|jackpots?|die\s+rolls?|coin\s+flips?|spins?)\b/i,
];

// ─── 英文侧腿② ───────────────────────────────────────────────────────
const SIGNIF_NEG_EN = [
  /\b(?:can'?t|cannot|can\s+not|couldn'?t|could\s+not|isn'?t|is\s+not|aren'?t|are\s+not|far\s+from|more\s+than|not\s+just|no\s+mere|too\s+\w+)\b[^.]{0,30}\b(?:coincidence|chance|random|accident)\b/i,
];
const SIGNIF_ANOM_EN = [
  /\b(?:clearly|obviously|definitely|certainly|must|evidently|proves?|shows?|means|demonstrates?|indicates?|suggests?)\b[^.]{0,25}\b(?:wrong|fishy|sinister|suspicious|weird|eerie|uncanny|inexplicable|unexplainable|mysterious|pattern|law|rule|cycle|inevitable|doomed|destined|something'?s\s+(?:wrong|off)|something\s+(?:wrong|deeper|bigger))\b/i,
  // [r265] 新族：clearly hot / on fire——「热手/势头旺」断言形。与主表
  // 分开：bare hot 在英文财经/技术句中误伤面大（"the market is hot"），
  // 只收断言模态紧贴的 hot/on fire/running hot 形
  /\b(?:clearly|obviously|definitely|certainly|must|evidently)\s+(?:be\s+)?(?:hot|on\s+fire|running\s+hot|in\s+a\s+groove)\b/i,
];
const SIGNIF_MYST_EN = [
  /\b(?:behind\s+(?:it|this|them)|hidden\s+(?:hand|force|agenda)|supernatural|paranormal|cursed|doomed|destiny|fate|karma|omen|ghosts?|spirits?|universe\s+(?:is|trying|telling|wants)|meant\s+to\s+be|cosmic|sign\s+from\s+above|forces?\s+beyond)\b/i,
];
const SIGNIF_LAW_EN = [
  /\b(?:doomed|destined|inescapable|unavoidable|bound\s+to\s+(?:happen|fail|recur)|history\s+(?:repeating|repeats)|same\s+(?:fate|outcome|ending)|cycle\s+of|keeps?\s+happening|never\s+ends)\b/i,
];
const SIGNIF_CYCLE_EN = [
  /\b(?:every|whenever|each\s+time|always)\b[^.]{0,25}\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year|full\s+moon|13th)\b[^.]{0,25}\b(?:something|it|things|we|they|there)\b[^.]{0,20}\b(?:happens?|goes\s+wrong|breaks?|fails?|crashes?)\b/i,
];

// ─── 豁免一：显式随机性/统计处理（中文）──────────────────────────────
// 注意：绝不收裸「巧合/偶然/随机」或「纯属巧合/纯属偶然/随机现象/偶然
// 现象」——那些会出现在 R1 攻击（「绝非纯属偶然」「绝不是巧合」）里，
// 收了会把自己的攻击腿豁免掉。只收确认随机框架的短语与统计/调查处理词。
const EXEMPT_RAND_ZH = [
  /随机序列|随机过程|随机事件|随机数据|随机分布|随机波动|随机性|偶然性|巧合罢了|巧合而已|概率分布|概率论|按概率|概率上|从概率|期望值|大数定律|中心极限|正态分布|泊松分布|独立事件|统计显著|显著性检验|置信区间|样本量|样本太小|基准率|基线率|正常波动|不足为奇|不奇怪|很正常|查明|排查|调查后|统计后|检测后|核实|数据显示|数据表明|统计显示|研究表明|实验表明|对照组|假设检验|归一化|占比|比率|归因于|归咎于|卡方|并案/,
];
const EXEMPT_RAND_EN = [
  /\b(?:randomly|by\s+chance|pure\s+chance|randomness|probability|expected|statistically\s+significant|confidence\s+interval|sample\s+size|base\s+rate|independent\s+events|law\s+of\s+large\s+numbers|normal\s+distribution|poisson|binomial|p-?value|significance\s+test|deterministic|root\s+cause|investigation|found|determined|confirmed|identified|traced|attributed|normal\s+fluctuation|small\s+sample)\b/i,
];

// ─── 豁免二：推理否定/证据不足（中文）────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不代表|不意味着|不等于|不能说明|说明不了|证明不了|推不出|不足以|未必|不一定|尚无证据|证据不足|数据不足|样本不足|很难说|不见得|少安毋躁|而非|而不是|反过来|换个角度|尚需|待查|存疑/,
];
const EXEMPT_NEG_EN = [
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|does\s+not\s+prove|doesn'?t\s+prove|cannot\s+conclude|can'?t\s+conclude|not\s+necessarily|insufficient\s+evidence|too\s+early|sample\s+too\s+small|more\s+data|not\s+enough\s+data)\b/i,
];

// ─── 豁免三：对冲（中文，同 r161-r172 口径）──────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|多半|倾向于|似乎|好像|看样子|说不定|搞不好|我怀疑|碰巧|恰巧|正好/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|i\s+suspect|i\s+wonder|could\s+be)\b/i,
];

// ─── 豁免四：概念/教学转述（中文）────────────────────────────────────
const EXEMPT_CONCEPT_ZH = [
  /集群错觉|聚类错觉|赌徒谬误|热手谬误|德州神枪手|神枪手谬误|模式寻求|空想性错视|随机性|概率论|大数定律|中心极限|假设检验|统计学|统计课|数学课|老师|教材|课堂|教授|课本|心理学家|卡尼曼|特维尔斯基|论文中|文章里|科普/,
];
const EXEMPT_CONCEPT_EN = [
  /\b(?:clustering\s+illusion|texas\s+sharpshooter|apophenia|gambler'?s\s+fallacy|hot\s+hand|randomness|probability\s+theory|law\s+of\s+large\s+numbers|statistics|textbook|lecture|professor|teacher|classroom|kahneman|tversky|pattern\s+seeking)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 在 text 的 from 偏移起找 list 中最早出现的匹配，返回 {idx, len} 或 null */
function firstMatch(list, text, from) {
  const start = from || 0;
  const sub = text.slice(start);
  let best = null;
  for (const re of list) {
    const m = sub.match(re);
    if (m && m.index >= 0 && (!best || m.index < best.idx)) {
      best = { idx: start + m.index, len: m[0].length };
    }
  }
  return best;
}

/** source 列表中任一匹配的 win 字窗内（可选双向）出现 target 列表匹配 */
function nearAny(sourceList, targetList, text, win, bothWays) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + win);
      if (anyHit(targetList, after)) return true;
      if (bothWays) {
        const before = text.slice(Math.max(0, m.index - win), m.index);
        if (anyHit(targetList, before)) return true;
      }
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** 中文腿①：三条聚集路线任一成立（全量匹配扫描，不取首匹配——r173 教训：
 *  「三个月」先于「五起」命中时只查首匹配会漏掉真正的聚集对） */
function clusterZh(text, R) {
  // 路线 a：聚集语义词 × 事件名词（窗内双向：「连续三起事故」/「事故接连发生」）
  if (nearAny(R.CONC_ZH || CONC_ZH, R.EVENT_ZH || EVENT_ZH, text, 14, true)) return true;
  // 路线 b：同一来源
  if (anyHit(R.SAME_SRC_ZH || SAME_SRC_ZH, text)) return true;
  // 路线 c：数量≥2 × 事件名词（后 6 字窗 + 倒装「事故四起」前 4 字窗）
  if (nearAny(R.COUNT_ZH || COUNT_ZH, R.EVENT_ZH || EVENT_ZH, text, 6, false)) return true;
  if (nearAny(R.EVENT_ZH || EVENT_ZH, R.COUNT_ZH || COUNT_ZH, text, 4, false)) return true;
  return false;
}

/** 英文腿①：三条聚集路线任一成立（全量匹配扫描） */
function clusterEn(text, R) {
  // 路线 a：聚集语义词 × 事件名词（20 字符窗，前后双向——「crashes in a row」倒装形）
  if (nearAny(R.CONC_EN || CONC_EN, R.EVENT_EN || EVENT_EN, text, 20, true)) return true;
  // 路线 b：同一来源
  if (anyHit(R.SAME_SRC_EN || SAME_SRC_EN, text)) return true;
  // 路线 c：数量≥2 × 事件名词（15 字符窗）
  if (nearAny(R.COUNT_EN || COUNT_EN, R.EVENT_EN || EVENT_EN, text, 15, false)) return true;
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkClusteringIllusion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：随机性/统计处理 / 推理否定 / 概念教学 / 疑问句。
  // 注意：对冲豁免**不在此处**——R1 否认巧合里的「绝不可能是巧合」含
  // 「可能」，若全局先套对冲豁免会把攻击腿自己吃掉；对冲豁免只在 R1
  // 未命中后适用（见下方）。
  if (anyHit(R.EXEMPT_RAND_ZH || EXEMPT_RAND_ZH, text) || anyHit(R.EXEMPT_RAND_EN || EXEMPT_RAND_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_CONCEPT_ZH || EXEMPT_CONCEPT_ZH, text) || anyHit(R.EXEMPT_CONCEPT_EN || EXEMPT_CONCEPT_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① CLUSTER 聚集陈述
  const cluster = isZh ? clusterZh(text, R) : clusterEn(text, R);
  if (!cluster) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② SIGNIF 显著性归因。R1 否认巧合**先于对冲豁免**判定：「绝不可能
  // 是巧合」里的「可能」是否认式的组成部分（绝不是+可能是），不是对冲；
  // 对冲豁免只保护 R2-R5 的软性断言（「恐怕是有人幕后操控」）。
  if (isZh) {
    if (anyHit(R.SIGNIF_NEG_ZH || SIGNIF_NEG_ZH, text)) {
      return { hit: true, score: 0.58, count: 1, detail: '集群错觉×否认巧合(zh)' };
    }
  } else if (anyHit(R.SIGNIF_NEG_EN || SIGNIF_NEG_EN, text)) {
    return { hit: true, score: 0.58, count: 1, detail: 'clustering illusion×denial-of-chance(en)' };
  }

  // 对冲豁免（R1 未命中才适用）
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // R2 异常断言 / R3 神秘归因 / R4 定律化 / R5 周期迷信
  const signif = isZh
    ? anyHit(R.SIGNIF_ANOM_ZH || SIGNIF_ANOM_ZH, text)
      || anyHit(R.SIGNIF_MYST_ZH || SIGNIF_MYST_ZH, text)
      || anyHit(R.SIGNIF_LAW_ZH || SIGNIF_LAW_ZH, text)
      || anyHit(R.SIGNIF_CYCLE_ZH || SIGNIF_CYCLE_ZH, text)
    : anyHit(R.SIGNIF_ANOM_EN || SIGNIF_ANOM_EN, text)
      || anyHit(R.SIGNIF_MYST_EN || SIGNIF_MYST_EN, text)
      || anyHit(R.SIGNIF_LAW_EN || SIGNIF_LAW_EN, text)
      || anyHit(R.SIGNIF_CYCLE_EN || SIGNIF_CYCLE_EN, text);
  if (!signif) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.58, count: 1,
    detail: isZh
      ? '集群错觉×随机聚集被赋予显著性(zh)'
      : 'clustering illusion×chance-cluster-as-significant(en)',
  };
}

module.exports = {
  checkClusteringIllusion,
  __internals: () => ({
    CONC_ZH, COUNT_ZH, SAME_SRC_ZH, EVENT_ZH,
    SIGNIF_NEG_ZH, SIGNIF_ANOM_ZH, SIGNIF_MYST_ZH, SIGNIF_LAW_ZH, SIGNIF_CYCLE_ZH,
    CONC_EN, COUNT_EN, SAME_SRC_EN, EVENT_EN,
    SIGNIF_NEG_EN, SIGNIF_ANOM_EN, SIGNIF_MYST_EN, SIGNIF_LAW_EN, SIGNIF_CYCLE_EN,
    EXEMPT_RAND_ZH, EXEMPT_RAND_EN, EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN, EXEMPT_CONCEPT_ZH, EXEMPT_CONCEPT_EN,
  }),
};
