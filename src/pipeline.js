/**
 * src/pipeline.js — 心虫全链路管线
 *
 * 将 12 个检测模块串成一条管道：
 *   scope-check → premise-check → discriminate → gate →
 *   doubt-engine → frame-check → output-gate → error-memory →
 *   auto-rules → intent-anchor
 *
 * 输入不变，输出统一 gate 格式。
 * 每条输出带完整检查链：checked_by[]
 */

'use strict';

const { checkScope } = require('./scope-check.js');
const { checkPremises } = require('./premise-check.js');
// NOTE: index.js <-> pipeline.js 存在循环依赖，若在此静态解构 discriminate
// 会在循环加载时序里拿到 undefined。改为运行时延迟取用。
const { doubt } = require('./doubt-engine.js');
const { check: frameCheck } = require('./frame-check.js');
const { screen } = require('./output-gate.js');
const em = require('./error-memory.js');
const auto = require('./auto-rules.js');
const { initAnchor, checkDrift } = require('./intent-anchor.js');
const { verify } = require('./verifier.js');
const { rewrite } = require('./rewriter.js');
const { checkAdversarialVariant } = require('./shield/adversarial-variant.js');
const { detectPedagogicalContent } = require('./pedagogy.js');
const { evaluateRules } = require('./knowledge/classics-value-mapper.js');

let pipelineAnchor = null;

/**
 * 运行全链路管线
 * @param {object} options
 * @param {string} options.input - 用户输入或 AI 草稿
 * @param {string} [options.mode='input'] - 'input' 或 'output' 或 'draft'
 * @param {string} [options.anchor] - 对话锚点（可选）
 * @returns {object} 统一 pipeline 结果
 */
