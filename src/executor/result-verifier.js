/**
 * 结果验证器 (Result Verifier) v1.0.0
 *
 * 验证执行结果
 * 1. 输出质量检查
 * 2. 失败重试机制
 * 3. 自适应执行策略
 */

class ResultVerifier {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.verificationRules = new Map();

    // 默认验证规则
    this._registerDefaultRules();
  }

  /**
   * 注册验证规则
   */
  registerRule(name, rule) {
    this.verificationRules.set(name, {
      name,
      check: rule.check,
      retry: rule.retry || false,
      maxAttempts: rule.maxAttempts || this.maxRetries
    });
  }

  /**
   * 验证结果
   */
  verify(result, context = {}) {
    const verifications = [];

    for (const [name, rule] of this.verificationRules) {
      try {
        const checkResult = rule.check(result, context);
        verifications.push({
          rule: name,
          passed: checkResult.passed !== false,
          details: checkResult.details || checkResult.message || null,
          suggestion: checkResult.suggestion || null
        });
      } catch (error) {
        verifications.push({
          rule: name,
          passed: false,
          error: error.message
        });
      }
    }

    const allPassed = verifications.every(v => v.passed);

    return {
      success: allPassed,
      passed: verifications.filter(v => v.passed).length,
      failed: verifications.filter(v => !v.passed).length,
      verifications,
      recommendations: verifications.filter(v => !v.passed && v.suggestion)
    };
  }

  /**
   * 验证并重试（如果失败）
   */
  async verifyWithRetry(result, context = {}) {
    const rule = context.ruleName ? this.verificationRules.get(context.ruleName) : null;
    const maxAttempts = rule?.maxAttempts || this.maxRetries;

    let attempts = 0;
    let lastResult = result;

    while (attempts < maxAttempts) {
      const verification = this.verify(lastResult, context);

      if (verification.success) {
        return {
          success: true,
          attempts: attempts + 1,
          verification
        };
      }

      attempts++;

      if (attempts < maxAttempts) {
        // 等待后重试
        await this._delay(this.retryDelay * attempts);

        // 获取重试建议
        const retryStrategy = this._getRetryStrategy(verification, context);
        if (retryStrategy) {
          lastResult = await retryStrategy();
        }
      }
    }

    return {
      success: false,
      attempts,
      finalVerification: verification,
      error: '最大重试次数已用完'
    };
  }

  /**
   * 获取重试策略
   */
  _getRetryStrategy(verification, context) {
    const failedRules = verification.verifications.filter(v => !v.passed);

    for (const failed of failedRules) {
      if (failed.suggestion) {
        return () => this._executeRetryStrategy(failed.suggestion, context);
      }
    }

    return null;
  }

  /**
   * 执行重试策略
   */
  async _executeRetryStrategy(suggestion, context) {
    // 根据建议调整执行
    switch (suggestion.type) {
      case 'increase_timeout':
        return { adjusted: true, timeout: (suggestion.value || 30000) * 2 };

      case 'change_params':
        return { adjusted: true, params: suggestion.params };

      case 'alternative_command':
        return { adjusted: true, command: suggestion.command };

      default:
        return { adjusted: false };
    }
  }

  /**
   * 延迟
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 注册默认规则
   */
  _registerDefaultRules() {
    // 成功状态检查
    this.registerRule('success_check', {
      check: (result) => ({
        passed: result.success !== false,
        message: result.success ? '执行成功' : '执行失败'
      })
    });

    // 输出非空检查
    this.registerRule('output_not_empty', {
      check: (result) => {
        const hasOutput = result.stdout || result.stderr || result.output;
        return {
          passed: hasOutput && hasOutput.trim().length > 0,
          message: hasOutput ? '有输出' : '无输出'
        };
      }
    });

    // 错误信息检查
    this.registerRule('no_error_in_output', {
      check: (result) => {
        const output = result.stdout || result.stderr || '';
        const errorPatterns = [
          /error/i,
          /fail/i,
          /exception/i,
          /traceback/i
        ];

        const hasError = errorPatterns.some(p => p.test(output));
        return {
          passed: !hasError,
          message: hasError ? '输出包含错误信息' : '输出正常'
        };
      }
    });

    // 文件存在检查
    this.registerRule('file_exists', {
      check: (result, context) => {
        if (!context.expectedFile) {
          return { passed: true, message: '未指定文件检查' };
        }

        const fs = require('fs');
        const exists = fs.existsSync(context.expectedFile);
        return {
          passed: exists,
          message: exists ? '文件存在' : '文件不存在'
        };
      },
      retry: true
    });

    // JSON 解析检查
    this.registerRule('valid_json', {
      check: (result) => {
        const output = result.stdout || result.output || '';
        try {
          JSON.parse(output);
          return { passed: true, message: '有效的 JSON' };
        } catch {
          return { passed: false, message: '无效的 JSON' };
        }
      }
    });

    // 退出码检查
    this.registerRule('exit_code_zero', {
      check: (result) => ({
        passed: result.exitCode === 0 || result.exitCode === undefined,
        message: result.exitCode === 0 ? '退出码正常' : `退出码异常: ${result.exitCode}`
      })
    });
  }

  /**
   * 验证命令输出模式
   */
  verifyPattern(output, pattern, context = {}) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const matches = output.match(regex);

    return {
      success: matches !== null,
      matches: matches ? matches.length : 0,
      matchedText: matches ? matches[0] : null
    };
  }

  /**
   * 生成验证报告
   */
  generateReport(verification) {
    const lines = [
      '=== 验证报告 ===',
      `状态: ${verification.success ? '通过' : '失败'}`,
      `通过: ${verification.passed}, 失败: ${verification.failed}`,
      ''
    ];

    if (verification.verifications) {
      lines.push('详细结果:');
      for (const v of verification.verifications) {
        const status = v.passed ? '✓' : '✗';
        lines.push(`  ${status} ${v.rule}: ${v.message || ''}`);
        if (v.details) lines.push(`    详情: ${v.details}`);
        if (v.suggestion) lines.push(`    建议: ${JSON.stringify(v.suggestion)}`);
      }
    }

    return lines.join('\n');
  }
}

module.exports = { ResultVerifier };
