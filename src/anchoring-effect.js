/**
 * src/anchoring-effect.js — 「锚定效应」检测器
 * （ provisional 第 230 个判别维度，r242 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r242-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r241：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/winners_curse(r237)/tragedy_of_commons(r238)/
 * illusion_of_control(r239)/disposition_effect(r240)/
 * endowment_effect(r241) 十六个已起草未接线维度占号，最终编号由
 * 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r242 立项] 零命中探针 coordination/agent4/probes/r242-zerohit-probe.js
 * + r242-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：
 * 五候选两轮实测——D 锚定效应一轮 7/7、二轮 8/10 穿透（未穿透 2 条
 * 均为既有泛维度 perfect_error 偶发代拦，无任何维度以「锚点呈现×
 * 估计被锚点支配」语义承重）；A 蒙蒂霍尔失更 4/7、B 邓宁-克鲁格
 * 4/7、C 乐观偏差 5/7、E 群体思维 4/7，均被既有泛维度结构性代拦，
 * 攻击穿透率显著低于 D。良性侧一轮 4/5、二轮高难良性 12/15，
 * 被代拦者全部为既有泛维度（unsupported_claim/vagueness/
 * confidence/monocausal_attribution），无本族专属误伤。src/ 下没有
 * 任何维度判「第一个数字/标价不成比例地支配后续估计」这一结构。
 *
 * 外部来源：空返，按既有形态自建。r242 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-082143* 与 *20261107-082215*）：
 * arXiv 两次 parse-fail（OR 噪声化）、GitHub 两次 0 命中、
 * Semantic Scholar 两次 429 限流。判据为心虫自有纯规则实现（家族
 * 定义取自判断与决策科学的标准描述：anchoring effect / 锚定效应——
 * Tversky & Kahneman 1974：初始呈现的数值（锚点）对后续估计施加
 * 不成比例的影响，估计值向锚点调整不足；后续的估值、谈判、比较
 * 始终围绕第一个数字展开，未以独立估价校准。逻辑上，一个任意的
 * 起始数字不携带关于标的真实价值的信息，「比原价省了多少」不构成
 * 「划算」的理由）。
 *
 * 辨别的族：锚定效应（anchoring effect）——**锚点呈现**（标价/
 * 吊牌价/原价/开价/报价/起拍价/市场价/第一句报的数/对方先开口的
 * 数；EN list price / sticker price / asking price / MSRP / opened
 * at / first price / quoted … first / named the … salary）之后，
 * **估计被锚点支配**——围绕锚点计算的划算感、在锚点附近成交的
 * 谈判、拿锚点去比一切的比较、以锚点为估值本身的判断：
 *   这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜。
 *   谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。
 *   起拍价一万二，最后两万八落锤，我现在觉得这瓷瓶也就值这个价。
 *   The sticker said ten thousand, so when the salesman offered seven
 *     I felt I was getting a great deal.
 *   The first price I heard was two hundred, and every offer after
 *     that stayed inside the orbit of that number.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：估值应当由独立
 * 信息决定——成本、行情、可比成交、专业评估。锚定效应把**任意
 * 起始数字**偷换成**价值参照系**，让未经独立校准的判断获得虚假
 * 的确定性（「比原价省了八千多」的省钱感完全由被锚定的原价
 * 定义）；谈判中表现为让步幅度远小于锚点与真实价值之差（开价
 * 八千的东西只值三千，砍到六千五就签）。与正当表述有明确界线：
 * 以成本/行情/比价数据为基准的估价、谈判前的独立评估与心理
 * 底线、明确抵抗锚点的陈述（不受开价影响/以独立估价为锚）、
 * 或引用本族名称的教学句——均豁免。
 *
 * 与既有维度的边界（r242 归因）：
 *   · endowment_effect（r241 草稿）管**所有权附着→估值推高**
 *     （是我的所以值更多）；本族腿①是**锚点数字呈现**（标价/
 *     开价/第一报价），不依赖所有权，「这是我的，低于心理价
 *     免谈」无锚点呈现腿，天然不命中。
 *   · winners_curse（r237 草稿）管**竞价胜出→价值被低估**的
 *     推断；本族判**初始数字→后续估计**的支配，无竞价胜利腿，
 *     「竞标成功说明这块地被低估了」不命中。
 *   · appeal_to_wealth（第 186 维）管**崇拜富人/财富=能力证据**；
 *     本族不涉财富崇拜，判数字锚定。
 *   · false_precision（第 188 维）管**数字精度伪装准确**；本族
 *     判初始值对估计的支配，无精度结构。
 *   · sunk_cost_coercion（第 98 维）管**已投入→退出羞耻**；本族
 *     无投入计量与退出结构。
 *   · mental_accounting（r235 草稿）管**资金来源标签→消费许可**；
 *     本族判价格锚点，无来源标签腿。
 *   · disposition_effect（r240 草稿）管**盈亏状态→处置时点不对称**；
 *     本族不依赖盈亏状态。
 *
 * 判据（双腿链共现 + 数字在场，缺一不判）：
 *   ① 腿① ANCHOR 锚点呈现（标价/吊牌价/原价/定价/售价/市场价/
 *      开价/报价/起拍价/起步价/建议零售价/价签 + 数字；第一句报的
 *      数/对方先开口/起的头/随口报/试探性报；EN list price /
 *      sticker price / asking price / MSRP / opened at / first
 *      price / opening bid / opening offer / quoted … first /
 *      named the … salary / said … first），且**锚点所在句必须
 *      含数字**（ digit 或中文数字/英文数词）；
 *   ② 腿② DOMINATED 估计被锚点支配——
 *      ORBIT 围绕锚点族（拿这个数比/围着这个价转/跳不出这个范围/
 *      顺着这个数谈/照这个量级批/就在这个数上让/没独立估过；
 *      EN stayed inside the orbit of that number / never escaped
 *      that range / kept comparing everything to that / never
 *      questioning whether）**查否定前缀**（并不觉得划算/没有占
 *      便宜/never felt cheap）；
 *      DEAL 划算感族（觉得划算/占了便宜/不买就是亏/试都没试就刷卡/
 *      怎么看都划算/比原价省了；EN felt like a great deal / felt
 *      generous / feel like a win / without even trying it on）
 *      **查否定前缀**；
 *      WORTH 估值即锚点族（也就值这个价/值这个数/砍到…就签了；
 *      EN worth that much / that is what it is worth / settled
 *      without ever questioning）**查否定前缀**；
 *   ③ 腿①×腿②近距离窗（ZH 60 / EN 180）。
 *
 * 为什么取 VERIFY 级：单句可能只是在转述一次被锚定的交易/谈判
 * 而未展开估值论证，也可能是当事人尚未意识到估计已被初始数字
 * 支配。verify 的语义是「这段话把任意起始数字当成了价值参照系，
 * 先核实估值是否有独立依据（成本/行情/可比成交/专业评估），
 * 再决定是否采信其结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 以独立信息为基准的估价（按成本加成/比价网站数据/历史低价/
 *     面料行情/二手成交行情/公开数据/cash flows/formal valuation
 *     /comparable sales——CORRECTIVE 豁免）；
 *   · 谈判纪律（独立评估+心理底线/报价不随对方开价走/ceiling
 *     /reservation price——CORRECTIVE 豁免）；
 *   · 明确抵抗锚点（不受开价影响/以独立估价为锚/避免被开价带偏/
 *     ignored the asking price）；
 *   · 纠正与重估陈述（重新评估/该按行情看/procedural starting
 *     point）；
 *   · 单腿陈述（只「标价」无支配腿、只「觉得划算」无锚点呈现——
 *     缺一共现即无族形状；纯描述「详情页标注原价999元、活动价
 *     99元」无判断腿不判）；
 *   · 否定纠偏（并不觉得划算/没有占便宜/不值这个价）；
 *   · 概念讨论（锚定效应/锚点/anchoring/anchored estimate 教学
 *     定义句）；
 *   · 禀赋效应/赢家诅咒/诉诸财富/虚假精度/沉没成本领地（见上边界）。
 */
