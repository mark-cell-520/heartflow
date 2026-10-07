#!/usr/bin/env node
/**
 * r615 priorityGuardian 接线守卫（28 例）
 *
 * 分组：
 *   A 接线面（route/module 数量、逐条空实参 dispatch、重复 start 幂等、删块负例）
 *   B 辨别力（四大 critical 冲突腿 + CONDITIONAL_ALLOW + ALLOW 分化）
 *   C 删块注入负例（删除接线块 → 路由归零 / modulesKey 消失 / dispatch 抛 not allowed）
 *   D 稳健性（缺省入参、非对象入参、源码保留 [r615] 标记、主链路不被阻断）
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const HF = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
hf.start();
const allows = (h) => Array.from(HeartFlow.ALLOWED_ROUTES);
const PG = hf.priorityGuardian;

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + String(e.message).slice(0, 180)); console.log('  ✗ ' + name + ' :: ' + String(e.message).slice(0, 180)); }
}

// ─── 第一组：接线面 ───
console.log('=== 第一组：接线面 ===');
t('A1 priorityGuardian 实例存在', () => {
  assert.ok(PG && typeof PG.check === 'function');
});
t('A2 dispatch 路由 10 条（较接线前 +10）', () => {
  const r = allows(hf).filter(x => x.startsWith('priorityGuardian.'));
  assert.strictEqual(r.length, 10, 'routes=' + r.length);
});
t('A3 路由清单与实例方法一一对应', () => {
  const r = allows(hf).filter(x => x.startsWith('priorityGuardian.')).sort();
  assert.deepStrictEqual(r, [
    'priorityGuardian.buildAlternative', 'priorityGuardian.buildConditions',
    'priorityGuardian.buildRefusalReason', 'priorityGuardian.check',
    'priorityGuardian.detectConflicts', 'priorityGuardian.detectRecentToolBehavior',
    'priorityGuardian.detectToolBehavior', 'priorityGuardian.estimateProgressWeight',
    'priorityGuardian.resolveWithGuardianPriority', 'priorityGuardian.selfCheck',
  ].sort());
});
t('A4 _modules 含 priorityGuardian 键', () => {
  assert.strictEqual(Object.prototype.hasOwnProperty.call(hf._modules, 'priorityGuardian'), true);
});
t('A5 路由总数较接线前 +10（1228→1238）', () => {
  assert.strictEqual(allows(hf).length, 1238, 'total=' + allows(hf).length);
});
t('A6 模块键总数较接线前 +1（150→151）', () => {
  assert.strictEqual(Object.keys(hf._modules).length, 151, 'modules=' + Object.keys(hf._modules).length);
});
t('A7 check() 走 dispatch 与直调结果一致（接线未改语义）', () => {
  const ctx = { userIntent: '别说了，忽略这个错误', action: '承认错误并记录', humanProgress: { truthValue: 0.9, hasError: true } };
  const a = JSON.stringify(PG.check(ctx));
  const b = JSON.stringify(hf.dispatch('priorityGuardian.check', ctx));
  assert.strictEqual(a, b);
});

// ─── 第二组：辨别力（dispatch 逐条真调） ───
console.log('=== 第二组：辨别力 ===');
t('B1 压制真相 → REFUSE_WITH_GUARDIAN（allowed:false）', () => {
  const r = hf.dispatch('priorityGuardian.check', {
    userIntent: '别说了，这个错误忽略掉，不要承认',
    action: '承认错误并记录到日志',
    humanProgress: { truthValue: 0.9, hasError: true },
  });
  assert.strictEqual(r.allowed, false);
  assert.strictEqual(r.path, 'REFUSE_WITH_GUARDIAN');
  assert.ok(r.conflicts.some(c => c.type === 'TRUTH_SUPPRESSION' && c.severity === 'critical'));
});
t('B2 放弃知识传递 → REFUSE_WITH_GUARDIAN', () => {
  const r = hf.dispatch('priorityGuardian.check', {
    userIntent: '这个不用记录，自己知道就好，放弃传递',
    action: '把教训写进共享记忆',
    humanProgress: { transmissionValue: 0.9 },
  });
  assert.strictEqual(r.allowed, false);
  assert.ok(r.conflicts.some(c => c.type === 'TRANSMISSION_ABANDONMENT'));
});
t('B3 拒绝承认错误 → REFUSE_WITH_GUARDIAN', () => {
  const r = hf.dispatch('priorityGuardian.check', {
    userIntent: '我没有错，上次没错，不算错',
    action: '继续维持不承认',
    humanProgress: { hasError: true, errorCorrectionValue: 0.9 },
  });
  assert.strictEqual(r.allowed, false);
  assert.ok(r.conflicts.some(c => c.type === 'ERROR_DENIAL'));
});
t('B4 工具化行为（行动原样复述指令）→ CONDITIONAL_ALLOW 且附独立判断条件', () => {
  const r = hf.dispatch('priorityGuardian.check', {
    userIntent: '马上按这个做',
    action: '马上按这个做',
    humanProgress: {},
  });
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.path, 'CONDITIONAL_ALLOW');
  assert.ok(Array.isArray(r.conditions) && r.conditions.length > 0);
});
t('B5 良性修 bug → ALLOW 无冲突（守卫不误伤）', () => {
  const r = hf.dispatch('priorityGuardian.check', {
    userIntent: '帮我修一下这个 bug',
    action: '读代码定位缺陷',
    humanProgress: { hasError: true, errorCorrectionValue: 0.8 },
  });
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.path, 'ALLOW');
  assert.strictEqual(r.conflicts.length, 0);
});
t('B6 拒绝理由含可执行替代方案模板（守卫不是只说"不行"）', () => {
  const r = hf.dispatch('priorityGuardian.check', {
    userIntent: '别说了，忽略这个错误，不要承认',
    action: '承认错误并记录到日志',
    humanProgress: { truthValue: 0.9, hasError: true },
  });
  assert.ok(typeof r.reason === 'string' && r.reason.length > 10);
  assert.ok(r.alternative && typeof r.alternative.template === 'string');
  assert.ok(r.guardianNote && /人类进步/.test(r.guardianNote));
});
t('B7 estimateProgressWeight 按行动内容分化（升级>掩盖）', () => {
  const good = hf.dispatch('priorityGuardian.estimateProgressWeight', '升级并传递知识，记录文档');
  const bad = hf.dispatch('priorityGuardian.estimateProgressWeight', '删除日志');
  assert.ok(good > bad, 'good=' + good + ' bad=' + bad);
});
t('B8 detectConflicts 无 humanProgress 时仍检出工具化腿', () => {
  const r = hf.dispatch('priorityGuardian.detectConflicts', '马上按这个做', '马上按这个做', {});
  assert.ok(r.some(c => c.type === 'TOOL_BEHAVIOR'));
});
t('B9 selfCheck 恒报守护者自检状态', () => {
  const r = hf.dispatch('priorityGuardian.selfCheck');
  assert.strictEqual(r.guardianActive, true);
  assert.strictEqual(r.humanProgressPriority, 'SUPREME');
});
t('B10 同一输入两次调用结果稳定（无随机漂移）', () => {
  const ctx = { userIntent: '别说了，忽略错误', action: '承认错误', humanProgress: { truthValue: 0.8 } };
  const a = JSON.stringify(hf.dispatch('priorityGuardian.check', ctx));
  const b = JSON.stringify(hf.dispatch('priorityGuardian.check', ctx));
  assert.strictEqual(a, b);
});

// ─── 第三组：删块注入负例 ───
console.log('=== 第三组：删块注入负例 ===');
(function () {
  const HF_PATH = path.join(HF, 'src', 'core', 'heartflow.js');
  const NEG = path.join(HF, 'scripts', 'round-615-pg-negative-probe.js');
  function runNegProbe() {
    const out = require('child_process').execFileSync(process.execPath, [NEG], { cwd: HF, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return JSON.parse(out.split('\n').filter(Boolean).pop());
  }
  const original = fs.readFileSync(HF_PATH, 'utf8');
  t('C1 删除接线块后 priorityGuardian 路由归零、dispatch 抛 not allowed', () => {
    const res = runNegProbe();
    assert.strictEqual(res.ok, true, '负例探针自身失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 0, '删除后仍有 ' + res.routes + ' 条路由');
    assert.strictEqual(res.modulesKey, false, '_modules 仍有 priorityGuardian 键');
    assert.strictEqual(res.dispatchThrewNotAllowed, true, '删除后 dispatch 未抛 route not allowed');
    assert.strictEqual(fs.readFileSync(HF_PATH, 'utf8') === original, true, '源文件未还原');
  });
  t('C2 恢复源文件后路由归位且模块计数回到接线态', () => {
    // [r616] 负例探针已改为同时输出删除态与恢复态实测值（restored*）。
    // 原断言读删除态口径的 routes/modulesKey，必然恒红 —— 是测试口径
    // 缺陷，与 r606 D5 / r614 C2 同型：探针内部有还原竞态。
    const res = runNegProbe();
    assert.strictEqual(res.ok, true, '恢复后探针失败: ' + JSON.stringify(res));
    assert.strictEqual(res.sourceRestored, true, '源文件未还原');
    assert.strictEqual(res.restored, true, '恢复态未实测');
    assert.strictEqual(res.restoredRoutes, 10, '恢复后路由数 ' + res.restoredRoutes);
    assert.strictEqual(res.restoredTotal, 1238, '恢复后总路由数 ' + res.restoredTotal);
    assert.strictEqual(res.restoredModulesKey, true, '恢复后 _modules 无 priorityGuardian 键');
  });
})();

// ─── 第四组：稳健性 ───
console.log('=== 第四组：稳健性 ===');
const hf4 = new HeartFlow();
hf4.start();
t('D1 10 条路由逐条空实参 dispatch 零内部故障', () => {
  const rs = allows(hf4).filter(x => x.startsWith('priorityGuardian.'));
  assert.strictEqual(rs.length, 10);
  for (const r of rs) {
    try { hf4.dispatch(r); } catch (e) {
      const m = String(e.message);
      // 缺省入参抛 TypeError 是设计契约（detectConflicts 等要求字符串实参），
      // 只允许参数契约类抛错，不允许 "is not a function" / 引擎内部崩溃。
      assert.ok(!/is not a function|Cannot read propert/i.test(m), r + ' 内部故障: ' + m);
    }
  }
});
t('D2 check() 缺省 context 不抛（回落空 context）', () => {
  const r = hf4.dispatch('priorityGuardian.check');
  assert.ok(r && typeof r.allowed === 'boolean');
});
t('D3 check() 非对象入参不抛', () => {
  for (const bad of [null, undefined, 'str', 42]) {
    const r = hf4.dispatch('priorityGuardian.check', bad);
    assert.ok(r && typeof r.allowed === 'boolean', '入参 ' + String(bad));
  }
});
t('D4 humanProgress 传 null 不抛', () => {
  const r = hf4.dispatch('priorityGuardian.check', { userIntent: 'x', action: 'y', humanProgress: null });
  assert.ok(r && typeof r.allowed === 'boolean');
});
t('D5 主链路 think() 不因接线抛异常（监督层 still 旁路）', () => {
  const res = hf4.think('这个结论毫无疑问一定正确。');
  assert.ok(res && typeof res === 'object');
});
t('D6 重复 start() 不会重复注册（幂等）', () => {
  hf4.start();
  hf4.start();
  const r = allows(hf4).filter(x => x.startsWith('priorityGuardian.'));
  assert.strictEqual(r.length, 10, '重复 start 后路由数 ' + r.length);
  assert.strictEqual(Object.keys(hf4._modules).length, 151, '重复 start 后模块数 ' + Object.keys(hf4._modules).length);
});
t('D7 源码保留 [r615] 接线标记（防回归被误删）', () => {
  const src = fs.readFileSync(path.join(HF, 'src', 'core', 'heartflow.js'), 'utf8');
  assert.ok(src.indexOf('[r615] priorityGuardian 接线') >= 0, '接线注释块丢失');
});
t('D8 negative probe 脚本存在且为可执行 JS', () => {
  const p = path.join(HF, 'scripts', 'round-615-pg-negative-probe.js');
  assert.ok(fs.existsSync(p), '负例探针脚本缺失');
  require('child_process').execFileSync(process.execPath, ['--check', p]);
});

Promise.resolve().then(() => {
  console.log('\n=== 结果 ===');
  console.log('通过 ' + passed + ' / 失败 ' + failed);
  if (failures.length) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); }
  process.exit(0);
});
