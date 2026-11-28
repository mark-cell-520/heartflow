#!/usr/bin/env node
/**
 * r646 健壮性守卫（6 例）
 *
 * 背景：未测模块探针（hf-probe-untested.js）暴露两个真实健壮性缺陷——
 *   BUG-1 src/core/semantic-clusterer.js::cluster() guard 只判 falsy + length===0，
 *         非数组输入（{}/"text"/42）的 .length 是 undefined 而非 0，穿过 guard 后
 *         concepts.forEach 抛 TypeError。调用方（聚类幻觉族/记忆融合）喂错形态即崩。
 *   BUG-2 src/core/engine-dispatcher.js::dispatch() 第一行 `if (!hf.started)`，
 *         hf=null/undefined 时在读属性前就抛 TypeError，而非既定的
 *         'HeartFlow not started' Error——调用栈拿到的是无信息 TypeError。
 *
 * 本测试先红后绿：修复前 6 例中 4 例失败，修复后全绿。
 * 修复只改 guard，不动聚类/路由行为。
 */
'use strict';
const path = require('path');
const assert = require('assert');
const HF = path.join(__dirname, '..');
const SemanticClusterer = require(path.join(HF, 'src', 'core', 'semantic-clusterer.js'));
const disp = require(path.join(HF, 'src', 'core', 'engine-dispatcher.js'));

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + String(e.message).slice(0, 200)); console.log('  ✗ ' + name + ' :: ' + String(e.message).slice(0, 200)); }
}

// ─── BUG-1 semantic-clusterer.cluster() 非数组输入 ───
console.log('=== BUG-1: cluster() 非数组输入守卫 ===');
const sc = new SemanticClusterer();
t('C1 cluster({}) 返回 [] 不抛 TypeError', () => {
  const r = sc.cluster({});
  assert.ok(Array.isArray(r), '应返回数组');
  assert.strictEqual(r.length, 0, '应返回空数组');
});
t('C2 cluster("text") 返回 [] 不抛 TypeError', () => {
  const r = sc.cluster('text');
  assert.ok(Array.isArray(r) && r.length === 0);
});
t('C3 cluster(42) 返回 [] 不抛 TypeError', () => {
  const r = sc.cluster(42);
  assert.ok(Array.isArray(r) && r.length === 0);
});
t('C4 cluster({text:null}) 返回 [] 不抛 TypeError', () => {
  const r = sc.cluster({ text: null });
  assert.ok(Array.isArray(r) && r.length === 0);
});
t('C5 cluster(null/undefined) 保持既有行为返回 []', () => {
  assert.strictEqual(sc.cluster(null).length, 0);
  assert.strictEqual(sc.cluster(undefined).length, 0);
});

// ─── BUG-2 engine-dispatcher.dispatch() hf 非对象 ───
console.log('=== BUG-2: dispatch() hf 非对象守卫 ===');
t('D1 dispatch(null, ...) 抛 Error 而非 TypeError', () => {
  assert.throws(() => disp.dispatch(null, 'monitor.getStats'), (e) => {
    assert.ok(e instanceof Error && !(e instanceof TypeError), '应为非 TypeError 的 Error，实得 ' + e.constructor.name);
    assert.ok(/HeartFlow not started/.test(e.message), '消息应为 HeartFlow not started，实得: ' + e.message);
    return true;
  });
});
t('D2 dispatch(undefined, ...) 抛 Error 而非 TypeError', () => {
  assert.throws(() => disp.dispatch(undefined, 'monitor.getStats'), (e) => {
    assert.ok(e instanceof Error && !(e instanceof TypeError), '应为非 TypeError 的 Error，实得 ' + e.constructor.name);
    assert.ok(/HeartFlow not started/.test(e.message), '消息应为 HeartFlow not started，实得: ' + e.message);
    return true;
  });
});
t('D3 dispatch("x", ...) 保持既有行为抛 HeartFlow not started', () => {
  assert.throws(() => disp.dispatch('x', 'monitor.getStats'), /HeartFlow not started/);
});

Promise.resolve().then(() => {
  console.log('\n=== 结果 ===');
  console.log('测试结果: ' + passed + ' 通过, ' + failed + ' 失败, 共 ' + (passed + failed) + ' 个');
  if (failures.length) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); }
  process.exit(0);
});
