/**
 * Engram-style conditional memory (DeepSeek V4.1 alignment)
 *
 * Minimal implementation:
 * - store(traces): append sparse memory traces
 * - recall(tag, limit): conditionally retrieve recent traces by tag
 * - forgetStale(): remove expired entries by TTL
 */

const fs = require('fs');
const path = require('path');

class EngramMemory {
  constructor(opts = {}) {
    this.maxEntries = opts.maxEntries || 200;
    this.ttlMs = opts.ttlMs || 30 * 60 * 1000;
    this.indexPath = opts.indexPath || path.join(process.cwd(), 'data', 'engram-index.json');
    this._entries = [];
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.indexPath)) {
        const raw = fs.readFileSync(this.indexPath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) this._entries = data;
      }
    } catch (_) { this._entries = []; }
  }

  _persist() {
    try {
      fs.mkdirSync(path.dirname(this.indexPath), { recursive: true });
      fs.writeFileSync(this.indexPath, JSON.stringify(this._entries.slice(-this.maxEntries)));
    } catch (_) { /* non-critical */ }
  }

  store(traces = []) {
    if (!Array.isArray(traces)) return 0;
    const now = Date.now();
    for (const t of traces) {
      if (!t || typeof t !== 'object') continue;
      this._entries.push({ ...t, ts: t.ts || now });
    }
    this._prune();
    this._persist();
    return traces.length;
  }

  recall(tag = 'general', limit = 3) {
    const now = Date.now();
    const out = [];
    for (let i = this._entries.length - 1; i >= 0; i--) {
      const e = this._entries[i];
      if (now - (e.ts || 0) > this.ttlMs) continue;
      if (e.tag && tag && tag !== 'general' && e.tag !== tag) continue;
      out.push(e);
      if (out.length >= limit) break;
    }
    return out.reverse();
  }

  // [DeepSeek V4.1] SWA Bounded Replay: only replay recent window for a decision type
  recallByDecision(decisionType, limit = 3) {
    if (!decisionType || typeof decisionType !== 'string') return [];
    const now = Date.now();
    const out = [];
    for (let i = this._entries.length - 1; i >= 0; i--) {
      const e = this._entries[i];
      if (now - (e.ts || 0) > this.ttlMs) continue;
      if (e.decision !== decisionType) continue;
      out.push(e);
      if (out.length >= limit) break;
    }
    return out.reverse();
  }

  forgetStale() {
    const now = Date.now();
    const before = this._entries.length;
    this._entries = this._entries.filter(e => now - (e.ts || 0) <= this.ttlMs);
    const removed = before - this._entries.length;
    if (removed) this._persist();
    return removed;
  }

  _prune() {
    if (this._entries.length > this.maxEntries) {
      this._entries = this._entries.slice(this._entries.length - this.maxEntries);
    }
  }

  stats() {
    const now = Date.now();
    const byDecision = {};
    for (const e of this._entries) {
      if (e.decision) {
        byDecision[e.decision] = (byDecision[e.decision] || 0) + 1;
      }
    }
    return {
      total: this._entries.length,
      active: this._entries.filter(e => now - (e.ts || 0) <= this.ttlMs).length,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      byDecision,
    };
  }
}

module.exports = { EngramMemory };
