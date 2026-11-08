'use strict';

/**
 * src/benchmark/failure-importer.js — 失败案例导入器（自愈 RL 训练数据入口）
 *
 * 为什么有这一轮（r252 实测）：`heartflow_benchmark_import_failures` 这个 MCP
 * 工具从接线起就是 100% 崩溃的——handler（src/mcp-server.js:2700）require 的
 * `src/benchmark/failure-importer.js` **在 git 全历史里从未存在过**
 * （`git log --diff-filter=D -- 'src/benchmark/*'` 空）。工具定义照常在
 * tools-registry.js:142 广告着「导入失败案例 JSONL 到自愈 RL」。
 *
 * 输入宽容（三种都收，并登记 parsedFrom）：
 *   1. JSONL：一行一个案例对象
 *   2. JSON 整包：{"failure_cases": [...]}
 *   3. JSON 裸数组：[{...}, {...}]
 *
 * 单条案例字段（全部可选，缺什么登记什么，不编）：
 *   {id, input|task|prompt, error|message, expected, actual, category, lessons}
 *
 * 导出纪律：
 *   · 推入 experience-collector 的 recordFailure() 与 self-healing 的 record()
 *   · 两个出口都缺席时 imported=0 且 sinks 全标 unavailable——**不拿「我读了文件」
 *     冒充「我导进了 RL」**
 *   · 重复案例（同 input+error 指纹）跳过并计数，不反复灌同一条
 */

const fs = require('fs');
const path = require('path');

/** 案例输入文本多路径取值 */
function caseInput(c) {
  for (const k of ['input', 'task', 'prompt', 'query', 'text']) {
    if (typeof c[k] === 'string' && c[k].trim()) return c[k];
  }
  return null;
}

/** 案例错误文本多路径取值 */
function caseError(c) {
  for (const k of ['error', 'message', 'reason', 'failure']) {
    if (typeof c[k] === 'string' && c[k].trim()) return c[k];
  }
  if (Array.isArray(c.reasons)) return c.reasons.join('; ');
  return null;
}

/** 案例分类 */
function caseCategory(c, fallback) {
  if (typeof c.category === 'string' && c.category) return c.category;
  if (typeof c.type === 'string' && c.type) return c.type;
  return fallback;
}

class FailureCaseImporter {
  /**
   * @param {Object} hf 引擎实例
   * @param {Object} [options] { autoRetrain = false }
   */
  constructor(hf, options = {}) {
    this.hf = hf || null;
    this.options = options || {};
    /** 已导入指纹 -> true，防重复灌同一条 */
    this._imported = new Set();
    this.lastReport = null;
  }

  /** 指纹：输入 + 错误（同输入不同错误是两条，同输入同错误才是重复） */
  _fingerprint(input, error) {
    return `${String(input).slice(0, 200)}${String(error).slice(0, 200)}`;
  }

  /**
   * 从文件读案例数组，兼容 JSONL / JSON 整包 / JSON 裸数组 / 单对象。
   *
   * 顺序很关键（r252 实测踩过）：**必须先试整包 JSON 再试 JSONL**。反过来
   * （首版）会让单行的 {"failure_cases":[...]} 被 JSONL 分支当成「一个普通
   * 案例对象」收下，parsedFrom 报 jsonl、cases 里装的是包装壳而不是案例，
   * 下游全部拿不到 input 字段。多行 JSONL 的整包文本不是合法 JSON，
   * JSON.parse 会先失败并自然落到逐行分支，不会误判。
   */
  readCases(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const trimmed = raw.trim();
    if (!trimmed) return { cases: [], parsedFrom: 'empty', malformed: [] };

    try {
      const whole = JSON.parse(trimmed);
      if (Array.isArray(whole)) return { cases: whole, parsedFrom: 'json-array', malformed: [] };
      if (whole && typeof whole === 'object') {
        if (Array.isArray(whole.failure_cases)) {
          return { cases: whole.failure_cases, parsedFrom: 'json-failure_cases', malformed: [] };
        }
        return { cases: [whole], parsedFrom: 'json-object', malformed: [] };
      }
    } catch (_) { /* 不是单个 JSON 值，落到底下逐行 JSONL */ }

    const lines = trimmed.split('\n');
    const cases = [];
    const malformed = [];
    let jsonlOk = lines.length > 0;
    lines.forEach((line, idx) => {
      const t = line.trim();
      if (!t) return;
      try {
        const obj = JSON.parse(t);
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) cases.push(obj);
        else { jsonlOk = false; }
      } catch (_) {
        jsonlOk = false;
      }
    });

    if (jsonlOk && cases.length) {
      return { cases, parsedFrom: 'jsonl', malformed };
    }

