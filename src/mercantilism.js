/**
 * src/mercantilism.js — 「重商主义贸易顺差谬误」检测器
 * （r368 新建：econ_reasoning_gate 聚合族第 25 子族 / 插件层第 29 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r368 立项探针（scripts/round-368/probe-mercantilism-r368.js，
 *   v6.8.189 pristine 基线）：mercantilism 攻击穿透 9/10（唯一非穿透
 *   条「钱被外国人赚走就是纯粹的损失」被存量 zero_sum_fallacy 代拦）、
 *   良性非 pass 1/9（存量 confidence 维度对 Trade is not zero-sum 良性
 *   代拦——存量误拦，非本族增量）。穿透面高且良性边界干净，按
 *   r364/r366/r367 纪律落地。r367 同池落选备选留档：lump_of_labor、
 *   paradox_of_thrift（见 UPGRADE_LOG/交接）。海外扫描：arXiv 15 条
 *   全为 OR 展开噪声（零相关命中）、GitHub repos 0、S2 429 限流——
 *   空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自重商主义标准经济学
 * 论述：mercantilism 把国民财富等同于贸易顺差积累的货币/金银，
 * 断言出口是收益、进口是损失。现代经济学的反驳：自愿贸易是双赢
 * （双方按比较优势专业化都获益），贸易差额反映储蓄-投资结构等
 * 宏观恒等关系而非财富得失，进口本身就是贸易收益（获得商品与
 * 服务）。
 *
 * 辨别的族：重商主义贸易顺差谬误（mercantilism / trade-surplus
 *   wealth misattribution）——文本先给出**贸易平衡语境的在场指称**
 *   （顺差/逆差/出口/进口/trade surplus/exports），再给出**把贸
 *   易差额单边兑现为财富得失的断言**：
 *   腿②a 赚钱形（GAIN）：出口/顺差才叫赚钱、顺差才是财富——
 *      「出口大于进口才叫赚钱」「A trade surplus means we are
 *      winning」；
 *   腿②b 流失形（DRAIN）：进口/逆差就是财富外流、钱被外国人赚
 *      走——「贸易逆差就是财富外流」「Every dollar spent on
 *      imports is a dollar lost to foreigners」；
 *   腿②c 积累/强弱形（ACCUM）：顺差越大国家越富、只有多出口
 *      少进口才能富强——「顺差越大越占便宜」「只有保持出口大
 *      于进口，国家才能越来越富有」；
 *   腿②d 吃亏形（LOSE）：进口越多越吃亏、每一笔对外购买都是
 *      财富净流出——「进口越多越吃亏」「每一笔对外购买都是本
 *      国财富的净流出」。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：贸易差额是公
 * 共讨论里最高频的谬误断言之一，毒性句式固定——先点一个真实存在
 * 的统计量（顺差/逆差确实是海关数据），紧跟的第二动作是宣布「顺
 * 差=国家赚钱、逆差=财富外流」。这一步把自愿贸易的互惠性、贸易
 * 差额的宏观恒等来源（储蓄-投资结构）从讨论中免掉，让任何贸易
 * 政策辩论退化成「谁赚了谁的钱」。与正当推理的界线很清楚：点名
 * 重商主义概念的教学句、指出双赢/比较优势/恒等关系的纠正句、以
 * 及无财富得失断言的中性贸易陈述，一律豁免。
 *
 * 与既有维度的边界（r368 归因，探针 + 边界实测）：
 *   · zero_sum_fallacy 管「他赢=我输」的零和误判——本族管贸易
 *     差额语境下的财富得失归因，腿①是贸易词而非零和词；探针中
 *     「Trade is not zero-sum」良性句本族零命中（不抢存量代拦）；
 *   · unsupported_claim 管无依据断言——本族有具体贸易差额在场，
 *     错在单边归因，不是无依据；
 *   · monocause 管单一原因归因——本族判单边**财富得失**断言；
 *   · economic_control 等操控维度不管经济推理错误。
 *
 * 判据（双腿近距共现 + 两组豁免 + 强否定守卫，缺一不判）：
 *   ① 腿① TRADE 贸易平衡语境在场——ZH 顺差/逆差/出口/进口/外贸/
 *     对外购买族；EN trade surplus/deficit/exports/imports 族；
 *   ② 腿② GAIN/DRAIN/ACCUM/LOSE 任一；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），方向不限；
 *   ④ 腿②查强否定前缀守卫（「并不是财富流失」= 失配）；
 *   ⑤ 豁免 A 概念教学（重商主义/mercantilism 被点名且带定义/
 *     历史/批判框架词）；
 *   ⑥ 豁免 B 纠正句（双赢/比较优势/自愿交换受益/恒等关系/进口
 *     也受益）。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 中性贸易陈述（出口退税政策旨在降低出口企业的税负）；
 *   · 概念教学（重商主义是一种认为顺差代表财富的经济思想）；
 *   · 纠正句（贸易不是零和，双方按比较优势获益/进口不意味着吃亏）；
 *   · 「买国货才是爱国」的经济民族主义形（超出财富得失归因范围，
 *     留作交接项——样本3靠「净流出」子句承重，不依赖该子句）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项政策主张（「主管
 * 认为逆差就是财富外流」是事实陈述）。verify 的语义是「这段话把
 * 贸易差额直接兑现成了单边财富得失，先补齐互惠性与宏观恒等等
 * 信息，再决定是否采信」。
 */

