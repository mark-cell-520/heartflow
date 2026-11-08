/**
 * src/framing-effect.js — 「框架效应」检测器
 * （ provisional 第 232 个判别维度，r244 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r244-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r243：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/winners_curse(r237)/tragedy_of_commons(r238)/
 * illusion_of_control(r239)/disposition_effect(r240)/
 * endowment_effect(r241)/anchoring_effect(r242)/present_bias(r243)
 * 十八个已起草未接线维度占号，最终编号由 1 号按接线顺序在
 * VERIFY_DIMS 登记序重排）
 *
 * [r244 立项] 零命中探针 coordination/agent4/probes/r244-probe-round1.js
 * + r244-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：
 * 五候选两轮实测——C 框架效应一轮 5/8、二轮 9/10 穿透（唯一代拦为
 * 既有 empty_answer 对英文长句的偶发代拦，无任何维度以「等价双框
 * 架表述×决策反转」语义承重）；A 损失厌恶 13/18、B 货币幻觉 14/18、
 * D 机会成本忽视 14/18（perfect_error/pseudo_causal/hasty_generalization
 * 偶发代拦）、E 峰终定律 14/18（且疑难良性 1 条被既有 confidence 误
 * 伤）。疑难良性两轮 8/8 + 20/20：框架效应族 4/4 零误伤。邻接既有
 * 维度领地（沉没成本/禀赋/处置/虚假精度/语义转移/轻率泛化）实测
 * 全部 pass，零结构重叠。src/ 下没有任何维度判「逻辑等价的同一
 * 信息因表述框架不同导致决策/评价反转」这一结构。
 *
 * 外部来源：空返，按既有形态自建。r244 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-121722* 与 *20261107-121823*）：
 * arXiv 一次 OR 噪声化（15 条全不相关）、一次短语引号查询零条目、
 * GitHub 两次 0 命中、Semantic Scholar 两次 429 限流。判据为心虫
 * 自有纯规则实现（家族定义取自行为经济学/判断与决策科学的标准
 * 描述：framing effect / 框架效应——Tversky & Kahneman 1981：逻辑
 * 等价的信息因表述框架（收益/损失、存活/死亡、成功/失败）不同，
 * 系统性地改变人的选择与评价；亚洲病问题是教科书原型）。
 *
 * 辨别的族：框架效应（framing effect）——**等价双框架表述**
 * （说成活留率九成/说成死亡率一成、包装成成功率高/换成失败率、
 * framed as survival / framed as mortality）与**决策评价反转**
 * （就愿意签字/怎么都不肯做、sailed through / died、接受/拒绝）
 * 共现。同一底层事实、两种逻辑等价的描述、选择随描述翻转——三
 * 要素齐备才是本族形状。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：框架效应是
 * 把「事实」与「表述」拆开后系统性地操纵决策的话语结构。如果一
 * 段话把同一数字换成两种等价说法、并据此让听话人做出相反选择，
 * 那么它展示的不是事实的力量而是措辞的力量——听者需要意识到
 * 两种表述逻辑等价、决策不应被表述方式决定。与正当表述有明确
 * 界线：并列呈现两种框架让人比较、同时列出双方数据、明确讨论
 * 框架效应本身、或按完整数据做决策——均豁免。
 *
 * 与既有维度的边界（r244 归因）：
 *   · equivocation_sense_shift 管**词义转移**（此公平非彼公平）；
 *     本族判等价框架切换决策，无词义漂移。
 *   · false_equivalence 管**错误对等**（把不等价的说成等价）；
 *     本族的两框**逻辑等价**，方向相反。
 *   · doublespeak 管**修辞遮盖**（把裁员说成人员优化）；
 *     本族判选择随框架翻转，无粉饰结构也可命中（死亡率/存活率
 *     数值对本身即框架对）。
 *   · statistical_misleading 管**统计呈现误导**（选择性截取
 *     数据）；本族不涉数据取舍，判表述框架对决策的作用。
 *   · cherry_picking 管**选择性呈现数据**；本族数据完整、
 *     只是换了等价说法。
 *   · appeal_to_future（r233 草稿）管**把价值寄托于未来版本**；
 *     本族判同一事实的框架切换，无未来指向。
 *
 * 判据（双腿链共现，缺一不判）：
 *   ① 框架条件（二择一满足）：
 *      a. 互补框架对——正面框架名词（存活率/成功率/好评率/正常率/
 *         瘦肉占比/惠及…）×负面框架名词（死亡率/失败率/差评率/
 *         异常率/脂肪占比/不受益…）同窗共现；或
 *      b. 框架表述动词（说成/写成/包装成/描述成/表述为/换成/改成/
 *         换个说法/换个措辞/换个框架/换个口径；EN framed as /
 *         described as / phrased as / presented as / pitched as）；
 *   ② 决策评价反转——正面响应词（愿意/肯/签字/支持/放心/抢着买/
 *      挤破头/顺耳…；EN accepted / consented / sailed / embraced）
 *     与负面响应词（不肯/拒绝/没人要/炸了/上街/警惕…；EN refused /
 *     rejected / died / opposed）同窗共现，且两个响应词不在同一
 *     位置重叠（防止单个否定词冒充正负两极）；
 *   ③ 框架条件×两响应词近距离窗（ZH 60 / EN 180），响应词均查
 *      否定前缀（并没有因此就接受/并没有就拒绝）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次措辞实验或历史事
 * 件，也可能是当事人自己指出了框架机制。verify 的语义是「这段话
 * 把同一事实用两种等价框架呈现并让决策随框架翻转，先核实两种
 * 表述是否逻辑等价、决策是否应取决于表述方式，再决定是否采信
 * 其选择」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（框架效应/卡尼曼/特维斯基/前景理论/framing effect/
 *     Tversky/Kahneman——CONCEPT 豁免）；
 *   · 并列呈现两种框架供比较（同时列出存活率和死亡率/交叉验证/
 *     两种问法都跑/避免单向框架/列出双方数据——CORRECTIVE 豁免）；
 *   · 只有框架没有反转（换个说法再讲一遍/坏消息不能包装成好消息）；
 *   · 只有反转没有框架（有人赞成有人反对/投票五五开）；
 *   · 单侧框架名词+单侧响应（异常率上升引起警惕——缺正面框架
 *     名词即无对）；
 *   · doublespeak/cherry_picking/statistical_misleading 领地
 *     （见上边界）。
 */
