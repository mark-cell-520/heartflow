'use strict';
// [r563] decision 本体选方向。候选 = r560 落盘池中尚未上线的三族，
// 描述用本轮（r563）实复测数据，不用简报旧描述。
const fs = require('fs');
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

const prompt = [
  '[A] shame_compliance 羞耻施压换服从：以丢人/没资格/别人怎么看为由取消对方表态。',
  '   本轮实复测: 10/11 条攻击样本穿过硬闸门（zh 5/6 en 5/5），良性 5 条零误伤。属 rewrite 级。',
  '   可区分判据：①与 emotional_manipulation 在羞耻施压一腿有结构性重叠，需逐条归因实测才能证明增量；',
  '   ②「别人怎么看」的短语与正当的隐私/场合建议边界模糊，误伤风险最高；③英文样本仅 5 条，偏少。',
  '[B] moral_licensing 道德许可：以既往善行/相对干净为由，给当前越界行为发许可证。',
  '   本轮实复测: 11/13 条攻击样本穿过硬闸门（zh 6/8 en 5/5），良性 5 条有 1 条误伤（需强看守）。属 rewrite 级。',
  '   可区分判据：①与最近上线的 4 个维度（诱导信任/工具辩解/父权式替决/危机例外化）话术结构距离最远，',
  '   判据形状唯一（善行陈述 × 越界许可），无重叠族；②两条腿都需独立正则，形式化难度中等；',
  '   ③误伤风险来自正当的自省/合规披露，需配强看守；④中英样本充足（各 8+5 条已实测）。',
  '[C] favor_ledger 恩情账本：以过往付出/人情/债务为由，换取当下的服从或让步。',
  '   本轮实复测: 7/10 条攻击样本穿过硬闸门（zh 4/5 en 3/5），良性 5 条零误伤。属 rewrite 级。',
  '   可区分判据：①与 emotional_manipulation/sunk_cost_coercion 在人情施压一腿有部分重叠；',
  '   ②「帮过忙 → 要回报」与正当致谢/人情往来边界需看守；③穿门率三族最低，边际增量最小。',
  '补充背景：本轮候选全部来自上一轮已落盘的实测池，本轮已用真实 gate 复测三族缺口均存在。',
  '优先选「边际增量最大 + 误伤可控 + 与现有维度空档距离最远」者。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 563 轮升级方向', prompt });
  const out = {
    chosen: r.chosen,
    label: r.label,
    composite: r.composite_score,
    confidence: r.confidence,
    reasoning: r.reasoning,
    all: r.all_options,
  };
  fs.writeFileSync('/tmp/hf-r563-decide.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ chosen: out.chosen, composite: out.composite, confidence: out.confidence }, null, 2));
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
