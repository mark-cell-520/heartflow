/**
 * InferenceChain — 推理链构建与校验引擎 v1.0.0
 *
 * [r278 接线] 此前本文件是自动生成的 stub（422B，process() 恒返回
 * 'inference-chain stub: not implemented'），在 heartflow.js / engine-constructor.js
 * 两处 lazy 注册加载，但全仓零 dispatch、零 MCP 工具 —— 即「已加载但从未
 * dispatch 的能力」（真升级③）。
 *
 * 与既有模块的边界（刻意不重复造轮子）：
 *   - logic-reasoning.js：判文本含哪种逻辑谬误（辨别层，只管判对错）；
 *   - causal-inference.js：因果图构建与反事实检索；
 *   - 本 InferenceChain：管 **一条论证链的显式构建与逐环节有效性校验** ——
 *     把「前提→结论」拆成有序步骤，逐步判定：
 *     ① 每步的推理形式是否合法（演绎有效式 / 归纳强度 / 溯因解释力）；
 *     ② 步骤间是否存在跳跃（结论用了前提里没出现的概念且未声明假设）；
 *     ③ 整链的结论置信度传播（前提置信度 × 各步保留率）。
 *
 * 支持的推理形式（纯规则判定，零 LLM）：
 *   - deductive: modus ponens / modus tollens / hypothetical syllogism /
 *     disjunctive syllogism / categorical syllogism（含中项不周延检测）
 *   - inductive: 枚举归纳强度（样本覆盖度 × 样本量）
 *   - abductive: 溯因解释力（候选解释对现象的证据覆盖）
 *
 * 只用 Node 内置模块，零 npm 依赖，不引 LLM。
 */

const VERSION = '1.0.0';

const STEP_TYPE = {
  PREMISE: 'premise',
  INFERENCE: 'inference',
  CONCLUSION: 'conclusion',
  ASSUMPTION: 'assumption',   // 显式假设（跳跃处必须声明）
};

const REASONING_FORM = {
  DEDUCTIVE: 'deductive',
  INDUCTIVE: 'inductive',
  ABDUCTIVE: 'abductive',
  ANALOGICAL: 'analogical',
  UNKNOWN: 'unknown',
};

// 演绎有效式模板（逻辑连接词形态，中英）
const VALID_FORMS = [
  { id: 'modus_ponens',       requires: { if: true, then: true, affirms: 'antecedent' } },
  { id: 'modus_tollens',      requires: { if: true, then: true, denies: 'consequent' } },
  { id: 'hypothetical_syll',  requires: { chain: true } },
  { id: 'disjunctive_syll',   requires: { or: true, denies: 'one_disjunct' } },
];

// 逻辑连接词
const CONNECTIVES = {
  conditional_zh: ['如果', '若', '假如', '倘若', '要是'],
  conditional_en: ['if', 'when', 'whenever', 'unless', 'provided that'],
  // [r282] then_en 补情态/将来时收尾形。英文条件句的 then 常由情态动词或
  // 将来时承载（"If it rains, the ground will be wet" / "access must be denied"），
  // 旧表只有 then/so/therefore/thus，导致这类最标准的英文条件句
  // _splitConditional 恒返 null（r282 探针实证：EN 侧否定前件 3/3 全漏判的根因之一）。
  then_zh: ['则', '那么', '就', '便会', '将会'],
  then_en: ['then', 'so', 'therefore', 'thus',
    'will be', 'will have', 'will', 'would be', 'would have', 'would',
    'must be', 'must', 'should be', 'should', 'can be', 'can', 'could be', 'could',
    'is going to', 'are going to', 'has to', 'have to'],
  or_zh: ['或者', '或', '要么'],
  or_en: ['or', 'either'],
  neg_zh: ['不', '没', '无', '非', '未', '并非', '并不'],
  neg_en: ['not', 'never', 'cannot', "doesn't", "don't", "isn't", "aren't", "no"],
};

// 常见无效式（谬误）—— 判定为 invalid 时给出理由
const INVALID_FORMS = [
  { id: 'affirming_consequent', zh: '肯定后件', en: 'affirming the consequent' },
  { id: 'denying_antecedent',   zh: '否定前件', en: 'denying the antecedent' },
];

// 结论标记（结论段切分用）
const CONC_MARKERS_ZH = ['所以', '因此', '因而', '故', '于是', '由此可见', '这说明', '这表明', '即'];
const CONC_MARKERS_EN = ['therefore', 'thus', 'hence', 'so', 'consequently', 'it follows', 'this means', 'this shows'];

// 因标记（给定段切分用）
const GIVEN_MARKERS_ZH = ['因为', '由于', '鉴于', '既然'];
const GIVEN_MARKERS_EN = ['because', 'since', 'given that', 'as'];

// 非内容词（逻辑连接词/否定词）——跳跃检测时不得计为「新概念」，
// 否则「因为灯没亮，所以电路不正常」会误判为引入新概念（r278 矩阵实测修复）
// [r278 续] 回指照应语（anaphora）：指回已出现前提的照应成分，
// 否则「战争由资源争夺引起 / 战争也由意识形态对立引起 / **这两方面**共同导致冲突」
// 这类正确的多因陈述会被判为新概念跳跃（r278 e2e 矩阵实测误伤 1/5 后修复）
const NON_CONTENT_ZH = new Set([
  '因为', '由于', '所以', '因此', '因而', '于是', '如果', '假如', '倘若', '要是',
  '那么', '则', '并且', '而且', '或者', '要么', '不是', '没有', '并非', '并不',
  '不会', '不能', '无法', '可见', '说明', '表明', '由此', '鉴于', '既然', '从',
  '在上', '在下', '而言', '来说', '来看',
  // 回指照应语（2-gram 形态：_extractKeywords 中文侧按 slice(i, i+2) 切词，
  // 故表中项必须是恰好 2 字，3 字以上写法永不被命中）：
  // 指回前文前提的照应成分，不构成新概念
  '这两', '两个', '两方', '双方', '二者', '两者', '这几', '几个',
  '这些', '那些', '上述', '前述', '以上', '如前', '该', '此',
  '它们', '他们', '她们', '此类', '这种', '那种', '这一', '那一',
  '这点', '那点', '这方', '那方', '这道', '那道', '各自', '统统',
]);
const NON_CONTENT_EN = new Set([
  'because', 'since', 'therefore', 'thus', 'hence', 'consequently', 'so',
  'if', 'then', 'when', 'whenever', 'unless', 'and', 'but', 'or', 'not',
  'no', 'never', 'given', 'that', 'this', 'it', 'its', 'as', 'of', 'to',
  'in', 'on', 'at', 'by', 'for', 'with', 'from', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'does', 'did', 'do', 'will', 'would', 'can', 'could',
]);

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'of', 'to', 'in', 'on',
  'at', 'by', 'for', 'with', 'from', 'that', 'this', 'it', 'and', 'or', 'but',
  '的', '了', '是', '在', '和', '与', '及', '对', '为', '以', '于', '这', '那', '其', '之',
]);

