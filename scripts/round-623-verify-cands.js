#!/usr/bin/env node
/* r623 候选精确引用复核：排除自身文件，确认是真零引用还是被 loader 动态加载 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const CANDIDATES = [
  ['src/shield/language-honesty.js', ['checkQuestions', 'checkTuringRoute', 'checkPzombieBoundary', 'detectDualStandard', 'checkConfidence', 'reduceQuestions']],
  ['src/emotion/empathy-detector.js', ['computeEmpathyScore', 'detectEmotionalContagion', 'detectEmpathicConcern', 'detectPerspectiveTaking', 'detectSelfOtherDistinction', 'analyze']],
  ['src/shield/safety-guardrails.js', ['detectSelfHarmSubstitution', 'detectDisorderedEating', 'checkCrisisSharingProtocol', 'detectMemoryForbiddenPhrases', 'detectPromptInjection', 'evaluateRequest']],
  ['src/core/cognitive-appraisal.js', ['detectIntrospectionIllusion', 'classifyThreatType', 'recommendCopingStrategies']],
  ['src/reasoning/fact-checker.js', ['detectAbsolutism']],
  ['src/memory/emotional-memory-bridge.js', ['assessSelfRegulationHealth', 'checkDuplicate', 'fingerprintText']],
  ['src/cortex/metacognitive-reward.js', ['MetacognitiveReward', 'evaluate']],
  ['src/workflow/workflow-switch.js', ['evaluateSwitch', 'switchWorkflow', 'analyzeIntent']],
];

const allFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'archive' || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) allFiles.push(p);
  }
})(ROOT);

for (const [mod, names] of CANDIDATES) {
  const self = path.join(ROOT, mod);
  console.log('=== ' + mod + ' ===');
  // 有没有被 require（动态/静态）
  const base = path.basename(mod, '.js');
  const reqRe = new RegExp("require\\(['\"][^'\"]*" + base + "(\\.js)?['\"]\\)", 'g');
  const reqHits = [];
  for (const f of allFiles) {
    if (f === self) continue;
    const t = fs.readFileSync(f, 'utf8');
    if (reqRe.test(t)) reqHits.push(path.relative(ROOT, f));
    reqRe.lastIndex = 0;
  }
  console.log('  require hits (excl self):', reqHits.length ? reqHits.join(' , ') : 'NONE');
  // 目录动态扫描
  const dir = path.dirname(self);
  const scanRe = new RegExp("['\"]" + path.basename(dir) + "['\"]|plugins", 'g');
  const scanHits = [];
  for (const f of allFiles) {
    const t = fs.readFileSync(f, 'utf8');
    if (/PLUGINS_DIR|_scanPlugins|readdirSync.*plugins|plugins\//.test(t)) scanHits.push(path.relative(ROOT, f));
  }
  console.log('  dynamic-scan files:', scanHits.slice(0, 8).join(' , ') || 'NONE');
  // 每个导出名的引用
  for (const n of names) {
    const re = new RegExp('\\b' + n + '\\b', 'g');
    const hits = [];
    for (const f of allFiles) {
      if (f === self) continue;
      if (path.basename(f).startsWith('round-623')) continue;
      const t = fs.readFileSync(f, 'utf8');
      const ln = t.split('\n');
      for (let i = 0; i < ln.length; i++) {
        if (re.test(ln[i])) { hits.push(path.relative(ROOT, f) + ':' + (i + 1)); re.lastIndex = 0; break; }
      }
    }
    console.log('    ' + n.padEnd(30) + ' -> ' + (hits.length ? hits.slice(0, 4).join(' , ') : 'ZERO_REF'));
  }
}
