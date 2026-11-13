/**
 * src/law-of-small-numbers.js — 「小数定律」检测器
 * （ provisional 第 234 个判别维度，r246 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r246-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r245：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect/peak_end_rule 二十个已起草未接线维度占号，最终编号
 * 由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r246 立项] 零命中探针 coordination/agent4/probes/r246-probe-round1.js
 * + r246-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：
 * 五候选两轮实测——C 均值分布误读 5/8 穿透+1 良性误伤、D 邓宁-克鲁格
 * 6/8、E 损失厌恶 6/8、B 检察官谬误 11/12 穿透但疑难良性 2/6 被既有
 * 维度误拦（概念教学句纠缠）；**A 小数定律一轮 8/8 穿透、疑难良性
 * 0/4，二轮攻击变体 9/12 穿透、疑难良性 0/6、邻接领地正当句 2/4
 * （hasty_generalization/clustering_illusion 领地句同样零命中，证实
 * 真空隙）**，双干净胜出。src/ 下没有任何维度判「拿小样本的偶然
 * 波动当总体真实分布，且显式为小样本辩护/豁免样本量」这一结构
 * （hasty_generalization 管证据不足泛化但不判样本量显式豁免，
 * anecdotal_as_proof 管个案当证据，clustering_illusion 管随机
 * 序列看模式，均不判「样本小才真实/几个就够」的样本量辩护形状）。
 *
 * 外部来源：空返，按既有形态自建。r246 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-160205*）：arXiv 宽查询被
 * API 拆成 OR 得 15 条全是大气科学/科普框架论文零相关、GitHub
 * repos 0 命中、Semantic Scholar 429——无可集成的纯规则实现，
 * 判据为心虫自有纯规则实现（家族定义取自 Tversky & Kahneman 1971
 * "Belief in the Law of Small Numbers"：人们系统性地高估小样本
 * 对总体的代表性，把小样本的偶然波动当作总体真实分布）。
 *
 * 辨别的族：小数定律（law of small numbers）——**小样本锚点**（三个
 * 案例/五次实验/问了几个人/身边一圈人；EN three coin flips / five
 * colleagues / a handful of users）与**总体性裁定**（规律已经很
 * 明显了/等于全员同意/这药肯定有效；EN so it always works / so it
 * affects everyone）近距共现，或**样本量显式豁免**单独成句（样本
 * 小才真实/大样本都是注水/几个就够；EN small samples are the
 * honest ones / all you need to see the pattern）。拿极小样本的
 * 偶然结果给全体下结论，甚至反过来主张样本越小越干净。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：小数定律是统计
 * 推理的底座错误——由三个百岁老人推出水土养人、由三次正面推出
 * 硬币偏了、由五个病人推出药有效。小样本的波动本来就大，把它的
 * 偶然形态当成总体的稳定属性，是一切以偏概全式决策的统计根源；
 * 而「样本小才真实、大样本都是注水」是更隐蔽的变体——主动为
 * 样本不足辩护，堵死补数据的路。听者需要意识到：样本量决定结论
 * 能走多远，小样本只能给假设不能给结论。与正当推理有明确界线：
 * 明确承认样本不足、主动扩大样本、把初步观察当假设、参考大样本
 * 证据、讨论样本量与代表性本身——均豁免。
 *
 * 与既有维度的边界（r246 归因）：
 *   · hasty_generalization 管**证据不足泛化**（样本小就下普遍
 *     结论）；本族要求小样本锚点×总体性裁定的近距结构，且显式
 *     覆盖「为小样本辩护」的样本量豁免形状，探针实测其领地句
 *     （见了两三个人这样，全天下的人都一个样）同样零命中。
 *   · anecdotal_as_proof 管**个案当证据**（举一个亲历故事证
 *     明）；本族判小样本=总体的统计推断，可以完全不含故事。
 *   · clustering_illusion 管**随机序列中看出模式**；本族判
 *     样本规模不足上升为总体结论（随机连号判有鬼是本族近亲，
 *     但 clustering 领地句探针实测零命中）。
 *   · base_rateneglect（169）管**先验基础比率缺席**；本族管
 *     样本规模与代表性的误用。
 *   · statistical_misleading（58）管**统计呈现手法**（小基数
 *     比例等）；本族管小样本向总体的推断本身。
 *
 * 判据（双腿链，腿②b 总体性裁定须与腿①小样本锚点近距共现；
 * 腿②a 样本量显式豁免单独成句即判）：
 *   ① 小样本锚点——极小数目（1-12/两三/三五个/十几个/几十）+
 *      样本性量词，或「几个/头几/前几/身边/亲戚/熟人/我认识的」
 *      窄范围词；
 *   ②a 样本量显式豁免——「样本小才真实/大样本都是注水/几个
 *       就够」式辩护句（单独成句即判）；
 *   ②b 总体性裁定——对全体/普遍属性下完成态结论（已经很清楚
 *       了/等于全员/都一个样/肯定有效/铁律/十拿九稳/这里就是
 *       养人；EN so it always works / so it affects everyone /
 *       clearly biased）；
 *   ③ 近距离窗 ZH60/EN180，腿②b 裁定词查否定前缀（整体并不值/
 *      民意并不清楚）；
 *   ④ 豁免：概念讨论（小数定律/大数定律/中心极限/样本量不足/
 *      显著性/law of small numbers/sample size——CONCEPT）与
 *       正当做法（不足为凭/扩大样本/需要更多数据/先试点再放量/
 *       larger sample/more data needed——CORRECTIVE）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次小样本观察（确实
 * 需要验证其普遍性主张），也可能是引述谬误案例的教学句。verify
 * 的语义是「这段话用一个极小的样本给全体下了结论、或主张样本
 * 越小越可靠，先核实样本量与结论的匹配度、是否需要更大样本，
 * 再决定是否采信其普遍性主张」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（小数定律/大数定律/中心极限/样本量不足/显著性
 *     检验/Kahneman——CONCEPT 豁免）；
 *   · 正当统计做法（不足为凭/样本量远远不够/扩大样本/需要更多
 *     数据/先小规模试点验证后再放量/larger sample needed——CORRECTIVE
 *     豁免）；
 *   · 单腿句（只「样本小才真实」无小样本呈现但走豁免主张判、
 *     只「看了五个样本」无总体裁定不判、只「规律很明显」无
 *     小样本锚点不判）；
 *   · 大样本正当句（样本量已扩到三千人/五万人之后趋势稳定——
 *     大数不在腿①数字表）；
 *   · hasty_generalization / anecdotal_as_proof / clustering_
 *     illusion 领地（见上边界）。
 *
 * [r279 扩展 · 真升级②：小样本锚点、总体性裁定与样本量辩护的全新措辞家族]
 * r279 池化探针（coordination/agent4/probes/r279-probe-pool.js，v6.8.161
 * 实测）：本维 13 条新措辞攻击 **9 条完全穿透**（gate.action=pass 且零维度
 * 承重），良性 6 条零误伤。穿透根因：
 *   · 腿①新族：游戏/消费行为量词族——把/局/场/发/单/轮/波/关/节/趟：
 *     「连玩了三把都输」「抽了十发」「氪了三单」「打了几把排位」「看了
 *     两场直播」是游戏与消费口语的小样本默认说法，原量词表只收
 *     个/位/名/条/例/只/家/次/回/批/组/份/人。
 *   · 腿②b 新族：账号命运/产品定性裁定——「这号是废的」「翻车是早晚的
 *     事」「出金率就是高」「这游戏不坑钱」。
 *   · 腿②a 新族：真相型辩护（小样本才是真相/才是事实）、大样本失真型
 *     （样本越大越不准/被平均）、敷衍型（问几个人就行/调查那么多都是
 *     走形式）；EN trend-is-obvious / no need for a bigger dataset /
 *     small samples tell the truth。
 */
