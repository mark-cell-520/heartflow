/**
 * 审计日志 (Audit Logger) v1.0.0
 *
 * 完整的操作审计跟踪
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(process.cwd(), 'data', 'audit');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 10;
    this.currentFile = null;
    this.currentSize = 0;
    this.sequence = 0;

    // 内存索引
    this.index = new Map();
    this.recentLogs = [];

    this._ensureStorage();
  }

  /**
   * 确保存储目录存在
   */
  _ensureStorage() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * 记录操作
   */
  log(operation, details = {}) {
    const entry = {
      id: `audit-${Date.now()}-${++this.sequence}`,
      timestamp: Date.now(),
      operation,
      details,
      agent: details.agent || 'unknown',
      sessionId: details.sessionId || null,
      userId: details.userId || null,
      ip: details.ip || null,
      userAgent: details.userAgent || null,
      success: details.success !== false,
      error: details.error || null,
      duration: details.duration || null,
      metadata: details.metadata || {}
    };

    // 添加到内存
    this._addToMemory(entry);

    // 写入文件
    this._writeEntry(entry);

    return entry.id;
  }

  /**
   * 记录工具执行
   */
  logToolExecution(toolName, input, output, context = {}) {
    return this.log('tool_execution', {
      tool: toolName,
      input: this._sanitize(input),
      output: this._sanitize(output),
      success: output?.success !== false,
      error: output?.error || null,
      duration: context.duration || null,
      sessionId: context.sessionId,
      metadata: { toolName }
    });
  }

  /**
   * 记录 API 调用
   */
  logApiCall(apiType, model, inputTokens, outputTokens, context = {}) {
    return this.log('api_call', {
      apiType,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      success: true,
      duration: context.duration || null,
      sessionId: context.sessionId,
      metadata: { apiType, model }
    });
  }

  /**
   * 记录任务执行
   */
  logTask(taskId, taskType, input, output, context = {}) {
    return this.log('task_execution', {
      taskId,
      taskType,
      input: this._truncate(input, 1000),
      output: this._truncate(output, 1000),
      success: output?.success !== false,
      error: output?.error || null,
      duration: context.duration || null,
      sessionId: context.sessionId,
      metadata: { taskId, taskType }
    });
  }

  /**
   * 记录安全事件
   */
  logSecurity(event, details = {}) {
    return this.log('security', {
      event,
      ...details,
      severity: details.severity || 'medium',
      metadata: { event, ...details }
    });
  }

  /**
   * 记录错误
   */
  logError(operation, error, context = {}) {
    return this.log('error', {
      operation,
      error: error.message || String(error),
      stack: error.stack || null,
      success: false,
      ...context
    });
  }

  /**
   * 添加到内存
   */
  _addToMemory(entry) {
    this.recentLogs.push(entry);

    // 限制大小
    if (this.recentLogs.length > 1000) {
      this.recentLogs = this.recentLogs.slice(-500);
    }

    // 更新索引
    const dateKey = new Date(entry.timestamp).toISOString().split('T')[0];
    if (!this.index.has(dateKey)) {
      this.index.set(dateKey, []);
    }
    this.index.get(dateKey).push(entry.id);
  }

  /**
   * 写入文件
   */
  _writeEntry(entry) {
    try {
      const filename = this._getCurrentFile();
      const line = JSON.stringify(entry) + '\n';

      fs.appendFileSync(filename, line);
      this.currentSize += Buffer.byteLength(line, 'utf8');

      // 检查文件大小
      if (this.currentSize >= this.maxFileSize) {
        this._rotateFile();
      }
    } catch (error) {
      console.error('[AuditLogger] 写入失败:', error.message);
    }
  }

  /**
   * 获取当前文件
   */
  _getCurrentFile() {
    if (!this.currentFile) {
      const date = new Date().toISOString().split('T')[0];
      this.currentFile = path.join(this.storagePath, `audit-${date}.log`);
      this.currentSize = 0;

      // 检查文件是否存在
      if (fs.existsSync(this.currentFile)) {
        this.currentSize = fs.statSync(this.currentFile).size;
      }
    }

    return this.currentFile;
  }

  /**
   * 轮转文件
   */
  _rotateFile() {
    this.currentFile = null;
    this._cleanupOldFiles();
  }

  /**
   * 清理旧文件
   */
  _cleanupOldFiles() {
    try {
      const files = fs.readdirSync(this.storagePath)
        .filter(f => f.startsWith('audit-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.storagePath, f),
          time: fs.statSync(path.join(this.storagePath, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // 删除多余文件
      if (files.length > this.maxFiles) {
        for (const file of files.slice(this.maxFiles)) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (error) {
      // 忽略
    }
  }

  /**
   * 查询日志
   */
  query(filter = {}) {
    const results = [];

    // 内存中查询最近的
    for (const entry of this.recentLogs) {
      if (this._matchesFilter(entry, filter)) {
        results.push(entry);
      }
    }

    // 限制结果
    return results.slice(-(filter.limit || 100));
  }

  /**
   * 匹配过滤器
   */
  _matchesFilter(entry, filter) {
    if (filter.operation && entry.operation !== filter.operation) return false;
    if (filter.success !== undefined && entry.success !== filter.success) return false;
    if (filter.since && entry.timestamp < filter.since) return false;
    if (filter.until && entry.timestamp > filter.until) return false;
    if (filter.sessionId && entry.sessionId !== filter.sessionId) return false;
    if (filter.agent && entry.agent !== filter.agent) return false;

    return true;
  }

  /**
   * 获取统计
   */
  getStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = this.index.get(today) || [];

    const successCount = this.recentLogs.filter(e => e.success).length;
    const errorCount = this.recentLogs.length - successCount;

    const operations = {};
    for (const entry of this.recentLogs) {
      operations[entry.operation] = (operations[entry.operation] || 0) + 1;
    }

    return {
      totalInMemory: this.recentLogs.length,
      todayEntries: todayLogs.length,
      successRate: this.recentLogs.length > 0
        ? (successCount / this.recentLogs.length * 100).toFixed(1) + '%'
        : '0%',
      errorCount,
      byOperation: operations,
      storagePath: this.storagePath
    };
  }

  /**
   * 导出日志
   */
  export(filter = {}, format = 'json') {
    const logs = this.query(filter);

    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'operation', 'success', 'duration', 'error'];
      const rows = logs.map(l =>
        headers.map(h => {
          const val = l[h] || '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    return logs;
  }

  /**
   * 清理
   */
  clear(before = null) {
    let deleted = 0;

    if (before) {
      // 从内存中删除
      const beforeTime = typeof before === 'number' ? before : new Date(before).getTime();
      const filtered = this.recentLogs.filter(e => e.timestamp >= beforeTime);
      deleted = this.recentLogs.length - filtered.length;
      this.recentLogs = filtered;
    } else {
      deleted = this.recentLogs.length;
      this.recentLogs = [];
    }

    return deleted;
  }

  /**
   * 工具方法
   */
  _sanitize(obj) {
    if (!obj) return null;

    // 移除敏感信息
    const sanitized = { ...obj };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'credential'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  _truncate(str, maxLen) {
    if (!str) return '';
    str = String(str);
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  }
}

/**
 * 安全审计
 */
class SecurityAuditor {
  constructor(auditLogger) {
    this.logger = auditLogger;
  }

  /**
   * 检查危险操作
   */
  checkDangerousOperation(operation, details) {
    const dangerousPatterns = [
      { pattern: /rm\s+-rf\s+\//, name: 'root_delete', severity: 'critical' },
      { pattern: /curl.*\|.*sh/i, name: 'pipe_to_shell', severity: 'high' },
      { pattern: /wget.*\|.*sh/i, name: 'wget_shell', severity: 'high' },
      { pattern: /chmod\s+777/i, name: '过于宽松的权限', severity: 'medium' },
      { pattern: /eval\s*\(/i, name: 'eval_usage', severity: 'high' },
      { pattern: /exec\s*\(/i, name: 'exec_usage', severity: 'high' }
    ];

    const input = details.input || details.command || '';

    for (const { pattern, name, severity } of dangerousPatterns) {
      if (pattern.test(input)) {
        this.logger.logSecurity(name, {
          operation,
          details,
          severity,
          blocked: severity === 'critical'
        });

        return {
          dangerous: true,
          pattern: name,
          severity,
          blocked: severity === 'critical'
        };
      }
    }

    return { dangerous: false };
  }
}

module.exports = { AuditLogger, SecurityAuditor };