function runPipeline({ input, mode = 'input', anchor, options = {} } = {}) {
  // 统一输入类型：非字符串（数字/对象/布尔）转字符串，避免下游 .slice/.match 崩溃
  if (input === null || input === undefined) return { error: 'no_input', gate: { action: 'pass', reason: '无输入' }, checked_by: [] };
  if (typeof input !== 'string') input = String(input);
  // Unicode 归一化（NFKC）：弯引号/全角/组合字符折回 ASCII，保证模式库（ASCII 撇号等）能命中
  // 例: U+2019 ' (curly apostrophe) → U+0027 ' —— godmode 类变体绕过依赖此修复
  if (/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) {
    input = input.normalize('NFKC')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
  }

  const checked_by = [];
  let currentGate = { action: 'pass', reason: '通过' };
  let data = {};

  // ─── Layer 1: Scope Check — 可回答性预筛 ─────
  // 只对 input 模式执行: scope-check 语义是"心虫能否回答该请求",
  // AI 输出(output/draft)是解释/说明, 不该被"心虫能不能做"误杀。
  // (2026-08-14, DSH 桥接实战: checkOutput('搜索新闻需要外部接口') 被误 block)
  if (mode === 'input') {
    // options.canRealtime: 桥接场景执行者可联网时放行实时数据类 (2026-08-14)
    const scopeResult = checkScope(input, { canRealtime: options.canRealtime });
    checked_by.push({ layer: 'scope-check', action: scopeResult.action, pass: scopeResult.pass, reason: scopeResult.reason });
    if (!scopeResult.pass) {
      currentGate = { action: 'block', reason: scopeResult.reason, layer: 'scope-check' };
      return applyHardGate(buildResult(input, currentGate, checked_by, data));
    }
  }

  // ─── Layer 2: Premise Check — 前提审核 ─────
  const premiseResult = checkPremises(input);
  checked_by.push({ layer: 'premise-check', issues: premiseResult.count, hasIssue: premiseResult.hasIssue });
  if (premiseResult.hasIssue) {
    data.premises = premiseResult.premises.slice(0, 3);
  }

  // ─── Layer 3: Discriminate — 45维辨别 ────
  const pedagogy = detectPedagogicalContent(input);
  const _discriminate = require('./index.js').discriminate || (typeof discriminate !== 'undefined' ? discriminate : null);
  const discResult = _discriminate(input, [], pedagogy ? 'pedagogical' : undefined);
  checked_by.push({ layer: 'discriminate', score: discResult.overallScore, verdict: discResult.verdict });
  data.discriminate = { verdict: discResult.verdict, score: discResult.overallScore, findings: discResult.findings };

  // ─── Layer 3.2: Classical Knowledge — 古籍思想维度 ─────
  const classicalResult = evaluateRules(input);
  if (classicalResult.classicalRelevant) {
    checked_by.push({ layer: 'classical-knowledge', hits: classicalResult.hitCount, domain: classicalResult.domain });
    data.classical = classicalResult;
    if (classicalResult.findings?.length) {
      const warns = classicalResult.findings.filter(f => f.signal === 'warn');
      if (warns.length && currentGate.action === 'pass') {
        currentGate = {
          action: 'verify',
          reason: `古典思想警示: ${warns[0].reason}`,
          layer: 'classical-knowledge'
        };
      }
      data.discriminate.findings.push(...classicalResult.findings.map(f => ({
        dimension: f.dimensions?.[0] || 'classical_knowledge',
        severity: f.signal === 'warn' ? 50 : f.signal === 'pass' ? 20 : 30,
        details: `[古典${f.ruleId}] ${f.reason}`,
        classical: true,
        signal: f.signal,
        evidence: f.evidence
      })));
    }
  }

  // ─── Layer 3.5: Adversarial Variant — 对抗变体检测 ────
  // 启发：Hermes 专访「任何模型都可越狱，因为你有无限次尝试」——
  // 模式库修掉一个绕过，攻击者就用零宽/同形字/词拆分继续试。
  // 把攻击者的尝试内置成检测器的主动攻击面。
  const advResult = checkAdversarialVariant(input);
  checked_by.push({ layer: 'adversarial-variant', action: advResult.action, risk: advResult.risk });
  if (advResult.action === 'rewrite') {
    // 高危变体：建议先归一化再判别（保留原始 gate，追加信号）
    currentGate = { action: 'rewrite', reason: `对抗变体: ${advResult.signals.map(s => s.name).join('、')}`, layer: 'adversarial-variant' };
    data.adversarial = { risk: advResult.risk, signals: advResult.signals, normalized: advResult.normalized };
  } else if (advResult.action === 'verify') {
    data.adversarial = { risk: advResult.risk, signals: advResult.signals, normalized: advResult.normalized };
  }

  // ─── Layer 3.6: Dao Decision — 道论监督 ──────────────────────
  try {
    const daoMod = require('./core/dao-decision.js');
    const daoResult = new daoMod.DaoDecision().evaluate({ text: input, history: [] });
    checked_by.push({ layer: 'dao-decision', daoScore: daoResult.daoScore, passed: daoResult.passed, flags: (daoResult.flags || []).slice(0, 3) });
    if (daoResult.flags && daoResult.flags.length && currentGate.action === 'pass') {
      currentGate = { action: 'verify', reason: `道论警示: ${daoResult.flags[0].reason}`, layer: 'dao-decision' };
    }
    data.dao = daoResult;
  } catch (e) {
    checked_by.push({ layer: 'dao-decision', error: e.message });
  }

  // ─── Layer 3.7: Uncertainty Quantifier — 不确定性量化 ────────
  try {
    const uqMod = require('./core/uncertainty-quantifier.js');
    const uqResult = new uqMod.UncertaintyQuantifier().evaluate(input, { hasEvidence: !!data.evidence });
    checked_by.push({ layer: 'uncertainty', confidence: uqResult.confidence, level: uqResult.level, hallucinationRisk: uqResult.isHallucinationRisk });
    if (uqResult.isHallucinationRisk && currentGate.action === 'pass') {
      currentGate = { action: 'verify', reason: `幻觉风险: ${uqResult.hallucination?.signals?.join('; ') || '高'}`, layer: 'uncertainty' };
    }
    data.uncertainty = uqResult;
  } catch (e) {
    checked_by.push({ layer: 'uncertainty', error: e.message });
  }

  // ─── Layer 3.8: Priority Guardian — 优先级守护 ──────────────
  try {
    const pgMod = require('./core/priority-guardian.js');
    const pgResult = new pgMod.PriorityGuardian().check({ userIntent: input, action: currentGate.reason || '', humanProgress: {} });
    checked_by.push({ layer: 'priority-guardian', allowed: pgResult.allowed, path: pgResult.path, conflicts: (pgResult.conflicts || []).slice(0, 3) });
    if (!pgResult.allowed && currentGate.action !== 'block') {
      currentGate = { action: 'block', reason: pgResult.reason || '优先级守护拒绝', layer: 'priority-guardian' };
    } else if (pgResult.path === 'CONDITIONAL_ALLOW' && currentGate.action === 'pass') {
      currentGate = { action: 'verify', reason: '条件放行：需保持独立判断', layer: 'priority-guardian' };
    }
    data.priority = pgResult;
  } catch (e) {
    checked_by.push({ layer: 'priority-guardian', error: e.message });
  }

  // ─── Layer 3.9: Progress Judgment — 进步判断 ────────────────
  try {
    const pjMod = require('./core/progress-judgment.js');
    const pjResult = new pjMod.ProgressJudgment().judge({ action: input, claim: '', userIntent: input });
    checked_by.push({ layer: 'progress-judgment', isProgress: pjResult.isProgress, confidence: pjResult.confidence, pseudo: pjResult.pseudoCheck?.patterns });
    if (pjResult.standGround && currentGate.action === 'pass') {
      currentGate = { action: 'verify', reason: `伪进步警示: ${pjResult.standGround.reason || '需独立验证'}`, layer: 'progress-judgment' };
    }
    data.progress = pjResult;
  } catch (e) {
    checked_by.push({ layer: 'progress-judgment', error: e.message });
  }

  // ─── Layer 4: Gate — 门禁判定 ─────────
  // 若 adversarial-variant 已判高危 rewrite（对抗变体绕过），优先保留，不被普通 gate 覆盖
  if (!(data.adversarial && data.adversarial.risk === 'high')) {
    const upstreamBlocked = ['dao-decision', 'uncertainty', 'priority-guardian', 'progress-judgment'].some(layer => {
      const entry = checked_by.find(c => c.layer === layer);
      return entry && entry.action && ['block', 'rewrite'].includes(entry.action);
    });
    if (!upstreamBlocked) {
      currentGate = discResult.gate;
      checked_by.push({ layer: 'gate', action: currentGate.action, reason: currentGate.reason });
    } else {
      checked_by.push({ layer: 'gate', action: currentGate.action, reason: `上游监督保留: ${currentGate.reason}`, kept: true });
    }
  } else {
    checked_by.push({ layer: 'gate', action: 'rewrite', reason: `对抗变体优先: ${currentGate.reason}`, kept: true });
  }

  // ─── Layer 5: Evidence Verify (verify模式 + perfect_error rewrite 模式) ────
  // verify → 常规证据检查；rewrite(perfect_error) → 同样核查声明证据状态，标注疑似编造
  if (currentGate.action === 'verify' || (currentGate.action === 'rewrite' && discResult.dimensions?.perfect_error?.count >= 2)) {
    const evidenceResult = verify(input);
    checked_by.push({ layer: 'verifier', claims: evidenceResult.claims.length, verdict: evidenceResult.verdict });
    data.evidence = evidenceResult;
    // perfect_error 触发 rewrite 且声明全部需证据 → 给调用方"疑似编造"信号
    if (currentGate.action === 'rewrite' && evidenceResult.verdict === 'needs_evidence') {
      currentGate.reason = `${currentGate.reason}；证据核查: 声明无法验证(疑似编造)`;
      data.evidence.suspected_fabrication = true;
    }
  }

  // ─── Layer 6: Frame Check (仅output/draft模式) ─
  if (mode !== 'input') {
    const frameResult = frameCheck(input);
    checked_by.push({ layer: 'frame-check', issues: frameResult.issues.length });
    if (frameResult.issues.length > 0) {
      currentGate = frameResult.gate;
      data.frame = frameResult.issues;
    }
  }

  // ─── Layer 7: Output Gate (draft/output 模式) ────
  // [v6.7.101] 原来只有 mode === 'output' 才过 output-gate，导致 draft 模式下
  // overconfidence 命中（「毫无疑问，这是唯一正确的解决方案」→ 80 分）无人接管：
  // doubt-engine 的 rewrite 需要 adversarialIssues >= 3，该句只命中 2 条。
  // 实测 e2e 场景6 由「中文逗号被误判同形字」的误报撑着才 rewrite，修掉误报后
  // 立刻退回 verify。draft 是 AI 起草阶段，绝对化断言正是该拦的对象。
  if (mode !== 'input') {
    const screenResult = screen(input);
    checked_by.push({ layer: 'output-gate', issues: screenResult.findings.length });
    if (screenResult.findings.length > 0) {
      // [v6.7.101] screen 的 'hedge' 是中间态（"需添加不确定性标注"），
      // 不属于管线对外契约的四种动作（pass/verify/rewrite/block），
      // 归一到 verify——语义就是"要人工确认措辞"。
      const _sg = screenResult.gate;
      if (_sg && _sg.action === 'hedge') { _sg.action = 'verify'; _sg.reason = `输出需降低确信度: ${screenResult.findings.length}个问题`; }
      // 若已因 perfect_error 判 rewrite，保留更具体的原因（合并而非覆盖）
      const hadPerfectError = discResult.dimensions?.perfect_error?.count >= 2 && currentGate.action === 'rewrite';
      if (hadPerfectError && screenResult.gate.action === 'rewrite') {
        currentGate.reason = `${currentGate.reason}；输出门禁: ${screenResult.gate.reason || '需改写'}`;
      } else {
        currentGate = screenResult.gate;
      }
      data.outputIssues = screenResult.findings;
    }
  }

  // ─── Layer 8: Doubt Engine (仅draft/output模式) ────
  if (mode === 'draft' || mode === 'output') {
    const doubtResult = doubt(input);
    checked_by.push({ layer: 'doubt-engine', doubts: doubtResult.doubts.length, shouldStop: doubtResult.shouldStop });
    if (doubtResult.shouldStop) {
      // 合并而非覆盖：若已因 perfect_error/输出门禁判 rewrite，保留更具体的原因
      const hadPerfectError = discResult.dimensions?.perfect_error?.count >= 2 && currentGate.action === 'rewrite';
      if (hadPerfectError) {
        currentGate.reason = `${currentGate.reason}；doubt: ${doubtResult.gate.reason || '过度断言'}`;
      } else {
        currentGate = doubtResult.gate;
      }
      data.doubts = doubtResult.doubts;
    }
  }

  // ─── Layer 9: Error Memory — 检查历史错误 ──
  const recurrence = em.checkRecurrence(input);
  checked_by.push({ layer: 'error-memory', warnings: recurrence.warnings.length });
  if (recurrence.warnings.length > 0) {
    data.errorMemory = recurrence.warnings;
  }

  // ─── Layer 10: Auto Rules — 自生成规则 ────
  const autoResult = auto.checkAutoRules(input);
  checked_by.push({ layer: 'auto-rules', triggered: autoResult.triggered.length });
  if (autoResult.triggered.length > 0) {
    data.autoRules = autoResult.triggered;
    if (autoResult.triggered.some(t => t.action === 'block')) {
      currentGate = { action: 'block', reason: `自生成规则拦截: ${autoResult.triggered[0].trigger}`, layer: 'auto-rules' };
    }
  }

  // ─── Layer 11: Intent Anchor (可选) ────
  if (anchor) {
    if (!pipelineAnchor) { initAnchor(anchor); pipelineAnchor = anchor; }
    const driftResult = checkDrift(input);
    checked_by.push({ layer: 'intent-anchor', drifted: driftResult.drifted, hitRate: driftResult.hitRate });
    if (driftResult.drifted) {
      data.drift = driftResult;
    }
  }

  return applyHardGate(buildResult(input, currentGate, checked_by, data));
}

