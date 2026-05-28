/**
 * 步骤跟踪器 (Step Tracker) v1.0.0
 *
 * 跟踪每个执行步骤的详细信息
 */

class StepTracker {
  constructor() {
    this.steps = [];
    this.currentIndex = -1;
  }

  /**
   * 添加步骤
   */
  addStep(step) {
    const stepRecord = {
      id: `step-${this.steps.length}`,
      name: step.name || step.description || 'unnamed',
      type: step.type || 'unknown',
      tool: step.tool || null,
      args: step.args || {},
      status: 'pending',
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      duration: null,
      result: null,
      error: null,
      retries: 0,
      metadata: step.metadata || {}
    };

    this.steps.push(stepRecord);
    return stepRecord.id;
  }

  /**
   * 开始步骤
   */
  startStep(stepId) {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return null;

    step.status = 'running';
    step.startedAt = Date.now();
    this.currentIndex = this.steps.indexOf(step);

    return step;
  }

  /**
   * 完成步骤
   */
  completeStep(stepId, result) {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return null;

    step.status = result.success === false ? 'failed' : 'completed';
    step.completedAt = Date.now();
    step.duration = step.completedAt - (step.startedAt || Date.now());
    step.result = result;

    if (result.error) {
      step.error = result.error;
    }

    return step;
  }

  /**
   * 标记步骤失败
   */
  failStep(stepId, error) {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return null;

    step.status = 'failed';
    step.completedAt = Date.now();
    step.duration = step.completedAt - (step.startedAt || Date.now());
    step.error = error.message || String(error);

    return step;
  }

  /**
   * 重试步骤
   */
  retryStep(stepId) {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return null;

    step.retries++;
    step.status = 'pending';
    step.startedAt = null;
    step.completedAt = null;
    step.duration = null;
    step.result = null;
    step.error = null;

    return step;
  }

  /**
   * 获取当前步骤
   */
  getCurrentStep() {
    if (this.currentIndex < 0 || this.currentIndex >= this.steps.length) {
      return null;
    }
    return this.steps[this.currentIndex];
  }

  /**
   * 获取上一步
   */
  getPreviousStep() {
    if (this.currentIndex <= 0) return null;
    return this.steps[this.currentIndex - 1];
  }

  /**
   * 获取步骤统计
   */
  getStats() {
    const stats = {
      total: this.steps.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0
    };

    for (const step of this.steps) {
      stats[step.status]++;
    }

    stats.successRate = stats.total > 0
      ? `${((stats.completed / stats.total) * 100).toFixed(1)}%`
      : '0%';

    return stats;
  }

  /**
   * 获取完整报告
   */
  getReport() {
    return {
      steps: this.steps,
      currentIndex: this.currentIndex,
      stats: this.getStats(),
      totalDuration: this.steps.reduce((sum, s) => sum + (s.duration || 0), 0)
    };
  }

  /**
   * 重置
   */
  reset() {
    this.steps = [];
    this.currentIndex = -1;
  }
}

module.exports = { StepTracker };