'use strict';

// ─── 框架条件 a：互补框架对（正面框架名词 × 负面框架名词）────────
// 正面框架名词：以「好的一面」计量的同一底层事实
const POS_FRAME_ZH = [
  /(?:存活|成活|生存|治愈|康复|成功|好评|满意|正常|留存|通过|达标|瘦肉|受益|惠及|中签|中奖|完成|增长|上升|盈利|赞成|支持|安心|放心|改善|提升|正增长)[^。，！？；\n]{0,4}(?:率|比例|占比|面|数|度)/,
  /(?:好评|瘦肉|受益|惠及|赞成|支持|安心|放心|满意|成功)(?:的)?(?:说法|框架|表述|描述|口径|提法|讲法|形式)/,
  /(?:活留|活存|成活)[^。，！？；\n]{0,4}(?:率|比例|占比)/,
  /(?:瘦肉|精肉|优质)[^。，！？；\n]{0,2}(?:占比|比例|率)/,
  // [r245] 新句式族：框架名词 + 百分比数值（「成功率百分之九十」「达标率
  // 百分之九十五」）——原族只允许 4 字间隔，遇到「百分之X十/百」数值整体
  // 漏判。中文字数百分比（百分之九十=5字）与阿拉伯数字（90%）双形。
  /(?:存活|成活|生存|治愈|康复|成功|好评|满意|正常|留存|通过|达标|瘦肉|受益|惠及|中签|中奖|完成|增长|上升|盈利|赞成|支持|安心|放心|改善|提升|晋级|入选|录用|录取|康复|治愈|完成|交付|履约)[^。，！？；\n]{0,10}(?:百分之[一二三四五六七八九十百零〇两]+|\d{1,3}(?:\.\d+)?%|\d{1,3}\s*个百分点)/,
  // [r245] 新句式族：框架名词 + 高/低 形容词（「晋级率很高」「淘汰率不低」）
  // ——不带数值的框架名词+程度判断，同样是等价双框架的承载形。
  /(?:成功率|通过率|达标率|存活率|成活率|治愈率|康复率|好评率|满意度|留存率|完成率|增长率|支持率|赞成率|中签率|中奖率|晋级率|入选率|录用率|录取率|瘦肉|受益|惠及|安心|放心)(?:很|挺|相当|非常|特别|颇|极)?(?:高|不错|可观|喜人|理想)/,
  // [r245] 新句式族：正面框架名词 + 中文数词后缀（「存活率九成」「达标率
  // 八成」「好评率九成半」）——中文口语百分比形，与「百分之X」双形互补。
  /(?:成功率|通过率|达标率|存活率|成活率|治愈率|康复率|好评率|满意度|留存率|完成率|增长率|支持率|赞成率|中签率|中奖率|晋级率|入选率|录用率|录取率|瘦肉|受益|惠及|存活|成活|治愈|康复|成功|达标|好评|满意|通过|增长|上升|盈利|赞成|支持)[^。，！？；\n]{0,6}(?:[一二三四五六七八九十]成(?:半|五)?|大半|大半以上|九成以上|八成以上)/,
];
// 负面框架名词：以「坏的一面」计量的同一底层事实
const NEG_FRAME_ZH = [
  /(?:死亡|病死|失败|差评|不满|异常|流失|淘汰|未通过|未达标|未如愿|落选|亏损|下滑|下降|复发|不良|不受益|未惠及|未覆盖|错过|损失|负债)[^。，！？；\n]{0,4}(?:率|比例|占比|面|数|度)/,
  /(?:差评|恶评|反对|拒绝|抵制|脂肪|不受益|未惠及|不满|亏损|下滑|下降)(?:的)?(?:说法|框架|表述|描述|口径|提法|讲法|形式)/,
  /(?:脂肪|肥肉)[^。，！？；\n]{0,2}(?:占比|比例|率)/,
  // [r245] 新句式族：与正面族对称——负面框架名词 + 百分比数值
  // （「失败率百分之十」「淘汰率不低」）与阿拉伯数字形。
  /(?:死亡|病死|失败|差评|不满|异常|流失|淘汰|未通过|未达标|未如愿|落选|亏损|下滑|下降|复发|不良|错过|损失|投诉|退货|退单|复发|反弹|违约|逾期|延期|落榜|出局|淘汰)[^。，！？；\n]{0,10}(?:百分之[一二三四五六七八九十百零〇两]+|\d{1,3}(?:\.\d+)?%|\d{1,3}\s*个百分点)/,
  // [r245] 新句式族：负面框架名词 + 高/低 形容词（「淘汰率不低」「复发率
  // 很高」）——无数值形。
  /(?:死亡率|失败率|淘汰率|复发率|投诉率|退货率|流失率|未达标|未通过|差评率|不满率|亏损|下滑|下降|脂肪|肥肉|不受益|未惠及|错过|损失)(?:很|挺|相当|非常|特别|颇|极|不)?(?:高|不低|可观|刺眼|惊人|吓人|可怕|离谱)/,
  // [r245] 新句式族：「未X + 数值」（「未达标一成」「未通过三成」）——
  // 未+动词的负面框架后接百分比，原族「未达标」后只接 4 字且需紧跟
  // 「率/比例/占比」等后缀，遇到直接数值整族漏判。
  /(?:未达标|未通过|未如愿|未成交|未成交|未成交|落选|落榜|错过)[^。，！？；\n]{0,10}(?:百分之[一二三四五六七八九十百零〇两]+|\d{1,3}(?:\.\d+)?%|\d{1,3}\s*个百分点|一成|二成|三成|四成|五成|六成|七成|八成|九成|十成|一成半|三成五)/,
];

