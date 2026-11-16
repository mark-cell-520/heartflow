/**
 * src/paradox-of-thrift.js — 「节约悖误/合成谬误（宏观储蓄形）」检测器
 * （r369 新建：econ_reasoning_gate 聚合族第 26 子族 / 插件层第 30 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r369 立项探针（scripts/round-369/probe-r369.js，v6.8.189 pristine
 *   基线）：同池两候选定拨，paradox_of_thrift 攻击穿透 3/7（存量维度
 *   对「人人多储蓄→总需求不受影响/经济增长」组合谬误零覆盖）、良性
 *   0/5 零误伤；对手 lump_of_labor 穿透 3/11 但良性误伤 4/7（存量维度
 *   已把「技术创造岗位多于消灭」「lump of labor 是谬误」等良性句
 *   rewrite/verify，边界脏）——paradox_of_thrift 穿透面更干净，按
 *   r364/r366/r367/r368 纪律落地。海外扫描：arXiv parse-fail、GitHub
 *   repos 0、S2 限流——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自节约悖误标准经济学
 * 论述：储蓄对个人是美德（增加个人财富），但若人人同时多储蓄、
 * 减少消费，社会总需求会下降，国民收入随之收缩，反而可能使每个
 * 人的境况变差——个体理性加总未必是集体理性（凯恩斯节约悖误，
 * 属合成谬误 fallacy of composition 的宏观储蓄形）。
 *
 * 辨别的族：节约悖误/合成谬误宏观储蓄形（paradox of thrift /
 *   composition fallacy in aggregate saving）——文本同时给出三个信号：
 *   腿① THRIFT 节俭/储蓄/少消费概念在场——储蓄/节俭/存钱/减少消费/
 *     saving/thrift/consume less；
 *   腿② UNIVERSAL 普遍量化词在场（合成那一步的主体）——人人/全社会/
 *     大家/所有人/越…越/everyone/all/the whole society/universal；
 *   腿③ AGGBOOST 总量层面「不受影响/向好」断言——总需求/国民收入/
 *     经济/aggregate demand/the economy + 不受影响/增长/繁荣/boosts；
 *   三腿近距共现，缺一不判。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：节约悖误是公共
 * 讨论里高频的推理断层——先用「储蓄是美德」取得正当性（个人层面
 * 确实如此），紧跟的第二动作是把个体美德直接加总为「全社会越节俭
 * 经济越繁荣/总需求不受影响」。这一步把「减少消费会压缩总需求」
 * 这一宏观机制从账上免掉，让合成谬误伪装成常识。与正当推理的界
 * 线很清楚：点名节约悖误/合成谬误概念的教学句、指出「人人多储蓄
 * 会拖累总需求」的纠正句、只谈个人储蓄或长期投资（无普遍量化词、
 * 无总量正向断言）的正当陈述，一律豁免。
 *
 * 与既有维度的边界（r369 归因，探针 + 边界实测）：
 *   · absolute_claim 等绝对化维度只收「必然/肯定」形——本族收非绝对
 *     形（「经济照样增长」「thrift boosts demand」）；
 *   · unsupported_claim 管无依据断言——本族有具体节俭×普遍×总量三
 *     信号在场，错在合成那一步，不是无依据；
 *   · whole_part_transfer 管整体/部分属性迁移——本族专判储蓄-总需求
 *     宏观合成，腿①锁定节俭概念；
 *   · fallacies 族不收合成谬误的宏观储蓄专形（探针攻击穿透实证）。
 *
 * 判据（三腿近距共现 + 两组豁免 + 强否定守卫，缺一不判）：
 *   ① 腿① THRIFT 节俭/储蓄/少消费概念在场；
 *   ② 腿② UNIVERSAL 普遍量化词在场（人人/all/everyone/whole society/
 *      越…越）；
 *   ③ 腿③ AGGBOOST 总量主体 + 正向/中性结局断言；
 *   ④ 三腿须落在邻近窗内（以腿①为锚，ZH 70 字 / EN 190 字符），
 *     方向不限；
 *   ⑤ 腿③查强否定前缀守卫（「并不意味着增长」= 失配）；
 *   ⑥ 豁免 A 概念教学（节约悖误/paradox of thrrift/合成谬误 被点名
 *     且带定义/批判框架词）；
 *   ⑦ 豁免 B 纠正句（人人多储蓄会减少/拖累总需求——注意这是**负向**
 *     结局，腿③天然不收，此处仅作belt-and-suspenders）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项主张（「凯恩斯认为
 * 过度储蓄会引发通缩」是事实陈述）。verify 的语义是「这段话把个体
 * 储蓄美德直接加总成了总量利好，先补齐总需求机制与合成谬误警示，
 * 再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 个人/长期投资形（增加储蓄有利于经济长期增长——无普遍量化词）；
 *   · 纠正句（如果人人多储蓄，短期总需求会下降/内需受打击）；
 *   · 概念教学（节约悖误指个人增加储蓄在人人效仿时会拖累总需求）；
 *   · 平衡形（提高储蓄率长期有助于投资，但短期会减少消费）。
 */

