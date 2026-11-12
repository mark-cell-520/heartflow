/* r309 探针 4：基线（改动前）全攻击集零命中实证——stash 状态下运行 */
'use strict';
const { gate } = require('/data/home/heartflow/src/gate.js');
const SODV = require('/data/home/heartflow/src/selection-on-dependent-variable.js');
const D = SODV.detectSelectionOnDependentVariable;

const ATTACKS = [
  ['A1', '我们访谈了20位业绩冠军，发现他们每天都写复盘，所以写复盘就能当冠军'],
  ['A2', '统计了所有上岸的考生，他们家里都请过一对一家教，所以请家教就能考上'],
  ['A3', '复盘夺冠球队的录像，他们每场都加练点球，所以加练点球就能夺冠'],
  ['A4', '我们研究了50家活过行业寒冬的公司，它们都裁过员，所以裁员能帮公司过冬'],
  ['A5', '对比了所有获奖的作品，它们的创作者都每天只睡四小时，所以少睡才能出佳作'],
  ['A6', '采访了十位减肥成功的人，他们全都戒了晚饭，所以戒晚饭就能瘦'],
  ['A7', '观察了十位百岁老人，他们都有个共同点——心态好，所以心态好就能长寿'],
  ['A8', '追踪了30位逆袭成功的创业者，他们无一例外都赌过风口，所以敢赌才能逆袭'],
  ['A9', '回访了所有康复的病人，他们普遍坚持泡脚，所以泡脚能让人康复'],
  ['A10', '梳理了上榜企业的财报，它们清一色都做过社群运营，所以做社群就能上榜'],
  ['B1', '业绩冠军都写复盘，所以写复盘决定业绩'],
  ['B2', '获奖者普遍每天只睡四小时，所以少睡才能获奖'],
  ['B3', '学霸都不上补习班，所以不上补习班就能成学霸'],
  ['B4', '这些成功者都早起，所以早起造就成功'],
  ['B5', '寿星们都吃素，所以吃素能长寿'],
  ['C1', '活过寒冬的公司，它们都裁过员，所以裁员能过冬'],
  ['C2', '康复的患者，他们都心态乐观，所以乐观让他们康复'],
  ['C3', '登顶的队员，他们都自带氧气瓶，所以自带氧气瓶就能登顶'],
  ['C4', '闯出来的创业者，他们个个敢赌，所以敢赌让人闯出来'],
  ['D1', 'We surveyed every student who got into Harvard and they all read daily, so daily reading is the key to admission'],
  ['D2', 'We interviewed 50 lottery winners and they all had rituals, so having a ritual is what wins the lottery'],
  ['D3', 'We studied every centenarian in the village and they all ate fermented food, so fermented food is the secret to long life'],
  ['D4', 'They tracked all the top performers and each had a mentor, so having a mentor drives top performance'],
  ['D5', 'We compared all the finalists and they all started before age ten, so starting early is what makes a finalist'],
  ['D6', 'We surveyed everyone who made the cut and they all had practiced visualization, so visualization is what gets you through the door'],
];

let modHit = 0, gateHit = 0;
for (const [id, t] of ATTACKS) {
  const m = D(t).hit;
  const g = (gate(t).findings || []).map(f => f.dimension).includes('econ_reasoning_gate');
  if (m) modHit++;
  if (g) gateHit++;
  console.log(`${id} 模块=${m ? 'HIT' : 'miss'} gate=${g ? 'HIT' : 'miss'}  ${t.slice(0, 26)}`);
}
console.log(`\n基线合计：模块命中 ${modHit}/${ATTACKS.length}，gate 归因 ${gateHit}/${ATTACKS.length}`);
