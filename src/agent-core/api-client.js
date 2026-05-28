/**
 * API 客户端 (API Client) v1.0.0
 *
 * 连接 Anthropic/OpenAI API
 */

class ApiClient {
  constructor(config) {
    this.config = config;
    this.baseUrl = this._getBaseUrl();
    this.client = null;
  }

  /**
   * 获取 API URL
   */
  _getBaseUrl() {
    if (this.config.apiType === 'openai') {
      return 'https://api.openai.com/v1';
    }
    return 'https://api.anthropic.com/v1';
  }

  /**
   * 发送消息
   */
  async send(messages, tools = [], options = {}) {
    const {
      model = this.config.model,
      maxTokens = this.config.maxTokens,
      temperature = this.config.temperature
    } = options;

    if (this.config.apiType === 'openai') {
      return this._sendOpenAI(messages, tools, { model, maxTokens, temperature });
    }
    return this._sendAnthropic(messages, tools, { model, maxTokens, temperature });
  }

  /**
   * 发送 Anthropic API
   */
  async _sendAnthropic(messages, tools, options) {
    const url = `${this.baseUrl}/messages`;

    const body = {
      model: options.model,
      max_tokens: options.maxTokens,
      messages,
      tools: tools.length > 0 ? this._formatToolsAnthropic(tools) : undefined
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `API error: ${response.status} - ${error}` };
      }

      const data = await response.json();
      return {
        success: true,
        content: data.content,
        model: data.model,
        usage: data.usage
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送 OpenAI API
   */
  async _sendOpenAI(messages, tools, options) {
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model: options.model,
      max_tokens: options.maxTokens,
      messages,
      tools: tools.length > 0 ? this._formatToolsOpenAI(tools) : undefined
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `API error: ${response.status} - ${error}` };
      }

      const data = await response.json();
      return {
        success: true,
        content: data.choices[0].message,
        model: data.model,
        usage: data.usage
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 格式化 Anthropic 工具
   */
  _formatToolsAnthropic(tools) {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema
    }));
  }

  /**
   * 格式化 OpenAI 工具
   */
  _formatToolsOpenAI(tools) {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema
      }
    }));
  }

  /**
   * 创建流式响应
   */
  async sendStream(messages, tools, options = {}, onChunk) {
    if (this.config.apiType === 'openai') {
      return this._sendOpenAIStream(messages, tools, options, onChunk);
    }
    return this._sendAnthropicStream(messages, tools, options, onChunk);
  }

  /**
   * Anthropic 流式响应
   */
  async _sendAnthropicStream(messages, tools, options, onChunk) {
    const url = `${this.baseUrl}/messages`;

    const body = {
      model: options.model || this.config.model,
      max_tokens: options.maxTokens || this.config.maxTokens,
      messages,
      tools: tools.length > 0 ? this._formatToolsAnthropic(tools) : undefined,
      stream: true
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        return { success: false, error: `API error: ${response.status}` };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              onChunk(parsed);
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * OpenAI 流式响应
   */
  async _sendOpenAIStream(messages, tools, options, onChunk) {
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model: options.model || this.config.model,
      max_tokens: options.maxTokens || this.config.maxTokens,
      messages,
      tools: tools.length > 0 ? this._formatToolsOpenAI(tools) : undefined,
      stream: true
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        return { success: false, error: `API error: ${response.status}` };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              onChunk(parsed);
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      if (this.config.apiType === 'openai') {
        const response = await fetch(`${this.baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
        });
        return { success: response.ok, status: response.status };
      }

      // Anthropic 没有简单的 health endpoint
      return { success: true, status: 200 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = { ApiClient };
