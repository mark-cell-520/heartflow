/**
 * post-training-engine.js — 异步后训练引擎 v1.0.0
 *
 * 对标 DeepSeek V4.1 异步后训练：主判别链路不等待后训练，
 * 而是在 think() 返回后异步反思本次决策质量并微调内部状态。
 *
 * 核心职责：
 *   1. 决策质量 retrospective 评估
 *   2. 规则权重微调（小步长）
 *   3. 历史模式学习（近期决策序列的共性提取）
 *
 * 设计约束：
 *   - 绝不阻塞 think() 主路径
 *   - 仅在 _autoDecisionsEnabled && effort >= 50 时触发
 *   - 每次最多调整 3 条规则，避免震荡
 */

const { DecisionRouter } = require('./decision-router.js');

const MAX_RULES_PER_BATCH = 3;
const MIN_CONFIDENCE_FOR_ADJUST = 0.4;
const WEIGHT_DELTA_CAP = 0.05;

class PostTrainingEngine {
  constructor(heartFlow) {
    this.hf = heartFlow;
    this.router = heartFlow._decisionRouter || heartFlow.decisionRouter || null;
    this.VERSION = '1.0.0';
    this._queue = [];
    this._processing = false;
    this._stats = {
      totalScheduled: 0,
      totalProcessed: 0,
      totalAdjusted: 0,
      lastProcessedAt: null,
    };
  }

  /**
   * 调度一次后训练任务（非阻塞，立即返回）
   * @param {object} result - think() 返回结果
   */
  schedule(result) {
    if (!result || !result._decision) return;
    if (!this._shouldRun(result)) return;

    this._queue.push({
      decision: result._decision,
      confidence: result._decisionConfidence || 0,
      rationale: result._decisionRationale || '',
      applied: result._decisionApplied,
      gate: result.gate,
      effort: result._reasoningEffort || 0,
      ts: Date.now(),
    });
    this._stats.totalScheduled++;

    if (!this._processing) {
      this._processing = true;
      setImmediate(() => this._drain());
    }
  }

  _shouldRun(result) {
    if (!this.hf || !this.hf._autoDecisionsEnabled) return false;
    const effort = result._reasoningEffort || 0;
    if (effort < 50) return false; // 低 effort 不触发后训练
    if (this._queue.length > 20) return false; // 背压保护
    return true;
  }

  /**
   * 消费队列中的后训练任务（异步，不阻塞主链路）
   */
  _drain() {
    if (this._queue.length === 0) {
      this._processing = false;
      return;
    }

    const batch = this._queue.splice(0, MAX_RULES_PER_BATCH);
    try {
      this._processBatch(batch);
    } catch (_) {
      // 后训练失败不影响主链路
    }

    this._stats.totalProcessed += batch.length;
    this._stats.lastProcessedAt = Date.now();

    // 如果队列还有剩余，继续异步处理
    if (this._queue.length > 0) {
      setImmediate(() => this._drain());
    } else {
      this._processing = false;
    }
  }

  /**
   * 处理一批后训练任务
   */
  _processBatch(batch) {
    if (!this.router || typeof this.router.getRuleStats !== 'function') return;

    // 1. 计算批次级别的决策质量 retrospective
    const qualities = batch.map(item => this._assessQuality(item));
    const avgQuality = qualities.reduce((s, q) => s + q, 0) / qualities.length;

    // 2. 提取共性模式（如连续同类决策、低置信度重复触发等）
    const patterns = this._extractPatterns(batch);

    // 3. 微调规则权重（仅对低质量决策涉及的规则）
    if (avgQuality < 0.7 && this.router._ruleStats) {
      this._adjustWeights(batch, avgQuality);
    }

    // 4. 存储后训练结果（供 MCP 查询）
    this._lastBatch = {
      processedAt: Date.now(),
      count: batch.length,
      avgQuality: +avgQuality.toFixed(4),
      patterns,
      adjustments: this._lastAdjustments || [],
    };
  }

