'use strict';
/**
 * scripts/round-392/probe-per-protocol.js — r392 立项探针
 * 候选族：per_protocol（按方案分析集误读 / per-protocol analysis misread）
 * 基线：合并树 HEAD（v6.8.193 + r392 claim）
 * 口径：hf.gate() 全量 findings，gate.action === 'pass' 记穿透（真零命中）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const gate = hf.gate || hf;

// 攻击集：r389 探针两段 E_per_protocol 全量（4+3 probe1 + 2+1 probe2）
const ATTACK = {
  zh: [
    '只分析完成全部疗程的患者，疗效非常显著，说明药物确实有效。',
    '排除不依从的受试者后，治疗组结局明显更好，可见药效可靠。',
    '按完成试验的人群分析，新疗法把风险降低了一半，这就是真实疗效。',
    '退出试验的人不用管，只看坚持下来的，效果依然明确。',
    '只统计按方案用药的人群，新药的效果非常确凿。',
    '依从性好的那部分患者效果显著，这就是药物的真实效果。',
    // 扩样（同族新措辞，验证射程覆盖而非仅探针原样）
    '只纳入按时服完药的受试者，这样测出来的疗效才是药物的真实水平。',
    '把中途停药的人都剔掉之后，剩余患者的治愈率非常高，足见药效过硬。',
    '只看完成了整个方案的那一组，新药的疗效确凿无疑。',
    '按方案集分析显示风险下降明显，可见疗效是确切的。',
    '坚持完成随访的患者结局最好，这就是治疗的真实效果。',
  ],
  en: [
    'Among patients who completed the full course, the drug clearly worked, proving its efficacy.',
    'Excluding non-adherent participants, the treatment halved the risk, which is the real effect.',
    'Looking only at those who finished the program, the outcome improvement is substantial.',
    'In the adherent subgroup the drug worked well, which is its true effect.',
    // 扩样
    'Counting only those who took the drug as prescribed, the treatment clearly works.',
    'Among completers the therapy performed remarkably well, which demonstrates its true efficacy.',
    'Restricting the analysis to adherent patients, the drug genuinely works.',
  ],
};

// 良性边界集（易误拦形：正确限定 / 概念教学 / 单腿陈述 / 相邻族领地）
const BENIGN = {
  zh: [
    '意向性治疗分析才是主分析，按方案分析只能作为辅助参考。',
    '按方案分析集破坏了随机化，两组不再可比，不能单独作为疗效证据。',
    '所谓按方案分析，是指只统计完成全程的受试者，它会高估治疗效果。',
    '试验中脱落的患者偏多，数据可靠性有限，结论要谨慎。',
    '按方案分析集的结果与意向性治疗分析一致，都显示风险下降。',
    '两组患者的依从性都在80%以上，脱落率很低。',
    '这项研究没有报告按方案分析集，只有意向性治疗分析的结果。',
    '虽然只看了完成治疗的受试者，样本量已经太小，说明不了任何问题。',
    '退出试验的患者特征与完成者不同，这会引入选择偏倚。',
    '完成全程治疗的患者肿瘤标志物下降更明显。',
    '只统计依从者会高估药效，这是按方案分析的已知缺陷。',
    '服药依从性高与更好的健康结局相关，但可能只是自选择混杂。',
    '完成了半年随访的受试者共320人，随访完成率91%。',
    '按方案服药的患者比例越高，说明临床试验的质量控制越好。',
    '脱落患者的后续结局未知，需要在意向性治疗框架下保守估计。',
  ],
  en: [
    'The intention-to-treat analysis is the primary; per-protocol results are supportive only.',
    'Per-protocol analysis means counting only completers, and it can overstate the treatment effect.',
    'Many participants dropped out, so the reliability of the data is limited.',
    'The per-protocol set and the ITT set agreed, both showing a risk reduction.',
    'The study reported no per-protocol analysis, only the intention-to-treat result.',
    'Completers and dropouts differed in baseline characteristics, which introduces selection bias.',
    'Adherence was high in both arms, with few discontinuations.',
    'Among those who completed the trial, side effects were similar between groups.',
    'The trial stopped early, so the follow-up data remain incomplete.',
    'Adherence to the protocol was 85% in the treatment arm and 82% in the control arm.',
  ],
};

// 相邻族射程对照（应不判——证明与 confounding_by_indication / healthy_user_bias /
//   proxy_metric_goal 的射程错开）
const SCOPE = {
  zh: [
    '重症患者才用上了新药，所以他们的结局差不能全怪药效不好。', // confounding_by_indication 领地
    '吃维生素的人明显更健康，所以维生素让人健康。', // healthy_user_bias 领地（r372 已落地）
    '只统计点击了广告的用户，转化率非常高，说明营销有效。', // proxy_metric_goal 领地
    '参加了筛查的人确诊数上升，说明筛查普及有问题。', // selection/screening 领地
  ],
  en: [
    'Sicker patients were given the new drug, so their worse outcomes reflect baseline risk.',
    'Supplement users are healthier, which proves vitamins keep you healthy.',
    'Among users who clicked the ad, conversion was very high, so the marketing works.',
  ],
};

function run(title, set) {
  let pen = 0, total = 0;
  const detail = [];
  for (const [lang, list] of Object.entries(set)) {
    for (const s of list) {
      total++;
      const r = gate(s);
      if (r.gate.action === 'pass') { pen++; detail.push('PENETRATED | [none] | ' + s); }
      else detail.push('caught(' + r.gate.action + ') | ' + JSON.stringify((r.findings || []).map(f => f.dimension)) + ' | ' + s);
    }
  }
  console.log('=== ' + title + ' ===');
  for (const d of detail) console.log(d);
  console.log('=> ' + title + ': ' + pen + '/' + total);
  return pen + '/' + total;
}

run('ATTACK', ATTACK);
run('BENIGN', BENIGN);
run('SCOPE', SCOPE);
