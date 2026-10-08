#!/usr/bin/env node
/** r639 decision 本体选方向（r638-unwired 池复测后，decisionFeedback 已出池） */
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

const cands = [
  '[A] memoryKernel —— 记忆内核 15 公有方法全零参可跑：init/getInheritedContext/flush/validate/audit/getInitErrors/writeUserMemory/writeSelfMemory/save/load。validate 返回违规清单，决定「哪些记忆被允许写入」，是隐私铁律（个人数据严禁入记忆库）的执行位置。此前 dispatch 0 条可达。',
  '[B] memoryIndex —— 启动索引 18 方法全零参可跑：getBootSummary/recordBoot/updateUser/addFeedback/setCurrentWork/addPausedTask/resolveProblem/getIdentity/getUser/getProject/getContext/healthCheck。引擎每次重启失忆的根因侧。此前 dispatch 0 条可达。',
  '[C] selfDiagnosis —— 自诊断 1 方法 run() 零参可跑，返回 {ok,diagnosis,summary,data}，内含 _diagnoseIdentity/_diagnoseLearning/_diagnoseRestraint/_diagnoseKnowledge 四路。此前 dispatch 0 条可达。',
  '[D] outputChecklist —— 输出检查单 3 方法零参可跑：runChecklist/quickCheck/getStats，内含 _checkQuality/_checkSafety/_checkPreferences/_checkEvenhandedness 四项发布前检查。此前 dispatch 0 条可达。',
  '[E] associativeEngine —— 联想引擎 11 方法零参可跑，process/processL1-L5（L3 主动机原型匹配、L4 意图理解）已有质量分。此前 dispatch 0 条可达。',
  '[F] globalWorkspace —— 全局工作空间 11 方法零参可跑，registerAgent/cognitiveCycle/determineWinner/integrate。此前 dispatch 0 条可达。',
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({
    task: '选下一轮心虫升级方向',
    prompt: cands.join('\n') + '\n\n约束：①只能选一个；②优先「接线后立刻给引擎增加此前不具备的辨别能力」而非纯基础设施；③优先与辨别者核心职责（判对错好坏、防幻觉进人类）最直接相关；④已接线过的维度不重做。',
  });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('DECIDE_FAIL', e.message); process.exit(1); });