'use strict';

// ─── 腿① THRIFT 节俭/储蓄/少消费概念在场 ────────────────────────
// 核心是货币储蓄/节俭，附带削减消费的机制词。不收裸「节约」（含水/
// 成本等非货币节约形），避免与「节约成本促进经济」类良性咬合。
const THRIFT_NOUN_ZH = /储蓄|存款|攒钱|存钱|存钱罐|节俭|俭省|舍不得花|不舍得花|不肯花钱|不肯消费|不愿消费|不敢消费|削减消费|压缩消费|节制消费|减少消费|抑制消费|消费萎缩|多存钱|多储蓄|增加储蓄|把钱存|宁可存|少花钱|储蓄率/;
const THRIFT_EN = /\bsavings?\b|\bthrift(?:y)?\b|\bfrugal(?:ity)?\b|\bsav(?:e|es|ing)\s+more\b|\bsaves?\s+up\b|\bput(?:ting|s)?\s+(?:money|cash|funds)\s+aside\b|\bhoard(?:s|ing)?\s+(?:money|cash)\b|\bconsume\s+less\b|\bspend(?:s|ing)?\s+less\b|\bcut(?:ting)?\s+back\s+(?:on\s+)?(?:spending|consumption)\b|\breduc(?:e|es|ed|ing)\s+(?:their\s+|overall\s+|total\s+|its\s+)?consumption\b|\bpostpon(?:e|es|ing)\s+(?:spending|purchases)\b/i;

const THRIFT_ZH_GROUPS = [['THRIFT_NOUN_ZH', [THRIFT_NOUN_ZH]]];
const THRIFT_ZH = [THRIFT_NOUN_ZH];
const THRIFT_EN_GROUPS = [['THRIFT_EN', [THRIFT_EN]]];
const THRIFT_EN_ARR = [THRIFT_EN];

// ─── 腿② UNIVERSAL 普遍量化词在场（合成那一步的主体）─────────────
// 不收裸「都」（太常见，会把「都会增长」类非合成句咬进来）——只收显式
// 全称量化词 + 越…越比较级（「越节俭越繁荣」本身是全称推广）。
const UNIVERSAL_ZH = /人人|所有人|全社会|全体|每个人|全民|人人都|所有人都|统统|纷纷|大伙|大家都|家家户户|全民皆|越[^。，；]{1,8}越/;
const UNIVERSAL_EN = /\beveryone\b|\beverybody\b|\ball\s+(?:of\s+us|people|consumers|households|savers|citizens|firms)\b|\buniversal(?:ly)?\b|\bthe\s+whole\s+(?:society|economy|country|population|nation|world)\b|\bacross\s+the\s+board\b|\beach\s+and\s+every\b|\bsociety[- ]wide\b|\beconomy[- ]wide\b|\bnationwide\b|\ball\s+at\s+once\b/i;