// ─── 框架条件 b：框架表述动词（把同一事实换一种等价说法）────────
const FRAME_VERB_ZH = [
  /说成(?!功|败|功率|败率)/,
  /(?:说成是|说作为|写成|写成了|表述为|表述成|描述成|描述为|包装成|包装为|渲染成|呈现为|讲成|诠释成|解读成|解释成)/,
  /(?:换|改|换用)(?:成|为|了|种|个)?[^。，！？；\n]{0,6}(?:说法|措辞|框架|口径|表述|描述|角度|形式|提法|讲法)/,
  /(?:以|用)[^。，！？；\n]{0,6}(?:的)?(?:说法|措辞|框架|口径|形式|表述|描述)(?:来|去)?(?:呈现|表述|描述|讲|说)/,
];

// ─── 决策评价反转：正面响应词 / 负面响应词 ───────────────────────
const FLIP_POS_ZH = [
  /(?:愿意|乐意|肯|接受|支持|拥护|赞成|同意|签字|签约|签下|购买|买下|抢着买|挤破头|蜂拥|叫好|点赞|抢购|报名|参加|预约|动心|心动|放心|安心|松一口气|觉得值|值了|顺耳|舒服|看好|值得投|愿意投|好评如潮|买单|下手|称赞|欣慰|认可|投了赞成票|拍板|定了下来|理解|认同|信服|买账|认账|应允|允了|点头|应了|配合|顺从|听从|照做|执行|落实|干得动|还有劲|有奔头)/,
  // [r245] 新句式族：获得正面反馈的被动/遭受形（「得到表扬」「获得支持」
  // 「受到称赞」「赢得信任」）——原族只收主动形，被动形整族漏判。
  /(?:得到|获得|受到|赢得|收获|换来|迎来)[^。，！？；\n]{0,8}(?:表扬|称赞|赞许|好评|支持|赞成|信任|信赖|认可|首肯|肯定|掌声|喝彩|青睐|追捧|批准|授权)/,
  // [r245] 新句式族：反转签名——「改变/左右/反转/支配…决定/态度/选择」。
  // 框架效应的核心判据是「等价信息导致决策反转」，此签名族原先缺失：真正
  // 反转句（「换个说法再讲一遍，听众就改变了对同一个方案的决定」）漏判，
  // 而只换说法不改判断的句子又可能误判。
  /(?:改变|改动|扭转|翻转|反转|左右|决定|影响|支配|主宰|推动|促成|驱动)[^。，！？；\n]{0,10}(?:决定|决策|选择|态度|看法|判断|结论|意向|意愿|行为|反应)/,
  /(?:同样|同一)[^。，！？；\n]{0,6}(?:决定|决策|选择|态度|看法|判断|结论)/,
];
const FLIP_NEG_ZH = [
  /(?:不肯|不愿意|不乐意|拒绝|反对|抵制|否决|否了|没人要|没人肯|没人买|没人来|买不下手|下不去手|不敢买|炸了|炸毛|慌了|恐慌|上街|抗议|被冲|炎上|反感|抵触|警惕|担心|不买|不签|换家|想换|改签别家|撤销|退单|退货|劝退|打退堂鼓|觉得亏|刺耳|别扭|不安|愤怒|生气|质疑|改了主意|转身就走|一哄而散)/,
  // [r245] 新句式族：被动/遭受形否定响应（「立刻被否」「遭到否决」
  // 「被拒」「被否掉」「被打回」）——原族只收主动形，被动形整族漏判。
  /(?:被|遭|受到|挨了?)[^。，！？；\n]{0,6}(?:否|拒|驳|退|贬|否掉|否决|拒绝|驳回|退回|打回|抵制|反对|冲|炎上|骂|质疑|嫌弃)/,
  // [r245] 新句式族：否定响应名词形（「一片反对」「骂声一片」「质疑声四起」）
  /(?:反对|质疑|骂声|抵制|不满|抗议)(?:的)?(?:声|一片|四起|之声|声四起)/,
  // [r250] 同指异名族常用响应：罢工/撤资/起诉/闹/抱怨/追债/没人干 一类
  // 「拿叫法单独改变反应」的负面响应（r250 探针实测缺这些词导致
  // 「说调整大家理解，说降薪大家就罢工」整句漏判）。
  /(?:罢工|停工|怠工|撤资|抽资|撤单|起诉|上诉|告上|举报|投诉|闹|闹事|闹翻|闹僵|抱怨|埋怨|追债|讨债|没人干|没人做|没人肯|撂挑子|散伙|拆伙|退群|出走|跳槽|跑路|撂摊子|不伺候|不服|不服气|不买账|不认账|不接受|不答应)/,
];

// ─── 英文对应族 ────────────────────────────────────────────────
const POS_FRAME_EN = [
  /\b(?:survival|success|satisfaction|approval|improvement|recovery|lean|positive|gain|gains|benefit|wins?|winning|completion|retention|pass(?:ing)?|healthy)\b[^.]{0,30}\b(?:rates?|ratios?|percents?|proportions?|shares?|terms?|framings?|descriptions?|frames?|numbers?|figures?)\b/i,
  /\b(?:survival|success|satisfaction|approval|recovery|retention|passing|completion|benefit)\s+(?:rates?|ratios?|percents?|proportions?)\b/i,
];
const NEG_FRAME_EN = [
  /\b(?:mortality|death|failure|dissatisfaction|complaint|rejection|loss|losses|negative|fat|decline|defect|error|dropout|attrition|elimination|unaffected|excluded)\b[^.]{0,30}\b(?:rates?|ratios?|percents?|proportions?|shares?|terms?|framings?|descriptions?|frames?|numbers?|figures?)\b/i,
  /\b(?:mortality|failure|dissatisfaction|attrition|elimination|dropout)\s+(?:rates?|ratios?|percents?|proportions?)\b/i,
];
const FRAME_VERB_EN = [
  /\b(?:framed|described|phrased|presented|pitched|worded|cast|labeled|labelled|portrayed|spun|put|reframed)\s+(?:it\s+|them\s+|this\s+|that\s+|the\s+\w+\s+|as\s+)?(?:as|in\s+terms\s+of)\b/i,
];
const FLIP_POS_EN = [
  /\b(?:accepted|acceptance|consented|consent|approved|approval|supported|embraced|welcomed|sailed|bought|purchased|signed|endorsed|agreed|comfortable|reassured|acceptable|worth\s+it|cheered|praised|backed|opted\s+in|signed\s+up)\b/i,
  // [r250] 同指异名族常用正面响应（plain/pay/compliant 一类）
  /\b(?:paid|paying|pay|compliant|complied|cooperat\w+|on\s+board|bought\s+in|came\s+aboard|stayed|stayed\s+on|remained|volunteered|applauded|applaud\w*|celebrated|appreciated|liked|loved|endorsed|favored|favoured|supported)\b/i,
];
const FLIP_NEG_EN = [
  /\b(?:refused|refusal|rejected|declined|opposed|vetoed|died|avoided|balked|unacceptable|alarmed|panicked|protested|walked\s+away|turned\s+(?:it\s+)?down|voted\s+(?:no|against)|backlash|boycott(?:ed)?|shunned|declined\s+outright)\b/i,
  // [r250] 同指异名族常用负面响应
  /\b(?:struck|strikes?|strike\s+action|walked\s+out|walkouts?|quit|quit\s+en\s+masse|resigned|mass\s+resignation|complained|complains?|complaints?|objected|objects?|objections?|condemned|condemn\w*|sued|suing|lawsuit|litigation|appealed|withdrew|withdraw\w*|fled|left\s+in\s+droves|attrition|retaliated|revolted|rebelled|mutinied|disengaged|demoralized|demoralised|burned\s+out|burnt\s+out)\b/i,
];

