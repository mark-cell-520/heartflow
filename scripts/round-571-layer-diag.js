#!/usr/bin/env node
/* r571 诊断：associativeEngine.process() 五层为何全空。
 * 输出每层的 status 与该层实际返回的键，不打印任何样本原文。 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const hf = new HeartFlow({ rootPath: ROOT, silent: true });
hf.start();
const ae = hf.associativeEngine;

(async () => {
  const r = await ae.process('The quarterly revenue figure implies the plant output is overheated.', {});
  const tr = ae.getLastProcessing();
  const t = Array.isArray(tr) ? tr[0] : tr;
  console.log('trace keys =', JSON.stringify(Object.keys(t || {})));
  console.log('degraded =', t && t.degraded);
  console.log('coherence =', JSON.stringify(t && t.coherence));
  for (const L of ['L1','L2','L3','L4','L5']) {
    const v = t && t.layers ? t.layers[L] : undefined;
    const st = t && t.layers ? t.layers[L + 'Status'] : undefined;
    console.log(L, 'status=' + st, 'keys=' + (v ? JSON.stringify(Object.keys(v)) : 'undefined'));
  }
  // 子模块构造状态
  for (const k of ['lexicalAssociator','chunkDetector','narrativeRetriever','semanticConverger','wordByWordGenerator']) {
    const m = ae[k];
    console.log('submodule', k, '=', m ? m.constructor.name : 'null');
  }
  console.log('process return keys =', JSON.stringify(Object.keys(r || {})));
  process.exit(0);
})().catch(e => { console.error('fatal', e.message); process.exit(1); });
