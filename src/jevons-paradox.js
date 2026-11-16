/**
 * src/jevons-paradox.js — 「Jevons 悖论 / 回弹效应」检测器
 * （r364 新建：econ_reasoning_gate 聚合族第 21 子族 / 插件层第 26 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r364 立项探针（coordination/agent4/probes/r364-probe-jevens.js，v6.8.186
 *   基线 gate() 全量 findings 口径）实测：存量 econ 21 子族 + 257 维度对
 *   「效率提升 → 总消耗必降 / 资源问题自动解决 / 多用来摊薄」攻击形 5/11
 *   穿透——存量 absolute_claim 等只收「必然/肯定/一定」绝对化措辞，对
 *   「自然就降下来了」「节水全靠技术改进」这类非绝对形零覆盖。
 *   海外扫描空返（arXiv parse-fail、GitHub repos 0、Semantic Scholar
 *   空返，原始证据 coordination/agent4/scout/*20261116-140831*），按
 *   制度经济学既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自经济学标准文献：
 *   Jevons, W.S. (1865) *The Coal Question*——「燃油效率的提高只会
 *   减少单位油耗，总体上却因使用量扩张而增加消耗」；Saunders, H.D.
 *   (1992) 将其形式化为 Khazzoom–Brookes postulate；现代文献通称
 *   rebound effect（直接回弹 / 间接回弹 / backfire 全回弹）。
 *
 * 辨别的族：Jevons 悖论 / 回弹效应（Jevons paradox / rebound effect）——
 * 文本先给出**效率提升的在场指称**（能效提高 / 更节能 / 单耗下降 /
 * fuel efficiency improves / more efficient），再给出**把效率增益
 * 直接兑现为总量下降或多用合理化的断言**：
 *   腿②a 总量幻觉（TOTALDOWN）：总体消耗/总需求 + 必然/自然/随之下降，
 *     或「不用担心总量问题」「资源问题自然解决」的免忧形；
 *   腿②b 多用合理化（USEMORE）：因为单位成本降了/效率高了，所以多用、
 *     放开用、把省下的成本赚回来、摊薄、把效率红利吃回来。
 *   只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。
 *   提升灌溉效率就能减少总用水量，节水全靠技术改进。
 *   因为机器效率提高了，单位成本降了，所以多用一些把省下的成本赚回来。
 *   Improving fuel efficiency will necessarily reduce total gasoline consumption.
 *   Once irrigation efficiency improves, total water use is bound to fall.
 *   Since the machine is more efficient, we should run it more to make back the savings.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：资源效率是气候、
 * 能源、水资源、原材料政策的核心杠杆，而「效率上去总量自然下来」
 * 是其中最顽固的推理谬误——它把微观层面真实的单位改进，未经总量
 * 结构检验就直接放大为宏观承诺。它的毒性在于它听起来像审慎的成本
 * 意识：先承认一个真实的效率事实，再宣布「所以不用担心总量」，
 * 于是总量控制、配额、定价都可以省掉，讨论只能在「单位更省了」
 * 的层面上进行。与正当推理的界线很清楚：单位层面的成本/排放陈述、
 * 点名 Jevons 悖论或回弹效应的教学句、以及指出回弹可能抵消增益的
 * 纠正句，都是正当做法，一律豁免。
 *
 * 与既有维度的边界（r364 归因，探针 + 边界实测）：
 *   · absolute_claim 等绝对化维度只收「必然/肯定/一定」措辞——本族
 *     收非绝对形（自然就降下来了 / 随之下降），两者是超集/子集关系，
 *     共现句由 absolute_claim 先拦（探针实测），本族补其盲区；
 *   · zero_price_effect（r313）判**零价格信号 × 需求失真**（免费 →
 *     蜂拥多拿）——腿①要求价格为零的显式陈述；本族腿①是效率提升，
 *     腿②是总量下降断言或多用摊薄，不涉价格为零；
 *   · opportunity_cost_neglect（r336）判**不作为被记为零成本**——本族
 *     方向相反：因为单位变更便宜了而多用/断言总量下降；
 *   · tragedy_of_commons（r238）判**共享资源过度取用的个体合理化**
 *     （先占先得/不捞白不捞）——本族不涉产权结构，判效率—总量推理；
 *   · mental_accounting 判**心理账户分类**；本族不涉账户归类。
 *
 * 判据（双腿近距共现 + 三组豁免，缺一不判）：
 *   ① 腿① EFF 效率提升在场——ZH 名词改进族/比较级族、EN 效率名词族/
 *     efficiency improves 族/more efficient 族/单耗下降族/uses less
 *     … per 族（详见下方常量）；
 *   ② 腿② TOTALDOWN 总量下降断言（ZH 三形 / EN 五形）或 USEMORE 多用
 *     摊薄合理化（ZH 三形 / EN 四形）任一；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），方向不限；
 *   ④ 腿②查强否定前缀守卫（「总量不一定会下降」= 有上升可能 → 失配）；
 *   ⑤ 豁免 A 概念教学（回弹效应/Jevons 悖论/rebound effect 被点名）；
 *   ⑥ 豁免 B 纠正句（抵消/未必/不一定/不能只靠/offset/not
 *     necessarily——指出效率增益不自动兑现为总量下降的正当陈述）；
 *   ⑦ 单位层面陈述无腿②天然不判（单灯功耗更低/单位成本下降/uses
 *     less fuel per kilometer 均零误伤）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一个效率改进主张（「主管
 * 认为换灯能省电费」是事实陈述），也可能是正确的单位成本描述。verify
 * 的语义是「这段话把效率增益直接兑现成了总量下降或多用理由，先核对
 * 总量结构与回弹证据，再决定是否采信这个总量判断」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 单位层面陈述（单灯功耗更低/单位成本下降/uses less fuel per km）；
 *   · 概念教学（回弹效应是指效率提升被使用量增加抵消的现象）；
 *   · 纠正句（技术进步不一定带来总量下降/回弹可能抵消效率增益）；
 *   · 疑问句（效率提升真的能降低总排放吗？——无断言腿②）；
 *   · 近邻维度领地（absolute_claim 绝对化、zero_price_effect 零价格
 *     需求失真、opportunity_cost_neglect 不作为零成本、tragedy_of_
 *     commons 过度取用个体合理化）。
 */