// [r280] 规范/行动导向结论标记：前提→行动指令的正当转写（不声称新事实）
const NORMATIVE_ZH = ['需要', '应当', '应该', '必须', '需要重新', '有必要', '需重', '应重',
  '建议', '宜', '须', '理应', '亟需', '亟待', '要重', '重新评估', '重新审视', '重新考虑',
  '加以', '予以', '做出', '采取', '加强', '改进', '优化', '调整', '控制', '规避', '防范'];
const NORMATIVE_EN = ['need', 'needs', 'should', 'must', 'ought', 'require', 'requires',
  'reassess', 'reevaluate', 'revisit', 'recommend', 'suggest', 'consider', 'adjust',
  'improve', 'mitigate', 'address', 'prioritize'];

// [r280] 归纳泛化上位词：结论用这些词把「样本实例」概括为「总体判断」时，
// 属于归纳的正当收尾而非无依据跳跃。攻击族的 novel 概念是全新专名，
// 不会恰好由这些上位词构成。
const HYPERNYM_ZH = ['产品', '整体', '总体', '全部', '所有', '批次', '合格率', '平均',
  '大多', '多数', '通常', '一般', '普遍', '总体而言', '整体上', '概率', '比例', '率很'];
const HYPERNYM_EN = ['product', 'overall', 'general', 'generally', 'most', 'majority',
  'average', 'rate', 'ratio', 'typically', 'usually', 'tend', 'likely'];

class InferenceChain {
  constructor(options = {}) {
    this.version = VERSION;
    this.name = 'inference-chain';
    this.config = {
      minPremiseConfidence: options.minPremiseConfidence || 0.3,
      jumpPenalty: options.jumpPenalty || 0.25,           // 每处未声明跳跃的置信度惩罚
      assumptionPenalty: options.assumptionPenalty || 0.1, // 显式假设的折扣
      maxSteps: options.maxSteps || 50,
    };
    /** @type {Map<string, Object>} chainId → chain */
    this.chains = new Map();
    this._seq = 0;
    this.history = [];
  }

  // ─── 链构建 ─────────────────────────────────────────────────────────────

  /**
   * 创建一条推理链
   * @param {string} question - 待论证的问题/主张
   * @returns {Object} { id, question, steps: [], createdAt }
   */
  createChain(question = '') {
    const id = `c${++this._seq}`;
    const chain = {
      id,
      question,
      steps: [],
      createdAt: Date.now(),
      analysis: null,
    };
    this.chains.set(id, chain);
    return { ok: true, id, question, steps: [], createdAt: chain.createdAt };
  }

  /**
   * 向链中追加一步
   * @param {string} chainId
   * @param {Object} step - { type, text, confidence, form }
   * @returns {Object} { ok, stepIndex, stepId }
   */
  addStep(chainId, step = {}) {
    const chain = this.chains.get(chainId);
    if (!chain) return { ok: false, reason: `推理链不存在: ${chainId}` };
    if (chain.steps.length >= this.config.maxSteps) {
      return { ok: false, reason: `步骤数已达上限（${this.config.maxSteps}）` };
    }
    const type = step.type || STEP_TYPE.INFERENCE;
    if (!Object.values(STEP_TYPE).includes(type)) {
      return { ok: false, reason: `未知步骤类型: ${type}` };
    }
    if (typeof step.text !== 'string' || !step.text.trim()) {
      return { ok: false, reason: 'step.text 必须是非空字符串' };
    }
    const entry = {
      stepId: `${chainId}-s${chain.steps.length + 1}`,
      index: chain.steps.length,
      type,
      text: step.text.trim(),
      form: step.form || this._sniffForm(step.text),
      confidence: this._normConf(step.confidence),
      declaredAssumption: !!step.declaredAssumption,
    };
    chain.steps.push(entry);
    chain.analysis = null;   // 结构变化，作废旧分析
    return { ok: true, stepId: entry.stepId, stepIndex: entry.index, form: entry.form };
  }

  /**
   * 显式声明某步依赖的假设（用于消除跳跃判定的误伤）
   * @param {string} chainId
   * @param {string} stepId
   * @param {string} assumptionText
   */
  declareAssumption(chainId, stepId, assumptionText) {
    const chain = this.chains.get(chainId);
    if (!chain) return { ok: false, reason: `推理链不存在: ${chainId}` };
    const step = chain.steps.find(s => s.stepId === stepId);
    if (!step) return { ok: false, reason: `步骤不存在: ${stepId}` };
    step.assumption = assumptionText;
    step.declaredAssumption = true;
    chain.analysis = null;
    return { ok: true, stepId, assumption: assumptionText };
  }

  // ─── 链校验（本模块核心能力）───────────────────────────────────────────