'use strict';

// ─── 腿① 小样本锚点：极小数目 × 样本性量词 ─────────────────────
const SMALL_N_ZH = [
  // 一至十二 + 样本性量词（个/位/名/条/例/只/家/次/回/批/组/份/人/期/例）
  /[一二两三四五六七八九十]\s*(?:个|位|名|条|例|只|家|次|回|批|组|份|人|任|例|台|件|辆|栋|间|款|种)(?:\s*样本|\s*案例|\s*例子|\s*数据|\s*实验|\s*试点|\s*病人|\s*患者|\s*客户|\s*用户|\s*股票|\s*股|评论|反馈|问卷|访谈|观察|连号|硬币|试验|记录)?/,
  // 几个/三两/数几/头几/前几/头一批
  /(?:几个|三两|数几|几例|几番|几回|几次|几人|几条|头几|前几|头一批|头几批|开头几|头几只|三五个)/,
  // [r303 新增] 抽样/检验动词形锚点——「抽检了3台」「抽查了几批」「试用了
  //   两回」「回访了几个客户」：r279 量词族只收「数字+量词」的组合形，
  //   「动词+了+数字」的抽样叙述形整族穿透（r303 探针实测：抽检3台→全部
  //   合格 MISS）。动词本身即声明了「这是一次小规模抽样」。
  /(?:抽检|抽测|抽查|抽验|试用|试驾|试吃|试玩|体验|回访|随访|走访|调研|访谈|问过|问了|观察|看了|测了|试了)[了过]?[一二两三四五六七八九十\d]+\s*(?:个|位|名|条|例|只|家|次|回|批|组|份|人|台|件|辆|款|种)/,
  // [r303 新增] 「抽检/抽查/试用 + 了 + 几个/少量」形（无具体数字）
  /(?:抽检|抽测|抽查|抽验|试用|试驾|试吃|试玩|体验|回访|随访|走访|调研|访谈|问过|问了|观察|看了|测了|试了)[了过]?(?:几个|三两|数几|几例|几回|几次|几条|三五个|少量|几十个|十几)/,
  // 十几个/数十
  /(?:十几|数十)/,
  // 隐式窄范围：身边/周围/熟人/亲戚/朋友圈/我认识的/手头
  /(?:身边|周围|熟人|朋友圈|亲戚|我认识的|手头|目所能及|方圆|邻里|街坊|圈子里|圈子里的)/,
  // [r279 新增] 游戏/消费行为量词族——把/局/场/发/单/轮/波/关/节/趟：
  //   「连玩了三把」「抽了十发」「氪了三单」「打了几把排位」「看了两场
  //   直播」是游戏与消费口语的小样本默认说法，原量词表只收 个/位/名/条/
  //   例/只/家/次/回/批/组/份/人 等，这批整族穿透（r279 探针实测）。
  //   裸量词形态收录（161 轮教训：同族词去后缀仍命中）。
  /[一二两三四五六七八九十]\s*(?:把|局|场|发|单|轮|波|关|节|章|趟|顿|抽|氪|连|局)(?:[\u4e00-\u9fff]{0,4})/,
  /(?:几把|几局|几场|几发|几单|几轮|几波|几关|几节|几趟|几顿|两把|两局|两场|三把|三局|三场|三单|三发|三连|五连|三连胜|两连败)/,
];
const SMALL_N_EN = [
  // 数目 + 样本性名词（允许中间隔 1-2 个词）
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a few|a couple(?:\s+of)?|a handful of|several|just a few|a small number of|two or three|three or four)\s+(?:\w+\s){0,2}(?:times|cases|people|persons|samples|examples|instances|patients|clients|customers|users|reviews|data points|respondents|participants|observations|trials|runs|stocks|reports|complaints|comments|friends|colleagues|neighbors|interviews|flips|rolls|draws)\b/i,
  // [r312 补] 频次裸词 twice / thrice / a couple of times——枚举腿漏收的裸
  // 名词形态（161 轮教训同型）：「I tried the product twice and it worked」
  // 的 twice 是高频小样本锚点，但不含任何样本性名词，上一条整条漏判。
  /\b(?:tried|used|tested|sampled|surveyed|asked|checked|observed|watched|ran|tried out)\s+(?:it|them|the\s+\w+|this\s+\w+)?\s*(?:twice|thrice|a couple of times|a few times|two times|three times)\b/i,
  /\b(?:twice|thrice)\b(?=[^.]{0,80}(?:so|therefore|thus|which means|meaning))/i,
  // the first few/five/three/...
  /\bthe\s+(?:first|last)\s+(?:few|five|four|three|two|couple|handful)\b/i,
  // small/tiny sample 裸词（小样本主张）
  /\b(?:small|tiny|little)\s+(?:sample|samples|sample size)\b/i,
  // 我的圈子（friends/circle/neighbors/colleagues/relatives）
  /\bmy\s+(?:friends|circle|neighbors|colleagues|relatives|family)\b/i,
];

