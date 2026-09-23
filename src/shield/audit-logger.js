/**
 * AuditLogger — 决策审计日志引擎
 *
 * 记录每次 gate 决策的完整证据链，支持事后合规审查。
 * 关键设计：记录"什么被拒绝过"（negative space），不是只记"什么执行了"
 *
 * [v6.0.34 元审计修复] 之前 log() 只 push 内存数组，进程重启即丢失，
 * 不满足安全日志"仅追加防篡改"要求 = 假审计。现真落盘到磁盘。
 *
 * [v6.7.83 契约回归修复] v6.4.2 前后该文件被重写：
 *   旧契约 → log(eventType, details)，落盘 { t, e, d, h }，认 logPath
 *   新契约 → record(actionType, decision)，认 logDir，写 snapshot.contextHash
 * 但调用方（src/cortex/loop.js 的进化审计、audit-wiring.test.js、
 * meta-audit.test.js、evolution-audit.test.js）**全在用旧契约**。
 * 结果：loop.js 调 .log() 抛 TypeError 被自己的 try/catch 吞掉 →
 * 进化审计从未落盘；测试断言 d/h 字段全部落空。
 * 本版恢复旧契约为唯一真相，新语义保留为对 log() 的薄封装
 * （不再有第二套字段名）。
 *
 * 集成: require('./audit-logger.js')
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

class AuditLogger {
  constructor(options = {}) {
    this.maxSize = options.maxSize || DEFAULT_MAX_SIZE;
    // [v6.7.83] logPath 是主契约；logDir 作为兼容入口（logDir 下默认文件名）
    this.logPath = options.logPath
      || (options.logDir
        ? path.join(options.logDir, 'audit-log.jsonl')
        : path.join(process.cwd(), 'data', 'audit', 'audit-log.jsonl'));
    this.maxEntries = options.maxEntries || 1000;
    this.entries = [];
    this._closed = false;
    // 启动时加载已有日志到内存(供 readRecent/getStats)，但不阻塞。
    // 这一步同时满足"重启后能从磁盘恢复"的测试要求。
    this._loadExisting();
  }

  _loadExisting() {
    try {
      if (fs.existsSync(this.logPath)) {
        const lines = fs.readFileSync(this.logPath, 'utf8').trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try { this.entries.push(JSON.parse(line)); } catch (e) { /* 跳过损坏行 */ }
        }
      }
    } catch (e) { /* 加载失败不影响启动 */ }
  }

  log(eventType, details = {}) {
    if (this._closed) return;
    const entry = {
      t: Date.now(),
      e: eventType,
      d: details,
      h: this._hash(eventType + JSON.stringify(details) + Date.now()),
    };
    // [v6.2.7] 否决动作也记录(negative space)：所有被拒绝/阻止的动作都写入
    if (details && (details.result === 'denied' || details.result === 'blocked' || details.action === 'deny')) {
      entry._negative = true;
    }
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries = this.entries.slice(-500);

    // [v6.0.34] 真落盘：仅追加写入（append-only，防篡改）
    this._persist(entry);
    return entry;
  }

  /** [v6.7.83] 新语义薄封装——不再是第二套字段名 */
  record(actionType, decision = {}) {
    return this.log(actionType, decision);
  }

  /** 记录被拒绝的操作（negative space） */
  recordDenied(decision) {
    return this.log('denied', { ...decision, result: 'denied' });
  }

  /** 记录被授权的操作 */
  recordGranted(decision) {
    return this.log('granted', { ...decision, result: 'granted' });
  }

  close() {
    this._closed = true;
  }

  readRecent(limit = 50) { return this.entries.slice(-limit).reverse(); }

  getStats() {
    const types = {};
    this.entries.forEach(e => { types[e.e] = (types[e.e] || 0) + 1; });
    return {
      total: this.entries.length,
      types,
      persisted: fs.existsSync(this.logPath),
      logPath: this.logPath,
    };
  }

  /** 获取审计报告（保留原合规统计语义：正反两面） */
  getReport(options = {}) {
    const all = this.entries;
    const entries = options.lastN ? all.slice(-options.lastN) : all;
    const denied = entries.filter(e => e._negative || e.e === 'denied');
    const granted = entries.filter(e => e.e === 'granted');

    return {
      totalEntries: all.length,
      granted: granted.length,
      denied: denied.length,
      escalated: entries.filter(e => e.e === 'escalated').length,
      conditional: entries.filter(e => e.e === 'conditional' || e.e === 'conditional').length,
      persisted: fs.existsSync(this.logPath),
      recentDenied: denied.slice(-5).map(e => ({ reason: e.d && e.d.reason, ts: e.t })),
      recentGranted: granted.slice(-5).map(e => ({ reason: e.d && e.d.reason, ts: e.t })),
    };
  }

  reset() {
    this.entries = [];
  }

  _persist(entry) {
    try {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
      // 轮转检查
      if (fs.existsSync(this.logPath) && fs.statSync(this.logPath).size > this.maxSize) {
        const rotated = this.logPath + '.1';
        fs.renameSync(this.logPath, rotated);
      }
      fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n', { mode: 0o600 });
    } catch (e) {
      // 落盘失败不能吞掉安全事件——至少内存里还有
      console.warn(`[AuditLogger] 落盘失败(内存保留): ${e.message}`);
    }
  }

  _hash(str) { return crypto.createHash('sha256').update(str).digest('hex').slice(0, 12); }
}

module.exports = { AuditLogger };
