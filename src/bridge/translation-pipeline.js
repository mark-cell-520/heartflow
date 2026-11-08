/**
 * TranslationPipeline — 交流管线编排器 v1.0
 *
 * 用户→LLM、LLM→用户两条管线各自要跑五六个环节。零散调用时，调用方要么漏环节
 * （忘了抽实体就交给下游），要么被一个环节的异常带崩整条管线。本模块把环节
 * 编排成固定顺序，**单环节失败只降级不崩管**，并把降级了哪些环节如实报出来。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:670 的内联 stub 让
 *   hf.agentLayer.translationPipeline.runUserPipeline() / runLLMPipeline()
 *   分别返回 '' （scripts/tmp-250-probe.js 实测）。该能力在
 *   src/mcp-server.js:1058 的 agentLayer 清单里广告出去。本文件补真实实现。
 *
 * 设计纪律：
 *   1. 依赖从构造参数注入（dispatch 探针），不在内部 new 兄弟模块——
 *       走引擎常驻实例，避免同一引擎内出现两份状态（与 r589/r590 纪律一致）；
 *   2. 每个环节的结果都带 ok/error；degraded 数组列明哪一环缺席，
 *       ready = degraded.length === 0，调用方看得见「这条管线缺了什么」；
 *   3. 没有 dispatch 探针时返回 source:null 并明说 no_dispatch，不产出半成品摘要。
 */

'use strict';

class TranslationPipeline {
  /**
   * @param {object} [opts]
   * @param {Function} [opts.dispatch] 引擎 dispatch 探针 (route, ...args) => 结果
   */
  constructor(opts = {}) {
    this._dispatch = typeof opts.dispatch === 'function' ? opts.dispatch : null;
  }

  /** 单环节调用：异常与空结果都转成 {ok:false,error}，不往外抛 */
  _step(route, ...args) {
    if (!this._dispatch) return { ok: false, value: null, error: 'no_dispatch' };
    try {
      const v = this._dispatch(route, ...args);
      if (v === undefined || v === null) return { ok: false, value: null, error: 'null_result' };
      return { ok: true, value: v, error: null };
    } catch (e) {
      return { ok: false, value: null, error: e && e.message ? e.message : String(e) };
    }
  }

  /**
   * 用户 → LLM 管线：意图 / 语气 / 实体 / 隐性需求 / 立场 → 一包交给下游。
   * @param {string} input 用户输入
   * @param {object} [ctx] 预留上下文
   * @returns {{input:string,intent:object,tone:object,entities:Array,implicitNeeds:Array,
   *            stance:object,summary:string,degraded:string[],ready:boolean,source:string|null}}
   */
  runUserPipeline(input, ctx = {}) {
    const empty = {
      input: typeof input === 'string' ? input : '',
      intent: null, tone: null, entities: [], implicitNeeds: [], stance: null,
      summary: '', degraded: [], ready: false, source: null,
    };
    if (typeof input !== 'string' || input.trim().length === 0) {
      empty.degraded = ['empty_input'];
      return empty;
    }

    const degraded = [];
    const intent = this._step('translator.intentClassifier', input, ctx);
    const tone = this._step('translator.toneAnalyzer', input, ctx);
    const entities = this._step('translator.entityExtractor', input);
    const needs = this._step('translator.implicitNeedDetector', input, ctx);
    const stance = this._step('personaCore.stanceDetector', input, ctx);
    for (const [name, r] of [['intent', intent], ['tone', tone], ['entities', entities], ['implicitNeeds', needs], ['stance', stance]]) {
      if (!r.ok) degraded.push(name + ':' + r.error);
    }

    // 摘要：把上面各环节合成一行人话，供下游直接读
    const parts = [];
    if (intent.ok && intent.value && intent.value.primary) parts.push('意图=' + intent.value.primary);
    if (tone.ok && tone.value && tone.value.emotion) parts.push('情绪=' + tone.value.emotion);
    if (entities.ok && Array.isArray(entities.value) && entities.value.length) parts.push('实体×' + entities.value.length);
    const needCount = needs.ok && needs.value && typeof needs.value.count === 'number'
      ? needs.value.count
      : (needs.ok && Array.isArray(needs.value) ? needs.value.length : 0);
    if (needCount) parts.push('隐性需求×' + needCount);
    if (stance.ok && stance.value && stance.value.stance) parts.push('立场=' + stance.value.stance);
    const summary = parts.length ? '用户输入解析：' + parts.join('，') + '。' : '用户输入解析：无环节产出（见 degraded）。';

    return {
      input,
      intent: intent.ok ? intent.value : null,
      tone: tone.ok ? tone.value : null,
      entities: entities.ok && Array.isArray(entities.value) ? entities.value : [],
      // implicitNeedDetector 的返回是 {needs, count, ...} 对象，原样透传更完整
      implicitNeeds: needs.ok ? needs.value : { needs: [], count: 0 },
      stance: stance.ok ? stance.value : null,
      summary,
      degraded,
      ready: degraded.length === 0,
      source: degraded.length === 0 ? 'translation-pipeline' : 'translation-pipeline(degraded)',
    };
  }

