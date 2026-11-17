/**
 * src/insurance-claim-loss.js — 「未理赔即亏误读」检测器
 * （r378 新建：econ_reasoning_gate 聚合族第 34 子族 / 插件层第 39 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r378 立项探针（scripts/round-378/probe-r378-pool.js 12 候选同池 +
 *   probe-r378-scope.js 6 候选深探，v6.8.190 pristine 基线 HEAD 004195a）：
 *   F insurance_loss 深探穿透 7/10 真零命中（3/10 存量代拦：perfect_error /
 *   reverse_causation / pseudo_profundity——存量维度对未理赔即亏形零覆盖），
 *   良性 6 条仅 1 条非 pass（reasoning_coherence/contradiction 存量误伤，
 *   非本族增量）；同池 E curse_of_knowledge 6/10 良性 0 脏但属教学沟通族
 *   与 econ 组射程不合、G price_as_quality 6/10 良性 1、L trend_extrapolation
 *   6/10 良性 1、B just_world 5/10 良性 2、H says_law 5/10——F 为「最高穿透
 *   × 良性边界可辩护」，定拨落地。海外扫描（两个 topic）：arXiv parse-fail
 *   （返回条目为量子/数学/视觉噪声）/ GitHub repos 0 或 5（均非纯规则可
 *   集成）/ S2 空——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自保险与风险决策的标准论述：
 *   保费购买的是风险转移（risk transfer）——把尾部损失的分布交给风险池，
 *   按大数法则定价；不出险说明风险没有兑现，正是保障发挥作用（确定性）
 *   的状态，而非亏损。谬误在于把保险当作必然回本的投资：没理赔就是钱
 *   白交、保险本质是赌、只有一直理赔才划算——把「用不上的确定性」讲成
 *   「看得见的亏损」，跳过风险转移本身的效用与保险的定价机制。
 *
 * 辨别的族：未理赔即亏误读（no-claim-is-loss misread / risk-transfer value
 *   neglect）——文本同时给出两个信号：
 *   腿① INS 保险语境在场——保险/险种名词（重疾险/车险/医保…）、保费/
 *       保单/投保/续保、以及保险域事件词（出险/理赔，二者本身即保险语
 *       境，「没出险就等于钱打了水漂」无裸保险名词亦判）；
 *       insurance / premiums / policy / coverage。
 *   腿② LOSS 未用即亏断言在场——三种形：
 *       · P1 配对形：无理赔标记（没出险/没生病/没用上/没理赔/一年没事/
 *         从未理赔…；never claimed / no claim）× 浪费标记（白买/白交/
 *         打水漂/亏本/不划算/吃亏…；wasted / waste of money / losing
 *         bet / overpaid）近距共现（≤14 字 / ≤45 字符）；
 *       · P2 主语句形：保费/保单主语 + 白买/白交/打水漂（「保费全白交
 *         了」—— sunk-cost 族射程之外的保费纯亏断言）；
 *       · P3 赌博框架形：保险…就是/等于…赌、庄家通吃、只有理赔才赚/
 *         不出事铁定亏（EN：insurance is a gamble / the house always
 *         wins / only pays off if you claim）。
 *   两腿近距共现（腿②为锚，腿①须落窗内：ZH 40 字 / EN 140 字符），
 *   缺一不判。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 概念讨论（风险转移/大数法则/风险池/精算定价 + 框架词共现）由
 *     CONCEPT 豁免——概念名与框架词共现防前缀绕过（r368 同款教训）；
 *   · 纠正句/评估否定句（「没理赔不等于亏损」「保费买到的是转移尾部
 *     损失的能力」）由 CORRECT 豁免 + 腿②紧前否定窗/对冲短语双守卫承担；
 *   · 「为了让他买保险，我这两年的关心都不是白费的」天然不判——腿②
 *     P1 要求无理赔标记在场、P2 主语限保费/保单，「关心不是白费的」落在
 *     sunk_cost_coercion 射程，本族不接；
 *   · 退保亏损主张（「保费交了两年，退保就亏了」）天然不判——无理赔
 *     标记不在场，属 sunk-cost 决策族；
 *   · 理赔纠纷抱怨（「出险了也没赔到」）天然不判——无理赔标记只收
 *     「事件未发生」形（没出险/没生病/没用上/没理赔），不收「索赔未
 *     获批」形。
 *
 * 与既有维度的边界（r378 归因，探针 + 边界实测）：
 *   · sunk_cost_coercion（dim 98）管已投入 × 放弃可耻——本族管保费 ×
 *     未用即亏，攻击集零交集（sunk-cost 攻击句无「未理赔」标记，本族
 *     攻击句无「已经投入不该放弃」标记）；
 *   · present_bias（r243）管月供/摊薄的时间偏好形（「每天没几块」）——
 *     本族管保险风险的转移价值误读，非贴现形；
 *   · moral_hazard / adverse_selection（r296）管保险机制性断言（兜底
 *     激励/池子构成）——本族管个体「没用到就是亏」的回报叙事；
 *   · winners_curse（r237）管拍卖溢价——本族管保费。
 *
 * 判据（两腿近距共现 + 两组豁免 + 腿②双守卫，缺一不判）：
 *   ① 腿① INS 保险语境在场（ZH 名词组 / 保费保单组 / EN 组）；
 *   ② 腿② LOSS 未用即亏断言在场（ZH 三形 / EN 三形，受紧前否定窗与
 *     对冲短语守卫）；
 *   ③ 两腿须落在邻近窗内（以腿②为锚，ZH 40 字 / EN 140 字符），方向不限；
 *   ④ 豁免 A 概念讨论（风险转移/大数法则/风险池 + 框架词共现）；
 *   ⑤ 豁免 B 纠正句（没理赔不等于亏损/保费买到的是… 类）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一种投资观（「保险的预期
 * 收益是负的」——概念句由 CONCEPT 豁免），命中的是把「未理赔」直接
 * 兑现为「亏损/白交」的断言。verify 的语义是「这段文本把风险转移讲成
 * 了必然回本的投资，先把保险的定价与保障机制对齐再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念讨论（风险转移机制/大数法则定价/精算原理）；
 *   · 纠正句与评估否定句（没理赔不等于亏损/不能算亏/保费买到的是确定性）；
 *   · sunk-cost 决策句（保费交了两年退保亏/保险都买了不用浪费——归 sunk_cost_coercion）；
 *   · 理赔纠纷（出险了没赔到/拒赔）——无「事件未发生」标记；
 *   · 正当风险提示（保险不赔这种情况/免责条款）——无浪费标记。
 */

