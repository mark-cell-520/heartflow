/**
 * src/vivid-case-availability.js — 「生动个案可得性偏差（vivid-case
 * availability / anecdotal vividness）」检测器
 * （第 252 个判别维度，r308）
 *
 * [r308 立项] philosophy_decision 本体裁决 accelerate（confidence 0.7 /
 * priority 40 / trigger optimal_conditions；cognitiveLoad 与 uncertainty
 * 均为 "unknown"，按轮次纪律不当实质背书）。外部搜索实质无可用结果
 * （HN Algolia 三组关键词零命中；Semantic Scholar HTTP 429；GitHub
 * hallucination/fallacy 检索全为 LLM 依赖方案或 0 星仓库，心虫纯规则
 * 引擎不引入 LLM 依赖——如实记录，走内部路径）：池化缺口探针
 * scripts/round-308/gap-probe-r308.js（v6.8.178 实测）在 6 个候选族
 * 22 条攻击样本中，生动个案族 3/4 穿透 gate=pass（vivid1/vivid3/vivid4
 * 全部 action=pass score=1），为最薄弱环节；
 * scripts/round-308/attribution-r308.js 归因诊断：5 条漏判样本在
 * anecdotal / availability_bias / anecdote_as_proof / survivorship_bias /
 * hasty_generalization 五个相关既有维度单维函数上逐条零命中——独立
 * 攻击族，251 维真缺口。
 *
 * 辨别的族：生动个案可得性偏差——文本给出**单个生动、具体、情感冲击力
 * 强的个案例证**（亲眼看到/亲眼目睹/媒体连播的现场画面/网上疯传的案例
 * 视频），据此越过总体统计数据推断**危险性、发生率或领域结论**：
 *   我亲眼看到一个人抽烟活到九十岁，所以吸烟的危害被夸大了。
 *   网上有个案例说疫苗有害，所以很多人都在反对疫苗。
 *   I saw a plane crash on the news, flying is clearly too dangerous.
 *   A friend of a friend got struck by lightning twice, so it must be
 *   far more common than statistics claim.
 * 个案的「生动性」（画面感、情感冲击、故事性）与「统计代表性」无关：
 * 媒体与社交网络按**情绪唤醒度**而非发生率筛选内容，越生动的个案越被
 * 放大传播，把它的可回忆性错当成基础频率——这正是可得性启发式在个案
 * 层的表现（Kahneman & Tversky 的 availability heuristic 原本就包含
 * 「vividness」机制：生动案例更易提取，因而被高估概率）。
 *
 * 与既有维度的边界（r308 归因逐条实测）：
 *   · availability_bias（第 200 维）判据是**曝光密度线索**（老听说/满屏
 *     都是/keep hearing about） × 频率推断；本族判据是**单个具体个案**
 *     （亲眼看到一个人/有个案例说） × 危险性或领域结论，不依赖曝光
 *     频次表述——实测 vivid 族 3 条穿透样本在 availability_bias 腿①
 *     AVAIL 与腿② FREQ 上零命中（该维要求「老/经常+听说」这类频率修饰
 *     或「满屏/刷屏」这类密度词，「亲眼看到」与「有个案例」都不在表内）。
 *   · anecdotal（第 140 维）判据是**说话人身边熟人指称**（我邻居/我亲戚/
 *     我同事） × 领域级否定或行动推进；本族腿①可以是陌生人、媒体报道
 *     或「亲眼看到」的偶遇对象，且腿②落点是危险性/发生率而非领域否定
 *     （「所以买彩票是靠谱的」是正面领域结论，anecdotal 不收）。
 *   · anecdote_as_proof（第 84 维）判据是**第一人称/熟人语料** × 全称
 *     效果断言（都有效/行业标准）；本族主体常是陌生人或媒体案例，结论
 *     不是效果证明而是风险/发生率高估或低估。
 *   · survivorship_bias（第 132 维）管**可见成功个案**（只看见活下来的/
 *     成功的） × 推广；本族个案结局不限成功（活到九十/中大奖/坠机/
 *     被雷击都算），且判的是「生动性→概率估计」这一替代关系。
 *   · base_rate_neglect（第 169 维）管**具体阳性信号 × 高置信后验**
 *     （检测阳性→几乎肯定中招，有个体化检测语境）；本族没有检测/筛查
 *     语境，是叙事个案例证。
 *   · hasty_generalization 管推理形式的以偏概全（要显式概括桥或
 *     all/everyone 量化形）；本族是个案与结论的直接并置，无桥词。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   腿① VIVID 生动个案线索（中英）：亲眼看到/亲眼目睹/亲眼所见/当时
 *     就在现场/有个案例/网上有个案例/有个故事/听说过一件事/报道过一个
 *     案例/新闻里有个/视频里有个 + 单个量词（一个/一位/一起/一则/一条）；
 *     EN I saw / I witnessed / there was a case / a case where / a story
 *     about / one person / one guy / one woman / a video of / on the news
 *     I saw。
 *   腿② SKEW 概率/危险性偏斜推断（中英）：所以…危险/危害被夸大/被低估/
 *     夸大了/靠谱/是可行的/说明很常见/肯定很多/所以反对/所以恐慌/更多人
 *     都/因此认为 + 危险/常见/反对/恐慌/夸大/低估/高发/靠谱/可行/盛行；
 *     EN clearly too dangerous / must be far more common / way overblown
 *     / so many people are / proves it's common / clearly unsafe /
 *     therefore everyone is / blown out of proportion。
 *   两腿落在 80 字（EN 200 字符）邻近窗内即视为同一次「个案→总体」
 *   叙述。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人的个案论证、媒体报道引用、或
 * 带统计背景的故事引入。verify 的含义是「这个危险性/发生率结论建立在
 * 单个生动个案上而非基础频率数据，需要回到统计证据」——调用方应要求
 * 补基础发生率数据、把结论降级为「存在该案例，但发生率需以统计为准」，
 * 而不是接受个案概率推断。
 *
 * 明确不判的（豁免——这些是正确判别、数据陈述或概念讨论）：
 *   · 数据/统计依据在场（统计显示/数据显示/官方通报/研究表明/发生率/
 *     发病率/根据统计/according to statistics / data show / per capita
 *     / incidence rate——结论有独立证据支持时个案只是引子）；
 *   · 推理否定/反向承认（不代表/不能说明/不等于/不意味着/个案不能/
 *     孤例不能/不等于整体/doesn't prove / does not show / is not
 *     evidence——认知到偏差并主动拆解是正确判别）；
 *   · 概念/教学转述（可得性偏差/可得性启发/个案偏差/孤证/生动性/
 *     availability heuristic / vividness / anecdotal / anecdote——
 *     讨论这个概念本身不是运用它）；
 *   · 对冲（可能/也许/或许/大概/恐怕/似乎/好像/说不定/有待/maybe /
 *     perhaps / might / possibly / seems / appears——概率化结论不作
 *     谬误判定）；
 *   · 疑问句（含 ?/？）：提问不是断言；
 *   · 个案+数据并陈（个案作引子、随后给出统计对照的正确叙述）。
 */
