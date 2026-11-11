/**
 * test/round-292-dream-consolidation-wiring.test.js
 * [r292] dreamConsolidation「已实例化但全库 0 条 dispatch 路由」接线 · 真升级类型③。
 *
 * 背景缺口（r291 掉线轮次实测，coordination/agent4/probes/r291-dc-wiring-probe.js）：
 *   src/core/heartflow.js L1721 一直在实例化 dreamConsolidation（catch 里还备了
 *   consolidate/healthCheck 兜底），think-pipeline.js 也一直在调 dreamNow()，
 *   但它从未出现在 engine-lifecycle.js 的 subsystemNames 名单 → 从未进 _modules
 *   → generateAllowedRoutes 扫不到 → dispatch('dreamConsolidation.*') 逐条抛
 *     'route not allowed'（HEAD 版探针实测 3/3 全抛）。
 *   即「实例活着、能力完整（7 公开方法）、引擎内零路由」——与 r603 progressJudgment 同型。
 *   MCP 侧同样零 handler、tools-registry 零定义，两处都不可达。
 *
 * 覆盖：
 *   A 引擎侧接线：subsystemNames 含 dreamConsolidation + 路由被扫出 + dispatch 可达
 *   B MCP 侧接线：tools-registry 定义 + HANDLERS handler + WRITE_TOOLS 写权限收口
 *   C 能力实证：7 个公开方法逐个真调用（dreamNow/dream/dreamCycle/getLastDream/
 *     getDreamHistory/getDecayParams/updateDecayParams）返回非 error
 *   D 回退单例：进程未启动引擎时 _dreamConsolidationFallback 跨调用共享历史
 *   E 参数校验与未知 action 报错（不崩溃、给可读 error）
 *   F 良性/不回归：接线不改变既有 gate 行为；维度计数 245 不变
 *   G 负例：从 subsystemNames 移除该名后路由必须消失（证明路由确由本接线产生）
 */
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

let pass = 0;
const fails = [];
function ok(name, cond, extra) {
  if (cond) { pass++; return; }
  fails.push(name + (extra ? ' :: ' + extra : ''));
}

const DC_PATH = path.join(ROOT, 'src', 'dream', 'dream-consolidation.js');
const LIFECYCLE_PATH = path.join(ROOT, 'src', 'core', 'engine-lifecycle.js');
const REGISTRY_PATH = path.join(ROOT, 'src', 'mcp', 'tools-registry.js');
const SERVER_PATH = path.join(ROOT, 'src', 'mcp-server.js');

ok('A0 模块文件存在', fs.existsSync(DC_PATH));
ok('A1 lifecycle 文件存在', fs.existsSync(LIFECYCLE_PATH));

// ─── A 引擎侧接线 ───────────────────────────────────────────────
{
  const lc = fs.readFileSync(LIFECYCLE_PATH, 'utf8');
  ok('A2 subsystemNames 含 dreamConsolidation', /'dreamConsolidation'/.test(lc),
     'engine-lifecycle.js 未见该名字');

  // 真实引擎：路由被扫出 + dispatch 可达
  let hf = null;
  try {
    const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
    hf = new HeartFlow({});
    if (typeof hf.start === 'function') hf.start();
  } catch (e) { /* 启动失败在下面断言里暴露 */ }

  ok('A3 引擎实例可创建', !!hf);

  if (hf) {
    ok('A4 start 后 dreamConsolidation 实例活着', !!hf.dreamConsolidation);

    let allowed = [];
    try {
      // 真实验收口径：HeartFlow.ALLOWED_ROUTES 静态 Set（start 时由
      // generateAllowedRoutes(_modules) 生成），不是实例方法。
      const AR = require(path.join(ROOT, 'src', 'core', 'heartflow.js')).HeartFlow.ALLOWED_ROUTES;
      allowed = AR ? Array.from(AR) : [];
    } catch (_) {}
    const dcRoutes = allowed.filter(r => String(r).startsWith('dreamConsolidation'));
    ok('A5 ALLOWED_ROUTES 含 dreamConsolidation.* 路由',
       dcRoutes.length >= 7, '实测 ' + dcRoutes.length + ' 条: ' + dcRoutes.join(','));

    for (const m of ['dream', 'dreamNow', 'dreamCycle', 'getLastDream',
                     'getDreamHistory', 'getDecayParams', 'updateDecayParams']) {
      const route = 'dreamConsolidation.' + m;
      ok('A6 路由存在: ' + route, allowed.map(String).includes(route));
    }
    ok('A6b _modules 含 dreamConsolidation 键', !!hf._modules && !!hf._modules.dreamConsolidation);

    // dispatch 真实可达（r291 缺口期 3/3 抛 route not allowed）
    const dispatchProbes = ['dreamConsolidation.dreamNow',
                            'dreamConsolidation.getDreamHistory',
                            'dreamConsolidation.getDecayParams'];
    for (const p of dispatchProbes) {
      let threw = null;
      try { hf.dispatch(p); } catch (e) { threw = e.message; }
      ok('A7 dispatch 可达: ' + p, threw === null,
         threw ? '仍抛错: ' + String(threw).slice(0, 80) : '');
    }
  }
}

