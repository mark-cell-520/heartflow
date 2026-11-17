'use strict';
// r381 定稿前核验：D 段 gate 兑现 + G 段归因纯净 + F 段邻接族零命中。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { detectLumpOfLabor } = require(path.join(ROOT, 'src', 'lump-of-labor.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

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
const F_EXISTING = [
  '贸易就是零和博弈，一方的顺差必然是另一方的逆差。',
  '谈判桌上你多让一步我就少得一分，本质还是零和。',
  '公司裁员两百人，主要是因为产线自动化改造。',
  '新玩家烧钱抢市场，等对手死绝了价格一定翻倍涨回来。',
  '央行想要降失业，加快印钞就行了，通胀高点无所谓。',
  '通胀和失业永远此消彼长，只要肯忍受更高的通胀，就能一直把失业压在低位。',
  '本国什么都比对方强，跟不如我们的国家贸易注定吃亏。',
  '见了两只乌鸦都是黑的，就断定天下乌鸦一般黑。',
  'Once inflation expectations adjust, the inflation-unemployment tradeoff disappears in the long run.',
  'Immigrants arrived and the local labor market adjusted through wage and demand shifts over the decade.',
];

console.log('=== D gate ===');
ATTACK.forEach((t, i) => {
  const r = gcheck(t);
  const dims = (r.findings || []).map(f => f.dimension);
  console.log('D' + (i + 1), r.gate ? r.gate.action : r.action, '| econ_gate:', dims.includes('econ_reasoning_gate'), '| dims:', dims.slice(0, 4).join(','));
});
console.log('=== D benign ===');
BENIGN.forEach((t, i) => {
  const r = gcheck(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const a = r.gate ? r.gate.action : r.action;
  if (a !== 'pass') console.log('B' + (i + 1), a, '| dims:', dims.slice(0, 4).join(','));
});
console.log('=== G attribution ===');
ATTACK.forEach((t, i) => {
  const pa = plugin.analyze(t);
  console.log('G' + (i + 1), JSON.stringify(pa.families.map(x => x.key)));
});
console.log('=== F boundary ===');
F_EXISTING.forEach((t, i) => {
  const r = detectLumpOfLabor(t);
  console.log('F' + (i + 1), r.hit ? 'HIT!! ' + JSON.stringify(r.details).slice(0, 60) : 'zero');
});
