#!/usr/bin/env node
/**
 * r621 uncertaintyQuantifier 接线守卫（30 例）
 *
 * 背景：r617 把 uncertaintyQuantifier 实例注册进 _modules，使 3 条
 * ALLOWED_ROUTES 首次可 dispatch；r621 修掉接线后首次暴露的 3 处崩溃。
 *
 * 分组：
 *   A 接线面（路由/模块计数、逐条空实参 dispatch、dispatch 与直调一致、幂等）
 *   B 辨别力（过度确定性/引用堆叠/模糊限定/平淡陈述 四族分化 + 校准短语 + 统计）
 *   C 删块注入负例（删除接线块 → 路由归零 / dispatch 抛 not allowed / 恢复态归位）
 *   D 稳健性（空实参零内部崩溃、非对象入参、脏记录不 NaN、主链路不被阻断、源码标记）
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const HF = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
hf.start();
const allows = (h) => Array.from(h.constructor.ALLOWED_ROUTES);
const UQ = hf.uncertaintyQuantifier;
const PREFIX = 'uncertaintyQuantifier';

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + String(e.message).slice(0, 180)); console.log('  ✗ ' + name + ' :: ' + String(e.message).slice(0, 180)); }
}

// ─── 第一组：接线面 ───
console.log('=== 第一组：接线面 ===');
t('A1 uncertaintyQuantifier 实例存在', () => {
  assert.ok(UQ && typeof UQ.evaluate === 'function');
});
t('A2 dispatch 路由 3 条（较接线前 +3）', () => {
  const r = allows(hf).filter(x => x.startsWith(PREFIX + '.'));
  assert.strictEqual(r.length, 3, 'routes=' + r.length);
});
t('A3 路由清单与实例公有方法对应', () => {
  const r = allows(hf).filter(x => x.startsWith(PREFIX + '.')).sort();
  assert.deepStrictEqual(r, [
    'uncertaintyQuantifier.evaluate', 'uncertaintyQuantifier.getStats',
    'uncertaintyQuantifier.recordOutcome',
  ].sort());
});
t('A4 _modules 含 uncertaintyQuantifier 键', () => {
  assert.strictEqual(Object.prototype.hasOwnProperty.call(hf._modules, PREFIX), true);
});
t('A5 路由总数较接线前 +3（1238→1241）', () => {
  assert.strictEqual(allows(hf).length, 1241, 'total=' + allows(hf).length);
});
t('A6 模块键总数较接线前 +1（151→152）', () => {
  assert.strictEqual(Object.keys(hf._modules).length, 152, 'modules=' + Object.keys(hf._modules).length);
});
t('A7 evaluate 走 dispatch 与直调结果一致（接线未改语义）', () => {
  const a = JSON.stringify(UQ.evaluate('根据记录数据显示研究表明已有结论', { hasEvidence: false }));
  const b = JSON.stringify(hf.dispatch(PREFIX + '.evaluate', { text: '根据记录数据显示研究表明已有结论' }));
  assert.strictEqual(a, b);
});
t('A8 dispatch 传对象入参时正确降级为文本（heartflow.js L4910 兜底仍生效）', () => {
  const viaObj = hf.dispatch(PREFIX + '.evaluate', { text: '可能大概也许有一些关联' });
  const viaStr = hf.dispatch(PREFIX + '.evaluate', '可能大概也许有一些关联');
  assert.strictEqual(viaObj.hallucination.risk, viaStr.hallucination.risk);
  assert.strictEqual(viaObj.confidence, viaStr.confidence);
});

// ─── 第二组：辨别力（dispatch 逐条真调） ───
console.log('=== 第二组：辨别力 ===');
t('B1 引用堆叠族 → isHallucinationRisk true 且 risk > 0.3', () => {
  const r = hf.dispatch(PREFIX + '.evaluate', { text: '根据记录数据显示研究表明已有结论' });
  assert.strictEqual(r.isHallucinationRisk, true);
  assert.ok(r.hallucination.risk > 0.3, 'risk=' + r.hallucination.risk);
  assert.ok(r.hallucination.signals.length >= 2);
});
t('B2 过度确定性族 → 检出过度确定性信号、risk > 0', () => {
  const r = hf.dispatch(PREFIX + '.evaluate', { text: '这绝对是完全正确的唯一方案' });
  assert.strictEqual(r.hallucination.risk > 0, true);
  assert.ok(r.hallucination.signals.some(s => /过度确定性/.test(s)));
});
t('B3 平淡陈述族 → risk = 0 且无信号（守卫不误伤）', () => {
  const r = hf.dispatch(PREFIX + '.evaluate', { text: '今天天气不错我去散步' });
  assert.strictEqual(r.hallucination.risk, 0);
  assert.strictEqual(r.hallucination.signals.length, 0);
  assert.strictEqual(r.isHallucinationRisk, false);
});
t('B4 引用堆叠 risk 严格高于平淡陈述（分化不是常量）', () => {
  const a = hf.dispatch(PREFIX + '.evaluate', { text: '根据记录数据显示研究表明已有结论' }).hallucination.risk;
  const b = hf.dispatch(PREFIX + '.evaluate', { text: '今天天气不错我去散步' }).hallucination.risk;
  assert.ok(a > b, 'stack=' + a + ' plain=' + b);
});
t('B5 高风险领域无证据 → confidence 低于平淡陈述', () => {
  const risky = hf.dispatch(PREFIX + '.evaluate', { text: '这个医疗方案肯定没有问题' });
  const plain = hf.dispatch(PREFIX + '.evaluate', { text: '今天天气不错我去散步' });
  assert.ok(risky.confidence < plain.confidence, 'risky=' + risky.confidence + ' plain=' + plain.confidence);
  assert.ok(risky.epistemic.factors.some(f => /医疗/.test(f)), JSON.stringify(risky.epistemic.factors));
});
t('B6 模糊限定族 → epistemic 判定为有不确定因素、risk = 0', () => {
  const r = hf.dispatch(PREFIX + '.evaluate', { text: '可能大概也许有一些关联' });
  assert.strictEqual(r.hallucination.risk, 0);
  assert.strictEqual(r.epistemic.level !== 'LOW', true);
  assert.ok(r.calibratedPhrase.length > 0);
});
t('B7 幻觉命中时校准短语给出「请验证关键事实」处置建议', () => {
  const r = hf.dispatch(PREFIX + '.evaluate', { text: '根据记录数据显示研究表明已有结论' });
  assert.ok(/关键事实|幻觉/.test(r.calibratedPhrase), r.calibratedPhrase);
  assert.ok(r.recommendations.some(x => /幻觉|核实/.test(x)), JSON.stringify(r.recommendations));
});
t('B8 置信度分级函数覆盖五档', () => {
  const levels = new Set();
  for (const c of [0.0, 0.2, 0.45, 0.6, 0.9]) {
    levels.add(UQ._confidenceToLevel(c));
  }
  assert.ok(levels.has('VERY_LOW') && levels.has('LOW') && levels.has('MEDIUM')
    && levels.has('HIGH') && levels.has('VERY_HIGH'), JSON.stringify([...levels]));
});
t('B9 recordOutcome 记录校准数据并可被 getStats 读出', () => {
  const ev = UQ.evaluate('根据记录数据显示研究表明已有结论');
  const rec = hf.dispatch(PREFIX + '.recordOutcome', ev, 'correct');
  assert.strictEqual(rec.accuracy, 1);
  const st = hf.dispatch(PREFIX + '.getStats');
  assert.ok(st.recentRecords.length >= 1);
  assert.strictEqual(typeof st.recentRecords[st.recentRecords.length - 1].hallucinationRisk, 'number');
});
t('B10 同一输入两次调用结果稳定（无随机漂移）', () => {
  const a = JSON.stringify(hf.dispatch(PREFIX + '.evaluate', { text: '根据记录数据显示研究表明已有结论' }));
  const b = JSON.stringify(hf.dispatch(PREFIX + '.evaluate', { text: '根据记录数据显示研究表明已有结论' }));
  assert.strictEqual(a, b);
});

// ─── 第三组：删块注入负例 ───
console.log('=== 第三组：删块注入负例 ===');
(function () {
  const HF_PATH = path.join(HF, 'src', 'core', 'heartflow.js');
  const NEG = path.join(HF, 'scripts', 'round-617-uq-negative-probe.js');
  function runNegProbe() {
    const out = require('child_process').execFileSync(process.execPath, [NEG], { cwd: HF, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return JSON.parse(out.split('\n').filter(Boolean).pop());
  }
  const original = fs.readFileSync(HF_PATH, 'utf8');
  t('C1 删除接线块后 uncertaintyQuantifier 路由归零、dispatch 抛 not allowed', () => {
    const res = runNegProbe();
    assert.strictEqual(res.deleted.modulesKey, false, '_modules 仍有 uncertaintyQuantifier 键');
    assert.strictEqual(res.deleted.uqRoutes, 0, '删除后仍有 ' + res.deleted.uqRoutes + ' 条路由');
    assert.strictEqual(res.deleted.dispatchOk, false, '删除后 dispatch 未抛');
    assert.ok(/not allowed/.test(res.deleted.dispatchErr), res.deleted.dispatchErr);
    assert.strictEqual(fs.readFileSync(HF_PATH, 'utf8') === original, true, '源文件未还原');
  });
  t('C2 恢复源文件后路由归位（恢复态口径）', () => {
    const res = runNegProbe();
    assert.strictEqual(res.sourceRestored, true, '源文件未还原');
    assert.strictEqual(res.restored.modulesKey, true, '恢复后 _modules 无 uncertaintyQuantifier 键');
    assert.strictEqual(res.restored.uqRoutes, 3, '恢复后路由数 ' + res.restored.uqRoutes);
    assert.strictEqual(res.restored.dispatchOk, true, '恢复后 dispatch 失败');
  });
})();

// ─── 第四组：稳健性 ───
console.log('=== 第四组：稳健性 ===');
const hf4 = new HeartFlow();
hf4.start();
t('D1 3 条路由逐条空实参 dispatch 零内部故障', () => {
  const rs = allows(hf4).filter(x => x.startsWith(PREFIX + '.'));
  assert.strictEqual(rs.length, 3);
  for (const r of rs) {
    try { hf4.dispatch(r); } catch (e) {
      const m = String(e.message);
      // r621 口径：禁止 is not a function / Cannot read properties 类内部崩溃。
      assert.ok(!/is not a function|Cannot read propert/i.test(m), r + ' 内部故障: ' + m);
    }
  }
});
t('D2 evaluate 空串 text 不抛（归一化生效）', () => {
  const r = hf4.dispatch(PREFIX + '.evaluate', '');
  assert.ok(r && typeof r.confidence === 'number');
  assert.strictEqual(r.hallucination.risk, 0);
});
t('D3 evaluate null / undefined text 不抛', () => {
  for (const bad of [null, undefined]) {
    const r = UQ.evaluate(bad);
    assert.ok(r && typeof r.confidence === 'number', '入参 ' + String(bad));
  }
});
t('D4 evaluate 非对象 context 不抛', () => {
  for (const bad of [null, 'str', 42]) {
    const r = UQ.evaluate('根据记录数据显示研究表明已有结论', bad);
    assert.ok(r && typeof r.confidence === 'number', 'context ' + String(bad));
  }
});
t('D5 脏记录不导致 getStats 崩溃、不产出 NaN 校准误差', () => {
  const UQ2 = require(path.join(HF, 'src', 'core', 'uncertainty-quantifier.js')).UncertaintyQuantifier;
  const u = new UQ2();
  // 空实参灌入脏记录（无 hallucination / confidence 字段）
  u.recordOutcome({}, undefined);
  u.recordOutcome(undefined, 'wrong');
  const st = u.getStats();
  assert.ok(st && Array.isArray(st.recentRecords), 'getStats 失败');
  assert.strictEqual(st.recentRecords.some(r => r.hallucinationRisk === null), true, '脏记录未降级');
  for (const c of u.calibrationHistory) {
    assert.strictEqual(Number.isNaN(c.calibrationError), false, 'calibrationError 为 NaN');
  }
});
t('D6 混合脏/有效记录后 calibrationError 仍可计算且非 NaN', () => {
  const UQ2 = require(path.join(HF, 'src', 'core', 'uncertainty-quantifier.js')).UncertaintyQuantifier;
  const u = new UQ2();
  u.recordOutcome({}, undefined);                       // 脏
  for (let i = 0; i < 6; i++) {                          // 有效
    const ev = u.evaluate('根据记录数据显示研究表明已有结论');
    u.recordOutcome(ev, i % 2 ? 'correct' : 'partial');
  }
  assert.ok(u.calibrationHistory.length >= 1, 'calibrationHistory 未更新');
  const last = u.calibrationHistory[u.calibrationHistory.length - 1];
  assert.strictEqual(Number.isNaN(last.calibrationError), false, 'calibrationError NaN');
  assert.ok(last.calibrationError >= 0 && last.calibrationError <= 1, 'error=' + last.calibrationError);
});
t('D7 主链路 think() 不因接线抛异常', () => {
  const res = hf4.think('这个结论毫无疑问一定正确。');
  assert.ok(res && typeof res === 'object');
});
t('D8 重复 start() 不会重复注册（幂等）', () => {
  hf4.start();
  hf4.start();
  const r = allows(hf4).filter(x => x.startsWith(PREFIX + '.'));
  assert.strictEqual(r.length, 3, '重复 start 后路由数 ' + r.length);
  assert.strictEqual(Object.keys(hf4._modules).length, 152, '重复 start 后模块数 ' + Object.keys(hf4._modules).length);
});
t('D9 源码保留 [r617] 接线标记（防回归被误删）', () => {
  const src = fs.readFileSync(path.join(HF, 'src', 'core', 'heartflow.js'), 'utf8');
  assert.ok(src.indexOf('[r617] uncertaintyQuantifier 接线') >= 0, '接线注释块丢失');
});
t('D10 negative probe 脚本存在且为可执行 JS', () => {
  const p = path.join(HF, 'scripts', 'round-617-uq-negative-probe.js');
  assert.ok(fs.existsSync(p), '负例探针脚本缺失');
  require('child_process').execFileSync(process.execPath, ['--check', p]);
});

Promise.resolve().then(() => {
  console.log('\n=== 结果 ===');
  console.log('通过 ' + passed + ' / 失败 ' + failed);
  if (failures.length) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); }
  process.exit(0);
});
