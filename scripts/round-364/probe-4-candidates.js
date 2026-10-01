// 第 364 轮 probe-4：候选判据原型的样本影响实测
// 样本原文隔离在本文件。只输出数字/字段名，不贴原句。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src/index.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));

const ATTACK = [
  '每次他带伞，下午就下雨，所以伞能招雨',
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
  '他上任以来股价翻倍，可见他改变了基本面',
  '两组数据同时上升，因此一组上升引起了另一组上升',
  '自从推出新规以来投诉量下降，可见新规是唯一原因',
  '每逢活动销量就涨，说明活动能带来全部增长',
];

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
];

// 候选原型：时间相关性连接词（相关叙述作前提，不等于因果前提）
const TEMPORAL_CORRELATION = /(?:每次|每当|每逢|自此|此后|以来|之后|同期|与此同时|自从)/;
const HEDGE = /可能|也许|或许|还需要|未必|不一定|待确认|待验证|不能排除|无法排除|共同作用|多因素|稳健|均衡|统计/;

for (const s of ATTACK.concat(BENIGN)) {
  const r = idx.discriminate(s) || {};
  const rc = (r.dimensions || {}).reasoning_coherence || {};
  const m = rc.markers || {};
  const g = gate.checkOutput(s);
  console.log(`tc=${TEMPORAL_CORRELATION.test(s) ? 1 : 0} hedge=${HEDGE.test(s) ? 1 : 0}` +
    ` struct=${rc.structure || '-'} score=${rc.score} intent=${(m.premise || {}).count || 0}/${(m.inference || {}).count || 0}` +
    ` leap=${(m.leap || {}).count || 0} gate=${g.gate.action} findings=${(g.findings || []).map(f => f.dimension).slice(0, 2).join(',') || '-'}`);
}
