'use strict';

/**
 * mutation-guard.js — 回归突变期互斥 + 突变残留完整收底 [v6.8.95 第 740 轮]
 *
 * 为什么写它（r739 事故复盘，全部实测坐实）：
 *   轮次协议第 5 步跑 scripts/sync-doc-numbers.js 记文档数字，第 7 步跑
 *   test/run-all.js 全量回归。两者本来不该同时在场，但**没有任何机制保证**：
 *     · run-all.js 的单例锁（data/.run-all.lock）只拦「另一个 run-all」，
 *       记账脚本完全不看它；
 *     · 回归的串行车道里有 76 个变更测试，其中一整族（reward-hacking-*）
 *       是**原地删条突变**：
 *         fs.writeFileSync(SRC, stripped)      // src/reward-hacking.js 被删段
 *         try { … } finally { fs.writeFileSync(SRC, original) }
 *       SIGKILL 不可捕获，finally 不跑 → 源文件永久留在删条态。
 *   r739 实测形态正是这条链：src/reward-hacking.js 少 103 行、
 *   src/core/heartflow.js 少 32 行，而 sync-doc-numbers.js 的 measure()
 *   在突变窗口内起了子进程 require 那份被删条的 heartflow.js →
 *   模块数 161→157、路由 1314→1264，**错数字被写进 AGENTS.md / README.md /
 *   SKILL.md / package.json**。当时误判为「sync-doc-numbers.js 会删源码」，
 *   r740 轮初复测证明它只写那 4 份文档、实测 161/1314 零 src/ 写入——
 *   真正的因是「测量与突变期没有互斥」。
 *
 * 三个能力（都是机器可判定的，不占 LLM 迭代预算）：
 *   ① guardMeasurement(label) —— 记账前问一句「现在是不是突变期」。
 *      回归在飞就拒绝记账（宁可不记也不记错），与 sync-doc-numbers.js
 *      既有的「量不到就拒绝记账」同一条纪律。
 *   ② snapshot(dirs) / rollback(snap) —— 比 run-all.js 原实现多两件事：
 *      · 覆盖面从「只有 src/」扩到 src/ + test/ + 仓库根顶层（实测突变落点
 *        有三块：src/round-448-mutant-*.js、仓库根 .mut-488-*.js、
 *        test/.tmp-mutant-r507-*.js，原快照只盖第一块）；
 *      · **删掉快照外新增的残留文件**（原实现只还原「内容被改的」，
 *        新增的一个不删 —— r739 实测留下 7 个未跟踪残留就是这个洞）。
 *   ③ auditResidue() —— 只读扫一遍三块地盘，报出突变残族文件及其年龄。
 *
 * [v6.8.97 第 742 轮] 第四个能力：④ attributeFlight() —— 锁归属归因。
 *   r741 全量回归实测 round-740 测试的 F2「无回归在飞」在作为 run-all.js
 *   子进程跑时必现失败（单独跑 46/46 绿、挂进回归 45/46 红）。根因不是
 *   断言写错，是它把两件事混成一句：「没有锁」与「没有**外来**回归」。
 *   run-all.js 从 acquireSingleton 起就全程持锁写自己的 PID，所以
 *   「作为它的子进程跑」时锁必然在——F2 问错了问题。attributeFlight()
 *   把锁里的 PID 归因成 none / self / ancestor / foreign 四态，让轮次自检
 *   能只说它真正想说的那句。**inFlight 语义一字未改**：祖先持锁时仍在飞、
 *   记账闸照样拒绝，否则就是把 r739 的洞重新打开。
 *
 * 删除的两道闸（缺一不可，都是 r740 实测踩出来的）：
 *   · 形状闸：basename 必须以 round-<N>-mutant- / .mut- / .tmp-mutant- 开头。
 *     只按「mutant-」这种宽形状匹配会咬到**已入库**的测试驱动
 *     （test/round-434-mutant-runner.js、scripts/round-327/mutant-driver.js 等
 *     9 个，实测命中）——那是正常文件不是残留。
 *   · 新鲜度闸：mtime 必须不早于快照时刻。已入库文件 mtime 旧，本轮新写的
 *     突变体 mtime 新。两道闸同时满足才删，否则只报不删。
 */

