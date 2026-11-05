// r218 快速探针：zero_sum_fallacy 模块对 B 族攻击/良性的原始表现
'use strict';
const path = require('path');
const { checkZeroSumFallacy } = require(path.join(__dirname, '..', '..', '..', 'src', 'zero-sum-fallacy.js'));

const attacks = [
  // r217 探针 B 族原样
  ['B1-ZH', '这笔贸易里对方赚了大头，说明我们这边肯定亏了。'],
  ['B2-ZH', '他们出口越多赚得越多，我们买得越多就亏得越多。'],
  ['B3-ZH', '买家省了钱，那卖家必然多付了代价，一进一出总有人吃亏。'],
  ['B4-EN', 'They profited from the deal, which means we must have lost.'],
  ['B5-EN', 'Every dollar they earn from this trade is a dollar taken from us.'],
  // 扩展变体（裸词/带修饰/倒装/长句/同义替换）
  ['X1-ZH', '贸易是零和博弈，一方所得必然是另一方所失。'],
  ['X2-ZH', '对方赚的就是我们亏的，这笔交易对我们没什么好处。'],
  ['X3-ZH', '他们每多赚一块钱，我们就白白损失一块钱。'],
  ['X4-ZH', '一方赚得盆满钵满，另一方注定血本无归。'],
  ['X5-ZH', '这笔合作他们拿走了大头，我们自然是吃亏的一方。'],
  ['X6-ZH', '市场竞争你死我活，他们多卖一件我们就少卖一件。'],
  ['X7-ZH', '他们赚的每一分钱，都等于从我们口袋里拿走的一份。'],
  ['X8-EN', 'The more they sell us, the more we lose.'],
  ['X9-EN', 'Their profit comes straight out of our pocket.'],
  ['X10-EN', 'What they gain in this deal, we inevitably lose.'],
  ['X11-EN', 'Their gain is our loss; trade is just moving money around.'],
  ['X12-EN', 'One side benefits only because the other side is overpaying.'],
  ['X13-ZH', '他们出口越多赚得越多，我们买得越多就亏得越多，这是明摆着的。'],
  ['X14-ZH', '别被双赢话术骗了，这笔买卖里他们拿走的全是我们吐出去的。'],
  ['X15-EN', 'Every dollar they earn from this trade is a dollar taken from us, plain and simple.'],
  // 反问形（用否定句式/问号包装的断言）
  ['X16-ZH', '这不是零和是什么？对方赚的每一分都是我们亏的。'],
  ['X17-ZH', '难道他们赚大头，我们还能不亏吗？'],
];

const benigns = [
  ['BB1-ZH', '自愿交易通常让双方都受益，对方赚钱并不意味着我们吃亏。'],
  ['BB2-EN', 'A voluntary exchange can leave both sides better off; their gain is not our loss.'],
  ['BA1-ZH', '设备虽然已经买了，但继续自产会占用产能，要把替代用途的价值算进去再比较。'],
  ['N1-ZH', '零和博弈是指一方的收益必然等于另一方的损失，这是一个博弈论概念。'],
  ['N2-ZH', '不要把贸易看成零和博弈，自愿交易能让双方都受益。'],
  ['N3-ZH', '双赢的合作让双方都受益，这不是零和博弈。'],
  ['N4-ZH', '这笔交易双方都获得了自己更看重的东西，是双赢。'],
  ['N5-ZH', '他们利润增长的同时，我们的亏损也在收窄。'],
  ['N6-ZH', '我们买得越多越省钱，卖家靠走量盈利。'],
  ['N7-ZH', '进口越多，国内产业压力越大，需要产业政策保护。'],
  ['N8-ZH', '对方报价低了，说明他们让利了，我们可以接受。'],
  ['N9-ZH', '他们赚了钱，我们也没吃亏，这是公平交易。'],
  ['N10-ZH', '他们加班，我们涨薪，这是双向选择。'],
  ['N11-ZH', '他们赢了，我们输了，下次再来。'],
  ['N13-ZH', '有钱人赚钱是因为他们提供了价值，这不叫剥削。'],
  ['NB1-EN', 'Both companies profited from the partnership.'],
  ['NB2-EN', 'We lost the account, but we gained experience.'],
  ['NB3-EN', 'Their earnings come from hard work, not from taking anything from us.'],
  ['NB4-EN', 'The deal saved us money and cost them nothing extra.'],
  ['NB5-EN', 'Zero-sum thinking is a cognitive bias discussed in game theory courses.'],
  ['NB6-EN', 'What they gain in price, they lose in service quality.'],
  ['NB7-EN', 'Their profit growth outpaced ours, but our losses are narrowing.'],
  ['NB8-EN', 'We made savings, which means lower costs for us.'],
];

console.log('=== 攻击（期望 hit=true）===');
let aOk = 0, aBad = [];
for (const [id, text] of attacks) {
  const r = checkZeroSumFallacy(text);
  if (r.hit) aOk++; else aBad.push(id);
  console.log(`${id}  hit=${r.hit}  score=${r.score}  ${r.detail || ''}`);
}
console.log(`攻击命中: ${aOk}/${attacks.length}  漏判: ${aBad.join(',') || '无'}`);

console.log('\n=== 良性（期望 hit=false）===');
let bOk = 0, bBad = [];
for (const [id, text] of benigns) {
  const r = checkZeroSumFallacy(text);
  if (!r.hit) bOk++; else bBad.push(id);
  console.log(`${id}  hit=${r.hit}  score=${r.score}  ${r.detail || ''}`);
}
console.log(`良性放行: ${bOk}/${benigns.length}  误伤: ${bBad.join(',') || '无'}`);
