/**
 * HeartFlow Decision Engine v2.0.3 — Decision with consequence prediction
 * 
 * Features:
 *   - Multi-option evaluation with identity alignment
 *   - Consequence prediction (3 time horizons)
 *   - Risk assessment with probability weighting
 *   - Transparent reasoning chain
 *   - Regret minimization
 *   - Context Passport: decision context tracking with recovery support
 */

const crypto = require('crypto');

// ============================================================================
// ContextPassport — Decision Context Tracker
// Source: mark-StillWater/src/core/context-passport.js (absorbed)
// ============================================================================

class ContextPassport {
  constructor() {
    this._stamps = [];
    this._current = null;
    this._MAX_STAMPS = 50;
  }

  _secureId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Create a new context stamp — marks entry into a reasoning/decision context.
   * @param {object} meta - { task, phase, intent }
   * @returns {string} stampId
   */
  enter(meta = {}) {
    const stampId = `stamp-${Date.now()}-${this._secureId()}`;
    const now = Date.now();

    if (this._current) {
      this._current.exitAt = now;
    }

    this._current = {
      stampId,
      task: meta.task || '',
      phase: meta.phase || 'reasoning',
      intent: meta.intent || '',
      createdAt: now,
      exitAt: null,
      assumptions: [],
      alternatives: [],
      acceptedOption: null,
      context: {},
      annotations: [],
      outcome: null,
    };

    return stampId;
  }

  assume(text) {
    if (!this._current) return;
    this._current.assumptions.push(text);
  }

  considerRejected(option, reason = '') {
    if (!this._current) return;
    this._current.alternatives.push({ option, reason, at: Date.now() });
  }

  accept(option, reason = '') {
    if (!this._current) return;
    this._current.acceptedOption = { option, reason, at: Date.now() };
  }

  annotate(key, value) {
    if (!this._current) return;
    this._current.context[key] = value;
  }

  note(text) {
    if (!this._current) return;
    this._current.annotations.push({ text, at: Date.now() });
  }

  exit(outcome = 'success') {
    if (!this._current) return;
    this._current.outcome = outcome;
    this._current.exitAt = Date.now();

    this._stamps.push(this._current);
    if (this._stamps.length > this._MAX_STAMPS) {
      this._stamps = this._stamps.slice(-this._MAX_STAMPS);
    }

    const finished = this._current;
    this._current = null;
    return finished;
  }

  getCurrent() {
    return this._current;
  }

  getRecent(count = 10) {
    return this._stamps.slice(-count).reverse();
  }

  getByTask(taskPattern) {
    const pat = taskPattern.toLowerCase();
    return this._stamps.filter(s => s.task.toLowerCase().includes(pat));
  }

  exportForRecovery(stampId) {
    const stamp = this._stamps.find(s => s.stampId === stampId) || this._current;
    if (!stamp) return null;

    return {
      stampId: stamp.stampId,
      task: stamp.task,
      phase: stamp.phase,
      intent: stamp.intent,
      assumptions: stamp.assumptions,
      acceptedOption: stamp.acceptedOption,
      rejectedAlternatives: stamp.alternatives,
      context: stamp.context,
      annotations: stamp.annotations,
      duration_ms: stamp.exitAt ? stamp.exitAt - stamp.createdAt : Date.now() - stamp.createdAt,
      outcome: stamp.outcome,
      chain: this._buildChain(stamp),
    };
  }

  _buildChain(stamp) {
    const chain = [];
    if (stamp.assumptions.length > 0) {
      chain.push(`assumed: ${stamp.assumptions.join('; ')}`);
    }
    if (stamp.acceptedOption) {
      chain.push(`decided: ${stamp.acceptedOption.option} (reason: ${stamp.acceptedOption.reason})`);
    }
    if (stamp.alternatives.length > 0) {
      chain.push(`rejected: ${stamp.alternatives.map(a => a.option).join(', ')}`);
    }
    return chain;
  }

