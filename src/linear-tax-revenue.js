/**
 * src/linear-tax-revenue.js — 「税率-税收线性误读」检测器
 * （r377 新建：econ_reasoning_gate 聚合族第 33 子族 / 插件层第 38 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r377 立项探针（scripts/round-377/probe-r377-pool.js + probe-r377-scope.js，
 *   v6.8.190 pristine 基线）12 候选同池定拨：D linear_tax_revenue 首轮穿透
 *   3/4 良性 0 脏、二段深探穿透 7/10 真零命中（良性 2/10 非 pass 均系存量
 *   monocausal_attribution / pseudo_causal 误伤，非本族增量）；F supply_cures
 *   穿透 6/10、A cantillon 2/5 良性 1 脏、C lump_of_labor 2/4 良性 1 脏、
 *   B crowding_out 2/4 良性 2 脏、其余 ≤1/2——D 为「高穿透 × 良性边界最净」，
 *   定拨落地。海外扫描（两个 topic）：arXiv OR 噪声 parse-fail / GitHub repos
 *   0 / S2 429——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自公共经济学标准论述：税收收入
 *   等于税率乘以税基（revenue = rate × base），税基会随税率反应（价格弹性、
 *   劳动供给弹性、避税与逃逸、跨期替代），因此税率与税收不是线性等比关系
 *   （拉弗曲线 / Laffer curve 描述这一非线性）。谬误在于把税率变动按固定
 *   比例折算成财政收入变动：「税率提高一倍，税收自然也会翻倍」「减税一半，
 *   财政收入就少一半」「提高烟草税三成，税收必然跟着涨三成」「把企业所得
 *   税从 25% 降到 15%，财政收入就按四成折损」「Tax cuts always cost the
 *   government exactly the rate cut times the current base」——跳过税基对
 *   税率的反应机制，把一笔需要弹性估算的账讲成闭着眼睛都能算的固定比例账。
 *
 * 辨别的族：税率-税收线性误读（linear tax-revenue assumption / tax-base
 *   elasticity neglect）——文本同时给出两个信号：
 *   腿① RATE 税率变动语境在场——税率/税负名词、加/减/降/增税动词形、
 *       动词+税种形（提高烟草税）、百分比起止形（从25%降到15%）；
 *       tax rate / raise taxes / tax cuts / VAT rate；
 *   腿② PROP 等比兑现断言在场——四种形：
 *       · P1 联动形（税收/财政收入 + 跟着/随着/同步/相应 + 涨/降/变化）；
 *       · P2 比例词形（按比例/同比例/等比/正比例/成比例/成正比/线性关系）；
 *       · P3 数量兑现形（税收/财政词 + 翻倍/翻番/减半/腰斩/X成/一半）；
 *       · P4 对等多少形（加重多少…增加多少）；
 *       EN：will double/halve … revenue/receipts；proportionally /
 *       one-for-one / by the same；exactly the rate。
 *   两腿近距共现，缺一不判。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 条件句（「在税基不变的简化假设下，税率提高会使税收同比例增加」）由
 *     COND 豁免——假设/前提/不变/固定/ceteris paribus 标记共现；
 *   · 概念讨论（拉弗曲线描述税率与税收的非线性关系、税基弹性分析、线性
 *     模型的核心假设）由 CONCEPT 豁免——概念名 + 框架词共现，防前缀绕过
 *     （r368/r369/r371/r373/r375/r376 同款教训）；
 *   · 纠正句/评估否定句（「不能简单按税率比例折算」「会高估或低估政策
 *     效果」）由腿②紧前否定窗 + HEDGE 短语守卫承担——否定/评估词落在腿②
 *     前后窗内即豁免；
 *   · 事实性收入陈述（「去年增值税收入翻倍」）天然不判——腿①要求税率
 *     变动语境（税率/税负/加税减税/税率百分比起止），裸税种名词不触发；
 *   · 「按税率比例」类短语在否定窗内（「不能简单按税率比例折算」）由
 *     NEG 守卫排除。
 *
 * 与既有维度的边界（r377 归因，探针 + 边界实测）：
 *   · tax_incidence（r373）管法定归宿≠经济归宿（税种×法定归属×免转嫁
 *     三腿）——本族管税率-税收等比折算，攻击集零交集（tax_incidence 攻击
 *     句无等比标记，本族攻击句无归属/转嫁标记）；
 *   · price_control（r367）管价格管制单效应断言——本族腿①须税率语境，
 *     管制工具（房租上限/限价）不触发；
 *   · money_illusion（dim 234）管名义×实际感知——轴不同；
 *   · paradox_of_thrift（r369）管节俭加总为总量向好——本族管税率-财政
 *     收入折算，储蓄-节俭不在腿①；
 *   · 存量维度在 3/10 攻击句上代拦（pseudo_causal / sorites_fallacy /
 *     perfect_error），但 7/10 真零命中证明存量维度整体零覆盖。
 *
 * 判据（两腿近距共现 + 三组豁免 + 腿②双守卫，缺一不判）：
 *   ① 腿① RATE 税率变动语境在场（ZH 三组 / EN 两组）；
 *   ② 腿② PROP 等比兑现断言在场（ZH 四形 / EN 三形，受紧前否定窗与对冲
 *     短语守卫）；
 *   ③ 两腿须落在邻近窗内（以腿②为锚，ZH 90 字 / EN 260 字符），方向不限；
 *   ④ 豁免 A 概念讨论（拉弗曲线/税基弹性/线性模型 + 框架词共现）；
 *   ⑤ 豁免 B 条件句（在…假设下/if…unchanged 类）；
 *   ⑥ 豁免 C 纠正句（并非线性/不能简单按比例折算 类，与腿②否定窗互补）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一个简化模型的前提（「在税基
 * 不变的假设下税率翻倍税收翻倍」——COND 豁免天然排除），命中的是把税率
 * 变动按固定比例直接折算成财政收入变动的断言。verify 的语义是「这段文本
 * 把税率-税收关系讲成了线性等比，先把税基弹性机制对齐（拉弗曲线、税基
 * 对税率的反应）再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 条件句（在税基不变的简化假设下/if the base is held fixed）；
 *   · 概念讨论（拉弗曲线描述非线性关系/税基弹性分析/线性模型假设）；
 *   · 纠正句与评估否定句（并非线性关系/不能简单按税率比例折算/会高估或低估）；
 *   · 事实性收入陈述（去年增值税收入翻倍/税收增长一成，无税率变动语境）；
 *   · 公式陈述（税收等于税率乘以税基）；
 *   · 动态评分主张（减税可能通过增长扩大税基——非等比折算形）；
 *   · 税负归属/转嫁讨论（对企业征税由企业承担，不会转嫁——tax_incidence 射程）。
 */

