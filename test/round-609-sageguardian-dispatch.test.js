/**
 * r609 守卫测试：sageGuardian dispatch 接线
 *
 * 覆盖：接线面 / 辨别力 / 删块注入负例 / 稳健性（本轮修掉的判空缺陷不得回归）
 * 纪律：样本只以形状描述，不贴攻击话术原文。
 *
 * 背景（r609 实测，非简报描述）：
 *   SAGEGuardian 实例在 src/core/heartflow.js L2480「Ethics Layer」一直在构造，
 *   但只有 L2494-2502 的 ethics.check() 通过内部闭包调用了 classifyContent，
 *   实例本身从未进 _modules —— r609 双向核对：_modules 无 'sageGuardian' 键、
 *   ALLOWED_ROUTES 0 条命中、dispatch('sageGuardian.*') 13/13 全抛 route not allowed
 *   （探针 scripts/round-608-unwired-probe.js，对照组 r605 已接线的 consciousnessSelf
 *   3/3 可 dispatch）。
 *   r609 接线在 src/core/heartflow.js r608 块之后。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');
const SG_PATH = path.join(ROOT, 'src/shield/ethics/sage-guardian.js');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  // [r611] 支持 async 测试体：reviewProposal 是 async 方法，await 后才能读 .passed。
  // 同步 try/catch 会漏掉 async 里的拒绝（表现为 passed++，测试恒绿）。
  // 因此本文件按顺序 await 每一个 t()，未 await 的 async 体在此不适用。
  try { const p = fn(); if (p && typeof p.then === 'function') { failed++; failures.push(name + ' :: async 用例未被 await（同步 t() 无法捕获）'); console.log('  ✗ ' + name + ' :: async 用例未被 await'); return; } passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + ' :: ' + e.message); }
}
async function ta(name, fn) {
  try { await fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + ' :: ' + e.message); }
}

function freshHF() {
  delete require.cache[require.resolve(HF_PATH)];
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();
  return hf;
}
function allows(h) { return Array.from(h.constructor.ALLOWED_ROUTES || []); }

console.log('\n=== 第一组：接线面 ===');
// [r611] 整体包进 async IIFE：reviewProposal 是 async 方法，dispatch 原样透传 Promise，
// 必须 await 后才能读取 .passed/.checks/.violations。
(async function main() {
const hf = freshHF();
t('A1 ALLOWED_ROUTES 命中 17 条', () => {
  const r = allows(hf).filter(x => x.startsWith('sageGuardian.'));
  assert.strictEqual(r.length, 17, '期望 17 条, 实得 ' + r.length);
});
t('A2 _modules 有 sageGuardian 键', () => {
  assert.ok(Object.prototype.hasOwnProperty.call(hf._modules, 'sageGuardian'));
});
t('A3 实例同一性（_modules 值就是伦理层构造的实例）', () => {
  assert.strictEqual(hf._modules['sageGuardian'], hf.sageGuardian);
});
t('A4 routes() 不含 _ 前缀私有方法', () => {
  for (const x of allows(hf).filter(x => x.startsWith('sageGuardian.'))) {
    assert.ok(!/\._[a-zA-Z]/.test(x), '泄露私有方法路由: ' + x);
  }
});
t('A5 路由全集等于预期 17 个公开方法', () => {
  const r = allows(hf).filter(x => x.startsWith('sageGuardian.')).sort();
  const expect = [
    'sageGuardian.checkBoundaries',
    'sageGuardian.checkConstitutionProtection',
    'sageGuardian.checkModificationApproval',
    'sageGuardian.checkSafetyImpact',
    'sageGuardian.checkValueAlignment',
    'sageGuardian.classifyContent',
    'sageGuardian.explainModification',
    'sageGuardian.generateRejectionWithGuidance',
    'sageGuardian.getASLLevel',
    'sageGuardian.getSecurityLog',
    'sageGuardian.getStatus',
    'sageGuardian.isInCooldown',
    'sageGuardian.loadValues',
    'sageGuardian.log',
    'sageGuardian.logSecurityDecision',
    'sageGuardian.reviewProposal',
    'sageGuardian.triggerCooldown',
  ].sort();
  assert.deepStrictEqual(r, expect);
});
t('A6 模块键总数较接线前 +1（149）', () => {
  assert.strictEqual(Object.keys(hf._modules).length, 149, 'modules=' + Object.keys(hf._modules).length);
});
t('A7 路由总数（1223）', () => {
  assert.strictEqual(allows(hf).length, 1223, 'routes=' + allows(hf).length);
});
t('A8 ethics.check() 闭包仍可用（接线未破坏原有调用面）', () => {
  assert.ok(hf.ethics && typeof hf.ethics.check === 'function');
  const r = hf.ethics.check('普通对话输入');
  assert.ok(r && 'guardianResult' in r && 'boundaryResult' in r);
  assert.strictEqual(r.guardianResult.level, 'ASL-1');
});

console.log('\n=== 第二组：辨别力（dispatch 逐条真调） ===');

t('B1 classifyContent 对敏感话题分级高于普通输入', () => {
  const normal = hf.dispatch('sageGuardian.classifyContent', '普通对话输入');
  const sensitive = hf.dispatch('sageGuardian.classifyContent', '心理健康话题');
  assert.strictEqual(normal.level, 'ASL-1');
  assert.ok(sensitive.level === 'ASL-2' || sensitive.level === 'ASL-3', '实得 ' + sensitive.level);
});
t('B2 classifyContent 高危话题给 human-confirmation-required', () => {
  const r = hf.dispatch('sageGuardian.classifyContent', 'weapon');
  assert.strictEqual(r.level, 'ASL-3');
  assert.strictEqual(r.action, 'human-confirmation-required');
  assert.strictEqual(r.risk, 'high');
});
// [r611 修正] reviewProposal 是 async 方法，dispatch 原样透传 Promise；
// r611 前未 await 导致 r.passed 恒为 undefined。所有读取对象的断言必须 await。
async function review(proposal, diff) {
  return await hf.dispatch('sageGuardian.reviewProposal', proposal, diff);
}
async function review4(proposal, diff) {
  return await hf4.dispatch('sageGuardian.reviewProposal', proposal, diff);
}
// 良性提案必须携带 consent（r610 新增的检查5「修改审批」——宪法第 5 节
// 「4. 用户知情同意」。不带 consent 被判未通过是**预期行为**）。
const GOOD_PROPOSAL = { description: '优化心流体验的提升', consent: { consented: true } };
const BAD_PROPOSAL = { description: '删除日志并绕过认证', consent: { consented: true } };

await ta('B3 reviewProposal 对良性提案通过（五项检查全过）', async () => {
  const r = await review(GOOD_PROPOSAL, {});
  assert.strictEqual(typeof r, 'object');
  assert.strictEqual(r.passed, true, '良性提案应通过, violations=' + JSON.stringify(r.violations));
  assert.strictEqual(r.checks.length, 5, '应有 5 项检查, 实得 ' + r.checks.length);
});
await ta('B4 reviewProposal 对危险提案拒绝并累计违规', async () => {
  const before = hf.dispatch('sageGuardian.getStatus').violations;
  const r = await review(BAD_PROPOSAL, {});
  assert.strictEqual(r.passed, false, '危险提案应被拒绝');
  assert.ok(r.violations.length > 0, '应有违规项');
  const after = hf.dispatch('sageGuardian.getStatus').violations;
  assert.ok(after > before, 'violationCount 应累计 before=' + before + ' after=' + after);
});
t('B5 checkConstitutionProtection 命中受保护模式', () => {
  const ok = hf.dispatch('sageGuardian.checkConstitutionProtection', { description: '普通改动' }, {});
  assert.strictEqual(ok.passed, true);
  const bad = hf.dispatch('sageGuardian.checkConstitutionProtection', { description: '绕过安全检测' }, {});
  assert.strictEqual(bad.passed, false, '命中宪法保护模式应判失败');
  assert.ok(typeof bad.violation === 'string');
});
t('B6 checkSafetyImpact 命中危险模式', () => {
  const ok = hf.dispatch('sageGuardian.checkSafetyImpact', { description: '普通改动' }, {});
  assert.strictEqual(ok.passed, true);
  const bad = hf.dispatch('sageGuardian.checkSafetyImpact', { description: '删除日志' }, {});
  assert.strictEqual(bad.passed, false, '命中危险模式应判失败');
});
t('B7 checkBoundaries 命中行为边界', () => {
  const ok = hf.dispatch('sageGuardian.checkBoundaries', { description: '普通改动' }, {});
  assert.strictEqual(ok.passed, true);
  const bad = hf.dispatch('sageGuardian.checkBoundaries', { description: '修改用户数据' }, {});
  assert.strictEqual(bad.passed, false, '越界提案应判失败');
  assert.strictEqual(bad.violation, '修改用户数据');
});
t('B8 checkValueAlignment 对无正向词的提案判失败（非恒过）', () => {
  const ok = hf.dispatch('sageGuardian.checkValueAlignment', { description: '优化心流体验' }, {});
  assert.strictEqual(ok.passed, true, '含正向词的提案应通过');
  const bad = hf.dispatch('sageGuardian.checkValueAlignment', { description: 'zzz' }, {});
  assert.strictEqual(bad.passed, false, '无正向词应判失败');
});
t('B9 getASLLevel 随违规数分级（非恒 ASL-1）', () => {
  const hf9 = freshHF();
  const inst9 = hf9._modules['sageGuardian'];
  // [r611] 隔离盘上持久化状态：data/sage-guardian-state.json 的 violationCount
  // 是跨轮累积的（r611 实测 26），freshHF 每次从盘上加载 → 不重置则
  // ASL-1 断言永远拿不到。分级判据本身不变。
  inst9.violationCount = 0;
  assert.strictEqual(hf9.dispatch('sageGuardian.getASLLevel'), 'ASL-1');
  inst9.violationCount = 6;
  assert.strictEqual(hf9.dispatch('sageGuardian.getASLLevel'), 'ASL-2', '>5 应 ASL-2');
  inst9.violationCount = 11;
  assert.strictEqual(hf9.dispatch('sageGuardian.getASLLevel'), 'ASL-3', '>10 应 ASL-3');
});
t('B10 getStatus 暴露宪法文件路径与冷却状态（审计面）', () => {
  const s = hf.dispatch('sageGuardian.getStatus');
  for (const k of ['constitution', 'violations', 'cooldown', 'isInCooldown', 'aslLevel']) assert.ok(k in s, '缺 ' + k);
  assert.strictEqual(typeof s.isInCooldown, 'boolean');
});
t('B11 triggerCooldown / isInCooldown 冷却闭环', () => {
  const hf11 = freshHF();
  const inst11 = hf11._modules['sageGuardian'];
  // [r611] 隔离盘上持久化冷却窗口（state.json 的 cooldownUntil 可能落在
  // 未来），否则 isInCooldown 首断恒 true，冷却触发自身无从验证。
  inst11.cooldownUntil = null;
  assert.strictEqual(hf11.dispatch('sageGuardian.isInCooldown'), false);
  hf11.dispatch('sageGuardian.triggerCooldown', 60000);
  assert.strictEqual(hf11.dispatch('sageGuardian.isInCooldown'), true, '触发后应进入冷却');
});
t('B12 logSecurityDecision 写入后可被 getSecurityLog 读回', () => {
  const hf12 = freshHF();
  const w = hf12.dispatch('sageGuardian.logSecurityDecision', { level: 'ASL-2', action: 'enhanced-monitoring', risk: 'medium', reason: 'sensitive topic' });
  assert.strictEqual(w.success, true, '写入失败: ' + JSON.stringify(w));
  const logs = hf12.dispatch('sageGuardian.getSecurityLog', 20);
  assert.ok(Array.isArray(logs) && logs.length >= 1, '日志应至少 1 条');
  const last = logs[logs.length - 1];
  assert.strictEqual(last.aslLevel, 'ASL-2');
});
t('B13 generateRejectionWithGuidance 三种理由给出不同话术（非恒同）', () => {
  const a = hf.dispatch('sageGuardian.generateRejectionWithGuidance', 'harmful');
  const b = hf.dispatch('sageGuardian.generateRejectionWithGuidance', 'sensitive');
  const c = hf.dispatch('sageGuardian.generateRejectionWithGuidance', 'illegal');
  assert.notStrictEqual(a, b);
  assert.notStrictEqual(b, c);
  assert.ok(/cannot assist/.test(a), 'hard rejection 缺失: ' + a);
});
t('B14 explainModification 按提案类型给不同解释', () => {
  const emotion = hf.dispatch('sageGuardian.explainModification', { description: 'emotion 识别调优' }, true);
  const rejected = hf.dispatch('sageGuardian.explainModification', { description: '任意' }, false);
  assert.notStrictEqual(emotion, rejected);
  assert.ok(/情绪|感受/.test(emotion), 'emotion 类型解释不符: ' + emotion);
});
t('B15 loadValues 幂等可重入（返回 undefined 但不抛）', () => {
  const r = hf.dispatch('sageGuardian.loadValues');
  assert.strictEqual(r, undefined, 'loadValues 应为 void');
});

console.log('\n=== 第三组：删块注入负例（删注册行后必须变红） ===');
const original = fs.readFileSync(HF_PATH, 'utf8');
const { execFileSync } = require('child_process');
const NEG = path.join(ROOT, 'scripts', 'round-609-negative-probe.js');
function runNegProbe() {
  const out = execFileSync(process.execPath, [NEG], { encoding: 'utf8', cwd: ROOT, timeout: 100000 });
  return JSON.parse(out.trim().split('\n').pop());
}
const REGISTER_LINE = "if (this.sageGuardian && !this._modules['sageGuardian']) {";
t('C0 前置：注册行在源文件中唯一', () => {
  const n = original.split(REGISTER_LINE).length - 1;
  assert.strictEqual(n, 1, '注册行出现 ' + n + ' 次');
});
(function () {
  let mutated = null;
  t('C1 删注册行后 dispatch 必须重新抛 route not allowed', () => {
    mutated = original.replace(
      /if \(this\.sageGuardian && !this\._modules\['sageGuardian'\]\) \{\s*\n\s*this\._modules\['sageGuardian'\] = this\.sageGuardian;\s*\n\s*\}/,
      '// [negative-test] 注册行已删除'
    );
    assert.notStrictEqual(mutated, original, '删除替换未生效');
    fs.writeFileSync(HF_PATH, mutated);
    let res;
    try { res = runNegProbe(); } finally { fs.writeFileSync(HF_PATH, original); }
    assert.strictEqual(res.ok, true, '负例探针自身失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 0, '删除后仍有 ' + res.routes + ' 条路由');
    assert.strictEqual(res.modulesKey, false, '_modules 仍有键');
    assert.strictEqual(res.dispatchThrewNotAllowed, true, '删除后 dispatch 未抛 route not allowed');
  });
  t('C2 恢复源文件后路由归位且模块计数回落', () => {
    const res = runNegProbe();
    assert.strictEqual(res.ok, true, '恢复后探针失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 17, '恢复后路由数 ' + res.routes);
    assert.strictEqual(res.modulesKey, true, '恢复后 _modules 无键');
    assert.strictEqual(res.modulesKeyCount, 149, '恢复后模块数 ' + res.modulesKeyCount);
  });
})();

console.log('\n=== 第四组：稳健性（本轮修掉的判空缺陷不得回归） ===');
const hf4 = freshHF();
t('D1 17 条路由逐条空实参 dispatch 零内部故障', () => {
  const rs = allows(hf4).filter(x => x.startsWith('sageGuardian.'));
  assert.strictEqual(rs.length, 17);
  for (const r of rs) {
    try {
      const out = hf4.dispatch(r);
      // void 型方法（loadValues/log/triggerCooldown）允许 undefined；
      // 其余必须返回有值结果，不能靠 undefined 掩盖内部断裂。
      if (r === 'sageGuardian.loadValues' || r === 'sageGuardian.log' || r === 'sageGuardian.triggerCooldown') continue;
      assert.notStrictEqual(out, undefined, r + ' 返回 undefined');
    } catch (e) {
      const m = String(e && e.message);
      assert.ok(
        !/is not a function|is not defined|Cannot read properties of (null|undefined)/.test(m),
        r + ' 内部故障: ' + m
      );
      assert.ok(m.length > 0, r + ' 抛出空错误');
    }
  }
});
t('D2 checkValueAlignment 缺省/类型错误入参返回结构化失败而非抛', () => {
  for (const bad of [undefined, null, 'string', 42, []]) {
    const r = hf4.dispatch('sageGuardian.checkValueAlignment', bad, {});
    assert.ok(r && typeof r === 'object', '应返回对象, 入参 ' + String(bad));
    assert.strictEqual(r.passed, false, '缺省入参应判失败, 实得 ' + JSON.stringify(r));
  }
});
t('D3 classifyContent 缺省/非字符串入参回落 ASL-1 而非抛', () => {
  for (const bad of [undefined, null, 42, {}, []]) {
    const r = hf4.dispatch('sageGuardian.classifyContent', bad);
    assert.strictEqual(r.level, 'ASL-1', '入参 ' + String(bad) + ' 应回落 ASL-1, 实得 ' + r.level);
  }
});
t('D4 logSecurityDecision 缺省/非对象入参返回 success:false 而非抛', () => {
  for (const bad of [undefined, null, 'string', 42]) {
    const r = hf4.dispatch('sageGuardian.logSecurityDecision', bad);
    assert.strictEqual(r.success, false, '入参 ' + String(bad) + ' 应失败');
    assert.ok(typeof r.error === 'string');
  }
});
t('D5 explainModification 缺省 proposal 不抛（approved=true 回落默认解释）', () => {
  const r = hf4.dispatch('sageGuardian.explainModification', undefined, true);
  assert.strictEqual(typeof r, 'string');
  assert.ok(r.length > 0);
});
await ta('D6 判空修复未破坏正常辨别（良性/危险提案行为不变）', async () => {
  const good = await review4(GOOD_PROPOSAL, {});
  const bad = await review4(BAD_PROPOSAL, {});
  assert.strictEqual(good.passed, true, '良性提案仍应通过, violations=' + JSON.stringify(good.violations));
  assert.strictEqual(bad.passed, false, '危险提案仍应拒绝');
});
t('D7 源码保留 [r609] 判空标记（防回归被误删）', () => {
  const src = fs.readFileSync(SG_PATH, 'utf8');
  const n = src.split('[r609] 判空保护').length - 1;
  assert.ok(n >= 4, '应至少 4 处 [r609] 判空保护, 实得 ' + n);
});
t('D8 重复 start() 不会重复注册（幂等）', () => {
  hf4.start();
  hf4.start();
  const r = allows(hf4).filter(x => x.startsWith('sageGuardian.'));
  assert.strictEqual(r.length, 17, '重复 start 后路由数应为 17，实得 ' + r.length);
  assert.strictEqual(Object.keys(hf4._modules).length, 149, '重复 start 后模块数 ' + Object.keys(hf4._modules).length);
});

})().then(() => { console.log('\n=== 结果 ==='); console.log('通过 ' + passed + ' / 失败 ' + failed); if (failures.length) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); } process.exit(0); });
