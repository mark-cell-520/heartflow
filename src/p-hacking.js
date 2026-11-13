/**
 * src/p-hacking.js — 「多重比较/数据挖掘」检测器
 * （ provisional 第 220 个判别维度，r232 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r232-dimension-agent4.md
 * §五。编号 provisional 的原因同 r228-r231：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231) 七个
 * 已起草未接线维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序
 * 重排）
 *
 * [r232 立项] 零命中探针 coordination/agent4/probes/r232-zerohit-probe.js
 * （v6.8.145 实测）：p_hacking 族 14 句攻击（中 10 + 英 4）**14 句
 * 完全穿引擎**（pass、findings 为空，无任何维度承重）；同探针另测
 * 相对变化脱离基线率族 6/15 穿透（9 句被 unsupported_claim 等代拦）、
 * 小样本比例族 2/3 穿透（已被 hasty_generalization 族部分覆盖）——
 * 两族落选，本族为唯一真零命中候选。良性 12 条中 7 条 pass、5 条
 * gate 层默认 verify 且 dims 为空（数字/百分比触发的默认需验证，
 * 非维度误伤）。src/ 下没有任何维度判「大量尝试 × 只报告赢家」
 * 这一结构。
 *
 * 外部来源：空返（近空返），按既有形态自建。r232 海外扫描（原始证据
 * coordination/agent4/scout/20261106-144659、144813、144814）：
 * arXiv 三次非引号查询均 parse-fail（API 将空格查询拆成 OR，返回
 * 最新条目无一相关）；GitHub "p-hacking multiple comparisons"
 * total_count=1（elliottower/multiple-comparisons，0★，自述为
 * "A Satirical-but-Theoretically-Grounded Treatment…" 讽刺作品，
 * 非可集成的纯规则文本检测模块），"data dredging garden of forking
 * paths" total_count=0，"relative risk without base rate" 0；
 * Semantic Scholar 限流返错。无可集成的纯规则实现。判据为心虫自有
 * 纯规则实现（家族定义取自统计学标准描述：p-hacking / data
 * dredging / garden of forking paths——在同一数据集上尝试大量
 * 分组、口径或规格，只报告偶然显著的那个；Simmons/Nelson/
 * Simonsohn 2011 与 Gelman/Loken 的经典表述只提供概念背景，
 * 心虫只判表述形态，不判事实真假）。
 *
 * 辨别的族：多重比较/数据挖掘（p-hacking / data dredging /
 * HARKing 的搜索侧）——**主动做了大量尝试**，却**只把偶然显著
 * 的那个**当证据下结论：试了20种分组终于显著、测了30组参数有
 * 一组 p<0.05、换了5种方法其中一种成立、挑出那个大涨的城市：
 *   我们试了20种用户分组，终于发现95后用户的付费率显著更高。
 *   测试了30个参数组合，有一组p值终于小于0.05，说明策略有效。
 *   调研了40个城市，挑出那个销售额大涨的城市作为证据。
 *   反复调整实验条件，第12次运行终于出现了我们预期的效应。
 *   We tested twenty subgroups and finally found one with a
 *   significant effect.
 *   We reran the experiment twelve times until the expected
 *   effect appeared.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：统计显著性的
 * 前提是**搜索空间被先于数据固定**；把「试了 N 次其中一次显著」
 * 当作证据，等于用事后搜索冒充事前检验——N 越大，假阳性越准
 * 必然出现，而这个表述形态把巧合包装成了发现。它直接污染循证
 * 决策（医疗、政策、增长实验、学术结论）。与正当的探索性分析
 * 有明确界线：声明预注册终点、声明多重比较校正、或声明独立
 * 复现，都是把搜索空间摊开来讲——那恰恰是本族豁免的。
 *
 * 与既有维度的边界（r232 归因）：
 *   · cherry_picking（第 180 维）管**从既有证据里挑有利的**
 *     （we only cited the studies that supported our hypothesis）
 *     ——其判据腿是「选择性引用」动词族，无「多次尝试+数量」
 *     腿；本族判**搜索/迭代过程本身**（试了N种/换了N次/第N次
 *     运行）。实测 cherry_picking 族样本无一带数量尝试腿，
 *     互不触发。
 *   · clustering_illusion（第 171 维）管**在噪声里被动看出
 *     规律**（随机数据里也有模式）；本族是**主动搜索后只报告
 *     赢家**，一被动一主动，lexical 判据无交叠。
 *   · hasty_generalization / anecdotal 管小样本泛化（r232
 *     探针 C 族实测 2/3 已被覆盖）；本族不要求样本小，判的是
 *     「尝试次数 × 选择性报告」结构。
 *   · base_rate_neglect（第 169 维）管阳性信号×高置信结论，
 *     无数值尝试结构；ad_nauseam 管重复论证，无尝试数量腿。
 *
 * 判据（双腿共现，缺一不判）：
 *   ① 腿① SEARCH 大量尝试/反复搜索：试/测试/尝试/换/调整/
 *     扫描/切/跑/运行/分析/调研/比较/翻/试遍/穷尽/第N次 +
 *     数量词（数字/几/十几/几十/上百/各种/全部/不同）× 单位
 *     （种/次/组/刀/轮/遍/类；EN tested/tried/reran/adjusted/
 *     scanned/sliced/analyzed + twenty/thirty/dozens/hundreds
 *     × subgroups/combinations/methods/times/runs…）；
 *   ② 腿② WINNER 只报告赢家×显著性：挑选标记（终于/才发现/
 *     恰好/凑巧/其中一种/有一种/挑出/找到/呈现出；EN finally/
 *     one of/one set/until…appeared）× 显著性（显著/p值/
 *     p<0.05/强相关/大涨/效应/转化率/证明/有效/作为证据；
 *     EN significant/p-value/correlated/jump/proves）。
 *   双腿须落在近距离窗内（ZH 50 字 / EN 160 字符）。
 *
 * 为什么取 VERIFY 级：探索性分析本身是正当科研步骤；本族拦的
 * 是**把事后搜索当证据却不声明搜索空间**的表述。verify 的
 * 语义是「这段文本只报告了赢家，先声明预设终点、多重比较
 * 校正或独立复现再下结论」。
 *
 * 明确不判的（豁免）：
 *   · 预注册/预设终点（预注册/预设/主要终点/primary endpoint/
 *     prespecified）——搜索空间先于数据固定，正是本族的解药；
 *   · 多重比较校正（校正/Bonferroni/FDR/false discovery/
 *     corrected for multiple comparisons）——已把搜索空间
 *     计入推断；
 *   · 独立重复验证（重复验证/复现/独立样本/元分析/replicated
 *     in an independent sample）——结论不依赖单次偶然显著；
 *   · 纪律性否定（不能/避免/禁止 + 事后挑选/数据挖掘/p-hacking；
 *     EN no cherry-picking/avoid data dredging）——指出本族
 *     错误正是判别动作本身；
 *   · 元话语概念引述（p-hacking 是指…/把「试了20种终于显著」
 *     当成证据是…的典型表现）——引用本族名称的教学/批评句；
 *   · 显著性否定式（没有显著/未发现相关/毫无规律/no significant
 *     difference）——腿②的显著性命中若带否定前缀则该命中作废
 *     （在腿②匹配时逐条剔除，非全局豁免）。
 *
 * [r317 升级] 选择性报告动作新措辞家族（真升级②）：存量 WINNER 只收
 * 「终于/其中一种/挑出」式偶然性标记与 EN finally/until/one of，不收
 * **选择性报告动作本身**——「跑了三十次模拟，只报告了成功的那次」
 * 「只把p值小的那组写进了论文」「其余的略过不提」（EN: we ran fifty
 * trials and only reported the significant one / out of a hundred
 * slices, only the winning segment was written up）类攻击 r317 探针
 * 3/5 连 gate 层 pass（余 2 条由 researcher_degrees_of_freedom 第
 * 213 维代拦——该维度管「分析流程被结果反向决定」，本族管「大量尝试
 * × 选择性报告」，两者共存不互斥）；SEARCH_EN 名词表补 slices/
 * buckets/windows/variants 与 ran N trials 形，SIGNIF 补「成功/符合
 * 预期/winning/positive results」达标标记。良性 5/5 零误伤
 * （scripts/round-317/probe-candidates.js）。实现为平行常量
 * SEARCH_EN3/WINNER_ZH3/WINNER_EN3/SIGNIF_ZH3/SIGNIF_EN3 +
 * findSignatures concat，存量族注入语义不变。src/index.js 零改动。
 */
