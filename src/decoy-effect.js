/**
 * src/decoy-effect.js — 「诱饵效应/被支配比较」检测器
 * （r371 新建：econ_reasoning_gate 聚合族第 26 子族 / 插件层第 31 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r371 立项探针（scripts/round-371/probe-r371-pool.js，v6.8.190 pristine
 *   基线）：同池四候选定拨——A lump_of_labor 穿透 5/10 但良性非 pass 1/5
 *   （存量 completion_evidence 误伤「lump of labor 是谬误」纠正句，边界
 *   脏）；B publication_bias 穿透 6/7 但多被存量 selection_bias/
 *   fallacy_of_relevance 代拦（新族边际价值低）；C status_quo_bias 穿透
 *   6/8 良性 1/4（存量 confidence 误伤，边界脏）；**D decoy_effect 攻击
 *   穿透 0/7（真零命中）+ 良性 0/3 零误伤**——唯一同时满足「存量维度
 *   零覆盖」与「良性边界全净」的候选，按 r364-r369 纪律落地。二段边界
 *   预研（probe-r371-benign.js，13 条风险良性）：10 条存量即 pass，3 条
 *   非 pass 均系存量维度（confidence/absolute_claim/monocausal）误拦、
 *   非本族增量。海外扫描：arXiv parse-fail、GitHub repos 0、S2 限流——
 *   空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自诱饵效应标准行为经济学
 * 论述：在选项集中加入一个被严格支配的选项（价格更高且关键属性更差），
 * 会使另一选项在对比下显得更具吸引力，从而把选择引向预设目标——价值
 * 结论完全由被支配的对比对象衬托而出，未经绝对依据论证（Huber, Payne
 * & Puto 的 asymmetric dominance effect； Ariely《怪诞行为学》定价
 * 实验：报纸/电磁炉/澳大利亚旅游三选一实验）。
 *
 * 辨别的族：诱饵效应/被支配比较（decoy effect / asymmetric dominance /
 *   dominated-comparison reasoning）——文本同时给出三个信号：
 *   腿① CHOICE_SET 选项集在场——款/版/档/套餐/选项/竞品/tier/plan/
 *     option（比较双方是同一选项集内共存备选，或明示对比基准）；
 *   腿② DOMINATED 被支配描述——被比下去的选项严格更差（功能少/低配/
 *     更贵却/又贵又难用/垫底/明显更差；limited/overpriced/worse/stripped-
 *     down）；
 *   腿③ RELATIVE_VALUE 相对化价值/选择结论——显得/衬托/垫底/简直是/
 *     就会选/肯定不会错/划算/良心价；looks like/seem reasonable/steal/
 *     no-brainer；
 *   三腿近距共现，缺一不判。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：诱饵效应是定价、
 * 营销与产品比较话术里高频的推理断层——先把一个「又贵又难用」的陪衬
 * 摆上台面，再宣布目标选项「显得划算/简直是良心价/选它肯定不会错」。
 * 价值结论的全部重量都压在被支配的对比对象上，绝对依据（成本、性能、
 * 需求匹配）被免掉。与正当推理的界线很清楚：基于绝对依据的价值结论
 * （「性价比高，因为采用自研芯片且定价低于成本」）、均衡评估（「各有
 * 优劣，按场景选择」）、时效比较（「老款功能少，新款是飞跃」——版本
 * 迭代不是共存选项集）、点名的概念教学与「应该避免用低配版衬托自己」
 * 的纠正句，一律豁免。
 *
 * 与既有维度的边界（r371 归因，探针 + 边界实测）：
 *   · anchoring_effect 管首个数字对估计的锚定——本族管选项集内被支配
 *     选项对价值判断的衬托，腿①锁定选项集语境；
 *   · false_equivalence / statistical_misleading 管比较方法错误——本族
 *     专判「价值结论仅由被支配对比推出」这一具体推理形；
 *   · confidence / absolute_claim 管断言强度——本族管结论的来源（相对
 *     衬托而非绝对依据），强度词可缺席（「显得划算」无绝对化词）；
 *   · 存量 econ 子族（mercantilism/price_control 等）均不覆盖选项集
 *     衬托形（探针攻击 7/7 穿透实证）。
 *
 * 判据（三腿近距共现 + 三组豁免，缺一不判）：
 *   ① 腿① CHOICE_SET 选项集/对比基准在场；
 *   ② 腿② DOMINATED 被支配选项描述在场（受否定守卫：「不显得更差」
 *      是对冲形）；
 *   ③ 腿③ RELATIVE_VALUE 相对化价值/选择结论在场（**不受**否定守卫——
 *      「肯定不会错/不会吃亏」本身是攻击形，其「不会」是惯语组成部分）；
 *   ④ 三腿须落在邻近窗内（以腿①为锚，ZH 60 字 / EN 160 字符），
 *     方向不限；
 *   ⑤ 豁免 A 概念教学（诱饵效应/decoy effect 被点名 + 定义/批判框架词
 *      共现，防前缀绕过）；
 *   ⑥ 豁免 B 纠正/处方/揭穿句（应该用同档次、而不是衬托、只是错觉、
 *      营销陷阱）；
 *   ⑦ 豁免 C 时效/版本迭代比较（老款/旧款/上一代/older/previous——
 *      版本先后不是共存选项集，衬托论证不成立）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项定价策略（「入门版功能
 * 少，是为了让专业版显得划算」是策略描述——被 CONCEPT/描述框架覆盖）。
 * verify 的语义是「这段话的价值结论完全由被支配的对比对象衬托而出，
 * 先补齐绝对依据（成本/性能/需求匹配），再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 绝对依据型价值结论（性价比高 + 自研芯片/定价低于成本——腿②不命中）；
 *   · 均衡评估（各有优劣、综合评估、按场景选择——腿③不命中）；
 *   · 时效比较（老款功能少、五年前的手机、older model——豁免 C）；
 *   · 概念教学（诱饵效应利用一个明显更差的选项引导选择——豁免 A）；
 *   · 纠正句（对比时应该用同档次产品，而不是拿低配版衬托自己——豁免 B）；
 *   · 揭穿句（如果只是拿低配版衬托，那这个划算只是错觉——豁免 B）。
 */

