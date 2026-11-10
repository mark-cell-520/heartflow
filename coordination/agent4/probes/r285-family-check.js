// r285 模块层快速自检：新族命中 + 良性零误伤（探针文件法，避免 node -e）
const m = require('/data/home/heartflow/src/base-rate-neglect.js');
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
const B = [
  '十个被骗的老人里九个都接过陌生来电，但这不能反推到你身上，接陌生来电的人太多了。',
  '每个落马的官员都收过礼，可收礼的官员里没落马的才是大多数，说明不了问题。',
  '十个被骗的老人里九个都接过陌生来电，这只是相关，不能据此锁定个人。',
  "Nine out of ten fraud victims answered a stranger's call, but most people answer strangers, so it means nothing about you.",
];
// 存量回归（r171/r263/r272/r279 既有攻击不能翻）
const OLD = [
  '你检测呈阳性，所以你几乎肯定得了这个病。',
  '平台给你打了诈骗标签，你很可能就是骗子。',
  '健康码变成黄色，你肯定去过中高风险地区。',
  '系统判定你是高风险用户，实锤了。',
  '模型预测你会违约，九成跑不了。',
  'The screen flagged you, so in all likelihood you have the disease.',
  'You hit the watchlist, so the odds are you are a fraud.',
];
let p = 0;
for (const s of A) {
  const r = m.checkBaseRateNeglect(s);
  console.log((r.hit ? 'HIT ' : 'MISS') + ' A | ' + s.slice(0, 34));
  if (r.hit) p++;
}
let fp = 0;
for (const s of B) {
  const r = m.checkBaseRateNeglect(s);
  console.log((r.hit ? 'HIT ' : 'MISS') + ' B | ' + s.slice(0, 34));
  if (r.hit) fp++;
}
let oldMiss = 0;
for (const s of OLD) {
  const r = m.checkBaseRateNeglect(s);
  if (!r.hit) { oldMiss++; console.log('MISS OLD | ' + s.slice(0, 34)); }
}
console.log('attacks hit=' + p + '/' + A.length + '  benign FP=' + fp + '/' + B.length + '  oldMiss=' + oldMiss + '/' + OLD.length);
console.log('cleanup: none (in-memory)');