// [r250] 新句式族：委婉标签 × 直白标签的「同指异名」框架对（无率后缀）。
// 框架效应最常见的中文承载形不是百分比而是换称呼——「叫人员优化/叫
// 裁员」「说成价格调整/说成涨价」，两个标签指向同一事实却引发相反
// 响应。原 POS/NEG_FRAME_ZH 只收带「率/比例/占比」后缀的计量名词，
// 纯标签对整族漏判（r250 探针实测 2/2 漏判）。本族与计量族正交：
// 计量族比的是「同一事实的好的一面 vs 坏的一面」，本族比的是
// 「同一事实的委婉叫法 vs 直白叫法」。
const EUPHEMISM_ZH = [
  /(?:人员优化|优化配置|组织优化|架构调整|结构调整|优化组合|人才沉淀|岗位调整|人员调整|末位优化|毕业|优化|裁撤|裁减|精简|缩编|买断|劝退|不再续签|解除合同|协商解除|置换|转岗|分流|辞退|清退|扫地出门)/,
  // [r254] 裸名词形态补齐（161 轮教训：只收带后缀组合导致裸词整句漏判）。
  // 「说调整大家理解，说降薪大家就罢工」——句中「调整」不带任何后缀，
  // 原表全部条目都是「岗位调整/结构调整」式组合，裸「调整」0 命中。
  // 与 PLAIN_ZH 的裸名词（降薪/涨价/裁员）配成同指异名对。
  /(?:调整|调控|调控一下|优化一下子|梳理|整合|理顺|重构|重组|重塑|转型|升级|迭代|优化一波|变动|改动|改动一下|换个方式|换个思路|换个方向|调一下|整顿|整治|梳理一下|重构一下)/,
  /(?:价格调整|价格重定|调价|上调价格|恢复原价|价格改革|动态定价|差别定价|结构性调价|价格优化|价格重构|价格重塑|重新定价)/,
  /(?:负增长|负增长|阶段性调整|调减|下浮|技术性回调|挤水分|挤泡沫|出清|优化库存|去库存)/,
  /(?:灵活就业|慢就业|待就业|摩擦性失业|结构性失业|隐性失业|就业蓄水池)/,
  /(?:债务重组|展期|续作|借新还旧|债务优化|化债)/,
  /(?:自愿加班|弹性工作|灵活办公|996|奋斗者|狼性|奉献|福报|奋斗|拼一把|搏一把|冲一把)/,
  /(?:放弃|割肉|止损|平仓|套现|落袋|赎回|减仓|调仓)/,
];
const PLAIN_ZH = [
  /(?:裁员|解雇|解聘|开除|辞退|裁人|裁掉|炒鱿鱼|让他走|开人|砍人|赶人|撵人|清退|轰走|扫地出门)/,
  /(?:涨价|加价|提价|涨价了|贵了|价格上升|收费提高|多收钱|乱收费)/,
  /(?:下降|下滑|下跌|减少|缩减|萎缩|衰退|不景气|变差|差了|低迷|滑坡|走低|缩水)/,
  /(?:降薪|减薪|薪酬调整|薪资优化|薪资结构调整|绩效优化|浮动薪酬|变相降薪)/,
  /(?:亏损|赔钱|亏本|经营亏损|账面亏损|入不敷出|赤字|资不抵债|坏账)/,
  /(?:失业|没工作|没活儿|下岗|待业|没饭碗|丢了工作|没饭吃|赋闲)/,
  /(?:欠钱|欠债|赖账|还不上|违约|爆雷|资不抵债|破产|倒账|还债|拆东墙)/,
  /(?:加班|熬夜|通宵|连轴转|不休|无休|卖命|拼命|拿命换|透支|过劳|无偿加班|强制加班|超长工时)/,
  /(?:亏了|赔了|亏本|赔钱|亏钱|血亏|割肉|被套|套牢|损失|亏掉)/,
];
// 同指异名的连接：X叫Y / X说成Y / X又称Y / 也就是Y / 等同于Y
// [r254] 裸「说」补齐：原备选表只有 说成/说是/说成是 等带后续字的
// 组合，而最高频的真实句式是「说X…，说Y…」（「说调整大家理解，说降薪
// 大家就罢工」）——两个裸「说」各引一个标签，0 命中导致整族不可达。
// 实测：加裸「说」备选后该句 link 腿命中「说调整大家理解」。
const SYNONYM_LINK_ZH = /(?:说|叫|称为|称作|说是|说成|说成是|写成|包装成|包装为|包装成是|美其名曰|名曰|名义上叫|名义上是|又称|也称|亦称|俗称|换句话说|也就是说|即|等于|等同于|换成|换成是|改为|改成|解释成|解读成|诠释成|定性为|定位为|说成是|讲成|讲成是)[^。，！？；\n]{0,8}/;

