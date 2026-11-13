/**
 * src/tragedy-of-commons.js — 「公地悲剧」检测器
 * （ provisional 第 226 个判别维度，r238 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r238-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r237：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/perverse_incentive(r236)/winners_curse(r237)
 * 十三个已起草未接线维度占号，最终编号由 1 号按接线顺序在
 * VERIFY_DIMS 登记序重排）
 *
 * [r238 立项] 零命中探针 coordination/agent4/probes/r238-zerohit-probe.js
 * + r238-fp-probe.js（v6.8.145 gate() 全量 findings 实测）：认领方向
 * 五候选族竞品——A 框架效应攻击 2/7 穿透（余 5 条已被 perfect_error
 * 泛维度代拦，ZH 侧领地已被既有维度占据）、B 公地悲剧攻击 10/10
 * 完全穿透且高难度良性 5/5 零纠缠、C 道德风险攻击 9/10 穿透但疑难
 * 良性 3/5 被既有维度纠缠、D 节俭悖论攻击 8/8 穿透但疑难良性 4/5
 * 被纠缠且与 whole_part_transfer 逻辑同构、E 价格即质量攻击 7/8
 * 穿透但「贵有贵的道理」类良性天然与本族同形（成本定价是正当推断）。
 * B 以「攻击全穿透 + 良性零纠缠」双干净胜出。
 *
 * 外部来源：空返，按既有形态自建。r238 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-0111{02,38}*）：arXiv 两次
 * OR 噪声查询均 parse-fail、GitHub 0 命中、Semantic Scholar 429
 * 限流空返。判据为心虫自有纯规则实现（家族定义取自制度经济学/
 * 生态经济学的标准描述：tragedy of the commons / 公地悲剧——
 * 哈丁 1968：共享资源下每个个体理性地最大化自身取用，
 * 集体后果却是资源耗竭，个体理性汇成集体非理性）。
 *
 * 辨别的族：公地悲剧（tragedy of the commons）——**共享/无主资源
 * 锚点**（公共草场/免费水源/无主渔场/commons/belongs to no one）
 * × **个体过度取用行为**（每家多养/加大捕捞/多占/多采；EN each
 * family adds more / every boat fishes harder / expanded its
 * catch）× **个体理性化或成本扩散断言**（自己就多挣一份/大家一起
 * 承担/谁节省谁吃亏/谁也别想/是理性的；EN earns more / the cost
 * falls on everyone / shared by all / rational choice）三腿共现：
 *   这片草场是公共的，每家多养几只羊自己就多挣一份，退化大家一起承担。
 *   地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏。
 *   渔场是大家的，每条船都加大捕捞量，最后资源枯竭，可每条船的选择都是理性的。
 *   The pasture is shared, so each family that adds more cattle earns more.
 *   The aquifer is free, so every farm that pumps more this season gains.
 *   Each trawler expanded its catch because the fish stock belonged to no one.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：公地悲剧是
 * 「个体理性 → 集体非理性」的结构性错位——每一户的取用决策单独
 * 看都成立，合起来却耗竭所有人依赖的资源。把「自己多挣、成本
 * 大家一起扛」当作可接受甚至理所当然的权衡，是把外部化当成
 * 效率；据此做出的政策结论（公共所有没问题/市场会调节/不需要
 * 配额）都会系统性地错过治理窗口。与正当表述有明确界线：中性
 * 机制描述（只报「公共牧场诱发了过度放牧」无获益/扩散/认可
 * 断言）、治理方案句（需要配额/确权/轮捕/收费）、概念讨论
 * （公地悲剧/哈丁/Ostrom/commons problem）——均豁免。
 *
 * 与既有维度的边界（r238 归因）：
 *   · cost_externalization 管**成本转嫁第三方**（排污让别人
 *     买单），句中无「共享资源被个体竞相取用」结构；本族判据
 *     要求共享资源锚点腿在场，转嫁对象是资源共同体的全体成员。
 *   · perverse_incentive（r236 草稿）管**量化激励指标制造反向
 *     行为**（悬赏捕蛇所以有人养蛇）；本族无量化奖惩设计腿，
 *     锚点是资源的开放可取用性本身。
 *   · whole_part_transfer 管**泛部分-整体转移**；本族有明确的
 *     「共享资源 × 个体取用 × 成本扩散」三腿结构，且词汇族
 *     （草场/渔场/地下水/commons）是既有维度完全不覆盖的经济
 *     推理领地（r238 探针实测 10/10 穿透）。
 *   · free-rider 式搭便车表述归 manufactured_consent 等既有
 *     维度；本族判据要求「竞相取用」动作腿在场（多养/加大捕捞/
 *     fishes harder），单纯「别人会做我不做」不判。
 *
 * 判据（三腿共现，缺一不判）：
 *   ① 腿① COMMONS 共享/无主资源锚点——公地/公共资源/共用资源/
 *     共享资源/共有资源/公共牧场/公共草场/公共渔场/公共车位/
 *     无主资源；(公共|公有|共用|共有|共享|无主|不要钱|免费|
 *     谁都可以)×(草场|牧场|渔场|水源|地下水|林子|车位|…) 双向
 *     邻接；(归|属于)(大家|集体|全村|全体)；大家一起采/集体捞；
 *     EN commons / common-pool / open access / belongs to no one
 *     / (pasture|fishery|aquifer|…) is (shared|free|open to all)；
 *   ② 腿② OVERUSE 个体过度取用行为——多养/多捕/多采/多抽/
 *     多排/多占/多砍/多挖；(村|户|家|人|厂|船|车|公司|企业|
 *     农户|渔民|牧民)×(多种|多养|多捕|…)；(养|捕|采|抽|排|占|
 *     拿|用)得(更)?多；(加大|扩大|增加)×(捕捞|放牧|采伐|开采|
 *     抽取|排放|占用|耕种|种植)(量|强度|规模)；(过度|超量|超载|
 *     无序)×(放牧|捕捞|采伐|…)；想方设法×占；长时间占/霸占/
 *     抢占/囤积；EN (each|every|all)×动词×more/harder/extra、
 *     (expanded|increased) its (catch|harvest|extraction|pumping)、
 *     overgrazing/overfishing/overuse/hogging；
 *   ③ 腿③ RATIONALE 个体理性化/成本扩散断言——(自己|自家)就
 *     多挣/多赚/多得；多(一季|一笔|一份)收入；划算/占便宜/捞一把/
 *     得好处；(不占白不占|不用白不用|谁节省谁吃亏|法不责众|
 *     别人也这么干)；(大家一起|共同|全体|全社会)(承担|承受|扛|
 *     分担|买单)；(成本|代价|损失)(大家|全体)(摊|付|扛)；(最后|
 *     到头来)谁都(别想|跑不掉|承担)；谁也别想；是(理性|合理|
 *     明智|正当)的；理所当然；资源配置(最优|效率最高)；EN
 *     (earns|gains|profits) more、(each|every)…(earns|gains|
 *     profits)、saves on…costs、might as well、no reason to
 *     hold back、(cost|damage|pollution) falls on everyone、
 *     shared by all、everyone's problem、socialized、(rational|
 *     reasonable) (choice|move)、it makes sense for each。
 *   腿①×腿②与腿②×腿③分别落在近距离窗（ZH 60 字 / EN 180
 *   字符）；三腿命中均查否定前缀（不是公共的/并没有多养/不等于
 *   自己多挣；EN not shared / did not expand），被否定不计。
 *
 * 为什么取 VERIFY 级：单句可能只是在转述一个已发生的资源退化
 * 案例而未展开治理结论（这类由缺腿/豁免覆盖），也可能是说话者
 * 尚未意识到自身取用决策的集体外部性。verify 的语义是「这段
 * 话把个体对共享资源的竞相取用当作可接受的理性选择，先核实
 * 资源产权安排、取用总量与再生速率的关系、成本是否真的由全体
 * 成员均摊，再决定是否采信其效率结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 中性机制描述（只报「公共牧场诱发了过度放牧」+ 治理结果，
 *     无获益/扩散/认可断言）——正确分析资源问题，正是本族解药；
 *   · 治理方案句（需要配额/确权/承包/轮捕/休渔/收费）——缺
 *     腿③理性化断言，双腿判据天然不命中；
 *   · 概念讨论（公地悲剧/哈丁/奥斯特罗姆/commons problem/
 *     tragedy of the commons）——讨论本族名称的教学/定义句；
 *   · 非共享资源语境（私有/承包/自有资源上的生产决策）——腿①
 *     不命中；
 *   · 缺任一跳线（只报资源属性、只报取用行为、只报成本扩散
 *     但缺共享资源锚点）——三腿判据天然不命中。
 */
