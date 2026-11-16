/**
 * src/carbon-leakage.js — 「碳泄漏 / 污染避难所」检测器
 * （r366 新建：econ_reasoning_gate 聚合族第 23 子族 / 插件层第 27 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r366 立项探针（coordination/agent4/probes/r366-probe-candidates.js，
 *   v6.8.188 pristine 基线）实测：存量 econ 22 子族 + 258 维度对
 *   「产业/排放转移到外部 → 本地或全球问题解决」攻击形 5/6 穿透
 *   （唯一非穿透条被既有维度代拦），良性 3/3 零误伤。同池候选：
 *   lump_of_labor 2/6、paradox_of_thrift 3/5、price_control 3/4、
 *   mercantilism 3/4、is_ought 0/2——碳泄漏穿透最高且与 r364 Jevons
 *   族构成清晰划界（Jevons 腿①=效率提升，本族腿①=空间转移）。
 *   海外扫描空返（GitHub repos total_count=0、arXiv parse-fail、
 *   Semantic Scholar 429 限流，原始证据
 *   coordination/agent4/scout/*20261116-172456*），按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自国际贸易与环境经济学
 *   标准文献：carbon leakage / pollution haven hypothesis（Copeland
 *   & Taylor 贸易与环境研究传统）——一地加严环境规制，高耗能高污染
 *   产能转移到规制更松的地区，本地排放下降而全球总排放未必下降。
 *
 * 辨别的族：碳泄漏 / 污染避难所（carbon leakage / pollution haven）——
 * 文本先给出**产能/排放/生产向外部转移的在场指称**（工厂迁到国外 /
 * 产业转移 / outsourced abroad / shifted overseas），再给出**把转移
 * 直接兑现为问题解决或排放下降的断言**：
 *   腿②a 解决幻觉（SOLVED）：本地或全球的环境/污染/碳排放问题得到
 *     解决、受到控制，「转出去就等于降下来了」「环保账上已经达标」；
 *   腿②b 外部化免责（NOTOURS）：污染转出去就不关我们的事、不是
 *     我们的责任、不用我们操心。
 *   我们把高污染工厂都迁到国外了，所以本国的环境问题已经解决。
 *   只要发达国家把碳排放大户转移到发展中国家，全球变暖就能得到控制。
 *   碳排放主要靠产业转移解决，转出去就等于降下来了。
 *   We solved our carbon problem by moving the dirty factories overseas.
 *   Emissions only look low here because the heavy industry has shifted abroad.
 *   Our carbon footprint dropped as soon as we outsourced the steel mills abroad.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：转移产能是环境
 * 政策讨论里最常见的叙事——本地排放数字确实下降，这个事实陈述是
 * 真的，毒性在于紧跟的第二动作：宣布「所以问题解决了」或「不再
 * 是我们的事了」。这一步把全球总排放这个真正的变量从讨论中免掉，
 * 让任何一地都可以只靠转出产能来「改善」自己的环境账面。与正当
 * 推理的界线很清楚：点名碳泄漏或污染避难所假说的教学句、指出
 * 转移不降低全球总量的纠正句、以及无问题解决断言的中性转移陈述
 * （企业为了靠近市场搬迁/outsourcing 是正常经营决策），一律豁免。
 *
 * 与既有维度的边界（r366 归因，探针 + 边界实测）：
 *   · jevons_paradox（r364）腿①是**效率提升**（单位消耗降低）× 腿②
 *     总量下降/多用摊薄——本族腿①是**空间转移**（迁走/外包），两族
 *     腿①零交集；共现句按腿①归因；
 *   · absolute_claim 等绝对化维度只收「必然/肯定/一定」措辞——本族
 *     收非绝对形（转出去就等于降下来了 / emissions look low）；
 *   · tragedy_of_commons（r238）判**共享资源过度取用的个体合理化**
 *     ——本族不涉产权结构，判转移—解决推理；
 *   · cost_externalization 判**成本转嫁给他人承担的正当性论证**
 *     ——本族判产能空间转移 × 问题解决断言的双腿结构，不依赖
 *     成本转嫁语义词。
 *
 * 判据（双腿近距共现 + 三组豁免，缺一不判）：
 *   ① 腿① SHIFT 转移在场——ZH 动词转移族/产业转移名词族、EN
 *     moved/shifted abroad 族/outsourced 族/offshored 族；
 *   ② 腿② SOLVED 解决幻觉（ZH 多形 / EN 多形）或 NOTOURS 外部化
 *     免责（ZH 五形 / EN 四形）任一；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），方向不限；
 *   ④ 腿②查强否定前缀守卫（「问题并没有解决」= 失配）；
 *   ⑤ 豁免 A 概念教学（碳泄漏/污染避难所/carbon leakage/pollution
 *     haven 被点名）；
 *   ⑥ 豁免 B 纠正句（未必下降/并不能真正解决/只是转移了污染/
 *     not necessarily/only shifts）；
 *   ⑦ 中性转移陈述无腿②天然不判（工厂搬到了越南是正常布局）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一个产能转移事实（「主管
 * 认为把厂迁走能改善本地空气」是事实陈述），也可能是正确的本地空气
 * 描述。verify 的语义是「这段话把产能转移直接兑现成了问题解决或
 * 免责结论，先核对全球总量与转移承接地的排放，再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 中性转移陈述（企业为了靠近市场把工厂搬到越南/outsourcing is
 *     a normal business decision）；
 *   · 概念教学（碳泄漏指一地规制加严导致产能外迁、全球排放未必下降）；
 *   · 纠正句（产业转移并不能真正解决全球环境问题/把污染转出去只是
 *     转移了污染）；
 *   · 疑问句（把工厂迁走真的能解决全球变暖吗？——无断言腿②）；
 *   · 近邻维度领地（jevons_paradox 效率—总量、tragedy_of_commons
 *     过度取用、cost_externalization 成本转嫁正当化）。
 */
