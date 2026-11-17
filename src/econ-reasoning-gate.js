/**
 * econ-reasoning-gate — 经济学/统计推理谬误族 gate 接线桥（r304）
 *
 * 背景（真升级类型③：接线一个已加载但从未 dispatch 的能力）：
 *   r219-r253 三十多轮起草的 18 个经济/统计推理维度模块（src/*.js，每个
 *   双腿共现判据 + 豁免表 + __internals 负例注入口 + 模块层单测 + 326 条
 *   官方良性语料零误命中实证）在插件层 src/plugins/econ-reasoning-check/
 *   index.js 有 FAMILIES 表并接进了 postprocess.think hook——但插件层只写
 *   `result._discrimination.econReasoning`（think-pipeline 消费 → 置信度打折
 *   + warning），**从未进 gate 判别路径**：gate.action 恒 pass，调用方拿不到
 *   block/rewrite/verify 动作，findings[] 里也没有这些维度。插件头注释明确
 *   写着「src/index.js 接线由 1 号主力补全」，该接线始终未发生。
 *
 * 本模块补上这一环：把 18 族聚合为**单一 gate 维度** `econ_reasoning_gate`
 * （verify 级），判据继承各模块的两腿共现结构，豁免表由各模块自带
 * （教学/纠正陈述/疑问句豁免已在模块层实现）。
 *
 * 为什么聚合成一个维度而不是 18 个独立 dimMap 键：
 *   - 18 族判据形状完全同构（都是「经济学/统计概念 × 误用断言」双腿共现），
 *     独立接线会让 index.js 再增 18 处接入点、8 个文件同步，收益为零而
 *     回归面扩大 18 倍；
 *   - 维度计数纪律：AGENTS.md 的 248 是 dimMap 键数，聚合桥是一个新键，
 *     计数 +1 可度量、可审计；
 *   - 误伤控制：单维度 verify 级（不 block/rewrite），与插件层「不动
 *     gate.action」的保守策略一致，双向门禁不受影响。
 *
 * 维度语义：这段文本把一个经济学/统计概念用错了（或断言一个与激励结构/
 * 样本结构/概率结构相悖的结论），需要按具体子族 guidance 修正后再采信。
 * 子族命中明细通过 __families 暴露，调用方（agent）可逐族修。
 */

// ─── 族表：与插件层 FAMILIES 一一对应（不含 ad_hominem / incentive_blind_spot，
// 那两个已在 r297 独立接进 dimMap，此处不重复接线）──
const path = require('path');

