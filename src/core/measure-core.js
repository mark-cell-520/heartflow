'use strict';

/**
 * measure-core.js — 数字记账的唯一测量实现 [v6.8.96 第 741 轮]
 *
 * 为什么写它（r741 事故复盘，全部实测坐实）：
 *   AGENTS.md 设计原则 #5「Honest numbers」靠两个脚本守着：
 *   scripts/measure-claimed-numbers.js（对外打印实测）与
 *   scripts/sync-doc-numbers.js（把实测写进四份文档）。
 *   r741 轮初复测交接簿候选池①，实测同一台机器上：
 *
 *     $ node scripts/measure-claimed-numbers.js
 *     判别维度数（dimensions 键实测）: 0     ← 维度
 *     ALLOWED_ROUTES 路由数        : 0      ← 路由
 *     _modules 模块数              : 0      ← 模块
 *
 *     $ node scripts/sync-doc-numbers.js   （同一表达式，另一份实现）
 *     实测：MCP 工具 190 个 / 路由 1314 条 / 模块 161 个 / 维度 160 个
 *
 *   **同一个 discriminate('neutral baseline text').dimensions 键数，两个入口
 *   两个结果。** 直接复现子进程，根因一句话：
 *
 *     Error: Cannot find module 'C:UsersUSER782663...srcheartflow-skillrcindex.js'
 *
 *   measure-claimed-numbers.js 把 Windows 绝对路径**直接插进** `require('…')`
 *   的单引号字面量：反斜杠在子进程**解析**那份 `-e` 源码时被当转义序列吃掉
 *   （\U→U、\s→s、\i→i、\n→换行）→ MODULE_NOT_FOUND。而三处 `catch (_) {}`
 *   / `|| 0` 把「测量失败」洗成「实测为 0」——一个量不到的数字与一个真的 0
 *   在输出里长得一模一样，正是 AGENTS.md 第 18 行点名的那把尺子。
 *
 *   sync-doc-numbers.js 的同一表达式是对的，只因为它用 JSON.stringify 拼路径。
 *   test/doc-numbers-accuracy.test.js 也是对的，只因为它 .replace(/\\/g,'/')。
 *   **三份实现、三种拼路径的写法、两种结果**——这不是三个 bug，是一个 bug
 *   被复制了三份。
 *
 * 本模块把三处实现合成一处，并加两道 r741 之前谁都没有的闸：
 *   ① 路径一律经 _lit()（JSON.stringify + 正斜杠）后才进子进程源码；
 *   ② **量不到就拒绝，不许洗成 0**：runtime 四个数任一缺失或 ≤0 即 ok:false，
 *      调用方（记账脚本 / 门禁测试 / MCP）必须放弃，而不是拿 0 去比文档。
 *
 * 刻意不进 _modules（同 mutation-guard）：一进就撬动模块数 161→162 与
 * ALLOWED_ROUTES 基线 1314，而 round-606/608/609/614/615 等 15+ 个测试把
 * 161/1314 当硬断言钉着。一个纯测量件不该为它改一屋子基线。
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

/** 相对 rootPath 的受测文件（集中一处，改路径只改这里） */
const REL = {
  index: path.join('src', 'index.js'),
  engine: path.join('src', 'core', 'heartflow.js'),
  registry: path.join('src', 'mcp', 'tools-registry.js'),
  extended: path.join('src', 'mcp', 'extended-tools.js'),
  server: path.join('src', 'mcp-server.js'),
  data: 'data',
  test: 'test',
};

/** 三层动作集合（AGENTS.md 的 block / rewrite / verify 分档） */
const TIERS = ['BLOCK_DIMS', 'REWRITE_DIMS', 'VERIFY_DIMS'];

/** 子进程等引擎 start() 生成完动态路由的时间（实测 ~1s，留 4s 余量） */
const START_WAIT_MS = 4000;

/** 子进程超时（engine start + 4s 等待，给足） */
const CHILD_TIMEOUT_MS = 120000;

/** countSrcFiles 排除的目录名 */
const SRC_SKIP_DIRS = ['node_modules', '.git', 'archive', 'data', 'models', 'formulas-corpus', 'dict-data'];

// ── 全量回归用例数缓存：文件名与 scope 常量 ────────────────────
/** 全量口径缓存（唯一被文档记账信任的文件；r412 起仍是 git 跟踪的例外项） */
const TEST_COUNT_FILE = 'test-count.json';
/** 切片口径侧车（HF_RUN_ALL_SLICE 分段回归的数字落这里，不进文档记账） */
const TEST_COUNT_SLICE_FILE = 'test-count-slice.json';
const SCOPE_FULL = 'full';
const SCOPE_SLICE = 'slice';

