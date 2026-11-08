/**
 * HeartFlow 自主学习脉动（Learning Pulse）
 *
 * 背景：两条调用路径一直在打这个模块——
 *   src/core/engine-reasoner.js:1105-1106  hf.learningPulse.beat(tcResult)
 *   src/core/think-pipeline.js:163          engine.learningPulse.beat(result || {})
 *   src/core/self-diagnosis.js:66           hf.learningPulse?.getStats()
 * 但 learningPulse 此前是 _stubFactory 占位空壳，没有 beat 方法，每次调用抛
 * TypeError 被 `/* 非关键 *\/` 吞掉——「后置触发自调度学习循环」这条路径从接线起
 * 就是死的，self-diagnosis 里那一格也恒为 null。
 *
 * 本模块给它真实实现：把每次思考的结果记成一拍，从拍子里提炼
 * 「该学什么」的调度建议。纯规则，零依赖。
 *
 * 诚实原则：没有足够拍子供判断时，suggestion 是 null 而不是编一个。
 */

'use strict';

const MAX_BEATS = 200;

class LearningPulse {
  constructor(heartflow = null) {
    this.hf = heartflow;
    this.beats = [];
    this.beatCount = 0;
    this.lastBeatAt = null;
    // 按决策类型分桶，供编排器判断「哪一类思考在反复出现」
    this.byType = new Map();
  }

  /**
   * 记一拍。
   *
   * @param {object} result 思考结果（engine-reasoner 的 tcResult / think-pipeline 的 result）
   * @returns {{recorded:boolean, beatIndex:number, type:string|null, confidence:number|null}}
   */
  beat(result) {
    const r = result || {};
    const type = typeof r.type === 'string' && r.type ? r.type
      : (r.analysis && typeof r.analysis.perceivedType === 'string' ? r.analysis.perceivedType : null);
    const confidence = typeof r.confidence === 'number' && isFinite(r.confidence) ? r.confidence : null;

    this.beatCount++;
    const entry = {
      index: this.beatCount,
      ts: Date.now(),
      type,
      confidence,
      hasOutput: typeof r.output === 'string' && r.output.length > 0,
      chainLength: Array.isArray(r.thoughtChain) ? r.thoughtChain.length : null,
      hasDecision: !!(r.decision && typeof r.decision === 'object')
    };
    this.beats.push(entry);
    if (this.beats.length > MAX_BEATS) this.beats = this.beats.slice(-MAX_BEATS);
    this.lastBeatAt = entry.ts;

    if (type) {
      const b = this.byType.get(type) || { count: 0, lowConfidence: 0, confSum: 0 };
      b.count++;
      if (confidence !== null) {
        b.confSum += confidence;
        if (confidence < 0.6) b.lowConfidence++;
      }
      this.byType.set(type, b);
    }

    return { recorded: true, beatIndex: entry.index, type, confidence };
  }

  /**
   * 从拍子里提炼调度建议。没有足够数据时返回 null（不硬编）。
   *
   * @returns {{reason:string, target:string|null, priority:'high'|'normal'|'low',
   *            evidence:object}|null}
   */
  suggest() {
    if (this.beats.length === 0) return null;

    // 判据 1：低置信度反复出现 → 该补知识
    let worstType = null;
    let worstRate = 0;
    for (const [type, b] of this.byType) {
      if (b.count < 2) continue;
      const rate = b.lowConfidence / b.count;
      if (rate > worstRate) { worstRate = rate; worstType = type; }
    }
    if (worstType && worstRate >= 0.5) {
      return {
        reason: `类型 ${worstType} 的低置信度占比 ${(worstRate * 100).toFixed(0)}%（${this.byType.get(worstType).lowConfidence}/${this.byType.get(worstType).count} 拍），优先补这一类知识`,
        target: worstType,
        priority: worstRate >= 0.75 ? 'high' : 'normal',
        evidence: { worstType, lowConfidenceRate: +worstRate.toFixed(3), sampleSize: this.byType.get(worstType).count }
      };
    }

    // 判据 2：有思考没有输出 → 链路某处静默失败，该查
    const silent = this.beats.filter(b => !b.hasOutput).length;
    if (silent >= 2) {
      return {
        reason: `最近 ${this.beats.length} 拍里有 ${silent} 拍没有 output，思考链路可能有静默失败`,
        target: 'pipeline',
        priority: silent >= 3 ? 'high' : 'normal',
        evidence: { silentBeats: silent, window: this.beats.length }
      };
    }

    // 判据 3：思考链异常短 → 推理深度不足
    const shortChain = this.beats.filter(b => b.chainLength !== null && b.chainLength <= 1).length;
    if (shortChain >= 3) {
      return {
        reason: `最近 ${this.beats.length} 拍里有 ${shortChain} 拍思考链长度 ≤1，推理深度可能不足`,
        target: 'reasoning_depth',
        priority: 'low',
        evidence: { shortChain, window: this.beats.length }
      };
    }

    // 判据 4：拍子够了但一切正常 → 如实说没建议
    if (this.beats.length >= 5) {
      return {
        reason: `最近 ${this.beats.length} 拍未发现低置信度聚集、静默失败或浅推理，暂无调度建议`,
        target: null,
        priority: 'low',
        evidence: { window: this.beats.length }
      };
    }

    // 数据不足：不猜
    return null;
  }

  getStats() {
    const confs = this.beats.filter(b => b.confidence !== null).map(b => b.confidence);
    return {
      beatCount: this.beatCount,
      windowSize: this.beats.length,
      lastBeatAt: this.lastBeatAt,
      avgConfidence: confs.length ? +(confs.reduce((a, b) => a + b, 0) / confs.length).toFixed(4) : null,
      byType: Object.fromEntries([...this.byType.entries()].map(([k, v]) => [k, {
        count: v.count,
        lowConfidence: v.lowConfidence,
        avgConfidence: v.count ? +(v.confSum / v.count).toFixed(4) : null
      }])),
      implemented: true
    };
  }

  healthCheck() {
    return { ok: true, module: 'LearningPulse', implemented: true, beatCount: this.beatCount };
  }
}

module.exports = { LearningPulse };
