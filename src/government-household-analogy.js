/**
 * src/government-household-analogy.js — 「政府-家庭收支类比」检测器
 * （r375 新建：econ_reasoning_gate 聚合族第 31 子族 / 插件层第 36 族）
 *
 * 背景（真升级类型②：已有聚合族的全新措辞家族）：
 *   r375 立项探针（scripts/round-375/probe-r375-pool.js 首轮 12 候选 +
 *   probe-r375-scope.js 二段深探，v6.8.190 pristine 基线，HEAD 5481b78）：
 *   A 变化率回落≠水平下降 0/6、E 百分比涨跌对称 0/3、G 均衡=最优 0/3、J 规模
 *   经济绝对化 0/3、K 主权货币无限支出 0/3——全部被存量 absolute_claim/
 *   confidence/perfect_error 代拦，出局；B 半衰期 2/3、D 赌徒破产 6/10、
 *   F 加权平均 4/10、I 选择过载 5/10、**C 政府-家庭收支类比 8/10**、H GDP
 *   重复计算 8/10、L 保险期望值 8/10 同池竞争——**C 为「高穿透 × 良性边界
 *   干净（存量维度零增量）× 与既有 30 子族射程不相邻」**，定拨落地。
 *   海外扫描（hf4-scout.sh，behavioral economics reasoning errors topic）：
 *   arXiv parse-fail / GitHub repos 0 / S2 ?——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自经济学/财政素养的标准论述：
 *   主权政府与家庭/企业的收支约束在机制上不同——政府拥有税收权、发债权
 *   （主权货币政府还有货币发行权）与跨越代际的存续期，债务可以滚动续借，
 *   不存在家庭意义上的「花超了就破产」；谬误在于把私人预算约束平移到主权
 *   财政上，由此推出「欠债必须连本带利还清/否则破产/赤字必须清零」的清偿
 *   结论，并在财政辩论中用来否定举债支出本身。
 *
 * 辨别的族：政府-家庭/私人收支类比（government-household budget analogy /
 *   sovereign solvency conflation）——文本同时给出三个信号：
 *   腿① SOV 主权主体在场——国家/政府/国债/财政/国库/央行/主权/纳税人；
 *       government / state / nation / country / treasury / federal debt；
 *   腿② ANALOGY 私人收支框架 × 等价提示共现——「跟家庭账本是一个道理」
 *       「就像居家过日子一样」「和普通人借钱一样」「好比个人透支信用卡」
 *       「政府和企业一样」（框架词 14 字内命中等价提示，双向均收）；
 *       works just like a household budget / no different from a family /
 *       is like a family maxing out its credit cards；
 *   腿③ PAYOFF 清偿/破产结论在场——破产/崩盘/倒闭/连本带利/全额偿还/
 *       还清/赤字清零/拆东墙补西墙/迟早是要还的；bankrupt / insolvency /
 *       pay off the debt / paid off in full；
 *   三腿近距共现，缺一不判。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 腿②要求**等价提示**（是一个道理/一样/就像/好比/无异于）与框架词共现——
 *     单纯的「政府与家庭债务存在差异」「主权政府可以滚动发债」等纠正/概念
 *     陈述天然不含等价提示，不判；
 *   · 腿③只收清偿/破产结论形，不收「财政应可持续」等正当规范讨论——「政府
 *     长期过度举债有风险」「赤字合理性取决于债务结构」是良性财政分析；
 *   · 概念教学（类比谬误/窠臼讨论）与纠正句（不等于家庭账本/不能混为一谈）
 *     由 CONCEPT/CORRECT 两组豁免排除；腿③否定守卫排除「并不意味着会破产」
 *     的对冲形。
 *
 * 与既有维度的边界（r375 归因，探针 + 边界实测）：
 *   · false_equivalence（dim 级）管泛化不当等同——本族要求主权主体 × 私人
 *     收支框架 × 清偿结论三腿共现，探针 8/10 攻击穿透证明存量维度零覆盖；
 *   · tax_incidence（r373）管税负法定归宿与经济归宿之分——本族管主权与
 *     私人预算约束的机制混淆，射程不相邻；
 *   · price_control / mercantilism 管价格管制/贸易差额——均不含类比三腿形；
 *   · fallacy_of_relevance / false_urgency 在攻击变体 2/10 上代拦（ aggressive
 *     措辞），其余 8/10 真零命中。
 *
 * 判据（三腿近距共现 + 两组豁免 + 腿③否定守卫，缺一不判）：
 *   ① 腿① SOV 主权主体在场；
 *   ② 腿② ANALOGY 私人收支框架 × 等价提示共现（框架词 14 字 / 90 字符内
 *      命中等价提示，方向不限）；
 *   ③ 腿③ PAYOFF 清偿/破产结论在场（受否定守卫：「并不意味着会破产」
 *      「does not mean it will go bankrupt」是对冲形）；
 *   ④ 腿①与腿②邻近（ZH 60 字 / EN 200 字符），腿②与腿③邻近（ZH 50 字 /
 *      EN 160 字符），方向不限；
 *   ⑤ 豁免 A 概念教学（类比/谬误/窠臼/误区/混淆/误用 与框架词共现）；
 *   ⑥ 豁免 B 纠正句（不等于家庭账本/不能混为一谈/不同于家庭）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一种流行说法（「有人认为政府
 * 跟家庭一样」——腿③缺省天然排除）。verify 的语义是「这段文本把家庭/企业
 * 的预算约束平移到主权财政并推出清偿结论，先把机制差异（税收权/发债滚动/
 * 存续期）对齐再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 私人域陈述（家庭预算要量入为出——腿①缺省）；
 *   · 正当财政分析（过度举兹有风险、赤字取决于债务结构——腿②缺省）；
 *   · 纠正句（政府预算不等于家庭账本、主权政府可滚动发债——腿②或豁免）；
 *   · 概念教学（把国家财政比作家庭预算是常见的类比谬误——豁免 A）；
 *   · 对冲形（跟家庭一样，但并不意味着会破产——腿③否定守卫）；
 *   · 无条件结论的软形式（「国家更应该节俭持家」无等价提示+无清偿结论）。
 */