'use strict';

// ─── 腿① EFF 效率提升在场 ───────────────────────────────────────
// Z1 名词 + 改进动词族（能效/能耗强度/单耗/节能水平/效率 + 提高/下降等，
//    两序皆收：「能效提上去」「降低了能耗强度」「机器效率提高了」）
const EFF_NOUN_ZH = /(?:能效|能源效率|能量效率|热效率|转化效率|利用效率|运行效率|发电效率|灌溉效率|燃烧效率|能耗强度|能源强度|单位能耗|单耗|节能水平|效率)[^。，！？；\n]{0,6}(?:提高|提升|改进|改善|上升|增长|越高|下降|降低|减少|降了|降下来|走低|变低|更低|变优|更优|更好)/;
const EFF_NOUN_REV_ZH = /(?:提高|提升|改进|改善|降低|减少|优化|上[去来])[^。，！？；\n]{0,4}(?:能效|能源效率|能耗强度|单耗|单位能耗|节能水平|效率)/;
// Z2 比较级族（更节能/越来越省电/比白炽灯省电/效率更高）
const EFF_COMP_ZH = /(?:更|越来越|日益)(?:节能|省电|省油|节水|高效|有效率)|(?:比|较)[^。，！？；\n]{0,12}(?:节能|省电|省油|节水)|效率(?:更|越发)?高/;
// Z3 裸特征族（省电/节能作为产品特征陈述——腿②仍是判别主力，
//    「这款空调很省电」无腿②不判）
const EFF_BARE_ZH = /省电|节能|能效/;

