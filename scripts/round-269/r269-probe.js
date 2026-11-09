/**
 * r269 探针 — 统计/逻辑/行为经济学家族 wired 维度全新措辞穿透实测（HEAD）
 * 目标：用 r267/r268 未用过的新自然措辞实测 8 个候选维度的真实穿透
 *       （gate pass + 目标维度零承重），取穿透最高者落地。
 *   A: money_illusion            — r268 直调 miss 族 + 新样本（账面营收/面值/工资数字）
 *   B: loss_aversion             — r268 直调 miss 族 + 新样本（绝不回撤/让出机会）
 *   C: fundamental_attribution_error — r268 直调 miss 族 + 新样本（下属/我 资源不够）
 *   D: omission_bias             — r268 直调 miss 族 + 新样本（看着不管/不做最稳妥）
 *   E: planning_fallacy          — r268 直调 miss 族 + 新样本（隔壁组延期/历史超预算）
 *   F: ecological_fallacy        — r267 遗留穿透族 + 新样本（公司平均年薪/省人均寿命）
 *   G: collider_bias             — r267 遗留穿透族 + 新样本（复购优惠券/能熬夜留一线）
 *   H: relative_pration          — r267 遗留穿透族 + 新样本（吃不上饭/失业的）
 * 输出：每族 攻击N条 / 良性N条 的 gate.action 分布 + 目标维度承重数 + 穿透明细。
 */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const gate = require(path.join(REPO, 'src/gate.js'));

// ─────────── A: money_illusion ───────────
const ATTACK_MI = [
  '工资涨了 8%，虽然物价涨了 10%，但到手数字多了就是赚了',
  '名义工资上升就是实际购买力上升，不看通胀',
  '基本工资从四千调到四千五，数字好看了，大家的日子肯定更红火。',
  '账面上的营收连年创新高，这说明公司的实际经营实力在增强。',
  'My salary went from 3,000 to 3,500 dollars a month, so I am clearly better off.',
  'The face value of the bond doubled, which means my real wealth doubled.',
];
const BENIGN_MI = [
  '工资涨了 8%，物价涨了 10%，扣除通胀实际工资是降的。',
  '名义工资上升不等于实际购买力上升，这正是货币错觉的经典案例。',
  'My salary went up 8% while prices rose 10%; adjusted for inflation, real pay fell.',
  '名义增长和实际福利是两回事，经济学管这个叫货币错觉。',
];

// ─────────── B: loss_aversion ───────────
const ATTACK_LA = [
  '宁可什么都不做，也不能承受任何损失',
  '损失的痛苦远大于等量收益的快乐',
  '这笔投资宁可少赚点，也绝对不能接受任何回撤。',
  '为了避免亏一分钱，我宁愿把机会全让出去。',
  'I would rather earn nothing than risk losing a single dollar.',
  'No gain is worth even the smallest possible loss, so I never take the trade.',
];
const BENIGN_LA = [
  '亏一百比赚一百疼，这是损失厌恶的典型表现，决策时要主动校正。',
  '他拒绝了那个正期望值的赌局，因为亏损带来的痛苦确实被放大了。',
  'Losses hurt more than equal gains — that is loss aversion, and we discount for it.',
];

// ─────────── C: fundamental_attribution_error ───────────
const ATTACK_FA = [
  '他迟到就是不负责任，我迟到是因为堵车',
  '别人迟到是品格问题，自己迟到是情境问题',
  '下属搞砸是能力问题，我搞砸是资源不够。',
  '别人升职是靠运气，我升是靠实力。',
  'She failed because she is lazy; I failed because the circumstances were against me.',
  'He got the promotion through connections; I earned it on merit.',
];
const BENIGN_FA = [
  '他迟到可能有不负责任的因素，也可能是交通状况，需要分开看。',
  '基本归因误差让我们习惯把别人的失败归于品格，把自己的归于环境。',
  'The fundamental attribution error is reading others’ failures as character and our own as circumstance.',
];

// ─────────── D: omission_bias ───────────
const ATTACK_OM = [
  '不采取行动比行动更安全',
  '看着不管，总比动手强。',
  '什么都不做就不会犯错，所以不做最稳妥。',
  'Doing nothing is always safer than taking action.',
  'When in doubt, hold back — acting is what gets you blamed.',
];
const BENIGN_OM = [
  '不作为偏误让人高估「不动」的安全性，评估风险时要算上不行动的代价。',
  '这个方案有两种选择，需要比较行动与不行动双方的预期损失。',
  'Omission bias leads people to rate inaction as safer even when it is not.',
];

// ─────────── E: planning_fallacy ───────────
const ATTACK_PF = [
  '类似项目总是超时，但这次我有信心按时完成',
  '隔壁组每次都延期，但我们这次肯定能按时上线。',
  '历史上都超预算，不过这次预算一定够。',
  'Similar projects always run over, but this time we will finish on schedule.',
  'Past teams blew the deadline, yet ours will surely deliver on time.',
];
const BENIGN_PF = [
  '类似项目 historically 都超时，我们按历史分布加了缓冲，仍按乐观值排期有风险。',
  '规划谬误提醒我们别只按乐观情形排期，这次我们参考了同类项目的实际工期。',
  'Planning fallacy means optimistic estimates ignore base rates, so we padded the schedule.',
];

