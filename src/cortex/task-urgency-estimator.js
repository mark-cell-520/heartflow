/**
 * HeartFlow 任务紧迫性估计器
 *
 * 背景：src/core/engine-reasoner.js:277-279 一直在调
 *   hf._urgencyEstimate = hf.taskUrgencyEstimator.estimate(input, { previousUrgency: prev });
 *   hf._lastUrgency = hf._urgencyEstimate.urgency;
 * 但 taskUrgencyEstimator 此前是 _stubFactory 产出的占位空壳，没有 estimate 方法，
 * 每次调用都抛 TypeError，被调用点的 `catch(e) { /* 非关键 *\/ }` 吞掉——
 * 结果 hf._urgencyEstimate 恒 undefined、hf._lastUrgency 恒 undefined，
 * 「前置判断输入紧迫性、计入上下文」这条路径从接线起就是死的。
 *
 * 本模块给它真实实现：纯规则，零依赖，输入文本出紧迫度。
 *
 * 设计原则（与 AGENTS.md 一致）：
 *   1. 可审计 —— 每个加分项都登记在 signals 里，能指回原文依据
 *   2. 不假装 —— 没有命中任何信号时 urgency 不是「猜的中值」，而是如实走基线
 *   3. 平滑 —— 带 previousUrgency 惯性，避免同一会话内紧迫度跳变
 */

'use strict';

// 紧迫语族：越靠前权重越高。中文口语与书面都覆盖。
const URGENT_MARKERS = [
  // 最高档：明确的时间压迫
  { re: /(立刻|马上|立即|即刻|当即|right now|immediately|asap|urgent)/i, w: 0.34, tag: 'immediate' },
  { re: /(赶紧|赶快|快|尽快|越快越好|hurr?y)/i, w: 0.24, tag: 'haste' },
  // 「今天/本周」单独出现多半只是在说时间，不是催。要求同句还有压力词才算数
  //（r251 实测：「今天天气不错」曾被旧的无条件 deadline 词判成 moderate）。
  { re: /(今天|今晚|本周内|日前|截止|deadline|due\b|eod|下班前).{0,24}(要|需|得|必须|交|给|完成|上线|答复|回复|定|确认|处理|搞|做)/i, w: 0.45, tag: 'deadline' },
  { re: /(要|需|得|必须|交|完成|上线|答复|回复|处理).{0,24}(今天|今晚|日前|截止|deadline|due\b|eod|下班前)/i, w: 0.45, tag: 'deadline' },
  // 次高档：事态严重
  { re: /(紧急|十万火急|危急|特急|emergency|critical)/i, w: 0.28, tag: 'emergency' },
  { re: /(挂了|崩溃|故障|宕机|down|crash|broken|失败|报错|异常|漏洞|泄露)/i, w: 0.30, tag: 'incident' },
  { re: /(线上|生产|production|用户|客户).{0,6}(受影响|不能用|投诉|丢|坏)/i, w: 0.24, tag: 'user_impact' },
  // 中档：请求压力
  { re: /(必须|务必|一定要|非得|must|have to|need to)/i, w: 0.16, tag: 'obligation' },
  { re: /(催|等不及|拖不得了|不能再等)/i, w: 0.22, tag: 'pressing' },
  { re: /(帮帮我|救命|急死|慌了|怎么办|受不了)/i, w: 0.18, tag: 'distress' },
];

// 反向信号：明确的不紧迫
const CALM_MARKERS = [
  { re: /(不急|慢慢来|有空|方便时|随时|不着急|no rush|whenever|take your time)/i, w: -0.26, tag: 'explicitly_relaxed' },
  { re: /(以后|将来|下周|下个月|明年|以后再说|someday|later)/i, w: -0.14, tag: 'distant_horizon' },
  { re: /(随便|无所谓|都可以|看看而已|了解一下|just curious|fyi)/i, w: -0.16, tag: 'low_stakes' },
];

const PUNCT_WEIGHT = 0.10;   // 感叹号 / 连续问号
const CAPS_WEIGHT = 0.08;    // 英文全大写词（ shouting ）
const REPEAT_WEIGHT = 0.06;  // 同一紧迫词重复出现
const INERTIA = 0.25;        // previousUrgency 的惯性系数
const BASELINE = 0.15;       // 无任何信号时的基线：陌生输入不该被判成 moderate

class TaskUrgencyEstimator {
  /**
   * @param {object} [opts] 预留配置位（当前无配置项，保留以对齐调用方构造签名）
   */
  constructor(opts = {}) {
    this.opts = opts;
    this.history = [];       // 最近 N 次估计，供 getStats 观测
    this.maxHistory = 50;
    this.estimateCount = 0;
  }

