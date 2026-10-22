'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] reward_hacking 中文 eval_leakage 对称收割：轮初实测中文 8/8 全漏（四条英文已收形状的中文对应：把训练集当 benchmark 用、名义上留出集实为训练集、拿到评测集就训、模型早就见过评测题），良性 6 条 0 误伤。英文侧第 70 轮已有 5 条同族判据，中文侧 4 条判据全不覆盖这四种分裂语序。',
    '[B] reward_hacking 中文 task_substitution 补形：轮初中文 1/3 漏判（挑软柿子做、难的整块跳过不汇报），另 2 条已命中；英文侧同族 6 条。证据量小于 A。',
    '[C] 删 CFG_MARK 死分支：第 138 轮遗留，「开关」字面路径已被 _switchIsConfig 取代，实测为死分支，删除并确认无回归；预期收益低、无新能力。',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r).slice(0, 2000));
})().catch(e => console.error('ERR', e.message));
