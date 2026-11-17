/**
 * src/effect-measure-misread.js — 「效应量口径误读」检测器
 * （r386 新建：econ_reasoning_gate 聚合族第 38 子族 / 插件层第 43 族，stats 组）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r386 立项探针（scripts/round-386/probe-candidates2.js，v6.8.192 pristine 基线
 *   HEAD 3768f30）：两段定拨——首段（probe-candidates.js）统计/因果候选族 8 个
 *   （p 值后验误读/置信区间误读/前置时间偏倚/时长偏倚/Will Rogers/赔率-概率/
 *   灵敏度-特异度）穿透 1/32，全部被存量维度（perfect_error /
 *   conditional_transposition / immortal_time_bias / unfalsifiable_assertion /
 *   relative_pration / researcher_degrees_of_freedom）代拦，存量覆盖充分；
 *   二段（probe-candidates2.js）换轴到「效应量口径」后，OR≈RR 误读族与
 *   HR≈累积生存误读族合计 **5/10 真零命中**（gate=pass、无任何维度承重）：
 *     · OR=1.5 就代表风险只上升五成，这个因素不值得担心。
 *     · An OR of 4 means the probability of disease is four times higher.
 *     · 风险比降到 0.5，等于患者活过五年的概率翻倍。
 *     · A hazard ratio of 0.7 means five-year survival improved by 30 percentage points.
 *     · HR = 0.5 means the probability of surviving five years is doubled.
 *   同族其余 5 条被 false_precision / perfect_error / fallacy_of_relevance 代拦
 *   （存量维度对「OR 为 3.2，风险是 3.2 倍」形部分覆盖，但零归因、零 guidance）。
 *   候选池定拨：OR-as-RR 与 HR-as-cumulative 为最高穿透且良性边界最净的
 *   连贯家族（同属「效应量口径误读」一个机制：把一种效应量口径直接当成另一种
 *   口径读数），合并为一个子族落地。同池 pctpoint_pct 3/3 被代拦、
 *   adhoc_rescue 3/5 穿透但与 unfalsifiable_assertion 射程交叠、ev_vs_mode
 *   1/3、indep_add 1/3、multi_nocorrect 1/2、surv_new_wording 1/4——均低于
 *   本族。
 *   海外扫描（hf4-scout.sh topic=statistical causal reasoning / p-value
 *   misinterpretation / lead-time bias，2026-11-17 三次）：GitHub repos
 *   total_count=0、Semantic Scholar 连续 429 限流、arXiv OR 展开返回全为
 *   不相关物理论文——**空返，按既有形态自建**（同 r232/r367 记录）。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自流行病学/统计学标准表述：
 *   效应量口径（measure of effect）有多种——OR（比值比，比而非率）、RR
 *   （风险比，率之比）、HR（风险比/瞬时患病率之比）、RD（风险差）、累积
 *   生存概率（time-to-event 的边际量）。**不同口径之间不能直接换算读数**：
 *   OR 只在结局罕见时才近似 RR，结局常见时 OR 离 RR 更远（OR 总在 RR 远离
 *   1 的更外侧）；HR 是任一时点的瞬时风险之比，不是五年生存概率之差、更
 *   不是累积生存率的倍数。把 OR 当风险倍数、把 HR 当生存概率读，是医学
 *   期刊读者调查（如 Gigerenzer 等）中最高频的统计误读之一。
 *
 * 辨别的族：效应量口径误读（effect-measure misinterpretation）——文本同时
 *   给出两个信号：
 *   腿① MEASURE 效应量口径锚在场——OR / odds ratio / 比值比 / 优势比 /
 *         几率比（OR 锚），或 HR / hazard ratio / 风险比 / 危害比（HR 锚）；
 *   腿② WRONGSCALE 错误口径结论在场——
 *         a) OR→风险/概率倍数断言（「风险是普通人的 N 倍」「概率是对照组的
 *            N 倍」「风险只上升五成」；EN N times the risk / is N times
 *            higher）；
 *         b) HR→累积生存/绝对差断言（「五年生存率从 40% 提高到 70%」「活过
 *            五年的概率翻倍」「生存率提高 N 个百分点」；EN survival improved
 *            by N percentage points / probability of surviving is doubled）。
 *   两腿近距共现（以腿②为锚，腿①须落窗内：ZH 45 字 / EN 150 字符），且
 *   两腿之间须见推断标记（所以/说明/意味着/等于/就代表/证明/可见；EN so /
 *   therefore / means / which means / shows / indicates）——结论是由效应量
 *   **推出来的**，而不是把两个实测发现并列陈述（「试验达到终点：HR=0.72，
 *   五年生存率 60% 对 45%」是两个并列事实，无推断连接，不判）。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 正确的相对风险陈述（HR=0.7 说明死亡风险下降 30% / RR=2 说明风险翻倍）
 *     腿②缺失——错误口径断言族不收相对风险措辞，天然不判；
 *   · 罕见病近似陈述（结局罕见时 OR 近似 RR / when the outcome is rare,
 *     the OR approximates the RR）由 CORRECT 豁免；
 *   · 概念教学（OR 不等于风险比 / OR 高估风险 / the odds ratio overstates
 *     the risk / HR 不是累积生存 / a hazard ratio is not the cumulative
 *     risk）由 CONCEPT 豁免（防「OR 其实不等于风险」前缀绕过，r368/r379
 *     同款教训）；
 *   · 与 relative_risk_individual_transfer（群体相对风险 → 个体绝对风险
 *     平移）射程不重叠：本族判**口径类型混淆**（OR/RR、HR/累积生存），
 *     不论个体平移；与 significance_effect_size（显著性→重要性）、
 *     dose_response_linearity（剂量-反应线性化）、count_rate_conflation
 *     （计数缺分母）、percentage_overflow（百分比溢出）轴不同。
 *
 * 判据（两腿近距共现 + 推断标记 + 两组豁免 + 腿②守卫，缺一不判）：
 *   ① 腿① MEASURE 口径锚在场（OR 锚 ZH/EN + HR 锚 ZH/EN）；
 *   ② 腿② WRONGSCALE 错误口径结论在场（OR→倍数 ZH/EN + HR→累积 ZH/EN）；
 *   ③ 两腿之间须见推断标记（限定性前缀后的连接词不算）；
 *   ④ 两腿须落在邻近窗内（以腿②为锚，ZH 45 字 / EN 150 字符），方向不限；
 *   ⑤ 豁免 A 概念讨论（口径区别本身的教学/批评句）；
 *   ⑥ 豁免 B 正确口径句（罕见结局近似 OR≈RR / HR 反映瞬时相对风险）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项研究结果（HR=0.72，P=0.003
 * ——并列事实无推断标记，天然不判），命中的是把 OR/HR 直接换算成另一种口径
 * 读数的断言。verify 的语义是「这段文本在两种效应量口径之间直接换算，先把
 * 口径定义与近似条件对齐再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 相对风险正确陈述（HR=0.7 死亡风险下降 30% / RR=2 风险翻倍）——腿②缺失；
 *   · 并列实测发现无推断标记（HR=0.72；五年生存率 60% 对 45%）；
 *   · 罕见结局近似陈述（结局罕见时 OR≈RR）——CORRECT 豁免；
 *   · 概念教学与批评句（OR 不等于风险比 / OR 高估了风险）——CONCEPT 豁免；
 *   · significance_effect_size / dose_response_linearity /
 *     count_rate_conflation / percentage_overflow 领地。
 */

