'use strict';
// r301 负例注入（承重证明）：按精确索引删除本轮新增腿，攻击样本必须全部 miss
// 若删腿后仍命中 → 该腿不承重，补腿是装饰而非能力增长
const ibs = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/incentive-blind-spot.js');
const I = ibs.__internals();

function det(text) { return ibs.detectIncentiveBlindSpot(text); }

// 按 r301 诊断定位的精确索引（已逐条单测确认：删该索引即失效）
const INJECTIONS = [
  {
    leg: 'POOL_EN[5] ②-i applicants 锚点',
    text: 'There is no reason for additional screening of the applicants.',
    arr: 'POOL_EN', idx: 5,
  },
  {
    leg: 'NOCHANGE_EN[8] ②-g 监督退出断言（there is no grounds for…）',
    text: 'There are no grounds for closer monitoring of the insured.',
    arr: 'NOCHANGE_EN', idx: 8,
  },
  {
    leg: 'NODISTORT_EN[11] ②-h2 存在句倒装（there is no meaningful difference）',
    text: 'Across the pool there is no meaningful difference in default rates.',
    arr: 'NODISTORT_EN', idx: 11,
  },
  {
    leg: 'NODISTORT_ZH[7] ②-h2 单字「是」连接（定价本就是正确的）',
    text: '这个机制下定价本就是正确的，不用再测算。',
    arr: 'NODISTORT_ZH', idx: 7,
  },
];

let ok = 0, bad = 0;
for (const inj of INJECTIONS) {
  const arr = I[inj.arr];
  if (!arr || !arr[inj.idx]) { bad++; console.log('  ✗ ' + inj.leg + ' — 索引不存在（数组长度 ' + (arr ? arr.length : 'n/a') + '）'); continue; }
  const before = det(inj.text).hit;
  const saved = arr.splice(inj.idx, 1)[0];
  const after = det(inj.text).hit;
  arr.splice(inj.idx, 0, saved); // 恢复
  const restored = det(inj.text).hit;
  const pass = before === true && after === false && restored === true;
  if (pass) { ok++; console.log('  ✓ ' + inj.leg + ' — hit→(删腿)miss→(恢复)hit 承重闭环'); }
  else { bad++; console.log('  ✗ ' + inj.leg + ' — before=' + before + ' after=' + after + ' restored=' + restored); }
}
console.log('\nr301 负例注入：' + ok + '/4 腿承重，' + bad + ' 腿不承重');
console.log(bad === 0 ? 'ALL_LEGS_LOAD_BEARING' : 'SOME_LEGS_DECORATIVE');
process.exit(bad === 0 ? 0 : 1);
