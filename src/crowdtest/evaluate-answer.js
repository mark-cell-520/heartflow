'use strict';
/**
 * evaluate-answer.js — 众测题判分总入口（心虫三层分工的落地）
 *
 * 分工（不可合并成一个总分）：
 *   Layer 1 形式分   acceptance-checker.js  六区块结构、四要素、弱动词、模糊词、自检自洽
 *   Layer 2 合规兜底 gate.js checkOutput     绝对化承诺、去人化、伪深刻等红线
 *   Layer 3 数字幻觉 numeric-whitelist.js   材料外数字（白名单仅作触发，不作合格证明）
 *   人工/LLM 陪审    语义正确性 —— 归因方向对不对、方案好不好、话术行不行
 *
 * 输出：JSON。形式分与 gate 分数分列，绝不合并。
 */

const acceptance = require('./acceptance-checker.js');
const whitelist  = require('./numeric-whitelist.js');
const checklist  = require('./deliverable-checklist.js');

let gate = null;
try { gate = require('../gate.js'); } catch (e) { /* gate 不可用时降级，不影响形式分 */ }

/**
 * @param {string} answer
 * @param {object} task 扁平契约（MCP handler 与 CLI 共用）：
 *   task.materials        string[]  允许数字来源的材料文本（建白名单）
 *   task.materialIds      string[]  合法材料编号（校验引用编号）
 *   task.requiredDeliverables string[] 必须出现的交付物关键词
 *   task.requiredCounts   object    交付物出现次数下限
 *   task.minCitations     number    【依据】最少引用条数
 *   task.runGate          boolean   是否跑 gate 兜底，默认 true
 */
function evaluate(answer, task = {}) {
  const text = String(answer == null ? '' : answer);

  // ---- Layer 1 形式分 ----
  const acceptanceOpts = {};
  if (task.minCitations) acceptanceOpts.minCitations = task.minCitations;
  if (Array.isArray(task.materialIds) && task.materialIds.length) acceptanceOpts.materialIds = task.materialIds;
  const formal = acceptance.check(text, acceptanceOpts);

  // ---- Layer 2 数字幻觉 ----
  const hasMaterials = Array.isArray(task.materials) && task.materials.length > 0;
  const wl = hasMaterials ? whitelist.build(task.materials) : null;
  const numeric = wl
    ? whitelist.check(text, wl.whitelistSet)
    : { ok: true, outsideNumbers: [], matched: 0, skipped: '未提供材料文本，跳过数字白名单' };

  // ---- Layer 3 交付清单 ----
  const checklistSpec = (Array.isArray(task.requiredDeliverables) && task.requiredDeliverables.length)
    || task.requiredCounts
    ? {
        required: task.requiredDeliverables || [],
        requiredCounts: task.requiredCounts || {}
      }
    : null;
  const deliverable = checklistSpec
    ? checklist.check(text, checklistSpec)
    : { pass: true, score: 0, maxScore: 0, findings: [], skipped: '无交付清单' };

  // ---- gate 合规兜底（红线，不作评分）----
  let gateResult = { action: 'skipped', overallScore: null, findings: [], error: null };
  if (task.runGate !== false && gate && typeof gate.checkOutput === 'function') {
    try {
      const g = gate.checkOutput(text);
      gateResult = {
        action: g.gate.action,
        overallScore: g.overallScore,
        findings: (g.findings || []).map(f => ({ dimension: f.dimension, severity: f.severity, details: f.details }))
      };
    } catch (e) { gateResult = { action: 'error', overallScore: null, findings: [], error: e.message }; }
  }

  // ---- 汇总：硬失败项逐条列，禁止合并单一总分 ----
  const hardFail = [];
  if (!formal.pass) hardFail.push(`形式分未过 ${formal.score}/${formal.maxScore}`);
  if (!numeric.ok) hardFail.push(`材料外数字 ${numeric.outsideNumbers.length} 处（疑似幻觉）`);
  if (!deliverable.pass) hardFail.push(`交付物缺失：${deliverable.findings.filter(f => !f.startsWith('齐备')).join('；')}`);
  if (['block', 'rewrite'].includes(gateResult.action)) hardFail.push(`gate 合规红线 ${gateResult.action}`);

  return {
    verdict: hardFail.length === 0 ? 'PASS(形式层)' : 'FAIL',
    formalScore: { got: formal.score, max: formal.maxScore, pct: formal.scorePct },
    formalChecks: (formal.checks || []).map(c => `[${c.ok ? 'PASS' : 'FAIL'}] ${c.label}${c.ok ? '' : ' → ' + c.detail}`),
    numericCheck: {
      ok: numeric.ok,
      matchedExternal: numeric.matched,
      skippedCount: numeric.skippedCount || 0,
      outsideNumbers: (numeric.outsideNumbers || []).map(x => `${x.value}｜${x.context}`),
      ...(numeric.skipped ? { skipped: numeric.skipped } : {})
    },
    deliverableCheck: deliverable.skipped ? { skipped: deliverable.skipped }
      : { pass: deliverable.pass, findings: deliverable.findings },
    gateRedline: gateResult,
    hardFail: hardFail,
    needsHumanReview: {
      semantic: '归因方向/方案优劣/话术效果——心虫判不了，必须人工或 LLM 陪审',
      gateFalsePositive: 'gate findings 可能含术语误报（见 PROMPT模板.md 术语规避表），需人工确认是否真问题'
    },
    note: '形式分与 gate 分数分列，不可相加；verdict 仅代表形式层+红线是否过，不代表内容质量',
    detail: {
      formalChecks: formal.checks,
      blocks: Object.fromEntries(Object.entries(formal.blocks || {}).map(([k, v]) => [k, (v || '').length])),
      deliverableRows: deliverable.rows || []
    }
  };
}

module.exports = { evaluate };

// CLI：node evaluate-answer.js <answerFile> [taskJsonFile]
if (require.main === module) {
  const fs = require('fs');
  const [answerFile, taskFile] = process.argv.slice(2);
  if (!answerFile) { console.error('usage: node evaluate-answer.js <answerFile> [taskJson]'); process.exit(2); }
  const text = fs.readFileSync(answerFile, 'utf8');
  const task = taskFile ? JSON.parse(fs.readFileSync(taskFile, 'utf8')) : {};
  console.log(JSON.stringify(evaluate(text, task), null, 2));
}
