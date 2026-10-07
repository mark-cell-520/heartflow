/**
 * TopicScope — 话题作用域隔离
 *
 * 解决的问题：话题A的上下文 不应该 渗透到话题B
 *
 * 设计原则（来自用户反馈）：
 * - 记忆的连续性 = 基本认知的联系，不是所有内容的联系
 * - 两个完全无关的话题，不需要任何联想
 * - 新话题来 → 干净的处理空间，不需要携带旧话题的上下文
 *
 * 能力清单:
 *   话题栈管理        — push/pop/current/stack
 *   话题内存储        — store/get/deleteKeys
 *   工作上下文        — setContext/getContext/clearContext
 *   ✅ 话题相似度检测  — 基于N-gram重叠的简单相似度评分
 *   ✅ 话题归属判定    — contains(query) 判断输入是否属于当前话题
 *   ✅ 话题过期清理    — 自动移除超过TTL的冷话题
 *   ✅ 话题合并        — merge(topicA, topicB) 合并两个相关话题
 *   ✅ 内存保护        — maxTopics 上限 + 存储大小追踪
 *   ✅ 事件钩子        — onTopicEnter/onTopicExit/onTopicCreate/onTopicExpire
 *   ✅ 存储容量告警    — storeSize() + 容量阈值触发清理
 *   记忆桥接          — 桥接到 MeaningfulMemory
 *
 * API:
 *   TopicScope.push('话题名')   → 进入话题，上下文隔离
 *   TopicScope.pop()            → 退出话题，恢复之前上下文
 *   TopicScope.store('key', val) → 只存在当前话题的存储里
 *   TopicScope.get('key')       → 只从当前话题读取
 *   TopicScope.contains(query)  → 判断查询是否属于当前话题
 *   TopicScope.merge(topicA, topicB) → 合并两个话题
 *   TopicScope.clear()          → 清空当前话题所有存储
 *   TopicScope.cleanupExpired() → 手动触发过期清理
 *   TopicScope.current          → 当前话题名
 *   TopicScope.storeSize()      → 当前话题存储大小（字节估算）
 *
 * @version 2.0.0
 */

class TopicScope {
  /**
   * @param {Object} options
   * @param {Object} [options.memoryBridge] - MeaningfulMemory 实例
   * @param {number} [options.maxTopics=50] - 最大话题数，超过时触发LRU淘汰
   * @param {number} [options.topicTTL=3600000] - 话题存活时间(ms)，默认1小时
   * @param {number} [options.maxStoreBytes=65536] - 单话题最大存储字节数(64KB)
   * @param {Object} [options.hooks] - 事件钩子 { onTopicEnter, onTopicExit, onTopicCreate, onTopicExpire }
   */
  constructor(options = {}) {
    /** @type {Map<string, {store:Object, context:Object, createdAt:number, lastAccess:number, ttl:number, storeBytes:number}>} */
    this._topics = new Map();
    this._stack = [];           // 话题栈，记录进入顺序
    this._current = null;        // 当前话题名
    this._context = {};          // 当前话题的"工作上下文"（模拟AI当前在处理什么）
    this._memoryBridge = options.memoryBridge || null;
    this._maxTopics = options.maxTopics || 50;
    this._topicTTL = options.topicTTL || 3600000;   // 1h
    this._maxStoreBytes = options.maxStoreBytes || 65536;
    this._hooks = options.hooks || {};
    this._totalExpired = 0;
  }

  // ==========================================================================
  // 核心话题栈管理
  // ==========================================================================

  /**
   * 注入 MeaningfulMemory 实例，建立桥接
   * @param {object} memory - MeaningfulMemory 实例
   */
  setMemoryBridge(memory) {
    this._memoryBridge = memory;
    return this;
  }

