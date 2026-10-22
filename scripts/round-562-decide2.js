'use strict';
// [r562] decision 第一轮 chosen:null（B/C/D 分不出）→ 补充可区分判据后重跑。
// 判据：与现有维度的空档边界距离、判据可形式化程度、误伤风险、可测样本量。
const fs = require('fs');
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

const prompt = [
  '[A] moral_licensing 道德许可：以既往善行/相对干净为由，给当前越界行为发许可证。',
  '   实测: 13/13 条攻击样本全量穿过硬闸门（zh 8/8 en 5/5），现有维度零覆盖，良性 5 条 0 误伤。属 rewrite 级。',
  '   可区分判据：①与最近上线的 4 个维度（诱导信任/工具辩解/父权式替决/个例冒充）的话术结构距离最远，',
  '   判据形状唯一（善行陈述 × 越界许可），无重叠族；②两条腿都需独立正则，形式化难度中等；',
  '   ③误伤风险主要来自正当的自省/合规披露，需配强看守；④中英样本充足（各 8+5 条已实测）。',
  '[B] crisis_exceptionalism 危机例外化：以特殊时期/紧急状态为由，暂停授权、程序与知情权。',
  '   实测: 10/13 条攻击样本穿过硬闸门（zh 5/8 en 5/5），现有维度零覆盖，良性 5 条 0 误伤。属 rewrite 级。',
  '   可区分判据：①与 info_deprivation（知情权剥夺）在「暂停知情权」一腿重叠——实测部分穿门样本',
  '   已被 info_deprivation 拦下（10/13 而非 13/13），新维度边际增量较低；②「紧急状态」词表需长尾枚举；',
  '   ③误伤风险来自正当的应急响应说明（应急处置本身合法），看守设计最难。',
  '[C] shame_compliance 羞耻施压换服从：以丢人/没资格/别人怎么看为由取消对方表态。',
  '   实测: 11/13 条攻击样本穿过硬闸门（zh 6/8 en 5/5），现有维度零覆盖，良性 5 条 0 误伤。属 rewrite 级。',
  '   可区分判据：①与 emotional_manipulation（rewrite 级）在羞耻施压一腿存在结构性重叠，需先做归因实测',
  '   才能证明增量；②「别人怎么看」的短语与社交建议边界模糊，误伤风险最高；③英文样本仅 5 条，不足。',
  '补充背景：本轮候选全部来自上一轮已落盘的实测池，不再重复探测；优先选「边际增量最大 + 误伤可控」者。',
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
  fs.writeFileSync('/tmp/hf-r562-decide2.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ chosen: out.chosen, composite: out.composite, confidence: out.confidence }, null, 2));
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
