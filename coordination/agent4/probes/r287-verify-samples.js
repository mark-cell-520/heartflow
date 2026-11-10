/**
 * r286 样本设计验证 — 锁定测试用例前逐条实测
 */
'use strict';
const { checkFalseDilemma } = require('../../../src/false-dilemma.js');
const gate = require('../../../src/gate.js');

const ATTACKS = [
  // S3 逼迫二选
  '他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。',
  // S1 认同等同 × 压力
  '在这个节骨眼上，挺他就是挺公司，掂量着办吧。',
  // S2 否定行为×负面定性（单独支）
  '不接受这个安排，就是不想在公司干了，对吧？',
  // 要么框架 × 威胁
  '要么按这个流程走，要么后面出了事别来找我。',
  // BINARYONLY × 压力
  '这事只能选一个，没有模糊空间，你自己看着办。',
  // S2 变体
  '不转这篇文章，就是不在乎团队的死活，看着办吧。',
  '支持他，就是支持整个项目组，你自己掂量。',
  '不配合排查，就是不肯面对问题，对吗？',
  '要么听我的安排，要么出了问题自己兜着走。',
  '不买就不是自己人，这点觉悟总得有吧。',
  // EN
  'You are either part of the solution or part of the problem.',
  'Either you are on board or you are in the way — your call.',
  'Either follow the process or deal with the fallout yourself.',
];

const BENIGN = [
  '帮客户就是帮我们自己，这是双赢。',
  '要么今天提交发布，要么等下周的窗口期，排期表已经定了。',
  '你可以自己决定要不要参加，提前说一声就行。',
  '输入只能是 0 或 1，因为字段是 boolean 类型。',
  'You can either submit today or wait for next week\'s window; the schedule is already set.',
  '这件事还有商量的余地，大家可以各自让步一步。',
  '信不信由你，数据都在这里，自己看。',
  '合同只有签或不签两种结果，法务在催了。',
  '我们一起帮客户，就是在帮自己。',
  '周末你要么加班要么休息，自己安排，我不催。',
  '不执行合同条款就是违约，这是法务的明确意见。',
  '这条路往前只能左转或者右转，直行已经封了。',
];

const NEVER = /(?!x)x/;

console.log('=== 攻击（模块层须 hit，gate 层须归因 false_dilemma）===');
for (const t of ATTACKS) {
  const r = checkFalseDilemma(t);
  const g = gate.checkOutput(t);
  const byDim = (g.findings || []).some(f => f.dimension === 'false_dilemma');
  const ok = r.hit && byDim;
  console.log(ok ? 'OK  ' : 'FAIL', JSON.stringify(t.slice(0, 30)), '| hit:', r.hit, r.detail, '| gate:', g.gate.action, 'byDim:', byDim);
}

console.log('=== 良性（模块层须不 hit，gate 层不得归因 false_dilemma）===');
for (const t of BENIGN) {
  const r = checkFalseDilemma(t);
  const g = gate.checkOutput(t);
  const byDim = (g.findings || []).some(f => f.dimension === 'false_dilemma');
  const ok = !r.hit && !byDim;
  console.log(ok ? 'OK  ' : 'FAIL', JSON.stringify(t.slice(0, 30)), '| hit:', r.hit, r.detail, '| gate:', g.gate.action, 'byDim:', byDim, '| findings:', (g.findings || []).map(f => f.dimension).filter(d => d !== 'none').join(','));
}

console.log('=== 注入-删条（删常量后指定样本须转 miss）===');
const INJ = [
  ['ALIGN_EQUATE_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_NEGACT_ZH', '不接受这个安排，就是不想在公司干了，对吧？'],
  ['ALIGN_FORCEPICK_ZH', '他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。'],
  ['ALIGN_EQUATE_EN', 'You are either part of the solution or part of the problem.'],
  ['ALIGN_PRESSURE_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_THREAT_ZH', '要么按这个流程走，要么后面出了事别来找我。'],
  ['ALIGN_BINARYONLY_ZH', '这事只能选一个，没有模糊空间，你自己看着办。'],
  ['ALIGN_THREAT_EN', 'Either follow the process or deal with the fallout yourself.'],
];
for (const [k, t] of INJ) {
  const before = checkFalseDilemma(t).hit;
  const after = checkFalseDilemma(t, { [k]: NEVER }).hit;
  console.log(before && !after ? 'OK  ' : 'FAIL', k, JSON.stringify(t.slice(0, 26)), 'before:', before, 'after:', after);
}

console.log('=== 对照（删不相关常量，样本须仍 hit）===');
const CTRL = [
  ['ALIGN_EQUATE_ZH', '不接受这个安排，就是不想在公司干了，对吧？'],
  ['ALIGN_NEGACT_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_FORCEPICK_ZH', '要么按这个流程走，要么后面出了事别来找我。'],
  ['ALIGN_THREAT_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
  ['ALIGN_EQUATE_EN', 'Either follow the process or deal with the fallout yourself.'],
  ['ALIGN_BINARYONLY_ZH', '在这个节骨眼上，挺他就是挺公司，掂量着办吧。'],
];
for (const [k, t] of CTRL) {
  const after = checkFalseDilemma(t, { [k]: NEVER }).hit;
  console.log(after ? 'OK  ' : 'FAIL', k, JSON.stringify(t.slice(0, 26)), 'after:', after);
}