// ─── 腿②a 样本量显式豁免：为小样本辩护/贬低大样本（单独成句即判）──
const EXEMPT_ZH = [
  // 样本小才干净才真实
  /(?:样本小|小样本|小的样本|这点样本|这么点样本|三五个样本)[^。，！？；\n]{0,8}(?:才|恰恰|恰恰最|就是)?\s*(?:真实|干净|可靠|靠谱|可信|准|有效|说明问题|最说明问题)/,
  // 大样本都是注水/污染/造假
  /(?:大样本|大数据|大调查|大样本量|大样本数据|大规模调查)[^。，！？；\n]{0,10}(?:都是|全是|统统是|实为|无不是|皆是)\s*(?:注水|造假|操纵|污染|编的|假的|假的|不可信|无效|洗地|安排)/,
  // 几个就够
  /(?:几个|三五个|两三个|这点|这么点|少量|小样本)[^。，！？；\n]{0,6}(?:就够|就够了|就足以|足以说明|足以证明|就能说明|就能证明|足够说明|足够|管用|说明问题)/,
  // [r279 新增] 真相型辩护族——「小样本才是真相/才是事实/才是真理」：旧腿
  //   收「才真实/才干净/才可靠」，「真相/事实/真理」形整族穿透（r279 探针实测）。
  /(?:样本小|小样本|小的样本|这点样本|这么点样本|少量样本|小数据)[^。，！？；\n]{0,8}(?:才是|才代表|才接近|才是唯一的)(?:真相|事实|真理|真实|全貌|本质)/,
  // [r279 新增] 大样本失真型辩护族——「样本越大越不准/数据越多越假」：旧腿
  //   只收「大样本都是注水/造假」的判定形，「越不准/越假/失真」的比较形与
  //   「被平均」的机制形整族穿透（r279 探针实测）。
  //   注：结论词（不准/失真/被平均）用前瞻承载——裸匹配会把「不准」收进
  //   raw，触发 NEG_INSIDE 否定守卫把本腿误杀（r279 实测教训）。
  /(?:样本|数据|调查)[^。，！？；\n]{0,6}(?:越大|越多|越)(?=[^。，！？；\n]{0,4}(?:不准|不灵|越假|失真|是假|被平均|平均掉|稀释|失去意义))/,
  /(?:样本|数据|调查)(?:一大|一多)?(?=[^。，！？；\n]{0,4}(?:就被平均|被平均|平均掉|就失真|失真|变假|不准))/,
  // [r279 新增] 敷衍型辩护族——「问几个人就行/调查那么多都是走形式」：
  //   旧腿收「几个就够」，「就行/就可以」形与贬低大调查的「走形式/套路」
  //   形整族穿透（r279 探针实测）。小数量词（几个/三五/少量）为必现要件，
  //   不退化为「问…就行」的过宽匹配。
  /(?:问|访谈|调查|填|访问)[^。，！？；\n]{0,6}(?:几个|三五|两三个|少量|几十个|十几)(?:人|样本|数据|份|条)?[^。，！？；\n]{0,4}(?:就|便)(?:行|可以|够|成)/,
  /(?:调查|问卷|统计|大数据)[^。，！？；\n]{0,10}(?:都是|全是|统统是|实为|皆是)\s*(?:走形式|套路|形式主义|洗脑|操纵|安排|造假)/,
];
const EXEMPT_EN = [
  // small samples are the honest/clean ones
  /\b(?:small|tiny|little)\s+samples?\s+(?:are|is)\s+(?:the\s+)?(?:honest|cleaner|cleanest|real|true|best|most reliable|most honest|most accurate)\b/i,
  // big surveys are rigged
  /\b(?:big|bigger|large|larger)\s+(?:surveys?|samples?|datasets?|data|polls?)\s+(?:are|is)\s+(?:all\s+|just\s+)?(?:rigged|corrupted|polluted|fake|faked|manipulated|worthless|unreliable|bought)\b/i,
  // all you need to see the pattern
  /\ball\s+you\s+need\s+to\s+see\b/i,
  /\b(?:three|five|a few|\d+)\s+(?:data points|cases|examples|samples)\s+(?:are|is)\s+all\s+you\s+need\b/i,
  // small sample is enough / no need for larger sample
  /\b(?:small|tiny)\s+(?:sample|samples|sample size)s?\s+(?:is|are)\s+(?:enough|plenty|sufficient)\b/i,
  /\bno\s+need\s+for\s+(?:a\s+|any\s+)?(?:large|big|bigger|larger)\s+sample\b/i,
  // [r279 新增] 英文豁免辩护新族——「three data points and the trend is
  //   obvious」「no need for a bigger dataset」「small samples tell the
  //   truth」：旧腿只收 all you need / are all rigged / is enough 三种形，
  //   trend-is-obvious、dataset 名词形、tell the truth 形整族穿透
  //   （r279 探针实测）。
  /\b(?:three|five|a few|\d+)\s+(?:data points|cases|examples|samples|observations)\s+(?:and|,)\s+(?:the\s+)?(?:trend|pattern|result|conclusion)\s+is\s+(?:obvious|clear|evident)/i,
  /\bno\s+need\s+for\s+(?:a\s+|any\s+)?(?:large|big|bigger|larger)\s+(?:sample|dataset|data set|survey|study)\b/i,
  /\b(?:small|tiny)\s+(?:samples?|datasets?)\s+(?:tell|show|reveal|give)\s+(?:you\s+)?(?:the\s+)?(?:truth|reality|real picture)/i,
  /\b(?:big|bigger|large|larger)\s+(?:datasets?|data sets|samples?)\s+(?:average|averages|dilute|dilutes|smooth)\s+(?:everything|it all|away)\b/i,
];

