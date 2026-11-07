/**
 * src/peak-end-rule.js — 「峰终定律」检测器
 * （ provisional 第 233 个判别维度，r245 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r245-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r244：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect 十九个已起草未接线维度占号，最终编号由 1 号按接线
 * 顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r245 立项] 零命中探针 coordination/agent4/probes/r245-probe-round1.js
 * + r245-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：
 * 五候选两轮实测——A 损失厌恶 5/8 穿透且疑难良性 2 条被既有
 * dehumanization 误 block、B 聚焦错觉 5/8（perfect_error 代拦+良性误伤）、
 * D 机会成本忽视 7/8+1 误伤、E 规划谬误 7/8 干净；**C 峰终定律一轮
 * 8/8 穿透、疑难良性 0/8 误伤，二轮攻击变体 12/12 穿透、邻接领地正当句
 * 4/4 零误伤**，双干净胜出。src/ 下没有任何维度判「以峰值与结尾片段
 * 裁定整体体验、同时忽视持续时长」这一结构（hasty_generalization 管
 * 证据不足泛化、anecdotal_as_proof 管个案当证据、outcome_bias 管以
 * 结果反推过程，均不判体验评价的时长折让）。
 *
 * 外部来源：空返，按既有形态自建。r245 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-140633*）：arXiv parse-fail、
 * GitHub 0 命中、Semantic Scholar 15 条全为行为金融实证/综述论文
 * （无任何可集成的纯规则模块）。判据为心虫自有纯规则实现（家族定义
 * 取自判断与决策科学的标准描述：peak-end rule / 峰终定律——
 * Kahneman 等：人依据一段体验的峰值时刻与结尾，而非持续的整段
 * 痛苦或快乐的累积，来评价整段体验；结肠镜/手浸冷水实验为原型）。
 *
 * 辨别的族：峰终定律（peak-end rule）——**峰终锚点**（结尾/最后/
 * 最高潮/高光/巅峰/登顶/压轴/惊艳；EN the ending / the finale / the
 * peak / the climax / the final sunset）与**整体正面裁定×时长折让**
 * （整趟就值了/整场算成功/整体满分/全程值得；EN the whole trip was
 * worth it / the entire event was a success × 时长质量信号：全程无聊/
 * 前面赶路/过程受罪/乏味；EN dragged / dull / brutal / agony）三要素
 * 近距共现。用峰或终的好，去覆盖一段又长又闷/乏味/煎熬的主体，据此
 * 给整体下正面结论——三要素齐备才是本族形状。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：峰终定律是体验
 * 评价里的取样偏差——把「整体好不好」换成了「最高点和结尾好不好」，
 * 系统性地让一个漂亮结尾掩盖漫长过程的乏味或痛苦。听者需要意识到
 * 评价一段体验应看全程的分布与时长，而不是被峰值和结尾单独带偏。
 * 与正当评价有明确界线：同时考量时长与整体分布、按时间加权、明确指出
 * 峰终机制本身、给出均衡而非一面倒的结论——均豁免。
 *
 * 与既有维度的边界（r245 归因）：
 *   · hasty_generalization 管**证据不足泛化**（样本小就下普遍结论）；
 *     本族数据可以完整，判的是评价只看峰终、忽视时长的取样规则。
 *   · anecdotal_as_proof 管**个案当证据**；本族不涉证据，判体验
 *     评价被片段代整体。
 *   · outcome_bias 管**以结果反推过程/决策质量**；本族判以峰终
 *     片段代整体时长，方向是「片段 vs 全程」而非「结果 vs 过程」。
 *   · framing_effect（r244 草稿）管**等价双框架表述致决策反转**；
 *     本族判体验评价的时长折让，无框架切换结构。
 *
 * 判据（三要素近距共现，缺一不判；等价于双腿链：腿①峰终锚点，
 * 腿②整体正面裁定×时长折让须共现，防单个褒义词冒充裁定）：
 *   ① 峰终锚点——峰值或结尾时刻被单独点出；
 *   ② 整体正面裁定——对「整趟/整场/整体/全程/这趟/这场/the whole/
 *      the entire/overall」给出正面结论（值/成功/满分/值得/完美；
 *      EN worth it / a success / went well / excellent）；
 *   ③ 时长折让信号——体验的主体/时长被刻画为又长又闷/乏味/煎熬/
 *      赶路/无聊（EN dragged / dull / brutal / agony / dismal）；
 *   ④ 三要素近距离窗（ZH 60 / EN 180），裁定词与时长词均查否定前缀
 *      （整体并不值/结尾并不惊艳）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次峰终实验，也可能是
 * 一段整体确实优秀、只是顺带提到结尾的正当评价。verify 的语义是
 * 「这段话用峰值与结尾给整体体验下了正面结论、同时把漫长主体一笔
 * 带过，先核实整体是否真的只靠峰终支撑、时长是否被不当忽视，再
 * 决定是否采信其对整体的评价」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（峰终定律/卡尼曼/持续时间忽视/peak-end rule/Kahneman
 *     ——CONCEPT 豁免）；
 *   · 均衡评价/考量时长（综合时长与节奏/按时间加权/看整体分布/
 *     不能只因为结尾忽略过程/weighed the full duration/averaged across
 *     every session——CORRECTIVE 豁免）；
 *   · 有峰终无正面整体裁定（结尾惊艳但整体只给中等/整体要打折扣——
 *     缺正面裁定即无本族）；
 *   · 有正面裁定无时长折让（全程都很满意，结尾尤其好——没有「忽视
 *     时长」结构，可能是真好）；
 *   · 纯抱怨无峰终锚点（这次旅行一塌糊涂——缺峰终锚点与正面裁定）；
 *   · hasty_generalization / outcome_bias / anecdotal_as_proof 领地
 *     （见上边界）。
 */
