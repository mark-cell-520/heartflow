/**
 * 会话管理器 (Session Manager) v1.0.0
 *
 * 管理 Agent 会话状态
 */

const fs = require('fs');
const path = require('path');

class SessionManager {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(__dirname, '../../data/agent-sessions');
    this.currentSession = null;
    this.ensured = false;
  }

  /**
   * 确保存储目录存在
   */
  _ensureStoragePath() {
    if (this.ensured) return;
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
    this.ensured = true;
  }

  /**
   * 开始会话
   */
  start(metadata = {}) {
    this._ensureStoragePath();

    this.currentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      lastActive: Date.now(),
      metadata,
      turns: 0,
      toolsUsed: {},
      tasks: []
    };

    return this.currentSession;
  }

  /**
   * 结束会话
   */
  end() {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    // 保存会话
    this._saveSession(this.currentSession);

    const ended = this.currentSession;
    this.currentSession = null;
    return ended;
  }

  /**
   * 保存会话
   */
  _saveSession(session) {
    this._ensureStoragePath();
    const filePath = path.join(this.storagePath, `${session.id}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      // 忽略保存错误
    }
  }

  /**
   * 恢复会话
   */
  resumeSession(sessionId) {
    this._ensureStoragePath();
    const filePath = path.join(this.storagePath, `${sessionId}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      this.currentSession = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      this.currentSession.lastActive = Date.now();
      return this.currentSession;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取当前会话
   */
  getSession() {
    return this.currentSession;
  }

  /**
   * 获取会话 ID
   */
  get id() {
    return this.currentSession?.id || null;
  }

  /**
   * 记录回合
   */
  recordTurn(input, output, metadata = {}) {
    if (!this.currentSession) return;

    this.currentSession.turns++;
    this.currentSession.lastActive = Date.now();
    this.currentSession.lastTurn = {
      input: input.slice(0, 500),
      output: output.slice(0, 500),
      timestamp: Date.now(),
      ...metadata
    };
  }

  /**
   * 记录工具使用
   */
  recordToolUse(toolName, success) {
    if (!this.currentSession) return;

    if (!this.currentSession.toolsUsed[toolName]) {
      this.currentSession.toolsUsed[toolName] = { success: 0, failure: 0 };
    }

    if (success) {
      this.currentSession.toolsUsed[toolName].success++;
    } else {
      this.currentSession.toolsUsed[toolName].failure++;
    }
  }

  /**
   * 添加任务
   */
  addTask(task) {
    if (!this.currentSession) return null;

    const taskRecord = {
      id: `task-${Date.now()}`,
      description: task.description || task,
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null
    };

    this.currentSession.tasks.push(taskRecord);
    return taskRecord;
  }

  /**
   * 更新任务状态
   */
  updateTask(taskId, updates) {
    if (!this.currentSession) return null;

    const task = this.currentSession.tasks.find(t => t.id === taskId);
    if (!task) return null;

    Object.assign(task, updates);
    if (updates.status === 'completed') {
      task.completedAt = Date.now();
    }

    return task;
  }

  /**
   * 获取会话历史
   */
  getHistory(limit = 10) {
    this._ensureStoragePath();

    const sessions = [];
    try {
      const files = fs.readdirSync(this.storagePath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const session = JSON.parse(fs.readFileSync(path.join(this.storagePath, file), 'utf-8'));
        sessions.push({
          id: session.id,
          startTime: session.startTime,
          endTime: session.endTime,
          turns: session.turns,
          duration: session.duration
        });
      }
    } catch (error) {
      // 忽略错误
    }

    return sessions
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * 删除旧会话
   */
  deleteOldSessions(maxAgeDays = 30) {
    this._ensureStoragePath();

    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let deleted = 0;

    try {
      const files = fs.readdirSync(this.storagePath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(this.storagePath, file);
        const session = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (session.startTime < cutoff) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      }
    } catch (error) {
      // 忽略错误
    }

    return deleted;
  }
}

module.exports = { SessionManager };