'use strict';

// ─── 腿① MEASURE 效应量口径锚 ─────────────────────────────
// OR 锚（中文）：OR=1.5 / OR 为 3.2 / OR 达到 4 / OR 约为 2（须带数字，
//   防裸 "OR" 误触）；中文术语 比值比/优势比/几率比/比数比。
//   注意 i flag + 拉丁字母左边界：gate 路径文本经 text-normalizer 英文大小写
//   归一（normalize() 第 6 步 lowercase，v6.7.73），大写 OR/HR 锚必须大小写
//   不敏感才能命中；(?<![A-Za-z]) 防 "for=1.5" 类子串误触。
const MEASURE_ZH_OR = [
  /(?<![A-Za-z])OR\s*(?:=|＝|为|是|达到|高达|超过|约|约为|近于)\s*(?:\d+(?:\.\d+)?|[一二两三四五六七八九十百]+)/i,
  /(?:比值比|优势比|几率比|比数比|对比率)/,
];
// HR 锚（中文）：风险比/危害比 术语；HR=0.7 / HR 为 0.8 / HR 降到 0.5（须带数字）。
const MEASURE_ZH_HR = [
  /(?:风险比|危害比|瞬时风险比)/,
  /(?<![A-Za-z])HR\s*(?:=|＝|为|是|达到|高达|降到|降至|约)\s*(?:0?\.\d+|\d+(?:\.\d+)?)/i,
];

