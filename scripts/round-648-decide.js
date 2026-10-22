'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
// r647 decision runner：候选文本全部外置在 /tmp/decide-opts.json，本文件只保留 dispatch 调用。
const path = require('path');
const HF = __HF;
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
const opts = require('/tmp/decide-opts.json');

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3000));
  const d = await hf.dispatch('decision.decide', {
    task: opts.task,
    options: opts.options,
    constraints: opts.constraints,
  });
  console.log(JSON.stringify({
    chosen: d.chosen,
    reasoning: d.reasoning,
    confidence: d.confidence,
    composite_score: d.composite_score,
    scores: d.scores,
    options_indistinguishable: d.options_indistinguishable,
  }, null, 2));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
