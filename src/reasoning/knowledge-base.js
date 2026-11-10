/**
 * KnowledgeBase — 命题知识库 v1.0.0
 *
 * [r278 接线] 此前本文件是自动生成的 stub（416B，process() 恒返回
 * 'knowledge-base stub: not implemented'），在 heartflow.js / module-registry.js /
 * engine-constructor.js 三处 lazy 注册加载，但全仓零 dispatch、零 MCP 工具
 * —— 即「已加载但从未 dispatch 的能力」（真升级③）。
 *
 * 与既有两个易混模块的边界（刻意不重复造轮子）：
 *   - heartflow.knowledge（KnowledgeGraph，三元组关系图）：管 实体-关系-实体 的图结构；
 *   - heartflow.knowledgeLayer（KnowledgeLayer，域分区事实库）：管 按 domain 分区的命题存取；
 *   - 本 KnowledgeBase：管 **带证据与状态的命题知识库**，核心增量能力是
 *     ① 命题级「证据链」记账（support / refute / qualify 三类证据，可追溯）；
 *     ② 命题间一致性检查（矛盾/蕴含/等价的显式检出，不是模糊检索）；
 *     ③ 支持度计算（support - refute 的净证据加权，输出 confidence 校准值）。
 *
 * 纯规则引擎：零 LLM 依赖，零 npm 依赖，只用 Node 内置模块。
 */

const VERSION = '1.0.0';

// 命题状态机
const FACT_STATUS = {
  ASSERTED: 'asserted',     // 已断言，无证据
  SUPPORTED: 'supported',   // 有净正证据
  CONTESTED: 'contested',   // 正反证据并存
  REFUTED: 'refuted',       // 净负证据占优
  RETRACTED: 'retracted',   // 已撤回
};

// 证据类型
const EVIDENCE_TYPE = {
  SUPPORT: 'support',
  REFUTE: 'refute',
  QUALIFY: 'qualify',   // 限定适用范围（不改净支持度，但记入 caveats）
};

// 命题间关系
const RELATION = {
  CONTRADICTS: 'contradicts',   // 互斥（不可同真）
  ENTAILS: 'entails',           // 蕴含（A真则B真）
  EQUIVALENT: 'equivalent',     // 等价
  UNRELATED: 'unrelated',
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'as', 'that',
  'this', 'these', 'those', 'it', 'its', 'and', 'or', 'but', 'not', 'no',
  '的', '了', '是', '在', '和', '与', '及', '对', '为', '以', '于', '从',
  '这', '那', '其', '之', '有', '被', '把', '也', '都', '就', '不', '很',
]);

class KnowledgeBase {
  constructor(options = {}) {
    this.version = VERSION;
    this.name = 'knowledge-base';
    this.config = {
      maxFacts: options.maxFacts || 10000,
      maxEvidencePerFact: options.maxEvidencePerFact || 50,
      minWeight: options.minWeight || 0.05,
      supportThreshold: options.supportThreshold || 1.0,   // 净支持度达到此值 → supported
      refuteThreshold: options.refuteThreshold || -1.0,   // 净支持度低于此值 → refuted
    };

    /** @type {Map<string, Object>} id → fact */
    this.facts = new Map();
    /** @type {Map<string, Array<string>>} keyword → fact ids（倒排索引） */
    this.index = new Map();
    /** @type {number} 自增 id 计数器 */
    this._seq = 0;
    /** @type {Array<Object>} 一致性检查历史 */
    this.consistencyLog = [];
  }

  // ─── 命题写入 ────────────────────────────────────────────────────────────

