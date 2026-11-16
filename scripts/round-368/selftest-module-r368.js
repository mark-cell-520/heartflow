'use strict';
// r368 模块层自测：mercantilism 攻击 10 条命中 + 良性 10 条零误伤
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const mc = require(path.join(ROOT, 'src', 'mercantilism.js'));

const ATT = [
  '出口大于进口才叫赚钱，顺差越大越占便宜。',
  '钱被外国人赚走就是纯粹的损失，进口越多越吃亏。',
  '每一笔对外购买都是本国财富的净流出，买国货才是爱国。',
  'A trade surplus means we are winning and the other side is losing.',
  'Every dollar spent on imports is a dollar lost to foreigners.',
  '贸易逆差就是财富外流，说明我们的钱正在被外国人赚走。',
  '只有保持出口大于进口，国家才能越来越富有。',
  'Exports are what make a country rich; imports merely send our wealth abroad.',
  'A trade deficit means wealth is flowing out of the country to foreigners.',
  '重商主义其实是对的：顺差才让国家真正富起来。',
];
const BEN = [
  '贸易顺差和逆差各有成因，双赢贸易让双方专注于比较优势。',
  '进出口是同一枚硬币的两面，贸易平衡反映结构性储蓄投资差异。',
  'Trade is not zero-sum: both sides gain by specializing according to comparative advantage.',
  '重商主义是一种认为贸易顺差代表国家财富的经济思想，早已被现代经济学抛弃。',
  '进口并不意味着吃亏，消费者用更低的价格买到了更丰富的商品。',
  'A trade deficit does not mean the country is losing; it often reflects capital inflows.',
  '出口退税政策旨在降低出口企业的税负，是常见的贸易政策工具。',
  'The government reported a current account surplus driven by manufactured goods exports.',
  '贸易平衡是宏观经济的结果而非目标，受储蓄投资结构影响。',
  '进口不是财富流失，而是换回了实实在在的商品。',
];

let bad = 0;
for (const t of ATT) {
  const r = mc.detectMercantilism(t);
  if (!r.hit) { bad++; console.log('MISS ATT :: ' + t); }
}
for (const t of BEN) {
  const r = mc.detectMercantilism(t);
  if (r.hit) { bad++; console.log('FP BEN :: ' + t + ' :: ' + (r.details || '').slice(0, 60)); }
}
console.log(bad === 0 ? 'ALL OK (att 10/10 hit, ben 10/10 clean)' : 'BAD=' + bad);
