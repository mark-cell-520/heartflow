/**
 * Agent 循环引擎 (Agent Loop Engine) v1.0.0
 *
 * 支持持续运行、中断、恢复的 Agent Loop
 */

const EventEmitter = require('events');

class AgentLoop extends EventEmitter {
  constructor(agent, options = {}) {
    super();

    this.agent = agent;
    this.options = {
      maxIterations: options.maxIterations || 1000,
      idleTimeout: options.idleTimeout || 300000, // 5 分钟
      activeTimeout: options.activeTimeout || 600000, // 10 分钟
      heartbeatInterval: options.heartbeatInterval || 30000, // 30 秒
      ...options
    };

    // 状态
    this.state = 'idle'; // idle, running, paused, stopped, waiting
    this.iterations = 0;
    this.isRunning = false;
    this.shouldStop = false;
    this.shouldPause = false;
    this.currentTask = null;
    this.lastActivity = Date.now();

    // Loop 控制
    this.heartbeatTimer = null;
    this.idleTimer = null;
    this.activeTimer = null;

    // 输入队列
    this.inputQueue = [];
    this.processing = false;

    // 历史
    this.executionHistory = [];
  }

  /**
   * 启动 Loop
   */
  async start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.shouldStop = false;
    this.shouldPause = false;
    this.iterations = 0;
    this.lastActivity = Date.now();

    // 启动心跳
    this._startHeartbeat();

    // 开始处理循环
    await this._runLoop();


  }

  /**
   * 停止 Loop
   */
  async stop(reason = 'manual') {
    this.shouldStop = true;
    this.isRunning = false;

    this._clearTimers();

    this.state = 'stopped';
    this.emit('stopped', { reason, iterations: this.iterations });
  }

  /**
   * 暂停 Loop
   */
  async pause(reason = 'manual') {
    this.shouldPause = true;
    this.state = 'paused';
    this._clearTimers();

    this.emit('paused', { reason, iterations: this.iterations });
  }

  /**
   * 恢复 Loop
   */
  async resume() {
    if (this.state !== 'paused') {
      return;
    }
    this.shouldPause = false;
    this.state = 'running';
    this._startHeartbeat();

    await this._runLoop();
  }

  /**
   * 中断当前任务
   */
  async interrupt(reason = 'manual') {
    if (this.currentTask) {
      this.currentTask.interrupted = true;
      this.currentTask.interruptReason = reason;

      this.emit('interrupted', {
        task: this.currentTask,
        reason
      });

      return true;
    }
    return false;
  }

  /**
   * 添加输入到队列
   */
  addInput(input) {
    this.inputQueue.push({
      id: `input-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      content: input,
      timestamp: Date.now(),
      priority: 0
    });

    this._resetIdleTimer();
    this.emit('input_added', { input });
  }

  /**
   * 优先级输入
   */
  addPriorityInput(input, priority = 10) {
    this.inputQueue.push({
      id: `input-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      content: input,
      timestamp: Date.now(),
      priority
    });

    // 按优先级排序
    this.inputQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 主循环
   */
  async _runLoop() {
    while (!this.shouldStop && !this.shouldPause) {
      // 检查迭代次数
      if (this.iterations >= this.options.maxIterations) {
        await this.stop('max_iterations');
        break;
      }

      // 检查输入队列
      if (this.inputQueue.length === 0) {
        this.state = 'idle';
        this._resetIdleTimer();

        // 等待输入或超时
        await this._waitForInput();
      }

      if (this.shouldStop || this.shouldPause) break;

      // 获取下一个输入
      const input = this.inputQueue.shift();
      if (!input) continue;

      // 处理输入
      this.state = 'running';
      this.currentTask = input;
      this.lastActivity = Date.now();
      this._resetActiveTimer();

      try {
        await this._processInput(input);
      } catch (error) {
        console.error('[AgentLoop] 处理错误:', error.message);
        this.emit('error', { input, error: error.message });
      }

      this.iterations++;
      this.currentTask = null;
    }
  }

  /**
   * 处理输入
   */
  async _processInput(input) {
    const startTime = Date.now();

    this.emit('task_start', {
      input,
      iteration: this.iterations
    });

    // 检查中断标记
    if (input.interrupted) {
      this.emit('task_interrupted', { input });
      return;
    }

    try {
      // 调用 Agent 处理
      const result = await this.agent.process(input.content, {
        loop: true,
        iteration: this.iterations
      });

      const duration = Date.now() - startTime;

      // 记录历史
      this.executionHistory.push({
        input: input.content,
        success: result.success,
        duration,
        timestamp: Date.now(),
        iteration: this.iterations
      });

      // 限制历史大小
      if (this.executionHistory.length > 1000) {
        this.executionHistory = this.executionHistory.slice(-500);
      }

      this.emit('task_complete', {
        input,
        result,
        duration,
        iteration: this.iterations
      });

      return result;
    } catch (error) {
      this.emit('task_error', {
        input,
        error: error.message,
        iteration: this.iterations
      });

      throw error;
    }
  }

  /**
   * 等待输入
   */
  async _waitForInput() {
    while (this.inputQueue.length === 0 && !this.shouldStop && !this.shouldPause) {
      await this._sleep(100);

      // 检查是否超时
      if (Date.now() - this.lastActivity > this.options.idleTimeout) {
        await this.stop('idle_timeout');
        break;
      }
    }
  }

  /**
   * 启动心跳
   */
  _startHeartbeat() {
    this._clearTimers();

    this.heartbeatTimer = setInterval(() => {
      this.emit('heartbeat', {
        state: this.state,
        iterations: this.iterations,
        queueLength: this.inputQueue.length,
        uptime: Date.now() - this.lastActivity
      });
    }, this.options.heartbeatInterval);
  }

  /**
   * 重置空闲计时器
   */
  _resetIdleTimer() {
    // 空闲计时器在 _waitForInput 中检查
  }

  /**
   * 重置活跃计时器
   */
  _resetActiveTimer() {
    // 活跃计时器用于检测长时间运行的任务
  }

  /**
   * 清除计时器
   */
  _clearTimers() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
  }

  /**
   * 休眠
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      state: this.state,
      isRunning: this.isRunning,
      iterations: this.iterations,
      queueLength: this.inputQueue.length,
      lastActivity: this.lastActivity,
      uptime: this.isRunning ? Date.now() - this.lastActivity : 0,
      currentTask: this.currentTask?.id || null
    };
  }

  /**
   * 获取历史
   */
  getHistory(limit = 50) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * 清空队列
   */
  clearQueue() {
    const cleared = this.inputQueue.length;
    this.inputQueue = [];
    return cleared;
  }
}

