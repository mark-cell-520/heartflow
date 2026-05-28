/**
 * MarkCode v1.0.0 — 独立 Agent 系统
 *
 * 完整 Agent 实现，直接链接 API，具备完整执行能力
 * 对标 Claude Code 功能
 */

const path = require('path');
const { ToolRegistry } = require('./tool-registry.js');
const { ApiClient } = require('./api-client.js');
const { SessionManager } = require('./session-manager.js');
const { MemorySystem } = require('./memory-system.js');
const { TaskRouter } = require('./task-router.js');
const { AgentCoordinator } = require('./agent-coordinator.js');
const { ConcurrentExecutor, ChainExecutor } = require('./concurrent-executor.js');
const { TransactionManager, OperationHistory } = require('./transaction-manager.js');
const { SelfEvaluator, ToolEffectTracker } = require('./self-evaluator.js');
const { EnhancedPlanner, PlanExecutor } = require('./enhanced-planner.js');
const { ResourceManager, BudgetTracker, PriorityQueue } = require('./resource-manager.js');
const { AgentLoop, TaskQueue } = require('./agent-loop.js');
const { AuditLogger, SecurityAuditor } = require('./audit-logger.js');
const { RateLimiter, CircuitBreaker } = require('./rate-limiter.js');
const { ConnectionManager, WebSocketManager } = require('./connection-manager.js');
const { SandboxExecutor, ProcessPool } = require('./sandbox-executor.js');
const { FileWatcher, FileChangeHistory } = require('./file-watcher.js');
const { HooksSystem, HookManager, BuiltInHooks } = require('./hooks-system.js');
const { ConfigManager, SessionRecoveryManager } = require('./config-manager.js');
const { ContextManager, ConversationManager } = require('./context-manager.js');
const { TaskDecomposer, DependencyResolver } = require('./task-decomposer.js');
const { ReflectionEngine, SelfImprover } = require('./reflection-engine.js');

