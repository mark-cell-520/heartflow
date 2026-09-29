// 第 218 轮探针 8：补判据再调 decision（三条都能量化，靠「影响面 × 可验证性」区分）
const path = require('path');
const { HeartFlowDecision } = require(path.join(process.cwd(), 'src/core/decision.js'));
(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] decisionRouter.evaluate 恒崩 activeRules is not defined — 实测 blast radius：2 次 think() 触发 2 次抛错、0 次成功；CED 分支从未进入（_lastCedStrategy 恒 null），domain filtering(v6.7.70) 与 CED complexity routing(v6.7.72) 两套能力 0 次执行；既有测试只测 doesNotThrow+空转，0 断言覆盖规则匹配；修法一行 const、改动 3 行内',
    '[B] self-verifier.verify 恒崩 reasoning.toLowerCase is not a function — 实测 blast radius：2 次 think() 2 次抛错、0 次成功，result._selfVerification 字段永不落地，v7.x 自验证能力 100% 失效；测试 0 文件覆盖该路径；修法入口归一化 reasoning/conclusion 为字符串，改动约 5 行',
    '[C] reflection-loop 产出无消费者（217 轮遗留 2）— 实测闭环已跑（closed=true, effectiveness=neutral, adjustment=继续观察）但下游 0 读取；修法需先定义「effectiveness=negative 时下游该做什么」语义，改动约 20 行且涉及 gate 决策链，回归面比 A/B 大',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向（按影响面×可验证性排序）', prompt });
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, scores: (r.all_options || []).map(o => o.id + '=' + o.composite), reasoning: r.reasoning }));
})().catch(e => console.log('ERR:' + e.message));