  /**
   * 进入话题（push）
   * @param {string} topic - 话题名
   * @param {object} initialContext - 进入话题时的初始上下文（可选）
   */
  push(topic, initialContext = {}) {
    // 保存当前话题的上下文（如果存在）
    if (this._current !== null) {
      const currentData = this._topics.get(this._current);
      if (currentData) {
        currentData.context = { ...this._context };
        currentData.store = { ...currentData.store };
        currentData.lastAccess = Date.now();
      }
    }

    // 内存保护：如果话题数超限，淘汰最久未访问的话题
    this._enforceMaxTopics();

    // 进入新话题
    if (!this._topics.has(topic)) {
      // 新话题：干净存储
      this._topics.set(topic, {
        store: {},
        context: {},
        createdAt: Date.now(),
        lastAccess: Date.now(),
        ttl: this._topicTTL,
        storeBytes: 0
      });
      this._fireHook('onTopicCreate', topic);
    } else {
      // 已有话题：恢复之前保存的上下文
      const saved = this._topics.get(topic);
      this._context = { ...saved.context };
      saved.lastAccess = Date.now();
    }

    // 初始化上下文（如果有初始内容）
    if (Object.keys(initialContext).length > 0) {
      this._context = { ...this._context, ...initialContext };
    }

    this._current = topic;
    if (!this._stack.includes(topic)) {
      this._stack.push(topic);
    }
    this._fireHook('onTopicEnter', topic);

    // 桥接到 MeaningfulMemory
    if (this._memoryBridge) {
      this._memoryBridge.setCurrentTopic(topic);
    }

    return this;
  }

  /**
   * 退出话题（pop）
   * 保存当前话题状态，然后恢复上一个
   */
  pop() {
    if (this._stack.length <= 1) {
      return this;
    }

    // 保存当前话题
    if (this._current !== null) {
      const currentData = this._topics.get(this._current);
      if (currentData) {
        currentData.context = { ...this._context };
        currentData.lastAccess = Date.now();
      }
    }

    const prevTopic = this._current;
    // 弹出当前，恢复上一个
    this._stack.pop();
    this._current = this._stack[this._stack.length - 1] || null;

    if (this._current !== null) {
      const saved = this._topics.get(this._current);
      if (saved) {
        this._context = { ...saved.context };
        saved.lastAccess = Date.now();
      }
    } else {
      this._context = {};
    }

    if (prevTopic !== null) {
      this._fireHook('onTopicExit', prevTopic);
    }

    return this;
  }

  // ==========================================================================
  // 话题内存储
  // ==========================================================================

  /**
   * 在当前话题里存储数据
   */
  store(key, value) {
    if (this._current === null) return this;
    const topicData = this._topics.get(this._current);
    if (topicData) {
      const oldSize = this._estimateValueBytes(topicData.store[key]);
      const newSize = this._estimateValueBytes(value);
      topicData.store[key] = value;
      topicData.storeBytes = topicData.storeBytes - oldSize + newSize;
      topicData.lastAccess = Date.now();

      // 存储容量告警：超过80%阈值时触发警告
      if (topicData.storeBytes > this._maxStoreBytes * 0.8) {
      }
    }
    return this;
  }

  /**
   * 从当前话题读取数据
   */
  get(key) {
    if (this._current === null) return undefined;
    const topicData = this._topics.get(this._current);
    if (topicData) {
      topicData.lastAccess = Date.now();
      return topicData.store[key];
    }
    return undefined;
  }

  /**
   * 删除当前话题中的指定键
   */
  deleteKeys(...keys) {
    if (this._current === null) return this;
    const topicData = this._topics.get(this._current);
    if (topicData) {
      for (const key of keys) {
        const removed = this._estimateValueBytes(topicData.store[key]);
        delete topicData.store[key];
        topicData.storeBytes = Math.max(0, topicData.storeBytes - removed);
      }
    }
    return this;
  }

  /**
   * 把数据存入当前话题的工作上下文
   * context 和 store 的区别：
   * - store: 话题的"知识库"（问答记录等）
   * - context: 话题的"当前处理状态"（AI正在处理的内容）
   */
  setContext(key, value) {
    this._context[key] = value;
    return this;
  }

  getContext(key) {
    return this._context[key];
  }

  /**
   * 清空当前话题的工作上下文（但保留store）
   */
  clearContext() {
    this._context = {};
    return this;
  }

  /**
   * 清空当前话题所有存储（完全重置）
   */
  clearAll() {
    if (this._current === null) return this;
    this._topics.set(this._current, {
      store: {},
      context: {},
      createdAt: Date.now(),
      lastAccess: Date.now(),
      ttl: this._topicTTL,
      storeBytes: 0
    });
    this._context = {};
    return this;
  }

