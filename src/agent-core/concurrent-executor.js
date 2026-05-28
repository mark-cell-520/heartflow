/**
 * 并发执行器 (Concurrent Executor) v1.0.0
 *
 * 支持并行执行多个任务，限制并发数量
 */

class ConcurrentExecutor {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 5;
    this.maxQueueSize = options.maxQueueSize || 100;
    this.timeout = options.timeout || 60000; // 默认超时 60 秒

    this.running = 0;
    this.queue = [];
    this.results = new Map();
    this.errors = new Map();
  }

  /**
   * 并发执行任务
   */
  async execute(tasks, options = {}) {
    const { concurrency = this.maxConcurrency, timeout = this.timeout, stopOnError = false } = options;

    this.running = 0;
    this.results.clear();
    this.errors.clear();

    const promises = [];
    const taskResults = new Map();

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const taskId = task.id || `task-${i}`;

      // 如果达到并发限制，等待
      if (this.running >= concurrency) {
        await this._waitForSlot(concurrency, taskResults, stopOnError);
      }

      // 执行任务
      this.running++;
      const promise = this._executeTask(taskId, task, timeout)
        .then(result => {
          taskResults.set(taskId, { success: true, result });
          this.running--;
        })
        .catch(error => {
          taskResults.set(taskId, { success: false, error: error.message });
          this.errors.set(taskId, error);
          this.running--;
        });

      promises.push(promise);
    }

    // 等待所有完成
    await Promise.all(promises);

    // 转换结果
    return {
      total: tasks.length,
      successful: [...taskResults.values()].filter(r => r.success).length,
      failed: [...taskResults.values()].filter(r => !r.success).length,
      results: Object.fromEntries(taskResults),
      errors: Object.fromEntries(this.errors)
    };
  }

  /**
   * 执行单个任务
   */
  async _executeTask(taskId, task, timeout) {
    const fn = typeof task === 'function' ? task : task.fn;
    const args = task.args || [];
    const taskTimeout = task.timeout || timeout;

    if (typeof fn !== 'function') {
      throw new Error(`Task ${taskId}: fn must be a function`);
    }

    return Promise.race([
      fn(...args),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Task ${taskId} timeout after ${taskTimeout}ms`)), taskTimeout)
      )
    ]);
  }

  /**
   * 等待空闲槽位
   */
  async _waitForSlot(concurrency, results, stopOnError) {
    while (this.running >= concurrency) {
      // 检查是否有失败任务需要停止
      if (stopOnError && this.errors.size > 0) {
        throw new Error('Stopping due to previous error');
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * 并发执行映射
   */
  async map(items, fn, options = {}) {
    const tasks = items.map((item, i) => ({
      id: `item-${i}`,
      fn: () => fn(item),
      timeout: options.timeout
    }));

    return this.execute(tasks, options);
  }

  /**
   * 并发执行 Promise.all
   */
  async all(promises, options = {}) {
    return this.execute(
      promises.map((p, i) => ({
        id: `promise-${i}`,
        fn: () => p
      })),
      options
    );
  }

  /**
   * 竞态执行（返回第一个成功的）
   */
  async race(promises, options = {}) {
    const timeout = options.timeout || this.timeout;

    return Promise.race([
      Promise.allSettled(promises),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Race timeout after ${timeout}ms`)), timeout)
      )
    ]).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled');
      if (successful.length > 0) {
        return successful[0].value;
      }
      throw results[0].reason;
    });
  }

  /**
   * 批量执行（分组）
   */
  async batch(items, batchSize = 10, fn, options = {}) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const batchResult = await this.map(batch, fn, options);
      results.push(batchResult);
    }

    return {
      totalBatches: batches.length,
      batchResults: results,
      combinedResults: results.flatMap(r => Object.values(r.results).map(v => v.result))
    };
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrency: this.maxConcurrency,
      errors: this.errors.size
    };
  }
}

/**
 * 任务链式执行器
 */
class ChainExecutor {
  constructor() {
    this.steps = [];
  }

  /**
   * 添加步骤
   */
  addStep(fn, name) {
    this.steps.push({ fn, name: name || `step-${this.steps.length}` });
    return this;
  }

  /**
   * 执行链
   */
  async execute(initialValue) {
    let value = initialValue;
    const results = [];

    for (const step of this.steps) {
      try {
        value = await step.fn(value);
        results.push({ name: step.name, success: true, value });
      } catch (error) {
        results.push({ name: step.name, success: false, error: error.message });
        throw new Error(`Chain failed at ${step.name}: ${error.message}`);
      }
    }

    return { value, results };
  }

  /**
   * 条件执行
   */
  addConditional(conditionFn, trueChain, falseChain) {
    return this.addStep(async (value) => {
      const condition = await conditionFn(value);
      const chain = condition ? trueChain : falseChain;
      if (!chain) return value;

      let result = value;
      for (const step of chain.steps) {
        result = await step.fn(result);
      }
      return result;
    }, `conditional-${this.steps.length}`);
  }
}

module.exports = { ConcurrentExecutor, ChainExecutor };