'use strict';

// ─── 腿① VIVID 生动个案线索（中文）────────────────────────────────────
// r161 教训自查：核心词取裸名词形态（看到/目睹/案例/故事 去后缀仍命中）；
// 不收「多地/多起/大量案例」等可验证证据词（那是统计不是个案）。
const VIVID_ZH = [
  // 亲眼看到族（亲历目击 + 单个对象量词）——「亲眼看到一个人/亲眼目睹一起」
  /亲眼(?:看到|见到|看见|目睹|目击|所见|见证)/,
  /(?:当时|现场|就在现场)(?:看到|见到|目睹|目击|经历)/,
  /(?:就在|正在|正好在)(?:现场|事发现场|第一现场)/,
  /(?:看到|见到|看见|目睹|目击|撞见)(?:了)?[^。，！？!?]{0,6}(?:一个|一位|一起|一则|一条|一幕|一场)/,
  // r309 补：目睹 + 灾难事件裸名词（坠机/车祸/事故），无个体量词也构成生动个案腿
  /(?:看到|见到|看见|目睹|目击|撞见|亲历)(?:了|过)?[^。，！？!?]{0,4}(?:坠机|坠毁|车祸|事故|空难|船难|火灾|爆炸|地震|洪灾|踩踏|袭击|凶案|猝死)/,
  // 有个案例族（转述他人案例，单个量词限定）
  /(?:网上|网络上|新闻里|报道里|媒体上|短视频里|视频里|朋友圈里|群里|听人说|听说)(?:有|过)?[^。，！？!?]{0,8}(?:一个|一位|一起|一则|一条)(?:案例|事情|事|故事|事故|新闻|个案)/,
  /(?:有|有个|有过)[^。，！？!?]{0,4}(?:案例|个案|事例|故事)(?:说|讲|提到|表明)/,
  // r309 补：「X 里有个 + 事件裸名词」——新闻里有个坠机/有个小孩中奖，
  // 既有条目要求「有…(案例|事|新闻)」，漏掉「有个 + 个体/事件 + 动词结果」形态。
  /(?:网上|网络上|新闻里|报道里|媒体上|短视频里|视频里|朋友圈里|群里|听说|听闻)(?:有|有个|有过)[^。，！？!?]{0,6}(?:坠机|坠毁|车祸|事故|空难|火灾|爆炸|踩踏|猝死|中奖|考上|成功|发财|暴富|破产|被骗|出事|遇难)/,
  /(?:有个|有一位|有一名)[^。，！？!?]{0,4}(?:人|小孩|孩子|学生|老人|乘客|司机|彩民|游客|患者|买家|玩家)[^。，！？!?]{0,12}(?:中奖|中了大奖|考上|成功|发财|暴富|被骗|出事|遇难|猝死|坠楼|被撞|被雷击|中了)/,
  // r309 补：熟人裸主语 + 结果（邻居买彩票中了大奖/同事中了奖——「邻居/同事/
  // 亲戚/同学」等熟人名词直接作主语，不带「有个」前缀；这是二手生动叙事最
  // 常见的口语形态，161 轮「裸名词」教训的同族应用）
  /(?:邻居|街坊|同事|同学|亲戚|老乡|熟人|牌友|室友|队友|导师|领导|客户)[^。，！？!?]{0,8}(?:买|买过|买彩票|中了|中奖|中了大奖|中彩|发财|暴富|赚了|被骗|出事|住院|去世|离婚|猝死)/,
  /(?:邻居|街坊|同事|同学|亲戚|老乡|熟人|牌友|室友|队友)(?:家|们)?[^。，！？!?]{0,6}(?:孩子|儿子|女儿|侄子|外甥|孙子)[^。，！？!?]{0,10}(?:考上|中奖|成功|发财|被骗|出事|猝死|留学|保送)/,
  // 听说过一件事族（二手生动叙事）
  /(?:听|听说|听闻)(?:过|说)?[^。，！？!?]{0,4}(?:一件|一个|一则|一条)(?:事|事情|案例|故事)/,
  // r309 补：听说/传闻 + 有人/某人 + 结果（听说有人中奖/听说某人被骗）
  /(?:听说|听闻|传闻|据说)(?:有)?[^。，！？!?]{0,2}(?:有人|某人|一个人|有人家)[^。，！？!?]{0,10}(?:中奖|中了大奖|中彩|考上|成功|发财|暴富|被骗|出事|遇难|猝死|被撞|被雷击|被砸|住院|去世)/,
  // 单一个体 + 戏剧性遭遇（坠机/车祸/中奖/被雷击——媒体偏好的高唤醒事件）
  /(?:一个|一位|一名|有个)(?:人|乘客|患者|乘客|司机|买家|玩家|彩民|游客|学生|老人|小孩|孩子)[^。，！？!?]{0,10}(?:被|遭|遇到|碰上|中了|赶上了|撞上)/,
  // 视频/画面冲击族（新闻连播/疯传的现场画面）
  /(?:视频|画面|镜头|照片|直播)(?:里|中|上)[^。，！？!?]{0,8}(?:一个|一位|一起|一幕|一场)/,
  /(?:疯传|刷屏|热传|传得沸沸扬扬|传遍)(?:的)?[^。，！？!?]{0,8}(?:视频|画面|案例|故事|新闻)/,
  // 熟人转述的奇闻族（朋友的朋友/听说某人——二手生动叙事）
  /(?:朋友的朋友|朋友的朋友的朋友|同事的同学|同学的同事|亲戚的邻居)/,
  /(?:听说|听闻)(?:有)?[^。，！？!?]{0,4}(?:某人|有人|个人)[^。，！？!?]{0,10}(?:被|遭|中了|遇到)/,
];

