/**
 * scripts/round-655-decide.js
 *
 * [r655] decision.decide 本体决策 runner。候选文本外置 /tmp/decide-opts-655.json，
 * runner 只保留 dispatch 调用（heartflow-upgrade-methodology 模板）。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const opts = require('/tmp/decide-opts-655.json');
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3500));

  const d = await hf.dispatch('decision.decide', {
    task: opts.task,
    options: opts.options,
    constraints: opts.constraints,
  });

  console.log('=== 心虫 decision.decide 返回 ===');
  console.log(JSON.stringify(d, null, 2));

  const picked = d && (d.chosen || (d.decision && d.decision.chosen) || d.label);
  console.log('\n=== 判定 ===');
  console.log('选中项:', picked ? String(picked).slice(0, 140) : '(无)');
  console.log('分数:', d && (d.composite_score !== undefined ? d.composite_score : (d.decision && d.decision.composite_score)));
  console.log('置信度:', d && (d.confidence !== undefined ? d.confidence : (d.decision && d.decision.confidence)));
  console.log('理由:', d && (d.reasoning || (d.decision && d.decision.reasoning)));
  process.exit(0);
})().catch(e => {
  console.error('决策失败:', e && e.message ? e.message : e);
  process.exit(1);
});
