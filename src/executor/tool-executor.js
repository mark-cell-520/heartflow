/**
 * 工具执行器 (Tool Executor) v1.0.0
 *
 * 心虫的执行能力核心
 *
 * 设计原则：
 * 1. 统一接口：所有工具有相同的调用方式
 * 2. 错误封装：所有错误都返回结构化结果
 * 3. 权限控制：危险操作需要确认
 * 4. 结果记录：每次执行都记录到记忆
 *
 * 工具类型：
 * - bash: 执行命令行
 * - file: 文件操作
 * - search: 代码搜索
 * - process: 进程管理
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class ToolExecutor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.rootPath = options.rootPath || process.cwd();

    // 工具注册表
    this.tools = new Map();

    // 执行历史
    this.history = [];

    // 最大历史记录
    this.maxHistory = 100;

    // 初始化内置工具
    this._registerBuiltinTools();
  }

  /**
   * 注册工具
   * @param {string} name - 工具名称
   * @param {Object} tool - 工具对象
   */
  register(name, tool) {
    this.tools.set(name, {
      name,
      description: tool.description || '',
      args: tool.args || {},
      execute: tool.execute.bind(tool),
      danger: tool.danger || 0,  // 0-10，危险等级
      requiresConfirmation: tool.requiresConfirmation || false
    });
    console.log(`[ToolExecutor] 已注册工具: ${name}`);
  }

  /**
   * 执行工具
   * @param {string} name - 工具名称
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async execute(name, args = {}) {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `工具不存在: ${name}`,
        availableTools: Array.from(this.tools.keys())
      };
    }

    // 验证参数
    const validation = this._validateArgs(tool.args, args);
    if (!validation.valid) {
      return {
        success: false,
        error: `参数错误: ${validation.message}`,
        requiredArgs: Object.keys(tool.args)
      };
    }

    // 记录执行开始
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startTime = Date.now();

    this.emit('execution:start', { executionId, name, args });

    try {
      // 执行工具
      const result = await tool.execute(args, {
        executor: this,
        executionId,
        rootPath: this.rootPath
      });

      const duration = Date.now() - startTime;

      // 记录历史
      this._recordExecution({
        executionId,
        name,
        args,
        result,
        duration,
        success: result.success !== false,
        timestamp: new Date().toISOString()
      });

      this.emit('execution:complete', { executionId, name, result, duration });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      const errorResult = {
        success: false,
        error: error.message,
        stack: error.stack,
        executionId
      };

      // 记录错误
      this._recordExecution({
        executionId,
        name,
        args,
        result: errorResult,
        duration,
        success: false,
        timestamp: new Date().toISOString(),
        error: true
      });

      this.emit('execution:error', { executionId, name, error });

      return errorResult;
    }
  }

  /**
   * 验证参数
   */
  _validateArgs(schema, args) {
    for (const [key, spec] of Object.entries(schema)) {
      // 必需参数检查
      if (spec.required && !(key in args)) {
        return { valid: false, message: `缺少必需参数: ${key}` };
      }

      // 类型检查
      if (key in args && spec.type) {
        const actualType = typeof args[key];
        if (actualType !== spec.type && args[key] !== null) {
          return { valid: false, message: `${key} 应为 ${spec.type}，实际为 ${actualType}` };
        }
      }
    }
    return { valid: true };
  }

  /**
   * 记录执行历史
   */
  _recordExecution(record) {
    this.history.push(record);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  /**
   * 获取执行历史
   */
  getHistory(filter = {}) {
    let history = this.history;

    if (filter.tool) {
      history = history.filter(h => h.name === filter.tool);
    }

    if (filter.successful !== undefined) {
      history = history.filter(h => h.success === filter.successful);
    }

    if (filter.since) {
      history = history.filter(h => new Date(h.timestamp) >= new Date(filter.since));
    }

    return history;
  }

  /**
   * 获取工具列表
   */
  listTools() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      args: tool.args,
      danger: tool.danger
    }));
  }

  /**
   * 获取工具详情
   */
  getTool(name) {
    const tool = this.tools.get(name);
    if (!tool) return null;

    return {
      name: tool.name,
      description: tool.description,
      args: tool.args,
      danger: tool.danger,
      requiresConfirmation: tool.requiresConfirmation
    };
  }

  /**
   * 注册内置工具
   */
  _registerBuiltinTools() {
    // 内置工具在此加载
    // 具体工具实现在 tools/ 目录
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      status: 'healthy',
      toolsCount: this.tools.size,
      historyCount: this.history.length,
      tools: this.listTools().map(t => t.name)
    };
  }
}

module.exports = { ToolExecutor };