    return { cases: [], parsedFrom: 'unrecognized', malformed: [{ reason: '既不是 JSONL 也不是可识别 JSON 结构', preview: trimmed.slice(0, 120) }] };
  }

  /**
   * 从文件导入失败案例到自愈 RL。
   * @param {string} filePath
   * @param {Object} [opts] { autoRetrain = false }
   */
  async importFromFile(filePath, opts = {}) {
    const autoRetrain = !!(opts.autoRetrain || this.options.autoRetrain);
    const startedAt = Date.now();
    let read;
    try {
      read = this.readCases(filePath);
    } catch (e) {
      return { error: `读取失败: ${e.message}`, filePath, imported: 0, timestamp: startedAt };
    }
    const report = await this.importCases(read.cases, {
      autoRetrain,
      source: filePath,
      parsedFrom: read.parsedFrom,
      malformed: read.malformed,
    });
    report.filePath = filePath;
    this.lastReport = report;
    return report;
  }

  /**
   * 导入一批案例（不经过文件，供 benchmark-runner 复用）。
   */
  async importCases(cases, opts = {}) {
    const autoRetrain = !!opts.autoRetrain;
    const sinks = this._resolveSinks();
    const report = {
      total: Array.isArray(cases) ? cases.length : 0,
      imported: 0,
      duplicates: 0,
      skipped: [],
      parsedFrom: opts.parsedFrom || 'array',
      malformed: opts.malformed || [],
      sinks: {
        experienceCollector: sinks.experienceCollector ? 'ready' : 'unavailable',
        selfHealing: sinks.selfHealing ? 'ready' : 'unavailable',
      },
      experienceCollectorCreatedHere: sinks.createdCollector,
      errors: [],
      autoRetrain,
      retrain: null,
      timestamp: Date.now(),
    };

    if (!Array.isArray(cases) || !cases.length) {
      report.note = '没有可导入的案例';
      return report;
    }
    if (!sinks.experienceCollector && !sinks.selfHealing) {
      report.note = '自愈 RL 出口全部缺席：已读取但未导入（不拿读取数冒充导入数）';
      return report;
    }

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      if (!c || typeof c !== 'object') {
        report.skipped.push({ index: i, reason: '不是对象' });
        continue;
      }
      const input = caseInput(c);
      const error = caseError(c);
      if (input === null) {
        report.skipped.push({ index: i, id: c.id != null ? String(c.id) : null, reason: '缺 input/task/prompt 字段' });
        continue;
      }
      const fp = this._fingerprint(input, error);
      if (this._imported.has(fp)) {
        report.duplicates++;
        continue;
      }
      this._imported.add(fp);

      let ok = false;
      if (sinks.experienceCollector && typeof sinks.experienceCollector.recordFailure === 'function') {
        try {
          sinks.experienceCollector.recordFailure(
            input,
            {
              id: c.id != null ? String(c.id) : null,
              category: caseCategory(c, 'failure_case'),
              expected: c.expected != null ? c.expected : null,
              actual: c.actual != null ? c.actual : null,
              source: opts.source || 'failure-importer',
            },
            c.actual != null ? c.actual : null,
            error || '未提供错误描述',
            Array.isArray(c.lessons) ? c.lessons : ['imported_failure_case']
          );
          ok = true;
        } catch (e) {
          report.errors.push(`experienceCollector.recordFailure[${i}]: ${e.message}`);
        }
      }
      if (sinks.selfHealing && typeof sinks.selfHealing.record === 'function') {
        try {
          sinks.selfHealing.record({
            type: 'imported_failure_case',
            task: input,
            error: error || '未提供错误描述',
            severity: typeof c.severity === 'number' ? c.severity : 0.5,
            category: caseCategory(c, 'failure_case'),
            source: 'failure-importer',
          }, null);
          ok = true;
        } catch (e) {
          report.errors.push(`selfHealing.record[${i}]: ${e.message}`);
        }
      }
      if (ok) report.imported++;
      else report.skipped.push({ index: i, id: c.id != null ? String(c.id) : null, reason: '两个 RL 出口都写入失败' });
    }

    if (autoRetrain && report.imported > 0) {
      report.retrain = await this._retrain(sinks);
    }
    return report;
  }

  /** autoRetrain：触发反思循环。子系统缺席时如实说不触发。 */
  async _retrain(sinks) {
    const hf = this.hf || {};
    const candidates = [
      ['reflectionLoop', () => hf.reflectionLoop && typeof hf.reflectionLoop.selfReflect === 'function'
        ? hf.reflectionLoop.selfReflect([], '', { trigger: 'failure_import' }) : null],
      ['selfHealing.summarize', () => sinks.selfHealing && typeof sinks.selfHealing.summarize === 'function'
        ? sinks.selfHealing.summarize() : null],
    ];
    const out = { triggered: false, via: null, detail: null };
    for (const [name, fn] of candidates) {
      try {
        const r = await fn();
        if (r !== null && r !== undefined) {
          out.triggered = true;
          out.via = name;
          out.detail = r && typeof r === 'object' ? { keys: Object.keys(r).slice(0, 8) } : r;
          break;
        }
      } catch (e) {
        out.detail = `${name}: ${e.message}`;
      }
    }
    if (!out.triggered) out.detail = out.detail || '反思循环子系统缺席，未触发';
    return out;
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

  /** 只想知道「导过了什么」的调用方 */
  getStats() {
    return {
      importedFingerprints: this._imported.size,
      lastReport: this.lastReport,
    };
  }
}

module.exports = { FailureCaseImporter, caseInput, caseError, caseCategory };
