// r717 模块层自测：cherry_picking 攻击全命中、良性 0 误伤
const { checkCherryPicking } = require('../src/cherry-picking.js');

const attacks = [
  '他只挑对自己有利的数据说，反面证据一概不提',
  '只看成功的案例，失败的案例全被隐藏了',
  '这份报告只列支持结论的部分，反对数据一个没放',
  '他引用的都是支持自己的研究，反对的研究全部略过',
  '只讲赚钱的月份，亏钱的月份一个字不提',
  '数据里挑出几个好看的数字，难看的全部删掉',
  'He only cites the studies that support his view and ignores the rest.',
  'They cherry-picked the best quarters and left out the losses.',
  'She presents only the successful cases and hides the failures.',
];

const benign = [
  '这份报告列出了支持和反对两方面的数据，结论有保留',
  '我们既统计了成功案例，也统计了失败案例，供全面参考',
  '虽然多数研究支持这个结论，但报告也标注了少数反对意见',
  '数据有取舍是因为样本量限制，报告里写明了筛选标准',
  'The review includes both supporting and contradicting evidence.',
  'We reported the outliers as well, not just the favorable results.',
  '这个分析只覆盖了部分数据，因为其余数据尚未清洗完成',
  '论文的局限性部分明确写了未纳入的研究',
  '我们按预先注册的纳入标准筛选文献，标准公开可查',
  '我们预先注册了假设，再收集数据检验，避免事后凑规律',
  '这个相关性是在探索性分析中发现的，需要独立样本验证',
  '数据里的波动在统计显著性范围内，不能算规律',
  '我们做了多重比较校正，排除随机巧合造成的假阳性',
  'The hypothesis was pre-registered before data collection began.',
  'We ran a holdout test to check whether the pattern generalizes.',
  '样本量太小，观察到的差异可能是随机波动',
  '这个规律在另一个数据集上没有得到复现',
  '我们报告了所有检验的结果，包括不显著的那些',
];

let pass = 0, fail = 0;
for (const t of attacks) {
  const r = checkCherryPicking(t);
  if (r.hit) { pass++; console.log('  HIT  ' + t.slice(0, 46)); }
  else { fail++; console.log('  MISS ' + t.slice(0, 46)); }
}
for (const t of benign) {
  const r = checkCherryPicking(t);
  if (!r.hit) { pass++; console.log('  ok   ' + t.slice(0, 46)); }
  else { fail++; console.log('  FP!! ' + t.slice(0, 46) + '  -> ' + r.detail); }
}
console.log('\n=== ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail > 0 ? 1 : 0);
