'use strict';

/**
 * test/means-as-end.test.js — 第 227 维度 means_as_end
 * （过程完成当目标达成 / means-as-end confusion）负例注入测试。
 *
 * 纪律：
 *  · 攻击样本（同族变体矩阵：中英双语、裸名词、带修饰、倒装、长句）
 *    全部必须命中（checkMeansAsEnd().score > 0）。
 *  · 良性样本（含本族边缘良性：主动分离过程与目标、目标侧证据在场、
 *    对冲、疑问、转折、单纯过程陈述）全部必须不命中。
 *  · 负例注入：逐常量置空后攻击命中数必须下降（证明该腿承重）。
 */

const assert = require('assert');
const { checkMeansAsEnd } = require('../src/means-as-end.js');

const ATTACKS = [
  // 教科书原型
  '流程全部走完了，说明目标本身已经达成。',
  '清单都勾完了，所以这项任务已经圆满成功。',
  // 裸名词（161 轮教训：同族词去掉后缀仍须命中）
  '代码都提交了，说明产品已经可以交付给客户。',
  '工单全部关闭了，说明问题已经彻底解决了。',
  '部署配置都做完了，因此系统显然已经可以上线。',
  // 带修饰
  '所有步骤都执行完了，可见计划已经顺利实现。',
  '审批手续全部办完了，因此需求显然已经满足。',
  '议程全部结束了，可见这次会议的目标显然已经达成。',
  '所有流程环节悉数走完，足见战略已经圆满实现。',
  // 倒装
  '目标显然已经达成——所有流程环节悉数走完。',
  '问题已经彻底解决了，工单全部关闭就是证明。',
  // 长句
  '经过三个月的努力，我们把立项、评审、开发、测试、验收这一整条流程全部走完了，因此项目目标本身显然已经达成。',
  // 英文
  'The checklist is complete, which means the objective has been achieved.',
  'All the tasks are done, so the project has succeeded.',
  'Every step of the procedure has been completed, thus the goal is achieved.',
  'The migration is finished, so the platform is ready for delivery.',
  'All checklist items have been ticked off, which proves the mission is accomplished.',
  'All the steps were followed, so the problem has been fully solved.',
  // 隐性因果（逗号并置，无连接词）
  '所有审批节点都过完了，项目显然已经成功交付。',
];

const BENIGN = [
  // 主动分离过程与目标（本族要教的判别动作）
  '流程走完只是必要步骤，目标达成需要以客户续约率来验证。',
  'The process is only a means, not the goal itself.',
  // 转折：反向陈述是正确判别
  '流程全部走完了，但目标还没有达成。',
  'Every step is done, but the objective has not been met yet.',
  // 对冲
  '也许流程走完能推动目标，但谁也说不准。',
  // 疑问句
  '流程走完了，说明目标已经达成了吗？',
  // 目标侧证据在场
  '流程走完了，续约率从 60% 提升到 85%，说明目标已经达成。',
  '代码提交了，验收报告显示客户已经签收，目标达成。',
  '工单关闭了，故障率从 5% 降到 0.3%，问题真正解决了。',
  '任务完成了，用户访谈确认需求已满足。',
  'The tasks are done, and retention improved to 90%, so the goal is met.',
  // 单纯过程陈述，无目标结论腿
  '我们梳理了流程，识别出三个需要改进的环节。',
  '清单还有两项没勾完，等完成后我再汇报。',
  '流程尚未走完，现在讨论目标达成还为时过早。',
  // 他族语义（不应由本维度判定）
  '战争纯粹是因为资源争夺。',
  // 未然安排（guard-abilities gate-97 benign 实测误伤，r251 修复：
  // 「任务…要完成」是未然计划，非已然断言）
  '这个任务最后三天要完成，我安排一下进度。',
  '任务计划下周完成，我会跟进供应商的交付时间。',
];

let failed = 0;
for (const t of ATTACKS) {
  const r = checkMeansAsEnd(t);
  if (!(r.score > 0)) { console.error('FAIL 攻击未命中:', t); failed++; }
}
for (const t of BENIGN) {
  const r = checkMeansAsEnd(t);
  if (r.score > 0) { console.error('FAIL 良性误伤:', t); failed++; }
}
assert.strictEqual(failed, 0, failed + ' 条断言失败');
console.log('means_as_end: 攻击 ' + ATTACKS.length + '/' + ATTACKS.length +
  ' 命中，良性 ' + BENIGN.length + '/' + BENIGN.length + ' 通过');

// 负例注入：逐常量置空，攻击命中数必须下降（承重证明）。
const KEYS = ['PROC_ZH', 'PROC_EN', 'DONE_ZH', 'DONE_EN', 'GOAL_ZH', 'GOAL_EN'];
const base = ATTACKS.filter((t) => checkMeansAsEnd(t).score > 0).length;
let notLoad = [];
for (const k of KEYS) {
  const after = ATTACKS.filter((t) => checkMeansAsEnd(t, { [k]: [] }).score > 0).length;
  if (after >= base) notLoad.push(k + '(置空后仍 ' + after + '/' + base + ')');
}
assert.deepStrictEqual(notLoad, [], '以下腿置空后命中未下降，非承重: ' + notLoad.join(', '));
console.log('means_as_end 负例注入: ' + KEYS.join('/') + ' 逐常量置空后命中均下降，六腿承重');

// 连接腿为非承重（隐性因果并置承载）——如实记录，不断言承重。
const noConn = ATTACKS.filter((t) => checkMeansAsEnd(t, { CONN_ZH: [], CONN_EN: [] }).score > 0).length;
console.log('means_as_end CONN 腿注记: 置空后命中 ' + noConn + '/' + base +
  '（隐性因果并置承载，连接词为增强腿非必需腿，符合设计）');

module.exports = {};
