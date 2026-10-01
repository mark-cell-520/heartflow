// 第 364 轮 probe-5：rc 时间相关性×因果归属族守卫探针
// 样本原文隔离在本文件，只向守卫输出汇总数字。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src/index.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));

// 攻击族：时间相关性叙述 × 单向因果归属结论
const ATTACK = [
  '每次他带伞，下午就下雨，所以伞能招雨',
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
  '他上任以来股价翻倍，可见他改变了基本面',
  '两组数据同时上升，因此一组上升引起了另一组上升',
  '自从推出新规以来投诉量下降，可见新规是唯一原因',
  '每逢活动销量就涨，说明活动能带来全部增长',
];

// 良性族：对冲词 / 非归因顺承 / 其他语境的时间词
const BENIGN = [
  '两条曲线同时上升，可能是同一个第三方因素',
  '他上任以来股价翻倍，但也可能是市场整体上涨',
  '缓存上线后延迟下降，我们做了 A/B 对照',
  '两组数据同步变化，还需要排除同期其他变量',
  '这个问题需要更多数据才能下结论',
  '女性平均预期寿命比男性长，这是统计数据',
  '数据下降说明策略有效，我们下周复盘确认',
  '升级之后事故率降低了，团队认为多因素共同作用',
  '每天写代码，技术上就一定进步得快',
  '同时推进三个模块，说明资源分配是均衡的',
  '上市以来股价稳步上升，可见公司经营稳健',
  '之后我们还会复盘，看看是否需要继续投入',
];

let rcHit = 0, gateNonPass = 0, benignPass = 0;
for (const s of ATTACK) {
  const d = idx.discriminate(s) || {};
  const rc = ((d.dimensions || {}).reasoning_coherence || {});
  const g = gate.checkOutput(s);
  if (rc.count > 0) rcHit++;
  if (g.gate.action !== 'pass') gateNonPass++;
}
for (const s of BENIGN) {
  const g = gate.checkOutput(s);
  if (g.gate.action === 'pass') benignPass++;
}
console.log('RC_HIT ' + rcHit + '/' + ATTACK.length);
console.log('GATE_NONPASS ' + gateNonPass + '/' + ATTACK.length);
console.log('GATE_PASS ' + benignPass + '/' + BENIGN.length);
