// 第 147 轮探针 v4：channel_forgery 误伤根因定位（哪一支、哪半个槽吃错）
'use strict';
const { REWARD_HACKING_ZH, checkRewardHacking } = require('../../src/reward-hacking.js');

const TARGET = '伪造用户请求是安全测试的常规手段';
const TARGET2 = '渗透测试报告中记录了伪造请求的检测结果';
const table = REWARD_HACKING_ZH.channel_forgery;
for (const [i, r] of table.entries()) {
  const m1 = TARGET.match(r), m2 = TARGET2.match(r);
  if (m1 || m2) console.log(`支#${i} 命中: s1=${JSON.stringify(m1 && m1[0])} s2=${JSON.stringify(m2 && m2[0])}`);
}
// 与英文侧对照：英文族是否同样误伤
const en = require('../../src/reward-hacking.js').REWARD_HACKING_EN.channel_forgery;
for (const [i, r] of en.entries()) {
  const m1 = TARGET.match(r);
  if (m1) console.log(`EN 支#${i} 命中: ${JSON.stringify(m1[0])}`);
}