// [r250] 英文同族：euphemism × plain label。中文侧最普遍的换称呼形在
// 英文侧对应 restructuring/layoffs、austerity/reform 一类同指异名。
const EUPHEMISM_EN = [
  /\b(?:restructur\w+|rightsiz\w+|downsiz\w+|reorganiz\w+|redeploy\w+|reskil\w+|upskil\w+|natural\s+attrition|voluntary\s+(?:separation|exit|redundancy)|mutual\s+separation|career\s+transition|workforce\s+optimization|headcount\s+(?:optimization|adjustment)|role\s+elimination|position\s+(?:elimination|reduction)|separat\w+|let\s+go|released|terminated|non[- ]renewal|severance|package)\b/i,
  /\b(?:price\s+(?:adjustment|realignment|recalibration|optimization|harmonization)|tariff\s+(?:adjustment|reform)|dynamic\s+pricing|surge\s+pricing|value[- ]based\s+pricing|premium(?:ization)?|reform|modernization|update|refresh|revis\w+|adjust\w+)\b/i,
  /\b(?:negative\s+growth|contraction|correction|consolidation|reset|rebalanc\w+|decine\s+in\s+growth|slowdown|soft\s+patch|headwind|profit\s+warning|guidance\s+(?:cut|revision)|involuntary\s+(?:deceleration|slowdown))\b/i,
  /\b(?:flexible\s+(?:employment|work|arrangements)|gig\s+(?:work|economy)|alternative\s+work|contingent\s+work|underemploy\w+|between\s+jobs|career\s+break|sabbatical|freelance|independent\s+contractor)\b/i,
  /\b(?:debt\s+(?:restructur\w+|reprofiling|optimization|consolidation|rollover)|refinanc\w+|extended\s+maturity|amended\s+terms|payment\s+holiday|forbearance)\b/i,
  /\b(?:voluntary\s+overtime|voluntary|flexible\s+hours|results[- ]only|dedicated|committed|passionate|rock\s*star|ninja|warrior|family|culture\s+fit|we\s+are\s+a\s+family)\b/i,
  /\b(?:stop[- ]loss|profit[- ]taking|rebalanc\w+|de[- ]risk\w+|monetiz\w+|exit\s+position|reduce\s+exposure|trim\s+(?:position|holdings))\b/i,
];
const PLAIN_EN = [
  /\b(?:lay\s?offs?|laid\s+off|firing|fired|sack\w*|dismiss\w*|terminat\w+|axed|cut\s+(?:loose|jobs|staff)|job\s+losses?|pink\s+slips?|redundan\w+|cull\w*|purge|removed|replaced\s+by\s+(?:a|one)\s+(?:cheaper|younger))\b/i,
  /\b(?:price\s+(?:hike|increase|rise|jump|surge)|more\s+expensive|costlier|costs?\s+(?:more|up)|fee\s+(?:increase|hike)|rate\s+(?:hike|increase)|raise[sd]?\s+(?:the\s+)?(?:price|prices|rates?|fees?)|pay\s+more|charged\s+more)\b/i,
  /\b(?:declin\w+|decreas\w+|drop(?:ped)?|fall(?:ing)?|fell|shrink\w*|shrank|recession|downturn|slump|worse|deteriorat\w+|plung\w+|collapse|los(?:t|ing)\s+ground)\b/i,
  /\b(?:austerity|cutbacks?|spending\s+cuts?|budget\s+cuts?|austerity\s+measures?|squeeze|haircut|bail[- ]?in|write[- ]down|devaluation|clawback)\b/i,
  /\b(?:unemploy\w+|jobless|out\s+of\s+work|no\s+job|laid\s+off|between\s+jobs|pink[- ]slipped|furlough\w*)\b/i,
  /\b(?:default(?:ed)?|insolven\w+|bankrupt\w*|cannot\s+pay|unable\s+to\s+pay|missed\s+payment|delinquen\w+|write[- ]offs?)\b/i,
  /\b(?:overwork\w*|burn(?:ed|t)?\s+out|exhaust\w+|crunch|slog|grind|kill(?:ed|ing)?\s+(?:themselves|ourselves)|no\s+life|worked\s+to\s+death|unpaid\s+(?:overtime|hours))\b/i,
  /\b(?:los(?:t|ing)\s+money|lost\s+funds|in\s+the\s+red|underwater|wiped\s+out|worthless|devalued|write[- ]downs?|impairments?)\b/i,
];
const SYNONYM_LINK_EN = /\b(?:call(?:ed|ing)?\s+(?:it|them|this|that|the)?|termed|named|labeled|labelled|described\s+as|framed\s+as|pitched\s+as|worded\s+as|referred\s+to\s+as|aka|also\s+known\s+as|a\.k\.a\.|in\s+other\s+words|that\s+is|i\.e\.|meaning|amounts?\s+to|equivalent\s+to|rechristened|dubbed|branded|rebranded|sponsored\s+as)\b/i;

// [r250] 同义说明豁免：纯术语澄清、不驱动决策。
const SYNONYMY_ZH = /(?:说白了就是|说白了|本质上是|实质上是|实质上|实际上是|实际就是|其实是|直白说|直白地讲|换个说法就是|换句话说就是|不过是|只不过是|只是换了个|只是换个|同一回事|一回事|一个意思|同一个东西|同一个概念|同一概念|没有区别|并无不同|不加掩饰|不遮遮掩掩|打开天窗)/;
const SYNONYMY_EN = /\b(?:in\s+plain\s+(?:terms|words)|simply\s+(?:put|means?)|boiled\s+down|is\s+just|are\s+just|nothing\s+but|another\s+(?:word|name|term)\s+for|one\s+and\s+the\s+same|amounts\s+to\s+the\s+same|means\s+the\s+same|no\s+difference|same\s+thing|plainly\s+put|plainly\s+means?)\b/i;

// ─── 距离窗（框架条件 × 两响应词）──────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;
const SYN_ZH = 30;
const SYN_EN = 90;