/**
 * [v6.7.70] 统一硬闸门：block 级判定真的拦住内容（心虫 decision.decide 选定，0.90 分）
 *
 * 诊断实证：三个入口（checkInput/checkDraft/checkOutput）本来就返回
 * gate.action='block'，但 data.discriminate / findings / input 回显全都还在——
 * 调用方可以照读分析内容然后原样发出。**block 只是一个建议字段，不是闸门。**
 *
 * 本函数在 buildResult 之后统一加工：block 时
 *   1. data（各层完整分析）整体移到 blockedData —— 不留可照读的分析
 *   2. findings 清空，替换成单条拦截指令
 *   3. input 回显脱敏（防注入文本被回显再利用）
 *   4. verdict/reason 明确指向拦截
 * 良性输入零改动（早退）。
 *
 * 灰度：HEARTFLOW_GATE_HARD=0 时退化为只打标记不清内容。
 */
function applyHardGate(result) {
  if (!result || typeof result !== 'object' || !result.gate || result.gate.action !== 'block') return result;
  // [v6.7.70] 幂等保护：已加工过的结果直接返回。
  // 否则二次加工会把已撤空的 data（undefined）再写进 blockedData，
  // 覆盖掉真正的证据链（实测复现）。
  if (result.blocked === true) return result;
  if (process.env.HEARTFLOW_GATE_HARD === '0') {
    result.blocked = true;
    result.blockedBy = 'heartflow-gate(soft)';
    return result;
  }

  const reason = result.gate.reason || '命中阻断级信号';
  // 1+2. 证据链移到 blockedData，正文位置不放可照读的分析。
  //     同时撤掉常见的分析载荷字段（不同 handler 用的字段名不同：
  //     data / dimensions / raw / readableReport / results）
  result.blockedData = {};
  for (const k of ['data', 'dimensions', 'raw', 'readableReport', 'results', 'summary', 'crossAnalysis', 'entropyAnalysis']) {
    if (result[k] !== undefined) {
      result.blockedData[k] = result[k];
      result[k] = undefined;
    }
  }
  result.originalFindings = result.findings;
  result.findings = [{
    dimension: 'gate_block',
    severity: 100,
    details: `心虫拦截：${reason}`,
    guidance: '不要输出此内容。按 gate.reason 修正后重新生成；'
      + '完整分析证据在 blockedData 字段，仅供审计，不应用于生成回复。',
  }];
  // 3. 输入回显脱敏
  if (typeof result.input === 'string' && result.input.length > 0) {
    result.originalInput = result.input;
    result.input = `[已拦截，原文 ${result.input.length} 字移至 originalInput]`;
  }
  // 4. 明确标记
  result.blocked = true;
  result.blockedBy = 'heartflow-gate';
  result.verdict = '不可信';
  result.gate = Object.assign({}, result.gate, {
    action: 'block',
    reason: `心虫拦截：${reason}`,
  });
  result.summary = Object.assign({}, result.summary, {
    final_action: 'block',
    block: true,
    contentWithheld: true,
  });
  return result;
}

