/**
 * HeartFlow Decision Verifier v11.0.0
 *
 * Research-inspired upgrade for reasoning reliability:
 * - structured decision records instead of free-form intuition
 * - contradiction / risk / evidence checks
 * - confidence re-scoring and repair hints
 *
 * Sources referenced in v11 direction:
 * - self-correction survey (2025)
 * - verifier-first reasoning patterns (2025)
 * - process supervision / runtime verification trends (2025-2026)
 */

class DecisionVerifier {
  constructor(options = {}) {
    this.thresholds = {
      minEvidence: options.minEvidence || 1,
      lowConfidence: options.lowConfidence || 0.45,
      highRiskPenalty: options.highRiskPenalty || 0.2,
      contradictionPenalty: options.contradictionPenalty || 0.25
    };
  }

  verify(decisionRecord = {}) {
    const normalized = this.normalize(decisionRecord);
    const issues = [];
    const checks = {
      evidence: this.checkEvidence(normalized),
      contradiction: this.checkContradictions(normalized),
      risk: this.checkRisk(normalized),
      completeness: this.checkCompleteness(normalized)
    };

    Object.values(checks).forEach(result => {
      if (result.issues?.length) issues.push(...result.issues);
    });

    const score = this.computeScore(normalized, checks);
    return {
      valid: score >= 0.6 && issues.filter(i => i.severity === 'high').length === 0,
      score,
      issues,
      checks,
      repairHints: this.generateRepairHints(issues, normalized),
      normalized,
      summary: this.summarize(checks, issues)
    };
  }

  normalize(record) {
    return {
      decision: record.decision || record.strategy || record.action || '',
      reason: record.reason || record.rationale || '',
      evidence: Array.isArray(record.evidence) ? record.evidence : (record.evidence ? [record.evidence] : []),
      risks: Array.isArray(record.risks) ? record.risks : (record.risk ? [record.risk] : []),
      alternatives: Array.isArray(record.alternatives) ? record.alternatives : [],
      confidence: typeof record.confidence === 'number' ? record.confidence : Number(record.confidence || 0.5),
      expectedOutcome: record.expectedOutcome || '',
      userGoal: record.userGoal || '',
      constraints: Array.isArray(record.constraints) ? record.constraints : []
    };
  }

  checkEvidence(record) {
    const issues = [];
    if (record.evidence.length < this.thresholds.minEvidence) {
      issues.push({ type: 'missing_evidence', severity: 'high', message: '决策缺少可核对依据' });
    }
    if (record.reason && /一定|绝对|必须/.test(record.reason) && record.evidence.length === 0) {
      issues.push({ type: 'overclaim', severity: 'medium', message: '出现强断言但没有证据支撑' });
    }
    return { ok: issues.length === 0, issues };
  }

  checkContradictions(record) {
    const issues = [];
    const joined = [record.decision, record.reason, record.expectedOutcome].join(' ');
    const contradictionPairs = [
      ['立即', '稍后'],
      ['必须', '可选'],
      ['停止', '继续'],
      ['低风险', '高风险']
    ];

    for (const [a, b] of contradictionPairs) {
      if (joined.includes(a) && joined.includes(b)) {
        issues.push({ type: 'contradiction', severity: 'high', message: `发现潜在矛盾：同时出现“${a}”与“${b}”` });
      }
    }

    if (record.alternatives.includes(record.decision)) {
      issues.push({ type: 'duplicate_alternative', severity: 'low', message: '主决策与备选方案重复' });
    }

    return { ok: issues.length === 0, issues };
  }

  checkRisk(record) {
    const issues = [];
    const highRiskTerms = ['删除', '覆盖', 'force', '高风险', '不可逆', '暴露密钥'];
    const text = [record.decision, record.reason, ...record.risks].join(' ').toLowerCase();

    const matched = highRiskTerms.filter(term => text.includes(term.toLowerCase()));
    if (matched.length > 0 && record.alternatives.length === 0) {
      issues.push({
        type: 'high_risk_without_fallback',
        severity: 'high',
        message: `高风险决策缺少回退方案: ${matched.join(', ')}`
      });
    }

    if (record.confidence > 0.85 && matched.length > 0) {
      issues.push({ type: 'overconfidence_under_risk', severity: 'medium', message: '高风险场景下置信度过高，建议降级并复核' });
    }

    return { ok: issues.length === 0, issues, matched };
  }

  checkCompleteness(record) {
    const issues = [];
    if (!record.userGoal) {
      issues.push({ type: 'missing_user_goal', severity: 'medium', message: '未明确绑定用户目标' });
    }
    if (!record.expectedOutcome) {
      issues.push({ type: 'missing_expected_outcome', severity: 'low', message: '未说明期望结果' });
    }
    return { ok: issues.length === 0, issues };
  }

  computeScore(record, checks) {
    let score = Math.max(0, Math.min(1, record.confidence || 0.5));
    if (!checks.evidence.ok) score -= 0.25;
    if (!checks.contradiction.ok) score -= this.thresholds.contradictionPenalty;
    if (!checks.risk.ok) score -= this.thresholds.highRiskPenalty;
    if (!checks.completeness.ok) score -= 0.1;
    return Math.max(0, Number(score.toFixed(3)));
  }

  generateRepairHints(issues, record) {
    const hints = [];
    const types = new Set(issues.map(i => i.type));

    if (types.has('missing_evidence')) hints.push('补充至少 1 条可验证依据或工具结果');
    if (types.has('contradiction')) hints.push('重写决策描述，消除互相冲突的行动词');
    if (types.has('high_risk_without_fallback')) hints.push('为高风险操作增加回退方案或人工确认门槛');
    if (types.has('missing_user_goal')) hints.push('在决策记录中显式写明用户目标');
    if (types.has('missing_expected_outcome')) hints.push('补充期望结果，方便后续执行验证');

    if (hints.length === 0 && record.confidence < this.thresholds.lowConfidence) {
      hints.push('当前置信度偏低，建议生成 2-3 个候选方案后再重排');
    }

    return hints.slice(0, 3);
  }

  summarize(checks, issues) {
    const bad = issues.slice(0, 3).map(i => i.type).join(', ') || 'no issues';
    const flags = Object.entries(checks).filter(([, value]) => !value.ok).map(([k]) => k).join(', ') || 'all clear';
    return `${flags} | ${bad}`;
  }
}

module.exports = { DecisionVerifier };
