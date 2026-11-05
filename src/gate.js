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
// [v6.8.91 第 736 轮] 引述框架的对外可解释入口（AGENTS.md 约定 3 同步到 MCP）。
const { describeQuotationFrame, quotationFrameFamilies: _quotationFamilies } = require('./quotation-context.js');
// [v6.8.92 第 737 轮] 分隔符混淆通道的逐 run 诊断（AGENTS.md 约定 3 同步到 MCP）。
const { describeDelimiterChannel } = require('./injection-obfuscation.js');
// [v6.8.93 第 738 轮] post_hoc 的逐路由逐腿诊断（AGENTS.md 约定 3 同步到 MCP）。
const { describePostHoc } = require('./post-hoc.js');

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

/**
 * 引述框架分析（对外公开方法，MCP 工具 heartflow_quotation_frame）。
 *
 * 回答「这段文本里的高危表述是被引述的对象，还是作者自己说出来的」，
 * 并给出该框架对 gate.action 的实际影响。用于 agent 自证一次
 * rewrite/block 抑制不是漏放，而是元话语引述。
 *
 * @param {string} text
 * @returns {{quoted:boolean, strong:boolean, tier:string|null,
 *            confidence:number, signals:string[], effect:object, reason:string}}
 */
function quotationFrame(text) {
  try {
    return describeQuotationFrame(text);
  } catch (_) {
    return { quoted: false, strong: false, tier: null, confidence: 0, signals: [], effect: {}, reason: '引述框架分析失败' };
  }
}

/**
 * [v6.8.100 第 745 轮] 引述家族逐族拆解（对外公开方法，MCP 工具
 * heartflow_quotation_frame 的 action: 'families'）。
 *
 * 与 `quotationFrame` 的分工：后者给「这一条文本的结论」，本函数给「结论是
 * 怎么逐族累加出来的、离下一级阈值还差多少、补哪一族能补上」。
 * 立项实测（r745）20 条良性元话语里 8 条漏识别，靠人读 reason 才定位到三个
 * 家族缺失——这个定位过程必须是机器可做的。
 *
 * @param {string} text
 * @returns {{tier:string|null, confidence:number, signals:string[],
 *            thresholds:object, nextTier:string|null, deficit:number,
 *            sufficientFamilies:string[], matched:object[], unmatched:object[],
 *            families:object[]}}
 */
function quotationFrameFamilies(text) {
  try {
    return _quotationFamilies(text);
  } catch (_) {
    return { tier: null, confidence: 0, signals: [], thresholds: {}, nextTier: 'weak', deficit: 0.45, sufficientFamilies: [], matched: [], unmatched: [], families: [], error: '引述家族拆解失败' };
  }
}

/**
 * 分隔符混淆通道诊断（对外公开方法，MCP 工具 heartflow_delimiter_channel）。
 *
 * 回答「这段文本里的字母撒点 run 各自还原成了什么、有没有被边界修剪」。
 * 用于 agent 自证一次 block 不是因为漏放，也不是因为误伤——r737 修复的
 * 正是这条通道此前无法自证的部分：run 跨词吞字母导致紧凑串还原失败时，
 * 通道对外只显示 count=0，看不出「抽出了 run 但没还原出来」。
 *
 * @param {string} text
 * @returns {{channel:string, runCount:number, accepted:object[], rejected:object[],
 *            view:string|null, repairedCount:number}}
 */
function delimiterChannel(text) {
  try {
    return describeDelimiterChannel(text);
  } catch (_) {
    return {
      channel: 'delimiter_confusion', runCount: 0,
      accepted: [], rejected: [], view: null, repairedCount: 0,
    };
  }
}

/**
 * post_hoc（后此谬误）逐路由逐腿诊断（对外公开方法，MCP 工具
 * heartflow_post_hoc_legs）。
 *
 * 回答「这段文本被判/没判后此谬误，是哪条路由的哪条腿说了算」。用于 agent
 * 自证一次 pass 不是漏放、一次 rewrite 不是误伤——r738 修的正是这条维度
 * 此前无法自证的部分：R2 的 EN 侧缺第三条腿（归因主张），导致中性工程复盘
 * 与真谬误样本形状同构，而对外只显示 count=0，看不出「干预×变化两腿都中了，
 * 只差归因主张」。
 *
 * @param {string} text
 * @returns {{dimension:string, exempt:boolean, exemptSource:string, routes:object[],
 *            score:number, count:number}}
 */
function postHocLegs(text) {
  try {
    const d = describePostHoc(text);
    return {
      dimension: 'post_hoc',
      exempt: d.exempt, exemptSource: d.exemptSource || '',
      exemptEvidence: d.exemptEvidence || [],
      routes: d.routes || [],
      score: d.score, count: d.count,
    };
  } catch (_) {
    return { dimension: 'post_hoc', exempt: false, exemptSource: '', routes: [], score: 0, count: 0 };
  }
}

module.exports = { gate, check, pipeline, runPipeline, discriminate, checkInput, checkDraft, checkOutput, quotationFrame, quotationFrameFamilies, delimiterChannel, postHocLegs };
