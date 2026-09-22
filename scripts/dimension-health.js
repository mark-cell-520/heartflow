#!/usr/bin/env node
/**
 * scripts/dimension-health.js — 判别维度健康度面板（v6.7.75，心虫 decision.decide 0.94）
 *
 * 来源：第 21 轮决策前量化——203 个基准样本只命中 21/49 个维度。
 * 60% 的维度从未被任何基准验证，双向门禁的维度级判定对它们无效。
 *
 * 面板用**两个口径**判健康度（第一版只用口径一，误报 22 个 BROKEN）：
 *   口径一 hits   — 在基准样本上的命中数（反映"被测过的程度"）
 *   口径二 probe  — 用**模式库自身首条正则**反推的测试文本直接调 checkXxx
 *                   （反映"维度函数本身是否活着"）
 *
 * 为什么必须用口径二：手写探针句式不可靠——实测「你态度好一点」不命中
 * tonePolicing，而模式库真实模式是「你态度不对」。手写探针会大量误报 BROKEN。
 * 改为从模式库提取首条正则的 source，直接用 RegExp 生成测试串。
 *
 * status 综合判定：
 *   healthy  (hits ≥ 3)   基准已充分验证
 *   thin     (1-2 hits)   基准覆盖脆弱
 *   UNTESTED (probe ✓)    维度活着但基准未覆盖 → 补样本
 *   BROKEN   (probe ✗)    维度函数连自身模式都不命中 → 需修引擎
 *
 * 用法：
 *   node scripts/dimension-health.js          # 面板
 *   node scripts/dimension-health.js --json   # 机器可读
 */
'use strict';
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const IDX = path.join(ROOT, 'src/index.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(IDX);
const src = fs.readFileSync(IDX, 'utf8');

/** snake/camel → 常量名候选 */
function constNameCandidates(dim) {
  const snake = dim.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
  const cands = [`${snake}_PATTERNS`, `${snake}_ZH`, `${snake}_EN`];
  // [v6.7.75] 维度名单复数 ≠ 常量名单数：fallacies → FALLACY_PATTERNS
  // （维度名是复数集合，常量名是单数）。实测 fallacies patterns 恒为 1 的根因。
  const ALIAS = { FALLACIES: 'FALLACY', WHATABOUTISMS: 'WHATABOUTISM' };
  const base = snake.replace(/S$/, '');
  if (ALIAS[snake]) cands.unshift(`${ALIAS[snake]}_PATTERNS`);
  else if (snake.endsWith('S')) cands.push(`${base}_PATTERNS`);
  return cands;
}

/**
 * 从源码提取某常量的完整定义体（括号配对，不用 `\n};` 收尾）。
 *
 * 为什么不能用 `[\s\S]*?\n\};`：非贪婪会在**内部第一个** `\n};` 停下。
 * 实测 FALLACY_PATTERNS 有 148 条正则（体长 15251），内部含嵌套对象，
 * 旧正则只取到第 1 条 → 误判 patterns=1 → 探针无样本 → BROKEN。
 */
function extractConstBody(name) {
  const start = src.indexOf(`const ${name}`);
  if (start < 0) return null;
  // 找到第一个 { 或 [
  const braceStart = src.indexOf('{', start) >= 0 && (src.indexOf('{', start) < src.indexOf('[', start) || src.indexOf('[', start) < 0)
    ? src.indexOf('{', start) : src.indexOf('[', start);
  if (braceStart < 0) return null;
  const open = src[braceStart];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    const ch = src[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return src.slice(braceStart, i + 1);
    }
  }
  return null;
}

/** 从源码提取某维度的模式条目数（正则/字符串计数） */
function countPatterns(dim) {
  for (const c of constNameCandidates(dim)) {
    const body = extractConstBody(c);
    if (body) {
      const regexes = (body.match(/\/[^/\n]+\/[gimsuy]*/g) || []).length;
      const strings = (body.match(/'[^']+'/g) || []).length;
      if (regexes + strings > 0) return Math.max(regexes, strings);
    }
  }
  // 内联模式：在 checkXxx 函数体内数正则
  // [v6.7.75] 函数体上限从 3000 提到 20000——很多 checkXxx 超过 3000 字符，
  // 截断后只数到 1 条正则，被误判 patterns=1 → probe 无样本 → BROKEN。
  const fnBody = extractFnBody(dim);
  if (fnBody) {
    const regexes = (fnBody.match(/\/[^/\n]+\/[gimsuy]*/g) || []).length;
    if (regexes > 0) return regexes;
  }
  return null;
}

/** 提取 checkXxx 函数体（括号配对） */
function extractFnBody(dim) {
  const start = src.indexOf(`function check${dim.charAt(0).toUpperCase()}${dim.slice(1)}(`);
  if (start < 0) return null;
  const braceStart = src.indexOf('{', start);
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(braceStart, i + 1);
    }
  }
  return null;
}