class MarkCode {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      apiType: config.apiType || 'anthropic', // anthropic | openai
      model: config.model || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || 8192,
      temperature: config.temperature || 0.7,
      rootPath: config.rootPath || process.cwd(),
      // 资源限制
      maxContextMessages: config.maxContextMessages || 100,
      maxTokensPerRequest: config.maxTokensPerRequest || 4096,
      maxToolCallsPerTurn: config.maxToolCallsPerTurn || 128,
      maxConcurrency: config.maxConcurrency || 5,
      ...config
    };

    // 核心组件
    this.toolRegistry = new ToolRegistry();
    this.apiClient = new ApiClient(this.config);
    this.session = new SessionManager();
    this.memory = new MemorySystem({ rootPath: this.config.rootPath });
    this.taskRouter = new TaskRouter();
    this.coordinator = new AgentCoordinator(this);

    // API密钥保护存储
    this._apiKey = this.config.apiKey;

    // 上下文管理
    this.contextManager = new ContextManager({
      maxTokens: this.config.maxTokensPerRequest * 50, // 100K 默认
      maxMessages: this.config.maxContextMessages
    });
    this.conversationManager = new ConversationManager();

    // 任务分解器
    this.taskDecomposer = new TaskDecomposer({
      maxDepth: 5,
      maxSteps: 50,
      parallelThreshold: 3
    });
    this.dependencyResolver = new DependencyResolver();

    // 反思引擎
    this.reflectionEngine = new ReflectionEngine({
      maxHistory: 100,
      confidenceThreshold: 0.7
    });
    this.selfImprover = new SelfImprover(this.reflectionEngine);

    // 输出大小限制（防止内存耗尽）
    this.maxOutputSize = config.maxOutputSize || 1024 * 1024; // 1MB 默认

    // 并发执行器
    this.concurrentExecutor = new ConcurrentExecutor({
      maxConcurrency: this.config.maxConcurrency
    });

    // 事务管理器
    this.transactionManager = new TransactionManager();
    this.operationHistory = new OperationHistory();

    // 自我评估器
    this.selfEvaluator = new SelfEvaluator();
    this.toolEffectTracker = new ToolEffectTracker();

    // 增强规划器
    this.planner = new EnhancedPlanner();
    this.planExecutor = new PlanExecutor({ executor: this._executeTask.bind(this) });

    // 资源管理器
    this.resourceManager = new ResourceManager({
      maxConcurrency: this.config.maxConcurrency,
      rateLimit: config.rateLimit || { requests: 60, window: 60000 }
    });
    this.budgetTracker = new BudgetTracker();

    // 任务队列
    this.taskQueue = new PriorityQueue();
    this.backgroundTaskQueue = new TaskQueue();

    // Agent Loop
    this.agentLoop = new AgentLoop(this);

    // 审计日志
    this.auditLogger = new AuditLogger({
      storagePath: path.join(this.config.rootPath, 'data', 'audit')
    });
    this.securityAuditor = new SecurityAuditor(this.auditLogger);

    // 速率限制
    this.rateLimiter = new RateLimiter({
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 60000
    });
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000
    });

    // 连接管理
    this.connectionManager = new ConnectionManager();
    this.wsManager = new WebSocketManager();

    // 沙箱执行
    this.sandboxExecutor = new SandboxExecutor({
      workDir: path.join(this.config.rootPath, '.sandbox')
    });
    this.processPool = new ProcessPool({ maxProcesses: this.config.maxConcurrency || 5 });

    // 文件监听
    this.fileWatcher = new FileWatcher();
    this.fileChangeHistory = new FileChangeHistory();

    // Hooks 系统
    this.hooks = new HooksSystem();
    this.hookManager = new HookManager();

    // 配置管理
    this.configManager = new ConfigManager({ rootPath: this.config.rootPath });
    this.sessionRecovery = new SessionRecoveryManager({ storagePath: path.join(this.config.rootPath, 'data', 'sessions') });

    // 状态
    this.currentTask = null;
    this.isRunning = false;
    this.isInitialized = false;
    this.messageHistory = [];
    this.turnCount = 0;

    // MCP 支持
    this.mcpServers = new Map();
  }

  /**
   * 初始化 Agent
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('[MarkCode] 初始化中...');
    await this.memory.initialize();
    this.session.start({ mode: 'agent' });
    this.isInitialized = true;
    console.log('[MarkCode] 初始化完成');
    return this;
  }

  /**
   * 启动 Agent（向后兼容）
   */
  async start() {
    return this.initialize();
  }

  /**
   * 停止 Agent
   */
  async stop() {
    console.log('[MarkCode] 停止中...');
    this.isRunning = false;
    this.isInitialized = false;
    await this.memory.persist();
    this.session.end();
    console.log('[MarkCode] 停止完成');
  }

  /**
   * 处理用户输入
   */
  async process(input, options = {}) {
    if (!this.isInitialized) await this.initialize();
    this.isRunning = true;
    this.turnCount++;

    const context = {
      sessionId: this.session.id,
      timestamp: Date.now(),
      turnCount: this.turnCount,
      options
    };

    // 1. 解析任务
    const task = await this.taskRouter.route(input, context);

    // 2. 检查资源
    const canExecute = this.resourceManager.canExecute();
    if (!canExecute.allowed) {
      return {
        success: false,
        error: canExecute.reason,
        task
      };
    }

    // 3. 获取执行令牌
    const token = await this.resourceManager.acquire({});
    if (!token.success) {
      return { success: false, error: token.reason, task };
    }

    try {
      // 4. 规划执行步骤
      const plan = await this.coordinator.plan(task);

      // 5. 执行计划（带自我评估）
      const result = await this._executeWithEvaluation(plan);

      // 6. 记录到历史
      this._addToHistory(input, result);

      // 7. 返回结果
      return {
        success: result.success,
        output: result.output,
        task,
        steps: result.steps,
        evaluation: result.evaluation,
        metadata: {
          duration: result.duration,
          toolsUsed: result.toolsUsed,
          sessionId: this.session.id,
          turnCount: this.turnCount
        }
      };
    } finally {
      token.release();
    }
  }

  /**
   * 带评估的执行
   */
  async _executeWithEvaluation(plan) {
    // 使用事务管理器执行
    this.transactionManager.begin();

    const result = await this.coordinator.execute(plan);

    // 评估结果
    const evaluation = this.selfEvaluator.evaluate(result, {
      toolName: plan.steps?.[0]?.tool
    });

    // 决定是否需要重试
    const retry = this.selfEvaluator.shouldRetry(evaluation);

    if (retry.shouldRetry && plan.steps?.length > 1) {
      // 重试执行
      console.log(`[MarkCode] 评估分数 ${evaluation.score}，尝试替代方案...`);
      const altResult = await this._executeAlternative(plan);
      return { ...altResult, evaluation };
    }

    return { ...result, evaluation };
  }

  /**
   * 执行替代方案
   */
  async _executeAlternative(plan) {
    // 生成替代执行计划
    const alternativeSteps = plan.steps.map(step => ({
      ...step,
      tool: step.tool === 'bash' ? 'bash' : step.tool,
      description: `[重试] ${step.description}`
    }));

    return this.coordinator.execute({
      ...plan,
      steps: alternativeSteps
    });
  }

  /**
   * 执行单个任务
   */
  async _executeTask(task, context) {
    const result = await this.toolRegistry.execute(task, context);
    return result;
  }

  /**
   * 并发执行多个任务
   */
  async executeConcurrent(tasks, options = {}) {
    return this.concurrentExecutor.execute(tasks, options);
  }

  /**
   * 链式执行任务
   */
  async executeChain(steps) {
    const chain = new ChainExecutor();
    for (const step of steps) {
      chain.addStep(step.fn, step.name);
    }
    return chain.execute();
  }

  /**
   * 创建并执行计划
   */
  async createAndExecutePlan(goal, context = {}) {
    // 创建计划
    const plan = await this.planner.createPlan(goal, context);

    if (!plan.validation.valid) {
      return {
        success: false,
        error: `计划验证失败: ${plan.validation.issues.join(', ')}`,
        plan
      };
    }

    // 执行计划
    const result = await this.planExecutor.execute(plan, context);

    return {
      success: result.success,
      plan,
      result,
      stats: {
        planner: this.planner.getStats(),
        evaluator: this.selfEvaluator.getStats(),
        resources: this.resourceManager.getStats()
      }
    };
  }

  /**
   * 流式处理输入
   */
  async processStream(input, options = {}) {
    if (!this.isInitialized) await this.initialize();
    this.isRunning = true;
    this.turnCount++;

    const context = {
      sessionId: this.session.id,
      timestamp: Date.now(),
      turnCount: this.turnCount,
      options,
      stream: true
    };

    // 构建消息
    const messages = [
      { role: 'user', content: input }
    ];

    // 限制上下文
    const limitedMessages = this._limitContext(messages);

    // 发送流式请求
    const tools = this.toolRegistry.getAllTools();
    let fullContent = '';

    const result = await this.apiClient.sendStream(
      limitedMessages,
      tools,
      { model: this.config.model, maxTokens: this.config.maxTokens },
      (chunk) => {
        // 处理流式块
        if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'thinking_delta') {
            // 思考内容（不输出）
          } else if (chunk.delta.type === 'text_delta') {
            fullContent += chunk.delta.text;
          }
        } else if (chunk.type === 'content_block_start') {
          if (chunk.content_block.type === 'tool_use') {
            fullContent += `\n**[工具调用]** ${chunk.content_block.name}\n`;
          }
        }
      }
    );

    // 返回结果
    return {
      success: result.success,
      output: fullContent,
      metadata: {
        sessionId: this.session.id,
        turnCount: this.turnCount
      }
    };
  }

  /**
   * 限制上下文长度
   */
  _limitContext(messages, maxMessages = null) {
    const limit = maxMessages || this.config.maxContextMessages;
    if (messages.length <= limit) return messages;

    // 保留系统消息和最新的消息
    const systemMsg = messages.find(m => m.role === 'system');
    const others = messages.filter(m => m.role !== 'system');

    return [
      ...(systemMsg ? [systemMsg] : []),
      ...others.slice(-limit)
    ];
  }

  /**
   * 添加到历史
   */
  _addToHistory(input, result) {
    this.messageHistory.push({
      role: 'user',
      content: input,
      timestamp: Date.now()
    });

    // 限制输出大小，防止内存耗尽
    let safeOutput = result.output;
    if (safeOutput && safeOutput.length > this.maxOutputSize) {
      safeOutput = safeOutput.slice(0, this.maxOutputSize) + '\n...[输出已截断，超大小限制]';
    }

    this.messageHistory.push({
      role: 'assistant',
      content: safeOutput,
      success: result.success,
      timestamp: Date.now()
    });

    // 限制历史长度
    const maxHistory = this.config.maxContextMessages * 2;
    if (this.messageHistory.length > maxHistory) {
      this.messageHistory = this.messageHistory.slice(-maxHistory);
    }

    // 记录回合
    this.session.recordTurn(input, safeOutput || '', {
      success: result.success,
      toolsUsed: result.toolsUsed
    });
  }

  /**
   * 发送消息到 API（带速率限制和断路器）
   */
  async sendToApi(messages, tools = []) {
    const limitedMessages = this._limitContext(messages);

    // 检查预算
    const budgetCheck = this.budgetTracker.canContinue(this.config.maxTokensPerRequest);
    if (!budgetCheck.allowed) {
      return { success: false, error: budgetCheck.reason };
    }

    // 使用断路器执行
    const result = await this.circuitBreaker.execute(async () => {
      // 使用速率限制执行
      return this.rateLimiter.execute('api', async () => {
        const startTime = Date.now();
        const result = await this.apiClient.send(limitedMessages, tools);

        // 更新速率限制
        if (result.headers) {
          this.rateLimiter.updateLimit('api', result.headers);
        }

        // 记录审计日志
        if (result.usage) {
          this.auditLogger.logApiCall(
            this.config.apiType,
            this.config.model,
            result.usage.input_tokens,
            result.usage.output_tokens,
            { duration: Date.now() - startTime, sessionId: this.session.id }
          );
        }

        return result;
      });
    });

    // 记录 token 使用
    if (result.usage) {
      this.budgetTracker.consume(
        result.usage.input_tokens + result.usage.output_tokens,
        'api_call'
      );
      this.resourceManager.recordTokens(
        result.usage.input_tokens,
        result.usage.output_tokens
      );
    }

    return result;
  }

  /**
   * 注册 MCP 服务器
   */
  registerMcpServer(name, server) {
    // 验证名称：只允许字母、数字、下划线、连字符
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error(`MCP服务器名称无效: ${name}，只允许字母、数字、下划线、连字符`);
    }
    this.mcpServers.set(name, server);
    console.log('[MarkCode] MCP 服务器注册:', name);
  }

  /**
   * 获取工具注册表
   */
  getTools() {
    const tools = this.toolRegistry.getAllTools();

    // 添加 MCP 工具
    for (const [name, server] of this.mcpServers) {
      if (server.tools) {
        for (const tool of server.tools) {
          tools.push({
            name: `mcp_${name}_${tool.name}`,
            description: `[MCP:${name}] ${tool.description}`,
            input_schema: tool.inputSchema
          });
        }
      }
    }

    return tools;
  }

  /**
   * 注册自定义工具
   */
  registerTool(tool) {
    this.toolRegistry.register(tool);
  }

  /**
   * 获取会话历史
   */
  getHistory(limit = 50) {
    return this.messageHistory.slice(-limit);
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const apiHealth = await this.apiClient.healthCheck();

    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      sessionId: this.session.id,
      turnCount: this.turnCount,
      messageCount: this.messageHistory.length,
      toolCount: this.toolRegistry.count(),
      mcpServers: [...this.mcpServers.keys()],
      memory: this.memory.getStats(),
      resources: this.resourceManager.healthCheck(),
      budget: this.budgetTracker.getStatus(),
      operations: this.operationHistory.getStats(),
      agentLoop: this.agentLoop.getStatus(),
      rateLimiter: this.rateLimiter.getStatus(),
      circuitBreaker: this.circuitBreaker.getStatus(),
      connection: this.connectionManager.getStatus(),
      audit: this.auditLogger.getStats(),
      sandbox: this.sandboxExecutor.getStatus(),
      processPool: this.processPool.getStatus(),
      fileWatcher: this.fileWatcher.getStatus(),
      hooks: this.hooks.getStats(),
      // 新增组件
      contextManager: this.contextManager.getStats(),
      conversationManager: this.conversationManager.getStats(),
      reflectionEngine: this.reflectionEngine.getStats(),
      selfImprover: this.selfImprover.getStats(),
      api: apiHealth
    };
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      sessionId: this.session.id,
      currentTask: this.currentTask,
      messageCount: this.messageHistory.length,
      toolCount: this.toolRegistry.count(),
      memory: this.memory.getStats(),
      resources: this.resourceManager.getStats(),
      budget: this.budgetTracker.getStatus(),
      operations: this.operationHistory.getStats(),
      evaluator: this.selfEvaluator.getStats(),
      sandbox: this.sandboxExecutor.getStatus(),
      fileWatcher: this.fileWatcher.getStatus(),
      hooks: this.hooks.getStats(),
      // 新增组件
      contextManager: this.contextManager.getStats(),
      reflectionEngine: this.reflectionEngine.getStats()
    };
  }

  /**
   * 重置会话
   */
  async resetSession() {
    this.messageHistory = [];
    this.turnCount = 0;
    this.session.end();
    this.session.start({ mode: 'agent', reset: true });
    this.budgetTracker.reset();
    console.log('[MarkCode] 会话已重置');
  }

  /**
   * 导出状态（不包含敏感信息）
   */
  exportState() {
    return {
      config: {
        apiType: this.config.apiType,
        model: this.config.model
      },
      sessionId: this.session.id,
      turnCount: this.turnCount,
      messageCount: this.messageHistory.length,
      memoryStats: this.memory.getStats(),
      resourceStats: this.resourceManager.getStats(),
      budgetStatus: this.budgetTracker.getStatus(),
      timestamp: Date.now()
    };
  }

  /**
   * 安全获取API密钥（不暴露在日志中）
   */
  getApiKey() {
    return this._apiKey;
  }

  // ========== 任务分解 ==========

  /**
   * 分解复杂任务
   */
  decomposeTask(task, context = {}) {
    const decomposition = this.taskDecomposer.decompose(task, {
      ...context,
      sessionId: this.session.id
    });

    // 构建依赖图
    this.dependencyResolver.buildGraph(decomposition.steps);

    // 检测循环依赖
    const cycles = this.dependencyResolver.detectCycles();
    if (cycles.length > 0) {
      console.warn('[MarkCode] 检测到循环依赖:', cycles);
    }

    return {
      ...decomposition,
      executionOrder: this.dependencyResolver.getExecutionOrder(),
      parallelSteps: this.dependencyResolver.getParallelSteps(),
      hasCycles: cycles.length > 0
    };
  }

  /**
   * 获取可并行执行的步骤
   */
  getParallelSteps(steps) {
    this.dependencyResolver.buildGraph(steps);
    return this.dependencyResolver.getParallelSteps();
  }

  // ========== 反思引擎 ==========

  /**
   * 反思执行结果
   */
  reflect(execution, context = {}) {
    return this.reflectionEngine.reflect(execution, {
      ...context,
      sessionId: this.session.id
    });
  }

  /**
   * 批量反思
   */
  reflectBatch(executions, context = {}) {
    return this.reflectionEngine.reflectBatch(executions, context);
  }

  /**
   * 获取反思历史
   */
  getReflectionHistory(limit = 20) {
    return this.reflectionEngine.getHistory(limit);
  }

  /**
   * 获取反思统计
   */
  getReflectionStats() {
    return this.reflectionEngine.getStats();
  }

  /**
   * 查找类似反思
   */
  findSimilarReflection(reflection) {
    return this.reflectionEngine.findSimilar(reflection);
  }

  /**
   * 生成自我改进
   */
  generateImprovement(reflection) {
    return this.selfImprover.generateImprovement(reflection);
  }

  /**
   * 应用改进
   */
  applyImprovement(improvement) {
    return this.selfImprover.applyImprovement(improvement);
  }

  /**
   * 获取改进历史
   */
  getImprovements(limit = 10) {
    return this.selfImprover.getImprovements(limit);
  }

  // ========== 上下文管理 ==========

  /**
   * 添加消息到上下文
   */
  addContextMessage(role, content, metadata = {}) {
    return this.contextManager.addMessage(role, content, metadata);
  }

  /**
   * 设置系统提示
   */
  setSystemPrompt(prompt) {
    return this.contextManager.setSystemPrompt(prompt);
  }

  /**
   * 获取上下文
   */
  getContext(maxTokens = null) {
    return this.contextManager.getContext(maxTokens);
  }

  /**
   * 获取上下文统计
   */
  getContextStats() {
    return this.contextManager.getStats();
  }

  /**
   * 搜索上下文历史
   */
  searchContext(query) {
    return this.contextManager.search(query);
  }

  /**
   * 清空上下文历史
   */
  clearContextHistory(keepSystem = true) {
    return this.contextManager.clearHistory(keepSystem);
  }

  // ========== 对话管理 ==========

  /**
   * 创建新对话
   */
  createConversation(metadata = {}) {
    return this.conversationManager.createConversation(metadata);
  }

  /**
   * 切换对话
   */
  switchConversation(id) {
    return this.conversationManager.switchConversation(id);
  }

  /**
   * 删除对话
   */
  deleteConversation(id) {
    return this.conversationManager.deleteConversation(id);
  }

  /**
   * 列出对话
   */
  listConversations(limit = 20) {
    return this.conversationManager.listConversations(limit);
  }

  /**
   * 获取当前对话
   */
  getCurrentConversation() {
    return this.conversationManager.getCurrentConversation();
  }
}

/**
 * 创建 Agent 实例
 */
async function createAgent(config = {}) {
  const agent = new MarkCode(config);
  await agent.initialize();
  return agent;
}

module.exports = { MarkCode, createAgent };