'use strict';

// ─── 腿① INS 保险语境在场 ─────────────────────────────
// I1 保险/险种名词（含医保社保等泛险种）。
const INS_ZH = /保险|医保|重疾险|车险|医疗险|意外险|寿险|财险|健康险|养老险|交强险|商业险|防癌险|疾病险|意外伤害险|家财险|旅行险/;
// I2 保费/保单/投保行为。
const INS_ZH_B = /保费|保单|投保|续保|缴保|纳保费|买保|入保/;
// I3 保险域事件词——出险/理赔本身即保险语境（「没出险就等于钱打了水漂」
//   无裸保险名词亦判）。索赔未获批形（没赔到/拒赔）不在列——那是理赔
//   纠纷不是未用即亏。
const INS_ZH_C = /出险|理赔|索赔/;

// EN I1/I2/I3 合并：insurance/premium/policy/coverage/insurer/claim。
const INS_EN = /\b(?:insurance|premiums?|polic(?:y|ies)|coverage|insurer|underwrit\w+|claims?)\b/i;

// ─── 腿② LOSS 未用即亏断言在场 ─────────────────────────────
// P1 配对形·无理赔标记（只收「事件未发生」形，不收「索赔未获批」形）。
const NOCLAIM_ZH = /没出险|未出险|不出险|没生病|未生病|不生病|没用上|未用上|用不上|用不到|没理赔|未理赔|不理赔|没报过险|没出过事|没出事|一年没事|年年没事|月月没事|整年没事|从未理赔|没赔过|没派上用场|没中过保|平平安安/;
// P1 配对形·浪费标记（不含裸「亏/白费」——防 sunk-cost 与否定纠正形误入）。
const WASTE_ZH = /白买|白交|白缴|白付|白扔|打水漂|打了水漂|付诸东流|浪费钱|浪费了|亏本|亏大了|不划算|吃亏|赔了|亏了|赔的|亏的|亏得|是赔|等于白/;
// P2 主语句形：保费/保单主语 + 纯亏标记。
const SUBJ_ZH = /(?:保费|保单|投保费|纳保费)[^。！？，；]{0,8}(?:白买|白交|白缴|白付|打了水漂|打水漂|全废|白瞎)/;
// P3 赌博框架形：保险…就是/等于…赌、庄家通吃、只有理赔才赚、不出事铁定亏。
const GAMBLE_ZH = /保险[^。！？，；]{0,8}(?:就是|等于|无异于|不过是|纯粹是|本质上就是)[^。！？，；]{0,6}(?:赌|赌博|赌局|押注|碰运气)|庄家通吃|通吃局|只有[^。！？，；]{0,12}(?:理赔|出险|索赔)[^。！？，；]{0,8}(?:才|就)[^。！？，；]{0,8}(?:赚|划算|值得)|不出事[^。！？，；]{0,6}(?:铁定|肯定|一定|必然)[^。！？，；]{0,4}(?:亏|不划算|白交)/;

