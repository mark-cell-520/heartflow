/**
 * 规划 Agent v2.0.0
 *
 * 负责规划复杂任务
 *
 * 改进：
 * 1. 支持复杂任务分解
 * 2. 依赖分析
 * 3. 并行任务识别
 * 4. 多层级规划
 */

const { BaseAgent } = require('./base-agent');

class PlannerAgent extends BaseAgent {
  constructor(options = {}) {
    super({
      name: 'PlannerAgent',
      description: '规划复杂任务',
      version: '2.0.0',
      ...options
    });

    // 规划策略
    this.strategies = {
      linear: 'linear',
      recursive: 'recursive',
      parallel: 'parallel',
      hierarchical: 'hierarchical'
    };

    this.currentStrategy = this.strategies.hierarchical;

    // 任务类型识别器
    this.taskAnalyzers = {
      development: this._analyzeDevelopment.bind(this),
      debugging: this._analyzeDebugging.bind(this),
      testing: this._analyzeTesting.bind(this),
      deployment: this._analyzeDeployment.bind(this),
      analysis: this._analyzeAnalysis.bind(this),
      refactoring: this._analyzeRefactoring.bind(this)
    };
  }

  /**
   * 执行任务 - 规划
   */
  async _execute(task) {
    this.recordStep(`开始规划任务: ${task.description}`);

    // 1. 理解任务
    const understanding = await this._understandTask(task);
    this.recordStep(`任务理解: ${understanding.summary}`);

    // 2. 分析任务结构
    const analysis = this._analyzeTaskStructure(understanding);
    this.recordStep(`任务分析: ${analysis.type}, 复杂度: ${analysis.complexity}`);

    // 3. 分解任务
    const decomposition = await this._decomposeTask(analysis);
    this.recordStep(`任务分解: ${decomposition.steps.length} 个步骤`);

    // 4. 分析依赖关系
    const dependencies = this._analyzeDependencies(decomposition.steps);
    this.recordStep(`依赖分析: ${dependencies.length} 个依赖`);

    // 5. 识别可并行任务
    const parallelization = this._identifyParallelTasks(decomposition.steps, dependencies);
    this.recordStep(`并行分析: ${parallelization.parallelGroups.length} 个并行组`);

    // 6. 生成执行计划
    const plan = {
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
      understanding: understanding,
      analysis: analysis,
      steps: decomposition.steps,
      dependencies: dependencies,
      parallelization: parallelization,
      estimatedSteps: decomposition.steps.length,
      strategy: this.currentStrategy,
      estimatedDuration: this._estimateDuration(decomposition.steps)
    };

    this.recordStep(`规划完成: ${plan.steps.length} 个步骤, ${plan.parallelization.parallelGroups.length} 个并行组`);

    return {
      success: true,
      plan,
      agent: this.name
    };
  }

  /**
   * 理解任务
   */
  async _understandTask(task) {
    const description = task.description || task.text || '';

    // 识别任务类型
    let type = 'unknown';
    for (const [key, analyzer] of Object.entries(this.taskAnalyzers)) {
      if (analyzer.call(this, description)) {
        type = key;
        break;
      }
    }

    // 评估复杂度
    const complexity = this._assessComplexity(description, type);

    return {
      type,
      complexity,
      summary: `${type} - ${complexity} complexity`,
      description,
      keywords: this._extractKeywords(description)
    };
  }

  /**
   * 任务结构分析
   */
  _analyzeTaskStructure(understanding) {
    return {
      type: understanding.type,
      complexity: understanding.complexity,
      keywords: understanding.keywords,
      scope: this._assessScope(understanding)
    };
  }

  /**
   * 分解任务
   */
  async _decomposeTask(analysis) {
    const analyzer = this.taskAnalyzers[analysis.type];
    if (analyzer) {
      return await analyzer(analysis);
    }
    return this._decomposeGeneric(analysis);
  }

