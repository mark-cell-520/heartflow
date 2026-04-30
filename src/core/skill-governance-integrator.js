/**
 * Skill Governance Integrator - 技能治理集成器
 *
 * 本模块把 2026-04-30 GitHub 搜索得到的 agent-skill 实践
 * 收束成 HeartFlow 可执行的轻量治理层：
 * - progressive disclosure：技能文档分层，避免一次性塞满上下文
 * - command/agent/skill orchestration：把任务拆成入口、执行者、可复用能力
 * - audit gates：版本、隐私、危险动作、历史记录四类门控
 * - evidence ledger：每次升级必须留下来源、验证、风险与结果
 *
 * 这不是外部依赖；它是可测试、可复用的纯 JS 小模块。
 */

const DEFAULT_GATES = Object.freeze([
  'version-consistency',
  'privacy-redaction',
  'dangerous-action-review',
  'history-preservation',
  'verification-evidence'
]);

class EvidenceLedger {
  constructor(entries = []) {
    this.entries = Array.isArray(entries) ? entries.slice() : [];
  }

  add(entry) {
    const normalized = {
      time: entry.time || new Date().toISOString(),
      source: entry.source || 'unknown',
      claim: entry.claim || '',
      evidence: entry.evidence || '',
      verification: entry.verification || 'pending',
      risk: entry.risk || 'unknown'
    };
    this.entries.push(normalized);
    return normalized;
  }

  summarize() {
    return {
      total: this.entries.length,
      verified: this.entries.filter(e => e.verification === 'verified').length,
      pending: this.entries.filter(e => e.verification !== 'verified').length,
      highRisk: this.entries.filter(e => e.risk === 'high').length
    };
  }
}

class SkillGovernanceIntegrator {
  constructor(options = {}) {
    this.gates = options.gates || DEFAULT_GATES;
    this.ledger = new EvidenceLedger(options.evidence || []);
  }

  createUpgradePlan(request = {}) {
    const goal = request.goal || 'integrate external agent-skill practice into HeartFlow';
    const sources = request.sources || [];
    return {
      goal,
      versionDelta: request.versionDelta || '0.0.1',
      phases: [
        { name: 'research', output: 'sources and transferable patterns' },
        { name: 'plan', output: 'minimal integration plan with touched files' },
        { name: 'implement', output: 'small code/doc patch' },
        { name: 'audit', output: 'gate report and remaining risks' },
        { name: 'sync', output: 'git commit/push verification' }
      ],
      gates: this.gates.slice(),
      sources
    };
  }

  classifySkillDocument(text = '') {
    return {
      hasFrontmatter: /^---\n[\s\S]*?\n---/.test(text),
      hasProblemSolved: /problem solved|why it exists|问题解决/i.test(text),
      hasWhenToUse: /when to use|how to invoke|使用|触发/i.test(text),
      hasSafety: /safety|security|guardrail|隐私|安全/i.test(text),
      hasHistory: /changelog|version history|版本历史|变更日志/i.test(text),
      hasVerification: /verify|verification|验证|audit|审计/i.test(text)
    };
  }

  auditUpgrade(files = {}) {
    const findings = [];
    const versionValues = new Set();

    for (const [name, text] of Object.entries(files)) {
      const versions = String(text).match(/v?\d+\.\d+\.\d+/g) || [];
      versions.forEach(v => versionValues.add(v.replace(/^v/, '')));
      const secretPattern = /(?:api[_-]?key|token|secret|password)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}/i;
      const privateIdPattern = /(?:wechat|weixin)\s*[:=]\s*['\"]?[A-Za-z0-9_\-@]{16,}/i;
      if (secretPattern.test(text) || privateIdPattern.test(text)) {
        findings.push({ severity: 'high', file: name, issue: 'possible credential or private identifier value' });
      }
      if (/rm\s+-rf\s+\/|curl\s+[^|]+\|\s*(bash|sh)/i.test(text)) {
        findings.push({ severity: 'high', file: name, issue: 'dangerous shell pattern requires explicit review' });
      }
    }

    return {
      gates: this.gates.slice(),
      versionCandidates: Array.from(versionValues).sort(),
      findings,
      passed: findings.filter(f => f.severity === 'high').length === 0,
      ledger: this.ledger.summarize()
    };
  }
}

module.exports = {
  DEFAULT_GATES,
  EvidenceLedger,
  SkillGovernanceIntegrator
};
