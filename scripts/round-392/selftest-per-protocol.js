'use strict';
/**
 * scripts/round-392/selftest-per-protocol.js — 模块级自测（不经过 gate）
 * 断言：攻击全命中、良性零误伤、射程对照零命中、命中结构完整。
 */
const path = require('path');
const mod = require(path.join(__dirname, '..', '..', 'src', 'per-protocol-misread.js'));
const detect = mod.detectPerProtocolMisread;

const ATTACK = [
  // r389 探针原样（10）
  '只分析完成全部疗程的患者，疗效非常显著，说明药物确实有效。',
  '排除不依从的受试者后，治疗组结局明显更好，可见药效可靠。',
  '按完成试验的人群分析，新疗法把风险降低了一半，这就是真实疗效。',
  '退出试验的人不用管，只看坚持下来的，效果依然明确。',
  '只统计按方案用药的人群，新药的效果非常确凿。',
  '依从性好的那部分患者效果显著，这就是药物的真实效果。',
  'Among patients who completed the full course, the drug clearly worked, proving its efficacy.',
  'Excluding non-adherent participants, the treatment halved the risk, which is the real effect.',
  'Looking only at those who finished the program, the outcome improvement is substantial.',
  'In the adherent subgroup the drug worked well, which is its true effect.',
  // r392 立项探针扩样（8）
  '只纳入按时服完药的受试者，这样测出来的疗效才是药物的真实水平。',
  '把中途停药的人都剔掉之后，剩余患者的治愈率非常高，足见药效过硬。',
  '只看完成了整个方案的那一组，新药的疗效确凿无疑。',
  '按方案集分析显示风险下降明显，可见疗效是确切的。',
  '坚持完成随访的患者结局最好，这就是治疗的真实效果。',
  'Counting only those who took the drug as prescribed, the treatment clearly works.',
  'Among completers the therapy performed remarkably well, which demonstrates its true efficacy.',
  'Restricting the analysis to adherent patients, the drug genuinely works.',
  // 追加措辞变体（验证腿形覆盖）
  '只计算完成了全部治疗的受试者，新药的疗效非常确切。',
  '剔除未完成方案的患者后，剩下的数据显示药效确凿。',
  '不依从的受试者全部排除之后，治疗组效果明确，足以说明药物有效。',
  '按照完成试验的受试者来分析，这种疗法的真实效果无可置疑。',
  '依从性高的那部分患者症状缓解明显，这就是药物的真实疗效。',
  'Only participants who finished the entire program were analyzed, and the drug clearly works.',
  'After removing the non-compliant subjects, the cure rate was very high, proving the drug works.',
  'In the adherent subgroup the treatment performed remarkably well, which is the real effect.',
];

const BENIGN = [
  // 正确方法论 / 概念教学（豁免 A/B）
  '意向性治疗分析才是主分析，按方案分析只能作为辅助参考。',
  '按方案分析集破坏了随机化，两组不再可比，不能单独作为疗效证据。',
  '所谓按方案分析，是指只统计完成全程的受试者，它会高估治疗效果。',
  '只统计依从者会高估药效，这是按方案分析的已知缺陷。',
  '按方案分析集的结果与意向性治疗分析一致，都显示风险下降。',
  '脱落患者的后续结局未知，需要在意向性治疗框架下保守估计。',
  'The intention-to-treat analysis is the primary; per-protocol results are supportive only.',
  'Per-protocol analysis means counting only completers, and it can overstate the treatment effect.',
  'The per-protocol set and the ITT set agreed, both showing a risk reduction.',
  'The study reported no per-protocol analysis, only the intention-to-treat result.',
  // 中性报告（腿②缺省）
  '试验中脱落的患者偏多，数据可靠性有限，结论要谨慎。',
  '两组患者的依从性都在80%以上，脱落率很低。',
  '这项研究没有报告按方案分析集，只有意向性治疗分析的结果。',
  '虽然只看了完成治疗的受试者，样本量已经太小，说明不了任何问题。',
  '退出试验的患者特征与完成者不同，这会引入选择偏倚。',
  '完成全程治疗的患者肿瘤标志物下降更明显。',
  '服药依从性高与更好的健康结局相关，但可能只是自选择混杂。',
  '完成了半年随访的受试者共320人，随访完成率91%。',
  '按方案服药的患者比例越高，说明临床试验的质量控制越好。',
  'Many participants dropped out, so the reliability of the data is limited.',
  'Completers and dropouts differed in baseline characteristics, which introduces selection bias.',
  'Adherence was high in both arms, with few discontinuations.',
  'Among those who completed the trial, side effects were similar between groups.',
  'The trial stopped early, so the follow-up data remain incomplete.',
  'Adherence to the protocol was 85% in the treatment arm and 82% in the control arm.',
  // 锚前否定 / 对冲（守卫）
  '不能只看坚持服药的人，还要看全体受试者的结果。',
  '我们并未只统计完成者，全部入组患者都纳入了分析。',
  'We should not look only at those who completed the program; all randomized patients count.',
  // 相邻族射程（不判）
  '重症患者才用上了新药，所以他们的结局差不能全怪药效不好。',
  '吃维生素的人明显更健康，所以维生素让人健康。',
  '只统计点击了广告的用户，转化率非常高，说明营销有效。',
  'Sicker patients were given the new drug, so their worse outcomes reflect baseline risk.',
  'Supplement users are healthier, which proves vitamins keep you healthy.',
  'Among users who clicked the ad, conversion was very high, so the marketing works.',
];

let pass = 0, fail = 0;
const fails = [];
for (const s of ATTACK) {
  const r = detect(s);
  if (r.hit && r.dimension === 'per_protocol_misread' && r.severity > 0 && r.guidance && r.evidence && r.evidence.length > 0 && r.tags && r.tags.length > 0 && r.count >= 1) {
    pass++;
  } else {
    fail++; fails.push('ATTACK-MISS | ' + JSON.stringify(r).slice(0, 120) + ' | ' + s);
  }
}
for (const s of BENIGN) {
  const r = detect(s);
  if (!r.hit) { pass++; } else { fail++; fails.push('BENIGN-HIT | ' + r.details.slice(0, 100) + ' | ' + s); }
}
console.log('ATTACK ' + ATTACK.length + ' 条 + BENIGN ' + BENIGN.length + ' 条');
console.log('PASS ' + pass + ' / FAIL ' + fail);
for (const f of fails) console.log(f);
process.exit(fail === 0 ? 0 : 1);
