/**
 * Agent 工厂 v1.0.0
 *
 * 创建和管理 Agent 实例
 *
 * 功能：
 * 1. 根据类型创建 Agent
 * 2. 管理 Agent 生命周期
 * 3. 提供 Agent 协作机制
 */

const { ExecutorAgent } = require('./executor-agent');
const { PlannerAgent } = require('./planner-agent');
const { ToolDispatcher } = require('../executor/dispatcher');

class AgentFactory {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();

    // Agent 注册表
    this.agents = new Map();

    // 工具调度器（共享）
    this.dispatcher = new ToolDispatcher({
      rootPath: this.rootPath
    });

    // 初始化默认 Agent
    this._initializeDefaultAgents();
  }

  /**
   * 初始化默认 Agent
   */
  _initializeDefaultAgents() {
    // 执行 Agent
    this.register('executor', new ExecutorAgent({
      dispatcher: this.dispatcher
    }));

    // 规划 Agent
    this.register('planner', new PlannerAgent({
      dispatcher: this.dispatcher
    }));

    console.log('[AgentFactory] 默认 Agent 初始化完成');
  }

  /**
   * 注册 Agent
   */
  register(name, agent) {
    this.agents.set(name, agent);
    console.log(`[AgentFactory] 已注册 Agent: ${name}`);
  }

  /**
   * 获取 Agent
   */
  get(name) {
    return this.agents.get(name) || null;
  }

  /**
   * 创建 Agent（带配置）
   */
  create(type, config = {}) {
    let agent;

    switch (type) {
      case 'executor':
        agent = new ExecutorAgent({
          dispatcher: this.dispatcher,
          ...config
        });
        break;

      case 'planner':
        agent = new PlannerAgent({
          dispatcher: this.dispatcher,
          ...config
        });
        break;

      default:
        console.warn(`[AgentFactory] 未知 Agent 类型: ${type}`);
        return null;
    }

    return agent;
  }

  /**
   * 执行任务（自动选择 Agent）
   */
  async executeTask(task) {
    // 1. 分析任务类型
    const taskType = this._classifyTask(task);

    console.log(`[AgentFactory] 任务分类: ${taskType}`);

    // 2. 选择合适的 Agent
    let agent;
    let agentName;

    switch (taskType) {
      case 'planning':
        agent = this.get('planner');
        agentName = 'planner';
        break;

      case 'execution':
      case 'simple':
        agent = this.get('executor');
        agentName = 'executor';
        break;

      case 'complex':
        // 复杂任务：先规划后执行
        const planner = this.get('planner');
        const executor = this.get('executor');

        // 先规划
        const planResult = await planner.execute({
          description: task.description,
          type: 'planning'
        });

        if (!planResult.success) {
          return planResult;
        }

        // 根据计划执行
        const execResult = await executor.execute({
          description: task.description,
          steps: planResult.plan.steps.map(step => ({
            type: step.action,
            description: step.description,
            tool: step.tool,
            args: step.args || {}
          }))
        });

        return {
          success: execResult.success,
          plan: planResult.plan,
          execution: execResult,
          agent: 'planner+executor'
        };

      default:
        agent = this.get('executor');
        agentName = 'executor';
    }

    // 3. 执行任务
    return await agent.execute(task);
  }

  /**
   * 分类任务
   */
  _classifyTask(task) {
    const description = (task.description || task.text || '').toLowerCase();

    // 规划类关键词
    const planningKeywords = ['规划', '计划', '如何', '怎么实现', '实现方案', 'plan', 'design'];
    for (const keyword of planningKeywords) {
      if (description.includes(keyword)) {
        return 'planning';
      }
    }

    // 复杂任务关键词
    const complexKeywords = ['实现', '创建', '开发', '系统', '功能', '模块', 'implement', 'create', 'develop'];
    for (const keyword of complexKeywords) {
      if (description.includes(keyword)) {
        return 'complex';
      }
    }

    // 简单执行任务
    const execKeywords = ['运行', '执行', '跑', '打开', '读取', '搜索', 'find', 'run', 'execute'];
    for (const keyword of execKeywords) {
      if (description.includes(keyword)) {
        return 'execution';
      }
    }

    // 修复/调试
    const debugKeywords = ['修复', 'bug', 'fix', 'debug', '错误'];
    for (const keyword of debugKeywords) {
      if (description.includes(keyword)) {
        return 'complex';
      }
    }

    // 默认：简单任务
    return 'simple';
  }

  /**
   * 获取所有 Agent 状态
   */
  getAllStatus() {
    const status = {};
    for (const [name, agent] of this.agents) {
      status[name] = agent.getStatus();
    }
    return status;
  }

  /**
   * 获取工具调度器
   */
  getDispatcher() {
    return this.dispatcher;
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      factory: 'healthy',
      agentsCount: this.agents.size,
      agents: Array.from(this.agents.keys()),
      dispatcher: this.dispatcher.healthCheck()
    };
  }
}

module.exports = { AgentFactory };
