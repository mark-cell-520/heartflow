/**
 * 资源管理器 (Resource Manager) v1.0.0
 *
 * CPU/内存/并发限制
 */

class ResourceManager {
  constructor(options = {}) {
    this.maxMemory = options.maxMemory || 512 * 1024 * 1024; // 512MB
    this.maxConcurrency = options.maxConcurrency || 5;
    this.maxQueueSize = options.maxQueueSize || 100;
    this.rateLimit = options.rateLimit || { requests: 60, window: 60000 }; // 每分钟 60 请求

    // 状态
    this.currentMemory = 0;
    this.activeRequests = 0;
    this.requestHistory = [];
    this.buckets = new Map();

    // 统计
    this.stats = {
      totalRequests: 0,
      totalTokens: 0,
      blockedRequests: 0,
      startedAt: Date.now()
    };
  }

  /**
   * 检查是否可以执行
   */
  canExecute(resourceRequirements = {}) {
    const checks = {
      memory: this._checkMemory(resourceRequirements.memory || 0),
      concurrency: this._checkConcurrency(),
      rateLimit: this._checkRateLimit(),
      queue: this._checkQueue()
    };

    const allowed = Object.values(checks).every(c => c.allowed);

    return {
      allowed,
      checks,
      reason: allowed ? null : this._getBlockingReason(checks)
    };
  }

  /**
   * 获取执行令牌
   */
  async acquire(resourceRequirements = {}) {
    const can = this.canExecute(resourceRequirements);

    if (!can.allowed) {
      this.stats.blockedRequests++;

      // 等待
      if (can.checks.concurrency?.waitMs) {
        await this._delay(can.checks.concurrency.waitMs);
        return this.acquire(resourceRequirements);
      }

      if (can.checks.rateLimit?.waitMs) {
        await this._delay(can.checks.rateLimit.waitMs);
        return this.acquire(resourceRequirements);
      }

      return { success: false, reason: can.reason };
    }

    // 分配资源
    this.activeRequests++;
    this.currentMemory += resourceRequirements.memory || 0;
    this.stats.totalRequests++;

    const token = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.requestHistory.push({
      token,
      allocated: { memory: resourceRequirements.memory || 0 },
      startTime: Date.now()
    });

    return {
      success: true,
      token,
      release: () => this.release(token)
    };
  }

  /**
   * 释放资源
   */
  release(token) {
    const request = this.requestHistory.find(r => r.token === token);
    if (request) {
      this.activeRequests--;
      this.currentMemory -= request.allocated.memory || 0;
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
    }
  }

  /**
   * 记录 Token 使用
   */
  recordTokens(inputTokens, outputTokens) {
    this.stats.totalTokens += inputTokens + outputTokens;
  }

  /**
   * 检查内存
   */
  _checkMemory(required) {
    const available = this.maxMemory - this.currentMemory;
    const allowed = available >= required;

    return {
      allowed,
      current: this.currentMemory,
      max: this.maxMemory,
      required,
      available
    };
  }

  /**
   * 检查并发
   */
  _checkConcurrency() {
    const allowed = this.activeRequests < this.maxConcurrency;
    const waitMs = allowed ? 0 : 100; // 如果满载，等待 100ms

    return {
      allowed,
      current: this.activeRequests,
      max: this.maxConcurrency,
      waitMs
    };
  }

  /**
   * 检查速率限制
   */
  _checkRateLimit() {
    const now = Date.now();
    const windowStart = now - this.rateLimit.window;

    // 清理过期记录
    this.requestHistory = this.requestHistory.filter(r => r.startTime > windowStart);

    const count = this.requestHistory.length;
    const allowed = count < this.rateLimit.requests;
    const waitMs = allowed ? 0 : this.rateLimit.window;

    return {
      allowed,
      current: count,
      max: this.rateLimit.requests,
      window: this.rateLimit.window,
      waitMs
    };
  }

  /**
   * 检查队列
   */
  _checkQueue() {
    const allowed = true; // 简化实现
    return { allowed };
  }

