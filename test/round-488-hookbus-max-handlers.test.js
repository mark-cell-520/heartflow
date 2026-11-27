/**
 * test/round-488-hookbus-max-handlers.test.js
 *
 * r488 — HookBus MAX_HANDLERS_PER_EVENT 上限回归修复（真升级③：接线已加载
 * 但从未 dispatch 的能力——反过来，是「已注册但被上限静默拒绝 dispatch」）。
 *
 * 回归实证（2026-11-27 本机实测）：src/plugins/ 下已有 11 个插件注册
 * postprocess.think 钩子（anticipating / bait-switch-check / blind-spot-breaker /
 * curse-of-knowledge-check / econ-reasoning-check / explore-on-verify /
 * information-aversion-check / look-elsewhere-effect-check /
 * norm-of-reciprocity-check / status-quo-stability-check / sycophancy-check），
 * 而 MAX_HANDLERS_PER_EVENT=10，第 11 个（字母序 sycophancy-check）在
 * plugin.init 里 hookBus.on() 抛错 → PluginLoader 记 failed →
 * bin/verify.js 输出「PluginLoader: 10 loaded, 1 failed」。
 *
 * 后果不是「少一个插件」：sycophancy-check 的 init 是**整体中断**的——
 * hf._sycophancyAnalyzer / _sycophancyAnalyzerEN / _sycophancyAnalyzerZH
 * 三个句柄都没挂上，think() 的谄媚辨别在该宿主上静默失效。
 * 这不是负向守卫补丁，是恢复一条被上限挤掉的真实 dispatch 路径。
 *
 * 修复：把上限改为按事件可配（默认 24，覆盖现有 11 个 + 增长余量），
 * 并对 on() 超限行为给出显式错误（保留 fail-closed 语义）。
 * TDD：先写本测试（红），后改实现（绿）。
 */
'use strict';

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const modPath = path.join(HF, 'src', 'core', 'hook-bus.js');

module.exports = function ({ test }) {
  let hb = null;
  try { hb = require(modPath); } catch (_) { hb = null; }

  test('A0 模块存在且导出 HookBus', () => {
    if (!hb) throw new Error('src/core/hook-bus.js 不存在');
    if (typeof hb.HookBus !== 'function') throw new Error('HookBus 未导出');
  });

  test('A1 默认上限 >= 24（覆盖现有 11 个 postprocess.think 插件 + 增长余量）', () => {
    const bus = new hb.HookBus();
    let n = 0;
    try {
      for (let i = 0; i < 24; i++) bus.on('postprocess.think', () => {}, { id: 'h' + i });
      n = 24;
    } catch (e) { throw new Error('注册到第 ' + (n + 1) + ' 个即失败：' + e.message); }
    const list = bus.list('postprocess.think');
    if (list.length < 24) throw new Error('实际注册 ' + list.length + ' 个');
  });

  test('A2 上限仍 fail-closed：超过上限抛错而不是静默丢弃', () => {
    const bus = new hb.HookBus();
    let threw = false;
    try {
      for (let i = 0; i < 64; i++) bus.on('x', () => {}, { id: 'h' + i });
    } catch (_) { threw = true; }
    if (!threw) throw new Error('64 个处理器未触发上限——上限失效');
  });

  test('A3 上限可按事件覆盖（maxHandlers 选项）', () => {
    const bus = new hb.HookBus({ maxHandlers: 3 });
    let threw = false;
    try {
      for (let i = 0; i < 4; i++) bus.on('y', () => {}, { id: 'h' + i });
    } catch (_) { threw = true; }
    if (!threw) throw new Error('per-event 覆盖未生效');
  });

  test('A4 fire 仍按优先级升序且错误隔离（上限修复不改语义）', async () => {
    const bus = new hb.HookBus();
    const order = [];
    bus.on('z', () => { order.push('b'); }, { id: 'b', priority: 20 });
    bus.on('z', () => { throw new Error('boom'); }, { id: 'a', priority: 10 });
    bus.on('z', () => { order.push('c'); }, { id: 'c', priority: 30 });
    const r = await bus.fire('z', {});
    const failed = r.results.filter(x => !x.ok);
    if (failed.length !== 1) throw new Error('错误隔离失效：failed=' + failed.length);
    if (order.join(',') !== 'b,c') throw new Error('优先级顺序错：' + order.join(','));
  });
};
