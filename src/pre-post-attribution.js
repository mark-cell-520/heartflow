/**
 * src/pre-post-attribution.js — 「前后测无对照归因（pre-post attribution
 * fallacy）」检测器（第 271 个判别维度，r406）
 *
 * [r406 立项] 缺口实证：scripts/round-406/r406-probe-prepost.js（集成树
 * v6.8.206）：10 条攻击变体仅 4 条被既有维度代拦，6 条完全穿引擎
 * （gate.action=pass、findings 无归因）；270 个已接线维度无 pre_post /
 * no_control / uncontrolled 键，最接近的 post_hoc(58 附近) 只命中「A 发生
 * 在 B 前所以 A 导致 B」型先后时序断言，对本族「前后指标对比 → 归因于
 * 期间引入的干预」结构失效（探针归因见下）。decision 本体裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。
 *
 * 辨别的族：前后测无对照归因（pre-post attribution fallacy / uncontrolled
 * before-after comparison / 前后对比归因）——叙事主体给出**同一个体或
 * 群体在干预前后的两项指标**（before X, after Y），在**没有对照组、
 * 没有基线校准、没有排除同期混杂因素**的情况下，直接把指标变化
 * **归因于期间引入的干预**（吃药/换方案/上新政策/上补习班/换领导），
 * 用「变了」的事实冒充「干预有效」的证据。
 *
 * 典型措辞：
 *   我上周开始吃这个保健品，这周头不晕了，说明这个保健品治好了我的头晕。
 *   去年销量 100，今年改用新营销方案后销量 150，所以新方案让销量增长了 50%。
 *   实施新政后交通事故下降了 30%，证明新政有效。
 *   孩子上了补习班，期末成绩提高了 20 分，都是补习班的功劳。
 *   Policy changed in January and crime fell, so the policy reduced crime.
 *   She switched brands and felt better, so the new brand works.
 *   喝了这碗汤，三天后感冒就好了，这汤能治感冒。
 *   我换了机油后车更有劲了，新机油提升了动力。
 *
 * 为什么现有维度拦不住（r406 归因，逐邻居探针验证）：
 *   · post_hoc 管「A 发生在 B 之前，所以 A 导致 B」的单点时序断言；本族
 *     必须有**前后两项可比指标**（销量 100→150 / 成绩+20 分 / 事故-30%），
 *     探针中 6 条漏判句全部带数字对比，post_hoc 无一命中。
 *   · pseudo_causal 管「时间相近当因果」；本族指标对比在场时 pseudo_causal
 *     对数字形态不敏感（探针归因：含百分数与「提高了 N 分」的句子全漏）。
 *   · statistical_misleading 管小基数百分比；本族基数不明但不必然小，
 *     且错误在归因结构不在基数。
 *   · weak_evidence_strong_claim 管「轶事 → 强结论」的证据强度；本族是
 *     **对照缺失**的方法学缺陷，不是证据数量问题。
 *   · confirmation_evidence / cherry_picking 管选择性取证；本族没有选择
 *     动作，是把全部前后数据直接归因。
 *   · regression_to_the_mean 管极值回归；本族不依赖前后取值是否处于极值，
 *     任何「前后变 + 归因于干预」结构都成立。
 *
 * [r406 豁免表设计] 五组豁免（对照组在场 / 混杂承认 / 仅陈述时序 / 疑问
 * 形 / 方法学纠正），保证「随机对照试验显示服药组 70% 对照组 30%」这类
 * 正确证据陈述与「同期行业整体增长 60%，需拆解增量来源」这类谨慎解读
 * 不被误伤。
 *
 * 判据（两腿共现 + 跨腿邻近窗 + 豁免，缺一不判）：
 *   腿① INTERVENTION 干预引入腿——干预被引入或切换的时点/动作在场
 *     （中英，裸名词必收）：开始吃/改用/实施/上线/换了/采用/推行/引进/
 *     started taking / switched to / implemented / adopted / introduced /
 *     rolled out / changed to / enrolled in / joined
 *   腿② ATTRIBUTION 归因断言腿——把指标变化归因于该干预的因果断言在场
 *     （中英）：说明/证明/表明/可见/所以/都是…功劳/治愈了/提升了/导致了/
 *     shows / proves / so the / therefore / thanks to / because of / drove /
 *     credited to / as a result of
 *   腿③ 前后对比指标腿（PP_MEASURE）——前后两项可比指标在场（数字对比 /
 *     从…到… / 提高了 N / 下降了 N% / before-after / from X to Y）
 *
 * 为什么取 VERIFY 级：单句可能是方法学教学反例（「前后测没有对照组，不能
 * 说明干预有效」正是本族要教的判别动作）、对他人错误论证的转述批评、
 * 新闻概括。verify 的含义是「这个前后对比归因缺少对照组与混杂控制，需要
 * 补上对照设计或排除同期因素再下结论」——调用方应要求补证据，而不是接受
 * 「变了就等于干预有效」的结论。
 *
 * 与既有维度的边界（r406 归因）：
 *   · post_hoc(时间先后) 判单点时序因果；本族必须有前后指标对比腿。
 *   · weak_evidence_strong_claim 判证据强度不足；本族判**对照缺失**的
 *     方法学结构（干预时点 × 归因断言 × 前后对比三腿共现）。
 *   · regression_to_the_mean 判极值回归；本族不要求极值。
 *   · statistical_misleading 判基数问题；本族不涉及基数。
 */

