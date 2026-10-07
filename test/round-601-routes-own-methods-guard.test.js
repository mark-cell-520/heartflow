// round-601-routes-own-methods-guard.test.js
// [r601] routes() 对函数式导出模块（对象字面量 / module.exports = { fns }）的
// 方法探测守卫。
//
// 缺陷（r601 实测）：lessonBank 是对象字面量
// （src/cortex/lesson-bank.js L23 `const lessonBank = {...}` →
//  module.exports = { lessonBank }），它的 proto === Object.prototype。
// 原 routes() 实现写了 `proto && proto !== Object.prototype` 守卫，
// 于是整条分支被跳过、掉进 `Object.keys(mod)` 的 fallback；
// fallback 虽只取 function 属性，但对象字面量的 own enumerable 键里
// 混着 lessons/_walLog 等数据字段，实测产出 table['lesson'] = []
// → hf.routes() 里 lesson.* 恒为 0 条，
// 而 ALLOWED_ROUTES（走 generateAllowedRoutes，逻辑不同）里却有
// lesson.consolidateRepeat 等 22 条。「ALLOWED_ROUTES 里有、
// routes() 看不见」的接口面不一致：调用方按 routes() 拼
// subsystem.method 一律作废，能力存在却不可发现。
//
// 修法：原型链方法 与 own 方法求**并集**（替换原来的 if-else 二选一），
// own 方法按下划线约定过滤私有方法。
//
// 本测试同时覆盖正向（修复后应可见）与负例（删掉修复块必须塌回去），
// 确保守卫不会被静默削弱。
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/core/heartflow.js');

// ── 从真实源码抽出 routes() 方法体及其「删除修复块」变体 ──────────
function extractRoutesVariants() {
  const src = fs.readFileSync(SRC, 'utf8');
  const routesStart = src.indexOf('  routes() {');
  if (routesStart < 0) throw new Error('routes() 未找到（源码形状可能已变）');
  const bodyOpen = src.indexOf('{', routesStart);
  let depth = 0, i = bodyOpen;
  while (i < src.length && depth >= 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  const methodStart = routesStart + '  '.length;
  const methodSource = src.slice(methodStart, i + 1);
  if (!/^routes\(\)\s*\{/.test(methodSource)) {
    throw new Error('routes() 抽取形状异常: ' + methodSource.slice(0, 40));
  }
  const ownMarker = '      // own 方法：与原型链求并集（不是二选一）。对象字面量模块走这里，';
  const ownIdx = methodSource.indexOf(ownMarker);
  if (ownIdx < 0) throw new Error('own-方法并集块未找到（修复代码可能已被还原）');
  const blockStart = methodSource.lastIndexOf('\n', ownIdx) + 1;
  const endMarker = '      table[name] = methods;';
  const endIdx = methodSource.indexOf(endMarker, ownIdx);
  if (endIdx < 0) throw new Error('块结束锚点未找到');
  const legacyMethodSource = methodSource.slice(0, blockStart) + methodSource.slice(endIdx);
  return { src, methodSource, legacyMethodSource };
}

// 把源码里的 routes() 换掉后写到源码同目录临时文件再 require
// （相对 require 在仓库外会断裂，r600 已踩过；放同目录最稳）。
// identity=true 表示用未改动的真实源码，直接 require，不做替换（替换是 no-op）。
const VARIANT = path.join(ROOT, 'src/core/__hf_variant_routes_test.js');
function loadEngine(routesSource, ctx, identity) {
  if (identity) {
    delete require.cache[require.resolve(SRC)];
    return require(SRC);
  }
  const patched = ctx.src.replace(ctx.methodSource, routesSource);
  assert.notStrictEqual(patched, ctx.src, 'routes() 源码替换失败');
  fs.writeFileSync(VARIANT, patched);
  delete require.cache[require.resolve(VARIANT)];
  return require(VARIANT);
}

let passed = 0, failed = 0;
function ok(name, cond, extra) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name + (extra !== undefined ? ' — ' + extra : '')); }
}

const ctx = extractRoutesVariants();

// ── 正向：修复后的真实源码 ──────────────────────────────────
console.log('\n[r601] routes() own-方法并集 — 正向');
{
  const hf = new (loadEngine(ctx.methodSource, ctx, true)).HeartFlow();
  hf.start();
  const t = hf.routes();
  const lr = (t['lesson'] || []).map(String);

  ok('lesson.* 路由非空（修复前为 0）', lr.length > 0, 'len=' + lr.length);
  ok('lesson.consolidateRepeat 可被 routes() 发现',
    lr.some(r => r.startsWith('lesson.consolidateRepeat')), lr.join(','));
  ok('lesson.query 可被发现', lr.some(r => r.startsWith('lesson.query')));
  ok('lesson.getRelevant 可被发现', lr.some(r => r.startsWith('lesson.getRelevant')));
  ok('lesson._uuid 等私有方法不暴露', !lr.some(r => r.startsWith('lesson._')));
  ok('数据字段 lessons 不进路由表', !lr.some(r => r === 'lesson.lessons'));
  ok('lesson.* 均标注可 dispatch（无 [未注册] 残留）',
    lr.filter(r => r.includes('[未注册')).length === 0,
    lr.filter(r => r.includes('[未注册')).join(' | '));

  const total = Object.values(t).reduce((n, a) => n + (Array.isArray(a) ? a.length : 0), 0);
  const nonEmpty = Object.entries(t).filter(([, a]) => a && a.length).length;
  ok('总路由数仍在千级（无整体塌陷）', total > 500, 'total=' + total);
  ok('非空子系统数 >= 100', nonEmpty >= 100, 'nonEmpty=' + nonEmpty);

  // class 实例路径不能被并集改动破坏
  const fp = (t['falsePositiveFeedback'] || []).map(String);
  const tc = (t['thoughtChain'] || []).map(String);
  ok('class 实例子系统仍输出方法（falsePositiveFeedback）', fp.length > 0, 'len=' + fp.length);
  ok('class 实例子系统仍输出方法（thoughtChain）', tc.length > 0, 'len=' + tc.length);

  const r = hf.dispatch('lesson.consolidateRepeat', { insightTypes: [] });
  ok('dispatch lesson.consolidateRepeat({insightTypes:[]}) → noop',
    r && r.action === 'noop', JSON.stringify(r));
  console.log('  [info] lesson=' + lr.length + ' total=' + total + ' nonEmpty=' + nonEmpty);
}

// ── 负例：删掉修复块必须塌回去（守卫不能被静默削弱） ──────────
console.log('\n[r601] routes() own-方法并集 — 负例（删除注入）');
{
  const hf = new (loadEngine(ctx.legacyMethodSource, ctx)).HeartFlow();
  hf.start();
  const t = hf.routes();
  const lr = (t['lesson'] || []).map(String);
  ok('删除修复块后 lesson.* 塌为 0 条（证明守卫由该块撑着）',
    lr.length === 0, 'len=' + lr.length);
  const nonEmpty = Object.entries(t).filter(([, a]) => a && a.length).length;
  console.log('  [info] legacy: lesson=' + lr.length + ' nonEmpty=' + nonEmpty);
}

try { fs.rmSync(VARIANT, { force: true }); } catch (e) { /* non-fatal */ }

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
assert.strictEqual(failed, 0, failed + ' 项失败');
process.exit(failed > 0 ? 1 : 0);