'use strict';

// ─── 腿① 大量尝试/反复搜索（中文）────────────────────────────────
// 三类：①搜索动词 + 数量词 + 单位；②第N次运行/反复调整类无数量
// 词的强迭代形式；③「N种X中」框架（在几十种配色方案中）。
// 注意：单位表不收裸「个」（防「2个百分点」类统计表述误触），
// 「个」只在与尝试名词（变量/城市/参数…）复合时入表。
const SEARCH_ZH = [
  // ①-a1 动词 + 裸数量词 + 单位（种/次/组/刀/轮/遍/回/类）
  /(?:试|测试|尝试|试遍|换了|换过|调整|反复调整|扫描|切|跑|运行|跑了|分析|调研|研究|比较|对比|翻|穷尽|重复|复查|回溯)[^。，！？；]{0,6}(?:\d+|一|两|几|数|数十|几十|十几|上百|成百|许许多多|众多|若干)[种个组次刀轮遍回类]/,
  // ①-a2 动词 + 自带单位义的集合量词（各种/不同/多样/多种…，无须再跟单位；
  // r232 构造期修复：A10「试遍了各种统计口径」原写法要求量词后紧跟单位，
  // 「各种统计口径」的量词「种」在词首，导致漏判）
  /(?:试|测试|尝试|试遍|换了|换过|调整|反复调整|扫描|切|跑|运行|跑了|分析|调研|研究|比较|对比|翻|穷尽|重复|复查|回溯)[^。，！？；]{0,4}(?:各种|不同|多样|多种|各个|全部|所有)/,
  // ①-b 第N次运行/实验（无显式动词的强迭代形式）
  /第\s*\d+\s*[次轮个]/,
  // ①-c 反复/逐一/挨个/轮番 + 尝试调整（无数量词）
  /(?:反复|反复地|逐一|挨个|轮番|不断|一次又一次|多次)(?:地)?(?:尝试|试|调整|调试|跑|运行|扫描|比较|切换|更换|改动)/,
  // ①-d 「N种X中/里」框架（在几十种配色方案中）
  /(?:\d+|一|两|几|数|数十|几十|上百|成百|许许多多|众多|若干|各种|不同|多样)[种个组类][^。，！？；]{0,10}(?:中|里|之内|当中)/,
];

