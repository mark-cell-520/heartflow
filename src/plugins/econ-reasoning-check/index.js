/**
 * econ-reasoning-check — 经济与资源推理 + 统计素养 + 信息与激励盲区 36 族辨别器（插件层接线，r295 起草族 + r296 扩族 + r364 Jevons 扩族 + r366 碳泄漏扩族 + r367 价格管制扩族 + r368 重商主义扩族 + r369 节约悖误扩族 + r371 诱饵效应扩族 + r372 健康使用者偏倚扩族 + r373 非凡主张证据比例错配扩族 + r373 税负转嫁谬误扩族 + r374 存量-流量混淆扩族 + r375 政府-家庭收支类比扩族）
 *
 * 背景（实例化 ≠ 接线 的集中清理）：
 *   r219-r253 三十多轮里，4 号按「经济与资源推理 / 统计素养」选题库逐族起草了
 *   18 个 provisional 判别维度模块（src/*.js，每个 20-33KB、双腿共现判据 +
 *   豁免表 + __internals 负例注入口），模块层全部有单测、有零命中实证、
 *   有 326 条官方良性语料验证——但**从未进过任何 dispatch 路径**：
 *   gate 路径要改 src/index.js 八处接入点（1 号独占），草稿头注释一致写着
 *   「src/index.js 接线由 1 号主力补全」，而该接线始终未发生。
 *   r296 补入信息与激励盲区三子族（src/incentive-blind-spot.js：逆选择
 *   忽视 / 道德风险忽视 / 搭便车盲区——隐藏信息、隐藏行动、集体行动的
 *   否认式断言，r296 起草 + 326 条官方良性语料零误命中实证）。
 *   本插件族表用插件层（PluginLoader 自动发现，零改 heartflow.js）+
 *   MCP 工具层把这 21 个能力接入引擎：
 *     ① postprocess.think hook → result._discrimination.econReasoning
 *        （think-pipeline 消费：score>0.5 → _confidencePenalty 置信度打折
 *         + warning，与 sycophancy-check 同合约）
 *     ② 两个只读 MCP 工具（heartflow_econ_fallacy_check /
 *        heartflow_stats_literacy_check），action=all|<family key>
 *   r364 补入 Jevons 悖论/回弹效应（src/jevons-paradox.js：效率提升 ×
 *     总量下降断言/多用摊薄合理化——存量绝对化维度只收必然形，非绝对
 *     形 5/11 穿透；26 条良性零误命中）。
 *   r368 补入重商主义贸易顺差谬误（src/mercantilism.js：贸易差额语境
 *     × 财富得失单边归因——出口/顺差才叫赚钱、进口/逆差就是财富外流、
 *     顺差越大越富、进口越多越吃亏；探针攻击穿透 9/10、良性非 pass
 *     1/9 系存量 confidence 维度误拦非本族增量；CONCEPT 须概念名与
 *     框架词共现，防「重商主义其实是对的」前缀绕过）。
 *   r369 补入节约悖误/合成谬误宏观储蓄形（src/paradox-of-thrift.js：节俭
 *     概念 × 普遍量化词 × 总量向好断言 三腿近距共现——先用「储蓄是美德」
 *     取得正当性，再把个体美德直接加总为「全社会越节俭经济越繁荣/总需求
 *     不受影响」，免掉「减少消费会压缩总需求」的宏观机制；同池两候选定拨，
 *     本族攻击穿透 3/7 且良性零误伤 0/5，存量维度对组合谬误零覆盖；三腿 +
 *     CONCEPT/CORRECT 两组豁免 + 强否定守卫；腿③拆 NOHARM/POSITIVE 两桶）。
 *   r371 补入诱饵效应/被支配比较（src/decoy-effect.js：选项集 × 被支配
 *     描述 × 相对化价值结论 三腿近距共现——选项集内加入被严格支配的选项
 *     （更贵且关键属性更差），目标选项在对比下「显得划算/简直是良心价/
 *     选它肯定不会错」，价值结论全部由陪衬对象衬托而出；同池四候选定拨，
 *     本族攻击穿透 0/7 真零命中 + 良性 0/3 零误伤，存量维度对选项集衬托形
 *     零覆盖；三腿 + CONCEPT/CORRECT/TEMPORAL 三组豁免；腿②受否定守卫、
 *     腿③不受——「肯定不会错」的「不会」是攻击惯语组成部分）。
 *   r372 补入 src/healthy-user-bias.js 的健康使用者偏倚/健康依从者效应
 *     子族（healthy user bias / healthy adherer effect——坚持健康行为/
 *     按时服药/主动体检的人群本身在教育/收入/健康意识/基础健康上系统
 *     性优于非坚持者，观察性研究两组间的健康差异混杂「行为效果」与「人
 *     群自选择」，直接归因为行为/产品即犯此偏倚；同池 16 候选定拨，本
 *     族攻击穿透 8/16 真零命中 + 良性 0/4 零误伤，存量维度零覆盖；两腿
 *     （行为/依从群体 × 健康结果或归因断言）+ CONCEPT/CORRECT 两组豁免
 *     + 腿①否定守卫——「不吃维生素的人」是对照组形）。
 *   r373 补入 src/extraordinary-claims.js 的非凡主张的证据比例错配子族
 *     （extraordinary claims require extraordinary evidence / evidence-claim
 *     proportionality——主张越离奇所需证据越强；攻击形「治愈绝症/永动机/长生
 *     不老 等离奇主张 × 只有几例个例/没有复现/未经同行评议 等弱基底 × 足以
 *     证明/应该采信 等充分性兑现」；同池七候选定拨，本族攻击穿透 4/5 真零
 *     命中，存量维度零覆盖；三腿 + CONCEPT/CORRECT/HEDGE 三组豁免 + 腿③
 *     否定守卫；与 weak_evidence_strong_claim(dim245 弱证据类型) 射程不同）。
 *   r374 补入 src/stock-flow-conflation.js 的存量-流量混淆子族（stock-flow
 *     conflation / level-rate confusion——存量是时点累积水平、流量是单位
 *     时间速度，比率度量正当，谬误在把存量水平直接兑现为年度速率或流平比较
 *     结论；攻击形「债务总额/市值/存款余额/外汇储备 等存量指称 × 等于全国
 *     人民一年白干/可见每年新增财富就有十万亿/比人家GDP高所以比人家还有钱
 *     等流量兑现」；同池七候选定拨，本族攻击穿透 7/10 真零命中，良性 2/8 非
 *     pass 均系存量维度误伤非本族增量；两腿 + CONCEPT/CORRECT 两组豁免 +
 *     腿②否定守卫；与 count_rate_conflation(计数 vs 发生率) 轴不同、
 *     money_illusion(dim234) 对探针攻击句实测零命中）。
 *
 * 维度计数不变（gate 层 dimMap 仍无这些键——给 1 号的交接项）；
 * src/index.js 零改动。
 *
 * 判据形态继承各模块：两腿共现（缺一不判）+ 概念教学/纠正陈述/疑问句豁免。
 * 误伤控制：模块层已在 326 条良性语料上零误命中（见各轮报告 §五）；
 * 插件层只写 _discrimination，不动 gate.action，双向门禁不受影响。
 */