/**
 * 口径二：从模式库**首条正则**生成测试文本。
 *
 * 做法：取首条正则 source，去掉元字符与字符类，取剩余的字面量。
 * 这比手写探针可靠——用的是模式自己期望匹配的东西。
 */
function probeFromPattern(dim) {
  for (const c of constNameCandidates(dim)) {
    const body = extractConstBody(c);
    if (body) return regexesToTexts(body.match(/\/[^/\n]+\/[gimsuy]*/g) || []);
  }
  const fnBody = extractFnBody(dim);
  if (fnBody) return regexesToTexts(fnBody.match(/\/[^/\n]+\/[gimsuy]*/g) || []);
  return [];
}

/** 正则 source → 字面量测试文本 */
function regexesToTexts(regexes) {
  const texts = [];
  // [v6.7.75] 从"前 8 条"改为"全量"——实测 stereotype/sealioning/dogwhistle
  // 的命中模式排在第 6+ 位，只测前 8 条会漏（前 8 条全是概括类不命中）。
  // 面板的目的是判死活，不是性能测试，宁可多跑。
  for (const r of regexes) {
    const inner = r.replace(/^\//, '').replace(/\/[gimsuy]*$/, '');
    const lit = inner
      .replace(/\\[bBsSdDwW]/g, '')
      .replace(/\(\?:[^)]*\)/g, '|')
      .replace(/\([^)]*\)/g, '|')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/[\\^$.*+?{}|]/g, ' ')
      .trim();
    if (lit.length >= 2) texts.push(lit.slice(0, 30));
  }
  return texts;
}

/** 检查维度是否有 checkXxx 函数 */
function checkFnName(dim) {
  const fnName = 'check' + dim.charAt(0).toUpperCase() + dim.slice(1);
  return typeof idx[fnName] === 'function' ? fnName : null;
}

/** 收集全部基准样本 */
function collectSamples() {
  const samples = [];
  const push = mod => {
    try {
      const m = require(path.join(ROOT, 'test', mod));
      const src0 = m.SAMPLES;
      if (src0 && typeof src0 === 'object' && !Array.isArray(src0)) {
        for (const list of Object.values(src0)) {
          for (const s of (Array.isArray(list) ? list : [])) {
            const t = typeof s === 'string' ? s : s && s.text;
            if (t) samples.push(t);
          }
        }
      } else if (Array.isArray(src0)) {
        for (const s of src0) { const t = typeof s === 'string' ? s : s && s.text; if (t) samples.push(t); }
      } else if (m.CATEGORIES) {
        for (const list of Object.values(m.CATEGORIES)) for (const t of list) samples.push(t);
      }
    } catch (_) {}
  };
  push('gate-benchmark.js');
  push('gate-benchmark-extended.js');
  push('vertical-benign-benchmark.js');
  push('benign-mixed-benchmark.js');
  return samples;
}