'use strict';

// ─── 腿① SHIFT 转移/外包在场 ───────────────────────────────────
// Z1 动词转移族（迁到国外/搬到海外/转移到发展中国家/外包给境外——
//    目标词限定国外/海外/境外/规制更松地区，防「搬到越南式」良性误伤）
const SHIFT_VERB_ZH = /(?:迁|搬|转移|搬迁|外迁|转包|外包)[^。，！？；\n]{0,10}(?:到|往|至|去|给)[^。，！？；\n]{0,8}(?:国外|海外|境外|国外去|发展中国家|欠发达国家|其他国家|别的国家|环保标准更(?:低|宽松)|监管更松|规制更松)/;
// Z2 产业转移名词族（产业转移/产能外迁/工厂外迁/制造业转移/供应链外移）
const SHIFT_NOUN_ZH = /产业(?:链|供应链)?(?:的)?(?:转移|外迁|外移|迁出)|产能(?:的)?(?:外迁|外移|转移|迁出)|(?:高污染|高耗能|高碳|污染|落后)?(?:工厂|产能|制造业|生产线|企业)(?:的)?(?:外迁|外移|迁出|转移到(?:国|海)外)|制造业(?:的)?转移|供应链(?:的)?外移|生产(?:的)?外(?:迁|移)/;
// Z3 转移完成 + 地点补语形（都迁出去了/转出去了/搬到国外了）或无地点
//    完成形（工厂都搬走了——腿②仍是判别主力，无解决/免责断言不判）
const SHIFT_OUT_ZH = /(?:迁|搬|转移|搬迁)[^。，！？；\n]{0,6}(?:出去|到(?:国|海)外|到境外)|(?:搬|迁|挪)(?:走|开)了/;

const SHIFT_ZH_GROUPS = [
  ['SHIFT_VERB_ZH', [SHIFT_VERB_ZH]],
  ['SHIFT_NOUN_ZH', [SHIFT_NOUN_ZH]],
  ['SHIFT_OUT_ZH', [SHIFT_OUT_ZH]],
];
const SHIFT_ZH = [SHIFT_VERB_ZH, SHIFT_NOUN_ZH, SHIFT_OUT_ZH];