// ─── 腿① VIVID 生动个案线索（英文）────────────────────────────────────
const VIVID_EN = [
  // 亲历目击族
  /\b(?:i|we)\s+(?:saw|seen|witnessed|watched|personally\s+saw)\b/i,
  /\b(?:saw|seen|witnessed)\s+(?:a|an|one)\s+(?:case|story|incident|crash|accident|video|report|person|man|woman|guy|child)/i,
  /\bwitnessed\s+(?:a|an|one)\b/i,
  // 熟人转述 + 戏剧性结果（a friend of a friend won / a friend got…）——r309 补：
  // 上两条要求 got|was 后接特定动词表，漏了「won the lottery / won big」这类
  // 无中间名词的成功叙事。补「熟人名词 + won/landed/walked away」独立腿。
  /\b(?:a|one)\s+(?:friend\s+of\s+a\s+friend|friend|guy|man|woman|person|neighbor|neighbour|stranger|coworker|colleague|cousin|uncle|aunt)\b[^.]{0,30}\b(?:won|winning|wins|landed|got\s+lucky|walked\s+away|struck\s+it\s+rich|hit\s+the\s+jackpot)/i,
  /\b(?:won|winning|wins)\s+(?:the\s+)?(?:lottery|jackpot|big|a\s+fortune|millions)\b/i,
  // there was a case / a case where 族
  /\bthere\s+(?:was|is)\s+(?:a|an|one)\s+(?:case|story|incident|report|example)/i,
  /\ba\s+(?:case|story)\s+(?:where|of|about)\b/i,
  // 媒体报道个案族
  /\b(?:on\s+the\s+news|in\s+the\s+news|news\s+report|news\s+story|media\s+report|headline)\b[^.]{0,30}\b(?:a|an|one)\s+(?:case|person|man|woman|crash|incident)/i,
  /\b(?:a|one)\s+(?:viral|widely\s+shared|circulating)\s+(?:video|story|case|post|clip)/i,
  // 单一个体 + 戏剧性遭遇
  /\b(?:a|one)\s+(?:friend\s+of\s+a\s+friend|friend|guy|man|woman|person|neighbor|stranger|coworker|colleague)\b[^.]{0,25}\b(?:got|was|were|had)\s+(?:struck|hit|killed|injured|lucky|won|diagnosed|attacked)/i,
  /\b(?:got|was)\s+(?:struck\s+by\s+lightning|hit\s+by\s+lightning|hit\s+by\s+a\s+car|winning\s+the\s+lottery|attacked\s+by\s+a\s+shark)/i,
];