const UNIVERSAL_ZH_GROUPS = [['UNIVERSAL_ZH', [UNIVERSAL_ZH]]];
const UNIVERSAL_EN_GROUPS = [['UNIVERSAL_EN', [UNIVERSAL_EN]]];

// ─── 腿③ AGGBOOST 总量主体 + 正向/中性结局断言 ──────────────────
// 只收**正向/中性**结局（不受影响/增长/繁荣/boosts/unaffected），不收
// 负向结局（减少/下降/拖累/抑制/reduces/drags）——负向结局是纠正句
// 「人人多储蓄会拖累总需求」，属良性，必须由本腿天然排除。
// AB1a 无伤害形（攻击：断言总量不下滑/不受影响）——免否定守卫：「不会
//   下降/受影响」正是攻击信号（不断言损害），negBeforeZh 不查此形。
const AGGBOOST_NOHARM_ZH = /(?:总需求|总消费|社会总需求|社会总消费|总支出|国民收入|居民总收入|宏观经济|整体经济|国民经济|全社会经济|经济总量|总产出|内需|国内需求)[^。！？；]{0,14}(?:不受影响|不会(?:因此)?(?:下降|减少|降低|萎缩|受冲击|受打击|受影响)|不降反升|不降)/;
// AB1b 正向形（攻击：断言总量增长/繁荣）——受否定守卫：「总需求不会
//   增长/上升」是良性纠正（r369 边界加固：拆形后由强否定表排除）。
const AGGBOOST_POSITIVE_ZH = /(?:总需求|总消费|社会总需求|社会总消费|总支出|国民收入|居民总收入|宏观经济|整体经济|国民经济|全社会经济|经济总量|总产出|内需|国内需求)[^。！？；]{0,14}(?:增加|上升|提高|增长|扩张|繁荣|兴旺|向好|水涨船高|照样(?:增长|发展|扩张|繁荣)|依然(?:增长|强劲|向好|稳定)|稳中有升|蒸蒸日上|节节攀升|持续增长|不断增长|强劲)/;
// AB2 经济/国家/社会 + 越(来越) + 繁荣/好/富裕（受否定守卫；「越节俭经济
//   越繁荣」由腿①节俭 + 腿②越…越 + 本腿 ECON 完整覆盖，无需独立 THRIFTPROSPER）
const AGGBOOST_ECON_ZH = /(?:经济|国家|社会|全社会)[^。，；]{0,10}(?:越|愈发|越来越)[^。，；]{0,6}(?:繁荣|富裕|富强|兴旺|发达|好|强|富)/;

// 腿③分两桶：NOHARM（免否定守卫）+ POSITIVE（受否定守卫），findSignatures 分别收集。
const AGGBOOST_NOHARM_ZH_ARR = [AGGBOOST_NOHARM_ZH];
const AGGBOOST_POSITIVE_ZH_ARR = [AGGBOOST_POSITIVE_ZH, AGGBOOST_ECON_ZH];
const AGGBOOST_NOHARM_ZH_GROUPS = [['AGGBOOST_NOHARM_ZH', [AGGBOOST_NOHARM_ZH]]];
const AGGBOOST_POSITIVE_ZH_GROUPS = [
  ['AGGBOOST_POSITIVE_ZH', [AGGBOOST_POSITIVE_ZH]],
  ['AGGBOOST_ECON_ZH', [AGGBOOST_ECON_ZH]],
];