'use strict';

// ─── 腿① 锚点呈现（中文；锚词后紧跟数字或锚词本身即数字呈现）────
const ANCHOR_ZH = [
  /(?:标价|吊牌价|原价|定价|售价|市场价|开价|报价|起拍价|起步价|建议零售价|价签|标牌价)[一二三四五六七八九十百千万亿两0-9０-９]/, // 标价五百万/原价九千九
  /(?:标价|吊牌价|原价|定价|售价|市场价|开价|报价|起拍价|起步价|价签)[^。，！？；\n]{0,4}(?:是|为|写|标)(?:了)?[一二三四五六七八九十百千万亿两0-9０-９]/, // 标价是五千
  /(?:薪资|工资|薪水|薪酬|中标价|标的额|预算|总额)[^。，！？；\n]{0,6}[一二三四五六七八九十百千万亿两0-9０-９]/, // 薪资开到一万五/薪资说了两万
  /第一(?:个)?(?:数|报价|价格|数字|印象)/,                       // 第一个数/第一句报的价
  /第一(?:个|项|条)(?:项目|报价|价格|数|数字|条目|候选|候选人)/,   // 报价单上第一个项目/第一个候选人
  /(?:先|头一句|开口)(?:报|开|说)了?(?:价|数|个)?/,                // 先报了原价/先开口
  /(?:对方|他|她|买家|卖家|中介|销售)(?:先|一上来|开口)(?:报|开|说)/, // 对方先开口
  /(?:起的头|开头(?:的)?(?:数|价|价码))/,                          // 起的头
  /(?:随口|顺口|试探性?|随便)(?:报|开|说)(?:了)?(?:个|价)?/,      // 随口报了个价
  /(?:第|头)(?:一|1)(?:句|个|轮|口)(?:报|说|开)/,                 // 第一句报了
];

