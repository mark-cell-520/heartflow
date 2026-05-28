/**
 * 工具注册表 (Tool Registry) v1.0.0
 *
 * 管理所有可用工具
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.hooks = {
      before: [],
      after: []
    };
    this._registerBuiltInTools();
  }

  /**
   * 注册内置工具
   */
  _registerBuiltInTools() {
    // Bash 工具
    this.register({
      name: 'bash',
      description: '执行 bash 命令',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的命令' },
          timeout: { type: 'number', description: '超时时间(ms)', default: 60000 },
          cwd: { type: 'string', description: '工作目录' }
        },
        required: ['command']
      },
      handler: this._bashHandler.bind(this)
    });

    // Read 工具
    this.register({
      name: 'read',
      description: '读取文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          limit: { type: 'number', description: '最大行数' }
        },
        required: ['path']
      },
      handler: this._readHandler.bind(this)
    });

    // Write 工具
    this.register({
      name: 'write',
      description: '写入文件',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' }
        },
        required: ['path', 'content']
      },
      handler: this._writeHandler.bind(this)
    });

    // Edit 工具
    this.register({
      name: 'edit',
      description: '编辑文件（替换部分内容）',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          old_string: { type: 'string', description: '要替换的文本' },
          new_string: { type: 'string', description: '替换后的文本' }
        },
        required: ['path', 'old_string', 'new_string']
      },
      handler: this._editHandler.bind(this)
    });

    // Glob 工具
    this.register({
      name: 'glob',
      description: '查找匹配的文件',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'glob 模式' },
          cwd: { type: 'string', description: '搜索目录' }
        },
        required: ['pattern']
      },
      handler: this._globHandler.bind(this)
    });

    // Grep 工具
    this.register({
      name: 'grep',
      description: '搜索文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: '搜索模式' },
          path: { type: 'string', description: '搜索路径' },
          regex: { type: 'boolean', description: '是否正则', default: false }
        },
        required: ['pattern', 'path']
      },
      handler: this._grepHandler.bind(this)
    });

    // Grep 工具 (别名)
    this.register({
      name: 'search',
      description: '搜索文件内容（grep 别名）',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: '搜索模式' },
          path: { type: 'string', description: '搜索路径' },
          regex: { type: 'boolean', description: '是否正则', default: false }
        },
        required: ['pattern', 'path']
      },
      handler: this._grepHandler.bind(this)
    });

    // WebFetch 工具
    this.register({
      name: 'web_fetch',
      description: '获取网页内容',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '网页 URL' },
          prompt: { type: 'string', description: '提取提示' }
        },
        required: ['url']
      },
      handler: this._webFetchHandler.bind(this)
    });

    // WebSearch 工具
    this.register({
      name: 'web_search',
      description: '搜索网页',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索查询' }
        },
        required: ['query']
      },
      handler: this._webSearchHandler.bind(this)
    });

    // TodoWrite 工具
    this.register({
      name: 'todo_write',
      description: '创建任务列表',
      inputSchema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
                content: { type: 'string' }
              }
            }
          }
        }
      },
      handler: this._todoWriteHandler.bind(this)
    });

    // Grep 工具 (别名)
    this.register({
      name: 'TodoWrite',
      description: '创建任务列表',
      inputSchema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
                content: { type: 'string' }
              }
            }
          }
        }
      },
      handler: this._todoWriteHandler.bind(this)
    });
  }

  /**
   * 注册工具
   */
  register(tool) {
    this.tools.set(tool.name, {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: tool.handler,
      dangerous: tool.dangerous || false
    });
  }

  /**
   * 获取工具
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具
   */
  getAllTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }));
  }

  /**
   * 执行工具
   */
  async execute(name, input, context = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Unknown tool: ${name}` };
    }

    // 运行前置钩子
    for (const hook of this.hooks.before) {
      await hook(name, input, context);
    }

    try {
      const result = await tool.handler(input, context);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      // 运行后置钩子
      for (const hook of this.hooks.after) {
        await hook(name, input, context);
      }
    }
  }

  /**
   * 添加前置钩子
   */
  addBeforeHook(hook) {
    this.hooks.before.push(hook);
  }

  /**
   * 添加后置钩子
   */
  addAfterHook(hook) {
    this.hooks.after.push(hook);
  }

  /**
   * 工具数量
   */
  count() {
    return this.tools.size;
  }

  // ─── 内置工具处理器 ─────────────────────────────────────────────────────────

  /**
   * Bash 处理器
   */
  async _bashHandler(input, context) {
    return new Promise((resolve) => {
      const { command, timeout = 60000, cwd = process.cwd() } = input;

      // 安全检查
      if (this._isDangerousCommand(command)) {
        resolve({ success: false, error: '危险命令被阻止' });
        return;
      }

      const child = spawn('bash', ['-c', command], {
        cwd,
        timeout,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code
        });
      });

      child.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      setTimeout(() => {
        child.kill();
        resolve({ success: false, error: '命令超时' });
      }, timeout);
    });
  }

  /**
   * 危险命令检测
   */
  _isDangerousCommand(command) {
    const dangerous = [
      /rm\s+-rf\s+\//,
      /dd\s+if=.*of=\/dev/,
      /mkfs/,
      /:(){ :|:& };:/,  // Fork bomb
      /curl.*\|.*sh/i,
      /wget.*\|.*sh/i
    ];
    return dangerous.some(pattern => pattern.test(command));
  }

  /**
   * Read 处理器
   */
  async _readHandler(input, context) {
    const { path: filePath, limit } = input;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      return {
        success: true,
        content: limit ? lines.slice(0, limit).join('\n') : content,
        lines: lines.length,
        truncated: limit && lines.length > limit
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Write 处理器
   */
  async _writeHandler(input, context) {
    const { path: filePath, content } = input;

    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Edit 处理器
   */
  async _editHandler(input, context) {
    const { path: filePath, old_string, new_string } = input;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes(old_string)) {
        return { success: false, error: '未找到要替换的文本' };
      }
      const newContent = content.replace(old_string, new_string);
      fs.writeFileSync(filePath, newContent, 'utf-8');
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Glob 处理器
   */
  async _globHandler(input, context) {
    const { pattern, cwd = process.cwd() } = input;

    try {
      // 简单的 glob 实现
      const results = await this._glob(pattern, cwd);
      return { success: true, files: results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 简单 glob
   */
  async _glob(pattern, cwd) {
    const files = [];
    const regex = new RegExp(
      pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    );

    const search = (dir) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          search(fullPath);
        } else if (regex.test(entry.name)) {
          files.push(fullPath);
        }
      }
    };

    search(cwd);
    return files;
  }

  /**
   * Grep 处理器
   */
  async _grepHandler(input, context) {
    const { pattern, path: searchPath, regex = false } = input;

    try {
      const results = [];
      const searchRegex = regex ? new RegExp(pattern) : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

      const search = (dir) => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            search(fullPath);
          } else if (entry.isFile()) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');
              lines.forEach((line, i) => {
                if (searchRegex.test(line)) {
                  results.push({
                    file: fullPath,
                    line: i + 1,
                    content: line.trim()
                  });
                }
              });
            } catch (e) {
              // 跳过无法读取的文件
            }
          }
        }
      };

      search(searchPath);
      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * WebFetch 处理器
   */
  async _webFetchHandler(input, context) {
    const { url, prompt } = input;

    try {
      const response = await fetch(url);
      const text = await response.text();
      return {
        success: true,
        content: text.slice(0, 10000),
        url
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * WebSearch 处理器
   */
  async _webSearchHandler(input, context) {
    // 需要外部搜索 API，这里返回提示
    return {
      success: true,
      results: [],
      message: 'Web search 需要配置外部搜索 API'
    };
  }

  /**
   * TodoWrite 处理器
   */
  async _todoWriteHandler(input, context) {
    return {
      success: true,
      tasks: input.tasks
    };
  }
}

module.exports = { ToolRegistry };