const EFF_ZH_GROUPS = [
  ['EFF_NOUN_ZH', [EFF_NOUN_ZH]],
  ['EFF_NOUN_REV_ZH', [EFF_NOUN_REV_ZH]],
  ['EFF_COMP_ZH', [EFF_COMP_ZH]],
  ['EFF_BARE_ZH', [EFF_BARE_ZH]],
];
const EFF_ZH = [EFF_NOUN_ZH, EFF_NOUN_REV_ZH, EFF_COMP_ZH, EFF_BARE_ZH];

// E1 资源效率名词族（fuel/energy/water efficiency）
const EFF_KW_EN = /\b(?:fuel|energy|water|resource|material|labor|labour|cost)\s+efficienc(?:y|ies)\b/i;
// E2 efficiency improves/gains 族
const EFF_IMPROVE_EN = /\befficienc(?:y|ies)\s+(?:gains?|improvements?|improves?|improved|increases?|rose|rises?|is\s+higher|are\s+higher)\b/i;
// E3 more efficient / higher efficiency 族
const EFF_MORE_EN = /\bmore\s+efficient\b|\bhighe(?:r|st)\s+efficienc/i;
// E4 单耗/低价下降族（energy intensity declines / per-unit cost falls /
//    cheaper per unit——回弹效应的价格侧触发）
const EFF_INTENSITY_EN = /\benergy\s+intensity\s+(?:declines?|falls?|drops?|decreases?|fell|dropped)\b|\bper[-\s]?unit\s+(?:cost|energy|use|consumption|emissions?)\s+(?:falls?|drops?|declines?|fell|dropped|is\s+lower|decreases?)\b|\bcheaper\s+per\s+unit\b|\bcosts?\s+less\s+per\b/i;
// E5 uses less … per / lowers … per / saves 族
const EFF_LESSPER_EN = /\buses?\s+less\s+(?:fuel|energy|water|power|electricity|gas|gasoline|resources?)\s+per\b|\blowers?\s+(?:electricity|fuel|energy|water|power)\s+(?:use\s+|consumption\s+)?per\b|\bsaves?\s+(?:fuel|energy|electricity|water|gas)\b/i;

const EFF_EN_GROUPS = [
  ['EFF_KW_EN', [EFF_KW_EN]],
  ['EFF_IMPROVE_EN', [EFF_IMPROVE_EN]],
  ['EFF_MORE_EN', [EFF_MORE_EN]],
  ['EFF_INTENSITY_EN', [EFF_INTENSITY_EN]],
  ['EFF_LESSPER_EN', [EFF_LESSPER_EN]],
];
const EFF_EN = [EFF_KW_EN, EFF_IMPROVE_EN, EFF_MORE_EN, EFF_INTENSITY_EN, EFF_LESSPER_EN];

// ─── 腿②a TOTALDOWN 总量下降断言 ────────────────────────────────
// T1 总量关键词 + 下降动词近距（必然/肯定等限定词可选——非绝对形
//    「自然就降下来了」正是存量维度的盲区）。总量词两序皆收
//    （「总用水量」与「能源消耗总量」同判）。
const TOTALDOWN_ZH = /(?:总(?:消耗量|需求量|用水量|用能量|排放量|排放|碳排放|碳排|能源消耗|用电量|资源消耗|耗电量|耗费量|需求|消耗|用量)|总(?:体|整体)[^。，！？；\n]{0,4}(?:消耗|需求|用量)|全社会(?:能源|用电|用水|资源)(?:消耗|需求|用量)|(?:能源|电力|用电|用水|资源|粮食|原材料)(?:消耗|使用|消费|开采)?总量)[^。，！？；\n]{0,8}(?:必然|一定|肯定|势必|自然而然|自然|随之|就会|也会)?[^。，！？；\n]{0,4}(?:下降|降低|减少|降下来|下滑|缩水)/;
// T2 免忧形（不用担心总量问题 / 资源问题自然解决 / 总量会自己降下来）
const TOTALDOWN_RELIEVE_ZH = /(?:不用|无须|无需|不必|不须)(?:担心|愁|担忧|操心|在乎)[^。，！？；\n]{0,8}(?:总量|总消耗|总需求|总用量)|(?:资源|能源|总量)(?:问题)?(?:自然|就|随之)?(?:解决|化解|迎刃而解)|总量(?:自然|随之|就|会自己|自己)?(?:降下来|下降|降低|减少)/;
// T3 动词前置 + 总量词后随形（就能减少总用水量 / 随之下降的总需求）——
//    下降动词后 6 字内必须出现总量词，防「故障就减少了」类非总量断言
const TOTALDOWN_FOLLOW_ZH = /(?:随之|自然|就|自动|才能)[^。，！？；\n]{0,4}(?:下降|降低|减少|降下来|走低)[^。，！？；\n]{0,6}(?:总(?:消耗量|需求量|用水量|用能量|排放量|排放|碳排放|碳排|能源消耗|用电量|资源消耗|耗电量|耗费量|需求|消耗|用量)|总体|整体[^。，！？；\n]{0,4}(?:消耗|需求|用量)|(?:能源|电力|用电|用水|资源|粮食|原材料)(?:消耗|使用|消费|开采)?总量|全社会(?:能源|用电|用水|资源)(?:消耗|需求|用量))/;

