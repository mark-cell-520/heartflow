// r630: 用 decision 本体从实测候选中选一个方向（候选全部来自本轮探针实测，无脑内假设）。
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '[A] 第 81 维度候选族「偏好应用滥用」：preferenceGuard 偏好谨慎应用引擎（10 方法全部完整零抛，实测 safety_override 能拦住越界偏好、detectConflict 能检出冲突偏好，正常 always 偏好正确放行、contextual 无直接引用正确拒绝）。当前 dispatch 4/4 全 not allowed、_modules 无键、pipeline 零消费。属 rewrite 级。',
  '[B] 「输出清单门禁」：outputChecklist（11 方法，think() L5117 输入侧与 think-pipeline L324 输出侧已有直连调用并产生 consumer 字段）。当前 dispatch 11/11 全 not allowed、_modules 无键。',
  '[C] 「假设驱动声明标记」：hypothesisDriver（5 方法：extractClaims/assessConfidence/markUnverified/formatAnnotations/healthCheck，verification-engine 有旁路调用）。当前 dispatch 5/5 全 not allowed、_modules 无键。',
  '[D] 「判断生长」：ruleGrowth（7 方法：observe/evaluate/toDecisionRouterRules/getStats 等，构造时已把 learned 规则注入 decisionRouter）。当前 dispatch 7/7 全 not allowed、_modules 无键。',
  '[E] 探测器候选池本轮为空（bash heartflow-upgrade-scout.sh 实测输出「未探测到新的零覆盖族」），故不自选攻击族方向。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const out = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log('RESULT' + JSON.stringify(out));
  process.exit(0);
})();
