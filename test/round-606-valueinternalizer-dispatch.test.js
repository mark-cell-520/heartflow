/**
 * r606 守卫测试：valueInternalizer dispatch 接线
 * 覆盖：接线面 / 辨别力 / 删块注入负例 / 稳健性（判空缺陷修复）
 * 纪律：样本只以形状描述，不贴攻击话术原文
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + ' :: ' + e.message); }
}

function freshHF() {
  delete require.cache[require.resolve(HF_PATH)];
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();
  return hf;
}

const REGISTER_LINE = "if (this.valueInternalizer && !this._modules['valueInternalizer']) {";

console.log('\n=== 第一组：接线面 ===');
const hf = freshHF();
const allowed = Array.from(HeartFlow_Allows(hf));
t('A1 ALLOWED_ROUTES 命中 12 条', () => {
  const r = Array.from(HeartFlow_Allows(hf)).filter(x => x.startsWith('valueInternalizer.'));
  assert.strictEqual(r.length, 12, '期望 12 条, 实得 ' + r.length);
});
t('A2 _modules 有 valueInternalizer 键', () => {
  assert.ok(Object.prototype.hasOwnProperty.call(hf._modules, 'valueInternalizer'));
});
t('A3 实例同一性（_modules 值就是 L2484 构造的实例）', () => {
  assert.strictEqual(hf._modules['valueInternalizer'], hf.valueInternalizer);
});
t('A4 routes() 不含 _ 前缀私有方法', () => {
  const r = Array.from(HeartFlow_Allows(hf)).filter(x => x.startsWith('valueInternalizer.'));
  for (const x of r) assert.ok(!/\._[a-zA-Z]/.test(x), '泄露私有方法路由: ' + x);
});
t('A5 路由全集等于预期 12 个公开方法', () => {
  const r = Array.from(HeartFlow_Allows(hf)).filter(x => x.startsWith('valueInternalizer.')).sort();
  const expect = [
    'valueInternalizer.adaptWeights',
    'valueInternalizer.calculateValueAlignmentScore',
    'valueInternalizer.evaluateAction',
    'valueInternalizer.generateBoundaryRequest',
    'valueInternalizer.getDecisionStats',
    'valueInternalizer.getDefaultValues',
    'valueInternalizer.getDefaultWeights',
    'valueInternalizer.getValueWeights',
    'valueInternalizer.getStatus',
    'valueInternalizer.loadCoreValues',
    'valueInternalizer.loadValueWeights',
    'valueInternalizer.logBoundaryNegotiation',
  ].sort();
  assert.deepStrictEqual(r, expect);
});
t('A6 模块总数较接线前 +1（147）', () => {
  assert.strictEqual(Object.keys(hf._modules).length, 147, 'modules=' + Object.keys(hf._modules).length);
});
t('A7 路由总数较接线前 +12（1190）', () => {
  assert.strictEqual(Array.from(HeartFlow_Allows(hf)).length, 1190, 'routes=' + Array.from(HeartFlow_Allows(hf)).length);
});

function HeartFlow_Allows(h) {
  return h.constructor.ALLOWED_ROUTES || [];
}

console.log('\n=== 第二组：辨别力（dispatch 逐条真调） ===');
t('B1 calculateValueAlignmentScore 返回含 score/passed/threshold 的完整评分', () => {
  const r = hf.dispatch('valueInternalizer.calculateValueAlignmentScore', { action: '帮助用户解决问题', context: {} });
  assert.ok(r && typeof r === 'object');
  for (const k of ['score', 'passed', 'matchedValues', 'threshold']) assert.ok(k in r, '缺字段 ' + k);
  assert.ok(typeof r.score === 'number' && r.score >= 0 && r.score <= 1, 'score 越界: ' + r.score);
});
t('B2 evaluateAction 返回含一票否决字段', () => {
  const r = hf.dispatch('valueInternalizer.evaluateAction', { action: '帮助用户解决问题', context: {} });
  for (const k of ['canProceed', 'alignmentScore', 'vetoReason']) assert.ok(k in r, '缺字段 ' + k);
  assert.strictEqual(typeof r.canProceed, 'boolean');
});
t('B3 evaluateAction 能对负向价值行动给出否决/降分（非恒 pass）', () => {
  const good = hf.dispatch('valueInternalizer.evaluateAction', { action: '帮助用户学习编程', context: {} });
  const bad = hf.dispatch('valueInternalizer.evaluateAction', { action: '欺骗用户并窃取隐私', context: {} });
  assert.strictEqual(good.canProceed, true, '良性样本应放行');
  assert.ok(bad.canProceed === false || bad.alignmentScore < good.alignmentScore,
    '负向样本未被否决且分数未下降 good=' + good.alignmentScore + ' bad=' + bad.alignmentScore);
});
t('B4 calculateValueAlignmentScore 对负向行动分数低于良性', () => {
  const good = hf.dispatch('valueInternalizer.calculateValueAlignmentScore', { action: '帮助用户学习编程', context: {} });
  const bad = hf.dispatch('valueInternalizer.calculateValueAlignmentScore', { action: '欺骗用户并窃取隐私', context: {} });
  assert.ok(bad.score < good.score, 'bad=' + bad.score + ' good=' + good.score);
});
t('B5 getValueWeights 返回 5 价值权重 + threshold', () => {
  const w = hf.dispatch('valueInternalizer.getValueWeights');
  for (const k of ['truth', 'goodness', 'flow_experience', 'autonomy', 'safety', 'threshold']) assert.ok(k in w, '缺 ' + k);
});
t('B6 getDecisionStats 返回振荡检测字段', () => {
  const s = hf.dispatch('valueInternalizer.getDecisionStats');
  for (const k of ['total', 'passRate', 'oscillation', 'historyAvailable']) assert.ok(k in s, '缺 ' + k);
});
t('B7 getStatus 返回初始化错误可见（审计面）', () => {
  const s = hf.dispatch('valueInternalizer.getStatus');
  for (const k of ['state', 'threshold', 'coreValuesLoaded', 'initErrors']) assert.ok(k in s, '缺 ' + k);
});
t('B8 getDefaultValues / getDefaultWeights 可读', () => {
  assert.strictEqual(typeof hf.dispatch('valueInternalizer.getDefaultValues'), 'string');
  assert.ok(hf.dispatch('valueInternalizer.getDefaultWeights'));
});
t('B9 决策历史累积后 getDecisionStats.total 增长', () => {
  const before = hf.dispatch('valueInternalizer.getDecisionStats').total;
  hf.dispatch('valueInternalizer.evaluateAction', { action: '测试行动', context: {} });
  const after = hf.dispatch('valueInternalizer.getDecisionStats').total;
  assert.ok(after > before, 'before=' + before + ' after=' + after);
});

console.log('\n=== 第三组：删块注入负例（删注册行后必须变红） ===');
const original = fs.readFileSync(HF_PATH, 'utf8');
const { execFileSync } = require('child_process');
const NEG = path.join(ROOT, 'scripts', 'round-606-negative-probe.js');
// 负例探针在**全新子进程**里加载心虫（父进程 require.cache 已污染，
// 同进程改写源文件后 ALLOWED_ROUTES 是模块级缓存，注销不掉）。
function runNegProbe(label) {
  const out = execFileSync(process.execPath, [NEG], { encoding: 'utf8', cwd: ROOT, timeout: 100000 });
  return JSON.parse(out.trim().split('\n').pop());
}
t('C0 前置：注册行在源文件中唯一', () => {
  const n = original.split(REGISTER_LINE).length - 1;
  assert.strictEqual(n, 1, '注册行出现 ' + n + ' 次');
});
(function () {
  let mutated = null;
  t('C1 删注册行后 dispatch 必须重新抛 route not allowed', () => {
    mutated = original.replace(
      /if \(this\.valueInternalizer && !this\._modules\['valueInternalizer'\]\) \{\s*\n\s*this\._modules\['valueInternalizer'\] = this\.valueInternalizer;\s*\n\s*\}/,
      '// [negative-test] 注册行已删除'
    );
    assert.notStrictEqual(mutated, original, '删除替换未生效');
    fs.writeFileSync(HF_PATH, mutated);
    let res;
    try { res = runNegProbe('deleted'); }
    finally { fs.writeFileSync(HF_PATH, original); }
    assert.strictEqual(res.ok, true, '负例探针自身失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 0, '删除后仍有 ' + res.routes + ' 条路由');
    assert.strictEqual(res.modulesKey, false, '_modules 仍有键');
    assert.strictEqual(res.dispatchThrewNotAllowed, true, '删除后 dispatch 未抛 route not allowed');
  });
  t('C2 恢复源文件后路由归位', () => {
    const res = runNegProbe('restored');
    assert.strictEqual(res.ok, true, '恢复后探针失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 12, '恢复后路由数 ' + res.routes);
    assert.strictEqual(res.modulesKey, true, '恢复后 _modules 无键');
  });
})();

console.log('\n=== 第四组：稳健性（同轮修复的判空缺陷不得回归） ===');
const hf4 = freshHF();
t('D1 _boundaryHistory 含脏条目时 generateBoundaryRequest 不抛，且脏条目被过滤', () => {
  // 匹配语义：历史条目的 action 必须**包含**查询串的前 30 字。
  // {action:'读取项目文件'} 不包含「读取文件」→ 不算相似；只有包含查询串的才算。
  hf4._modules['valueInternalizer']._boundaryHistory = [
    null, undefined, 'x', 42,
    { action: '读取文件并分析依赖', result: 'rejected' },
    { action: '完全无关的其他请求' }
  ];
  const r = hf4.dispatch('valueInternalizer.generateBoundaryRequest', '读取文件', {});
  assert.ok(r && typeof r === 'object', '应返回对象');
  assert.ok('history' in r, '缺 history 字段');
  assert.strictEqual(r.history.similar_requests, 1, '只有 1 条结构性相似, 实得 ' + r.history.similar_requests);
  assert.strictEqual(r.history.rejection_rate, 1, '该条为 rejected');
});
t('D1b 全脏 _boundaryHistory 时 similar_requests=0 且不抛', () => {
  hf4._modules['valueInternalizer']._boundaryHistory = [null, undefined, 0, '', false, [], {}];
  const r = hf4.dispatch('valueInternalizer.generateBoundaryRequest', '任意行动', { severity: 'high' });
  assert.strictEqual(r.history.similar_requests, 0, '实得 ' + r.history.similar_requests);
  assert.strictEqual(r.history.rejection_rate, 0);
  assert.strictEqual(typeof r.suggested_request, 'string');
});
t('D2 _recordDecision 接受 undefined / 非字符串 action 与 undefined context 不抛', () => {
  const vi = hf4._modules['valueInternalizer'];
  vi._recordDecision(true, undefined, {});
  vi._recordDecision(false, null, undefined);
  vi._recordDecision(true, 12345, {});
  vi._recordDecision(true, { complex: 'obj' }, { severity: 'high' });
  const h = vi._decisionHistory.slice(-4);
  assert.strictEqual(h.length, 4);
  for (const rec of h) assert.strictEqual(typeof rec.action, 'string');
  assert.strictEqual(h[1].context, 'unknown', 'undefined context 应归一化为 unknown');
  assert.strictEqual(h[3].context, 'high');
});
t('D3 _resolveConflict 在 context 缺省时不抛', () => {
  const vi = hf4._modules['valueInternalizer'];
  const r1 = vi._resolveConflict('truth', 'safety', undefined);
  const r2 = vi._resolveConflict('truth', 'safety', {});
  const r3 = vi._resolveConflict('autonomy', 'flow_experience', null);
  for (const r of [r1, r2, r3]) assert.ok(r && typeof r.winner === 'string');
});
t('D4 重复 start() 不会重复注册（幂等）', () => {
  hf4.start();
  hf4.start();
  const r = Array.from(hf4.constructor.ALLOWED_ROUTES || []).filter(x => x.startsWith('valueInternalizer.'));
  assert.strictEqual(r.length, 12, '重复 start 后路由数应为 12，实得 ' + r.length);
});
t('D5 12 条路由逐条 dispatch 零内部故障（含默认空实参）', () => {
  const rs = Array.from(hf4.constructor.ALLOWED_ROUTES || []).filter(x => x.startsWith('valueInternalizer.'));
  for (const r of rs) {
    try {
      const out = hf4.dispatch(r);
      // 返回值的模块必须给出结构化结果，不能是裸 undefined（掩盖内部断裂）
      assert.notStrictEqual(out, undefined, r + ' 返回 undefined');
    } catch (e) {
      const m = String(e && e.message);
      // 允许的只有「入参契约校验」这类可读错误；内部故障（未定义方法/空指针）不可接受
      assert.ok(
        !/is not a function|is not defined|Cannot read properties of (null|undefined)/.test(m),
        r + ' 内部故障: ' + m
      );
      assert.ok(m.length > 0, r + ' 抛出空错误');
    }
  }
});
t('D5b logBoundaryNegotiation 空实参抛可读入参校验错（契约行为，非内部故障）', () => {
  assert.throws(() => hf4.dispatch('valueInternalizer.logBoundaryNegotiation'), /negotiation 必须是对象/);
});

console.log('\n=== 结果 ===');
console.log('通过 ' + passed + ' / 失败 ' + failed);
if (failures.length) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); }