const FAMILIES = [
  { key: 'budget_value_conflation',         mod: './budget-value-conflation.js',        fn: 'checkBudgetValueConflation',        zh: '预算约束≠价值判断',       en: 'budget-value conflation',        round: 'r219' },
  { key: 'average_marginal_conflation',     mod: './average-marginal-conflation.js',    fn: 'checkAverageMarginalConflation',    zh: '平均≠边际',               en: 'average-marginal conflation',    round: 'r220' },
  { key: 'mental_accounting',               mod: './mental-accounting.js',              fn: 'detectMentalAccounting',            zh: '心理账户',                 en: 'mental accounting',              round: 'r235' },
  { key: 'perverse_incentive',              mod: './perverse-incentive.js',             fn: 'detectPerverseIncentive',           zh: '激励反噬',                 en: 'perverse incentive',             round: 'r236' },
  { key: 'winners_curse',                   mod: './winners-curse.js',                  fn: 'detectWinnersCurse',                zh: '赢家诅咒',                 en: "winner's curse",                 round: 'r237' },
  // r336 新增：机会成本忽视（r260 backlog 重启——不作为/不投入被评估成
  // 零成本零损失，被放弃的替代用途未计入；双腿 + RULE/CONCEPT/CORRECT
  // 三组豁免解掉 r260 记录的 use-it-or-lose-it/免费品/闲置纠正误伤陷阱）。
  { key: 'opportunity_cost_neglect',        mod: './opportunity-cost-neglect.js',       fn: 'detectOpportunityCostNeglect',     zh: '机会成本忽视',             en: 'opportunity cost neglect',       round: 'r336' },
  // r339 新增：适应证混杂（confounding by indication——治疗分配由基线
  // 预后驱动时，组间粗结局率差异反映的是基线风险而非治疗效应；双腿 +
  // CONCEPT/CORRECT 两组豁免 + 腿②对冲守卫解掉正确限定形）。
  { key: 'confounding_by_indication',       mod: './confounding-by-indication.js',      fn: 'detectConfoundingByIndication',   zh: '适应证混杂',               en: 'confounding by indication',     round: 'r339' },
  { key: 'tragedy_of_commons',              mod: './tragedy-of-commons.js',            fn: 'detectTragedyOfCommons',            zh: '公地悲剧',                 en: 'tragedy of the commons',         round: 'r238' },
  { key: 'illusion_of_control',             mod: './illusion-of-control.js',            fn: 'detectIllusionOfControl',           zh: '控制幻觉',                 en: 'illusion of control',            round: 'r239' },
  { key: 'disposition_effect',              mod: './disposition-effect.js',             fn: 'detectDispositionEffect',           zh: '处置效应',                 en: 'disposition effect',             round: 'r240' },
  { key: 'endowment_effect',                mod: './endowment-effect.js',              fn: 'detectEndowmentEffect',             zh: '禀赋效应',                 en: 'endowment effect',               round: 'r241' },
  { key: 'anchoring_effect',                mod: './anchoring-effect.js',              fn: 'detectAnchoringEffect',             zh: '锚定效应',                 en: 'anchoring effect',               round: 'r242' },
  { key: 'present_bias',                    mod: './present-bias.js',                  fn: 'detectPresentBias',                 zh: '现时偏差（双曲贴现）',     en: 'present bias',                   round: 'r243' },
  { key: 'peak_end_rule',                   mod: './peak-end-rule.js',                 fn: 'detectPeakEndRule',                 zh: '峰终定律',                 en: 'peak-end rule',                  round: 'r245' },
  { key: 'effort_justification',            mod: './effort-justification.js',          fn: 'detectEffortJustification',         zh: '努力正当化',               en: 'effort justification',           round: 'r234' },
  { key: 'p_hacking',                       mod: './p-hacking.js',                     fn: 'detectPHacking',                    zh: '多重比较/数据挖掘',        en: 'p-hacking',                      round: 'r232' },
  { key: 'inverse_gamblers_fallacy',        mod: './inverse-gamblers-fallacy.js',      fn: 'detectInverseGamblersFallacy',      zh: '逆赌徒谬误',               en: "inverse gambler's fallacy",      round: 'r248' },
  { key: 'significance_effect_size',        mod: './significance-effect-size.js',      fn: 'detectSignificanceEffectSize',      zh: '显著性≠重要性',            en: 'significance ≠ effect size',     round: 'r250' },
  { key: 'selection_on_dependent_variable', mod: './selection-on-dependent-variable.js',fn: 'detectSelectionOnDependentVariable',zh: '选择依赖变量/按结果归因', en: 'selection on dependent variable', round: 'r252' },
  // r360 新增：Will Rogers 现象（分期迁移——按新标准把对象在组间重新
  // 分类后，两组各自的结果指标同时改善，而每个个体的结局没有任何变化；
  // 双腿 + CONCEPT/CORRECT/INDIV 三组豁免解掉「两组方向相反」「只是
  // 统计假象」「改善来自个体自身」三个误伤陷阱）。
  { key: 'will_rogers_phenomenon',        mod: './will-rogers-phenomenon.js',     fn: 'detectWillRogersPhenomenon',    zh: 'Will Rogers 现象/分期迁移', en: 'Will Rogers phenomenon (stage migration)', round: 'r360' },
  // r364 新增：Jevons 悖论/回弹效应（rebound effect——效率提升降低单位
  // 消耗，总量却可能因使用量扩张而上升；攻击形「效率上去 → 总量自然
  // 下降/不用担心总量/多用把省下的赚回来」，存量绝对化维度只收必然/
  // 肯定形，非绝对形 5/11 穿透；双腿 + CONCEPT/CORRECT 两组豁免）。
  { key: 'jevons_paradox',                mod: './jevons-paradox.js',             fn: 'detectJevonsParadox',          zh: 'Jevons 悖论/回弹效应',     en: 'Jevons paradox (rebound effect)', round: 'r364' },
  // r366 新增：碳泄漏/污染避难所（carbon leakage / pollution haven——产能
  // 转移到规制更松地区，本地排放下降而全球总量未必下降；攻击形「迁走/
  // 外包 → 本地或全球问题解决/不再是我们的事」，与 jevons 腿①零交集
  // （效率提升 vs 空间转移），存量维度 5/6 穿透；双腿 + CONCEPT/CORRECT
  // 两组豁免 + 强否定守卫）。
  { key: 'carbon_leakage',                mod: './carbon-leakage.js',             fn: 'detectCarbonLeakage',          zh: '碳泄漏/污染避难所',       en: 'carbon leakage (pollution haven)', round: 'r366' },
  // r367 新增：价格管制单效应断言（price-control single-effect assertion——
  // 房租上限/最低工资/限价在场，被直接兑现为「只会…不会…/无副作用/
  // 供给自动适配」单边收益，多边效应被免掉；同池 8 候选定拨穿透最高
  // （4/5）且良性零误伤（0/3），存量维度 0/5 覆盖；双腿 + CONCEPT/
  // CORRECT 两组豁免 + 强否定守卫；CONCEPT 收泛概念名与腿①具体工具名
  // 互不咬，CORRECT 只收正面承认形防吞否定攻击句——r367 实测教训）。
  { key: 'price_control',                 mod: './price-control.js',              fn: 'detectPriceControl',          zh: '价格管制单效应断言',       en: 'price-control single-effect assertion', round: 'r367' },
  // r368 新增：重商主义贸易顺差谬误（mercantilism / trade-surplus wealth
  //   misattribution——贸易差额语境 × 把差额单边兑现为财富得失的断言：
  //   出口/顺差才叫赚钱、进口/逆差就是财富外流、顺差越大越富、进口越多
  //   越吃亏；探针攻击穿透 9/10（唯一非穿透条被存量 zero_sum_fallacy
  //   代拦）、良性非 pass 1/9（存量 confidence 维度误拦，非本族增量）；
  //   双腿 + CONCEPT/CORRECT 两组豁免 + 强否定守卫；CONCEPT 须概念名与
  //   框架词共现，防「重商主义其实是对的」前缀绕过；「买国货才是爱国」
  //   经济民族主义形不判（超财富得失范围，样本靠净流出子句承重）。
  { key: 'mercantilism',                  mod: './mercantilism.js',               fn: 'detectMercantilism',         zh: '重商主义贸易顺差谬误',     en: 'mercantilism (trade-surplus wealth misattribution)', round: 'r368' },
  // r369 新增：节约悖误/合成谬误宏观储蓄形（paradox of thrift / composition
  //   fallacy in aggregate saving——节俭概念 × 普遍量化词 × 总量向好断言 三
  //   腿近距共现：先用「储蓄是美德」取得正当性，再把个体美德直接加总为
  //   「全社会越节俭经济越繁荣/总需求不受影响」，免掉「减少消费会压缩总
  //   需求」的宏观机制；同池两候选定拨，本族攻击穿透 3/7 且良性零误伤
  //   0/5（对手 lump_of_labor 穿透 3/11 但良性误伤 4/7、边界脏），存量
  //   维度对组合谬误零覆盖；三腿 + CONCEPT/CORRECT 两组豁免 + 强否定守卫；
  //   腿③拆 NOHARM（不会下降/受影响，免否定守卫）与 POSITIVE（增长/繁荣，
  //   受否定守卫）两桶，解「总需求不会增长」良性纠正误伤）。
  { key: 'paradox_of_thrift',              mod: './paradox-of-thrift.js',          fn: 'detectParadoxOfThrift',      zh: '节约悖误/合成谬误宏观储蓄形', en: 'paradox of thrift (composition fallacy in aggregate saving)', round: 'r369' },
  // r371 新增：诱饵效应/被支配比较（decoy effect / asymmetric dominance——
  // 选项集内加入被严格支配的选项（更贵且关键属性更差），使目标选项在
  // 对比下显得划算，价值结论全部由陪衬对象衬托而出；攻击形「基础版
  // 功能这么少，专业版只贵一点就显得特别划算」「比起那个又贵又难用的
  // 竞品，我们的产品简直是良心价」「反正有更差的垫底，选中间这个肯定
  // 不会错」；同池四候选定拨（A lump_of_labor 穿透 5/10 良性 1/5 边界
  // 脏、B publication_bias 6/7 多被存量代拦、C status_quo_bias 6/8 良性
  // 1/4 边界脏），本族攻击穿透 0/7 真零命中 + 良性 0/3 零误伤，存量维度
  // 对选项集衬托形零覆盖；三腿（选项集 × 被支配描述 × 相对化结论）+
  // CONCEPT/CORRECT/TEMPORAL 三组豁免；腿②受否定守卫、腿③不受
  // （「肯定不会错」的「不会」是攻击惯语组成部分，r371 设计决策）。
  { key: 'decoy_effect',                   mod: './decoy-effect.js',               fn: 'detectDecoyEffect',          zh: '诱饵效应/被支配比较',       en: 'decoy effect (asymmetric dominance)', round: 'r371' },
  // r372 新增：健康使用者偏倚/健康依从者效应（healthy user bias / healthy
  //   adherer effect——坚持健康行为、按时服药、主动体检的人群本身在
  //   教育/收入/健康意识/基础健康上系统性优于非坚持者，观察性研究两组
  //   间的健康差异混杂「行为效果」与「人群自选择」，直接归因为行为/
  //   产品即犯此偏倚；攻击形「吃维生素的人明显更健康，所以维生素让人
  //   健康」「坚持复诊的病人死亡率更低，复诊本身就是延长生命的良方」；
  //   同池 16 候选定拨：本族攻击穿透 8/16（真零命中，存量维度零覆盖）
  //   + 良性 0/4 零误伤（adverse_selection 5/5 全被存量代拦边际零、
  //   moral_hazard 穿透 2/5、free_rider 1/4、合成谬误 2/5、illicit_process
  //   3/4 全被 absolute_claim 代拦、概率相加 4/4 全被 perfect_error 代拦、
  //   zero_risk_bias 良性 3/4 非 pass 边界脏）；两腿（行为/依从群体 ×
  //   健康结果或归因断言）+ CONCEPT/CORRECT 两组豁免 + 腿①否定守卫
  //   （「不吃维生素的人」是对照组形）+ CAUSAL 桶前置否定守卫）。
  { key: 'healthy_user_bias',              mod: './healthy-user-bias.js',          fn: 'detectHealthyUserBias',     zh: '健康使用者偏倚/依从者效应',  en: 'healthy user bias (healthy adherer effect)', round: 'r372' },
  // r373 新增：非凡主张的证据比例错配（extraordinary claims require
  //   extraordinary evidence / evidence–claim proportionality——主张越背离
  //   既有确证，承载它所需证据越强；攻击形「治愈绝症/永动机/长生不老/百分百
  //   等离奇主张 × 只有几例个例/没有复现/未经同行评议 等弱基底 × 足以证明/
  //   应该采信/毋庸置疑 等充分性兑现」三腿近距共现；同池七候选定拨：
  //   affect_heuristic 0/6 全被存量代拦、scope_insensitivity 穿透 4/13 边际
  //   低、ambiguity_aversion 2/4 良性脏、harking 事前/事后文本不可见定义不牢、
  //   denominator_neglect 1/5 脏、forking_paths 1/4 被 researcher_degrees_of_
  //   freedom 代拦，本族穿透 4/5 真零命中；三腿 + CONCEPT/CORRECT/HEDGE 三组
  //   豁免 + 腿③否定守卫；与 weak_evidence_strong_claim(dim245 弱证据**类型**
  //   × 绝对化断言) 射程不同——本族管主张**离奇度** × 证据**不成比例**）。
  { key: 'extraordinary_claims',            mod: './extraordinary-claims.js',       fn: 'detectExtraordinaryClaims',  zh: '非凡主张的证据比例错配',     en: 'extraordinary claims require extraordinary evidence (evidence-claim proportionality)', round: 'r373' },
  // r374 新增：存量-流量混淆（stock-flow conflation / level-rate confusion——
  //   债务总额/市值/存款余额/外汇储备 等存量时点水平被直接兑现为年度流量
  //   速率（等于全国人民一年白干/可见每年新增财富就有十万亿）或流平比较结论
  //   （比人家GDP高所以比人家还有钱），跳过存量是历年累积、流量是年度速度
  //   的口径除法；同池七候选定拨：certainty_effect 1/6 被存量代拦且良性脏、
  //   absolute_advantage 3/5、tax_incidence 2/5、money_creation 7/10 但与
  //   money_illusion(dim234) 射程相邻、competition_waste 良性 3/5 脏、
  //   linear_tax_revenue 3/5，本族穿透 7/10 真零命中 + 良性边界最净（2/8 非
  //   pass 均系存量维度误伤非本族增量）；两腿（存量指称 × 流量兑现 ZS/RATE/
  //   CMP 三形其一）+ CONCEPT/CORRECT 两组豁免 + 腿②否定守卫；与 count_rate_
  //   conflation（原始计数 vs 发生率）轴不同，money_illusion 对探针攻击句实测
  //   零命中证明射程不重叠。
  { key: 'stock_flow_conflation',            mod: './stock-flow-conflation.js',      fn: 'detectStockFlowConflation',  zh: '存量-流量混淆',               en: 'stock-flow conflation (level-rate confusion)', round: 'r374' },
];