/**
 * 任务队列管理器
 */
class TaskQueue extends EventEmitter {
  constructor(options = {}) {
    super();

    this.maxSize = options.maxSize || 1000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000;

    this.tasks = [];
    this.running = new Map();
    this.completed = [];
    this.failed = [];
  }

  /**
   * 添加任务
   */
  add(task) {
    if (this.tasks.length + this.running.size >= this.maxSize) {
      throw new Error('任务队列已满');
    }

    const taskRecord = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...task,
      status: 'pending',
      retries: 0,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null
    };

    this.tasks.push(taskRecord);
    this.emit('task_added', taskRecord);

    return taskRecord;
  }

  /**
   * 获取下一个任务
   */
  next() {
    // 按优先级排序
    this.tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const task = this.tasks.shift();
    if (task) {
      task.status = 'running';
      task.startedAt = Date.now();
      this.running.set(task.id, task);
    }

    return task;
  }

  /**
   * 完成任务
   */
  complete(taskId, result) {
    const task = this.running.get(taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = result;
      this.completed.push(task);
      this.running.delete(taskId);
      this.emit('task_completed', task);
    }
  }

  /**
   * 标记任务失败
   */
  fail(taskId, error) {
    const task = this.running.get(taskId);
    if (task) {
      task.retries++;

      if (task.retries < this.maxRetries) {
        // 重试
        task.status = 'pending';
        task.lastError = error;
        this.tasks.push(task);
        this.running.delete(taskId);

        setTimeout(() => {
          this.emit('task_retry', task);
        }, this.retryDelay);
      } else {
        // 最终失败
        task.status = 'failed';
        task.completedAt = Date.now();
        task.error = error;
        this.failed.push(task);
        this.running.delete(taskId);
        this.emit('task_failed', task);
      }
    }
  }

  /**
   * 取消任务
   */
  cancel(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = this.tasks.splice(index, 1)[0];
      task.status = 'cancelled';
      this.emit('task_cancelled', task);
      return task;
    }
    return null;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      pending: this.tasks.length,
      running: this.running.size,
      completed: this.completed.length,
      failed: this.failed.length,
      total: this.tasks.length + this.running.size + this.completed.length + this.failed.length
    };
  }

  /**
   * 清空已完成
   */
  clearCompleted() {
    const count = this.completed.length;
    this.completed = [];
    return count;
  }
}

module.exports = { AgentLoop, TaskQueue };