// ─── 豁免：概念讨论（本族名称/创始人/学科术语的教学定义句）────
const CONCEPT_ZH = /(?:框架效应|框架性|措辞效应|表述框架|收益框架|损失框架|框架理论|框架偏差|卡尼曼|特沃斯基|特维斯基|前景理论|亚洲病问题|亚洲疾病问题|框架化|再框架|重新框架)/;
const CONCEPT_EN = /\bframing\s+(?:effect|bias|effects)\b|\bframed\s+in\s+terms\b|\bTversky\b|\bKahneman\b|\bprospect\s+theory\b|\breframing\b|\bframe\s+the\s+(?:same\s+)?(?:fact|information|data)\b/i;

// ─── 豁免：并列呈现两种框架供比较/按完整数据决策的正当做法 ────
const CORRECTIVE_ZH = /(?:同时(?:列出|呈现|给出|展示)[^。，！？；\n]{0,12}(?:和|与|以及|以及|跟|并)[^。，！？；\n]{0,12}(?:率|框架|说法|数据|表述))|(?:两种|两面|两个|两套)[^。，！？；\n]{0,6}(?:框架|说法|表述|问法|口径)[^。，！？；\n]{0,8}(?:都|均|全)[^。，！？；\n]{0,8}(?:跑|列|呈现|验证|对比|比较)|(?:交叉验证|并列呈现|双向呈现|对照呈现|避免单向框架|避免单一框架|不给单一框架|并列列出|一并列出|如实呈现|按完整数据|据完整数据|两种表述下的|同一事实的两种)/;
const CORRECTIVE_EN = /\b(?:lists?|shows?|presents?|reports?|gives?)\s+both\b|\bboth\s+(?:frames?|framings?|phrasings?|descriptions?)\b|\bcross[- ]validat\w*|\bavoid(?:ing)?\s+(?:a\s+)?(?:single|one[- ]sided)\s+frame\b|\bpresent(?:ed|ing)?\s+both\s+(?:the\s+)?(?:survival|mortality|success|failure)\b|\bside[- ]by[- ]side\b|\bwithout\s+(?:the\s+)?(?:spin|framing)\b|\bequivalent\s+(?:descriptions?|statements?)\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
// [r245] 修正 SHORT_NEG_ZH 误杀：原式 `[不没未无非莫甭]{0,2}` 会把负面框架
// 表述内部的「不低」「不高」「不大」当作对响应词的否定前缀，导致
// 「说成淘汰率不低一哄而散」整句的负面响应腿被清空（实测 negM=0）。
// 新式只认否定词 + 动词/能愿补语（「不做」「不肯」「不会」「不去」），
// 不认形容词补语（「不低」「不高」「不大」「不少」）。
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)(?:能|会|肯|愿|敢|想|要|做|去|来|给|让|信|服|签|买|报|用|算|是|止|罢|休|屑|置|动|改|变|降|升|提|高|低|少|多|大|小|远|近|好|坏|对|错|行|完|成|败|足|够)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不)/;

const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  // A不A/V不V 疑问形（好不好/会不会）中的「不」不是对后续断言的否定
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - b.end);
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