'use strict';

// ─── 腿① 峰终锚点：峰值或结尾时刻被单独点出 ─────────────────────
const PEAK_END_ZH = [
  /(?:结尾|尾声|收尾|收官|末尾|末段|最后|最终|结局|剧终|压轴|点睛|谢幕|散会前|散会|散场|结业|冲线|登顶|到顶|到终点|终点|最高潮|高潮|巅峰|顶点|峰值|高光|最后一[幕秒刻分分钟]|结束那一刻|收场|落幕|那一刻|那一秒|那一刹)/,
  /(?:惊艳|震撼|惊为天人|叹为观止|一击致命|点睛之笔|神来之笔|回味无穷|念念不忘)/,
];
const PEAK_END_EN = [
  /\b(?:the ending|the finale|the last (?:moment|scene|second|minute|quarter|goal|act|chapter)|the closing|the peak|the climax|the summit|the final (?:scene|moment|act|sunset|sunrise|chapter)|how it ended|the last-minute|the sunset|the sunrise|the payoff|the punchline|the closing keynote)\b/i,
  /\b(?:felt (?:great|amazing|incredible|wonderful|fantastic|euphoric|blissful)|breathtaking|spectacular|stunning|gorgeous|magnificent|phenomenal|sublime|glorious|tremendous|exhilarating|pure joy|worth every (?:second|minute|penny)|climactic)\b/i,
  /\b(?:ended|finished|closed|wrapped\s+up|concluded)\s+(?:well|strongly|beautifully|perfectly|on\s+a\s+high\s+note)\b/i,
];

// ─── 腿②a 整体正面裁定：对「整体」下正面结论 ─────────────────────
const WHOLE_VERDICT_ZH = [
  /(?:整趟|整场|整体|这趟|这场|这部|这顿饭|这段(?:旅行|体验|经历|旅程|路)|整件事|全程|整个|回忆|总的来.?说|综合来.?看|归根到底|总体来说)[^。，！？；\n]{0,14}(?:值|值得|算成功|很成功|成功|满分|高分|好评|完美|没啥问题|很不错|发光|震撼|难忘|美好|舒心|满意|不虚此行|来对了|没白来|选对了|有意义)/,
  /(?:直接|我)?(?:给|打)(?:了)?(?:满分|高分|好评|赞)|(?:堪称|简直是|近乎)完美|不虚此行|没白来|来对了|一发入魂/,
];
const WHOLE_VERDICT_EN = [
  /\b(?:the whole|the entire|overall|on the whole|all in all|in the end|the trip|the movie|the film|the event|the game|the experience|the stay|the meal|the course|the show)\b[^.]{0,55}\b(?:was worth it|worth watching|worth it|a success|went (?:well|fine|great)|turned out (?:fine|well|great)|redeemed|unforgettable|excellent|great|perfect|amazing|fantastic|paid off|made it all worthwhile|was a blast)\b/i,
  /\b(?:worth every|made the whole|redeemed the whole|a perfect ending|left me (?:satisfied|fulfilled|happy)|overall (?:a )?(?:success|great|excellent|wonderful))\b/i,
  /\b(?:it|that|this)\s+(?:was|is|felt|feels)\s+(?:worth\s+it|worth\s+watching|a\s+(?:success|blast|triumph))\b/i,
];