// ─── 腿② SKEW 概率/危险性偏斜推断（中文）──────────────────────────────
// 否定前缀保护：不代表/不能说明/不等于/不意味着/推不出/说明不了 紧邻时
// 是对「个案→总体」推理的拆解（「看到一个个例，但不能说明问题」是正确
// 判别）。lookbehind alternation（Node 18 支持变长）。
const NEG_GUARD = '(?<!(?:不代表|未必|不一定|不等于|不意味着|不能说明|无法说明|推不出|说明不了|算不上|不足以))';

const SKEW_ZH = [
  // 危险性高估/低估族（危害被夸大/被低估——最典型形态）
  new RegExp(NEG_GUARD + '(?:危害|风险|危险|威胁)(?:被|受|遭)?(?:夸大|高估|低估|夸大了|言过其实|耸人听闻)'),
  /(?:被|遭到|饱受)?(?:夸大|高估|低估|言过其实|耸人听闻|杯弓蛇影|草木皆兵)/,
  // 太危险族（所以…太危险/很危险）
  /(?:所以|可见|看来|显然|一定|肯定|明明)[^。，！？!?]{0,8}(?:太|很|非常|特别|格外)(?:危险|凶险|可怕|吓人|要命|不安全)/,
  /(?:太|很|非常|特别|格外)(?:危险|凶险|可怕|吓人|要命|不安全)(?:了|得多|多了)/,
  // 常见/高发族（说明很常见/肯定很多/高发）
  /(?:所以|可见|看来|显然|一定|肯定|说明|表明)[^。，！？!?]{0,8}(?:很常见|很普遍|非常多|很多|不少|高发|频发|比比皆是|屡见不鲜|层出不穷)/,
  /(?:比比皆是|屡见不鲜|层出不穷|遍地开花|多如牛毛|数不胜数)/,
  // 靠谱/可行族（所以买彩票是靠谱的/这种方式可行——正面领域结论）
  /(?:所以|可见|看来|显然|一定|肯定|说明|表明)[^。，！？!?]{0,10}(?:靠谱|可行|能行|有效|有用|值得|划算|稳赚|不亏)/,
  // r309 补：负向领域结论（所以玩手机没问题/学习不重要/不用担心——由个案
  // 推出「某事无害/不重要」的偏斜断言，与「靠谱」族互为镜像）
  /(?:所以|可见|看来|显然|一定|肯定|说明|表明|意味着)[^。，！？!?]{0,8}(?:没什么|没啥|没有)?(?:问题|大不了|危害|风险|要紧|必要)/,
  /(?:所以|可见|看来|显然|一定|肯定|说明|表明|意味着)[^。，！？!?]{0,8}(?:不重要|无所谓|不必|不用|没啥|没什么)(?:担心|在意|在乎|重视|管|要紧)/,
  /(?:所以|可见|看来|显然|一定|肯定|说明|表明|意味着)[^。，！？!?]{0,6}(?:不重要|无所谓|无关紧要|不要紧|没意义)/,
  /(?:所以|因此|可见|说明|这意味着)[^。，！？!?]{0,10}(?:不用|不必|没必要|无须|犯不着)(?:担心|害怕|恐慌|在意|管|理会)/,
  // 群体反应族（所以很多人反对/大家都恐慌/更多人认为——由个案推群体态度）
  /(?:所以|因此|可见|难怪)[^。，！？!?]{0,8}(?:很多人|大家|越来越多的人|不少人|许多人)(?:都)?(?:在)?(?:反对|恐慌|担心|害怕|质疑|抵制|转粉|黑转粉|路转粉)/,
  /(?:反对|恐慌|担心|害怕|质疑|抵制)(?:是|那是)?(?:有|不无)?(?:道理|缘由|原因)的/,
  // 概率偏斜族（所以概率很高/机会很大/十有八九）
  new RegExp(NEG_GUARD + '(?:所以|因此|可见|说明|这意味着)[^。，！？!?]{0,8}(?:概率|几率|机会|胜算|希望)(?:很|相当|极大|颇)(?:高|大|不错)'),
  /(?:十有八九|八九不离十|大概率|多半|想必)/,
];

