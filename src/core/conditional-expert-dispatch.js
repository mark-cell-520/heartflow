/**
 * conditional-expert-dispatch.js — 条件专家路由 v1.0.0
 *
 * 对标 DeepSeek V4.1 CED（Conditional Expert Dispatch）：
 *   不是所有输入都值得激活全部专家/规则。
 *   简单输入 -> 只激活高优先级专家子集
 *   复杂输入 -> 展开全量专家网络
 *
 * 心虫映射：
 *   - 专家 = 决策规则
 *   - 输入复杂度 = 输入长度 + 领域不确定性 + 历史波动
 *   - 条件路由 = 按复杂度动态选择规则子集
 *
 * 设计约束：
 *   - 绝不阻塞主链路
 *   - 与现有 Hierarchical Sparse Indexer 协同工作
 *   - 复杂度评估本身必须轻量（O(1)）
 */

const FIELD = {
  emotion: 'emotion',
  cognition: 'cognition',
  behavior: 'behavior',
  safety: 'safety',
};

// 领域基础复杂度权重（不同领域需要不同深度）
const DOMAIN_COMPLEXITY_WEIGHT = {
  [FIELD.safety]: 1.0,      // 安全领域必须全量检查
  [FIELD.cognition]: 0.8,   // 认知领域较复杂
  [FIELD.emotion]: 0.6,     // 情感领域中等
  [FIELD.behavior]: 0.5,    // 行为领域相对直接
};

class ConditionalExpertDispatch {
  constructor(decisionRouter) {
    this.router = decisionRouter;
    this.VERSION = '1.0.0';
    this._stats = {
      totalDispatched: 0,
      simpleInputs: 0,
      complexInputs: 0,
      rulesSkipped: 0,
    };
  }

  /**
   * 评估输入复杂度（0-1）
   * 考虑：输入长度、领域不确定性、历史决策波动
   * @param {string} input - 用户输入
   * @param {object} domainCtx - 领域分类结果
   * @returns {number} 复杂度 0-1
   */
  assessComplexity(input, domainCtx = {}) {
    if (typeof input !== 'string') return 0.5;

    // 1. 长度因子（0-0.3）：短输入简单，长输入复杂
    const len = input.length;
    const lenFactor = Math.min(0.3, len / 500);

    // 2. 领域不确定性因子（0-0.3）：低置信度分类意味着需要更多规则
    const domainConfidence = domainCtx.confidence || 0;
    const uncertaintyFactor = Math.max(0, (1 - domainConfidence) * 0.3);

    // 3. 领域基础复杂度（0-0.4）：安全领域必须谨慎
    const primaryDomain = domainCtx.primary || null;
    const domainWeight = primaryDomain ? (DOMAIN_COMPLEXITY_WEIGHT[primaryDomain] || 0.5) : 0.5;
    const domainFactor = domainWeight * 0.4;

    // 4. 文本密度因子（0-0.1）：标点/数字/专业术语增加复杂度
    const densityFactor = this._assessTextDensity(input) * 0.1;

    const total = lenFactor + uncertaintyFactor + domainFactor + densityFactor;
    return Math.max(0, Math.min(1, total));
  }

  /**
   * 评估文本密度（专业术语、数字、标点集中度）
   */
  _assessTextDensity(text) {
    if (!text || text.length === 0) return 0;
    const specialChars = (text.match(/[0-9{}()\[\]<>\/\\|:;,.]/g) || []).length;
    const ratio = specialChars / text.length;
    return Math.min(1, ratio * 10);
  }

  /**
   * 根据复杂度决定规则激活策略
   * @param {number} complexity - 复杂度 0-1
   * @returns {object} 路由策略
   */
  decideStrategy(complexity) {
    if (complexity < 0.3) {
      return {
        mode: 'simple',
        activateRatio: 0.3,  // 只激活 30% 高优先级规则
        description: 'simple_input_minimal_rules',
      };
    } else if (complexity < 0.6) {
      return {
        mode: 'moderate',
        activateRatio: 0.6,  // 激活 60% 规则
        description: 'moderate_input_standard_rules',
      };
    } else {
      return {
        mode: 'complex',
        activateRatio: 1.0,  // 全量激活
        description: 'complex_input_full_rules',
      };
    }
  }

  /**
   * 从全量规则中筛选出应激活的规则子集
   * @param {Array} allRules - 全量规则列表
   * @param {object} strategy - 路由策略
   * @returns {Array} 激活的规则子集
   */
  filterRules(allRules, strategy) {
    if (!allRules || allRules.length === 0) return [];
    if (strategy.activateRatio >= 1.0) return allRules;

    // 按优先级排序，取前 N%
    const sorted = [...allRules].sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });

    const count = Math.max(1, Math.floor(allRules.length * strategy.activateRatio));
    const selected = sorted.slice(0, count);

    this._stats.rulesSkipped += allRules.length - selected.length;

    return selected;
  }

  /**
   * 记录路由决策统计
   */
  recordDispatch(complexity, strategy, rulesTotal, rulesActivated) {
    this._stats.totalDispatched++;
    if (strategy.mode === 'simple') this._stats.simpleInputs++;
    else if (strategy.mode === 'complex') this._stats.complexInputs++;
  }

  /**
   * 获取统计摘要
   */
  getStats() {
    return {
      ...this._stats,
      avgComplexity: this._stats.totalDispatched > 0
        ? (this._stats.simpleInputs * 0.2 + this._stats.complexInputs * 0.8) / this._stats.totalDispatched
        : 0,
    };
  }
}

module.exports = { ConditionalExpertDispatch, FIELD };