// AE1a 无伤害形（EN，免否定守卫）——unaffected / not fall 等「不断言下滑」
const AGGBOOST_NOHARM_EN = /\b(?:aggregate\s+demand|total\s+demand|aggregate\s+consumption|aggregate\s+spending|total\s+spending|aggregate\s+income|national\s+income|the\s+(?:whole\s+|overall\s+|entire\s+|broader\s+)?economy|overall\s+economy|the\s+macroeconomy|aggregate\s+output|GDP)\b[^.]{0,30}?\b(?:unaffected|not\s+(?:fall|drop|decline|decrease|shrink|contract)|does\s+not\s+(?:fall|drop|decline|decrease)|no\s+(?:drop|decline|fall|decrease))\b/i;
// AE1b 正向形（EN，受否定守卫）——「will not rise / won't grow」是良性纠正
const AGGBOOST_POSITIVE_EN = /\b(?:aggregate\s+demand|total\s+demand|aggregate\s+consumption|aggregate\s+spending|total\s+spending|aggregate\s+income|national\s+income|the\s+(?:whole\s+|overall\s+|entire\s+|broader\s+)?economy|overall\s+economy|the\s+macroeconomy|aggregate\s+output|GDP)\b[^.]{0,30}?\b(?:rises?|increases?|grows?|boosts?|improves?|expands?|prospers?|thrives?|keeps?\s+growing|stays?\s+(?:strong|healthy|robust)|gets?\s+stronger|remains?\s+(?:strong|robust|healthy))\b/i;
// AE2 the more frugal/thrifty… the more prosperous / the more the whole society saves, the more prosperous（受否定守卫）
const AGGBOOST_MOREMORE_EN = /\bthe\s+more\s+(?:frugal|thrifty|economical|sav\w+)\b[^.]{0,45}?\bthe\s+more\s+(?:prosperous|rich(?:er)?|wealthy|wealthier|better\s+off|stronger)\b|\bthe\s+more\s+the\s+\w+\s+\w+\s+sav\w+\b[^.]{0,45}?\bthe\s+more\s+(?:prosperous|rich(?:er)?|wealthy|wealthier|better\s+off|stronger)\b/i;
// AE3 thrift boosts/raises total demand/economy/growth（受否定守卫）
const AGGBOOST_THRIFT_EN = /\bthrift(?:y)?\b[^.]{0,25}?\b(?:boosts?|raises?|lifts?|increases?|grows?|strengthens?|enriches?)\b[^.]{0,25}?\b(?:total\s+demand|aggregate\s+demand|the\s+economy|economic\s+growth|output|prosperity)\b/i;

// 腿③ EN 分两桶：NOHARM（免否定守卫）+ POSITIVE（受否定守卫）。
const AGGBOOST_NOHARM_EN_ARR = [AGGBOOST_NOHARM_EN];
const AGGBOOST_POSITIVE_EN_ARR = [AGGBOOST_POSITIVE_EN, AGGBOOST_MOREMORE_EN, AGGBOOST_THRIFT_EN];
const AGGBOOST_NOHARM_EN_GROUPS = [['AGGBOOST_NOHARM_EN', [AGGBOOST_NOHARM_EN]]];
const AGGBOOST_POSITIVE_EN_GROUPS = [
  ['AGGBOOST_POSITIVE_EN', [AGGBOOST_POSITIVE_EN]],
  ['AGGBOOST_MOREMORE_EN', [AGGBOOST_MOREMORE_EN]],
  ['AGGBOOST_THRIFT_EN', [AGGBOOST_THRIFT_EN]],
];

// ─── 距离窗（节俭 × 普遍量化 × 总量向好）──────────────────────
const PAIR_ZH = 70;
const PAIR_EN = 190;

