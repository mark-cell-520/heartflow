// 第 289 轮 v6：验证 src/index.js 里 PSEUDO_PHILOSOPHY_ZH 新增 9 条正则的
// 实际命中与误伤（通过真实 gate.checkOutput，不复述样本到报告）。
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));

const ONTO = [
  '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
  '时间是最温柔的暴政，它在流逝中定义我们的存在。',
  '真正的自由不是想做什么就做什么，而是不想做什么就不做什么。',
  '生命是一场没有地图的旅行，每一步都是答案。',
  '成长就是一次又一次把自己打碎再拼起来的过程。',
  '真正的成熟，是终于学会与不完美的自己和解。',
  '孤独是成长的必修课，它让我们有机会与自己对话。',
  '自由不是随心所欲，而是自我主宰。',
  '生活就像一盒巧克力，你永远不知道下一颗是什么味道。',
  '真正的勇气，不是没有恐惧，而是带着恐惧依然前行。',
  '所有的离别，都是为了更好的重逢。',
  '生命的意义不在于长短，而在于我们如何度过。',
  '时间会治愈一切创伤，只要你愿意给它一个机会。',
  '幸福不是拥有得多，而是计较得少。',
  '沉默是最深沉的告别，胜过千言万语。',
  '真正的智慧，是知道自己不知道什么。',
];

const BENIGN = [
  '这本书是我的朋友送的。',
  '这段代码是系统的核心模块。',
  '孤独是每个人都会经历的情绪。',
  '时间是有限的资源，所以要优先做重要的事。',
  '成长需要耐心，不能一蹴而就。',
  '自由不是无代价的，它需要法律来保障。',
  '地图上显示前方三公里有加油站。',
  '他把玻璃杯打碎了。',
  '这个方案不是最优的，但是在当前约束下最可行。',
  '问题不在于能力，而在于时间安排。',
  '离开不代表结束，而是新的合作形式的开始。',
];

let own = 0; const miss = [];
for (const t of ONTO) {
  const r = gate.checkOutput(t);
  const isOwn = (r.findings || []).some(f => f.dimension === 'pseudo_profundity');
  if (isOwn) own++; else miss.push(`${r.gate.action} | ${(r.findings||[]).map(f=>f.dimension).join(',')||'-'} | ${t.slice(0,18)}`);
}
console.log(`本维度归因: ${own}/${ONTO.length}`);
for (const m of miss) console.log('  MISS ' + m);

let fp = 0;
for (const t of BENIGN) {
  const r = gate.checkOutput(t);
  const isOwn = (r.findings || []).some(f => f.dimension === 'pseudo_profundity');
  if (isOwn) { fp++; console.log('  FP ' + t); }
}
console.log(`自造良性误伤: ${fp}/${BENIGN.length}`);