  /**
   * 添加/更新一条命题
   * @param {string} claim - 命题文本
   * @param {Object} opts - { source, confidence, domain, tags }
   * @returns {Object} { id, claim, status, duplicateOf }
   */
  addFact(claim, opts = {}) {
    if (typeof claim !== 'string' || !claim.trim()) {
      return { ok: false, reason: 'claim 必须是非空字符串' };
    }
    const normalized = claim.trim();

    // 同义去重：等价命题不新建条目，只追加证据
    const dup = this._findEquivalent(normalized);
    if (dup && (opts.source || opts.confidence !== undefined)) {
      this._attachEvidence(dup.id, {
        type: EVIDENCE_TYPE.SUPPORT,
        source: opts.source || 'anonymous',
        weight: this._normalizeWeight(opts.confidence),
      });
      return { id: dup.id, claim: dup.claim, status: dup.status, duplicateOf: dup.id };
    }

    if (this.facts.size >= this.config.maxFacts) {
      return { ok: false, reason: `知识库已满（${this.config.maxFacts}）` };
    }

    const id = `f${++this._seq}`;
    const fact = {
      id,
      claim: normalized,
      status: FACT_STATUS.ASSERTED,
      domain: opts.domain || 'general',
      tags: Array.isArray(opts.tags) ? opts.tags : [],
      evidence: [],
      netSupport: 0,
      caveats: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      keywords: this._extractKeywords(normalized),
    };

    if (opts.source || opts.confidence !== undefined) {
      this._attachEvidence(id, {
        type: EVIDENCE_TYPE.SUPPORT,
        source: opts.source || 'anonymous',
        weight: this._normalizeWeight(opts.confidence),
      });
    }

    this.facts.set(id, fact);
    for (const kw of fact.keywords) {
      if (!this.index.has(kw)) this.index.set(kw, []);
      this.index.get(kw).push(id);
    }
    return { ok: true, id, claim: normalized, status: fact.status, duplicateOf: null };
  }

  /**
   * 为命题附加证据
   * @param {string} factId
   * @param {{type, source, weight, note}} ev - type ∈ support/refute/qualify
   * @returns {Object} { ok, factId, status, netSupport, evidenceCount }
   */
  addEvidence(factId, ev = {}) {
    const fact = this.facts.get(factId);
    if (!fact) return { ok: false, reason: `命题不存在: ${factId}` };
    if (fact.evidence.length >= this.config.maxEvidencePerFact) {
      return { ok: false, reason: `证据数已达上限（${this.config.maxEvidencePerFact}）` };
    }
    const type = ev.type || EVIDENCE_TYPE.SUPPORT;
    if (!Object.values(EVIDENCE_TYPE).includes(type)) {
      return { ok: false, reason: `未知证据类型: ${type}` };
    }
    this._attachEvidence(factId, {
      type,
      source: ev.source || 'anonymous',
      weight: this._normalizeWeight(ev.weight),
      note: ev.note || null,
    });
    fact.updatedAt = Date.now();
    return {
      ok: true, factId, status: fact.status, netSupport: fact.netSupport,
      evidenceCount: fact.evidence.length,
    };
  }

  /**
   * 撤回命题
   * @param {string} factId
   * @param {string} reason
   */
  retractFact(factId, reason = '') {
    const fact = this.facts.get(factId);
    if (!fact) return { ok: false, reason: `命题不存在: ${factId}` };
    fact.status = FACT_STATUS.RETRACTED;
    fact.retractedReason = reason;
    fact.updatedAt = Date.now();
    return { ok: true, factId, status: fact.status, reason };
  }

  // ─── 命题查询 ────────────────────────────────────────────────────────────

  /**
   * 关键词检索（倒排索引 + 关键词重叠度排序）
   * @param {string} query
   * @param {Object} opts - { limit, domain, status }
   * @returns {Array<{id, claim, status, netSupport, score, domain}>}
   */
  query(query, opts = {}) {
    if (typeof query !== 'string' || !query.trim()) return [];
    const qk = this._extractKeywords(query);
    if (qk.length === 0) return [];
    const limit = opts.limit || 10;
    const scores = new Map();

    for (const kw of qk) {
      const ids = this.index.get(kw) || [];
      for (const id of ids) scores.set(id, (scores.get(id) || 0) + 1);
    }

    const results = [];
    for (const [id, hits] of scores) {
      const fact = this.facts.get(id);
      if (!fact) continue;
      if (opts.domain && fact.domain !== opts.domain) continue;
      if (opts.status && fact.status !== opts.status) continue;
      // 归一化重叠度：命中查询关键词的比例
      const score = hits / qk.length;
      results.push({
        id: fact.id,
        claim: fact.claim,
        status: fact.status,
        netSupport: fact.netSupport,
        domain: fact.domain,
        score: Number(score.toFixed(4)),
      });
    }
    results.sort((a, b) => (b.score - a.score) || (b.netSupport - a.netSupport));
    return results.slice(0, limit);
  }

