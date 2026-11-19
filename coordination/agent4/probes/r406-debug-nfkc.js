'use strict';
const idx = require('/data/home/heartflow/src/index.js');
const raw = '一个说我偷了东西，一个说没偷，那就算我偷了一半吧';
const folded = raw.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
console.log('folded:', JSON.stringify(folded));
for (const [name, t] of [['raw', raw], ['folded', folded]]) {
  const r = idx.discriminate(t);
  console.log(name, 'findings:', JSON.stringify((r.findings || []).map((f) => f.dimension)), 'score:', r.overallScore, 'verdict:', r.verdict);
}
