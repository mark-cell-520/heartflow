/**
 * 连接管理器 (Connection Manager) v1.0.0
 *
 * 支持重连、心跳、超时管理的连接管理
 */

const EventEmitter = require('events');

class ConnectionManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      reconnect: options.reconnect !== false,
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      heartbeatInterval: options.heartbeatInterval || 30000,
      connectionTimeout: options.connectionTimeout || 10000,
      idleTimeout: options.idleTimeout || 300000,
      ...options
    };

    // 连接状态
    this.state = 'disconnected'; // disconnected, connecting, connected, reconnecting
    this.connectedAt = null;
    this.lastHeartbeat = null;
    this.reconnectAttempts = 0;

    // 连接配置
    this.config = null;
    this.connection = null;

    // 定时器
    this.timers = {
      reconnect: null,
      heartbeat: null,
      idle: null
    };
  }

  /**
   * 连接到服务器
   */
  async connect(config) {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.config = config;
    this.state = 'connecting';

    this.emit('connecting', { config });

    try {
      // 执行连接
      this.connection = await this._doConnect(config);

      // 连接成功
      this.state = 'connected';
      this.connectedAt = Date.now();
      this.lastHeartbeat = Date.now();
      this.reconnectAttempts = 0;

      this.emit('connected', {
        connection: this.connection,
        duration: Date.now() - this.connectedAt
      });

      // 启动心跳
      this._startHeartbeat();

      return this.connection;
    } catch (error) {
      this.state = 'disconnected';
      this.emit('error', { error: error.message });

      // 尝试重连
      if (this.options.reconnect) {
        this._scheduleReconnect();
      }

      throw error;
    }
  }

  /**
   * 执行实际连接
   */
  async _doConnect(config) {
    // 这里应该是实际的连接逻辑
    // 例如：WebSocket, HTTP, TCP 等

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('连接超时'));
      }, this.options.connectionTimeout);

      // 模拟连接成功
      // 实际实现中替换为真实连接逻辑
      setTimeout(() => {
        clearTimeout(timeout);
        resolve({ id: `conn-${Date.now()}`, config });
      }, 100);
    });
  }

  /**
   * 断开连接
   */
  async disconnect(reason = 'manual') {
    this._clearTimers();
    this.state = 'disconnected';
    this.connection = null;
    this.connectedAt = null;

    this.emit('disconnected', { reason });
  }

  /**
   * 发送数据
   */
  async send(data, options = {}) {
    if (this.state !== 'connected') {
      throw new Error(`无法发送: 连接状态为 ${this.state}`);
    }

    const timeout = options.timeout || this.options.connectionTimeout;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('发送超时'));
      }, timeout);

      // 模拟发送
      // 实际实现中替换为真实发送逻辑
      setTimeout(() => {
        clearTimeout(timer);
        resolve({ success: true, data });
      }, 10);
    });
  }

  /**
   * 重连
   */
  async reconnect() {
    if (this.state === 'reconnecting') {
      return;
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('reconnect_failed', {
        attempts: this.reconnectAttempts
      });
      this.state = 'disconnected';
      return;
    }

    this.reconnectAttempts++;
    this.state = 'reconnecting';

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      nextAttempt: this.options.reconnectInterval * this.reconnectAttempts
    });

    // 计算延迟（指数退避）
    const delay = this.options.reconnectInterval * Math.min(this.reconnectAttempts, 5);

    await this._sleep(delay);

    try {
      await this.connect(this.config);
    } catch (error) {
      // 继续重连
      if (this.options.reconnect) {
        this._scheduleReconnect();
      }
    }
  }

  /**
   * 调度重连
   */
  _scheduleReconnect() {
    if (this.timers.reconnect) {
      return;
    }

    const delay = this.options.reconnectInterval * Math.min(this.reconnectAttempts + 1, 5);

    this.timers.reconnect = setTimeout(() => {
      this.timers.reconnect = null;
      this.reconnect();
    }, delay);
  }

  /**
   * 启动心跳
   */
  _startHeartbeat() {
    this._clearTimer('heartbeat');

    this.timers.heartbeat = setInterval(async () => {
      if (this.state !== 'connected') return;

      try {
        await this._sendHeartbeat();
        this.lastHeartbeat = Date.now();
        this.emit('heartbeat', { timestamp: this.lastHeartbeat });
      } catch (error) {
        // 检查是否超时
        if (Date.now() - this.lastHeartbeat > this.options.idleTimeout) {
          this.emit('idle_timeout');
          await this.disconnect('idle_timeout');
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 发送心跳
   */
  async _sendHeartbeat() {
    if (!this.connection) {
      throw new Error('无活动连接');
    }

    // 实际实现中发送实际的心跳
    return { success: true };
  }

  /**
   * 清除单个定时器
   */
  _clearTimer(name) {
    if (this.timers[name]) {
      clearInterval(this.timers[name]);
      this.timers[name] = null;
    }
  }

  /**
   * 清除所有定时器
   */
  _clearTimers() {
    for (const name of Object.keys(this.timers)) {
      this._clearTimer(name);
    }
  }

  /**
   * 休眠
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      state: this.state,
      connected: this.state === 'connected',
      connectedAt: this.connectedAt ? new Date(this.connectedAt).toISOString() : null,
      lastHeartbeat: this.lastHeartbeat ? new Date(this.lastHeartbeat).toISOString() : null,
      reconnectAttempts: this.reconnectAttempts,
      uptime: this.connectedAt ? Date.now() - this.connectedAt : 0
    };
  }
}

/**
 * WebSocket 连接管理器
 */
class WebSocketManager extends ConnectionManager {
  constructor(options = {}) {
    super({
      ...options,
      heartbeatInterval: options.heartbeatInterval || 30000
    });

    this.ws = null;
    this.messageQueue = [];
  }

  /**
   * 执行 WebSocket 连接
   */
  async _doConnect(config) {
    return new Promise((resolve, reject) => {
      // 实际实现中替换为真实 WebSocket 连接
      // 例如: this.ws = new WebSocket(url);

      const mockConn = {
        id: `ws-${Date.now()}`,
        send: (data) => {},
        close: () => {}
      };

      resolve(mockConn);
    });
  }

  /**
   * 发送 WebSocket 消息
   */
  async send(data) {
    if (this.state !== 'connected') {
      // 队列消息
      this.messageQueue.push(data);
      return;
    }

    return super.send(data);
  }

  /**
   * 处理消息
   */
  handleMessage(data) {
    this.emit('message', data);

    // 处理队列中的消息
    while (this.messageQueue.length > 0 && this.state === 'connected') {
      const msg = this.messageQueue.shift();
      super.send(msg);
    }
  }
}

module.exports = { ConnectionManager, WebSocketManager };