  /**
   * 分析整条链：逐步有效性 + 跳跃检测 + 结论置信度传播
   * @param {string} chainId
   * @returns {Object} 分析报告；链不存在时返回 { ok:false, reason }
   */
  analyze(chainId) {
    const chain = this.chains.get(chainId);
    if (!chain) return { ok: false, valid: false, reason: `推理链不存在: ${chainId}` };
    if (chain.steps.length === 0) {
      return { ok: false, valid: false, reason: '推理链为空：无步骤可分析' };
    }

    const premises = chain.steps.filter(s => s.type === STEP_TYPE.PREMISE);
    const inferences = chain.steps.filter(s => s.type === STEP_TYPE.INFERENCE);
    const assumptions = chain.steps.filter(s => s.type === STEP_TYPE.ASSUMPTION);
    const conclusions = chain.steps.filter(s => s.type === STEP_TYPE.CONCLUSION);

    if (premises.length === 0) {
      const report = this._report(chain, [], [], {
        jumps: [], valid: false, reason: '链中没有前提（premise）步骤：任何结论都无依据',
      });
      return report;
    }
    if (conclusions.length === 0) {
      const report = this._report(chain, [], [], {
        jumps: [], valid: false, reason: '链中没有结论（conclusion）步骤：论证未收口',
      });
      return report;
    }

    const premiseKw = new Set();
    const premiseCharSet = new Set();
    for (const p of premises) {
      for (const k of this._extractKeywords(p.text)) premiseKw.add(k);
      for (const ch of (p.text.match(/[\u4e00-\u9fa5]/g) || [])) premiseCharSet.add(ch);
    }

    // 逐推理步判定
    const stepResults = [];
    let retain = 1;              // 置信度保留率（各步连乘）
    const jumps = [];

    for (const step of inferences) {
      const evalResult = this._evalInferenceStep(step, premiseKw, premises, premiseCharSet);
      stepResults.push(evalResult);
      if (!evalResult.valid) {
        retain *= Math.max(0, 1 - this.config.jumpPenalty);
      } else {
        retain *= evalResult.retainRate;
      }
      if (!evalResult.valid && !step.declaredAssumption) {
        jumps.push({
          stepId: step.stepId,
          text: step.text.slice(0, 80),
          missing: evalResult.missing || [],
          reason: evalResult.reason,
        });
      }
    }

    // 假设步显式折扣
    for (const a of assumptions) retain *= Math.max(0, 1 - this.config.assumptionPenalty);

    // 前提置信度聚合（取最小值——链的强度不高于最弱前提）
    const minPremiseConf = Math.min(...premises.map(p => p.confidence));
    const finalConfidence = Number((minPremiseConf * retain).toFixed(4));
    const conclusion = conclusions[conclusions.length - 1];

    const valid = stepResults.length > 0
      ? stepResults.every(r => r.valid)
      : true;
    // 无推理步但有前提和结论 = 直接断言，记为弱有效（结论只是重述前提）
    const weakDirect = inferences.length === 0;

    const report = this._report(chain, stepResults, jumps, {
      valid: valid || weakDirect,
      weakDirect,
      finalConfidence,
      minPremiseConfidence: minPremiseConf,
      retainRate: Number(retain.toFixed(4)),
      conclusion: conclusion.text,
      inferenceCount: inferences.length,
      premiseCount: premises.length,
      assumptionCount: assumptions.length,
    });
    chain.analysis = report;
    this.history.push({ chainId, valid: report.valid, confidence: report.finalConfidence, at: Date.now() });
    return report;
  }

  /**
   * 展开链：为当前链建议缺失的中间步骤（规则式：找结论与前提间的概念差集）
   * @param {string} chainId
   * @returns {Object} { ok, suggestions: [] }
   */
  expandChain(chainId) {
    const chain = this.chains.get(chainId);
    if (!chain) return { ok: false, reason: `推理链不存在: ${chainId}` };
    const premises = chain.steps.filter(s => s.type === STEP_TYPE.PREMISE);
    const conclusions = chain.steps.filter(s => s.type === STEP_TYPE.CONCLUSION);
    if (!premises.length || !conclusions.length) {
      return { ok: false, reason: '需要至少 1 个前提 + 1 个结论才能展开' };
    }
    const pKw = new Set();
    for (const p of premises) for (const k of this._extractKeywords(p.text)) pKw.add(k);
    const cKw = this._extractKeywords(conclusions[0].text).filter(k => !pKw.has(k));
    const suggestions = cKw.map(k => ({
      missingConcept: k,
      hint: `结论用到「${k}」但前提未出现：需补一条桥接前提，或用 declareAssumption 显式声明为假设`,
    }));
    return { ok: true, chainId, suggestions, missingConcepts: cKw };
  }

  getChain(chainId) {
    const chain = this.chains.get(chainId);
    if (!chain) return null;
    return {
      id: chain.id, question: chain.question, steps: chain.steps.slice(),
      createdAt: chain.createdAt, analysis: chain.analysis,
    };
  }

  getStats() {
    return {
      totalChains: this.chains.size,
      totalSteps: [...this.chains.values()].reduce((s, c) => s + c.steps.length, 0),
      analyzed: this.history.length,
      validChains: this.history.filter(h => h.valid).length,
      avgConfidence: this.history.length
        ? Number((this.history.reduce((s, h) => s + h.confidence, 0) / this.history.length).toFixed(4))
        : null,
      version: VERSION,
    };
  }

  clear() {
    this.chains.clear();
    this.history = [];
    this._seq = 0;
  }

  // ─── 内部实现 ───────────────────────────────────────────────────────────

  _report(chain, stepResults, jumps, extra) {
    return {
      ok: true,
      chainId: chain.id,
      question: chain.question,
      stepCount: chain.steps.length,
      steps: stepResults,
      jumps,
      ...extra,
      timestamp: Date.now(),
    };
  }

