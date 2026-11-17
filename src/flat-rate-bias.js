/**
 * src/flat-rate-bias.js — 「固定费率偏误」检测器
 * （r379 新建：econ_reasoning_gate 聚合族第 35 子族 / 插件层第 40 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r379 立项探针（scripts/round-379/probe-r379-pool.js 12 候选同池 +
 *   probe-r379-scope.js 四候选深探，v6.8.190 pristine 基线 HEAD b399cb9）：
 *   E flat_rate_overuse 深探穿透 9/10 真零命中（1/10 被 fallacy_of_relevance
 *   代拦——存量维度对固定费率过度使用形零覆盖），良性 6 条中 2 条非 pass
 *   （hypostatization / contradiction 存量维度误伤，非本族增量）；同池
 *   B chesterton_fence 6/10 良性 0、I mcnamara_quantitative 8/10 良性 2
 *   （liberty_restriction 存量误伤）、K survival_rate_comparison 6/10 良性
 *   0——E 为「最高穿透 × 良性边界可辩护 × econ 组射程最合」，定拨落地。
 *   海外扫描（两个 topic）：arXiv 均 parse-fail（返回量子/数学噪声）/ GitHub
 *   repos 0 / S2 空——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自行为经济学固定费率偏误的
 *   标准论述（flat-rate bias，Nunes & Boatwright 2004, JCR）：预付/定额
 *   收费会激励用户为「摊薄」已付费用而过度使用——即便边际效用已为负
 *   （受伤还去健身房、难看也坐完全场、凌晨爬起来刷场次）。谬误在于把
 *   沉没成本当成继续使用的理由：不多用就是浪费/傻/亏，把已付的固定费用
 *   直接兑换成使用义务，跳过「用不用应看边际收益」的决策规则。
 *
 * 辨别的族：固定费率偏误（flat-rate bias / sunk-fee-driven overuse）——
 * 文本同时给出两个信号：
 *   腿① FLAT 固定费率语境在场——包年/包月/年卡/月卡/会员/套餐/不限量/
 *       无限流量/自助餐/通票/次卡/预付卡/订阅/月费/年费；annual
 *       membership / flat fee / subscription / all-you-can-eat / buffet /
 *       prepaid / unlimited plan。
 *   腿② OVERUSE 过度使用断言在场——三种形：
 *       · O1 配对形：使用不足标记（不多用/不多看/一天不去/不吃到撑/没用
 *         满…；not using it enough / skipping a week / not going）× 浪费
 *         标记（就是浪费/就是傻/白瞎/等于白花/才算不亏…；is a waste /
 *         throwing money away / for nothing / stupid）近距共现；
 *       · O2 强制高频形：就得/也得/至少得 + 天天/每天/每周/刷完/用完/吃完/
 *         坐完/拉满/吃回本（have to use it every day / go even when
 *         injured / finish it）；
 *       · O3 摊薄均价形：摊薄/平均成本/单价/越低越划算/越用越值（lower
 *         the average cost / the more you use the cheaper it gets）。
 *   两腿近距共现（腿②为锚，腿①须落窗内：ZH 40 字 / EN 140 字符），缺一
 *   不判。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 概念讨论（定额偏差/flat-rate bias/沉没成本 + 框架词共现）由 CONCEPT
 *     豁免——概念名与框架词共现防前缀绕过（r368 同款教训）；
 *   · 纠正句（应以边际效用为准/沉没成本不影响/不应为了摊薄）由 CORRECT
 *     豁免 + 腿②紧前否定窗/对冲短语双守卫承担；
 *   · sunk-cost 决策句（「会员费交了两年，现在退出太可惜」）天然不判——
 *     腿②要求过度使用断言在场，退出可惜形无 O1/O2/O3 标记；
 *   · 电影票/门票等单次购买票证不在腿①（属 sunk_cost_coercion 射程），
 *     腿①只收 recurring-fee 形（年卡/包月/会员/不限量/自助餐）。
 *
 * 与既有维度的边界（r379 归因，探针 + 边界实测）：
 *   · sunk_cost_coercion（dim 98）管已投入 × 放弃可耻——本族管固定费率
 *     × 过度使用摊薄，攻击集零交集（sunk-cost 攻击句无「不多用就是浪费」
 *     标记，本族攻击句无「已经投入不该放弃」标记）；
 *   · mental_accounting（r235）管按来源/用途区别对待金钱——本族管预付
 *     费用驱动使用强度，非分账户形；
 *   · present_bias（r243）管月供摊薄的时间偏好形（「每天没几块」）——
 *     本族管使用频率，非贴现形；
 *   · opportunity_cost_neglect（r336）管免费/零价忽视代价——本族管已付
 *     费用的使用义务误读。
 *
 * 判据（两腿近距共现 + 两组豁免 + 腿②守卫，缺一不判）：
 *   ① 腿① FLAT 固定费率语境在场（ZH 名词组 / EN 组）；
 *   ② 腿② OVERUSE 过度使用断言在场（ZH 三形 / EN 三形）；
 *   ③ 两腿须落在邻近窗内（以腿②为锚，ZH 40 字 / EN 140 字符），方向不限；
 *   ④ 豁免 A 概念讨论（定额偏差/flat-rate bias/沉没成本 + 框架词共现）；
 *   ⑤ 豁免 B 纠正句（应以边际效用为准/沉没成本不影响/不应为了摊薄）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一种消费观（「包年摊到每天
 * 很便宜」——概念句由 CONCEPT 豁免），命中的是把已付固定费用直接兑换成
 * 使用义务、并据此合理化负效用使用的断言。verify 的语义是「这段文本把
 * 沉没费用讲成了使用义务，先把摊薄决策的边际规则对齐再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念讨论（定额偏差/flat-rate bias 机制本身）；
 *   · 纠正句与评估否定句（应以边际效用为准/不为摊薄而使用）；
 *   · sunk-cost 决策句（会员费交了两年退出可惜——归 sunk_cost_coercion）；
 *   · 单次票证句（电影票买了看完——腿①不收，归 sunk-cost 射程）。
 */

