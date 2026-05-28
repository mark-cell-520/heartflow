/**
 * 反思引擎 (Reflection Engine) v1.0.0
 *
 * 任务后的自我反思、错误分析、改进建议
 */

class ReflectionEngine {
  constructor(options = {}) {
    this.maxHistory = options.maxHistory || 100;
    this.confidenceThreshold = options.confidenceThreshold || 0.7;
    this.reflectionHistory = [];
  }

  /**
   * 反思执行结果
   */
  reflect(execution, context = {}) {
    const reflection = {
      id: `ref-${Date.now()}`,
      timestamp: Date.now(),
      execution,
      context,
      analysis: this._analyze(execution, context),
      confidence: this._calculateConfidence(execution),
      suggestions: [],
      lessons: [],
      quality: this._assessQuality(execution)
    };

    // 生成建议
    reflection.suggestions = this._generateSuggestions(reflection);

    // 提取教训
    reflection.lessons = this._extractLessons(reflection);

    // 保存历史（限制总大小，防止内存耗尽）
    const reflectionSize = JSON.stringify(reflection).length;
    const maxReflectionSize = 50 * 1024; // 单条反思最大50KB

    if (reflectionSize > maxReflectionSize) {
      // 压缩过大的反思
      reflection.lessons = reflection.lessons.slice(0, 10);
      reflection.suggestions = reflection.suggestions.slice(0, 10);
    }

    this.reflectionHistory.push(reflection);
    if (this.reflectionHistory.length > this.maxHistory) {
      this.reflectionHistory = this.reflectionHistory.slice(-this.maxHistory);
    }

    return reflection;
  }

  /**
   * 分析执行
   */
  _analyze(execution, context) {
    const analysis = {
      success: execution.success,
      hasOutput: !!(execution.output || execution.result),
      hasError: !!(execution.error || execution.stderr),
      duration: execution.duration || 0,
      toolsUsed: execution.toolsUsed || [],
      stepCount: execution.steps?.length || 0
    };

    // 分析问题
    analysis.problems = [];

    if (!execution.success) {
      analysis.problems.push({
        type: 'failure',
        description: '执行失败',
        severity: 'high'
      });
    }

    if (execution.error) {
      analysis.problems.push({
        type: 'error',
        description: execution.error,
        severity: 'high'
      });
    }

    if (execution.stderr && execution.stderr.length > 0) {
      analysis.problems.push({
        type: 'stderr',
        description: execution.stderr.slice(0, 500),
        severity: 'medium'
      });
    }

    // 分析效率
    analysis.efficiency = this._assessEfficiency(execution);

    // 分析工具使用
    analysis.toolUsage = this._analyzeToolUsage(execution);

    return analysis;
  }

  /**
   * 评估效率
   */
  _assessEfficiency(execution) {
    const duration = execution.duration || 0;
    const steps = execution.steps?.length || 1;

    return {
      avgStepTime: duration / steps,
      totalTime: duration,
      stepCount: steps,
      rating: duration < 5000 ? 'excellent' : duration < 30000 ? 'good' : 'slow'
    };
  }