/**
 * 读主缓存并判口径。返回体自带 `trusted`：只有 scope=full 的文件才允许
 * 被记账路径采信。
 *
 * 旧缓存（r743 之前写的）没有 scope 字段 —— 按 full 处理：那一整个时期的
 * 语义就是「run-all.js 跑完写下的数字」，而 run-all.js 在那时只被全量调用
 * 过（分段是 v6.8.86 才加的 env 开关，且从未有人约定它可以覆写缓存）。
 * 这条向后兼容只对**存量文件**有效；从 r743 起写入方一律带 scope。
 */
function readTestCountFile(dataDir) {
  const file = path.join(dataDir, TEST_COUNT_FILE);
  let j = null;
  try {
    if (fs.existsSync(file)) j = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) { j = null; }
  if (!j || typeof j !== 'object') {
    return {
      file, exists: false, scope: null, slice: null,
      passed: null, failed: null, total: null, files: null, at: null,
      trusted: false, reason: '无 data/' + TEST_COUNT_FILE + ' 缓存或不可解析',
    };
  }
  const scope = j.scope === SCOPE_SLICE ? SCOPE_SLICE : SCOPE_FULL;
  const passed = Number.isFinite(j.passed) ? j.passed : null;
  const failed = Number.isFinite(j.failed) ? j.failed : null;
  const total = Number.isFinite(j.total)
    ? j.total
    : (passed !== null ? passed + (failed || 0) : null);
  return {
    file,
    exists: true,
    scope,
    slice: typeof j.slice === 'string' ? j.slice : null,
    passed,
    failed,
    total,
    files: Number.isFinite(j.files) ? j.files : null,
    at: typeof j.at === 'string' ? j.at : null,
    trusted: scope === SCOPE_FULL,
    reason: scope === SCOPE_FULL
      ? null
      : 'data/' + TEST_COUNT_FILE + ' 是切片口径（scope=slice'
        + (typeof j.slice === 'string' ? ', slice=' + j.slice : '')
        + '）—— 分段回归不许覆写全量缓存，记账路径拒绝采信',
  };
}

/**
 * 写缓存，按 scope 分流文件。**切片绝不写主缓存**，这是 r742 事故的根因修法。
 * 返回 { file, scope, wrote } 供调用方打印落点。
 */
function writeTestCount(dataDir, entry) {
  const at = (entry && entry.at) || new Date().toISOString();
  const passed = Number(entry.passed) || 0;
  const failed = Number(entry.failed) || 0;
  const base = { passed, failed, total: passed + failed, at };
  if (Number.isFinite(entry.files)) base.files = entry.files;
  const isSlice = entry.scope === SCOPE_SLICE;
  const file = path.join(dataDir, isSlice ? TEST_COUNT_SLICE_FILE : TEST_COUNT_FILE);
  const payload = isSlice
    ? Object.assign({}, base, { scope: SCOPE_SLICE, slice: entry.slice || null })
    : Object.assign({}, base, { scope: SCOPE_FULL });
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return { file, scope: isSlice ? SCOPE_SLICE : SCOPE_FULL, wrote: true };
}

class MeasureCore {
  constructor(opts = {}) {
    this.rootPath = opts.rootPath || process.cwd();
    this.silent = opts.silent !== false;
    this.startWaitMs = Number.isFinite(opts.startWaitMs) ? opts.startWaitMs : START_WAIT_MS;
    this.childTimeoutMs = Number.isFinite(opts.childTimeoutMs) ? opts.childTimeoutMs : CHILD_TIMEOUT_MS;
    this.neutralText = opts.neutralText || 'neutral baseline text';
  }

  // ── 内部工具 ────────────────────────────────────────────────

  _abs(rel) { return path.join(this.rootPath, rel); }

  _read(rel) { return fs.readFileSync(this._abs(rel), 'utf8'); }

  _exists(rel) { return fs.existsSync(this._abs(rel)); }

  /**
   * 把路径变成能安全嵌进 JS 源码字面量的形式 —— r741 事故的直接修法。
   * JSON.stringify 把 `\` 变 `\\`（子进程解析时还原成一个反斜杠），
   * 再把分隔符统一成正斜杠（Windows 两种都认）做第二道保险。
   * 旧写法 `${path.join(ROOT, 'src/index.js')}` 在 Windows 上必然被吃掉反斜杠。
   */
  _lit(p) {
    return JSON.stringify(String(p).split(path.sep).join('/'));
  }

