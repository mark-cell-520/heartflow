/**
 * 增强规划器 (Enhanced Planner) v1.0.0
 *
 * 更复杂的规划能力，支持子任务分解、条件执行、回溯
 */

class EnhancedPlanner {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 10;
    this.maxSubtasks = options.maxSubtasks || 20;
    this.explorationLimit = options.explorationLimit || 100;
    this.explored = new Set();
    this.planHistory = [];
  }

  /**
   * 创建复杂计划
   */
  async createPlan(goal, context = {}) {
    const plan = {
      id: `plan-${Date.now()}`,
      goal,
      context,
      createdAt: Date.now(),
      status: 'created',
      phases: [],
      estimatedCost: 0
    };

    // 分析目标
    const analysis = this._analyzeGoal(goal, context);

    // 生成阶段
    plan.phases = this._decomposeIntoPhases(analysis);

    // 估算成本
    plan.estimatedCost = this._estimateCost(plan.phases);

    // 验证计划
    plan.validation = this._validatePlan(plan);

    this.planHistory.push(plan);

    return plan;
  }

  /**
   * 分析目标
   */
  _analyzeGoal(goal, context) {
    const analysis = {
      goal,
      context,
      complexity: this._assessComplexity(goal),
      requiresInternet: /搜索|查找|查询|获取.*信息/i.test(goal),
      requiresFileSystem: /创建|写入|删除|修改.*文件/i.test(goal),
      requiresCode: /实现|编写|开发|调试/i.test(goal),
      isIdempotent: this._isIdempotent(goal),
      canParallelize: this._canParallelize(goal)
    };

    // 检测目标类型
    if (analysis.requiresCode) {
      analysis.type = 'code';
      analysis.priority = 'high';
    } else if (analysis.requiresInternet) {
      analysis.type = 'research';
      analysis.priority = 'medium';
    } else if (analysis.requiresFileSystem) {
      analysis.type = 'file';
      analysis.priority = 'high';
    } else {
      analysis.type = 'general';
      analysis.priority = 'medium';
    }

    return analysis;
  }

  /**
   * 评估复杂度
   */
  _assessComplexity(goal) {
    let score = 0;

    // 多步骤指示
    if (/第一|第二|首先|然后|最后/i.test(goal)) score += 2;
    if (/多个|几种|一系列/i.test(goal)) score += 2;

    // 条件指示
    if (/如果|当|条件/i.test(goal)) score += 1;

    // 循环指示
    if (/循环|重复|遍历/i.test(goal)) score += 2;

    // 长度
    if (goal.length > 100) score += 1;
    if (goal.length > 200) score += 2;

    // 关键词复杂度
    const complexKeywords = ['实现', '创建', '设计', '架构', '优化', '重构'];
    for (const kw of complexKeywords) {
      if (goal.includes(kw)) score += 1;
    }

    if (score <= 2) return 'simple';
    if (score <= 5) return 'medium';
    return 'complex';
  }

  /**
   * 判断是否幂等
   */
  _isIdempotent(goal) {
    const nonIdempotent = /删除|移除|取消|终止/i.test(goal);
    return !nonIdempotent;
  }

  /**
   * 判断是否可并行
   */
  _canParallelize(goal) {
    // 多个独立操作可以并行
    const parallelIndicators = [/和.*和.*和/gi, /、.*、.*、/g, /同时.*和.*同时/g];
    return parallelIndicators.some(p => p.test(goal));
  }

  /**
   * 分解为阶段
   */
  _decomposeIntoPhases(analysis) {
    const phases = [];

    // 准备阶段
    if (analysis.requiresInternet || analysis.requiresCode) {
      phases.push({
        id: 'phase-1',
        name: '准备与分析',
        tasks: ['理解需求', '收集信息'],
        canParallelize: false
      });
    }

    // 执行阶段
    if (analysis.type === 'code') {
      phases.push({
        id: 'phase-2',
        name: '编码实现',
        tasks: ['编写代码', '单元测试'],
        canParallelize: false,
        tools: ['write', 'bash']
      });
    } else if (analysis.type === 'research') {
      phases.push({
        id: 'phase-2',
        name: '信息收集',
        tasks: ['搜索', '分析'],
        canParallelize: true,
        tools: ['web_search', 'web_fetch']
      });
    } else if (analysis.type === 'file') {
      phases.push({
        id: 'phase-2',
        name: '文件操作',
        tasks: ['读取', '修改', '写入'],
        canParallelize: false,
        tools: ['read', 'write', 'edit']
      });
    }

    // 验证阶段
    phases.push({
      id: 'phase-3',
      name: '验证与确认',
      tasks: ['检查结果', '验证完整性'],
      canParallelize: false
    });

    return phases;
  }

  /**
   * 估算成本
   */
  _estimateCost(phases) {
    let cost = 0;

    for (const phase of phases) {
      cost += phase.tasks.length * 100; // 每个任务 100 token 估算
      if (phase.tools) {
        cost += phase.tools.length * 50;
      }
    }

    return { tokens: cost, steps: phases.reduce((sum, p) => sum + p.tasks.length, 0) };
  }

  /**
   * 验证计划
   */
  _validatePlan(plan) {
    const issues = [];

    if (plan.phases.length === 0) {
      issues.push('计划为空');
    }

    if (plan.estimatedCost.tokens > 8000) {
      issues.push('计划成本过高，可能需要拆分');
    }

    // 检查工具可用性
    for (const phase of plan.phases) {
      if (phase.tools) {
        // 这里可以检查工具是否在注册表中
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * 创建条件分支
   */
  createBranchingPlan(goal, conditions) {
    const branches = [];

    for (const condition of conditions) {
      const branch = {
        id: `branch-${branches.length}`,
        condition: condition.if,
        plan: this.createPlan(condition.then, { branching: true })
      };
      branches.push(branch);
    }

    return {
      id: `plan-${Date.now()}`,
      goal,
      type: 'branching',
      branches,
      defaultPlan: null
    };
  }

  /**
   * 创建循环计划
   */
  createLoopPlan(goal, options = {}) {
    const { maxIterations = 10, until = null, while: whileCondition = null } = options;

    return {
      id: `plan-${Date.now()}`,
      goal,
      type: 'loop',
      maxIterations,
      until,
      whileCondition,
      body: null // 需要填充循环体
    };
  }

  /**
   * 优化计划
   */
  optimize(plan) {
    const optimized = JSON.parse(JSON.stringify(plan));

    // 合并相邻阶段
    const merged = [];
    for (let i = 0; i < optimized.phases.length; i++) {
      const current = optimized.phases[i];
      const prev = merged[merged.length - 1];

      if (prev && this._canMerge(prev, current)) {
        merged[merged.length - 1] = {
          ...prev,
          tasks: [...prev.tasks, ...current.tasks],
          tools: [...(prev.tools || []), ...(current.tools || [])]
        };
      } else {
        merged.push(current);
      }
    }

    optimized.phases = merged;
    optimized.estimatedCost = this._estimateCost(optimized.phases);

    return optimized;
  }

  /**
   * 判断是否可以合并
   */
  _canMerge(phase1, phase2) {
    // 相邻阶段可以合并
    const mergeableTypes = {
      'file': ['file'],
      'code': ['code'],
      'research': ['research']
    };

    return mergeableTypes[phase1.type]?.includes(phase2.type) || false;
  }

  /**
   * 获取计划历史
   */
  getHistory(limit = 20) {
    return this.planHistory.slice(-limit);
  }

  /**
   * 获取统计
   */
  getStats() {
    const total = this.planHistory.length;
    if (total === 0) {
      return { total: 0, avgCost: 0 };
    }

    const avgCost = this.planHistory.reduce((sum, p) => sum + p.estimatedCost.tokens, 0) / total;

    return {
      total,
      avgCost: Math.round(avgCost),
      byType: this._countByType()
    };
  }

  /**
   * 按类型计数
   */
  _countByType() {
    const counts = {};
    for (const plan of this.planHistory) {
      const type = plan.type || 'single';
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }
}

/**
 * 计划执行器
 */
class PlanExecutor {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.executor = options.executor; // 实际执行器
  }

  /**
   * 执行计划
   */
  async execute(plan, context = {}) {
    if (plan.type === 'branching') {
      return this._executeBranching(plan, context);
    }

    if (plan.type === 'loop') {
      return this._executeLoop(plan, context);
    }

    return this._executeLinear(plan, context);
  }

  /**
   * 线性执行
   */
  async _executeLinear(plan, context) {
    const results = [];

    for (const phase of plan.phases) {
      const phaseResult = {
        phase: phase.id,
        status: 'running'
      };

      try {
        const phaseResults = [];
        for (const task of phase.tasks) {
          // 执行任务
          const taskResult = await this._executeTask(task, { ...context, phase });
          phaseResults.push(taskResult);
        }

        phaseResult.status = 'completed';
        phaseResult.results = phaseResults;
      } catch (error) {
        phaseResult.status = 'failed';
        phaseResult.error = error.message;
      }

      results.push(phaseResult);

      // 如果失败，停止
      if (phaseResult.status === 'failed') {
        break;
      }
    }

    return {
      success: results.every(r => r.status === 'completed'),
      results,
      plan
    };
  }

  /**
   * 分支执行
   */
  async _executeBranching(plan, context) {
    for (const branch of plan.branches) {
      if (await this._evaluateCondition(branch.condition, context)) {
        return this.execute(branch.plan, context);
      }
    }

    if (plan.defaultPlan) {
      return this.execute(plan.defaultPlan, context);
    }

    return { success: false, error: 'No branch matched' };
  }

  /**
   * 循环执行
   */
  async _executeLoop(plan, context) {
    const results = [];
    let iterations = 0;

    while (iterations < plan.maxIterations) {
      // 检查循环条件
      if (plan.whileCondition && !(await this._evaluateCondition(plan.whileCondition, context))) {
        break;
      }

      // 执行循环体
      const result = await this.execute(plan.body, context);
      results.push(result);

      // 检查直到条件
      if (plan.until && await this._evaluateCondition(plan.until, context)) {
        break;
      }

      iterations++;
    }

    return {
      success: true,
      iterations,
      results,
      plan
    };
  }

  /**
   * 执行单个任务
   */
  async _executeTask(task, context) {
    // 调用实际执行器
    if (this.executor) {
      return this.executor(task, context);
    }

    return { task, status: 'completed' };
  }

  /**
   * 评估条件
   */
  async _evaluateCondition(condition, context) {
    if (typeof condition === 'function') {
      return condition(context);
    }

    if (typeof condition === 'string') {
      // 简单条件解析
      return true;
    }

    return false;
  }
}

module.exports = { EnhancedPlanner, PlanExecutor };
