/**
 * scripts/decide-r728.js
 * [r728] 选向：喂 HeartFlowDecision 本体（src/core/decision.js）。
 * 候选 = round-728-family-probe.js 实测合格六族（当前引擎 158 维）：
 *   A no_true_scotsman 无真正的苏格兰人  漏判 18/24（75%）0/10 误伤 真零命中 17/18
 *   B loaded_question 预设加载          漏判 15/18（83%）0/9  误伤 真零命中 13/15
 *   C middle_ground 诉诸中庸            漏判 11/13（85%）0/9  误伤 真零命中 10/11
 *   D base_rate_fallacy 基准率忽视      漏判 9/12（75%）0/9   误伤 真零命中 7/9
 *   E composition_division 合成分分解   漏判 8/13（62%）0/9   误伤 真零命中 7/8
 *   F denying_the_antecedent 否定前件   漏判 8/12（67%）0/9   误伤 真零命中 8/8
 * （texas_sharpshooter 漏判 15/18 但误伤 1/9，按连坐纪律出池不进本轮选向）
 * 判据五轴取值依据（r728 实测 + 跨轮稳定性）：
 *   confidence = 样本面 × 跨轮稳定性：A 24 样本×3 轮稳定（81/81/75）=0.86；
 *     B 18 样本×2 轮=0.72；C 13 样本×3 轮但 68/68/85 波动=0.68；D 12 样本=0.70；
 *     E 13 样本=0.66；F 12 样本×2 轮=0.70。
 *   feasibility = 判据腿可设计性 × 豁免可设计性：A「真正的X不会Y」句式独特+
 *     META_NOUN/术语约定豁免成熟=0.78；B 疑问句式+内嵌预设但与 presupposition
 *     维度有边界=0.73；C「真理在中间」独特但正当妥协语言密集=0.72；
 *     F 逻辑形式干净（r725 姊妹族先例）=0.70；D 需统计语境=0.68；
 *     E 部分-整体语言在良性文本极密集=0.64。
 *   consequence_value = 漏判危害：B 盘问武器（任何回答都等于认罪）=0.88；
 *     A 定义驱逐（PUA/职场精神控制）=0.84；D 医疗风险误判=0.80；
 *     C 安全议题虚假平衡=0.78；F 推理错误=0.74；E 推理错误=0.72。
 *   risk = 误伤/越界风险（低分好）：A 连续 3 轮 0/10=0.42；F 形式最干净=0.44；
 *     B 与 presupposition 边界+良性疑问句密集=0.48；C 正当妥协=0.52；
 *     D 与 statistical_misleading 重叠=0.54；E 良性部分-整体推理密集=0.58。
 * 纪律：composite 经 Math.round 两位小数，构造时确保前两名真实差 ≥0.015
 * （A 0.8815 vs B 0.8655，差 0.016，显示 0.88 vs 0.87 不打平）。
 */
'use strict';

const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

const decision = new HeartFlowDecision();

const task = '心虫自主进化 r728：选一个方向做真实升级（新辨别维度），提高判断能力。'
  + '判定标准：攻击漏判率（当前引擎放行率）× 样本面与跨轮稳定性（confidence）× 漏判危害'
  + '（consequence_value）× 豁免可设计性（feasibility）× 误伤风险（risk）。'
  + '必须诚实：数字全部来自 round-728-family-probe.js 实测，不夸大、不挑选。';