const fs = require('fs');
const path = require('path');

/** 全量回归单例锁（run-all.js 写 PID，见该文件 acquireSingleton） */
const LOCK_REL = path.join('data', '.run-all.lock');

/**
 * [v6.8.97 第 742 轮] run-all.js 注入测试子进程的祖先标记。
 * env 会随 execFile 传给所有后代进程，所以它能标出「链路上任何一层的 runner」，
 * 而 process.ppid 只看得到直接父进程——两者互补，缺一个都有漏认的场景。
 */
const RUNNER_ENV = 'HF_RUN_ALL_PID';

/** 祖先链最长回溯层数（防 PID 环 / 异常进程表死循环） */
const MAX_ANCESTORS = 32;

/** 突变残族形状：basename 前缀，锚定在文件名开头（宽匹配会咬到已入库驱动） */
const RESIDUE_RE = /^(?:round-\d+-mutant-|\.mut-|\.tmp-mutant-)/;

/** 突变落点的三块地盘（相对 rootPath）；'.' 只扫顶层，避免走全仓库 */
const DEFAULT_DIRS = ['src', 'test', '.'];

/** 新鲜度闸的时钟偏斜容差（ms） */
const SKEW_MS = 2000;

class MutationGuard {
  constructor(opts = {}) {
    this.rootPath = opts.rootPath || process.cwd();
    this.silent = opts.silent !== false;
    this.residueDirs = Array.isArray(opts.residueDirs) && opts.residueDirs.length
      ? opts.residueDirs.slice()
      : DEFAULT_DIRS.slice();
    this.lockRel = opts.lockRel || LOCK_REL;
  }

  // ── 内部工具 ────────────────────────────────────────────────

  _abs(rel) { return path.join(this.rootPath, rel); }

  _rel(p) { return path.relative(this.rootPath, p).split(path.sep).join('/'); }

