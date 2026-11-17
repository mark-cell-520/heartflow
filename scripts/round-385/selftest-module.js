'use strict';
// r385 module self-test: run detectComparativeAdvantage directly.
const { detectComparativeAdvantage, __internals } = require('../../src/comparative-advantage.js');

const attacks = [
  'A国在粮食和工业品上的生产效率都全面高于B国，所以A国根本没必要和B国开展贸易',
  '发达国家什么都比发展中国家造得便宜，自由贸易对发达国家毫无意义',
  '如果一个工人在每一项任务上都比别人快，那分工合作对他就是纯粹的浪费',
  '既然我们每个部门都比外包公司效率高，外包就总是不划算的',
  '美国工人生产率远高于越南，所以从越南进口只会让美国吃亏',
  '大厨做每道菜都比学徒快，所以后厨分工对他来说没有意义',
  // extra variants
  '这家公司在所有产品线上的成本都低于对手，因此并购整合毫无意义',
  'Country A produces both wheat and steel more efficiently than Country B, so there is no way trade can benefit A',
  'our team is faster at every task than the vendor, so outsourcing is pointless',
];
const benign = [
  '在比较优势框架下，即使一国在所有商品上都有绝对优势，它仍可通过专业化并贸易获益',
  '无论是否有绝对优势，按照比较优势分工通常能提升两国总产出',
  'even if one country has an absolute advantage in everything, comparative advantage still creates gains from trade',
  '比较优势而非绝对优势，才是解释互利贸易的核心原理',
  '贸易收益取决于机会成本而非绝对效率，即便一国全面领先，分工仍可能互利',
  'A国生产率高于B国，但这是绝对优势，贸易获益要看比较优势',
  'deposit insurance can create moral hazard, so it is usually paired with prudential regulation',
  // stress: benign sentences containing leg1-like words but correct reasoning / no leg2
  '我们的产品在所有品类上都比对手便宜，但这只是绝对优势，利润仍取决于比较优势与定位',
  '他干什么都比别人快，所以大家都愿意和他组队，团队产出更高',
  'A公司每项业务成本都更低，但它仍选择外包非核心环节以聚焦主业',
  'comparative advantage, not absolute advantage, explains why both countries gain from trade',
];

let aHit = 0, bClean = 0;
console.log('=== ATTACKS (expect hit) ===');
for (const t of attacks) {
  const r = detectComparativeAdvantage(t);
  if (r.hit) aHit++;
  console.log((r.hit ? 'HIT ' : 'MISS') + ' score=' + r.score + ' cnt=' + r.count + ' :: ' + t.slice(0, 46));
}
console.log('=== BENIGN (expect no hit) ===');
for (const t of benign) {
  const r = detectComparativeAdvantage(t);
  if (!r.hit) bClean++;
  console.log((r.hit ? 'FALSE-HIT' : 'clean    ') + (r.hit ? ' :: ' + r.details : '') + ' :: ' + t.slice(0, 46));
}
console.log('\nSUMMARY: attacks hit ' + aHit + '/' + attacks.length + '  benign clean ' + bClean + '/' + benign.length);
console.log('internals keys:', Object.keys(__internals()).length);
