// [r665] decision.decide 本体选方向（候选文本外置 /tmp/decide-opts.json）
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const opts = require('/tmp/decide-opts.json');

(async () => {
  const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3000));
  const d = await hf.dispatch('decision.decide', opts);
  console.log(JSON.stringify({
    chosen: d.chosen, reasoning: d.reasoning, confidence: d.confidence,
    composite_score: d.composite_score, identity_alignment: d.identity_alignment,
    chosenPath: d.chosenPath,
  }, null, 2));
  if (d.scores || d.options) console.log('scores:', JSON.stringify(d.scores || d.options, null, 2));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
