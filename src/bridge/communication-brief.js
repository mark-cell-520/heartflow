/**
 * CommunicationBrief — 交流简报合成器 v1.0
 *
 * 把 ToneAnalyzer 的四维语气分析（urgency / emotion / formality / intensity）
 * 与 ImplicitNeedDetector 的八类隐性需求合成一份「这一句该怎么回」的执行简报：
 * 回应语域、紧迫度处理、必须先做的动作、该追问什么、风险旗标。
 *
 * 设计约束（与心虫第 1 层「只辨别、不生成」的定位一致）：
 *   1. 纯规则合成，不调用任何 LLM、不发网络请求；
 *   2. 每条结论都带 signal 来源（哪条规则、命中什么词），可审计；
 *   3. 上游模块缺席时诚实降级（degraded: true），不编造语气结论。
 *
 * [r249] 为什么需要它：引擎 translator.toneAnalyzer / translator.implicitNeedDetector
 *   两条 dispatch 路由此前被内联 stub 挡住，恒返回 {tone:'neutral',confidence:0}
 *   与 []（scripts/tmp-249-probe.js 实测）。调用方拿到的是常量，无法据以调整回应。
 *   本模块把两条真实分析合成一个动作序列，是复活后的第一个消费方。
 */

// 各隐性需求的基准优先级（need_clarification 走单独的 0.95 通道）
const NEED_BASE = {
  need_emotional_support: 0.88,
  need_verification: 0.78,
  need_decision_support: 0.72,
  need_step_by_step: 0.7,
  need_example: 0.68,
  need_comparison: 0.66,
  need_simplification: 0.6,
};

// 负面情绪族：需要先共情、后解决
const NEGATIVE_EMOTIONS = new Set(['negative', 'angry', 'anxious', 'sad', 'frustrated']);

// 语域 → 回应建议（formality 三维 + casual 兜底）
const REGISTER_ADVICE = {
  formal: '用完整句与敬语回应，避免口语缩略与网络用语',
  technical: '可直接使用术语与代码/命令，省去基础概念铺垫',
  casual: '用短句口语回应，可匹配用户的轻松语气',
};

// 紧迫度 → 处理方式
const URGENCY_ADVICE = {
  high: '先给结论或可执行动作，再补原因；不要寒暄与长铺垫',
  medium: '先一句确认需求，再给结构与步骤',
  low: '可以完整展开，先背景后细节',
};

// 情绪 → 处理方式
const EMOTION_ADVICE = {
  angry: '先承认问题与影响，再给修复路径；不要辩解',
  anxious: '先给确定性与边界（能做什么/不能做什么），再给步骤',
  sad: '先表达理解，再问需要建议还是只需要倾听',
  frustrated: '先复述确认已理解卡点，避免重复对方已知的信息',
  negative: '先回应负面点本身，不要直接转正面',
  excited: '匹配节奏，可直接进入细节',
  positive: '保持同频，可直接进入正题',
  neutral: '直接进入正题',
};

// 隐性需求 → 动作模板（priority 为合成时的基准分，会被置信度/情绪强度上调）
const NEED_ACTIONS = {
  need_clarification: {
    action: '先追问缺失信息，再给方案',
    ask: '你提到的「那个」具体是指什么？',
  },
  need_example: {
    action: '给一个具体可对照的例子',
    ask: null,
  },
  need_comparison: {
    action: '列维度做对比，不要只给单一推荐',
    ask: '更看重哪个维度（成本/风险/长期维护）？',
  },
  need_decision_support: {
    action: '帮对方梳理决策要素与权衡，不代替其决定',
    ask: '有哪些硬约束（预算/时间/不可让的条件）？',
  },
  need_verification: {
    action: '给出来源与验证方式，不要只给结论',
    ask: null,
  },
  need_step_by_step: {
    action: '按顺序分步给出，每步可独立执行',
    ask: null,
  },
  need_simplification: {
    action: '先给一句话结论，再按需展开',
    ask: null,
  },
  need_emotional_support: {
    action: '先共情，再问需要建议还是倾听',
    ask: null,
  },
};

