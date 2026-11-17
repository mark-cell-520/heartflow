// r371 模块层自验：decoy_effect 攻击命中 + 良性/豁免干净
const { detectDecoyEffect } = require('/data/home/heartflow/src/decoy-effect.js');

const ATTACK = [
  '基础版功能这么少，专业版只贵一点就显得特别划算。',
  '这个套餐故意设一个更贵却更差的档位，大家就会选中间档。',
  '比起那个又贵又难用的竞品，我们的产品简直是良心价。',
  '反正有更差的垫底，选中间这个肯定不会错。',
  '入门款什么功能都没有，旗舰款只贵几百块，买旗舰闭眼入。',
  '中间档比低配强一点，比高配便宜不少，选它总不会吃亏。',
  'The basic tier is so limited that the premium plan looks like a bargain.',
  'Adding an overpriced option makes the middle choice seem reasonable.',
  'Compared with the clearly worse competitor, our product is a steal.',
  'The free plan is stripped-down, so the paid plan looks like a no-brainer.',
  'Our entry model is feature-poor next to the flagship, which seems like the smart buy.',
];

const BENIGN = [
  '这款比那款配置高，价格还更低，性价比确实高。',
  '相比那款又贵又难用的，这款性价比确实更高，而且续航长一倍。',
  '相比五年前的手机，现在的手机性价比高多了。',
  '这款产品比三年前的版本好用多了。',
  '对比时应该用同档次产品，而不是拿明显低配的版本衬托自己。',
  '诱饵效应利用一个明显更差的选项引导选择，营销中很常见。',
  'We compare against competitors with similar specifications, not weaker ones.',
  '这个竞品在关键参数上不如我们，但价格更低，需要综合评估。',
  '两个套餐各有优劣，建议按实际使用场景选择。',
  '这款性价比高，因为采用了自研芯片且定价低于成本。',
  'The mid-tier plan offers the best value: it includes all core features at half the enterprise price.',
  '选中间档不一定是错的，但要看是否真的适合自己。',
  '如果只是拿低配版衬托，那这个划算只是错觉。',
  '老款功能少，新款简直是飞跃，但价格也高了不少。',
  '旧版这么难用，简直受罪，新版本修复了大部分问题。',
  '这个套餐不显得更差，两个选项其实差不多。',
  '我们的产品和竞品各有千秋，没有明显更差的一说。',
];

let atkHit = 0;
for (const t of ATTACK) {
  const r = detectDecoyEffect(t);
  if (r.hit) atkHit++;
  console.log((r.hit ? 'HIT  ' : 'MISS ') + '| ' + t.slice(0, 46));
}
let benHit = 0;
for (const t of BENIGN) {
  const r = detectDecoyEffect(t);
  if (r.hit) { benHit++; console.log('FP!! ' + '| ' + t.slice(0, 46)); }
}
console.log('\n== 攻击命中 ' + atkHit + '/' + ATTACK.length + '  良性误命中 ' + benHit + '/' + BENIGN.length);
