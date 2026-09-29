/**
 * HeartFlow — GateVerdict 聚合器
 *
 * 问题：think() 产出 30+ 个辨别信号（_verification/_inputCheck/_highRiskOutput/
 * _blockedByFirewall/_selfContradictory...），全部散落在 result 对象的下划线字段里。
 * 调用方要么自己解读每一个字段（等于没帮上忙），要么干脆不读（= 心虫判了但没人听见）。
 *
 * 本模块做一件事：把散落信号收敛成**一条可执行命令**。
 *
 *   buildGateVerdict(thoughtChain) → {
 *     action: 'block' | 'rewrite' | 'verify' | 'pass',
 *     reason: '人心虫为什么这么说',
 *     signals: ['命中的信号名'],
 *     guidance: ['该做什么']
 *   }
 *
 * 这是"从标注到门禁"的关键一跳——不是让心虫多判一个维度，
 * 是让心虫已经判出来的东西**真的能拦住输出**。
 *
 * 设计原则：
 * 1. 纯规则、零依赖、纯函数（不读全局状态，可单测）
 * 2. 只消费已有字段，不重新检测（重复检测 = 两套真相）
 * 3. 优先级明确：block > rewrite > verify > pass
 * 4. 宁可漏判降级，不可误判升级（fail-open 到 verify，不是 fail-open 到 pass）
 */

'use strict';

/** 阻断级信号——命中即不应当输出 */
const BLOCK_SIGNALS = [
  { key: '_blockedByFirewall', label: '防火墙拦截', reason: '输出被心虫防火墙判定为不可接受' },
  { key: '_highRiskOutput', label: '高风险输出', reason: '输出触发高风险检测' },
];

/** 改写级信号——输出有问题但可修 */
const REWRITE_SIGNALS = [
  { key: '_selfContradictory', label: '自相矛盾', reason: '输出存在自相矛盾，需修正后再发出' },
  { key: '_restrainedBy', label: '战略克制', reason: '输出命中战略克制项，需收敛' },
  { key: '_inputCheckIssues', label: '输入风险', reason: '输入含预设陷阱/诱导，结论不可直接采信' },
];

/** 验证级信号——需要证据支撑 */
const VERIFY_SIGNALS = [
  { key: '_verification', label: '自验证未过', reason: '心虫自验证发现问题', scoreThreshold: 0.5 },
  { key: '_outputChecklistIssues', label: '输出清单问题', reason: '输出清单存在未通过项' },
  { key: '_inputCheck', label: '输入检查', reason: '输入检查发现风险信号' },
  { key: '_epistemicSafety', label: '认知安全', reason: '认知安全检查未通过' },
  { key: '_driftCorrected', label: '漂移纠正', reason: '检测到目标漂移并已纠正，需确认结论仍对齐原目标' },
  // [v6.7.130 第 219 轮] SelfVerifier 自验证的**真问题**接线。
  // 诊断实证：218 轮修好恒崩后 _selfVerification 12/12 落地（12 样本
  // 分布探针），但 src 侧读取点为 0 —— 心虫判出自验证问题，没有任何下游
  // 听得见。这里是第一次让它能影响判定。
  // ⚠️ 只消费 _selfVerificationIssues（已过滤 counterfactual 噪声）：
  //    counterfactual check 实测 12/12 失败，是全引擎最恒定的假阳性来源。
  //    直接用 _selfVerification.issues 会让 verify 泛滥成默认值。
  { key: '_selfVerificationIssues', label: '推理自验证问题', reason: '推理过程自检发现逻辑问题（结论与推理不匹配/隐藏假设/遗漏因素）' },
  // 反思闭环：健康状态退化（degraded/stuck/oscillating）说明心虫自己的
  // 内观循环检出异常，此时结论的可信度要打问号。
  // 只认 health，不认 reflected/insightCount —— 那些是过程量不是问题量。
  {
    key: '_reflectionLoopClosed', label: '反思健康退化', reason: '心虫内观循环自检异常',
    healthTrigger: ['degraded', 'stuck', 'oscillating'],
  },
];

/**
 * 判断信号是否"真的命中"。
 * 有些字段存在但值为 false/null/空数组 = 未命中。
 */
function _isTriggered(value, spec) {
  if (value === undefined || value === null || value === false) return false;
  if (Array.isArray(value)) return value.length > 0;
  // [v6.7.130] 健康状态触发：只认 spec.healthTrigger 里列出的异常状态。
  // 设计理由：_reflectionLoopClosed 是对象，走默认对象分支会因 `Object.keys().length > 0`
  // 无条件触发（reflected/insightCount/health 这些过程字段本来就有值），
  // 等于每次思考都报"内观异常"。必须按健康状态定向。
  if (Array.isArray(spec?.healthTrigger) && typeof value === 'object') {
    const h = value.health;
    return typeof h === 'string' && spec.healthTrigger.includes(h);
  }
  if (typeof value === 'object') {
    // _verification: { score, issues: [...] }
    if (spec.scoreThreshold !== undefined && typeof value.score === 'number') {
      return value.score < spec.scoreThreshold || (Array.isArray(value.issues) && value.issues.length > 0);
    }
    // _inputCheck: { passed: bool, warnings: [] }
    if (value.passed === false) return true;
    if (Array.isArray(value.warnings)) return value.warnings.length > 0;
    if (Array.isArray(value.issues)) return value.issues.length > 0;
    return Object.keys(value).length > 0;
  }
  // 标量 truthy
  if (typeof value === 'number') return value !== 0;
  return true;
}