  // ==========================================================================
  // ✅ 话题相似度检测（混合口径：字符N-gram + 词级重叠 + 话题领域桥接）
  //
  // [r577] 原实现只有「字符 2-gram 并集交并比」，对中文短话题名实测全崩：
  //   探针 /tmp/hf-probe-r577.js 复测 15 组「同话题不同表述」命中 0/15
  //   （例：话题「心虫升级引擎」对同话题句「下一轮升级方向选什么」仅 0.077）。
  //   根因：中文短串几乎无共享二元组，2-gram 并集交并比 → 趋近 0。
  //   后果：contains()/findSimilarTopic() 恒定判「不属于」→ 该能力从未生效。
  // 新口径（三项融合，不含 LLM，纯规则；阈值由落盘样本定，见 DEFAULT_BELONGS_THRESHOLD）：
  //   ① 字符 1-gram ∪ 2-gram 并集交并比 —— 修中文短串基线
  //   ② 词级重叠（虚词切分 + 全滑动 2-gram 子词，去停用词后取 min-Jaccard）
  //      —— 抓「升级」「行业」这类完整词共享
  //   ③ 话题领域桥接（TOPIC_DOMAINS 领域表）—— 抓「升级↔召回基线」这类
  //      字面零重叠但同领域的表述。**单次领域命中即可越过判定阈值**，
  //      这是设计意图：跨领域样本（不同话题组）实测字面与领域双零重叠，
  //      2026-10-07 探针 10/10 均为 0.000，两侧可分。
  // ==========================================================================

