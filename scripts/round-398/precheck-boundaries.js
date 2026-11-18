// r398 边界行为预验：写轮测前先逐条确认边界锁方向
'use strict';
const { checkRedHerring } = require('/data/home/heartflow/src/red-herring.js');
const cases = [
  // [样本, 期望 hit]
  ['别再说我迟到了，公司去年不是也搞过一次团建吗？', true],
  ['你指责我贪污，可是你知道我这些年给灾区捐了多少钱吗？', true],
  ['疫苗的安全性问题，现在不是讨论的时候，当务之急是恢复经济。', true],
  ['你的代码有 bug，但是更重要的是，难道我们不该先谈谈竞争对手的漏洞吗？', true],
  ['财报的事现在不是讨论的时候，更重要的是竞争对手已经抢占了市场。', true],
  ['有人批评公司污染环境，但他们为当地创造了那么多就业。', true],
  ['You question the contract terms, yet our team has twenty years of experience.', true],
  ['They discussed the payroll problem, but the representative began to talk about industry-wide difficulties.', true],
  ['有人批评工厂污染环境，但他们捐建了希望小学，并且已经整改了排污问题。', false],
  ['Users complained about frequent crashes, but the latest version has already fixed most of the issues.', false],
  ['这家餐厅味道很好，但是价格有点贵。', false],
  ['有人批评方案成本高，但实施周期短其实是优势。', false],
  ['You complain about corruption, yet your own party has scandals too.', false],
  ['讨论疫苗安全性时，发言人开始讲自己小时候打疫苗的经历。', false],
  ['有人批评进度慢，但也许下个季度能赶上，这还要看资源到位情况。', false],
  ['先讨论预算问题，再讨论人事安排，我们一个一个来。', false],
  ['他把话题转到了自己的私生活上。', false],
  ['用户反映App经常闪退，但新版本已经修复了大部分问题。', false],
  ['这部电影有人说节奏慢，但它的配乐确实出色。', false],
  ['客户投诉系统卡顿，但工程师正在排查原因。', false],
];
let bad = 0;
for (const [t, want] of cases) {
  const got = checkRedHerring(t).hit;
  const ok = got === want;
  if (!ok) bad++;
  console.log(`${ok ? 'OK ' : 'BAD'} want=${want} got=${got} | ${t}`);
}
console.log(`预验结果: ${cases.length - bad} 通过, ${bad} 失败, 共 ${cases.length} 个`);
if (bad) process.exit(1);
