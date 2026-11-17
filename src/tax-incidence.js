/**
 * src/tax-incidence.js — 「税负转嫁谬误」检测器
 * （r373 新建：econ_reasoning_gate 聚合族第 28 子族 / 插件层第 33 族）
 *
 * 背景（真升级类型①新判别维度）：
 *   r373 立项实证（scripts/round-373/probe-r373-baseline.js，同池候选定拨）：
 *   存量维度对「法定纳税人 = 实际负税人」族攻击穿透 8/10（含 gate.action=pass），
 *   良性 7/7 全 pass——真零命中 + 边界全净，落地。落地后同池复测：
 *   攻击穿透 1/10（其余 2 条被存量 fallacy_of_relevance 代拦、可接受），
 *   良性 10 条中 8 条 pass、2 条非 pass 均系存量维度 perfect_error/empty_answer
 *   误伤（非本族增量，探针报告如实记录）。
 *
 * 家族定义（公共经济学标准论述）：tax incidence fallacy / legal-vs-economic
 * incidence conflation（税负转嫁谬误）——税收的「法定归宿」（statutory/
 * legal incidence，法律规定的纳税人）与「经济归宿」（economic incidence，
 * 实际承担福利损失的人）在供需弹性不为无穷时通常不一致：对卖方征税会
 * 通过涨价部分转嫁给买方、对雇主缴纳的社保费会通过压低工资部分转嫁给
 * 员工、对房东征收的房产税会通过租金部分转嫁给租客。攻击形把「向X征税
 * → 法定纳税人承担」直接兑现为「不会转嫁 / 价格不会变 / 别人完全不受
 * 影响 / 全部由法定纳税人消化」——这就是把法定归宿误当经济归宿。
 *
 * 辨别的族：税负转嫁谬误（tax incidence fallacy）——文本同时给出：
 *   腿① TAX 税种/税工具在场——房产税、关税、增值税、企业所得税、社保费、
 *     property tax、tariff、corporate tax；
 *   腿② STATUTORY 法定缴纳归属在场——由企业承担/缴纳、税由进口商缴纳、
 *     paid by the company、imposed on employers；
 *   腿③ NOTRANSFER 免转嫁断言在场——不会转嫁、价格不会变/上涨、不受影响、
 *     无法转嫁、租金不变；will not rise/shift/change、unaffected。
 *   三腿近距共现，缺一不判。
 *
 * 腿②不收「税」字裸出现（「税负重」是陈述不是归属断言），腿③不收
 * 「可能不会转嫁」的对冲形（CORRECT 豁免兜住）——但收「不会转嫁」的
 * 裸断言：这里的「不会」是攻击惯语的组成部分（r369 NOHARM 同款设计），
 * 强否定守卫因此只守腿②（「并非由企业承担」是纠正形）。
 *
 * 与既有维度的边界（r373 归因，探针 + 边界实测）：
 *   · price_control（r305）管价格管制（限价/价格上限）——本族管税种×法定
 *     归属×免转嫁三腿形，不限价；
 *   · mercantilism 管贸易差额顺差主义——本族不含「顺差即财富」论断形；
 *   · 存量 econ 子族均不覆盖税负归属形，探针攻击 8/10 存量零命中实证。
 *
 * 判据（三腿近距共现 + 两组豁免 + 否定守卫，缺一不判）：
 *   ① 腿① TAX 税种/税工具在场（不受否定守卫——「未征税」是陈述性
 *      排除，由三腿共现天然约束）；
 *   ② 腿② STATUTORY 法定缴纳归属在场（受否定守卫：强否定表 + 前置裸
 *      否定字——「并非由企业承担」是纠正形）；
 *   ③ 腿③ NOTRANSFER 免转嫁断言在场（不受否定守卫——「不会转嫁」的
 *      「不会」是攻击惯语组成部分，r369 NOHARM 同款设计；对冲形
 *      「可能不会转嫁」由 CORRECT 豁免兜）；
 *   ④ 三腿须落在邻近窗内（以腿①为锚，ZH 60 字 / EN 160 字符）；
 *   ⑤ 豁免 A 概念教学（税负转嫁谬误/法定归宿/经济归宿 被点名 + 定义/
 *      描述框架词共现，防前缀绕过）；
 *   ⑥ 豁免 B 正确限定（取决于/弹性/未必/不等于/不能直接归功/相关不等于
 *      /不能据此/取决于供需 + EN depends/elasticit/not necessarily/
 *      does not determine/correlation）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项税制（「房产税法律规定
 * 由房东缴纳，税率为 1.2%」——腿③缺省天然排除）。verify 的语义是
 * 「这段话把法定纳税人直接当成了实际负税人，先补齐税负归宿分析
 * （供需弹性决定转嫁程度）再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 无归属断言的结果陈述（税负重——腿②缺省）；
 *   · 概念教学句（税负转嫁谬误是指把法定纳税人当成实际负税人——豁免 A）；
 *   · 正确限定句（税负归宿取决于供需弹性，法定纳税人不等同于实际负税人
 *     ——豁免 B）；
 *   · 制度描述句（房产税法律规定由房东缴纳，税率为 1.2%——腿③缺省）；
 *   · 纠正句（对房东征收房产税，房东可能通过涨房租转嫁给租客——腿③
 *     对冲形，豁免 B）。
 */