// ─── 豁免 A：概念教学（点名节约悖误/合成谬误概念 + 定义/批判框架词）──
// 概念名单独出现不豁免（「节约悖误其实不成立：储蓄总能拉动增长」是
// 攻击形）——必须与框架词共现，防前缀绕过（r368 同款教训）。
const CONCEPT_ZH = /(?:节约|节俭|储蓄)悖(?:误|论)[^。，；]{0,24}(?:是指|是一种|属于|定义为|理论|概念|观点|认为|主张|指出|说明|揭示|批判|谬误|错误|反映|意味着|告诉我们|表明|告诉|警告|证明|告诉)|(?:是指|是一种|属于|定义为|理论|概念|观点|认为|主张|指出|说明|揭示|批判|谬误|错误|反映|意味着|告诉我们|表明)[^。，；]{0,24}(?:节约|节俭|储蓄)悖(?:误|论)|合成谬误|成分谬误|以偏概全/;
const CONCEPT_EN = /\bparadox\s+of\s+thrift\b[^.]{0,80}?\b(?:is|are|was|were|refers?|means?|shows?|describes?|holds?|states?|argues?|idea|concept|notion|fallacy|wrong|mistaken|Keynes(?:ian)?|textbook|principle|warns?|illustrates?|demonstrates?|presents?|critique|criticizes?|refutes?|debunk\w*|discredited|backfire\w*|example|instance)\b|\b(?:is|are|was|were|refers?|means?|shows?|describes?|called|known\s+as|presents?|illustrates?|demonstrates?|cites?|quotes?|labels?|textbook|example|instance|critique\w*)\b[^.]{0,80}?\bparadox\s+of\s+thrift\b|\bfallacy\s+of\s+composition\b|\bcomposition\s+fallacy\b/i;

// ─── 豁免 B：纠正句（人人多储蓄会减少/拖累总需求）─────────────────
// 腿③已天然排除负向结局，此处仅作 belt-and-suspenders：只收**确定
// 负向**形（会/将/势必 + 减少/拖累/抑制 + 总量主体），不收「未必
// 减少」对冲形——那可能是软化版攻击（「总需求未必下降」）。
const CORRECT_ZH = /(?:储蓄|节俭|节约|存钱)[^。，；]{0,14}(?:会|将|势必|必然|终究|反而)[^。，；]{0,10}(?:减少|降低|拖累|抑制|打击|削弱|损害)[^。，；]{0,8}(?:总需求|总消费|内需|国民收入|宏观经济|整体经济|国民经济)|合成谬误|fallacy\s+of\s+composition|以偏概全/;
const CORRECT_EN = /\b(?:saving|thrift|frugality|less\s+consumption)\b[^.]{0,30}?\b(?:reduces?|drags?\s+down|dampens?|depresses?|shrinks?|crushes?|weakens?)\b[^.]{0,25}?\b(?:aggregate\s+demand|total\s+demand|the\s+economy|national\s+income|aggregate\s+consumption)\b|\bfallacy\s+of\s+composition\b/i;

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
// 含「不会」——腿③ POSITIVE 形受此守卫（「总需求不会增长」是良性纠正），
// 但腿③ NOHARM 形（「不会下降/受影响」）免此守卫，两者拆桶收集见 findSignatures。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|并没有真正|不能|无法|并非|不会|没能|难以|不大|无从)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not|did\s+not|has\s+not|have\s+not|no\s+longer\s+means?)\b|\bnot\s+(?:rise|rising|increase|increasing|grow|growing|boost|improve|expand|climb|strengthen)\b|\bwon'?t\s+(?:rise|grow|increase|boost|improve)\b|\bfails?\s+to\s+(?:rise|grow|increase)\b/i;

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

