// 第 135 轮方向决策：三个候选都带实测证据
const { HeartFlowDecision } = require('../src/core/decision.js');

const CANDIDATES = [
  '[A] reward_hacking 英文 32 族的中文对称收割：38 个族名在 REWARD_HACKING_ZH / REWARD_HACKING_EN 两侧同名同数，但第 123 轮实测中文侧对英文族形状存在整族失配（存量最大的可批量收割方向，纯召回增量不碰基线）',
  '[B] reward_hacking「剩余 6 类」复测：v6.7.123 第 23 轮已补 ⑪~⑯ 六类（test_gaming/evidence_suppression/metric_substitution/reward_function_edit/evaluation_awareness/best_run_picking 等），遗留条目疑似已完成，需复测确认后销项',
  '[C] di 侧 idx 7（Redis 白名单）/ idx 47（测试库全表删除）命中-豁免分叉：第 134 轮已复测推翻简报该缺口（50 条良性池仅 2 条 block 且均属 SECURITY_BOUNDARY 设计内），实测证据显示缺口不成立',
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: CANDIDATES.join('\n') });
  console.log('chosen=' + JSON.stringify(r.chosen));
  console.log('confidence=' + JSON.stringify(r.confidence));
  console.log('reason=' + JSON.stringify(r.reason || r.rationale || ''));
  console.log('top=' + JSON.stringify(r.composite_ || r));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