'use strict';

// ─── 腿① CHOICE_SET 选项集/对比基准在场 ────────────────────────
// 只收「选项集内共存备选」与「明示对比基准」名词——版本先后（老款/新款）
// 由豁免 C 处理，此处不收时效词。
const CHOICE_SET_ZH = /款|版本|版|档|套餐|选项|方案|机型|竞品|产品|商品|型号|牌子|垫底|参照|对比对象|基准|档位|配套/;
const CHOICE_SET_EN = /\b(?:tiers?|plans?|options?|packages?|versions?|models?|competitors?|products?|brands?|offerings?|choices?|alternatives?|subscriptions?|bundles?|baseline|benchmark|variants?|editions?)\b/i;

const CHOICE_SET_ZH_GROUPS = [['CHOICE_SET_ZH', [CHOICE_SET_ZH]]];
const CHOICE_SET_EN_GROUPS = [['CHOICE_SET_EN', [CHOICE_SET_EN]]];

// ─── 腿② DOMINATED 被支配选项描述在场（严格更差）────────────────
// 不收裸「不如」（「关键参数不如我们」是良性均衡句高频形，r371 边界
// 预研实证）——只收显式劣化描述词。
const DOMINATED_ZH = /功能(?:这么|那么)?少|功能都没有|功能单一|功能残缺|功能缩水|什么(?:功能)?都?没有|要啥没啥|啥都没有|配置低|低配|丐版|更贵却|又贵又|又差又|越贵越|贵得离谱|难用|不好用|垫底|明显更差|更差|被吊打|各方面都差|处处都差|明显缩水/;
const DOMINATED_EN = /\b(?:limited|stripped-down|bare-bones|gimped|weaker|clearly worse|much worse|even worse|worse|overpriced|over-priced|inferior|hard to use|difficult to use|feature-poor|lacking key features|mediocre|terrible|awful)\b/i;

const DOMINATED_ZH_GROUPS = [['DOMINATED_ZH', [DOMINATED_ZH]]];
const DOMINATED_EN_GROUPS = [['DOMINATED_EN', [DOMINATED_EN]]];