  /** 递归数 .js 文件；skip 里的目录名整棵跳过 */
  _walkJs(dir, skip) {
    let out = [];
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (skip && skip.includes(e.name)) continue;
        out = out.concat(this._walkJs(p, skip));
      } else if (e.name.endsWith('.js')) {
        out.push(p);
      }
    }
    return out;
  }

  /** 从 stdout 里捞最后一个 JSON 行（引擎启动日志会先打印一堆文本） */
  _parseJsonLine(stdout, marker) {
    let found = null;
    for (const line of String(stdout || '').split('\n')) {
      const i = line.indexOf(marker);
      if (i >= 0) {
        try { found = JSON.parse(line.slice(i)); } catch (_) { /* 继续找下一行 */ }
      }
    }
    return found;
  }

  // ── ① 运行时实测：一次子进程量四个数 ──────────────────────

  /**
   * 起一个子进程 start() 引擎，实测 tools / routes / modules / dims。
   * 返回 { ok:false, reason, stderrTail } 而不是 { …: 0 } —— 量不到就必须
   * 看起来像量不到（r741 之前三处 catch 把失败洗成 0，就是靠这个骗过所有守卫）。
   */
  measureRuntime() {
    const t0 = Date.now();
    const prog = [
      'const {HeartFlow}=require(' + this._lit(this._abs(REL.engine)) + ');',
      'const hf=new HeartFlow({dataDir:' + this._lit(this._abs(REL.data)) + ',silent:true});',
      'hf.start();',
      'setTimeout(()=>{',
      '  const reg=require(' + this._lit(this._abs(REL.registry)) + ');',
      '  const {discriminate}=require(' + this._lit(this._abs(REL.index)) + ');',
      '  const dk=Object.keys(discriminate(' + this._lit(this.neutralText) + ').dimensions||{});',
      '  console.log(JSON.stringify({',
      '    tools:new Set(reg.TOOLS.map(x=>x.name)).size,',
      '    routes:HeartFlow.ALLOWED_ROUTES.size,',
      '    modules:Object.keys(hf._modules||{}).length,',
      '    dims:dk.length, dimNames:dk}));',
      '  process.exit(0)},',
      String(this.startWaitMs) + ');',
    ].join('\n');

    let r;
    try {
      r = cp.spawnSync('node', ['-e', prog], { encoding: 'utf8', timeout: this.childTimeoutMs });
    } catch (e) {
      return { ok: false, reason: '子进程启动失败: ' + e.message, elapsedMs: Date.now() - t0 };
    }
    if (r.error) {
      return { ok: false, reason: '子进程错误: ' + r.error.message, elapsedMs: Date.now() - t0 };
    }
    const d = this._parseJsonLine(r.stdout, '{"tools":');
    const elapsedMs = Date.now() - t0;
    if (!d) {
      return {
        ok: false,
        reason: '子进程未返回 {"tools": …}（status=' + r.status + ' signal=' + r.signal + '）',
        stderrTail: String(r.stderr || '').split('\n').slice(-6).join('\n'),
        elapsedMs,
      };
    }
    // 四个数任一缺失或 ≤0 → 拒绝。0 只在「引擎真的一个模块都没有」时才是合法值，
    // 而那种状态下整个引擎已经不可用，此时拿 0 去比对文档只会产出错误的「漂移」结论。
    const bad = [];
    if (!Number.isFinite(d.tools) || d.tools <= 0) bad.push('tools=' + d.tools);
    if (!Number.isFinite(d.routes) || d.routes <= 0) bad.push('routes=' + d.routes);
    if (!Number.isFinite(d.modules) || d.modules <= 0) bad.push('modules=' + d.modules);
    if (!Number.isFinite(d.dims) || d.dims <= 0) bad.push('dims=' + d.dims);
    if (bad.length) {
      return {
        ok: false,
        reason: '运行时实测缺失或为零（拒绝记账，不洗成合法值）: ' + bad.join(', '),
        stderrTail: String(r.stderr || '').split('\n').slice(-6).join('\n'),
        elapsedMs,
      };
    }
    return {
      ok: true,
      tools: d.tools,
      routes: d.routes,
      modules: d.modules,
      dims: d.dims,
      dimNames: Array.isArray(d.dimNames) ? d.dimNames : [],
      elapsedMs,
    };
  }

  // ── ② 静态口径：读源码可判定的数 ──────────────────────────

  /** 三层动作集合大小（BLOCK/REWRITE/VERIFY_DIMS 的字面量成员个数） */
  countTiers() {
    let idx;
    try { idx = this._read(REL.index); } catch (e) {
      return { ok: false, reason: '读不到 src/index.js: ' + e.message };
    }
    const out = { ok: true };
    for (const label of TIERS) {
      const m = idx.match(new RegExp('const ' + label + ' = new Set\\(\\[([\\s\\S]*?)\\]\\)'));
      out[label.toLowerCase()] = m ? ((m[1].match(/['"][a-z_]+['"]/g) || []).length) : 0;
    }
    out.tiersSum = out.block_dims + out.rewrite_dims + out.verify_dims;
    return out;
  }

  /**
   * 静态口径的工具数：tools-registry.js 的 name: + extended-tools.js 的
   * "name":（JSON 序列化产物，键名带引号）。[AUDIT-FIX 2026-10-11] 起必须
   * 并入 extended——旧实现只 grep 主表得 68，真实 tools/list 返回 154。
   */
  countToolsStatic() {
    const names = new Set();
    try {
      for (const m of this._read(REL.registry).matchAll(/name:\s*['"](heartflow_[a-z0-9_]+)['"]/g)) names.add(m[1]);
    } catch (_) { /* 主表读不到时降级，不阻断 */ }
    if (this._exists(REL.extended)) {
      try {
        for (const m of this._read(REL.extended).matchAll(/['"]?name['"]?\s*:\s*['"](heartflow_[a-z0-9_]+)['"]/g)) names.add(m[1]);
      } catch (_) { /* extended 缺失时降级为主表，不阻断测量 */ }
    }
    return names.size;
  }

  /** HANDLERS 映射表的键数（src/mcp-server.js 顶层两空格缩进的 heartflow_*:） */
  countHandlers() {
    let srv;
    try { srv = this._read(REL.server); } catch (e) { return { ok: false, reason: e.message, count: 0 }; }
    const hStart = srv.indexOf('const HANDLERS');
    if (hStart < 0) return { ok: false, reason: 'src/mcp-server.js 里找不到 const HANDLERS', count: 0 };
    const hb = srv.slice(hStart, srv.indexOf('\n};', hStart));
    const keys = new Set();
    for (const m of hb.matchAll(/^\s{2}(heartflow_[a-z0-9_]+):/gm)) keys.add(m[1]);
    return { ok: true, count: keys.size };
  }

  /** 测试文件数（test/ 递归，*.test.js 或 *-test.js） */
  countTestFiles() {
    const walk = d => {
      let out = [];
      let entries;
      try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return out; }
      for (const e of entries) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) out = out.concat(walk(p));
        else if (e.name.endsWith('.test.js') || e.name.endsWith('-test.js')) out.push(e.name);
      }
      return out;
    };
    return walk(this._abs(REL.test)).length;
  }

  // ── ② 全量回归用例数缓存：scope 纪律 ─────────────────────────

  /**
   * [v6.8.98 第 743 轮] 缓存文件的 scope 契约（**写入方与读取方的单一来源**）。
   *
   * r742 实测事故（交接簿候选池①，非推测）：`HF_RUN_ALL_SLICE=565/625` 跑完
   * 分段回归后跑 `node scripts/sync-doc-numbers.js`，README/SKILL 的规格表
   * 被记成「48 passing / 0 failing」——而真值是 19,993 passing / 25 failing。
   * 根因：run-all.js 汇总段**无条件**把本次数字写进 data/test-count.json，
   * 切片回归只跑了 1/625 的文件，数字天然小一个量级；而 sync-doc-numbers
   * 经 readTestCount() 读那个文件时，没有任何字段能告诉它「这是切片」。
   *
   * 修法是一处：缓存带 scope 标记，且**写入时就分流**——
   *   · scope=full → data/test-count.json（唯一被文档记账信任的文件）
   *   · scope=slice → data/test-count-slice.json（侧车，只给人看）
   * 切片回归从此**不碰**全量缓存， readTestCount() 再对 scope=slice 的主缓存
   * 拒绝采信（纵深：万一有人手工把切片数字写回主缓存，记账路径宁可不出数）。
   *
   * 为什么放在 src/ 而不是 test/_xxx.js：读取方 measure-core（src/）不能
   * require test/ 下的模块（npm 发包只含 src/，见 package.json files），
   * 而写入方是 test/run-all.js —— test → src 是正常依赖方向。
   * r739 的教训（判定与契约必须同一份代码）在这里同样成立：判 scope 的
   * 逻辑只有这一份，runner 与所有记账方共用。
   */
  readTestCount() {
    const r = readTestCountFile(path.join(this.rootPath, REL.data));
    // 旧口径：passed 取不到（无文件 / 0 / 非法）＝ 未测量，与 0 区分开
    if (!r.exists || !r.passed) {
      return { passed: null, failed: null, at: null, scope: null, files: null };
    }
    if (!r.trusted) {
      // 纵深：主缓存里躺着切片口径的数字 → 记账路径拒绝采信，不洗成可用值
      return { passed: null, failed: null, at: r.at, scope: r.scope, files: null, refused: r.reason };
    }
    return {
      passed: r.passed,
      failed: Number.isFinite(r.failed) ? r.failed : 0,
      at: r.at,
      scope: r.scope,
      files: r.files,
    };
  }

  /** 读 guard-abilities.js 自己落盘的缓存（本模块不跑那个 105s 的脚本） */
  readCapabilityCount() {
    const cf = this._abs(path.join(REL.data, 'capability-check-count.json'));
    try {
      if (!fs.existsSync(cf)) return { checks: null, passed: null };
      const j = JSON.parse(fs.readFileSync(cf, 'utf8'));
      if (!j.checks) return { checks: null, passed: null };
      return { checks: j.checks, passed: j.passed };
    } catch (_) {
      return { checks: null, passed: null };
    }
  }

  /** src/ 下 .js 文件数（排除 corpus / 数据目录） */
  countSrcFiles() {
    return this._walkJs(this._abs('src'), SRC_SKIP_DIRS).length;
  }

  /** 版本戳动态读 VERSION，不硬编码（硬编码会让每个看输出的人以为是很久以前跑的） */
  readVersion() {
    try { return fs.readFileSync(this._abs('VERSION'), 'utf8').trim() || 'unknown'; }
    catch (_) { return 'unknown'; }
  }

  // ── ③ 汇总 ─────────────────────────────────────────────────

  /**
   * 一次量清全部对外宣称的数字。runtime 量不到直接抛——
   * 与 sync-doc-numbers.js 既有的「量不到就拒绝记账」同一条纪律：
   * 宁可不记，也不记错。
   */
  measureAll() {
    const rt = this.measureRuntime();
    if (!rt.ok) {
      const err = new Error('运行时实测拒绝出数: ' + rt.reason
        + (rt.stderrTail ? '\n' + rt.stderrTail : ''));
      err.measure = rt;
      throw err;
    }
    const tiers = this.countTiers();
    if (!tiers.ok) {
      const err = new Error('tier 计数拒绝出数: ' + tiers.reason);
      err.tiers = tiers;
      throw err;
    }
    const handlers = this.countHandlers();
    const tests = this.readTestCount();
    const capability = this.readCapabilityCount();

    // 一致性闸：三层合计不可能超过总维度数（149 ≤ 160）。
    // 这条 invariant 破了说明 dimensions 键与 tier 集合已经对不上，
    // 此时任何一个数字都不能信。
    const consistent = rt.dims >= tiers.tiersSum;
    const out = {
      version: this.readVersion(),
      tools: rt.tools,
      toolsStatic: this.countToolsStatic(),
      handlers: handlers.count,
      routes: rt.routes,
      modules: rt.modules,
      dims: rt.dims,
      dimNames: rt.dimNames,
      block: tiers.block_dims,
      rewrite: tiers.rewrite_dims,
      verify: tiers.verify_dims,
      tiersSum: tiers.tiersSum,
      tiersRest: rt.dims - tiers.tiersSum,
      testFiles: this.countTestFiles(),
      testCases: tests.passed,
      testCasesFailed: tests.failed,
      testCountAt: tests.at,
      testCountScope: tests.scope,
      testCountFiles: tests.files,
      testCountRefused: tests.refused || null,
      capabilityChecks: capability.checks,
      capabilityPassed: capability.passed,
      srcFiles: this.countSrcFiles(),
      consistent,
      consistencyNote: consistent ? null
        : 'dims(' + rt.dims + ') < tiersSum(' + tiers.tiersSum + ') —— dimensions 键与 tier 集合已对不上',
      elapsedMs: rt.elapsedMs,
    };
    if (!consistent) {
      const err = new Error(out.consistencyNote);
      err.measure = out;
      throw err;
    }
    return out;
  }

  // ── ④ 文档对照：宣称的数字 vs 实测 ────────────────────────

  /**
   * 从三份对外文档里抽出横幅宣称的四个头条数字，与实测逐项比对。
   * r739/r741 两轮事故都是「文档里的数字和引擎实际不符」，而没有任何
   * 一道门禁在**非记账时刻**回答这个问题——本方法把它变成一次调用。
   *
   * opts.actual：调用方手里已有的一份实测（如 measureAll() 的结果）时直接
   * 传入，省掉一次 5 秒级的子进程；不传则本方法自己实测。
   */
  checkDocs(opts = {}) {
    const claims = [];
    const grab = (file, re, keys) => {
      let src;
      try { src = this._read(file); } catch (e) { return; }
      const m = src.match(re);
      if (!m) return;
      const o = { file };
      keys.forEach((k, i) => { o[k] = Number(String(m[i + 1]).replace(/,/g, '')); });
      claims.push(o);
    };
    // AGENTS.md：**Zero LLM dependency.** 160 dimensions, 161 modules, 190 MCP tools, 1,314 dispatch routes.
    grab('AGENTS.md', /\*\*Zero LLM dependency\.\*\*\s+([\d,]+) dimensions,\s+([\d,]+) modules,\s+([\d,]+) MCP tools,\s+([\d,]+)\s+dispatch/,
      ['dims', 'modules', 'tools', 'routes']);
    // README.md：160 discrimination dimensions  ×  11-layer pipeline  ×  161 modules  ×  190 MCP tools
    grab('README.md', /([\d,]+) discrimination dimensions\s*×\s*[\d]+-layer pipeline\s*×\s*([\d,]+) modules\s*×\s*([\d,]+) MCP tools/,
      ['dims', 'modules', 'tools']);
    // SKILL.md：160 discrimination dimensions × 11-layer pipeline × 161 modules ×\n  190 MCP tools.
    grab('SKILL.md', /([\d,]+) discrimination dimensions\s*×\s*[\d]+-layer pipeline\s*×\s*([\d,]+) modules\s*×\s*([\d,]+) MCP tools/,
      ['dims', 'modules', 'tools']);

    if (!claims.length) {
      return { ok: false, reason: '三份文档里一条横幅都没匹配到（形状变了？先改这里再信数字）', claims, drift: [] };
    }
    let actual = opts.actual || null;
    if (!actual) {
      const rt = this.measureRuntime();
      if (!rt.ok) {
        return { ok: false, reason: '拒绝对照（实测不可信）: ' + rt.reason, claims, drift: [] };
      }
      actual = { dims: rt.dims, modules: rt.modules, tools: rt.tools, routes: rt.routes };
    }
    const drift = [];
    for (const c of claims) {
      for (const k of Object.keys(actual)) {
        if (!(k in c)) continue;
        if (c[k] !== actual[k]) {
          drift.push({ file: c.file, key: k, claimed: c[k], actual: actual[k] });
        }
      }
    }
    return { ok: drift.length === 0, claims, actual, drift };
  }

  // ── ⑤ MCP 汇总 ─────────────────────────────────────────────

  /** 给 MCP 工具用的轻量汇总：静态口径 + 缓存，不起子进程 */
  status() {
    const tiers = this.countTiers();
    const handlers = this.countHandlers();
    const tests = this.readTestCount();
    return {
      version: this.readVersion(),
      static: {
        tools: this.countToolsStatic(),
        handlers: handlers.count,
        block: tiers.block_dims,
        rewrite: tiers.rewrite_dims,
        verify: tiers.verify_dims,
        tiersSum: tiers.tiersSum,
        testFiles: this.countTestFiles(),
        srcFiles: this.countSrcFiles(),
      },
      cached: {
        testCases: tests.passed,
        testCasesFailed: tests.failed,
        testCountAt: tests.at,
        testCountScope: tests.scope,
        testCountRefused: tests.refused || null,
        capabilityChecks: this.readCapabilityCount().checks,
      },
      note: 'static/cached 都是读源码与缓存，毫秒级；runtime 四个数（tools/routes/modules/dims）'
        + ' 要起子进程 start() 引擎，用 action: runtime / all / check',
    };
  }
}

module.exports = {
  MeasureCore, REL, TIERS, START_WAIT_MS, CHILD_TIMEOUT_MS, SRC_SKIP_DIRS,
  TEST_COUNT_FILE, TEST_COUNT_SLICE_FILE, SCOPE_FULL, SCOPE_SLICE,
  readTestCountFile, writeTestCount,
};