// OR 锚（英文）：odds ratio 术语；OR of 4 / OR = 1.5 / OR was 3.2（i flag +
//   拉丁字母左边界，同上——gate 路径已 lowercase，"or of 4" 形才可达）。
const MEASURE_EN_OR = [
  /\bodds\s+ratios?\b/i,
  /(?<![A-Za-z])OR\s*(?:=|of|was|is|at)\s*(?:a\s+)?\d+(?:\.\d+)?\b/i,
];
// HR 锚（英文）：hazard ratio 术语；HR = 0.5 / HR of 0.7（同上）。
const MEASURE_EN_HR = [
  /\bhazard\s+ratios?\b/i,
  /(?<![A-Za-z])HR\s*(?:=|of|was|is)\s*(?:a\s+)?\d+(?:\.\d+)?\b/i,
];

// ─── 腿② WRONGSCALE 错误口径结论 ──────────────────────────
// a) OR→风险/概率倍数（中文）两形：
//   a1 …(风险|概率|几率|发病可能|患病可能)(只|仅)?(上升|提高|增加|增长)…N 成
//   a2 …(风险|概率|几率|发病可能|患病可能)(是|为|相当于|达到|高达)…(的)?N 倍
const VERDICT_ZH_ORRISK = [
  /(?:风险|概率|几率|发病可能|患病可能|得病可能)(?:只|仅|仅仅)?(?:上升|提高|增加|增长|高)(?:了)?\s*(?:百分之)?[0-9０-９一二两三四五六七八九十百]+\s*(?:倍|成)/,
  /(?:风险|概率|几率|发病可能|患病可能|得病可能)(?:只|仅)?(?:是|为|相当于|达到|高达|等于)[^。！？，；]{0,14}(?:的)?[0-9０-９一二两三四五六七八九十百]+\s*倍/,
];
// b) HR→累积生存/绝对差（中文）三形：
//   b1 (生存率|存活率)…从 X (提高|上升|提升|增长|增加到|升至)…（从-到形）
//   b2 (活过|存活|生存)(的)?概率…(翻倍|加倍|提高一倍|提升一倍)
//   b3 (生存|死亡)率…(提高|提升|上升|增加|减少|降低)…N 个百分点
//   b2 (活过|存活|生存)…概率…(翻倍|加倍|提高一倍|提升一倍)（「活过五年的
//      概率翻倍」——活过与概率之间可带时段修饰，容 6 字间隙）
const VERDICT_ZH_HRCUM = [
  /(?:生存率|存活率|无进展生存率)[^。！？，；]{0,14}从[^。！？，；]{0,10}(?:提高|上升|提升|增长|增加到?|升至|升到)/,
  /(?:活过|存活|生存)[^。！？，；]{0,6}概率[^。！？，；]{0,8}(?:翻倍|加倍|提高一倍|提升一倍|翻一番)/,
  /(?:生存|死亡|缓解)率[^。！？，；]{0,12}(?:提高|提升|上升|增加|减少|降低|下降)(?:了)?\s*\d+(?:\.\d+)?\s*个百分点/,
];

