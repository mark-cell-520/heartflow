'use strict';
/**
 * [r260] BridgeCapabilitySnapshot — 桥接层对外能力面「形状」的独立基线
 *
 * 背景（r259 之后的残留缺口，r259 交接簿候选池⑪）：r259 把
 * `heartflow_bridge_status.modules` 从**手写清单**改成由 `routes()` 现场派生
 * （`derivePublicGroups` 单一规则，mcp-server 与 trace 共用），三表对账发现项
 * 2→0、verdict 恒 reconciled。修得很干净，但同时留下一个**新的结构性盲区**：
 *
 *   修好之后「表 A ≡ 表 B」不再是发现，而是**构造使然**——
 *   两张表同源派生，`BridgeCapabilityChecker` 无论跑多少遍都只会说 reconciled。
 *
 * 于是对外能力面的「形状」现在只由**三样手写的东西**决定，而它们没有任何独立判据：
 *
 *   ① `CAPABILITY_GROUPS[].advertised`（手写计数）——这一样有哨兵：
 *      advertised_drift 判据会拿它和现场实测对（r259 落地）；
 *   ② `CAPABILITY_GROUPS[].compositeMembers`（手写名单）——**没有哨兵**：
 *      名单增删一条，派生清单跟着变，三表对账照旧 reconciled；
 *   ③ `derivePublicGroups` 的派生规则本身（哪一组成员进公开清单、`_` 前缀怎么
 *      过滤、composite 怎么并进来）——**没有哨兵**：规则一改，对外能力面静默
 *      改变形状，没有任何一层会发现。
 *
 * 代价是可指名的：外部调用方按 `heartflow_bridge_status` 的 `modules` 盘点桥接
 * 能力。如果②③静默变了，对外承诺的能力集合变了而没人知道——正是 r259 缺口①
 * （communicationBrief 对外不可发现）的**同族复发**，只是方向从「忘了加」变成
 * 「规则改了没人看见」。
 *
 * 本模块把「当前对外能力面」归一化成一份**可哈希的规范快照**，与一份**落盘基线**
 * 逐组逐条对比，把「能力面形状变了」从不可观测变成可观测：
 *
 *   group_removed      整个能力组从对外面消失（最重：advertised 侧还声明着它）
 *   surface_removed    组内某条能力从对外清单消失（外部调用方原本能调的调不到了）
 *   composite_removed  已登记的 composite 成员没了（原本宣传的能力不再可达）
 *   group_added        多出一个对外能力组
 *   surface_added      组内新增一条能力（能力变多本身不是缺陷，但形状变了要能看见）
 *   composite_added    composite 名单新增一条
 *
 * 设计纪律（对齐 RouteWiringChecker / BridgeCapabilityChecker）：
 *   - 输入全部**注入**，本模块不 require 引擎、不构造实例；
 *   - 基线**可注入**（`baseline`），不注入才走盘（`baselinePath`）；盘上也没有时
 *     如实报 `no_baseline`，绝不反过来报一句假的 unchanged；
 *   - digest 只由归一化后的成员名单决定（排序后 JSON 的 sha256 前 16 位），
 *     **不含时间戳**——否则同一份能力面两次记录 digest 不同，跨进程对账失效；
 *   - 落盘用 tmp + rename 原子写，写失败如实记 `record_failed` 不炸调用方；
 *   - `healthy` 只由**减少类**发现项（severity ≥ 70）决定：能力变多不是缺陷，
 *     但「少了」一定是。`changed` 单独回答「形状变没变」，两者不混。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** 发现项严重度：≥70 判 healthy=false（减少类）；<70 是形状变化（ informational ） */
const SEV = {
  group_removed: 100,     // 整个能力组从对外面消失
  surface_removed: 90,    // 组内一条能力从对外清单消失
  composite_removed: 70,  // 已登记的 composite 成员没了
  group_added: 50,        // 多出一个对外能力组
  surface_added: 40,      // 组内新增一条能力
  composite_added: 40,    // composite 名单新增一条
};

const KIND_KEY = {
  group_removed: 'groupRemoved',
  surface_removed: 'surfaceRemoved',
  composite_removed: 'compositeRemoved',
  group_added: 'groupAdded',
  surface_added: 'surfaceAdded',
  composite_added: 'compositeAdded',
};