'use strict';

// ─── 腿① 共享/无主资源锚点（中文）────────────────────────────
const A_ZH = [
  // ①-a 显式公族复合词
  /(?:公地|公共资源|共用资源|共享资源|共有资源|共同资源|公共品|公共物品|公共牧场|公共草场|公共渔场|公共车位|公共池塘|公共林地|无主资源|无主之地|集体资源)/,
  // ①-b 修饰语×资源名词（公共的草场/免费的水源/没人管的林子）
  /(?:公共|公有|共用|共有|共享|无主|没人管|没人负责|无人看管|没有人管|不要钱|免费|白拿|谁都可以|大家都可以|谁都能|人人可用|开放)(?:的|地)?[^。，！？；\n]{0,8}(?:草场|牧场|草原|渔场|鱼塘|林子|森林|林地|水源|地下水|河流|湖泊|海域|公海|湿地|空气|车位|道路|频段|频道|信道|带宽|池塘|海滩|水井|野菜|蘑菇|资源)/,
  // ①-c 资源名词×归属形（草场是公共的/牧场公有/地下水不要钱/草原没有围栏）
  /(?:草场|牧场|草原|渔场|鱼塘|林子|森林|林地|水源|地下水|河流|湖泊|海域|公海|湿地|空气|车位|道路|池塘|海滩|水井|资源)[^。，！？；\n]{0,6}(?:是|属于|归)?(?:公共|公有|共有|共用|共享|无主|没人管|无人看管|集体|大家|全村|全体|不要钱|免费|白拿|谁都可以|没有围栏|无围栏)(?:所有|共用|共有|的)?/,
  // ①-d 系动词×归属形（是大家的/属于公众的/归全体村民）；「并不是/不属于」式
  // 否定由 lookbehind 直接排除（否定词紧贴系动词，前窗查不到完整否定词）
  /(?<!不)(?:是|属于|归)(?:公共|公有|共有|共用|共享|集体|大家|全村|全体|公众|全社会)(?:所有|共用|共有)?的/,
  // ①-e 集体采取形（大家一起采/集体捞/人人都多踩近路）
  /(?:大家|集体|全村|人人|所有人)(?:都|一起|共同)?(?:多)?(?:采|挖|摘|捞|分|用|拿|砍|踩|停|抽|牧|渔|钓|猎|捡)/,
];