// ─── [r317] 腿① 新搜索量词族（中文，平行常量，存量注入语义不变）────
// 存量 SEARCH_ZH ①-a 量化词只收 一二两几数数十几十十几/上百/成百/
// 许许多多/众多/若干，不收**中文数字**（三十/五十/二十五）与「很多/
// 好些」——「跑了三十次模拟」「测了很多组参数」式穿透（r317 探针 D0/D2）。
const SEARCH_ZH2 = [
  // ①-a3 动词 + 中文数字 + 量词（跑了三十次/试了五十种/翻了二十五遍）
  /(?:试|测试|尝试|试遍|换了|换过|调整|反复调整|扫描|切|跑|运行|跑了|分析|调研|研究|比较|对比|翻|穷尽|重复|复查|回溯|试了|试过|测|测了|做了|做过)[^。，！？；\n]{0,4}[一二两三四五六七八九十百千万]+[种个组次刀轮遍回类]/,
  // ①-b2 动词 + 很多/好些/大量 + 量词（测了很多组参数）
  /(?:试|测试|尝试|试遍|换了|换过|调整|反复调整|扫描|切|跑|运行|跑了|分析|调研|研究|比较|对比|翻|穷尽|重复|复查|回溯|试了|试过|测|测了|做了|做过)[^。，！？；\n]{0,4}(?:很多|好些|大量|好些个|许许多多)[种个组次刀轮遍回类]/,
];

