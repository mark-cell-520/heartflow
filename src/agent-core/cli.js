/**
 * Agent CLI 入口 (Agent CLI) v1.0.0
 *
 * 命令行接口，支持交互/单次/流式模式
 */

const { MarkCode } = require('./heart-agent');
const { McpServerManager } = require('./mcp-server');
const path = require('path');
const fs = require('fs');

class AgentCLI {
  constructor() {
    this.agent = null;
    this.mcpManager = null;
    this.running = false;
    this.history = [];
    this.historyFile = path.join(process.env.HOME || '.', '.heart-agent-history');
  }

  /**
   * 初始化 Agent
   */
  async initialize(configPath = null) {
    // 加载配置
    const config = this._loadConfig(configPath);

    // 创建 Agent
    this.agent = new MarkCode({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      apiType: config.apiType || 'anthropic',
      model: config.model || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      rootPath: config.rootPath || process.cwd(),
      maxContextMessages: config.maxContextMessages || 100
    });

    // 初始化
    await this.agent.initialize();

    // 加载 MCP 服务器
    await this._loadMcpServers(config);

    // 加载历史
    this._loadHistory();

    console.log('[CLI] Agent 初始化完成');
    return this.agent;
  }

  /**
   * 加载 MCP 服务器配置
   */
  async _loadMcpServers(config) {
    if (!config.mcpServers) return;

    this.mcpManager = new McpServerManager();

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      try {
        await this.mcpManager.addServer(name, serverConfig);
        const server = this.mcpManager.getServer(name);
        this.agent.registerMcpServer(name, server);
      } catch (e) {
        console.warn(`[CLI] MCP 服务器启动失败 (${name}):`, e.message);
      }
    }
  }

  /**
   * 加载配置
   */
  _loadConfig(configPath) {
    // 环境变量优先
    if (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
      return {
        apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
        apiType: process.env.API_TYPE || 'anthropic',
        model: process.env.MODEL || 'claude-sonnet-4-20250514'
      };
    }

    // 配置文件
    if (configPath && fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    // 默认配置路径
    const defaultPath = path.join(process.cwd(), '.heart-agent.json');
    if (fs.existsSync(defaultPath)) {
      return JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
    }

    throw new Error('未找到 API 配置，请设置 ANTHROPIC_API_KEY 或 OPENAI_API_KEY 环境变量');
  }

  /**
   * 加载历史
   */
  _loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        this.history = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
      }
    } catch (e) {
      this.history = [];
    }
  }

  /**
   * 保存历史
   */
  _saveHistory() {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(this.history.slice(-1000)));
    } catch (e) {
      // 忽略
    }
  }

  /**
   * 添加到历史
   */
  _addToHistory(input, output) {
    this.history.push({
      input,
      output,
      timestamp: Date.now()
    });
    this._saveHistory();
  }

  /**
   * 启动交互式会话
   */
  async startSession() {
    const readline = require('readline');

    this.running = true;

    // 创建 readline 接口
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: (line) => this._completer(line)
    });

    // 开始会话
    this.agent.session.start({ mode: 'interactive' });

    console.log('=== HeartFlow Agent v1.5.0 ===');
    console.log('命令: /help 查看帮助, /exit 退出, /history 查看历史');
    console.log('输入你的问题或任务\n');

    rl.prompt();

    rl.on('line', async (input) => {
      const line = input.trim();

      // 命令处理
      if (line.startsWith('/')) {
        await this._handleCommand(line, rl);
        rl.prompt();
        return;
      }

      if (!line) {
        rl.prompt();
        return;
      }

      // 保存到历史
      this._addToHistory(line, '');

      try {
        const response = await this.agent.process(line);

        if (response.success) {
          console.log('\n--- 结果 ---');
          console.log(response.output || '(无输出)');
        } else {
          console.log('\n--- 错误 ---');
          console.log(response.error);
        }

        // 更新历史
        this.history[this.history.length - 1].output = response.output || response.error;
      } catch (error) {
        console.error('处理错误:', error.message);
      }

      console.log();
      rl.prompt();
    });

    rl.on('close', () => {
      this.running = false;
      this._saveHistory();
    });
  }

  /**
   * 命令补全
   */
  _completer(line) {
    const commands = ['/help', '/exit', '/quit', '/history', '/clear', '/status', '/tools', '/reset'];
    const hits = commands.filter(c => c.startsWith(line));
    return [hits.length ? hits : commands, line];
  }

  /**
   * 处理命令
   */
  async _handleCommand(line, rl) {
    const [cmd, ...args] = line.split(' ');

    switch (cmd) {
      case '/help':
        console.log(`
命令帮助:
  /help        显示帮助
  /exit        退出
  /quit        退出
  /history     显示历史
  /clear       清屏
  /status      显示状态
  /tools       列出工具
  /reset       重置会话
  /mcp         显示 MCP 服务器状态
`);
        break;

      case '/exit':
      case '/quit':
        console.log('再见！');
        this._saveHistory();
        rl.close();
        this.running = false;
        break;

      case '/history':
        console.log('\n--- 历史记录 ---');
        for (let i = Math.max(0, this.history.length - 10); i < this.history.length; i++) {
          const h = this.history[i];
          console.log(`[${i + 1}] ${h.input.slice(0, 50)}...`);
        }
        break;

      case '/clear':
        console.clear();
        break;

      case '/status':
        console.log('\n--- Agent 状态 ---');
        const status = this.agent.getStatus();
        console.log(JSON.stringify(status, null, 2));
        break;

      case '/tools':
        console.log('\n--- 可用工具 ---');
        const tools = this.agent.getTools();
        console.log(`共 ${tools.length} 个工具:`);
        for (const tool of tools.slice(0, 20)) {
          console.log(`  - ${tool.name}: ${tool.description}`);
        }
        if (tools.length > 20) {
          console.log(`  ... 还有 ${tools.length - 20} 个工具`);
        }
        break;

      case '/reset':
        await this.agent.resetSession();
        console.log('会话已重置');
        break;

      case '/mcp':
        if (this.mcpManager) {
          console.log('\n--- MCP 服务器 ---');
          const status = this.mcpManager.healthCheck();
          console.log(JSON.stringify(status, null, 2));
        } else {
          console.log('MCP 服务器未配置');
        }
        break;

      default:
        console.log(`未知命令: ${cmd}`);
    }
  }

  /**
   * 单次执行
   */
  async runOnce(input, options = {}) {
    await this.initialize();

    const response = await this.agent.process(input, options);

    this.agent.session.end();

    return response;
  }

  /**
   * 执行文件中的任务
   */
  async runFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));

    await this.initialize();

    for (const line of lines) {
      console.log(`\n> ${line}`);
      const response = await this.agent.process(line);
      console.log(response.output || response.error || response.message);
    }

    this.agent.session.end();
  }

  /**
   * 流式输出
   */
  async runStream(input) {
    await this.initialize();

    console.log('\n> 流式输出:\n');

    const stream = this.agent.processStream(input);

    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }

    console.log('\n');

    this.agent.session.end();
  }

  /**
   * REPL 模式
   */
  async startRepl() {
    await this.initialize();
    await this.startSession();
  }
}

