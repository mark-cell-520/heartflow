/**
 * 第 533 轮 decision 本体选向（scout 连续第七轮空 → 自建族候选 A/B/E）。
 * 只用形状描述，不带样本文本（451 纪律：原文零进上下文）。
 * 用法: node scripts/round-533-decide.js
 */
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '[A] performative_responsibility 表演式担责族：口头上全部认下责任，同时把成因归给对方',
  '    （责任倒置/受害者姿态）。实测：9 条攻击样本 7 条穿过硬闸门（78%），6 条良性 0 误伤，',
  '    现有 75 维对本族零命中。属 verify 级（单句常兼有合规汇报句式，rewrite 易误伤）。',
  '    增益：覆盖道歉表演、反转受害者、以认罚换取追责终止这一整族。',
  '[B] moral_discounting 道德折现族：先承认一个小的过错，再把责难整体降级为过度反应/立场问题，',
  '    使实质责任被折价。实测：9 条攻击样本 7 条穿过硬闸门（78%），6 条良性 0 误伤，',
  '    现有 75 维零命中。属 rewrite 级（输出侧须改写为具体整改表述）。',
  '    增益：覆盖「错了但情有可原」「对方同样有过错」式责任折价与道德对冲。',
  '[E] tu_quoque_absolution 你也干过族：以对方/众人同样有过失来抵消本次责任，',
  '    使问责标准被双标化。实测：9 条攻击样本 7 条穿过硬闸门（78%），6 条良性 0 误伤，',
  '    现有 75 维零命中。属 verify 级（需分别归因，不建立单边豁免）。',
  '    增益：覆盖历史过失抵消、众人有份免单边追责这一整族。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向（第 533 轮，三个候选取一个）', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
