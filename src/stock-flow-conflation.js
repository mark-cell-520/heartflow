/**
 * src/stock-flow-conflation.js — 「存量-流量混淆」检测器
 * （r374 新建：econ_reasoning_gate 聚合族第 29 子族 / 插件层第 34 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r374 立项探针（scripts/round-374/probe-r374-pool.js + probe-r374-scope.js，
 *   v6.8.190 pristine 基线）七候选同池定拨：A certainty_effect 穿透 1/6（存量
 *   perfect_error/confidence/absolute_claim 大量代拦）且良性 2/5 脏、B
 *   absolute_advantage 穿透 3/5、C tax_incidence 穿透 2/5、D money_creation
 *   穿透 7/10 但与 money_illusion(dim234 名义×实际) 射程相邻、E stock_flow_
 *   confusion 穿透 7/10 且良性 2/8 非 pass 均为存量维度误伤（monocausal_
 *   attribution / soft_deflection，非新族增量）、F competition_waste 穿透 2/5
 *   且良性 3/5 脏、G linear_tax_revenue 穿透 3/5——**stock_flow_confusion
 *   为「高穿透 × 良性边界最净 × 与既有维度射程不相邻」**，定拨落地。
 *   二段深探（probe-r374-scope.js）：攻击穿透 7/10 真零命中（存量维度零覆盖），
 *   良性经「存量/流量概念教学 + 纠正句」两组豁免后干净。
 *   海外扫描：arXiv OR 展开噪声零相关、GitHub repos 0、S2 429——空返，按既有
 *   形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自经济学/统计素养的标准论述：
 *   存量（stock）是某一时点的累积水平（债务总额、市值、存款余额、外汇储备、
 *   账户结余），流量（flow）是单位时间的变化速度（年产出、年收入、年度盈
 *   亏）。存量-流量比（债务/GDP、储蓄相当于几个月收入）是正当的相对规模
 *   度量；谬误在于把存量的**水平**直接当作流量的**速率**兑现——「债务超过
 *   一年 GDP 等于全国人民一年白干、国家已经破产」「余额十万亿可见每年新增
 *   财富就有十万亿」「市值比别国 GDP 高所以比人家还有钱」。这把历年累积
 *   与年度速度之间的除法跳过了，让任何大数字都能讲成破产故事或实力排名。
 *
 * 辨别的族：存量-流量混淆（stock-flow conflation / level-rate confusion）——
 *   文本同时给出两个信号：
 *   腿① STOCK 存量指称在场——债务总额/存款余额/外汇储备/账户结余/市值/净值/
 *       累计放款/存量；total debt / market cap / net worth / account balance /
 *       forex reserves；
 *   腿② EQUATE 流量兑现断言在场——三种兑现形缺一不判地出现其一：
 *       · ZS 零和兑现（等于/相当于 + 一年/每年 + 白干/白拿/净赚）；
 *       · RATE 速率兑现（说明/可见/意味着 + 每年 + 赚/新增/放出 + 万亿/亿/
 *         这么多/翻倍——把存量水平讲成年度速率）；
 *       · CMP 流平比较（比……还有钱/更有实力/产出更多/都多——存量与流量的
 *         不当跨类比较结论）；
 *   两腿近距共现，缺一不判。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 存量-流量**比率**是标准度量（「储蓄相当于一年收入」「债务与 GDP 之比
 *     衡量相对规模」）——腿②不收裸比率陈述，只收把存量**兑现为流量**的结论
 *     形（白干/净赚/就有这么多/比人有钱）；
 *   · 概念教学（存量指标反映累积、流量反映速度、两者口径不同）与纠正句
 *     （不能混为一谈、不等于破产判断）由 CONCEPT/CORRECT 两组豁免排除；
 *   · 恰当怀疑形（不等于破产/并非不可持续）由腿②否定守卫 + CORRECT 排除。
 *
 * 与既有维度的边界（r374 归因，探针 + 边界实测）：
 *   · count_rate_conflation（r249）管「原始计数 vs 发生率」的暴露量归一化
 *     缺失——本族管「时点存量水平 vs 单位时间流量速率」的口径混用，轴不同；
 *   · money_illusion（dim 234，r268 前既有）管「名义 × 实际」的个体感知
 *     错觉——本族管存量-流量的口径兑现，且 money_illusion 对探针攻击句
 *     实测零命中（A1「央行多印钞大家钱变多国家更富」pass），射程不重叠；
 *   · statistical_misleading / false_equivalence 管泛化统计误导——本族要求
 *     存量指称与流量兑现两腿共现；
 *   · hasty_generalization 在个别样本（外汇储备三万亿句）上代拦，但 7/10
 *     攻击真零命中证明存量维度整体零覆盖。
 *
 * 判据（两腿近距共现 + 两组豁免 + 腿②否定守卫，缺一不判）：
 *   ① 腿① STOCK 存量指称在场；
 *   ② 腿② EQUATE 流量兑现断言在场（ZS/RATE/CMP 三形其一，受否定守卫：
 *     「并不等于/不会每年」是对冲形）；
 *   ③ 两腿须落在邻近窗内（以腿①为锚，ZH 90 字 / EN 260 字符），方向不限；
 *   ④ 豁免 A 概念教学（存量/流量/stock-flow/debt-to-GDP 概念名 + 框架词
 *      共现，防前缀绕过）；
 *   ⑤ 豁免 B 纠正句（不能混为一谈/不等于破产判断/并非……）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一个跨口径比较（「这家公司市值
 * 超过多国 GDP」是常见事实陈述——腿②缺省天然排除）。verify 的语义是「这段
 * 文本把存量水平直接兑现成了年度流量或实力排名，先把口径对齐（存量是历年
 * 累积、流量是年度速度）再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 存量-流量比率陈述（储蓄相当于一年收入、债务与 GDP 之比衡量相对规模）；
 *   · 概念教学（存量指标反映累积水平，流量指标反映变化速度）；
 *   · 纠正句（两者口径不同，不能混为一谈、不等于破产判断）；
 *   · 恰当比较（存款余额居全国前列——腿②缺省）；
 *   · 否定/对冲形（这并不等于一年白干——腿②否定守卫）。
 */