'use strict';

// ─── 腿① FLAT 固定费率语境在场 ─────────────────────────────
// F1 recurring-fee 名词（只收 recurring 形，不收单次票证——单次票证归
//   sunk_cost_coercion 射程）。
const FLAT_ZH = /包年|包月|包季|年卡|月卡|季卡|半年卡|会员卡|健身卡|会员费|会员|套餐|不限量|无限量|无限流量|自助餐|通票|套票|次卡|预付卡|储值卡|订阅|月费|年费|畅享卡|月票|年票|畅享套餐|不限次|任我享/;
const FLAT_EN = /\b(?:annual|yearly|monthly)\s+(?:membership|pass|fee|plan|card|subscription)\b|\bflat\s+(?:rate|fee)\b|flat[-\s]?rate(?:\s+(?:pricing|plan))?|subscription|all[-\s]?you[-\s]?can[-\s]?eat|buffet|prepaid|unlimited\s+(?:plan|data|access)|gym\s+membership|\bmembership\b|paid\s+(?:for\s+the\s+)?(?:annual|yearly|monthly)\b/i;

// ─── 腿② OVERUSE 过度使用断言在场 ─────────────────────────────
// O1 配对形·使用不足标记（不多X/一天不去/不吃到撑/没用满…）。
const UNDERUSE_ZH = /(?:不多|没怎么|没|未)[^。！？，；]{0,4}(?:用|看|听|吃|喝|玩|去|跑|逛|学)[^。！？，；]{0,6}(?:就是|等于|算是|就叫|纯属)|(?:一天|每次|一回|有一回|时不时)[^。！？，；]{0,4}(?:不去|不用|不看|不吃|不练|不跑)[^。！？，；]{0,8}(?:就是|等于|算是)|(?:不吃|不用)[^。！？，；]{0,4}(?:到饱|到撑|回本|够本)|(?:没用满|没用完|没刷完|没看完|没学完|没跑完)/;
// O1 配对形·浪费标记。
const WASTE_ZH = /(?:就是|等于|算是|纯属|才是|才是真的)[^。！？，；]{0,6}(?:浪费|白瞎|白花|白交|吃亏|亏|傻|蠢|不值|冤)|(?:才算|才叫|才算真的)[^。！？，；]{0,4}(?:不亏|划算|值|赚)|(?:钱|费用|额度)[^。！？，；]{0,4}(?:白瞎|白花|白交|打了水漂|浪费了|等于白)/;
// O2 强制高频形：就得/也得/至少得 + 高频使用。
const MUSTFREQ_ZH = /(?:就得|也该|也应该|就必须|就得必须|也得|都要|至少(?:得|要)|非得|非要)[^。！？，；]{0,12}(?:天天|每天|每晚|每天早上|每周|每次|时时刻刻|一早|凌晨|熬夜|通宵|刷完|用完|吃完|看完|听完|练完|学完|坐完|跑完|逛完|去满|用满|拉满|吃回来|本钱|够本|回本|不落|去[0-9一二两三四五几]+(?:次|回|趟)|开着下载|挂着下载|后台下载|挂机)[^。！？，；]{0,6}/;
// O3 摊薄均价形：摊薄/平均成本/越用越划算。
const DILUTE_ZH = /(?:摊薄|平均成本|均价|单价|单位成本)[^。！？，；]{0,12}(?:越|低|便宜|划算|省|降)|(?:越用|用得越多|越多用)[^。！？，；]{0,4}(?:越|就)[^。！？，；]{0,6}(?:划算|省|值|便宜)/;