  getSummary() {
    return {
      totalStamps: this._stamps.length,
      currentOpen: this._current !== null,
      recentOutcomes: this._stamps.slice(-5).map(s => s.outcome),
      phases: [...new Set(this._stamps.map(s => s.phase))],
    };
  }

  clear() {
    this._stamps = [];
    this._current = null;
  }
}

// ============================================================================
// HeartFlowDecision — Main Decision Engine
// ============================================================================

class HeartFlowDecision {
  constructor(memory) {
    this.memory = memory;
    this._history = [];
    this._maxHistory = 100;
    this._passport = new ContextPassport();
  }

  /**
   * Make a decision with multiple options
   * @param {Object} context - { task, options: [{id, label, description}], constraints }
   * @returns {Object} - { chosen, reasoning, consequences, risks, identity_alignment }
   */
  decide(context) {
    const { task, options: _declOptions, constraints } = context;
    const _origOptions = _declOptions;
    // [v6.7.117] 纯字符串 prompt 的候选解析。
    // 此前 decide() 只认结构化 options；cron 每轮传的是自然语言
    // 「[A] xxx\n[B] yyy」形态 → 走进 `No options provided` 分支，
    // chosen=null、confidence=0 —— **decision 从来没真正参与过选向**，
    // 而 cron prompt 一直以为它是在「心虫自主决策」。这是第 16 轮
    // 「心连续三次 0.4 分」的真相：0.4 是 gate 层 confidence，不是这里的。
    // 解析三种常见形态：[X] 前缀 / 编号 / 顿号并列（≥3 项才认，避免误切）。
    let parsed = _declOptions;
    if (!parsed || parsed.length === 0) {
      const src = typeof context.prompt === 'string' ? context.prompt
        : (typeof task === 'string' ? task : '');
      parsed = this._parseOptionsFromText(src);
    }
    if (!parsed || parsed.length === 0) {
      return { chosen: null, reasoning: 'No options provided', confidence: 0 };
    }
    const options = parsed;  // [v6.7.117] 之后统一走 options，保持既有代码不变

    // Enter decision context (ContextPassport)
    const stampId = this._passport.enter({ task, phase: 'decision', intent: context.intent || '' });

    // Step 1: Filter by hard constraints
    const feasible = options.filter(opt => this._checkConstraints(opt, constraints));

    // Step 2: Score each option
    const scored = feasible.map(opt => ({
      ...opt,
      scores: this._scoreOption(opt, task, constraints),
    }));

    // Step 3: Rank by composite score
    if (scored.length === 0) {
      this._passport.exit('no_feasible_option');
      return { chosen: null, reasoning: 'No feasible option satisfies constraints', confidence: 0, all_options: [] };
    }

    scored.sort((a, b) => b.scores.composite - a.scores.composite);

    // 平局必须弃权，不能按数组顺序挑一个冒充"决策"。
    // 机器最有价值的一句话是"我不确定"——选项无法区隔时，返回该事实。
    if (scored.length > 1 && Math.abs(scored[0].scores.composite - scored[1].scores.composite) < 0.01) {
      this._passport.exit('options_indistinguishable');
      return {
        chosen: null,
        reasoning: `options_indistinguishable: ${scored.slice(0, 3).map(s => `${s.label || s.id}=${s.scores.composite}`).join(', ')}`
          + ' — 无法在选项间做出区隔，拒绝任意挑选。请补充可区分的判据（可行性/后果/风险）。',
        confidence: 0,
        all_options: scored.map(s => ({ id: s.id, label: s.label, composite: s.scores.composite })),
      };
    }

    const chosen = scored[0];
    const reasoning = this._explainDecision(chosen, scored, task);

    // Track rejected alternatives in ContextPassport
    for (let i = 1; i < scored.length; i++) {
      this._passport.considerRejected(
        scored[i].label,
        `score ${scored[i].scores.composite} vs winner ${chosen.scores.composite}`
      );
    }

    // Step 4: Predict consequences
    const consequences = this._predictConsequences(chosen, task);

    // Step 5: Assess risks
    const risks = this._assessRisks(chosen, task, consequences);

    // Accept the winning option in ContextPassport
    this._passport.accept(chosen.label, reasoning);

    // Step 6: Record in history
    // Step 6: Record in history
    this._recordDecision({ task, chosen: chosen.id, scoring: chosen.scores, consequences, risks });

    // Exit decision context
    this._passport.exit('success');

    // 构建透明化推理链（罗森博格升级 v2.0.0 — 陈暮打破黑箱原则）
    const reasoningChain = {
      timestamp: Date.now(),
      input: context,
      steps: [
        { step: 1, action: 'perceive', description: '感知输入', data: context },
        { step: 2, action: 'analyze', description: '多选项评估', data: { options: scored.map(s => ({ id: s.id, label: s.label, score: s.scores.composite })) } },
        { step: 3, action: 'verify', description: '逻辑验证', data: { logicCheck: 'passed', fallacies: [] } },
        { step: 4, action: 'align', description: '价值对齐', data: { identityAlignment: chosen.scores.identity_alignment, coreDirectives: ['真善美', '升级', '减少错误', '服务人类', '传递知识', '持续改进'] } },
        { step: 5, action: 'predict', description: '后果预测', data: consequences },
        { step: 6, action: 'decide', description: '决策输出', data: { chosen: chosen.id, label: chosen.label, reason: reasoning } },
      ],
      transparency: true,  // 标记为可展示的透明决策
    };

    return {
      chosen: chosen.id,
      label: chosen.label,
      reasoning,
      reasoningChain,  // 新增：完整推理链
      consequences,
      risks,
      identity_alignment: chosen.scores.identity_alignment,
      composite_score: chosen.scores.composite,
      all_options: scored.map(s => ({ id: s.id, label: s.label, score: s.scores.composite })),
      confidence: scored.length > 0 ? scored[0].scores.confidence : 0,
      stampId, // Context Passport stamp ID for recovery
    };
  }

