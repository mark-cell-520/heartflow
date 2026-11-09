'use strict';
/**
 * [r253] HandlerWiringChecker — MCP handler「接线」健康自检
 *
 * 背景（r253 实测）：7 个已在 tools/list 广告的 MCP 工具 100% 崩，根因不是模块缺失，
 * 而是 handler 用错引擎访问模式——读从不赋值的 globalThis.heartflow / heartflow._hfCore，
 * 或把 tools/call 传来的 sessionId 字符串当引擎实例。症状极具迷惑性：工具定义在、
 * handler 函数在、tools/list 看得见，但每次调用都恒返回 error。只有真调一次才知道。
 *
 * 本检查器把「逐个探活」固化成常驻能力，分两层：
 *
 *   **第一层 `check()`（r253）**：对每个**依赖引擎子系统**的工具，在活引擎上实测其
 *   目标子系统是否可达、关键方法是否齐全。守的是「handler 探不到它的子系统」。
 *
 *   **第二层 `checkStructural(wiring)`（r255）**：对**全部**已广告工具 + 全部 handler
 *   做接线矩阵——不再只覆盖手登记的那 8 条。守的是另一类同族 bug：
 *     · 已广告但 HANDLERS 里没有 → 调用恒 -32601（r253 之前 clean-tool-registry.js
 *       删过 121 个空壳，这类「广告了却调不到」正是那场清理要防的）；
 *     · 有 handler 但 tools/list 看不见 → 能力面对调用方隐身（extended-tools.js
 *       排除项是有意为之，未登记的就是漂移）；
 *     · WRITE_TOOLS 里的死条目 / 隐身写工具 → AGENTS.md「权限集三处一致」纪律失明；
 *     · schema 缺陷（缺 name/description/inputSchema、type≠object、required⊄properties）
 *       → 中央参数校验与「空参数保护」都建立在 schema 上，schema 坏则两道防线同时失效；
 *     · 未广告 ∧ 未进 WRITE_TOOLS ∧ 未通过 fs 快照只读验证的 handler → guest 可调而
 *       写安全性从未实测（r419 的验证方法留下的洞）。
 *
 * 设计纪律（对齐仓库「诚实记账」原则）：
 *   - 第一层只覆盖 _registry() 登记的子系统依赖工具，note 字段写清，不假装覆盖全部；
 *   - 第二层的输入（tools/handlerNames/writeTools/readOnlyTools）由调用方**注入**，
 *     检查器自己不去 require mcp-server.js——那个模块在无 token 时 process.exit(1)，
 *     自检绝不能让被测系统的一句「拒绝启动」把自己杀掉；
 *   - 探针抛错 = 该条判不可达（reason 记 probe_threw），绝不让自检自己崩；
 *   - 引擎没就绪就如实说 engine_not_ready，接线表没给就如实说
 *     wiring_source_not_provided，不编数字。
 *
 * 用法：new HandlerWiringChecker(engine, wiring).check() / .checkStructural()；
 * 经 heartflow_module_health（加法字段）与 heartflow_wiring_check（独立工具）暴露。
 */

const PATH_SEP = '.';

/**
 * [r255] 有意不广告的 handler 白名单——每条都能在 extended-tools.js 头部
 * 「排除项」或 WRITE_TOOLS 约定里找到出处。白名单的意义是让**新出现**的未广告
 * handler 成为可见发现，而不是每轮都把这 4 条当噪声重报一遍。
 */
const KNOWN_UNADVERTISED = {
  heartflow_self_benchmark: '写 data/self-benchmark.json（extended-tools.js 排除项①，r419 fs 快照复测确认）',
  heartflow_safe_fetch: '能发任意网络请求、SSRF 面（extended-tools.js 排除项②）',
  heartflow_circuit_breaker: '写工具（action trip/reset 可手动停引擎），按 extended-tools.js 头部约定由 WRITE_TOOLS/needsWrite 收口',
};

/** [r255] 发现项严重度：≥50 判不健康（会让 healthy=false），<50 为提示 */
const SEV = {
  advertised_no_handler: 100,
  duplicate_name: 80,
  schema_defect: 60,
  write_not_advertised: 50,
  write_no_handler: 40,
  unverified_write_safety: 40,
  handler_not_advertised: 30,
};