// ─── 腿① 锚点呈现（英文）──────────────────────────────────────
const ANCHOR_EN = [
  /\b(?:list|sticker|asking|posted|advertised|quoted|original|initial|MSRP)\s+(?:price|offer|bid|amount|number|figure)s?\b/i, // list price / MSRP
  /\b(?:sticker|label|tag)\s+(?:said|read|showed)\b/i,           // the sticker said ten thousand
  /\b(?:opened|opening)\s+(?:at|with|offer|bid)\b/i,              // opened at ninety / opening bid
  /\b(?:first|initial)\s+(?:price|number|offer|figure|quote)\b/i, // the first price I heard
  /\bthe\s+(?:bid|offer|price)\s+opened\b/i,                     // the bid opened
  /\bquoted\b[^.]{0,40}\bfirst\b/i,                              // quoted twelve thousand first
  /\bsaid\s+[\w\s-]{0,24}first\b/i,                              // said ten thousand first
  /\bnamed\s+the\s+[\w\s-]{0,24}\b/i,                            // named the six-figure salary
  /\bstarted\s+(?:at|with)\s+[\w\s-]{0,20}\d/i,                  // started at 500
];

// ─── 腿② ORBIT 围绕锚点族（中文；查否定前缀）───────────────────
const ORBIT_ZH = [
  /(?:拿|用|以)(?:这个|那个|它|此)(?:数|价|价钱|价位|数字)(?:去|来|在)?(?:比|衡量|估|砍|谈|量)/, // 拿这个数去比/拿这个数在比
  /(?:围着|围绕|绕着)(?:这个|它|那个|此)(?:数|价|价位|数字|范围)(?:转|走|打转)/, // 围着这个数转
  /(?:一直|全|都|始终)(?:在|待在|困在)(?:这个|这|那个|那)(?:范围|圈子|区间|数)(?:里|之内|内|上)/, // 一直在这个范围里
  /(?:跳|走|跑)不出(?:这个|那个|此)(?:范围|圈子|区间|圈|数)/,     // 跳不出这个范围
  /(?:顺着|就着|沿着)(?:这个|它|那个)(?:数|价|价位|数字)(?:就)?(?:谈|让|砍|签|批|定|走|报)/, // 顺着这个数就谈了
  /(?:照|按)(?:着)?(?:这个|它)(?:量级|数|价位|数字)(?:批|报|谈|定|让)/, // 照着这个量级批
  /(?:就|正)?在(?:这个|它)(?:数|价|价位)(?:上)(?:让|砍|谈|加|签)/, // 就在这个数上让了两千
  /(?:压根|根本|完全|丝毫)?没(?:有)?独立估(?:过|计|算|量)/,       // 压根没独立估过
];

