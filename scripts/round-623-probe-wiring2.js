#!/usr/bin/env node
/* r623 精确接线实测：plugins 目录、_loadPlugins、sycophancy 在 think() 路径是否注册 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const HF = require(path.join(ROOT, 'src/core/heartflow.js'));
  const HeartFlow = HF.HeartFlow || HF;
  const hf = new HeartFlow();
  await new Promise(r => setTimeout(r, 300));

  console.log('_hookBus:', !!hf._hookBus);
  if (hf._hookBus) {
    const list = (hf._hookBus._handlers && hf._hookBus._handlers.get('postprocess.think')) || [];
    console.log('postprocess.think handlers:', list.length);
    console.log('handler ids:', list.map(h => h.id || (h.fn && h.fn.name) || '?').join(', '));
  }
  console.log('hf.plugins:', hf.plugins ? Object.keys(hf.plugins).join(',') : '(none)');
  console.log('hf._plugins:', hf._plugins ? Object.keys(hf._plugins).join(',') : '(none)');
  console.log('hf._sycophancyAnalyzer:', !!hf._sycophancyAnalyzer);

  // 找模块里的 plugin 加载逻辑
  for (const rel of ['src/core/heartflow.js', 'src/core/engine-constructor.js', 'src/core/engine-initializer.js']) {
    const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const hits = t.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) =>
      /plugins?[\/]|_loadPlugins|PLUGIN|sycophan|initPlugin|registerPlugin/.test(l));
    if (hits.length) {
      console.log('--- ' + rel);
      for (const [n, l] of hits.slice(0, 15)) console.log('  ' + n + ': ' + l.trim().slice(0, 130));
    }
  }
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
