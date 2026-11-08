/**
 * BridgeIdentity — 桥身份声明 v1.0
 *
 * 交流层夹在用户和 LLM 之间，**必须先说清自己是谁、能做什么、不做什么**，
 * 下游才敢把内容交给它转译。身份声明不能是写死的宣传语—— capability 清单
 * 要和实际可达路由对得上，否则就是吹牛。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:683 的内联 stub 让
 *   dispatch('personaCore.bridgeIdentity') 恒返回 {}
 *   （scripts/tmp-250-probe.js 实测）。该路由被 src/mcp-server.js 的
 *   handleAgentThink / handleBridgeStatus 直接调用（identity.type /
 *   identity.declaration 两个字段），从接线起读出来就是 undefined。本文件补真实实现。
 *
 * 设计纪律：
 *   1. capability 清单**现场数**（构造时注入 listRoutes 探针），不硬编码——
 *       与 AGENTS.md 设计原则 #5「Honest numbers」一致；
 *   2. doesNot 五条与 AGENTS.md 的 Honest limitations 逐条对应，一条不许省；
 *   3. 探针缺席时 measured:false 且 capabilities 为空数组，明说「没测」。
 */

'use strict';

// 交流层**不**做的事——与 AGENTS.md Honest limitations 对应，逐条可指认
const DOES_NOT = [
  '不做生成：只转译与判别，不代替 LLM 产出内容',
  '不懂语义：模式匹配未覆盖的混淆表达识别不出来',
  '读不出反讽、比喻与文化语境',
  '基线误报率约 8%：判定为「有问题」不等于真有问题',
  '中文分词是启发式（贪心最长匹配 + 停用词），不是词典法',
];

// 对外声称的能力组：每组对应引擎里的一个子系统前缀。
// advertised 是人写的期望，reachable 是现场数出来的实际值——两者对不上就是缺口。
// composite：以对象成员形式暴露、不计入 routes() 方法数的能力（如 translationPipeline
// 是 {runUser, runLLM} 对象，dispatch 路由表里数不到，但确实可达）。
const CAPABILITY_GROUPS = [
  { group: 'translator', advertised: 8, prefix: 'translator', composite: 1, note: 'communicationBrief 为 r249 新增，超出 v3.0 广告的 8 项' },
  { group: 'agentLayer', advertised: 8, prefix: 'agentLayer', composite: 1, note: 'translationPipeline 是 {runUser, runLLM} 对象成员，不计入 routes() 方法数' },
  { group: 'personaCore', advertised: 7, prefix: 'personaCore', composite: 0 },
];

const DECLARATION = '我是 HeartFlow 交流层：把用户输入转译给 LLM、把 LLM 输出转译给用户，' +
  '并在两端之间跑心虫判别门禁。我不生成内容，也不判断语义真假——我只做可解释的规则转译与拦截。';

class BridgeIdentity {
  /**
   * @param {object} [opts]
   * @param {Function|string} [opts.version] 版本探针或版本串
   * @param {Function} [opts.listRoutes] 路由清单探针 () => string[]
   */
  constructor(opts = {}) {
    if (typeof opts.version === 'function') this._version = opts.version;
    else if (typeof opts.version === 'string') this._version = () => opts.version;
    else this._version = () => 'unknown';
    this._listRoutes = typeof opts.listRoutes === 'function' ? opts.listRoutes : null;
  }

  /** 现场数出来的能力分组（无探针返回空数组） */
  _capabilities() {
    if (!this._listRoutes) return [];
    let routes = [];
    try { routes = this._listRoutes() || []; } catch (e) { return []; }
    // routes() 返回的是 {子系统: [方法]} 表，也可能是字符串数组——两种都认
    const flat = Array.isArray(routes)
      ? routes
      : (routes && typeof routes === 'object'
        ? Object.entries(routes).flatMap(([name, methods]) =>
          (Array.isArray(methods) ? methods : []).map((m) => `${name}.${m}`))
        : []);
    return CAPABILITY_GROUPS.map((g) => {
      const names = flat.filter((r) => typeof r === 'string' && r.startsWith(g.prefix + '.'));
      return {
        group: g.group,
        advertised: g.advertised,
        reachable: names.length + (g.composite || 0),
        dispatchable: names.length,
        composite: g.composite || 0,
        note: g.note || null,
        methods: names.map((r) => r.slice(g.prefix.length + 1)).sort(),
      };
    });
  }

  /**
   * 身份声明。
   * @returns {{type:string,layer:number,declaration:string,version:string,
   *            capabilities:Array,routeCount:number,doesNot:string[],measured:boolean,
   *            source:string}}
   */
  getIdentity() {
    const caps = this._capabilities();
    const routeCount = caps.reduce((n, c) => n + c.reachable, 0);
    return {
      type: 'heartflow-bridge',
      layer: 1,
      declaration: DECLARATION,
      version: this._version(),
      capabilities: caps,
      routeCount,
      doesNot: DOES_NOT.slice(),
      measured: !!this._listRoutes && caps.length > 0,
      source: 'bridge-identity',
    };
  }

  /**
   * 自检： advertised 与 reachable 的差就是「广告了但调不到」的缺口。
   * @returns {{ok:boolean,gaps:Array,checked:number,measured:boolean}}
   */
  verify() {
    const caps = this._capabilities();
    if (!caps.length) return { ok: false, gaps: [{ group: '*', advertised: 0, reachable: 0, note: 'listRoutes 探针缺席，无法核验' }], checked: 0, measured: false };
    const gaps = caps
      .filter((c) => c.reachable < c.advertised)
      .map((c) => ({ group: c.group, advertised: c.advertised, reachable: c.reachable, missing: c.advertised - c.reachable }));
    return { ok: gaps.length === 0, gaps, checked: caps.length, measured: true };
  }
}

module.exports = { BridgeIdentity, DECLARATION, DOES_NOT, CAPABILITY_GROUPS };