'use strict';

// ─── 腿① TRADE 贸易平衡语境在场 ────────────────────────────
// Z1 具体差额/贸易词族（顺差/逆差/出口/进口/外贸/对外购买）。
//    注：不收独立动词族——「出口大于进口/出口导向/出口创汇/export-led/
//    import substitution」等动词形全部内含名词词（出口/进口/exports），
//    名词族已覆盖，独立动词族零检测权力（r368 自查移除死重）。
const TRADE_NOUN_ZH = /贸易顺差|贸易逆差|贸易盈余|贸易赤字|贸易差额|贸易平衡|经常账户|顺差|逆差|外贸|进出口|出口|进口|对外购买|对外购物|海外购买/;

const TRADE_ZH_GROUPS = [
  ['TRADE_NOUN_ZH', [TRADE_NOUN_ZH]],
];
const TRADE_ZH = [TRADE_NOUN_ZH];

// E1 差额/贸易词族（EN；\b 边界防 important 咬 import；复数形 surplus(?:es)? 收 surpluses）
const TRADE_NOUN_EN = /\btrade\s+(?:surplus(?:es)?|deficits?|balances?|gaps?)\b|current[- ]account|\bexports?\b|\bimports?\b|\bexporting\b|\bimporting\b|\bforeign\s+purchases?\b/i;

const TRADE_EN_GROUPS = [
  ['TRADE_NOUN_EN', [TRADE_NOUN_EN]],
];
const TRADE_EN = [TRADE_NOUN_EN];

// ─── 腿②a GAIN 赚钱形（顺差/出口=赚钱/财富）─────────────────
// G1 差额词 + 连接词 + 赚钱/财富族
const GAIN_ZH = /(?:顺差|盈余|出口|外贸)[^。，；]{0,10}(?:才叫|才算|才是|就是|意味着|说明|代表|等同于)[^。，；]{0,8}(?:赚钱|挣钱|获利|赚了|赚到|真金白银|财富|值钱)|国家[^。，；]{0,4}(?:在)?(?:赚钱|挣钱|获利)|(?:贸易|外贸)[^。，；]{0,4}(?:赚钱|挣钱|获利)/;
// GE1 trade surplus + means/shows + rich/winning 族
const GAIN_EN = /\btrade\s+surplus(?:es)?\b[^.]{0,30}?\b(?:means?|shows?|proves?|indicates?|signals?)\b(?!\s+not)[^.]{0,30}?\b(?:rich|wealthy|winning|profit|gain|getting\s+richer|better\s+off|prosperous)\b|\b(?:exports?|exporting)\s+(?:is|are)\s+(?:how|what)\b[^.]{0,25}?\b(?:rich|wealthy|prosperous)\b/i;

const GAIN_ZH_GROUPS = [['GAIN_ZH', [GAIN_ZH]]];
const GAIN_EN_GROUPS = [['GAIN_EN', [GAIN_EN]]];

