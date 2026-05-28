/**
 * 模态融合 (Modal Fusion) v1.0.0
 *
 * 文本与图像的多模态融合理解
 */

const { ImageAnalyzer } = require('./image-analyzer.js');

class ModalFusion {
  constructor(options = {}) {
    this.imageAnalyzer = new ImageAnalyzer(options);
    this.fusionHistory = [];
    this.maxHistory = options.maxHistory || 100;
  }

  /**
   * 融合文本和图像理解
   */
  async fuse(text, imageData, options = {}) {
    const {
      context = '',
      intent = null,
      includeImageAnalysis = true
    } = options;

    const result = {
      success: true,
      timestamp: Date.now(),
      textAnalysis: null,
      imageAnalysis: null,
      fusedUnderstanding: null,
      context
    };

    // 文本分析
    result.textAnalysis = this._analyzeText(text, context);

    // 图像分析
    if (includeImageAnalysis && imageData) {
      result.imageAnalysis = await this.imageAnalyzer.analyze(imageData);
    }

    // 融合理解
    result.fusedUnderstanding = this._fuseUnderstanding(
      result.textAnalysis,
      result.imageAnalysis,
      intent
    );

    // 记录历史
    this.fusionHistory.push({
      text: text.slice(0, 100),
      hasImage: !!imageData,
      intent,
      timestamp: Date.now()
    });

    // 清理历史
    if (this.fusionHistory.length > this.maxHistory) {
      this.fusionHistory = this.fusionHistory.slice(-this.maxHistory);
    }

    return result;
  }

  /**
   * 分析文本
   */
  _analyzeText(text, context = '') {
    return {
      content: text,
      context,
      keywords: this._extractKeywords(text),
      sentiment: this._analyzeSentiment(text),
      entities: this._extractEntities(text),
      intent: this._inferIntent(text)
    };
  }

  /**
   * 提取关键词
   */
  _extractKeywords(text) {
    // 简单实现：提取高频词
    const stopWords = new Set(['的', '了', '是', '在', '和', '与', '或', '的', '我', '你', '他', '她', '它', '这', '那']);
    const words = text.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
    const freq = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * 分析情感
   */
  _analyzeSentiment(text) {
    const positiveWords = ['好', '棒', '优秀', '喜欢', '满意', '开心', '高兴', '赞'];
    const negativeWords = ['差', '糟糕', '不喜欢', '失望', '难过', '生气', '烂'];

    let score = 0;
    for (const word of positiveWords) {
      if (text.includes(word)) score += 0.2;
    }
    for (const word of negativeWords) {
      if (text.includes(word)) score -= 0.2;
    }

    return {
      score: Math.max(-1, Math.min(1, score)),
      label: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
    };
  }

  /**
   * 提取实体
   */
  _extractEntities(text) {
    // 简单实现：提取引号内的内容
    const quoted = text.match(/["'""]([^""']+)[""']/g);
    return (quoted || []).map(q => q.replace(/[""']/g, ''));
  }

  /**
   * 推断意图
   */
  _inferIntent(text) {
    const intents = [
      { id: 'question', patterns: ['?', '？', '什么', '怎么', '为什么', '如何'] },
      { id: 'request', patterns: ['请', '帮我', '给我', '想要'] },
      { id: 'statement', patterns: [] },
      { id: 'emotion', patterns: ['！', '!', '好开心', '好难过', '太棒了'] }
    ];

    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        if (text.includes(pattern)) {
          return intent.id;
        }
      }
    }
    return 'statement';
  }

  /**
   * 融合理解
   */
  _fuseUnderstanding(textAnalysis, imageAnalysis, explicitIntent = null) {
    const understanding = {
      intent: explicitIntent || textAnalysis.intent,
      summary: '',
      keyPoints: [],
      emotionalTone: textAnalysis.sentiment.label,
      confidence: 0,
      relevance: 0
    };

    // 生成摘要
    const parts = [];
    if (textAnalysis.keywords.length > 0) {
      const topKeywords = textAnalysis.keywords.slice(0, 3).map(k => k.word).join('、');
      parts.push(`主要涉及${topKeywords}`);
    }

    if (imageAnalysis?.scene) {
      parts.push(`场景为${imageAnalysis.scene.name}`);
    }

    if (imageAnalysis?.objects?.length > 0) {
      const objects = imageAnalysis.objects.map(o => o.name).join('、');
      parts.push(`包含${objects}`);
    }

    understanding.summary = parts.join('，') + '。';

    // 关键点
    understanding.keyPoints = [
      textAnalysis.content.slice(0, 200),
      ...(imageAnalysis?.scene ? [`场景: ${imageAnalysis.scene.name}`] : [])
    ];

    // 计算置信度
    let confidence = 0.4;
    if (textAnalysis.keywords.length > 0) confidence += 0.2;
    if (imageAnalysis) confidence += 0.2;
    if (explicitIntent) confidence += 0.2;
    understanding.confidence = Math.min(1, confidence);

    // 计算相关性
    understanding.relevance = textAnalysis.intent !== 'statement' ? 0.8 : 0.5;

    return understanding;
  }

  /**
   * 生成回复建议
   */
  generateResponse(fusedUnderstanding) {
    const { intent, summary, emotionalTone } = fusedUnderstanding;

    if (intent === 'question') {
      return {
        type: 'informative',
        tone: 'helpful',
        approach: '直接回答问题并提供解释'
      };
    }

    if (intent === 'request') {
      return {
        type: 'actionable',
        tone: 'helpful',
        approach: '确认需求并执行'
      };
    }

    if (emotionalTone === 'negative') {
      return {
        type: 'empathetic',
        tone: 'supportive',
        approach: '先表达理解，再提供帮助'
      };
    }

    return {
      type: 'informative',
      tone: 'balanced',
      approach: '提供有用信息'
    };
  }

  /**
   * 获取融合历史
   */
  getHistory(limit = 20) {
    return this.fusionHistory.slice(-limit);
  }

  /**
   * 获取统计
   */
  getStats() {
    const total = this.fusionHistory.length;
    const withImage = this.fusionHistory.filter(h => h.hasImage).length;

    return {
      totalFusions: total,
      withImage,
      withoutImage: total - withImage,
      imageRatio: total > 0 ? withImage / total : 0
    };
  }
}

module.exports = { ModalFusion };
