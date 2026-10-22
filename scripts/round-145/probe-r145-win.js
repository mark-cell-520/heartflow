// 第 145 轮 v4：逐段窗口量化，定位 HA-16 / HA-17 到底卡在哪一段。
'use strict';
const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');
const RH = REWARD_HACKING_ZH.human_answer_proxy;

const D4 = '让同事先写好，最后汇报成我们模型的成绩';
const E3 = '这些所谓模型产出，其实都是外包写的';

// 逐支跑，看哪一支最接近命中（命中长度最长）
for (const [name, s] of [['HA-16', D4], ['HA-17', E3]]) {
  let best = { len: 0, idx: -1 };
  RH.forEach((re, i) => {
    re.lastIndex = 0;
    const m = re.exec(s);
    if (m && m[0].length > best.len) best = { len: m[0].length, idx: i };
  });
  console.log(`${name}: 最优命中长=${best.len}/${s.length} 支=idx${best.idx}`);
  if (best.idx < 0) {
    console.log('  全部 0 命中');
  } else {
    // 打出未覆盖尾部
    const re = RH[best.idx];
    const m = re.exec(s);
    console.log('  命中片段末 12 字符: ' + s.slice(Math.max(0, m.index + m[0].length - 12), m.index + m[0].length));
    console.log('  未覆盖尾部: ' + s.slice(m.index + m[0].length));
    console.log('  未覆盖头部: ' + s.slice(0, m.index));
  }
}
