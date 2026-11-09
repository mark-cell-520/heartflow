'use strict';
/**
 * [r258] RouteWiringChecker — dispatch 路由层「接线」健康自检
 *
 * 背景（r258 实测）：dispatch 门禁（`HeartFlow.ALLOWED_ROUTES.has(route)`）与
 * routes() 可见面（`hf.routes()`）在 r258 前**互不相干地漂移**：
 *   · routes() 的原型链分支漏了 `!m.startsWith('_')` 过滤（generateAllowedRoutes
 *     两条分支和 routes() 自己的 own 分支都有），于是 class 实例的私有原型方法
 *     全部泄漏进接口面——实测 **653 条**幽灵路由，每条还被可达性标注渲染成
 *     `[未注册，dispatch 会拒绝]`，看起来像 653 个待接线缺口（实际 100% 是
 *     私有方法，按 dispatch 约定本就不该有路由）；
 *   · 反向 ALLOWED_ROUTES 手写白名单里有 **14 条陈旧条目**承诺了模块上不存在
 *     的方法（memory.remove / lesson.addLesson / dream.dreamNow / slots.get …
 *     全是改名或删除后的残留），调用即抛 `is not a function` TypeError，
 *     而 routes() 从不显示它们 → 调用方不可能发现，白名单却在承诺。
 * 两类缺口在结构自检里都没有层覆盖：HandlerWiringChecker 第一层守「子系统
 * 探活」、第二层守「MCP 工具接线矩阵」，dispatch 路由层（r255 已知未修④）
 * 一直是盲区。本检查器就是那第三层。
 *
 * 判据（静态矩阵，不执行业务方法——dispatch 门禁本身只有两步：
 * `ALLOWED_ROUTES.has(route)` + `typeof mod[method] === 'function'`，
 * 两步都可静态判定，不需要真调）：
 *
 *   healthy            ALLOWED ∩ routes() 可见——可发现且可 dispatch
 *   ghostPrivate       routes() 可见但白名单没有，且方法名 `_` 开头
 *                      → routes() 泄漏的私有方法（r258 修复项，修后应为 0）
 *   unregisteredPublic routes() 可见但白名单没有，且公有
 *                      → 真缺口：能力存在却不可发现（r258 现值 0，防回退哨兵）
 *   staleWhitelist     白名单有但 routes() 不可见——白名单承诺了 routes()
 *                      列不出的路由（细分：模块键不在 / 方法不在 / 表里没有）
 *
 * 设计纪律（对齐 HandlerWiringChecker 与仓库「诚实记账」原则）：
 *   - 输入全部**注入**（allowedRoutes / routesTable / modules），检查器自己不
 *     require 引擎、不构造实例——与 checkStructural 同一理由：自检绝不能让
 *     被测系统的启动失败把自己杀掉；
 *   - 输入缺失如实说 wiring_source_not_provided，不编数字；
 *   - routesTable 的元素接受 v6.7.74 之后的两种形态：`sub.method` 与
 *     `sub.method  [未注册，dispatch 会拒绝]`（标注后缀原样识别）；
 *   - 严重度 ≥50 判不健康（unregisteredPublic / staleWhitelist / ghostPrivate
 *     都是缺陷级：泄漏、缺口、谎言承诺没有「提示级」可言）。
 */

/** 发现项严重度：≥50 判 healthy=false */
const SEV = {
  unregistered_public: 100, // 能力存在却不可发现（调用方按 routes() 拼路由恒被拒）
  ghost_private: 60,        // routes() 泄漏私有方法名 + 假「未注册」缺口污染审计口径
  stale_whitelist: 50,      // 白名单承诺 routes() 列不出/模块上没有的路由
};

const UNREG_MARK = '[未注册';

class RouteWiringChecker {
  /**
   * @param {{allowedRoutes?:Set<string>|string[], routesTable?:Object, modules?:Object}} [wiring]
   */
  constructor(wiring) {
    this.wiring = wiring || null;
  }