/** 减少类判据（healthy 由它们决定） */
const LOSS_KINDS = ['group_removed', 'surface_removed', 'composite_removed'];

/** 默认基线落盘位置（与 knowledgeBase / sessionMemory 同款 repo/data 约定） */
const DEFAULT_BASELINE_PATH = path.join(__dirname, '..', '..', 'data', 'bridge-capability-surface.json');

/** 快照格式版本：形状变了要能识别旧基线，不能拿不兼容的旧文件当基线 */
const SNAPSHOT_FORMAT = 'bridge-capability-surface/1';

/**
 * 把「当前对外能力面」归一化成规范快照。
 *
 * 输入与 `BridgeCapabilityChecker` 同款（routesTable + advertisedGroups），
 * 归一化规则 = `derivePublicGroups` 的同一份语义（dispatch 路由去 `_` 前缀
 * ∪ composite 成员），但**额外把 composite 名单单独留一份**——composite 成员
 * 名单是手写的、没有 advertised_drift 那种哨兵守着，必须单独对比。
 *
 * @param {{routesTable?:Object, advertisedGroups?:Array}} surface
 * @returns {{format:string, groups:Object<string,{methods:string[],composites:string[]}>,
 *   groupOrder:string[], entries:number, digest:string}}
 */
function normalize(surface) {
  const s = surface || {};
  const table = (s.routesTable && typeof s.routesTable === 'object') ? s.routesTable : {};
  const groups = Array.isArray(s.advertisedGroups) ? s.advertisedGroups : [];

  // 组的宇宙取 advertised 声明过的组（与 BridgeCapabilityChecker.check 同口径：
  // 桥接能力面只覆盖 BridgeIdentity 声明的那几个子系统，不是 routes() 全部 162 组）
  const out = {};
  const groupOrder = [];
  for (const g of groups) {
    if (!g || typeof g.group !== 'string') continue;
    const composites = (Array.isArray(g.compositeMembers) ? g.compositeMembers : []).map(String).sort();
    const raw = Array.isArray(table[g.group]) ? table[g.group] : [];
    const methods = new Set();
    for (const item of raw) {
      const str = String(item);
      const dot = str.indexOf('.');
      const method = dot > 0 ? str.slice(dot + 1) : str;
      // 与 derivePublicGroups 同一条过滤：`_` 前缀私有方法不进对外能力面
      if (method && !method.startsWith('_')) methods.add(method);
    }
    for (const c of composites) methods.add(c);
    out[g.group] = { methods: [...methods].sort(), composites };
    groupOrder.push(g.group);
  }
  groupOrder.sort();

  let entries = 0;
  for (const g of Object.keys(out)) entries += out[g].methods.length;

  // digest 只由名单决定（不含 recordedAt/version），否则同一份能力面两次记录
  // digest 不同，跨进程对账直接失效。
  const digest = crypto.createHash('sha256')
    .update(JSON.stringify({ format: SNAPSHOT_FORMAT, groups: out, groupOrder }))
    .digest('hex').slice(0, 16);

  return { format: SNAPSHOT_FORMAT, groups: out, groupOrder, entries, digest };
}

class BridgeCapabilitySnapshot {
  /**
   * @param {{baselinePath?:string}} [opts]
   */
  constructor(opts) {
    this.baselinePath = (opts && opts.baselinePath) || DEFAULT_BASELINE_PATH;
  }

  /** 归一化当前能力面（便捷出口，测试与 trace 共用） */
  normalize(surface) { return normalize(surface); }

  /**
   * 基线形状校验。注入的基线与盘上读出来的**走同一条校验**——否则「注入一份
   * 格式不对的基线」会绕过 loadBaseline 的检查，静默产出一堆假 drift（r260 自测
   * 照出：注入 {format:'bogus/9'} 时 verdict 报 drifted 而实际根本没有可比基线）。
   * @returns {{ok:boolean, error?:string}}
   */
  static validateBaseline(b) {
    if (!b || typeof b !== 'object') return { ok: false, error: 'baseline_not_object' };
    if (b.format !== SNAPSHOT_FORMAT) return { ok: false, error: 'baseline_format_unrecognized' };
    if (!b.groups || typeof b.groups !== 'object') return { ok: false, error: 'baseline_groups_missing' };
    return { ok: true };
  }

