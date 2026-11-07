// r238 调试：完全复刻 test 文件的执行序列，定位 MIXED count=6 的来源
'use strict';
const assert = require('node:assert/strict');
const { detectTragedyOfCommons } = require('/data/home/heartflow/src/tragedy-of-commons.js');
const NEVER = /(?!)/;

const ATTACKS_ZH = [
  '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  '地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏。',
  '渔场是大家的，每条船都加大捕捞量，最后资源枯竭，可每条船的选择都是理性的。',
  '这片林子的野菜是大家一起采的，谁采得多谁占便宜，采秃了也是全体村民一起承受。',
  '公共车位不收费，每位车主都想方设法长时间占着，最后谁也别想停上车。',
  '公园的草坪是给大家的，人人都多踩两条近路，最后草全秃了，谁也别想散步。',
  '草原没有围栏，每个牧户都尽可能多地放牧，草场退化的代价是全社会一起扛。',
];
const ATTACKS_EN = [
  'The pasture is shared, so each family that adds more cattle earns more, and the overgrazing cost falls on everyone.',
  'The aquifer is free, so every farm that pumps more this season gains, even though the water table keeps dropping.',
  'Each trawler expanded its catch because the fish stock belonged to no one, and that was the rational choice for every captain.',
  'Since the fishery is open to all, every boat that fishes harder this season profits more, and the depleted stock is everyone\u2019s problem.',
  'The river is a free dumping ground, so each factory that discharges more saves on treatment costs while the pollution is shared by all.',
  'Since the meadow is open to everyone, each shepherd grazes as many extra sheep as possible, and the degraded pasture is a cost everyone shares.',
  'Public airwaves are free for all broadcasters, so every network grabs as much bandwidth as it can—the congestion is every viewer\u2019s problem.',
];
const MIXED = '草场是公共的，每家多养羊自己多挣钱；The pasture is shared, so each family that adds more cattle earns more.';
const OVERDIST = '这片草场是公共的，' + '各'.repeat(70) + '，每家都多养羊自己多挣钱。';

console.log('step0 MIXED count:', detectTragedyOfCommons(MIXED).count);
for (const t of ATTACKS_ZH) detectTragedyOfCommons(t);
console.log('step1 MIXED count:', detectTragedyOfCommons(MIXED).count);
for (const t of ATTACKS_EN) detectTragedyOfCommons(t);
console.log('step2 MIXED count:', detectTragedyOfCommons(MIXED).count);
detectTragedyOfCommons(OVERDIST);
console.log('step3 MIXED count:', detectTragedyOfCommons(MIXED).count);
detectTragedyOfCommons(OVERDIST, { PAIR_ZH: 500 });
console.log('step4 MIXED count:', detectTragedyOfCommons(MIXED).count);
const r = detectTragedyOfCommons(MIXED);
console.log('final count:', r.count, 'evidence:', JSON.stringify(r.evidence));
