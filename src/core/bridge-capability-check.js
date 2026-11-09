'use strict';
/**
 * [r259] BridgeCapabilityChecker — 桥接层对外能力表「三处漂移」闭合自检
 *
 * 背景（r259 轮初实测，探针 scripts/tmp-259-probe3.js）：描述同一批桥接能力的
 * **三张表**各自手写、互不派生，r249 新增 translator.communicationBrief 时只改了
 * 引擎侧 routes()，另外两张表没跟上：
 *
 *   表 A  routes()                      引擎侧真值（单一事实源）
 *   表 B  handleBridgeStatus().modules  src/mcp-server.js:1090 手写三组方法名清单
 *   表 C  CAPABILITY_GROUPS             src/bridge/bridge-identity.js:37 手写 advertised 计数
 *
 * 轮前实测漂移三条（全部可复现，不是构造的红队）：
 *   ① 表 B translator 只有 8 条，缺 communicationBrief —— **公开 MCP 工具
 *      heartflow_bridge_status 对外少报一个真实能力**，外部调用方按它盘点桥接
 *      能力时永远发现不了 r249 新增的那一个；
 *   ② 表 B agentLayer 第 8 条 translationPipeline **不是 dispatch 路由**
 *      （它是 {runUser, runLLM} 对象成员，routes() 数不到）——公开清单把不可
 *      dispatch 的东西和可 dispatch 的路由混在一张表里，调用方无从分辨；
 *   ③ 表 C translator `advertised:8 + composite:1`，而 communicationBrief 本身
 *      就是一条 dispatch 路由、不是 composite 对象成员 —— composite 记在了错的
 *      组上，于是 BridgeIdentity 自己「现场数」出来的 reachable 报 **10**，
 *      而真实可达只有 **9**。文件头注释写着「capability 清单要和实际可达路由
 *      对得上，否则就是吹牛」，吹的正是自己。
 *
 * 根因与 r258 同族：**多张表描述同一件事，各写各的，没有一层自检看它们的一致
 * 性**。且 BridgeIdentity.verify() 的注释说「advertised 与 reachable 的差就是
 * 缺口」，代码却只判了 `reachable < advertised` 一个方向——调得到但广告数说少了
 * （①③）与广告了但调不到（②）两类缺口里，前一类恒不报。
 *
 * 判据（静态核对，不执行业务方法——三张表都是名字与计数，核对只需 typeof 读取）：
 *
 *   undiscoverableCapability routes() 有、公开清单（表 B）没有、也不是已声明的
 *                             composite 成员 → 真实能力对外不可发现（①）
 *   phantomEntry             公开清单有、routes() 没有、也不是已声明 composite
 *                             成员 → 公开清单承诺了调不到的东西（②）
 *   advertisedDrift          advertised ≠ routes() 条数 + 已声明 composite 条数
 *                             （双向：多说=广告了调不到，少说=调得到却不说）
 *   compositeMisassigned     声明了 composite 成员，但该成员在模块上是函数（即它
 *                             其实是路由）→ composite 记在了错的组上（③）
 *   undeclaredComposite      模块上公有、非函数、非路由的对象成员没被声明为
 *                             composite → 下一张 translationPipeline 出现时无人登记
 *   groupMismatch            某组只在部分表里出现
 *
 * 设计纪律（对齐 RouteWiringChecker / HandlerWiringChecker）：
 *   - 输入全部**注入**，检查器自己不 require 引擎、不构造实例；
 *   - 输入缺失如实说 not_provided，不编数字；
 *   - **表 B 是可选的**：修好之后表 B 由 routes() 现场派生（单一事实源），此时
 *     「表 A ≡ 表 B」是构造使然而非发现——所以表 B 缺席时判 mcp_table_not_provided
 *     （如实说没喂），绝不反过来报一句假的 aligned。要证明自检能抓住①，就喂
 *     修复前那份手写清单（本轮测试 A 族就这么干）。
 */