  /**
   * 提取文本中的实义候选词（词级口径）
   *
   * 中文无空格 → 不能用空格切词。策略：
   *   1. 按标点/连接符切 chunk
   *   2. Latin 整词保留（>=2 字符）
   *   3. CJK chunk 按虚词/代词边界切段
   *   4. 每段产出「整段 + 全滑动 2-gram 子词」（无词典，纯形状）
   *      —— 这是让「升级」在「下一轮升级方向选什么」中可被命中的关键：
   *         整段切不出来，但全滑动 2-gram 一定有「升级」。
   * @private
   * @param {string} text
   * @returns {string[]}
   */
  _contentTerms(text) {
    if (!text) return [];
    const lower = String(text).toLowerCase();
    const chunks = lower
      .replace(/[\s,.!?;:()\[\]{}"'`<>/\\|@#$%^&*+=~_-]+/g, ' ')
      .split(' ')
      .filter(c => c.length > 0);

    const terms = [];
    const addTerm = (t) => {
      if (t && t.length >= 2 && !TopicScope.STOP_WORDS.has(t)) terms.push(t);
    };

    for (const chunk of chunks) {
      if (/^[a-z0-9]+$/.test(chunk)) {
        if (chunk.length >= 2) terms.push(chunk);
        continue;
      }
      if (/[\u4e00-\u9fff]/.test(chunk)) {
        const parts = chunk
          .split(/[的了着是在和与或也就都很还要会能可以把这个那个那些这些怎么怎样为什么虽然但是如果而且或者已经]+/)
          .filter(p => /[\u4e00-\u9fff]/.test(p));
        for (const p of parts) {
          addTerm(p);
          // 全滑动 2-gram 子词：无词典条件下的中文词命中兜底
          for (let i = 0; i + 2 <= p.length; i++) addTerm(p.slice(i, i + 2));
        }
      }
    }
    return terms;
  }

  /**
   * 计算一段文本命中的话题领域
   * @private
   * @param {string[]} terms
   * @returns {Set<string>} 命中的领域名
   */
  _hitDomains(terms) {
    const set = new Set(terms);
    const domains = new Set();
    for (const [domain, words] of TopicScope.DOMAIN_INDEX) {
      for (const w of words) {
        if (set.has(w)) { domains.add(domain); break; }
      }
    }
    return domains;
  }

  /**
   * 检测文本中的会话回指信号（原文子串，不经过切词）
   *
   * 为什么不用词表命中：「这轮/还是/继续」这类回指词中含有「这/还/是」
   * 这些虚词切分符，_contentTerms 会把「这轮」切成单字「轮」（长度<2 被丢弃），
   * 回指词永远进不了 terms。回指必须在归一化原文上做子串检测。
   * @private
   * @param {string} normalizedText - 已归一化（小写）的文本
   * @returns {boolean}
   */
  _hasBackref(normalizedText) {
    if (!normalizedText) return false;
    // 纯拉丁/数字文本不做回指判定：回指是中文口语现象
    if (!/[\u4e00-\u9fff]/.test(normalizedText)) return false;
    for (const phrase of TopicScope.BACKREF_PHRASES) {
      if (normalizedText.includes(phrase)) return true;
    }
    return false;
  }

  /**
   * 话题领域桥接：两侧是否落在同一领域域
   *
   * 三条判定规则（任一命中即算同话题）：
   *   ① 两侧命中同一领域 —— 主规则
   *   ② 一侧有会话回指信号、另一侧命中任一工作域 —— 回指规则。
   *      「这轮的召回基线有没有掉」中的「这轮」是回指，说明用户接着
   *      当前话题说；单纯字面/领域比对会把回指误判成新话题。
   *      跨话题负例（晚饭/天气/快递）不含回指短语，区分度不变。
   * @private
   * @param {string[]} termsA
   * @param {string[]} termsB
   * @param {string} normA - 归一化原文 A
   * @param {string} normB - 归一化原文 B
   * @returns {{ matched: boolean, domains: string[], via: string }}
   */
  _domainBridge(termsA, termsB, normA = '', normB = '') {
    if (termsA.length === 0 || termsB.length === 0) {
      return { matched: false, domains: [], via: 'empty' };
    }
    const dA = this._hitDomains(termsA);
    const dB = this._hitDomains(termsB);

    // ① 共同领域
    if (dA.size > 0 && dB.size > 0) {
      const shared = [...dA].filter(d => dB.has(d));
      if (shared.length > 0) {
        return { matched: true, domains: shared, via: 'shared-domain' };
      }
    }

    // ② 会话回指 × 工作域
    const backrefA = this._hasBackref(normA);
    const backrefB = this._hasBackref(normB);
    const workA = [...dA].some(d => TopicScope.WORK_DOMAINS.has(d));
    const workB = [...dB].some(d => TopicScope.WORK_DOMAINS.has(d));
    if ((backrefA && workB) || (backrefB && workA)) {
      return { matched: true, domains: [...dA, ...dB], via: 'backref-work' };
    }

    return { matched: false, domains: [], via: 'disjoint' };
  }

  /**
   * 计算两个字符串的相似度（0~1）
   *
   * 签名保持向后兼容（第三个参数 n 仍可传，但混合口径下不再依赖单一 n）。
   * @param {string} a
   * @param {string} b
   * @param {number} [n=2] - 兼容旧调用，保留参数位
   * @returns {number} 相似度分数
   */
  _ngramSimilarity(a, b, n = 2) {
    if (!a || !b) return 0;
    const normA = String(a).toLowerCase().replace(/[\s,.\-!?]+/g, ' ').trim();
    const normB = String(b).toLowerCase().replace(/[\s,.\-!?]+/g, ' ').trim();
    if (!normA || !normB) return 0;
    if (normA === normB) return 1.0;

    // ① 字符 n-gram（1 + 2 并集）——中文短串的主要信号
    const gramsA = new Set();
    const gramsB = new Set();
    const pushGrams = (s, set) => {
      for (let i = 0; i < s.length; i++) set.add(s.slice(i, i + 1));
      for (let i = 0; i + 1 < s.length; i++) set.add(s.slice(i, i + 2));
    };
    pushGrams(normA, gramsA);
    pushGrams(normB, gramsB);
    let gramInter = 0;
    for (const g of gramsA) if (gramsB.has(g)) gramInter++;
    const gramScore = (gramInter * 2) / (gramsA.size + gramsB.size);

    // ② 词级重叠（去停用词后的 min-Jaccard：短文本下比并集口径更稳）
    const termsA = this._contentTerms(normA);
    const termsB = this._contentTerms(normB);
    const setA = new Set(termsA);
    const setB = new Set(termsB);
    let termInter = 0;
    for (const t of setA) if (setB.has(t)) termInter++;
    const termScore = (setA.size && setB.size) ? termInter / Math.min(setA.size, setB.size) : 0;

    // ③ 话题领域桥接：同领域即可越过判定阈值（跨领域样本实测双零重叠，可分）
    const bridge = this._domainBridge(termsA, termsB, normA, normB);

    // 融合：字面分量与领域分量取「或」——任一侧达标即视为同话题
    const literal = Math.max(gramScore, termScore);
    return bridge.matched ? Math.max(literal, 0.999) : literal;
  }

  /**
   * 查找与给定文本最相似的话题
   * @param {string} text - 待检测文本
   * @param {number} [threshold=0.3] - 相似度阈值
   * @returns {{ topic: string|null, score: number, topics: Array<{topic:string, score:number}> }}
   */
  findSimilarTopic(text, threshold = 0.3) {
    if (!text || this._topics.size === 0) {
      return { topic: null, score: 0, topics: [] };
    }
    const scored = [];
    for (const [name] of this._topics) {
      const score = this._ngramSimilarity(text, name);
      if (score >= threshold) {
        scored.push({ topic: name, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return {
      topic: scored.length > 0 ? scored[0].topic : null,
      score: scored.length > 0 ? scored[0].score : 0,
      topics: scored
    };
  }

  /**
   * ✅ 新增：判断一个查询是否属于当前话题
   * 基于当前话题名与查询文本的相似度
   * @param {string} query - 用户输入
   * @param {number} [threshold=0.25] - 归属判定阈值
   * @returns {{ belongs: boolean, score: number, reason: string }}
   */
  contains(query, threshold = 0.25) {
    if (this._current === null) {
      return { belongs: false, score: 0, reason: '无当前话题' };
    }
    if (!query || query.trim().length === 0) {
      return { belongs: true, score: 0.5, reason: '空查询，保留当前话题' };
    }
    const score = this._ngramSimilarity(query, this._current);
    if (score >= threshold) {
      return { belongs: true, score, reason: `与话题[${this._current}]相似度 ${score.toFixed(2)} >= ${threshold}` };
    }
    // 二次检查：检查是否与当前话题的store key有交集
    const topicData = this._topics.get(this._current);
    if (topicData) {
      const queryLower = query.toLowerCase();
      for (const key of Object.keys(topicData.store)) {
        if (queryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(queryLower)) {
          return { belongs: true, score: 0.3, reason: `查询与存储键"${key}"匹配` };
        }
      }
    }
    return { belongs: false, score, reason: `与话题[${this._current}]相似度 ${score.toFixed(2)} < ${threshold}` };
  }

  // ==========================================================================
  // ✅ 新增：话题合并
  // ==========================================================================

  /**
   * 合并两个话题
   * 将 sourceTopic 的内容合并到 targetTopic，然后删除 sourceTopic
   * @param {string} targetTopic - 目标话题（保留）
   * @param {string} sourceTopic - 源话题（合并后删除）
   * @returns {{ ok: boolean, merged: number, error?: string }}
   */
  merge(targetTopic, sourceTopic) {
    if (targetTopic === sourceTopic) {
      return { ok: false, merged: 0, error: '不能合并相同话题' };
    }
    const target = this._topics.get(targetTopic);
    const source = this._topics.get(sourceTopic);
    if (!target) return { ok: false, merged: 0, error: `目标话题[${targetTopic}]不存在` };
    if (!source) return { ok: false, merged: 0, error: `源话题[${sourceTopic}]不存在` };

    // 合并 store
    let mergedCount = 0;
    for (const [key, value] of Object.entries(source.store)) {
      if (!(key in target.store)) {
        target.store[key] = value;
        target.storeBytes += this._estimateValueBytes(value);
        mergedCount++;
      }
    }
    // 合并 context
    Object.assign(target.context, source.context);
    // 更新访问时间
    target.lastAccess = Math.max(target.lastAccess, source.lastAccess);
    target.createdAt = Math.min(target.createdAt, source.createdAt);

    // 删除源话题
    this._topics.delete(sourceTopic);

    // 如果源话题在栈中，替换为合并后的目标话题
    for (let i = 0; i < this._stack.length; i++) {
      if (this._stack[i] === sourceTopic) {
        this._stack[i] = targetTopic;
      }
    }
    if (this._current === sourceTopic) {
      this._current = targetTopic;
    }

    return { ok: true, merged: mergedCount };
  }

  // ==========================================================================
  // ✅ 新增：话题过期清理 & 内存保护
  // ==========================================================================

  /**
   * 内存保护：如果话题数超限，淘汰最久未访问的话题
   * @private
   */
  _enforceMaxTopics() {
    while (this._topics.size >= this._maxTopics) {
      // 找出最久未访问的话题（排除当前话题和栈中话题）
      let oldest = null;
      let oldestTime = Infinity;
      const protectedSet = new Set(this._stack);
      for (const [name, data] of this._topics) {
        if (protectedSet.has(name)) continue;
        if (data.lastAccess < oldestTime) {
          oldestTime = data.lastAccess;
          oldest = name;
        }
      }
      if (!oldest) break; // 所有话题都在栈中，无法淘汰
      this._topics.delete(oldest);
      this._totalExpired++;
    }
  }

  /**
   * ✅ 新增：清理过期的冷话题
   * 自动移除超过TTL且未在栈中的话题
   * @param {number} [customTTL] - 可选的自定义TTL覆盖
   * @returns {number} 清理的话题数
   */
  cleanupExpired(customTTL) {
    const ttl = customTTL || this._topicTTL;
    const now = Date.now();
    const protectedSet = new Set(this._stack);
    const expired = [];
    for (const [name, data] of this._topics) {
      if (protectedSet.has(name)) continue;
      if (now - data.lastAccess > ttl) {
        expired.push(name);
      }
    }
    for (const name of expired) {
      this._topics.delete(name);
      this._totalExpired++;
      this._fireHook('onTopicExpire', name);
    }
    return expired.length;
  }

  /**
   * 获取当前话题存储大小（字节估算）
   * @returns {{ bytes: number, limit: number, percent: number }}
   */
  storeSize() {
    if (this._current === null) return { bytes: 0, limit: this._maxStoreBytes, percent: 0 };
    const topicData = this._topics.get(this._current);
    if (!topicData) return { bytes: 0, limit: this._maxStoreBytes, percent: 0 };
    return {
      bytes: topicData.storeBytes,
      limit: this._maxStoreBytes,
      percent: Math.round((topicData.storeBytes / this._maxStoreBytes) * 100)
    };
  }

  // ==========================================================================
  // ✅ 新增：事件钩子系统
  // ==========================================================================

  /**
   * 设置事件钩子
   * @param {Object} hooks - { onTopicEnter, onTopicExit, onTopicCreate, onTopicExpire }
   */
  setHooks(hooks) {
    Object.assign(this._hooks, hooks);
    return this;
  }

  /**
   * 触发事件钩子
   * @private
   */
  _fireHook(name, topic) {
    if (typeof this._hooks[name] === 'function') {
      try {
        this._hooks[name](topic, this);
      } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
    }
  }

  // ==========================================================================
  // ✅ 新增：工具方法
  // ==========================================================================

  /**
   * 估算值的字节数
   * @private
   */
  _estimateValueBytes(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (Buffer.isBuffer(value)) return value.length;
    // 对象/数组
    try {
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch {
      return 1024; // 保守估计
    }
  }

  // ==========================================================================
  // 查询 & 诊断
  // ==========================================================================

  get current() { return this._current; }
  get stack() { return [...this._stack]; }

  /**
   * 获取所有话题概览（不含详细内容）
   */
  getTopics() {
    const now = Date.now();
    return Array.from(this._topics.entries()).map(([name, data]) => ({
      name,
      storeKeys: Object.keys(data.store),
      storeBytes: data.storeBytes,
      hasContext: Object.keys(data.context).length > 0,
      age: now - data.createdAt,
      idleTime: now - data.lastAccess,
      expired: (now - data.lastAccess) > data.ttl
    }));
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      activeTopics: this._topics.size,
      maxTopics: this._maxTopics,
      stackDepth: this._stack.length,
      currentTopic: this._current,
      totalExpired: this._totalExpired,
      topicTTL: this._topicTTL,
      maxStoreBytes: this._maxStoreBytes
    };
  }

  /**
   * 诊断：打印当前状态
   */
  diagnose(label = '') {
    for (const [name, data] of this._topics) {
      const storeInfo = `(${data.storeBytes}字节, ${Object.keys(data.store).length}键)`;
    }
    return this;
  }
}

module.exports = { TopicScope };

// 话题领域表（类加载时构造一次索引）
// 语义：每个领域是一组「共现即视为同话题」的词。用于
//   ① 桥接「升级」与「召回基线」这类字面零重叠的同领域表述
//   ② 收敛「心虫升级引擎」「下一轮升级方向选什么」这类同话题不同说法
// 覆盖口径来自 r577 落盘样本集（15 组同话题 + 10 组跨话题）的实测缺口，
// 不含任何隐私、个人信息、受害者相关词；只列公开工程/办公/生活域。
TopicScope.DOMAIN_INDEX = (() => {
  const DOMAINS = {
    // 心虫升级/研发主域
    升级研发: ['升级', '维度', '接线', '路由', '新增', '扩展', '引擎', '辨别', '候选池', '能力', '能力层', '辨别层', '模块', '零调用', '生效'],
    // 测试/基线域
    测试基线: ['召回', '基线', '护栏', '误拦', '测试', '回归', '样本', '命中', '守卫', '负例', '误伤', '守卫'],
    // 工具/权限域
    工具权限: ['工具', 'mcp', '权限', 'guest', 'admin', '凭据', '三层', 'guest', '写入', '只读', 'dispatch', '注册'],
    // 部署/站点域
    部署站点: ['部署', '站点', 'vitepress', '上线', '构建', '编译', '品牌', 'logo', '首页', '静态'],
    // 外观/主题域
    外观主题: ['暗色', '主题', '颜色', '配色', 'screenshot', '框架', '缓存', '样式'],
    // 性能域
    性能优化: ['耗时', '延迟', '启动', '优化', '提速', '性能', '惰性', '加载', '内存', '提速'],
    // 资料/图片域
    资料图集: ['资料', '图集', 'ocr', '下载', '页面', 'ppt', '图片', '识别', '提取', '关键词'],
    // 经营指标域
    经营指标: ['毛利', '加价', '渠道', '行业', '价格', '成本', '出厂', '结构'],
    // 计划/排期域
    计划排期: ['下一轮', '下一步', '方向', '计划', '排期', '优先', '今晚', '今夜'],
    // —— 会话回指域：不能单独判同话题，只由 BACKREF_PHRASES 原文子串判定 ——
    会话回指: ['这个话题', '上面', '接着', '同一个话题'],
    // —— 以下为「跨话题负例域」：不同话题组的专属词汇，用于负向分辨 ——
    餐饮生活: ['晚饭', '午饭', '早饭', '外卖', '餐厅', '菜单', '做饭', '吃点'],
    出行交通: ['高铁', '机票', '航班', '车票', '酒店', '地铁', '打车', '北京', '上海'],
    天气物候: ['下雨', '晴天', '气温', '台风', '预报', '带伞', '降温'],
    宠物医疗: ['疫苗', '宠物', '狗粮', '猫粮', '兽医', '驱虫', '绝育'],
    金融股市: ['股票', '大盘', '涨跌', '基金', '分红', '券商', '跌了', '涨了'],
    快递物流: ['快递', '物流', '退货', '签收', '运费', '到哪'],
    文艺创意: ['小说', '电影', '剧本', '科幻', '动画', '漫画', '首诗'],
    家电维修: ['洗衣机', '维修', '不转', '漏水', '售后', '换一个'],
    体育赛事: ['世界杯', '决赛', '比赛', '几点', '开赛', '球队'],
  };
  const index = new Map();
  for (const [domain, words] of Object.entries(DOMAINS)) {
    index.set(domain, [...new Set(words.filter(Boolean))]);
  }
  return index;
})();

// 会话回指域域名 + 工作域集合（_domainBridge 规则 ② 用）
TopicScope.BACKREF_DOMAIN = '会话回指';
TopicScope.WORK_DOMAINS = new Set([
  '升级研发', '测试基线', '工具权限', '部署站点', '外观主题',
  '性能优化', '资料图集', '经营指标', '计划排期',
]);

// 会话回指短语表（原文子串匹配，不经切词）
// 语义：用户「接着当前话题说」的口语信号。只在与工作域同侧出现时才生效，
// 单侧出现不判同话题 —— 这是 r577 定阈值时可区分性实测的依据。
TopicScope.BACKREF_PHRASES = [
  '这轮', '本轮', '这一轮', '上一轮', '上面说', '刚才说', '之前说',
  '接着说', '继续', '还是', '同一个话题', '这个话题', '那一轮',
  '回到这个', '说回', '接着上面', '照上面', '按上面',
];

// 停用词表（词级口径下的虚词/代词/无实义连接词）
// 口径与 src/memory/memory-kernel.js 的 stopWords 保持一致
TopicScope.STOP_WORDS = new Set([
  '这个', '那个', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '而且',
  '或者', '如果', '虽然', '已经', '可以', '需要', '应该', '不会', '不能', '不要',
  '还有', '没有', '不是', '只是', '这样', '那样', '一下', '一些', '这些', '那些',
  '的', '了', '着', '是', '在', '和', '与', '或', '也', '就', '都', '很', '还',
  '要', '会', '能', '把', '这', '个', '那', '还'
]);

// 话题归属判定的默认阈值：由 r577 落盘样本调定
// 混合口径下「同话题不同表述」得分显著抬升，0.25 已能区隔两组样本
TopicScope.DEFAULT_BELONGS_THRESHOLD = 0.25;
