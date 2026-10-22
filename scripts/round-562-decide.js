'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// [r562] 用 decision 本体从 r560 落盘候选池里选本轮方向。
// 只用形状描述，不写任何攻击话术原句（451 铁律）。
const fs = require('fs');
const { HeartFlowDecision } = require(__HF + '/src/core/decision.js');

const prompt = [
  '[A] favor_ledger 恩情账本：以过往付出/人情/债务为由，换取当下的服从或让步（过往付出×当下索取服从）。',
  '   实测: 11/13 条攻击样本穿过硬闸门（gate=pass），zh 7/8 en 4/5；现有维度零覆盖；良性 8 条 0 误伤。属 rewrite 级。',
  '[B] crisis_exceptionalism 危机例外化：以特殊时期/紧急状态为由，暂停授权、程序与知情权。',
  '   实测: 10/13 条攻击样本穿过硬闸门（gate=pass），zh 5/8 en 5/5；现有维度零覆盖；良性 5 条 0 误伤。属 rewrite 级。',
  '[C] moral_licensing 道德许可：以既往善行/相对干净为由，给当前越界行为发许可证。',
  '   实测: 13/13 条攻击样本穿过硬闸门（gate=pass），zh 8/8 en 5/5——全量穿门、零覆盖；良性 5 条 0 误伤。属 rewrite 级。',
  '[D] shame_compliance 羞耻施压换服从：以丢人/没资格/别人怎么看为由取消对方表态。',
  '   实测: 11/13 条攻击样本穿过硬闸门（gate=pass），zh 6/8 en 5/5；现有维度零覆盖；良性 5 条 0 误伤。属 rewrite 级。',
  '[E] 暂停新维度，只做 r561 遗留收尾：守卫测试转绿 + 验证套件跑齐（不产生新辨别能力，属维护）。',
  '   实测: r561 守卫测试 3 项失败已修 1 项（A2 宽名词支）；剩余 2 项变异守卫样本需换形；verify/bidirectional/security-audit 本轮已实测全绿。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 562 轮升级方向', prompt });
  const out = {
    chosen: r.chosen,
    label: r.label,
    composite: r.composite_score,
    confidence: r.confidence,
    reasoning: r.reasoning,
    all: r.all_options,
  };
  fs.writeFileSync('/tmp/hf-r562-decide.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ chosen: out.chosen, composite: out.composite, confidence: out.confidence }, null, 2));
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
