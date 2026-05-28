/**
 * Agent 基类 v1.0.0
 *
 * 所有 Agent 的基类，定义通用接口
 *
 * 设计原则：
 * 1. 每个 Agent 有明确的职责
 * 2. Agent 可以调用工具
 * 3. Agent 有记忆能力
 * 4. Agent 可以被组合使用
 */

const { EventEmitter } = require('events');

class BaseAgent extends EventEmitter {
  constructor(options = {}) {
    super();

    this.name = options.name || 'BaseAgent';
    this.description = options.description || '';
    this.version = options.version || '1.0.0';

    // 工具执行器
    this.dispatcher = options.dispatcher || null;

    // 记忆上下文
    this.context = {
      task: null,
      history: [],
      memories: [],
      toolsUsed: []
    };

    // 状态
    this.state = 'idle';  // idle | working | completed | failed
    this.currentTask = null;
    this.result = null;
  }

  /**
   * 执行任务
   * @param {Object} task - 任务描述
   * @returns {Promise<Object>} 执行结果
   */
  async execute(task) {
    if (this.state === 'working') {
      return {
        success: false,
        error: 'Agent 正在执行任务，请等待完成'
      };
    }

    this.state = 'working';
    this.currentTask = task;
    this.context.task = task;

    this.emit('start', { agent: this.name, task });

    try {
      const result = await this._execute(task);

      this.state = 'completed';
      this.result = result;

      this.emit('complete', { agent: this.name, result });

      return result;
    } catch (error) {
      this.state = 'failed';
      this.result = {
        success: false,
        error: error.message,
        stack: error.stack
      };

      this.emit('error', { agent: this.name, error });

      return this.result;
    }
  }

  /**
   * 具体执行逻辑（子类实现）
   */
  async _execute(task) {
    throw new Error('子类必须实现 _execute 方法');
  }

  /**
   * 调用工具
   */
  async callTool(tool, args) {
    if (!this.dispatcher) {
      return {
        success: false,
        error: 'Agent 未配置工具执行器'
      };
    }

    const result = await this.dispatcher.execute(tool, args);

    this.context.toolsUsed.push({
      tool,
      args,
      result,
      timestamp: new Date().toISOString()
    });

    return result;
  }

  /**
   * 记录步骤到历史
   */
  recordStep(step) {
    this.context.history.push({
      step,
      timestamp: new Date().toISOString(),
      state: this.state
    });
  }

  /**
   * 添加记忆
   */
  addMemory(memory) {
    this.context.memories.push({
      content: memory,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 获取状态摘要
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      currentTask: this.currentTask,
      stepsCount: this.context.history.length,
      toolsUsed: this.context.toolsUsed.length
    };
  }

  /**
   * 重置状态
   */
  reset() {
    this.state = 'idle';
    this.currentTask = null;
    this.result = null;
    this.context = {
      task: null,
      history: [],
      memories: [],
      toolsUsed: []
    };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      name: this.name,
      state: this.state,
      version: this.version,
      dispatcher: this.dispatcher ? 'configured' : 'missing'
    };
  }
}

module.exports = { BaseAgent };
