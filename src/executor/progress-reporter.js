/**
 * 进度报告器 (Progress Reporter) v1.0.0
 *
 * 生成可读的进度报告
 */

class ProgressReporter {
  constructor(options = {}) {
    this.format = options.format || 'text';  // text | json | minimal
    this.showWarnings = options.showWarnings !== false;
    this.showTiming = options.showTiming !== false;
  }

  /**
   * 生成任务开始报告
   */
  reportStart(task) {
    const lines = [];

    if (this.format === 'minimal') {
      lines.push(`🚀 开始: ${task.description || '任务'}`);
    } else {
      lines.push('═'.repeat(50));
      lines.push(`🚀 开始执行任务`);
      lines.push(`   ${task.description || '未描述'}`);
      if (task.steps) {
        lines.push(`   预计 ${task.steps.length} 个步骤`);
      }
      lines.push('═'.repeat(50));
    }

    return lines.join('\n');
  }

  /**
   * 生成步骤报告
   */
  reportStep(step, index, total) {
    const lines = [];
    const progress = `[${index + 1}/${total}]`;

    if (this.format === 'minimal') {
      const status = step.status === 'running' ? '⚡'
        : step.status === 'completed' ? '✓'
        : step.status === 'failed' ? '✗' : '○';
      lines.push(`${status} ${progress} ${step.name}`);
    } else {
      const bar = this._makeProgressBar(index, total);
      lines.push('');
      lines.push(`\n${bar} ${progress}`);
      lines.push(`   步骤: ${step.name}`);
      if (step.tool) {
        lines.push(`   工具: ${step.tool}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 生成完成报告
   */
  reportComplete(result, stats) {
    const lines = [];

    if (this.format === 'minimal') {
      const icon = result.success ? '✅' : '❌';
      lines.push(`${icon} 完成 (${stats.duration}ms)`);
    } else {
      lines.push('');
      lines.push('═'.repeat(50));

      if (result.success) {
        lines.push('✅ 任务完成');
      } else {
        lines.push('❌ 任务失败');
      }

      if (this.showTiming) {
        lines.push(`   耗时: ${stats.duration}ms`);
      }

      lines.push(`   步骤: ${stats.completed}/${stats.total} 完成`);

      if (stats.failed > 0) {
        lines.push(`   失败: ${stats.failed}`);
      }

      if (this.showWarnings && stats.warnings > 0) {
        lines.push(`   警告: ${stats.warnings}`);
      }

      lines.push('═'.repeat(50));
    }

    return lines.join('\n');
  }

  /**
   * 生成错误报告
   */
  reportError(error, context) {
    const lines = [];

    if (this.format === 'minimal') {
      lines.push(`❌ 错误: ${error.message}`);
    } else {
      lines.push('');
      lines.push('┌─────────────────────────────────────┐');
      lines.push('│ ❌ 错误                                    │');
      lines.push('├─────────────────────────────────────┤');
      lines.push(`│ ${error.message || '未知错误'}`.slice(0, 40).padEnd(40) + '│');

      if (context) {
        lines.push('├─────────────────────────────────────┤');
        lines.push(`│ 上下文: ${context}`.slice(0, 40).padEnd(40) + '│');
      }

      lines.push('└─────────────────────────────────────┘');
    }

    return lines.join('\n');
  }

  /**
   * 生成进度条
   */
  _makeProgressBar(current, total, width = 30) {
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}]`;
  }

  /**
   * 生成摘要报告
   */
  reportSummary(report) {
    const lines = [];

    if (this.format === 'minimal') {
      lines.push(`📊 ${report.stats.completed}/${report.stats.total} 成功`);
    } else {
      lines.push('');
      lines.push('┌─────────────────────────────────────┐');
      lines.push('│ 📊 执行摘要                               │');
      lines.push('├─────────────────────────────────────┤');
      lines.push(`│ 总步骤:  ${report.stats.total}`.padEnd(42) + '│');
      lines.push(`│ ✅ 完成:  ${report.stats.completed}`.padEnd(42) + '│');
      lines.push(`│ ❌ 失败:  ${report.stats.failed}`.padEnd(42) + '│');
      lines.push(`│ ⏳ 等待:  ${report.stats.pending}`.padEnd(42) + '│');
      lines.push('├─────────────────────────────────────┤');
      lines.push(`│ 成功率:  ${report.stats.successRate}`.padEnd(42) + '│');
      lines.push(`│ 总耗时:  ${report.totalDuration}ms`.padEnd(42) + '│');
      lines.push('└─────────────────────────────────────┘');
    }

    return lines.join('\n');
  }
}

module.exports = { ProgressReporter };