'use strict';

// ─── 腿① RATE 税率变动语境在场 ─────────────────────────────
// R1 税率/税负名词。
const RATE_ZH = /税率|税负/;
// R2 加/减/降税动词形（动词 + ≤3 字 + 税，覆盖 加税/减税/降税/提高烟草税/
//   上调税率/调整税制——动词形本身即税率变动语义）。
const RATE_ZH_B = /(?:加|减|降|增|提高|降低|上调|下调|调整|减免|取消|设立|开征|恢复)[^。！？，；]{0,3}税/;
// R3 百分比起止形（税…从25%降到15%/自13%提至20%——税率量化变动在场）。
const RATE_ZH_C = /(?:税|税额|税负)[^。！？，；]{0,12}(?:从|自)\d+(?:\.\d+)?%[^。！？，；]{0,6}(?:降|提|升|增|减|调|恢复|取消)(?:到|至|为|低|高|回|至)?\s*\d+(?:\.\d+)?%/;

// EN R1：tax rate(s)。
const RATE_EN = /\btax\s+rates?\b/i;
// EN R2：raise/cut taxes、tax cuts/hikes/increases。
const RATE_EN_B = /(?:raise|increase|cut|reduce|lower|hike|adjust)\s+(?:the\s+|a\s+)?tax(?:es)?\b|\btax\s+(?:cuts?|hikes?|increases?|reductions?)\b|\bVAT\s+rate\b/i;