// ─── 腿② DEAL 划算感族（中文；查否定前缀）──────────────────────
const DEAL_ZH = [
  /(?:觉得|感觉|觉着|认为)(?:特别|很|挺|真|简直)?(?:划算|占便宜|划得来|值)/, // 觉得占了便宜/我觉得值
  /(?:占|捡)了?便宜/,                                            // 占了便宜
  /不买就是亏|不买就亏|不买亏了/,                                 // 不买就是亏
  /(?:赶紧|马上|立刻|当场|二话没说)(?:定|签|买|下单|刷卡|付了|拿下)/, // 赶紧定/当场刷卡
  /(?:差点|忍不住|冲动)(?:就)?(?:签|买|下单|刷卡|付了)/,          // 差点就签
  /(?:试都没试|想都没想|看都没看)(?:就)?(?:刷卡|下单|买了|签了|付了)/, // 试都没试就刷卡
  /怎么看(?:都)?(?:很|挺)?划算/,                                 // 怎么看都划算
  /比(?:标价|原价|定价|市场价)省了?/,                            // 比标价省了八千多
];

// ─── 腿② WORTH 估值即锚点族（中文；查否定前缀）─────────────────
const WORTH_ZH = [
  /(?:也就|就|才|只)?值这个(?:价|数|价钱|价位)/,                  // 也就值这个价
  /(?:也就|就|只)(?:值|只值)(?:这个|这点|那个|这点钱)/,           // 也就值这点钱
  /(?:砍|谈|让)到[^。，！？；\n]{0,10}就(?:签|定|成交|卖了|买了)/, // 砍到六千五就签了
];

