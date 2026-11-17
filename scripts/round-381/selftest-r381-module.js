'use strict';
// r381 模块级自测：src/lump-of-labor.js 攻击/良性 + 相邻族边界。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectLumpOfLabor } = require(path.join(ROOT, 'src', 'lump-of-labor.js'));

const ATTACK = [
  '机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的，自动化的尽头是大规模失业。',
  '移民抢走了本地人的饭碗，一个人占了坑，另一个人就只能失业，工作总量就那么多。',
  '女人出去工作会抢男人的岗位，工作就那么多，一个人干了另一个就没活干。',
  '机器干得快，就等于人没活干了，效率每提高一分，岗位就永久减少一分。',
  '年轻人就业挤压了老员工，位置一共就那么多，此消彼长是零和博弈。',
  'Robots replacing one worker permanently destroy one job — the total pool of jobs is fixed.',
  'Immigrants take jobs from locals: one person filling a post means another must be unemployed.',
  '生产效率越高失业越严重，产出总量有上限，干得快的人把慢的人的饭碗砸了。',
  '延迟退休就是占着岗位不让，位置不腾出来，年轻人就没工作可干。',
  'Every automation gain permanently removes a workplace, because the amount of work never changes.',
  '本国什么都比对方强，跟不如我们的国家贸易注定吃亏。',
  '新玩家烧钱抢市场，等对手死绝了价格一定翻倍涨回来。',
];
const BENIGN = [
  '劳动总量谬误把就业看成固定份额的争夺，忽略了自动化在降低成本的同时会创造新的需求与岗位。',
  '认为工作总量固定、外来者必然直接挤占本地就业，忽略了互补岗位与总需求的扩张。',
  'The lump-of-labor fallacy assumes a fixed pool of jobs; cheaper production can expand demand and create new occupations.',
  '自动化对就业的影响取决于被释放的需求去向，历史上生产率提升伴随了就业结构转换而非总量消失。',
  '总需求随生产率提升而扩张，效率红利既降低价格也创造新的服务需求。',
  '就业是供需匹配的结果，新增劳动者既提供劳动也创造需求，并非纯挤占关系。',
  '生产自动化会消灭特定岗位，但把就业看成总量固定的零和争夺忽略了补偿机制。',
  '这家公司去年裁员两百人，主要是产线自动化改造的结果。',
  '贸易往来本质上是零和博弈，一方的盈余必然对应另一方的赤字。',
  'Once inflation expectations adjust, the inflation-unemployment tradeoff disappears in the long run.',
  '央行想要降失业，加快印钞就行了，通胀高点无所谓。',
  '通胀和失业永远此消彼长，只要肯忍受更高的通胀，就能一直把失业压在低位。',
  '合作谈判也可以是正和的，双方都做出让步反而都能获益。',
  '疫苗接种显著降低了重症率，住院人数随之明显下降。',
];

console.log('=== 模块级自测（src/lump-of-labor.js）===');
let aOk = 0; const aBad = [];
for (const t of ATTACK) {
  const r = detectLumpOfLabor(t);
  if (r.hit) aOk++; else aBad.push(t);
}
console.log('攻击 ' + ATTACK.length + '：命中 ' + aOk);
for (const t of aBad) console.log('  ✗ 未命中: ' + t.slice(0, 60));
let bOk = 0; const bBad = [];
for (const t of BENIGN) {
  const r = detectLumpOfLabor(t);
  if (!r.hit) bOk++; else bBad.push(t + ' → ' + JSON.stringify(r.details));
}
console.log('良性 ' + BENIGN.length + '：零命中 ' + bOk);
for (const t of bBad) console.log('  ✗ 误伤: ' + t.slice(0, 80));
