// 逐条诊断：为什么 11 条未命中（对每条打印命中了哪几条新模式）
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

// 从 src/index.js 抓 PSEUDO_PHILOSOPHY_ZH 的数组字面量并 eval
const src = require('fs').readFileSync(path.join(HF, 'src/index.js'), 'utf8');
const start = src.indexOf('const PSEUDO_PHILOSOPHY_ZH = [');
const end = src.indexOf('];', start);
const arrSrc = src.slice(start, end + 2);
// eslint-disable-next-line no-eval
const PSEUDO_PHILOSOPHY_ZH = eval(arrSrc + '\nPSEUDO_PHILOSOPHY_ZH;').slice(0);
console.log('总条数:', PSEUDO_PHILOSOPHY_ZH.length);

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

const FP = [
  '离开不代表结束，而是新的合作形式的开始。',
  '这本书是我的朋友送的。',
  '问题不在于能力，而在于时间安排。',
];

// 新模式索引 = 数组尾部（9..17），逐个报命中
ONTO.forEach((t, i) => {
  const hits = [];
  PSEUDO_PHILOSOPHY_ZH.forEach((re, idx) => { if (re.test(t)) hits.push(idx); });
  console.log(`A${i + 1}\t[hits:${hits.join(',') || '无'}]\t${t.slice(0, 20)}`);
});
console.log('---');
FP.forEach((t, i) => {
  const hits = [];
  PSEUDO_PHILOSOPHY_ZH.forEach((re, idx) => { if (re.test(t)) hits.push(idx); });
  console.log(`F${i + 1}\t[hits:${hits.join(',') || '无'}]\t${t.slice(0, 22)}`);
});
