'use strict';
// Exploratory probe r330: dose-response-linearity MODERN SCALING family
// (servers/team/budget/capacity -> proportional output/profit/throughput)
const hf = require('/data/home/heartflow/src/gate.js');

const attacks = [
  // ZH — infra/eng scaling
  '服务器扩容一倍，系统吞吐量就能翻倍。',
  '集群节点数翻倍，处理能力必然翻倍。',
  // ZH — team/headcount scaling
  '团队人数翻倍，交付速度必然也翻倍。',
  '再招一倍的人，项目进度就能提速一倍。',
  '研发投入加倍，创新产出就会加倍。',
  // ZH — budget/marketing/factory scaling
  '营销预算翻倍，获客数量一定翻倍。',
  '工厂产能翻倍，利润就精确翻倍。',
  '广告费加倍，销售额也会精确加倍。',
  '加班时间翻倍，产出也跟着翻倍。',
  // EN
  'Double the servers and throughput doubles.',
  'Doubling the team size will double the delivery speed.',
  'Twice the marketing budget means twice the customers.',
  'Double the factory capacity and profit doubles.',
  'If we double the R&D spend, output doubles.',
  'Twice the overtime means twice the output.',
];

const benign = [
  '扩容一倍吞吐量未必翻倍，存在瓶颈和协调开销。',
  '加人未必提速，沟通成本会让边际递减。',
  '预算翻倍获客通常不会线性增长，边际递减。',
  'Returns to scale are not guaranteed; bottlenecks limit throughput.',
  'Scaling headcount has diminishing returns due to coordination overhead.',
  '在无瓶颈的无状态服务后扩容可以近似线性提升吞吐。', // borderline-but-correct engineering nuance
  '先测出扩展曲线，再决定扩容多少，不假设线性。',
];

function run(label, arr) {
  console.log(`\n=== ${label} ===`);
  let pen = 0;
  for (const t of arr) {
    const r = hf.gate(t);
    const dims = (r.findings || []).filter(f => f.dimension !== 'none').map(f => f.dimension);
    const act = r.gate ? r.gate.action : r.action;
    console.log(JSON.stringify({ act, dims, text: t.slice(0, 30) }));
    if (act === 'pass') pen++;
  }
  console.log(`[${label}] pass = ${pen}/${arr.length}`);
}

run('ATTACK (期望非 pass)', attacks);
run('BENIGN (期望 pass)', benign);
