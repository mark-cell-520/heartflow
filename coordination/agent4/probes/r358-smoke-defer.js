'use strict';
// r358 冒烟实测：red_herring 时机搁置族（defer）落地验证。
const { checkRedHerring } = require('/data/home/heartflow/src/red-herring.js');

const ATK = [
  '疫苗的安全性问题，现在不是讨论的时候，当务之急是恢复经济。',
  '现在还不是谈论房价泡沫的时候，当务之急是把就业搞上去。',
  '数据泄露的事现在谈不合时宜，我们更应该关注竞争对手的动态。',
  '现在讨论预算赤字为时尚早，大家应该聚焦如何打赢这场价格战。',
  'Now is not the time to talk about the budget deficit, we need to focus on job creation.',
  'It is too early to discuss the layoffs; the real priority is the product launch.',
  '财报的事现在不是讨论的时候，更重要的是竞争对手已经抢占了市场。',
  '安全事故现在谈论还为时过早，当务之急是稳住投资者信心。',
  '这个问题现在讨论还太早，当下最关键的是把现金流稳住。',
  '薪酬的问题眼下不是谈论的时候，当务之急是拿下明年的融资。',
];
const BEN = [
  '疫苗的安全性问题，现在不是讨论的时候，等三期临床数据出来再说。',
  '现在还不是庆祝的时候，等测试全部通过再开香槟。',
  '现在不是讨论假期安排的时候，我们先把项目交付做完。',
  '房价泡沫的问题现在谈不合时宜，等这轮政策效果显现后再评估。',
  '现在不是讨论技术细节的时候，我们先看整体架构。',
  '数据泄露的事现在谈不合时宜，等调查结果公布再下结论。',
  '这个问题现在不是讨论的时候。',
  '现在不是说这些的时候，等时机成熟再说。',
  'It is too early to discuss the results, we should wait until the data is in.',
  'Now is not the time to talk about the budget, let us first finish the audit.',
  '红鲱鱼谬误是指用另一议题顶替原议题以回避回应。',
  '我来说明一下：现在不是讨论责任的时候，关键是修复系统。',
];

let hit = 0, fp = 0;
for (const t of ATK) {
  const r = checkRedHerring(t);
  console.log((r.hit ? 'HIT ' : 'MISS') + ' | ' + (r.details || '').slice(0, 64) + ' :: ' + t.slice(0, 32));
  if (r.hit) hit++;
}
console.log('--- benign ---');
for (const t of BEN) {
  const r = checkRedHerring(t);
  console.log((r.hit ? 'FP! ' : 'ok  ') + ' | ' + (r.details || '').slice(0, 56) + ' :: ' + t.slice(0, 32));
  if (r.hit) fp++;
}
console.log(`attack ${hit}/${ATK.length}  benign fp ${fp}/${BEN.length}`);