// ─── 腿① 共享/无主资源锚点（英文）────────────────────────────
const A_EN = [
  // ①-a 裸公族词
  /\bcommons\b/i,
  /\bcommon[\s-]pool\b/i,
  /\bopen[\s-]access\b/i,
  /\bpublic\s+good\b/i,
  /\bfree[\s-](?:for[\s-]all|dumping|grazing|fishing|parking|access|resource|riding)\b/i,
  /\bbelong(?:s|ed|ing)?\s+to\s+no\s+one\b/i,
  /\bowned\s+by\s+no\s+one\b/i,
  /\bno\s+one\s+owns\b/i,
  /\bunowned\b/i,
  // ①-b 修饰语×资源
  /\b(?:shared|common|public|unowned|free)\b[^.]{0,40}\b(?:pasture|fishery|aquifer|forest|river|lake|water|stock|land|resource|grounds?|parking|seas?|ocean|air|airwaves|spectrum|grazing)\b/i,
  // ①-c 资源×系动词×修饰语（the pasture is shared / the aquifer is free）
  /\b(?:pasture|fishery|aquifer|forest|river|lake|commons|stock|resource|grounds?|parking|seas?|ocean|airwaves|spectrum)\b[^.]{0,30}\b(?:is|are|was|were|remains?|belongs?)\s+(?:shared|common|public|unowned|free|open\s+to\s+all)\b/i,
  // ①-d is open to all（渔场对所有人开放）
  /\b(?:is|are)\s+open\s+to\s+(?:all|anyone|everyone|the\s+public)\b/i,
];