'use strict';

// ─── 腿① SOV 主权主体在场 ─────────────────────────────
const SOV_ZH = /(?:国家|政府|国债|财政|国库|央行|公共债务|主权|纳税人|全国人)/;
const SOV_EN = /\b(?:government|governments|state|nation|country|national|federal|sovereign|treasury|taxpayer|public\s+debt)\b/i;

const SOV_ZH_GROUPS = [['SOV_ZH', [SOV_ZH]]];
const SOV_EN_GROUPS = [['SOV_EN', [SOV_EN]]];

// ─── 腿② ANALOGY 私人收支框架 × 等价提示共现 ────────────
// 框架词：家庭/居家过日子/普通人/个人/信用卡/房贷/企业/公司/私人 等。
const FRAME_WORDS_ZH = '(?:家庭|居家|过日子|普通人|个人|信用卡|房贷|存折|零花钱|私房钱|企业|公司|私人)';
// 等价提示（向后共现——「家庭账本是一个道理」「一个道理」「普通人借钱一样」）。
const CUE_AFTER_ZH = '(?:是一个道理|一个道理|一回事|一个样|没区别|一样)';
// 等价提示（向前共现——「就像居家过日子一样」「好比个人透支信用卡」）。
const CUE_BEFORE_ZH = '(?:是一个道理|一回事|一个样|没区别|同理|如同|就像|好比|无异于|等同于|俨然|活像)';
// 双向合并：框架词与等价提示须落在 14 字邻窗内，方向不限。
const ANALOGY_ZH = new RegExp(
  FRAME_WORDS_ZH + '[^。！？；\\n]{0,14}' + CUE_AFTER_ZH
  + '|' + CUE_BEFORE_ZH + '[^。！？；\\n]{0,14}' + FRAME_WORDS_ZH
);

const FRAME_WORDS_EN = '(?:household|households|family|families|private\\s+(?:firm|company|business))';
const ANALOGY_EN = new RegExp(
  '\\b(?:just|exactly|precisely)\\s+(?:like|as)\\s+(?:a\\s+|an\\s+)?' + FRAME_WORDS_EN
  + '|\\b(?:works?|is|are|behaves?|operates?|runs?)\\s+(?:just\\s+)?like\\s+(?:a\\s+|an\\s+)?' + FRAME_WORDS_EN
  + '|\\b(?:as\\s+if|as\\s+though)\\s+(?:it\\s+were|they\\s+were|it\\s+was)\\s+(?:a\\s+)?(?:household|family)\\b'
  + '|\\bno\\s+different\\s+from\\s+(?:a\\s+)?(?:household|family)\\b'
  + '|\\bsame\\s+(?:way\\s+)?as\\s+(?:a\\s+|any\\s+|no\\s+)?(?:household|family)\\b'
  + '|\\bjust\\s+as\\s+(?:no\\s+|any\\s+)?(?:household|family)\\b',
  'i'
);