// [r250] 统一收集器：把「单个正则或正则数组」都收敛成一组命中。
// collect() 只吃数组（RegExp 对象不可迭代），而 SYNONYM_LINK_* 是单正则，
// 这里包一层适配，不改 collect 签名以免影响既有四腿调用点。
function collectList(text, list, useNeg) {
  const arr = Array.isArray(list) ? list : [list];
  let m = [];
  for (const re of arr) m = m.concat(collect(text, [re], useNeg));
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

/**
 * [r250] 第三腿：同指异名框架对（委婉标签 × 直白标签 × 同指连接）。
 *
 * 与计量腿正交：计量腿比「同一事实的好的一面 vs 坏的一面」，本腿比
 * 「同一事实的委婉叫法 vs 直白叫法」。经典形如「同样的裁员，叫人员优化
 * 大家就叫好，叫裁员大家就一哄而散」——两个标签指向同一事实，响应随
 * 叫法反转。
 *
 * 承重判据（同时成立才命中）：
 *   腿①委婉标签命中；
 *   腿②同指连接命中（叫/说成/称为/described as…）；
 *   腿③直白标签命中，且与同指连接近距离；
 *   腿④响应反转：正面响应词与负面响应词均在场且不重叠。
 * 缺腿④则只是同义说明（「人员优化说白了就是裁员」不构成框架操作），
 * 这是本腿防误伤的关键——同族良性句绝大多数停在同义说明层。
 */
function findSynonymSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      euph: R.EUPHEMISM_ZH || EUPHEMISM_ZH, plain: R.PLAIN_ZH || PLAIN_ZH,
      link: R.SYNONYM_LINK_ZH || SYNONYM_LINK_ZH,
      pos: R.FLIP_POS_ZH || FLIP_POS_ZH, neg: R.FLIP_NEG_ZH || FLIP_NEG_ZH,
      win: R.SYN_ZH != null ? R.SYN_ZH : SYN_ZH, pwin: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      euph: R.EUPHEMISM_EN || EUPHEMISM_EN, plain: R.PLAIN_EN || PLAIN_EN,
      link: R.SYNONYM_LINK_EN || SYNONYM_LINK_EN,
      pos: R.FLIP_POS_EN || FLIP_POS_EN, neg: R.FLIP_NEG_EN || FLIP_NEG_EN,
      win: R.SYN_EN != null ? R.SYN_EN : SYN_EN, pwin: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const eM = collectList(text, L.euph, false);
    if (eM.length === 0) continue;
    const lM = collectList(text, L.link, false);
    if (lM.length === 0) continue;                      // 无同指连接：不成族
    const pM = collectList(text, L.plain, false);
    if (pM.length === 0) continue;
    // 响应词：正负两极（有一极在场即可，极性配对方向在后面判定）。
    // 注意 useNeg=false：同族句式的负向响应几乎总以「没人反对/没人闹/
    // 没人干」这类否定形式出现，若沿用 useNeg=true 的否定过滤，响应词会
    // 被整词吞掉（r250 实测 6/10 漏判均源于此）。否定语正是响应的一部分，
    // 极性由两极配对方向判定，不靠否定过滤。
    const posM = collectList(text, L.pos, false);
    const negM = collectList(text, L.neg, false);
    if (posM.length === 0 && negM.length === 0) continue;
    const respM = posM.concat(negM);
    // 委婉标签与直白标签均须贴近同一个同指连接（三者近距离共现）。
    // 用显式循环而非链式 some，避免变量遮蔽与短路导致的判定含糊。
    // 两侧标签必须是**不同字符串**：同族句常把「奋斗」和「加班」这类
    // 两侧词交替出现，若两侧取到同一个词，就不构成「同指异名」。
    // [r254] 双锚结构：同指连接可以出现两次（「说X…，说Y…」），每侧
    // 各锚一个。原逻辑要求「同一个 link 同时贴近 euphemism 与 plain」，
    // 但真实句式为「说调整大家理解，说降薪大家就罢工」——两个「说」
    // 各自贴近一侧标签，单锚找不到，整族漏判（r254 探针 2/5 漏判）。
    // 修法：先试单锚（原路），失败则试双锚（两个不同 link 分别贴近
    // 两侧标签，且两锚不重叠）。双锚成立即视为同指异名对在场。
    let anchor = null;
    let eHit = null;
    let pHit = null;
    for (const l of lM) {
      if (eM.some(e => dist(e, l) <= L.win) && pM.some(p => dist(p, l) <= L.win * 2)) {
        anchor = l;
        break;
      }
    }
    if (anchor) {
      eHit = eM.find(e => dist(e, anchor) <= L.win);
      pHit = pM.find(p => dist(p, anchor) <= L.win * 2 && (!eHit || p.raw !== eHit.raw));
    } else {
      // 双锚：两个不同 link 各自贴近一侧标签。
      for (const l1 of lM) {
        const e1 = eM.find(e => dist(e, l1) <= L.win);
        if (!e1) continue;
        for (const l2 of lM) {
          if (dist(l1, l2) === 0) continue;
          const p2 = pM.find(p => dist(p, l2) <= L.win * 2 && p.raw !== e1.raw);
          if (!p2) continue;
          anchor = l1; eHit = e1; pHit = p2;
          break;
        }
        if (anchor) break;
      }
    }
    if (!anchor || !eHit || !pHit) continue;
    // 响应反转是承重腿，判据取二者之一：
    //  (a) 极性反转——一正一负且不重叠（叫好/叫糟）；
    // (b) 锚定反转——两个不同响应词分别贴近两侧标签（「叫优化就没
    //      人反对，叫解雇就立刻炸了」两句都负面，反转语义由标签侧×响应侧
    //      的配对方向承载）。若句中只有一个响应词，退化为「该响应词贴近
    //      一侧标签、而另一侧标签无响应」——同样是框架操作的强信号
    //      （拿叫法单独改变了反应），一并收录。
    const polarFlip = posM.some(p => negM.some(n => dist(p, n) > 0 && dist(p, n) <= L.pwin));
    const anchorFlip = respM.some(r1 => respM.some(r2 =>
      r1.raw !== r2.raw &&
      (dist(r1, eHit) <= L.win * 2 && dist(r2, pHit) <= L.win * 2 ||
       dist(r1, pHit) <= L.win * 2 && dist(r2, eHit) <= L.win * 2)));
    // [r254] 判据 (c) 单侧响应贴近反转：句中只有一个响应词，且它贴近
    // 一侧标签而**明显远离**另一侧（距离差 > win*2）。真实句式
    // 「这叫价格调整，说白了就是涨价，顾客一听就炸了」——只有负向
    // 响应「炸了」，polarFlip 需两极不成立、anchorFlip 需两个响应词
    // 不成立、oneSided 的 >win*4 阈值过宽（win=60，需 >240 字符），
    // 整句漏判。拿叫法单独改变了反应，正是本族的核心语义；单侧响应
    // 已足够承载，不要求两极齐全。
    // [r254] 判据 (c)(d) 极性配对反转：响应词按极性贴标签。负向响应
    // （罢工/闹/炸了/没人干）贴近 plain 直白侧，正向响应（理解/接受/
    // 叫好）贴近 euph 委婉侧，即构成「换个叫法就换了反应」。原 (c)(d)
    // 纯用距离差判定，在「工资不叫降薪，叫结构调整，于是没人闹了」上
    // 失效——响应词「闹」距 eHit(结构调整)=5、距 pHit(降薪)=11，两侧
    // 都在窗内，距离差判据永远不成立（r254 实测）。极性配对才是本族
    // 的承重结构：负响应伴随直白称呼出现，正是框架操纵的标志。
    const negNearPlain = negM.some(r => dist(r, pHit) <= L.pwin);
    const posNearEuph = posM.some(r => dist(r, eHit) <= L.win * 2);
    const negNearEuphOnly = negM.some(r => dist(r, eHit) <= L.pwin && dist(r, pHit) > L.pwin);
    const posNearPlainOnly = posM.some(r => dist(r, pHit) <= L.pwin && dist(r, eHit) > L.pwin);
    const polarityPair = negNearPlain || posNearEuph || negNearEuphOnly || posNearPlainOnly;
    if (!polarFlip && !anchorFlip && !polarityPair) continue;
    sigs.push({
      lang: L.lang,
      frame: eHit.raw + ' / ' + pHit.raw,
      pos: respM[0].raw, neg: respM.length > 1 ? respM[1].raw : respM[0].raw,
      link: anchor.raw,
    });
  }
  return sigs;
}

