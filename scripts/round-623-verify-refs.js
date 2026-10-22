#!/usr/bin/env node
/* r623 精确引用定位：sycophancy-check plugin 的导出函数是否真零引用？
 * 排除 appears-in-own-dir 的误判。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  ['analyzeEN', 'sycophancy-check'],
  ['analyzeZH', 'sycophancy-check'],
  ['checkQuestions', 'language-honesty'],
  ['checkTuringRoute', 'language-honesty'],
  ['detectDualStandard', 'language-honesty'],
  ['checkConfidence', 'language-honesty'],
  ['evaluateRequest', 'safety-guardrails'],
  ['detectPromptInjection', 'safety-guardrails'],
  ['evaluateDream', 'wake-up-verifier'],
  ['computeEmpathyScore', 'empathy-detector'],
  ['detectPerspectiveTaking', 'empathy-detector'],
  ['detectIntrospectionIllusion', 'cognitive-appraisal'],
  ['detectAbsolutism', 'fact-checker'],
  ['detectEmotionalContagion', 'empathy-detector'],
  ['assessSelfRegulationHealth', 'emotional-memory-bridge'],
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

for (const [name, hint] of TARGETS) {
  const re = new RegExp('\\b' + name + '\\b', 'g');
  const hits = [];
  for (const f of allFiles) {
    const t = fs.readFileSync(f, 'utf8');
    const lines = t.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        hits.push(path.relative(ROOT, f) + ':' + (i + 1));
        re.lastIndex = 0;
        break;
      }
    }
  }
  console.log(name.padEnd(32), '(' + hint + ')', '->', hits.length ? hits.join(' , ') : 'ZERO_REF');
}
