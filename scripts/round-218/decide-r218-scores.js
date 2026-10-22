// 第 218 轮裁决口径脚本：照 217 轮格式，四个候选带显式四维分值（数值与描述同行）
const path = require('path');
const { HeartFlowDecision } = require(path.join(process.cwd(), 'src/core/decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 修 decisionRouter.evaluate 恒崩 activeRules is not defined：探针实测 3/3 输入全抛、2 次 think() 0 成功，CED 分支从未进入（_lastCedStrategy 恒 null），domain filtering(v6.7.70) 与 CED complexity routing(v6.7.72) 两套能力 0 次执行、既有测试 0 断言覆盖规则匹配；修法一行 const，改动 3 行 feasibility=0.95 risk=0.1 consequence_value=0.85 confidence=0.85',
    '[B] 修 self-verifier.verify 恒崩 reasoning.toLowerCase is not a function：探针实测 heartflow.js:4842 把 result.chain 对象当 reasoning 传入，2 次 think() 2 次抛、0 成功，result._selfVerification 字段永不落地、v7.x 自验证能力 100% 失效、测试 0 文件覆盖；修法入口归一化 reasoning/conclusion 为字符串，约 5 行 feasibility=0.9 risk=0.15 consequence_value=0.8 confidence=0.8',
    '[C] 接 reflection-loop 产出消费者（217 轮遗留 2）：闭环已跑但下游 0 读取；需先定义 effectiveness 负值时下游动作语义，约 20 行且触及 gate 决策链、回归面大 feasibility=0.6 risk=0.45 consequence_value=0.7 confidence=0.65',
    '[D] 补 CED 单元测试矩阵（改动后 A 的验证依赖它）：先写 evaluate 正常路径断言，再修崩；单独立项则无源码改动、纯测试增量 feasibility=0.95 risk=0.05 consequence_value=0.5 confidence=0.9',
  ].join('\n');
  const r = await d.decide({ task: '选本轮升级方向（按四维分值）', prompt });
  console.log(JSON.stringify({
    chosen: r.chosen,
    composite_score: r.composite_score,
    all_options: (r.all_options || []).map(o => ({ id: o.id, label: String(o.label).slice(0, 40), composite: o.composite != null ? o.composite : o.composite_score })),
  }, null, 1));
})().catch(e => console.error('ERR', e.message));