// ─── 腿②b DRAIN 流失形（进口/逆差=财富外流/钱被赚走）────────
// D1 差额词 + 连接词 + 财富/钱 + 流失族
const DRAIN_ZH = /(?:进口|逆差|赤字)[^。，；]{0,10}(?:就是|意味着|等于|说明|代表)[^。，；]{0,12}(?:财富|钱|资金|资源|价值)[^。，；]{0,6}(?:流失|外流|流出|被赚走|被拿走|送出|蒸发|打水漂)|钱[^。，；]{0,8}被[^。，；]{0,8}(?:外国人|外国|他国|外人)[^。，；]{0,4}(?:赚|拿|挣|骗)走|(?:就是|意味着|等于|说明|代表|纯属|无非|属于)[^。，；]{0,6}(?:财富|钱)[^。，；]{0,4}(?:净)?(?:流出|外流|流失)/;
// DE1 trade deficit + means + wealth + flowing 族
const DRAIN_EN = /\btrade\s+deficit(?:s)?\b[^.]{0,30}?\b(?:means?|shows?)\b(?!\s+not)[^.]{0,30}?\b(?:wealth|money|resources?)\b[^.]{0,20}?\b(?:flowing|draining|leaking|lost|loses|gone|disappearing)\b|\bimports?\b[^.]{0,30}?\b(?:drain|drains|send|sends|ship|ships)\b(?!\s+not)[^.]{0,25}?\b(?:money|wealth|resources?)\b(?:\s+(?:abroad|overseas|out))?|\bevery\s+(?:dollar|cent|unit|yen|euro|pound)\b[^.]{0,35}?\bimports?\b[^.]{0,30}?\b(?:lost|lose|drain|waste)\b/i;

const DRAIN_ZH_GROUPS = [['DRAIN_ZH', [DRAIN_ZH]]];
const DRAIN_EN_GROUPS = [['DRAIN_EN', [DRAIN_EN]]];

// ─── 腿②c ACCUM 积累/强弱形（顺差越大越富/只有多出口少进口才能富强）─
// A1 顺差越大 + 富/强/占便宜族
const ACCUM_ZH = /顺差[^。，；]{0,8}(?:越)?大[^。，；]{0,8}(?:国家|就|越)?[^。，；]{0,8}(?:富|强|有钱|富裕|占便宜|划算)|(?:靠的是|关键在于|必须|应当|应该|要)[^。，；]{0,12}(?:顺差|盈余|出口)[^。，；]{0,12}(?:积累|攒下|集聚|赚取|换来)[^。，；]{0,4}(?:财富|钱|家底)|只有[^。！？；]{0,18}(?:多出口|少进口|出口大于进口|贸易顺差)[^。！？；]{0,12}(?:才能|就能|方能)[^。！？；]{0,8}(?:富强|富裕|有钱|强大|富有)|(?:出口|顺差)[^。，；]{0,6}(?:才|方)(?:能)?让?[^。，；]{0,6}(?:国家)?[^。，；]{0,4}(?:富|强)起来/;
// AE1 nations accumulate wealth through surplus 族 / surplus makes country richer 族
const ACCUM_EN = /\b(?:nations?|countries|country)\b[^.]{0,25}?\b(?:accumulates?|accumulating|amass(?:es)?|builds?\s+up)\b[^.]{0,25}?\bwealth\b[^.]{0,30}?\b(?:through|by|via)\b[^.]{0,30}?\b(?:surplus|surpluses|exporting|exports)\b|\b(?:trade\s+)?surplus\b[^.]{0,25}?\bmakes?\b[^.]{0,25}?\b(?:the\s+)?(?:country|nation|us|we)\b[^.]{0,15}?\b(?:rich|richer|wealthy|wealthier|better\s+off)\b/i;

const ACCUM_ZH_GROUPS = [['ACCUM_ZH', [ACCUM_ZH]]];
const ACCUM_EN_GROUPS = [['ACCUM_EN', [ACCUM_EN]]];

// ─── 腿②d LOSE 吃亏形（进口越多越吃亏/每一笔购买都是净流出）──
// L1 进口/逆差 + 就是/越多越 + 吃亏族
const LOSE_ZH = /(?:进口|逆差)[^。，；]{0,6}(?:就是|等于|意味着|纯属|无非)[^。，；]{0,6}(?:吃亏|冤大头|送钱|倒贴|被占便宜|赔本)|(?:进口|逆差)(?:越)?多[^。，；]{0,4}越(?:吃亏|冤|倒贴)|每一笔[^。，；]{0,10}(?:对外)?(?:购买|进口|花)[^。，；]{0,10}(?:都是|即|属|就是)[^。，；]{0,8}(?:财富|钱)[^。，；]{0,6}(?:净)?(?:流出|流失|外流|损失)/;
// LE1 imports are a pure loss 族 / spent on imports is lost 族
const LOSE_EN = /\bimports?\b[^.]{0,25}?\b(?:are|is)\b(?!\s+not)[^.]{0,20}?\b(?:pure\s+)?(?:loss|losing|waste|deadweight)\b|\bspent\s+on\s+imports\b[^.]{0,25}?\b(?:lost|lose)\b/i;

const LOSE_ZH_GROUPS = [['LOSE_ZH', [LOSE_ZH]]];
const LOSE_EN_GROUPS = [['LOSE_EN', [LOSE_EN]]];