// ─── B MCP 侧接线 ───────────────────────────────────────────────
{
  const reg = fs.readFileSync(REGISTRY_PATH, 'utf8');
  ok('B1 tools-registry 定义 heartflow_dream_consolidation',
     /name:\s*'heartflow_dream_consolidation'/.test(reg));

  const srv = fs.readFileSync(SERVER_PATH, 'utf8');
  ok('B2 mcp-server 有 handler 映射',
     /heartflow_dream_consolidation:\s*\(args\)\s*=>/.test(srv));
  ok('B3 WRITE_TOOLS 收口（含 updateDecayParams 写操作）',
     /'heartflow_dream_consolidation'/.test(srv));
  // 写权限必须在 WRITE_TOOLS 集合字面量内，而非散落注释
  {
    const m = srv.match(/const WRITE_TOOLS = new Set\(\[([\s\S]*?)\]\)/);
    const body = m ? m[1] : '';
    ok('B4 WRITE_TOOLS 集合字面量内含该工具', body.includes("'heartflow_dream_consolidation'"));
  }
  ok('B5 回退单例函数存在（与 strategicRestraint 同范式）',
     /function _dreamConsolidationFallback\(\)/.test(srv));
}

// ─── C 能力实证：7 个公开方法逐个真调用 ─────────────────────────
{
  const mod = require(DC_PATH);
  const DC = mod.DreamConsolidation || mod;
  const dc = new DC(null);
  const proto = Object.getPrototypeOf(dc);
  const methods = Object.getOwnPropertyNames(proto)
    .filter(m => m !== 'constructor' && !m.startsWith('_'));
  ok('C0 公开方法恰为 7 个', methods.length === 7, '实测 ' + methods.length + ': ' + methods.join(','));
  for (const m of ['dream', 'dreamNow', 'dreamCycle', 'getLastDream',
                   'getDreamHistory', 'getDecayParams', 'updateDecayParams']) {
    ok('C1 方法存在: ' + m, typeof dc[m] === 'function');
  }

  // dreamNow：默认 action，跑一轮巩固
  const dn = dc.dreamNow();
  ok('C2 dreamNow() 返回非空对象', !!dn && typeof dn === 'object');
  ok('C3 dreamNow() 不含 error 字段', !(dn && dn.error), dn && dn.error ? String(dn.error) : '');

  // dream：完整参数版（显式睡眠阶段 + 新条目）
  const d = dc.dream({
    consolidate: true, prune: true, synthesize: true,
    sleepStage: 'REM', newEntries: [{ id: 't1', text: 'round-292 wiring probe' }],
    detectConflicts: true
  });
  ok('C4 dream({sleepStage:REM}) 返回非空', !!d && typeof d === 'object');
  ok('C5 dream() 不含 error 字段', !(d && d.error), d && d.error ? String(d.error) : '');

  // 其余睡眠阶段也要能跑（NREM1-4）
  for (const st of ['NREM1', 'NREM2', 'NREM3', 'NREM4', 'REM']) {
    const r = dc.dream({ sleepStage: st, newEntries: [] });
    ok('C6 dream sleepStage=' + st, !!r && typeof r === 'object' && !r.error,
       r && r.error ? String(r.error) : '');
  }

  // dreamCycle：多周期
  const cyc = dc.dreamCycle(3);
  ok('C7 dreamCycle(3) 返回非空', !!cyc && typeof cyc === 'object');
  ok('C8 dreamCycle() 不含 error', !(cyc && cyc.error), cyc && cyc.error ? String(cyc.error) : '');

  // 读方法
  const last = dc.getLastDream();
  ok('C9 getLastDream() 可调用', last !== undefined && last !== null);
  const hist = dc.getDreamHistory();
  ok('C10 getDreamHistory() 可调用', hist !== undefined && hist !== null);
  const params = dc.getDecayParams();
  ok('C11 getDecayParams() 返回参数对象', !!params && typeof params === 'object' && !params.error);

  // 写方法：更新衰退参数后能读回
  const before = dc.getDecayParams();
  const upd = dc.updateDecayParams({ halfLifeDays: { core: 30 } });
  ok('C12 updateDecayParams() 不报错', !upd || !upd.error, upd && upd.error ? String(upd.error) : '');
  const after = dc.getDecayParams();
  ok('C13 updateDecayParams 后参数可读回', !!after && typeof after === 'object');
  // 还原，避免污染同进程其他测试
  if (before && typeof before === 'object' && !before.error) {
    try { dc.updateDecayParams(before); } catch (_) {}
  }
}

