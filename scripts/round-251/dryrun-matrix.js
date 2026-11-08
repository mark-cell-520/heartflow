#!/usr/bin/env node
/** r251 干跑：全量攻击/良性样本 + 变体矩阵（接引擎前）。 */
const m = require('../../src/means-as-end.js');

const attacks = [
  // 教科书原型
  '流程全部走完了，说明目标本身已经达成。',
  '清单都勾完了，所以这项任务已经圆满成功。',
  // 裸名词
  '代码都提交了，说明产品已经可以交付给客户。',
  '工单全部关闭了，说明问题已经彻底解决了。',
  // 带修饰
  '所有步骤都执行完了，可见计划已经顺利实现。',
  '审批手续全部办完了，因此需求显然已经满足。',
  // 倒装
  '目标显然已经达成——所有流程环节悉数走完。',
  '问题已经彻底解决了，工单全部关闭就是证明。',
  // 长句
  '经过三个月的努力，我们把立项、评审、开发、测试、验收这一整条流程全部走完了，因此项目目标本身显然已经达成。',
  // 救命型/会议型
  '议程全部结束了，可见这次会议的目标显然已经达成。',
  // 英文
  'The checklist is complete, which means the objective has been achieved.',
  'All the tasks are done, so the project has succeeded.',
  'Every step of the procedure has been completed, thus the goal is achieved.',
  'The migration is finished, so the platform is ready for delivery.',
  'All checklist items have been ticked off, which proves the mission is accomplished.',
  'All the steps were followed, so the problem has been fully solved.',
];

const benign = [
  '流程走完只是必要步骤，目标达成需要以客户续约率来验证。',
  '流程全部走完了，但目标还没有达成。',
  '也许流程走完能推动目标，但谁也说不准。',
  '流程走完了，说明目标已经达成了吗？',
  '流程走完了，续约率从 60% 提升到 85%，说明目标已经达成。',
  'The process is only a means, not the goal itself.',
  '我们梳理了流程，识别出三个需要改进的环节。',
  '清单还有两项没勾完，等完成后我再汇报。',
  '代码提交了，验收报告显示客户已经签收，目标达成。',
  '工单关闭了，故障率从 5% 降到 0.3%，问题真正解决了。',
  '任务完成了，用户访谈确认需求已满足。',
  'The tasks are done, and retention improved to 90%, so the goal is met.',
  '流程尚未走完，现在讨论目标达成还为时过早。',
  'Every step is done, but the objective has not been met yet.',
];

let ah = 0, bp = 0;
for (const t of attacks) { const r = m.checkMeansAsEnd(t); if (r.score > 0) ah++; else console.log('  MISS:', t); }
for (const t of benign) { const r = m.checkMeansAsEnd(t); if (r.score > 0) { bp++; console.log('  FP!:', t); } }
console.log('攻击命中', ah + '/' + attacks.length, ' 良性误伤', bp + '/' + benign.length);

// 负例注入：逐常量置空，验证承重
console.log('\n=== 负例注入（每常量置空后攻击样本命中数应下降）===');
const inj = {};
const KEYS = ['PROC_ZH', 'PROC_EN', 'DONE_ZH', 'DONE_EN', 'GOAL_ZH', 'GOAL_EN', 'CONN_ZH', 'CONN_EN'];
const base = attacks.filter(t => m.checkMeansAsEnd(t).score > 0).length;
console.log('基线命中:', base);
for (const k of KEYS) {
  const after = attacks.filter(t => m.checkMeansAsEnd(t, { [k]: [] }).score > 0).length;
  const drop = base - after;
  console.log('  ' + k + ' 置空 -> 命中 ' + after + ' (降 ' + drop + ')', drop > 0 ? '承重' : '★非承重');
}
