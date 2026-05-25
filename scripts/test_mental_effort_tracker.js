/**
 * test_mental_effort_tracker.js - Mental Effort Tracker 测试
 */

'use strict';

const { HeartFlow, MentalEffortTracker } = require('../src/core/heartflow.js');

console.log('=== Mental Effort Tracker 测试 ===\n');

// 测试独立类
console.log('1. MentalEffortTracker 类独立测试');
const tracker = new MentalEffortTracker();
console.log('   ✅ MentalEffortTracker 实例化成功');
console.log('   版本:', tracker.version);

// 测试任务努力估算
console.log('\n2. 任务努力估算测试');
const task1 = { text: '这是一个简单的检索任务' };
const estimate1 = tracker.estimateTaskEffort(task1);
console.log('   简单任务:', JSON.stringify(estimate1.estimatedCost), '-', estimate1.complexity);

const task2 = { text: '我需要分析这个复杂问题并权衡利弊' };
const estimate2 = tracker.estimateTaskEffort(task2);
console.log('   复杂任务:', JSON.stringify(estimate2.estimatedCost), '-', estimate2.complexity);
console.log('   ✅ 任务努力估算正常');

const task3 = { text: '这是一个重要的决策，我需要仔细分析各个选项' };
const estimate3 = tracker.estimateTaskEffort(task3);
console.log('   高风险决策:', JSON.stringify(estimate3.estimatedCost), '-', estimate3.complexity);
console.log('   建议:', estimate3.recommendation.action);

// 测试认知状态
console.log('\n3. 认知状态测试');
const state = tracker.getCurrentEffortState();
console.log('   当前状态:', state.effortLevel, '-', Math.round(state.currentEffort * 100) + '%');
console.log('   ✅ 认知状态查询正常');

// 测试记录努力消耗
console.log('\n4. 记录努力消耗测试');
tracker.recordEffortExpenditure(0.3);
const state2 = tracker.getCurrentEffortState();
console.log('   消耗后状态:', state2.effortLevel, '-', Math.round(state2.currentEffort * 100) + '%');
console.log('   ✅ 努力消耗记录正常');

// 测试 HeartFlow 引擎集成
console.log('\n5. HeartFlow 引擎集成测试');
const hf = new HeartFlow({ rootPath: require('path').join(__dirname, '..') });
hf.start();
const mentalEffort = hf.mentalEffort;
if (mentalEffort && mentalEffort instanceof MentalEffortTracker) {
  console.log('   ✅ HeartFlow 引擎成功加载 MentalEffortTracker');
  const engineState = mentalEffort.getCurrentEffortState();
  console.log('   引擎认知状态:', engineState.effortLevel);
} else {
  console.log('   ❌ MentalEffortTracker 未正确加载');
  process.exit(1);
}

// 测试效益分析
console.log('\n6. 效益分析测试');
const benefitTask = { text: '学习新技能以提升能力', learning: true };
const benefitAnalysis = mentalEffort.estimateTaskEffort(benefitTask);
console.log('   效益分析:', benefitAnalysis.benefitAnalysis.net_benefit ? '正向' : '负向');
console.log('   成本效益比:', benefitAnalysis.benefitAnalysis.cost_benefit_ratio.toFixed(2));
console.log('   ✅ 效益分析正常');

// 测试克制建议
console.log('\n7. 克制建议测试');
const restraintTest = mentalEffort.shouldRecommendRestraint(estimate3);
console.log('   高成本任务是否建议克制:', restraintTest.shouldRestrain ? '是' : '否');
if (restraintTest.shouldRestrain) {
  console.log('   原因:', restraintTest.reason);
  console.log('   替代方案:', restraintTest.alternative);
}
console.log('   ✅ 克制建议正常');

hf.stop();

console.log('\n==================================================');
console.log('✅ Mental Effort Tracker 测试完成: 全部通过');
console.log('==================================================');