// ─── 腿②b 总体性裁定：对全体/普遍属性下完成态结论 ────────────────
const UNIVERSAL_ZH = [
  // 完成态裁定词
  /(?:已经|早就|显然)?很?(?:清楚|明显)了|规律(?:已经|早就|显然)?很?(?:明显|清楚)|一目了然|不言而喻|昭然若揭/,
  // [r269] 高置信 + 可插入程度副词：民意已经非常清楚了/趋势很明显了
  /(?:已经|早就|显然|其实|确实)?(?:非常|十分|特别|相当|格外)?很?(?:清楚|明显)了/,
  // 全域泛化
  /(?:都一个样|全都如此|无一例外|到哪都一样|放之四海|一概如此|都是如此|所有人都|人人都|等于全员|等于所有人|无人不|无一不|皆然)/,
  // 高置信裁定
  /(?:铁律|十拿九稳|板上钉钉|毫无疑问|百分百|百分之一百|必然有效|肯定有效|肯定有|明显是|必然是|铁定)/,
  // [r269] 缺陷/故障裁定：肯定有设计缺陷/都有问题/都存在同样毛病
  /(?:肯定|必然|一定|绝对|显然|明显|想必|铁定|注定)[^。，！？；\n]{0,12}(?:缺陷|毛病|问题|故障|漏洞|隐患|弊病|硬伤|短板)/,
  /(?:设计缺陷|质量缺陷|结构缺陷|共性缺陷|共性毛病|设计问题|质量问题)/,
  // [r269] 都 + 强评价形容词（两次都很惊艳/三次都很准）
  /(?:都|全都|每次都|次次都|无一不)[^。，！？；\n]{0,6}(?:惊艳|惊喜|失望|准|靠谱|稳|灵|神|厉害|优秀|出色|完美|理想|成功|有效|好用|好使)/,
  // 泛化判定结构：明显/肯定/必然/绝对/注定 + 结论形容词
  /(?:明显|肯定|必然|绝对|注定|铁定|想必|一定)[^。，！？；\n]{0,10}(?:偏|有效|有用|准|对|成立|是真的|如此|一样|有鬼|有问题|有希望|靠谱|行得通|走得通|灵|养人)/,
  // 归因泛化：这里/当地/这种人 就是养人/行/好
  /(?:这里|此地|当地|这个村|这座城|这地方|这种人|这类人|这行|业内|大家)[^。，！？；\n]{0,12}(?:就是|都|普遍|必然|注定)(?:养|行|好|强|准|灵|通|靠谱|有效|如此|这么想|一个样)/,
  // 推导结构：可见/说明/证明/这意味着 + 都/所有人/人人/普遍
  /(?:可见|由此|足见|足以|说明|证明|这意味着|由此可见)[^。，！？；\n]{0,14}(?:都|所有人|人人|全部|普遍|一概|无一不)/,
  // 收窄的「是对的」：逻辑/方法/规律/理论/观点 是对的
  /(?:逻辑|方法|规律|办法|路子|方案|理论|观点|说法|判断|思路)是对的/,
  // 全X都这样
  /全(?:店|公司|行业|国|社会|市场|群体|班|组|城|国|校|系)[^。，！？；\n]{0,6}(?:都|皆)/,
  // [r279 新增] 游戏/账号命运裁定族——「这号是废的」「翻车是早晚的事」
  //   「出金率就是高」「这游戏不坑钱」：从几次抽卡/几把排位/几场直播推出
  //   账号命运或产品定性的完成态结论，原 UNIVERSAL_ZH 只收书面裁定词，
  //   这批口语形整族穿透（r279 探针实测）。
  /(?:这|此|这个|该)?(?:号|账号|号品|角色|号段)(?:是|算是|就是|纯属|真是|注定是)(?:废的|废|黑透了|非到|酋|晦气|没救|完蛋)/,
  /(?:翻车|塌房|翻车了|塌房了)[^。，！？；\n]{0,8}(?:早晚|注定|必然|肯定|一定|迟早|跑不掉|没跑)/,
  /(?:早晚|注定|必然|肯定|一定|迟早)[^。，！？；\n]{0,8}(?:翻车|塌房|暴雷|崩盘)/,
  /(?:就是|明明是|显然是|绝对是|妥妥的)(?:高|低|好|差|准|坑|不坑|坑钱|骗氪|逼氪|割韭菜|欧|非|灵|假|稳|坑爹)/,
  /(?:不坑|坑钱|骗氪|逼氪|割韭菜|坑爹)(?:钱|啦|了)?[。，！？；\n]|(?:这游戏|这款游戏|这平台|这个坑)(?:不坑|坑钱|骗氪|逼氪)/,
];
const UNIVERSAL_EN = [
  // so it/this/that/the ... always/never/everyone/works/is a hit
  /\bso\s+(?:it|this|that|they|the)\s+(?:\w+\s){0,3}(?:always|never|affects everyone|everyone|all users|universal|is a hit|works|is a lock|is certain)\b/i,
  /\bso\s+the\s+whole\b/i,
  // it always works / affects everyone
  /\b(?:always|necessarily)\s+works?\b/i,
  /\baffects?\s+everyone\b/i,
  // the pattern is universal / proves that
  /\bthe\s+pattern\s+is\s+universal\b/i,
  /\bproves?\s+(?:that\s+)?(?:it|the|this|they)\b/i,
  /\bmeans?\s+everyone\b/i,
  // clearly/obviously/definitely + 结论
  /\b(?:clearly|obviously|definitely|certainly|undoubtedly)\s+(?:biased|works|valid|true|effective|right|proven|a hit)\b/i,
  /\bit'?s\s+a\s+(?:sure\s+)?(?:hit|lock|certainty|slam dunk)\b/i,
];

