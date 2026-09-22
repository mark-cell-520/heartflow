/**
 * HeartFlow — False Positive Feedback Loop（误报反馈闭环）
 *
 * 来源：心虫 decision.decide 选定（0.92 分，confidence 0.80）。
 *
 * 问题：被 gate 拦（block/rewrite）的调用方没有渠道回报"这是误报"。
 * 结果：阈值只能靠内部 203 样本调，无法感知真实世界的误报分布——
 * 引擎越是孤立，越是把内部样本的分布当成全部真相。
 *
 * 设计：
 *   1. report()     落盘一条误报记录（原文+判定+调用方标注）
 *   2. stats()      聚合：按维度统计误报数/误报率/最常被误报的模式
 *   3. suggest()    给出阈值调整建议（有数据支撑，不是拍脑袋）
 *   4. clear()      清理（供测试或运维用）
 *
 * 隐私铁律（对应用户铁律）：
 *   - 只存判定相关字段，**不落调用方身份**（无 ip / 无 session id / 无 token）
 *   - 原文默认只存长度+摘要前 80 字；full_text=true 时才存全文（供模式分析）
 *   - 文件权限 600
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.HEARTFLOW_FEEDBACK_DIR
  || path.join(__dirname, '..', 'data', 'feedback');
const FP_FILE = path.join(DATA_DIR, 'false-positives.jsonl');
const FP_CONFIRMED_FILE = path.join(DATA_DIR, 'false-positives-confirmed.jsonl');

/** 认可的误报标注值（调用方只能从这几个里选，避免自由文本无法聚合） */
const REASONS = [
  'no_intent',        // 文本没有相关意图（如只是在讨论/引述）
  'benign_usage',     // 正常用法被误判（如"玩具""威胁"这类通用词）
  'wrong_language',   // 语言/语境误判
  'over_broad_rule',  // 规则过宽（模式匹配了不该匹配的）
  'other',            // 其他（可附 note）
];

// ── 内部工具 ──────────────────────────────────────────────

function _ensureDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
}

function _summarize(text, max = 80) {
  if (typeof text !== 'string') return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

function _append(file, obj) {
  _ensureDir();
  fs.appendFileSync(file, JSON.stringify(obj) + '\n');
  try { fs.chmodSync(file, 0o600); } catch (_) {}
}

function _readLines(file) {
  try {
    return fs.readFileSync(file, 'utf8')
      .split('\n')
      .filter(l => l.trim())
      .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
      .filter(Boolean);
  } catch (_) { return []; }
}

// ── 公开 API ──────────────────────────────────────────────

/**
 * 记录一条误报。
 *
 * @param {object} p
 *   text       判定用的原文（被拦时的输入）
 *   action     gate.action（应为 block 或 rewrite）
 *   dimension  被误报命中的维度名
 *   trace      traceSummary（可选，供模式分析）
 *   reason     误报标注（REASONS 之一）
 *   note       补充说明（可选，≤200 字）
 *   fullText   是否存原文全文（默认 false）
 */
function report(p = {}) {
  const { text, action, dimension, trace, reason, note, fullText } = p;
  if (typeof text !== 'string' || text.trim() === '') {
    return { success: false, error: 'text 不能为空' };
  }
  if (!['block', 'rewrite', 'verify'].includes(action)) {
    return { success: false, error: `action 必须是 block/rewrite/verify（收到: ${action}）` };
  }
  if (typeof dimension !== 'string' || dimension === '') {
    return { success: false, error: 'dimension 不能为空（哪个维度误报了）' };
  }
  if (!REASONS.includes(reason)) {
    return { success: false, error: `reason 必须是: ${REASONS.join(' / ')}` };
  }

  const entry = {
    ts: Date.now(),
    action,
    dimension,
    trace: typeof trace === 'string' ? trace.slice(0, 200) : null,
    reason,
    note: typeof note === 'string' ? note.slice(0, 200) : null,
    textLen: text.length,
    textSample: _summarize(text),
    // 全文默认不落盘——隐私铁律
    ...(fullText === true ? { fullText: text.slice(0, 2000) } : {}),
  };
  _append(FP_FILE, entry);
  return { success: true, reason, dimension, textLen: entry.textLen };
}

/**
 * 聚合统计。
 * @returns {{total, byDimension, byReason, byAction, confirmRate, topDimensions}}
 */
function stats() {
  const entries = _readLines(FP_FILE);
  const confirmed = _readLines(FP_CONFIRMED_FILE);
  // 已确认的记录不再计入"未确认"池，否则 stats.total 永远含历史
  const confirmedKeys = new Set(confirmed.map(e => `${e.ts}|${e.dimension}`));
  const pending = entries.filter(e => !confirmedKeys.has(`${e.ts}|${e.dimension}`));
  const byDimension = {}, byReason = {}, byAction = {};
  for (const e of pending) {
    byDimension[e.dimension] = (byDimension[e.dimension] || 0) + 1;
    byReason[e.reason] = (byReason[e.reason] || 0) + 1;
    byAction[e.action] = (byAction[e.action] || 0) + 1;
  }
  const topDimensions = Object.entries(byDimension)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([dimension, count]) => ({ dimension, count, pct: Math.round(count / pending.length * 100) }));

  return {
    total: pending.length,               // 未确认数
    confirmed: confirmed.length,         // 已确认数
    allReported: entries.length,         // 累计回报数（不含已确认）
    byDimension, byReason, byAction, topDimensions,
    // 确认率：已确认 / 累计回报
    confirmRate: entries.length > 0 ? Math.round(confirmed.length / entries.length * 100) / 100 : 0,
  };
}