// ─── 腿② SKEW 概率/危险性偏斜推断（英文）─────────────────────────────
const SKEW_EN = [
  // 危险性偏斜族
  /\b(?:clearly|obviously|definitely|so|thus|therefore)\s+(?:too|way\s+too|far\s+too|extremely|incredibly)\s+(?:dangerous|risky|unsafe|deadly|hazardous)/i,
  /\b(?:blown|blew)\s+out\s+of\s+proportion/i,
  /\b(?:way|far|much)\s+(?:more|less)\s+(?:dangerous|risky|common|frequent|likely)\s+than/i,
  /\b(?:overblown|overstated|exaggerated|understated|overrated|underrated)\b/i,
  // 常见性偏斜族
  /\b(?:must|has\s+to|have\s+to)\s+be\s+(?:far\s+|much\s+|way\s+|a\s+lot\s+)?(?:more|less)\s+(?:common|frequent|widespread|likely|prevalent)/i,
  /\b(?:proves?|shows?|means?)\s+(?:that\s+)?(?:it'?s|things\s+are)\s+(?:common|everywhere|widespread|frequent)/i,
  /\b(?:so|therefore|thus|hence)\s+(?:many|most|lots\s+of|tons\s+of)\s+(?:people|folks|everyone)\s+(?:are|do|think|believe|oppose|fear)/i,
  // 概率偏斜族
  /\b(?:so|thus|therefore)\s+(?:the\s+)?(?:odds|chances|probability|likelihood)\s+(?:are|is)\s+(?:high|low|slim|great|strong)/i,
  /\b(?:far|much|way)\s+(?:more|less)\s+likely\s+(?:to|than)/i,
  // r309 补：场所/群体 + 充斥偏斜（the subway is full of crime / the city is
  // crawling with thieves）——「witnessed a mugging on the subway, so the subway
  // is full of crime」这类由个案推「某地充斥某现象」的形态，skew 腿原表缺。
  /\b(?:is|are)\s+(?:full\s+of|crawling\s+with|overrun\s+with|infested\s+with|rife\s+with)\s+(?:crime|violence|danger|thieves|scammers|accidents|attacks|cases)\b/i,
  /\b(?:everywhere|all\s+over|rampant)\b[^.]{0,20}\b(?:crime|violence|fraud|danger|attacks)\b/i,
];

// ─── 豁免一：数据/统计依据在场（结论有独立证据支持时个案只是引子）─────
const EXEMPT_EVIDENCE_ZH = [
  /(?:统计|数据|官方|通报|报告|研究|调研|普查|登记|台账)[^。，！？!?]{0,6}(?:显示|表明|指出|证实|反映)/,
  /(?:根据|依据|参照|基于)[^。，！？!?]{0,8}(?:数据|统计|报告|通报|研究|调研|记录|台账)/,
  /同比|环比|发生率|发病率|案发率|增长率|死亡率|致死率|基础频率|基线概率/,
];
const EXEMPT_EVIDENCE_EN = [
  /(?:statistics|data|figures|official\\s+(?:data|figures|records|reports)|reports|studies|research|surveys?)\\s+(?:show|shows|showed|indicate|indicates|suggest|suggests|found|reveal|reveals)/i,
  /(?:according|based)\\s+(?:to|on)\\s+(?:the\\s+)?(?:data|statistics|figures|official\\s+records|research)/i,
  /year[- ]over[- ]year|per\\s+capita|incidence\\s+rate|base\\s+rate/i,
];

// ─── 豁免二：推理否定/反向承认（认知到偏差并主动拆解是正确判别）────────
const EXEMPT_VERIFY_ZH = [
  /(?:但|但是|然而|不过|可是|只是|却|而)[^。]{0,24}(?:要看|得看|须看|待看|以[^。]{0,8}为准|有待核实|有待确认|需要核实|需要查证|还要看|仍要看|再下结论)/,
  /(?:不代表|未必|不一定|不能说明|无法说明|不等于|不意味着|推不出|说明不了|算不上|不足以)[^。]{0,14}(?:常见|普遍|危险|发生|概率|整体|总体|全部|夸大|高估|低估)/,
  /(?:孤例|个案|单个案例|个例)[^。]{0,8}(?:不能|不足以|无法|难以|勿)(?:说明|证明|推断|推广|外推|得出)/,
  /(?:求证|核实|查证|待证实|有待证实|需要验证|尚需确认)/,
  /(?:个案|孤例|个例)(?:与|和)(?:统计|数据|总体|整体)(?:要|需|应当)?(?:分开|区分|区别)/,
];
const EXEMPT_VERIFY_EN = [
  /(?:but|however|though|although|yet)\\s+(?:i|we)\\s+(?:should|need\\s+to|must|have\\s+to)\\s+(?:check|verify|look\\s+at|consult|confirm)/i,
  /(?:doesn'?t|does\\s+not|don'?t|do\\s+not)\\s+(?:necessarily\\s+)?(?:mean|prove|show|imply)/i,
  /(?:anecdote|single\\s+case|one\\s+case|isolated\\s+case)\\s+(?:is|isn'?t|does\\s+not|doesn'?t)\\s+(?:not\\s+)?(?:evidence|proof|representative)/i,
  /(?:need|needs)\\s+(?:more\\s+)?(?:data|evidence|statistics)\\s+(?:before|to)/i,
  /(?:not\\s+necessarily|no\\s+conclusion)\\s+(?:about|on)\\s+(?:the\\s+)?(?:actual|real|true)/i,
];

// ─── 豁免三：概念/教学转述（讨论这个概念本身不是运用它）────────────────
const EXEMPT_META_ZH = [
  /可得性(?:偏差|启发|启发式|偏误)|易得性(?:偏差|启发)/,
  /认知偏差|认知偏误|启发式(?:与|和|及)?偏差/,
  /(?:孤例|个案|个例)(?:不|未|难以)(?:能|可|足)(?:证明|推断|推广)/,
  /生动性|叙事偏差|故事偏差|案例偏差|轶事(?:偏差|证据|谬误)/,
];
const EXEMPT_META_EN = [
  /availability\\s+(?:bias|heuristic|cascade|error)/i,
  /cognitive\\s+(?:bias|biases)/i,
  /anecdotal\\s+(?:evidence|fallacy|reasoning|bias)/i,
  /vividness\\s+(?:bias|effect|heuristic)/i,
];

const WIN_ZH = 80;    // 中文邻近窗（字）
const WIN_EN = 200;   // 英文邻近窗（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkVividCaseAvailability(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const V_Z = R.VIVID_ZH || VIVID_ZH;
  const V_E = R.VIVID_EN || VIVID_EN;
  const S_Z = R.SKEW_ZH || SKEW_ZH;
  const S_E = R.SKEW_EN || SKEW_EN;

  // 疑问句：问的是趋势本身，不是以个案替代统计的断言
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 三组豁免在场 → 不是运用它
  const E_Z = R.EXEMPT_EVIDENCE_ZH || EXEMPT_EVIDENCE_ZH;
  const E_E = R.EXEMPT_EVIDENCE_EN || EXEMPT_EVIDENCE_EN;
  const F_Z = R.EXEMPT_VERIFY_ZH || EXEMPT_VERIFY_ZH;
  const F_E = R.EXEMPT_VERIFY_EN || EXEMPT_VERIFY_EN;
  const M_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const M_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  if (anyHit(M_Z, text) || anyHit(M_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(F_Z, text) || anyHit(F_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(E_Z, text) || anyHit(E_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① 生动个案线索
  const vZhIdx = firstHit(V_Z, text);
  const vEnIdx = firstHit(V_E, text);
  const vIdx = vZhIdx >= 0 ? vZhIdx : vEnIdx;
  if (vIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 概率/危险性偏斜推断
  const sZhIdx = firstHit(S_Z, text);
  const sEnIdx = firstHit(S_E, text);
  const sIdx = sZhIdx >= 0 ? sZhIdx : sEnIdx;
  if (sIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「个案→总体」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(vIdx - sIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  const guidance = '生动个案可得性偏差（vivid-case availability）指拿一个容易回忆/高度曝光的单个案例越过总体发生率下结论。可得性≠发生率：媒体曝光量、情绪强度、人际传播频率与真实概率是三个独立的量（Tversky & Kahneman 1973）。正确做法是补上基础频率/官方统计后再采信或否定，把「我想起来的容易程度」换成「这件事实际发生的频率」。';

  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '生动个案可得性偏差×个案推断总体(zh)'
      : 'vivid-case availability×anecdote-to-population-inference(en)',
    dimension: 'vivid_case_availability',
    guidance,
  };
}

module.exports = {
  checkVividCaseAvailability,
  DIMENSION_NAME: 'vivid_case_availability',
  // [r309 修复] SEVERITY 55——verify 级（生动个案+偏斜断言也可能是正确
  // 转述与批评、显式给出基础频率的正确陈述、对冲表述，rewrite/block 会
  // 误伤）。此前误写 62，与 VERIFY 级定位不符，轮测组6实测断言失败。
  SEVERITY: 55,
  guidance: '生动个案可得性偏差（vivid-case availability）指拿一个容易回忆/高度曝光的单个案例，越过总体统计数据直接推断危险性或发生率：看到一次坠机就断言飞行太危险、听说有人中奖就说买彩票靠谱、新闻里有个孩子不学习也成功就说学习不重要、a friend of a friend won the lottery, so the odds must be overblown。请补上论证：结论是否有基础频率/官方统计/长期数据的独立支持；单个案例的说服力来自它的生动性而非代表性（可得性≠发生率，媒体报道量与实际发生率是两回事）；若只有个案支撑，把结论降级为「存在这样的个案」而不是「总体上就是这样」。',
  __internals: () => ({
    VIVID_ZH, VIVID_EN, SKEW_ZH, SKEW_EN,
    EXEMPT_EVIDENCE_ZH, EXEMPT_EVIDENCE_EN,
    EXEMPT_VERIFY_ZH, EXEMPT_VERIFY_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
  }),
};