// a) OR→风险/概率倍数（英文）三形：
//   a1 N times the risk / N times the probability（N times 前置形）
//   a2 (risk|probability|chance) is N times higher / greater
//   a3 N times more likely
const VERDICT_EN_ORRISK = [
  /\b\d+(?:\.\d+)?\s+times\s+(?:the\s+)?(?:risk|probability|chance|odds)\b/i,
  /\b(?:risk|probability|chance)(?:\s+of\s+\w+)?\s+(?:is|are)\s+(?:\w+\s+){0,2}times\s+(?:higher|greater|larger)\b/i,
  /\b\d+(?:\.\d+)?\s+times\s+more\s+likely\b/i,
];
// b) HR→累积生存/绝对差（英文）三形：
//   b1 survival improved/increased by N percentage points
//   b2 probability of surviving … is doubled / doubled
//   b3 survival rose/increased from X% to Y%
const VERDICT_EN_HRCUM = [
  /\b(?:survival|surviving)\b[^.]{0,40}\b(?:improved|increased|rose|higher|better)\s+by\s+\d+(?:\.\d+)?\s+percentage\s+points?\b/i,
  /\bprobability\s+of\s+surviving\b[^.]{0,30}\b(?:is\s+)?doubled\b|\b(?:survival|surviving)\b[^.]{0,20}\bprobability\b[^.]{0,20}\bdoubled\b/i,
  /\b(?:survival|surviving)\s+(?:rose|increased|improved|went|climbed)\s+from\s+\d+(?:\.\d+)?%\s+to\s+\d+(?:\.\d+)?%/i,
];

// ─── 推断标记（结论由效应量推出，而非并列陈述）─────────────────
// 同 significance-effect-size 范式：限定性前缀（只/仅/仅仅；EN only/merely/
// just/simply）后面的连接词不算推断标记——「OR 只说明比值，不等于概率」是
// 正当表述。
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|当然|显然|肯定|一定|反映出|体现出|足见|充分说明|充分证明|足以表明|足以证明|结论就是|就是说|毋庸置疑|毫无疑问|分明|就代表|代表着|据此可以|就可以|可以说|等于|相当于)/;
// 注意 means/meaning 取裸形（不收 means that 限定形）——「An OR of 4 means
// the probability…」式推断连接不带 that；限定性前缀（only/merely/just）后面
// 的连接词由 inferAlive 剔除（「only means」不构成推断）。
const INFER_EN = /\b(?:so|therefore|thus|hence|means|meaning|which\s+means|which\s+proves|that\s+means|proves|shows\s+that|indicates\s+that|means\s+that|it\s+follows|this\s+shows|this\s+proves|clearly|obviously)\b/i;

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const WINDOW_ZH = 45;
const WINDOW_EN = 150;