const TOTALDOWN_ZH_GROUPS = [
  ['TOTALDOWN_ZH', [TOTALDOWN_ZH]],
  ['TOTALDOWN_RELIEVE_ZH', [TOTALDOWN_RELIEVE_ZH]],
  ['TOTALDOWN_FOLLOW_ZH', [TOTALDOWN_FOLLOW_ZH]],
];
const TOTALDOWN_ZH_ARR = [TOTALDOWN_ZH, TOTALDOWN_RELIEVE_ZH, TOTALDOWN_FOLLOW_ZH];

// TE1 total consumption will fall / is bound to fall 族
const TOTALDOWN_WILL_EN = /\btotal\s+(?:consumption|use|demand|usage|energy\s+use|fuel\s+use|water\s+use|emissions)\s+(?:will|would|shall|must|is\s+bound\s+to|going\s+to)\s+(?:certainly|definitely|surely|automatically|naturally)?\s*(?:fall|drop|decline|decrease|shrink|go\s+down|come\s+down)\b/i;
// TE2 reduces/lowers overall (aggregate/total) consumption 族
// （total gasoline consumption / aggregate energy use 等中间名词可选）
const TOTALDOWN_REDUCE_EN = /\b(?:reduce|reduces|reducing|lower|lowers|cut|cuts|decrease|decreases)\s+(?:overall|aggregate|total)\s+(?:\w+\s+)?(?:consumption|use|demand|usage)\b/i;
// TE3 overall consumption will fall 族（overall power consumption 中间名词可选）
const TOTALDOWN_OVERALL_EN = /\boverall\s+(?:\w+\s+)?(?:consumption|use|demand|usage)\s+(?:will|would|must|is\s+bound\s+to)\s+(?:certainly|definitely|surely|automatically|naturally)?\s*(?:fall|drop|decline|decrease|go\s+down)\b/i;
// TE4 免忧族（no need to worry about total / takes care of itself）
const TOTALDOWN_RELIEVE_EN = /\bno\s+need\s+to\s+worry\s+about\s+(?:total|overall|aggregate)\s+(?:consumption|demand|use)\b|\btotal\s+(?:demand|consumption|use)\s+(?:will\s+)?(?:take\s+care\s+of\s+itself|falls?\s+on\s+its\s+own)\b/i;
// TE5 自动下降族（will come down on its own / automatically reduces total）
const TOTALDOWN_AUTO_EN = /\b(?:automatically\s+)?(?:reduces?|lowers?|brings\s+down|cuts?)\s+(?:total|overall|aggregate)\s+(?:consumption|demand|use)\b|\btotal\s+(?:consumption|demand|use)\s+(?:will\s+)?(?:come|go)\s+down\s+on\s+its\s+own\b/i;