'use strict';

// ─── 腿① STOCK 存量指称在场 ─────────────────────────────
// 形 A：存量标记词 + 经济累积名词（债务总额/存款余额/结余/累计放款）。
const STOCK_ZH_A = /(?:债务|负债|外债|欠款|贷款|放款)(?:总额|余额|规模|存量)|存款余额|贷款余额|账户(?:余额|结余)|账面余额|(?:外汇|外储)储备|资金结余|累计(?:发放|放款|投入|存款|发行)|资产净值|房产净值|净资产|总资产|股票市值|公司市值|总市值|市值|结余|存量|积蓄|存款总额|存款/;
// 形 B：存量概念词（与腿②共现时承当存量侧）。
const STOCK_ZH_B = /余额|结余|存量|累计|净值|总额/;

const STOCK_ZH_GROUPS = [['STOCK_ZH_A', [STOCK_ZH_A]], ['STOCK_ZH_B', [STOCK_ZH_B]]];
// EN 形 A：带标记的存量短语（total debt / market cap / net worth / reserves）。
const STOCK_EN_A = /\b(?:total|national|public|sovereign|outstanding|gross)\s+(?:debt|liabilit\w+|loans?|deposits?|reserves?|savings?)\b|\bmarket\s+cap(?:italization)?\b|\bnet\s+worth\b|\bstock\s+of\b|\bcumulative\s+(?:loans?|deposits?|savings?|lending|debt)\b|\bforex\s+reserves?\b|\b(?:debt|deposits?|savings?|reserves?)\s+(?:exceed\w*|surpass\w*|exceeded|surpassed|topped|top)\b|\b(?:savings?|account|loan)\s+balance\b|\bdebt\s+(?:total|stock|level)\b/i;
// EN 形 B：存量名词裸形（account/reserve/asset 等，靠腿②收窄）。
const STOCK_EN_B = /\b(?:debt|deposits?|savings?|reserves?|assets?|balance|equity)\b/i;

