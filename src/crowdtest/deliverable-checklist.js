'use strict';
/**
 * deliverable-checklist.js — 交付物完整性核对
 *
 * 与 acceptance-checker 的分工：
 *   acceptance-checker 判「答案结构 + 形式」（六区块、四要素、弱动词、模糊词）
 *   本模块判「题目要求的交付项在不在」（逐题清单式）
 *
 * 用法：
 *   const cl = require('./deliverable-checklist.js');
 *   const r = cl.check(answer, {
 *     required: ['sitemap.xml', 'robots.txt', '404.html'],   // 必须出现
 *     anyOf: [['git diff', 'diff'], ['构建命令', 'npm run build']],
 *     requiredCounts: { 'sitemap': 1 },
 *   });
 */

function has(text, kw) { return String(text || '').includes(kw); }

function check(answer, spec = {}) {
  const text = String(answer == null ? '' : answer);
  const required = spec.required || [];
  const anyOf = spec.anyOf || [];
  const requiredCounts = spec.requiredCounts || {};

  const findings = [];
  const rows = [];

  for (const kw of required) {
    const ok = has(text, kw);
    rows.push({ item: `必交「${kw}」`, ok });
    if (!ok) findings.push(`缺少交付项：${kw}`);
  }

  for (const group of anyOf) {
    const alts = Array.isArray(group) ? group : [group];
    const hit = alts.find(k => has(text, k));
    rows.push({ item: `需含其一：${alts.join(' / ')}`, ok: !!hit });
    if (!hit) findings.push(`以下交付项一个都没出现：${alts.join(' / ')}`);
  }

  for (const [name, n] of Object.entries(requiredCounts)) {
    const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const c = (text.match(re) || []).length;
    rows.push({ item: `「${name}」出现 ≥${n} 次`, ok: c >= n });
    if (c < n) findings.push(`「${name}」仅出现 ${c} 次，需 ≥${n}`);
  }

  const passed = rows.filter(r => r.ok).length;
  return {
    pass: findings.length === 0,
    score: passed,
    maxScore: rows.length,
    scorePct: rows.length ? Math.round(passed / rows.length * 100) : 0,
    rows,
    findings
  };
}

module.exports = { check };