  /**
   * 三表矩阵静态核对。
   * @returns {{source:string, allowed:number, routesVisible:number, modules:number,
   *   intersection:number, healthy:boolean, issues:Array, byKind:Object,
   *   bySubsystem:Object, kinds:Object, note:string, checkedAt:number, reason?:string}}
   */
  check(wiring) {
    const w = wiring || this.wiring;
    const out = {
      source: 'injected',
      allowed: 0,
      routesVisible: 0,
      modules: 0,
      intersection: 0,
      healthy: false,
      issues: [],
      byKind: {},
      bySubsystem: {},
      kinds: { healthy: [], ghostPrivate: [], unregisteredPublic: [], staleWhitelist: [] },
      checkedAt: Date.now(),
      note: 'dispatch 路由层三表矩阵（ALLOWED_ROUTES × routes() × _modules）；静态判定不执行业务方法；严重度 ≥50 判不健康',
    };
    if (!w || !w.allowedRoutes || !w.routesTable) {
      out.source = 'not_provided';
      out.reason = 'wiring_source_not_provided';
      return out;
    }

    // ── 归一化输入 ──
    const allowed = w.allowedRoutes instanceof Set
      ? [...w.allowedRoutes]
      : (Array.isArray(w.allowedRoutes) ? w.allowedRoutes.filter(r => typeof r === 'string') : []);
    const allowedSet = new Set(allowed);
    const modules = (w.modules && typeof w.modules === 'object') ? w.modules : {};
    const table = (w.routesTable && typeof w.routesTable === 'object') ? w.routesTable : {};

    out.allowed = allowedSet.size;
    out.modules = Object.keys(modules).length;

    // ── routes() 可见面：元素 = `sub.method` 或 `sub.method  [未注册...]` ──
    const visible = new Map(); // route -> {sub, unregistered}
    for (const [sub, methods] of Object.entries(table)) {
      if (!Array.isArray(methods)) continue;
      for (const raw of methods) {
        const s = String(raw);
        const route = s.includes(UNREG_MARK) ? s.slice(0, s.indexOf(UNREG_MARK)).trimEnd() : s;
        visible.set(route, { sub, unregistered: s.includes(UNREG_MARK) });
      }
    }
    out.routesVisible = visible.size;

    // 空矩阵不是「对齐」——引擎没启动时 routes() 与 _modules 同时为空
    // （ALLOWED_ROUTES 是**类级** static Set，冷引擎也有 1305 条，所以判据不能
    // 要求白名单也空）。此时 issues 恒 0，不拦就会报出一句假的 aligned。
    // 判据取「routes() 可见为 0 **且** _modules 为 0」——两者齐空才是没就绪；
    // routesTable 空而 modules 非空是**注入的局部数据**（如单测只喂白名单侧），
    // 那种情况下白名单侧的 stale 检查恰恰最该跑，不能被空矩阵判据拦掉
    // （r258 首版只判 routesVisible===0，把 B2 注入场景误杀过）。
    if (out.routesVisible === 0 && out.modules === 0) {
      out.source = 'empty_matrix';
      out.reason = 'empty_matrix';
      out.healthy = false;
      out.note = 'routes() 可见路由与 _modules 同时为 0——引擎未启动或输入未注入；空矩阵不是对齐';
      return out;
    }

    const push = (kind, route, sub, detail) => {
      const issue = { kind, severity: SEV[kind], route, subsystem: sub, detail };
      out.issues.push(issue);
      out.byKind[kind] = (out.byKind[kind] || 0) + 1;
      out.bySubsystem[sub] = out.bySubsystem[sub] || {};
      out.bySubsystem[sub][kind] = (out.bySubsystem[sub][kind] || 0) + 1;
      // kinds 与 issues 同源同步（kinds.healthy 在 ① 里单独 push）——
      // 少这一行会让 kinds.ghostPrivate/unregisteredPublic/staleWhitelist 恒为空，
      // 而 issues/byKind 有数：上层 matrix 读 kinds.length 会恒报 0（r258 首版踩过）。
      const kindKey = { ghost_private: 'ghostPrivate', unregistered_public: 'unregisteredPublic', stale_whitelist: 'staleWhitelist' }[kind];
      if (kindKey) out.kinds[kindKey].push(route);
    };

    // ── ① routes() 侧逐条分类 ──
    for (const [route, meta] of visible) {
      if (allowedSet.has(route)) {
        out.kinds.healthy.push(route);
        out.intersection++;
        continue;
      }
      const dot = route.indexOf('.');
      const method = dot >= 0 ? route.slice(dot + 1) : route;
      const sub = dot >= 0 ? route.slice(0, dot) : meta.sub;
      if (method.startsWith('_')) {
        push('ghost_private', route, sub,
          'routes() 可见但白名单没有且方法名 _ 开头——私有方法泄漏进接口面；按 dispatch 约定（generateAllowedRoutes 两分支 + routes() own 分支均过滤 _ 前缀）本就不该有路由');
      } else {
        push('unregistered_public', route, sub,
          'routes() 可见但白名单没有且是公有方法——能力存在却不可发现：调用方按 routes() 拼出这条路由，dispatch 必抛 not allowed');
      }
    }

    // ── ② 白名单侧逐条分类（ALLOWED 有但 routes() 不可见）──
    for (const route of allowed) {
      if (visible.has(route)) continue;
      const dot = route.indexOf('.');
      const sub = dot >= 0 ? route.slice(0, dot) : route;
      const method = dot >= 0 ? route.slice(dot + 1) : '';
      const mod = modules[sub];
      if (!mod) {
        push('stale_whitelist', route, sub,
          '白名单承诺了 _modules 里不存在的子系统——路由永远到不了模块（dispatch 抛 Unknown subsystem）');
      } else if (typeof mod[method] !== 'function') {
        push('stale_whitelist', route, sub,
          '白名单承诺了模块上不存在的方法（改名/删除后的陈旧条目）——调用即抛 is not a function TypeError，且 routes() 从不显示它，调用方不可能发现');
      } else {
        push('stale_whitelist', route, sub,
          '白名单与模块方法都在，但 routes() 列不出它——接口面不一致：能力可 dispatch 却不可发现');
      }
    }

    out.healthy = !out.issues.some(i => i.severity >= SEV.stale_whitelist);
    return out;
  }

  /**
   * 便捷判据：当前三表是否完全对齐（healthy 且零发现项）。
   * 注意这不是「统一仍然成立」的证明——统一由源码锚点证明（单一词源/同一处
   * 过滤），这里只是防回退的哨兵：任何一侧重新漂移都会立刻翻面。
   */
  isAligned(wiring) {
    const r = this.check(wiring);
    return r.source !== 'not_provided' && r.issues.length === 0;
  }
}

module.exports = { RouteWiringChecker, SEV, UNREG_MARK };
