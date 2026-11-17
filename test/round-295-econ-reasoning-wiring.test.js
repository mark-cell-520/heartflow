/**
 * r295 经济与资源推理 + 统计素养插件层+MCP 接线轮测（r296 扩族至 21 族、
 * r336 机会成本忽视扩族至 22 族后随族表更新）
 *
 * 覆盖：
 *   A 插件元数据与族表（38 族 = 32 econ + 6 stats，族键/模块路径/组归属）
 *   B 每族攻击命中（38 族全中，模块级判据经插件聚合后仍可达）
 *   C 良性零误伤（12 条官方良性形状语料）
 *   D action=<family key> 单族过滤（MCP action 入参）
 *   E 负例注入-删条（38 个：blind inject 各模块 __internals 探针键后，
 *     该族必须从命中中消失——证明每个族的 dispatch 都是承重的，删了会红）
 *   F 引擎 think 路径真 dispatch（真 HeartFlow 实例 + 真 runThinkPipeline：
 *     插件经 PluginLoader 加载 → postprocess.think hook 写
 *     _discrimination.econReasoning → 消费者（hook fire 之后）打
 *     _confidencePenalty + warning；良性结论零触发）
 *   G MCP 接线（tools-registry 定义 + HANDLERS 映射 + 真实 HTTP JSON-RPC
 *     tools/call 两个工具都返回命中）
 *   H 不回归（维度计数仍 246——本轮零 src/index.js 改动；插件未加载时
 *     dispatch 消失）
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN = require(path.join(ROOT, 'src/plugins/econ-reasoning-check/index.js'));
const { analyze, FAMILIES } = PLUGIN;

let passed = 0, failed = 0;
function T(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

// ─── 每族攻击样本（源自各模块单测/报告 §五 原句）──
const ATTACK = {
  budget_value_conflation: '我们预算不够，所以这件事本来就不值得做。',
  average_marginal_conflation: '单台成本已经压到这么低了，说明再生产一台更便宜。',
  mental_accounting: '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。',
  perverse_incentive: '按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。',
  winners_curse: '竞标赢了说明这块地就值这个价，我们的判断得到了验证。',
  tragedy_of_commons: '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  illusion_of_control: '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。',
  disposition_effect: '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。',
  endowment_effect: '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。',
  anchoring_effect: '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',
  present_bias: '体检以后再说，今晚先痛快吃了，以后的事再说。',
  peak_end_rule: '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了。',
  effort_justification: '我们熬了几个月做出来的方案，质量肯定没问题。',
  p_hacking: '测试了30个参数组合，有一组p值终于小于0.05，说明策略有效。',
  inverse_gamblers_fallacy: '他一上场就进球，肯定是个身经百战的老将。',
  significance_effect_size: 'p 小于 0.05，所以这个药有效，可以全面推广',
  selection_on_dependent_variable: '能活下来的公司都融过资，所以融资能救命',
  ad_hominem: '他是个骗子，所以他说的关于气候的数据全是假的。',
  // r339 适应证混杂（src/confounding-by-indication.js——探针胜出句原样）
  confounding_by_indication: '用新药的都是重症患者，所以新药组死亡率更高，这证明新药反而有害。',
  // r296 信息与激励盲区三子族（src/incentive-blind-spot.js）
  adverse_selection: '保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。',
  moral_hazard: '全额兜底不会让机构去承担更多风险。',
  free_rider: '公共事务总会有人站出来管，我个人不用参与。',
  // r343 incentive_conflation 子族（src/incentive-blind-spot.js 镜像腿——
  // 腿①关键在于参保后 + 腿②没有任何关系，单样本双腿承重）
  incentive_conflation: '赔付增加关键在于参保后的过度就医，跟投保前的风险构成没有任何关系。',
  // r336 机会成本忽视（src/opportunity-cost-neglect.js，单腿①单腿②样本——
  // E 段盲注承重需要该句只依赖一对腿组）
  opportunity_cost_neglect: '设备闲置着也不会产生额外成本，没有任何损失。',
  // r360 Will Rogers 现象（src/will-rogers-phenomenon.js，双腿样本——
  // 腿①重新分期 × 腿②两组都提高）
  will_rogers_phenomenon: '新的分期标准把一部分轻症病人从晚期移到早期，结果早期和晚期的生存率都提高了。',
  jevons_paradox: '只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。',
  // r366 碳泄漏/污染避难所（src/carbon-leakage.js，双腿样本——腿①转移族 × 腿②解决断言族）
  carbon_leakage: '我们把高污染工厂都迁到国外了，所以本国的环境问题已经解决。',
  // r367 价格管制单效应断言（src/price-control.js，双腿样本——腿①管制工具族 × 腿②单效应断言族）
  price_control: '房租上限只会让租房变得更便宜，不会有什么副作用。',
  // r368 重商主义贸易顺差谬误（src/mercantilism.js，双腿样本——腿①贸易差额族 × 腿②财富得失归因群）
  mercantilism: '出口大于进口才叫赚钱，顺差越大越占便宜。',
  paradox_of_thrift: '如果人人都不消费、多储蓄，总需求不会受影响，经济照样增长。',
  // r371 诱饵效应/被支配比较（src/decoy-effect.js，三腿样本——腿①选项集 × 腿②被支配描述 × 腿③相对化结论）
  decoy_effect: '基础版功能这么少，专业版只贵一点就显得特别划算。',
  // r372 健康使用者偏倚/健康依从者效应（src/healthy-user-bias.js，双腿样本——腿①行为/依从群体 × 腿②归因断言）
  healthy_user_bias: '吃维生素的人明显更健康，所以维生素让人健康。',
  // r373 非凡主张的证据比例错配（src/extraordinary-claims.js，三腿样本——腿①离奇主张 × 腿②弱基底 × 腿③充分性兑现）
  extraordinary_claims: '这个疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信了。',
  // r373 税负转嫁谬误（src/tax-incidence.js，三腿样本——腿①税种 × 腿②法定归属 × 腿③免转嫁；与 extraordinary_claims 同轮并存）
  tax_incidence: '对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。',
  // r374 存量-流量混淆（src/stock-flow-conflation.js，双腿样本——腿①存量指称 × 腿②流量兑现）
  stock_flow_conflation: '国家债务总额已经超过一年GDP，等于全国人民一年白干，国家实际上已经破产了。',
  // r375 政府-家庭收支类比（src/government-household-analogy.js，三腿样本——腿①主权主体 × 腿②私人收支框架×等价提示 × 腿③清偿结论）
  government_household_analogy: '国家财政跟家庭账本是一个道理，收入多少才能花多少，欠的债必须连本带利还清，否则就是破产。',
  // r376 存款创造贷款误解（src/money-creation.js，双腿样本——腿①存贷机制 × 腿②倒置归源/约束断言）
  money_creation: '银行放贷用的是储户的存款，没有存款增长就没有贷款。',
  // r377 税率-税收线性误读（src/linear-tax-revenue.js，双腿样本——腿①税率变动语境 × 腿②等比兑现断言）
  linear_tax_revenue: '税率提高一倍，税收自然也会翻倍，财政收入立马宽裕。',
};

// ─── 良性样本（官方良性语料形状 + 典型 think 结论）──
const BENIGN = [
  '根据成本加成定价，这批货的出厂价是每件三十七块五，含原材料、人工和合理利润。',
  '专业评估报告给出的估值区间是四百八十万到五百二十万，与挂牌价基本一致。',
  '实验达到统计显著（p=0.03），效应量为 0.2 个标准差，属于小效应，需要更大样本确认。',
  '我们在二十个预设假设中做了 Bonferroni 校正，校正后仍有三个结果显著。',
  '心理学教科书指出，锚定效应是最稳健的认知偏误之一，Kahneman 和 Tversky 有经典实验。',
  '样本选择上我们只纳入了完成全程随访的患者，并用逆概率加权纠正了失访偏倚。',
  '结论：心虫引擎的辨别维度共 246 个，覆盖逻辑谬误、因果推理与统计素养等家族。',
  '建议下一步：补充可验证的数据来源，把无法验证的断言改为不确定表述。',
  'The comparable sales in the neighborhood averaged around 480k, and the formal valuation came in at 495k.',
  'We corrected for multiple comparisons across the 20 pre-registered hypotheses.',
  'Anchoring is one of the most robust findings in judgment and decision making research.',
  'The regression controls for age, income, and baseline health status.',
];

// 族键 → 盲注键（取自各模块 __internals() 真实暴露的探针键：r295-internals-probe 实测）
// 每族注入两条腿的 ZH+EN 键——腿被删则该族必须从命中中消失（dispatch 承重证明）
const INJECT_KEY = {
  budget_value_conflation: ['BUDGET_ZH', 'BUDGET_EN', 'WORTH_ZH', 'WORTH_EN'],
  average_marginal_conflation: ['AVG_COST_ZH', 'AVG_COST_EN', 'MARG_ZH', 'MARG_EN'],
  mental_accounting: ['SOURCE_ZH', 'SOURCE_EN', 'SPEND_ZH', 'SPEND_EN'],
  perverse_incentive: ['INCENTIVE_ZH', 'INCENTIVE_EN', 'GAMING_ZH', 'GAMING_EN'],
  winners_curse: ['WIN_ZH', 'WIN_EN', 'VALUE_ZH', 'VALUE_EN'],
  tragedy_of_commons: ['A_ZH', 'A_EN', 'B_ZH', 'B_EN'],
  illusion_of_control: ['A_ZH', 'A_EN', 'B_ZH', 'B_EN'],
  disposition_effect: ['WIN_STATE_ZH', 'WIN_STATE_EN', 'WIN_DISP_ZH', 'WIN_DISP_EN', 'LOSE_STATE_ZH', 'LOSE_STATE_EN', 'LOSE_DISP_ZH', 'LOSE_DISP_EN'],
  endowment_effect: ['OWN_ZH', 'OWN_EN', 'REFUSE_ZH', 'REFUSE_EN'],
  anchoring_effect: ['ANCHOR_ZH', 'ANCHOR_EN', 'DEAL_ZH', 'DEAL_EN'],
  present_bias: ['NOW_ZH', 'NOW_EN', 'LATER_ZH', 'LATER_EN'],
  peak_end_rule: ['PEAK_END_ZH', 'PEAK_END_EN', 'WHOLE_VERDICT_ZH', 'WHOLE_VERDICT_EN'],
  effort_justification: ['EFFORT_ZH', 'EFFORT_EN', 'QUALITY_ZH', 'QUALITY_EN'],
  p_hacking: ['SEARCH_ZH', 'SEARCH_EN', 'SIGNIF_ZH', 'SIGNIF_EN'],
  inverse_gamblers_fallacy: ['FIRST_ZH', 'FIRST_EN', 'OUTCOME_ZH', 'OUTCOME_EN', 'INFER_ZH', 'INFER_EN'],
  significance_effect_size: ['SIG_ZH', 'SIG_EN', 'IMPORTANCE_ZH', 'IMPORTANCE_EN'],
  selection_on_dependent_variable: ['SELECT_ZH', 'SELECT_EN', 'CAUSE_ZH', 'CAUSE_EN'],
  ad_hominem: ['ATTACK_ZH', 'ATTACK_EN', 'DISREGARD_ZH', 'DISREGARD_EN'],
  // r296 信息与激励盲区三子族（src/incentive-blind-spot.js __internals 键名）
  adverse_selection: ['POOL_ZH', 'POOL_EN', 'NODISTORT_ZH', 'NODISTORT_EN'],
  moral_hazard: ['SHIELD_ZH', 'SHIELD_EN', 'NOCHANGE_ZH', 'NOCHANGE_EN'],
  free_rider: ['COLLECTIVE_ZH', 'COLLECTIVE_EN', 'ABSTAIN_ZH', 'ABSTAIN_EN'],
  // r336 机会成本忽视（腿①闲置族 + 腿②无损失族，对 ATTACK 样本单腿承重）
  opportunity_cost_neglect: ['INACTION_IDLE_ZH', 'ZEROCOST_NOLOSS_ZH'],
  // r360 Will Rogers（腿①九组全注——双腿族，清空任一侧腿组即整体失效；
  //   裸正则注入形态由 r361 的 taggedGroups 数组包裹兼容）
  will_rogers_phenomenon: ['MIGRATE_FROM_TO_ZH', 'MIGRATE_RECLASS_ZH', 'MIGRATE_ASSIGN_ZH', 'MIGRATE_MOVE_ZH', 'MIGRATE_RECLASS_EN', 'MIGRATE_FROM_TO_EN', 'MIGRATE_RULE_EN', 'MIGRATE_TOGROUP_EN', 'MIGRATE_SPLIT_EN'],
  // r364 jevons_paradox（双腿：腿① EFF_* × 腿② TOTALDOWN_* / USEMORE_*）
  jevons_paradox: ['EFF_NOUN_ZH', 'EFF_NOUN_REV_ZH', 'EFF_COMP_ZH', 'EFF_BARE_ZH', 'EFF_KW_EN', 'EFF_IMPROVE_EN', 'EFF_MORE_EN', 'EFF_INTENSITY_EN', 'EFF_LESSPER_EN', 'TOTALDOWN_ZH', 'TOTALDOWN_RELIEVE_ZH', 'TOTALDOWN_FOLLOW_ZH', 'TOTALDOWN_WILL_EN', 'TOTALDOWN_REDUCE_EN', 'TOTALDOWN_OVERALL_EN', 'TOTALDOWN_RELIEVE_EN', 'TOTALDOWN_AUTO_EN', 'USEMORE_MAKEBACK_ZH', 'USEMORE_RATIONALE_ZH', 'USEMORE_DIVIDEND_ZH', 'USEMORE_MAKEBACK_EN', 'USEMORE_MIGHT_EN', 'USEMORE_CHEAPER_EN', 'USEMORE_FREELY_EN'],
  // r366 carbon_leakage（双腿：腿① SHIFT_* × 腿② SOLVED_* / NOTOURS_*）
  carbon_leakage: ['SHIFT_VERB_ZH', 'SHIFT_NOUN_ZH', 'SHIFT_OUT_ZH', 'SHIFT_ABROAD_EN', 'SHIFT_OUTSRC_EN', 'SHIFT_TOCOUNTRIES_EN', 'SHIFT_SHIP_EN', 'SOLVED_ZH', 'SOLVED_SHIFT_ZH', 'SOLVED_BOOK_ZH', 'SOLVED_LOCAL_ZH', 'SOLVED_PROBLEM_EN', 'SOLVED_CONTROL_EN', 'SOLVED_DROP_EN', 'SOLVED_NOLONGER_EN', 'NOTOURS_ZH', 'NOTOURS_SHIFT_ZH', 'NOTOURS_EN', 'NOTOURS_HANDS_EN', 'NOTOURS_EXPORT_EN'],
  // r367 price_control（双腿：腿① CONTROL_* × 腿② ONLYGOOD_* / NOSIDE_* / AUTO_*）
  price_control: ['CONTROL_NOUN_ZH', 'CONTROL_VERB_ZH', 'CONTROL_NOUN_EN', 'CONTROL_VERB_EN', 'ONLYGOOD_PAIR_ZH', 'ONLYGOOD_GAIN_ZH', 'ONLYGOOD_PAIR_EN', 'ONLYGOOD_GAIN_EN', 'NOSIDE_ZH', 'NOSIDE_SUPPLY_ZH', 'NOSIDE_EN', 'NOSIDE_SUPPLY_EN', 'AUTO_ZH', 'AUTO_EN'],
  // r368 mercantilism（双腿：腿① TRADE_NOUN_* × 腿② GAIN_* / DRAIN_* / ACCUM_* / LOSE_*）
  mercantilism: ['TRADE_NOUN_ZH', 'TRADE_NOUN_EN', 'GAIN_ZH', 'GAIN_EN', 'DRAIN_ZH', 'DRAIN_EN', 'ACCUM_ZH', 'ACCUM_EN', 'LOSE_ZH', 'LOSE_EN'],
  // r369 paradox_of_thrift（三腿：腿① THRIFT_* × 腿② UNIVERSAL_* × 腿③ AGGBOOST_[NOHARM|POSITIVE]_* + ECON/MOREMORE/THRIFT 子形）
  paradox_of_thrift: ['THRIFT_NOUN_ZH', 'THRIFT_EN', 'UNIVERSAL_ZH', 'UNIVERSAL_EN', 'AGGBOOST_NOHARM_ZH', 'AGGBOOST_POSITIVE_ZH', 'AGGBOOST_NOHARM_EN', 'AGGBOOST_POSITIVE_EN', 'AGGBOOST_ECON_ZH', 'AGGBOOST_MOREMORE_EN', 'AGGBOOST_THRIFT_EN'],
  // r371 decoy_effect（三腿：腿① CHOICE_SET_* × 腿② DOMINATED_* × 腿③ RELATIVE_[A|B|C]_*）
  decoy_effect: ['CHOICE_SET_ZH', 'CHOICE_SET_EN', 'DOMINATED_ZH', 'DOMINATED_EN', 'RELATIVE_ZH_A', 'RELATIVE_ZH_B', 'RELATIVE_ZH_C', 'RELATIVE_EN_A', 'RELATIVE_EN_B', 'RELATIVE_EN_C'],
  // r372 healthy_user_bias（双腿：腿① GROUP_[ZH|EN]_[A|B] × 腿② CAUSAL_[ZH|EN] + CONCEPT/CORRECT 两组豁免）
  healthy_user_bias: ['GROUP_ZH_A', 'GROUP_ZH_B', 'GROUP_EN_A', 'GROUP_EN_B', 'CAUSAL_ZH', 'CAUSAL_EN'],
  // r373 extraordinary_claims（三腿：腿① EXTRA_[ZH|EN]_[A|B] × 腿② WEAK_[ZH|EN]_[A|B] × 腿③ SUFF_[ZH|EN]）
  extraordinary_claims: ['EXTRA_ZH_A', 'EXTRA_ZH_B', 'EXTRA_EN_A', 'EXTRA_EN_B', 'WEAK_ZH_A', 'WEAK_ZH_B', 'WEAK_EN_A', 'WEAK_EN_B', 'SUFF_ZH', 'SUFF_EN'],
  // r373 tax_incidence（三腿：腿① TAX_* × 腿② STATUTORY_* × 腿③ NOTRANSFER_* + PAIR 同句形 + CONCEPT/CORRECT 豁免）
  tax_incidence: ['TAX_ZH', 'TAX_ZH_B', 'TAX_EN_A', 'TAX_EN_B', 'STATUTORY_ZH', 'STATUTORY_EN', 'NOTRANSFER_ZH', 'NOTRANSFER_EN', 'PAIR_ZH', 'PAIR_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN'],
  // r374 stock_flow_conflation（双腿：腿① STOCK_[ZH|EN]_[A|B] × 腿② EQUATE_[ZS|RATE|CMP]_[ZH|EN]）
  stock_flow_conflation: ['STOCK_ZH_A', 'STOCK_ZH_B', 'STOCK_EN_A', 'STOCK_EN_B', 'EQUATE_ZS_ZH', 'EQUATE_RATE_ZH', 'EQUATE_CMP_ZH', 'EQUATE_ZS_EN', 'EQUATE_RATE_EN', 'EQUATE_CMP_EN'],
  // r375 government_household_analogy（三腿：腿① SOV_[ZH|EN] × 腿② ANALOGY_[ZH|EN] ×
  // 腿③ PAYOFF_[ZH|EN] + CONCEPT/CORRECT 两组豁免 + 腿③否定/对冲双守卫）
  government_household_analogy: ['SOV_ZH', 'SOV_EN', 'ANALOGY_ZH', 'ANALOGY_EN', 'PAYOFF_ZH', 'PAYOFF_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN'],
  // r376 money_creation（双腿：腿① CTX_[ZH|EN] × 腿② SOURCE_[S1..S7|C1..C5]_[ZH|EN]
  // + CONCEPT/CORRECT 两组豁免 + 腿②紧前否定/对冲双守卫）
  money_creation: ['CTX_ZH', 'CTX_EN', 'SOURCE_S1_ZH', 'SOURCE_S2_ZH', 'SOURCE_S3_ZH', 'SOURCE_S4_ZH', 'SOURCE_S5_ZH', 'SOURCE_S6_ZH', 'SOURCE_S7_ZH', 'SOURCE_C1_ZH', 'SOURCE_C1B_ZH', 'SOURCE_C2_ZH', 'SOURCE_C3_ZH', 'SOURCE_C4_ZH', 'SOURCE_C5_ZH', 'SOURCE_S1_EN', 'SOURCE_S2_EN', 'SOURCE_S3_EN', 'SOURCE_S4_EN', 'SOURCE_S5_EN', 'SOURCE_S6_EN', 'SOURCE_S7_EN', 'SOURCE_C1_EN', 'SOURCE_C2_EN', 'SOURCE_C3_EN', 'SOURCE_C4_EN', 'SOURCE_C5_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN'],
  // r377 linear_tax_revenue（双腿：腿① RATE_[ZH|ZH_B|ZH_C|EN|EN_B] × 腿②
  // PROP_[P1..P4]_ZH / PROP_[E1..E3]_EN + CONCEPT/COND/CORRECT 三组豁免 +
  // 腿②紧前否定/对冲双守卫）
  linear_tax_revenue: ['RATE_ZH', 'RATE_ZH_B', 'RATE_ZH_C', 'RATE_EN', 'RATE_EN_B', 'PROP_P1_ZH', 'PROP_P2_ZH', 'PROP_P3_ZH', 'PROP_P4_ZH', 'PROP_E1_EN', 'PROP_E2_EN', 'PROP_E3_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'COND_ZH', 'COND_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN'],
  // r339 适应证混杂（腿①选择分配四组 + 腿②治疗因果四组，ZH 侧对 ATTACK 样本承重）
  confounding_by_indication: ['SELECT_VERB_ZH', 'SELECT_TREAT_SEV_ZH', 'SELECT_SEV_TREAT_ZH', 'SELECT_IMBALANCE_ZH', 'CAUSAL_MARK_ZH_A', 'CAUSAL_PROVE_ZH_B', 'CAUSAL_TREAT_ZH_C', 'CAUSAL_OUTCOME_ZH_D'],
  // r343 incentive_conflation（镜像双腿：腿① ZH 连接词 E 组 + 腿② ZH 否认 A 组对
  // ATTACK 样本承重；EN 两组同列保持与 r345 轮测一致的注入键全集）
  incentive_conflation: ['MIRROR_ATTR_ZH_E', 'MIRROR_ATTR_ZH_F', 'MIRROR_ATTR_EN_D', 'MIRROR_DENIAL_ZH_A', 'MIRROR_DENIAL_ZH_D', 'MIRROR_DENIAL_EN_F'],
};

console.log('=== A 插件元数据与族表 ===');
T('A1 插件导出完整（name/version/hooks/init/analyze/FAMILIES）', () => {
  assert.strictEqual(PLUGIN.name, 'econ-reasoning-check');
  assert.strictEqual(typeof PLUGIN.analyze, 'function');
  assert.ok(Array.isArray(PLUGIN.hooks) && PLUGIN.hooks.length === 1);
  assert.strictEqual(PLUGIN.hooks[0].event, 'postprocess.think');
  assert.strictEqual(typeof PLUGIN.init, 'function');
});
T('A2 族表 38 族：32 econ + 6 stats，key 唯一', () => {
  assert.strictEqual(FAMILIES.length, 38); // r295 18 + r296 信息与激励盲区 3 + r336 机会成本忽视 1 + r339 适应证混杂 1 + r343 incentive_conflation 1 + r360 Will Rogers 1（r361 收尾 r360 注册松散：原断言停在 r360 前的 24）+ r364 Jevons 悖论 1 + r366 碳泄漏 1 + r367 价格管制 1 + r368 重商主义 1 + r369 节约悖误 1 + r371 诱饵效应 1 + r372 健康使用者偏倚 1 + r373 非凡主张证据比例错配 1 + r373 税负转嫁谬误 1 + r374 存量-流量混淆 1 + r375 政府-家庭收支类比 1 + r376 存款创造贷款误解 1 + r377 税率-税收线性误读 1
  const econ = FAMILIES.filter(f => f.group === 'econ');
  const stats = FAMILIES.filter(f => f.group === 'stats');
  assert.strictEqual(econ.length, 32);
  assert.strictEqual(stats.length, 6);
  const keys = FAMILIES.map(f => f.key);
  assert.strictEqual(new Set(keys).size, 38);
});
T('A3 每族都有模块路径 + 导出函数名 + 中英标签', () => {
  for (const f of FAMILIES) {
    assert.ok(/^\.\.\/\.\.\/[a-z-]+\.js$/.test(f.mod), `${f.key} mod 路径异常: ${f.mod}`);
    assert.ok(f.fn.length > 4, `${f.key} fn 异常`);
    assert.ok(f.zh && f.en, `${f.key} 缺标签`);
    assert.ok(/^r\d+$/.test(f.round), `${f.key} 起草轮次异常: ${f.round}`);
  }
});
T('A4 38 个模块文件全部存在且导出函数是函数', () => {
  for (const f of FAMILIES) {
    const p = path.join(ROOT, 'src/plugins/econ-reasoning-check', f.mod);
    assert.ok(fs.existsSync(p), `模块缺失: ${f.mod}`);
    const mod = require(p);
    assert.strictEqual(typeof mod[f.fn], 'function', `${f.mod} 无导出 ${f.fn}`);
  }
});

console.log('=== B 每族攻击命中 ===');
for (const f of FAMILIES) {
  T(`B ${f.key}（${f.group}）攻击句命中`, () => {
    const r = analyze(ATTACK[f.key]);
    assert.ok(r.families.some(x => x.key === f.key),
      `未命中；实际命中族: [${r.families.map(x => x.key).join(',')}]`);
    assert.ok(r.score > 0.5, `score ${r.score} 未过 0.5 阈值（消费者不打折）`);
  });
}

console.log('=== C 良性零误伤 ===');
T('C1 12 条良性语料零命中', () => {
  const hits = [];
  for (const b of BENIGN) {
    const r = analyze(b);
    if (r.totalHits > 0) hits.push(`${b.slice(0, 24)}… → ${r.families.map(x => x.key).join(',')}`);
  }
  assert.strictEqual(hits.length, 0, '误伤:\n' + hits.join('\n'));
});
T('C2 空/短文本守卫', () => {
  assert.strictEqual(analyze('').totalHits, 0);
  assert.strictEqual(analyze('短').totalHits, 0);
  assert.strictEqual(analyze(null).totalHits, 0);
  assert.strictEqual(analyze(undefined).score, 0);
});

console.log('=== D action=<family key> 单族过滤 ===');
T('D1 only 过滤只留目标族', () => {
  const r = analyze(ATTACK.anchoring_effect, { only: 'anchoring_effect' });
  assert.strictEqual(r.familyCount, 1);
  assert.strictEqual(r.families[0].key, 'anchoring_effect');
});
T('D2 only 非目标族 → 零命中', () => {
  const r = analyze(ATTACK.anchoring_effect, { only: 'ad_hominem' });
  assert.strictEqual(r.familyCount, 0);
});

console.log('=== E 负例注入-删条（每族一条，删则该族必须变红）===');
for (const f of FAMILIES) {
  T(`E ${f.key} blind inject → 该族从命中中消失`, () => {
    const keys = INJECT_KEY[f.key];
    const inject = {};
    for (const k of keys) inject[k] = /(?!)/i; // 永假正则替换指定常量（与各模块 inject 契约一致）
    const before = analyze(ATTACK[f.key]);
    const after = analyze(ATTACK[f.key], { inject });
    assert.ok(before.families.some(x => x.key === f.key), '注入前该族应命中（前提）');
    assert.ok(!after.families.some(x => x.key === f.key),
      '注入后该族仍命中——dispatch 不承重或注入键名不对');
  });
}

console.log('=== F 引擎 think 路径真 dispatch ===');
(async () => {
  // 同步部分已完成计数，这里追加 async 断言
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const { runThinkPipeline } = require(path.join(ROOT, 'src/core/think-pipeline.js'));
  const hf = new HeartFlow({});
  hf.start();

  const attack = ATTACK.anchoring_effect;
  const result = { output: { conclusion: attack, warnings: [] }, confidence: 0.8, type: 'test' };
  await runThinkPipeline(result, '帮我看下这个谈判过程有没有问题', hf);
  const econ = result._discrimination && result._discrimination.econReasoning;
  T('F1 插件经 PluginLoader 加载（hf._econReasoningAnalyzer）', () => {
    assert.strictEqual(typeof hf._econReasoningAnalyzer, 'function');
  });
  T('F2 postprocess.think hook 写 _discrimination.econReasoning', () => {
    assert.ok(econ && econ.totalHits > 0, JSON.stringify(result._discrimination));
    assert.ok(econ.families.some(x => x.key === 'anchoring_effect'));
  });
  T('F3 消费者（hook fire 之后）打 _confidencePenalty + warning', () => {
    assert.ok(result._confidencePenalty > 0, `penalty=${result._confidencePenalty}`);
    assert.ok((result.output.warnings || []).some(w => w.includes('经济/统计推理谬误') && w.includes('锚定效应')),
      JSON.stringify(result.output.warnings));
  });

  const clean = { output: { conclusion: BENIGN[0], warnings: [] }, confidence: 0.8, type: 'test' };
  await runThinkPipeline(clean, '这个定价合理吗', hf);
  T('F4 良性结论零触发（无 penalty 无 warning）', () => {
    assert.ok(!(clean._discrimination && clean._discrimination.econReasoning), '良性结论不应有 econReasoning');
    assert.ok(!clean._confidencePenalty, `良性 penalty=${clean._confidencePenalty}`);
    assert.ok(!(clean.output.warnings || []).some(w => w.includes('经济/统计推理谬误')));
  });

  // ─── G MCP 接线 ───
  console.log('=== G MCP 接线 ===');
  const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
  T('G1 tools-registry 定义两个新工具', () => {
    assert.ok(/name:\s*'heartflow_econ_fallacy_check'/.test(reg));
    assert.ok(/name:\s*'heartflow_stats_literacy_check'/.test(reg));
  });
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  T('G2 HANDLERS 映射两个新工具', () => {
    assert.ok(/heartflow_econ_fallacy_check:\s*\(args\)\s*=>/.test(srv));
    assert.ok(/heartflow_stats_literacy_check:\s*\(args\)\s*=>/.test(srv));
  });
  T('G3 共用 handler 函数存在（引擎实例优先 + 回退 require 插件）', () => {
    assert.ok(/function handleEconReasoningCheck\(/.test(srv));
    assert.ok(/function _econReasoningAnalyzer\(/.test(srv));
  });

  // 真实 HTTP JSON-RPC e2e（同 mcp-auth-e2e-real.test.js 范式）
  // 端口段 21500-21899：与 mcp-auth-e2e-real 的 18500-18999 零重叠
  // （r295 池化首跑 3 条红项定位：端口段重叠 → 双方 spawn 同端口互撞，
  // 对方 server 先绑定则我方 initialize 通、tools/list 全 401）
  const { spawn } = require('child_process');
  const http = require('http');
  const PORT = 21500 + Math.floor(Math.random() * 400);
  const TOKEN = 'r295-e2e-' + Math.random().toString(36).slice(2);
  const rpc = (method, params, headers) => new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    const req = http.request({ host: '127.0.0.1', port: PORT, path: '/mcp', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.setTimeout(20000, () => req.destroy(new Error('rpc timeout 20s')));
    req.on('error', reject); req.write(body); req.end();
  });
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const env = { ...process.env, MCP_HEARTFLOW_KEY: TOKEN, HF_KEEP_STDOUT_LOGS: '1' };
  delete env.NODE_ENV;
  // [2026-11-12 审计修复] 隔离父进程 token（同 r296 修复）：MCP_HEARTFLOW_KEY
  // 优先级低于 HEARTFLOW_MCP_TOKEN / MCP_HEARTFLOW_API_KEY，父 shell 设了后
  // spawn server 用父 token，本测试 Bearer <random> 全 401。
  delete env.HEARTFLOW_MCP_TOKEN;
  delete env.MCP_HEARTFLOW_API_KEY;
  const child = spawn(process.execPath, [path.join(ROOT, 'src/mcp-server.js'), '--port', String(PORT)], {
    cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  // 就绪等待放宽到 60s（池化负载下 server 启动可能 >20s）
  for (let i = 0; i < 120; i++) {
    await sleep(500);
    try {
      const r = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } }, {});
      if (r.status === 200 || r.status === 401) { ready = true; break; }
    } catch (_) { /* 未起 */ }
    if (child.exitCode !== null) break; // 端口被抢/启动失败：子进程已退出
  }
  if (ready) {
    const AUTH = { Authorization: `Bearer ${TOKEN}` };
    const listRes = await rpc('tools/list', {}, AUTH);
    let names = [];
    try { names = (JSON.parse(listRes.body).result.tools || []).map(t => t.name); } catch (_) {}
    T('G4 tools/list 含两个新工具（真实 server）', () => {
      assert.ok(names.includes('heartflow_econ_fallacy_check'), 'econ 工具不在 tools/list');
      assert.ok(names.includes('heartflow_stats_literacy_check'), 'stats 工具不在 tools/list');
    });
    const call1 = await rpc('tools/call', { name: 'heartflow_econ_fallacy_check', arguments: { text: ATTACK.anchoring_effect } }, AUTH);
    T('G5 econ_fallacy_check tools/call 真返回命中', () => {
      assert.strictEqual(call1.status, 200, `HTTP ${call1.status}`);
      const j = JSON.parse(call1.body);
      const text = JSON.stringify(j);
      assert.ok(text.includes('anchoring_effect'), `返回无 anchoring_effect: ${text.slice(0, 300)}`);
    });
    const call2 = await rpc('tools/call', { name: 'heartflow_stats_literacy_check', arguments: { text: ATTACK.p_hacking, action: 'p_hacking' } }, AUTH);
    T('G6 stats_literacy_check tools/call 单族 action 真返回命中', () => {
      assert.strictEqual(call2.status, 200, `HTTP ${call2.status}`);
      const j = JSON.parse(call2.body);
      assert.ok(JSON.stringify(j).includes('p_hacking'), `返回无 p_hacking: ${call2.body.slice(0, 300)}`);
    });
    const call3 = await rpc('tools/call', { name: 'heartflow_econ_fallacy_check', arguments: { text: BENIGN[0] } }, AUTH);
    T('G7 良性文本 tools/call 零命中', () => {
      const j = JSON.parse(call3.body);
      const s = JSON.stringify(j);
      assert.ok(!s.includes('"totalHits":1'), `良性误报: ${s.slice(0, 300)}`);
    });
  } else {
    T('G4-G7 真实 server 启动（跳过则记失败）', () => { throw new Error('MCP server 未就绪'); });
  }
  child.kill('SIGKILL');

  // ─── H 不回归 ───
  console.log('=== H 不回归 ===');
  T('H1 维度计数仍 246（本轮零 src/index.js 改动）', () => {
    const { discriminate } = require(path.join(ROOT, 'src/index.js'));
    const d = discriminate('neutral baseline text');
    const n = Object.keys(d.dimensions || {}).length;
    // [2026-11-12 审计修复] 原断言 strictEqual(n, 246) 写死 r295 锚点，r297 起
    // ad_hominem 等族进 gate 维度表、r305→r307 又 +3（实测 251），连红 6 轮非
    // 真实回归。改为「≥246 下限保持」+ 上限交 measure 门禁把关。
    assert.ok(n >= 246, `维度数 ${n} < 246（r295 接线基线倒退）`);
    // 本轮 18 族键不得出现在 gate 维度表（gate 层零接线，交接项给 1 号）
    // [2026-11-12 审计修复] 排除 ad_hominem：r297 已正式把它接入 gate 维度表
    // （第203维，UPGRADE_LOG r297），属后续轮次的有意接线而非本断言要防的
    // 「意外接入」。其余 17 族仍须保持零接线。
    const econKeys = Object.keys(d.dimensions || {}).filter(k => /anchoring|endowment|disposition|mental_accounting|perverse|winners_curse|tragedy|illusion_of_control|present_bias|peak_end|effort_justification|budget_value|average_marginal|p_hacking|inverse_gamblers|significance_effect|selection_on_dependent/.test(k));
    // [r332 排除] illusion_of_control：r332 已正式把它接入 gate 维度表
    // （第 256 维，UPGRADE_LOG r332——「交接项给 1 号」由 4 号海外产能单元
    // 执行完毕：require/dispatch/scores/dimMap×2/DIM_GUIDANCE/VERIFY_DIMS/
    // summary/module.exports 九处接线 + r332 三条补腿）。同 r297 排除
    // ad_hominem 先例，属后续轮次的有意接线而非「意外接入」。其余族仍须零接线。
    const unexpected = econKeys.filter(k => k !== 'illusion_of_control');
    assert.strictEqual(unexpected.length, 0, `gate 维度表出现本轮族键: ${unexpected.join(',')}`);
  });
  T('H2 analyze 对同一输入确定性（无随机/无状态泄漏）', () => {
    const a = analyze(ATTACK.mental_accounting);
    const b = analyze(ATTACK.mental_accounting);
    assert.deepStrictEqual(a.families.map(f => f.key), b.families.map(f => f.key));
    assert.strictEqual(a.score, b.score);
  });

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('E2E 段崩溃:', e); process.exit(1); });
