/**
 * 任务管道 (Task Pipeline) v1.0.0
 *
 * 心虫的执行核心：接收任务 → 分析 → 规划 → 执行 → 验证
 *
 * 设计原则：
 * 1. 完整流程：思考→规划→执行→验证
 * 2. 可中断：每个阶段可暂停
 * 3. 可回溯：失败可返回上一步
 * 4. 记忆化：每个步骤都记录
 */

const { AgentFactory } = require('../agents/agent-factory');
const { IdentityCore } = require('../identity/identity-core');

class TaskPipeline {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();

    // 身份核心
    this.identityCore = new IdentityCore(this.rootPath);

    // Agent 工厂
    this.agentFactory = new AgentFactory({
      rootPath: this.rootPath
    });

    // 当前任务状态
    this.currentTask = null;
    this.pipelineState = 'idle';  // idle | analyzing | planning | executing | verifying | completed | failed

    // 执行历史
    this.history = [];
    this.maxHistory = 50;
  }

  /**
   * 初始化
   */
  async initialize() {
    // 启动身份核心
    this.identityCore.boot();

    console.log('[TaskPipeline] 初始化完成');
    console.log('[TaskPipeline] 身份:', this.identityCore.getIdentitySummary());
  }

  /**
   * 处理用户任务
   */
  async handleTask(taskInput) {
    const taskId = `task-${Date.now()}`;
    const startTime = Date.now();

    this.currentTask = {
      id: taskId,
      input: taskInput,
      state: 'analyzing',
      startTime
    };

    // 记录到历史
    this._recordToHistory({
      type: 'start',
      taskId,
      input: taskInput,
      timestamp: new Date().toISOString()
    });

    try {
      // 阶段 1: 分析
      this.pipelineState = 'analyzing';
      const analysis = await this._analyzeTask(taskInput);
      this.currentTask.analysis = analysis;

      // 阶段 2: 规划
      this.pipelineState = 'planning';
      const plan = await this._planTask(taskInput, analysis);
      this.currentTask.plan = plan;

      // 阶段 3: 执行
      this.pipelineState = 'executing';
      const execution = await this._executeTask(plan);
      this.currentTask.execution = execution;

      // 阶段 4: 验证
      this.pipelineState = 'verifying';
      const verification = await this._verifyResult(execution);
      this.currentTask.verification = verification;

      // 完成
      this.pipelineState = 'completed';
      const duration = Date.now() - startTime;

      const result = {
        success: true,
        taskId,
        analysis,
        plan,
        execution,
        verification,
        duration,
        pipelineState: this.pipelineState
      };

      // 记录到历史
      this._recordToHistory({
        type: 'completed',
        taskId,
        result,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      this.pipelineState = 'failed';

      const result = {
        success: false,
        taskId,
        error: error.message,
        pipelineState: this.pipelineState,
        currentTask: this.currentTask,
        duration: Date.now() - startTime
      };

      // 记录到历史
      this._recordToHistory({
        type: 'failed',
        taskId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return result;
    }
  }

  /**
   * 阶段 1: 分析任务
   */
  async _analyzeTask(taskInput) {
    console.log('[TaskPipeline] 阶段 1: 分析任务');

    // 使用 Agent 工厂的任务分类
    const agent = this.agentFactory.get('planner');
    if (!agent) {
      return { summary: '无法获取规划 Agent', type: 'unknown' };
    }

    // 简单的任务分析
    const description = taskInput.description || taskInput.text || taskInput;

    return {
      summary: description,
      type: this._classifyTask(description),
      length: description.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 阶段 2: 规划任务
   */
  async _planTask(taskInput, analysis) {
    console.log('[TaskPipeline] 阶段 2: 规划任务');

    // 简单任务直接跳过规划
    if (analysis.type === 'simple' || analysis.type === 'execution') {
      return {
        skipPlanning: true,
        reason: '简单任务不需要详细规划',
        timestamp: new Date().toISOString()
      };
    }

    // 调用规划 Agent
    const planner = this.agentFactory.get('planner');
    const planResult = await planner.execute({
      description: taskInput.description || taskInput.text || taskInput,
      type: 'planning'
    });

    return planResult;
  }

  /**
   * 阶段 3: 执行任务
   */
  async _executeTask(plan) {
    console.log('[TaskPipeline] 阶段 3: 执行任务');

    // 如果跳过了规划，直接执行
    if (plan.skipPlanning) {
      const executor = this.agentFactory.get('executor');
      const execResult = await executor.execute({
        description: this.currentTask.input.description || this.currentTask.input.text || this.currentTask.input,
        command: this.currentTask.input.description || this.currentTask.input.text || this.currentTask.input
      });
      return execResult;
    }

    // 执行计划中的步骤
    if (plan.plan && plan.plan.steps) {
      const executor = this.agentFactory.get('executor');
      const execResult = await executor.execute({
        description: this.currentTask.input.description,
        steps: plan.plan.steps.map(step => ({
          type: step.action,
          description: step.description,
          tool: step.tool,
          args: step.args || {}
        }))
      });
      return execResult;
    }

    return {
      success: false,
      error: '无法执行：没有可执行的计划'
    };
  }

  /**
   * 阶段 4: 验证结果
   */
  async _verifyResult(execution) {
    console.log('[TaskPipeline] 阶段 4: 验证结果');

    // 获取验证器
    const executorAgent = this.agentFactory.get('executor');
    const stats = executorAgent?.getStats() || {};

    // 详细验证
    const verification = {
      success: execution.success !== false,
      executionSuccess: execution.success,
      verified: true,
      timestamp: new Date().toISOString(),
      stats: stats,
      executionDetails: execution.summary || null
    };

    // 如果执行失败且有重试信息
    if (!execution.success && execution.results) {
      verification.failedSteps = execution.results
        .filter(r => !r.success)
        .map(r => ({
          type: r.task?.type,
          error: r.result?.error || 'unknown'
        }));
    }

    return verification;
  }

  /**
   * 分类任务
   */
  _classifyTask(description) {
    const desc = description.toLowerCase();

    // 简单执行
    const simpleKeywords = ['运行', '执行', '跑', '打开', '读取', 'find', 'run', 'cat', 'ls'];
    for (const keyword of simpleKeywords) {
      if (desc.includes(keyword)) return 'simple';
    }

    // 复杂任务
    const complexKeywords = ['实现', '创建', '开发', '系统', '功能', 'implement', 'create', 'develop'];
    for (const keyword of complexKeywords) {
      if (desc.includes(keyword)) return 'complex';
    }

    return 'medium';
  }

  /**
   * 记录到历史
   */
  _recordToHistory(record) {
    this.history.push(record);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      pipelineState: this.pipelineState,
      currentTask: this.currentTask,
      historyCount: this.history.length,
      agents: this.agentFactory.getAllStatus()
    };
  }

  /**
   * 获取历史
   */
  getHistory(filter) {
    let history = this.history;
    if (filter) {
      if (filter.type) {
        history = history.filter(h => h.type === filter.type);
      }
      if (filter.since) {
        history = history.filter(h => new Date(h.timestamp) >= new Date(filter.since));
      }
    }
    return history;
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      pipeline: 'healthy',
      state: this.pipelineState,
      identityCore: this.identityCore.healthCheck(),
      agentFactory: this.agentFactory.healthCheck()
    };
  }
}

module.exports = { TaskPipeline };