// EN 腿②三形。
const UNDERUSE_EN = /\b(?:not\s+(?:using|going|watching|eating|taking)\s+it(?:\s+enough)?|skipping\s+(?:a\s+week|a\s+day|a\s+session)|not\s+going|barely\s+using|hardly\s+using|leaving\s+it\s+unused)\b/i;
const WASTE_EN = /\b(?:is\s+(?:just\s+)?(?:a\s+)?(?:waste|wasteful|stupid|silly|foolish|pointless)|throwing\s+money\s+away|money\s+down\s+the\s+drain|threw\s+it\s+away|thrown\s+away|for\s+nothing|not\s+worth\s+it|get\s+(?:my|your)\s+money'?s\s+worth)\b/i;
const MUSTFREQ_EN = /\b(?:have|has|got|need|needs|must|should)\s+to\s+(?:use|go|watch|eat|take|finish)\s+it\s+(?:every|as\s+much|as\s+often|more)|use\s+it\s+every\s+(?:single\s+)?day|go\s+even\s+when|finish\s+it\s+even\s+if|eat\s+until\s+stuffed|stay\s+until\s+the\s+end\b/i;
const DILUTE_EN = /\b(?:lower|reduce|drive\s+down|cut)\s+(?:the\s+)?average\s+cost\b|\bthe\s+more\s+you\s+use\s+it,?\s+the\s+(?:cheaper|better|more\s+worth)\b|\bspread\s+(?:the\s+)?cost\b/i;

// O1 配对窗：使用不足标记与浪费标记的近距窗（字 / 字符）。
const PAIR_ZH_WIN = 14;
const PAIR_EN_WIN = 45;

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const WINDOW_ZH = 40;
const WINDOW_EN = 140;

// ─── 豁免 A：概念讨论（概念名 + 框架词共现，防前缀绕过）──────────
const CONCEPT_ZH = /(?:定额偏差|固定费率偏误|沉没成本|沉没费用|心理账户|包月心理|摊薄心态)[^。！？\n]{0,20}(?:理论|框架|学说|观点|视角|模型|争论|争议|认为|指出|机制|概念|分析|讨论|说明|介绍|表明|描述|解释|假设|前提|核心|定义|是指|原理|表现|现象|效应|偏误|偏差|谬误)/;
const CONCEPT_EN = /\bflat[-\s]?rate\s+bias\b|\bsunk[-\s]?cost\b|\bmental\s+accounting\b|\bflat[-\s]?rate\s+pricing\b|\bNunes\s+and\s+Boatwright\b|\boveruse\s+(?:of\s+)?(?:prepaid|flat[-\s]?rate)/i;

// ─── 豁免 B：纠正句（应以边际效用为准/沉没成本不影响…）──────────
const CORRECT_ZH = /(?:沉没成本|边际效用|边际收益|摊薄感|定额偏差|固定费率偏误)[^。！？]{0,16}(?:不|别|勿|莫)[^。！？]{0,10}(?:影响|决定|驱动|左右|算|该|该用)|应以[^。！？]{0,8}(?:边际|需求|效用)[^。！？]{0,6}为准|不应(?:该|该)?为了[^。！？]{0,8}(?:摊薄|回本|用满)|用不用(?:应|该)看|惩罚现在的选择|不是(?:继续|过度)使用的理由|过去的支出[^。！？]{0,6}(?:不|别)/;
const CORRECT_EN = /\bsunk\s+(?:fee|cost)\s+(?:should\s+not|shouldn'?t|must\s+not|doesn'?t|does\s+not)\b|\bmarginal\s+(?:utility|benefit)\s+(?:should|matters?|decides?)\b|\buse\s+it\s+only\s+if\b|\bnot\s+a\s+reason\s+to\s+(?:use|keep\s+using)\b/i;

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

// 腿②守卫（r375/r377/r378 同款）：紧前否定窗（ZH 6 字 / EN 20 字符，含否定即
//   「不算浪费/并非不多用就亏」纠正形）+ 对冲短语（腿②前后 20/40 字内出现
//   「不意味着/偏误/理性做法」类）。两者均可负例注入证明承重。
const NEG_ZH = /(?:并不|并非|未|未必|不一|不|没|无|别)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|高估|低估|夸大|歪曲|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|bias|overestimat\w+|underestimat\w+|does\s+not\s+mean|doesn'?t\s+mean|misread|irrational|shouldn'?t)/i;

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

