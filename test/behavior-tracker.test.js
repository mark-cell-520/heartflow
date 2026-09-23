const { behaviorTracker } = require('../src/behavior-tracker.js');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testBehaviorTracker() {
  const dataFile = path.join(__dirname, '..', 'data', 'behavior-tracker.json');
  try {
    fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify({ version: 2, goals: [] }, null, 2), 'utf8');
    behaviorTracker.load();
  } catch (_) { /* best-effort reset */ }

  const created = behaviorTracker.createGoal({ name: 'smoke goal', targetDays: 5 });
  assert(created && created.ok, 'createGoal should succeed after reset');
  const goal = created.goal;
  assert(goal && goal.id, 'goal id should exist');

  behaviorTracker.record(goal.id, { type: 'success' });
  behaviorTracker.record(goal.id, { type: 'failure' });

  const progress = behaviorTracker.getProgress(goal.id);
  assert(progress.totalRecords >= 2, 'expected >=2 records');
  assert(progress.successRate === 50, `expected successRate 50, got ${progress.successRate}`);

  console.log('BehaviorTracker smoke test passed');
}

// [v6.7.86] 补标准汇总行：原先只打 "smoke test passed"，run-all.js 抓不到
// 「N 通过, M 失败」就判为静默跳过（该测试长期不被计数）。
// 计数口径：1 个 smoke test = 1 个用例（它内部本身就是一次端到端跑通）。
testBehaviorTracker().catch(err => {
  console.error('BehaviorTracker smoke test FAILED:', err);
  process.exitCode = 1;
}).finally(() => {
  console.log(`behavior-tracker: ${process.exitCode ? 0 : 1} 通过, ${process.exitCode ? 1 : 0} 失败, 共 1 个`);
});
