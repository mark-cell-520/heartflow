// test/round-373-behavior-layer-wiring.test.js
// [r373] behavior 层接线守卫：实跑 hf.behavior.* 十方法，一个 THREW 都不允许。
// 背景：src/core/heartflow.js start() 的对象字面量闭包引用了全仓零声明的
// 两个标识符 → 10 个方法调用即抛 ReferenceError（probe-7 实测 10/10）。
// 本守卫钉的是**运行结果**（不是 grep 源码），负例见
// scripts/negative-test-behavior-wiring.js（删接线必须变红）。
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('PASS ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + ' — ' + e.message); }
}

function makeEngine() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-behav-373-'));
  const eng = new HeartFlow({ dataDir: path.join(root, 'data'), silent: true });
  eng.start();
  return eng;
}

const eng = makeEngine();

ok('behavior 层存在且 10 个方法都是 function（r373 硬崩复测）', () => {
  assert.ok(eng.behavior && typeof eng.behavior === 'object', 'hf.behavior 应为对象');
  const keys = ['createGoal', 'record', 'getProgress', 'formatProgress', 'getAllGoals',
    'detectWeeklyPattern', 'detectTriggerPattern', 'detectRelapseRisk', 'getReport', 'getStats'];
  for (const k of keys) assert.strictEqual(typeof eng.behavior[k], 'function', `behavior.${k} 应为 function`);
  assert.strictEqual(Object.keys(eng.behavior).length, keys.length, 'behavior 应恰好 10 个方法');
});

ok('createGoal/record/getProgress 真实链路返回数据而非抛错', () => {
  const created = eng.behavior.createGoal({ name: 'r373-guard-goal', targetDays: 7 });
  assert.ok(created && created.ok === true, `createGoal 应成功，实际 ${JSON.stringify(created).slice(0, 120)}`);
  const id = created.goal.id;
  assert.ok(eng.behavior.record(id, { type: 'success', timestamp: '2026-09-28T10:00:00Z' }).ok !== false, 'record success 应成功');
  assert.ok(eng.behavior.record(id, { type: 'failure', timestamp: '2026-09-29T10:00:00Z' }).ok !== false, 'record failure 应成功');
  const p = eng.behavior.getProgress(id);
  assert.ok(p && p.totalRecords >= 2, 'getProgress 应看到 >=2 条记录');
});

ok('getReport 含 weekly/triggers/risk 三个行为模式段', () => {
  const created = eng.behavior.createGoal({ name: 'r373-guard-report' });
  if (created && created.ok) {
    const id = created.goal.id;
    eng.behavior.record(id, { type: 'success', timestamp: '2026-09-28T10:00:00Z' });
    const rep = eng.behavior.getReport(id);
    assert.ok(rep && typeof rep === 'object', 'getReport 应返回对象');
    assert.ok('weekly' in rep && 'triggers' in rep && 'risk' in rep, 'getReport 应含 weekly/triggers/risk');
  } else {
    assert.fail('createGoal 失败，无法测 getReport');
  }
});

ok('三个行为模式方法对合法输入返回分析结果（不抛错）', () => {
  const recs = [{ timestamp: '2026-09-28T10:00:00Z', type: 'failure' }];
  const w = eng.behavior.detectWeeklyPattern(recs);
  assert.ok(w && w.error !== 'INPUT_NULL', 'detectWeeklyPattern 应返回分析结果');
  assert.ok(w.day !== undefined || w.count !== undefined, 'weekly 应含 day 或 count');
  const t = eng.behavior.detectTriggerPattern(recs);
  assert.ok(t !== undefined && t !== null, 'detectTriggerPattern 应有返回');
  const k = eng.behavior.detectRelapseRisk({ records: recs });
  assert.ok(k && typeof k.risk === 'string', 'detectRelapseRisk 应给出 risk 字符串');
});

ok('getStats/getAllGoals/formatProgress 可用', () => {
  const st = eng.behavior.getStats();
  assert.ok(st && typeof st.totalGoals === 'number', 'getStats 应含 totalGoals 数字');
  assert.ok(Array.isArray(eng.behavior.getAllGoals()), 'getAllGoals 应返回数组');
  const created = eng.behavior.createGoal({ name: 'r373-guard-format' });
  if (created && created.ok) {
    const f = eng.behavior.formatProgress(created.goal.id);
    assert.ok(typeof f === 'string' && f.length > 0, 'formatProgress 应返回非空字符串');
  }
});

ok('patternDetector 与 hf.patternDetector 接线一致（_modules 可达）', () => {
  assert.ok(eng.patternDetector && typeof eng.patternDetector.detectWeeklyPattern === 'function', 'hf.patternDetector 应可调用');
  assert.ok(eng._modules && eng._modules.patternDetector === eng.patternDetector, 'patternDetector 应注册进 _modules');
  assert.strictEqual(eng._initErrors.length, 0, 'behavior 接线不得产生 initError');
});

engine_shutdown: {
  try { eng.shutdown(); } catch (_) {}
}

console.log(`\nround-373 behavior wiring: ${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