const ANALOGY_ZH_GROUPS = [['ANALOGY_ZH', [ANALOGY_ZH]]];
const ANALOGY_EN_GROUPS = [['ANALOGY_EN', [ANALOGY_EN]]];

// ─── 腿③ PAYOFF 清偿/破产结论在场 ─────────────────────
const PAYOFF_ZH = /(?:破产|崩盘|倒闭|连本带利|全额偿还|资不抵债|财政破产|拆东墙补西墙|赤字清零|清零|败家|入不敷出|还清|要还的|清偿)/;
const PAYOFF_EN = /\b(?:bankrupt\w*|insolven\w+|default\w*|collapse[sd]?|pays?\s+(?:off|back)|paid\s+(?:off|back)|paying\s+(?:off|back)|repay\w*|clear\w*\s+(?:the\s+)?deficit|zero\w*\s+(?:the\s+)?deficit|balance[sd]?\s+(?:the\s+|its\s+)?budget)\b/i;

const PAYOFF_ZH_GROUPS = [['PAYOFF_ZH', [PAYOFF_ZH]]];
const PAYOFF_EN_GROUPS = [['PAYOFF_EN', [PAYOFF_EN]]];

// ─── 邻近窗 ───────────────────────────────────────────
const PAIR_SOV_ZH = 60;   // 腿① × 腿②
const PAIR_SOV_EN = 200;
const PAIR_PAY_ZH = 50;   // 腿② × 腿③
const PAIR_PAY_EN = 160;

// ─── 豁免 A：概念教学（类比/谬误/窠臼 与框架词共现）────
// 双向收：谬误词在前（「类比谬误：家庭」）或框架词在前（「家庭预算是常见的
// 类比谬误」——EN 概念句常把 household 放句首、fallacy 放谓语位，单向表漏判，
// r375 实测 D1b「works just like a household budget is a classic fallacy」）。
const CONCEPT_ZH = /(?:类比|谬误|窠臼|误区|混淆|误用|误解|简单类推)[^。！？\n]{0,20}(?:家庭|居家|过日子|普通人|个人|企业|公司|信用卡|房贷|国家财政|政府预算|主权|国库)|(?:家庭|居家|过日子|普通人|个人|企业|公司|信用卡|房贷)[^。！？\n]{0,20}(?:类比|谬误|窠臼|误区|混淆|误用|简单类推)/;
const CONCEPT_EN = /\b(?:fallacy|error|mistake|misleading|flawed|wrong|myth|confus\w+)\b[^.]{0,30}\b(?:household|family|families|households|private|analogy)\b|\b(?:household|households|family|families|analogy)\b[^.]{0,30}\b(?:fallacy|error|mistake|misleading|flawed|wrong|myth|confus\w+)\b|\b(?:household|family)\s+analogy\b|\banalogy\b[^.]{0,30}\b(?:household|family|private|sovereign|government)\b|\bconflat\w+\b[^.]{0,30}\b(?:household|family|sovereign|government)\b/i;