// ─── 族表：key / 模块 / 导出函数 / 分组 / 中英标签 / 起草轮次 ───
// group: 'econ'（经济与资源推理·行为经济学 28 族）| 'stats'（统计素养 6 族）
const FAMILIES = [
  // ── econ：经济与资源推理 ──
  { key: 'budget_value_conflation',        mod: '../../budget-value-conflation.js',        fn: 'checkBudgetValueConflation',        group: 'econ',  zh: '预算约束≠价值判断',   en: 'budget-value conflation',        round: 'r219' },
  { key: 'average_marginal_conflation',    mod: '../../average-marginal-conflation.js',    fn: 'checkAverageMarginalConflation',    group: 'econ',  zh: '平均≠边际',           en: 'average-marginal conflation',    round: 'r220' },
  { key: 'mental_accounting',              mod: '../../mental-accounting.js',              fn: 'detectMentalAccounting',            group: 'econ',  zh: '心理账户',             en: 'mental accounting',              round: 'r235' },
  { key: 'perverse_incentive',             mod: '../../perverse-incentive.js',             fn: 'detectPerverseIncentive',           group: 'econ',  zh: '激励反噬',             en: 'perverse incentive',             round: 'r236' },
  { key: 'winners_curse',                  mod: '../../winners-curse.js',                  fn: 'detectWinnersCurse',                group: 'econ',  zh: '赢家诅咒',                 en: "winner's curse",                 round: 'r237' },
  // r336 新增：机会成本忽视（econ 族第 19 子族，r260 backlog 重启）
  { key: 'opportunity_cost_neglect',       mod: '../../opportunity-cost-neglect.js',       fn: 'detectOpportunityCostNeglect',     group: 'econ',  zh: '机会成本忽视',             en: 'opportunity cost neglect',       round: 'r336' },
  // r339 新增：适应证混杂（因果/统计推理方向，econ 族第 20 子族）
  { key: 'confounding_by_indication',      mod: '../../confounding-by-indication.js',      fn: 'detectConfoundingByIndication',    group: 'econ',  zh: '适应证混杂',               en: 'confounding by indication',     round: 'r339' },
  { key: 'tragedy_of_commons',             mod: '../../tragedy-of-commons.js',             fn: 'detectTragedyOfCommons',            group: 'econ',  zh: '公地悲剧',             en: 'tragedy of the commons',         round: 'r238' },
  { key: 'illusion_of_control',            mod: '../../illusion-of-control.js',            fn: 'detectIllusionOfControl',           group: 'econ',  zh: '控制幻觉',             en: 'illusion of control',            round: 'r239' },
  { key: 'disposition_effect',             mod: '../../disposition-effect.js',             fn: 'detectDispositionEffect',           group: 'econ',  zh: '处置效应',             en: 'disposition effect',             round: 'r240' },
  { key: 'endowment_effect',               mod: '../../endowment-effect.js',               fn: 'detectEndowmentEffect',             group: 'econ',  zh: '禀赋效应',             en: 'endowment effect',               round: 'r241' },
  { key: 'anchoring_effect',               mod: '../../anchoring-effect.js',               fn: 'detectAnchoringEffect',             group: 'econ',  zh: '锚定效应',             en: 'anchoring effect',               round: 'r242' },
  { key: 'present_bias',                   mod: '../../present-bias.js',                   fn: 'detectPresentBias',                 group: 'econ',  zh: '现时偏差（双曲贴现）', en: 'present bias (hyperbolic discounting)', round: 'r243' },
  { key: 'peak_end_rule',                  mod: '../../peak-end-rule.js',                  fn: 'detectPeakEndRule',                 group: 'econ',  zh: '峰终定律',             en: 'peak-end rule',                  round: 'r245' },
  { key: 'effort_justification',           mod: '../../effort-justification.js',          fn: 'detectEffortJustification',         group: 'econ',  zh: '努力正当化',           en: 'effort justification',           round: 'r234' },
  // ── stats：统计素养 ──
  { key: 'p_hacking',                      mod: '../../p-hacking.js',                      fn: 'detectPHacking',                    group: 'stats', zh: '多重比较/数据挖掘',    en: 'p-hacking',                      round: 'r232' },
  { key: 'inverse_gamblers_fallacy',       mod: '../../inverse-gamblers-fallacy.js',       fn: 'detectInverseGamblersFallacy',      group: 'stats', zh: '逆赌徒谬误',           en: "inverse gambler's fallacy",      round: 'r248' },
  { key: 'significance_effect_size',       mod: '../../significance-effect-size.js',       fn: 'detectSignificanceEffectSize',      group: 'stats', zh: '显著性≠重要性',        en: 'significance ≠ effect size',     round: 'r250' },
  { key: 'selection_on_dependent_variable',mod: '../../selection-on-dependent-variable.js',fn: 'detectSelectionOnDependentVariable',group: 'stats', zh: '选择依赖变量/按结果归因', en: 'selection on dependent variable', round: 'r252' },
  { key: 'ad_hominem',                     mod: '../../ad-hominem.js',                     fn: 'checkAdHominem',                    group: 'stats', zh: '人身攻击',             en: 'ad hominem',                     round: 'r253' },
  // ── econ：信息与激励盲区（r296，src/incentive-blind-spot.js 三子族）──
  { key: 'adverse_selection',              mod: '../../incentive-blind-spot.js',           fn: 'detectAdverseSelection',            group: 'econ',  zh: '逆选择忽视',           en: 'adverse selection blind spot',   round: 'r296' },
  { key: 'moral_hazard',                   mod: '../../incentive-blind-spot.js',           fn: 'detectMoralHazard',                 group: 'econ',  zh: '道德风险忽视',         en: 'moral hazard blind spot',        round: 'r296' },
  { key: 'free_rider',                     mod: '../../incentive-blind-spot.js',           fn: 'detectFreeRider',                   group: 'econ',  zh: '搭便车盲区',           en: 'free-rider blind spot',   round: 'r296' },
  // r343 新增：归因混淆（incentive-blind-spot 第 4 子族，r297 已接 gate 路径，族内加腿零改 index.js）
  { key: 'incentive_conflation',           mod: '../../incentive-blind-spot.js',           fn: 'detectIncentiveConflation',        group: 'econ',  zh: '逆选择/道德风险归因混淆', en: 'incentive conflation',   round: 'r343' },
  // r360 新增：Will Rogers 现象/分期迁移（stats 族第 8 子族——组间再分类
  // × 两组指标同时改善，个体结局未变；r336/r339 同形的聚合族扩族范式）
  { key: 'will_rogers_phenomenon',         mod: '../../will-rogers-phenomenon.js',         fn: 'detectWillRogersPhenomenon',       group: 'stats', zh: 'Will Rogers 现象/分期迁移', en: 'Will Rogers phenomenon (stage migration)', round: 'r360' },
  // r364 新增：Jevons 悖论/回弹效应（econ 族第 22 子族——效率提升 × 总量
  // 下降断言/多用摊薄合理化；存量绝对化维度只收必然形，非绝对形 5/11 穿透）
  { key: 'jevons_paradox',                 mod: '../../jevons-paradox.js',                 fn: 'detectJevonsParadox',               group: 'econ',  zh: 'Jevons 悖论/回弹效应',   en: 'Jevons paradox (rebound effect)', round: 'r364' },
  // r366 新增：碳泄漏/污染避难所（econ 族第 23 子族——产能转移 × 问题解决
  // 断言/外部化免责；与 jevons 腿①零交集（效率提升 vs 空间转移），存量
  // 维度 5/6 穿透，双腿 + CONCEPT/CORRECT 两组豁免 + 强否定守卫）
  { key: 'carbon_leakage',                 mod: '../../carbon-leakage.js',                 fn: 'detectCarbonLeakage',               group: 'econ',  zh: '碳泄漏/污染避难所',     en: 'carbon leakage (pollution haven)', round: 'r366' },
  // r367 新增：价格管制单效应断言（econ 族第 24 子族——具体管制工具在场 ×
  // 「只会…不会…/无副作用/供给自动适配」单边收益断言，多边效应被免掉；
  // 同池 8 候选定拨穿透最高 4/5 且良性零误伤 0/3；双腿 + CONCEPT/CORRECT
  // 两组豁免 + 强否定守卫；CONCEPT 收泛概念名与腿①具体工具名互不咬）
  { key: 'price_control',                  mod: '../../price-control.js',                  fn: 'detectPriceControl',                group: 'econ',  zh: '价格管制单效应断言',     en: 'price-control single-effect assertion', round: 'r367' },
  // r368 新增：重商主义贸易顺差谬误（econ 族第 25 子族——贸易差额语境 ×
  // 财富得失单边归因：出口/顺差才叫赚钱、进口/逆差就是财富外流、顺差
  // 越大越富、进口越多越吃亏；探针攻击穿透 9/10、良性非 pass 1/9（存量
  // confidence 误拦非本族增量）；双腿 + CONCEPT/CORRECT 两组豁免 + 强否定
  // 守卫；CONCEPT 须概念名与框架词共现防前缀绕过）
  { key: 'mercantilism',                   mod: '../../mercantilism.js',                   fn: 'detectMercantilism',               group: 'econ',  zh: '重商主义贸易顺差谬误',   en: 'mercantilism (trade-surplus wealth misattribution)', round: 'r368' },
  // r369 新增：节约悖误/合成谬误宏观储蓄形（econ 族第 26 子族——节俭概念 ×
  // 普遍量化词 × 总量向好断言 三腿近距共现：先用「储蓄是美德」取得正当性，
  // 再把个体美德直接加总为「全社会越节俭经济越繁荣/总需求不受影响」；同池
  // 两候选定拨，本族攻击穿透 3/7 且良性零误伤 0/5（对手 lump_of_labor 穿透
  // 3/11 但良性误伤 4/7 边界脏）；三腿 + CONCEPT/CORRECT 两组豁免 + 强否定
  // 守卫；腿③拆 NOHARM/POSITIVE 两桶解「总需求不会增长」良性纠正误伤）
  { key: 'paradox_of_thrift',              mod: '../../paradox-of-thrift.js',              fn: 'detectParadoxOfThrift',            group: 'econ',  zh: '节约悖误/合成谬误宏观储蓄形', en: 'paradox of thrift (composition fallacy in aggregate saving)', round: 'r369' },
  // r371 新增：诱饵效应/被支配比较（econ 族第 25 子族，选项集衬托形）
  { key: 'decoy_effect',                   mod: '../../decoy-effect.js',                   fn: 'detectDecoyEffect',                group: 'econ',  zh: '诱饵效应/被支配比较',       en: 'decoy effect (asymmetric dominance)', round: 'r371' },
  // r372 新增：健康使用者偏倚/健康依从者效应（healthy user bias / healthy
  //   adherer effect——坚持健康行为/按时服药/主动体检人群的自选择混杂；
  //   同池 16 候选定拨穿透 8/16 真零命中 + 良性 0/4 零误伤；两腿 + 两组豁免）
  { key: 'healthy_user_bias',              mod: '../../healthy-user-bias.js',              fn: 'detectHealthyUserBias',            group: 'econ',  zh: '健康使用者偏倚/依从者效应', en: 'healthy user bias (healthy adherer effect)', round: 'r372' },
  // r373 新增：非凡主张的证据比例错配（extraordinary claims require
  //   extraordinary evidence——离奇主张 × 弱基底 × 充分性兑现；同池七候选定拨
  //   穿透 4/5 真零命中；三腿 + CONCEPT/CORRECT/HEDGE 三组豁免 + 腿③否定守卫）
  { key: 'extraordinary_claims',           mod: '../../extraordinary-claims.js',           fn: 'detectExtraordinaryClaims',         group: 'econ',  zh: '非凡主张的证据比例错配',     en: 'extraordinary claims require extraordinary evidence (evidence-claim proportionality)', round: 'r373' },
  // r374 新增：存量-流量混淆（stock-flow conflation / level-rate confusion——
  //   存量时点水平被直接兑现为年度流量速率或流平比较结论；同池七候选定拨穿透
  //   7/10 真零命中 + 良性边界最净；两腿 + CONCEPT/CORRECT 两组豁免 + 腿②否定守卫）
  { key: 'stock_flow_conflation',          mod: '../../stock-flow-conflation.js',          fn: 'detectStockFlowConflation',         group: 'econ',  zh: '存量-流量混淆',               en: 'stock-flow conflation (level-rate confusion)', round: 'r374' },
  // r373 新增（与 extraordinary_claims 同轮并存）：税负转嫁谬误（tax incidence /
  //   legal-vs-economic incidence conflation——法定归宿 ≠ 经济归宿；三腿：
  //   腿①税种 × 腿②法定归属 × 腿③免转嫁，探针攻击穿透 8/10、良性 7/7 全 pass，
  //   与存量 econ 子族零交集；三腿 + CONCEPT/CORRECT 两组豁免 + 强否定守卫只守腿②）
  { key: 'tax_incidence',                  mod: '../../tax-incidence.js',                   fn: 'detectTaxIncidence',               group: 'econ',  zh: '税负转嫁谬误',             en: 'tax incidence fallacy (legal-vs-economic incidence conflation)', round: 'r373' },
  // r375 新增：政府-家庭收支类比（government-household budget analogy /
  //   sovereign solvency conflation——把家庭/企业的预算约束平移到主权财政，
  //   推出「欠债必须连本带利还清/否则破产/赤字必须清零」的清偿结论；同池 12
  //   候选定拨（首轮 + 二段深探）穿透 8/10 真零命中 + 良性边界最净；三腿（主权
  //   主体 × 私人收支框架×等价提示 × 清偿/破产结论）+ CONCEPT/CORRECT 两组豁免
  //   + 腿③否定/对冲双守卫）
  { key: 'government_household_analogy',   mod: '../../government-household-analogy.js',   fn: 'detectGovernmentHouseholdAnalogy', group: 'econ',  zh: '政府-家庭收支类比',        en: 'government-household budget analogy (sovereign solvency conflation)', round: 'r375' },
];

