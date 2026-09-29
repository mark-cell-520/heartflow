// 第 218 轮探针 6：用 decision 引擎真调，裁决本轮方向
const path = require('path');
const { HeartFlowDecision } = require(path.join(process.cwd(), 'src/core/decision.js'));
(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] decisionRouter.evaluate 恒崩 activeRules is not defined（探针实测：3/3 输入全抛，CED 分支从未进入，_lastCedStrategy 恒 null，domain filtering + CED complexity routing 两套 v6.7.70/v6.7.72 新能力完全不生效；think() 链路探针计数 evaluateCalls=1 evaluateErrors=1。修法=一行 const activeRules 定义，风险低）',
    '[B] self-verifier 恒崩 reasoning.toLowerCase is not a function（探针实测：heartflow.js:4842 把 result.chain 对象当 reasoning 传入，2 次调用 2 次抛，_selfVerification 字段永不落地，v7.x 自验证能力完全失效；修法=入口归一化 reasoning/conclusion 为字符串）',
    '[C] reflection-loop 产出无消费者（217 轮遗留 2：_reflectionLoopClosed 只落字段、无人读取，effectiveness=negative 时无任何下游动作；修法=接线到 gate/改写链路，需先定语义边界，风险中）',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r));
})().catch(e => console.log('ERR:' + e.message));