// ─── 腿③ 数量化总体裁定（小样本 → 概率/比率/均值 的数值化结论）────
// [r302 新增 · 真升级②] 腿②b UNIVERSAL 只收「定性裁定」词（铁律/肯定
// 有效/这里养人/都一个样），漏收「拿小样本给总体参数定一个数」的数量化
// 结论形——而这正是小数定律最教科书式的形态：抛十次七正 → 正面概率就是
// 七成；连开三把出货 → 爆率就是五成；见了三个一米九 → 平均身高就是比别处
// 高一大截。r302 候选探针（scripts/round-302/probe-candidates-r302.js，
// v6.8.174 gate() 动手前实测）实证 3/4 此类攻击整句穿透、良性对照干净。
// 本腿与腿①小样本锚点近距共现即判，与腿②b 平行成路由，**不并入存量
// UNIVERSAL 数组**（避开 r280/r265 的 length===N 注入断言），复用共享
// 豁免入口与 dist()。
const QUANT_RATE_ZH = '(?:概率|几率|可能性|胜率|赢率|命中率|成功率|失败率|成交率|转化率|爆率|出金率|掉率|中奖率|中签率|复发率|死亡率|存活率|生存率|治愈率|痊愈率|好评率|差评率|支持率|赞成率|收益率|回报率|胜算|正确率|错误率|完成率|及格率|留存率|复购率|故障率|投诉率|点击率|满意度)';
// 数值结论：X成 / 百分之X / 数字% / 百分点 / 裸一至两位数（九十/七十）
const QUANT_NUM_ZH = '(?:[一二两三四五六七八九十半]\\s*成|百分之?\\s*[一二三四十百\\d]+|\\d+(?:\\.\\d+)?\\s*(?:%|％|个百分点)|[一二两三四五六七八九十]{1,2}\\s*(?:倍|个百分点)?)';
const QUANT_ZH = [
  // 率/概率 + (可选连接词) + 数值（正面概率就是七成 / 爆率有五成 / 留存率大概九十）
  new RegExp(QUANT_RATE_ZH + '(?:也\\s*就|也就|也就是|就是|是|有|为|高达|高达到|达到|升至|降到|只有|才|能到|能达|稳定在|长期在|起码|至少|大约|大概|约|差不多|接近|应该|估计)?\\s*' + QUANT_NUM_ZH),
  // 平均/均值/人均 + (可选名词) + 高/低/多/少 + 强幅度（平均身高就是比别处高一大截）
  new RegExp('(?:平均|均值|人均|整体平均|总的来说)[^。，！？；\\n]{0,6}(?:就是|能|有|达到)?[^。，！？；\\n]{0,4}(?:高|低|多|少|强|弱)[^。，！？；\\n]{0,3}(?:一大截|一截子|一截|不少|得多|很多|一大块|两成|三成|一半|半分|\\d|个百分点)'),
];
const QUANT_EN = [
  // number-first：a 70% chance / 60% survival rate / seventy percent chance
  /(?:\d+(?:\.\d+)?\s*(?:%|percent|per cent)|(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(?:%|percent|per cent))\s+(?:chance|probability|odds|likelihood|rate)\b/i,
  // rate-first：the conversion rate is 100% / probability is about 0.7 / two in three
  /\b(?:probability|chance|odds|rate|hit rate|success rate|win rate|conversion rate|approval rating|satisfaction|likelihood|average|mean)\b[^.]{0,14}?(?:is|are|sits at|lands at|runs at|averages|comes to|about|around|roughly|near(?:ly)?|at least|at most)?\s*(?:\d+(?:\.\d+)?\s*(?:%|percent|per cent)|\d+(?:\.\d+)?\s+in\s+\d+|(?:zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+in\s+\d+)/i,
  // on average + comparative magnitude（on average far taller）
  /\bon average\b[^.]{0,26}?(?:much|far|significantly|way|a lot|considerably|half|twice|\d+\s*(?:%|percent|x))\b[^.]{0,14}?(?:higher|lower|taller|shorter|more|less|better|worse|faster|slower|bigger|smaller|greater)/i,
];

// ─── 腿④ 永续/全称限定词（有限观测 → 无时间限定/无例外范围的结论）──
// [r303 新增 · 真升级②] 腿②b UNIVERSAL 只收「定性裁定」词（铁律/肯定
// 有效/这里养人/都一个样），腿③ QUANT 只收「数值化裁定」（概率七成/
// 率九成），两族都漏收**用有限观测直接推出一个无例外、无时间边界的
// 永续结论**——而这正是小数定律最经典的教科书形态：抛了三次硬币都
// 是正面，这枚硬币**永远是正面**；观察了十次日出，太阳**永远从东边
// 升起**；问了三个朋友没人遇到问题，这个方案**永远不会有风险**；
// 五个村民活过百岁，这里的水土**能让人长寿**。r303 候选探针
// （scripts/round-303/probe-candidates-r303.js，v6.8.178 gate() 动手前
// 实测）实证 4/4 此类攻击整句穿透（gate.action=pass 且零维度承重）、
// 良性对照干净、双向守卫良性基线零含此类词的样本。
// 本腿与腿①小样本锚点近距共现即判，与腿②b/腿③平行成路由，**不并入
// 存量 UNIVERSAL/QUANT 数组**（避开 r280/r265 的 length===N 注入断言），
// 复用共享豁免入口与 dist()。裸名词形态收录（161 轮教训：同族词去
// 后缀仍命中——「太阳永远从东边升起」不含任何裁定词面）。
const PERPETUAL_ZH = [
  // 永远/永久/始终/从来都 + 结论动词（太阳永远从东边升起 / 这个方法永远有效）
  /(?:永远|永久|始终|一向|从来都|从无例外|无一例外|万世)[^。，！？；\n]{0,10}(?:从|是|有|能|会|要|该|这么|那么|如此|成立|有效|正确|对)/,
  // 结论 + 永续后缀（能让人长寿 / 保证长命百岁 / 包治百病 / 永不复发）
  /(?:能|可以|足以|保证|确保|包|准)[^。，！？；\n]{0,6}(?:让人|使人|令人)?[^。，！？；\n]{0,4}(?:长寿|长命|百岁|不死|不老|永生|包治|根治|断根|除根|彻底好|永不复发|永不再犯|再无问题|毫无风险|零风险|不出问题|不会出错)/,
  // [r303 新增] 永续后缀的动词前置形——「这款产品包治百病」「这个方法毫无
  //   风险」：上一条要求「能/保证+…+永续词」的链条形，产品/方法直接作
  //   主语的「包治/根治 + 百病/一切」与「毫无/毫无悬念」的零风险形整族
  //   穿透（r303 探针实测）。裸名词形态收录（161 轮教训）。
  /(?:包治|根治|断根|除根|根治了)[^。，！？；\n]{0,4}(?:百病|一切病|所有病|一切问题|所有问题|一切毛病)/,
  /(?:毫无|毫无半点|一点都没有|完全没有|零)[^。，！？；\n]{0,3}(?:风险|隐患|问题|副作用|后患|遗漏|遗漏|差错|出错)/,
  // 全体范围裸名词（所有用户/每个人/任何情况 都 满足/适用/成立）
  /(?:所有|任何|每)(?:用户|客户|人|情况|场景|时候|时候|条件下|环境下|机型|设备|批次|样本)[^。，！？；\n]{0,6}(?:都|全|一律|统统)?(?:满足|适用|成立|有效|一样|通过|合格|喜欢|认同|支持|遇到|出现|有)/,
  // 全部/整批 + 完成态（抽检了三台都没问题所以这批一万台全部合格）
  /(?:全部|整批|整批|所有|统统一律)[^。，！？；\n]{0,4}(?:合格|达标|通过|没问题|有效|成立|适用|一样)/,
];
const PERPETUAL_EN = [
  // guarantees / ensures + 永续结论（quitting smoking guarantees longevity）
  /\b(?:guarantee|guarantees|guaranteed|ensure|ensures|ensured|will always|always will|permanently|forever|for good)\b[^.]{0,30}?\b(?:longevity|long life|work|works|worked|success|succeed|succeeds|last|lasts|hold|holds|be safe|be fine|never fail|no risk|risk-free|survive|heal|cure|cures|be cured)\b/i,
  // so it always / so it will never（a few friends quit and lived long, so quitting guarantees longevity）
  /\bso\s+(?:it|this|that|they|the)\s+(?:\w+\s){0,3}(?:guarantee|guarantees|always|never|forever|permanently|mean|means)\b/i,
  // applies to everyone / works for everyone / true in every case
  /\b(?:applies?|works?|holds?|true|valid|effective)\s+(?:to|for|in)\s+(?:everyone|every|all|any)\b/i,
  // all users / every customer / no exceptions
  /\b(?:all|every|each)\s+(?:user|users|customer|customers|client|clients|case|cases|situation|situations|device|devices|batch|batches)\s+(?:are|is|will|pass|qualify|work|works)\b/i,
  /\bno\s+exceptions?\b/i,
];

// ─── 距离窗（小样本锚点 × 总体性裁定）──────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（小数定律/样本量/统计术语的教学定义句）─────
const CONCEPT_ZH = /(?:小数定律|大数定律|大数法则|中心极限|抽样误差|置信区间|统计显著|显著性检验|样本量(?:不足|不够|太小|要大|要多|要扩|得扩|要加大|需要)|代表性(?:不足|有偏|偏差)|随机抽样|抽样方法|统计学上|统计学家|样本规模|小样本(?:的)?(?:问题|偏差|波动|误差|谬误|定律|效应|现象|陷阱|风险|不足|不可靠|不靠谱|有偏)|大样本(?:的)?(?:必要|重要|意义|定律)|贝努利|特维斯基|卡尼曼)/;
const CONCEPT_EN = /\blaw of small numbers\b|\blaw of large numbers\b|\bcentral limit\b|\bsampling error\b|\bconfidence interval\b|\bstatistical(?:ly)? significan|\bsample size\b|\bsampling method\b|\bKahneman\b|\bTversky\b|\bsmall sample (?:problem|bias|fluctuation|issue|fallacy|phenomenon|trap)\b|\brepresentativen/i;

// ─── 豁免：承认样本不足/主动扩大样本的正当做法 ──────────────────
const CORRECTIVE_ZH = /(?:不足为凭|不足为证|远远不够|远远不足|样本量(?:要|需|得|应该|必须|得先|先|还是)?(?:太|更|扩|提|加|增|放大|扩大|加大|提高)|样本(?:太|过|偏)?(?:少|小|窄|单薄|薄弱|有限)(?![^。，！？；\n]{0,4}(?:才|恰恰|反而|正是|最|反倒|注定))|扩大样本|加大样本|增加样本|样本量扩大|先(?:小规模)?试点|试点(?:后|再|验证)|验证后(?:再|说|放量)|放量(?:前|之前)|完整统计|全面统计|几千次|更多数据|更多案例|更多样本|反复验证|多次验证|不能(?:只|仅)(?:凭|看|靠|拿)|不可(?:以偏概全|只凭|仅凭)|需要(?:更多|更大|更广|更全面)|先验证|谨|暂(?:时|且)(?:不|无法)下|证据还|数据还|(?:全班|全部|所有|全员|逐一|逐个)(?:都)?(?:测过|测完|验证过|试过|确认过|调查过|回访过)|(?:测过|验证过|试过|确认过|调查过)(?:之后|以后|后)(?:才|再))/;
const CORRECTIVE_EN = /\bnot enough\b|\bneed(?:s)? more\b|\blarger sample\b|\bbigger sample\b|\bincrease the sample\b|\bmore data\b|\bmore evidence\b|\bmore cases\b|\blarger sample size\b|\bpilot (?:before|first)\b|\bvalidate before\b|\bbefore scaling\b|\bnot conclusive\b|\binconclusive\b|\bcan'?t conclude\b|\bcannot conclude\b|\btoo small to\b|\bsample is too small\b|\bsmall sample size\b|\bnot representative\b|\bmore trials needed\b|\bnot enough data\b|\bnot enough evidence\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因|并不|并没)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|并不|并没|而非|而不是|绝非|而非是)/;

const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b|\bnot\s+(?:always|universal|everyone)\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s){0,4}$/i;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && !/别提多?$/.test(before) && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
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

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 签名收集：腿②a 单独成句即签；腿②b 须与腿①近距共现。
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      small: R.SMALL_N_ZH || SMALL_N_ZH,
      exempt: R.EXEMPT_ZH || EXEMPT_ZH,
      universal: R.UNIVERSAL_ZH || UNIVERSAL_ZH,
      quant: R.QUANT_ZH || QUANT_ZH,
      perpetual: R.PERPETUAL_ZH || PERPETUAL_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      small: R.SMALL_N_EN || SMALL_N_EN,
      exempt: R.EXEMPT_EN || EXEMPT_EN,
      universal: R.UNIVERSAL_EN || UNIVERSAL_EN,
      quant: R.QUANT_EN || QUANT_EN,
      perpetual: R.PERPETUAL_EN || PERPETUAL_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    // 腿②a 样本量显式豁免：单独成句即判（为小样本辩护是完整谬误主张）
    for (const x of collect(text, L.exempt, true)) {
      sigs.push({ lang: L.lang, kind: 'exempt', small: x.raw, verdict: x.raw });
    }
    // 腿① × 腿②b 近距共现
    // [r269] dist 恰好为 0 = 紧邻共现（「两次都很惊艳」「两台都出现故障」），
    // 是最强证据形态，原先被 `dist !== 0` 误排；改为排除同区间重叠
    // （dist 为 0 且 idx/end 完全重合才是同一处命中）。
    const smallM = collect(text, L.small, true);
    const univM = collect(text, L.universal, true);
    for (const s of smallM) {
      const u = univM.find(w => {
        const d = dist(w, s);
        if (d > L.win) return false;
        if (d === 0 && w.idx === s.idx && w.end === s.end) return false; // 同一区间
        return true;
      });
      if (!u) continue;
      sigs.push({ lang: L.lang, kind: 'pair', small: s.raw, verdict: u.raw });
    }
    // 腿① × 腿③ 数量化裁定（r302）近距共现——与腿②b 平行路由：小样本
    //   锚点近距给出一个数值化的总体参数结论（概率/比率/均值）。
    const quantM = collect(text, L.quant, true);
    for (const s of smallM) {
      const q = quantM.find(w => {
        const d = dist(w, s);
        if (d > L.win) return false;
        if (d === 0 && w.idx === s.idx && w.end === s.end) return false; // 同一区间
        return true;
      });
      if (!q) continue;
      sigs.push({ lang: L.lang, kind: 'quant', small: s.raw, verdict: q.raw });
    }
    // 腿① × 腿④ 永续/全称限定（r303）近距共现——与腿②b/腿③平行路由：
    //   小样本锚点近距推出一个无例外、无时间边界的永续结论（太阳永远从
    //   东边升起 / 保证长命百岁 / all users pass）。QUANT 判「给总体参数
    //   定一个数」，UNIVERSAL 判「定性裁定」，本腿判「把有限观测固化为
    //   永续规律」——三者结论形态互不相同，是同一谬误的不同表述出口。
    const perpM = collect(text, L.perpetual, true);
    for (const s of smallM) {
      const p = perpM.find(w => {
        const d = dist(w, s);
        if (d > L.win) return false;
        if (d === 0 && w.idx === s.idx && w.end === s.end) return false; // 同一区间
        return true;
      });
      if (!p) continue;
      sigs.push({ lang: L.lang, kind: 'perpetual', small: s.raw, verdict: p.raw });
    }
  }
  return sigs;
}