  /**
   * 开发任务分析
   */
  _analyzeDevelopment(description) {
    const steps = [];

    // 理解开发类型
    if (/api|接口|endpoint/i.test(description)) {
      steps.push(
        { action: 'search', description: '搜索现有 API 模式', tool: 'search', parallel: false },
        { action: 'design', description: '设计 API 结构', tool: null, parallel: false },
        { action: 'create', description: '创建 API 文件', tool: 'file', parallel: false },
        { action: 'implement', description: '实现 API 逻辑', tool: null, parallel: false },
        { action: 'test', description: '编写和运行测试', tool: 'bash', parallel: false },
        { action: 'review', description: '代码审查', tool: null, parallel: false }
      );
    } else if (/前端|frontend|react|vue|ui/i.test(description)) {
      steps.push(
        { action: 'search', description: '搜索现有组件模式', tool: 'search', parallel: false },
        { action: 'design', description: '设计组件结构', tool: null, parallel: false },
        { action: 'create', description: '创建组件文件', tool: 'file', parallel: false },
        { action: 'style', description: '实现样式', tool: null, parallel: false },
        { action: 'test', description: '测试组件', tool: 'bash', parallel: false },
        { action: 'review', description: '代码审查', tool: null, parallel: false }
      );
    } else if (/后端|backend|server|database/i.test(description)) {
      steps.push(
        { action: 'search', description: '搜索现有数据模型', tool: 'search', parallel: false },
        { action: 'design', description: '设计数据模型', tool: null, parallel: false },
        { action: 'create', description: '创建数据层代码', tool: 'file', parallel: false },
        { action: 'implement', description: '实现业务逻辑', tool: null, parallel: false },
        { action: 'test', description: '测试业务逻辑', tool: 'bash', parallel: false },
        { action: 'review', description: '代码审查', tool: null, parallel: false }
      );
    } else {
      // 通用开发流程
      steps.push(
        { action: 'search', description: '搜索相关代码', tool: 'search', parallel: false },
        { action: 'plan', description: '制定实现计划', tool: null, parallel: false },
        { action: 'create', description: '创建代码文件', tool: 'file', parallel: false },
        { action: 'implement', description: '实现功能', tool: null, parallel: false },
        { action: 'test', description: '运行测试', tool: 'bash', parallel: false },
        { action: 'verify', description: '验证功能', tool: null, parallel: false }
      );
    }

    return { steps };
  }

  /**
   * 调试任务分析
   */
  _analyzeDebugging(description) {
    return {
      steps: [
        { action: 'reproduce', description: '复现问题', tool: 'bash', parallel: false },
        { action: 'search', description: '搜索相关代码', tool: 'search', parallel: false },
        { action: 'analyze', description: '分析根因', tool: null, parallel: false },
        { action: 'fix', description: '修复问题', tool: 'file', parallel: false },
        { action: 'verify', description: '验证修复', tool: 'bash', parallel: false }
      ]
    };
  }

  /**
   * 测试任务分析
   */
  _analyzeTesting(description) {
    return {
      steps: [
        { action: 'find', description: '查找测试文件', tool: 'search', parallel: false },
        { action: 'run', description: '运行测试', tool: 'bash', parallel: false },
        { action: 'analyze', description: '分析测试结果', tool: null, parallel: false },
        { action: 'fix', description: '修复失败的测试', tool: 'file', parallel: false },
        { action: 'report', description: '生成测试报告', tool: null, parallel: false }
      ]
    };
  }

  /**
   * 部署任务分析
   */
  _analyzeDeployment(description) {
    return {
      steps: [
        { action: 'check', description: '检查环境配置', tool: 'bash', parallel: false },
        { action: 'build', description: '构建项目', tool: 'bash', parallel: false },
        { action: 'test', description: '运行预部署测试', tool: 'bash', parallel: false },
        { action: 'deploy', description: '执行部署', tool: 'bash', parallel: false },
        { action: 'verify', description: '验证部署结果', tool: 'http', parallel: false }
      ]
    };
  }

  /**
   * 分析任务分析
   */
  _analyzeAnalysis(description) {
    return {
      steps: [
        { action: 'search', description: '搜索相关信息', tool: 'search', parallel: false },
        { action: 'collect', description: '收集数据', tool: null, parallel: false },
        { action: 'analyze', description: '分析数据', tool: null, parallel: false },
        { action: 'report', description: '生成分析报告', tool: 'file', parallel: false }
      ]
    };
  }