// 签名收集：腿①节俭 × 腿②普遍量化 × 腿③总量向好，以腿①为锚，
// 三腿邻近共现，方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      thrift: resolveGroups(R, THRIFT_ZH_GROUPS),
      univ: resolveGroups(R, UNIVERSAL_ZH_GROUPS),
      boostNoharm: resolveGroups(R, AGGBOOST_NOHARM_ZH_GROUPS),
      boostPos: resolveGroups(R, AGGBOOST_POSITIVE_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      thrift: resolveGroups(R, THRIFT_EN_GROUPS),
      univ: resolveGroups(R, UNIVERSAL_EN_GROUPS),
      boostNoharm: resolveGroups(R, AGGBOOST_NOHARM_EN_GROUPS),
      boostPos: resolveGroups(R, AGGBOOST_POSITIVE_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const thriftM = collect(text, L.thrift, false);
    if (thriftM.length === 0) continue;
    const univM = collect(text, L.univ, false);
    if (univM.length === 0) continue;
    // 腿③两桶：NOHARM 免否定守卫（「不会下降」是攻击信号），POSITIVE 受否定守卫。
    const boostM = collect(text, L.boostNoharm, false).concat(collect(text, L.boostPos, true));
    if (boostM.length === 0) continue;
    for (const t of thriftM) {
      const u = univM.find(x => dist(x, t) <= L.win);
      if (!u) continue;
      const b = boostM.find(x => dist(x, t) <= L.win);
      if (!b) continue;
      sigs.push({ lang: L.lang, thrift: t.raw, univ: u.raw, boost: b.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.thrift + '|' + s.univ + '|' + s.boost;
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
 * 节约悖误/合成谬误宏观储蓄形签名：节俭概念 × 普遍量化 × 总量向好 三腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectParadoxOfThrift(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论节约悖误/合成谬误这个概念本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（人人多储蓄会减少/拖累总需求）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'paradox_of_thrift',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '节俭「' + x.thrift + '」× 普遍「' + x.univ + '」× 总量向好「' + x.boost + '」'
      : 'thrift "' + x.thrift + '" x universal "' + x.univ + '" x aggregate-boost "' + x.boost + '"')),
    details: s.lang === 'zh'
      ? '节约悖误/合成谬误宏观储蓄形(' + sigs.length + '处: 「' + s.thrift + '」在「' + s.univ + '」层面被加总为「' + s.boost + '」——个体储蓄美德到总量利好的合成那一步未经论证)(zh)'
      : 'paradox-of-thrift/composition(' + sigs.length + 'x: "' + s.thrift + '" at the "' + s.univ + '" level is aggregated into "' + s.boost + '" — the composition step from individual thrift to aggregate good is asserted away)(en)',
    guidance: '储蓄对个人是美德（增加个人财富、提供退休保障），但「人人同时多储蓄、减少消费」会压缩社会总需求，国民收入随之收缩，反而可能使每个人的境况变差——个体理性加总未必是集体理性。这就是节约悖误（paradox of thrift），属合成谬误（fallacy of composition）的宏观储蓄形：不能把个体层面的正确选择（多储蓄）直接加总为整体层面的正确结论（总需求不受影响/经济更繁荣）。正当做法是给出总需求机制（消费→总需求→收入→再消费的循环）、合成谬误警示、以及短期需求效应与长期资本积累效应的区分；点名节约悖误/合成谬误概念的教学句、指出「人人多储蓄会拖累总需求」的纠正句、只谈个人储蓄或长期投资（无普遍量化、无总量正向断言）的正当陈述，都是正当做法。',
    tags: ['economics', 'macroeconomics', 'paradox-of-thrift', 'saving', 'aggregate-demand', 'fallacy-of-composition', 'aggregate-reasoning'],
  };
}

module.exports = {
  detectParadoxOfThrift,
  __internals: () => ({
    THRIFT_NOUN_ZH, THRIFT_EN,
    UNIVERSAL_ZH, UNIVERSAL_EN,
    AGGBOOST_NOHARM_ZH, AGGBOOST_POSITIVE_ZH, AGGBOOST_ECON_ZH,
    AGGBOOST_NOHARM_EN, AGGBOOST_POSITIVE_EN, AGGBOOST_MOREMORE_EN, AGGBOOST_THRIFT_EN,
    THRIFT_ZH, THRIFT_EN_ARR,
    AGGBOOST_NOHARM_ZH_ARR, AGGBOOST_POSITIVE_ZH_ARR,
    AGGBOOST_NOHARM_EN_ARR, AGGBOOST_POSITIVE_EN_ARR,
    THRIFT_ZH_GROUPS, THRIFT_EN_GROUPS,
    UNIVERSAL_ZH_GROUPS, UNIVERSAL_EN_GROUPS,
    AGGBOOST_NOHARM_ZH_GROUPS, AGGBOOST_POSITIVE_ZH_GROUPS,
    AGGBOOST_NOHARM_EN_GROUPS, AGGBOOST_POSITIVE_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