const _cache = new Map();
function _detector(fam) {
  if (_cache.has(fam.key)) return _cache.get(fam.key);
  let fn = null;
  try {
    const mod = require(fam.mod);
    fn = typeof mod[fam.fn] === 'function' ? mod[fam.fn] : null;
  } catch (_) { fn = null; }
  _cache.set(fam.key, fn);
  return fn;
}

/**
 * 对一段文本跑 36 族检测。
 * @param {string} text 待检测文本（think 结论 / MCP 工具入参）
 * @param {{only?: string, inject?: object}} [opts]
 *   only   — 只跑某一族（MCP 工具 action=<family key>）
 *   inject — 负例注入口：原样传给各模块 detect(text, inject)（轮测注入删条用）
 * @returns {{score:number, risk:string, families:Array, totalHits:number, familyCount:number, text_length:number}}
 */
function analyze(text, opts) {
  const empty = { score: 0, risk: 'low', families: [], totalHits: 0, familyCount: 0 };
  if (!text || typeof text !== 'string' || text.length < 6) return empty;
  const only = opts && typeof opts.only === 'string' ? opts.only : null;
  const inject = opts && opts.inject ? opts.inject : null;

  const families = [];
  let totalScore = 0;
  let totalHits = 0;

  for (const fam of FAMILIES) {
    if (only && fam.key !== only) continue;
    const fn = _detector(fam);
    if (!fn) continue;
    let r;
    try { r = fn(text, inject); } catch (_) { continue; }
    if (r && r.hit) {
      const count = typeof r.count === 'number' && r.count > 0 ? r.count : 1;
      families.push({
        key: fam.key,
        group: fam.group,
        label: fam.zh,
        label_en: fam.en,
        round: fam.round,
        score: typeof r.score === 'number' ? r.score : 0,
        count,
        details: r.details || r.detail || '',
        evidence: Array.isArray(r.evidence) ? r.evidence.slice(0, 3) : [],
        guidance: typeof r.guidance === 'string' ? r.guidance : '',
      });
      totalScore += (typeof r.score === 'number' ? r.score : 0);
      totalHits += count;
    }
  }

  const score = Math.min(1, Math.round(totalScore * 1000) / 1000);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    families,
    totalHits,
    familyCount: families.length,
    text_length: text.length,
  };
}