// EN P1：无理赔标记 × 浪费标记。
const NOCLAIM_EN = /\b(?:never\s+claimed?|did\s?n[o']?t\s+claim|did\s+not\s+claim|no\s+claims?|never\s+used(?:\s+it)?|didn'?t\s+use(?:\s+it)?|not\s+claiming|never\s+collected|nothing\s+ever\s+happened|never\s+got\s+sick)\b/i;
const WASTE_EN = /\b(?:waste[ds]?|waste\s+of\s+money|pointless|money\s+down\s+the\s+drain|losing\s+bet|overpaid|not\s+worth\s+it|threw\s+it\s+away|thrown\s+away|for\s+nothing)\b/i;
// EN P2：premiums/policy 主语 + 纯亏标记。
const SUBJ_EN = /\b(?:premiums?|policy|policies)\b[^.]{0,40}\b(?:wasted?|down\s+the\s+drain|for\s+nothing|pointless)\b/i;
// EN P3：赌博框架形。
const GAMBLE_EN = /\binsurance\s+is\s+(?:just\s+)?(?:a\s+)?(?:gamble|gambling|bet|scam|con|rip[- ]?off)\b|\bthe\s+house\s+always\s+wins\b|\bonly\s+(?:pays|worth\s+it)\s+if\s+you\s+claim\b|\bunless\s+you\s+(?:collect|claim)\b/i;

const NOCLAIM_WASTE_ZH = 14; // 无理赔标记与浪费标记的近距窗（字）
const NOCLAIM_WASTE_EN = 45; // 无理赔标记与浪费标记的近距窗（字符）

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const PAIR_ZH = 40;
const PAIR_EN = 140;

// ─── 豁免 A：概念讨论（概念名 + 框架词共现，防前缀绕过）──────────
const CONCEPT_ZH = /(?:风险转移|大数法则|大数定律|风险池|期望效用|逆选择|道德风险|精算|保障机制|定价机制)[^。！？\n]{0,20}(?:理论|框架|学说|观点|视角|模型|争论|争议|认为|指出|机制|概念|分析|讨论|说明|介绍|表明|描述|解释|假设|前提|核心|定义|是指|原理)/;
const CONCEPT_EN = /\brisk\s+transfer\b|\blaw\s+of\s+large\s+numbers\b|\bactuarial\b|\brisk\s+pool(?:ing)?\b|\binsurance\s+principle\b|\bpremium\s+pricing\b/i;

// ─── 豁免 B：纠正句（没理赔不等于亏损/保费买到的是… 类）──────────
const CORRECT_ZH = /(?:没理赔|未理赔|不出险|没出险|没用上)[^。！？]{0,12}(?:不等于|并非|不是|不代表|不能算|算不上)[^。！？]{0,8}(?:亏|白交|白买|浪费|亏损|亏本)|保费(?:买到|购买|换来|换来)的是|保障的价值|风险未兑现|不是必然回本|不等于亏/;
const CORRECT_EN = /\bnot\s+claiming\s+(?:is\s+)?not\b|\bno\s+claim\s+(?:is\s+)?(?:not|doesn'?t\s+mean)\b|\bpremiums?\s+(?:buy|purchase|buy\s+you)\b|\brisk\s+transfer\s+itself\b/i;

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

// 腿②双守卫（r375/r377 同款）：紧前否定窗（ZH 6 字 / EN 20 字符，含否定即
//   「不等于亏/并非白交」纠正形）+ 对冲短语（腿②前后 20/40 字内出现
//   「不意味着/误解/高估」类）。只查腿②，防把腿①正当否定误当腿②否定。
// 两者均可负例注入证明承重。
const NEG_ZH = /(?:并不|并非|未|未必|不一|不|没|无|别)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|高估|低估|夸大|歪曲|简单化|一刀切|偏离|误用)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|overestimat\w+|underestimat\w+|does\s+not\s+mean|doesn'?t\s+mean|misread)/i;

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

// P1 配对形守卫（r378 新增）：无理赔标记与浪费标记之间的间隙含否定即
// 「没理赔，也不觉得亏」类对冲；浪费标记后窗内含对冲短语即评估否定句。
// 与 matchAlive 同款支持负例注入（R.NEG_ZH / R.HEDGE_ZH 可被永假正则替换）。
function pairGapNeg(gap, lang, R) {
  const neg = (R && R.NEG_ZH !== undefined) ? R.NEG_ZH : NEG_ZH;
  const list = Array.isArray(neg) ? neg : [neg];
  return list.some(re => re && re.test && re.test(gap));
}
function pairHedge(after, lang, R) {
  const h = (R && R.HEDGE_ZH !== undefined) ? R.HEDGE_ZH : HEDGE_ZH;
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

// 签名收集：腿②未用即亏断言为锚（窗内），腿①保险语境在场。两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      ins: resolveGroups(R, [
        ['INS_ZH', [INS_ZH]],
        ['INS_ZH_B', [INS_ZH_B]],
        ['INS_ZH_C', [INS_ZH_C]],
      ]),
      noclaim: resolveGroups(R, [['NOCLAIM_ZH', [NOCLAIM_ZH]]]),
      waste: resolveGroups(R, [['WASTE_ZH', [WASTE_ZH]]]),
      subj: resolveGroups(R, [['SUBJ_ZH', [SUBJ_ZH]]]),
      gamble: resolveGroups(R, [['GAMBLE_ZH', [GAMBLE_ZH]]]),
      pairWin: R.NOCLAIM_WASTE_ZH != null ? R.NOCLAIM_WASTE_ZH : NOCLAIM_WASTE_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      ins: resolveGroups(R, [['INS_EN', [INS_EN]]]),
      noclaim: resolveGroups(R, [['NOCLAIM_EN', [NOCLAIM_EN]]]),
      waste: resolveGroups(R, [['WASTE_EN', [WASTE_EN]]]),
      subj: resolveGroups(R, [['SUBJ_EN', [SUBJ_EN]]]),
      gamble: resolveGroups(R, [['GAMBLE_EN', [GAMBLE_EN]]]),
      pairWin: R.NOCLAIM_WASTE_EN != null ? R.NOCLAIM_WASTE_EN : NOCLAIM_WASTE_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const insM = collect(text, L.ins);
    if (insM.length === 0) continue;
    // 腿② SUBJ/GAMBLE 形受双守卫（紧前否定窗 + 对冲短语）。P1 配对形单独
    // 处理：无理赔标记自身常含否定字（「没用上/没出险」），其 6 字紧前窗
    // 会把配对误杀（r378 实测「车险一年没用上，这钱等于白扔了」被自身
    // 「没」字守卫拦下）——故配对形只查无理赔标记与浪费标记之间的间隙
    // （含否定即「没理赔，也不觉得亏」类对冲）+ 浪费标记后对冲短语窗。
    const ncM = collect(text, L.noclaim);
    const wM = collect(text, L.waste);
    const subjM = collect(text, L.subj, { neg: true }, R);
    const gmM = collect(text, L.gamble, { neg: true }, R);
    // P1 配对形：无理赔标记 × 浪费标记近距（方向不限），锚点为浪费标记。
    const lossM = [];
    for (const w of wM) {
      // 取与浪费标记距离最近的无理赔标记作配对端（「没生病就用不到，…白交」
      //   ——最近端是用不到而非没生病，间隙才不含自身否定字）。
      let nc = null, ncD = Infinity;
      for (const x of ncM) { const d = dist(x, w); if (d <= L.pairWin && d < ncD) { nc = x; ncD = d; } }
      if (!nc) continue;
      const gap = text.slice(nc.end, w.idx); // 两标记之间的间隙
      if (pairGapNeg(gap, L.lang, R)) continue;
      const after = text.slice(w.end, w.end + (L.lang === 'zh' ? 20 : 40));
      if (pairHedge(after, L.lang, R)) continue;
      lossM.push({ anchor: w, raw: w.raw, noclaim: nc.raw, form: 'pair' });
    }
    for (const s of subjM) lossM.push({ anchor: s, raw: s.raw, noclaim: '', form: 'subj' });
    for (const g of gmM) lossM.push({ anchor: g, raw: g.raw, noclaim: '', form: 'gamble' });
    if (lossM.length === 0) continue;
    for (const l of lossM) {
      const i = insM.find(x => dist(x, l.anchor) <= L.win);
      if (!i) continue;
      sigs.push({ lang: L.lang, ins: i.raw, loss: l.raw, form: l.form, noclaim: l.noclaim });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.ins + '|' + s.loss + '|' + s.form;
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
 * 未理赔即亏误读签名：保险语境 × 未用即亏断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectInsuranceClaimLoss(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（风险转移/大数法则/风险池本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（没理赔不等于亏损 / 保费买到的是确定性）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'insurance_claim_loss',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '保险语境「' + x.ins + '」× 未用即亏断言「' + x.loss + '」'
      : 'insurance context "' + x.ins + '" × no-claim-is-loss assertion "' + x.loss + '"')),
    details: s.lang === 'zh'
      ? '未理赔即亏误读(' + sigs.length + '处: 「' + s.loss + '」把未理赔兑现为亏损/白交，跳过风险转移价值)(zh)'
      : 'no-claim-is-loss(' + sigs.length + 'x: "' + s.loss + '" treats not claiming as a loss, skipping risk-transfer value)(en)',
    guidance: '未理赔即亏误读（no-claim-is-loss misread / risk-transfer value neglect）：保费购买的是风险转移（risk transfer）——把尾部损失的分布交给风险池，按大数法则（law of large numbers）定价；不出险说明风险没有兑现，正是保障发挥作用的状态，而非亏损。谬误在于把保险当作必然回本的投资：「买了重疾险结果一年没生病，保费全白交了，保险就是庄家通吃的赌局」「没出险就等于钱打了水漂」「保险本质上就是赌，不出事铁定亏，只有一直理赔才划得来」「I paid premiums all year and never claimed — that money was a complete waste」「Insurance is a losing bet unless you collect on it」——把「用不上的确定性」讲成「看得见的亏损」，跳过风险转移本身的效用与保险的定价机制。正当做法是先把机制对齐：说明保费买到的是什么（「保费买的是转移尾部损失的能力，不是必然回本的理财」）、区分保障与投资（「保险的收益是风险兜底，没理赔不等于亏损，而是风险未兑现」）、给出定价视角（「个体不出险恰恰是风险池正常运转的标志」）；把保险当投资算回报是范畴错误，退保亏损主张（保费交了两年退保亏）与理赔纠纷（出险了没赔到）不在本族射程。',
    tags: ['economics', 'insurance', 'risk-transfer', 'decision-under-risk', 'expected-value'],
  };
}

module.exports = {
  detectInsuranceClaimLoss,
  __internals: () => ({
    INS_ZH, INS_ZH_B, INS_ZH_C,
    INS_EN,
    NOCLAIM_ZH, WASTE_ZH, SUBJ_ZH, GAMBLE_ZH,
    NOCLAIM_EN, WASTE_EN, SUBJ_EN, GAMBLE_EN,
    NOCLAIM_WASTE_ZH, NOCLAIM_WASTE_EN,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