// ─── 腿① INTERVENTION 干预引入（中英，含裸名词形态）───────────────────
const INTERVENTION_ZH = [
  /(?:开始|初次|首次)(?:吃|服用|服用|使用|采用|打|注射)/,
  /(?:改用|换成|换用|切换到|转向)/,
  /(?:实施|推行|实行|上线|启用|引进|引入|采用|部署|落实)/,
  /(?:上了|报名|参加|加入|进入)/,
  /(?:开始|上手)(?:了)?/,
  /(?:吃|喝|服用)(?:了|完)?(?:这个|这种|那)?/,
  /(?:换|更换)(?:了)?(?:新|新一?代)?/,
  /(?:新政|新方案|新政策|新规|新规|规定)/,
  /(?:启动|立项|开建|开工)/,
];
const INTERVENTION_EN = [
  /\b(?:started|began|commenced)\s+(?:taking|using|adopting|on)\b/i,
  /\b(?:switched|moved|changed|transitioned)\s+(?:to|over|brands?|providers?|suppliers?|platforms?)\b/i,
  /\b(?:implemented|introduced|rolled\s+out|adopted|deployed|launched)\b/i,
  /\b(?:enrolled\s+in|joined|signed\s+up\s+for|subscribed\s+to)\b/i,
  /\b(?:new\s+(?:policy|plan|program|scheme|campaign|initiative|tool|system|leadership|leader|manager|brand))\b/i,
  /\b(?:after\s+(?:switching|adopting|implementing|starting))\b/i,
  // [r406] 政策/方案变更形（Policy changed / the campaign / reform 裸名词）
  /\b(?:policy|policies|reform|regulation|rule|law|campaign|program|scheme)\s+(?:was\s+|were\s+|got\s+)?(?:changed|implemented|introduced|rolled\s+out|adopted|launched|enacted|revised|updated)\b/i,
  /\b(?:before|after)\s+the\s+(?:policy|reform|campaign|change|switch|rollout|launch)\b/i,
  // [r406] 采用形（After adopting / having adopted）
  /\b(?:after|since)\s+(?:adopting|implementing|introducing|switching)\b/i,
];

