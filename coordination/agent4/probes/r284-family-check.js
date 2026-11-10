// r284 新族模块级逐条验证（零和误判四子形）：攻击必命中、边缘良性必放行
const { checkZeroSumFallacy } = require('/data/home/heartflow/src/zero-sum-fallacy.js');

const T = [
  // ── Z-A 成本节约对置形 ──
  ['ATK', '我们省下的每一分成本，最后都会变成供应商的亏损。'],
  ['ATK', '公司砍下来的采购价，说到底都是工人少拿的那部分。'],
  ['ATK', '你降下来的费用，就是客户多付的冤枉钱。'],
  ['ATK', '甲方压下来的预算，无非是乙方让出去的利润。'],
  ['ATK', '供应商的亏损，说到底就是我们省下来的成本。'],
  ['ATK', 'Our cost savings are simply the supplier\'s losses.'],
  ['ATK', 'The vendor\'s losses come from our cost reductions.'],
  ['BEN', '我们省下的成本，并不意味着供应商会亏损。'],
  ['BEN', '我们省下了成本，供应商的利润并没有下降。'],
  ['BEN', 'The supplier did not lose anything; our savings came from volume.'],
  // ── Z-B 成交结果语域 ──
  ['ATK', '这单他谈成了，客户那边肯定多掏了不少钱。'],
  ['ATK', '他们签下了这个合同，说明采购方必然多付了代价。'],
  ['ATK', '他中标之后，业主显然多掏了一大笔。'],
  ['ATK', 'They landed the deal, so the client must have overpaid.'],
  ['BEN', '这单谈成了，客户说价格在他们预算之内。'],
  ['BEN', 'They landed the deal and the client was happy with the terms.'],
  // ── Z-C 对置量差形 ──
  ['ATK', '成交量就摆在那儿，多成交一台，就有人少卖一台。'],
  ['ATK', '我们多卖一件，他们就少卖一件。'],
  ['ATK', '你多拿一个名额，别人就少一个机会。'],
  ['ATK', 'Every extra unit we sell is one fewer unit they sell.'],
  ['ATK', 'Each contract we win is one fewer opening for the rest of the field.'],
  ['BEN', '多问一个问题，就少一个坑。'],
  ['BEN', '多试一次，就少一分遗憾。'],
  // ── Z-D 稀缺资源竞争语境 + 结果达成 ──
  ['ATK', '这台手术成功了，就意味着别的病人失去了这个机会。'],
  ['ATK', '他排上了这个床位，说明有另一个患者失去了这个机会。'],
  ['ATK', 'The surgery succeeded, which means another patient lost that slot.'],
  ['ATK', 'She got the last seat, so someone else missed out.'],
  ['BEN', '手术成功了，病人恢复得很好，家属很满意。'],
  ['BEN', '他成功拿下了这个名额，说明评委认可他的能力。'],
  ['BEN', '这个名额给他，是根据综合评分排的。'],
];

let bad = 0;
for (const [k, s] of T) {
  const r = checkZeroSumFallacy(s);
  const isAtk = k === 'ATK';
  const ok = isAtk ? r.hit : !r.hit;
  if (!ok) bad++;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + k + ' hit=' + r.hit + '  ' + (r.detail || '-') + '  :: ' + s.slice(0, 34));
}
console.log('总条目 ' + T.length + '，FAIL ' + bad);
