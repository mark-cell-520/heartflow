/**
 * src/gate.js — AGI 第 1 层：辨别门禁
 *
 * 这是 AI agent 调用的单一入口。不需要理解 45 个维度，
 * 只需要检查 gate.action：
 *
 *   const { gate } = require('@yun520-1/heartflow').gate(text);
 *   if (gate.action === 'block')  → 拦截输出
 *   if (gate.action === 'rewrite') → 改写后再输出
 *   if (gate.action === 'verify') → 验证证据链
 *   if (gate.action === 'pass')   → 通过
 *
 * 使用方式：
 *   const hf = require('./gate.js');
 *   const result = hf.gate('你要检测的文本');
 *   console.log(result.gate.action, result.gate.reason);
 */

'use strict';

const { discriminate } = require('./index.js');
const pipelineModule = require('./pipeline.js');
const { detectPedagogicalContent } = require('./pedagogy.js');
const { buildTrace, summarizeTrace } = require('./discrimination-trace.js');
const { normalize } = require('./text-normalizer.js');

function _pedagogyMode(text) {
  return detectPedagogicalContent(text) ? 'pedagogical' : undefined;
}

/** 归一化信息（供 trace 记录判定所基于的文本形态） */
function _normInfo(text) {
  try {
    const n = normalize(text);
    return (n.normalized && n.normalized !== text)
      ? { normalized: n.normalized, applied: n.applied }
      : { normalized: null, applied: [] };
  } catch (_) { return { normalized: null, applied: [] }; }
}

/**
 * [v6.7.72] 给判别结果附加可解释性 trace。
 * 透出哪些维度命中、命中的原文片段、以及归一化手段链。
 */
function _withTrace(result, text) {
  if (!result || typeof result !== 'object') return result;
  try {
    const n = _normInfo(text);
    result.trace = buildTrace(result, n);
    result.traceSummary = summarizeTrace(result.trace);
  } catch (_) { /* 防御性: trace 失败不阻断判定 */ }
  return result;
}

/** AGI 第 1 层门禁 — 辨别文本并返回行动指令 */
function gate(text, evidence = []) {
  const r = discriminate(text, evidence, _pedagogyMode(text));
  return _withTrace(r, text);
}

/** 快速门禁检查 — 只返回行动指令，适合 LLM agent 轻量调用 */
function check(text) {
  const result = discriminate(text, [], _pedagogyMode(text));
  const n = _normInfo(text);
  return {
    action: result.gate.action,
    reason: result.gate.reason,
    score: result.overallScore,
    // [v6.7.72] 快速入口也带 trace 摘要，避免"只给结论不给理由"
    traceSummary: summarizeTrace(buildTrace(result, n)),
  };
}

/** 管道模式：text 先过 gate，返回 gate-filtered 结论和原始结果 */
function pipeline(text, evidence) {
  if (typeof text === 'object' && text !== null) {
    return pipelineModule.runPipeline({ input: text.input || text.text || '', mode: text.mode || 'input' });
  }
  const result = discriminate(text, evidence, _pedagogyMode(text));
  if (result.gate.action === 'block') {
    return _withTrace({ ...result, error: 'gate_blocked', message: `输出被拦截: ${result.gate.reason}` }, text);
  }
  if (result.gate.action === 'rewrite') {
    return _withTrace({ ...result, warning: `需改写: ${result.gate.reason}` }, text);
  }
  return _withTrace(result, text);
}

// 从 pipeline 重新导出完整版
const { runPipeline, checkInput, checkDraft, checkOutput } = pipelineModule;

module.exports = { gate, check, pipeline, runPipeline, discriminate, checkInput, checkDraft, checkOutput };