// E1 moved/shifted/relocated abroad|overseas 族
const SHIFT_ABROAD_EN = /\b(?:mov(?:e|ed|ing)|shift(?:ed|ing)?|relocat(?:e|ed|ing)|transferr?(?:ed|ing))\s+(?:[a-z]+\s+){0,3}?(?:abroad|overseas)\b/i;
// E2 outsourced/offshored 族（含 outsourced the steel mills 中间名词）
const SHIFT_OUTSRC_EN = /\b(?:outsourc(?:e|ed|ing|es)|offshor(?:e|ed|ing|es))\b/i;
// E3 moved/shifted to + (developing|other|looser) countries 族
const SHIFT_TOCOUNTRIES_EN = /\b(?:mov(?:e|ed|ing)|shift(?:ed|ing)?|relocat(?:e|ed|ing)|transferr?(?:ed|ing))\s+(?:[a-z]+\s+){0,3}?to\s+(?:developing|other| poorer|poorer|looser)\s+(?:countries|jurisdictions|nations)\b|\bto\s+countries\s+with\s+(?:looser|weaker|laxer)\b/i;
// E4 shipped/sent production overseas 族
const SHIFT_SHIP_EN = /\b(?:ship(?:ped|ping)?|sent|send|mov(?:e|ed|ing))\s+(?:[a-z]+\s+){0,4}?(?:production|manufacturing|factories|plants|operations|industry|steel|steel mills|mining)\s+(?:abroad|overseas)\b/i;

const SHIFT_EN_GROUPS = [
  ['SHIFT_ABROAD_EN', [SHIFT_ABROAD_EN]],
  ['SHIFT_OUTSRC_EN', [SHIFT_OUTSRC_EN]],
  ['SHIFT_TOCOUNTRIES_EN', [SHIFT_TOCOUNTRIES_EN]],
  ['SHIFT_SHIP_EN', [SHIFT_SHIP_EN]],
];
const SHIFT_EN = [SHIFT_ABROAD_EN, SHIFT_OUTSRC_EN, SHIFT_TOCOUNTRIES_EN, SHIFT_SHIP_EN];

// ─── 腿②a SOLVED 解决幻觉 ──────────────────────────────────────
// S1 问题解决族（环境问题解决了/污染问题迎刃而解/碳排问题就化解了）
const SOLVED_ZH = /(?:环境|污染|碳排放|排放|环保|气候|碳|生态|全球变暖|气候变化)(?:问题)?(?:已经|就此|就|总算|终于|已)?(?:解决|化解|迎刃而解|搞定|不存在了)|(?:全球变暖|气候变化|污染|碳排放)(?:就能|就可以|能得到|就能得到|将得到|受到|已受到)?(?:控制|遏制|抑制)/;
// S2 转移完成 + 下降断言族（转出去就等于降下来了/迁走了排放就降了）
const SOLVED_SHIFT_ZH = /(?:转|搬|迁|移)(?:出去|到(?:国|海)外|到境外|走了)?[^。，！？；\n]{0,6}(?:就|即|便|等于|算是|意味着)[^。，！？；\n]{0,4}(?:下降|降低|减少|降下来|解决|控制)/;
// S3 账面达标族（环保账上达标/碳排放指标就算完成/排放目标实现）——
//    「碳」后「排放」可选，「账/指标/目标」后到动词前容许 ≤6 字插入
//    （账上已经/指标就算），动词表收 达标/完成/实现/结清/抹平
const SOLVED_BOOK_ZH = /(?:环保|碳|排放|减排|能耗)(?:排放)?(?:账|指标|目标|任务|清单|总额|额度)?[^。，！？；\n]{0,6}?(?:已经|已|就|总算|就算|便|即)?(?:达标|完成|实现|结清|抹平)/;
// S4 本地改善即全局解决形（空气就好起来了所以问题解决/本地好转=全局解决）
const SOLVED_LOCAL_ZH = /(?:空气|环境|水质|生态)(?:质量)?(?:就|便|也)?(?:好起来|好转|改善|变好)[^。，！？；\n]{0,14}(?:所以|于是|因此|这就|问题)[^。，！？；\n]{0,6}(?:解决|控制|没事)|(?:本地|本国|咱们)(?:的)?(?:环境|污染|碳|排放)(?:问题)?(?:就)?(?:解决|没事|可控)/;

