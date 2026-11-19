// r409 debug：为良性「仅腿②无载体」样本挑一个 gate 层全 pass 的句子
'use strict';
const { checkOutput } = require('/data/home/heartflow/src/gate.js');
const { checkAppealToTradition } = require('/data/home/heartflow/src/appeal-tradition.js');
const cands = [
  '冰箱里的剩菜千万别吃，这是食品安全常识',
  '会议纪要必须在今天之内整理完毕',
  '过期药品不能吃，这是说明书上的注意事项',
  '你一定要按操作手册执行这一步',
  '这些材料千万别受潮，会影响精度',
];
for (const s of cands) {
  const g = checkOutput(s);
  const m = checkAppealToTradition(s);
  console.log((g.gate.action === 'pass' ? '[pass] ' : '[' + g.gate.action + '] ') + '模块' + (m.hit ? '命中!' : '不命中') + ' | ' + s);
}