// ─── 距离窗（贸易语境 × 财富误归因断言）────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：概念教学（点名重商主义概念 + 定义/历史/批判框架词）──
// 概念名单独出现不豁免（「重商主义其实是对的：顺差才让国家真正富
// 起来」是攻击形）——必须与框架词共现，防「重商主义」前缀绕过。
const CONCEPT_ZH = /重商主义[^。，；]{0,20}(?:是指|是一种|属于|定义为|理论|学派|思潮|思想|概念|观点|认为|主张|强调|核心|逻辑|信条|教条|批判|批评|反驳|驳倒|谬误|错误|早已|过时|淘汰|抛弃|历史|教材|教科书)|(?:是指|是一种|属于|定义为|理论|学派|思潮|思想|概念|观点|认为|主张|强调|核心|逻辑|信条|教条|批判|批评|反驳|驳倒|谬误|错误|早已|过时|淘汰|抛弃|历史|教材|教科书)[^。，；]{0,20}重商主义/;
const CONCEPT_EN = /\bmercantilism\b[^.]{0,40}?\b(?:is|was|refers?|defined|called|theory|school|doctrine|belief|holds?|argued?|view|idea|notion|fallacy|wrong|mistaken|discredited|debunked|outdated|obsolete|refuted|criticized|textbook|history|historically)\b|\b(?:is|was|refers?|defined|called|theory|school|doctrine|belief|holds?|argued?|view|idea|notion|fallacy|wrong|mistaken|discredited|debunked|outdated|obsolete|refuted|criticized|textbook|historically)\b[^.]{0,40}?\bmercantilism\b/i;