  /**
   * 置信度来源解析：调用方显式给的最可信；否则从质检分 × 冲突情况推导，
   * 并把推导路径写进返回值的 confidenceFrom——下游看得清这个数是哪来的。
   * @returns {{value:number,from:string}|null}
   */
  _deriveConfidence(ctx, quality, conflicts) {
    if (ctx && typeof ctx.confidence === 'number' && isFinite(ctx.confidence)) {
      return { value: Math.max(0, Math.min(1, ctx.confidence)), from: 'ctx.confidence' };
    }
    if (quality.ok && quality.value && typeof quality.value.score === 'number') {
      const hasConflict = conflicts.ok && conflicts.value && Array.isArray(conflicts.value.conflicts) && conflicts.value.conflicts.length > 0;
      const v = Math.max(0, Math.min(1, quality.value.score * (hasConflict ? 0.6 : 1)));
      return { value: Math.round(v * 100) / 100, from: 'derived:quality' + (hasConflict ? '×conflict' : '') };
    }
    return null;
  }

  /**
   * LLM → 用户管线：质检 / 冲突 / 不确定性 / 追问 → 发送前最后一道。
   * @param {string} output LLM 输出
   * @param {object} [ctx] {judgment, confidence}
   * @returns {{output:string,quality:object,conflicts:object,uncertainty:object,
   *            followups:object,disclosure:Array,degraded:string[],ready:boolean,source:string|null}}
   */
  runLLMPipeline(output, ctx = {}) {
    const empty = {
      output: typeof output === 'string' ? output : '',
      quality: null, conflicts: null, uncertainty: null, followups: null,
      disclosure: [], degraded: [], ready: false, source: null,
    };
    if (typeof output !== 'string' || output.trim().length === 0) {
      empty.degraded = ['empty_output'];
      return empty;
    }

    const degraded = [];
    const quality = this._step('agentLayer.qualityFilter', output);
    const conflicts = this._step('agentLayer.conflictResolver', output, ctx);
    const judgment = ctx && typeof ctx === 'object' ? ctx.judgment : null;

    // 置信度来源（诚实地标出来）：调用方显式给 > 从质检分推导 > 无
    const derived = this._deriveConfidence(ctx, quality, conflicts);
    const uncertainty = derived
      ? this._step('agentLayer.uncertaintyHandler', derived.value, ctx)
      : { ok: false, value: null, error: 'no_confidence' };
    const followups = this._step('agentLayer.followupSuggester', judgment || {}, output);
    for (const [name, r] of [['quality', quality], ['conflicts', conflicts], ['uncertainty', uncertainty], ['followups', followups]]) {
      if (!r.ok) degraded.push(name + ':' + r.error);
    }

    // 判定注入：只在调用方真给了判定时做
    let disclosure = [];
    if (judgment && typeof judgment === 'object') {
      const inj = this._step('personaCore.judgmentInjector', judgment, output);
      if (!inj.ok) {
        degraded.push('judgmentInjector:' + inj.error);
      } else if (inj.value && Array.isArray(inj.value.userFacing)) {
        disclosure = inj.value.userFacing.map((u) => u.text).filter(Boolean);
      } else {
        // 跑通了但没有 userFacing 数组（如无判定可注入）——与「环节缺席」区分开
        degraded.push('judgmentInjector:no_user_facing');
      }
    }

    return {
      output,
      quality: quality.ok ? quality.value : null,
      conflicts: conflicts.ok ? conflicts.value : null,
      uncertainty: uncertainty.ok ? uncertainty.value : null,
      confidenceFrom: derived ? derived.from : null,
      followups: followups.ok ? followups.value : null,
      disclosure,
      degraded,
      ready: degraded.length === 0,
      source: degraded.length === 0 ? 'translation-pipeline' : 'translation-pipeline(degraded)',
    };
  }
}

module.exports = { TranslationPipeline };