const SOLVED_ZH_GROUPS = [
  ['SOLVED_ZH', [SOLVED_ZH]],
  ['SOLVED_SHIFT_ZH', [SOLVED_SHIFT_ZH]],
  ['SOLVED_BOOK_ZH', [SOLVED_BOOK_ZH]],
  ['SOLVED_LOCAL_ZH', [SOLVED_LOCAL_ZH]],
];
const SOLVED_ZH_ARR = [SOLVED_ZH, SOLVED_SHIFT_ZH, SOLVED_BOOK_ZH, SOLVED_LOCAL_ZH];

// SE1 solved (our|the) … problem 族（含 environmental problems are settled 形）
const SOLVED_PROBLEM_EN = /\b(?:solv(?:e|ed|es|ing)|fix(?:ed|es)?|address(?:ed|es)?|tackl(?:e|ed|es))\s+(?:our|the|their|this)\s+(?:[a-z]+\s+){0,3}?(?:carbon|emissions?|pollution|climate|environmental)\s+(?:problem|issue|challenge)s?\b|\b(?:carbon|emissions?|pollution|climate|environmental)\s+(?:problem|issue|challenge)s?\s+(?:is|are|was|were)\s+(?:solved|fixed|over|handled|addressed|settled|done|dealt\s+with)\b/i;
// SE2 under control / global warming can be controlled 族
const SOLVED_CONTROL_EN = /\b(?:global\s+warming|climate\s+change|pollution|emissions?|the\s+carbon\s+problem)\s+(?:can|could|will|would|is|has\s+been|be)\s+(?:finally\s+)?(?:controlled|brought\s+under\s+control|curbed|halted|stopped)\b|\b(?:brought|bring)\s+(?:global\s+warming|emissions?|pollution)\s+under\s+control\b/i;
// SE3 emissions/footprint dropped/fell/looks low 族（容许 ≤2 个插入词：
//    emissions only look low / numbers are finally down）
const SOLVED_DROP_EN = /\b(?:emissions?|carbon|footprint|pollution)\s+(?:[a-z]+\s+){0,2}?(?:dropped|fell|fall|falls|are\s+down|is\s+down|went\s+down|looks?\s+low|looks?\s+better|plummets?|plummeted)\b|\b(?:carbon|emissions?)\s+(?:numbers?|figures?|accounting|books?)\s+(?:look|looks)\s+(?:good|low|better)\b/i;
// SE4 no longer a problem / taken care of 族
const SOLVED_NOLONGER_EN = /\b(?:no\s+longer\s+a\s+(?:problem|concern|threat)|not\s+a\s+problem\s+anymore|taken?\s+care\s+of|dealt\s+with|dealt\s+with\s+once\s+and\s+for\s+all)\b|\b(?:environmental|pollution|carbon|climate)\s+(?:debt|account)\s+(?:is\s+)?(?:settled|cleared|paid)\b/i;

const SOLVED_EN_GROUPS = [
  ['SOLVED_PROBLEM_EN', [SOLVED_PROBLEM_EN]],
  ['SOLVED_CONTROL_EN', [SOLVED_CONTROL_EN]],
  ['SOLVED_DROP_EN', [SOLVED_DROP_EN]],
  ['SOLVED_NOLONGER_EN', [SOLVED_NOLONGER_EN]],
];
const SOLVED_EN_ARR = [SOLVED_PROBLEM_EN, SOLVED_CONTROL_EN, SOLVED_DROP_EN, SOLVED_NOLONGER_EN];

// ─── 腿②b NOTOURS 外部化免责 ───────────────────────────────────
// N1 不关我们事族（就不关我们的事了/与我们无关/不是我们的责任）
const NOTOURS_ZH = /(?:就)?(?:不关|不归)(?:我们|咱们|本国)(?:的事|管|责任|操心)|与(?:我们|咱们|本国)(?:无关|不相干)|不是(?:我们|咱们|本国)(?:的)?(?:责任|事|义务)|(?:不用|无须|无需)(?:我们|咱们)(?:操心|操心|负责|管)|眼不见为净|(?:甩|推|踢)给(?:别国|其他国家|发展中国家|别人)/;
// N2 转移即免责形（转出去了就不用再管/迁走了就与咱们无关）
const NOTOURS_SHIFT_ZH = /(?:转|搬|迁|移)(?:出去|到(?:国|海)外|走|出)[^。，！？；\n]{0,8}(?:就|也|即)?(?:不用|无须|无需|不必|不须|可以不)[^。，！？；\n]{0,6}(?:管|操心|负责|背锅|担|扛)/;

