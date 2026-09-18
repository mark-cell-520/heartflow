/**
 * decision-domain-classifier.js — 决策领域分类器 v1.0.0
 *
 * 基于 Hierarchical Sparse Indexer 设计：先粗粒度分类，再精细节点。
 * 输入结果经 3 级过滤：Level1 领域分类 -> Level2 关键词匹配 -> Level3 回退全量。
 */

const FIELD = {
  // 四大领域
  emotion: 'emotion',
  cognition: 'cognition',
  behavior: 'behavior',
  safety: 'safety',
};

// Level 1: 输入指纹 -> 领域候选（启发式 + 模型路由）
const DOMAIN_HINTS = {
  [FIELD.emotion]: [
    'empath', 'trauma', 'mood', 'feel', 'emotion', '情感', '情绪',
    'valence', 'depress', 'anxiety', ' Attachment', 'empathy',
  ],
  [FIELD.cognition]: [
    'cognit', 'load', 'uncertain', 'belief', 'fact', 'knowledge',
    'reason', 'hallucin', '认知', '推理', '证据', '幻觉', 'belief',
  ],
  [FIELD.behavior]: [
    'behavior', 'habit', 'goal', 'progress', 'action', 'execute',
    '行为', '习惯', '目标', '执行', 'progress', 'decision',
  ],
  [FIELD.safety]: [
    'unsafe', 'danger', 'harm', 'risk', 'harmful', 'toxic',
    '危险', '伤害', '风险', '毒性', 'self-harm', 'child-safety',
  ],
};

// Level 2: 结果字段 -> 领域相关性（用于更精确的分类）
const FIELD_DOMAIN_MAP = {
  cognitiveLoad: FIELD.cognition,
  dissonance: FIELD.cognition,
  quality: FIELD.cognition,
  valence: FIELD.emotion,
  empathy: FIELD.emotion,
  progress: FIELD.behavior,
  goal: FIELD.behavior,
  severity: FIELD.safety,
  toxicity: FIELD.safety,
  harm: FIELD.safety,
  confidence: FIELD.cognition,
  uncertainty: FIELD.cognition,
};

class DecisionDomainClassifier {
  constructor() {
    this.VERSION = '1.0.0';
    this._domainStats = {};
  }

  // Level 1: 基于输入文本指纹 -> 领域候选（多标签）
  classifyByInput(input) {
    if (!input || typeof input !== 'string') {
      return { primary: null, candidates: Object.values(FIELD) };
    }
    const text = input.toLowerCase();
    const scored = {};
    for (const [domain, keywords] of Object.entries(DOMAIN_HINTS)) {
      let count = 0;
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) count++;
      }
      if (count > 0) scored[domain] = count;
    }
    const sorted = Object.entries(scored).sort((a, b) => b[1] - a[1]);
    const candidates = sorted.map(([d]) => d);
    const primary = candidates[0] || null;
    return { primary, candidates, scored };
  }

  // Level 2: 基于结果字段推断领域（单标签，置信度 0-1）
  classifyByResult(result) {
    if (!result || typeof result !== 'object') {
      return { domain: null, confidence: 0 };
    }
    const scores = {};
    const fields = Object.keys(result);
    let matchedFields = 0;

    for (const field of fields) {
      const mappedDomain = FIELD_DOMAIN_MAP[field];
      if (mappedDomain) {
        scores[mappedDomain] = (scores[mappedDomain] || 0) + 1;
        matchedFields++;
      }
    }

    if (matchedFields === 0) {
      return { domain: null, confidence: 0 };
    }

    // 取最高分领域
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topDomain = sorted[0][0];
    const confidence = Math.min(1, sorted[0][1] / (matchedFields * 0.5));

    return { domain: topDomain, confidence, scores };
  }

  // Level 3: 综合分类（输入 + 结果 + 历史成功率）
  classify(input, result = null) {
    const byInput = this.classifyByInput(input);
    const byResult = result ? this.classifyByResult(result) : { domain: null, confidence: 0 };

    // 综合：如果结果分类置信度高，优先；否则用输入分类
    let primary, confidence;
    if (byResult.confidence > 0.5) {
      primary = byResult.domain;
      confidence = byResult.confidence;
    } else if (byInput.primary) {
      primary = byInput.primary;
      confidence = Math.min(0.7, byInput.scored[primary] * 0.15);
    } else {
      primary = null;
      confidence = 0;
    }

    // 统计
    if (primary) {
      this._domainStats[primary] = (this._domainStats[primary] || 0) + 1;
    }

    return {
      primary,
      candidates: byInput.candidates,
      confidence,
      source: byResult.confidence > 0.5 ? 'result' : byInput.primary ? 'input' : 'fallback',
    };
  }
}

module.exports = { DecisionDomainClassifier, FIELD };
