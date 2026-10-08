#!/usr/bin/env node
/**
 * r638 decision 本体选方向（替代脑内模拟）
 * 候选来自 /tmp/r638-candidates2.json 的实测证据（公有方法数 / 可零参调用数 / 别名情况）
 */
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

const cands = [
  '[A] memoryIndex —— 启动索引/会话连续性引擎，18/18 公有方法零参可跑（getIdentity/getUser/getProject/getContext/healthCheck/recordBoot/addFeedback/addUnresolvedProblem/resolveProblem）。引擎自己每次重启都变失忆，这是「辨别者该记住上次为什么被判错」的底座。此前 dispatch 0 条可达。',
  '[B] memoryKernel —— 记忆内核，15/15 公有方法零参可跑，含 validate（违规校验）/ audit / getInheritedContext / recordSelf / writeSelfMemory。它决定「哪些记忆被允许写入」，是记忆写入的守门人，也是隐私铁律（个人数据严禁入记忆库）的执行位置。此前 dispatch 0 条可达。',
  '[C] associativeEngine —— 联想引擎 11/11 零参可跑，process/processL1-L5 已有分层（L3 主动机原型匹配、L4 意图理解、质量分）。此前 dispatch 0 条可达。',
  '[D] globalWorkspace —— 全局工作空间（认知广播竞争）11/11 零参可跑，registerAgent/cognitiveCycle/determineWinner/integrate。此前 dispatch 0 条可达。',
  '[E] dreamConsolidation —— 梦境巩固引擎 7/7 零参可跑（dream/dreamNow/dreamCycle/getDecayParams），已有睡眠分级与遗忘曲线参数。此前 dispatch 0 条可达。',
  '[F] decisionFeedback —— 决策反馈学习 8/8 零参可跑（recordOutcome/getAdjustedWeight/getRuleEffectiveness/adjustPriorities）。此前 dispatch 0 条可达。',
  '[G] core(alias=evolution) —— 进化核心 11/11 零参可跑（evolve/processQueue/heal/recordOutcome/retrieveLessons/getDiagnostics/getStats）。此前 dispatch 0 条可达。',
  '[H] outputChecklist —— 输出检查单 3/3 零参可跑（runChecklist/quickCheck）。此前 dispatch 0 条可达。',
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({
    task: '选下一轮心虫升级方向',
    prompt: cands.join('\n') + '\n\n约束：①只能选一个；②优先选「接线后能立刻给引擎增加此前不具备的辨别能力」的，不是纯基础设施；③优先选管道与引擎核心职责（辨别对错好坏）最直接相关的。',
  });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('DECIDE_FAIL', e.message); process.exit(1); });
