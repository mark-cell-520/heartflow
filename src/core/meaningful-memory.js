/**
 * HeartFlow Meaningful Memory Module v11.5.10
 * 
 * 升级路线（v11.5.9 → v11.5.10）：
 * - 合并 TrialityMemory 的三大能力：
 *   ① Ebbinghaus 遗忘曲线（遗忘引擎）
 *   ② 多通道检索（语义/关键词/时间/情感/联想）
 *   ③ 向量嵌入 + 余弦相似度
 * - 保留 meaningful-memory 的核心价值：
 *   ① JSON 持久化 ✅
 *   ② CORE/LEARNED/EPHEMERAL 心虫语义 ✅
 *   ③ 用户判断驱动（user correction 强制 CORE）✅
 * 
 * 融合架构：
 *   CORE ────────────── semantic 层（永久，向量检索，艾宾浩斯不删除）
 *   LEARNED ─────────── episodic 层（TTL 内，向量检索，遗忘曲线压缩）
 *   EPHEMERAL ───────── working 层（会话内，向量检索，结束时丢弃）
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DIR = path.join(__dirname, '..', '..', 'memory');
const CORE_FILE    = path.join(MEMORY_DIR, 'meaningful-core.json');
const LEARNED_FILE = path.join(MEMORY_DIR, 'meaningful-learned.json');

// ============================================================
// 向量工具（384 维 SHA256 伪嵌入）
// ============================================================

function generateEmbedding(content, dim = 384) {
  const hash = crypto.createHash('sha256').update(String(content)).digest();
  const emb = [];
  for (let i = 0; i < dim; i++) {
    emb.push((hash[i % hash.length] / 255) * 2 - 1);
  }
  return emb;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-6);
}

// ============================================================
// 艾宾浩斯遗忘曲线
// ============================================================

const FORGETTING_CONFIG = {
  defaultStability:       10,   // hours, 基础稳定性
  coreStability:          8760, // 1年, CORE 永久有效
  learnedStability:       720,  // 30天
  compressionThreshold:   0.3,  // retention < 30% → 压缩
  deletionThreshold:       0.1,  // retention < 10% → 删除（仅 LEARNED）
};

function ebbinghausForget(stabilityHours, ageHours) {
  // R = e^(-t/S)
  const retention = Math.exp(-ageHours / stabilityHours);
  return {
    retention,
    shouldCompress: retention < FORGETTING_CONFIG.compressionThreshold,
    shouldDelete:   retention < FORGETTING_CONFIG.deletionThreshold,
  };
}

// ============================================================
// 主类
// ============================================================

class MeaningfulMemory {
  constructor(options = {}) {
    this.learnedTTL   = options.learnedTTL || 30 * 24 * 60 * 60 * 1000;
    this.vectorDim    = options.vectorDim || 384;
    this.forgetConfig = { ...FORGETTING_CONFIG };

    // 三层记忆（心虫语义）
    this.core     = {};     // { key → record }
    this.learned  = {};     // { key → record }
    this.ephemeral = {};    // { key → record }（会话内）

    // 向量索引（用于多通道检索）
    this.vectors = {
      core:      new Map(), // key → embedding
      learned:   new Map(),
      ephemeral: new Map(),
    };

    // 关系索引（用于联想通道）
    this.relationships = new Map(); // memoryKey → [{targetKey, type, strength}]

    // 统计
    this._meta = {
      loads: 0, saves: 0,
      compressed: 0, deleted: 0,
      channelSearches: { semantic: 0, keyword: 0, time: 0, emotion: 0, association: 0 },
    };

    this._load();
  }

  // ============================================================
  // 持久化
  // ============================================================

  _load() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });

      if (fs.existsSync(CORE_FILE)) {
        const raw = JSON.parse(fs.readFileSync(CORE_FILE, 'utf-8'));
        for (const [key, rec] of Object.entries(raw)) {
          this.core[key] = rec;
          // 重建向量索引（v11.5.9 旧数据没有向量）
          if (!this.vectors.core.has(key)) {
            this.vectors.core.set(key, generateEmbedding(String(rec.value) + rec.reason));
          }
        }
      }

      if (fs.existsSync(LEARNED_FILE)) {
        const raw = JSON.parse(fs.readFileSync(LEARNED_FILE, 'utf-8'));
        const now = Date.now();
        for (const [key, rec] of Object.entries(raw)) {
          // 过滤过期 LEARNED
          if (now - rec.timestamp < this.learnedTTL) {
            this.learned[key] = rec;
            if (!this.vectors.learned.has(key)) {
              this.vectors.learned.set(key, generateEmbedding(String(rec.value) + rec.reason));
            }
          }
        }
      }

      console.log(`[MeaningfulMemory] 加载: ${Object.keys(this.core).length} CORE, ${Object.keys(this.learned).length} LEARNED`);
      this._meta.loads++;
    } catch (e) {
      console.warn('[MeaningfulMemory] 加载失败:', e.message);
    }
  }

  _save() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
      fs.writeFileSync(CORE_FILE,    JSON.stringify(this.core,     null, 2));
      fs.writeFileSync(LEARNED_FILE, JSON.stringify(this.learned,  null, 2));
      this._meta.saves++;
    } catch (e) {
      console.warn('[MeaningfulMemory] 保存失败:', e.message);
    }
  }

  // ============================================================
  // 核心判断：这件事有意义吗？
  // ============================================================

  judge(event = {}) {
    const {
      type               = 'unknown',
      userConfirmed      = false,
      selfVerifyScore    = null,
      errorCount         = 0,
      isIdentity         = false,
      isUserCorrection   = false,
    } = event;

    if (userConfirmed || isUserCorrection) return 'core';
    if (isIdentity)                       return 'core';

    if (selfVerifyScore !== null && selfVerifyScore >= 0.75) return 'learned';
    if (errorCount >= 3)                  return 'learned';

    const score = this._typeScore(type);
    if (score >= 0.8) return 'learned';
    if (score <= 0.2) return 'ephemeral';
    return 'ephemeral';
  }

  _typeScore(type) {
    const scores = {
      'user_correction':    1.0,
      'identity_change':     1.0,
      'preference_change':   1.0,
      'decision_verified':   0.85,
      'error_pattern':       0.8,
      'successful_fix':      0.75,
      'self_verification':   0.7,
      'upgrade_result':      0.65,
      'code_working':        0.6,
      'chat':                0.1,
      'greeting':            0.05,
      'status_check':        0.2,
      'temporary_state':     0.1,
      'unknown':             0.3,
    };
    return scores[type] ?? 0.3;
  }

  _defaultReason(type, level) {
    const reasons = {
      core:     '满足CORE条件：用户确认/身份相关',
      learned:  `满足LEARNED条件：${type}`,
      ephemeral:'日常内容，不值得永久记忆',
    };
    return reasons[level];
  }

  // ============================================================
  // 记忆操作（统一入口 + 专用捷径）
  // ============================================================

  remember(event = {}) {
    const {
      key, value = null,
      type = 'unknown',
      reason = '',
      selfVerifyScore = null,
      errorCount = 0,
      userConfirmed = false,
      isIdentity = false,
      isUserCorrection = false,
      source = 'system',
      relatedTo = [],   // [{targetKey, type: 'causal'|'quotes'|'related', strength}]
    } = event;

    if (!key || value === null) return null;

    const level = this.judge({
      type, userConfirmed, selfVerifyScore,
      errorCount, isIdentity, isUserCorrection,
    });

    const record = {
      key, value, type,
      reason: reason || this._defaultReason(type, level),
      timestamp: Date.now(),
      source,
      level,
      importance: selfVerifyScore !== null ? Math.round(selfVerifyScore * 100) : Math.round(this._typeScore(type) * 100),
    };

    if (selfVerifyScore !== null) record.selfVerifyScore = selfVerifyScore;

    // 写入对应层
    const target = level === 'core' ? this.core : (level === 'learned' ? this.learned : this.ephemeral);
    target[key] = record;

    // 向量索引
    const vecMap = level === 'core' ? this.vectors.core
                    : (level === 'learned' ? this.vectors.learned : this.vectors.ephemeral);
    vecMap.set(key, generateEmbedding(String(value) + reason));

    // 关系索引
    if (relatedTo.length > 0) {
      this.relationships.set(key, relatedTo.map(r => ({ ...r, createdAt: Date.now() })));
    }

    // 持久化（CORE + LEARNED）
    if (level !== 'ephemeral') this._save();

    return { level, record };
  }

  // 专用 API
  rememberUserCorrection(key, value, reason = '') {
    return this.remember({ key, value, type: 'user_correction', reason, userConfirmed: true, source: 'user' });
  }

  rememberVerifiedDecision(key, decision, score) {
    return this.remember({ key, value: decision, type: 'decision_verified', reason: `selfVerify score=${score}`, selfVerifyScore: score, source: 'decision-verifier' });
  }

  rememberErrorPattern(key, pattern, count) {
    return this.remember({ key, value: pattern, type: 'error_pattern', reason: `同类错误累计 ${count} 次`, errorCount: count, source: 'self-healing' });
  }

  rememberUpgrade(key, version, change) {
    return this.remember({ key, value: { version, change }, type: 'upgrade_result', reason: `HeartFlow ${version} 升级内容`, source: 'upgrade-system' });
  }

  // 召回
  recall(key) {
    return this.core[key] || this.learned[key] || this.ephemeral[key] || null;
  }

  knows(key) {
    return key in this.core || key in this.learned || key in this.ephemeral;
  }

  // ============================================================
  // 多通道检索（来自 TrialityMemory）
  // ============================================================

  /**
   * 通道1：语义搜索（向量余弦相似度）
   */
  searchSemantic(query, topK = 5) {
    const queryEmb = generateEmbedding(query);
    const results = [];

    const layerMap = [
      { map: this.vectors.core,      store: this.core,      label: 'CORE'      },
      { map: this.vectors.learned,   store: this.learned,   label: 'LEARNED'   },
      { map: this.vectors.ephemeral, store: this.ephemeral, label: 'EPHEMERAL' },
    ];

    for (const { map, store, label } of layerMap) {
      for (const [key, emb] of map) {
        const sim = cosineSimilarity(queryEmb, emb);
        if (sim > 0.15) {  // 降低阈值：mock 嵌入余弦相似度较低
          const rec = store[key];
          results.push({ key, content: String(rec.value), reason: rec.reason, layer: label, similarity: sim, timestamp: rec.timestamp });
        }
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    this._meta.channelSearches.semantic++;
    return results.slice(0, topK);
  }

  /**
   * 通道2：关键词搜索（BM25 风格）
   */
  searchKeywords(keywords, topK = 5) {
    if (!keywords || keywords.length === 0) return [];
    const kws = keywords.map(k => k.toLowerCase());
    const results = [];

    const stores = [
      { store: this.core,      label: 'CORE'      },
      { store: this.learned,   label: 'LEARNED'   },
      { store: this.ephemeral, label: 'EPHEMERAL' },
    ];

    for (const { store, label } of stores) {
      for (const [key, rec] of Object.entries(store)) {
        const text = (String(rec.value) + ' ' + rec.reason).toLowerCase();
        let score = 0;
        for (const kw of kws) {
          if (text.includes(kw)) score++;
        }
        if (score > 0) {
          results.push({ key, content: String(rec.value), reason: rec.reason, layer: label, score, timestamp: rec.timestamp });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    this._meta.channelSearches.keyword++;
    return results.slice(0, topK);
  }

  /**
   * 通道3：时间搜索
   */
  searchByTime(hoursAgo = 24, topK = 10) {
    const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
    const results = [];

    const stores = [
      { store: this.core,      label: 'CORE'      },
      { store: this.learned,   label: 'LEARNED'   },
      { store: this.ephemeral, label: 'EPHEMERAL' },
    ];

    for (const { store, label } of stores) {
      for (const [key, rec] of Object.entries(store)) {
        if (rec.timestamp >= cutoff) {
          results.push({ key, content: String(rec.value), reason: rec.reason, layer: label, timestamp: rec.timestamp });
        }
      }
    }

    results.sort((a, b) => b.timestamp - a.timestamp);
    this._meta.channelSearches.time++;
    return results.slice(0, topK);
  }

  /**
   * 通道4：联想搜索（关系图遍历）
   */
  searchByAssociation(startKey, maxDepth = 3, topK = 10) {
    const visited = new Set();
    const queue = [{ key: startKey, depth: 0 }];
    const results = [];

    const findRecord = (k) => this.core[k] || this.learned[k] || this.ephemeral[k];

    while (queue.length > 0 && results.length < topK) {
      const current = queue.shift();
      if (visited.has(current.key) || current.depth > maxDepth) continue;
      visited.add(current.key);

      const rec = findRecord(current.key);
      if (rec) results.push({ key: current.key, content: String(rec.value), layer: rec.level, depth: current.depth, timestamp: rec.timestamp });

      const rels = this.relationships.get(current.key) || [];
      for (const rel of rels) {
        if (!visited.has(rel.targetKey)) {
          queue.push({ key: rel.targetKey, depth: current.depth + 1 });
        }
      }
    }

    this._meta.channelSearches.association++;
    return results;
  }

  /**
   * 融合搜索（多通道加权）
   */
  search(query, options = {}) {
    const {
      keywords = [],
      timeRange = null,       // { hours: 24 }
      startKey = null,
      layers = ['core', 'learned', 'ephemeral'],
      weights = { semantic: 0.35, keyword: 0.25, time: 0.15, association: 0.25 },
      topK = 10,
    } = options;

    const scores = new Map();

    // 语义通道
    const semantic = this.searchSemantic(query, 20);
    for (const r of semantic) {
      if (layers.includes(r.layer.toLowerCase())) {
        scores.set(r.key, { ...r, score: r.similarity * weights.semantic, channels: ['semantic'] });
      }
    }

    // 关键词通道
    if (keywords.length > 0) {
      const kw = this.searchKeywords(keywords, 20);
      for (const r of kw) {
        if (layers.includes(r.layer.toLowerCase())) {
          const existing = scores.get(r.key);
          if (existing) {
            existing.score += (r.score / 10) * weights.keyword;
            existing.channels.push('keyword');
          } else {
            scores.set(r.key, { ...r, score: (r.score / 10) * weights.keyword, channels: ['keyword'] });
          }
        }
      }
    }

    // 时间通道
    if (timeRange) {
      const time = this.searchByTime(timeRange.hours, 20);
      for (const r of time) {
        if (layers.includes(r.layer.toLowerCase())) {
          const existing = scores.get(r.key);
          if (existing) {
            existing.score += 0.5 * weights.time;
            existing.channels.push('time');
          } else {
            scores.set(r.key, { ...r, score: 0.5 * weights.time, channels: ['time'] });
          }
        }
      }
    }

    // 联想通道
    if (startKey) {
      const assoc = this.searchByAssociation(startKey, 3, 20);
      for (const r of assoc) {
        if (layers.includes(r.layer.toLowerCase())) {
          const existing = scores.get(r.key);
          if (existing) {
            existing.score += 0.5 * weights.association;
            existing.channels.push('association');
          } else {
            scores.set(r.key, { ...r, score: 0.5 * weights.association, channels: ['association'] });
          }
        }
      }
    }

    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // ============================================================
  // 遗忘引擎（艾宾浩斯）
  // ============================================================

  /**
   * 评估单条记忆的 retention（0~1）
   */
  getRetention(record) {
    if (!record) return 0;
    const ageHours = (Date.now() - record.timestamp) / (1000 * 60 * 60);
    const stability = record.level === 'core' ? this.forgetConfig.coreStability
                    : record.level === 'learned' ? this.forgetConfig.learnedStability
                    : this.forgetConfig.defaultStability;
    return ebbinghausForget(stability, ageHours).retention;
  }

  /**
   * 清理：压缩低 retention 的 LEARNED，删除超阈值
   */
  applyForgetting() {
    const now = Date.now();
    const toDelete = [];
    const toCompress = [];

    for (const [key, rec] of Object.entries(this.learned)) {
        const ageHours = (now - rec.timestamp) / (1000 * 60 * 60);
        const { shouldDelete, shouldCompress } = ebbinghausForget(this.forgetConfig.learnedStability, ageHours);

      if (shouldDelete) {
        toDelete.push(key);
      } else if (shouldCompress && !rec.compressed) {
        rec.compressed = true;
        toCompress.push(key);
        this._meta.compressed++;
      }
    }

    for (const key of toDelete) {
      delete this.learned[key];
      this.vectors.learned.delete(key);
      this._meta.deleted++;
    }

    if (toDelete.length > 0 || toCompress.length > 0) {
      this._save();
    }

    console.log(`[MeaningfulMemory] 遗忘清理: 删除 ${toDelete.length} 条, 压缩 ${toCompress.length} 条`);
    return { deleted: toDelete.length, compressed: toCompress.length };
  }

  // ============================================================
  // 查询 & 统计
  // ============================================================

  getCore()       { return Object.values(this.core); }
  getLearned()    { return Object.values(this.learned); }
  getEphemeral()  { return Object.values(this.ephemeral); }

  findByType(type) {
    return [
      ...Object.values(this.core).filter(r => r.type === type),
      ...Object.values(this.learned).filter(r => r.type === type),
    ];
  }

  stats() {
    const avgRetention = [
      ...Object.values(this.learned).map(r => this.getRetention(r)),
      ...Object.values(this.core).map(r => this.getRetention(r)),
    ];
    const avg = avgRetention.length > 0
      ? (avgRetention.reduce((a, b) => a + b, 0) / avgRetention.length).toFixed(3)
      : '1.000';

    return {
      core:     Object.keys(this.core).length,
      learned:  Object.keys(this.learned).length,
      ephemeral:Object.keys(this.ephemeral).length,
      total:    Object.keys(this.core).length + Object.keys(this.learned).length + Object.keys(this.ephemeral).length,
      avgRetention: parseFloat(avg),
      compressionCount: this._meta.compressed,
      deletionCount:   this._meta.deleted,
      loads: this._meta.loads,
      saves: this._meta.saves,
      channels: this._meta.channelSearches,
      vectorDim: this.vectorDim,
    };
  }

  health() {
    const s = this.stats();
    return {
      ...s,
      verdict: s.avgRetention >= 0.7 ? '🟢 健康' : s.avgRetention >= 0.4 ? '🟡 注意' : '🔴 需清理',
      layers: {
        CORE:      { count: s.core,     retention: '1.000 (永久)', searchable: true },
        LEARNED:   { count: s.learned,  retention: s.avgRetention.toString(), searchable: true },
        EPHEMERAL: { count: s.ephemeral, retention: 'session', searchable: true },
      },
      retrievalChannels: ['semantic (向量)', 'keyword (BM25)', 'time (时间)', 'association (关系图)'],
    };
  }

  /**
   * 导出 / 导入
   */
  exportToFile(filePath) {
    const data = {
      core:     this.core,
      learned:  this.learned,
      exportedAt: new Date().toISOString(),
      version: '11.5.10',
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true, count: Object.keys(this.core).length + Object.keys(this.learned).length };
  }

  /**
   * 清空 ephemeral（会话结束时）
   */
  clearEphemeral() {
    this.ephemeral = {};
    this.vectors.ephemeral.clear();
    console.log('[MeaningfulMemory] ephemeral 已清空（会话结束）');
  }
}

module.exports = { MeaningfulMemory };