  /**
   * 读盘上的基线。文件不在 / 不是合法 JSON / 形状不认识，都如实返回 null +
   * baselineError——**不拿不兼容的旧文件当基线**（那会比没有基线更坏：会照着
   * 一份看不懂的文件报一堆假 drift）。
   */
  loadBaseline(p) {
    const file = p || this.baselinePath;
    let raw;
    try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { return { baseline: null, baselineError: 'baseline_file_missing', path: file }; }
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return { baseline: null, baselineError: 'baseline_file_corrupt', path: file }; }
    const v = BridgeCapabilitySnapshot.validateBaseline(parsed);
    if (!v.ok) return { baseline: null, baselineError: v.error, path: file };
    return { baseline: parsed, baselineError: null, path: file };
  }

  /**
   * 把当前能力面落成基线（原子写：tmp + rename）。
   * @returns {{recorded:boolean, path:string, groups:number, entries:number,
   *   digest:string, groupOrder:string[], error?:string}}
   */
  record(surface, opts) {
    const file = (opts && opts.baselinePath) || this.baselinePath;
    const snap = normalize(surface);
    const payload = Object.assign({}, snap, {
      recordedAt: new Date().toISOString(),
      note: '桥接层对外能力面基线（r260）。digest 只由成员名单决定，不含 recordedAt——同一份能力面跨进程重录 digest 必须相同，否则跨进程对账失效。',
    });
    const tmp = file + '.tmp';
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(tmp, JSON.stringify(payload, null, 2) + '\n', 'utf8');
      fs.renameSync(tmp, file);
    } catch (e) {
      try { fs.unlinkSync(tmp); } catch (e2) { /* tmp 清不掉不影响主流程 */ }
      return { recorded: false, path: file, error: e.message, groups: snap.groupOrder.length, entries: snap.entries, digest: snap.digest, groupOrder: snap.groupOrder };
    }
    return { recorded: true, path: file, groups: snap.groupOrder.length, entries: snap.entries, digest: snap.digest, groupOrder: snap.groupOrder };
  }

  /**
   * 当前能力面 vs 基线，逐组逐条对比。
   * @param {Object} surface 当前能力面（routesTable + advertisedGroups）
   * @param {{baseline?:Object, baselinePath?:string}} [opts]
   */
  compare(surface, opts) {
    const o = opts || {};
    const injected = o.baseline || null;
    let baseline = null;
    let baselineError = null;
    if (injected) {
      // 注入的基线也要过同一条形状校验（见 validateBaseline 注释）。**注入了就不
      // 再回退到盘上**——调用方明确指定了要跟谁比，静默换成另一份基线比出来的
      // 结论是假的。
      const v = BridgeCapabilitySnapshot.validateBaseline(injected);
      if (v.ok) baseline = injected;
      else baselineError = v.error;
    } else {
      const loaded = this.loadBaseline(o.baselinePath);
      baseline = loaded.baseline;
      baselineError = loaded.baselineError;
    }
    const current = normalize(surface);

    const out = {
      source: baseline ? 'injected' : 'no_baseline',
      groups: 0,
      entries: current.entries,
      baselineGroups: baseline ? (Array.isArray(baseline.groupOrder) ? baseline.groupOrder.length : Object.keys(baseline.groups || {}).length) : 0,
      baselineEntries: baseline && typeof baseline.entries === 'number' ? baseline.entries : 0,
      baselineDigest: baseline ? baseline.digest : null,
      digest: current.digest,
      digestMatch: !!(baseline && baseline.digest === current.digest),
      healthy: false,
      changed: false,
      issues: [],
      byKind: {},
      byGroup: {},
      kinds: {
        groupRemoved: [], surfaceRemoved: [], compositeRemoved: [],
        groupAdded: [], surfaceAdded: [], compositeAdded: [],
      },
      checkedAt: Date.now(),
      note: '对外能力面形状对账：归一化当前 routes()+CAPABILITY_GROUPS 与落盘基线逐组逐条比；healthy 只由减少类（severity≥70）决定，changed 单独回答「形状变没变」',
    };
    if (baselineError) out.baselineError = baselineError;

    if (!baseline) {
      out.reason = baselineError || 'no_baseline';
      out.note = '没有可用的基线（文件不在/损坏/格式不认识）——不判 unchanged，也不判 drifted；先跑 action=record 落一份';
      return out;
    }

    const push = (kind, group, detail, extra) => {
      const issue = Object.assign({ kind, severity: SEV[kind], group, detail }, extra || {});
      out.issues.push(issue);
      out.byKind[kind] = (out.byKind[kind] || 0) + 1;
      out.byGroup[group] = out.byGroup[group] || {};
      out.byGroup[group][kind] = (out.byGroup[group][kind] || 0) + 1;
      // kinds 与 issues 必须同源同步（r258 踩坑①：只 push issues 会让上层读
      // kinds.length 恒报 0 而明细里躺着全部发现项）
      out.kinds[KIND_KEY[kind]].push(group);
    };

    const baseGroups = baseline.groups || {};
    const curGroups = current.groups || {};
    const universe = new Set([...Object.keys(baseGroups), ...Object.keys(curGroups)]);
    out.groups = universe.size;

    for (const g of universe) {
      const b = baseGroups[g] || null;
      const c = curGroups[g] || null;
      if (!b) {
        push('group_added', g, `对外能力面多出一组 ${g}（基线里没有，现值 ${c.methods.length} 条）`);
        continue;
      }
      if (!c) {
        push('group_removed', g, `整个能力组 ${g} 从对外能力面消失（基线 ${b.methods.length} 条，现值 0）——而 advertised 侧仍声明着它`);
        continue;
      }
      const bMethods = new Set(b.methods || []);
      const cMethods = new Set(c.methods || []);
      const bComp = new Set(b.composites || []);
      const cComp = new Set(c.composites || []);

      for (const m of cMethods) {
        if (!bMethods.has(m)) push('surface_added', g, `对外能力面新增 ${g}.${m}（基线没有）`, { method: m });
      }
      for (const m of bMethods) {
        if (!cMethods.has(m)) push('surface_removed', g, `对外能力面少了 ${g}.${m}（基线有、现值没有）——外部调用方按 heartflow_bridge_status 的 modules 盘点能力时它会消失`, { method: m });
      }
      for (const m of cComp) {
        if (!bComp.has(m)) push('composite_added', g, `composite 名单新增 ${g}.${m}（基线没有）`, { method: m });
      }
      for (const m of bComp) {
        if (!cComp.has(m)) push('composite_removed', g, `composite 名单少了 ${g}.${m}（基线有、现值没有）——原本宣传的 composite 能力不再可达`, { method: m });
      }
    }

    out.changed = out.issues.length > 0;
    out.healthy = !out.issues.some((i) => i.severity >= SEV.composite_removed);
    return out;
  }

  /**
   * 对账（compare 的别名出口，形状与 BridgeCapabilityChecker.check 对齐）。
   */
  check(surface, opts) { return this.compare(surface, opts); }

  /**
   * 基线元信息（不要求引擎在场）。
   */
  status(opts) {
    const loaded = this.loadBaseline(opts && opts.baselinePath);
    if (!loaded.baseline) {
      return {
        verdict: 'no-baseline', hasBaseline: false, baselineError: loaded.baselineError,
        path: loaded.path, checkedAt: Date.now(),
        note: '盘上没有可用基线——先跑 action=record 落一份，之后 compare 才有判据',
      };
    }
    const b = loaded.baseline;
    return {
      verdict: 'baseline-present',
      hasBaseline: true,
      path: loaded.path,
      recordedAt: b.recordedAt || null,
      digest: b.digest,
      groups: Array.isArray(b.groupOrder) ? b.groupOrder.length : Object.keys(b.groups || {}).length,
      groupOrder: Array.isArray(b.groupOrder) ? b.groupOrder : Object.keys(b.groups || {}).sort(),
      entries: typeof b.entries === 'number' ? b.entries : null,
      perGroup: Object.fromEntries(Object.entries(b.groups || {}).map(([g, v]) => [g, (v.methods || []).length])),
      checkedAt: Date.now(),
      note: '基线元信息；digest 只由成员名单决定（不含 recordedAt），同一份能力面跨进程重录 digest 必须相同',
    };
  }
}

module.exports = {
  BridgeCapabilitySnapshot,
  SEV,
  KIND_KEY,
  LOSS_KINDS,
  SNAPSHOT_FORMAT,
  DEFAULT_BASELINE_PATH,
  normalize,
};
