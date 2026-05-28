/**
 * 执行监控中心 (Execution Monitor) v1.0.0
 *
 * 实时追踪执行状态
 */

const { EventEmitter } = require('events');

class ExecutionMonitor extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.maxHistory = 100;
  }

  /**
   * 开始监控任务
   */
  startMonitor(taskId, task) {
    const record = {
      taskId,
      task,
      status: 'running',
      steps: [],
      currentStep: 0,
      startTime: Date.now(),
      updates: [],
      errors: [],
      warnings: []
    };
    this.tasks.set(taskId, record);
    this.emit('start', record);
    return record;
  }

  /**
   * 更新步骤
   */
  stepUpdate(taskId, stepIndex, stepInfo) {
    const record = this.tasks.get(taskId);
    if (!record) return;

    record.currentStep = stepIndex;
    record.steps[stepIndex] = {
      ...stepInfo,
      status: 'in_progress',
      startedAt: Date.now()
    };

    record.updates.push({
      type: 'step_update',
      stepIndex,
      time: Date.now()
    });

    this.emit('step', record);
  }

  /**
   * 步骤完成
   */
  stepComplete(taskId, stepIndex, result) {
    const record = this.tasks.get(taskId);
    if (!record) return;

    if (record.steps[stepIndex]) {
      record.steps[stepIndex].status = result.success ? 'completed' : 'failed';
      record.steps[stepIndex].completedAt = Date.now();
      record.steps[stepIndex].duration = record.steps[stepIndex].completedAt - record.steps[stepIndex].startedAt;
      record.steps[stepIndex].result = result;
    }

    record.updates.push({
      type: 'step_complete',
      stepIndex,
      success: result.success,
      time: Date.now()
    });

    this.emit('stepComplete', record);
  }

  /**
   * 添加错误
   */
  addError(taskId, error) {
    const record = this.tasks.get(taskId);
    if (!record) return;

    record.errors.push({
      error,
      time: Date.now()
    });
    record.status = 'error';

    this.emit('error', { taskId, error });
  }

  /**
   * 添加警告
   */
  addWarning(taskId, warning) {
    const record = this.tasks.get(taskId);
    if (!record) return;

    record.warnings.push({
      warning,
      time: Date.now()
    });

    this.emit('warning', { taskId, warning });
  }

  /**
   * 完成任务
   */
  completeMonitor(taskId, finalResult) {
    const record = this.tasks.get(taskId);
    if (!record) return;

    record.status = finalResult.success ? 'completed' : 'failed';
    record.endTime = Date.now();
    record.duration = record.endTime - record.startTime;
    record.finalResult = finalResult;

    // 清理旧任务
    this._cleanup();

    this.emit('complete', record);
    return record;
  }

  /**
   * 获取任务状态
   */
  getStatus(taskId) {
    const record = this.tasks.get(taskId);
    if (!record) return null;

    return {
      taskId,
      status: record.status,
      progress: {
        current: record.currentStep + 1,
        total: record.steps.length,
        percentage: record.steps.length > 0
          ? Math.round((record.currentStep / record.steps.length) * 100)
          : 0
      },
      duration: Date.now() - record.startTime,
      errors: record.errors.length,
      warnings: record.warnings.length,
      isRunning: record.status === 'running'
    };
  }

  /**
   * 获取详细状态
   */
  getDetailedStatus(taskId) {
    const record = this.tasks.get(taskId);
    if (!record) return null;

    return {
      ...record,
      progress: this.getStatus(taskId)
    };
  }

  /**
   * 获取所有任务
   */
  getAllTasks() {
    return Array.from(this.tasks.entries()).map(([id, record]) => ({
      taskId: id,
      status: record.status,
      progress: record.steps.length,
      currentStep: record.currentStep,
      duration: Date.now() - record.startTime
    }));
  }

  /**
   * 清理旧任务
   */
  _cleanup() {
    if (this.tasks.size > this.maxHistory) {
      const oldest = Array.from(this.tasks.keys())[0];
      this.tasks.delete(oldest);
    }
  }
}

module.exports = { ExecutionMonitor };
