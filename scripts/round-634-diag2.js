'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();
const samples = require(path.join(ROOT, 'test', 'round-634-dao-decision-samples.js'));

console.log('=== via DIRECT INSTANCE ===');
samples.softForce.concat(samples.contest).forEach((t, i) => {
  const r = hf.daoDecision.evaluate({ text: t, history: [] });
  console.log('  #' + i + ' verdict=' + r.verdict + ' score=' + r.daoScore + ' n=' + t.length);
});
console.log('=== via DISPATCH ===');
samples.softForce.concat(samples.contest).forEach((t, i) => {
  const r = hf.dispatch('daoDecision.evaluate', { text: t });
  console.log('  #' + i + ' verdict=' + r.verdict + ' score=' + r.daoScore + ' n=' + t.length);
});