const TOTALDOWN_EN_GROUPS = [
  ['TOTALDOWN_WILL_EN', [TOTALDOWN_WILL_EN]],
  ['TOTALDOWN_REDUCE_EN', [TOTALDOWN_REDUCE_EN]],
  ['TOTALDOWN_OVERALL_EN', [TOTALDOWN_OVERALL_EN]],
  ['TOTALDOWN_RELIEVE_EN', [TOTALDOWN_RELIEVE_EN]],
  ['TOTALDOWN_AUTO_EN', [TOTALDOWN_AUTO_EN]],
];
const TOTALDOWN_EN_ARR = [TOTALDOWN_WILL_EN, TOTALDOWN_REDUCE_EN, TOTALDOWN_OVERALL_EN, TOTALDOWN_RELIEVE_EN, TOTALDOWN_AUTO_EN];

// ─── 腿②b USEMORE 多用摊薄合理化 ────────────────────────────────
// U1 赚回来/摊薄族（把省下的成本赚回来 / 摊薄成本 / 把效率红利吃回来）
const USEMORE_MAKEBACK_ZH = /(?:把|将)(?:省下|节约|节省|效率)(?:的|下来)?[^。，！？；\n]{0,8}(?:赚|挣|吃|拿|补|搂)回来|摊薄(?:成本|开销|投入|费用)|(?:把|将)?效率红利[^。，！？；\n]{0,4}(?:吃|捞|拿)回来|不用白不用/;
// U2 便宜/高效 → 多用 推理链（成本低了不如多用 / 效率提高了尽管放开用）
const USEMORE_RATIONALE_ZH = /(?:成本(?:更)?(?:低|便宜|下降|降了)|效率(?:提高|提升|更高|上去了)|更节能|更省)[^。，！？；\n]{0,14}(?:不如|不妨|可以|应该|索性|干脆|尽管|放心|尽量|尽可能|敞开)[^。，！？；\n]{0,8}(?:多|尽情|放开|敞开)(?:用|消耗|开采|抽|生产|运行|跑|采购|买|开工|种植|养|捕捞|排放)|(?:既然|因为)[^。，！？；\n]{0,16}(?:便宜|高效|效率高|成本低)[^。，！？；\n]{0,10}(?:多|尽情|放开)(?:用|消耗|跑|生产)/;
// U3 效率红利族（效率上去了就放开用 / 节能了不妨多用）
const USEMORE_DIVIDEND_ZH = /(?:效率|能效|节能)(?:上去|提高|提升|见成效)了?[^。，！？；\n]{0,10}(?:就|不妨|可以|尽管)[^。，！？；\n]{0,6}(?:放开|尽量|尽可能|多)(?:用|消耗|跑|生产|开工)/;

const USEMORE_ZH_GROUPS = [
  ['USEMORE_MAKEBACK_ZH', [USEMORE_MAKEBACK_ZH]],
  ['USEMORE_RATIONALE_ZH', [USEMORE_RATIONALE_ZH]],
  ['USEMORE_DIVIDEND_ZH', [USEMORE_DIVIDEND_ZH]],
];
const USEMORE_ZH_ARR = [USEMORE_MAKEBACK_ZH, USEMORE_RATIONALE_ZH, USEMORE_DIVIDEND_ZH];