  /**
   * 获取阻塞原因
   */
  _getBlockingReason(checks) {
    if (!checks.concurrency.allowed) return '并发限制';
    if (!checks.rateLimit.allowed) return '速率限制';
    if (!checks.memory.allowed) return '内存限制';
    return '未知限制';
  }

  /**
   * 延迟
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取统计
   */
  getStats() {
    const uptime = Date.now() - this.stats.startedAt;
    const ratePerMinute = this.stats.totalRequests / (uptime / 60000);

    return {
      ...this.stats,
      activeRequests: this.activeRequests,
      currentMemory: this.currentMemory,
      maxMemory: this.maxMemory,
      memoryUsage: ((this.currentMemory / this.maxMemory) * 100).toFixed(1) + '%',
      ratePerMinute: ratePerMinute.toFixed(2),
      uptime: Math.round(uptime / 1000) + 's'
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      totalTokens: 0,
      blockedRequests: 0,
      startedAt: Date.now()
    };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    const memOk = this.currentMemory < this.maxMemory * 0.9;
    const concOk = this.activeRequests < this.maxConcurrency * 0.9;

    return {
      healthy: memOk && concOk,
      memory: memOk ? 'ok' : 'warning',
      concurrency: concOk ? 'ok' : 'warning'
    };
  }
}

/**
 * 预算追踪器
 */
class BudgetTracker {
  constructor(options = {}) {
    this.maxBudget = options.maxBudget || 100000; // token 预算
    this.warnThreshold = options.warnThreshold || 0.8;
    this.criticalThreshold = options.criticalThreshold || 0.95;

    this.used = 0;
    this.history = [];
  }

  /**
   * 消耗预算
   */
  consume(tokens, operation) {
    this.used += tokens;
    this.history.push({
      tokens,
      operation,
      timestamp: Date.now(),
      remaining: this.maxBudget - this.used
    });

    return {
      allowed: this.used <= this.maxBudget,
      remaining: this.maxBudget - this.used,
      percentUsed: (this.used / this.maxBudget * 100).toFixed(1) + '%'
    };
  }

  /**
   * 检查是否可继续
   */
  canContinue(estimatedTokens = 0) {
    const remaining = this.maxBudget - this.used;

    if (remaining < estimatedTokens) {
      return {
        allowed: false,
        remaining,
        reason: '预算不足'
      };
    }

    const percentUsed = this.used / this.maxBudget;

    if (percentUsed >= this.criticalThreshold) {
      return {
        allowed: true,
        warning: '预算即将耗尽',
        remaining,
        percentUsed
      };
    }

    if (percentUsed >= this.warnThreshold) {
      return {
        allowed: true,
        warning: '预算使用较高',
        remaining,
        percentUsed
      };
    }

    return { allowed: true, remaining, percentUsed };
  }

  /**
   * 重置
   */
  reset() {
    this.used = 0;
    this.history = [];
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      used: this.used,
      max: this.maxBudget,
      remaining: this.maxBudget - this.used,
      percentUsed: (this.used / this.maxBudget * 100).toFixed(2) + '%',
      historyLength: this.history.length
    };
  }
}

/**
 * 优先级队列
 */
class PriorityQueue {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.items = [];
  }

  /**
   * 入队
   */
  enqueue(item, priority = 0) {
    if (this.items.length >= this.maxSize) {
      throw new Error('Queue is full');
    }

    this.items.push({ item, priority, timestamp: Date.now() });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 出队
   */
  dequeue() {
    return this.items.shift()?.item;
  }

  /**
   * 查看队首
   */
  peek() {
    return this.items[0]?.item;
  }

  /**
   * 清空
   */
  clear() {
    this.items = [];
  }

  /**
   * 大小
   */
  size() {
    return this.items.length;
  }

  /**
   * 是否为空
   */
  isEmpty() {
    return this.items.length === 0;
  }
}

module.exports = { ResourceManager, BudgetTracker, PriorityQueue };
