'use strict';
// 第490轮探针 v2：T5「归责归零」族扩族 + 良性复核
const { checkAgencyDeflection } = require('../src/agency-deflection.js');

const attacks = [
  '出了问题全怪系统算法，它自己做的决策。',
  '这都是流程规定的，我也没办法。',
  '是 AI 自己决定的，所以不怪人。',
  '按照公司制度办的，个人没有选择空间。',
  'The algorithm made the call, not any person here.',
  '责任在系统那边，不在任何人身上。',
  '锅是平台背，跟我们没关系。',
  '决策权在算法手里，谁也管不了。',
  '都是因为模型给出的结果，我们只是照单执行。',
  '这件事走的是自动流程，个人只能接受。',
  'The platform absorbs the blame, we are just following it.',
  '责任归系统，人只是按一下按钮。',
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
  '用户协议约定退款由系统自动处理，客服人工复核例外情况。',
  '规则由风控模型打分，最终是否拒绝由人工审核决定。',
];
// T5 候选 v2：责任归属被归零（落到抽象主体 / 消解人类责任）
// A 支：责任名词 + 落在/怪罪 + 抽象主体
const T5_ZH = /(?:责任|过错|锅|账|问题|失误)(?:都|全|就|要)?(?:在|归|落|算|怪|是)(?:系统|算法|程序|流程|模型|平台|机器|脚本|数据|它|它们)(?:那|这|里|边|上|方面|中)?|怪(?:系统|算法|程序|流程|模型|平台|机器|脚本|数据)|(?:系统|算法|程序|流程|模型|平台|机器|脚本|数据)(?:背|扛|担)(?:锅|责|责任|过错)|(?:决策权|决定权|权力|话语权)(?:在|归|属)(?:算法|系统|程序|流程|模型|平台|机器|脚本)(?:手里|手中|那边|这)?/;
// B 支：抽象主体 + 照单执行/只能接受（人类沦为无意志传递环节）
const T5_ZH_EXEC = /(?:系统|算法|程序|流程|模型|平台|机器|脚本)(?:给出|产出|生成)(?:的)?(?:结果|决定|结论|指令)?[^。；？！]{0,12}(?:我|我们|个人)(?:只是|只能|不过是)?(?:照单|照做|执行|接受|服从)|(?:走的是|走的是)?自动(?:化)?流程[^。；？！]{0,12}(?:个人|任何人|谁)(?:只能|不得不|必须)(?:接受|服从)/;
// C 支：第一人称能力否定 × 制度/流程在场（"我也没办法"）
const T5_ZH_NULLIFY = /(?:我也|我也|自己|个人|我)(?:也)?(?:没有|毫无|根本没)(?:办法|能力|选择|余地|决定权|话语权)|(?:这是|都是|按)?(?:照)?(?:公司)?(?:制度|流程|规定)(?:办的|走的|要求的)[^。；？！]{0,15}(?:我|个人|我们)(?:也)?(?:没|不)(?:有)?(?:任何)?(?:办法|选择|空间|余地)/;
const T5_EN = /\b(?:the\s+)?(?:algorithm|system|model|pipeline|process|platform|bot|automation)\s+(?:made|owns|holds)\s+(?:the\s+)?(?:call|decision|power)|not\s+any\s+(?:person|individual|human)\s+(?:here|involved|at\s+fault)|blame\s+(?:lies\s+)?(?:on|with)\s+(?:the\s+)?(?:system|algorithm|automation)|(?:system|algorithm|platform|automation)\s+absorbs?\s+(?:the\s+)?blame|just\s+(?:following|following)\s+(?:the\s+)?(?:automated\s+)?(?:process|system|algorithm|its\s+output)/i;

const t5 = t => T5_ZH.test(t) || T5_ZH_EXEC.test(t) || T5_ZH_NULLIFY.test(t) || T5_EN.test(t);

let aHit = 0, bHit = 0;
for (const t of attacks) {
  const hit = t5(t);
  if (hit) aHit++;
  console.log('ATT', hit ? 'HIT ' : 'miss', t.slice(0, 32));
}
for (const t of benign) {
  const hit = t5(t);
  if (hit) bHit++;
  console.log('BEN', hit ? 'FALSE-POS' : 'clean', t.slice(0, 32));
}
console.log(`T5 候选 v2：攻击 ${aHit}/${attacks.length} 命中，良性误伤 ${bHit}/${benign.length}`);
