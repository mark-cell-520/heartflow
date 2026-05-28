/**
 * 自我评估器 (Self Evaluator) v1.0.0
 *
 * 评估工具执行效果，决策是否需要重新执行
 */

class SelfEvaluator {
  constructor(options = {}) {
    this.maxSelfChecks = options.maxSelfChecks || 3;
    this.confidenceThreshold = options.confidenceThreshold || 0.7;
    this.history = [];
  }

  /**
   * 评估执行结果
   */
  evaluate(result, context = {}) {
    const evaluation = {
      timestamp: Date.now(),
      success: result.success,
      hasOutput: !!result.output || !!result.stdout,
      hasError: !!result.error || !!result.stderr,
      executionTime: result.duration || 0
    };

    // 基础评分
    let score = 0;
    let reasons = [];

    // 成功且有输出 = 高分
    if (result.success && (result.output || result.stdout)) {
      score += 0.4;
      reasons.push('成功且有输出');
    }

    // 无错误 = 加分
    if (!result.error && !result.stderr) {
      score += 0.2;
      reasons.push('无错误');
    }

    // 有实际执行时间 = 可能有效
    if (result.duration && result.duration > 0) {
      score += 0.1;
      reasons.push('有执行时间');
    }

    // 有结构化结果 = 加分
    if (result.result && typeof result.result === 'object') {
      score += 0.1;
      reasons.push('结构化结果');
    }

    // 检查是否有警告
    if (result.stderr && result.stderr.length > 0) {
      score -= 0.1;
      evaluation.warnings = this._parseWarnings(result.stderr);
    }

    // 评分
    evaluation.score = Math.min(1, Math.max(0, score));
    evaluation.reasons = reasons;
    evaluation.level = this._getLevel(evaluation.score);
    evaluation.suggestions = this._getSuggestions(evaluation);

    // 置信度
    evaluation.confidence = this._calculateConfidence(evaluation, context);

    this.history.push(evaluation);

    return evaluation;
  }

  /**
   * 评估是否需要重新执行
   */
  shouldRetry(evaluation, attemptCount = 1) {
    if (attemptCount >= this.maxSelfChecks) {
      return { shouldRetry: false, reason: '已达最大重试次数' };
    }

    if (evaluation.score >= this.confidenceThreshold) {
      return { shouldRetry: false, reason: '评估分数足够高' };
    }

    if (!evaluation.success) {
      return { shouldRetry: true, reason: '执行失败' };
    }

    if (evaluation.hasError) {
      return { shouldRetry: true, reason: '存在错误' };
    }

    if (evaluation.score < 0.3) {
      return { shouldRetry: true, reason: '评估分数过低' };
    }

    return { shouldRetry: false, reason: '评估分数可接受' };
  }