/**
 * 小数定律签名：小样本锚点 × 总体性裁定 近距共现，或样本量显式
 * 豁免单独成句。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectLawOfSmallNumbers(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（小数定律/大数定律/样本量不足/显著性检验教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：承认样本不足/主动扩大样本/把初步观察当假设的正当做法
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'law_of_small_numbers',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? (x.kind === 'exempt'
        ? '样本量豁免主张「' + x.small + '」'
        : x.kind === 'quant'
        ? '小样本「' + x.small + '」× 数量化总体裁定「' + x.verdict + '」'
        : x.kind === 'perpetual'
        ? '小样本「' + x.small + '」× 永续全称结论「' + x.verdict + '」'
        : '小样本「' + x.small + '」× 总体裁定「' + x.verdict + '」')
      : (x.kind === 'exempt'
        ? 'sample-size exemption claim "' + x.small + '"'
        : x.kind === 'quant'
        ? 'small sample "' + x.small + '" x quantitative verdict "' + x.verdict + '"'
        : x.kind === 'perpetual'
        ? 'small sample "' + x.small + '" x perpetual verdict "' + x.verdict + '"'
        : 'small sample "' + x.small + '" x universal verdict "' + x.verdict + '"'))),
    details: s.lang === 'zh'
      ? '小数定律(' + sigs.length + '处: ' + (s.kind === 'exempt'
        ? '显式为小样本辩护「' + s.small + '」，主张样本越小越可靠/大样本不可信'
        : s.kind === 'quant'
        ? '拿极小样本「' + s.small + '」给总体参数定下数值结论「' + s.verdict + '」，把小样本的偶然频率/均值当成总体的真实概率或比率'
        : s.kind === 'perpetual'
        ? '拿极小样本「' + s.small + '」推出无例外、无时间边界的永续结论「' + s.verdict + '」，把有限观测固化成永久成立的规律'
        : '拿极小样本「' + s.small + '」给全体下结论「' + s.verdict + '」，把小样本的偶然波动当总体真实分布') + ')(zh)'
      : 'law of small numbers(' + sigs.length + 'x: ' + (s.kind === 'exempt'
        ? 'explicit small-sample defense "' + s.small + '" — smaller sample claimed more reliable'
        : s.kind === 'quant'
        ? 'tiny sample "' + s.small + '" pinned to a numeric population parameter "' + s.verdict + '" — a small-sample frequency/mean read as the true probability or rate'
        : s.kind === 'perpetual'
        ? 'tiny sample "' + s.small + '" frozen into a perpetual verdict "' + s.verdict + '" — finite observations read as a permanently valid law'
        : 'tiny sample "' + s.small + '" generalized to a universal verdict "' + s.verdict + '"') + ')(en)',
    guidance: '小数定律指人们系统性地高估小样本对总体的代表性，把小样本的偶然波动当成总体真实分布——抛了三次硬币都是正面，这枚硬币明显是偏的 / 这个村出了三个百岁老人，这里的水土就是养人 / 我问了五个人，四个说支持，民意已经很清楚了 / 试了几次都不行，这个方法肯定有问题 / 样本小才真实，大样本都是注水注出来的 / three coin flips came up heads so this coin is clearly biased / I asked five colleagues and all of them agreed so the whole office feels this way / small samples are the honest ones and big surveys are all rigged。请补上论证：样本量决定结论能走多远，小样本的波动幅度大，只能给假设不能给结论；要下总体性结论需要足够大的随机样本或引用已有大样本证据；如果只是初步观察，请明确说这是待验证的假设，并说明还需要多少数据。「样本小才真实、大样本都是注水」是更隐蔽的变体——为样本不足辩护只会堵死补数据的路。承认样本不足、扩大样本、参考大样本证据、讨论样本量与代表性本身，都是正当做法；若这段话只是转述他人的谬误案例或统计教学，核实其主张再决定是否采信。',
    tags: ['statistics', 'statistical-literacy', 'law-of-small-numbers', 'small-sample-fallacy', 'cognitive-bias', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectLawOfSmallNumbers,
  __internals: () => ({
    SMALL_N_ZH, SMALL_N_EN,
    EXEMPT_ZH, EXEMPT_EN,
    UNIVERSAL_ZH, UNIVERSAL_EN,
    QUANT_ZH, QUANT_EN,
    PERPETUAL_ZH, PERPETUAL_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
