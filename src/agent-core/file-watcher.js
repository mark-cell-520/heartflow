/**
 * 文件系统监听器 (File Watcher) v1.0.0
 *
 * 监控文件变化，支持递归监听
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class FileWatcher extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      persistent: options.persistent !== false,
      ignoreHidden: options.ignoreHidden !== false,
      ignorePatterns: options.ignorePatterns || [
        'node_modules', '.git', '__pycache__', '*.pyc', '.DS_Store'
      ],
      debounceMs: options.debounceMs || 100,
      recursive: options.recursive !== false,
      watchExisting: options.watchExisting !== false,
      ...options
    };

    this.watchers = new Map();
    this.watchedFiles = new Set();
    this.watchedDirs = new Set();
    this.ignoreRegex = new RegExp(
      this.options.ignorePatterns.map(p =>
        p.replace(/\*/g, '.*').replace(/\?/g, '.')
      ).join('|')
    );

    this.debounceTimers = new Map();
  }

  /**
   * 监听文件或目录
   */
  watch(targetPath) {
    if (this.watchers.has(targetPath)) {
      return targetPath;
    }

    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      return this._watchDir(targetPath);
    } else {
      return this._watchFile(targetPath);
    }
  }

  /**
   * 监听文件
   */
  _watchFile(filePath) {
    if (this._shouldIgnore(filePath)) {
      return null;
    }

    try {
      const watcher = fs.watch(filePath, { persistent: this.options.persistent }, (eventType) => {
        this._handleEvent(filePath, eventType);
      });

      this.watchers.set(filePath, watcher);
      this.watchedFiles.add(filePath);

      this.emit('watch', { type: 'file', path: filePath });

      return filePath;
    } catch (error) {
      console.error(`[FileWatcher] 监听文件失败: ${filePath}`, error.message);
      return null;
    }
  }

  /**
   * 监听目录
   */
  _watchDir(dirPath) {
    if (this._shouldIgnore(dirPath)) {
      return null;
    }

    try {
      const watcher = fs.watch(dirPath, { persistent: this.options.persistent, recursive: this.options.recursive }, (eventType, filename) => {
        if (filename) {
          const fullPath = path.join(dirPath, filename);
          this._handleEvent(fullPath, eventType);
        }
      });

      this.watchers.set(dirPath, watcher);
      this.watchedDirs.add(dirPath);

      // 监听现有文件
      if (this.options.watchExisting) {
        this._watchExisting(dirPath);
      }

      this.emit('watch', { type: 'directory', path: dirPath });

      return dirPath;
    } catch (error) {
      console.error(`[FileWatcher] 监听目录失败: ${dirPath}`, error.message);
      return null;
    }
  }

  /**
   * 监听现有文件
   */
  _watchExisting(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (this._shouldIgnore(fullPath)) {
        continue;
      }

      if (entry.isDirectory() && this.options.recursive) {
        this._watchExisting(fullPath);
      } else if (entry.isFile()) {
        this._watchFile(fullPath);
      }
    }
  }

  /**
   * 处理事件（防抖）
   */
  _handleEvent(filePath, eventType) {
    // 防抖
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this._emitEvent(filePath, eventType);
    }, this.options.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * 触发事件
   */
  _emitEvent(filePath, eventType) {
    const event = {
      path: filePath,
      type: eventType,
      timestamp: Date.now(),
      exists: fs.existsSync(filePath)
    };

    this.emit('change', event);

    // 根据事件类型触发
    if (eventType === 'rename') {
      if (event.exists) {
        this.emit('add', event);
      } else {
        this.emit('unlink', event);
      }
    } else if (eventType === 'change') {
      this.emit('modify', event);
    }
  }

  /**
   * 检查是否应该忽略
   */
  _shouldIgnore(filePath) {
    const name = path.basename(filePath);

    // 忽略隐藏文件
    if (this.options.ignoreHidden && name.startsWith('.')) {
      return true;
    }

    // 检查模式
    if (this.ignoreRegex.test(name)) {
      return true;
    }

    // 检查路径
    for (const dir of this.watchedDirs) {
      if (filePath.startsWith(dir + path.sep)) {
        const relative = filePath.slice(dir.length + 1);
        if (this.ignoreRegex.test(relative)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 取消监听
   */
  unwatch(targetPath) {
    const watcher = this.watchers.get(targetPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(targetPath);
      this.watchedFiles.delete(targetPath);
      this.watchedDirs.delete(targetPath);
      this.emit('unwatch', { path: targetPath });
      return true;
    }
    return false;
  }

  /**
   * 取消所有监听
   */
  unwatchAll() {
    for (const [targetPath] of this.watchers) {
      this.unwatch(targetPath);
    }

    // 清除所有定时器
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * 获取监听状态
   */
  getStatus() {
    return {
      watchedFiles: this.watchedFiles.size,
      watchedDirs: this.watchedDirs.size,
      totalWatchers: this.watchers.size,
      watchers: {
        files: [...this.watchedFiles],
        dirs: [...this.watchedDirs]
      }
    };
  }

  /**
   * 析构
   */
  destroy() {
    this.unwatchAll();
    this.removeAllListeners();
  }
}

/**
 * 文件变化历史
 */
class FileChangeHistory {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.changes = [];
  }

  /**
   * 记录变化
   */
  record(change) {
    const record = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...change,
      timestamp: Date.now()
    };

    this.changes.push(record);

    // 限制大小
    if (this.changes.length > this.maxSize) {
      this.changes = this.changes.slice(-this.maxSize);
    }

    return record.id;
  }

  /**
   * 查询变化
   */
  query(filter = {}) {
    let results = [...this.changes];

    if (filter.path) {
      results = results.filter(c => c.path.includes(filter.path));
    }

    if (filter.type) {
      results = results.filter(c => c.type === filter.type);
    }

    if (filter.since) {
      results = results.filter(c => c.timestamp >= filter.since);
    }

    if (filter.until) {
      results = results.filter(c => c.timestamp <= filter.until);
    }

    return results.slice(-(filter.limit || 100));
  }

  /**
   * 获取统计
   */
  getStats() {
    const byType = {};
    for (const change of this.changes) {
      byType[change.type] = (byType[change.type] || 0) + 1;
    }

    return {
      total: this.changes.length,
      byType,
      firstChange: this.changes[0]?.timestamp || null,
      lastChange: this.changes[this.changes.length - 1]?.timestamp || null
    };
  }

  /**
   * 清空历史
   */
  clear() {
    this.changes = [];
  }
}

module.exports = { FileWatcher, FileChangeHistory };
