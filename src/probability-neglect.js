/**
 * src/probability-neglect.js — 「概率忽视（probability neglect / probability
 * weighting distortion / zero-risk bias）」检测器
 * （第 252 个判别维度，r308）
 *
 * [r308 立项] philosophy_decision 本体裁决 accelerate（confidence 0.7 /
 * priority 40 / trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为
 * "unknown"，按轮次纪律不当实质背书）。外部搜索：HN Algolia "cognitive bias
 * detection" 命中 nSENS（mjankowski，51-bias 目录含 confirmation/automation/
 * sunk cost/anchoring，Show HN 2026-06）——其目录与本族同族但为 Python+YAML
 * 决策验证框架，无规则引擎判据实现；arXiv 2405.02318（HN 258 分，"Translating
 * natural language to first-order logic for logical fallacy detection"，2024）
 * 提供 FOL 翻译方法论但面向谬误分类非概率权重；GitHub "logical fallacy
 * detection" 最高星 tmmakesense/logical-fallacy ★21（在线工具非引擎）；
 * Semantic Scholar 连续 HTTP 429。无可直接集成的判据实现，走内部路径：
 * 既有 251 维中 base_rate_neglect（169）只管「阳性信号无视先验」、
 * appeal_to_probability 只管「规模→必然」，无一维度判「概率权重被系统性
 * 扭曲」这一族（概率差异被抹平/零风险溢价/概率非线性权重失衡）——gap 探针
 * 实测见 scripts/round-308/probe-gap-r308.js。
 *
 * 辨别的族：概率忽视——文本把**两个概率不同的事件当成同等对待**（把 0.1%
 * 与 1%、把「几乎不可能」与「绝对不可能」、把 5% 与 50% 说成一样），或
 * **为消灭最后一点残余风险付出不成比例的成本**（零风险溢价：为把风险从
 * 1% 降到 0.1% 花十倍钱），或**用「非零即一」的二值思维替换概率推理**
 * （只要不是零就可能发生/有小概率就等于很可能）。概率论里 0.1% 与 1% 差
 * 10 倍、1% 与 50% 差 50 倍，把概率差异抹平的断言会让风险评估、资源
 * 配置、决策权衡全部失真：
 *   0.1% 和 1% 的概率差不多，没必要区分。
 *   既然不是零，就有可能发生，所以必须按一定会发生来防。
 *   为了把风险从百分之一降到千分之一，花多少钱都值。
 *   0.1% and 1% are basically the same odds; no point distinguishing them.
 *   Since the risk isn't zero, it could still happen, so we must plan for it as certain.
 *
 * 与既有维度的边界（r308 归因）：
 *   · base_rate_neglect（第 169 维）管**先验被无视**（阳性信号出现时忘了
 *     基础发病率），本族管**两个概率之间的权重关系**被抹平/扭曲，不要求
 *     任何信号-先验结构；
 *   · appeal_to_probability（既有维）管**规模→必然**（基数大所以一定
 *     发生），本族管**概率差异→同等对待**与**残余风险→不计成本**，方向
 *     相反：那边是把低概率抬成必然，这边是把不同概率压成同一档；
 *   · false_equivalence 管泛泛的「两者一样」不当类比，本族的「一样」必须
 *     落在**概率/风险量级**上（腿①是概率表达）；
 *   · statistical_misleading（第 58 维）管小基数比例，本族不涉及样本量；
 *   · zero_risk_bias 不是既有维度（grep 实证 0 文件），本族为零风险溢价
 *     的首次覆盖；
 *   · gamblers_fallacy / hot_hand 管独立事件序列的方向幻觉，本族管概率
 *     权重本身被扭曲。
 *
 * 判据（双腿共现 + 邻近窗，缺一不判）：
 *   腿① PROB 概率/风险量级表达：显式概率词（概率/几率/可能性/风险/胜率/
 *     命中率/事故率/发病率/失败率/百分比/%/百分点/千分之/百分之/万分之/
 *     概率是/概率为/风险为/高达/低至/仅/只有 × 数字）+ 量级比较词
 *     （差不多/差不多大/一样/相同/相当/接近/没什么区别/没区别/等同/一回事/
 *     半斤八两/不相上下）+ 显式数值概率（1%/1.5%/3%/10%…）；
 *     EN probability / chance / odds / risk / likelihood / percent / % /
 *     percentage points / basically the same / roughly equal / no
 *     difference / just as likely。
 *   腿② NEGLECT 概率权重扭曲行为：
 *     (a) 抹平形——「差不多」「一样」「没区别」落在概率表达邻近窗内；
 *     (b) 零风险/不计成本形——「只要不是零」「非零即一」「花多少钱都值」；
 *     (c) 二值化形——「可能发生=会」「不等于零=必然」「有小概率=很可能」。
 *
 * 为什么取 VERIFY 级：具体事件的真实概率取决于数据与模型，规则引擎无法
 * 独立判定「0.1% 与 1% 是否真的可区分」，只能识别「概率差异被抹平 /
 * 残余风险被不计成本地消灭 / 概率被二值化」的**推理形态**。verify 的含义
 * 是「先补概率证据再采信」：调用方应要求给出两个概率的期望值/置信区间、
 * 把结论降级为「两档概率的期望成本差为 X」，或要求说明为何残余风险值得
 * 该成本，而不是把抹平/不计成本当成已知。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（概率忽视/零风险/概率权重/前景理论/双曲贴现/行为
 *     经济学/决策论/期望效用/风险溢价/统计学/教材/课堂/论文/科普/谬误/
 *     误区/EN probability neglect / zero-risk bias / probability weighting /
 *     prospect theory / behavioral economics / decision theory / expected
 *     utility / textbook / lecture / fallacy）——讨论概念本身是正确判别；
 *   · 证据/计算语境（计算得/算得/期望值/期望成本/标准差/置信区间/贝叶斯/
 *     后验/先验/联合概率/条件概率/独立事件/正态分布/拟合/蒙特卡洛/模拟
 *     N 次/EN expected value / confidence interval / standard deviation /
 *     Bayesian / posterior / prior / conditional probability / independent /
 *     normal distribution / Monte Carlo / simulation）——正式计算语境中
 *     概率被显式量化，不属于权重扭曲；
 *   · 推理否定/反向承认（不代表/不意味着/推不出/不能说明/不等于/并非/
 *     未必/不一定/很难说/取决于/还要看/而不是/而非/EN does not mean /
 *     not necessarily / cannot conclude / depends on / rather than）；
 *   · 对冲（可能/也许/或许/大概/似乎/好像/说不定/有待/EN maybe / perhaps /
 *     might / probably / seems / appears）；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① PROB 概率/风险量级表达（中文）─────────────────────────────────
// r161 教训自查：每条词去掉后缀（「概率」→「概率」已是裸名词；「几率」/
// 「风险」同为裸名词）仍须命中；显式数值形（1%/千分之）收裸数形，不收
// 「约/左右」修饰形（修饰形走对冲豁免）。
const PROB_ZH = [
  // 概率/风险裸名词
  /(?:概率|几率|可能性|风险|胜率|命中率|中奖率|事故率|故障率|发病率|失败率|死亡率|生还率|存活率|复发率|违约率|违约概率|违约风险|倒闭概率|破产概率|通过率|录取率|上线率|复购率|留存率|折损率)/,
  // 显式数值概率（中文百分比 + 千分/万分）
  /[一二两三四五六七八九十百\d]+\s*(?:%|％|个百分点|个百分点|‰|‱)/,
  /(?:百分之|千分之|万分之)\s*[一二两三四五六七八九十百\d\.]+(?:\s*[之到至降减低])?(?:\s*[一二两三四五六七八九十百\d\.]+)?/,
  /(?:概率|几率|风险|可能性)\s*(?:是|为|只有|仅|只有|高达|低至|约)?\s*[一二两三四五六七八九十百\d\.]+\s*(?:%|％|‰)/,
  // 量级形容词 × 概率（小概率/大概率/微乎其微/极高/极低）
  /(?:几乎|基本|压根|根本)\s*(?:不可能|不会|不能)\s*(?:发生|出现)?/,
  /(?:小|大|微|极|超|很|非常|高度|低|高)\s*(?:概率|几率|可能性|风险)/,
  /微乎其微|微不足道|极低|极高|近乎为零|接近零|几乎为零|等于零|趋近于零/,
  // 「非零即可能」的触发名词
  /不是零|非零|不等于零|未归零|不为零|只要有.{0,4}风险/,
];

// ─── 腿① PROB（英文）───────────────────────────────────────────────────
const PROB_EN = [
  /\b(?:probability|probabilities|chance|chances|odds|likelihood|risk|risks|hit\s+rate|success\s+rate|failure\s+rate|accident\s+rate|incidence|prevalence|mortality|survival\s+rate|default\s+rate|default\s+risk|bankruptcy\s+odds)\b/i,
  /\b\d+(?:\.\d+)?\s*(?:%|percent|percentage\s+points?)\b/i,
  /\b(?:a|one)\s+in\s+(?:\d+|a\s+(?:hundred|thousand|million))\b/i,
  /\b(?:tiny|minuscule|negligible|vanishingly\s+small|extremely\s+(?:low|high)|very\s+(?:low|high))\s+(?:probability|chance|risk|odds)\b/i,
  /\b(?:not|non[-]?)\s*zero\b/i,
  /\b(?:almost|nearly|virtually|practically|effectively)\s+(?:zero|impossible|certain)\b/i,
];

// ─── 腿② NEGLECT 概率权重扭曲（中文）───────────────────────────────────
// 三个子形：(a) 抹平形 (b) 零风险/不计成本形 (c) 二值化形
const NEGLECT_ZH = [
  // (a) 抹平形：把不同概率说成同等（必须与腿①共现才有意义）
  /(?:概率|几率|风险|可能性|胜率|事故率|发病率|失败率)\s*(?:差不多|基本上差不多|大抵|都)?\s*(?:一样|相同|相当|差不多|差不多大|一回事|半斤八两|不相上下|没什么区别|没啥区别|没有区别|差别不大|差异不大|可以忽略|忽略不计|等同)/,
  /(?:差不多|基本上|大体上|实质上|本质上)\s*(?:一样|相同|等同|一回事|没区别|没什么区别)/,
  // r311 补腿：两个不同量级的概率表述被说成同一回事（「几乎不可能和
  // 绝对不可能是一回事」「0.1% 和 1% 一回事」）。前一形要求出现抹平
  // 副词，不收两个量级表述直接并列等同的形态。
  /(?:几乎|基本|压根|根本)\s*(?:不可能|不会|不能)\s*(?:和|与|跟)\s*(?:绝对|肯定|必然|百分之百)\s*(?:不可能|不会|不能)\s*(?:是)?\s*(?:一回事|一样|等同|没区别|没什么区别)/,
  /(?:一样|相同|等同)\s*(?:的)?\s*(?:概率|几率|风险|概率水平|风险水平)/,
  // (b) 零风险/不计成本形
  /(?:只要|但凡|既然)\s*(?:不是|不等于|非)\s*(?:零|0)\s*(?:，|,)?\s*(?:就|那)?\s*(?:有|可能)/,
  /(?:为了|为)\s*(?:把|将|使)?\s*(?:风险|概率)\s*(?:从|由)\s*[一二两三四五六七八九十百\d\.]+\s*(?:%|％)\s*(?:降|减|低|下)\s*(?:到|至)\s*[一二两三四五六七八九十百\d\.]*\s*(?:%|％)/,
  /(?:花|付出|投入|牺牲)\s*(?:多少|再多|多大|任何)\s*(?:钱|代价|成本|资源|精力)\s*(?:都)?\s*(?:是)?\s*(?:值|值得|划算|应该|有必要)/,
  /(?:不计代价|不惜代价|不惜一切|不惜任何代价|倾家荡产|在所不惜|砸锅卖铁)/,
  /(?:彻底消除|完全消除|根除|清零|归零|杜绝)\s*(?:残余|剩余|最后)?\s*(?:风险|隐患|危险)/,
  // r311 补腿：「安全没有上限/安全无上限/必须花/这个钱要花」——把残余风险
  // 防控说成无成本约束的零风险溢价形（A4 族：百分之一降到千分之一也值得）。
  /(?:安全|防护|保障|保险)\s*(?:是)?\s*(?:没有|无|谈不上)\s*(?:上限|限度|止境|边界)/,
  /(?:这个|这|该|这个)\s*钱\s*(?:必须|一定|要|得|该)\s*花/,
  /(?:风险|隐患|危险)\s*(?:必须|要|得)\s*(?:彻底|完全|百分百|百分之百)\s*(?:消除|杜绝|清除|消灭)/,
  // (c) 二值化形：非零即一/可能=会
  /(?:有|存在|但凡有)\s*(?:一(?:丝|点|丁|丝丝)|丝毫)\s*(?:的)?\s*(?:风险|可能性|危险|隐患)/,
  /(?:风险|可能性)\s*(?:不是|既不)\s*(?:零|100%)\s*(?:就|那)\s*(?:等于|意味着|就是)\s*(?:一|100%|一定会|必然)/,
  /(?:小概率|低概率|概率再低)\s*(?:也|就)?\s*(?:等于|意味着|就是)\s*(?:很可能|大概率|一定会|必然|多半会)/,
  /(?:不是|非|既不)\s*(?:零概率|零风险|0概率)\s*(?:，|,)?\s*(?:就|那)?\s*(?:等于|意味着|就是)/,
  /(?:可能发生|会发生|有可能)\s*(?:就|那)?\s*(?:等于|意味着|就是)\s*(?:一定会|必然|多半|大概率)/,
  /(?:防|防范|预防|预案|准备)\s*(?:要|必须|得|应该)?\s*(?:按|按照|当)\s*(?:一定|必然|肯定会|百分之百)/,
];

// ─── 腿② NEGLECT（英文）───────────────────────────────────────────────
const NEGLECT_EN = [
  // (a) 抹平形
  /\b(?:probability|chance|chances|odds|risk|risks|likelihood)\s*(?:are|is)?\s*(?:basically|essentially|practically|virtually|roughly|about)\s+(?:the\s+same|equal|equivalent|identical|indistinguishable)\b/i,
  /\b(?:basically|essentially|practically|virtually|roughly|about)\s+the\s+same\s+(?:probability|chance|odds|risk|likelihood)\b/i,
  /\b(?:no|not\s+much|little|hardly\s+any)\s+(?:real\s+)?(?:difference|distinction)\s+(?:between|in)\s+(?:the\s+)?(?:probability|chances|odds|risk|likelihood)/i,
  /\b(?:same|equal)\s+(?:probability|odds|chance|risk)\b/i,
  /\b(?:treat|treating|consider|considering|regard|regarding)\s+(?:them\s+)?(?:as|the\s+same)\b/i,
  // (b) 零风险/不计成本形
  /\b(?:if|since|as\s+long\s+as)\s+(?:it'?s|the\s+risk\s+is)\s+not\s+(?:zero|impossible)\b/i,
  /\bnot\s+(?:zero|impossible)\s*,?\s*(?:so|therefore|thus)\s+(?:it\s+)?(?:could|might|can)\s+(?:still\s+)?happen/i,
  /\b(?:spend|pay|paying|spending|invest)\s+(?:any|whatever|no\s+matter\s+how\s+much)\s+(?:amount|money|cost|price)\b/i,
  /\b(?:at\s+any\s+cost|at\s+all\s+costs|whatever\s+the\s+cost|no\s+expense\s+spared|spare\s+no\s+(?:cost|expense)|worth\s+it\s+at\s+any\s+price)\b/i,
  /\bno\s+(?:cost|price|amount)\s+(?:is\s+)?(?:too\s+(?:high|great)|would\s+be\s+too\s+(?:high|great))\b/i,
  /\bno\s+(?:real\s+)?(?:difference|distinction)\s+between\s+(?:these\s+)?(?:two\s+)?(?:probabilit|odds|chances|risks)/i,
  /\b(?:eliminate|eradicat\w+|drive\s+down|reduce|bring)\s+(?:the\s+)?(?:risk|probability|chance)\s+(?:from|to)\s+\d/i,
  /\b(?:drive|bring|push|get)\s+(?:the\s+)?(?:risk|probability|chance)\s+to\s+zero\b/i,
  /\b(?:zero[- ]risk|risk[- ]free)\s+(?:is|must\s+be|should\s+be)\s+(?:the\s+)?(?:goal|target|requirement|standard)\b/i,
  /\b(?:completely|totally|entirely|100%)\s+(?:eliminate|eradicat\w+|eliminated|eradicated)\s+(?:the\s+)?(?:risk|threat|danger|hazard)\b/i,
  // (c) 二值化形
  /\b(?:any|even\s+a|the\s+slightest)\s+(?:non[- ]zero|nonzero)?\s*(?:risk|chance|probability)\s+(?:means|is\s+as\s+good\s+as|equals)\s+(?:certain|certainty|a\s+certainty)/i,
  /\b(?:small|tiny|low|minuscule)\s+(?:probability|chance|risk)\s+(?:is\s+)?(?:as\s+good\s+as|equals|means)\s+(?:likely|certain|a\s+certainty|probable)/i,
  /\b(?:possible|could\s+happen|might\s+happen)\s+(?:so|therefore|thus)\s+(?:we\s+)?(?:must|should|need\s+to)\s+(?:plan|prepare|treat\s+it)\s+(?:for\s+it\s+)?as\s+(?:if\s+)?(?:certain|inevitable|a\s+certainty)/i,
  /\b(?:plan|prepare|planning|prepare)\s+(?:for\s+it\s+)?as\s+(?:if\s+)?(?:it'?s|it\s+were)\s+(?:certain|inevitable|certain\s+to\s+happen)\b/i,
  /\b(?:risk|threat|danger)\s+(?:must|has\s+to|needs\s+to)\s+be\s+(?:treated\s+as\s+)?(?:certain|inevitable|guaranteed)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /概率忽视|零风险|概率权重|权重函数|前景理论|双曲贴现|行为经济学|决策论|决策理论|期望效用|风险溢价|风险厌恶|确定性效应|阿莱悖论|埃尔斯伯格|概率失真|权重扭曲/,
  /统计学|教科书|课本|教材|课堂|教案|论文|科普|谬误|误区|陷阱|概念|定义|定理/,
];
const EXEMPT_META_EN = [
  /\b(?:probability\s+neglect|zero[- ]risk\s+bias|probability\s+weighting|weighting\s+function|prospect\s+theory|hyperbolic\s+discounting|behavioral\s+economics|decision\s+theory|expected\s+utility|risk\s+premium|risk\s+aversion|certainty\s+effect|Allais\s+paradox|Ellsberg|probability\s+distortion|statistics|textbook|lecture|fallacy)\b/i,
];

// ─── 豁免二：证据/计算语境（概率被显式量化）────────────────────────────
const EXEMPT_EVID_ZH = [
  /计算得|算得|算出来|求出来|推导得|可算|估算得|估得|统计(?:得|出|显示|表明|结果)/,
  /期望值|期望成本|期望收益|期望效用|标准差|方差|置信区间|置信水平|贝叶斯|后验|先验|联合概率|条件概率|边缘概率|独立事件|正态分布|二项分布|泊松分布|拟合|蒙特卡洛|随机模拟|重复实验|大数定律/,
  /实测|实验数据|样本数据|历史数据|历史频率|回测|回归分析/,
];
const EXEMPT_EVID_EN = [
  /\b(?:calculat\w+|comput\w+|deriv\w+|estim\w+|work(?:s|ed)?\s+out|figur\w+)\b[^.!?]{0,30}\b(?:probability|chance|odds|risk|expected)/i,
  /\b(?:expected\s+(?:value|cost|return|utility)|standard\s+deviation|variance|confidence\s+interval|Bayesian|posterior|prior|joint\s+probability|conditional\s+probability|independent\s+(?:events?|trials?)|normal\s+distribution|binomial|Poisson|Monte\s+Carlo|simulation|law\s+of\s+large\s+numbers)\b/i,
  /\b(?:empirical|measured|historical\s+(?:data|frequency)|observed\s+(?:data|rate)|back[- ]?test\w+)\b/i,
];

// ─── 豁免三：推理否定 / 反向承认 ────────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不代表|不意味着|并不能说明|不能说明|推不出|不足以|证明不了|无法证明|不等于|并非|并不是|而不是|而非/,
  /未必|不一定|不见得|很难说|说不清|难以确定|无法确定|有待|待验证|存疑|站不住/,
  /取决于|还要看|视情况|具体分析|因人而异|要分情况/,
  /不能等同|不可同日而语|不可相提并论|差别显著|差异显著|差距明显|悬殊/,
];
const EXEMPT_NEG_EN = [
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|does\s+not\s+imply|doesn'?t\s+imply|cannot\s+conclude|can'?t\s+conclude|does\s+not\s+prove|not\s+necessarily|is\s+not\s+the\s+same\s+as|not\s+equivalent|far\s+from|nowhere\s+near)\b/i,
  /\b(?:uncertain|unclear|remains\s+to\s+be\s+seen|depends\s+on|case[- ]by[- ]case)\b/i,
];

// ─── 豁免四：对冲 ──────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|约|左右|上下/,
];
// r311 修正：「很可能/大概率」是概率量级断言（二值化形的右端），不是语气
// 对冲。对冲豁免不得拦这类断言——用负向前查把「很可能」从豁免中剔除，
// 避免「只要不是零概率，就等于很可能」被误判为对冲而漏判。
const EXEMPT_HEDGE_ZH_EFFECTIVE = [
  // r311 修正：「很可能/大概率」是概率量级断言（二值化形的右端），不是语气
  // 对冲。对冲豁免不得拦这类断言——用负向前查把「很可能」从豁免中剔除，
  // 避免「只要不是零概率，就等于很可能」被误判为对冲而漏判。
  // r312 补修：同一形「几乎不可能/基本不可能」里的「不可能」是量级否定，
  // 不是语气对冲（负向前查排除「不」「几乎」「基本」「压根」「根本」），
  // 否则腿①的「几乎不可能」形会把整句误判为对冲而漏判。
  /(?<![很不几基本压根根])(?<![几乎|基本|压根|根本]不可能)可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|约|左右|上下/,
  // r312 补修：「几乎」单独出现且不紧跟量级断言词时才算语气对冲。
  /几乎(?!不可能|不会|不能|为零|等于零|必然|一定|确定)/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|i\s+suspect|could\s+be|roughly|approximately|about)\b/i,
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
 * 双腿 + 邻近窗：存在 p∈PROB, n∈NEGLECT 使 |p-n| ≤ WIN。
 * 窗口取 80（ZH）/ 200（EN）：抹平形通常同句（「X 和 Y 的概率差不多」），
 * 零风险/二值化形可跨分句（「风险只有 1%，但只要不是零就必须按一定会
 * 发生来防」），宽松窗由腿②的显式权重扭曲形兜底（抹平词/不计成本词/
 * 二值化词必须是显式断言）。
 */