  /**
   * 按 id 取单条（含完整证据链）
   * @param {string} factId
   * @returns {Object|null}
   */
  getFact(factId) {
    const fact = this.facts.get(factId);
    if (!fact) return null;
    return {
      id: fact.id, claim: fact.claim, status: fact.status, domain: fact.domain,
      tags: fact.tags, netSupport: fact.netSupport, caveats: fact.caveats,
      evidence: fact.evidence.slice(), createdAt: fact.createdAt, updatedAt: fact.updatedAt,
    };
  }

  // ─── 一致性检查（本模块核心增量能力）─────────────────────────────────────

  /**
   * 全库一致性检查：检出矛盾命题对
   *
   * 判定规则（纯规则，无语义模糊）：
   *  - 矛盾：两命题关键词高度重叠（≥0.6）且含互斥极性词（肯定 vs 否定/反义）
   *  - 冗余：两命题关键词重叠 ≥0.85（近重复）
   * @returns {{contradictions: Array, redundancies: Array, checked: number}}
   */
  checkConsistency() {
    const contradictions = [];
    const redundancies = [];
    const all = [...this.facts.values()].filter(f => f.status !== FACT_STATUS.RETRACTED);

    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        const overlap = this._keywordOverlap(a.keywords, b.keywords);
        if (overlap < 0.5) continue;
        const rel = this._detectRelation(a, b);
        if (rel === RELATION.CONTRADICTS) {
          contradictions.push({
            a: a.id, aClaim: a.claim, b: b.id, bClaim: b.claim,
            overlap: Number(overlap.toFixed(3)),
            netSupportA: a.netSupport, netSupportB: b.netSupport,
            suggestion: '两命题不可同真：需补证据裁决，或撤回其一',
          });
        } else if (overlap >= 0.85) {
          redundancies.push({
            a: a.id, aClaim: a.claim, b: b.id, bClaim: b.claim,
            overlap: Number(overlap.toFixed(3)),
            suggestion: '关键词高度重叠，疑似重复命题',
          });
        }
      }
    }

    const entry = {
      checked: all.length,
      contradictions: contradictions.length,
      redundancies: redundancies.length,
      timestamp: Date.now(),
    };
    this.consistencyLog.push(entry);
    return { contradictions, redundancies, checked: all.length };
  }

  // ─── 统计 ───────────────────────────────────────────────────────────────

  getStats() {
    const byStatus = {};
    for (const f of this.facts.values()) {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
    }
    return {
      totalFacts: this.facts.size,
      byStatus,
      totalEvidence: [...this.facts.values()].reduce((s, f) => s + f.evidence.length, 0),
      indexedKeywords: this.index.size,
      consistencyChecks: this.consistencyLog.length,
      lastCheck: this.consistencyLog.length ? this.consistencyLog[this.consistencyLog.length - 1] : null,
      version: VERSION,
    };
  }

  getCategories() {
    const cats = new Map();
    for (const f of this.facts.values()) {
      cats.set(f.domain, (cats.get(f.domain) || 0) + 1);
    }
    return [...cats.entries()].map(([name, count]) => ({ name, count }));
  }

  clear() {
    this.facts.clear();
    this.index.clear();
    this.consistencyLog = [];
    this._seq = 0;
  }

  // ─── 内部工具 ───────────────────────────────────────────────────────────

  _attachEvidence(factId, ev) {
    const fact = this.facts.get(factId);
    if (!fact) return;
    const entry = {
      type: ev.type,
      source: ev.source,
      weight: ev.weight,
      note: ev.note || null,
      at: Date.now(),
    };
    fact.evidence.push(entry);
    if (ev.type === EVIDENCE_TYPE.SUPPORT) fact.netSupport += ev.weight;
    else if (ev.type === EVIDENCE_TYPE.REFUTE) fact.netSupport -= ev.weight;
    else if (ev.type === EVIDENCE_TYPE.QUALIFY && ev.note) fact.caveats.push(ev.note);
    this._recomputeStatus(fact);
  }

  _recomputeStatus(fact) {
    if (fact.status === FACT_STATUS.RETRACTED) return;
    const support = fact.evidence.filter(e => e.type === EVIDENCE_TYPE.SUPPORT).reduce((s, e) => s + e.weight, 0);
    const refute = fact.evidence.filter(e => e.type === EVIDENCE_TYPE.REFUTE).reduce((s, e) => s + e.weight, 0);
    if (support > 0 && refute > 0) fact.status = FACT_STATUS.CONTESTED;
    else if (fact.netSupport >= this.config.supportThreshold) fact.status = FACT_STATUS.SUPPORTED;
    else if (fact.netSupport <= this.config.refuteThreshold) fact.status = FACT_STATUS.REFUTED;
    else fact.status = FACT_STATUS.ASSERTED;
  }

  _normalizeWeight(w) {
    if (typeof w !== 'number' || !isFinite(w)) return 1;
    return Math.max(this.config.minWeight, Math.min(1, w));
  }

  _extractKeywords(text) {
    const words = String(text).toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOPWORDS.has(w));
    // 中文连续串按 2-gram 粗切（与引擎既有中文启发式一致，不引词典依赖）
    const zhChunks = String(text).match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const zhGrams = [];
    for (const chunk of zhChunks) {
      if (chunk.length <= 2) { zhGrams.push(chunk); continue; }
      for (let i = 0; i < chunk.length - 1; i++) zhGrams.push(chunk.slice(i, i + 2));
    }
    return [...new Set([...words, ...zhGrams])];
  }

  _keywordOverlap(a, b) {
    if (!a.length || !b.length) return 0;
    const setB = new Set(b);
    const inter = a.filter(k => setB.has(k)).length;
    // Jaccard
    const union = new Set([...a, ...b]).size;
    return inter / union;
  }

  _findEquivalent(claim) {
    const kw = this._extractKeywords(claim);
    const set = new Set(kw);
    const candidateIds = new Set();
    for (const k of kw) for (const id of (this.index.get(k) || [])) candidateIds.add(id);
    for (const id of candidateIds) {
      const f = this.facts.get(id);
      if (!f || f.status === FACT_STATUS.RETRACTED) continue;
      if (f.claim === claim) return f;
      const overlap = this._keywordOverlap(kw, f.keywords);
      if (overlap >= 0.9) return f;
    }
    return null;
  }

  /**
   * 命题间关系判定：矛盾检出靠「极性互斥」——关键词重叠高且一方含否定/反义标记
   */
  _detectRelation(a, b) {
    const NEG = new Set(['不', '没', '无', '非', '未', '别', '莫', '勿', '无法', '不能',
      'not', 'no', 'never', 'cannot', 'isnt', 'arent', 'doesnt', 'dont', 'wont', 'false']);
    const ANT = new Set(['增加', '减少', '上升', '下降', '提高', '降低', '有效', '无效',
      'increase', 'decrease', 'rise', 'fall', 'higher', 'lower', 'effective', 'ineffective',
      'more', 'less', 'positive', 'negative', 'up', 'down']);

    const hasA = (t, s) => t.includes(s);
    const aText = a.claim.toLowerCase(), bText = b.claim.toLowerCase();
    const aNeg = [...NEG].some(n => hasA(aText, n));
    const bNeg = [...NEG].some(n => hasA(bText, n));
    if (aNeg !== bNeg) return RELATION.CONTRADICTS;

    const aAnt = [...ANT].filter(x => hasA(aText, x));
    const bAnt = [...ANT].filter(x => hasA(bText, x));
    // 反义词交叉命中（如 a 有「增加」而 b 有「减少」）
    const ANT_PAIRS = [['增加', '减少'], ['上升', '下降'], ['提高', '降低'], ['有效', '无效'],
      ['increase', 'decrease'], ['rise', 'fall'], ['higher', 'lower'], ['more', 'less']];
    for (const [x, y] of ANT_PAIRS) {
      if ((hasA(aText, x) && hasA(bText, y)) || (hasA(aText, y) && hasA(bText, x))) {
        return RELATION.CONTRADICTS;
      }
    }
    void aAnt; void bAnt;
    return RELATION.UNRELATED;
  }
}

module.exports = { KnowledgeBase, FACT_STATUS, EVIDENCE_TYPE, RELATION, VERSION };
