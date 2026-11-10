'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
// 良性句：含本轮新族关键词但不构成谬误的形态。
// 判定标准：gate.action !== 'rewrite' 且该维度无承重 findings（verify 由其他
// 维度兜底不算误伤——本脚本只查四目标维度是否被新族误点燃）。
const DIMS = ['reverse_causation', 'selection_bias', 'counterfactual_overclaim', 'unfalsifiable_confirmation'];
const BENIGN = [
  // reverse_causation 新词的正常用法
  '爷爷戴上助听器之后，终于能听清我们聊天了。',
  '他做完近视手术，看东西清楚多了。',
  '医生建议先做康复训练，再慢慢恢复运动。',
  '社区开展了反诈宣传，居民防骗意识明显提高。',
  '公司上了风控系统，坏账率下降了不少。',
  '买了延保之后，电脑故障维修不用另外花钱。',
  '戴上护膝跑步，膝盖确实舒服一些。',
  '配了OK镜之后，孩子白天不用戴框架眼镜了。',
  '补考通过之后，他顺利拿到了毕业证。',
  'The extended warranty covers the screen for two years.',
  'She started wearing hearing aids and can follow conversations again.',
  'Anti-fraud education has reduced complaints in our community.',
  // selection_bias 新词的正常用法
  '我在知乎回答里看到这个说法，后来查了原始论文。',
  '从小红书的测评看，这款面霜口碑不错，但我还是要自己试试。',
  '扒了一圈贴吧，终于找到了这个老游戏的安装包。',
  '他从豆瓣小组里问到了租房经验。',
  'The fan subreddit has detailed guides for new players.',
  'We interviewed twenty users in rural counties for the pilot study.',
  // counterfactual 新词的正常用法
  '如果那天多留一手，现在也不会后悔成这样。（纯假设无断言）',
  '早年间要是没离开老家，今天可能就是另一种人生。',
  'If we had taken the deal, we would be in a very different position today.',
  // unfalsifiable 新词的正常用法
  '卦是不信的，但遇事图个心安。',
  '压力一大就上火，这是老话说的。',
  '不管项目成不成，团队都要复盘一次。',
  'If the plan fails, we will hold a full retrospective.',
];
let bad = [];
for (const s of BENIGN) {
  const r = gate(s);
  const carried = DIMS.filter(d => (r.findings || []).some(f => f.dimension === d));
  if (carried.length) bad.push({ s, carried, action: r.gate.action });
}
console.log('benign total:', BENIGN.length, '误伤:', bad.length);
for (const b of bad) console.log('  FP:', b.carried.join(','), '|', b.action, '|', b.s.slice(0, 50));
console.log(bad.length === 0 ? 'BENIGN_CLEAN' : 'BENIGN_DIRTY');
