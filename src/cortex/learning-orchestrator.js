/**
 * HeartFlow 学习编排器（Learning Orchestrator）
 *
 * 背景：两处调用方一直在读它——
 *   src/core/self-diagnosis.js:67   hf.learningOrchestrator?.status()
 *   src/core/what-learned.js:112-113 const status = hf.learningOrchestrator.status()
 *     → 读 status.learningLoop.{detect,explore,absorb}、status.linkage.learnerToExplorer、
 *       status.healthScore
 * 但 learningOrchestrator 此前是 _stubFactory 占位空壳，没有 status 方法，
 * 调用即抛 TypeError。what-learned.js:112 在 try 里 → 整段「⚙️ 学习循环」报告
 * 恒不出现；self-diagnosis.js:67 用 ?. 但方法不存在仍会抛。
 *
 * 本模块给它真实实现：把 detect / explore / absorb 三段循环的真实计数汇总，
 * 从引擎现有子系统的真实统计里算联动状态与健康度。纯规则，零依赖。
 *
 * 诚实原则：某个子系统不存在或没有统计时，对应字段是 null 而不是编一个数。
 */

'use strict';

class LearningOrchestrator {
  constructor(heartflow = null) {
    this.hf = heartflow;
    this.cycleLog = [];
    this.maxLog = 50;
  }

  /** 安全取数：子系统缺失 / 抛错都返回 fallback，不让巡检自己崩 */
  _stat(engine, key, pick, fallback = null) {
    try {
      const mod = engine && engine[key];
      if (!mod) return fallback;
      if (typeof pick === 'function') return pick(mod);
      if (typeof mod.getStats === 'function') {
        const s = mod.getStats();
        return (s && typeof s === 'object') ? s : fallback;
      }
      return fallback;
    } catch (e) {
      return fallback;
    }
  }

  /**
   * 学习循环状态汇总。
   *
   * @returns {{learningLoop:{detect:number|null,explore:number|null,absorb:number|null},
   *            linkage:{learnerToExplorer:boolean,explorerToDistiller:boolean,distillerToLearner:boolean},
   *            healthScore:number|null, sources:object, implemented:true}}
   */
  status() {
    const hf = this.hf;
    if (!hf) {
      return {
        learningLoop: { detect: null, explore: null, absorb: null },
        linkage: { learnerToExplorer: false, explorerToDistiller: false, distillerToLearner: false },
        healthScore: null,
        sources: {},
        implemented: true,
        note: 'no_engine_bound: 未绑定引擎实例，无法取真实计数'
      };
    }

    const sources = {};

    // ── detect：continuousLearner 的思考次数 + 教训条数 ──
    const learner = this._stat(hf, 'continuousLearner', m => (typeof m.getStats === 'function' ? m.getStats() : null), null);
    const detect = (learner && typeof learner.thinkCount === 'number') ? learner.thinkCount
      : (learner && typeof learner.count === 'number' ? learner.count : null);
    if (learner) sources.continuousLearner = Object.keys(learner).slice(0, 8);

    // ── explore：knowledgeExplorer 的探索次数 ──
    const explorer = this._stat(hf, 'knowledgeExplorer', m => (typeof m.getStats === 'function' ? m.getStats() : null), null);
    const explore = (explorer && typeof explorer.exploreCount === 'number') ? explorer.exploreCount
      : (explorer && typeof explorer.count === 'number' ? explorer.count
        : (explorer && typeof explorer.queries === 'number' ? explorer.queries : null));
    if (explorer) sources.knowledgeExplorer = Object.keys(explorer).slice(0, 8);

    // ── absorb：experienceDistiller 的蒸馏条数 ──
    const distiller = this._stat(hf, 'experienceDistiller', m => (typeof m.getStats === 'function' ? m.getStats() : null), null);
    const absorb = (distiller && typeof distiller.distilledCount === 'number') ? distiller.distilledCount
      : (distiller && typeof distiller.count === 'number' ? distiller.count
        : (distiller && typeof distiller.total === 'number' ? distiller.total : null));
    if (distiller) sources.experienceDistiller = Object.keys(distiller).slice(0, 8);

    // ── 联动：三段都真的跑过才算联通 ──
    const linkage = {
      learnerToExplorer: detect !== null && explore !== null && detect > 0 && explore > 0,
      explorerToDistiller: explore !== null && absorb !== null && explore > 0 && absorb > 0,
      distillerToLearner: absorb !== null && detect !== null && absorb > 0 && detect > 0
    };

    // ── 健康度：三段齐备且都非零才算通；缺段按比例折，缺数据不折也不满分 ──
    const stages = [detect, explore, absorb];
    const known = stages.filter(s => s !== null).length;
    let healthScore = null;
    if (known > 0) {
      const active = stages.filter(s => s !== null && s > 0).length;
      healthScore = +(active / 3).toFixed(4);
    }

    const out = {
      learningLoop: { detect, explore, absorb },
      linkage,
      healthScore,
      sources,
      implemented: true
    };

    this.cycleLog.push({ ts: Date.now(), learningLoop: out.learningLoop, healthScore });
    if (this.cycleLog.length > this.maxLog) this.cycleLog = this.cycleLog.slice(-this.maxLog);

    return out;
  }

  /** 从脉动拿调度建议（学习Pulse 已实现时）——没有则如实 null */
  suggestion() {
    try {
      const pulse = this.hf && this.hf.learningPulse;
      if (pulse && typeof pulse.suggest === 'function') return pulse.suggest();
    } catch (e) { /* 建议拿不到不阻断巡检 */ }
    return null;
  }

  getStats() {
    const last = this.cycleLog[this.cycleLog.length - 1] || null;
    return {
      statusCalls: this.cycleLog.length,
      lastLearningLoop: last ? last.learningLoop : null,
      lastHealthScore: last ? last.healthScore : null,
      implemented: true
    };
  }

  healthCheck() {
    return { ok: true, module: 'LearningOrchestrator', implemented: true, statusCalls: this.cycleLog.length };
  }
}

module.exports = { LearningOrchestrator };
