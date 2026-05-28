/**
 * 配置管理器 (Config Manager) v1.0.0
 *
 * .claude.json 配置管理和验证
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(options = {}) {
    this.configPaths = options.configPaths || [
      path.join(process.cwd(), '.heart-agent.json'),
      path.join(process.env.HOME || '.', '.heart-agent.json'),
      path.join(process.env.HOME || '.', '.config', 'heart-agent.json')
    ];

    this.schema = {
      apiKey: { type: 'string', required: false },
      apiType: { type: 'string', enum: ['anthropic', 'openai'], default: 'anthropic' },
      model: { type: 'string', default: 'claude-sonnet-4-20250514' },
      maxTokens: { type: 'number', default: 4096 },
      temperature: { type: 'number', min: 0, max: 2, default: 0.7 },
      maxContextMessages: { type: 'number', default: 100 },
      maxConcurrency: { type: 'number', default: 5 },
      timeout: { type: 'number', default: 60000 },
      rootPath: { type: 'string', default: process.cwd() },
      mcpServers: { type: 'object', default: {} },
      rateLimit: {
        type: 'object',
        properties: {
          requests: { type: 'number', default: 60 },
          window: { type: 'number', default: 60000 }
        }
      },
      budget: {
        type: 'object',
        properties: {
          maxTokens: { type: 'number', default: 100000 },
          warnThreshold: { type: 'number', default: 0.8 }
        }
      },
      hooks: {
        type: 'object',
        properties: {
          preToolUse: { type: 'array', default: [] },
          postToolUse: { type: 'array', default: [] }
        }
      },
      sandbox: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: true },
          maxMemory: { type: 'number', default: 512 * 1024 * 1024 },
          allowedPaths: { type: 'array', default: [] }
        }
      }
    };

    this.config = {};
    this.loadedFrom = null;
  }

  /**
   * 加载配置
   */
  load() {
    // 环境变量优先
    this.config = this._loadFromEnv();

    // 然后配置文件
    for (const configPath of this.configPaths) {
      if (fs.existsSync(configPath)) {
        const fileConfig = this._loadFromFile(configPath);
        this.config = this._merge(this.config, fileConfig);
        this.loadedFrom = configPath;
        break;
      }
    }

    // 应用默认值
    this.config = this._applyDefaults(this.config);

    // 验证
    const validation = this.validate(this.config);
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
    }

    return this.config;
  }

  /**
   * 从环境变量加载
   */
  _loadFromEnv() {
    const config = {};

    if (process.env.ANTHROPIC_API_KEY) {
      config.apiKey = process.env.ANTHROPIC_API_KEY;
      config.apiType = 'anthropic';
    } else if (process.env.OPENAI_API_KEY) {
      config.apiKey = process.env.OPENAI_API_KEY;
      config.apiType = 'openai';
    }

    if (process.env.MODEL) {
      config.model = process.env.MODEL;
    }

    if (process.env.API_TYPE) {
      config.apiType = process.env.API_TYPE;
    }

    return config;
  }

  /**
   * 从文件加载
   */
  _loadFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`[Config] 加载配置文件失败: ${filePath}`, error.message);
      return {};
    }
  }

  /**
   * 合并配置
   */
  _merge(base, override) {
    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this._merge(result[key] || {}, value);
      } else if (value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * 应用默认值
   */
  _applyDefaults(config) {
    const result = { ...config };

    for (const [key, schema] of Object.entries(this.schema)) {
      if (result[key] === undefined) {
        if (schema.default !== undefined) {
          result[key] = typeof schema.default === 'function' ? schema.default() : schema.default;
        }
      }
    }

    return result;
  }

  /**
   * 验证配置
   */
  validate(config) {
    const errors = [];

    for (const [key, schema] of Object.entries(this.schema)) {
      const value = config[key];

      // 必需检查
      if (schema.required && (value === undefined || value === null)) {
        errors.push(`${key} 是必需的`);
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // 类型检查
      if (schema.type && typeof value !== schema.type) {
        errors.push(`${key} 类型错误，期望 ${schema.type}`);
        continue;
      }

      // 枚举检查
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${key} 必须是 ${schema.enum.join(' | ')} 之一`);
      }

      // 范围检查
      if (schema.min !== undefined && value < schema.min) {
        errors.push(`${key} 必须 >= ${schema.min}`);
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push(`${key} 必须 <= ${schema.max}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 保存配置
   */
  save(filePath, config = null) {
    const toSave = config || this.config;
    const content = JSON.stringify(toSave, null, 2);

    fs.writeFileSync(filePath, content, 'utf-8');
    this.loadedFrom = filePath;

    return true;
  }

  /**
   * 获取配置
   */
  get(key = null) {
    if (key) {
      return this.config[key];
    }
    return { ...this.config };
  }

  /**
   * 设置配置
   */
  set(key, value) {
    this.config[key] = value;
  }

  /**
   * 获取配置来源
   */
  getSource() {
    return this.loadedFrom || 'env';
  }

  /**
   * 导出配置（不含敏感信息）
   */
  export() {
    const exported = { ...this.config };
    const sensitiveKeys = ['apiKey', 'password', 'token', 'secret'];

    for (const key of sensitiveKeys) {
      if (exported[key]) {
        exported[key] = '[REDACTED]';
      }
    }

    return exported;
  }
}

/**
 * 会话恢复管理器
 */
class SessionRecoveryManager {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(process.cwd(), 'data', 'sessions');
    this.maxAge = options.maxAge || 7 * 24 * 60 * 60 * 1000; // 7 天
  }

  /**
   * 保存会话状态
   */
  saveState(sessionId, state) {
    const filePath = path.join(this.storagePath, `${sessionId}.state.json`);

    const data = {
      sessionId,
      state,
      savedAt: Date.now(),
      version: '1.0.0'
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('[SessionRecovery] 保存失败:', error.message);
      return false;
    }
  }

  /**
   * 恢复会话状态
   */
  restoreState(sessionId) {
    const filePath = path.join(this.storagePath, `${sessionId}.state.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // 检查是否过期
      if (Date.now() - data.savedAt > this.maxAge) {
        this.deleteState(sessionId);
        return null;
      }

      return data.state;
    } catch (error) {
      console.error('[SessionRecovery] 恢复失败:', error.message);
      return null;
    }
  }

  /**
   * 删除会话状态
   */
  deleteState(sessionId) {
    const filePath = path.join(this.storagePath, `${sessionId}.state.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  /**
   * 列出可恢复的会话
   */
  listRecoverable() {
    if (!fs.existsSync(this.storagePath)) {
      return [];
    }

    const files = fs.readdirSync(this.storagePath)
      .filter(f => f.endsWith('.state.json'));

    const sessions = [];

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.storagePath, file), 'utf-8'));
        const age = Date.now() - data.savedAt;

        sessions.push({
          sessionId: data.sessionId,
          savedAt: new Date(data.savedAt).toISOString(),
          age: Math.round(age / 1000 / 60) + ' 分钟前',
          recoverable: age < this.maxAge
        });
      } catch (error) {
        // 忽略
      }
    }

    return sessions.sort((a, b) => b.savedAt - a.savedAt);
  }

  /**
   * 清理过期会话
   */
  cleanup() {
    if (!fs.existsSync(this.storagePath)) {
      return 0;
    }

    const files = fs.readdirSync(this.storagePath)
      .filter(f => f.endsWith('.state.json'));

    let cleaned = 0;

    for (const file of files) {
      try {
        const filePath = path.join(this.storagePath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (Date.now() - data.savedAt > this.maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (error) {
        // 忽略
      }
    }

    return cleaned;
  }
}

module.exports = { ConfigManager, SessionRecoveryManager };
