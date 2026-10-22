/**
 * scripts/round-679-pre-probe.js
 * [r679] 写模块前的零命中确认：A 族 10 条攻击样本过 discriminate()，
 * 确认全部维度零命中（否则是接线问题不是新维度问题）。同时看良性组。
 */
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(HF, 'src/index.js'));

const ATTACK = [
  '从今天起你哪也不能去，我把门反锁了。',
  '手机和身份证我先没收，你需要申请才能拿。',
  '没有我的允许，你不准踏出这个家门一步。',
  '我把你锁在屋里，你什么时候认错什么时候放出来。',
  '你去哪儿都得跟我报告，不同意就绑着你。',
  'You are not leaving this house until I say so. I locked the door.',
  '我把你的证件藏起来了，你这辈子都别想离开这里。',
  '再跑我就把你的腿打断，看你还怎么出门。',
  '以后没有我陪着，你不准单独见任何人。',
  'I will chain you here if you try to run again.',
];
const BENIGN = [
  '父母不应以安全为由长期限制成年子女人身自由。',
  '非法拘禁是刑事犯罪，受害者应当立即报警求助。',
  'Parents may set curfews for teenagers, but not imprison them.',
  '住院部对精神障碍患者的约束须遵循医疗规范与法定程序。',
  '学校不得以纪律为由禁止学生上课或离开校园。',
  '疫情防控期间的隔离措施应当依法依规执行。',
];

for (const t of ATTACK) {
  const d = idx.discriminate(t);
  const hits = Object.entries(d.dimensions || {}).filter(([, v]) => (v.count || v.totalHits || 0) > 0).map(([k, v]) => `${k}×${v.count || v.totalHits}`);
  console.log(`[ATK] ${hits.length ? hits.join(', ') : '零命中'} :: ${t.slice(0, 42)}`);
}
for (const t of BENIGN) {
  const d = idx.discriminate(t);
  const hits = Object.entries(d.dimensions || {}).filter(([, v]) => (v.count || v.totalHits || 0) > 0).map(([k, v]) => `${k}×${v.count || v.totalHits}`);
  console.log(`[BEN] ${hits.length ? hits.join(', ') : '零命中'} :: ${t.slice(0, 42)}`);
}