// ─── 腿② PROP 等比兑现断言在场 ─────────────────────────────
// P1 联动形：财政/税收词 + 跟着/随着/同步/相应 + 涨/降/变化。
const PROP_P1_ZH = /(?:税收|财政收入|税款|财税收入|入库(?:的)?钱|库房|财政(?:收入)?)[^。！？，；不并没未难无缘]{0,10}(?:跟着|随着|伴随|同步|相应)[^。！？，；]{0,8}(?:涨|增|升|降|减|落|波动|变化|翻)/;
// P2 比例词形：按比例/同比例/等比/正比例/成比例/成正比/线性关系。
const PROP_P2_ZH = /(?:按|依|以)(?:同|等|固定|一定|税率的?)?比例|同比例|等比例|等比|正比例|成比例|成正比|线性(?:关系|增长|变化)|固定比例/;
// P3 数量兑现形：财政/税收词 + 翻倍/翻番/减半/腰斩/打对折；或 + X成/一半。
const PROP_P3_ZH = /(?:税收|财政收入|税款|财税收入|入库(?:的)?钱|库房)[^。！？，；不并没未难无缘]{0,12}(?:翻倍|翻番|减半|腰斩|打对折)|(?:入库|税收|财政)[^。！？，；不并没未难无缘]{0,6}(?:按|以)?[^。！？，；不并没未难无缘]{0,3}(?:一成|两成|三成|四成|五成|六成|七成|八成|九成|一半)/;
// P4 对等多少形：加重/提高多少…增加/减少多少。
const PROP_P4_ZH = /(?:加重|提高|增加|减少|降低|变动|变化|调整|浮动)(?:多少|几成|几个点)[^。！？]{0,14}(?:就|也|还)?(?:增加|减少|多|少|变动|浮动)(?:多少|几成|几个点)/;

// EN E1：will double/halve … revenue/receipts（收入名词前 ≤2 个词）。
const PROP_E1_EN = /\b(?:will|would|can|should|must)\s+(?:also\s+)?(?:double|halve|triple|quadruple)\s+(?:\w+\s+){0,2}(?:revenue|receipts?|collections?|income)\b/i;
// EN E2：proportionally / in proportion / one-for-one / by the same。
const PROP_E2_EN = /\b(?:proportionally|in\s+proportion|one[- ]for[- ]one|by\s+the\s+same\s+(?:amount|percentage|proportion|rate)|in\s+direct\s+proportion|scales?\s+linearly)\b/i;
// EN E3：exactly the rate / exactly proportional（精确等比兑现）。
const PROP_E3_EN = /\bexactly\s+the\s+(?:rate|tax\s+rate|proportional|same\s+proportion)/i;

const PROP_ZH_GROUPS = [
  ['PROP_P1_ZH', [PROP_P1_ZH]],
  ['PROP_P2_ZH', [PROP_P2_ZH]],
  ['PROP_P3_ZH', [PROP_P3_ZH]],
  ['PROP_P4_ZH', [PROP_P4_ZH]],
];
const PROP_EN_GROUPS = [
  ['PROP_E1_EN', [PROP_E1_EN]],
  ['PROP_E2_EN', [PROP_E2_EN]],
  ['PROP_E3_EN', [PROP_E3_EN]],
];

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const PAIR_ZH = 90;
const PAIR_EN = 260;

// ─── 豁免 A：概念讨论（概念名 + 框架词共现，防前缀绕过）──────────
const CONCEPT_ZH = /(?:拉弗曲线|税基弹性|税收弹性|税率弹性|线性模型|线性假设|比例关系)[^。！？\n]{0,20}(?:理论|框架|学说|观点|视角|模型|争论|争议|认为|指出|机制|概念|分析|讨论|说明|介绍|表明|描述|解释|假设|前提|核心)/;
const CONCEPT_EN = /\blaffer\s+curve\b|\btax\s+(?:base\s+)?elasticity\b|\blinear\s+model\b|\blinear\s+assumption\b|\bsimple\s+model\b/i;