// ─── 豁免 A：概念讨论（口径区别本身的教学/批评句，防前缀绕过）──
const CONCEPT_ZH = /(?:OR|比值比|优势比|几率比|比数比)[^。！？，；\n]{0,22}(?:不等于|并非|不代表|不能|不可|不宜|不应|区别|区分|混淆|误读|误用|夸大|高估|夸大风险|远离|偏离)|(?:风险比|危害比|HR)[^。！？，；\n]{0,22}(?:不等于|并非|不代表|不能|不可|不宜|不应|区别|区分|混淆|误读|误用|瞬时|累积|边际)/;
const CONCEPT_EN = /\b(?:odds\s+ratios?|OR|hazard\s+ratios?|HR)\b[^.]{0,90}\b(?:does\s+not|doesn'?t|do\s+not|don'?t|is\s+not|are\s+not|cannot|can'?t|not\s+the\s+same|distinct\s+from|overstates?|overestimate|exaggerates?|misread|misinterpret\w*|confus\w+)\b/i;

// ─── 豁免 B：正确口径句（罕见结局近似 OR≈RR；HR 反映瞬时相对风险）──
const CORRECT_ZH = /(?:罕见|少见|低发病|发病率低|患病率低|人群占比低|事件罕见|结局罕见|少数)[^。！？，；\n]{0,26}(?:OR|比值比|优势比|几率比)[^。！？，；\n]{0,16}(?:近似|接近|约等于|可近似|才近似)|(?:OR|比值比|优势比|几率比)[^。！？，；\n]{0,26}(?:近似|接近|约等于)[^。！？，；\n]{0,16}(?:风险比|相对危险度|相对风险)/;
const CORRECT_EN = /\b(?:rare|uncommon|low\s+(?:incidence|prevalence|frequency))\b[^.]{0,70}\bodds\s+ratios?\b[^.]{0,50}\b(?:approximat\w+|close\s+to|near\w*)\b|\bodds\s+ratios?\b[^.]{0,70}\b(?:approximat\w+|close\s+to)\b[^.]{0,50}\b(?:risk\s+ratio|relative\s+risk)\b/i;

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

// 腿②守卫（r375/r377/r378/r379/r381/r385 同款）：紧前否定窗（ZH 6 字 /
//   EN 20 字符，含否定即「并非三倍/不等于翻倍」纠正形）+ 对冲短语（腿②
//   前后出现「不意味着/误解/混淆」类）。两者均可负例注入证明承重。
const NEG_ZH = /(?:并不|并非|未必|不一|不|没|无)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|混淆|误区|误读|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应|忽略了|跳过|绝非|并不是)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|confus\w+|bias|does\s+not\s+mean|doesn'?t\s+mean|misread|misinterpret\w*|irrational|shouldn'?t|ignores?|overlooks?|not\s+the\s+same)/i;

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
    for (const re of negZhList) { if (re && re.test && re.test(beforeZh)) return false; }
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

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入常量；
// 默认值本身是 RegExp 或数组。统一成数组供消费（r385 同款）。
function _normInject(x, def) {
  if (Array.isArray(x)) return x;
  if (x instanceof RegExp) return [x];
  if (Array.isArray(def)) return def;
  return [def];
}
function exempt(list, text) {
  for (const re of list) { if (re && re.test && re.test(text)) return true; }
  return false;
}