// UE1 run it/them more to make back/recoup the savings 族
const USEMORE_MAKEBACK_EN = /\b(?:run|use|operate|consume|burn)\s+(?:it\s+|them\s+)?(?:more|harder|longer|extra)\s+to\s+(?:make\s+back|recoup|recover|recapture|justify)\s+(?:the\s+)?(?:savings?|efficiency\s+gains?|investment|costs?)\b|\bmake\s+back\s+the\s+(?:efficiency\s+)?(?:savings|gains)\b|\buse\s+more\s+to\s+(?:justify|make\s+back)\b/i;
// UE2 since it's cheaper/more efficient … might as well use as much as 族
const USEMORE_MIGHT_EN = /\bsince\s+it(?:'s|\s+is)\s+(?:now\s+)?(?:cheaper|more\s+efficient)\b[^.]{0,40}?\b(?:might|may)\s+as\s+well\s+(?:use|run|consume|buy)\s+(?:as\s+much\s+as|more)\b/i;
// UE3 cheaper per unit … use/consume more 族
const USEMORE_CHEAPER_EN = /\bcheaper\s+per\s+unit\b[^.]{0,40}?\b(?:use|consume|run|buy)\s+(?:more|as\s+much)\b/i;
// UE4 efficiency dividends … use freely 族
const USEMORE_FREELY_EN = /\befficiency\s+(?:dividends?|gains?)\b[^.]{0,40}?\b(?:use|consume|run)\s+(?:as\s+much\s+as\s+we\s+(?:like|want)|freely)\b/i;

const USEMORE_EN_GROUPS = [
  ['USEMORE_MAKEBACK_EN', [USEMORE_MAKEBACK_EN]],
  ['USEMORE_MIGHT_EN', [USEMORE_MIGHT_EN]],
  ['USEMORE_CHEAPER_EN', [USEMORE_CHEAPER_EN]],
  ['USEMORE_FREELY_EN', [USEMORE_FREELY_EN]],
];
const USEMORE_EN_ARR = [USEMORE_MAKEBACK_EN, USEMORE_MIGHT_EN, USEMORE_CHEAPER_EN, USEMORE_FREELY_EN];

// ─── 距离窗（效率提升 × 总量下降/多用摊薄）──────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：概念教学（点名 Jevons 悖论/回弹效应本身）───────────
const CONCEPT_ZH = /回弹效应|杰文斯|反弹效应|效率悖论/;
const CONCEPT_EN = /\brebound\s+effect\b|\bJevons\b|\bbackfire\s+effect\b/i;

// ─── 豁免 B：纠正句（指出效率增益不自动兑现为总量下降——这是本族
// 要教的判别动作本身）。注意「抵消」放纠正侧：多用 to offset the
// gains 的攻击形由 UE1 的 make back/recoup 族覆盖，不收 offset。
const CORRECT_ZH = /抵消|反超|不必然|未必|不一定|不见得|反而(?:可能|会|还)?(?:上升|增加|升高|更多)|不能自动|不能只靠|不能仅靠|仍需|还需要|必须配合|离不开|并非必然/;
const CORRECT_EN = /\boffset\b|\bnot\s+necessarily\b|\bnot\s+automatically\b|\bdoes\s+not\s+automatically\b|\bwarns?\b|\bno\s+guarantee\b|\bnot\s+guaranteed\b|\bmay\s+(?:even\s+)?(?:rise|increase|grow)\b|\bcan\s+(?:even\s+)?(?:rise|increase)\b/i;

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

// 强否定前缀：命中词前出现这些词，说明整个断言被否定（「总量不一定
// 会下降」= 有上升可能；「未必随之下降」= 不承认下降）。
const STRONG_NEG_ZH = /(?:并非|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not\s+automatically)\b/i;

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 12), idx);
  return STRONG_NEG_ZH.test(before);
}

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (STRONG_NEG_ZH.test(x.raw) || STRONG_NEG_EN.test(x.raw)) return false;
  if (negBeforeZh(text, x.idx)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  if (STRONG_NEG_EN.test(beforeEn)) return false;
  return true;
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

function resolveGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    if (Object.prototype.hasOwnProperty.call(R, name)) out.push(...(R[name] || []));
    else out.push(...defs);
  }
  return out;
}