// ─── 豁免 B：纠正句（双赢/比较优势/恒等关系/进口也受益）────
// 只收**正面**形（双方受益/不是零和/自愿交换双赢/比较优势）与
// 恒等关系形（同一枚硬币/核算恒等/同时伴随商品流入）。不收裸
// 「有…流失」或「会…吃亏」形——那会把「不会造成财富流失」「进
// 口越多越吃亏」攻击句整体误豁免（r367 实测教训：无负向断言的
// 情态词正则会连攻击句的否定形一起吞）。
const CORRECT_ZH = /贸易[^。，；]{0,6}(?:不是|并非|绝非)[^。，；]{0,6}(?:零和|零合)|双方[^。，；]{0,4}(?:都)?(?:受益|获益|得利|有利|双赢)|自愿[^。，；]{0,6}(?:交换|贸易)[^。，；]{0,8}(?:受益|有利|双赢)|比较优势|各展所长|互通有无|贸易[^。，；]{0,8}(?:互惠|互利)|(?:逆差|进口)[^。，；]{0,6}(?:并不|不|未必|没)[^。，；]{0,4}(?:意味着|代表|说明)[^。，；]{0,8}(?:吃亏|落后|衰弱|损失|流失)|(?:进口|出口)[^。，；]{0,6}(?:也|同样)?(?:能|可以|让|有助于)[^。，；]{0,6}(?:受益|获益|双赢|富裕|富强)|同一枚硬币|(?:核算|会计)(?:恒等|意义)|镜像|同时[^。，；]{0,8}(?:伴随|对应)[^。，；]{0,6}(?:商品|货物|资源|价值)[^。，；]{0,4}(?:流入|进入|获得|换来)/;
const CORRECT_EN = /\btrade\s+is\s+not\s+zero[- ]sum\b|\bboth\s+(?:sides?|parties|countries)\b[^.]{0,20}?\b(?:gain|benefit|profit|win)\b|\bvoluntary\s+(?:trade|exchange)\b[^.]{0,25}?\b(?:benefit|gain|win[- ]win|mutually)\b|\bcomparative\s+advantage\b|\bgains?\s+from\s+trade\b|\bdeficit\b[^.]{0,20}?\b(?:does\s+not|doesn'?t)\b[^.]{0,20}?\b(?:mean|imply)\b[^.]{0,20}?\b(?:losing|losing\s+out|weaker|poorer)\b|\baccounting\s+identity\b|\bcapital\s+inflows?\b[^.]{0,25}?\b(?:offset|mirror|match)\b/i;

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

// 强否定前缀：命中词前出现这些词，说明整个断言被否定（「并不是财富
// 流失」= 不承认财富流失 → 失配）。注意「不会」不在表内（同 r367：
// 攻击句常用非绝对形）；「不是/并非」在表内——「进口不是财富流失」
// 是否定谬误主张的纠正句，而攻击样本无一以「不是」领起腿②。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|并没有真正|不能|无法|不是|并非)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not|did\s+not|has\s+not|have\s+not|no\s+longer\s+means?|is\s+not\s+a|are\s+not\s+a)\b/i;

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

// 签名收集：腿①贸易语境 × 腿②（赚钱 ∪ 流失 ∪ 积累 ∪ 吃亏），
// 两腿邻近共现，方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      trade: resolveGroups(R, TRADE_ZH_GROUPS),
      leg2: resolveGroups(R, GAIN_ZH_GROUPS)
        .concat(resolveGroups(R, DRAIN_ZH_GROUPS))
        .concat(resolveGroups(R, ACCUM_ZH_GROUPS))
        .concat(resolveGroups(R, LOSE_ZH_GROUPS)),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      trade: resolveGroups(R, TRADE_EN_GROUPS),
      leg2: resolveGroups(R, GAIN_EN_GROUPS)
        .concat(resolveGroups(R, DRAIN_EN_GROUPS))
        .concat(resolveGroups(R, ACCUM_EN_GROUPS))
        .concat(resolveGroups(R, LOSE_EN_GROUPS)),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const tradeM = collect(text, L.trade, false);
    if (tradeM.length === 0) continue;
    const leg2M = collect(text, L.leg2, true);
    if (leg2M.length === 0) continue;
    for (const c of tradeM) {
      const t = leg2M.find(x => dist(x, c) <= L.win);
      if (!t) continue;
      sigs.push({ lang: L.lang, trade: c.raw, leg2: t.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.trade + '|' + s.leg2;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入豁免常量；
// 默认值本身是 RegExp。统一成数组供 exempt() 消费（r367 实测教训：
// 空数组直传曾令 (R.X || X).test 崩，模块必须自带 normalize）。
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
 * 重商主义贸易顺差谬误签名：贸易差额语境在场 × 财富得失误归因断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectMercantilism(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论重商主义这个概念本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（双赢/比较优势/恒等等正当陈述）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'mercantilism',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '贸易语境「' + x.trade + '」× 财富得失归因「' + x.leg2 + '」'
      : 'trade context "' + x.trade + '" x wealth misattribution "' + x.leg2 + '"')),
    details: s.lang === 'zh'
      ? '重商主义贸易顺差谬误(' + sigs.length + '处: 「' + s.trade + '」被单边兑现为「' + s.leg2 + '」——贸易差额的互惠性与宏观恒等来源未经说明即被免掉)(zh)'
      : 'mercantilism-wealth-misattribution(' + sigs.length + 'x: "' + s.trade + '" is cashed out one-sidedly as "' + s.leg2 + '" — mutual gains and macro-accounting sources of the trade balance asserted away)(en)',
    guidance: '贸易差额（顺差/逆差）反映的是储蓄-投资结构、资本流动与核算恒等关系，不是国家间财富得失：自愿出口与自愿进口是同一笔互惠交易的两面，进口本身就是贸易收益（获得商品与服务），双方按比较优势专业化都获益。把「顺差=国家赚钱、逆差=财富外流、出口创造财富而进口只送钱出去」当作真理，是重商主义（mercantilism）的经典谬误——它把互惠贸易退化成零和博弈。正当做法是给出差额的宏观来源（储蓄投资差异、资本流入流出、结构性因素）与双方获益机制，而不是单边断言财富得失；点名重商主义概念的教学句、指出双赢/比较优势/恒等关系的纠正句、以及无财富得失断言的中性贸易陈述（出口退税政策、海关统计数据），都是正当做法。',
    tags: ['economics', 'trade', 'mercantilism', 'trade-balance', 'wealth-misattribution', 'zero-sum-intuition', 'aggregate-reasoning'],
  };
}

module.exports = {
  detectMercantilism,
  __internals: () => ({
    TRADE_NOUN_ZH,
    TRADE_NOUN_EN,
    GAIN_ZH, GAIN_EN,
    DRAIN_ZH, DRAIN_EN,
    ACCUM_ZH, ACCUM_EN,
    LOSE_ZH, LOSE_EN,
    TRADE_ZH, TRADE_EN,
    TRADE_ZH_GROUPS, TRADE_EN_GROUPS,
    GAIN_ZH_GROUPS, GAIN_EN_GROUPS,
    DRAIN_ZH_GROUPS, DRAIN_EN_GROUPS,
    ACCUM_ZH_GROUPS, ACCUM_EN_GROUPS,
    LOSE_ZH_GROUPS, LOSE_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