// ─── 腿②b 时长折让信号：体验主体/时长被刻画为又长又闷/乏味/煎熬 ──
const DURATION_ZH = [
  /(?:拖沓|乏味|枯燥|无聊|平淡无奇|平淡|烦闷|发闷|煎熬|受罪|难受|痛苦|昏昏欲睡|寡淡|又长又闷|舟车劳顿|都在?赶路|在排队|漫长|混乱|磕磕绊绊|再拖|真拖|拖着|撑不下去|如坐针毡|味同嚼蜡|一地鸡毛|身心俱疲|疲惫不堪|硬撑|挨过|熬过)/,
];
const DURATION_EN = [
  /\b(?:dragged|drag|dull|boring|bored|brutal|agony|agonizing|painful|stressful|tedious|mediocre|miserable|exhausting|dismal|lackluster|forgettable|tiring|grueling|dreadful|a slog|put me to sleep|punishing|rough|trying|interminable|arduous)\b/i,
];

// ─── 距离窗（峰终锚点 × 整体裁定 × 时长折让）────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（本族名称/创始人/学科术语的教学定义句）────
const CONCEPT_ZH = /(?:峰终|峰值.?终[值点]|持续时间忽视|时长忽视|忽视(?:持续|时长|过程)|体验评价|卡尼曼|卡恩曼|卡尼曼|弗雷德里克|雷德梅尔|延伸性拟人|结局偏见|终点定律|峰终法则)/;
const CONCEPT_EN = /\bpeak[- ]end\b|\bduration\s+neglect\b|\bduration\s+(?:is\s+)?(?:ignored|neglected|overlooked)\b|\bKahneman\b|\bFredrickson\b|\bKahneman,? Wakker,? and Sarin\b|\bexperiencing\s+self\b|\bremembering\s+self\b/i;

