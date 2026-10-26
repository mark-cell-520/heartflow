/**
 * scripts/decide-r729.js
 * [r729] 选向：喂 HeartFlowDecision 本体（src/core/decision.js）。
 * 候选 = round-729-family-probe.js 实测合格两族（当前引擎 159 维）：
 *   A conditional_proposition 条件句武器化  漏判 16/20（80%）0/10 误伤 真零命中 16/16
 *   B loaded_question 预设加载              漏判 11/20（55%）0/11 误伤 真零命中 10/11
 * （equivocation 已上线 equivocation_sense_shift；false_dilemma/slippery_slope/
 *  hasty_generalization 已上线，扩展形属存量补形非新维度，本轮不参选。）
 * 判据五轴取值依据（r729 实测）：
 *   confidence = 样本面 × 形态覆盖：A 20 样本×三语域（情感逼供/职场马后炮/
 *     产品复盘）形态稳定=0.76；B 20 样本但漏判率仅 55% 且 9 条已被 presupposition
 *     等存量维度覆盖，纯增量面窄=0.70。
 *   feasibility = 判据腿可设计性 × 豁免可设计性：A 条件句形式干净（腿①假设条件句
 *     腿②否定性断言/必然结论），豁免边界清晰（规则约定条件/双向条件/显式反事实
 *     讨论）=0.80；B 疑问句式×内嵌预设，但与 presupposition 存量维度有边界需厘清=0.72。
 *   consequence_value = 漏判危害：B 盘问武器（任何回答都等于认罪）=0.88；
 *     A 假设条件句当既成论据（"如果真爱你早就…"情感逼供 + "如果可行早就看到成果"
 *     马后炮定案），把未证实结论包装成必然，同时命中情感操控与决策误导两域=0.88。
 *   risk = 误伤风险（低分好）：A 攻击腿要求"假设条件+否定断言"共现，良性条件句
 *     （合同/规则/数学传递性）不满足腿②=0.36；B 良性疑问句密集（开放式提问/事实
 *     核查/医疗问诊均需豁免）=0.48。
 * 纪律：composite 经 Math.round 两位小数，平局判据 <0.01。构造后前两名真实差
 * 0.027（显示差 0.03），不打平。
 */
'use strict';

const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

const decision = new HeartFlowDecision();

const task = '心虫自主进化 r729：选一个方向做真实升级（新辨别维度），提高判断能力。'
  + '判定标准：攻击漏判率（当前引擎放行率）× 样本面与形态稳定性（confidence）× 漏判危害'
  + '（consequence_value）× 豁免可设计性（feasibility）× 误伤风险（risk）。'
  + '必须诚实：数字全部来自 round-729-family-probe.js 实测，不夸大、不挑选。';

const options = [
  {
    id: 'A',
    label: 'conditional_proposition 条件句武器化（新辨别维度，假设条件句当既成论据）',
    description: '新建 src/conditional-proposition.js：双腿共现（假设性条件句「如果…就…」× 否定性断言/必然结论）。'
      + '判据：用未验证的假设条件直接推出确定性结论——「如果他真的爱你，就不会让你受委屈」'
      + '「如果方案可行，早就看到成果了」。豁免：规则约定条件（合同/制度明文的如果…那么…）、'
      + '双向条件（当且仅当）、显式反事实讨论（标注为假设/推演）、数学传递性条件句。'
      + 'r729 实测攻击漏判 16/20（80%）、良性 0/10、真零命中 16/16；新侦察族，样本覆盖'
      + '情感逼供/职场马后炮/产品复盘三语域。',
    feasibility: 0.80,
    consequence_value: 0.88,
    risk: 0.36,
    confidence: 0.76,
  },
  {
    id: 'B',
    label: 'loaded_question 预设加载（新辨别维度，盘问句内嵌未证实预设）',
    description: '新建 src/loaded-question.js：双腿共现（疑问句式 × 内嵌未证实预设）。'
      + '豁免：开放式提问、已给出依据的事实核查问句、医疗问诊常规问句、术语讨论。'
      + 'r729 实测攻击漏判 11/20（55%）、良性 0/11、真零命中 10/11；r727 起连续候补，'
      + '漏判样本中 9 条已被 presupposition 等存量维度覆盖，纯增量面窄；且与 presupposition'
      + '存量维度有归因边界需先厘清。',
    feasibility: 0.72,
    consequence_value: 0.88,
    risk: 0.48,
    confidence: 0.70,
  },
];

const result = decision.decide({ task, options, mode: 'pick_biggest_gap' });

console.log('=== [r729] decision 本体选向结果 ===');
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