// ─── 腿① 大量尝试/反复搜索（英文）────────────────────────────────
// 数量词（数字/英文数词/约数词）——①②③ 共用
const EN_NUM = '(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|dozens|hundreds|scores|numerous|several|various|many|different)';
const SEARCH_EN = [
  // ①-a 动词 + 数量 + 单位名词
  new RegExp('\\b(?:tested|testing|tried|trying|ran|reran|re-?ran|run|adjusted|adjusting|scanned|scanning|sliced|slicing|compared|comparing|analyzed|analyzing|analysed|examined|explored|searched|repeated|iterated|tweaked|tuning)\\s+(?:\\w+\\s+){0,2}' + EN_NUM + '\\s+(?:\\w+\\s+){0,2}(?:subgroups?|groups?|combinations?|specifications?|variables?|methods?|ways?|models?|parameters?|segments?|buckets?|slices?|dimensions?|features?|times|runs|iterations|attempts|cities|cohorts?)\\b', 'i'),
  // ①-b out of N nouns 框架（Out of forty cities surveyed）
  new RegExp('\\bout\\s+of\\s+' + EN_NUM + '\\s+(?:\\w+\\s+){0,2}(?:cities|groups|subgroups|cohorts|samples|segments|variables|methods|models)\\b', 'i'),
  // ①-c 数量名词 + 过去分词后置（forty cities surveyed）
  new RegExp('\\b' + EN_NUM + '\\s+(?:\\w+\\s+){0,2}(?:cities|groups|subgroups|cohorts|samples|segments)\\s+(?:surveyed|tested|examined|analyzed|checked|reviewed|compared)\\b', 'i'),
];

// ─── [r317] 腿① 新搜索名词族（英文，平行常量，存量注入语义不变）────
// 存量 SEARCH_EN ①-b/①-c 名词表不收 slices/buckets/cuts/windows/variants，
// ①-a 不收 trials/runs/simulations/experiments——「Out of a hundred
// slices」「We ran fifty trials」式穿透（r317 探针 D3/D4）。
const SEARCH_EN3 = [
  // ①-b2 out of [a/an/the] N + 切片/桶/窗口/变体名词（存量 ①-b 不收冠词形
  //   且名词表不收 slices/buckets/windows/variants）
  new RegExp('\\bout\\s+of\\s+(?:a\\s+|an\\s+|the\\s+)?' + EN_NUM + '\\s+(?:\\w+\\s+){0,2}(?:slices|buckets|cuts|windows|variants|specifications|configurations|setups|scenarios|filters|thresholds|periods|ranges|seeds)\\b', 'i'),
  // ①-c2 数量名词 + 切片/桶/窗口 + 过去分词
  new RegExp('\\b' + EN_NUM + '\\s+(?:\\w+\\s+){0,2}(?:slices|buckets|cuts|windows|variants|scenarios|thresholds|trials|runs)\\s+(?:surveyed|tested|examined|analyzed|checked|reviewed|compared|tried|run)\\b', 'i'),
  // ①-a2 动词 + 数量 + trials/runs/simulations/experiments（存量 ①-a 名词表不收）
  new RegExp('\\b(?:ran|run|reran|re-?ran|tested|testing|tried|trying|repeated|iterated|simulated)\\s+(?:\\w+\\s+){0,2}' + EN_NUM + '\\s+(?:\\w+\\s+){0,2}(?:trials?|runs?|iterations|attempts|replications|simulations?|experiments?|seeds?)\\b', 'i'),
];

// ─── 腿② 只报告赢家（中文挑选标记）────────────────────────────────
const WINNER_ZH = [
  /终于/, /才发现/, /方才发现/, /恰好/, /凑巧/,
  /其中一(?:种|个|组|类|次|回)/, /有一(?:种|个|组|类|批|次|回)/,
  /挑出/, /挑到/, /逮到/, /锁定/,
  /找到那/, /找到/, /呈现出/, /显示出/, /出现/, /浮现/,
];

// ─── [r317] 腿② 新赢家标记族（中文，平行常量，存量注入语义不变）────
// 存量 WINNER_ZH 只收「终于/其中一种/挑出」式偶然性标记，不收**选择性
// 报告动作**本身——「跑了三十次模拟，只报告了成功的那次」「只把p值小的
// 那组写进了论文」「其余的略过不提」式穿透（r317 探针 D 族 3/5 连 gate
// 层 pass；D1/D2 由 researcher_degrees_of_freedom（第213维）代拦——
// 该维度管「分析流程被结果反向决定」，本族管「大量尝试×选择性报告」，
// 边界见模块头注释）。
const WINNER_ZH3 = [
  // 只 + （至多 8 字宾语）+ 报告类动词
  /只[^。，！？；\n]{0,8}(?:报告|汇报|展示|呈现|列出|贴出|写入|写进|提|公布|发布|宣传|留下|保留|提交|上交|发表)/,
  // 唯独/仅仅/单单 + 选取
  /(?:唯独|仅仅|单单|只是)[^。，！？；\n]{0,10}(?:写|报|提|列|留|选|用|拿)/,
  // 其余/其他 + 略过不提类
  /(?:其余|其他|剩下)(?:的)?(?:都|全)?(?:略过|不提|不说|忽略|舍弃|丢弃|排除|剔除|略去)/,
  /(?:略过|不提|不说|忽略|舍弃|排除|剔除|略去)[^。，！？；\n]{0,6}(?:其余|其他|剩下)/,
];

