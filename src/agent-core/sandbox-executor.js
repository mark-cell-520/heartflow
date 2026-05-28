/**
 * 沙箱执行器 (Sandbox Executor) v1.0.0
 *
 * 安全的命令执行环境，隔离危险操作
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SandboxExecutor {
  constructor(options = {}) {
    this.options = {
      maxMemory: options.maxMemory || 512 * 1024 * 1024, // 512MB
      maxCpuTime: options.maxCpuTime || 30000, // 30秒
      maxOutputSize: options.maxOutputSize || 1024 * 1024, // 1MB
      allowedPaths: options.allowedPaths || [], // 允许访问的路径
      blockedPaths: options.blockedPaths || [
        '/etc', '/usr', '/bin', '/sbin', '/root', '/boot', '/proc', '/sys'
      ],
      blockedCommands: options.blockedCommands || [
        'rm -rf /', 'dd if=', 'mkfs', ':(){ :|:& };:', 'curl.*\\|.*sh', 'wget.*\\|.*sh'
      ],
      timeout: options.timeout || 60000, // 默认超时 60秒
      workDir: options.workDir || path.join(os.tmpdir(), 'heart-sandbox'),
      ...options
    };

    this.sessions = new Map();
    this._ensureWorkDir();
  }

  /**
   * 确保工作目录存在
   */
  _ensureWorkDir() {
    if (!fs.existsSync(this.options.workDir)) {
      fs.mkdirSync(this.options.workDir, { recursive: true });
    }
  }

  /**
   * 创建沙箱会话
   */
  createSession(sessionId) {
    const session = {
      id: sessionId || `sandbox-${Date.now()}`,
      createdAt: Date.now(),
      commands: [],
      output: [],
      resources: {
        memory: 0,
        cpuTime: 0
      }
    };

    this.sessions.set(session.id, session);
    return session.id;
  }

  /**
   * 执行命令（沙箱环境）
   */
  async execute(command, options = {}) {
    const sessionId = options.sessionId || this.createSession();
    const session = this.sessions.get(sessionId);

    // 安全检查
    const safetyCheck = this._checkSafety(command);
    if (!safetyCheck.allowed) {
      return {
        success: false,
        error: safetyCheck.reason,
        blocked: true,
        sessionId
      };
    }

    // 路径检查
    const pathCheck = this._checkPaths(command);
    if (!pathCheck.allowed) {
      return {
        success: false,
        error: pathCheck.reason,
        blocked: true,
        sessionId
      };
    }

    const timeout = options.timeout || this.options.timeout;
    const cwd = options.cwd || this.options.workDir;

    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let killed = false;

      // 使用 bash -c 执行，限制环境
      const child = spawn('bash', ['-c', command], {
        cwd,
        env: {
          ...process.env,
          HOME: this.options.workDir,
          PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        // 资源限制通过 cgroups 或 ulimit 实现
      });

      const timeoutId = setTimeout(() => {
        killed = true;
        child.kill('SIGKILL');
        resolve({
          success: false,
          error: '命令超时',
          timedOut: true,
          duration: Date.now() - startTime,
          sessionId
        });
      }, timeout);

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        if (stdout.length + chunk.length > this.options.maxOutputSize) {
          stdout += chunk.slice(0, this.options.maxOutputSize - stdout.length);
          stdout += '\n[输出截断 - 超出大小限制]';
          child.kill();
        } else {
          stdout += chunk;
        }
      });

      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        if (stderr.length + chunk.length > this.options.maxOutputSize) {
          stderr += chunk.slice(0, this.options.maxOutputSize - stderr.length);
        } else {
          stderr += chunk;
        }
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);

        const result = {
          success: code === 0 && !killed,
          exitCode: code,
          stdout: stdout.slice(0, this.options.maxOutputSize),
          stderr: stderr.slice(0, this.options.maxOutputSize),
          duration: Date.now() - startTime,
          killed,
          sessionId
        };

        // 记录到会话
        session.commands.push({
          command,
          ...result,
          timestamp: Date.now()
        });

        resolve(result);
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: error.message,
          sessionId
        });
      });
    });
  }

  /**
   * 检查安全性
   */
  _checkSafety(command) {
    for (const pattern of this.options.blockedCommands) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(command)) {
        return {
          allowed: false,
          reason: `危险命令被阻止: ${pattern}`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * 检查路径访问
   */
  _checkPaths(command) {
    // 提取命令中的路径
    const pathPattern = /['"]?(\/[^\s'"]+)['"]?/g;
    let match;

    while ((match = pathPattern.exec(command)) !== null) {
      const cmdPath = match[1];

      // 检查是否在允许列表中
      for (const allowed of this.options.allowedPaths) {
        if (cmdPath.startsWith(allowed)) {
          return { allowed: true };
        }
      }

      // 检查是否在阻止列表中
      for (const blocked of this.options.blockedPaths) {
        if (cmdPath.startsWith(blocked)) {
          return {
            allowed: false,
            reason: `路径不在允许范围内: ${cmdPath}`
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * 获取会话
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * 关闭会话
   */
  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      activeSessions: this.sessions.size,
      workDir: this.options.workDir,
      config: {
        maxMemory: this.options.maxMemory,
        maxCpuTime: this.options.maxCpuTime,
        timeout: this.options.timeout
      }
    };
  }
}

/**
 * 进程池
 */
class ProcessPool {
  constructor(options = {}) {
    this.maxProcesses = options.maxProcesses || 5;
    this.processes = new Map();
    this.queue = [];
    this.completed = [];
  }

  /**
   * 获取可用槽位
   */
  async acquire() {
    if (this.processes.size < this.maxProcesses) {
      const id = `proc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      this.processes.set(id, { createdAt: Date.now(), busy: false });
      return { id, release: () => this.release(id) };
    }

    // 等待可用槽位
    return new Promise((resolve) => {
      this.queue.push({ resolve });
    });
  }

  /**
   * 释放槽位
   */
  release(id) {
    const proc = this.processes.get(id);
    if (proc) {
      this.processes.delete(id);
      proc.busy = false;
    }

    // 处理队列中的等待
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next.resolve(this.acquire());
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      active: this.processes.size,
      max: this.maxProcesses,
      queued: this.queue.length,
      available: this.maxProcesses - this.processes.size
    };
  }
}

module.exports = { SandboxExecutor, ProcessPool };
