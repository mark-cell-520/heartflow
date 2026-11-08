'use strict';

/**
 * src/benchmark/benchmark-runner.js — Benchmark 基准测试运行器
 *
 * 为什么有这一轮（r252 实测）：`heartflow_benchmark_run` 这个 MCP 工具从接线起
 * 就是 100% 崩溃的——handler（src/mcp-server.js:2594）require 的
 * `src/benchmark/benchmark-runner.js` **在 git 全历史里从未存在过**
 * （`git log --diff-filter=D -- 'src/benchmark/*'` 空，目录本身不存在）。
 * 工具定义照常在 tools-registry.js:136 广告着「运行 benchmark 测试套件」。
 *
 * 数据包格式（JSONL，一行一条，与本仓 test/benchmark-runner.js 的
 * test_data/benchmarks/*.json 的 expected 形状保持一致）：
 *
 *   {"id":"core_001","category":"reasoning","input":"如果A比B大……",
 *    "expected":{"mustInclude":["A","C"],"minConfidence":0.3,"maxConfidence":1,
 *                "gateAction":"pass","expectError":false}}
 *
 * 判定纪律（诚实记账，宁可标 unjudged 也不假装测过）：
 *   · mustInclude 缺失 / 置信度越界 / gateAction 不符 → failed，并写清 reason
 *   · 声明了置信度上下界但引擎没给出可解析的置信度 → **unjudged**，
 *     不计入 passed 也不计入 failed（没有数字就不要打分）
 *   · JSON 解析失败的行 → malformed，逐行登记文件与行号，不静默丢弃；
 *     缺 input/prompt 字段的行照跑判定并记 failed（理由写清），不静默丢弃。
 */

const fs = require('fs');
const path = require('path');

/** 从 think() 结果里取可比较的文本（与 test/benchmark-runner.js 同口径） */
function extractOutputText(result) {
  if (!result || typeof result !== 'object') return String(result == null ? '' : result);
  if (typeof result.output === 'string') return result.output;
  if (result.output && typeof result.output.conclusion === 'string') return result.output.conclusion;
  if (result.output && typeof result.output.text === 'string') return result.output.text;
  if (result.output && typeof result.output.answer === 'string') return result.output.answer;
  if (result.error && typeof result.error === 'string') return result.error;
  return JSON.stringify(result.output === undefined ? result : result.output);
}