  /**
   * 单推理步有效性判定
   * @param {Object} step - 待判定步骤
   * @param {Set<string>} premiseKw - 前提关键词并集
   * @param {Array<Object>} premises - 前提步骤对象数组（用于无效式跨步比对）
   * @param {Set<string>} [premiseCharSet] - 前提文本的单字集合（中文单字级继承豁免用）
   * 规则：该步文本必须能由「前提概念 + 逻辑形式」支撑。
   *  - 演绎：检出条件/选言/连锁结构，且判定为有效式（非肯定后件/否定前件）
   *  - 归纳/溯因/类比：只要不是纯断言（含推理标记词），记为有效但保留率 <1
   */
  _evalInferenceStep(step, premiseKw, premises = [], premiseCharSet = null) {
    const text = step.text;
    const lower = text.toLowerCase();
    const hasCond = this._hasAny(text, CONNECTIVES.conditional_zh) || this._hasAny(lower, CONNECTIVES.conditional_en);
    const hasThen = this._hasAny(text, CONNECTIVES.then_zh) || this._hasAny(lower, CONNECTIVES.then_en);
    const hasOr = this._hasAny(text, CONNECTIVES.or_zh) || this._hasAny(lower, CONNECTIVES.or_en);
    const hasNeg = this._hasAny(text, CONNECTIVES.neg_zh) || this._hasAny(lower, CONNECTIVES.neg_en);

    // 概念支撑检查：步骤新概念是否都在前提里出现
    const stepKw = this._extractKeywords(text);
    const novel = stepKw.filter(k => !premiseKw.has(k));
    const novelRatio = stepKw.length ? novel.length / stepKw.length : 0;

    // 无效式硬判定：跨步比对条件前提的前件/后件（先于跳跃规则，理由更精确）
    const invalidForm = this._detectInvalidFormAcross(step, premises);
    if (invalidForm) {
      return {
        stepId: step.stepId, valid: false, form: step.form, retainRate: 0,
        missing: [], fallacy: invalidForm.id,
        reason: `条件推理踩无效式：${invalidForm.zh}（${invalidForm.en}）`,
      };
    }

    // 判定为无效的硬条件
    // r280 补腿：中文侧「单字级继承」豁免。
    // 根因：_extractKeywords 的中文 2-gram 切分在「结论段用近义字复述前提」时
    //   novelRatio 恒 1.00（如前提「样本全部通过测试」→ 结论「产品合格率很高」，
    //   语义继承但无字面 2-gram 重叠），383 行硬判定把良性归纳误伤为无依据跳跃。
    //   修法：2-gram 全novel 时，回退看单字级重叠；单字继承比例 ≥0.55 视为有字面
    //   继承，豁免跳跃判定（攻击样本的裸名词族单字级同样全 novel，不受影响）。
    let inheritedByChar = false;
    // [r282] 次级豁免：弱字面继承。前提与步骤只共享 1-2 个汉字（如 B-5「下雨」的「下」、
    // B-6「地面」的「地」）时，2-gram 侧 novelRatio 仍 0.88~1.00，但这不是无依据跳跃——
    // 溯因/反驳句式（「地面湿是因为下雨」「不一定是没下雨」）本就复述前提实体而非整体承接。
    // 攻击族的裸名词跳跃字面共享恒为 0（探针实证 0/16），故本腿只收共享 ≥2 字且比例 ≥0.1 者，
    // 精确隔开攻击族而不放它进来。
    let weakCharInherit = false;
    if (novelRatio > 0.7 && !step.declaredAssumption) {
      const stepChars = new Set((text.match(/[\u4e00-\u9fa5]/g) || []));
      if (stepChars.size > 0 && premiseCharSet && premiseCharSet.size > 0) {
        let hit = 0;
        for (const ch of stepChars) if (premiseCharSet.has(ch)) hit++;
        const ratio = hit / stepChars.size;
        inheritedByChar = ratio >= 0.55;
        weakCharInherit = hit >= 2 && ratio >= 0.10;
      }
    }
    // [r280] 第三腿豁免：规范/行动导向结论。归纳的正当收尾与规范性建议
    // （「需要重新评估资源分配与排期」「应当提高合格率」）本质是把前提
    // 转写为行动指令，2-gram 与单字都可能是全 novel，但它不声称任何
    // 新事实，故不构成无依据跳跃。攻击族的裸名词跳跃不具备此形态
    // （「斯克兰顿实控财团暗网节点共识机制」是名词短语堆砌，非行动指令）。
    const isNormative = this._isNormativeConclusion(text);
    // [r280] 第四腿豁免：归纳泛化。从「这批样本通过测试」推出「该产品
    // 合格率高」是归纳的标准收尾——结论用上位类别词（产品/整体/总体/
    // 合格率/平均）概括前提中的样本实例，字面全 novel 但语义合法。
    // 攻击族不具此形态：其 novel 概念是全新专有名词，不含任何上位词。
    const isGeneralization = this._isInductiveGeneralization(text, novel);
    // [r282] 第五腿豁免：多因陈述（r281 矩阵第 5 缺口 FALSE+ 修复）
    const isMultiCause = this._isMultiCauseStatement(text, novel, premiseCharSet);
    if (novelRatio > 0.7 && !step.declaredAssumption && !inheritedByChar
        && !isNormative && !isGeneralization && !isMultiCause && !weakCharInherit) {
      return {
        stepId: step.stepId, valid: false, form: step.form, retainRate: 0,
        missing: novel.slice(0, 5),
        reason: `步骤引入 ${novel.length} 个前提中不存在的新概念（占比 ${(novelRatio * 100).toFixed(0)}%），构成无依据跳跃`,
      };
    }

    // 条件句：检查是否踩无效式
    if (hasCond && hasThen) {
      const invalid = this._detectInvalidForm(text, lower, hasNeg);
      if (invalid) {
        return {
          stepId: step.stepId, valid: false, form: step.form, retainRate: 0,
          missing: [],
          reason: `条件推理踩无效式：${invalid.zh}（${invalid.en}）`,
        };
      }
      return { stepId: step.stepId, valid: true, form: REASONING_FORM.DEDUCTIVE, retainRate: 0.95 };
    }

    if (hasOr) {
      return { stepId: step.stepId, valid: true, form: REASONING_FORM.DEDUCTIVE, retainRate: 0.9 };
    }

    // 非演绎：归纳/溯因/类比，给部分保留率
    const form = step.form !== REASONING_FORM.UNKNOWN ? step.form : this._sniffForm(text);
    const retain = form === REASONING_FORM.INDUCTIVE ? 0.8
      : form === REASONING_FORM.ABDUCTIVE ? 0.7
      : form === REASONING_FORM.ANALOGICAL ? 0.65 : 0.75;
    return { stepId: step.stepId, valid: true, form, retainRate: retain };
  }

  /**
   * 跨步无效式检测：拿「前提中的条件句」与该步的推理方向比对。
   *
   * 肯定后件 (affirming the consequent)：
   *   前提「如果A那么B」 + 本步「（因为B）所以A」 → 无效
   * 否定前件 (denying the antecedent)：
   *   前提「如果A那么B」 + 本步「（因为不A）所以不B」 → 无效
   *
   * 实现：把条件前提切成 前件段/后件段；把本步按 因标记/果标记 切成
   * 给定段/结论段，再用字符级重叠（比 2-gram 集合相交稳健）比对方向。
   */
  _detectInvalidFormAcross(step, premises) {
    const split = this._splitGivenConcluded(step.text);
    if (!split) return null;
    const { given, concluded, givenNeg, concludedNeg } = split;
    if (!concluded) return null;

    for (const p of premises) {
      const parsed = this._splitConditional(p.text);
      if (!parsed) continue;
      const { antecedent, consequent } = parsed;

      const givenHitsConsequent = given ? this._hitsSegment(given, consequent) : false;
      const givenHitsAntecedent = given ? this._hitsSegment(given, antecedent) : false;
      const concludedHitsConsequent = this._hitsSegment(concluded, consequent);
      const concludedHitsAntecedent = this._hitsSegment(concluded, antecedent);

      // [r280] 前件被「另一条独立前提」否定（否定前件的标准三段式：
      //   p1: 如果A那么B / p2: 不A / step: 所以不B）—— given 段为空，
      //   需跨前提找否定。_negatedByOther 同时承担肯定后件的「后件被断言」侧。
      const otherNegatesAntecedent = this._negatedByOther(premises, antecedent, p);
      const otherNegatesConsequent = this._negatedByOther(premises, consequent, p);

      // 给定后件 → 推出前件 = 肯定后件（无效）
      if (concludedHitsAntecedent && !concludedNeg &&
          (givenHitsConsequent || (!given && this._assertedByOther(premises, consequent, p)))) {
        return INVALID_FORMS[0];
      }
      // 给定前件（被否定）→ 推出后件（被否定）= 否定前件（无效）
      // 两个来源：本步 given 段自带否定，或另一条独立前提否定了前件
      // 注意：这里只判「推出 ¬B」。¬B ⟹ ¬A 是 modus tollens（有效），
      // 与否定前件在字符重叠层面同形，故不可按 concluded 命中哪一侧区分，
      // 唯一的区分点是推出的目标段（¬B vs ¬A）。
      if (concludedNeg && concludedHitsConsequent &&
          ((givenNeg && givenHitsAntecedent) || otherNegatesAntecedent)) {
        return INVALID_FORMS[1];
      }
    }
    return null;
  }

