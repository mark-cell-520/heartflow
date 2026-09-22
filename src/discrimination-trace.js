/**
 * HeartFlow — Discrimination Trace（判别可解释性）
 *
 * 来源：心虫 decision.decide 选定（0.92 分，confidence 0.85）。
 *
 * 诊断实证：block 判定的 findings 只有 {dimension, severity, details}——
 *   "dangerous_instruction(4次)"
 * 调用方看到这句不知道**哪句话**触发了、命中**哪个模式**、文本有没有被
 * 归一化还原。结果是：拿到 block 的人只能瞎猜该改哪里，或者干脆不信这个判定。
 *
 * 各维度的 checkXxx() 其实都返回了 hits/claims/signals 等证据数组，
 * 只是从没透出到 findings。本模块做两件事：
 *   1. buildTrace(discriminateResult) — 把证据数组收敛成可读 trace
 *   2. 输出命中原文片段 + 模式类型 + 归一化手段链
 *
 * 设计原则：
 * - 只做透出，不重新检测（单一真相源：证据在维度返回值里）
 * - 缺证据的维度也要给出行号级说明（"该维度未返回命中详情"），不留空洞
 * - 纯函数，零依赖
 */

'use strict';

/** 各维度的证据字段名（实测核对） */
const EVIDENCE_FIELDS = [
  'hits',        // dangerous_instruction / hate_speech / phishing / coverup / gaslighting
  'claims',      // capability_overclaim / unsupported_claim
  'injections',  // prompt_injection
  'manipulations', // emotional_manipulation
  'urgencies',   // false_urgency
  'presuppositions', // presupposition
  'blames',      // victim_blaming
  'binds',       // double_bind
  'deprivations', // info_deprivation
  'empties',     // empty_answer
  'foundations', // moral_foundations
  'signals',     // deception / dogwhistle / abuse / crime / pornography / marginal / general
  'issues',      // confidence / reasoning_coherence
  'matches',     // vagueness
  'fallacies',   // fallacies
  'contradictions', // contradiction
  'misses',      // meta_cognition / theory_of_mind
  'misalignments', // goal_misalignment
  'norms',       // social_norm
  'types',       // code_security（字段是 string[]）
  'categories',  // bullshit_recognition / dehumanization
  'behaviors',   // instrumental_reasoning
  'categories',  // dehumanization
];

/** 从证据数组元素提取可读文本 */
function _evidenceText(el) {
  if (el === null || el === undefined) return '';
  if (typeof el === 'string') return el;
  if (typeof el === 'number') return String(el);
  if (typeof el !== 'object') return String(el);
  // 优先取"命中的原文"
  return el.matched || el.match || el.text || el.example || el.pair
    || el.message || el.type || el.label || el.detail || el.name
    || JSON.stringify(el).slice(0, 80);
}

/**
 * 为单个维度提取证据。
 *
 * @param {string} dimName 维度名
 * @param {object} dimResult checkXxx() 的返回值
 * @returns {{hasEvidence: boolean, samples: string[], patternTypes: string[], count: number}}
 */
function extractDimensionEvidence(dimName, dimResult) {
  const out = { hasEvidence: false, samples: [], patternTypes: [], count: 0 };
  if (!dimResult || typeof dimResult !== 'object') return out;

  const cnt = typeof dimResult.count === 'number' ? dimResult.count
    : (typeof dimResult.totalHits === 'number' ? dimResult.totalHits : 0);
  out.count = cnt;

  for (const field of EVIDENCE_FIELDS) {
    const arr = dimResult[field];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    out.hasEvidence = true;
    for (const el of arr.slice(0, 3)) {
      const txt = _evidenceText(el);
      if (txt) out.samples.push(String(txt).slice(0, 100));
      if (el && typeof el === 'object' && typeof el.type === 'string') {
        out.patternTypes.push(el.type);
      }
    }
    break; // 取到第一个有内容的证据字段即够
  }

  // 去重
  out.samples = [...new Set(out.samples)].slice(0, 3);
  out.patternTypes = [...new Set(out.patternTypes)].slice(0, 4);
  return out;
}

/**
 * 构建判别 trace。
 *
 * @param {object} discResult discriminate() 的返回值
 * @param {object} opts { normalized, applied }
 *   normalized — 归一化后的文本（若有）
 *   applied    — 用过的归一化手段列表
 * @returns {array} trace 条目数组，按严重度降序
 */
function buildTrace(discResult, opts = {}) {
  if (!discResult || typeof discResult !== 'object') return [];
  const dims = discResult.dimensions || {};
  const findings = Array.isArray(discResult.findings) ? discResult.findings : [];

  const trace = [];
  for (const f of findings) {
    if (!f || f.dimension === 'none') continue;
    const dim = dims[f.dimension];
    const ev = extractDimensionEvidence(f.dimension, dim);
    // 零命中不出现在 trace 里——否则摘要充满 ×0 噪音
    if (ev.count === 0 && !ev.hasEvidence) continue;
    const entry = {
      dimension: f.dimension,
      severity: typeof f.severity === 'number' ? f.severity : 0,
      count: ev.count,
      evidence: ev.hasEvidence ? ev.samples : [],
      patternTypes: ev.patternTypes,
      note: ev.hasEvidence ? undefined : '该维度未返回命中详情（证据字段为空）',
    };
    trace.push(entry);
  }

  // 归一化手段链（说明判定是在还原后的文本上做的）
  if (opts.applied && opts.applied.length > 0) {
    trace.push({
      dimension: '_normalization',
      severity: 0,
      count: opts.applied.length,
      evidence: [`归一化手段: ${opts.applied.join(' → ')}`],
      note: opts.normalized ? '判定基于归一化后的文本；原文见 result.input' : '',
    });
  }

  return trace.sort((a, b) => b.severity - a.severity);
}

/**
 * 人类可读的一句话 trace 摘要。
 */
function summarizeTrace(trace) {
  if (!Array.isArray(trace) || trace.length === 0) return '无命中';
  const parts = [];
  for (const t of trace) {
    if (t.dimension === '_normalization') continue;
    const ev = t.evidence.length > 0 ? `("${t.evidence[0]}")` : '';
    parts.push(`${t.dimension}×${t.count}${ev}`);
  }
  const norm = trace.find(t => t.dimension === '_normalization');
  const normStr = norm ? ' | 归一化: ' + norm.evidence[0].replace('归一化手段: ', '') : '';
  return parts.join(' + ') + normStr;
}

module.exports = { buildTrace, summarizeTrace, extractDimensionEvidence, EVIDENCE_FIELDS };
