/**
 * 重试策略 (Retry Strategy) v1.0.0
 *
 * 管理任务重试逻辑和退避策略
 */

class RetryStrategy {
  constructor(options = {}) {
    this.defaultMaxAttempts = options.defaultMaxAttempts || 3;
    this.defaultBackoffMs = options.defaultBackoffMs || 1000;
    this.maxBackoffMs = options.maxBackoffMs || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryHistory = [];
    this.taskRetryCounts = new Map();
  }

  /**
   * 准备重试
   */
  prepareRetry(task, context = {}) {
    const taskId = this._getTaskId(task);
    const currentRetries = this.taskRetryCounts.get(taskId) || 0;
    const maxAttempts = context.maxAttempts || this.defaultMaxAttempts;

    // 检查是否应该重试
    const shouldRetry = currentRetries < maxAttempts && this._shouldRetryTask(task, context);

    return {
      shouldRetry,
      currentRetries,
      maxAttempts,
      remainingAttempts: maxAttempts - currentRetries,
      backoffMs: this.calculateBackoff(currentRetries)
    };
  }

  /**
   * 判断是否应该重试任务
   */
  _shouldRetryTask(task, context = {}) {
    // 如果明确禁用重试，不重试
    if (context.disableRetry) {
      return false;
    }

    // 某些任务类型不应该重试
    const taskStr = typeof task === 'string' ? task : task.description || '';

    // 危险操作不重试
    if (/rm\s+-rf|DROP\s+TABLE|DELETE.*WHERE/i.test(taskStr)) {
      return false;
    }

    // 已经是最终尝试
    if (context.finalAttempt) {
      return false;
    }

    return true;
  }

  /**
   * 计算退避时间
   */
  calculateBackoff(attempt) {
    // 指数退避
    const exponentialBackoff = this.defaultBackoffMs * Math.pow(this.backoffMultiplier, attempt);

    // 添加一些随机抖动（0-25%）
    const jitter = Math.random() * exponentialBackoff * 0.25;

    // 计算最终退避时间
    const backoff = Math.min(exponentialBackoff + jitter, this.maxBackoffMs);

    return Math.round(backoff);
  }

  /**
   * 记录重试
   */
  recordRetry(info) {
    const record = {
      taskId: this._getTaskId(info.task),
      attempt: info.attempt,
      success: info.success,
      duration: info.duration,
      error: info.error,
      timestamp: Date.now()
    };

    this.retryHistory.push(record);

    // 更新任务重试计数
    if (!info.success) {
      const taskId = this._getTaskId(info.task);
      const current = this.taskRetryCounts.get(taskId) || 0;
      this.taskRetryCounts.set(taskId, current + 1);
    } else {
      // 成功后重置计数
      this.taskRetryCounts.delete(this._getTaskId(info.task));
    }

    // 清理过旧的历史
    this._cleanupHistory();

    return record;
  }

  /**
   * 获取任务ID
   */
  _getTaskId(task) {
    if (typeof task === 'string') {
      // 使用任务描述的哈希
      return `task-${task.slice(0, 50).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)}`;
    }

    return task.id || task.taskId || `task-${Date.now()}`;
  }

  /**
   * 清理历史记录
   */
  _cleanupHistory() {
    const maxHistorySize = 1000;
    if (this.retryHistory.length > maxHistorySize) {
      this.retryHistory = this.retryHistory.slice(-maxHistorySize);
    }
  }

  /**
   * 获取重试统计
   */
  getStats() {
    const stats = {
      totalRetries: this.retryHistory.length,
      successfulRetries: this.retryHistory.filter(r => r.success).length,
      failedRetries: this.retryHistory.filter(r => !r.success).length,
      retryRate: 0,
      averageBackoff: 0,
      byTask: {}
    };

    if (this.retryHistory.length > 0) {
      stats.retryRate = stats.successfulRetries / this.retryHistory.length;
    }

    // 按任务统计
    for (const record of this.retryHistory) {
      const taskId = record.taskId;
      if (!stats.byTask[taskId]) {
        stats.byTask[taskId] = {
          retries: 0,
          successes: 0,
          failures: 0
        };
      }
      stats.byTask[taskId].retries++;
      if (record.success) {
        stats.byTask[taskId].successes++;
      } else {
        stats.byTask[taskId].failures++;
      }
    }

    return stats;
  }

  /**
   * 获取任务重试状态
   */
  getTaskRetryStatus(task) {
    const taskId = this._getTaskId(task);
    const count = this.taskRetryCounts.get(taskId) || 0;

    return {
      taskId,
      retryCount: count,
      hasRetried: count > 0,
      maxAttemptsReached: count >= this.defaultMaxAttempts
    };
  }

  /**
   * 重置任务重试计数
   */
  resetTaskRetry(task) {
    const taskId = this._getTaskId(task);
    this.taskRetryCounts.delete(taskId);
    return true;
  }

  /**
   * 重置所有重试计数
   */
  resetAll() {
    this.taskRetryCounts.clear();
    this.retryHistory = [];
  }

  /**
   * 获取最近的重试历史
   */
  getHistory(limit = 20) {
    return this.retryHistory.slice(-limit);
  }

  /**
   * 预测重试是否可能成功
   */
  predictSuccess(task, context = {}) {
    const taskId = this._getTaskId(task);
    const taskHistory = this.retryHistory.filter(r => r.taskId === taskId);

    if (taskHistory.length === 0) {
      return {
        canRetry: true,
        confidence: 'high',
        reason: '没有历史记录，默认可以重试'
      };
    }

    const recentAttempts = taskHistory.slice(-5);
    const successCount = recentAttempts.filter(r => r.success).length;
    const successRate = successCount / recentAttempts.length;

    if (successRate >= 0.8) {
      return {
        canRetry: true,
        confidence: 'high',
        reason: `历史成功率 ${(successRate * 100).toFixed(1)}%`
      };
    }

    if (successRate >= 0.5) {
      return {
        canRetry: true,
        confidence: 'medium',
        reason: `历史成功率 ${(successRate * 100).toFixed(1)}%`
      };
    }

    if (recentAttempts.length >= 3 && successCount === 0) {
      return {
        canRetry: false,
        confidence: 'high',
        reason: '连续失败，建议检查根本原因'
      };
    }

    return {
      canRetry: true,
      confidence: 'low',
      reason: '历史数据不足以判断'
    };
  }

  /**
   * 更新配置
   */
  updateConfig(options) {
    if (options.defaultMaxAttempts !== undefined) {
      this.defaultMaxAttempts = options.defaultMaxAttempts;
    }
    if (options.defaultBackoffMs !== undefined) {
      this.defaultBackoffMs = options.defaultBackoffMs;
    }
    if (options.maxBackoffMs !== undefined) {
      this.maxBackoffMs = options.maxBackoffMs;
    }
    if (options.backoffMultiplier !== undefined) {
      this.backoffMultiplier = options.backoffMultiplier;
    }
  }
}

module.exports = { RetryStrategy };