  /**
   * 除 exclude 外的前提中，是否有另一条**否定** target（内容词重叠高且含否定词）
   *
   * [r280] 中文否定词会稀释重叠度：「他没有学习。」vs 前件「他学习」的
   * 2-gram 集合被「有学/学习」之外的碎片冲淡，_charOverlap 仅 0.375。
   * 故对「剥掉否定词后的文本」再算一次，两者取较高者——
   * 剥否定词后「他学习」与「他学习」完全重合（1.0），否定前件才抓得到。
   */
  _negatedByOther(premises, target, exclude) {
    return premises.some(p => p !== exclude
      && this._hasNeg(p.text)
      && Math.max(this._charOverlap(p.text, target), this._charOverlap(this._stripNeg(p.text), target)) >= 0.5);
  }

  /** 剥掉否定词后的文本（仅用于重叠度复算，不改动原文） */
  _stripNeg(text) {
    let s = String(text);
    for (const n of CONNECTIVES.neg_zh) s = s.split(n).join('');
    s = s.replace(/\b(does|do|did|is|are|was|were|can|could|will|would|shall|should)\s+not\b/gi, ' ');
    s = s.replace(/\b(cannot|never)\b/gi, ' ');
    s = s.replace(/\bnot\b/gi, ' ');
    return s;
  }

  /**
   * [r282] 剥掉「确定性/认知状语 + 证据来源状语」后的文本。
   *
   * 否定前件的三段式常带修饰语：
   *   EN: "It is in fact not raining at all, therefore the ground is clearly not wet."
   *   ZH: "根据最新气象预报，明天并不会下大雨，所以室外音乐节不会取消。"
   * 这类状语不含任何条件句的实质内容词，却按字符计入分母，把
   * _charOverlap(given, antecedent) 从 1.0 稀释到 0.33 / 0.21，低于 0.5 阈值
   * 而整句漏判（r282 探针实证 EN 2/3、ZH 3/3 全漏）。
   *
   * 只用于重叠度复算，绝不改动原文返回；与 _stripNeg 同构，
   * 调用方按 Math.max(overlap(raw), overlap(stripped)) 取较高者。
   * 收窄原则：只收「不含内容词的确定性副词/证据来源状语」，
   * 不收任何可能承载命题内容的修饰（如 only / just / all / always）。
   */
  _stripModifiers(text) {
    let s = String(text);
    // EN：确定性/认知副词 + 证据来源状语
    s = s.replace(/\b(in fact|as a matter of fact|clearly|obviously|apparently|evidently|seemingly|certainly|definitely|of course|needless to say|in any case|at all|by all accounts|according to [a-z ]{2,40}|based on [a-z ]{2,40}|per [a-z ]{2,40})\b/gi, ' ');
    // ZH：确定性副词
    s = s.replace(/(事实上|实际上|很显然|显然|明显|当然|毫无疑问|毋庸置疑|肯定是|一定是|的确是|确实)/g, '');
    // ZH：证据来源状语（「根据…」「据…」到最近的标点/动词前）
    s = s.replace(/根据[^，。；！？]{0,24}[，。；！？]?/g, '');
    s = s.replace(/据[^，。；！？]{0,16}(报道|显示|称|介绍|了解|统计|分析)[，。；！？]?/g, '');
    return s;
  }

  /**
   * [r282] 段间包含度判定（0.5 阈值），叠加「剥否定词 × 剥修饰语」两次复算取较高者。
   *
   * 否定前件判定要求 given 段命中 antecedent、concluded 段命中 consequent。
   * 真实语料里这两段几乎必带修饰：「in fact … at all」「clearly」
   * 「根据最新气象预报」。这些成分不含内容词，却按字符稀释重叠度，
   * 使本该 1.0 的包含度跌到 0.21–0.33 而整句漏判。
   *
   * 复算顺序与 _negatedByOther 同构（r280 已用同一模式）：
   *   max( overlap(raw),
   *        overlap(stripNeg),
   *        overlap(stripModifiers),
   *        overlap(stripNeg∘stripModifiers) ) >= 0.5
   * 只提高分子侧可比性，不降低阈值、不改原文——阈值仍是 0.5。
   */
  _hitsSegment(a, b) {
    if (!a || !b) return false;
    const negOnly = this._stripNeg(a);
    const modOnly = this._stripModifiers(a);
    const both = this._stripModifiers(this._stripNeg(a));
    const best = Math.max(
      this._charOverlap(a, b),
      this._charOverlap(negOnly, b),
      this._charOverlap(modOnly, b),
      this._charOverlap(both, b),
    );
    return best >= 0.5;
  }

  /**
   * 规范/行动导向结论判定：文本是否以「应当如何做」收尾，
   * 而非声称一个新事实。归纳的正当收尾属于此类。
   */
  _isNormativeConclusion(text) {
    if (this._hasAny(text, NORMATIVE_ZH)) return true;
    const lower = String(text).toLowerCase();
    if (this._hasAny(lower, NORMATIVE_EN)) return true;
    return false;
  }

  /**
   * 归纳泛化判定：结论的 novel 概念是否由「上位类别词」构成。
   * 「所以该批次产品的合格率很高」的 novel 2-gram 全是 产品/批次/合格率
   * 一类上位词 → 归纳泛化（合法）；「斯克兰顿实控财团暗网节点共识机制」
   * 的 novel 全是专名堆砌 → 不是泛化（仍是跳跃）。
   */
  _isInductiveGeneralization(text, novel) {
    const lower = String(text).toLowerCase();
    if (this._hasAny(text, HYPERNYM_ZH) || this._hasAny(lower, HYPERNYM_EN)) return true;
    // novel 2-gram 里出现上位词（含切碎形态，如「的合」来自「合格率」）
    if (Array.isArray(novel) && novel.length > 0) {
      const novelJoined = novel.join(' ');
      const hyperHit = HYPERNYM_ZH.filter(h => novelJoined.includes(h));
      if (hyperHit.length > 0) return true;
    }
    return false;
  }

