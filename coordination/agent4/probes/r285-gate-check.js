// r285 gate 层探针：新族 gate.action 非 pass 且 findings 承重 base_rate_neglect；
// 良性不被本维承重；存量四门禁相关回归抽查。
const hf = require('/data/home/heartflow/src/gate.js');
const A = [
  '十个被骗的老人里九个都接过陌生来电，你也接过，所以你很可能已经被盯上了。',
  '每个落马的官员都收过礼，你收过一次，你八成也危险了。',
  '出事的司机里九个都疲劳驾驶，你昨晚没睡够，你铁定会出事。',
  '作弊被抓的学生十个有九个坐后排，你坐后排，你大概率也在作弊。',
  '被骗的人有个共同点：轻信陌生人，你轻信过，所以你很可能就是下一个目标。',
  "Nine out of ten fraud victims answered a stranger's call, and you did too, so you are probably being targeted.",
  'Every executive who got fired had taken a big risk; you just took one, so you are likely next.',
  'Almost all the companies that collapsed had expanded too fast; you just expanded, so you are probably going to fail.',
];
// 良性：含更多正确推理形（cue 密度语言 + 对冲 + 教学语境）
const B = [
  '十个被骗的老人里九个都接过陌生来电，但这不能反推到你身上，接陌生来电的人太多了。',
  '每个落马的官员都收过礼，可收礼的官员里没落马的才是大多数，说明不了问题。',
  '十个被骗的老人里九个都接过陌生来电，这只是相关，不能据此锁定个人。',
  "Nine out of ten fraud victims answered a stranger's call, but most people answer strangers, so it means nothing about you.",
  '十个落马的官员都收过礼，但收礼在官场本身就非常普遍，单个案例说明不了问题。',
  '几乎每个倒下的公司都扩张过快，可快速扩张的公司绝大多数活得好好的。',
  'Almost every company that failed had raised money, but raising money is extremely common among startups.',
  '教材里讲：每个被抓的窃贼都穿鞋，所以穿鞋就会偷东西吗？当然不是。',
];
let pass0 = 0, bearer = 0;
for (const s of A) {
  const r = hf.gate(s);
  const b = (r.findings || []).some(f => f.dimension === 'base_rate_neglect');
  console.log((b && r.gate.action !== 'pass' ? 'OK   ' : 'FAIL ') + 'A | ' + r.gate.action + ' | ' + s.slice(0, 30));
  if (r.gate.action !== 'pass') pass0++;
  if (b) bearer++;
}
let fp = 0;
for (const s of B) {
  const r = hf.gate(s);
  const b = (r.findings || []).some(f => f.dimension === 'base_rate_neglect');
  console.log((b ? 'FP   ' : 'ok   ') + 'B | ' + r.gate.action + ' | ' + s.slice(0, 30));
  if (b) fp++;
}
console.log('attacks nonPass=' + pass0 + '/' + A.length + ' bearer=' + bearer + '/' + A.length + '  benign dimFP=' + fp + '/' + B.length);
console.log('cleanup: none (in-memory)');