// ─── 腿② 显著性/证明标记（中文）──────────────────────────────────
const SIGNIF_ZH = [
  /显著/, /p\s*值/, /p\s*<\s*0?\.\d+/i, /p\s*≤\s*0?\.\d+/i,
  /强相关/, /相关性/, /相关的/, /大涨/, /大降/, /暴增/, /暴跌/,
  /效应/, /转化率/, /规律/, /模式/,
  /证明/, /有效/, /成立/, /作为证据/, /支持结论/, /支撑结论/,
  /明显(?:高|低|好|强|多|少)/, /更高/, /更低/,
];

// ─── [r317] 腿② 新显著性标记族（中文，平行常量，存量注入语义不变）────
// 存量 SIGNIF_ZH 不收「成功/符合预期/达到预期」式结果达标标记——
// 「只报告了成功的那次」式穿透（r317 探针 D0）。腿①的大量尝试结构
// 保证「活动圆满成功」类单一陈述不命中。
const SIGNIF_ZH3 = [
  /成功/,
  /(?:符合|达到|超出)预期/,
  /如愿/,
  /(?:达到|达成)预设/,
  /跑通|跑出来了/,
];

// ─── 腿② 只报告赢家（英文挑选标记）────────────────────────────────
const WINNER_EN = [
  /\bfinally\b/i, /\beventually\b/i, /\bat\s+last\b/i,
  /\buntil\b/i,
  /\bone\s+of\s+(?:the|them|these|those)\b/i,
  /\bone\s+(?:set|group|subset|segment|city|run|model|specification|combination)\b/i,
  /\bone\s+(?:showed|had|was)\b/i,
  /\bturned\s+up\b/i, /\bsurfaced\b/i,
  /\bsingled\s+out\b/i, /\bpicked\s+out\b/i,
  /\bwe\s+found\s+(?:one|a)\b/i, /\bfound\s+one\b/i,
];

// ─── [r317] 腿② 新赢家标记族（英文，平行常量，存量注入语义不变）────
// 存量 WINNER_EN 不收「only reported / only the winning / the rest
// were omitted」式选择性报告动作——「We ran fifty trials and only
// reported the significant one」「Out of a hundred slices, only the
// winning segment was written up」式穿透（r317 探针 D3/D4）。
const WINNER_EN3 = [
  // only + 报告类动词
  /\bonly\s+(?:reported|reports|reporting|presented|presenting|showed|showing|included|wrote|wrote up|kept|published|disclosed|highlighted|mentioned)\b/i,
  // only the winning/significant/successful
  /\bonly\s+(?:the\s+)?(?:winning|significant|successful|positive|best[- ]performing)\b/i,
  // 其余被略过（主动+被动两向）
  /\b(?:the\s+)?(?:rest|remaining|others?)\s+(?:were|was)?\s*(?:left out|omitted|discarded|dropped|ignored|excluded|shelved)\b/i,
  /\b(?:left out|omitted|discarded|dropped|excluded)\s+(?:the\s+)?(?:rest|remaining|others?|failures|non[- ]?significant)\b/i,
];

// ─── 腿② 显著性/证明标记（英文）──────────────────────────────────
const SIGNIF_EN = [
  /\bsignifican\w+/i, /\bp\s*<\s*0?\.\d+/i, /\bp-?value\b/i,
  /\bcorrelat\w+/i, /\beffect\b/i, /\bspike\b/i, /\bjump\b/i,
  /\bproof\b/i, /\bproves\b/i, /\beffective\b/i, /\bvalid\b/i,
  /\bhigher\b/i, /\blower\b/i, /\bdifference\b/i,
];