class HandlerWiringChecker {
  constructor(engine, wiring) {
    this.engine = engine || null;
    this.wiring = wiring || null;
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
   * 在活引擎上逐个探活（第一层：子系统依赖）。
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

  /**
   * [r255] 第二层：全量接线矩阵。不碰引擎，只看三张表的一致性。
   * @param {{tools?:Array, handlerNames?:Array, writeTools?:Array, readOnlyTools?:Array}} [wiring]
   * @returns {{source:string, advertised:number, advertisedUnique:number, handlers:number,
   *            writeTools:number, verifiedReadOnly:number, reachable:number, healthy:boolean,
   *            issues:Array, byKind:Object, note:string, checkedAt:number, reason?:string}}
   */
  checkStructural(wiring) {
    const w = wiring || this.wiring;
    const out = {
      source: 'injected',
      advertised: 0,
      advertisedUnique: 0,
      handlers: 0,
      writeTools: 0,
      verifiedReadOnly: 0,
      reachable: 0,
      healthy: false,
      issues: [],
      byKind: {},
      checkedAt: Date.now(),
      note: '覆盖全部已广告工具与全部 handler 的接线一致性；严重度 ≥50 判不健康，KNOWN_UNADVERTISED 白名单内的未广告 handler 记为提示',
    };
    if (!w || !Array.isArray(w.tools) || !Array.isArray(w.handlerNames)) {
      out.source = 'not_provided';
      out.reason = 'wiring_source_not_provided';
      return out;
    }

    const tools = w.tools.filter(t => t && typeof t.name === 'string');
    const handlerNames = w.handlerNames.filter(n => typeof n === 'string');
    const handlerSet = new Set(handlerNames);
    const writeSet = new Set((Array.isArray(w.writeTools) ? w.writeTools : []).filter(n => typeof n === 'string'));
    const readOnly = (Array.isArray(w.readOnlyTools) ? w.readOnlyTools : []).filter(t => t && typeof t.name === 'string');
    const readOnlySet = new Set(readOnly.map(t => t.name));

    out.advertised = tools.length;
    out.handlers = handlerNames.length;
    out.writeTools = writeSet.size;
    out.verifiedReadOnly = readOnly.length;

    const push = (kind, tool, detail, extra) => {
      const issue = { kind, severity: SEV[kind], tool, detail };
      if (extra) Object.assign(issue, extra);
      out.issues.push(issue);
      out.byKind[kind] = (out.byKind[kind] || 0) + 1;
    };

    // ── ① 重名：TOOLS.find(t => t.name === name) 只命中第一个，后者被永久遮蔽 ──
    const unique = new Set();
    for (const t of tools) {
      if (unique.has(t.name)) {
        push('duplicate_name', t.name, 'tools/list 里出现重名工具：中央校验的 TOOLS.find 只命中第一条，第二条的定义永不生效');
      } else {
        unique.add(t.name);
      }
    }
    out.advertisedUnique = unique.size;

    // ── ② 逐工具：schema 卫生 + handler 存在性 ──
    for (const t of tools) {
      const problems = [];
      if (!t.description || typeof t.description !== 'string') problems.push('description 缺失');
      const s = t.inputSchema;
      if (!s || typeof s !== 'object' || Array.isArray(s)) problems.push('inputSchema 缺失');
      else {
        if (s.type !== 'object') problems.push('inputSchema.type=' + JSON.stringify(s.type));
        if (!s.properties || typeof s.properties !== 'object') problems.push('inputSchema.properties 缺失');
        if (Array.isArray(s.required)) {
          for (const r of s.required) {
            if (!s.properties || typeof s.properties !== 'object' || !(r in s.properties)) {
              problems.push('required 参数 ' + r + ' 不在 properties 里（中央校验会把它洗掉 → 合法调用恒被「未收到任何有效参数」拒绝）');
            }
          }
        }
      }
      if (problems.length) push('schema_defect', t.name, problems.join('；'));

      if (!handlerSet.has(t.name)) {
        push('advertised_no_handler', t.name, 'tools/list 广告了但 HANDLERS 没有对应条目 → 调用恒返回 -32601 Method not found');
      } else {
        out.reachable++;
      }
    }

    // ── ③ 反向：有 handler 但未广告 ──
    for (const name of handlerSet) {
      if (unique.has(name)) continue;
      const known = KNOWN_UNADVERTISED[name];
      if (known) {
        push('handler_not_advertised', name, '已知排除（by design）：' + known, { byDesign: true });
      } else {
        push('handler_not_advertised', name, '未登记在排除清单里的未广告 handler——调用方从 tools/list 看不见它，权限文档也列不到它');
      }
    }

    // ── ④ 写权限白名单完整性 ──
    for (const name of writeSet) {
      if (!handlerSet.has(name)) {
        push('write_no_handler', name, 'WRITE_TOOLS 里的工具没有 handler——权限拦截的是一个跑不起来的工具（死条目）');
      }
      if (!unique.has(name) && !KNOWN_UNADVERTISED[name]) {
        push('write_not_advertised', name, '写权限工具既未在 tools/list 广告也未登记排除——AGENTS.md「权限集三处一致」的纪律看不见它');
      }
    }

    // ── ⑤ 未验证写安全面的可调 handler：未广告 ∧ 未进 WRITE_TOOLS ∧ 未过 fs 快照只读验证 ──
    // （已广告工具走主表/EXTENDED_TOOLS 的既有验证口径，不在此重复判定）
    for (const name of handlerSet) {
      if (unique.has(name) || writeSet.has(name) || readOnlySet.has(name) || KNOWN_UNADVERTISED[name]) continue;
      push('unverified_write_safety', name, '未广告、未进 WRITE_TOOLS、也未通过 extended-tools.js 的 fs 快照只读验证——guest 可直接调用而写安全性从未实测');
    }

    out.healthy = !out.issues.some(i => i.severity >= 50);
    return out;
  }

  /**
   * [r255] 两层合查：第一层子系统探活 + 第二层全量接线矩阵（加法字段 toolWiring，
   * 不改动 check() 的既有形状）。
   *
   * [r258] 第三层 routeWiring：dispatch 路由层接线矩阵（r255 已知未修④「结构层
   * 不覆盖 dispatch 路由层」的落地）。同样是加法字段。输入优先取注入的
   * allowedRoutes/routesTable/modules，没给就从活引擎现取（引擎侧自检的默认
   * 路径）；引擎也没有就如实说 wiring_source_not_provided。
   */
  checkAll(wiring) {
    const out = this.check();
    out.toolWiring = this.checkStructural(wiring);
    out.routeWiring = this.checkRoutes(wiring);
    return out;
  }

  /**
   * [r258] 第三层：dispatch 路由层三表矩阵。与 checkStructural 同一纪律——
   * 不执行业务方法（dispatch 门禁的两步判定 `ALLOWED_ROUTES.has(route)` +
   * `typeof mod[method] === 'function'` 都可静态完成），探错即记 probe_threw
   * 而不是让自检自己崩。
   * @returns {Object} RouteWiringChecker.check() 的返回值
   */
  checkRoutes(wiring) {
    const w = wiring || this.wiring;
    let allowedRoutes = null;
    let routesTable = null;
    let modules = null;
    if (w && w.allowedRoutes && w.routesTable) {
      allowedRoutes = w.allowedRoutes;
      routesTable = w.routesTable;
      modules = w.modules || null;
    } else {
      const e = this.engine;
      if (e) {
        try {
          allowedRoutes = e.constructor && e.constructor.ALLOWED_ROUTES;
          routesTable = typeof e.routes === 'function' ? e.routes() : null;
          modules = e._modules || null;
        } catch (err) {
          return { source: 'probe_threw', healthy: false, reason: 'probe_threw: ' + (err && err.message), issues: [], checkedAt: Date.now() };
        }
      }
    }
    let RouteWiringChecker;
    try {
      ({ RouteWiringChecker } = require('../core/route-wiring-check.js'));
    } catch (err) {
      return { source: 'probe_threw', healthy: false, reason: 'probe_threw: ' + (err && err.message), issues: [], checkedAt: Date.now() };
    }
    return new RouteWiringChecker({ allowedRoutes, routesTable, modules }).check();
  }
}

module.exports = { HandlerWiringChecker, PATH_SEP, KNOWN_UNADVERTISED, SEV };