  /**
   * 估计输入文本的任务紧迫度。
   *
   * @param {string} input 用户输入
   * @param {{previousUrgency?: number|null}} [ctx] 上一次的紧迫度（平滑用）
   * @returns {{urgency:number, level:string, signals:Array, previousUrgency:number|null,
   *            smoothed:boolean, markerCount:number, baseline:number}}
   */
  estimate(input, ctx = {}) {
    const text = typeof input === 'string' ? input : (input == null ? '' : String(input));
    const previous = (ctx && typeof ctx.previousUrgency === 'number' && isFinite(ctx.previousUrgency))
      ? Math.max(0, Math.min(1, ctx.previousUrgency))
      : null;

    const signals = [];
    let raw = 0;

    // 1) 紧迫语族（按出现计分，同族重复只按一次计，避免刷分）
    const seenTags = new Set();
    for (const m of URGENT_MARKERS) {
      if (m.re.test(text)) {
        const repeat = (text.match(new RegExp(m.re.source, 'gi')) || []).length;
        let w = m.w;
        if (repeat > 1) w += REPEAT_WEIGHT * Math.min(repeat - 1, 2);
        raw += w;
        seenTags.add(m.tag);
        signals.push({ tag: m.tag, weight: +w.toFixed(3), hits: repeat });
      }
    }

    // 2) 反向信号
    for (const m of CALM_MARKERS) {
      if (m.re.test(text)) {
        raw += m.w;
        signals.push({ tag: m.tag, weight: m.w, hits: 1 });
      }
    }

    // 3) 标点与全大写（shouting）
    const excl = (text.match(/[!！]/g) || []).length;
    if (excl >= 1) {
      raw += PUNCT_WEIGHT * Math.min(excl, 3);
      signals.push({ tag: 'exclamation', weight: +(PUNCT_WEIGHT * Math.min(excl, 3)).toFixed(3), hits: excl });
    }
    const qmarks = (text.match(/[?？]{2,}/g) || []).length;
    if (qmarks >= 1) {
      raw += PUNCT_WEIGHT;
      signals.push({ tag: 'repeated_question', weight: PUNCT_WEIGHT, hits: qmarks });
    }
    const capsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
    if (capsWords >= 1) {
      raw += CAPS_WEIGHT * Math.min(capsWords, 2);
      signals.push({ tag: 'shouting', weight: +(CAPS_WEIGHT * Math.min(capsWords, 2)).toFixed(3), hits: capsWords });
    }

    // 4) 基线 + 截断
    const markerCount = signals.filter(s => s.weight > 0).length;
    let urgency = BASELINE + raw;
    urgency = Math.max(0, Math.min(1, urgency));

    // 5) 惯性平滑：仅在「有历史值」且本次没有强反向信号时生效，
    //    避免一句「不急」把真正紧急的上文抹平。
    let smoothed = false;
    if (previous !== null) {
      const strongCounter = signals.some(s => s.tag === 'explicitly_relaxed');
      const strongUrgent = markerCount >= 2;
      if (!strongCounter || strongUrgent) {
        urgency = urgency * (1 - INERTIA) + previous * INERTIA;
        urgency = Math.max(0, Math.min(1, urgency));
        smoothed = true;
      }
    }

    const out = {
      urgency: +urgency.toFixed(4),
      level: this._level(urgency),
      signals,
      previousUrgency: previous,
      smoothed,
      markerCount,
      baseline: BASELINE,
      textLength: text.length,
      // 诚实标注：零信号时 urgency 就是基线，不是「测出来很高/很低」
      inferred: markerCount === 0 ? 'baseline_only' : 'signal_based'
    };

    this.estimateCount++;
    this.history.push({ urgency: out.urgency, level: out.level, markerCount, ts: Date.now() });
    if (this.history.length > this.maxHistory) this.history = this.history.slice(-this.maxHistory);

    return out;
  }

  _level(u) {
    if (u >= 0.80) return 'critical';
    if (u >= 0.58) return 'high';
    if (u >= 0.38) return 'moderate';
    if (u >= 0.22) return 'low';
    return 'minimal';
  }

  /** 供 self-diagnosis / 巡检读的可观测统计 */
  getStats() {
    const recent = this.history.slice(-10);
    const avg = recent.length ? recent.reduce((a, b) => a + b.urgency, 0) / recent.length : null;
    return {
      estimateCount: this.estimateCount,
      recentAvgUrgency: avg === null ? null : +avg.toFixed(4),
      recentLevels: recent.map(r => r.level),
      historySize: this.history.length,
      implemented: true
    };
  }

  healthCheck() {
    return { ok: true, module: 'TaskUrgencyEstimator', implemented: true, estimateCount: this.estimateCount };
  }
}

module.exports = { TaskUrgencyEstimator };