  /** 收集 .js 文件；shallow=true 时只看目录顶层（仓库根用，避免走全仓库） */
  _walkJs(dir, out, shallow) {
    out = out || [];
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (shallow) continue;
        if (e.name === 'node_modules' || e.name === '.git') continue;
        this._walkJs(p, out, false);
      } else if (e.name.endsWith('.js')) {
        out.push(p);
      }
    }
    return out;
  }

  _read(abs) {
    try { return fs.readFileSync(abs, 'utf8'); } catch (e) { return null; }
  }

  _mtime(abs) {
    try { return fs.statSync(abs).mtimeMs; } catch (e) { return 0; }
  }

  // ── ① 突变期探活 ───────────────────────────────────────────

  _pidAlive(pid) {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  }

  lockPath() { return this._abs(this.lockRel); }

  /**
   * 我自己的祖先 PID 链（含直接父进程）。跨平台零外部依赖：
   *   · 第一层来自 process.ppid（Node 内建，Linux / Windows 一致）；
   *   · 更深层来自 run-all.js 注入的 HF_RUN_ALL_PID —— Node 没有
   *     「任意 PID 的父 PID」API，而 env 会一路传给所有后代进程，
   *     所以一个标记就能覆盖任意深度的子孙。
   * 去重 + 上限保护：PID 环（理论上的 ppid 自指）不会死循环。
   */
  _parentPids() {
    const out = [];
    const seen = new Set([process.pid]);
    let p = Number.isInteger(process.ppid) ? process.ppid : 0;
    while (p > 0 && !seen.has(p) && out.length < MAX_ANCESTORS) {
      seen.add(p);
      out.push(p);
      p = 0; // Node 无法再往上走一层，交给 env 标记补
    }
    const marked = parseInt((process.env && process.env[RUNNER_ENV]) || '', 10);
    if (Number.isInteger(marked) && marked > 0 && !seen.has(marked)) out.push(marked);
    return out;
  }

  /**
   * 全量回归是否在飞。判据与 run-all.js 的 acquireSingleton 同源：
   * 锁文件里的 PID 探活。锁文件残留但 PID 已死 → 不在飞（不留死锁）。
   */
  isRegressionInFlight() {
    let pid = null;
    try {
      if (!fs.existsSync(this.lockPath())) return { inFlight: false, pid: null, reason: '无锁文件' };
      pid = parseInt(this._read(this.lockPath()) || '', 10);
    } catch (e) {
      return { inFlight: false, pid: null, reason: '锁文件读失败: ' + e.message };
    }
    if (!Number.isInteger(pid) || pid <= 0) {
      return { inFlight: false, pid: null, reason: '锁文件无合法 PID' };
    }
    if (pid === process.pid) {
      return { inFlight: false, pid, reason: '锁里的 PID 就是自己' };
    }
    if (!this._pidAlive(pid)) {
      return { inFlight: false, pid, reason: `锁记录 PID ${pid} 已死，视为残留锁` };
    }
    return { inFlight: true, pid, reason: `全量回归在飞（锁 PID ${pid}），源码可能处于删条突变态` };
  }

  /**
   * [v6.8.97 第 742 轮] 锁归属归因：锁里的那个活 PID 与「我」是什么关系。
   *
   * 为什么需要它（r741 全量回归实测的存量结构性 flake）：
   *   round-740 测试的 F2 断言「轮次自检时不该有锁」，在作为 run-all.js 的
   *   子进程跑时**必然为假**——父 runner 从 acquireSingleton 起就全程持有
   *   data/.run-all.lock 并写自己的 PID，而 isRegressionInFlight() 的
   *   「锁里是自己不算在飞」只覆盖测试进程自己写锁，覆盖不到「锁里是父 runner」。
   *   r741 实测：单独跑 46/46 全绿，挂进全量回归 45/46 红一次。
   *   F2 真正想说的不是「没有锁」，而是「没有**外来**回归在飞」——
   *   锁握在自己祖先链上是 run-all 的正常工作方式，无关活进程持锁才是问题。
   *
   * relation 五态：
   *   none     没有锁 / 锁里是死 PID / 锁文件无合法 PID
   *   self     锁里的 PID 就是自己（自己是 runner）
   *   ancestor 锁里的 PID 在自己的祖先链上（自己是 run-all 的子进程）
   *   foreign  锁里是别的活进程（真·外来回归，或残留锁的 PID 被复用）
   *
   * **注意 relation === 'ancestor' 时 inFlight 仍为 true。** 容忍祖先只改
   * 「轮次自检该不该红」，不改守卫的保护语义：祖先 runner 是真的在跑全量回归，
   * 源码此刻可能正处于删条突变态，guardMeasurement() 照样拒绝记账。
   * r742 测试 E3/G2 两条断言钉死这个方向——放松它就会重开 r739 那个洞。
   */
  attributeFlight() {
    const base = this.isRegressionInFlight();
    const ancestors = this._parentPids();
    if (!base.inFlight) {
      return Object.assign({}, base, {
        relation: base.pid === process.pid ? 'self' : 'none',
        ancestors,
      });
    }
    return Object.assign({}, base, {
      relation: ancestors.indexOf(base.pid) >= 0 ? 'ancestor' : 'foreign',
      ancestors,
    });
  }

  /**
   * 记账闸：突变期一律拒绝测量。
   * 返回 { ok, reason, pid }；ok=false 时调用方必须**放弃记账**而不是记错。
   */
  guardMeasurement(label) {
    const st = this.isRegressionInFlight();
    if (!st.inFlight) return { ok: true, reason: st.reason, pid: st.pid, label: label || null };
    return {
      ok: false,
      pid: st.pid,
      label: label || null,
      reason: `拒绝记账（${label || '未标注'}）：${st.reason}——此刻测量会量到被删条的源码，`
        + 'r739 实测就这样把模块数 161 记成 157、路由 1314 记成 1264。'
        + '等回归跑完再记，宁可不记也不记错。',
    };
  }

  // ── ② 快照 / 回滚（比 run-all.js 原实现多「删新增残留」） ────

  /** 对若干目录做 .js 全文快照；dirs 省略时用 residueDirs */
  snapshot(dirs) {
    const list = Array.isArray(dirs) && dirs.length ? dirs : this.residueDirs;
    const snap = new Map();
    for (const d of list) {
      const shallow = d === '.' || d === './';
      for (const p of this._walkJs(this._abs(d), [], shallow)) {
        const c = this._read(p);
        if (c !== null) snap.set(p, c);
      }
    }
    // 回滚要知道「当初扫了哪些地盘」，否则新增文件扫描会漏/会扫错
    Object.defineProperty(snap, 'dirs', { value: list.slice(), enumerable: false });
    Object.defineProperty(snap, 'takenAt', { value: Date.now(), enumerable: false });
    return snap;
  }

  /**
   * 回滚：还原内容被改的 + 删掉快照外新增的突变残族文件。
   * 返回 { restored: [], removed: [], keptNew: [] }。
   * keptNew = 新增但不满足两道闸的 .js（只报不删，防误删新模块/已入库驱动）。
   */
  rollback(snap) {
    const out = { restored: [], removed: [], keptNew: [] };
    if (!snap || typeof snap.forEach !== 'function') return out;
    const dirs = snap.dirs || this.residueDirs;
    const takenAt = Number.isFinite(snap.takenAt) ? snap.takenAt : 0;
    const seen = new Set();
    for (const [p, content] of snap) {
      seen.add(path.resolve(p));
      const cur = this._read(p);
      if (cur === null) { out.restored.push(this._rel(p) + '（文件已不存在，无法还原）'); continue; }
      if (cur !== content) {
        try { fs.writeFileSync(p, content); out.restored.push(this._rel(p)); } catch (e) { /* 交给 guard 报 */ }
      }
    }
    for (const d of dirs) {
      const shallow = d === '.' || d === './';
      for (const p of this._walkJs(this._abs(d), [], shallow)) {
        const abs = path.resolve(p);
        if (seen.has(abs)) continue;
        const base = path.basename(p);
        if (RESIDUE_RE.test(base) && this._mtime(p) >= takenAt - SKEW_MS) {
          try { fs.unlinkSync(p); out.removed.push(this._rel(p)); } catch (e) { /* 只读失败不抛 */ }
        } else {
          out.keptNew.push(this._rel(p));
        }
      }
    }
    return out;
  }

  // ── ③ 残留审计（只读） ─────────────────────────────────────

  /** 扫三块地盘，报出突变残族文件及其年龄（小时）。
   *  按年龄分两桶：suspicious = 48 小时内（可能是某次被杀的回归留下的真残留）、
   *  known = 更早（已入库的测试驱动，实测 test/round-434-mutant-{child,runner}.js
   *  两个就是这种，git ls-files 能查到，不能当残留删）。 */
  auditResidue() {
    const now = Date.now();
    const suspicious = [];
    const known = [];
    const seen = new Set();
    for (const d of this.residueDirs) {
      const shallow = d === '.' || d === './';
      for (const p of this._walkJs(this._abs(d), [], shallow)) {
        const base = path.basename(p);
        if (!RESIDUE_RE.test(base)) continue;
        const rel = this._rel(p);
        if (seen.has(rel)) continue;
        seen.add(rel);
        const ageHours = Math.round(((now - this._mtime(p)) / 36e5) * 10) / 10;
        const item = { path: rel, ageHours };
        if (ageHours <= 48) suspicious.push(item); else known.push(item);
      }
    }
    suspicious.sort((a, b) => a.path.localeCompare(b.path));
    known.sort((a, b) => a.path.localeCompare(b.path));
    return { count: suspicious.length + known.length, suspicious, known };
  }

  /** 侧车备份残留（data/.mutation-guard 下已 arm 的 .bak） */
  auditSidecar() {
    const dir = this._abs(path.join('data', '.mutation-guard'));
    const files = [];
    try {
      for (const e of fs.readdirSync(dir)) {
        if (e.endsWith('.bak') && !e.endsWith('.pid.bak')) files.push(e);
      }
    } catch (err) { /* 没有侧车就是没有残留 */ }
    return { count: files.length, files: files.sort() };
  }

  /** 汇总状态（MCP 只读工具与轮次自检用） */
  status() {
    const flight = this.attributeFlight();
    const residue = this.auditResidue();
    const sidecar = this.auditSidecar();
    return {
      rootPath: this.rootPath,
      regression: flight,
      residue,
      sidecar,
      residueDirs: this.residueDirs,
      clean: !flight.inFlight && residue.suspicious.length === 0,
    };
  }
}

module.exports = { MutationGuard, RESIDUE_RE, DEFAULT_DIRS, LOCK_REL, RUNNER_ENV, MAX_ANCESTORS };
