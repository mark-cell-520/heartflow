/**
 * 记忆系统 (Memory System) v1.0.0
 *
 * Agent 的持久化记忆
 */

const fs = require('fs');
const path = require('path');

class MemorySystem {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.storagePath = path.join(this.rootPath, '.heart-agent', 'memory');
    this.shortTerm = [];
    this.longTerm = new Map();
    this.workingContext = {};
    this.maxShortTerm = options.maxShortTerm || 100;
    this.initialized = false;
  }

  /**
   * 初始化
   */
  async initialize() {
    if (this.initialized) return;

    // 确保存储目录存在
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }

    // 加载长期记忆
    await this._loadLongTerm();

    this.initialized = true;
    console.log('[MemorySystem] 初始化完成');
  }

  /**
   * 加载长期记忆
   */
  async _loadLongTerm() {
    const indexPath = path.join(this.storagePath, 'index.json');
    if (!fs.existsSync(indexPath)) return;

    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      for (const [key, meta] of Object.entries(index)) {
        const filePath = path.join(this.storagePath, `${key}.json`);
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          this.longTerm.set(key, data);
        }
      }
    } catch (error) {
      console.warn('[MemorySystem] 加载长期记忆失败:', error.message);
    }
  }

  /**
   * 持久化
   */
  async persist() {
    // 保存长期记忆索引
    const index = {};
    for (const [key] of this.longTerm) {
      index[key] = { lastUpdated: Date.now() };
    }

    const indexPath = path.join(this.storagePath, 'index.json');
    try {
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      console.warn('[MemorySystem] 保存记忆索引失败:', error.message);
    }

    // 保存每个记忆
    for (const [key, data] of this.longTerm) {
      const filePath = path.join(this.storagePath, `${key}.json`);
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      } catch (error) {
        // 忽略保存错误
      }
    }
  }

  /**
   * 记住（短期）
   */
  remember(content, metadata = {}) {
    const record = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      content,
      metadata,
      timestamp: Date.now()
    };

    this.shortTerm.push(record);

    // 清理过多短期记忆
    if (this.shortTerm.length > this.maxShortTerm) {
      this.shortTerm = this.shortTerm.slice(-this.maxShortTerm);
    }

    return record;
  }

  /**
   * 学习（长期）
   */
  learn(key, content, metadata = {}) {
    const record = {
      key,
      content,
      metadata,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0
    };

    this.longTerm.set(key, record);
    return record;
  }

  /**
   * 回忆
   */
  recall(key) {
    const record = this.longTerm.get(key);
    if (record) {
      record.lastAccessed = Date.now();
      record.accessCount++;
    }
    return record || null;
  }

  /**
   * 搜索
   */
  search(query) {
    const results = [];

    // 搜索短期记忆
    for (const mem of this.shortTerm) {
      if (this._matches(mem.content, query)) {
        results.push({ ...mem, type: 'short' });
      }
    }

    // 搜索长期记忆
    for (const [key, mem] of this.longTerm) {
      if (this._matches(mem.content, query) || this._matches(key, query)) {
        results.push({ ...mem, type: 'long', key });
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 匹配检查
   */
  _matches(content, query) {
    if (!content) return false;
    return content.toLowerCase().includes(query.toLowerCase());
  }

  /**
   * 设置工作上下文
   */
  setContext(key, value) {
    this.workingContext[key] = value;
  }

  /**
   * 获取工作上下文
   */
  getContext(key) {
    return this.workingContext[key];
  }

  /**
   * 获取所有上下文
   */
  getAllContext() {
    return { ...this.workingContext };
  }

  /**
   * 清空工作上下文
   */
  clearContext() {
    this.workingContext = {};
  }

  /**
   * 获取最近记忆
   */
  getRecent(limit = 10) {
    return {
      short: this.shortTerm.slice(-limit),
      long: [...this.longTerm.values()]
        .sort((a, b) => b.lastAccessed - a.lastAccessed)
        .slice(0, limit)
    };
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      shortTermCount: this.shortTerm.length,
      longTermCount: this.longTerm.size,
      contextKeys: Object.keys(this.workingContext).length
    };
  }

  /**
   * 遗忘（删除）
   */
  forget(key) {
    const deleted = this.longTerm.delete(key);
    if (deleted) {
      const filePath = path.join(this.storagePath, `${key}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return deleted;
  }

  /**
   * 清空短期记忆
   */
  clearShortTerm() {
    this.shortTerm = [];
  }

  /**
   * 整合短期到长期
   */
  consolidate(importanceThreshold = 0.7) {
    const toPromote = this.shortTerm
      .filter(mem => mem.metadata?.importance >= importanceThreshold)
      .map(mem => ({
        key: `consolidated_${mem.id}`,
        content: mem.content,
        metadata: mem.metadata
      }));

    for (const item of toPromote) {
      this.learn(item.key, item.content, item.metadata);
    }

    // 移除已整合的
    const promotedIds = new Set(toPromote.map(p => p.key));
    this.shortTerm = this.shortTerm.filter(mem => !promotedIds.has(mem.id));

    return toPromote.length;
  }
}

module.exports = { MemorySystem };