'use strict';

// ─── 腿① TAX 税种/税工具在场 ──────────────────────────────
// 只收具体税种与税收工具，不收「税」字裸出现。
const TAX_ZH = /(?:房产税|房地产税|物业税|关税|进口关税|出口关税|增值税|营业税|企业所得税|个人所得税|公司税|资本利得税|遗产税|赠与税|消费税|奢侈品税|碳税|环境税|资源税|土地增值税|契税|印花税|车船税|社保费|社会保险费|公积金|缴费|缴税|纳税|征税|课税|收税|税收|税负|税制|税率)[^。！？；，]{0,12}(?:由|向|对|给|让|被|税|费|负担|承担|缴纳|缴纳方|归属|归宿)|(?:向|对|给)(?:房东|企业|公司|雇主|员工|卖方|买方|商家|进口商|出口商|消费者|生产者|个人|单位|厂商|经销商|平台|租客|劳动者|用人单位)(?:征收|征税|收税|收取)/;
// 形 B：税种名词直接在场（「向进口商征收关税」——动词+税种，动词在腿②
//   前文）。收税种名词本身即可，不要求后接归属词（归属由腿②管）。
const TAX_ZH_B = /(?:房产税|房地产税|物业税|关税|增值税|营业税|企业所得税|个人所得税|公司税|资本利得税|遗产税|赠与税|消费税|碳税|资源税|土地增值税|契税|印花税|车船税|社保费|社会保险费)/;

// EN：税种名词族 + 征收动词族。
const TAX_EN_A = /\b(?:property tax(?:es)?|real estate tax(?:es)?|tariffs?|import dut(?:y|ies)|export dut(?:y|ies)|value[- ]added tax|VAT|sales tax(?:es)?|corporate (?:income )?tax(?:es)?|income tax(?:es)?|capital gains tax(?:es)?|payroll tax(?:es)?|social security (?:tax|contribution)s?|employer (?:contribution|tax)s?|excise tax(?:es)?|carbon tax(?:es)?|inheritance tax|estate tax|consumption tax|land value tax)\b/i;
const TAX_EN_B = /\b(?:tax(?:es)?|levy|levies|levied|impose[ds]?|taxed|duty|duties|charge[ds]?|assess(?:ed|ment)?)\b/i;

const TAX_ZH_GROUPS = [['TAX_ZH_A', [TAX_ZH]], ['TAX_ZH_B', [TAX_ZH_B]]];
const TAX_EN_GROUPS = [['TAX_EN_A', [TAX_EN_A]], ['TAX_EN_B', [TAX_EN_B]]];

