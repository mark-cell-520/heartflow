/**
 * MCP 服务器连接器 (MCP Server Connector) v1.0.0
 *
 * 支持连接 MCP 服务器，扩展 Agent 工具能力
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * MCP 服务器连接器
 */
class McpServer {
  constructor(name, command, args = [], env = {}) {
    this.name = name;
    this.command = command;
    this.args = args;
    this.env = env;
    this.process = null;
    this.tools = [];
    this.handlers = new Map();
    this.connected = false;
    this.messageId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * 启动 MCP 服务器
   */
  async start() {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, ...this.env };

      this.process = spawn(this.command, this.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env
      });

      let stdout = '';
      let stderr = '';

      this.process.stdout.on('data', (data) => {
        stdout += data.toString();
        this._processMessage(data.toString());
      });

      this.process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      this.process.on('error', (error) => {
        console.error(`[MCP:${this.name}] 启动失败:`, error.message);
        reject(error);
      });

      this.process.on('close', (code) => {
        console.log(`[MCP:${this.name}] 进程退出: ${code}`);
        this.connected = false;
      });

      // 等待连接就绪
      setTimeout(() => {
        if (this.connected) {
          resolve();
        } else {
          // 尝试初始化
          this._send({
            jsonrpc: '2.0',
            id: this._nextId(),
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {}
            }
          });

          setTimeout(() => resolve(), 500);
        }
      }, 1000);
    });
  }

  /**
   * 停止 MCP 服务器
   */
  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.connected = false;
  }

  /**
   * 调用工具
   */
  async callTool(toolName, args) {
    if (!this.connected) {
      throw new Error(`MCP 服务器 ${this.name} 未连接`);
    }

    return new Promise((resolve, reject) => {
      const id = this._nextId();

      this.pendingRequests.set(id, { resolve, reject });

      this._send({
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      });

      // 超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`工具调用超时: ${toolName}`));
        }
      }, 30000);
    });
  }

  /**
   * 列出可用工具
   */
  async listTools() {
    if (!this.connected) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const id = this._nextId();

      this.pendingRequests.set(id, resolve);

      this._send({
        jsonrpc: '2.0',
        id,
        method: 'tools/list',
        params: {}
      });

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve({ tools: [] });
        }
      }, 5000);
    });
  }

  /**
   * 处理收到的消息
   */
  _processMessage(data) {
    try {
      const lines = data.split('\n').filter(l => l.trim());
      for (const line of lines) {
        if (line.startsWith('Content-Length:')) continue;

        const msg = JSON.parse(line);

        if (msg.id && this.pendingRequests.has(msg.id)) {
          const { resolve, reject } = this.pendingRequests.get(msg.id);
          this.pendingRequests.delete(msg.id);

          if (msg.error) {
            reject(new Error(msg.error.message || msg.error));
          } else {
            resolve(msg.result);
          }
        }

        // 处理通知
        if (!msg.id && msg.method) {
          this._handleNotification(msg);
        }
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  /**
   * 处理通知
   */
  _handleNotification(msg) {
    console.log(`[MCP:${this.name}] 通知:`, msg.method);
  }

  /**
   * 发送消息
   */
  _send(msg) {
    if (!this.process || !this.process.stdin) return;

    const json = JSON.stringify(msg);
    const length = Buffer.byteLength(json, 'utf8');

    this.process.stdin.write(`Content-Length: ${length}\r\n\r\n${json}`);
  }

  /**
   * 生成下一个 ID
   */
  _nextId() {
    return ++this.messageId;
  }
}

/**
 * MCP 服务器管理器
 */
class McpServerManager {
  constructor() {
    this.servers = new Map();
  }

  /**
   * 添加 MCP 服务器
   */
  async addServer(name, config) {
    const { command, args = [], env = {} } = config;

    const server = new McpServer(name, command, args, env);
    await server.start();

    this.servers.set(name, server);
    console.log(`[McpManager] 服务器已添加: ${name}`);

    return server;
  }

  /**
   * 移除 MCP 服务器
   */
  async removeServer(name) {
    const server = this.servers.get(name);
    if (server) {
      await server.stop();
      this.servers.delete(name);
      console.log(`[McpManager] 服务器已移除: ${name}`);
    }
  }

  /**
   * 获取服务器
   */
  getServer(name) {
    return this.servers.get(name);
  }

  /**
   * 获取所有服务器
   */
  getAllServers() {
    return this.servers;
  }

  /**
   * 调用工具（自动路由到对应服务器）
   */
  async callTool(serverName, toolName, args) {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`MCP 服务器未找到: ${serverName}`);
    }
    return await server.callTool(toolName, args);
  }

  /**
   * 列出所有工具
   */
  async listAllTools() {
    const allTools = [];

    for (const [name, server] of this.servers) {
      try {
        const { tools = [] } = await server.listTools();
        for (const tool of tools) {
          allTools.push({
            server: name,
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          });
        }
      } catch (e) {
        console.warn(`[McpManager] 获取工具失败 (${name}):`, e.message);
      }
    }

    return allTools;
  }

  /**
   * 停止所有服务器
   */
  async stopAll() {
    for (const server of this.servers.values()) {
      await server.stop();
    }
    this.servers.clear();
  }

  /**
   * 健康检查
   */
  healthCheck() {
    const status = {};
    for (const [name, server] of this.servers) {
      status[name] = {
        connected: server.connected,
        toolCount: server.tools.length
      };
    }
    return status;
  }
}

module.exports = { McpServer, McpServerManager };