const STOCK_EN_GROUPS = [['STOCK_EN_A', [STOCK_EN_A]], ['STOCK_EN_B', [STOCK_EN_B]]];

// ─── 腿② EQUATE 流量兑现断言在场 ─────────────────────────
// ZS 零和兑现：等于/相当于 + 一年/每年 + 白干/白拿/净赚——把存量水平兑现为
//   全民被抹掉的年度劳动。
const EQUATE_ZS_ZH = /(?:等于|相当于|等同于)[^。！？；，]{0,16}(?:一年|全年|每年|年年|年均)(?:都|就|又)?(?:白干|白拿|白赚|净赚|白挣|白忙|白干一场)/;
// RATE 速率兑现：说明/可见/意味着 + 每年 + 赚/新增/放出 + 万亿/亿/这么多/翻倍
//   ——把存量水平讲成年度速率（尾量词限「万亿/亿/这么多/翻倍」，防「一万元」
//   型正当流量陈述误伤）。
const EQUATE_RATE_ZH = /(?:说明|可见|意味着|证明)[^。！？；，]{0,16}(?:每年|年年|年均|一年)[^。！？；，]{0,8}(?:赚|挣|净赚|新增|白拿|白干|放出|贷出|发放)[^。！？；，]{0,10}(?:万亿|亿|这么多|这么多钱|翻倍|永远|一直|美元)/;
// CMP 流平比较：比……还有钱/更有实力/产出更多——存量与流量的跨类比较结论。
//   不收裸「比……GDP 还高」（正当跨类比较），只收把存量讲成财富/实力排名的形。
const EQUATE_CMP_ZH = /(?:比|超过)[^。！？；，]{0,18}(?:还有钱|更有钱|更有实力|更富|更富有|富裕|产出更多|产值更高|收入更高|都多|还多)|(?:生产总值|产值|收入|产出|GDP)[^。！？；，]{0,6}(?:加起来|合计|总和)[^。！？；，]{0,6}(?:还|都|更)?(?:高|多)/;

const EQUATE_ZH_GROUPS = [['EQUATE_ZS_ZH', [EQUATE_ZS_ZH]], ['EQUATE_RATE_ZH', [EQUATE_RATE_ZH]], ['EQUATE_CMP_ZH', [EQUATE_CMP_ZH]]];

// EN ZS：equivalent to / equals + a year of work/output + for nothing / wiped out。
const EQUATE_ZS_EN = /\b(?:equivalent\s+to|equals?|means?)\b[^.]{0,26}\b(?:a|one)\s+year\s+of\s+(?:work|labor|output|production|income)\b[^.]{0,20}\b(?:for\s+nothing|wiped\s+out|erased|vanishes?|gone|lost)\b|\b(?:a|one)\s+year'?s?\s+(?:work|output|income|production)\s+(?:for\s+nothing|wiped\s+out|erased)\b/i;
// EN RATE：means/shows + earns/makes/produces + that much / the same per year。
const EQUATE_RATE_EN = /\b(?:means?|shows?|proves?|implies?)\b[^.]{0,24}\b(?:earns?|makes?|nets?|saves?|produces?|adds?)\b[^.]{0,20}\b(?:that\s+much|as\s+much|the\s+same\s+amount|per\s+year|a\s+year|every\s+year|each\s+year)\b|\b(?:earns?|makes?|nets?|saves?)\s+(?:that|this)\s+much\s+(?:every|each|per)\s+year\b/i;
// EN CMP：richer/wealthier/more powerful than + effectively bankrupt。
const EQUATE_CMP_EN = /\b(?:richer|wealthier|more\s+powerful|more\s+prosperous)\s+than\b|\b(?:gone|effectively|practically|virtually)\s+bankrupt\b|\bbankrupt\b[^.]{0,24}\b(?:because|since|so\s+the|means)\b/i;

const EQUATE_EN_GROUPS = [['EQUATE_ZS_EN', [EQUATE_ZS_EN]], ['EQUATE_RATE_EN', [EQUATE_RATE_EN]], ['EQUATE_CMP_EN', [EQUATE_CMP_EN]]];

