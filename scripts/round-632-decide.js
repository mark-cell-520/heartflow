// r632: 用 decision 本体从实测候选中选一个方向。
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '[A] boundaryNeg（boundary-negotiation.js，19 方法）接线进 dispatch。双向核对实测（scripts/round-632-bn-method-diag.js）：dispatch(boundaryNeg.*) 19/19 全抛 route not allowed、_modules 无键、hf.routes() 零命中；pipeline 侧 pipeRefs=0（think-pipeline/think 主链路零引用）。上一轮 r631 刚给它补了整族新判别能力 detectHighIntent（凭据窃取/数据外发/绕过验证/毁灭痕迹/伪造身份/提权滥用 6 家族），但复测（scripts/round-632-bn-gap-probe.js）显示该能力命中 8/12 攻击、0/12 良性 —— 且 detectHighIntent 在全 src/ 内除自身模块外零调用方，即 r631 新增的辨别能力目前同样零可达。',
  '[B] hypothesisDriver（hypothesis-tester.js，5 方法 extractClaims/assessConfidence/markUnverified/formatAnnotations/healthCheck）接线进 dispatch。实测 dispatch 5/5 全 not allowed、_modules 无键；MCP 已有 heartflow_hypothesis 包装层但走自己实例；think-pipeline.js L162-173 有 1 处旁路调用 generate()。',
  '[C] outputChecklist（output-checklist.js，11 方法 runChecklist/quickCheck/getStats 等）新增 MCP 工具。实测 dispatch 11/11 全 not allowed、mcp=no；think() 主链路 L5134 已有输入侧 runChecklist 直连调用，但 dispatch/MCP 双不可达。',
  '[D] fieldInjector（field-injector.js，4 方法 inject/extractSignals/computeConfidence/batchInject）接线进 dispatch。实测 dispatch 4/4 全 not allowed、pipeRefs=0、mcp=no；它是 decision-router 消费的 _field* 字段生产方，接线前该字段族无生产路径。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const out = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log('RESULT' + JSON.stringify(out));
  process.exit(0);
})();