/** 发现项严重度：≥50 判 healthy=false */
const SEV = {
  undiscoverable_capability: 100, // 真实能力对外不可发现（外部调用方按公开清单盘点，永远少一个）
  group_mismatch: 90,             // 同一批能力在三张表里组的集合都不一致
  phantom_entry: 80,              // 公开清单承诺了 dispatch 调不到的东西
  composite_misassigned: 70,      // composite 记在错的组上 → 自己数出来的 reachable 是假的
  advertised_drift: 60,           // 手写 advertised 与现场实测对不上（双向）
  undeclared_composite: 50,       // 公有对象成员没登记成 composite → 下一次必然漏报
};

const KIND_KEY = {
  undiscoverable_capability: 'undiscoverableCapability',
  phantom_entry: 'phantomEntry',
  advertised_drift: 'advertisedDrift',
  composite_misassigned: 'compositeMisassigned',
  undeclared_composite: 'undeclaredComposite',
  group_mismatch: 'groupMismatch',
};

/**
 * 从 routes() 现场派生对外公开能力清单（修复后表 B 的构造规则）。
 *
 * [r259] 这是「不再手写第二份名单」的那一个函数：公开清单 = 该组的 dispatch 路由
 * （去掉 `_` 前缀私有方法）∪ 已登记的 composite 成员。mcp-server 的
 * `_bridgeCapabilityModules` 与 HeartFlow.bridgeCapabilityTrace 共用它——两处各写
 * 一份派生规则就等于又造了两张会漂移的表（本轮要修的正是这个形状）。
 *
 * 注意：派生出来的清单与 routes() **按构造一致**，所以「表 A ≡ 表 B」不是发现、
 * 是恒真。它仍然值得算，因为①它是 heartflow_bridge_status 的真实输出，②它把
 * composite 成员（dispatch 调不到、但确实可达）和路由合到一张对外清单里——这正是
 * 轮前手写清单把两者混在一起导致出错的地方。
 *
 * @param {Object} routesTable routes() 原表
 * @param {Array<{group:string, compositeMembers?:string[]}>} advertisedGroups
 * @returns {Object<string,string[]>} {group: [method,...]}
 */
function derivePublicGroups(routesTable, advertisedGroups) {
  const out = {};
  const groups = Array.isArray(advertisedGroups) ? advertisedGroups : [];
  const table = (routesTable && typeof routesTable === 'object') ? routesTable : {};
  for (const g of groups) {
    if (!g || typeof g.group !== 'string') continue;
    const names = new Set();
    const raw = Array.isArray(table[g.group]) ? table[g.group] : [];
    for (const item of raw) {
      const s = String(item);
      const dot = s.indexOf('.');
      const method = dot > 0 ? s.slice(dot + 1) : s;
      if (method && !method.startsWith('_')) names.add(method);
    }
    for (const c of (Array.isArray(g.compositeMembers) ? g.compositeMembers : [])) names.add(String(c));
    out[g.group] = [...names].sort();
  }
  return out;
}

class BridgeCapabilityChecker {
  /**
   * @param {{routesTable?:Object, advertisedGroups?:Array, modules?:Object,
   *          mcpGroups?:Object}} [surface]
   */
  constructor(surface) {
    this.surface = surface || null;
  }

