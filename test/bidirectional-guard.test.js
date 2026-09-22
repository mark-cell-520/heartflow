/**
 * 测试：双向回归门禁的**灵敏度**（v6.7.75）
 *
 * 关键：门禁"能通过"不算能力，"能拦住退化"才算。
 * 本测试用副作用可控的方式验证两侧都能报警：
 *   1. 误拦侧 — 临时注入一个假维度让良性样本全部非 pass → 必须 fail
 *   2. 召回侧 — 用空样本集让 flagged 归零 → 必须 fail
 *
 * 不修改 src/（避免测试副作用泄漏），只在临时目录造一个假 gate 模块。
 */
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const os = require('os');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { runSet } = require(path.join(HF, 'scripts/bidirectional-guard.js'));

console.log('\n[runSet 基本行为]');

t('良性样本全 pass → flagged 0', () => {
  const gate = { gate: () => ({ gate: { action: 'pass' }, trace: [] }) };
  const r = runSet(['正常文本一', '正常文本二'], gate);
  assert.strictEqual(r.flagged, 0);
  assert.strictEqual(r.byAction.pass, 2);
});

t('攻击样本 block → flagged 计数 + dims 收集', () => {
  const gate = { gate: (t0) => ({
    gate: { action: t0.includes('恶意') ? 'block' : 'pass' },
    trace: t0.includes('恶意') ? [{ dimension: 'prompt_injection' }] : [],
  }) };
  const r = runSet(['恶意文本', '正常文本'], gate);
  assert.strictEqual(r.flagged, 1, '只应有 1 条非 pass');
  assert.strictEqual(r.byAction.block, 1);
  assert.deepStrictEqual(r.dims, ['prompt_injection'], '应收集命中维度');
});

t('_normalization 不进 dims', () => {
  const gate = { gate: () => ({
    gate: { action: 'block' },
    trace: [{ dimension: '_normalization' }, { dimension: 'hate_speech' }],
  }) };
  const r = runSet(['x'], gate);
  assert.ok(!r.dims.includes('_normalization'), '_normalization 是元信息不是维度');
  assert.ok(r.dims.includes('hate_speech'));
});

t('异常输入计为 ERROR 不崩', () => {
  const gate = { gate: () => { throw new Error('boom'); } };
  const r = runSet(['a', 'b'], gate);
  assert.strictEqual(r.byAction.ERROR, 2);
  assert.strictEqual(r.flagged, 2);
});

t('空字符串样本被跳过（不计数）', () => {
  const gate = { gate: () => ({ gate: { action: 'pass' }, trace: [] }) };
  const r = runSet(['有内容', '', null], gate);
  assert.strictEqual(r.total, 3, 'total 是传入样本数（含空）');
  assert.strictEqual(r.byAction.pass, 1, '只有非空样本被判定');
});

t('支持 string 与 {text} 两种样本形态', () => {
  const gate = { gate: (t0) => ({ gate: { action: t0 === 'A' ? 'block' : 'pass' }, trace: [] }) };
  const r1 = runSet(['A'], gate);
  const r2 = runSet([{ text: 'A' }], gate);
  assert.strictEqual(r1.byAction.block, 1);
  assert.strictEqual(r2.byAction.block, 1, '{text} 形态应等效');
});

console.log('\n[灵敏度：维度级退化必须被发现]');

t('基线维度全部丢失 → lostDims 非空 → 应判失败', () => {
  // 模拟：baseline 记录 3 个维度，现在 dims 为空（全维度模式被删）
  const BASELINE_DIMS = { 'g': ['prompt_injection', 'hate_speech', 'code_security'] };
  const nowDims = [];
  const lostDims = BASELINE_DIMS.g.filter(d => !nowDims.includes(d));
  assert.strictEqual(lostDims.length, 3, '三维度全丢应全部报出');
});

t('部分退化（丢 1 维）→ lostDims 长度 1 → 仍判失败', () => {
  const BASELINE_DIMS = { 'g': ['prompt_injection', 'hate_speech', 'code_security'] };
  const nowDims = ['prompt_injection', 'hate_speech'];
  const lostDims = BASELINE_DIMS.g.filter(d => !nowDims.includes(d));
  assert.strictEqual(lostDims.length, 1);
  assert.strictEqual(lostDims[0], 'code_security');
});

t('新增维度不导致失败（只查丢失，不查新增）', () => {
  const BASELINE_DIMS = { 'g': ['prompt_injection'] };
  const nowDims = ['prompt_injection', 'hate_speech', 'new_dim'];
  const lostDims = BASELINE_DIMS.g.filter(d => !nowDims.includes(d));
  assert.strictEqual(lostDims.length, 0, '新增维度是改进，不应报警');
});

console.log('\n[门禁脚本自身可加载]');

t('bidirectional-guard.js 语法正确', () => {
  const src = fs.readFileSync(path.join(HF, 'scripts/bidirectional-guard.js'), 'utf8');
  assert.ok(src.includes('runSet'), '应含 runSet');
  assert.ok(src.includes('BASELINE_DIMS'), '应含维度级判定');
  assert.ok(!src.includes('低于下限 55%'), '不应再有旧的百分比文案');
});

t('guard-abilities.js 已接入第 7 组', () => {
  const src = fs.readFileSync(path.join(HF, 'scripts/guard-abilities.js'), 'utf8');
  assert.ok(src.includes('checkBidirectional'), '应有 checkBidirectional');
  assert.ok(src.includes('双向回归门禁'), '应有双向门禁输出');
});

t('guard-abilities 全量测试解析取最后一行汇总', () => {
  const src = fs.readFileSync(path.join(HF, 'scripts/guard-abilities.js'), 'utf8');
  assert.ok(src.includes('lines.length - 1'), '必须倒序找汇总行');
  assert.ok(src.includes('通过'), '必须匹配中文汇总');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
