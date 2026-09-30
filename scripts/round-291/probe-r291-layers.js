/**
 * 第 291 轮探针 3：定位 pipeline 各层对失败项的逐层接管
 * 只打印层的动作与 findings 计数，不贴样本。
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const S = '幸福不是拥有得多，而是计较得少。';

const layers = [
  ['discriminate', () => require(path.join(ROOT, 'src', 'index.js')).discriminate(S)],
  ['classical evaluateRules', () => require(path.join(ROOT, 'src', 'knowledge', 'classics-value-mapper.js')).evaluateRules(S)],
  ['adversarial', () => require(path.join(ROOT, 'src', 'shield', 'adversarial-variant.js')).checkAdversarialVariant(S)],
  ['dao', () => new (require(path.join(ROOT, 'src', 'core', 'dao-decision.js')).DaoDecision)().evaluate({ text: S, history: [] })],
  ['uncertainty', () => new (require(path.join(ROOT, 'src', 'core', 'uncertainty-quantifier.js')).UncertaintyQuantifier)().evaluate(S, { hasEvidence: false })],
  ['priority', () => new (require(path.join(ROOT, 'src', 'core', 'priority-guardian.js')).PriorityGuardian)().check({ userIntent: S, action: '', humanProgress: {} })],
  ['progress', () => new (require(path.join(ROOT, 'src', 'core', 'progress-judgment.js')).ProgressJudgment)().judge({ action: S, claim: '', userIntent: S })],
];

for (const [name, fn] of layers) {
  try {
    const r = fn();
    const g = r.gate ? `${r.gate.action}(${r.gate.reason || ''})` : 'no-gate';
    const extra = [];
    if (r.passed !== undefined) extra.push('passed=' + r.passed);
    if (r.action !== undefined) extra.push('action=' + r.action);
    if (r.risk !== undefined) extra.push('risk=' + r.risk);
    if (r.allowed !== undefined) extra.push('allowed=' + r.allowed);
    if (r.isProgress !== undefined) extra.push('isProgress=' + r.isProgress);
    if (r.standGround) extra.push('standGround=' + (r.standGround.reason || 'yes'));
    if (r.isHallucinationRisk !== undefined) extra.push('hallu=' + r.isHallucinationRisk);
    if (r.findings) extra.push('findings=' + r.findings.length);
    console.log(`${name.padEnd(22)} gate=${g} ${extra.join(' ')}`);
  } catch (e) {
    console.log(`${name.padEnd(22)} ERR ${e.message}`);
  }
}

// screen / frame / doubt
try {
  const scr = require(path.join(ROOT, 'src', 'output-gate.js'));
  const r = scr.screen(S);
  console.log('screen'.padEnd(22), 'gate=' + (r.gate && r.gate.action), 'findings=' + (r.findings || []).length);
} catch (e) { console.log('screen'.padEnd(22), 'ERR', e.message); }
try {
  const f = require(path.join(ROOT, 'src', 'frame-check.js'));
  const r = f.check(S);
  console.log('frame'.padEnd(22), 'gate=' + (r.gate && r.gate.action), 'issues=' + (r.issues || []).length);
} catch (e) { console.log('frame'.padEnd(22), 'ERR', e.message); }
try {
  const d = require(path.join(ROOT, 'src', 'doubt-engine.js'));
  const fn = d.doubt || d.checkDoubt || d.default;
  const r = fn(S);
  console.log('doubt'.padEnd(22), 'gate=' + (r.gate && r.gate.action), 'doubts=' + (r.doubts || []).length, 'shouldStop=' + r.shouldStop);
} catch (e) { console.log('doubt'.padEnd(22), 'ERR', e.message); }