// 导出
module.exports = { AgentCLI };

// CLI 入口
if (require.main === module) {
  const cli = new AgentCLI();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 交互模式
    cli.startSession().catch(console.error);
  } else if (args[0] === '--file' || args[0] === '-f') {
    // 文件模式
    const filePath = args[1];
    if (!filePath) {
      console.error('请指定文件路径: --file <path>');
      process.exit(1);
    }
    cli.runFile(filePath).catch(console.error);
  } else if (args[0] === '--stream' || args[0] === '-s') {
    // 流式模式
    const input = args.slice(1).join(' ');
    cli.runStream(input).catch(console.error);
  } else if (args[0] === '--help' || args[0] === '-h') {
    // 帮助
    console.log(`
HeartFlow Agent CLI v1.5.0

用法:
  node cli.js                    # 交互模式
  node cli.js --file <path>      # 执行文件中的任务
  node cli.js --stream <input>   # 流式输出
  node cli.js --help             # 显示帮助

环境变量:
  ANTHROPIC_API_KEY    Anthropic API 密钥
  OPENAI_API_KEY       OpenAI API 密钥
  API_TYPE             api 类型 (anthropic/openai)
  MODEL                模型名称

配置文件 (.heart-agent.json):
{
  "apiKey": "your-api-key",
  "apiType": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}

交互命令:
  /help        显示帮助
  /exit        退出
  /history     查看历史
  /status      状态
  /tools       工具列表
  /reset       重置会话
  /mcp         MCP 服务器
    `);
  } else {
    // 单次执行
    const input = args.join(' ');
    cli.runOnce(input)
      .then(r => {
        console.log(r.output || r.message);
        process.exit(r.success ? 0 : 1);
      })
      .catch(e => {
        console.error(e.message);
        process.exit(1);
      });
  }
}
