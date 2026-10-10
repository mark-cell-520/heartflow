/**
 * scripts/round-645-decide.js
 * 按 templates/decide-candidate-script.md 模板：候选外置 JSON，runner 只保留 dispatch 调用。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const opts = require('/tmp/decide-opts-645.json');

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

  console.log('═══ 心虫 decision.decide 返回 ═══');
  console.log(JSON.stringify(d, null, 2));

  const picked = d && (d.chosen || (d.decision && d.decision.chosen) || d.label);
  console.log('\n═══ 判定 ═══');
  console.log('选中项:', picked ? String(picked).slice(0, 120) : '(无)');
  console.log('分数:', d && (d.composite_score !== undefined ? d.composite_score : (d.decision && d.decision.composite_score)));
  console.log('置信度:', d && (d.confidence !== undefined ? d.confidence : (d.decision && d.decision.confidence)));
  console.log('理由:', d && (d.reasoning || (d.decision && d.decision.reasoning)));

  process.exit(0);
})().catch(e => {
  console.error('决策失败:', e && e.message ? e.message : e);
  process.exit(1);
});
