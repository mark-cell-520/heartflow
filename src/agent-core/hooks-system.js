/**
 * Hooks 系统 (Hooks System) v1.0.0
 *
 * PreToolUse, PostToolUse, Stop 等钩子支持
 */

const EventEmitter = require('events');

class HooksSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    this.hooks = {
      preToolUse: [],   // 工具执行前
      postToolUse: [],  // 工具执行后
      preApiCall: [],   // API 调用前
      postApiCall: [],   // API 调用后
      preTask: [],      // 任务执行前
      postTask: [],     // 任务执行后
      onError: [],      // 错误处理
      onStop: [],       // 停止前
      onStart: []       // 启动时
    };

    this.hookTimeout = options.hookTimeout || 5000; // 5 秒超时
    this.enabled = true;
  }

  /**
   * 注册钩子
   */
  register(hookType, fn, options = {}) {
    if (!this.hooks[hookType]) {
      throw new Error(`未知的钩子类型: ${hookType}`);
    }

    const hook = {
      id: `hook-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      fn,
      options: {
        async: options.async !== false,
        once: options.once || false,
        priority: options.priority || 0,
        timeout: options.timeout || this.hookTimeout
      },
      called: 0
    };

    // 按优先级排序
    this.hooks[hookType].push(hook);
    this.hooks[hookType].sort((a, b) => b.options.priority - a.options.priority);

    return hook.id;
  }

  /**
   * 取消注册
   */
  unregister(hookType, hookId) {
    if (!this.hooks[hookType]) return false;

    const index = this.hooks[hookType].findIndex(h => h.id === hookId);
    if (index !== -1) {
      this.hooks[hookType].splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 触发钩子
   */
  async trigger(hookType, context = {}) {
    if (!this.enabled) return context;
    if (!this.hooks[hookType]) return context;

    const hooks = this.hooks[hookType];
    let result = context;

    for (const hook of hooks) {
      if (hook.options.once && hook.called > 0) {
        continue;
      }

      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`钩子超时: ${hookType}`)), hook.options.timeout);
        });

        if (hook.options.async) {
          const resultPromise = Promise.resolve(hook.fn(result, context));
          result = await Promise.race([resultPromise, timeoutPromise]);
        } else {
          result = hook.fn(result, context);
        }

        hook.called++;
      } catch (error) {
        console.error(`[Hooks] 钩子执行失败 (${hookType}):`, error.message);
        this.emit('error', { hookType, hook, error: error.message });

        // 如果是致命错误，抛出
        if (this.options.failOnError) {
          throw error;
        }
      }
    }

    return result;
  }

  /**
   * PreToolUse - 工具执行前
   */
  async preToolUse(toolName, input, context = {}) {
    return this.trigger('preToolUse', { toolName, input, context });
  }

  /**
   * PostToolUse - 工具执行后
   */
  async postToolUse(toolName, input, result, context = {}) {
    return this.trigger('postToolUse', { toolName, input, result, context });
  }

  /**
   * PreApiCall - API 调用前
   */
  async preApiCall(messages, tools, options = {}) {
    return this.trigger('preApiCall', { messages, tools, options });
  }

  /**
   * PostApiCall - API 调用后
   */
  async postApiCall(messages, tools, response, options = {}) {
    return this.trigger('postApiCall', { messages, tools, response, options });
  }

  /**
   * PreTask - 任务执行前
   */
  async preTask(task, context = {}) {
    return this.trigger('preTask', { task, context });
  }

  /**
   * PostTask - 任务执行后
   */
  async postTask(task, result, context = {}) {
    return this.trigger('postTask', { task, result, context });
  }

  /**
   * OnError - 错误处理
   */
  async onError(error, context = {}) {
    return this.trigger('onError', { error: error.message, stack: error.stack, context });
  }

  /**
   * OnStop - 停止前
   */
  async onStop(context = {}) {
    return this.trigger('onStop', context);
  }

  /**
   * OnStart - 启动时
   */
  async onStart(context = {}) {
    return this.trigger('onStart', context);
  }

  /**
   * 获取钩子列表
   */
  getHooks(hookType) {
    if (!hookType) {
      return this.hooks;
    }
    return this.hooks[hookType] || [];
  }

  /**
   * 获取钩子统计
   */
  getStats() {
    const stats = {};
    for (const [type, hooks] of Object.entries(this.hooks)) {
      stats[type] = {
        count: hooks.length,
        totalCalls: hooks.reduce((sum, h) => sum + h.called, 0)
      };
    }
    return stats;
  }

  /**
   * 清空钩子
   */
  clear(hookType = null) {
    if (hookType) {
      this.hooks[hookType] = [];
    } else {
      for (const type of Object.keys(this.hooks)) {
        this.hooks[type] = [];
      }
    }
  }

  /**
   * 启用/禁用
   */
  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

/**
 * 内置钩子
 */
const BuiltInHooks = {
  /**
   * 日志钩子
   */
  createLoggerHook() {
    return {
      preToolUse: (context) => {
        console.log(`[Hooks] 执行工具: ${context.toolName}`, context.input);
        return context;
      },
      postToolUse: (context) => {
        console.log(`[Hooks] 工具完成: ${context.toolName}`, context.result.success ? '成功' : '失败');
        return context;
      }
    };
  },

  /**
   * 统计钩子
   */
  createStatsHook() {
    const stats = { toolCalls: 0, apiCalls: 0, errors: 0 };

    return {
      preToolUse: (context) => {
        stats.toolCalls++;
        return context;
      },
      preApiCall: (context) => {
        stats.apiCalls++;
        return context;
      },
      onError: (context) => {
        stats.errors++;
        return context;
      },
      getStats: () => ({ ...stats })
    };
  },

  /**
   * 限流钩子
   */
  createRateLimitHook(options = {}) {
    const { maxToolCallsPerSecond = 10, maxApiCallsPerMinute = 60 } = options;
    let toolCalls = 0;
    let apiCalls = [];
    let lastReset = Date.now();

    return {
      preToolUse: async (context) => {
        const now = Date.now();
        if (now - lastReset > 1000) {
          toolCalls = 0;
          lastReset = now;
        }

        if (toolCalls >= maxToolCallsPerSecond) {
          throw new Error('工具调用超过限制');
        }
        toolCalls++;
        return context;
      },
      preApiCall: async (context) => {
        const now = Date.now();
        apiCalls = apiCalls.filter(t => now - t < 60000);
        apiCalls.push(now);

        if (apiCalls.length >= maxApiCallsPerMinute) {
          throw new Error('API 调用超过限制');
        }
        return context;
      }
    };
  },

  /**
   * 验证钩子
   */
  createValidationHook(schema) {
    return {
      preToolUse: (context) => {
        if (schema[context.toolName]) {
          // 验证输入
          const validate = schema[context.toolName];
          if (validate.input && !validate.input(context.input)) {
            throw new Error(`输入验证失败: ${context.toolName}`);
          }
        }
        return context;
      }
    };
  }
};

/**
 * 钩子管理器
 */
class HookManager {
  constructor() {
    this.globalHooks = new HooksSystem();
    this.toolHooks = new Map();
    this.apiHooks = new Map();
  }

  /**
   * 全局钩子
   */
  getGlobal() {
    return this.globalHooks;
  }

  /**
   * 工具专用钩子
   */
  getToolHooks(toolName) {
    if (!this.toolHooks.has(toolName)) {
      this.toolHooks.set(toolName, new HooksSystem());
    }
    return this.toolHooks.get(toolName);
  }

  /**
   * API 专用钩子
   */
  getApiHooks(apiName) {
    if (!this.apiHooks.has(apiName)) {
      this.apiHooks.set(apiName, new HooksSystem());
    }
    return this.apiHooks.get(apiName);
  }

  /**
   * 综合触发
   */
  async triggerForTool(toolName, phase, context) {
    // 先触发全局
    context = await this.globalHooks.trigger(phase, context);

    // 再触发工具专用
    const toolHook = this.toolHooks.get(toolName);
    if (toolHook) {
      context = await toolHook.trigger(phase, context);
    }

    return context;
  }

  /**
   * 综合触发（API）
   */
  async triggerForApi(apiName, phase, context) {
    context = await this.globalHooks.trigger(phase, context);

    const apiHook = this.apiHooks.get(apiName);
    if (apiHook) {
      context = await apiHook.trigger(phase, context);
    }

    return context;
  }
}

module.exports = { HooksSystem, HookManager, BuiltInHooks };