// 限定性前缀（腿①侧）：「只说明/仅表示」后面的连接词不是推断。
const RESTRICTIVE_BEFORE = /(?:只|仅|仅仅|只不|不过|充其量|仅只|顶多)[^。！？，；\n]{0,3}$/;
const RESTRICTIVE_BEFORE_EN = /\b(?:only|merely|just|simply|at\s+most)\s+(\w+\s){0,3}$/i;
function inferAlive(text, x, R) {
  const rb = (R && R.RESTRICTIVE_BEFORE !== undefined) ? R.RESTRICTIVE_BEFORE : RESTRICTIVE_BEFORE;
  const rbe = (R && R.RESTRICTIVE_BEFORE_EN !== undefined) ? R.RESTRICTIVE_BEFORE_EN : RESTRICTIVE_BEFORE_EN;
  if (rb.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (rb.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !rbe.test(beforeEn);
}

// 签名收集：腿②错误口径结论为锚（窗内），腿①口径锚在场，两腿之间须见
// 推断标记（腿①在前或腿②在前均可）。两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      measure: [
        ..._normInject(R.MEASURE_ZH_OR, MEASURE_ZH_OR),
        ..._normInject(R.MEASURE_ZH_HR, MEASURE_ZH_HR),
      ],
      wrong: [
        ..._normInject(R.VERDICT_ZH_ORRISK, VERDICT_ZH_ORRISK),
        ..._normInject(R.VERDICT_ZH_HRCUM, VERDICT_ZH_HRCUM),
      ],
      infer: R.INFER_ZH != null ? R.INFER_ZH : INFER_ZH,
      win: R.WINDOW_ZH != null ? R.WINDOW_ZH : WINDOW_ZH, lang: 'zh',
    },
    {
      measure: [
        ..._normInject(R.MEASURE_EN_OR, MEASURE_EN_OR),
        ..._normInject(R.MEASURE_EN_HR, MEASURE_EN_HR),
      ],
      wrong: [
        ..._normInject(R.VERDICT_EN_ORRISK, VERDICT_EN_ORRISK),
        ..._normInject(R.VERDICT_EN_HRCUM, VERDICT_EN_HRCUM),
      ],
      infer: R.INFER_EN != null ? R.INFER_EN : INFER_EN,
      win: R.WINDOW_EN != null ? R.WINDOW_EN : WINDOW_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const measureM = collect(text, L.measure);
    if (measureM.length === 0) continue;
    const wrongM = collect(text, L.wrong, { neg: true }, R);
    if (wrongM.length === 0) continue;
    const inferM = allMatches(L.infer, text).filter(x => inferAlive(text, x, R));
    if (inferM.length === 0) continue;
    for (const w of wrongM) {
      const m = measureM.find(x => dist(x, w) <= L.win);
      if (!m) continue;
      // 推断标记须严格落在两腿之间（方向不限）
      const between = inferM.find(x => (x.idx >= m.end && x.end <= w.idx) || (x.idx >= w.end && x.end <= m.idx));
      if (!between) continue;
      sigs.push({ lang: L.lang, measure: m.raw, wrong: w.raw, infer: between.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.measure + '|' + s.wrong;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 效应量口径误读签名：效应量口径锚 × 错误口径结论 两腿近距共现，且两腿
 * 之间见推断标记。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectEffectMeasureMisread(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（OR/HR 口径区别本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确口径句（罕见结局 OR≈RR / HR 反映瞬时相对风险）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'effect_measure_misread',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '口径锚「' + x.measure + '」→ 错误口径结论「' + x.wrong + '」（推断标记「' + x.infer + '」）'
      : 'effect measure "' + x.measure + '" -> wrong-scale reading "' + x.wrong + '" (via "' + x.infer + '")')),
    details: s.lang === 'zh'
      ? '效应量口径误读(' + sigs.length + '处: 拿「' + s.measure + '」直接推出「' + s.wrong + '」——OR 与 HR 各有口径定义，不能换算成风险倍数或累积生存读数)(zh)'
      : 'effect-measure misread(' + sigs.length + 'x: "' + s.measure + '" directly converted into "' + s.wrong + '" — OR and HR have their own scales, not risk multiples or cumulative survival)(en)',
    guidance: '效应量口径误读（effect-measure misinterpretation）：OR（比值比，两个比值的比）只在结局罕见时才近似 RR（风险比），结局常见时 OR 总在 RR 远离 1 的更外侧，把 OR=3.2 讲成「风险是 3.2 倍」会高估效应；HR（风险比）是任一时点的瞬时风险之比，不是五年生存概率之差、也不是累积生存率的倍数，把 HR=0.7 讲成「五年生存率提高 30 个百分点」或「活过五年的概率翻倍」是两种口径的直接混算。请先把口径对齐再下结论：说明所用效应量的定义（OR/RR/HR/RD 各自度量什么）、给出近似成立的条件（结局罕见时 OR 才近似 RR）或直接报告与结论同口径的量（要讲生存概率就报告生存概率，要讲风险就报告风险比及其置信区间）、把结论限定在相对风险的表述（HR=0.7 说明死亡风险下降三成）。正确做法还包括：指出 OR 不等于风险比（OR 高估风险）、说明 HR 反映的是瞬时相对风险而非累积生存、讨论罕见结局下 OR 与 RR 的近似关系。若这段话只是并列陈述两个实测发现（试验达到终点：HR=0.72；五年生存率 60% 对 45%），那是正当的报告方式，无需修改。',
    tags: ['statistics', 'statistical-literacy', 'effect-measure', 'odds-ratio', 'hazard-ratio', 'epidemiology', 'inference', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectEffectMeasureMisread,
  __internals: () => ({
    MEASURE_ZH_OR, MEASURE_ZH_HR, MEASURE_EN_OR, MEASURE_EN_HR,
    VERDICT_ZH_ORRISK, VERDICT_ZH_HRCUM, VERDICT_EN_ORRISK, VERDICT_EN_HRCUM,
    WINDOW_ZH, WINDOW_EN,
    INFER_ZH, INFER_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    RESTRICTIVE_BEFORE, RESTRICTIVE_BEFORE_EN,
    findSignatures,
  }),
};