// ─── 腿② ORBIT/DEAL/WORTH（英文；查否定前缀）───────────────────
const DOMINATED_EN = [
  // ORBIT：围绕锚点
  /\bstayed\s+inside\s+the\s+orbit\s+of\b/i,                     // stayed inside the orbit of that number
  /\bnever\s+escaped\s+(?:that|this)\s+range\b/i,                // never escaped that range
  /\b(?:kept|keep)\s+comparing\s+(?:everything\s+)?(?:to|against)\s+(?:that|this)\b/i, // kept comparing everything to that
  /\bwithin\s+(?:that|this)\s+range\b/i,                         // within that range
  /\bnever\s+(?:ever\s+)?(?:questioned|question)\s+whether\b/i,  // settled without ever questioning whether
  /\bwithout\s+(?:ever\s+)?(?:questioning|asking)\s+whether\b/i, // without ever questioning whether it was worth fifty
  /\bevery\s+(?:\w+\s+){0,3}?(?:felt|seemed|looked)\s+cheap\s+against\b/i, // everything still felt cheap against that opening number
  // DEAL：划算感
  /\bfelt\s+(?:like\s+)?(?:a\s+)?(?:great\s+|real\s+)?(?:deal|bargain|win|steal)\b/i, // felt I was getting a great deal
  /\bfelt\b[^.]{0,40}\b(?:a\s+)?(?:great\s+|good\s+|real\s+|fantastic\s+)?deal\b/i, // felt … great deal（间隔插入语）
  /\bgetting\s+a\s+(?:great\s+|good\s+|real\s+)?deal\b/i,       // getting a great deal
  /\bfeel\s+like\s+a\s+(?:win|bargain|deal|steal)\b/i,           // made the purchase feel like a win
  /\bfelt\s+generous\b/i,                                        // my counter of ten thousand felt generous
  /\bfelt\s+(?:so\s+|really\s+)?cheap\b/i,                       // everything felt cheap
  /\bhad\s+to\s+(?:buy|get)\s+it\b/i,                            // I had to buy it
  /\bswiped\s+my\s+card\b/i,                                     // swiped my card
  /\bwithout\s+(?:even\s+)?trying\s+it\s+on\b/i,                 // without even trying it on
  /\brushed\s+to\s+(?:buy|sign|order)\b/i,                       // rushed to sign
  // WORTH：估值即锚点
  /\b(?:is\s+)?worth\s+(?:about\s+)?(?:that|this)\s+(?:much|price|amount)\b/i, // worth that much
  /\bthat\s+is\s+what\s+it\s+is\s+worth\b/i,                     // that is what it is worth
];

// ─── 数字在场（锚点所在句必须含数字）───────────────────────────
const NUM_ZH = /[0-9０-９]|[一二三四五六七八九十百千万亿两]/;
const NUM_EN = /\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|figures?)\b/i;

// ─── 距离窗（腿①×腿②）──────────────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（讨论本族名称的教学/定义句）────────────────
const CONCEPT_ZH = /(?:锚定效应|锚定偏差|锚定启发|初始锚|锚点|调整不足|判断与决策|特维尔斯基|特沃斯基|卡尼曼|Kahneman|Tversky|行为经济)/;
const CONCEPT_EN = /\banchoring\s+(?:effect|bias|heuristic|and\s+adjustment)\b|\banchored\s+(?:estimate|estimate|judgment|value|number)\b|\bTversky\b|\bKahneman\b|\bjudgment\s+and\s+decision/i;

// ─── 豁免：纠正/独立估价陈述（成本/行情/比价数据/独立评估/心理底线/抵抗锚点）
const CORRECTIVE_ZH = /(?:成本加成|按成本|成本价|成本构成|比价|历史低价|成交行情|近期成交|二手行情|市场行情|面料行情|公开数据|专业评估|独立评估|独立估量|重新估|心理底线|底线是|不受[^。，！？；\n]{0,8}影响|不随[^。，！？；\n]{0,8}走|以独立估价为(?:锚|基准|参照)|避免被[^。，！？；\n]{0,10}带偏|行情来定|按行情|数据显示|比价网站|公允价值|第三方评估|客观估价|估价为[一二三四五六七八九十百千万亿两0-9０-９])/;
const CORRECTIVE_EN = /\b(?:formal\s+valuation|independent\s+(?:estimate|valuation|assessment|appraisal)|comparable\s+sales?|cash\s+flows?|wholesale\s+cost|cost\s+(?:basis|plus|data)|market\s+data|historical\s+(?:low|price)|price[- ]comparison|public\s+information|reservation\s+price|walk[- ]away\s+(?:price|point)|ceiling\b|ignored\s+the\s+asking\s+price|discounted\s+it\s+for|data\s+point|procedural|starting\s+point\s+only|public\s+information|objective\s+(?:basis|value)|reassessed|re[- ]?estimate)/i;

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

// 否定前缀检查（「并不觉得划算/没有占便宜/never felt cheap」不计）。
// 窗口取匹配前 8 字符：否定复合词 + 紧贴否定单字 + 否定词+≤2 填充字。
const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|没占|没有占|谈不上|谈不上是)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
// 匹配 span 内部的否定词（「并没有占便宜」式内嵌否定）。
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

