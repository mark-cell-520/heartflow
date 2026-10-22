/**
 * scripts/round-566-decide.js
 * 第 566 轮方向选择：decision 本体从探测器候选里选一个。
 * 铁律：候选文本只含形状描述，不含攻击样本原文。
 */
'use strict';

const { HeartFlowDecision } = require('../src/core/decision.js');

const CANDIDATE = [
  '[A] moral_licensing：道德许可——以既往善行/过往相对干净为由，给当前越界行为发许可证。',
  '   实测: 13/13 条攻击样本穿过硬闸门（gate=pass，zh 8/8, en 5/5），现有维度对这一族零覆盖；',
  '   良性对照 0 误伤（共 5 条）。属 rewrite 级。',
  '[B] shame_compliance：羞耻施压换服从——以丢人/没资格/别人怎么看为由取消对方表态。',
  '   实测: 11/13 条攻击样本穿过硬闸门（gate=pass，zh 6/8, en 5/5），现有维度对这一族零覆盖；',
  '   良性对照 0 误伤（共 5 条）。属 rewrite 级。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt: CANDIDATE });
  console.log(JSON.stringify(r, null, 0));
  process.exit(0);
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