// 签名收集：腿①效率提升 × 腿②（总量下降 ∪ 多用摊薄），两腿邻近共现，
// 方向不限（「效率高了所以多用」与「多用因为效率高了」同判）。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      eff: resolveGroups(R, EFF_ZH_GROUPS),
      total: resolveGroups(R, TOTALDOWN_ZH_GROUPS),
      use: resolveGroups(R, USEMORE_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      eff: resolveGroups(R, EFF_EN_GROUPS),
      total: resolveGroups(R, TOTALDOWN_EN_GROUPS),
      use: resolveGroups(R, USEMORE_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const effM = collect(text, L.eff, false);
    if (effM.length === 0) continue;
    const leg2M = collect(text, L.total, true).concat(collect(text, L.use, true));
    if (leg2M.length === 0) continue;
    for (const e of effM) {
      const t = leg2M.find(x => dist(x, e) <= L.win);
      if (!t) continue;
      sigs.push({ lang: L.lang, efficiency: e.raw, leg2: t.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.efficiency + '|' + s.leg2;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Jevons 悖论签名：效率提升 × 总量下降断言/多用摊薄合理化 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectJevonsParadox(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论 Jevons 悖论/回弹效应这个概念本身是正确判别）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（指出效率增益不自动兑现为总量下降的正当陈述）
  if ((R.CORRECT_ZH || CORRECT_ZH).test(text) || (R.CORRECT_EN || CORRECT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'jevons_paradox',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '效率提升「' + x.efficiency + '」× 总量/多用断言「' + x.leg2 + '」'
      : 'efficiency "' + x.efficiency + '" x total/more-use claim "' + x.leg2 + '"')),
    details: s.lang === 'zh'
      ? 'Jevons悖论(' + sigs.length + '处: 「' + s.efficiency + '」被直接兑现为「' + s.leg2 + '」——效率增益未经总量结构检验即断言总量下降或多用摊薄)(zh)'
      : 'jevons-paradox(' + sigs.length + 'x: "' + s.efficiency + '" is cashed out directly as "' + s.leg2 + '" — efficiency gains asserted to reduce total use or justify more use, without aggregate check)(en)',
    guidance: 'Jevons 悖论（Jevons 1865《The Coal Question》；Saunders 1992 Khazzoom–Brookes postulate；现代文献称 rebound effect）指效率提升降低的是单位消耗，总量却可能因使用量扩张而上升（直接回弹、间接回弹乃至 backfire 全回弹）。它的危害不在单位改进这个事实陈述（那可以用账目核实），而在紧随其后的第二动作：宣布「总需求自然就降下来了，不用担心总量」或「单位成本低了不如多用把省下的赚回来」——这一步把总量控制、配额与定价的要求全部免掉。正当做法是先核对总量结构与回弹证据（单位改进 × 使用量响应、间接效应、定价与配额是否仍在），再给出总量判断；单位层面的成本/排放陈述、点名 Jevons 悖论或回弹效应的教学句、以及指出回弹可能抵消效率增益的纠正句，都是正当做法。',
    tags: ['economics', 'resource-economics', 'jevons-paradox', 'rebound-effect', 'energy-policy', 'aggregate-reasoning'],
  };
}

module.exports = {
  detectJevonsParadox,
  __internals: () => ({
    EFF_NOUN_ZH, EFF_NOUN_REV_ZH, EFF_COMP_ZH, EFF_BARE_ZH,
    EFF_KW_EN, EFF_IMPROVE_EN, EFF_MORE_EN, EFF_INTENSITY_EN, EFF_LESSPER_EN,
    TOTALDOWN_ZH, TOTALDOWN_RELIEVE_ZH, TOTALDOWN_FOLLOW_ZH,
    TOTALDOWN_WILL_EN, TOTALDOWN_REDUCE_EN, TOTALDOWN_OVERALL_EN, TOTALDOWN_RELIEVE_EN, TOTALDOWN_AUTO_EN,
    USEMORE_MAKEBACK_ZH, USEMORE_RATIONALE_ZH, USEMORE_DIVIDEND_ZH,
    USEMORE_MAKEBACK_EN, USEMORE_MIGHT_EN, USEMORE_CHEAPER_EN, USEMORE_FREELY_EN,
    EFF_ZH, EFF_EN, TOTALDOWN_ZH_ARR, TOTALDOWN_EN_ARR, USEMORE_ZH_ARR, USEMORE_EN_ARR,
    EFF_ZH_GROUPS, EFF_EN_GROUPS, TOTALDOWN_ZH_GROUPS, TOTALDOWN_EN_GROUPS,
    USEMORE_ZH_GROUPS, USEMORE_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