  /**
   * 三表核对。
   * @returns {{source:string, groups:number, routesTotal:number, mcpTotal:number,
   *   advertisedTotal:number, healthy:boolean, issues:Array, byKind:Object,
   *   byGroup:Object, kinds:Object, checkedAt:number, note:string, reason?:string}}
   */
  check(surface) {
    const s = surface || this.surface;
    const out = {
      source: 'injected',
      groups: 0,
      routesTotal: 0,
      mcpTotal: 0,
      advertisedTotal: 0,
      healthy: false,
      issues: [],
      byKind: {},
      byGroup: {},
      kinds: {
        undiscoverableCapability: [],
        phantomEntry: [],
        advertisedDrift: [],
        compositeMisassigned: [],
        undeclaredComposite: [],
        groupMismatch: [],
      },
      checkedAt: Date.now(),
      note: '桥接层能力表三处对账（routes() × 公开清单 × advertised 计数）；静态判定不执行业务方法；严重度 ≥50 判不健康',
    };

    // ── 输入就绪判据 ──
    // routesTable 与 advertisedGroups 是必需的两侧（一侧是真值、一侧是人写期望）；
    // mcpGroups 是**可选的第三侧**，缺席如实说，不假装对齐（见文件头纪律）。
    if (!s || !s.routesTable || !Array.isArray(s.advertisedGroups) || s.advertisedGroups.length === 0) {
      out.source = 'not_provided';
      out.reason = 'capability_surface_not_provided';
      out.note = 'routesTable 与 advertisedGroups 必须同时注入且后者非空（前者是现场真值，后者是人写期望——空数组等于没有能力面可对账）';
      return out;
    }
    if (!s.mcpGroups) {
      out.source = 'mcp_table_not_provided';
      out.reason = 'mcp_table_not_provided';
      out.note = '只注入了真值侧与 advertised 侧，公开清单（heartflow_bridge_status 的 modules）未注入——不判 aligned，也不判 drift';
    }

    // ── 归一化表 A：routes() → {group: Set(method)} ──
    // routes() 的元素在本仓有两种历史形态：`sub.method` 与裸 `method`（v6.7.74
    // 前后变过），两种都认——按元素自身是否已带 `group.` 前缀判定。
    const routesByGroup = new Map();
    for (const [sub, methods] of Object.entries(s.routesTable)) {
      if (!Array.isArray(methods)) continue;
      const set = routesByGroup.get(sub) || new Set();
      for (const raw of methods) {
        const str = String(raw);
        const dot = str.indexOf('.');
        const method = dot > 0 ? str.slice(dot + 1) : str;
        if (method) set.add(method);
      }
      routesByGroup.set(sub, set);
    }

    // ── 归一化表 B：公开清单 → {group: Set(method)} ──
    const mcpByGroup = new Map();
    if (s.mcpGroups && typeof s.mcpGroups === 'object') {
      for (const [g, list] of Object.entries(s.mcpGroups)) {
        if (!Array.isArray(list)) continue;
        mcpByGroup.set(g, new Set(list.map(String)));
      }
    }

    const modules = (s.modules && typeof s.modules === 'object') ? s.modules : {};

    const push = (kind, group, detail, extra) => {
      const issue = Object.assign({ kind, severity: SEV[kind], group, detail }, extra || {});
      out.issues.push(issue);
      out.byKind[kind] = (out.byKind[kind] || 0) + 1;
      out.byGroup[group] = out.byGroup[group] || {};
      out.byGroup[group][kind] = (out.byGroup[group][kind] || 0) + 1;
      // kinds 与 issues 必须同源同步——r258 踩坑①：只 push issues 会让
      // kinds.xxx 恒空，上层读 kinds.length 恒报 0 而明细里躺着全部发现项。
      out.kinds[KIND_KEY[kind]].push(group);
    };

    // ── 组的集合一致性 ──
    // 核对宇宙取「advertised 声明过的能力组」∪「公开清单里出现的组」——桥接能力面
    // 只覆盖 BridgeIdentity 声明的那几个子系统，不是 routes() 的全部 162 个组。
    // （首版宇宙取 routes() 全部组，于是 undeclared_composite 把 patternDetector.config
    // 这类**引擎内部配置对象**也数成「未登记能力」，一次报 157 条纯噪声——自检报的
    // 噪声比它要抓的缺陷多一个数量级，比没有自检更坏。）
    const universe = new Set(s.advertisedGroups.map((g) => g.group));
    for (const g of mcpByGroup.keys()) universe.add(g);
    out.groups = universe.size;

    for (const g of universe) {
      const routes = routesByGroup.get(g) || new Set();
      const mcp = mcpByGroup.has(g) ? mcpByGroup.get(g) : null;
      const adv = s.advertisedGroups.find((x) => x.group === g) || null;
      const mod = modules[g] || null;

      out.routesTotal += routes.size;
      if (mcp) out.mcpTotal += mcp.size;
      if (adv) out.advertisedTotal += adv.advertised;

      if (!adv) {
        push('group_mismatch', g, '公开清单里出现了这一组，但 advertised 侧没有声明它——对外能力面由 CAPABILITY_GROUPS 界定，多出来的组没有 advertised 基准可对');
      } else if (!routesByGroup.has(g)) {
        push('group_mismatch', g, 'advertised 声明了这一组，但 routes() 里没有——整个组都不可 dispatch');
      } else if (!mcp && mcpByGroup.size > 0) {
        push('group_mismatch', g, 'advertised 与 routes() 都有这一组，公开清单里却没有');
      }

      // ── ① 表 A vs 表 B：真实能力不可发现 / 幽灵条目 ──
      if (mcp) {
        const declaredComposites = new Set((adv && adv.compositeMembers) || []);
        for (const method of routes) {
          if (!mcp.has(method) && !declaredComposites.has(method)) {
            push('undiscoverable_capability', g,
              `routes() 有 ${g}.${method}，公开清单没有、也没登记成 composite —— 外部调用方按 heartflow_bridge_status 的 modules 盘点桥接能力时永远发现不了它`,
              { method });
          }
        }
        for (const name of mcp) {
          if (!routes.has(name) && !declaredComposites.has(name)) {
            push('phantom_entry', g,
              `公开清单列了 ${g}.${name}，但它既不是 dispatch 路由也不是已登记的 composite 成员 —— 调用方按清单拼路由会被 dispatch 拒绝`,
              { method: name });
          }
        }
      }

      // ── ② composite 登记核对（表 C 的自洽）──
      const compositeMembers = (adv && Array.isArray(adv.compositeMembers)) ? adv.compositeMembers : [];
      for (const name of compositeMembers) {
        if (routes.has(name)) {
          push('composite_misassigned', g,
            `${g}.${name} 本身就是一条 dispatch 路由，却被登记成 composite 对象成员 —— composite 记在了错的组上，reachable 会多数一个`,
            { method: name });
        } else if (mod && typeof mod[name] === 'function') {
          push('composite_misassigned', g,
            `${g}.${name} 在模块上是函数（可 dispatch），却被登记成 composite —— composite 只该登记「对象成员、routes() 数不到」的能力`,
            { method: name });
        } else if (mod && !(name in mod)) {
          push('composite_misassigned', g,
            `${g}.${name} 登记成 composite，但模块上找不到这个成员 —— 登记了个不存在的能力`,
            { method: name });
        }
      }

      // ── ③ 未登记的 composite：公有、非函数、非路由的对象成员 ──
      // 这是②的镜像哨兵：translationPipeline 今天登记了，下一张同形状的对象成员
      // 出现时若没人登记，表 B 就会再次把「不可 dispatch 的东西」和路由混在一起。
      if (mod) {
        for (const key of Object.keys(mod)) {
          if (key.startsWith('_')) continue;
          if (routes.has(key)) continue;
          if (compositeMembers.includes(key)) continue;
          const v = mod[key];
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            push('undeclared_composite', g,
              `${g}.${key} 是公有对象成员（routes() 数不到、dispatch 调不了）却没登记成 composite —— 它不会出现在任何一张对外能力表里`,
              { method: key });
          }
        }
      }

      // ── ④ 表 C advertised vs 现场实测（双向）──
      if (adv) {
        const measured = routes.size + compositeMembers.length;
        if (adv.advertised !== measured) {
          const direction = adv.advertised > measured ? '广告了但调不到' : '调得到但广告数说少了';
          push('advertised_drift', g,
            `advertised=${adv.advertised} 而现场实测 ${routes.size} 条路由 + ${compositeMembers.length} 个 composite = ${measured}（${direction}）`,
            { advertised: adv.advertised, measured, routes: routes.size, composites: compositeMembers.length });
        }
      }
    }

    // healthy 要求**三张表都喂齐了**：只喂两张时 issues 恒 0，报 healthy=true
    // 就是拿「没测」当「测过且没问题」（r258 踩坑②同款：空矩阵/未注入不许判 aligned）。
    out.healthy = out.source === 'injected' && !out.issues.some((i) => i.severity >= SEV.undeclared_composite);
    return out;
  }

  /**
   * 便捷判据：三表是否完全对账（注入齐全且零发现项）。
   * 注意表 B 缺席时返回 false 且 source=mcp_table_not_provided——那不是「漂移」，
   * 是「没喂第三张表」，两者必须分开（r258 踩坑②同款：把未就绪当对齐/当漂移都会误判）。
   */
  isReconciled(surface) {
    const r = this.check(surface);
    return r.source === 'injected' && r.issues.length === 0;
  }
}

module.exports = { BridgeCapabilityChecker, SEV, KIND_KEY, derivePublicGroups };