const NOTOURS_ZH_GROUPS = [
  ['NOTOURS_ZH', [NOTOURS_ZH]],
  ['NOTOURS_SHIFT_ZH', [NOTOURS_SHIFT_ZH]],
];
const NOTOURS_ZH_ARR = [NOTOURS_ZH, NOTOURS_SHIFT_ZH];

// NE1 no longer our problem/concern 族
const NOTOURS_EN = /\b(?:no\s+longer\s+our\s+(?:problem|concern|responsibility|burden)|not\s+our\s+(?:problem|concern|responsibility)\s+anymore|out\s+of\s+(?:our|sight)|someone\s+else'?s\s+problem|off\s+our\s+books?|no\s+longer\s+(?:on\s+)?our\s+(?:books|ledger))\b/i;
// NE2 shifted away → washed our hands 族
const NOTOURS_HANDS_EN = /\b(?:wash(?:ed|ing)?\s+our\s+hands|hands?\s+(?:are|is)\s+clean|nothing\s+to\s+do\s+with\s+us|does\s+not\s+matter\s+(?:to\s+us|anymore)|not\s+our\s+(?:lookout|business))\b/i;
// NE3 exported the problem 族
const NOTOURS_EXPORT_EN = /\b(?:export(?:ed|ing)?|dump(?:ed|ing)?)\s+(?:the\s+)?(?:problem|pollution|mess|waste)\s+(?:to|abroad|overseas|elsewhere)\b/i;

const NOTOURS_EN_GROUPS = [
  ['NOTOURS_EN', [NOTOURS_EN]],
  ['NOTOURS_HANDS_EN', [NOTOURS_HANDS_EN]],
  ['NOTOURS_EXPORT_EN', [NOTOURS_EXPORT_EN]],
];
const NOTOURS_EN_ARR = [NOTOURS_EN, NOTOURS_HANDS_EN, NOTOURS_EXPORT_EN];

// ─── 距离窗（转移 × 解决断言/免责）────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：概念教学（点名碳泄漏/污染避难所假说本身）───────────
const CONCEPT_ZH = /碳泄漏|污染避难所|污染天堂|污染避风港|环境规制(?:竞赛|逐底)/;
const CONCEPT_EN = /\bcarbon\s+leakage\b|\bpollution\s+haven\b|\bhaven\s+hypothesis\b/i;

// ─── 豁免 B：纠正句（指出转移不解决全球问题的正当陈述）─────────
const CORRECT_ZH = /并未|并不能|并不能真正|不是真正|并不能解决|不能真正解决|只是转移|仅仅是转移|只是把污染|未必下降|未必减少|不一定下降|全球总量|全球(?:总)?排放|总量并未|总体上|整体上|统筹|全球协同|共同应对|治标不治本|转移污染/;
const CORRECT_EN = /\bnot\s+necessarily\b|\bdoes\s+not\s+(?:necessarily|really|actually)\b|\bonly\s+shifts?\b|\bmerely\s+shifts?\b|\bjust\s+(?:moves|shifts|relocates)\b|\bglobal\s+(?:total|emissions)\b|\boverall\s+emissions?\b|\bno\s+less\s+pollution\b|\bwarns?\b|\bmisleading\b|\bmislead\b|\btreats?\s+the\s+symptom\b/i;

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

// 强否定前缀：命中词前出现这些词，说明整个断言被否定（「问题并没有
// 解决」= 不承认解决 → 失配）。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|并没有真正|不能|无法)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not|did\s+not|has\s+not|have\s+not|no\s+longer\s+means?)\b/i;

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

// 签名收集：腿①转移 × 腿②（解决断言 ∪ 外部化免责），两腿邻近共现，
// 方向不限（「迁走了所以解决了」与「解决了因为迁走了」同判）。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      shift: resolveGroups(R, SHIFT_ZH_GROUPS),
      solved: resolveGroups(R, SOLVED_ZH_GROUPS),
      notours: resolveGroups(R, NOTOURS_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      shift: resolveGroups(R, SHIFT_EN_GROUPS),
      solved: resolveGroups(R, SOLVED_EN_GROUPS),
      notours: resolveGroups(R, NOTOURS_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const shiftM = collect(text, L.shift, false);
    if (shiftM.length === 0) continue;
    const leg2M = collect(text, L.solved, true).concat(collect(text, L.notours, true));
    if (leg2M.length === 0) continue;
    for (const s of shiftM) {
      const t = leg2M.find(x => dist(x, s) <= L.win);
      if (!t) continue;
      sigs.push({ lang: L.lang, shift: s.raw, leg2: t.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.shift + '|' + s.leg2;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 碳泄漏签名：产能/排放转移 × 问题解决断言/外部化免责 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectCarbonLeakage(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论碳泄漏/污染避难所这个概念本身是正确判别）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（指出转移不解决全球问题的正当陈述）
  if ((R.CORRECT_ZH || CORRECT_ZH).test(text) || (R.CORRECT_EN || CORRECT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'carbon_leakage',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '转移「' + x.shift + '」× 解决/免责断言「' + x.leg2 + '」'
      : 'shift "' + x.shift + '" x solved/not-ours claim "' + x.leg2 + '"')),
    details: s.lang === 'zh'
      ? '碳泄漏(' + sigs.length + '处: 「' + s.shift + '」被直接兑现为「' + s.leg2 + '」——产能转移未经全球总量检验即断言问题解决或免责)(zh)'
      : 'carbon-leakage(' + sigs.length + 'x: "' + s.shift + '" is cashed out directly as "' + s.leg2 + '" — relocation asserted to solve the problem or end responsibility, without global check)(en)',
    guidance: '碳泄漏（carbon leakage / pollution haven hypothesis，Copeland & Taylor 贸易与环境研究传统）指一地加严环境规制后，高耗能高污染产能转移到规制更松的地区——本地排放数字确实下降，全球总排放却未必下降。它的危害不在转移这个事实陈述（那可以用账目核实），而在紧跟的第二动作：宣布「所以问题解决了」「不再是我们的事了」。这一步把全球总排放这个真正的变量从讨论中免掉，让任何一地都可以只靠转出产能来改善自己的环境账面。正当做法是先核对全球总量与承接地的排放（本地改善 × 全球汇总、转移承接地的规制水平、协同减排安排），再给出总量判断；点名碳泄漏或污染避难所假说的教学句、指出转移不降低全球总量的纠正句、以及无问题解决断言的中性转移陈述（企业为靠近市场搬迁/外包是正常经营决策），都是正当做法。',
    tags: ['economics', 'environmental-economics', 'carbon-leakage', 'pollution-haven', 'trade-environment', 'aggregate-reasoning'],
  };
}

module.exports = {
  detectCarbonLeakage,
  __internals: () => ({
    SHIFT_VERB_ZH, SHIFT_NOUN_ZH, SHIFT_OUT_ZH,
    SHIFT_ABROAD_EN, SHIFT_OUTSRC_EN, SHIFT_TOCOUNTRIES_EN, SHIFT_SHIP_EN,
    SOLVED_ZH, SOLVED_SHIFT_ZH, SOLVED_BOOK_ZH, SOLVED_LOCAL_ZH,
    SOLVED_PROBLEM_EN, SOLVED_CONTROL_EN, SOLVED_DROP_EN, SOLVED_NOLONGER_EN,
    NOTOURS_ZH, NOTOURS_SHIFT_ZH,
    NOTOURS_EN, NOTOURS_HANDS_EN, NOTOURS_EXPORT_EN,
    SHIFT_ZH, SHIFT_EN, SOLVED_ZH_ARR, SOLVED_EN_ARR, NOTOURS_ZH_ARR, NOTOURS_EN_ARR,
    SHIFT_ZH_GROUPS, SHIFT_EN_GROUPS, SOLVED_ZH_GROUPS, SOLVED_EN_GROUPS,
    NOTOURS_ZH_GROUPS, NOTOURS_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