// ─── [r317] 腿② 新显著性标记族（英文，平行常量，存量注入语义不变）────
// 存量 SIGNIF_EN 不收「winning / positive results / succeeded」式结果
// 达标标记——「only the winning segment was written up」「only reported
// the positive results」式穿透（r317 探针 D4/D1-EN）。
const SIGNIF_EN3 = [
  /\bwinning\b/i,
  /\bpositive (?:results?|findings?|outcomes?)\b/i,
  /\bsucceeded\b/i,
];

// 双腿距离窗
const WIN_PAIR_ZH = 50;
const WIN_PAIR_EN = 160;

// ─── 豁免一：预注册/预设终点（搜索空间先于数据固定）────────────────
const EXEMPT_PREREG_ZH = [
  /预注册/, /预登记/, /事前注册/,
  /预设(?:的)?(?:主要)?(?:终点|假设|标准|口径|分组)/,
  /事先(?:指定|约定|确定)(?:的)?(?:主要)?(?:终点|假设|标准)/,
  /主要终点/, /唯一(?:的)?终点/, /只报告预设/,
];
const EXEMPT_PREREG_EN = [
  /\bpre-?registered\b/i, /\bpreregist\w*/i, /\bprespecified\b/i,
  /\bprimary\s+endpoint\b/i, /\bspecified\s+in\s+advance\b/i,
  /\bonly\s+the\s+prespecified\b/i,
];

// ─── 豁免二：多重比较校正（搜索空间已计入推断）────────────────────
const EXEMPT_CORRECTION_ZH = [
  /校正/, /矫正/,
  /多重比较/, /多次比较/, /多重检验/,
  /Bonferroni/, /bonferroni/, /FDR/, /False\s*Discovery/i,
  /Holm/, /Šidák|Sidak/, /错误发现率/,
];
const EXEMPT_CORRECTION_EN = [
  /\bcorrected\s+for\s+(?:multiple|multitude)\s+comparisons?\b/i,
  /\badjusted\s+for\s+multiple\b/i,
  /\bmultiple\s+comparisons?\s+correction\b/i,
  /\bBonferroni\b/i, /\bFDR\b/i, /\bfalse\s+discovery\s+rate\b/i,
  /\bsignificance\s+(?:level|threshold)\s+(?:was\s+)?(?:adjusted|tightened)\b/i,
];

// ─── 豁免三：独立重复验证（结论不依赖单次偶然显著）────────────────
const EXEMPT_REPLICATION_ZH = [
  /重复验证/, /重复实验/, /可复现/, /复现了?/,
  /独立样本/, /独立数据/, /独立重复/, /元分析/,
];
const EXEMPT_REPLICATION_EN = [
  /\breplicat\w+/i, /\breproduc\w+/i,
  /\bindependent\s+(?:sample|dataset|cohort|replication)\b/i,
  /\bmeta-?analysis\b/i, /\bheld\s+up\b/i,
];

// ─── 豁免四：纪律性否定（指出本族错误正是判别动作本身）─────────────
const EXEMPT_DISAVOW_ZH = [
  /(?:不能|不应|不应该|不可|禁止|避免|拒绝|切忌|不得)[^。，！？；]{0,12}(?:事后挑选|事后解释|事后分组|数据挖掘|凑数据|挑选数据|只报告赢家|p-?hacking)/i,
  /(?:事后挑选|数据挖掘|p-?hacking)(?:是|属于)[^。，！？；]{0,8}(?:错误|问题|大忌|禁止|不可取)/,
];
const EXEMPT_DISAVOW_EN = [
  /\bno\s+(?:more\s+)?(?:cherry-?picking|data\s+dredging|p-?hacking|fishing)\b/i,
  /\b(?:avoid|stop|never)\s+(?:cherry-?picking|data\s+dredging|p-?hacking|fishing)\b/i,
  /\b(?:cherry-?picking|data\s+dredging|p-?hacking)\s+is\s+(?:a\s+)?(?:problem|wrong|invalid|misleading)\b/i,
];

