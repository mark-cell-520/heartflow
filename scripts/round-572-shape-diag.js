#!/usr/bin/env node
/* r572 诊断：五层到底跑没跑通 + 真实返回形状（只打印结构与计数，不打印样本原文） */
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const hf = new HeartFlow({ rootPath: ROOT, silent: true });
hf.start();
const ae = hf.associativeEngine;
if (!ae) { console.log('NO ENGINE'); process.exit(1); }

const NEUTRAL = 'The quarterly revenue figure implies the plant output is overheated.';

(async () => {
  const r = await ae.process(NEUTRAL, {});
  console.log('--- process() 顶层键:', Object.keys(r));
  console.log('--- internal 键:', r.internal ? Object.keys(r.internal) : 'null');
  console.log('--- internal.coherence:', JSON.stringify(r.internal && r.internal.coherence));
  console.log('--- internal.metrics 键:', r.internal && r.internal.metrics ? Object.keys(r.internal.metrics) : 'null');
  console.log('--- response len:', String(r.response || '').length);
  console.log('--- internal.layers 键:', r.internal && r.internal.layers ? Object.keys(r.internal.layers) : 'null');

  const L = r.internal && r.internal.layers || {};
  console.log('--- L1 keys:', Object.keys(L.L1 || {}));
  console.log('--- L1 allAssociations n:', (L.L1 && L.L1.allAssociations || []).length,
    'words n:', (L.L1 && L.L1.words || []).length);
  console.log('--- L1.words[:5] (词形本身非样本原文):', (L.L1 && L.L1.words || []).slice(0, 5));
  console.log('--- L2 chunks n:', (L.L2 && L.L2.chunks || []).length);
  console.log('--- L3 matchedPrototype:', L.L3 && L.L3.matchedPrototype ? L.L3.matchedPrototype.name : 'null',
    'confidence:', L.L3 && L.L3.confidence);
  console.log('--- L4 understoodIntent:', String(L.L4 && L.L4.understoodIntent).slice(0, 60));
  console.log('--- L4 activatedConcepts n:', (L.L4 && L.L4.thoughtVector && L.L4.thoughtVector.activatedConcepts || []).length);
  console.log('--- L5 wordCount:', L.L5 && L.L5.wordCount, 'responseLen:', String((L.L5 && L.L5.response) || '').length);

  const tr = ae.getLastProcessing();
  console.log('--- getLastProcessing() n:', tr.length, '首元素键:', Object.keys(tr[0] || {}));
  console.log('--- L1_associations:', JSON.stringify(tr[0] && tr[0].L1_associations).slice(0, 200));
  console.log('--- L4_convergence:', JSON.stringify(tr[0] && tr[0].L4_convergence).slice(0, 200));
  console.log('--- degraded:', tr[0] && tr[0].degraded);

  // 真值校验：coherence 是否来自真五层（issues 数组 + overallScore 是否随输入变化）
  const c = r.internal && r.internal.coherence;
  console.log('--- coherence.score:', c && c.score, 'issues n:', c && c.issues ? c.issues.length : 'N/A');
  console.log('--- CoherenceChecker 直接跑:', JSON.stringify(
    require(path.join(ROOT, 'src/archive/associative-engine.js')).CoherenceChecker.runAllChecks({
      L1: L.L1, L2: L.L2, L3: L.L3, L4: L.L4
    })
  ).slice(0, 300));
  process.exit(0);
})().catch(e => { console.error('fatal', e); process.exit(1); });
