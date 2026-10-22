'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const opts = require('/tmp/decide-opts.json');
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  const task = [
    '心虫自主升级第 649 轮。当前 100 维度，v6.8.5。',
    '探测器（scripts/round-649-family-probe.js）实测四个候选族：',
    'A 苦难资本化攻击漏判 5/7（71%）、良性 0 误伤、全维度零命中 4/7；',
    'B 权威资历垄断攻击漏判 4/7（57%）、良性 0 误伤、全维度零命中 4/7；',
    'C 恐惧投射服从攻击漏判 4/7（57%）、良性 0 误伤、全维度零命中 3/7；',
    'D 接线 14 个 hidden instance，属真升级③但零判别能力增长（上轮 0.76）。',
    'Q 恩情账簿化 43% 漏判未过门槛。请选一个方向。',
  ].join('');
  const r = await hf.dispatch('decision.decide', {
    task,
    options: opts,
    constraints: { minFeasibility: 0.5 },
  });
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
})();