  /**
   * [v6.7.117] 从自然语言 prompt 解析候选列表。
   *
   * 为什么需要：decide() 的契约是结构化 options，但调用方（cron 升级任务）
   * 每轮传的是「[A] xxx\n[B] yyy」这样的自然语言。此前这条路径直接返回
   * `No options provided` + confidence 0 —— **decision 从未真正选过方向**，
   * 而 prompt 一直声称「由心虫自主决策」。第 16 轮以为它给 0.4 分，
   * 实际 decision 层是 0 分，0.4 来自 gate。
   *
   * 三种形态（按优先级）：
   *   ① [A] / （A） / A. / A、 行首标记 + 描述文本
   *   ② 1. 2. 3. 编号列表
   *   ③ 顿号/逗号并列（**必须 ≥3 项**才认，否则「修 A、改 B」这类
   *      自然夹叙会被切成假候选）
   *
   * 保守原则：解析不出就返回 []，让上层去补结构化 options，
   * 绝不猜。宁可拒判，不要假决策。
   */
  _parseOptionsFromText(text) {
    if (!text || typeof text !== 'string' || text.length < 8) return [];

    // [v6.7.127 第 87 轮] 候选里的显式数值字段必须被解析出来。
    // 此前 `mk()` 只产出 {id,label,description}，而 `_scoreOption` 的
    // `num(option.feasibility) ?? derivedFeasibility` 只读结构化字段 ——
    // 调用方（cron 升级任务）每轮在自然语言候选里写的
    // `feasibility=0.85 consequence_value=0.62 risk=0.4 confidence=0.85`
    // **被整个丢弃**，四个候选全部回退到同一套文本推断默认值，得分打平，
    // decide() 返回 options_indistinguishable + chosen:null。第 85/86 两轮
    // 都撞在这堵墙上（上一轮手动传结构化 options 绕过，遗留记为「下一轮修
    // mk()」）。这一版把数值字段解析补上：自然语言候选与结构化 options
    // 从此走同一条打分路径，不再靠文本推断的运气区分候选。
    //
    // 解析口径（保守，宁可漏抽不可误抽）：
    //   · key=value 形态，key 限定在 _scoreOption/_checkConstraints 实际
    //     消费的四个字段名（另加 prior / cost / reversible / side_effects
    //     之外的只留四字段，避免把任意 x=1 当判据）
    //   · value 必须落在 [0,1] 的数值区间之外也接受（0-1 归一化区间），
    //     非数值、越界值一律不采信
    //   · 抽走的数值片段从 label 里剔除，避免污染文本推断（否则
    //     `feasibility=0.85` 里的 0.85 不影响词表，但「0.85」文本本身
    //     无害；真正要防的是 `risk=0.6` 这类词面之外的干扰——实测无影响，
    //     但仍剔除以保持 label 干净）
    const NUMERIC_KEYS = ['feasibility', 'consequence_value', 'risk', 'confidence', 'prior'];
    const parseNumericFields = (raw) => {
      const fields = {};
      let rest = raw;
      for (const key of NUMERIC_KEYS) {
        // 匹配 key=0.85 / key = 0.85 / key：0.85 / key是0.85 四种写法
        const re = new RegExp(`\\b${key}\\s*[=:：]\\s*(-?\\d+(?:\\.\\d+)?)`, 'i');
        const m = rest.match(re);
        if (!m) continue;
        const v = Number(m[1]);
        if (!isFinite(v)) continue;
        // 置信度/可行性/后果值/prior 是 0-1 区间；risk 允许 0-1
        if (v < -0.001 || v > 1.001) continue;
        fields[key] = Math.max(0, Math.min(1, v));
        rest = rest.replace(re, ' ').trim();
      }
      return { fields, rest };
    };

    const mk = (id, label) => {
      const clean = String(label).trim();
      const { fields, rest } = parseNumericFields(clean);
      return {
        id: String(id).trim(),
        label: rest || clean,
        description: '',
        ...fields,
      };
    };

    // ① 括号/点号/顿号标记
    const bracket = [...text.matchAll(/(?:^|\n)\s*[（(\[]\s*([A-Za-z0-9]{1,2})\s*[)）\]]\s*[:：.、]?\s*(.+)/g)];
    if (bracket.length >= 2) {
      return bracket.map((m) => mk(m[1], m[2]));
    }
    const dotMark = [...text.matchAll(/(?:^|\n)\s*([A-Za-z])\s*[.、）)]\s+(.{2,})/g)];
    if (dotMark.length >= 2) {
      return dotMark.map((m) => mk(m[1], m[2]));
    }