// ─── 豁免 B：纠正句（不等于家庭账本/不能混为一谈）──────
const CORRECT_ZH = /(?:不能|不应|不可|并非|不等于|算不上|谈不上|区别于|不同于)(?:混为一谈|等同|混淆|直接比较|相提并论|同日而语|简单类比|类推|一概而论)|(?:政府|国家|财政|主权|国债)[^。！？\n]{0,16}(?:不等于|并非|不同于|区别于|不是|绝非)[^。！？\n]{0,12}(?:家庭|居家|过日子|个人|企业|公司|信用卡)|(?:家庭|居家|过日子|个人|企业|公司|信用卡)[^。！？\n]{0,16}(?:不同于|区别于|不等于|并非)(?:政府|国家|财政|主权)/;
const CORRECT_EN = /\b(?:not|isn'?t|aren'?t|cannot|can'?t|shouldn'?t|mustn'?t)\s+(?:a\s+|just\s+a\s+|like\s+a\s+)?(?:household|family|private\s+(?:firm|company|business))\b|\bunlike\s+(?:a\s+)?(?:household|family)\b|\b(?:differs?|distinct)\s+from\s+(?:a\s+)?(?:household|family)\b|\b(?:not|never)\s+(?:be\s+)?(?:conflat\w+|equated|compared|analogized)\b/i;

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

// 腿③否定守卫：清偿结论被否定/对冲时（「这并非破产」「does not mean it will
// go bankrupt」是对冲形，不是攻击）。两道守卫只查腿③紧前，避免把腿①/腿②的
// 正当否定误当腿③否定：① 紧前否定（ZH 6 字 / EN 12 字符——只收贴身的
// 「这并非破产」「并非破产逻辑」型；宽窗会把攻击惯语「债务不能赖/不能
// 违约」误当否定，r375 实测「资不抵债」前 12 字含「不能赖」即误杀，收窄到
// 6 字）；② 对冲短语（ZH 20 字 / EN 40 字符内命中「不/并非/未必 + 意味着/
// 代表/说明」或「does not mean / imply」型——否定与结论之间隔有从句时紧前
// 窗收不到，如「并不意味着债台高筑就会破产」）。两者均可负例注入
// （NEG_ZH / NEG_EN / HEDGE_ZH / HEDGE_EN 传空数组即删）。
const NEG_ZH = /(?:不足|并不|并非|绝不|不一定|未必|不必然|不能|无法|没能|难以|无从|尚不|不值|谈不上|不至于|不见得|不会)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wouldn'?t|won'?t)\s*$/;
// 对冲短语守卫：否定 + 认识动词（意味着/说明/代表）+ 结论——「并不意味着
// 债台高筑就会破产」「does not mean it will go bankrupt」。
const HEDGE_ZH = /(?:并不|并非|未必|不一|没有|没|不)[^。！？\n]{0,3}(?:意味着|代表|说明|表示|证明)/;
const HEDGE_EN = /\b(?:does\s+not|doesn'?t|do\s+not|don'?t|is\s+not|isn'?t|not)\s+(?:mean|imply|suggest|indicate|entail)\b|\b(?:no|little)\s+(?:reason|evidence|basis)\s+to\s+(?:believe|expect|conclude)\b/i;

function matchAlive(text, x, opts, R) {
  opts = opts || {};
  if (opts.neg) {
    const negZh = (R && R.NEG_ZH !== undefined) ? R.NEG_ZH : NEG_ZH;
    const negEn = (R && R.NEG_EN !== undefined) ? R.NEG_EN : NEG_EN;
    const negZhList = Array.isArray(negZh) ? negZh : [negZh];
    const negEnList = Array.isArray(negEn) ? negEn : [negEn];
    const beforeZh = text.slice(Math.max(0, x.idx - 6), x.idx);
    const beforeEn = text.slice(Math.max(0, x.idx - 12), x.idx);
    for (const re of negZhList) { if (re && re.test && (re.test(x.raw) || re.test(beforeZh))) return false; }
    for (const re of negEnList) { if (re && re.test && re.test(beforeEn)) return false; }
  }
  if (opts.hedge) {
    const hZh = (R && R.HEDGE_ZH !== undefined) ? R.HEDGE_ZH : HEDGE_ZH;
    const hEn = (R && R.HEDGE_EN !== undefined) ? R.HEDGE_EN : HEDGE_EN;
    const hZhList = Array.isArray(hZh) ? hZh : [hZh];
    const hEnList = Array.isArray(hEn) ? hEn : [hEn];
    const hedgeZh = text.slice(Math.max(0, x.idx - 20), x.idx);
    const hedgeEn = text.slice(Math.max(0, x.idx - 40), x.idx);
    for (const re of hZhList) { if (re && re.test && re.test(hedgeZh)) return false; }
    for (const re of hEnList) { if (re && re.test && re.test(hedgeEn)) return false; }
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

// 签名收集：腿①主权主体 × 腿②类比 × 腿③清偿结论，三腿近距共现，缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      sov: resolveGroups(R, SOV_ZH_GROUPS),
      analogy: resolveGroups(R, ANALOGY_ZH_GROUPS),
      payoff: resolveGroups(R, PAYOFF_ZH_GROUPS),
      wSov: R.PAIR_SOV_ZH != null ? R.PAIR_SOV_ZH : PAIR_SOV_ZH,
      wPay: R.PAIR_PAY_ZH != null ? R.PAIR_PAY_ZH : PAIR_PAY_ZH,
      lang: 'zh',
    },
    {
      sov: resolveGroups(R, SOV_EN_GROUPS),
      analogy: resolveGroups(R, ANALOGY_EN_GROUPS),
      payoff: resolveGroups(R, PAYOFF_EN_GROUPS),
      wSov: R.PAIR_SOV_EN != null ? R.PAIR_SOV_EN : PAIR_SOV_EN,
      wPay: R.PAIR_PAY_EN != null ? R.PAIR_PAY_EN : PAIR_PAY_EN,
      lang: 'en',
    },
  ];
  for (const L of langs) {
    const sovM = collect(text, L.sov);
    if (sovM.length === 0) continue;
    const analogyM = collect(text, L.analogy);
    if (analogyM.length === 0) continue;
    // 腿③受否定 + 对冲双守卫（对冲形：「并不意味着会破产」「does not mean」）
    const payoffM = collect(text, L.payoff, { neg: true, hedge: true }, R);
    if (payoffM.length === 0) continue;
    for (const s of sovM) {
      const a = analogyM.find(x => dist(x, s) <= L.wSov);
      if (!a) continue;
      const p = payoffM.find(x => dist(x, a) <= L.wPay);
      if (!p) continue;
      sigs.push({ lang: L.lang, sov: s.raw, analogy: a.raw, payoff: p.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.sov + '|' + s.analogy + '|' + s.payoff;
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
 * 政府-家庭收支类比签名：主权主体 × 私人收支框架 × 清偿/破产结论 三腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectGovernmentHouseholdAnalogy(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论类比本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（不等于家庭账本、不能混为一谈）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'government_household_analogy',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '主权「' + x.sov + '」被比作私人收支「' + x.analogy + '」并推出清偿结论「' + x.payoff + '」'
      : 'sovereign "' + x.sov + '" is equated with a private budget "' + x.analogy + '" and an insolvency conclusion "' + x.payoff + '"')),
    details: s.lang === 'zh'
      ? '政府-家庭收支类比(' + sigs.length + '处: 主权「' + s.sov + '」被比作「' + s.analogy + '」并推出「' + s.payoff + '」，把家庭/企业的预算约束平移到主权财政)(zh)'
      : 'government-household-analogy(' + sigs.length + 'x: the sovereign "' + s.sov + '" is equated with a private budget "' + s.analogy + '" and driven to the insolvency conclusion "' + s.payoff + '", transferring the household budget constraint to public finance)(en)',
    guidance: '政府-家庭收支类比（government-household budget analogy / sovereign solvency conflation）：主权政府与家庭、企业的收支约束在机制上不同——政府拥有税收权、发债权（主权货币政府还有货币发行权）与跨越代际的存续期，债务可以滚动续借，不存在家庭意义上「花超了就破产」的硬约束。谬误在于把私人预算约束平移到主权财政，由此推出「国家财政跟家庭账本是一个道理，欠的债必须连本带利还清，否则就是破产」「政府借钱和普通人借钱一样，花超了就是破产，所以财政赤字必须立刻清零」「政府和企业一样，赚不到钱就会破产倒闭」这类清偿结论，并在财政辩论中用来否定举债支出本身。正当做法是先把机制差异对齐再讨论财政：区分主权与私人预算（「政府预算不等于家庭账本，主权政府可以滚动发债」）、指出类比的混淆（「把国家财政比作家庭预算是常见的类比谬误」）、或就事论事分析债务可持续性（「过度举债会推高利息负担，赤字合理性取决于债务结构与增长前景」）。私人域的正当陈述（「家庭预算要量入为出，个人借贷过度会导致债务危机」）、无清偿结论的类比提及（「有人认为政府跟家庭一样」）、对冲形（「跟家庭一样，但并不意味着会破产」）不在本族射程。',
    tags: ['economics', 'fiscal', 'sovereign-debt', 'analogy', 'budget-constraint', 'public-finance'],
  };
}

module.exports = {
  detectGovernmentHouseholdAnalogy,
  __internals: () => ({
    SOV_ZH, SOV_EN, ANALOGY_ZH, ANALOGY_EN, PAYOFF_ZH, PAYOFF_EN,
    SOV_ZH_GROUPS, SOV_EN_GROUPS,
    ANALOGY_ZH_GROUPS, ANALOGY_EN_GROUPS,
    PAYOFF_ZH_GROUPS, PAYOFF_EN_GROUPS,
    PAIR_SOV_ZH, PAIR_SOV_EN, PAIR_PAY_ZH, PAIR_PAY_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
