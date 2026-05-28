/**
 * 事务管理器 (Transaction Manager) v1.0.0
 *
 * 支持批量操作和回滚
 */

class TransactionManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.enableRollback = options.enableRollback !== false;
    this.operations = [];
    this.commits = [];
    this.rolledBack = false;
  }

  /**
   * 开始事务
   */
  begin() {
    this.operations = [];
    this.commits = [];
    this.rolledBack = false;
    return this;
  }

  /**
   * 添加操作
   */
  add(operation) {
    if (this.rolledBack) {
      throw new Error('Cannot add operation after rollback');
    }

    this.operations.push({
      id: `op-${this.operations.length}`,
      execute: operation.execute,
      rollback: operation.rollback || (() => {}),
      description: operation.description || `Operation ${this.operations.length}`,
      status: 'pending'
    });

    return this;
  }

  /**
   * 执行事务
   */
  async commit() {
    const results = [];

    for (const op of this.operations) {
      try {
        const result = await this._executeWithRetry(op);
        op.status = 'completed';
        op.result = result;
        results.push({ success: true, result, operation: op.description });
        this.commits.push(op);
      } catch (error) {
        op.status = 'failed';
        op.error = error.message;
        results.push({ success: false, error: error.message, operation: op.description });

        // 回滚
        if (this.enableRollback) {
          await this.rollback();
        }

        throw new Error(`Transaction failed at ${op.description}: ${error.message}`);
      }
    }

    return { success: true, results };
  }

  /**
   * 带重试执行
   */
  async _executeWithRetry(operation, retries = 0) {
    try {
      return await operation.execute();
    } catch (error) {
      if (retries < this.maxRetries) {
        await this._delay(this.retryDelay * (retries + 1));
        return this._executeWithRetry(operation, retries + 1);
      }
      throw error;
    }
  }

  /**
   * 回滚所有操作
   */
  async rollback() {
    if (this.rolledBack) {
      return { rolledBack: false, message: 'Already rolled back' };
    }

    this.rolledBack = true;
    const rolledBack = [];

    // 逆序回滚已提交的操作
    for (const op of [...this.commits].reverse()) {
      try {
        await op.rollback();
        rolledBack.push({ success: true, operation: op.description });
      } catch (error) {
        rolledBack.push({ success: false, operation: op.description, error: error.message });
      }
    }

    return { rolledBack: true, operations: rolledBack };
  }

  /**
   * 延迟
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      totalOperations: this.operations.length,
      committed: this.commits.length,
      rolledBack: this.rolledBack,
      operations: this.operations.map(op => ({
        id: op.id,
        description: op.description,
        status: op.status,
        error: op.error
      }))
    };
  }

  /**
   * 创建快速事务
   */
  static async run(operations, options = {}) {
    const manager = new TransactionManager(options);
    manager.begin();

    for (const op of operations) {
      manager.add(op);
    }

    return manager.commit();
  }
}

/**
 * 操作历史记录器
 */
class OperationHistory {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.operations = [];
  }

  /**
   * 记录操作
   */
  record(operation) {
    const record = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...operation,
      timestamp: Date.now()
    };

    this.operations.push(record);

    // 限制大小
    if (this.operations.length > this.maxSize) {
      this.operations = this.operations.slice(-this.maxSize);
    }

    return record;
  }

  /**
   * 获取历史
   */
  getHistory(filter = {}) {
    let results = [...this.operations];

    if (filter.type) {
      results = results.filter(op => op.type === filter.type);
    }

    if (filter.success !== undefined) {
      results = results.filter(op => op.success === filter.success);
    }

    if (filter.since) {
      results = results.filter(op => op.timestamp >= filter.since);
    }

    return results.slice(-(filter.limit || 100));
  }

  /**
   * 查找相关操作
   */
  findRelated(operationId, similarityFn) {
    const target = this.operations.find(op => op.id === operationId);
    if (!target) return [];

    return this.operations
      .filter(op => op.id !== operationId)
      .map(op => ({
        operation: op,
        similarity: similarityFn(target, op)
      }))
      .filter(r => r.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 获取统计
   */
  getStats() {
    const total = this.operations.length;
    const successful = this.operations.filter(op => op.success).length;
    const failed = total - successful;

    const byType = {};
    for (const op of this.operations) {
      byType[op.type] = (byType[op.type] || 0) + 1;
    }

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : '0%',
      byType
    };
  }

  /**
   * 清空历史
   */
  clear() {
    this.operations = [];
  }
}

module.exports = { TransactionManager, OperationHistory };