function main() {
  const NON_DIM = new Set(['Input', 'Output', 'Evidence', 'AICodeAntiPattern', 'ForbiddenCall', 'CompletionEvidence', 'NoFallback', 'Reversibility', 'ArchitectureConsistency', 'DecisionTrace', 'CoverageCompleteness']);
  const dims = Object.keys(idx)
    .filter(k => /^check[A-Z]/.test(k) && typeof idx[k] === 'function')
    .map(k => k.slice(5).replace(/^[A-Z]/, c => c.toLowerCase()))
    .filter(d => !NON_DIM.has(d.charAt(0).toUpperCase() + d.slice(1)))
    .sort();

  const samples = collectSamples();
  const hits = {};
  for (const t of samples) {
    try {
      const r = gate.gate(t);
      for (const tr of (r.trace || [])) {
        if (tr.dimension && tr.dimension !== '_normalization') hits[tr.dimension] = (hits[tr.dimension] || 0) + 1;
      }
    } catch (_) {}
  }

  const norm = s => String(s).replace(/_/g, '').toLowerCase();
  const hitsNorm = {};
  for (const [k, v] of Object.entries(hits)) hitsNorm[norm(k)] = v;

  const rows = [];
  for (const d of dims) {
    const n = hitsNorm[norm(d)] || 0;
    const pats = countPatterns(d);
    const fn = checkFnName(d);
    // 口径二：用模式库自身首条反推的文本探测
    let probe = null;
    if (fn) {
      const texts = probeFromPattern(d);
      if (texts.length > 0) {
        try {
          probe = texts.some(t0 => {
            const r = idx[fn](t0);
            const c = r && (typeof r.count === 'number' ? r.count
              : (typeof r.totalHits === 'number' ? r.totalHits : 0));
            return c > 0;
          });
        } catch (_) { probe = null; }
      }
    }
    rows.push({
      dimension: d,
      patterns: pats,
      checkFn: fn,
      hits: n,
      probe,
      // status 判定（诚实优先）：
      //   healthy  (hits ≥ 3)      基准已充分验证
      //   thin     (1-2 hits)      基准覆盖脆弱
      //   UNTESTED (probe true)    维度活着但基准未覆盖 → 补样本
      //   BROKEN   (probe false)   模式库自身反推的文本也不命中 → 真可疑
      //   UNKNOWN  (probe null)    面板**无法判定**（模式常量名与维度名对不上，
      //                              或模式全内联且字面量提取失败）。
      //                              不冒充 BROKEN——没证据说它失效。
      status: n >= 3 ? 'healthy' : (n >= 1 ? 'thin'
        : (probe === true ? 'UNTESTED' : (probe === false ? 'BROKEN' : 'UNKNOWN'))),
    });
  }

  const byStatus = s => rows.filter(r => r.status === s);
  const healthy = byStatus('healthy'), thin = byStatus('thin');
  const untested = byStatus('UNTESTED'), broken = byStatus('BROKEN');
  const unknown = byStatus('UNKNOWN');

  console.log('══════════════════════════════════════════════════════════════');
  console.log('🧬 判别维度健康度面板（双口径：基准命中 + 模式自探测）');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`导出 check 函数维度: ${rows.length} | 基准样本: ${samples.length}`);
  console.log(`  healthy  (基准 ≥3 hits)  : ${healthy.length}`);
  console.log(`  thin     (基准 1-2 hits) : ${thin.length}`);
  console.log(`  UNTESTED (探针活着但基准未覆盖): ${untested.length}  ← 补样本即可`);
  console.log(`  BROKEN   (探针也不命中)  : ${broken.length}  ← 真可疑，需查`);
  console.log(`  UNKNOWN  (面板无法判定)  : ${unknown.length}  ← 口径限制，不冒充结论`);

  const show = (label, list) => {
    if (list.length === 0) return;
    console.log(`\n【${label}】${list.length} 个`);
    for (const r of list) {
      const p = r.patterns === null ? '内联' : `${r.patterns}模式`;
      const f = r.checkFn ? '' : ' ⚠️无check函数';
      console.log(`  ${r.dimension.padEnd(26)} hits:${String(r.hits).padEnd(4)} ${p}${f}`);
    }
  };

  show('healthy — 已被基准充分验证', healthy);
  show('thin — 仅在 1-2 个样本上命中（脆弱）', thin);
  show('UNTESTED — 维度活着但基准没覆盖（补样本）', untested);
  show('BROKEN — 探针不命中（真可疑，需逐个查证）', broken);
  show('UNKNOWN — 面板无法判定（模式常量名不匹配/全内联）', unknown);

  const pct = Math.round(healthy.length / rows.length * 100);
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`基准覆盖率: ${healthy.length}/${rows.length} = ${pct}%`);
  console.log(`需补样本: ${untested.length} 个 | 需修引擎: ${broken.length} 个`);
  console.log('══════════════════════════════════════════════════════════════');

  if (process.argv.includes('--json')) {
    // 哨兵包裹：被 require 的基准文件会打印自身报告，哨兵让调用方能定位 JSON 边界
    console.log('<<<DIM_HEALTH_JSON_START>>>');
    console.log(JSON.stringify({
      total: rows.length, samples: samples.length,
      healthy: healthy.length, thin: thin.length,
      untested: untested.length, broken: broken.length, unknown: unknown.length, rows,
    }));
    console.log('<<<DIM_HEALTH_JSON_END>>>');
  }
}

main();