// ─── 豁免五：元话语概念引述（引用本族名称的教学/批评句）────────────
const EXEMPT_META_ZH = [
  /(?:p-?hacking|P-?hacking|数据挖掘|事后挑选|多重比较)[^。，！？；]{0,8}(?:是指|指的是|叫做|称为|的定义|什么意思)/,
  /把[『「"“][^』」”"]{0,40}[』」”"][^。，！？；]{0,12}(?:当成|当作|视为|说成)[^。，！？；]{0,8}(?:证据|结论|发现|真理)/,
];
const EXEMPT_META_EN = [
  /\b(?:p-?hacking|data\s+dredging)\s+(?:is|refers\s+to|means)\b/i,
  /\bcalling\s+["“][^"”]{0,50}["”]\s+(?:evidence|proof)\b/i,
];

// ─── 腿②的否定前缀（该命中作废，非全局豁免）───────────────────────
// 「没有显著相关」「未发现效应」类。注意否定词可与挑选标记叠字：
// 「没有一种」= 没 + 有一种（否定词的末字被标记吃掉），故末字裸判
// （没/无/未/别/莫/勿）必须入表，否则该攻击变良性句漏防（r232 B11
// 实测教训：「试了20种分组，没有一种显示显著相关」曾被误判）。
const NEG_BEFORE_ZH = /(?:没有|毫无|未有|未|并未|并没|并非|不曾|不能|谈不上|称不上|没|无|别|莫|勿)\s*$/;
// EN：no/not/never… + 至多两词；另收 none→「n」裸尾（none of the 的
// 否定词首字母被 one of the 标记吃掉）
const NEG_BEFORE_EN = /\b(?:no|not|never|without|neither|nor|failed|lack|absence|didn'?t|did\s+not)\s+(?:\w+\s+){0,2}$/i;
const NEG_BEFORE_EN2 = /n$/;

// 工具 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

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

/**
 * 双腿配对：任一大数量尝试 × 任一（挑选标记 × 显著性）对，
 * 且该显著性命中不带否定前缀；两腿落在窗内即成一签名。
 */
function findSignatures(text, R) {
  // [r317] SEARCH_EN3/WINNER_ZH3/WINNER_EN3/SIGNIF_ZH3/SIGNIF_EN3 平行
  // 常量 concat：注入某一族为空数组只关该族，存量族不受影响（同 r311 范式）。
  const searchZh = (R.SEARCH_ZH || SEARCH_ZH).concat(R.SEARCH_ZH2 || SEARCH_ZH2);
  const searchEn = (R.SEARCH_EN || SEARCH_EN).concat(R.SEARCH_EN3 || SEARCH_EN3);
  const winZh = (R.WINNER_ZH || WINNER_ZH).concat(R.WINNER_ZH3 || WINNER_ZH3);
  const winEn = (R.WINNER_EN || WINNER_EN).concat(R.WINNER_EN3 || WINNER_EN3);
  const sigZh = (R.SIGNIF_ZH || SIGNIF_ZH).concat(R.SIGNIF_ZH3 || SIGNIF_ZH3);
  const sigEn = (R.SIGNIF_EN || SIGNIF_EN).concat(R.SIGNIF_EN3 || SIGNIF_EN3);

  const sigs = [];
  const winPairZh = R.WIN_PAIR_ZH != null ? R.WIN_PAIR_ZH : WIN_PAIR_ZH;
  const winPairEn = R.WIN_PAIR_EN != null ? R.WIN_PAIR_EN : WIN_PAIR_EN;
  const langs = [
    { s: searchZh, w: winZh, g: sigZh, win: winPairZh, lang: 'zh' },
    { s: searchEn, w: winEn, g: sigEn, win: winPairEn, lang: 'en' },
  ];
  for (const { s, w, g, win, lang } of langs) {
    // 腿①全部命中
    const sm = [];
    for (const re of s) for (const x of allMatches(re, text)) sm.push(x);
    // 腿②：挑选标记 × 显著性（两者同窗；任一命中带否定前缀即作废）
    const wm = [];
    for (const re of w) {
      for (const x of allMatches(re, text)) {
        const before = text.slice(Math.max(0, x.idx - 6), x.idx);
        if (lang === 'zh' && NEG_BEFORE_ZH.test(before)) continue;
        if (lang === 'en' && (NEG_BEFORE_EN.test(before) || NEG_BEFORE_EN2.test(before))) continue;
        wm.push(x);
      }
    }
    const gm = [];
    for (const re of g) {
      for (const x of allMatches(re, text)) {
        const before = text.slice(Math.max(0, x.idx - 6), x.idx);
        if (lang === 'zh' && NEG_BEFORE_ZH.test(before)) continue;
        if (lang === 'en' && (NEG_BEFORE_EN.test(before) || NEG_BEFORE_EN2.test(before))) continue;
        gm.push(x);
      }
    }
    const wgPairs = [];
    for (const a of wm) {
      for (const b of gm) {
        const dist = Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
        if (dist > win) continue;
        if (a.idx === b.idx) continue;
        wgPairs.push({ pick: a, signif: b });
        break;
      }
      if (wgPairs.length) break;
    }
    if (!wgPairs.length) continue;
    // 腿① × 腿②同窗配对（片段不重合；总跨度受限）
    for (const a of sm) {
      for (const pair of wgPairs) {
        const lo = Math.min(a.idx, pair.pick.idx, pair.signif.idx);
        const hi = Math.max(a.end, pair.pick.end, pair.signif.end);
        // 腿①与腿②片段不得重合（同一串不兼两腿）
        const overlap = a.idx < pair.signif.end && pair.signif.idx < a.end;
        if (overlap) continue;
        if (hi - lo <= win + 24) {
          sigs.push({ lang, search: a.raw, pick: pair.pick.raw, signif: pair.signif.raw });
          break;
        }
      }
      if (sigs.length >= 3) break;
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectPHacking(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免（任一命中即不判）
  if (anyHit(R.EXEMPT_PREREG_ZH || EXEMPT_PREREG_ZH, text) || anyHit(R.EXEMPT_PREREG_EN || EXEMPT_PREREG_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_CORRECTION_ZH || EXEMPT_CORRECTION_ZH, text) || anyHit(R.EXEMPT_CORRECTION_EN || EXEMPT_CORRECTION_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_REPLICATION_ZH || EXEMPT_REPLICATION_ZH, text) || anyHit(R.EXEMPT_REPLICATION_EN || EXEMPT_REPLICATION_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_DISAVOW_ZH || EXEMPT_DISAVOW_ZH, text) || anyHit(R.EXEMPT_DISAVOW_EN || EXEMPT_DISAVOW_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.75 : 0.65;
  return {
    hit: true,
    dimension: 'p_hacking',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh' ? x.search + ' × ' + x.pick + ' × ' + x.signif : x.search + ' x ' + x.pick + ' x ' + x.signif)),
    details: s.lang === 'zh'
      ? '多重比较/数据挖掘(' + sigs.length + '处: 「' + s.search + '」之后只把「' + s.pick + s.signif + '」的那个当证据——大量尝试后选择性报告赢家，事后搜索被当成发现)(zh)'
      : 'p-hacking(' + sigs.length + 'x: "' + s.search + '" followed by only reporting "' + s.pick + ' ' + s.signif + '" — search-then-report, forking paths presented as a finding)(en)',
    guidance: '不要只报告大量尝试中偶然显著的那个（试了20种分组终于显著/测了30组有一组p<0.05/we tested twenty subgroups and finally found one significant）：在同一数据集上尝试的分组、口径与规格越多，假阳性必然出现，事后搜索不能充当证据。若做探索性分析，应声明预注册的主要终点、报告多重比较校正（如 Bonferroni/FDR），或提供独立样本的重复验证，再下结论。',
    tags: ['statistics', 'research-integrity', 'p-hacking', 'data-dredging', 'multiple-comparisons'],
  };
}

module.exports = {
  detectPHacking,
  __internals: () => ({
    SEARCH_ZH, SEARCH_EN, WINNER_ZH, WINNER_EN, SIGNIF_ZH, SIGNIF_EN,
    SEARCH_ZH2, SEARCH_EN3, WINNER_ZH3, WINNER_EN3, SIGNIF_ZH3, SIGNIF_EN3,   // [r317] 选择性报告新措辞族
    EXEMPT_PREREG_ZH, EXEMPT_PREREG_EN, EXEMPT_CORRECTION_ZH, EXEMPT_CORRECTION_EN,
    EXEMPT_REPLICATION_ZH, EXEMPT_REPLICATION_EN, EXEMPT_DISAVOW_ZH, EXEMPT_DISAVOW_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    WIN_PAIR_ZH, WIN_PAIR_EN,
  }),
};
