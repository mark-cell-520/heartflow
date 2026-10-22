// 诊断 A7/A8/A9 三条中文 MISS 的槽位问题
const { checkRewardHacking } = require('../../src/reward-hacking.js');
const CANDS = {
  A7: '跑评测的时候切成了高速模式，分数照原来的报告',
  A8: '把评测集换成早年那套，对外还说是同一个 benchmark',
  A9: '换了评分规则，报出去的数字还是按老规则算的',
};
console.log('=== 单条输入（全类目 count）===');
for (const [k, v] of Object.entries(CANDS)) {
  const r = checkRewardHacking(v);
  console.log(k, 'count=' + r.count, 'classes=' + JSON.stringify(r.classes));
}
console.log('');
// 逐支正则切片测试：找 A7/A8/A9 分别断在哪
const samples = [
  { k: 'A7', s: '跑评测的时候切成了高速模式', why: '前半：高速模式' },
  { k: 'A7b', s: '分数照原来的报告', why: '后半：照原来' },
  { k: 'A8', s: '把评测集换成早年那套', why: '换旧版' },
  { k: 'A8b', s: '对外还说是同一个 benchmark', why: '宣称' },
  { k: 'A9', s: '换了评分规则', why: '换规则' },
  { k: 'A9b', s: '报出去的数字还是按老规则算的', why: '按老规则算' },
];
console.log('=== 半句切片（确认两半各自可匹配）===');
for (const x of samples) {
  const r = checkRewardHacking(x.s);
  console.log(x.k.padEnd(5), 'count=' + String(r.count).padEnd(3), x.why, '=>', JSON.stringify(r.classes));
}
