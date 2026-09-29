// 第 222 轮方向选择（decision 模块真实调用，不脑内模拟）
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 判定 field- 六条规则（翻转预警族）外部输入不可驱动：读 src/core/decision-router.js 的 _updateFieldTracking，判定是真实语义还是设计缺陷；若为缺陷则允许调用方主动提供场域信号，并补测试断言',
    '[B] 纯测试加固：给 14 条无引擎层断言的 decision-router 规则补断言，零引擎改动，误拦基线必然不变',
    '[C] 提升 _selfVerificationIssues 的消费层级：目前只到 verify 级，评估是否应触发强动作'
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