// ─── 腿② ATTRIBUTION 归因断言（中英）──────────────────────────────────
const ATTRIBUTION_ZH = [
  /(?:说明|证明|表明|可见|意味着|反映出)/,
  /(?:所以|因此|故而|可见|这?(?:就是)?(?:因为|是由于))/,
  /(?:都?是|全(?:都)?是|正是)(?:.{0,12})?(?:功劳|作用|结果|效果|功劳)/,
  /(?:治好|治愈)(?:了)?(?:我|他|她|患者)?/,
  /(?:提升|提高|拉高|推高|抬高)(?:了)?/,
  /(?:导致|造成|引发|带来)(?:了)?/,
  /(?:有效|起作用|奏效|见效)/,
  /(?:归因于|归功于|得益于|全靠|多亏)/,
  // [r406] 时点后置推断形（「X 后 Y 就上去」——后置分句即归因断言）
  /(?:后|之后|以后).{0,12}(?:就|便)(?:上去|提升|提高|好转|改善|见效|上涨)/,
  /(?:这|那)(?:就是|正说明|足以说明|说明)/,
  // [r406] 疗效能力断言形（「能治/可以治/管用」裸名词）
  /(?:能|可以|可|就能够?|管用)(?:治|医|防|缓解|改善)/,
];
const ATTRIBUTION_EN = [
  /\b(?:shows?|proves?|demonstrates?|indicates?|suggests?)\b/i,
  /\b(?:so|therefore|thus|hence)\b/i,
  /\b(?:thanks\s+to|because\s+of|due\s+to|owing\s+to|as\s+a\s+result\s+of)\b/i,
  /\b(?:drove|boosted|lifted|raised|pushed)\b/i,
  /\b(?:cured|healed|fixed|resolved|worked|helped)\b/i,
  /\b(?:credited\s+to|attributed\s+to|responsible\s+for)\b/i,
  // [r406] 时点后置推断形（After X, Y rose. — after 引导的分句即归因断言）
  /\bafter\b.{0,80}\b(?:rose|improved|increased|fell|dropped|declined|got\s+better)\b/i,
  /\b(?:that's|this\s+is)\s+(?:why|because|how)\b/i,
];

// ─── 腿③ PP_MEASURE 前后对比指标（中英，数字对比 / 从…到…）──────────────
const PP_MEASURE_ZH = [
  /(?:提高|提升|增加|增长|上升|上涨)(?:了)?\s*\d+(?:\.\d+)?\s*(?:个|分|倍|%|％|人次|元|美元)/,
  /(?:下降|降低|减少|下滑)(?:了)?\s*\d+(?:\.\d+)?\s*(?:个|分|倍|%|％|人次|元|美元)/,
  /\d+(?:\.\d+)?\s*(?:%|％)/,
  /从\s*\d+(?:\.\d+)?\s*(?:到|至|→|变成)\s*\d+(?:\.\d+)?/,
  /\d+(?:\.\d+)?\s*(?:到|至|→)\s*\d+(?:\.\d+)?/,
  /(?:上?一?(?:个)?(?:月|年|周|季|次|天)).{0,30}(?:这|本|本个)?(?:个)?(?:月|年|周|季|次|天)/,
  /(?:之前|以前|原先|原来).{0,30}(?:之后|以后|现在|如今)/,
  /(?:上周|上月|去年|先前|此前).{0,40}(?:这周|本月|今年|现在|如今)/,
  /(?:不晕|好转|康复|恢复|见效)(?:了)/,
  /(?:更|越发|愈加)(?:有劲|好|强|高|低)/,
  // [r406] 无数字前后变化族（裸名词变体：业绩就上去了 / 成绩提高了）
  /(?:业绩|销量|成绩|收入|利润|效率|产出|排名|水平|评分|得分|人气|口碑)(?:就|便|也)?(?:上去|提升|提高|好转|改善|上涨|增长|翻番|飙升)/,
  /(?:就|便|也)(?:上去|好起来|好多了|提高了|提升了|见效了|见效)/,
  /(?:排名|位次|名次)(?:上升|上升|提高|前进|上升)/,
  // [r406] 时序前后对比形（三天后…就好了 / 过了几天…好转）
  /(?:三天|几天|数日|一周|几天后|数日后).{0,20}(?:就|便)(?:好|康复|见效|恢复)/,
];
const PP_MEASURE_EN = [
  /\b(?:rose|increased|grew|jumped|climbed|improved)\s+(?:by\s+)?\d+(?:\.\d+)?/i,
  /\b(?:fell|dropped|declined|decreased|reduced)\s+(?:by\s+)?\d+(?:\.\d+)?/i,
  /\b\d+(?:\.\d+)?\s*(?:%|percent|percentage points)\b/i,
  /\bfrom\s+\d+(?:\.\d+)?\s+to\s+\d+(?:\.\d+)?/i,
  /\b(?:before|previously|prior)\b.{0,60}\b(?:after|now|currently|these days)\b/i,
  /\b(?:last\s+(?:week|month|year))\b.{0,60}\b(?:this\s+(?:week|month|year)|now)\b/i,
  /\b(?:felt|feels?)\s+(?:better|improved|healthier|stronger)\b/i,
  /\b(?:no\s+longer|stopped|quit)\b/i,
  // [r406] 无数字前后变化族（EN：output rose / sales jumped / performance improved）
  /\b(?:sales|revenue|profit|output|performance|results?|grades?|scores?|efficiency|productivity|rankings?)\s+(?:rose|increased|improved|jumped|climbed|soared|picked\s+up|got\s+better)\b/i,
  /\b(?:crime|accidents?|errors?|complaints?|incidents?|defects?)\s+(?:fell|dropped|declined|decreased|went\s+down)\b/i,
  /\b(?:things?|it)\s+(?:got|became)\s+(?:better|worse|improved)\b/i,
  // [r406] 时序恢复形（got better after N days / recovered shortly after）
  /\b(?:recovered|healed|got\s+better|improved)\s+(?:shortly\s+)?after\b/i,
  /\b(?:after|within)\s+(?:a\s+few\s+)?(?:days?|weeks?)\b.{0,40}\b(?:recovered|healed|better|fine|back\s+to\s+normal)\b/i,
];

// ─── 豁免表 ────────────────────────────────────────────────────────────
// EXEMPT_CONTROL 对照组/严谨设计在场——有对照就不是本族
const EXEMPT_CONTROL_ZH = [
  /随机对照|对照试验|对照组|控制组|盲法|双盲|RCT|倾向评分|匹配后|校正后|调整后|协变量/,
  /(?:与|相比|对比).{0,20}(?:对照|控制组|参照组)/,
  /同期.{0,12}(?:对照|控制组|参照组|未接受|未使用)/,
  /(?:扣除|剔除|排除).{0,10}(?:季节|趋势|混杂|干扰|因素)/,
];
const EXEMPT_CONTROL_EN = [
  /\brandomi[sz]ed\b|\bRCT\b|\bcontrol\s+group\b|\bplacebo\b|\bdouble[- ]blind\b|\bpropensity\s+score\b/i,
  /\bcompared\s+(?:to|with)\s+(?:the\s+)?(?:control|placebo)\b/i,
  /\badjusted\s+for\b|\bcontrolling\s+for\b|\bafter\s+adjustment\b/i,
];

// EXEMPT_CONFOUND 混杂因素承认/谨慎解读——承认混杂就是正确的判别动作
const EXEMPT_CONFOUND_ZH = [
  /(?:可能|也许|或许|未必).{0,20}(?:有关|相关|原因|因素)/,
  /(?:不能|无法|难以|不宜)(?:完全)?(?:归因|说明|证明|断定)/,
  /(?:需要|还得|仍须|还要).{0,16}(?:排除|考虑|拆解|分析|验证|对照)/,
  /(?:谨慎|审慎|保守)(?:地)?(?:解读|看待|下结论|归因)/,
  /(?:混杂|干扰|混淆)(?:因素|变量)?/,
  /(?:也|同时|同期).{0,20}(?:也在|还|另有|出台了|发生了变化|回暖|好转)/,
  /(?:回升|回暖|好转|改善).{0,16}(?:也|同时|同期)/,
  /(?:试题|题目)(?:难度)?(?:变化|不同|较)?/,
  /(?:尚)(?:不|未)(?:能|可)(?:确定|断定|归因)/,
  /(?:多种|多个|若干).{0,6}(?:因素|原因|变量)/,
  /(?:共同|一起|叠加)(?:作用|导致|造成)/,
];
const EXEMPT_CONFOUND_EN = [
  /\b(?:may|might|could|possibly|perhaps)\s+(?:be|have\s+been)\s+(?:due|related|attributable)/i,
  /\b(?:cannot|can't|unable\s+to|hard\s+to)\s+(?:attribute|conclude|prove|determine)/i,
  /\b(?:need|needs|require|must)\s+(?:to\s+)?(?:rule\s+out|account\s+for|control\s+for|disentangle|isolate)/i,
  /\b(?:confound\w*|confounding|mixed\s+effects?|lurking\s+variables?)\b/i,
  /\b(?:multiple|several|many)\s+(?:factors|causes|reasons|drivers)\b/i,
  /\b(?:as\s+well|too|also|at\s+the\s+same\s+time|simultaneously)\b/i,
  /\b(?:correlat\w+|not\s+(?:necessarily|causally))\b/i,
];

// EXEMPT_METHOD 方法学纠正/批评在场——在破除本谬误
const EXEMPT_METHOD_ZH = [
  /(?:前后测|前后对比|无对照|缺少对照|没有对照|缺乏对照)/,
  /(?:方法学|方法论|实验设计|因果推断)(?:问题|缺陷|批评|纠正)/,
  /(?:均值回归|向均值回归)/,
  /(?:不能|不可)(?:作为|算作|当作).{0,10}(?:证据|证明)/,
];
const EXEMPT_METHOD_EN = [
  /\b(?:pre[- ]post|before[- ]after)\s+(?:comparison|design|study)\b/i,
  /\b(?:no|without|lacking|absence\s+of)\s+(?:control|comparison|baseline)\b/i,
  /\b(?:regression\s+to\s+the\s+mean|mean\s+reversion)\b/i,
  /\b(?:cannot|can't|does\s+not|doesn't)\s+(?:establish|prove|demonstrate)\s+causa/i,
];

// ─── 跨腿邻近窗（中 160 字 / 英 400 字符，同 lead_time_bias 口径）────────
const WIN_ZH = 160;
const WIN_EN = 400;

function earliestIdx(list, text) {
  let best = -1;
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m && m.length > 0) {
      const i = text.indexOf(m[0]);
      if (i >= 0 && (best < 0 || i < best)) best = i;
    }
  }
  return best;
}