  /**
   * 重构任务分析
   */
  _analyzeRefactoring(description) {
    return {
      steps: [
        { action: 'search', description: '搜索待重构代码', tool: 'search', parallel: false },
        { action: 'analyze', description: '分析代码结构', tool: null, parallel: false },
        { action: 'plan', description: '制定重构计划', tool: null, parallel: false },
        { action: 'refactor', description: '执行重构', tool: 'file', parallel: false },
        { action: 'test', description: '运行测试验证', tool: 'bash', parallel: false }
      ]
    };
  }

  /**
   * 通用分解
   */
  _decomposeGeneric(analysis) {
    return {
      steps: [
        { action: 'understand', description: '理解任务要求', tool: null, parallel: false },
        { action: 'search', description: '收集相关信息', tool: 'search', parallel: false },
        { action: 'plan', description: '制定执行计划', tool: null, parallel: false },
        { action: 'execute', description: '执行计划', tool: null, parallel: false },
        { action: 'verify', description: '验证结果', tool: null, parallel: false }
      ]
    };
  }

  /**
   * 分析依赖
   */
  _analyzeDependencies(steps) {
    const dependencies = [];

    for (let i = 1; i < steps.length; i++) {
      dependencies.push({
        from: i - 1,
        to: i,
        type: 'sequencing',
        reason: `${steps[i - 1].action} 必须在 ${steps[i].action} 之前`
      });
    }

    return dependencies;
  }

  /**
   * 识别可并行任务
   */
  _identifyParallelTasks(steps, dependencies) {
    // 简单实现：识别没有依赖的任务
    const parallelGroups = [];
    const executed = new Set();

    for (let i = 0; i < steps.length; i++) {
      if (executed.has(i)) continue;

      const group = [i];
      executed.add(i);

      // 查找可以并行的后续任务
      for (let j = i + 1; j < steps.length; j++) {
        if (executed.has(j)) continue;

        // 检查是否有依赖
        const hasDep = dependencies.some(d => d.to === j && !executed.has(d.from));
        if (!hasDep && steps[j].parallel !== false) {
          group.push(j);
          executed.add(j);
        }
      }

      if (group.length > 1) {
        parallelGroups.push({
          tasks: group.map(idx => ({
            index: idx,
            action: steps[idx].action,
            description: steps[idx].description
          })),
          reason: '这些任务可以并行执行'
        });
      }
    }

    return {
      parallelGroups,
      totalParallelizable: parallelGroups.reduce((sum, g) => sum + g.tasks.length, 0)
    };
  }

  /**
   * 评估复杂度
   */
  _assessComplexity(description, type) {
    let score = 1;

    // 关键词增加复杂度
    const complexityIndicators = [
      /系统|模块|架构|system|module/i,
      /微服务|microservice/i,
      /实时|流|realtime|stream/i,
      /机器学习|ml|ai|神经网络/i,
      /数据库|db|database/i,
      /多个|several|many/i
    ];

    for (const indicator of complexityIndicators) {
      if (indicator.test(description)) {
        score++;
      }
    }

    if (score <= 2) return 'simple';
    if (score <= 4) return 'medium';
    return 'complex';
  }

  /**
   * 评估范围
   */
  _assessScope(understanding) {
    const desc = understanding.description || '';
    if (/整个系统|whole system|全部|all/i.test(desc)) return 'system';
    if (/模块|module|组件|component/i.test(desc)) return 'module';
    return 'feature';
  }

  /**
   * 提取关键词
   */
  _extractKeywords(description) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'and', 'or', 'but', 'to', 'of', 'in', 'for', 'with', '我', '的', '是', '在', '和']);
    return description.split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
      .slice(0, 10);
  }

  /**
   * 估算持续时间
   */
  _estimateDuration(steps) {
    const stepWeight = {
      search: 1,
      test: 2,
      build: 3,
      deploy: 5
    };

    let total = 0;
    for (const step of steps) {
      total += stepWeight[step.action] || 1;
    }

    return {
      estimatedMinutes: total,
      steps: steps.length
    };
  }

  /**
   * 设置规划策略
   */
  setStrategy(strategy) {
    if (Object.values(this.strategies).includes(strategy)) {
      this.currentStrategy = strategy;
      return { success: true, strategy };
    }
    return {
      success: false,
      error: `未知策略: ${strategy}`,
      validStrategies: Object.values(this.strategies)
    };
  }
}

module.exports = { PlannerAgent };