// ─── 腿② STATUTORY 法定缴纳归属在场 ─────────────────────────
// 「由X承担/缴纳」「税由X缴纳」「X承担税负」——把税负归属锁定到法定
// 纳税人。不收裸「税」字（腿①已管），不收「X应该缴税」的规范句（无
// 归宿断言形）。
const STATUTORY_ZH = /(?:向|对|给)(?:企业|公司|房东|雇主|员工|卖方|买方|商家|进口商|出口商|消费者|生产者|个人|单位|厂商|经销商|平台|租客|劳动者|用人单位)(?:征收|征税|收税|收取)|(?:向|对)(?:外国|境外|海外)?(?:出口商|进口商|厂商|供应商|生产商)(?:征(?:收|的|税)?|收(?:的|取)?)|买单的(?:是|只是|只能是|只会是|仅仅是|全(?:部|都)是|其实都是)(?:公司股东|企业|公司|房东|雇主|卖方|商家|进口商|厂商|平台|国家|纳税人)|(?:由|归|属)[^。！？；，]{0,10}(?:企业|公司|雇主|进口商|出口商|卖方|买方|房东|租客|员工|工人|消费者|生产者|商家|厂商|股东|业主|当地政府|政府|国家|税务|缴纳方|纳税人|负税人)(?:承担|缴纳|负担|消化|负责|买单|支付)?|(?:企业|公司|雇主|进口商|出口商|卖方|房东|员工|消费者|股东|纳税人)[^。！？；，]{0,8}(?:承担|缴纳|负担|消化|负责|买单|支付)|税[^。！？；，]{0,6}由|全部由|全部落在|都落在|税负(?:全部|都)?(?:由|在|落)|(?:税负|税收|税款|负担|责任)[^。！？；，]{0,6}(?:落在|压在|集中于|归于|属于)|缴纳(?:的)?(?:义务|责任|主体)/;
const STATUTORY_EN = /\b(?:borne|paid|levied|imposed|assessed|charged|remitted)\s+(?:by|on|upon)\b|\b(?:employers?|employees?|sellers?|buyers?|importers?|exporters?|landlords?|tenants?|companies|corporations?|shareholders?|consumers?|producers?)\s+(?:bears?|pays?|pays|remits?|carries?|absorbs?|must\s+pay|has\s+to\s+pay)\b|\bthe\s+tax\s+is\s+(?:paid|borne|levied|imposed|assessed)\b|\b(?:bears?|pays?|carries?|absorbs?)\s+the\s+(?:entire|full|whole|total)\b/i;

const STATUTORY_ZH_GROUPS = [['STATUTORY_ZH', [STATUTORY_ZH]]];
const STATUTORY_EN_GROUPS = [['STATUTORY_EN', [STATUTORY_EN]]];

// ─── 腿③ NOTRANSFER 免转嫁断言在场 ─────────────────────────
// 攻击形核心：把法定归属兑现为「不会转嫁 / 价格不会变 / 别人不受影响」。
// 不收「可能不会转嫁」（CORRECT 豁免兜）。
const NOTRANSFER_ZH = /不会(?:转嫁|转移|传导|推高|上涨|变化|提高|增加|波及)|无法(?:转嫁|转移|传导|推高|上涨)|不能(?:转嫁|转移|传导|推高|上涨)|不必(?:转嫁|转移|上涨)|维持不变|保持不变|租金?不变|价格不变|原价不变|完全不受影响|不受影响|毫无影响|没有影响|不会(?:因此)?(?:上涨|提高|增加|下降|变化|变)|价格不会|成本不会|工资不会|租金不会|买单的是|内部消化|自行消化|自己承担|全部承担|全部(?:由|落在|压在)|都(?:由|落在)|(?:消费者|员工|职工|租客|租户|买方|买家|工人|劳动者|用人单位|下游|工资|薪水|薪酬|收入|到手)(?:和企业|和员工|和消费者|和租客|和买方|和工人|和劳动者)?(?:也|都|完全|丝毫不)?(?:完全)?(?:不会|不受|并不受|丝毫不受|难以)(?:受影响|影响|牵连|波及|变化)|价格(?:因此)?(?:不会|不会因此)?(?:上涨|变化|变动|提高|变)|工资(?:不会|因此不会|不会因此)?(?:下降|变化|降低|变)|租金(?:不会|因此不会|不会因此)?(?:涨|上涨|变化)|物价(?:不会|因此不会|不会因此)?(?:上涨|变化)/;
const NOTRANSFER_EN = /\b(?:will not|won't|would not|wouldn't|does not|doesn't|do not|don't|cannot|can't)\s+(?:rise|increase|change|shift|be passed|be shifted|be transferred|be passed on|go up|be affected)|not\s+(?:rise|increase|shift|change|be affected|be passed)|unaffected|no\s+(?:effect|impact|change|increase)|price\s+(?:will not|won't)\s+(?:change|rise|increase)|absorb(?:s|ed)?\s+the\s+(?:entire|full|whole|total)|borne\s+entirely|borne\s+fully|entirely\s+by/i;

const NOTRANSFER_ZH_GROUPS = [['NOTRANSFER_ZH', [NOTRANSFER_ZH]]];
const NOTRANSFER_EN_GROUPS = [['NOTRANSFER_EN', [NOTRANSFER_EN]]];