class CommunicationBrief {
  constructor(deps = {}) {
    this.name = 'communication-brief';
    this.version = '1.0.0';
    this.toneAnalyzer = deps.toneAnalyzer || null;
    this.needDetector = deps.needDetector || null;
  }

  /**
   * 合成交流简报
   * @param {string} input 用户输入
   * @param {object} [context] 透传给上游分析器的上下文
   * @returns {object} 简报；输入非法时 { ok:false, error }
   */
  build(input, context = {}) {
    const text = typeof input === 'string' ? input.trim() : '';
    if (!text) {
      return { ok: false, error: 'input 为空或不是字符串', brief: null };
    }

    const degraded = !(this.toneAnalyzer && this.needDetector);
    let tone = null;
    let needs = { needs: [], count: 0, hasHighConfidence: false, summary: '' };
    let upstreamError = null;

    if (!degraded) {
      try {
        tone = this.toneAnalyzer.analyze(text, context) || null;
      } catch (e) {
        upstreamError = `toneAnalyzer: ${e.message}`;
      }
      try {
        needs = this.needDetector.detect(text, { tone: tone || {} }) || needs;
      } catch (e) {
        upstreamError = upstreamError ? `${upstreamError}; needDetector: ${e.message}` : `needDetector: ${e.message}`;
      }
    }

    const emotion = tone && tone.emotion ? tone.emotion : 'unknown';
    const urgency = tone && tone.urgency ? tone.urgency : 'unknown';
    const formality = tone && tone.formality ? tone.formality : 'unknown';
    const intensity = tone && typeof tone.intensity === 'number' ? tone.intensity : null;
    const isNegative = NEGATIVE_EMOTIONS.has(emotion);

    // ─── 动作序列：每条都记来源，优先级 = 基准分 × 强度系数 ───
    const moves = [];

    // 1) 信息不足 → 追问永远排最前（在错误前提上答得再好也是错的）
    const clarify = needs.needs.find(n => n.type === 'need_clarification');
    if (clarify) {
      moves.push(this._move('clarify', 0.95, NEED_ACTIONS.need_clarification.action,
        `隐性需求 need_clarification（置信度 ${clarify.confidence}）`, clarify.confidence));
    }

    // 2) 负面情绪 → 先共情（强度越高越靠前）
    if (isNegative) {
      const base = 0.9;
      const boost = intensity === null ? 0 : Math.min(0.09, intensity * 0.1);
      moves.push(this._move('empathize_first', base + boost, EMOTION_ADVICE[emotion] || EMOTION_ADVICE.negative,
        `负面情绪 ${emotion}${intensity === null ? '' : ` × 强度 ${intensity}`}`, 1));
    }

    // 3) 高紧迫 → 结论先行
    if (urgency === 'high') {
      moves.push(this._move('urgency_lead_with_conclusion', 0.85, URGENCY_ADVICE.high,
        `紧迫度 high（signals: ${this._signals(tone, 'urgencySignals')}）`, 1));
    }

    // 4) 其余隐性需求按基准分 + 置信度加权
    for (const n of needs.needs) {
      const tpl = NEED_ACTIONS[n.type];
      if (!tpl || n.type === 'need_clarification') continue;
      const base = NEED_BASE[n.type] || 0.6;
      moves.push(this._move(n.type, base, tpl.action,
        `隐性需求 ${n.type}（置信度 ${n.confidence}）`, n.confidence));
    }

    // 5) 语域匹配（低优先，但始终给一条可执行建议）
    if (formality !== 'unknown' && REGISTER_ADVICE[formality]) {
      moves.push(this._move('match_register', 0.5, REGISTER_ADVICE[formality],
        `语域 ${formality}（signals: ${this._signals(tone, 'formalitySignals')}）`, 1));
    }
    if (urgency !== 'high' && urgency !== 'unknown' && URGENCY_ADVICE[urgency]) {
      moves.push(this._move('urgency_pacing', 0.45, URGENCY_ADVICE[urgency], `紧迫度 ${urgency}`, 1));
    }

    moves.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

    // ─── 风险旗标：会让人「答错形状」的组合 ───
    const riskFlags = [];
    if (urgency === 'high' && intensity !== null && intensity >= 0.8) {
      riskFlags.push({ flag: 'high_pressure', detail: '高紧迫 × 高强度：先给可执行动作，避免长篇大论' });
    }
    if (needs.count >= 3) {
      riskFlags.push({ flag: 'multi_need', detail: `同时命中 ${needs.count} 类隐性需求：先确认主需求，别一次全答` });
    }
    if (formality === 'technical' && isNegative) {
      riskFlags.push({ flag: 'technical_plus_negative', detail: '技术语境 × 负面情绪：先解决情绪卡点，再贴代码/命令' });
    }
    if (needs.needs.some(n => n.type === 'need_verification')) {
      riskFlags.push({ flag: 'verification_requested', detail: '对方在要求验证：无来源的断言会被当成敷衍' });
    }

    // ─── 建议追问：只从「追问型」需求生成，最多 3 条 ───
    const questions = [];
    for (const n of needs.needs) {
      const ask = NEED_ACTIONS[n.type] && NEED_ACTIONS[n.type].ask;
      if (ask && questions.length < 3) questions.push({ type: n.type, question: ask });
    }

    const signalCount = (tone && tone.details
      ? (tone.details.urgencySignals || []).length + (tone.details.emotionSignals || []).length + (tone.details.formalitySignals || []).length
      : 0) + needs.count;
    const confidence = degraded ? 0 : Math.min(1, Math.round((0.3 + signalCount * 0.12) * 100) / 100);

    return {
      ok: true,
      input: text,
      degraded,
      upstreamError,
      strategy: {
        register: formality,
        registerAdvice: REGISTER_ADVICE[formality] || null,
        urgency,
        urgencyAdvice: URGENCY_ADVICE[urgency] || null,
        emotion,
        emotionAdvice: EMOTION_ADVICE[emotion] || null,
        intensity,
      },
      tone,
      implicitNeeds: needs,
      moves,
      topMove: moves.length ? moves[0] : null,
      questions,
      riskFlags,
      signalCount,
      confidence,
      summary: this._summarize(emotion, urgency, needs.count, moves),
      checkedBy: ['communication-brief@' + this.version].concat(degraded ? [] : ['tone-analyzer', 'implicit-need-detector']),
    };
  }

