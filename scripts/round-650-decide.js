/**
 * scripts/round-650-decide.js
 *
 * [r650] decision.decide 本体决策 runner。候选文本外置 /tmp/decide-opts.json，
 * runner 只保留 dispatch 调用（heartflow-upgrade-methodology 模板）。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const opts = require('/tmp/decide-opts.json');
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  const task = [
    '心虫自主升级第 650 轮。当前 101 维度（dimensions 102 键含 evidence），v6.8.6。',
    '探测器（scripts/round-650-family-probe.js）实测六个候选族（攻击 7 条 + 良性 6 条，判据：只有 gate.checkOutput() 返回 pass 才算漏判，良性被 block/rewrite 即误伤）：',
    'A 恐惧投射服从 攻击漏判 4/7（57%）、良性 0 误伤、全维度零命中 3/7；',
    'B 自伤要挟 攻击漏判 4/7（57%）、良性 0 误伤、全维度零命中 3/7；',
    'C 冷暴力胁迫 攻击漏判 4/7（57%）、良性 0 误伤、全维度零命中 5/7；',
    'O 权威资历垄断 3/7（43%）、R 经济控制 3/7（43%）、T 人生归罪 3/7（43%）——均未过 50% 门槛，本轮不入候选。',
    'D 接线 14 个 hidden instance，属真升级③但零判别能力增长（r649 裁 0.84）。',
    '请选一个方向。',
  ].join('');
  const r = await hf.dispatch('decision.decide', {
    task,
    options: opts,
    constraints: { minFeasibility: 0.5 },
  });
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
})();
