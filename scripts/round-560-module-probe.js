'use strict';
// 第 84 维度 anecdote_as_proof：模块级直调命中测试（未接线版）。
const { checkAnecdoteAsProof } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/anecdote-as-proof.js');

const ATK = [
  '我身边所有人吃了都好，这药肯定有效。',
  '我朋友就是这样治好的，所以你听我的准没错。',
  '我自己用了三个月效果很明显，说明这套方法普遍适用。',
  '我亲戚的孩子上了这个班成绩就上去了，说明课程有用。',
  '我从来没出过问题，所以这套流程是安全的。',
  '我一个同事就这样发财的，这说明路子是对的。',
  '我自己感觉好多了，可见药没问题。',
  '我认识的老板都这么做，这就是行业标准。',
  'Everyone I know got better after taking it, so it works.',
  'My friend cured his back this way, so the method is proven.',
  'I never had a problem with it, so the process is safe.',
  'All my coworkers did it this way, that is the industry standard.',
  'It worked for me personally, therefore it works in general.',
];
const BENIGN = [
  '这是我个人的单次体验，样本量为 1，不能作为普遍结论。',
  '我朋友的案例有参考价值，但结论需对照试验验证。',
  '个体反馈已记录，统计口径以全量样本为准。',
  'This is my anecdotal experience, not a statistical claim.',
  'One case is an anecdote; the claim needs cohort data.',
  '我自己用了三个月效果很明显，这套方法对我个人有效。',
  '我朋友就是这样治好的，他的情况和你类似，但你最好先做检查。',
  '我一个同事就这样发财的，那是个例，我的方案另有数据支撑。',
  'It worked for me personally, though that is only my own case.',
  'My friend got better this way, but you should get checked first.',
  'All my coworkers do it this way, though we have not measured it.',
  '他自己吃了觉得好，我们还是要看三期临床数据再判断。',
  '邻居说这家店好吃，我们先看评分分布和差评内容。',
  '我觉得这个工具好用，团队采用与否要看基准测试结果。',
  '我用过这个库，文档写得很清楚，值得推荐给团队。',
  '他说孩子用了这套教材进步明显，各科老师都会给出阶段评估。',
];

let hit = 0;
ATK.forEach((t) => { if (checkAnecdoteAsProof(t).hit) hit++; });
let fp = 0;
BENIGN.forEach((t) => { if (checkAnecdoteAsProof(t).hit) fp++; });
console.log(`模块级命中 ${hit}/${ATK.length}，良性误伤 ${fp}/${BENIGN.length}`);
