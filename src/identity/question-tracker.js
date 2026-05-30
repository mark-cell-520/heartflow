/**
 * QuestionTracker — 问题追踪器
 * 
 * 解决上下文污染问题：
 * - 用户说"继续"、"修正"、"继续回答第一个问题"时，
 *   AI能通过追踪器找到原始问题，而不是在当前消息的上下文里雾化
 * 
 * 使用方式（Hermes agent层）：
 *   hf.questions.setSessionId(sessionId)
 *   hf.questions.record({ text: '道可道非常道什么意思', category: 'information_seeking' })
 *   const meta = hf.questions.detectMetaInstruction('继续回答第一个问题')
 *   if (meta.isMeta) {
 *     const question = hf.questions.resolve(meta)
 *     // question.text 就是原始问题内容
 *   }
 */

class QuestionTracker {
  constructor() {
    // sessionId → { questions: [], currentIndex: number }
    this._sessions = new Map();
    this._currentSessionId = null;
    this._questionId = 0;
  }

  /**
   * 设置当前会话ID
   * @param {string} sessionId - Hermes会话ID
   */
  setSessionId(sessionId) {
    if (!this._sessions.has(sessionId)) {
      this._sessions.set(sessionId, { questions: [], currentIndex: -1 });
    }
    this._currentSessionId = sessionId;
  }

  /**
   * 获取当前会话数据
   */
  _getSession() {
    if (!this._currentSessionId) return null;
    return this._sessions.get(this._currentSessionId) || null;
  }

  /**
   * 记录一个问题
   * @param {object} question - { text: string, category: string }
   */
  record(question) {
    const session = this._getSession();
    if (!session) return null;

    const q = {
      id: ++this._questionId,
      text: question.text || String(question),
      category: question.category || 'unknown',
      timestamp: Date.now(),
      messageCount: 0
    };

    // 如果currentIndex指向最后一个问题，说明用户"继续"了上一个问题
    // 新问题入栈时，重置currentIndex
    session.questions.push(q);
    session.currentIndex = session.questions.length - 1;
    return q;
  }

  /**
   * 增加消息计数（追踪当前问题被讨论了多少轮）
   */
  incrementMessageCount() {
    const session = this._getSession();
    if (!session || session.currentIndex < 0) return;
    const q = session.questions[session.currentIndex];
    if (q) q.messageCount++;
  }

  /**
   * 检测输入是否包含元指令
   * @param {string} input - 用户输入
   * @returns {object} { isMeta: boolean, type: string, specifier: string|null }
   *   type: 'continue' | 'continue_first' | 'continue_last' | 'correction' | 'unknown'
   */
  detectMetaInstruction(input) {
    const lower = input.toLowerCase().trim();

    // "继续"单独出现 → 继续当前问题
    if (/^继续$/.test(lower) || /^继续[\s。.]*$/.test(lower)) {
      return { isMeta: true, type: 'continue', specifier: null };
    }

    // "继续回答" / "继续思考" / "继续" + 名词
    const continuePatterns = [
      /^继续回答(第一|first|上个|last|上一个)?[个条]?(问题|问)?/,
      /^继续思考/,
      /^继续说/,
      /^继续(讨论|对话)?$/,
    ];
    for (const p of continuePatterns) {
      if (p.test(lower)) {
        // 提取具体指定
        if (/第一|first/.test(lower)) {
          return { isMeta: true, type: 'continue_first', specifier: 'first' };
        }
        if (/上个|上一个|last/.test(lower)) {
          return { isMeta: true, type: 'continue_last', specifier: 'last' };
        }
        return { isMeta: true, type: 'continue', specifier: null };
      }
    }

    // "修正" / "修改" / "纠正" — 修正上一个回答
    if (/^修正|^修改|^纠正/.test(lower)) {
      return { isMeta: true, type: 'correction', specifier: null };
    }

    // "第一个问题" / "最初的问题" — 指第一个问题
    if (/第[一二三1-3]?[个条]?(问题|问)|最初的问题|一开始的问题/.test(input)) {
      return { isMeta: true, type: 'continue_first', specifier: 'first' };
    }

    // "上一个问题" / "之前的问题" / "上个问题"
    if (/^上(一个|个个|个)?(问题|问)|^之前(的)?(问题|问)/.test(input)) {
      return { isMeta: true, type: 'continue_last', specifier: 'last' };
    }

    return { isMeta: false, type: 'unknown', specifier: null };
  }

  /**
   * 解析元指令，返回原始问题
   * @param {object} metaResult - detectMetaInstruction的返回值
   * @returns {object|null} - { resolved: boolean, question: object|null, reason: string }
   */
  resolve(metaResult) {
    if (!metaResult.isMeta) {
      return { resolved: false, question: null, reason: 'not_meta' };
    }

    const session = this._getSession();
    if (!session || session.questions.length === 0) {
      return { resolved: false, question: null, reason: 'no_questions' };
    }

    switch (metaResult.type) {
      case 'continue':
      case 'continue_first': {
        // "继续第一个问题" → 找第一个information_seeking问题
        if (metaResult.type === 'continue_first') {
          const first = session.questions.find(q =>
            q.category === 'information_seeking'
          );
          if (first) return { resolved: true, question: first, reason: 'found_first' };
        }
        // 默认：继续当前活动的问题（currentIndex）
        const current = session.questions[session.currentIndex];
        if (current) return { resolved: true, question: current, reason: 'found_current' };
        return { resolved: false, question: null, reason: 'no_current' };
      }

      case 'continue_last': {
        // "继续上一个问题" → currentIndex - 1
        if (session.currentIndex > 0) {
          const prev = session.questions[session.currentIndex - 1];
          return { resolved: true, question: prev, reason: 'found_previous' };
        }
        return { resolved: false, question: null, reason: 'no_previous' };
      }

      case 'correction': {
        // "修正" → 修正当前问题的上一个回答
        if (session.currentIndex >= 0) {
          return { resolved: true, question: session.questions[session.currentIndex], reason: 'found_for_correction' };
        }
        return { resolved: false, question: null, reason: 'no_current' };
      }

      default:
        return { resolved: false, question: null, reason: 'unknown_type' };
    }
  }

  /**
   * 获取当前活动问题
   */
  getCurrent() {
    const session = this._getSession();
    if (!session || session.currentIndex < 0) return null;
    return session.questions[session.currentIndex] || null;
  }

  /**
   * 获取问题列表（调试用）
   */
  getQuestions() {
    const session = this._getSession();
    if (!session) return [];
    return session.questions.map((q, i) => ({
      ...q,
      isActive: i === session.currentIndex
    }));
  }

  /**
   * 重置当前会话（不删除，只清空问题栈）
   * 用于会话切换时清理
   */
  reset() {
    if (this._currentSessionId) {
      this._sessions.set(this._currentSessionId, { questions: [], currentIndex: -1 });
    }
  }

  /**
   * 获取统计信息
   */
  stats() {
    const session = this._getSession();
    return {
      totalSessionsTracked: this._sessions.size,
      currentSessionQuestions: session ? session.questions.length : 0,
      currentIndex: session ? session.currentIndex : -1,
      currentSessionId: this._currentSessionId
    };
  }
}

// Singleton export
const questionTracker = new QuestionTracker();

module.exports = { QuestionTracker, questionTracker };
