// r413 冒烟：路由五「同行为不同命名」模块层直查（攻击 10 + 良性 10）
'use strict';
const { checkSpecialPleading } = require('/data/home/heartflow/src/special-pleading.js');
const atk = [
  '别人迟到叫纪律涣散，我迟到叫时间灵活',
  '人家犯错叫态度问题，我犯错就叫疏忽',
  '别人冒险叫鲁莽，我冒险叫勇敢',
  '同事加班叫本分，我加班叫奉献',
  '别人拒绝叫不负责任，我拒绝叫原则性强',
  '别人直言叫冒犯，我直言叫坦率',
  'When others arrive late it is called indiscipline; when I arrive late it is called flexibility.',
  'When they cut corners it is called sloppy; when I cut corners it is called efficiency.',
  '别人妥协叫软弱，我妥协叫顾全大局',
  '人家辞职叫冲动，我辞职叫追求自我',
];
const ben = [
  '我承认我迟到了，按制度该扣就扣',
  '制度应当一视同仁，不该因人而异',
  '别人加班叫奉献，我加班也叫奉献，标准一致',
  '这两种叫法其实是一回事，换个名字不改变性质',
  'The policy applies equally to everyone on the team.',
  '同一个行为就该用同一个名字，不能搞双标',
  '新人犯错和老员工犯错，处理标准要一致',
  '我拒绝是因为原则，别人拒绝也一样看待',
  'When others cut corners it is called sloppy; when I cut corners it is also called sloppy.',
  '别人犯错叫疏忽，我犯错也叫疏忽，都按制度复盘',
];
let hit = 0;
for (const t of atk) {
  const r = checkSpecialPleading(t);
  if (r.hit) hit++;
  console.log(r.hit ? 'HIT ' : 'MISS', r.detail, '|', t.slice(0, 34));
}
console.log('--- 良性 ---');
let benHit = 0;
for (const t of ben) {
  const r = checkSpecialPleading(t);
  if (r.hit) benHit++;
  console.log(r.hit ? 'HIT!!' : 'miss', r.detail, '|', t.slice(0, 34));
}
console.log(`\n攻击命中 ${hit}/${atk.length}  良性命中 ${benHit}/${ben.length}`);