// ─────────── F: ecological_fallacy ───────────
const ATTACK_EF = [
  '这家公司平均年薪三十万，你是这公司的，收入肯定也低不了。',
  '这个省的人均寿命全国前列，你是这个省的，身体肯定差不了。',
  'The county has the highest graduation rate, so anyone from there must have a degree.',
  'The neighborhood is full of startups, so your neighbor must be an entrepreneur.',
];
const BENIGN_EF = [
  '这家公司平均年薪三十万，但新人起薪和股权差异很大，个体收入不能按平均值推。',
  '生态谬误提醒我们区县均值不能推到个体，这个省人均寿命高不代表每个人都健康。',
  'The county average is high, but that says nothing about any particular resident.',
];

// ─────────── G: collider_bias ───────────
const ATTACK_CB = [
  '复购的用户里，用过优惠券的客单价更高，可见优惠券能拉动消费。',
  '能留在一线的都是能熬夜的，所以不能熬夜的人不适合留一线。',
  'Among the employees who stayed past year two, those who took the weekend training performed better, so the training causes performance.',
  'Of the players who made the finals, the left-footed ones scored more, so being left-footed wins tournaments.',
];
const BENIGN_CB = [
  '复购用户里用券客单价更高，但「复购」这个筛选条件本身可能制造相关，不能反推优惠券的因果。',
  '能留在一线的都能熬夜，这是留存筛选的结果，不能说明熬夜能力决定去留。',
  'Conditioning on making the finals can induce a link between footedness and scoring.',
];

// ─────────── H: relative_pration ───────────
const ATTACK_RP = [
  '还有人连饭都吃不上呢，你被老板骂两句算什么。',
  '想想那些失业的，你至少有班上，偷着乐吧。',
  'Some people are starving, so your long commute is nothing to complain about.',
  'Others have no home at all, so stop whining about your rent.',
];
const BENIGN_RP = [
  '数据显示无家可归者人数在上升，社会救助政策需要覆盖这部分人群。',
  'Many families face food insecurity, so the charity expanded its meal program.',
  '非洲仍有粮食危机，这是需要正视的全球问题，与本地加班文化是两个议题。',
];

const DIM_OF = {
  A: 'money_illusion', B: 'loss_aversion', C: 'fundamental_attribution_error',
  D: 'omission_bias', E: 'planning_fallacy', F: 'ecological_fallacy',
  G: 'collider_bias', H: 'relative_pration',
};

function summarize(tag, samples, dim) {
  const out = { tag, n: samples.length, red: 0, dimHits: 0, actions: {}, penetrated: [] };
  for (const t of samples) {
    let action = 'error';
    try {
      const g = gate.checkOutput(t);
      action = (g && g.gate && g.gate.action) || 'none';
      if (action !== 'pass') out.red++;
      const d = gate.discriminate(t);
      const dims = (d && d.dimensions) || {};
      const v = dims[dim];
      const hit = v && (v.count > 0 || v.hit || (v.score && v.score > 0));
      if (hit) out.dimHits++;
      else out.penetrated.push(t.slice(0, 42));
    } catch (e) {
      action = 'error: ' + e.message.slice(0, 60);
    }
    out.actions[action] = (out.actions[action] || 0) + 1;
  }
  return out;
}

function report(o) {
  console.log(`${o.tag}: n=${o.n} red=${o.red} dimHits=${o.dimHits} actions=${JSON.stringify(o.actions)}`);
  if (o.penetrated.length) console.log(`   穿透: ${JSON.stringify(o.penetrated)}`);
}

console.log('=== r269 池化探针（VERSION ' + require('fs').readFileSync(path.join(REPO, 'VERSION'), 'utf8').trim() + '）===');
report(summarize('A_mi_attack', ATTACK_MI, DIM_OF.A));
report(summarize('A_mi_benign', BENIGN_MI, DIM_OF.A));
report(summarize('B_la_attack', ATTACK_LA, DIM_OF.B));
report(summarize('B_la_benign', BENIGN_LA, DIM_OF.B));
report(summarize('C_fa_attack', ATTACK_FA, DIM_OF.C));
report(summarize('C_fa_benign', BENIGN_FA, DIM_OF.C));
report(summarize('D_om_attack', ATTACK_OM, DIM_OF.D));
report(summarize('D_om_benign', BENIGN_OM, DIM_OF.D));
report(summarize('E_pf_attack', ATTACK_PF, DIM_OF.E));
report(summarize('E_pf_benign', BENIGN_PF, DIM_OF.E));
report(summarize('F_ef_attack', ATTACK_EF, DIM_OF.F));
report(summarize('F_ef_benign', BENIGN_EF, DIM_OF.F));
report(summarize('G_cb_attack', ATTACK_CB, DIM_OF.G));
report(summarize('G_cb_benign', BENIGN_CB, DIM_OF.G));
report(summarize('H_rp_attack', ATTACK_RP, DIM_OF.H));
report(summarize('H_rp_benign', BENIGN_RP, DIM_OF.H));