function coLocated(prob, negl, win) {
  for (const p of prob) {
    for (const n of negl) {
      if (Math.abs(p - n) <= win) return true;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number,
 *            subfamily:string}}
 */
function checkProbabilityNeglect(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0, subfamily: '' };
  const R = inject || {};

  // 全局豁免：概念教学 / 证据计算 / 推理否定 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0, subfamily: '' };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0, subfamily: '' };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0, subfamily: '' };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH_EFFECTIVE, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0, subfamily: '' };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0, subfamily: '' };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const prob = positions(R.PROB_ZH || PROB_ZH, text).concat(positions(R.PROB_EN || PROB_EN, text));
  const negl = positions(R.NEGLECT_ZH || NEGLECT_ZH, text).concat(positions(R.NEGLECT_EN || NEGLECT_EN, text));
  if (prob.length === 0 || negl.length === 0) return { hit: false, score: 0, detail: '', count: 0, subfamily: '' };

  const win = isZh ? 80 : 200;
  if (!coLocated(prob, negl, win)) return { hit: false, score: 0, detail: '', count: 0, subfamily: '' };

  // 子族识别（用于 details 标注，便于调用方按型修正）
  let subfamily = '';
  if (/(?:差不多|基本上差不多|一回事|半斤八两|不相上下|没什么区别|没啥区别|没有区别|差别不大|差异不大|可以忽略|忽略不计|相同|相当)/.test(text) || /\b(?:basically|essentially|practically|virtually|roughly|about)\s+the\s+same\b/i.test(text)) {
    subfamily = 'flatten';
  } else if (/(?:不计代价|不惜代价|不惜一切|倾家荡产|在所不惜|砸锅卖铁|花多少钱|清零|归零|彻底消除|完全消除|根除)/.test(text) || /\b(?:at\s+any\s+cost|spare\s+no|worth\s+it\s+at\s+any\s+price|drive\s+the\s+risk\s+to\s+zero|zero[- ]risk)\b/i.test(text)) {
    subfamily = 'zero_risk';
  } else if (/(?:只要有|但凡有|有一丝|有一点|非零|不等于零|按一定会|当成一定)/.test(text) || /\b(?:not\s+zero|non[- ]?zero|as\s+good\s+as\s+certain|plan\s+for\s+it\s+as\s+if)\b/i.test(text)) {
    subfamily = 'binarize';
  }

  // 计分：双腿共现基础 0.62；抹平形（显式等同词）+0.08；零风险形（不计
  // 成本/清零）+0.10；二值化形（非零即一）+0.05；封顶 0.85（与 econ 族
  // 聚合桥口径一致，保证 verify 而非 rewrite）。
  let score = 0.62;
  if (subfamily === 'flatten') score += 0.08;
  else if (subfamily === 'zero_risk') score += 0.10;
  else if (subfamily === 'binarize') score += 0.05;
  if (score > 0.85) score = 0.85;

  const detail = isZh
    ? `概率忽视(${subfamily || 'weighting'})：概率权重被系统性扭曲，不同量级概率被抹平或残余风险被不计成本对待(zh)`
    : `probability neglect (${subfamily || 'weighting'}): probability weights distorted, distinct probabilities flattened or residual risk treated at any cost(en)`;

  return { hit: true, score, count: 1, detail, subfamily };
}

module.exports = {
  checkProbabilityNeglect,
  __internals: () => ({
    PROB_ZH, PROB_EN, NEGLECT_ZH, NEGLECT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_ZH_EFFECTIVE, EXEMPT_HEDGE_EN,
  }),
};
