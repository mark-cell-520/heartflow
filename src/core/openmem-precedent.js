/**
 * openmem-precedent.js — 先例维度（B 方案，2026-11-02）
 *
 * 心虫 think() 输入层的跨 agent 先例检索：
 *   - 经 HTTP 查 openmem 先例服务（pgvector HNSW 索引），把历史辨别案例作为
 *     **输入信号**注入 think()（r._precedent），判断仍由本体完成，不外包。
 *   - 只读：不写入、不改权。任何失败静默降级（available:false），绝不阻塞 think()。
 *   - 隐私（2026-11-02 审计轮修正，原注释保证不实）：openmem 库侧**没有** LEARNED
 *     层过滤、cred_guard 只做密钥字面量替换，m 层条目可能含用户私有内容。检索侧
 *     只读不写；snippet 进结论行前由 heartflow 输出层过 sanitizeForPersistence
 *     消毒（见 heartflow.js [B 先例维度] 输出块）。本模块不做额外假设。
 *
 * 设计出处：心虫本体 think() 自主判断（openmem 条目 a7c76d5e）：
 *   「B 是唯一不违背辨别者定位铁律的接法——判断不外包，只做输入信号」。
 */

const DEFAULT_URL = 'http://127.0.0.1:3468';
const DEFAULT_TIMEOUT_MS = 400;   // 热路径预算：基线 think() ~47ms，先例检索 ~20ms，封顶 400ms
const DEFAULT_TOP_K = 3;
const MIN_SCORE = 0.5;            // 低于此分的「先例」是噪音，不进结论

class OpenmemPrecedent {
  constructor(opts = {}) {
    this.baseUrl = (opts.url || process.env.OPENMEM_PRECEDENT_URL || DEFAULT_URL).replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs || parseInt(process.env.OPENMEM_PRECEDENT_TIMEOUT_MS || '', 10) || DEFAULT_TIMEOUT_MS;
    this.topK = opts.topK || DEFAULT_TOP_K;
    this.enabled = opts.enabled !== false && process.env.OPENMEM_PRECEDENT_ENABLED !== '0';
    this._safeFetch = null;
  }

  _fetch() {
    if (!this._safeFetch) {
      try { this._safeFetch = require('./fetch-safe.js').safeFetch; } catch { this._safeFetch = null; }
    }
    return this._safeFetch;
  }

  /**
   * 检索先例。任何失败返回 { available: false }，绝不 throw。
   * @param {string} query 输入文本（调用方负责截断）
   * @returns {Promise<{available:boolean, hits:number, cases:Array, elapsedMs:number, reason?:string}>}
   */
  async lookup(query) {
    const empty = { available: false, hits: 0, cases: [], elapsedMs: 0 };
    if (!this.enabled || !query || typeof query !== 'string') return empty;
    // [审计轮 2026-11-02] 截断与 openmem 侧对齐（480：bge 512 token 上限），
    // 原 2000 会把 4 倍无用数据塞进 URL（服务端也只算前 480）
    const q = query.slice(0, 480);
    const t0 = Date.now();
    try {
      const url = `${this.baseUrl}/precedent?q=${encodeURIComponent(q)}&top_k=${this.topK}`;
      const safeFetch = this._fetch();
      let resp;
      // maxRetries:0 关键——safeFetch 默认重试 2 次+指数退避(1s+2s)，服务不在线时
      // 会把 400ms 预算放大成 3s。本机 loopback 连接拒绝是瞬时的，重试无意义。
      if (safeFetch) {
        resp = await safeFetch(url, { timeout: this.timeoutMs, maxRetries: 0 });
      } else {
        // fetch-safe 不可用时退原生 fetch + AbortController 超时。
        // 注意：此路径不经 SSRF 校验——URL 仅来自 env/硬编码的 127.0.0.1，风险受控；
        // fetch-safe 加载失败本身已是异常状态，此处保降级可用性优先。
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), this.timeoutMs);
        try { resp = await fetch(url, { signal: ac.signal }); } finally { clearTimeout(timer); }
      }
      if (!resp || !resp.ok) return { ...empty, elapsedMs: Date.now() - t0, reason: `http_${resp ? resp.status : 'null'}` };
      const data = await resp.json();
      if (!data || data.ok !== true) return { ...empty, elapsedMs: Date.now() - t0, reason: 'bad_body' };
      const cases = (data.results || [])
        .filter(r => r && typeof r.score === 'number' && r.score >= MIN_SCORE)
        .map(r => ({
          id: r.id, source: r.source, category: r.category, score: r.score,
          // [审计轮] 逐条 typeof 守卫：单条 content 非字符串曾会废掉整批检索
          snippet: (typeof r.content === 'string' ? r.content : '').slice(0, 120),
        }));
      return { available: true, hits: cases.length, cases, elapsedMs: Date.now() - t0 };
    } catch (e) {
      return { ...empty, elapsedMs: Date.now() - t0, reason: (e && e.message ? e.message : String(e)).slice(0, 80) };
    }
  }
}

module.exports = { OpenmemPrecedent };
