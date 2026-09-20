'use strict';
/**
 * mcp/handlers/crowdtest-evaluate.js — 心虫众测题判分 MCP 处理器
 * 只做参数适配与错误兜底；判分逻辑全在 src/crowdtest/evaluate-answer.js。
 */

const evaluator = require('../../crowdtest/evaluate-answer.js');

module.exports = function handleCrowdtestEvaluate(args) {
  args = args || {};
  const answer = args.answer || '';
  if (!answer.trim()) {
    return { 判定: 'FAIL', 硬失败项: ['未提供答案文本'], 需人工陪审: '请提供被测模型答案全文' };
  }

  try {
    return evaluator.evaluate(answer, {
      materials: Array.isArray(args.materials) ? args.materials : [],
      materialIds: Array.isArray(args.materialIds) ? args.materialIds : null,
      requiredDeliverables: Array.isArray(args.requiredDeliverables) ? args.requiredDeliverables : [],
      requiredCounts: (args.requiredCounts && typeof args.requiredCounts === 'object') ? args.requiredCounts : null,
      minCitations: typeof args.minCitations === 'number' ? args.minCitations : 3,
      runGate: args.runGate !== false,
    });
  } catch (e) {
    return {
      判定: 'FAIL',
      硬失败项: ['判分器异常: ' + e.message],
      需人工陪审: '判分器自身故障，检查 src/crowdtest/（不视为被测模型不合格）'
    };
  }
};
