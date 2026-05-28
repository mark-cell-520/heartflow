/**
 * 任务分解器 (Task Decomposer) v1.0.0
 *
 * Claude级任务分解：理解意图、生成步骤、处理复杂任务
 */

class TaskDecomposer {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 5;
    this.maxSteps = options.maxSteps || 50;
    this.parallelThreshold = options.parallelThreshold || 3; // 超过3个可并行
  }

  /**
   * 分解任务
   */
  decompose(task, context = {}) {
    const decomposition = {
      id: `decomp-${Date.now()}`,
      original: task,
      context,
      createdAt: Date.now(),
      steps: [],
      parallelGroups: [],
      estimatedCost: 0
    };

    // 分析任务类型
    const analysis = this._analyzeTask(task, context);

    // 根据类型选择分解策略
    if (analysis.isSimple) {
      decomposition.steps = this._decomposeSimple(task);
    } else if (analysis.isSequential) {
      decomposition.steps = this._decomposeSequential(task, analysis);
    } else if (analysis.isParallel) {
      const { steps, groups } = this._decomposeParallel(task, analysis);
      decomposition.steps = steps;
      decomposition.parallelGroups = groups;
    } else {
      decomposition.steps = this._decomposeComplex(task, analysis);
    }

    // 估算成本
    decomposition.estimatedCost = this._estimateCost(decomposition.steps);

    return decomposition;
  }

  /**
   * 分析任务
   */
  _analyzeTask(task, context) {
    const lower = task.toLowerCase();

    // 简单任务检测
    const simplePatterns = [
      /^帮我[看查找读].*[吗呢]?$/,
      /^什么是/,
      /^告诉我/,
      /^显示/,
      /^获取/
    ];

    const isSimple = simplePatterns.some(p => p.test(lower));

    // 顺序任务检测（首先...然后...最后...）
    const sequentialPatterns = [
      /首先|然后|接着|之后|最后|再/g,
      /第一|第二|第三|首先|其次/g
    ];

    const isSequential = sequentialPatterns.some(p => p.test(lower));

    // 并行任务检测
    const parallelPatterns = [
      /和.*和.*和/g,
      /同时.*和.*同时/g,
      /以及.*以及/g,
      /还有.*还有/g
    ];

    const isParallel = parallelPatterns.some(p => p.test(lower));

    // 检测关键动作
    const actions = [];
    const actionPatterns = [
      { pattern: /创建|新建|编写|实现/g, name: '创建' },
      { pattern: /修改|编辑|更新|改变/g, name: '修改' },
      { pattern: /删除|移除|清除/g, name: '删除' },
      { pattern: /读取|查看|打开/g, name: '读取' },
      { pattern: /搜索|查找|寻找/g, name: '搜索' },
      { pattern: /运行|执行|启动/g, name: '执行' },
      { pattern: /分析|研究|调查/g, name: '分析' },
      { pattern: /比较|对比/g, name: '比较' }
    ];

    for (const { pattern, name } of actionPatterns) {
      if (pattern.test(lower)) {
        actions.push(name);
      }
    }

    // 检测目标
    const targets = this._extractTargets(task);

    // 检测条件
    const conditions = this._extractConditions(task);

    return {
      isSimple,
      isSequential,
      isParallel,
      actions,
      targets,
      conditions,
      complexity: this._assessComplexity(task, actions, targets)
    };
  }

  /**
   * 提取目标
   */
  _extractTargets(task) {
    const targets = [];

    // 文件路径（更严格的匹配：Unix/Windows风格）
    const filePattern = /(?:[a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g;
    const files = task.match(filePattern);
    if (files) targets.push(...files.map(f => ({ type: 'file', value: f })));

    // 关键词目标
    const keywordTargets = ['用户', '文件', '代码', '函数', '模块', '项目', '数据库'];
    for (const keyword of keywordTargets) {
      if (task.includes(keyword)) {
        targets.push({ type: 'concept', value: keyword });
      }
    }

    return targets;
  }

  /**
   * 提取条件
   */
  _extractConditions(task) {
    const conditions = [];

    const conditionPatterns = [
      { pattern: /如果|当|只要/g, name: '条件' },
      { pattern: /除非/g, name: '反条件' },
      { pattern: /当.*时/g, name: '触发条件' }
    ];

    for (const { pattern, name } of conditionPatterns) {
      if (pattern.test(task)) {
        conditions.push({ type: name, raw: pattern.exec(task)?.[0] });
      }
    }

    return conditions;
  }

  /**
   * 评估复杂度
   */
  _assessComplexity(task, actions, targets) {
    let score = 0;

    // 动作越多越复杂
    score += actions.length * 2;

    // 目标越多越复杂
    score += targets.length * 1.5;

    // 长度影响
    if (task.length > 200) score += 3;
    if (task.length > 500) score += 5;

    // 特定关键词
    const complexKeywords = ['实现', '设计', '架构', '优化', '重构', '迁移'];
    for (const kw of complexKeywords) {
      if (task.includes(kw)) score += 3;
    }

    if (score <= 3) return 'simple';
    if (score <= 7) return 'medium';
    return 'complex';
  }

  /**
   * 简单分解
   */
  _decomposeSimple(task) {
    return [{
      id: 'step-1',
      description: task,
      type: 'direct',
      tool: null,
      parallel: false
    }];
  }

  /**
   * 顺序分解
   */
  _decomposeSequential(task, analysis) {
    const steps = [];

    // 按顺序标记分割
    const sequenceMarkers = [
      { pattern: /首先/g, marker: '第一' },
      { pattern: /然后|接着|之后/g, marker: '第二' },
      { pattern: /再|还/g, marker: '第三' },
      { pattern: /最后/g, marker: '最后' }
    ];

    let stepNum = 1;
    let remaining = task;

    for (const { pattern } of sequenceMarkers) {
      const match = pattern.exec(remaining);
      if (match) {
        const part = remaining.slice(0, match.index).trim();
        if (part) {
          steps.push({
            id: `step-${stepNum}`,
            description: part,
            type: 'sequential',
            requires: stepNum > 1 ? [`step-${stepNum - 1}`] : [],
            parallel: false
          });
          stepNum++;
        }
        remaining = remaining.slice(match.index + match[0].length);
      }
    }

    // 添加剩余部分
    if (remaining.trim()) {
      steps.push({
        id: `step-${stepNum}`,
        description: remaining.trim(),
        type: 'sequential',
        requires: stepNum > 1 ? [`step-${stepNum - 1}`] : [],
        parallel: false
      });
    }

    return steps.length > 0 ? steps : this._decomposeSimple(task);
  }

  /**
   * 并行分解
   */
  _decomposeParallel(task, analysis) {
    const steps = [];
    const groups = [];

    // 分割并列任务
    const parts = task.split(/和|以及|同时/).map(p => p.trim()).filter(Boolean);

    let groupId = 1;
    for (const part of parts) {
      const step = {
        id: `step-${steps.length + 1}`,
        description: part,
        type: 'parallel',
        group: `group-${groupId}`,
        parallel: true
      };
      steps.push(step);

      // 确定工具
      step.tool = this._inferTool(part);

      // 添加到组
      const existingGroup = groups.find(g => g.canContain(step));
      if (existingGroup) {
        existingGroup.steps.push(step);
      } else {
        groups.push({
          id: `group-${groupId}`,
          type: 'parallel',
          steps: [step]
        });
        groupId++;
      }
    }

    return { steps, groups };
  }

  /**
   * 复杂分解
   */
  _decomposeComplex(task, analysis) {
    const steps = [];

    // 阶段1: 理解与分析
    steps.push({
      id: 'step-1',
      description: '理解任务需求和分析目标',
      type: 'analysis',
      tool: null,
      parallel: false
    });

    // 阶段2: 准备
    if (analysis.targets.length > 0) {
      steps.push({
        id: 'step-2',
        description: `准备目标: ${analysis.targets.map(t => t.value).join(', ')}`,
        type: 'preparation',
        requires: ['step-1'],
        parallel: false
      });
    }

    // 阶段3: 执行
    let stepId = steps.length + 1;
    for (const action of analysis.actions) {
      steps.push({
        id: `step-${stepId}`,
        description: `执行${action}操作`,
        type: 'execution',
        requires: stepId > 2 ? [`step-${stepId - 1}`] : ['step-1'],
        parallel: false
      });
      stepId++;
    }

    // 阶段4: 验证
    steps.push({
      id: `step-${stepId}`,
      description: '验证结果',
      type: 'verification',
      requires: [`step-${stepId - 1}`],
      parallel: false
    });

    return steps;
  }

  /**
   * 推断工具
   */
  _inferTool(description) {
    const lower = description.toLowerCase();

    if (/创建|新建|写入|写文件/g.test(lower)) return 'write';
    if (/修改|编辑|改变/g.test(lower)) return 'edit';
    if (/删除|移除/g.test(lower)) return 'bash';
    if (/读取|查看|cat/g.test(lower)) return 'read';
    if (/搜索|grep/g.test(lower)) return 'search';
    if (/运行|执行|npm|node|python/g.test(lower)) return 'bash';
    if (/查找|寻找/g.test(lower)) return 'grep';
    if (/获取|fetch|curl/g.test(lower)) return 'web_fetch';

    return null;
  }

  /**
   * 估算成本
   */
  _estimateCost(steps) {
    let tokens = 0;
    let apiCalls = 1; // 至少一次API调用

    for (const step of steps) {
      tokens += 50; // 基础步骤开销
      if (step.tool) tokens += 20;

      // 并行步骤合并API调用
      if (step.type === 'parallel') {
        // 不增加API调用
      } else {
        apiCalls++;
      }
    }

    return { tokens, apiCalls, steps: steps.length };
  }
}

/**
 * 依赖解析器
 */
class DependencyResolver {
  constructor() {
    this.graph = new Map();
  }

  /**
   * 构建依赖图
   */
  buildGraph(steps) {
    this.graph.clear();

    for (const step of steps) {
      if (!this.graph.has(step.id)) {
        this.graph.set(step.id, { step, dependencies: new Set() });
      }

      if (step.requires) {
        for (const reqId of step.requires) {
          this.graph.get(step.id).dependencies.add(reqId);
        }
      }
    }

    return this;
  }

  /**
   * 获取执行顺序
   */
  getExecutionOrder() {
    const visited = new Set();
    const order = [];

    const visit = (stepId) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);

      const node = this.graph.get(stepId);
      if (node) {
        for (const depId of node.dependencies) {
          visit(depId);
        }
        order.push(stepId);
      }
    };

    for (const stepId of this.graph.keys()) {
      visit(stepId);
    }

    return order;
  }

  /**
   * 检测循环依赖
   */
  detectCycles() {
    const cycles = [];
    const visited = new Set();
    const recStack = new Set();

    const dfs = (stepId, path) => {
      visited.add(stepId);
      recStack.add(stepId);

      const node = this.graph.get(stepId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            if (dfs(depId, [...path, stepId])) {
              return true;
            }
          } else if (recStack.has(depId)) {
            cycles.push([...path, stepId, depId]);
            return true;
          }
        }
      }

      recStack.delete(stepId);
      return false;
    };

    for (const stepId of this.graph.keys()) {
      if (!visited.has(stepId)) {
        dfs(stepId, []);
      }
    }

    return cycles;
  }

  /**
   * 获取可并行执行的步骤
   */
  getParallelSteps() {
    const order = this.getExecutionOrder();
    const executed = new Set();

    for (const stepId of order) {
      const node = this.graph.get(stepId);
      if (!node) continue;

      // 检查是否所有依赖都已执行
      const ready = [...node.dependencies].every(dep => executed.has(dep));

      if (ready) {
        // 可以并行执行
        executed.add(stepId);
      } else {
        // 等待依赖
        return order.slice(order.indexOf(stepId));
      }
    }

    return [];
  }
}

module.exports = { TaskDecomposer, DependencyResolver };