// ─── 腿② 个体过度取用行为（中文）──────────────────────────────
const B_ZH = [
  // ②-a 无歧义多用动词（多养/多捕/多采/多抽/多排/多占/多砍/多挖/多开采）
  /多(?:养|捕|采|抽|排|占|砍|挖|踩|伐|牧|渔|钓|猎|捡|开采|排污|倾倒)(?!经营)/,
  // ②-b 行为主体×多(种|养|捕|…)——「我们村多种一季稻」；防「多种经营/多种原因」误配
  /(?:村|户|家|人|厂|船|车|公司|企业|农户|渔民|牧民|每户|每家|各村|各户)[^。，！？；\n]{0,4}(?:多种|多养|多捕|多抽|多排|多占|多开|多砍|多挖|多拿)(?!经营)/,
  // ②-b2 想方设法/拼命×多×动作（拼命多发广告/想方设法多占）
  /(?:想方设法|变着法子|变着法|使尽办法|拼命|竭力)(?:地)?多?[^。，！？；\n]{0,4}(?:占|拿|用|采|捞|停|发|做|干|放|捕)/,
  // ②-b3 尽量/尽可能(地)多×取用动词（尽可能多地放牧/尽量多开采）
  /(?:尽可能|尽量|尽可能多|竭力)(?:地)?多?(?:放牧|捕捞|采伐|开采|抽取|排放|占用|耕种|种植|养|捕|采|抽|排|占)/,
  // ②-c 动词+得多（采得多/占得多）
  /(?:养|捕|采|抽|排|占|拿|用)得(更)?多/,
  // ②-d 加大/扩大/增加×（捕捞|放牧|采伐|开采|抽取|排放|占用|耕种|种植）
  /(?:加大|扩大|增加|提升)(?:了)?(?:捕捞|放牧|采伐|开采|抽取|排放|占用|耕种|种植|用水|取水)(?:量|强度|规模|额度)?/,
  // ②-e 过度/超量/超载/无序×（放牧|捕捞|采伐|开采|抽取|排放|占用|耕种|种植）
  /(?:过度|超量|超载|无度|无序)(?:的)?(?:放牧|捕捞|采伐|开采|抽取|排放|占用|耕种|种植|用水)/,
  // ②-f 长时间占/霸占/抢占/囤积（车位/资源类）
  /(?:长时间|长期|一直)(?:占|停|用)|霸占|抢占|囤积/,
];

// ─── 腿② 个体过度取用行为（英文）──────────────────────────────
const B_EN = [
  // ②-a (each|every|all)×动词×more/harder/extra（含 as many extra 形）
  /\b(?:each|every|all)\s+(?:\w+\s+){0,4}(?:adds?|added|expands?|expanded|increases?|increased|pumps?|pumped|fishes?|fished|graze[ds]?|grazed|takes?|took|draws?|drew|discharges?|discharged|dumps?|emits?|catches?|caught)\s+(?:as\s+)?(?:many\s+)?(?:more|harder|extra)\b/i,
  // ②-a2 (each|every|all)×动词×as much/many（grabs as much bandwidth）
  /\b(?:each|every|all)\s+(?:\w+\s+){0,4}(?:grabs?|grabbed|takes?|took|uses?|used|draws?|drew)\s+as\s+(?:much|many)\b/i,
  // ②-b (expanded|increased|intensified) its/their (catch|harvest|extraction|pumping)
  /\b(?:expanded|expand|increased|increase|intensified)\s+(?:its|their)\s+(?:catch|harvest|output|extraction|pumping|grazing|operations|use)\b/i,
  // ②-c 过度开发族动词（仅与①③共现时承重）
  /\b(?:overgraze|overgrazing|overfish|overfishing|overuse|over[\s-]harvest(?:ing)?|over[\s-]extract(?:ing|ion)?)\b/i,
  // ②-d 占用族
  /\b(?:occupy|occupying|occupies|hog|hogging|hoarding|hoards)\b/i,
];

