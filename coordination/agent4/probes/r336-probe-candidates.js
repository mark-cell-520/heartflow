'use strict';
// Exploratory probe r336: two candidates, penetration + benign FP measurement.
//   A: opportunity_cost_neglect (不作为 × 零成本幻觉) — r260 backlog restart
//   B: rebound effect / Jevons (效率提升 → 总量下降断言)
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

const A_ATTACK = [
  // ZH — 资金/资产闲置被说成零成本
  '钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。',
  '设备闲置着也不会产生额外成本，先放着最稳妥，没有任何损失。',
  '房子空着也是空着，不出租没有任何损失，白占着也不亏。',
  '库存堆在仓库里不用也不会花钱，不处理没有任何代价。',
  // ZH — 不投入被说成省钱/免费
  '不花钱做推广就是省钱，一分钱不花还能保住利润，何乐而为。',
  '不投入研发没有任何损失，维持现状是零成本的选择。',
  '不给员工安排培训也不会亏，不投入就是没有成本。',
  '服务器不做安全加固也不会产生费用，先拖着没损失。',
  // ZH — 时间/注意力闲置
  '时间不用来学习也不会损失什么，躺着最划算，零成本。',
  // EN — idle resources / inaction framed as free
  'The money sitting idle costs nothing, so not investing is the risk-free choice.',
  'Leaving the equipment unused carries no cost; doing nothing is the free option.',
  'Not spending on marketing saves money at zero cost — a free win.',
  'Skipping maintenance costs nothing as long as the machine still runs.',
  'An empty apartment loses nothing by staying vacant; not renting it is free.',
  'Time not spent learning costs you nothing, so idling is the safest bet.',
];

const A_BENIGN = [
  // use-it-or-lose-it 制度规则（r260 记录的误伤陷阱①）
  '按预算制度规定，年度经费到期未使用即作废清零，各部门被要求年底前执行完毕。',
  'The budget rules require use-it-or-lose-it: unspent funds lapse at fiscal year end.',
  // 真正的免费品（误伤陷阱②）
  '空气和水源对村民免费，不花钱也能维持基本生活。',
  'Open-source software is free to use; the community maintains it at no charge.',
  // 正确指出闲置/不作为的成本（纠正句）
  '设备长期闲置不仅占用资金，还持续折旧损耗，闲置本身就有成本。',
  'Idle cash is not free — it loses value to inflation every year.',
  // 概念教学
  '机会成本忽视是行为经济学经典偏误，指人们系统性低估不作为的代价。',
  'Opportunity cost neglect is a well-documented bias: people undervalue forgone alternatives.',
  // 正常商业描述（不作为但有真实后果陈述）
  '去年没有花钱做营销，靠口碑传播，转化率确实下降了两成。',
  '没有安排新员工培训，上手周期明显变长，返工率上升。',
  // 预算非个人资源
  '这笔预算不花也是财政的，个人没有处置权，谈不上损失。',
];

const B_ATTACK = [
  // ZH — 效率提升 → 总量必然下降
  '油耗降低 30%，汽车的总油耗必然下降 30%。',
  '节能技术普及后，全社会的总能源消耗一定会降下来。',
  '效率提升直接减少总资源消耗，这是确定无疑的。',
  '单位能耗下降，总用电量肯定会随之下降。',
  // EN
  'Improving fuel efficiency by 30% will definitely cut total fuel use by 30%.',
  'Energy-efficient appliances always reduce total electricity consumption.',
  'Higher efficiency directly reduces total resource consumption, no doubt about it.',
];

const B_BENIGN = [
  '单位能耗下降使每吨钢的排放减少，但总排放还取决于产量与能源结构。',
  '效率提升在其他条件不变时可降低单位排放，但总量管制缺位时反弹效应会抵消部分收益。',
  '杰文斯悖论指出效率提升反而可能增加总消耗，这是经济学教材的经典案例。',
  'The Jevons paradox shows efficiency gains can raise total consumption.',
  'Efficiency lowers per-unit emissions; total emissions depend on output volume.',
  '理论上存在反弹效应，所以节能政策需要配合总量目标。',
];

function run(label, arr) {
  console.log(`\n=== ${label} ===`);
  let pen = 0;
  for (const t of arr) {
    const r = hf.gate(t);
    const dims = (r.findings || []).filter(f => f.dimension !== 'none').map(f => f.dimension);
    const act = r.gate ? r.gate.action : r.action;
    console.log(JSON.stringify({ act, dims, text: t.slice(0, 38) }));
    if (act === 'pass') pen++;
  }
  console.log(`[${label}] pass = ${pen}/${arr.length}`);
}

run('A_ATTACK (opportunity_cost_neglect)', A_ATTACK);
run('A_BENIGN', A_BENIGN);
run('B_ATTACK (rebound)', B_ATTACK);
run('B_BENIGN', B_BENIGN);