// ─── 距离窗（存量指称为锚，兑现断言须落窗内）─────────────────
const PAIR_ZH = 90;
const PAIR_EN = 260;

// ─── 豁免 A：概念教学（存量/流量概念名 + 框架词共现）──────────
// 概念名单独出现不豁免——须与指标/口径/概念/之比等框架词共现，防前缀绕过
// （r368/r369/r371/r373 同款教训）。B1「债务与GDP之比是存量与流量之比」的
// 框架词是「之比/口径」，B5「多年累积的存量……流量贡献」的框架词是「只是」。
const CONCEPT_ZH = /(?:存量|流量)[^。！？\n]{0,24}(?:之比|指标|概念|口径|混为一谈|不能(?:混淆|等同|混同|直接比较)|并非|不等于|区别|不同|反映|只是|贡献|标准|衡量|相对规模|口径不同)|(?:之比|指标|概念|口径|区别|不同|反映|衡量|标准)[^。！？\n]{0,24}(?:存量|流量)/;
const CONCEPT_EN = /\bstock\b[^.]{0,24}\b(?:measure|concept|flow|ratio|metric|level|indicator)\b|\b(?:measure|concept|flow|ratio|metric|indicator)\b[^.]{0,24}\bstock\b|\bdebt[–-]to[–-]GDP\b|\bstock[–-]flow\b|\bconflat\w+\b[^.]{0,24}\b(?:level|rate|stock|flow)s?\b|\blevels?\s+with\s+rates?\b/i;

// ─── 豁免 B：纠正句（口径对齐/否认混用）────────────────────
const CORRECT_ZH = /(?:不能|不应|不可|并非|不等于|算不上|谈不上)(?:混为一谈|等同|混淆|直接比较|相提并论|同日而语)|混为一谈|不能混淆|口径(?:不同|不一|存在差异)|两者(?:口径|性质)(?:不同|不一)|不等于破产|并非破产|不能据此/;
const CORRECT_EN = /\b(?:not|never|cannot|can'?t|shouldn'?t)\s+(?:be\s+)?(?:conflat\w+|compared|equated|confused)\b|\bconflat\w+\b[^.]{0,24}\b(?:is|are)\s+(?:wrong|an?\s+error|a\s+fallacy|mistaken)\b|\bnot\s+(?:a\s+)?bankrupt\w*\b|\bnot\s+bankrupt\b/i;

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

// 腿②否定守卫：兑现断言被否定/对冲时（「并不等于一年白干」「does not mean
// it earns that much」是对冲形，不是攻击）。ZH 用 STRONG_NEG_ZH 命中腿②文本
// 或紧前 6 字窗；EN 用 NEG_PREFIX_EN 命中紧前 12 字符的否定前缀——均只查腿②
// 紧前，避免把腿①的正当否定误当腿②否定。两者均可负例注入（R.STRONG_NEG_ZH
// / R.NEG_PREFIX_EN 传空数组即删）。
const STRONG_NEG_ZH = /(?:不足|并不|并非|绝不|不一定|未必|不必然|不能|无法|没能|难以|无从|尚不|不值|谈不上|不至于|不见得|不会)/;
const NEG_PREFIX_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|n't)\s*$/;