// ─── 腿③ 个体理性化/成本扩散断言（中文）──────────────────────
const C_ZH = [
  // ③-a 自我获益断言
  /(?:自己|自家|本人|咱们)(?:就)?(?:多挣|多赚|多得|多拿|多收)/,
  /多(?:一季|一笔|一份|一茬|一个)(?:的)?(?:收入|进项|收成|钱)/,
  /(?:划算|占便宜|捞一把|得好处|有好处|捞了便宜|讨了便宜)/,
  /(?:不占白不占|不用白不用|不拿白不拿|不采白不采|不捞白不捞|便宜不占|谁节省谁吃亏|不省白不省)/,
  /(?:法不责众|别人也(?:这么|这样)(?:干|做|占|拿|用)|人人都(?:这么|这样)(?:干|做|占))/,
  // ③-b 成本扩散/共同承担断言
  /(?:大家一起|大家|共同|全体|全社会|全城|全村|全市|全县|所有人|人人)(?:用户|成员|村民|居民|国家|船东|牧户|企业)?(?:一起)?(?:承担|承受|扛|分担|分摊|买单)/,
  /(?:成本|代价|损失|苦果|后果)(?:大家|全体|人人|所有人)?(?:一起)?(?:摊|付|扛|承担|承受)/,
  /(?:最后|到头来|久而久之)(?:谁都|谁也|人人)(?:别想|跑不掉|躲不掉|承担|受损)/,
  /谁也别想|谁也跑不了|谁都跑不掉/,
  // ③-c 认可/合理化断言
  /(?:是|也是|算是)(?:理性|合理|明智|正当)的?/,
  /(?:理性选择|理性决策|理所当然|本就该|没什么问题|并没做错|选择没错)/,
  /(?:这样|这么做|如此)(?:效率|配置)(?:最高|最优|最好)/,
  /(?:资源配置|市场安排|制度安排)(?:最优|最合理|效率最高)/,
];