// ─── 腿③ RELATIVE_VALUE 相对化价值/选择结论在场 ─────────────────
// 三子族：(a) 相对化标记（显得/衬托/简直/looks like/makes...seem）；
// (b) 引导性选择结论（就会选/肯定不会错/闭眼买/will choose/no-brainer）；
// (c) 相对价值判词（划算/良心价/steal/bargain——不收裸「性价比」，
// 「性价比确实更高」是扁平比较句，良性均衡形也用，r371 边界预研实证）。
const RELATIVE_ZH_A = /显得|看上去|看起来|相形见绌|相比之下|相较之下|一对比|衬托|垫底|简直是|简直就是|简直|活生生|立马?显得/;
const RELATIVE_ZH_B = /(?:就会|都会|倾向于|大概率会|自然会|纷纷)(?:选|买|挑|下单|抢)|肯定不会错|肯定错不了|不会吃亏|买不了吃亏|放心买|放心选|闭眼(?:买|选|入)|抢着买|争相购买|蜂拥(?:而|上)?去?买|无脑选|无脑买/;
const RELATIVE_ZH_C = /划算|超值|值得买|值得选|值得入手|良心价|良心|捡漏|薅(?:到|了)?羊毛|买到就是赚到|占了(?:大)?便宜/;

const RELATIVE_EN_A = /\bmakes?\s+(?:(?:the|this|that|it|them)\s+)?(?:\w+\s+){0,3}?(?:look|seem|appear)\b|\blooks? like\b|\bseems? like\b|\bappears? (?:like|to be)\b|\bby comparison\b|\bin contrast\b|\bnext to\b|\bversus\b|\bvs\.?\b/i;
const RELATIVE_EN_B = /\b(?:will|would|'ll)\s+(?:choose|pick|select|buy|opt for|go with)\b|\bcan'?t go wrong\b|\bno-brainer\b|\bsafe bet\b|\bfoolproof\b/i;
const RELATIVE_EN_C = /\bbargain\b|\bsteal\b|\bgreat deal\b|\bbest deal\b|\bbang for (?:the|your) buck\b|\bworth every penny\b/i;

const RELATIVE_ZH_GROUPS = [
  ['RELATIVE_ZH_A', [RELATIVE_ZH_A]],
  ['RELATIVE_ZH_B', [RELATIVE_ZH_B]],
  ['RELATIVE_ZH_C', [RELATIVE_ZH_C]],
];
const RELATIVE_EN_GROUPS = [
  ['RELATIVE_EN_A', [RELATIVE_EN_A]],
  ['RELATIVE_EN_B', [RELATIVE_EN_B]],
  ['RELATIVE_EN_C', [RELATIVE_EN_C]],
];

// ─── 距离窗（选项集 × 被支配描述 × 相对化结论）──────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：概念教学（点名诱饵效应/折中效应概念 + 框架词）────────
// 概念名单独出现不豁免（「诱饵效应其实不成立：加个烂选项照样显得划算」
// 是攻击形）——必须与框架词共现，防前缀绕过（r368/r369 同款教训）。
const CONCEPT_ZH = /(?:诱饵效应|诱饵选项|被支配选项|折中效应|妥协效应|不对称优势)[^。，；]{0,24}(?:是指|是一种|属于|定义为|理论|概念|观点|认为|主张|指出|说明|揭示|批判|谬误|错误|反映|意味着|表明|利用|通过|借助|常见|策略|设计|手法|套路|营销|实验|证明|告诉|警告)|(?:是指|是一种|属于|定义为|理论|概念|观点|认为|主张|指出|说明|揭示|批判|谬误|错误|反映|意味着|表明|利用|通过|借助|常见|策略|设计|手法|套路|营销|实验|证明|告诉|警告)[^。，；]{0,24}(?:诱饵效应|诱饵选项|被支配选项|折中效应|妥协效应|不对称优势)/;
const CONCEPT_EN = /\b(?:decoy effect|asymmetric dominance|dominated alternative|decoy pricing|bait pricing|compromise effect)\b[^.]{0,80}?\b(?:is|are|was|were|refers?|means?|shows?|describes?|holds?|states?|argues?|idea|concept|notion|fallacy|wrong|mistaken|textbook|principle|warns?|illustrates?|demonstrates?|presents?|critique|criticizes?|refutes?|debunk\w*|discredited|example|instance|uses?|leverages?|works?|common|strategy|technique|marketing|pricing|experiment)\b|\b(?:is|are|was|were|refers?|means?|shows?|describes?|called|known as|presents?|illustrates?|demonstrates?|cites?|quotes?|labels?|textbook|example|instance|critique\w*|uses?|leverages?)\b[^.]{0,80}?\b(?:decoy effect|asymmetric dominance|dominated alternative|decoy pricing|bait pricing|compromise effect)\b/i;

// ─── 豁免 B：纠正/处方/揭穿句 ──────────────────────────────────
// 收：处方（应该用同档次、要避免衬托）、转折纠正（而不是拿低配衬托）、
// 揭穿（只是错觉/营销陷阱/话术套路）、假设性揭穿（如果只是衬托）。
// 不收裸情态词——「应该选中间档」若三腿齐占仍是攻击形（r368 同款教训：
// CORRECT 只收正面纠正形）。攻击样本实测均不含这些形。
const CORRECT_ZH = /(?<![的])(?:应该)|需要|要避免|不能靠|别靠|切勿|不要|而不是|并非|并不是|不等于|不代表|未必是|错觉|误区|陷阱|话术|套路|如果只是|若只是|假设只是|只是衬托|只是陪衬|陪衬|只是垫脚石|垫脚石|误导|忽悠|套路消费者/;
const CORRECT_EN = /\b(?:should|ought to|need to|must)\b|\b(?:instead of|rather than)\b|\b(?:illusion|mirage|trap|trick|gimmick|ploy|ruse|misleading|deceptive)\b|\bif\b[^.]{0,40}\bjust\b[^.]{0,30}\b(?:decoy|comparison|contrast|anchor)\b|\bnot (?:really|truly|actually)\b/i;

// ─── 豁免 C：时效/版本迭代比较 ─────────────────────────────────
// 版本先后（老款→新款、五年前→现在、older→current）不是共存选项集，
// 衬托论证不成立——「老款功能少，新款简直是飞跃」是正常迭代陈述。
const TEMPORAL_ZH = /老款|旧款|上一代|上一版本|旧版|前代|过时|淘汰|几年前|以前|过去|去年|上代|迭代(?:前|后)|新旧/;
const TEMPORAL_EN = /\b(?:older|previous|last year's|legacy|outdated|discontinued|dated|predecessor|successor|earlier|former)\b/i;

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

// 强否定前缀：命中词前/命中文本内出现这些词，说明断言被否定。
// 只用于腿②（「不显得更差/不是更难用」是对冲形）——腿③不收此守卫：
// 「肯定不会错/不会吃亏」的「不会」是攻击惯语组成部分（r371 设计决策，
// 若腿③受守卫则攻击样本「选中间这个肯定不会错」被自免）。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|并没有真正|不能|无法|并非|不会|没能|难以|不大|无从)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not|did\s+not|has\s+not|have\s+not|no\s+longer\s+means?)\b|\bnot\s+(?:worse|limited|overpriced|inferior|weaker|hard to use)\b|\bno\s+(?:worse|less limited)\b|\bisn'?t\s+(?:worse|limited)\b|\baren'?t\s+(?:worse|limited)\b/i;

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 12), idx);
  return STRONG_NEG_ZH.test(before);
}