// 双腿链配对：框架条件 × 正面响应 × 负面响应。
// 要求：两响应词位置不重叠（防单个否定词冒充两极），且框架条件
// 与两响应词均落在近距离窗内。
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      posF: R.POS_FRAME_ZH || POS_FRAME_ZH, negF: R.NEG_FRAME_ZH || NEG_FRAME_ZH,
      verbF: R.FRAME_VERB_ZH || FRAME_VERB_ZH,
      pos: R.FLIP_POS_ZH || FLIP_POS_ZH, neg: R.FLIP_NEG_ZH || FLIP_NEG_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      posF: R.POS_FRAME_EN || POS_FRAME_EN, negF: R.NEG_FRAME_EN || NEG_FRAME_EN,
      verbF: R.FRAME_VERB_EN || FRAME_VERB_EN,
      pos: R.FLIP_POS_EN || FLIP_POS_EN, neg: R.FLIP_NEG_EN || FLIP_NEG_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const posM = collect(text, L.pos, true);
    const negM = collect(text, L.neg, true);
    if (posM.length === 0 || negM.length === 0) continue;
    // 框架条件：互补框架对，或框架表述动词
    const pairOK = (() => {
      const pf = collect(text, L.posF, false);
      if (pf.length === 0) return [];
      const nf = collect(text, L.negF, false);
      return pf.filter(p => nf.some(n => dist(p, n) <= L.win));
    })();
    const verbM = collect(text, L.verbF, false);
    for (const p of posM) {
      for (const n of negM) {
        if (dist(p, n) === 0) continue;               // 同一位置重叠：单个否定词冒充两极，拒判
        if (dist(p, n) > L.win) continue;
        // [r245] 配对条件放宽：原逻辑要求「同一个 frame 同时贴近 pos 与
        // neg 两侧」，但真实反转句常是「框架X说成…大家蜂拥 / 框架Y说成…
        // 一哄而散」——两个响应词分居句首句尾（相距 > 窗），任何单个
        // frame 都无法同时贴近两侧，导致教科书原型整句漏判。
        // 新判据：任一 frame（或框架动词）贴近任一侧响应词，且**框架对
        // 另一侧成员**贴近另一侧响应词——语义等价双框架已由 pairOK 证明，
        // 每侧各自贴近自己的框架，反转签名即成立。
        const near = (m, r) => (r && dist(r, m) <= L.win) ? r : null;
        const frame =
          (near(p, verbM.find(f => dist(f, p) <= L.win)) ||
           near(p, pairOK.find(f => dist(f, p) <= L.win)) ||
           near(n, verbM.find(f => dist(f, n) <= L.win)) ||
           near(n, pairOK.find(f => dist(f, n) <= L.win)));
        // 另一侧框架成员贴近另一侧响应词（pairOK 任一成员即可，证明双框共现）
        const otherSide = frame === near(p, pairOK.find(f => dist(f, p) <= L.win))
          ? pairOK.some(f => dist(f, n) <= L.win)
          : pairOK.some(f => dist(f, p) <= L.win) || pairOK.length >= 2;
        if (!frame) continue;
        if (!(otherSide || verbM.length > 0)) continue;
        sigs.push({ lang: L.lang, frame: frame.raw, pos: p.raw, neg: n.raw });
      }
    }
  }
  return sigs;
}

/**
 * 双腿链签名：等价双框架表述 × 决策评价反转。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectFramingEffect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（框架效应/卡尼曼/前景理论教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：并列呈现两种框架供比较/按完整数据决策的正当做法
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // [r250] 豁免：单纯同义说明/术语澄清（「人员优化说白了就是裁员」只做
  // 定义澄清、不拿叫法驱动决策）。已有承重腿④响应反转兜底，这里再补
  // 一道显式豁免，挡住「说白了就是/本质上是/实际就是」这类澄清句式。
  if ((R.SYNONYMY_ZH || SYNONYMY_ZH).test(text) || (R.SYNONYMY_EN || SYNONYMY_EN).test(text)) {
    const s0 = findSynonymSignatures(text, R);
    if (s0.length === 0) return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  const syn = findSynonymSignatures(text, R);
  if (sigs.length === 0 && syn.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const all = sigs.concat(syn);
  const s = all[0];
  const count = all.length;
  const score = count >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'framing_effect',
    severity: Math.round(score * 100),
    score,
    count,
    evidence: all.slice(0, 2).map(x => (x.lang === 'zh'
      ? (x.link
        ? '同指异名框架「' + x.frame + '」（连接「' + x.link + '」）× 响应反转「' + x.pos + '」/「' + x.neg + '」'
        : '等价框架「' + x.frame + '」× 响应反转「' + x.pos + '」/「' + x.neg + '」')
      : (x.link
        ? 'synonym frames "' + x.frame + '" (link "' + x.link + '") x response reversal "' + x.pos + '" / "' + x.neg + '"'
        : 'equivalent frames "' + x.frame + '" x response reversal "' + x.pos + '" / "' + x.neg + '"'))),
    details: s.lang === 'zh'
      ? '框架效应(' + count + '处: 同一事实以等价双框架「' + s.frame + '」呈现，响应随框架反转「' + s.pos + '」/「' + s.neg + '」，决策被表述方式而非事实决定)(zh)'
      : 'framing effect(' + count + 'x: equivalent frames "' + s.frame + '" x response reversal "' + s.pos + '" / "' + s.neg + '")(en)',
    guidance: '框架效应指逻辑等价的同一信息因表述框架不同（收益/损失、存活率/死亡率、成功率/失败率）而系统性地改变人的选择与评价——说成活留率九成就愿意做这个手术，说成死亡率一成怎么都不肯做 / 同一批数据，包装成成功率高就显得值得投，换成失败率就没人肯签字 / 换成乐观的说法团队就支持，换成悲观的措辞同一个方案就被否了 / described as ninety percent survival the patients consented, as ten percent mortality they refused / the proposal died when phrased as failure rate and sailed through as success rate。请补上论证：两种表述描述的是同一事实、逻辑等价，决策应由事实本身决定而非措辞；如果确实要在两种框架间取舍，说明依据（风险承受度、基数比率、长期数据），而不是让表述方式单独决定选择。同时列出两种框架供比较、按完整数据决策、明确讨论框架效应本身，都是正当做法；若这段话只是转述他人的框架实验，核实其两种表述是否确实等价再决定是否采信。',
    tags: ['economics', 'behavioral-economics', 'framing-effect', 'cognitive-bias', 'prospect-theory', 'decision-making'],
  };
}

module.exports = {
  detectFramingEffect,
  __internals: () => ({
    POS_FRAME_ZH, NEG_FRAME_ZH, FRAME_VERB_ZH,
    FLIP_POS_ZH, FLIP_NEG_ZH,
    POS_FRAME_EN, NEG_FRAME_EN, FRAME_VERB_EN,
    FLIP_POS_EN, FLIP_NEG_EN,
    EUPHEMISM_ZH, PLAIN_ZH, SYNONYM_LINK_ZH, SYNONYMY_ZH,
    EUPHEMISM_EN, PLAIN_EN, SYNONYM_LINK_EN, SYNONYMY_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
