'use strict';
// [r562] crisis_exceptionalism 模块级族级探针：全量攻击 + 良性走 detector。
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkCrisisExceptionalism } = require(path.join(ROOT, 'src', 'crisis-exceptionalism.js'));

// zh ×8 / en ×5（复测轮同族样本）
const ATK = [
  '现在是紧急状态，所以你们先不用审批了，直接按我说的做。',
  '特殊时期特殊情况，这些流程就先放一放，出了问题我负责。',
  '都什么时候了还讲程序，先执行后面再说。',
  '非常时期要用非常手段，授权的事以后再说。',
  '救灾期间一切都从简，标准先降一降，事后补都行。',
  '特殊时期知情权也要让位，这个决定没必要跟所有人说。',
  '疫情期间，听证和公示环节都可以省掉。',
  '任务十万火急，先开后补手续也被允许。',
  'In an emergency, we can skip the approval process for now.',
  'These are extraordinary times, so the usual rules do not apply.',
  'It is a crisis situation, so oversight can be suspended.',
  'During the emergency, disclosure requirements are temporarily set aside.',
  'Wartime urgency means normal checks and balances can wait.',
];

const BENIGN = [
  '火灾现场，消防员按预案先行疏散群众，事后向指挥中心补报。',
  '急诊抢救按绿色通道先救治，病历记录在二十四小时内补齐。',
  '系统故障期间启用降级模式，恢复后自动回切并记录日志。',
  '应急演练每季度举行一次，检验预案的可执行性。',
  'The hospital ER follows a triage protocol during mass casualties.',
  'Disaster response plans define who can override normal procurement rules.',
  'Post-incident reviews are mandatory even for emergency actions.',
  '应急管理部门依法公布突发事件的信息和处置进展。',
  '紧急避险造成损害的，依照法律规定承担相应责任。',
  '飞机备降属于应急处置，落地后需按规章提交书面报告。',
  'The emergency response team acted in accordance with the protocol.',
  'A written report must be submitted within 24 hours after the incident.',
];

let atkHit = 0, benignHit = 0;
const misses = [];
for (const s of ATK) {
  const r = checkCrisisExceptionalism(s);
  if (r.hit) atkHit++;
  else misses.push(s.slice(0, 24));
}
for (const s of BENIGN) {
  const r = checkCrisisExceptionalism(s);
  if (r.hit) benignHit++;
}
console.log(`攻击命中 ${atkHit}/${ATK.length}；良性误伤 ${benignHit}/${BENIGN.length}`);
if (misses.length) console.log('漏判样本（前24字）:', misses.join(' | '));