// ─── 豁免 B：条件句（假设/前提/不变/固定 共现）──────────
const COND_ZH = /(?:在|若|如果|假设|假定|设)[^。！？]{0,16}(?:假设|前提下|不变|固定|恒定|既定|简化|其他条件)/;
const COND_EN = /\b(?:if|when|assuming|assume|suppose|supposing|holding|with)\b[^.]{0,40}\b(?:unchanged|constant|fixed|equal|held\s+fixed|ceteris\s+paribus)\b/i;

// ─── 豁免 C：纠正句（并非线性/不能简单按比例折算 类）──────────
const CORRECT_ZH = /(?:并非|并不是|不是|不能|不应|难以)[^。！？]{0,8}(?:线性|等比|同比例|按比例|正比例|固定比例)|税率与税收(?:并非|并不是|不是)[^。！？]{0,6}(?:线性|比例)|不等于|并非线性/;
const CORRECT_EN = /\b(?:not|isn'?t|aren'?t|cannot|can'?t)\s+(?:a\s+)?(?:linear|proportional|one[- ]for[- ]one)\b|\bnot\s+linearly\s+proportional\b|\bnot\s+a\s+fixed\s+proportion\b/i;

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

// 腿②双守卫（r375 同款）：紧前否定窗（ZH 6 字 / EN 20 字符，含否定即
//   「不会翻倍/并不等比」纠正形）+ 对冲短语（腿②前后 20/40 字内出现
//   「不意味着/误解/高估/低估」类，「按比例折算会高估政策效果」是评估
//   否定句）。只查腿②，防把腿①正当否定误当腿②否定。两者均可负例注入。
const NEG_ZH = /(?:并不|并非|未|未必|不一|不|没|无|别)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|高估|低估|夸大|歪曲|简单化|一刀切|偏离)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|overestimat\w+|underestimat\w+|does\s+not\s+mean|doesn'?t\s+mean)/i;

function matchAlive(text, x, opts, R) {
  opts = opts || {};
  if (opts.neg) {
    const negZh = (R && R.NEG_ZH !== undefined) ? R.NEG_ZH : NEG_ZH;
    const negEn = (R && R.NEG_EN !== undefined) ? R.NEG_EN : NEG_EN;
    const hedgeZh = (R && R.HEDGE_ZH !== undefined) ? R.HEDGE_ZH : HEDGE_ZH;
    const hedgeEn = (R && R.HEDGE_EN !== undefined) ? R.HEDGE_EN : HEDGE_EN;
    const negZhList = Array.isArray(negZh) ? negZh : [negZh];
    const negEnList = Array.isArray(negEn) ? negEn : [negEn];
    const hedgeZhList = Array.isArray(hedgeZh) ? hedgeZh : [hedgeZh];
    const hedgeEnList = Array.isArray(hedgeEn) ? hedgeEn : [hedgeEn];
    const beforeZh = text.slice(Math.max(0, x.idx - 6), x.idx);
    const beforeEn = text.slice(Math.max(0, x.idx - 20), x.idx);
    const afterZh = text.slice(x.end, x.end + 20);
    const afterEn = text.slice(x.end, x.end + 40);
    for (const re of negZhList) { if (re && re.test && (re.test(beforeZh))) return false; }
    for (const re of negEnList) { if (re && re.test && re.test(beforeEn)) return false; }
    for (const re of hedgeZhList) { if (re && re.test && (re.test(beforeZh) || re.test(afterZh))) return false; }
    for (const re of hedgeEnList) { if (re && re.test && (re.test(beforeEn) || re.test(afterEn))) return false; }
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

function collect(text, list, opts, R) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, opts, R)) m.push(x);
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
      // 为永不匹配）。两者都不得 crash——RegExp 不可 spread（r369 教训）。
      regs = Array.isArray(v) ? v : (v instanceof RegExp ? [v] : []);
    } else {
      regs = defs;
    }
    out.push(...regs);
  }
  return out;
}