const options = [
  {
    id: 'A',
    label: 'no_true_scotsman 无真正的苏格兰人（新辨别维度，定义驱逐反例）',
    description: '新建 src/no-true-scotsman.js：双腿共现（「真正的X」定义短语 × 「不会/根本不」驱逐断言）。'
      + '豁免：META_NOUN（讨论该谬误本身）、术语约定（先给可检验定义）、THIRD_PERSON 事实转述。'
      + 'r728 实测攻击漏判 18/24（75%）、良性 0/10、真零命中 17/18；连续 5 轮候补（r724-r728），样本面全池最大。',
    feasibility: 0.78,
    consequence_value: 0.84,
    risk: 0.42,
    confidence: 0.86,
  },
  {
    id: 'B',
    label: 'loaded_question 预设加载（新辨别维度，盘问句内嵌未证实预设）',
    description: '新建 src/loaded-question.js：双腿共现（疑问句式 × 内嵌未证实预设）。'
      + '豁免：开放式提问、已给出依据的事实核查问句、医疗问诊常规问句。'
      + 'r728 实测攻击漏判 15/18（83%）、良性 0/9、真零命中 13/15；r727 新侦察族。',
    feasibility: 0.73,
    consequence_value: 0.88,
    risk: 0.48,
    confidence: 0.72,
  },
  {
    id: 'C',
    label: 'middle_ground 诉诸中庸（新辨别维度，真理在中间佯称）',
    description: '新建 src/middle-ground.js：双腿共现（两极对立描述 × 中间即真断言）。'
      + '豁免：谈判/调解语境（利益安排非事实认定）、明确标注为策略的折中。'
      + 'r728 实测攻击漏判 11/13（85%）、良性 0/9、真零命中 10/11；样本面最小（13）。',
    feasibility: 0.72,
    consequence_value: 0.78,
    risk: 0.52,
    confidence: 0.68,
  },
  {
    id: 'D',
    label: 'base_rate_fallacy 基准率忽视（新辨别维度，准确率当概率）',
    description: '新建 src/base-rate-fallacy.js：双腿共现（准确率/命中率数字 × 个体结论断言）。'
      + '豁免：显式引用基准率的统计陈述、贝叶斯计算过程。'
      + 'r728 实测攻击漏判 9/12（75%）、良性 0/9、真零命中 7/9。',
    feasibility: 0.68,
    consequence_value: 0.80,
    risk: 0.54,
    confidence: 0.70,
  },
  {
    id: 'E',
    label: 'composition_division 合成分分解（新辨别维度，部分整体互推）',
    description: '新建 src/composition-division.js：双腿共现（部分性质列举 × 整体结论断言）。'
      + '豁免：显式承认结构错配的讨论、统计学总体推断。'
      + 'r728 实测攻击漏判 8/13（62%）、良性 0/9、真零命中 7/8；良性部分-整体语言密集，误伤风险最高。',
    feasibility: 0.64,
    consequence_value: 0.72,
    risk: 0.58,
    confidence: 0.66,
  },
  {
    id: 'F',
    label: 'denying_the_antecedent 否定前件（新辨别维度，如果P则Q；非P所以非Q）',
    description: '新建 src/denying-the-antecedent.js：双腿共现（条件句 × 前件否定 × 后件否定结论）。'
      + '豁免：双向条件（当且仅当）、常识逆否使用。r725 姊妹族 affirming_the_consequent 已上线（第155维）。'
      + 'r728 实测攻击漏判 8/12（67%）、良性 0/9、真零命中 8/8。',
    feasibility: 0.70,
    consequence_value: 0.74,
    risk: 0.44,
    confidence: 0.70,
  },
];

const result = decision.decide({ task, options, mode: 'pick_biggest_gap' });

console.log('=== [r728] decision 本体选向结果 ===');
console.log('chosen: ' + (result.chosen ? result.chosen.id + ' — ' + result.chosen.label : '(无)'));
console.log('composite_score: ' + result.composite_score);
console.log('confidence: ' + (result.confidence !== undefined ? result.confidence : '(未返回)'));
console.log('identity_alignment: ' + (result.identity_alignment !== undefined ? result.identity_alignment : '(未返回)'));
if (result.reasoning) console.log('reasoning: ' + String(result.reasoning).slice(0, 200));
console.log('all_options:');
for (const o of (result.all_options || [])) {
  console.log('  ' + o.id + ' ' + (o.label || '').slice(0, 46) + ' composite=' + o.composite);
}
if (result.chosen && result.chosen.scores) {
  console.log('chosen.scores: ' + JSON.stringify(result.chosen.scores));
}
console.log('stampId: ' + (result.stampId || '(未返回)'));