// 中英两清单的最早匹配下标（-1 视为缺席，取非负最小值）
function earliestEither(zhList, enList, text) {
  const a = earliestIdx(zhList, text);
  const b = earliestIdx(enList, text);
  if (a < 0) return b;
  if (b < 0) return a;
  return Math.min(a, b);
}

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/**
 * 前后测无对照归因判别：干预引入腿 × 归因断言腿 × 前后对比指标腿，三腿
 * 共现 + 跨腿邻近窗 + 豁免，缺一不判。
 *
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkPrePostAttribution(text, inject) {
  // [稳定性审计惯例] 非字符串入口守卫。
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // ─── 豁免：对照组 / 混杂承认 / 方法学纠正在场 → 不判 ───────────────
  const C_Z = R.EXEMPT_CONTROL_ZH || EXEMPT_CONTROL_ZH;
  const C_E = R.EXEMPT_CONTROL_EN || EXEMPT_CONTROL_EN;
  if (anyHit(C_Z, text) || anyHit(C_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const F_Z = R.EXEMPT_CONFOUND_ZH || EXEMPT_CONFOUND_ZH;
  const F_E = R.EXEMPT_CONFOUND_EN || EXEMPT_CONFOUND_EN;
  if (anyHit(F_Z, text) || anyHit(F_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const M_Z = R.EXEMPT_METHOD_ZH || EXEMPT_METHOD_ZH;
  const M_E = R.EXEMPT_METHOD_EN || EXEMPT_METHOD_EN;
  if (anyHit(M_Z, text) || anyHit(M_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 疑问形守卫：整句以问号收尾是探询不是断言（同 lead_time_bias 口径）。
  if (/[？?]\s*$/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // ─── 三腿共现 ──────────────────────────────────────────────────────
  const p1 = earliestEither(R.INTERVENTION_ZH || INTERVENTION_ZH, R.INTERVENTION_EN || INTERVENTION_EN, text);
  if (p1 < 0) return { hit: false, score: 0, detail: '', count: 0 };

  const p2 = earliestEither(R.ATTRIBUTION_ZH || ATTRIBUTION_ZH, R.ATTRIBUTION_EN || ATTRIBUTION_EN, text);
  if (p2 < 0) return { hit: false, score: 0, detail: '', count: 0 };

  const p3 = earliestEither(R.PP_MEASURE_ZH || PP_MEASURE_ZH, R.PP_MEASURE_EN || PP_MEASURE_EN, text);
  if (p3 < 0) return { hit: false, score: 0, detail: '', count: 0 };

  const win = /[\u4e00-\u9fff]/.test(text) ? (R.WIN_ZH ?? WIN_ZH) : (R.WIN_EN ?? WIN_EN);
  const span = Math.max(p1, p2, p3) - Math.min(p1, p2, p3);
  if (span > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.55, count: 1,
    detail: /[\u4e00-\u9fff]/.test(text)
      ? '前后测无对照归因×干预引入×前后指标对比×直接归因断言(zh)'
      : 'pre-post-attribution×intervention-introduced×before-after-metric×direct-attribution(en)',
  };
}

module.exports = {
  checkPrePostAttribution,
  // 负例注入口（逐常量验证承重）
  INTERVENTION_ZH, INTERVENTION_EN,
  ATTRIBUTION_ZH, ATTRIBUTION_EN,
  PP_MEASURE_ZH, PP_MEASURE_EN,
  EXEMPT_CONTROL_ZH, EXEMPT_CONTROL_EN,
  EXEMPT_CONFOUND_ZH, EXEMPT_CONFOUND_EN,
  EXEMPT_METHOD_ZH, EXEMPT_METHOD_EN,
  WIN_ZH, WIN_EN,
};