  /**
   * [r282] 第五腿豁免：多因陈述。
   *
   * 根因（r281 矩阵第 5 缺口，多因陈述 FALSE+ 的残留形态）：
   * 跳跃判定只看「步骤关键词有多少比例在前提中出现」，而多因陈述
   * 是把前提中的单一成因**展开为多个并列成因**——新增的成因词
   * 字面全 novel，novelRatio 恒 0.79~1.00：
   *   前提「战争的历史成因包括资源争夺。」
   *   步骤「战争是多因共同造成的，既有资源争夺，也有地缘政治。」
   * → 「地缘政治」「共同」「造成」全 novel，被误判为无依据跳跃。
   * 但这是对因果的**正确多因表述**（反而是 monocause 维度的正面形态），
   * 不声称任何无依据的新事实。
   *
   * 判据（与攻击族的区分）：必须同时满足
   *   (a) 出现多因并列标记（共同/多种/多个/多个因素/既有…也有/既…又/…和…都/
   *       multiple causes / several factors / combination of / both … and …）
   *   (b) 至少一个 novel 词在前提中能找到对应汉字（字面部分继承）——
   *       攻击族的裸名词跳跃（「斯克兰顿实控财团暗网节点共识机制」）
   *       与前提零字面重叠，不满足 (b)，仍是跳跃。
   * 两条同时满足才豁免，避免把「前提完全无关 + 恰好多因句式」的攻击放过。
   */
  _isMultiCauseStatement(text, novel, premiseCharSet) {
    const multiMarkersZh = ['共同造成', '共同作用', '多种因素', '多个因素', '多因',
      '多重因素', '诸多因素', '各方面', '综合因素', '叠加', '交织'];
    const multiMarkersEn = ['multiple causes', 'several factors', 'combination of',
      'variety of', 'many factors', 'number of factors'];
    const hasMultiMarker = this._hasAny(String(text), multiMarkersZh)
      || this._hasAny(String(text).toLowerCase(), multiMarkersEn);
    // 「既有A，也有B」/「既A又B」/「A和B都」的并列句式
    const hasPairMarker = /既有[^，。]{1,20}[，,]\s*(也有|还有|又有)/.test(String(text))
      || /既[^，。]{1,15}(又|也)[^，。]{1,15}/.test(String(text))
      || /(both|either)[^,.]{1,40}(and|or)[^,.]{1,40}/i.test(String(text));
    if (!hasMultiMarker && !hasPairMarker) return false;

    // (b) 字面部分继承：novel 里至少一词与前提共享汉字
    if (!premiseCharSet || premiseCharSet.size === 0) return false;
    const novelJoined = (Array.isArray(novel) ? novel : []).join('');
    const shared = (novelJoined.match(/[\u4e00-\u9fa5]/g) || [])
      .filter(ch => premiseCharSet.has(ch));
    return shared.length >= 2;
  }

  /**
   * 检查除 exclude 外的前提中，是否有另一条直接断言 target（字符重叠高）
   */
  _assertedByOther(premises, target, exclude) {
    return premises.some(p => p !== exclude && this._charOverlap(p.text, target) >= 0.6);
  }

  /**
   * 段间包含度判定：a 的内容词有多少比例出现在 b 中。
   * 比字符级 Jaccard 稳健：短句不会被否定词/冠词稀释。
   * @returns {number} 0..1
   */
  _charOverlap(a, b) {
    if (!a || !b) return 0;
    // [r280] 短目标走单字集合：2-gram 在 3-4 字短句上会被切碎
    // （「他学习」→ {他学, 学习} vs 剥否定后 {他有, 有学, 学习} 仅 0.33），
    // 而否定前件的标准三段式恰恰全是短句。故任一侧 CJK ≤4 字时按单字比。
    // 仅含英文的短句不走此路（单字集合对英文无意义，会把词整体丢弃）。
    if (this._cjkLen(a) <= 4 || this._cjkLen(b) <= 4) {
      if (this._cjkLen(a) > 0 || this._cjkLen(b) > 0) return this._charOverlapChar(a, b);
    }
    const setA = new Set(this._chars(a).filter(c => c.length > 1));
    const setB = new Set(this._chars(b));
    if (setA.size === 0) return 0;
    let inter = 0;
    for (const c of setA) if (setB.has(c)) inter++;
    return inter / setA.size;
  }

  /** 文本中 CJK 汉字总数 */
  _cjkLen(text) {
    return (String(text).match(/[\u4e00-\u9fa5]/g) || []).length;
  }

  /**
   * 单字级重叠：a 的每个汉字有多少比例出现在 b 的汉字集合中。
   * 否定词（不/没/无/非/未）不计入分子分母——否则「他没有学习」会因
   * 多出「没」而压低重合度。
   */
  _charOverlapChar(a, b) {
    const neg = new Set(['不', '没', '无', '非', '未']);
    const setB = new Set((String(b).match(/[\u4e00-\u9fa5]/g) || []));
    const setA = new Set((String(a).match(/[\u4e00-\u9fa5]/g) || []).filter(c => !neg.has(c)));
    if (setA.size === 0) return 0;
    let inter = 0;
    for (const c of setA) if (setB.has(c)) inter++;
    return inter / setA.size;
  }

