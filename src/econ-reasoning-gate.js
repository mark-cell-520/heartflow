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
  // r373 新增（agent-4 tax_incidence 线，与 extraordinary_claims 同轮并存）：
  //   税负转嫁谬误（tax incidence / legal-vs-economic incidence conflation
  //   ——法律规定的纳税人（法定归宿）与实际承担福利损失的人（经济归宿）
  //   在供需弹性不为无穷时通常不一致；攻击形「向X 征税 → 不会转嫁/价格
  //   不会变/别人不受影响/全部由法定纳税人消化」，与存量 econ 子族零交集
  //   （price_control 管价格管制、mercantilism 管贸易差额，均不含税种×
  //   法定归属×免转嫁三腿形），探针攻击穿透 8/10、良性 7/7 全 pass；三腿
  //   + CONCEPT/CORRECT 两组豁免 + 强否定守卫（只守腿②，「并非由企业承担」
  //   是纠正形；腿③不受守——「不会转嫁」的「不会」是攻击惯语组成部分，
  //   r369 NOHARM 同款设计）。
  { key: 'tax_incidence',                 mod: './tax-incidence.js',               fn: 'detectTaxIncidence',          zh: '税负转嫁谬误',               en: 'tax incidence fallacy (legal-vs-economic incidence conflation)', round: 'r373' },
  // r375 新增：政府-家庭收支类比（government-household budget analogy /
  //   sovereign solvency conflation——把家庭/企业的预算约束平移到主权财政，
  //   推出「欠债必须连本带利还清/否则破产/赤字必须清零」的清偿结论；同池 12
  //   候选定拨（首轮 + 二段深探）穿透 8/10 真零命中 + 良性边界最净；三腿（主权
  //   主体 × 私人收支框架×等价提示 × 清偿/破产结论）+ CONCEPT/CORRECT 两组豁免
  //   + 腿③否定/对冲双守卫；与存量 false_equivalence 泛化等同射程不同，
  //   tax_incidence 管税负转嫁、price_control 管价格管制均不含类比三腿形）。
  { key: 'government_household_analogy',  mod: './government-household-analogy.js', fn: 'detectGovernmentHouseholdAnalogy', zh: '政府-家庭收支类比',        en: 'government-household budget analogy (sovereign solvency conflation)', round: 'r375' },
  // r376 新增：存款创造贷款误解（deposit-creation reversal / loans-come-from-
  //   deposits causal inversion——把放贷说成动用储户存款、把信贷说成受存款
  //   约束、把货币创造说成货币搬移，跳过贷款创造存款的机制；同池 12 候选定拨
  //   （probe-r376-pool.js + probe-r376-scope.js）二段深探穿透 8/10 真零命中 +
  //   良性 8 条仅 1 条非 pass（存量 confidence 误伤非本族增量），r374 记录的
  //   「与 money_illusion 射程相邻」顾虑被本轮证伪（两族攻击集零交集）；
  //   双腿（存贷机制在场 × 倒置归源/约束断言 12+12 形）+ CONCEPT/CORRECT 两组
  //   豁免 + 腿②紧前否定/对冲双守卫）。
  { key: 'money_creation',                 mod: './money-creation.js',                 fn: 'detectMoneyCreation',                 zh: '存款创造贷款误解',        en: 'deposit-creation reversal (loans-come-from-deposits inversion)', round: 'r376' },
  // r377 新增：税率-税收线性误读（linear tax-revenue assumption / tax-base
  //   elasticity neglect——把税率变动按固定比例折算成财政收入变动，跳过税基
  //   对税率的反应；同池 12 候选定拨（probe-r377-pool.js + probe-r377-scope.js）
  //   二段深探穿透 7/10 真零命中 + 良性边界最净（2/10 非 pass 均系存量
  //   monocausal_attribution/pseudo_causal 误伤非本族增量）；双腿（税率变动
  //   语境 ZH3+EN2 组 × 等比兑现断言 ZH4+EN3 形）+ CONCEPT/COND/CORRECT 三组
  //   豁免 + 腿②紧前否定/对冲双守卫；与 tax_incidence（法定归宿≠经济归宿）
  //   射程零交集——本族攻击句无归属/转嫁标记，tax_incidence 攻击句无比
  //   兑现标记）。
  { key: 'linear_tax_revenue',             mod: './linear-tax-revenue.js',             fn: 'detectLinearTaxRevenue',             zh: '税率-税收线性误读',        en: 'linear tax-revenue assumption (tax-base elasticity neglect)', round: 'r377' },
  // r378 新增：未理赔即亏误读（no-claim-is-loss misread / risk-transfer
  //   value neglect——把「没理赔」直接兑现为「亏损/白交」，跳过风险转移
  //   价值与保险定价机制；同池 12 候选定拨（probe-r378-pool.js + probe-
  //   r378-scope.js）二段深探穿透 7/10 真零命中（3/10 存量代拦：
  //   perfect_error / reverse_causation / pseudo_profundity，存量维度对
  //   未理赔即亏形零覆盖），良性 6 条仅 1 条非 pass（reasoning_coherence/
  //   contradiction 存量误伤非本族增量）；两腿（保险语境 ZH3 组 × 未用
  //   即亏断言 ZH3 形 + EN3 形）+ CONCEPT/CORRECT 两组豁免 + 腿②双守卫
  //   （P1 配对形改查两标记间隙否定——无理赔标记自身含「没」字会误杀
  //   配对，r378 实测修）；与 sunk_cost_coercion（已投入×放弃可耻）
  //   射程零交集、present_bias（月供摊薄贴现）轴不同、moral_hazard/
  //   adverse_selection（保险机制断言）不论个体回报叙事。
  { key: 'insurance_claim_loss',            mod: './insurance-claim-loss.js',            fn: 'detectInsuranceClaimLoss',            zh: '未理赔即亏误读',          en: 'no-claim-is-loss misread (risk-transfer value neglect)', round: 'r378' },
  // r379 新增：固定费率偏误（flat-rate bias / sunk-fee-driven overuse——
  //   预付/定额收费（包年/包月/年卡/会员/不限量/自助餐/订阅）激励用户为
  //   「摊薄」已付费用而过度使用，即便边际效用已为负（受伤还去健身房、
  //   难看也坐完全场、凌晨爬起来刷场次）。攻击形「会员包了年，不多看几场
  //   就把钱白瞎了，熬夜也得把场次刷完」「办了健身年卡就得天天去，一天
  //   不去就是浪费，哪怕练伤了也得去」「自助餐钱已经付了，不吃到撑就是
  //   傻，硬塞也得把本钱吃回来」；同池 12 候选定拨（probe-r379-pool.js 首
  //   轮 + probe-r379-scope.js 四候选深探）：本族深探穿透 9/10 真零命中
  //   （1/10 被 fallacy_of_relevance 代拦——存量维度对固定费率过度使用形
  //   零覆盖），良性 6 条中 2 条非 pass（hypostatization / contradiction
  //   存量维度误伤，非本族增量）；同池 B chesterton_fence 6/10 良性 0、
  //   I mcnamara_quantitative 8/10 良性 2（liberty_restriction 存量误伤）、
  //   K survival_rate_comparison 6/10 良性 0——本族为「最高穿透 × 良性
  //   边界可辩护 × econ 组射程最合」。两腿（固定费率语境 × 过度使用断言
  //   ZH 三形 + EN 三形）+ CONCEPT/CORRECT 两组豁免 + 腿②双守卫（O1 配对
  //   形查两标记间隙否定——使用不足标记自身常含「不」字）；与
  //   sunk_cost_coercion（已投入×放弃可耻）射程零交集、mental_accounting
  //   （按来源/用途分账户）不论使用强度、present_bias（月供摊薄贴现）轴
  //   不同、opportunity_cost_neglect（免费/零价）不论已付费用使用义务。
  //   单次票证（电影票/门票）不收——归 sunk_cost_coercion 射程。
  { key: 'flat_rate_bias',                   mod: './flat-rate-bias.js',                   fn: 'detectFlatRateBias',                   zh: '固定费率偏误',            en: 'flat-rate bias (sunk-fee-driven overuse)', round: 'r379' },
  // r381 新增：劳动总量谬误（lump of labor fallacy / fixed work-pool
  //   assumption——把就业总量讲成固定份额，移民/女性就业/自动化/延迟退休
  //   都被讲成零和挤占，跳过「成本下降扩张总需求、生产率重构而非消灭
  //   就业」的补偿机制；同池 13 候选首轮 + 四候选深探（probe-r381-pool.js
  //   + probe-r381-scope.js）穿透 8/10 真零命中、良性 7 条中 1 条非 pass
  //   （completion_evidence 存量误伤非本族增量），同池 E phillips_permanent
  //   7/10、B surrogate_endpoint 6/10、K diversification 5/8——本族为
  //   「最高穿透 × 良性边界可辩护 × econ 组射程最合」；双腿（劳动力市场
  //   语境 ZH+EN 组 × 固定份额断言 ZH 五形 + EN 四形）+ CONCEPT/CORRECT
  //   两组豁免 + 腿②紧前否定/对冲双守卫；与 zero_sum_fallacy（泛化零和
  //   断言无就业语境）射程零交集、hasty_generalization（样本外推）不论
  //   总量固定机制、具体裁员叙事无 F1-F5 标记天然不判。
  { key: 'lump_of_labor',                     mod: './lump-of-labor.js',                     fn: 'detectLumpOfLabor',                     zh: '劳动总量谬误',            en: 'lump of labor fallacy (fixed work-pool assumption)', round: 'r381' },
  // r385 新增：绝对优势≠比较优势误读（absolute-vs-comparative advantage
  //   confusion——把「一方在所有商品/任务上都更有效率」的绝对优势直接兑现
  //   为「贸易/分工/合作/外包没必要/无意义/不划算/只会吃亏」，跳过机会成本
  //   与比较优势机制；同池 probe-candidates.js：本族攻击穿透 6/8 真零命中、
  //   良性 2 条非 pass 均系存量维度误伤非本族增量；对手 moral_hazard 穿透
  //   1/5 已被代拦且良性 3/4 脏（淘汰）；双腿（绝对优势前提 ZH 五形 + EN 五形
  //   × 无贸易获益结论 ZH 四形 + EN 四形）+ CONCEPT/CORRECT 两组豁免 + 腿②
  //   紧前否定/对冲双守卫；与 mercantilism（贸易差额财富误读，不要求绝对优势
  //   前提）、zero_sum_fallacy（泛化零和断言）射程不重叠。
  { key: 'comparative_advantage',              mod: './comparative-advantage.js',              fn: 'detectComparativeAdvantage',            zh: '绝对优势≠比较优势',        en: 'absolute-vs-comparative advantage confusion', round: 'r385' },
  // r386 新增：效应量口径误读（effect-measure misinterpretation——把 OR 直接
  //   当成风险倍数读（OR 只在结局罕见时才近似 RR）、把 HR 直接当成累积生存/
  //   绝对差读（HR 是瞬时风险之比）；二段探针（scripts/round-386/
  //   probe-candidates2.js）OR≈RR 与 HR≈累积两族合计 5/10 真零命中（gate=pass），
  //   首段 8 个统计候选族 1/32 穿透被存量维度全面代拦后换轴定拨；双腿（口径锚
  //   OR/HR × 错误口径结论）+ 推断标记（并列实测发现不判）+ CONCEPT/CORRECT
  //   两组豁免 + 腿②紧前否定/对冲双守卫；与 relative_risk_individual_transfer
  //   （群体→个体平移）、significance_effect_size（显著性→重要性）、
  //   dose_response_linearity（剂量-反应线性化）射程不重叠。
  { key: 'effect_measure_misread',             mod: './effect-measure-misread.js',             fn: 'detectEffectMeasureMisread',            zh: '效应量口径误读',          en: 'effect-measure misread (OR-as-risk / HR-as-cumulative)', round: 'r386' },
  { key: 'significance_verdict_misread',       mod: './significance-verdict-misread.js',       fn: 'detectSignificanceVerdictMisread',      zh: '显著性裁定误读',          en: 'significance-verdict misread (borderline-as-effect / nonsignificant-as-no-effect)', round: 'r387' },
  // r388 新增（原 r387 stash 未落地产能，掉线恢复固化）：删失数据当完整结论
  //   （censoring neglect——随访窗口未结束锚 × 完整结论断言 两腿近距共现 +
  //   推断标记 + CONCEPT/COMPLETED 双豁免 + 腿②紧前否定/对冲双守卫；与
  //   significance_verdict_misread（显著性裁定）/effect_measure_misread（OR/HR
  //   口径）/survivor_time_bias（永生时间偏倚）射程不重叠）
  { key: 'censoring_neglect',                  mod: './censoring-neglect.js',                  fn: 'detectCensoringNeglect',                zh: '删失数据当完整结论',      en: 'censoring neglect (incomplete follow-up as final evidence)', round: 'r388' },
  // r389 新增（续统计素养轴，选题库轮换）：替代终点误读（surrogate endpoint
  //   misread / surrogate-to-hard-endpoint leap——中间指标改善锚 × 硬临床终点
  //   获益结论 两腿近距共现 + 推断标记跨区重叠 + CONCEPT/CORRECT 双豁免 +
  //   腿①方向词否定守卫/腿②紧前否定与对冲双守卫；同池探针两段穿透 24/45
  //   真零命中（一段 7/18 + 二段 17/27）为全场最高，良性 20 条零本族误伤，
  //   射程与 proxy_metric_goal（业务度量）/confounding_by_indication（治疗
  //   分配混杂）/healthy_user_bias（行为群体归因）/weak_evidence_strong_claim
  //   （弱证据类型）不重叠；海外扫描 GitHub 21 条命中全为替代终点评估统计
  //   包（surrosurv/Surrogate/Surrogacy-analysis，0-1 star，无可移植判据）、
  //   arXiv 15 条全为物理/ML 领域 surrogate model、S2 连续 429——按既有
  //   形态自建）
  { key: 'surrogate_endpoint_misread',         mod: './surrogate-endpoint-misread.js',         fn: 'detectSurrogateEndpointMisread',       zh: '替代终点误读',            en: 'surrogate-endpoint misread (surrogate marker improvement as hard-endpoint benefit)', round: 'r389' },
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
 * 对一段文本跑 38 族经济学/统计推理检测，聚合为 gate 可用的单一维度结果。
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
