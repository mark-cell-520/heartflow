/**
 * Agent 协调器 (Agent Coordinator) v1.0.0
 *
 * 协调任务规划和执行
 */

class AgentCoordinator {
  constructor(agent) {
    this.agent = agent;
    this.toolRegistry = agent.toolRegistry;
    this.apiClient = agent.apiClient;
    this.memory = agent.memory;
    this.currentPlan = null;
  }

  /**
   * 规划任务
   */
  async plan(task) {
    const intent = task.intent;
    const entities = task.entities;

    // 构建系统提示
    const systemPrompt = this._buildSystemPrompt();

    // 构建用户消息
    const userMessage = this._buildUserMessage(task);

    // 发送到 API 获取规划
    const response = await this.apiClient.send(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      this.toolRegistry.getAllTools()
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error,
        steps: []
      };
    }

    // 解析响应，提取步骤
    const steps = this._parseResponseSteps(response.content);

    return {
      success: true,
      steps,
      raw: response.content
    };
  }

  /**
   * 执行计划
   */
  async execute(plan) {
    if (!plan.success) {
      return plan;
    }

    const startTime = Date.now();
    const executedSteps = [];
    const toolsUsed = new Set();

    for (const step of plan.steps) {
      try {
        const result = await this._executeStep(step);
        executedSteps.push({
          ...step,
          success: result.success,
          result: result.result,
          error: result.error
        });

        if (result.success) {
          toolsUsed.add(step.tool);
        }

        // 记录到记忆
        this.memory.remember(
          `Step: ${step.tool} - ${step.description}`,
          { importance: 0.6 }
        );

      } catch (error) {
        executedSteps.push({
          ...step,
          success: false,
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    const allSuccess = executedSteps.every(s => s.success);

    return {
      success: allSuccess,
      steps: executedSteps,
      toolsUsed: [...toolsUsed],
      duration,
      output: this._formatOutput(executedSteps)
    };
  }

  /**
   * 执行单步
   */
  async _executeStep(step) {
    if (!step.tool) {
      return { success: true, result: step.description };
    }

    // 执行工具
    const result = await this.toolRegistry.execute(step.tool, step.input || {});

    // 记录工具使用
    this.agent.session.recordToolUse(step.tool, result.success);

    return result;
  }

  /**
   * 构建系统提示
   */
  _buildSystemPrompt() {
    return `你是一个专业的 AI 助手，擅长分析和解决编程问题。

工作原则：
1. 先理解问题，再制定解决方案
2. 使用合适的工具完成任务
3. 代码要简洁、可读、安全
4. 重要操作前确认用户意图

可用工具：
- bash: 执行命令
- read: 读取文件
- write: 写入文件
- edit: 编辑文件
- glob: 查找文件
- grep/search: 搜索内容
- web_fetch: 获取网页
- todo_write: 创建任务列表

当需要执行多步操作时，先规划步骤，再依次执行。`;
  }

  /**
   * 构建用户消息
   */
  _buildUserMessage(task) {
    return `任务：${task.original}

请分析任务并规划执行步骤。如果需要执行命令或文件操作，请明确列出每个步骤和使用的工具。

响应格式：
1. 分析任务目标
2. 列出执行步骤（使用编号）
3. 每个步骤说明：工具名称、输入参数、执行目的`;
  }

  /**
   * 解析响应步骤
   */
  _parseResponseSteps(response) {
    // 简化实现：从响应中提取步骤
    // 实际应该使用更强的解析逻辑

    const steps = [];

    // 尝试从响应中提取工具调用
    const toolPatterns = [
      /使用.*工具\s*[:：]\s*(\w+)/gi,
      /执行\s+(\w+)\s+命令/gi,
      /bash[:：]\s*[`'"]?([^`'"\n]+)[`'"]?/gi,
      /读取\s+文件\s*[:：]\s*(\S+\.\w+)/gi,
      /写入\s+文件\s*[:：]\s*(\S+\.\w+)/gi
    ];

    // 简单实现：假设响应包含步骤描述
    // 返回单个步骤（实际需要更复杂的解析）
    if (response && response.length > 50) {
      steps.push({
        id: 'step-1',
        description: response.slice(0, 200),
        tool: null,
        input: null
      });
    }

    return steps;
  }

  /**
   * 格式化输出
   */
  _formatOutput(steps) {
    const lines = [];

    for (const step of steps) {
      if (step.success) {
        lines.push(`✓ ${step.description || step.tool}`);
      } else {
        lines.push(`✗ ${step.description || step.tool}: ${step.error}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 规划单步任务
   */
  async planSimple(taskDescription) {
    return this.plan({
      original: taskDescription,
      intent: { type: 'general', confidence: 0.5 },
      entities: { paths: [], commands: [], keywords: [] },
      context: {},
      timestamp: Date.now()
    });
  }

  /**
   * 执行单步任务
   */
  async executeSimple(tool, input) {
    const result = await this.toolRegistry.execute(tool, input);
    this.agent.session.recordToolUse(tool, result.success);
    return result;
  }
}

module.exports = { AgentCoordinator };