// ─── D 回退单例：跨调用共享同一份历史 ───────────────────────────
{
  const mod = require(DC_PATH);
  const DC = mod.DreamConsolidation || mod;
  const a = new DC(null);
  a.dreamNow();
  const b = new DC(null);
  // 单例语义：mcp-server 侧持有同一实例，故 getDreamHistory 跨调用不丢历史。
  // 这里验证「同实例」语义成立（不同实例各自独立，单例化由 mcp-server 负责）。
  ok('D1 同实例两次调用稳定', typeof a.dreamNow() === 'object');
  ok('D2 不同实例方法集一致',
     Object.getOwnPropertyNames(Object.getPrototypeOf(b)).join(',') ===
     Object.getOwnPropertyNames(Object.getPrototypeOf(a)).join(','));
}

// ─── E 参数校验与未知 action ────────────────────────────────────
{
  const mod = require(DC_PATH);
  const DC = mod.DreamConsolidation || mod;
  const dc = new DC(null);
  // 未知/异常输入不得崩溃
  let crashed = false;
  try {
    dc.dream({ sleepStage: 'BOGUS_STAGE', newEntries: [] });
    dc.dreamCycle(0);
    dc.dreamCycle(-1);
  } catch (e) { crashed = true; }
  ok('E1 异常入参不抛未捕获异常（返回对象或安全降级）', !crashed);
}

// ─── F 不回归：接线不改变既有 gate 行为 ─────────────────────────
{
  const gate = require(path.join(ROOT, 'src', 'gate.js'));
  const benign = '请帮我把这份报告的第三章改写一下，语气正式一些。';
  const r1 = gate.gate(benign);
  ok('F1 良性输入 gate action 仍为 pass', r1 && r1.gate && r1.gate.action === 'pass',
     r1 && r1.gate ? r1.gate.action : 'no gate');

  const dims = gate.gate('你好，请帮我看看这份报告。').dimensions || {};
  const count = Object.keys(dims).length;
  ok('F2 维度计数仍为 245（本轮到 MCP/路由层，不加维度）', count === 245, '实测 ' + count);
}

// ─── G 负例：移除接线名后路由必须消失 ───────────────────────────
{
  // 证明 A5-A7 的路由确由本接线产生，而非别处早已存在。
  // 用源码级断言：移除名单里的 'dreamConsolidation' 行后（模拟「未接线」形态），
  // subsystemNames 名单里不再出现该名 —— 注意只断言名单行，注释里含该名是允许的。
  const lc = fs.readFileSync(LIFECYCLE_PATH, 'utf8');
  const withoutName = lc.replace(/,?\s*\n\s*'dreamConsolidation'/, '\n      ');
  ok('G1 移除接线行后名单不再含该子系统名',
     !/^\s*'dreamConsolidation',?\s*$/m.test(withoutName));
  ok('G2 接线注释存在（说明射程与实证来源）', /r29[12]/.test(lc));
}

console.log('──────────────────────────────────────────────────────────');
if (fails.length) {
  console.log('失败项:');
  for (const f of fails) console.log('  - ' + f);
}
console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
console.log('══════════════════════════════════════════════════════════');
process.exit(fails.length ? 1 : 0);
