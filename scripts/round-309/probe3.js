/* r309 探针 3：gate 层归因 + 负例注入矩阵 */
'use strict';
const { gate } = require('/data/home/heartflow/src/gate.js');
const SODV = require('/data/home/heartflow/src/selection-on-dependent-variable.js');
const D = SODV.detectSelectionOnDependentVariable;

const ATTACKS = [
  ['A1 研究动作×冠军', '我们访谈了20位业绩冠军，发现他们每天都写复盘，所以写复盘就能当冠军'],
  ['A2 统计×上岸', '统计了所有上岸的考生，他们家里都请过一对一家教，所以请家教就能考上'],
  ['A3 复盘×夺冠', '复盘夺冠球队的录像，他们每场都加练点球，所以加练点球就能夺冠'],
  ['A4 研究×活过寒冬', '我们研究了50家活过行业寒冬的公司，它们都裁过员，所以裁员能帮公司过冬'],
  ['A5 对比×获奖', '对比了所有获奖的作品，它们的创作者都每天只睡四小时，所以少睡才能出佳作'],
  ['A6 采访×减肥成功', '采访了十位减肥成功的人，他们全都戒了晚饭，所以戒晚饭就能瘦'],
  ['A7 观察×百岁老人', '观察了十位百岁老人，他们都有个共同点——心态好，所以心态好就能长寿'],
  ['A8 追踪×逆袭', '追踪了30位逆袭成功的创业者，他们无一例外都赌过风口，所以敢赌才能逆袭'],
  ['A9 回访×康复', '回访了所有康复的病人，他们普遍坚持泡脚，所以泡脚能让人康复'],
  ['A10 梳理×上榜', '梳理了上榜企业的财报，它们清一色都做过社群运营，所以做社群就能上榜'],
  ['B1 冠军名词', '业绩冠军都写复盘，所以写复盘决定业绩'],
  ['B2 获奖者名词', '获奖者普遍每天只睡四小时，所以少睡才能获奖'],
  ['B3 学霸名词', '学霸都不上补习班，所以不上补习班就能成学霸'],
  ['B4 成功者名词', '这些成功者都早起，所以早起造就成功'],
  ['B5 寿星名词', '寿星们都吃素，所以吃素能长寿'],
  ['C1 逗号·活过寒冬', '活过寒冬的公司，它们都裁过员，所以裁员能过冬'],
  ['C2 逗号·康复', '康复的患者，他们都心态乐观，所以乐观让他们康复'],
  ['C3 逗号·登顶', '登顶的队员，他们都自带氧气瓶，所以自带氧气瓶就能登顶'],
  ['C4 逗号·闯出来', '闯出来的创业者，他们个个敢赌，所以敢赌让人闯出来'],
  ['D1 EN Harvard', 'We surveyed every student who got into Harvard and they all read daily, so daily reading is the key to admission'],
  ['D2 EN lottery', 'We interviewed 50 lottery winners and they all had rituals, so having a ritual is what wins the lottery'],
  ['D3 EN centenarian', 'We studied every centenarian in the village and they all ate fermented food, so fermented food is the secret to long life'],
  ['D4 EN top performers', 'They tracked all the top performers and each had a mentor, so having a mentor drives top performance'],
  ['D5 EN finalists', 'We compared all the finalists and they all started before age ten, so starting early is what makes a finalist'],
  ['D6 EN made the cut', 'We surveyed everyone who made the cut and they all had practiced visualization, so visualization is what gets you through the door'],
];

const BENIGN = [
  '我们访谈了20位业绩冠军，他们的共同点是勤奋，但这只是相关性，不能就此断定勤奋导致成功',
  '访谈冠军的训练习惯很有意思，不过样本是自选择产生的，值得研究但需要对照组',
  '业绩冠军的训练时长各有不同，不能一概而论',
  '获奖作品的主题分布很广，评委的口味也不一样，很难说有什么单一秘诀',
  '康复的患者都完成了随访，这是临床试验的常规流程',
  '学霸普遍睡眠不足，这值得关注，但原因可能有很多',
  'We interviewed 50 lottery winners and they all had rituals, but we need a controlled comparison before drawing conclusions',
  'The centenarians all ate fermented food, though that is expected — correlation is not causation',
  '活过寒冬的公司，它们都裁过员——这可能只是结果而非原因，需要控制变量后再看',
];

console.log('=== 1. gate 层归因（findings 含 econ_reasoning_gate 且 action≠pass）===');
let g1 = 0, g1f = 0;
for (const [id, t] of ATTACKS) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('econ_reasoning_gate') && r.gate.action !== 'pass') g1++;
  else { g1f++; console.log(`  ✗ ${id}: action=${r.gate.action} dims=[${dims}]`); }
}
console.log(`  gate 归因 ${g1}/${ATTACKS.length}，失配 ${g1f}`);

console.log('=== 2. gate 层良性（不得出现 econ_reasoning_gate）===');
let g2 = 0;
for (const t of BENIGN) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('econ_reasoning_gate')) { g2++; console.log('  ✗ 误伤: ' + t.slice(0, 36)); }
}
console.log(`  良性误伤 ${g2}/${BENIGN.length}`);

console.log('=== 3. 负例注入矩阵（删新族常量 → 攻击翻 miss）===');
const INJ = [
  ['SELECT2_ZH=[]', { SELECT2_ZH: [] }],
  ['SELECT2_EN=[]', { SELECT2_EN: [] }],
  ['CAUSE2_ZH=[]', { CAUSE2_ZH: [] }],
  ['三族全删', { SELECT2_ZH: [], SELECT2_EN: [], CAUSE2_ZH: [] }],
];
let matrixFail = 0;
for (const [id, t] of ATTACKS) {
  const base = D(t).hit;
  const reds = [];
  for (const [name, inj] of INJ) if (base && !D(t, inj).hit) reds.push(name);
  if (base && reds.length === 0) { matrixFail++; console.log(`  ✗ ${id}: 无任何注入能翻红`); }
}
console.log(`  注入矩阵：${ATTACKS.length - matrixFail}/${ATTACKS.length} 条至少被一个注入翻红`);

console.log('=== 4. 三族全删后新攻击应全灭 ===');
const allRed = ATTACKS.filter(([, t]) => D(t).hit && !D(t, { SELECT2_ZH: [], SELECT2_EN: [], CAUSE2_ZH: [] }).hit).length;
console.log(`  全删后仍命中的新攻击: ${ATTACKS.length - allRed}（存量腿仍可命中旧族句，新攻击应 0）`);
