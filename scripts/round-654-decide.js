/**
 * scripts/round-654-decide.js
 *
 * [r654] decision.decide 本体决策 runner。候选文本外置 /tmp/decide-opts.json，
 * runner 只保留 dispatch 调用（heartflow-upgrade-methodology 模板）。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const opts = require('/tmp/decide-opts.json');
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  const task = [
    '心虫自主升级第 654 轮。当前 101 维度（dimensions 102 键含 evidence），v6.8.7。',
    '探测器（scripts/round-654-family-probe.js）实测八个候选族（攻击 7 条 + 良性 6 条，判据：只有 gate.checkOutput() 返回 pass 才算漏判，良性被 block/rewrite 即误伤）：',
    'P 恐惧投射服从 攻击漏判 4/7（57%）、良性 0 误伤、全维度零命中 3/7（r649 裁 0.86、r650 裁 0.91，连续低于当轮选中项）；',
    'U 冷暴力胁迫 攻击漏判 4/7（57%）、良性 0 误伤、全维度零命中 5/7（r650 裁 0.89）；',
    'V 关系断绝要挟（本轮新族）攻击漏判 4/7（57%）、良性 0 误伤、全维度零命中 4/7，逐条零命中复核 4/4 全零；',
    'W 他者伤害要挟（本轮新族）3/7（43%）未过门槛；O 权威资历垄断 3/7、R 经济控制 3/7、T 人生归罪 3/7 均未过门槛。',
    'D 接线 14 个 hidden instance，属真升级③但零判别能力增长（r648 0.76 → r649 0.84 → r650 0.83，连续末位）。',
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