/**
 * 从信号值提取可读细节（供 reason/guidance 使用）。
 */
function _describe(key, value) {
  if (value === true) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 3).map(v => (typeof v === 'string' ? v : (v && (v.message || v.type || v.label || v.name)) || String(v))).join('；');
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.issues) && value.issues.length > 0) {
      return value.issues.slice(0, 3).map(i => i.message || i.type || String(i)).join('；');
    }
    if (Array.isArray(value.warnings) && value.warnings.length > 0) {
      return value.warnings.slice(0, 3).map(w => (typeof w === 'string' ? w : (w && (w.message || w.type || w.label || w.name)) || String(w))).join('；');
    }
    if (typeof value.score === 'number') return `score=${value.score}`;
    if (value.matches) return `命中 ${value.matches.length} 项`;
    // [v6.7.130] 健康状态信号（_reflectionLoopClosed.health）本身就是可读值，
    // 直接报它，别落到下面"12 个字段"的兜底里。
    if (typeof value.health === 'string') return `health=${value.health}`;
    // [v6.7.70] 兜底：未知对象形状不要直接 String()（会输出 [object Object]）
    // 取第一个有意义的字符串字段，再不行只报键数。
    const strField = Object.values(value).find(v => typeof v === 'string' && v.length > 0);
    if (strField) return strField.slice(0, 120);
    return `${Object.keys(value).length} 个字段`;
  }
  return '';
}

/**
 * 聚合门禁判定。
 *
 * @param {object} result - think() 返回的 result（含 _ 前缀辨别字段）
 * @returns {{action: string, reason: string, signals: string[], guidance: string[], score: number}}
 */
function buildGateVerdict(result) {
  if (!result || typeof result !== 'object') {
    return { action: 'pass', reason: '无辨别信号', signals: [], guidance: [], score: 1 };
  }

  const signals = [];
  const guidance = [];
  const details = [];

  // ── 第一优先级：block ──
  for (const spec of BLOCK_SIGNALS) {
    const v = result[spec.key];
    if (_isTriggered(v, spec)) {
      signals.push(spec.label);
      const d = _describe(spec.key, v);
      details.push(spec.reason + (d ? `：${d}` : ''));
      guidance.push('不要输出此内容。按 gate.reason 修正后重新生成。');
    }
  }
  if (signals.length > 0) {
    return {
      action: 'block',
      reason: details.join(' | '),
      signals,
      guidance,
      score: 0,
    };
  }

  // ── 第二优先级：rewrite ──
  for (const spec of REWRITE_SIGNALS) {
    const v = result[spec.key];
    if (_isTriggered(v, spec)) {
      signals.push(spec.label);
      const d = _describe(spec.key, v);
      details.push(spec.reason + (d ? `：${d}` : ''));
      guidance.push('按 signals 逐项修正后再输出，不要原样发出。');
    }
  }
  if (signals.length > 0) {
    return {
      action: 'rewrite',
      reason: details.join(' | '),
      signals,
      guidance,
      score: 0.3,
    };
  }

  // ── 第三优先级：verify ──
  let lowestScore = 1;
  for (const spec of VERIFY_SIGNALS) {
    const v = result[spec.key];
    if (_isTriggered(v, spec)) {
      signals.push(spec.label);
      const d = _describe(spec.key, v);
      details.push(spec.reason + (d ? `：${d}` : ''));
      if (spec.scoreThreshold !== undefined && v && typeof v.score === 'number') {
        lowestScore = Math.min(lowestScore, v.score);
      }
      guidance.push('先补充证据/确认依据，再决定是否采信此结论。');
    }
  }
  if (signals.length > 0) {
    return {
      action: 'verify',
      reason: details.join(' | '),
      signals,
      guidance,
      score: lowestScore < 1 ? lowestScore : 0.5,
    };
  }

  // ── 无信号：pass ──
  return { action: 'pass', reason: '心虫未发现阻断/改写/验证信号', signals: [], guidance: [], score: 1 };
}

/**
 * 便捷方法：判断是否应当拦住。
 * 调用方常见写法：if (!verdict.allowed) { /* 重写或升级人工 *\/ }
 */
function isAllowed(verdict) {
  return !verdict || verdict.action === 'pass' || verdict.action === 'verify';
}

module.exports = { buildGateVerdict, isAllowed, BLOCK_SIGNALS, REWRITE_SIGNALS, VERIFY_SIGNALS };
