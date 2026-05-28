/**
 * 上下文管理器 (Context Manager) v1.0.0
 *
 * 上下文窗口管理、压缩、优先级排序
 */

class ContextManager {
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 200000; // Claude默认200K
    this.maxMessages = options.maxMessages || 1000;
    this.compressionThreshold = options.compressionThreshold || 0.8; // 80% 时压缩
    this.minMessagesToKeep = options.minMessagesToKeep || 10;

    // Token 估算（简单实现）
    this.tokenEstimate = options.tokenEstimate || this._defaultTokenEstimate;

    // 消息历史
    this.messages = [];
    this.systemPrompt = null;
    this.compressionCount = 0;
  }

  /**
   * 添加消息
   */
  addMessage(role, content, metadata = {}) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role,
      content,
      metadata,
      timestamp: Date.now(),
      tokens: this.tokenEstimate(role, content)
    };

    this.messages.push(message);

    // 检查是否需要压缩
    if (this._getTokenRatio() > this.compressionThreshold) {
      this._compress();
    }

    return message;
  }

  /**
   * 添加系统提示
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = {
      role: 'system',
      content: prompt,
      tokens: this.tokenEstimate('system', prompt)
    };
  }

  /**
   * 获取上下文（带token限制）
   */
  getContext(maxTokens = null) {
    const limit = maxTokens || this.maxTokens;
    const context = [];
    let totalTokens = 0;

    // 添加系统提示
    if (this.systemPrompt) {
      totalTokens += this.systemPrompt.tokens;
      context.push({
        role: 'system',
        content: this.systemPrompt.content
      });
    }

    // 从新到旧添加消息
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      const msgTokens = msg.tokens;

      if (totalTokens + msgTokens > limit) {
        // 检查是否可以保留部分消息
        if (context.length > this.minMessagesToKeep) {
          break;
        }
      }

      context.unshift({
        role: msg.role,
        content: msg.content
      });
      totalTokens += msgTokens;
    }

    return {
      messages: context,
      totalTokens,
      messageCount: context.length,
      truncated: this._getTotalTokens() > limit
    };
  }

  /**
   * 压缩上下文
   */
  _compress() {
    this.compressionCount++;

    // 策略：保留重要消息，压缩或删除次要消息
    const importantMessages = this._rankMessages();

    // 保留最重要的消息
    const keepCount = Math.floor(this.messages.length * 0.5);
    const keptMessages = importantMessages.slice(0, keepCount);

    // 压缩保留的消息
    this.messages = keptMessages.map(msg => ({
      ...msg,
      content: this._summarizeMessage(msg),
      compressed: true
    }));

    console.log(`[ContextManager] 压缩完成，保留 ${this.messages.length}/${keptMessages.length} 条消息`);
  }

  /**
   * 消息重要性排序
   */
  _rankMessages() {
    return this.messages
      .map((msg, index) => ({
        ...msg,
        importance: this._calculateImportance(msg, index)
      }))
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * 计算消息重要性
   */
  _calculateImportance(message, index) {
    let score = 0;

    // 工具调用消息（高重要性）
    if (message.metadata?.toolUse) {
      score += 50;
    }

    // 用户确认或重要反馈
    if (message.role === 'user') {
      const content = message.content.toLowerCase();
      if (/确认|是的|对|正确|同意/g.test(content)) {
        score += 30;
      }
      if (/错误|不对|不是|取消/g.test(content)) {
        score += 40;
      }
    }

    // 有结果的消息
    if (message.metadata?.hasResult) {
      score += 20;
    }

    // 较新的消息更重要
    score += Math.max(0, 20 - (this.messages.length - index) * 0.5);

    // 系统消息高优先级
    if (message.role === 'system') {
      score += 100;
    }

    return score;
  }

  /**
   * 总结消息
   */
  _summarizeMessage(message) {
    const content = message.content;

    // 如果消息很短，直接返回
    if (content.length < 200) {
      return content;
    }

    // 简单总结：保留首尾
    const sentences = content.split(/[.!?]+/);
    if (sentences.length <= 3) {
      return content;
    }

    return sentences[0] + '. ' + sentences[sentences.length - 1] + '.';
  }

  /**
   * 默认token估算
   */
  _defaultTokenEstimate(role, content) {
    // 简单估算：中文约2字符=1 token，英文约4字符=1 token
    const chineseChars = (content.match(/[一-鿿]/g) || []).length;
    const otherChars = content.length - chineseChars;
    return Math.ceil(chineseChars / 2 + otherChars / 4) + 10; // +role overhead
  }

  /**
   * 获取token比例
   */
  _getTokenRatio() {
    return this._getTotalTokens() / this.maxTokens;
  }

  /**
   * 获取总token数
   */
  _getTotalTokens() {
    let total = this.systemPrompt?.tokens || 0;
    for (const msg of this.messages) {
      total += msg.tokens;
    }
    return total;
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      totalTokens: this._getTotalTokens(),
      maxTokens: this.maxTokens,
      usagePercent: (this._getTokenRatio() * 100).toFixed(1) + '%',
      messageCount: this.messages.length,
      systemPromptTokens: this.systemPrompt?.tokens || 0,
      compressionCount: this.compressionCount,
      truncated: this._getTotalTokens() > this.maxTokens
    };
  }

  /**
   * 清空历史
   */
  clearHistory(keepSystem = true) {
    const count = this.messages.length;
    this.messages = [];

    if (!keepSystem) {
      this.systemPrompt = null;
    }

    return { cleared: count };
  }

  /**
   * 搜索历史
   */
  search(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const msg of this.messages) {
      if (msg.content.toLowerCase().includes(lowerQuery)) {
        results.push({
          message: msg,
          match: this._highlightMatch(msg.content, query)
        });
      }
    }

    return results;
  }

  /**
   * 高亮匹配
   */
  _highlightMatch(content, query) {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return null;

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);

    return '...' + content.slice(start, end) + '...';
  }
}

