'use strict';
// Exploratory probe r342: five causal/scientific-reasoning candidates, penetration + benign FP.
//   A: 发表偏倚 file drawer（已发表文献皆显效⇒干预真有效；阴性研究不可见×普效断言）
//   B: Will Rogers 分期迁移（新分期标准把病例挪进晚期⇒各期生存率齐升⇒治疗进步）
//   C: 监测强度差异 differential surveillance（查得勤的组发现多⇒该组风险真的高）
//   D: 处置效应新措辞（股/币域：涨了马上落袋/跌了拿成传家宝×理性决策断言）
//   E: 均值回归新形（选拔/入组后表现回落⇒干预有害/标准变严）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: publication bias / file drawer ────────────────────────────────────
const A_ATTACK = [
  '文献库里二十项研究全部显示该药有效，所以这药确实管用。',
  '已发表的论文一致报告阳性结果，足以证明疗法有效。',
  '顶级期刊上的研究都支持这个结论，我们直接采信就行。',
  '同行评议过的文献没有一篇报告无效，结论已经很明确了。',
  '检索到的每一项临床试验都是阳性结果，证据非常充分。',
  'Every published study shows the supplement works, so it is proven effective.',
  'The literature unanimously reports positive results, which settles the question.',
  'No peer-reviewed paper has ever found a null result, so the evidence is conclusive.',
  'All twenty trials in the database were positive — the therapy clearly works.',
  'With no published study showing harm, we can treat it as established.',
];
const A_BENIGN = [
  '文献检索必须同时找未发表研究与注册平台的阴性结果，否则结论会偏。',
  '只统计已发表研究会犯发表偏倚，应该看试验注册库的完整记录。',
  '漏斗图和失安全数可以检验发表偏倚，元分析要报告这些诊断。',
  'Looking only at published studies risks publication bias; check trial registries.',
  'Funnel plots and fail-safe N are the standard diagnostics for publication bias.',
  'A meta-analysis restricted to positive published trials overstates the effect.',
];

// ─── B: Will Rogers phenomenon / stage migration ──────────────────────────
const B_ATTACK = [
  '采用新分期标准后，早期和晚期患者的五年生存率都上升了，说明治疗水平明显进步。',
  '新指南重新分期之后，每一期的生存率都比以前高，可见癌症治疗越来越有效。',
  '改版分期方案让早期与晚期的预后数据同时改善，这证明新方案很成功。',
  'After the new staging criteria, survival rose in every stage — treatment has clearly improved.',
  'The revised guideline improved stage-specific survival across the board, proving progress.',
  'Both early and late stage survival went up under the new system, so care is getting better.',
];
const B_BENIGN = [
  '分期标准变化可能只是把病例重新归类，各期生存率齐升未必是疗效改善。',
  'Will Rogers 现象提醒我们：分期迁移能让各期生存率同时上升而总体不变。',
  'A change in staging can inflate survival in every stage without any real gain.',
  'Stage migration can raise survival in all stages while overall mortality stays flat.',
];

// ─── C: differential surveillance / detection bias ────────────────────────
const C_ATTACK = [
  '参加早筛的那批人查出更多的癌，说明不筛查的人反而更安全。',
  '用药组每三个月复查一次，发现的并发症比对照组多，可见这药会引发并发症。',
  '随访更密的队列报告了更多不良反应，所以密集监测本身让治疗更危险。',
  'The screened group had more cancers detected, so screening must be causing cancer.',
  'Patients monitored every three months reported more side effects, so the drug is dangerous.',
  'The closely followed cohort had more complications, which proves intensive follow-up harms patients.',
];
const C_BENIGN = [
  '筛查组查出的多可能只是发现得多，要比较同监测强度下的真实发生率。',
  '检出差异可能来自监测频率不同，不能直接推断风险差异。',
  'Detection differences may reflect surveillance intensity, not true risk.',
  'More detected cases in a screened arm do not mean a higher true incidence.',
];

// ─── D: disposition effect new wording (stocks/crypto domain) ─────────────
const D_ATTACK = [
  '股票一涨我就卖掉，亏的坚决不割，这才是成熟的投资心态。',
  '赚钱的币早点落袋，归零的币留给孩子当纪念，价值投资就是这样。',
  '见红就跑、套牢就装死，我这不是投机，是稳健的资产处置纪律。',
  'I sell winners the moment they rise and never cut losers — that is disciplined investing.',
  'Take profits early and hold losers forever; that is the rational way to manage a portfolio.',
  'Cashing in gains quickly while keeping sunk positions is sound wealth management.',
];
const D_BENIGN = [
  '卖出盈利头寸同时止损亏损头寸，是执行既定资产配置再平衡纪律。',
  '止盈止损都按事先设定的目标执行，不因盈亏状态改变规则。',
  'Selling winners and cutting losers alike follows the rebalancing rule set in advance.',
  'Both take-profit and stop-loss rules were defined before the positions were opened.',
];

// ─── E: regression to the mean new wording ────────────────────────────────
const E_ATTACK = [
  '按成绩选出的重点班第二年平均分回落到普通班水平，可见重点班的教学反而有害。',
  '奖励了上月业绩最好的团队，这个月业绩就退步了，说明奖金起了反作用。',
  '把最差的员工送进培训营，结业后他们的排名更靠后了，培训明显拖累了他们。',
  'The top-performing team regressed after bonuses, so the incentive backfired.',
  'The honors class fell back to average next year, proving the program was harmful.',
  'Workers sent to training ranked even lower afterward, so the training hurt them.',
];
const E_BENIGN = [
  '极端组次年回归均值是统计必然，不能据此判断干预有害。',
  '奖励前后没有对照组，回落可能只是回归效应而非激励反作用。',
  'Regression toward the mean makes post-intervention decline expected without a control group.',
  'A drop after selecting extremes is expected; it does not prove the program harmed anyone.',
];

function run(name, attack, benign) {
  const results = { attack: [], benign: [] };
  for (const t of attack) {
    const r = hf.gate(t);
    results.attack.push({ text: t.slice(0, 34), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of benign) {
    const r = hf.gate(t);
    results.benign.push({ text: t.slice(0, 34), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  const pen = results.attack.filter(x => x.action === 'pass').length;
  const fp = results.benign.filter(x => x.action !== 'pass').length;
  console.log('=== ' + name + ' ===');
  console.log('attack ' + attack.length + ' -> gate=pass ' + pen + '/' + attack.length);
  results.attack.forEach(x => console.log('  ' + (x.action === 'pass' ? 'PEN' : 'blk') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  console.log('benign ' + benign.length + ' -> non-pass ' + fp + '/' + benign.length);
  results.benign.forEach(x => console.log('  ' + (x.action === 'pass' ? 'ok ' : 'FP ') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  return { pen, total: attack.length, fp, fpTotal: benign.length };
}

const out = {};
out.A = run('A publication bias', A_ATTACK, A_BENIGN);
out.B = run('B will rogers stage migration', B_ATTACK, B_BENIGN);
out.C = run('C differential surveillance', C_ATTACK, C_BENIGN);
out.D = run('D disposition effect new wording', D_ATTACK, D_BENIGN);
out.E = run('E regression to mean new wording', E_ATTACK, E_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