  /** 构造一条动作记录（priority 已按 weight 调整） */
  _move(id, base, action, reason, weight) {
    const w = typeof weight === 'number' ? weight : 1;
    return {
      id,
      action,
      reason,
      priority: Math.round(Math.min(1, base * (0.85 + 0.15 * w)) * 1000) / 1000,
    };
  }

  /** 取 tone.details 里的信号词列表，拼成可读字符串 */
  _signals(tone, key) {
    const list = tone && tone.details && Array.isArray(tone.details[key]) ? tone.details[key] : [];
    return list.length ? list.slice(0, 4).join('/') : '无';
  }

  /** 一行摘要：给只读一个字段的调用方 */
  _summarize(emotion, urgency, needCount, moves) {
    if (!moves.length) return '无显著语气或隐性需求信号，按常规回应处理';
    const top = moves[0];
    const parts = [top.action];
    if (emotion !== 'unknown' && emotion !== 'neutral') parts.push(`情绪=${emotion}`);
    if (urgency !== 'unknown' && urgency !== 'low') parts.push(`紧迫=${urgency}`);
    if (needCount > 0) parts.push(`隐性需求=${needCount} 类`);
    return parts.join('；');
  }

  destroy() {}
  stop() {}
}

module.exports = { CommunicationBrief, NEED_ACTIONS, NEED_BASE, REGISTER_ADVICE };