/**
 * 对话管理器
 */
class ConversationManager {
  constructor(options = {}) {
    this.maxConversations = options.maxConversations || 50;
    this.conversations = new Map();
    this.currentId = null;
  }

  /**
   * 创建新对话
   */
  createConversation(metadata = {}) {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const conversation = {
      id,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata,
      context: new ContextManager()
    };

    this.conversations.set(id, conversation);
    this.currentId = id;

    // 清理旧对话
    if (this.conversations.size > this.maxConversations) {
      this._cleanup();
    }

    return conversation;
  }

  /**
   * 获取当前对话
   */
  getCurrentConversation() {
    if (!this.currentId) {
      return this.createConversation();
    }
    return this.conversations.get(this.currentId);
  }

  /**
   * 切换对话
   */
  switchConversation(id) {
    if (!this.conversations.has(id)) {
      return null;
    }
    this.currentId = id;
    return this.conversations.get(id);
  }

  /**
   * 删除对话
   */
  deleteConversation(id) {
    const deleted = this.conversations.delete(id);
    if (this.currentId === id) {
      this.currentId = this.conversations.keys().next().value || null;
    }
    return deleted;
  }

  /**
   * 列出所有对话
   */
  listConversations(limit = 20) {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map(c => ({
        id: c.id,
        messageCount: c.messages.length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        metadata: c.metadata
      }));
  }

  /**
   * 清理旧对话
   */
  _cleanup() {
    const sorted = Array.from(this.conversations.entries())
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt);

    const toDelete = sorted.slice(this.maxConversations);
    for (const [id] of toDelete) {
      this.conversations.delete(id);
    }
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      total: this.conversations.size,
      max: this.maxConversations,
      current: this.currentId
    };
  }
}

module.exports = { ContextManager, ConversationManager };
