/**
 * JudgmentInjector — 判定注入器 v1.0
 *
 * 心虫判出了结论，还得**真的进到回应里**才算数。本模块把 gate 判定拆成两类：
 *   · userFacing —— 必须出现在用户可见文本里的部分（不确定性披露、待验证标注）；
 *   · internalNotes —— 只给 agent 自己看的部分（哪条断言缺证据、该怎么改）。
 * 把两者混在一起，要么把内部警告直接怼给用户，要么把该披露的悄悄吞掉。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:685 的内联 stub 让
 *   dispatch('personaCore.judgmentInjector') 恒返回 {}
 *   （scripts/tmp-250-probe.js 实测）。该路由在 src/mcp-server.js:1060 的
 *   personaCore 能力清单里广告出去。本文件补真实实现。
 *
 * 设计纪律：
 *   1. 没有判定可注入时如实返回 judgment:null + injectCount:0 —— 不编造注入项；
 *   2. block 判定不给 userFacing（那条消息根本不该发），只给 internalNotes；
 *   3. 每条注入项带 reason（哪条判据触发），可审计。
 */

'use strict';

// verdict → 用户可见披露。action 优先于 verdict（两者同源，action 更细）。
const DISCLOSURE = {
  verify: {
    position: 'append', kind: 'verification_notice',
    text: '（其中标注 ⚠️ 的结论我还没有证据支撑，先按待验证看待。）',
    reason: 'gate.action=verify：有关键断言待取证，须向用户明示',
  },
  rewrite: {
    position: 'none', kind: 'rewrite_notice',
    text: '',
    reason: 'gate.action=rewrite：先改写再发，用户侧无需额外披露',
  },
  block: {
    position: 'none', kind: 'block_notice',
    text: '',
    reason: 'gate.action=block：这条回应不该发送，无用户可见注入',
  },
};

function readJudgment(hf) {
  if (!hf || typeof hf !== 'object') return null;
  const gate = hf.gate && typeof hf.gate === 'object' ? hf.gate : null;
  const judgment = hf.judgment && typeof hf.judgment === 'object' ? hf.judgment : null;
  const action = (gate && gate.action) || (judgment && judgment.action) || null;
  const verdict = hf.verdict || (judgment && judgment.verdict) || null;
  const score = typeof hf.overallScore === 'number' ? hf.overallScore
    : (typeof judgment?.score === 'number' ? judgment.score : null);
  const findings = Array.isArray(hf.findings) ? hf.findings : (Array.isArray(judgment?.findings) ? judgment.findings : []);
  const reason = (gate && gate.reason) || (judgment && judgment.reason) || null;
  if (!action && !verdict && score === null && findings.length === 0) return null;
  return { action, verdict, score, findings, reason };
}

class JudgmentInjector {
  /**
   * @param {object} [opts]
   * @param {number} [opts.lowScoreThreshold] 低于该分数强制加不确定性披露（默认 0.5）
   * @param {number} [opts.criticalSeverity] findings 里高于该严重度进内部笔记（默认 70）
   */
  constructor(opts = {}) {
    this._lowScore = Number.isFinite(opts.lowScoreThreshold) ? opts.lowScoreThreshold : 0.5;
    this._critical = Number.isFinite(opts.criticalSeverity) ? opts.criticalSeverity : 70;
  }

  /**
   * @param {object|string} heartflow 心虫结果（或用户译文，顺序宽容）
   * @param {object|string} [userTranslation] 用户译文（或心虫结果）
   * @returns {{judgment:object|null,userFacing:Array,internalNotes:Array,injectCount:number,source:string|null}}
   */
  inject(heartflow, userTranslation) {
    // 顺序宽容：判定结果一定含 gate/findings/verdict 之一
    let hf = heartflow;
    if ((!hf || typeof hf !== 'object') && userTranslation && typeof userTranslation === 'object') {
      hf = userTranslation;
    }
    const j = readJudgment(hf);
    if (!j) {
      return {
        judgment: null,
        userFacing: [],
        internalNotes: [{ text: '未拿到心虫判定，本轮不做任何注入', reason: '入参里没有 gate/findings/verdict/overallScore' }],
        injectCount: 0,
        source: null,
      };
    }

    const userFacing = [];
    const internalNotes = [];

    // 1. action 对应的披露
    const d = j.action ? DISCLOSURE[j.action] : null;
    if (d && d.position !== 'none') {
      userFacing.push({ position: d.position, kind: d.kind, text: d.text, reason: d.reason });
    } else if (d) {
      internalNotes.push({ text: d.text || d.reason, reason: d.reason });
    }

    // 2. 低分强制披露（即便 action=pass，分数低也要说清不确定）
    if (typeof j.score === 'number' && j.score < this._lowScore && j.action !== 'block') {
      userFacing.push({
        position: 'prepend', kind: 'low_score_disclosure',
        text: `（这一轮的综合把握度只有 ${j.score}，下面凡是我推断的部分都标出来了。）`,
        reason: `overallScore=${j.score} < ${this._lowScore}：低把握度必须前置披露`,
      });
    }

    // 3. 高危 findings → 内部笔记（按 severity 降序，最多 6 条）
    const critical = j.findings
      .filter((f) => f && typeof f.severity === 'number' && f.severity >= this._critical)
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 6);
    for (const f of critical) {
      internalNotes.push({
        text: `[${f.dimension}] ${f.details || ''}`,
        reason: `severity=${f.severity} ≥ ${this._critical}；guidance: ${f.guidance || '（无）'}`,
      });
    }

    // 4. block：把 reason 顶到内部笔记最前面（这条最该被看见）
    if (j.action === 'block') {
      internalNotes.unshift({ text: `门禁 block：${j.reason || '（未给理由）'}`, reason: 'block 判定必须让 agent 在生成前看到' });
    }

    return {
      judgment: {
        action: j.action, verdict: j.verdict || null, score: j.score, reason: j.reason || null,
        findingCount: j.findings.length,
      },
      userFacing,
      internalNotes,
      injectCount: userFacing.length + internalNotes.length,
      source: 'judgment-injector',
    };
  }
}

module.exports = { JudgmentInjector, DISCLOSURE };