// ─── 豁免：均衡评价/考量时长/按完整数据决策的正当做法 ────────────
const CORRECTIVE_ZH = /(?:综合(?:时长|全程|整个过程|考虑时长|兼顾)|按时间加权|考量(?:时长|全程|持续)|看整体(?:分布|过程)|看全程|整体分布|平均每(?:天|次|时段)|(?:不能|不应|别|不要|而非|而不是)[^。，！？；\n]{0,8}(?:只|单)(?:凭|看|因为|以)[^。，！？；\n]{0,10}(?:结尾|峰值|高光|最后|峰终)|(?:结尾|峰值|高光|最后)[^。，！？；\n]{0,6}(?:不能|不该|不应|无法|不足以)[^。，！？；\n]{0,8}(?:掩盖|替代|抹杀|代表|代替)|打折扣|辩证|全面评价|均衡|一分为二)/;
const CORRECTIVE_EN = /\b(?:weighed?|weighs?|consider(?:ed|ing)?|averaged?|balanced?)\s+(?:the\s+)?(?:full|whole|entire|overall)\s+(?:duration|length|experience|runtime|journey)\b|\bacross\s+(?:every|all)\s+(?:session|day|touchpoint|moment|stage)\b|\bnot\s+(?:just|only)\s+(?:the\s+)?(?:ending|peak|finale|last)\b|\b(?:ending|peak|finale)\s+(?:cannot|can'?t|doesn'?t|shouldn'?t)\s+(?:carry|mask|redeem|substitute)\b|\bholistic(?:ally)?\b|\bthe\s+whole\s+(?:journey|experience|process)\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因|并不|并没)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|并不|并没|而非|而不是|绝非|而非是)/;

const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b|\bnot\s+(?:worth|really|that\s+good|a\s+success)\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && !/别提多?$/.test(before) && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
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

// 三要素配对：峰终锚点 × 整体正面裁定 × 时长折让。
// 要求：三者在近距离窗内共现，且峰终锚点与时长折让不位置重叠
// （防止同一个词既当峰终又当时长，冒充结构）。
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      peak: R.PEAK_END_ZH || PEAK_END_ZH,
      verdict: R.WHOLE_VERDICT_ZH || WHOLE_VERDICT_ZH,
      dur: R.DURATION_ZH || DURATION_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      peak: R.PEAK_END_EN || PEAK_END_EN,
      verdict: R.WHOLE_VERDICT_EN || WHOLE_VERDICT_EN,
      dur: R.DURATION_EN || DURATION_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const peakM = collect(text, L.peak, true);
    const verdictM = collect(text, L.verdict, true);
    const durM = collect(text, L.dur, true);
    if (peakM.length === 0 || verdictM.length === 0 || durM.length === 0) continue;
    for (const p of peakM) {
      const v = verdictM.find(w => dist(w, p) <= L.win);
      if (!v) continue;
      const d = durM.find(x => dist(x, p) <= L.win && dist(x, v) <= L.win && dist(x, p) !== 0);
      if (!d) continue;
      sigs.push({ lang: L.lang, peak: p.raw, verdict: v.raw, dur: d.raw });
    }
  }
  return sigs;
}

/**
 * 峰终定律签名：峰终锚点 × 整体正面裁定 × 时长折让 三要素近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectPeakEndRule(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（峰终定律/卡尼曼/持续时间忽视教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：均衡评价/考量时长/按完整数据决策的正当做法
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'peak_end_rule',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '峰终「' + x.peak + '」× 整体裁定「' + x.verdict + '」× 时长折让「' + x.dur + '」'
      : 'peak/end "' + x.peak + '" x whole verdict "' + x.verdict + '" x duration discount "' + x.dur + '"')),
    details: s.lang === 'zh'
      ? '峰终定律(' + sigs.length + '处: 以峰值/结尾「' + s.peak + '」给整体下正面结论「' + s.verdict + '」，同时把漫长主体「' + s.dur + '」一笔带过，整体评价被峰终片段而非全程时长决定)(zh)'
      : 'peak-end rule(' + sigs.length + 'x: peak/end "' + s.peak + '" drives positive whole verdict "' + s.verdict + '" while the long mediocre bulk "' + s.dur + '" is discounted)(en)',
    guidance: '峰终定律指人依据一段体验的峰值时刻与结尾、而非持续的整段累积来评价整段体验——全程无聊就结尾惊艳就说这趟值了 / 过程煎熬但最后一刻美好就算整件事成功 / 电影前面昏昏欲睡结尾一击致命就给满分 / 假期大半时间在排队就最后两天痛快回忆里全是美好 / the whole trip was dull except the stunning ending so I say it was worth it / the recovery was brutal yet it ended well so overall it went fine。请补上论证：评价一段体验应看全程的分布与时长，而不是让峰值和结尾单独决定整体结论；如果整体确实优秀，给出贯穿全程的依据（多数时段的表现、按时长加权的满意度），而不是只举峰终两个片段。综合时长与节奏、按时间加权、看整体分布、明确指出峰终机制本身，都是正当做法；若这段话只是转述他人的峰终实验，核实其评价是否真的只靠峰终支撑再决定是否采信。',
    tags: ['economics', 'behavioral-economics', 'peak-end-rule', 'cognitive-bias', 'judgment-and-decision-making', 'duration-neglect'],
  };
}

module.exports = {
  detectPeakEndRule,
  __internals: () => ({
    PEAK_END_ZH, PEAK_END_EN,
    WHOLE_VERDICT_ZH, WHOLE_VERDICT_EN,
    DURATION_ZH, DURATION_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