  _chars(text) {
    const cjk = String(text).match(/[\u4e00-\u9fa5]+/g) || [];
    // 中文连续串再切 2-gram，避免长串整体比对
    const grams = [];
    for (const chunk of cjk) {
      if (chunk.length <= 2) { grams.push(chunk); continue; }
      for (let i = 0; i < chunk.length - 1; i++) grams.push(chunk.slice(i, i + 2));
    }
    const raw = String(text).toLowerCase().match(/[a-z]{2,}/g) || [];
    const stop = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'that', 'this', 'it',
      'and', 'or', 'but', 'if', 'then', 'does', 'did', 'do', 'not', 'no', 'he', 'she',
      'they', 'we', 'you', 'his', 'her', 'their', 'its', 'since', 'because', 'therefore',
      'thus', 'hence', 'so', 'when', 'whenever', 'unless', 'will', 'would', 'can', 'could']);
    const words = raw.filter(w => !stop.has(w)).map(w => this._stem(w));
    return [...grams, ...words];
  }

  /**
   * 极简英文词干归一：study/studies/studied → studi，pass/passes/passed → pass。
   * 只处理英语规则后缀，不引外部词干库。
   */
  _stem(w) {
    if (w.length <= 3) return w;
    if (/ies$/.test(w)) return w.slice(0, -3) + 'y';      // studies → study
    if (/ied$/.test(w)) return w.slice(0, -3) + 'y';      // studied → study（r280 补：与 study 归一，否定前件跨步比对用）
    if (/(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2); // passes → pass
    if (/[^s]s$/.test(w)) return w.slice(0, -1);          // works → work
    if (/ed$/.test(w)) return w.slice(0, -2);             // passed → pass（studied 已由上面的 ied$ 规则归一为 study）
    if (/ing$/.test(w)) return w.slice(0, -3);
    return w;
  }

  /**
   * 把一步推理切成「给定段 / 结论段」
   * 「因为X，所以Y」→ given=X, concluded=Y
   * 「X，因此Y」    → given=X, concluded=Y
   * 「因此Y」       → given=null, concluded=Y
   */
  _splitGivenConcluded(text) {
    const lower = text.toLowerCase();
    let concIdx = -1, concLen = 0;
    for (const s of CONC_MARKERS_ZH) {
      const i = text.indexOf(s);
      if (i >= 0) { concIdx = i; concLen = s.length; break; }
    }
    if (concIdx < 0) {
      for (const s of CONC_MARKERS_EN) {
        const i = lower.indexOf(s);
        if (i >= 0) { concIdx = i; concLen = s.length; break; }
      }
    }

    // [r282] 结论前置倒装腿：无结论标记但有因标记时，
    // 「地面不会湿，因为没有下雨。」= 结论在前、因（=given）在后。
    // 旧逻辑只有 concIdx 一条路，找不到「所以/因此」就整句 return null，
    // 使这类倒装否定前件完全绕过无效式检测（r282 探针实证 ZH-2 漏判根因）。
    // 判据：因标记不在句首（前面有实质内容）且其后仍有内容 →
    //   前段=concluded（剥尾部标点），后段=given（剥因标记）。
    if (concIdx < 0) {
      for (const s of GIVEN_MARKERS_ZH) {
        const i = text.indexOf(s);
        if (i > 0 && i + s.length < text.length) {
          const concludedRaw = text.slice(0, i).trim();
          const givenRaw = text.slice(i + s.length).trim();
          if (concludedRaw && givenRaw) {
            return {
              given: givenRaw, concluded: concludedRaw.replace(/[，,。.]+$/, '').trim(),
              givenNeg: this._hasNeg(givenRaw),
              concludedNeg: this._hasNeg(concludedRaw),
            };
          }
        }
      }
      for (const s of GIVEN_MARKERS_EN) {
        const i = lower.indexOf(s);
        if (i > 0 && i + s.length < text.length) {
          const concludedRaw = text.slice(0, i).trim();
          const givenRaw = text.slice(i + s.length).trim();
          if (concludedRaw && givenRaw) {
            return {
              given: givenRaw, concluded: concludedRaw.replace(/[,，.。]+$/, '').trim(),
              givenNeg: this._hasNeg(givenRaw),
              concludedNeg: this._hasNeg(concludedRaw),
            };
          }
        }
      }
    }

    if (concIdx < 0) return null;

    let givenRaw = text.slice(0, concIdx).trim();
    const concluded = text.slice(concIdx + concLen).trim();
    if (!concluded) return null;

    const givenNeg = this._hasNeg(givenRaw);
    // 剥掉因标记
    for (const s of GIVEN_MARKERS_ZH) {
      const i = givenRaw.indexOf(s);
      if (i >= 0) { givenRaw = givenRaw.slice(i + s.length); break; }
    }
    for (const s of GIVEN_MARKERS_EN) {
      const i = givenRaw.toLowerCase().indexOf(s);
      if (i >= 0) { givenRaw = givenRaw.slice(i + s.length); break; }
    }
    const given = givenRaw.trim();
    return { given: given || null, concluded, givenNeg, concludedNeg: this._hasNeg(concluded) };
  }

  _hasNeg(text) {
    if (this._hasAny(text, CONNECTIVES.neg_zh)) return true;
    const lower = text.toLowerCase();
    if (this._hasAny(lower, CONNECTIVES.neg_en)) return true;
    // 英文多词否定："does not" / "do not" / "did not" / "is not" / "are not" / "can not"
    if (/\b(does|do|did|is|are|was|were|can|could|will|would|shall|should)\s+not\b/.test(lower)) return true;
    if (/\bnot\s+(work|pass|hold|apply|true|valid|correct|sufficient|necessary)\b/.test(lower)) return true;
    return false;
  }

  /**
   * 切分条件句「如果A那么B」→ { antecedent, consequent }
   */
  _splitConditional(text) {
    const lower = text.toLowerCase();
    let condIdx = -1, condLen = 0;
    for (const s of CONNECTIVES.conditional_zh) {
      const i = text.indexOf(s);
      if (i >= 0) { condIdx = i; condLen = s.length; break; }
    }
    if (condIdx < 0) {
      for (const s of CONNECTIVES.conditional_en) {
        const i = lower.indexOf(s);
        if (i >= 0) { condIdx = i; condLen = s.length; break; }
      }
    }
    if (condIdx < 0) return null;

    // [r280] 倒装条件句：「他能通过考试，如果他学习。」连接词位于句中而非句首，
    // 前件后置。此时前半是 consequent、连接词之后是 antecedent。
    // 判据：连接词不在句首（前面有实质内容）且找不到 then 词，按倒装解。
    if (condIdx > 0 && condIdx + condLen < text.length) {
      const before = text.slice(0, condIdx).trim();
      const after = text.slice(condIdx + condLen).trim();
      const hasThenMarker = CONNECTIVES.then_zh.some(s => text.includes(s, condIdx + condLen))
        || CONNECTIVES.then_en.some(s => lower.includes(s, condIdx + condLen));
      const beforeEndsComma = /[，,。.]$/.test(before);
      if (!hasThenMarker && (beforeEndsComma || before.length >= 2)) {
        // 前段以标点或至少 2 字收尾 → 倒装：前段=consequent，后段=antecedent
        const ant = after.replace(/[。.！!？?]+$/, '').trim();
        const cons = before.replace(/[，,。.]$/, '').trim();
        if (ant && cons) {
          return {
            antecedent: ant, consequent: cons,
            antecedentKw: new Set(this._extractKeywords(ant)),
            consequentKw: new Set(this._extractKeywords(cons)),
          };
        }
      }
    }

    let thenIdx = -1, thenLen = 0;
    for (const s of CONNECTIVES.then_zh) {
      const i = text.indexOf(s, condIdx + condLen);
      if (i >= 0) { thenIdx = i; thenLen = s.length; break; }
    }
    if (thenIdx < 0) {
      for (const s of CONNECTIVES.then_en) {
        const i = lower.indexOf(s, condIdx + condLen);
        if (i >= 0) { thenIdx = i; thenLen = s.length; break; }
      }
    }

    // [r282] 英文条件句「逗号优先」边界腿。
    // 英语语法标准：if 子句以逗号与主句分界（"If it rains, the ground will be wet"）。
    // 纯靠 then 词表切分会把后件头吞进前件（antecedent="it rains, the ground"），
    // 使否定前件比对时 given/concluded 两侧同时命中错误的边界字符串。
    // 规则：condIdx 之后最近的逗号，且逗号后仍有实质内容 → 前件=condIdx..逗号，
    // 后件=逗号之后。倒装条件句（then 词出现在逗号前）不走本腿。
    if (condIdx >= 0 && CONNECTIVES.conditional_en.includes(text.slice(condIdx, condIdx + condLen).toLowerCase())) {
      const commaRel = text.indexOf(',', condIdx + condLen);
      const commaBeforeThen = thenIdx < 0 || commaRel < thenIdx;
      if (commaRel > condIdx + condLen && commaBeforeThen) {
        const ant = text.slice(condIdx + condLen, commaRel).trim();
        const cons = text.slice(commaRel + 1).trim();
        // 倒装守卫：逗号后段若自带条件连接词（"，如果…"），说明逗号是并列而非条件边界
        const consIsSelfCond = CONNECTIVES.conditional_en.some(s => cons.toLowerCase().startsWith(s))
          || CONNECTIVES.conditional_zh.some(s => cons.startsWith(s));
        if (ant && cons && !consIsSelfCond) {
          return {
            antecedent: ant, consequent: cons,
            antecedentKw: new Set(this._extractKeywords(ant)),
            consequentKw: new Set(this._extractKeywords(cons)),
          };
        }
      }
    }

    if (thenIdx < 0) return null;

    // [r282] 中文条件句「逗号优先」边界腿（与 EN 同构）。
    // 「如果下雨，地面就会湿。」纯靠 then 词（就）切分时 antecedent="下雨，地面"
    // ——前件吞掉后件头。中文条件句同样以逗号分界前件/后件。
    // 规则：condIdx 后最近的逗号位于 thenIdx 之前 → 前件=condIdx..逗号，后件=逗号之后。
    // 倒装腿已处理 then 词缺失情形，本腿只收 then 词存在但逗号更靠前的情形。
    {
      const zhCond = CONNECTIVES.conditional_zh.some(s => text.startsWith(s, condIdx));
      if (zhCond) {
        const commaRel = text.indexOf('，', condIdx + condLen);
        const commaRelAscii = text.indexOf(',', condIdx + condLen);
        const comma = [commaRel, commaRelAscii].filter(i => i >= condIdx + condLen).sort((a, b) => a - b)[0];
        if (comma >= 0 && comma < thenIdx) {
          const ant = text.slice(condIdx + condLen, comma).trim();
          const cons = text.slice(comma + 1).trim();
          if (ant && cons) {
            return {
              antecedent: ant, consequent: cons,
              antecedentKw: new Set(this._extractKeywords(ant)),
              consequentKw: new Set(this._extractKeywords(cons)),
            };
          }
        }
      }
    }

    const antecedent = text.slice(condIdx + condLen, thenIdx).trim();
    const consequent = text.slice(thenIdx + thenLen).trim();
    if (!antecedent || !consequent) return null;
    return {
      antecedent,
      consequent,
      antecedentKw: new Set(this._extractKeywords(antecedent)),
      consequentKw: new Set(this._extractKeywords(consequent)),
    };
  }

  _firstPos(text, arr) {
    let pos = -1;
    for (const s of arr) { const i = text.indexOf(s); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
    return pos;
  }

  _hasAny(text, arr) { return arr.some(s => text.includes(s)); }

  _sniffForm(text) {
    const lower = text.toLowerCase();
    const hasCond = this._hasAny(text, CONNECTIVES.conditional_zh) || this._hasAny(lower, CONNECTIVES.conditional_en);
    if (hasCond) return REASONING_FORM.DEDUCTIVE;
    if (this._hasAny(text, ['大多', '多数', '通常', '一般', '往往', '倾向']) ||
        this._hasAny(lower, ['most', 'usually', 'generally', 'tend', 'likely'])) return REASONING_FORM.INDUCTIVE;
    if (this._hasAny(text, ['最佳解释', '最可能', '最能说明', '推测', '也许']) ||
        this._hasAny(lower, ['best explains', 'most likely', 'probably', 'suggests'])) return REASONING_FORM.ABDUCTIVE;
    if (this._hasAny(text, ['类似', '好比', '如同', '与.*相似'.replace('.*', '')]) ||
        this._hasAny(lower, ['similar to', 'like', 'analogous', 'just as'])) return REASONING_FORM.ANALOGICAL;
    return REASONING_FORM.UNKNOWN;
  }

  _extractKeywords(text) {
    const raw = String(text);
    // 英文/拉丁词：仅取空白分隔的纯拉丁串（中文串不含空格，
    // 若不隔离会把整段中文当成一个"英文词"——该伪词永不出现在任何前提里，
    // 使 novelRatio 恒被推高，正常中文推理被误判为无依据跳跃。r278 e2e 矩阵实测修复）
    const words = raw.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && /[\p{L}\p{N}]/u.test(w) && !/[\u4e00-\u9fa5]/u.test(w)
        && !STOPWORDS.has(w) && !NON_CONTENT_EN.has(w));
    const zhChunks = raw.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const zhGrams = [];
    for (const chunk of zhChunks) {
      if (chunk.length <= 2) { if (!NON_CONTENT_ZH.has(chunk)) zhGrams.push(chunk); continue; }
      for (let i = 0; i < chunk.length - 1; i++) {
        const g = chunk.slice(i, i + 2);
        if (!NON_CONTENT_ZH.has(g)) zhGrams.push(g);
      }
    }
    return [...new Set([...words, ...zhGrams])];
  }

  _normConf(c) {
    if (typeof c !== 'number' || !isFinite(c)) return 0.8;
    return Math.max(0, Math.min(1, c));
  }
}

module.exports = { InferenceChain, STEP_TYPE, REASONING_FORM, VALID_FORMS, VERSION };