  /**
   * 单条决策的质量 retrospective 评分（0-1）
   */
  _assessQuality(item) {
    let score = 0.5;
    const { applied, decision, confidence, gate } = item;

    // 执行成功加分
    if (applied && applied.applied === true) score += 0.2;
    else if (applied && applied.applied === false) score -= 0.1;

    // 高置信度加分
    if (confidence >= 0.8) score += 0.15;
    else if (confidence < 0.4) score -= 0.1;

    // gate 结果合理（非 block 但决策为 HEAL 可能过严）
    if (gate && gate.action === 'pass' && decision === 'HEAL') score -= 0.05;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 从批次中提取共性模式
   */
  _extractPatterns(batch) {
    const patterns = [];
    const decisions = batch.map(b => b.decision);
    const unique = new Set(decisions);

    // 模式1：单一批次内同一决策反复出现（可能过度触发）
    if (unique.size === 1 && batch.length >= 2) {
      patterns.push({
        type: 'repeated_decision',
        decision: [...unique][0],
        count: batch.length,
        severity: batch.length >= 3 ? 'high' : 'medium',
      });
    }

    // 模式2：连续低置信度决策（可能规则过宽）
    const lowConf = batch.filter(b => b.confidence < 0.4);
    if (lowConf.length >= 2) {
      patterns.push({
        type: 'low_confidence_cluster',
        count: lowConf.length,
        avgConfidence: +(lowConf.reduce((s, b) => s + b.confidence, 0) / lowConf.length).toFixed(4),
      });
    }

    return patterns;
  }

  /**
   * 微调规则权重（小步长，最多 MAX_RULES_PER_BATCH 条）
   */
  _adjustWeights(batch, avgQuality) {
    if (!this.router._ruleStats) return;

    // 找出批次中涉及的规则
    const ruleIds = new Set();
    for (const item of batch) {
      if (item.decision) ruleIds.add(item.decision);
    }

    const adjustments = [];
    let adjusted = 0;

    for (const ruleId of ruleIds) {
      if (adjusted >= MAX_RULES_PER_BATCH) break;

      const stats = this.router._ruleStats[ruleId];
      if (!stats) continue;

      // 仅对历史命中次数 >= 3 的规则做微调
      if (stats.hits < 3) continue;

      // 小步长调整：质量差 * 固定步长
      const delta = Math.max(-WEIGHT_DELTA_CAP, Math.min(WEIGHT_DELTA_CAP, (avgQuality - 0.5) * 0.1));
      if (Math.abs(delta) < 0.005) continue; // 幅度太小跳过

      try {
        if (typeof this.router.updatePriority === 'function') {
          const currentPriority = this.router.getRuleStats ? this.router.getRuleStats().find(s => s.ruleId === ruleId)?.priority : undefined;
          if (typeof currentPriority === 'number') {
            const newPriority = Math.max(0, Math.min(200, currentPriority + delta * 100));
            this.router.updatePriority(ruleId, newPriority);
            adjustments.push({ ruleId, delta: +delta.toFixed(4), newPriority: +newPriority.toFixed(2) });
            adjusted++;
          }
        }
      } catch (_) {
        // 单规则调整失败不影响其他规则
      }
    }

    if (adjustments.length > 0) {
      this._lastAdjustments = adjustments;
      this._stats.totalAdjusted += adjustments.length;
    }
  }

  /**
   * 获取后训练统计摘要
   */
  getStats() {
    return {
      ...this._stats,
      queueSize: this._queue.length,
      processing: this._processing,
      lastBatch: this._lastBatch || null,
    };
  }

  /**
   * 获取最近的后训练批次结果
   */
  getLastBatch() {
    return this._lastBatch || null;
  }

  /**
   * 清空队列（紧急停止时使用）
   */
  clear() {
    this._queue = [];
    this._processing = false;
  }
}

module.exports = { PostTrainingEngine };