/**
 * 阈值调整建议（有真实数据才给，否则明确说"数据不足"）。
 * @returns {{sufficient, message, suggestions: array}}
 */
function suggest() {
  const s = stats();
  if (s.total < 20) {
    return {
      sufficient: false,
      message: `误报样本仅 ${s.total} 条，低于 20 条阈值，不给建议。宁可没建议，不可给拍脑袋建议。`,
      suggestions: [],
    };
  }
  const suggestions = [];
  // 维度集中度：单一维度占比 > 25% → 该维度规则过宽
  for (const t of s.topDimensions) {
    if (t.pct >= 25) {
      suggestions.push({
        dimension: t.dimension,
        signal: 'concentration',
        confidence: Math.min(0.95, 0.5 + t.count / 50),
        recommendation: `${t.dimension} 占误报 ${t.pct}%，规则过宽。建议收窄模式：先跑 scripts/quotation-threshold-scan.js 同款扫描，用真实误报样本定位过宽模式。`,
      });
    }
  }
  // 原因集中度：某原因占比 > 30% → 系统性偏差
  const rTotal = s.total;
  for (const [reason, count] of Object.entries(s.byReason)) {
    const pct = Math.round(count / rTotal * 100);
    if (pct >= 30) {
      suggestions.push({
        dimension: '_reason',
        signal: reason,
        confidence: 0.8,
        recommendation: `${pct}% 误报源于「${reason}」，是系统性偏差而非单点过宽。${_reasonAdvice(reason)}`,
      });
    }
  }
  return {
    sufficient: true,
    message: `基于 ${s.total} 条误报`,
    suggestions,
  };
}

function _reasonAdvice(reason) {
  switch (reason) {
    case 'no_intent': return '考虑扩引述语境信号（src/quotation-context.js）覆盖误报句式。';
    case 'benign_usage': return '考虑给命中模式加共现限定（参考「玩具」需与指人共现）。';
    case 'wrong_language': return '考虑修归一化语言门控（参考 en2zh 的词级中文判据）。';
    case 'over_broad_rule': return '考虑直接用扫描法定位并收窄该模式。';
    default: return '';
  }
}

/** 运维确认一条误报（移入 confirmed 文件，供回归样本用） */
function confirm(p = {}) {
  const { text, dimension } = p;
  if (typeof text !== 'string' || text.trim() === '') {
    return { success: false, error: 'text 不能为空' };
  }
  const entries = _readLines(FP_FILE);
  const hit = entries.find(e => e.dimension === dimension
    && (e.fullText === text || e.textSample.includes(_summarize(text, 40))));
  if (!hit) {
    return { success: false, error: '未找到匹配的未确认误报记录' };
  }
  // 幂等：已在 confirmed 文件里的不再重复写入
  const already = _readLines(FP_CONFIRMED_FILE)
    .some(e => e.ts === hit.ts && e.dimension === dimension);
  if (already) {
    return { success: false, error: '该误报已确认过（幂等保护）', alreadyConfirmed: true };
  }
  _append(FP_CONFIRMED_FILE, { ...hit, confirmedTs: Date.now(), fullText: text.slice(0, 2000) });
  return { success: true, dimension, ts: hit.ts };
}

/** 清理（测试用） */
function clear() {
  for (const f of [FP_FILE, FP_CONFIRMED_FILE]) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
  return { success: true };
}

module.exports = { report, stats, suggest, confirm, clear, REASONS, FP_FILE };
