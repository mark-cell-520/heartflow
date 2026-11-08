#!/usr/bin/env node
/**
 * [v6.7.7] MetacognitiveReward — 论文: Metacognition as Reward (2605.23384)
 * 
 * 核心思想：将 LLM 的自我评估（"我对这个答案有多自信？"）作为训练信号
 * 不依赖外部标注，内建奖励模型：高置信 + 正确 = 高奖励；低置信 + 错误 = 低奖励
 * 
 * 实现要点：
 *   - ConfidenceEstimator: 从输出文本/thoughtChain 提取置信度分数
 *   - OutcomeVerifier: 验证输出质量（事实一致性/逻辑/完整性）
 *   - RewardComputer: 综合置信度和验证结果计算奖励值
 *   - LearningBuffer: 积累经验数据，供自愈 RL 采样
 *
 * [r254 口径修正] 本文件的两处输入侧缺陷曾让奖励信号完全退化，
 * 详见 _estimateConfidence / _verifyOutput 上方的注释与 UPGRADE_LOG r254。
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('../utils/safe-fs');

const BUFFER_DIR = path.join(__dirname, '..', 'memory', 'metacognition');

// ─── [r254] 真实辨别引擎的懒加载 + 结果记忆缓存 ───────────────────
//
// 为什么不放在文件顶层 require：src/gate.js → src/index.js → 本模块
// （src/index.js:17442 `metacognition: require('./cortex/metacognitive-reward.js')`），
// 顶层 require 会成环。方法内懒加载 + 缓存模块引用，环在调用时早已加载完。
let _gateModule = null;
function _loadGateModule() {
  if (_gateModule === null) {
    try { _gateModule = require('../gate.js'); } catch (_) { _gateModule = false; }
  }
  return _gateModule || null;
}

// gate() 单次实测约 48ms（r254 第四节），同一段输出被重复评分时不能重复付这个代价。
const VERIFY_CACHE_LIMIT = 200;

class MetacognitiveReward {
  constructor(hf, opts = {}) {
    this.hf = hf;
    this.bufferDir = opts.bufferDir || BUFFER_DIR;
    this.bufferFile = path.join(this.bufferDir, 'experience-buffer.jsonl');
    this.statsFile = path.join(this.bufferDir, 'reward-stats.json');
    this._verifyCache = new Map();   // [r254] 文本指纹 → gate() 判定结果
    this._engine = opts.judge || null; // [r254] 调用方注入的判别器（测试/自定义用）
    this._ensureDir();
    this._loadStats();
  }

  _ensureDir() { if (!fs.existsSync(this.bufferDir)) fs.mkdirSync(this.bufferDir, { recursive: true }); }
  /**
   * [r252 修复] 原实现有两个叠加缺陷，让 MetacognitiveReward.evaluate()
   * 从写出起就 100% 崩（this.stats 恒 undefined → _recordExperience 里
   * `this.stats.total++` 抛 TypeError）：
   *   ① 只在 catch 分支里给 this.stats 兜底。首次运行（stats 文件不存在）
   *     时 existsSync 为 false，try 体不抛错、catch 不执行 → 无兜底。
   *   ② 文件存在时 `Object.assign(this, parsed)` 把 total/avgReward 等
   *      平铺键挂到 this 上，而 _saveStats() 写的正是平铺形状——
   *      读写形状不一致，this.stats 依旧是 undefined。
   * 现在先落默认值，再按「平铺（_saveStats 的实际形状）」优先、
   * 「{stats:{...}} 包裹」兼容的方式合并，两条路径都保证 this.stats 可用。
   */
  _loadStats() {
    this.stats = { total: 0, avgReward: 0.5, avgConfidence: 0.5, avgQuality: 0.5, byVerdict: {} };
    try {
      if (fs.existsSync(this.statsFile)) {
        const loaded = JSON.parse(fs.readFileSync(this.statsFile, 'utf-8'));
        const flat = (loaded && typeof loaded === 'object' && typeof loaded.total === 'number') ? loaded : null;
        const wrapped = (loaded && typeof loaded === 'object' && loaded.stats && typeof loaded.stats === 'object') ? loaded.stats : null;
        const src = flat || wrapped;
        if (src) {
          for (const k of ['total', 'avgReward', 'avgConfidence', 'avgQuality']) {
            if (typeof src[k] === 'number' && Number.isFinite(src[k])) this.stats[k] = src[k];
          }
          if (src.byVerdict && typeof src.byVerdict === 'object' && !Array.isArray(src.byVerdict)) {
            for (const [k, v] of Object.entries(src.byVerdict)) {
              if (typeof v === 'number' && Number.isFinite(v)) this.stats.byVerdict[k] = v;
            }
          }
        }
      }
    } catch (_) { /* 读不动就保留默认值，不阻断 evaluate */ }
  }
  _saveStats() { fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2), 'utf-8'); }

  /**
   * 主入口：评估输出质量 + 计算奖励
   * @returns {reward: -1~1, confidence: 0~1, quality: 0~1, verdict: 'excellent'|'good'|'acceptable'|'poor',
   *           qualitySource, gateAction, topFindings}
   */
  evaluate(output, context = {}) {
    const text = String(output == null ? '' : output);
    const confidence = this._estimateConfidence(text, context);
    const verified = this._verifyOutput(text, context);
    const quality = verified.quality;
    const reward = this._computeReward(confidence, quality);
    const verdict = this._verdict(reward);
    this._recordExperience(text, { confidence, quality, reward, verdict, context });
    return {
      reward: Math.round(reward * 100) / 100,
      confidence,
      quality,
      verdict,
      // [r254] 新增可审计字段：质量分是怎么来的（诚实记账，设计原则 #5）
      qualitySource: verified.source,
      gateAction: verified.gateAction || null,
      topFindings: verified.topFindings || [],
    };
  }

  /**
   * [r254 口径修正] 原实现 `base = Math.min(1, len / 500)`——把「自信度」
   * 退化成文本长度的函数。轮初实测（UPGRADE_LOG r254 第二节，同一 hf 实例、
   * 同一批用例）：50 字有引用的合格答案 0.27、26 字谨慎表述 0.152（比光秃
   * 短答案还低——恰当使用模糊限制词反被扣分）、四条坏文本 0.024~0.068 全塌到
   * 0 附近；唯一拿到 0.628 的是 400 字长文本。好坏几乎不可分。
   *
   * 新口径：从中性先验 0.5 起步，只按三类**可归因**信号加减——
   *   ① 证据：有可指名来源 / 有可核查的具体数字日期 → 加分
   *   ② 无依据的确定性措辞（"绝对/毫无疑问/唯一"却没有来源撑腰）→ 扣分（过度自信）；
   *      有来源撑腰的确定性措辞 → 小幅加分（正当自信）
   *   ③ 模糊限制词：适度（1~3 个）是校准 → 加分；过密（≥4 个）是逃避表态 → 扣分
   * 空文本/极短文本仍判低自信——没有内容可自信。
   */
  _estimateConfidence(output, ctx = {}) {
    const text = String(output == null ? '' : output);
    const len = text.trim().length;
    if (len === 0) return 0;
    if (len < 4) return 0.05;

    const hedgeWords = (text.match(/可能|大概|也许|似乎|或许|不确定|无法确定|没把握|uncertain|might|maybe|perhaps|probably/gi) || []).length;
    // 确定性措辞要剔除被否定的：「无法确定」「这不是唯一」是谦逊不是过度自信。
    // 逐个出现位置回看前 3 字，窗口里出现否定标记就不计入（轮初实测漏这条会把
    // 「我无法确定哪个方案更好」判成过度自信，confidence 从 0.55 掉到 0.43）。
    const certaintyWords = this._countCertainty(text);
    const citeHits = (text.match(/《[^》]{2,30}》|来源\s*[:：]|据[^。；\n]{2,40}(?:显示|指出|表明|报道)|https?:\/\/\S+|doi\s*[:：]\s*\S+|(?:reference|source)s?\s*[:：]/gi) || []);
    const hasCites = citeHits.length > 0;
    const hasSpecifics = /\d{4}\s*[年\-\/.]\s*\d{0,2}|\d+(?:\.\d+)?\s*[%％]|\b\d{3,}\b/.test(text);

    let score = 0.5;
    // ① 证据
    if (hasCites) score += citeHits.length >= 2 ? 0.25 : 0.18;
    if (hasSpecifics) score += 0.08;
    // ② 确定性措辞：有据加分、无据扣分
    if (certaintyWords > 0) {
      score += hasCites ? Math.min(0.1, certaintyWords * 0.05)
                        : -Math.min(0.36, certaintyWords * 0.12);
    }
    // ③ 模糊限制词密度
    if (hedgeWords >= 4) score -= 0.15;
    else if (hedgeWords > 0) score += 0.05;

    // 外部自评反馈（_normalizeSelfFeedback 兼容 MCP 侧传字符串的形状）
    const items = this._normalizeSelfFeedback(ctx.selfFeedback);
    if (items.length) {
      const lowConf = items.filter(i => i.type === 'low_confidence').length;
      score -= lowConf * 0.1;
    }
    return Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));
  }

  /**
   * [r254] 数「无依据的确定性措辞」出现次数，剔除被否定的。
   * 「无法确定」「这不是唯一」「未必显然」是谦逊/审慎，不是过度自信。
   */
  _countCertainty(text) {
    const RE = /(确定|一定|显然|明确|毫无疑问|绝对|唯一|certain|definitely|clearly|obviously|undoubtedly)/gi;
    const NEG = /(?:无法|不能|不太|并不|绝非|不是|不算|不可|不应|未必|难以|未)/;
    let n = 0, m;
    while ((m = RE.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 3), m.index);
      if (!NEG.test(before)) n++;
    }
    return n;
  }

  /**
   * [r254] 外部自评反馈归一化。
   * MCP 工具 schema 把 selfFeedback 声明为 **string**
   * （src/mcp/extended-tools.js:1211），而原实现只读
   * `ctx.selfFeedback?.items?.length`——字符串没有 .items，
   * 于是这条反馈通道经 MCP 进来恒失效（第三处口径缺陷）。
   * 现在兼容三种输入：{items:[...]} / [...] / JSON 字符串 / 自由文本。
   */
  _normalizeSelfFeedback(raw) {
    if (!raw) return [];
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        return this._normalizeSelfFeedback(parsed);
      } catch (_) {
        return /不确定|没把握|无法确认|存疑|不太确定|unsure|not sure|low confidence/i.test(s)
          ? [{ type: 'low_confidence' }] : [];
      }
    }
    if (Array.isArray(raw)) return raw.filter(x => x && typeof x === 'object');
    if (Array.isArray(raw.items)) return raw.items.filter(x => x && typeof x === 'object');
    return [];
  }

  /**
   * [r254 口径修正] 原实现读 `this.hf.discriminate.dimensions`：
   * `discriminate` 在 src/index.js 是**函数**（module.exports.discriminate），
   * 函数对象上没有 `.dimensions` 属性 → 恒 undefined → 整个 if 分支恒不进入
   * → 无论输入是什么都 `return 0.6`。轮初实测七条用例（含幻觉声明、情感操控、
   * 绝对化断言）的 quality **全部等于 0.6**，一毫不差。
   *
   * 现在改为：真的去问辨别引擎。取 src/gate.js 的 gate()（本仓零依赖纯规则
   * 引擎，进程内 always-on），按 gate.action 分档 + findings 最高严重度折算：
   *   block 0.0 / rewrite 0.1 / verify 0.3 / pass 0.9，再按最高严重度扣载
   * 刻意**不用** overallScore 折算质量——轮初实测它并非「越坏越低」：
   * 情感操控句 overallScore=0.79，而一段正常带引用的长文本只有 0.23，
   * 拿它当质量代理会把好坏颠倒（证据见 UPGRADE_LOG r254 第二节）。
   *
   * 引擎不可用时如实返回中性 0.5 并标 qualitySource，不拿启发式冒充判别器
   * （设计原则 #5）。
   *
   * @returns {{quality:number, source:string, gateAction:?string, topFindings:Array}}
   */
  _verifyOutput(output, ctx = {}) {
    const text = String(output == null ? '' : output);
    const judge = this._resolveJudge(ctx);
    if (!judge) {
      return { quality: 0.5, source: 'no_engine_neutral', gateAction: null, topFindings: [] };
    }
    const res = this._judgeCached(text, judge);
    if (!res || typeof res !== 'object') {
      return { quality: 0.5, source: 'judge_returned_nothing', gateAction: null, topFindings: [] };
    }
    const action = (res.gate && res.gate.action) || null;
    const findings = Array.isArray(res.findings) ? res.findings : [];
    const top = findings.slice()
      .sort((a, b) => (b.severity || 0) - (a.severity || 0))
      .slice(0, 3)
      .map(f => ({ dimension: f.dimension || null, severity: f.severity || 0 }));

    const BASE = { block: 0.0, rewrite: 0.1, verify: 0.3, pass: 0.9 };
    let quality = BASE[action];
    if (quality === undefined) quality = 0.5;
    if (action && action !== 'pass' && findings.length) {
      const maxSev = findings.reduce((m, f) => Math.max(m, f.severity || 0), 0);
      quality -= (maxSev / 100) * 0.2;
    }
    quality = Math.max(0, Math.min(1, Math.round(quality * 1000) / 1000));
    return { quality, source: 'engine_gate', gateAction: action, topFindings: top };
  }

  /**
   * [r254] 判别器解析优先级：ctx.judge > 构造注入 > 引擎实例自带 gate() >
   * 懒加载 src/gate.js 的 gate()。
   * 刻意**不**用 `hf.discriminate`：AGENTS.md 明写它「per-dimension scoring
   * without the gate layer — no gate.action assigned」，拿不到 gate.action
   * 就落不回四档质量分，只会拿到中性 0.5（比常量 0.6 好不到哪去）。
   */
  _resolveJudge(ctx) {
    if (ctx && typeof ctx.judge === 'function') return ctx.judge;
    if (typeof this._engine === 'function') return this._engine;
    if (this.hf && typeof this.hf.gate === 'function') return this.hf.gate.bind(this.hf);
    const mod = _loadGateModule();
    return (mod && typeof mod.gate === 'function') ? mod.gate : null;
  }

  /** [r254] 有界记忆缓存：同一段输出重复评分不再重复付 ~48ms 的 gate() 代价 */
  _judgeCached(text, judge) {
    const key = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
    if (this._verifyCache.has(key)) {
      const hit = this._verifyCache.get(key);
      this._verifyCache.delete(key);
      this._verifyCache.set(key, hit);   // 触达后移到队尾（近似 LRU）
      return hit;
    }
    let res = null;
    try { res = judge(text); } catch (_) { res = null; }
    this._verifyCache.set(key, res);
    if (this._verifyCache.size > VERIFY_CACHE_LIMIT) {
      this._verifyCache.delete(this._verifyCache.keys().next().value);  // 丢最旧
    }
    return res;
  }

  /**
   * [r254] 奖励计算。保留原四档论文口径，新增一档「高置信 + 低质量」=
   * **自信地错**。原四档把「自信地错」和「不确定」给同一个 0.2，分不开这两种
   * 失效形态；而前者才是辨别器最该压制的（心虫防的正是过度自信的断言），
   * 故给负奖励，比「不确定」更坏。
   */
  _computeReward(confidence, quality) {
    if (confidence > 0.5 && quality < 0.3) return -0.2;
    if (confidence > 0.7 && quality > 0.7) return 0.9;
    if (confidence > 0.5 && quality > 0.5) return 0.6;
    if (confidence < 0.3 || quality < 0.3) return 0.2;
    return 0.4;
  }

  _verdict(reward) {
    if (reward >= 0.8) return 'excellent';
    if (reward >= 0.6) return 'good';
    if (reward >= 0.4) return 'acceptable';
    return 'poor';
  }

  _recordExperience(output, data) {
    this.stats.total++;
    this.stats.avgReward = (this.stats.avgReward * (this.stats.total - 1) + data.reward) / this.stats.total;
    this.stats.avgConfidence = (this.stats.avgConfidence * (this.stats.total - 1) + data.confidence) / this.stats.total;
    this.stats.avgQuality = (this.stats.avgQuality * (this.stats.total - 1) + data.quality) / this.stats.total;
    if (data.verdict) {
      this.stats.byVerdict = this.stats.byVerdict || {};
      this.stats.byVerdict[data.verdict] = (this.stats.byVerdict[data.verdict] || 0) + 1;
    }
    try {
      const rec = { ts: Date.now(), outputPreview: String(output).slice(0, 200), ...data };
      fs.appendFileSync(this.bufferFile, JSON.stringify(rec) + '\n', 'utf-8');
    } catch (_) { /* ignore */ }
    this._saveStats();
  }

  /**
   * [r254] 累计奖励统计的公开读法（供 MCP heartflow_metacognition_evaluate
   * action=stats 暴露，AGENTS.md 约定 3）。
   */
  getStats() {
    const r4 = v => Math.round(v * 10000) / 10000;
    return {
      total: this.stats.total,
      avgReward: r4(this.stats.avgReward),
      avgConfidence: r4(this.stats.avgConfidence),
      avgQuality: r4(this.stats.avgQuality),
      byVerdict: { ...(this.stats.byVerdict || {}) },
      statsFile: this.statsFile,
      verifyCacheSize: this._verifyCache.size,
    };
  }
}

module.exports = { MetacognitiveReward };