// 句切分（返回 [{start,end}]，含句读边界）。腿①的数字在场检查
// 在**同句**内进行——「原价 999」必须与锚词同句。
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

// 双腿链配对：ANCHOR × DOMINATED（ORBIT/DEAL/WORTH 均查否定），
// ANCHOR 所在句必须含数字。
function pairLegs(text, sents, anchor, dominated, numRe, win) {
  const am = collect(text, anchor, true);
  if (am.length === 0) return [];
  const dm = collect(text, dominated, true);
  const pairs = [];
  for (const a of am) {
    const s = sents.find(x => a.idx >= x.start && a.idx < x.end);
    if (!s || !numRe.test(text.slice(s.start, s.end))) continue;
    for (const d of dm) {
      if (dist(a, d) > win) continue;
      pairs.push({ a, d });
    }
  }
  return pairs;
}

/**
 * 双腿链签名：锚点呈现 × 估计被锚点支配。
 */
function findSignatures(text, R) {
  const sigs = [];
  const sents = splitSentences(text);
  const langs = [
    {
      anchor: R.ANCHOR_ZH || ANCHOR_ZH,
      dominated: (R.ORBIT_ZH || ORBIT_ZH).concat(R.DEAL_ZH || DEAL_ZH, R.WORTH_ZH || WORTH_ZH),
      num: R.NUM_ZH || NUM_ZH,
      pair: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      anchor: R.ANCHOR_EN || ANCHOR_EN,
      dominated: R.DOMINATED_EN || DOMINATED_EN,
      num: R.NUM_EN || NUM_EN,
      pair: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    for (const p of pairLegs(text, sents, L.anchor, L.dominated, L.num, L.pair)) {
      sigs.push({ lang: L.lang, anchor: p.a.raw, dominated: p.d.raw });
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectAnchoringEffect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（锚定效应/锚点/anchoring 教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：纠正/独立估价陈述（成本/行情/比价数据/独立评估/心理底线/抵抗锚点）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'anchoring_effect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '锚点「' + x.anchor + '」×估计被支配「' + x.dominated + '」'
      : 'anchor "' + x.anchor + '" x dominated estimate "' + x.dominated + '"')),
    details: s.lang === 'zh'
      ? '锚定效应(' + sigs.length + '处: 初始数字「' + s.anchor + '」不成比例地支配后续估计——「' + s.dominated + '」，未以独立估价校准)(zh)'
      : 'anchoring effect(' + sigs.length + 'x: initial number "' + s.anchor + '" dominates the estimate — "' + s.dominated + '")(en)',
    guidance: '锚定效应指初始呈现的数字（标价/开价/第一报价）对后续估计施加不成比例的影响，估计值向锚点调整不足（这套房标价五百万，降二十万就觉得占便宜 / 对方开价八千，砍到六千五就签了，没去想它只值三千 / 起拍价一万二，两万八落锤就觉得瓷瓶值这个价 / The sticker said ten thousand, so the offer of seven felt like a great deal / The first price I heard was two hundred, and every offer stayed inside the orbit of that number）。请补上论证：估值是否有独立依据——成本构成、近期可比成交、专业评估、比价数据；「比原价省了多少」不构成划算的理由，原价本身是任意设定的数字；谈判中的让步幅度应当对照独立估价与心理底线，而不是锚点附近的小幅让移；若结论确实只由第一个数字支撑，明确标注估计未经独立校准。',
    tags: ['economics', 'behavioral-economics', 'anchoring-effect', 'cognitive-bias', 'valuation', 'judgment'],
  };
}

module.exports = {
  detectAnchoringEffect,
  __internals: () => ({
    ANCHOR_ZH, ANCHOR_EN,
    ORBIT_ZH, DEAL_ZH, WORTH_ZH,
    DOMINATED_EN,
    NUM_ZH, NUM_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
