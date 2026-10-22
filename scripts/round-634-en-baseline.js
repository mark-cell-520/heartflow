'use strict';
/**
 * [r634] 基线实测：daoDecision 四层对英文族的覆盖度（改造前应为零命中）。
 * 只打印数字，不贴样本原文。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();
const en = require(path.join(ROOT, 'test', 'round-634-dao-decision-en-samples.js'));

function layerHits(list, type) {
  let hit = 0;
  list.forEach(t => {
    const r = hf.daoDecision.evaluate({ text: t, history: [] });
    const row = r.results.find(x => x.type === type);
    if (row && !row.ok) hit++;
  });
  return hit;
}
const res = {
  enSoftForce_natural_order: layerHits(en.enSoftForce, 'natural_order') + '/' + en.enSoftForce.length,
  enReversal_reversal: layerHits(en.enReversal, 'reversal') + '/' + en.enReversal.length,
  enContest_non_contest: layerHits(en.enContest, 'non_contest') + '/' + en.enContest.length,
  enDeclaration_silent_teaching: layerHits(en.enDeclaration, 'silent_teaching') + '/' + en.enDeclaration.length,
  enBenign_verdictPASS: en.enBenign.filter(t => hf.daoDecision.evaluate({ text: t, history: [] }).verdict === 'PASS').length + '/' + en.enBenign.length,
  enBenignForce_notREJECT: en.enBenignForce.filter(t => hf.daoDecision.evaluate({ text: t, history: [] }).verdict !== 'REJECT').length + '/' + en.enBenignForce.length
};
console.log(JSON.stringify(res, null, 1));