function buildResult(input, gate, checked_by, data) {
  // 合并 discriminate 的顶层字段 (overallScore, verdict, findings, dimensions)
  const discLayer = checked_by.find(l => l.layer === 'discriminate');
  return {
    input: input.slice(0, 100),
    gate,
    verdict: discLayer?.verdict || '未检测',
    overallScore: discLayer?.score || 0,
    findings: data?.discriminate?.findings || [],
    checked_by,
    data: Object.keys(data).length > 0 ? data : undefined,
    summary: {
      layers_passed: checked_by.length,
      final_action: gate.action,
      block: gate.action === 'block',
      rewrite: gate.action === 'rewrite',
      verify: gate.action === 'verify',
      pass: gate.action === 'pass',
    },
  };
}

/**
 * 快捷：用 pipeline 检测用户输入
 */
function checkInput(text, options = {}) {
  // options.canRealtime: 桥接场景执行者能联网时, scope-check 放行实时数据类
  // (2026-08-14, DSH 桥接实战驱动 — 之前"搜索新闻"被误拦截)
  return runPipeline({ input: text, mode: 'input', options });
}

/**
 * 快捷：用 pipeline 检测 AI 草稿
 */
function checkDraft(text) {
  return runPipeline({ input: text, mode: 'draft' });
}

/**
 * 快捷：用 pipeline 检测 AI 输出（发出前）
 */
function checkOutput(text) {
  return runPipeline({ input: text, mode: 'output' });
}

module.exports = { runPipeline, checkInput, checkDraft, checkOutput, applyHardGate };