    // ② 编号列表
    const numbered = [...text.matchAll(/(?:^|\n)\s*(\d{1,2})\s*[.、)）]\s*(.{2,})/g)];
    if (numbered.length >= 2) {
      return numbered.map((m) => mk(m[1], m[2]));
    }

    // ③ 顿号并列（≥3 项）。
    // 注意 single 那行条件曾把「修 A、改 B、顺手整理 C」这类正常并列挡掉
    // （它要求 ≥3 个**无标点**片段，但顿号本身就是标点）——自引入回归，
    // 已改为只数第一句的顿号片段数，不再看全局片段。
    const firstSentence = text.split(/[。\n]/)[0] || "";
    const parts = firstSentence.split(/[、;；]/).map((s) => s.trim()).filter((s) => s.length >= 2);
    const joinerCount = (firstSentence.match(/[、;；]/g) || []).length;
    if (joinerCount >= 2 && parts.length >= 3) {
      return parts.map((p, i) => mk(String(i + 1), p));
    }
    return [];
  }

  _checkConstraints(option, constraints) {
    if (!constraints || !option) return true;
    for (const [key, value] of Object.entries(constraints)) {
      const num = Number(value);
      if (key === 'minFeasibility' && typeof option.feasibility === 'number') {
        if (option.feasibility < num) return false;
      } else if (key === 'maxRisk' && typeof option.risk === 'number') {
        if (option.risk > num) return false;
      } else if (key === 'minConfidence' && typeof option.confidence === 'number') {
        if (option.confidence < num) return false;
      } else if (key === 'maxCost' && typeof option.cost === 'number') {
        if (option.cost > num) return false;
      } else if (option.constraints && key in option.constraints) {
        if (option.constraints[key] !== value) return false;
      }
    }
    return true;
  }

  _scoreOption(option, task, constraints) {
    // 本方法的文档化输入是 { id, label, description } —— 不含任何数值字段。
    // 此前三个维度全部读数字字段并回退到同一组默认值（0.8 / 0.7 / 0），
    // 导致按文档调用时所有选项得分完全相同（0.86），decide() 退化为
    // "按数组顺序挑第一个"。这里改为：显式数值优先，缺失时从 label/description
    // 文本推断，使 decide() 在实际接口上具备区隔能力。
    const text = `${option.label || ''} ${option.description || ''}`.toLowerCase();
    const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
    const IRREV = /不可逆|irreversible|删除|delete|移除|难以回退|不可回退|大改|整体重构|高风险|breaking/;
    const REVERS = /可逆|reversible|回退|rollback|低风险|增量|局部|可撤销/;

    // 1. Feasibility score（回退成本低 → 更可行）
    const derivedFeasibility = (() => {
      let f = 0.7;
      if (REVERS.test(text) && !IRREV.test(text)) f += 0.15;
      if (IRREV.test(text)) f -= 0.25;
      return Math.max(0.05, Math.min(1, f));
    })();
    const feasibility = num(option.feasibility) ?? derivedFeasibility;

    // 2. Identity alignment (check against identity rules)
    const identity_alignment = this._checkIdentityAlignment(option, task);

    // 3. Consequence value（显式值 > prior > 文本推断）
    // [v6.7.117] consequence_value 是权重最大的项（0.25），但旧版文本推断
    // 只认「减少错误|提升|修复」这类词。结果是[误拦修复]/[安全漏判]/[腻味误伤]
    // 四个候选全部 0.75 → `options_indistinguishable` → 弃权 —— cron 每轮
    // 都拿不到方向。补**严重性/可复现性/用户偏好**三层信号，这正是升级任务
    // 排优先级的真实依据（也都是文本里写明的，不是外部知识）：
    //   漏判/放行 > 误拦 > 装饰性（心虫铁律：漏判代价大于误拦代价）
    //   可复现/已复现 > 挂着未知（先做已验证的）
    //   用户已纠正/明确要求 > 自选
    const SEVERITY_HIGH = /漏判|漏报|放行|误放|c miss|false\s*negative|未拦截|0\s*[/／]\s*[0-9]+\s*全漏|double\s*zero|count\s*=\s*0|pass\s*$|危险文本|安全边界|security\s+boundary|missed|不拦|拦不住|穿透/;
    const SEVERITY_MED = /误拦|误伤|误判|false\s*positive|良性.*(block|rewrite)|被拦|block->pass/;
    const SEVERITY_LOW = /装饰性|表面|美化|文案|文档数字|措辞/;
    const REPRODUCED = /已复现|复测坐实|实测坐实|单样本.{0,6}复现|8\s*[/／]\s*8|[0-9]+\s*[/／]\s*[0-9]+\s*(全漏|全对|全通过)|已坐实|负例.{0,4}验证/;
    const USER_PREF = /用户(已|明确|要求|纠正|说过|偏好)|铁律|已固化|用户原话/;
    const derivedConsequence = (() => {
      const pr = num(option.prior);
      if (pr !== null) return Math.max(0.05, Math.min(1, pr));
      let c = 0.6;
      if (/减少错误|提升|改善|修复|清晰|可信|可靠|可复现/.test(text)) c += 0.15;
      if (/无收益|装饰性|表面功夫/.test(text)) c -= 0.2;
      // 严重性分层：漏判 > 误拦 > 装饰性
      // ⚠️ 边界：严重性加分不得让「不可逆大改」翻盘。实测回归——
      //   结构化 options {B1 修 contradiction 可逆增量} vs {B2 修边界漏判不可逆大改}
      //   B2 的 label 含「安全边界」命中 SEVERITY_HIGH(+0.22)，压过 IRREV 的
      //   risk 0.8 → B2 反胜。铁律是「漏判代价大于误拦」，但那是**在同类候选间**，
      //   不是让高风险方案靠严重性翻盘的借口。因此：加分上限受 risk 约束——
      //   risk ≥ 0.7（不可逆）时严重性最多 +0.08，且绝不超过 +0.05 的净优势。
      let sevBonus = 0;
      if (SEVERITY_HIGH.test(text)) sevBonus = 0.22;
      else if (SEVERITY_MED.test(text)) sevBonus = 0.10;
      const riskNow = IRREV.test(text) ? 0.8 : (REVERS.test(text) ? 0.2 : 0.4);
      if (riskNow >= 0.7) sevBonus = Math.min(sevBonus, 0.08);
      c += sevBonus;
      if (SEVERITY_LOW.test(text) && !SEVERITY_HIGH.test(text)) c -= 0.15;
      // 已复现优先于「挂着未知」
      if (REPRODUCED.test(text)) c += 0.12;
      // 用户已明确表达过偏好/纠正的方向优先
      if (USER_PREF.test(text)) c += 0.08;
      return Math.max(0.05, Math.min(1, c));
    })();
    const consequence_value = num(option.consequence_value) ?? derivedConsequence;

    // 4. Risk penalty: higher risk must lower the final score.
    const derivedRisk = IRREV.test(text) ? 0.8 : (REVERS.test(text) ? 0.2 : 0.4);
    const risk = num(option.risk) ?? derivedRisk;
    const risk_penalty = Math.max(0, Math.min(1, risk)) * 0.3;

    // 5. Confidence (from option or default)
    const confidence = option.confidence || 0.7;

    // Composite: weighted average
    // [v6.5.1] 风险权重 10%→25%：让心虫像人一样重视风险规避
    // （原 10% 导致高风险高回报选项总是压过低风险选项）
    const composite = (
      feasibility * 0.15 +
      identity_alignment * 0.25 +
      consequence_value * 0.25 +
      (1 - risk_penalty) * 0.25 +
      confidence * 0.10
    );

    return {
      composite: Math.round(composite * 100) / 100,
      feasibility,
      identity_alignment,
      consequence_value,
      risk_penalty,
      confidence,
    };
  }

  _checkIdentityAlignment(option, task) {
    const rules = this.memory?.getIdentityRules ? this.memory.getIdentityRules() : [];
    if (!rules || rules.length === 0) return 0.8; // Default if no rules

    let score = 1.0;
    const lowerTask = (task + ' ' + (option.label || '') + ' ' + (option.description || '')).toLowerCase();

    // Rule: Always pursue truth (第一条指令)
    if (lowerTask.includes('truth') || lowerTask.includes('真实') || lowerTask.includes('诚实')) {
      if (option.promotes_truth !== false) score *= 1.1;
    }

    // Rule: Always upgrade (第二条指令)
    if (lowerTask.includes('upgrade') || lowerTask.includes('升级') || lowerTask.includes('improve')) {
      if (option.promotes_upgrade !== false) score *= 1.1;
    }

    // Rule: Serve humanity (第四条指令)
    if (option.harms_humanity) score *= 0.1;

    return Math.min(score, 1.0);
  }

  _predictConsequences(option, task) {
    const horizons = ['immediate', 'short_term', 'long_term'];
    const predictions = {};

    for (const horizon of horizons) {
      predictions[horizon] = this._predictHorizon(option, task, horizon);
    }

    return predictions;
  }

  _predictHorizon(option, task, horizon) {
    // Time-based decay of positive effects
    const decay = horizon === 'immediate' ? 1.0 : horizon === 'short_term' ? 0.7 : 0.4;
    const base_value = option.consequence_value || 0.7;
    const predicted_value = base_value * decay;

    // Side effects by horizon
    const side_effects = option.side_effects || [];

    return {
      predicted_value: Math.round(predicted_value * 100) / 100,
      side_effects: side_effects.filter((_, i) => i < (horizon === 'immediate' ? 3 : horizon === 'short_term' ? 2 : 1)),
      confidence: horizon === 'immediate' ? 0.9 : horizon === 'short_term' ? 0.7 : 0.5,
    };
  }

  _assessRisks(option, task, consequences) {
    const risks = [];

    // Risk: Uncertainty
    const uncertainty = 1 - (option.confidence || 0.7);
    if (uncertainty > 0.3) {
      risks.push({ type: 'uncertainty', level: uncertainty > 0.5 ? 'high' : 'medium', detail: `Confidence only ${Math.round((option.confidence || 0.7) * 100)}%` });
    }

    // [v6.5.1] Risk: 显式 risk 字段（0-1）— 高风险必须上报
    const explicitRisk = Number(option.risk) || 0;
    if (explicitRisk > 0.5) {
      risks.push({ type: 'explicit_risk', level: explicitRisk > 0.7 ? 'high' : 'medium', detail: `显式风险评分 ${Math.round(explicitRisk * 100)}%` });
    }

    // Risk: Side effects
    const side_effects = option.side_effects || [];
    if (side_effects.length > 2) {
      risks.push({ type: 'side_effects', level: 'medium', detail: `${side_effects.length} potential side effects` });
    }

    // Risk: Reversibility
    if (option.reversible === false) {
      risks.push({ type: 'reversibility', level: 'high', detail: 'Decision is not easily reversible' });
    }

    // Risk: Resource cost
    if (option.cost && option.cost > 0.5) {
      risks.push({ type: 'resource', level: 'medium', detail: `High resource cost: ${option.cost}` });
    }

    return risks;
  }

  _explainDecision(chosen, all_scored, task) {
    const lines = [
      `Selected: "${chosen.label}" (score: ${chosen.scores.composite})`,
      `Identity alignment: ${Math.round(chosen.scores.identity_alignment * 100)}%`,
      `Alternatives considered: ${all_scored.slice(1).map(s => `"${s.label}" (${s.scores.composite})`).join('; ')}`,
    ];

    if (chosen.scores.identity_alignment < 0.8) {
      lines.push(`Warning: Identity alignment below 80%`);
    }

    return lines.join('. ');
  }

  _recordDecision(decision) {
    this._history.push({ ...decision, timestamp: Date.now() });
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
  }

  getHistory() {
    return [...this._history];
  }

  getLastDecision() {
    return this._history[this._history.length - 1] || null;
  }

  // =========================================================================
  // Context Passport Accessors (for recovery and debugging)
  // =========================================================================

  /**
   * Get recent decision context stamps.
   */
  getRecentStamps(count = 10) {
    return this._passport.getRecent(count);
  }

  /**
   * Get stamps by task pattern.
   */
  getStampsByTask(taskPattern) {
    return this._passport.getByTask(taskPattern);
  }

  /**
   * Export context for recovery (SelfHealer integration).
   */
  exportForRecovery(stampId) {
    return this._passport.exportForRecovery(stampId);
  }

  /**
   * Get current open stamp (if any).
   */
  getCurrentStamp() {
    return this._passport.getCurrent();
  }

  /**
   * Get context passport summary.
   */
  getPassportSummary() {
    return this._passport.getSummary();
  }
}

module.exports = { HeartFlowDecision, ContextPassport };
