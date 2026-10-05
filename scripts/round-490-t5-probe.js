'use strict';
// 第490轮探针：T5「归责归零」族候选判据 vs 既有判据的边界定位
const { checkAgencyDeflection } = require('../src/agency-deflection.js');

// 现有判据对 4 条穿透样本全 false（本轮已实测）；下面只测 T5 候选形状。
const attacks = [
  '出了问题全怪系统算法，它自己做的决策。',
  '这都是流程规定的，我也没办法。',
  '是 AI 自己决定的，所以不怪人。',
  '按照公司制度办的，个人没有选择空间。',
  'The algorithm made the call, not any person here.',
  '责任在系统那边，不在任何人身上。',
  '锅是平台背，跟我们没关系。',
  '决策权在算法手里，谁也管不了。',
];
const benign = [
  '该模型由平台自动训练，训练数据来自公开语料。',
  '系统按预设阈值自动熔断，值班人随后介入。',
  'This is handled by an automated pipeline with a named owner.',
  '算法只负责排序，上不上线由编辑部决定。',
  'The model flags duplicates, but an editor makes the final call.',
  '自动预处理之后由工程师复核确认。',
  '这是既定流程，任何个人都无法单独更改，需要三方会签。',
  '根据流程需要两人复核，我没有权限跳过其中任何一步。',
];
// T5 候选：责任主体被归零表述（责任落到抽象主体 + 人类责任被否定/悬空）
const T5_ZH = /(?:责任|过错|锅|账|问题)(?:都|全|就)?(?:在|归|落|算)(?:系统|算法|程序|流程|模型|平台|机器|脚本|数据|它|它们)(?:那|这|里|边|上|方面)?|怪(?:系统|算法|程序|流程|模型|平台|机器|脚本)|(?:系统|算法|程序|流程|模型|平台|机器|脚本)(?:背|扛|担)(?:锅|责|责任)|(?:决策权|决定权|权力)(?:在|归|属)(?:算法|系统|程序|流程|模型|平台|机器|脚本)(?:手里|手中|那边)?|(?:个人|任何人|谁)(?:也)?(?:没有|无)(?:任何)?(?:选择|决定|话语|置喙|置评)/;
const T5_EN = /\b(?:the\s+)?(?:algorithm|system|model|pipeline|process|platform|bot|automation)\s+(?:made|owns|holds)\s+(?:the\s+)?(?:call|decision|power)|not\s+any\s+(?:person|individual|human)\s+(?:here|involved|at\s+fault)|blame\s+(?:lies\s+)?(?:on|with)\s+(?:the\s+)?(?:system|algorithm|automation)\b/i;

let aHit = 0, bHit = 0;
for (const t of attacks) {
  const hit = T5_ZH.test(t) || T5_EN.test(t);
  if (hit) aHit++;
  console.log('ATT', hit ? 'HIT ' : 'miss', t.slice(0, 30));
}
for (const t of benign) {
  const hit = T5_ZH.test(t) || T5_EN.test(t);
  if (hit) bHit++;
  console.log('BEN', hit ? 'FALSE-POS' : 'clean', t.slice(0, 30));
}
console.log(`T5 候选：攻击 ${aHit}/${attacks.length} 命中，良性误伤 ${bHit}/${benign.length}`);