// O1 配对形守卫（r378 同款，r379 补 EN 侧）：使用不足标记与浪费标记之间的
//   间隙含否定即「不多用，也不觉得亏」类对冲；浪费标记后窗内含对冲短语即
//   评估否定句。中英各自取对应守卫组——r378 的 pairHedge 只查 ZH 组（EN 腿②
//   走 matchAlive），本族 EN 配对形同样需要 hedge 覆盖（r379 实测修：
//   "…is a waste — that is the classic misconception" 曾被漏判）。
// 与 matchAlive 同款支持负例注入（R.NEG_ZH / R.NEG_EN / R.HEDGE_ZH / R.HEDGE_EN
//   可被永假正则替换）。
function pairGapNeg(gap, lang, R) {
  const neg = (R && (lang === 'zh' ? R.NEG_ZH : R.NEG_EN) !== undefined)
    ? (lang === 'zh' ? R.NEG_ZH : R.NEG_EN) : (lang === 'zh' ? NEG_ZH : NEG_EN);
  const list = Array.isArray(neg) ? neg : [neg];
  return list.some(re => re && re.test && re.test(gap));
}
function pairHedge(after, lang, R) {
  const h = (R && (lang === 'zh' ? R.HEDGE_ZH : R.HEDGE_EN) !== undefined)
    ? (lang === 'zh' ? R.HEDGE_ZH : R.HEDGE_EN) : (lang === 'zh' ? HEDGE_ZH : HEDGE_EN);
  const list = Array.isArray(h) ? h : [h];
  return list.some(re => re && re.test && re.test(after));
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

// 签名收集：腿②过度使用断言为锚（窗内），腿①固定费率语境在场。两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      flat: resolveGroups(R, [['FLAT_ZH', [FLAT_ZH]]]),
      under: resolveGroups(R, [['UNDERUSE_ZH', [UNDERUSE_ZH]]]),
      waste: resolveGroups(R, [['WASTE_ZH', [WASTE_ZH]]]),
      mustfreq: resolveGroups(R, [['MUSTFREQ_ZH', [MUSTFREQ_ZH]]]),
      dilute: resolveGroups(R, [['DILUTE_ZH', [DILUTE_ZH]]]),
      pairWin: R.PAIR_ZH_WIN != null ? R.PAIR_ZH_WIN : PAIR_ZH_WIN,
      win: R.WINDOW_ZH != null ? R.WINDOW_ZH : WINDOW_ZH, lang: 'zh',
    },
    {
      flat: resolveGroups(R, [['FLAT_EN', [FLAT_EN]]]),
      under: resolveGroups(R, [['UNDERUSE_EN', [UNDERUSE_EN]]]),
      waste: resolveGroups(R, [['WASTE_EN', [WASTE_EN]]]),
      mustfreq: resolveGroups(R, [['MUSTFREQ_EN', [MUSTFREQ_EN]]]),
      dilute: resolveGroups(R, [['DILUTE_EN', [DILUTE_EN]]]),
      pairWin: R.PAIR_EN_WIN != null ? R.PAIR_EN_WIN : PAIR_EN_WIN,
      win: R.WINDOW_EN != null ? R.WINDOW_EN : WINDOW_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const flatM = collect(text, L.flat);
    if (flatM.length === 0) continue;
    const underM = collect(text, L.under);
    const wasteM = collect(text, L.waste);
    const mustM = collect(text, L.mustfreq, { neg: true }, R);
    const dilM = collect(text, L.dilute, { neg: true }, R);
    // O1 配对形：使用不足标记 × 浪费标记近距（方向不限），锚点为浪费标记。
    const overM = [];
    for (const w of wasteM) {
      let u = null, uD = Infinity;
      for (const x of underM) { const d = dist(x, w); if (d <= L.pairWin && d < uD) { u = x; uD = d; } }
      if (!u) continue;
      const gap = text.slice(u.end, w.idx); // 两标记之间的间隙
      if (pairGapNeg(gap, L.lang, R)) continue;
      const after = text.slice(w.end, w.end + (L.lang === 'zh' ? 20 : 40));
      if (pairHedge(after, L.lang, R)) continue;
      overM.push({ anchor: w, raw: w.raw, form: 'pair' });
    }
    for (const m of mustM) overM.push({ anchor: m, raw: m.raw, form: 'mustfreq' });
    for (const d of dilM) overM.push({ anchor: d, raw: d.raw, form: 'dilute' });
    if (overM.length === 0) continue;
    for (const o of overM) {
      const f = flatM.find(x => dist(x, o.anchor) <= L.win);
      if (!f) continue;
      sigs.push({ lang: L.lang, flat: f.raw, over: o.raw, form: o.form });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.flat + '|' + s.over + '|' + s.form;
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
 * 固定费率偏误签名：固定费率语境 × 过度使用断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectFlatRateBias(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（定额偏差/flat-rate bias/沉没成本本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（应以边际效用为准 / 沉没成本不影响使用决策）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'flat_rate_bias',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '固定费率语境「' + x.flat + '」× 过度使用断言「' + x.over + '」'
      : 'flat-rate context "' + x.flat + '" × overuse assertion "' + x.over + '"')),
    details: s.lang === 'zh'
      ? '固定费率偏误(' + sigs.length + '处: 「' + s.over + '」把已付固定费用兑换成使用义务，跳过边际决策规则)(zh)'
      : 'flat-rate bias(' + sigs.length + 'x: "' + s.over + '" turns the sunk flat fee into a usage obligation)(en)',
    guidance: '固定费率偏误（flat-rate bias / sunk-fee-driven overuse）：预付/定额收费会激励用户为「摊薄」已付费用而过度使用——即便边际效用已为负（受伤还去健身房、难看也坐完全场、凌晨爬起来刷场次）。已付的会员费/年卡/包月费是沉没成本，用不用、用多少应看边际收益与当下需求，而不是「不多用就是浪费/傻/亏」：包年摊到每天再便宜，不去的那天也不产生额外节约；自助餐付了钱不吃到撑并不亏——付出去的钱已经与「今晚吃多少」无关。谬误在于把沉没成本当成继续使用的理由，跳过「用不用应看边际效用」的决策规则：「会员包了年，不多看几场就把钱白瞎了，熬夜也得把场次刷完」「办了健身年卡就得天天去，一天不去就是浪费，哪怕练伤了也得去」「既然包年了，不多用就是浪费，凌晨爬起来把场次刷完才叫不亏」「买了无限流量套餐，晚上睡觉也得开着下载，不然额度浪费了」「自助餐钱已经付了，不吃到撑就是傻，硬塞也得把本钱吃回来」「The annual pass is paid for, so skipping a week means throwing money away — go even when injured」「Since the flat fee is paid anyway, using it more can only lower the average cost — so use it as much as possible」。正当做法是先把决策规则对齐：区分沉没成本与边际决策（「已付的会员费是沉没成本，用不用应看边际收益而非摊薄感」）、按需求而非摊薄定使用强度（「吃饱应停止，而不是想着把本钱吃回来」）、给出摊薄心态的定性（「为摊薄包月费用而强迫自己使用，是用过去的支出惩罚现在的选择」）；sunk-cost 决策句（会员费交了两年退出可惜）与单次票证句（电影票买了看完）不在本族射程。',
    tags: ['economics', 'behavioral-economics', 'flat-rate-bias', 'sunk-cost', 'overconsumption'],
  };
}

module.exports = {
  detectFlatRateBias,
  __internals: () => ({
    FLAT_ZH, FLAT_EN,
    UNDERUSE_ZH, WASTE_ZH, MUSTFREQ_ZH, DILUTE_ZH,
    UNDERUSE_EN, WASTE_EN, MUSTFREQ_EN, DILUTE_EN,
    PAIR_ZH_WIN, PAIR_EN_WIN,
    WINDOW_ZH, WINDOW_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