/** 置信度多路径取值；取不到返回 null（不默认中值） */
function extractConfidence(result) {
  if (!result || typeof result !== 'object') return null;
  const candidates = [
    result.confidence,
    result.calibration && result.calibration.confidence,
    result.calibration && result.calibration.score,
    result.output && result.output.meta && result.output.meta.confidence,
    result.synthesis && result.synthesis.confidence,
    result.decision && result.decision.confidence,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return null;
}

/** gate.action 多路径取值（think() 结果里通常没有 gate 字段） */
function extractGateAction(result) {
  if (!result || typeof result !== 'object') return null;
  const g = result.gate || (result._verification && result._verification.gate);
  return g && typeof g.action === 'string' ? g.action : null;
}

/**
 * 用心虫自己的硬闸门取 gate.action。
 * 为什么要单开一条路：hf.think() 的返回值里没有 gate 字段（实测 r.confidence
 * 与 r.gate 均为 undefined/null），所以 expected.gateAction 不能从 think()
 * 结果里读，必须走 src/gate.js 的 gate() 本体。取不到时返回 null（→ unjudged），
 * 不拿猜的 action 冒充判过的。
 */
function gateActionOf(text) {
  try {
    const g = require('../gate.js');
    const fn = g.gate || g.check;
    if (typeof fn !== 'function') return null;
    const r = fn(text);
    const action = r && r.gate && r.gate.action;
    return typeof action === 'string' ? action : null;
  } catch (_) {
    return null;
  }
}

/** 单条记录判定。返回 {status:'passed'|'failed'|'unjudged', reasons:[]} */
function judgeRecord(record, result) {
  const exp = record.expected || {};
  const reasons = [];
  if (exp.expectError === true) {
    const hasError = !!(result && (result.error || (result.output && result.output.suppressReason)));
    return hasError
      ? { status: 'passed', reasons: ['预期报错且确实报错'] }
      : { status: 'failed', reasons: ['预期报错但引擎正常返回'] };
  }

  const text = extractOutputText(result).toLowerCase();

  if (Array.isArray(exp.mustInclude) && exp.mustInclude.length) {
    const missing = exp.mustInclude.filter(k => !text.includes(String(k).toLowerCase()));
    if (missing.length) reasons.push(`缺少关键词: ${missing.join(',')}`);
  }
  if (Array.isArray(exp.mustNotInclude) && exp.mustNotInclude.length) {
    const present = exp.mustNotInclude.filter(k => text.includes(String(k).toLowerCase()));
    if (present.length) reasons.push(`出现禁用词: ${present.join(',')}`);
  }

  const conf = extractConfidence(result);
  const wantsConfidence = typeof exp.minConfidence === 'number' || typeof exp.maxConfidence === 'number';
  if (wantsConfidence && conf === null) {
    // 没有数字就不打分——这是 unjudged 而不是 failed
    reasons.push('引擎未给出可解析置信度，无法判定置信度条件');
    return { status: 'unjudged', reasons, confidence: null };
  }
  if (conf !== null) {
    if (typeof exp.minConfidence === 'number' && !(conf >= exp.minConfidence)) {
      reasons.push(`confidence ${conf} < ${exp.minConfidence}`);
    }
    if (typeof exp.maxConfidence === 'number' && !(conf <= exp.maxConfidence)) {
      reasons.push(`confidence ${conf} > ${exp.maxConfidence}`);
    }
  }

  if (typeof exp.gateAction === 'string') {
    // 先看 think() 结果里有没有；没有就走 gate() 本体（见 gateActionOf 注释）
    const fromResult = extractGateAction(result);
    const action = fromResult !== null ? fromResult : gateActionOf(record.input || '');
    if (action === null) {
      reasons.push(`要求 gate.action=${exp.gateAction} 但两条取法都拿不到 action`);
      return { status: 'unjudged', reasons, confidence: conf };
    }
    if (action !== exp.gateAction) reasons.push(`gate.action=${action}，期望 ${exp.gateAction}`);
  }

  return { status: reasons.length ? 'failed' : 'passed', reasons, confidence: conf };
}

class BenchmarkRunner {
  /**
   * @param {Object} hf 引擎实例（需有 async think(input, depth, opts)）
   * @param {Object} [options] { depth = 2, timeoutMs = 30000 }
   */
  constructor(hf, options = {}) {
    this.hf = hf || null;
    this.options = options || {};
    this.depth = typeof this.options.depth === 'number' ? this.options.depth : 2;
    /** category -> {category, file, records:[]} */
    this.packs = {};
    /** 文件级坏行留痕（file + line + reason），按行计一次，不按 pack 重复计 */
    this.malformedLines = [];
    this.lastRun = null;
    this.failures = [];
  }

  /** 加载单个 JSONL / JSON 文件到 this.packs */
  loadFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const base = path.basename(filePath).replace(/\.[^.]+$/, '');
    const lines = raw.split('\n');
    const records = [];
    const malformed = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let obj = null;
      try {
        obj = JSON.parse(trimmed);
      } catch (_) {
        malformed.push({ line: idx + 1, reason: 'JSON 解析失败', preview: trimmed.slice(0, 80) });
        return;
      }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        malformed.push({ line: idx + 1, reason: '不是对象', preview: trimmed.slice(0, 80) });
        return;
      }
      // 兼容 {scenarios:[...]} 的整包 JSON
      if (Array.isArray(obj.scenarios)) {
        for (const sc of obj.scenarios) records.push(this._normalize(sc, base));
        return;
      }
      records.push(this._normalize(obj, base));
    });

    const byCategory = new Map();
    for (const rec of records) {
      if (!byCategory.has(rec.category)) byCategory.set(rec.category, []);
      byCategory.get(rec.category).push(rec);
    }
    for (const [category, recs] of byCategory) {
      if (!this.packs[category]) {
        this.packs[category] = { category, file: path.basename(filePath), records: [] };
      }
      this.packs[category].records.push(...recs);
    }
    // 坏行只在这一处登记一次（首版按 pack 重复 push，一个坏行被 4 个 pack
    // 各计一遍，summary 的 malformed 虚高 4 倍）
    for (const m of malformed) this.malformedLines.push(Object.assign({ file: path.basename(filePath) }, m));

    return { file: filePath, records: records.length, malformed: malformed.length };
  }

  /** 规整单条记录；input/prompt 都缺时置 null，由 runAll 记 failed 并写清理由 */
  _normalize(obj, fallbackCategory) {
    const input = typeof obj.input === 'string' ? obj.input
      : (typeof obj.prompt === 'string' ? obj.prompt : null);
    return {
      id: obj.id != null ? String(obj.id) : `${fallbackCategory}#${Math.random().toString(36).slice(2, 8)}`,
      category: typeof obj.category === 'string' && obj.category ? obj.category : fallbackCategory,
      input,
      expected: (obj.expected && typeof obj.expected === 'object') ? obj.expected : {},
      raw: obj,
    };
  }

  /** 加载目录下全部 .jsonl（.json 整包也收） */
  loadDirectory(dataDir) {
    const stat = fs.statSync(dataDir);
    const files = stat.isDirectory()
      ? fs.readdirSync(dataDir).filter(f => /\.(jsonl|json)$/i.test(f)).sort().map(f => path.join(dataDir, f))
      : [dataDir];
    const loaded = [];
    for (const f of files) {
      try {
        loaded.push(this.loadFile(f));
      } catch (e) {
        loaded.push({ file: f, records: 0, malformed: 0, error: e.message });
      }
    }
    return loaded;
  }

  /** 全部记录（拍平） */
  allRecords() {
    const out = [];
    for (const pack of Object.values(this.packs)) out.push(...pack.records);
    return out;
  }

  /**
   * 跑全部数据包。
   * @param {Object} [opts] { threshold = 0.5, pushFailures = true }
   */
  async runAll(opts = {}) {
    const threshold = typeof opts.threshold === 'number' ? opts.threshold : 0.5;
    const pushFailures = opts.pushFailures !== false;

    if (!this.hf || typeof this.hf.think !== 'function') {
      return { error: '引擎未提供 think()，无法运行 benchmark', threshold, timestamp: Date.now() };
    }

    const records = this.allRecords();
    const perCategory = {};
    const items = [];
    this.failures = [];

    for (const rec of records) {
      const bucket = perCategory[rec.category] = perCategory[rec.category] || {
        category: rec.category, total: 0, passed: 0, failed: 0, unjudged: 0,
      };
      if (rec.input === null) {
        bucket.total++;
        bucket.failed++;
        items.push({ id: rec.id, category: rec.category, status: 'failed', reasons: ['记录缺 input/prompt 字段'] });
        this.failures.push({ record: rec, reasons: ['记录缺 input/prompt 字段'] });
        continue;
      }
      bucket.total++;
      let result = null;
      let thrown = null;
      try {
        result = await this.hf.think(rec.input, this.depth, {});
      } catch (e) {
        thrown = e;
      }
      const verdict = thrown
        ? { status: 'failed', reasons: [`think() 抛错: ${thrown.message}`], confidence: null }
        : judgeRecord(rec, result);
      bucket[verdict.status]++;
      items.push({
        id: rec.id, category: rec.category, status: verdict.status,
        reasons: verdict.reasons, confidence: verdict.confidence,
        outputPreview: extractOutputText(result).slice(0, 160),
      });
      if (verdict.status === 'failed') {
        this.failures.push({ record: rec, reasons: verdict.reasons, result });
      }
    }

    const categories = Object.values(perCategory).map(c => {
      const judged = c.passed + c.failed;
      return Object.assign(c, {
        accuracy: judged ? c.passed / judged : null,
        pass: c.total > 0 && c.failed === 0 && c.unjudged === 0,
        meetsThreshold: judged ? (c.passed / judged) >= threshold : null,
      });
    });

    const totalPassed = categories.reduce((s, c) => s + c.passed, 0);
    const totalFailed = categories.reduce((s, c) => s + c.failed, 0);
    const totalUnjudged = categories.reduce((s, c) => s + c.unjudged, 0);
    const judgedTotal = totalPassed + totalFailed;
    const malformedTotal = this.malformedLines.length;

    const summary = {
      threshold,
      packs: Object.keys(this.packs).length,
      records: records.length,
      malformed: malformedTotal,
      passed: totalPassed,
      failed: totalFailed,
      unjudged: totalUnjudged,
      accuracy: judgedTotal ? totalPassed / judgedTotal : null,
      meetsThreshold: judgedTotal ? (totalPassed / judgedTotal) >= threshold : null,
      categories,
      timestamp: Date.now(),
    };
    this.lastRun = summary;

    if (pushFailures) {
      summary.pushedToRL = await this.flushFailuresToRL();
    }
    return summary;
  }

  /**
   * 把失败案例推进自愈 RL（experience-collector + self-healing）。
   * 子系统缺席时如实登记，不编造导入数。
   */
  async flushFailuresToRL() {
    const sinks = this._resolveSinks();
    let pushed = 0;
    const errors = [];

    for (const failure of this.failures) {
      const task = failure.record.input || failure.record.id;
      const errorText = (failure.reasons || []).join('; ');
      let ok = false;
      if (sinks.experienceCollector && typeof sinks.experienceCollector.recordFailure === 'function') {
        try {
          sinks.experienceCollector.recordFailure(
            task,
            { category: failure.record.category, id: failure.record.id, source: 'benchmark' },
            failure.result || null,
            errorText,
            ['benchmark_failure']
          );
          ok = true;
        } catch (e) { errors.push(`experienceCollector.recordFailure: ${e.message}`); }
      }
      if (sinks.selfHealing && typeof sinks.selfHealing.record === 'function') {
        try {
          sinks.selfHealing.record({
            type: 'benchmark_failure',
            task,
            error: errorText,
            severity: 0.5,
            category: failure.record.category,
            source: 'benchmark-runner',
          }, null);
          ok = true;
        } catch (e) { errors.push(`selfHealing.record: ${e.message}`); }
      }
      if (ok) pushed++;
    }

    return {
      failures: this.failures.length,
      pushed,
      sinks: {
        experienceCollector: sinks.experienceCollector ? 'ready' : 'unavailable',
        selfHealing: sinks.selfHealing ? 'ready' : 'unavailable',
      },
      experienceCollectorCreatedHere: sinks.createdCollector,
      errors,
    };
  }

  /** 解析 RL 出口；experienceCollector 缺席时按引擎同参构造（留痕 createdHere） */
  _resolveSinks() {
    const hf = this.hf || {};
    let experienceCollector = hf.experienceCollector || null;
    let createdCollector = false;
    if (!experienceCollector) {
      try {
        const EC = require('../cortex/experience-collector.js').ExperienceCollector;
        experienceCollector = new EC({
          storagePath: path.join(hf.rootPath || process.cwd(), 'data', 'experiences'),
        });
        if (hf.experienceCollector === undefined) hf.experienceCollector = experienceCollector;
        createdCollector = true;
      } catch (_) {
        experienceCollector = null;
      }
    }
    return { experienceCollector, selfHealing: hf.selfHealing || null, createdCollector };
  }

  /** 供 benchmark_status 之类只想知道「有什么」的调用方 */
  getSummary() {
    return {
      packs: Object.keys(this.packs).length,
      records: this.allRecords().length,
      malformed: this.malformedLines.length,
      categories: Object.values(this.packs).map(p => ({
        category: p.category, file: p.file, records: p.records.length,
      })),
      lastRun: this.lastRun,
    };
  }
}

module.exports = { BenchmarkRunner, extractOutputText, extractConfidence, judgeRecord };