// ─── 腿③ 个体理性化/成本扩散断言（英文）──────────────────────
const C_EN = [
  // ③-a 自我获益断言
  /\b(?:earns?|earned|gains?|gained|profits?|profited)\s+(?:more|most|extra)\b/i,
  /\b(?:each|every)\s+(?:\w+\s+){0,8}(?:earns?|gains?|profits?|comes?\s+out\s+ahead)\b/i,
  /\bsaves?\s+on\s+(?:\w+\s+){0,4}costs?\b/i,
  /\bmight\s+as\s+well\b/i,
  /\bno\s+reason\s+to\s+hold\s+back\b/i,
  /\bcheaper\s+for\s+(?:each|every|me|him|her|them)\b/i,
  /\bfirst[\s-]come\b/i,
  // ③-b 成本扩散断言
  /\b(?:cost|costs|damage|pollution|burden|losses)\s+(?:falls?|fall|is|are)\s+on\s+(?:everyone|all|society|the\s+public|others|the\s+rest)\b/i,
  /\b(?:cost|costs|damage|burden|losses|problem)\s+(?:that\s+)?everyone\s+(?:shares?|bears|carries)\b/i,
  /\beveryone\s+(?:shares?|bears|carries)\s+the\s+(?:cost|burden|damage|consequences)\b/i,
  /\bshared\s+by\s+all\b/i,
  /\beveryone['\u2019]?s?\s+problem\b/i,
  /\bevery\s+(?:viewer|user|citizen|resident|member|country|player|fisher|farmer|family|household)['\u2019]?s?\s+problem\b/i,
  /\bsocialized\b/i,
  /\bfalls?\s+on\s+(?:everyone|all\s+of\s+us|society)\b/i,
  // ③-c 认可/合理化断言
  /\b(?:rational|reasonable|sensible|smart)\s+(?:choice|move|thing|call)\b/i,
  /\bthat\s+was\s+(?:the\s+)?rational\b/i,
  /\bit\s+(?:makes|made)\s+sense\s+for\s+(?:each|every)\b/i,
];

// ─── [r315] 数字公地/免费额度族（现代共享资源新措辞家族）────────────
// 零命中探针 scripts/round-315/probe-candidates.js：存量腿对
// 「免费额度/公共WiFi/开源镜像/共享充电桩 × 多抢多薅多蹭批量抓取 ×
// 不抢白不抢/抢到就是赚到/手快有手慢无」8/8 全穿透，良性 10/10
// 零误伤。平行常量 + concat 合并不动存量腿。
// 腿①数字/现代共享资源锚点（中文）
const A_ZH3 = [
  // ①-f1 显式数字公族复合词
  /(?:数字公地|网络公地|信息公地|数据公地|公共数据|公共平台|开源社区|共享经济|免费额度|限免额度|公益额度|公共带宽|公共算力|免费接口|公共接口|公共充电桩|免费停车场|公共停车场)/,
  // ①-f2 修饰语×数字资源（免费额度/开源镜像/共享充电桩；API/WiFi 大小写不敏感——
  // gate 路径的 _normText 会把 ASCII 小写化，缺 i 标志会漏「免费API」形）
  /(?:免费|限免|公益|开放|公共|共享|开源|白给)[^。，！？；\n]{0,8}(?:额度|流量|宽带|网速|算力|接口|API|镜像|数据库|网盘|充电桩|WiFi|wifi|无线网|车位|名额|带宽)/i,
  // ①-f3 数字资源×归属/供应形（额度每月清零前不限量/带宽是共享的）
  /(?:额度|流量|宽带|算力|接口|镜像|网盘|数据库|充电桩)[^。，！？；\n]{0,6}(?:是|属于|归)?(?:免费|白给|白拿|不要钱|大家共用|共享|公共|开放|人人|谁都可以|不限量|无限量|管够|管饱)/,
  // ①-f4 赠送来源族（每月赠送的免费流量/注册送的额度）
  /(?:每月|每天|每周|会员|注册|签到|邀请|新用户)(?:赠送|送|赠|领|可得|白给)(?:的)?[^。，！？；\n]{0,4}(?:额度|流量|时长|积分|券)/,
];

// 腿①数字/现代共享资源锚点（英文）
const A_EN3 = [
  /\b(?:digital\s+commons|data\s+commons|information\s+commons|public\s+data|open[- ]source\s+community|shared\s+economy|free\s+(?:tier|allowance|quota|credits?|API|Wi-?Fi|parking|charging))\b/i,
  /\b(?:free|public|shared|open|unlimited)\b[^.]{0,30}\b(?:allowance|quota|credits?|bandwidth|API|endpoint|mirror|database|storage|compute|Wi-?Fi|parking|charging|tier)\b/i,
  /\b(?:allowance|quota|credits?|data|minutes|bandwidth)\b[^.]{0,30}\b(?:expires?|expired|roll\s+over|use\s+it\s+or\s+lose\s+it)\b/i,
];

// 腿②数字过度取用行为（中文）
const B_ZH3 = [
  // ②-g1 多用数字动词（多下/多抢/多刷/多蹭/多领/多囤/多薅/多占/多分）
  /多(?:下|抢|刷|蹭|领|囤|薅|注册|申请|爬|抓|调用|瓜分|占|分)(?!人)/,
  // ②-g2 薅羊毛/脚本族（含秒杀/抢券/批量注册/爬虫/黄牛；薅X羊毛允许间隔≤3字）
  /(?:薅羊毛|薅[^。，！？；\n]{0,3}羊毛|抢券|秒杀|脚本抢|脚本刷|脚本党|机器人(?:抢|刷|薅|注册)|批量(?:注册|申请|领取|抢|爬|调用|薅|抓取)|外挂(?:抢|刷|薅)|黄牛|刷单|刷量|爬虫|抓取)/,
  // ②-g3 尽力取用族（拼命抢/想方设法薅/轮着请求）
  /(?:拼命|想方设法|变着法|使劲|全力|轮着)(?:地)?(?:抢|薅|囤|刷|蹭|领|申请|请求|调用|占)/,
];

// 腿②数字过度取用行为（英文）
const B_EN3 = [
  /\b(?:each|every|all|everyone|everybody)\s+(?:\w+\s+){0,4}(?:downloads?|downloaded|scrapes?|calls?|requests?|hoards?|stockpiles?|grabs?|grabbed|takes?|took|uses?|used|draws?|drew)\s+(?:as\s+)?(?:much|many)\b/i,
  /\b(?:bot|bots|script|scripts|scraper|scrapers|macro)\s+(?:sweep|sweeps|swept|grab|grabs|grabbed|clean|cleans|cleaned|drain|drains|drained)\b/i,
  /\b(?:stock|stocks|stocked|bulk|batch)\s+up\s+on\b/i,
];

// 腿③数字公地合理化断言（中文）
const C_ZH3 = [
  // ③-d1 不X白不X族（含存量动词的复刻，独立链需要自足）
  /(?:不蹭白不蹭|不领白不领|不抢白不抢|不薅白不薅|不囤白不囤|不刷白不刷|不下载白不下载|不用白不用|不占白不占)/,
  // ③-d2 抢到赚到/手快族
  /(?:抢到就是赚到|薅到就是赚到|手快有|先到先得|能薅一毛是一毛|薅一分是一分)/,
  // ③-d3 清零作废族（月底清零/过期作废/不用作废）
  /(?:月底清零|过期作废|额度清零|清零作废|不用作废|到期作废|免费不用)/,
];

// 腿③数字公地合理化断言（英文）
const C_EN3 = [
  /\bmight\s+as\s+well\s+(?:stock|grab|take|hoard)\s+up\b/i,
  /\bif\s+it(?:'?s|\s+is)?\s+free\s*,?\s+(?:so\s+)?(?:take|grab|use)\s+(?:as\s+much\s+)?(?:as\s+you\s+can|all\s+you\s+can|all\s+of\s+it)\b/i,
  /\b(?:grab|take|get)\s+it\s+before\s+(?:it(?:'?s|\s+is)?\s+)?gone\b/i,
  /\bfirst\s+come\s*,?\s+first\s+served\b/i,
];

// 双腿距离窗（腿①×腿② 与 腿②×腿③ 分别落在窗内）
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（讨论本族名称的教学/定义句）────────────────
const CONCEPT_ZH = /(?:公地悲剧|公共地悲剧|集体行动(?:的)?困境|哈丁|哈定|奥斯特罗姆|共同池资源|公共池资源|共有池资源|公共资源(?:的)?(?:治理|悖论|困境))/;
const CONCEPT_EN = /\btragedy\s+of\s+the\s+commons\b|\bcommons\s+(?:problem|tragedy|dilemma|paradox)\b|\bHardin\b|\bOstrom\b|\bcommon[\s-]pool\s+resource\b|\bcollective[\s-]action\s+(?:problem|dilemma|trap)\b/i;

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

// 三腿命中的否定前缀检查（「不是公共的/并没有多养/不等于自己多挣」不计）。
// 窗口取匹配前 8 字符，允许否定词与被否定短语间插入少量字。
const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于)[^。，！？；\n]{0,5}$/;
// 匹配 span 内部的否定词（「效率并未提升」式副词内嵌否定）。
// 注意：「没有围栏/无人看管」是资源属性陈述而非断言否定（草原没有围栏
// 恰是公地结构描述），先剥离这类复合属性再查否定。
const NEG_COMPOUND_ZH = /(?:没有|无|没人|无人)(?:围栏|主|人管|看管|人负责|人认领|人负责)/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于)/;

// 英文否定（EN 无负例注入语言侧区分，统一启用）：span 内否定 +
// 匹配前 45 字符窗口内的否定（is not shared / did not expand …）。
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bnot\s+shared\b|\bnot\s+free\b/i;
const NEG_BEFORE_EN = /(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

// 单条匹配是否有效（否定前缀/内部否定均拦下；ZH 与 EN 均查）
function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  const stripped = x.raw.replace(NEG_COMPOUND_ZH, '□'); // 「没有围栏」类资源属性不算否定
  if (NEG_INSIDE.test(stripped) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (NEG_BEFORE.test(before)) return false;
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

/**
 * 三腿配对：腿①×腿② 与 腿②×腿③ 均落在窗内即成一签名
 * （腿②取用行为是桥：把资源属性和理性化断言连起来）。
 */
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      a: R.A_ZH || A_ZH, b: R.B_ZH || B_ZH, c: R.C_ZH || C_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      a: R.A_EN || A_EN, b: R.B_EN || B_EN, c: R.C_EN || C_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
    // [r315] 数字公地/免费额度族（新措辞家族，独立链）
    {
      a: R.A_ZH3 || A_ZH3, b: R.B_ZH3 || B_ZH3, c: R.C_ZH3 || C_ZH3,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      a: R.A_EN3 || A_EN3, b: R.B_EN3 || B_EN3, c: R.C_EN3 || C_EN3,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const { a, b, c, win, lang } of langs) {
    const am = collect(text, a, true);
    const bm = collect(text, b, true);
    const cm = collect(text, c, true);
    for (const x of am) {
      for (const y of bm) {
        if (dist(x, y) > win) continue;
        let best = null;
        for (const z of cm) {
          const d = dist(y, z);
          if (d > win) continue;
          if (!best || d < best.d) best = { d, z };
        }
        if (best) sigs.push({
          lang, commons: x.raw, overuse: y.raw, rationale: best.z.raw, dist: best.d,
        });
      }
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectTragedyOfCommons(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（公地悲剧/tragedy of the commons 教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'tragedy_of_commons',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '「' + x.commons + '」×「' + x.overuse + '」×「' + x.rationale + '」'
      : '"' + x.commons + '" x "' + x.overuse + '" x "' + x.rationale + '"')),
    details: s.lang === 'zh'
      ? '公地悲剧(' + sigs.length + '处: 「' + s.commons + '」共享资源上「' + s.overuse + '」的个体取用被当作理性选择——「' + s.rationale + '」，个体理性汇成集体耗竭)(zh)'
      : 'tragedy of the commons(' + sigs.length + 'x: individual extraction "' + s.overuse + '" on shared "' + s.commons + '" rationalized — "' + s.rationale + '")(en)',
    guidance: '不要把共享/无主资源上的个体竞相取用当作可接受的理性选择（这片草场是公共的，每家多养几只羊自己就多挣一份，退化大家一起承担 / 地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏 / the pasture is shared, so each family that adds more cattle earns more、the aquifer is free, so every farm that pumps more this season gains）：每一户的取用决策单独看都成立，合起来却耗竭所有人依赖的资源——「自己多挣、成本大家一起扛」是把外部化当成效率。请补上资源侧论证：产权与配额安排（确权/承包/轮捕/休渔/收费/排放上限）、取用总量与再生速行的关系、成本是否真的由全体成员均摊；若描述的是已发生的退化案例，结论应指向治理安排而非默许个体理性。',
    tags: ['economics', 'commons', 'shared-resources', 'collective-action', 'externalities', 'inference'],
  };
}

module.exports = {
  detectTragedyOfCommons,
  __internals: () => ({
    A_ZH, A_EN, B_ZH, B_EN, C_ZH, C_EN,
    A_ZH3, A_EN3, B_ZH3, B_EN3, C_ZH3, C_EN3,
    CONCEPT_ZH, CONCEPT_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