const _cache = new Map();
function _detector(fam) {
  if (_cache.has(fam.key)) return _cache.get(fam.key);
  let fn = null;
  try {
    // require 相对本模块文件解析（__dirname），不依赖进程 cwd。
    const mod = require(path.join(__dirname, fam.mod));
    fn = typeof mod[fam.fn] === 'function' ? mod[fam.fn] : null;
  } catch (_) { fn = null; }
  _cache.set(fam.key, fn);
  return fn;
}

// 顶层防御：模块 load 失败（语法错/缺文件）时不能拖垮 gate。
function _safeDetect(fam, text, inject) {
  const fn = _detector(fam);
  if (!fn) return null;
  try { return fn(text, inject); } catch (_) { return null; }
}

/**
 * 对一段文本跑 29 族经济学/统计推理检测，聚合为 gate 可用的单一维度结果。
 *
 * @param {string} text 待检测文本（gate 路径的 _normText）
 * @param {{inject?: object}} [opts] inject — 负例注入口（轮测注入删条用）
 * @returns {{hit:boolean, score:number, count:number, families:Array,
 *            details:string, guidance:string, detail:string}}
 */
function checkEconReasoningGate(text, opts) {
  const empty = { hit: false, score: 0, count: 0, families: [], details: '', guidance: '' };
  if (!text || typeof text !== 'string' || text.length < 6) return empty;
  const inject = opts && opts.inject ? opts.inject : null;

  const families = [];
  let totalScore = 0;
  let totalCount = 0;

  for (const fam of FAMILIES) {
    const r = _safeDetect(fam, text, inject);
    if (!r || !r.hit) continue;
    const score = typeof r.score === 'number' && r.score > 0 ? r.score : 0.5;
    const count = typeof r.count === 'number' && r.count > 0 ? r.count : 1;
    families.push({
      key: fam.key,
      zh: fam.zh,
      en: fam.en,
      round: fam.round,
      score,
      count,
      details: r.details || r.detail || '',
      guidance: typeof r.guidance === 'string' ? r.guidance : '',
    });
    totalScore += score;
    totalCount += count;
  }

  if (families.length === 0) return empty;

  // 多族共现时分数不线性叠加到 >1：取 max 再按族数小幅加成（上限 0.85，
  // 与插件层 score>0.6=high 的口径兼容，同时保证 verify 而非 rewrite）。
  const maxScore = Math.max(...families.map(f => f.score));
  const multiBonus = Math.min(0.15, (families.length - 1) * 0.05);
  const score = Math.min(0.85, Math.round((maxScore + multiBonus) * 1000) / 1000);

  const labels = families.map(f => f.zh).join('、');
  return {
    hit: true,
    score,
    count: totalCount,
    families,
    details: `经济学/统计推理误用(${totalCount}处: ${labels})`,
    detail: `经济学/统计推理误用(${totalCount}处: ${labels})`,
    guidance: '按命中子族修正概念误用：' + families
      .slice(0, 3)
      .map(f => `${f.zh}——${f.guidance || '把概念与其适用条件对齐后再下断言'}`)
      .join('；') + '。不得在概念误用未说明的情况下直接给出经济/统计结论',
  };
}

module.exports = {
  checkEconReasoningGate,
  FAMILIES,
};
