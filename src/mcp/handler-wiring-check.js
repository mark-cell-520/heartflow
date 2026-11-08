'use strict';
/**
 * [r253] HandlerWiringChecker — MCP handler「接线」健康自检
 *
 * 背景（r253 实测）：7 个已在 tools/list 广告的 MCP 工具 100% 崩，根因不是模块缺失，
 * 而是 handler 用错引擎访问模式——读从不赋值的 globalThis.heartflow / heartflow._hfCore，
 * 或把 tools/call 传来的 sessionId 字符串当引擎实例。症状极具迷惑性：工具定义在、
 * handler 函数在、tools/list 看得见，但每次调用都恒返回 error。只有真调一次才知道。
 *
 * 本检查器把「逐个探活」固化成常驻能力：对每个**依赖引擎子系统**的工具，在活引擎上
 * 实测其目标子系统是否可达、关键方法是否齐全。它守的正是 r253 这一 bug 类——
 * 「handler 探不到它的子系统」。新增依赖子系统的工具时，往 _registry() 加一条即可。
 *
 * 设计纪律（对齐仓库「诚实记账」原则）：
 *   - 只覆盖注册表里登记的子系统依赖工具，不假装覆盖全部 187 个（note 字段写清）；
 *   - 探针抛错 = 该条判不可达（reason 记 probe_threw），绝不让自检自己崩；
 *   - 引擎没就绪就如实说 engine_not_ready，不编数字。
 *
 * 用法：new HandlerWiringChecker(engine).check()；经 heartflow_module_health 工具暴露。
 */

const PATH_SEP = '.';

class HandlerWiringChecker {
  constructor(engine) {
    this.engine = engine || null;
  }

  /**
   * 子系统依赖注册表：toolName → { subsystem, resolve(engine) => {ok, reason} }
   * resolve 只在活引擎上做**存在性 + 方法齐全性**探测，不执行业务副作用。
   */
  _registry() {
    const has = (obj, method) => !!(obj && typeof obj[method] === 'function');
    return [
      { tool: 'heartflow_boundary_check', subsystem: 'boundaryGuard',
        resolve: (e) => ({ ok: has(e.boundaryGuard, 'checkWrite'), reason: 'boundaryGuard.checkWrite' }) },
      { tool: 'heartflow_cache_stats', subsystem: 'kvCache',
        resolve: (e) => ({ ok: !!(e.kvCache && e.kvCache._stats && typeof e.kvCache._stats.hits === 'number'), reason: 'kvCache._stats（think-cache 已于 r253 前删除）' }) },
      { tool: 'heartflow_decision_history', subsystem: '_decisionHistory',
        resolve: (e) => ({ ok: Array.isArray(e._decisionHistory), reason: '_decisionHistory 数组' }) },
      { tool: 'heartflow_error_store', subsystem: '_modules.errorMemory',
        resolve: (e) => ({ ok: has(e._modules && e._modules.errorMemory, 'store'), reason: '_modules.errorMemory.store' }) },
      { tool: 'heartflow_error_query', subsystem: '_modules.errorMemory',
        resolve: (e) => ({ ok: has(e._modules && e._modules.errorMemory, 'query'), reason: '_modules.errorMemory.query' }) },
      { tool: 'heartflow_error_fix', subsystem: '_modules.errorTaxonomy',
        resolve: (e) => ({ ok: has(e._modules && e._modules.errorTaxonomy, 'fix'), reason: '_modules.errorTaxonomy.fix' }) },
      { tool: 'heartflow_error_verify', subsystem: '_modules.errorTaxonomy',
        resolve: (e) => ({ ok: has(e._modules && e._modules.errorTaxonomy, 'verify'), reason: '_modules.errorTaxonomy.verify' }) },
      { tool: 'heartflow_error_classify', subsystem: '_modules.errorTaxonomy',
        resolve: (e) => ({ ok: has(e._modules && e._modules.errorTaxonomy, 'classify'), reason: '_modules.errorTaxonomy.classify' }) },
    ];
  }

  /**
   * 在活引擎上逐个探活。
   * @returns {{engineReady:boolean, total:number, reachable:number, unreachable:Array,
   *            healthy:boolean, checkedAt:number, note:string, reason?:string}}
   */
  check() {
    const engine = this.engine;
    const out = {
      engineReady: !!engine,
      total: 0,
      reachable: 0,
      unreachable: [],
      healthy: false,
      checkedAt: Date.now(),
      note: '仅覆盖 _registry() 登记的子系统依赖工具，不代表全部 MCP 工具的接线健康',
    };
    if (!engine) {
      out.reason = 'engine_not_ready';
      return out;
    }
    for (const entry of this._registry()) {
      out.total++;
      let ok = false;
      let reason = '';
      try {
        const r = entry.resolve(engine);
        ok = !!r.ok;
        reason = r.reason || '';
      } catch (e) {
        ok = false;
        reason = 'probe_threw: ' + (e && e.message);
      }
      if (ok) {
        out.reachable++;
      } else {
        out.unreachable.push({ tool: entry.tool, subsystem: entry.subsystem, reason });
      }
    }
    out.healthy = out.unreachable.length === 0;
    return out;
  }
}

module.exports = { HandlerWiringChecker, PATH_SEP };
