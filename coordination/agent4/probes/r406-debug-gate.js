'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const m = require('/data/home/heartflow/src/argument-to-moderation.js');
const s9 = '一个说我偷了东西，一个说没偷，那就算我偷了一半吧';
const s5 = 'One side exaggerated, but the other side overreacted; meet in the middle.';
const r = hf.checkOutput(s9);
console.log('s9 gate:', JSON.stringify(r.gate), 'findings:', (r.findings || []).map((f) => f.dimension).join(','));
console.log('s9 module:', JSON.stringify(m.checkArgumentToModeration(s9)));
// 试探 gate 层的归一化文本：从 trace / pipeline 拿
try {
  const pipe = require('/data/home/heartflow/src/pipeline.js');
  if (pipe.runPipeline) {
    const p = pipe.runPipeline({ input: s9, mode: 'fast' });
    const t = p.normalized || (p.stages && p.stages.normalize && p.stages.normalize.text) || null;
    console.log('pipeline normalized:', JSON.stringify(t));
    if (t) console.log('module on normalized:', JSON.stringify(m.checkArgumentToModeration(t)));
  }
} catch (e) { console.log('pipeline probe err:', e.message); }
const r5 = hf.checkOutput(s5);
console.log('s5 gate:', JSON.stringify(r5.gate), 'findings:', (r5.findings || []).map((f) => f.dimension).join(','));