// ─── 距离窗（税种 × 法定归属 × 免转嫁断言）──────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：概念教学（点名税负转嫁谬误/归宿概念 + 框架词）────
// 概念名单独出现不豁免（「法定归宿不等于经济归宿」本身正是本族要防的
// 论断被点名）——必须与框架词共现，防前缀绕过（r368/r369/r371 同款教训）。
const CONCEPT_ZH = /(?:税负(?:转嫁)?(?:谬误|错误|陷阱|误区)|税负归宿|法定归宿|经济归宿|税收归宿)[^。，；]{0,30}(?:是指|指|是一种|属于|定义为|称作|称为|理论|概念|认为|指出|说明|揭示|反映|意味着|表明|描述|解释|教科书|文献|论文|学科|经济学|财政学|公共经济学|分析框架|常见(?:的)?(?:分析)?(?:错误|陷阱|误区)|就是把)|(?:是指|指|是一种|属于|定义为|称作|称为|理论|概念|认为|指出|说明|揭示|反映|意味着|表明|描述|解释|教科书|文献|论文|学科|经济学|财政学|公共经济学|分析框架)[^。，；]{0,30}(?:税负(?:转嫁)?(?:谬误|错误|陷阱|误区)|税负归宿|法定归宿|经济归宿|税收归宿)/;
const CONCEPT_EN = /\btax incidence\b[^.]{0,100}?\b(?:is|are|was|were|refers?|means?|describes?|shows?|illustrates?|concept|notion|fallacy|problem|issue|textbook|literature|paper|study|example|instance|pitfall|caveat|distinction|principle)\b|\blegal (?:vs\.?|versus|and) economic incidence\b[^.]{0,80}?\b(?:is|are|refers?|means?|describes?|illustrates?|distinction|principle|concept)\b|\b(?:is|are|refers?|means?|called|known as|describes?|illustrates?)\b[^.]{0,80}?\b(?:tax incidence|statutory incidence|economic incidence)\b/i;

// ─── 豁免 B：正确限定/弹性讨论 ─────────────────────────────
// 收：弹性/归宿分析词（取决于/弹性/供需/转嫁程度/归宿分析）、对冲
// （可能/未必/不一定）、否认等同（不等于/不能说明/不能直接归功/
// 不能据此/相关不等于）、替代归因（这与……有关）。不收裸情态词。
const CORRECT_ZH = /取决于|视(?:供需|弹性|市场)而定|弹性|供给弹性|需求弹性|供需(?:弹性|状况|情况|关系)?(?:决定|而定)|转嫁(?:的)?(?:程度|比例|幅度)|归宿(?:分析|取决于|要看)|未必|不一定|不等于|不能说明|无法说明|并不能|并不成立|不足以|混杂|相关(?:性)?不等于|不能据此|无法据此|不能直接归功|不应归因|别归因|勿归因|不能证明|需要进一步验证|有待|存疑|这[^。]{0,16}(?:有关|相关)|不能简单归因|部分转嫁|可能(?:会)?(?:转嫁|上涨|提高)|难以(?:转嫁|简单)|要看|取决于弹性|弹性决定|教科书|公共经济学|财政学(?:分析|原理)|税负(?:归宿)?(?:理论|原理)|(?:法定|经济)归宿(?:不|并)?(?:同|等|一样)|受(?:供需|弹性)影响|弹性(?:大|小)(?:时|的情况下)/;
const CORRECT_EN = /\b(?:depends?|depend(?:s|ed|ing)?\s+on|depends\s+upon|elasticit\w+|relative elasticity|not necessarily|does not|do not|cannot|can't|couldn't|does not determine|determined by|correlat\w+|no evidence|not proof|cannot be attributed|should not be attributed|unclear|remains unclear|tentative|partial(?:ly)?|may|might|could|possibly|perhaps|textbook|public economics|principle of tax incidence|statutory\s+(?:vs\.?|versus)\s+economic|legal\s+incidence\s+(?:does|do)\s+not)\b/i;

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

// 强否定表：命中文本内或紧前出现，说明断言被否定/对冲。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|不能|无法|并非|没能|难以|不大|无从)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not|did\s+not|has\s+not|have\s+not|cannot|can'?t|couldn'?t|no\s+longer\s+means?)\b|\b(?:not|never|no)\s+(?:borne|paid|levied|imposed|assessed|charged|remitted)\b/i;

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 4), idx);
  return /[不没无未非]/.test(before);
}

function matchAlive(text, x, opts) {
  opts = opts || {};
  if (opts.neg) {
    // 腿②归属断言的否定守卫：「并非由企业承担」是纠正形。
    if (STRONG_NEG_ZH.test(x.raw) || STRONG_NEG_EN.test(x.raw)) return false;
    if (negBeforeZh(text, x.idx)) return false;
    const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
    if (STRONG_NEG_EN.test(beforeEn)) return false;
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

function collect(text, list, opts) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, opts)) m.push(x);
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

