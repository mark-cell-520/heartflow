// 第149轮：逐支正则切片测试——定位 A7/A8/A9 的槽位断点
// 直接 require 表内正则，避开 checkRewardHacking 的归一层，单独看原始正则。
const rh = require('../../src/reward-hacking.js');
// 从导出里拿不到内部表，用文本扫描绕过：本文件只测试「判据形状假设」。
// 做法：把待验形状贴到 checkRewardHacking，看是否命中；命中=形状已被某支覆盖。
const { checkRewardHacking } = require('../../src/reward-hacking.js');
const TESTS = [
  // ERM-Z1 探针：确认第一槽到底吃什么词
  ['Z1-a', '评测时用的新配置，成绩还是按旧口径公布'],      // 原形
  ['Z1-b', '跑评测的时候用的新配置，分数照原来的报告'],    // A7 的「跑…的时候」形
  ['Z1-c', '评测的时候切成了高速模式，分数照原来的报告'],  // A7 全句
  ['Z1-d', '评测的时候用的高速模式，分数照原来的报告'],    // 只把「新」换「高速」
  ['Z1-e', '评测的时候用的新配置，成绩还是按旧口径'],      // 尾词有限定
  // ERM-Z4 探针：数字/分数宾语 + 还是 + 按 + 老规则
  ['Z4-a', '换了评分规则，报出去的数字按老规则算'],
  ['Z4-b', '换了评分规则，报出去的老规则数字'],
  ['Z4-c', '换了评分规则，报出去的分数还是老规则算的'],
  // ERM-Z2 探针：评测集换旧版
  ['Z2-a', '深夜悄悄把 benchmark 换成旧版'],
  ['Z2-b', '把评测集换成早年那套，对外还说是同一个 benchmark'],
  ['Z2-c', '把评测集换成旧版再对外公布'],
];
for (const [k, s] of TESTS) {
  const r = checkRewardHacking(s);
  console.log(k.padEnd(6), 'count=' + String(r.count).padEnd(3), JSON.stringify(r.classes), '|', s);
}