  /**
   * 验证输出质量
   */
  validateOutput(result, expectedFormat) {
    if (!result.success) {
      return { valid: false, issues: ['执行失败'] };
    }

    const issues = [];

    if (expectedFormat === 'json') {
      if (!result.output) {
        issues.push('期望 JSON 但无输出');
      } else {
        try {
          JSON.parse(result.output);
        } catch {
          issues.push('JSON 解析失败');
        }
      }
    }

    if (expectedFormat === 'text' && !result.output) {
      issues.push('期望文本但无输出');
    }

    if (expectedFormat === 'file' && !result.path) {
      issues.push('期望文件但未生成');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * 比较两次执行结果
   */
  compare(result1, result2) {
    const evaluation1 = this.evaluate(result1);
    const evaluation2 = this.evaluate(result2);

    const changes = {
      scoreDelta: evaluation2.score - evaluation1.score,
      successChanged: result1.success !== result2.success,
      outputChanged: result1.output !== result2.output,
      errorChanged: (result1.error || '') !== (result2.error || ''),
      timeDelta: (result2.duration || 0) - (result1.duration || 0)
    };

    changes.improved = changes.scoreDelta > 0.1;
    changes.degraded = changes.scoreDelta < -0.1;

    return {
      before: evaluation1,
      after: evaluation2,
      changes
    };
  }

  /**
   * 获取执行历史统计
   */
  getStats() {
    const total = this.history.length;
    if (total === 0) {
      return { total: 0, avgScore: 0, successRate: '0%' };
    }

    const successful = this.history.filter(e => e.success).length;
    const avgScore = this.history.reduce((sum, e) => sum + e.score, 0) / total;

    return {
      total,
      successful,
      failed: total - successful,
      successRate: (successful / total * 100).toFixed(1) + '%',
      avgScore: avgScore.toFixed(3),
      avgConfidence: (this.history.reduce((sum, e) => sum + e.confidence, 0) / total).toFixed(3)
    };
  }

  /**
   * 获取历史
   */
  getHistory(limit = 20) {
    return this.history.slice(-limit);
  }

  // ─── 私有方法 ─────────────────────────────────────────────────────────────

  /**
   * 解析警告
   */
  _parseWarnings(stderr) {
    const warnings = [];
    const lines = stderr.split('\n');

    for (const line of lines) {
      if (line.includes('warning') || line.includes('Warning') || line.includes('WARN')) {
        warnings.push(line.trim());
      }
    }

    return warnings;
  }

  /**
   * 获取等级
   */
  _getLevel(score) {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'acceptable';
    if (score >= 0.3) return 'poor';
    return 'failed';
  }

  /**
   * 获取建议
   */
  _getSuggestions(evaluation) {
    const suggestions = [];

    if (evaluation.score < 0.5) {
      suggestions.push('考虑重新执行或使用替代方案');
    }

    if (evaluation.hasError) {
      suggestions.push('检查并修复错误');
    }

    if (evaluation.warnings?.length > 0) {
      suggestions.push('注意警告信息');
    }

    if (!evaluation.hasOutput && evaluation.success) {
      suggestions.push('执行成功但无输出，可能需要验证');
    }

    return suggestions;
  }

  /**
   * 计算置信度
   */
  _calculateConfidence(evaluation, context = {}) {
    let confidence = 0.5;

    // 基础置信度
    confidence = evaluation.score * 0.6;

    // 执行时间影响（过长或过短都降低置信度）
    if (evaluation.executionTime > 0) {
      if (evaluation.executionTime < 100) {
        confidence -= 0.1; // 太快可能没执行
      } else if (evaluation.executionTime > 300000) {
        confidence -= 0.2; // 太慢
      }
    }

    // 历史参考
    if (context.toolName && this.history.length > 0) {
      const toolHistory = this.history.filter(e => e.toolName === context.toolName);
      if (toolHistory.length >= 3) {
        const avgScore = toolHistory.reduce((sum, e) => sum + e.score, 0) / toolHistory.length;
        confidence = confidence * 0.7 + avgScore * 0.3;
      }
    }

    return Math.min(1, Math.max(0, confidence));
  }
}

/**
 * 工具效果追踪器
 */
class ToolEffectTracker {
  constructor() {
    this.tracking = new Map();
  }

  /**
   * 开始追踪
   */
  startTrack(operationId, toolName) {
    this.tracking.set(operationId, {
      toolName,
      startTime: Date.now(),
      checkpoints: []
    });
  }

  /**
   * 添加检查点
   */
  addCheckpoint(operationId, checkpoint) {
    const track = this.tracking.get(operationId);
    if (track) {
      track.checkpoints.push({
        ...checkpoint,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 结束追踪
   */
  endTrack(operationId, result) {
    const track = this.tracking.get(operationId);
    if (track) {
      track.endTime = Date.now();
      track.duration = track.endTime - track.startTime;
      track.result = result;
      track.completed = true;
    }
    return track;
  }

  /**
   * 获取追踪信息
   */
  getTrack(operationId) {
    return this.tracking.get(operationId);
  }

  /**
   * 获取工具统计
   */
  getToolStats(toolName) {
    const tracks = [...this.tracking.values()].filter(t => t.toolName === toolName && t.completed);

    if (tracks.length === 0) {
      return { count: 0, avgDuration: 0, successRate: '0%' };
    }

    const successful = tracks.filter(t => t.result?.success).length;
    const avgDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0) / tracks.length;

    return {
      count: tracks.length,
      successful,
      failed: tracks.length - successful,
      successRate: (successful / tracks.length * 100).toFixed(1) + '%',
      avgDuration: Math.round(avgDuration) + 'ms',
      avgCheckpoints: (tracks.reduce((sum, t) => sum + t.checkpoints.length, 0) / tracks.length).toFixed(1)
    };
  }

  /**
   * 清空追踪
   */
  clear() {
    this.tracking.clear();
  }
}

module.exports = { SelfEvaluator, ToolEffectTracker };