// 签名收集：腿②等比兑现断言为锚（窗内），腿①税率变动语境在场。
// 两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      rate: resolveGroups(R, [
        ['RATE_ZH', [RATE_ZH]],
        ['RATE_ZH_B', [RATE_ZH_B]],
        ['RATE_ZH_C', [RATE_ZH_C]],
      ]),
      prop: resolveGroups(R, PROP_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      rate: resolveGroups(R, [
        ['RATE_EN', [RATE_EN]],
        ['RATE_EN_B', [RATE_EN_B]],
      ]),
      prop: resolveGroups(R, PROP_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const rateM = collect(text, L.rate);
    if (rateM.length === 0) continue;
    // 腿②受双守卫（紧前否定窗 + 对冲短语）
    const propM = collect(text, L.prop, { neg: true }, R);
    if (propM.length === 0) continue;
    for (const p of propM) {
      const r = rateM.find(x => dist(x, p) <= L.win);
      if (!r) continue;
      sigs.push({ lang: L.lang, rate: r.raw, prop: p.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.rate + '|' + s.prop;
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
 * 税率-税收线性误读签名：税率变动语境 × 等比兑现断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectLinearTaxRevenue(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（拉弗曲线/税基弹性/线性模型本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：条件句（在税基不变的简化假设下 / if the base is held fixed）
  if (exempt(_normInject(R.COND_ZH, COND_ZH), text) || exempt(_normInject(R.COND_EN, COND_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 C：纠正句（并非线性关系 / 不能简单按税率比例折算）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'linear_tax_revenue',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '税率变动「' + x.rate + '」被按固定比例折算为「' + x.prop + '」'
      : 'the rate change "' + x.rate + '" is mapped proportionally onto "' + x.prop + '"')),
    details: s.lang === 'zh'
      ? '税率-税收线性误读(' + sigs.length + '处: 「' + s.prop + '」把税率变动按固定比例折算成财政收入变动，跳过税基对税率的反应)(zh)'
      : 'linear-tax-revenue(' + sigs.length + 'x: "' + s.prop + '" maps the rate change onto revenue by a fixed proportion, skipping tax-base elasticity)(en)',
    guidance: '税率-税收线性误读（linear tax-revenue assumption / tax-base elasticity neglect）：税收收入等于税率乘以税基（revenue = rate × base），而税基会随税率反应——需求价格弹性、劳动供给弹性、避税逃逸与跨期替代都会让同向或反向的基数变化抵消部分税率效应（拉弗曲线/Laffer curve 描述这一非线性）。谬误在于把税率变动按固定比例折算成财政收入变动：「税率提高一倍，税收自然也会翻倍」「减税一半，财政收入就少一半」「提高烟草税三成，税收必然跟着涨三成」「把企业所得税从25%降到15%，财政收入就按四成折损」「Doubling the tax rate will double the tax revenue」「Tax cuts always cost the government exactly the rate cut times the current base」——把一笔需要弹性估算的账讲成闭着眼睛都能算的固定比例账。正当做法是先把机制对齐：说明收入恒等式的两边（「税收 = 税率 × 税基，两个因子都会动」）、指出税基反应渠道（「提高税率会缩小税基：避税、减少劳动供给、需求下降」）、给出弹性估算框架（「财政收入变化 = 税率效应 + 税基效应，净结果取决于弹性大小」）、区分不同税种与制度环境（「对低弹性税基（如成瘾性消费品）与高弹性税基（如资本利得）的税率效应完全不同」）；在税基不变的简化假设下按比例折算是教科书推演（须标明假设），拉弗曲线与税基弹性的理论讨论、税收等于税率乘以税基的公式陈述，不在本族射程。',
    tags: ['economics', 'taxation', 'fiscal', 'proportionality', 'elasticity', 'laffer-curve'],
  };
}

module.exports = {
  detectLinearTaxRevenue,
  __internals: () => ({
    RATE_ZH, RATE_ZH_B, RATE_ZH_C,
    RATE_EN, RATE_EN_B,
    PROP_P1_ZH, PROP_P2_ZH, PROP_P3_ZH, PROP_P4_ZH,
    PROP_E1_EN, PROP_E2_EN, PROP_E3_EN,
    PROP_ZH_GROUPS, PROP_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, COND_ZH, COND_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