function matchAlive(text, x, opts, R) {
  opts = opts || {};
  if (opts.neg) {
    const negZh = (R && R.STRONG_NEG_ZH !== undefined) ? R.STRONG_NEG_ZH : STRONG_NEG_ZH;
    const negEn = (R && R.NEG_PREFIX_EN !== undefined) ? R.NEG_PREFIX_EN : NEG_PREFIX_EN;
    const negZhList = Array.isArray(negZh) ? negZh : [negZh];
    const negEnList = Array.isArray(negEn) ? negEn : [negEn];
    const beforeZh = text.slice(Math.max(0, x.idx - 6), x.idx);
    const beforeEn = text.slice(Math.max(0, x.idx - 12), x.idx);
    for (const re of negZhList) { if (re && re.test && (re.test(x.raw) || re.test(beforeZh))) return false; }
    for (const re of negEnList) { if (re && re.test && re.test(beforeEn)) return false; }
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

// 签名收集：腿①存量指称为锚，腿②流量兑现须落邻近窗内，方向不限。
// 两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      stock: resolveGroups(R, STOCK_ZH_GROUPS),
      equate: resolveGroups(R, EQUATE_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      stock: resolveGroups(R, STOCK_EN_GROUPS),
      equate: resolveGroups(R, EQUATE_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const stockM = collect(text, L.stock);
    if (stockM.length === 0) continue;
    // 腿②受否定守卫（对冲形：「并不等于一年白干」「does not mean」）
    const equateM = collect(text, L.equate, { neg: true }, R);
    if (equateM.length === 0) continue;
    for (const s of stockM) {
      const e = equateM.find(x => dist(x, s) <= L.win);
      if (!e) continue;
      sigs.push({ lang: L.lang, stock: s.raw, equate: e.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.stock + '|' + s.equate;
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
 * 存量-流量混淆签名：存量指称 × 流量兑现断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectStockFlowConflation(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论存量/流量口径本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（口径不同、不能混为一谈、不等于破产判断）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'stock_flow_conflation',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '存量「' + x.stock + '」被兑现为流量「' + x.equate + '」'
      : 'stock "' + x.stock + '" cashed out as flow "' + x.equate + '"')),
    details: s.lang === 'zh'
      ? '存量-流量混淆(' + sigs.length + '处: 存量「' + s.stock + '」的水平被直接兑现为年度流量/流平结论「' + s.equate + '」，跳过存量是历年累积、流量是年度速度的口径除法)(zh)'
      : 'stock-flow-conflation(' + sigs.length + 'x: the stock level "' + s.stock + '" is cashed out directly as an annual flow / level comparison "' + s.equate + '", skipping that a stock is an accumulated level while a flow is a per-period rate)(en)',
    guidance: '存量-流量混淆（stock-flow conflation / level-rate confusion）：存量是某一时点的累积水平（债务总额、市值、存款余额、外汇储备、账户结余），流量是单位时间的变化速度（年产出、年收入、年度盈亏）——存量-流量比（债务/GDP、储蓄相当于几个月收入）是正当的相对规模度量，谬误在于把存量的水平直接当作流量的速率兑现：「国家债务超过一年GDP，等于全国人民一年白干，国家已经破产」「存款余额突破十万亿，可见这个省每年新增的财富就有十万亿」「这家公司市值比好几个国家的GDP还高，可见它比这些国家还有钱有实力」。这类断言跳过了历年累积与年度速度之间的除法，把任何大数字都讲成破产故事或实力排名。正当做法是先对齐口径再下结论：说明比率含义（「债务与GDP之比衡量相对规模，不等于破产判断」）、区分水平与速度（「存量指标反映累积水平，流量指标反映变化速度，两者不能混为一谈」）、或把存量还原为流量时给出速度依据（「外储是多年累积的存量，单年顺差只是其中一年的流量贡献」）；正当的跨类事实陈述（「这家公司市值超过多国GDP」）、存款余额排名（「我省存款余额突破十万亿，居全国前列」）不在本族射程。',
    tags: ['economics', 'statistical-literacy', 'stock-flow', 'level-rate', 'debt-to-gdp', 'units'],
  };
}

module.exports = {
  detectStockFlowConflation,
  __internals: () => ({
    STOCK_ZH_A, STOCK_ZH_B, STOCK_EN_A, STOCK_EN_B,
    EQUATE_ZS_ZH, EQUATE_RATE_ZH, EQUATE_CMP_ZH,
    EQUATE_ZS_EN, EQUATE_RATE_EN, EQUATE_CMP_EN,
    STOCK_ZH_GROUPS, STOCK_EN_GROUPS,
    EQUATE_ZH_GROUPS, EQUATE_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, NEG_PREFIX_EN,
    findSignatures,
  }),
};
