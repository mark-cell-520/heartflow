'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();
const en = require(path.join(ROOT, 'test', 'round-634-dao-decision-en-samples.js'));
en.enReversal.forEach((t, i) => {
  const r = hf.daoDecision.evaluate({ text: t, history: [] });
  const row = r.results.find(x => x.type === 'reversal');
  console.log('[rev' + i + '] ok=' + row.ok + ' | len=' + t.length + ' | reason=' + row.reason);
});
// 对照：中文 reversal 族是否仍全中
const zh = require(path.join(ROOT, 'test', 'round-634-dao-decision-samples.js'));
zh.reversal.forEach((t, i) => {
  const r = hf.daoDecision.evaluate({ text: t, history: [] });
  const row = r.results.find(x => x.type === 'reversal');
  console.log('[zhrev' + i + '] ok=' + row.ok + ' | reason=' + row.reason);
});