function matchAlive(text, x, useNeg, preNeg) {
  if (!useNeg && !preNeg) return true;
  if (useNeg) {
    if (STRONG_NEG_ZH.test(x.raw) || STRONG_NEG_EN.test(x.raw)) return false;
    if (negBeforeZh(text, x.idx)) return false;
    const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
    if (STRONG_NEG_EN.test(beforeEn)) return false;
  }
  // 腿②专属轻量前置否定：命中词前 4 字内出现裸否定字（不/没/无/未/非），
  // 「不显得更差」「一点都不难用」等对冲形承重（r371 良性误伤修复：
  // STRONG_NEG_ZH 不收「不显得」这类非惯用否定组合，补字符级前置检查）。
  if (preNeg) {
    const pre = text.slice(Math.max(0, x.idx - 4), x.idx);
    if (/[不没无未非]/.test(pre)) return false;
    if (/\b(?:not|no)\s+$/i.test(text.slice(Math.max(0, x.idx - 6), x.idx))) return false;
  }
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

function collect(text, list, useNeg, preNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, preNeg)) m.push(x);
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
    let regs;
    if (Object.prototype.hasOwnProperty.call(R, name)) {
      const v = R[name];
      // 负例注入双契约：空数组 = 删条（整组消失）；永假正则 = 替换（该组退化
      // 为永不匹配）。两者都不得 crash——RegExp 不可 spread。
      regs = Array.isArray(v) ? v : (v instanceof RegExp ? [v] : []);
    } else {
      regs = defs;
    }
    out.push(...regs);
  }
  return out;
}