  /**
   * 分析工具使用
   */
  _analyzeToolUsage(execution) {
    const tools = execution.toolsUsed || [];
    const toolCounts = {};

    for (const tool of tools) {
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    }

    return {
      uniqueTools: Object.keys(toolCounts).length,
      mostUsed: Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0],
      toolCounts
    };
  }

  /**
   * 计算置信度
   */
  _calculateConfidence(execution) {
    let confidence = 0.5;

    // 成功 +0.3
    if (execution.success) confidence += 0.3;

    // 有输出 +0.1
    if (execution.output || execution.result) confidence += 0.1;

    // 无错误 +0.1
    if (!execution.error && !execution.stderr) confidence += 0.1;

    // 执行时间合理 +0.1
    if (execution.duration && execution.duration < 60000) confidence += 0.1;

    // 限制置信度
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * 评估质量
   */
  _assessQuality(execution) {
    const confidence = this._calculateConfidence(execution);

    if (confidence >= 0.9) return 'excellent';
    if (confidence >= 0.7) return 'good';
    if (confidence >= 0.5) return 'acceptable';
    if (confidence >= 0.3) return 'poor';
    return 'failed';
  }

  /**
   * 生成建议
   */
  _generateSuggestions(reflection) {
    const suggestions = [];
    const { analysis } = reflection;

    // 基于问题建议
    for (const problem of analysis.problems || []) {
      if (problem.type === 'failure') {
        suggestions.push({
          type: 'retry',
          priority: 'high',
          suggestion: '任务失败，建议检查错误原因后重试'
        });
      }

      if (problem.type === 'error') {
        suggestions.push({
          type: 'fix',
          priority: 'high',
          suggestion: `错误: ${problem.description.slice(0, 100)}`
        });
      }
    }

    // 基于效率建议
    if (analysis.efficiency?.rating === 'slow') {
      suggestions.push({
        type: 'optimize',
        priority: 'medium',
        suggestion: '执行时间较长，考虑优化步骤或并行执行'
      });
    }

    // 基于质量建议
    if (reflection.quality === 'poor' || reflection.quality === 'failed') {
      suggestions.push({
        type: 'review',
        priority: 'high',
        suggestion: '执行质量较低，建议重新审视任务分解'
      });
    }

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'confirm',
        priority: 'low',
        suggestion: '执行成功，建议确认结果是否符合预期'
      });
    }

    return suggestions;
  }

  /**
   * 提取教训
   */
  _extractLessons(reflection) {
    const lessons = [];
    const { analysis } = reflection;

    // 从错误中学习
    if (analysis.problems?.length > 0) {
      lessons.push({
        category: 'error_handling',
        content: `遇到 ${analysis.problems.length} 个问题，需要更好的错误处理`,
        severity: analysis.problems.length > 2 ? 'high' : 'medium'
      });
    }

    // 从工具使用学习
    if (analysis.toolUsage?.uniqueTools > 5) {
      lessons.push({
        category: 'tool_selection',
        content: '使用了较多不同工具，可能任务过于复杂',
        severity: 'low'
      });
    }

    // 从质量学习
    if (reflection.quality === 'excellent') {
      lessons.push({
        category: 'success_pattern',
        content: '成功的执行模式，可以复用',
        severity: 'low'
      });
    }

    return lessons;
  }

  /**
   * 批量反思
   */
  reflectBatch(executions, context = {}) {
    return executions.map(exec => this.reflect(exec, context));
  }

  /**
   * 获取反思历史
   */
  getHistory(limit = 20) {
    return this.reflectionHistory.slice(-limit);
  }

  /**
   * 获取统计
   */
  getStats() {
    const total = this.reflectionHistory.length;
    if (total === 0) {
      return { total: 0, avgConfidence: 0, qualityBreakdown: {} };
    }

    const qualityBreakdown = { excellent: 0, good: 0, acceptable: 0, poor: 0, failed: 0 };
    let totalConfidence = 0;

    for (const r of this.reflectionHistory) {
      qualityBreakdown[r.quality]++;
      totalConfidence += r.confidence;
    }

    return {
      total,
      avgConfidence: (totalConfidence / total).toFixed(3),
      qualityBreakdown,
      totalSuggestions: this.reflectionHistory.reduce((sum, r) => sum + (r.suggestions?.length || 0), 0)
    };
  }

  /**
   * 搜索类似反思
   */
  findSimilar(reflection) {
    const targetQuality = reflection.quality;
    const targetTools = reflection.execution.toolsUsed || [];

    return this.reflectionHistory
      .filter(r => r.id !== reflection.id)
      .map(r => {
        let similarity = 0;

        // 质量相似
        if (r.quality === targetQuality) similarity += 0.3;

        // 工具相似
        const commonTools = r.execution.toolsUsed?.filter(t => targetTools.includes(t)) || [];
        similarity += commonTools.length * 0.1;

        return { reflection: r, similarity };
      })
      .filter(r => r.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }
}

/**
 * 自我改进器
 */
class SelfImprover {
  constructor(reflectionEngine) {
    this.reflectionEngine = reflectionEngine;
    this.improvements = [];
    this.maxImprovements = 50;
  }

  /**
   * 基于反思生成改进
   */
  generateImprovement(reflection) {
    const improvements = [];

    // 从质量问题生成改进
    if (reflection.quality === 'poor' || reflection.quality === 'failed') {
      improvements.push({
        type: 'task_decomposition',
        suggestion: '改进任务分解策略',
        reason: `质量评估为 ${reflection.quality}`,
        priority: 'high'
      });
    }

    // 从效率问题生成改进
    if (reflection.analysis?.efficiency?.rating === 'slow') {
      improvements.push({
        type: 'parallel_execution',
        suggestion: '考虑并行执行独立步骤',
        reason: '执行时间过长',
        priority: 'medium'
      });
    }

    // 从错误生成改进
    for (const problem of reflection.analysis?.problems || []) {
      if (problem.type === 'error') {
        improvements.push({
          type: 'error_handling',
          suggestion: `改进错误处理: ${problem.description.slice(0, 50)}`,
          reason: '遇到可处理的错误',
          priority: 'high'
        });
      }
    }

    return improvements;
  }

  /**
   * 应用改进
   */
  applyImprovement(improvement) {
    this.improvements.push({
      ...improvement,
      appliedAt: Date.now(),
      id: `imp-${Date.now()}`
    });

    if (this.improvements.length > this.maxImprovements) {
      this.improvements = this.improvements.slice(-this.maxImprovements);
    }

    return improvement;
  }

  /**
   * 获取改进历史
   */
  getImprovements(limit = 10) {
    return this.improvements.slice(-limit);
  }

  /**
   * 获取统计
   */
  getStats() {
    const byType = {};
    for (const imp of this.improvements) {
      byType[imp.type] = (byType[imp.type] || 0) + 1;
    }

    return {
      total: this.improvements.length,
      byType
    };
  }
}

module.exports = { ReflectionEngine, SelfImprover };