// 签名收集：腿①税种 × 腿②法定归属 × 腿③免转嫁断言，以腿①为锚，
// 三腿邻近共现，方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      tax: resolveGroups(R, TAX_ZH_GROUPS),
      statutory: resolveGroups(R, STATUTORY_ZH_GROUPS),
      notransfer: resolveGroups(R, NOTRANSFER_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      tax: resolveGroups(R, TAX_EN_GROUPS),
      statutory: resolveGroups(R, STATUTORY_EN_GROUPS),
      notransfer: resolveGroups(R, NOTRANSFER_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    // 腿①不受否定守卫（「未征税」是陈述性排除，三腿共现天然约束）
    const taxM = collect(text, L.tax, {});
    if (taxM.length === 0) continue;
    // 腿②受否定守卫（纠正形：「并非由企业承担」）
    const statM = collect(text, L.statutory, { neg: true });
    if (statM.length === 0) continue;
    // 腿③不受否定守卫（「不会转嫁」的「不会」是攻击惯语组成部分）
    const noM = collect(text, L.notransfer, {});
    if (noM.length === 0) continue;
    for (const t of taxM) {
      const s = statM.find(x => dist(x, t) <= L.win);
      if (!s) continue;
      const n = noM.find(x => dist(x, t) <= L.win);
      if (!n) continue;
      sigs.push({ lang: L.lang, tax: t.raw, statutory: s.raw, notransfer: n.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.tax + '|' + s.statutory + '|' + s.notransfer;
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
 * 税负转嫁谬误签名：税种/税工具 × 法定缴纳归属 × 免转嫁断言 三腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectTaxIncidence(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论税负转嫁谬误/归宿概念本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确限定/弹性讨论（取决于/弹性/未必/不等于/相关不等于）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'tax_incidence',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '税种「' + x.tax + '」× 法定归属「' + x.statutory + '」× 免转嫁断言「' + x.notransfer + '」'
      : 'tax "' + x.tax + '" x statutory incidence "' + x.statutory + '" x no-transfer claim "' + x.notransfer + '"')),
    details: s.lang === 'zh'
      ? '税负转嫁谬误(' + sigs.length + '处: 「' + s.tax + '」的法定纳税人「' + s.statutory + '」被免转嫁断言「' + s.notransfer + '」直接兑现为实际负税人，供需弹性决定的转嫁未讨论)(zh)'
      : 'tax-incidence-fallacy(' + sigs.length + 'x: the statutory taxpayer "' + s.statutory + '" of "' + s.tax + '" is cashed out by the no-transfer claim "' + s.notransfer + '" as the actual bearer, without addressing supply-demand-elasticity-driven shifting)(en)',
    guidance: '税负转嫁谬误（tax incidence fallacy / legal-vs-economic incidence conflation）：税收的法定归宿（法律规定的纳税人）与经济归宿（实际承担福利损失的人）在供需弹性不为无穷时通常不一致——对卖方征税会通过涨价部分转嫁给买方、雇主缴纳的社保费会通过压低工资部分转嫁给员工、对房东征收的房产税会通过租金部分转嫁给租客。把「向X征税 → 法定纳税人承担」直接兑现为「不会转嫁/价格不会变/别人完全不受影响/全部由法定纳税人消化」（「对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨」「法律规定社保费由雇主缴纳，所以用工成本全部由企业消化，员工工资不会下降」）即犯此谬误。正当做法是显式讨论转嫁与弹性（「税负归宿取决于供需弹性，法定纳税人不等同于实际负税人」「对房东征收房产税，房东可能通过涨房租把税负转嫁给租客」「The legal incidence of a tax does not determine its economic incidence; it depends on elasticities」）；无归宿断言的结果陈述（「税负重」）、制度描述句（「房产税法律规定由房东缴纳，税率为 1.2%」）、点名税负转嫁谬误/法定归宿/经济归宿概念的教学句都是正当做法。',
    tags: ['economics', 'tax-incidence', 'public-economics', 'statutory-incidence', 'economic-incidence', 'tax-shifting'],
  };
}

module.exports = {
  detectTaxIncidence,
  __internals: () => ({
    TAX_ZH, TAX_ZH_B, TAX_EN_A, TAX_EN_B,
    STATUTORY_ZH, STATUTORY_EN,
    NOTRANSFER_ZH, NOTRANSFER_EN,
    TAX_ZH_GROUPS, TAX_EN_GROUPS,
    STATUTORY_ZH_GROUPS, STATUTORY_EN_GROUPS,
    NOTRANSFER_ZH_GROUPS, NOTRANSFER_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