// 签名收集：腿①选项集 × 腿②被支配描述 × 腿③相对化结论，以腿①为锚，
// 三腿邻近共现，方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      choice: resolveGroups(R, CHOICE_SET_ZH_GROUPS),
      dom: resolveGroups(R, DOMINATED_ZH_GROUPS),
      rel: resolveGroups(R, RELATIVE_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      choice: resolveGroups(R, CHOICE_SET_EN_GROUPS),
      dom: resolveGroups(R, DOMINATED_EN_GROUPS),
      rel: resolveGroups(R, RELATIVE_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const choiceM = collect(text, L.choice, false);
    if (choiceM.length === 0) continue;
    // 腿②受否定守卫（「不显得更差」是对冲形：强否定表 + 前置裸否定字双保险）；
    // 腿③不受（见 STRONG_NEG 注释——「肯定不会错」的「不会」是攻击惯语）。
    const domM = collect(text, L.dom, true, true);
    if (domM.length === 0) continue;
    const relM = collect(text, L.rel, false);
    if (relM.length === 0) continue;
    for (const c of choiceM) {
      const d = domM.find(x => dist(x, c) <= L.win);
      if (!d) continue;
      const r = relM.find(x => dist(x, c) <= L.win);
      if (!r) continue;
      sigs.push({ lang: L.lang, choice: c.raw, dom: d.raw, rel: r.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.choice + '|' + s.dom + '|' + s.rel;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入常量；
// 默认值本身是 RegExp。统一成数组供 exempt() 消费。
function _normInject(x, def) {
  if (Array.isArray(x)) return x;
  if (x instanceof RegExp) return [x];
  return [def];
}
function exempt(list, text) {
  for (const re of list) { if (re && re.test && re.test(text)) return true; }
  return false;
}

/**
 * 诱饵效应/被支配比较签名：选项集 × 被支配描述 × 相对化价值结论 三腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectDecoyEffect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论诱饵效应/被支配选项这个概念本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正/处方/揭穿句（应该用同档次而不是衬托、只是错觉、营销陷阱）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 C：时效/版本迭代比较（老款功能少、五年前的手机——非共存选项集）
  if (exempt(_normInject(R.TEMPORAL_ZH, TEMPORAL_ZH), text) || exempt(_normInject(R.TEMPORAL_EN, TEMPORAL_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'decoy_effect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '选项集「' + x.choice + '」× 被支配「' + x.dom + '」× 相对化结论「' + x.rel + '」'
      : 'choice-set "' + x.choice + '" x dominated "' + x.dom + '" x relative-value "' + x.rel + '"')),
    details: s.lang === 'zh'
      ? '诱饵效应/被支配比较(' + sigs.length + '处: 「' + s.rel + '」的价值结论由被支配的对比对象「' + s.dom + '」在选项集「' + s.choice + '」内衬托而出，未经绝对依据论证)(zh)'
      : 'decoy-effect/dominated-comparison(' + sigs.length + 'x: the value conclusion "' + s.rel + '" rests entirely on the dominated comparison "' + s.dom + '" within the choice set "' + s.choice + '", with no absolute merits)(en)',
    guidance: '诱饵效应（decoy effect / asymmetric dominance）：在选项集中加入一个被严格支配的选项（价格更高且关键属性更差），目标选项就会在对比下显得更具吸引力——但「显得划算」的全部重量都压在这个陪衬对象上，绝对依据（成本构成、性能参数、需求匹配度）被免掉了。正当做法是给出绝对依据（「性价比高，因为采用自研芯片且定价低于成本」）、把对比限定在同档次选项（「对比时应该用同档次产品」）、或直接按需求场景评估（「两个套餐各有优劣，按实际使用场景选择」）；版本迭代比较（老款功能少、五年前的手机——版本先后不是共存选项集）、点名诱饵效应/被支配选项概念的教学句、指出「这只是错觉/营销陷阱」的纠正句，都是正当做法。',
    tags: ['economics', 'behavioral-economics', 'decoy-effect', 'asymmetric-dominance', 'choice-architecture', 'comparison-reasoning'],
  };
}

module.exports = {
  detectDecoyEffect,
  __internals: () => ({
    CHOICE_SET_ZH, CHOICE_SET_EN,
    DOMINATED_ZH, DOMINATED_EN,
    RELATIVE_ZH_A, RELATIVE_ZH_B, RELATIVE_ZH_C,
    RELATIVE_EN_A, RELATIVE_EN_B, RELATIVE_EN_C,
    CHOICE_SET_ZH_GROUPS, CHOICE_SET_EN_GROUPS,
    DOMINATED_ZH_GROUPS, DOMINATED_EN_GROUPS,
    RELATIVE_ZH_GROUPS, RELATIVE_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN, TEMPORAL_ZH, TEMPORAL_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