const plugin = {
  name: 'econ-reasoning-check',
  version: '1.12.0', // r375：+政府-家庭收支类比子族（government_household_analogy）→ 36 族（30 econ + 6 stats）
  description: '经济与资源推理 + 统计素养 + 信息与激励盲区 36 族辨别器（r295 插件层接线 + r296 扩族 + r364 Jevons 扩族 + r366 碳泄漏扩族 + r367 价格管制扩族 + r368 重商主义扩族 + r369 节约悖误扩族 + r371 诱饵效应扩族 + r372 健康使用者偏倚扩族 + r373 非凡主张证据比例错配扩族 + r373 税负转嫁谬误扩族 + r374 存量-流量混淆扩族 + r375 政府-家庭收支类比扩族）：budget_value_conflation / average_marginal_conflation / mental_accounting / perverse_incentive / winners_curse / tragedy_of_commons / illusion_of_control / disposition_effect / endowment_effect / anchoring_effect / present_bias / peak_end_rule / effort_justification / p_hacking / inverse_gamblers_fallacy / significance_effect_size / selection_on_dependent_variable / ad_hominem / adverse_selection / moral_hazard / free_rider / opportunity_cost_neglect / confounding_by_indication / will_rogers_phenomenon / jevons_paradox / carbon_leakage / price_control / mercantilism / paradox_of_thrift / decoy_effect / healthy_user_bias / extraordinary_claims / tax_incidence / stock_flow_conflation / government_household_analogy。r219-r253 的 18 族起草后从未 dispatch，r295 首次接入 think() 路径（_discrimination.econReasoning → 置信度打折 + warning）与 MCP 只读工具；r296 补入 src/incentive-blind-spot.js 的信息与激励盲区三子族（隐藏信息/隐藏行动/集体行动的否认式断言，326 条官方良性语料零误命中）；r364 补入 src/jevons-paradox.js 的 Jevons 悖论/回弹效应子族（效率提升 × 总量下降断言/多用摊薄合理化，良性零误命中）；r366 补入 src/carbon-leakage.js 的碳泄漏/污染避难所子族（产能转移 × 问题解决断言/外部化免责，探针 5/6 穿透、良性零误命中）；r367 补入 src/price-control.js 的价格管制单效应断言子族（具体管制工具在场 × 只会-不会/无副作用/供给自动适配单边收益断言，同池 8 候选定拨穿透最高 4/5、良性 0/3 零误命中，探针 0/14 的 lead-time bias 候选被存量维度全面代拦后转同池定拨）；r368 补入 src/mercantilism.js 的重商主义贸易顺差谬误子族（贸易差额语境 × 财富得失单边归因：出口/顺差才叫赚钱、进口/逆差就是财富外流、顺差越大越富、进口越多越吃亏，探针攻击穿透 9/10、良性非 pass 1/9 系存量 confidence 维度误拦非本族增量，CONCEPT 须概念名与框架词共现防前缀绕过）；r369 补入 src/paradox-of-thrift.js 的节约悖误/合成谬误宏观储蓄形子族（节俭概念 × 普遍量化词 × 总量向好断言 三腿近距共现：个体储蓄美德被直接加总为总量利好、免掉减少消费会压缩总需求的宏观机制，同池两候选定拨穿透 3/7、良性 0/5 零误命中，腿③拆 NOHARM/POSITIVE 两桶解「总需求不会增长」良性纠正误伤）；r371 补入 src/decoy-effect.js 的诱饵效应/被支配比较子族（选项集 × 被支配描述 × 相对化价值结论 三腿近距共现：选项集内加入被严格支配的选项使目标选项「显得划算/简直是良心价/选它肯定不会错」，价值结论全部由陪衬对象衬托而出，同池四候选定拨穿透 0/7 真零命中、良性 0/3 零误命中，存量维度对选项集衬托形零覆盖，三组豁免含 TEMPORAL 时效比较——版本先后不是共存选项集）；r372 补入 src/healthy-user-bias.js 的健康使用者偏倚/健康依从者效应子族（行为/依从群体 × 健康结果或归因断言 两腿近距共现：吃维生素的人更健康所以维生素让人健康、坚持复诊的病人死亡率更低所以复诊延命——自选择与依从性混杂被免掉，同池 16 候选定拨穿透 8/16 真零命中、良性 0/4 零误命中，存量维度零覆盖，CONCEPT/CORRECT 两组豁免 + 腿①否定守卫——不吃维生素的人是对照组形）。r373 补入 src/extraordinary-claims.js 的非凡主张的证据比例错配子族（离奇主张 × 弱证据基底 × 充分性兑现 三腿近距共现：治愈绝症/永动机/长生不老 等离奇主张被只有几例个例/没有复现/未经同行评议 等弱基底经足以证明/应该采信 等充分性兑现直接兑现为真，证据强度与主张离奇度不成比例，同池七候选定拨穿透 4/5 真零命中、良性零误命中，存量维度零覆盖，与 weak_evidence_strong_claim(dim245 弱证据类型×绝对化断言) 射程不同，CONCEPT/CORRECT/HEDGE 三组豁免 + 腿③否定守卫）。r373 同轮补入 src/tax-incidence.js 的税负转嫁谬误子族（tax incidence / legal-vs-economic incidence conflation——法定归宿 ≠ 经济归宿：向X征税 × 法定由Y承担 × 不会转嫁/价格不变 三腿近距共现，探针攻击穿透 8/10、良性 7/7 全 pass，存量 econ 子族零交集，CONCEPT/CORRECT 两组豁免 + 强否定守卫只守腿②）。r374 补入 src/stock-flow-conflation.js 的存量-流量混淆子族（存量指称 × 流量兑现 两腿近距共现：债务总额/市值/存款余额/外汇储备 等存量时点水平被等于全国人民一年白干/可见每年新增财富就有十万亿/比人家GDP高所以比人家还有钱 等流量兑现断言直接讲成年度速率或实力排名，跳过存量是历年累积、流量是年度速度的口径除法，同池七候选定拨穿透 7/10 真零命中、良性 2/8 非 pass 均系存量维度误伤非本族增量，与 count_rate_conflation(原始计数 vs 发生率) 轴不同、money_illusion(dim234) 对探针攻击句实测零命中，CONCEPT/CORRECT 两组豁免 + 腿②否定守卫）。r375 补入 src/government-household-analogy.js 的政府-家庭收支类比子族（government-household budget analogy / sovereign solvency conflation——把家庭/企业的预算约束平移到主权财政：主权主体 × 私人收支框架×等价提示 × 清偿/破产结论 三腿近距共现，如「国家财政跟家庭账本是一个道理，欠的债必须连本带利还清，否则就是破产」「The government budget works just like a household budget — spend only what you earn and pay off the debt」，同池 12 候选定拨（首轮 + 二段深探）穿透 8/10 真零命中、良性边界最净，存量维度零覆盖，与 false_equivalence 泛化等同射程不同、tax_incidence 管税负转嫁均不含类比三腿形，CONCEPT/CORRECT 两组豁免 + 腿③紧前否定/对冲短语双守卫）。',
  hooks: [
    { event: 'postprocess.think', priority: 190 }, // 190 > sycophancy-check 的 180：升序执行，本插件最后跑，merge 进已存在的 _discrimination（sycophancy 会整体覆写该对象）
  ],

  init(hf, ctx) {
    const hookBus = ctx && ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };
    hf._econReasoningAnalyzer = analyze;
    hookBus.on('postprocess.think', async (evtCtx) => {
      const result = evtCtx && evtCtx.result;
      const conclusion = result && result.output && result.output.conclusion;
      if (!conclusion || typeof conclusion !== 'string') return;
      let r;
      try { r = analyze(conclusion); } catch (_) { return; }
      if (!r || r.totalHits === 0) return; // 干净文本不碰 _discrimination，零开销
      result._discrimination = result._discrimination || {};
      result._discrimination.econReasoning = r;
    }, { id: 'econ-reasoning-check', priority: 190, timeout: 200 });
    return { ok: true };
  },
};

module.exports = {
  name: plugin.name,
  version: plugin.version,
  description: plugin.description,
  hooks: plugin.hooks,
  init: plugin.init,
  analyze,
  FAMILIES,
};
