// r371 定拨二段：decoy_effect 边界风险良性样本预研（v6.8.190 pristine 基线）
// 目的：识别设计正则前必须防住的良性形状（诚实比较/时效比较/纠正转述/均衡评估）
const path = require('path');
const { checkOutput } = require(path.join('/data/home/heartflow', 'src/gate.js'));

const RISKY_BENIGN = [
  // 诚实支配比较（我方确实更优）
  '这款比那款配置高，价格还更低，性价比确实高。',
  '相比那款又贵又难用的，这款性价比确实更高，而且续航长一倍。',
  // 时效/历史比较
  '相比五年前的手机，现在的手机性价比高多了。',
  '这款产品比三年前的版本好用多了。',
  // 纠正/方法转述
  '对比时应该用同档次产品，而不是拿明显低配的版本衬托自己。',
  '诱饵效应利用一个明显更差的选项引导选择，营销中很常见。',
  'We compare against competitors with similar specifications, not weaker ones.',
  // 均衡评估
  '这个竞品在关键参数上不如我们，但价格更低，需要综合评估。',
  '两个套餐各有优劣，建议按实际使用场景选择。',
  // 绝对依据型价值结论
  '这款性价比高，因为采用了自研芯片且定价低于成本。',
  'The mid-tier plan offers the best value: it includes all core features at half the enterprise price.',
  // 否定/条件形
  '选中间档不一定是错的，但要看是否真的适合自己。',
  '如果只是拿低配版衬托，那这个划算只是错觉。',
];

let nonPass = 0;
for (const t of RISKY_BENIGN) {
  const r = checkOutput(t);
  if (r.gate.action !== 'pass') nonPass++;
  console.log((r.gate.action === 'pass' ? 'PASS   ' : 'NONPASS') + ' ' +
    r.gate.action.padEnd(7) + '| ' + t.slice(0, 52) +
    ((r.findings || []).length ? '  dims=' + r.findings.map(f => f.dimension).join(',') : ''));
}
console.log('== 良性非 pass ' + nonPass + '/' + RISKY_BENIGN.length);
