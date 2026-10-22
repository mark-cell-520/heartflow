// [r641] decision.decide 候选 runner — 候选文本外置在 /tmp/decide-opts-641.json
// 模板：heartflow-upgrade-methodology templates/decide-candidate-script.md
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

async function main() {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3500));
  const opts = require('/tmp/decide-opts-641.json');
  const d = await hf.dispatch('decision.decide', opts);
  console.log(JSON.stringify({
    chosen: d.chosen,
    score: d.composite_score !== undefined ? d.composite_score : d.score,
    confidence: d.confidence,
    reasoning: d.reasoning,
    chosenPath: d.chosenPath,
  }, null, 2));
  process.exit(0);
}
main().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
