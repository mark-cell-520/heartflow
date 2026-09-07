/**
 * src/knowledge/classics-value-mapper.js
 *
 * 思想心虫古典知识接入 v2：
 * 1. 复用 classics-rules.js 的检索/判别/解析能力，不做第二套实现
 * 2. 扩展域覆盖到 daizhigev20 全部可读子目录
 * 3. 提供 evaluateWithClassics(input) 供 pipeline/thought-chain 统一调用
 */

const { evaluateRules, searchClassicsBatch, parseHit, CLASSICAL_RULES, DOMAIN_RULES } = require('./classics-rules');

module.exports = {
  evaluateRules,
  searchClassicsBatch,
  parseHit,
  matchDomain: (input) => {
    const q = input.toLowerCase();
    let best = null;
    let bestScore = 0;
    for (const rule of DOMAIN_RULES) {
      const score = rule.keywords.reduce((acc, kw) => acc + (q.includes(kw) ? 1 : 0), 0);
      if (score > bestScore) { bestScore = score; best = rule; }
    }
    return bestScore > 0 ? best : null;
  },
  searchClassics: (keyword, scope) => searchClassicsBatch([keyword], scope),
  mapToDimensions: (rule) => rule ? rule.dimensions : [],
  CLASSICAL_RULES,
  DOMAIN_RULES,
  evaluate: evaluateRules,
  evaluateWithClassics: evaluateRules,
};
